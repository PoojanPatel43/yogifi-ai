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
import { Ionicons } from '@expo/vector-icons';

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
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.downloadBtnText}>Download App</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Section */}
      <View style={[styles.heroSection, isDesktop && styles.heroSectionDesktop]}>
        <View style={styles.heroContainer}>
          {/* Badge */}
          <Animatable.View animation="fadeInDown" duration={500} style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Wellness App</Text>
          </Animatable.View>

          {/* Main Title */}
          <Animatable.View animation="fadeInUp" duration={600} delay={100}>
            <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
              The Wellness Journey
            </Text>
            <Text style={[styles.heroTitleBold, isDesktop && styles.heroTitleBoldDesktop]}>
              Starts Here
            </Text>
          </Animatable.View>

          {/* Hero Content Layout */}
          <Animatable.View
            animation="fadeIn"
            duration={700}
            delay={300}
            style={[styles.heroContent, isDesktop && styles.heroContentDesktop]}
          >
            {/* Left Testimonial */}
            {isTablet && (
              <View style={styles.testimonialLeft}>
                <View style={styles.testimonialCard}>
                  <Image
                    source={require('../assets/images/yoga-pose.jpg')}
                    style={styles.testimonialAvatar}
                  />
                  <View style={styles.testimonialInfo}>
                    <Text style={styles.testimonialName}>Sarah Mitchell</Text>
                    <Text style={styles.testimonialRole}>
                      Yoga instructor and{'\n'}Health Coach
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Center Phone Mockup */}
            <View style={styles.phoneMockup}>
              <View style={styles.phoneFrame}>
                <View style={styles.phoneScreen}>
                  <Text style={styles.phoneGreeting}>Hey, Yogi!</Text>
                  <View style={styles.phoneSearch}>
                    <Ionicons name="search" size={16} color="#999" />
                  </View>
                  <View style={styles.phoneLabel}>
                    <Text style={styles.phoneLabelText}>Beginner</Text>
                  </View>
                  <View style={styles.phoneCard}>
                    <Text style={styles.phoneCardTitle}>7-Day</Text>
                    <Text style={styles.phoneCardSubtitle}>Yoga{'\n'}Balance</Text>
                    <TouchableOpacity style={styles.phoneCardBtn}>
                      <Text style={styles.phoneCardBtnText}>Get Started</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.phoneProgress}>
                    <Text style={styles.phoneProgressLabel}>Progress</Text>
                    <View style={styles.phoneProgressBars}>
                      {[60, 80, 100, 70, 90, 85, 75].map((h, i) => (
                        <View
                          key={i}
                          style={[styles.phoneProgressBar, { height: h * 0.4 }]}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Right Section - Stats & Avatars */}
            {isTablet && (
              <View style={styles.heroRight}>
                <View style={styles.avatarStack}>
                  <Image
                    source={require('../assets/images/hero-workout.jpg')}
                    style={[styles.stackedAvatar, { zIndex: 3 }]}
                  />
                  <Image
                    source={require('../assets/images/gym-workout.jpg')}
                    style={[styles.stackedAvatar, { marginLeft: -20, zIndex: 2 }]}
                  />
                  <Image
                    source={require('../assets/images/healthy-meal.jpg')}
                    style={[styles.stackedAvatar, { marginLeft: -20, zIndex: 1 }]}
                  />
                </View>
              </View>
            )}
          </Animatable.View>

          {/* Stats Row */}
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={400}
            style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}
          >
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="flame" size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.statValue}>180 kcal</Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="body" size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.statValue}>Yoga Sessions</Text>
                <Text style={styles.statLabel}>15-30 min</Text>
              </View>
            </View>

            {isTablet && (
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                </View>
                <View>
                  <Text style={styles.statValue}>Full body</Text>
                  <Text style={styles.statLabel}>Workout focus</Text>
                </View>
              </View>
            )}
          </Animatable.View>

          {/* Category Pills */}
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={500}
            style={styles.categoryRow}
          >
            {['Pose Setup', 'Sessions', 'AI Coach', 'Wellness Plan'].map((cat, idx) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, idx === 0 && styles.categoryPillActive]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    idx === 0 && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </Animatable.View>
        </View>
      </View>

      {/* Customized Workouts Section */}
      <View style={[styles.workoutsSection, isDesktop && styles.workoutsSectionDesktop]}>
        <View style={[styles.workoutsContainer, isDesktop && styles.workoutsContainerDesktop]}>
          {/* Left Content */}
          <Animatable.View
            animation="fadeInLeft"
            duration={600}
            style={[styles.workoutsLeft, isDesktop && styles.workoutsLeftDesktop]}
          >
            <Text style={styles.sectionLabel}>Your Practice</Text>
            <Text style={[styles.workoutsTitle, isDesktop && styles.workoutsTitleDesktop]}>
              Customized{'\n'}
              <Text style={styles.workoutsTitleItalic}>Workouts </Text>
              for You
            </Text>
            <Text style={styles.workoutsDesc}>
              Individualized programs are tailored specifically to your body, lifestyle, and
              wellness goals, ensuring every session is optimized for you.
            </Text>
            <TouchableOpacity
              style={styles.workoutsBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.workoutsBtnText}>Download App</Text>
            </TouchableOpacity>
          </Animatable.View>

          {/* Right - Program Card */}
          <Animatable.View
            animation="fadeInRight"
            duration={600}
            delay={200}
            style={[styles.workoutsRight, isDesktop && styles.workoutsRightDesktop]}
          >
            <View style={styles.programCard}>
              <Text style={styles.programCardLabel}>Wellness</Text>
              <Text style={styles.programCardTitle}>Program</Text>
              <Text style={styles.programCardTitle}>Plan</Text>

              <View style={styles.programStats}>
                <View style={styles.programStatItem}>
                  <View style={[styles.programStatDot, { backgroundColor: '#6d003f' }]} />
                  <View>
                    <Text style={styles.programStatValue}>5'11, 140 lbs</Text>
                    <Text style={styles.programStatLabel}>Body assessment</Text>
                  </View>
                </View>
                <View style={styles.programStatItem}>
                  <View style={[styles.programStatDot, { backgroundColor: '#4a8c6f' }]} />
                  <View>
                    <Text style={styles.programStatValue}>2 656 kcal</Text>
                    <Text style={styles.programStatLabel}>Daily estimate</Text>
                  </View>
                </View>
                <View style={styles.programStatItem}>
                  <View style={[styles.programStatDot, { backgroundColor: '#a4546e' }]} />
                  <View>
                    <Text style={styles.programStatValue}>Full body</Text>
                    <Text style={styles.programStatLabel}>Workout focus</Text>
                  </View>
                </View>
                <View style={styles.programStatItem}>
                  <View style={[styles.programStatDot, { backgroundColor: '#f7ccdb' }]} />
                  <View>
                    <Text style={styles.programStatValue}>Beginner</Text>
                    <Text style={styles.programStatLabel}>Fitness adjustment</Text>
                  </View>
                </View>
              </View>

              <View style={styles.programProgress}>
                <Text style={styles.programProgressValue}>24%</Text>
              </View>
            </View>

            {/* Transform Card */}
            <View style={styles.transformCard}>
              <Text style={styles.transformEmoji}>😊</Text>
              <Text style={styles.transformTitle}>Transform Dreams</Text>
              <Text style={styles.transformSubtitle}>Into Reality</Text>
            </View>
          </Animatable.View>
        </View>
      </View>

      {/* Dark Workout Options Section */}
      <View style={styles.darkSection}>
        <View style={styles.darkOverlay}>
          <Image
            source={require('../assets/images/gym-workout.jpg')}
            style={styles.darkBgImage}
            resizeMode="cover"
          />
        </View>
        <View style={[styles.darkContent, isDesktop && styles.darkContentDesktop]}>
          <Animatable.View animation="fadeIn" duration={600}>
            <View style={styles.darkBadge}>
              <Text style={styles.darkBadgeText}>Custom Plans</Text>
            </View>
            <Text style={[styles.darkTitle, isDesktop && styles.darkTitleDesktop]}>
              Endless
            </Text>
            <Text style={[styles.darkTitleBold, isDesktop && styles.darkTitleBoldDesktop]}>
              Workout Options
            </Text>
            <Text style={styles.darkDesc}>
              Explore countless training options for flexibility, strength, or maintaining your
              best shape.
            </Text>

            {/* Workout Type Cards */}
            <View style={[styles.workoutTypes, isDesktop && styles.workoutTypesDesktop]}>
              <View style={styles.workoutTypeCard}>
                <Image
                  source={require('../assets/images/yoga-pose.jpg')}
                  style={styles.workoutTypeImage}
                />
                <Text style={styles.workoutTypeTitle}>Yoga Sessions</Text>
                <Text style={styles.workoutTypeCount}>150 poses</Text>
              </View>
              <View style={styles.workoutTypeCard}>
                <Image
                  source={require('../assets/images/hero-workout.jpg')}
                  style={styles.workoutTypeImage}
                />
                <Text style={styles.workoutTypeTitle}>Strength Flow</Text>
                <Text style={styles.workoutTypeCount}>200 videos</Text>
              </View>
              <View style={styles.workoutTypeCard}>
                <Image
                  source={require('../assets/images/healthy-meal.jpg')}
                  style={styles.workoutTypeImage}
                />
                <Text style={styles.workoutTypeTitle}>Full Body Wellness</Text>
                <Text style={styles.workoutTypeCount}>2,000+ videos</Text>
              </View>
            </View>
          </Animatable.View>
        </View>
      </View>

      {/* Elevate Health Section */}
      <View style={[styles.elevateSection, isDesktop && styles.elevateSectionDesktop]}>
        <Animatable.View animation="fadeIn" duration={600} style={styles.elevateHeader}>
          <Text style={styles.elevateLabel}>Smart Wellness</Text>
          <Text style={[styles.elevateTitle, isDesktop && styles.elevateTitleDesktop]}>
            Elevate <Text style={styles.elevateTitleBold}>Health</Text>
          </Text>
          <Text style={[styles.elevateTitle, isDesktop && styles.elevateTitleDesktop]}>
            <Text style={styles.elevateTitleBold}>And Strength</Text>
          </Text>
        </Animatable.View>

        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={200}
          style={[styles.deviceMockups, isDesktop && styles.deviceMockupsDesktop]}
        >
          {/* Watch Mockup */}
          <View style={styles.watchMockup}>
            <View style={styles.watchScreen}>
              <Text style={styles.watchLabel}>Program Plan</Text>
              <Text style={styles.watchTime}>10:11</Text>
              <View style={styles.watchItem}>
                <View style={[styles.watchDot, { backgroundColor: '#6d003f' }]} />
                <Text style={styles.watchItemText}>Standing in Place</Text>
              </View>
              <View style={styles.watchItem}>
                <View style={[styles.watchDot, { backgroundColor: '#a4546e' }]} />
                <Text style={styles.watchItemText}>Bicycle Crunch</Text>
              </View>
              <View style={styles.watchItem}>
                <View style={[styles.watchDot, { backgroundColor: '#4a8c6f' }]} />
                <Text style={styles.watchItemText}>Leg Raises</Text>
              </View>
            </View>
          </View>

          {/* Center Image */}
          <Image
            source={require('../assets/images/yoga-pose.jpg')}
            style={styles.elevateImage}
          />

          {/* Phone Mockup */}
          <View style={styles.elevatePhone}>
            <View style={styles.elevatePhoneScreen}>
              <Text style={styles.elevatePhoneGreeting}>Hey Yogi!</Text>
              <View style={styles.elevatePhoneCard}>
                <Text style={styles.elevatePhoneCardTitle}>5-Day</Text>
                <Text style={styles.elevatePhoneCardSubtitle}>Strength</Text>
                <Text style={styles.elevatePhoneProgress}>5 Days Plan</Text>
              </View>
            </View>
          </View>
        </Animatable.View>
      </View>

      {/* Work With Us Banner */}
      <View style={styles.bannerSection}>
        <Text style={styles.bannerText}>Practice With Us • Practice With Us • </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.footerContent, isDesktop && styles.footerContentDesktop]}>
          {/* Footer Left */}
          <View style={styles.footerLeft}>
            <Text style={styles.footerTitle}>Empowering Every</Text>
            <Text style={styles.footerTitle}>Step of Wellness!</Text>
            <Text style={styles.footerSubtitle}>Start today, stay fit forever.</Text>
            <TouchableOpacity
              style={styles.footerBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.footerBtnText}>Download App</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Links */}
          <View style={[styles.footerLinks, isDesktop && styles.footerLinksDesktop]}>
            <View style={styles.footerLinkGroup}>
              <Text style={styles.footerLinkTitle}>Sitemap</Text>
              <TouchableOpacity>
                <Text style={styles.footerLink}>About Us</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Features</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Contact</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.footerLinkGroup}>
              <Text style={styles.footerLinkTitle}>Social</Text>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Instagram</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.footerLink}>LinkedIn</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.footerLinkGroup}>
              <Text style={styles.footerLinkTitle}>Support</Text>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Help Center</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.footerLink}>FAQs</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Pricing</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer Bottom */}
        <View style={styles.footerBottom}>
          <Text style={styles.footerCopyright}>All rights reserved</Text>
          <View style={styles.footerBottomLinks}>
            <TouchableOpacity>
              <Text style={styles.footerBottomLink}>Terms</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerBottomLink}>Privacy</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerBottomLink}>Cookies</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.scrollTopBtn}>
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    backgroundColor: '#fafafa',
    paddingTop: Platform.OS === 'web' ? 0 : 44,
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  headerInnerDesktop: {
    paddingHorizontal: 48,
  },
  logo: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'Inter_600SemiBold',
  },
  downloadBtn: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 60,
    backgroundColor: '#fafafa',
  },
  heroSectionDesktop: {
    paddingTop: 60,
    paddingBottom: 80,
  },
  heroContainer: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  heroBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    marginBottom: 24,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '300',
    color: '#1a1a1a',
    textAlign: 'center',
    fontFamily: 'Inter_300Light',
    letterSpacing: -1,
  },
  heroTitleDesktop: {
    fontSize: 56,
  },
  heroTitleBold: {
    fontSize: 40,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
    marginBottom: 40,
  },
  heroTitleBoldDesktop: {
    fontSize: 56,
  },
  heroContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  heroContentDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Testimonial
  testimonialLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  testimonialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testimonialAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  testimonialInfo: {},
  testimonialName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'Inter_600SemiBold',
  },
  testimonialRole: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'DMSans_400Regular',
    lineHeight: 16,
  },

  // Phone Mockup
  phoneMockup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    width: 220,
    height: 400,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 20,
      },
    }),
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    padding: 16,
  },
  phoneGreeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  phoneSearch: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  phoneLabel: {
    backgroundColor: '#e8e8e8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  phoneLabelText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },
  phoneCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  phoneCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter_700Bold',
  },
  phoneCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
    fontFamily: 'DMSans_400Regular',
  },
  phoneCardBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  phoneCardBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  phoneProgress: {
    marginTop: 8,
  },
  phoneProgressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Inter_500Medium',
  },
  phoneProgressBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 40,
  },
  phoneProgressBar: {
    width: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },

  // Hero Right
  heroRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#fafafa',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  statsRowDesktop: {
    gap: 60,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'Inter_600SemiBold',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'DMSans_400Regular',
  },

  // Category Pills
  categoryRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  categoryPillActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  categoryPillText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },
  categoryPillTextActive: {
    color: '#fff',
  },

  // Customized Workouts Section
  workoutsSection: {
    paddingHorizontal: 24,
    paddingVertical: 80,
    backgroundColor: '#fff',
  },
  workoutsSectionDesktop: {
    paddingVertical: 120,
  },
  workoutsContainer: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  workoutsContainerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 60,
  },
  workoutsLeft: {
    marginBottom: 40,
  },
  workoutsLeftDesktop: {
    flex: 1,
    marginBottom: 0,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    fontFamily: 'Inter_500Medium',
  },
  workoutsTitle: {
    fontSize: 36,
    color: '#1a1a1a',
    marginBottom: 20,
    lineHeight: 44,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  workoutsTitleDesktop: {
    fontSize: 48,
    lineHeight: 56,
  },
  workoutsTitleItalic: {
    fontStyle: 'italic',
    fontWeight: '300',
    fontFamily: 'Inter_300Light',
  },
  workoutsDesc: {
    fontSize: 16,
    color: '#666',
    lineHeight: 26,
    marginBottom: 32,
    fontFamily: 'DMSans_400Regular',
  },
  workoutsBtn: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  workoutsBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },

  // Program Card
  workoutsRight: {
    alignItems: 'center',
  },
  workoutsRightDesktop: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  programCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    padding: 24,
    width: 280,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  programCardLabel: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  programCardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Inter_700Bold',
    lineHeight: 32,
  },
  programStats: {
    marginTop: 24,
    gap: 16,
  },
  programStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  programStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  programStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'Inter_600SemiBold',
  },
  programStatLabel: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'DMSans_400Regular',
  },
  programProgress: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignSelf: 'flex-start',
  },
  programProgressValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Inter_700Bold',
  },

  // Transform Card
  transformCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
      },
    }),
  },
  transformEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  transformTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'Inter_600SemiBold',
  },
  transformSubtitle: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'DMSans_400Regular',
  },

  // Dark Section
  darkSection: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 80,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  darkBgImage: {
    width: '100%',
    height: '100%',
  },
  darkContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  darkContentDesktop: {
    paddingHorizontal: 48,
  },
  darkBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  darkBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Inter_500Medium',
  },
  darkTitle: {
    fontSize: 36,
    fontWeight: '300',
    color: '#fff',
    fontFamily: 'Inter_300Light',
  },
  darkTitleDesktop: {
    fontSize: 56,
  },
  darkTitleBold: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
  },
  darkTitleBoldDesktop: {
    fontSize: 56,
  },
  darkDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 26,
    marginBottom: 40,
    maxWidth: 400,
    fontFamily: 'DMSans_400Regular',
  },

  // Workout Types
  workoutTypes: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  workoutTypesDesktop: {
    gap: 24,
  },
  workoutTypeCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 12,
    width: 140,
  },
  workoutTypeImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginBottom: 12,
  },
  workoutTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  workoutTypeCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'DMSans_400Regular',
  },

  // Elevate Section
  elevateSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#fafafa',
  },
  elevateSectionDesktop: {
    paddingVertical: 120,
  },
  elevateHeader: {
    alignItems: 'center',
    marginBottom: 60,
  },
  elevateLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    fontFamily: 'Inter_500Medium',
  },
  elevateTitle: {
    fontSize: 36,
    color: '#1a1a1a',
    textAlign: 'center',
    fontFamily: 'Inter_300Light',
    fontWeight: '300',
  },
  elevateTitleDesktop: {
    fontSize: 48,
  },
  elevateTitleBold: {
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },

  // Device Mockups
  deviceMockups: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
  },
  deviceMockupsDesktop: {
    gap: 40,
  },
  watchMockup: {
    width: 160,
    height: 200,
    backgroundColor: '#1a1a1a',
    borderRadius: 32,
    padding: 16,
  },
  watchScreen: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 12,
  },
  watchLabel: {
    fontSize: 8,
    color: '#999',
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  watchTime: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
  },
  watchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  watchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  watchItemText: {
    fontSize: 9,
    color: '#fff',
    fontFamily: 'DMSans_400Regular',
  },
  elevateImage: {
    width: 200,
    height: 280,
    borderRadius: 24,
  },
  elevatePhone: {
    width: 180,
    height: 320,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.12,
        shadowRadius: 30,
        elevation: 20,
      },
    }),
  },
  elevatePhoneScreen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    padding: 16,
  },
  elevatePhoneGreeting: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  elevatePhoneCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 16,
  },
  elevatePhoneCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter_700Bold',
  },
  elevatePhoneCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'DMSans_400Regular',
  },
  elevatePhoneProgress: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    fontFamily: 'Inter_500Medium',
  },

  // Banner Section
  bannerSection: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 40,
    overflow: 'hidden',
  },
  bannerText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },

  // Footer
  footer: {
    backgroundColor: '#1a1a1a',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  footerContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  footerContentDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLeft: {
    marginBottom: 40,
  },
  footerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    lineHeight: 36,
  },
  footerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
    marginBottom: 24,
    fontFamily: 'DMSans_400Regular',
  },
  footerBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  footerBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'Inter_600SemiBold',
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 40,
    flexWrap: 'wrap',
  },
  footerLinksDesktop: {
    gap: 80,
  },
  footerLinkGroup: {
    gap: 12,
  },
  footerLinkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  footerLink: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'DMSans_400Regular',
  },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    flexWrap: 'wrap',
    gap: 16,
  },
  footerCopyright: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'DMSans_400Regular',
  },
  footerBottomLinks: {
    flexDirection: 'row',
    gap: 24,
  },
  footerBottomLink: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'DMSans_400Regular',
  },
  scrollTopBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LandingScreen;
