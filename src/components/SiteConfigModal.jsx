import React, { useState } from 'react';
import useStore from '../store';
import { CONFIG } from '../constants';
import { TEMPLATES } from '../data/templates';

const SiteConfigModal = () => {
  const { siteWidth, setSiteDimensions, setMeasurementUnit, loadTemplate } = useStore();
  const [unit, setUnit] = useState('ft');
  const [width, setWidth] = useState(30);
  const [depth, setDepth] = useState(20);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [tab, setTab] = useState('custom');

  if (siteWidth > 0) return null;

  const unitConfig = CONFIG.UNITS[unit];
  const minVal = unit === 'ft' ? 10 : 3;
  const maxVal = unit === 'ft' ? 200 : 60;

  const handleUnitChange = (newUnit) => {
    // Convert current values to the new unit
    const oldPxPerUnit = CONFIG.UNITS[unit].pxPerUnit;
    const newPxPerUnit = CONFIG.UNITS[newUnit].pxPerUnit;
    const pxW = width * oldPxPerUnit;
    const pxD = depth * oldPxPerUnit;
    setWidth(Math.round(pxW / newPxPerUnit));
    setDepth(Math.round(pxD / newPxPerUnit));
    setUnit(newUnit);
  };

  const handlePreset = (preset) => {
    setSelectedPreset(preset.name);
    const dims = preset[unit];
    if (dims && dims.w > 0) {
      setWidth(dims.w);
      setDepth(dims.d);
    }
  };

  const isValidDimension = (val) => {
    const n = Number(val);
    return !isNaN(n) && n >= minVal && n <= maxVal && n > 0;
  };

  const isFormValid = isValidDimension(width) && isValidDimension(depth);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    const clampedW = Math.max(minVal, Math.min(maxVal, Number(width)));
    const clampedD = Math.max(minVal, Math.min(maxVal, Number(depth)));
    const pxPerUnit = unitConfig.pxPerUnit;
    const pxWidth = Math.round(clampedW * pxPerUnit);
    const pxDepth = Math.round(clampedD * pxPerUnit);
    setMeasurementUnit(unit);
    setSiteDimensions(pxWidth, pxDepth);
  };

  const handleTemplate = (key) => {
    setMeasurementUnit(unit);
    loadTemplate(TEMPLATES[key]);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl shadow-2xl max-w-lg w-full mx-4 animate-fade-in overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
          <div className="text-4xl mb-3">🏗️</div>
          <h2 className="text-2xl font-black text-white tracking-tight">House Planner</h2>
          <p className="text-blue-200 text-sm mt-1 font-medium">Design your floor plan</p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#334155]">
          <button onClick={() => setTab('custom')} className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-colors ${tab === 'custom' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
            Custom Size
          </button>
          <button onClick={() => setTab('templates')} className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-colors ${tab === 'templates' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
            Templates
          </button>
        </div>

        {tab === 'custom' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Unit selector at top */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Measurement Unit</label>
              <div className="flex rounded-xl overflow-hidden border border-[#334155]">
                {Object.entries(CONFIG.UNITS).map(([key, u]) => (
                  <button key={key} type="button" onClick={() => handleUnitChange(key)}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase ${unit === key ? 'bg-blue-600 text-white' : 'bg-[#0f172a] text-slate-400 hover:text-slate-300'}`}>
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick presets */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quick Start</label>
              <div className="grid grid-cols-4 gap-2">
                {CONFIG.PRESETS.map(preset => {
                  const dims = preset[unit];
                  return (
                    <button key={preset.name} type="button" onClick={() => handlePreset(preset)}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center ${selectedPreset === preset.name ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-[#334155] bg-[#0f172a] text-slate-400 hover:border-slate-500'}`}>
                      <span className="text-xl mb-1">{preset.icon}</span>
                      <span className="text-[9px] font-bold uppercase">{preset.name}</span>
                      {dims && dims.w > 0 && <span className="text-[8px] text-slate-500 mt-0.5">{dims.w}×{dims.d} {unitConfig.suffix}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dimension inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Width ({unitConfig.suffix})</label>
                <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} min={minVal} max={maxVal} step={unit === 'm' ? 0.5 : 1}
                  className={`w-full bg-[#0f172a] border text-slate-200 p-3 rounded-xl font-bold text-lg outline-none focus:border-blue-500 ${!isValidDimension(width) ? 'border-red-500' : 'border-[#334155]'}`} />
                <span className={`text-[9px] mt-1 block ${!isValidDimension(width) ? 'text-red-400' : 'text-slate-500'}`}>
                  {!isValidDimension(width) ? `Must be between ${minVal}–${maxVal} ${unitConfig.suffix}` : `${minVal}–${maxVal} ${unitConfig.suffix}`}
                </span>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Depth ({unitConfig.suffix})</label>
                <input type="number" value={depth} onChange={(e) => setDepth(Number(e.target.value))} min={minVal} max={maxVal} step={unit === 'm' ? 0.5 : 1}
                  className={`w-full bg-[#0f172a] border text-slate-200 p-3 rounded-xl font-bold text-lg outline-none focus:border-blue-500 ${!isValidDimension(depth) ? 'border-red-500' : 'border-[#334155]'}`} />
                <span className={`text-[9px] mt-1 block ${!isValidDimension(depth) ? 'text-red-400' : 'text-slate-500'}`}>
                  {!isValidDimension(depth) ? `Must be between ${minVal}–${maxVal} ${unitConfig.suffix}` : `${minVal}–${maxVal} ${unitConfig.suffix}`}
                </span>
              </div>
            </div>

            <button type="submit" disabled={!isFormValid}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl text-sm uppercase tracking-widest shadow-lg shadow-blue-500/25 disabled:shadow-none">
              Create Project →
            </button>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            {/* Unit selector */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Measurement Unit</label>
              <div className="flex rounded-xl overflow-hidden border border-[#334155]">
                {Object.entries(CONFIG.UNITS).map(([key, u]) => (
                  <button key={key} type="button" onClick={() => setUnit(key)}
                    className={`flex-1 py-2 text-xs font-bold uppercase ${unit === key ? 'bg-blue-600 text-white' : 'bg-[#0f172a] text-slate-400'}`}>
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {Object.entries(TEMPLATES).map(([key, tmpl]) => {
              const pxPerUnit = unitConfig.pxPerUnit;
              const w = (tmpl.siteWidth / pxPerUnit).toFixed(0);
              const d = (tmpl.siteDepth / pxPerUnit).toFixed(0);
              const floors = tmpl.floors || [{ walls: tmpl.walls, furniture: tmpl.furniture }];
              const wallCount = floors.reduce((s, f) => s + (f.walls || []).length, 0);
              const furnCount = floors.reduce((s, f) => s + (f.furniture || []).length, 0);
              const floorLabel = floors.length > 1 ? ` • ${floors.length} floors` : '';
              return (
                <button key={key} onClick={() => handleTemplate(key)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-4 text-left hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{tmpl.icon}</span>
                    <div>
                      <div className="text-sm font-black text-slate-200 group-hover:text-white">{tmpl.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{w} × {d} {unitConfig.suffix} • {wallCount} walls • {furnCount} items{floorLabel}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteConfigModal;