import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store';
import { createFloorShapeFromWalls, createRoofShapeFromWalls } from '../utils/geometry';

// === 1. TEXTURE MANAGER ===
// Loads textures once and passes them down
const TextureManager = ({ children }) => {
  // Ensure these files exist in your /public/textures/ folder
  const textures = useTexture({
    brick: '/textures/brick.jpg',
    wood: '/textures/wood.jpg',
    tile: '/textures/tile.jpg'
  });

  return children(textures);
};

// === 2. SMART MATERIAL COMPONENT ===
// Handles cloning and repeating textures efficiently
const WallSideMaterial = ({ texture, color, width, height, index }) => {
  const map = useMemo(() => {
    if (!texture) return null;
    const cloned = texture.clone();
    cloned.wrapS = cloned.wrapT = THREE.RepeatWrapping;
    // Adjust scale: 100 units = 1 texture tile
    cloned.repeat.set(width / 100, height / 100);
    cloned.needsUpdate = true;
    return cloned;
  }, [texture, width, height]);

  if (map) {
    return <meshStandardMaterial attach={`material-${index}`} map={map} />;
  }
  return <meshStandardMaterial attach={`material-${index}`} color={color || '#9ca3af'} />;
};

// === FURNITURE COMPONENTS ===
const Bed3D = ({ x, y, rotation }) => ( <group position={[x, 0, y]} rotation={[0, -rotation * Math.PI / 180, 0]}><mesh position={[0, 10, 0]}><boxGeometry args={[40, 20, 60]} /><meshStandardMaterial color="#3b82f6" /></mesh><mesh position={[0, 22, 0]}><boxGeometry args={[38, 5, 58]} /><meshStandardMaterial color="white" /></mesh><mesh position={[0, 26, -20]}><boxGeometry args={[25, 4, 10]} /><meshStandardMaterial color="white" /></mesh></group> );
const Table3D = ({ x, y, rotation }) => ( <group position={[x, 0, y]} rotation={[0, -rotation * Math.PI / 180, 0]}><mesh position={[0, 30, 0]}><cylinderGeometry args={[25, 25, 2, 32]} /><meshStandardMaterial color="#eab308" /></mesh><mesh position={[0, 15, 0]}><cylinderGeometry args={[3, 3, 30, 8]} /><meshStandardMaterial color="#a16207" /></mesh></group> );
const Sofa3D = ({ x, y, rotation }) => ( <group position={[x, 0, y]} rotation={[0, -rotation * Math.PI / 180, 0]}><mesh position={[0, 12, 0]}><boxGeometry args={[60, 10, 25]} /><meshStandardMaterial color="#ef4444" /></mesh><mesh position={[0, 25, -10]}><boxGeometry args={[60, 20, 5]} /><meshStandardMaterial color="#b91c1c" /></mesh></group> );

// === STAIR COMPONENT ===
const Stair3D = ({ x, y, width, length, rotation, elevation, height }) => {
  const stepCount = 15;
  const stepHeight = height / stepCount; 
  const stepDepth = length / stepCount;
  return (
    <group position={[x, elevation, y]} rotation={[0, -rotation * Math.PI / 180, 0]}>
      {[...Array(stepCount)].map((_, i) => (
        <group key={`step-${i}`} position={[0, i * stepHeight + stepHeight/2, -length/2 + i * stepDepth + stepDepth/2]}>
          <mesh position={[0, stepHeight/2 - 1, 0]}><boxGeometry args={[width, 2, stepDepth + 2]} /><meshStandardMaterial color="#d97706" /></mesh>
          <mesh position={[0, -stepHeight/2 + 1, stepDepth/2 - 1]}><boxGeometry args={[width, stepHeight, 2]} /><meshStandardMaterial color="#f1f5f9" /></mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={`rail-${side}`}>
            <mesh position={[side * (width/2 - 2), height/2 - stepHeight, 0]} rotation={[Math.atan(height/length), 0, 0]}><boxGeometry args={[4, length + 10, 10]} /><meshStandardMaterial color="#334155" /></mesh>
            <group position={[side * (width/2 - 2), 0, 0]}>
                <mesh position={[0, height + 35 - stepHeight, 0]} rotation={[Math.atan(height/length), 0, 0]}><boxGeometry args={[3, length + 10, 3]} /><meshStandardMaterial color="#1e293b" /></mesh>
                {[0, 4, 8, 12].map((i) => ( <mesh key={`p-${i}`} position={[0, (i * stepHeight) + 17.5, -length/2 + (i * stepDepth) + stepDepth/2]}><cylinderGeometry args={[1, 1, 35, 8]} /><meshStandardMaterial color="#1e293b" /></mesh> ))}
            </group>
        </group>
      ))}
    </group>
  );
};

// === WALL COMPONENT ===
const Wall3D = ({ wall, yOffset, textures }) => {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx); 
  const midX = (wall.start.x + wall.end.x) / 2;
  const midZ = (wall.start.y + wall.end.y) / 2;

  // Retrieve raw texture objects from the manager
  const texA = wall.textureA && wall.textureA !== 'none' ? textures[wall.textureA] : null;
  const texB = wall.textureB && wall.textureB !== 'none' ? textures[wall.textureB] : null;

  // Helper to render a wall segment with materials
  const WallSegment = ({ w, h, d, pos }) => (
    <mesh position={pos}>
      <boxGeometry args={[w, h, d]} />
      {/* 0-3: Sides (Right, Left, Top, Bottom) - Default Gray */}
      <meshStandardMaterial attach="material-0" color="#9ca3af" />
      <meshStandardMaterial attach="material-1" color="#9ca3af" />
      <meshStandardMaterial attach="material-2" color="#9ca3af" />
      <meshStandardMaterial attach="material-3" color="#9ca3af" />
      
      {/* 4: Front (Side A) */}
      <WallSideMaterial index={4} texture={texA} color={wall.colorSideA} width={w} height={h} />
      
      {/* 5: Back (Side B) */}
      <WallSideMaterial index={5} texture={texB} color={wall.colorSideB} width={w} height={h} />
    </mesh>
  );

  // If no openings, render full wall
  if (!wall.openings || wall.openings.length === 0) {
    return (
      <group position={[midX, yOffset + wall.height / 2, midZ]} rotation={[0, -angle, 0]}>
         <WallSegment w={len} h={wall.height} d={wall.thickness} pos={[0, 0, 0]} />
      </group>
    );
  }

  // Render wall with holes (windows/doors)
  const sortedOps = [...wall.openings].sort((a, b) => a.dist - b.dist);
  const segments = [];
  let currentPos = 0;

  sortedOps.forEach((op, index) => {
    const opCenter = op.dist * len;
    const opStart = opCenter - op.width / 2;
    const opEnd = opCenter + op.width / 2;
    
    // Left segment
    if (opStart > currentPos) {
      const width = opStart - currentPos;
      segments.push(
        <WallSegment key={`L${index}`} w={width} h={wall.height} d={wall.thickness} pos={[currentPos + width/2 - len/2, 0, 0]} />
      );
    }
    
    // Header (above opening)
    const headerH = wall.height - (op.sillHeight + op.height);
    if (headerH > 0) {
      segments.push(
        <WallSegment key={`T${index}`} w={op.width} h={headerH} d={wall.thickness} pos={[opCenter - len/2, wall.height/2 - headerH/2, 0]} />
      );
    }
    
    // Sill (below opening)
    if (op.sillHeight > 0) {
      segments.push(
        <WallSegment key={`B${index}`} w={op.width} h={op.sillHeight} d={wall.thickness} pos={[opCenter - len/2, -wall.height/2 + op.sillHeight/2, 0]} />
      );
    }
    
    // Window/Door Frame Placeholder
    segments.push(
      <group key={`win-${op.id}`} position={[opCenter - len/2, -wall.height/2 + op.sillHeight + op.height/2, 0]}>
        <mesh><boxGeometry args={[op.width, op.height, wall.thickness + 2]} /><meshStandardMaterial color="#333" wireframe /></mesh>
        {op.type === 'window' && <mesh><planeGeometry args={[op.width - 4, op.height - 4]} /><meshStandardMaterial color="skyblue" opacity={0.3} transparent side={THREE.DoubleSide} /></mesh>}
      </group>
    );
    currentPos = opEnd;
  });

  // Final Right segment
  if (currentPos < len) {
    const width = len - currentPos;
    segments.push(
      <WallSegment key="End" w={width} h={wall.height} d={wall.thickness} pos={[currentPos + width/2 - len/2, 0, 0]} />
    );
  }

  return <group position={[midX, yOffset + wall.height / 2, midZ]} rotation={[0, -angle, 0]}>{segments}</group>;
};

const AutoFloor = ({ levelId, elevation, holes }) => { const { walls } = useStore(); const levelWalls = walls.filter(w => w.levelId === levelId); const floorShape = useMemo(() => createFloorShapeFromWalls(levelWalls, holes), [levelWalls, holes]); if (!floorShape) return null; return <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, elevation + 0.1, 0]}><shapeGeometry args={[floorShape]} /><meshStandardMaterial color="#d1d5db" side={THREE.DoubleSide} /></mesh>; };
const AutoCeiling = ({ levelId, elevation, height, holes }) => { const { walls } = useStore(); const levelWalls = walls.filter(w => w.levelId === levelId); const floorShape = useMemo(() => createFloorShapeFromWalls(levelWalls, holes), [levelWalls, holes]); if (!floorShape) return null; return <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, elevation + height, 0]}><shapeGeometry args={[floorShape]} /><meshStandardMaterial color="#f3f4f6" side={THREE.DoubleSide} /></mesh>; };
const CameraController = ({ target }) => { const { camera, controls } = useThree(); useEffect(() => { if (controls && target) { controls.target.set(target.x, 0, target.z); camera.position.set(target.x, 800, target.z + 800); controls.update(); } }, [target, controls, camera]); return null; };
const KeyPanController = ({ controls }) => { const { camera } = useThree(); useEffect(() => { const handleKeyDown = (e) => { if (!controls) return; const s = 20; const f = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion); f.y=0; f.normalize(); const r = new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion); r.y=0; r.normalize(); switch(e.key) { case 'ArrowUp': case 'w': controls.target.addScaledVector(f, s); camera.position.addScaledVector(f, s); break; case 'ArrowDown': case 's': controls.target.addScaledVector(f, -s); camera.position.addScaledVector(f, -s); break; case 'ArrowLeft': case 'a': controls.target.addScaledVector(r, -s); camera.position.addScaledVector(r, -s); break; case 'ArrowRight': case 'd': controls.target.addScaledVector(r, s); camera.position.addScaledVector(r, s); break; } controls.update(); }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [camera, controls]); return null; };

const ThreeDViewer = () => {
  const { walls, siteWidth, siteDepth, roomLabels, furniture, stairs, levels, currentLevelId, view3DMode, setView3DMode } = useStore();
  const defaultCenter = useMemo(() => ({ x: siteWidth/2, z: siteDepth/2 }), [siteWidth, siteDepth]);
  const [cameraTarget, setCameraTarget] = useState(null);
  const levelsToRender = view3DMode === 'building' ? levels : levels.filter(l => l.id === parseInt(view3DMode));

  return (
    <div className="h-full w-full bg-gray-900 relative">
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <div className="bg-black/50 text-white px-2 py-1 text-xs rounded self-center">Use WASD to Move</div>
        <select value={view3DMode} onChange={(e) => setView3DMode(e.target.value)} className="bg-white px-2 py-1 shadow-md rounded font-bold text-sm"><option value="building">View: Whole Building</option>{levels.map(l => ( <option key={l.id} value={l.id}>View: {l.name}</option> ))}</select>
        <button onClick={() => setCameraTarget({ ...defaultCenter, t: Date.now() })} className="bg-blue-600 text-white px-3 py-1 shadow-md rounded font-bold text-sm hover:bg-blue-700">Reset Cam</button>
      </div>
      <Canvas camera={{ position: [defaultCenter.x, 800, defaultCenter.z + 800], fov: 45, far: 5000 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[100, 200, 50]} intensity={1.5} castShadow />
        <Sky sunPosition={[100, 50, 100]} />
        <OrbitControls makeDefault target={[defaultCenter.x, 0, defaultCenter.z]} maxDistance={3000} enablePan={true} />
        <KeyPanController />
        {cameraTarget && <CameraController target={cameraTarget} />}
        <Suspense fallback={null}>
          <TextureManager>
            {(textures) => (
              <group>
                {levelsToRender.map(lvl => {
                    const renderY = lvl.elevation; 
                    const showCeiling = view3DMode === 'building';
                    const levelStairs = stairs.filter(s => s.levelId === lvl.id);
                    return (
                        <group key={lvl.id}>
                            {walls.filter(w => w.levelId === lvl.id).map(w => <Wall3D key={w.id} wall={w} yOffset={renderY} textures={textures} />)}
                            <AutoFloor levelId={lvl.id} elevation={renderY} holes={stairs.filter(s => s.levelId === lvl.id - 1)} />
                            {showCeiling && <AutoCeiling levelId={lvl.id} elevation={renderY} height={lvl.height} holes={levelStairs} />}
                            {levelStairs.map(st => ( <Stair3D key={st.id} {...st} elevation={renderY} height={lvl.height} /> ))}
                            {furniture.filter(f => f.levelId === lvl.id).map(item => ( <group key={item.id} position={[0, renderY, 0]}><mesh visible={false} />{item.type==='bed'&&<Bed3D {...item}/>}{item.type==='table'&&<Table3D {...item}/>}{item.type==='sofa'&&<Sofa3D {...item}/>}</group> ))}
                            {roomLabels.filter(l => l.levelId === lvl.id).map((l) => ( <group key={l.id} position={[l.x, renderY + 50, l.y]}><mesh visible={false} onClick={(e) => { e.stopPropagation(); setCameraTarget({ x: l.x, z: l.y, t: Date.now() }); }}><boxGeometry args={[50, 50, 50]} /></mesh><Text color="black" fontSize={30} position={[0, 20, 0]} anchorX="center" anchorY="middle" outlineWidth={2} outlineColor="white">{l.name}</Text></group> ))}
                        </group>
                    )
                })}
              </group>
            )}
          </TextureManager>
        </Suspense>
        {siteWidth > 0 && <mesh rotation={[-Math.PI/2,0,0]} position={[siteWidth/2, -0.5, siteDepth/2]}><planeGeometry args={[siteWidth, siteDepth]} /><meshStandardMaterial color="#8ba870" /></mesh>}
        {siteWidth > 0 && <gridHelper args={[Math.max(siteWidth, siteDepth), 50]} position={[siteWidth/2, 0, siteDepth/2]} />}
      </Canvas>
    </div>
  );
};

export default ThreeDViewer;