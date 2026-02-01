import React from 'react';
import { StyleSheet, ViewStyle, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

interface GradientBackgroundProps {
  children: React.ReactNode;
  colors?: GradientColors;
  style?: ViewStyle;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  colors = theme.gradients.splash as unknown as GradientColors,
  style,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}) => {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GradientBackground;
