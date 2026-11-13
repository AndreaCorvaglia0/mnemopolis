// Zones: small hand-designed groups of furniture ("vignettes") with fixed relative positions.
// A room is composed of 2 or 3 of them (compose.js); nothing is placed one stray piece at a time.
//
// Each zone has one layout per way it can stand in a room:
//   back    against the back wall: row 0 touches the wall (tall pieces only on row 0)
//   side    against a side wall, written for the LEFT wall (column 0 touches it); mirrored on the right
//   island  free-standing, with a walkway left all around it
// A layout: { w, h, pieces: [[type, dx, dy, options]], keep: [[dx, dy]], rug: [dx, dy, w, h], wall: [[type, dx, n]] }
//   pieces   names from pieces.js; options reach the painter (fill, tint, ladder, face)
//   keep     tiles that stay free for use (in front of a desk); every empty tile of the box stays free anyway
//   rug      only under the group, inside the box
//   wall     decorations on the back wall above a back layout (types in paint.js), part of the group
// variants: alternative options applied to every piece (a zone's variant is picked by the seed).
// Tints are names of the room's palette (band, accent, wood, dye), never colours: one palette per room.
// To add a zone: one entry here, its name in a kind (kinds.js) or a trade (trades.js). `npm test`
// checks that it fits somewhere and keeps every rule.
const row = (types, opts = {}) => types.map((t, i) => (t ? [t, i, 0, opts] : null)).filter(Boolean);

export const ZONES = {
  // ---------------------------------------------------------------- lived-in rooms (homes, and some institutions)
  study: { label: 'study corner',
    back: { w: 3, h: 2, pieces: [['desk', 0, 0], ['lamp', 2, 0], ['chair', 0, 1, { face: 'up' }]], keep: [[1, 1]] } },
  sitting: { label: 'conversation corner', variants: [{ tint: 'band' }, { tint: 'accent' }],
    back: { w: 3, h: 2, pieces: [['armchair', 0, 0], ['sidetable', 1, 0], ['armchair', 2, 0]], rug: [0, 0, 3, 2] },
    island: { w: 3, h: 2, pieces: [['armchair', 0, 0], ['sidetable', 1, 0], ['armchair', 2, 0]], rug: [0, 0, 3, 2] } },
  library: { label: 'library wall', variants: [{ fill: 'books' }],
    back: { w: 4, h: 1, pieces: [['shelf', 0, 0], ['shelf', 2, 0, { ladder: true }]] } },
  readingTable: { label: 'reading table', variants: [{ tint: 'band' }, { tint: 'accent' }],
    island: { w: 4, h: 2, pieces: [['chair', 0, 0], ['readtable', 1, 0], ['chair', 3, 0]], rug: [0, 0, 4, 2] } },
  kitchen: { label: 'kitchen wall',
    back: { w: 4, h: 1, pieces: [['shelf', 0, 0, { fill: 'plates' }], ['range', 2, 0]], wall: [['pans', 2, 2]] } },
  pantry: { label: 'pantry',
    back: { w: 3, h: 1, pieces: [['shelf1', 0, 0, { fill: 'jars' }], ['chest', 1, 0], ['shelf1', 2, 0, { fill: 'jars' }]] },
    side: { w: 1, h: 3, pieces: [['chest', 0, 0], ['basket', 0, 1], ['chest', 0, 2]] } },
  kitchenTable: { label: 'table',
    island: { w: 4, h: 1, pieces: [['stool', 0, 0], ['worktable', 1, 0], ['stool', 3, 0]] },
    back: { w: 4, h: 1, pieces: [['stool', 0, 0], ['worktable', 1, 0], ['stool', 3, 0]] } },
  mapTable: { label: 'map table',
    island: { w: 3, h: 2, pieces: [['charttable', 0, 0], ['globe', 2, 0], ['stool', 0, 1]], rug: [0, 0, 3, 2] },
    back: { w: 3, h: 2, pieces: [['charttable', 0, 0], ['globe', 2, 0], ['stool', 0, 1]], keep: [[1, 1]] } },
  planChest: { label: 'plan chests',
    back: { w: 4, h: 1, pieces: [['planchest', 0, 0], ['planchest', 2, 0]], wall: [['map', 0, 2], ['map', 2, 2]] } },
  dyeVats: { label: 'dye vats',
    back: { w: 3, h: 1, pieces: [['vat', 0, 0, { tint: 'band' }], ['vat', 1, 0, { tint: 'accent' }], ['vat', 2, 0, { tint: 'dye' }]], wall: [['cloths', 0, 3]] },
    side: { w: 1, h: 3, pieces: [['vat', 0, 0, { tint: 'band' }], ['vat', 0, 1, { tint: 'accent' }], ['vat', 0, 2, { tint: 'dye' }]] } },
  dryingRack: { label: 'drying rack',
    back: { w: 3, h: 1, pieces: [['rack', 0, 0], ['basket', 2, 0]] } },
  loom: { label: 'loom',
    back: { w: 3, h: 2, pieces: [['loom', 0, 0], ['basket', 2, 0], ['stool', 0, 1]], keep: [[1, 1]] } },
  pottery: { label: 'kiln and shelf',
    back: { w: 3, h: 1, pieces: [['shelf1', 0, 0, { fill: 'pots' }], ['kiln', 1, 0]] } },
  wheel: { label: "potter's wheel",
    island: { w: 2, h: 1, pieces: [['wheel', 0, 0], ['stool', 1, 0]] },
    back: { w: 2, h: 1, pieces: [['wheel', 0, 0], ['stool', 1, 0]] } },
  typeWall: { label: 'type cases',
    back: { w: 4, h: 1, pieces: [['drawers', 0, 0], ['papers', 1, 0], ['papers', 2, 0], ['drawers', 3, 0]], wall: [['poster', 1, 2]] } },
  piano: { label: 'piano',
    back: { w: 3, h: 2, pieces: [['piano', 0, 0], ['musicstand', 2, 0], ['stool', 0, 1]], keep: [[1, 1]] } },
  strings: { label: 'harp corner',
    back: { w: 3, h: 1, pieces: [['harp', 0, 0], ['chair', 1, 0], ['musicstand', 2, 0]] } },
  potting: { label: 'potting bench',
    back: { w: 4, h: 1, pieces: [['planter', 0, 0], ['pottingbench', 1, 0], ['planter', 3, 0]] } },
  greenery: { label: 'plants',
    back: { w: 3, h: 1, pieces: [['planter', 0, 0], ['plant', 1, 0], ['planter', 2, 0]] },
    side: { w: 1, h: 3, pieces: [['planter', 0, 0], ['plant', 0, 1], ['planter', 0, 2]] } },
  clockBench: { label: "clockmaker's bench",
    back: { w: 3, h: 2, pieces: [['clockbench', 0, 0], ['drawers', 2, 0], ['stool', 0, 1]], keep: [[1, 1]], wall: [['clock', 0, 1], ['clock', 1, 1]] } },
  drawersWall: { label: 'drawers',
    back: { w: 3, h: 1, pieces: row(['drawers', 'drawers', 'drawers']) } },
  surgery: { label: 'examination',
    back: { w: 4, h: 1, pieces: [['screen', 0, 0], ['examtable', 2, 0]] },
    island: { w: 3, h: 1, pieces: [['examtable', 0, 0], ['stool', 2, 0]] } },
  apothecary: { label: 'remedies',
    back: { w: 3, h: 1, pieces: [['shelf1', 0, 0, { fill: 'jars' }], ['cabinet', 1, 0], ['shelf1', 2, 0, { fill: 'jars' }]] } },
  easelCorner: { label: 'easel',
    back: { w: 3, h: 2, pieces: [['easel', 0, 0], ['painttable', 1, 0], ['canvases', 2, 0], ['stool', 0, 1]], keep: [[1, 1]] } },
  // ---------------------------------------------------------------- institutions
  labBench: { label: 'lab bench',
    back: { w: 3, h: 2, pieces: [['bench', 0, 0], ['stool', 1, 1]] } },
  instruments: { label: 'instrument wall',
    back: { w: 4, h: 1, pieces: [['cabinet', 0, 0], ['computer', 1, 0], ['cabinet', 3, 0]] } },
  labIsland: { label: 'lab table',
    island: { w: 2, h: 2, pieces: [['labtable', 0, 0], ['stool', 0, 1], ['stool', 1, 1]] } },
  council: { label: 'council table', variants: [{ tint: 'band' }, { tint: 'accent' }],
    island: { w: 5, h: 2, pieces: [['chair', 0, 0], ['longtable', 1, 0], ['chair', 4, 0]], rug: [0, 0, 5, 2] } },
  benches: { label: 'benches',
    back: { w: 4, h: 1, pieces: [['pew', 0, 0], ['pew', 2, 0]] } },
  bannerWall: { label: 'banners',
    back: { w: 3, h: 1, pieces: [['chest', 0, 0], ['candelabra', 1, 0], ['chest', 2, 0]], wall: [['banner', 0, 1], ['banner', 2, 1]] } },
  exam: { label: 'case table',
    island: { w: 3, h: 1, pieces: [['examtable', 0, 0], ['stool', 2, 0]] },
    back: { w: 4, h: 1, pieces: [['screen', 0, 0], ['examtable', 2, 0]] } },
  easels: { label: 'easels',
    back: { w: 3, h: 2, pieces: [['easel', 0, 0], ['easel', 2, 0], ['stool', 0, 1]], keep: [[1, 1]] } },
  telescopes: { label: 'telescopes',
    back: { w: 3, h: 1, pieces: [['scope', 0, 0], ['chest', 1, 0], ['scope', 2, 0]] } },
  readingDesk: { label: 'lectern',
    back: { w: 3, h: 1, pieces: [['shelf1', 0, 0, { fill: 'books' }], ['lectern', 1, 0], ['shelf1', 2, 0, { fill: 'books' }]] } },
  stalagmites: { label: 'stalagmites',
    back: { w: 3, h: 1, pieces: [['stalagmite', 0, 0], ['rock', 1, 0], ['stalagmite', 2, 0]] } },
  crystals: { label: 'crystal vein',
    side: { w: 1, h: 3, pieces: [['crystal', 0, 0], ['rock', 0, 1], ['crystal', 0, 2]] },
    back: { w: 3, h: 1, pieces: [['crystal', 0, 0], ['rock2', 1, 0]] } },
  caveCamp: { label: 'camp',
    island: { w: 3, h: 1, pieces: [['rock', 0, 0], ['chest', 1, 0], ['rock', 2, 0]] } },
};

export const ZONE_NAMES = Object.keys(ZONES);
export const ANCHORS = ['back', 'side', 'island'];
