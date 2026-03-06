// Pre-built floor plan templates with complete room layouts, textures, and furniture

// ─── Helpers ───
const C = {
    cream: '#fef3c7', white: '#f8fafc', sky: '#7dd3fc', sage: '#86efac',
    rose: '#fda4af', slate: '#94a3b8', amber: '#fbbf24', violet: '#c4b5fd',
};

const outerWall = (start, end, openings = []) => ({
    start, end, textureA: 'brick', colorSideB: C.cream, openings,
});
const innerWall = (start, end, colorA, colorB, openings = []) => ({
    start, end, colorSideA: colorA, colorSideB: colorB, openings,
});
const bathWall = (start, end, bathSide = 'B', openings = []) => ({
    start, end,
    ...(bathSide === 'A' ? { textureA: 'tile', colorSideB: C.cream } : { colorSideA: C.cream, textureB: 'tile' }),
    openings,
});
const kitchenWall = (start, end, kitchenSide = 'B', openings = []) => ({
    start, end,
    ...(kitchenSide === 'A' ? { textureA: 'tile', colorSideB: C.cream } : { colorSideA: C.cream, textureB: 'tile' }),
    openings,
});

// ─── TEMPLATES ───

export const TEMPLATES = {

    // ━━━ STUDIO APARTMENT — 500×400 ━━━
    studio: {
        name: 'Studio Apartment',
        icon: '🏠',
        siteWidth: 500,
        siteDepth: 400,
        walls: [
            outerWall({ x: 0, y: 0 }, { x: 500, y: 0 }, [{ type: 'window', dist: 150 }, { type: 'window', dist: 350 }]),
            outerWall({ x: 500, y: 0 }, { x: 500, y: 400 }, [{ type: 'window', dist: 140 }]),
            outerWall({ x: 0, y: 400 }, { x: 500, y: 400 }, [{ type: 'door', dist: 250 }]),
            outerWall({ x: 0, y: 0 }, { x: 0, y: 400 }, [{ type: 'window', dist: 140 }]),
            bathWall({ x: 0, y: 280 }, { x: 150, y: 280 }, 'B', [{ type: 'door', dist: 110 }]),
            bathWall({ x: 150, y: 280 }, { x: 150, y: 400 }, 'A'),
            kitchenWall({ x: 350, y: 280 }, { x: 350, y: 400 }, 'B', [{ type: 'door', dist: 30 }]),
            kitchenWall({ x: 350, y: 280 }, { x: 500, y: 280 }, 'B'),
        ],
        furniture: [
            { type: 'bed', x: 70, y: 80 },
            { type: 'cupboard', x: 250, y: 25 },
            { type: 'sofa', x: 280, y: 200 },
            { type: 'desk', x: 420, y: 60 },
            { type: 'table', x: 425, y: 345 },
            { type: 'chair', x: 250, y: 345 },
            { type: 'toilet', x: 40, y: 350 },
        ],
        roomLabels: [
            { x: 250, y: 120, name: 'Living / Bedroom' },
            { x: 75, y: 310, name: 'Bathroom' },
            { x: 425, y: 330, name: 'Kitchen' },
        ]
    },

    // ━━━ 1 BHK — 600×500 ━━━
    '1bhk': {
        name: '1 BHK Apartment',
        icon: '🏠',
        siteWidth: 600,
        siteDepth: 500,
        walls: [
            outerWall({ x: 0, y: 0 }, { x: 600, y: 0 }, [{ type: 'window', dist: 175 }, { type: 'window', dist: 475 }]),
            outerWall({ x: 600, y: 0 }, { x: 600, y: 500 }, [{ type: 'window', dist: 150 }]),
            outerWall({ x: 0, y: 500 }, { x: 600, y: 500 }, [{ type: 'door', dist: 250 }]),
            outerWall({ x: 0, y: 0 }, { x: 0, y: 500 }, [{ type: 'window', dist: 140 }]),
            innerWall({ x: 350, y: 0 }, { x: 350, y: 280 }, C.violet, C.cream),
            innerWall({ x: 0, y: 280 }, { x: 350, y: 280 }, C.violet, C.cream, [{ type: 'door', dist: 175 }]),
            kitchenWall({ x: 350, y: 280 }, { x: 600, y: 280 }, 'A', [{ type: 'door', dist: 125 }]),
            bathWall({ x: 0, y: 400 }, { x: 150, y: 400 }, 'B', [{ type: 'door', dist: 110 }]),
            bathWall({ x: 150, y: 400 }, { x: 150, y: 500 }, 'A'),
        ],
        furniture: [
            { type: 'bed', x: 175, y: 100 },
            { type: 'cupboard', x: 175, y: 20 },
            { type: 'desk', x: 80, y: 230 },
            { type: 'table', x: 475, y: 140 },
            { type: 'chair', x: 475, y: 190 },
            { type: 'cupboard', x: 475, y: 20 },
            { type: 'sofa', x: 250, y: 360 },
            { type: 'table', x: 350, y: 440 },
            { type: 'chair', x: 300, y: 440 },
            { type: 'toilet', x: 40, y: 460 },
        ],
        roomLabels: [
            { x: 175, y: 140, name: 'Bedroom' },
            { x: 475, y: 140, name: 'Kitchen' },
            { x: 280, y: 350, name: 'Living / Dining' },
            { x: 75, y: 450, name: 'Bathroom' },
        ]
    },

    // ━━━ 2 BHK — 800×600 ━━━
    '2bhk': {
        name: '2 BHK Apartment',
        icon: '🏢',
        siteWidth: 800,
        siteDepth: 600,
        walls: [
            outerWall({ x: 0, y: 0 }, { x: 800, y: 0 }, [{ type: 'window', dist: 150 }, { type: 'window', dist: 450 }]),
            outerWall({ x: 800, y: 0 }, { x: 800, y: 600 }, [{ type: 'window', dist: 400 }]),
            outerWall({ x: 0, y: 600 }, { x: 800, y: 600 }, [{ type: 'door', dist: 350 }]),
            outerWall({ x: 0, y: 0 }, { x: 0, y: 600 }, [{ type: 'window', dist: 150 }, { type: 'window', dist: 450 }]),
            innerWall({ x: 300, y: 0 }, { x: 300, y: 300 }, C.violet, C.rose),
            innerWall({ x: 0, y: 300 }, { x: 600, y: 300 }, C.violet, C.cream, [{ type: 'door', dist: 150 }, { type: 'door', dist: 450 }]),
            bathWall({ x: 600, y: 0 }, { x: 600, y: 180 }, 'B', [{ type: 'door', dist: 90 }]),
            bathWall({ x: 600, y: 180 }, { x: 800, y: 180 }, 'A'),
            kitchenWall({ x: 600, y: 180 }, { x: 600, y: 600 }, 'B', [{ type: 'door', dist: 120 }]),
            bathWall({ x: 0, y: 460 }, { x: 140, y: 460 }, 'B', [{ type: 'door', dist: 100 }]),
            bathWall({ x: 140, y: 460 }, { x: 140, y: 600 }, 'A'),
        ],
        furniture: [
            { type: 'bed', x: 150, y: 120 },
            { type: 'cupboard', x: 200, y: 20 },
            { type: 'desk', x: 100, y: 250 },
            { type: 'bed', x: 430, y: 120 },
            { type: 'cupboard', x: 430, y: 20 },
            { type: 'desk', x: 500, y: 250 },
            { type: 'toilet', x: 700, y: 60 },
            { type: 'toilet', x: 40, y: 530 },
            { type: 'sofa', x: 250, y: 400 },
            { type: 'table', x: 250, y: 460 },
            { type: 'table', x: 700, y: 380 },
            { type: 'chair', x: 700, y: 430 },
            { type: 'cupboard', x: 700, y: 240 },
            { type: 'table', x: 350, y: 550 },
            { type: 'chair', x: 300, y: 550 },
            { type: 'chair', x: 400, y: 550 },
        ],
        roomLabels: [
            { x: 150, y: 150, name: 'Master Bedroom' },
            { x: 430, y: 150, name: 'Bedroom 2' },
            { x: 700, y: 90, name: 'Bathroom 1' },
            { x: 250, y: 370, name: 'Living Room' },
            { x: 700, y: 400, name: 'Kitchen' },
            { x: 70, y: 530, name: 'Bathroom 2' },
            { x: 350, y: 530, name: 'Dining' },
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3 BHK VILLA — 1000×700 — TWO FLOORS
    //
    // STRUCTURAL GRID shared by both floors:
    //   Vertical:   x = 0, 350, 650, 1000
    //   Horizontal: y = 0, 350, 550, 700
    // This ensures every 1st-floor wall sits directly above
    // a ground-floor wall, so the structure stays stable.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    '3bhk': {
        name: '3 BHK Villa',
        icon: '🏡',
        siteWidth: 1000,
        siteDepth: 700,
        stairs: [
            { x: 500, y: 175, levelId: 0, width: 40, length: 90 },
        ],
        floors: [
            // ── GROUND FLOOR ──
            // Living(0-350,0-350)  Dining(350-650,0-350)  Kitchen(650-1000,0-350)
            // Entry Hall(0-650,350-700)  Utility(650-1000,350-550)  Store(650-1000,550-700)
            // Guest Bath(0-160,550-700) inside Entry Hall
            {
                walls: [
                    outerWall({ x: 0, y: 0 }, { x: 1000, y: 0 }, [{ type: 'window', dist: 175 }, { type: 'window', dist: 500 }, { type: 'window', dist: 825 }]),
                    outerWall({ x: 1000, y: 0 }, { x: 1000, y: 700 }, [{ type: 'window', dist: 175 }, { type: 'window', dist: 525 }]),
                    outerWall({ x: 0, y: 700 }, { x: 1000, y: 700 }, [{ type: 'door', dist: 350 }]),
                    outerWall({ x: 0, y: 0 }, { x: 0, y: 700 }, [{ type: 'window', dist: 175 }]),
                    // Vertical structural walls
                    innerWall({ x: 350, y: 0 }, { x: 350, y: 350 }, C.cream, C.cream, [{ type: 'door', dist: 175 }]),
                    kitchenWall({ x: 650, y: 0 }, { x: 650, y: 350 }, 'B', [{ type: 'door', dist: 175 }]),
                    // Main horizontal structural wall (full width)
                    innerWall({ x: 0, y: 350 }, { x: 1000, y: 350 }, C.cream, C.cream, [
                        { type: 'door', dist: 175 }, { type: 'door', dist: 500 }, { type: 'door', dist: 825 },
                    ]),
                    // Utility / Store divider on right side
                    innerWall({ x: 650, y: 350 }, { x: 650, y: 700 }, C.cream, C.cream, [{ type: 'door', dist: 100 }]),
                    innerWall({ x: 650, y: 550 }, { x: 1000, y: 550 }, C.cream, C.cream),
                    // Guest Bath (bottom-left of entry hall)
                    bathWall({ x: 0, y: 550 }, { x: 160, y: 550 }, 'B', [{ type: 'door', dist: 120 }]),
                    bathWall({ x: 160, y: 550 }, { x: 160, y: 700 }, 'A'),
                ],
                furniture: [
                    // Living Room (0-350, 0-350)
                    { type: 'sofa', x: 175, y: 140 },
                    { type: 'table', x: 175, y: 200 },
                    { type: 'chair', x: 100, y: 200 },
                    { type: 'chair', x: 250, y: 200 },
                    // Dining (350-650, 0-350)
                    { type: 'table', x: 500, y: 280 },
                    { type: 'chair', x: 450, y: 310 },
                    { type: 'chair', x: 550, y: 310 },
                    { type: 'chair', x: 450, y: 250 },
                    { type: 'chair', x: 550, y: 250 },
                    // Kitchen (650-1000, 0-350)
                    { type: 'table', x: 825, y: 175 },
                    { type: 'chair', x: 825, y: 230 },
                    { type: 'cupboard', x: 825, y: 30 },
                    { type: 'cupboard', x: 950, y: 175, rotation: 90 },
                    // Entry Hall
                    { type: 'sofa', x: 350, y: 500 },
                    // Utility (650-1000, 350-550)
                    { type: 'cupboard', x: 825, y: 380 },
                    { type: 'cupboard', x: 825, y: 460 },
                    // Guest Bath
                    { type: 'toilet', x: 50, y: 630 },
                ],
                roomLabels: [
                    { x: 175, y: 120, name: 'Living Room' },
                    { x: 500, y: 150, name: 'Dining' },
                    { x: 825, y: 150, name: 'Kitchen' },
                    { x: 325, y: 500, name: 'Entry Hall' },
                    { x: 825, y: 440, name: 'Utility' },
                    { x: 825, y: 620, name: 'Store' },
                    { x: 80, y: 630, name: 'Guest Bath' },
                    { x: 500, y: 175, name: 'Stairs' },
                ]
            },
            // ── FIRST FLOOR ──
            // Master BR(0-350,0-350)  Bed2(350-650,0-350)  Bed3(650-1000,0-350)
            // Landing(0-1000,350-700)
            // Bath1(0-160,550-700)  Bath2(650-1000,550-700)
            {
                walls: [
                    outerWall({ x: 0, y: 0 }, { x: 1000, y: 0 }, [{ type: 'window', dist: 175 }, { type: 'window', dist: 500 }, { type: 'window', dist: 825 }]),
                    outerWall({ x: 1000, y: 0 }, { x: 1000, y: 700 }, [{ type: 'window', dist: 175 }]),
                    outerWall({ x: 0, y: 700 }, { x: 1000, y: 700 }),
                    outerWall({ x: 0, y: 0 }, { x: 0, y: 700 }, [{ type: 'window', dist: 175 }]),
                    // Bedroom dividers (on structural grid)
                    innerWall({ x: 350, y: 0 }, { x: 350, y: 350 }, C.violet, C.rose),
                    innerWall({ x: 650, y: 0 }, { x: 650, y: 350 }, C.rose, C.amber),
                    // Bedrooms / Landing divider (full width, on structural grid)
                    innerWall({ x: 0, y: 350 }, { x: 1000, y: 350 }, C.white, C.cream, [
                        { type: 'door', dist: 175 }, { type: 'door', dist: 500 }, { type: 'door', dist: 825 },
                    ]),
                    // Bathroom 1 (bottom-left, on structural grid)
                    bathWall({ x: 0, y: 550 }, { x: 160, y: 550 }, 'B', [{ type: 'door', dist: 120 }]),
                    bathWall({ x: 160, y: 550 }, { x: 160, y: 700 }, 'A'),
                    // Bathroom 2 (bottom-right, on structural grid)
                    bathWall({ x: 650, y: 350 }, { x: 650, y: 700 }, 'B'),
                    bathWall({ x: 650, y: 550 }, { x: 1000, y: 550 }, 'A', [{ type: 'door', dist: 175 }]),
                ],
                furniture: [
                    // Master Bedroom (0-350, 0-350)
                    { type: 'bed', x: 175, y: 100 },
                    { type: 'cupboard', x: 250, y: 20 },
                    { type: 'desk', x: 80, y: 290 },
                    // Bedroom 2 (350-650, 0-350)
                    { type: 'bed', x: 500, y: 100 },
                    { type: 'cupboard', x: 500, y: 20 },
                    { type: 'desk', x: 430, y: 290 },
                    // Bedroom 3 (650-1000, 0-350)
                    { type: 'bed', x: 825, y: 100 },
                    { type: 'cupboard', x: 825, y: 20 },
                    { type: 'desk', x: 730, y: 290 },
                    // Landing
                    { type: 'sofa', x: 350, y: 450 },
                    { type: 'table', x: 350, y: 510 },
                    // Bath 1
                    { type: 'toilet', x: 50, y: 630 },
                    // Bath 2
                    { type: 'toilet', x: 825, y: 630 },
                ],
                roomLabels: [
                    { x: 175, y: 175, name: 'Master Bedroom' },
                    { x: 500, y: 175, name: 'Bedroom 2' },
                    { x: 825, y: 175, name: 'Bedroom 3' },
                    { x: 350, y: 430, name: 'Landing' },
                    { x: 80, y: 630, name: 'Bathroom 1' },
                    { x: 825, y: 630, name: 'Bathroom 2' },
                ]
            }
        ],
    },

    // ━━━ 4 BHK PREMIUM — 1200×800 ━━━
    '4bhk': {
        name: '4 BHK Premium',
        icon: '🏰',
        siteWidth: 1200,
        siteDepth: 800,
        walls: [
            outerWall({ x: 0, y: 0 }, { x: 1200, y: 0 }, [
                { type: 'window', dist: 150 }, { type: 'window', dist: 450 },
                { type: 'window', dist: 750 }, { type: 'window', dist: 1050 },
            ]),
            outerWall({ x: 1200, y: 0 }, { x: 1200, y: 800 }, [{ type: 'window', dist: 200 }, { type: 'window', dist: 600 }]),
            outerWall({ x: 0, y: 800 }, { x: 1200, y: 800 }, [{ type: 'door', dist: 450 }]),
            outerWall({ x: 0, y: 0 }, { x: 0, y: 800 }, [{ type: 'window', dist: 175 }, { type: 'window', dist: 600 }]),
            // Bedroom dividers (top row)
            innerWall({ x: 300, y: 0 }, { x: 300, y: 350 }, C.violet, C.rose),
            innerWall({ x: 600, y: 0 }, { x: 600, y: 350 }, C.rose, C.amber),
            innerWall({ x: 900, y: 0 }, { x: 900, y: 350 }, C.amber, C.white),
            // Bedrooms / Living horizontal divider
            innerWall({ x: 0, y: 350 }, { x: 900, y: 350 }, C.white, C.cream, [
                { type: 'door', dist: 150 }, { type: 'door', dist: 450 }, { type: 'door', dist: 750 },
            ]),
            innerWall({ x: 900, y: 350 }, { x: 1200, y: 350 }, C.white, C.cream, [{ type: 'door', dist: 150 }]),
            // Master ensuite bath
            bathWall({ x: 0, y: 220 }, { x: 120, y: 220 }, 'B', [{ type: 'door', dist: 80 }]),
            bathWall({ x: 120, y: 220 }, { x: 120, y: 350 }, 'A'),
            // Kitchen (right side, below bed4)
            kitchenWall({ x: 900, y: 350 }, { x: 900, y: 600 }, 'B', [{ type: 'door', dist: 125 }]),
            kitchenWall({ x: 900, y: 600 }, { x: 1200, y: 600 }, 'A'),
            // Bath 2 (bottom-right corner)
            bathWall({ x: 900, y: 600 }, { x: 900, y: 800 }, 'B', [{ type: 'door', dist: 100 }]),
            // Study room (bottom-left)
            innerWall({ x: 0, y: 550 }, { x: 250, y: 550 }, C.cream, C.white, [{ type: 'door', dist: 180 }]),
            innerWall({ x: 250, y: 550 }, { x: 250, y: 800 }, C.white, C.cream),
        ],
        furniture: [
            // Master Bedroom
            { type: 'bed', x: 200, y: 80 },
            { type: 'cupboard', x: 200, y: 15 },
            { type: 'desk', x: 230, y: 300 },
            { type: 'toilet', x: 40, y: 290 },
            // Bedroom 2
            { type: 'bed', x: 450, y: 120 },
            { type: 'cupboard', x: 450, y: 20 },
            { type: 'desk', x: 530, y: 300 },
            // Bedroom 3
            { type: 'bed', x: 750, y: 120 },
            { type: 'cupboard', x: 750, y: 20 },
            { type: 'desk', x: 830, y: 300 },
            // Bedroom 4
            { type: 'bed', x: 1050, y: 120 },
            { type: 'cupboard', x: 1050, y: 20 },
            { type: 'desk', x: 1120, y: 300 },
            // Living Room
            { type: 'sofa', x: 450, y: 450 },
            { type: 'table', x: 450, y: 510 },
            { type: 'chair', x: 350, y: 510 },
            { type: 'chair', x: 550, y: 510 },
            // Kitchen
            { type: 'table', x: 1050, y: 475 },
            { type: 'chair', x: 1050, y: 530 },
            { type: 'cupboard', x: 1050, y: 380 },
            { type: 'cupboard', x: 1150, y: 475, rotation: 90 },
            // Dining
            { type: 'table', x: 600, y: 700 },
            { type: 'chair', x: 550, y: 730 },
            { type: 'chair', x: 650, y: 730 },
            { type: 'chair', x: 550, y: 670 },
            { type: 'chair', x: 650, y: 670 },
            // Study
            { type: 'desk', x: 125, y: 650 },
            { type: 'chair', x: 125, y: 700 },
            { type: 'cupboard', x: 125, y: 580 },
            // Bath 2
            { type: 'toilet', x: 960, y: 700 },
        ],
        roomLabels: [
            { x: 200, y: 110, name: 'Master Bedroom' },
            { x: 60, y: 290, name: 'M. Bath' },
            { x: 450, y: 175, name: 'Bedroom 2' },
            { x: 750, y: 175, name: 'Bedroom 3' },
            { x: 1050, y: 175, name: 'Bedroom 4' },
            { x: 450, y: 430, name: 'Living Room' },
            { x: 1050, y: 460, name: 'Kitchen' },
            { x: 600, y: 680, name: 'Dining' },
            { x: 125, y: 640, name: 'Study' },
            { x: 970, y: 700, name: 'Bathroom 2' },
        ]
    },
};
