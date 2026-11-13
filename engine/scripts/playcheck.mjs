// The /play/ page end to end, in headless Chrome: serves dist/play/ (index.html and player.html)
// over http, gives the page the files of a course folder, and checks that it reports no
// problem, that the game starts in the page with the course inside, and that a broken course
// gets plain messages.
//   node scripts/playcheck.mjs [courses/<slug>]     (after npm run build:player and build:play)
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import { existsSync, readFileSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), eng = path.join(here, '..'), play = path.join(eng, 'dist', 'play');
const dir = path.resolve(process.argv[2] || path.join(eng, '..', 'courses', 'pocket-demo'));
if (!existsSync(path.join(play, 'index.html'))) { console.error('No dist/play/index.html: npm run build:play'); process.exit(2); }
if (!existsSync(path.join(eng, 'dist', 'player.html'))) { console.error('No dist/player.html: npm run build:player'); process.exit(2); }
copyFileSync(path.join(eng, 'dist', 'player.html'), path.join(play, 'player.html'));
const CHROME = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
const server = http.createServer((q, r) => { const f = path.join(play, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'index.html'); if (!f.startsWith(play) || !existsSync(f) || statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); r.end(readFileSync(f)); }).listen(0);
const port = server.address().port;
// the course folder as the page would read it from a folder picker
const files = [];
const walk = (d, rel) => { for (const f of readdirSync(d)) { const p = path.join(d, f), r = `${rel}/${f}`; if (statSync(p).isDirectory()) walk(p, r); else if (/\.(json|js|md)$/.test(f)) files.push({ path: r, text: readFileSync(p, 'utf8') }); } };
walk(dir, path.basename(dir));
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let bad = 0;
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) bad++; };
try {
  for (const lang of ['en-GB', 'it-IT']) {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument((l) => { Object.defineProperty(navigator, 'language', { get: () => l }); }, lang);
    const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`http://localhost:${port}/index.html`);
    const h1 = await page.$eval('h1', (e) => e.textContent);
    check(lang.startsWith('it') ? /corso/.test(h1) : /course/.test(h1), `${lang}: the page speaks the browser's language ("${h1}")`);
    await page.evaluate((f) => window.__play.make(f), files);
    await sleep(1500);
    const msg = await page.$eval('#out', (e) => e.innerText);
    check(!!(await page.$('#out .msg.ok')), `${lang}: ${path.basename(dir)} is accepted: ${msg.split('\n')[0]}`);
    if (lang === 'en-GB') {
      await page.screenshot({ path: '/tmp/play-page-ok.png' });
      await page.click('#play');
      await sleep(9000);
      const frame = page.frames().find((fr) => fr !== page.mainFrame());
      const places = frame ? await frame.evaluate(() => window.__hb?.content?.PLACES?.map((p) => p.id)) : null;
      check(Array.isArray(places) && places.length > 0, `the game starts in the page: ${places}`);
      await page.screenshot({ path: '/tmp/play-page-game.png' });
      await page.click('#close');
      // a broken course: plain words, no game
      const broken = files.map((f) => (f.path.endsWith('course.json') ? { ...f, text: f.text.replace('"objective":', '"objectiv":') } : f));
      await page.evaluate((f) => window.__play.make(f), broken);
      await sleep(600);
      const err = await page.$eval('#out', (e) => e.innerText);
      check(/objective" is missing/.test(err) && !(await page.$('#out .msg.ok')), `a broken course is refused in plain words: ${err.split('\n').slice(0, 2).join(' / ')}`);
      const badLab = files.map((f) => (f.path.endsWith('wave.js') ? { ...f, text: `import x from 'https://cdn.example.org/x.js';\n${f.text}` } : f));
      await page.evaluate((f) => window.__play.make(f), badLab);
      await sleep(600);
      const err2 = await page.$eval('#out', (e) => e.innerText);
      check(/labs\/wave\.js, line 1/.test(err2), 'a lab file with a foreign import is refused with its file and line');
      await page.screenshot({ path: '/tmp/play-page-errors.png' });
    }
    check(!errs.length, `${lang}: no page errors ${errs.join(' | ')}`);
    await page.close();
  }
} finally { await browser.close(); server.close(); }
process.exit(bad ? 1 : 0);
