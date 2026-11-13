// The game with its optional parts switched off still works: the reduced play-through (play:ci)
// under ?nolife, world.json "gen": false (no generated fronts, rooms or dressing) and "voice": false.
// Builds each variant into OUT/switch-<name>/ and plays it; then rebuilds the course as it is.
//   node scripts/playswitches.mjs        (several minutes)
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '..'), OUT = process.env.OUT || '/tmp';
const run = (cmd, args, env = {}) => spawnSync(cmd, args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } }).status || 0;
const variants = [['nolife', '{}', '&nolife'], ['gen-off', '{"gen":false}', ''], ['voice-off', '{"voice":false}', '']];
const results = [];
for (const [name, world, q] of variants) {
  if (process.env.ONLY && process.env.ONLY !== name) continue;
  let st = run('npm', ['run', 'build'], { WORLD_JSON: world });
  const html = path.join(OUT, `switch-${name}`, 'index.html');
  if (!st) { mkdirSync(path.dirname(html), { recursive: true }); copyFileSync(path.join(root, 'dist', 'index.html'), html); st = run('node', ['scripts/playthrough.mjs'], { FAST: '1', HTML: html, Q: q, NAME: `switch-${name}`, OUT }); }
  results.push(`${name}: ${st ? 'PROBLEMS (see the log)' : 'clean'}`);
}
run('npm', ['run', 'build'], { WORLD_JSON: '' });
console.log(results.join('\n'));
process.exit(results.some((r) => /PROBLEMS/.test(r)) ? 1 : 0);
