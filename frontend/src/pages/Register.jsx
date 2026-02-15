import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../stores/authStore';

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

const labelStyle = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '8px',
};

export default function Register() {
    const { register, isLoading } = useAuthStore();
    const [form, setForm] = useState({ email: '', username: '', full_name: '', password: '', password_confirm: '' });
    const [error, setError] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('');

    // Feedback for cold starts
    useEffect(() => {
        let timer;
        if (isLoading) {
            timer = setTimeout(() => {
                setLoadingMessage('Waking up the server... this may take up to a minute (Free Tier limits). Please wait!');
            }, 4000);
        } else {
            setLoadingMessage('');
        }
        return () => clearTimeout(timer);
    }, [isLoading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.password_confirm) { setError('Passwords do not match'); return; }
        const result = await register(form);
        if (!result.success) {
            setError(result.error ? Object.values(result.error).flat().join(', ') : 'Registration failed');
        }
    };

    const onFocus = (e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow-strong)'; };
    const onBlur = (e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; };

    const fields = [
        { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'John Doe' },
        { label: 'Username', key: 'username', type: 'text', placeholder: 'johndoe', required: true },
        { label: 'Email address', key: 'email', type: 'email', placeholder: 'you@example.com', required: true },
        { label: 'Password', key: 'password', type: 'password', placeholder: 'Min. 8 characters', required: true },
        { label: 'Confirm Password', key: 'password_confirm', type: 'password', placeholder: 'Repeat your password', required: true },
    ];

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden', padding: '24px',
        }}>
            <div style={{ position: 'absolute', top: '-200px', left: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}
            >
                {/* Branding */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '64px', height: '64px', borderRadius: '18px', marginBottom: '20px',
                        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        boxShadow: '0 8px 32px rgba(124, 58, 237, 0.35)',
                    }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'white' }}>F</span>
                    </div>
                    <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Create Account</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '6px' }}>Start your productivity journey</p>
                </div>

                {/* Card */}
                <div style={{
                    background: 'rgba(24, 24, 27, 0.75)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '20px',
                    padding: '32px 32px 24px',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                }}>
                    {error && (
                        <div style={{
                            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
                            background: 'var(--danger-bg)', color: 'var(--danger)',
                            border: '1px solid rgba(239, 68, 68, 0.15)', fontSize: '0.875rem', fontWeight: 500,
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {fields.map((f, i) => (
                            <div key={f.key} style={{ marginBottom: i < fields.length - 1 ? '18px' : '24px' }}>
                                <label style={labelStyle}>{f.label}</label>
                                <input
                                    type={f.type}
                                    placeholder={f.placeholder}
                                    value={form[f.key]}
                                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                                    required={f.required}
                                    autoComplete={f.type === 'password' ? 'new-password' : f.type}
                                    style={inputStyle}
                                    onFocus={onFocus}
                                    onBlur={onBlur}
                                />
                            </div>
                        ))}

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
                        >
                            {isLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <span style={{
                                        width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                                    }} />
                                    Creating account...
                                </span>
                            ) : 'Create Account'}
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

                    <div style={{ height: '1px', background: 'var(--border)', margin: '24px 0 20px' }} />

                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--accent-light)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
