import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, CameraSessionState } from '../types';
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

  // FPS counter for frame processing
  const fpsCounterRef = useRef(new FPSCounter());
  const [currentFPS, setCurrentFPS] = useState(0);
  const frameProcessingRef = useRef<NodeJS.Timeout | null>(null);

  // Timer interval ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Accumulated scores for calculating average
  const scoresRef = useRef<number[]>([]);

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

  // Frame processing simulation (for future pose detection)
  useEffect(() => {
    if (sessionState.isActive && isCameraReady) {
      const targetInterval = 1000 / 30;

      frameProcessingRef.current = setInterval(() => {
        const fps = fpsCounterRef.current.tick();
        setCurrentFPS(fps);

        // Simulate pose detection score (will be replaced with actual AI model)
        const simulatedScore = 70 + Math.random() * 30;
        scoresRef.current.push(simulatedScore);

        setSessionState((prev) => ({
          ...prev,
          currentScore: Math.round(simulatedScore),
          poseDetected: true,
        }));
      }, targetInterval);
    } else {
      if (frameProcessingRef.current) {
        clearInterval(frameProcessingRef.current);
        frameProcessingRef.current = null;
      }
      fpsCounterRef.current.reset();
      setCurrentFPS(0);
    }

    return () => {
      if (frameProcessingRef.current) {
        clearInterval(frameProcessingRef.current);
      }
    };
  }, [sessionState.isActive, isCameraReady]);

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
        scoresRef.current = [];
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
      // Calculate average score from accumulated scores
      const avgScore = scoresRef.current.length > 0
        ? Math.round(scoresRef.current.reduce((a, b) => a + b, 0) / scoresRef.current.length)
        : 0;

      const response = await endSessionApi({
        sessionId: sessionState.sessionId,
        durationSeconds: sessionState.elapsedSeconds,
        overallScore: avgScore,
        stabilityScore: avgScore - 5 + Math.round(Math.random() * 10),
        alignmentScore: avgScore - 5 + Math.round(Math.random() * 10),
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
          overallScore: avgScore,
          stabilityScore: response.data?.stabilityScore || undefined,
          alignmentScore: response.data?.alignmentScore || undefined,
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

      {/* Overlay UI */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.circleButton}
            onPress={handleGoBack}
          >
            <Text style={styles.circleButtonText}>←</Text>
          </TouchableOpacity>

          {/* Timer and Score */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {formatTime(sessionState.elapsedSeconds)}
            </Text>
            {sessionState.isActive && (
              <Text style={styles.scoreText}>
                Score: {sessionState.currentScore}
              </Text>
            )}
          </View>

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

        {/* FPS counter (for debugging) */}
        {sessionState.isActive && __DEV__ && (
          <View style={styles.fpsCounter}>
            <Text style={styles.fpsText}>{currentFPS} FPS</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CameraScreen;
