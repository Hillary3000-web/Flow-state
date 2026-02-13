import { create } from 'zustand';
import { authAPI } from '../api';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.login(credentials);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      set({ isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.response?.data };
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.register(userData);
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.response?.data };
    }
  },

  fetchUser: async () => {
    try {
      const { data } = await authAPI.getMe();
      set({ user: data });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  logout: () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) authAPI.logout({ refresh }).catch(() => {});
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
