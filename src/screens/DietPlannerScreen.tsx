import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { theme } from '../constants/theme';
import { GradientButton } from '../components/ui';
import { generateNutritionPlanApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'DietPlanner'>;

const PREFERENCES = ['No Preference', 'Vegetarian', 'Vegan', 'Keto', 'Mediterranean', 'Paleo'];
const GOALS = ['Lose Weight', 'Maintain Weight', 'Build Muscle', 'Improve Energy', 'Heart Health'];
const CALORIE_OPTIONS = [1500, 1800, 2000, 2200, 2500];

interface MealDay {
  dayNumber: number;
  meals: {
    mealType: string;
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
}

const DietPlannerScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [preference, setPreference] = useState('');
  const [goal, setGoal] = useState('');
  const [calories, setCalories] = useState(0);
  const [allergies, setAllergies] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<MealDay[] | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateNutritionPlanApi({
        dietaryPreference: preference,
        goal,
        calorieTarget: calories,
        allergies: allergies.trim() || 'none',
      });

      if (result.success && result.data) {
        setPlan(result.data.mealDays || []);
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
      case 0: return !!preference;
      case 1: return !!goal;
      case 2: return calories > 0;
      case 3: return true; // allergies optional
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

  const getMealTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast': return theme.colors.accent;
      case 'lunch': return theme.colors.success;
      case 'dinner': return theme.colors.primaryDark;
      case 'snack': return theme.colors.secondaryDark;
      default: return theme.colors.textSecondary;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Animatable.View animation="fadeInRight" duration={400}>
            <Text style={styles.stepTitle}>Dietary preference?</Text>
            <Text style={styles.stepSubtitle}>We'll tailor meals to your lifestyle</Text>
            <View style={styles.optionsContainer}>
              {PREFERENCES.map(p => renderOptionCard(p, preference === p, () => setPreference(p), 'leaf-outline'))}
            </View>
          </Animatable.View>
        );
      case 1:
        return (
          <Animatable.View animation="fadeInRight" duration={400}>
            <Text style={styles.stepTitle}>What's your nutrition goal?</Text>
            <Text style={styles.stepSubtitle}>This shapes your macro balance</Text>
            <View style={styles.optionsContainer}>
              {GOALS.map(g => renderOptionCard(g, goal === g, () => setGoal(g), 'trophy-outline'))}
            </View>
          </Animatable.View>
        );
      case 2:
        return (
          <Animatable.View animation="fadeInRight" duration={400}>
            <Text style={styles.stepTitle}>Daily calorie target?</Text>
            <Text style={styles.stepSubtitle}>Choose your daily calorie intake</Text>
            <View style={styles.calorieRow}>
              {CALORIE_OPTIONS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.calorieChip, calories === c && styles.calorieChipSelected]}
                  onPress={() => setCalories(c)}
                >
                  <Text style={[styles.calorieText, calories === c && styles.calorieTextSelected]}>
                    {c}
                  </Text>
                  <Text style={[styles.calorieUnit, calories === c && styles.calorieUnitSelected]}>
                    kcal
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animatable.View>
        );
      case 3:
        return (
          <Animatable.View animation="fadeInRight" duration={400}>
            <Text style={styles.stepTitle}>Any food allergies?</Text>
            <Text style={styles.stepSubtitle}>Leave blank if none (optional)</Text>
            <TextInput
              style={styles.allergyInput}
              placeholder="e.g., nuts, dairy, gluten..."
              placeholderTextColor={theme.colors.textTertiary}
              value={allergies}
              onChangeText={setAllergies}
              multiline
              maxLength={200}
            />
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
      <Text style={styles.planTitle}>Your Meal Plan</Text>
      <Text style={styles.planSubtitle}>
        {preference} | {goal} | {calories} kcal/day
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
                <Text style={styles.dayCalories}>
                  {day.meals.reduce((sum, m) => sum + (m.calories || 0), 0)} kcal
                </Text>
                <Ionicons
                  name={expandedDay === day.dayNumber ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </View>

              {expandedDay === day.dayNumber && (
                <Animatable.View animation="fadeIn" duration={300} style={styles.dayContent}>
                  {day.meals.map((meal, i) => (
                    <View key={i} style={styles.mealCard}>
                      <View style={styles.mealHeader}>
                        <View style={[styles.mealTypeBadge, { backgroundColor: getMealTypeColor(meal.mealType) + '20' }]}>
                          <Text style={[styles.mealTypeText, { color: getMealTypeColor(meal.mealType) }]}>
                            {meal.mealType}
                          </Text>
                        </View>
                        <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                      </View>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      {meal.description && (
                        <Text style={styles.mealDescription}>{meal.description}</Text>
                      )}
                      <View style={styles.macrosRow}>
                        <View style={styles.macroChip}>
                          <Text style={styles.macroValue}>{meal.protein}g</Text>
                          <Text style={styles.macroLabel}>protein</Text>
                        </View>
                        <View style={styles.macroChip}>
                          <Text style={styles.macroValue}>{meal.carbs}g</Text>
                          <Text style={styles.macroLabel}>carbs</Text>
                        </View>
                        <View style={styles.macroChip}>
                          <Text style={styles.macroValue}>{meal.fat}g</Text>
                          <Text style={styles.macroLabel}>fat</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </Animatable.View>
              )}
            </TouchableOpacity>
          </Animatable.View>
        ))
      ) : (
        <Text style={styles.noDataText}>No meal days generated. Try again.</Text>
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
        <Text style={styles.headerTitle}>Diet Planner</Text>
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
                <Ionicons name="nutrition-outline" size={48} color={theme.colors.primaryDark} />
              </View>
            </Animatable.View>
            <Text style={styles.loadingText}>AI is crafting your meal plan...</Text>
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
              title="Generate Meal Plan"
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
  calorieRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  calorieChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  calorieChipSelected: {
    borderColor: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryMuted,
  },
  calorieText: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  calorieTextSelected: {
    color: theme.colors.primaryDark,
  },
  calorieUnit: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  calorieUnitSelected: {
    color: theme.colors.primaryDark,
  },
  allergyInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.typography.body,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    minHeight: 100,
    textAlignVertical: 'top',
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
  dayCalories: {
    ...theme.typography.bodySmMedium,
    color: theme.colors.textSecondary,
    flex: 1,
    textAlign: 'right',
    marginRight: theme.spacing.sm,
  },
  dayContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  mealCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  mealTypeBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
  },
  mealTypeText: {
    ...theme.typography.caption,
  },
  mealCalories: {
    ...theme.typography.bodySmMedium,
    color: theme.colors.textSecondary,
  },
  mealName: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  mealDescription: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  macroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroValue: {
    ...theme.typography.bodySmMedium,
    color: theme.colors.text,
  },
  macroLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  noDataText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing['3xl'],
  },
});

export default DietPlannerScreen;
