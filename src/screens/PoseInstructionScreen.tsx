import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Pose } from '../types';
import { getPoseByIdApi } from '../services/api';
import Colors from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'PoseInstruction'>;

const { width } = Dimensions.get('window');

// Pose-specific step-by-step instructions
const poseStepInstructions: Record<string, string[]> = {
  'Warrior II': [
    'Start in Mountain Pose (Tadasana) at the front of your mat',
    'Step your left foot back 3-4 feet, turning it out 90 degrees',
    'Align your front heel with the arch of your back foot',
    'Extend your arms out to the sides, parallel to the floor',
    'Bend your front knee to 90 degrees, keeping it over your ankle',
    'Turn your head to gaze over your front fingertips',
    'Press firmly through the outer edge of your back foot',
    'Keep your torso centered between your hips',
  ],
  'Tree Pose': [
    'Begin standing in Mountain Pose (Tadasana)',
    'Shift your weight onto your left foot',
    'Place the sole of your right foot on your inner left thigh or calf',
    'Avoid placing your foot directly on your knee',
    'Bring your palms together at heart center',
    'Fix your gaze on a steady point in front of you',
    'Engage your core and lengthen your spine',
    'Once stable, you may raise your arms overhead',
  ],
  'Mountain Pose': [
    'Stand with your feet together or hip-width apart',
    'Distribute your weight evenly across both feet',
    'Engage your thighs and lift your kneecaps',
    'Tuck your tailbone slightly and engage your core',
    'Roll your shoulders back and down',
    'Let your arms hang naturally with palms facing forward',
    'Lengthen through the crown of your head',
    'Breathe deeply and hold for 30-60 seconds',
  ],
};

// Default instructions if pose not in our database
const defaultStepInstructions = [
  'Find a comfortable standing position',
  'Focus on your breath and center yourself',
  'Follow the on-screen guidance during the session',
  'Move slowly and mindfully into the pose',
  'Listen to your body and avoid forcing any movement',
];

const difficultyColors: Record<string, string> = {
  BEGINNER: Colors.success,
  INTERMEDIATE: Colors.warning,
  ADVANCED: Colors.error,
};

const PoseInstructionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { poseId, poseName } = route.params;
  const [pose, setPose] = useState<Pose | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>('steps');

  useEffect(() => {
    const fetchPose = async () => {
      setIsLoading(true);
      try {
        const response = await getPoseByIdApi(poseId);
        if (response.success && response.data) {
          setPose(response.data);
        }
      } catch (error) {
        console.log('Error fetching pose:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPose();
  }, [poseId]);

  const steps = poseStepInstructions[poseName] || defaultStepInstructions;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleStartPractice = () => {
    navigation.navigate('CameraSetup', { poseId, poseName });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading pose details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pose Guide</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pose Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.poseImageContainer}>
            {pose?.imageUrl ? (
              <Image source={{ uri: pose.imageUrl }} style={styles.poseImage} resizeMode="cover" />
            ) : (
              <View style={styles.poseImagePlaceholder}>
                <Ionicons name="body" size={80} color={Colors.textMuted} />
              </View>
            )}
          </View>
          <Text style={styles.poseName}>{poseName}</Text>
          {pose?.sanskritName && (
            <Text style={styles.sanskritName}>{pose.sanskritName}</Text>
          )}
          <View style={styles.metaRow}>
            {pose?.difficulty && (
              <View style={[styles.badge, { backgroundColor: difficultyColors[pose.difficulty] + '20' }]}>
                <Text style={[styles.badgeText, { color: difficultyColors[pose.difficulty] }]}>
                  {pose.difficulty}
                </Text>
              </View>
            )}
            {pose?.targetDurationSeconds && (
              <View style={styles.durationBadge}>
                <Ionicons name="time-outline" size={16} color={Colors.textLight} />
                <Text style={styles.durationText}>{pose.targetDurationSeconds}s target</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        {pose?.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.description}>{pose.description}</Text>
          </View>
        )}

        {/* Step-by-Step Instructions */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('steps')}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons name="list-outline" size={22} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Step-by-Step Instructions</Text>
          </View>
          <Ionicons
            name={expandedSection === 'steps' ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={Colors.textMuted}
          />
        </TouchableOpacity>
        {expandedSection === 'steps' && (
          <View style={styles.sectionContent}>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Benefits */}
        {pose?.benefits && (
          <>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('benefits')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionTitleRow}>
                <Ionicons name="heart-outline" size={22} color={Colors.success} />
                <Text style={styles.sectionTitle}>Benefits</Text>
              </View>
              <Ionicons
                name={expandedSection === 'benefits' ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
            {expandedSection === 'benefits' && (
              <View style={styles.sectionContent}>
                <Text style={styles.sectionText}>{pose.benefits}</Text>
              </View>
            )}
          </>
        )}

        {/* Precautions */}
        {pose?.precautions && (
          <>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('precautions')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionTitleRow}>
                <Ionicons name="warning-outline" size={22} color={Colors.warning} />
                <Text style={styles.sectionTitle}>Precautions</Text>
              </View>
              <Ionicons
                name={expandedSection === 'precautions' ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
            {expandedSection === 'precautions' && (
              <View style={styles.sectionContent}>
                <View style={styles.warningBox}>
                  <Ionicons name="alert-circle" size={20} color={Colors.warning} />
                  <Text style={styles.warningText}>{pose.precautions}</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Quick Tips</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.tipText}>Breathe steadily throughout the pose</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.tipText}>Keep your movements slow and controlled</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.tipText}>Hold the pose for at least 5 breaths</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.tipText}>Listen to your body - don't push through pain</Text>
          </View>
        </View>

        {/* Spacer for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Start Practice Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.startButton} onPress={handleStartPractice}>
          <Ionicons name="play" size={24} color="#FFFFFF" />
          <Text style={styles.startButtonText}>Start Practice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  poseImageContainer: {
    width: width - 80,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: Colors.cardBackground,
  },
  poseImage: {
    width: '100%',
    height: '100%',
  },
  poseImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
  },
  poseName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  sanskritName: {
    fontSize: 16,
    color: Colors.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  descriptionSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  description: {
    fontSize: 15,
    color: Colors.textLight,
    lineHeight: 22,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -10,
  },
  sectionText: {
    fontSize: 15,
    color: Colors.textLight,
    lineHeight: 22,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warning + '15',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  tipsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textLight,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default PoseInstructionScreen;
