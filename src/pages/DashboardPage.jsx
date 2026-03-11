import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signOut, getUser, listProjects, deleteProject } from '../firebase';
import { toast } from '../components/Toast';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        const init = async () => {
            const u = getUser();
            if (!u) { navigate('/login'); return; }
            setUser(u);
            await refreshProjects();
        };
        init();
    }, [navigate]);

    const refreshProjects = async () => {
        setError(null);
        try {
            const { data, error: err } = await listProjects();
            if (err) throw err;
            setProjects(data || []);
        } catch (err) {
            console.error('Failed to load projects:', err);
            setError('Failed to load projects. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleNewProject = () => navigate('/editor');
    const handleOpenProject = (id) => navigate(`/editor?project=${id}`);

    const handleDeleteProject = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Delete this project permanently?')) return;
        setDeleting(id);
        try {
            const { error: err } = await deleteProject(id);
            if (err) throw err;
            toast.success('Project deleted');
            await refreshProjects();
        } catch (err) {
            console.error('Failed to delete project:', err);
            toast.error('Failed to delete project');
        } finally {
            setDeleting(null);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const userName = user?.displayName || user?.email?.split('@')[0] || 'User';
    const initials = userName.charAt(0).toUpperCase();

    if (loading) {
        return (
            <div className="min-h-screen hp-page flex items-center justify-center">
                <div className="text-[14px] font-medium" style={{ color: 'var(--hp-muted)' }}>Loading projects&hellip;</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen hp-page hp-grain">
            {/* ── HEADER ── */}
            <header style={{ background: 'var(--hp-card)', borderBottom: '1px solid var(--hp-border)' }}>
                <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5" style={{ color: 'var(--hp-text)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M4 10L12 4L20 10" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                            <rect x="4" y="10" width="16" height="11" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
                            <rect x="9.5" y="15" width="5" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                        <span className="text-[15px] font-medium tracking-[-0.02em]">House Planner</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold"
                                style={{ background: 'var(--hp-accent-soft)', color: 'var(--hp-accent)', border: '1px solid rgba(129,140,248,0.15)' }}>
                                {initials}
                            </div>
                            <span className="text-[13px] font-medium hidden sm:block" style={{ color: 'var(--hp-text)' }}>{userName}</span>
                        </div>
                        <button onClick={handleSignOut} className="hp-btn hp-btn-ghost text-[12px] px-3 h-8 rounded-md"
                            style={{ border: '1px solid var(--hp-border)' }}>
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            {/* ── MAIN ── */}
            <main className="max-w-6xl mx-auto px-6 py-10">
                {/* Title row */}
                <div className="flex items-center justify-between mb-10" style={{ animation: 'hp-card-in 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
                    <div>
                        <h2 className="hp-serif text-[24px] mb-1" style={{ color: 'var(--hp-text)' }}>Your projects</h2>
                        <p className="text-[13px]" style={{ color: 'var(--hp-muted)' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={handleNewProject} className="hp-btn hp-btn-accent h-10 px-6 text-[13px]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New project
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                    {[
                        { label: 'Total Projects', value: projects.length },
                        { label: 'Last Updated', value: projects.length > 0 ? new Date(projects[0].updated_at).toLocaleDateString() : '\u2014' },
                        { label: 'Plan', value: 'Free', accent: true },
                    ].map((s, i) => (
                        <div key={i} className="rounded-lg p-5"
                            style={{ background: 'var(--hp-card)', border: '1px solid var(--hp-border)', animation: `hp-card-in 0.5s cubic-bezier(0.16,1,0.3,1) both ${0.05 + i * 0.06}s` }}>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: 'var(--hp-muted)' }}>{s.label}</div>
                            <div className="text-[18px] font-semibold" style={{ color: s.accent ? 'var(--hp-accent)' : 'var(--hp-text)' }}>
                                {s.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Project grid */}
                {error ? (
                    <div className="text-center py-20">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4" style={{ color: 'var(--hp-red)' }}>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="12" y1="8" x2="12" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="12" cy="16" r="0.8" fill="currentColor" />
                        </svg>
                        <h3 className="text-[16px] font-semibold mb-2" style={{ color: 'var(--hp-red)' }}>Failed to load projects</h3>
                        <p className="text-[13px] mb-6" style={{ color: 'var(--hp-muted)' }}>{error}</p>
                        <button onClick={refreshProjects} className="hp-btn hp-btn-accent h-10 px-6 text-[13px]">
                            Try again
                        </button>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20" style={{ animation: 'hp-card-in 0.6s cubic-bezier(0.16,1,0.3,1) both 0.2s' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-5" style={{ color: 'var(--hp-dim)' }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.3" />
                            <path d="M3 9H21M9 9V21" stroke="currentColor" strokeWidth="1.3" />
                        </svg>
                        <h3 className="text-[16px] font-semibold mb-2" style={{ color: 'var(--hp-text)' }}>No projects yet</h3>
                        <p className="text-[13px] mb-7" style={{ color: 'var(--hp-muted)' }}>Create your first floor plan to get started</p>
                        <button onClick={handleNewProject} className="hp-btn hp-btn-accent h-10 px-7 text-[13px]">
                            Create first project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* New project card */}
                        <button onClick={handleNewProject}
                            className="rounded-lg p-8 flex flex-col items-center justify-center gap-3 min-h-[220px] transition-all duration-300 group"
                            style={{
                                border: '2px dashed var(--hp-border)',
                                background: 'transparent',
                                animation: 'hp-card-in 0.5s cubic-bezier(0.16,1,0.3,1) both 0.1s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--hp-accent)'; e.currentTarget.style.background = 'var(--hp-accent-soft)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--hp-border)'; e.currentTarget.style.background = 'transparent'; }}
                        >
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300"
                                style={{ background: 'var(--hp-accent-soft)', border: '1px solid rgba(129,140,248,0.12)' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--hp-accent)' }}>
                                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </div>
                            <span className="text-[13px] font-medium" style={{ color: 'var(--hp-body)' }}>New project</span>
                        </button>

                        {/* Project cards */}
                        {projects.map((project, i) => (
                            <div key={project.id} onClick={() => handleOpenProject(project.id)}
                                className="hp-card rounded-lg cursor-pointer group"
                                style={{ animation: `hp-card-in 0.5s cubic-bezier(0.16,1,0.3,1) both ${0.1 + (i + 1) * 0.06}s` }}>
                                {/* Thumbnail area */}
                                <div className="h-[150px] relative overflow-hidden flex items-center justify-center" style={{ background: 'var(--hp-surface)', borderBottom: '1px solid var(--hp-border)' }}>
                                    {project.thumbnail ? (
                                        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--hp-dim)' }}>
                                            <path d="M4 10L12 4L20 10" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                                            <rect x="4" y="10" width="16" height="11" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
                                        </svg>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4 flex justify-between items-start">
                                    <div>
                                        <h3 className="text-[14px] font-medium mb-1 transition-colors duration-300 group-hover:text-[var(--hp-text)]" style={{ color: 'var(--hp-text)' }}>
                                            {project.name || 'Untitled'}
                                        </h3>
                                        <p className="text-[11px]" style={{ color: 'var(--hp-muted)' }}>
                                            {new Date(project.updated_at).toLocaleDateString()}{' '}
                                            at {new Date(project.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <button onClick={(e) => handleDeleteProject(e, project.id)}
                                        disabled={deleting === project.id}
                                        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200"
                                        style={{ color: 'var(--hp-muted)' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--hp-red)'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--hp-muted)'; e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        {deleting === project.id ? (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                                                <circle cx="12" cy="12" r="10" strokeDasharray="56" strokeDashoffset="14" />
                                            </svg>
                                        ) : (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                                <path d="M3 6H5H21" /><path d="M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6" />
                                                <path d="M19 6V20C19 20.6 18.6 21 18 21H6C5.4 21 5 20.6 5 20V6" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardPage;
