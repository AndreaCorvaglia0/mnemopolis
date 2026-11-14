// The bilingual fixture (engine/tests/fixtures/duo, never published) built once and played through
// from the title to the ending in each of its languages, with the play-through bot (play:ci style).
//   npm run play:duo          then the engine points back at the course it was using
// Logs and pictures: OUT (default /tmp) as duo-ci-en-*.png, duo-ci-it-*.png, duo-ci-en-log.txt, ...
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SLUG } from '../src/course/_data.js';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '..'), OUT = process.env.OUT || '/tmp';
const run = (cmd, args, env = {}) => spawnSync(cmd, args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } }).status || 0;
const back = SLUG && SLUG !== 'duo' ? SLUG : 'chroma';
let status = run('npm', ['run', 'build'], { COURSE: 'duo' });
const html = path.join(OUT, 'duo-build', 'index.html');
if (!status) {
  mkdirSync(path.dirname(html), { recursive: true });
  copyFileSync(path.join(root, 'dist', 'index.html'), html);
  for (const lang of ['en', 'it']) status = run('node', ['scripts/playthrough.mjs'], { NAME: 'duo', FAST: '1', LANG: lang, HTML: html, OUT }) || status;
}
run('node', ['scripts/use-course.mjs', back]);
process.exit(status);
