import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { theme } from '../constants/theme';
import { GradientButton, AnimatedInput } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleRegister = async () => {
    setError(null);

    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!validateEmail(email.trim())) { setError('Please enter a valid email address'); return; }
    if (!password) { setError('Please enter a password'); return; }
    if (!validatePassword(password)) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setIsLoading(true);

    try {
      const result = await register(email.trim(), password, name.trim());

      if (result.success) {
        navigation.replace('Home');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleLogin}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.formArea}>
            <Animatable.View animation="fadeIn" duration={400}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Start your wellness journey today</Text>
            </Animatable.View>

            {/* Error Banner */}
            {error && (
              <Animatable.View animation="fadeIn" duration={300} style={styles.errorContainer}>
                <View style={styles.errorAccent} />
                <Ionicons name="alert-circle" size={18} color={theme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </Animatable.View>
            )}

            {/* Inputs */}
            <Animatable.View animation="fadeIn" delay={100} duration={500} style={styles.inputsContainer}>
              <AnimatedInput
                icon="person-outline"
                label="Full Name"
                value={name}
                onChangeText={(text) => { setName(text); setError(null); }}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
              />

              <AnimatedInput
                icon="mail-outline"
                label="Email"
                value={email}
                onChangeText={(text) => { setEmail(text); setError(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />

              <AnimatedInput
                icon="lock-closed-outline"
                label="Password"
                value={password}
                onChangeText={(text) => { setPassword(text); setError(null); }}
                isPassword
                editable={!isLoading}
              />

              <AnimatedInput
                icon="lock-closed-outline"
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => { setConfirmPassword(text); setError(null); }}
                isPassword
                editable={!isLoading}
              />

              <Text style={styles.passwordHint}>
                Password must be at least 6 characters
              </Text>
            </Animatable.View>

            {/* Create Account Button */}
            <Animatable.View animation="fadeIn" delay={200} duration={500}>
              <GradientButton
                title="Create Account"
                onPress={handleRegister}
                loading={isLoading}
                disabled={isLoading}
                variant="dark"
                size="lg"
                style={styles.createButton}
              />
            </Animatable.View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Login Link */}
            <TouchableOpacity style={styles.loginLink} onPress={handleLogin} disabled={isLoading}>
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.screen,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'web' ? 24 : 60,
  },
  formArea: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 24,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.textSecondary,
    marginBottom: 40,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorMuted,
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    overflow: 'hidden',
  },
  errorAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: theme.colors.error,
    borderTopLeftRadius: theme.radius.md,
    borderBottomLeftRadius: theme.radius.md,
  },
  errorText: {
    flex: 1,
    color: theme.colors.error,
    ...theme.typography.bodySm,
    marginLeft: 4,
  },
  inputsContainer: {
    marginBottom: 16,
    gap: 8,
  },
  passwordHint: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: -8,
    marginBottom: 8,
  },
  createButton: {
    marginTop: 8,
    width: '100%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.borderLight,
  },
  dividerText: {
    marginHorizontal: 24,
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  loginLink: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loginText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  loginTextBold: {
    fontFamily: 'DMSans_700Bold',
    color: theme.colors.text,
  },
});

export default RegisterScreen;
