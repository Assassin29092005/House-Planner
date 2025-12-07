import React from 'react';
import useStore from '../store';

const PropertiesPanel = () => {
  const { walls, selectedWallId, updateWallAttribute, splitWall } = useStore(); // <--- Import splitWall
  const selectedWall = walls.find((w) => w.id === selectedWallId);

  if (!selectedWall) {
    return <div className="p-4 bg-gray-100"><p className="text-gray-500 text-sm">Select a wall to edit</p></div>;
  }

  return (
    <div className="p-4 bg-white border-t border-gray-300 shadow-inner flex gap-8 items-start overflow-x-auto">
      
      {/* 1. ACTIONS */}
      <div className="space-y-2 border-r pr-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase">Actions</h3>
        <button 
          onClick={splitWall}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-2 rounded font-bold shadow"
        >
          ✂ Split Wall (Half)
        </button>
      </div>

      {/* 2. DIMENSIONS */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase">Dimensions</h3>
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-gray-700">Thickness</label>
          <input
            type="range" min="5" max="50"
            value={selectedWall.thickness}
            onChange={(e) => updateWallAttribute(selectedWall.id, 'thickness', parseInt(e.target.value))}
            className="w-24"
          />
        </div>
      </div>

      {/* 3. FINISHES (Side A / Side B) */}
      <div className="space-y-2">
         <h3 className="text-xs font-bold text-gray-400 uppercase">Colors</h3>
         <div className="flex gap-4">
            <div className="text-center">
              <label className="block text-[10px] font-bold text-gray-700 mb-1">Inside (A)</label>
              <input
                type="color"
                value={selectedWall.colorSideA || '#9ca3af'}
                onChange={(e) => updateWallAttribute(selectedWall.id, 'colorSideA', e.target.value)}
                className="h-8 w-8 cursor-pointer border rounded"
              />
            </div>
            <div className="text-center">
              <label className="block text-[10px] font-bold text-gray-700 mb-1">Outside (B)</label>
              <input
                type="color"
                value={selectedWall.colorSideB || '#9ca3af'}
                onChange={(e) => updateWallAttribute(selectedWall.id, 'colorSideB', e.target.value)}
                className="h-8 w-8 cursor-pointer border rounded"
              />
            </div>
         </div>
      </div>

    </div>
  );
};

export default PropertiesPanel;