// The rules of a room, as pure functions that return a list of problems (empty: the room is fine).
// compose.js uses them while building a room, tests and `npm run check` use them on finished rooms.
//
// Reachability (roomProblems): everything the learner uses can be reached on foot from the entrance.
// Order (orderProblems): the room is composed, not scattered:
//   tall        furniture taller than TALL stands against a wall (back or side)
//   focal       exactly one focal point, on the room's axis or in the place of honour (alcove, dais)
//   rug         a rug lies only under a group of at least two pieces
//   free        at least 55% of the floor tiles stay free
//   caps        at most 2 zones (3 in a room of 70 floor tiles or more); one decoration per 12 floor tiles
//   isolated    no single object in the middle of the floor: a piece away from the walls has a
//               neighbour from its own group
//   rhythm      decorations come in pairs mirrored about the axis, or alone on the axis
//   palette     materials from the project theme plus one accent; pieces are tinted by palette names
import { cellAt, f0 } from './plans.js';
import { PIECES, isTall } from './pieces.js';

export const FREE = 0, USED = 1, KEEP = 2;
const N4 = [[0, 1], [1, 0], [0, -1], [-1, 0]];
export const MIN_FREE = 0.55;
export const TINTS = ['band', 'accent', 'wood', 'dye', 'trim'];
export const zoneCap = (floorTiles) => (floorTiles >= 70 ? 3 : 2);
export const decorCap = (floorTiles) => Math.floor(floorTiles / 12);

const passable = (L, x, y) => cellAt(L, x, y) === 'floor' && L.occ[y * L.w + x] !== USED && !(L.master && x === L.master[0] && y === L.master[1]);

export function reach(L) {
  const seen = new Uint8Array(L.w * L.h), [sx, sy] = L.start, q = [[sx, sy]];
  if (!passable(L, sx, sy)) return seen;
  seen[sy * L.w + sx] = 1;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (passable(L, nx, ny) && !seen[ny * L.w + nx]) { seen[ny * L.w + nx] = 1; q.push([nx, ny]); } }
  }
  return seen;
}

// pockets: also report free floor that cannot be reached
export function roomProblems(L, pockets = false) {
  const out = [], seen = reach(L), ok = (x, y) => x >= 0 && y >= 0 && x < L.w && y < L.h && seen[y * L.w + x] === 1;
  const [ex, ey] = L.exit;
  if (L.start[0] !== ex || L.start[1] !== ey - 1) out.push(`the entrance (${L.start}) is not just above the exit (${L.exit})`);
  if (!ok(...L.start)) out.push(`the entrance tile (${L.start}) is blocked`);
  if (L.lab && !ok(L.lab[0], L.lab[1] + 1)) out.push(`the lab door at (${L.lab}) cannot be reached`);
  for (const [x, y] of L.exhibit || []) if (!ok(x, y + 1)) out.push(`the reading wall at (${x},${y}) cannot be read: the tile in front of it is unreachable`);
  if (L.master && !N4.some(([dx, dy]) => ok(L.master[0] + dx, L.master[1] + dy))) out.push(`the host at (${L.master}) cannot be reached`);
  if (pockets) for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) if (passable(L, x, y) && !seen[y * L.w + x]) { out.push(`free floor at ${x},${y} cannot be reached`); return out; }
  return out;
}

const floorTiles = (L) => { let n = 0; for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) if (cellAt(L, x, y) === 'floor') n++; return n; };
export function freeRatio(L) {
  let n = 0, free = 0;
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) if (cellAt(L, x, y) === 'floor') { n++; if (L.occ[y * L.w + x] !== USED) free++; }
  return n ? free / n : 1;
}
// against the back wall (its whole footprint on the first floor row) or a side wall
export function againstWall(L, it) {
  let back = true;
  for (let x = it.x; x < it.x + it.fw; x++) if (it.y !== f0(L, x)) back = false;
  if (back) return 'back';
  const leftOpen = cellAt(L, it.x - 1, it.y) === 'floor', rightOpen = cellAt(L, it.x + it.fw, it.y) === 'floor';
  return !leftOpen || !rightOpen ? 'side' : null;
}

export function orderProblems(L, theme) {
  const out = [], items = L.items.filter((i) => !PIECES[i.type]?.structure);
  // tall furniture against walls
  for (const it of items) if (it.type !== 'sig' && isTall(it.type) && !againstWall(L, it)) out.push(`tall: ${it.type} at ${it.x},${it.y} stands away from the walls`);
  // one focal point, on the axis or in the place of honour
  const focal = L.items.filter((i) => i.focal);
  if (focal.length !== 1) out.push(`focal: ${focal.length} focal points`);
  else {
    const s = focal[0], c = s.x + (s.fw - 1) / 2;
    const honour = (L.alcove && s.x >= L.alcove[0] && s.x + s.fw - 1 <= L.alcove[1]) || (L.dais && s.x >= L.dais[0] && s.x + s.fw - 1 <= L.dais[1]);
    if (Math.abs(c - L.axis) > 0.5 && !honour) out.push(`focal: the ${s.object || s.emblem} at ${s.x} is off the axis ${L.axis}`);
    if (!againstWall(L, s)) out.push('focal: the signature does not stand against the back wall');
  }
  // rugs only under groups
  for (const g of L.rugs) {
    const inside = items.filter((i) => i.zone === g.zone && i.x >= g.x && i.x + i.fw <= g.x + g.w && i.y >= g.y && i.y < g.y + g.h);
    if (inside.length < 2) out.push(`rug: the rug at ${g.x},${g.y} is not under a group`);
  }
  // free floor
  const fr = freeRatio(L);
  if (fr < MIN_FREE) out.push(`free: only ${Math.round(fr * 100)}% of the floor is free`);
  // caps
  if (L.zones.length > zoneCap(floorTiles(L))) out.push(`caps: ${L.zones.length} zones in a room of ${floorTiles(L)} floor tiles`);
  const decor = L.wall.filter((d) => !d.zone).length + items.filter((i) => i.pair).length;
  if (decor > decorCap(floorTiles(L))) out.push(`caps: ${decor} decorations in a room of ${floorTiles(L)} floor tiles`);
  // nothing stray: every piece belongs to a group, a pair or is the signature; away from the walls it has a neighbour of its group
  for (const it of items) {
    if (it.type === 'sig') continue;
    if (!it.zone && !it.pair) out.push(`isolated: ${it.type} at ${it.x},${it.y} belongs to no group`);
    if (againstWall(L, it)) continue;
    const near = items.some((o) => o !== it && o.zone && o.zone === it.zone && o.x <= it.x + it.fw && o.x + o.fw >= it.x && Math.abs(o.y - it.y) <= 1);
    if (!near) out.push(`isolated: ${it.type} at ${it.x},${it.y} stands alone in the middle of the floor`);
  }
  // rhythm: room-level decorations and pairs are mirrored about the axis, or alone on it
  const mid = (o, n) => o.x + (n - 1) / 2;
  const singles = [...L.wall.filter((d) => !d.zone).map((d) => ({ t: d.type, c: mid(d, d.n) })), ...items.filter((i) => i.pair).map((i) => ({ t: i.pair, c: mid(i, i.fw) })), ...(L.torchCols || []).map((c) => ({ t: 'torch', c }))];
  for (const s of singles) {
    if (Math.abs(s.c - L.axis) <= 0.5) continue;
    if (!singles.some((o) => o !== s && o.t === s.t && Math.abs(o.c + s.c - 2 * L.axis) <= 1)) out.push(`rhythm: the ${s.t} at ${s.c} has no partner across the axis`);
  }
  // one palette
  if (theme && L.palette) {
    if (L.palette.wood !== theme.wood || L.palette.stone !== theme.stone || L.palette.accent !== theme.accent) out.push('palette: materials do not come from the project theme');
    for (const it of items) if (it.opt?.tint && !TINTS.includes(it.opt.tint)) out.push(`palette: ${it.type} is tinted "${it.opt.tint}", not a palette name`);
  }
  return out;
}

export function allProblems(L, theme) { return [...roomProblems(L, true), ...orderProblems(L, theme)]; }
