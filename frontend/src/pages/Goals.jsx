import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineFlag, HiOutlinePencil, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import { goalsAPI } from '../api';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' };
const inputStyle = { width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' };
const badge = (bg, color) => ({ display: 'inline-flex', padding: '3px 10px', borderRadius: '50px', fontSize: '0.6875rem', fontWeight: 600, background: bg, color });

const BLANK = { title: '', description: '', target_date: '' };

export default function Goals() {
    const [goals, setGoals] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newGoal, setNewGoal] = useState(BLANK);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ ...BLANK, status: 'active' });
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(() => {
        setIsLoading(true);
        goalsAPI.list()
            .then(r => setGoals(r.data.results || r.data))
            .catch(() => toast.error('Failed to load goals'))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const create = async (e) => {
        e.preventDefault();
        try {
            await goalsAPI.create(newGoal);
            setNewGoal(BLANK);
            setShowForm(false);
            load();
            toast.success('Goal created!');
        } catch {
            toast.error('Failed to create goal');
        }
    };

    const startEdit = (goal) => {
        setEditingId(goal.id);
        setConfirmDeleteId(null);
        setEditData({
            title: goal.title,
            description: goal.description || '',
            target_date: goal.target_date || '',
            status: goal.status || 'active',
        });
    };

    const saveEdit = async (id) => {
        try {
            await goalsAPI.update(id, editData);
            setEditingId(null);
            load();
            toast.success('Goal updated!');
        } catch {
            toast.error('Failed to update goal');
        }
    };

    const deleteGoal = async (id) => {
        try {
            await goalsAPI.delete(id);
            setGoals(prev => prev.filter(g => g.id !== id));
            setConfirmDeleteId(null);
            toast.success('Goal deleted');
        } catch {
            toast.error('Failed to delete goal');
        }
    };

    return (
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <SEO title="Goals" description="Set and track your big-picture objectives." />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Goals</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>Define your north star objectives</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <HiOutlinePlus style={{ width: '16px', height: '16px' }} /> New Goal
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} onSubmit={create}
                        style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}
                    >
                        <input type="text" placeholder="What's your big goal?" value={newGoal.title}
                            onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                            autoFocus required style={{ ...inputStyle, fontSize: '1rem' }} />
                        <textarea placeholder="Why is this important?" value={newGoal.description}
                            onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
                            rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input type="date" value={newGoal.target_date}
                                onChange={e => setNewGoal({ ...newGoal, target_date: e.target.value })}
                                style={{ ...inputStyle, width: 'auto' }} />
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>Cancel</button>
                                <button type="submit" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600 }}>Create</button>
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} style={{ ...cardStyle, height: '120px', opacity: 0.4, animation: 'pulse 1.5s infinite' }} />
                    ))
                ) : goals.map((goal, i) => (
                    <motion.div key={goal.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        {editingId === goal.id ? (
                            <div style={{ ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', borderColor: 'var(--accent)' }}>
                                <input type="text" value={editData.title} autoFocus
                                    onChange={e => setEditData({ ...editData, title: e.target.value })}
                                    style={{ ...inputStyle, fontSize: '1rem' }} />
                                <textarea value={editData.description} rows={2}
                                    onChange={e => setEditData({ ...editData, description: e.target.value })}
                                    style={{ ...inputStyle, resize: 'vertical' }} />
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <input type="date" value={editData.target_date}
                                        onChange={e => setEditData({ ...editData, target_date: e.target.value })}
                                        style={{ ...inputStyle, width: 'auto' }} />
                                    <select value={editData.status}
                                        onChange={e => setEditData({ ...editData, status: e.target.value })}
                                        style={{ ...inputStyle, width: 'auto' }}>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                        <option value="paused">Paused</option>
                                    </select>
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                        <button onClick={() => setEditingId(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>
                                            <HiOutlineX style={{ width: '13px', height: '13px' }} /> Cancel
                                        </button>
                                        <button onClick={() => saveEdit(goal.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600 }}>
                                            <HiOutlineCheck style={{ width: '13px', height: '13px' }} /> Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ ...cardStyle, padding: '24px', transition: 'border-color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-glow)', flexShrink: 0 }}>
                                            <HiOutlineFlag style={{ width: '20px', height: '20px', color: 'var(--accent-light)' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{goal.title}</h3>
                                            {goal.description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>{goal.description}</p>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, marginLeft: '12px' }}>
                                        <span style={badge(goal.status === 'completed' ? 'var(--success-bg)' : 'var(--accent-glow)', goal.status === 'completed' ? 'var(--success)' : 'var(--accent-light)')}>
                                            {goal.status}
                                        </span>
                                        <button onClick={() => startEdit(goal)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '4px', borderRadius: '6px' }}
                                            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-light)'}
                                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>
                                            <HiOutlinePencil style={{ width: '15px', height: '15px' }} />
                                        </button>
                                        {confirmDeleteId === goal.id ? (
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delete?</span>
                                                <button onClick={() => deleteGoal(goal.id)} style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'var(--danger-bg)', border: 'none', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Yes</button>
                                                <button onClick={() => setConfirmDeleteId(null)} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>No</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setConfirmDeleteId(goal.id)} style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                                                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>Delete</button>
                                        )}
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{goal.project_count || 0} projects</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-light)' }}>{goal.progress_pct}%</span>
                                    </div>
                                    <div style={{ height: '6px', borderRadius: '50px', overflow: 'hidden', background: 'var(--bg-hover)' }}>
                                        <motion.div style={{ height: '100%', borderRadius: '50px', background: 'linear-gradient(90deg, #6366f1, #a5b4fc)' }}
                                            initial={{ width: 0 }} animate={{ width: `${goal.progress_pct}%` }} />
                                    </div>
                                </div>

                                {goal.target_date && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '12px' }}>
                                        Target: {new Date(goal.target_date).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        )}
                    </motion.div>
                ))}

                {!isLoading && goals.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '64px 0' }}>
                        <p style={{ fontSize: '2rem', marginBottom: '12px' }}>🎯</p>
                        <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>No goals yet</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', marginTop: '4px' }}>Set a goal to track your biggest objectives</p>
                    </div>
                )}
            </div>

            <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }`}</style>
        </div>
    );
}
