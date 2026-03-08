/**
 * Web Pose Detector Service using TensorFlow.js
 *
 * This module provides real-time pose detection for web platform using
 * TensorFlow.js and the MoveNet model.
 *
 * Features:
 * - Real pose detection from webcam feed
 * - 17 keypoint tracking (MoveNet format)
 * - Optimized for web browsers
 * - Compatible with the existing pose evaluation system
 */

import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { Keypoint, PoseData } from '../types';
import { KEYPOINT_NAMES, KeypointName } from './poseDetector';

let detector: poseDetection.PoseDetector | null = null;
let isInitialized = false;

/**
 * Initialize the TensorFlow.js pose detector
 */
export async function initializePoseDetector(): Promise<void> {
  if (isInitialized && detector) {
    return;
  }

  try {
    console.log('[WebPoseDetector] Initializing TensorFlow.js...');

    // Set backend to WebGL for better performance
    await tf.setBackend('webgl');
    await tf.ready();

    console.log('[WebPoseDetector] Creating MoveNet detector...');

    // Create MoveNet detector with optimal settings for web
    const model = poseDetection.SupportedModels.MoveNet;
    const detectorConfig: poseDetection.MoveNetModelConfig = {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
      minPoseScore: 0.30, // raised from 0.25 — reduces ghost detections; yoga needs precise keypoints
    };

    detector = await poseDetection.createDetector(model, detectorConfig);
    isInitialized = true;

    console.log('[WebPoseDetector] Initialized successfully!');
  } catch (error) {
    console.error('[WebPoseDetector] Failed to initialize:', error);
    throw new Error('Failed to initialize pose detector');
  }
}

/**
 * Detect pose from video element
 */
export async function detectPoseFromVideo(
  video: HTMLVideoElement
): Promise<PoseData | null> {
  if (!detector) {
    console.warn('[WebPoseDetector] Detector not initialized');
    return null;
  }

  try {
    const poses = await detector.estimatePoses(video, {
      flipHorizontal: false,
    });

    if (poses.length === 0) {
      return null;
    }

    // Convert TensorFlow.js format to our app format
    const pose = poses[0];
    const keypoints: Keypoint[] = KEYPOINT_NAMES.map((name, index) => {
      const tfKeypoint = pose.keypoints[index];

      return {
        name,
        x: tfKeypoint.x / video.videoWidth, // Normalize to 0-1
        y: tfKeypoint.y / video.videoHeight, // Normalize to 0-1
        confidence: tfKeypoint.score || 0,
      };
    });

    return {
      keypoints,
      timestamp: Date.now(),
      confidence: pose.score || 0,
    };
  } catch (error) {
    console.error('[WebPoseDetector] Detection error:', error);
    return null;
  }
}

/**
 * Detect pose from image
 */
export async function detectPoseFromImage(
  image: HTMLImageElement | ImageData
): Promise<PoseData | null> {
  if (!detector) {
    console.warn('[WebPoseDetector] Detector not initialized');
    return null;
  }

  try {
    const poses = await detector.estimatePoses(image);

    if (poses.length === 0) {
      return null;
    }

    const pose = poses[0];
    const width = image instanceof HTMLImageElement ? image.width : image.width;
    const height = image instanceof HTMLImageElement ? image.height : image.height;

    const keypoints: Keypoint[] = KEYPOINT_NAMES.map((name, index) => {
      const tfKeypoint = pose.keypoints[index];

      return {
        name,
        x: tfKeypoint.x / width,
        y: tfKeypoint.y / height,
        confidence: tfKeypoint.score || 0,
      };
    });

    return {
      keypoints,
      timestamp: Date.now(),
      confidence: pose.score || 0,
    };
  } catch (error) {
    console.error('[WebPoseDetector] Detection error:', error);
    return null;
  }
}

/**
 * Clean up detector and free resources
 */
export async function disposePoseDetector(): Promise<void> {
  if (detector) {
    detector.dispose();
    detector = null;
    isInitialized = false;
    console.log('[WebPoseDetector] Disposed');
  }
}

/**
 * Check if detector is ready
 */
export function isDetectorReady(): boolean {
  return isInitialized && detector !== null;
}

/**
 * Get detector status info
 */
export function getDetectorStatus(): {
  initialized: boolean;
  backend: string;
  model: string;
} {
  return {
    initialized: isInitialized,
    backend: tf.getBackend(),
    model: detector ? 'MoveNet Lightning' : 'None',
  };
}
