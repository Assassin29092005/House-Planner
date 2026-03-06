export const CONFIG = {
  WALL_HEIGHT: 100,
  WALL_THICKNESS: 10,
  GRID_SIZE: 50,
  MAX_UNSUPPORTED_SPAN: 150,
  COLOR_UNSTABLE: '#ef4444',
  COLOR_STABLE: '#334155',
  COLOR_WALL_DEFAULT: '#94a3b8',
  COLOR_SELECTED: '#3b82f6',
  COLOR_GHOST: '#cbd5e1',
  COLOR_PILLAR: '#475569',
  DEFAULT_LEVEL_HEIGHT: 100,
  PILLAR_SIZE: 15,

  TEXTURES: {
    brick: '/textures/brick.jpg',
    wood: '/textures/wood.jpg',
    tile: '/textures/tile.jpg',
    marble: '/textures/marble.jpg',
    granite: '/textures/granite.jpg',
  },

  // Floor/Ceiling textures
  FLOOR_TEXTURES: {
    none: { label: 'Default', color: '#334155' },
    wood: { label: 'Wood', color: '#92400e', texture: '/textures/wood.jpg' },
    tile: { label: 'Tile', color: '#d1d5db', texture: '/textures/tile.jpg' },
    marble: { label: 'Marble', color: '#e2e8f0', texture: '/textures/marble.jpg' },
    granite: { label: 'Granite', color: '#4b5563', texture: '/textures/granite.jpg' },
    carpet: { label: 'Carpet', color: '#6b21a8' },
    concrete: { label: 'Concrete', color: '#78716c' },
  },

  // 3D Materials Library
  MATERIALS: {
    default: { color: '#94a3b8', roughness: 0.8, metalness: 0 },
    brick: { color: '#b45309', roughness: 0.9, metalness: 0 },
    concrete: { color: '#78716c', roughness: 0.95, metalness: 0 },
    glass: { color: '#bfdbfe', roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.3 },
    metal: { color: '#94a3b8', roughness: 0.3, metalness: 0.9 },
    granite: { color: '#6b7280', roughness: 0.5, metalness: 0.2 },
    marble: { color: '#e2e8f0', roughness: 0.3, metalness: 0.1 },
    wood: { color: '#92400e', roughness: 0.7, metalness: 0 },
  },

  UNITS: {
    ft: { label: 'Feet', factor: 0.1, suffix: 'ft', pxPerUnit: 10 },
    m: { label: 'Meters', factor: 0.03, suffix: 'm', pxPerUnit: 33.33 },
  },

  PRESETS: [
    { name: 'Small House', ft: { w: 30, d: 20 }, m: { w: 9, d: 6 }, icon: '🏠' },
    { name: 'Apartment', ft: { w: 50, d: 35 }, m: { w: 15, d: 11 }, icon: '🏢' },
    { name: 'Villa', ft: { w: 80, d: 60 }, m: { w: 24, d: 18 }, icon: '🏡' },
    { name: 'Custom', ft: { w: 0, d: 0 }, m: { w: 0, d: 0 }, icon: '✏️' },
  ],

  SHORTCUTS: [
    { key: 'V', label: 'Select Tool' },
    { key: 'W', label: 'Wall Tool' },
    { key: 'P', label: 'Paint Tool' },
    { key: 'G', label: 'Toggle Grid Snap' },
    { key: 'Del', label: 'Delete Selected' },
    { key: 'Ctrl+Z', label: 'Undo' },
    { key: 'Ctrl+Y', label: 'Redo' },
    { key: 'Ctrl+S', label: 'Save Project' },
    { key: 'Ctrl+E', label: 'Export PNG' },
    { key: 'Shift+Click', label: 'Multi-Select' },
    { key: '?', label: 'Shortcuts' },
  ],

  PAINT_COLORS: [
    { name: 'Slate', hex: '#94a3b8' },
    { name: 'White', hex: '#f8fafc' },
    { name: 'Cream', hex: '#fef3c7' },
    { name: 'Sky', hex: '#7dd3fc' },
    { name: 'Rose', hex: '#fda4af' },
    { name: 'Sage', hex: '#86efac' },
    { name: 'Amber', hex: '#fbbf24' },
    { name: 'Violet', hex: '#c4b5fd' },
  ],

  // Room colors for visualization
  ROOM_COLORS: [
    'rgba(59, 130, 246, 0.08)',
    'rgba(16, 185, 129, 0.08)',
    'rgba(245, 158, 11, 0.08)',
    'rgba(239, 68, 68, 0.08)',
    'rgba(139, 92, 246, 0.08)',
    'rgba(236, 72, 153, 0.08)',
    'rgba(6, 182, 212, 0.08)',
    'rgba(132, 204, 22, 0.08)',
  ],
};