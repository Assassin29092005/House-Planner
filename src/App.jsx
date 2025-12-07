import React from 'react';
import TwoDEditor from './components/TwoDEditor';
import ThreeDViewer from './components/ThreeDViewer';
import PropertiesPanel from './components/PropertiesPanel';
import SiteConfigModal from './components/SiteConfigModal';
import useStore from './store'; // Import store

function App() {
  // Use store to check if a wall is selected
  const selectedWallId = useStore((state) => state.selectedWallId);

  return (
    <div className="flex h-screen w-screen overflow-hidden relative font-sans text-gray-900">
      
      <SiteConfigModal />

      {/* LEFT COLUMN */}
      <div className="w-1/2 h-full border-r border-gray-400 flex flex-col bg-slate-100">
        <div className="flex-grow overflow-hidden relative">
          <TwoDEditor />
        </div>
        
        {/* CONDITIONALLY RENDER PROPERTIES PANEL */}
        {selectedWallId && (
          <div className="h-auto z-20 relative shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
            <PropertiesPanel />
          </div>
        )}
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-1/2 h-full">
        <ThreeDViewer />
      </div>
    </div>
  );
}

export default App;