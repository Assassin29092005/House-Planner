import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { saveProject, listProjects, deleteProject, loadProject, getShareLink } from '../firebase';
import { toast } from './Toast';

const CloudPanel = ({ onClose }) => {
    const { loadProject: loadStoreProject, getExportData } = useStore();
    const [projects, setProjects] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [shareLink, setShareLink] = useState('');
    const [currentProjectId, setCurrentProjectId] = useState(null);
    const [projectName, setProjectName] = useState('My House Plan');
    const [listError, setListError] = useState(null);

    useEffect(() => { refreshProjects(); }, []);

    const refreshProjects = async () => {
        setListError(null);
        try {
            const { data, error } = await listProjects();
            if (error) throw error;
            setProjects(data || []);
        } catch (err) {
            console.error('Failed to list projects:', err);
            setListError('Failed to load projects');
        }
    };

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const data = { ...getExportData(), name: projectName };
            const { data: saved, error } = await saveProject(data, currentProjectId);
            if (error) throw error;
            if (saved) {
                setCurrentProjectId(saved.id);
                setShareLink(getShareLink(saved.id));
                await refreshProjects();
                toast.success('Saved to cloud');
            }
        } catch (err) {
            console.error('Save failed:', err);
            toast.error('Failed to save project');
        } finally {
            setSaving(false);
        }
    };

    const handleLoad = async (id) => {
        if (loading) return;
        setLoading(true);
        try {
            const { data, error } = await loadProject(id);
            if (error) throw error;
            if (data?.data) {
                loadStoreProject(data.data);
                setCurrentProjectId(id);
                setProjectName(data.name || 'Untitled');
                toast.success('Project loaded');
            } else {
                toast.error('Project data not found');
            }
        } catch (err) {
            console.error('Load failed:', err);
            toast.error('Failed to load project');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this project from cloud?')) return;
        setDeleting(id);
        try {
            const { error } = await deleteProject(id);
            if (error) throw error;
            if (id === currentProjectId) { setCurrentProjectId(null); setShareLink(''); }
            await refreshProjects();
            toast.success('Project deleted');
        } catch (err) {
            console.error('Delete failed:', err);
            toast.error('Failed to delete project');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="absolute top-0 right-0 w-72 h-full bg-[#1e293b] border-l border-[#334155] z-40 animate-fade-in overflow-y-auto">
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">☁️ Cloud Save</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white text-sm">✕</button>
                </div>

                <div className="mb-3">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Project Name</label>
                    <input value={projectName} onChange={e => setProjectName(e.target.value)}
                        className="w-full bg-[#0f172a] border border-[#334155] text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 mt-1" />
                </div>

                <button onClick={handleSave} disabled={saving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white py-2.5 rounded-lg text-xs font-black uppercase transition-colors mb-3">
                    {saving ? '⏳ Saving...' : '☁️ Save to Cloud'}
                </button>

                {shareLink && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                        <div className="text-[9px] font-black text-blue-400 uppercase mb-1">Share Link</div>
                        <div className="flex gap-1">
                            <input value={shareLink} readOnly className="flex-1 bg-[#0f172a] text-xs text-slate-300 px-2 py-1 rounded border border-[#334155] outline-none" />
                            <button onClick={() => navigator.clipboard.writeText(shareLink)} className="px-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors">📋</button>
                        </div>
                    </div>
                )}

                <div className="border-t border-[#334155] pt-4">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Projects</h4>
                        <button onClick={refreshProjects} className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">↻</button>
                    </div>
                    {listError ? (
                        <div className="text-center py-4">
                            <p className="text-xs text-red-400 mb-2">{listError}</p>
                            <button onClick={refreshProjects} className="text-xs text-blue-400 hover:text-blue-300">Retry</button>
                        </div>
                    ) : projects.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">No saved projects yet</p>
                    ) : (
                        <div className="space-y-2">
                            {projects.map(p => (
                                <div key={p.id} className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 hover:border-blue-500/30 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-sm text-slate-200 font-bold">{p.name || 'Untitled'}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">{new Date(p.updated_at).toLocaleString()}</div>
                                        </div>
                                        <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                                            className="text-red-400/50 hover:text-red-400 text-xs transition-colors disabled:opacity-50">
                                            {deleting === p.id ? '⏳' : '🗑'}
                                        </button>
                                    </div>
                                    <button onClick={() => handleLoad(p.id)} disabled={loading}
                                        className="mt-2 w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 py-1.5 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-50">
                                        {loading ? 'Loading...' : 'Load'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CloudPanel;
