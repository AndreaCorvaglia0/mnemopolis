// Generated dressing (optional: world.json { "gen": { "dressing": false } } leaves the town exactly
// as townMap.js makes it).
//
// The big structure stays fixed: plazas, lanes, river and ponds, houses, doors, landmarks, signs,
// lamps and the townsfolk. Dressing only fills the space that is left with small things, so that
// the town looks lived in and differs from project to project:
//   plaza edges   a stone kerb, then planters, benches, a stall, a well, a lantern... on the grass ring
//   house sides   a flower bed, a woodpile, barrels... against the side wall, never in front of a door
//   plots         fenced allotments and flower gardens (walls, hedges or fences that join, with a gate
//                 toward the nearest lane and stepping stones to it), unfenced little orchards; the
//                 beds inside are laid out by a tiny Wave Function Collapse (gen/wfc.js)
//   corners       laundry lines, nets, woodpiles, firs, beehives... in nooks of leftover grass
//   water         a jetty you can walk on, moored boats, reeds and lily pads
// What appears and how it looks comes from THEME.dressing (src/gen/core.js); each district is either
// "floral" or "worked", so neighbouring districts feel different.
//
// Every solid piece is accepted only if a breadth-first search from the start still reaches every
// tile it reached before and no lane, plaza, door, landmark, sign or person got one step farther.
//
// Two layers, so that Node can check the layout without a browser (scripts/check.mjs):
//   planDressing()       pure data: pieces, solid tiles, walkable tiles over water        (Node)
//   addDressing(scene)   paints the pieces once and puts them into the Town scene         (browser)
import { seeded as seededFor, THEME as THEME0 } from './core.js';
import { wfc } from './wfc.js';
import { hash, noise } from '../art/px.js';
import { paintDressing } from './dressingArt.js';
import { DATA } from '../course/_data.js';
import { T, TOWN } from '../world/townMap.js';

// The town being dressed. It is the real one unless planDressingFor() is given another (scripts/stress-town.mjs
// dresses many synthetic towns in one Node process), so these are set by use().
let W, H, TERRAIN, BUILDINGS, LAMPS, SIGNS, NPCS, MONUMENTS, PROPS, QUARTERS, START, HUB, THEME, SEED;
const seeded = (key) => seededFor(key, SEED);
function use(town, theme, seed) { ({ W, H, TERRAIN, BUILDINGS, LAMPS, SIGNS, NPCS, MONUMENTS, PROPS, QUARTERS, START, HUB } = town); THEME = theme; SEED = seed; }
use(TOWN, THEME0, DATA.id);
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const N8 = [...N4, [1, 1], [1, -1], [-1, 1], [-1, -1]];
const ter = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 'T' : TERRAIN[y][x]);
const inMap = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const I = (x, y) => y * W + x;

// Pieces that stand up (drawn in rows, sorted with the player) and pieces flat on the ground.
const TALL = new Set(['fence', 'flowerbed', 'topiary', 'birdbath', 'fruittree', 'beehive', 'scarecrow', 'barrels', 'crates', 'woodpile', 'nets', 'laundry', 'sledge', 'lantern', 'fir', 'statue', 'well', 'planter', 'stall', 'bench', 'beans']);
const WIDE = { laundry: 2, stall: 2 };

// breadth-first search over walkable tiles; -1 = not reached
function bfs(blocked, sx, sy) {
  const d = new Int16Array(W * H).fill(-1), q = new Int32Array(W * H);
  let h = 0, t = 0;
  d[I(sx, sy)] = 0; q[t++] = I(sx, sy);
  while (h < t) {
    const i = q[h++], x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (!inMap(nx, ny)) continue; const j = I(nx, ny); if (blocked[j] || d[j] >= 0) continue; d[j] = d[i] + 1; q[t++] = j; }
  }
  return d;
}

// The tiles the town itself blocks (the same rule as Town.js and scripts/check.mjs).
export function baseBlocked() {
  const b = new Uint8Array(W * H), put = (x, y) => { if (inMap(x, y)) b[I(x, y)] = 1; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ('~ReTbF'.includes(ter(x, y))) put(x, y);
  for (const o of BUILDINGS) for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) put(x, y);
  [...LAMPS, ...SIGNS.map((s) => [s.x, s.y]), ...PROPS, ...MONUMENTS.flatMap((m) => [[m.x, m.y], [m.x + 1, m.y]]), ...NPCS.map((n) => [n.x, n.y])].forEach(([x, y]) => put(x, y));
  return b;
}

let cache = null;
export function planDressing() { use(TOWN, THEME0, DATA.id); return (cache ||= plan()); }
// Dresses another town (a result of generate() in townMap.js); checkDressing() then judges that town.
export function planDressingFor(town, theme, seed) { use(town, theme, seed); return plan(); }

function plan() {
  const D = THEME.dressing, r = seeded('dressing:place');
  const base = baseBlocked(), d0 = bfs(base, START.x, START.y);
  const solid = base.slice(), used = new Uint8Array(W * H), walk = [];
  const pieces = [], glows = [];

  // ---- what must stay free. 2: nothing at all; 1: only flat things (kerbs, stones)
  const keep = new Uint8Array(W * H);
  const mark = (x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inMap(x, y)) keep[I(x, y)] = Math.max(keep[I(x, y)], v); };
  for (const b of BUILDINGS) {
    mark(b.x - 1, b.y - 3, b.x + b.w, b.y - 1, 2); // the roof and what stands above it
    mark(b.x - 1, b.y + b.h, b.x + b.w, b.y + b.h + 1, 1); // the house front stays in view
    for (const [dx, dy] of b.doors) mark(dx - 1, dy + 1, dx + 1, dy + 3, 2); // the way out of the door
  }
  for (const s of SIGNS) mark(s.x - 1, s.y - 1, s.x + 1, s.y + 1, 2);
  for (const m of MONUMENTS) mark(m.x - 2, m.y - 3, m.x + 3, m.y + 2, 2);
  for (const [x, y] of [...LAMPS, ...PROPS, ...NPCS.map((n) => [n.x, n.y]), [START.x, START.y]]) mark(x - 1, y - 1, x + 1, y + 1, 2);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ter(x, y) === 'G') mark(x - 1, y - 1, x + 1, y + 1, 2);

  // what must not get farther: lanes, plazas, meadow, door steps, and the tiles next to things one reads or talks to
  const target = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) if (d0[i] >= 0 && 'pcwG'.includes(TERRAIN[(i / W) | 0][i % W])) target[i] = 1;
  const near = [...SIGNS.map((s) => [s.x, s.y]), ...MONUMENTS.flatMap((m) => [[m.x, m.y], [m.x + 1, m.y]]), ...NPCS.map((n) => [n.x, n.y])];
  for (const [x, y] of near) for (const [dx, dy] of N4) if (inMap(x + dx, y + dy) && d0[I(x + dx, y + dy)] >= 0) target[I(x + dx, y + dy)] = 1;
  for (const b of BUILDINGS) for (const [x, y] of b.doors) if (inMap(x, y + 1) && d0[I(x, y + 1)] >= 0) target[I(x, y + 1)] = 1;

  // ---- where each tile belongs: a district (its box, widened) or the square
  const hubBox = { x0: HUB.x - 9, y0: HUB.y - 11, x1: HUB.x + 10, y1: HUB.y + 4 };
  const zones = [...QUARTERS.map((q, i) => ({ ...q, i })), { ...hubBox, i: -1, id: 'hub' }];
  const off = Math.floor(seeded('dressing:mood')() * 2);
  zones.forEach((z) => { z.mood = z.i < 0 ? 'floral' : (z.i + off) % 2 ? 'floral' : 'worked'; });
  const zoneAt = (x, y, pad = 4) => { let best = null, bd = 1e9; for (const z of zones) { const dx = Math.max(z.x0 - x, 0, x - z.x1), dy = Math.max(z.y0 - y, 0, y - z.y1), d = Math.max(dx, dy); if (d <= pad && d < bd) { bd = d; best = z; } } return best; };
  const roads = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ('pcw'.includes(ter(x, y))) roads.push([x, y]);
  const toRoad = bfs(new Uint8Array(W * H), 0, 0).fill(-1); // distance to the nearest lane or plaza, through anything
  { const q = []; for (const [x, y] of roads) { toRoad[I(x, y)] = 0; q.push([x, y]); } for (let h = 0; h < q.length; h++) { const [x, y] = q[h]; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (inMap(nx, ny) && toRoad[I(nx, ny)] < 0) { toRoad[I(nx, ny)] = toRoad[I(x, y)] + 1; q.push([nx, ny]); } } } }

  const grass = (x, y) => 'gf'.includes(ter(x, y));
  const wet = (x, y) => N8.some(([dx, dy]) => ter(x + dx, y + dy) === '~'); // the shore is painted with a wobble: keep solid things off it
  const hidden = (x, y) => [-1, 0, 1].some((i) => ter(x + i, y + 1) === 'T') || ter(x, y + 2) === 'T' || ter(x, y - 1) === 'T'; // a tree in front would hide it, one behind would crowd it
  const free = (x, y, flat = false) => inMap(x, y) && grass(x, y) && !base[I(x, y)] && !used[I(x, y)] && keep[I(x, y)] < (flat ? 2 : 1) && (flat || (!wet(x, y) && !hidden(x, y)));
  const besideRoad = (x, y) => N4.some(([dx, dy]) => 'pw'.includes(ter(x + dx, y + dy)));
  const add = (p) => { p.w ||= 1; p.h ||= 1; pieces.push(p); for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) if (inMap(x, y)) used[I(x, y)] = 1; return p; };

  // A group of solid pieces is accepted only if nobody has to walk farther because of it.
  const tryPlace = (group) => {
    const cells = group.filter((p) => p.solid).flatMap((p) => { const c = []; for (let y = p.y; y < p.y + (p.h || 1); y++) for (let x = p.x; x < p.x + (p.w || 1); x++) c.push([x, y]); return c; });
    for (const [x, y] of cells) if (!inMap(x, y) || solid[I(x, y)] || used[I(x, y)]) return false;
    for (const [x, y] of cells) solid[I(x, y)] = 1;
    const d = bfs(solid, START.x, START.y);
    let ok = true;
    for (let i = 0; i < W * H && ok; i++) {
      if (d0[i] < 0 || solid[i]) continue;
      if (d[i] < 0 || (target[i] && d[i] > d0[i])) ok = false;
    }
    if (!ok) { for (const [x, y] of cells) solid[I(x, y)] = 0; return false; }
    group.forEach(add);
    return true;
  };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const spaced = (x, y, list, gap) => list.every((p) => Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) >= gap);
  const variant = (x, y) => Math.floor(hash(x, y, 71) * 4);

  // ---- 1. plazas: a kerb on the grass all around, then a few pieces on the ring
  const plazaOf = new Int16Array(W * H).fill(-1), plazas = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (ter(x, y) !== 'c' || plazaOf[I(x, y)] >= 0) continue;
    const id = plazas.length, cells = [[x, y]]; plazaOf[I(x, y)] = id;
    for (let h = 0; h < cells.length; h++) { const [cx, cy] = cells[h]; for (const [dx, dy] of N4) { const nx = cx + dx, ny = cy + dy; if (ter(nx, ny) === 'c' && plazaOf[I(nx, ny)] < 0) { plazaOf[I(nx, ny)] = id; cells.push([nx, ny]); } } }
    plazas.push(cells);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!grass(x, y) && !'TbF'.includes(ter(x, y))) continue;
    const m = N4.reduce((s, [dx, dy], k) => s | (ter(x + dx, y + dy) === 'c' ? 1 << k : 0), 0);
    if (m) pieces.push({ t: 'kerb', x, y, w: 1, h: 1, m });
  }
  const plazaPieces = [];
  plazas.forEach((cells, id) => {
    const set = new Set(cells.map(([x, y]) => `${x},${y}`)), ring = new Map();
    for (const [x, y] of cells) for (const [dx, dy] of N8) { const nx = x + dx, ny = y + dy; if (!set.has(`${nx},${ny}`)) ring.set(`${nx},${ny}`, [nx, ny]); }
    const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length, cy = cells.reduce((s, c) => s + c[1], 0) / cells.length;
    const z = zoneAt(Math.round(cx), Math.round(cy), 0) || zones[zones.length - 1];
    const want = cells.length > 40 ? 3 : 2, kinds = shuffle([...D.plaza]), mine = [];
    // the grass ring, and the plaza's own edge stones where no lane comes in
    const edge = cells.filter(([x, y]) => N4.some(([dx, dy]) => ter(x + dx, y + dy) !== 'c') && !N8.some(([dx, dy]) => 'pw'.includes(ter(x + dx, y + dy))) && !base[I(x, y)] && !used[I(x, y)] && !keep[I(x, y)]);
    const cands = shuffle([...[...ring.values()].filter(([x, y]) => free(x, y) && !besideRoad(x, y)), ...edge]);
    for (const type of kinds) {
      if (mine.length >= want || mine.some((p) => p.t === type)) continue;
      for (const [x, y] of cands) {
        const w = WIDE[type] || 1;
        if (w > 1 && !((free(x + 1, y) && ring.has(`${x + 1},${y}`) && !besideRoad(x + 1, y)) || edge.some(([a, b]) => a === x + 1 && b === y))) continue;
        if (!(free(x, y) || edge.some(([a, b]) => a === x && b === y)) || !spaced(x, y, plazaPieces, 3)) continue;
        const p = { t: type, x, y, w, solid: true, v: variant(x, y), mood: z.mood };
        if (tryPlace([p])) { mine.push(p); plazaPieces.push(p); break; }
      }
    }
  });

  // ---- 2. house sides: one or two things against a side wall
  const sidePieces = [];
  for (const b of BUILDINGS) {
    const z = zoneAt(b.x, b.y + b.h - 1, 2) || zones[zones.length - 1], list = D.side[z.mood];
    const rs = seeded(`dressing:side:${b.id}`), n = b.home || b.league ? 1 : rs.int(1, 2);
    const spots = shuffle([b.x - 1, b.x + b.w].flatMap((sx) => [[sx, b.y + b.h - 1], [sx, b.y + b.h - 2]]));
    let k = 0;
    for (const [x, y] of spots) {
      if (k >= n || !free(x, y) || !spaced(x, y, sidePieces, 2)) continue;
      const type = list[(rs.int(0, list.length - 1) + k) % list.length];
      if (TALL.has(type) && sidePieces.some((p) => p.b === b.id && p.t === type)) continue;
      const p = { t: type, x, y, solid: true, v: variant(x, y), b: b.id, mood: z.mood };
      if (tryPlace([p])) { sidePieces.push(p); k++; }
    }
  }

  // flower borders at the foot of the house fronts (flat: the front stays in view and walkable)
  for (const b of BUILDINGS) for (let x = b.x; x < b.x + b.w; x++) {
    const y = b.y + b.h;
    if (free(x, y, true) && !b.doors.some(([dx]) => Math.abs(dx - x) <= 1)) pieces.push({ t: 'border', x, y, w: 1, h: 1, v: variant(x, y), mood: (zoneAt(x, y, 2) || zones[zones.length - 1]).mood });
  }

  // ---- 3. plots: fenced allotments and gardens, little orchards
  const plots = [];
  const plotTry = (z, kind, rp) => {
    const cands = [];
    const shapes = kind === 'orchard' ? [[3, 3], [4, 3], [3, 4], [5, 3]] : [[5, 4], [6, 4], [5, 5], [4, 4], [6, 5], [4, 3], [5, 3]];
    for (let y = z.y0 - 6; y <= z.y1 + 6; y++) for (let x = z.x0 - 6; x <= z.x1 + 6; x++) for (const [w, h] of shapes) {
      let ok = true;
      for (let j = -1; j <= h && ok; j++) for (let i = -1; i <= w && ok; i++) {
        const X = x + i, Y = y + j, inside = i >= 0 && j >= 0 && i < w && j < h;
        if (inside) ok = free(X, Y);
        else ok = inMap(X, Y) && !'pcwG~'.includes(ter(X, Y)) && keep[I(X, Y)] < 2 && !BUILDINGS.some((b) => X >= b.x && X < b.x + b.w && Y >= b.y && Y < b.y + b.h);
      }
      if (!ok || !plots.every((p) => x > p.x + p.w + 2 || x + w < p.x - 2 || y > p.y + p.h + 2 || y + h < p.y - 2)) continue;
      const mx = x + w / 2, my = y + h / 2, dz = Math.max(z.x0 - mx, 0, mx - z.x1) + Math.max(z.y0 - my, 0, my - z.y1);
      const nest = [[x - 1, y], [x + w, y], [x, y - 1], [x, y + h]].filter(([X, Y]) => 'Tb'.includes(ter(X, Y))).length; // tucked against trees
      const rd = toRoad[I(Math.round(mx), Math.round(my))];
      if (rd > 7) continue;
      cands.push({ x, y, w, h, s: -dz * 0.6 + nest * 0.8 + w * h * 0.12 - Math.abs(rd - 3) * 0.3 + rp() * 1.5 });
    }
    cands.sort((a, b) => b.s - a.s);
    for (const c of cands.slice(0, 40)) { const g = plotGroup(c, kind, z, rp); if (g && tryPlace(g)) { plots.push({ ...c, kind, g }); if (g.gate) keep[I(...g.gate.out)] = 2; return true; } }
    return false;
  };
  const plotGroup = ({ x, y, w, h }, kind, z, rp) => {
    const cells = [];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) cells.push([x + i, y + j]);
    if (kind === 'orchard') { // trees in a loose, staggered grid on open grass, a beehive perhaps
      const g = [];
      for (const [X, Y] of cells) if ((X + Y + (rp() < 0.25 ? 1 : 0)) % 2 === 0 && rp() < 0.85) g.push({ t: 'fruittree', x: X, y: Y, solid: true, v: variant(X, Y) });
      const rest = cells.filter(([X, Y]) => !g.some((p) => p.x === X && p.y === Y) && !N4.some(([dx, dy]) => g.some((p) => p.x === X + dx && p.y === Y + dy && dy === 0)));
      if (rest.length && rp() < 0.6) { const [X, Y] = rest[Math.floor(rp() * rest.length)]; g.push({ t: 'beehive', x: X, y: Y, solid: true, v: 0 }); }
      return g.length >= 3 ? g : null;
    }
    // irregular: sometimes a corner is cut away (the fence follows it)
    let shape = cells;
    if (w >= 4 && h >= 4 && rp() < 0.6) { const cx = rp() < 0.5 ? x : x + w - 1, cy = rp() < 0.5 ? y : y + h - 1; shape = cells.filter(([X, Y]) => !(X === cx && Y === cy)); }
    const S = new Set(shape.map(([X, Y]) => `${X},${Y}`)), has = (X, Y) => S.has(`${X},${Y}`);
    const ring = shape.filter(([X, Y]) => N8.some(([dx, dy]) => !has(X + dx, Y + dy)));
    const inner = shape.filter(([X, Y]) => !ring.some(([a, b]) => a === X && b === Y));
    if (!inner.length) return null;
    const style = D.fence[z.mood], g = [];
    // the gate: on the top or bottom side, the straight run nearest to a lane
    let gate = null;
    for (const [X, Y] of ring) {
      const top = !has(X, Y - 1), bot = !has(X, Y + 1);
      if (!top && !bot) continue;
      if (!has(X - 1, Y) || !has(X + 1, Y) || !ring.some(([a, b]) => a === X - 1 && b === Y) || !ring.some(([a, b]) => a === X + 1 && b === Y)) continue;
      const out = [X, top ? Y - 1 : Y + 1];
      if (!inMap(...out) || base[I(...out)] || used[I(...out)]) continue;
      const s = (toRoad[I(...out)] ?? 9) + rp() * 0.5;
      if (!gate || s < gate.s) gate = { x: X, y: Y, s, out };
    }
    for (const [X, Y] of ring) {
      const m = N4.reduce((s, [dx, dy], k) => s | (ring.some(([a, b]) => a === X + dx && b === Y + dy) ? 1 << k : 0), 0);
      g.push({ t: 'fence', x: X, y: Y, solid: true, m, style, gate: gate && gate.x === X && gate.y === Y });
    }
    // the beds: a tiny WFC. Crops run in rows (same crop left and right), the next row differs.
    const sets = {
      veg: [{ id: 'cabbage', w: 3 }, { id: 'carrot', w: 3 }, { id: 'beans', w: 2 }, { id: 'soil', w: 1 }, { id: 'scarecrow', w: 0.6, once: true }, { id: 'barrels', w: 0.5, once: true }],
      flowers: [{ id: 'bloom0', w: 3 }, { id: 'bloom1', w: 3 }, { id: 'bloom2', w: 2 }, { id: 'lawn', w: 1.5 }, { id: 'birdbath', w: 0.8, once: true }, { id: 'topiary', w: 0.8, once: true }],
    };
    const single = (a) => ['scarecrow', 'barrels', 'birdbath', 'topiary', 'soil', 'lawn'].includes(a);
    const ok = (a, b, dx, dy) => {
      if (dy === 0) return single(a) || single(b) || a === b; // rows continue sideways
      return a !== b || a === 'lawn' || a === 'soil'; // and change from one row to the next
    };
    const fill = wfc(inner, sets[kind], ok, rp);
    if (!fill) return null;
    for (const [X, Y] of inner) { const t = fill.get(`${X},${Y}`); g.push({ t: TALL.has(t) ? t : 'bed', bed: t, under: kind === 'veg' ? 'soil' : 'lawn', x: X, y: Y, solid: true, v: variant(X, Y) }); }
    g.gate = gate;
    return g;
  };
  for (const z of shuffle([...zones])) {
    const rp = seeded(`dressing:plot:${z.id}`), list = D.plots[z.mood], n = z.i < 0 ? 1 : z.mood === 'worked' ? 2 : 1;
    let placed = 0;
    for (let k = 0; k < 4 && placed < n; k++) if (plotTry(z, list[(rp.int(0, list.length - 1) + k) % list.length], rp)) placed++;
  }
  // stepping stones from each gate to the nearest lane (flat, walkable)
  for (const p of plots) {
    const gate = p.g.gate;
    if (!gate) continue;
    const [sx, sy] = gate.out, prev = new Map([[`${sx},${sy}`, null]]), q = [[sx, sy]];
    let end = null;
    for (let h = 0; h < q.length && !end && h < 200; h++) {
      const [x, y] = q[h];
      if ('pcw'.includes(ter(x, y))) { end = [x, y]; break; }
      for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy, k = `${nx},${ny}`; if (!inMap(nx, ny) || prev.has(k) || solid[I(nx, ny)] || ter(nx, ny) === '~') continue; prev.set(k, [x, y]); q.push([nx, ny]); }
    }
    if (!end) continue;
    const path = [];
    for (let k = prev.get(`${end[0]},${end[1]}`); k; k = prev.get(`${k[0]},${k[1]}`)) path.push(k);
    if (path.length > 4) continue; // a long dotted line across the grass looks drawn, not trodden
    for (const [x, y] of path) if (grass(x, y) && !used[I(x, y)]) pieces.push({ t: 'steps', x, y, w: 1, h: 1, v: variant(x, y) });
  }

  // ---- 4. corners: small things in nooks of leftover grass (against trees, walls, fences)
  const cornerPieces = [];
  for (const z of zones) {
    const rc = seeded(`dressing:corner:${z.id}`), list = D.corner[z.mood], want = z.i < 0 ? 1 : z.mood === 'worked' ? 3 : 2;
    const cands = [];
    for (let y = z.y0 - 4; y <= z.y1 + 4; y++) for (let x = z.x0 - 4; x <= z.x1 + 4; x++) {
      if (!free(x, y) || besideRoad(x, y) || N4.some(([dx, dy]) => ter(x + dx, y + dy) === 'c')) continue;
      const walls = N8.filter(([dx, dy]) => { const X = x + dx, Y = y + dy; return 'TbRF~'.includes(ter(X, Y)) || (inMap(X, Y) && used[I(X, Y)] && pieces.some((p) => p.solid && p.t === 'fence' && p.x === X && p.y === Y)) || BUILDINGS.some((b) => X >= b.x && X < b.x + b.w && Y >= b.y && Y < b.y + b.h); }).length;
      if (walls >= 2 && toRoad[I(x, y)] <= 6) cands.push([x, y, walls + rc() * 2]);
    }
    cands.sort((a, b) => b[2] - a[2]);
    let k = 0, j = rc.int(0, list.length - 1);
    for (const [x, y] of cands) {
      if (k >= want) break;
      if (!spaced(x, y, [...cornerPieces, ...sidePieces, ...plazaPieces], 3)) continue;
      const type = list[(j + k) % list.length], w = WIDE[type] || 1;
      if (w > 1 && !free(x + 1, y)) continue;
      const p = { t: type, x, y, w, solid: true, v: variant(x, y), mood: z.mood };
      if (tryPlace([p])) { cornerPieces.push(p); k++; }
    }
  }

  // ---- 5. water: a jetty, boats, reeds, lily pads
  const water = (x, y) => ter(x, y) === '~' && !used[I(x, y)];
  const rw = seeded('dressing:water');
  let pier = null;
  if (D.water.pier || D.water.boats) {
    const cands = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!grass(x, y) && ter(x, y) !== 's') continue;
      if (d0[I(x, y)] < 0 || base[I(x, y)] || keep[I(x, y)] >= 2 || used[I(x, y)]) continue;
      for (const [dx, dy] of N4) {
        let len = 0;
        while (len < 3 && water(x + dx * (len + 1), y + dy * (len + 1)) && water(x + dx * (len + 1) + dy, y + dy * (len + 1) + dx) && water(x + dx * (len + 1) - dy, y + dy * (len + 1) - dx)) len++;
        if (len < 2 || !water(x + dx * (len + 1), y + dy * (len + 1))) continue; // a jetty ends in open water, it never crosses
        let bridge = false; for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if ('pw'.includes(ter(x + i, y + j)) && Math.abs(i) + Math.abs(j) <= 3 && ter(x + i, y + j) === 'w') bridge = true;
        if (bridge) continue;
        const z = zoneAt(x, y, 6);
        let open = 0; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (ter(x + dx * (len + 1) + i, y + dy * (len + 1) + j) === '~') open++; // ponds rather than the narrow river
        cands.push({ x, y, dx, dy, len, s: open * 0.25 + (z ? 2 : 0) - toRoad[I(x, y)] * 0.5 + len * 0.3 + (dy !== 0 ? 0.6 : 0) + rw() });
      }
    }
    cands.sort((a, b) => b.s - a.s);
    const c = cands[0];
    if (c && D.water.pier) {
      pier = c;
      for (let k = 1; k <= c.len; k++) { const X = c.x + c.dx * k, Y = c.y + c.dy * k; add({ t: 'pier', x: X, y: Y, dir: c.dy ? 'v' : 'h', end: k === c.len, root: k === 1, walk: true, v: k }); walk.push([X, Y]); }
      if (THEME.dressing.lantern === 'pier') { // a lantern on the bank, beside the jetty
        for (const [sx, sy] of [[c.dy, c.dx], [-c.dy, -c.dx]]) { const X = c.x + sx, Y = c.y + sy; const p = { t: 'lantern', x: X, y: Y, solid: true, v: 1 }; if (inMap(X, Y) && grass(X, Y) && !base[I(X, Y)] && !used[I(X, Y)] && keep[I(X, Y)] < 1 && tryPlace([p])) { glows.push([X * T + 8, Y * T - 6]); break; } }
      }
    }
    // boats: alongside the jetty, or tied at the bank
    const boatAt = (X, Y, dir) => { const w = dir === 'h' ? 2 : 1, h = dir === 'h' ? 1 : 2; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (!water(X + i, Y + j)) return false; add({ t: 'boat', x: X, y: Y, w, h, dir, v: Math.floor(rw() * 4) }); return true; };
    let nb = 0;
    if (pier) {
      const dir = pier.dy ? 'v' : 'h', k = 1;
      for (const s of [1, -1]) { if (nb >= D.water.boats) break; const X = pier.x + pier.dx * k + (pier.dy ? s : 0), Y = pier.y + pier.dy * k + (pier.dx ? s : 0); if (boatAt(dir === 'v' ? X : Math.min(X, X + pier.dx), dir === 'v' ? Math.min(Y, Y + pier.dy) : Y, dir)) nb++; }
    } else for (const c2 of cands) { if (nb >= D.water.boats) break; const X = c2.x + c2.dx, Y = c2.y + c2.dy; if (boatAt(c2.dy ? X : Math.min(X, X + c2.dx), c2.dy ? Math.min(Y, Y + c2.dy) : Y, c2.dy ? 'v' : 'h')) nb++; }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!water(x, y)) continue;
    const bank = N4.reduce((s, [dx, dy], k) => s | (!'~w'.includes(ter(x + dx, y + dy)) ? 1 << k : 0), 0);
    let busy = false; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const c = ter(x + i, y + j); if (c === 'p' || c === 'w' || (inMap(x + i, y + j) && used[I(x + i, y + j)] && pieces.some((p) => (p.t === 'pier' || p.t === 'boat') && x + i >= p.x && x + i < p.x + p.w && y + j >= p.y && y + j < p.y + p.h))) busy = true; }
    if (busy) continue;
    if (bank && noise(x * 0.35, y * 0.35, 404) < D.water.reeds + 0.12 && hash(x, y, 405) < 0.85) add({ t: 'reeds', x, y, m: bank, v: variant(x, y) });
    else if (!bank && N8.every(([dx, dy]) => ter(x + dx, y + dy) === '~') && hash(x, y, 406) < D.water.lilies * 3) add({ t: 'lily', x, y, v: variant(x, y) });
  }

  // ---- 6. lanterns that glow softly at night (the project's own kind)
  for (const p of pieces) if ((p.t === 'lantern' || (p.t === 'well' && D.lantern === 'well') || p.t === 'stall') && !glows.some(([gx, gy]) => gx === p.x * T + 8 && gy === p.y * T - 6)) glows.push([p.x * T + (p.t === 'stall' ? 16 : 8), p.y * T + (p.t === 'lantern' ? -6 : p.t === 'stall' ? -2 : 0)]);

  const blocked = [];
  for (let i = 0; i < W * H; i++) if (solid[i] && !base[i]) blocked.push([i % W, (i / W) | 0]);
  return { theme: THEME.name, pieces, blocked, walk, glows: glows.slice(0, 6), zones: zones.map((z) => ({ id: z.id, mood: z.mood })), plots: plots.map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h, kind: p.kind })) };
}

// Re-check from scratch (for scripts/check.mjs): every tile reached before is still reached, and no
// lane, plaza, door step, landmark, sign or person is farther from the start.
export function checkDressing(L = planDressing()) {
  const base = baseBlocked(), d0 = bfs(base, START.x, START.y), b = base.slice();
  for (const [x, y] of L.blocked) b[I(x, y)] = 1;
  for (const [x, y] of L.walk) b[I(x, y)] = 0;
  const d = bfs(b, START.x, START.y), problems = [];
  let worse = 0;
  for (let i = 0; i < W * H; i++) {
    if (d0[i] < 0 || b[i]) continue;
    const c = TERRAIN[(i / W) | 0][i % W];
    if (d[i] < 0) problems.push(`tile ${i % W},${(i / W) | 0} cannot be reached any more`);
    else if ('pcwG'.includes(c) && d[i] > d0[i]) worse++;
  }
  for (const o of BUILDINGS) for (const [x, y] of o.doors) { const i = I(x, y + 1); if (d0[i] >= 0 && !(d[i] >= 0 && d[i] <= d0[i])) problems.push(`the door of "${o.id}" got farther or unreachable`); }
  if (worse) problems.push(`${worse} lane or plaza tiles got farther from the start`);
  return { problems, base: d0, now: d };
}

// ------------------------------------------------------------------ browser: paint and place
// Paints once (cached across visits to the town) into one flat layer for the ground and one strip
// per map row for the things that stand up, so the player walks behind and in front of them.
let painted = null;
export function addDressing(scene) {
  const L = planDressing();
  painted ||= paintDressing(L, THEME);
  const tex = (key, canvas) => { if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvas).setFilter(1); };
  tex('dress-ground', painted.ground);
  scene.add.image(0, 0, 'dress-ground').setOrigin(0).setDepth(2.5);
  for (const s of painted.rows) {
    tex(s.key, s.canvas);
    scene.add.image(s.x, s.y, s.key).setOrigin(0, 1).setDepth(s.depth);
  }
  for (const [x, y] of L.blocked) scene.block(x, y);
  for (const [x, y] of L.walk) scene.blocked[y * W + x] = 0;
  for (const [x, y] of L.glows) { scene.lights.push({ x, y, r: 26 }); scene.addGlow(x, y, 'glow', 0.4, 'glow'); }
}
