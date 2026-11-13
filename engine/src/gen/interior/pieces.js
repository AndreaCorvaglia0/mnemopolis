// Furniture pieces: footprint width in tiles (every piece is one tile deep) and drawn height in
// pixels above the bottom of its footprint. Plain data; the painters are in furniture.js.
//   glow       the piece gives light ('teal' for a cold light)
//   structure  part of the building (pillars): exempt from the furniture rules
// A piece taller than TALL pixels must stand against a wall (rules.js checks it).
export const TALL = 27;

export const PIECES = {
  // sitting, writing, living
  desk: { fw: 2, ph: 22 }, chair: { fw: 1, ph: 18 }, armchair: { fw: 1, ph: 20 }, sidetable: { fw: 1, ph: 15 },
  lamp: { fw: 1, ph: 32, glow: true }, stool: { fw: 1, ph: 14 }, pew: { fw: 2, ph: 18 }, chest: { fw: 1, ph: 16 },
  // storage
  shelf: { fw: 2, ph: 38 }, shelf1: { fw: 1, ph: 38 }, drawers: { fw: 1, ph: 28 }, planchest: { fw: 2, ph: 18 }, cabinet: { fw: 1, ph: 34 },
  basket: { fw: 1, ph: 12 }, papers: { fw: 1, ph: 14 },
  // tables
  readtable: { fw: 2, ph: 22 }, longtable: { fw: 3, ph: 20 }, worktable: { fw: 2, ph: 22 }, charttable: { fw: 2, ph: 22 },
  labtable: { fw: 2, ph: 22 }, examtable: { fw: 2, ph: 22 }, bench: { fw: 3, ph: 22 }, computer: { fw: 2, ph: 30 },
  // trades
  range: { fw: 2, ph: 34, glow: true }, vat: { fw: 1, ph: 18 }, rack: { fw: 2, ph: 34 }, loom: { fw: 2, ph: 32 },
  piano: { fw: 2, ph: 32 }, musicstand: { fw: 1, ph: 24 }, harp: { fw: 1, ph: 32 }, pottingbench: { fw: 2, ph: 22 },
  planter: { fw: 1, ph: 22 }, plant: { fw: 1, ph: 20 }, clockbench: { fw: 2, ph: 24 }, wheel: { fw: 1, ph: 16 },
  kiln: { fw: 2, ph: 30, glow: true }, canvases: { fw: 1, ph: 24 }, painttable: { fw: 1, ph: 18 }, lectern: { fw: 1, ph: 30 },
  easel: { fw: 1, ph: 34 }, screen: { fw: 2, ph: 30 }, globe: { fw: 1, ph: 26 }, scope: { fw: 1, ph: 30 },
  candelabra: { fw: 1, ph: 30, glow: true },
  // the cave
  rock: { fw: 1, ph: 16 }, rock2: { fw: 2, ph: 22 }, stalagmite: { fw: 1, ph: 30 }, crystal: { fw: 1, ph: 26, glow: 'teal' },
  // the building
  pillar: { fw: 1, ph: 46, structure: true },
};

export const isTall = (type) => (PIECES[type]?.ph || 0) > TALL;
