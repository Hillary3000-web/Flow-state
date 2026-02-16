import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../stores/authStore';
import useResponsive from '../hooks/useResponsive';

export default function Login() {
    const { login, isLoading } = useAuthStore();
    const { isMobile } = useResponsive();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('');

    // Feedback for cold starts
    useEffect(() => {
        let timer;
        if (isLoading) {
            timer = setTimeout(() => {
                setLoadingMessage('Waking up the server... this may take up to a minute (Free Tier limits). Please wait!');
            }, 3000);
        } else {
            setLoadingMessage('');
        }
        return () => clearTimeout(timer);
    }, [isLoading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(form);
        if (!result.success) setError(result.error?.detail || 'Invalid email or password');
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        background: 'var(--bg-input)',
        border: '1px solid var(--border-strong)',
        borderRadius: '10px',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            position: 'relative',
            overflow: 'hidden',
            padding: '24px',
        }}>
            {/* Ambient glow */}
            {/* Ambient glow - Desktop only */}
            {!isMobile && (
                <>
                    <div style={{
                        position: 'absolute', top: '-200px', left: '-100px', width: '500px', height: '500px',
                        background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
                        borderRadius: '50%', pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '-200px', right: '-100px', width: '400px', height: '400px',
                        background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
                        borderRadius: '50%', pointerEvents: 'none',
                    }} />
                </>
            )}

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}
            >
                {/* Branding */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '64px', height: '64px', borderRadius: '18px', marginBottom: '20px',
                            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                            boxShadow: '0 8px 32px rgba(124, 58, 237, 0.35)',
                        }}
                    >
                        <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'white' }}>F</span>
                    </motion.div>
                    <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>FlowState</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '6px' }}>Execute with consistency</p>
                </div>

                {/* Card */}
                <div style={{
                    background: 'rgba(24, 24, 27, 0.75)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '20px',
                    padding: '36px 32px 28px',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Welcome back</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '28px' }}>Sign in to your account to continue</p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
                                background: 'var(--danger-bg)', color: 'var(--danger)',
                                border: '1px solid rgba(239, 68, 68, 0.15)', fontSize: '0.875rem', fontWeight: 500,
                            }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>Email address</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                autoComplete="email"
                                required
                                style={inputStyle}
                                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow-strong)'; }}
                                onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        <div style={{ marginBottom: '28px' }}>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>Password</label>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                autoComplete="current-password"
                                required
                                style={inputStyle}
                                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow-strong)'; }}
                                onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                width: '100%', padding: '13px 24px',
                                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                color: 'white', border: 'none', borderRadius: '10px',
                                fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.6 : 1,
                                boxShadow: '0 2px 12px rgba(109, 40, 217, 0.35)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(109, 40, 217, 0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(109, 40, 217, 0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {isLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <span style={{
                                        width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                                    }} />
                                    Signing in...
                                </span>
                            ) : 'Sign in'}
                        </motion.button>

                        {loadingMessage && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}
                            >
                                {loadingMessage}
                            </motion.p>
                        )}
                    </form>

                    {/* Divider */}
                    <div style={{ height: '1px', background: 'var(--border)', margin: '24px 0 20px' }} />

                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: 'var(--accent-light)', fontWeight: 600, textDecoration: 'none' }}>
                            Create account
                        </Link>
                    </p>
                </div>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '32px' }}>
                    Designed for students, developers & founders
                </p>
            </motion.div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
