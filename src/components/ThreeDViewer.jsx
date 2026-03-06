import React, { useMemo, useState, Suspense, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CameraControls, Environment, useTexture, Html, Grid, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store';
import { createFloorShape, createRoofShape, checkStability, getWallLength, createRoomFloorShape } from '../utils/geometry';
import { findRooms } from '../utils/roomDetection';
import { CONFIG } from '../constants';

// ─── TEXTURE MANAGER ───
const TextureManager = ({ children }) => {
  const textures = useTexture(CONFIG.TEXTURES);
  return children(textures);
};

const WallSideMaterial = ({ texture, color, width, height, index }) => {
  const map = useMemo(() => {
    if (!texture) return null;
    const cloned = texture.clone();
    cloned.wrapS = cloned.wrapT = THREE.RepeatWrapping;
    cloned.repeat.set(width / 100, height / 100);
    return cloned;
  }, [texture, width, height]);
  return map ? <meshStandardMaterial attach={`material-${index}`} map={map} /> : <meshStandardMaterial attach={`material-${index}`} color={color} />;
};

// ─── FIRST PERSON CONTROLS ───
const FirstPersonMovement = () => {
  const { camera } = useThree();
  const keys = useRef({ w: false, a: false, s: false, d: false });
  const { stairs, levels } = useStore();
  const speed = 3;
  const EYE_HEIGHT = 50;
  const floorElevation = useRef(0);

  useEffect(() => {
    const handleDown = (e) => {
      const k = e.key.toLowerCase();
      if (keys.current.hasOwnProperty(k)) keys.current[k] = true;
    };
    const handleUp = (e) => {
      const k = e.key.toLowerCase();
      if (keys.current.hasOwnProperty(k)) keys.current[k] = false;
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => { window.removeEventListener('keydown', handleDown); window.removeEventListener('keyup', handleUp); };
  }, []);

  useFrame(() => {
    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();

    if (keys.current.w) camera.position.addScaledVector(direction, speed);
    if (keys.current.s) camera.position.addScaledVector(direction, -speed);
    if (keys.current.a) camera.position.addScaledVector(right, -speed);
    if (keys.current.d) camera.position.addScaledVector(right, speed);

    // Determine floor elevation — check if standing on any stair
    let onStair = false;
    for (const stair of stairs) {
      const level = levels.find(l => l.id === stair.levelId);
      if (!level) continue;
      // Transform camera position into stair's local coordinate space
      const rot = (stair.rotation || 0) * Math.PI / 180;
      const dx = camera.position.x - stair.x;
      const dz = camera.position.z - stair.y;
      const localX = dx * Math.cos(rot) + dz * Math.sin(rot);
      const localZ = -dx * Math.sin(rot) + dz * Math.cos(rot);

      const margin = 8;
      if (Math.abs(localX) <= stair.width / 2 + margin &&
          localZ >= -stair.length / 2 - margin && localZ <= stair.length / 2 + margin) {
        const progress = Math.max(0, Math.min(1, (localZ + stair.length / 2) / stair.length));
        floorElevation.current = level.elevation + progress * level.height;
        onStair = true;
        break;
      }
    }

    if (!onStair) {
      // Stay on the highest floor at or below current tracked elevation
      let bestFloor = 0;
      for (const level of levels) {
        if (level.elevation <= floorElevation.current + 5) {
          bestFloor = Math.max(bestFloor, level.elevation);
        }
      }
      floorElevation.current = bestFloor;
    }

    const targetY = floorElevation.current + EYE_HEIGHT;
    camera.position.y += (targetY - camera.position.y) * 0.2;
  });

  return <PointerLockControls />;
};

// ─── SUNLIGHT ───
const SunLight = ({ compassAngle, timeOfDay }) => {
  const intensity = useMemo(() => {
    if (timeOfDay < 6 || timeOfDay > 20) return 0.1;
    if (timeOfDay < 8 || timeOfDay > 18) return 0.5;
    return 1.2;
  }, [timeOfDay]);

  const position = useMemo(() => {
    const hourAngle = ((timeOfDay - 6) / 12) * Math.PI;
    const compassRad = (compassAngle * Math.PI) / 180;
    const dist = 400;
    return [
      dist * Math.cos(compassRad) * Math.cos(hourAngle),
      dist * Math.sin(hourAngle),
      dist * Math.sin(compassRad) * Math.cos(hourAngle),
    ];
  }, [compassAngle, timeOfDay]);

  const color = useMemo(() => {
    if (timeOfDay < 7 || timeOfDay > 19) return '#ff8c42';
    if (timeOfDay < 9 || timeOfDay > 17) return '#ffd599';
    return '#ffffff';
  }, [timeOfDay]);

  return (
    <directionalLight
      position={position}
      intensity={intensity}
      color={color}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-far={2000}
      shadow-camera-left={-500}
      shadow-camera-right={500}
      shadow-camera-top={500}
      shadow-camera-bottom={-500}
    />
  );
};

// ─── 3D FURNITURE MODELS ───
const Bed3D = ({ x, y, rotation, width, length, elevation }) => (
  <group position={[x, elevation, y]} rotation={[0, -(rotation || 0) * Math.PI / 180, 0]}>
    <mesh position={[0, 8, 0]} castShadow><boxGeometry args={[width, 16, length]} /><meshStandardMaterial color="#1e3a5f" roughness={0.8} /></mesh>
    <mesh position={[0, 18, 0]} castShadow><boxGeometry args={[width - 4, 6, length - 4]} /><meshStandardMaterial color="#e0e7ff" roughness={0.9} /></mesh>
    <mesh position={[0, 22, -length / 2 + 10]} castShadow><boxGeometry args={[width - 12, 4, 12]} /><meshStandardMaterial color="#f1f5f9" roughness={1} /></mesh>
  </group>
);

const Sofa3D = ({ x, y, rotation, width, height: depth, elevation }) => (
  <group position={[x, elevation, y]} rotation={[0, -(rotation || 0) * Math.PI / 180, 0]}>
    <mesh position={[0, 8, 0]} castShadow><boxGeometry args={[width, 16, depth]} /><meshStandardMaterial color="#4c1d32" roughness={0.85} /></mesh>
    <mesh position={[0, 22, -depth / 2 + 4]} castShadow><boxGeometry args={[width, 14, 8]} /><meshStandardMaterial color="#6b2142" roughness={0.85} /></mesh>
    <mesh position={[-width / 4, 18, 3]} castShadow><boxGeometry args={[width / 2 - 3, 5, depth - 12]} /><meshStandardMaterial color="#f0abfc" roughness={0.95} /></mesh>
    <mesh position={[width / 4, 18, 3]} castShadow><boxGeometry args={[width / 2 - 3, 5, depth - 12]} /><meshStandardMaterial color="#f0abfc" roughness={0.95} /></mesh>
  </group>
);

const Table3D = ({ x, y, rotation, width, height: depth, elevation }) => (
  <group position={[x, elevation, y]} rotation={[0, -(rotation || 0) * Math.PI / 180, 0]}>
    <mesh position={[0, 28, 0]} castShadow><boxGeometry args={[width, 3, depth]} /><meshStandardMaterial color="#92400e" roughness={0.6} /></mesh>
    {[[-width / 2 + 2, -depth / 2 + 2], [width / 2 - 2, -depth / 2 + 2], [-width / 2 + 2, depth / 2 - 2], [width / 2 - 2, depth / 2 - 2]].map(([lx, lz], i) => (
      <mesh key={i} position={[lx, 13, lz]} castShadow><boxGeometry args={[3, 26, 3]} /><meshStandardMaterial color="#78350f" roughness={0.7} /></mesh>
    ))}
  </group>
);

const Chair3D = ({ x, y, rotation, width, height: depth, elevation }) => (
  <group position={[x, elevation, y]} rotation={[0, -(rotation || 0) * Math.PI / 180, 0]}>
    <mesh position={[0, 18, 0]} castShadow><boxGeometry args={[width, 2, depth]} /><meshStandardMaterial color="#d97706" roughness={0.7} /></mesh>
    <mesh position={[0, 30, -depth / 2 + 1]} castShadow><boxGeometry args={[width, 22, 2]} /><meshStandardMaterial color="#b45309" roughness={0.7} /></mesh>
    {[[-width / 2 + 1, -depth / 2 + 1], [width / 2 - 1, -depth / 2 + 1], [-width / 2 + 1, depth / 2 - 1], [width / 2 - 1, depth / 2 - 1]].map(([lx, lz], i) => (
      <mesh key={i} position={[lx, 8.5, lz]} castShadow><boxGeometry args={[2, 17, 2]} /><meshStandardMaterial color="#92400e" roughness={0.7} /></mesh>
    ))}
  </group>
);

const Desk3D = ({ x, y, rotation, width, height: depth, elevation }) => (
  <group position={[x, elevation, y]} rotation={[0, -(rotation || 0) * Math.PI / 180, 0]}>
    <mesh position={[0, 30, 0]} castShadow><boxGeometry args={[width, 3, depth]} /><meshStandardMaterial color="#3b0764" roughness={0.5} /></mesh>
    {[[-width / 2 + 2, -depth / 2 + 2], [width / 2 - 2, -depth / 2 + 2], [-width / 2 + 2, depth / 2 - 2], [width / 2 - 2, depth / 2 - 2]].map(([lx, lz], i) => (
      <mesh key={i} position={[lx, 14.5, lz]} castShadow><boxGeometry args={[3, 29, 3]} /><meshStandardMaterial color="#581c87" roughness={0.6} /></mesh>
    ))}
    <mesh position={[0, 42, -depth / 2 + 6]} castShadow><boxGeometry args={[20, 15, 1.5]} /><meshStandardMaterial color="#1e293b" roughness={0.3} /></mesh>
    <mesh position={[0, 46, -depth / 2 + 6]}><boxGeometry args={[18, 11, 0.5]} /><meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.3} /></mesh>
  </group>
);

const Stair3D = ({ x, y, width, length, rotation, elevation, height }) => {
  const steps = 8;
  return (
    <group position={[x, elevation, y]} rotation={[0, -(rotation || 0) * Math.PI / 180, 0]}>
      {[...Array(steps)].map((_, i) => (
        <mesh key={i} position={[0, (height / steps) * (i + 0.5), -length / 2 + (length / steps) * (i + 0.5)]} castShadow receiveShadow>
          <boxGeometry args={[width, height / steps - 0.5, length / steps - 0.5]} />
          <meshStandardMaterial color="#92400e" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
};

const Pillar3D = ({ x, y, size, height, elevation }) => (
  <mesh position={[x + size / 2, elevation + height / 2, y + size / 2]} castShadow receiveShadow>
    <boxGeometry args={[size, height, size]} />
    <meshStandardMaterial color={CONFIG.COLOR_PILLAR} roughness={0.6} metalness={0.1} />
  </mesh>
);

// ─── WALL 3D ───
const Wall3D = ({ wall, yOffset, textures }) => {
  const dx = wall.end.x - wall.start.x, dy = wall.end.y - wall.start.y;
  const len = Math.sqrt(dx * dx + dy * dy), angle = Math.atan2(dy, dx);
  const midX = (wall.start.x + wall.end.x) / 2, midZ = (wall.start.y + wall.end.y) / 2;
  const texA = wall.textureA && wall.textureA !== 'none' ? textures[wall.textureA] : null;
  const texB = wall.textureB && wall.textureB !== 'none' ? textures[wall.textureB] : null;
  if (len < 1) return null;

  // Compute wall segments when openings exist
  const segments = useMemo(() => {
    const ops = wall.openings || [];
    if (ops.length === 0) return null;
    const sorted = [...ops].sort((a, b) => a.dist - b.dist);
    const segs = [];
    let prevEnd = 0;
    for (const op of sorted) {
      const oStart = Math.max(0, Math.min(len, op.dist));
      const oEnd = Math.max(0, Math.min(len, op.dist + op.width));
      if (oEnd <= oStart) continue;
      const oW = oEnd - oStart;
      // Full-height wall segment before this opening
      if (oStart > prevEnd + 0.5) {
        segs.push({ x: prevEnd, w: oStart - prevEnd, y: 0, h: wall.height, kind: 'wall' });
      }
      // Sill wall below opening (windows)
      if (op.sillHeight > 0.5) {
        segs.push({ x: oStart, w: oW, y: 0, h: Math.min(op.sillHeight, wall.height), kind: 'wall' });
      }
      // Header wall above opening
      const topOfOp = op.sillHeight + op.height;
      if (topOfOp < wall.height - 0.5) {
        segs.push({ x: oStart, w: oW, y: topOfOp, h: wall.height - topOfOp, kind: 'wall' });
      }
      // Opening visual
      segs.push({ x: oStart, w: oW, y: op.sillHeight, h: op.height, kind: op.type === 'window' ? 'glass' : 'door' });
      prevEnd = oEnd;
    }
    // Full-height wall segment after last opening
    if (prevEnd < len - 0.5) {
      segs.push({ x: prevEnd, w: len - prevEnd, y: 0, h: wall.height, kind: 'wall' });
    }
    return segs;
  }, [wall.openings, len, wall.height]);

  // No openings — single box (original behavior)
  if (!segments) {
    return (
      <group position={[midX, yOffset + wall.height / 2, midZ]} rotation={[0, -angle, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[len, wall.height, wall.thickness]} />
          <WallSideMaterial index={4} texture={texA} color={wall.colorSideA} width={len} height={wall.height} />
          <WallSideMaterial index={5} texture={texB} color={wall.colorSideB} width={len} height={wall.height} />
          {[...Array(4)].map((_, i) => <meshStandardMaterial key={i} attach={`material-${i}`} color="#64748b" roughness={0.8} />)}
        </mesh>
      </group>
    );
  }

  // With openings — render wall as multiple segments
  return (
    <group position={[midX, yOffset, midZ]} rotation={[0, -angle, 0]}>
      {segments.map((seg, i) => {
        const cx = -len / 2 + seg.x + seg.w / 2;
        const cy = seg.y + seg.h / 2;

        if (seg.kind === 'glass') {
          return (
            <group key={i} position={[cx, cy, 0]}>
              <mesh>
                <boxGeometry args={[seg.w, seg.h, 1]} />
                <meshStandardMaterial color="#bfdbfe" transparent opacity={0.2} roughness={0.05} metalness={0.9} />
              </mesh>
              {/* Window frame */}
              <mesh position={[0, seg.h / 2, 0]}><boxGeometry args={[seg.w + 2, 1.5, wall.thickness + 1]} /><meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} /></mesh>
              <mesh position={[0, -seg.h / 2, 0]}><boxGeometry args={[seg.w + 2, 1.5, wall.thickness + 1]} /><meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} /></mesh>
              <mesh position={[-seg.w / 2, 0, 0]}><boxGeometry args={[1.5, seg.h, wall.thickness + 1]} /><meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} /></mesh>
              <mesh position={[seg.w / 2, 0, 0]}><boxGeometry args={[1.5, seg.h, wall.thickness + 1]} /><meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} /></mesh>
            </group>
          );
        }

        if (seg.kind === 'door') {
          return (
            <group key={i} position={[cx, cy, 0]}>
              {/* Door frame */}
              <mesh position={[0, seg.h / 2 - 1, 0]} castShadow><boxGeometry args={[seg.w + 4, 2, wall.thickness + 2]} /><meshStandardMaterial color="#78350f" roughness={0.7} /></mesh>
              {[-1, 1].map((side, si) => (
                <mesh key={si} position={[side * (seg.w / 2 + 1), 0, 0]} castShadow><boxGeometry args={[2, seg.h, wall.thickness + 2]} /><meshStandardMaterial color="#78350f" roughness={0.7} /></mesh>
              ))}
              {/* Door panel */}
              <mesh position={[0, -0.5, wall.thickness * 0.3]} castShadow>
                <boxGeometry args={[seg.w - 2, seg.h - 1, 2]} />
                <meshStandardMaterial color="#92400e" roughness={0.6} />
              </mesh>
            </group>
          );
        }

        // Wall segment
        return (
          <mesh key={i} position={[cx, cy, 0]} castShadow receiveShadow>
            <boxGeometry args={[seg.w, seg.h, wall.thickness]} />
            <WallSideMaterial index={4} texture={texA} color={wall.colorSideA} width={seg.w} height={seg.h} />
            <WallSideMaterial index={5} texture={texB} color={wall.colorSideB} width={seg.w} height={seg.h} />
            {[...Array(4)].map((_, j) => <meshStandardMaterial key={j} attach={`material-${j}`} color="#64748b" roughness={0.8} />)}
          </mesh>
        );
      })}
    </group>
  );
};

// ─── FLOOR WITH ROOM TEXTURES ───
const AutoFloor = ({ levelId, elevation, holes, roomTextures }) => {
  const { walls, pillars } = useStore();
  const floorShape = useMemo(() => {
    const lw = walls.filter(w => w.levelId === levelId);
    const lp = pillars.filter(p => p.levelId === levelId);
    return createFloorShape(lw, lp, holes);
  }, [walls, pillars, levelId, holes]);
  const stability = useMemo(() => checkStability(walls, pillars, levelId), [walls, pillars, levelId]);

  // Room-specific floor shapes with textures
  const roomFloors = useMemo(() => {
    const lw = walls.filter(w => w.levelId === levelId);
    const rooms = findRooms(lw);
    return rooms.map((room, idx) => {
      const texKey = roomTextures[idx] || 'none';
      const floorTex = CONFIG.FLOOR_TEXTURES[texKey];
      const shape = createRoomFloorShape(room.points);
      return { shape, color: floorTex ? floorTex.color : '#334155', texKey };
    }).filter(r => r.shape && r.texKey !== 'none');
  }, [walls, levelId, roomTextures]);

  if (!floorShape) return null;
  return (
    <>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, elevation + 0.1, 0]} receiveShadow>
        <shapeGeometry args={[floorShape]} />
        <meshStandardMaterial color={stability.isStable ? '#334155' : CONFIG.COLOR_UNSTABLE} side={THREE.DoubleSide} transparent={!stability.isStable} opacity={stability.isStable ? 1 : 0.5} roughness={0.9} />
      </mesh>
      {roomFloors.map((rf, i) => (
        <mesh key={`room-floor-${i}`} rotation={[Math.PI / 2, 0, 0]} position={[0, elevation + 0.5, 0]} receiveShadow>
          <shapeGeometry args={[rf.shape]} />
          <meshStandardMaterial color={rf.color} side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
      ))}
    </>
  );
};

const AutoRoof = ({ levelId, elevation }) => {
  const { walls, pillars } = useStore();
  const data = useMemo(() => {
    const lw = walls.filter(w => w.levelId === levelId);
    const lp = pillars.filter(p => p.levelId === levelId);
    return createRoofShape(lw, lp);
  }, [walls, pillars, levelId]);
  if (!data || !data.shape) return null;
  return (
    <mesh position={[0, elevation, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <extrudeGeometry args={[data.shape, { depth: 8, bevelEnabled: false }]} />
      <meshStandardMaterial color="#475569" roughness={0.7} />
    </mesh>
  );
};

const FurnitureRenderer = ({ item, elevation }) => {
  const props = { ...item, elevation };
  switch (item.type) {
    case 'bed': return <Bed3D {...props} length={item.height} />;
    case 'sofa': return <Sofa3D {...props} />;
    case 'table': return <Table3D {...props} />;
    case 'chair': return <Chair3D {...props} />;
    case 'desk': return <Desk3D {...props} />;
    default: return <mesh position={[item.x, elevation + 10, item.y]} castShadow><boxGeometry args={[item.width, 20, item.height]} /><meshStandardMaterial color="#64748b" /></mesh>;
  }
};

// ─── MAIN VIEWER ───
const ThreeDViewer = () => {
  const { walls, siteWidth, siteDepth, furniture, stairs, pillars, levels, view3DMode, isStructureStable,
    compassAngle, setCompassAngle, timeOfDay, setTimeOfDay, is3DNight, toggleDayNight,
    isFirstPerson, toggleFirstPerson, roomTextures, setRoomTexture } = useStore();

  const cameraRef = useRef();
  const [showRoof, setShowRoof] = useState(false);
  const [visibleLevels, setVisibleLevels] = useState(null);
  const [showMaterialPanel, setShowMaterialPanel] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const centerX = siteWidth / 2, centerZ = siteDepth / 2;

  const levelsToRender = visibleLevels
    ? levels.filter(l => visibleLevels.includes(l.id))
    : (view3DMode === 'building' ? levels : levels.filter(l => l.id === parseInt(view3DMode)));

  const maxElevation = Math.max(...levels.map(l => l.elevation + l.height));

  const toggleLevelVisibility = (id) => {
    if (!visibleLevels) {
      setVisibleLevels(levels.map(l => l.id).filter(lid => lid !== id));
    } else if (visibleLevels.includes(id)) {
      setVisibleLevels(visibleLevels.filter(lid => lid !== id));
    } else {
      setVisibleLevels([...visibleLevels, id]);
    }
  };

  // Detected rooms for material assignment
  const currentLevelWalls = walls.filter(w => w.levelId === (levels[0]?.id || 0));
  const detectedRooms = useMemo(() => findRooms(currentLevelWalls), [currentLevelWalls]);

  return (
    <div className="h-full w-full bg-[#0f172a] relative">
      {/* CONTROLS PANEL */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end max-h-[90%] overflow-y-auto">
        <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border backdrop-blur-sm ${isStructureStable ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'}`}>
          {isStructureStable ? '✓ Stable' : '⚠ Unstable'}
        </div>

        {/* Feature toggles */}
        <div className="flex flex-col gap-1">
          <button onClick={() => setShowRoof(!showRoof)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all ${showRoof ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#1e293b]/80 text-slate-400 border-[#334155]'}`}>
            🏠 Roof
          </button>
          <button onClick={toggleDayNight} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all ${is3DNight ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-[#1e293b]/80 text-slate-400 border-[#334155]'}`}>
            {is3DNight ? '🌙 Night' : '☀️ Day'}
          </button>
          <button onClick={toggleFirstPerson} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all ${isFirstPerson ? 'bg-amber-600 text-white border-amber-500' : 'bg-[#1e293b]/80 text-slate-400 border-[#334155]'}`}>
            🚶 {isFirstPerson ? 'Exit FP' : 'Walk'}
          </button>
          <button onClick={() => setShowMaterialPanel(!showMaterialPanel)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all ${showMaterialPanel ? 'bg-violet-600 text-white border-violet-500' : 'bg-[#1e293b]/80 text-slate-400 border-[#334155]'}`}>
            🎨 Materials
          </button>
        </div>

        {/* Sunlight controls */}
        <div className="bg-[#1e293b]/80 border border-[#334155] rounded-lg p-2 backdrop-blur-sm w-44">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">☀ Sunlight</div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] text-slate-400 w-12">Time</span>
            <input type="range" min="0" max="24" step="0.5" value={timeOfDay} onChange={(e) => setTimeOfDay(Number(e.target.value))} className="flex-1 accent-amber-500 h-1" />
            <span className="text-[9px] text-slate-300 font-bold w-10">{Math.floor(timeOfDay)}:{(timeOfDay % 1 * 60).toString().padStart(2, '0')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-400 w-12">Compass</span>
            <input type="range" min="0" max="360" step="15" value={compassAngle} onChange={(e) => setCompassAngle(Number(e.target.value))} className="flex-1 accent-blue-500 h-1" />
            <span className="text-[9px] text-slate-300 font-bold w-10">{compassAngle}°</span>
          </div>
        </div>

        {/* Level toggles */}
        <div className="bg-[#1e293b]/80 border border-[#334155] rounded-lg overflow-hidden backdrop-blur-sm">
          <button onClick={() => setVisibleLevels(null)} className="w-full px-3 py-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-white hover:bg-[#334155] border-b border-[#334155] transition-colors">Show All</button>
          {[...levels].reverse().map(lvl => (
            <button key={lvl.id} onClick={() => toggleLevelVisibility(lvl.id)}
              className={`w-full px-3 py-1.5 text-[9px] font-bold text-left transition-colors border-b border-[#334155] last:border-0 ${!visibleLevels || visibleLevels.includes(lvl.id) ? 'text-slate-300 bg-[#1e293b]' : 'text-slate-600 bg-[#0f172a]'} hover:bg-[#334155]`}>
              {!visibleLevels || visibleLevels.includes(lvl.id) ? '👁' : '  '} {lvl.name}
            </button>
          ))}
        </div>
      </div>

      {/* MATERIALS PANEL */}
      {showMaterialPanel && (
        <div className="absolute top-3 left-3 z-10 bg-[#1e293b] border border-[#334155] rounded-xl w-52 max-h-[80%] overflow-y-auto shadow-2xl animate-fade-in">
          <div className="px-3 py-2 border-b border-[#334155] flex justify-between items-center">
            <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">🎨 Floor Materials</span>
            <button onClick={() => setShowMaterialPanel(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
          </div>
          <div className="p-2 space-y-2">
            {detectedRooms.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">Draw walls to create rooms</p>
            ) : (
              detectedRooms.map((room, idx) => (
                <div key={idx} className="bg-[#0f172a] rounded-lg p-2 border border-[#334155]">
                  <div className="text-[10px] text-slate-300 font-bold mb-1">Room {idx + 1}</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(CONFIG.FLOOR_TEXTURES).map(([key, tex]) => (
                      <button key={key} onClick={() => setRoomTexture(idx, key)}
                        className={`px-2 py-1 rounded text-[8px] font-bold border transition-all ${roomTextures[idx] === key ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-[#334155] text-slate-500 hover:text-slate-300'}`}>
                        {tex.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* First person instructions */}
      {isFirstPerson && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-[#0f172a]/90 border border-[#334155] rounded-xl px-4 py-2 text-center backdrop-blur-sm">
          <div className="text-xs text-slate-300 font-bold">🚶 First Person Mode</div>
          <div className="text-[10px] text-slate-500 mt-1">WASD to move • Mouse to look • Click canvas to lock • ESC to unlock</div>
        </div>
      )}

      <Canvas shadows camera={{ position: [centerX, 500, centerZ + 600], fov: 50 }}>
        {is3DNight ? (
          <Environment preset="night" />
        ) : (
          <Environment preset="city" />
        )}
        <ambientLight intensity={is3DNight ? 0.1 : 0.4} />
        <SunLight compassAngle={compassAngle} timeOfDay={timeOfDay} />
        <directionalLight position={[-100, 200, -100]} intensity={is3DNight ? 0.05 : 0.3} />

        {/* Night point lights */}
        {is3DNight && (
          <>
            <pointLight position={[centerX, 80, centerZ]} intensity={1} color="#fef3c7" distance={400} decay={2} />
            <pointLight position={[centerX + 100, 80, centerZ - 100]} intensity={0.5} color="#fef3c7" distance={300} decay={2} />
          </>
        )}

        {isFirstPerson ? <FirstPersonMovement /> : <CameraControls ref={cameraRef} makeDefault />}

        <Suspense fallback={<Html center><div className="text-blue-400 font-bold text-sm animate-pulse">Loading 3D Scene...</div></Html>}>
          <TextureManager>{(textures) => (
            <group>
              {levelsToRender.map((lvl) => (
                <group key={lvl.id}>
                  {walls.filter(w => w.levelId === lvl.id).map(w => <Wall3D key={w.id} wall={w} yOffset={lvl.elevation} textures={textures} />)}
                  <AutoFloor levelId={lvl.id} elevation={lvl.elevation} holes={stairs.filter(s => s.levelId === lvl.id - 1)} roomTextures={roomTextures} />
                  {pillars.filter(p => p.levelId === lvl.id).map(p => <Pillar3D key={p.id} {...p} elevation={lvl.elevation} height={lvl.height} />)}
                  {furniture.filter(f => f.levelId === lvl.id).map(item => <FurnitureRenderer key={item.id} item={item} elevation={lvl.elevation} />)}
                  {stairs.filter(s => s.levelId === lvl.id).map(s => <Stair3D key={s.id} {...s} elevation={lvl.elevation} height={lvl.height} />)}
                </group>
              ))}
              {showRoof && view3DMode === 'building' && <AutoRoof levelId={levels[levels.length - 1].id} elevation={maxElevation} />}
            </group>
          )}</TextureManager>
        </Suspense>

        {siteWidth > 0 && (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -1, centerZ]} receiveShadow>
              <planeGeometry args={[siteWidth * 3, siteDepth * 3]} />
              <meshStandardMaterial color={is3DNight ? '#0a1628' : '#1a2e1a'} roughness={1} />
            </mesh>
            <Grid position={[centerX, -0.5, centerZ]} args={[siteWidth * 2, siteDepth * 2]} cellSize={50} cellThickness={0.5}
              cellColor={is3DNight ? '#1e293b' : '#2d4a2d'} sectionSize={200} sectionThickness={1}
              sectionColor={is3DNight ? '#334155' : '#3d5a3d'} fadeDistance={1500} infiniteGrid={false} />
          </>
        )}
      </Canvas>
    </div>
  );
};

export default ThreeDViewer;