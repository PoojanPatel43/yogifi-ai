import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { theme } from '../constants/theme';

// Import screens
import LandingScreen from '../screens/LandingScreen';
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
import AIChatScreen from '../screens/AIChatScreen';
import FitnessPlannerScreen from '../screens/FitnessPlannerScreen';
import DietPlannerScreen from '../screens/DietPlannerScreen';
import ProgressScreen from '../screens/ProgressScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
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
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen name="PoseSelection" component={PoseSelectionScreen} />
          <Stack.Screen name="PoseInstruction" component={PoseInstructionScreen} />
          <Stack.Screen name="CameraSetup" component={CameraSetupScreen} />
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
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="SessionDetails" component={SessionDetailsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="AIChat" component={AIChatScreen} />
          <Stack.Screen name="FitnessPlanner" component={FitnessPlannerScreen} />
          <Stack.Screen name="DietPlanner" component={DietPlannerScreen} />
          <Stack.Screen name="Progress" component={ProgressScreen} />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Landing"
            component={LandingScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
