'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from './api';

// Types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  lastLogin: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  checkAdminRole: () => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token storage utilities
class TokenStorage {
  private static readonly AUTH_TOKEN_KEY = 'vervix_auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'vervix_refresh_token';
  private static readonly USER_KEY = 'vervix_user';

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.AUTH_TOKEN_KEY) || sessionStorage.getItem(this.AUTH_TOKEN_KEY);
  }

  static setToken(token: string, remember: boolean = false): void {
    if (typeof window === 'undefined') return;
    
    if (remember) {
      localStorage.setItem(this.AUTH_TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(this.AUTH_TOKEN_KEY, token);
    }
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static setUser(user: User, remember: boolean = false): void {
    if (typeof window === 'undefined') return;
    
    const userStr = JSON.stringify(user);
    if (remember) {
      localStorage.setItem(this.USER_KEY, userStr);
    } else {
      sessionStorage.setItem(this.USER_KEY, userStr);
    }
  }

  static clearAll(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.AUTH_TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }
}

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = TokenStorage.getToken();
        const user = TokenStorage.getUser();

        if (token && user) {
          // Verify token is still valid
          try {
            const response = await authApi.getProfile();
            if (response.success && response.data) {
              setState({
                user: response.data,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              return;
            }
          } catch (error) {
            // Token is invalid, try to refresh
            const refreshToken = TokenStorage.getRefreshToken();
            if (refreshToken) {
              try {
                const refreshResponse = await authApi.refreshToken(refreshToken);
                if (refreshResponse.success && refreshResponse.data?.token) {
                  TokenStorage.setToken(refreshResponse.data.token, true);
                  setState({
                    user,
                    token: refreshResponse.data.token,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                  });
                  return;
                }
              } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
              }
            }
          }
        }

        // Clear invalid tokens and set unauthenticated state
        TokenStorage.clearAll();
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authApi.login({
        email: credentials.email,
        password: credentials.password,
      });

      if (response.success && response.data?.token && response.data?.user) {
        const { token, user } = response.data;
        const remember = credentials.rememberMe || false;

        // Store tokens and user data
        TokenStorage.setToken(token, remember);
        TokenStorage.setUser(user, remember);

        // If refresh token is provided, store it
        if (response.data.refreshToken) {
          TokenStorage.setRefreshToken(response.data.refreshToken);
        }

        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = (): void => {
    // Call logout API (don't wait for response)
    authApi.logout().catch(error => {
      console.error('Logout API error:', error);
    });

    // Clear local storage and state
    TokenStorage.clearAll();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Redirect to login page if in browser
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
  };

  // Refresh authentication
  const refreshAuth = async (): Promise<void> => {
    try {
      const response = await authApi.getProfile();
      if (response.success && response.data) {
        const user = response.data;
        const remember = TokenStorage.getUser() !== null;
        
        TokenStorage.setUser(user, remember);
        setState(prev => ({
          ...prev,
          user,
          error: null,
        }));
      }
    } catch (error: any) {
      console.error('Refresh auth error:', error);
      // If refresh fails, logout user
      logout();
    }
  };

  // Clear error
  const clearError = (): void => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Check if user has admin role
  const checkAdminRole = (): boolean => {
    return state.user?.role === 'admin' || state.user?.role === 'superadmin';
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshAuth,
    clearError,
    checkAdminRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected Route Component
interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = true,
  fallback = null,
}) => {
  const { isAuthenticated, isLoading, user, checkAdminRole } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated || !user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
    return fallback;
  }

  // Check admin role if required
  if (requireAdmin && !checkAdminRole()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Higher-order component for protecting pages
interface WithAuthOptions {
  requireAdmin?: boolean;
  redirectTo?: string;
}

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) => {
  const { requireAdmin = true, redirectTo = '/admin/login' } = options;

  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, checkAdminRole } = useAuth();

    useEffect(() => {
      if (!isLoading && (!isAuthenticated || (requireAdmin && !checkAdminRole()))) {
        if (typeof window !== 'undefined') {
          window.location.href = redirectTo;
        }
      }
    }, [isAuthenticated, isLoading, checkAdminRole]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated || (requireAdmin && !checkAdminRole())) {
      return null;
    }

    return <Component {...props} />;
  };
};

// Utility functions
export const isTokenValid = (): boolean => {
  const token = TokenStorage.getToken();
  if (!token) return false;

  try {
    // Basic JWT structure check
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Date.now() / 1000;
    
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const getTokenExpiration = (): Date | null => {
  const token = TokenStorage.getToken();
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return new Date(payload.exp * 1000);
  } catch (error) {
    return null;
  }
};

export const isAuthInitialized = (): boolean => {
  return TokenStorage.getToken() !== null;
};

// Export token storage for direct access if needed
export { TokenStorage };
