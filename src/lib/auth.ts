import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'KASIR' | 'BARISTA';
  isActive: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    const { token, refreshToken, user } = response.data;
    
    // Store tokens
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get<{ user: User }>('/auth/me');
      return response.data.user;
    } catch {
      return null;
    }
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  /**
   * Check if token is expired or will expire soon
   * Returns true if token is valid and not expiring soon
   */
  isTokenValid(): boolean {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[AUTH] No token found in localStorage');
      return false;
    }

    try {
      // Decode JWT token (without verification)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('[AUTH] Invalid token format');
        return false;
      }

      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) {
        console.warn('[AUTH] Token missing expiration claim');
        return false;
      }

      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = exp - now;
      
      // Log for debugging (development only)
      if (import.meta.env.DEV) {
        const minutesUntilExpiry = Math.floor(timeUntilExpiry / (60 * 1000));
        console.log(`[AUTH] Token validation - Expires in: ${minutesUntilExpiry} minutes`);
      }
      
      // Token is valid if it hasn't expired and has at least 1 minute left (reduced from 5 minutes)
      // This gives more flexibility while still preventing expired token usage
      return timeUntilExpiry > 60 * 1000; // 1 minute buffer
    } catch (error) {
      console.error('[AUTH] Error validating token:', error);
      return false;
    }
  },

  /**
   * Get time until token expires (in minutes)
   */
  getTokenExpiryTime(): number | null {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[AUTH] No token found for expiry check');
      return null;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('[AUTH] Invalid token format for expiry check');
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) {
        console.warn('[AUTH] Token missing expiration claim');
        return null;
      }

      const exp = payload.exp * 1000;
      const now = Date.now();
      const minutesUntilExpiry = Math.floor((exp - now) / (60 * 1000));
      
      // Log for debugging (development only)
      if (import.meta.env.DEV) {
        const expirationDate = new Date(exp);
        console.log(`[AUTH] Token expires at: ${expirationDate.toISOString()}`);
        console.log(`[AUTH] Current time: ${new Date(now).toISOString()}`);
        console.log(`[AUTH] Minutes until expiry: ${minutesUntilExpiry}`);
      }
      
      return minutesUntilExpiry;
    } catch (error) {
      console.error('[AUTH] Error getting token expiry time:', error);
      return null;
    }
  },
};

