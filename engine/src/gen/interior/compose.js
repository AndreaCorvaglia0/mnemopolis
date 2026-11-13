// Composing a room. Pure data, runs in Node (no canvas). The room is built in a fixed order, the
// way an interior designer would furnish it:
//   1. the plan and its AXIS (the line from the entrance to the place of honour);
//   2. the aisle along the axis, and the FOCAL point at its end: the signature object, against the
//      back wall (in the alcove, on the dais);
//   3. the learning wall on one side of it: the lab door and the reading wall, always together;
//   4. the BACK ZONE on the other side, mirroring the learning wall's span;
//   5. the host beside the aisle, on the learning side;
//   6. one or two FLOOR ZONES, one in each half of the room, the second placed as the mirror of the
//      first where it fits (islands with a walkway around, or groups along a side wall);
//   7. decorations in mirrored pairs: plants in the front corners, flanking pieces beside the
//      signature, windows and pictures on the back wall, torches in a cave;
//   8. the concept's name centred above the focal point, the house number.
// Every step keeps the room walkable (rules.js); the finished room must pass every rule, otherwise
// it is composed again with the next seed (still deterministic).
import { w as word } from '../../data/words.js';
import { seeded, THEME } from '../core.js';
import { EMBLEMS } from '../emblems.js';
import { mix } from '../../art/px.js';
import { PLANS, PLAN_NAMES, UPPER_PLANS, cellAt, choosePlan } from './plans.js';
import { fixturesOf } from '../../mechanics/floors/plan.js';
import { ZONES, ATTIC_ZONES } from './zones.js';
import { TRADES, tradeOf } from './trades.js';
import { KINDS } from './kinds.js';
import { PIECES } from './pieces.js';
import { FREE, USED, KEEP, roomProblems, orderProblems, freeRatio, MIN_FREE, zoneCap, decorCap } from './rules.js';

export const SIG_H = 46; // the signature is at most this tall, so the concept's name fits above it
const textWidth = (s) => s.length * 4 - 1; // the sign font of art/buildings.js
const INK = '#1b1a2b';

// The profile of a room: its kind's, or for a home its trade's.
export function profileOf(place) {
  if (place.kind === 'home') {
    const trade = tradeOf(place.trade), t = TRADES[trade];
    return { ...KINDS.home, kind: 'home', trade, zones: t.zones, sigs: [t.signature], forms: [], decor: t.decor };
  }
  const kind = KINDS[place.kind] ? place.kind : 'lab';
  return { ...KINDS[kind], kind };
}

// Colours of one room: the kind's own colours (or, in a home, the theme's), materials of the theme,
// one accent. Painters receive only these.
export function paletteOf(K, L, theme) {
  const tw = theme.wall[L.tone % theme.wall.length], light = (c, t) => mix(c, '#ffffff', t), dark = (c, t) => mix(c, INK, t);
  let wall, lower, band, front;
  if (K.home) {
    band = dark(theme.roofs[L.tone % theme.roofs.length], 0.12);
    wall = light(mix(tw, '#f6efe0', 0.45), 0.1); lower = mix(wall, theme.wood, 0.35); front = dark(band, 0.2);
  } else if (K.dark) { wall = K.wall; lower = K.lower; band = K.band; front = K.front; }
  else { wall = mix(K.wall, tw, 0.28); lower = mix(K.lower, tw, 0.3); band = K.band; front = K.front; }
  const wood = theme.wood, stone = theme.stone;
  return {
    wall, lower, band, front, wood, woodL: light(wood, 0.2), woodD: dark(wood, 0.35), stone, stoneL: light(stone, 0.3), stoneD: dark(stone, 0.3),
    trim: theme.trim, accent: theme.accent, dye: theme.roofs[(L.tone + 1) % theme.roofs.length],
  };
}

// o.floor: 'ground' (default) or 'up', the upper floor of a house that has one (mechanics/floors/).
// o.fixtures: what must stand in the room besides the furniture (stairs, locks); by default it is
// read from the concept (fixturesOf), so the game, the checks and the tests agree.
export function planRoom(place, o = {}) {
  let err;
  // three seeds on the house's own plan, then on the next plans, then on the plain hall
  for (let a = 0; a < 12; a++) { try { return composeOnce(place, a, a >= 9 && !o.plan ? { ...o, plan: 'hall' } : o); } catch (e) { err = e; } }
  throw err;
}

function composeOnce(place, attempt, o) {
  const theme = o.theme || THEME;
  // ---- floors and locks (mechanics/floors/): the fixtures of this floor; upstairs a smaller, atticky room
  const FX = o.fixtures !== undefined ? o.fixtures : fixturesOf(place, o.floor);
  const upper = o.floor === 'up';
  if (upper && !FX) throw new Error(`"${place.id}" has nothing for an upper floor`);
  const r = seeded(`${place.id}:interior${upper ? ':up' : ''}${attempt ? `:${attempt}` : ''}`);
  const K0 = o.zones ? { ...profileOf(place), zones: o.zones } : profileOf(place); // o.zones: tests put one zone first
  const K = upper && !o.zones && !K0.dark ? { ...K0, zones: ATTIC_ZONES } : K0; // upstairs: trunks, books, a chair
  const plan = o.plan || (upper ? 'attic' : choosePlan(place, Math.floor(seeded('interior:plans')() * PLAN_NAMES.length), K.plans, attempt));
  const L = { id: place.id, kind: K.kind, trade: K.trade, plan, ...(PLANS[plan] || UPPER_PLANS[plan])(r), items: [], wall: [], torches: [], torchCols: [], rugs: [], zones: [], upper, locks: [], stairs: null };
  const { w, h, top } = L;
  L.occ = new Uint8Array(w * h);
  L.up = new Uint8Array(w); L.lo = new Uint8Array(w); // back-wall bands in use: upper (pictures) and lower (behind furniture)
  const F0 = (x) => top[x] + 3, isFloor = (x, y) => cellAt(L, x, y) === 'floor';
  const occ = (x, y) => L.occ[y * w + x], set = (x, y, v) => { L.occ[y * w + x] = v; };
  const free = (x, y) => isFloor(x, y) && occ(x, y) === FREE;
  const keep = (x, y) => { if (free(x, y)) set(x, y, KEEP); };
  const mark = (x0, n, up, lo) => { for (let x = x0; x < x0 + n; x++) { if (up) L.up[x] = 1; if (lo) L.lo[x] = 1; } };
  const tops = {}; top.forEach((t) => (tops[t] = (tops[t] || 0) + 1));
  const mainTop = +Object.entries(tops).sort((a, b) => b[1] - a[1])[0][0], fm = mainTop + 3;
  let floorTiles = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (isFloor(x, y)) floorTiles++;
  const fail = (m) => { throw new Error(`Room of "${place.id}" (plan ${plan}, ${w} x ${h}): ${m}`); };

  // 1-2. axis, exit, aisle, pillars
  L.axis = L.alcove ? (L.alcove[0] + L.alcove[1]) / 2 : L.dais ? (L.dais[0] + L.dais[1]) / 2 : (w - 1) / 2;
  const exs = [Math.floor(L.axis), Math.ceil(L.axis)]; if (r.chance(0.5)) exs.reverse();
  const ex = exs.find((x) => L.bot[x] === h - 1) ?? fail('no column for the exit');
  L.exit = [ex, h - 1]; L.start = [ex, h - 2];
  for (const [px, py] of L.pillars || []) { set(px, py, USED); L.items.push({ type: 'pillar', x: px, y: py, fw: 1, fh: 1, ph: PIECES.pillar.ph }); }
  for (let y = h - 2; y > F0(ex); y--) if (isFloor(ex, y)) set(ex, y, KEEP);

  // the focal point: the signature, centred on the axis against the back wall
  const sig = { type: 'sig', ...(upper ? { emblem: null, form: null, object: K.dark ? 'tablet' : r.pick(ATTIC_SIGS) } : pickSignature(place, K, r)), focal: true };
  const fw = Number.isInteger(L.axis) ? 3 : 2, sx = Math.round(L.axis - (fw - 1) / 2), sy = F0(sx);
  for (let x = sx; x < sx + fw; x++) if (top[x] !== top[sx] || !free(x, sy)) fail('no place of honour for the signature');
  Object.assign(sig, { x: sx, y: sy, fw, fh: 1, ph: SIG_H });
  for (let x = sx; x < sx + fw; x++) { set(x, sy, USED); L.lo[x] = 1; keep(x, sy + 1); }
  L.items.push(sig);
  if (L.dais) { const [p0, p1, r0, r1] = L.dais; for (let x = p0; x <= p1; x++) for (let y = r0 + 1; y <= r1; y++) keep(x, y); }

  // the place of honour (dais, alcove, or the focal point and one column either side) stays clear
  const hon = L.dais ? [L.dais[0], L.dais[1]] : L.alcove ? [L.alcove[0], L.alcove[1]] : [sx - 1, sx + fw];
  const seg = (s) => (s < 0 ? [0, hon[0] - 1] : [hon[1] + 1, w - 1]);
  const bn = w <= 13 ? 2 : 3;
  const leavesRoom = (c0, c1) => [-1, 1].some((s) => { // a run of bn + 1 free columns stays on one side for the learning wall
    const [a, b] = seg(s); let run = 0, best = 0;
    for (let x = a; x <= b; x++) { run = L.up[x] || (x >= c0 && x <= c1) || x === ex || top[x] !== top[x === a ? a : x - 1] ? (L.up[x] || (x >= c0 && x <= c1) || x === ex ? 0 : 1) : run + 1; best = Math.max(best, run); }
    return best >= bn + 1;
  });
  // in a dark room, torches: a mirrored pair as far out on the back wall as the learning wall allows
  if (K.dark) {
    for (let x = 0; x < L.axis; x++) {
      const m = Math.round(2 * L.axis - x);
      if (m <= x || L.up[x] || L.up[m] || top[x] !== top[m]) continue;
      L.up[x] = L.up[m] = 1;
      if (!leavesRoom(-1, -2)) { L.up[x] = L.up[m] = 0; continue; }
      L.torches.push([x * 16 + 8, top[x] * 16 + 16], [m * 16 + 8, top[m] * 16 + 16]); L.torchCols.push(x, m);
      break;
    }
    if (!L.torches.length) fail('no place for the torches');
  }

  // the concept's name, centred above the focal point; it keeps room for the learning wall on one side
  // upstairs the label begins with UPSTAIRS (DI SOPRA): the room must not pass for the ground floor
  const label = `${upper ? `${word('room.upstairsTag')} - ` : ''}${place.concept || place.name || ''}`.toUpperCase().replace(/[^A-Z0-9 .\-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 34);
  L.label = placeLabel(L, label, mark, leavesRoom, true); // null: too long to stand over the focal point, placed later

  // 3. the learning wall: lab door and reading wall side by side, on one side of the focal point
  const wallRun = (x0, n, front = true) => {
    for (let x = x0; x < x0 + n; x++) {
      if (x < 0 || x >= w || top[x] !== top[x0] || !free(x, F0(x)) || L.lo[x] || L.up[x] || x === ex) return false;
      if (front && (!isFloor(x, F0(x) + 1) || occ(x, F0(x) + 1) === USED)) return false;
    }
    return true;
  };
  // upstairs: the advanced lab door only when some advanced station is not behind a lock, the board
  // (a bookshelf of further reading) only when the concept has further links
  const wantDoor = !FX || FX.door !== false, wantBoard = !FX || FX.shelf !== false, nb = (wantDoor ? 1 : 0) + (wantBoard ? bn : 0);
  let side = r.chance(0.5) ? -1 : 1, block = null;
  for (const s of nb ? [side, -side] : []) {
    const [a, b] = seg(s), outer = s < 0 ? a : b, want = outer - s; // one column in from the corner
    const starts = [];
    for (let x0 = a; x0 + nb - 1 <= b; x0++) if (wallRun(x0, nb)) starts.push(x0);
    starts.sort((p, q) => Math.abs((s < 0 ? p : p + nb - 1) - want) - Math.abs((s < 0 ? q : q + nb - 1) - want));
    if (starts.length) {
      side = s; const x0 = starts[0];
      block = !wantBoard ? { door: x0 } : !wantDoor ? { board: x0 } : s < 0 ? { door: x0, board: x0 + 1 } : { door: x0 + bn, board: x0 };
      block.x0 = x0; block.x1 = x0 + nb - 1; break;
    }
  }
  if (nb && !block) fail('no place for the lab door and the reading wall');
  if (!block) block = side < 0 ? { x0: 1, x1: 2 } : { x0: w - 3, x1: w - 2 };
  L.lab = null; L.board = null; L.exhibit = [];
  if (block.door != null) { const dX = block.door; L.lab = [dX, top[dX] + 2]; mark(dX, 1, 1, 1); set(dX, F0(dX), KEEP); }
  if (block.board != null) {
    L.board = { x0: block.board, n: bn, top: top[block.board] };
    for (let x = block.board; x < block.board + bn; x++) { L.exhibit.push([x, F0(x)]); set(x, F0(x), USED); keep(x, F0(x) + 1); }
    mark(block.board, bn, 1, 1);
  }
  L.side = side;

  // 5. the host, beside the aisle on the learning side (on the dais: one tile away from the signature)
  let hx, hy;
  if (upper) { hx = null; hy = Math.floor((fm + h - 2) / 2); L.master = null; } // nobody lives upstairs
  else if (L.dais) { hx = side < 0 ? sx - 2 : sx + fw + 1; hy = L.dais[3]; }
  else { hx = ex + side; hy = Math.max(fm + 2, Math.floor((fm + h - 2) / 2)); }
  if (!upper) {
    if (!isFloor(hx, hy) || occ(hx, hy) === USED) { hx = ex - side; hy = Math.floor((fm + h - 2) / 2); }
    if (!isFloor(hx, hy) || occ(hx, hy) === USED) fail('no place for the host');
    L.master = [hx, hy];
    set(hx, hy, KEEP);
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) keep(hx + dx, hy + dy);
  }

  // -- zone placement: a whole group or nothing
  const snapshot = () => ({ occ: L.occ.slice(), up: L.up.slice(), lo: L.lo.slice(), items: L.items.length, wall: L.wall.length, rugs: L.rugs.length, zones: L.zones.length });
  const restore = (s) => { L.occ.set(s.occ); L.up.set(s.up); L.lo.set(s.lo); L.items.length = s.items; L.wall.length = s.wall; L.rugs.length = s.rugs; L.zones.length = s.zones; };
  const used = new Set();
  function placeZone(name, anchor, x0, y0, mirror, fixture = null) {
    const Z = ZONES[name], lay = Z[anchor], s = snapshot(), variant = Z.variants ? r.pick(Z.variants) : {};
    const X = (dx, n = 1) => (mirror ? x0 + lay.w - dx - n : x0 + dx);
    const tiles = new Set();
    for (const [type, dx, dy] of lay.pieces) for (let k = 0; k < PIECES[type].fw; k++) tiles.add(`${X(dx, PIECES[type].fw) + k},${y0 + dy}`);
    // the box: pieces on free tiles; the rest of the box stays free
    for (let dy = 0; dy < lay.h; dy++) for (let dx = 0; dx < lay.w; dx++) {
      const x = x0 + dx, y = y0 + dy;
      if (!isFloor(x, y)) return false;
      if (tiles.has(`${x},${y}`) ? occ(x, y) !== FREE : occ(x, y) === USED) return false;
    }
    if (anchor === 'back') {
      for (let dx = 0; dx < lay.w; dx++) if (top[x0 + dx] !== top[x0] || y0 !== F0(x0 + dx) || L.lo[x0 + dx]) return false;
      for (const [, dx, n] of lay.wall || []) for (let k = 0; k < n; k++) if (L.up[X(dx, n) + k]) return false;
    }
    if (anchor === 'side') for (let dy = 0; dy < lay.h; dy++) if (isFloor(mirror ? x0 + lay.w : x0 - 1, y0 + dy)) return false;
    if (anchor === 'island') for (let y = y0 - 1; y <= y0 + lay.h; y++) for (let x = x0 - 1; x <= x0 + lay.w; x++) {
      const inside = x >= x0 && x < x0 + lay.w && y >= y0 && y < y0 + lay.h;
      if (!inside && (!isFloor(x, y) || occ(x, y) === USED)) return false;
    }
    const zid = `${name}:${L.zones.length}`;
    for (const [type, dx, dy, opt] of lay.pieces) {
      const P = PIECES[type], x = X(dx, P.fw), y = y0 + dy;
      for (let k = 0; k < P.fw; k++) set(x + k, y, USED);
      L.items.push({ type, x, y, fw: P.fw, fh: 1, ph: P.ph, zone: zid, opt: { ...variant, ...opt }, v: L.items.length, ...(fixture && { fixture }) });
      if (anchor === 'back' && dy === 0 && P.ph > 22) mark(x, P.fw, P.ph > 36, 1);
    }
    for (let dy = 0; dy < lay.h; dy++) for (let dx = 0; dx < lay.w; dx++) keep(x0 + dx, y0 + dy);
    if (lay.rug) { const [rx, ry, rw, rh] = lay.rug; L.rugs.push({ x: mirror ? x0 + lay.w - rx - rw : x0 + rx, y: y0 + ry, w: rw, h: rh, zone: zid, style: L.zones.length % 3 }); }
    for (const [type, dx, n] of lay.wall || []) { const x = X(dx, n); mark(x, n, 1, 0); L.wall.push({ type, x, n, top: top[x], zone: zid }); }
    L.zones.push({ id: zid, name, anchor, x: x0, y: y0, w: lay.w, h: lay.h, mirror, ...(Z.fixture && { fixture: true }) });
    if (roomProblems(L, true).length || freeRatio(L) < MIN_FREE) { restore(s); return false; }
    used.add(name);
    return true;
  }

  // 4a. fixtures (mechanics/floors/, mechanics/riddles/): the stairs and the locks, each a small group
  // against the back wall with its use tile kept free in front. The stairs go to the far end of the
  // side opposite the learning wall; locks near the middle of what is left. Each must find a place.
  const furniture = () => L.zones.filter((z) => !z.fixture).length;
  const fixtures = [...(FX?.stairs ? [{ zone: 'stairs', use: { stairs: true } }] : []), ...(FX?.locks || []).map((l) => ({ zone: l.zone, use: { lock: l.id, kind: l.kind } }))];
  for (const f of fixtures) {
    const lay = ZONES[f.zone].back, xs = [];
    const onHost = (x0) => L.master && L.master[1] === F0(x0) + 1 && L.master[0] >= x0 && L.master[0] < x0 + lay.w;
    for (let x0 = 0; x0 + lay.w <= w; x0++) if ((x0 + lay.w - 1 < hon[0] || x0 > hon[1]) && !onHost(x0)) xs.push(x0);
    const far = (x0) => (side < 0 ? -(x0 + lay.w - 1) : x0); // the stairs: far from the learning wall
    const mid = (x0) => Math.abs(x0 + (lay.w - 1) / 2 - (side < 0 ? (hon[1] + w) / 2 : hon[0] / 2)) + (Math.sign(x0 - L.axis) === side ? 3 : 0);
    xs.sort((p, q) => (f.use.stairs ? far(p) - far(q) : mid(p) - mid(q)));
    let ok = false;
    for (const x0 of xs) if (placeZone(f.zone, 'back', x0, F0(x0), x0 > L.axis && !f.use.stairs, f.use)) { ok = true; break; }
    if (!ok) fail(`no place for the ${f.use.stairs ? 'stairs' : `lock ${f.use.lock}`}`);
    const it = L.items.filter((i) => i.fixture === f.use).find((i) => i.type === lay.pieces[0][0]);
    if (f.use.stairs) { it.opt = { ...it.opt, flip: it.x > L.axis }; L.stairs = { x: it.x, y: it.y, fw: it.fw }; } else L.locks.push({ id: f.use.lock, kind: f.use.kind, x: it.x, y: it.y, fw: it.fw, ph: it.ph });
  }

  // 4. the back zone, mirroring the learning wall's span on the other side of the focal point
  const opp = -side, [oa, ob] = seg(opp), mc = 2 * L.axis - (block.x0 + block.x1) / 2;
  // the most typical zone that stands against a wall, unless it is the only group that could stand on the floor
  const floorable = K.zones.filter((z) => ZONES[z].island || ZONES[z].side);
  for (const name of K.zones) {
    const lay = ZONES[name].back; if (!lay || (floorable.length <= 1 && floorable[0] === name)) continue;
    const xs = []; for (let x0 = oa; x0 + lay.w - 1 <= ob; x0++) xs.push(x0);
    xs.sort((p, q) => Math.abs(p + (lay.w - 1) / 2 - mc) - Math.abs(q + (lay.w - 1) / 2 - mc));
    if (xs.some((x0) => placeZone(name, 'back', x0, F0(x0), opp > 0))) break;
  }

  // 6. floor zones: one in each half, the far half from the host first; the second mirrors the first
  const cap = zoneCap(floorTiles);
  let first = null;
  for (const s of [opp, side]) {
    if (furniture() >= cap) break;
    const target = first ? { x: 2 * L.axis - first.cx, y: first.y } : null;
    const tryHalf = (name) => {
      const Z = ZONES[name], out = [];
      if (Z.island) {
        const lay = Z.island;
        for (let y0 = fm + 2; y0 + lay.h <= h - 2; y0++) for (let x0 = 1; x0 + lay.w < w; x0++) {
          const cx = x0 + (lay.w - 1) / 2;
          if (s < 0 ? x0 + lay.w - 1 >= ex : x0 <= ex) continue;
          const score = target ? Math.abs(cx - target.x) * 2 + Math.abs(y0 - target.y) : Math.abs(y0 + (lay.h - 1) / 2 - hy) + Math.abs(cx - (s < 0 ? ex / 2 : (ex + w - 1) / 2)) * 0.5;
          out.push({ anchor: 'island', x0, y0, score, cx });
        }
      }
      if (Z.side) {
        const lay = Z.side, x0 = s < 0 ? 0 : w - lay.w;
        for (let y0 = fm + 1; y0 + lay.h <= h - 2; y0++) out.push({ anchor: 'side', x0, y0, score: 3 + (target ? Math.abs(y0 - target.y) : Math.abs(y0 + (lay.h - 1) / 2 - hy)), cx: x0 + (lay.w - 1) / 2 });
      }
      out.sort((a, b) => a.score - b.score);
      for (const c of out) if (placeZone(name, c.anchor, c.x0, c.y0, s > 0)) return c;
      return null;
    };
    let got = null;
    for (const name of K.zones) { if (used.has(name)) continue; if ((got = tryHalf(name))) break; }
    // no free-standing group fits this half: a back-wall group on what is left of the back wall
    if (!got) for (const name of K.zones) {
      const lay = ZONES[name].back; if (used.has(name) || !lay) continue;
      const xs = []; for (let x0 = 0; x0 + lay.w <= w; x0++) if (s < 0 ? x0 + lay.w - 1 < hon[0] : x0 > hon[1]) xs.push(x0);
      if (xs.some((x0) => placeZone(name, 'back', x0, F0(x0), s > 0))) { got = { back: true }; break; }
    }
    if (!got && first) got = tryHalf(first.name); // the twin of the first group, mirrored
    if (got && !got.back && !first) first = { ...got, name: L.zones[L.zones.length - 1].name, y: got.y0 };
  }
  if (furniture() < (upper ? 1 : 2)) fail(`only ${furniture()} zone fits`);

  // 7. decorations, in mirrored pairs, within the cap
  const dcap = decorCap(floorTiles);
  let ndecor = 0;
  const mirrorX = (x, n) => Math.round(2 * L.axis - (x + n - 1));
  const pairOfPieces = (type, a, b, y) => {
    if (ndecor + 2 > dcap || a === b) return false;
    const s = snapshot();
    for (const x of [a, b]) { if (!free(x, y)) { restore(s); return false; } set(x, y, USED); L.items.push({ type, x, y, fw: 1, fh: 1, ph: PIECES[type].ph, pair: type, opt: {}, v: L.items.length }); }
    if (roomProblems(L, true).length || freeRatio(L) < MIN_FREE) { restore(s); return false; }
    ndecor += 2; return true;
  };
  const wallPair = (type, n, at) => {
    if (ndecor + 2 > dcap) return false;
    const xs = []; for (let x = 0; x + n <= w; x++) xs.push(x);
    xs.sort((p, q) => Math.abs(p - at) - Math.abs(q - at));
    for (const x of xs) {
      const m = mirrorX(x, n);
      if (m <= x + n - 1) continue; // x is the left one of the pair, and they do not touch
      let ok = top[x] === top[m];
      for (const c of [x, m]) for (let k = 0; k < n; k++) if (c + k < 0 || c + k >= w || L.up[c + k] || top[c + k] !== top[c]) ok = false;
      if (!ok) continue;
      for (const c of [x, m]) { mark(c, n, 1, 0); L.wall.push({ type, x: c, n, top: top[c] }); }
      ndecor += 2; return true;
    }
    return false;
  };
  if (K.flank && r.chance(0.75)) pairOfPieces(K.flank, sx - 1, sx + fw, sy);
  if (!K.dark) {
    wallPair('window', 2, Math.round(w * 0.2));
    const xl = 0, xr = w - 1;
    if (L.bot[xl] === L.bot[xr]) pairOfPieces('plant', xl, xr, L.bot[xl] - 1);
    const dec = K.decor?.length ? r.pick(K.decor) : null;
    if (dec) wallPair(dec, WIDE.includes(dec) ? 2 : 1, Math.round(w * 0.3));
  }
  if (!L.label) L.label = placeLabel(L, label, mark, () => true, false);
  // the house number: top of the wall, at the end of the learning side
  const numX = (() => { const xs = []; for (let x = 0; x < w; x++) if (!L.up[x]) xs.push(x); xs.sort((a, b) => (side < 0 ? a - b : b - a)); return xs[0]; })();
  L.number = numX == null || upper ? null : { x: numX, top: top[numX] }; if (L.number) mark(numX, 1, 1, 0);

  // 8. finish
  L.floor = r.pick(K.floors); L.wallStyle = r.pick(K.walls); L.tone = r.int(0, 3);
  if (upper && !K.dark) { L.floor = 'wood'; L.wallStyle = 'attic'; } // under the roof: boards and beams
  L.step = K.step; L.dark = !!K.dark; L.home = !!K.home;
  L.palette = paletteOf(K, L, theme);
  L.blocked = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (cellAt(L, x, y) !== 'floor' || occ(x, y) === USED) L.blocked[y * w + x] = 1;
  L.sig = sig;
  const probs = [...roomProblems(L, true), ...orderProblems(L, theme)];
  if (probs.length) fail(probs.join('; '));
  return L;
}
export const WIDE = ['chart', 'starchart', 'lightbox', 'map', 'landscape', 'cloths', 'poster'];

const ATTIC_SIGS = ['hourglass', 'clock', 'bigglobe']; // the focal point upstairs: an heirloom

function pickSignature(place, K, r) {
  if (K.home) return { emblem: null, form: null, object: K.sigs[0] };
  const emblem = EMBLEMS.includes(place.emblem) ? place.emblem : null; // unknown names fall back to an object
  // houses in a row get different objects: a project-wide offset plus the house number
  const object = K.sigs[(Math.floor(seeded('interior:signatures')() * K.sigs.length) + (place.order || 1)) % K.sigs.length];
  return { emblem, form: r.pick(K.forms), object };
}

// The concept on the wall, centred above the focal point: one line, or two or three on a short
// wall. room(c0, c1): whether the learning wall still fits beside a label on columns c0..c1.
function placeLabel(L, label, mark, room, centred) {
  const words = label.split(' ');
  const split = (k) => { // the most even split into k lines
    if (k === 1) return [label];
    let best = null;
    const rec = (i, parts) => { if (parts.length === k - 1) { const l = [...parts.map((p) => p.join(' ')), words.slice(i).join(' ')]; if (l.every(Boolean)) { const m = Math.max(...l.map((a) => a.length)); if (!best || m < best.m) best = { m, l }; } return; } for (let j = i + 1; j < words.length; j++) rec(j, [...parts, words.slice(i, j)]); };
    if (words.length >= k) rec(0, []);
    return best?.l;
  };
  const tries = [split(1), split(2), split(3)].filter(Boolean), cx = (L.axis + 0.5) * 16;
  if (centred) tries.length = Math.min(tries.length, 2); // three lines would run into the signature
  const free = (c0, c1) => { for (let x = c0; x <= c1; x++) if (x < 0 || x >= L.w || L.up[x] || L.top[x] !== L.top[c0]) return false; return true; };
  for (const ls of centred ? tries : []) {
    const pw = Math.max(...ls.map(textWidth)) + 8, c0 = Math.floor((cx - pw / 2) / 16), c1 = Math.floor((cx + pw / 2 - 1) / 16);
    if (!free(c0, c1) || !room(c0, c1)) continue;
    mark(c0, c1 - c0 + 1, 1, 0);
    return { lines: ls, x0: c0, n: c1 - c0 + 1, top: L.top[c0], cx };
  }
  if (centred) return null;
  // otherwise: the widest stretch of free upper wall away from the focal point, cut if it must
  const f = L.items.find((i) => i.focal), busy = (x) => L.up[x] || (f && x >= f.x && x < f.x + f.fw);
  let x0 = 0, n = 0;
  for (let x = 0, run = 0; x < L.w; x++) { run = busy(x) ? 0 : x > 0 && L.top[x] === L.top[x - 1] && !busy(x - 1) ? run + 1 : 1; if (run > n) { n = run; x0 = x - run + 1; } }
  const maxCh = Math.max(3, Math.floor((n * 16 - 8) / 4)), ls = tries.find((l) => Math.max(...l.map((a) => a.length)) <= maxCh) || tries[tries.length - 1];
  mark(x0, n, 1, 0);
  return { lines: ls.map((a) => a.slice(0, maxCh)), x0, n, top: L.top[x0], cx: (x0 + n / 2) * 16 };
}
