import React, { useState } from 'react';
import useStore from '../store';

const SiteConfigModal = () => {
  const { siteWidth, setSiteDimensions } = useStore();
  const [width, setWidth] = useState(800);
  const [depth, setDepth] = useState(600);

  // Hide if site is already set
  if (siteWidth > 0) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSiteDimensions(parseInt(width), parseInt(depth));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-2xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">New Project Setup</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold text-gray-700">Site Width</label>
            <input 
              type="number" value={width} onChange={(e) => setWidth(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700">Site Depth</label>
            <input 
              type="number" value={depth} onChange={(e) => setDepth(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded">
            Create Project
          </button>
        </form>
      </div>
    </div>
  );
};

export default SiteConfigModal;