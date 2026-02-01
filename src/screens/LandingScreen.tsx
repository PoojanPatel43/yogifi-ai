import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { theme } from '../constants/theme';
import { AnimatedCard, GradientButton, GlassCard } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

const features = [
  {
    icon: 'fitness-outline',
    title: 'AI Yoga Coach',
    description: 'Real-time pose guidance with AI-powered feedback',
    color: theme.colors.primary,
  },
  {
    icon: 'chatbubbles-outline',
    title: 'AI Wellness Chat',
    description: 'Get personalized wellness advice anytime',
    color: theme.colors.secondary,
  },
  {
    icon: 'barbell-outline',
    title: 'Fitness Plans',
    description: 'AI-generated workout plans tailored to your goals',
    color: theme.colors.success,
  },
  {
    icon: 'nutrition-outline',
    title: 'Diet Plans',
    description: 'Custom meal plans based on your preferences',
    color: theme.colors.accent,
  },
];

const steps = [
  { num: '1', title: 'Create your account', desc: 'Sign up in seconds to get started' },
  { num: '2', title: 'Set your goals', desc: 'Tell us about your wellness objectives' },
  { num: '3', title: 'Get AI-powered guidance', desc: 'Receive personalized plans and coaching' },
];

const LandingScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        {/* Hero Section */}
        <LinearGradient
          colors={theme.gradients.hero as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <AnimatedCard index={0} enterFrom="scale">
              <View style={styles.logoContainer}>
                <Ionicons name="leaf" size={36} color={theme.colors.textInverse} />
              </View>
            </AnimatedCard>

            <AnimatedCard index={1}>
              <Text style={styles.heroTitle}>Your AI Wellness Coach</Text>
            </AnimatedCard>

            <AnimatedCard index={2}>
              <Text style={styles.heroSubtitle}>
                Yoga, fitness, nutrition, and wellness — all powered by AI, personalized for you.
              </Text>
            </AnimatedCard>

            <AnimatedCard index={3}>
              <View style={styles.heroCTAs}>
                <GradientButton
                  title="Get Started"
                  onPress={() => navigation.navigate('Register')}
                  gradient={['#FFFFFF', '#f0edf8']}
                  textStyle={{ color: theme.colors.primaryDark }}
                  size="lg"
                  style={styles.heroButton}
                />
                <GradientButton
                  title="Sign In"
                  onPress={() => navigation.navigate('Login')}
                  variant="outline"
                  size="lg"
                  style={[styles.heroButton, styles.heroButtonOutline]}
                  textStyle={{ color: theme.colors.textInverse }}
                />
              </View>
            </AnimatedCard>
          </View>
        </LinearGradient>

        {/* Features Grid */}
        <View style={styles.section}>
          <AnimatedCard index={4}>
            <Text style={styles.sectionTitle}>Everything You Need</Text>
            <Text style={styles.sectionSubtitle}>
              AI-powered tools for your complete wellness journey
            </Text>
          </AnimatedCard>

          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <AnimatedCard key={feature.title} index={index + 5} enterFrom="bottom">
                <GlassCard style={styles.featureCard}>
                  <View style={[styles.featureIcon, { backgroundColor: feature.color + '25' }]}>
                    <Ionicons name={feature.icon as any} size={28} color={feature.color} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.description}</Text>
                </GlassCard>
              </AnimatedCard>
            ))}
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <AnimatedCard index={9}>
            <Text style={styles.sectionTitle}>How It Works</Text>
          </AnimatedCard>

          {steps.map((step, index) => (
            <AnimatedCard key={step.num} index={index + 10} enterFrom="left">
              <View style={styles.stepRow}>
                <LinearGradient
                  colors={theme.gradients.primaryToSecondary as any}
                  style={styles.stepBadge}
                >
                  <Text style={styles.stepNum}>{step.num}</Text>
                </LinearGradient>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            </AnimatedCard>
          ))}
        </View>

        {/* Footer CTA */}
        <View style={styles.footerCTA}>
          <AnimatedCard index={13}>
            <Text style={styles.footerTitle}>Start Your Wellness Journey</Text>
            <Text style={styles.footerSubtitle}>
              Join thousands discovering a healthier, more balanced life
            </Text>
            <GradientButton
              title="Create Free Account"
              onPress={() => navigation.navigate('Register')}
              gradient={theme.gradients.primaryToSecondary}
              size="lg"
              style={styles.footerButton}
            />
          </AnimatedCard>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  // Hero
  heroGradient: {
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: theme.spacing['2xl'],
    borderBottomLeftRadius: theme.radius['3xl'],
    borderBottomRightRadius: theme.radius['3xl'],
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 600,
    alignSelf: 'center',
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  heroTitle: {
    ...theme.typography.hero,
    color: theme.colors.textInverse,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  heroSubtitle: {
    ...theme.typography.body,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing['3xl'],
  },
  heroCTAs: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  heroButton: {
    flex: 1,
    maxWidth: 200,
  },
  heroButtonOutline: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  // Sections
  section: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingTop: theme.spacing['4xl'],
  },
  sectionTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing['3xl'],
  },
  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
    justifyContent: 'center',
  },
  featureCard: {
    width: '100%',
    minWidth: 150,
    maxWidth: 280,
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing.lg,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  featureTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  featureDesc: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Steps
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  stepBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  stepNum: {
    ...theme.typography.h3,
    color: theme.colors.textInverse,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  stepDesc: {
    ...theme.typography.bodySm,
    color: theme.colors.textTertiary,
  },
  // Footer CTA
  footerCTA: {
    alignItems: 'center',
    paddingVertical: theme.spacing['5xl'],
    paddingHorizontal: theme.spacing['2xl'],
  },
  footerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  footerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  footerButton: {
    minWidth: 240,
  },
});

export default LandingScreen;
