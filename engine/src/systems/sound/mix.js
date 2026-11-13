// What the game state does to the sound, pure: where the player is, the time of day and what has
// the learner's attention -> the levels and colours of the layers. engine.js glides to these
// targets slowly (never abrupt); tests/sound.test.mjs checks the table.
//
//   where: { scene: 'town'|'room'|'dark'|'upstairs', tod: 'night'|'dusk'|'day', square: bool,
//            focus: null|'page'|'duel', ending: bool }
//   result: bed and notes (levels 0..1), density (x the note rate), padCut and noteCut (low-pass,
//   Hz), hall and room (reverb sends), voices (pads at once), warmth (extra chance of a third),
//   creak (per minute), pulse (duel heartbeat), place (level of the place sounds)

const BASE = {
  town: { bed: 0.85, notes: 1, density: 1, padCut: 620, noteCut: 2600, hall: 0.75, room: 0, voices: 2, warmth: 0, creak: 0, place: 1 },
  room: { bed: 0.6, notes: 0.7, density: 0.7, padCut: 700, noteCut: 2400, hall: 0.18, room: 0.55, voices: 2, warmth: 0.15, creak: 0, place: 0 },
  dark: { bed: 0.65, notes: 0.6, density: 0.6, padCut: 480, noteCut: 2000, hall: 0.5, room: 0.3, voices: 2, warmth: 0, creak: 0, place: 0 },
  upstairs: { bed: 0.28, notes: 0.35, density: 0.35, padCut: 560, noteCut: 2200, hall: 0.12, room: 0.6, voices: 1, warmth: 0.1, creak: 1.4, place: 0 },
};
// the time of day, outdoors only: day a little warmer and brighter
const TOD = {
  night: {},
  dusk: { padCut: 1.3, noteCut: 1.08, density: 1.08, warmth: 0.2 },
  day: { padCut: 1.8, noteCut: 1.18, density: 1.15, warmth: 0.4, bed: 1.05 },
};
export const DUCK = 0.1; // pages, labs, locks, duels: the bed falls to a whisper (-20 dB)

export function mixFor(where = {}, mood = { bright: 1 }) {
  const m = { ...(BASE[where.scene] || BASE.town), pulse: 0 };
  if ((where.scene || 'town') === 'town') {
    const k = TOD[where.tod] || TOD.night;
    for (const key of ['padCut', 'noteCut', 'density', 'bed']) if (k[key]) m[key] *= k[key];
    m.warmth += k.warmth || 0;
    if (where.square) { m.bed = Math.min(1, m.bed * 1.15); m.voices = 3; m.density *= 1.15; m.padCut *= 1.1; }
  }
  const b = mood.bright ?? 1;
  m.padCut *= b; m.noteCut *= Math.sqrt(b);
  if (where.focus) {
    m.bed *= DUCK; m.notes *= 0.15; m.density *= 0.15; m.place *= 0.2; m.creak = 0;
    if (where.focus === 'duel') m.pulse = 1;
  }
  if (where.ending) { m.density = 0; m.notes *= 0.5; m.warmth = 1; }
  return m;
}

// Place sounds from the tiles around the player (world/townMap.js terrain letters):
//   '~' water, 'T' trees, 'g' 'G' 'f' 'b' grass, tall grass, flowers, bushes.
// Read on a slow timer (once a second), never per frame. at(x, y) returns the letter.
export function placeLevels(at, x, y, { tod = 'night', fountains = [], r = 4 } = {}) {
  let tot = 0, water = 0, trees = 0, green = 0;
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    const w = 1 / (1 + Math.hypot(i, j)), c = at(x + i, y + j);
    tot += w;
    if (c === '~') water += w; else if (c === 'T') trees += w; else if ('gGfb'.includes(c)) green += w;
  }
  water /= tot; trees /= tot; green /= tot;
  const night = tod === 'night' ? 1 : tod === 'dusk' ? 0.6 : 0, day = tod === 'day' ? 1 : tod === 'dusk' ? 0.25 : 0;
  const fd = fountains.reduce((d, [fx, fy]) => Math.min(d, Math.hypot(fx - x, fy - y)), Infinity);
  const clamp = (v) => Math.max(0, Math.min(1, v));
  return {
    water: clamp(water * 2.4),
    wind: clamp(0.12 + trees * 2.2),
    fountain: clamp(1 - fd / 8),
    crickets: clamp(night * (green + trees * 0.5) * 1.8),
    birds: clamp(day * (trees + green) * 1.6),
  };
}
