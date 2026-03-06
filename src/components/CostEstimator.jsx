import React, { useState, useMemo } from 'react';
import useStore from '../store';
import { getWallLength } from '../utils/geometry';
import { findRooms } from '../utils/roomDetection';

const CostEstimator = ({ onClose }) => {
    const { walls, currentLevelId, measurementUnit, furniture, siteWidth, siteDepth } = useStore();
    const [wallRate, setWallRate] = useState(50);
    const [floorRate, setFloorRate] = useState(30);
    const [furnitureRate, setFurnitureRate] = useState(200);

    const levelWalls = walls.filter(w => w.levelId === currentLevelId);
    const unitFactor = useMemo(() => {
        const factors = { px: 1, ft: 0.1, m: 0.03 };
        return factors[measurementUnit] || 1;
    }, [measurementUnit]);

    const totalWallLength = useMemo(() => {
        return levelWalls.reduce((sum, w) => sum + getWallLength(w), 0) * unitFactor;
    }, [levelWalls, unitFactor]);

    const rooms = useMemo(() => findRooms(levelWalls), [levelWalls]);
    const totalFloorArea = useMemo(() => {
        if (rooms.length > 0) return rooms.reduce((sum, r) => sum + r.area, 0) * unitFactor * unitFactor;
        return siteWidth * siteDepth * unitFactor * unitFactor;
    }, [rooms, siteWidth, siteDepth, unitFactor]);

    const furnitureCount = furniture.filter(f => f.levelId === currentLevelId).length;

    const wallCost = totalWallLength * wallRate;
    const floorCost = totalFloorArea * floorRate;
    const furnitureCost = furnitureCount * furnitureRate;
    const totalCost = wallCost + floorCost + furnitureCost;

    const suffix = measurementUnit === 'ft' ? 'ft' : measurementUnit === 'm' ? 'm' : 'px';

    return (
        <div className="absolute top-0 right-0 w-72 h-full bg-[#1e293b] border-l border-[#334155] z-40 animate-fade-in overflow-y-auto">
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">💰 Cost Estimator</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white text-sm">✕</button>
                </div>

                {/* Rates */}
                <div className="space-y-3 mb-6">
                    <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Wall Rate (per {suffix})</label>
                        <input type="number" value={wallRate} onChange={e => setWallRate(Number(e.target.value))}
                            className="w-full bg-[#0f172a] border border-[#334155] text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 mt-1" />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Floor Rate (per {suffix}²)</label>
                        <input type="number" value={floorRate} onChange={e => setFloorRate(Number(e.target.value))}
                            className="w-full bg-[#0f172a] border border-[#334155] text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 mt-1" />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Furniture (per item)</label>
                        <input type="number" value={furnitureRate} onChange={e => setFurnitureRate(Number(e.target.value))}
                            className="w-full bg-[#0f172a] border border-[#334155] text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 mt-1" />
                    </div>
                </div>

                {/* Summary */}
                <div className="border-t border-[#334155] pt-4 space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Breakdown</h4>

                    <div className="bg-[#0f172a] rounded-lg p-3 space-y-2">
                        <div className="flex justify-between"><span className="text-xs text-slate-400">Total Wall Length</span><span className="text-xs text-slate-200 font-bold">{totalWallLength.toFixed(1)} {suffix}</span></div>
                        <div className="flex justify-between"><span className="text-xs text-slate-400">Wall Cost</span><span className="text-xs text-emerald-400 font-bold">₹{wallCost.toFixed(0)}</span></div>
                    </div>

                    <div className="bg-[#0f172a] rounded-lg p-3 space-y-2">
                        <div className="flex justify-between"><span className="text-xs text-slate-400">Floor Area</span><span className="text-xs text-slate-200 font-bold">{totalFloorArea.toFixed(1)} {suffix}²</span></div>
                        <div className="flex justify-between"><span className="text-xs text-slate-400">Floor Cost</span><span className="text-xs text-emerald-400 font-bold">₹{floorCost.toFixed(0)}</span></div>
                    </div>

                    <div className="bg-[#0f172a] rounded-lg p-3 space-y-2">
                        <div className="flex justify-between"><span className="text-xs text-slate-400">Furniture Items</span><span className="text-xs text-slate-200 font-bold">{furnitureCount}</span></div>
                        <div className="flex justify-between"><span className="text-xs text-slate-400">Furniture Cost</span><span className="text-xs text-emerald-400 font-bold">₹{furnitureCost.toFixed(0)}</span></div>
                    </div>
                </div>

                {/* Total */}
                <div className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4">
                    <div className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Estimated Total</div>
                    <div className="text-2xl font-black text-white mt-1">₹{totalCost.toLocaleString()}</div>
                    <div className="text-[10px] text-blue-200 mt-1">Current floor only</div>
                </div>
            </div>
        </div>
    );
};

export default CostEstimator;
