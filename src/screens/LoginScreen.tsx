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

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        navigation.replace('Home');
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
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
        <View style={styles.headerContent}>
          <AnimatedCard index={0} enterFrom="scale">
            <View style={styles.logoGlow}>
              <Ionicons name="fitness" size={44} color={theme.colors.textInverse} />
            </View>
          </AnimatedCard>
          <AnimatedCard index={1}>
            <Text style={styles.headerTitle}>Welcome Back</Text>
          </AnimatedCard>
          <AnimatedCard index={2}>
            <Text style={styles.headerSubtitle}>
              Sign in to continue your yoga journey
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
                error={!!error && !email.trim()}
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
                error={!!error && !password}
              />
            </View>

            {/* Sign In Button */}
            <GradientButton
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              gradient={theme.gradients.primaryToSecondary}
              size="lg"
              style={styles.signInButton}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register Link */}
            <TouchableOpacity
              style={styles.registerLink}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text style={styles.registerTextBold}>Sign Up</Text>
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
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: theme.spacing.screen,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
    ...theme.shadows.glow('rgba(255, 255, 255, 0.3)'),
  },
  headerTitle: {
    ...theme.typography.h1,
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
    marginTop: -30,
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
  signInButton: {
    marginTop: theme.spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing['2xl'],
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
  registerLink: {
    alignItems: 'center',
  },
  registerText: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
  },
  registerTextBold: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;
