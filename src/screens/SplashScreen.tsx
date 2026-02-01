import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { theme } from '../constants/theme';
import { GradientBackground } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <GradientBackground colors={theme.gradients.splash as any}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Animatable.Text
            animation="zoomIn"
            duration={600}
            style={styles.logo}
          >
            YOGIFI
          </Animatable.Text>
          <Animatable.Text
            animation="fadeInUp"
            delay={400}
            duration={500}
            style={styles.tagline}
          >
            AI-Powered Yoga Coach
          </Animatable.Text>
        </View>

        <View style={styles.dotsContainer}>
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            delay={600}
            duration={800}
            style={styles.dot}
          />
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            delay={800}
            duration={800}
            style={styles.dot}
          />
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            delay={1000}
            duration={800}
            style={styles.dot}
          />
        </View>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.textInverse,
    letterSpacing: 8,
  },
  tagline: {
    ...theme.typography.body,
    color: theme.colors.textInverse,
    marginTop: theme.spacing.md,
    opacity: 0.9,
  },
  dotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 100,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textInverse,
  },
});

export default SplashScreen;
