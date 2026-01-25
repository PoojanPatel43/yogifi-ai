import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PoseEvaluation, PosePhase } from '../services/poseRules';
import Colors from '../constants/colors';

interface PoseFeedbackOverlayProps {
  evaluation: PoseEvaluation | null;
  isSessionActive: boolean;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return Colors.success;
  if (score >= 60) return Colors.warning;
  return Colors.error;
};

const getSeverityIcon = (severity: string): string => {
  switch (severity) {
    case 'info':
      return 'checkmark-circle';
    case 'warning':
      return 'alert-circle';
    case 'error':
      return 'close-circle';
    default:
      return 'information-circle';
  }
};

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'info':
      return Colors.success;
    case 'warning':
      return Colors.warning;
    case 'error':
      return Colors.error;
    default:
      return Colors.textMuted;
  }
};

const getPhaseInfo = (phase: PosePhase): { label: string; color: string; icon: string } => {
  switch (phase) {
    case 'setup':
      return { label: 'SETUP', color: Colors.textMuted, icon: 'body-outline' };
    case 'adjustment':
      return { label: 'ADJUSTING', color: Colors.warning, icon: 'construct-outline' };
    case 'hold':
      return { label: 'HOLD', color: Colors.success, icon: 'timer-outline' };
    case 'complete':
      return { label: 'COMPLETE!', color: Colors.primary, icon: 'checkmark-done' };
  }
};

const PoseFeedbackOverlay: React.FC<PoseFeedbackOverlayProps> = ({
  evaluation,
  isSessionActive,
}) => {
  if (!isSessionActive || !evaluation) {
    return null;
  }

  const { overallScore, alignmentScore, stabilityScore, feedback, isCorrectPose, phase, holdProgress } = evaluation;
  const phaseInfo = getPhaseInfo(phase);
  const primaryFeedback = feedback[0];

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Score and Phase display in top right */}
      <View style={styles.scoreContainer}>
        {/* Phase indicator */}
        <View style={[styles.phaseCard, { borderColor: phaseInfo.color }]}>
          <Ionicons name={phaseInfo.icon as any} size={16} color={phaseInfo.color} />
          <Text style={[styles.phaseText, { color: phaseInfo.color }]}>{phaseInfo.label}</Text>
        </View>

        {/* Main score card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(overallScore) }]}>
            {overallScore}
          </Text>

          {/* Hold progress bar */}
          {phase === 'hold' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${holdProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(holdProgress)}%</Text>
            </View>
          )}
        </View>

        {/* Sub-scores */}
        <View style={styles.miniScoresContainer}>
          <View style={styles.miniScoreItem}>
            <Ionicons name="resize-outline" size={14} color={Colors.textLight} />
            <Text style={styles.miniScoreValue}>{alignmentScore}</Text>
          </View>
          <View style={styles.miniScoreItem}>
            <Ionicons name="fitness-outline" size={14} color={Colors.textLight} />
            <Text style={styles.miniScoreValue}>{stabilityScore}</Text>
          </View>
        </View>
      </View>

      {/* Pose status indicator */}
      {!isCorrectPose && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={20} color={Colors.warning} />
          <Text style={styles.warningText}>
            Adjust your position for better detection
          </Text>
        </View>
      )}

      {/* Primary feedback at bottom */}
      {primaryFeedback && (
        <View style={styles.feedbackContainer}>
          <View style={[styles.feedbackCard, { borderLeftColor: getSeverityColor(primaryFeedback.severity) }]}>
            <Ionicons
              name={getSeverityIcon(primaryFeedback.severity) as any}
              size={24}
              color={getSeverityColor(primaryFeedback.severity)}
            />
            <View style={styles.feedbackTextContainer}>
              <Text style={styles.feedbackMessage}>{primaryFeedback.message}</Text>
              {primaryFeedback.correction && (
                <Text style={styles.feedbackCorrection}>{primaryFeedback.correction}</Text>
              )}
              {primaryFeedback.currentValue !== undefined && primaryFeedback.targetValue !== undefined && (
                <View style={styles.valueContainer}>
                  <Text style={styles.valueText}>
                    Current: {primaryFeedback.currentValue}° → Target: {primaryFeedback.targetValue}°
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Show additional feedback items if available */}
          {feedback.length > 1 && (
            <View style={styles.additionalFeedback}>
              {feedback.slice(1, 3).map((fb, index) => (
                <View key={index} style={styles.additionalFeedbackItem}>
                  <Ionicons
                    name={getSeverityIcon(fb.severity) as any}
                    size={16}
                    color={getSeverityColor(fb.severity)}
                  />
                  <Text style={styles.additionalFeedbackText}>{fb.message}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
  },
  scoreContainer: {
    position: 'absolute',
    top: 100,
    right: 16,
    alignItems: 'flex-end',
  },
  phaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    borderWidth: 2,
    gap: 6,
  },
  phaseText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scoreCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 90,
  },
  scoreLabel: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  progressText: {
    color: Colors.textLight,
    fontSize: 10,
    marginTop: 4,
  },
  miniScoresContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  miniScoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  miniScoreValue: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
  warningBanner: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  warningText: {
    color: Colors.warning,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  feedbackContainer: {
    position: 'absolute',
    bottom: 140,
    left: 16,
    right: 16,
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    gap: 12,
  },
  feedbackTextContainer: {
    flex: 1,
  },
  feedbackMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  feedbackCorrection: {
    color: Colors.textLight,
    fontSize: 13,
  },
  valueContainer: {
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  valueText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  additionalFeedback: {
    marginTop: 8,
    gap: 4,
  },
  additionalFeedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  additionalFeedbackText: {
    color: Colors.textLight,
    fontSize: 13,
    flex: 1,
  },
});

export default PoseFeedbackOverlay;
