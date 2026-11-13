import Phaser from 'phaser';
import '@fontsource/pixelify-sans/latin-400.css';
import '@fontsource/pixelify-sans/latin-600.css';
import '@fontsource/dotgothic16/latin-400.css';
import { Boot } from './scenes/Boot.js';
import { Town } from './scenes/Town.js';
import { Interior } from './scenes/Interior.js';
import { UI } from './scenes/UI.js';
import { Museum } from './scenes/Museum.js';
import { Workshop } from './scenes/Workshop.js';
import { initAudio } from './systems/audio.js';
import { openLab } from './lab/shell.js';
import { openReading } from './lab/reading.js';
import { paintKind } from './art/buildings.js';
import { MONUMENT_KINDS } from './art/sprites.js';
import { KINDS } from './world/townMap.js';
import { GEN, THEMES, THEME } from './gen/core.js';
import { paintFacade, HOME_SHAPES } from './gen/facade.js';
import { TRADE_NAMES, EXPERT_NAMES } from './gen/interior/trades.js';
import { EMBLEMS, drawEmblem } from './gen/emblems.js';
import { dressingSheet } from './gen/dressingArt.js';
import { makeCanvas } from './art/px.js';
import { roomSheet, SAMPLE, HOMES } from './gen/interior/sheet.js';
import { generateRoom } from './gen/interior/index.js';

// Pixelify Sans has an "fi" ligature that reads like "A" at small sizes.
// A zero-width non-joiner after every f keeps the letters apart.
const ZWNJ = '‌';
const noLig = (s) => (typeof s === 'string' ? s.replace(/f(?=[a-z])/g, `f${ZWNJ}`) : s);
const setText = Phaser.GameObjects.Text.prototype.setText;
Phaser.GameObjects.Text.prototype.setText = function (value) {
  return setText.call(this, Array.isArray(value) ? value.map(noLig) : noLig(value));
};

// Render at the screen's real pixel size (capped at 2x) so text is sharp and
// the pixel art can use whole-number zoom levels. Each scene lays itself out.
let quality = 1; // lowered below if the machine cannot keep up
const dpr = () => Math.min(2, window.devicePixelRatio || 1) * quality;
const size = () => {
  const d = dpr();
  return [Math.max(320, Math.round(window.innerWidth * d)), Math.max(180, Math.round(window.innerHeight * d)), d];
};
const fitCanvas = () => {
  game.canvas.style.width = `${window.innerWidth}px`;
  game.canvas.style.height = `${window.innerHeight}px`;
};

// ?test: real-time steps and no multisampling, so slow software rendering in
// headless checks does not turn into slow motion.
const TEST = new URLSearchParams(location.search).has('test');
const [W, H, D] = size();
const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#0d0f1e',
  antialias: true,
  antialiasGL: !TEST,
  pixelArt: false,
  roundPixels: true,
  fps: { smoothStep: !TEST },
  scale: { mode: Phaser.Scale.NONE, zoom: 1 / D },
  scene: [Boot, Town, Interior, Museum, Workshop, UI],
});
game.events.once('ready', () => {
  fitCanvas();
  // Inside an embedded page the keyboard only reaches the game once it has focus.
  window.focus();
  game.canvas.addEventListener('pointerdown', () => window.focus());
});
// Browsers only start audio inside a real key press or click.
window.addEventListener('keydown', initAudio);
window.addEventListener('pointerdown', initAudio);
game.registry.set('lite', new URLSearchParams(location.search).has('lite'));

const relayout = () => {
  const [w, h, d] = size();
  if (Math.abs(game.scale.zoom - 1 / d) > 1e-6) game.scale.setZoom(1 / d);
  game.scale.resize(w, h);
  fitCanvas();
};
let pending = 0;
window.addEventListener('resize', () => {
  cancelAnimationFrame(pending);
  pending = requestAnimationFrame(relayout);
});

// Safety net for machines without a real GPU (common on hospital PCs): if the
// frame rate stays low, first drop the bloom and vignette, then render at half
// resolution.
if (!TEST) {
  const samples = [];
  let step = 0, wait = 6;
  setInterval(() => {
    if (document.hidden) return;
    samples.push(game.loop.actualFps);
    if (samples.length > 4) samples.shift();
    if (wait > 0) { wait -= 1; return; }
    if (samples.length < 4 || Math.max(...samples) >= 24) return; // 30 fps power-saving caps stay above this
    step += 1;
    samples.length = 0;
    wait = 4;
    if (step === 1) { game.registry.set('lite', true); game.events.emit('lite'); }
    else if (step === 2) { quality = 0.5; relayout(); }
  }, 1000);
}

window.__game = game;
import * as content from './data/content.js';
import { state } from './systems/state.js';
import * as voice from './systems/voice.js';
import { give } from './mechanics/life.js';
import { lifePlan } from './mechanics/active.js';
import { openJournal } from './mechanics/secrets/journal.js';
import { lifeSheet } from './mechanics/sheet.js';
import { giveKeyTo } from './mechanics/floors/keys.js';
import { RIDDLES } from './mechanics/riddles/data.js';
import { save as saveState } from './systems/state.js';
document.title = content.COURSE.title;
// A picture of every kind of building and every landmark: useful when working on the look.
// With generated houses on (GEN.facade), every kind in each theme with two seeds, then the emblems.
// gallery({ scale: 2 }) draws it bigger.
// experts' homes: every shape in every theme, with the trades' signs and name plates
function homeRows(wrap, add, s, sets = 1) {
  for (const th of Object.values(THEMES)) for (let k = 0; k < sets; k++) {
    const hr = document.createElement('div'); hr.style.cssText = 'display:flex;gap:10px;align-items:flex-end;width:100%;justify-content:center';
    const ht = document.createElement('div'); ht.style.cssText = 'width:70px;text-align:right'; ht.textContent = `${th.name} homes`; hr.append(ht);
    HOME_SHAPES.forEach((shape, i) => {
      const kk = KINDS.home, trade = TRADE_NAMES[(i * 5 + th.name.length + k * 3) % TRADE_NAMES.length];
      const b = { id: `h-${shape}-${k}`, kind: 'home', x: 0, y: 0, w: kk.w, h: kk.h, doors: kk.doors, paint: 'home', label: trade.toUpperCase().slice(0, 9), trade, expert: EXPERT_NAMES[i + k * 5], nature: shape === 'cabin' ? 'shore' : 'meadow', dj: i };
      add(paintFacade(b, { theme: th, seed: `home:${shape}:${k}`, district: (i + k) % 3, slot: i + k, shape }).canvas, '', s, hr);
    });
    wrap.append(hr);
  }
}
// A sheet of the experts' homes only, bigger: __hb.homeFronts({ scale: 3 })
function homeFronts({ scale = 3, sets = 1 } = {}) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:50;background:#3c7a3a;display:flex;flex-wrap:wrap;gap:14px;align-content:center;justify-content:center;padding:10px;font:13px system-ui;color:#fff;overflow:auto';
  const add = (cv, label, s, into) => { const d = document.createElement('div'); d.style.textAlign = 'center'; cv.style.cssText = `width:${cv.width * s}px;image-rendering:pixelated;display:block;margin:0 auto 4px`; d.append(cv, label); into.append(d); return d; };
  homeRows(wrap, add, scale, sets);
  document.body.append(wrap);
  return 1;
}
function gallery({ scale } = {}) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:50;background:#3c7a3a;display:flex;flex-wrap:wrap;gap:22px;align-items:flex-end;align-content:center;justify-content:center;padding:20px;font:14px system-ui;color:#fff;overflow:auto';
  const add = (cv, label, s = 2, into = wrap) => { const d = document.createElement('div'); d.style.textAlign = 'center'; cv.style.cssText = `width:${cv.width * s}px;image-rendering:pixelated;display:block;margin:0 auto 6px`; d.append(cv, label); into.append(d); return d; };
  if (GEN.facade) {
    const s = scale || 1, extra = { league: { paint: 'league', w: 8, h: 5, doors: [[3, 4], [4, 4]] }, home: { paint: 'cottage', w: 4, h: 4, doors: [[1, 3]] } };
    wrap.style.gap = '6px 10px'; wrap.style.font = '11px system-ui'; wrap.style.padding = '8px';
    let e = 0;
    for (const th of Object.values(THEMES)) ['a', 'b'].forEach((seed, k) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:10px;align-items:flex-end;width:100%;justify-content:center';
      const tag = document.createElement('div'); tag.style.cssText = 'width:70px;text-align:right'; tag.textContent = `${th.name} ${seed}`; row.append(tag);
      for (const [kind, kk] of Object.entries({ ...KINDS, ...extra })) {
        const b = { id: `gallery-${kind}`, kind, x: 0, y: 0, w: kk.w, h: kk.h, doors: kk.doors, paint: kk.paint, label: kind.toUpperCase().slice(0, 9), emblem: EMBLEMS[e++ % EMBLEMS.length] };
        add(paintFacade(b, { theme: th, seed: `gallery-${seed}:${kind}`, district: k ? 1 : 0, slot: k ? 1 : 0 }).canvas, '', s, row);
      }
      wrap.append(row);
    });
    // one district: the same kind in the four places of a district must be told apart at a glance
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:10px;align-items:flex-end;width:100%;justify-content:center';
    const tag = document.createElement('div'); tag.style.cssText = 'width:70px;text-align:right'; tag.textContent = `${THEME.name}: one district`; row.append(tag);
    for (const kind of ['lab', 'hall', 'archive']) for (let slot = 0; slot < 4; slot++) { const kk = KINDS[kind]; add(paintFacade({ id: `d-${kind}-${slot}`, kind, x: 0, y: 0, w: kk.w, h: kk.h, doors: kk.doors, paint: kk.paint, label: kind.toUpperCase() }, { seed: `district:${kind}:${slot}`, district: 2, slot }).canvas, '', s, row); }
    wrap.append(row);
    homeRows(wrap, add, s);
    const strip = document.createElement('div'); strip.style.cssText = 'display:flex;gap:8px;width:100%;justify-content:center;align-items:center';
    for (const name of EMBLEMS) { const [cv, ctx] = makeCanvas(11, 11); ctx.fillStyle = '#1b1a2b'; ctx.fillRect(0, 0, 11, 11); drawEmblem(ctx, name, 1, 1, 1, '#ffcf5a'); cv.title = name; add(cv, '', 2 * s, strip); }
    wrap.append(strip);
  } else for (const [kind, k] of Object.entries(KINDS)) add(paintKind(k.paint, { x: 0, y: 0, w: k.w, h: k.h, doors: k.doors, label: kind.toUpperCase().slice(0, 9) }), `kind: ${kind}`);
  for (const m of MONUMENT_KINDS) { const src = game.textures.get(`mon-${m}`).getSourceImage(), cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; cv.getContext('2d').drawImage(src, 0, 0); add(cv, GEN.facade ? '' : `landmark: ${m}`, GEN.facade ? scale || 1 : 2); }
  // the dressing pieces of the three themes, one row each
  if (GEN.dressing) for (const th of Object.values(THEMES)) { const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:10px;align-items:center;width:100%;justify-content:center'; const tag = document.createElement('div'); tag.style.cssText = 'width:70px;text-align:right'; tag.textContent = `${th.name} dressing`; row.append(tag); add(dressingSheet(th), '', 2 * (scale || 1), row); wrap.append(row); }
  document.body.append(wrap);
  return 1;
}

window.__hb = {
  gallery,
  homeFronts,
  // contact sheet of rooms: the course's rooms and a sample of other kinds (see gen/interior/sheet.js)
  homes: (o) => roomSheet(game, (p) => generateRoom(p, { theme: THEMES[p.theme] }), HOMES, o),
  rooms: (list, o) => roomSheet(game, (p) => generateRoom(p, p.theme ? { theme: THEMES[p.theme] } : {}), list || [...content.PLACES.filter((p) => !['workshop', 'museum'].includes(p.kind)), ...SAMPLE], o),
  openLab,
  openReading,
  content,
  state,
  voice,
  // ambient life: grant a tool to test the opening of obstacles (__hb.give('key')); the plan of the town
  give,
  life: () => lifePlan(),
  journal: () => openJournal(lifePlan()),
  // floors and locks: a key without winning the duel (__hb.giveKey('wheel'), 'all'; or ?keys=all),
  // the riddles of the course (answers included: for testing only)
  giveKey: (id) => { const r = giveKeyTo(state, id); saveState(); return r; },
  riddles: () => RIDDLES,
  lifeSheet,
  // Used by the automated play-through check.
  probe: () => {
    const ui = game.scene.getScene('UI');
    return { phase: ui?.phase || null, busy: !!ui?.busy, sel: ui?.quizState?.sel(), answer: ui?.quizState?.answer, insight: state.insight, stamps: { ...state.stamps } };
  },
};
