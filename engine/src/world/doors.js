// "Nothing stands in front of a door" (engine/docs/WORLD.md). The rule and the solidity data it is judged
// on live here, in plain data, so that the build (scripts/check.mjs) and the stress test
// (scripts/stress-town.mjs) apply the same test in Node, without a browser.
//
// For every door of every building (houses, the guide's house, the league hall):
//   - the tile below the door (where the player stands to use it) is free and reachable on foot, by
//     the same breadth-first search tap-to-walk uses over Town.canEnter;
//   - the 3 tiles below the door row, in the door's column, are free of anything solid;
//   - the tiles at the sides of that corridor (the apron) and the two rows in front of the facade
//     carry nothing solid either, except the house's own signpost: nothing may be drawn over a door,
//     its sign or its number plate. (Another house standing beside the corridor is only crowding: it is
//     reported as a warning, not an error.)
// Solid = what Town.js blocks: water, cliffs, trees, bushes, fences, houses, lamps, signs, benches,
// rocks, landmarks, people, and the solid pieces of the dressing (a jetty is walkable).

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function solidMap(town, L = null) {
  const { W, H } = town, s = new Uint8Array(W * H), put = (x, y, v = 1) => { if (x >= 0 && y >= 0 && x < W && y < H) s[y * W + x] = v; };
  town.TERRAIN.forEach((row, y) => [...row].forEach((ch, x) => { if ('~ReTbF'.includes(ch)) put(x, y); }));
  for (const b of town.BUILDINGS) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) put(x, y);
  [...town.LAMPS, ...town.SIGNS.map((o) => [o.x, o.y]), ...town.PROPS, ...town.MONUMENTS.flatMap((o) => [[o.x, o.y], [o.x + 1, o.y]]), ...town.NPCS.map((o) => [o.x, o.y])].forEach(([x, y]) => put(x, y));
  if (L) { L.blocked.forEach(([x, y]) => put(x, y)); L.walk.forEach(([x, y]) => put(x, y, 0)); }
  return s;
}

// What stands on a tile, in words (for the report).
export function whatIsAt(town, L, x, y) {
  const b = town.BUILDINGS.find((o) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h);
  if (b) return `house "${b.id}"`;
  if (town.LAMPS.some(([a, c]) => a === x && c === y)) return 'lamp post';
  if (town.SIGNS.some((o) => o.x === x && o.y === y)) return 'signpost';
  const p = town.PROPS.find(([a, c]) => a === x && c === y);
  if (p) return p[2];
  if (town.MONUMENTS.some((o) => o.y === y && (o.x === x || o.x + 1 === x))) return 'landmark';
  if (town.NPCS.some((o) => o.x === x && o.y === y)) return 'person';
  const piece = L?.pieces.find((o) => o.solid && x >= o.x && x < o.x + (o.w || 1) && y >= o.y && y < o.y + (o.h || 1));
  if (piece) return `dressing ${piece.t}`;
  return { '~': 'water', R: 'cliff', e: 'rock edge', T: 'tree', b: 'bush', F: 'fence' }[town.TERRAIN[y]?.[x]] || 'something solid';
}

// Distance in steps from the start over free tiles; doors are not entered (they are the goal).
export function reach(town, solid) {
  const { W, H, START } = town, d = new Int16Array(W * H).fill(-1), q = [START.y * W + START.x];
  d[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (solid[j] || d[j] >= 0) continue; d[j] = d[i] + 1; q.push(j); }
  }
  return d;
}

// Returns { problems: [{ id, door, text }] for every way the rule is broken, crowded: [text] for houses too close, dist }.
export function checkDoors(town, solid, L = null) {
  const { W, H } = town, out = [], crowded = [], dist = reach(town, solid), at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 1 : solid[y * W + x]);
  for (const b of town.BUILDINGS) {
    const own = (x, y) => town.SIGNS.some((o) => o.b === b.id && o.x === x && o.y === y);
    const bad = (door, x, y, where) => { if (at(x, y) && !own(x, y)) (whatIsAt(town, L, x, y).startsWith('house') && where.startsWith('beside') ? crowded : out).push({ id: b.id, door, text: `"${b.id}": ${whatIsAt(town, L, x, y)} at ${x},${y} ${where}` }); };
    for (const door of b.doors) {
      const [dx, dy] = door;
      if (at(dx, dy + 1)) bad(door, dx, dy + 1, `on the tile in front of the door ${dx},${dy}`);
      else if (dist[(dy + 1) * W + dx] < 0) out.push({ id: b.id, door, text: `"${b.id}": the tile in front of the door ${dx},${dy} cannot be reached on foot from the start` });
      for (let y = dy + 1; y <= dy + 3; y++) { bad(door, dx, y, `in the corridor below the door ${dx},${dy}`); for (const x of [dx - 1, dx + 1]) bad(door, x, y, `beside the corridor below the door ${dx},${dy}`); }
    }
    for (let y = b.y + b.h; y <= b.y + b.h + 1; y++) for (let x = b.x; x < b.x + b.w; x++) bad(b.doors[0], x, y, 'in front of the facade');
  }
  const seen = new Set();
  return { problems: out.filter((p) => !seen.has(p.text) && seen.add(p.text)), crowded: [...new Set(crowded.map((p) => p.text))], dist };
}
