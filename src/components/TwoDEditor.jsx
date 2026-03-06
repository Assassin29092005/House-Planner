import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Circle, Rect, Group, Text, Image as KonvaImage, Shape } from 'react-konva';
import useStore from '../store';
import { distanceToSegment, getNearestPointOnSegment, getWallLength, getWallMidpoint, getWallAngle, snapToAngle, findAlignmentGuides, getCollisions } from '../utils/geometry';
import { findRooms } from '../utils/roomDetection';
import { CONFIG } from '../constants';
import jsPDF from 'jspdf';

const TwoDEditor = ({ viewMode }) => {
  const store = useStore();
  const {
    walls, addWall, updateWall, selectWall, selectedWallId, updateWallAttribute, deleteWall,
    siteWidth, siteDepth, splitWallAtPoint, finalizeWall,
    undo, redo, past, future, updateWallTexture, loadProject,
    furniture, addFurniture, updateFurniture, deleteFurniture, duplicateObject,
    stairs, addStair, updateStair, deleteStair,
    pillars, addPillar, updatePillar, deletePillar,
    roomLabels, addRoomLabel, updateRoomLabel, deleteRoomLabel,
    levels, currentLevelId, setCurrentLevel, addLevel, deleteLevel,
    isStructureStable, gridSnap, toggleGridSnap, snapToGrid,
    convertUnit, convertArea, measurementUnit, addOpening, updateOpening, flipWallSides,
    selectedIds, toggleMultiSelect, clearMultiSelect, groupMove, groupDelete,
    backgroundImage, setBackgroundImage,
    versionHistory, saveVersion, restoreVersion, deleteVersion,
    roomTextures, setRoomTexture,
  } = store;

  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const bgInputRef = useRef(null);
  const activeWallIdRef = useRef(null);

  const [tool, setTool] = useState('SELECT');
  const [activeTexture, setActiveTexture] = useState('none');
  const [activeColor, setActiveColor] = useState('#94a3b8');
  const [paintSide, setPaintSide] = useState('both');
  const [stageScale, setStageScale] = useState(0.8);
  const [stagePos, setStagePos] = useState({ x: 50, y: 50 });
  const [snapPoint, setSnapPoint] = useState(null);
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [selectedObjectType, setSelectedObjectType] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetId: null, type: null });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const [editingLabel, setEditingLabel] = useState(null);
  const [containerW, setContainerW] = useState(800);
  const [containerH, setContainerH] = useState(600);
  const hasAutoFit = useRef(false);
  const [alignmentGuides, setAlignmentGuides] = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [bgImage, setBgImage] = useState(null);
  const [multiDragStart, setMultiDragStart] = useState(null);

  // Computed
  const visibleWalls = useMemo(() => walls.filter(w => w.levelId === currentLevelId), [walls, currentLevelId]);
  const detectedRooms = useMemo(() => findRooms(visibleWalls), [visibleWalls]);
  const collisions = useMemo(() => getCollisions(furniture, walls, currentLevelId), [furniture, walls, currentLevelId]);
  const isMultiSelected = (id) => selectedIds.some(e => e.id === id);

  // Load background image
  useEffect(() => {
    if (backgroundImage) {
      const img = new window.Image();
      img.src = backgroundImage;
      img.onload = () => setBgImage(img);
    } else {
      setBgImage(null);
    }
  }, [backgroundImage]);

  // RESIZE observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setContainerW(prev => Math.abs(prev - width) > 1 ? width : prev);
        setContainerH(prev => Math.abs(prev - height) > 1 ? height : prev);
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // AUTO-CENTERING (only runs once when siteWidth/siteDepth first become valid, or viewMode changes)
  useEffect(() => {
    if (siteWidth > 0 && siteDepth > 0 && containerW > 0 && containerH > 0) {
      const padding = 80;
      const scaleX = (containerW - padding * 2) / siteWidth;
      const scaleY = (containerH - padding * 2) / siteDepth;
      const initialScale = Math.min(scaleX, scaleY, 1.5);
      setStageScale(initialScale);
      setStagePos({ x: (containerW - siteWidth * initialScale) / 2, y: (containerH - siteDepth * initialScale) / 2 });
    }
  }, [siteWidth, siteDepth, viewMode]);

  // SAVE / LOAD / EXPORT
  const handleSave = useCallback(() => {
    const exportData = useStore.getState().getExportData();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'house-plan.json'; link.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportPNG = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const uri = stage.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.href = uri; link.download = 'house-plan.png'; link.click();
  }, []);

  const handleExportPDF = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const uri = stage.toDataURL({ pixelRatio: 2 });
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const imgW = pageW - margin * 2;
    const imgH = pageH - margin * 2 - 15;

    // Title
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('House Plan - Floor Layout', margin, margin);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleDateString()} | Unit: ${measurementUnit} | Scale: ${Math.round(stageScale * 100)}%`, margin, margin + 6);
    const siteWidthStr = convertUnit(siteWidth);
    const siteDepthStr = convertUnit(siteDepth);
    pdf.text(`Dimensions: ${siteWidthStr} × ${siteDepthStr}`, margin, margin + 10);

    pdf.addImage(uri, 'PNG', margin, margin + 15, imgW, imgH);

    // Wall schedule
    if (visibleWalls.length > 0) {
      pdf.addPage();
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Wall Schedule', margin, margin);
      let y = margin + 8;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      visibleWalls.forEach((w, i) => {
        const len = convertUnit(getWallLength(w));
        pdf.text(`Wall ${i + 1}: Length ${len}, Thickness ${w.thickness}px, Height ${w.height}px, Openings: ${w.openings.length}`, margin, y);
        y += 5;
        if (y > pageH - 10) { pdf.addPage(); y = margin; }
      });
    }

    pdf.save('house-plan.pdf');
  }, [visibleWalls, measurementUnit, stageScale, convertUnit, siteWidth, siteDepth]);

  const handleLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try { loadProject(JSON.parse(event.target.result)); } catch (err) { console.error("Invalid JSON", err); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setBackgroundImage(event.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // DROP HANDLER
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('assetType');
    if (!type || !stageRef.current) return;
    const stage = stageRef.current;
    const rect = stage.container().getBoundingClientRect();
    const x = (e.clientX - rect.left - stagePos.x) / stageScale;
    const y = (e.clientY - rect.top - stagePos.y) / stageScale;
    const clamped = { x: Math.max(20, Math.min(x, siteWidth - 20)), y: Math.max(20, Math.min(y, siteDepth - 20)) };

    if (type === 'pillar') addPillar(clamped.x, clamped.y);
    else if (type === 'stair') addStair(clamped.x, clamped.y);
    else if (type === 'label') addRoomLabel(clamped.x, clamped.y, 'Room', '0');
    else addFurniture(type, clamped.x, clamped.y);
  }, [stageScale, stagePos, siteWidth, siteDepth, addPillar, addStair, addRoomLabel, addFurniture]);

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '?') { setShowShortcuts(s => !s); return; }
      if (e.key.toLowerCase() === 'v') setTool('SELECT');
      if (e.key.toLowerCase() === 'w') setTool('DRAW');
      if (e.key.toLowerCase() === 'p') setTool('PAINT');
      if (e.key.toLowerCase() === 'g') toggleGridSnap();
      if (e.key === 'Escape') { selectWall(null); setSelectedObjectId(null); setSelectedObjectType(null); setShowShortcuts(false); clearMultiSelect(); setContextMenu(c => ({ ...c, visible: false })); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) { groupDelete(); return; }
        if (selectedWallId) deleteWall(selectedWallId);
        if (selectedObjectId) {
          if (selectedObjectType === 'furniture') deleteFurniture(selectedObjectId);
          else if (selectedObjectType === 'stair') deleteStair(selectedObjectId);
          else if (selectedObjectType === 'pillar') deletePillar(selectedObjectId);
          else if (selectedObjectType === 'label') deleteRoomLabel(selectedObjectId);
          setSelectedObjectId(null); setSelectedObjectType(null);
        }
      }
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.ctrlKey && e.key === 'e') { e.preventDefault(); handleExportPNG(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWallId, selectedObjectId, selectedObjectType, selectedIds, undo, redo, deleteWall, deleteFurniture, deleteStair, deletePillar, deleteRoomLabel, toggleGridSnap, handleSave, handleExportPNG, selectWall, clearMultiSelect, groupDelete]);

  // Canvas interaction
  const getLogicPos = (stage) => {
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(stage.getPointerPosition());
    return { x: Math.max(0, Math.min(pos.x, siteWidth)), y: Math.max(0, Math.min(pos.y, siteDepth)) };
  };

  const handleWallClick = (e, wallId) => {
    e.cancelBubble = true;
    if (tool === 'PAINT') {
      if (paintSide === 'both' || paintSide === 'A') { updateWallTexture(wallId, 'A', activeTexture); updateWallAttribute(wallId, 'colorSideA', activeColor); }
      if (paintSide === 'both' || paintSide === 'B') { updateWallTexture(wallId, 'B', activeTexture); updateWallAttribute(wallId, 'colorSideB', activeColor); }
    } else if (e.evt && e.evt.shiftKey) {
      toggleMultiSelect(wallId, 'wall');
    } else {
      selectWall(wallId); setSelectedObjectId(null); setSelectedObjectType(null); clearMultiSelect();
    }
  };

  const handleObjectClick = (e, id, type) => {
    e.cancelBubble = true;
    if (e.evt && e.evt.shiftKey) {
      toggleMultiSelect(id, type);
    } else {
      setSelectedObjectId(id); setSelectedObjectType(type); selectWall(null); clearMultiSelect();
    }
  };

  const handleMouseDown = (e) => {
    setContextMenu({ ...contextMenu, visible: false });
    const clickedTag = e.target.name();
    const stage = e.target.getStage();
    let pos = getLogicPos(stage);
    if (clickedTag === 'object') return;
    if (tool === 'SELECT' && clickedTag !== 'wall-line' && clickedTag !== 'wall-handle') {
      selectWall(null); setSelectedObjectId(null); setSelectedObjectType(null); clearMultiSelect(); return;
    }
    if (tool === 'DRAW') {
      pos = snapToGrid(pos);
      if (snapPoint) { pos = { x: snapPoint.x, y: snapPoint.y }; splitWallAtPoint(snapPoint.wallId, pos); }
      const id = addWall(pos);
      activeWallIdRef.current = id;
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const pos = getLogicPos(stage);
    const activeId = activeWallIdRef.current;
    if (activeId && tool === 'DRAW') {
      let snappedPos = snapToGrid(pos);
      const activeWall = walls.find(w => w.id === activeId);

      // Angle snapping
      if (activeWall) {
        const angleResult = snapToAngle(activeWall.start, snappedPos);
        snappedPos = angleResult.point;
      }

      // Wall endpoint snapping
      let foundSnap = null;
      walls.filter(w => w.levelId === currentLevelId && w.id !== activeId).forEach(wall => {
        if (distanceToSegment(snappedPos, wall.start, wall.end) < 15) {
          const nearest = getNearestPointOnSegment(snappedPos, wall.start, wall.end);
          foundSnap = { x: nearest.x, y: nearest.y, wallId: wall.id };
        }
      });

      // Alignment guides
      const guides = findAlignmentGuides(snappedPos, walls, currentLevelId, activeId);
      setAlignmentGuides(guides);
      if (guides.length > 0 && !foundSnap) {
        guides.forEach(g => {
          if (g.type === 'vertical') snappedPos.x = g.x;
          if (g.type === 'horizontal') snappedPos.y = g.y;
        });
      }

      updateWall(activeId, { end: foundSnap ? { x: foundSnap.x, y: foundSnap.y } : snappedPos });
      setSnapPoint(foundSnap);
    } else {
      setAlignmentGuides([]);
    }
  };

  const handleMouseUp = () => {
    if (activeWallIdRef.current) finalizeWall(activeWallIdRef.current);
    activeWallIdRef.current = null;
    setAlignmentGuides([]);
  };

  const handleWheel = (e) => { e.evt.preventDefault(); const s = e.evt.deltaY > 0 ? stageScale / 1.08 : stageScale * 1.08; setStageScale(Math.max(0.2, Math.min(5, s))); };

  const handleContextMenu = (e, targetId, type) => {
    e.evt.preventDefault();
    const pos = stageRef.current.getPointerPosition();
    setContextMenu({ visible: true, x: pos.x, y: pos.y, targetId, type });
  };

  const zoomTo = (factor) => setStageScale(Math.max(0.2, Math.min(5, stageScale * factor)));
  const fitToScreen = () => {
    const padding = 80;
    const scale = Math.min((containerW - padding * 2) / siteWidth, (containerH - padding * 2) / siteDepth, 1.5);
    setStageScale(scale); setStagePos({ x: (containerW - siteWidth * scale) / 2, y: (containerH - siteDepth * scale) / 2 });
  };

  const selectedWall = walls.find(w => w.id === selectedWallId);
  const selectedObject = selectedObjectId ? (furniture.find(f => f.id === selectedObjectId) || stairs.find(s => s.id === selectedObjectId) || pillars.find(p => p.id === selectedObjectId) || roomLabels.find(l => l.id === selectedObjectId)) : null;

  // Properties panel
  const getPropertiesContent = () => {
    if (selectedIds.length > 0) {
      return {
        title: `${selectedIds.length} Selected`, icon: '✦', props: [{ label: 'Items', value: selectedIds.length }], actions: [
          { label: 'Delete All', action: groupDelete, danger: true },
        ]
      };
    }
    if (selectedWall) {
      const len = getWallLength(selectedWall);
      return {
        title: 'Wall', icon: '🧱', props: [
          { label: 'Length', value: convertUnit(len) }, { label: 'Thickness', value: `${selectedWall.thickness}px` },
          { label: 'Openings', value: `${selectedWall.openings.length}` },
        ], actions: [
          { label: 'Add Door', action: () => addOpening(selectedWallId, 'door', len / 2) },
          { label: 'Add Window', action: () => addOpening(selectedWallId, 'window', len / 2) },
          { label: 'Flip Sides', action: () => flipWallSides(selectedWallId) },
          { label: 'Delete', action: () => deleteWall(selectedWallId), danger: true },
        ]
      };
    }
    if (selectedObject && selectedObjectType === 'furniture') {
      const icons = { bed: '🛏️', sofa: '🛋️', table: '🪑', desk: '🖥️', chair: '💺', toilet: '🚽', cupboard: '🗄️' };
      return {
        title: selectedObject.type.charAt(0).toUpperCase() + selectedObject.type.slice(1), icon: icons[selectedObject.type] || '📦', props: [
          { label: 'Size', value: `${selectedObject.width}×${selectedObject.height}` }, { label: 'Position', value: `${Math.round(selectedObject.x)}, ${Math.round(selectedObject.y)}` },
          { label: 'Rotation', value: `${selectedObject.rotation || 0}°` },
        ], actions: [
          { label: 'Rotate 90°', action: () => updateFurniture(selectedObjectId, { rotation: ((selectedObject.rotation || 0) + 90) % 360 }) },
          { label: 'Duplicate', action: () => duplicateObject(selectedObjectId, 'furniture') },
          { label: 'Delete', action: () => { deleteFurniture(selectedObjectId); setSelectedObjectId(null); }, danger: true },
        ]
      };
    }
    if (selectedObject && selectedObjectType === 'pillar') return { title: 'Pillar', icon: '🏛️', props: [{ label: 'Size', value: `${selectedObject.size}px` }], actions: [{ label: 'Delete', action: () => { deletePillar(selectedObjectId); setSelectedObjectId(null); }, danger: true }] };
    if (selectedObject && selectedObjectType === 'stair') return { title: 'Staircase', icon: '🪜', props: [{ label: 'Size', value: `${selectedObject.width}×${selectedObject.length}` }], actions: [{ label: 'Delete', action: () => { deleteStair(selectedObjectId); setSelectedObjectId(null); }, danger: true }] };
    return null;
  };

  const propertiesData = getPropertiesContent();

  return (
    <div ref={containerRef} className="h-full w-full bg-[#0f172a] relative overflow-hidden flex flex-col" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
      {/* TOOLBAR */}
      <div className="bg-[#1e293b] border-b border-[#334155] px-3 py-2 flex items-center justify-between gap-3 z-20 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex bg-[#0f172a] rounded-lg border border-[#334155] overflow-hidden">
            <button onClick={undo} disabled={past.length === 0} className="px-2.5 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-[#334155] disabled:opacity-20 transition-colors">↩</button>
            <button onClick={redo} disabled={future.length === 0} className="px-2.5 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-[#334155] disabled:opacity-20 transition-colors border-l border-[#334155]">↪</button>
          </div>
          {/* Save/Load/Export */}
          <div className="flex bg-[#0f172a] rounded-lg border border-[#334155] overflow-hidden">
            <button onClick={handleSave} title="Save JSON" className="px-2.5 py-1.5 text-[10px] text-slate-400 hover:text-white hover:bg-[#334155] transition-colors">💾</button>
            <button onClick={() => fileInputRef.current.click()} title="Load" className="px-2.5 py-1.5 text-[10px] text-slate-400 hover:text-white hover:bg-[#334155] transition-colors border-l border-[#334155]">📂</button>
            <button onClick={handleExportPNG} title="Export PNG" className="px-2.5 py-1.5 text-[10px] text-slate-400 hover:text-white hover:bg-[#334155] transition-colors border-l border-[#334155]">📸</button>
            <button onClick={handleExportPDF} title="Export PDF" className="px-2.5 py-1.5 text-[10px] text-slate-400 hover:text-white hover:bg-[#334155] transition-colors border-l border-[#334155]">📄</button>
            <button onClick={() => bgInputRef.current.click()} title="Import Floor Plan" className="px-2.5 py-1.5 text-[10px] text-slate-400 hover:text-white hover:bg-[#334155] transition-colors border-l border-[#334155]">🖼️</button>
            <button onClick={() => setShowVersions(!showVersions)} title="Version History" className="px-2.5 py-1.5 text-[10px] text-slate-400 hover:text-white hover:bg-[#334155] transition-colors border-l border-[#334155]">🕒</button>
            <input type="file" ref={fileInputRef} onChange={handleLoad} className="hidden" accept=".json" />
            <input type="file" ref={bgInputRef} onChange={handleBgUpload} className="hidden" accept="image/*" />
          </div>
          {/* Floor Selector */}
          <div className="flex items-center gap-2 border-l border-[#334155] pl-3">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Floor:</span>
            <select value={currentLevelId} onChange={(e) => setCurrentLevel(e.target.value)} className="bg-[#0f172a] border border-[#334155] text-slate-300 rounded-lg px-2 py-1.5 text-[11px] font-bold outline-none focus:border-blue-500">
              {levels.map(lvl => <option key={lvl.id} value={lvl.id}>{lvl.name}</option>)}
            </select>
            <button onClick={addLevel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1.5 rounded-lg text-[10px] font-black transition-colors">+</button>
            {levels.length > 1 && <button onClick={() => deleteLevel()} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-2 py-1.5 rounded-lg text-[10px] font-black transition-all">−</button>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${isStructureStable ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'}`}>
            {isStructureStable ? '✓ Stable' : '⚠ Unstable'}
          </div>
          <button onClick={toggleGridSnap} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${gridSnap ? 'bg-violet-600 text-white border-violet-500' : 'bg-[#0f172a] text-slate-400 border-[#334155] hover:text-white'}`}>⊞</button>
          {/* Multi-select count */}
          {selectedIds.length > 0 && (
            <div className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {selectedIds.length} selected
            </div>
          )}
          {/* Detected rooms count */}
          {detectedRooms.length > 0 && (
            <div className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {detectedRooms.length} rooms
            </div>
          )}
          {/* Tool buttons */}
          <div className="flex bg-[#0f172a] rounded-lg border border-[#334155] overflow-hidden">
            {[{ id: 'SELECT', label: '↖', tip: 'V' }, { id: 'DRAW', label: '✏', tip: 'W' }, { id: 'PAINT', label: '🎨', tip: 'P' }].map(t => (
              <button key={t.id} onClick={() => setTool(t.id)}
                className={`px-3.5 py-1.5 text-sm transition-all ${tool === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-white hover:bg-[#334155]'} ${t.id !== 'SELECT' ? 'border-l border-[#334155]' : ''}`}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowShortcuts(s => !s)} className="px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-300 text-[11px] font-bold transition-colors">⌨</button>
        </div>
      </div>

      {/* PAINT BAR */}
      {tool === 'PAINT' && (
        <div className="bg-[#1e293b] border-b border-[#334155] p-2 flex justify-center gap-4 items-center z-10 flex-shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Texture</span>
            <select value={activeTexture} onChange={(e) => setActiveTexture(e.target.value)} className="bg-[#0f172a] border border-[#334155] text-[11px] text-slate-300 rounded-lg px-2 py-1 outline-none focus:border-blue-500">
              <option value="none">Solid Color</option>
              {Object.keys(CONFIG.TEXTURES).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              {store.customTextures.map(ct => <option key={ct.id} value={ct.id}>✦ {ct.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Color</span>
            <div className="flex gap-1">
              {CONFIG.PAINT_COLORS.map(c => (
                <button key={c.hex} onClick={() => setActiveColor(c.hex)} title={c.name}
                  className={`w-6 h-6 rounded-md border-2 transition-all ${activeColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:border-slate-500'}`} style={{ backgroundColor: c.hex }} />
              ))}
            </div>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-[#334155]">
            {['both', 'A', 'B'].map(s => (
              <button key={s} onClick={() => setPaintSide(s)} className={`px-3 py-1 text-[9px] font-black uppercase ${paintSide === s ? 'bg-blue-600 text-white' : 'bg-[#0f172a] text-slate-400 hover:text-white'}`}>
                {s === 'both' ? 'Both' : `Side ${s}`}
              </button>
            ))}
          </div>
          <button onClick={() => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = 'image/*';
            input.onchange = (ev) => {
              const file = ev.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (e) => {
                const name = file.name.replace(/\.[^/.]+$/, '');
                const id = store.addCustomTexture(name, e.target.result);
                setActiveTexture(id);
              };
              reader.readAsDataURL(file);
            };
            input.click();
          }} className="px-3 py-1 rounded-lg text-[9px] font-black uppercase bg-violet-600/20 text-violet-400 border border-violet-500/30 hover:bg-violet-600/30 transition-colors">
            📤 Upload Design
          </button>
        </div>
      )}

      {/* CANVAS */}
      <div className="flex-grow relative overflow-hidden bg-[#0f172a] min-h-0">
        <Stage ref={stageRef} width={containerW} height={containerH}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel}
          scaleX={stageScale} scaleY={stageScale} x={stagePos.x} y={stagePos.y}
          draggable={tool === 'SELECT'} onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
          className={tool === 'SELECT' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}>
          <Layer>
            {/* Site background */}
            <Rect x={0} y={0} width={siteWidth} height={siteDepth} fill="#1e293b" cornerRadius={4} shadowBlur={30} shadowColor="#000" />

            {/* Background image for tracing */}
            {bgImage && <KonvaImage image={bgImage} x={0} y={0} width={siteWidth} height={siteDepth} opacity={0.3} />}

            {/* Grid */}
            {[...Array(Math.floor(siteWidth / CONFIG.GRID_SIZE) + 1)].map((_, i) => (
              <Line key={`v-${i}`} points={[i * CONFIG.GRID_SIZE, 0, i * CONFIG.GRID_SIZE, siteDepth]} stroke="#334155" strokeWidth={0.5} opacity={0.5} />
            ))}
            {[...Array(Math.floor(siteDepth / CONFIG.GRID_SIZE) + 1)].map((_, i) => (
              <Line key={`h-${i}`} points={[0, i * CONFIG.GRID_SIZE, siteWidth, i * CONFIG.GRID_SIZE]} stroke="#334155" strokeWidth={0.5} opacity={0.5} />
            ))}

            {/* Site boundary */}
            <Rect x={0} y={0} width={siteWidth} height={siteDepth} fill="transparent" stroke="#475569" strokeWidth={2} dash={[8, 4]} />
            <Text x={siteWidth / 2 - 30} y={-20} text={convertUnit(siteWidth)} fontSize={11} fontFamily="Inter" fontStyle="bold" fill="#64748b" />
            <Text x={-45} y={siteDepth / 2 - 6} text={convertUnit(siteDepth)} fontSize={11} fontFamily="Inter" fontStyle="bold" fill="#64748b" />

            {/* DETECTED ROOMS */}
            {detectedRooms.map((room, idx) => {
              const flatPoints = room.points.flatMap(p => [p.x, p.y]);
              const texKey = roomTextures[idx] || 'none';
              const floorTex = CONFIG.FLOOR_TEXTURES[texKey];
              return (
                <Group key={`room-${idx}`}>
                  <Line points={flatPoints} closed fill={floorTex && texKey !== 'none' ? floorTex.color + '40' : CONFIG.ROOM_COLORS[idx % CONFIG.ROOM_COLORS.length]} stroke="transparent" />
                  <Text x={room.centroid.x - 30} y={room.centroid.y - 10} text={convertArea(room.area)} fontSize={10} fontFamily="Inter" fontStyle="600" fill="#64748b" />
                </Group>
              );
            })}

            {/* WALLS */}
            {visibleWalls.map((wall) => {
              const isSelected = wall.id === selectedWallId;
              const isMulti = isMultiSelected(wall.id);
              const len = getWallLength(wall);
              const mid = getWallMidpoint(wall);
              const angle = getWallAngle(wall);
              const textRotation = (angle > 90 || angle < -90) ? angle + 180 : angle;
              return (
                <Group key={wall.id}>
                  <Line name="wall-line" points={[wall.start.x, wall.start.y, wall.end.x, wall.end.y]}
                    stroke={isMulti ? '#f59e0b' : isSelected ? CONFIG.COLOR_SELECTED : '#94a3b8'}
                    strokeWidth={wall.thickness} hitStrokeWidth={20} lineCap="round"
                    shadowColor={isSelected ? '#3b82f6' : isMulti ? '#f59e0b' : 'transparent'} shadowBlur={isSelected || isMulti ? 12 : 0}
                    onClick={(e) => handleWallClick(e, wall.id)}
                    onContextMenu={(e) => handleContextMenu(e, wall.id, 'wall')} />
                  {/* Openings */}
                  {wall.openings.map((opening, oidx) => {
                    if (len === 0) return null;
                    const clampedDist = Math.min(Math.max(opening.dist, opening.width / 2), len - opening.width / 2);
                    const ratio = clampedDist / len;
                    const wdx = wall.end.x - wall.start.x, wdy = wall.end.y - wall.start.y;
                    const ox = wall.start.x + wdx * ratio, oy = wall.start.y + wdy * ratio;
                    const hw = (opening.width / 2 / len);
                    return (
                      <Group key={opening.id || oidx} draggable x={0} y={0}
                        onDragMove={(e) => {
                          const px = e.target.x() + ox, py = e.target.y() + oy;
                          const t = Math.max(0, Math.min(1, ((px - wall.start.x) * wdx + (py - wall.start.y) * wdy) / (len * len)));
                          const newDist = Math.max(opening.width / 2, Math.min(t * len, len - opening.width / 2));
                          const snappedX = wall.start.x + wdx * (newDist / len);
                          const snappedY = wall.start.y + wdy * (newDist / len);
                          e.target.x(snappedX - ox); e.target.y(snappedY - oy);
                        }}
                        onDragEnd={(e) => {
                          const px = e.target.x() + ox, py = e.target.y() + oy;
                          const t = Math.max(0, Math.min(1, ((px - wall.start.x) * wdx + (py - wall.start.y) * wdy) / (len * len)));
                          const newDist = Math.max(opening.width / 2, Math.min(t * len, len - opening.width / 2));
                          updateOpening(wall.id, opening.id, { dist: newDist });
                          e.target.x(0); e.target.y(0);
                        }}>
                        <Line points={[wall.start.x + wdx * (ratio - hw), wall.start.y + wdy * (ratio - hw), wall.start.x + wdx * (ratio + hw), wall.start.y + wdy * (ratio + hw)]}
                          stroke={opening.type === 'door' ? '#f59e0b' : '#38bdf8'} strokeWidth={wall.thickness + 4} lineCap="round" opacity={0.7} />
                        <Text x={ox - 8} y={oy - wall.thickness - 12} text={opening.type === 'door' ? '🚪' : '🪟'} fontSize={12} />
                      </Group>
                    );
                  })}
                  {/* Dimension */}
                  {len > 30 && <Text x={mid.x} y={mid.y} offsetX={25} offsetY={wall.thickness + 10} text={convertUnit(len)} fontSize={9} fontFamily="Inter" fontStyle="600" fill={isSelected ? '#93c5fd' : '#64748b'} rotation={textRotation} />}
                  {/* Handles */}
                  {isSelected && (<>
                    <Circle name="wall-handle" x={wall.start.x} y={wall.start.y} radius={7} fill="#3b82f6" stroke="white" strokeWidth={2} draggable shadowColor="#3b82f6" shadowBlur={8}
                      onDragMove={(e) => { const pos = snapToGrid({ x: e.target.x(), y: e.target.y() }); e.target.position(pos); updateWall(wall.id, { start: pos }); }} onDragEnd={() => finalizeWall(wall.id)} />
                    <Circle name="wall-handle" x={wall.end.x} y={wall.end.y} radius={7} fill="#3b82f6" stroke="white" strokeWidth={2} draggable shadowColor="#3b82f6" shadowBlur={8}
                      onDragMove={(e) => { const pos = snapToGrid({ x: e.target.x(), y: e.target.y() }); e.target.position(pos); updateWall(wall.id, { end: pos }); }} onDragEnd={() => finalizeWall(wall.id)} />
                  </>)}
                </Group>
              );
            })}

            {/* ALIGNMENT GUIDES */}
            {alignmentGuides.map((guide, i) => (
              guide.type === 'vertical'
                ? <Line key={`guide-${i}`} points={[guide.x, guide.fromY - 50, guide.x, guide.toY + 50]} stroke="#3b82f6" strokeWidth={0.5} dash={[6, 3]} opacity={0.7} />
                : <Line key={`guide-${i}`} points={[guide.fromX - 50, guide.y, guide.toX + 50, guide.y]} stroke="#3b82f6" strokeWidth={0.5} dash={[6, 3]} opacity={0.7} />
            ))}

            {/* PILLARS */}
            {pillars.filter(p => p.levelId === currentLevelId).map(p => (
              <Group key={p.id} name="object" draggable x={p.x} y={p.y}
                onClick={(e) => handleObjectClick(e, p.id, 'pillar')}
                onDragEnd={(e) => updatePillar(p.id, { x: e.target.x(), y: e.target.y() })}
                onContextMenu={(e) => handleContextMenu(e, p.id, 'pillar')}>
                <Rect width={p.size} height={p.size} fill={CONFIG.COLOR_PILLAR} stroke={isMultiSelected(p.id) ? '#f59e0b' : selectedObjectId === p.id ? '#3b82f6' : '#1e293b'} strokeWidth={selectedObjectId === p.id || isMultiSelected(p.id) ? 3 : 2} cornerRadius={2}
                  shadowColor={selectedObjectId === p.id ? '#3b82f6' : 'transparent'} shadowBlur={selectedObjectId === p.id ? 8 : 0} />
              </Group>
            ))}

            {/* FURNITURE */}
            {furniture.filter(f => f.levelId === currentLevelId).map(f => {
              const icons = { bed: '🛏️', sofa: '🛋️', table: '🪑', desk: '🖥️', chair: '💺', toilet: '🚽', cupboard: '🗄️' };
              const colors = { bed: { fill: '#1e3a5f', stroke: '#3b82f6' }, sofa: { fill: '#3b1f2b', stroke: '#e11d48' }, table: { fill: '#1a2e1a', stroke: '#22c55e' }, desk: { fill: '#2d1b4e', stroke: '#8b5cf6' }, chair: { fill: '#2d2410', stroke: '#f59e0b' }, toilet: { fill: '#1e293b', stroke: '#e2e8f0' }, cupboard: { fill: '#2d1b0e', stroke: '#a16207' } };
              const c = colors[f.type] || { fill: '#1e293b', stroke: '#64748b' };
              const hasCollision = collisions.has(f.id);
              return (
                <Group key={f.id} name="object" draggable x={f.x} y={f.y} rotation={f.rotation || 0}
                  onClick={(e) => handleObjectClick(e, f.id, 'furniture')}
                  onDragEnd={(e) => updateFurniture(f.id, { x: e.target.x(), y: e.target.y() })}
                  onContextMenu={(e) => handleContextMenu(e, f.id, 'furniture')}>
                  <Rect width={f.width} height={f.height} offsetX={f.width / 2} offsetY={f.height / 2}
                    fill={c.fill} stroke={hasCollision ? '#ef4444' : isMultiSelected(f.id) ? '#f59e0b' : selectedObjectId === f.id ? '#3b82f6' : c.stroke}
                    strokeWidth={hasCollision ? 3 : selectedObjectId === f.id || isMultiSelected(f.id) ? 3 : 1.5} cornerRadius={4}
                    shadowColor={hasCollision ? '#ef4444' : selectedObjectId === f.id ? '#3b82f6' : 'transparent'} shadowBlur={hasCollision || selectedObjectId === f.id ? 8 : 0} />
                  <Text text={icons[f.type] || '📦'} fontSize={14} offsetX={7} offsetY={7} />
                </Group>
              );
            })}

            {/* STAIRS */}
            {stairs.filter(s => s.levelId === currentLevelId).map(s => (
              <Group key={s.id} name="object" draggable x={s.x} y={s.y}
                onClick={(e) => handleObjectClick(e, s.id, 'stair')}
                onDragEnd={(e) => updateStair(s.id, { x: e.target.x(), y: e.target.y() })}
                onContextMenu={(e) => handleContextMenu(e, s.id, 'stair')}>
                <Rect width={s.width} height={s.length} offsetX={s.width / 2} offsetY={s.length / 2} fill="#2d2410" stroke={selectedObjectId === s.id ? '#3b82f6' : '#f59e0b'} strokeWidth={selectedObjectId === s.id ? 3 : 1.5} />
                {[...Array(6)].map((_, i) => <Line key={i} points={[-s.width / 2, -s.length / 2 + (i + 1) * (s.length / 7), s.width / 2, -s.length / 2 + (i + 1) * (s.length / 7)]} stroke="#f59e0b" strokeWidth={0.5} opacity={0.5} />)}
                <Text text="🪜" fontSize={12} offsetX={6} offsetY={6} />
              </Group>
            ))}

            {/* ROOM LABELS */}
            {roomLabels.filter(l => l.levelId === currentLevelId).map(label => (
              <Group key={label.id} name="object" draggable x={label.x} y={label.y}
                onClick={(e) => handleObjectClick(e, label.id, 'label')}
                onDblClick={() => setEditingLabel(label.id)}
                onDragEnd={(e) => updateRoomLabel(label.id, { x: e.target.x(), y: e.target.y() })}
                onContextMenu={(e) => handleContextMenu(e, label.id, 'label')}>
                <Text text={label.name} fontSize={14} fontFamily="Inter" fontStyle="bold" fill={selectedObjectId === label.id ? '#93c5fd' : '#94a3b8'} offsetX={label.name.length * 3.5} offsetY={7} />
              </Group>
            ))}

            {/* SNAP INDICATOR */}
            {snapPoint && <Circle x={snapPoint.x} y={snapPoint.y} radius={8} fill="transparent" stroke="#22c55e" strokeWidth={2} dash={[4, 2]} />}
          </Layer>
        </Stage>

        {/* Zoom controls */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1 z-30">
          <button onClick={() => zoomTo(1.3)} className="w-8 h-8 bg-[#1e293b] border border-[#334155] rounded-lg text-slate-400 hover:text-white text-sm font-bold transition-colors flex items-center justify-center">+</button>
          <button onClick={() => zoomTo(0.7)} className="w-8 h-8 bg-[#1e293b] border border-[#334155] rounded-lg text-slate-400 hover:text-white text-sm font-bold transition-colors flex items-center justify-center">−</button>
          <button onClick={fitToScreen} className="w-8 h-8 bg-[#1e293b] border border-[#334155] rounded-lg text-slate-400 hover:text-white text-[10px] font-bold transition-colors flex items-center justify-center">⊡</button>
        </div>
        <div className="absolute bottom-4 left-14 bg-[#1e293b]/80 border border-[#334155] rounded-lg px-2 py-1 text-[10px] text-slate-500 font-bold z-30">{Math.round(stageScale * 100)}%</div>

        {/* Properties Panel */}
        {showProperties && propertiesData && (
          <div className="absolute top-2 right-2 w-56 bg-[#1e293b] border border-[#334155] rounded-xl shadow-2xl z-30 animate-fade-in overflow-hidden">
            <div className="bg-[#0f172a] px-3 py-2 border-b border-[#334155] flex items-center justify-between">
              <div className="flex items-center gap-2"><span className="text-sm">{propertiesData.icon}</span><span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">{propertiesData.title}</span></div>
              <button onClick={() => { selectWall(null); setSelectedObjectId(null); setSelectedObjectType(null); clearMultiSelect(); }} className="text-slate-500 hover:text-white text-xs">✕</button>
            </div>
            <div className="p-3 space-y-2">
              {propertiesData.props.map((prop, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{prop.label}</span>
                  <span className="text-[11px] text-slate-300 font-bold">{prop.value}</span>
                </div>
              ))}
            </div>
            {propertiesData.actions && (
              <div className="border-t border-[#334155] p-2 flex flex-wrap gap-1">
                {propertiesData.actions.map((a, i) => (
                  <button key={i} onClick={a.action} className={`px-2 py-1 rounded text-[9px] font-black uppercase transition-colors ${a.danger ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' : 'bg-[#0f172a] text-slate-400 hover:text-white border border-[#334155] hover:border-slate-500'}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VERSION HISTORY */}
        {showVersions && (
          <div className="absolute top-2 left-14 w-60 bg-[#1e293b] border border-[#334155] rounded-xl shadow-2xl z-40 animate-fade-in overflow-hidden max-h-[80%] flex flex-col">
            <div className="bg-[#0f172a] px-3 py-2 border-b border-[#334155] flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">🕒 Versions</span>
              <button onClick={() => setShowVersions(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
            </div>
            <div className="p-2 flex-shrink-0">
              <button onClick={() => saveVersion()} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors">
                + Save Current Version
              </button>
            </div>
            <div className="overflow-y-auto flex-grow p-2 space-y-1">
              {versionHistory.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No versions saved</p>
              ) : (
                [...versionHistory].reverse().map((v, ri) => {
                  const idx = versionHistory.length - 1 - ri;
                  return (
                    <div key={idx} className="bg-[#0f172a] rounded-lg p-2 border border-[#334155] hover:border-blue-500/30 transition-colors">
                      <div className="text-xs text-slate-200 font-bold">{v.name}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{new Date(v.timestamp).toLocaleString()}</div>
                      <div className="flex gap-1 mt-1.5">
                        <button onClick={() => { restoreVersion(idx); setShowVersions(false); }} className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded text-[9px] font-bold hover:bg-blue-600/30">Restore</button>
                        <button onClick={() => deleteVersion(idx)} className="px-2 py-0.5 bg-red-600/20 text-red-400 rounded text-[9px] font-bold hover:bg-red-600/30">Delete</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* CONTEXT MENU */}
      {contextMenu.visible && (
        <div className="fixed bg-[#1e293b] border border-[#334155] shadow-2xl rounded-xl overflow-hidden z-[100] flex flex-col w-40 animate-fade-in" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button className="text-[10px] font-bold p-2.5 text-left text-slate-300 hover:bg-[#334155] uppercase flex items-center gap-2 transition-colors" onClick={() => {
            if (contextMenu.type === 'wall') deleteWall(contextMenu.targetId);
            else if (contextMenu.type === 'furniture') deleteFurniture(contextMenu.targetId);
            else if (contextMenu.type === 'stair') deleteStair(contextMenu.targetId);
            else if (contextMenu.type === 'pillar') deletePillar(contextMenu.targetId);
            else if (contextMenu.type === 'label') deleteRoomLabel(contextMenu.targetId);
            setContextMenu({ ...contextMenu, visible: false });
          }}><span>🗑️</span> Delete</button>
          {contextMenu.type !== 'label' && (
            <button className="text-[10px] font-bold p-2.5 text-left text-slate-300 hover:bg-[#334155] uppercase border-t border-[#334155] flex items-center gap-2 transition-colors"
              onClick={() => { duplicateObject(contextMenu.targetId, contextMenu.type); setContextMenu({ ...contextMenu, visible: false }); }}>
              <span>📋</span> Duplicate
            </button>
          )}
          {contextMenu.type === 'furniture' && (
            <button className="text-[10px] font-bold p-2.5 text-left text-slate-300 hover:bg-[#334155] uppercase border-t border-[#334155] flex items-center gap-2 transition-colors"
              onClick={() => { const f = furniture.find(x => x.id === contextMenu.targetId); if (f) updateFurniture(contextMenu.targetId, { rotation: ((f.rotation || 0) + 90) % 360 }); setContextMenu({ ...contextMenu, visible: false }); }}>
              <span>🔄</span> Rotate 90°
            </button>
          )}
          {contextMenu.type === 'wall' && (<>
            <button className="text-[10px] font-bold p-2.5 text-left text-slate-300 hover:bg-[#334155] uppercase border-t border-[#334155] flex items-center gap-2 transition-colors"
              onClick={() => { const w = walls.find(x => x.id === contextMenu.targetId); if (w) addOpening(contextMenu.targetId, 'door', getWallLength(w) / 2); setContextMenu({ ...contextMenu, visible: false }); }}>
              <span>🚪</span> Add Door
            </button>
            <button className="text-[10px] font-bold p-2.5 text-left text-slate-300 hover:bg-[#334155] uppercase border-t border-[#334155] flex items-center gap-2 transition-colors"
              onClick={() => { const w = walls.find(x => x.id === contextMenu.targetId); if (w) addOpening(contextMenu.targetId, 'window', getWallLength(w) / 2); setContextMenu({ ...contextMenu, visible: false }); }}>
              <span>🪟</span> Add Window
            </button>
          </>)}
        </div>
      )}

      {/* SHORTCUTS OVERLAY */}
      {showShortcuts && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center" onClick={() => setShowShortcuts(false)}>
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 w-80 animate-fade-in shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">⌨ Keyboard Shortcuts</h3>
            <div className="space-y-2">
              {CONFIG.SHORTCUTS.map(s => (
                <div key={s.key} className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">{s.label}</span>
                  <kbd className="bg-[#0f172a] border border-[#475569] text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono font-bold">{s.key}</kbd>
                </div>
              ))}
            </div>
            <button onClick={() => setShowShortcuts(false)} className="mt-4 w-full bg-[#0f172a] border border-[#334155] text-slate-400 hover:text-white py-2 rounded-lg text-xs font-bold transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* LABEL EDIT MODAL */}
      {editingLabel && (() => {
        const label = roomLabels.find(l => l.id === editingLabel);
        if (!label) return null;
        return (
          <div className="absolute inset-0 bg-black/50 z-[200] flex items-center justify-center" onClick={() => setEditingLabel(null)}>
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 w-64 animate-fade-in" onClick={e => e.stopPropagation()}>
              <h4 className="text-sm font-black text-white mb-3">Edit Room Label</h4>
              <input autoFocus defaultValue={label.name} className="w-full bg-[#0f172a] border border-[#334155] text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 mb-2"
                onKeyDown={(e) => { if (e.key === 'Enter') { updateRoomLabel(editingLabel, { name: e.target.value }); setEditingLabel(null); } }} />
              <button onClick={() => setEditingLabel(null)} className="w-full bg-blue-600 text-white py-1.5 rounded-lg text-xs font-bold mt-1">Done</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default TwoDEditor;