import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineLightningBolt, HiOutlinePlay, HiOutlinePause, HiOutlineStop, HiOutlineFire, HiOutlinePlus } from 'react-icons/hi';
import { focusAPI } from '../api';
import toast from 'react-hot-toast';
import useResponsive from '../hooks/useResponsive';

const cs = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' };

export default function Focus() {
    const [running, setRunning] = useState(false);
    const [secs, setSecs] = useState(25 * 60);
    const [target, setTarget] = useState(25);
    const [sid, setSid] = useState(null);
    const [stats, setStats] = useState(null);
    const [dist, setDist] = useState([]);
    const [di, setDi] = useState('');
    const iv = useRef(null);
    const { isMobile } = useResponsive();

    const is = { width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' };
    const btnP = { display: 'flex', alignItems: 'center', gap: '8px', padding: isMobile ? '12px 24px' : '13px 32px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none', borderRadius: '10px', fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 12px rgba(109,40,217,0.35)' };
    const btnG = { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500 };

    useEffect(() => { focusAPI.stats().then(r => setStats(r.data)).catch(() => { }); }, []);

    const start = async () => { try { const { data } = await focusAPI.createSession({ started_at: new Date().toISOString(), target_minutes: target, session_type: 'pomodoro' }); setSid(data.id); setRunning(true); setSecs(target * 60); } catch { toast.error('Failed'); } };
    const stop = async () => { setRunning(false); clearInterval(iv.current); if (sid) { const el = target * 60 - secs; try { await focusAPI.updateSession(sid, { ended_at: new Date().toISOString(), duration_seconds: el, is_completed: secs <= 0, distraction_log: dist }); toast.success(secs <= 0 ? 'Complete! 🎉' : 'Ended'); setSid(null); setDist([]); setSecs(target * 60); focusAPI.stats().then(r => setStats(r.data)).catch(() => { }); } catch { } } };

    useEffect(() => {
        if (running && secs > 0) { iv.current = setInterval(() => setSecs(s => { if (s <= 1) { setRunning(false); clearInterval(iv.current); stop(); return 0; } return s - 1; }), 1000); }
        return () => clearInterval(iv.current);
    }, [running]);

    const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    const prog = 1 - secs / (target * 60);
    const circ = 2 * Math.PI * 54;
    const timerSize = isMobile ? 200 : 240;

    return (
        <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? '20px' : '32px' }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Focus Mode</h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>Deep work without distractions</p>
            </div>

            <div style={{ ...cs, padding: isMobile ? '32px 20px' : '48px 32px', textAlign: 'center' }}>
                <div style={{ width: `${timerSize}px`, height: `${timerSize}px`, margin: '0 auto 28px', position: 'relative' }}>
                    <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" strokeWidth="3" />
                        <motion.circle cx="60" cy="60" r="54" fill="none" stroke="url(#tg)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={circ} animate={{ strokeDashoffset: circ * (1 - prog) }} transition={{ duration: 0.5 }} />
                        <defs><linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#a78bfa" /></linearGradient></defs>
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: isMobile ? '2.25rem' : '3rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{fmt(secs)}</span>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-dim)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{running ? 'Focusing' : sid ? 'Paused' : 'Ready'}</span>
                    </div>
                </div>

                {!sid && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '28px', flexWrap: 'wrap' }}>
                        {[15, 25, 45, 60].map(m => (
                            <button key={m} onClick={() => { setTarget(m); setSecs(m * 60); }} style={{
                                padding: isMobile ? '7px 16px' : '8px 20px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                background: target === m ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'var(--bg-hover)',
                                color: target === m ? 'white' : 'var(--text-muted)',
                                boxShadow: target === m ? '0 2px 12px rgba(124,58,237,0.3)' : 'none',
                            }}>{m}m</button>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {!sid ? (
                        <button onClick={start} style={btnP}><HiOutlinePlay style={{ width: '20px', height: '20px' }} /> Start Focus</button>
                    ) : (
                        <>
                            <button onClick={() => setRunning(r => !r)} style={btnG}>{running ? <><HiOutlinePause style={{ width: '18px', height: '18px' }} /> Pause</> : <><HiOutlinePlay style={{ width: '18px', height: '18px' }} /> Resume</>}</button>
                            <button onClick={stop} style={{ ...btnG, color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}><HiOutlineStop style={{ width: '18px', height: '18px' }} /> End</button>
                        </>
                    )}
                </div>
            </div>

            {sid && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ ...cs, padding: isMobile ? '16px' : '24px' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Distraction Log</h3>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <input placeholder="Log a distraction..." value={di} onChange={e => setDi(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setDist([...dist, { text: di }]), setDi(''))} style={{ ...is, flex: 1 }} />
                        <button onClick={() => { if (di.trim()) { setDist([...dist, { text: di }]); setDi(''); } }} style={{ ...btnG, padding: '10px 14px' }}><HiOutlinePlus style={{ width: '16px', height: '16px' }} /></button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {dist.map((d, i) => <p key={i} style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '4px 0 4px 12px', borderLeft: '2px solid var(--border-strong)' }}>{d.text}</p>)}
                    </div>
                </motion.div>
            )}

            {/* Stats — 2 cols on mobile, 4 on larger */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
                {[
                    { l: 'Today', v: `${stats?.today?.total_minutes || 0}m`, Icon: HiOutlineLightningBolt, c: '#7c3aed' },
                    { l: 'Week', v: `${stats?.this_week?.total_minutes || 0}m`, Icon: HiOutlineFire, c: '#eab308' },
                    { l: 'Sessions', v: stats?.all_time?.sessions || 0, Icon: HiOutlinePlay, c: '#22c55e' },
                    { l: 'Streak', v: `${stats?.current_streak_days || 0}d`, Icon: HiOutlineFire, c: '#ef4444' },
                ].map(({ l, v, Icon, c }) => (
                    <div key={l} style={{ ...cs, padding: isMobile ? '14px' : '16px', textAlign: 'center' }}>
                        <Icon style={{ width: '20px', height: '20px', color: c, margin: '0 auto 8px' }} />
                        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{v}</p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{l}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
