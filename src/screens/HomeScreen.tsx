import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, UserStats, Session } from '../types';
import { useAuth } from '../context/AuthContext';
import { getUserStatsApi, getSessionHistoryApi } from '../services/api';
import Colors from '../constants/colors';

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

  const renderRecentSession = (session: Session) => (
    <TouchableOpacity
      key={session.id}
      style={styles.sessionCard}
      onPress={() => navigation.navigate('SessionDetails', { sessionId: session.id })}
    >
      <View style={styles.sessionIcon}>
        <Ionicons name="fitness" size={24} color={Colors.primary} />
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionPose}>{session.poseName || 'Yoga Session'}</Text>
        <Text style={styles.sessionDate}>
          {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'Unknown date'}
        </Text>
      </View>
      <View style={styles.sessionScore}>
        <Text style={styles.scoreValue}>{session.overallScore ?? '--'}</Text>
        <Text style={styles.scoreLabel}>score</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name || 'Yogi'}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle-outline" size={40} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Ready to Practice?</Text>
        <Text style={styles.heroSubtitle}>
          Get real-time AI feedback on your yoga poses
        </Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('PoseSelection')}
        >
          <Ionicons name="play" size={20} color={Colors.background} />
          <Text style={styles.startButtonText}>Start Practice</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Ionicons name="calendar" size={24} color={Colors.primary} />
          <Text style={styles.statNumber}>{stats?.totalSessions ?? 0}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="time" size={24} color={Colors.success} />
          <Text style={styles.statNumber}>{stats?.totalMinutes ?? 0}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="trophy" size={24} color={Colors.warning} />
          <Text style={styles.statNumber}>
            {stats?.averageScore ? Math.round(stats.averageScore) : '--'}
          </Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
      </View>

      {stats?.currentStreak !== undefined && stats.currentStreak > 0 && (
        <View style={styles.streakCard}>
          <Ionicons name="flame" size={24} color={Colors.secondary} />
          <Text style={styles.streakText}>
            {stats.currentStreak} day streak! Keep it up!
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {recentSessions.length > 0 ? (
        recentSessions.map(renderRecentSession)
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="fitness-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyStateText}>No sessions yet</Text>
          <Text style={styles.emptyStateSubtext}>Start your first yoga practice!</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textLight,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  profileButton: {
    padding: 4,
  },
  heroCard: {
    backgroundColor: Colors.primaryLight,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondaryLight,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  streakText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sessionPose: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  sessionDate: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sessionScore: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  scoreLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    marginHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textLight,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
});

export default HomeScreen;
