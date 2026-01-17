import { Camera } from 'expo-camera';
import { Linking, Platform } from 'react-native';
import type { Keypoint } from '../types';

/**
 * Camera permission status types
 */
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * Check current camera permission status
 */
export const checkCameraPermission = async (): Promise<PermissionStatus> => {
  const { status } = await Camera.getCameraPermissionsAsync();
  return status as PermissionStatus;
};

/**
 * Request camera permission from user
 */
export const requestCameraPermission = async (): Promise<PermissionStatus> => {
  const { status } = await Camera.requestCameraPermissionsAsync();
  return status as PermissionStatus;
};

/**
 * Open device settings for the app (to manually enable camera permission)
 */
export const openAppSettings = async (): Promise<void> => {
  if (Platform.OS === 'ios') {
    await Linking.openURL('app-settings:');
  } else {
    await Linking.openSettings();
  }
};

/**
 * Lighting quality levels
 */
export type LightingQuality = 'good' | 'low' | 'too_bright' | 'unknown';

/**
 * Check lighting quality from camera frame
 * Placeholder implementation - will be enhanced with actual frame analysis
 */
export const checkLightingQuality = (frame?: any): LightingQuality => {
  // TODO: Implement actual lighting detection using frame luminance analysis
  // For now, return 'good' as placeholder
  // Future implementation will:
  // 1. Extract luminance values from frame
  // 2. Calculate average brightness
  // 3. Check for overexposure/underexposure
  // 4. Return appropriate quality level

  if (!frame) {
    return 'unknown';
  }

  // Placeholder: simulate good lighting
  return 'good';
};

/**
 * Body visibility status
 */
export interface BodyVisibilityResult {
  isVisible: boolean;
  visibleKeypoints: number;
  totalKeypoints: number;
  missingParts: string[];
}

/**
 * Required keypoints for full body visibility
 */
const REQUIRED_KEYPOINTS = [
  'nose',
  'left_shoulder',
  'right_shoulder',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
];

/**
 * Check if body is fully visible in frame based on detected keypoints
 * Placeholder implementation - will be connected to pose detection model
 */
export const checkBodyInFrame = (keypoints?: Keypoint[]): BodyVisibilityResult => {
  // TODO: Implement actual body detection using pose detection model output
  // For now, return placeholder data

  if (!keypoints || keypoints.length === 0) {
    return {
      isVisible: false,
      visibleKeypoints: 0,
      totalKeypoints: REQUIRED_KEYPOINTS.length,
      missingParts: REQUIRED_KEYPOINTS,
    };
  }

  const visibleKeypoints = keypoints.filter(
    (kp) => kp.confidence > 0.5 && REQUIRED_KEYPOINTS.includes(kp.name)
  );

  const visibleNames = visibleKeypoints.map((kp) => kp.name);
  const missingParts = REQUIRED_KEYPOINTS.filter(
    (name) => !visibleNames.includes(name)
  );

  return {
    isVisible: visibleKeypoints.length >= REQUIRED_KEYPOINTS.length * 0.8,
    visibleKeypoints: visibleKeypoints.length,
    totalKeypoints: REQUIRED_KEYPOINTS.length,
    missingParts,
  };
};

/**
 * Device stability check result
 */
export interface StabilityResult {
  isStable: boolean;
  movement: number; // 0-1, where 0 is no movement
}

/**
 * Check device stability
 * Placeholder - will use accelerometer data in future
 */
export const checkDeviceStability = (): StabilityResult => {
  // TODO: Implement using expo-sensors accelerometer
  // For now, assume device is stable
  return {
    isStable: true,
    movement: 0,
  };
};

/**
 * Frame processing configuration
 */
export interface FrameProcessingConfig {
  targetFPS: number;
  processingEnabled: boolean;
}

/**
 * Default frame processing configuration
 */
export const DEFAULT_FRAME_CONFIG: FrameProcessingConfig = {
  targetFPS: 30,
  processingEnabled: true,
};

/**
 * FPS counter utility for monitoring frame rate
 */
export class FPSCounter {
  private frameCount: number = 0;
  private lastTime: number = Date.now();
  private currentFPS: number = 0;

  /**
   * Call this on each frame to update FPS calculation
   */
  tick(): number {
    this.frameCount++;
    const now = Date.now();
    const elapsed = now - this.lastTime;

    if (elapsed >= 1000) {
      this.currentFPS = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = now;
    }

    return this.currentFPS;
  }

  /**
   * Get current FPS value
   */
  getFPS(): number {
    return this.currentFPS;
  }

  /**
   * Reset the counter
   */
  reset(): void {
    this.frameCount = 0;
    this.lastTime = Date.now();
    this.currentFPS = 0;
  }
}

/**
 * Format seconds to MM:SS display
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
