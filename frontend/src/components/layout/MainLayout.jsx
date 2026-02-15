import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import AIChatbot from '../chat/AIChatbot';
import useUIStore from '../../stores/uiStore';
import useAuthStore from '../../stores/authStore';
import useResponsive from '../../hooks/useResponsive';

export default function MainLayout() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const fetchUser = useAuthStore((s) => s.fetchUser);
    const location = useLocation();
    const { isMobile } = useResponsive();

    useEffect(() => { fetchUser(); }, [fetchUser]);

    // Close sidebar on mobile by default
    useEffect(() => {
        if (isMobile) useUIStore.getState().closeSidebar();
    }, [isMobile]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                useUIStore.getState().toggleQuickCapture();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // On mobile, no margin — sidebar is an overlay
    const marginLeft = isMobile ? 0 : (sidebarOpen ? 260 : 68);

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
            <Sidebar />
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
                marginLeft: `${marginLeft}px`, transition: 'margin-left 0.3s',
            }}>
                <Header />
                <main style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ padding: isMobile ? '20px 16px' : '32px', maxWidth: '1200px', margin: '0 auto' }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
            <AIChatbot />
        </div>
    );
}

