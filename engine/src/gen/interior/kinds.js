// What a room is like for each kind of building. Colours that say "which kind of house" stay with
// the kind; materials (wood, stone, accent, wall tone) come from the project THEME (paint.js).
//   zones   the vignettes of the room, most typical first (zones.js)
//   sigs    signature objects when the concept has no emblem; forms: how an emblem is shown
//   decor   pictures hung in pairs; flank: the pair of pieces beside the signature (or none)
//   plans   the plans this kind accepts (default: all)
// A home takes zones, signature, decor and look from its trade (trades.js), colours from the theme.
export const KINDS = {
  lab: { wall: '#ecebf2', band: '#6b4fa0', lower: '#d5d2e2', front: '#6b4fa0', step: 'stone', floors: ['tile', 'small'], walls: ['plain', 'tiles', 'stripes'],
    zones: ['labBench', 'instruments', 'labIsland', 'study'], sigs: ['prism', 'orrery'], forms: ['pedestal', 'case', 'banner'], decor: ['chart', 'clock'], flank: 'plant' },
  archive: { wall: '#efe6d2', band: '#8a5a34', lower: '#d9cbb0', front: '#5c3f27', step: 'wood', floors: ['wood', 'parquet'], walls: ['panel', 'stripes'],
    zones: ['library', 'drawersWall', 'readingTable', 'planChest'], sigs: ['clock', 'hourglass', 'bigglobe'], forms: ['case', 'case', 'pedestal'], decor: ['portrait', 'map'], flank: 'plant' },
  hall: { wall: '#f6f1e3', band: '#c9662a', lower: '#ead9bd', front: '#a95f1f', step: 'wood', floors: ['parquet', 'marble', 'wood'], walls: ['panel', 'brick', 'stripes'],
    zones: ['council', 'benches', 'bannerWall', 'sitting'], sigs: ['tree', 'clock'], forms: ['banner', 'banner', 'pedestal'], decor: ['banner', 'portrait'], flank: 'candelabra' },
  studio: { wall: '#f3f4f1', band: '#2a8c87', lower: '#d7e3e2', front: '#2a8c87', step: 'stone', floors: ['tile', 'small', 'wood'], walls: ['plain', 'tiles'],
    zones: ['exam', 'easels', 'instruments', 'sitting'], sigs: ['prism', 'tree'], forms: ['pedestal', 'case', 'banner'], decor: ['lightbox', 'portrait'], flank: 'plant' },
  observatory: { wall: '#e6edf5', band: '#2c4580', lower: '#cdd8e8', front: '#2c4580', step: 'stone', floors: ['stone', 'marble'], walls: ['blocks', 'plain'],
    zones: ['mapTable', 'telescopes', 'readingDesk', 'planChest'], sigs: ['orrery', 'bigglobe'], forms: ['pedestal', 'case', 'banner'], decor: ['starchart', 'map'], flank: 'plant' },
  cave: { wall: '#4a4652', band: '#2b2833', lower: '#3d3945', front: '#2b2833', step: 'stone', floors: ['flag', 'rough'], walls: ['rock'], dark: true,
    zones: ['stalagmites', 'crystals', 'caveCamp'], sigs: ['bigcrystal', 'tablet'], forms: ['pedestal'], decor: [], flank: null, plans: ['hall', 'square', 'dais', 'ell', 'nave'] },
  home: { step: 'wood', floors: ['wood', 'parquet', 'wood'], walls: ['paper', 'panel', 'plaster'], home: true, flank: 'plant', plans: ['hall', 'square', 'ell', 'alcove'] },
};
