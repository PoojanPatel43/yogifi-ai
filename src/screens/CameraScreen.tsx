import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, CameraSessionState } from '../types';
import Colors from '../constants/colors';
import { APP_CONFIG, generateMockScores, getRandomEncouragement } from '../constants/config';
import {
  checkCameraPermission,
  requestCameraPermission,
  openAppSettings,
  formatTime,
} from '../utils/camera';
import { startSessionApi, endSessionApi, cancelSessionApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

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

  // Loading states
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);

  // Encouragement message
  const [encouragement, setEncouragement] = useState(getRandomEncouragement());

  // Timer interval ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const encouragementRef = useRef<NodeJS.Timeout | null>(null);

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

      // Rotate encouragement messages every 10 seconds
      encouragementRef.current = setInterval(() => {
        setEncouragement(getRandomEncouragement());
      }, 10000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (encouragementRef.current) {
        clearInterval(encouragementRef.current);
        encouragementRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (encouragementRef.current) {
        clearInterval(encouragementRef.current);
      }
    };
  }, [sessionState.isActive]);

  // Request permission handler
  const handleRequestPermission = async () => {
    const status = await requestCameraPermission();
    setPermissionStatus(status);
  };

  // Toggle camera facing
  const toggleCameraFacing = useCallback(() => {
    setCameraType((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

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
        setSessionState({
          isActive: true,
          startTime: Date.now(),
          elapsedSeconds: 0,
          currentScore: 0,
          poseDetected: true,
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

  // End session
  const endSession = async () => {
    if (!sessionState.sessionId) {
      navigation.goBack();
      return;
    }

    // Check minimum duration
    if (sessionState.elapsedSeconds < APP_CONFIG.MIN_SESSION_DURATION_SECONDS) {
      Alert.alert(
        'Session Too Short',
        `Please practice for at least ${APP_CONFIG.MIN_SESSION_DURATION_SECONDS} seconds.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsEndingSession(true);

    try {
      // Generate mock scores if feature flag is enabled
      const scores = APP_CONFIG.USE_MOCK_SCORES
        ? generateMockScores()
        : { overallScore: 0, stabilityScore: 0, alignmentScore: 0 };

      const response = await endSessionApi({
        sessionId: sessionState.sessionId,
        durationSeconds: sessionState.elapsedSeconds,
        overallScore: scores.overallScore,
        stabilityScore: scores.stabilityScore,
        alignmentScore: scores.alignmentScore,
      });

      setSessionState((prev) => ({
        ...prev,
        isActive: false,
      }));

      if (response.success) {
        navigation.replace('SessionComplete', {
          sessionId: sessionState.sessionId,
          poseName: poseName,
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
          { text: 'End & Save', onPress: endSession },
          { text: 'Cancel Session', style: 'destructive', onPress: cancelSession },
        ]
      );
    } else {
      navigation.goBack();
    }
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

  // Render permission request view
  if (permissionStatus === 'undetermined') {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="videocam-outline" size={80} color={Colors.primary} />
        <Text style={styles.permissionTitle}>Enable Camera Access</Text>
        <Text style={styles.permissionText}>
          To guide your yoga practice, we need access to your camera. Your privacy is important - video is processed on-device only.
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

  // Main camera view - SIMPLIFIED
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

      {/* Overlay UI */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Top bar */}
        <View style={styles.topBar}>
          {/* Back button */}
          <TouchableOpacity style={styles.circleButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Pose name */}
          <View style={styles.poseNameContainer}>
            <Text style={styles.poseNameText}>{poseName}</Text>
          </View>

          {/* Flip camera button */}
          <TouchableOpacity style={styles.circleButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Center content - Timer and encouragement */}
        {sessionState.isActive && (
          <View style={styles.centerContent}>
            {/* Large Timer */}
            <View style={styles.timerBox}>
              <Text style={styles.timerLabel}>Duration</Text>
              <Text style={styles.timerValue}>{formatTime(sessionState.elapsedSeconds)}</Text>
            </View>

            {/* Encouragement message */}
            <View style={styles.encouragementBox}>
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
              <Text style={styles.encouragementText}>{encouragement}</Text>
            </View>
          </View>
        )}

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          {/* Session status */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, sessionState.isActive ? styles.statusActive : styles.statusInactive]} />
            <Text style={styles.statusText}>
              {sessionState.isActive ? 'Session in progress' : 'Ready to start'}
            </Text>
          </View>

          {/* Start/End button */}
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  poseNameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
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
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    paddingTop: 20,
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
