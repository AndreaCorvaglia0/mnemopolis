// Pictures of the story (docs/STORY.md), desktop then phone: the arrival, the name, the notebook, the
// cold town, remembering (start, right, false memory, remembered), mementos, the notebook tab, a
// window lighting up, the lighthouse dark, understood, its door, the keeper, the turn, the lamp lit,
// the ending card. Jumps between moments with __hb.story (src/mechanics/story/debug.js).
//   node scripts/storyshots.mjs            (npm run shots:story) -> /tmp/story-*.png, /tmp/story-phone-*.png
//   PHONE=1 / DESK=1 only one of the two; OUT=/dir to change where they go
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(here, '..', 'dist', 'index.html');
const OUT = process.env.OUT || '/tmp';
mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];

async function run(phone) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 240000, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  if (phone) await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  else await page.setViewport({ width: 1440, height: 800, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => problems.push(`${phone ? 'phone' : 'desk'} pageerror: ${(e.stack || e.message).slice(0, 400)}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`${phone ? 'phone' : 'desk'} console: ${m.text().slice(0, 300)}`); });
  const pre = phone ? 'story-phone-' : 'story-';
  const shot = async (name) => { await page.screenshot({ path: `${OUT}/${pre}${name}.png` }); console.log(`  ${pre}${name}`); };
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const until = async (fn, what, ms = 60000, ...a) => { const t0 = Date.now(); for (;;) { let v; try { v = await page.evaluate(fn, ...a); } catch (e) { v = null; } if (v) return v; if (Date.now() - t0 > ms) { problems.push(`${phone ? 'phone' : 'desk'}: timed out waiting for ${what}`); return null; } await sleep(250); } };
  const cap = (re) => until((src) => { const p = document.querySelector('.cn-cap p.on'); return p && new RegExp(src, 'i').test(p.textContent) && p.textContent; }, `the caption /${re}/`, 90000, re);
  const tapOn = () => ev(() => { const r = document.querySelector('.cn'); r?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); return 1; });
  const noCinema = () => until(() => !document.querySelector('.cn'), 'the end of a cinematic moment', 120000);
  const key = async (k) => { await page.keyboard.press(k); await sleep(150); };
  const fresh = async (setup) => {
    const url = `file://${html}?test&lite${phone ? '&touch' : ''}`;
    await page.goto(url); await ev(() => localStorage.clear()); await page.goto(url); // a new game: no save
    await until(() => !!(window.__hb && __game.scene.getScene('UI')?.ready && __game.scene.getScene('Town')?.player), 'the game', 90000);
    if (setup) await ev(setup);
    await sleep(1500);
    await key('Space'); // the title
    await sleep(2500);
  };

  // ---- 1. the arrival: the ship in the rain, the lights going out, the name
  await fresh(null);
  await cap('black|nero'); await sleep(phone ? 2500 : 3500); await shot('01-opening-ship');
  await cap('lights|luci'); await sleep(2600); await shot('02-opening-lights-out');
  await until(() => document.querySelector('.cn input'), 'the register');
  await ev(() => { const i = document.querySelector('.cn input'); i.value = 'Andrea'; return 1; });
  await sleep(600); await shot('03-name');
  await ev(() => { const i = document.querySelector('.cn input'); i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return 1; });
  await cap('boards|assi'); await sleep(1500);
  await until(() => /House 1|Casa 1/.test(document.querySelector('.cn-mid')?.textContent || ''), 'the first line'); await sleep(1500); await shot('04-quay-notebook');
  await noCinema();
  await until(() => __game.scene.getScene('UI').saying, 'the harbour master');
  await sleep(1200); await shot('05-harbour-master');
  for (let i = 0; i < 6 && (await ev(() => !!__game.scene.getScene('UI').saying)); i++) { await key('Space'); await sleep(900); }

  // ---- 2. the cold town: dark windows, heavy rain
  await ev(() => { __hb.story.where(__hb.content.PLACES.find((p) => p.core !== false).id); return 1; });
  await sleep(2500); await shot('06-cold-town');
  await ev(() => { __hb.story.where('lighthouse'); return 1; });
  await sleep(2000); await shot('07-lighthouse-dark');
  await ev(() => __hb.story.follow());

  // ---- 3. remembering in the first house: start, a right answer, a false memory, remembered
  const first = await ev(() => __hb.content.PLACES.find((p) => p.core !== false).id);
  await ev((id) => { __game.scene.getScene('Town').scene.start('Interior', { id }); return 1; }, first);
  await sleep(3000);
  await ev((id) => __hb.story.remember(id), first);
  await until(() => document.querySelector('.dl')?.dataset.mode === 'q', 'the remembering');
  await sleep(900); await shot('08-remember-start');
  const Qq = "(()=>{const id=document.querySelector('.dl')?.dataset.q;return __hb.content.QUESTIONS.find(q=>q.id===id)})()";
  const answer = (ok) => ev(`(()=>{const q=${Qq};const t=q.options.map((_,i)=>i).filter(i=>i!==q.answer);const i=${ok ? 'q.answer' : 't.find(i=>q.traps&&q.traps[i])??t[0]'};document.querySelectorAll('.dl-o')[i].click();return 1})()`);
  const next = () => ev(() => { document.querySelector('.dl-b.go')?.click(); return 1; });
  await answer(true); await sleep(900); await shot('09-remember-right');
  await next(); await sleep(400); await answer(false); await sleep(900); await shot('10-remember-false-memory');
  for (let i = 0; i < 12 && (await ev(() => document.querySelector('.dl')?.dataset.mode)) !== 'end'; i++) { if ((await ev(() => document.querySelector('.dl')?.dataset.mode)) === 'q') await answer(true); else await next(); await sleep(350); }
  await sleep(1200); await shot('11-remembered-key');
  await ev(() => { document.querySelector('.dl-b.go')?.click(); return 1; });
  await sleep(1500);

  // ---- 4. mementos: a page, the photograph, the card (upstairs, as close-ups)
  const kinds = await ev(() => __hb.story.MEMENTO_OF);
  for (const [n, kind] of [['12', 'page'], ['13', 'photo'], ['14', 'card']]) {
    const id = Object.keys(kinds).find((k) => kinds[k] === kind);
    if (!id) { problems.push(`no house keeps the ${kind}`); continue; }
    // upstairs where the house has one (a workshop or a museum hands the memento over instead)
    if (await ev((x) => !['workshop', 'museum'].includes(__hb.content.PLACE[x].kind), id)) { await ev((x) => { const sc = __game.scene.getScenes(true).find((o) => ['Interior', 'Town'].includes(o.sys.settings.key)); sc.scene.start('Interior', { id: x, floor: 'up' }); return 1; }, id); await sleep(3500); }
    if (n === '12') await shot('12a-upstairs-memento');
    await ev((x) => __hb.story.memento(x), id);
    await until(() => document.querySelector('.cn .st-mm'), 'the close-up');
    await sleep(2200); await shot(`${n}-memento-${kind}`);
    if (n === '12') { await cap('comes back|torna al'); await sleep(1200); await shot('12b-memento-page-restored'); }
    await ev(() => { document.querySelector('.cn-skip')?.click(); return 1; });
    await noCinema();
  }

  // ---- 5. the notebook tab, mid-game; a window lighting up
  await fresh(() => { __hb.story.at(2); return 1; });
  await sleep(2000);
  await ev(() => { __game.scene.getScene('UI').showAtlas('journey'); return 1; });
  await until(() => document.querySelector('.nb'), 'the notebook');
  await sleep(800); await shot('15-notebook-tab');
  await key('Escape'); await sleep(800);
  const third = await ev(() => __hb.content.PLACES.filter((p) => p.core !== false)[2].id);
  await ev((id) => __hb.story.window(id), third);
  await cap('light comes|accende'); await sleep(1200); await shot('16-window-lights');
  await noCinema();

  // ---- 6. the lighthouse understood; its door; the keeper
  await ev(() => __hb.story.understood());
  await cap('lighthouse|faro'); await sleep(2500); await shot('17-lighthouse-understood');
  await noCinema();
  await ev(() => __hb.story.door());
  await until(() => document.querySelector('.lk'), 'the door');
  await sleep(1500);
  await ev(() => { const i = document.querySelector('.lk input'); i.value = 'colour'; i.dispatchEvent(new Event('input')); document.querySelector('.lk-try').click(); return 1; });
  await sleep(1400); await shot('18-door-word');
  await ev(() => { const i = document.querySelector('.lk input'); i.value = 'light'; i.dispatchEvent(new Event('input')); document.querySelector('.lk-try').click(); return 1; });
  await sleep(1400); await shot('18b-door-word-said');
  await ev(() => { const w = /«(.+)»|"(.+)"/.exec(document.querySelector('.lk-think')?.textContent || ''); const i = document.querySelector('.lk input'); i.value = w ? (w[1] || w[2]) : ''; i.dispatchEvent(new Event('input')); document.querySelector('.lk-try').click(); return 1; });
  await until(() => document.querySelector('.cn'), 'the climb');
  await ev(() => { document.querySelector('.cn-skip')?.click(); return 1; });
  await until(() => document.querySelector('.dl.dark'), 'the keeper');
  await sleep(1200); await shot('19-keeper');
  for (let i = 0; i < 30 && (await ev(() => document.querySelector('.dl')?.dataset.mode)) !== 'end'; i++) { if ((await ev(() => document.querySelector('.dl')?.dataset.mode)) === 'q') await answer(true); else await next(); await sleep(300); }
  await sleep(800);
  await ev(() => { document.querySelector('.dl-b.go')?.click(); return 1; });

  // ---- 7. the turn, the lamp, the ending card
  await cap('hood|cappuccio'); await sleep(1500); await shot('20-turn-hood');
  await cap('face|volto'); await sleep(1500); await shot('21-turn-face');
  await cap('card|biglietto'); await sleep(1500); await shot('22-turn-card');
  await cap('lamp|lampada'); await sleep(3500); await shot('23-lamp-lit');
  await cap('horn|sirena'); await sleep(2500); await shot('24-ship-horn');
  await ev(() => { document.querySelector('.cn-skip')?.click(); return 1; });
  await until(() => document.querySelector('.qe'), 'the ending card', 120000);
  await sleep(1000); await shot('25-ending-card');
  await ev(() => { document.querySelector('.qe-back')?.click(); return 1; });
  await until(() => __game.scene.getScene('UI').choice, 'the last choice');
  await sleep(600); await shot('26-leave-notebook');
  await key('Space');
  await cap('next|dopo'); await sleep(1500); await shot('27-notebook-left');
  await noCinema();
  await ev(() => { __hb.story.where('lighthouse'); return 1; });
  await sleep(2500); await shot('28-town-after');
  // ---- 8. after the ending: the fog returns to a house (its windows dim, the notebook marks it, its owner forgets)
  await ev(() => __hb.story.follow());
  await ev((id) => __hb.story.fog(id), first);
  await ev(() => { __game.scene.getScene('UI').showAtlas('journey'); return 1; });
  await until(() => document.querySelector('.nb .fog'), 'the fog mark');
  await sleep(800); await shot('29-notebook-fog');
  await key('Escape'); await sleep(800);
  await ev((id) => { __game.scene.getScene('Town').scene.start('Interior', { id }); return 1; }, first);
  await sleep(3000);
  await ev(() => { __game.scene.getScene('Interior').storyRoom.talk(); return 1; });
  await until(() => __game.scene.getScene('UI').choice, 'the owner in the fog');
  await sleep(800); await shot('30-fog-owner');
  await browser.close();
}

const which = process.env.PHONE ? [true] : process.env.DESK ? [false] : [false, true];
for (const phone of which) { console.log(phone ? 'phone' : 'desktop'); await run(phone); }
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'no problems');
process.exit(problems.length ? 1 : 0);
