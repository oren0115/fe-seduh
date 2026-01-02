import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, LoginCredentials } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const storedUser = authService.getStoredUser();
      const token = localStorage.getItem('token');
      
      if (storedUser && token) {
        // Set user from localStorage immediately to prevent logout on reload
        setUser(storedUser);
        setLoading(false);
        
        // Verify token in background (non-blocking)
        try {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            // Update user if verification succeeds
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
          }
          // If getCurrentUser returns null but no error, token might be invalid
          // But we don't logout here to prevent issues with network errors
        } catch (error: any) {
          // Only logout if it's a 401 Unauthorized error (token is actually invalid)
          // For other errors (network, server down, etc), keep user logged in
          if (error?.response?.status === 401) {
            authService.logout();
            setUser(null);
          }
          // For other errors, keep the user logged in with stored data
        }
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

