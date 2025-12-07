import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getLineIntersection } from './utils/geometry';

const copy = (data) => JSON.parse(JSON.stringify(data));

const useStore = create((set, get) => ({
  // 1. CONFIG
  siteWidth: 0, siteDepth: 0,
  setSiteDimensions: (w, d) => { set({ siteWidth: w, siteDepth: d }); get().addPerimeterWalls(0); },

  view3DMode: 'building', setView3DMode: (m) => set({ view3DMode: m }),

  // 2. LEVELS
  levels: [{ id: 0, name: 'Ground Floor', elevation: 0, height: 100 }],
  currentLevelId: 0,
  addLevel: () => {
    get().saveHistory();
    const { levels } = get();
    const nextId = levels.length ? Math.max(...levels.map(l=>l.id))+1 : 0;
    const prev = levels[levels.length-1] || {elevation:0, height:0};
    set({ levels: [...levels, { id: nextId, name: nextId===0?'Ground':`${nextId}th Floor`, elevation: prev.elevation+prev.height, height: 100 }], currentLevelId: nextId });
    get().addPerimeterWalls(nextId);
  },
  deleteLevel: () => {
    get().saveHistory();
    const { levels, currentLevelId, walls, furniture, roomLabels, stairs } = get();
    if (levels.length <= 1) { alert("Cannot delete last floor"); return; }
    const newLevels = levels.filter(l => l.id !== currentLevelId);
    const newId = newLevels[newLevels.length - 1].id;
    set({ levels: newLevels, walls: walls.filter(w => w.levelId !== currentLevelId), furniture: furniture.filter(f => f.levelId !== currentLevelId), stairs: stairs.filter(s => s.levelId !== currentLevelId), roomLabels: roomLabels.filter(l => l.levelId !== currentLevelId), currentLevelId: newId });
  },
  setCurrentLevel: (id) => set({ currentLevelId: parseInt(id), selectedWallId: null }),

  // 3. WALLS
  walls: [], selectedWallId: null,
  selectWall: (id) => set({ selectedWallId: id }),
  addWall: (p) => { 
    get().saveHistory(); 
    const id = uuidv4(); 
    set(s => ({ walls: [...s.walls, { id, start: p, end: p, thickness: 10, height: 100, levelId: s.currentLevelId, colorSideA: '#9ca3af', colorSideB: '#9ca3af', openings: [] }], selectedWallId: id })); 
    return id; 
  },
  updateWall: (id, end) => set(s => ({ walls: s.walls.map(w => w.id === id ? { ...w, end } : w) })),
  updateWallAttribute: (id, k, v) => { get().saveHistory(); set(s => ({ walls: s.walls.map(w => w.id === id ? { ...w, [k]: v } : w) })); },
  addOpening: (wid, type, r) => { get().saveHistory(); set(s => ({ walls: s.walls.map(w => w.id!==wid ? w : { ...w, openings: [...w.openings, { id: uuidv4(), type, dist: r, width: type==='door'?30:40, height: type==='door'?80:40, sillHeight: type==='door'?0:30 }] }) })); },
  
  splitWallAtPoint: (wid, p) => { 
    const { walls } = get(); const w = walls.find(x => x.id === wid); if (!w) return;
    const w1 = { ...w, id: uuidv4(), end: p, openings: [] };
    const w2 = { ...w, id: uuidv4(), start: p, openings: [] };
    set(s => ({ walls: s.walls.filter(x=>x.id!==wid).concat([w1, w2]) }));
  },

  addPerimeterWalls: (lid) => { const { siteWidth, siteDepth } = get(); if (!siteWidth) return; const p = { thickness: 10, height: 100, levelId: lid, colorSideA: '#9ca3af', colorSideB: '#9ca3af', openings: [] }; set(s => ({ walls: [...s.walls, { id: uuidv4(), start: {x:0,y:0}, end: {x:siteWidth,y:0}, ...p }, { id: uuidv4(), start: {x:siteWidth,y:0}, end: {x:siteWidth,y:siteDepth}, ...p }, { id: uuidv4(), start: {x:siteWidth,y:siteDepth}, end: {x:0,y:siteDepth}, ...p }, { id: uuidv4(), start: {x:0,y:siteDepth}, end: {x:0,y:0}, ...p }] })); },

  // === THE MAGIC FIX: INTERSECTION SPLITTER ===
  finalizeWall: (activeId) => {
    const { walls, currentLevelId } = get();
    let active = walls.find(w => w.id === activeId);
    if (!active) return;

    // We might have multiple split points for the active wall
    let splitPoints = [];

    // 1. CHECK ALL OTHER WALLS
    const others = walls.filter(w => w.levelId === currentLevelId && w.id !== activeId);
    
    // We need a loop that updates 'others' because we might split them!
    // For simplicity, we just iterate once. If complex overlaps happen, user draws again.
    
    // Create a temp list of actions to perform AFTER the loop to avoid messing up the array while iterating
    let wallsToSplit = []; // { id, point }

    others.forEach(other => {
        const intersection = getLineIntersection(active.start, active.end, other.start, other.end);
        
        if (intersection) {
            // Check if it's a real intersection (not just touching start points)
            // (Floating point tolerance 0.1)
            const isStart = Math.hypot(intersection.x - active.start.x, intersection.y - active.start.y) < 1;
            const isEnd = Math.hypot(intersection.x - active.end.x, intersection.y - active.end.y) < 1;
            const isOtherStart = Math.hypot(intersection.x - other.start.x, intersection.y - other.start.y) < 1;
            const isOtherEnd = Math.hypot(intersection.x - other.end.x, intersection.y - other.end.y) < 1;

            if (!isStart && !isEnd) {
                // Active wall crossed something -> It needs to be split later
                splitPoints.push(intersection);
            }

            if (!isOtherStart && !isOtherEnd) {
                // The OTHER wall was crossed -> Split it now
                wallsToSplit.push({ id: other.id, point: intersection });
            }
        }
    });

    // 2. EXECUTE SPLITS ON OTHER WALLS
    wallsToSplit.forEach(action => {
        get().splitWallAtPoint(action.id, action.point);
    });

    // 3. EXECUTE SPLITS ON ACTIVE WALL
    if (splitPoints.length > 0) {
        // Sort points by distance from start so we chop in order
        splitPoints.sort((a, b) => {
            const da = Math.hypot(a.x - active.start.x, a.y - active.start.y);
            const db = Math.hypot(b.x - active.start.x, b.y - active.start.y);
            return da - db;
        });

        // Delete Original Active Wall
        let currentStart = active.start;
        const baseProps = { ...active, id: undefined, start: undefined, end: undefined }; // Copy props
        
        let newSegments = [];

        // Create segments
        splitPoints.forEach(pt => {
            newSegments.push({ ...baseProps, id: uuidv4(), start: currentStart, end: pt });
            currentStart = pt;
        });
        // Final segment
        newSegments.push({ ...baseProps, id: uuidv4(), start: currentStart, end: active.end });

        set(state => ({
            walls: state.walls.filter(w => w.id !== activeId).concat(newSegments),
            selectedWallId: null
        }));
    }
  },

  // 4. HISTORY & REST (Keep same)
  past: [], future: [],
  saveHistory: () => { const s = get(); set(st => ({ past: [...st.past, { ...s }], future: [] })); },
  undo: () => { const { past } = get(); if (!past.length) return; const p = past[past.length-1]; set({ ...p, past: past.slice(0, -1), future: [{...get()}, ...get().future], selectedWallId: null }); },
  redo: () => { const { future } = get(); if (!future.length) return; const n = future[0]; set({ ...n, past: [...get().past, {...get()}], future: future.slice(1), selectedWallId: null }); },
  resetCanvas: () => { get().saveHistory(); set({ walls: [], furniture: [], roomLabels: [], stairs: [], selectedWallId: null }); get().addPerimeterWalls(0); },

  roomLabels: [],
  addRoomLabel: (x, y, name, size) => { get().saveHistory(); const id = uuidv4(); set(s => ({ roomLabels: [...s.roomLabels, { id, x, y, name, size, levelId: s.currentLevelId }] })); },
  updateLabelName: (id, n, sz) => { get().saveHistory(); set(s => ({ roomLabels: s.roomLabels.map(l => l.id===id ? {...l, name: n, size: sz} : l) })); },
  furniture: [],
  addFurniture: (t, x, y) => { get().saveHistory(); const id = uuidv4(); set(s => ({ furniture: [...s.furniture, { id, type: t, x, y, rotation: 0, levelId: s.currentLevelId }] })); },
  updateFurnitureRotation: (id, a) => { get().saveHistory(); set(s => ({ furniture: s.furniture.map(f => f.id === id ? { ...f, rotation: a } : f) })); },
  deleteFurniture: (id) => { get().saveHistory(); set(s => ({ furniture: s.furniture.filter(f => f.id !== id) })); },
  stairs: [],
  addStair: (x, y) => { get().saveHistory(); set(s => ({ stairs: [...s.stairs, { id: uuidv4(), x, y, width: 30, length: 80, rotation: 0, levelId: s.currentLevelId }] })); },
  updateStairRotation: (id, a) => { get().saveHistory(); set(s => ({ stairs: s.stairs.map(st => st.id===id ? {...st, rotation: a} : st) })); },
  deleteStair: (id) => { get().saveHistory(); set(s => ({ stairs: s.stairs.filter(st => st.id !== id) })); },
}));

export default useStore;