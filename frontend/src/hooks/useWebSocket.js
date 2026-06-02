import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';

const WS_BASE = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/^http/, 'ws')
    : 'ws://localhost:8000';

const MAX_RECONNECT = 5;

export default function useWebSocket() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const socketRef = useRef(null);
    const reconnectCount = useRef(0);
    const reconnectTimer = useRef(null);
    // Keep a ref in sync so the onclose callback always reads the latest auth state,
    // avoiding stale closures when the user logs out during a reconnect delay.
    const isAuthRef = useRef(isAuthenticated);

    useEffect(() => {
        isAuthRef.current = isAuthenticated;
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) {
            socketRef.current?.close();
            socketRef.current = null;
            clearTimeout(reconnectTimer.current);
            reconnectCount.current = 0;
            return;
        }

        const connect = () => {
            if (reconnectCount.current >= MAX_RECONNECT) return;

            // Token is read fresh inside the effect so it picks up refreshed tokens
            const token = localStorage.getItem('access_token');
            if (!token || !isAuthRef.current) return;

            const ws = new WebSocket(`${WS_BASE}/ws/notifications/?token=${token}`);
            socketRef.current = ws;

            ws.onopen = () => {
                reconnectCount.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.message) {
                        toast(data.message, {
                            icon: '🔔',
                            style: {
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-strong)',
                            },
                        });
                    }
                } catch (err) {
                    console.error('WebSocket: failed to parse message', err);
                }
            };

            ws.onclose = () => {
                if (!isAuthRef.current) return; // Logged out — do not reconnect
                reconnectCount.current += 1;
                if (reconnectCount.current >= MAX_RECONNECT) return;
                const delay = Math.min(2000 * Math.pow(2, reconnectCount.current - 1), 32000);
                reconnectTimer.current = setTimeout(connect, delay);
            };

            ws.onerror = () => ws.close();
        };

        connect();

        return () => {
            clearTimeout(reconnectTimer.current);
            socketRef.current?.close();
            socketRef.current = null;
        };
    }, [isAuthenticated]);
}
