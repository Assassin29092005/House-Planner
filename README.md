# House Planner

A browser-based 2D/3D house floor plan editor built with React, Konva, and Three.js. Design multi-floor homes with walls, doors, windows, furniture, and textures — then preview them in real-time 3D with day/night lighting and first-person walkthrough.

![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-7-purple)
![Three.js](https://img.shields.io/badge/Three.js-r181-black)
![Firebase](https://img.shields.io/badge/Firebase-12-orange)

---

## Features

### 2D Editor
- **Wall drawing** with click-to-place segments, angle snapping (15 degree increments), and alignment guides
- **Doors & windows** — place on any wall, drag to reposition along the wall
- **Furniture placement** — drag from the asset library; beds, sofas, desks, tables, chairs, toilets, cupboards
- **Rotation** — rotate furniture via properties panel or context menu
- **Multi-select** — Shift+click to select multiple elements, bulk move/delete
- **Room detection** — automatic closed-room detection with area calculation
- **Wall painting** — per-side colors and textures (brick, wood, tile, marble, granite)
- **Grid snap** — toggleable snap-to-grid for precise alignment
- **Multi-floor support** — add/remove levels, switch between floors, structural stability checking
- **Pillars & stairs** — structural elements for multi-story designs
- **Export** — PNG, PDF, and JSON export of floor plans

### 3D Viewer
- **Real-time 3D preview** generated from the 2D floor plan
- **Textured walls** with per-side materials (brick exterior, tile bathrooms, painted interiors)
- **Floor & ceiling rendering** per detected room with configurable textures
- **Roof generation** for the top level
- **3D doors & windows** rendered as openings with frames
- **3D furniture** — detailed geometry for all furniture types
- **Day/night cycle** — toggle between sunlit and moonlit scenes with adjustable time-of-day
- **First-person mode** — WASD movement + pointer lock for walking through your design
- **Orbit controls** — rotate, pan, and zoom the 3D view

### Templates
Pre-built floor plans to start from — fully designed with rooms, furniture, textures, and labels:

| Template | Size | Floors | Description |
|----------|------|--------|-------------|
| Studio Apartment | 500x400 | 1 | Open living/bedroom, kitchen, bathroom |
| 1 BHK | 600x500 | 1 | Separate bedroom, living/dining, kitchen, bathroom |
| 2 BHK | 800x600 | 1 | Two bedrooms, living room, kitchen, dining, two bathrooms |
| 3 BHK Villa | 1000x700 | 2 | Ground: living, dining, kitchen, entry hall, utility. First floor: 3 bedrooms, 2 bathrooms, landing with stairs |
| 4 BHK Premium | 1200x800 | 1 | Four bedrooms (master with ensuite), living, kitchen, dining, study, bathroom |

### Cloud Features
- **Firebase Authentication** — email/password sign-up and login
- **Save/Load projects** — persist designs to Firestore
- **Share links** — share projects via URL
- **Cost estimation** — auto-calculated from walls, openings, and furniture

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Firebase](https://console.firebase.google.com/) project with **Authentication** (Email/Password) and **Firestore** enabled

### Installation

```bash
git clone <repo-url>
cd house-planner
npm install
```

### Environment Setup

Copy the example env file and fill in your Firebase credentials:

```bash
cp .env.example .env
```

Edit `.env` with values from Firebase Console > Project Settings:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173` with hot module replacement.

### Production Build

```bash
npm run build
npm run preview
```

### Linting

```bash
npm run lint
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Select tool |
| `W` | Wall drawing tool |
| `P` | Paint tool |
| `G` | Toggle grid snap |
| `Del` | Delete selected |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Save project |
| `Ctrl+E` | Export PNG |
| `Shift+Click` | Multi-select |
| `?` | Show shortcuts |

**First-person 3D mode:** `W/A/S/D` to move, mouse to look around.

---

## Project Structure

```
src/
├── pages/
│   ├── LoginPage.jsx          # Firebase email/password auth
│   ├── SignupPage.jsx          # Account registration
│   ├── DashboardPage.jsx       # Project list from Firestore
│   └── EditorPage.jsx          # Main workspace (2D + 3D + panels)
├── components/
│   ├── TwoDEditor.jsx          # Konva canvas: walls, furniture, rooms
│   ├── ThreeDViewer.jsx        # Three.js 3D preview with materials & lighting
│   ├── AssetLibrary.jsx        # Sidebar drag source for furniture & elements
│   ├── SiteConfigModal.jsx     # Site dimensions & template selection
│   ├── CostEstimator.jsx       # Cost calculation from plan elements
│   ├── CloudPanel.jsx          # Save/load/share UI
│   ├── OnboardingTour.jsx      # First-visit walkthrough
│   ├── Toast.jsx               # Notification system
│   └── ErrorBoundary.jsx       # Top-level error boundary
├── utils/
│   ├── geometry.js             # Intersections, snapping, stability, 3D shapes
│   └── roomDetection.js        # Graph-based room polygon detection
├── data/
│   └── templates.js            # Pre-built floor plan templates
├── store.js                    # Zustand store (walls, objects, history, levels)
├── constants.js                # Config, colors, textures, materials, shortcuts
├── firebase.js                 # Auth & Firestore CRUD
├── App.jsx                     # Router & auth guard
└── main.jsx                    # Entry point
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build | Vite 7 |
| 2D Canvas | Konva / react-konva |
| 3D Engine | Three.js / @react-three/fiber + drei |
| State | Zustand |
| Styling | Tailwind CSS 3 |
| Auth & DB | Firebase Auth + Firestore |
| Routing | React Router 7 |
| Export | jsPDF, html2canvas |

---

## How It Works

1. **Draw walls** in the 2D editor — walls are stored as start/end point pairs with thickness, height, per-side colors/textures, and an array of openings (doors/windows).

2. **Room detection** uses a graph-based algorithm with angle-based traversal (left-turn rule) to find closed polygons from wall segments, computing area via the shoelace formula.

3. **3D generation** reads wall/furniture/opening data and constructs Three.js meshes in real time — extruded walls, floor/ceiling planes per detected room, and detailed 3D furniture models.

4. **Structural stability** for multi-floor buildings checks that every upper-floor wall point (start, end, midpoint) is within tolerance of a lower-floor wall or pillar, ensuring realistic load-bearing support.

5. **Undo/redo** snapshots state before every mutation (30-step history), with named version snapshots for manual save points.

---

## License

MIT
