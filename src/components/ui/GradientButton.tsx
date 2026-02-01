import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Pressable,
  ColorValue,
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
  variant?: 'filled' | 'outline';
}

const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  gradient = theme.gradients.primary,
  style,
  textStyle,
  disabled = false,
  loading = false,
  icon,
  size = 'md',
  variant = 'filled',
}) => {
  const [pressed, setPressed] = useState(false);

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 20 },
    md: { paddingVertical: 14, paddingHorizontal: 24 },
    lg: { paddingVertical: 18, paddingHorizontal: 32 },
  };

  const textSizeStyles = {
    sm: { fontSize: 14 },
    md: { fontSize: 16 },
    lg: { fontSize: 18 },
  };

  const scaleStyle = {
    transform: [{ scale: pressed ? 0.96 : 1 }],
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
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Text style={[
            styles.outlineText,
            textSizeStyles[size],
            textStyle,
          ]}>
            {title}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      style={[
        scaleStyle,
        disabled && styles.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={disabled ? [theme.colors.textTertiary, theme.colors.textTertiary] as unknown as GradientColors : gradient as unknown as GradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          sizeStyles[size],
        ]}
      >
        {icon}
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.textInverse} />
        ) : (
          <Text style={[
            styles.text,
            textSizeStyles[size],
            textStyle,
          ]}>
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
    borderRadius: theme.radius.md,
    gap: 8,
  },
  text: {
    color: theme.colors.textInverse,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  outlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    gap: 8,
    backgroundColor: theme.colors.primaryMuted,
  },
  outlineText: {
    color: theme.colors.primary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default GradientButton;
