// Generated rooms (optional: world.json { "gen": { "interior": false } } brings back the single
// standard room of src/scenes/Interior.js).
//
// Every house gets its own room, built by rule-based constructive placement: a floor plan is
// chosen, then the things the learner uses (lab door, reading wall, host, exit) are placed, then
// the concept's signature object, then furniture one piece at a time. A piece is accepted only if
// it fits the room (against a wall or free-standing), leaves walkways and doors clear and keeps
// every free tile and every interactive thing reachable on foot from the entrance.
//
// The result is deterministic: seeded(`${place.id}:interior`). Same course, same rooms.
//
// Two layers, so that Node can check the layout without a browser:
//   planRoom(place)     pure data: size, cells, blocked tiles, positions, furniture       (Node)
//   generateRoom(place) planRoom + paint functions for the scene                          (browser)
//   checkRoom(layout)   breadth-first search from the entrance; throws a clear error
import { seeded, THEME } from './core.js';
import { drawEmblem, EMBLEMS } from './emblems.js';
import { rect, px, ellipse, hash, mix } from '../art/px.js';
import { drawText, textWidth } from '../art/buildings.js';
import { P } from '../art/palette.js';

export const T = 16;

// ---------------------------------------------------------------- kinds of knowledge
// Colours that say "which kind of house" stay with the kind; materials come from the project THEME.
const KINDS = {
  lab: { wall: '#ecebf2', band: '#6b4fa0', lower: '#d5d2e2', front: '#6b4fa0', step: 'stone', floors: ['tile', 'small'], walls: ['plain', 'tiles', 'stripes'],
    furniture: ['bench', 'cabinet', 'labtable', 'computer', 'bottle', 'labtable'], decor: ['chart', 'clock'] },
  archive: { wall: '#efe6d2', band: '#8a5a34', lower: '#d9cbb0', front: '#5c3f27', step: 'wood', floors: ['wood', 'parquet'], walls: ['panel', 'stripes'],
    furniture: ['shelf', 'shelf1', 'drawers', 'readtable', 'shelf', 'crates'], decor: ['portrait', 'clock'] },
  hall: { wall: '#f6f1e3', band: '#c9662a', lower: '#ead9bd', front: '#a95f1f', step: 'wood', floors: ['parquet', 'marble', 'wood'], walls: ['panel', 'brick', 'stripes'],
    furniture: ['longtable', 'seat', 'candelabra', 'chest', 'seat'], decor: ['banner', 'banner', 'portrait'] },
  studio: { wall: '#f3f4f1', band: '#2a8c87', lower: '#d7e3e2', front: '#2a8c87', step: 'stone', floors: ['tile', 'small', 'wood'], walls: ['plain', 'tiles'],
    furniture: ['easel', 'examtable', 'easel', 'screen', 'cabinet', 'stool'], decor: ['lightbox', 'portrait'] },
  observatory: { wall: '#e6edf5', band: '#2c4580', lower: '#cdd8e8', front: '#2c4580', step: 'stone', floors: ['stone', 'marble'], walls: ['blocks', 'plain'],
    furniture: ['charttable', 'globe', 'shelf1', 'scope', 'chest'], decor: ['starchart', 'starchart', 'clock'] },
  cave: { wall: '#4a4652', band: '#2b2833', lower: '#3d3945', front: '#2b2833', step: 'stone', floors: ['flag', 'rough'], walls: ['rock'], dark: true,
    furniture: ['rock', 'rock2', 'stalagmite', 'crystal', 'crystal', 'rock'], decor: [] },
};

// Furniture: footprint in tiles (fw x fh), height in pixels drawn above the footprint's bottom,
// and where it may stand: 'wall' (back against the back wall), 'side' (against a side wall),
// 'free' (free-standing, with a walkway all around).
const PIECES = {
  bench: { fw: 3, fh: 1, ph: 22, modes: ['wall'] },
  cabinet: { fw: 1, fh: 1, ph: 34, modes: ['wall', 'side'] },
  labtable: { fw: 2, fh: 1, ph: 22, modes: ['free'] },
  computer: { fw: 2, fh: 1, ph: 30, modes: ['wall'] },
  bottle: { fw: 1, fh: 1, ph: 24, modes: ['side', 'wall'] },
  shelf: { fw: 2, fh: 1, ph: 38, modes: ['wall'] },
  shelf1: { fw: 1, fh: 1, ph: 38, modes: ['wall', 'side'] },
  drawers: { fw: 1, fh: 1, ph: 28, modes: ['wall', 'side'] },
  readtable: { fw: 2, fh: 1, ph: 22, modes: ['free'] },
  crates: { fw: 1, fh: 1, ph: 22, modes: ['side'] },
  longtable: { fw: 4, fh: 1, ph: 20, modes: ['free'], alt: { fw: 3 } },
  seat: { fw: 2, fh: 1, ph: 18, modes: ['wall', 'side'] },
  candelabra: { fw: 1, fh: 1, ph: 30, modes: ['side', 'free'], glow: true },
  chest: { fw: 1, fh: 1, ph: 16, modes: ['wall', 'side'] },
  easel: { fw: 1, fh: 1, ph: 34, modes: ['free', 'wall'] },
  examtable: { fw: 2, fh: 1, ph: 22, modes: ['free'] },
  screen: { fw: 2, fh: 1, ph: 30, modes: ['wall'] },
  stool: { fw: 1, fh: 1, ph: 14, modes: ['free'] },
  charttable: { fw: 2, fh: 1, ph: 22, modes: ['free'] },
  globe: { fw: 1, fh: 1, ph: 26, modes: ['free', 'side'] },
  scope: { fw: 1, fh: 1, ph: 30, modes: ['free', 'side'] },
  rock: { fw: 1, fh: 1, ph: 16, modes: ['side', 'free', 'wall'] },
  rock2: { fw: 2, fh: 1, ph: 22, modes: ['wall', 'free'] },
  stalagmite: { fw: 1, fh: 1, ph: 30, modes: ['free', 'side'] },
  crystal: { fw: 1, fh: 1, ph: 26, modes: ['side', 'wall', 'free'], glow: true },
  plant: { fw: 1, fh: 1, ph: 20, modes: ['corner'] },
  sig: { fw: 2, fh: 1, ph: 52, modes: ['wall', 'free'] },
};

// Signature objects without an emblem, picked by the seed (the kind tilts the choice).
const SIGNATURES = ['orrery', 'bigglobe', 'bigcrystal', 'clock', 'tree', 'prism', 'hourglass'];
const SIG_FIT = { cave: ['bigcrystal', 'hourglass', 'orrery', 'prism'] };
const SIG_BIAS = { lab: ['prism', 'orrery'], archive: ['clock', 'hourglass', 'bigglobe'], hall: ['tree', 'clock'], studio: ['prism', 'tree'], observatory: ['orrery', 'bigglobe'], cave: ['bigcrystal', 'bigcrystal', 'hourglass', 'orrery'] };

// ---------------------------------------------------------------- floor plans
// A plan is a width, a height and, for every column, the row where its back wall starts (top) and
// the row of its front wall (bot). The back wall is 3 tiles high; floor runs from top + 3 to bot - 1.
// Everything outside is empty. Add a plan here and to PLANS; checkRoom will tell you if it breaks.
const PLANS = {
  hall(r) { const w = r.int(15, 16), h = r.int(9, 10); return { w, h, top: Array(w).fill(0), bot: Array(w).fill(h - 1) }; },
  square(r) { const w = r.int(11, 12), h = r.int(11, 12); return { w, h, top: Array(w).fill(0), bot: Array(w).fill(h - 1) }; },
  ell(r) {
    const w = r.int(14, 16), h = r.int(10, 12), nw = r.int(4, 5), left = r.chance(0.5), up = r.chance(0.5), nd = up ? r.int(2, 3) : 3;
    const top = Array(w).fill(0), bot = Array(w).fill(h - 1);
    for (let i = 0; i < nw; i++) { const x = left ? i : w - 1 - i; if (up) top[x] = nd; else bot[x] = h - 1 - nd; }
    return { w, h, top, bot, notch: { left, up, nw, nd } };
  },
  alcove(r) {
    const w = r.int(13, 16), h = r.int(11, 12), aw = r.int(4, 5), off = r.pick([-3, 0, 0, 3]);
    const a0 = Math.max(2, Math.min(w - aw - 2, Math.floor((w - aw) / 2) + off));
    const top = Array(w).fill(2), bot = Array(w).fill(h - 1);
    for (let x = a0; x < a0 + aw; x++) top[x] = 0;
    return { w, h, top, bot, alcove: [a0, a0 + aw - 1] };
  },
  dais(r) {
    const w = r.int(13, 16), h = r.int(10, 12), pw = r.int(6, 7), off = r.pick([-2, 0, 0, 2]);
    const p0 = Math.max(1, Math.min(w - pw - 1, Math.floor((w - pw) / 2) + off));
    return { w, h, top: Array(w).fill(0), bot: Array(w).fill(h - 1), dais: [p0, p0 + pw - 1, 3, 4] };
  },
};
export const PLAN_NAMES = Object.keys(PLANS);

// ---------------------------------------------------------------- layout (no browser needed)
export function cellAt(L, x, y) {
  if (x < 0 || y < 0 || x >= L.w || y >= L.h) return 'out';
  if (y < L.top[x]) return 'void';
  if (y < L.top[x] + 3) return 'wall';
  if (y < L.bot[x]) return 'floor';
  return y === L.bot[x] ? 'front' : 'void';
}

const FREE = 0, USED = 1, KEEP = 2;
const N4 = [[0, 1], [1, 0], [0, -1], [-1, 0]];

function reach(L) {
  const seen = new Uint8Array(L.w * L.h), [sx, sy] = L.start, q = [[sx, sy]];
  const pass = (x, y) => cellAt(L, x, y) === 'floor' && L.occ[y * L.w + x] !== USED && !(x === L.master[0] && y === L.master[1]);
  if (!pass(sx, sy)) return seen;
  seen[sy * L.w + sx] = 1;
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (pass(nx, ny) && !seen[ny * L.w + nx]) { seen[ny * L.w + nx] = 1; q.push([nx, ny]); } }
  }
  return seen;
}

// The rule of the room: everything interactive can be reached on foot from the entrance.
// Returns a list of problems (empty when the room is fine). pockets: also report free floor that
// cannot be reached (used while placing furniture, not an error in a finished room).
export function roomProblems(L, pockets = false) {
  const out = [], seen = reach(L), ok = (x, y) => x >= 0 && y >= 0 && x < L.w && y < L.h && seen[y * L.w + x] === 1;
  const [ex, ey] = L.exit;
  if (L.start[0] !== ex || L.start[1] !== ey - 1) out.push(`the entrance (${L.start}) is not just above the exit (${L.exit})`);
  if (!ok(...L.start)) out.push(`the entrance tile (${L.start}) is blocked`);
  if (L.lab && !ok(L.lab[0], L.lab[1] + 1)) out.push(`the lab door at (${L.lab}) cannot be reached`);
  for (const [x, y] of L.exhibit) if (!ok(x, y + 1)) out.push(`the reading wall at (${x},${y}) cannot be read: the tile in front of it is unreachable`);
  if (!N4.some(([dx, dy]) => ok(L.master[0] + dx, L.master[1] + dy))) out.push(`the host at (${L.master}) cannot be reached`);
  if (pockets) for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) if (cellAt(L, x, y) === 'floor' && L.occ[y * L.w + x] !== USED && !(x === L.master[0] && y === L.master[1]) && !seen[y * L.w + x]) { out.push(`pocket at ${x},${y}`); return out; }
  return out;
}

export function checkRoom(L) {
  const p = roomProblems(L);
  if (p.length) throw new Error(`Room of "${L.id}" (plan ${L.plan}, ${L.w} x ${L.h}): ${p.join('; ')}. Change the plan or the furniture in src/gen/interior.js.`);
  return true;
}

export function planRoom(place) {
  // a plan that cannot hold everything is drawn again with the next seed (still deterministic)
  let err;
  for (let a = 0; a < 6; a++) { try { return planOnce(place, a); } catch (e) { err = e; } }
  throw err;
}

function planOnce(place, attempt) {
  const r = seeded(`${place.id}:interior${attempt ? `:${attempt}` : ''}`);
  const kindName = KINDS[place.kind] ? place.kind : 'lab', K = KINDS[kindName];
  // neighbouring houses never share a plan: a project-wide offset plus the house number
  const off = Math.floor(seeded('interior:plans')() * PLAN_NAMES.length);
  const plan = PLAN_NAMES[(off + (place.order || 1)) % PLAN_NAMES.length];
  const base = PLANS[plan](r);
  const L = { id: place.id, kind: kindName, plan, ...base, occ: null, items: [], wall: [], glows: [], torches: [], rugs: [], lights: [] };
  const { w, h, top } = L;
  L.occ = new Uint8Array(w * h);
  L.up = new Uint8Array(w); L.lo = new Uint8Array(w); // back-wall bands in use: upper (pictures) and lower (behind furniture)
  const f0 = (x) => top[x] + 3, isFloor = (x, y) => cellAt(L, x, y) === 'floor';
  const occ = (x, y) => L.occ[y * w + x], set = (x, y, v) => { L.occ[y * w + x] = v; };

  // exit and entrance: the column of the exit is a walkway straight up from the door
  let ex = Math.floor(w / 2);
  for (let d = 1; d < w && (L.bot[ex] !== h - 1 || (top[ex] !== 0 && plan !== 'alcove')); d++) ex = Math.floor(w / 2) + (d % 2 ? -(d + 1) / 2 : d / 2);
  L.exit = [ex, h - 1]; L.start = [ex, h - 2];
  for (let y = h - 2; y >= Math.max(f0(ex), h - 5); y--) set(ex, y, KEEP);

  // the main floor's first row (most columns) and the host's row
  const mainTop = plan === 'alcove' ? 2 : 0, mf0 = mainTop + 3;
  if (L.dais) { const [p0, p1, r0, r1] = L.dais; for (let x = p0; x <= p1; x++) for (let y = r0; y <= r1; y++) set(x, y, KEEP); }

  const tryWall = (n, need, score, extra = () => true) => {
    let best = null;
    for (let x0 = 1; x0 + n <= w - 1; x0++) {
      let good = true;
      for (let x = x0; x < x0 + n && good; x++) good = top[x] === top[x0] && (!need.up || !L.up[x]) && (!need.lo || !L.lo[x]) && extra(x);
      if (!good) continue;
      const s = score(x0) + r() * 0.5;
      if (!best || s > best.s) best = { x0, s };
    }
    return best && best.x0;
  };
  const mark = (x0, n, up, lo) => { for (let x = x0; x < x0 + n; x++) { if (up) L.up[x] = 1; if (lo) L.lo[x] = 1; } };

  // -- signature first where the plan has a place of honour for it
  const sig = { type: 'sig', ...pickSignature(place, kindName, r) };
  const putSig = (x, y, mode) => { Object.assign(sig, { x, y, fw: 2, fh: 1, ph: PIECES.sig.ph, mode }); set(x, y, USED); set(x + 1, y, USED); if (mode === 'wall') mark(x, 2, y === f0(x), 1); L.items.push(sig); };
  if (L.alcove) { const [a0, a1] = L.alcove; putSig(a0 + Math.floor((a1 - a0 - 1) / 2), 4, 'wall'); L.honour = [sig.x, 2]; for (let x = a0; x <= a1; x++) for (const y of [3, 4, 5]) if (isFloor(x, y) && occ(x, y) === FREE) set(x, y, KEEP); }
  if (L.dais) { const [p0, p1] = L.dais, sx = p0 + Math.floor((p1 - p0 - 1) / 2) + (ex === p0 + Math.floor((p1 - p0 - 1) / 2) ? 1 : 0); putSig(Math.min(sx, p1 - 1), 4, 'wall'); L.honour = [sig.x, 2]; for (let x = p0; x <= p1; x++) if (isFloor(x, 5) && occ(x, 5) === FREE) set(x, 5, KEEP); }

  // -- lab door: a column of the back wall with free floor in front; never above the entrance
  const doorX = tryWall(1, { up: 1, lo: 1 }, (x) => (x <= 2 || x >= w - 3 ? 2 : 0) + r() * 2, (x) => x !== ex && occ(x, f0(x)) === FREE && isFloor(x, f0(x) + 1));
  L.lab = [doorX, top[doorX] + 2]; mark(doorX, 1, 1, 1); set(doorX, f0(doorX), KEEP);
  L.glows.push([doorX * T + 8, (top[doorX] + 2) * T + 4, 'glow', 0.75, 'door']);

  // -- reading wall: a board over a desk; the desk tiles are the exhibit, the tiles in front stay free
  const bn = w <= 13 ? 2 : 3, nearDoor = r.chance(0.6);
  const bx = tryWall(bn, { up: 1, lo: 1 }, (x0) => (nearDoor ? -Math.min(Math.abs(x0 - doorX - 1), Math.abs(x0 + bn - doorX)) : -Math.abs(x0 + bn / 2 - w / 2) * 0.3),
    (x) => x !== ex && x !== doorX && occ(x, f0(x)) === FREE && occ(x, f0(x) + 1) !== USED && isFloor(x, f0(x) + 1));
  if (bx == null) throw new Error(`Room of "${place.id}": no place for the reading wall (plan ${plan}, ${w} x ${h})`);
  L.board = { x0: bx, n: bn, top: top[bx] };
  L.exhibit = [];
  for (let x = bx; x < bx + bn; x++) { L.exhibit.push([x, f0(x)]); set(x, f0(x), USED); set(x, f0(x) + 1, KEEP); }
  mark(bx, bn, 1, 1);

  // -- the concept on the wall (one line, or two if the wall is short) and the house number
  const label = (place.concept || place.name || '').toUpperCase().replace(/[^A-Z0-9 .\-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 34);
  L.label = placeLabel(L, label, tryWall, mark, L.honour);
  // -- torches in the dark room: spread over the back wall
  if (K.dark) {
    const n = w >= 14 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const want = Math.round(((i + 0.5) / n) * (w - 1));
      const tx = tryWall(1, { up: 1 }, (x) => -Math.abs(x - want));
      if (tx == null) continue;
      mark(tx, 1, 1, 0); L.torches.push([tx * T + 8, top[tx] * T + 16]);
    }
  }

  // -- host: central, standing free, next to the walkway
  let hx, hy;
  if (L.dais) { const [p0, p1, , r1] = L.dais; hx = sig.x - 1 >= p0 && sig.x - 1 !== ex ? sig.x - 1 : sig.x + 2; hy = r1; }
  else { hx = ex + (r.chance(0.5) ? 1 : -1); hy = Math.floor((mf0 + h - 2) / 2); if (L.alcove && hy < 6) hy = 6; }
  if (!isFloor(hx, hy) || occ(hx, hy) === USED) { hx = ex + 1; hy = Math.floor((mf0 + h - 2) / 2); }
  L.master = [hx, hy];
  for (const [dx, dy] of [[0, 0], ...N4]) if (isFloor(hx + dx, hy + dy) && occ(hx + dx, hy + dy) === FREE) set(hx + dx, hy + dy, KEEP);

  const numX = tryWall(1, { up: 1 }, (x) => x - Math.abs(top[x] - mainTop) * 3);
  L.number = numX == null ? null : { x: numX, top: top[numX] }; if (numX != null) mark(numX, 1, 1, 0);

  // -- the signature, if the plan did not already give it a place: the most prominent free spot
  if (!sig.x && sig.x !== 0) {
    const cands = [];
    const cx = w / 2 - 1;
    for (let x = 1; x < w - 2; x++) {
      if (top[x] === top[x + 1] && !L.up[x] && !L.up[x + 1] && !L.lo[x] && !L.lo[x + 1] && occ(x, f0(x)) === FREE && occ(x + 1, f0(x)) === FREE) cands.push({ x, y: f0(x), mode: 'wall', s: 3 - Math.abs(x - cx) * 0.4 });
      const hides = (y) => [x, x + 1].some((c) => c === L.lab[0] || (c >= L.board.x0 && c < L.board.x0 + L.board.n)) && y <= mf0 + 3; // never in front of the door or the reading wall
      for (let y = mf0 + 2; y <= h - 4; y++) if (!hides(y) && freeRing(L, x, y, 2, 1)) cands.push({ x, y, mode: 'free', s: 2 - Math.abs(x - cx) * 0.3 - Math.abs(y - (mf0 + 1)) * 0.5 });
    }
    cands.sort((a, b) => b.s - a.s);
    for (const c of cands) {
      const save = L.occ.slice();
      set(c.x, c.y, USED); set(c.x + 1, c.y, USED);
      if (!roomProblems(L, true).length) {
        L.occ.set(save); putSig(c.x, c.y, c.mode);
        // a walkway all around a free-standing signature keeps it in view
        if (c.mode === 'free') for (let y = c.y - 1; y <= c.y + 1; y++) for (let x = c.x - 1; x <= c.x + 2; x++) if (isFloor(x, y) && occ(x, y) === FREE) set(x, y, KEEP);
        break;
      }
      L.occ.set(save);
    }
    if (sig.x == null) throw new Error(`Room of "${place.id}": no place for the signature object`);
  }

  // -- furniture, one piece at a time
  const floorCount = L.occ.reduce((s, v, i) => s + (cellAt(L, i % w, Math.floor(i / w)) === 'floor' ? 1 : 0), 0);
  const want = Math.max(3, Math.min(8, Math.round(floorCount / 13)));
  // each kind of piece once in a seeded order, then a second round; never more than two of a kind
  const order = [];
  for (let round = 0; round < 2; round++) { const p = [...new Set(K.furniture)]; for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } order.push(...p); }
  const count = {};
  for (const type of order) {
    if (L.items.length - 1 >= want) break;
    if ((count[type] || 0) >= 2) continue;
    if (placePiece(L, type, r, f0, mark)) count[type] = (count[type] || 0) + 1;
  }
  // plants in free corners (not in the cave)
  if (!K.dark) for (const [x, y] of corners(L)) if (r.chance(0.65) && !N4.some(([dx, dy]) => cellAt(L, x + dx, y + dy) === 'floor' && occ(x + dx, y + dy) === USED)) placeAt(L, 'plant', x, y, 'corner', f0, mark);

  // -- wall decoration: windows with night light, then pictures of the kind
  if (!K.dark) {
    const nwin = w >= 14 ? r.int(1, 2) : 1;
    for (let i = 0; i < nwin; i++) {
      const wx = tryWall(2, { up: 1 }, (x) => -Math.abs(x + 1 - (i ? w * 0.75 : w * 0.3)) * 0.3);
      if (wx == null) break;
      mark(wx, 2, 1, 0); L.wall.push({ type: 'window', x: wx, n: 2, top: top[wx] });
      L.glows.push([wx * T + 16, top[wx] * T + 20, 'glow-teal', 0.55, 'window']);
    }
  }
  const decor = [...new Set(K.decor)].filter((d) => !(d === 'clock' && sig.object === 'clock' && !sig.emblem));
  for (let i = 0; i < 3 && decor.length; i++) {
    const type = decor.splice(Math.floor(r() * decor.length), 1)[0];
    const n = ['chart', 'starchart', 'lightbox'].includes(type) ? 2 : 1;
    const dx = tryWall(n, { up: 1 }, () => 0);
    if (dx == null) break;
    mark(dx, n, 1, 0); L.wall.push({ type, x: dx, n, top: top[dx] });
    if (type === 'lightbox') L.glows.push([dx * T + 16, top[dx] * T + 18, 'glow-teal', 0.5, 'lightbox']);
  }

  // -- a rug in the middle of the room
  if (!K.dark && r.chance(0.75)) {
    const rw = r.int(3, 5), rh = r.int(2, 3), rx = Math.max(1, Math.min(w - rw - 1, hx - Math.floor(rw / 2) + r.int(-1, 1))), ry = L.dais ? Math.min(h - 2 - rh, L.dais[3] + 2) : Math.max(mf0 + 1, Math.min(h - 2 - rh, hy - 1));
    let ok = true;
    for (let x = rx; x < rx + rw; x++) for (let y = ry; y < ry + rh; y++) if (!isFloor(x, y) || (L.dais && x >= L.dais[0] - 1 && x <= L.dais[1] + 1 && y <= L.dais[3])) ok = false;
    if (ok) L.rugs.push({ x: rx, y: ry, w: rw, h: rh, style: r.int(0, 2) });
  }

  // finish: floor and wall styles, colours, blocked tiles
  L.floor = r.pick(K.floors); L.wallStyle = r.pick(K.walls);
  L.tone = r.int(0, 2);
  L.step = K.step; L.dark = !!K.dark;
  L.blocked = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (cellAt(L, x, y) !== 'floor' || L.occ[y * w + x] === USED) L.blocked[y * w + x] = 1;
  L.sig = sig;
  checkRoom(L);
  return L;
}

function freeRing(L, x0, y0, fw, fh) {
  for (let y = y0 - 1; y <= y0 + fh; y++) for (let x = x0 - 1; x <= x0 + fw; x++) {
    const c = cellAt(L, x, y), inside = x >= x0 && x < x0 + fw && y >= y0 && y < y0 + fh;
    if (inside && (c !== 'floor' || L.occ[y * L.w + x] !== 0)) return false;
    if (!inside && (c !== 'floor' || L.occ[y * L.w + x] === 1)) return false;
  }
  return true;
}

function placeAt(L, type, x0, y0, mode, f0, mark, extra = {}) {
  const pc = { ...PIECES[type], ...extra };
  for (let y = y0; y < y0 + pc.fh; y++) for (let x = x0; x < x0 + pc.fw; x++) if (cellAt(L, x, y) !== 'floor' || L.occ[y * L.w + x] !== 0) return false;
  // tall pieces against the back wall cover its lower band (and upper band when very tall)
  // nothing tall straight behind another piece: keep the row in front of a wall piece clear of furniture
  if (mode === 'wall') for (let x = x0; x < x0 + pc.fw; x++) if (cellAt(L, x, y0 + pc.fh) === 'floor' && L.occ[(y0 + pc.fh) * L.w + x] === 1) return false;
  const over = mode === 'wall' || (mode === 'corner' && y0 === f0(x0)) ? pc.ph - pc.fh * T : 0;
  if (over > 6) for (let x = x0; x < x0 + pc.fw; x++) if (L.lo[x] || (over > 20 && L.up[x])) return false;
  const save = L.occ.slice();
  for (let y = y0; y < y0 + pc.fh; y++) for (let x = x0; x < x0 + pc.fw; x++) L.occ[y * L.w + x] = 1;
  if (roomProblems(L, true).length) { L.occ.set(save); return false; }
  if (over > 6) mark(x0, pc.fw, over > 20, 1);
  const it = { type, x: x0, y: y0, fw: pc.fw, fh: pc.fh, ph: pc.ph, mode, v: Math.floor(hash(x0, y0, L.items.length) * 1000) };
  L.items.push(it);
  if (pc.glow) L.glows.push([x0 * T + pc.fw * 8, (y0 + pc.fh) * T - pc.ph + 6, L.kind === 'cave' && type === 'crystal' ? 'glow-teal' : 'glow', 0.45, type]);
  return true;
}

function placePiece(L, type, r, f0, mark) {
  const base = PIECES[type], { w, h } = L, cands = [];
  for (const mode of base.modes) for (const fw of base.alt ? [base.fw, base.alt.fw] : [base.fw]) {
    if (mode === 'wall') for (let x = 0; x + fw <= w; x++) { let same = true; for (let k = 1; k < fw; k++) same = same && L.top[x + k] === L.top[x]; if (same) cands.push([x, f0(x), mode, fw]); }
    if (mode === 'side') for (let y = 0; y < h; y++) for (const x of [0, w - 1]) if (cellAt(L, x, y) === 'floor' && cellAt(L, x, y - 1) === 'floor' && L.occ[(y - 1) * w + x] !== 1 && !(cellAt(L, x, y + 1) === 'floor' && L.occ[(y + 1) * w + x] === 1)) cands.push([x, y, mode, fw]);
    if (mode === 'free') for (let y = 1; y < h - 3; y++) for (let x = 1; x + fw < w; x++) if (freeRing(L, x, y, fw, base.fh)) cands.push([x, y, mode, fw]);
  }
  // seeded order: shuffle the candidates
  for (let i = cands.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [cands[i], cands[j]] = [cands[j], cands[i]]; }
  for (const [x, y, mode, fw] of cands.slice(0, 40)) if (placeAt(L, type, x, y, mode, f0, mark, { fw })) return true;
  return false;
}

function corners(L) {
  const out = [];
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
    if (cellAt(L, x, y) !== 'floor') continue;
    const hor = cellAt(L, x - 1, y) !== 'floor' || cellAt(L, x + 1, y) !== 'floor';
    const ver = cellAt(L, x, y - 1) !== 'floor' || cellAt(L, x, y + 1) !== 'floor';
    if (hor && ver) out.push([x, y]);
  }
  return out;
}

function pickSignature(place, kind, r) {
  const emblem = EMBLEMS.includes(place.emblem) ? place.emblem : null; // unknown names fall back to an object
  const form = r.pick(kind === 'hall' ? ['banner', 'banner', 'pedestal'] : kind === 'archive' ? ['case', 'case', 'pedestal'] : ['pedestal', 'case', 'banner']);
  // houses in a row get different objects (project-wide offset plus the house number); a few do
  // not belong everywhere, and the kind may tilt the choice
  let object = SIGNATURES[(Math.floor(seeded('interior:signatures')() * SIGNATURES.length) + (place.order || 1)) % SIGNATURES.length];
  if (!(SIG_FIT[kind] || SIGNATURES).includes(object) || r.chance(0.2)) object = r.pick(SIG_BIAS[kind] || SIGNATURES);
  return { emblem: emblem || null, form, object };
}

function placeLabel(L, label, tryWall, mark, honour) {
  const words = label.split(' ');
  let lines = [label];
  if (words.length > 1) {
    let best = null;
    for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), m = Math.max(a.length, b.length); if (!best || m < best.m) best = { m, l: [a, b] }; }
    lines = best.l;
  }
  const cols = (ls) => Math.ceil((Math.max(...ls.map(textWidth)) + 6) / T);
  const mid = L.w / 2;
  const tries = [];
  let three = null;
  if (words.length > 2) { // three lines, for long names on short walls
    let best = null;
    for (let i = 1; i < words.length - 1; i++) for (let j = i + 1; j < words.length; j++) { const l = [words.slice(0, i), words.slice(i, j), words.slice(j)].map((a) => a.join(' ')), m = Math.max(...l.map((a) => a.length)); if (!best || m < best.m) best = { m, l }; }
    three = best.l;
  }
  // one line if it takes at most half of the wall, otherwise two or three
  if (cols([label]) <= Math.floor(L.w / 2) || lines.length === 1) tries.push([[label], 'up']);
  if (lines.length === 2) tries.push([lines, 'up']);
  if (three) tries.push([three, 'up']);
  tries.push([[label], 'lo']);
  if (lines.length === 2) tries.push([lines, 'lo']);
  for (const [ls, band] of tries) {
    const n = cols(ls);
    const at = honour ? honour[0] + 1 : mid;
    const x0 = tryWall(n, band === 'up' ? { up: 1 } : { lo: 1 }, (x) => -Math.abs(x + n / 2 - at) * 0.5);
    if (x0 == null) continue;
    mark(x0, n, band === 'up', band === 'lo');
    return { lines: ls, x0, n, band, top: L.top[x0] };
  }
  // last resort: the widest stretch of upper wall, with as many lines as it takes, cut if it must
  let x0 = 1, n = 0;
  for (let x = 1, run = 0; x < L.w - 1; x++) { run = L.up[x] || L.top[x] !== L.top[x - 1] ? (L.up[x] ? 0 : 1) : run + 1; if (run > n) { n = run; x0 = x - run + 1; } }
  const maxCh = Math.max(3, Math.floor((n * T - 6) / 4));
  const ls = [[label], lines, three].filter(Boolean).find((l) => Math.max(...l.map((a) => a.length)) <= maxCh) || (three || lines);
  mark(x0, n, 1, 0);
  return { lines: ls.map((a) => a.slice(0, maxCh)), x0, n, band: 'up', top: L.top[x0] };
}

// ---------------------------------------------------------------- painting (browser)
const ink = P.ink;
const lighten = (c, t) => mix(c, '#ffffff', t), darken = (c, t) => mix(c, ink, t);
function box(ctx, x, y, w, h, fill, edge = ink) { rect(ctx, x, y, w, h, edge); rect(ctx, x + 1, y + 1, w - 2, h - 2, fill); }

function palette(L) {
  const K = KINDS[L.kind], tw = THEME.wall[L.tone % THEME.wall.length];
  const wood = THEME.wood, stone = THEME.stone;
  return {
    K, wall: K.dark ? K.wall : mix(K.wall, tw, 0.28), lower: K.dark ? K.lower : mix(K.lower, tw, 0.3), band: K.band, front: K.front,
    wood, woodL: lighten(wood, 0.2), woodD: darken(wood, 0.35), stone, stoneL: lighten(stone, 0.3), stoneD: darken(stone, 0.3),
    trim: THEME.trim, accent: THEME.accent, metal: P.metal, metalL: P.metalLight, metalD: P.metalDark,
  };
}

function floorColour(L, C, x, y) {
  const s = L.floor;
  if (s === 'tile') { const a = lighten(C.lower, 0.55), b = C.lower; if (x % 16 === 0 || y % 16 === 0) return darken(C.lower, 0.12); return ((x >> 4) + (y >> 4)) % 2 ? a : mix(a, b, 0.6); }
  if (s === 'small') { if (x % 8 === 0 || y % 8 === 0) return darken(C.lower, 0.1); return hash(x >> 3, y >> 3, 9) > 0.85 ? mix(C.lower, C.band, 0.25) : lighten(C.lower, 0.45); }
  if (s === 'wood') { const row = Math.floor(y / 5), off = (row * 23) % 40; if (y % 5 === 4 || (x + off) % 40 === 0) return C.woodD; return mix(C.woodL, C.wood, hash(Math.floor((x + off) / 40), row, 3) * 0.7); }
  if (s === 'parquet') { const bx = x >> 3, by = y >> 3, hz = (bx + by) % 2, k = hz ? y % 8 : x % 8; if (k % 4 === 3) return C.woodD; return mix(C.woodL, C.wood, (hz ? 0.2 : 0.55) + hash(bx, by, 4) * 0.25); }
  if (s === 'marble') { const d = ((x + y) >> 4) + ((x - y + 512) >> 4); if ((x + y) % 16 === 0 || (x - y + 512) % 16 === 0) return C.stoneD; return d % 2 ? lighten(C.stone, 0.62 + hash(x >> 2, y >> 2, 2) * 0.05) : mix(C.stone, C.band, 0.25); }
  if (s === 'stone') { const r0 = Math.floor(y / 11), sh = (r0 % 2) * 6, cell = hash(Math.floor((x + sh) / 13), r0, 5); if (y % 11 === 0 || (x + sh) % 13 === 0) return C.stoneD; return mix(C.stone, C.stoneL, 0.4 + cell * 0.6); }
  if (s === 'flag') { if (x % 16 === 0 || y % 16 === 0) return darken(C.stone, 0.55); return mix(darken(C.stone, 0.35), darken(C.stone, 0.22), hash(x >> 4, y >> 4, 3)); }
  // rough cave floor
  const n = hash(x >> 2, y >> 2, 7); return n > 0.93 ? darken(C.stone, 0.6) : mix(darken(C.stone, 0.42), darken(C.stone, 0.3), hash(x >> 3, y >> 3, 1));
}

function paintWallColumn(ctx, L, C, x) {
  const X = x * T, Y = L.top[x] * T, st = L.wallStyle;
  rect(ctx, X, Y, T, 48, C.wall);
  if (st === 'rock') {
    for (let j = 0; j < 46; j++) for (let i = 0; i < T; i++) {
      const gx = X + i, gy = Y + j, n = hash(gx >> 3, (gy + ((gx >> 3) % 2) * 4) >> 3, 11);
      let col = mix(C.wall, C.lower, n * 0.8);
      if ((gy + ((gx >> 3) % 2) * 4) % 8 === 0 && hash(gx >> 1, gy, 2) > 0.3) col = '#2f2c37';
      if (gx % 8 === 0 && hash(gx, gy >> 3, 6) > 0.5) col = '#34313c';
      px(ctx, gx, gy, col);
    }
    rect(ctx, X, Y + 46, T, 2, ink);
    return;
  }
  if (st === 'stripes') for (let i = 0; i < T; i += 4) rect(ctx, X + i, Y + 3, 2, 27, mix(C.wall, C.band, 0.1));
  if (st === 'tiles') for (let j = 4; j < 30; j += 6) { rect(ctx, X, Y + j, T, 1, darken(C.wall, 0.08)); for (let i = (j / 6) % 2 ? 0 : 4; i < T; i += 8) rect(ctx, X + i, Y + j, 1, 6, darken(C.wall, 0.08)); }
  if (st === 'brick') for (let j = 4; j < 30; j += 5) { rect(ctx, X, Y + j, T, 1, darken(C.wall, 0.12)); for (let i = (j / 5) % 2 ? 2 : 6; i < T; i += 8) rect(ctx, X + i, Y + j, 1, 5, darken(C.wall, 0.12)); }
  if (st === 'blocks') for (let j = 3; j < 30; j += 9) { rect(ctx, X, Y + j, T, 1, darken(C.wall, 0.1)); rect(ctx, X + ((j / 9) % 2 ? 0 : 8), Y + j, 1, 9, darken(C.wall, 0.1)); }
  rect(ctx, X, Y, T, 3, C.band);
  // lower band: panelling or plain
  if (st === 'panel') { rect(ctx, X, Y + 30, T, 16, C.wood); rect(ctx, X, Y + 30, T, 2, C.woodL); rect(ctx, X + 2, Y + 34, 12, 9, C.woodD); rect(ctx, X + 3, Y + 35, 10, 7, mix(C.wood, C.woodL, 0.4)); }
  else { rect(ctx, X, Y + 30, T, 16, C.lower); rect(ctx, X, Y + 30, T, 1, C.band); }
  rect(ctx, X, Y + 29, T, 1, C.trim === '#ffffff' ? darken(C.wall, 0.08) : mix(C.wall, C.trim, 0.5));
  rect(ctx, X, Y + 46, T, 2, ink);
}

function door(ctx, x, y, label) { // the lab door: the same everywhere
  rect(ctx, x - 1, y - 1, 16, 26, ink);
  rect(ctx, x, y, 14, 25, P.woodDark);
  rect(ctx, x + 1, y + 1, 12, 24, P.wood);
  rect(ctx, x + 6, y + 1, 1, 24, P.woodDark);
  px(ctx, x + 10, y + 13, P.gold);
  const lw = textWidth(label) + 4, lx = x + 7 - Math.ceil(lw / 2); rect(ctx, lx, y - 9, lw, 7, ink); drawText(ctx, label, lx + 2, y - 8, '#ffcf5a');
}

function paintBoard(ctx, L, C, place) { // the reading wall: the same everywhere, only its width follows the room
  const { x0, n, top } = L.board, X = x0 * T + 2, Y = top * T + 5, W = n * T - 4, dark = L.dark;
  rect(ctx, X, Y, W, 26, ink); rect(ctx, X + 1, Y + 1, W - 2, 24, dark ? '#1d1712' : '#fbf8ef'); rect(ctx, X + 1, Y + 1, W - 2, 4, C.band);
  const lw = W - 20;
  for (let k = 0; k < 5; k++) rect(ctx, X + 4, Y + 8 + k * 3, Math.max(6, Math.floor(lw * 0.45) + Math.floor(hash(k, place.order || 1, 8) * lw * 0.5)), 1, dark ? '#b8a988' : '#8f877a');
  rect(ctx, X + W - 14, Y + 8, 12, 10, C.band); rect(ctx, X + W - 13, Y + 9, 10, 8, dark ? '#3a2b1d' : '#ffffff');
  // the desk under it
  const dy = (top + 3) * T + 2;
  rect(ctx, x0 * T, dy, n * T, 12, ink); rect(ctx, x0 * T + 1, dy + 1, n * T - 2, 9, '#cfd4d6'); rect(ctx, x0 * T + 1, dy + 1, n * T - 2, 2, '#e9eeee');
  rect(ctx, x0 * T + 2, dy + 12, 3, 4, P.metalDark); rect(ctx, x0 * T + n * T - 5, dy + 12, 3, 4, P.metalDark);
}

function paintLabel(ctx, L, C) {
  const lb = L.label, cx = lb.x0 * T + (lb.n * T) / 2, wmax = Math.max(...lb.lines.map(textWidth));
  const nl = lb.lines.length, hgt = nl * 7 + 4, y = lb.top * T + (lb.band === 'up' ? [10, 7, 4][nl - 1] : 33 - (nl > 1 ? 4 : 0));
  rect(ctx, Math.round(cx - wmax / 2 - 4), y, wmax + 8, hgt, ink);
  rect(ctx, Math.round(cx - wmax / 2 - 3), y + 1, wmax + 6, hgt - 2, C.band);
  lb.lines.forEach((s, i) => drawText(ctx, s, Math.round(cx - textWidth(s) / 2), y + 3 + i * 7, '#ffffff'));
}

function paintWindow(ctx, X, Y, n) {
  const W = n * T - 6;
  box(ctx, X + 3, Y + 7, W, 22, '#e9e2c9');
  rect(ctx, X + 5, Y + 9, W - 4, 18, '#16213f');
  for (let k = 0; k < 7; k++) px(ctx, X + 6 + Math.floor(hash(X, k, 3) * (W - 6)), Y + 10 + Math.floor(hash(k, Y, 5) * 14), k % 3 ? '#9fb3d9' : '#ffffff');
  ellipse(ctx, X + W - 4, Y + 13, 2, 2, '#f3ead6'); px(ctx, X + W - 5, Y + 12, '#16213f');
  rect(ctx, X + 3 + Math.floor(W / 2), Y + 9, 1, 18, '#e9e2c9'); rect(ctx, X + 5, Y + 18, W - 4, 1, '#e9e2c9');
  rect(ctx, X + 1, Y + 29, W + 4, 3, ink); rect(ctx, X + 2, Y + 29, W + 2, 2, '#e9e2c9');
}

function paintDecor(ctx, L, C, d) {
  const X = d.x * T, Y = d.top * T, n = d.n;
  if (d.type === 'window') return paintWindow(ctx, X, Y, n);
  if (d.type === 'chart') { box(ctx, X + 3, Y + 6, n * T - 6, 20, '#fbf8ef'); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) rect(ctx, X + 6 + i * 6, Y + 9 + j * 5, 4, 3, [C.band, '#4fd1c5', '#ff7a6b', '#ffcf5a'][(i + j) % 4]); return; }
  if (d.type === 'starchart') { box(ctx, X + 3, Y + 5, n * T - 6, 22, '#1c2a52'); for (let k = 0; k < 9; k++) px(ctx, X + 5 + Math.floor(hash(k, X, 2) * (n * T - 10)), Y + 7 + Math.floor(hash(X, k, 4) * 18), '#ffffff'); rect(ctx, X + 8, Y + 12, 10, 1, '#5a7ec4'); rect(ctx, X + 17, Y + 12, 1, 8, '#5a7ec4'); ellipse(ctx, X + n * T - 10, Y + 16, 4, 4, '#2c4580'); rect(ctx, X + n * T - 14, Y + 16, 9, 1, '#9fb3d9'); return; }
  if (d.type === 'lightbox') { box(ctx, X + 3, Y + 6, n * T - 6, 20, '#d9f4f7'); rect(ctx, X + 6, Y + 9, 10, 14, '#2b3a44'); ellipse(ctx, X + 11, Y + 15, 3, 4, '#a9c6cc'); rect(ctx, X + 19, Y + 9, 8, 14, '#2b3a44'); rect(ctx, X + 22, Y + 11, 2, 10, '#c7dfe3'); return; }
  if (d.type === 'portrait') { box(ctx, X + 3, Y + 7, 10, 13, P.gold); rect(ctx, X + 5, Y + 9, 6, 9, darken(C.band, 0.2)); ellipse(ctx, X + 8, Y + 12, 2, 2, '#f3c99b'); rect(ctx, X + 6, Y + 15, 4, 3, C.wood); return; }
  if (d.type === 'clock') { ellipse(ctx, X + 8, Y + 15, 6, 6, ink); ellipse(ctx, X + 8, Y + 15, 5, 5, '#fbf8ef'); rect(ctx, X + 8, Y + 11, 1, 4, ink); rect(ctx, X + 8, Y + 15, 3, 1, ink); return; }
  if (d.type === 'banner') { rect(ctx, X + 2, Y + 4, 12, 1, C.woodD); rect(ctx, X + 3, Y + 5, 10, 22, ink); rect(ctx, X + 4, Y + 5, 8, 20, C.band); for (let i = 0; i < 4; i++) { px(ctx, X + 4 + i * 2, Y + 25 + (i % 2), ink); } rect(ctx, X + 6, Y + 10, 4, 4, C.accent); rect(ctx, X + 4, Y + 6, 8, 1, lighten(C.band, 0.3)); }
}

// ---- furniture painters: (ctx, x, y, w, h, piece, C) with x, y the footprint's top-left in pixels;
// a piece is drawn upward from the bottom of its footprint (bottom = y + h).
function legs(ctx, x, b, w, col) { rect(ctx, x + 2, b - 6, 2, 6, col); rect(ctx, x + w - 4, b - 6, 2, 6, col); }
function table(ctx, x, b, w, top, edge) { legs(ctx, x, b - 1, w, edge); rect(ctx, x, b - 14, w, 9, ink); rect(ctx, x + 1, b - 13, w - 2, 6, top); rect(ctx, x + 1, b - 13, w - 2, 1, lighten(top, 0.3)); rect(ctx, x + 1, b - 7, w - 2, 1, darken(top, 0.25)); }
const PAINT = {
  bench(ctx, x, b, w, it, C) {
    rect(ctx, x, b - 18, w, 18, ink); rect(ctx, x + 1, b - 17, w - 2, 16, '#cfd4d6'); rect(ctx, x + 1, b - 17, w - 2, 3, '#eef2f2');
    for (let i = 0; i < w / 16; i++) { rect(ctx, x + 3 + i * 16, b - 11, 10, 8, '#b5bcc0'); px(ctx, x + 8 + i * 16, b - 7, P.metalDark); }
    // flasks and a microscope on top
    box(ctx, x + 4, b - 24, 5, 8, '#8fc9e0'); rect(ctx, x + 5, b - 20, 3, 3, '#4fd1c5');
    box(ctx, x + 11, b - 22, 4, 6, '#8fc9e0'); rect(ctx, x + 12, b - 19, 2, 2, '#ff7a6b');
    rect(ctx, x + w - 12, b - 26, 3, 10, ink); rect(ctx, x + w - 14, b - 18, 8, 2, ink); rect(ctx, x + w - 11, b - 28, 4, 3, P.metal);
  },
  cabinet(ctx, x, b, w, it, C) {
    box(ctx, x + 1, b - 34, 14, 33, C.woodD === '#000' ? '#888' : '#dfe6ea'); rect(ctx, x + 3, b - 32, 10, 13, '#8fc9e0'); rect(ctx, x + 3, b - 18, 10, 13, '#8fc9e0');
    rect(ctx, x + 3, b - 26, 10, 1, '#5d6670'); rect(ctx, x + 3, b - 12, 10, 1, '#5d6670');
    for (let i = 0; i < 3; i++) { rect(ctx, x + 4 + i * 3, b - 30 + (i % 2), 2, 4, ['#ff7a6b', '#ffcf5a', '#4fd1c5'][i]); rect(ctx, x + 4 + i * 3, b - 16 + ((i + 1) % 2), 2, 4, ['#9a6ad1', '#4fd1c5', '#ff7a6b'][i]); }
    rect(ctx, x + 2, b - 3, 12, 2, '#5d6670');
  },
  labtable(ctx, x, b, w, it, C) {
    table(ctx, x, b, w, '#cfd4d6', P.metalDark);
    box(ctx, x + 5, b - 21, 5, 8, '#8fc9e0'); rect(ctx, x + 6, b - 17, 3, 3, it.v % 2 ? '#ffcf5a' : '#4fd1c5');
    rect(ctx, x + 14, b - 19, 8, 6, ink); rect(ctx, x + 15, b - 18, 6, 4, '#3d434b'); px(ctx, x + 17, b - 17, '#4fd1c5');
    box(ctx, x + w - 8, b - 20, 4, 7, '#8fc9e0'); rect(ctx, x + w - 7, b - 16, 2, 2, '#ff7a6b');
  },
  computer(ctx, x, b, w, it, C) {
    table(ctx, x, b, w, C.woodL, C.woodD);
    box(ctx, x + 5, b - 28, 18, 13, '#2b3346'); rect(ctx, x + 7, b - 26, 14, 9, '#16213f');
    for (let i = 0; i < 12; i++) px(ctx, x + 8 + i, b - 21 - Math.round(Math.sin((i + it.v) * 0.9) * 2), '#4fd1c5');
    rect(ctx, x + 12, b - 15, 4, 2, ink); rect(ctx, x + 22, b - 16, 6, 2, '#cfd4d6');
  },
  bottle(ctx, x, b, w, it, C) {
    box(ctx, x + 4, b - 22, 8, 21, it.v % 2 ? '#3c5ea6' : '#2a8c87'); rect(ctx, x + 6, b - 25, 4, 4, ink); rect(ctx, x + 6, b - 24, 4, 2, P.metal); rect(ctx, x + 5, b - 18, 6, 4, '#e9e2c9');
  },
  shelf(ctx, x, b, w, it, C) {
    box(ctx, x, b - 38, w, 37, C.woodD); rect(ctx, x + 2, b - 36, w - 4, 33, darken(C.wood, 0.55));
    for (let s = 0; s < 3; s++) {
      const sy = b - 36 + s * 11;
      for (let i = 0, bx = x + 2; bx < x + w - 3; i++) { const bw = 2 + Math.floor(hash(i, s, it.v) * 2), bh = 6 + Math.floor(hash(s, i, it.v + 1) * 3); rect(ctx, bx, sy + 10 - bh, bw, bh, ['#b9463b', '#3c5ea6', '#2f5d50', '#d9a441', '#6b4fa0', '#e9e2c9'][Math.floor(hash(i, s, it.v + 2) * 6)]); bx += bw + (hash(i, s, 5) > 0.8 ? 2 : 0); }
      rect(ctx, x + 1, sy + 10, w - 2, 1, C.wood);
    }
    rect(ctx, x, b - 38, w, 2, C.woodL);
  },
  shelf1(ctx, x, b, w, it, C) { PAINT.shelf(ctx, x, b, w, it, C); },
  drawers(ctx, x, b, w, it, C) {
    box(ctx, x + 1, b - 28, 14, 27, C.wood); rect(ctx, x + 1, b - 28, 14, 2, C.woodL);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) { rect(ctx, x + 3 + i * 6, b - 24 + j * 6, 5, 5, C.woodD); rect(ctx, x + 4 + i * 6, b - 23 + j * 6, 3, 3, C.woodL); px(ctx, x + 5 + i * 6, b - 22 + j * 6, P.gold); }
  },
  readtable(ctx, x, b, w, it, C) {
    table(ctx, x, b, w, C.woodL, C.woodD);
    rect(ctx, x + 6, b - 16, 12, 6, ink); rect(ctx, x + 7, b - 16, 5, 5, '#fbf8ef'); rect(ctx, x + 12, b - 16, 5, 5, '#f0e8d4'); rect(ctx, x + 8, b - 14, 3, 1, '#8f877a'); rect(ctx, x + 13, b - 14, 3, 1, '#8f877a');
    rect(ctx, x + w - 8, b - 21, 3, 7, '#f5f1e6'); px(ctx, x + w - 7, b - 23, '#ffcf5a'); px(ctx, x + w - 7, b - 22, '#ffb347');
  },
  crates(ctx, x, b, w, it, C) {
    box(ctx, x + 1, b - 12, 14, 11, C.wood); rect(ctx, x + 2, b - 7, 12, 1, C.woodD); box(ctx, x + 3, b - 21, 10, 10, C.woodL); rect(ctx, x + 4, b - 16, 8, 1, C.woodD);
  },
  longtable(ctx, x, b, w, it, C) {
    // chairs behind the table
    for (let i = 8; i < w - 6; i += 16) { box(ctx, x + i, b - 22, 8, 10, C.woodD); }
    table(ctx, x, b, w, C.woodL, C.woodD);
    rect(ctx, x + 4, b - 12, w - 8, 2, C.band);
    for (let i = 10; i < w - 6; i += 16) { ellipse(ctx, x + i, b - 11, 3, 1, '#f5f1e6'); }
    rect(ctx, x + w / 2 - 1, b - 20, 2, 7, '#f5f1e6'); px(ctx, x + w / 2 - 1, b - 22, '#ffcf5a');
  },
  seat(ctx, x, b, w, it, C) { rect(ctx, x + 1, b - 16, w - 2, 8, ink); rect(ctx, x + 2, b - 15, w - 4, 6, C.wood); rect(ctx, x + 1, b - 9, w - 2, 4, ink); rect(ctx, x + 2, b - 8, w - 4, 2, C.woodL); legs(ctx, x, b - 1, w, C.woodD); },
  candelabra(ctx, x, b, w, it, C) {
    rect(ctx, x + 5, b - 4, 6, 3, ink); rect(ctx, x + 7, b - 24, 2, 21, '#c9a440'); rect(ctx, x + 3, b - 22, 10, 2, '#c9a440');
    for (const i of [3, 7, 11]) { rect(ctx, x + i, b - 27, 2, 5, '#f5f1e6'); px(ctx, x + i, b - 29, '#ffe58a'); px(ctx, x + i + 1, b - 28, '#ffb347'); }
  },
  chest(ctx, x, b, w, it, C) { box(ctx, x + 1, b - 14, 14, 13, C.wood); rect(ctx, x + 2, b - 13, 12, 3, C.woodL); rect(ctx, x + 1, b - 9, 14, 1, ink); rect(ctx, x + 7, b - 10, 2, 3, P.gold); },
  easel(ctx, x, b, w, it, C) {
    rect(ctx, x + 3, b - 30, 2, 30, C.woodD); rect(ctx, x + 11, b - 30, 2, 30, C.woodD); rect(ctx, x + 7, b - 32, 2, 28, C.wood);
    box(ctx, x + 1, b - 30, 14, 14, '#fbf8ef'); rect(ctx, x + 3, b - 26, 5, 5, ['#ff7a6b', '#4fd1c5', '#ffcf5a'][it.v % 3]); ellipse(ctx, x + 10, b - 21, 2, 2, C.band);
    rect(ctx, x + 1, b - 16, 14, 2, C.wood);
  },
  examtable(ctx, x, b, w, it, C) {
    legs(ctx, x, b - 1, w, P.metalDark); rect(ctx, x, b - 14, w, 8, ink); rect(ctx, x + 1, b - 13, w - 2, 5, mix(C.band, '#ffffff', 0.35)); rect(ctx, x + 2, b - 13, 7, 4, '#ffffff');
    rect(ctx, x + w - 4, b - 26, 2, 13, P.metalDark); rect(ctx, x + w - 9, b - 27, 7, 3, ink); rect(ctx, x + w - 8, b - 26, 5, 1, '#fff1c4');
  },
  screen(ctx, x, b, w, it, C) { for (let i = 0; i < 3; i++) { box(ctx, x + 1 + i * 10, b - 29, 10, 28, i % 2 ? mix(C.band, '#ffffff', 0.55) : mix(C.band, '#ffffff', 0.4)); } },
  stool(ctx, x, b, w, it, C) { rect(ctx, x + 4, b - 6, 2, 6, C.woodD); rect(ctx, x + 10, b - 6, 2, 6, C.woodD); rect(ctx, x + 3, b - 11, 10, 5, ink); rect(ctx, x + 4, b - 10, 8, 3, C.woodL); },
  charttable(ctx, x, b, w, it, C) {
    table(ctx, x, b, w, C.woodL, C.woodD);
    rect(ctx, x + 4, b - 14, w - 8, 6, '#efe2bf'); rect(ctx, x + 7, b - 13, 6, 3, '#9fc79a'); rect(ctx, x + 16, b - 12, 8, 2, '#8fc9e0'); px(ctx, x + 20, b - 13, '#b9463b');
  },
  globe(ctx, x, b, w, it, C) {
    rect(ctx, x + 5, b - 3, 6, 2, ink); rect(ctx, x + 7, b - 10, 2, 8, C.woodD);
    ellipse(ctx, x + 8, b - 17, 6, 6, ink); ellipse(ctx, x + 8, b - 17, 5, 5, '#3a88b3'); rect(ctx, x + 5, b - 20, 4, 3, '#67a952'); rect(ctx, x + 9, b - 15, 3, 2, '#67a952');
    rect(ctx, x + 1, b - 18, 1, 4, '#c9a440'); rect(ctx, x + 14, b - 18, 1, 4, '#c9a440');
  },
  scope(ctx, x, b, w, it, C) {
    rect(ctx, x + 3, b - 10, 1, 9, C.woodD); rect(ctx, x + 12, b - 10, 1, 9, C.woodD); rect(ctx, x + 7, b - 12, 2, 11, C.woodD);
    for (let i = 0; i < 9; i++) rect(ctx, x + 2 + i, b - 14 - i * 2, 4, 3, i > 6 ? ink : '#c9a440');
    rect(ctx, x + 1, b - 13, 3, 3, ink);
  },
  rock(ctx, x, b, w, it, C) { ellipse(ctx, x + 8, b - 6, 7, 5, ink); ellipse(ctx, x + 8, b - 7, 6, 4, '#5f5a68'); ellipse(ctx, x + 6, b - 8, 3, 2, '#77717f'); },
  rock2(ctx, x, b, w, it, C) { ellipse(ctx, x + 12, b - 8, 11, 7, ink); ellipse(ctx, x + 12, b - 9, 10, 6, '#5a5563'); ellipse(ctx, x + 22, b - 6, 7, 5, ink); ellipse(ctx, x + 22, b - 6, 6, 4, '#66606f'); ellipse(ctx, x + 9, b - 12, 4, 2, '#77717f'); },
  stalagmite(ctx, x, b, w, it, C) { for (let j = 0; j < 26; j++) { const hw = Math.max(1, Math.round(6 * (j / 26))); rect(ctx, x + 8 - hw - 1, b - 27 + j, hw * 2 + 2, 1, ink); rect(ctx, x + 8 - hw, b - 27 + j, hw * 2, 1, j % 6 < 3 ? '#625d6a' : '#575260'); } rect(ctx, x + 7, b - 24, 1, 14, '#7a7484'); },
  crystal(ctx, x, b, w, it, C) {
    const cols = it.v % 2 ? ['#4fd1c5', '#a8f0e8', '#2a8c87'] : ['#9a6ad1', '#d6c2f2', '#6b4fa0'];
    ellipse(ctx, x + 8, b - 3, 6, 2, '#2b2833');
    for (const [dx, hgt, wd] of [[-4, 14, 3], [0, 22, 4], [4, 16, 3]]) { rect(ctx, x + 8 + dx - wd / 2 - 1, b - hgt - 2, wd + 2, hgt, ink); rect(ctx, x + 8 + dx - wd / 2, b - hgt - 1, wd, hgt - 2, cols[0]); rect(ctx, x + 8 + dx - wd / 2, b - hgt - 1, 1, hgt - 3, cols[1]); px(ctx, x + 8 + dx - wd / 2, b - hgt - 3, ink); }
  },
  plant(ctx, x, b, w, it, C) {
    if (it.v % 3 === 0) { // tall leafy plant
      rect(ctx, x + 4, b - 8, 8, 7, ink); rect(ctx, x + 5, b - 7, 6, 6, '#8c4a3a'); rect(ctx, x + 5, b - 7, 6, 1, '#a85b49');
      for (const [dx, dy, r1] of [[0, 14, 4], [-3, 10, 3], [3, 11, 3], [0, 19, 3]]) ellipse(ctx, x + 8 + dx, b - dy, r1, r1 - 1, P.grassDark);
      ellipse(ctx, x + 7, b - 16, 2, 2, P.grassLight); ellipse(ctx, x + 10, b - 11, 2, 1, P.grassLight);
      return;
    }
    rect(ctx, x + 4, b - 8, 8, 7, '#8c4a3a'); rect(ctx, x + 4, b - 8, 8, 2, '#a85b49');
    ellipse(ctx, x + 8, b - 11, 6, 5, P.grassDark); ellipse(ctx, x + 6, b - 13, 3, 3, P.grassLight); ellipse(ctx, x + 10, b - 10, 3, 2, P.grassLight);
  },
};

// The signature object: big, 2 tiles wide, drawn up to 52 px tall.
function paintSignature(ctx, L, C, s) {
  const x = s.x * T, b = (s.y + 1) * T - 1, w = 32, acc = C.accent;
  const emblemBox = (ex, ey, bg) => { box(ctx, ex, ey, 29, 29, bg); drawEmblem(ctx, s.emblem, ex + 1, ey + 1, 3, darken(acc, 0.45)) ; return drawEmblem(ctx, s.emblem, ex + 1, ey, 3, acc); };
  if (s.emblem) {
    if (s.form === 'pedestal') {
      box(ctx, x + 6, b - 18, 20, 18, C.stoneL); rect(ctx, x + 7, b - 17, 18, 2, lighten(C.stone, 0.55)); rect(ctx, x + 4, b - 4, 24, 4, ink); rect(ctx, x + 5, b - 3, 22, 2, C.stone);
      rect(ctx, x + 10, b - 13, 12, 6, darken(C.stoneL, 0.12));
      if (emblemBox(x + 2, b - 49, darken(C.band, 0.45))) return;
    } else if (s.form === 'case') {
      box(ctx, x + 1, b - 14, 30, 14, C.woodD); rect(ctx, x + 2, b - 13, 28, 2, C.woodL);
      box(ctx, x + 2, b - 46, 28, 33, '#bfe3ee'); rect(ctx, x + 3, b - 45, 26, 31, '#2a3352');
      if (drawEmblem(ctx, s.emblem, x + 3, b - 42, 3, acc)) { rect(ctx, x + 4, b - 44, 1, 28, 'rgba(255,255,255,0.35)'); rect(ctx, x + 27, b - 44, 1, 10, 'rgba(255,255,255,0.25)'); return; }
    } else {
      rect(ctx, x + 3, b - 51, 2, 51, C.woodD); rect(ctx, x + 27, b - 51, 2, 51, C.woodD); rect(ctx, x + 2, b - 52, 28, 3, ink); rect(ctx, x + 3, b - 51, 26, 1, C.woodL);
      rect(ctx, x + 5, b - 49, 22, 38, ink); rect(ctx, x + 6, b - 49, 20, 36, C.band);
      for (let i = 0; i < 5; i++) px(ctx, x + 6 + i * 4, b - 13 + (i % 2), ink);
      if (drawEmblem(ctx, s.emblem, x + 7, b - 42, 2, acc)) { rect(ctx, x + 6, b - 47, 20, 1, lighten(C.band, 0.35)); return; }
    }
  }
  const o = s.object;
  if (o === 'orrery') {
    box(ctx, x + 6, b - 9, 20, 9, C.woodD); rect(ctx, x + 7, b - 8, 18, 2, C.woodL); rect(ctx, x + 14, b - 31, 4, 23, ink); rect(ctx, x + 15, b - 30, 2, 22, '#c9a440');
    ellipse(ctx, x + 16, b - 34, 14, 5, '#c9a440'); ellipse(ctx, x + 16, b - 34, 13, 4, darken(C.band, 0.6));
    ellipse(ctx, x + 16, b - 35, 6, 6, ink); ellipse(ctx, x + 16, b - 35, 5, 5, '#ffcf5a'); px(ctx, x + 15, b - 37, '#fff1c4');
    ellipse(ctx, x + 4, b - 34, 2, 2, '#4fd1c5'); ellipse(ctx, x + 27, b - 33, 2, 2, '#ff7a6b'); ellipse(ctx, x + 22, b - 41, 2, 2, '#9a6ad1');
    rect(ctx, x + 6, b - 46, 20, 1, '#c9a440'); ellipse(ctx, x + 8, b - 46, 2, 2, '#e9e2c9');
  } else if (o === 'bigglobe') {
    box(ctx, x + 9, b - 6, 14, 6, C.woodD); rect(ctx, x + 15, b - 14, 2, 9, C.woodD);
    ellipse(ctx, x + 16, b - 31, 15, 15, ink); ellipse(ctx, x + 16, b - 31, 14, 14, '#3a88b3'); ellipse(ctx, x + 12, b - 34, 6, 5, '#67a952'); ellipse(ctx, x + 21, b - 26, 4, 5, '#67a952'); ellipse(ctx, x + 10, b - 38, 3, 2, '#9ad0e6');
    for (let a = 0; a < 40; a++) { const t = (a / 40) * Math.PI; px(ctx, x + 16 + Math.round(Math.cos(t) * 17), b - 31 - Math.round(Math.sin(t) * 17), '#c9a440'); }
  } else if (o === 'bigcrystal') {
    ellipse(ctx, x + 16, b - 3, 14, 3, '#2b2833');
    for (const [dx, hgt, wd, c] of [[-9, 22, 5, 0], [0, 44, 8, 1], [9, 28, 6, 0], [5, 16, 4, 1]]) {
      const cs = c ? ['#4fd1c5', '#c6fbf4', '#2a8c87'] : ['#9a6ad1', '#e1d1f7', '#6b4fa0'];
      rect(ctx, x + 16 + dx - wd / 2 - 1, b - hgt - 1, wd + 2, hgt - 1, ink); rect(ctx, x + 16 + dx - wd / 2, b - hgt, wd, hgt - 3, cs[0]);
      rect(ctx, x + 16 + dx - wd / 2, b - hgt, 2, hgt - 4, cs[1]); rect(ctx, x + 16 + dx + wd / 2 - 1, b - hgt + 2, 1, hgt - 6, cs[2]);
      rect(ctx, x + 16 + dx - wd / 2 + 1, b - hgt - 3, wd - 2, 2, ink); rect(ctx, x + 16 + dx - wd / 2 + 2, b - hgt - 2, wd - 4, 1, cs[1]);
    }
  } else if (o === 'clock') {
    box(ctx, x + 7, b - 52, 18, 52, C.woodD); rect(ctx, x + 8, b - 51, 16, 2, C.woodL);
    ellipse(ctx, x + 16, b - 41, 7, 7, ink); ellipse(ctx, x + 16, b - 41, 6, 6, '#fbf8ef'); rect(ctx, x + 16, b - 46, 1, 5, ink); rect(ctx, x + 16, b - 41, 4, 1, ink);
    rect(ctx, x + 11, b - 31, 10, 24, darken(C.wood, 0.6)); rect(ctx, x + 15, b - 31, 2, 16, '#c9a440'); ellipse(ctx, x + 16, b - 13, 3, 3, '#c9a440');
  } else if (o === 'tree') {
    box(ctx, x + 6, b - 14, 20, 14, C.stoneL); rect(ctx, x + 7, b - 13, 18, 2, lighten(C.stone, 0.55));
    rect(ctx, x + 14, b - 30, 4, 17, C.woodD); rect(ctx, x + 10, b - 26, 5, 2, C.woodD);
    for (const [dx, dy, rr] of [[0, 38, 11], [-8, 32, 7], [8, 33, 8], [-3, 45, 7], [6, 44, 6]]) ellipse(ctx, x + 16 + dx, b - dy, rr + 1, rr, ink);
    for (const [dx, dy, rr] of [[0, 38, 10], [-8, 32, 6], [8, 33, 7], [-3, 45, 6], [6, 44, 5]]) ellipse(ctx, x + 16 + dx, b - dy, rr, rr - 1, P.grassDark);
    for (const [dx, dy] of [[-4, 41], [4, 36], [-9, 33], [2, 46]]) ellipse(ctx, x + 16 + dx, b - dy, 2, 2, P.grassLight);
    for (const [dx, dy] of [[5, 40], [-6, 37], [9, 31]]) px(ctx, x + 16 + dx, b - dy, '#ff7a6b');
  } else if (o === 'prism') {
    box(ctx, x + 4, b - 8, 24, 8, C.stoneL);
    for (let j = 0; j < 30; j++) { const hw = Math.round(12 * (j / 30)); rect(ctx, x + 16 - hw - 1, b - 39 + j, hw * 2 + 2, 1, ink); rect(ctx, x + 16 - hw, b - 39 + j, hw * 2, 1, j < 3 ? '#ffffff' : '#bfe3ee'); }
    rect(ctx, x + 13, b - 32, 2, 18, '#e8f6fb');
    ['#e0574f', '#f2c94c', '#67a952', '#3a88b3', '#9a6ad1'].forEach((c, i) => rect(ctx, x + 22 + i, b - 22 + i, 9 - i, 1, c));
    rect(ctx, x, b - 25, 10, 1, '#fff1c4');
  } else {
    // hourglass
    box(ctx, x + 6, b - 6, 20, 6, C.woodD); box(ctx, x + 6, b - 50, 20, 6, C.woodD);
    rect(ctx, x + 8, b - 44, 2, 38, C.woodD); rect(ctx, x + 22, b - 44, 2, 38, C.woodD);
    for (let j = 0; j < 38; j++) { const hw = 1 + Math.round(5 * Math.abs(j - 19) / 19); rect(ctx, x + 16 - hw, b - 44 + j, hw * 2, 1, (j > 8 && j < 19) || j > 30 ? '#e7c873' : '#d9f0f7'); }
    rect(ctx, x + 16, b - 25, 1, 6, '#e7c873');
  }
}

function paintBackground(ctx, L, place) {
  const C = palette(L), { w, h } = L;
  // walls
  for (let x = 0; x < w; x++) paintWallColumn(ctx, L, C, x);
  // floor
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (cellAt(L, x, y) !== 'floor') continue;
    for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) px(ctx, x * T + i, y * T + j, floorColour(L, C, x * T + i, y * T + j));
  }
  // raised platform: planks (or rock) with a border of the house colour and a step at the front
  if (L.dais) {
    const [p0, p1, r0, r1] = L.dais, X = p0 * T, Y = r0 * T, W = (p1 - p0 + 1) * T, H = (r1 - r0 + 1) * T - 5;
    const cave = L.kind === 'cave', top = cave ? darken(C.stone, 0.15) : C.woodL, seam = cave ? darken(C.stone, 0.4) : C.wood;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) px(ctx, X + i, Y + j, j % 6 === 5 || (i + (Math.floor(j / 6) % 2) * 12) % 24 === 0 ? seam : mix(top, seam, hash(Math.floor((i + (Math.floor(j / 6) % 2) * 12) / 24), Math.floor(j / 6), 7) * 0.35));
    rect(ctx, X + 3, Y + 2, W - 6, H - 4, mix(C.band, ink, 0.1)); rect(ctx, X + 4, Y + 3, W - 8, H - 6, C.band);
    rect(ctx, X + 5, Y + 4, W - 10, 1, lighten(C.band, 0.25)); for (let i = X + 8; i < X + W - 8; i += 6) px(ctx, i, Y + H - 5, C.accent);
    rect(ctx, X - 1, Y, 1, H + 5, ink); rect(ctx, X + W, Y, 1, H + 5, ink);
    rect(ctx, X - 1, Y + H, W + 2, 1, ink); rect(ctx, X, Y + H + 1, W, 3, cave ? darken(C.stone, 0.45) : C.woodD); rect(ctx, X - 1, Y + H + 4, W + 2, 1, ink);
    ctx.fillStyle = 'rgba(20,18,40,0.18)'; ctx.fillRect(X, Y + H + 5, W, 3);
  }
  // rugs
  for (const g of L.rugs) {
    const X = g.x * T + 3, Y = g.y * T + 3, W = g.w * T - 6, H = g.h * T - 6, base = g.style === 1 ? darken(C.band, 0.15) : g.style === 2 ? mix(C.accent, '#b9463b', 0.5) : mix(C.band, '#ffffff', 0.15);
    rect(ctx, X, Y, W, H, ink); rect(ctx, X + 1, Y + 1, W - 2, H - 2, base);
    rect(ctx, X + 3, Y + 3, W - 6, H - 6, C.accent); rect(ctx, X + 4, Y + 4, W - 8, H - 8, base);
    for (let i = X + 8; i < X + W - 8; i += 6) for (let j = Y + 8; j < Y + H - 8; j += 6) px(ctx, i, j, mix(base, C.accent, 0.5));
    for (let i = X + 1; i < X + W - 1; i += 2) { px(ctx, i, Y - 1, '#e9e2c9'); px(ctx, i, Y + H, '#e9e2c9'); }
  }
  // night light from the windows, on the floor
  for (const d of L.wall) if (d.type === 'window') {
    const fy = (d.top + 3) * T;
    for (let j = 0; j < 22; j++) { ctx.fillStyle = `rgba(170,205,255,${0.1 - j * 0.004})`; ctx.fillRect(d.x * T + 4 + Math.round(j * 0.4), fy + j, d.n * T - 8, 1); }
  }
  // shadow along the back wall, edges of the walls and side walls
  for (let x = 0; x < w; x++) {
    const fy = (L.top[x] + 3) * T;
    for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgba(20,18,40,${0.18 - k * 0.03})`; ctx.fillRect(x * T, fy + k, T, 1); }
    for (const s of [-1, 1]) { // a deeper neighbour: draw the return of this wall
      const n = x + s; if (n < 0 || n >= w) continue;
      if (L.top[n] < L.top[x]) { const X = s < 0 ? x * T : x * T + T - 1; rect(ctx, X, L.top[x] * T, 1, 48, ink); ctx.fillStyle = 'rgba(20,18,40,0.22)'; ctx.fillRect(s < 0 ? x * T - 4 : x * T + T, (L.top[n] + 3) * T, 4, (L.top[x] - L.top[n]) * T); }
    }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (cellAt(L, x, y) !== 'floor') continue;
    for (const s of [-1, 1]) {
      const c = cellAt(L, x + s, y); if (c === 'floor' || c === 'wall') continue;
      const X = s < 0 ? x * T : x * T + T - 4;
      rect(ctx, X, y * T, 4, T, darken(C.front, 0.25)); rect(ctx, s < 0 ? X + 3 : X, y * T, 1, T, mix(C.front, '#ffffff', 0.2)); rect(ctx, s < 0 ? X : X + 3, y * T, 1, T, ink);
    }
  }
  // front wall with the exit mat
  for (let x = 0; x < w; x++) {
    const Y = L.bot[x] * T;
    rect(ctx, x * T, Y, T, T, C.front); rect(ctx, x * T, Y, T, 2, ink); rect(ctx, x * T, Y + T - 1, T, 1, darken(C.front, 0.4));
    if (cellAt(L, x - 1, L.bot[x]) !== 'front' && cellAt(L, x - 1, L.bot[x]) !== 'floor') rect(ctx, x * T, Y, 1, T, ink);
    if (cellAt(L, x + 1, L.bot[x]) !== 'front' && cellAt(L, x + 1, L.bot[x]) !== 'floor') rect(ctx, x * T + T - 1, Y, 1, T, ink);
  }
  for (let x = 0; x < w; x++) { // wall edges against empty space
    for (const s of [-1, 1]) if (['void', 'out'].includes(cellAt(L, x + s, L.top[x]))) rect(ctx, s < 0 ? x * T : x * T + T - 1, L.top[x] * T, 1, 48, ink);
    rect(ctx, x * T, L.top[x] * T, T, 1, ink);
  }
  const [ex, ey] = L.exit, mx = ex * T, my = ey * T;
  rect(ctx, mx, my + 1, 16, 15, '#3a3f6b'); rect(ctx, mx + 1, my + 2, 14, 13, '#c9563f');
  for (let y = my + 4; y < my + 14; y += 3) rect(ctx, mx + 3, y, 10, 1, '#e7a34f');
  // the back wall: lab door, reading wall, the concept, the number, decoration, torches
  door(ctx, L.lab[0] * T + 1, L.top[L.lab[0]] * T + 22, 'LAB');
  paintBoard(ctx, L, C, place);
  paintLabel(ctx, L, C);
  if (L.number) { const num = String(place.order || ''), X = L.number.x * T + 1, Y = L.number.top * T + 8; rect(ctx, X, Y, 14, 13, ink); rect(ctx, X + 1, Y + 1, 12, 11, P.gold); drawText(ctx, num, X + 7 - textWidth(num) / 2, Y + 4, ink); }
  for (const d of L.wall) paintDecor(ctx, L, C, d);
  for (const [x, y] of L.torches) { rect(ctx, x - 1, y + 3, 3, 6, '#2a2018'); rect(ctx, x - 2, y + 2, 5, 2, '#5a4a36'); rect(ctx, x, y + 9, 1, 3, '#2a2018'); }
}

// The room description the scene uses. Tall furniture comes as separate pieces ("props") so that
// the player can walk behind it.
export function generateRoom(place) {
  const L = planRoom(place), C = palette(L);
  const props = L.items.map((it) => {
    const w = it.fw * T, b = (it.y + it.fh) * T, top = b - Math.max(it.ph, it.fh * T) - 2;
    return {
      x: it.x * T - 2, y: top, w: w + 4, h: b - top, depth: b - 0.5,
      paint(ctx) { ctx.save(); ctx.translate(-(it.x * T - 2), -top); if (it.type === 'sig') paintSignature(ctx, L, C, it); else PAINT[it.type](ctx, it.x * T, b, w, it, C); ctx.restore(); },
    };
  });
  const sg = L.sig;
  if (sg && (sg.emblem || ['bigcrystal', 'prism', 'orrery'].includes(sg.object))) L.glows.push([sg.x * T + 16, (sg.y + 1) * T - 34, sg.object === 'bigcrystal' && !sg.emblem ? 'glow-teal' : 'glow', 0.6, 'signature']);
  return {
    generated: true, plan: L.plan, layout: L,
    w: L.w, h: L.h, blocked: L.blocked, lab: L.lab, exhibit: L.exhibit, master: L.master, exit: L.exit, start: L.start,
    labGlow: L.glows.find((g) => g[4] === 'door'), glows: L.glows.filter((g) => g[4] !== 'door'),
    torches: L.torches.length ? L.torches : null, dark: L.dark, step: L.step, props,
    paint(ctx) { paintBackground(ctx, L, place); },
  };
}
