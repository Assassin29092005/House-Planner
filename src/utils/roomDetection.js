// Room Detection Algorithm
// Finds closed polygons formed by connected walls and computes their areas

const EPSILON = 2; // tolerance for matching endpoints

// Build graph of wall connections
const buildGraph = (walls) => {
    const nodes = new Map(); // key: "x,y" -> { x, y, edges: [{to, wallId}] }

    const getKey = (p) => `${Math.round(p.x)},${Math.round(p.y)}`;
    const getOrCreate = (p) => {
        const key = getKey(p);
        if (!nodes.has(key)) {
            nodes.set(key, { x: Math.round(p.x), y: Math.round(p.y), edges: [] });
        }
        return nodes.get(key);
    };

    walls.forEach(wall => {
        const startNode = getOrCreate(wall.start);
        const endNode = getOrCreate(wall.end);
        const startKey = getKey(wall.start);
        const endKey = getKey(wall.end);

        if (startKey === endKey) return; // skip zero-length

        startNode.edges.push({ toKey: endKey, wallId: wall.id });
        endNode.edges.push({ toKey: startKey, wallId: wall.id });
    });

    return nodes;
};

// Find minimal cycles using angle-based traversal
const findRooms = (walls) => {
    if (walls.length < 3) return [];

    const nodes = buildGraph(walls);
    const rooms = [];
    const usedEdgePairs = new Set(); // track "fromKey->toKey" directed edges used

    // For each node, try to trace a room starting from each edge
    for (const [startKey, startNode] of nodes) {
        for (const edge of startNode.edges) {
            const directedKey = `${startKey}->${edge.toKey}`;
            if (usedEdgePairs.has(directedKey)) continue;

            // Trace a polygon by always turning left (smallest CCW angle)
            const polygon = [];
            let currentKey = startKey;
            let prevKey = null;
            let nextKey = edge.toKey;
            let pathValid = true;
            const maxSteps = 20;
            let steps = 0;

            while (steps < maxSteps) {
                polygon.push({ ...nodes.get(currentKey) });
                const directed = `${currentKey}->${nextKey}`;
                usedEdgePairs.add(directed);

                prevKey = currentKey;
                currentKey = nextKey;
                const currentNode = nodes.get(currentKey);

                if (!currentNode || currentNode.edges.length < 2) {
                    pathValid = false;
                    break;
                }

                // Find next edge by smallest left-turn angle
                const inAngle = Math.atan2(
                    nodes.get(prevKey).y - currentNode.y,
                    nodes.get(prevKey).x - currentNode.x
                );

                let bestAngle = Infinity;
                let bestNextKey = null;

                for (const e of currentNode.edges) {
                    if (e.toKey === prevKey) continue;
                    const outAngle = Math.atan2(
                        nodes.get(e.toKey).y - currentNode.y,
                        nodes.get(e.toKey).x - currentNode.x
                    );
                    let angle = outAngle - inAngle;
                    if (angle <= 0) angle += 2 * Math.PI;
                    if (angle < bestAngle) {
                        bestAngle = angle;
                        bestNextKey = e.toKey;
                    }
                }

                if (!bestNextKey) {
                    pathValid = false;
                    break;
                }

                nextKey = bestNextKey;

                // Check if we've returned to start
                if (nextKey === startKey && currentKey === edge.toKey) {
                    // Full loop before closing — add current point
                    polygon.push({ ...nodes.get(currentKey) });
                    break;
                }
                if (nextKey === startKey) {
                    polygon.push({ ...nodes.get(currentKey) });
                    break;
                }

                steps++;
            }

            if (!pathValid || polygon.length < 3) continue;

            // Compute area using shoelace formula
            const area = computePolygonArea(polygon);
            if (Math.abs(area) < 100) continue; // too small to be a room

            // Compute centroid
            const centroid = computeCentroid(polygon);

            // Deduplicate: check if we already have a room with similar centroid
            const isDuplicate = rooms.some(r =>
                Math.hypot(r.centroid.x - centroid.x, r.centroid.y - centroid.y) < 10
            );

            if (!isDuplicate) {
                rooms.push({
                    points: polygon.map(p => ({ x: p.x, y: p.y })),
                    area: Math.abs(area),
                    centroid
                });
            }
        }
    }

    return rooms;
};

const computePolygonArea = (points) => {
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return area / 2;
};

const computeCentroid = (points) => {
    const n = points.length;
    let cx = 0, cy = 0;
    points.forEach(p => { cx += p.x; cy += p.y; });
    return { x: cx / n, y: cy / n };
};

export { findRooms, computePolygonArea, computeCentroid };
