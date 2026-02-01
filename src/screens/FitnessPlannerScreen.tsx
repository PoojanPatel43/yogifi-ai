import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { theme } from '../constants/theme';
import { GradientButton } from '../components/ui';
import { generateFitnessPlanApi } from '../services/api';

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
            if (step === 4) { setStep(3); setPlan(null); }
            else if (step > 0) setStep(step - 1);
            else navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fitness Planner</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step Indicators */}
      {step < 4 && (
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
        {isLoading ? (
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

      {/* Bottom Action */}
      {step < 4 && !isLoading && (
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
});

export default FitnessPlannerScreen;
