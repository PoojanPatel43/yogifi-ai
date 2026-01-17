import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
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
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8080/api';
    } else if (Platform.OS === 'ios') {
      return 'http://192.168.1.86:8080/api';  // ✅ Your Mac's IP
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
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
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
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

export const clearAuthData = async (): Promise<void> => {
  logDebug('Clearing auth data');
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
};

export const getAuthToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const getStoredUser = async (): Promise<any | null> => {
  try {
    const userData = await SecureStore.getItemAsync(USER_KEY);
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
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
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
