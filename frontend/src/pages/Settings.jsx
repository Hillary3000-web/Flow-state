import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMoon, HiOutlineSun, HiOutlineUser, HiOutlineLockClosed } from 'react-icons/hi';
import useUIStore from '../stores/uiStore';
import useAuthStore from '../stores/authStore';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' };
const inputStyle = { width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' };
const labelStyle = { display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' };

const TIMEZONES = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern (New York)' },
    { value: 'America/Chicago', label: 'Central (Chicago)' },
    { value: 'America/Denver', label: 'Mountain (Denver)' },
    { value: 'America/Los_Angeles', label: 'Pacific (Los Angeles)' },
    { value: 'America/Anchorage', label: 'Alaska (Anchorage)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii (Honolulu)' },
    { value: 'America/Toronto', label: 'Toronto' },
    { value: 'America/Vancouver', label: 'Vancouver' },
    { value: 'America/Sao_Paulo', label: 'São Paulo' },
    { value: 'America/Mexico_City', label: 'Mexico City' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam' },
    { value: 'Europe/Madrid', label: 'Madrid' },
    { value: 'Europe/Rome', label: 'Rome' },
    { value: 'Europe/Moscow', label: 'Moscow' },
    { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
    { value: 'Africa/Nairobi', label: 'Nairobi (EAT)' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
    { value: 'Africa/Cairo', label: 'Cairo (EET)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Asia/Dhaka', label: 'Dhaka (BST)' },
    { value: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Seoul', label: 'Seoul (KST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
    { value: 'Australia/Melbourne', label: 'Melbourne' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
];

export default function Settings() {
    const { theme, toggleTheme } = useUIStore();
    const { user, fetchUser } = useAuthStore();
    const [profile, setProfile] = useState({ full_name: user?.full_name || '', timezone: user?.timezone || 'UTC' });
    const [passwords, setPasswords] = useState({ old_password: '', new_password: '' });

    const saveProfile = async (e) => {
        e.preventDefault();
        try {
            await authAPI.updateMe(profile);
            await fetchUser();
            toast.success('Profile saved!');
        } catch {
            toast.error('Failed to save profile');
        }
    };

    const savePassword = async (e) => {
        e.preventDefault();
        try {
            await authAPI.changePassword(passwords);
            setPasswords({ old_password: '', new_password: '' });
            toast.success('Password changed!');
        } catch (err) {
            toast.error(err.response?.data?.old_password?.[0] || 'Failed to change password');
        }
    };

    return (
        <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <SEO title="Settings" description="Manage your FlowState preferences." />

            <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>Manage your preferences</p>
            </div>

            {/* Appearance */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, padding: '24px' }}>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {theme === 'dark'
                        ? <HiOutlineMoon style={{ width: '20px', height: '20px', color: 'var(--accent-light)' }} />
                        : <HiOutlineSun style={{ width: '20px', height: '20px', color: 'var(--warning)' }} />}
                    Appearance
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Theme</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>Toggle dark and light mode</p>
                    </div>
                    <button onClick={toggleTheme} style={{
                        position: 'relative', width: '48px', height: '26px', borderRadius: '50px',
                        border: 'none', cursor: 'pointer', transition: 'background 0.2s',
                        background: theme === 'dark' ? 'var(--accent)' : 'var(--border-strong)',
                    }}>
                        <motion.span
                            style={{ position: 'absolute', top: '3px', width: '20px', height: '20px', borderRadius: '50%', background: 'white' }}
                            animate={{ left: theme === 'dark' ? 25 : 3 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    </button>
                </div>
            </motion.div>

            {/* Profile */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ ...cardStyle, padding: '24px' }}>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HiOutlineUser style={{ width: '20px', height: '20px', color: 'var(--accent-light)' }} /> Profile
                </h2>
                <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                        <label style={labelStyle}>Email</label>
                        <input type="email" value={user?.email || ''} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
                    </div>
                    <div>
                        <label style={labelStyle}>Full Name</label>
                        <input type="text" value={profile.full_name}
                            onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                            style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Timezone</label>
                        <select value={profile.timezone}
                            onChange={e => setProfile({ ...profile, timezone: e.target.value })}
                            style={inputStyle}>
                            {TIMEZONES.map(tz => (
                                <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" style={{ alignSelf: 'flex-start', padding: '10px 24px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600 }}>
                        Save Profile
                    </button>
                </form>
            </motion.div>

            {/* Change password */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ ...cardStyle, padding: '24px' }}>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HiOutlineLockClosed style={{ width: '20px', height: '20px', color: 'var(--accent-light)' }} /> Change Password
                </h2>
                <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                        <label style={labelStyle}>Current Password</label>
                        <input type="password" value={passwords.old_password}
                            onChange={e => setPasswords({ ...passwords, old_password: e.target.value })}
                            required style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>New Password</label>
                        <input type="password" value={passwords.new_password}
                            onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
                            required style={inputStyle} />
                    </div>
                    <button type="submit" style={{ alignSelf: 'flex-start', padding: '10px 24px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600 }}>
                        Update Password
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
