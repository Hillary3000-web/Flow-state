import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlineClock, HiOutlinePencil, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import { scheduleAPI } from '../api';
import toast from 'react-hot-toast';
import useResponsive from '../hooks/useResponsive';
import SEO from '../components/SEO';

// 5 AM → 11 PM (22 hours shown, any block outside still visible via its hour row)
const HOURS = Array.from({ length: 19 }, (_, i) => i + 5);

const BLOCK_COLORS = {
    deep_work: '#6366f1',
    meeting: '#eab308',
    break: '#22c55e',
    task: '#a5b4fc',
};

const BLANK_BLOCK = { title: '', start_time: '09:00', end_time: '10:00', block_type: 'task' };

export default function Schedule() {
    const [blocks, setBlocks] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [showForm, setShowForm] = useState(false);
    const [newBlock, setNewBlock] = useState(BLANK_BLOCK);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState(BLANK_BLOCK);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [nowMinutes, setNowMinutes] = useState(() => {
        const n = new Date(); return n.getHours() * 60 + n.getMinutes();
    });
    const nowTimerRef = useRef(null);
    const { isMobile } = useResponsive();

    const inputStyle = {
        width: '100%', padding: isMobile ? '10px 14px' : '12px 16px',
        background: 'var(--bg-input)', border: '1px solid var(--border-strong)',
        borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem',
        fontFamily: 'inherit', outline: 'none',
    };
    const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' };

    useEffect(() => {
        nowTimerRef.current = setInterval(() => {
            const n = new Date();
            setNowMinutes(n.getHours() * 60 + n.getMinutes());
        }, 60000);
        return () => clearInterval(nowTimerRef.current);
    }, []);

    const isToday = date === new Date().toISOString().split('T')[0];

    const load = useCallback(() => {
        setIsLoading(true);
        scheduleAPI.listBlocks({ block_date: date })
            .then(r => setBlocks(r.data.results || r.data))
            .catch(() => toast.error('Failed to load schedule'))
            .finally(() => setIsLoading(false));
    }, [date]);

    useEffect(() => { load(); }, [load]);

    const create = async (e) => {
        e.preventDefault();
        try {
            await scheduleAPI.createBlock({ ...newBlock, block_date: date });
            setShowForm(false);
            setNewBlock(BLANK_BLOCK);
            load();
            toast.success('Block added!');
        } catch {
            toast.error('Failed to add block');
        }
    };

    const startEdit = (block) => {
        setEditingId(block.id);
        setConfirmDeleteId(null);
        setEditData({
            title: block.title || '',
            start_time: block.start_time?.slice(0, 5) || '09:00',
            end_time: block.end_time?.slice(0, 5) || '10:00',
            block_type: block.block_type || 'task',
        });
    };

    const saveEdit = async (id) => {
        try {
            await scheduleAPI.updateBlock(id, editData);
            setEditingId(null);
            load();
            toast.success('Block updated!');
        } catch {
            toast.error('Failed to update block');
        }
    };

    const deleteBlock = async (id) => {
        try {
            await scheduleAPI.deleteBlock(id);
            setBlocks(prev => prev.filter(b => b.id !== id));
            setConfirmDeleteId(null);
        } catch {
            toast.error('Failed to remove block');
        }
    };

    const formatHour = (h) => h > 12 ? `${h - 12}PM` : h === 12 ? '12PM' : `${h}AM`;

    const blocksForHour = (h) =>
        blocks.filter(b => parseInt(b.start_time?.split(':')[0]) === h);

    return (
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
            <SEO title="Schedule" description="Plan your day with time blocks." />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Schedule</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>Plan your day with time blocks</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                        style={{ ...inputStyle, width: isMobile ? '100%' : 'auto', flex: isMobile ? 1 : 'unset' }} />
                    <button onClick={() => setShowForm(!showForm)} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: isMobile ? '8px 14px' : '10px 20px',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white',
                        border: 'none', borderRadius: '10px', fontSize: '0.875rem',
                        fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                        <HiOutlinePlus style={{ width: '16px', height: '16px' }} />
                        {isMobile ? 'Add' : 'Add Block'}
                    </button>
                </div>
            </div>

            {/* Create form */}
            {showForm && (
                <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={create}
                    style={{ ...cardStyle, padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <input type="text" placeholder="Block title" value={newBlock.title}
                        onChange={e => setNewBlock({ ...newBlock, title: e.target.value })}
                        autoFocus required style={inputStyle} />
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input type="time" value={newBlock.start_time}
                            onChange={e => setNewBlock({ ...newBlock, start_time: e.target.value })}
                            style={{ ...inputStyle, width: 'auto', flex: isMobile ? 1 : 'unset' }} />
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>→</span>
                        <input type="time" value={newBlock.end_time}
                            onChange={e => setNewBlock({ ...newBlock, end_time: e.target.value })}
                            style={{ ...inputStyle, width: 'auto', flex: isMobile ? 1 : 'unset' }} />
                        <select value={newBlock.block_type}
                            onChange={e => setNewBlock({ ...newBlock, block_type: e.target.value })}
                            style={{ ...inputStyle, width: isMobile ? '100%' : 'auto' }}>
                            <option value="task">Task</option>
                            <option value="deep_work">Deep Work</option>
                            <option value="meeting">Meeting</option>
                            <option value="break">Break</option>
                        </select>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: isMobile ? '0' : 'auto', width: isMobile ? '100%' : 'auto' }}>
                            <button type="button" onClick={() => setShowForm(false)} style={{ flex: isMobile ? 1 : 'unset', padding: '10px 16px', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>Cancel</button>
                            <button type="submit" style={{ flex: isMobile ? 1 : 'unset', padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600 }}>Add</button>
                        </div>
                    </div>
                </motion.form>
            )}

            {/* Timeline */}
            <div style={{ ...cardStyle, padding: isMobile ? '12px' : '24px' }}>
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} style={{ height: '48px', marginBottom: '8px', borderRadius: '8px', background: 'var(--bg-hover)', opacity: 0.4, animation: 'pulse 1.5s infinite' }} />
                    ))
                ) : (
                    HOURS.map(hour => {
                        const hourStart = hour * 60;
                        const showNowLine = isToday && nowMinutes >= hourStart && nowMinutes < hourStart + 60;
                        const nowLinePercent = ((nowMinutes - hourStart) / 60) * 100;
                        return (
                        <div key={hour} style={{ display: 'flex', alignItems: 'flex-start', padding: isMobile ? '10px 0' : '14px 0', borderTop: '1px solid var(--border)', position: 'relative' }}>
                            <span style={{ width: isMobile ? '48px' : '64px', fontSize: '0.75rem', fontWeight: 500, color: showNowLine ? '#ef4444' : 'var(--text-dim)', paddingTop: '2px', flexShrink: 0 }}>
                                {formatHour(hour)}
                            </span>
                            <div style={{ flex: 1, minHeight: '32px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                                {showNowLine && (
                                    <div style={{
                                        position: 'absolute', top: `${nowLinePercent}%`, left: 0, right: 0,
                                        height: '2px', background: '#ef4444', zIndex: 2,
                                        boxShadow: '0 0 6px rgba(239,68,68,0.5)',
                                        pointerEvents: 'none',
                                    }}>
                                        <div style={{ position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                                    </div>
                                )}
                                {blocksForHour(hour).map(block => (
                                    <div key={block.id}>
                                        {editingId === block.id ? (
                                            <div style={{ borderRadius: '10px', padding: isMobile ? '10px 12px' : '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <input type="text" value={editData.title}
                                                    onChange={e => setEditData({ ...editData, title: e.target.value })}
                                                    autoFocus style={{ ...inputStyle, padding: '8px 12px', fontSize: '0.875rem' }} />
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <input type="time" value={editData.start_time}
                                                        onChange={e => setEditData({ ...editData, start_time: e.target.value })}
                                                        style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: '0.8125rem' }} />
                                                    <span style={{ color: 'var(--text-dim)' }}>→</span>
                                                    <input type="time" value={editData.end_time}
                                                        onChange={e => setEditData({ ...editData, end_time: e.target.value })}
                                                        style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: '0.8125rem' }} />
                                                    <select value={editData.block_type}
                                                        onChange={e => setEditData({ ...editData, block_type: e.target.value })}
                                                        style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: '0.8125rem' }}>
                                                        <option value="task">Task</option>
                                                        <option value="deep_work">Deep Work</option>
                                                        <option value="meeting">Meeting</option>
                                                        <option value="break">Break</option>
                                                    </select>
                                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                                                        <button onClick={() => setEditingId(null)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem' }}>
                                                            <HiOutlineX style={{ width: '12px', height: '12px' }} /> Cancel
                                                        </button>
                                                        <button onClick={() => saveEdit(block.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 600 }}>
                                                            <HiOutlineCheck style={{ width: '12px', height: '12px' }} /> Save
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{
                                                borderRadius: '10px', padding: isMobile ? '10px 12px' : '12px 16px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                background: `${BLOCK_COLORS[block.block_type] || BLOCK_COLORS.task}10`,
                                                borderLeft: `3px solid ${BLOCK_COLORS[block.block_type] || BLOCK_COLORS.task}`,
                                            }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {block.title || block.block_type.replace('_', ' ')}
                                                    </p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <HiOutlineClock style={{ width: '12px', height: '12px' }} />
                                                        {block.start_time?.slice(0, 5)} – {block.end_time?.slice(0, 5)}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, marginLeft: '8px' }}>
                                                    <button onClick={() => startEdit(block)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '4px', borderRadius: '6px' }}
                                                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-light)'}
                                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>
                                                        <HiOutlinePencil style={{ width: '13px', height: '13px' }} />
                                                    </button>
                                                    {confirmDeleteId === block.id ? (
                                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                            <button onClick={() => deleteBlock(block.id)} style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'var(--danger-bg)', border: 'none', borderRadius: '6px', padding: '2px 7px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Yes</button>
                                                            <button onClick={() => setConfirmDeleteId(null)} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>No</button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => setConfirmDeleteId(block.id)} style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        );
                    })
                )}
            </div>

            <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }`}</style>
        </div>
    );
}
