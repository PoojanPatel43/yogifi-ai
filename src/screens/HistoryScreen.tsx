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
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Session } from '../types';
import { getSessionHistoryApi } from '../services/api';
import Colors from '../constants/colors';
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
    if (!score) return Colors.textMuted;
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.error;
  };

  const getScoreBadgeStyle = (score: number | null | undefined) => {
    if (!score) return { bg: Colors.textMuted + '20', text: Colors.textMuted };
    if (score >= 80) return { bg: Colors.success + '20', text: Colors.success };
    if (score >= 60) return { bg: Colors.warning + '20', text: Colors.warning };
    return { bg: Colors.error + '20', text: Colors.error };
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
    const scoreBadge = getScoreBadgeStyle(item.overallScore);

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
          <Ionicons name="fitness" size={22} color={Colors.primary} />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionPose}>{item.poseName || 'Yoga Session'}</Text>
          <View style={styles.sessionMeta}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.sessionDuration}>{formatDuration(item.durationSeconds)}</Text>
          </View>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: scoreBadge.bg }]}>
          <Text style={[styles.scoreValue, { color: scoreBadge.text }]}>
            {item.overallScore ?? '--'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by pose name..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
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
          <Ionicons name="filter" size={18} color={Colors.primary} />
          <Text style={styles.filterToggleText}>Filters</Text>
          <Ionicons
            name={showFilters ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.primary}
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
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
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
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
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
            tintColor={Colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={Colors.textMuted} />
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
    backgroundColor: Colors.background,
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterToggleText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  sortPills: {
    flexDirection: 'row',
    gap: 8,
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
  },
  sortPillActive: {
    backgroundColor: Colors.primary,
  },
  sortPillText: {
    fontSize: 13,
    color: Colors.textLight,
  },
  sortPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  expandedFilters: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
    fontWeight: '500',
  },
  filterPills: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  resultsCount: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionCount: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginBottom: 4,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionDuration: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '700',
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
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  startButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HistoryScreen;
