import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signUp } from '../firebase';

const SignupPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }

        setLoading(true);
        try {
            const { error: err } = await signUp(email, password, fullName);
            setLoading(false);
            if (err) { setError(err.message); return; }
            setSuccess('Account created! Redirecting\u2026');
            const redirect = searchParams.get('redirect') || '/dashboard';
            setTimeout(() => navigate(redirect), 1500);
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
        <div className="min-h-screen hp-page hp-grain flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-[420px]">
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
                    <h2 className="text-[18px] font-semibold mb-1" style={{ color: 'var(--hp-text)' }}>Create your account</h2>
                    <p className="text-[13px] mb-7" style={{ color: 'var(--hp-muted)' }}>Start designing floor plans in minutes</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="text-[13px] px-4 py-2.5 rounded-lg"
                                style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: 'var(--hp-red)' }}>
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="text-[13px] px-4 py-2.5 rounded-lg"
                                style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', color: 'var(--hp-green)' }}>
                                {success}
                            </div>
                        )}

                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--hp-muted)' }}>Full Name</label>
                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                                placeholder="Jane Doe" className="hp-input" />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--hp-muted)' }}>Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                placeholder="you@example.com" className="hp-input" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--hp-muted)' }}>Password</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                    placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" className="hp-input" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--hp-muted)' }}>Confirm</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                                    placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" className="hp-input" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="hp-btn hp-btn-accent w-full h-11 text-[13px] mt-2">
                            {loading ? 'Creating account\u2026' : 'Create account'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[13px] mt-7" style={{ color: 'var(--hp-muted)' }}>
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium transition-colors duration-300" style={{ color: 'var(--hp-accent)' }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;
