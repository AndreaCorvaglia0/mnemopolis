// Where the animals like to be. Pure data, deterministic per course (seeded 'life:animal:...').
// Each animal gets up to four spots; it sits at one and moves to another when disturbed. A spot is
// never on a door approach, never on a lane where it would stand in the way, and always within a
// few steps of a tile the player can reach (checkAnimals in ../plan.js).
import { seeded } from '../../gen/core.js';
import { N4 } from '../context.js';
import { CAST, castFor } from './cast.js';

export function planAnimals(c, theme, seed, { used = new Set(), rooms = [] } = {}) {
  const ok = (x, y) => c.inMap(x, y) && !c.approach[c.I(x, y)] && !used.has(`${x},${y}`);
  const ground = (x, y) => ok(x, y) && c.walk(x, y) && c.reached(x, y) && !c.target[c.I(x, y)] && !c.near[c.I(x, y)];
  const reachNear = (x, y, k = 3) => { for (let j = -k; j <= k; j++) for (let i = -k; i <= k; i++) if (c.walk(x + i, y + j) && c.reached(x + i, y + j)) return true; return false; };
  const water = (x, y) => c.ter(x, y) === '~';
  const perch = {
    ground: (x, y) => ground(x, y) && N4.some(([dx, dy]) => c.building(x + dx, y + dy) || c.piece.get(`${x + dx},${y + dy}`)?.t === 'fence'),
    plaza: (x, y) => ok(x, y) && c.ter(x, y) === 'c' && !c.near[c.I(x, y)] && Math.abs(x - c.town.START.x) + Math.abs(y - c.town.START.y) > 3,
    tree: (x, y) => ok(x, y) && c.ter(x, y) === 'T' && c.ter(x, y + 1) !== 'T' && reachNear(x, y, 2) && c.toLane[c.I(x, y)] <= 5,
    bank: (x, y) => ground(x, y) && N4.some(([dx, dy]) => water(x + dx, y + dy)),
    side: (x, y) => ground(x, y) && N4.some(([dx, dy]) => { const b = c.building(x + dx, y + dy); return b && (b.home || b.kind === 'home'); }),
    water: (x, y) => water(x, y) && !c.piece.has(`${x},${y}`) && reachNear(x, y, 2),
    meadow: (x, y) => ground(x, y) && c.ter(x, y) === 'g' && c.toLane[c.I(x, y)] >= 2 && c.toLane[c.I(x, y)] <= 5,
    edge: (x, y) => ground(x, y) && N4.some(([dx, dy]) => c.ter(x + dx, y + dy) === 'T') && c.toLane[c.I(x, y)] >= 2 && c.toLane[c.I(x, y)] <= 6,
    roof: (x, y) => { const b = c.building(x, y); return ok(x, y) && b && y === b.y && x > b.x && x < b.x + b.w - 1 && reachNear(x, y + b.h, 2); },
  };
  const out = [], kinds = castFor(theme.name);
  kinds.forEach((kind, k) => {
    const a = CAST[kind], r = seeded(`life:animal:${kind}:${k}`, seed), test = perch[a.perch], cands = [];
    for (let y = 0; y < c.H; y++) for (let x = 0; x < c.W; x++) if (test(x, y)) cands.push([x, y]);
    // the sleeping dog prefers an expert's home, then any house side
    if (!cands.length && kind === 'dog') for (let y = 0; y < c.H; y++) for (let x = 0; x < c.W; x++) if (perch.ground(x, y)) cands.push([x, y]);
    const spots = [];
    for (let t = 0; t < 40 && spots.length < 4 && cands.length; t++) {
      const [x, y] = cands[Math.floor(r() * cands.length)];
      if (spots.every(([a2, b2]) => Math.abs(a2 - x) + Math.abs(b2 - y) >= 6) && out.every((o) => o.spots.every(([a2, b2]) => a2 !== x || b2 !== y))) spots.push([x, y]);
    }
    if (spots.length) out.push({ id: `${kind}${k}`, kind, spots, seed: Math.floor(r() * 1e6) });
  });
  // indoors, sparingly: one cat asleep on an armchair in someone's home
  const chairs = rooms.filter(({ L }) => L?.home).flatMap(({ place, L }) => L.items.filter((it) => it.type === 'armchair').map((it) => ({ place: place.id, x: it.x, y: it.y })));
  const rc = seeded('life:animal:indoor', seed);
  const inside = chairs.length ? [{ id: 'housecat', kind: 'sleepcat', ...chairs[Math.floor(rc() * chairs.length)] }] : [];
  return { town: out, inside };
}
