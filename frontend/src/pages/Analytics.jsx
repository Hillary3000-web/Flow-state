import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineChartBar, HiOutlineTrendingUp } from 'react-icons/hi';
import { analyticsAPI } from '../api';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import useResponsive from '../hooks/useResponsive';
import SEO from '../components/SEO';

const CHART_COLORS = ['#6366f1', '#a5b4fc', '#f472b6', '#22c55e', '#eab308', '#ef4444'];
const PRIORITY_COLORS = { P1: '#ef4444', P2: '#eab308', P3: '#6366f1', P4: '#71717a' };

const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' };
const tooltipStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 10, boxShadow: 'var(--shadow-md)' };

export default function Analytics() {
    const [overview, setOverview] = useState(null);
    const [trends, setTrends] = useState([]);
    const [burndown, setBurndown] = useState([]);
    const [allocation, setAllocation] = useState({ by_energy: [], by_priority: [] });
    const [isLoading, setIsLoading] = useState(true);
    const { isMobile } = useResponsive();

    useEffect(() => {
        Promise.all([
            analyticsAPI.overview().then(r => setOverview(r.data)).catch(() => { }),
            analyticsAPI.trends({ days: 30 }).then(r => setTrends(r.data)).catch(() => { }),
            analyticsAPI.burndown({ days: 30 }).then(r => setBurndown(r.data)).catch(() => { }),
            analyticsAPI.timeAllocation().then(r => setAllocation(r.data)).catch(() => { }),
        ]).finally(() => setIsLoading(false));
    }, []);

    const statCards = [
        { label: 'Total Tasks', value: overview?.total_tasks || 0 },
        { label: 'Completed', value: overview?.completed || 0 },
        { label: 'Rate', value: `${overview?.completion_rate || 0}%` },
        { label: 'Focus Today', value: `${overview?.today_focus_minutes || 0}m` },
    ];

    const emptyChart = (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
            No data yet
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
            <SEO title="Analytics" description="Understand your productivity patterns." />

            <div>
                <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Analytics</h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>Understand your productivity patterns</p>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '16px' }}>
                {statCards.map(({ label, value }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ ...cardStyle, padding: isMobile ? '14px' : '24px' }}>
                        {isLoading ? (
                            <div style={{ height: '40px', borderRadius: '8px', background: 'var(--bg-hover)', animation: 'pulse 1.5s infinite' }} />
                        ) : (
                            <>
                                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                                <p style={{ fontSize: isMobile ? '1.125rem' : '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>{value}</p>
                            </>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Charts grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '24px' }}>

                {/* Completion trends bar chart */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    style={{ ...cardStyle, padding: isMobile ? '16px' : '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <HiOutlineTrendingUp style={{ width: '18px', height: '18px', color: 'var(--accent-light)' }} />
                        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Completion Trends</h2>
                    </div>
                    <div style={{ height: isMobile ? '180px' : '220px' }}>
                        {trends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickFormatter={d => d.slice(8)} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : emptyChart}
                    </div>
                </motion.div>

                {/* Burndown chart */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    style={{ ...cardStyle, padding: isMobile ? '16px' : '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <HiOutlineChartBar style={{ width: '18px', height: '18px', color: '#22c55e' }} />
                        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Burn-down</h2>
                    </div>
                    <div style={{ height: isMobile ? '180px' : '220px' }}>
                        {burndown.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={burndown}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickFormatter={d => d.slice(8)} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Area type="monotone" dataKey="remaining" stroke="#ef4444" fill="rgba(239,68,68,0.08)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="rgba(34,197,94,0.08)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : emptyChart}
                    </div>
                </motion.div>

                {/* Energy distribution pie */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    style={{ ...cardStyle, padding: isMobile ? '16px' : '24px' }}>
                    <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Energy Distribution</h2>
                    <div style={{ height: isMobile ? '180px' : '220px' }}>
                        {allocation.by_energy?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={allocation.by_energy} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                                        dataKey="count" nameKey="energy_level"
                                        label={{ fontSize: 10, fill: 'var(--text-muted)' }}>
                                        {allocation.by_energy.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : emptyChart}
                    </div>
                </motion.div>

                {/* Priority breakdown bar chart */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    style={{ ...cardStyle, padding: isMobile ? '16px' : '24px' }}>
                    <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Priority Breakdown</h2>
                    <div style={{ height: isMobile ? '180px' : '220px' }}>
                        {allocation.by_priority?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={allocation.by_priority} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
                                    <YAxis dataKey="priority" type="category" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={35} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                        {allocation.by_priority.map((entry, i) => (
                                            <Cell key={i} fill={PRIORITY_COLORS[entry.priority] || CHART_COLORS[i]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : emptyChart}
                    </div>
                </motion.div>
            </div>

            <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }`}</style>
        </div>
    );
}
