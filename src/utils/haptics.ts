import { Platform } from 'react-native';

export const ImpactFeedbackStyle = {
  Light: 'Light' as const,
  Medium: 'Medium' as const,
  Heavy: 'Heavy' as const,
};

export const NotificationFeedbackType = {
  Success: 'Success' as const,
  Warning: 'Warning' as const,
  Error: 'Error' as const,
};

export const impactAsync = async (
  _style?: string
): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync();
  } catch {}
};

export const notificationAsync = async (
  _type?: string
): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.notificationAsync();
  } catch {}
};

export const selectionAsync = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.selectionAsync();
  } catch {}
};
