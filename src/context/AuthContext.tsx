import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import {
  loginApi,
  registerApi,
  logoutApi,
  getAuthToken,
  getStoredUser,
  addAuthListener,
} from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  // Load stored auth data on mount
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await getAuthToken();
        const storedUser = await getStoredUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (error) {
        console.log('Error loading stored auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  // Listen for auth changes (e.g., 401 responses)
  useEffect(() => {
    const unsubscribe = addAuthListener((authenticated) => {
      if (!authenticated) {
        setUser(null);
        setToken(null);
      }
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await loginApi(email, password);

      if (response.success && response.data) {
        setToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }

      return { success: false, error: response.error || 'Login failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      const response = await registerApi(email, password, name);

      if (response.success && response.data) {
        setToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }

      return { success: false, error: response.error || 'Registration failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
    setToken(null);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const storedToken = await getAuthToken();
      const storedUser = await getStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.log('Error refreshing auth:', error);
    }
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
