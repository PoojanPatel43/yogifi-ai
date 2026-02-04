import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from '../utils/haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Session } from '../types';
import { getSessionHistoryApi } from '../services/api';
import { theme } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

type SortOption = 'recent' | 'score' | 'duration';
type FilterOption = 'all' | 'excellent' | 'good' | 'needsWork';

interface GroupedSession {
  title: string;
  data: Session[];
}

const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  const PAGE_SIZE = 50; // Load more at once for client-side filtering

  const fetchSessions = async (offset: number = 0, append: boolean = false) => {
    if (offset === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const response = await getSessionHistoryApi(PAGE_SIZE, offset);

      if (response.success && response.data) {
        if (append) {
          setSessions((prev) => [...prev, ...response.data!]);
        } else {
          setSessions(response.data);
        }
        setHasMore(response.data.length === PAGE_SIZE);
      } else {
        setError(response.error || 'Failed to load history');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasMore(true);
    fetchSessions(0, false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      fetchSessions(sessions.length, true);
    }
  };

  const handleHaptic = () => {
    if (APP_CONFIG.ENABLE_HAPTIC_FEEDBACK) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let result = [...sessions];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.poseName?.toLowerCase().includes(query)
      );
    }

    // Filter by score range
    switch (filterBy) {
      case 'excellent':
        result = result.filter((s) => (s.overallScore ?? 0) >= 80);
        break;
      case 'good':
        result = result.filter(
          (s) => (s.overallScore ?? 0) >= 60 && (s.overallScore ?? 0) < 80
        );
        break;
      case 'needsWork':
        result = result.filter((s) => (s.overallScore ?? 0) < 60);
        break;
    }

    // Sort
    switch (sortBy) {
      case 'score':
        result.sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0));
        break;
      case 'duration':
        result.sort((a, b) => (b.durationSeconds ?? 0) - (a.durationSeconds ?? 0));
        break;
      case 'recent':
      default:
        result.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        );
    }

    return result;
  }, [sessions, searchQuery, sortBy, filterBy]);

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const groups: { [key: string]: Session[] } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    filteredAndSortedSessions.forEach((session) => {
      const date = new Date(session.createdAt ?? 0);
      date.setHours(0, 0, 0, 0);

      let key: string;
      if (date.getTime() === today.getTime()) {
        key = 'Today';
      } else if (date.getTime() === yesterday.getTime()) {
        key = 'Yesterday';
      } else if (date >= thisWeek) {
        key = 'This Week';
      } else {
        key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(session);
    });

    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [filteredAndSortedSessions]);

  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number | null | undefined): string => {
    if (!score) return theme.colors.textTertiary;
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.warning;
    return theme.colors.error;
  };

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>
        {groupedSessions.find((g) => g.title === title)?.data.length ?? 0} sessions
      </Text>
    </View>
  );

  const renderSessionItem = ({ item }: { item: Session }) => {
    const scoreColor = getScoreColor(item.overallScore);

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => {
          handleHaptic();
          navigation.navigate('SessionDetails', { sessionId: item.id });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.sessionIcon}>
          <Ionicons name="fitness" size={22} color={theme.colors.textTertiary} />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionPose}>{item.poseName || 'Yoga Session'}</Text>
          <View style={styles.sessionMeta}>
            <Ionicons name="time-outline" size={14} color={theme.colors.textTertiary} />
            <Text style={styles.sessionDuration}>{formatDuration(item.durationSeconds)}</Text>
          </View>
        </View>
        <Text style={[styles.scoreValue, { color: scoreColor }]}>
          {item.overallScore ?? '--'}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by pose name..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter pills */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => {
            handleHaptic();
            setShowFilters(!showFilters);
          }}
        >
          <Ionicons name="filter" size={18} color={theme.colors.primary} />
          <Text style={styles.filterToggleText}>Filters</Text>
          <Ionicons
            name={showFilters ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        {/* Sort options */}
        <View style={styles.sortPills}>
          {(['recent', 'score', 'duration'] as SortOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.sortPill, sortBy === option && styles.sortPillActive]}
              onPress={() => {
                handleHaptic();
                setSortBy(option);
              }}
            >
              <Text
                style={[
                  styles.sortPillText,
                  sortBy === option && styles.sortPillTextActive,
                ]}
              >
                {option === 'recent' ? 'Recent' : option === 'score' ? 'Score' : 'Duration'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Expanded filters */}
      {showFilters && (
        <View style={styles.expandedFilters}>
          <Text style={styles.filterLabel}>Filter by Score</Text>
          <View style={styles.filterPills}>
            {[
              { key: 'all', label: 'All' },
              { key: 'excellent', label: '80+' },
              { key: 'good', label: '60-79' },
              { key: 'needsWork', label: '<60' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterPill,
                  filterBy === option.key && styles.filterPillActive,
                ]}
                onPress={() => {
                  handleHaptic();
                  setFilterBy(option.key as FilterOption);
                }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filterBy === option.key && styles.filterPillTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Results count */}
      <Text style={styles.resultsCount}>
        {filteredAndSortedSessions.length} session{filteredAndSortedSessions.length !== 1 ? 's' : ''} found
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchSessions()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Session History</Text>
        <View style={styles.placeholder} />
      </View>

      {renderFilters()}

      <FlatList
        data={filteredAndSortedSessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>
              {searchQuery || filterBy !== 'all' ? 'No matching sessions' : 'No sessions yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery || filterBy !== 'all'
                ? 'Try adjusting your filters'
                : 'Complete your first yoga session to see it here'}
            </Text>
            {!searchQuery && filterBy === 'all' && (
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => navigation.navigate('PoseSelection')}
              >
                <Text style={styles.startButtonText}>Start Practicing</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingTop: 60,
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    width: theme.spacing.lg,
    height: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.text,
  },
  placeholder: {
    width: theme.spacing.lg,
  },
  filtersContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs + 4,
    marginBottom: theme.spacing.xs + 4,
    gap: theme.spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterToggleText: {
    ...theme.typography.bodySmMedium,
    color: theme.colors.primary,
  },
  sortPills: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  sortPill: {
    paddingHorizontal: theme.spacing.xs + 4,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  sortPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sortPillText: {
    ...theme.typography.bodySm,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  sortPillTextActive: {
    color: theme.colors.textInverse,
    fontWeight: '500',
  },
  expandedFilters: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  filterLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.xs,
  },
  filterPills: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  filterPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterPillText: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
  },
  filterPillTextActive: {
    color: theme.colors.textInverse,
    fontWeight: '500',
  },
  resultsCount: {
    ...theme.typography.bodySm,
    fontSize: 13,
    color: theme.colors.textTertiary,
    marginTop: 4,
  },
  listContent: {
    padding: theme.spacing.sm,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs + 4,
    paddingTop: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  sectionCount: {
    ...theme.typography.bodySm,
    fontSize: 13,
    color: theme.colors.textTertiary,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs + 2,
  },
  sessionIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
    marginLeft: theme.spacing.xs + 4,
  },
  sessionPose: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    marginBottom: 4,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionDuration: {
    ...theme.typography.bodySm,
    fontSize: 13,
    color: theme.colors.textTertiary,
  },
  scoreValue: {
    ...theme.typography.h3,
    fontSize: 22,
    marginRight: theme.spacing.xs,
  },
  loadingText: {
    marginTop: theme.spacing.xs + 4,
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  errorText: {
    marginTop: theme.spacing.xs + 4,
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 4,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
  },
  retryButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  loadingMore: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    ...theme.typography.bodySm,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.xs + 6,
    paddingHorizontal: theme.spacing.md,
  },
  startButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
});

export default HistoryScreen;
