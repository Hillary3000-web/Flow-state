import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineCheck, HiOutlineTrash, HiOutlinePencil, HiOutlineX } from 'react-icons/hi';
import { tasksAPI } from '../api';
import toast from 'react-hot-toast';
import useResponsive from '../hooks/useResponsive';
import SEO from '../components/SEO';

const PRIORITY_LABELS = { P1: 'Urgent', P2: 'High', P3: 'Medium', P4: 'Low' };
const PRIORITY_COLORS = {
    P1: { bg: 'rgba(239,68,68,0.1)', c: '#ef4444' },
    P2: { bg: 'rgba(234,179,8,0.1)', c: '#eab308' },
    P3: { bg: 'rgba(99,102,241,0.1)', c: '#818cf8' },
    P4: { bg: 'rgba(113,113,122,0.1)', c: '#71717a' },
};
const ENERGY_ICONS = { low: '🌙', medium: '⚡', high: '🔥' };

const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' };
const BLANK_TASK = { title: '', priority: 'P3', energy_level: 'medium', due_date: '' };

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [newTask, setNewTask] = useState(BLANK_TASK);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState(BLANK_TASK);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isMobile } = useResponsive();

    const inputStyle = {
        width: '100%', padding: isMobile ? '10px 14px' : '12px 16px',
        background: 'var(--bg-input)', border: '1px solid var(--border-strong)',
        borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem',
        fontFamily: 'inherit', outline: 'none',
    };

    const load = useCallback(() => {
        setIsLoading(true);
        tasksAPI.list(filter !== 'all' ? { status: filter } : {})
            .then(r => setTasks(r.data.results || r.data))
            .catch(() => toast.error('Failed to load tasks'))
            .finally(() => setIsLoading(false));
    }, [filter]);

    useEffect(() => { load(); }, [load]);

    const create = async (e) => {
        e.preventDefault();
        try {
            await tasksAPI.create({ ...newTask, due_date: newTask.due_date || null });
            setNewTask(BLANK_TASK);
            setShowForm(false);
            load();
            toast.success('Task created!');
        } catch {
            toast.error('Failed to create task');
        }
    };

    const startEdit = (task) => {
        setEditingId(task.id);
        setConfirmDeleteId(null);
        setEditData({
            title: task.title,
            priority: task.priority,
            energy_level: task.energy_level,
            due_date: task.due_date ? task.due_date.slice(0, 16) : '',
        });
    };

    const saveEdit = async (id) => {
        try {
            await tasksAPI.update(id, { ...editData, due_date: editData.due_date || null });
            setEditingId(null);
            load();
            toast.success('Task updated!');
        } catch {
            toast.error('Failed to update task');
        }
    };

    const complete = async (id) => {
        try {
            await tasksAPI.complete(id);
            load();
            toast.success('Done! 🎉');
        } catch {
            toast.error('Failed to complete task');
        }
    };

    const deleteTask = async (id) => {
        try {
            await tasksAPI.delete(id);
            setTasks(prev => prev.filter(t => t.id !== id));
            setConfirmDeleteId(null);
            toast.success('Task deleted');
        } catch {
            toast.error('Failed to delete task');
        }
    };

    const FILTERS = [
        { key: 'all', label: 'All' },
        { key: 'todo', label: 'To Do' },
        { key: 'in_progress', label: 'Active' },
        { key: 'done', label: 'Done' },
    ];

    return (
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
            <SEO title="Tasks" description="Manage and prioritize your tasks." />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Tasks</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: isMobile ? '8px 16px' : '10px 24px',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white',
                    border: 'none', borderRadius: '10px', fontSize: '0.875rem',
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 2px 12px rgba(79,70,229,0.35)',
                }}>
                    <HiOutlinePlus style={{ width: '16px', height: '16px' }} />
                    {isMobile ? 'Add' : 'New Task'}
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {FILTERS.map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)} style={{
                        padding: isMobile ? '6px 14px' : '8px 18px', borderRadius: '10px',
                        fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
                        fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                        background: filter === f.key ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'var(--bg-card)',
                        color: filter === f.key ? 'white' : 'var(--text-muted)',
                        border: `1px solid ${filter === f.key ? 'transparent' : 'var(--border)'}`,
                        boxShadow: filter === f.key ? '0 2px 12px rgba(99,102,241,0.3)' : 'none',
                    }}>{f.label}</button>
                ))}
            </div>

            {/* Create form */}
            <AnimatePresence>
                {showForm && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} onSubmit={create}
                        style={{ ...cardStyle, padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'hidden' }}
                    >
                        <input type="text" placeholder="What needs to be done?" value={newTask.title}
                            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                            autoFocus required style={{ ...inputStyle, fontSize: '1rem' }} />
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <select style={{ ...inputStyle, width: 'auto' }} value={newTask.priority}
                                onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                                {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                            <select style={{ ...inputStyle, width: 'auto' }} value={newTask.energy_level}
                                onChange={e => setNewTask({ ...newTask, energy_level: e.target.value })}>
                                <option value="low">🌙 Low</option>
                                <option value="medium">⚡ Medium</option>
                                <option value="high">🔥 High</option>
                            </select>
                            <input type="datetime-local" style={{ ...inputStyle, width: 'auto', flex: 1 }}
                                value={newTask.due_date}
                                onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} />
                            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>Cancel</button>
                                <button type="submit" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600 }}>Create</button>
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Task list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} style={{ ...cardStyle, height: '72px', opacity: 0.4, animation: 'pulse 1.5s infinite' }} />
                    ))
                ) : (
                    <AnimatePresence>
                        {tasks.map((task, i) => (
                            <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.02 }}>

                                {editingId === task.id ? (
                                    /* Inline edit form */
                                    <div style={{ ...cardStyle, padding: isMobile ? '14px' : '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderColor: 'var(--accent)' }}>
                                        <input type="text" value={editData.title} autoFocus
                                            onChange={e => setEditData({ ...editData, title: e.target.value })}
                                            style={{ ...inputStyle, fontSize: '0.9375rem' }} />
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <select style={{ ...inputStyle, width: 'auto' }} value={editData.priority}
                                                onChange={e => setEditData({ ...editData, priority: e.target.value })}>
                                                {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                            </select>
                                            <select style={{ ...inputStyle, width: 'auto' }} value={editData.energy_level}
                                                onChange={e => setEditData({ ...editData, energy_level: e.target.value })}>
                                                <option value="low">🌙 Low</option>
                                                <option value="medium">⚡ Medium</option>
                                                <option value="high">🔥 High</option>
                                            </select>
                                            <input type="datetime-local" style={{ ...inputStyle, width: 'auto', flex: 1 }}
                                                value={editData.due_date}
                                                onChange={e => setEditData({ ...editData, due_date: e.target.value })} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => setEditingId(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>
                                                <HiOutlineX style={{ width: '13px', height: '13px' }} /> Cancel
                                            </button>
                                            <button onClick={() => saveEdit(task.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600 }}>
                                                <HiOutlineCheck style={{ width: '13px', height: '13px' }} /> Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Default row */
                                    <div style={{ ...cardStyle, padding: isMobile ? '12px 14px' : '16px 20px', display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', transition: 'border-color 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>

                                        {/* Complete checkbox */}
                                        <button onClick={() => task.status !== 'done' && complete(task.id)} style={{
                                            width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                                            border: `2px solid ${task.status === 'done' ? 'var(--success)' : 'var(--border-strong)'}`,
                                            background: task.status === 'done' ? 'var(--success-bg)' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                        }}>
                                            {task.status === 'done' && <HiOutlineCheck style={{ width: '12px', height: '12px', color: 'var(--success)' }} />}
                                        </button>

                                        {/* Title + badges */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                fontSize: '0.875rem', fontWeight: 500,
                                                color: task.status === 'done' ? 'var(--text-dim)' : 'var(--text-primary)',
                                                textDecoration: task.status === 'done' ? 'line-through' : 'none',
                                                overflow: 'hidden', textOverflow: 'ellipsis',
                                                whiteSpace: isMobile ? 'normal' : 'nowrap',
                                            }}>{task.title}</p>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: '50px', fontSize: '0.6875rem', fontWeight: 600, background: PRIORITY_COLORS[task.priority]?.bg, color: PRIORITY_COLORS[task.priority]?.c }}>
                                                    {PRIORITY_LABELS[task.priority]}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{ENERGY_ICONS[task.energy_level]}</span>
                                                {task.due_date && (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                                        📅 {new Date(task.due_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                                            <button onClick={() => startEdit(task)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '6px', borderRadius: '6px' }}
                                                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-light)'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>
                                                <HiOutlinePencil style={{ width: '15px', height: '15px' }} />
                                            </button>
                                            {confirmDeleteId === task.id ? (
                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    <button onClick={() => deleteTask(task.id)} style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'var(--danger-bg)', border: 'none', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Yes</button>
                                                    <button onClick={() => setConfirmDeleteId(null)} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>No</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setConfirmDeleteId(task.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '6px', borderRadius: '6px' }}>
                                                    <HiOutlineTrash style={{ width: '16px', height: '16px' }} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {!isLoading && tasks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: isMobile ? '40px 0' : '64px 0' }}>
                        <p style={{ fontSize: '2rem', marginBottom: '12px' }}>📋</p>
                        <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>No tasks yet</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', marginTop: '4px' }}>Tap + to add your first task</p>
                    </div>
                )}
            </div>

            <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }`}</style>
        </div>
    );
}
