import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';

const WS_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/^http/, 'ws')
  : 'ws://localhost:8000';

export default function useWebSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    const connect = () => {
      // Append token to query string for middleware auth
      const url = `${WS_URL}/ws/notifications/?token=${accessToken}`;
      
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('UseWebSocket: Connected');
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
        // Simple reconnect logic
        setTimeout(() => {
          if (isAuthenticated) connect();
        }, 5000);
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
