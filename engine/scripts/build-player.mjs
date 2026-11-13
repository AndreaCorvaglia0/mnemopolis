// Builds the prebuilt player: the engine without a course, as one HTML file, dist/player.html.
// A course is put into it later, without a build, by scripts/pack.mjs (or the /play/ page).
//   npm run build:player
// Then points the engine back at $COURSE (or chroma), as before.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { MARK } from '../src/course/packing.js';

const here = path.dirname(fileURLToPath(import.meta.url)), eng = path.join(here, '..'), tmp = path.join(eng, '.player-build');
const run = (cmd, args) => { const r = spawnSync(cmd, args, { cwd: eng, stdio: 'inherit' }); if (r.status) process.exit(r.status); };
run('node', ['scripts/use-course.mjs', '--player']);
try {
  run('npx', ['vite', 'build', '--outDir', tmp, '--emptyOutDir']);
  let html = readFileSync(path.join(tmp, 'index.html'), 'utf8');
  const slot = `<script type="application/json" id="${MARK}"></script>`;
  if (html.includes(slot)) throw new Error('the placeholder is already there');
  // the last </body>: the engine's own code may contain the words
  const end = html.lastIndexOf('</body>');
  html = `${html.slice(0, end)}${slot}\n${html.slice(end)}`;
  mkdirSync(path.join(eng, 'dist'), { recursive: true });
  writeFileSync(path.join(eng, 'dist', 'player.html'), html);
  console.log(`dist/player.html: ${(html.length / 1024 / 1024).toFixed(2)} MB, no course inside`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
  spawnSync('node', ['scripts/use-course.mjs'], { cwd: eng, stdio: 'inherit' });
}
