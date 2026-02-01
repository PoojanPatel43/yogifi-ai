import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import Colors from '../constants/colors';
import { APP_CONFIG } from '../constants/config';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

interface SettingItemProps {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  iconColor = Colors.text,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = true,
}) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={[styles.settingIcon, { backgroundColor: iconColor + '15' }]}>
      <Ionicons name={icon as any} size={22} color={iconColor} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement}
    {showChevron && onPress && (
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    )}
  </TouchableOpacity>
);

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAuth();

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(APP_CONFIG.ENABLE_HAPTIC_FEEDBACK);
  const [defaultCamera, setDefaultCamera] = useState<'front' | 'back'>('front');

  const handleToggleNotifications = (value: boolean) => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setNotificationsEnabled(value);
  };

  const handleToggleHaptic = (value: boolean) => {
    if (value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setHapticEnabled(value);
  };

  const handleToggleCamera = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDefaultCamera(current => current === 'front' ? 'back' : 'front');
  };

  const handleClearCache = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      'Clear Cache',
      'This will clear locally cached data. Your account and session history will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // Clear cache logic here
            Alert.alert('Done', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleOpenLink = (url: string) => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(url);
  };

  const handleContactSupport = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL('mailto:support@yogifi.ai?subject=Yogifi AI Support');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="notifications-outline"
              iconColor={Colors.primary}
              title="Push Notifications"
              subtitle="Get reminders for daily practice"
              showChevron={false}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="hand-left-outline"
              iconColor={Colors.secondary}
              title="Haptic Feedback"
              subtitle="Vibration on button press"
              showChevron={false}
              rightElement={
                <Switch
                  value={hapticEnabled}
                  onValueChange={handleToggleHaptic}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <View style={styles.divider} />
            <SettingItem
              icon="camera-reverse-outline"
              iconColor={Colors.warning}
              title="Default Camera"
              subtitle={defaultCamera === 'front' ? 'Front camera' : 'Back camera'}
              onPress={handleToggleCamera}
            />
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="trash-outline"
              iconColor={Colors.error}
              title="Clear Cache"
              subtitle="Free up storage space"
              onPress={handleClearCache}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="help-circle-outline"
              iconColor={Colors.primary}
              title="Help Center"
              onPress={() => handleOpenLink('https://yogifi.ai/help')}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="mail-outline"
              iconColor={Colors.secondary}
              title="Contact Support"
              onPress={handleContactSupport}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="star-outline"
              iconColor={Colors.warning}
              title="Rate the App"
              onPress={() => handleOpenLink('https://apps.apple.com')}
            />
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="document-text-outline"
              iconColor={Colors.textLight}
              title="Privacy Policy"
              onPress={() => handleOpenLink('https://yogifi.ai/privacy')}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="shield-checkmark-outline"
              iconColor={Colors.textLight}
              title="Terms of Service"
              onPress={() => handleOpenLink('https://yogifi.ai/terms')}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="information-circle-outline"
              iconColor={Colors.textMuted}
              title="App Version"
              subtitle="1.0.0 (Build 1)"
              showChevron={false}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  settingSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 68,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '15',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
});

export default SettingsScreen;
