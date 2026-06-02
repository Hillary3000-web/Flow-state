import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineRefresh, HiOutlineFire, HiOutlineCheck,
    HiOutlineLightningBolt, HiOutlineChartBar, HiOutlineTrendingUp,
} from 'react-icons/hi';
import { habitsAPI } from '../api';
import toast from 'react-hot-toast';
import useResponsive from '../hooks/useResponsive';
import SEO from '../components/SEO';

function getLevel(streak) {
    if (streak >= 30) return { label: 'LEGEND',     color: '#ef4444' };
    if (streak >= 14) return { label: 'WARRIOR',    color: '#f97316' };
    if (streak >= 7)  return { label: 'CONSISTENT', color: '#eab308' };
    if (streak >= 3)  return { label: 'BUILDING',   color: '#6366f1' };
    return                   { label: 'STARTING',   color: '#71717a' };
}

function streakColor(streak) {
    if (streak >= 7) return '#ef4444';
    if (streak >= 3) return '#eab308';
    return '#6366f1';
}

function Ring({ done, streak }) {
    const size = 44;
    const cx = size / 2;
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const color = done ? '#22c55e' : streakColor(streak);
    const fill = done ? 1 : Math.min((streak || 0) / 7, 0.85);

    return (
        <svg width={size} height={size} style={{ flexShrink: 0 }}>
            <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--bg-hover)" strokeWidth="2.5" />
            <circle
                cx={cx} cy={cx} r={r}
                fill="none" stroke={color} strokeWidth="2.5"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - fill)}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cx})`}
                style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s' }}
            />
        </svg>
    );
}

function WeekDots({ habit }) {
    const streak = habit.current_streak || habit.streak || 0;
    const color = streakColor(streak);

    return (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {Array.from({ length: 7 }, (_, i) => {
                const daysAgo = 6 - i;
                const isToday = daysAgo === 0;
                const filled = isToday ? !!habit.checked_today : daysAgo < streak;
                return (
                    <div key={i} style={{
                        width: isToday ? '9px' : '7px',
                        height: isToday ? '9px' : '7px',
                        borderRadius: '50%',
                        background: filled ? color : 'var(--bg-hover)',
                        border: isToday && !filled ? '1.5px solid var(--border-strong)' : 'none',
                        boxShadow: filled && streak >= 5 ? `0 0 5px ${color}70` : 'none',
                        transition: 'all 0.3s',
                        flexShrink: 0,
                    }} />
                );
            })}
        </div>
    );
}

function HabitCard({ habit, isMobile, checkingIn, onCheckin }) {
    const [hovered, setHovered] = useState(false);
    const streak = habit.current_streak || habit.streak || 0;
    const level = getLevel(streak);
    const id = habit.id || habit.task_id;
    const isChecking = checkingIn === id;
    const color = streakColor(streak);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'var(--bg-card)',
                border: '1px solid',
                borderColor: habit.checked_today
                    ? (hovered ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.2)')
                    : (hovered ? 'var(--accent)' : 'var(--border)'),
                borderRadius: '14px',
                padding: isMobile ? '14px' : '16px 20px',
                display: 'flex', alignItems: 'center', gap: '14px',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: hovered
                    ? (habit.checked_today
                        ? '0 0 20px rgba(34,197,94,0.06)'
                        : '0 0 20px rgba(99,102,241,0.08)')
                    : 'none',
            }}
        >
            {/* Completion ring with overlay */}
            <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                <Ring done={!!habit.checked_today} streak={streak} />
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {habit.checked_today ? (
                        <HiOutlineCheck style={{ width: '15px', height: '15px', color: '#22c55e' }} />
                    ) : streak > 0 ? (
                        <span style={{
                            fontSize: '0.625rem', fontWeight: 700,
                            color, fontFamily: 'monospace',
                        }}>{streak}</span>
                    ) : null}
                </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <p style={{
                        fontSize: '0.9375rem', fontWeight: 500,
                        color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {habit.title || habit.task_title || 'Habit'}
                    </p>
                    {streak > 0 && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '2px 7px', borderRadius: '50px',
                            background: `${level.color}18`, color: level.color,
                            fontSize: '0.5625rem', fontWeight: 700,
                            letterSpacing: '0.1em',
                            fontFamily: "'JetBrains Mono', monospace",
                            flexShrink: 0,
                        }}>
                            {level.label}
                        </span>
                    )}
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    marginTop: '8px', flexWrap: 'wrap',
                }}>
                    <WeekDots habit={habit} />
                    {streak > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <HiOutlineFire style={{
                                width: '12px', height: '12px', color,
                                filter: streak >= 7 ? `drop-shadow(0 0 4px ${color})` : 'none',
                            }} />
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color }}>
                                {streak}d streak
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Check-in button */}
            <button
                onClick={() => onCheckin(id)}
                disabled={!!habit.checked_today || isChecking}
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: isMobile ? '8px 12px' : '9px 16px',
                    background: habit.checked_today
                        ? 'var(--success-bg)'
                        : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: habit.checked_today ? 'var(--success)' : 'white',
                    border: 'none', borderRadius: '10px',
                    fontSize: '0.8125rem', fontWeight: 600,
                    cursor: habit.checked_today ? 'default' : 'pointer',
                    fontFamily: 'inherit', flexShrink: 0,
                    opacity: isChecking ? 0.6 : 1,
                    transition: 'all 0.2s',
                    boxShadow: habit.checked_today ? 'none' : '0 2px 10px rgba(79,70,229,0.25)',
                    whiteSpace: 'nowrap',
                }}
            >
                {habit.checked_today ? (
                    <><HiOutlineCheck style={{ width: '14px', height: '14px' }} /> Done</>
                ) : isChecking ? (
                    <span style={{ animation: 'pulse 0.75s infinite' }}>···</span>
                ) : (
                    <>
                        <HiOutlineLightningBolt style={{ width: '14px', height: '14px' }} />
                        {isMobile ? 'Log' : 'Check In'}
                    </>
                )}
            </button>
        </div>
    );
}

export default function Habits() {
    const [habits, setHabits] = useState([]);
    const [progress, setProgress] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(null);
    const [filter, setFilter] = useState('all');
    const { isMobile } = useResponsive();

    const load = useCallback(() => {
        setIsLoading(true);
        Promise.all([
            habitsAPI.list().then(r => {
                // Guard: always store an array regardless of API shape
                const raw = r.data?.results ?? r.data;
                setHabits(Array.isArray(raw) ? raw : []);
            }).catch(() => { setHabits([]); }),
            habitsAPI.progress().then(r => setProgress(r.data || null)).catch(() => {}),
        ]).finally(() => setIsLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const checkin = async (taskId) => {
        setCheckingIn(taskId);
        try {
            await habitsAPI.checkin(taskId);
            toast.success('Habit checked in! 🔥');
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Already checked in today');
        } finally {
            setCheckingIn(null);
        }
    };

    const filtered = habits.filter(h => {
        if (filter === 'done') return !!h.checked_today;
        if (filter === 'pending') return !h.checked_today;
        return true;
    });

    const completionRate = progress && progress.active_habits > 0
        ? Math.round((progress.today_checkins / progress.active_habits) * 100)
        : 0;

    const stats = [
        { label: 'Done Today',  value: progress?.today_checkins ?? 0,           color: '#22c55e', Icon: HiOutlineCheck },
        { label: 'Active',      value: progress?.active_habits ?? habits.length,  color: '#6366f1', Icon: HiOutlineChartBar },
        { label: 'Best Streak', value: `${progress?.longest_streak ?? 0}d`,      color: '#ef4444', Icon: HiOutlineFire },
        { label: 'Completion',  value: `${completionRate}%`,                     color: '#3b82f6', Icon: HiOutlineTrendingUp },
    ];

    const filterTabs = [
        { id: 'all',     label: 'All',     count: habits.length },
        { id: 'pending', label: 'Pending', count: habits.filter(h => !h.checked_today).length },
        { id: 'done',    label: 'Done',    count: habits.filter(h =>  !!h.checked_today).length },
    ];

    return (
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
            <SEO title="Habits" description="Build consistency with daily habit tracking." />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{
                        fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700,
                        color: 'var(--text-primary)', letterSpacing: '-0.02em',
                    }}>Habits</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Build consistency through daily actions
                    </p>
                </div>
                <button
                    onClick={load}
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <HiOutlineRefresh style={{ width: '14px', height: '14px' }} />
                    {!isMobile && 'Refresh'}
                </button>
            </div>

            {/* Stats grid */}
            {!isLoading && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                    gap: isMobile ? '10px' : '12px',
                }}>
                    {stats.map(({ label, value, color, Icon }, idx) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.06 }}
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: '14px',
                                padding: isMobile ? '14px 10px' : '18px 14px',
                                textAlign: 'center',
                            }}
                        >
                            <Icon style={{ width: '17px', height: '17px', color, margin: '0 auto 8px', display: 'block' }} />
                            <p style={{
                                fontSize: isMobile ? '1.125rem' : '1.375rem',
                                fontWeight: 700, color,
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                letterSpacing: '-0.01em',
                            }}>{value}</p>
                            <p style={{
                                fontSize: '0.5625rem', fontWeight: 600, color: 'var(--text-dim)',
                                textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: '4px',
                            }}>{label}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Filter tabs */}
            {!isLoading && habits.length > 0 && (
                <div style={{ display: 'flex', gap: '6px' }}>
                    {filterTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 14px', borderRadius: '8px',
                                fontSize: '0.8125rem', fontWeight: 500,
                                fontFamily: 'inherit', cursor: 'pointer',
                                border: '1px solid',
                                borderColor: filter === tab.id ? 'var(--accent)' : 'var(--border)',
                                background: filter === tab.id ? 'var(--accent-glow)' : 'transparent',
                                color: filter === tab.id ? 'var(--accent-light)' : 'var(--text-secondary)',
                                transition: 'all 0.15s',
                            }}
                        >
                            {tab.label}
                            <span style={{
                                fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '50px',
                                background: filter === tab.id ? 'rgba(99,102,241,0.25)' : 'var(--bg-hover)',
                                color: filter === tab.id ? 'var(--accent-light)' : 'var(--text-muted)',
                            }}>{tab.count}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Habit list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: '82px', borderRadius: '14px' }} />
                    ))
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '64px 0' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>
                            {habits.length === 0 ? '🔄' : filter === 'pending' ? '✅' : '⏳'}
                        </div>
                        <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {habits.length === 0
                                ? 'No habits yet'
                                : filter === 'pending'
                                ? 'All habits done today!'
                                : 'None completed yet today'}
                        </p>
                        <p style={{
                            fontSize: '0.875rem', color: 'var(--text-dim)',
                            marginTop: '8px', maxWidth: '280px', margin: '8px auto 0', lineHeight: 1.5,
                        }}>
                            {habits.length === 0
                                ? 'Mark a task as recurring in the Tasks page to create a habit'
                                : filter === 'pending'
                                ? 'Great work — check back tomorrow to keep your streak going'
                                : 'Check in on your pending habits to keep your streak alive'}
                        </p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {filtered.map((habit, i) => {
                            const id = habit.id || habit.task_id;
                            return (
                                <motion.div
                                    key={id ?? i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ delay: i * 0.04, duration: 0.2 }}
                                >
                                    <HabitCard
                                        habit={habit}
                                        isMobile={isMobile}
                                        checkingIn={checkingIn}
                                        onCheckin={checkin}
                                    />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
