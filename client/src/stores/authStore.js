import { create } from 'zustand';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('appsc_user') || 'null'),
  accessToken: localStorage.getItem('appsc_access_token') || null,
  refreshToken: localStorage.getItem('appsc_refresh_token') || null,
  isAuthenticated: !!localStorage.getItem('appsc_access_token'),
  isLoading: false,
  isSessionRevoked: false,
  error: null,

  // Step 1: Send OTP to Email
  sendOtp: async (email, role = 'STUDENT') => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/send-otp', { email, role });
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to dispatch OTP. Please try again.';
      set({ isLoading: false, error: msg });
      return { success: false, message: msg };
    }
  },

  // Step 2: Verify 6-digit OTP
  verifyOtp: async (email, otp) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem('appsc_access_token', accessToken);
      localStorage.setItem('appsc_refresh_token', refreshToken);
      localStorage.setItem('appsc_user', JSON.stringify(user));

      set({
        accessToken,
        refreshToken,
        user,
        isAuthenticated: true,
        isLoading: false,
        isSessionRevoked: false,
      });

      // Connect user socket
      connectSocket();

      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP. Please try again.';
      set({ isLoading: false, error: msg });
      return { success: false, message: msg };
    }
  },

  // Fetch current authenticated user
  checkAuth: async () => {
    const token = localStorage.getItem('appsc_access_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        const user = response.data.user;
        localStorage.setItem('appsc_user', JSON.stringify(user));
        set({ user, isAuthenticated: true });
        connectSocket();
      }
    } catch (err) {
      // Handled by axios interceptor
    }
  },

  // Trigger single session eviction modal
  triggerSessionRevoked: () => {
    set({ isSessionRevoked: true });
  },

  // Clear auth and logout
  logout: () => {
    disconnectSocket();
    localStorage.removeItem('appsc_access_token');
    localStorage.removeItem('appsc_refresh_token');
    localStorage.removeItem('appsc_user');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isSessionRevoked: false,
      error: null,
    });
  },
}));
