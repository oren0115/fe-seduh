import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include credentials (cookies, auth headers) in CORS requests
});

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token format before using
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('[API] Invalid token format - expected 3 parts, got:', tokenParts.length);
        if (config.url?.includes('/payments') || config.url?.includes('/transactions')) {
          return Promise.reject(new Error('Invalid token format. Please login again.'));
        }
      }
      
      // Ensure Authorization header is set correctly
      config.headers.Authorization = `Bearer ${token}`;
      
      // Debug logging for payment requests (development only)
      if (import.meta.env.DEV && config.url?.includes('/payments')) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const exp = payload.exp * 1000;
          const now = Date.now();
          const timeUntilExpiry = Math.floor((exp - now) / 1000 / 60);
          const isExpired = exp < now;
          console.log(`[API] Payment request to: ${config.url}`);
          console.log(`[API] Token expires in: ${timeUntilExpiry} minutes`);
          console.log(`[API] Token expired: ${isExpired}`);
          console.log(`[API] Authorization header set: ${!!config.headers.Authorization}`);
          console.log(`[API] Authorization header value: ${config.headers.Authorization?.substring(0, 30)}...`);
          console.log(`[API] Token length: ${token.length} characters`);
          console.log(`[API] Token preview: ${token.substring(0, 20)}...`);
          console.log(`[API] Request headers:`, Object.keys(config.headers));
          
          if (isExpired) {
            console.error('[API] WARNING: Token is expired but still being sent!');
          }
        } catch (e) {
          console.error('[API] Could not decode token for debugging:', e);
        }
      }
    } else {
      console.error('[API] No token found in localStorage for request:', config.url);
      // Don't proceed with request if no token for authenticated endpoints
      if (config.url?.includes('/payments') || config.url?.includes('/transactions')) {
        return Promise.reject(new Error('No authentication token found. Please login again.'));
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isPaymentEndpoint = requestUrl.includes('/payments/');
      
      // CRITICAL: Don't auto-logout for payment endpoints
      // 401 from payment endpoint might be:
      // - JWT auth issue (but token is valid, so likely not)
      // - Midtrans API error (should not logout user)
      // - Backend auth middleware issue
      if (isPaymentEndpoint) {
        console.error('[API] 401 error on payment endpoint:', requestUrl);
        console.error('[API] Error response:', error.response?.data);
        // Don't logout - let payment dialog handle the error
        // This prevents false "token expired" logout
      } else {
        // Only logout for non-payment endpoints
        if (!window.location.pathname.includes('/login')) {
          console.warn('[API] 401 error on non-payment endpoint, logging out');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

