import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineLightningBolt, HiOutlinePlay, HiOutlinePause, HiOutlineStop, HiOutlineFire, HiOutlinePlus } from 'react-icons/hi';
import { focusAPI } from '../api';
import toast from 'react-hot-toast';
import useResponsive from '../hooks/useResponsive';
import SEO from '../components/SEO';

const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' };

const inputStyle = {
    width: '100%', padding: '12px 16px', background: 'var(--bg-input)',
    border: '1px solid var(--border-strong)', borderRadius: '10px',
    color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
};

export default function Focus() {
    const [running, setRunning] = useState(false);
    const [secs, setSecs] = useState(25 * 60);
    const [target, setTarget] = useState(25);
    const [sessionId, setSessionId] = useState(null);
    const [stats, setStats] = useState(null);
    const [distractions, setDistractions] = useState([]);
    const [distractionInput, setDistractionInput] = useState('');
    const [timerCompleted, setTimerCompleted] = useState(false);
    const intervalRef = useRef(null);
    const { isMobile } = useResponsive();

    // Refs so stop() always sees current values without needing to be re-created
    const sessionIdRef = useRef(null);
    const secsRef = useRef(25 * 60);
    const targetRef = useRef(25);
    const distractionsRef = useRef([]);

    sessionIdRef.current = sessionId;
    secsRef.current = secs;
    targetRef.current = target;
    distractionsRef.current = distractions;

    useEffect(() => {
        focusAPI.stats().then(r => setStats(r.data)).catch(() => { });
    }, []);

    const btnPrimary = {
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: isMobile ? '12px 24px' : '13px 32px',
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white',
        border: 'none', borderRadius: '10px', fontSize: isMobile ? '0.875rem' : '1rem',
        fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 2px 12px rgba(79,70,229,0.35)',
    };
    const btnGhost = {
        display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
        background: 'transparent', border: '1px solid var(--border-strong)',
        borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer',
        fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500,
    };

    const stop = useCallback(async (completed = false) => {
        const sid = sessionIdRef.current;
        setRunning(false);
        clearInterval(intervalRef.current);
        if (sid) {
            const elapsed = targetRef.current * 60 - secsRef.current;
            try {
                await focusAPI.updateSession(sid, {
                    ended_at: new Date().toISOString(),
                    duration_seconds: elapsed,
                    is_completed: completed,
                    distraction_log: distractionsRef.current,
                });
                toast.success(completed ? 'Session complete! 🎉' : 'Session ended');
                if (completed && Notification.permission === 'granted') {
                    new Notification('FlowState — Session Complete! 🎉', {
                        body: `Great work! You focused for ${targetRef.current} minutes.`,
                        icon: '/favicon.ico',
                    });
                }
            } catch { /* session save failure is non-critical */ }
            setSessionId(null);
            setDistractions([]);
            setSecs(targetRef.current * 60);
            focusAPI.stats().then(r => setStats(r.data)).catch(() => { });
        }
    }, []);

    // Handle natural timer completion via a flag to avoid stale-closure issues
    useEffect(() => {
        if (timerCompleted) {
            setTimerCompleted(false);
            stop(true);
        }
    }, [timerCompleted, stop]);

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setSecs(s => {
                    if (s <= 1) {
                        setRunning(false);
                        clearInterval(intervalRef.current);
                        setTimerCompleted(true);
                        return 0;
                    }
                    return s - 1;
                });
            }, 1000);
        }
        return () => clearInterval(intervalRef.current);
    }, [running]);

    const start = async () => {
        if (Notification.permission === 'default') {
            Notification.requestPermission().catch(() => { });
        }
        try {
            const { data } = await focusAPI.createSession({
                started_at: new Date().toISOString(),
                target_minutes: target,
                session_type: 'pomodoro',
            });
            setSessionId(data.id);
            setRunning(true);
            setSecs(target * 60);
        } catch {
            toast.error('Failed to start session');
        }
    };

    const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    const progress = 1 - secs / (target * 60);
    const circ = 2 * Math.PI * 54;
    const timerSize = isMobile ? 200 : 240;

    const addDistraction = () => {
        if (distractionInput.trim()) {
            setDistractions(prev => [...prev, { text: distractionInput.trim() }]);
            setDistractionInput('');
        }
    };

    return (
        <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? '20px' : '32px' }}>
            <SEO title="Focus" description="Deep work without distractions." />

            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Focus Mode</h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>Deep work without distractions</p>
            </div>

            {/* Timer card */}
            <div style={{ ...cardStyle, padding: isMobile ? '32px 20px' : '48px 32px', textAlign: 'center' }}>
                <div style={{ width: `${timerSize}px`, height: `${timerSize}px`, margin: '0 auto 28px', position: 'relative' }}>
                    <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" strokeWidth="3" />
                        <motion.circle cx="60" cy="60" r="54" fill="none" stroke="url(#timerGrad)"
                            strokeWidth="3.5" strokeLinecap="round" strokeDasharray={circ}
                            animate={{ strokeDashoffset: circ * (1 - progress) }}
                            transition={{ duration: 0.5 }}
                        />
                        <defs>
                            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#a5b4fc" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: isMobile ? '2.25rem' : '3rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                            {fmt(secs)}
                        </span>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-dim)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {running ? 'Focusing' : sessionId ? 'Paused' : 'Ready'}
                        </span>
                    </div>
                </div>

                {/* Duration presets */}
                {!sessionId && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '28px', flexWrap: 'wrap' }}>
                        {[15, 25, 45, 60].map(m => (
                            <button key={m} onClick={() => { setTarget(m); setSecs(m * 60); }} style={{
                                padding: isMobile ? '7px 16px' : '8px 20px', borderRadius: '10px',
                                fontSize: '0.875rem', fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                background: target === m ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'var(--bg-hover)',
                                color: target === m ? 'white' : 'var(--text-muted)',
                                boxShadow: target === m ? '0 2px 12px rgba(99,102,241,0.3)' : 'none',
                            }}>{m}m</button>
                        ))}
                    </div>
                )}

                {/* Controls */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {!sessionId ? (
                        <button onClick={start} style={btnPrimary}>
                            <HiOutlinePlay style={{ width: '20px', height: '20px' }} /> Start Focus
                        </button>
                    ) : (
                        <>
                            <button onClick={() => setRunning(r => !r)} style={btnGhost}>
                                {running
                                    ? <><HiOutlinePause style={{ width: '18px', height: '18px' }} /> Pause</>
                                    : <><HiOutlinePlay style={{ width: '18px', height: '18px' }} /> Resume</>}
                            </button>
                            <button onClick={() => stop(false)} style={{ ...btnGhost, color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}>
                                <HiOutlineStop style={{ width: '18px', height: '18px' }} /> End
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Distraction log — only shown during a session */}
            {sessionId && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ ...cardStyle, padding: isMobile ? '16px' : '24px' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Distraction Log</h3>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <input
                            placeholder="Log a distraction..." value={distractionInput}
                            onChange={e => setDistractionInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addDistraction()}
                            style={{ ...inputStyle, flex: 1 }}
                        />
                        <button onClick={addDistraction} style={{ ...btnGhost, padding: '10px 14px' }}>
                            <HiOutlinePlus style={{ width: '16px', height: '16px' }} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {distractions.map((d, i) => (
                            <p key={i} style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '4px 0 4px 12px', borderLeft: '2px solid var(--border-strong)' }}>
                                {d.text}
                            </p>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
                {[
                    { label: 'Today', value: `${stats?.today?.total_minutes || 0}m`, Icon: HiOutlineLightningBolt, color: '#6366f1' },
                    { label: 'Week', value: `${stats?.this_week?.total_minutes || 0}m`, Icon: HiOutlineFire, color: '#eab308' },
                    { label: 'Sessions', value: stats?.all_time?.sessions || 0, Icon: HiOutlinePlay, color: '#22c55e' },
                    { label: 'Streak', value: `${stats?.current_streak_days || 0}d`, Icon: HiOutlineFire, color: '#ef4444' },
                ].map(({ label, value, Icon, color }) => (
                    <div key={label} style={{ ...cardStyle, padding: isMobile ? '14px' : '16px', textAlign: 'center' }}>
                        <Icon style={{ width: '20px', height: '20px', color, margin: '0 auto 8px' }} />
                        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
