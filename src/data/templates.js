// Pre-built floor plan templates with complete room layouts

export const TEMPLATES = {
    studio: {
        name: 'Studio Apartment',
        icon: '🏠',
        siteWidth: 500,
        siteDepth: 400,
        walls: [
            // Outer walls
            { start: { x: 0, y: 0 }, end: { x: 500, y: 0 }, openings: [
                { type: 'window', dist: 150 },
                { type: 'window', dist: 350 },
            ]},
            { start: { x: 500, y: 0 }, end: { x: 500, y: 400 }, openings: [
                { type: 'window', dist: 140 },
            ]},
            { start: { x: 0, y: 400 }, end: { x: 500, y: 400 }, openings: [
                { type: 'door', dist: 250 },
            ]},
            { start: { x: 0, y: 0 }, end: { x: 0, y: 400 }, openings: [
                { type: 'window', dist: 140 },
            ]},
            // Bathroom partition (bottom-left)
            { start: { x: 0, y: 280 }, end: { x: 150, y: 280 }, openings: [
                { type: 'door', dist: 110 },
            ]},
            { start: { x: 150, y: 280 }, end: { x: 150, y: 400 } },
            // Kitchen partition (bottom-right)
            { start: { x: 350, y: 280 }, end: { x: 350, y: 400 }, openings: [
                { type: 'door', dist: 30 },
            ]},
            { start: { x: 350, y: 280 }, end: { x: 500, y: 280 } },
        ],
        furniture: [
            { type: 'bed', x: 70, y: 80 },
            { type: 'sofa', x: 280, y: 200 },
            { type: 'desk', x: 420, y: 60 },
            { type: 'table', x: 425, y: 345 },
            { type: 'chair', x: 250, y: 345 },
        ],
        roomLabels: [
            { x: 250, y: 120, name: 'Living / Bedroom' },
            { x: 75, y: 340, name: 'Bathroom' },
            { x: 425, y: 330, name: 'Kitchen' },
        ]
    },

    '2bhk': {
        name: '2 BHK Apartment',
        icon: '🏢',
        siteWidth: 800,
        siteDepth: 600,
        walls: [
            // Outer walls
            { start: { x: 0, y: 0 }, end: { x: 800, y: 0 }, openings: [
                { type: 'window', dist: 150 },
                { type: 'window', dist: 450 },
            ]},
            { start: { x: 800, y: 0 }, end: { x: 800, y: 600 }, openings: [
                { type: 'window', dist: 400 },
            ]},
            { start: { x: 0, y: 600 }, end: { x: 800, y: 600 }, openings: [
                { type: 'door', dist: 350 },
            ]},
            { start: { x: 0, y: 0 }, end: { x: 0, y: 600 }, openings: [
                { type: 'window', dist: 150 },
                { type: 'window', dist: 450 },
            ]},
            // Bedroom divider (vertical)
            { start: { x: 300, y: 0 }, end: { x: 300, y: 300 } },
            // Bedrooms / living-dining divider (horizontal)
            { start: { x: 0, y: 300 }, end: { x: 600, y: 300 }, openings: [
                { type: 'door', dist: 150 },
                { type: 'door', dist: 450 },
            ]},
            // Bathroom 1 left wall (between bed2 and bath1)
            { start: { x: 600, y: 0 }, end: { x: 600, y: 180 }, openings: [
                { type: 'door', dist: 90 },
            ]},
            // Bathroom 1 bottom wall
            { start: { x: 600, y: 180 }, end: { x: 800, y: 180 } },
            // Kitchen / living divider (vertical, below bath1)
            { start: { x: 600, y: 180 }, end: { x: 600, y: 600 }, openings: [
                { type: 'door', dist: 120 },
            ]},
            // Bathroom 2 top wall (bottom-left corner)
            { start: { x: 0, y: 460 }, end: { x: 140, y: 460 }, openings: [
                { type: 'door', dist: 100 },
            ]},
            // Bathroom 2 right wall
            { start: { x: 140, y: 460 }, end: { x: 140, y: 600 } },
        ],
        furniture: [
            // Master bedroom
            { type: 'bed', x: 150, y: 120 },
            { type: 'desk', x: 100, y: 250 },
            // Bedroom 2
            { type: 'bed', x: 430, y: 120 },
            { type: 'desk', x: 500, y: 250 },
            // Living room
            { type: 'sofa', x: 250, y: 400 },
            { type: 'table', x: 250, y: 460 },
            // Kitchen
            { type: 'table', x: 700, y: 380 },
            { type: 'chair', x: 700, y: 430 },
            // Dining
            { type: 'chair', x: 380, y: 520 },
            { type: 'table', x: 350, y: 550 },
        ],
        roomLabels: [
            { x: 150, y: 150, name: 'Master Bedroom' },
            { x: 430, y: 150, name: 'Bedroom 2' },
            { x: 700, y: 90, name: 'Bathroom 1' },
            { x: 250, y: 370, name: 'Living Room' },
            { x: 700, y: 400, name: 'Kitchen' },
            { x: 70, y: 530, name: 'Bathroom 2' },
            { x: 300, y: 540, name: 'Dining' },
        ]
    },

    '3bhk': {
        name: '3 BHK Villa',
        icon: '🏡',
        siteWidth: 1000,
        siteDepth: 700,
        walls: [
            // Outer walls
            { start: { x: 0, y: 0 }, end: { x: 1000, y: 0 }, openings: [
                { type: 'window', dist: 150 },
                { type: 'window', dist: 425 },
                { type: 'window', dist: 675 },
            ]},
            { start: { x: 1000, y: 0 }, end: { x: 1000, y: 700 }, openings: [
                { type: 'window', dist: 350 },
            ]},
            { start: { x: 0, y: 700 }, end: { x: 1000, y: 700 }, openings: [
                { type: 'door', dist: 400 },
            ]},
            { start: { x: 0, y: 0 }, end: { x: 0, y: 700 }, openings: [
                { type: 'window', dist: 150 },
                { type: 'window', dist: 500 },
            ]},
            // Bedroom dividers (vertical)
            { start: { x: 300, y: 0 }, end: { x: 300, y: 300 } },
            { start: { x: 550, y: 0 }, end: { x: 550, y: 300 } },
            // Bedrooms / living divider (horizontal)
            { start: { x: 0, y: 300 }, end: { x: 800, y: 300 }, openings: [
                { type: 'door', dist: 200 },
                { type: 'door', dist: 425 },
                { type: 'door', dist: 675 },
            ]},
            // Bathroom 1 left wall (between bed3 and bath1)
            { start: { x: 800, y: 0 }, end: { x: 800, y: 170 }, openings: [
                { type: 'door', dist: 85 },
            ]},
            // Bathroom 1 bottom wall
            { start: { x: 800, y: 170 }, end: { x: 1000, y: 170 } },
            // Kitchen left wall (from bath1 bottom to kitchen/bath2 divider)
            { start: { x: 800, y: 170 }, end: { x: 800, y: 500 }, openings: [
                { type: 'door', dist: 165 },
            ]},
            // Kitchen / Bath 2 divider
            { start: { x: 800, y: 500 }, end: { x: 1000, y: 500 } },
            // Bath 2 left wall
            { start: { x: 800, y: 500 }, end: { x: 800, y: 700 }, openings: [
                { type: 'door', dist: 100 },
            ]},
            // Master bathroom top wall (inside master bedroom corner)
            { start: { x: 0, y: 180 }, end: { x: 130, y: 180 }, openings: [
                { type: 'door', dist: 90 },
            ]},
            // Master bathroom right wall
            { start: { x: 130, y: 180 }, end: { x: 130, y: 300 } },
        ],
        furniture: [
            // Master bedroom
            { type: 'bed', x: 220, y: 80 },
            { type: 'desk', x: 230, y: 250 },
            // Bedroom 2
            { type: 'bed', x: 425, y: 100 },
            { type: 'desk', x: 500, y: 250 },
            // Bedroom 3
            { type: 'bed', x: 675, y: 100 },
            { type: 'desk', x: 730, y: 250 },
            // Living room
            { type: 'sofa', x: 350, y: 420 },
            { type: 'table', x: 350, y: 480 },
            { type: 'chair', x: 280, y: 480 },
            // Kitchen
            { type: 'table', x: 900, y: 340 },
            // Dining area
            { type: 'table', x: 400, y: 600 },
            { type: 'chair', x: 350, y: 630 },
            { type: 'chair', x: 450, y: 630 },
        ],
        roomLabels: [
            { x: 220, y: 120, name: 'Master Bedroom' },
            { x: 65, y: 240, name: 'M. Bath' },
            { x: 425, y: 150, name: 'Bedroom 2' },
            { x: 675, y: 150, name: 'Bedroom 3' },
            { x: 900, y: 85, name: 'Bathroom 1' },
            { x: 400, y: 390, name: 'Living Room' },
            { x: 400, y: 600, name: 'Dining' },
            { x: 900, y: 340, name: 'Kitchen' },
            { x: 900, y: 600, name: 'Bathroom 2' },
        ]
    }
};
