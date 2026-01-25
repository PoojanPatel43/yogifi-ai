import * as Speech from 'expo-speech';
import { PosePhase } from './poseRules';

// Configuration
const VOICE_CONFIG = {
  language: 'en-US',
  pitch: 1.0,
  rate: 0.9, // Slightly slower for clarity
};

// Cooldown to prevent spam
let lastSpokenTime = 0;
let lastSpokenMessage = '';
const MESSAGE_COOLDOWN_MS = 3000; // Don't repeat same message within 3 seconds
const GENERAL_COOLDOWN_MS = 1500; // Minimum time between any messages

// Voice enabled state
let voiceEnabled = true;

// Phase-specific announcements
const phaseAnnouncements: Record<PosePhase, string> = {
  setup: 'Get into position',
  adjustment: 'Making adjustments',
  hold: 'Hold the pose, great work!',
  complete: 'Excellent! Pose complete!',
};

// Score-based encouragements
const scoreEncouragements: { threshold: number; messages: string[] }[] = [
  { threshold: 90, messages: ['Perfect form!', 'Excellent!', 'Outstanding!'] },
  { threshold: 75, messages: ['Great job!', 'Looking good!', 'Nice work!'] },
  { threshold: 60, messages: ['Good effort!', 'Keep it up!', 'Almost there!'] },
  { threshold: 0, messages: ['Adjust your position', 'Keep trying', 'You can do it'] },
];

// Joint-specific correction prompts
const jointCorrections: Record<string, string[]> = {
  left_knee: ['Bend your front knee more', 'Adjust your front leg'],
  right_knee: ['Straighten your back leg', 'Adjust your back leg'],
  left_shoulder: ['Extend your left arm', 'Level your left shoulder'],
  right_shoulder: ['Extend your right arm', 'Level your right shoulder'],
  left_hip: ['Open your hips more', 'Adjust your hip alignment'],
  right_hip: ['Square your hips', 'Rotate your hips'],
  left_ankle: ['Ground your front foot', 'Adjust front foot position'],
  right_ankle: ['Press through your back foot', 'Adjust back foot position'],
};

/**
 * Enable or disable voice guidance
 */
export function setVoiceEnabled(enabled: boolean): void {
  voiceEnabled = enabled;
  if (!enabled) {
    Speech.stop();
  }
}

/**
 * Check if voice guidance is enabled
 */
export function isVoiceEnabled(): boolean {
  return voiceEnabled;
}

/**
 * Speak a message with cooldown protection
 */
export async function speak(message: string, priority: 'high' | 'normal' = 'normal'): Promise<void> {
  if (!voiceEnabled) return;

  const now = Date.now();

  // Check cooldowns (high priority messages bypass message-specific cooldown)
  if (priority !== 'high') {
    if (message === lastSpokenMessage && now - lastSpokenTime < MESSAGE_COOLDOWN_MS) {
      return;
    }
    if (now - lastSpokenTime < GENERAL_COOLDOWN_MS) {
      return;
    }
  }

  // Stop any current speech
  const isSpeaking = await Speech.isSpeakingAsync();
  if (isSpeaking) {
    if (priority !== 'high') return; // Don't interrupt for normal messages
    Speech.stop();
  }

  lastSpokenTime = now;
  lastSpokenMessage = message;

  Speech.speak(message, VOICE_CONFIG);
}

/**
 * Announce phase change
 */
export function announcePhase(phase: PosePhase): void {
  const message = phaseAnnouncements[phase];
  if (message) {
    speak(message, phase === 'complete' ? 'high' : 'normal');
  }
}

/**
 * Announce score-based encouragement
 */
export function announceScore(score: number): void {
  for (const tier of scoreEncouragements) {
    if (score >= tier.threshold) {
      const message = tier.messages[Math.floor(Math.random() * tier.messages.length)];
      speak(message);
      break;
    }
  }
}

/**
 * Announce joint correction
 */
export function announceJointCorrection(joint: string): void {
  const corrections = jointCorrections[joint];
  if (corrections && corrections.length > 0) {
    const message = corrections[Math.floor(Math.random() * corrections.length)];
    speak(message);
  }
}

/**
 * Announce hold progress
 */
export function announceHoldProgress(progress: number): void {
  if (progress >= 25 && progress < 30) {
    speak('Quarter way there');
  } else if (progress >= 50 && progress < 55) {
    speak('Halfway done');
  } else if (progress >= 75 && progress < 80) {
    speak('Almost there, keep holding');
  }
}

/**
 * Announce session start
 */
export function announceSessionStart(poseName: string): void {
  speak(`Starting ${poseName} practice. Get into position.`, 'high');
}

/**
 * Announce session end
 */
export function announceSessionEnd(score: number): void {
  if (score >= 80) {
    speak('Great session! Well done!', 'high');
  } else if (score >= 60) {
    speak('Good practice session!', 'high');
  } else {
    speak('Session complete. Keep practicing!', 'high');
  }
}

/**
 * Announce countdown
 */
export function announceCountdown(seconds: number): void {
  if (seconds <= 3 && seconds > 0) {
    speak(seconds.toString(), 'high');
  }
}

/**
 * Stop all speech
 */
export function stopSpeech(): void {
  Speech.stop();
}

/**
 * Reset voice guidance state
 */
export function resetVoiceGuidance(): void {
  lastSpokenTime = 0;
  lastSpokenMessage = '';
  Speech.stop();
}

export default {
  speak,
  setVoiceEnabled,
  isVoiceEnabled,
  announcePhase,
  announceScore,
  announceJointCorrection,
  announceHoldProgress,
  announceSessionStart,
  announceSessionEnd,
  announceCountdown,
  stopSpeech,
  resetVoiceGuidance,
};
