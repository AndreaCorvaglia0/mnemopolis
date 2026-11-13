// The ambient-life plan of a town: obstacles, secrets and animal spots, as plain data. Node-safe.
//   planLife(town, L, theme, seed, o)   any town (the stress test plans hundreds)
//   lifePlan()                          the active course's town, cached (the game and check.mjs)
//   checkLife(town, L, plan)            the rules, as a list of problems (empty when fine)
// Life adds nothing solid to the town except the obstacles (and the hedge of a locked garden),
// which stand only at the mouth of optional nooks: checkLife proves that no tile the course needs
// is lost or one step farther, with the obstacles closed.
import { lifeContext, distances, N4, N8 } from './context.js';
import { planObstacles, roomObstacle } from './obstacles/place.js';
import { planSecrets, MAX_LANE } from './secrets/place.js';
import { planAnimals } from './animals/place.js';
import { solidMap, checkDoors } from '../world/doors.js';
import { seeded } from '../gen/core.js';
import { REWARDS } from './obstacles/kinds.js';

export function planLife(town, L, theme, seed, { life = { on: true, musings: true, animals: true, secrets: true, obstacles: true, notes: [] }, places = 0, rooms = [], uppers = [] } = {}) {
  const c = lifeContext(town, L), used = new Set();
  const obstacles = life.obstacles ? planObstacles(c, seed, { places: places || town.BUILDINGS.length - 2 }) : [];
  const solid = c.solid.slice();
  for (const o of obstacles) {
    for (const [x, y] of [...o.tiles, ...o.ring]) solid[c.I(x, y)] = 1;
    for (const [x, y] of [...o.tiles, ...o.ring, ...o.pocket, o.stand]) used.add(`${x},${y}`);
  }
  const d = distances(c, solid);
  // a locked little door in one or two rooms
  const closets = [];
  if (life.obstacles) {
    const rr = seeded('life:closets', seed), order = rooms.map((x) => x).sort(() => 0);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rr() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const want = rooms.length > 6 ? 2 : 1, RW = Object.keys(REWARDS);
    for (const { place, L: R } of order) {
      if (closets.length >= want) break;
      const o = roomObstacle(R, seed);
      if (o) closets.push({ ...o, id: `cl${closets.length}`, place: place.id, floor: 'ground', prize: RW[Math.floor(rr() * RW.length)] });
    }
    // no tidy wall downstairs (stairs and locks took it): an attic, if a house has one
    for (const { place, L: R } of uppers) {
      if (closets.length) break;
      const o = roomObstacle(R, seed);
      if (o) closets.push({ ...o, id: `cl${closets.length}`, place: place.id, floor: 'up', prize: RW[Math.floor(rr() * RW.length)] });
    }
  }
  const secrets = life.secrets ? planSecrets(c, seed, { used, solid, d, notes: life.notes || [], rooms, obstacles, closets }) : [];
  const animals = life.animals ? planAnimals(c, theme, seed, { used, rooms }) : { town: [], inside: [] };
  return { obstacles, closets, secrets, animals, blocked: obstacles.flatMap((o) => [...o.tiles, ...o.ring]) };
}

export function checkLife(town, L, plan) {
  const c = lifeContext(town, L), problems = [], closed = c.solid.slice(), open = c.solid.slice();
  const lost = new Set();
  for (const o of plan.obstacles) {
    for (const [x, y] of o.tiles) { closed[c.I(x, y)] = 1; if (c.approach[c.I(x, y)]) problems.push(`obstacle ${o.id} stands in front of a door at ${x},${y}`); if (c.target[c.I(x, y)]) problems.push(`obstacle ${o.id} stands on a tile the course needs at ${x},${y}`); }
    for (const [x, y] of o.ring) { closed[c.I(x, y)] = 1; open[c.I(x, y)] = 1; if (c.approach[c.I(x, y)] || c.target[c.I(x, y)]) problems.push(`the hedge of ${o.id} stands on a needed tile at ${x},${y}`); }
    for (const [x, y] of o.pocket) { lost.add(c.I(x, y)); if (c.target[c.I(x, y)]) problems.push(`obstacle ${o.id} closes off a tile the course needs at ${x},${y}`); }
  }
  const d1 = distances(c, closed), d2 = distances(c, open);
  let changed = 0, cut = 0;
  for (let i = 0; i < d1.length; i++) {
    if (c.d0[i] < 0 || closed[i] || lost.has(i)) continue;
    if (d1[i] < 0) cut++; else if (c.target[i] && d1[i] !== c.d0[i]) changed++;
  }
  if (changed) problems.push(`${changed} tiles the course needs changed their walking distance with the obstacles closed`);
  if (cut) problems.push(`${cut} tiles became unreachable with the obstacles closed`);
  for (const o of plan.obstacles) {
    const [sx, sy] = o.stand;
    if (d1[c.I(sx, sy)] < 0) problems.push(`obstacle ${o.id} cannot be walked up to`);
    if (!o.tiles.some(([x, y]) => Math.abs(x - sx) + Math.abs(y - sy) === 1)) problems.push(`obstacle ${o.id}: its standing tile is not beside it`);
    for (const [x, y] of o.pocket) if (d2[c.I(x, y)] < 0) problems.push(`behind obstacle ${o.id}, ${x},${y} stays unreachable when it is open`);
  }
  for (const s of plan.secrets) {
    if (s.kind === 'painting' || s.room) continue;
    const spots = s.kind === 'prints' ? s.prints : s.kind === 'sealed' ? [] : [[s.x, s.y]];
    for (const [x, y] of spots) {
      if (d1[c.I(x, y)] < 0) problems.push(`secret ${s.id} at ${x},${y} cannot be reached on foot`);
      else if (c.toLane[c.I(x, y)] > MAX_LANE) problems.push(`secret ${s.id} at ${x},${y} is ${c.toLane[c.I(x, y)]} steps from a lane`);
    }
  }
  for (const a of plan.animals.town) for (const [x, y] of a.spots) {
    if (c.approach[c.I(x, y)]) problems.push(`animal ${a.id} sits on a door approach at ${x},${y}`);
    let near = false; for (let j = -4; j <= 4 && !near; j++) for (let i = -4; i <= 4; i++) if (c.inMap(x + i, y + j) && d1[c.I(x + i, y + j)] >= 0) { near = true; break; }
    if (!near) problems.push(`animal ${a.id} at ${x},${y} is out of reach`);
  }
  // the door rule, with the obstacles standing
  const solid = solidMap(town, L);
  for (const [x, y] of plan.blocked) solid[c.I(x, y)] = 1;
  for (const p of checkDoors(town, solid, L).problems) problems.push(`door approach: ${p.text}`);
  return problems;
}

