import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signIn } from '../firebase';

const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { error: err } = await signIn(email, password);
            setLoading(false);
            if (err) { setError(err.message); return; }
            const redirect = searchParams.get('redirect') || '/dashboard';
            navigate(redirect);
        } catch (networkErr) {
            setLoading(false);
            if (networkErr.message?.includes('fetch') || networkErr.message?.includes('network')) {
                setError('Cannot reach the server. Check your connection and try again.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        }
    };

    return (
        <div className="min-h-screen hp-page hp-grain flex items-center justify-center px-4">
            <div className="w-full max-w-[400px]">
                {/* Logo */}
                <Link to="/" className="flex flex-col items-center gap-3 mb-10 group" style={{ color: 'var(--hp-text)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="transition-transform duration-300 group-hover:rotate-6">
                        <path d="M4 10L12 4L20 10" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                        <rect x="4" y="10" width="16" height="11" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
                        <rect x="9.5" y="15" width="5" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                    <span className="hp-serif text-[22px]">House Planner</span>
                </Link>

                {/* Card */}
                <div className="rounded-xl p-8" style={{ background: 'var(--hp-card)', border: '1px solid var(--hp-border)' }}>
                    <h2 className="text-[18px] font-semibold mb-1" style={{ color: 'var(--hp-text)' }}>Welcome back</h2>
                    <p className="text-[13px] mb-7" style={{ color: 'var(--hp-muted)' }}>Sign in to continue to your projects</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="text-[13px] px-4 py-2.5 rounded-lg"
                                style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: 'var(--hp-red)' }}>
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--hp-muted)' }}>Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                placeholder="you@example.com" className="hp-input" />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--hp-muted)' }}>Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" className="hp-input" />
                        </div>

                        <button type="submit" disabled={loading} className="hp-btn hp-btn-accent w-full h-11 text-[13px] mt-2">
                            {loading ? 'Signing in\u2026' : 'Sign in'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[13px] mt-7" style={{ color: 'var(--hp-muted)' }}>
                    Don&apos;t have an account?{' '}
                    <Link to="/signup" className="font-medium transition-colors duration-300" style={{ color: 'var(--hp-accent)' }}>
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
