import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineChartBar, HiOutlineTrendingUp } from 'react-icons/hi';
import { analyticsAPI } from '../api';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import useResponsive from '../hooks/useResponsive';

const COLORS = ['#7c3aed', '#a78bfa', '#f472b6', '#22c55e', '#eab308', '#ef4444'];
const cs = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' };
const tt = { background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 10, boxShadow: 'var(--shadow-md)' };

export default function Analytics() {
    const [ov, setOv] = useState(null);
    const [tr, setTr] = useState([]);
    const [bd, setBd] = useState([]);
    const [al, setAl] = useState({ by_energy: [], by_priority: [] });
    const { isMobile } = useResponsive();

    useEffect(() => {
        analyticsAPI.overview().then(r => setOv(r.data)).catch(() => { });
        analyticsAPI.trends({ days: 30 }).then(r => setTr(r.data)).catch(() => { });
        analyticsAPI.burndown({ days: 30 }).then(r => setBd(r.data)).catch(() => { });
        analyticsAPI.timeAllocation().then(r => setAl(r.data)).catch(() => { });
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
            <div>
                <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Analytics</h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>Productivity patterns</p>
            </div>

            {/* Stats — 2 cols mobile, 4 desktop */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '16px' }}>
                {[
                    { l: 'Total Tasks', v: ov?.total_tasks || 0 },
                    { l: 'Completed', v: ov?.completed || 0 },
                    { l: 'Rate', v: `${ov?.completion_rate || 0}%` },
                    { l: 'Focus', v: `${ov?.today_focus_minutes || 0}m` },
                ].map(({ l, v }, i) => (
                    <motion.div key={l} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ ...cs, padding: isMobile ? '14px' : '24px' }}>
                        <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</p>
                        <p style={{ fontSize: isMobile ? '1.125rem' : '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>{v}</p>
                    </motion.div>
                ))}
            </div>

            {/* Charts — 1 col mobile, 2 col desktop */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '24px' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    style={{ ...cs, padding: isMobile ? '16px' : '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <HiOutlineTrendingUp style={{ width: '18px', height: '18px', color: 'var(--accent-light)' }} />
                        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Completion Trends</h2>
                    </div>
                    <div style={{ height: isMobile ? '180px' : '220px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={tr}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickFormatter={d => d.slice(8)} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tt} /><Bar dataKey="completed" fill="#7c3aed" radius={[4, 4, 0, 0]} /></BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    style={{ ...cs, padding: isMobile ? '16px' : '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <HiOutlineChartBar style={{ width: '18px', height: '18px', color: '#22c55e' }} />
                        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Burn-down</h2>
                    </div>
                    <div style={{ height: isMobile ? '180px' : '220px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={bd}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickFormatter={d => d.slice(8)} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tt} /><Area type="monotone" dataKey="remaining" stroke="#ef4444" fill="rgba(239,68,68,0.08)" strokeWidth={2} /><Area type="monotone" dataKey="completed" stroke="#22c55e" fill="rgba(34,197,94,0.08)" strokeWidth={2} /></AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    style={{ ...cs, padding: isMobile ? '16px' : '24px' }}>
                    <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Energy Distribution</h2>
                    <div style={{ height: isMobile ? '180px' : '220px' }}>
                        {al.by_energy?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={al.by_energy} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="count" nameKey="energy_level" label={{ fontSize: 10, fill: 'var(--text-muted)' }}>{al.by_energy.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={tt} /></PieChart></ResponsiveContainer>
                        ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>No data yet</div>}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    style={{ ...cs, padding: isMobile ? '16px' : '24px' }}>
                    <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Priority Breakdown</h2>
                    <div style={{ height: isMobile ? '180px' : '220px' }}>
                        {al.by_priority?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%"><BarChart data={al.by_priority} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} /><YAxis dataKey="priority" type="category" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={35} axisLine={false} tickLine={false} /><Tooltip contentStyle={tt} /><Bar dataKey="count" radius={[0, 4, 4, 0]}>{al.by_priority.map((e, i) => { const c = { P1: '#ef4444', P2: '#eab308', P3: '#7c3aed', P4: '#71717a' }; return <Cell key={i} fill={c[e.priority] || COLORS[i]} />; })}</Bar></BarChart></ResponsiveContainer>
                        ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>No data yet</div>}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
