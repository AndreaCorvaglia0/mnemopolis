// Walks to every door of the town in the built game (headless Chrome): by tap-to-walk from the start,
// and by walking up into the door with the arrow key from two tiles below it. Open houses must be
// entered, the guide's house and the league hall must answer. Run after the build: npm run doors
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { BUILDINGS, START } from '../src/world/townMap.js';

const here = path.dirname(fileURLToPath(import.meta.url)), html = path.join(here, '..', 'dist', 'index.html');
const chrome = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
if (!chrome || !existsSync(html)) { console.log('No Chrome or no build (npm run build): doors were not tested on screen.'); process.exit(0); }
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', protocolTimeout: 150000, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 600 });
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`file://${html}?lite&test`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (f, ...a) => page.evaluate(f, ...a);
await sleep(9000);
await ev(() => { __hb.state.seenIntro = true; });
await page.keyboard.press('Space'); await sleep(6000);

const state = () => ev(() => ({ scene: __game.scene.getScenes(true).map((s) => s.sys.settings.key).find((k) => k !== 'UI'), busy: !!__game.scene.getScene('UI').busy }));
// leave whatever the last test opened: close dialogs, come back from a room
async function reset(id) {
  for (let i = 0; i < 12; i++) { const s = await state(); if (s.scene === 'Town' && !s.busy) break; if (s.scene !== 'Town' && !s.busy) await ev((from, to) => __game.scene.getScene(from).scene.start('Town', { from: to }), s.scene, id); else { await page.keyboard.press('Escape'); await page.keyboard.press('Space'); } await sleep(700); }
  await sleep(600);
}
async function outcome(ms) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const s = await state(); if (s.scene !== 'Town') return `entered ${s.scene}`; if (s.busy) return 'dialog'; await sleep(150); } return 'nothing happened'; }

let bad = 0;
for (const b of BUILDINGS) for (const [dx, dy] of b.doors) {
  await reset(b.id);
  const want = b.open ? 'entered' : 'dialog';
  // 1. tap on the door tile, from the start
  const len = await ev((sx, sy, x, y) => { const s = __game.scene.getScene('Town'); s.player.tx = sx; s.player.ty = sy; s.player.place(); s.nav.plan(x, y); return s.nav.path.length; }, START.x, START.y, dx, dy);
  const tap = len ? await outcome(30000) : 'no path';
  await reset(b.id);
  // 2. walk up into the door from two tiles below it
  await ev((x, y) => { const s = __game.scene.getScene('Town'); s.player.tx = x; s.player.ty = y; s.player.place(); }, dx, dy + 2);
  await sleep(400); await page.keyboard.down('ArrowUp');
  const key = await outcome(8000); await page.keyboard.up('ArrowUp');
  const ok = tap.startsWith(want) && key.startsWith(want);
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${b.id.padEnd(8)} door ${dx},${dy}: tap ${len ? `${len} steps -> ${tap}` : tap}; arrow up -> ${key}`);
}
await reset('league');
console.log(errors.length ? `page errors: ${errors.slice(0, 3).join(' | ')}` : 'no page errors');
console.log(bad ? `${bad} door(s) failed` : `all ${BUILDINGS.reduce((n, b) => n + b.doors.length, 0)} doors work`);
await browser.close();
process.exit(bad ? 1 : 0);
