import { useOutlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import AIChatbot from '../chat/AIChatbot';
import useUIStore from '../../stores/uiStore';
import useAuthStore from '../../stores/authStore';
import useResponsive from '../../hooks/useResponsive';
import useWebSocket from '../../hooks/useWebSocket';

function LoadingScreen() {
    const [visibleLines, setVisibleLines] = useState(0);
    const [progress, setProgress] = useState(0);

    const bootLines = [
        '> Initializing FlowState core...',
        '> Loading user profile...',
        '> Syncing habit tracker...',
        '> Calibrating focus engine...',
        '> All systems operational ✓',
    ];

    useEffect(() => {
        const timers = bootLines.map((_, i) =>
            setTimeout(() => setVisibleLines(i + 1), i * 380 + 120)
        );
        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 12 + 5;
            if (p >= 95) { p = 95; clearInterval(interval); }
            setProgress(p);
        }, 140);
        return () => { timers.forEach(clearTimeout); clearInterval(interval); };
    }, []);

    return (
        <div style={{
            display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-primary)', flexDirection: 'column', gap: '28px',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Animated grid */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
                animation: 'fade-in 1.2s ease forwards',
            }} />

            {/* Central glow orb */}
            <div style={{
                position: 'absolute', width: '520px', height: '520px', pointerEvents: 'none',
                background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 68%)',
                borderRadius: '50%',
                animation: 'pulse 3s ease infinite',
            }} />

            {/* Logo */}
            <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
                <div style={{
                    fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em',
                    background: 'linear-gradient(135deg, #a5b4fc, #6366f1, #4f46e5)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 24px rgba(99,102,241,0.45))',
                }}>
                    FlowState
                </div>
                <div style={{
                    fontSize: '0.6875rem', color: 'var(--text-muted)',
                    letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '6px',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                }}>
                    productivity intelligence
                </div>
            </div>

            {/* Terminal panel */}
            <div style={{
                position: 'relative', zIndex: 1,
                width: '340px', background: 'var(--bg-card)',
                border: '1px solid var(--border-strong)',
                borderRadius: '12px', overflow: 'hidden',
                boxShadow: '0 0 40px rgba(99,102,241,0.12)',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '10px 14px', background: 'var(--bg-elevated)',
                    borderBottom: '1px solid var(--border)',
                }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{
                        marginLeft: '8px', fontSize: '0.6875rem', color: 'var(--text-muted)',
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    }}>flowstate ~ boot</span>
                </div>
                <div style={{
                    padding: '14px 16px', minHeight: '118px',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                    fontSize: '0.75rem',
                }}>
                    {bootLines.slice(0, visibleLines).map((line, i) => (
                        <div key={i} style={{
                            color: i === bootLines.length - 1 && visibleLines === bootLines.length
                                ? '#22c55e'
                                : i === visibleLines - 1 ? 'var(--accent-light)' : 'var(--text-muted)',
                            marginBottom: '5px',
                            animation: 'fade-in 0.15s ease forwards',
                        }}>
                            {line}
                            {i === visibleLines - 1 && visibleLines < bootLines.length && (
                                <span style={{ animation: 'pulse 0.75s infinite' }}>█</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Progress bar */}
            <div style={{ position: 'relative', zIndex: 1, width: '340px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{
                        fontSize: '0.625rem', color: 'var(--text-muted)',
                        letterSpacing: '0.15em', textTransform: 'uppercase',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}>Loading</span>
                    <span style={{
                        fontSize: '0.625rem', color: 'var(--accent-light)',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}>{Math.round(progress)}%</span>
                </div>
                <div style={{ height: '2px', background: 'var(--bg-hover)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', width: `${progress}%`,
                        background: 'linear-gradient(90deg, #4f46e5, #6366f1, #818cf8)',
                        borderRadius: '100px', transition: 'width 0.14s ease',
                        boxShadow: '0 0 8px rgba(99,102,241,0.6)',
                    }} />
                </div>
            </div>
        </div>
    );
}

export default function MainLayout() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const fetchUser = useAuthStore((s) => s.fetchUser);
    const isInitializing = useAuthStore((s) => s.isInitializing);
    const location = useLocation();
    const outlet = useOutlet();
    const { isMobile, isTablet } = useResponsive();

    useWebSocket();

    useEffect(() => { fetchUser(); }, [fetchUser]);

    // On mobile close the sidebar (it becomes a drawer, not a push layout)
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

    if (isInitializing) return <LoadingScreen />;

    const marginLeft = isMobile ? 0 : (sidebarOpen ? 260 : 68);

    // Padding on the scrolled content div (not on main) — browser-reliable scroll clearance.
    // On mobile: bottom = 60px (bottom nav) + 20px breathing room = 80px.
    const contentStyle = {
        paddingTop:    isMobile ? '20px' : isTablet ? '24px' : '32px',
        paddingLeft:   isMobile ? '16px' : isTablet ? '20px' : '32px',
        paddingRight:  isMobile ? '16px' : isTablet ? '20px' : '32px',
        // 96px = 60px nav height + 34px max safe-area inset (iPhone home indicator) + 2px spare
        paddingBottom: isMobile ? '96px' : isTablet ? '24px' : '32px',
        maxWidth: '1200px',
        margin: '0 auto',
    };

    return (
        // app-shell: height 100vh with 100dvh fallback for mobile browser chrome
        <div className="app-shell" style={{ display: 'flex', overflow: 'hidden', background: 'var(--bg-primary)' }}>
            {/* Sidebar always rendered — on mobile it's a slide-in drawer overlay */}
            <Sidebar />
            <div style={{
                flex: 1, minWidth: 0, position: 'relative',
                marginLeft: `${marginLeft}px`, transition: 'margin-left 0.3s',
            }}>
                <Header />
                <main style={{
                    position: 'absolute', top: '64px', left: 0, right: 0, bottom: 0,
                    overflowY: 'auto', WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                }}>
                    <div style={contentStyle}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {outlet}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
            {isMobile && <BottomNav />}
            <AIChatbot />
        </div>
    );
}
