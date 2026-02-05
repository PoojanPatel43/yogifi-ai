import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Image,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { theme } from '../constants/theme';
import { GradientButton } from '../components/ui';
import { GradientBlob } from '../components/GradientBlob';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

const LandingScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerInner, isDesktop && styles.headerInnerDesktop]}>
          <Text style={styles.logo}>Yogifi</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
            <GradientButton
              title="Get Started"
              onPress={() => navigation.navigate('Register')}
              variant="dark"
              size="sm"
            />
          </View>
        </View>
      </View>

      {/* Hero Section - Large, Bold Typography with Gradient Blobs */}
      <View style={[styles.heroSection, isDesktop && styles.heroSectionDesktop]}>
        {/* Animated Gradient Blobs - Athleticon Style */}
        <GradientBlob
          colors={['#9333ea', '#db2777']}
          size={isDesktop ? 500 : 350}
          top={-100}
          right={-150}
          opacity={0.12}
          duration={6000}
        />
        <GradientBlob
          colors={['#3b82f6', '#8b5cf6']}
          size={isDesktop ? 400 : 280}
          top={200}
          left={-120}
          opacity={0.10}
          duration={5000}
        />
        <GradientBlob
          colors={['#ec4899', '#f472b6']}
          size={isDesktop ? 450 : 320}
          bottom={-100}
          right={-80}
          opacity={0.08}
          duration={5500}
        />

        <View style={[styles.heroContent, isDesktop && styles.heroContentDesktop]}>
          {/* Left Side: Typography + CTA */}
          <View style={[styles.heroLeft, isDesktop && styles.heroLeftDesktop]}>
            <Animatable.View animation="fadeInUp" duration={600} delay={100}>
              <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
                Your Wellness,{'\n'}Guided by AI
              </Text>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" duration={600} delay={250}>
              <Text style={[styles.heroSubtitle, isDesktop && styles.heroSubtitleDesktop]}>
                AI-powered yoga coaching, personalized fitness plans, and nutrition guidance — all in one platform
              </Text>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" duration={600} delay={400} style={styles.heroCTAs}>
              <GradientButton
                title="Get Started"
                onPress={() => navigation.navigate('Register')}
                variant="dark"
                size="lg"
                style={styles.heroPrimaryBtn}
              />
            </Animatable.View>
          </View>

          {/* Right Side: Large Hero Image */}
          {isTablet && (
            <Animatable.View animation="fadeInRight" duration={700} delay={300} style={styles.heroRight}>
              <Image
                source={require('../assets/images/hero-workout.jpg')}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </Animatable.View>
          )}
        </View>
      </View>

      {/* Social Proof Stats - Centered */}
      <Animatable.View animation="fadeIn" delay={600} duration={600} style={styles.proofSection}>
        <View style={[styles.proofRow, isDesktop && styles.proofRowDesktop]}>
          <View style={styles.proofStat}>
            <Text style={styles.proofNumber}>10,000+</Text>
            <Text style={styles.proofLabel}>Members</Text>
          </View>
          <View style={styles.proofDivider} />
          <View style={styles.proofStat}>
            <Text style={styles.proofNumber}>4.9</Text>
            <Text style={styles.proofLabel}>Rating</Text>
          </View>
          <View style={styles.proofDivider} />
          <View style={styles.proofStat}>
            <Text style={styles.proofNumber}>95%</Text>
            <Text style={styles.proofLabel}>Success Rate</Text>
          </View>
        </View>
      </Animatable.View>

      {/* Features Section - Large Image Blocks (Editorial Style) */}
      <View style={styles.featuresSection}>
        <Animatable.View animation="fadeIn" duration={600}>
          <Text style={styles.sectionLabel}>WHAT WE OFFER</Text>
        </Animatable.View>

        {/* Feature 1: AI Yoga Coach */}
        <Animatable.View animation="fadeInUp" delay={100} duration={600}>
          <View style={[styles.featureBlock, isDesktop && styles.featureBlockDesktop]}>
            <Image
              source={require('../assets/images/yoga-pose.jpg')}
              style={[styles.featureImage, isDesktop && styles.featureImageDesktop]}
              resizeMode="cover"
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>AI Yoga Coach</Text>
              <Text style={styles.featureDesc}>
                Real-time pose detection and correction with personalized feedback. Get instant guidance to perfect your form and progress safely.
              </Text>
            </View>
          </View>
        </Animatable.View>

        {/* Feature 2: Fitness Plans */}
        <Animatable.View animation="fadeInUp" delay={200} duration={600}>
          <View style={[styles.featureBlock, styles.featureBlockReverse, isDesktop && styles.featureBlockDesktop]}>
            {isTablet && (
              <Image
                source={require('../assets/images/gym-workout.jpg')}
                style={[styles.featureImage, isDesktop && styles.featureImageDesktop]}
                resizeMode="cover"
              />
            )}
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Personalized Fitness Plans</Text>
              <Text style={styles.featureDesc}>
                AI-generated workout routines tailored to your fitness level, goals, and available equipment. From beginner to advanced.
              </Text>
            </View>
            {!isTablet && (
              <Image
                source={require('../assets/images/gym-workout.jpg')}
                style={styles.featureImage}
                resizeMode="cover"
              />
            )}
          </View>
        </Animatable.View>

        {/* Feature 3: Nutrition Guidance */}
        <Animatable.View animation="fadeInUp" delay={300} duration={600}>
          <View style={[styles.featureBlock, isDesktop && styles.featureBlockDesktop]}>
            <Image
              source={require('../assets/images/healthy-meal.jpg')}
              style={[styles.featureImage, isDesktop && styles.featureImageDesktop]}
              resizeMode="cover"
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Smart Nutrition Plans</Text>
              <Text style={styles.featureDesc}>
                Custom meal plans based on your dietary preferences, allergies, and wellness goals. Healthy eating made simple.
              </Text>
            </View>
          </View>
        </Animatable.View>
      </View>

      {/* Bottom CTA Section - Dark Background */}
      <View style={styles.ctaSection}>
        <Animatable.View animation="fadeIn" duration={600} style={styles.ctaInner}>
          <Text style={styles.ctaTitle}>Start Your Wellness{'\n'}Journey Today</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands transforming their health with AI-powered guidance
          </Text>
          <GradientButton
            title="Get Started"
            onPress={() => navigation.navigate('Register')}
            variant="accent"
            size="lg"
            style={styles.ctaButton}
          />
          <Text style={styles.ctaFootnote}>No credit card required</Text>
        </Animatable.View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLogo}>Yogifi</Text>
        <Text style={styles.footerText}>AI-powered wellness platform</Text>
        <View style={styles.footerLinks}>
          <TouchableOpacity><Text style={styles.footerLink}>Privacy</Text></TouchableOpacity>
          <Text style={styles.footerDivider}>•</Text>
          <TouchableOpacity><Text style={styles.footerLink}>Terms</Text></TouchableOpacity>
          <Text style={styles.footerDivider}>•</Text>
          <TouchableOpacity><Text style={styles.footerLink}>Contact</Text></TouchableOpacity>
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

  // Header
  header: {
    position: Platform.OS === 'web' ? ('sticky' as any) : 'relative',
    top: 0,
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screen,
    paddingVertical: 16,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  headerInnerDesktop: {
    paddingHorizontal: 48,
  },
  logo: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  signInLink: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: theme.spacing.screen,
    paddingTop: 100,
    paddingBottom: 80,
    position: 'relative',
    overflow: 'hidden',
  },
  heroSectionDesktop: {
    paddingTop: 120,
    paddingBottom: 100,
    paddingHorizontal: 48,
  },
  heroContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  heroContentDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 60,
  },
  heroLeft: {
    flex: 1,
  },
  heroLeftDesktop: {
    flex: 1,
    maxWidth: 600,
  },
  heroRight: {
    flex: 1,
    maxWidth: 500,
  },
  heroImage: {
    width: '100%',
    height: 500,
    borderRadius: theme.radius.xl,
    ...theme.shadows.lg,
  },
  heroTitle: {
    ...theme.typography.hero,
    fontSize: 56,
    color: theme.colors.text,
    marginBottom: 24,
    lineHeight: 64,
  },
  heroTitleDesktop: {
    ...theme.typography.display,
    fontSize: 72,
    lineHeight: 80,
  },
  heroSubtitle: {
    ...theme.typography.bodyLarge,
    fontSize: 20,
    color: theme.colors.textSecondary,
    marginBottom: 40,
    lineHeight: 32,
  },
  heroSubtitleDesktop: {
    fontSize: 22,
    lineHeight: 34,
  },
  heroCTAs: {
    marginBottom: 16,
  },
  heroPrimaryBtn: {
    minWidth: 200,
  },

  // Social Proof
  proofSection: {
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: 100,
  },
  proofRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  proofRowDesktop: {
    gap: 80,
  },
  proofStat: {
    alignItems: 'center',
  },
  proofNumber: {
    ...theme.typography.h2,
    fontSize: 40,
    color: theme.colors.text,
    marginBottom: 4,
  },
  proofLabel: {
    ...theme.typography.bodySm,
    fontSize: 16,
    color: theme.colors.textTertiary,
  },
  proofDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.borderLight,
  },

  // Features Section
  featuresSection: {
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: 100,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  sectionLabel: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    marginBottom: 60,
    textAlign: 'center',
  },
  featureBlock: {
    marginBottom: 80,
  },
  featureBlockDesktop: {
    flexDirection: 'row',
    gap: 60,
    alignItems: 'center',
  },
  featureBlockReverse: {
    // On tablet/desktop, reverse the order
  },
  featureImage: {
    width: '100%',
    height: 300,
    borderRadius: theme.radius.lg,
    marginBottom: 24,
    ...theme.shadows.md,
  },
  featureImageDesktop: {
    width: 500,
    height: 400,
    marginBottom: 0,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...theme.typography.h2,
    fontSize: 32,
    color: theme.colors.text,
    marginBottom: 16,
  },
  featureDesc: {
    ...theme.typography.body,
    fontSize: 18,
    color: theme.colors.textSecondary,
    lineHeight: 28,
  },

  // CTA Section - Dark
  ctaSection: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 120,
    paddingHorizontal: theme.spacing.screen,
  },
  ctaInner: {
    alignItems: 'center',
    maxWidth: 600,
    alignSelf: 'center',
  },
  ctaTitle: {
    ...theme.typography.h1,
    fontSize: 48,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 56,
  },
  ctaSubtitle: {
    ...theme.typography.bodyLarge,
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 28,
  },
  ctaButton: {
    minWidth: 220,
    marginBottom: 16,
  },
  ctaFootnote: {
    ...theme.typography.bodySm,
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: theme.spacing.screen,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  footerLogo: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    marginBottom: 8,
    fontWeight: '700',
  },
  footerText: {
    ...theme.typography.bodySm,
    color: theme.colors.textTertiary,
    marginBottom: 24,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerLink: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
  },
  footerDivider: {
    color: theme.colors.borderLight,
  },
});

export default LandingScreen;
