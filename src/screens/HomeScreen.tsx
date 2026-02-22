import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, UserStats, Session } from '../types';
import { useAuth } from '../context/AuthContext';
import { getUserStatsApi, getSessionHistoryApi, getProfileApi, updateProfileApi } from '../services/api';
import { getItem, deleteItem } from '../utils/storage';
import { ShimmerLoader } from '../components/ui';

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
        <View style={{ paddingHorizontal: 24, gap: 24 }}>
          <ShimmerLoader width="100%" height={80} borderRadius={16} />
          <ShimmerLoader width="100%" height={56} borderRadius={16} />
          <ShimmerLoader width="100%" height={56} borderRadius={16} />
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
          tintColor="#6d003f"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Text style={styles.logo}>Yogifi</Text>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileInitial}>
              {(user?.name || 'Y')[0].toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Greeting */}
      <Animatable.View animation="fadeIn" duration={500} style={styles.heroSection}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.userName}>{user?.name || 'Yogi'}</Text>
        {userGoal && (
          <View style={styles.goalBadge}>
            <Text style={styles.goalText}>Focused on {userGoal}</Text>
          </View>
        )}
      </Animatable.View>

      {/* Habit Tracking Card */}
      <Animatable.View animation="fadeInUp" delay={100} duration={500} style={styles.habitCard}>
        <Text style={styles.habitTitle}>Weekly Progress</Text>
        <View style={styles.habitRow}>
          {habitDots.map((active, i) => (
            <View key={i} style={styles.habitDayContainer}>
              <View style={[styles.habitDot, active && styles.habitDotActive]} />
              <Text style={styles.habitDayLabel}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'][(new Date().getDay() - 6 + i + 7) % 7]}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.habitLabel}>
          {weekly.count > 0
            ? `${weekly.count} session${weekly.count !== 1 ? 's' : ''} this week · ${weekly.minutes} min`
            : 'Start your first session this week'}
        </Text>
      </Animatable.View>

      {/* Stats Grid */}
      {(stats?.totalSessions ?? 0) > 0 && (
        <Animatable.View animation="fadeInUp" delay={150} duration={500} style={styles.statsSection}>
          <TouchableOpacity
            style={styles.statsCard}
            onPress={() => navigation.navigate('Progress')}
            activeOpacity={0.7}
          >
            <View style={styles.statsRow}>
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
            </View>
            <View style={styles.statsHint}>
              <Text style={styles.statsHintText}>Tap to view progress</Text>
              <Ionicons name="arrow-forward" size={14} color="#999" />
            </View>
          </TouchableOpacity>
        </Animatable.View>
      )}

      {/* Primary CTA */}
      <Animatable.View animation="fadeInUp" delay={200} duration={500} style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('PoseSelection')}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>Begin Practice</Text>
        </TouchableOpacity>
        <Text style={styles.ctaHint}>AI-guided yoga with real-time feedback</Text>
      </Animatable.View>

      {/* Feature Cards */}
      <Animatable.View animation="fadeInUp" delay={300} duration={500} style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Explore</Text>

        <View style={styles.featureGrid}>
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('AIChat')}
            activeOpacity={0.7}
          >
            <View style={[styles.featureIcon, { backgroundColor: '#f0e6eb' }]}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#6d003f" />
            </View>
            <Text style={styles.featureTitle}>AI Coach</Text>
            <Text style={styles.featureDesc}>Ask about yoga & wellness</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('FitnessPlanner')}
            activeOpacity={0.7}
          >
            <View style={[styles.featureIcon, { backgroundColor: '#e8f5ee' }]}>
              <Ionicons name="fitness" size={24} color="#4a8c6f" />
            </View>
            <Text style={styles.featureTitle}>Fitness Plans</Text>
            <Text style={styles.featureDesc}>AI workout routines</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('DietPlanner')}
            activeOpacity={0.7}
          >
            <View style={[styles.featureIcon, { backgroundColor: '#fef3e6' }]}>
              <Ionicons name="nutrition" size={24} color="#b8860b" />
            </View>
            <Text style={styles.featureTitle}>Diet Plans</Text>
            <Text style={styles.featureDesc}>Personalized meals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('Progress')}
            activeOpacity={0.7}
          >
            <View style={[styles.featureIcon, { backgroundColor: '#e6f0fa' }]}>
              <Ionicons name="stats-chart" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.featureTitle}>Progress</Text>
            <Text style={styles.featureDesc}>Charts & trends</Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <Animatable.View animation="fadeInUp" delay={400} duration={500} style={styles.sessionsSection}>
          <View style={styles.sessionsHeader}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentSessions.slice(0, 3).map((session, index) => (
            <TouchableOpacity
              key={session.id}
              style={[
                styles.sessionCard,
                index === recentSessions.slice(0, 3).length - 1 && styles.sessionCardLast,
              ]}
              onPress={() => navigation.navigate('SessionDetails', { sessionId: session.id })}
              activeOpacity={0.7}
            >
              <View style={styles.sessionLeft}>
                <Text style={styles.sessionPose}>{session.poseName || 'Yoga Session'}</Text>
                <Text style={styles.sessionMeta}>
                  {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : ''}
                  {session.durationSeconds ? ` · ${Math.round(session.durationSeconds / 60)}min` : ''}
                </Text>
              </View>
              <View style={styles.sessionRight}>
                <Text style={styles.sessionScore}>{session.overallScore ?? '--'}</Text>
                <Text style={styles.sessionScoreLabel}>score</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Animatable.View>
      )}

      {/* Empty State */}
      {recentSessions.length === 0 && (
        <Animatable.View animation="fadeIn" delay={400} duration={500} style={styles.emptyCard}>
          <Ionicons name="leaf-outline" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>Ready to begin?</Text>
          <Text style={styles.emptyText}>
            Start your first session to track your progress and unlock personalized insights.
          </Text>
        </Animatable.View>
      )}

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingHeader: {
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
  },

  // Header
  header: {
    backgroundColor: '#fafafa',
    paddingTop: Platform.OS === 'web' ? 16 : 60,
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  logo: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'Inter_600SemiBold',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
  },

  // Hero
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 16,
    color: '#999',
    marginBottom: 4,
    fontFamily: 'DMSans_400Regular',
  },
  userName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  goalBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  goalText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },

  // Habit Card
  habitCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  habitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  habitDayContainer: {
    alignItems: 'center',
    gap: 6,
  },
  habitDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  habitDotActive: {
    backgroundColor: '#6d003f',
  },
  habitDayLabel: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Inter_500Medium',
  },
  habitLabel: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'DMSans_400Regular',
  },

  // Stats
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
  },
  statsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 4,
  },
  statsHintText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'DMSans_400Regular',
  },

  // CTA
  ctaSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  ctaButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
  },
  ctaHint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    fontFamily: 'DMSans_400Regular',
  },

  // Features
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    fontFamily: 'Inter_500Medium',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
      },
    }),
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  featureDesc: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'DMSans_400Regular',
  },

  // Sessions
  sessionsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#6d003f',
    fontFamily: 'Inter_500Medium',
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
      },
    }),
  },
  sessionCardLast: {
    marginBottom: 0,
  },
  sessionLeft: {
    flex: 1,
  },
  sessionPose: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  sessionMeta: {
    fontSize: 13,
    color: '#999',
    fontFamily: 'DMSans_400Regular',
  },
  sessionRight: {
    alignItems: 'center',
    paddingLeft: 16,
  },
  sessionScore: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Inter_700Bold',
  },
  sessionScoreLabel: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    fontFamily: 'Inter_500Medium',
  },

  // Empty
  emptyCard: {
    marginHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'DMSans_400Regular',
  },
});

export default HomeScreen;
