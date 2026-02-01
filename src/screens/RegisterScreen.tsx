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
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { theme } from '../constants/theme';
import { GradientButton, AnimatedInput, AnimatedCard } from '../components/ui';

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

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

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
      {/* Gradient Header Background */}
      <LinearGradient
        colors={theme.gradients.splash as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleLogin}>
          <View style={styles.backButtonCircle}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.textInverse} />
          </View>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <AnimatedCard index={0} enterFrom="scale">
            <View style={styles.logoGlow}>
              <Ionicons name="fitness" size={40} color={theme.colors.textInverse} />
            </View>
          </AnimatedCard>
          <AnimatedCard index={1}>
            <Text style={styles.headerTitle}>Create Account</Text>
          </AnimatedCard>
          <AnimatedCard index={2}>
            <Text style={styles.headerSubtitle}>
              Start your yoga journey today
            </Text>
          </AnimatedCard>
        </View>
      </LinearGradient>

      {/* Form Card */}
      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={-40}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animatable.View
            animation="fadeInUp"
            delay={200}
            duration={500}
            style={styles.formCard}
          >
            {/* Error Banner */}
            {error && (
              <Animatable.View
                animation="fadeIn"
                duration={300}
                style={styles.errorContainer}
              >
                <View style={styles.errorAccent} />
                <Ionicons name="alert-circle" size={18} color={theme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </Animatable.View>
            )}

            {/* Inputs */}
            <View style={styles.inputsContainer}>
              <AnimatedInput
                icon="person-outline"
                label="Full Name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError(null);
                }}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
              />

              <AnimatedInput
                icon="mail-outline"
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />

              <AnimatedInput
                icon="lock-closed-outline"
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                }}
                isPassword
                editable={!isLoading}
              />

              <AnimatedInput
                icon="lock-closed-outline"
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setError(null);
                }}
                isPassword
                editable={!isLoading}
              />

              <Text style={styles.passwordHint}>
                Password must be at least 6 characters
              </Text>
            </View>

            {/* Create Account Button */}
            <GradientButton
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              gradient={theme.gradients.primaryToSecondary}
              size="lg"
              style={styles.createButton}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </Animatable.View>
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
  gradientHeader: {
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: theme.spacing.screen,
  },
  backButton: {
    marginBottom: theme.spacing.lg,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  logoGlow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.glow('rgba(255, 255, 255, 0.3)'),
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formWrapper: {
    flex: 1,
    marginTop: -24,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius['3xl'],
    borderTopRightRadius: theme.radius['3xl'],
    paddingHorizontal: theme.spacing['2xl'],
    paddingTop: theme.spacing['3xl'],
    paddingBottom: theme.spacing['4xl'],
    ...theme.shadows.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
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
    marginLeft: theme.spacing.xs,
  },
  inputsContainer: {
    marginBottom: theme.spacing.sm,
  },
  passwordHint: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  createButton: {
    marginTop: theme.spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.borderLight,
  },
  dividerText: {
    marginHorizontal: theme.spacing.lg,
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  loginLink: {
    alignItems: 'center',
  },
  loginText: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
  },
  loginTextBold: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;
