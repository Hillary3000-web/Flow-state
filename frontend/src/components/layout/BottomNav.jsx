import { NavLink } from 'react-router-dom';
import {
    HiOutlineViewGrid, HiOutlineClipboardList, HiOutlineLightningBolt,
    HiOutlineRefresh, HiOutlineFlag, HiOutlineMenu,
} from 'react-icons/hi';
import useUIStore from '../../stores/uiStore';

const tabs = [
    { to: '/dashboard', icon: HiOutlineViewGrid,     label: 'Home' },
    { to: '/tasks',     icon: HiOutlineClipboardList, label: 'Tasks' },
    { to: '/focus',     icon: HiOutlineLightningBolt, label: 'Focus' },
    { to: '/habits',    icon: HiOutlineRefresh,       label: 'Habits' },
    { to: '/goals',     icon: HiOutlineFlag,          label: 'Goals' },
];

export default function BottomNav() {
    const toggleSidebar = useUIStore((s) => s.toggleSidebar);

    return (
        <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
            // Use padding-bottom instead of height so the nav grows to cover the
            // home-indicator safe area on iPhones without squishing the icons.
            paddingBottom: 'env(safe-area-inset-bottom)',
            display: 'flex', alignItems: 'stretch',
            background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)',
        }}>
            {tabs.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} style={{ flex: 1, textDecoration: 'none' }}>
                    {({ isActive }) => (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', gap: '3px',
                            height: '60px', // fixed icon area — safe-area padding is below this
                            color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
                            transition: 'color 0.15s',
                            position: 'relative',
                        }}>
                            {isActive && (
                                <span style={{
                                    position: 'absolute', top: 0, left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '28px', height: '2px',
                                    background: 'var(--accent)',
                                    borderRadius: '0 0 4px 4px',
                                }} />
                            )}
                            <Icon style={{ width: '21px', height: '21px' }} />
                            <span style={{ fontSize: '0.5625rem', fontWeight: isActive ? 600 : 500, letterSpacing: '0.02em' }}>
                                {label}
                            </span>
                        </div>
                    )}
                </NavLink>
            ))}

            {/* More — opens sidebar drawer */}
            <button
                onClick={toggleSidebar}
                style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: '3px',
                    height: '60px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 0, fontFamily: 'inherit',
                    transition: 'color 0.15s',
                }}
            >
                <HiOutlineMenu style={{ width: '21px', height: '21px' }} />
                <span style={{ fontSize: '0.5625rem', fontWeight: 500, letterSpacing: '0.02em' }}>More</span>
            </button>
        </nav>
    );
}
