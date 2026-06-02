import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://flow-state-api.onrender.com';

const client = axios.create({
    baseURL: `${API_BASE}/api`,
    headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
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
                    const { data } = await axios.post(`${API_BASE}/api/auth/refresh/`, { refresh });
                    localStorage.setItem('access_token', data.access);
                    originalRequest.headers.Authorization = `Bearer ${data.access}`;
                    return client(originalRequest);
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
