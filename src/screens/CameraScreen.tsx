import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, CameraSessionState, Keypoint } from '../types';
import { cameraStyles as styles } from '../styles/camera';
import Colors from '../constants/colors';
import {
  checkCameraPermission,
  requestCameraPermission,
  openAppSettings,
  formatTime,
  FPSCounter,
} from '../utils/camera';
import { startSessionApi, endSessionApi, cancelSessionApi } from '../services/api';
import { evaluatePose, PoseEvaluation, resetHoldState } from '../services/poseRules';
import { detectPose, resetDetector, isMockDetection } from '../services/poseDetector';
import {
  announcePhase,
  announceSessionStart,
  announceSessionEnd,
  announceJointCorrection,
  announceHoldProgress,
  setVoiceEnabled,
  resetVoiceGuidance,
} from '../services/voiceGuidance';
import SkeletonOverlay from '../components/SkeletonOverlay';
import PoseFeedbackOverlay from '../components/PoseFeedbackOverlay';
import PoseDebugOverlay from '../components/PoseDebugOverlay';
import ReferencePoseOverlay from '../components/ReferencePoseOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CameraScreen: React.FC<Props> = ({ navigation, route }) => {
  const { poseId, poseName = 'Yoga Pose' } = route.params ?? {};

  // Permission state
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  // Camera state
  const [cameraType, setCameraType] = useState<CameraType>('front');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Session state
  const [sessionState, setSessionState] = useState<CameraSessionState>({
    isActive: false,
    startTime: null,
    elapsedSeconds: 0,
    currentScore: 0,
    poseDetected: false,
    sessionId: null,
  });

  // Pose detection state
  const [keypoints, setKeypoints] = useState<Keypoint[]>([]);
  const [poseEvaluation, setPoseEvaluation] = useState<PoseEvaluation | null>(null);
  const previousKeypointsRef = useRef<Keypoint[]>([]);

  // Debug mode (toggle in dev)
  const [showDebug, setShowDebug] = useState(__DEV__);

  // Reference pose overlay
  const [showReference, setShowReference] = useState(false);

  // Voice guidance
  const [voiceEnabled, setVoiceEnabledState] = useState(true);
  const lastPhaseRef = useRef<string | null>(null);
  const lastAnnouncedHoldProgressRef = useRef<number>(0);

  // Loading states
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);

  // FPS counter for frame processing
  const fpsCounterRef = useRef(new FPSCounter());
  const [currentFPS, setCurrentFPS] = useState(0);
  const frameProcessingRef = useRef<NodeJS.Timeout | null>(null);

  // Timer interval ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Accumulated scores for calculating average
  const scoresRef = useRef<number[]>([]);
  const alignmentScoresRef = useRef<number[]>([]);
  const stabilityScoresRef = useRef<number[]>([]);

  // Check camera permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      setIsCheckingPermission(true);
      const status = await checkCameraPermission();
      setPermissionStatus(status);
      setIsCheckingPermission(false);
    };

    checkPermission();
  }, []);

  // Handle timer when session is active
  useEffect(() => {
    if (sessionState.isActive) {
      timerRef.current = setInterval(() => {
        setSessionState((prev) => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionState.isActive]);

  // Frame processing with pose evaluation
  useEffect(() => {
    if (sessionState.isActive && isCameraReady) {
      const targetInterval = 1000 / 15; // 15 FPS for pose evaluation

      const processFrame = async () => {
        const fps = fpsCounterRef.current.tick();
        setCurrentFPS(fps);

        // Detect pose using mock or real ML detector
        const poseData = await detectPose(poseName);

        if (poseData && poseData.keypoints.length > 0) {
          const detectedKeypoints = poseData.keypoints;
          setKeypoints(detectedKeypoints);

          // Evaluate pose (include debug info when debug mode is on)
          const evaluation = evaluatePose(
            detectedKeypoints,
            poseName,
            previousKeypointsRef.current,
            showDebug
          );
          setPoseEvaluation(evaluation);

          // Voice guidance: announce phase changes
          if (voiceEnabled && evaluation.phase !== lastPhaseRef.current) {
            lastPhaseRef.current = evaluation.phase;
            announcePhase(evaluation.phase);
          }

          // Voice guidance: announce hold progress milestones
          if (voiceEnabled && evaluation.phase === 'hold') {
            const progress = evaluation.holdProgress;
            const lastProgress = lastAnnouncedHoldProgressRef.current;
            if (
              (progress >= 25 && lastProgress < 25) ||
              (progress >= 50 && lastProgress < 50) ||
              (progress >= 75 && lastProgress < 75)
            ) {
              lastAnnouncedHoldProgressRef.current = progress;
              announceHoldProgress(progress);
            }
          }

          // Voice guidance: announce corrections for problematic joints
          if (voiceEnabled && evaluation.feedback.length > 0) {
            const errorFeedback = evaluation.feedback.find(fb => fb.severity === 'error');
            if (errorFeedback && errorFeedback.joint) {
              announceJointCorrection(errorFeedback.joint);
            }
          }

          // Store previous keypoints for stability calculation
          previousKeypointsRef.current = detectedKeypoints;

          // Accumulate scores
          scoresRef.current.push(evaluation.overallScore);
          alignmentScoresRef.current.push(evaluation.alignmentScore);
          stabilityScoresRef.current.push(evaluation.stabilityScore);

          // Update session state with current score
          setSessionState((prev) => ({
            ...prev,
            currentScore: evaluation.overallScore,
            poseDetected: evaluation.isCorrectPose,
          }));
        }
      };

      frameProcessingRef.current = setInterval(processFrame, targetInterval);
    } else {
      if (frameProcessingRef.current) {
        clearInterval(frameProcessingRef.current);
        frameProcessingRef.current = null;
      }
      fpsCounterRef.current.reset();
      resetDetector();
      resetHoldState();
      resetVoiceGuidance();
      lastPhaseRef.current = null;
      lastAnnouncedHoldProgressRef.current = 0;
      setCurrentFPS(0);
      setKeypoints([]);
      setPoseEvaluation(null);
    }

    return () => {
      if (frameProcessingRef.current) {
        clearInterval(frameProcessingRef.current);
      }
    };
  }, [sessionState.isActive, isCameraReady, poseName, showDebug]);

  // Request permission handler
  const handleRequestPermission = async () => {
    const status = await requestCameraPermission();
    setPermissionStatus(status);
  };

  // Toggle camera facing
  const toggleCameraFacing = useCallback(() => {
    setCameraType((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  // Toggle voice guidance
  const toggleVoice = useCallback(() => {
    const newState = !voiceEnabled;
    setVoiceEnabledState(newState);
    setVoiceEnabled(newState);
  }, [voiceEnabled]);

  // Handle camera ready
  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  // Handle camera error
  const handleCameraError = (error: any) => {
    console.error('Camera error:', error);
  };

  // Start session
  const startSession = async () => {
    if (!poseId) {
      Alert.alert('Error', 'No pose selected');
      return;
    }

    setIsStartingSession(true);

    try {
      const response = await startSessionApi(poseId);

      if (response.success && response.data) {
        // Reset score arrays
        scoresRef.current = [];
        alignmentScoresRef.current = [];
        stabilityScoresRef.current = [];
        previousKeypointsRef.current = [];
        lastPhaseRef.current = null;
        lastAnnouncedHoldProgressRef.current = 0;

        // Announce session start
        if (voiceEnabled) {
          announceSessionStart(poseName);
        }

        setSessionState({
          isActive: true,
          startTime: Date.now(),
          elapsedSeconds: 0,
          currentScore: 0,
          poseDetected: false,
          sessionId: response.data.id,
        });
      } else {
        Alert.alert('Error', response.error || 'Failed to start session');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start session');
    } finally {
      setIsStartingSession(false);
    }
  };

  // End session
  const endSession = async () => {
    if (!sessionState.sessionId) {
      navigation.goBack();
      return;
    }

    setIsEndingSession(true);

    try {
      // Calculate average scores from accumulated data
      const avgScore = scoresRef.current.length > 0
        ? Math.round(scoresRef.current.reduce((a, b) => a + b, 0) / scoresRef.current.length)
        : 0;
      const avgAlignment = alignmentScoresRef.current.length > 0
        ? Math.round(alignmentScoresRef.current.reduce((a, b) => a + b, 0) / alignmentScoresRef.current.length)
        : 0;
      const avgStability = stabilityScoresRef.current.length > 0
        ? Math.round(stabilityScoresRef.current.reduce((a, b) => a + b, 0) / stabilityScoresRef.current.length)
        : 0;

      const response = await endSessionApi({
        sessionId: sessionState.sessionId,
        durationSeconds: sessionState.elapsedSeconds,
        overallScore: avgScore,
        stabilityScore: avgStability,
        alignmentScore: avgAlignment,
      });

      setSessionState((prev) => ({
        ...prev,
        isActive: false,
      }));

      // Announce session end
      if (voiceEnabled) {
        announceSessionEnd(avgScore);
      }

      if (response.success) {
        navigation.replace('SessionComplete', {
          sessionId: sessionState.sessionId,
          poseName: poseName,
          duration: sessionState.elapsedSeconds,
          overallScore: avgScore,
          stabilityScore: avgStability,
          alignmentScore: avgAlignment,
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

  // Cancel session
  const cancelSession = async () => {
    if (sessionState.sessionId) {
      try {
        await cancelSessionApi(sessionState.sessionId);
      } catch (error) {
        console.log('Error canceling session:', error);
      }
    }

    setSessionState((prev) => ({
      ...prev,
      isActive: false,
      sessionId: null,
    }));

    navigation.goBack();
  };

  // Go back handler
  const handleGoBack = () => {
    if (sessionState.isActive) {
      Alert.alert(
        'End Session?',
        'Are you sure you want to end your current session?',
        [
          { text: 'Continue', style: 'cancel' },
          { text: 'End Session', style: 'destructive', onPress: endSession },
          { text: 'Cancel Session', style: 'destructive', onPress: cancelSession },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Get highlighted joints from feedback
  const getHighlightedJoints = (): string[] => {
    if (!poseEvaluation) return [];
    return poseEvaluation.feedback
      .filter(fb => fb.severity === 'warning' || fb.severity === 'error')
      .map(fb => fb.joint);
  };

  // Render loading state
  if (isCheckingPermission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }

  // Render permission denied view
  if (permissionStatus === 'denied') {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Yogifi AI needs camera access to detect and analyze your yoga poses in real-time. Please enable camera access in your device settings.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={openAppSettings}
        >
          <Text style={styles.permissionButtonText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.permissionSecondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionSecondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render permission request view
  if (permissionStatus === 'undetermined') {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>🎥</Text>
        <Text style={styles.permissionTitle}>Enable Camera Access</Text>
        <Text style={styles.permissionText}>
          To analyze your yoga poses in real-time, we need access to your camera. Your privacy is important to us - video is processed on-device only.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={handleRequestPermission}
        >
          <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.permissionSecondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionSecondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main camera view
  return (
    <View style={styles.container}>
      {/* Full screen camera */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        onCameraReady={handleCameraReady}
        onMountError={handleCameraError}
      />

      {/* Skeleton overlay */}
      {sessionState.isActive && keypoints.length > 0 && (
        <SkeletonOverlay
          keypoints={keypoints}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          mirrored={cameraType === 'front'}
          highlightedJoints={getHighlightedJoints()}
        />
      )}

      {/* Pose feedback overlay */}
      <PoseFeedbackOverlay
        evaluation={poseEvaluation}
        isSessionActive={sessionState.isActive}
      />

      {/* Debug overlay (dev mode) */}
      <PoseDebugOverlay
        debugInfo={poseEvaluation?.debugInfo}
        visible={showDebug && sessionState.isActive}
      />

      {/* Reference pose overlay */}
      <ReferencePoseOverlay
        poseName={poseName}
        visible={showReference && !sessionState.isActive}
        opacity={0.35}
      />

      {/* Overlay UI */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Top bar */}
        <View style={styles.topBar}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.circleButton}
            onPress={handleGoBack}
          >
            <Text style={styles.circleButtonText}>←</Text>
          </TouchableOpacity>

          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {formatTime(sessionState.elapsedSeconds)}
            </Text>
          </View>

          {/* Voice toggle button */}
          <TouchableOpacity
            style={[styles.circleButton, voiceEnabled && styles.circleButtonActive]}
            onPress={toggleVoice}
          >
            <Text style={styles.circleButtonText}>{voiceEnabled ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>

          {/* Reference pose toggle button */}
          {!sessionState.isActive && (
            <TouchableOpacity
              style={[styles.circleButton, showReference && styles.circleButtonActive]}
              onPress={() => setShowReference(!showReference)}
            >
              <Text style={styles.circleButtonText}>👤</Text>
            </TouchableOpacity>
          )}

          {/* Debug toggle button (dev only) */}
          {__DEV__ && (
            <TouchableOpacity
              style={[styles.circleButton, showDebug && styles.circleButtonActive]}
              onPress={() => setShowDebug(!showDebug)}
            >
              <Text style={styles.circleButtonText}>🐛</Text>
            </TouchableOpacity>
          )}

          {/* Flip camera button */}
          <TouchableOpacity
            style={styles.circleButton}
            onPress={toggleCameraFacing}
          >
            <Text style={styles.circleButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          {/* Session status indicator */}
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                sessionState.isActive
                  ? styles.statusDotActive
                  : styles.statusDotInactive,
              ]}
            />
            <Text style={styles.statusText}>
              {sessionState.isActive ? `Practicing ${poseName}` : 'Ready to start'}
            </Text>
          </View>

          {/* Start/End session button */}
          {sessionState.isActive ? (
            <TouchableOpacity
              style={styles.endButton}
              onPress={endSession}
              disabled={isEndingSession}
            >
              {isEndingSession ? (
                <ActivityIndicator color={Colors.background} size="small" />
              ) : (
                <Text style={styles.endButtonText}>End Session</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.startButton}
              onPress={startSession}
              disabled={!isCameraReady || isStartingSession}
            >
              {isStartingSession ? (
                <ActivityIndicator color={Colors.background} size="small" />
              ) : (
                <Text style={styles.startButtonText}>
                  {isCameraReady ? 'Start Session' : 'Loading...'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Debug info (FPS counter and mock detection indicator) */}
        {sessionState.isActive && __DEV__ && (
          <View style={styles.fpsCounter}>
            <Text style={styles.fpsText}>
              {currentFPS} FPS {isMockDetection() ? '(Mock)' : '(ML)'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CameraScreen;
