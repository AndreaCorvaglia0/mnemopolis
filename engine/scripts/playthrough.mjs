// A real play-through of the built game, from arrival to the ending, through the real screens.
// Run after a build:   npm run play          (a desktop window, mouse and keys)
//                      npm run play:phone    (a phone held upright, taps)
//                      npm run play:ci       (the same story, faster: the player is carried to the
//                                             doors instead of walking the town; every screen is
//                                             still used as a player would)
// Options: Q='&nolife' adds to the address; OUT=/tmp is where the pictures and the log go
// (play-*.png, play-phone-*.png, play-log.txt). Exit code 1 on any failed check.
//
// What the bot does: only what a player can do. It presses keys, clicks or taps real elements
// (canvas tiles, HTML buttons), drags on the lab pictures and types into the locks. It knows the
// right answers (it reads them from the course data, like a player who studied). It READS state
// through window.__hb and the scenes (where the player is, which screen is open, the tracker's
// line), and never writes it, with two exceptions, both said in the log: FAST (play:ci) puts the
// player in front of a door instead of walking there, and every run starts from a fresh save.
//
// At every step it checks the tracker against what a sensible player would do next (its own plan):
// the tracker must name that step, never something done or impossible. It also checks a few known
// suspects: a stray Space after a duel, the exit tile of a house, every core house reachable, etc.
import puppeteer from 'puppeteer-core';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const PHONE = !!process.env.PHONE, FAST = !!process.env.FAST, OUT = process.env.OUT || '/tmp';
const TAG = `${process.env.NAME || 'play'}${PHONE ? '-phone' : ''}${FAST ? '-ci' : ''}`;
const html = process.env.HTML || path.join(here, '..', 'dist', 'index.html');
const CHROME = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
if (!CHROME) { console.log('No Chrome or Chromium found (set CHROME=/path): the play-through was skipped.'); process.exit(0); }
if (!existsSync(html)) { console.log('No build yet: run the build first.'); process.exit(1); }
mkdirSync(OUT, { recursive: true });

// The bot plays the plain town (world.json "story": false): the story has its own pictures
// (npm run shots:story); STORY=1 in the environment would leave the story on, which the bot does
// not know how to play yet.
if (process.env.STORY !== '1') process.env.STORY = '0';
const { Q } = await import('../src/mechanics/quest/active.js');
const { trackerLine } = await import('../src/mechanics/quest/strings.js');
const { PLACE, QUESTIONS } = await import('../src/data/content.js');
const { LABS } = await import('../src/course/labs.js');
const { RIDDLES } = await import('../src/mechanics/riddles/data.js');
const { DATA } = await import('../src/course/_data.js');
const { GATE } = await import('../src/world/townMap.js');

// ---------------------------------------------------------------- log, checks, actions
const T0 = Date.now(), lines = [], problems = [];
let actions = 0, shotN = 0;
const t = () => ((Date.now() - T0) / 1000).toFixed(1).padStart(6);
const log = (s) => { const l = `${t()}s  ${s}`; lines.push(l); console.log(l); };
const fail = (s) => { problems.push(s); log(`!! ${s}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', protocolTimeout: 240000,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
await page.setViewport(PHONE ? { width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { width: 1280, height: 760, deviceScaleFactor: 1 });
page.on('pageerror', (e) => fail(`page error: ${(e.stack || e.message).slice(0, 400)}`));
page.on('console', (m) => { if (m.type() === 'error') fail(`console error: ${m.text().slice(0, 300)}`); else if (m.text().startsWith('walker:')) log(`!! NOTE ${m.text()}`); });
const q = `?lite&test${PHONE ? '&touch' : ''}${process.env.STORY === '0' ? '&story=0' : ''}${process.env.Q || ''}`;
await page.goto(`file://${html}${q}`);
log(`${TAG}: ${DATA.title} (${DATA.language}), ${PHONE ? 'phone 390x844, taps' : 'desktop 1280x760, mouse and keys'}${FAST ? ', FAST: carried to doors' : ''}, address ${q}`);

const ev = (fn, ...args) => page.evaluate(fn, ...args);
async function until(fn, what, ms = 40000, ...args) {
  const t1 = Date.now();
  for (;;) {
    let v;
    try { v = await page.evaluate(fn, ...args); } catch (e) { v = undefined; }
    if (v) return v;
    // a person remarks on the player's experience (mechanics/experience/world.js): read it and go on
    if (await page.evaluate(() => !!__game.scene.getScene('UI')?.announcing).catch(() => false)) { log('   a remark on experience, read'); await page.keyboard.press('Space'); await sleep(500); continue; }
    if (Date.now() - t1 > ms) { await shot(`stuck-${what.replace(/\W+/g, '-').slice(0, 30)}`); throw new Error(`timed out waiting for: ${what}`); }
    await sleep(150);
  }
}
async function shot(name) {
  shotN += 1;
  const f = path.join(OUT, `${TAG.replace('-ci', '')}-${String(shotN).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: f });
  log(`   [picture] ${path.basename(f)}`);
}

// a player's gestures; each counts as one action
async function key(k) { actions += 1; await page.keyboard.press(k); await sleep(140); }
async function tap(x, y) {
  actions += 1;
  if (PHONE) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
  await sleep(160);
}
async function clickEl(sel, text = null, i = 0) {
  const at = await ev((sel, text, i) => {
    const els = [...document.querySelectorAll(sel)].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && !e.disabled && (text == null || e.textContent.includes(text)); });
    const e = els[i]; if (!e) return null;
    e.scrollIntoView({ block: 'nearest' });
    const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2];
  }, sel, text, i);
  if (!at) throw new Error(`no element ${sel}${text ? ` with "${text}"` : ''}`);
  await tap(...at);
}
async function drag(x1, y1, x2, y2) {
  actions += 1;
  if (PHONE) {
    await page.touchscreen.touchStart(x1, y1);
    for (let k = 1; k <= 10; k++) await page.touchscreen.touchMove(x1 + ((x2 - x1) * k) / 10, y1 + ((y2 - y1) * k) / 10);
    await page.touchscreen.touchEnd();
  } else {
    await page.mouse.move(x1, y1); await page.mouse.down();
    for (let k = 1; k <= 10; k++) await page.mouse.move(x1 + ((x2 - x1) * k) / 10, y1 + ((y2 - y1) * k) / 10);
    await page.mouse.up();
  }
  await sleep(250);
}
async function typeText(s) { actions += 1; await page.keyboard.type(s, { delay: 25 }); await sleep(150); }

// ---------------------------------------------------------------- reading the game (read only)
const probe = () => ev(() => {
  const ui = __game.scene.getScene('UI'), scenes = __game.scene.getScenes(true).map((s) => s.sys.settings.key).filter((k) => k !== 'UI');
  const sc = scenes[0] && __game.scene.getScene(scenes[0]);
  const dom = document.querySelector('.lx') ? 'lab' : document.querySelector('.dl') ? 'duel' : document.querySelector('.lk') ? 'lock' : document.querySelector('.qe') ? 'ending' : document.querySelector('.qm') ? 'menu' : document.querySelector('.hb-over') ? 'page' : null;
  return { scene: scenes[0] || null, floor: sc?.floor, id: sc?.id, phase: ui.phase || null, busy: !!ui.busy, dom,
    track: ui.trackFull, quest: ui.quest && { kind: ui.quest.kind, place: ui.quest.place?.id, n: ui.quest.n, m: ui.quest.m, here: ui.quest.here },
    say: ui.saying, choice: ui.choice && { q: ui.choice.question, options: ui.choice.options }, prompt: ui.promptText || null,
    p: sc?.player ? [sc.player.tx, sc.player.ty, sc.player.dir] : null, moving: !!sc?.player?.moving, locked: !!(sc?.locked || sc?.leaving) };
});
const S = () => ev(() => JSON.parse(JSON.stringify(__hb.state)));

// the tracker against the bot's own plan. plan: { kind, place, n, m, here }
let lastTrack = null;
async function checkTracker(plan, where) {
  const p = await probe(), qq = p.quest;
  const label = `tracker "${p.track}"`;
  if (p.track !== lastTrack) { log(`   ${label}  (${where})`); lastTrack = p.track; }
  if (!qq) return fail(`no tracker step at ${where}`);
  if (/undefined|\{|\}|NaN/.test(p.track)) fail(`${label} has a hole (${where})`);
  const st = await S();
  // never something done: a house named must not have its badge; a lab named must not be finished
  if (qq.place && st.stamps[qq.place]) fail(`${label} names a house already won (${where})`);
  if (qq.kind === 'lab' && qq.n >= qq.m) fail(`${label} asks for a finished lab (${where})`);
  if (qq.kind === 'league' && st.passedLeague) fail(`${label}: League already won (${where})`);
  if (!plan) return;
  const bad = Object.entries(plan).filter(([k, v]) => v !== undefined && qq[k] !== v);
  if (bad.length) fail(`${label} at ${where}: expected ${JSON.stringify(plan)}, got ${JSON.stringify(qq)}`);
}

// ---------------------------------------------------------------- dialogues
async function waitIdle(what = 'the game to be free', ms = 40000) {
  // a person may remark that the player's experience changed (mechanics/experience/world.js): read it, as a player would
  for (let i = 0; i < 20; i++) {
    const t = await ev(() => { const ui = __game.scene.getScene('UI'); return ui.announcing && ui.saying ? `${ui.announcing}: ${ui.saying.name}: ${ui.saying.line}` : null; });
    if (!t) { await sleep(300); if (!(await ev(() => !!__game.scene.getScene('UI').announcing))) break; continue; }
    log(`   a remark on experience (${t})`); await key('Space'); await sleep(600);
  }
  return until(() => { const ui = __game.scene.getScene('UI'); const s = __game.scene.getScenes(true).find((x) => x.sys.settings.key !== 'UI'); return !ui.busy && !ui.modals && !document.querySelector('.lx,.dl,.lk,.qe,.qm,.hb-over') && s && !s.locked && !s.leaving && !s.player?.moving; }, what, ms);
}
// read through what a person says: Space, or a tap on the box
async function readSay(maxLines = 12) {
  const said = [];
  for (let i = 0; i < maxLines; i++) {
    const p = await probe();
    if (p.phase !== 'say') break;
    if (p.say && said[said.length - 1] !== p.say.line) said.push(p.say.line);
    await sleep(500); // the typewriter
    if (PHONE) { const c = await ev(() => __hb.uiToPage(480, 270)); await tap(...c); } else await key('Space');
    await sleep(300);
  }
  return said;
}
// pick a dialogue option by its label (a regex or a string)
async function choose(label) {
  const p = await until(() => { const c = __game.scene.getScene('UI').choice; return c && { options: c.options, q: c.question }; }, `a choice offering ${label}`);
  const i = p.options.findIndex((o) => (typeof label === 'function' ? label(o) : label instanceof RegExp ? label.test(o) : o === label));
  if (i < 0) { fail(`option ${label} not offered (offered: ${p.options.join(' | ')})`); return false; }
  await sleep(250);
  if (PHONE) { const at = await ev((i) => { const c = __game.scene.getScene('UI').choice; return __hb.uiToPage(...c.at[i]); }, i); await tap(...at); }
  else {
    for (let n = 0; n < 10; n++) { const sel = await ev(() => __game.scene.getScene('UI').choice?.sel()); if (sel === i) break; await key('ArrowDown'); }
    await key('Space');
  }
  return true;
}

// ---------------------------------------------------------------- walking
// a path from the player to a tile (or next to it), with the scene's own rule for what can be
// entered: the same search the game makes when a player taps
const pathTo = (tx, ty) => ev((tx, ty) => {
  const sc = __game.scene.getScenes(true).find((x) => x.sys.settings.key !== 'UI'), pl = sc.player, can = sc.canEnter;
  const D = [[0, -1], [0, 1], [-1, 0], [1, 0]], k = (x, y) => `${x},${y}`;
  const there = can(tx, ty), goals = new Set();
  if (there === true || (there && typeof there === 'object')) goals.add(k(tx, ty));
  else D.forEach(([dx, dy]) => { if (can(tx + dx, ty + dy) === true || (tx + dx === pl.tx && ty + dy === pl.ty)) goals.add(k(tx + dx, ty + dy)); });
  const prev = new Map([[k(pl.tx, pl.ty), null]]), qq = [[pl.tx, pl.ty]];
  let end = goals.has(k(pl.tx, pl.ty)) ? k(pl.tx, pl.ty) : null;
  for (let i = 0; i < qq.length && !end && i < 20000; i++) {
    const [x, y] = qq[i];
    for (const [dx, dy] of D) {
      const nx = x + dx, ny = y + dy, kk = k(nx, ny);
      if (prev.has(kk)) continue;
      const isGoal = goals.has(kk);
      if (can(nx, ny) !== true && !(isGoal && there && typeof there === 'object')) continue;
      prev.set(kk, k(x, y));
      if (isGoal) { end = kk; break; }
      qq.push([nx, ny]);
    }
  }
  if (!end) return null;
  const out = [];
  for (let c = end; c; c = prev.get(c)) out.unshift(c.split(',').map(Number));
  return out;
}, tx, ty);
const tilePage = (x, y) => ev((x, y) => { const sc = __game.scene.getScenes(true).find((s) => s.sys.settings.key !== 'UI'); return __hb.worldToPage(sc.sys.settings.key, x * 16 + 8, y * 16 + 8); }, x, y);
const vp = PHONE ? { w: 390, h: 844 } : { w: 1280, h: 760 };
// the town scrolls: aim inside the middle of the screen, clear of the HUD; a room is all on screen
let inTown = true;
const onScreen = ([x, y]) => (inTown ? x > 16 && x < vp.w - 16 && y > vp.h * 0.18 && y < vp.h - 80 : x > 4 && x < vp.w - 4 && y > 4 && y < vp.h - 4); // clear of the HUD and the prompt

// Walk like a player who taps: tap the farthest tile of the way that is on screen, wait, again; at
// the end tap the thing itself (a door, a person: the game walks next to it and uses it).
// the camera follows the player with a lag: a tap aimed while it still moves lands on another tile
async function settle() {
  let last = '';
  for (let i = 0; i < 30; i++) {
    const now = await ev(() => { const s = __game.scene.getScenes(true).find((x) => x.sys.settings.key !== 'UI'); const c = s.cameras.main; return `${Math.round(c.scrollX)},${Math.round(c.scrollY)}`; });
    if (now === last) return; last = now; await sleep(120);
  }
}
async function walkTo(tx, ty, what, { use = true } = {}) {
  inTown = (await probe()).scene === 'Town';
  for (let leg = 0; leg < 30; leg++) {
    await settle();
    const way = await pathTo(tx, ty);
    if (!way) { fail(`no way to ${what} (${tx},${ty}) from ${JSON.stringify((await probe()).p)}`); return false; }
    if (await ev(() => !!__game.scene.getScene('UI').announcing)) { await waitIdle(); continue; } // a remark on experience first
    const target = await tilePage(tx, ty);
    if (onScreen(target)) {
      if (use || way.length > 1) await tap(...target);
      return true;
    }
    // right next to it but the thing sits under the edge of the screen: use the prompt, as a player would
    if (use && way.length <= 2) {
      const pr = await ev(() => { const ui = __game.scene.getScene('UI'), b = ui.promptBox; if (!b) return null; const z = b.list.find((o) => o.type === 'Zone'); return __hb.uiToPage(z.x + z.width / 2, z.y + z.height / 2); });
      if (pr) { if (PHONE) await tap(...pr); else await key('Space'); return true; }
    }
    let pick = null;
    for (let i = way.length - 1; i > 0; i--) { const at = await tilePage(...way[i]); if (onScreen(at)) { pick = at; break; } }
    if (!pick) { fail(`nothing of the way to ${what} is on screen`); return false; }
    await tap(...pick);
    // wait until the player stops walking; if nothing happens for long, say what the game was doing
    await sleep(400);
    try {
      const r = await until(() => { const s = __game.scene.getScenes(true).find((x) => x.sys.settings.key !== 'UI'), ui = __game.scene.getScene('UI'); return ui.choice && /grass|erba/i.test(ui.choice.question) ? 'grass' : s && !s.player.moving && !s.nav.walking; }, `walking toward ${what}`, 30000);
      // a question rustled in the tall grass on the way: a player in a hurry says "not now"
      if (r === 'grass' && what !== 'tall grass') { log(`   on the way to ${what}: a grass question, "not now"`); await choose((o, i) => /not now|non ora/i.test(o)); await waitIdle(); continue; }
      if (r === 'grass') return true;
    }
    catch (e) {
      const d = await ev(() => { const s = __game.scene.getScenes(true).find((x) => x.sys.settings.key !== 'UI'), ui = __game.scene.getScene('UI'); return { scene: s?.sys.settings.key, moving: s?.player.moving, path: s?.nav.path.length, pending: s?.nav.pending, locked: s?.locked, busy: ui.busy, modals: ui.modals, phase: ui.phase, sleeping: __game.loop.sleeping, at: [s?.player.tx, s?.player.ty], tweens: s?.tweens.getTweens?.().length }; });
      fail(`stuck walking toward ${what}: ${JSON.stringify(d)}`);
      throw e;
    }
  }
  fail(`gave up walking to ${what}`);
  return false;
}
// FAST mode only: carried in front of a building's door (a helper writes the player's position)
async function carryTo(x, y, dir = 'up') {
  await ev((x, y, dir) => { const s = __game.scene.getScene('Town'); s.player.tx = x; s.player.ty = y; s.player.place(); s.player.face(dir); s.showWhere(x, y); return 1; }, x, y, dir);
  await sleep(300);
}
async function enterHouse(id) {
  const b = await ev((id) => { const B = __game.scene.getScene('Town'); const bb = B.doors && [...B.doors.values()].find((o) => o.id === id); return bb && { doors: bb.doors, x: bb.x, y: bb.y, w: bb.w, h: bb.h, scene: bb.scene || 'Interior' }; }, id);
  if (!b) { fail(`no building for ${id}`); return false; }
  const [dx, dy] = b.doors[0];
  if (FAST) await carryTo(dx, dy + 2, 'up');
  for (let attempt = 0; ; attempt++) {
    await walkTo(dx, dy, `the door of ${PLACE[id].name}`);
    try { await until((sc) => { const s = __game.scene.getScene(sc); return (s.sys.isActive() && s.id && !s.leaving) || __game.scene.getScene('UI').phase; }, `inside ${id}`, 40000, b.scene); } catch (e) { if (attempt > 1) throw e; }
    const p = await probe();
    if (p.scene === b.scene) break;
    // something else answered the tap (a sign, a person on the way): read it, like a player, and try again
    log(`   on the way to ${id}: ${p.phase} ${JSON.stringify(p.say || p.choice || '')}`);
    if (p.phase === 'say') await readSay(); else if (p.phase === 'choose') await key('Escape');
    await waitIdle();
    if (attempt > 2) { fail(`could not get into ${id}`); return false; }
  }
  await waitIdle(`the room of ${id}`);
  return true;
}
async function leaveHouse(id) {
  const room = await ev(() => { const s = __game.scene.getScenes(true).find((x) => x.sys.settings.key !== 'UI'); const r = s.room; return { exit: r?.exit || (s.sys.settings.key === 'Workshop' ? [19, 11] : s.sys.settings.key === 'Museum' ? [2, 8] : null) }; });
  await walkTo(...room.exit, 'the way out');
  await until(() => __game.scene.getScene('Town').sys.isActive(), 'back in town');
  await waitIdle('the town after leaving');
  // the exit tile: one tile below the door, facing down (Town.exitTile)
  const p = (await probe()).p, b = await ev((id) => { const B = __game.scene.getScene('Town'); return [...B.doors.values()].find((o) => o.id === id).doors[0]; }, id);
  if (!(p[0] === b[0] && p[1] === b[1] + 1)) fail(`after leaving ${id} the player is at ${p} (door ${b})`);
}

// ---------------------------------------------------------------- the lab
// the right gestures for each station of the course (the bot studied); a station without a recipe
// is reported, not faked
const paneAt = (ux, uy) => ev((ux, uy) => { const p = document.querySelector('.lx .lab-view')?.__pane || document.querySelector('.lab-view').__pane; return p.toScreen(ux, uy); }, ux, uy);
const items = () => ev(() => { const p = document.querySelector('.lab-view').__pane; return { W: p.W, H: p.H, items: (p.items || []).map((o) => ({ c: o.c, n: o.n, x: o.x, y: o.y })) }; });
async function dragItem(match, to) {
  const P = await items(), a = P.items.find(match);
  if (!a) throw new Error('no such disc');
  const [x1, y1] = await paneAt(a.x, a.y), [x2, y2] = await paneAt(...to(P));
  await drag(x1, y1, x2, y2);
}
// a slider set like a finger or a mouse would: a tap on the track, then (with keys) arrows to the value
async function setSlider(i, value) {
  const r = await ev((i) => { const e = document.querySelectorAll('.lx input[type=range]')[i]; e.scrollIntoView({ block: 'nearest' }); const b = e.getBoundingClientRect(); return { x: b.left, w: b.width, y: b.top + b.height / 2, min: +e.min, max: +e.max, v: +e.value }; }, i);
  const f = (value - r.min) / (r.max - r.min), pad = 8;
  await tap(r.x + pad + f * (r.w - 2 * pad), r.y);
  for (let n = 0; n < 40; n++) {
    const v = await ev((i) => +document.querySelectorAll('.lx input[type=range]')[i].value, i);
    if (v === value) break;
    if (PHONE) { // a finger nudges the thumb
      const v2 = v; const dx = ((value - v2) / (r.max - r.min)) * (r.w - 2 * pad);
      const x0 = r.x + pad + ((v2 - r.min) / (r.max - r.min)) * (r.w - 2 * pad);
      await drag(x0, r.y, x0 + dx, r.y);
      if (n > 6) break;
    } else await key(v < value ? 'ArrowRight' : 'ArrowLeft');
  }
  return ev((i) => +document.querySelectorAll('.lx input[type=range]')[i].value, i);
}
const segBtn = (label) => clickEl('.lx .lab-seg button', label);

// cone curves as the Cone Cave draws them (the bot knows the station's model, as a student would
// after reading it): solve lamp B's two parts for a light A
const bell = (peak, w) => (nm) => Math.exp(-((nm - peak) ** 2) / (2 * w * w));
const CL = bell(565, 48), CM = bell(540, 42);
function coneMatch(nm) {
  const a = [[CL(630), CL(535)], [CM(630), CM(535)]], b = [CL(nm), CM(nm)], det = a[0][0] * a[1][1] - a[0][1] * a[1][0];
  return [Math.round(((b[0] * a[1][1] - a[0][1] * b[1]) / det) * 100), Math.round(((a[0][0] * b[1] - a[1][0] * b[0]) / det) * 100)];
}

const RECIPES = {
  'lamps:mix': async () => {
    await dragItem((o) => o.c === '#ff0000', (P) => { const g = P.items.find((o) => o.c === '#00ff00'); return [g.x - 40, g.y]; });
    await dragItem((o) => o.c === '#0000ff', (P) => { const g = P.items.find((o) => o.c === '#00ff00'); return [g.x - 20, g.y + 50]; });
  },
  'lamps:pixel': async () => { await setSlider(0, 255); await setSlider(1, 130); await setSlider(2, 0); await setSlider(0, 128); await setSlider(1, 128); await setSlider(2, 128); await setSlider(3, 80); },
  'lamps:gamma': async () => { await setSlider(0, 128); await setSlider(0, 188); },
  'wheel:dials': async () => {
    await setSlider(0, 82);
    const P = await items(), up = P.W < P.H, c = up ? [240, 190, 175] : [250, 250, 200], a = (-4 * Math.PI) / 180;
    const [x, y] = await paneAt(c[0] + Math.cos(a) * c[2] * 0.8, c[1] + Math.sin(a) * c[2] * 0.8); await tap(x, y);
    const [x2, y2] = await paneAt(c[0] + 1, c[1]); await tap(x2, y2);
  },
  'context:tint': async () => { await clickEl('.lx .lab-seg button', null, 1); await clickEl('.lx .lab-seg button', null, 0); },
  'cones:match': async () => {
    const [r1, g1] = coneMatch(580); await setSlider(0, r1); await setSlider(1, g1);
    await setSlider(2, 600); const [r2, g2] = coneMatch(600); await setSlider(0, r2); await setSlider(1, g2);
  },
  'print:inks': async () => {
    await dragItem((o) => o.n === 'cyan', (P) => { const g = P.items.find((o) => o.n === 'yellow'); return [g.x - 40, g.y - 30]; });
    await dragItem((o) => o.n === 'magenta', (P) => { const g = P.items.find((o) => o.n === 'yellow'); return [g.x + 30, g.y - 40]; });
  },
  'print:compare': async () => { for (const i of [0, 1, 2]) await clickEl('.lx .lab-ctl button.lab-btn', null, i); for (const i of [0, 1]) await clickEl('.lx .lab-ctl button.lab-btn', null, i); },
  'print:dots': async () => { await setSlider(0, 10); await clickEl('.lx .lab-seg button', null, 1); },
  // the Italian test course (engine/tests/fixtures/prova)
  'leva:altalena': async () => { await setSlider(0, 30); },
  'piano:rampa': async () => { await setSlider(0, 4); },
  'carrucola:paranco': async () => { await clickEl('.lx .lab-seg button', null, 0); await clickEl('.lx .lab-seg button', null, 1); },
};
// context:grey, written plainly: drag the second square onto the first, then the plain wall
RECIPES['context:grey'] = async () => {
  const P = await items(), [a, b] = P.items;
  const [x1, y1] = await paneAt(b.x, b.y), [x2, y2] = await paneAt(a.x + 30, a.y + 20);
  await drag(x1, y1, x2, y2);
  await clickEl('.lx .lab-seg button', null, 1);
};

// one station: predict, the tries, the takeaway; returns when the primary button is there
async function doStation(id, k, { upper = false, wrongPredict = false } = {}) {
  await until(() => document.querySelector('.lx')?.dataset.ready === '1', `station ${id}:${k}`);
  const st = await ev(() => document.querySelector('.lx').dataset.station);
  const sid = upper ? st.split(':')[1] : null;
  const def = upper ? PLACE[id].lab.stations.find((s) => s.id === upper[Number(st.split(':')[1])]) : LABS[id].stations[k];
  const name = def?.id;
  log(`   station ${id}:${name} "${def?.tab}"${upper ? ' (upstairs)' : ''}`);
  if (def?.predict) {
    const pick = wrongPredict ? (def.predict.answer + 1) % def.predict.options.length : def.predict.answer;
    await clickEl('.lx .lx-choice', null, pick);
    await sleep(500);
  }
  const recipe = RECIPES[`${id}:${name}`];
  if (!recipe) { fail(`no recipe for station ${id}:${name}`); return false; }
  await recipe();
  try { await until(() => !!document.querySelector('.lx .lx-primary'), `the takeaway of ${id}:${name}`, 25000); }
  catch (e) {
    fail(`station ${id}:${name}: the takeaway did not come after the tries (${e.message})`);
    return false;
  }
  return true;
}
// the whole ground-floor lab of a house, from its door in the room (or its machines in a workshop)
async function doLab(id) {
  const kind = PLACE[id].kind, n = LABS[id]?.stations.length || 0;
  if (!n) return;
  if (kind === 'workshop') {
    // machine 1: the workshop has one machine per station; Next walks the belt
    const spots = await ev(() => [...__game.scene.getScene('Workshop').at.entries()].map(([k2, i]) => [i, ...k2.split(',').map(Number)]).sort((a, b) => a[0] - b[0]));
    await walkTo(spots[0][1], spots[0][2], 'machine 1');
  } else {
    const lab = await ev(() => __game.scene.getScene('Interior').room.lab);
    await walkTo(lab[0], lab[1], 'the lab door');
  }
  await until(() => document.querySelector('.lx')?.dataset.ready === '1', `the lab of ${id}`);
  await checkTracker({ kind: 'lab', place: id, here: true, n: 0 }, `${id}: lab open`);
  for (let k = 0; k < n; k++) {
    const ok = await doStation(id, k, { wrongPredict: k === 0 && id === Q.core[0].id });
    if (k === 0 && id === Q.core[0].id) await shot(`lab-${id}-takeaway`);
    if (!ok) { await key('Escape'); return; }
    await clickEl('.lx .lx-primary');
    await sleep(700);
  }
  await until(() => !document.querySelector('.lx'), 'the lab to close after the last station', 15000).catch(async () => { fail(`the lab of ${id} did not close after its last "Next"`); await key('Escape'); });
  await waitIdle();
}

// ---------------------------------------------------------------- the duel
async function duel({ win = true, label = '' } = {}) {
  await until(() => document.querySelector('.dl .dl-o'), `the duel screen ${label}`);
  let turns = 0;
  for (let i = 0; i < 20; i++) {
    const s = await until(() => { const r = document.querySelector('.dl'); if (!r) return { gone: true }; return r.dataset.mode === 'q' && r.querySelector('.dl-o') ? { mode: 'q', q: r.dataset.q } : r.dataset.mode === 'end' ? { mode: 'end', won: r.dataset.won } : null; }, 'a duel turn');
    if (s.gone) return { left: true };
    if (s.mode === 'end') {
      const won = s.won === 'true';
      if (turns && i === turns) {} // eslint
      return { won, turns };
    }
    const qq = QUESTIONS.find((x) => x.id === s.q);
    const pick = win ? qq.answer : (qq.answer + 1) % qq.options.length;
    if (PHONE) await clickEl('.dl .dl-o', null, pick); else await key(String(pick + 1));
    turns += 1;
    await until(() => document.querySelector('.dl')?.dataset.mode !== 'q', 'the feedback');
    const fb = await ev(() => document.querySelector('.dl-fb')?.textContent.slice(0, 160));
    if (turns === 1 || !win) log(`     turn ${turns}: ${win ? 'right' : 'wrong'} -> ${fb}`);
    if (!win && turns === 1) { await sleep(400); await shot('duel-miss-rebuttal'); }
    if (/Insight/.test(fb)) fail('the duel says "Insight"');
    if (PHONE) await clickEl('.dl .dl-b.go'); else await key('Enter');
    await sleep(300);
  }
  throw new Error('the duel never ended');
}
// talk to the host and challenge them; play the duel; the badge card
async function challengeHost(id, { win = true, shotName = null } = {}) {
  const scn = (await probe()).scene, at = await ev((scn) => { const s = __game.scene.getScene(scn); const m = s.master || s.guide; return [m.tx, m.ty]; }, scn);
  await walkTo(at[0], at[1], `the host of ${id}`);
  await until(() => __game.scene.getScene('UI').choice, `the host's options in ${id}`);
  const { CHALLENGE } = await import('../src/mechanics/duel/lines.js');
  const lang = DATA.language?.startsWith('it') ? 'it' : 'en';
  const ok = await choose((o) => o === CHALLENGE[lang].first || o === CHALLENGE[lang].friendly);
  if (!ok) return null;
  const r = await duel({ win, label: id });
  log(`   duel at ${id}: ${r.won ? 'WON' : 'lost'} in ${r.turns} turns`);
  if (shotName) await shot(shotName);
  if (r.won) {
    if (PHONE) await clickEl('.dl .dl-b.go'); else await key('Enter');
    // the badge card (first win only)
    const stamped = await until(() => __game.scene.getScene('UI').phase === 'stamp' || (!document.querySelector('.dl') && !__game.scene.getScene('UI').busy) ? (__game.scene.getScene('UI').phase || 'none') : null, 'the badge card or the room');
    if (stamped === 'stamp') {
      await sleep(900); if (shotName) await shot(`${shotName}-badge`);
      // the suspect: the Space that closes the badge card must not reach the room
      if (PHONE) { const c = await ev(() => __hb.uiToPage(480, 270)); await tap(...c); } else await key('Space');
      await sleep(1200);
      const after = await probe();
      if (after.phase || after.dom) fail(`after the badge card something opened by itself: phase ${after.phase}, ${after.dom}, ${JSON.stringify(after.choice || after.say)}`);
    }
  } else {
    await shot(`duel-lost-${id}`);
  }
  return r;
}

// ---------------------------------------------------------------- locks and stairs
async function useLock(r) {
  const [room, generated] = await ev(() => { const r = __game.scene.getScene('Interior').room; return [r.locks || [], !!r.generated]; });
  const l = room.find((x) => x.id === r.id);
  if (!l) { if (generated) fail(`lock ${r.id} is not in the room`); else log(`   lock ${r.id}: no place for it in a standard room ("gen" off)`); return; }
  await walkTo(l.x, l.y, `the ${r.kind} ${r.id}`);
  await until(() => document.querySelector('.lk')?.dataset.ready === '1', `the close-up of ${r.id}`);
  const answer = String([].concat(r.answer)[0]);
  const wrong = r.type === 'number' || typeof r.answer === 'number' || [].concat(r.answer).every((a) => /^\d+$/.test(String(a))) ? '7' : 'blue';
  // one deliberate miss, to see the thought
  const enter = async (s) => {
    const pad = await ev(() => !!document.querySelector('.lk-pad'));
    if (pad && /^[\d,.]+$/.test(s)) { for (const ch of s) await clickEl('.lk-pad button', ch === ',' || ch === '.' ? ',' : ch); }
    else { await clickEl('.lk input'); await ev(() => { const i = document.querySelector('.lk input'); i.select(); }); await typeText(s); }
    await clickEl('.lk-try');
  };
  await enter(wrong);
  const thought = await until(() => { const e = document.querySelector('.lk-think'); return e && !e.hidden && e.textContent; }, 'the thought after a miss', 8000);
  log(`   lock ${r.id}: typed "${wrong}" -> ${thought}`);
  await shot(`lock-${r.id}-miss`);
  // what covers the input? (D1: nothing may cover where the typed digits show)
  const cover = await ev(() => { const d = document.querySelector('.lk-disp:not([hidden]), .lk-screen input, .lk-in'); if (!d) return null; const a = d.getBoundingClientRect(); for (const e of document.querySelectorAll('.lk-note, .lk-bubble, .lk-think')) { if (e.hidden || e.contains(d)) continue; const b = e.getBoundingClientRect(); if (b.width && b.left < a.right && b.right > a.left && b.top < a.bottom && b.bottom > a.top) return e.className; } return null; });
  if (cover) fail(`lock ${r.id}: ${cover} covers the place where the answer shows`);
  await sleep(800);
  await enter(answer);
  await until(() => document.querySelector('.lk-doc'), `${r.id} to open`, 15000);
  log(`   lock ${r.id}: typed "${answer}" -> opened`);
  await shot(`lock-${r.id}-open`);
  const station = await ev(() => !!document.querySelector('.lk-doc .acts button.main'));
  if (station) {
    await clickEl('.lk-doc .acts button.main');
    const ids = await until(() => document.querySelector('.lx')?.dataset.ready === '1' && document.querySelector('.lx').dataset.station, 'the advanced station');
    const sid = [].concat(r.inside.station)[0];
    log(`   advanced station ${ids} (${sid})`);
    const ok = await doStationUpper(r.place, sid);
    if (ok) { await shot(`advanced-${sid}`); await clickEl('.lx .lx-primary'); }
    await sleep(600);
    if (await ev(() => !!document.querySelector('.lx'))) await key('Escape');
  } else await clickEl('.lk-doc .acts button', null, (await ev(() => document.querySelectorAll('.lk-doc .acts button').length)) - 1);
  await waitIdle('the room after the lock');
}
async function doStationUpper(id, sid) {
  const def = PLACE[id].lab.stations.find((s) => s.id === sid);
  log(`   station ${id}:${sid} "${def.tab}" (upstairs)`);
  if (def.predict) { await clickEl('.lx .lx-choice', null, def.predict.answer); await sleep(500); }
  const recipe = RECIPES[`${id}:${sid}`];
  if (!recipe) { fail(`no recipe for ${id}:${sid}`); return false; }
  await recipe();
  try { await until(() => !!document.querySelector('.lx .lx-primary'), `the takeaway of ${id}:${sid}`, 25000); return true; }
  catch (e) { fail(`advanced station ${id}:${sid}: no takeaway`); return false; }
}
async function upstairs(id) {
  const st = await ev(() => __game.scene.getScene('Interior').room.stairs);
  if (!st) return false;
  await walkTo(st.x, st.y, 'the stairs');
  await until(() => { const s = __game.scene.getScene('Interior'); return s.sys.isActive() && s.floor === 'up' && !s.leaving; }, 'upstairs');
  await waitIdle('upstairs');
  await sleep(1500);
  await shot(`upstairs-${id}`);
  const p = await probe();
  log(`   upstairs in ${id}: tracker "${p.track}"`);
  for (const r of RIDDLES.filter((x) => x.place === id && x.where !== 'room')) await useLock(r);
  // the bench (LAB II): whatever no lock guards
  const free = await ev(() => { const s = __game.scene.getScene('Interior'); return s.floorX?.stations() || []; });
  const done = await S();
  const todo = free.filter((sid) => !done.done[`${id}+up:${sid}`]);
  if (todo.length) {
    const lab = await ev(() => __game.scene.getScene('Interior').room.lab);
    await walkTo(lab[0], lab[1], 'LAB II');
    for (const sid of todo) { await until(() => document.querySelector('.lx')?.dataset.ready === '1', 'LAB II'); if (await doStationUpper(id, sid)) await clickEl('.lx .lx-primary'); await sleep(600); }
    if (await ev(() => !!document.querySelector('.lx'))) await key('Escape');
    await waitIdle();
  }
  const exit = await ev(() => __game.scene.getScene('Interior').room.exit);
  await walkTo(exit[0], exit[1], 'the stairs down');
  await until(() => { const s = __game.scene.getScene('Interior'); return s.sys.isActive() && s.floor === 'ground' && !s.leaving; }, 'downstairs');
  await waitIdle('downstairs');
  return true;
}

// ---------------------------------------------------------------- the menu
async function menu(when) {
  if (PHONE) { const at = await ev(() => { const ui = __game.scene.getScene('UI'); const z = ui.btns.list.find((o) => o.type === 'Zone'); const m = ui.hudRight; return __hb.uiToPage(m.x + z.x + z.width / 2, m.y + z.y + z.height / 2); }); await tap(...at); }
  else await key('Tab');
  if (!(await until(() => document.querySelector('.qm'), 'the menu', 6000).catch(() => null))) { await waitIdle(); if (PHONE) { const at = await ev(() => { const ui = __game.scene.getScene('UI'); const z = ui.btns.list.find((o) => o.type === 'Zone'); const m = ui.hudRight; return __hb.uiToPage(m.x + z.x + z.width / 2, m.y + z.y + z.height / 2); }); await tap(...at); } else await key('Tab'); await until(() => document.querySelector('.qm'), 'the menu'); }
  for (const [i, tab] of [[0, 'journey'], [1, 'map'], [2, 'mysteries']]) {
    await clickEl('.qm-tab', null, i);
    await sleep(600);
    const txt = await ev(() => document.querySelector('.qm-body')?.innerText.slice(0, 400).replace(/\s+/g, ' '));
    log(`   menu ${tab} (${when}): ${txt.slice(0, 160)}`);
    if (/undefined|\{\w+\}/.test(txt)) fail(`menu ${tab} shows a hole: ${txt.slice(0, 120)}`);
    await shot(`menu-${when}-${tab}`);
  }
  await key('Escape');
  await waitIdle('after the menu');
}

// ---------------------------------------------------------------- tall grass
async function tallGrass() {
  const spot = await ev(() => {
    const s = __game.scene.getScene('Town'), g = s.grass;
    const p = s.player; g.sort((a, b) => Math.hypot(a.x - p.tx, a.y - p.ty) - Math.hypot(b.x - p.tx, b.y - p.ty));
    // two grass tiles side by side, to walk back and forth
    const ok = g.find((a) => g.some((b) => b.x === a.x + 1 && b.y === a.y) && g.some((b) => b.x === a.x + 2 && b.y === a.y));
    return ok && [ok.x, ok.y];
  });
  if (!spot) { log('   no tall grass in this town'); return; }
  if (FAST) await carryTo(spot[0], spot[1] + 1, 'up');
  for (let i = 0; i < 40; i++) {
    const p = await probe();
    if (p.phase === 'choose' && /grass|erba/i.test(p.choice?.q || '')) break;
    await walkTo(spot[0] + (i % 2 ? 0 : 2), spot[1], 'tall grass', { use: true });
    await sleep(700);
    await until(() => { const s = __game.scene.getScene('Town'); return !s.player.moving && !s.nav.walking || __game.scene.getScene('UI').phase; }, 'walking in the grass');
  }
  const p = await probe();
  if (p.phase !== 'choose') { fail('no question came from the tall grass after 40 walks'); return; }
  log(`   grass: "${p.choice.q}"`);
  await shot('grass-offer');
  await choose(p.choice.options[0]);
  const qq = await until(() => { const ui = __game.scene.getScene('UI'); return ui.phase === 'quiz-choose' && ui.quizState && { answer: ui.quizState.answer }; }, 'the grass question');
  await sleep(500);
  await shot('grass-question');
  if (PHONE) { const at = await ev((i) => __hb.uiToPage(...__game.scene.getScene('UI').quizState.at[i]), qq.answer); await tap(...at); }
  else { for (let n = 0; n < 5; n++) { const s = await ev(() => __game.scene.getScene('UI').quizState.sel()); if (s === qq.answer) break; await key('ArrowDown'); } await key('Space'); }
  await until(() => __game.scene.getScene('UI').phase === 'quiz-reveal', 'the reveal');
  await sleep(600);
  const txt = await ev(() => __game.scene.getScene('UI').children.list.filter((o) => o.type === 'Container').flatMap((c) => c.list).filter((o) => o.type === 'Text').map((o) => o.text).join(' | '));
  if (/Insight/.test(txt)) fail(`the grass quiz still says "Insight": ${txt.match(/[^|]*Insight[^|]*/)?.[0]}`);
  await shot('grass-reveal');
  if (PHONE) { const c = await ev(() => __hb.uiToPage(480, 270)); await tap(...c); } else await key('Space');
  await waitIdle('after the grass');
}

// ================================================================= the story
let corePath = 0;
try {
const coreIds = Q.core.map((p) => p.id);
log(`core path: ${Q.core.map((p) => `${p.order} ${p.name} (${p.id}, ${p.kind})`).join(' · ')}; extras: ${Q.extra.map((p) => p.id).join(', ') || 'none'}`);
const t0 = Date.now();
// the tracker, sampled every 100 ms in the page: it must never flicker between two lines
await ev(() => { window.__trk = []; setInterval(() => { const t = __game.scene.getScene('UI')?.trackFull; const l = window.__trk[window.__trk.length - 1]; if (t && (!l || l[1] !== t)) window.__trk.push([performance.now(), t]); }, 100); });
// start
await until(() => __game.scene.getScene('UI')?.phase === 'title', 'the title screen', 60000);
await sleep(1500);
await shot('title');
if (PHONE) await tap(195, 420); else await key('Space');
await until(() => __game.scene.getScene('UI').phase === 'say', 'the guide', 30000);
await sleep(1500);
await shot('guide');
const intro = await readSay();
log(`guide: ${intro.join(' / ')}`);
await waitIdle('the town after the guide');
await checkTracker({ kind: 'visit', place: coreIds[0] }, 'after the guide');
await shot('start');
await menu('start');

// the extra house: once, after the first core house (an extra; the tracker must stay on the path)
let didExtra = false, didLose = false, didGrass = false;
for (const [hi, id] of coreIds.entries()) {
  const p = PLACE[id], tH = Date.now();
  log(`== house ${p.order} ${p.name} (${id}, ${p.kind})`);
  await checkTracker({ kind: 'visit', place: id }, `before house ${p.order}`);
  await enterHouse(id);
  await shot(`house-${p.order}-in`);
  if (p.kind === 'museum') await checkTracker(LABS[id] ? { kind: 'lab', place: id } : { kind: 'duel', place: id }, `in ${id}`);
  else await checkTracker(LABS[id] ? { kind: 'lab', place: id, here: true } : { kind: 'duel', place: id }, `in ${id}`);
  await doLab(id);
  await checkTracker({ kind: 'duel', place: id, here: true }, `${id}: lab done`);
  // lose the second house's duel on purpose, then the rematch
  if (hi === 1 && !didLose) {
    const r = await challengeHost(id, { win: false, shotName: `duel-${id}-lost` });
    if (r?.won) fail('the duel was won though every answer was wrong');
    await checkTracker({ kind: 'duel', place: id }, `${id}: duel lost`);
    await clickEl('.dl .dl-b.go'); // Rematch
    const r2 = await duel({ win: true, label: `${id} rematch` });
    log(`   rematch at ${id}: ${r2.won ? 'WON' : 'lost'}`);
    if (PHONE) await clickEl('.dl .dl-b.go'); else await key('Enter');
    const ph = await until(() => __game.scene.getScene('UI').phase === 'stamp' ? 'stamp' : null, 'the badge after the rematch');
    await sleep(800); await shot(`duel-${id}-rematch-badge`);
    if (PHONE) { const c = await ev(() => __hb.uiToPage(480, 270)); await tap(...c); } else await key('Space');
    await sleep(1200);
    const after = await probe(); if (after.phase || after.dom) fail(`after the rematch's badge something opened: ${after.phase} ${after.dom}`);
    didLose = true;
  } else await challengeHost(id, { win: true, shotName: hi === 0 ? `duel-${id}-won` : null });
  await waitIdle();
  const st = await S();
  if (!st.stamps[id] || !st.keys?.[id]) fail(`${id}: badge ${!!st.stamps[id]}, key ${!!st.keys?.[id]} after the win`);
  await checkTracker(hi + 1 < coreIds.length ? { kind: 'visit', place: coreIds[hi + 1] } : { kind: 'league' }, `${id}: won`);
  // stairs and locks on the ground floor
  if (p.kind !== 'workshop' && p.kind !== 'museum') {
    for (const r of RIDDLES.filter((x) => x.place === id && x.where === 'room')) await useLock(r);
    await upstairs(id);
  }
  await leaveHouse(id);
  log(`   house ${p.order} took ${((Date.now() - tH) / 1000).toFixed(0)} s`);
  if (hi === 0 && !didGrass) { await tallGrass(); didGrass = true; }
  if (hi === 0 && Q.extra.length && !didExtra) {
    const x = Q.extra[0];
    log(`== an extra house: ${x.order} ${x.name} (${x.id}, ${x.kind})`);
    await enterHouse(x.id);
    await sleep(800);
    await shot(`extra-${x.id}`);
    await checkTracker({ kind: 'visit', place: coreIds[1] }, `inside the extra ${x.id}`);
    await leaveHouse(x.id);
    didExtra = true;
  }
  if (hi === 1) await menu('mid');
}
// a mini-game (mechanics/games/): walk to a game's object in town (or be carried there), Space or a
// tap, play it through with right answers, and check the coins and the saved best
{
  const gi = await ev(() => __hb.xp.games());
  const spot = gi.town.find((t) => gi.games.find((g) => g.id === t.id)?.open);
  if (!gi.games.length) log('== no mini-games in this course');
  else if (!spot) fail(`no open game in town: ${JSON.stringify(gi.games)}`);
  else {
    const g = gi.games.find((x) => x.id === spot.id);
    log(`== a mini-game: ${g.id} (${g.kind}) on ${spot.object} at ${spot.x},${spot.y}`);
    const before = (await S()).insight;
    if (FAST) await carryTo(spot.stand[0], spot.stand[1]);
    await walkTo(spot.x, spot.y, `the ${spot.object}`);
    if (!(await ev(() => !!document.querySelector('.gm')))) { await settle(); await ev((x, y) => { const s = __game.scene.getScene('Town'); const dx = x - s.player.tx, dy = y - s.player.ty; s.player.face(dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'); return 1; }, spot.x, spot.y); if (PHONE) { const t = await tilePage(spot.x, spot.y); await tap(...t); } else await key('Space'); }
    const opened = await until(() => document.querySelector('.gm')?.__game?.phase === 'intro', `the game ${g.id} to open`, 20000).catch(() => null);
    if (!opened) fail(`the game ${g.id} did not open`);
    else {
      await shot(`game-${g.id}-start`);
      if (PHONE) await clickEl('.gm-btn.primary'); else await key('Enter');
      await until(() => document.querySelector('.gm')?.__game?.phase === 'round', `a round of ${g.id}`, 20000);
      let rounds = 0;
      for (let i = 0; i < 80; i++) {
        const st = await ev(() => { const r = document.querySelector('.gm'); return r ? { phase: r.__game.phase, busy: r.__game.busy } : { phase: 'closed' }; });
        if (st.phase !== 'round') break;
        if (st.busy) { await sleep(200); continue; }
        await ev(() => { document.querySelector('.gm').__game.bot(true); return 1; }); rounds++;
        await sleep(g.kind === 'sequence' || g.kind === 'match-fast' ? 1800 : 900);
      }
      await until(() => document.querySelector('.gm')?.__game?.phase === 'result', `the result of ${g.id}`, 40000);
      const res = await ev(() => document.querySelector('.gm').__result || null);
      await shot(`game-${g.id}-result`);
      if (PHONE) await clickEl('.gm-btn.primary'); else await key('Enter');
      await until(() => !document.querySelector('.gm'), 'the game to close', 10000);
      const after = await S(), best = await ev((id) => __hb.state.xp?.games?.[id]?.best, g.id);
      log(`   ${g.id}: ${rounds} rounds, score ${res?.score}, ${res?.right} right, coins ${before} -> ${after.insight}, best saved ${best}`);
      if (!res || !(res.score > 0)) fail(`${g.id}: no score`);
      if (after.insight - before !== res?.coins) fail(`${g.id}: coins ${after.insight - before}, the result said ${res?.coins}`);
      if (best !== res?.score) fail(`${g.id}: best ${best}, score ${res?.score}`);
    }
    await waitIdle();
  }
}

// the League
log('== the League');
await checkTracker({ kind: 'league' }, 'all houses done');
const champ = await ev(() => { const c = __game.scene.getScene('Town').champion; return c && [c.tx, c.ty]; });
if (!champ) fail('no champion in town: the League cannot be started');
if (FAST) await carryTo(GATE ? champ[0] - GATE.dir[0] * 2 : champ[0], GATE ? champ[1] - GATE.dir[1] * 2 : champ[1] + 2, 'up'); // on the town's side of the champion
await walkTo(champ[0], champ[1], 'the champion');
await until(() => __game.scene.getScene('UI').phase === 'choose', 'the champion');
await shot('league-offer');
await choose(/./);
const lr = await duel({ win: true, label: 'League' });
log(`   League: ${lr.won ? 'WON' : 'lost'} in ${lr.turns} turns`);
await shot('league-won');
if (PHONE) await clickEl('.dl .dl-b.go'); else await key('Enter');
await until(() => __game.scene.getScene('UI').phase === 'stamp', 'the League card');
await sleep(800);
if (PHONE) { const c = await ev(() => __hb.uiToPage(480, 270)); await tap(...c); } else await key('Space');
await until(() => __game.scene.getScene('UI').phase === 'say', 'the champion stepping aside');
const aside = await readSay();
log(`   champion: ${aside.join(' / ')}`);
const gate = await ev(() => { const s = __game.scene.getScene('Town'); return s.gateImg ? (window.__gate = 1) && [s.champion.tx, s.champion.ty] : null; });
const G = GATE;
if (G) {
  // the road out of town: the gate is open now; walk through it
  await waitIdle('the champion aside');
  await sleep(800);
  await checkTracker({ kind: 'ending' }, 'League won, gate open');
  await shot('gate-open');
  // a remark on experience may take the first tap (the League raised it): then walk again
  for (let i = 0; i < 3; i++) {
    await walkTo(G.tiles[0][0], G.tiles[0][1], 'the open gate');
    if (await until(() => document.querySelector('.qe'), 'the ending card', 12000).catch(() => null)) break;
    await waitIdle();
  }
} else log('   (this town has no gate: the card opens at the League hall)');
void gate;
await until(() => document.querySelector('.qe'), 'the ending card', 30000);
await sleep(1000);
await shot('ending');
const card = await ev(() => document.querySelector('.qe').innerText.replace(/\s+/g, ' ').slice(0, 600));
log(`   ending card: ${card}`);
corePath = (Date.now() - t0) / 1000;
await clickEl('.qe-back');
await waitIdle('free roaming');
await checkTracker({ kind: 'free' }, 'after the ending');
await shot('free');
await menu('end');
// free roaming: walk a few tiles
const free = await probe();
const away = await pathTo(free.p[0] + 3, free.p[1] + 3);
if (away) { await walkTo(...away[Math.min(away.length - 1, 4)], 'a few steps away'); await sleep(1500); }
await checkTracker({ kind: 'free' }, 'walking after the ending');
if (G) {
  await walkTo(G.stand[0], G.stand[1], 'the champion\'s old place', { use: false });
  await until(() => { const s = __game.scene.getScene('Town'); return !s.player.moving && !s.nav.walking; }, 'standing before the gate');
  await walkTo(G.tiles[0][0], G.tiles[0][1], 'the gate again');
  const p2 = await until(() => __game.scene.getScene('UI').phase || null, 'what the gate says after the ending', 20000);
  const said = p2 === 'say' ? await readSay() : [];
  log(`   through the gate again: ${p2} ${said.join(' / ')}`);
  if (p2 === 'choose') await key('Escape');
  await waitIdle();
}
} catch (e) { fail(`stopped: ${e.message}`); }

// ---------------------------------------------------------------- report
const trk = await ev(() => window.__trk || []);
for (let i = 2; i < trk.length; i++) if (trk[i][1] === trk[i - 2][1] && trk[i][0] - trk[i - 2][0] < 1500) fail(`the tracker flickered: "${trk[i - 2][1]}" -> "${trk[i - 1][1]}" -> back within ${Math.round(trk[i][0] - trk[i - 2][0])} ms`);
log(`tracker: ${trk.length} lines over the game: ${trk.map((x) => x[1]).join(' | ')}`);
const st = await S();
log(`== done in ${((Date.now() - T0) / 1000).toFixed(0)} s (core path ${corePath.toFixed(0)} s of headless time); ${actions} player actions; coins ${st.insight}; locks ${Object.keys(st.locks || {}).length}; problems ${problems.length}`);
for (const p of problems) log(`PROBLEM: ${p}`);
writeFileSync(path.join(OUT, `${TAG}-log.txt`), lines.join('\n') + '\n');
await browser.close();
process.exit(problems.length ? 1 : 0);
