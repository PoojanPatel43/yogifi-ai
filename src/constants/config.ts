/**
 * App Configuration - Feature Flags and Settings
 * Toggle features on/off for development and production
 */

export const APP_CONFIG = {
  // Pose Detection Settings
  ENABLE_POSE_DETECTION: true, // Enable real pose detection for web
  USE_MOCK_SCORES: false, // Use real pose evaluation scores
  ENABLE_VOICE_FEEDBACK: false, // Disable voice guidance
  ENABLE_SKELETON_OVERLAY: true, // Enable skeleton drawing
  ENABLE_FEEDBACK_OVERLAY: true, // Enable real-time feedback messages
  ENABLE_DEBUG_OVERLAY: true, // Enable debug info for testing
  ENABLE_REFERENCE_OVERLAY: false, // Disable reference pose overlay

  // Mock Score Settings
  MOCK_SCORE_RANGE: {
    min: 70,
    max: 95,
  },
  MOCK_STABILITY_RANGE: {
    min: 65,
    max: 92,
  },
  MOCK_ALIGNMENT_RANGE: {
    min: 68,
    max: 94,
  },

  // Session Settings
  MIN_SESSION_DURATION_SECONDS: 10, // Minimum session to count
  DEFAULT_TARGET_DURATION_SECONDS: 60, // Default pose hold target
  BREATHING_REMINDER_INTERVAL_SECONDS: 15, // Interval for breathing reminders

  // UI Settings
  ENABLE_HAPTIC_FEEDBACK: true,
  ENABLE_CONFETTI_ANIMATION: true,
  CONFETTI_SCORE_THRESHOLD: 80, // Show confetti for scores above this

  // API Settings
  API_TIMEOUT_MS: 10000,
  ENABLE_OFFLINE_MODE: false, // Future feature

  // Debug Settings
  SHOW_FPS_COUNTER: __DEV__,
  LOG_API_CALLS: __DEV__,
};

/**
 * Generate mock scores based on config ranges
 */
export const generateMockScores = () => {
  const randomInRange = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  return {
    overallScore: randomInRange(
      APP_CONFIG.MOCK_SCORE_RANGE.min,
      APP_CONFIG.MOCK_SCORE_RANGE.max
    ),
    stabilityScore: randomInRange(
      APP_CONFIG.MOCK_STABILITY_RANGE.min,
      APP_CONFIG.MOCK_STABILITY_RANGE.max
    ),
    alignmentScore: randomInRange(
      APP_CONFIG.MOCK_ALIGNMENT_RANGE.min,
      APP_CONFIG.MOCK_ALIGNMENT_RANGE.max
    ),
  };
};

/**
 * Encouragement messages for simple session mode
 */
export const ENCOURAGEMENT_MESSAGES = [
  "You're doing great!",
  'Keep breathing steadily',
  'Focus on your form',
  'Great focus!',
  'Stay present',
  'Beautiful practice',
  'You got this!',
  'Breathe and relax',
  'Feel the stretch',
  'Mind and body connected',
  'Perfect alignment!',
  'Hold that pose',
];

export const getRandomEncouragement = () => {
  return ENCOURAGEMENT_MESSAGES[
    Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)
  ];
};

export default APP_CONFIG;
