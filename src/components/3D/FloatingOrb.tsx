import React from 'react';
import { View, StyleSheet } from 'react-native';

interface FloatingOrbProps {
  color?: string;
  size?: number;
  style?: any;
}

const FloatingOrb: React.FC<FloatingOrbProps> = ({
  color = '#c9c1ea',
  size = 1,
  style,
}) => {
  // Render a simple gradient-like fallback orb
  // Three.js/R3F integration can be added later with proper lazy loading
  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.orb,
          {
            backgroundColor: color,
            width: size * 200,
            height: size * 200,
            borderRadius: size * 100,
          },
        ]}
      />
      <View
        style={[
          styles.orbGlow,
          {
            backgroundColor: color,
            width: size * 240,
            height: size * 240,
            borderRadius: size * 120,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orb: {
    opacity: 0.6,
    position: 'absolute',
  },
  orbGlow: {
    opacity: 0.15,
    position: 'absolute',
  },
});

export default FloatingOrb;
