// Trades: who lives in an expert's home (building kind "home") and what their house shows.
// Plain data with no imports on purpose: the course validator reads the names in Node.
//
// A trade gives:
//   zones      the vignettes of its room, most typical first (names in zones.js); the composer takes
//              the first that fit, so the first two tell who lives here at a glance
//   signature  the big object in the place of honour (a painter in furniture.js)
//   decor      the pictures hung in pairs on the back wall (wall decorations in paint.js)
//   look       the host's clothes (a key of LOOKS in src/art/sprites.js)
//   exterior   shapes the house front may take (facade.js: cottage, townhouse, narrow, workshop,
//              cabin) and the icon on the hanging trade sign (an emblem name)
//   suits      concept types it fits, used when world.json asks for automatic homes
// To add a trade: one entry here; its zones and signature must exist. `npm test` checks that.
export const TRADES = {
  cartographer: { zones: ['mapTable', 'planChest', 'library', 'study'], signature: 'bigglobe', decor: ['map'], look: 'surveyor', exterior: { shapes: ['townhouse', 'narrow'], sign: 'globe' }, suits: ['parts', 'view', 'choice'] },
  dyer: { zones: ['dyeVats', 'dryingRack', 'kitchenTable', 'sitting'], signature: 'clothframe', decor: ['cloth'], look: 'dyer', exterior: { shapes: ['workshop', 'cottage', 'cabin'], sign: 'drop' }, suits: ['process', 'cases'] },
  cook: { zones: ['kitchen', 'kitchenTable', 'pantry', 'sitting'], signature: 'hearth', decor: ['herbs'], look: 'cook', exterior: { shapes: ['cottage', 'workshop'], sign: 'flame' }, suits: ['process', 'cases', 'choice'] },
  musician: { zones: ['piano', 'sitting', 'library', 'strings'], signature: 'bigharp', decor: ['sheet'], look: 'musician', exterior: { shapes: ['townhouse', 'narrow'], sign: 'note' }, suits: ['story', 'view', 'cases'] },
  gardener: { zones: ['potting', 'greenery', 'kitchenTable', 'study'], signature: 'tree', decor: ['botanical'], look: 'gardener', exterior: { shapes: ['cottage', 'cabin'], sign: 'leaf' }, suits: ['process', 'cases', 'story'] },
  clockmaker: { zones: ['clockBench', 'drawersWall', 'study', 'sitting'], signature: 'clock', decor: ['portrait'], look: 'maker', exterior: { shapes: ['workshop', 'narrow'], sign: 'clock' }, suits: ['mechanism', 'parts', 'process'] },
  doctor: { zones: ['surgery', 'apothecary', 'study', 'sitting'], signature: 'skeleton', decor: ['chart'], look: 'doctor', exterior: { shapes: ['townhouse', 'narrow'], sign: 'cross' }, suits: ['cases', 'choice', 'parts'] },
  painter: { zones: ['easelCorner', 'sitting', 'library', 'kitchenTable'], signature: 'bigeasel', decor: ['landscape'], look: 'painter', exterior: { shapes: ['narrow', 'cottage', 'townhouse'], sign: 'brush' }, suits: ['view', 'cases', 'story'] },
  scholar: { zones: ['library', 'study', 'readingTable', 'sitting'], signature: 'bigbook', decor: ['portrait'], look: 'archivist', exterior: { shapes: ['townhouse', 'narrow'], sign: 'quill' }, suits: ['story', 'parts', 'choice'] },
  potter: { zones: ['pottery', 'wheel', 'kitchenTable', 'sitting'], signature: 'urn', decor: ['plate'], look: 'maker', exterior: { shapes: ['workshop', 'cottage'], sign: 'pot' }, suits: ['process', 'mechanism'] },
  weaver: { zones: ['loom', 'dryingRack', 'sitting', 'kitchenTable'], signature: 'tapestry', decor: ['cloth'], look: 'weaver', exterior: { shapes: ['cottage', 'workshop', 'cabin'], sign: 'spool' }, suits: ['parts', 'process', 'story'] },
  printer: { zones: ['typeWall', 'readingTable', 'library', 'study'], signature: 'bigpress', decor: ['poster'], look: 'tech', exterior: { shapes: ['workshop', 'townhouse'], sign: 'book' }, suits: ['process', 'parts'] },
  // the fallback: a trade named in the course that is not above, or none
  home: { zones: ['sitting', 'library', 'kitchenTable', 'study'], signature: 'tree', decor: ['landscape'], look: 'keeper', exterior: { shapes: ['cottage', 'townhouse', 'narrow'], sign: null }, suits: [] },
};
export const TRADE_NAMES = Object.keys(TRADES).filter((t) => t !== 'home');

// Names for experts the course does not name (automatic homes). Short: the name plate holds 8.
export const EXPERT_NAMES = ['Oda', 'Brann', 'Mira', 'Teo', 'Ilse', 'Rune', 'Vera', 'Sol', 'Nell', 'Aksel', 'Dina', 'Pim', 'Greta', 'Ivo', 'Lena', 'Odo'];

export const tradeOf = (name) => (TRADES[name] ? name : 'home');
