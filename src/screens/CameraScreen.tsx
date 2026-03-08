import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, CameraSessionState } from '../types';
import { useAuth } from '../context/AuthContext';
import Colors from '../constants/colors';
import { APP_CONFIG, generateMockScores, getRandomEncouragement } from '../constants/config';
import {
  checkCameraPermission,
  requestCameraPermission,
  openAppSettings,
  formatTime,
} from '../utils/camera';
import {
  startSessionApi,
  endSessionApi,
  cancelSessionApi,
  analyzeFrameApi,
  PoseAnalysisResult,
  PoseAnalysisCorrection,
} from '../services/api';
import PoseSkeleton, { BODY_LANDMARK_INDICES } from '../components/PoseSkeleton';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const FRAME_INTERVAL_MS = 200;   // ~5 FPS — safe for takePictureAsync
const SCORE_SMOOTH_ALPHA = 0.3;  // EMA: 30% new frame, 70% history
const VISIBILITY_THRESHOLD = 0.5;
const CONFIDENCE_THRESHOLD = 0.65;

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

// ---------------------------------------------------------------------------
const CameraScreen: React.FC<Props> = ({ navigation, route }) => {
  const { poseId, poseName = 'Yoga Pose' } = route.params ?? {};
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // ── Permission ────────────────────────────────────────────────────────────
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  // ── Camera ────────────────────────────────────────────────────────────────
  const [cameraType, setCameraType] = useState<CameraType>('front');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // ── Session ───────────────────────────────────────────────────────────────
  const [sessionState, setSessionState] = useState<CameraSessionState>({
    isActive: false,
    startTime: null,
    elapsedSeconds: 0,
    currentScore: 0,
    poseDetected: false,
    sessionId: null,
  });
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isEndingSession, setIsEndingSession]   = useState(false);

  // ── Pose analysis ─────────────────────────────────────────────────────────
  const [poseAnalysis, setPoseAnalysis] = useState<PoseAnalysisResult | null>(null);
  const [displayScore, setDisplayScore] = useState(0);  // EMA-smoothed score for UI
  const [isBodyVisible, setIsBodyVisible] = useState(true);
  const isAnalyzingRef   = useRef(false);
  const frameLoopRef     = useRef<NodeJS.Timeout | null>(null);
  const smoothedScoreRef = useRef(0);

  // ── UI extras ─────────────────────────────────────────────────────────────
  const [encouragement, setEncouragement] = useState(getRandomEncouragement());
  const timerRef        = useRef<NodeJS.Timeout | null>(null);
  const encouragementRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityBannerAnim = useRef(new Animated.Value(0)).current;

  // ── Accumulated session stats (sent when session ends) ───────────────────
  const sessionScoresRef     = useRef<number[]>([]);
  const sessionCorrectionsRef = useRef<PoseAnalysisCorrection[]>([]);

  // =========================================================================
  // Permission check on mount
  // =========================================================================
  useEffect(() => {
    (async () => {
      setIsCheckingPermission(true);
      const status = await checkCameraPermission();
      setPermissionStatus(status);
      setIsCheckingPermission(false);
    })();
  }, []);

  // =========================================================================
  // Session timer + encouragement rotation
  // =========================================================================
  useEffect(() => {
    if (sessionState.isActive) {
      timerRef.current = setInterval(() => {
        setSessionState(prev => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
      }, 1000);
      encouragementRef.current = setInterval(() => {
        setEncouragement(getRandomEncouragement());
      }, 10000);
    } else {
      if (timerRef.current)        clearInterval(timerRef.current);
      if (encouragementRef.current) clearInterval(encouragementRef.current);
    }
    return () => {
      if (timerRef.current)        clearInterval(timerRef.current);
      if (encouragementRef.current) clearInterval(encouragementRef.current);
    };
  }, [sessionState.isActive]);

  // =========================================================================
  // Frame capture loop — starts/stops with session
  // =========================================================================
  useEffect(() => {
    if (sessionState.isActive && sessionState.sessionId) {
      sessionScoresRef.current     = [];
      sessionCorrectionsRef.current = [];
      startFrameLoop(sessionState.sessionId);
    } else {
      stopFrameLoop();
    }
    return () => stopFrameLoop();
  }, [sessionState.isActive, sessionState.sessionId]);

  // =========================================================================
  // Full-body visibility banner animation
  // =========================================================================
  useEffect(() => {
    Animated.timing(visibilityBannerAnim, {
      toValue: isBodyVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isBodyVisible]);

  // =========================================================================
  // Core: frame capture → API → update UI
  // =========================================================================
  const startFrameLoop = useCallback((sid: string) => {
    if (frameLoopRef.current) clearInterval(frameLoopRef.current);

    frameLoopRef.current = setInterval(async () => {
      if (isAnalyzingRef.current) return;   // skip if previous call pending
      if (!cameraRef.current) return;

      isAnalyzingRef.current = true;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.35,          // lower quality → faster upload
          base64: true,
          skipProcessing: true,   // skips extra processing on mobile
        });

        if (!photo?.base64) return;

        const response = await analyzeFrameApi(photo.base64, sid);

        if (!response.success || !response.data) return;

        const data = response.data;

        // ── Visibility check ──────────────────────────────────────────────
        const bodyVisible = data.full_body_visible ?? checkLocalVisibility(data.keypoints);
        setIsBodyVisible(bodyVisible);

        // ── Score smoothing (EMA) ──────────────────────────────────────────
        if (data.pose_detected && data.confidence >= CONFIDENCE_THRESHOLD) {
          const newScore = data.score;
          smoothedScoreRef.current =
            SCORE_SMOOTH_ALPHA * newScore +
            (1 - SCORE_SMOOTH_ALPHA) * smoothedScoreRef.current;

          setDisplayScore(Math.round(smoothedScoreRef.current));

          // Accumulate for session summary
          sessionScoresRef.current.push(newScore);
          if (data.corrections?.length) {
            sessionCorrectionsRef.current.push(...data.corrections);
          }
        }

        // ── Update pose analysis state ─────────────────────────────────────
        setPoseAnalysis(data);
        setSessionState(prev => ({
          ...prev,
          poseDetected: data.pose_detected,
          currentScore: Math.round(smoothedScoreRef.current),
        }));
      } catch (err) {
        // Non-fatal — just log and continue
        if (__DEV__) console.log('[CameraScreen] frame analysis error:', err);
      } finally {
        isAnalyzingRef.current = false;
      }
    }, FRAME_INTERVAL_MS);
  }, []);

  const stopFrameLoop = useCallback(() => {
    if (frameLoopRef.current) {
      clearInterval(frameLoopRef.current);
      frameLoopRef.current = null;
    }
    isAnalyzingRef.current = false;
  }, []);

  // =========================================================================
  // Auth guard: loading gate — never redirect until auth is fully resolved
  // =========================================================================
  useFocusEffect(
    useCallback(() => {
      if (isAuthLoading) return; // Auth still resolving — hold
      if (!isAuthenticated) {
        // Token expired or cleared (e.g. 401 mid-session) — clean up then exit
        stopFrameLoop();
      }
    }, [isAuthLoading, isAuthenticated, stopFrameLoop])
  );

  // =========================================================================
  // Helpers
  // =========================================================================
  const checkLocalVisibility = (
    keypoints: Array<{ x: number; y: number; visibility: number }> | undefined
  ): boolean => {
    if (!keypoints || keypoints.length < 33) return false;
    return BODY_LANDMARK_INDICES.every(i => (keypoints[i]?.visibility ?? 0) >= VISIBILITY_THRESHOLD);
  };

  const getAverageSessionScore = (): number => {
    const scores = sessionScoresRef.current;
    if (!scores.length) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.error;
  };

  // =========================================================================
  // Permission handlers
  // =========================================================================
  const handleRequestPermission = async () => {
    const status = await requestCameraPermission();
    setPermissionStatus(status);
  };

  const toggleCameraFacing = useCallback(() => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  }, []);

  // =========================================================================
  // Session management
  // =========================================================================
  const startSession = async () => {
    if (!poseId) {
      Alert.alert('Error', 'No pose selected');
      return;
    }
    setIsStartingSession(true);
    try {
      const response = await startSessionApi(poseId);
      if (response.success && response.data) {
        smoothedScoreRef.current = 0;
        setDisplayScore(0);
        setPoseAnalysis(null);
        setIsBodyVisible(true);
        setSessionState({
          isActive: true,
          startTime: Date.now(),
          elapsedSeconds: 0,
          currentScore: 0,
          poseDetected: false,
          sessionId: response.data.id,
        });
        setEncouragement(getRandomEncouragement());
      } else {
        Alert.alert('Error', response.error || 'Failed to start session');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start session');
    } finally {
      setIsStartingSession(false);
    }
  };

  const endSession = async () => {
    if (!sessionState.sessionId) {
      navigation.goBack();
      return;
    }
    if (sessionState.elapsedSeconds < APP_CONFIG.MIN_SESSION_DURATION_SECONDS) {
      Alert.alert(
        'Session Too Short',
        `Please practice for at least ${APP_CONFIG.MIN_SESSION_DURATION_SECONDS} seconds.`,
        [{ text: 'OK' }]
      );
      return;
    }

    stopFrameLoop();
    setIsEndingSession(true);

    try {
      const avgScore = getAverageSessionScore();

      // Build mistakes from accumulated corrections
      const mistakeCounts: Record<string, { correction: PoseAnalysisCorrection; count: number }> = {};
      sessionCorrectionsRef.current.forEach(c => {
        if (!mistakeCounts[c.joint]) {
          mistakeCounts[c.joint] = { correction: c, count: 0 };
        }
        mistakeCounts[c.joint].count++;
      });
      const mistakes = Object.values(mistakeCounts).map(({ correction, count }) => ({
        joint: correction.joint,
        mistakeType: correction.severity,
        description: correction.instruction,
        correction: correction.instruction,
        severity: correction.severity === 'major'
          ? 'HIGH'
          : correction.severity === 'moderate'
          ? 'MEDIUM'
          : 'LOW',
        durationSeconds: Math.round(
          (count / Math.max(sessionScoresRef.current.length, 1)) * sessionState.elapsedSeconds
        ),
      }));

      // Fall back to mock scores if real detection produced nothing
      const scores = avgScore > 0
        ? { overallScore: avgScore, stabilityScore: avgScore, alignmentScore: avgScore }
        : APP_CONFIG.USE_MOCK_SCORES
        ? generateMockScores()
        : { overallScore: 0, stabilityScore: 0, alignmentScore: 0 };

      const response = await endSessionApi({
        sessionId: sessionState.sessionId,
        durationSeconds: sessionState.elapsedSeconds,
        overallScore: scores.overallScore,
        stabilityScore: scores.stabilityScore,
        alignmentScore: scores.alignmentScore,
        mistakes,
      });

      setSessionState(prev => ({ ...prev, isActive: false }));

      if (response.success) {
        navigation.replace('SessionComplete', {
          sessionId: sessionState.sessionId,
          poseName,
          duration: sessionState.elapsedSeconds,
          overallScore: scores.overallScore,
          stabilityScore: scores.stabilityScore,
          alignmentScore: scores.alignmentScore,
        });
      } else {
        Alert.alert('Error', response.error || 'Failed to save session');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to end session');
      navigation.goBack();
    } finally {
      setIsEndingSession(false);
    }
  };

  const cancelSession = async () => {
    stopFrameLoop();
    if (sessionState.sessionId) {
      try {
        await cancelSessionApi(sessionState.sessionId);
      } catch {
        // Ignore cancel errors
      }
    }
    setSessionState(prev => ({ ...prev, isActive: false, sessionId: null }));
    navigation.goBack();
  };

  const handleGoBack = () => {
    if (sessionState.isActive) {
      Alert.alert(
        'End Session?',
        'Are you sure you want to end your current session?',
        [
          { text: 'Continue', style: 'cancel' },
          { text: 'End & Save', onPress: endSession },
          { text: 'Cancel Session', style: 'destructive', onPress: cancelSession },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // =========================================================================
  // Render: permission states
  // =========================================================================
  // Auth loading gate: hold rendering until auth state is fully resolved
  if (isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isCheckingPermission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={80} color={Colors.textMuted} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Yogifi AI needs camera access to guide your yoga practice. Please enable camera access in your device settings.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={openAppSettings}>
          <Text style={styles.permissionButtonText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (permissionStatus === 'undetermined') {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="videocam-outline" size={80} color={Colors.primary} />
        <Text style={styles.permissionTitle}>Enable Camera Access</Text>
        <Text style={styles.permissionText}>
          To guide your yoga practice, we need access to your camera. Your privacy is important — video is processed on-device only.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermission}>
          <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // =========================================================================
  // Main camera view
  // =========================================================================
  const corrections = poseAnalysis?.corrections ?? [];
  const poseDetected = poseAnalysis?.pose_detected ?? false;
  const confidence = poseAnalysis?.confidence ?? 0;
  const scoreColor = getScoreColor(displayScore);

  return (
    <View style={styles.container}>
      {/* Full-screen camera */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        onCameraReady={() => setIsCameraReady(true)}
        onMountError={(err: any) => console.error('Camera error:', err)}
      />

      {/* BlazePose skeleton overlay */}
      {APP_CONFIG.ENABLE_SKELETON_OVERLAY && poseAnalysis?.keypoints && poseAnalysis.keypoints.length === 33 && (
        <PoseSkeleton
          keypoints={poseAnalysis.keypoints}
          corrections={corrections}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
        />
      )}

      {/* Full-body visibility warning */}
      <Animated.View
        style={[styles.visibilityBanner, { opacity: visibilityBannerAnim }]}
        pointerEvents="none"
      >
        <Ionicons name="person-outline" size={18} color="#000" />
        <Text style={styles.visibilityBannerText}>Step back — full body not visible</Text>
      </Animated.View>

      {/* Main overlay UI */}
      <View style={styles.overlay} pointerEvents="box-none">

        {/* ── TOP BAR ─────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.circleButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Pose name + detection indicator */}
          <View style={styles.poseNameContainer}>
            {poseDetected && confidence >= CONFIDENCE_THRESHOLD && (
              <View style={[styles.detectionDot, { backgroundColor: Colors.success }]} />
            )}
            <Text style={styles.poseNameText}>{poseName}</Text>
          </View>

          <TouchableOpacity style={styles.circleButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ── SCORE GAUGE (visible when session active + pose detected) ─ */}
        {sessionState.isActive && poseDetected && confidence >= CONFIDENCE_THRESHOLD && (
          <View style={styles.scoreRow} pointerEvents="none">
            <View style={[styles.scoreGauge, { borderColor: scoreColor }]}>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>{displayScore}</Text>
              <Text style={styles.scoreLabel}>score</Text>
            </View>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>{Math.round(confidence * 100)}% conf.</Text>
            </View>
          </View>
        )}

        {/* ── CENTER: timer + encouragement ────────────────────────────── */}
        {sessionState.isActive && (
          <View style={styles.centerContent} pointerEvents="none">
            <View style={styles.timerBox}>
              <Text style={styles.timerLabel}>Duration</Text>
              <Text style={styles.timerValue}>{formatTime(sessionState.elapsedSeconds)}</Text>
            </View>

            {(!poseDetected || confidence < CONFIDENCE_THRESHOLD) && (
              <View style={styles.encouragementBox}>
                <Ionicons name="sparkles" size={20} color={Colors.primary} />
                <Text style={styles.encouragementText}>{encouragement}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── BOTTOM: corrections + start/end button ───────────────────── */}
        <View style={styles.bottomPanel}>
          {/* Real-time corrections (top 3) */}
          {sessionState.isActive && corrections.length > 0 && (
            <View style={styles.correctionsContainer}>
              {corrections.slice(0, 3).map((c, i) => (
                <View key={`correction-${i}`} style={styles.correctionRow}>
                  <Text style={styles.correctionIcon}>
                    {c.severity === 'major' ? '🔴' : c.severity === 'moderate' ? '🟠' : '🟡'}
                  </Text>
                  <Text style={styles.correctionText} numberOfLines={2}>
                    {c.instruction}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Status indicator */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot,
              sessionState.isActive ? styles.statusActive : styles.statusInactive]} />
            <Text style={styles.statusText}>
              {sessionState.isActive
                ? poseDetected && confidence >= CONFIDENCE_THRESHOLD
                  ? `${poseAnalysis?.pose_name?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) ?? 'Pose detected'}`
                  : 'Session in progress'
                : 'Ready to start'}
            </Text>
          </View>

          {/* Start / End button */}
          {sessionState.isActive ? (
            <TouchableOpacity
              style={styles.endButton}
              onPress={endSession}
              disabled={isEndingSession}
            >
              {isEndingSession ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="stop-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.endButtonText}>End Session</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.startButton, !isCameraReady && styles.buttonDisabled]}
              onPress={startSession}
              disabled={!isCameraReady || isStartingSession}
            >
              {isStartingSession ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="play-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.startButtonText}>
                    {isCameraReady ? 'Start Session' : 'Loading...'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },

  // ── Permission screens ──────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
  },

  // ── Visibility banner ───────────────────────────────────────────────────
  visibilityBanner: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    zIndex: 10,
  },
  visibilityBannerText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Top bar ─────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  poseNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    gap: 8,
  },
  detectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  poseNameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // ── Score gauge ─────────────────────────────────────────────────────────
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
  },
  scoreGauge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  confidenceText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },

  // ── Center (timer / encouragement) ─────────────────────────────────────
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  timerLabel: {
    color: Colors.textLight,
    fontSize: 14,
    marginBottom: 4,
  },
  timerValue: {
    color: '#FFFFFF',
    fontSize: 56,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  encouragementBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  encouragementText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },

  // ── Bottom panel ────────────────────────────────────────────────────────
  bottomPanel: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    paddingTop: 12,
  },
  correctionsContainer: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  correctionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  correctionIcon: {
    fontSize: 16,
    lineHeight: 22,
  },
  correctionText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: Colors.success,
  },
  statusInactive: {
    backgroundColor: Colors.textMuted,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  endButton: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary,
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 10,
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default CameraScreen;
