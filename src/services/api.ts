import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { Platform } from 'react-native';
import { getItem, setItem, deleteItem } from '../utils/storage';
import {
  ApiResponse,
  AuthResponse,
  UserProfile,
  UserStats,
  Pose,
  Session,
  SessionEndRequest,
  ProfileUpdateRequest,
} from '../types';

// Platform-specific base URL
const getBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8080/api';
  }
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8080/api';
    } else if (Platform.OS === 'ios') {
      return 'http://192.168.1.86:8080/api';
    }
  }
  return 'http://localhost:8080/api';
};

const BASE_URL = getBaseUrl();
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

// Debug logging helper
const logDebug = (message: string, data?: any) => {
  if (__DEV__) {
    console.log(`[API] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// Event emitter for auth state changes
type AuthListener = (isAuthenticated: boolean) => void;
const authListeners: AuthListener[] = [];

export const addAuthListener = (listener: AuthListener): (() => void) => {
  authListeners.push(listener);
  return () => {
    const index = authListeners.indexOf(listener);
    if (index > -1) {
      authListeners.splice(index, 1);
    }
  };
};

const notifyAuthChange = (isAuthenticated: boolean) => {
  authListeners.forEach(listener => listener(isAuthenticated));
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getItem(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      logDebug(`Request: ${config.method?.toUpperCase()} ${config.url}`);
    } catch (error) {
      console.log('Error reading token from SecureStore:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    logDebug(`Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  async (error: AxiosError) => {
    logDebug(`Error Response: ${error.response?.status}`, error.response?.data);
    if (error.response?.status === 401) {
      // Token expired or invalid - clear stored data
      await clearAuthData();
      notifyAuthChange(false);
    }
    return Promise.reject(error);
  }
);

// Token and user data management
export const setAuthData = async (token: string, refreshToken: string, user: any): Promise<void> => {
  logDebug('Saving auth data', { token: token.substring(0, 20) + '...', user });
  await setItem(TOKEN_KEY, token);
  await setItem(REFRESH_TOKEN_KEY, refreshToken);
  await setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthData = async (): Promise<void> => {
  logDebug('Clearing auth data');
  await deleteItem(TOKEN_KEY);
  await deleteItem(REFRESH_TOKEN_KEY);
  await deleteItem(USER_KEY);
};

export const getAuthToken = async (): Promise<string | null> => {
  return await getItem(TOKEN_KEY);
};

export const getStoredUser = async (): Promise<any | null> => {
  try {
    const userData = await getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

// Helper to extract error message from backend response
const extractErrorMessage = (error: any, defaultMessage: string): string => {
  // Check for backend error response structure
  const responseData = error.response?.data;

  if (responseData) {
    // Backend returns: { success: false, message: "error message", error: "error type" }
    if (responseData.message) {
      return responseData.message;
    }
    if (responseData.error) {
      return responseData.error;
    }
  }

  // Network error
  if (error.message === 'Network Error') {
    return 'Unable to connect to server. Please check your internet connection.';
  }

  return defaultMessage;
};

// ============ Auth API ============

export const loginApi = async (
  email: string,
  password: string
): Promise<ApiResponse<AuthResponse>> => {
  try {
    logDebug('Login attempt', { email });

    const response = await api.post('/auth/login', {
      email: email.toLowerCase().trim(),
      password,
    });

    logDebug('Login response', response.data);

    // Backend returns: { success: true, data: { token, refreshToken, user }, message: "..." }
    const backendResponse = response.data;

    if (backendResponse.success && backendResponse.data) {
      const { token, refreshToken, user } = backendResponse.data;

      if (token && user) {
        await setAuthData(token, refreshToken || '', user);
        notifyAuthChange(true);

        return {
          success: true,
          data: backendResponse.data,
          message: backendResponse.message,
        };
      }
    }

    // If we get here, something went wrong with the response structure
    return {
      success: false,
      error: backendResponse.message || 'Login failed. Invalid response from server.',
    };
  } catch (error: any) {
    logDebug('Login error', error.response?.data || error.message);
    const errorMessage = extractErrorMessage(error, 'Login failed. Please check your credentials.');
    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const registerApi = async (
  email: string,
  password: string,
  name: string
): Promise<ApiResponse<AuthResponse>> => {
  try {
    logDebug('Register attempt', { email, name });

    const response = await api.post('/auth/register', {
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
    });

    logDebug('Register response', response.data);

    // Backend returns: { success: true, data: { token, refreshToken, user }, message: "..." }
    const backendResponse = response.data;

    if (backendResponse.success && backendResponse.data) {
      const { token, refreshToken, user } = backendResponse.data;

      if (token && user) {
        await setAuthData(token, refreshToken || '', user);
        notifyAuthChange(true);

        return {
          success: true,
          data: backendResponse.data,
          message: backendResponse.message,
        };
      }
    }

    // If we get here, something went wrong with the response structure
    return {
      success: false,
      error: backendResponse.message || 'Registration failed. Invalid response from server.',
    };
  } catch (error: any) {
    logDebug('Register error', error.response?.data || error.message);
    const errorMessage = extractErrorMessage(error, 'Registration failed. Please try again.');
    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const logoutApi = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    // Ignore logout errors
    logDebug('Logout error (ignored)', error);
  } finally {
    await clearAuthData();
    notifyAuthChange(false);
  }
};

export const refreshTokenApi = async (): Promise<ApiResponse<AuthResponse>> => {
  try {
    const refreshToken = await getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return { success: false, error: 'No refresh token' };
    }

    const response = await api.post('/auth/refresh', {
      refreshToken,
    });

    const backendResponse = response.data;

    if (backendResponse.success && backendResponse.data) {
      const { token, refreshToken: newRefreshToken, user } = backendResponse.data;
      await setAuthData(token, newRefreshToken || '', user);
      return {
        success: true,
        data: backendResponse.data,
      };
    }

    return {
      success: false,
      error: backendResponse.message || 'Token refresh failed',
    };
  } catch (error: any) {
    await clearAuthData();
    return {
      success: false,
      error: extractErrorMessage(error, 'Token refresh failed'),
    };
  }
};

// ============ User API ============

export const getProfileApi = async (): Promise<ApiResponse<UserProfile>> => {
  try {
    const response = await api.get('/user/profile');
    const backendResponse = response.data;

    if (backendResponse.success) {
      return {
        success: true,
        data: backendResponse.data,
      };
    }

    return {
      success: false,
      error: backendResponse.message || 'Failed to fetch profile',
    };
  } catch (error: any) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Failed to fetch profile'),
    };
  }
};

export const updateProfileApi = async (
  data: ProfileUpdateRequest
): Promise<ApiResponse<UserProfile>> => {
  try {
    const response = await api.put('/user/profile', data);
    const backendResponse = response.data;

    if (backendResponse.success) {
      return {
        success: true,
        data: backendResponse.data,
      };
    }

    return {
      success: false,
      error: backendResponse.message || 'Failed to update profile',
    };
  } catch (error: any) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Failed to update profile'),
    };
  }
};

export const getUserStatsApi = async (): Promise<ApiResponse<UserStats>> => {
  try {
    const response = await api.get('/user/stats');
    const backendResponse = response.data;

    if (backendResponse.success) {
      return {
        success: true,
        data: backendResponse.data,
      };
    }

    return {
      success: false,
      error: backendResponse.message || 'Failed to fetch stats',
    };
  } catch (error: any) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Failed to fetch stats'),
    };
  }
};

// ============ Poses API ============

export const getPosesApi = async (): Promise<ApiResponse<Pose[]>> => {
  try {
    const response = await api.get('/poses/list');
    const backendResponse = response.data;

    if (backendResponse.success) {
      return {
        success: true,
        data: backendResponse.data,
      };
    }

    return {
      success: false,
      error: backendResponse.message || 'Failed to fetch poses',
    };
  } catch (error: any) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Failed to fetch poses'),
    };
  }
};

export const getPoseByIdApi = async (poseId: string): Promise<ApiResponse<Pose>> => {
  try {
    const response = await api.get(`/poses/${poseId}`);
    const backendResponse = response.data;

    if (backendResponse.success) {
      return {
        success: true,
        data: backendResponse.data,
      };
    }

    return {
      success: false,
      error: backendResponse.message || 'Failed to fetch pose',
    };
  } catch (error: any) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Failed to fetch pose'),
    };
  }
};

// ============ Session API ============

export const startSessionApi = async (
  poseId: string
): Promise<ApiResponse<Session>> => {
  try {
    const response = await api.post('/session/start', {
      poseId,
    });
    const backendResponse = response.data;

    if (backendResponse.success) {
      return {
        success: true,
        data: backendResponse.data,
      };
    }

    return {
      success: false,
      error: backendResponse.message || 'Failed to start session',
    };
  } catch (error: any) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Failed to start session'),
    };
  }
};

export const endSessionApi = async (
  data: SessionEndRequest
): Promise<ApiResponse<Session>> => {
  try {
    const response = await api.post('/session/end', data);
    const backendResponse = response.data;

    if (backendResponse.success) {
      return {
        success: true,
        data: backendResponse.data,
      };
    }

    return {
      success: false,
      error: backendResponse.message || 'Failed to end session',
    };
  } catch (error: any) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Failed to end session'),
    };
  }
};

export const getSessionHistoryApi = async (
  limit: number = 20,
  offset: number = 0
): Promise<ApiResponse<Session[]>> => {
  try {
    const response = await api.get(
      `/session/history?limit=${limit}&offset=${offset}`
    );
    const backendResponse = response.data;

    if (backendResponse.success) {
      return {
        success: true,
        data: backendResponse.data,
      };
    }

    return {
      success: false,
      error: backendResponse.message || 'Failed to fetch session history',
    };
  } catch (error: any) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Failed to fetch session history'),
    };
  }
};

export const getSessionByIdApi = async (
  sessionId: string
): Promise<ApiResponse<Session>> => {
  try {
    const response = await api.get(`/session/${sessionId}`);
    const backendResponse = response.data;

    if (backendResponse.success) {
      return {
        success: true,
        data: backendResponse.data,
      };
    }

    return {
      success: false,
      error: backendResponse.message || 'Failed to fetch session',
    };
  } catch (error: any) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Failed to fetch session'),
    };
  }
};

export const cancelSessionApi = async (
  sessionId: string
): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post(`/session/${sessionId}/cancel`);
    const backendResponse = response.data;

    if (backendResponse.success) {
      return {
        success: true,
      };
    }

    return {
      success: false,
      error: backendResponse.message || 'Failed to cancel session',
    };
  } catch (error: any) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Failed to cancel session'),
    };
  }
};

// ============ AI Coach ============

export interface CoachInsight {
  sessionId: string;
  poseName: string;
  overallScore: number;
  durationSeconds: number;
  strengths: string[];
  improvements: string[];
  tips: string[];
  encouragement: string;
  comparison?: {
    vsAverage: number; // positive = better than average
    vsPrevious: number; // positive = improved
    trend: 'improving' | 'stable' | 'declining';
  };
}

export const getCoachInsightsApi = async (
  sessionId: string
): Promise<ApiResponse<CoachInsight>> => {
  try {
    const response = await api.post('/coach/summary', { sessionId });
    const backendResponse = response.data;

    if (backendResponse.success) {
      return {
        success: true,
        data: backendResponse.data,
      };
    }

    // If backend doesn't have AI coach, generate mock insights
    return generateMockInsights(sessionId);
  } catch (error: any) {
    // Fallback to mock insights if API fails
    console.log('Coach API failed, using mock insights:', error.message);
    return generateMockInsights(sessionId);
  }
};

// Generate mock AI coach insights based on session data
const generateMockInsights = async (sessionId: string): Promise<ApiResponse<CoachInsight>> => {
  // Get session details first
  const sessionResponse = await getSessionByIdApi(sessionId);

  if (!sessionResponse.success || !sessionResponse.data) {
    return {
      success: false,
      error: 'Could not load session data',
    };
  }

  const session = sessionResponse.data;
  const score = session.overallScore || 75;
  const duration = session.durationSeconds || 60;
  const poseName = session.poseName || 'Yoga Pose';

  // Generate contextual feedback based on score
  const strengths: string[] = [];
  const improvements: string[] = [];
  const tips: string[] = [];
  let encouragement = '';

  if (score >= 85) {
    strengths.push('Excellent form and body alignment');
    strengths.push('Great stability throughout the pose');
    strengths.push('Consistent breathing pattern');
    improvements.push('Try holding the pose a bit longer next time');
    tips.push('Challenge yourself with a more advanced variation');
    encouragement = `Outstanding work on ${poseName}! Your dedication is paying off. Keep pushing your limits!`;
  } else if (score >= 70) {
    strengths.push('Good overall posture');
    strengths.push('Steady improvement in form');
    improvements.push('Focus on keeping your core engaged');
    improvements.push('Work on holding the final position steadier');
    tips.push('Try practicing in front of a mirror to check alignment');
    tips.push('Remember to breathe deeply throughout');
    encouragement = `Great progress on ${poseName}! You're building a solid foundation. Keep practicing!`;
  } else {
    strengths.push('Good effort and commitment');
    strengths.push('Willingness to practice regularly');
    improvements.push('Focus on proper alignment before depth');
    improvements.push('Build up flexibility gradually');
    improvements.push('Consider using props for support');
    tips.push('Start with easier variations and progress slowly');
    tips.push('Warm up properly before attempting this pose');
    encouragement = `Every practice makes you stronger! ${poseName} takes time to master. Keep going!`;
  }

  // Add duration-based feedback
  if (duration >= 60) {
    strengths.push(`Great endurance - held for ${Math.floor(duration / 60)}+ minutes`);
  } else if (duration < 30) {
    tips.push('Try to gradually increase your hold time');
  }

  return {
    success: true,
    data: {
      sessionId,
      poseName,
      overallScore: score,
      durationSeconds: duration,
      strengths: strengths.slice(0, 3),
      improvements: improvements.slice(0, 3),
      tips: tips.slice(0, 2),
      encouragement,
      comparison: {
        vsAverage: Math.floor(Math.random() * 20) - 5, // -5 to +15
        vsPrevious: Math.floor(Math.random() * 15), // 0 to +15
        trend: score >= 80 ? 'improving' : score >= 65 ? 'stable' : 'improving',
      },
    },
  };
};

// ============ AI Chat API ============

export const sendChatMessageApi = async (
  message: string,
  conversationId?: string
): Promise<ApiResponse<{ conversationId: string; message: string; role: string }>> => {
  try {
    const response = await api.post('/chat/ask', { message, conversationId });
    const backendResponse = response.data;

    if (backendResponse.success) {
      return { success: true, data: backendResponse.data };
    }

    return { success: false, error: backendResponse.message || 'Failed to send message' };
  } catch (error: any) {
    return { success: false, error: extractErrorMessage(error, 'Failed to send message') };
  }
};

export const getChatHistoryApi = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response = await api.get('/chat/history');
    const backendResponse = response.data;

    if (backendResponse.success) {
      return { success: true, data: backendResponse.data };
    }

    return { success: false, error: backendResponse.message || 'Failed to fetch chat history' };
  } catch (error: any) {
    return { success: false, error: extractErrorMessage(error, 'Failed to fetch chat history') };
  }
};

// ============ Fitness Plan API ============

export const generateFitnessPlanApi = async (
  request: { fitnessLevel: string; goal: string; daysPerWeek: number; equipment: string }
): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post('/fitness/generate-plan', request);
    const backendResponse = response.data;

    if (backendResponse.success) {
      return { success: true, data: backendResponse.data };
    }

    return { success: false, error: backendResponse.message || 'Failed to generate fitness plan' };
  } catch (error: any) {
    return { success: false, error: extractErrorMessage(error, 'Failed to generate fitness plan') };
  }
};

export const getFitnessPlansApi = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response = await api.get('/fitness/plans');
    const backendResponse = response.data;

    if (backendResponse.success) {
      return { success: true, data: backendResponse.data };
    }

    return { success: false, error: backendResponse.message || 'Failed to fetch fitness plans' };
  } catch (error: any) {
    return { success: false, error: extractErrorMessage(error, 'Failed to fetch fitness plans') };
  }
};

// ============ Nutrition Plan API ============

export const generateNutritionPlanApi = async (
  request: { dietaryPreference: string; goal: string; calorieTarget: number; allergies: string }
): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post('/nutrition/generate-plan', request);
    const backendResponse = response.data;

    if (backendResponse.success) {
      return { success: true, data: backendResponse.data };
    }

    return { success: false, error: backendResponse.message || 'Failed to generate nutrition plan' };
  } catch (error: any) {
    return { success: false, error: extractErrorMessage(error, 'Failed to generate nutrition plan') };
  }
};

export const getNutritionPlansApi = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response = await api.get('/nutrition/plans');
    const backendResponse = response.data;

    if (backendResponse.success) {
      return { success: true, data: backendResponse.data };
    }

    return { success: false, error: backendResponse.message || 'Failed to fetch nutrition plans' };
  } catch (error: any) {
    return { success: false, error: extractErrorMessage(error, 'Failed to fetch nutrition plans') };
  }
};

// ============ Health Check ============

export const healthCheckApi = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.data?.success === true;
  } catch {
    return false;
  }
};

export default api;
