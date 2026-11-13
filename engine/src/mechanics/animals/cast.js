// The animals of the town: who, when, where they like to be, how they react. Plain data.
//   when    'day', 'night' or 'any' (dusk counts as both)
//   perch   where its spots are (place.js): ground beside walls, roofs, trees, banks, plazas,
//           a home's side, open water, the meadow, the forest edge
//   react   'flee' runs to cover and hides, 'fly' takes off and lands elsewhere, 'jump' leaps into
//           the water, 'sleep' lifts its head, 'watch' turns its head to follow, 'ripple' only rings
//   r       how close (tiles) the player must come before it reacts
//   n       how many sprites (a pair of sparrows)
// Animals are never solid, never on a door approach, never in a lab; they react to proximity, and a
// double tap or T on one gives a musing about it (kind = the animal's id, see musings/lines.js).
export const CAST = {
  cat: { when: 'any', perch: 'ground', react: 'flee', r: 2.5 },
  sparrow: { when: 'day', perch: 'plaza', react: 'fly', r: 3, n: 2 },
  owl: { when: 'night', perch: 'tree', react: 'watch', r: 1.6 },
  frog: { when: 'any', perch: 'bank', react: 'jump', r: 2 },
  squirrel: { when: 'day', perch: 'tree', react: 'flee', r: 2.5 },
  dog: { when: 'any', perch: 'side', react: 'sleep', r: 1.6 },
  fish: { when: 'any', perch: 'water', react: 'ripple', r: 0 },
  gull: { when: 'day', perch: 'bank', react: 'fly', r: 3 },
  crab: { when: 'any', perch: 'bank', react: 'flee', r: 2 },
  hare: { when: 'day', perch: 'meadow', react: 'flee', r: 3.5 },
  fox: { when: 'night', perch: 'edge', react: 'flee', r: 4 },
  crow: { when: 'day', perch: 'roof', react: 'fly', r: 2.5 },
};
// every town has these; a theme adds its own (seagull and crab by the harbour, hare and fox in the
// north, crow and a second cat in the citadel)
export const BASE = ['cat', 'sparrow', 'owl', 'frog', 'squirrel', 'dog', 'fish'];
export const BY_THEME = { harbour: ['gull', 'crab'], nordic: ['hare', 'fox'], citadel: ['crow', 'cat'] };
export const castFor = (themeName) => [...BASE, ...(BY_THEME[themeName] || [])];
