import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CameraView } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, SetupChecklistItem } from '../types';
import { setupStyles as styles } from '../styles/camera';
import Colors from '../constants/colors';
import {
  checkCameraPermission,
  requestCameraPermission,
  openAppSettings,
  checkLightingQuality,
  checkDeviceStability,
} from '../utils/camera';

type Props = NativeStackScreenProps<RootStackParamList, 'CameraSetup'>;

const CameraSetupScreen: React.FC<Props> = ({ navigation, route }) => {
  const { poseId, poseName } = route.params ?? {};

  // Permission state
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  // Checklist state
  const [checklist, setChecklist] = useState<SetupChecklistItem[]>([
    { id: 'permission', label: 'Camera permission granted', isComplete: false },
    { id: 'lighting', label: 'Good lighting detected', isComplete: false },
    { id: 'body', label: 'Full body visible in frame', isComplete: false },
    { id: 'stable', label: 'Device stable', isComplete: false },
  ]);

  // Camera ready state
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Check if all checks pass
  const allChecksPassed = checklist.every((item) => item.isComplete);

  // Update a checklist item
  const updateChecklistItem = useCallback((id: string, isComplete: boolean) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isComplete } : item
      )
    );
  }, []);

  // Check camera permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      setIsCheckingPermission(true);
      const status = await checkCameraPermission();
      setPermissionStatus(status);
      updateChecklistItem('permission', status === 'granted');
      setIsCheckingPermission(false);
    };

    checkPermission();
  }, [updateChecklistItem]);

  // Request permission handler
  const handleRequestPermission = async () => {
    const status = await requestCameraPermission();
    setPermissionStatus(status);
    updateChecklistItem('permission', status === 'granted');
  };

  // Simulate environment checks when camera is ready
  useEffect(() => {
    if (!isCameraReady || permissionStatus !== 'granted') return;

    // Simulate checking lighting (will be real in future)
    const lightingCheck = setTimeout(() => {
      const quality = checkLightingQuality({});
      updateChecklistItem('lighting', quality === 'good');
    }, 1000);

    // Simulate checking device stability
    const stabilityCheck = setTimeout(() => {
      const { isStable } = checkDeviceStability();
      updateChecklistItem('stable', isStable);
    }, 1500);

    // Simulate body detection (placeholder for pose detection)
    const bodyCheck = setTimeout(() => {
      // For now, auto-pass after camera is ready
      // In production, this will use actual pose detection
      updateChecklistItem('body', true);
    }, 2000);

    return () => {
      clearTimeout(lightingCheck);
      clearTimeout(stabilityCheck);
      clearTimeout(bodyCheck);
    };
  }, [isCameraReady, permissionStatus, updateChecklistItem]);

  // Handle camera ready
  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  // Handle continue to camera screen
  const handleContinue = () => {
    navigation.navigate('Camera', {
      poseId,
      poseName,
    });
  };

  // Render permission request view
  if (isCheckingPermission) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 16, color: Colors.textLight }}>
          Checking camera permission...
        </Text>
      </View>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Camera Setup</Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Text style={{ fontSize: 64, marginBottom: 24 }}>📷</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.text, textAlign: 'center', marginBottom: 12 }}>
            Camera Access Required
          </Text>
          <Text style={{ fontSize: 16, color: Colors.textLight, textAlign: 'center', marginBottom: 32, lineHeight: 24 }}>
            Yogifi AI needs camera access to detect and analyze your yoga poses. Please enable camera access in your device settings.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32 }}
            onPress={openAppSettings}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
              Open Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (permissionStatus === 'undetermined') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Camera Setup</Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Text style={{ fontSize: 64, marginBottom: 24 }}>🎥</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.text, textAlign: 'center', marginBottom: 12 }}>
            Enable Camera Access
          </Text>
          <Text style={{ fontSize: 16, color: Colors.textLight, textAlign: 'center', marginBottom: 32, lineHeight: 24 }}>
            To analyze your yoga poses in real-time, we need access to your camera. Your privacy is important to us - video is processed on-device only.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32 }}
            onPress={handleRequestPermission}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
              Allow Camera Access
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main setup view with camera preview
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Camera Setup</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Camera Preview */}
        <View style={styles.previewSection}>
          <View style={styles.previewContainer}>
            <CameraView
              style={styles.previewCamera}
              facing="front"
              onCameraReady={handleCameraReady}
            />
            {/* Body outline overlay */}
            <View style={styles.bodyOutline}>
              <View style={[styles.bodyOutlineSvg, { borderWidth: 2, borderColor: 'rgba(108, 99, 255, 0.5)', borderStyle: 'dashed', borderRadius: 20 }]}>
                {/* Simple body outline placeholder */}
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 80, opacity: 0.3 }}>🧍</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Checklist */}
        <View style={styles.checklistSection}>
          <Text style={styles.checklistTitle}>Setup Checklist</Text>
          {checklist.map((item) => (
            <View
              key={item.id}
              style={[
                styles.checklistItem,
                item.isComplete && styles.checklistItemActive,
              ]}
            >
              <View
                style={[
                  styles.checklistIcon,
                  item.isComplete
                    ? styles.checklistIconSuccess
                    : styles.checklistIconPending,
                ]}
              >
                <Text style={styles.checklistIconText}>
                  {item.isComplete ? '✓' : '○'}
                </Text>
              </View>
              <Text
                style={[
                  styles.checklistText,
                  !item.isComplete && styles.checklistTextPending,
                ]}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Tips for best results</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>📏</Text>
            <Text style={styles.tipText}>
              Stand 6-8 feet away from the camera
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              Ensure good lighting in the room
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>👕</Text>
            <Text style={styles.tipText}>
              Wear fitted clothing for better detection
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>📱</Text>
            <Text style={styles.tipText}>
              Place your device on a stable surface
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          !allChecksPassed && styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!allChecksPassed}
      >
        <Text style={styles.continueButtonText}>
          {allChecksPassed ? 'Continue' : 'Checking...'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default CameraSetupScreen;
