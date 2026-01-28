import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import Colors from '../constants/colors';
import { APP_CONFIG } from '../constants/config';

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
    // Trigger haptic feedback
    if (APP_CONFIG.ENABLE_HAPTIC_FEEDBACK) {
      Haptics.notificationAsync(
        showConfetti
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
    }

    // Animate score in
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

    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Trigger confetti for good scores
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
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.error;
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
      {/* Confetti for good scores */}
      {showConfetti && (
        <ConfettiCannon
          ref={confettiRef}
          count={150}
          origin={{ x: -10, y: 0 }}
          autoStart={false}
          fadeOut
          fallSpeed={3000}
          colors={[Colors.primary, Colors.secondary, Colors.success, '#FFD700', '#FF69B4']}
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
            <View style={styles.header}>
              <Text style={styles.emoji}>{getScoreEmoji(overallScore)}</Text>
              <Text style={styles.title}>Session Complete!</Text>
              <Text style={styles.poseName}>{poseName}</Text>
            </View>

            {/* Main Score Card */}
            <Animated.View
              style={[
                styles.scoreCard,
                { transform: [{ scale: scaleAnim }] },
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

            {/* Stats Row */}
            <Animated.View style={[styles.statsCard, { opacity: fadeAnim }]}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={28} color={Colors.primary} />
                <Text style={styles.statValue}>{formatDuration(duration)}</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>

              <View style={styles.statDivider} />

              {stabilityScore !== undefined && (
                <>
                  <View style={styles.statItem}>
                    <Ionicons name="fitness-outline" size={28} color={Colors.secondary} />
                    <Text style={styles.statValue}>{stabilityScore}</Text>
                    <Text style={styles.statLabel}>Stability</Text>
                  </View>
                  <View style={styles.statDivider} />
                </>
              )}

              {alignmentScore !== undefined && (
                <View style={styles.statItem}>
                  <Ionicons name="resize-outline" size={28} color={Colors.warning} />
                  <Text style={styles.statValue}>{alignmentScore}</Text>
                  <Text style={styles.statLabel}>Alignment</Text>
                </View>
              )}
            </Animated.View>

            {/* Branding for shared image */}
            <Text style={styles.shareBranding}>Yogifi AI</Text>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <Animated.View style={[styles.actionButtons, { opacity: fadeAnim }]}>
          {/* AI Coach Insights - Primary CTA */}
          <TouchableOpacity style={styles.aiCoachButton} onPress={handleAICoach}>
            <View style={styles.aiCoachIcon}>
              <Ionicons name="sparkles" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.aiCoachContent}>
              <Text style={styles.aiCoachTitle}>AI Coach Insights</Text>
              <Text style={styles.aiCoachSubtitle}>Get personalized feedback</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* View Details & Share Row */}
          <View style={styles.rowButtons}>
            <TouchableOpacity style={styles.detailsButton} onPress={handleViewDetails}>
              <Ionicons name="analytics-outline" size={22} color={Colors.primary} />
              <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color={Colors.success} />
              <Text style={styles.shareButtonText}>Share Score</Text>
            </TouchableOpacity>
          </View>

          {/* Practice Again */}
          <TouchableOpacity style={styles.primaryButton} onPress={handlePracticeAgain}>
            <Ionicons name="refresh" size={22} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Practice Again</Text>
          </TouchableOpacity>

          {/* Home Button */}
          <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
            <Ionicons name="home-outline" size={22} color={Colors.textLight} />
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  poseName: {
    fontSize: 18,
    color: Colors.textLight,
  },
  scoreCard: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 80,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 24,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  scoreLabel: {
    fontSize: 20,
    color: Colors.textLight,
    fontWeight: '500',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 12,
  },
  aiCoachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  aiCoachIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiCoachContent: {
    flex: 1,
  },
  aiCoachTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiCoachSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  shareableCard: {
    backgroundColor: Colors.background,
  },
  shareBranding: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    paddingBottom: 16,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailsButtonText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  shareButtonText: {
    fontSize: 15,
    color: Colors.success,
    fontWeight: '500',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  homeButtonText: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '500',
  },
});

export default SessionCompleteScreen;
