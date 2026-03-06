import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from '../firebase';

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data, error: err } = await signIn(email, password);
            setLoading(false);
            if (err) { setError(err.message); return; }
            navigate('/dashboard');
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
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
                <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-violet-600/5 blur-2xl" />
            </div>

            <div className="relative z-10 w-full max-w-md mx-4">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🏗️</div>
                    <h1 className="text-3xl font-black text-white tracking-tight">House Planner</h1>
                    <p className="text-slate-400 text-sm mt-1">Design • Visualize • Build</p>
                </div>

                {/* Card */}
                <div className="bg-[#1e293b] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                        <h2 className="text-xl font-black text-white">Welcome Back</h2>
                        <p className="text-blue-200 text-sm mt-0.5">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                placeholder="you@example.com"
                                className="w-full bg-[#0f172a] border border-[#334155] text-slate-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600" />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                placeholder="••••••••"
                                className="w-full bg-[#0f172a] border border-[#334155] text-slate-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600" />
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black py-3.5 rounded-xl text-sm uppercase tracking-widest shadow-lg shadow-blue-500/25 transition-all">
                            {loading ? '⏳ Signing in...' : 'Sign In →'}
                        </button>
                    </form>

                    <div className="px-6 pb-6">
                        <div className="text-center text-sm text-slate-500">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                                Create one
                            </Link>
                        </div>
                    </div>
                </div>

                <p className="text-center text-[10px] text-slate-600 mt-6">By signing in you agree to our terms of service</p>
            </div>
        </div>
    );
};

export default LoginPage;
