import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineLightningBolt, HiOutlineX } from 'react-icons/hi';
import { tasksAPI } from '../../api';
import useUIStore from '../../stores/uiStore';
import toast from 'react-hot-toast';

const P_COLORS = { P1: { bg: 'rgba(239,68,68,0.1)', c: '#ef4444' }, P2: { bg: 'rgba(234,179,8,0.1)', c: '#eab308' }, P3: { bg: 'rgba(124,58,237,0.1)', c: '#8b5cf6' }, P4: { bg: 'rgba(113,113,122,0.1)', c: '#71717a' } };

export default function QuickCapture() {
    const { quickCaptureOpen, closeQuickCapture } = useUIStore();
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('P3');
    const inputRef = useRef(null);

    useEffect(() => { if (quickCaptureOpen) setTimeout(() => inputRef.current?.focus(), 50); }, [quickCaptureOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        try { await tasksAPI.quickCapture({ title, priority }); setTitle(''); setPriority('P3'); closeQuickCapture(); toast.success('Task captured! ⚡'); }
        catch { toast.error('Failed'); }
    };

    return (
        <AnimatePresence>
            {quickCaptureOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={closeQuickCapture}
                        style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: -16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.96 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        style={{ position: 'fixed', top: '18%', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '520px', zIndex: 51, padding: '0 16px' }}
                    >
                        <div style={{
                            borderRadius: '18px', overflow: 'hidden',
                            background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.1)',
                        }}>
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px' }}>
                                    <HiOutlineLightningBolt style={{ width: '20px', height: '20px', color: 'var(--accent-light)', flexShrink: 0 }} />
                                    <input ref={inputRef} type="text"
                                        placeholder="What needs to be done?"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Escape' && closeQuickCapture()}
                                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500, fontFamily: 'inherit' }}
                                    />
                                    <button type="button" onClick={closeQuickCapture} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px' }}>
                                        <HiOutlineX style={{ width: '16px', height: '16px', color: 'var(--text-dim)' }} />
                                    </button>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'var(--bg-input)', borderTop: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {['P1', 'P2', 'P3', 'P4'].map((p) => (
                                            <button key={p} type="button" onClick={() => setPriority(p)} style={{
                                                padding: '3px 10px', borderRadius: '50px', fontSize: '0.6875rem', fontWeight: 600,
                                                border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                                                background: P_COLORS[p].bg, color: P_COLORS[p].c,
                                                opacity: priority === p ? 1 : 0.4,
                                                transform: priority === p ? 'scale(1.08)' : 'scale(1)',
                                                boxShadow: priority === p ? `0 0 0 2px ${P_COLORS[p].c}40` : 'none',
                                            }}>{p}</button>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                        <kbd style={{ padding: '2px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '5px', fontSize: '0.6875rem', fontFamily: 'inherit' }}>Enter</kbd> save · <kbd style={{ padding: '2px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '5px', fontSize: '0.6875rem', fontFamily: 'inherit' }}>Esc</kbd> close
                                    </div>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
