// Where obstacles go. Pure data, Node-safe, deterministic (seeded by the course id).
// HARD RULE: an obstacle never blocks anything the course needs. It stands only at the mouth of an
// OPTIONAL place: a dead-end nook the town already has (between trees, rocks or water), a tiny
// hedged garden added for it, or a cellar hatch beside a house; inside, a small door on a room's
// back wall. Every candidate is accepted only if no tile the player could reach before gets one
// step farther (checkObstacles in ../plan.js re-checks it from scratch).
import { seeded } from '../../gen/core.js';
import { N4, distances } from '../context.js';
import { REWARDS } from './kinds.js';

const RW = Object.keys(REWARDS);

// a tile that may take something solid of ours
const freeTile = (c, x, y, used) => c.walk(x, y) && c.reached(x, y) && 'gfsr'.includes(c.ter(x, y)) && !c.approach[c.I(x, y)] && !c.target[c.I(x, y)] && !c.near[c.I(x, y)] && !c.piece.has(`${x},${y}`) && !used.has(`${x},${y}`);

// accepting a set of new solid tiles: every tile reached before, except `lost`, stays reachable,
// and every tile the course needs (lanes, plazas, door steps, the tiles beside people, signs and
// landmarks) keeps exactly its walking distance
function keepsDistances(c, solid, add, lost) {
  const s = solid.slice();
  for (const [x, y] of add) s[c.I(x, y)] = 1;
  const d = distances(c, s), L = new Set(lost.map(([x, y]) => c.I(x, y)));
  for (let i = 0; i < d.length; i++) if (c.d0[i] >= 0 && !s[i] && !L.has(i) && (d[i] < 0 || (c.target[i] && d[i] !== c.d0[i]))) return false;
  return true;
}

export function planObstacles(c, seed, { places = 6 } = {}) {
  const r = seeded('life:obstacles', seed), used = new Set(), out = [], solid = c.solid.slice(), lost = [];
  const want = Math.max(2, Math.min(4, 2 + Math.floor(places / 6)));
  const take = (list) => list.forEach(([x, y]) => { used.add(`${x},${y}`); for (const [dx, dy] of N4) used.add(`${x + dx},${y + dy}`); });
  const far = (x, y) => out.every((o) => Math.abs(o.x - x) + Math.abs(o.y - y) >= 8);

  // 1. dead-end nooks the town already has: blocking one tile cuts off a pocket of 1 to 6 tiles
  //    that holds nothing the course needs
  const spurs = [];
  for (let y = 1; y < c.H - 1; y++) for (let x = 1; x < c.W - 1; x++) {
    if (!freeTile(c, x, y, used)) continue;
    const tl = c.toLane[c.I(x, y)]; if (tl < 1 || tl > 3) continue;
    const ns = N4.map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => c.walk(a, b) && c.reached(a, b));
    if (ns.length < 2) continue;
    for (const [nx, ny] of ns) {
      const seen = new Set([`${x},${y}`, `${nx},${ny}`]), comp = [[nx, ny]];
      let ok = true;
      for (let h = 0; h < comp.length && ok; h++) for (const [dx, dy] of N4) {
        const a = comp[h][0] + dx, b = comp[h][1] + dy, k = `${a},${b}`;
        if (seen.has(k) || !c.walk(a, b)) continue;
        seen.add(k); comp.push([a, b]);
        if (comp.length > 6) { ok = false; break; }
      }
      if (!ok || comp.some(([a, b]) => c.target[c.I(a, b)] || c.approach[c.I(a, b)] || c.near[c.I(a, b)] || used.has(`${a},${b}`))) continue;
      const outside = ns.find(([a, b]) => !comp.some(([p, q]) => p === a && q === b));
      if (!outside || c.toLane[c.I(...outside)] > tl) continue;
      const rough = N4.concat([[0, 0]]).some(([dx, dy]) => 'Rer'.includes(c.ter(x + dx, y + dy))) ? 'boulder' : N4.some(([dx, dy]) => 'Tb'.includes(c.ter(x + dx, y + dy))) ? (r() < 0.5 ? 'log' : 'thicket') : r() < 0.5 ? 'boulder' : 'thicket';
      // the reward must be in view: nothing tall (a house, a tree) stands just below it to hide it
      const inView = (p) => !c.building(p[0], p[1] + 1) && !c.building(p[0], p[1] + 2) && c.ter(p[0], p[1] + 1) !== 'T';
      const visible = comp.filter(inView);
      if (!visible.length || !inView([x, y])) continue;
      const reward = visible.reduce((b, p) => (Math.abs(p[0] - x) + Math.abs(p[1] - y) >= Math.abs(b[0] - x) + Math.abs(b[1] - y) ? p : b), visible[0]);
      spurs.push({ kind: rough, x, y, stand: outside, pocket: comp, reward, s: comp.length * 0.4 - tl * 0.5 + r() });
      break;
    }
  }
  spurs.sort((a, b) => b.s - a.s);
  for (const s of spurs) {
    if (out.length >= want - 1) break;
    if (!far(s.x, s.y) || [s, ...s.pocket].some((p) => used.has(`${p.x ?? p[0]},${p.y ?? p[1]}`))) continue;
    if (!keepsDistances(c, solid, [[s.x, s.y]], [...lost, ...s.pocket])) continue;
    solid[c.I(s.x, s.y)] = 1; lost.push(...s.pocket);
    out.push({ ...s, tiles: [[s.x, s.y]], ring: [] });
    take([[s.x, s.y], ...s.pocket]);
  }

  // 2. a tiny hedged garden with a locked gate, on free grass a few steps from a lane
  const nooks = [];
  for (let y = 1; y < c.H - 4; y++) for (let x = 1; x < c.W - 4; x++) {
    let ok = true; const cells = [];
    for (let j = 0; j < 3 && ok; j++) for (let i = 0; i < 3 && ok; i++) { ok = freeTile(c, x + i, y + j, used); cells.push([x + i, y + j]); }
    if (!ok) continue;
    const tl = c.toLane[c.I(x + 1, y + 1)]; if (tl < 2 || tl > 5) continue;
    // the gate: the middle of the side whose outside tile is nearest a lane
    const gates = [[x + 1, y, 0, -1], [x + 1, y + 2, 0, 1], [x, y + 1, -1, 0], [x + 2, y + 1, 1, 0]].map(([gx, gy, dx, dy]) => ({ gx, gy, out: [gx + dx, gy + dy] })).filter((g) => c.walk(...g.out) && c.reached(...g.out) && !used.has(`${g.out[0]},${g.out[1]}`));
    if (!gates.length) continue;
    gates.sort((a, b) => c.toLane[c.I(...a.out)] - c.toLane[c.I(...b.out)]);
    nooks.push({ x, y, cells, g: gates[0], s: -Math.abs(tl - 3) + r() * 2 });
  }
  nooks.sort((a, b) => b.s - a.s);
  for (const n of nooks.slice(0, 30)) {
    if (out.length >= want || out.some((o) => o.kind === 'gate')) break;
    if (!far(n.x + 1, n.y + 1) || n.cells.some(([a, b]) => used.has(`${a},${b}`))) continue;
    const ring = n.cells.filter(([a, b]) => !(a === n.x + 1 && b === n.y + 1) && !(a === n.g.gx && b === n.g.gy));
    if (!keepsDistances(c, solid, [...ring, [n.g.gx, n.g.gy]], [...lost, ...n.cells])) continue;
    for (const [a, b] of [...ring, [n.g.gx, n.g.gy]]) solid[c.I(a, b)] = 1;
    lost.push(...n.cells);
    out.push({ kind: 'gate', x: n.g.gx, y: n.g.gy, stand: n.g.out, pocket: [[n.x + 1, n.y + 1]], reward: [n.x + 1, n.y + 1], tiles: [[n.g.gx, n.g.gy]], ring });
    take(n.cells);
  }

  // 3. a cellar hatch beside a house (not in front of it)
  const sides = [];
  for (const b of c.town.BUILDINGS) for (const x of [b.x - 1, b.x + b.w]) for (let y = b.y + 1; y < b.y + b.h; y++) {
    if (!freeTile(c, x, y, used) || c.toLane[c.I(x, y)] > 4) continue;
    const stand = N4.map(([dx, dy]) => [x + dx, y + dy]).find(([a, d]) => c.walk(a, d) && c.reached(a, d) && !c.building(a, d));
    if (stand) sides.push({ x, y, stand, s: r() });
  }
  sides.sort((a, b) => b.s - a.s);
  for (const s of sides) {
    if (out.length >= want) break;
    if (!far(s.x, s.y) || used.has(`${s.x},${s.y}`) || !keepsDistances(c, solid, [[s.x, s.y]], lost)) continue;
    solid[c.I(s.x, s.y)] = 1;
    out.push({ kind: 'hatch', x: s.x, y: s.y, stand: s.stand, pocket: [], reward: null, tiles: [[s.x, s.y]], ring: [] });
    take([[s.x, s.y]]);
  }
  out.forEach((o, i) => { o.id = `ob${i}`; o.prize = RW[Math.floor(seeded(`life:prize:${i}`, seed)() * RW.length)]; });
  return out;
}

// A small locked door on a room's back wall, at a column nothing else uses, with free floor in front.
// L: a composed room (gen/interior/compose.js). Returns null when there is no tidy place for it.
export function roomObstacle(L, seed) {
  if (!L || L.dark) return null;
  const r = seeded(`life:closet:${L.id}`, seed), cols = [];
  const board = L.board ? [L.board.x0, L.board.x0 + L.board.n - 1] : [-9, -9];
  for (let x = 1; x < L.w - 1; x++) {
    if (L.up[x] || L.lo[x] || Math.abs(x - L.lab[0]) <= 1 || x === L.exit[0] || (x >= board[0] - 1 && x <= board[1] + 1)) continue;
    if (L.number && L.number.x === x) continue;
    if ([...(L.locks || []), ...(L.stairs ? [L.stairs] : [])].some((f) => x >= f.x - 1 && x <= f.x + f.fw)) continue; // not beside stairs or a lock (mechanics/floors/, riddles/)
    if (L.top[x - 1] !== L.top[x] || L.top[x + 1] !== L.top[x]) continue;
    const fy = L.top[x] + 3;
    if (L.blocked[fy * L.w + x] || L.master[0] === x && L.master[1] === fy) continue;
    cols.push(x);
  }
  if (!cols.length) return null;
  const x = cols[Math.floor(r() * cols.length)];
  return { kind: 'closet', x, y: L.top[x] + 2, stand: [x, L.top[x] + 3], top: L.top[x] };
}
