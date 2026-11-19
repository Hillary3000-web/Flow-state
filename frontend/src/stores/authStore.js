import { create } from 'zustand';
import { authAPI } from '../api';

// Helper to extract token pair from Go backend response envelope.
// Go: { success: true, data: { user, tokens: { access_token, access, refresh_token, refresh } } }
function extractTokens(data) {
    const tokens = data?.tokens || data?.data?.tokens || {};
    return {
        access: tokens.access_token || tokens.access || '',
        refresh: tokens.refresh_token || tokens.refresh || '',
    };
}

function extractUser(data) {
    // The axios response data is the full Go envelope: { success, data: {...} }
    // authAPI methods return the axios response so data.data is the Go data field
    return data?.data?.user || data?.user || data?.data || data || null;
}

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: !!localStorage.getItem('access_token'),
    isLoading: false,
    // True while verifying a stored token on first load — prevents flash of protected content
    isInitializing: !!localStorage.getItem('access_token'),

    login: async (credentials) => {
        set({ isLoading: true });
        try {
            const { data } = await authAPI.login(credentials);
            // Go envelope: { success: true, data: { user, tokens: { access_token, refresh_token, access, refresh } } }
            const goData = data?.data || data;
            const tokens = extractTokens(goData);
            const user = goData?.user || null;

            if (tokens.access) {
                localStorage.setItem('access_token', tokens.access);
            }
            if (tokens.refresh) {
                localStorage.setItem('refresh_token', tokens.refresh);
            }

            set({ user, isAuthenticated: true, isLoading: false });
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
            // Go envelope: { success: true, data: { user, tokens: { access_token, refresh_token, access, refresh } } }
            const goData = data?.data || data;
            const tokens = extractTokens(goData);
            const user = goData?.user || null;

            if (tokens.access) {
                localStorage.setItem('access_token', tokens.access);
            }
            if (tokens.refresh) {
                localStorage.setItem('refresh_token', tokens.refresh);
            }

            set({ user, isAuthenticated: true, isLoading: false });
            return { success: true };
        } catch (error) {
            set({ isLoading: false });
            return { success: false, error: error.response?.data };
        }
    },

    fetchUser: async () => {
        try {
            const { data } = await authAPI.getMe();
            // Go envelope: { success: true, data: { ...user } }
            const user = data?.data || data;
            set({ user, isInitializing: false });
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                set({ user: null, isAuthenticated: false, isInitializing: false });
            } else {
                // Network error during cold start — keep auth state, stop initializing
                set({ isInitializing: false });
            }
        }
    },

    logout: () => {
        const refresh = localStorage.getItem('refresh_token');
        if (refresh) authAPI.logout({ refresh }).catch(() => { });
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false, isInitializing: false });
    },
}));

export default useAuthStore;
