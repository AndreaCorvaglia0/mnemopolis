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
document.title = content.COURSE.title;
// A picture of every kind of building and every landmark: useful when working on the look.
function gallery() {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:50;background:#3c7a3a;display:flex;flex-wrap:wrap;gap:22px;align-items:flex-end;align-content:center;justify-content:center;padding:20px;font:14px system-ui;color:#fff';
  const add = (cv, label) => { const d = document.createElement('div'); d.style.textAlign = 'center'; cv.style.cssText = `width:${cv.width * 2}px;image-rendering:pixelated;display:block;margin:0 auto 6px`; d.append(cv, label); wrap.append(d); };
  for (const [kind, k] of Object.entries(KINDS)) add(paintKind(k.paint, { x: 0, y: 0, w: k.w, h: k.h, doors: k.doors, label: kind.toUpperCase().slice(0, 9) }), `kind: ${kind}`);
  for (const m of MONUMENT_KINDS) { const src = game.textures.get(`mon-${m}`).getSourceImage(), cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; cv.getContext('2d').drawImage(src, 0, 0); add(cv, `landmark: ${m}`); }
  document.body.append(wrap);
  return 1;
}

window.__hb = {
  gallery,
  openLab,
  openReading,
  content,
  state,
  // Used by the automated play-through check.
  probe: () => {
    const ui = game.scene.getScene('UI');
    return { phase: ui?.phase || null, busy: !!ui?.busy, sel: ui?.quizState?.sel(), answer: ui?.quizState?.answer, insight: state.insight, stamps: { ...state.stamps } };
  },
};
