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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, UserStats, Session } from '../types';
import { useAuth } from '../context/AuthContext';
import { getUserStatsApi, getSessionHistoryApi } from '../services/api';
import { theme } from '../constants/theme';
import { AnimatedCard, ShimmerLoader, GradientButton } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    }

    try {
      const [statsResponse, sessionsResponse] = await Promise.all([
        getUserStatsApi(),
        getSessionHistoryApi(3, 0),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (sessionsResponse.success && sessionsResponse.data) {
        setRecentSessions(sessionsResponse.data);
      }
    } catch (error) {
      console.log('Error fetching home data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

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

  const renderRecentSession = (session: Session, index: number) => (
    <AnimatedCard key={session.id} index={index + 4} enterFrom="bottom">
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => navigation.navigate('SessionDetails', { sessionId: session.id })}
        activeOpacity={0.7}
      >
        <View style={styles.sessionIcon}>
          <Ionicons name="fitness" size={22} color={theme.colors.primary} />
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
    </AnimatedCard>
  );

  // Skeleton Loading State
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <ShimmerLoader width={120} height={16} borderRadius={8} />
            <View style={{ height: 8 }} />
            <ShimmerLoader width={160} height={28} borderRadius={8} />
          </View>
          <ShimmerLoader width={44} height={44} borderRadius={22} />
        </View>
        <View style={{ paddingHorizontal: theme.spacing.screen }}>
          <ShimmerLoader width="100%" height={160} borderRadius={theme.radius.xl} style={{ marginBottom: theme.spacing['2xl'] }} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ShimmerLoader width="31%" height={110} borderRadius={theme.radius.lg} />
            <ShimmerLoader width="31%" height={110} borderRadius={theme.radius.lg} />
            <ShimmerLoader width="31%" height={110} borderRadius={theme.radius.lg} />
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
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Header with Greeting */}
      <AnimatedCard index={0} enterFrom="left">
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'Yogi'}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}
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
        </View>
      </AnimatedCard>

      {/* Hero Card */}
      <AnimatedCard index={1} enterFrom="scale">
        <LinearGradient
          colors={theme.gradients.primaryToSecondary as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Ready to Practice?</Text>
            <Text style={styles.heroSubtitle}>
              Get real-time AI feedback on your yoga poses
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => navigation.navigate('PoseSelection')}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={18} color={theme.colors.primary} />
              <Text style={styles.startButtonText}>Start Practice</Text>
            </TouchableOpacity>
          </View>
          {/* Decorative circle */}
          <View style={styles.heroDecoration} />
        </LinearGradient>
      </AnimatedCard>

      {/* Stats Bento Grid */}
      <View style={styles.statsContainer}>
        <AnimatedCard index={2} style={styles.statBox}>
          <View style={[styles.statIconBg, { backgroundColor: theme.colors.primaryMuted }]}>
            <Ionicons name="calendar" size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.statNumber}>{stats?.totalSessions ?? 0}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
          <View style={[styles.statAccent, { backgroundColor: theme.colors.primary }]} />
        </AnimatedCard>

        <AnimatedCard index={3} style={styles.statBox}>
          <View style={[styles.statIconBg, { backgroundColor: theme.colors.successMuted }]}>
            <Ionicons name="time" size={20} color={theme.colors.success} />
          </View>
          <Text style={styles.statNumber}>{stats?.totalMinutes ?? 0}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
          <View style={[styles.statAccent, { backgroundColor: theme.colors.success }]} />
        </AnimatedCard>

        <AnimatedCard index={4} style={styles.statBox}>
          <View style={[styles.statIconBg, { backgroundColor: theme.colors.warningMuted }]}>
            <Ionicons name="trophy" size={20} color={theme.colors.warning} />
          </View>
          <Text style={styles.statNumber}>
            {stats?.averageScore ? Math.round(stats.averageScore) : '--'}
          </Text>
          <Text style={styles.statLabel}>Avg Score</Text>
          <View style={[styles.statAccent, { backgroundColor: theme.colors.warning }]} />
        </AnimatedCard>
      </View>

      {/* Streak Card */}
      {stats?.currentStreak !== undefined && stats.currentStreak > 0 && (
        <AnimatedCard index={5}>
          <LinearGradient
            colors={theme.gradients.sunset as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.streakCard}
          >
            <Ionicons name="flame" size={28} color={theme.colors.textInverse} />
            <View style={styles.streakContent}>
              <Text style={styles.streakNumber}>{stats.currentStreak} day streak!</Text>
              <Text style={styles.streakSubtext}>Keep it up!</Text>
            </View>
          </LinearGradient>
        </AnimatedCard>
      )}

      {/* Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>
      <View style={styles.quickActionsGrid}>
        <AnimatedCard index={5} enterFrom="bottom" style={styles.quickActionCard}>
          <TouchableOpacity
            style={[styles.quickAction, { borderColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('PoseSelection')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primaryMuted }]}>
              <Ionicons name="fitness-outline" size={24} color={theme.colors.primaryDark} />
            </View>
            <Text style={styles.quickActionTitle}>Start Yoga</Text>
            <Text style={styles.quickActionDesc}>AI pose guidance</Text>
          </TouchableOpacity>
        </AnimatedCard>

        <AnimatedCard index={6} enterFrom="bottom" style={styles.quickActionCard}>
          <TouchableOpacity
            style={[styles.quickAction, { borderColor: theme.colors.secondary }]}
            onPress={() => navigation.navigate('AIChat')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.secondaryMuted }]}>
              <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.secondaryDark} />
            </View>
            <Text style={styles.quickActionTitle}>AI Chat</Text>
            <Text style={styles.quickActionDesc}>Wellness advice</Text>
          </TouchableOpacity>
        </AnimatedCard>

        <AnimatedCard index={7} enterFrom="bottom" style={styles.quickActionCard}>
          <TouchableOpacity
            style={[styles.quickAction, { borderColor: theme.colors.success }]}
            onPress={() => navigation.navigate('FitnessPlanner')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.successMuted }]}>
              <Ionicons name="barbell-outline" size={24} color={theme.colors.success} />
            </View>
            <Text style={styles.quickActionTitle}>Fitness Plan</Text>
            <Text style={styles.quickActionDesc}>Custom workouts</Text>
          </TouchableOpacity>
        </AnimatedCard>

        <AnimatedCard index={8} enterFrom="bottom" style={styles.quickActionCard}>
          <TouchableOpacity
            style={[styles.quickAction, { borderColor: theme.colors.accent }]}
            onPress={() => navigation.navigate('DietPlanner')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.accentMuted }]}>
              <Ionicons name="nutrition-outline" size={24} color={theme.colors.accent} />
            </View>
            <Text style={styles.quickActionTitle}>Diet Plan</Text>
            <Text style={styles.quickActionDesc}>Meal planning</Text>
          </TouchableOpacity>
        </AnimatedCard>
      </View>

      {/* Recent Sessions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {recentSessions.length > 0 ? (
        recentSessions.map((session, index) => renderRecentSession(session, index))
      ) : (
        <AnimatedCard index={4}>
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="fitness-outline" size={40} color={theme.colors.textTertiary} />
            </View>
            <Text style={styles.emptyStateText}>No sessions yet</Text>
            <Text style={styles.emptyStateSubtext}>Start your first yoga practice!</Text>
            <GradientButton
              title="Begin Practice"
              onPress={() => navigation.navigate('PoseSelection')}
              size="sm"
              style={{ marginTop: theme.spacing.xl }}
            />
          </View>
        </AnimatedCard>
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
    paddingBottom: theme.spacing.xl,
  },
  greeting: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  userName: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  profileButton: {
    ...theme.shadows.md,
  },
  profileGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
  // Hero Card
  heroCard: {
    marginHorizontal: theme.spacing.screen,
    borderRadius: theme.radius.xl,
    padding: theme.spacing['2xl'],
    marginBottom: theme.spacing['2xl'],
    overflow: 'hidden',
    ...theme.shadows.colored(theme.colors.primary),
  },
  heroContent: {
    zIndex: 1,
  },
  heroTitle: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    ...theme.typography.bodySm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    ...theme.shadows.sm,
  },
  startButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
  heroDecoration: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.screen,
    gap: theme.spacing.md,
    marginBottom: theme.spacing['2xl'],
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statNumber: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: 2,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  statAccent: {
    position: 'absolute',
    top: 0,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    height: 2,
    borderRadius: 1,
  },
  // Streak
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.screen,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing['2xl'],
    gap: theme.spacing.md,
    ...theme.shadows.glow(theme.colors.warning),
  },
  streakContent: {
    flex: 1,
  },
  streakNumber: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textInverse,
    fontWeight: '700',
  },
  streakSubtext: {
    ...theme.typography.bodySm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screen,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  seeAllText: {
    ...theme.typography.bodySmMedium,
    color: theme.colors.primary,
  },
  // Session Card
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.screen,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
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
    marginRight: theme.spacing.sm,
  },
  scoreValue: {
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
    paddingVertical: theme.spacing['4xl'],
    marginHorizontal: theme.spacing.screen,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    ...theme.shadows.sm,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyStateText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
  },
  emptyStateSubtext: {
    ...theme.typography.bodySm,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  },
  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.screen,
    gap: theme.spacing.md,
    marginBottom: theme.spacing['2xl'],
  },
  quickActionCard: {
    width: '47%',
  },
  quickAction: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  quickActionTitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  quickActionDesc: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
});

export default HomeScreen;
