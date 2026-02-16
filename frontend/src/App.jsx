import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './stores/authStore';
import MainLayout from './components/layout/MainLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Goals from './pages/Goals';
import Schedule from './pages/Schedule';
import Focus from './pages/Focus';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import QuickCapture from './components/tasks/QuickCapture';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/welcome" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Root Path: Landing Page for public (redirects to dashboard if auth) */}
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />

            {/* Protected Dashboard Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="goals" element={<Goals />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="focus" element={<Focus />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <QuickCapture />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
              },
            }}
          />
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
}
