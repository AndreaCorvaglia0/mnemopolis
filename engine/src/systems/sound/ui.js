// The sounds of the hands: a small designed set for interactions (docs/GAME.md, "Sound answers the
// hands"). Pure: each name is a list of events rendered by synth.js `render`, so it is measured in
// Node (tests/soundui.test.mjs). Pitched sounds are in the course's key: notes are scale steps
// above the piece's root (theory.js), so a tick, a page and a right answer belong to the music.
// Quiet and round: sines and soft noise, attacks of a few milliseconds, no buzzer; a wrong answer
// is a low, falling, gentle pair.
//
//   UI_NAMES                         every name
//   uiEvents(name, { root, scale, v })   the events (root: MIDI of the key's note around middle C)
//   renderUi(name, key, sr)          the samples
//
// The live side (index.js) caches the buffers and plays them on the sfx bus: `ui.sound(name)` or
// `sfx.ui(name, { v })`.
import { step } from './theory.js';
import { render } from './synth.js';

const hz = (m) => 440 * 2 ** ((m - 69) / 12);
// scale step i above the root, as Hz
const deg = (key, i, oct = 0) => hz(key.root + 12 * oct + step(i, key.scale || [0, 2, 4, 7, 9]));

const D = {
  // the notebook and overlays: a soft paper swish and a low wooden knock (close: the reverse)
  open: (k) => [{ kind: 'noise', t: 0, dur: 0.12, a: 0.05, q: 0.18 }, { f: deg(k, 0, -1), t: 0.015, dur: 0.16, a: 0.05, ring: 0.3 }, { f: deg(k, 4, -1), t: 0.06, dur: 0.16, a: 0.03, ring: 0.3 }],
  close: (k) => [{ f: deg(k, 4, -1), t: 0, dur: 0.14, a: 0.03, ring: 0.3 }, { f: deg(k, 0, -1), t: 0.05, dur: 0.18, a: 0.045, ring: 0.3 }, { kind: 'noise', t: 0.02, dur: 0.1, a: 0.035, q: 0.15 }],
  page: () => [{ kind: 'noise', t: 0, dur: 0.09, a: 0.045, q: 0.35 }, { kind: 'noise', t: 0.06, dur: 0.12, a: 0.035, q: 0.2 }],
  tab: (k) => [{ kind: 'tick', t: 0, dur: 0.03, a: 0.04, q: 0.5 }, { f: deg(k, 2), t: 0.004, dur: 0.07, a: 0.03, ring: 0.25 }],
  button: (k) => [{ f: deg(k, 0, 1), t: 0, dur: 0.06, a: 0.035, ring: 0.25 }, { kind: 'tick', t: 0, dur: 0.02, a: 0.02, q: 0.4 }],
  toggleOn: (k) => [{ f: deg(k, 0), t: 0, dur: 0.06, a: 0.03, ring: 0.3 }, { f: deg(k, 2), t: 0.05, dur: 0.08, a: 0.03, ring: 0.3 }],
  toggleOff: (k) => [{ f: deg(k, 2), t: 0, dur: 0.06, a: 0.03, ring: 0.3 }, { f: deg(k, 0), t: 0.05, dur: 0.08, a: 0.03, ring: 0.3 }],
  door: (k) => [{ kind: 'thump', f: deg(k, 0, -2), t: 0, dur: 0.18, a: 0.07 }, { kind: 'noise', t: 0, dur: 0.16, a: 0.03, q: 0.08 }, { f: deg(k, 3, -1), t: 0.09, dur: 0.2, a: 0.02, ring: 0.4 }],
  find: (k) => [{ f: deg(k, 2, 1), t: 0, dur: 0.22, a: 0.035, ring: 0.5 }, { f: deg(k, 4, 1), t: 0.08, dur: 0.3, a: 0.035, ring: 0.5 }],
  tick: (k) => [{ f: deg(k, 4, 1), t: 0, dur: 0.09, a: 0.035, ring: 0.3 }, { f: deg(k, 0, 2), t: 0.06, dur: 0.14, a: 0.03, ring: 0.4 }], // a task done in a lab
  // a slider's detent: a soft tick whose pitch rises with the value v in 0..1
  detent: (k, v = 0.5) => [{ kind: 'tick', t: 0, dur: 0.012, a: 0.018, q: 0.6 }, { f: deg(k, Math.round(v * 7)), t: 0, dur: 0.035, a: 0.018, ring: 0.2 }],
  dragStart: (k) => [{ f: deg(k, 0), t: 0, dur: 0.05, a: 0.022, ring: 0.3 }, { kind: 'noise', t: 0, dur: 0.04, a: 0.018, q: 0.3 }],
  drop: (k) => [{ kind: 'thump', f: deg(k, 0, -1), t: 0, dur: 0.09, a: 0.04 }],
  snap: (k) => [{ kind: 'tick', t: 0, dur: 0.015, a: 0.03, q: 0.55 }, { f: deg(k, 4), t: 0.005, dur: 0.08, a: 0.03, ring: 0.3 }],
  right: (k) => [{ f: deg(k, 0, 1), t: 0, dur: 0.16, a: 0.04, ring: 0.45 }, { f: deg(k, 2, 1), t: 0.08, dur: 0.18, a: 0.04, ring: 0.45 }, { f: deg(k, 4, 1), t: 0.16, dur: 0.32, a: 0.04, ring: 0.5 }],
  // wrong: gentle, low, two notes falling a step; never a buzzer
  wrong: (k) => [{ f: deg(k, 1, -1), t: 0, dur: 0.2, a: 0.035, ring: 0.45 }, { f: deg(k, 0, -1), t: 0.13, dur: 0.3, a: 0.035, ring: 0.5 }],
  streak: (k) => [{ f: deg(k, 0, 1), t: 0, dur: 0.1, a: 0.03, ring: 0.4 }, { f: deg(k, 4, 1), t: 0.06, dur: 0.12, a: 0.03, ring: 0.4 }, { f: deg(k, 0, 2), t: 0.12, dur: 0.24, a: 0.03, ring: 0.5 }],
  count: (k) => [{ f: deg(k, 0), t: 0, dur: 0.12, a: 0.035, ring: 0.4 }], // 3, 2, 1
  go: (k) => [{ f: deg(k, 0, 1), t: 0, dur: 0.22, a: 0.04, ring: 0.5 }, { f: deg(k, 4), t: 0, dur: 0.22, a: 0.025, ring: 0.5 }],
  result: (k) => [0, 2, 4, 7].map((i, j) => ({ f: deg(k, i), t: j * 0.11, dur: 0.4, a: 0.032, ring: 0.6 })),
  // a tier changed: the motif's first two notes, soft, and a breath of air
  tier: (k) => [{ kind: 'noise', t: 0, dur: 0.6, a: 0.015, q: 0.06 }, { f: deg(k, 0), t: 0.05, dur: 0.9, a: 0.035, ring: 0.7 }, { f: hz(k.root + 7), t: 0.4, dur: 1.1, a: 0.032, ring: 0.7 }],
  // a withheld line: a held breath, one low note
  withheld: (k) => [{ kind: 'noise', t: 0, dur: 0.35, a: 0.012, q: 0.05 }, { f: deg(k, 0, -1), t: 0.1, dur: 1.2, a: 0.04, ring: 0.8, attack: 0.15 }],
  // told at last: the low note, then the fifth above it
  told: (k) => [{ f: deg(k, 0, -1), t: 0, dur: 0.8, a: 0.035, ring: 0.7, attack: 0.08 }, { f: hz(k.root - 12 + 7), t: 0.35, dur: 1, a: 0.03, ring: 0.7 }],
  timeUp: (k) => [{ f: deg(k, 0, -1), t: 0, dur: 0.12, a: 0.03, ring: 0.3 }, { f: deg(k, 0, -1), t: 0.16, dur: 0.18, a: 0.025, ring: 0.3 }],
};
export const UI_NAMES = Object.keys(D);
export const DEFAULT_KEY = { root: 62, scale: [0, 2, 4, 7, 9] };
export function uiEvents(name, key = DEFAULT_KEY, v) { const f = D[name]; return f ? f(key, v) : []; }
export function renderUi(name, key = DEFAULT_KEY, sr = 48000, v) { return render(uiEvents(name, key, v), sr, name.length * 7 + 1); }
