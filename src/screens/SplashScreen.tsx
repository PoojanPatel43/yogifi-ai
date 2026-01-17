import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import Colors from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    // Auto-navigate to Login after 2 seconds
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>YOGIFI</Text>
      <Text style={styles.tagline}>AI-Powered Yoga Coach</Text>
      <Text style={styles.loading}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.background,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 16,
    color: Colors.background,
    marginTop: 10,
    opacity: 0.9,
  },
  loading: {
    fontSize: 14,
    color: Colors.background,
    position: 'absolute',
    bottom: 100,
    opacity: 0.7,
  },
});

export default SplashScreen;
