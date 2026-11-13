// The town is GENERATED from the course (src/course/course.js). Nobody places tiles by hand.
//
// World grammar (see engine/docs/WORLD.md):
//   hub square        = the subject as a whole (monument, guide, league hall)
//   one quarter       = one district = one theme, ringed by its own landscape (river, hill, forest, meadow, shore)
//   one building      = one concept; its shape says what kind of knowledge it is
//   order             = quarters go clockwise from the west; inside a quarter, houses are numbered from the plaza outward
//   avenue and bridge = "you need the square before this theme"
//   tall grass        = quick questions on houses already visited
import { COURSE } from '../course/course.js';

export const T = 16;

// Footprint and painter of every kind of building. `scene` = which room scene opens (default: Interior).
export const KINDS = {
  lab: { paint: 'lab', w: 5, h: 5, doors: [[2, 4]] }, // a mechanism: change a cause, watch the effect
  archive: { paint: 'archive', w: 5, h: 5, doors: [[2, 4]] }, // vocabulary, parts, formats: what things are called and made of
  hall: { paint: 'hall', w: 6, h: 5, doors: [[2, 4]] }, // a choice: compare options, trade-offs, "which one when"
  studio: { paint: 'studio', w: 6, h: 5, doors: [[2, 4]] }, // practice on real cases
  observatory: { paint: 'observatory', w: 3, h: 7, doors: [[1, 6]] }, // a way of seeing or measuring
  workshop: { paint: 'workshop', w: 6, h: 5, doors: [[2, 4]], scene: 'Workshop' }, // a process: ordered steps on a belt
  museum: { paint: 'museum', w: 8, h: 6, doors: [[3, 5], [4, 5]], scene: 'Museum' }, // a story in time
  cave: { paint: 'cave', w: 5, h: 4, doors: [[2, 3]] }, // an optional deep dive
  home: { paint: 'home', w: 5, h: 5, doors: [[2, 4]] }, // an expert's home: a person who explains (see course.js)
};
const LEAGUE = { paint: 'league', w: 8, h: 5, doors: [[3, 4], [4, 4]] };

// Distances are kept short on purpose: a district's plaza is a few seconds' walk from the square.
export function generate(C = COURSE) {
  const GW = 160, GH = 140, cx = 80, cy = 70;
  const m = Array.from({ length: GH }, () => Array(GW).fill('g'));
  const at = (x, y) => m[y]?.[x];
  // Nothing stands in front of a door (WORLD.md): the tiles below every door and the front of every house are
  // reserved before anything else is placed. No landscape puts water, cliff, tree, bush or fence on them,
  // and lamps, signs and benches that land on them are moved (see `settle` below).
  const reserved = new Set();
  const reserveFront = ({ x, y, w, h, doors }) => {
    for (const [dx, dy] of doors) for (let j = 1; j <= 3; j++) for (let i = -1; i <= 1; i++) reserved.add((dy + j) * GW + dx + i);
    for (let j = 0; j < 2; j++) for (let i = 0; i < w; i++) reserved.add((y + h + j) * GW + x + i);
  };
  const set = (x, y, ch) => { if (x >= 0 && y >= 0 && x < GW && y < GH && !(reserved.has(y * GW + x) && '~ReTbF'.includes(ch))) m[y][x] = ch; };
  const fill = (x0, y0, x1, y1, ch) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) set(x, y, ch); };
  // a road never erases a plaza, and over water it becomes a bridge
  const road = (x0, y0, x1, y1) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) { const c = at(x, y); if (c !== 'c') set(x, y, c === '~' ? 'w' : 'p'); } };
  const buildings = [], lamps = [], signs = [], npcs = [], monuments = [], quarters = [], props = [], boxes = [];
  const n = C.districts.length;
  if (n < 1 || n > 4) throw new Error('A course has 1 to 4 districts.');
  const seed = [...C.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const jit = (k) => Math.round((hashI(seed, k, 3) - 0.5) * 2);
  // a winding lane, two tiles wide, from a to b
  const trail = (ax, ay, bx, by, bend = 1.6) => {
    const len = Math.hypot(bx - ax, by - ay), steps = Math.max(2, Math.ceil(len * 2)), px = -(by - ay) / (len || 1), py = (bx - ax) / (len || 1);
    for (let i = 0; i <= steps; i++) { const t = i / steps, o = Math.sin(t * Math.PI * 2) * bend * Math.min(1, len / 10), x = Math.round(ax + (bx - ax) * t + px * o), y = Math.round(ay + (by - ay) * t + py * o); road(x, y, x + 1, y + 1); if (i % 14 === 7 && len > 9) lamps.push([Math.round(x + px * 2.4), Math.round(y + py * 2.4)]); }
  };
  const blob = (ox, oy, rx, ry, fn, wob = 0.18) => { for (let y = Math.floor(oy - ry - 2); y <= oy + ry + 2; y++) for (let x = Math.floor(ox - rx - 2); x <= ox + rx + 2; x++) { const d = Math.hypot((x - ox) / rx, (y - oy) / ry) + (noise2(x * 0.35, y * 0.35, seed) - 0.5) * wob * 2; fn(x, y, d); } };

  // ---- the square ----
  const hub = { x0: cx - 5, y0: cy - 3, x1: cx + 4, y1: cy + 2 };
  fill(hub.x0, hub.y0, hub.x1, hub.y1, 'c');
  [[hub.x0, hub.y1], [hub.x1, hub.y1]].forEach(([x, y]) => set(x, y, 'g')); // soften the lower corners
  monuments.push({ x: cx - 1, y: cy - 1, kind: C.hub.monument || 'fountain', title: C.hub.name, lines: [C.title, C.bigIdea] });
  const g = C.hub.guide;
  npcs.push({ id: 'guide', name: g.name, x: cx + 2, y: cy + 1, dir: 'down', look: g.look || 'mentor' });
  const lg = { id: 'league', kind: 'league', name: C.league.name, label: 'LEAGUE', paint: LEAGUE.paint, x: cx, y: hub.y0 - LEAGUE.h, w: LEAGUE.w, h: LEAGUE.h, open: false, league: true };
  lg.doors = LEAGUE.doors.map(([dx, dy]) => [lg.x + dx, lg.y + dy]);
  const home = { id: 'home', name: `${g.name}'s house`, paint: 'cottage', x: cx - 6, y: hub.y0 - 4, w: 4, h: 4, open: false, home: true };
  home.doors = [[home.x + 1, home.y + 3]];
  buildings.push(lg, home);
  reserveFront(lg); reserveFront(home);
  boxes.push([cx - 8, hub.y0 - 7, cx + 9, hub.y1 + 1]);
  lamps.push([hub.x0, hub.y0], [hub.x1 + 1, hub.y1], [hub.x0 - 1, hub.y1]);
  props.push([hub.x0 + 2, hub.y1, 'bench'], [hub.x1 - 2, hub.y1, 'bench']);
  signs.push({ b: 'league', x: cx + 2, y: hub.y0, lines: [C.hub.name.toUpperCase(), C.bigIdea, 'Tab opens the map.'] });

  // ---- districts: a small plaza with its landmark, houses around it ----
  // local layout (plaza centre = 0,0): two houses above the plaza, two below at its sides
  const SLOT = { 1: ['N'], 2: ['W', 'E'], 3: ['W', 'N', 'E'], 4: ['W', 'N', 'E', 'S'] }[n];
  let order = 0;
  const riverOf = C.districts.find((x) => x.nature === 'river') || C.districts[0];
  C.districts.forEach((d, i) => {
    if (d.places.length < 1 || d.places.length > 4) throw new Error(`District "${d.id}" needs 1 to 4 places.`);
    const ks = d.places.map((p) => { const k = KINDS[p.kind]; if (!k) throw new Error(`Place "${p.id}": kind must be one of ${Object.keys(KINDS).join(', ')}.`); return k; });
    // where each house stands, relative to the plaza
    const spot = ks.map((k, j) => (j === 0 ? { x: -1 - k.w, b: -3 } : j === 1 ? { x: 1, b: -4 } : j === 2 ? { x: -7 - k.w, b: k.h } : { x: 6, b: k.h }));
    const ext = { l: Math.min(-5, ...spot.map((s) => s.x - 1)), r: Math.max(4, ...spot.map((s, j) => s.x + ks[j].w)), t: Math.min(-2, ...spot.map((s, j) => s.b - ks[j].h)), b: Math.max(3, ...spot.map((s) => s.b + 2)) };
    const slot = SLOT[i];
    const gap = d === riverOf ? 6 : 0; // room for the river and its bridge
    const ax = slot === 'W' ? hub.x0 - 4 - gap - ext.r : slot === 'E' ? hub.x1 + 5 + gap - ext.l : cx + jit(i) * 2;
    const ay = slot === 'N' ? hub.y0 - 9 - gap - ext.b : slot === 'S' ? hub.y1 + 4 + gap - ext.t : cy + 1 + jit(i + 7) * 2;
    const L = (x, y) => [ax + x, ay + y];
    ks.forEach((k, j) => { const bx = ax + spot[j].x, by = ay + spot[j].b - k.h + 1; reserveFront({ x: bx, y: by, w: k.w, h: k.h, doors: k.doors.map(([dx, dy]) => [bx + dx, by + dy]) }); });
    boxes.push([ax + ext.l - 1, ay + ext.t - 1, ax + ext.r + 1, ay + ext.b + 1]);
    d._a = { ax, ay, ext, slot, ks, spot, L };
  });

  // landscapes first, so that plazas, lanes and houses are drawn over them
  const inBox = (x, y, pad = 0) => boxes.some(([x0, y0, x1, y1]) => x >= x0 - pad && x <= x1 + pad && y >= y0 - pad && y <= y1 + pad);
  for (const d of C.districts) {
    const { ax, ay, ext } = d._a, mx = ax + (ext.l + ext.r) / 2, my = ay + (ext.t + ext.b) / 2, rx = (ext.r - ext.l) / 2 + 3, ry = (ext.b - ext.t) / 2 + 3;
    if (d.nature === 'hill') {
      blob(mx, my, rx, ry, (x, y, k) => { if (k < 1) set(x, y, 'r'); });
      for (let y = 1; y < GH - 1; y++) for (let x = 1; x < GW - 1; x++) if (at(x, y) === 'r') { if (at(x, y + 1) === 'g') set(x, y + 1, 'R'); else if (at(x - 1, y) === 'g' || at(x + 1, y) === 'g' || at(x, y - 1) === 'g') set(x, y, 'e'); }
    } else if (d.nature === 'forest') blob(mx, my, rx + 1, ry + 1, (x, y, k) => { if (k > 0.82 && k < 1.12 && at(x, y) === 'g' && hashI(x, y, 4) < 0.8) set(x, y, 'T'); }, 0.22);
    else if (d.nature === 'meadow') blob(mx, my, rx, ry, (x, y, k) => { if (at(x, y) !== 'g') return; if (k > 0.94 && k < 1.02 && noise2(x * 0.2, y * 0.2, 9) > 0.45) set(x, y, 'F'); else if (k < 0.94 && hashI(x, y, 5) < 0.3) set(x, y, 'f'); });
    else if (d.nature === 'shore') { const side = mx < cx ? -1 : 1, lx = mx + side * (rx + 3), put = (x, y, k) => { if (inBox(x, y)) return; if (k < 0.72) set(x, y, '~'); else if (k < 1 && at(x, y) === 'g') set(x, y, 's'); }; blob(lx, my, 5.5, ry + 1, put, 0.2); }
    else if (d.nature !== 'river') throw new Error(`District "${d.id}": nature must be one of river, shore, forest, meadow, hill.`);
  }
  // the river: it runs between the square and one district (the one whose cue is a river, or the
  // first), winds across the map and ends in a pond at each end. Lanes cross it on bridges.
  {
    const { ax, ay, ext, slot } = riverOf._a, vert = slot === 'W' || slot === 'E';
    const mid = vert ? (slot === 'W' ? (ax + ext.r + 1 + hub.x0 - 3) / 2 : (hub.x1 + 4 + ax + ext.l - 1) / 2) : (slot === 'N' ? (ay + ext.b + 1 + hub.y0 - 8) / 2 : (hub.y1 + 2 + ay + ext.t - 1) / 2);
    const c0 = vert ? cy : cx;
    for (const dir of [-1, 1]) {
      let ex = 0, ey = 0;
      for (let t = 0; t < 14; t += 0.5) {
        const w = Math.sin(t / 3.5 + (dir > 0 ? 0 : 1.3)) * Math.min(2.2, t / 5), u = c0 + dir * t, x = vert ? mid + w : u, y = vert ? u : mid + w;
        if (t > 8 && inBox(Math.round(x), Math.round(y), 1)) break;
        ex = x; ey = y;
        blob(x, y, 1.3, 1.3, (X, Y, k) => { if (k < 1 && !inBox(X, Y)) set(X, Y, '~'); }, 0.08);
      }
      blob(ex, ey, 3.4, 2.6, (X, Y, k) => { if (inBox(X, Y)) return; if (k < 0.8) set(X, Y, '~'); else if (k < 1.1 && at(X, Y) === 'g' && hashI(X, Y, 8) < 0.5) set(X, Y, 'f'); }, 0.2);
    }
  }

  C.districts.forEach((d, i) => {
    const { ax, ay, ext, slot, ks, spot, L } = d._a;
    fill(...L(-4, -1), ...L(3, 2), 'c');
    const first = order + 1;
    d.places.forEach((p, j) => {
      const k = ks[j], s = spot[j], bx = ax + s.x, by = ay + s.b - k.h + 1;
      const b = { id: p.id, kind: p.kind, name: p.name, label: (p.sign || p.name).toUpperCase().slice(0, 9), paint: k.paint, scene: k.scene, x: bx, y: by, w: k.w, h: k.h, open: true, district: d.id, di: i, dj: j, emblem: p.emblem, order: ++order, trade: p.trade, expert: p.expert?.name, nature: d.nature };
      b.doors = k.doors.map(([dx, dy]) => [bx + dx, by + dy]);
      buildings.push(b);
      const d0 = b.doors[0][0] - ax, d1 = b.doors[b.doors.length - 1][0] - ax, row = s.b + 1;
      if (j === 0) road(...L(d0, row), ...L(Math.max(d1, -2), row));
      else if (j === 1) { road(...L(d0, row), ...L(d1, row + 1)); road(...L(-2, -2), ...L(d1, -2)); }
      else if (j === 2) { road(...L(d0, row), ...L(-4, row)); road(...L(-4, 3), ...L(-4, row)); }
      else { road(...L(3, row), ...L(d1, row)); road(...L(3, 3), ...L(3, row)); }
      if (j === 0) road(...L(-2, -2), ...L(-2, -2));
      signs.push({ b: b.id, x: ax + (j % 2 === 0 ? d0 - 1 : d1 + 1), y: ay + row, lines: [`${b.order}. ${p.name.toUpperCase()}`, p.concept, p.objective ? `Here you learn to: ${lower(p.objective)}` : null].filter(Boolean) });
    });
    monuments.push({ x: ax - 1, y: ay, kind: d.landmark || 'obelisk', title: d.name, lines: [d.name.toUpperCase(), d.idea, ...d.places.map((p, j) => `${first + j}. ${p.name}: ${p.concept}`)] });
    lamps.push(L(-5, 2), L(4, -1));
    props.push([ax + 2, ay + 2, 'bench']);
    if (d.resident) npcs.push({ id: `res-${d.id}`, name: d.resident.name, x: ax + 2, y: ay, dir: 'down', look: d.resident.look || 'kid' });
    // the lane from the square
    if (slot === 'N') { road(cx - 2, hub.y0 - 8, cx - 1, hub.y0 - 1); trail(cx - 2, hub.y0 - 8, ax - 1, ay + 3); signs.push({ x: ax + 1, y: ay + 4, lines: [d.name.toUpperCase(), d.idea] }); }
    else if (slot === 'S') { trail(cx - 1, hub.y1 + 1, ax - 7, ay - 1); road(ax - 7, ay - 1, ax - 5, ay); signs.push({ x: ax - 6, y: ay - 2, lines: [d.name.toUpperCase(), d.idea] }); }
    else { const sd = slot === 'W' ? 1 : -1, ex = ax + (sd > 0 ? 4 : -6); trail(sd > 0 ? hub.x0 - 2 : hub.x1 + 1, cy - 1, ex, ay - 1); signs.push({ x: ax + (sd > 0 ? 6 : -7), y: ay - 2, lines: [d.name.toUpperCase(), d.idea] }); }
    quarters.push({ id: d.id, name: d.name, x0: ax + ext.l - 1, y0: ay + ext.t - 1, x1: ax + ext.r + 1, y1: ay + ext.b + 1 });
    delete d._a;
  });

  // review meadow (tall grass): the first free spot near the square
  const spots = [[cx, hub.y1 + 6], [cx - 12, hub.y1 + 6], [cx + 12, hub.y1 + 6], [cx + 13, hub.y0 - 9], [cx - 13, hub.y0 - 9]];
  const [gx, gy] = spots.find(([x, y]) => !boxes.slice(1).some(([x0, y0, x1, y1]) => x + 6 >= x0 && x - 6 <= x1 && y + 3 >= y0 && y - 3 <= y1)) || spots[0];
  blob(gx, gy, 5, 2.4, (x, y, k) => { if (k < 1 && at(x, y) === 'g') set(x, y, 'G'); }, 0.15);
  trail(cx + (gx > cx ? 3 : gx < cx ? -4 : -1), gy < cy ? hub.y0 - 1 : hub.y1 + 1, gx - 1, gy + (gy < cy ? 2 : -3), 0.6);
  signs.push({ x: gx + 3, y: gy + (gy < cy ? 3 : -3), lines: ['REVIEW MEADOW', 'Quick questions hide in the tall grass, only about houses you have visited. G switches them off.'] });

  // ---- crop, forest edge, greenery ----
  let x0 = GW, y0 = GH, x1 = 0, y1 = 0;
  const grow = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (m[y][x] !== 'g') grow(x, y);
  buildings.forEach((b) => { grow(b.x - 1, b.y - 2); grow(b.x + b.w, b.y + b.h + 1); });
  x0 -= 6; y0 -= 6; x1 += 6; y1 += 6;
  const W = x1 - x0 + 1, Hh = y1 - y0 + 1, sh = ([x, y, ...r]) => [x - x0, y - y0, ...r];
  const taken = new Set();
  buildings.forEach((b) => { b.x -= x0; b.y -= y0; b.doors = b.doors.map(sh); for (let y = b.y - 1; y <= b.y + b.h + 1; y++) for (let x = b.x - 1; x <= b.x + b.w; x++) taken.add(`${x},${y}`); });
  const out = [];
  for (let y = 0; y < Hh; y++) out.push(m[y + y0].slice(x0, x0 + W));
  const free = (x, y) => out[y]?.[x] === 'g' && !taken.has(`${x},${y}`);
  // lamps, signs and benches never stand on a reserved tile: one that does moves to the nearest free tile
  const res = new Set([...reserved].map((k) => `${(k % GW) - x0},${Math.floor(k / GW) - y0}`));
  const settle = (list, chars, pos = (p) => p, move = (p, x, y) => [x, y, ...p.slice(2)]) => {
    const key = (x, y) => `${x},${y}`;
    list.forEach((p) => { const [x, y] = pos(p); if (!res.has(key(x, y))) taken.add(key(x, y)); });
    return list.map((p) => {
      const [x, y] = pos(p);
      if (!res.has(key(x, y))) return p;
      for (let d = 1; d <= 4; d++) for (let j = -d; j <= d; j++) for (let i = -d; i <= d; i++) {
        const X = x + i, Y = y + j;
        if (Math.max(Math.abs(i), Math.abs(j)) !== d || res.has(key(X, Y)) || taken.has(key(X, Y)) || !chars.includes(out[Y]?.[X] ?? '#')) continue;
        taken.add(key(X, Y));
        return move(p, X, Y);
      }
      return null;
    }).filter(Boolean);
  };
  const LAMPS = settle(lamps.map(sh).filter(([x, y]) => free(x, y) || out[y]?.[x] === 'c'), 'gc');
  const own = signs.filter((s) => s.b).map((s) => ({ ...s, x: s.x - x0, y: s.y - y0 })); // a house's own signpost stands by its door, where it belongs
  own.forEach((o) => taken.add(`${o.x},${o.y}`));
  const SIGNS = [...own, ...settle(signs.filter((s) => !s.b).map((s) => ({ ...s, x: s.x - x0, y: s.y - y0 })), 'g', (o) => [o.x, o.y], (o, x, y) => ({ ...o, x, y }))];
  const NPCS = npcs.map((p) => ({ ...p, x: p.x - x0, y: p.y - y0 })), MONUMENTS = monuments.map((p) => ({ ...p, x: p.x - x0, y: p.y - y0 })), PROPS = settle(props.map(sh), 'gc');
  res.forEach((k) => taken.add(k)); // no tree, bush or rock grows in front of a door
  [...LAMPS, ...SIGNS.map((s) => [s.x, s.y]), ...NPCS.map((p) => [p.x, p.y]), ...MONUMENTS.flatMap((p) => [[p.x, p.y], [p.x + 1, p.y]]), ...PROPS].forEach(([x, y]) => taken.add(`${x},${y}`));
  const near = (x, y, chars, r = 1) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const c = out[y + j]?.[x + i]; if (c && chars.includes(c)) return true; } return false; };
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const edge = Math.min(x, y, W - 1 - x, Hh - 1 - y) + (noise2(x * 0.3, y * 0.3, 2) - 0.5) * 3;
    if (edge < 2.2) { if ('gfG'.includes(out[y][x])) out[y][x] = 'T'; continue; }
    if (!free(x, y) || near(x, y, 'pcwG')) continue;
    // groves, not confetti: trees gather where a slow noise field is high, and toward the edge of the map
    const grove = noise2(x * 0.16, y * 0.16, seed + 5), r = hashI(x, y, 1), water = near(x, y, '~', 2);
    const pTree = edge < 6 ? 0.5 - edge * 0.07 : grove > 0.74 ? 0.38 : 0.01;
    if (r < pTree && !water) out[y][x] = 'T';
    else if (r < pTree + (near(x, y, 'T') ? 0.12 : 0.012)) out[y][x] = 'b';
    else if (r < pTree + 0.05 + (water ? 0.25 : 0) + (grove < 0.3 ? 0.1 : 0)) out[y][x] = 'f';
    else if (water && hashI(x, y, 6) < 0.06) PROPS.push([x, y, 'boulder']);
  }
  return {
    W, H: Hh, TERRAIN: out.map((r) => r.join('')), BUILDINGS: buildings, LAMPS, SIGNS, NPCS, MONUMENTS, PROPS,
    QUARTERS: quarters.map((q) => ({ ...q, x0: q.x0 - x0, y0: q.y0 - y0, x1: q.x1 - x0, y1: q.y1 - y0 })),
    START: { x: cx - 1 - x0, y: cy + 1 - y0, dir: 'up' }, HUB: { x: cx - x0, y: cy - y0 },
  };
}

// smooth value noise in 0..1
function noise2(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = hashI(xi, yi, s), b = hashI(xi + 1, yi, s), c = hashI(xi, yi + 1, s), d = hashI(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function hashI(x, y, s) { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2147483647)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return ((h >>> 0) % 10000) / 10000; }
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

const G = generate();
export const TOWN = G; // the same data as one object (scripts that build other towns call generate(course) themselves)
export const MAP_W = G.W, MAP_H = G.H;
export const { TERRAIN, BUILDINGS, LAMPS, SIGNS, NPCS, MONUMENTS, QUARTERS, PROPS, START, HUB } = G;

export function terrainAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return 'T';
  return TERRAIN[y][x];
}

// Which district a tile belongs to (for the place name in the corner of the screen).
export function quarterAt(x, y) { return QUARTERS.find((q) => x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1) || null; }
