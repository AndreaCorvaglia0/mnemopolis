// Stress test of the town layout, in Node, no browser: many synthetic courses (seed, 1 to 4 districts,
// 4 to 16 concepts, landscapes, landmarks, kinds of house), in the three visual themes, with the
// dressing off and on. Every town must pass the "door approach" rule (src/world/doors.js) and the
// dressing's own check. Other placement problems are counted and reported, not failed.
//   node scripts/stress-town.mjs [--n=240] [--verbose]        (npm run stress)
import { generate, KINDS } from '../src/world/townMap.js';
import { THEMES } from '../src/gen/core.js';
import { planDressingFor, checkDressing } from '../src/gen/dressing.js';
import { solidMap, checkDoors, whatIsAt } from '../src/world/doors.js';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] ?? d;
const N = +arg('n', 240), verbose = process.argv.includes('--verbose');
const NATURES = ['river', 'hill', 'forest', 'meadow', 'shore'], MONS = ['fountain', 'obelisk', 'statue', 'arch', 'bell', 'stones'], KS = Object.keys(KINDS);

const rng = (s) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (a, r) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function course(i) {
  const r = rng(i * 7919 + 13), nd = 1 + Math.floor(r() * 4), nc = Math.max(nd, Math.min(4 * nd, 4 + Math.floor(r() * 13)));
  const per = Array(nd).fill(1); for (let k = nd; k < nc; k++) { let j; do j = Math.floor(r() * nd); while (per[j] >= 4); per[j]++; }
  const nat = shuffle(NATURES, r), mon = shuffle(MONS, r);
  let id = ''; for (let k = 0; k < 7; k++) id += String.fromCharCode(97 + Math.floor(r() * 26)); // ids are random words, as real ones are slugs
  return {
    id, title: `Synthetic ${i}`, bigIdea: 'x', hub: { name: 'Central Square', monument: mon[5], guide: { name: 'Iris', look: 'mentor' } }, league: { name: 'League' },
    districts: per.map((n, d) => ({ id: `d${d}`, name: `District ${d}`, idea: 'x', nature: nat[d], landmark: mon[d], places: Array.from({ length: n }, (_, p) => ({ id: `d${d}p${p}`, kind: KS[Math.floor(r() * KS.length)], name: `Place ${d}.${p}`, concept: 'x', objective: 'Do x' })) })),
  };
}

const fails = [], notes = { crowded: 0, unreachable: 0, laneProps: 0, farthest: 0, far: 0, lanesCut: 0 }, causes = new Map();
let towns = 0, bad = 0;
const judge = (label, town, L) => {
  towns++;
  const solid = solidMap(town, L), { problems, crowded, dist } = checkDoors(town, solid, L), all = problems.map((p) => p.text);
  if (L) { const { problems: dp } = checkDressing(L); all.push(...dp.map((p) => `dressing: ${p}`)); }
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
  try { town = generate(c); } catch (e) { bad++; towns++; fails.push([`#${i} ${c.id}`, [`the town cannot be generated: ${e.message}`]]); continue; }
  const shape = `${c.districts.length}d/${c.districts.reduce((n, d) => n + d.places.length, 0)}c ${c.districts.map((d) => d.nature[0]).join('')}`;
  judge(`#${i} ${c.id} ${shape} dressing off`, town, null);
  for (const th of themes) {
    let L;
    try { L = planDressingFor(town, THEMES[th], c.id); } catch (e) { bad++; towns++; fails.push([`#${i} ${c.id} ${shape} ${th}`, [`the dressing cannot be planned: ${e.message}`]]); continue; }
    judge(`#${i} ${c.id} ${shape} dressing on, ${th}`, town, L);
  }
}
for (const [label, list] of fails.slice(0, verbose ? 1e9 : 12)) console.log(`FAIL ${label}\n${list.slice(0, 6).map((p) => `       ${p}`).join('\n')}${list.length > 6 ? `\n       ... ${list.length - 6} more` : ''}`);
if (fails.length > 12 && !verbose) console.log(`... ${fails.length - 12} more failing towns (--verbose lists them)`);
console.log('\nBy cause:'); [...causes].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ${String(n).padStart(5)}  ${k}`));
console.log(`\nstress: ${N} courses, ${towns} towns (dressing off, then on in ${themes.join(', ')}), ${bad} failed the door rule or the dressing check, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
console.log(`reported, not failed: ${notes.crowded} towns with a house standing beside another door's corridor (districts too close); ${notes.unreachable} houses with an unreachable door; ${notes.lanesCut} lane or plaza tiles cut off from the square; ${notes.laneProps} solid props standing on lane or bridge tiles; farthest door ${notes.farthest} steps; ${notes.far} towns with a door beyond 45 steps`);
process.exit(bad ? 1 : 0);
