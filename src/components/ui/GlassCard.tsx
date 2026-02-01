import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark';
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  borderRadius?: number;
  noPadding?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  contentStyle,
  borderRadius = theme.radius.xl,
  noPadding = false,
}) => {
  return (
    <View
      style={[
        styles.container,
        { borderRadius },
        style,
      ]}
    >
      <View style={[
        styles.content,
        { borderRadius },
        !noPadding && styles.padding,
        contentStyle,
      ]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  content: {
    backgroundColor: 'transparent',
  },
  padding: {
    padding: theme.spacing.lg,
  },
});

export default GlassCard;
