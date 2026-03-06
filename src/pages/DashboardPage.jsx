import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-blue-400 font-bold animate-pulse text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] relative">
            {/* HEADER */}
            <header className="bg-[#1e293b] border-b border-[#334155]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🏗️</span>
                        <h1 className="text-lg font-black text-white tracking-tight">House Planner</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-slate-300 font-bold hidden sm:block">{userName}</span>
                        </div>
                        <button onClick={handleSignOut}
                            className="px-4 py-2 bg-[#0f172a] border border-[#334155] text-slate-400 hover:text-white hover:border-red-500/50 rounded-lg text-xs font-bold transition-all">
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Welcome + New Project */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-white">Hey, {userName}! 👋</h2>
                        <p className="text-slate-400 text-sm mt-1">Your floor plan projects</p>
                    </div>
                    <button onClick={handleNewProject}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black px-6 py-3 rounded-xl text-sm uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2">
                        <span className="text-lg">+</span> New Project
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Projects</div>
                        <div className="text-2xl font-black text-white">{projects.length}</div>
                    </div>
                    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Last Updated</div>
                        <div className="text-sm font-bold text-slate-300">
                            {projects.length > 0 ? new Date(projects[0].updated_at).toLocaleDateString() : '—'}
                        </div>
                    </div>
                    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Plan</div>
                        <div className="text-sm font-bold text-emerald-400">Free</div>
                    </div>
                </div>

                {/* Projects Grid */}
                {error ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h3 className="text-xl font-bold text-red-400 mb-2">Failed to load projects</h3>
                        <p className="text-slate-500 text-sm mb-6">{error}</p>
                        <button onClick={refreshProjects}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors">
                            Retry
                        </button>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📐</div>
                        <h3 className="text-xl font-bold text-slate-300 mb-2">No projects yet</h3>
                        <p className="text-slate-500 text-sm mb-6">Create your first floor plan to get started</p>
                        <button onClick={handleNewProject}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors">
                            Create First Project →
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* New project card */}
                        <button onClick={handleNewProject}
                            className="border-2 border-dashed border-[#334155] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group min-h-[240px]">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                                <span className="text-2xl text-blue-400">+</span>
                            </div>
                            <span className="text-sm font-bold text-slate-400 group-hover:text-slate-300">New Project</span>
                        </button>

                        {/* Existing projects */}
                        {projects.map(project => (
                            <div key={project.id} onClick={() => handleOpenProject(project.id)}
                                className="bg-[#1e293b] border border-[#334155] rounded-2xl overflow-hidden hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer group">
                                {/* Thumbnail */}
                                <div className="h-40 bg-[#0f172a] border-b border-[#334155] relative overflow-hidden flex items-center justify-center">
                                    {project.thumbnail ? (
                                        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-4xl opacity-20">🏠</div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-200 group-hover:text-white transition-colors">{project.name || 'Untitled'}</h3>
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                Updated {new Date(project.updated_at).toLocaleDateString()} at {new Date(project.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <button onClick={(e) => handleDeleteProject(e, project.id)}
                                            disabled={deleting === project.id}
                                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50">
                                            {deleting === project.id ? '⏳' : '🗑'}
                                        </button>
                                    </div>
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
