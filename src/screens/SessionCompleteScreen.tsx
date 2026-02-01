import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from '../utils/haptics';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { theme } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';
import { AnimatedCard, GradientButton } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionComplete'>;

const SessionCompleteScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    sessionId,
    poseName,
    duration,
    overallScore,
    stabilityScore,
    alignmentScore,
  } = route.params;

  const confettiRef = useRef<any>(null);
  const shareCardRef = useRef<any>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showConfetti = overallScore >= APP_CONFIG.CONFETTI_SCORE_THRESHOLD;

  useEffect(() => {
    if (APP_CONFIG.ENABLE_HAPTIC_FEEDBACK) {
      Haptics.notificationAsync(
        showConfetti
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 300,
      useNativeDriver: true,
    }).start();

    if (showConfetti && confettiRef.current) {
      setTimeout(() => {
        confettiRef.current?.start();
      }, 500);
    }
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.warning;
    return theme.colors.accent;
  };

  const getScoreGlow = (score: number): string => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.warning;
    return theme.colors.accent;
  };

  const getScoreEmoji = (score: number): string => {
    if (score >= 90) return '🌟';
    if (score >= 80) return '🎉';
    if (score >= 70) return '💪';
    if (score >= 60) return '👍';
    return '🧘';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Outstanding!';
    if (score >= 80) return 'Excellent!';
    if (score >= 70) return 'Great job!';
    if (score >= 60) return 'Good effort!';
    return 'Keep practicing!';
  };

  const handleAICoach = () => {
    if (APP_CONFIG.ENABLE_HAPTIC_FEEDBACK) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('AICoach', {
      sessionId,
      poseName,
      overallScore,
      duration,
    });
  };

  const handleGoHome = () => {
    if (APP_CONFIG.ENABLE_HAPTIC_FEEDBACK) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.replace('Home');
  };

  const handlePracticeAgain = () => {
    if (APP_CONFIG.ENABLE_HAPTIC_FEEDBACK) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.replace('PoseSelection');
  };

  const handleViewDetails = () => {
    if (APP_CONFIG.ENABLE_HAPTIC_FEEDBACK) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('SessionDetails', { sessionId });
  };

  const handleShare = async () => {
    if (APP_CONFIG.ENABLE_HAPTIC_FEEDBACK) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
        return;
      }

      if (shareCardRef.current) {
        const uri = await captureRef(shareCardRef, {
          format: 'png',
          quality: 1,
        });
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your yoga score',
        });
      }
    } catch (error) {
      console.log('Error sharing:', error);
      Alert.alert('Error', 'Could not share your score. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Subtle gradient background */}
      <LinearGradient
        colors={theme.gradients.surface as any}
        style={StyleSheet.absoluteFill}
      />

      {/* Confetti for good scores */}
      {showConfetti && (
        <ConfettiCannon
          ref={confettiRef}
          count={150}
          origin={{ x: -10, y: 0 }}
          autoStart={false}
          fadeOut
          fallSpeed={3000}
          colors={[
            theme.colors.primary,
            theme.colors.secondary,
            theme.colors.success,
            theme.colors.warning,
            theme.colors.accentLight,
          ]}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shareable Score Card */}
        <ViewShot ref={shareCardRef} options={{ format: 'png', quality: 1 }}>
          <View style={styles.shareableCard}>
            {/* Header with emoji and title */}
            <AnimatedCard index={0} enterFrom="scale">
              <View style={styles.header}>
                <Text style={styles.emoji}>{getScoreEmoji(overallScore)}</Text>
                <Text style={styles.title}>Session Complete!</Text>
                <Text style={styles.poseName}>{poseName}</Text>
              </View>
            </AnimatedCard>

            {/* Main Score Card */}
            <AnimatedCard index={1} enterFrom="scale">
              <Animated.View
                style={[
                  styles.scoreCard,
                  {
                    transform: [{ scale: scaleAnim }],
                    ...theme.shadows.glow(getScoreGlow(overallScore)),
                  },
                ]}
              >
                <View style={styles.scoreCircle}>
                  <Text style={[styles.scoreValue, { color: getScoreColor(overallScore) }]}>
                    {overallScore}
                  </Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </View>
                <Text style={styles.scoreLabel}>{getScoreLabel(overallScore)}</Text>
              </Animated.View>
            </AnimatedCard>

            {/* Stats Row */}
            <AnimatedCard index={2} enterFrom="bottom">
              <Animated.View style={[styles.statsCard, { opacity: fadeAnim }]}>
                <View style={styles.statItem}>
                  <View style={[styles.statIconBg, { backgroundColor: theme.colors.primaryMuted }]}>
                    <Ionicons name="time-outline" size={22} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.statValue}>{formatDuration(duration)}</Text>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>

                <View style={styles.statDivider} />

                {stabilityScore !== undefined && (
                  <>
                    <View style={styles.statItem}>
                      <View style={[styles.statIconBg, { backgroundColor: theme.colors.secondaryMuted }]}>
                        <Ionicons name="fitness-outline" size={22} color={theme.colors.secondary} />
                      </View>
                      <Text style={styles.statValue}>{stabilityScore}</Text>
                      <Text style={styles.statLabel}>Stability</Text>
                    </View>
                    <View style={styles.statDivider} />
                  </>
                )}

                {alignmentScore !== undefined && (
                  <View style={styles.statItem}>
                    <View style={[styles.statIconBg, { backgroundColor: theme.colors.warningMuted }]}>
                      <Ionicons name="resize-outline" size={22} color={theme.colors.warning} />
                    </View>
                    <Text style={styles.statValue}>{alignmentScore}</Text>
                    <Text style={styles.statLabel}>Alignment</Text>
                  </View>
                )}
              </Animated.View>
            </AnimatedCard>

            {/* Branding for shared image */}
            <Text style={styles.shareBranding}>Yogifi AI</Text>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <Animated.View style={[styles.actionButtons, { opacity: fadeAnim }]}>
          {/* AI Coach Insights - Primary CTA */}
          <AnimatedCard index={3} enterFrom="bottom">
            <TouchableOpacity style={styles.aiCoachButton} onPress={handleAICoach} activeOpacity={0.8}>
              <LinearGradient
                colors={theme.gradients.primaryToSecondary as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.aiCoachGradient}
              >
                <View style={styles.aiCoachIcon}>
                  <Ionicons name="sparkles" size={22} color={theme.colors.textInverse} />
                </View>
                <View style={styles.aiCoachContent}>
                  <Text style={styles.aiCoachTitle}>AI Coach Insights</Text>
                  <Text style={styles.aiCoachSubtitle}>Get personalized feedback</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={theme.colors.textInverse} />
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedCard>

          {/* View Details & Share Row */}
          <AnimatedCard index={4} enterFrom="bottom">
            <View style={styles.rowButtons}>
              <TouchableOpacity style={styles.detailsButton} onPress={handleViewDetails} activeOpacity={0.7}>
                <View style={[styles.actionIconBg, { backgroundColor: theme.colors.primaryMuted }]}>
                  <Ionicons name="analytics-outline" size={18} color={theme.colors.primary} />
                </View>
                <Text style={styles.detailsButtonText}>View Details</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.7}>
                <View style={[styles.actionIconBg, { backgroundColor: theme.colors.successMuted }]}>
                  <Ionicons name="share-outline" size={18} color={theme.colors.success} />
                </View>
                <Text style={styles.shareButtonText}>Share Score</Text>
              </TouchableOpacity>
            </View>
          </AnimatedCard>

          {/* Practice Again */}
          <AnimatedCard index={5} enterFrom="bottom">
            <GradientButton
              title="Practice Again"
              onPress={handlePracticeAgain}
              gradient={theme.gradients.success}
              size="lg"
              icon={<Ionicons name="refresh" size={20} color={theme.colors.textInverse} />}
            />
          </AnimatedCard>

          {/* Home Button */}
          <AnimatedCard index={6} enterFrom="bottom">
            <TouchableOpacity style={styles.homeButton} onPress={handleGoHome} activeOpacity={0.7}>
              <Ionicons name="home-outline" size={20} color={theme.colors.textTertiary} />
              <Text style={styles.homeButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </AnimatedCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  shareableCard: {
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: theme.spacing['2xl'],
  },
  emoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  poseName: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  // Score Card
  scoreCard: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.screen,
    marginBottom: theme.spacing['2xl'],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['2xl'],
    paddingVertical: theme.spacing['3xl'],
    paddingHorizontal: theme.spacing['2xl'],
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.sm,
  },
  scoreValue: {
    fontSize: 80,
    fontWeight: '800',
    letterSpacing: -2,
  },
  scoreMax: {
    ...theme.typography.h2,
    color: theme.colors.textTertiary,
    marginLeft: 4,
  },
  scoreLabel: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
  },
  // Stats Card
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.screen,
    borderRadius: theme.radius.xl,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing['3xl'],
    ...theme.shadows.sm,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statDivider: {
    width: 1,
    height: 56,
    backgroundColor: theme.colors.borderLight,
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: 2,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  shareBranding: {
    textAlign: 'center',
    ...theme.typography.bodySmMedium,
    color: theme.colors.primary,
    paddingBottom: theme.spacing.lg,
  },
  // Action Buttons
  actionButtons: {
    paddingHorizontal: theme.spacing.screen,
    gap: theme.spacing.md,
  },
  aiCoachButton: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    ...theme.shadows.colored(theme.colors.primary),
  },
  aiCoachGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  aiCoachIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiCoachContent: {
    flex: 1,
  },
  aiCoachTitle: {
    ...theme.typography.h3,
    color: theme.colors.textInverse,
  },
  aiCoachSubtitle: {
    ...theme.typography.bodySm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  // Row Buttons
  rowButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionIconBg: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  detailsButtonText: {
    ...theme.typography.bodySmMedium,
    color: theme.colors.primary,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  shareButtonText: {
    ...theme.typography.bodySmMedium,
    color: theme.colors.success,
  },
  // Home Button
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  homeButtonText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textTertiary,
  },
});

export default SessionCompleteScreen;
