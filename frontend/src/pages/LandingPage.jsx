import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import {
    FiCheckCircle, FiTarget, FiClock, FiBarChart2,
    FiMessageSquare, FiZap, FiArrowRight
} from 'react-icons/fi';
import './LandingPage.css';

function StarField() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationId;
        let stars = [];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function createStars() {
            stars = [];
            const count = Math.floor((canvas.width * canvas.height) / 3000);
            for (let i = 0; i < count; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 0.5,
                    speed: Math.random() * 0.5 + 0.1,
                    opacity: Math.random() * 0.8 + 0.2,
                    twinkleSpeed: Math.random() * 0.02 + 0.005,
                    twinklePhase: Math.random() * Math.PI * 2,
                });
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            stars.forEach((star) => {
                star.y -= star.speed;
                star.twinklePhase += star.twinkleSpeed;

                if (star.y < -5) {
                    star.y = canvas.height + 5;
                    star.x = Math.random() * canvas.width;
                }

                const twinkle = (Math.sin(star.twinklePhase) + 1) / 2;
                const alpha = star.opacity * (0.4 + twinkle * 0.6);

                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.fill();

                // Add a subtle glow to bigger stars
                if (star.size > 1.3) {
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(139, 92, 246, ${alpha * 0.15})`;
                    ctx.fill();
                }
            });

            animationId = requestAnimationFrame(animate);
        }

        resize();
        createStars();
        animate();

        window.addEventListener('resize', () => {
            resize();
            createStars();
        });

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="star-canvas" />;
}

const features = [
    { icon: FiCheckCircle, title: 'Smart Tasks', desc: 'Priority levels, energy tagging, and quick capture with ⌘K' },
    { icon: FiClock, title: 'Focus Mode', desc: 'Pomodoro timer with distraction logging and session stats' },
    { icon: FiTarget, title: 'Goal Tracking', desc: 'Set objectives, track progress, and link projects' },
    { icon: FiBarChart2, title: 'Analytics', desc: 'Trends, burn-down charts, and productivity insights' },
    { icon: FiMessageSquare, title: 'AI Assistant', desc: 'Groq-powered chatbot for personalized productivity advice' },
    { icon: FiZap, title: 'Time Blocking', desc: 'Visual daily schedule with deep work and break blocks' },
];

export default function LandingPage() {
    return (
        <div className="landing-page">
            <SEO
                title="Execute with Consistency"
                description="FlowState is the all-in-one productivity platform for students and founders. Combine tasks, habits, and focus timers to build a better workflow."
                keywords="productivity, tasks, focus timer, pomodoro, habits, flow state, daily planner"
            />
            <StarField />

            {/* ─── Navbar ─── */}
            <motion.nav
                className="landing-nav"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
            >
                <div className="landing-nav-inner">
                    <div className="landing-logo">
                        <div className="landing-logo-icon">⚡</div>
                        <span>FlowState</span>
                    </div>
                    <div className="landing-nav-buttons">
                        <Link to="/login" className="landing-btn-ghost">Log in</Link>
                        <Link to="/register" className="landing-btn-primary">
                            Get Started <FiArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </motion.nav>

            {/* ─── Hero Section ─── */}
            <section className="landing-hero">
                <motion.div
                    className="landing-hero-content"
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <div className="landing-badge">
                        <FiZap size={14} />
                        <span>Productivity, Reimagined</span>
                    </div>

                    <h1 className="landing-title">
                        Execute with <br />
                        <span className="landing-title-accent">Consistency</span>
                    </h1>

                    <p className="landing-subtitle">
                        The all-in-one productivity platform that combines smart tasks, focus sessions,
                        goal tracking, analytics, and an AI assistant — designed for students, developers,
                        and founders who want to build habits that stick.
                    </p>

                    <div className="landing-hero-cta">
                        <Link to="/register" className="landing-cta-primary">
                            Start for Free
                            <FiArrowRight size={18} />
                        </Link>
                        <Link to="/login" className="landing-cta-secondary">
                            I have an account
                        </Link>
                    </div>

                    <div className="landing-stats">
                        <div className="landing-stat">
                            <span className="landing-stat-number">6+</span>
                            <span className="landing-stat-label">Core Features</span>
                        </div>
                        <div className="landing-stat-divider" />
                        <div className="landing-stat">
                            <span className="landing-stat-number">AI</span>
                            <span className="landing-stat-label">Powered</span>
                        </div>
                        <div className="landing-stat-divider" />
                        <div className="landing-stat">
                            <span className="landing-stat-number">100%</span>
                            <span className="landing-stat-label">Free</span>
                        </div>
                    </div>

                    {/* Trust Signals */}
                    <div style={{ marginTop: '48px', opacity: 0.7 }}>
                        <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a', marginBottom: '16px' }}>Trusted by productivity enthusiasts at</p>
                        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', alignItems: 'center', filter: 'grayscale(100%) opacity(0.6)' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>ACME</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Globex</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Soylent</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Initech</span>
                        </div>
                    </div>
                </motion.div>

                {/* Floating orbs */}
                <div className="landing-orb landing-orb-1" />
                <div className="landing-orb landing-orb-2" />
                <div className="landing-orb landing-orb-3" />
            </section>

            {/* ─── Features Section ─── */}
            <section className="landing-features">
                <motion.div
                    className="landing-features-header"
                    initial={{ y: 30, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2>Everything you need to <span className="landing-title-accent">stay focused</span></h2>
                    <p>A complete toolkit designed to help you plan, execute, and reflect on your work.</p>
                </motion.div>

                <div className="landing-features-grid">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            className="landing-feature-card"
                            initial={{ y: 30, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        >
                            <div className="landing-feature-icon">
                                <feature.icon size={24} />
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── CTA Section ─── */}
            <section className="landing-cta-section">
                <motion.div
                    className="landing-cta-card"
                    initial={{ y: 30, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2>Ready to level up your productivity?</h2>
                    <p>Join FlowState and start building habits that stick. No credit card required.</p>
                    <Link to="/register" className="landing-cta-primary">
                        Get Started for Free
                        <FiArrowRight size={18} />
                    </Link>
                </motion.div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="landing-footer">
                <div className="landing-footer-inner">
                    <div className="landing-logo">
                        <div className="landing-logo-icon">⚡</div>
                        <span>FlowState</span>
                    </div>
                    <p>Built with ❤️ for productivity enthusiasts</p>
                </div>
            </footer>
        </div>
    );
}
