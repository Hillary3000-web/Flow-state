import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineViewGrid, HiOutlineClipboardList, HiOutlineFlag, HiOutlineCalendar, HiOutlineLightningBolt, HiOutlineChartBar, HiOutlineCog, HiOutlineX } from 'react-icons/hi';
import useUIStore from '../../stores/uiStore';
import useResponsive from '../../hooks/useResponsive';

const navItems = [
    { to: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/tasks', icon: HiOutlineClipboardList, label: 'Tasks' },
    { to: '/goals', icon: HiOutlineFlag, label: 'Goals' },
    { to: '/schedule', icon: HiOutlineCalendar, label: 'Schedule' },
    { to: '/focus', icon: HiOutlineLightningBolt, label: 'Focus' },
    { to: '/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
    { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

export default function Sidebar() {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const closeSidebar = useUIStore((s) => s.closeSidebar);
    const { isMobile } = useResponsive();

    // On mobile, sidebar is an overlay that can be toggled
    // On desktop, sidebar is fixed and can be collapsed
    const isOpen = sidebarOpen;
    const showLabels = isMobile ? true : sidebarOpen; // Always show labels on mobile overlay
    const sidebarWidth = isMobile ? 280 : (sidebarOpen ? 260 : 68);

    const handleNavClick = () => {
        if (isMobile) closeSidebar();
    };

    return (
        <>
            {/* Mobile backdrop */}
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeSidebar}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 29,
                            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                        }}
                    />
                )}
            </AnimatePresence>

            <motion.aside
                animate={{
                    width: sidebarWidth,
                    x: isMobile ? (isOpen ? 0 : -280) : 0,
                }}
                transition={{ duration: 0.25 }}
                style={{
                    position: 'fixed', left: 0, top: 0, height: '100%',
                    zIndex: 30, display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
                }}
            >
                {/* Logo */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    height: '64px', flexShrink: 0,
                    padding: '0 20px', borderBottom: '1px solid var(--border)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, color: 'white', fontSize: '0.875rem', flexShrink: 0,
                            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        }}>F</div>
                        {showLabels && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="gradient-text"
                                style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}
                            >FlowState</motion.span>
                        )}
                    </div>
                    {isMobile && (
                        <button onClick={closeSidebar} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '32px', height: '32px', background: 'transparent',
                            border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)',
                        }}>
                            <HiOutlineX style={{ width: '18px', height: '18px' }} />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, overflowY: 'auto', padding: showLabels ? '12px' : '12px 8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {navItems.map(({ to, icon: Icon, label }) => (
                            <NavLink key={to} to={to} end={to === '/'} style={{ textDecoration: 'none' }} onClick={handleNavClick}>
                                {({ isActive }) => (
                                    <div
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '10px',
                                            padding: '10px 12px', transition: 'all 0.15s', cursor: 'pointer',
                                            background: isActive ? 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(109,40,217,0.08))' : 'transparent',
                                            color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
                                            borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                                        }}
                                        onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                                        onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                                    >
                                        <Icon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                                        {showLabels && (
                                            <span style={{ fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
                                        )}
                                    </div>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </nav>

                {/* Quick add hint */}
                {showLabels && (
                    <div style={{
                        margin: '0 12px 12px', padding: '12px 16px', borderRadius: '12px', textAlign: 'center',
                        background: 'var(--accent-glow)', border: '1px solid rgba(124, 58, 237, 0.1)',
                    }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--accent-light)' }}>
                            <kbd style={{ padding: '2px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '5px', fontSize: '0.6875rem', fontFamily: 'inherit' }}>⌘K</kbd> Quick Add Task
                        </p>
                    </div>
                )}
            </motion.aside>
        </>
    );
}
