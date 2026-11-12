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
};
const LEAGUE = { paint: 'league', w: 8, h: 5, doors: [[3, 4], [4, 4]] };

const QW = 24; // quarter width
const SLOTS = { 1: ['N'], 2: ['W', 'E'], 3: ['W', 'N', 'E'], 4: ['W', 'N', 'E', 'S'] };
const RING = { river: 3, shore: 5, forest: 3, meadow: 2, hill: 3 };

function generate() {
  const GW = 200, GH = 180, cx = 100, cy = 90;
  const m = Array.from({ length: GH }, () => Array(GW).fill('g'));
  const set = (x, y, ch) => { if (x >= 0 && y >= 0 && x < GW && y < GH) m[y][x] = ch; };
  const fill = (x0, y0, x1, y1, ch) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) set(x, y, ch); };
  // a road never erases water: it becomes a bridge
  const road = (x0, y0, x1, y1, ch = 'p') => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) set(x, y, m[y][x] === '~' ? 'w' : ch); };
  const buildings = [], lamps = [], signs = [], npcs = [], monuments = [], quarters = [], props = [];
  const n = COURSE.districts.length;
  if (n < 1 || n > 4) throw new Error('A course has 1 to 4 districts.');
  const slots = SLOTS[n], gapH = n === 4 ? 16 : 10, gapV = 11;
  const hub = { x0: cx - 7, y0: cy - 5, x1: cx + 6, y1: cy + 4 };

  // ---- quarters ----
  const plans = COURSE.districts.map((d, i) => {
    const slot = slots[i], rows = Math.ceil(d.places.length / 2);
    if (d.places.length < 1 || d.places.length > 4) throw new Error(`District "${d.id}" needs 1 to 4 places.`);
    const H = rows === 1 ? 14 : 23, top = slot !== 'N'; // top = plaza on the north side of the quarter
    let qx, qy;
    if (slot === 'N') { qx = cx - 12; qy = hub.y0 - gapV - H; }
    else if (slot === 'S') { qx = cx - 12; qy = hub.y1 + 1 + gapV; }
    else if (slot === 'W') { qx = hub.x0 - gapH - QW; qy = cy - 4; }
    else { qx = hub.x1 + 1 + gapH; qy = cy - 4; }
    return { d, i, slot, rows, H, top, qx, qy };
  });

  // 1. landscape rings first, so that roads and houses are drawn on top of them
  for (const q of plans) {
    const { qx, qy, H, d } = q, t = RING[d.nature];
    if (!t) throw new Error(`District "${d.id}": nature must be one of ${Object.keys(RING).join(', ')}.`);
    const ring = (a, b, ch) => { for (let y = qy - b; y < qy + H + b; y++) for (let x = qx - b; x < qx + QW + b; x++) { const inside = x >= qx - a && x < qx + QW + a && y >= qy - a && y < qy + H + a; if (!inside) set(x, y, ch); } };
    if (d.nature === 'river') ring(1, 3, '~');
    else if (d.nature === 'shore') { ring(0, 2, 's'); ring(2, 5, '~'); fill(qx - 1, qy - 1, qx + QW, qy + H, 's'); fill(qx + 1, qy + 1, qx + QW - 2, qy + H - 2, 'g'); }
    else if (d.nature === 'forest') ring(1, 3, 'T');
    else if (d.nature === 'meadow') { ring(1, 2, 'F'); for (let y = qy; y < qy + H; y++) for (let x = qx; x < qx + QW; x++) if (hashI(x, y, 5) > 0.72) set(x, y, 'f'); }
    else if (d.nature === 'hill') { fill(qx - 1, qy - 1, qx + QW, qy + H, 'r'); ring(1, 2, 'e'); fill(qx - 2, qy + H + 1, qx + QW + 1, qy + H + 2, 'R'); }
    q.ring = t;
  }

  // 2. hub square
  fill(hub.x0, hub.y0, hub.x1, hub.y1, 'c');
  monuments.push({ x: cx - 1, y: cy - 1, kind: COURSE.hub.monument || 'fountain', title: COURSE.hub.name, lines: [COURSE.title, COURSE.bigIdea] });
  lamps.push([hub.x0, hub.y1], [hub.x1, hub.y1], [hub.x0, hub.y0]);
  props.push([hub.x0 + 2, hub.y1, 'bench'], [hub.x1 - 2, hub.y1, 'bench']);
  const g = COURSE.hub.guide;
  npcs.push({ id: 'guide', name: g.name, x: cx + 2, y: cy + 1, dir: 'down', look: g.look || 'mentor' });
  const lg = { id: 'league', kind: 'league', name: COURSE.league.name, label: 'LEAGUE', paint: LEAGUE.paint, x: cx + 1, y: hub.y0 - LEAGUE.h, w: LEAGUE.w, h: LEAGUE.h, open: false, league: true };
  lg.doors = LEAGUE.doors.map(([dx, dy]) => [lg.x + dx, lg.y + dy]);
  buildings.push(lg);
  signs.push({ x: lg.x + 6, y: hub.y0, lines: [COURSE.league.name.toUpperCase(), 'The final check. Come when you have visited the houses.'] });
  const home = { id: 'home', name: `${g.name}'s house`, paint: 'cottage', x: cx - 7, y: hub.y0 - 4, w: 4, h: 4, open: false, home: true };
  home.doors = [[home.x + 1, home.y + 3]];
  buildings.push(home);

  // 3. quarters: plaza, street, houses
  let order = 0;
  for (const q of plans) {
    const { d, slot, qx, qy, H, top, rows } = q;
    const L = (x, y) => [qx + x, qy + y];
    const plazaY0 = top ? 0 : H - 5, monY = top ? 2 : H - 3;
    fill(...L(6, plazaY0), ...L(17, plazaY0 + 4), 'c');
    // bottoms of the house rows and their path rows, nearest the plaza first
    const rowBottom = top ? [12, 21] : [H - 7, H - 16];
    const streetEnd = rowBottom[rows - 1] + 1;
    road(...L(11, top ? 5 : streetEnd), ...L(12, top ? streetEnd : H - 6));
    d.places.forEach((p, k) => {
      const kd = KINDS[p.kind];
      if (!kd) throw new Error(`Place "${p.id}": kind must be one of ${Object.keys(KINDS).join(', ')}.`);
      const row = Math.floor(k / 2), left = k % 2 === 0, bottom = rowBottom[row];
      const x0 = left ? 10 - kd.w : 14;
      const [bx, by] = L(x0, bottom - kd.h + 1);
      const b = { id: p.id, kind: p.kind, name: p.name, label: (p.sign || p.name).toUpperCase().slice(0, 9), paint: kd.paint, scene: kd.scene, x: bx, y: by, w: kd.w, h: kd.h, open: true, district: d.id, order: ++order };
      b.doors = kd.doors.map(([dx, dy]) => [bx + dx, by + dy]);
      buildings.push(b);
      const doorX = b.doors[0][0] - qx;
      road(...L(Math.min(doorX, 11), bottom + 1), ...L(Math.max(doorX + (kd.doors.length - 1), 12), bottom + 1));
      signs.push({ x: qx + doorX + (left ? -1 : kd.doors.length), y: qy + bottom + 2, lines: [`${b.order}. ${p.name.toUpperCase()}`, p.concept, p.objective ? `Here you learn to: ${lower(p.objective)}` : null].filter(Boolean), tidy: true });
    });
    const [mx, my] = L(11, monY);
    monuments.push({ x: mx, y: my, kind: d.landmark || 'obelisk', title: d.name, lines: [d.name.toUpperCase(), d.idea, ...d.places.map((p, k) => `${k + 1 + order - d.places.length}. ${p.name}: ${p.concept}`)] });
    lamps.push(L(6, plazaY0 + (top ? 0 : 4)), L(17, plazaY0 + (top ? 0 : 4)));
    if (d.resident) npcs.push({ id: `res-${d.id}`, name: d.resident.name, x: qx + 15, y: qy + monY, dir: 'down', look: d.resident.look || 'kid' });
    // avenue from the hub to the plaza
    // avenues are lined with trees at regular steps: order you can see
    const line = (xa, ya, xb, yb) => { for (let x = Math.min(xa, xb); x <= Math.max(xa, xb); x += 3) for (let y = Math.min(ya, yb); y <= Math.max(ya, yb); y += 3) if (m[y][x] === 'g') set(x, y, 'A'); };
    if (slot === 'W') { line(qx + QW + q.ring + 2, cy - 3, hub.x0 - 2, cy - 3); line(qx + QW + q.ring + 2, cy + 2, hub.x0 - 2, cy + 2); }
    if (slot === 'E') { line(hub.x1 + 2, cy - 3, qx - q.ring - 2, cy - 3); line(hub.x1 + 2, cy + 2, qx - q.ring - 2, cy + 2); }
    if (slot === 'S') { line(cx - 3, hub.y1 + 2, cx - 3, qy - q.ring - 2); line(cx + 2, hub.y1 + 2, cx + 2, qy - q.ring - 2); }
    if (slot === 'N') { road(cx - 1, qy + H, cx, hub.y0 - 1); lamps.push([cx + 1, hub.y0 - 6]); signs.push({ x: cx - 2, y: qy + H + q.ring, lines: [d.name.toUpperCase(), d.idea] }); }
    else if (slot === 'S') { road(cx - 1, hub.y1 + 1, cx, qy - 1); lamps.push([cx + 1, hub.y1 + 6]); signs.push({ x: cx - 2, y: qy - q.ring - 1, lines: [d.name.toUpperCase(), d.idea] }); }
    else if (slot === 'W') { road(qx + 18, cy - 1, hub.x0 - 1, cy); lamps.push([hub.x0 - 5, cy - 2]); signs.push({ x: qx + QW + q.ring, y: cy - 2, lines: [d.name.toUpperCase(), d.idea] }); }
    else { road(hub.x1 + 1, cy - 1, qx + 5, cy); lamps.push([hub.x1 + 5, cy - 2]); signs.push({ x: qx - q.ring - 1, y: cy - 2, lines: [d.name.toUpperCase(), d.idea] }); }
    quarters.push({ id: d.id, name: d.name, x0: qx - 1, y0: qy - 1, x1: qx + QW, y1: qy + H });
  }

  // 4. review meadows (tall grass): quick questions about houses already visited
  if (!plans.some((q) => q.slot === 'S')) { fill(cx - 6, hub.y1 + 4, cx + 5, hub.y1 + 9, 'G'); road(cx - 1, hub.y1 + 1, cx, hub.y1 + 3); signs.push({ x: cx + 1, y: hub.y1 + 3, lines: ['REVIEW MEADOW', 'Quick questions hide in the tall grass, only about houses you have visited. G switches them off.'] }); }
  else { fill(hub.x0 - 9, cy + 3, hub.x0 - 2, cy + 8, 'G'); fill(hub.x1 + 3, cy + 3, hub.x1 + 10, cy + 8, 'G'); signs.push({ x: hub.x0 - 1, y: cy + 2, lines: ['REVIEW MEADOWS', 'Quick questions hide in the tall grass, only about houses you have visited. G switches them off.'] }); }
  signs.push({ x: cx + 2, y: hub.y0 + 1, lines: [COURSE.hub.name.toUpperCase(), COURSE.bigIdea, 'Tab opens the map.'] });

  // 5. crop to what is used, add a forest border
  let x0 = GW, y0 = GH, x1 = 0, y1 = 0;
  const grow = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (m[y][x] !== 'g') grow(x, y);
  buildings.forEach((b) => { grow(b.x, b.y - 2); grow(b.x + b.w, b.y + b.h); });
  x0 -= 5; y0 -= 5; x1 += 5; y1 += 5;
  const W = x1 - x0 + 1, Hh = y1 - y0 + 1;
  const sh = ([x, y, ...r]) => [x - x0, y - y0, ...r];
  const out = [];
  const taken = new Set();
  buildings.forEach((b) => { b.x -= x0; b.y -= y0; b.doors = b.doors.map(sh); for (let y = b.y - 1; y <= b.y + b.h; y++) for (let x = b.x - 1; x <= b.x + b.w; x++) taken.add(`${x},${y}`); });
  const LAMPS = lamps.map(sh), SIGNS = signs.map((s) => ({ ...s, x: s.x - x0, y: s.y - y0 }));
  const NPCS = npcs.map((p) => ({ ...p, x: p.x - x0, y: p.y - y0 })), MONUMENTS = monuments.map((p) => ({ ...p, x: p.x - x0, y: p.y - y0 }));
  [...LAMPS, ...SIGNS.map((s) => [s.x, s.y]), ...NPCS.map((p) => [p.x, p.y]), ...MONUMENTS.flatMap((p) => [[p.x, p.y], [p.x + 1, p.y]]), ...props.map(sh)].forEach(([x, y]) => taken.add(`${x},${y}`));
  for (let y = 0; y < Hh; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      let ch = m[y + y0][x + x0];
      if (x < 2 || y < 2 || x >= W - 2 || y >= Hh - 2) ch = 'T';
      if (ch === 'A') ch = 'T';
      row.push(ch);
    }
    out.push(row);
  }
  // 6. scatter trees, bushes and flowers on open grass, never next to a road, a door or a sign
  const nearRoad = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const c = out[y + j]?.[x + i]; if (c && 'pcwG'.includes(c)) return true; } return false; };
  for (let y = 2; y < Hh - 2; y++) for (let x = 2; x < W - 2; x++) {
    if (out[y][x] !== 'g' || taken.has(`${x},${y}`) || nearRoad(x, y)) continue;
    const r = hashI(x, y, 1), edge = Math.min(x, y, W - 1 - x, Hh - 1 - y), inQuarter = quarters.some((q) => x + x0 >= q.x0 && x + x0 <= q.x1 && y + y0 >= q.y0 && y + y0 <= q.y1);
    const pTree = inQuarter ? 0.03 : edge < 8 ? 0.42 - edge * 0.05 : 0.008;
    if (r < pTree) out[y][x] = 'T'; else if (r < pTree + 0.012) out[y][x] = 'b'; else if (r < pTree + 0.04) out[y][x] = 'f';
  }
  return {
    W, H: Hh, TERRAIN: out.map((r) => r.join('')), BUILDINGS: buildings, LAMPS, SIGNS, NPCS, MONUMENTS,
    QUARTERS: quarters.map((q) => ({ ...q, x0: q.x0 - x0, y0: q.y0 - y0, x1: q.x1 - x0, y1: q.y1 - y0 })),
    PROPS: props.map(sh), START: { x: cx - 1 - x0, y: cy + 2 - y0, dir: 'up' }, HUB: { x: cx - x0, y: cy - y0 },
  };
}

function hashI(x, y, s) { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2147483647)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return ((h >>> 0) % 10000) / 10000; }
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

const G = generate();
export const MAP_W = G.W, MAP_H = G.H;
export const { TERRAIN, BUILDINGS, LAMPS, SIGNS, NPCS, MONUMENTS, QUARTERS, PROPS, START, HUB } = G;

export function terrainAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return 'T';
  return TERRAIN[y][x];
}

// Which district a tile belongs to (for the place name in the corner of the screen).
export function quarterAt(x, y) { return QUARTERS.find((q) => x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1) || null; }
