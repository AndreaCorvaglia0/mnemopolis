// Stress test of the town layout, in Node, no browser: many synthetic courses (seed, 1 to 4 districts,
// 4 to 16 concepts, landscapes, landmarks, kinds of house), in the three visual themes, with the
// dressing off and on, with ambient life planned on the dressed towns. Every town must pass the "door approach" rule (src/world/doors.js) and the
// dressing's own check. Other placement problems are counted and reported, not failed.
//   node scripts/stress-town.mjs [--n=240] [--verbose]        (npm run stress)
import { generate, KINDS } from '../src/world/townMap.js';
import { THEMES } from '../src/gen/core.js';
import { planDressingFor, checkDressing } from '../src/gen/dressing.js';
import { solidMap, checkDoors, whatIsAt } from '../src/world/doors.js';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] ?? d;
const N = +arg('n', 240), verbose = process.argv.includes('--verbose');

import { course } from './synthetic.mjs';
import { planLife, checkLife } from '../src/mechanics/plan.js';
import { planGames, checkGamePlan } from '../src/mechanics/games/place.js';
import { lifeContext } from '../src/mechanics/context.js';
const GAMES3 = [{ id: 'a', kind: 'which' }, { id: 'b', kind: 'estimate', object: 'piano' }, { id: 'c', kind: 'sequence' }];
const gameStats = { towns: 0, placed: 0 };

const life = { towns: 0, obstacles: 0, secrets: 0, animals: 0, min: 99, max: 0, kinds: {} };
const fails = [], notes = { crowded: 0, unreachable: 0, laneProps: 0, farthest: 0, far: 0, lanesCut: 0, gates: 0, noGate: 0, gateFar: 0, harbours: 0, harbourFar: 0 }, causes = new Map();
let towns = 0, bad = 0;
const judge = (label, town, L, theme = null, seed = '') => {
  towns++;
  const solid = solidMap(town, L), { problems, crowded, dist } = checkDoors(town, solid, L), all = problems.map((p) => p.text);
  if (L) { const { problems: dp } = checkDressing(L); all.push(...dp.map((p) => `dressing: ${p}`)); }
  // ambient life (src/mechanics/): obstacles closed and open, secrets and animal spots
  if (L && theme) {
    let plan;
    try { plan = planLife(town, L, theme, seed); all.push(...checkLife(town, L, plan).map((p) => `life: ${p}`)); } catch (e) { all.push(`life: cannot be planned: ${e.message}`); }
    if (plan) {
      const n = plan.secrets.filter((s) => s.kind !== 'sealed').length;
      life.towns++; life.obstacles += plan.obstacles.length; life.secrets += n; life.animals += plan.animals.town.length; life.min = Math.min(life.min, n); life.max = Math.max(life.max, n);
      plan.obstacles.forEach((o) => { life.kinds[o.kind] = (life.kinds[o.kind] || 0) + 1; });
      // mini-games (mechanics/games/place.js): three games in town, around what life placed
      try {
        const c = lifeContext(town, L), used = new Set(), solid = c.solid.slice();
        for (const [x, y] of plan.blocked) solid[c.I(x, y)] = 1;
        for (const sx of plan.secrets) if (sx.x != null && !sx.room) used.add(`${sx.x},${sx.y}`);
        for (const o of plan.obstacles) for (const [x, y] of [...o.tiles, ...o.pocket, o.stand]) used.add(`${x},${y}`);
        const gp = planGames(c, GAMES3, seed, { used, solid }), gp2 = planGames(c, GAMES3, seed, { used, solid });
        if (JSON.stringify(gp) !== JSON.stringify(gp2)) all.push('games: placement is not deterministic');
        all.push(...checkGamePlan(c, gp, plan.blocked).map((p) => `games: ${p}`));
        gameStats.towns++; gameStats.placed += gp.length;
      } catch (e) { all.push(`games: cannot be planned: ${e.message}`); }
    }
  }
  // the road out of town (world/townMap.js GATE): the champion's tile and the gate must be reachable
  if (town.GATE) {
    const g = town.GATE, d = dist[g.stand[1] * town.W + g.stand[0]];
    if (d < 0) all.push(`gate: the champion's tile ${g.stand} cannot be reached from the start`);
    if (g.tiles.some(([x, y]) => solid[y * town.W + x])) all.push(`gate: something solid on the gate at ${g.tiles[0]}`);
    if (!L) { notes.gates++; notes.gateFar = Math.max(notes.gateFar, d); }
    {
      // the road is a dead end: every door keeps exactly its walking distance from the start, with
      // the dressing too (the same theme dresses the town without the road)
      const bare = generate(town.course, { gate: false }), Lb = L && theme ? planDressingFor(bare, theme, town.course.id) : null;
      const dist0 = checkDoors(bare, solidMap(bare, Lb), Lb).dist, shift = [0, 0];
      // the map may have grown on the gate's side: compare in the same coordinates (the square's)
      shift[0] = town.HUB.x - bare.HUB.x; shift[1] = town.HUB.y - bare.HUB.y;
      for (const b of bare.BUILDINGS) for (const [x, y] of b.doors) {
        const a0 = dist0[(y + 1) * bare.W + x], a1 = dist[(y + 1 + shift[1]) * town.W + x + shift[0]];
        if (a0 !== a1) all.push(`gate: the door of "${b.id}" is ${a1} steps away with the road out of town, ${a0} without`);
      }
    }
  } else if (town.HARBOUR) {
    // the story's harbour (world/townMap.js HARBOUR): the quay is reached from the square, the harbour
    // master and the notebook stand on free tiles, the ship lies on water, and the road changed no walk
    const hb = town.HARBOUR, free = ({ x, y }) => !solid[y * town.W + x], d = dist[hb.start.y * town.W + hb.start.x];
    if (d < 0) all.push(`harbour: the quay ${hb.start.x},${hb.start.y} cannot be reached from the square`);
    for (const k of ['master', 'notebook']) if (!free(hb[k])) all.push(`harbour: something solid where the ${k} goes, ${hb[k].x},${hb[k].y} (${whatIsAt(town, L, hb[k].x, hb[k].y)})`);
    if (hb.pier.some((t) => !free(t) || dist[t.y * town.W + t.x] < 0)) all.push('harbour: the pier cannot be walked to its end');
    const sh = hb.ship, wx = Math.floor(sh.cx), wy = Math.floor(sh.bottom - 1);
    for (const [dx, dy] of [[-3, 0], [0, 0], [3, 0]]) if (town.TERRAIN[wy + dy]?.[wx + dx] !== '~') all.push(`harbour: the ship's hull is not on water at ${wx + dx},${wy + dy}`);
    if (!L) { notes.harbours++; notes.harbourFar = Math.max(notes.harbourFar, d); }
    const bare = generate(town.course, { gate: false, harbour: false }), Lb = L && theme ? planDressingFor(bare, theme, town.course.id) : null;
    const dist0 = checkDoors(bare, solidMap(bare, Lb), Lb).dist, shift = [town.HUB.x - bare.HUB.x, town.HUB.y - bare.HUB.y];
    for (const b of bare.BUILDINGS) for (const [x, y] of b.doors) {
      const a0 = dist0[(y + 1) * bare.W + x], a1 = dist[(y + 1 + shift[1]) * town.W + x + shift[0]];
      if (a0 !== a1) all.push(`harbour: the door of "${b.id}" is ${a1} steps away with the harbour, ${a0} without`);
    }
  } else if (!L) notes.noGate++;
  if (all.length) { bad++; fails.push([label, all]); for (const p of all) { const k = p.replace(/"[^"]*"/, '"<id>"').replace(/\d+,\d+/g, 'x,y'); causes.set(k, (causes.get(k) || 0) + 1); } }
  // reported only
  if (crowded.length) notes.crowded++;
  let far = 0, cut = 0, props = 0;
  for (const b of town.BUILDINGS) { const d = Math.min(...b.doors.map(([x, y]) => dist[(y + 1) * town.W + x] ?? -1).map((v) => (v < 0 ? Infinity : v))); if (b.home) continue; if (d === Infinity) notes.unreachable++; else far = Math.max(far, d); }
  town.TERRAIN.forEach((row, y) => [...row].forEach((ch, x) => { if ('pc'.includes(ch) && !solid[y * town.W + x] && dist[y * town.W + x] < 0) cut++; if ('pw'.includes(ch) && solid[y * town.W + x] && !town.BUILDINGS.some((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h)) props++; }));
  notes.laneProps += props; notes.lanesCut += cut; notes.farthest = Math.max(notes.farthest, far); if (far > 45) notes.far++;
};

// --show=<i>: draw town i (terrain, houses, lamps L, signs S, props P, landmarks M, people @) to look at a failure
if (arg('show', '') !== '') {
  const t = generate(course(+arg('show', 0))), g = t.TERRAIN.map((r) => [...r]);
  t.BUILDINGS.forEach((b) => { for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) g[y][x] = '#'; b.doors.forEach(([x, y]) => { g[y][x] = 'D'; }); });
  t.LAMPS.forEach(([x, y]) => { g[y][x] = 'L'; }); t.SIGNS.forEach((o) => { g[o.y][o.x] = 'S'; }); t.PROPS.forEach(([x, y]) => { g[y][x] = 'P'; });
  t.MONUMENTS.forEach((o) => { g[o.y][o.x] = g[o.y][o.x + 1] = 'M'; }); t.NPCS.forEach((o) => { g[o.y][o.x] = '@'; });
  console.log(g.map((r, y) => `${String(y).padStart(2)} ${r.join('')}`).join('\n'));
  const sol = solidMap(t); 
}
const t0 = Date.now(), themes = Object.keys(THEMES);
for (let i = 0; i < N; i++) {
  const c = course(i);
  let town;
  try { town = generate(c); town.course = c; } catch (e) { bad++; towns++; fails.push([`#${i} ${c.id}`, [`the town cannot be generated: ${e.message}`]]); continue; }
  const shape = `${c.districts.length}d/${c.districts.reduce((n, d) => n + d.places.length, 0)}c ${c.districts.map((d) => d.nature[0]).join('')}`;
  judge(`#${i} ${c.id} ${shape} dressing off`, town, null);
  for (const th of themes) {
    let L;
    try { L = planDressingFor(town, THEMES[th], c.id); } catch (e) { bad++; towns++; fails.push([`#${i} ${c.id} ${shape} ${th}`, [`the dressing cannot be planned: ${e.message}`]]); continue; }
    judge(`#${i} ${c.id} ${shape} dressing on, ${th}`, town, L, THEMES[th], c.id);
  }
}
for (const [label, list] of fails.slice(0, verbose ? 1e9 : 12)) console.log(`FAIL ${label}\n${list.slice(0, 6).map((p) => `       ${p}`).join('\n')}${list.length > 6 ? `\n       ... ${list.length - 6} more` : ''}`);
if (fails.length > 12 && !verbose) console.log(`... ${fails.length - 12} more failing towns (--verbose lists them)`);
console.log('\nBy cause:'); [...causes].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ${String(n).padStart(5)}  ${k}`));
console.log(`\nstress: ${N} courses, ${towns} towns (dressing off, then on in ${themes.join(', ')}), ${bad} failed the door rule, the dressing check or the life check, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
console.log(`reported, not failed: ${notes.crowded} towns with a house standing beside another door's corridor (districts too close); ${notes.unreachable} houses with an unreachable door; ${notes.lanesCut} lane or plaza tiles cut off from the square; ${notes.laneProps} solid props standing on lane or bridge tiles; farthest door ${notes.farthest} steps; ${notes.far} towns with a door beyond 45 steps`);
console.log(`road out of town: ${notes.harbours} towns with the story's harbour (the quay at most ${notes.harbourFar} steps from the square), ${notes.gates} towns with a gate (the champion at most ${notes.gateFar} steps from the start), ${notes.noGate} without (their ending plays at the League hall)`);
console.log(`life: ${life.towns} towns, ${(life.obstacles / life.towns).toFixed(1)} obstacles per town (${Object.entries(life.kinds).map(([k, n]) => `${k} ${n}`).join(', ')}), ${(life.secrets / life.towns).toFixed(1)} secrets per town (${life.min} to ${life.max}, rooms not counted), ${(life.animals / life.towns).toFixed(1)} animals`);
console.log(`games: ${gameStats.towns} towns, ${(gameStats.placed / Math.max(1, gameStats.towns)).toFixed(2)} of 3 games placed in town per town (the rest offered by a person)`);
process.exit(bad ? 1 : 0);
