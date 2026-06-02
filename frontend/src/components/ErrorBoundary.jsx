import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--bg-primary)', padding: '24px', textAlign: 'center',
                }}>
                    <div>
                        <p style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</p>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Something went wrong
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px' }}>
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '10px 24px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                color: 'white', border: 'none', borderRadius: '10px',
                                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
