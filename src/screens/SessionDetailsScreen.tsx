import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Session } from '../types';
import { getSessionByIdApi } from '../services/api';
import Colors from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionDetails'>;

const SessionDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getSessionByIdApi(sessionId);
      if (response.success && response.data) {
        setSession(response.data);
      } else {
        setError(response.error || 'Failed to load session');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number | null | undefined): string => {
    if (!score) return Colors.textMuted;
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.error;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return Colors.success;
      case 'CANCELLED':
        return Colors.error;
      case 'IN_PROGRESS':
        return Colors.warning;
      default:
        return Colors.textMuted;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorText}>{error || 'Session not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSession}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Details</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.sessionHeader}>
        <View style={styles.sessionIcon}>
          <Ionicons name="fitness" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.poseName}>{session.poseName || 'Yoga Session'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(session.status) }]}>
            {session.status}
          </Text>
        </View>
      </View>

      <View style={styles.dateInfo}>
        <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
        <Text style={styles.dateText}>{formatDate(session.createdAt)}</Text>
        <Text style={styles.timeText}>{formatTime(session.createdAt)}</Text>
      </View>

      <View style={styles.scoreCard}>
        <View style={styles.mainScore}>
          <Text style={[styles.scoreValue, { color: getScoreColor(session.overallScore) }]}>
            {session.overallScore ?? '--'}
          </Text>
          <Text style={styles.scoreLabel}>Overall Score</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{formatDuration(session.durationSeconds)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>

          {session.stabilityScore !== undefined && session.stabilityScore !== null && (
            <View style={styles.statItem}>
              <Ionicons name="body-outline" size={24} color={Colors.secondary} />
              <Text style={styles.statValue}>{session.stabilityScore}</Text>
              <Text style={styles.statLabel}>Stability</Text>
            </View>
          )}

          {session.alignmentScore !== undefined && session.alignmentScore !== null && (
            <View style={styles.statItem}>
              <Ionicons name="resize-outline" size={24} color={Colors.warning} />
              <Text style={styles.statValue}>{session.alignmentScore}</Text>
              <Text style={styles.statLabel}>Alignment</Text>
            </View>
          )}
        </View>
      </View>

      {session.feedback && (
        <View style={styles.feedbackCard}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
            <Text style={styles.feedbackTitle}>Feedback</Text>
          </View>
          <Text style={styles.feedbackText}>{session.feedback}</Text>
        </View>
      )}

      {session.mistakes && session.mistakes.length > 0 && (
        <View style={styles.mistakesCard}>
          <View style={styles.mistakesHeader}>
            <Ionicons name="warning-outline" size={20} color={Colors.warning} />
            <Text style={styles.mistakesTitle}>Areas to Improve</Text>
          </View>
          {session.mistakes.map((mistake, index) => (
            <View key={mistake.id || index} style={styles.mistakeItem}>
              <View style={[styles.severityDot, { backgroundColor: getSeverityColor(mistake.severity) }]} />
              <View style={styles.mistakeInfo}>
                <Text style={styles.mistakeJoint}>{mistake.joint}</Text>
                <Text style={styles.mistakeDescription}>
                  {mistake.description || mistake.mistakeType}
                </Text>
                {mistake.correction && (
                  <Text style={styles.mistakeCorrection}>{mistake.correction}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.practiceButton}
        onPress={() => navigation.navigate('PoseSelection')}
      >
        <Ionicons name="refresh" size={20} color={Colors.background} />
        <Text style={styles.practiceButtonText}>Practice Again</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'CRITICAL':
      return Colors.error;
    case 'HIGH':
      return Colors.secondary;
    case 'MEDIUM':
      return Colors.warning;
    case 'LOW':
      return Colors.success;
    default:
      return Colors.textMuted;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  sessionHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sessionIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  poseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  timeText: {
    fontSize: 14,
    color: Colors.textMuted,
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
    fontSize: 64,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 16,
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
    fontSize: 22,
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
    backgroundColor: Colors.primaryLight,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  feedbackText: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 22,
  },
  mistakesCard: {
    backgroundColor: Colors.warningLight,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  mistakesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  mistakesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  mistakeItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  mistakeInfo: {
    flex: 1,
  },
  mistakeJoint: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  mistakeDescription: {
    fontSize: 13,
    color: Colors.textLight,
  },
  mistakeCorrection: {
    fontSize: 13,
    color: Colors.success,
    marginTop: 4,
    fontStyle: 'italic',
  },
  practiceButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  practiceButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 12,
    padding: 8,
  },
  backLinkText: {
    color: Colors.primary,
    fontSize: 16,
  },
});

export default SessionDetailsScreen;
