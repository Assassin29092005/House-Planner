import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../firebase';

const SignupPage = () => {
    const navigate = useNavigate();
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
            setSuccess('Account created successfully! Redirecting...');
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (networkErr) {
            setLoading(false);
            if (networkErr.message?.includes('fetch') || networkErr.message?.includes('network')) {
                setError('Cannot reach the server. Please check your internet connection and try again.');
            } else {
                setError('An unexpected error occurred. Please try again later.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🏗️</div>
                    <h1 className="text-3xl font-black text-white tracking-tight">House Planner</h1>
                    <p className="text-slate-400 text-sm mt-1">Create your free account</p>
                </div>

                <div className="bg-[#1e293b] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
                        <h2 className="text-xl font-black text-white">Get Started</h2>
                        <p className="text-emerald-200 text-sm mt-0.5">Join thousands of architects & builders</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-sm font-medium">{error}</div>
                        )}
                        {success && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl text-sm font-medium">{success}</div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                                placeholder="John Doe"
                                className="w-full bg-[#0f172a] border border-[#334155] text-slate-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600" />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                placeholder="you@example.com"
                                className="w-full bg-[#0f172a] border border-[#334155] text-slate-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                    placeholder="••••••"
                                    className="w-full bg-[#0f172a] border border-[#334155] text-slate-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirm</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                                    placeholder="••••••"
                                    className="w-full bg-[#0f172a] border border-[#334155] text-slate-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-black py-3.5 rounded-xl text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/25 transition-all">
                            {loading ? '⏳ Creating...' : 'Create Account →'}
                        </button>
                    </form>

                    <div className="px-6 pb-6">
                        <div className="text-center text-sm text-slate-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">Sign in</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
