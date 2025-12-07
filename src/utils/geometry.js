import * as THREE from 'three';

// 1. DISTANCE TO SEGMENT
export const distanceToSegment = (p, a, b) => {
  const l2 = Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
};

// 2. NEAREST POINT
export const getNearestPointOnSegment = (p, a, b) => {
  const l2 = Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
  if (l2 === 0) return a;
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
};

// 3. INTERSECTION (The Fix)
export const getLineIntersection = (p0, p1, p2, p3) => {
  const s1_x = p1.x - p0.x;     const s1_y = p1.y - p0.y;
  const s2_x = p3.x - p2.x;     const s2_y = p3.y - p2.y;

  const s = (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) / (-s2_x * s1_y + s1_x * s2_y);
  const t = (s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) / (-s2_x * s1_y + s1_x * s2_y);

  // Check collision (inclusive 0..1 means it touches ends too)
  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    return { x: p0.x + (t * s1_x), y: p0.y + (t * s1_y) };
  }
  return null;
};

// 4. SHAPE GENERATORS (Standard)
export const createFloorShapeFromWalls = (walls, holes = []) => {
  if (walls.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  walls.forEach(w => {
    minX = Math.min(minX, w.start.x, w.end.x);
    maxX = Math.max(maxX, w.start.x, w.end.x);
    minY = Math.min(minY, w.start.y, w.end.y);
    maxY = Math.max(maxY, w.start.y, w.end.y);
  });
  const shape = new THREE.Shape();
  shape.moveTo(minX, minY); shape.lineTo(maxX, minY); shape.lineTo(maxX, maxY); shape.lineTo(minX, maxY); shape.lineTo(minX, minY);
  
  if (holes.length > 0) {
    holes.forEach(h => {
      const path = new THREE.Path();
      const w = h.width/2, l = h.length/2, rot = -h.rotation*Math.PI/180;
      const c = Math.cos(rot), s = Math.sin(rot);
      const tf = (lx, ly) => ({x: h.x + (lx*c - ly*s), y: h.y + (lx*s + ly*c)});
      const p1 = tf(-w, -l), p2 = tf(w, -l), p3 = tf(w, l), p4 = tf(-w, l);
      path.moveTo(p1.x, p1.y); path.lineTo(p2.x, p2.y); path.lineTo(p3.x, p3.y); path.lineTo(p4.x, p4.y);
      shape.holes.push(path);
    });
  }
  return shape;
};

export const createRoofShapeFromWalls = (walls) => {
  if (walls.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  walls.forEach(w => {
    minX = Math.min(minX, w.start.x, w.end.x);
    maxX = Math.max(maxX, w.start.x, w.end.x);
    minY = Math.min(minY, w.start.y, w.end.y);
    maxY = Math.max(maxY, w.start.y, w.end.y);
  });
  const o = 20; minX-=o; maxX+=o; minY-=o; maxY+=o;
  const s = new THREE.Shape();
  s.moveTo(minX, minY); s.lineTo(maxX, minY); s.lineTo(maxX, maxY); s.lineTo(minX, maxY); s.lineTo(minX, minY);
  return s;
};