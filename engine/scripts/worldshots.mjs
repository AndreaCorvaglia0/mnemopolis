// Pictures of experience and the mini-games (docs/GAME.md: "Mini-games", "a world that notices"),
// desktop then phone, of the course that is built (npm run shots:world builds chroma, then the pocket
// demo, and runs this for each):
//   remarks at three tiers; a withheld line refused, then told; the notebook with the tier and what was
//   told; the door that knows you, shut and open; a game spot in town with its mark; every game of the
//   course (start, a round, the result); the keeper on a return after the ending.
//   node scripts/worldshots.mjs -> /tmp/world-<course>-*.png, /tmp/world-phone-<course>-*.png
//   PHONE=1 / DESK=1 only one of the two; OUT=/dir to change where they go
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(here, '..', 'dist', 'index.html');
const slug = (readFileSync(path.join(here, '..', 'src', 'course', '_data.js'), 'utf8').match(/SLUG = "([^"]+)"/) || [])[1] || 'course';
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
  const tag = phone ? 'phone' : 'desk';
  page.on('pageerror', (e) => problems.push(`${tag} pageerror: ${(e.stack || e.message).slice(0, 400)}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`${tag} console: ${m.text().slice(0, 300)}`); });
  const pre = `${phone ? 'world-phone-' : 'world-'}${slug}-`;
  const shot = async (name) => { await page.screenshot({ path: `${OUT}/${pre}${name}.png` }); console.log(`  ${pre}${name}`); };
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const until = async (fn, what, ms = 60000, ...a) => { const t0 = Date.now(); for (;;) { let v; try { v = await page.evaluate(fn, ...a); } catch { v = null; } if (v) return v; if (Date.now() - t0 > ms) { problems.push(`${tag}: timed out waiting for ${what}`); return null; } await sleep(250); } };
  const key = async (k) => { await page.keyboard.press(k); await sleep(200); };
  const ui = () => ev(() => { const u = __game.scene.getScene('UI'); return { busy: u.busy, modals: u.modals, saying: u.saying?.line || null }; });
  const closeAll = async () => { for (let i = 0; i < 12; i++) { const u = await ui(); if (!u.modals) break; await key('Escape'); await sleep(350); } await sleep(400); };
  const talkTo = async (id, name) => {
    await ev((i) => { __hb.xp.talk(i); return 1; }, id);
    await until(() => __game.scene.getScene('UI').modals > 0, `a dialogue with ${id}`, 20000);
    await sleep(1600); await shot(name);
  };

  const url = `file://${html}?test&lite&arrived&xpremark${phone ? '&touch' : ''}`;
  await page.goto(url); await ev(() => localStorage.clear()); await page.goto(url);
  await until(() => !!(window.__hb && __game.scene.getScene('UI')?.ready && __game.scene.getScene('Town')?.player), 'the game', 90000);
  await sleep(1500); await key('Space'); await sleep(2500); await closeAll();
  const info = await ev(() => ({ npcs: __hb.xp.npcs(), who: __hb.xp.who(), games: __hb.xp.games() }));
  const person = info.npcs.find((n) => n.startsWith('res-')) || 'guide';

  // ---- 1. remarks at three tiers (the story's first house remembered, then more experience)
  // no withheld line in the way of these pictures: all of them told already (section 2 starts afresh)
  await ev(() => { __hb.story.at(1); __hb.xp.toTier('passing'); const x = __hb.state.xp; x.told ||= {}; for (const ids of Object.values(__hb.xp.who())) for (const id of ids) x.told[id] = 1; delete x.announce; return 1; }); await closeAll();
  await talkTo(person, 'remark-1-passing'); await closeAll();
  await ev(() => { __hb.xp.toTier('settling'); delete __hb.state.xp.announce; return 1; });
  await talkTo(person, 'remark-2-settling'); await closeAll();
  await ev(() => { __hb.xp.toTier('home'); delete __hb.state.xp.announce; return 1; });
  await talkTo(person, 'remark-3-home'); await closeAll();

  // ---- 2. a withheld line: refused (below its tier), then told; the notebook
  await page.goto(url); await ev(() => localStorage.clear()); await page.goto(url);
  await until(() => !!(window.__hb && __game.scene.getScene('UI')?.ready && __game.scene.getScene('Town')?.player), 'the game again', 90000);
  await sleep(1200); await key('Space'); await sleep(2000); await closeAll();
  await ev(() => { __hb.story.at(1); return 1; });
  const teller = Object.keys(info.who).find((k) => !k.startsWith('host:') && info.npcs.includes(k) && k !== 'guide') || Object.keys(info.who).find((k) => !k.startsWith('host:'));
  if (teller) {
    const tierOf = await ev((k) => __hb.xp.withheld(k)?.line.tier, teller);
    await ev(() => { delete __hb.state.xp?.announce; return 1; });
    await talkTo(teller, 'withheld-1-teaser');
    await key('Space'); await sleep(1500); await shot('withheld-2-refused'); await closeAll();
    await ev((t) => { __hb.xp.toTier(t); delete __hb.state.xp.announce; return 1; }, tierOf);
    await talkTo(teller, 'withheld-3-intro');
    await key('Space'); await sleep(1800); await shot('withheld-4-told'); await closeAll();
    await ev(() => { __game.scene.getScene('UI').showAtlas('journey'); return 1; });
    await until(() => document.querySelector('.nbk[data-ready]'), 'the notebook', 20000);
    await sleep(900); await shot('notebook-journey-tier');
    await key('3'); await sleep(900);
    if (phone) { await ev(() => { document.querySelector('.nbk-pg.l .nbk-turn button')?.click(); return 1; }); await sleep(600); }
    await shot('notebook-clues-told');
    await key('Escape'); await sleep(800);
  } else problems.push(`${tag}: nobody holds a withheld line`);

  // ---- 3. the door that knows you: shut below the tier, a nook above it
  await ev(() => { __hb.state.xp.max = 0; __hb.state.insight = 0; __hb.state.xp.earned = 0; __hb.state.xp.seen = 0; __hb.state.stamps = {}; __hb.state.done = {}; __hb.state.story.mementos = {}; return 1; });
  await ev(() => { __hb.xp.door(); return 1; }); await sleep(1800); await shot('door-shut'); await closeAll();
  await ev(() => { __hb.xp.toTier('known'); delete __hb.state.xp.announce; __hb.xp.door(); return 1; }); await sleep(1800); await shot('door-nook');
  await key('Escape'); await sleep(700); await closeAll();

  // ---- 4. a tier change announced by a person
  await ev(() => { __hb.xp.toTier('home'); return 1; });
  await until(() => __game.scene.getScene('UI').saying, 'the tier remark', 15000);
  await sleep(1400); await shot('tier-announced'); await closeAll();

  // ---- 5. games: a spot in town with its mark, then every game
  await ev(() => { __hb.story.at(99); return 1; });
  const spot = info.games.town[0];
  if (spot) {
    await ev((id) => __hb.xp.spot(id), spot.id);
    await until(() => __game.scene.getScene('Town')?.player && __game.scene.isActive('Town'), 'the town after the spot', 30000);
    await sleep(2600); await shot(`spot-${spot.id}`);
  }
  for (const g of info.games.games) {
    await ev((id) => __hb.xp.play(id), g.id);
    await until(() => document.querySelector('.gm')?.__game?.phase === 'intro', `the start of ${g.id}`, 20000);
    await sleep(500); await shot(`game-${g.kind}-${g.id}-1-start`);
    await ev(() => { document.querySelector('.gm').__game.start(); return 1; });
    await until(() => document.querySelector('.gm')?.__game?.phase === 'round', `a round of ${g.id}`, 20000);
    await sleep(g.kind === 'sequence' ? 4500 : 1600); await shot(`game-${g.kind}-${g.id}-2-round`);
    // play it out: right, then one miss to show the feedback, then right to the end
    for (let i = 0; i < 40; i++) {
      const st = await ev(() => { const r = document.querySelector('.gm'); return r ? { phase: r.__game.phase, busy: r.__game.busy, n: r.__game.play?.n } : { phase: 'closed' }; });
      if (st.phase !== 'round') break;
      if (st.busy) { await sleep(250); continue; }
      const right = st.n !== 1;
      const did = await ev((rt) => { const r = document.querySelector('.gm'); return r.__game.g.bot ? (r.__game.bot(rt), 1) : 0; }, right);
      if (!did) await key('1');
      if (st.n === 1) { await sleep(450); await shot(`game-${g.kind}-${g.id}-3-miss`); }
      await sleep(g.kind === 'sequence' || g.kind === 'match-fast' ? 1500 : 700);
    }
    await until(() => document.querySelector('.gm')?.__game?.phase === 'result', `the result of ${g.id}`, 60000);
    await sleep(700); await shot(`game-${g.kind}-${g.id}-4-result`);
    await key('Enter'); await sleep(900);
  }

  // ---- 6. after the ending: the keeper on a return
  await ev(() => { const s = __hb.state; s.ended = true; s.passedLeague = true; (s.story ||= {}).turned = true; s.story.door = true; __hb.xp.toTier('known'); delete s.xp.announce; return 1; });
  await ev(() => { __hb.story.door(); return 1; });
  await until(() => __game.scene.getScene('UI').saying, 'the keeper', 20000);
  await sleep(1500); await shot('keeper-return'); await key('Space'); await sleep(1500); await shot('keeper-return-2');
  await closeAll();
  await browser.close();
}

if (!process.env.PHONE) await run(false);
if (!process.env.DESK) await run(true);
if (problems.length) { console.log(`\n${problems.length} problems:`); problems.forEach((p) => console.log(`  ${p}`)); process.exit(1); }
console.log('world pictures: no problems');
