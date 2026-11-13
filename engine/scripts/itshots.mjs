// The game in Italian, played through: builds the Italian test course (engine/tests/fixtures/prova,
// never published), plays it from the title to the ending with the play-through bot on a desktop
// window and on a phone, and leaves the pictures in OUT (default /tmp) as it-*.png and
// it-phone-*.png, with the logs it-log.txt and it-phone-log.txt. Then points the engine back at the
// course it was using.   npm run shots:it
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SLUG } from '../src/course/_data.js';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '..'), OUT = process.env.OUT || '/tmp';
const run = (cmd, args, env = {}) => spawnSync(cmd, args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } }).status || 0;
const back = SLUG && SLUG !== 'prova' ? SLUG : 'chroma';
let status = run('npm', ['run', 'build'], { COURSE: 'prova' });
const html = path.join(OUT, 'it-build', 'index.html');
if (!status) {
  mkdirSync(path.dirname(html), { recursive: true });
  copyFileSync(path.join(root, 'dist', 'index.html'), html);
  for (const f of readdirSync(OUT)) if (/^it(-phone)?-\d\d-.*\.png$/.test(f)) rmSync(path.join(OUT, f));
  status = run('node', ['scripts/playthrough.mjs'], { NAME: 'it', HTML: html, OUT }) || status;
  status = run('node', ['scripts/playthrough.mjs'], { NAME: 'it', HTML: html, OUT, PHONE: '1' }) || status;
}
run('node', ['scripts/use-course.mjs', back]);
console.log(`Italian pictures in ${OUT}/it-*.png and ${OUT}/it-phone-*.png (the engine points at ${back} again; run the build for it).`);
process.exit(status);
