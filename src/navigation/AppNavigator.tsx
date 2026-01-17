import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import PoseSelectionScreen from '../screens/PoseSelectionScreen';
import CameraSetupScreen from '../screens/CameraSetupScreen';
import CameraScreen from '../screens/CameraScreen';
import SessionCompleteScreen from '../screens/SessionCompleteScreen';
import SessionDetailsScreen from '../screens/SessionDetailsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Auth Stack - for unauthenticated users
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{ animation: 'fade' }}
    />
    <Stack.Screen
      name="Register"
      component={RegisterScreen}
    />
  </Stack.Navigator>
);

// Main Stack - for authenticated users
const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
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
  </Stack.Navigator>
);

// Root Navigator with auth state handling
const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show splash/loading screen while checking auth state
  if (isLoading) {
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
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen
          name="Home"
          component={MainStack}
          options={{ animation: 'fade' }}
        />
      ) : (
        <Stack.Screen
          name="Login"
          component={AuthStack}
          options={{ animation: 'fade' }}
        />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
