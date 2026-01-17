import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import Colors from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionComplete'>;

const SessionCompleteScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    sessionId,
    poseName,
    duration,
    overallScore,
    stabilityScore,
    alignmentScore,
  } = route.params;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.error;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent!';
    if (score >= 80) return 'Great job!';
    if (score >= 70) return 'Good work!';
    if (score >= 60) return 'Nice effort!';
    return 'Keep practicing!';
  };

  const handleGoHome = () => {
    navigation.replace('Home');
  };

  const handleViewHistory = () => {
    navigation.replace('History');
  };

  const handlePracticeAgain = () => {
    navigation.replace('PoseSelection');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
        </View>
        <Text style={styles.title}>Session Complete!</Text>
        <Text style={styles.poseName}>{poseName}</Text>
      </View>

      <View style={styles.scoreCard}>
        <View style={styles.mainScore}>
          <Text style={[styles.scoreValue, { color: getScoreColor(overallScore) }]}>
            {overallScore}
          </Text>
          <Text style={styles.scoreLabel}>{getScoreLabel(overallScore)}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>

          {stabilityScore !== undefined && (
            <View style={styles.statItem}>
              <Ionicons name="body-outline" size={24} color={Colors.secondary} />
              <Text style={styles.statValue}>{stabilityScore}</Text>
              <Text style={styles.statLabel}>Stability</Text>
            </View>
          )}

          {alignmentScore !== undefined && (
            <View style={styles.statItem}>
              <Ionicons name="resize-outline" size={24} color={Colors.warning} />
              <Text style={styles.statValue}>{alignmentScore}</Text>
              <Text style={styles.statLabel}>Alignment</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.feedbackCard}>
        <View style={styles.feedbackHeader}>
          <Ionicons name="bulb-outline" size={24} color={Colors.warning} />
          <Text style={styles.feedbackTitle}>Tips for Improvement</Text>
        </View>
        <View style={styles.feedbackList}>
          <View style={styles.feedbackItem}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.feedbackText}>Good overall posture maintained</Text>
          </View>
          <View style={styles.feedbackItem}>
            <Ionicons name="arrow-forward-circle" size={18} color={Colors.primary} />
            <Text style={styles.feedbackText}>Try holding the pose a bit longer next time</Text>
          </View>
          <View style={styles.feedbackItem}>
            <Ionicons name="arrow-forward-circle" size={18} color={Colors.primary} />
            <Text style={styles.feedbackText}>Focus on keeping your breath steady</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handlePracticeAgain}>
          <Ionicons name="refresh" size={20} color={Colors.background} />
          <Text style={styles.primaryButtonText}>Practice Again</Text>
        </TouchableOpacity>

        <View style={styles.secondaryButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleViewHistory}>
            <Ionicons name="list" size={20} color={Colors.primary} />
            <Text style={styles.secondaryButtonText}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
            <Ionicons name="home" size={20} color={Colors.primary} />
            <Text style={styles.secondaryButtonText}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 32,
  },
  successIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  poseName: {
    fontSize: 18,
    color: Colors.textLight,
  },
  scoreCard: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  mainScore: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 18,
    color: Colors.textLight,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  feedbackCard: {
    backgroundColor: Colors.warningLight,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  feedbackList: {
    gap: 12,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textLight,
  },
  buttonContainer: {
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SessionCompleteScreen;
