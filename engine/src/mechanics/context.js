// What the ambient-life planners know about a town: plain data computed once, in Node or in the
// browser. Nothing here changes the town.
//   solid     what the player cannot walk on (the town and its dressing; doors.js decides)
//   d0        steps from the start over free tiles (-1: not reached)
//   approach  door approaches and house fronts ("nothing stands in front of a door", WORLD.md)
//   target    tiles the course needs: lanes, plazas, meadow, bridges, door steps, the tiles beside
//             people, signs and landmarks. Life never puts anything solid on them.
//   toLane    distance (through anything) to the nearest lane, plaza or bridge
//   piece     dressing piece at a tile ("x,y" -> piece), solid or flat
import { solidMap, reach } from '../world/doors.js';

export const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export const N8 = [...N4, [1, 1], [1, -1], [-1, 1], [-1, -1]];

export function lifeContext(town, L = null) {
  const { W, H, TERRAIN } = town, I = (x, y) => y * W + x, inMap = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const ter = (x, y) => (inMap(x, y) ? TERRAIN[y][x] : 'T');
  const solid = solidMap(town, L), d0 = reach(town, solid);
  const approach = new Uint8Array(W * H), target = new Uint8Array(W * H), near = new Uint8Array(W * H);
  const mark = (arr, x, y) => { if (inMap(x, y)) arr[I(x, y)] = 1; };
  for (const b of town.BUILDINGS) {
    for (const [dx, dy] of b.doors) for (let y = dy; y <= dy + 3; y++) for (let x = dx - 1; x <= dx + 1; x++) mark(approach, x, y);
    for (let y = b.y + b.h; y <= b.y + b.h + 1; y++) for (let x = b.x; x < b.x + b.w; x++) mark(approach, x, y);
    for (const [dx, dy] of b.doors) mark(target, dx, dy + 1);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ('pcwG'.includes(TERRAIN[y][x])) target[I(x, y)] = 1;
  const things = [...town.SIGNS.map((s) => [s.x, s.y]), ...town.MONUMENTS.flatMap((m) => [[m.x, m.y], [m.x + 1, m.y]]), ...town.NPCS.map((n) => [n.x, n.y]), ...town.LAMPS, ...town.PROPS];
  for (const [x, y] of things) for (const [dx, dy] of N8) { mark(near, x + dx, y + dy); if (N4.some(([a, b]) => a === dx && b === dy)) mark(target, x + dx, y + dy); }
  mark(near, town.START.x, town.START.y);
  const toLane = new Int16Array(W * H).fill(-1), q = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ('pcw'.includes(TERRAIN[y][x])) { toLane[I(x, y)] = 0; q.push(I(x, y)); }
  for (let h = 0; h < q.length; h++) { const i = q[h], x = i % W, y = (i / W) | 0; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (inMap(nx, ny) && toLane[I(nx, ny)] < 0) { toLane[I(nx, ny)] = toLane[i] + 1; q.push(I(nx, ny)); } } }
  const piece = new Map();
  for (const p of L?.pieces || []) for (let y = p.y; y < p.y + (p.h || 1); y++) for (let x = p.x; x < p.x + (p.w || 1); x++) if (!piece.has(`${x},${y}`) || p.solid) piece.set(`${x},${y}`, p);
  const building = (x, y) => town.BUILDINGS.find((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) || null;
  const quarter = (x, y) => town.QUARTERS.find((o) => x >= o.x0 && x <= o.x1 && y >= o.y0 && y <= o.y1) || null;
  const walk = (x, y) => inMap(x, y) && !solid[I(x, y)];
  const reached = (x, y) => inMap(x, y) && d0[I(x, y)] >= 0;
  return { town, L, W, H, I, inMap, ter, solid, d0, approach, target, near, toLane, piece, building, quarter, walk, reached };
}

// breadth-first distances over a solid grid from the start
export function distances(ctx, solid) {
  const { W, H, town } = ctx, d = new Int16Array(W * H).fill(-1), q = [town.START.y * W + town.START.x];
  d[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (solid[j] || d[j] >= 0) continue; d[j] = d[i] + 1; q.push(j); }
  }
  return d;
}
