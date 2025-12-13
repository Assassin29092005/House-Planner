import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line, Circle, Rect, Text, Group, Arc } from 'react-konva';
import useStore from '../store';
import { distanceToSegment, getNearestPointOnSegment } from '../utils/geometry';

const TwoDEditor = () => {
  const { 
    walls, addWall, updateWall, selectWall, selectedWallId, 
    siteWidth, siteDepth, splitWallAtPoint, finalizeWall,
    roomLabels, addRoomLabel, updateLabelName,
    undo, redo, resetCanvas, past, future,
    addOpening, updateWallTexture,
    furniture, addFurniture, updateFurnitureRotation, deleteFurniture,
    stairs, addStair, updateStairRotation, deleteStair,
    levels, currentLevelId, setCurrentLevel, addLevel, deleteLevel,
    loadProject
  } = useStore();

  const fileInputRef = useRef(null);
  const [activeWallId, setActiveWallId] = useState(null);
  const [tool, setTool] = useState('DRAW'); 
  const [furnishType, setFurnishType] = useState('bed');
  const [activeTexture, setActiveTexture] = useState('brick');
  const [paintSide, setPaintSide] = useState('both');
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [snapPoint, setSnapPoint] = useState(null);
  const [ghostOpening, setGhostOpening] = useState(null);
  const [cursorPos, setCursorPos] = useState(null);

  const visibleWalls = walls.filter(w => w.levelId === currentLevelId);
  const visibleFurniture = furniture.filter(f => f.levelId === currentLevelId);
  const visibleLabels = roomLabels.filter(l => l.levelId === currentLevelId);
  const visibleStairs = stairs.filter(s => s.levelId === currentLevelId);
  const ghostWalls = currentLevelId > 0 ? walls.filter(w => w.levelId === currentLevelId - 1) : [];

  useEffect(() => {
    if (siteWidth > 0) {
      const padding = 50;
      const availableWidth = window.innerWidth / 2;
      const availableHeight = window.innerHeight - 100;
      const scale = Math.min((availableWidth - padding*2)/siteWidth, (availableHeight - padding*2)/siteDepth, 1);
      setStageScale(scale);
      setStagePos({ x: (availableWidth - siteWidth * scale) / 2, y: (availableHeight - siteDepth * scale) / 2 });
    }
  }, [siteWidth, siteDepth]);

  const handleSave = () => {
    const state = useStore.getState();
    const data = {
      version: 1, date: new Date().toISOString(),
      siteWidth: state.siteWidth, siteDepth: state.siteDepth,
      levels: state.levels, currentLevelId: state.currentLevelId,
      walls: state.walls, furniture: state.furniture, stairs: state.stairs, roomLabels: state.roomLabels
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `house-project-${Date.now()}.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try { loadProject(JSON.parse(event.target.result)); alert("Project Loaded Successfully!"); } 
      catch (err) { alert("Failed to load: " + err.message); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getLogicPos = (stage) => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = transform.point(stage.getPointerPosition());
    return { x: Math.max(0, Math.min(pos.x, siteWidth)), y: Math.max(0, Math.min(pos.y, siteDepth)) };
  };

  const getRoomDimensions = (px, py) => {
    let leftX = 0, rightX = siteWidth, topY = 0, bottomY = siteDepth;
    const getIntersection = (p1, p2, rayStart, isVertical) => {
        const wx1 = Math.min(p1.x, p2.x), wx2 = Math.max(p1.x, p2.x);
        const wy1 = Math.min(p1.y, p2.y), wy2 = Math.max(p1.y, p2.y);
        if (isVertical) { if (Math.abs(p1.y - p2.y) < 1 && rayStart.x >= wx1 && rayStart.x <= wx2) return p1.y; } 
        else { if (Math.abs(p1.x - p2.x) < 1 && rayStart.y >= wy1 && rayStart.y <= wy2) return p1.x; }
        return null;
    };
    visibleWalls.forEach(w => {
        const hitX = getIntersection(w.start, w.end, {x: px, y: py}, false);
        if (hitX !== null) { if (hitX < px && hitX > leftX) leftX = hitX; if (hitX > px && hitX < rightX) rightX = hitX; }
        const hitY = getIntersection(w.start, w.end, {x: px, y: py}, true);
        if (hitY !== null) { if (hitY < py && hitY > topY) topY = hitY; if (hitY > py && hitY < bottomY) bottomY = hitY; }
    });
    const SCALE = 20; const wFt = Math.round((rightX - leftX) / SCALE); const dFt = Math.round((bottomY - topY) / SCALE);
    return `${wFt}' x ${dFt}' (${wFt * dFt} sq ft)`;
  };

  const handleMouseDown = (e) => {
    const clickedTag = e.target.name();
    const stage = e.target.getStage();
    let pos = getLogicPos(stage);

    if (clickedTag === 'furniture-item' || clickedTag === 'stair-item') return;
    
    if (tool === 'PAINT') {
        if (clickedTag === 'wall-line') {
            let clickedWall = null;
            visibleWalls.forEach(w => { if (distanceToSegment(pos, w.start, w.end) < 10) clickedWall = w; });
            if (clickedWall) {
                if (paintSide === 'both' || paintSide === 'A') updateWallTexture(clickedWall.id, 'A', activeTexture);
                if (paintSide === 'both' || paintSide === 'B') updateWallTexture(clickedWall.id, 'B', activeTexture);
            }
        }
        return;
    }

    if (tool === 'LABEL') { 
      if (clickedTag !== 'label-text') { 
        const name = prompt("Room Name:", `Room ${visibleLabels.length + 1}`);
        if (name) addRoomLabel(pos.x, pos.y, name, getRoomDimensions(pos.x, pos.y));
        setTool('SELECT'); 
      } return; 
    }
    if (tool === 'STAIR') { addStair(pos.x, pos.y); setTool('SELECT'); return; }
    if (tool === 'FURNISH') { addFurniture(furnishType, pos.x, pos.y); setTool('SELECT'); return; }
    if (tool === 'SELECT') { if (clickedTag!=='wall-line' && clickedTag!=='label-text') selectWall(null); return; }
    if (tool === 'WINDOW' || tool === 'DOOR') { if (ghostOpening && ghostOpening.wallId) { addOpening(ghostOpening.wallId, tool === 'WINDOW'?'window':'door', ghostOpening.distRatio); setTool('SELECT'); } return; }
    if (tool === 'DRAW') { if (clickedTag === 'label-text') return; if (snapPoint) { pos = { x: snapPoint.x, y: snapPoint.y }; splitWallAtPoint(snapPoint.wallId, pos); const id = addWall(pos); setActiveWallId(id); setSnapPoint(null); return; } if (clickedTag !== 'wall-line') { const id = addWall(pos); setActiveWallId(id); } }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage(); const pos = getLogicPos(stage); setCursorPos(pos);
    if (activeWallId) { 
      if (tool === 'DRAW') {
        let foundSnap = null;
        visibleWalls.forEach(wall => { if (wall.id === activeWallId) return; if (distanceToSegment(pos, wall.start, wall.end) < 15) { const nearest = getNearestPointOnSegment(pos, wall.start, wall.end); foundSnap = { x: nearest.x, y: nearest.y, wallId: wall.id }; } });
        if (foundSnap) { updateWall(activeWallId, foundSnap); setSnapPoint(foundSnap); } else { updateWall(activeWallId, pos); setSnapPoint(null); }
      } return; 
    }
    if (tool === 'DRAW') { let foundSnap = null; visibleWalls.forEach(wall => { if (distanceToSegment(pos, wall.start, wall.end) < 15) { const nearest = getNearestPointOnSegment(pos, wall.start, wall.end); foundSnap = { x: nearest.x, y: nearest.y, wallId: wall.id }; } }); setSnapPoint(foundSnap); } 
    else if (tool === 'WINDOW' || tool === 'DOOR') { setSnapPoint(null); let foundGhost = null; visibleWalls.forEach(wall => { if (distanceToSegment(pos, wall.start, wall.end) < 20) { const nearest = getNearestPointOnSegment(pos, wall.start, wall.end); const totalLen = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y); const distFromStart = Math.hypot(nearest.x - wall.start.x, nearest.y - wall.start.y); foundGhost = { x: nearest.x, y: nearest.y, wallId: wall.id, distRatio: distFromStart / totalLen, angle: Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) }; } }); setGhostOpening(foundGhost); }
  };
  const handleMouseUp = () => { if (activeWallId && tool === 'DRAW') { if (snapPoint) { updateWall(activeWallId, { x: snapPoint.x, y: snapPoint.y }); splitWallAtPoint(snapPoint.wallId, { x: snapPoint.x, y: snapPoint.y }); } else { finalizeWall(activeWallId); } } setActiveWallId(null); setSnapPoint(null); };
  
  const btnClass = (isActive) => `flex-1 px-3 py-2 text-sm font-bold border-r border-gray-400 transition-colors ${isActive ? 'bg-slate-900 text-white' : 'bg-white text-gray-900 hover:bg-gray-200'}`;
  const getWallAngle = (start, end) => { let a = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI; if (a < 0) a += 360; return a; };
  const getWallLength = (start, end) => Math.hypot(end.x - start.x, end.y - start.y).toFixed(0);

  if (!siteWidth) return <div className="h-full bg-gray-200"></div>;

  return (
    <div className="h-full bg-slate-100 relative overflow-hidden flex flex-col">
      <div className="bg-white border-b border-gray-400 p-2 flex items-center justify-between gap-4">
        <div className="flex bg-white rounded border border-gray-500 overflow-hidden">
          <button onClick={undo} disabled={past.length===0} className="px-3 py-1 text-lg border-r border-gray-400 hover:bg-gray-100 disabled:text-gray-300 text-black font-bold">↩</button>
          <button onClick={redo} disabled={future.length===0} className="px-3 py-1 text-lg hover:bg-gray-100 disabled:text-gray-300 text-black font-bold">↪</button>
        </div>
        <div className="flex gap-2">
           <button onClick={handleSave} className="bg-blue-600 text-white px-3 py-1 rounded shadow text-sm font-bold">💾 Save</button>
           <input type="file" ref={fileInputRef} onChange={handleLoad} style={{display:'none'}} accept=".json" />
           <button onClick={() => fileInputRef.current.click()} className="bg-gray-700 text-white px-3 py-1 rounded shadow text-sm font-bold">📂 Load</button>
        </div>
        <div className="flex items-center gap-2 border-l pl-4 border-gray-300">
           <span className="text-xs font-bold uppercase">Floor:</span>
           <select value={currentLevelId} onChange={(e) => setCurrentLevel(e.target.value)} className="border rounded px-2 py-1 text-sm font-bold">
             {levels.map(lvl => ( <option key={lvl.id} value={lvl.id}>{lvl.name}</option> ))}
           </select>
           <button onClick={addLevel} className="bg-green-700 text-white px-2 py-1 rounded shadow-sm text-xs font-bold">+ Add</button>
           <button onClick={() => { if(confirm('Delete floor?')) deleteLevel() }} className="bg-red-100 text-red-700 border border-red-300 px-2 py-1 rounded shadow-sm text-xs font-bold">🗑</button>
        </div>
        <button onClick={()=>{if(confirm('Reset?')) resetCanvas()}} className="ml-auto text-red-600 text-xs font-bold border border-red-300 px-2 py-1 rounded bg-red-50">Reset</button>
      </div>

      <div className="bg-gray-50 border-b border-gray-400 flex shadow-inner">
        <button onClick={() => setTool('SELECT')} className={btnClass(tool === 'SELECT')}>👆 Select</button>
        <button onClick={() => setTool('DRAW')} className={btnClass(tool === 'DRAW')}>✏️ Wall</button>
        <button onClick={() => setTool('PAINT')} className={btnClass(tool === 'PAINT')}>🖌️ Paint</button>
        <button onClick={() => setTool('STAIR')} className={btnClass(tool === 'STAIR')}>🪜 Stair</button>
        <button onClick={() => setTool('WINDOW')} className={btnClass(tool === 'WINDOW')}>🪟 Window</button>
        <button onClick={() => setTool('DOOR')} className={btnClass(tool === 'DOOR')}>🚪 Door</button>
        <button onClick={() => setTool('FURNISH')} className={btnClass(tool === 'FURNISH')}>🪑 Furnish</button> 
        <button onClick={() => setTool('LABEL')} className={btnClass(tool === 'LABEL')}>🏷️ Label</button>
      </div>

      {tool === 'PAINT' && (
         <div className="bg-slate-900 p-2 flex justify-center gap-4 text-white items-center">
            <button onClick={() => setActiveTexture('brick')} className={`px-3 py-1 rounded text-sm font-bold ${activeTexture==='brick'?'bg-orange-600':'hover:bg-slate-700'}`}>🧱 Brick</button>
            <button onClick={() => setActiveTexture('wood')} className={`px-3 py-1 rounded text-sm font-bold ${activeTexture==='wood'?'bg-yellow-700':'hover:bg-slate-700'}`}>🪵 Wood</button>
            <button onClick={() => setActiveTexture('tile')} className={`px-3 py-1 rounded text-sm font-bold ${activeTexture==='tile'?'bg-blue-500':'hover:bg-slate-700'}`}>⬜ Tile</button>
            <button onClick={() => setActiveTexture('none')} className={`px-3 py-1 rounded text-sm font-bold ${activeTexture==='none'?'bg-gray-500':'hover:bg-slate-700'}`}>❌ None</button>
            
            <div className="w-px h-6 bg-gray-600 mx-2"></div>
            <span className="text-xs text-gray-400 font-bold mr-1">Side:</span>
            <button onClick={() => setPaintSide('both')} className={`px-2 py-1 rounded text-xs font-bold ${paintSide==='both'?'bg-white text-black':'bg-gray-700'}`}>Both</button>
            <button onClick={() => setPaintSide('A')} className={`px-2 py-1 rounded text-xs font-bold ${paintSide==='A'?'bg-white text-black':'bg-gray-700'}`}>Side A</button>
            <button onClick={() => setPaintSide('B')} className={`px-2 py-1 rounded text-xs font-bold ${paintSide==='B'?'bg-white text-black':'bg-gray-700'}`}>Side B</button>
         </div>
      )}

      {tool === 'FURNISH' && ( <div className="bg-slate-900 p-2 flex justify-center gap-4 text-white"><button onClick={() => setFurnishType('bed')} className="px-3 py-1 rounded bg-blue-600">🛏️</button><button onClick={() => setFurnishType('table')} className="px-3 py-1 rounded bg-blue-600">🪑</button><button onClick={() => setFurnishType('sofa')} className="px-3 py-1 rounded bg-blue-600">🛋️</button></div>)}

      <div className="flex-grow relative overflow-hidden">
        <Stage
          width={(window.innerWidth / 2)} height={window.innerHeight - 120}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
          scaleX={stageScale} scaleY={stageScale} x={stagePos.x} y={stagePos.y}
          className={tool === 'SELECT' ? 'cursor-default' : 'cursor-crosshair'}
        >
          <Layer>
            <Rect x={0} y={0} width={siteWidth} height={siteDepth} fill="white" shadowBlur={10} onMouseDown={()=>{if(tool==='SELECT') selectWall(null)}}/>
            {[...Array(Math.floor(siteWidth / 50))].map((_, i) => (<Line key={`v-${i}`} points={[i*50, 0, i*50, siteDepth]} stroke="#e5e7eb" strokeWidth={1} />))}
            {ghostWalls.map(gw => ( <Line key={`ghost-${gw.id}`} points={[gw.start.x, gw.start.y, gw.end.x, gw.end.y]} stroke="#cbd5e1" strokeWidth={gw.thickness} lineCap="round" dash={[10, 5]} /> ))}
            
            {visibleWalls.map((wall) => {
               const isSelected = wall.id === selectedWallId;
               const isActive = wall.id === activeWallId;
               return (
                 <Group key={wall.id}>
                   <Line points={[wall.start.x, wall.start.y, wall.end.x, wall.end.y]} stroke={isSelected ? "#2563eb" : "#0f172a"} strokeWidth={wall.thickness + 2} hitStrokeWidth={25} lineCap="round" onClick={(e) => { if (tool==='SELECT' || tool==='PAINT') { e.cancelBubble=true; if(tool==='PAINT'){ 
                       if(paintSide==='both'||paintSide==='A') updateWallTexture(wall.id, 'A', activeTexture); 
                       if(paintSide==='both'||paintSide==='B') updateWallTexture(wall.id, 'B', activeTexture); 
                   } else { selectWall(wall.id); } } }} />
                   
                   {isActive && (
                     <Group>
                        <Arc x={wall.start.x} y={wall.start.y} innerRadius={15} outerRadius={16} angle={getWallAngle(wall.start,wall.end)} rotation={0} fill="red" opacity={0.5} />
                        <Group x={wall.end.x+10} y={wall.end.y+10}>
                            <Rect width={80} height={40} fill="rgba(0,0,0,0.8)" cornerRadius={4}/>
                            <Text text={`${getWallLength(wall.start,wall.end)} units`} x={5} y={5} fill="white" fontSize={12} fontStyle="bold"/>
                            <Text text={`${getWallAngle(wall.start,wall.end).toFixed(0)}°`} x={5} y={20} fill="#fca5a5" fontSize={11}/>
                        </Group>
                        <Line points={[wall.start.x, wall.start.y, wall.start.x+30, wall.start.y]} stroke="red" strokeWidth={1} dash={[2, 2]} />
                     </Group>
                   )}

                   {wall.openings && wall.openings.map(op => { 
                      const dx = wall.end.x - wall.start.x; const dy = wall.end.y - wall.start.y; 
                      const cx = wall.start.x + dx * op.dist; const cy = wall.start.y + dy * op.dist; 
                      const angle = Math.atan2(dy, dx) * 180 / Math.PI; 
                      return <Rect key={op.id} x={cx} y={cy} width={op.width} height={wall.thickness + 4} offsetX={op.width/2} offsetY={(wall.thickness + 4)/2} rotation={angle} fill="white" stroke="#333" strokeWidth={1} />; 
                   })}
                   <Circle x={wall.start.x} y={wall.start.y} radius={wall.thickness/2} fill="#0f172a" />
                   <Circle x={wall.end.x} y={wall.end.y} radius={wall.thickness/2} fill="#0f172a" />
                 </Group>
               );
            })}
            
            {visibleStairs.map((st) => (<Group key={st.id} x={st.x} y={st.y} rotation={st.rotation} draggable={tool==='SELECT'} onClick={(e)=>{if(tool==='SELECT'){e.cancelBubble=true; if(e.evt.shiftKey) deleteStair(st.id); else updateStairRotation(st.id, st.rotation+90);}}}><Rect width={st.width} height={st.length} offsetX={st.width/2} offsetY={st.length/2} fill="#e2e8f0" stroke="#475569" strokeWidth={2}/>{[...Array(8)].map((_, i) => (<Line key={i} points={[-st.width/2, -st.length/2 + (st.length/8)*i, st.width/2, -st.length/2 + (st.length/8)*i]} stroke="#94a3b8" strokeWidth={1}/>))}{tool === 'SELECT' && <Text text="↻" x={15} y={-st.length/2 - 15} fontSize={14} fill="#666" />}</Group>))}

            {visibleFurniture.map((item) => (<Group key={item.id} x={item.x} y={item.y} rotation={item.rotation} draggable={tool==='SELECT'} onClick={(e)=>{if(tool==='SELECT'){e.cancelBubble=true; if(e.evt.shiftKey) deleteFurniture(item.id); else updateFurnitureRotation(item.id, item.rotation+90);}}}>{item.type==='bed'&&<Rect width={40} height={60} offsetX={20} offsetY={30} fill="#bfdbfe" stroke="#3b82f6" strokeWidth={2} cornerRadius={4}/>}{item.type==='table'&&<Circle radius={25} fill="#fde047" stroke="#eab308" strokeWidth={2}/>}{item.type==='sofa'&&<Rect width={60} height={25} offsetX={30} offsetY={12.5} fill="#fca5a5" stroke="#ef4444" strokeWidth={2} cornerRadius={8}/>}{tool === 'SELECT' && <Text text="↻" x={15} y={-15} fontSize={14} fill="#666" />}</Group>))}

            {tool==='STAIR' && cursorPos && (<Group x={cursorPos.x} y={cursorPos.y} opacity={0.6}><Rect width={30} height={80} offsetX={15} offsetY={40} fill="#e2e8f0" stroke="#475569" strokeWidth={2} dash={[5,5]}/><Text text="Place Stair" fontSize={12} fill="black" x={20} y={-10}/></Group>)}

            {visibleLabels.map(l => (<Group key={l.id} x={l.x} y={l.y} onClick={() => { if(tool==='SELECT') { const n=prompt("Name:", l.name); if(n) updateLabelName(l.id, n, getRoomDimensions(l.x, l.y)); }}}> <Text x={-50} y={-10} width={100} text={l.name} fontSize={16} fontStyle="bold" fill="#1d4ed8" align="center" /> {l.size && <Text x={-50} y={8} width={100} text={l.size} fontSize={14} fontStyle="bold" fill="#000000" align="center" />} </Group>))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default TwoDEditor;