import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineExclamation, HiOutlineLightningBolt, HiOutlineTrendingUp, HiOutlineFire } from 'react-icons/hi';
import { analyticsAPI, scheduleAPI } from '../api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useResponsive from '../hooks/useResponsive';

const cardStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '16px', boxShadow: 'var(--shadow-sm)',
};

const StatCard = ({ icon: Icon, label, value, color, delay, isMobile }) => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
        style={{ ...cardStyle, padding: isMobile ? '16px' : '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '10px' : '16px' }}>
            <div style={{ width: isMobile ? '36px' : '42px', height: isMobile ? '36px' : '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}15` }}>
                <Icon style={{ width: '20px', height: '20px', color }} />
            </div>
        </div>
        <p style={{ fontSize: isMobile ? '1.25rem' : '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</p>
        <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    </motion.div>
);

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [trends, setTrends] = useState([]);
    const [risks, setRisks] = useState({ overdue: [], at_risk: [] });
    const { isMobile, isDesktop } = useResponsive();

    useEffect(() => {
        analyticsAPI.overview().then((r) => setStats(r.data)).catch(() => { });
        analyticsAPI.trends({ days: 14 }).then((r) => setTrends(r.data)).catch(() => { });
        scheduleAPI.risks().then((r) => setRisks(r.data)).catch(() => { });
    }, []);

    const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
    const badgeStyle = (bg, color) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '50px', fontSize: '0.6875rem', fontWeight: 600, background: bg, color });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '20px' : '32px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{greeting()} 👋</h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>Here's your productivity overview</p>
            </motion.div>

            {/* Stats Grid — 2 cols on mobile, 4 on desktop */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '16px' }}>
                <StatCard icon={HiOutlineCheckCircle} label="Completed" value={stats?.completed || 0} color="#22c55e" delay={0.05} isMobile={isMobile} />
                <StatCard icon={HiOutlineClock} label="In Progress" value={stats?.in_progress || 0} color="#eab308" delay={0.1} isMobile={isMobile} />
                <StatCard icon={HiOutlineExclamation} label="Overdue" value={stats?.overdue || 0} color="#ef4444" delay={0.15} isMobile={isMobile} />
                <StatCard icon={HiOutlineLightningBolt} label="Focus Today" value={`${stats?.today_focus_minutes || 0}m`} color="#7c3aed" delay={0.2} isMobile={isMobile} />
            </div>

            {/* Charts — stacked on mobile, side-by-side on desktop */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '2fr 1fr' : '1fr', gap: isMobile ? '16px' : '24px' }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    style={{ ...cardStyle, padding: isMobile ? '16px' : '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <HiOutlineTrendingUp style={{ width: '20px', height: '20px', color: 'var(--accent-light)' }} />
                            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>Trends</h2>
                        </div>
                        <span style={badgeStyle('var(--accent-glow)', 'var(--accent-light)')}>14 days</span>
                    </div>
                    <div style={{ height: isMobile ? '160px' : '200px' }}>
                        {trends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends}>
                                    <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity={0.2} /><stop offset="100%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient></defs>
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickFormatter={(d) => d.slice(5)} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 10, boxShadow: 'var(--shadow-md)' }} />
                                    <Area type="monotone" dataKey="completed" stroke="#7c3aed" fill="url(#areaGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>Complete tasks to see trends</div>}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    style={{ ...cardStyle, padding: isMobile ? '16px' : '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <HiOutlineFire style={{ width: '20px', height: '20px', color: 'var(--danger)' }} />
                        <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>Needs Attention</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {risks.overdue?.length === 0 && risks.at_risk?.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                <p style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🎉</p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>All clear!</p>
                            </div>
                        ) : (
                            <>
                                {risks.overdue?.slice(0, 3).map((t) => (
                                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', background: 'var(--danger-bg)' }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{t.title}</span>
                                        <span style={badgeStyle('var(--danger-bg)', 'var(--danger)')}>Overdue</span>
                                    </div>
                                ))}
                                {risks.at_risk?.slice(0, 3).map((t) => (
                                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', background: 'var(--warning-bg)' }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{t.title}</span>
                                        <span style={badgeStyle('var(--warning-bg)', 'var(--warning)')}>At risk</span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Completion */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                style={{ ...cardStyle, padding: isMobile ? '16px' : '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>Completion</h2>
                    <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent-light)' }}>{stats?.completion_rate || 0}%</span>
                </div>
                <div style={{ height: '10px', borderRadius: '50px', overflow: 'hidden', background: 'var(--bg-hover)' }}>
                    <motion.div style={{ height: '100%', borderRadius: '50px', background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }}
                        initial={{ width: 0 }} animate={{ width: `${stats?.completion_rate || 0}%` }} transition={{ duration: 1, delay: 0.5 }} />
                </div>
            </motion.div>
        </div>
    );
}
