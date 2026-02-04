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
import * as Animatable from 'react-native-animatable';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, UserStats, Session } from '../types';
import { getUserStatsApi, getSessionHistoryApi } from '../services/api';
import { theme } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Progress'>;

const CHART_HEIGHT = 160;
const BAR_WIDTH = 28;
const CHART_PADDING_BOTTOM = 24;

const ProgressScreen: React.FC<Props> = ({ navigation }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);

    try {
      const [statsRes, sessionsRes] = await Promise.all([
        getUserStatsApi(),
        getSessionHistoryApi(50, 0),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (sessionsRes.success && sessionsRes.data) setSessions(sessionsRes.data);
    } catch (error) {
      console.log('Error fetching progress data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useFocusEffect(useCallback(() => { fetchData(); }, []));

  // Build 7-day data for bar chart
  const getLast7Days = () => {
    const days: { label: string; minutes: number; score: number; count: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const daySessions = sessions.filter(s => {
        if (!s.createdAt) return false;
        const d = new Date(s.createdAt);
        return d >= day && d < nextDay;
      });

      const totalMin = daySessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / 60;
      const avgScore = daySessions.length > 0
        ? daySessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / daySessions.length
        : 0;

      days.push({
        label: day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
        minutes: Math.round(totalMin),
        score: Math.round(avgScore),
        count: daySessions.length,
      });
    }

    return days;
  };

  // Build 30-day score trend
  const get30DayTrend = () => {
    const now = new Date();
    const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentSessions = sessions
      .filter(s => s.createdAt && new Date(s.createdAt) >= thirtyAgo && s.overallScore)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());

    if (recentSessions.length < 2) return null;

    const firstHalf = recentSessions.slice(0, Math.floor(recentSessions.length / 2));
    const secondHalf = recentSessions.slice(Math.floor(recentSessions.length / 2));

    const firstAvg = firstHalf.reduce((sum, s) => sum + (s.overallScore || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + (s.overallScore || 0), 0) / secondHalf.length;

    const change = secondAvg - firstAvg;
    return { firstAvg: Math.round(firstAvg), secondAvg: Math.round(secondAvg), change: Math.round(change) };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const weekData = getLast7Days();
  const maxMinutes = Math.max(...weekData.map(d => d.minutes), 1);
  const trend = get30DayTrend();
  const totalWeekSessions = weekData.reduce((sum, d) => sum + d.count, 0);
  const totalWeekMinutes = weekData.reduce((sum, d) => sum + d.minutes, 0);

  const chartWidth = weekData.length * (BAR_WIDTH + 16) + 16;

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Hero Stats */}
      <Animatable.View animation="fadeIn" duration={500} style={styles.heroSection}>
        <Text style={styles.heroNumber}>{stats?.totalSessions ?? 0}</Text>
        <Text style={styles.heroLabel}>Total Sessions</Text>
      </Animatable.View>

      {/* Summary Stats Row */}
      <Animatable.View animation="fadeIn" delay={100} duration={500} style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats?.totalMinutes ?? 0}</Text>
            <Text style={styles.summaryLabel}>Minutes</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {stats?.averageScore ? Math.round(stats.averageScore) : '--'}
            </Text>
            <Text style={styles.summaryLabel}>Avg Score</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats?.currentStreak ?? 0}</Text>
            <Text style={styles.summaryLabel}>Streak</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats?.posesCompleted ?? 0}</Text>
            <Text style={styles.summaryLabel}>Poses</Text>
          </View>
        </View>
      </Animatable.View>

      {/* 7-Day Bar Chart */}
      <Animatable.View animation="fadeIn" delay={200} duration={500} style={styles.chartSection}>
        <Text style={styles.sectionTitle}>LAST 7 DAYS</Text>
        <Text style={styles.chartSubtitle}>
          {totalWeekSessions} session{totalWeekSessions !== 1 ? 's' : ''}, {totalWeekMinutes} min total
        </Text>

        <View style={styles.chartContainer}>
          <Svg width={chartWidth} height={CHART_HEIGHT + CHART_PADDING_BOTTOM} style={styles.chart}>
            {/* Baseline */}
            <Line
              x1={0}
              y1={CHART_HEIGHT}
              x2={chartWidth}
              y2={CHART_HEIGHT}
              stroke={theme.colors.borderLight}
              strokeWidth={1}
            />

            {weekData.map((day, i) => {
              const barHeight = maxMinutes > 0 ? (day.minutes / maxMinutes) * (CHART_HEIGHT - 24) : 0;
              const x = 16 + i * (BAR_WIDTH + 16);
              const y = CHART_HEIGHT - barHeight;
              const hasData = day.minutes > 0;

              return (
                <React.Fragment key={i}>
                  {/* Bar */}
                  <Rect
                    x={x}
                    y={hasData ? y : CHART_HEIGHT - 4}
                    width={BAR_WIDTH}
                    height={hasData ? barHeight : 4}
                    rx={6}
                    fill={hasData ? theme.colors.primary : theme.colors.borderLight}
                  />

                  {/* Minutes label on top */}
                  {hasData && (
                    <SvgText
                      x={x + BAR_WIDTH / 2}
                      y={y - 6}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight="600"
                      fill={theme.colors.text}
                    >
                      {day.minutes}
                    </SvgText>
                  )}

                  {/* Day label */}
                  <SvgText
                    x={x + BAR_WIDTH / 2}
                    y={CHART_HEIGHT + 16}
                    textAnchor="middle"
                    fontSize={11}
                    fill={theme.colors.textTertiary}
                  >
                    {day.label}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </View>
      </Animatable.View>

      {/* 30-Day Trend */}
      {trend && (
        <Animatable.View animation="fadeIn" delay={300} duration={500} style={styles.trendSection}>
          <Text style={styles.sectionTitle}>30-DAY TREND</Text>
          <View style={styles.trendCard}>
            <View style={styles.trendRow}>
              <View style={styles.trendItem}>
                <Text style={styles.trendLabel}>Earlier avg</Text>
                <Text style={styles.trendValue}>{trend.firstAvg}</Text>
              </View>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={theme.colors.textTertiary}
              />
              <View style={styles.trendItem}>
                <Text style={styles.trendLabel}>Recent avg</Text>
                <Text style={styles.trendValue}>{trend.secondAvg}</Text>
              </View>
            </View>
            <View style={styles.trendChange}>
              <Ionicons
                name={trend.change >= 0 ? 'trending-up' : 'trending-down'}
                size={18}
                color={trend.change >= 0 ? theme.colors.success : theme.colors.error}
              />
              <Text style={[
                styles.trendChangeText,
                { color: trend.change >= 0 ? theme.colors.success : theme.colors.error },
              ]}>
                {trend.change >= 0 ? '+' : ''}{trend.change} points
              </Text>
            </View>
          </View>
        </Animatable.View>
      )}

      {/* Longest Streak + Most Practiced */}
      <Animatable.View animation="fadeIn" delay={400} duration={500} style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>HIGHLIGHTS</Text>

        <View style={styles.highlightRow}>
          {stats?.longestStreak !== undefined && stats.longestStreak > 0 && (
            <View style={styles.highlightItem}>
              <Text style={styles.highlightValue}>{stats.longestStreak}</Text>
              <Text style={styles.highlightLabel}>Longest Streak</Text>
            </View>
          )}

          {stats?.mostPracticedPose && (
            <View style={styles.highlightItem}>
              <Text style={styles.highlightPose} numberOfLines={1}>
                {stats.mostPracticedPose}
              </Text>
              <Text style={styles.highlightLabel}>Most Practiced</Text>
            </View>
          )}
        </View>
      </Animatable.View>

      {/* Empty state */}
      {(stats?.totalSessions ?? 0) === 0 && (
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>
            Complete your first session to start tracking progress
          </Text>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screen,
    paddingTop: 60,
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  heroNumber: {
    ...theme.typography.display,
    color: theme.colors.text,
  },
  heroLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: 4,
  },

  // Summary
  summarySection: {
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: theme.spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  summaryLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.borderLight,
  },

  // Chart
  chartSection: {
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginBottom: 4,
  },
  chartSubtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    alignSelf: 'center',
  },

  // Trend
  trendSection: {
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: theme.spacing.xl,
  },
  trendCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginTop: theme.spacing.sm,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.sm,
  },
  trendItem: {
    alignItems: 'center',
  },
  trendLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginBottom: 4,
  },
  trendValue: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  trendChange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  trendChangeText: {
    ...theme.typography.bodySmMedium,
  },

  // Achievements
  achievementsSection: {
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: theme.spacing.xl,
  },
  highlightRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  highlightItem: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  highlightValue: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: 4,
  },
  highlightPose: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: 4,
  },
  highlightLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
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

export default ProgressScreen;
