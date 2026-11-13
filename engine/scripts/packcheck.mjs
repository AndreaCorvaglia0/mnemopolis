// Does a packed game (scripts/pack.mjs: the prebuilt player with a course inside) behave like the
// bundled build of the same course? Opens both in headless Chrome and compares what they expose:
// places, kinds, house numbers, questions, the League, and every lab station: that it has code,
// what it puts on the stage and in its controls, and a fingerprint of its first picture.
//   node scripts/packcheck.mjs <bundled.html> <packed.html> <course folder>
// Exit code 1 on any difference. Needs Chrome (CHROME=/path if it is not found).
import puppeteer from 'puppeteer-core';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const [a, b, dir] = process.argv.slice(2);
if (!a || !b || !dir) { console.error('usage: packcheck.mjs <bundled.html> <packed.html> <course folder>'); process.exit(2); }
const CHROME = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
const course = JSON.parse(readFileSync(path.join(dir, 'course.json'), 'utf8'));
const stations = course.concepts.filter((p) => p.lab).flatMap((p) => p.lab.stations.filter((s) => !s.advanced).map((s, k) => [p.id, k, s.id]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function digest(file) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 150000, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 760, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  await page.goto(`file://${path.resolve(file)}?lite&test`);
  for (let i = 0; i < 40 && !(await page.evaluate(() => !!window.__hb?.content)); i++) await sleep(500);
  if (!(await page.evaluate(() => !!window.__hb?.content))) { await browser.close(); throw new Error(`${file} did not start: ${errors.join(' | ') || 'no error reported'}`); }
  await sleep(1500);
  const out = await page.evaluate(() => {
    const c = window.__hb.content;
    return {
      title: document.title, places: c.PLACES.map((p) => `${p.order}. ${p.id} ${p.kind} ${p.name}`),
      questions: c.QUESTIONS.map((q) => `${q.id}:${q.answer}:${q.q.slice(0, 30)}`), league: `${c.LEAGUE.name} ${c.LEAGUE.size} ${c.LEAGUE.pass}`,
    };
  });
  out.stations = [];
  for (const [id, k, sid] of stations) {
    await page.evaluate((i, kk) => { window.__hb.openLab(i, kk); }, id, k);
    await sleep(1500);
    out.stations.push(await page.evaluate((sid2) => {
      const r = document.querySelector('.lx'), stage = r.querySelector('.lab-stage');
      const cv = stage.querySelector('canvas'), missing = /has no code yet|Unknown ready-made/.test(stage.textContent);
      let print = 'no canvas';
      if (cv) { const t = document.createElement('canvas'); t.width = 24; t.height = 16; const g = t.getContext('2d'); g.drawImage(cv, 0, 0, 24, 16); const d = g.getImageData(0, 0, 24, 16).data; let s = 0; for (let i = 0; i < d.length; i += 4) s = (s * 31 + (d[i] >> 5) * 64 + (d[i + 1] >> 5) * 8 + (d[i + 2] >> 5)) % 1000000007; print = s; }
      const ctl = r.querySelectorAll('.lab-ctl input, .lab-ctl button').length;
      r.querySelector('.lx-x')?.click();
      return `${sid2}: ${missing ? 'NO CODE' : 'code'}, ${stage.querySelectorAll('canvas').length} canvas, ${ctl} controls, picture ${print}`;
    }, sid));
    await sleep(500);
  }
  out.errors = errors;
  await browser.close();
  return out;
}

const [A, B] = [await digest(a), await digest(b)];
let bad = 0;
const cmp = (label, x, y) => { const sx = JSON.stringify(x), sy = JSON.stringify(y); if (sx !== sy) { bad++; console.log(`DIFFERENT ${label}\n  bundled: ${sx.slice(0, 400)}\n  packed:  ${sy.slice(0, 400)}`); } else console.log(`same      ${label}`); };
cmp('title', A.title, B.title); cmp('places', A.places, B.places); cmp('questions', A.questions, B.questions); cmp('league', A.league, B.league);
A.stations.forEach((s, i) => cmp(`station ${s.split(':')[0]}`, s, B.stations[i]));
B.stations.forEach((s) => { if (s.includes('NO CODE')) { bad++; console.log(`MISSING   ${s}`); } });
for (const [n, d] of [['bundled', A], ['packed', B]]) if (d.errors.length) { bad++; console.log(`ERRORS in ${n}: ${d.errors.join(' | ')}`); }
console.log(`${A.places.length} places, ${A.questions.length} questions, ${A.stations.length} stations: ${bad ? `${bad} differences` : 'the packed game behaves like the bundled one'}`);
process.exit(bad ? 1 : 0);
