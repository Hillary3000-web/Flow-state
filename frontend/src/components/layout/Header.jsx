import { useState, useRef, useEffect, useCallback } from 'react';
import { HiOutlineMenu, HiOutlineBell, HiOutlineMoon, HiOutlineSun, HiOutlineLogout, HiOutlineSearch, HiOutlineCheck } from 'react-icons/hi';
import useUIStore from '../../stores/uiStore';
import useAuthStore from '../../stores/authStore';
import useResponsive from '../../hooks/useResponsive';
import { notificationsAPI } from '../../api';

const iconBtnStyle = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '38px', height: '38px', background: 'transparent', color: 'var(--text-secondary)',
    border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
};

export default function Header() {
    const { theme, toggleTheme, toggleSidebar, toggleQuickCapture } = useUIStore();
    const { user, logout } = useAuthStore();
    const { isMobile } = useResponsive();
    const [showProfile, setShowProfile] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const profileRef = useRef(null);
    const notifsRef = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
            if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const loadNotifications = useCallback(async () => {
        try {
            const { data } = await notificationsAPI.list({ limit: 15 });
            const items = data.results || data;
            setNotifications(items);
            setUnreadCount(items.filter(n => !n.is_read).length);
        } catch { /* notifications are non-critical */ }
    }, []);

    useEffect(() => { loadNotifications(); }, [loadNotifications]);

    const toggleNotifs = () => {
        setShowNotifs(prev => {
            if (!prev) loadNotifications(); // Refresh on open
            return !prev;
        });
        setShowProfile(false);
    };

    const markRead = async (id) => {
        try {
            await notificationsAPI.markRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* non-critical */ }
    };

    const markAllRead = async () => {
        try {
            await notificationsAPI.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch { /* non-critical */ }
    };

    return (
        <header style={{
            height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isMobile ? '0 16px' : '0 24px', flexShrink: 0,
            background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        }}>
            {/* Left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
                <button onClick={toggleSidebar} style={iconBtnStyle}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <HiOutlineMenu style={{ width: '18px', height: '18px' }} />
                </button>

                {!isMobile && (
                    <button onClick={toggleQuickCapture} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px',
                        borderRadius: '10px', fontSize: '0.875rem', cursor: 'pointer',
                        background: 'var(--bg-input)', border: '1px solid var(--border-strong)',
                        color: 'var(--text-dim)', transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-muted)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}>
                        <HiOutlineSearch style={{ width: '16px', height: '16px' }} />
                        <span>Quick add or search...</span>
                        <kbd style={{ padding: '2px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '5px', fontSize: '0.6875rem', fontFamily: 'inherit', marginLeft: '8px' }}>⌘K</kbd>
                    </button>
                )}

                {isMobile && (
                    <button onClick={toggleQuickCapture} style={iconBtnStyle}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <HiOutlineSearch style={{ width: '18px', height: '18px' }} />
                    </button>
                )}
            </div>

            {/* Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* Notifications bell */}
                <div style={{ position: 'relative' }} ref={notifsRef}>
                    <button onClick={toggleNotifs} style={{ ...iconBtnStyle, position: 'relative' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <HiOutlineBell style={{ width: '18px', height: '18px' }} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '6px', right: '6px',
                                minWidth: '16px', height: '16px', borderRadius: '50%',
                                background: 'var(--danger)', boxShadow: '0 0 6px rgba(239,68,68,0.5)',
                                fontSize: '0.625rem', fontWeight: 700, color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0 3px',
                            }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </button>

                    {showNotifs && (
                        <div style={{
                            position: 'fixed',
                            top: '72px',
                            right: isMobile ? '12px' : '0px',
                            width: isMobile ? 'calc(100vw - 24px)' : '320px',
                            maxWidth: '360px',
                            borderRadius: '14px', zIndex: 50,
                            background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
                            boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</p>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} style={{ fontSize: '0.75rem', color: 'var(--accent-light)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.25rem', marginBottom: '8px' }}>🔔</p>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No notifications yet</p>
                                    </div>
                                ) : notifications.map(n => (
                                    <div key={n.id} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                                        padding: '12px 16px', borderBottom: '1px solid var(--border)',
                                        background: n.is_read ? 'transparent' : 'var(--accent-glow)',
                                        transition: 'background 0.15s',
                                    }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '0.8125rem', color: n.is_read ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: n.is_read ? 400 : 500, lineHeight: 1.4 }}>
                                                {n.message || n.title}
                                            </p>
                                            {n.created_at && (
                                                <p style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                                                    {new Date(n.created_at).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        {!n.is_read && (
                                            <button onClick={() => markRead(n.id)} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-light)', padding: '2px' }}
                                                title="Mark as read">
                                                <HiOutlineCheck style={{ width: '14px', height: '14px' }} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Theme toggle */}
                <button onClick={toggleTheme} style={iconBtnStyle}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {theme === 'dark'
                        ? <HiOutlineSun style={{ width: '18px', height: '18px', color: 'var(--warning)' }} />
                        : <HiOutlineMoon style={{ width: '18px', height: '18px', color: 'var(--accent-light)' }} />}
                </button>

                {/* Profile dropdown */}
                <div style={{ position: 'relative', marginLeft: '4px' }} ref={profileRef}>
                    <button onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '6px 12px 6px 6px', borderRadius: '10px', border: 'none',
                        background: showProfile ? 'var(--bg-hover)' : 'transparent', cursor: 'pointer',
                    }}
                        onMouseEnter={e => { if (!showProfile) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={e => { if (!showProfile) e.currentTarget.style.background = 'transparent'; }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 700, color: 'white',
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        }}>
                            {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        {!isMobile && (
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                {user?.full_name || user?.username || 'User'}
                            </span>
                        )}
                    </button>

                    {showProfile && (
                        <div style={{
                            position: 'fixed',
                            top: '72px',
                            right: isMobile ? '12px' : '0px',
                            width: isMobile ? 'calc(100vw - 24px)' : '220px',
                            maxWidth: '280px',
                            borderRadius: '14px', padding: '4px', zIndex: 50,
                            background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
                            boxShadow: 'var(--shadow-lg)',
                        }}>
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.full_name || 'User'}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{user?.email}</p>
                            </div>
                            <button onClick={logout} style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '10px 16px', fontSize: '0.875rem', color: 'var(--danger)',
                                border: 'none', background: 'transparent', borderRadius: '10px',
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <HiOutlineLogout style={{ width: '16px', height: '16px' }} /> Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
