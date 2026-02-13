import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineCheck, HiOutlineTrash } from 'react-icons/hi';
import { tasksAPI } from '../api';
import toast from 'react-hot-toast';
import useResponsive from '../hooks/useResponsive';

const PRIORITY = { P1: 'Urgent', P2: 'High', P3: 'Medium', P4: 'Low' };
const P_COLORS = { P1: { bg: 'rgba(239,68,68,0.1)', c: '#ef4444' }, P2: { bg: 'rgba(234,179,8,0.1)', c: '#eab308' }, P3: { bg: 'rgba(124,58,237,0.1)', c: '#8b5cf6' }, P4: { bg: 'rgba(113,113,122,0.1)', c: '#71717a' } };
const ENERGY = { low: '🌙', medium: '⚡', high: '🔥' };

const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' };

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', priority: 'P3', energy_level: 'medium', due_date: '' });
    const { isMobile } = useResponsive();

    const inputStyle = { width: '100%', padding: isMobile ? '10px 14px' : '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' };

    const load = () => { tasksAPI.list(filter !== 'all' ? { status: filter } : {}).then((r) => setTasks(r.data.results || r.data)).catch(() => { }); };
    useEffect(() => { load(); }, [filter]);

    const create = async (e) => { e.preventDefault(); try { await tasksAPI.create(newTask); setNewTask({ title: '', priority: 'P3', energy_level: 'medium', due_date: '' }); setShowForm(false); load(); toast.success('Task created!'); } catch { toast.error('Failed'); } };
    const complete = async (id) => { try { await tasksAPI.complete(id); load(); toast.success('Done! 🎉'); } catch { } };
    const del = async (id) => { try { await tasksAPI.delete(id); load(); toast.success('Deleted'); } catch { } };

    const filters = [{ key: 'all', label: 'All' }, { key: 'todo', label: 'To Do' }, { key: 'in_progress', label: 'Active' }, { key: 'done', label: 'Done' }];

    return (
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Tasks</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: isMobile ? '8px 16px' : '10px 24px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 12px rgba(109,40,217,0.35)' }}>
                    <HiOutlinePlus style={{ width: '16px', height: '16px' }} /> {isMobile ? 'Add' : 'New Task'}
                </button>
            </div>

            {/* Filters — scrollable on mobile */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {filters.map((f) => (
                    <button key={f.key} onClick={() => setFilter(f.key)} style={{
                        padding: isMobile ? '6px 14px' : '8px 18px', borderRadius: '10px', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                        background: filter === f.key ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'var(--bg-card)',
                        color: filter === f.key ? 'white' : 'var(--text-muted)',
                        border: `1px solid ${filter === f.key ? 'transparent' : 'var(--border)'}`,
                        boxShadow: filter === f.key ? '0 2px 12px rgba(124,58,237,0.3)' : 'none',
                    }}>{f.label}</button>
                ))}
            </div>

            {/* Create Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={create}
                        style={{ ...cardStyle, padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'hidden' }}>
                        <input type="text" placeholder="What needs to be done?" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} autoFocus required style={{ ...inputStyle, fontSize: '1rem' }} />
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <select style={{ ...inputStyle, width: 'auto', paddingRight: '36px' }} value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
                                {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                            <select style={{ ...inputStyle, width: 'auto', paddingRight: '36px' }} value={newTask.energy_level} onChange={(e) => setNewTask({ ...newTask, energy_level: e.target.value })}>
                                <option value="low">🌙 Low</option><option value="medium">⚡ Medium</option><option value="high">🔥 High</option>
                            </select>
                            {!isMobile && <input type="datetime-local" style={{ ...inputStyle, width: 'auto' }} value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} />}
                            <div style={{ display: 'flex', gap: '8px', marginLeft: isMobile ? '0' : 'auto', width: isMobile ? '100%' : 'auto' }}>
                                <button type="button" onClick={() => setShowForm(false)} style={{ flex: isMobile ? 1 : 'unset', padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>Cancel</button>
                                <button type="submit" style={{ flex: isMobile ? 1 : 'unset', padding: '10px 20px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600 }}>Create</button>
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Task List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <AnimatePresence>
                    {tasks.map((t, i) => (
                        <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}
                            style={{ ...cardStyle, padding: isMobile ? '12px 14px' : '16px 20px', display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', transition: 'border-color 0.2s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                            <button onClick={() => t.status !== 'done' && complete(t.id)} style={{
                                width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                                border: `2px solid ${t.status === 'done' ? 'var(--success)' : 'var(--border-strong)'}`,
                                background: t.status === 'done' ? 'var(--success-bg)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            }}>
                                {t.status === 'done' && <HiOutlineCheck style={{ width: '12px', height: '12px', color: 'var(--success)' }} />}
                            </button>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: t.status === 'done' ? 'var(--text-dim)' : 'var(--text-primary)', textDecoration: t.status === 'done' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isMobile ? 'normal' : 'nowrap' }}>{t.title}</p>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: '50px', fontSize: '0.6875rem', fontWeight: 600, background: P_COLORS[t.priority]?.bg, color: P_COLORS[t.priority]?.c }}>{PRIORITY[t.priority]}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{ENERGY[t.energy_level]}</span>
                                    {!isMobile && t.due_date && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>📅 {new Date(t.due_date).toLocaleDateString()}</span>}
                                </div>
                            </div>

                            <button onClick={() => del(t.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '6px', borderRadius: '6px', flexShrink: 0 }}>
                                <HiOutlineTrash style={{ width: '16px', height: '16px' }} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {tasks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: isMobile ? '40px 0' : '64px 0' }}>
                        <p style={{ fontSize: '2rem', marginBottom: '12px' }}>📋</p>
                        <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>No tasks yet</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', marginTop: '4px' }}>Tap + to add your first task</p>
                    </div>
                )}
            </div>
        </div>
    );
}
