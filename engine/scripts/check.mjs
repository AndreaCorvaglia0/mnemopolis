// Checks the active course before a build:
//   1. the knowledge base itself, with the validator of the knowledge-base skill;
//   2. that every lab station designed in course.json has code;
//   3. that the town can be generated from it.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SLUG } from '../src/course/_data.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const v = spawnSync('node', [path.join(root, 'skills', 'knowledge-base', 'scripts', 'validate.mjs'), path.join(root, 'courses', SLUG)], { stdio: 'inherit' });
if (v.status) process.exit(v.status);

const { LABS, UPPER_LABS } = await import('../src/course/labs.js');
let bad = 0;
for (const [id, lab] of [...Object.entries(LABS), ...Object.entries(UPPER_LABS)]) for (const s of lab.stations) if (!s.coded) { console.log(`ERROR    station "${id}.${s.id}" has no code: export it from courses/${SLUG}/labs/${id}.js`); bad++; }
// the town: it must generate, houses must stand on dry land without overlapping, and every door
// must be reachable on foot from the square
try {
  const m = await import('../src/world/townMap.js');
  const blocked = new Set();
  m.TERRAIN.forEach((row, y) => [...row].forEach((ch, x) => { if ('~ReTbF'.includes(ch)) blocked.add(`${x},${y}`); }));
  for (const b of m.BUILDINGS) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) { const k = `${x},${y}`; if (blocked.has(`B${k}`)) { console.log(`ERROR    town: "${b.id}" overlaps another building`); bad++; } if (m.TERRAIN[y][x] === '~') { console.log(`ERROR    town: "${b.id}" stands in water`); bad++; } blocked.add(k); blocked.add(`B${k}`); }
  [...m.LAMPS, ...m.SIGNS.map((s) => [s.x, s.y]), ...m.PROPS, ...m.MONUMENTS.flatMap((o) => [[o.x, o.y], [o.x + 1, o.y]]), ...m.NPCS.map((o) => [o.x, o.y])].forEach(([x, y]) => blocked.add(`${x},${y}`));
  // the generated dressing (gardens, fences, jetty...): its solid tiles block, its jetty can be walked on,
  // and nothing may get farther or unreachable because of it
  const { GEN } = await import('../src/gen/core.js');
  let L = null;
  if (GEN.dressing) {
    const D = await import('../src/gen/dressing.js');
    L = D.planDressing();
    L.blocked.forEach(([x, y]) => blocked.add(`${x},${y}`)); L.walk.forEach(([x, y]) => blocked.delete(`${x},${y}`));
    const { problems } = D.checkDressing(L);
    problems.forEach((p) => { console.log(`ERROR    dressing: ${p}`); bad++; });
    console.log(`dressing: theme ${L.theme}, ${L.pieces.length} pieces, ${L.blocked.length} solid tiles, ${L.plots.length} plots; ${problems.length ? 'PROBLEMS' : 'no walk got longer'}`);
  } else console.log('dressing: generator off');
  // door approach (WORLD.md, "Nothing stands in front of a door"): the same solidity as the game, base town plus dressing
  const { solidMap, checkDoors } = await import('../src/world/doors.js');
  const door = checkDoors(m.TOWN, solidMap(m.TOWN, L), L);
  door.problems.forEach((p) => { console.log(`ERROR    door approach: ${p.text}`); bad++; });
  door.crowded.forEach((t) => console.log(`warning  door approach: ${t} (houses too close)`));
  console.log(`door approach: ${m.BUILDINGS.reduce((n, b) => n + b.doors.length, 0)} doors, ${door.problems.length ? 'PROBLEMS' : 'all clear and reachable'}`);
  const dist = new Map([[`${m.START.x},${m.START.y}`, 0]]), queue = [[m.START.x, m.START.y]];
  while (queue.length) { const [x, y] = queue.shift(), d = dist.get(`${x},${y}`); for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = `${x + i},${y + j}`; if (x + i < 0 || y + j < 0 || x + i >= m.MAP_W || y + j >= m.MAP_H || blocked.has(k) || dist.has(k)) continue; dist.set(k, d + 1); queue.push([x + i, y + j]); } }
  let far = 0;
  for (const b of m.BUILDINGS) { if (b.home) continue; const d = Math.min(...b.doors.map(([x, y]) => dist.get(`${x},${y + 1}`) ?? Infinity)); if (d === Infinity) { console.log(`ERROR    town: the door of "${b.id}" cannot be reached from the square`); bad++; } else far = Math.max(far, d); }
  console.log(`town: ${m.MAP_W} x ${m.MAP_H} tiles, ${m.BUILDINGS.length} buildings, farthest door ${far} steps from the square (about ${Math.round(far * 0.15)} s walking)`);
  if (far > 45) console.log('warning  town: a house is more than 45 steps from the square');
} catch (e) { console.log(`ERROR    the town cannot be generated: ${e.message}`); bad++; }
// the rooms: every generated room must keep its lab door, reading wall, host and exit reachable
try {
  const { GEN } = await import('../src/gen/core.js');
  if (GEN.interior) {
    const { PLACES } = await import('../src/data/content.js');
    const { planRoom, checkRoom } = await import('../src/gen/interior/index.js');
    const rooms = PLACES.filter((p) => p.kind !== 'workshop' && p.kind !== 'museum').map((p) => { const L = planRoom(p); checkRoom(L); return L; }); // throws if a room breaks a rule
    console.log(`rooms: ${rooms.map((L) => `${L.id} ${L.plan} ${L.w}x${L.h} (${L.zones.map((z) => z.name).join(', ')})`).join('; ')}`);
    // upper floors (mechanics/floors/): the same rules, with the stairs down as the exit
    const { floorsOf } = await import('../src/mechanics/floors/plan.js');
    const ups = PLACES.filter((p) => p.kind !== 'workshop' && p.kind !== 'museum' && floorsOf(p).up).map((p) => { const L = planRoom(p, { floor: 'up' }); checkRoom(L); return L; });
    console.log(`upper floors: ${ups.map((L) => `${L.id} ${L.plan} ${L.w}x${L.h} (${L.zones.map((z) => z.name).join(', ')})`).join('; ') || 'none'}`);
  } else console.log('rooms: generator off, standard room');
} catch (e) { console.log(`ERROR    ${e.message}`); bad++; }
// ambient life (src/mechanics/): obstacles never in the way of the course (with them closed, every
// lane, plaza, door step and the tiles beside people, signs and landmarks keep their walking distance;
// open, what is behind is reachable), every secret's trigger reachable on foot and near a lane,
// animal spots never on a door approach
try {
  const { LIFE } = await import('../src/mechanics/config.js');
  if (LIFE.on) {
    const { lifePlan, checkActiveLife } = await import('../src/mechanics/active.js');
    const plan = lifePlan(), problems = checkActiveLife();
    problems.forEach((p) => { console.log(`ERROR    life: ${p}`); bad++; });
    const n = plan.secrets.filter((x) => x.kind !== 'sealed').length;
    console.log(`life: ${plan.obstacles.length} obstacles in town (${plan.obstacles.map((o) => `${o.kind} at ${o.x},${o.y}`).join(', ') || 'none'}), ${plan.closets.length} in rooms (${plan.closets.map((o) => o.place).join(', ') || 'none'}); ${n} secrets (${plan.secrets.filter((x) => x.kind !== 'sealed').map((x) => x.kind).join(', ')}) and ${plan.secrets.length - n} sealed; ${plan.animals.town.length} animals (${plan.animals.town.map((a) => a.kind).join(', ')})${plan.animals.inside.length ? ', a cat asleep indoors' : ''}; ${problems.length ? 'PROBLEMS' : 'nothing in the way, everything reachable'}`);
  } else console.log('life: off');
} catch (e) { console.log(`ERROR    life: ${e.message}`); bad++; }
process.exit(bad ? 1 : 0);
