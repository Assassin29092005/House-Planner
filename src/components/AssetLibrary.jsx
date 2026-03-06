import React from 'react';

const CATEGORIES = [
  {
    label: 'Structural',
    items: [
      { type: 'pillar', icon: '🏛️', label: 'Pillar' },
    ]
  },
  {
    label: 'Furniture',
    items: [
      { type: 'bed', icon: '🛏️', label: 'Bed' },
      { type: 'sofa', icon: '🛋️', label: 'Sofa' },
      { type: 'table', icon: '🪑', label: 'Table' },
      { type: 'desk', icon: '🖥️', label: 'Desk' },
      { type: 'chair', icon: '💺', label: 'Chair' },
      { type: 'toilet', icon: '🚽', label: 'Toilet' },
      { type: 'cupboard', icon: '🗄️', label: 'Cupboard' },
    ]
  },
  {
    label: 'Navigation',
    items: [
      { type: 'stair', icon: '🪜', label: 'Stair' },
    ]
  },
  {
    label: 'Annotation',
    items: [
      { type: 'label', icon: '🏷️', label: 'Room Label' },
    ]
  }
];

const AssetLibrary = ({ isOpen }) => {
  const onDragStart = (e, type) => {
    e.dataTransfer.setData('assetType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className={`h-full flex flex-col overflow-y-auto ${!isOpen ? 'items-center px-1' : 'px-3'} pt-14 pb-4`}>
      {CATEGORIES.map(cat => (
        <div key={cat.label} className="mb-4">
          {isOpen && (
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 px-1">
              {cat.label}
            </h3>
          )}
          <div className={`grid ${isOpen ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
            {cat.items.map(asset => (
              <div
                key={asset.type}
                draggable
                onDragStart={(e) => onDragStart(e, asset.type)}
                title={asset.label}
                className={`flex flex-col items-center justify-center rounded-lg cursor-grab active:cursor-grabbing transition-all group
                  border border-[#334155] hover:border-blue-500/50 bg-[#0f172a] hover:bg-blue-500/5
                  ${isOpen ? 'p-2.5' : 'p-2'}`}
              >
                <span className={`${isOpen ? 'text-lg' : 'text-base'} group-hover:scale-110 transition-transform`}>
                  {asset.icon}
                </span>
                {isOpen && (
                  <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-wider group-hover:text-slate-300 transition-colors">
                    {asset.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AssetLibrary;