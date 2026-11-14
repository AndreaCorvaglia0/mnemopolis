// Where the mini-games live in town: plain data, deterministic per course (tests/games.test.mjs and
// the stress test check it over hundreds of towns). A game "in town" gets an object (a piano, a
// board, a hat, a box, a bench) on a tile just off a lane: never on a door approach or a tile the
// course needs, never beside a person, a sign or a landmark, reachable, with a free tile to stand on,
// and it never changes the walking distance of anything the course needs.
//   planGames(c, games, seed, { used, solid }) -> [{ id, object, x, y, stand: [x, y] }]
//   gamePeople(games, people, seed)            -> { gameId: personId } for games offered by a person
import { distances, N4 } from '../context.js';

const prng = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } let a = h >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
export const OBJECT_ORDER = ['box', 'board', 'bench', 'hat', 'piano'];
const sounds = (g) => JSON.stringify(g.data || {}).includes('"sound"') || g.data?.make?.kind === 'tone';
export const objectOf = (g, r) => g.object || (sounds(g) ? 'piano' : OBJECT_ORDER[Math.floor(r() * 3)]);

export function planGames(c, games, seed = 'course', { used = new Set(), solid = c.solid } = {}) {
  const r = prng(`games:${seed}`), out = [], sol = solid.slice();
  const taken = new Set(used);
  const list = games.filter((g) => (g.where || 'town') === 'town');
  // candidates: a free tile 1 or 2 steps from a lane, with a free reachable neighbour to stand on
  const cands = [];
  for (let y = 1; y < c.H - 1; y++) for (let x = 1; x < c.W - 1; x++) {
    const i = c.I(x, y);
    if (sol[i] || c.d0[i] < 0 || c.approach[i] || c.target[i] || c.near[i] || taken.has(`${x},${y}`)) continue;
    const tl = c.toLane[i]; if (tl < 1 || tl > 2) continue;
    if (c.piece.has(`${x},${y}`)) continue;
    const stand = N4.map(([dx, dy]) => [x + dx, y + dy]).find(([a, b]) => c.walk(a, b) && c.reached(a, b) && !c.approach[c.I(a, b)] && c.toLane[c.I(a, b)] <= 1 && !taken.has(`${a},${b}`));
    if (stand) cands.push({ x, y, stand, q: c.quarter(x, y)?.id || 'hub', s: r() });
  }
  cands.sort((a, b) => a.s - b.s);
  for (const g of list) {
    const base = distances(c, sol); // with what already stands (obstacles, earlier games)
    const quarters = new Set(out.map((o) => o.q));
    const ok = (k) => out.every((o) => Math.abs(o.x - k.x) + Math.abs(o.y - k.y) >= 10) && !taken.has(`${k.x},${k.y}`) && !taken.has(`${k.stand[0]},${k.stand[1]}`);
    // prefer a district that has none yet
    const order = [...cands.filter((k) => !quarters.has(k.q)), ...cands];
    let pick = null;
    for (const k of order) {
      if (!ok(k)) continue;
      // adding the object as solid must keep every distance the course needs
      const s2 = sol.slice(); s2[c.I(k.x, k.y)] = 1;
      const d = distances(c, s2);
      let fine = d[c.I(k.stand[0], k.stand[1])] >= 0;
      for (let i = 0; fine && i < d.length; i++) if (base[i] >= 0 && !s2[i] && (d[i] < 0 || (c.target[i] && d[i] !== base[i]))) fine = false;
      if (fine) { pick = k; sol[c.I(k.x, k.y)] = 1; break; }
    }
    if (!pick) continue; // no room: the game is offered by a person instead (gamePeople)
    for (const [dx, dy] of [[0, 0], ...N4]) taken.add(`${pick.x + dx},${pick.y + dy}`);
    out.push({ id: g.id, object: objectOf(g, r), x: pick.x, y: pick.y, stand: pick.stand, q: pick.q });
  }
  return out;
}

// games offered by a person: those that ask for it, and town games that found no room
export function gamePeople(games, people, seed = 'course', placed = []) {
  const r = prng(`gamepeople:${seed}`), out = {}, ppl = people.slice();
  for (let i = ppl.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ppl[i], ppl[j]] = [ppl[j], ppl[i]]; }
  let k = 0;
  for (const g of games) {
    const w = g.where || 'town';
    if (w === 'person' || (w === 'town' && !placed.some((p) => p.id === g.id))) { if (ppl.length) out[g.id] = ppl[k++ % ppl.length]; }
  }
  return out;
}

// is a game open? (a game never asks what has not been met)
export function unlocked(g, s, info) {
  return (g.concepts || []).every((id) => {
    const r = info(id);
    if (!r) return false;
    return g.unlock === 'lab' ? r.labDone || r.remembered : r.remembered;
  });
}

// The rules, as a list of problems (empty when fine): no spot on a door approach or a needed tile,
// every stand reachable, and with every object (and the obstacles) standing nothing the course needs
// changes its walking distance. blocked: tiles already solid (life's obstacles).
export function checkGamePlan(c, plan, blocked = []) {
  const out = [], base = c.solid.slice();
  for (const [x, y] of blocked) base[c.I(x, y)] = 1;
  const d0 = distances(c, base), s = base.slice();
  for (const p of plan) {
    const i = c.I(p.x, p.y);
    if (c.approach[i]) out.push(`game ${p.id} stands on a door approach at ${p.x},${p.y}`);
    if (c.target[i]) out.push(`game ${p.id} stands on a tile the course needs at ${p.x},${p.y}`);
    if (Math.abs(p.stand[0] - p.x) + Math.abs(p.stand[1] - p.y) !== 1) out.push(`game ${p.id}: its standing tile is not beside it`);
    s[i] = 1;
  }
  const d = distances(c, s);
  for (const p of plan) if (d[c.I(p.stand[0], p.stand[1])] < 0) out.push(`game ${p.id} cannot be walked up to`);
  let changed = 0, cut = 0;
  for (let i = 0; i < d.length; i++) { if (d0[i] < 0 || s[i]) continue; if (d[i] < 0) cut++; else if (c.target[i] && d[i] !== d0[i]) changed++; }
  if (changed) out.push(`${changed} needed tiles changed their walking distance with the games standing`);
  if (cut) out.push(`${cut} tiles became unreachable with the games standing`);
  return out;
}
