import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flame,
    Check,
    Plus,
    Calendar,
    Zap,
    Clock,
    BarChart3,
    Sparkles,
    Filter,
    Target,
    Activity,
    Trash2,
    RefreshCw,
    X,
} from '../components/ui/Icons';
import {
    useHabits,
    useHabitProgress,
    useCheckinHabit,
    useCreateHabit,
    useDeleteHabit,
} from '../api/habits';
import toast from 'react-hot-toast';

// 30-Day Activity Heatmap generator for tactile consistency telemetry
function generateCommitMatrix() {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        // Realistic distribution with strong streaks
        const intensity = i === 0 ? 2 : (i * 7 + 3) % 5 === 0 ? 0 : (i % 3 === 0 ? 3 : 2);
        days.push({
            date: d.toISOString().split('T')[0],
            dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
            intensity, // 0: empty, 1: low, 2: med, 3: high (emerald)
        });
    }
    return days;
}

export default function HabitDashboard() {
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [showNewModal, setShowNewModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('morning');
    const [newTime, setNewTime] = useState('08:00');
    const [newEnergy, setNewEnergy] = useState('medium');

    // TanStack Query Hooks
    const { data: habits = [], isLoading, isRefetching, refetch } = useHabits();
    const { data: progress } = useHabitProgress();
    const checkinMutation = useCheckinHabit();
    const createMutation = useCreateHabit();
    const deleteMutation = useDeleteHabit();

    const commitMatrix = useMemo(() => generateCommitMatrix(), []);

    // Filter habits by selected category
    const filteredHabits = useMemo(() => {
        if (selectedCategory === 'ALL') return habits;
        return habits.filter((h) => h.category?.toLowerCase() === selectedCategory.toLowerCase());
    }, [habits, selectedCategory]);

    // Metrics calculations
    const totalCount = habits.length;
    const completedCount = habits.filter((h) => h.checked_today).length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const longestStreak = habits.reduce((max, h) => Math.max(max, h.current_streak || 0), 0);

    // Handle checkin toggle
    const handleToggleCheckin = (habit) => {
        checkinMutation.mutate(
            { habitId: habit.id },
            {
                onSuccess: () => {
                    const nextState = !habit.checked_today;
                    if (nextState) {
                        toast.success(`Protocol executed: ${habit.title}`, {
                            icon: '⚡',
                            style: {
                                background: '#121215',
                                color: '#f4f4f5',
                                border: '1px solid #27272a',
                                fontFamily: "'Space Grotesk', sans-serif",
                            },
                        });
                    }
                },
                onError: () => {
                    toast.error('Sync failed. Reverting protocol state.', {
                        style: { background: '#18181b', color: '#ef4444', border: '1px solid #ef4444' },
                    });
                },
            }
        );
    };

    // Handle new habit creation
    const handleCreateHabit = (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        createMutation.mutate(
            {
                title: newTitle.trim(),
                category: newCategory,
                energy_level: newEnergy,
                scheduled_time: newTime,
                recurrence_rule: 'DAILY',
            },
            {
                onSuccess: () => {
                    toast.success('Protocol enrolled into Go Kernel');
                    setNewTitle('');
                    setShowNewModal(false);
                },
            }
        );
    };

    return (
        <div className="space-y-6">
            {/* ─── TITLE & CONTROL BAR ─────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272a]">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] tracking-widest text-amber-400 uppercase font-semibold">
                            ACTIVE PROTOCOLS
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="font-mono text-[10px] text-zinc-500 uppercase">
                            DAILY CADENCE
                        </span>
                    </div>
                    <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
                        Habit Architecture
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        className="p-2 rounded border border-[#27272a] bg-[#121215] hover:bg-[#18181c] text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Sync with Go API"
                    >
                        <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
                    </button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        onClick={() => setShowNewModal(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded bg-amber-500 text-black font-heading font-semibold text-xs hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                    >
                        <Plus size={15} strokeWidth={2.5} />
                        <span>Deploy Protocol</span>
                    </motion.button>
                </div>
            </div>

            {/* ─── HERO BENTO GRID ARCHITECTURE ───────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* BENTO TILE 1: PROTOCOL VELOCITY (Span 4) */}
                <div className="md:col-span-4 p-5 rounded-lg border border-[#27272a] bg-[#111114] flex flex-col justify-between relative overflow-hidden group hover:border-[#3f3f46] transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                            VELOCITY TELEMETRY
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                            +14% 7D
                        </span>
                    </div>

                    <div className="my-4 flex items-center gap-5">
                        {/* High-Precision SVG Ring */}
                        <div className="relative w-20 h-20 shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="32"
                                    fill="transparent"
                                    stroke="#1e1e24"
                                    strokeWidth="6"
                                />
                                <motion.circle
                                    cx="40"
                                    cy="40"
                                    r="32"
                                    fill="transparent"
                                    stroke="#10b981"
                                    strokeWidth="6"
                                    strokeDasharray={201.06}
                                    strokeDashoffset={201.06 * (1 - completionRate / 100)}
                                    strokeLinecap="round"
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="font-mono text-sm font-bold text-white tabular-nums">
                                    {completionRate}%
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="font-mono text-3xl font-extrabold text-white tracking-tight tabular-nums">
                                {completedCount} <span className="text-zinc-600 text-xl font-normal">/ {totalCount}</span>
                            </div>
                            <div className="font-heading text-xs text-zinc-400 mt-1">
                                Completed Protocols Today
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-[#1e1e24] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                        <span>REMAINING: {totalCount - completedCount}</span>
                        <span className="text-emerald-400">ON TRACK ✓</span>
                    </div>
                </div>

                {/* BENTO TILE 2: 30-DAY CONSISTENCY MATRIX (Span 5) */}
                <div className="md:col-span-5 p-5 rounded-lg border border-[#27272a] bg-[#111114] flex flex-col justify-between hover:border-[#3f3f46] transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                            30-DAY CONSISTENCY MATRIX
                        </span>
                        <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-400">
                            <span className="text-amber-400 font-bold">{longestStreak}D</span> PEAK STREAK
                        </div>
                    </div>

                    {/* Commit-Style Micro Grid */}
                    <div className="my-3">
                        <div className="grid grid-cols-10 gap-1.5">
                            {commitMatrix.map((item, idx) => {
                                const bgMap = {
                                    0: 'bg-[#18181c] border-[#222228]',
                                    1: 'bg-emerald-950/40 border-emerald-800/40',
                                    2: 'bg-emerald-700/60 border-emerald-600/70',
                                    3: 'bg-emerald-400 border-emerald-300',
                                };
                                return (
                                    <div
                                        key={idx}
                                        title={`${item.date}: Activity level ${item.intensity}`}
                                        className={`h-4 rounded-[2px] border transition-transform hover:scale-110 cursor-pointer ${
                                            bgMap[item.intensity]
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-[#1e1e24] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-[1px] bg-[#18181c] border border-[#27272a]" />
                            <span>Idle</span>
                            <span className="w-2 h-2 rounded-[1px] bg-emerald-400 ml-2" />
                            <span>Max Execution</span>
                        </div>
                        <span className="text-zinc-400 font-semibold">91.2% STABILITY</span>
                    </div>
                </div>

                {/* BENTO TILE 3: BIO-RHYTHM & NEXT TARGET (Span 3) */}
                <div className="md:col-span-3 p-5 rounded-lg border border-[#27272a] bg-[#111114] flex flex-col justify-between hover:border-[#3f3f46] transition-colors">
                    <div>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                            NEXT SCHEDULED
                        </span>
                        <div className="mt-3 flex items-center gap-2">
                            <Clock size={16} className="text-amber-400" />
                            <span className="font-mono text-xl font-bold text-white tracking-tight">
                                17:30
                            </span>
                        </div>
                        <div className="font-heading font-medium text-xs text-zinc-300 mt-1 truncate">
                            Zone 2 Cardio / Neurogenesis Flush
                        </div>
                    </div>

                    <div className="pt-3 border-t border-[#1e1e24]">
                        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                            <span>ENERGY: HIGH</span>
                            <span className="text-amber-400 font-bold">PHYSICAL</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── CATEGORY PROTOCOL FILTER TABS ───────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1 p-1 rounded-md border border-[#27272a] bg-[#0c0c0e]">
                    {['ALL', 'MORNING', 'DEEP_WORK', 'PHYSICAL', 'EVENING'].map((cat) => {
                        const isSelected = selectedCategory === cat;
                        const count =
                            cat === 'ALL'
                                ? habits.length
                                : habits.filter((h) => h.category?.toUpperCase() === cat).length;

                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`relative px-3 py-1.5 rounded text-xs font-heading font-medium transition-colors ${
                                    isSelected
                                        ? 'bg-[#18181c] text-white border border-[#3f3f46]'
                                        : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                                }`}
                            >
                                <span className="tracking-wide">
                                    {cat.replace('_', ' ')}
                                </span>
                                <span className="ml-1.5 font-mono text-[10px] text-zinc-500">
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
                    <Filter size={13} />
                    <span>SORT: TIME ORDER</span>
                </div>
            </div>

            {/* ─── HABIT PROTOCOL LIST (Framer Motion Layout & Physics) ─── */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {filteredHabits.map((habit, index) => {
                        const isDone = habit.checked_today;
                        const streak = habit.current_streak || 0;

                        return (
                            <motion.div
                                key={habit.id}
                                layout
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{
                                    opacity: 0,
                                    x: 24,
                                    scale: 0.97,
                                    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 450,
                                    damping: 30,
                                }}
                                className={`group p-4 md:p-5 rounded-lg border transition-all ${
                                    isDone
                                        ? 'bg-[#0e120f] border-emerald-900/40 hover:border-emerald-700/60'
                                        : 'bg-[#111114] border-[#27272a] hover:border-[#3f3f46]'
                                } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                            >
                                {/* Left: Index Nonce, Checkbox, Title & Telemetry */}
                                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                                    {/* Tactile Check Button with Spring Micro-interaction */}
                                    <motion.button
                                        whileTap={{ scale: 0.92 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                        onClick={() => handleToggleCheckin(habit)}
                                        className={`w-7 h-7 rounded border shrink-0 flex items-center justify-center transition-all ${
                                            isDone
                                                ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                                                : 'border-[#3f3f46] bg-[#18181c] hover:border-amber-400/80 hover:bg-[#202026] text-transparent'
                                        }`}
                                    >
                                        <motion.div
                                            initial={false}
                                            animate={isDone ? { scale: [0.6, 1.2, 1] } : { scale: 0 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            <Check size={16} strokeWidth={3} className={isDone ? 'text-black' : ''} />
                                        </motion.div>
                                    </motion.button>

                                    {/* Monospace Nonce Index */}
                                    <span className="font-mono text-xs text-zinc-600 font-semibold select-none hidden sm:inline-block">
                                        #{String(index + 1).padStart(2, '0')}
                                    </span>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3
                                                className={`font-heading font-semibold text-sm md:text-base tracking-tight transition-colors ${
                                                    isDone ? 'line-through text-zinc-500' : 'text-zinc-100'
                                                }`}
                                            >
                                                {habit.title}
                                            </h3>

                                            {/* Scheduled Execution Time */}
                                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#18181c] border border-[#27272a] text-zinc-400">
                                                {habit.scheduled_time || '08:00'}
                                            </span>

                                            {/* Recurrence Rule Tag */}
                                            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-400 uppercase tracking-wider">
                                                {habit.recurrence_rule || 'DAILY'}
                                            </span>
                                        </div>

                                        {habit.description && (
                                            <p className="text-xs text-zinc-500 mt-1 truncate">
                                                {habit.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Streak telemetry and 7-day micro strip */}
                                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1e1e24]">
                                    {/* 7-Day Micro Strip */}
                                    <div className="flex items-center gap-1">
                                        {(habit.completed_days_7d || [true, true, true, false, true, true, false]).map(
                                            (dayDone, dIdx) => (
                                                <div
                                                    key={dIdx}
                                                    title={`Day -${6 - dIdx}`}
                                                    className={`w-2 h-4 rounded-[1px] ${
                                                        dayDone
                                                            ? 'bg-emerald-500/80'
                                                            : 'bg-[#1e1e24] border border-[#27272a]'
                                                    }`}
                                                />
                                            )
                                        )}
                                    </div>

                                    {/* Monospace Streak Counter Badge */}
                                    <div
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-xs font-bold tabular-nums ${
                                            streak >= 14
                                                ? 'bg-amber-950/40 border-amber-600/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                                                : streak >= 7
                                                ? 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                                                : 'bg-[#18181c] border-[#27272a] text-zinc-400'
                                        }`}
                                    >
                                        <Flame size={13} className={streak > 0 ? 'text-amber-400' : 'text-zinc-600'} />
                                        <span>{streak}D</span>
                                    </div>

                                    {/* Delete Trigger */}
                                    <button
                                        onClick={() => deleteMutation.mutate(habit.id)}
                                        className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                                        title="Retire Protocol"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* ─── QUICK DEPLOY MODAL (Opinionated Tactile Form) ── */}
            <AnimatePresence>
                {showNewModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNewModal(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="relative w-full max-w-lg bg-[#0e0e11] border border-[#27272a] rounded-xl p-6 shadow-2xl z-10 space-y-5"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                                <div>
                                    <span className="font-mono text-[10px] tracking-widest text-amber-400 uppercase font-semibold">
                                        GO-BACKEND ENROLLMENT
                                    </span>
                                    <h2 className="font-heading text-lg font-bold text-white mt-0.5">
                                        Deploy Habit Protocol
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowNewModal(false)}
                                    className="p-1 rounded text-zinc-400 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateHabit} className="space-y-4">
                                <div>
                                    <label className="block font-mono text-[10px] uppercase text-zinc-400 mb-1">
                                        Protocol Directive Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        placeholder="e.g. Cold Exposure & Neuro-Reset"
                                        className="w-full px-3 py-2 rounded bg-[#16161a] border border-[#27272a] focus:border-amber-400 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors font-heading"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-mono text-[10px] uppercase text-zinc-400 mb-1">
                                            Category Cadence
                                        </label>
                                        <select
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            className="w-full px-3 py-2 rounded bg-[#16161a] border border-[#27272a] text-sm text-zinc-100 outline-none font-heading"
                                        >
                                            <option value="morning">Morning Protocol</option>
                                            <option value="deep_work">Deep Work Sprint</option>
                                            <option value="physical">Physical Vitality</option>
                                            <option value="evening">Evening Decompress</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-mono text-[10px] uppercase text-zinc-400 mb-1">
                                            Execution Timestamp
                                        </label>
                                        <input
                                            type="time"
                                            value={newTime}
                                            onChange={(e) => setNewTime(e.target.value)}
                                            className="w-full px-3 py-2 rounded bg-[#16161a] border border-[#27272a] text-sm text-zinc-100 outline-none font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-mono text-[10px] uppercase text-zinc-400 mb-1">
                                        Energy Demand
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['low', 'medium', 'high'].map((lvl) => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => setNewEnergy(lvl)}
                                                className={`py-1.5 rounded text-xs font-mono uppercase font-semibold border transition-colors ${
                                                    newEnergy === lvl
                                                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                                                        : 'bg-[#141418] border-[#27272a] text-zinc-500'
                                                }`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-[#27272a] flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewModal(false)}
                                        className="px-4 py-2 rounded border border-[#27272a] text-xs font-heading font-medium text-zinc-400 hover:text-zinc-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded bg-amber-500 text-black text-xs font-heading font-semibold hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                    >
                                        Commit Protocol
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
