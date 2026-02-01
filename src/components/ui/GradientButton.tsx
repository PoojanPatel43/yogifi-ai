import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Pressable,
  ColorValue,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  gradient?: readonly string[];
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'accent' | 'dark' | 'outline' | 'filled';
}

const VARIANT_GRADIENTS: Record<string, readonly string[]> = {
  primary: theme.gradients.primary,
  accent: theme.gradients.sunset,
  dark: theme.gradients.dark,
  filled: theme.gradients.primary,
};

const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  gradient,
  style,
  textStyle,
  disabled = false,
  loading = false,
  icon,
  size = 'md',
  variant = 'primary',
}) => {
  const [pressed, setPressed] = useState(false);

  const resolvedGradient = gradient || VARIANT_GRADIENTS[variant] || theme.gradients.primary;

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 24 },
    md: { paddingVertical: 16, paddingHorizontal: 32 },
    lg: { paddingVertical: 20, paddingHorizontal: 40 },
  };

  const textSizeStyles = {
    sm: theme.typography.bodySm,
    md: theme.typography.button,
    lg: theme.typography.buttonLg,
  };

  const scaleStyle = {
    transform: [{ scale: pressed ? 0.97 : 1 }],
  };

  if (variant === 'outline') {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        disabled={disabled || loading}
        style={[
          scaleStyle,
          styles.outlineContainer,
          sizeStyles[size],
          disabled && styles.disabled,
          style,
        ]}
      >
        {icon}
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.text} />
        ) : (
          <Text style={[styles.outlineText, textSizeStyles[size], textStyle]}>
            {title}
          </Text>
        )}
      </Pressable>
    );
  }

  const isDark = variant === 'dark';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      style={[scaleStyle, disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={
          disabled
            ? ([theme.colors.borderLight, theme.colors.borderLight] as unknown as GradientColors)
            : (resolvedGradient as unknown as GradientColors)
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, sizeStyles[size]]}
      >
        {icon}
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isDark ? theme.colors.textInverse : theme.colors.text}
          />
        ) : (
          <Text
            style={[
              styles.text,
              textSizeStyles[size],
              isDark && styles.textDark,
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    gap: 8,
  },
  text: {
    ...theme.typography.button,
    color: theme.colors.text,
  },
  textDark: {
    color: theme.colors.textInverse,
  },
  outlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: theme.colors.text,
    gap: 8,
    backgroundColor: 'transparent',
  },
  outlineText: {
    ...theme.typography.button,
    color: theme.colors.text,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default GradientButton;
