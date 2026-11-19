import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatbot from '../chat/AIChatbot';
import {
    Flame,
    Activity,
    Layers,
    Clock,
    Zap,
    BarChart3,
    Settings,
    Menu,
    X,
    Search,
    Bell,
    ChevronRight,
    Target,
} from '../ui/Icons';
import useAuthStore from '../../stores/authStore';
import useUIStore from '../../stores/uiStore';

const NAV_ITEMS = [
    { label: 'Protocols', path: '/habits', icon: Flame, shortcut: 'H', activeBadge: 'LIVE' },
    { label: 'Dashboard', path: '/dashboard', icon: Layers, shortcut: 'D' },
    { label: 'Tasks', path: '/tasks', icon: Target, shortcut: 'T' },
    { label: 'Focus Sprint', path: '/focus', icon: Zap, shortcut: 'F' },
    { label: 'Telemetry', path: '/analytics', icon: BarChart3, shortcut: 'A' },
    { label: 'Config', path: '/settings', icon: Settings, shortcut: 'S' },
];

export default function TactileLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const [currentTime, setCurrentTime] = useState('');
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Precise Monospace UTC/Local Clock
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
            setCurrentTime(`${timeStr} LOCAL`);
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    // Global tactile keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'h' || e.key === 'H') {
                navigate('/habits');
            } else if (e.key === 'd' || e.key === 'D') {
                navigate('/dashboard');
            } else if (e.key === 't' || e.key === 'T') {
                navigate('/tasks');
            } else if (e.key === 'f' || e.key === 'F') {
                navigate('/focus');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-amber-500/20 selection:text-amber-200">
            {/* ─── DESKTOP TACTILE SIDEBAR ────────────────── */}
            <aside className="hidden md:flex flex-col w-64 border-r border-[#27272a] bg-[#0c0c0e] shrink-0 h-screen sticky top-0 z-40 select-none">
                {/* Brand Header */}
                <div className="h-16 border-b border-[#27272a] px-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded border border-amber-500/40 bg-amber-500/10 flex items-center justify-center text-amber-400 font-mono text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                            FS
                        </div>
                        <div className="flex flex-col">
                            <span className="font-heading font-bold text-sm tracking-tight text-white leading-none">
                                FLOWSTATE
                            </span>
                            <span className="font-mono text-[9px] tracking-widest text-zinc-500 uppercase mt-0.5">
                                v2.4 // GO-KERNEL
                            </span>
                        </div>
                    </div>
                    {/* Kernel Status Indicator */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#27272a] bg-[#141418]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-mono text-[10px] text-zinc-400 font-medium">SYS:OK</span>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    <div className="px-2 pb-2 text-[10px] font-mono tracking-wider text-zinc-600 uppercase font-semibold">
                        System Modules
                    </div>
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full group relative flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                                    isActive
                                        ? 'bg-[#18181c] text-white border border-[#3f3f46]'
                                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121215] border border-transparent'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebarActiveIndicator"
                                        className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-amber-400"
                                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                    />
                                )}
                                <div className="flex items-center gap-3">
                                    <Icon
                                        size={16}
                                        className={`transition-colors ${
                                            isActive
                                                ? 'text-amber-400'
                                                : 'text-zinc-500 group-hover:text-zinc-300'
                                        }`}
                                    />
                                    <span className="font-heading font-medium tracking-wide">
                                        {item.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.activeBadge && (
                                        <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                                            {item.activeBadge}
                                        </span>
                                    )}
                                    <span className="font-mono text-[10px] text-zinc-600 group-hover:text-zinc-400">
                                        [{item.shortcut}]
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </nav>

                {/* Sidebar Footer: Pinned Streak Telemetry */}
                <div className="p-3 border-t border-[#27272a] bg-[#0f0f13]">
                    <div className="p-3 rounded-md border border-[#27272a] bg-[#141418]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
                                STREAK VELOCITY
                            </span>
                            <span className="flex items-center gap-1 font-mono text-xs font-bold text-amber-400">
                                <Flame size={13} className="text-amber-400" />
                                19 DAYS
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-[#202026] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                                style={{ width: '85%' }}
                            />
                        </div>
                        <div className="flex justify-between items-center mt-2 text-[10px] font-mono text-zinc-500">
                            <span>Today: 80% Complete</span>
                            <span className="text-emerald-400">+14% vs 7d</span>
                        </div>
                    </div>

                    {/* Operator Profile Badge */}
                    <div className="mt-3 flex items-center justify-between px-2 pt-1 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded border border-zinc-700 bg-zinc-800 flex items-center justify-center font-mono text-[10px] text-zinc-300">
                                {user?.username?.substring(0, 2).toUpperCase() || 'OP'}
                            </div>
                            <span className="font-heading font-medium text-zinc-300 truncate max-w-[110px]">
                                {user?.username || 'Operator'}
                            </span>
                        </div>
                        <span className="font-mono text-[9px] text-emerald-500 uppercase">
                            ONLINE
                        </span>
                    </div>
                </div>
            </aside>

            {/* ─── MAIN CONTENT VIEWPORT ─────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Tactical Top Header */}
                <header
                    className={`h-16 border-b border-[#27272a] bg-[#0c0c0e]/90 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-all ${
                        isScrolled ? 'shadow-lg shadow-black/40' : ''
                    }`}
                >
                    {/* Mobile Navigation Trigger */}
                    <div className="flex items-center gap-3 md:hidden">
                        <button
                            onClick={() => setMobileNavOpen(true)}
                            className="p-2 rounded border border-[#27272a] bg-[#141418] text-zinc-300"
                        >
                            <Menu size={18} />
                        </button>
                        <span className="font-heading font-bold text-sm tracking-tight text-white">
                            FLOWSTATE
                        </span>
                    </div>

                    {/* System Telemetry & Status Badges */}
                    <div className="hidden md:flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded border border-[#27272a] bg-[#121215]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="font-mono text-[11px] text-zinc-300">
                                API ENGINE: <strong className="text-emerald-400 font-semibold">12ms (GO-GIN)</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded border border-[#27272a] bg-[#121215]">
                            <Clock size={13} className="text-zinc-500" />
                            <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                                {currentTime || 'SYNCING CLOCK...'}
                            </span>
                        </div>
                    </div>

                    {/* Header Controls */}
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => useUIStore.getState().toggleQuickCapture()}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded border border-[#27272a] bg-[#141418] hover:border-[#3f3f46] text-xs text-zinc-300 transition-colors"
                        >
                            <Search size={14} className="text-zinc-500" />
                            <span className="font-heading">Command Palette</span>
                            <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#202026] text-zinc-400 border border-[#2d2d34]">
                                Ctrl+K
                            </kbd>
                        </button>

                        <button
                            onClick={() => navigate('/habits')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-xs text-amber-300 font-heading font-medium transition-colors"
                        >
                            <Flame size={14} className="text-amber-400" />
                            <span>Protocol View</span>
                        </button>
                    </div>
                </header>

                {/* Mobile Drawer */}
                <AnimatePresence>
                    {mobileNavOpen && (
                        <div className="fixed inset-0 z-50 md:hidden flex">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setMobileNavOpen(false)}
                                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ x: -280 }}
                                animate={{ x: 0 }}
                                exit={{ x: -280 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="relative w-72 bg-[#0c0c0e] border-r border-[#27272a] p-5 flex flex-col z-10"
                            >
                                <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded border border-amber-500/40 bg-amber-500/10 flex items-center justify-center text-amber-400 font-mono text-xs font-bold">
                                            FS
                                        </div>
                                        <span className="font-heading font-bold text-sm text-white">
                                            FLOWSTATE
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setMobileNavOpen(false)}
                                        className="p-1 rounded text-zinc-400 hover:text-white"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="mt-4 space-y-1.5 flex-1">
                                    {NAV_ITEMS.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname.startsWith(item.path);
                                        return (
                                            <button
                                                key={item.path}
                                                onClick={() => {
                                                    navigate(item.path);
                                                    setMobileNavOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-sm ${
                                                    isActive
                                                        ? 'bg-[#18181c] text-white border border-[#3f3f46]'
                                                        : 'text-zinc-400'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon size={16} />
                                                    <span className="font-heading">{item.label}</span>
                                                </div>
                                                <span className="font-mono text-xs text-zinc-600">
                                                    [{item.shortcut}]
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Sub-viewport / Route Area */}
                <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
            <AIChatbot />
        </div>
    );
}
