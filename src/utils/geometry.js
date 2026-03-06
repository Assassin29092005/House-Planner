import * as THREE from 'three';
import { CONFIG } from '../constants';

// 1. DISTANCE TO SEGMENT
export const distanceToSegment = (p, a, b) => {
  const l2 = Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
};

// 2. NEAREST POINT ON SEGMENT
export const getNearestPointOnSegment = (p, a, b) => {
  const l2 = Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
  if (l2 === 0) return a;
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
};

// 3. LINE-LINE INTERSECTION
export const getLineIntersection = (p0, p1, p2, p3) => {
  const s1_x = p1.x - p0.x, s1_y = p1.y - p0.y;
  const s2_x = p3.x - p2.x, s2_y = p3.y - p2.y;
  const denom = (-s2_x * s1_y + s1_x * s2_y);
  if (Math.abs(denom) < 0.001) return null;
  const s = (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) / denom;
  const t = (s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) / denom;
  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    return { x: p0.x + (t * s1_x), y: p0.y + (t * s1_y) };
  }
  return null;
};

// 4. WALL LENGTH
export const getWallLength = (wall) => {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// 5. WALL MIDPOINT
export const getWallMidpoint = (wall) => ({
  x: (wall.start.x + wall.end.x) / 2,
  y: (wall.start.y + wall.end.y) / 2,
});

// 6. WALL ANGLE (degrees)
export const getWallAngle = (wall) => {
  return Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * 180 / Math.PI;
};

// 7. ANGLE SNAPPING — snap to nearest 0°/45°/90°/135°/180°
const SNAP_ANGLES = [0, 45, 90, 135, 180, -45, -90, -135, -180];
const ANGLE_TOLERANCE = 5; // degrees

export const snapToAngle = (start, end) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 5) return { point: end, snappedAngle: null };

  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  for (const snapAngle of SNAP_ANGLES) {
    if (Math.abs(angle - snapAngle) < ANGLE_TOLERANCE) {
      const rad = snapAngle * Math.PI / 180;
      return {
        point: {
          x: start.x + len * Math.cos(rad),
          y: start.y + len * Math.sin(rad),
        },
        snappedAngle: snapAngle,
      };
    }
  }
  return { point: end, snappedAngle: null };
};

// 8. ALIGNMENT GUIDES — find alignment with existing endpoints
export const findAlignmentGuides = (point, walls, currentLevelId, excludeWallId) => {
  const guides = [];
  const THRESHOLD = 5;

  const endpoints = [];
  walls.filter(w => w.levelId === currentLevelId && w.id !== excludeWallId).forEach(w => {
    endpoints.push(w.start, w.end);
  });

  endpoints.forEach(ep => {
    if (Math.abs(point.x - ep.x) < THRESHOLD) {
      guides.push({ type: 'vertical', x: ep.x, fromY: Math.min(point.y, ep.y), toY: Math.max(point.y, ep.y) });
    }
    if (Math.abs(point.y - ep.y) < THRESHOLD) {
      guides.push({ type: 'horizontal', y: ep.y, fromX: Math.min(point.x, ep.x), toX: Math.max(point.x, ep.x) });
    }
  });

  return guides;
};

// 9. COLLISION DETECTION — check if two rectangles overlap
export const checkRectCollision = (r1, r2) => {
  // r1, r2: { x, y, width, height } where x,y is center
  const hw1 = r1.width / 2, hh1 = r1.height / 2;
  const hw2 = r2.width / 2, hh2 = r2.height / 2;

  return !(r1.x + hw1 < r2.x - hw2 ||
    r1.x - hw1 > r2.x + hw2 ||
    r1.y + hh1 < r2.y - hh2 ||
    r1.y - hh1 > r2.y + hh2);
};

// 10. Check furniture against walls
export const checkFurnitureWallCollision = (furn, walls) => {
  const hw = furn.width / 2, hh = furn.height / 2;
  const corners = [
    { x: furn.x - hw, y: furn.y - hh },
    { x: furn.x + hw, y: furn.y - hh },
    { x: furn.x + hw, y: furn.y + hh },
    { x: furn.x - hw, y: furn.y + hh },
  ];

  for (const wall of walls) {
    for (const corner of corners) {
      if (distanceToSegment(corner, wall.start, wall.end) < wall.thickness) {
        return true;
      }
    }
  }
  return false;
};

// 11. Get all collisions for a level
export const getCollisions = (furniture, walls, currentLevelId) => {
  const levelFurniture = furniture.filter(f => f.levelId === currentLevelId);
  const levelWalls = walls.filter(w => w.levelId === currentLevelId);
  const collisions = new Set();

  // Furniture-furniture
  for (let i = 0; i < levelFurniture.length; i++) {
    for (let j = i + 1; j < levelFurniture.length; j++) {
      if (checkRectCollision(levelFurniture[i], levelFurniture[j])) {
        collisions.add(levelFurniture[i].id);
        collisions.add(levelFurniture[j].id);
      }
    }
  }

  // Furniture-wall
  levelFurniture.forEach(f => {
    if (checkFurnitureWallCollision(f, levelWalls)) {
      collisions.add(f.id);
    }
  });

  return collisions;
};

// 12. POINT IN POLYGON
export const pointInPolygon = (point, polygon) => {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// 13. PHYSICS: STABILITY CHECKER
export const checkStability = (walls, pillars, currentLevelId) => {
  if (currentLevelId === 0) return { isStable: true, failedPoints: [] };
  const levelWalls = walls.filter(w => w.levelId === currentLevelId);
  const levelPillars = pillars.filter(p => p.levelId === currentLevelId);
  if (levelWalls.length === 0 && levelPillars.length === 0) return { isStable: true, failedPoints: [] };
  const supportWalls = walls.filter(w => w.levelId === currentLevelId - 1);
  const supportPillars = pillars.filter(p => p.levelId === currentLevelId - 1);
  let failedPoints = [];

  levelWalls.forEach(wall => {
    const pts = [wall.start, wall.end, { x: (wall.start.x + wall.end.x) / 2, y: (wall.start.y + wall.end.y) / 2 }];
    pts.forEach(pt => {
      let ok = false;
      for (let sw of supportWalls) { if (distanceToSegment(pt, sw.start, sw.end) < CONFIG.WALL_THICKNESS * 2) { ok = true; break; } }
      if (!ok) for (let sp of supportPillars) { if (Math.hypot(pt.x - sp.x, pt.y - sp.y) < CONFIG.PILLAR_SIZE * 2) { ok = true; break; } }
      if (!ok) failedPoints.push(pt);
    });
  });

  levelPillars.forEach(p => {
    let ok = false;
    for (let sw of supportWalls) { if (distanceToSegment({ x: p.x, y: p.y }, sw.start, sw.end) < CONFIG.WALL_THICKNESS * 2) { ok = true; break; } }
    if (!ok) for (let sp of supportPillars) { if (Math.hypot(p.x - sp.x, p.y - sp.y) < CONFIG.PILLAR_SIZE * 2) { ok = true; break; } }
    if (!ok) failedPoints.push({ x: p.x, y: p.y });
  });

  return { isStable: failedPoints.length === 0, failedPoints };
};

// 14. SLAB GENERATOR
export const createFloorShape = (walls, pillars, holes = []) => {
  if (walls.length === 0 && pillars.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  walls.forEach(w => { minX = Math.min(minX, w.start.x, w.end.x); maxX = Math.max(maxX, w.start.x, w.end.x); minY = Math.min(minY, w.start.y, w.end.y); maxY = Math.max(maxY, w.start.y, w.end.y); });
  pillars.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x + p.size); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y + p.size); });
  if (minX === Infinity) return null;
  const shape = new THREE.Shape();
  shape.moveTo(minX, minY); shape.lineTo(maxX, minY); shape.lineTo(maxX, maxY); shape.lineTo(minX, maxY); shape.lineTo(minX, minY);
  holes.forEach(h => {
    const path = new THREE.Path();
    const w = h.width / 2, l = h.length / 2;
    const rot = -(h.rotation || 0) * Math.PI / 180;
    const c = Math.cos(rot), s = Math.sin(rot);
    const tf = (lx, ly) => ({ x: h.x + (lx * c - ly * s), y: h.y + (lx * s + ly * c) });
    const [p1, p2, p3, p4] = [tf(-w, -l), tf(w, -l), tf(w, l), tf(-w, l)];
    path.moveTo(p1.x, p1.y); path.lineTo(p2.x, p2.y); path.lineTo(p3.x, p3.y); path.lineTo(p4.x, p4.y); path.lineTo(p1.x, p1.y);
    shape.holes.push(path);
  });
  return shape;
};

// 15. ROOF GENERATOR
export const createRoofShape = (walls, pillars) => {
  if (walls.length === 0 && pillars.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  walls.forEach(w => { minX = Math.min(minX, w.start.x, w.end.x); maxX = Math.max(maxX, w.start.x, w.end.x); minY = Math.min(minY, w.start.y, w.end.y); maxY = Math.max(maxY, w.start.y, w.end.y); });
  pillars.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x + p.size); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y + p.size); });
  const offset = 40;
  minX -= offset; maxX += offset; minY -= offset; maxY += offset;
  const shape = new THREE.Shape();
  shape.moveTo(minX, minY); shape.lineTo(maxX, minY); shape.lineTo(maxX, maxY); shape.lineTo(minX, maxY); shape.lineTo(minX, minY);
  return { shape, width: maxX - minX, depth: maxY - minY };
};

// 16. ROOM FLOOR SHAPE (individual room polygon for 3D)
export const createRoomFloorShape = (roomPoints) => {
  if (!roomPoints || roomPoints.length < 3) return null;
  const shape = new THREE.Shape();
  shape.moveTo(roomPoints[0].x, roomPoints[0].y);
  for (let i = 1; i < roomPoints.length; i++) {
    shape.lineTo(roomPoints[i].x, roomPoints[i].y);
  }
  shape.lineTo(roomPoints[0].x, roomPoints[0].y);
  return shape;
};