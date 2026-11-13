// Where the secrets go. Pure data, deterministic per course. Every trigger tile is a tile the
// player can stand on, reachable on foot with the obstacles closed, and a few steps from a lane
// (checkSecrets in ../plan.js). Rare by design: about 6 to 12 entries per town.
import { seeded } from '../../gen/core.js';
import { N4, N8 } from '../context.js';
import { SECRETS } from './registry.js';

// which room pictures can be looked at in large, and the painting each one becomes
export const PAINTING_OF = { landscape: 'landscape', portrait: 'catportrait', botanical: 'stilllife', map: 'townmap', starchart: 'nightsky' };
export const MAX_LANE = 4; // a trigger is at most this many steps from a lane

export function planSecrets(c, seed, { used = new Set(), solid = c.solid, d = c.d0, notes = [], rooms = [], obstacles = [], closets = [] } = {}) {
  const r = (k) => seeded(`life:secret:${k}`, seed), out = [];
  const ok = (x, y) => c.inMap(x, y) && !solid[c.I(x, y)] && d[c.I(x, y)] >= 0 && c.toLane[c.I(x, y)] <= MAX_LANE && !used.has(`${x},${y}`) && !c.approach[c.I(x, y)];
  const add = (s) => { out.push(s); used.add(`${s.x},${s.y}`); return s; };
  const spread = (x, y, gap = 7) => out.every((s) => s.x == null || Math.abs(s.x - x) + Math.abs(s.y - y) >= gap);
  const pick = (list, key) => (list.length ? list[Math.floor(r(key)() * list.length)] : null);
  const quarter = (x, y) => c.quarter(x, y)?.id || 'hub';

  // an apple tree: a fruit tree of the dressing, else a plain tree beside a lane; you walk under it
  const fruit = (c.L?.pieces || []).filter((p) => p.t === 'fruittree' && ok(p.x, p.y + 1));
  const trees = [];
  for (let y = 0; y < c.H - 1; y++) for (let x = 0; x < c.W; x++) if (c.ter(x, y) === 'T' && c.toLane[c.I(x, y + 1)] <= 2 && ok(x, y + 1)) trees.push([x, y]);
  const tr = pick(trees, 'apple2'), at = pick(fruit, 'apple') || (tr && { x: tr[0], y: tr[1] });
  if (at) add({ kind: 'apple', obj: [at.x, at.y], x: at.x, y: at.y + 1, fruit: !!fruit.length });

  // a hollow tree: another district, found by thinking about it
  const ap = out.find((s) => s.kind === 'apple');
  const tall = [];
  for (let y = 0; y < c.H; y++) for (let x = 0; x < c.W; x++) if (c.ter(x, y) === 'T') { const s = N4.map(([dx, dy]) => [x + dx, y + dy]).find(([a, b]) => ok(a, b) && c.toLane[c.I(a, b)] <= 3); if (s) tall.push([x, y, s]); }
  const hollows = tall.filter(([x, y]) => !ap || (quarter(x, y) !== quarter(ap.obj[0], ap.obj[1]) && Math.abs(x - ap.obj[0]) + Math.abs(y - ap.obj[1]) > 8));
  const ho = pick(hollows, 'hollow');
  if (ho) add({ kind: 'hollow', obj: [ho[0], ho[1]], x: ho[2][0], y: ho[2][1] });

  // a loose stone at the edge of a district plaza (the square if there is none)
  const edge = [];
  for (let y = 0; y < c.H; y++) for (let x = 0; x < c.W; x++) if (c.ter(x, y) === 'c' && ok(x, y) && N4.some(([dx, dy]) => c.ter(x + dx, y + dy) !== 'c') && Math.abs(x - c.town.START.x) + Math.abs(y - c.town.START.y) > 3 && !c.near[c.I(x, y)]) edge.push([x, y, quarter(x, y)]);
  const district = edge.filter((e) => e[2] !== 'hub');
  const st = pick(district.length ? district : edge, 'stone');
  if (st && spread(st[0], st[1], 4)) add({ kind: 'stone', x: st[0], y: st[1] });

  // a bottle in the water, by a bank one can stand on
  const banks = [];
  for (let y = 0; y < c.H; y++) for (let x = 0; x < c.W; x++) {
    if (c.ter(x, y) !== '~' || c.piece.has(`${x},${y}`)) continue;
    const s = N4.map(([dx, dy]) => [x + dx, y + dy]).find(([a, b]) => ok(a, b) && c.ter(a, b) !== 'w' && c.toLane[c.I(a, b)] <= 3);
    if (s && spread(s[0], s[1])) banks.push({ obj: [x, y], x: s[0], y: s[1] });
  }
  const bo = pick(banks, 'bottle');
  if (bo) add({ kind: 'bottle', ...bo, msg: Math.floor(r('msg')() * 3) });

  // a shooting star over a bench, for whoever sits still there at night
  const benches = [...c.town.PROPS.filter((p) => p[2] === 'bench').map(([x, y]) => [x, y]), ...(c.L?.pieces || []).filter((p) => p.t === 'bench').map((p) => [p.x, p.y])].filter(([x, y]) => N8.some(([dx, dy]) => ok(x + dx, y + dy)));
  const be = pick(benches, 'star');
  if (be) { const s = N8.map(([dx, dy]) => [be[0] + dx, be[1] + dy]).find(([a, b]) => ok(a, b)); add({ kind: 'star', obj: be, x: s[0], y: s[1] }); }

  // a well that echoes (only where the dressing put a well)
  const wells = (c.L?.pieces || []).filter((p) => p.t === 'well').map((p) => ({ p, s: N4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([a, b]) => ok(a, b)) })).filter((w) => w.s);
  const we = pick(wells, 'well');
  if (we) add({ kind: 'well', obj: [we.p.x, we.p.y], x: we.s[0], y: we.s[1] });

  // the lantern cat's trail: paw prints near the landmarks, then near signs, bridges and benches
  const anchors = [...c.town.MONUMENTS.slice(1).map((m) => [m.x, m.y]), ...c.town.SIGNS.filter((s) => !s.b).map((s) => [s.x, s.y]), ...benches, c.town.MONUMENTS[0] && [c.town.MONUMENTS[0].x, c.town.MONUMENTS[0].y]].filter(Boolean);
  const want = Math.max(4, Math.min(6, c.town.QUARTERS.length + 2)), prints = [];
  for (const [ax, ay] of anchors) {
    if (prints.length >= want) break;
    const cands = [];
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const x = ax + i, y = ay + j; if (ok(x, y) && c.toLane[c.I(x, y)] <= 2 && Math.abs(i) + Math.abs(j) >= 2 && !c.near[c.I(x, y)]) cands.push([x, y]); }
    const p = pick(cands.filter(([x, y]) => prints.every((q) => Math.abs(q[0] - x) + Math.abs(q[1] - y) >= 7) && spread(x, y, 3)), `print:${ax},${ay}`);
    if (p) { prints.push(p); used.add(`${p[0]},${p[1]}`); }
  }
  if (prints.length >= 3) {
    const m = c.town.MONUMENTS[0], home = m && [...N8, [2, 0], [2, 1], [-1, 1], [0, 2], [1, 2]].map(([dx, dy]) => [m.x + dx, m.y + dy]).find(([x, y]) => c.walk(x, y) && c.reached(x, y) && !c.approach[c.I(x, y)] && !(x === c.town.START.x && y === c.town.START.y));
    out.push({ kind: 'prints', prints, home: home || [c.town.START.x + 1, c.town.START.y], x: prints[0][0], y: prints[0][1] });
  }

  // notes from world.json, near their concept's house
  notes.forEach((n, k) => {
    const b = c.town.BUILDINGS.find((o) => o.id === n.near) || c.town.BUILDINGS[0];
    const cands = [];
    for (let y = b.y - 1; y <= b.y + b.h + 3; y++) for (let x = b.x - 3; x <= b.x + b.w + 2; x++) if (ok(x, y) && !c.near[c.I(x, y)]) cands.push([x, y]);
    const p = pick(cands, `note:${k}`);
    if (p) add({ kind: 'note', x: p[0], y: p[1], text: String(n.text), near: n.near });
  });

  // paintings: one or two room pictures that can be looked at in large
  const walls = rooms.flatMap(({ place, L }) => (L?.wall || []).map((w, i) => ({ place: place.id, i, w })).filter((o) => PAINTING_OF[o.w.type]));
  const byRoom = [...new Set(walls.map((w) => w.place))];
  // no picture to look at in any room: hang one small painting on a free stretch of a back wall
  if (!walls.length) {
    const rf = r('hang'), opts = [];
    for (const { place, L } of rooms) {
      if (!L || L.dark) continue;
      const board = L.board ? [L.board.x0 - 1, L.board.x0 + L.board.n] : [-9, -9];
      for (let x = 1; x < L.w - 1; x++) if (!L.up[x] && !L.up[x - 1] && !L.up[x + 1] && L.top[x - 1] === L.top[x] && L.top[x + 1] === L.top[x] && Math.abs(x - L.lab[0]) > 1 && (x < board[0] || x > board[1]) && !closets.some((o) => o.place === place.id && Math.abs(o.x - x) <= 1)) opts.push({ place: place.id, x, top: L.top[x] });
    }
    if (opts.length) { const o = opts[Math.floor(rf() * opts.length)]; out.push({ kind: 'painting', place: o.place, x: o.x, n: 1, top: o.top, hung: true, painting: Object.values(PAINTING_OF)[Math.floor(rf() * 5)] }); }
  }
  const np = Math.min(byRoom.length, rooms.length > 4 ? 2 : 1), rp = r('paint');
  for (let k = 0; k < np; k++) {
    const room = byRoom.splice(Math.floor(rp() * byRoom.length), 1)[0], ws = walls.filter((w) => w.place === room), w = ws[Math.floor(rp() * ws.length)];
    out.push({ kind: 'painting', place: room, x: w.w.x, n: w.w.n, top: w.w.top, painting: PAINTING_OF[w.w.type] });
  }

  // what waits behind the obstacles (sealed until opened)
  for (const o of obstacles) out.push({ kind: 'sealed', ob: o.id, prize: o.prize, x: (o.reward || o.stand)[0], y: (o.reward || o.stand)[1] });
  for (const o of closets) out.push({ kind: 'sealed', ob: o.id, prize: o.prize, place: o.place, x: o.x, y: o.y, room: true });

  out.forEach((s, i) => { s.id = `${s.kind}${i}`; if (!SECRETS[s.kind]) throw new Error(`unknown secret ${s.kind}`); });
  return out;
}
