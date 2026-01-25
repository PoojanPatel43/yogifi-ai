import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Pose } from '../types';
import { getPosesApi } from '../services/api';
import Colors from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'PoseSelection'>;

const difficultyColors: Record<string, string> = {
  BEGINNER: Colors.success,
  INTERMEDIATE: Colors.warning,
  ADVANCED: Colors.error,
};

const PoseSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const [poses, setPoses] = useState<Pose[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const fetchPoses = async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await getPosesApi();
      if (response.success && response.data) {
        setPoses(response.data);
      } else {
        setError(response.error || 'Failed to load poses');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPoses();
  }, []);

  const filteredPoses = selectedDifficulty
    ? poses.filter((pose) => pose.difficulty === selectedDifficulty)
    : poses;

  const handlePoseSelect = (pose: Pose) => {
    navigation.navigate('PoseInstruction', { poseId: pose.id, poseName: pose.name });
  };

  const renderDifficultyFilter = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, !selectedDifficulty && styles.filterButtonActive]}
        onPress={() => setSelectedDifficulty(null)}
      >
        <Text style={[styles.filterText, !selectedDifficulty && styles.filterTextActive]}>All</Text>
      </TouchableOpacity>
      {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((level) => (
        <TouchableOpacity
          key={level}
          style={[styles.filterButton, selectedDifficulty === level && styles.filterButtonActive]}
          onPress={() => setSelectedDifficulty(level)}
        >
          <Text style={[styles.filterText, selectedDifficulty === level && styles.filterTextActive]}>
            {level.charAt(0) + level.slice(1).toLowerCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPoseItem = ({ item }: { item: Pose }) => (
    <TouchableOpacity style={styles.poseCard} onPress={() => handlePoseSelect(item)}>
      <View style={styles.poseImageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.poseImage} resizeMode="cover" />
        ) : (
          <View style={styles.poseImagePlaceholder}>
            <Ionicons name="body" size={40} color={Colors.textMuted} />
          </View>
        )}
      </View>
      <View style={styles.poseInfo}>
        <Text style={styles.poseName}>{item.name}</Text>
        <Text style={styles.poseSanskrit}>{item.sanskritName}</Text>
        <View style={styles.poseMetaRow}>
          <View style={[styles.difficultyBadge, { backgroundColor: difficultyColors[item.difficulty] + '20' }]}>
            <Text style={[styles.difficultyText, { color: difficultyColors[item.difficulty] }]}>
              {item.difficulty}
            </Text>
          </View>
          <View style={styles.durationContainer}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.durationText}>{item.targetDurationSeconds}s</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading poses...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchPoses()}>
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
        <Text style={styles.title}>Select a Pose</Text>
        <View style={styles.placeholder} />
      </View>

      {renderDifficultyFilter()}

      <FlatList
        data={filteredPoses}
        renderItem={renderPoseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchPoses(true)}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No poses found</Text>
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  filterTextActive: {
    color: Colors.background,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  poseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  poseImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  poseImage: {
    width: '100%',
    height: '100%',
  },
  poseImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  poseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  poseName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  poseSanskrit: {
    fontSize: 13,
    color: Colors.textLight,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  poseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: Colors.textMuted,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textMuted,
  },
});

export default PoseSelectionScreen;
