import { Camera } from 'expo-camera';
import { Linking, Platform } from 'react-native';

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
 * Check lighting quality from camera frame.
 * Returns 'unknown' when no frame is provided; defaults to 'good' otherwise.
 */
export const checkLightingQuality = (frame?: any): LightingQuality => {
  if (!frame) {
    return 'unknown';
  }
  return 'good';
};

/**
 * Device stability check result
 */
export interface StabilityResult {
  isStable: boolean;
  movement: number; // 0-1, where 0 is no movement
}

/**
 * Check device stability. Returns stable=true as a safe default.
 */
export const checkDeviceStability = (): StabilityResult => {
  return {
    isStable: true,
    movement: 0,
  };
};

/**
 * Format seconds to MM:SS display
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
