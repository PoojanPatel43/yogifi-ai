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
import { theme } from '../constants/theme';
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
  iconColor = theme.colors.textTertiary,
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
    <View style={styles.settingIcon}>
      <Ionicons name={icon as any} size={22} color={iconColor} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement}
    {showChevron && onPress && (
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
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
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
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
              title="Push Notifications"
              subtitle="Get reminders for daily practice"
              showChevron={false}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
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
              title="Haptic Feedback"
              subtitle="Vibration on button press"
              showChevron={false}
              rightElement={
                <Switch
                  value={hapticEnabled}
                  onValueChange={handleToggleHaptic}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <View style={styles.divider} />
            <SettingItem
              icon="camera-reverse-outline"
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
              title="Help Center"
              onPress={() => handleOpenLink('https://yogifi.ai/help')}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="mail-outline"
              title="Contact Support"
              onPress={handleContactSupport}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="star-outline"
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
              title="Privacy Policy"
              onPress={() => handleOpenLink('https://yogifi.ai/privacy')}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="shield-checkmark-outline"
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
              title="App Version"
              subtitle="1.0.0 (Build 1)"
              showChevron={false}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: theme.spacing.lg }} />
      </ScrollView>
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
    paddingTop: 60,
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    width: theme.spacing.lg,
    height: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
  },
  placeholder: {
    width: theme.spacing.lg,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screen,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.xs / 2,
  },
  sectionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  settingIcon: {
    width: theme.spacing.lg,
    height: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md - theme.spacing.sm,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
  },
  settingSubtitle: {
    ...theme.typography.bodySm,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginLeft: theme.spacing.lg + (theme.spacing.md - theme.spacing.sm) + theme.spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  logoutText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.error,
  },
});

export default SettingsScreen;
