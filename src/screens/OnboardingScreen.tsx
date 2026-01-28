import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import Colors from '../constants/colors';
import { APP_CONFIG } from '../constants/config';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  content?: React.ReactNode;
}

interface GoalOption {
  id: string;
  label: string;
  icon: string;
  selected: boolean;
}

interface FitnessLevel {
  id: string;
  label: string;
  description: string;
  icon: string;
}

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Goals state
  const [goals, setGoals] = useState<GoalOption[]>([
    { id: 'flexibility', label: 'Flexibility', icon: 'body-outline', selected: false },
    { id: 'strength', label: 'Strength', icon: 'barbell-outline', selected: false },
    { id: 'balance', label: 'Balance', icon: 'fitness-outline', selected: false },
    { id: 'stress', label: 'Stress Relief', icon: 'leaf-outline', selected: false },
  ]);

  // Fitness level state
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const fitnessLevels: FitnessLevel[] = [
    {
      id: 'BEGINNER',
      label: 'Beginner',
      description: 'New to yoga or returning after a break',
      icon: 'sparkles-outline',
    },
    {
      id: 'INTERMEDIATE',
      label: 'Intermediate',
      description: 'Comfortable with basic poses',
      icon: 'trending-up-outline',
    },
    {
      id: 'ADVANCED',
      label: 'Advanced',
      description: 'Experienced practitioner',
      icon: 'star-outline',
    },
  ];

  const toggleGoal = (goalId: string) => {
    if (APP_CONFIG.ENABLE_HAPTIC_FEEDBACK) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setGoals(prev =>
      prev.map(goal =>
        goal.id === goalId ? { ...goal, selected: !goal.selected } : goal
      )
    );
  };

  const selectFitnessLevel = (levelId: string) => {
    if (APP_CONFIG.ENABLE_HAPTIC_FEEDBACK) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedLevel(levelId);
  };

  const slides: OnboardingSlide[] = [
    {
      id: '1',
      title: 'Welcome to Yogifi AI',
      subtitle: 'Your personal AI yoga instructor',
      icon: 'flower-outline',
      iconColor: Colors.primary,
    },
    {
      id: '2',
      title: 'How It Works',
      subtitle: 'Practice yoga with real-time AI guidance',
      icon: 'videocam-outline',
      iconColor: Colors.secondary,
    },
    {
      id: '3',
      title: 'Set Your Goals',
      subtitle: 'What would you like to achieve?',
      icon: 'flag-outline',
      iconColor: Colors.success,
    },
    {
      id: '4',
      title: 'Choose Your Level',
      subtitle: 'We\'ll personalize your experience',
      icon: 'speedometer-outline',
      iconColor: Colors.warning,
    },
  ];

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const goToNext = () => {
    if (APP_CONFIG.ENABLE_HAPTIC_FEEDBACK) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (APP_CONFIG.ENABLE_HAPTIC_FEEDBACK) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
      setCurrentIndex(currentIndex - 1);
    }
  };

  const completeOnboarding = async () => {
    if (APP_CONFIG.ENABLE_HAPTIC_FEEDBACK) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Save onboarding completion status and user preferences
    try {
      await SecureStore.setItemAsync(ONBOARDING_COMPLETE_KEY, 'true');

      const selectedGoals = goals.filter(g => g.selected).map(g => g.id);
      if (selectedGoals.length > 0) {
        await SecureStore.setItemAsync('user_goals', JSON.stringify(selectedGoals));
      }
      if (selectedLevel) {
        await SecureStore.setItemAsync('user_fitness_level', selectedLevel);
      }
    } catch (error) {
      console.log('Error saving onboarding data:', error);
    }

    // Navigate to register/login
    navigation.replace('Login');
  };

  const skipOnboarding = async () => {
    if (APP_CONFIG.ENABLE_HAPTIC_FEEDBACK) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await SecureStore.setItemAsync(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (error) {
      console.log('Error saving onboarding skip:', error);
    }
    navigation.replace('Login');
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={styles.slide}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '15' }]}>
          <Ionicons name={item.icon as any} size={80} color={item.iconColor} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>

        {/* Slide-specific content */}
        {index === 1 && (
          <View style={styles.howItWorksContent}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>Select a Pose</Text>
                <Text style={styles.stepDescription}>Choose from our library of yoga poses</Text>
              </View>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>Practice with Camera</Text>
                <Text style={styles.stepDescription}>Our AI analyzes your form in real-time</Text>
              </View>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>Get AI Feedback</Text>
                <Text style={styles.stepDescription}>Receive personalized tips and scores</Text>
              </View>
            </View>
          </View>
        )}

        {index === 2 && (
          <View style={styles.goalsContent}>
            {goals.map(goal => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalOption,
                  goal.selected && styles.goalOptionSelected,
                ]}
                onPress={() => toggleGoal(goal.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.goalIconContainer,
                  goal.selected && styles.goalIconContainerSelected,
                ]}>
                  <Ionicons
                    name={goal.icon as any}
                    size={24}
                    color={goal.selected ? '#FFFFFF' : Colors.primary}
                  />
                </View>
                <Text style={[
                  styles.goalLabel,
                  goal.selected && styles.goalLabelSelected,
                ]}>
                  {goal.label}
                </Text>
                {goal.selected && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <Text style={styles.goalsHint}>Select all that apply</Text>
          </View>
        )}

        {index === 3 && (
          <View style={styles.levelContent}>
            {fitnessLevels.map(level => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.levelOption,
                  selectedLevel === level.id && styles.levelOptionSelected,
                ]}
                onPress={() => selectFitnessLevel(level.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.levelIconContainer,
                  selectedLevel === level.id && styles.levelIconContainerSelected,
                ]}>
                  <Ionicons
                    name={level.icon as any}
                    size={28}
                    color={selectedLevel === level.id ? '#FFFFFF' : Colors.primary}
                  />
                </View>
                <View style={styles.levelTextContainer}>
                  <Text style={[
                    styles.levelLabel,
                    selectedLevel === level.id && styles.levelLabelSelected,
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={styles.levelDescription}>{level.description}</Text>
                </View>
                {selectedLevel === level.id && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: Colors.primary,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        keyExtractor={item => item.id}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Pagination */}
      {renderPagination()}

      {/* Navigation buttons */}
      <View style={styles.buttonContainer}>
        {currentIndex > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={goToPrevious}>
            <Ionicons name="arrow-back" size={24} color={Colors.textLight} />
          </TouchableOpacity>
        )}

        <View style={styles.spacer} />

        {isLastSlide ? (
          <TouchableOpacity
            style={[
              styles.getStartedButton,
              !selectedLevel && styles.getStartedButtonDisabled,
            ]}
            onPress={completeOnboarding}
            disabled={!selectedLevel}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={goToNext}>
            <Text style={styles.nextText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 120,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  // How it works content
  howItWorksContent: {
    width: '100%',
    paddingTop: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  // Goals content
  goalsContent: {
    width: '100%',
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalIconContainerSelected: {
    backgroundColor: Colors.primary,
  },
  goalLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  goalLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  goalsHint: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
  },
  // Level content
  levelContent: {
    width: '100%',
  },
  levelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  levelIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  levelIconContainerSelected: {
    backgroundColor: Colors.primary,
  },
  levelTextContainer: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  levelLabelSelected: {
    color: Colors.primary,
  },
  levelDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  // Pagination
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  getStartedButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default OnboardingScreen;
