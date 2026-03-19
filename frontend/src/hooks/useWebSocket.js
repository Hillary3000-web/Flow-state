import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';

const WS_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/^http/, 'ws')
  : 'ws://localhost:8000';

export default function useWebSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = localStorage.getItem('access_token');
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      reconnectAttempts.current = 0;
      return;
    }

    const connect = () => {
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        console.log('UseWebSocket: Max reconnect attempts reached, stopping');
        return;
      }

      // Append token to query string for middleware auth
      const url = `${WS_URL}/ws/notifications/?token=${accessToken}`;
      
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('UseWebSocket: Connected');
        reconnectAttempts.current = 0; // Reset on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Show toast for new notifications
          if (data.message) {
             toast(data.message, {
               icon: '🔔',
               style: {
                 background: '#18181b',
                 color: '#fff',
                 border: '1px solid #27272a',
               },
             });
          }
        } catch (err) {
          console.error('UseWebSocket: Error parsing message', err);
        }
      };

      ws.onclose = () => {
        console.log('UseWebSocket: Disconnected');
        reconnectAttempts.current += 1;
        // Exponential backoff: 2s, 4s, 8s, 16s, 32s
        const delay = Math.min(2000 * Math.pow(2, reconnectAttempts.current - 1), 32000);
        setTimeout(() => {
          if (isAuthenticated && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) connect();
        }, delay);
      };

      ws.onerror = (error) => {
        console.error('UseWebSocket: Error', error);
        ws.close();
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [isAuthenticated, accessToken]);

  return socketRef.current;
}
