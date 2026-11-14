// Pictures of every lab station of a course, state by state: before the prediction, after one task
// (mid) and done, on a desktop window (1440 x 800) and a phone held upright (390 x 844).
//   npm run shots:ready                    the pocket demo, then the pattern gallery fixture
//   COURSES=patterns npm run shots:ready   one course (a slug of courses/ or engine/tests/fixtures/)
// Builds each course, then drives it with real pointer events: a task is done by reading its
// condition (station.when) and acting on the picture, for ready-made patterns and for stations
// that expose their state the same way (ctx.stage.__ready). Saves to shots/ready/ and copies to
// /tmp/ready-<course>-<station>-<state>.png and /tmp/ready-phone-... (OUT2=/dir to change).
import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, readdirSync, rmSync, copyFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url)), eng = path.join(here, '..'), out = path.join(eng, 'shots', 'ready'), html = path.join(eng, 'dist', 'index.html');
const courses = (process.env.COURSES || 'pocket-demo,patterns').split(',');
const enc = (js) => encodeURIComponent(js);
for (const f of existsSync(out) ? readdirSync(out) : []) if (f.endsWith('.png')) rmSync(path.join(out, f));
mkdirSync(out, { recursive: true });

import { helpers } from './readyhelpers.mjs';

let status = 0;
for (const slug of courses) {
  const dir = existsSync(path.join(eng, '..', 'courses', slug, 'course.json')) ? path.join(eng, '..', 'courses', slug) : path.join(eng, 'tests', 'fixtures', slug);
  if (!existsSync(path.join(dir, 'course.json'))) { console.log(`no course ${slug}`); continue; }
  const r = spawnSync('npm', ['run', 'build'], { cwd: eng, env: { ...process.env, COURSE: slug }, encoding: 'utf8' });
  if (r.status) { console.log(`BUILD FAILED for ${slug}:\n${(r.stdout + r.stderr).slice(-3000)}`); status = 1; continue; }
  const course = JSON.parse(readFileSync(path.join(dir, 'course.json'), 'utf8'));
  const list = course.concepts.filter((p) => p.lab).flatMap((p) => p.lab.stations.filter((s) => !s.advanced).map((s, k) => ({ id: p.id, k, s })));
  for (const [tag, vp, q] of [['desktop', '1440x800x1', '?lite&test'], ['phone', '390x844x2', '?lite&test&touch']]) {
    if (process.env.ONLY && process.env.ONLY !== tag) continue;
    const pre = tag === 'phone' ? `ready-phone-${slug}` : `ready-${slug}`;
    const steps = ['wait:8000', `eval:${enc('__hb.state.seenIntro=true')}`, `eval:${enc(helpers)}`];
    for (const { id, k, s } of list) {
      const n = (s.tries || []).length, name = `${pre}-${s.id}`;
      steps.push(`eval:${enc(`(__hb.openLab('${id}',${k}),1)`)}`, 'wait:2200', `shot:${name}-1-before`);
      if (s.predict) steps.push(`eval:${enc("(document.querySelector('.lx-choice').click(),1)")}`, 'wait:1200');
      steps.push(`eval:${enc('__act(0)')}`, 'wait:2600', `shot:${name}-2-mid`);
      for (let i = 1; i < n; i++) steps.push(`eval:${enc(`__act(${i})`)}`, 'wait:2600');
      steps.push('wait:3500', `shot:${name}-3-done`, `eval:${enc("(document.querySelector('.lx .lx-x').click(),1)")}`, 'wait:800');
    }
    const rr = spawnSync('node', [path.join(here, 'shoot.mjs'), html, out, steps.join(',')], { stdio: 'inherit', env: { ...process.env, VP: vp, Q: q } });
    status ||= rr.status || 0;
  }
}
const OUT2 = process.env.OUT2 || '/tmp';
mkdirSync(OUT2, { recursive: true });
for (const f of readdirSync(out)) copyFileSync(path.join(out, f), path.join(OUT2, f));
spawnSync('node', ['scripts/use-course.mjs'], { cwd: eng, stdio: 'ignore' });
console.log(status ? 'SOMETHING FAILED: see above.' : `Pictures are in ${out} and ${OUT2} (ready-*.png). Open them.`);
process.exit(status);
