import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMoon, HiOutlineSun, HiOutlineUser, HiOutlineLockClosed } from 'react-icons/hi';
import useUIStore from '../stores/uiStore';
import useAuthStore from '../stores/authStore';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

const cs = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' };
const is = { width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' };
const ls = { display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' };

export default function Settings() {
    const { theme, toggleTheme } = useUIStore();
    const { user, fetchUser } = useAuthStore();
    const [p, setP] = useState({ full_name: user?.full_name || '', timezone: user?.timezone || 'UTC' });
    const [pw, setPw] = useState({ old_password: '', new_password: '' });
    const saveP = async (e) => { e.preventDefault(); try { await authAPI.updateMe(p); await fetchUser(); toast.success('Saved!'); } catch { toast.error('Failed'); } };
    const savePw = async (e) => { e.preventDefault(); try { await authAPI.changePassword(pw); setPw({ old_password: '', new_password: '' }); toast.success('Changed!'); } catch (err) { toast.error(err.response?.data?.old_password?.[0] || 'Failed'); } };

    return (
        <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>Manage your preferences</p>
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ ...cs, padding: '24px' }}>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {theme === 'dark' ? <HiOutlineMoon style={{ width: '20px', height: '20px', color: 'var(--accent-light)' }} /> : <HiOutlineSun style={{ width: '20px', height: '20px', color: 'var(--warning)' }} />} Appearance
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Theme</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>Toggle dark and light mode</p>
                    </div>
                    <button onClick={toggleTheme} style={{
                        position: 'relative', width: '48px', height: '26px', borderRadius: '50px', border: 'none', cursor: 'pointer', transition: 'background 0.2s',
                        background: theme === 'dark' ? 'var(--accent)' : 'var(--border-strong)',
                    }}>
                        <motion.span style={{ position: 'absolute', top: '3px', width: '20px', height: '20px', borderRadius: '50%', background: 'white' }}
                            animate={{ left: theme === 'dark' ? 25 : 3 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    </button>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ ...cs, padding: '24px' }}>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HiOutlineUser style={{ width: '20px', height: '20px', color: 'var(--accent-light)' }} /> Profile
                </h2>
                <form onSubmit={saveP} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div><label style={ls}>Email</label><input type="email" value={user?.email || ''} disabled style={{ ...is, opacity: 0.5, cursor: 'not-allowed' }} /></div>
                    <div><label style={ls}>Full Name</label><input type="text" value={p.full_name} onChange={e => setP({ ...p, full_name: e.target.value })} style={is} /></div>
                    <div><label style={ls}>Timezone</label><select value={p.timezone} onChange={e => setP({ ...p, timezone: e.target.value })} style={is}><option value="UTC">UTC</option><option value="America/New_York">Eastern</option><option value="America/Los_Angeles">Pacific</option><option value="Europe/London">London</option><option value="Africa/Lagos">Lagos</option></select></div>
                    <button type="submit" style={{ alignSelf: 'flex-start', padding: '10px 24px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600 }}>Save Profile</button>
                </form>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ ...cs, padding: '24px' }}>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HiOutlineLockClosed style={{ width: '20px', height: '20px', color: 'var(--accent-light)' }} /> Change Password
                </h2>
                <form onSubmit={savePw} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div><label style={ls}>Current Password</label><input type="password" value={pw.old_password} onChange={e => setPw({ ...pw, old_password: e.target.value })} required style={is} /></div>
                    <div><label style={ls}>New Password</label><input type="password" value={pw.new_password} onChange={e => setPw({ ...pw, new_password: e.target.value })} required style={is} /></div>
                    <button type="submit" style={{ alignSelf: 'flex-start', padding: '10px 24px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600 }}>Update Password</button>
                </form>
            </motion.div>
        </div>
    );
}
