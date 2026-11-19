import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const normalizedBase = API_BASE.endsWith('/api/v1')
    ? API_BASE
    : API_BASE.endsWith('/api')
        ? `${API_BASE}/v1`
        : `${API_BASE}/api/v1`;

const client = axios.create({
    baseURL: normalizedBase,
    headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
    if (config.url && config.url.length > 1 && config.url.endsWith('/')) {
        config.url = config.url.replace(/\/+$/, '');
    }
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});


client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refresh = localStorage.getItem('refresh_token');
                if (refresh) {
                    // Go backend: POST /api/v1/auth/refresh with { refresh_token } or { refresh }
                    const { data } = await axios.post(`${normalizedBase}/auth/refresh`, { refresh_token: refresh, refresh });
                    const goData = data?.data || data;
                    const tokens = goData?.tokens || goData;
                    const newAccess = tokens?.access_token || tokens?.access || '';
                    if (newAccess) {
                        localStorage.setItem('access_token', newAccess);
                        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                        return client(originalRequest);
                    }
                }
            } catch {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                const { default: useAuthStore } = await import('../stores/authStore');
                useAuthStore.setState({ user: null, isAuthenticated: false, isInitializing: false });
            }
        }

        if (error.code === 'ERR_NETWORK') {
            const networkError = new Error('Unable to connect to server. Check your network or if the server is running.');
            networkError.response = { data: { detail: networkError.message } };
            return Promise.reject(networkError);
        }

        return Promise.reject(error);
    }
);

export default client;
