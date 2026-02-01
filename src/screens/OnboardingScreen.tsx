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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../utils/haptics';
import { setItem } from '../utils/storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { theme } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';
import { AnimatedCard, GradientButton } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  gradientColors: readonly string[];
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
      iconColor: theme.colors.primary,
      gradientColors: theme.gradients.primary,
    },
    {
      id: '2',
      title: 'How It Works',
      subtitle: 'Practice yoga with real-time AI guidance',
      icon: 'videocam-outline',
      iconColor: theme.colors.secondary,
      gradientColors: theme.gradients.primaryToSecondary,
    },
    {
      id: '3',
      title: 'Set Your Goals',
      subtitle: 'What would you like to achieve?',
      icon: 'flag-outline',
      iconColor: theme.colors.success,
      gradientColors: theme.gradients.success,
    },
    {
      id: '4',
      title: 'Choose Your Level',
      subtitle: "We'll personalize your experience",
      icon: 'speedometer-outline',
      iconColor: theme.colors.warning,
      gradientColors: theme.gradients.sunset,
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

    try {
      await setItem(ONBOARDING_COMPLETE_KEY, 'true');

      const selectedGoals = goals.filter(g => g.selected).map(g => g.id);
      if (selectedGoals.length > 0) {
        await setItem('user_goals', JSON.stringify(selectedGoals));
      }
      if (selectedLevel) {
        await setItem('user_fitness_level', selectedLevel);
      }
    } catch (error) {
      console.log('Error saving onboarding data:', error);
    }

    navigation.replace('Login');
  };

  const skipOnboarding = async () => {
    if (APP_CONFIG.ENABLE_HAPTIC_FEEDBACK) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (error) {
      console.log('Error saving onboarding skip:', error);
    }
    navigation.replace('Login');
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={styles.slide}>
        {/* Icon with gradient ring */}
        <AnimatedCard index={0} enterFrom="scale">
          <View style={styles.iconOuter}>
            <LinearGradient
              colors={item.gradientColors as any}
              style={styles.iconGradientRing}
            >
              <View style={styles.iconInner}>
                <Ionicons name={item.icon as any} size={48} color={item.iconColor} />
              </View>
            </LinearGradient>
          </View>
        </AnimatedCard>

        {/* Title */}
        <AnimatedCard index={1}>
          <Text style={styles.title}>{item.title}</Text>
        </AnimatedCard>
        <AnimatedCard index={2}>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </AnimatedCard>

        {/* Slide-specific content */}
        {index === 1 && (
          <View style={styles.howItWorksContent}>
            {[
              { num: '1', title: 'Select a Pose', desc: 'Choose from our library of yoga poses' },
              { num: '2', title: 'Practice with Camera', desc: 'Our AI analyzes your form in real-time' },
              { num: '3', title: 'Get AI Feedback', desc: 'Receive personalized tips and scores' },
            ].map((step, i) => (
              <AnimatedCard key={step.num} index={i + 3} enterFrom="bottom">
                <View style={styles.stepItem}>
                  <LinearGradient
                    colors={theme.gradients.primaryToSecondary as any}
                    style={styles.stepNumber}
                  >
                    <Text style={styles.stepNumberText}>{step.num}</Text>
                  </LinearGradient>
                  <View style={styles.stepText}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDescription}>{step.desc}</Text>
                  </View>
                </View>
              </AnimatedCard>
            ))}
          </View>
        )}

        {index === 2 && (
          <View style={styles.goalsContent}>
            {goals.map((goal, i) => (
              <AnimatedCard key={goal.id} index={i + 3} enterFrom="bottom">
                <TouchableOpacity
                  style={[
                    styles.goalOption,
                    goal.selected && styles.goalOptionSelected,
                  ]}
                  onPress={() => toggleGoal(goal.id)}
                  activeOpacity={0.7}
                >
                  {goal.selected ? (
                    <LinearGradient
                      colors={theme.gradients.primary as any}
                      style={styles.goalIconContainer}
                    >
                      <Ionicons name={goal.icon as any} size={22} color={theme.colors.textInverse} />
                    </LinearGradient>
                  ) : (
                    <View style={styles.goalIconContainer}>
                      <Ionicons name={goal.icon as any} size={22} color={theme.colors.primary} />
                    </View>
                  )}
                  <Text style={[
                    styles.goalLabel,
                    goal.selected && styles.goalLabelSelected,
                  ]}>
                    {goal.label}
                  </Text>
                  {goal.selected && (
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={14} color={theme.colors.textInverse} />
                    </View>
                  )}
                </TouchableOpacity>
              </AnimatedCard>
            ))}
            <AnimatedCard index={7}>
              <Text style={styles.goalsHint}>Select all that apply</Text>
            </AnimatedCard>
          </View>
        )}

        {index === 3 && (
          <View style={styles.levelContent}>
            {fitnessLevels.map((level, i) => (
              <AnimatedCard key={level.id} index={i + 3} enterFrom="bottom">
                <TouchableOpacity
                  style={[
                    styles.levelOption,
                    selectedLevel === level.id && styles.levelOptionSelected,
                  ]}
                  onPress={() => selectFitnessLevel(level.id)}
                  activeOpacity={0.7}
                >
                  {selectedLevel === level.id ? (
                    <LinearGradient
                      colors={theme.gradients.primary as any}
                      style={styles.levelIconContainer}
                    >
                      <Ionicons name={level.icon as any} size={26} color={theme.colors.textInverse} />
                    </LinearGradient>
                  ) : (
                    <View style={styles.levelIconContainer}>
                      <Ionicons name={level.icon as any} size={26} color={theme.colors.primary} />
                    </View>
                  )}
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
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={14} color={theme.colors.textInverse} />
                    </View>
                  )}
                </TouchableOpacity>
              </AnimatedCard>
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
            outputRange: [8, 28, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.25, 1, 0.25],
            extrapolate: 'clamp',
          });

          const backgroundColor = scrollX.interpolate({
            inputRange,
            outputRange: [theme.colors.border, theme.colors.primary, theme.colors.border],
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
                  backgroundColor,
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
      {/* Subtle gradient background */}
      <LinearGradient
        colors={theme.gradients.surface as any}
        style={StyleSheet.absoluteFill}
      />

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
        {currentIndex > 0 ? (
          <TouchableOpacity style={styles.backButton} onPress={goToPrevious}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}

        <View style={styles.spacer} />

        {isLastSlide ? (
          <GradientButton
            title="Get Started"
            onPress={completeOnboarding}
            disabled={!selectedLevel}
            gradient={theme.gradients.primaryToSecondary}
            size="md"
            icon={<Ionicons name="arrow-forward" size={18} color={theme.colors.textInverse} />}
            style={styles.navButton}
          />
        ) : (
          <GradientButton
            title="Next"
            onPress={goToNext}
            size="md"
            icon={<Ionicons name="arrow-forward" size={18} color={theme.colors.textInverse} />}
            style={styles.navButton}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: theme.spacing.screen,
    zIndex: 10,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryMuted,
  },
  skipText: {
    ...theme.typography.bodySmMedium,
    color: theme.colors.primary,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing['2xl'],
    paddingTop: 110,
  },
  // Icon with gradient ring
  iconOuter: {
    marginBottom: theme.spacing['2xl'],
  },
  iconGradientRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow(theme.colors.primary),
  },
  iconInner: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing['3xl'],
    lineHeight: 24,
  },
  // How it works
  howItWorksContent: {
    width: '100%',
    paddingTop: theme.spacing.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    ...theme.shadows.sm,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  stepNumberText: {
    ...theme.typography.bodyMedium,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  stepDescription: {
    ...theme.typography.bodySm,
    color: theme.colors.textTertiary,
  },
  // Goals
  goalsContent: {
    width: '100%',
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  goalOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryMuted,
    ...theme.shadows.glow(theme.colors.primaryGlow),
  },
  goalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  goalLabel: {
    flex: 1,
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
  },
  goalLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalsHint: {
    textAlign: 'center',
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.sm,
  },
  // Level
  levelContent: {
    width: '100%',
  },
  levelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  levelOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryMuted,
    ...theme.shadows.glow(theme.colors.primaryGlow),
  },
  levelIconContainer: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  levelTextContainer: {
    flex: 1,
  },
  levelLabel: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: 2,
  },
  levelLabelSelected: {
    color: theme.colors.primary,
  },
  levelDescription: {
    ...theme.typography.bodySm,
    color: theme.colors.textTertiary,
  },
  // Pagination
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
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
    paddingHorizontal: theme.spacing['2xl'],
    paddingBottom: 44,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  backButtonPlaceholder: {
    width: 48,
  },
  spacer: {
    flex: 1,
  },
  navButton: {
    minWidth: 140,
  },
});

export default OnboardingScreen;
