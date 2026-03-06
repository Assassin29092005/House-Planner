import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TwoDEditor from '../components/TwoDEditor';
import ThreeDViewer from '../components/ThreeDViewer';
import AssetLibrary from '../components/AssetLibrary';
import SiteConfigModal from '../components/SiteConfigModal';
import CostEstimator from '../components/CostEstimator';
import CloudPanel from '../components/CloudPanel';
import OnboardingTour from '../components/OnboardingTour';
import useStore from '../store';
import { getUser, signOut, loadProject as loadCloudProject, saveProject as saveCloudProject } from '../firebase';
import { toast } from '../components/Toast';

const EditorPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('project');
    const { loadProject, getExportData, siteWidth } = useStore();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [viewMode, setViewMode] = useState('split');
    const [showCost, setShowCost] = useState(false);
    const [showCloud, setShowCloud] = useState(false);
    const [showTour, setShowTour] = useState(false);
    const [user, setUser] = useState(null);
    const [currentProjectId, setCurrentProjectId] = useState(projectId);
    const [projectName, setProjectName] = useState('Untitled');
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        const init = async () => {
            const u = getUser();
            if (!u) { navigate('/login'); return; }
            setUser(u);
            // Load project if ID in URL
            if (projectId) {
                try {
                    const { data, error } = await loadCloudProject(projectId);
                    if (error) throw error;
                    if (data?.data) {
                        loadProject(data.data);
                        setProjectName(data.name || 'Untitled');
                    } else {
                        setLoadError('Project not found');
                        toast.error('Project not found');
                    }
                } catch (err) {
                    console.error('Failed to load project:', err);
                    setLoadError('Failed to load project');
                    toast.error('Failed to load project from cloud');
                }
            }
        };
        init();
        const toured = localStorage.getItem('house-planner-toured');
        if (!toured) setShowTour(true);
    }, [projectId, navigate, loadProject]);

    // Track unsaved changes
    useEffect(() => {
        if (lastSaved || !siteWidth) return;
        // Mark as having unsaved changes when store changes after initial load
        const unsubscribe = useStore.subscribe(() => {
            setHasUnsavedChanges(true);
        });
        return unsubscribe;
    }, [siteWidth, lastSaved]);

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Cloud save with race condition protection
    const savingRef = React.useRef(false);
    const handleCloudSave = useCallback(async () => {
        if (!user || savingRef.current) return;
        savingRef.current = true;
        setSaving(true);
        try {
            const stageEl = document.querySelector('canvas');
            let thumbnail = null;
            if (stageEl) {
                try { thumbnail = stageEl.toDataURL('image/png', 0.3); } catch (e) { }
            }
            const data = { ...getExportData(), name: projectName, thumbnail };
            const { data: saved, error } = await saveCloudProject(data, currentProjectId);
            if (error) throw error;
            if (saved) {
                setCurrentProjectId(saved.id);
                setLastSaved(new Date());
                setHasUnsavedChanges(false);
                toast.success('Project saved');
            }
        } catch (err) {
            console.error('Save failed:', err);
            toast.error('Failed to save project');
        } finally {
            setSaving(false);
            savingRef.current = false;
        }
    }, [user, getExportData, projectName, currentProjectId]);

    const handleSignOut = async () => { await signOut(); navigate('/login'); };
    const handleNavigateAway = (path) => {
        if (hasUnsavedChanges && !confirm('You have unsaved changes. Leave without saving?')) return;
        navigate(path);
    };
    const userName = user?.displayName || user?.email?.split('@')[0] || 'User';

    return (
        <div className="flex h-screen w-screen overflow-hidden relative font-sans bg-[#0f172a] text-slate-200">
            <SiteConfigModal />
            {loadError && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center">
                    <div className="bg-[#1e293b] border border-red-500/30 rounded-2xl p-8 max-w-sm text-center">
                        <div className="text-5xl mb-4">⚠️</div>
                        <h2 className="text-lg font-black text-white mb-2">{loadError}</h2>
                        <p className="text-slate-400 text-sm mb-6">The project could not be loaded from the cloud.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => { setLoadError(null); window.location.reload(); }}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors">
                                Retry
                            </button>
                            <button onClick={() => navigate('/dashboard')}
                                className="px-5 py-2 bg-[#0f172a] border border-[#334155] text-slate-300 hover:text-white font-bold rounded-xl text-sm transition-colors">
                                Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showTour && <OnboardingTour onComplete={() => setShowTour(false)} />}

            {/* LEFT SIDEBAR */}
            <div className={`${sidebarOpen ? 'w-44' : 'w-14'} h-full bg-[#1e293b] border-r border-[#334155] z-30 transition-all duration-300 relative flex flex-col`}>
                <button onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute -right-3 top-10 bg-[#1e293b] border border-[#334155] rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-40 hover:bg-[#334155] text-xs text-slate-400 hover:text-white transition-colors">
                    {sidebarOpen ? '◁' : '▷'}
                </button>
                <AssetLibrary isOpen={sidebarOpen} />
                <div className={`border-t border-[#334155] p-2 space-y-1 ${!sidebarOpen ? 'px-1' : ''}`}>
                    <button onClick={() => setShowCost(!showCost)} title="Cost Estimator"
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[10px] font-bold transition-colors ${showCost ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-[#334155]'}`}>
                        <span>💰</span>{sidebarOpen && <span className="uppercase tracking-wider">Cost</span>}
                    </button>
                    <button onClick={() => setShowCloud(!showCloud)} title="Cloud Save"
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[10px] font-bold transition-colors ${showCloud ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-[#334155]'}`}>
                        <span>☁️</span>{sidebarOpen && <span className="uppercase tracking-wider">Cloud</span>}
                    </button>
                    <button onClick={() => setShowTour(true)} title="Help"
                        className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:bg-[#334155] transition-colors">
                        <span>❓</span>{sidebarOpen && <span className="uppercase tracking-wider">Help</span>}
                    </button>
                </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div className="flex-grow h-full flex flex-col relative">
                {/* TOP NAV BAR */}
                <div className="bg-[#1e293b] border-b border-[#334155] px-4 py-2 flex items-center justify-between z-40 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => handleNavigateAway('/dashboard')} className="text-slate-400 hover:text-white text-xs font-bold transition-colors">
                            ← Dashboard
                        </button>
                        <span className="text-[#334155]">|</span>
                        <input value={projectName} onChange={(e) => setProjectName(e.target.value)}
                            className="bg-transparent text-sm font-bold text-white outline-none border-b border-transparent focus:border-blue-500 transition-colors w-40" />
                    </div>
                    <div className="flex items-center gap-3">
                        {lastSaved && <span className="text-[10px] text-slate-500">Saved {lastSaved.toLocaleTimeString()}</span>}
                        <button onClick={handleCloudSave} disabled={saving}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg text-[10px] font-black uppercase transition-colors">
                            {saving ? '⏳' : '☁️'} Save
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <button onClick={handleSignOut} className="text-[10px] text-slate-500 hover:text-red-400 font-bold transition-colors">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* EDITOR */}
                <div className="flex-grow flex relative min-h-0">
                    {/* View mode */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex bg-[#0f172a] shadow-2xl rounded-xl p-1 border border-[#334155]">
                        {[{ id: '2d', label: '2D Editor', icon: '📐' }, { id: 'split', label: 'Split', icon: '⬛' }, { id: '3d', label: '3D View', icon: '🧊' }].map(mode => (
                            <button key={mode.id} onClick={() => setViewMode(mode.id)}
                                className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${viewMode === mode.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:text-slate-300'}`}>
                                <span className="text-xs">{mode.icon}</span>{mode.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex h-full w-full" key={viewMode}>
                        {(viewMode === '2d' || viewMode === 'split') && (
                            <div className={`${viewMode === 'split' ? 'w-[60%]' : 'w-full'} h-full border-r border-[#334155] flex flex-col relative`}>
                                <TwoDEditor viewMode={viewMode} />
                                {showCost && <CostEstimator onClose={() => setShowCost(false)} />}
                                {showCloud && <CloudPanel onClose={() => setShowCloud(false)} />}
                            </div>
                        )}
                        {(viewMode === '3d' || viewMode === 'split') && (
                            <div className={`${viewMode === 'split' ? 'w-[40%]' : 'w-full'} h-full relative`}>
                                <ThreeDViewer />
                                {viewMode === '3d' && showCost && <CostEstimator onClose={() => setShowCost(false)} />}
                                {viewMode === '3d' && showCloud && <CloudPanel onClose={() => setShowCloud(false)} />}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;
