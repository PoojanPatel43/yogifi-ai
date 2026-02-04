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
import { useFocusEffect } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, UserStats, Session } from '../types';
import { useAuth } from '../context/AuthContext';
import { getUserStatsApi, getSessionHistoryApi, getProfileApi, updateProfileApi } from '../services/api';
import { getItem, deleteItem } from '../utils/storage';
import { theme } from '../constants/theme';
import { ShimmerLoader, GradientButton } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userGoal, setUserGoal] = useState<string | null>(null);

  // Sync onboarding goals to backend (once, after first login)
  useEffect(() => {
    const syncGoals = async () => {
      try {
        const goalsJson = await getItem('user_goals');
        const fitnessLevel = await getItem('user_fitness_level');

        if (goalsJson || fitnessLevel) {
          const goals = goalsJson ? JSON.parse(goalsJson) : [];
          const goalsString = goals.join(', ');
          if (goalsString) setUserGoal(goalsString);

          await updateProfileApi({
            ...(goalsString ? { goals: goalsString } : {}),
            ...(fitnessLevel ? { fitnessLevel: fitnessLevel as any } : {}),
          });

          await deleteItem('user_goals');
          await deleteItem('user_fitness_level');
        }
      } catch (error) {
        console.log('Error syncing onboarding goals:', error);
      }
    };
    syncGoals();
  }, []);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);

    try {
      const [statsResponse, sessionsResponse, profileResponse] = await Promise.all([
        getUserStatsApi(),
        getSessionHistoryApi(5, 0),
        getProfileApi(),
      ]);

      if (statsResponse.success && statsResponse.data) setStats(statsResponse.data);
      if (sessionsResponse.success && sessionsResponse.data) setRecentSessions(sessionsResponse.data);
      if (profileResponse.success && profileResponse.data?.goals && !userGoal) {
        setUserGoal(profileResponse.data.goals);
      }
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

  // Build weekly insight from sessions
  const getWeeklyInsight = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = recentSessions.filter(
      s => s.createdAt && new Date(s.createdAt) >= weekAgo
    );
    const totalMin = thisWeek.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / 60;
    return { count: thisWeek.length, minutes: Math.round(totalMin) };
  };

  // Build habit dots (last 7 days)
  const getHabitDots = () => {
    const dots: boolean[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const hasSession = recentSessions.some(s => {
        if (!s.createdAt) return false;
        const d = new Date(s.createdAt);
        return d >= day && d < nextDay;
      });
      dots.push(hasSession);
    }
    return dots;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingHeader}>
          <ShimmerLoader width={200} height={20} borderRadius={8} />
          <View style={{ height: 12 }} />
          <ShimmerLoader width={280} height={44} borderRadius={8} />
        </View>
        <View style={{ paddingHorizontal: theme.spacing.screen, gap: 24 }}>
          <ShimmerLoader width="100%" height={80} borderRadius={theme.radius.lg} />
          <ShimmerLoader width="100%" height={56} borderRadius={theme.radius.lg} />
          <ShimmerLoader width="100%" height={56} borderRadius={theme.radius.lg} />
        </View>
      </View>
    );
  }

  const weekly = getWeeklyInsight();
  const habitDots = getHabitDots();

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
      {/* Hero Greeting */}
      <Animatable.View animation="fadeIn" duration={500} style={styles.heroSection}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'Yogi'}</Text>
            {userGoal && (
              <Text style={styles.goalSubtitle}>Focused on {userGoal}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileInitial}>
              {(user?.name || 'Y')[0].toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>

      {/* Habit Dots */}
      <Animatable.View animation="fadeIn" delay={100} duration={500} style={styles.habitSection}>
        <View style={styles.habitRow}>
          {habitDots.map((active, i) => (
            <View
              key={i}
              style={[styles.habitDot, active && styles.habitDotActive]}
            />
          ))}
        </View>
        <Text style={styles.habitLabel}>
          {weekly.count > 0
            ? `${weekly.count} session${weekly.count !== 1 ? 's' : ''} this week`
            : 'No sessions this week yet'}
        </Text>
      </Animatable.View>

      {/* Weekly Stats */}
      {(stats?.totalSessions ?? 0) > 0 && (
        <Animatable.View animation="fadeIn" delay={150} duration={500} style={styles.statsSection}>
          <TouchableOpacity
            style={styles.statsRow}
            onPress={() => navigation.navigate('Progress')}
            activeOpacity={0.7}
          >
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats?.totalSessions ?? 0}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats?.totalMinutes ?? 0}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {stats?.averageScore ? Math.round(stats.averageScore) : '--'}
              </Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats?.currentStreak ?? 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </TouchableOpacity>
        </Animatable.View>
      )}

      {/* Primary CTA */}
      <Animatable.View animation="fadeIn" delay={200} duration={500} style={styles.ctaSection}>
        <GradientButton
          title="Begin Practice"
          onPress={() => navigation.navigate('PoseSelection')}
          variant="dark"
          size="lg"
          style={styles.ctaButton}
        />
        <Text style={styles.ctaHint}>AI-guided yoga with real-time feedback</Text>
      </Animatable.View>

      {/* Feature Links */}
      <Animatable.View animation="fadeIn" delay={300} duration={500} style={styles.linksSection}>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('AIChat')}
          activeOpacity={0.6}
        >
          <View style={styles.linkLeft}>
            <Text style={styles.linkTitle}>AI Wellness Coach</Text>
            <Text style={styles.linkDesc}>Ask about yoga, fitness, or nutrition</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={theme.colors.textTertiary} />
        </TouchableOpacity>

        <View style={styles.linkSeparator} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('FitnessPlanner')}
          activeOpacity={0.6}
        >
          <View style={styles.linkLeft}>
            <Text style={styles.linkTitle}>Fitness Plans</Text>
            <Text style={styles.linkDesc}>AI-generated workout routines</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={theme.colors.textTertiary} />
        </TouchableOpacity>

        <View style={styles.linkSeparator} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('DietPlanner')}
          activeOpacity={0.6}
        >
          <View style={styles.linkLeft}>
            <Text style={styles.linkTitle}>Diet Plans</Text>
            <Text style={styles.linkDesc}>Personalized meal planning</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={theme.colors.textTertiary} />
        </TouchableOpacity>

        <View style={styles.linkSeparator} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('Progress')}
          activeOpacity={0.6}
        >
          <View style={styles.linkLeft}>
            <Text style={styles.linkTitle}>Progress</Text>
            <Text style={styles.linkDesc}>Charts, streaks, and score trends</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={theme.colors.textTertiary} />
        </TouchableOpacity>
      </Animatable.View>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <Animatable.View animation="fadeIn" delay={400} duration={500} style={styles.sessionsSection}>
          <View style={styles.sessionsHeader}>
            <Text style={styles.sessionsTitle}>Recent</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentSessions.slice(0, 3).map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionRow}
              onPress={() => navigation.navigate('SessionDetails', { sessionId: session.id })}
              activeOpacity={0.6}
            >
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionPose}>{session.poseName || 'Yoga Session'}</Text>
                <Text style={styles.sessionMeta}>
                  {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : ''}
                  {session.durationSeconds ? ` \u00B7 ${Math.round(session.durationSeconds / 60)}min` : ''}
                </Text>
              </View>
              <Text style={styles.sessionScore}>
                {session.overallScore ?? '--'}
              </Text>
            </TouchableOpacity>
          ))}
        </Animatable.View>
      )}

      {/* Empty State */}
      {recentSessions.length === 0 && (
        <Animatable.View animation="fadeIn" delay={400} duration={500} style={styles.emptySection}>
          <Text style={styles.emptyText}>
            Start your first session to track your progress
          </Text>
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
    paddingBottom: 60,
  },
  loadingHeader: {
    paddingHorizontal: theme.spacing.screen,
    paddingTop: 80,
    paddingBottom: 40,
  },

  // Hero
  heroSection: {
    paddingHorizontal: theme.spacing.screen,
    paddingTop: 80,
    paddingBottom: theme.spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  goalSubtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.textTertiary,
    marginTop: 4,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    ...theme.typography.h4,
    color: theme.colors.textInverse,
  },

  // Habit Dots
  habitSection: {
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: theme.spacing.lg,
  },
  habitRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  habitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.borderLight,
  },
  habitDotActive: {
    backgroundColor: theme.colors.primary,
  },
  habitLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 13,
  },

  // Stats
  statsSection: {
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: theme.spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.borderLight,
  },

  // CTA
  ctaSection: {
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: theme.spacing.xl,
  },
  ctaButton: {
    width: '100%',
  },
  ctaHint: {
    ...theme.typography.bodySm,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 12,
  },

  // Feature Links
  linksSection: {
    marginHorizontal: theme.spacing.screen,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  linkLeft: {
    flex: 1,
  },
  linkTitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  linkDesc: {
    ...theme.typography.bodySm,
    color: theme.colors.textTertiary,
  },
  linkSeparator: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginLeft: theme.spacing.md,
  },

  // Sessions
  sessionsSection: {
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: theme.spacing.lg,
  },
  sessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sessionsTitle: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  viewAllText: {
    ...theme.typography.bodySm,
    color: theme.colors.primary,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionPose: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  sessionMeta: {
    ...theme.typography.bodySm,
    color: theme.colors.textTertiary,
  },
  sessionScore: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },

  // Empty
  emptySection: {
    paddingHorizontal: theme.spacing.screen,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
});

export default HomeScreen;
