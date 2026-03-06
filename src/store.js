import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getLineIntersection, checkStability } from './utils/geometry';
import { CONFIG } from './constants';

const createLevelSlice = (set, get) => ({
  siteWidth: 0, siteDepth: 0,
  view3DMode: 'building',
  levels: [{ id: 0, name: 'Ground Floor', elevation: 0, height: CONFIG.DEFAULT_LEVEL_HEIGHT }],
  currentLevelId: 0,
  isStructureStable: true,
  gridSnap: false,
  measurementUnit: 'ft',
  backgroundImage: null,
  roomTextures: {},
  compassAngle: 0,
  timeOfDay: 12,
  is3DNight: false,
  isFirstPerson: false,
  customTextures: [], // { id, name, dataUrl }


  setSiteDimensions: (w, d) => { set({ siteWidth: w, siteDepth: d }); get().addCornerPillars(0); },
  setView3DMode: (m) => set({ view3DMode: m }),
  toggleGridSnap: () => set(s => ({ gridSnap: !s.gridSnap })),
  setMeasurementUnit: (u) => set({ measurementUnit: u }),
  setBackgroundImage: (img) => set({ backgroundImage: img }),
  setCompassAngle: (a) => set({ compassAngle: a }),
  setTimeOfDay: (t) => set({ timeOfDay: t }),
  toggleDayNight: () => set(s => ({ is3DNight: !s.is3DNight })),
  toggleFirstPerson: () => set(s => ({ isFirstPerson: !s.isFirstPerson })),

  addCustomTexture: (name, dataUrl) => {
    const id = `custom_${Date.now()}`;
    set(s => ({ customTextures: [...s.customTextures, { id, name, dataUrl }] }));
    return id;
  },

  setRoomTexture: (roomIdx, texKey) => {
    set(s => ({ roomTextures: { ...s.roomTextures, [roomIdx]: texKey } }));
  },

  snapToGrid: (pos) => {
    const { gridSnap } = get();
    if (!gridSnap) return pos;
    const g = CONFIG.GRID_SIZE;
    return { x: Math.round(pos.x / g) * g, y: Math.round(pos.y / g) * g };
  },

  convertUnit: (valuePx) => {
    const { measurementUnit } = get();
    const unit = CONFIG.UNITS[measurementUnit];
    return (valuePx * unit.factor).toFixed(1) + ' ' + unit.suffix;
  },

  convertArea: (areaPx) => {
    const { measurementUnit } = get();
    const unit = CONFIG.UNITS[measurementUnit];
    return (areaPx * unit.factor * unit.factor).toFixed(1) + ' ' + unit.suffix + '²';
  },

  updateStability: () => {
    const { walls, pillars, levels } = get();
    let overallStable = true;
    levels.forEach(lvl => { if (!checkStability(walls, pillars, lvl.id).isStable) overallStable = false; });
    set({ isStructureStable: overallStable });
  },

  addLevel: () => {
    get().saveHistory();
    const { levels } = get();
    const nextId = levels.length ? Math.max(...levels.map(l => l.id)) + 1 : 0;
    const prev = levels[levels.length - 1] || { elevation: 0, height: 0 };
    const names = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'];
    set({ levels: [...levels, { id: nextId, name: names[nextId] || `${nextId}th Floor`, elevation: prev.elevation + prev.height, height: CONFIG.DEFAULT_LEVEL_HEIGHT }], currentLevelId: nextId });
    get().addCornerPillars(nextId);
    get().updateStability();
  },

  deleteLevel: (targetId) => {
    get().saveHistory();
    const { levels, currentLevelId } = get();
    if (levels.length <= 1) return;
    const lid = targetId !== undefined ? targetId : currentLevelId;
    const remaining = levels.filter(l => l.id !== lid);
    const filterLvl = (item) => item.levelId !== lid;
    set(state => ({
      levels: remaining, walls: state.walls.filter(filterLvl), furniture: state.furniture.filter(filterLvl),
      stairs: state.stairs.filter(filterLvl), pillars: state.pillars.filter(filterLvl), roomLabels: state.roomLabels.filter(filterLvl),
      currentLevelId: lid === currentLevelId ? remaining[0].id : currentLevelId
    }));
    get().updateStability();
  },

  setCurrentLevel: (id) => set({ currentLevelId: parseInt(id), selectedWallId: null }),
});

const createWallSlice = (set, get) => ({
  walls: [],
  selectedWallId: null,
  selectedIds: [], // multi-select

  selectWall: (id) => set({ selectedWallId: id }),

  toggleMultiSelect: (id, type) => {
    set(s => {
      const entry = { id, type };
      const exists = s.selectedIds.find(e => e.id === id);
      if (exists) return { selectedIds: s.selectedIds.filter(e => e.id !== id) };
      return { selectedIds: [...s.selectedIds, entry] };
    });
  },
  clearMultiSelect: () => set({ selectedIds: [] }),

  groupMove: (dx, dy) => {
    get().saveHistory();
    const { selectedIds } = get();
    set(s => {
      let walls = [...s.walls], furniture = [...s.furniture], pillars = [...s.pillars], stairs = [...s.stairs], roomLabels = [...s.roomLabels];
      selectedIds.forEach(({ id, type }) => {
        if (type === 'wall') walls = walls.map(w => w.id === id ? { ...w, start: { x: w.start.x + dx, y: w.start.y + dy }, end: { x: w.end.x + dx, y: w.end.y + dy } } : w);
        if (type === 'furniture') furniture = furniture.map(f => f.id === id ? { ...f, x: f.x + dx, y: f.y + dy } : f);
        if (type === 'pillar') pillars = pillars.map(p => p.id === id ? { ...p, x: p.x + dx, y: p.y + dy } : p);
        if (type === 'stair') stairs = stairs.map(st => st.id === id ? { ...st, x: st.x + dx, y: st.y + dy } : st);
        if (type === 'label') roomLabels = roomLabels.map(l => l.id === id ? { ...l, x: l.x + dx, y: l.y + dy } : l);
      });
      return { walls, furniture, pillars, stairs, roomLabels };
    });
  },

  groupDelete: () => {
    get().saveHistory();
    const { selectedIds } = get();
    const ids = new Set(selectedIds.map(e => e.id));
    set(s => ({
      walls: s.walls.filter(w => !ids.has(w.id)),
      furniture: s.furniture.filter(f => !ids.has(f.id)),
      pillars: s.pillars.filter(p => !ids.has(p.id)),
      stairs: s.stairs.filter(st => !ids.has(st.id)),
      roomLabels: s.roomLabels.filter(l => !ids.has(l.id)),
      selectedIds: [], selectedWallId: null
    }));
    get().updateStability();
  },

  addWall: (p) => {
    get().saveHistory();
    const id = uuidv4();
    set(s => ({
      walls: [...s.walls, { id, start: p, end: p, thickness: CONFIG.WALL_THICKNESS, height: CONFIG.WALL_HEIGHT, levelId: s.currentLevelId, colorSideA: CONFIG.COLOR_WALL_DEFAULT, colorSideB: CONFIG.COLOR_WALL_DEFAULT, textureA: 'none', textureB: 'none', openings: [] }],
      selectedWallId: id
    }));
    return id;
  },

  updateWall: (id, updates) => {
    set(s => ({ walls: s.walls.map(w => w.id === id ? { ...w, ...updates } : w) }));
    get().updateStability();
  },

  updateWallAttribute: (id, k, v) => {
    get().saveHistory();
    set(s => ({ walls: s.walls.map(w => w.id === id ? { ...w, [k]: v } : w) }));
  },

  deleteWall: (id) => {
    get().saveHistory();
    set(s => ({ walls: s.walls.filter(w => w.id !== id), selectedWallId: s.selectedWallId === id ? null : s.selectedWallId }));
    get().updateStability();
  },

  flipWallSides: (id) => {
    get().saveHistory();
    set(s => ({ walls: s.walls.map(w => w.id === id ? { ...w, colorSideA: w.colorSideB, colorSideB: w.colorSideA, textureA: w.textureB, textureB: w.textureA } : w) }));
  },

  updateWallTexture: (id, side, texture) => {
    get().saveHistory();
    set(s => ({
      walls: s.walls.map(w => {
        if (w.id !== id) return w;
        return side === 'A' ? { ...w, textureA: texture } : side === 'B' ? { ...w, textureB: texture } : w;
      })
    }));
  },

  addOpening: (wid, type, dist) => {
    get().saveHistory();
    set(s => ({
      walls: s.walls.map(w => w.id !== wid ? w : {
        ...w, openings: [...w.openings, { id: uuidv4(), type, dist, width: type === 'door' ? 30 : 40, height: type === 'door' ? 80 : 40, sillHeight: type === 'door' ? 0 : 30 }]
      })
    }));
  },

  removeOpening: (wid, oid) => {
    get().saveHistory();
    set(s => ({ walls: s.walls.map(w => w.id !== wid ? w : { ...w, openings: w.openings.filter(o => o.id !== oid) }) }));
  },

  updateOpening: (wid, oid, updates) => {
    get().saveHistory();
    set(s => ({ walls: s.walls.map(w => w.id !== wid ? w : { ...w, openings: w.openings.map(o => o.id === oid ? { ...o, ...updates } : o) }) }));
  },

  splitWallAtPoint: (wid, p) => {
    const w = get().walls.find(x => x.id === wid);
    if (!w) return;
    const base = { ...w, id: undefined, start: undefined, end: undefined, openings: [] };
    set(s => ({ walls: s.walls.filter(x => x.id !== wid).concat([{ ...base, id: uuidv4(), start: w.start, end: p }, { ...base, id: uuidv4(), start: p, end: w.end }]) }));
    get().updateStability();
  },

  finalizeWall: (activeId) => {
    const { walls, currentLevelId } = get();
    let active = walls.find(w => w.id === activeId);
    if (!active) return;
    const dx = active.end.x - active.start.x, dy = active.end.y - active.start.y;
    if (Math.sqrt(dx * dx + dy * dy) < 5) { set(s => ({ walls: s.walls.filter(w => w.id !== activeId), selectedWallId: null })); return; }

    let splitPoints = [];
    const others = walls.filter(w => w.levelId === currentLevelId && w.id !== activeId);
    let wallsToSplit = [];
    others.forEach(other => {
      const intersection = getLineIntersection(active.start, active.end, other.start, other.end);
      if (intersection) {
        const isStart = Math.hypot(intersection.x - active.start.x, intersection.y - active.start.y) < 1;
        const isEnd = Math.hypot(intersection.x - active.end.x, intersection.y - active.end.y) < 1;
        const isOtherStart = Math.hypot(intersection.x - other.start.x, intersection.y - other.start.y) < 1;
        const isOtherEnd = Math.hypot(intersection.x - other.end.x, intersection.y - other.end.y) < 1;
        if (!isStart && !isEnd) splitPoints.push(intersection);
        if (!isOtherStart && !isOtherEnd) wallsToSplit.push({ id: other.id, point: intersection });
      }
    });
    wallsToSplit.forEach(action => get().splitWallAtPoint(action.id, action.point));
    if (splitPoints.length > 0) {
      splitPoints.sort((a, b) => Math.hypot(a.x - active.start.x, a.y - active.start.y) - Math.hypot(b.x - active.start.x, b.y - active.start.y));
      let currentStart = active.start;
      const base = { ...active, id: undefined, start: undefined, end: undefined };
      let segs = [];
      splitPoints.forEach(pt => { segs.push({ ...base, id: uuidv4(), start: currentStart, end: pt }); currentStart = pt; });
      segs.push({ ...base, id: uuidv4(), start: currentStart, end: active.end });
      set(state => ({ walls: state.walls.filter(w => w.id !== activeId).concat(segs), selectedWallId: null }));
    }
    get().updateStability();
  },
});

const createObjectsSlice = (set, get) => ({
  furniture: [], stairs: [], pillars: [], roomLabels: [],

  addFurniture: (type, x, y) => {
    get().saveHistory();
    const id = uuidv4();
    const sizes = { bed: { width: 40, height: 60 }, sofa: { width: 60, height: 25 }, table: { width: 30, height: 30 }, chair: { width: 20, height: 20 }, desk: { width: 50, height: 30 }, toilet: { width: 20, height: 25 }, cupboard: { width: 50, height: 20 } };
    const size = sizes[type] || { width: 25, height: 25 };
    set(s => ({ furniture: [...s.furniture, { id, type, x, y, rotation: 0, width: size.width, height: size.height, levelId: s.currentLevelId }] }));
    return id;
  },
  updateFurniture: (id, attrs) => { get().saveHistory(); set(s => ({ furniture: s.furniture.map(f => f.id === id ? { ...f, ...attrs } : f) })); },
  deleteFurniture: (id) => { get().saveHistory(); set(s => ({ furniture: s.furniture.filter(f => f.id !== id) })); },

  addPillar: (x, y) => { get().saveHistory(); set(s => ({ pillars: [...s.pillars, { id: uuidv4(), x, y, size: CONFIG.PILLAR_SIZE, levelId: s.currentLevelId }] })); get().updateStability(); },
  addCornerPillars: (lid) => {
    const { siteWidth, siteDepth } = get();
    if (!siteWidth || !siteDepth) return;
    const sz = CONFIG.PILLAR_SIZE;
    const corners = [{ x: 0, y: 0 }, { x: siteWidth - sz, y: 0 }, { x: siteWidth - sz, y: siteDepth - sz }, { x: 0, y: siteDepth - sz }];
    set(s => ({ pillars: [...s.pillars, ...corners.map(c => ({ id: uuidv4(), x: c.x, y: c.y, size: sz, levelId: lid }))] }));
    get().updateStability();
  },
  updatePillar: (id, attrs) => { get().saveHistory(); set(s => ({ pillars: s.pillars.map(p => p.id === id ? { ...p, ...attrs } : p) })); get().updateStability(); },
  deletePillar: (id) => { get().saveHistory(); set(s => ({ pillars: s.pillars.filter(p => p.id !== id) })); get().updateStability(); },

  duplicateObject: (id, type) => {
    get().saveHistory();
    const offset = 20;
    if (type === 'furniture') { const item = get().furniture.find(f => f.id === id); if (item) set(s => ({ furniture: [...s.furniture, { ...item, id: uuidv4(), x: item.x + offset, y: item.y + offset }] })); }
    else if (type === 'stair') { const item = get().stairs.find(s => s.id === id); if (item) set(s => ({ stairs: [...s.stairs, { ...item, id: uuidv4(), x: item.x + offset, y: item.y + offset }] })); }
    else if (type === 'pillar') { const item = get().pillars.find(p => p.id === id); if (item) set(s => ({ pillars: [...s.pillars, { ...item, id: uuidv4(), x: item.x + offset, y: item.y + offset }] })); }
    else if (type === 'wall') { const item = get().walls.find(w => w.id === id); if (item) set(s => ({ walls: [...s.walls, { ...item, id: uuidv4(), start: { x: item.start.x + offset, y: item.start.y + offset }, end: { x: item.end.x + offset, y: item.end.y + offset }, openings: [] }] })); }
    get().updateStability();
  },

  addStair: (x, y) => { get().saveHistory(); set(s => ({ stairs: [...s.stairs, { id: uuidv4(), x, y, width: 30, length: 80, rotation: 0, levelId: s.currentLevelId }] })); },
  updateStair: (id, attrs) => { get().saveHistory(); set(s => ({ stairs: s.stairs.map(st => st.id === id ? { ...st, ...attrs } : st) })); },
  deleteStair: (id) => { get().saveHistory(); set(s => ({ stairs: s.stairs.filter(st => st.id !== id) })); },

  addRoomLabel: (x, y, name, size) => { get().saveHistory(); set(s => ({ roomLabels: [...s.roomLabels, { id: uuidv4(), x, y, name: name || 'Room', size: size || '0', levelId: s.currentLevelId }] })); },
  updateRoomLabel: (id, attrs) => { get().saveHistory(); set(s => ({ roomLabels: s.roomLabels.map(l => l.id === id ? { ...l, ...attrs } : l) })); },
  deleteRoomLabel: (id) => { get().saveHistory(); set(s => ({ roomLabels: s.roomLabels.filter(l => l.id !== id) })); },
});

const HISTORY_LIMIT = 30;

const getSnapshotData = (state) => ({
  walls: state.walls,
  furniture: state.furniture,
  roomLabels: state.roomLabels,
  stairs: state.stairs,
  pillars: state.pillars,
  levels: state.levels,
  siteWidth: state.siteWidth,
  siteDepth: state.siteDepth,
  currentLevelId: state.currentLevelId,
  measurementUnit: state.measurementUnit,
  roomTextures: state.roomTextures,
  selectedWallId: state.selectedWallId,
  selectedIds: state.selectedIds,
  backgroundImage: state.backgroundImage,
  compassAngle: state.compassAngle,
  customTextures: state.customTextures,
});

const createHistorySlice = (set, get) => ({
  past: [], future: [],
  versionHistory: [],

  saveHistory: () => {
    const snapshot = getSnapshotData(get());
    set({ past: [...get().past, snapshot].slice(-HISTORY_LIMIT), future: [] });
  },
  undo: () => {
    const { past } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    const currentSnapshot = getSnapshotData(get());
    set(state => ({ ...prev, past: past.slice(0, -1), future: [currentSnapshot, ...state.future].slice(0, HISTORY_LIMIT), versionHistory: state.versionHistory }));
  },
  redo: () => {
    const { future } = get();
    if (!future.length) return;
    const next = future[0];
    const currentSnapshot = getSnapshotData(get());
    set(state => ({ ...next, past: [...state.past, currentSnapshot], future: future.slice(1), versionHistory: state.versionHistory }));
  },

  saveVersion: (name) => {
    const { past, future, versionHistory, ...data } = get();
    const version = { name: name || `Version ${(versionHistory.length) + 1}`, timestamp: new Date().toISOString(), data: JSON.parse(JSON.stringify(data)) };
    set({ versionHistory: [...get().versionHistory, version] });
  },

  restoreVersion: (index) => {
    const { versionHistory } = get();
    if (index < 0 || index >= versionHistory.length) return;
    get().saveHistory();
    const v = versionHistory[index];
    set({ ...v.data, past: [], future: [], versionHistory: get().versionHistory });
  },

  deleteVersion: (index) => {
    set(s => ({ versionHistory: s.versionHistory.filter((_, i) => i !== index) }));
  },

  resetCanvas: () => {
    get().saveHistory();
    set({ walls: [], furniture: [], roomLabels: [], stairs: [], pillars: [], selectedWallId: null, selectedIds: [] });
    get().addCornerPillars(0);
  },

  loadProject: (data) => {
    set({
      walls: data.walls || [], furniture: data.furniture || [], roomLabels: data.roomLabels || [],
      stairs: data.stairs || [], pillars: data.pillars || [], levels: data.levels || [],
      siteWidth: data.siteWidth, siteDepth: data.siteDepth, currentLevelId: data.currentLevelId || 0,
      measurementUnit: data.measurementUnit || 'ft', roomTextures: data.roomTextures || {},
      past: [], future: [], selectedWallId: null, selectedIds: []
    });
    get().updateStability();
  },

  loadTemplate: (template) => {
    const szMap = { bed: [40, 60], sofa: [60, 25], desk: [50, 30], toilet: [20, 25], cupboard: [50, 20] };
    const parseWall = (w, levelId) => ({
      id: uuidv4(), start: w.start, end: w.end, thickness: CONFIG.WALL_THICKNESS, height: CONFIG.WALL_HEIGHT,
      levelId, colorSideA: w.colorSideA || CONFIG.COLOR_WALL_DEFAULT, colorSideB: w.colorSideB || CONFIG.COLOR_WALL_DEFAULT,
      textureA: w.textureA || 'none', textureB: w.textureB || 'none',
      openings: (w.openings || []).map(o => ({
        id: uuidv4(), type: o.type, dist: o.dist,
        width: o.width || (o.type === 'door' ? 30 : 40),
        height: o.height || (o.type === 'door' ? 80 : 40),
        sillHeight: o.sillHeight !== undefined ? o.sillHeight : (o.type === 'door' ? 0 : 30),
      }))
    });
    const parseFurn = (f, levelId) => {
      const sz = szMap[f.type] || [30, 30];
      return { id: uuidv4(), type: f.type, x: f.x, y: f.y, rotation: f.rotation || 0, levelId, width: f.width || sz[0], height: f.height || sz[1] };
    };
    const parseLabel = (l, levelId) => ({ id: uuidv4(), x: l.x, y: l.y, name: l.name, size: '0', levelId });

    // Support multi-floor templates via `floors` array, or single-floor via top-level walls/furniture
    const floors = template.floors || [{ walls: template.walls, furniture: template.furniture, roomLabels: template.roomLabels }];
    const floorNames = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'];
    const levelDefs = floors.map((_, i) => ({ id: i, name: floorNames[i] || `${i}th Floor`, elevation: i * CONFIG.DEFAULT_LEVEL_HEIGHT, height: CONFIG.DEFAULT_LEVEL_HEIGHT }));

    let allWalls = [], allFurn = [], allLabels = [];
    floors.forEach((floor, levelId) => {
      allWalls = allWalls.concat((floor.walls || []).map(w => parseWall(w, levelId)));
      allFurn = allFurn.concat((floor.furniture || []).map(f => parseFurn(f, levelId)));
      allLabels = allLabels.concat((floor.roomLabels || []).map(l => parseLabel(l, levelId)));
    });

    const stairData = (template.stairs || []).map(s => ({
      id: uuidv4(), x: s.x, y: s.y, width: s.width || 30, length: s.length || 80, rotation: s.rotation || 0, levelId: s.levelId || 0
    }));

    set({
      siteWidth: template.siteWidth, siteDepth: template.siteDepth,
      walls: allWalls, furniture: allFurn, roomLabels: allLabels,
      stairs: stairData, levels: levelDefs,
      currentLevelId: 0, past: [], future: [], selectedWallId: null, selectedIds: [], pillars: [],
      roomTextures: template.roomTextures || {},
    });
    levelDefs.forEach(l => get().addCornerPillars(l.id));
    get().updateStability();
  },

  getExportData: () => {
    const s = get();
    return {
      walls: s.walls, furniture: s.furniture, roomLabels: s.roomLabels, stairs: s.stairs,
      pillars: s.pillars, levels: s.levels, siteWidth: s.siteWidth, siteDepth: s.siteDepth,
      currentLevelId: s.currentLevelId, measurementUnit: s.measurementUnit, roomTextures: s.roomTextures,
    };
  }
});

const useStore = create((set, get) => ({
  ...createLevelSlice(set, get),
  ...createWallSlice(set, get),
  ...createObjectsSlice(set, get),
  ...createHistorySlice(set, get),
}));

export default useStore;