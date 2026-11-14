// The Luthier's House: a string's frequency rises when it is shorter or tighter; half the length is
// the octave.
//   pluck      one string, nut to bridge: a fretting finger to slide, a peg (tension), a place to
//              pluck; the vibrating part drawn in slow motion, the frequency computed and heard
//   harmonics  (upstairs) touch the string lightly: only the harmonics with a still point there
//              survive (at 1/2, 1/3, 1/4: frets 12, 7, 5)
import { stage, sliders, button, tasks, animate, C, alpha, clamp } from '../../../engine/src/lab/kit.js';
import { fretAt, fmtHz } from './lib/music.js';
import { sound, soundNote } from './lib/sound.js';

const LEN = 650;                  // mm, a common classical and steel-string scale length
const MU = 75 / (2 * 0.65 * 110) ** 2; // kg/m: this string sounds 110 Hz (A2) at 75 N
const freq = (T, k = 0) => (Math.sqrt(T / MU) / (2 * (LEN / 1000))) * 2 ** (k / 12); // f = v / 2L, L shortened by the fret
const MAXF = 19, SLOW = 100;      // frets drawn; slow motion factor of the drawing
const MARKS = [3, 5, 7, 9, 12, 15, 17, 19];

// where the string lies on the picture: the nut at u = 0, the bridge at u = 1
function layout(pane) {
  if (pane.upright) return { a: [150, 70], b: [150, 590], n: [1, 0], read: [300, 90], up: true };
  return { a: [70, 190], b: [750, 190], n: [0, 1], read: [70, 52], up: false };
}
const P = (Lay, u, off = 0) => [Lay.a[0] + (Lay.b[0] - Lay.a[0]) * u + Lay.n[0] * off, Lay.a[1] + (Lay.b[1] - Lay.a[1]) * u + Lay.n[1] * off];
const uOf = (Lay, x, y) => { const dx = Lay.b[0] - Lay.a[0], dy = Lay.b[1] - Lay.a[1]; return ((x - Lay.a[0]) * dx + (y - Lay.a[1]) * dy) / (dx * dx + dy * dy); };
const fretOfU = (u) => { let best = 0; for (let k = 1; k <= MAXF; k++) if (u > fretAt(k - 1)) best = k; return u < 0.012 ? 0 : best; };

// the string itself, shared by both stations: board, frets, markers, the vibrating part
function drawString(d, Lay, { k, wave, label = true, touch = null }) {
  const [ax, ay] = Lay.a, [bx, by] = Lay.b, end = fretAt(MAXF + 0.6), w = 34;
  const [ex, ey] = P(Lay, end);
  // fretboard (wood), body beyond it, bridge
  if (Lay.up) { d.box(ax - w, ay, w * 2, ey - ay, { fill: '#2a1f17', r: 4 }); d.box(ax - w - 14, ey, (w + 14) * 2, by - ey + 26, { fill: '#3b2b1d', r: 18 }); }
  else { d.box(ax, ay - w, ex - ax, w * 2, { fill: '#2a1f17', r: 4 }); d.box(ex, ay - w - 14, bx - ex + 26, (w + 14) * 2, { fill: '#3b2b1d', r: 18 }); }
  const [hx, hy] = P(Lay, end + (1 - end) * 0.42);
  d.circle(hx, hy, 30, { fill: '#120d09' });                                  // the sound hole
  for (const m of MARKS) { const u = (fretAt(m - 1) + fretAt(m)) / 2, [mx, my] = P(Lay, u); if (m === 12) { d.circle(...P(Lay, u, -w * 0.5), 5, { fill: '#d9cbb0', alpha: 0.6 }); d.circle(...P(Lay, u, w * 0.5), 5, { fill: '#d9cbb0', alpha: 0.6 }); } else d.circle(mx, my, 5, { fill: '#d9cbb0', alpha: 0.6 }); }
  for (let f = 1; f <= MAXF; f++) d.line([P(Lay, fretAt(f), -w), P(Lay, fretAt(f), w)], { color: '#a9a39a', width: 2, cap: 'butt' });
  d.line([P(Lay, 0, -w - 4), P(Lay, 0, w + 4)], { color: '#eadfca', width: 7, cap: 'butt' });       // nut
  d.line([P(Lay, 1, -w), P(Lay, 1, w)], { color: '#eadfca', width: 7, cap: 'butt' });               // saddle
  if (label) {
    for (const m of [5, 7, 12]) { const u = (fretAt(m - 1) + fretAt(m)) / 2; d.text(String(m), ...P(Lay, u, Lay.up ? -w - 18 : w + 22).map((v, i) => v + (i === 1 && Lay.up ? 6 : 0)), { size: 16, color: C.dim, align: 'center' }); }
    d.text('nut', ...P(Lay, 0, Lay.up ? -w - 26 : -w - 12).map((v, i) => v + (Lay.up && i === 1 ? 5 : 0)), { size: 16, color: C.dim, align: Lay.up ? 'right' : 'center' });
    d.text('bridge', ...P(Lay, 1, Lay.up ? -w - 28 : -w - 24).map((v, i) => v + (Lay.up && i === 1 ? 5 : 0)), { size: 16, color: C.dim, align: Lay.up ? 'right' : 'center' });
  }
  // the dead part (nut to finger) is still; the vibrating part follows wave(u) in slow motion
  const u0 = fretAt(k);
  if (k > 0) d.line([P(Lay, 0), P(Lay, u0)], { color: '#8d877b', width: 3 });
  const pts = [];
  for (let i = 0; i <= 90; i++) { const u = u0 + ((1 - u0) * i) / 90; pts.push(P(Lay, u, wave((u - u0) / (1 - u0)))); }
  d.line(pts, { color: '#f0e6d0', width: 3, glow: alpha(C.gold, 0.5) });
  if (touch != null) { const [tx, ty] = P(Lay, touch); d.circle(tx, ty, 11, { stroke: C.gold, width: 3 }); d.circle(tx, ty, 4, { fill: C.gold }); }
  return { u0 };
}

async function pluck(ctx) {
  const t = tasks(ctx, [{ select: 'octave' }, { select: 'tuned' }]);
  const s = sound(ctx);
  let k = 0, amp = 0, phase = 0, plucked = false, log = [], openSeen = false;
  const ctl = sliders(ctx, [{ id: 'T', label: 'Tension (the peg)', min: 50, max: 110, step: 0.1, value: 66, unit: 'N' }], (id, v) => { redrawAll(); if (Math.abs(freq(v) - 110) < 0.5) t.pick('tuned').check(); });
  const f = () => freq(ctl.v.T, k);
  const doPluck = () => {
    amp = 1; phase = 0; plucked = true;
    s.pluck(f(), { dur: 2.2, gain: 0.55 });
    if (k === 0) openSeen = true;
    log.unshift({ k, f: f(), open: freq(ctl.v.T) }); log = log.slice(0, 3);
    if (k === 12 && openSeen) t.pick('octave');
    t.check(); anim.kick();
  };
  const view = stage(ctx, { wide: [820, 480], tall: [480, 640] }, (d, pane) => {
    const Lay = layout(pane); d.clear();
    const fv = f() / SLOW, env = amp;
    const wave = (u) => env * 22 * (Math.sin(Math.PI * u) * Math.cos(phase) + 0.35 * Math.sin(2 * Math.PI * u) * Math.cos(2 * phase + 1) + 0.18 * Math.sin(3 * Math.PI * u) * Math.cos(3 * phase + 2));
    const { u0 } = drawString(d, Lay, { k, wave });
    // the finger, on the string just behind its fret
    const uf = k ? (fretAt(k - 1) * 0.35 + fretAt(k) * 0.65) : 0.0;
    if (k) { const [fx, fy] = P(Lay, uf); d.circle(fx, fy, 19, { fill: alpha(C.acc, 0.85), glow: C.acc }); d.text(String(k), fx, fy + 6, { size: 17, weight: 700, color: C.accInk, align: 'center' }); }
    else { const [fx, fy] = P(Lay, 0.03, Lay.up ? 58 : 58); d.circle(fx, fy, 19, { fill: alpha(C.acc, 0.5), stroke: C.acc }); d.text('finger', fx, fy + (Lay.up ? 38 : 40), { size: 16, color: C.muted, align: 'center' }); }
    // where to pluck
    const [px, py] = P(Lay, fretAt(MAXF + 0.6) + (1 - fretAt(MAXF + 0.6)) * 0.42, Lay.up ? 74 : 0);
    if (!Lay.up) d.text('pluck here', px, py + 70, { size: 16, color: C.gold, align: 'center' }); else d.text('pluck', px + 6, py + 6, { size: 16, color: C.gold });
    // read-outs: the frequency now, the open string, the length
    const [rx, ry] = Lay.read, lenmm = LEN * (1 - u0);
    const big = Lay.up ? 34 : 40;
    d.text(`${fmtHz(f())} Hz`, rx, ry, { size: big, weight: 700, color: plucked ? C.gold : C.text });
    d.text(Lay.up ? `${Math.round(lenmm)} mm${k ? `, fret ${k}` : ', open'}` : `vibrating length ${Math.round(lenmm)} mm${k ? `, fret ${k}` : ', open'}`, rx, ry + 30, { size: 17, color: C.muted, max: Lay.up ? 170 : 400 });
    if (!Lay.up) d.text(`open string: ${fmtHz(freq(ctl.v.T))} Hz   ·   tension ${ctl.v.T.toFixed(1)} N`, 450, ry, { size: 17, color: C.muted, max: 350 });
    else d.text(`open: ${fmtHz(freq(ctl.v.T))} Hz`, rx, ry + 58, { size: 17, color: C.muted });
    // the last plucks, so the two can be compared
    const lx = Lay.up ? 230 : 70, ly = Lay.up ? 220 : 330;
    if (log.length) d.text('plucked', lx, ly, { size: 16, color: C.dim });
    log.forEach((e, i) => {
      const ratio = e.f / e.open, y = ly + 30 + i * (Lay.up ? 58 : 34);
      const a = i ? 0.6 : 1, label = `${e.k ? `fret ${e.k}` : 'open'}: ${fmtHz(e.f)} Hz`;
      if (Lay.up) { d.text(label, lx, y, { size: 18, weight: 600, color: C.text, alpha: a }); d.text(`× ${ratio.toFixed(2)} the open string`, lx, y + 24, { size: 16, color: ratio > 1.995 && ratio < 2.005 ? C.gold : C.muted, alpha: a }); }
      else d.text(`${label}   (${Math.round(LEN * 2 ** (-e.k / 12))} mm, × ${ratio.toFixed(2)} the open string)`, lx, y, { size: 18, weight: i ? 400 : 600, color: ratio > 1.995 && ratio < 2.005 ? C.gold : C.text, alpha: a, max: 680 });
    });
    void fv;
  });
  const redrawAll = () => view.redraw();
  const anim = animate(ctx, (dt) => {
    if (dt === Infinity) { amp = 0; view.redraw(); return false; }
    phase += 2 * Math.PI * (f() / SLOW) * dt; amp *= Math.exp(-dt / 1.6);
    view.redraw(); return amp > 0.01;
  });
  view.pane.drag((x, y, ph) => {
    const Lay = layout(view.pane), u = uOf(Lay, x, y), body = fretAt(MAXF + 0.6);
    if (ph === 'down' && u > body) { doPluck(); return; }
    if (u <= body + 0.01 && ph !== 'up') { const nk = fretOfU(clamp(u, 0, body)); if (nk !== k) { k = nk; amp = 0; view.redraw(); } }
  });
  button(ctx, 'Pluck the string', doPluck, { primary: true });
  ctx.hint((i) => { const Lay = layout(view.pane); return i === 0 ? (openSeen ? P(Lay, (fretAt(11) + fretAt(12)) / 2) : P(Lay, 0.82)) : ctl.el.T; });
  view.pane.items = [{ c: 'pluck', ...xy(P(layout(view.pane), 0.82)) }];
  const items = () => { const Lay = layout(view.pane); return [{ c: 'pluck', ...xy(P(Lay, 0.84)) }, ...Array.from({ length: 13 }, (_, j) => ({ c: `fret${j}`, ...xy(P(Lay, j ? (fretAt(j - 1) + fretAt(j)) / 2 : 0.004)) }))]; };
  Object.defineProperty(view.pane, 'items', { get: items, configurable: true });
  soundNote(ctx);
  ctx.stage.__ready = { t, el: ctl.el, pane: view.pane, custom: (verb, a) => {
    if (a === 'octave') { k = 0; doPluck(); k = 12; view.redraw(); doPluck(); }
    if (a === 'tuned') { ctl.set('T', 75); redrawAll(); t.pick('tuned').check(); }
  } };
}
const xy = ([x, y]) => ({ x, y });

async function harmonics(ctx) {
  const t = tasks(ctx, [{ select: 'h2' }, { select: 'h3' }, { select: 'h4' }]);
  const s = sound(ctx), F0 = 110;
  let touch = null, n = 1, amp = 0, phase = 0, last = null;
  // the lowest harmonic with a still point (node) at the touch: k/n of the length, within 8 mm
  const survivor = (u) => { if (u == null) return 1; for (let m = 2; m <= 8; m++) for (let j = 1; j < m; j++) if (Math.abs(u - j / m) < 8 / LEN) return m; return 0; };
  const doPluck = () => {
    n = survivor(touch); amp = 1; phase = 0;
    if (n) s.pluck(F0 * n, { dur: 2.4, gain: 0.5, only: 1, pos: 0.2 });
    last = { n, at: touch };
    if (n === 2) t.pick('h2'); if (n === 3) t.pick('h3'); if (n === 4) t.pick('h4');
    t.check(); anim.kick();
  };
  const view = stage(ctx, { wide: [820, 480], tall: [480, 640] }, (d, pane) => {
    const Lay = layout(pane); d.clear();
    const wave = (u) => (n ? amp * 22 * Math.sin(n * Math.PI * u) * Math.cos(phase) : 0);
    drawString(d, Lay, { k: 0, wave, touch });
    const [rx, ry] = Lay.read;
    const fret = touch == null ? null : (() => { let b = 0, e = 9; for (let j = 1; j <= MAXF; j++) { const dd = Math.abs(fretAt(j) - touch); if (dd < e) { e = dd; b = j; } } return b; })();
    if (last && last.n) { d.text(`${F0 * last.n} Hz`, rx, ry, { size: Lay.up ? 34 : 40, weight: 700, color: C.gold }); d.text(Lay.up ? `${last.n} × ${F0} Hz` : `harmonic ${last.n}: ${last.n} × the open ${F0} Hz`, rx, ry + 30, { size: 17, color: C.muted, max: Lay.up ? 170 : 420 }); }
    else if (last) { d.text('almost silent', rx, ry, { size: Lay.up ? 30 : 36, weight: 700, color: C.bad }); d.text('no harmonic has a still point here', rx, ry + 30, { size: 17, color: C.muted, max: Lay.up ? 170 : 420 }); }
    else { d.text(`open string ${F0} Hz`, rx, ry, { size: Lay.up ? 28 : 34, weight: 700 }); }
    if (touch != null) { if (Lay.up) { d.text(`touching at ${(touch * 100).toFixed(1)}%`, 230, 214, { size: 17, color: C.text }); d.text(`above fret ${fret}`, 230, 240, { size: 17, color: C.text }); } else d.text(`touching at ${(touch * 100).toFixed(1)}% of the string, above fret ${fret}`, 70, 330, { size: 17, color: C.text, max: 660 }); }
    // the first four ways the string can vibrate; those with a still point at the touch are lit
    const bx = Lay.up ? 230 : 70, by = Lay.up ? 300 : 370, bw = Lay.up ? 230 : 160, gap = Lay.up ? 72 : 0;
    for (let m = 1; m <= 4; m++) {
      const x0 = Lay.up ? bx : bx + (m - 1) * (bw + 18), y0 = Lay.up ? by + (m - 1) * gap : by;
      const ok = touch == null ? true : Array.from({ length: m - 1 }, (_, j) => Math.abs(touch - (j + 1) / m) < 8 / LEN).some(Boolean);
      const kept = touch == null || ok, col = kept ? (last && last.n === m ? C.gold : C.acc) : C.dim;
      const pts = []; for (let i = 0; i <= 40; i++) pts.push([x0 + (bw * i) / 40, y0 + 22 + Math.sin(m * Math.PI * i / 40) * 14]);
      const pts2 = pts.map(([x, y]) => [x, 2 * (y0 + 22) - y]);
      d.line(pts, { color: col, width: 2.5, alpha: kept ? 1 : 0.35 }); d.line(pts2, { color: col, width: 2.5, alpha: kept ? 0.6 : 0.2 });
      d.text(`${m === 1 ? 'whole' : `in ${m}`}: ${m * F0} Hz`, x0, y0 + 60, { size: 16, color: kept ? C.text : C.dim });
      if (touch != null && m > 1) d.line([[x0 + bw * touch, y0 + 4], [x0 + bw * touch, y0 + 40]], { color: C.gold, width: 2, dash: [3, 3] });
    }
  });
  const anim = animate(ctx, (dt) => { if (dt === Infinity) { amp = 0; view.redraw(); return false; } phase += 2 * Math.PI * ((F0 * Math.max(1, n)) / SLOW / 2) * dt; amp *= Math.exp(-dt / 1.8); view.redraw(); return amp > 0.01; });
  view.pane.drag((x, y, ph) => {
    const Lay = layout(view.pane), u = uOf(Lay, x, y), body = fretAt(MAXF + 0.6);
    if (ph === 'down' && u > body) { doPluck(); return; }
    if (ph !== 'up' && u > 0.01 && u <= body) { touch = u; amp = 0; view.redraw(); }
  });
  button(ctx, 'Pluck the string', doPluck, { primary: true });
  button(ctx, 'Take the finger off', () => { touch = null; view.redraw(); });
  const above = (m) => fretAt(m);
  ctx.hint((i) => P(layout(view.pane), above([12, 7, 5][i] ?? 12)));
  soundNote(ctx);
  Object.defineProperty(view.pane, 'items', { get: () => { const Lay = layout(view.pane); return [{ c: 'pluck', ...xy(P(Lay, 0.84)) }, ...[12, 7, 5].map((m) => ({ c: `touch${m}`, ...xy(P(Lay, fretAt(m))) }))]; }, configurable: true });
  ctx.stage.__ready = { t, pane: view.pane, custom: (verb, a) => { const m = { h2: 12, h3: 7, h4: 5 }[a]; if (m) { touch = fretAt(m); doPluck(); } } };
}

export default { pluck, harmonics };
