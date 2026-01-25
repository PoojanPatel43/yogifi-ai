/**
 * Pose Detector Service - Expo Go Compatible
 *
 * This module provides pose detection functionality for the YogiFi AI app.
 *
 * CURRENT IMPLEMENTATION: Mock pose detection
 * - Generates realistic keypoint data for testing UI/UX
 * - Simulates natural movement and pose variations
 * - Works with Expo Go without native modules
 *
 * FUTURE UPGRADE PATH:
 * To add real ML-based pose detection:
 * 1. Use Expo Dev Client (custom development build)
 * 2. Install: react-native-fast-tflite + react-native-vision-camera
 * 3. Or use TensorFlow.js with @tensorflow-models/pose-detection
 * 4. Set USE_MOCK_POSE_DETECTION = false
 *
 * Note: Real ML requires either:
 * - Expo Dev Client (recommended for development)
 * - EAS Build (for production)
 * - Ejecting to bare workflow
 */

import { Keypoint, PoseData } from '../types';

// Configuration flag - set to false when real ML is implemented
export const USE_MOCK_POSE_DETECTION = true;

// MoveNet keypoint indices and names
export const KEYPOINT_NAMES = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
] as const;

export type KeypointName = typeof KEYPOINT_NAMES[number];

// Keypoint connections for skeleton drawing
export const KEYPOINT_CONNECTIONS: [KeypointName, KeypointName][] = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

// Pose templates for different yoga poses
interface PoseTemplate {
  name: string;
  keypoints: Record<KeypointName, { x: number; y: number }>;
}

// Warrior II pose template (arms extended, front knee bent)
const warriorIITemplate: PoseTemplate = {
  name: 'warrior_ii',
  keypoints: {
    nose: { x: 0.5, y: 0.12 },
    left_eye: { x: 0.48, y: 0.1 },
    right_eye: { x: 0.52, y: 0.1 },
    left_ear: { x: 0.45, y: 0.11 },
    right_ear: { x: 0.55, y: 0.11 },
    left_shoulder: { x: 0.35, y: 0.22 },
    right_shoulder: { x: 0.65, y: 0.22 },
    left_elbow: { x: 0.18, y: 0.22 },
    right_elbow: { x: 0.82, y: 0.22 },
    left_wrist: { x: 0.05, y: 0.22 },
    right_wrist: { x: 0.95, y: 0.22 },
    left_hip: { x: 0.42, y: 0.48 },
    right_hip: { x: 0.58, y: 0.48 },
    left_knee: { x: 0.3, y: 0.68 },
    right_knee: { x: 0.7, y: 0.62 },
    left_ankle: { x: 0.22, y: 0.88 },
    right_ankle: { x: 0.78, y: 0.88 },
  },
};

// Tree pose template (standing on one leg)
const treePoseTemplate: PoseTemplate = {
  name: 'tree_pose',
  keypoints: {
    nose: { x: 0.5, y: 0.1 },
    left_eye: { x: 0.48, y: 0.08 },
    right_eye: { x: 0.52, y: 0.08 },
    left_ear: { x: 0.45, y: 0.09 },
    right_ear: { x: 0.55, y: 0.09 },
    left_shoulder: { x: 0.42, y: 0.2 },
    right_shoulder: { x: 0.58, y: 0.2 },
    left_elbow: { x: 0.45, y: 0.15 },
    right_elbow: { x: 0.55, y: 0.15 },
    left_wrist: { x: 0.48, y: 0.08 },
    right_wrist: { x: 0.52, y: 0.08 },
    left_hip: { x: 0.45, y: 0.45 },
    right_hip: { x: 0.55, y: 0.45 },
    left_knee: { x: 0.45, y: 0.65 },
    right_knee: { x: 0.6, y: 0.5 },
    left_ankle: { x: 0.45, y: 0.88 },
    right_ankle: { x: 0.5, y: 0.55 },
  },
};

// Mountain pose template (standing straight)
const mountainPoseTemplate: PoseTemplate = {
  name: 'mountain_pose',
  keypoints: {
    nose: { x: 0.5, y: 0.1 },
    left_eye: { x: 0.48, y: 0.08 },
    right_eye: { x: 0.52, y: 0.08 },
    left_ear: { x: 0.45, y: 0.09 },
    right_ear: { x: 0.55, y: 0.09 },
    left_shoulder: { x: 0.4, y: 0.2 },
    right_shoulder: { x: 0.6, y: 0.2 },
    left_elbow: { x: 0.38, y: 0.35 },
    right_elbow: { x: 0.62, y: 0.35 },
    left_wrist: { x: 0.38, y: 0.48 },
    right_wrist: { x: 0.62, y: 0.48 },
    left_hip: { x: 0.45, y: 0.5 },
    right_hip: { x: 0.55, y: 0.5 },
    left_knee: { x: 0.45, y: 0.7 },
    right_knee: { x: 0.55, y: 0.7 },
    left_ankle: { x: 0.45, y: 0.9 },
    right_ankle: { x: 0.55, y: 0.9 },
  },
};

// Default pose template
const defaultTemplate: PoseTemplate = {
  name: 'default',
  keypoints: {
    nose: { x: 0.5, y: 0.12 },
    left_eye: { x: 0.48, y: 0.1 },
    right_eye: { x: 0.52, y: 0.1 },
    left_ear: { x: 0.45, y: 0.11 },
    right_ear: { x: 0.55, y: 0.11 },
    left_shoulder: { x: 0.38, y: 0.22 },
    right_shoulder: { x: 0.62, y: 0.22 },
    left_elbow: { x: 0.3, y: 0.35 },
    right_elbow: { x: 0.7, y: 0.35 },
    left_wrist: { x: 0.28, y: 0.48 },
    right_wrist: { x: 0.72, y: 0.48 },
    left_hip: { x: 0.42, y: 0.5 },
    right_hip: { x: 0.58, y: 0.5 },
    left_knee: { x: 0.4, y: 0.7 },
    right_knee: { x: 0.6, y: 0.7 },
    left_ankle: { x: 0.38, y: 0.9 },
    right_ankle: { x: 0.62, y: 0.9 },
  },
};

// Map pose names to templates
const poseTemplates: Record<string, PoseTemplate> = {
  'warrior ii': warriorIITemplate,
  'warrior_ii': warriorIITemplate,
  'virabhadrasana ii': warriorIITemplate,
  'tree pose': treePoseTemplate,
  'tree': treePoseTemplate,
  'vrksasana': treePoseTemplate,
  'mountain pose': mountainPoseTemplate,
  'mountain': mountainPoseTemplate,
  'tadasana': mountainPoseTemplate,
};

/**
 * Mock Pose Detector
 * Generates realistic pose keypoints for testing without ML
 */
class MockPoseDetector {
  private template: PoseTemplate = defaultTemplate;
  private noiseLevel = 0.015; // Amount of random movement
  private breathingPhase = 0; // For simulating breathing movement
  private swayPhase = 0; // For simulating natural body sway

  /**
   * Set the pose template based on pose name
   */
  setPose(poseName: string): void {
    const normalizedName = poseName.toLowerCase();
    this.template = poseTemplates[normalizedName] || defaultTemplate;
  }

  /**
   * Generate keypoints with natural movement simulation
   */
  generateKeypoints(): Keypoint[] {
    // Update movement phases
    this.breathingPhase += 0.1;
    this.swayPhase += 0.05;

    // Calculate breathing and sway offsets
    const breathOffset = Math.sin(this.breathingPhase) * 0.005;
    const swayOffsetX = Math.sin(this.swayPhase) * 0.008;
    const swayOffsetY = Math.cos(this.swayPhase * 0.7) * 0.003;

    return KEYPOINT_NAMES.map(name => {
      const basePos = this.template.keypoints[name];

      // Add natural movement
      const noise = {
        x: (Math.random() - 0.5) * this.noiseLevel,
        y: (Math.random() - 0.5) * this.noiseLevel,
      };

      // Apply breathing effect more to upper body
      const isUpperBody = ['nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
        'left_shoulder', 'right_shoulder'].includes(name);
      const breathingEffect = isUpperBody ? breathOffset : breathOffset * 0.3;

      // Generate confidence based on keypoint visibility
      // Face and shoulder keypoints typically have higher confidence
      const baseConfidence = ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip']
        .includes(name) ? 0.92 : 0.85;
      const confidence = Math.min(0.99, baseConfidence + (Math.random() - 0.5) * 0.1);

      return {
        name,
        x: basePos.x + noise.x + swayOffsetX,
        y: basePos.y + noise.y + breathingEffect + swayOffsetY,
        confidence,
      };
    });
  }

  /**
   * Reset movement phases
   */
  reset(): void {
    this.breathingPhase = 0;
    this.swayPhase = 0;
  }
}

// Singleton instance
const mockDetector = new MockPoseDetector();

/**
 * Detect pose from current frame
 * Currently uses mock detection - can be upgraded to real ML later
 */
export async function detectPose(poseName?: string): Promise<PoseData | null> {
  if (USE_MOCK_POSE_DETECTION) {
    // Update template if pose name provided
    if (poseName) {
      mockDetector.setPose(poseName);
    }

    const keypoints = mockDetector.generateKeypoints();
    const validKeypoints = keypoints.filter(kp => kp.confidence > 0.3);
    const avgConfidence = validKeypoints.length > 0
      ? validKeypoints.reduce((sum, kp) => sum + kp.confidence, 0) / validKeypoints.length
      : 0;

    return {
      keypoints,
      timestamp: Date.now(),
      confidence: avgConfidence,
    };
  }

  // Placeholder for real ML implementation
  // TODO: Implement with TensorFlow.js or native TFLite when using Dev Client
  console.warn('[PoseDetector] Real ML not implemented - using mock detection');
  return null;
}

/**
 * Reset the pose detector state
 */
export function resetDetector(): void {
  mockDetector.reset();
}

/**
 * Check if pose detector is using mock data
 */
export function isMockDetection(): boolean {
  return USE_MOCK_POSE_DETECTION;
}

// Utility functions for pose analysis

/**
 * Calculate angle between three points (in degrees)
 */
export function calculateAngle(
  point1: { x: number; y: number },
  point2: { x: number; y: number },
  point3: { x: number; y: number }
): number {
  const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) -
                  Math.atan2(point1.y - point2.y, point1.x - point2.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }

  return angle;
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
}

/**
 * Get midpoint between two points
 */
export function getMidpoint(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2,
  };
}

export default {
  detectPose,
  resetDetector,
  isMockDetection,
  calculateAngle,
  calculateDistance,
  getMidpoint,
  USE_MOCK_POSE_DETECTION,
  KEYPOINT_NAMES,
  KEYPOINT_CONNECTIONS,
};
