import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

interface GradientBlobProps {
  colors: readonly [string, string];
  size?: number;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  opacity?: number;
  duration?: number;
}

export const GradientBlob: React.FC<GradientBlobProps> = ({
  colors,
  size = 300,
  top,
  left,
  right,
  bottom,
  opacity = 0.15,
  duration = 5000,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(opacity)).current;

  useEffect(() => {
    // Create a slow, gentle pulsing animation
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: duration,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacityAnim, {
            toValue: opacity * 0.7,
            duration: duration,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacityAnim, {
            toValue: opacity,
            duration: duration,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [duration, opacity]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          top,
          left,
          right,
          bottom,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[...colors] as string[]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default GradientBlob;
