import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineFlag } from 'react-icons/hi';
import { goalsAPI } from '../api';
import toast from 'react-hot-toast';

const cs = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' };
const is = { width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' };
const bs = (bg, c) => ({ display: 'inline-flex', padding: '3px 10px', borderRadius: '50px', fontSize: '0.6875rem', fontWeight: 600, background: bg, color: c });

export default function Goals() {
    const [goals, setGoals] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [f, setF] = useState({ title: '', description: '', target_date: '' });
    const load = () => goalsAPI.list().then(r => setGoals(r.data.results || r.data)).catch(() => { });
    useEffect(() => { load(); }, []);
    const create = async (e) => { e.preventDefault(); try { await goalsAPI.create(f); setF({ title: '', description: '', target_date: '' }); setShowForm(false); load(); toast.success('Created!'); } catch { toast.error('Failed'); } };
    const del = async (id) => { if (confirm('Delete?')) { try { await goalsAPI.delete(id); load(); } catch { } } };

    return (
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Goals</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>Define your north star objectives</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <HiOutlinePlus style={{ width: '16px', height: '16px' }} /> New Goal
                </button>
            </div>
            <AnimatePresence>
                {showForm && (
                    <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={create} style={{ ...cs, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
                        <input type="text" placeholder="What's your big goal?" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} autoFocus required style={{ ...is, fontSize: '1rem' }} />
                        <textarea placeholder="Why is this important?" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} rows={2} style={{ ...is, resize: 'vertical' }} />
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input type="date" value={f.target_date} onChange={e => setF({ ...f, target_date: e.target.value })} style={{ ...is, width: 'auto' }} />
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>Cancel</button>
                                <button type="submit" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600 }}>Create</button>
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {goals.map((g, i) => (
                    <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ ...cs, padding: '24px', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-glow)' }}><HiOutlineFlag style={{ width: '20px', height: '20px', color: 'var(--accent-light)' }} /></div>
                                <div>
                                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{g.title}</h3>
                                    {g.description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>{g.description}</p>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span style={bs(g.status === 'completed' ? 'var(--success-bg)' : 'var(--accent-glow)', g.status === 'completed' ? 'var(--success)' : 'var(--accent-light)')}>{g.status}</span>
                                <button onClick={() => del(g.id)} style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.project_count || 0} projects</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-light)' }}>{g.progress_pct}%</span>
                            </div>
                            <div style={{ height: '6px', borderRadius: '50px', overflow: 'hidden', background: 'var(--bg-hover)' }}>
                                <motion.div style={{ height: '100%', borderRadius: '50px', background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }} initial={{ width: 0 }} animate={{ width: `${g.progress_pct}%` }} />
                            </div>
                        </div>
                        {g.target_date && <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '12px' }}>Target: {g.target_date}</p>}
                    </motion.div>
                ))}
                {goals.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '64px 0' }}>
                        <p style={{ fontSize: '2rem', marginBottom: '12px' }}>🎯</p>
                        <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>No goals yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
