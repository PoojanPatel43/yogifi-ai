import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, UserStats, Session } from '../types';
import { useAuth } from '../context/AuthContext';
import { getUserStatsApi, getSessionHistoryApi } from '../services/api';
import { theme } from '../constants/theme';
import { ShimmerLoader, GradientButton } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);

    try {
      const [statsResponse, sessionsResponse] = await Promise.all([
        getUserStatsApi(),
        getSessionHistoryApi(3, 0),
      ]);

      if (statsResponse.success && statsResponse.data) setStats(statsResponse.data);
      if (sessionsResponse.success && sessionsResponse.data) setRecentSessions(sessionsResponse.data);
    } catch (error) {
      console.log('Error fetching home data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getScoreColor = (score: number | null | undefined): string => {
    if (!score) return theme.colors.textTertiary;
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.warning;
    return theme.colors.accent;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <ShimmerLoader width={120} height={16} borderRadius={8} />
            <View style={{ height: 8 }} />
            <ShimmerLoader width={200} height={36} borderRadius={8} />
          </View>
          <ShimmerLoader width={48} height={48} borderRadius={24} />
        </View>
        <View style={{ paddingHorizontal: theme.spacing.screen }}>
          <ShimmerLoader width="100%" height={180} borderRadius={theme.radius.xl} style={{ marginBottom: 24 }} />
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <ShimmerLoader width="31%" height={120} borderRadius={theme.radius.lg} />
            <ShimmerLoader width="31%" height={120} borderRadius={theme.radius.lg} />
            <ShimmerLoader width="31%" height={120} borderRadius={theme.radius.lg} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => fetchData(true)}
          tintColor={theme.colors.primaryDark}
        />
      }
    >
      {/* Header */}
      <Animatable.View animation="fadeIn" duration={400} style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name || 'Yogi'}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <LinearGradient
            colors={theme.gradients.primary as any}
            style={styles.profileGradient}
          >
            <Text style={styles.profileInitial}>
              {(user?.name || 'Y')[0].toUpperCase()}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>

      {/* Stats Bar */}
      <Animatable.View animation="fadeInUp" delay={100} duration={500} style={styles.statsBar}>
        <View style={styles.statPill}>
          <Ionicons name="flame" size={16} color="#ffcdc1" />
          <Text style={styles.statPillValue}>{stats?.currentStreak ?? 0}</Text>
          <Text style={styles.statPillLabel}>streak</Text>
        </View>
        <View style={styles.statPill}>
          <Ionicons name="time-outline" size={16} color={theme.colors.secondary} />
          <Text style={styles.statPillValue}>{stats?.totalMinutes ?? 0}</Text>
          <Text style={styles.statPillLabel}>min</Text>
        </View>
        <View style={styles.statPill}>
          <Ionicons name="trophy-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.statPillValue}>
            {stats?.averageScore ? Math.round(stats.averageScore) : '--'}
          </Text>
          <Text style={styles.statPillLabel}>avg</Text>
        </View>
      </Animatable.View>

      {/* Main Action Card */}
      <Animatable.View animation="fadeInUp" delay={200} duration={500}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('PoseSelection')}
        >
          <LinearGradient
            colors={theme.gradients.primary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainActionCard}
          >
            <View style={styles.mainActionContent}>
              <Text style={styles.mainActionTitle}>Start Yoga Session</Text>
              <Text style={styles.mainActionSubtitle}>
                Get real-time AI feedback on your poses
              </Text>
              <View style={styles.mainActionBtn}>
                <Ionicons name="play" size={18} color={theme.colors.text} />
                <Text style={styles.mainActionBtnText}>Begin Practice</Text>
              </View>
            </View>
            <View style={styles.mainActionDecor} />
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>

      {/* Two-Column Actions */}
      <Animatable.View animation="fadeInUp" delay={300} duration={500} style={styles.twoColRow}>
        <TouchableOpacity
          style={styles.twoColCard}
          onPress={() => navigation.navigate('AIChat')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={theme.gradients.accent as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.twoColGradient}
          >
            <Ionicons name="chatbubbles-outline" size={28} color={theme.colors.text} />
            <Text style={styles.twoColTitle}>AI Coach</Text>
            <Text style={styles.twoColDesc}>Chat now</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.twoColCard}
          onPress={() => navigation.navigate('FitnessPlanner')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={theme.gradients.success as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.twoColGradient}
          >
            <Ionicons name="barbell-outline" size={28} color={theme.colors.text} />
            <Text style={styles.twoColTitle}>Plans</Text>
            <Text style={styles.twoColDesc}>Fitness & Diet</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>

      {/* Recent Sessions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentSessions.length > 0 ? (
        recentSessions.map((session, index) => (
          <Animatable.View key={session.id} animation="fadeInUp" delay={400 + index * 80} duration={400}>
            <TouchableOpacity
              style={styles.sessionCard}
              onPress={() => navigation.navigate('SessionDetails', { sessionId: session.id })}
              activeOpacity={0.7}
            >
              <View style={styles.sessionIcon}>
                <Ionicons name="fitness" size={22} color={theme.colors.primaryDark} />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionPose}>{session.poseName || 'Yoga Session'}</Text>
                <Text style={styles.sessionDate}>
                  {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'Unknown date'}
                </Text>
              </View>
              <View style={styles.sessionScore}>
                <Text style={[styles.scoreValue, { color: getScoreColor(session.overallScore) }]}>
                  {session.overallScore ?? '--'}
                </Text>
                <Text style={styles.scoreLabel}>score</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </Animatable.View>
        ))
      ) : (
        <Animatable.View animation="fadeIn" delay={400} duration={400}>
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="fitness-outline" size={40} color={theme.colors.textTertiary} />
            </View>
            <Text style={styles.emptyStateText}>No sessions yet</Text>
            <Text style={styles.emptyStateSubtext}>Start your first yoga practice!</Text>
            <GradientButton
              title="Begin Practice"
              onPress={() => navigation.navigate('PoseSelection')}
              variant="accent"
              size="sm"
              style={{ marginTop: 24 }}
            />
          </View>
        </Animatable.View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screen,
    paddingTop: 64,
    paddingBottom: 24,
  },
  greeting: {
    ...theme.typography.bodySm,
    color: theme.colors.textTertiary,
    marginBottom: 4,
  },
  userName: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  profileButton: {
    ...theme.shadows.md,
  },
  profileGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    ...theme.typography.h4,
    color: theme.colors.text,
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.screen,
    gap: 12,
    marginBottom: 24,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  statPillValue: {
    ...theme.typography.bodySmMedium,
    color: theme.colors.text,
  },
  statPillLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 12,
  },

  // Main Action Card
  mainActionCard: {
    marginHorizontal: theme.spacing.screen,
    borderRadius: theme.radius['2xl'],
    padding: 32,
    marginBottom: 16,
    overflow: 'hidden',
    minHeight: 180,
    justifyContent: 'center',
  },
  mainActionContent: {
    zIndex: 1,
  },
  mainActionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: 8,
  },
  mainActionSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: 24,
  },
  mainActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
    alignSelf: 'flex-start',
    ...theme.shadows.sm,
  },
  mainActionBtnText: {
    ...theme.typography.button,
    color: theme.colors.text,
  },
  mainActionDecor: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Two Column Actions
  twoColRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.screen,
    gap: 12,
    marginBottom: 32,
  },
  twoColCard: {
    flex: 1,
  },
  twoColGradient: {
    borderRadius: theme.radius.xl,
    padding: 24,
    minHeight: 140,
    justifyContent: 'flex-end',
  },
  twoColTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 2,
  },
  twoColDesc: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screen,
    marginBottom: 16,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  seeAllText: {
    ...theme.typography.bodySmMedium,
    color: theme.colors.primaryDark,
  },

  // Session Card
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.screen,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 14,
  },
  sessionPose: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
  },
  sessionDate: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  sessionScore: {
    alignItems: 'center',
    marginRight: 8,
  },
  scoreValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    fontWeight: '700',
  },
  scoreLabel: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
    fontSize: 10,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    marginHorizontal: theme.spacing.screen,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
  },
  emptyStateSubtext: {
    ...theme.typography.bodySm,
    color: theme.colors.textTertiary,
    marginTop: 4,
  },
});

export default HomeScreen;
