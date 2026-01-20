import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PoseFeedback, PoseEvaluation } from '../services/poseRules';
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

const PoseFeedbackOverlay: React.FC<PoseFeedbackOverlayProps> = ({
  evaluation,
  isSessionActive,
}) => {
  if (!isSessionActive || !evaluation) {
    return null;
  }

  const { overallScore, alignmentScore, stabilityScore, feedback, isCorrectPose } = evaluation;

  // Get the most important feedback (highest severity)
  const sortedFeedback = [...feedback].sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const primaryFeedback = sortedFeedback[0];

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Score display in top right */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(overallScore) }]}>
            {overallScore}
          </Text>
        </View>

        <View style={styles.miniScoresContainer}>
          <View style={styles.miniScoreItem}>
            <Ionicons name="resize-outline" size={14} color={Colors.textLight} />
            <Text style={styles.miniScoreValue}>{alignmentScore}</Text>
          </View>
          <View style={styles.miniScoreItem}>
            <Ionicons name="body-outline" size={14} color={Colors.textLight} />
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
            </View>
          </View>

          {/* Show additional feedback items if available */}
          {sortedFeedback.length > 1 && (
            <View style={styles.additionalFeedback}>
              {sortedFeedback.slice(1, 3).map((fb, index) => (
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
  scoreCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
  },
  scoreLabel: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  miniScoresContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
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
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  additionalFeedback: {
    marginTop: 8,
    gap: 4,
  },
  additionalFeedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
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
