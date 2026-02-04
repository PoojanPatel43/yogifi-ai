import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { theme } from '../constants/theme';
import { GradientButton } from '../components/ui';
import { generateFitnessPlanApi, getFitnessPlansApi } from '../services/api';
import { getItem, setItem } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'FitnessPlanner'>;

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const GOALS = ['Build Muscle', 'Lose Weight', 'Improve Flexibility', 'General Fitness', 'Build Endurance'];
const EQUIPMENT = ['Bodyweight Only', 'Dumbbells', 'Full Gym', 'Resistance Bands', 'Minimal (Dumbbells + Bands)'];
const DAYS = [3, 4, 5, 6];

interface WorkoutDay {
  dayNumber: number;
  focus: string;
  warmup: string;
  cooldown: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    restSeconds: number;
    notes: string;
  }[];
}

const FitnessPlannerScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [equipment, setEquipment] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<WorkoutDay[] | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [showSavedPlans, setShowSavedPlans] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  const loadSavedPlans = async () => {
    try {
      const result = await getFitnessPlansApi();
      if (result.success && result.data && result.data.length > 0) {
        setSavedPlans(result.data);
      } else {
        setShowSavedPlans(false);
      }
    } catch {
      setShowSavedPlans(false);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadSavedPlans();
  }, []);

  useEffect(() => {
    const checkWelcome = async () => {
      const hasSeen = await getItem('has_seen_fitness_planner');
      if (!hasSeen) {
        setShowWelcome(true);
      }
    };
    checkWelcome();
  }, []);

  const dismissWelcome = async () => {
    await setItem('has_seen_fitness_planner', 'true');
    setShowWelcome(false);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateFitnessPlanApi({
        fitnessLevel: level.toLowerCase(),
        goal,
        daysPerWeek,
        equipment,
      });

      if (result.success && result.data) {
        setPlan(result.data.workoutDays || []);
        setStep(4);

        // Refresh saved plans in the background
        const refreshResult = await getFitnessPlansApi();
        if (refreshResult.success && refreshResult.data) {
          setSavedPlans(refreshResult.data);
        }
      } else {
        setError(result.error || 'Failed to generate plan');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!level;
      case 1: return !!goal;
      case 2: return !!equipment;
      case 3: return daysPerWeek > 0;
      default: return false;
    }
  };

  const renderOptionCard = (
    label: string,
    selected: boolean,
    onPress: () => void,
    icon?: string,
  ) => (
    <TouchableOpacity
      key={label}
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={22}
          color={selected ? theme.colors.primaryDark : theme.colors.textSecondary}
        />
      )}
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
      {selected && <Ionicons name="checkmark-circle" size={22} color={theme.colors.primaryDark} />}
    </TouchableOpacity>
  );

  const renderSavedPlans = () => (
    <Animatable.View animation="fadeIn" duration={500}>
      <Text style={styles.stepTitle}>Your Plans</Text>
      <Text style={styles.stepSubtitle}>Previously generated plans</Text>
      <View style={styles.savedPlansContainer}>
        {savedPlans.map((savedPlan) => (
          <TouchableOpacity
            key={savedPlan.id}
            style={styles.savedPlanCard}
            activeOpacity={0.7}
            onPress={() => {
              setPlan(savedPlan.workoutDays);
              setLevel(savedPlan.fitnessLevel);
              setGoal(savedPlan.goal);
              setEquipment(savedPlan.equipment);
              setDaysPerWeek(savedPlan.daysPerWeek);
              setStep(4);
            }}
          >
            <View style={styles.savedPlanInfo}>
              <Text style={styles.savedPlanGoal}>{savedPlan.goal}</Text>
              <Text style={styles.savedPlanMeta}>
                {savedPlan.fitnessLevel} | {savedPlan.daysPerWeek} days/week
              </Text>
              <Text style={styles.savedPlanDate}>
                {new Date(savedPlan.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.createNewButtonContainer}>
        <GradientButton
          title="Create New Plan"
          onPress={() => {
            setShowSavedPlans(false);
            setStep(0);
            setLevel('');
            setGoal('');
            setEquipment('');
            setDaysPerWeek(0);
            setPlan(null);
            setError(null);
          }}
          variant="dark"
          size="lg"
          style={styles.actionButton}
        />
      </View>
    </Animatable.View>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Animatable.View animation="fadeInRight" duration={400}>
            <Text style={styles.stepTitle}>What's your fitness level?</Text>
            <Text style={styles.stepSubtitle}>We'll tailor the plan to match your experience</Text>
            <View style={styles.optionsContainer}>
              {LEVELS.map(l => renderOptionCard(l, level === l, () => setLevel(l), 'fitness-outline'))}
            </View>
          </Animatable.View>
        );
      case 1:
        return (
          <Animatable.View animation="fadeInRight" duration={400}>
            <Text style={styles.stepTitle}>What's your primary goal?</Text>
            <Text style={styles.stepSubtitle}>This helps us focus the right exercises</Text>
            <View style={styles.optionsContainer}>
              {GOALS.map(g => renderOptionCard(g, goal === g, () => setGoal(g), 'trophy-outline'))}
            </View>
          </Animatable.View>
        );
      case 2:
        return (
          <Animatable.View animation="fadeInRight" duration={400}>
            <Text style={styles.stepTitle}>What equipment do you have?</Text>
            <Text style={styles.stepSubtitle}>We'll design exercises around your setup</Text>
            <View style={styles.optionsContainer}>
              {EQUIPMENT.map(e => renderOptionCard(e, equipment === e, () => setEquipment(e), 'barbell-outline'))}
            </View>
          </Animatable.View>
        );
      case 3:
        return (
          <Animatable.View animation="fadeInRight" duration={400}>
            <Text style={styles.stepTitle}>How many days per week?</Text>
            <Text style={styles.stepSubtitle}>Choose a sustainable schedule</Text>
            <View style={styles.daysRow}>
              {DAYS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayCircle, daysPerWeek === d && styles.dayCircleSelected]}
                  onPress={() => setDaysPerWeek(d)}
                >
                  <Text style={[styles.dayText, daysPerWeek === d && styles.dayTextSelected]}>{d}</Text>
                  <Text style={[styles.dayLabel, daysPerWeek === d && styles.dayLabelSelected]}>days</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animatable.View>
        );
      case 4:
        return renderPlan();
      default:
        return null;
    }
  };

  const renderPlan = () => (
    <Animatable.View animation="fadeIn" duration={500}>
      <Text style={styles.planTitle}>Your Workout Plan</Text>
      <Text style={styles.planSubtitle}>
        {level} | {goal} | {daysPerWeek} days/week
      </Text>
      {plan && plan.length > 0 ? (
        plan.map((day) => (
          <Animatable.View key={day.dayNumber} animation="fadeInUp" delay={day.dayNumber * 100} duration={400}>
            <TouchableOpacity
              style={styles.dayCard}
              onPress={() => setExpandedDay(expandedDay === day.dayNumber ? null : day.dayNumber)}
              activeOpacity={0.7}
            >
              <View style={styles.dayCardHeader}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>Day {day.dayNumber}</Text>
                </View>
                <Text style={styles.dayFocus}>{day.focus}</Text>
                <Ionicons
                  name={expandedDay === day.dayNumber ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </View>

              {expandedDay === day.dayNumber && (
                <Animatable.View animation="fadeIn" duration={300} style={styles.dayContent}>
                  {day.warmup && (
                    <View style={styles.phaseBlock}>
                      <Text style={styles.phaseLabel}>Warm-up</Text>
                      <Text style={styles.phaseText}>{day.warmup}</Text>
                    </View>
                  )}

                  {day.exercises.map((ex, i) => (
                    <View key={i} style={styles.exerciseRow}>
                      <View style={styles.exerciseNumber}>
                        <Text style={styles.exerciseNumberText}>{i + 1}</Text>
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{ex.name}</Text>
                        <Text style={styles.exerciseDetail}>
                          {ex.sets} sets x {ex.reps}{ex.restSeconds ? ` | ${ex.restSeconds}s rest` : ''}
                        </Text>
                        {ex.notes && <Text style={styles.exerciseNotes}>{ex.notes}</Text>}
                      </View>
                    </View>
                  ))}

                  {day.cooldown && (
                    <View style={styles.phaseBlock}>
                      <Text style={styles.phaseLabel}>Cool-down</Text>
                      <Text style={styles.phaseText}>{day.cooldown}</Text>
                    </View>
                  )}
                </Animatable.View>
              )}
            </TouchableOpacity>
          </Animatable.View>
        ))
      ) : (
        <Text style={styles.noDataText}>No workout days generated. Try again.</Text>
      )}
    </Animatable.View>
  );

  const stepIndicators = [0, 1, 2, 3];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (showSavedPlans && step === 4) {
              // Viewing a saved plan — go back to saved plans list
              setStep(0);
              setPlan(null);
              setExpandedDay(null);
            } else if (showSavedPlans && step < 4) {
              // In saved plans list view — go back to previous screen
              navigation.goBack();
            } else if (step === 4) {
              setStep(3);
              setPlan(null);
              setExpandedDay(null);
            } else if (step > 0) {
              setStep(step - 1);
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fitness Planner</Text>
        {!showSavedPlans && savedPlans.length > 0 && step < 4 ? (
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => {
              setShowSavedPlans(true);
              setStep(0);
              setPlan(null);
              setError(null);
              setExpandedDay(null);
            }}
          >
            <Text style={styles.headerActionText}>View Saved</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Step Indicators — only show in wizard mode */}
      {!showSavedPlans && step < 4 && (
        <View style={styles.stepIndicators}>
          {stepIndicators.map(i => (
            <View key={i} style={[styles.stepDot, i <= step && styles.stepDotActive]} />
          ))}
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showWelcome && (
          <Animatable.View animation="fadeIn" duration={400} style={styles.welcomeBanner}>
            <Text style={styles.welcomeText}>
              Get AI-generated workout plans tailored to your fitness level and goals.
            </Text>
            <TouchableOpacity style={styles.welcomeClose} onPress={dismissWelcome}>
              <Ionicons name="close-circle-outline" size={18} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </Animatable.View>
        )}
        {showSavedPlans && step < 4 ? (
          isLoadingPlans ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primaryDark} />
              <Text style={styles.loadingSubtext}>Loading your plans...</Text>
            </View>
          ) : (
            renderSavedPlans()
          )
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <Animatable.View animation="pulse" iterationCount="infinite" duration={1500}>
              <View style={styles.loadingIcon}>
                <Ionicons name="barbell-outline" size={48} color={theme.colors.primaryDark} />
              </View>
            </Animatable.View>
            <Text style={styles.loadingText}>AI is crafting your plan...</Text>
            <Text style={styles.loadingSubtext}>This may take a moment</Text>
          </View>
        ) : (
          renderStep()
        )}

        {error && (
          <Animatable.View animation="fadeIn" style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </Animatable.View>
        )}
      </ScrollView>

      {/* Bottom Action — only in wizard mode */}
      {!showSavedPlans && step < 4 && !isLoading && (
        <View style={styles.bottomBar}>
          {step === 3 ? (
            <GradientButton
              title="Generate Plan"
              onPress={handleGenerate}
              disabled={!canProceed()}
              gradient={theme.gradients.primaryToSecondary}
              size="lg"
              style={styles.actionButton}
            />
          ) : (
            <GradientButton
              title="Continue"
              onPress={() => setStep(step + 1)}
              disabled={!canProceed()}
              gradient={theme.gradients.primaryToSecondary}
              size="lg"
              style={styles.actionButton}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.screen,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  headerAction: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  headerActionText: {
    ...theme.typography.bodySm,
    color: theme.colors.primaryDark,
    fontWeight: '600',
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  stepDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.borderLight,
  },
  stepDotActive: {
    backgroundColor: theme.colors.primaryDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.screen,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  stepTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  stepSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing['2xl'],
  },
  optionsContainer: {
    gap: theme.spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  optionCardSelected: {
    borderColor: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryMuted,
  },
  optionLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    flex: 1,
  },
  optionLabelSelected: {
    color: theme.colors.primaryDark,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xl,
  },
  dayCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  dayCircleSelected: {
    borderColor: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryMuted,
  },
  dayText: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  dayTextSelected: {
    color: theme.colors.primaryDark,
  },
  dayLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: -2,
  },
  dayLabelSelected: {
    color: theme.colors.primaryDark,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['5xl'],
  },
  loadingIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  loadingText: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  loadingSubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.errorLight,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.lg,
  },
  errorText: {
    ...theme.typography.bodySm,
    color: theme.colors.error,
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: theme.spacing.screen,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  actionButton: {
    width: '100%',
  },
  planTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  planSubtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing['2xl'],
  },
  dayCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  dayBadge: {
    backgroundColor: theme.colors.primaryMuted,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
  },
  dayBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.primaryDark,
  },
  dayFocus: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    flex: 1,
  },
  dayContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingTop: theme.spacing.lg,
  },
  phaseBlock: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
  },
  phaseLabel: {
    ...theme.typography.caption,
    color: theme.colors.primaryDark,
    marginBottom: theme.spacing.xs,
  },
  phaseText: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberText: {
    ...theme.typography.caption,
    color: theme.colors.primaryDark,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
  },
  exerciseDetail: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  exerciseNotes: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  noDataText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing['3xl'],
  },
  savedPlansContainer: {
    gap: theme.spacing.md,
  },
  savedPlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  savedPlanInfo: {
    flex: 1,
  },
  savedPlanGoal: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  savedPlanMeta: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  savedPlanDate: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  createNewButtonContainer: {
    marginTop: theme.spacing['2xl'],
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: theme.spacing.sm,
  },
  welcomeText: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  welcomeClose: {
    padding: 4,
  },
});

export default FitnessPlannerScreen;
