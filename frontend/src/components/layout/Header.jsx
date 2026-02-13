import { HiOutlineMenu, HiOutlineBell, HiOutlineMoon, HiOutlineSun, HiOutlineLogout, HiOutlineSearch } from 'react-icons/hi';
import useUIStore from '../../stores/uiStore';
import useAuthStore from '../../stores/authStore';
import useResponsive from '../../hooks/useResponsive';
import { useState, useRef, useEffect } from 'react';

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
    const profileRef = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <header style={{
            height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isMobile ? '0 16px' : '0 24px', flexShrink: 0,
            background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        }}>
            {/* Left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
                <button onClick={toggleSidebar} style={iconBtnStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <HiOutlineMenu style={{ width: '18px', height: '18px' }} />
                </button>

                {!isMobile && (
                    <button onClick={toggleQuickCapture} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px',
                        borderRadius: '10px', fontSize: '0.875rem', cursor: 'pointer',
                        background: 'var(--bg-input)', border: '1px solid var(--border-strong)',
                        color: 'var(--text-dim)', transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                    >
                        <HiOutlineSearch style={{ width: '16px', height: '16px' }} />
                        <span>Quick add or search...</span>
                        <kbd style={{ padding: '2px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '5px', fontSize: '0.6875rem', fontFamily: 'inherit', marginLeft: '8px' }}>⌘K</kbd>
                    </button>
                )}

                {isMobile && (
                    <button onClick={toggleQuickCapture} style={iconBtnStyle}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        <HiOutlineSearch style={{ width: '18px', height: '18px' }} />
                    </button>
                )}
            </div>

            {/* Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button style={{ ...iconBtnStyle, position: 'relative' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <HiOutlineBell style={{ width: '18px', height: '18px' }} />
                    <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 6px rgba(239,68,68,0.5)' }} />
                </button>

                <button onClick={toggleTheme} style={iconBtnStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                    {theme === 'dark' ? <HiOutlineSun style={{ width: '18px', height: '18px', color: 'var(--warning)' }} /> : <HiOutlineMoon style={{ width: '18px', height: '18px', color: 'var(--accent-light)' }} />}
                </button>

                {/* Profile */}
                <div style={{ position: 'relative', marginLeft: '4px' }} ref={profileRef}>
                    <button onClick={() => setShowProfile(!showProfile)} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '6px 12px 6px 6px', borderRadius: '10px', border: 'none',
                        background: showProfile ? 'var(--bg-hover)' : 'transparent', cursor: 'pointer',
                    }}
                        onMouseEnter={(e) => { if (!showProfile) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={(e) => { if (!showProfile) e.currentTarget.style.background = 'transparent'; }}
                    >
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 700, color: 'white',
                            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        }}>{user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}</div>
                        {!isMobile && <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{user?.full_name || user?.username || 'User'}</span>}
                    </button>

                    {showProfile && (
                        <div style={{
                            position: 'absolute', right: 0, top: '100%', marginTop: '8px',
                            width: '220px', borderRadius: '14px', padding: '4px', zIndex: 50,
                            background: 'var(--bg-card)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-lg)',
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
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-bg)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                <HiOutlineLogout style={{ width: '16px', height: '16px' }} /> Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
