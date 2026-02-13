import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlineClock } from 'react-icons/hi';
import { scheduleAPI } from '../api';
import toast from 'react-hot-toast';
import useResponsive from '../hooks/useResponsive';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const cs = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' };
const bColors = { deep_work: '#7c3aed', meeting: '#eab308', break: '#22c55e', task: '#a78bfa' };

export default function Schedule() {
    const [blocks, setBlocks] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [showForm, setShowForm] = useState(false);
    const [nb, setNb] = useState({ title: '', start_time: '09:00', end_time: '10:00', block_type: 'task' });
    const { isMobile } = useResponsive();

    const is = { width: '100%', padding: isMobile ? '10px 14px' : '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' };

    const load = () => scheduleAPI.listBlocks({ block_date: date }).then(r => setBlocks(r.data.results || r.data)).catch(() => { });
    useEffect(() => { load(); }, [date]);
    const create = async (e) => { e.preventDefault(); try { await scheduleAPI.createBlock({ ...nb, block_date: date }); setShowForm(false); load(); toast.success('Added!'); } catch { toast.error('Failed'); } };
    const del = async (id) => { try { await scheduleAPI.deleteBlock(id); load(); } catch { } };

    return (
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
            <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Schedule</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>Plan your day</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...is, width: isMobile ? '100%' : 'auto', flex: isMobile ? 1 : 'unset' }} />
                    <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: isMobile ? '8px 14px' : '10px 20px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <HiOutlinePlus style={{ width: '16px', height: '16px' }} /> {isMobile ? 'Add' : 'Add Block'}
                    </button>
                </div>
            </div>
            {showForm && (
                <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={create} style={{ ...cs, padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <input type="text" placeholder="Block title" value={nb.title} onChange={e => setNb({ ...nb, title: e.target.value })} autoFocus required style={is} />
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input type="time" value={nb.start_time} onChange={e => setNb({ ...nb, start_time: e.target.value })} style={{ ...is, width: 'auto', flex: isMobile ? 1 : 'unset' }} />
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>→</span>
                        <input type="time" value={nb.end_time} onChange={e => setNb({ ...nb, end_time: e.target.value })} style={{ ...is, width: 'auto', flex: isMobile ? 1 : 'unset' }} />
                        <select value={nb.block_type} onChange={e => setNb({ ...nb, block_type: e.target.value })} style={{ ...is, width: isMobile ? '100%' : 'auto' }}>
                            <option value="task">Task</option><option value="deep_work">Deep Work</option><option value="meeting">Meeting</option><option value="break">Break</option>
                        </select>
                        <button type="submit" style={{ width: isMobile ? '100%' : 'auto', padding: '10px 20px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600 }}>Add</button>
                    </div>
                </motion.form>
            )}
            <div style={{ ...cs, padding: isMobile ? '12px' : '24px' }}>
                {HOURS.map(h => (
                    <div key={h} style={{ display: 'flex', alignItems: 'flex-start', padding: isMobile ? '10px 0' : '14px 0', borderTop: '1px solid var(--border)' }}>
                        <span style={{ width: isMobile ? '48px' : '64px', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-dim)', paddingTop: '2px', flexShrink: 0 }}>
                            {h > 12 ? `${h - 12}PM` : h === 12 ? '12PM' : `${h}AM`}
                        </span>
                        <div style={{ flex: 1, minHeight: '32px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {blocks.filter(b => parseInt(b.start_time?.split(':')[0]) === h).map(b => (
                                <div key={b.id} style={{ borderRadius: '10px', padding: isMobile ? '10px 12px' : '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `${bColors[b.block_type]}10`, borderLeft: `3px solid ${bColors[b.block_type]}` }}>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title || b.block_type.replace('_', ' ')}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <HiOutlineClock style={{ width: '12px', height: '12px' }} /> {b.start_time?.slice(0, 5)} – {b.end_time?.slice(0, 5)}
                                        </p>
                                    </div>
                                    <button onClick={() => del(b.id)} style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginLeft: '8px' }}>Remove</button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
