// Port Octave: what every station shares. Notes and frequencies, the guitar's tuning, and two
// drawings used across the houses: the neck (frets placed by the twelfth root of two) and the dial
// of the twelve notes. Pure drawing on the kit's ink (d) and plain numbers; no state of its own.
import { C, alpha } from '../../../../engine/src/lab/kit.js';

// ---- notes: a note is a MIDI number (A4 = 69 = 440 Hz, equal temperament; UNSW Music Acoustics)
export const SHARPS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const FLATS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
export const hz = (m) => 440 * 2 ** ((m - 69) / 12);
export const pc = (m) => ((m % 12) + 12) % 12;                       // pitch class 0 (C) .. 11 (B)
export const nameOf = (m, flats = false) => (flats ? FLATS : SHARPS)[pc(m)];
export const fullName = (m, flats = false) => `${nameOf(m, flats)}${Math.floor(m / 12) - 1}`;
export const isLetter = (m) => !SHARPS[pc(m)].includes('♯');
export const fmtHz = (f) => (f >= 100 ? f.toFixed(1) : f.toFixed(2));
// standard tuning, low to high: E2 A2 D3 G3 B3 E4 (82.41 ... 329.63 Hz)
export const TUNING = [40, 45, 50, 55, 59, 64];
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'E'];
export const SEMITONE = 2 ** (1 / 12);
// the major-scale pattern in half steps from the root, and the steps themselves
export const MAJOR = [0, 2, 4, 5, 7, 9, 11];
export const STEPS = ['W', 'W', 'H', 'W', 'W', 'W', 'H'];
// a major key's notes as names, spelled with sharps for sharp keys and flats for F, B♭...
const FLAT_KEYS = new Set([5, 10, 3, 8, 1]); // F, B♭, E♭, A♭, D♭
export const keyNames = (root) => MAJOR.map((s) => nameOf(root + s, FLAT_KEYS.has(pc(root))));

// ---- the neck: fret k sits at (1 - 2^(-k/12)) of the scale length from the nut (Mottola, UNSW)
export const fretAt = (k) => 1 - 2 ** (-k / 12);
// geometry of a horizontal neck: nut at the left, high E at the top (as in tablature), low E at the
// bottom. strings: indices into TUNING, listed top to bottom on the picture.
//   box: { x, y, w, h }, frets: the last fret shown, open: room left of the nut for open strings
export function neckGeom({ x, y, w, h }, { strings = [5, 4, 3, 2, 1, 0], frets = 12, open = 40, even = false } = {}) {
  const x0 = x + open, len = w - open, top = y, gap = strings.length > 1 ? h / (strings.length - 1) : 0;
  const L = len / fretAt(frets);
  const fx = (k) => (k <= 0 ? x0 : x0 + (even ? (k / frets) * len : L * fretAt(k)));
  const mid = (k) => (k <= 0 ? x0 - open / 2 : (fx(k - 1) + fx(k)) / 2);   // where a finger sits for fret k
  const sy = (i) => (strings.length > 1 ? top + i * gap : top + h / 2);
  const G = {
    x0, x1: x0 + len, top, open, bottom: top + (strings.length > 1 ? h : 0), strings, frets, fx, mid, sy, gap,
    pos: (s, k) => [mid(k), sy(strings.indexOf(s))],
    // the string and fret under a point, or null
    at(px, py, slack = 0.6) {
      let best = null;
      strings.forEach((s, i) => { const dy = Math.abs(py - sy(i)); if (dy <= Math.max(18, gap * slack) && (!best || dy < best.dy)) best = { s, dy }; });
      if (!best || px < x0 - open - 6 || px > x0 + len + 6) return null;
      let k = 0; for (let j = 1; j <= frets; j++) if (px > fx(j - 1)) k = j;
      if (px < x0) k = 0;
      return { s: best.s, k, m: TUNING[best.s] + k };
    },
  };
  return G;
}
// draws the neck: wood, frets, markers at 3 5 7 9 12 15 17 19, strings by thickness, fret numbers
export function drawNeck(d, G, { numbers = true, labels = true, markers = true, dim = 0 } = {}) {
  const pad = Math.max(16, G.gap * 0.55), y0 = G.top - pad, y1 = G.bottom + pad;
  d.box(G.x0, y0, G.x1 - G.x0, y1 - y0, { fill: '#2a1f17', r: 6 });
  if (markers) for (const k of [3, 5, 7, 9, 12, 15, 17, 19]) if (k <= G.frets) {
    const cx = G.mid(k), cy = (y0 + y1) / 2, r = Math.min(7, (G.fx(k) - G.fx(k - 1)) * 0.18);
    if (k === 12) { d.circle(cx, cy - (y1 - y0) * 0.22, r, { fill: '#d9cbb0', alpha: 0.55 }); d.circle(cx, cy + (y1 - y0) * 0.22, r, { fill: '#d9cbb0', alpha: 0.55 }); }
    else d.circle(cx, cy, r, { fill: '#d9cbb0', alpha: 0.55 });
  }
  d.line([[G.x0, y0], [G.x0, y1]], { color: '#eadfca', width: 6, cap: 'butt' });          // the nut
  for (let k = 1; k <= G.frets; k++) d.line([[G.fx(k), y0], [G.fx(k), y1]], { color: '#a9a39a', width: 2.5, cap: 'butt' });
  G.strings.forEach((s, i) => d.line([[G.x0 - 30, G.sy(i)], [G.x1 + 4, G.sy(i)]], { color: alpha('#d8d2c4', 1 - dim), width: 1.2 + (5 - s) * 0.45 }));
  if (labels && G.strings.length) G.strings.forEach((s, i) => d.text(STRING_NAMES[s], G.x0 - G.open - 4, G.sy(i) + 6, { size: 16, color: C.dim, align: 'right' }));
  if (numbers) for (let k = 1; k <= G.frets; k++) {
    const w = G.fx(k) - G.fx(k - 1);
    if (w > 26 || [3, 5, 7, 9, 12, 15].includes(k)) d.text(String(k), G.mid(k), y1 + 22, { size: 16, color: C.dim, align: 'center' });
  }
  return { y0, y1 };
}
// a note on the neck: a disc with its name
export function dot(d, G, s, k, { fill = C.acc, text = '', color = '#04201d', r = 15, ring = null, alpha: a = 1 } = {}) {
  const [x, y] = G.pos(s, k), rr = Math.min(r, G.gap ? G.gap * 0.46 : r);
  if (ring) d.circle(x, y, rr + 5, { stroke: ring, width: 3, alpha: a });
  if (fill) d.circle(x, y, rr, { fill, alpha: a });
  if (text) d.text(text, x, y + rr * 0.38, { size: Math.max(14, rr * 0.95), weight: 700, color, align: 'center', alpha: a });
  return [x, y];
}

// ---- the dial of the twelve notes: C at the top, clockwise, like the hours of a clock.
// order: 1 for half steps, 7 for the circle of fifths. Returns geometry: position of a pitch class.
export function dialGeom(cx, cy, r, { order = 1, start = 0 } = {}) {
  const idx = (p) => (order === 1 ? pc(p - start) : pc((pc(p - start) * 7)));   // position 0..11 of pitch class p
  const ang = (i) => -Math.PI / 2 + (i / 12) * Math.PI * 2;
  return { cx, cy, r, order, idx, ang, at: (p, rr = r) => { const a = ang(idx(p)); return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; },
    // the pitch class nearest to a point (null near the centre)
    pick(x, y) { if (Math.hypot(x - cx, y - cy) < r * 0.35) return null; let a = Math.atan2(y - cy, x - cx) + Math.PI / 2; if (a < 0) a += Math.PI * 2; const i = Math.round((a / (Math.PI * 2)) * 12) % 12; for (let p = 0; p < 12; p++) if (idx(p) === i) return p; return null; } };
}
export function drawDial(d, D, { lit = new Set(), gold = new Set(), flats = false, names = null, small = false } = {}) {
  d.circle(D.cx, D.cy, D.r * 1.18, { fill: C.card, stroke: C.line2, width: 2 });
  const fs = small ? 16 : Math.max(16, D.r * 0.15);
  for (let p = 0; p < 12; p++) {
    const [x, y] = D.at(p), letter = !SHARPS[p].includes('♯'), on = lit.has(p), g = gold.has(p);
    const rr = Math.max(fs * 0.95, D.r * (letter ? 0.15 : 0.12));
    d.circle(x, y, rr, { fill: g ? C.gold : on ? C.acc : letter ? C.card2 : '#151b27', stroke: on || g ? null : C.line2, width: 1.5 });
    const label = names ? names[p] : (flats ? FLATS : SHARPS)[p];
    d.text(label, x, y + fs * 0.36, { size: letter ? fs : fs * 0.86, weight: on || g ? 700 : letter ? 600 : 400, color: on || g ? '#04201d' : letter ? C.text : C.muted, align: 'center' });
  }
}
