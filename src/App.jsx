import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import HomePage from './pages/HomePage';
import { onAuthChange } from './firebase';

// Wrapper to handle redirect-after-login for auth-guarded routes
const AuthGuard = ({ user, children }) => {
  if (user) return children;
  // Preserve the current URL so we can redirect back after login
  const currentPath = window.location.pathname + window.location.search;
  const redirectTo = currentPath !== '/' ? `/login?redirect=${encodeURIComponent(currentPath)}` : '/login';
  return <Navigate to={redirectTo} replace />;
};

const AuthRedirect = ({ user, children }) => {
  const [searchParams] = useSearchParams();
  if (!user) return children;
  const redirect = searchParams.get('redirect');
  return <Navigate to={redirect || '/dashboard'} replace />;
};

function App() {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090b', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div className="text-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4" style={{ color: '#818cf8', animation: 'fadeIn 0.4s ease-out' }}>
            <path d="M4 10L12 4L20 10" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <rect x="4" y="10" width="16" height="11" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
            <rect x="9.5" y="15" width="5" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <div className="text-[13px] font-medium animate-pulse" style={{ color: '#54545b' }}>Loading&hellip;</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage user={user} />} />
        <Route path="/login" element={<AuthRedirect user={user}><LoginPage /></AuthRedirect>} />
        <Route path="/signup" element={<AuthRedirect user={user}><SignupPage /></AuthRedirect>} />
        <Route path="/dashboard" element={<AuthGuard user={user}><DashboardPage /></AuthGuard>} />
        <Route path="/editor" element={<AuthGuard user={user}><EditorPage /></AuthGuard>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
