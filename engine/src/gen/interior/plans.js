// Room shapes. A plan is a width, a height and, for every column, the row where its back wall
// starts (top) and the row of its front wall (bot). The back wall is 3 tiles high; floor runs from
// top + 3 to bot - 1. Cells above the back wall and below the front wall are not empty space on
// screen: paint.js draws them as a higher wall and as a small courtyard garden.
// Sizes: at most 16 tiles wide, so a phone held upright keeps zoom 3.
// To add a plan: one function here returning { w, h, top, bot } and any extra marks (alcove,
// dais, pillars, notch). `npm test` composes hundreds of rooms on every plan.
export const T = 16;

const box = (w, h) => ({ w, h, top: Array(w).fill(0), bot: Array(w).fill(h - 1) });

export const PLANS = {
  hall(r) { return box(r.pick([14, 15, 15, 16]), r.int(9, 10)); },
  square(r) { return box(r.pick([11, 12, 13]), r.int(11, 12)); },
  // a corner cut away: either the back wall steps forward, or a courtyard garden takes the front corner
  ell(r) {
    const w = r.pick([14, 15, 16]), h = r.int(10, 12), nw = r.int(3, 4), left = r.chance(0.5), up = r.chance(0.5), nd = up ? 2 : r.int(2, 3);
    const P = box(w, h);
    for (let i = 0; i < nw; i++) { const x = left ? i : w - 1 - i; if (up) P.top[x] = nd; else P.bot[x] = h - 1 - nd; }
    return { ...P, notch: { left, up, nw, nd } };
  },
  // a recess in the middle of the back wall for the signature object; the main wall stands lower
  alcove(r) {
    const w = r.pick([13, 14, 15, 16]), h = r.int(10, 12), aw = w % 2 ? 5 : 4, a0 = (w - aw) / 2;
    const P = box(w, h); P.top.fill(2);
    for (let x = a0; x < a0 + aw; x++) P.top[x] = 0;
    return { ...P, alcove: [a0, a0 + aw - 1] };
  },
  // a raised platform in the middle of the back wall
  dais(r) {
    const w = r.pick([13, 14, 15, 16]), h = r.int(10, 12), pw = w % 2 ? 7 : 6, p0 = (w - pw) / 2;
    return { ...box(w, h), dais: [p0, p0 + pw - 1, 3, 4] };
  },
  // a hall with a pair of pillars one tile in from the side walls, symmetric about the axis
  nave(r) {
    const w = r.pick([13, 15]), h = r.int(10, 11);
    return { ...box(w, h), pillars: [[1, 5], [w - 2, 5]] };
  },
};
export const PLAN_NAMES = Object.keys(PLANS);

// Plans of an upper floor (mechanics/floors/): never chosen for a ground floor. The attic is a
// smaller room under the roof: paint.js gives it beams, a sloping ceiling and a stairwell down
// where the ground floor has its exit mat.
export const UPPER_PLANS = {
  attic(r) { return { ...box(r.pick([12, 13, 14]), r.int(9, 10)), attic: true }; },
};

export function cellAt(L, x, y) {
  if (x < 0 || y < 0 || x >= L.w || y >= L.h) return 'out';
  if (y < L.top[x]) return 'void';
  if (y < L.top[x] + 3) return 'wall';
  if (y < L.bot[x]) return 'floor';
  return y === L.bot[x] ? 'front' : 'void';
}
export const f0 = (L, x) => L.top[x] + 3;

// Neighbouring houses never share a plan: a project-wide offset plus the house number. A kind may
// refuse some plans (a cave has no alcove); a retry moves to the next plan.
export function choosePlan(place, offset, allowed, attempt) {
  const step = Math.floor(attempt / 3);
  for (let k = 0; k < PLAN_NAMES.length; k++) {
    const name = PLAN_NAMES[(offset + (place.order || 1) + step + k) % PLAN_NAMES.length];
    if (!allowed || allowed.includes(name)) return name;
  }
  return 'hall';
}
