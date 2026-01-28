import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import PoseSelectionScreen from '../screens/PoseSelectionScreen';
import PoseInstructionScreen from '../screens/PoseInstructionScreen';
import CameraSetupScreen from '../screens/CameraSetupScreen';
import CameraScreen from '../screens/CameraScreen';
import SessionCompleteScreen from '../screens/SessionCompleteScreen';
import AICoachScreen from '../screens/AICoachScreen';
import SessionDetailsScreen from '../screens/SessionDetailsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

// Main App Navigator - handles all screens
const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await SecureStore.getItemAsync(ONBOARDING_COMPLETE_KEY);
        setHasSeenOnboarding(completed === 'true');
      } catch (error) {
        console.log('Error checking onboarding status:', error);
        setHasSeenOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

  // Show splash/loading screen while checking auth state or onboarding status
  if (isLoading || hasSeenOnboarding === null) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {isAuthenticated ? (
        // Authenticated screens
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="PoseSelection"
            component={PoseSelectionScreen}
          />
          <Stack.Screen
            name="PoseInstruction"
            component={PoseInstructionScreen}
          />
          <Stack.Screen
            name="CameraSetup"
            component={CameraSetupScreen}
          />
          <Stack.Screen
            name="Camera"
            component={CameraScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="SessionComplete"
            component={SessionCompleteScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="AICoach"
            component={AICoachScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="History"
            component={HistoryScreen}
          />
          <Stack.Screen
            name="SessionDetails"
            component={SessionDetailsScreen}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
          />
        </>
      ) : !hasSeenOnboarding ? (
        // Onboarding for first-time users
        <>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
          />
        </>
      ) : (
        // Auth screens for returning users
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
