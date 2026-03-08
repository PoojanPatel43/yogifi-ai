/**
 * Web Camera Screen with Real Pose Detection
 *
 * This component provides real-time pose detection for web using
 * the device webcam and TensorFlow.js MoveNet model.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '../constants/theme';
import { PoseData, RootStackParamList } from '../types';
import {
  initializePoseDetector,
  detectPoseFromVideo,
  disposePoseDetector,
  isDetectorReady,
  getDetectorStatus,
} from '../services/webPoseDetector';
import { evaluatePose } from '../services/poseRules';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

export default function WebCameraScreen({ navigation, route }: Props) {
  const poseName = route.params?.poseName || 'Mountain Pose';

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number>(0);
  // Cap inference to ~15 fps so MoveNet has time to complete each call
  // before the next frame is submitted (~67 ms between frames).
  const FRAME_MIN_INTERVAL_MS = 67;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poseData, setPoseData] = useState<PoseData | null>(null);
  const [detectorStatus, setDetectorStatus] = useState<any>(null);
  const [score, setScore] = useState(0);

  // Get dynamic score color based on performance
  const getScoreColor = (score: number): string => {
    if (score >= 85) return '#4CAF50'; // Green - Excellent
    if (score >= 70) return '#FFC107'; // Yellow - Good
    if (score >= 50) return '#FF9800'; // Orange - Needs work
    return '#F44336'; // Red - Keep trying
  };

  // Get feedback message based on score
  const getFeedbackMessage = (score: number): string => {
    if (score >= 85) return 'Excellent form!';
    if (score >= 70) return 'Good progress!';
    if (score >= 50) return 'Keep adjusting';
    return 'Focus on alignment';
  };

  // Initialize camera and pose detector
  useEffect(() => {
    if (Platform.OS !== 'web') {
      setError('This screen is only available on web');
      return;
    }

    let stream: MediaStream | null = null;

    const setup = async () => {
      try {
        setIsLoading(true);

        // Request camera access
        console.log('[WebCamera] Requesting camera access...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });

        // Attach stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          console.log('[WebCamera] Video stream started');
        }

        // Initialize pose detector
        console.log('[WebCamera] Initializing pose detector...');
        await initializePoseDetector();
        setDetectorStatus(getDetectorStatus());

        setIsLoading(false);
        console.log('[WebCamera] Setup complete!');

        // Start detection loop
        startDetection();
      } catch (err: any) {
        console.error('[WebCamera] Setup error:', err);
        setError(err.message || 'Failed to start camera');
        setIsLoading(false);
      }
    };

    setup();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      disposePoseDetector();
    };
  }, []);

  // Detection loop — uses requestAnimationFrame, throttled to ~15 fps
  // to avoid queuing MoveNet inference calls faster than they can complete.
  const startDetection = useCallback(() => {
    const detect = (timestamp: number) => {
      // Schedule next frame first so the loop continues even if we skip processing
      animationFrameRef.current = requestAnimationFrame(detect);

      // Throttle: only run inference if enough time has elapsed
      if (timestamp - lastFrameTimeRef.current < FRAME_MIN_INTERVAL_MS) {
        return;
      }
      lastFrameTimeRef.current = timestamp;

      if (!videoRef.current || !isDetectorReady()) {
        return;
      }

      // Run inference asynchronously without blocking the RAF callback
      detectPoseFromVideo(videoRef.current)
        .then((detectedPose) => {
          if (detectedPose) {
            setPoseData(detectedPose);

            // Evaluate pose
            const evaluation = evaluatePose(detectedPose.keypoints, poseName);
            setScore(evaluation.overallScore);

            // Draw skeleton on canvas
            if (canvasRef.current && videoRef.current) {
              drawSkeleton(detectedPose, videoRef.current, canvasRef.current);
            }
          }
        })
        .catch((err) => {
          console.error('[WebCamera] Detection error:', err);
        });
    };

    animationFrameRef.current = requestAnimationFrame(detect);
  }, [poseName]);

  // Draw skeleton overlay
  const drawSkeleton = (
    pose: PoseData,
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw keypoints
    ctx.fillStyle = '#00FF00';
    pose.keypoints.forEach((kp) => {
      if (kp.confidence > 0.3) {
        const x = kp.x * canvas.width;
        const y = kp.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw skeleton connections
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    const connections = [
      [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // Arms
      [5, 11], [6, 12], [11, 12], // Torso
      [11, 13], [13, 15], [12, 14], [14, 16], // Legs
    ];

    connections.forEach(([i, j]) => {
      const kp1 = pose.keypoints[i];
      const kp2 = pose.keypoints[j];

      if (kp1.confidence > 0.3 && kp2.confidence > 0.3) {
        ctx.beginPath();
        ctx.moveTo(kp1.x * canvas.width, kp1.y * canvas.height);
        ctx.lineTo(kp2.x * canvas.width, kp2.y * canvas.height);
        ctx.stroke();
      }
    });
  };

  const handleExit = () => {
    navigation.goBack();
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Web camera only available on web platform</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Video container */}
      <View style={styles.videoContainer}>
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)', // Mirror for front camera
          }}
          playsInline
          muted
        />

        {/* Canvas overlay for skeleton */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: 'scaleX(-1)', // Mirror to match video
            pointerEvents: 'none',
          }}
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.overlay}>
            <Text style={styles.loadingText}>Initializing camera and AI model...</Text>
          </View>
        )}

        {/* Error message */}
        {error && (
          <View style={styles.overlay}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.button} onPress={handleExit}>
              <Text style={styles.buttonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pose feedback overlay */}
        {poseData && !isLoading && !error && (
          <View style={styles.feedbackContainer}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
                {Math.round(score)}
              </Text>
              <Text style={[styles.feedbackText, { color: getScoreColor(score) }]}>
                {getFeedbackMessage(score)}
              </Text>
            </View>

            <View style={styles.statusBox}>
              <Text style={styles.statusText}>Pose: {poseName}</Text>
              <Text style={styles.statusText}>
                Detector: {detectorStatus?.model || 'Loading...'}
              </Text>
              <Text style={styles.statusText}>
                Confidence: {Math.round(poseData.confidence * 100)}%
              </Text>
            </View>
          </View>
        )}

        {/* Exit button */}
        <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
          <Ionicons name="close" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.md,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#FFF',
    fontSize: 12,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  feedbackText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  statusBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    marginBottom: 4,
  },
  exitButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
