// The Tuner's House: two close notes beat at their difference; the beating stops where the
// frequencies, or the strings' harmonics, coincide.
//   wobble   string A at 110 Hz, string B on a slider: the sum drawn over two seconds (its
//            loudness breathes at the beat rate), two rulers of harmonics with the close pairs joined
//   third    (upstairs) A3 and C♯: the pure 5:4 against the guitar's equal-tempered third
//   tuneup   (upstairs) tune the A string to the 5th fret of the low E by removing the beats
import { stage, sliders, button, tasks, animate, h, C, alpha } from '../../../engine/src/lab/kit.js';
import { fmtHz } from './lib/music.js';
import { sound, soundNote, onPhase } from './lib/sound.js';

const N = 6; // harmonics per string, in the sound and in the drawing

// the close pairs of harmonics of two notes: [{ i, j, fa, fb, diff }] with |diff| < lim Hz
function pairs(fa, fb, maxHz, lim = 14) {
  const out = [];
  for (let i = 1; i <= N; i++) for (let j = 1; j <= N; j++) { const a = fa * i, b = fb * j; if (a <= maxHz && b <= maxHz && Math.abs(a - b) < lim) out.push({ i, j, fa: a, fb: b, diff: Math.abs(a - b) }); }
  return out;
}
// what the ear gets: the slowest beat among close pairs, or steady, or nothing close at all
function verdict(fa, fb) {
  const ps = pairs(fa, fb, 1e9, 14);
  if (!ps.length) return { kind: 'far', rate: null };
  const moving = ps.filter((p) => p.diff >= 0.25);
  if (!moving.length) return { kind: 'steady', rate: 0, ps };
  const p = moving.reduce((a, b) => (b.diff < a.diff ? b : a));
  return { kind: 'beat', rate: p.diff, p, ps };
}

// the sum of the two strings over `span` seconds, as a band: each column spans the loudest and
// softest values within four periods of the lower note (long enough to hold one full period of
// any ratio up to 5:4, short enough to follow beats). Samples by rotating phasors: no sin per sample.
const RATE = 6000;
function samples(tones, t0, span) {
  const n = Math.ceil(span * RATE), y = new Float32Array(n), osc = [];
  for (const [f, a] of tones) for (let k = 1; k <= N; k++) { const w = (2 * Math.PI * f * k) / RATE, p = 2 * Math.PI * f * k * t0; osc.push([Math.cos(p), Math.sin(p), Math.cos(w), Math.sin(w), a / k]); }
  for (let i = 0; i < n; i++) { let v = 0; for (const o of osc) { v += o[1] * o[4]; const c = o[0] * o[2] - o[1] * o[3]; o[1] = o[0] * o[3] + o[1] * o[2]; o[0] = c; } y[i] = v; }
  return y;
}
function band(d, x, y, w, hgt, fa, fb, span, t0, { colour = C.acc } = {}) {
  d.box(x, y, w, hgt, { fill: '#0f141d', stroke: C.line, r: 8 });
  const win = 4 / Math.min(fa, fb), ys = samples([[fa, 1], [fb, 1]], t0, span + win), mid = y + hgt / 2, cols = Math.floor(w / 2), half = Math.round((win * RATE) / 2);
  const norm = 2 * 1.9, top = [], bot = [];
  for (let c = 0; c <= cols; c++) {
    const i0 = Math.round((c / cols) * span * RATE); let mx = -9, mn = 9;
    for (let i = i0; i < i0 + 2 * half && i < ys.length; i++) { if (ys[i] > mx) mx = ys[i]; if (ys[i] < mn) mn = ys[i]; }
    const X = x + (c / cols) * w; top.push([X, mid - Math.min(1, mx / norm) * (hgt * 0.46)]); bot.push([X, mid - Math.max(-1, mn / norm) * (hgt * 0.46)]);
  }
  const g = d.g; g.save(); g.beginPath();
  top.forEach(([X, Y], i) => (i ? g.lineTo(X, Y) : g.moveTo(X, Y)));
  for (let i = bot.length - 1; i >= 0; i--) g.lineTo(...bot[i]);
  g.closePath(); g.fillStyle = alpha(colour, 0.55); g.fill(); g.restore();
}

// two rulers of harmonics, A above (gold), B below (teal); close pairs joined
function rulers(d, x, y, w, fa, fb, maxHz, { la = 'string A', lb = 'string B', hide = false } = {}) {
  const X = (f) => x + (f / maxHz) * w, ya = y, yb = y + 74;
  d.line([[x, ya], [x + w, ya]], { color: C.line2, width: 2 }); d.line([[x, yb], [x + w, yb]], { color: C.line2, width: 2 });
  for (let f = 0; f <= maxHz; f += maxHz > 1000 ? 200 : 100) { d.line([[X(f), yb], [X(f), yb + 8]], { color: C.line2, width: 1 }); if (f % (maxHz > 1000 ? 400 : 200) === 0 && f < maxHz) d.text(String(f), X(f), yb + 28, { size: 16, color: C.dim, align: 'center' }); }
  d.text('Hz', x + w, yb + 28, { size: 16, color: C.dim, align: 'right' });
  d.text(la, x, ya - 26, { size: 16, color: C.gold }); d.text(lb, x, yb + 50, { size: 16, color: C.acc });
  for (let i = 1; i <= N; i++) { if (fa * i <= maxHz) { d.line([[X(fa * i), ya - 14], [X(fa * i), ya + 2]], { color: C.gold, width: 3 }); } if (fb * i <= maxHz) d.line([[X(fb * i), yb - 2], [X(fb * i), yb + 14]], { color: C.acc, width: 3 }); }
  let lastLabel = -1e9;
  if (!hide) for (const p of pairs(fa, fb, maxHz)) {
    const same = p.diff < 0.25, xm = (X(p.fa) + X(p.fb)) / 2, room = xm - lastLabel > (same ? 64 : 76);
    d.line([[X(p.fa), ya + 4], [X(p.fb), yb - 4]], { color: same ? C.ok : C.bad, width: same ? 4 : 2.5, glow: same ? C.ok : null, dash: same ? null : [5, 4] });
    if (room) { d.text(same ? 'meet' : `${p.diff.toFixed(1)}/s`, xm + 6, (ya + yb) / 2 + 6, { size: 16, weight: 700, color: same ? C.ok : C.bad }); lastLabel = xm; }
  }
}
function fineRow(ctx, ctl, id, steps, after) {
  const row = h('div', { class: 'lab-row', style: 'display:flex;gap:6px;flex-wrap:wrap' });
  for (const st of steps) row.append(h('button', { type: 'button', class: 'lab-btn', style: 'flex:1;min-width:56px;min-height:44px', onclick: () => { const v = Math.round((ctl.v[id] + st) * 100) / 100; ctl.set(id, v); after(id, ctl.v[id]); } }, `${st > 0 ? '+' : '−'}${Math.abs(st)}`));
  ctx.controls.append(row);
  return row;
}
// plays two sustained strings while on; a button toggles it
function pairPlayer(ctx, s, get) {
  let pa = null, pb = null;
  const stop = () => { pa?.stop(); pb?.stop(); pa = pb = null; };
  const b = button(ctx, 'Play both strings', () => { if (pa) { stop(); b.textContent = 'Play both strings'; } else { const [fa, fb] = get(); pa = s.rich(fa, { n: N }); pb = s.rich(fb, { n: N }); b.textContent = 'Stop the sound'; } });
  ctx.onCleanup(stop);
  return { update: () => { if (pa) { const [fa, fb] = get(); pa.freq(fa); pb.freq(fb); } }, on: () => !!pa, start: () => { if (!pa) b.click(); }, el: b };
}

async function wobble(ctx) {
  const t = tasks(ctx, [{ select: 'unison' }, { select: 'fifth' }]), s = sound(ctx), FA = 110;
  let t0 = 0;
  const onB = (id, v) => { player.update(); if (Math.abs(v - FA) < 0.3) t.pick('unison'); if (Math.abs(v - 1.5 * FA) < 0.4) t.pick('fifth'); t.check(); view.redraw(); };
  const ctl = sliders(ctx, [{ id: 'fb', label: 'String B', min: 100, max: 240, step: 0.1, value: 113, unit: 'Hz' }], onB);
  fineRow(ctx, ctl, 'fb', [-1, -0.1, 0.1, 1], onB);
  const player = pairPlayer(ctx, s, () => [FA, ctl.v.fb]);
  const asking = onPhase(ctx, () => view.redraw());
  const view = stage(ctx, { wide: [820, 480], tall: [480, 640] }, (d, pane) => {
    const up = pane.upright, W = pane.W, fb = ctl.v.fb, v = verdict(FA, fb), ask = asking();
    d.clear();
    d.text(`string A ${fmtHz(FA)} Hz`, 24, 34, { size: 18, color: C.gold, weight: 600 });
    d.text(`string B ${fmtHz(fb)} Hz`, up ? 24 : 250, up ? 60 : 34, { size: 18, color: C.acc, weight: 600 });
    d.text(`B / A = ${(fb / FA).toFixed(3)}`, up ? 260 : 480, up ? 60 : 34, { size: 18, color: C.muted });
    const msg = v.kind === 'steady' ? 'steady: harmonics meet, no beating' : v.kind === 'far' ? 'no harmonics close enough to beat' : `beats: ${v.rate.toFixed(1)} per second${v.rate > 6 ? ', heard as roughness' : ''}`;
    const by = up ? 84 : 56;
    if (!ask) d.text(msg, 24, by + 26, { size: up ? 20 : 22, weight: 700, color: v.kind === 'steady' ? C.ok : v.kind === 'beat' ? C.text : C.muted, max: W - 48 });
    d.text('the two strings together, over two seconds', 24, by + 58, { size: 16, color: C.dim });
    if (ask) { d.box(24, by + 68, W - 48, up ? 150 : 130, { fill: '#0f141d', stroke: C.line, r: 8 }); d.text('?', W / 2, by + 68 + (up ? 88 : 78), { size: 34, color: C.dim, align: 'center' }); }
    else band(d, 24, by + 68, W - 48, up ? 150 : 130, FA, fb, 2, t0);
    rulers(d, 40, up ? 410 : 334, W - 80, FA, fb, up ? 700 : 1000, { hide: ask });
  });
  const anim = animate(ctx, (dt) => { if (dt === Infinity) return false; t0 += dt; view.redraw(); return true; });
  anim.kick();
  ctx.hint((i) => ctl.el.fb);
  soundNote(ctx);
  ctx.stage.__ready = { t, el: ctl.el, pane: view.pane, custom: (verb, a) => { if (a === 'unison') { ctl.set('fb', 110); onB('fb', 110); } if (a === 'fifth') { ctl.set('fb', 165); onB('fb', 165); } } };
}

async function third(ctx) {
  const t = tasks(ctx, [{ select: 'play-et' }, { select: 'play-just' }]), s = sound(ctx), FA = 220, ET = 440 * 2 ** (-8 / 12);
  let t0 = 0, mode = 'et';
  const fb = () => (mode === 'et' ? ET : FA * 1.25);
  const ctl = sliders(ctx, [{ id: 'm', label: 'Tuning of the third', options: [['et', 'Guitar: equal steps'], ['just', 'Pure 5:4']], value: 'et' }], (id, v) => { mode = v; view.redraw(); });
  button(ctx, 'Play A and C♯', () => { s.stopAll(); const a = s.rich(FA, { n: N }), b = s.rich(fb(), { n: N }); setTimeout(() => { a.stop(); b.stop(); }, 3500); t.pick(`play-${mode}`).check(); }, { primary: true });
  const asking = onPhase(ctx, () => view.redraw());
  const view = stage(ctx, { wide: [820, 480], tall: [480, 640] }, (d, pane) => {
    const up = pane.upright, W = pane.W, f2 = fb(), v = verdict(FA, f2);
    d.clear();
    if (asking()) { d.text('A, 220 Hz, and C♯, four half steps above it', 24, 34, { size: 19, weight: 600, max: W - 48 }); d.wrap('Answer the question; then play the two notes and compare the two tunings of C♯.', 24, 60, W - 48, { size: 18, color: C.muted }); return; }
    d.text(`A ${fmtHz(FA)} Hz and C♯ ${fmtHz(f2)} Hz`, 24, 34, { size: 19, weight: 600, max: W - 48 });
    d.text(`ratio ${(f2 / FA).toFixed(4)}${mode === 'just' ? ' = 5:4' : ', four equal half steps'}`, 24, 62, { size: 17, color: C.muted, max: W - 48 });
    const msg = v.kind === 'steady' ? 'steady: the 5th harmonic of A meets the 4th of C♯' : `the 5th harmonic of A (${(5 * FA).toFixed(0)} Hz) and the 4th of C♯ (${(4 * f2).toFixed(1)} Hz) beat ${v.rate.toFixed(1)} times a second`;
    const hh = d.wrap(msg, 24, 78, W - 48, { size: 19, weight: 700, color: v.kind === 'steady' ? C.ok : C.bad, lines: 3 });
    d.text('the two notes together, over one second', 24, 98 + hh, { size: 16, color: C.dim });
    band(d, 24, 108 + hh, W - 48, up ? 140 : 120, FA, f2, 1, t0);
    rulers(d, 40, up ? 430 : 326, W - 80, FA, f2, 1400, { la: 'A, 220 Hz', lb: 'C♯' });
  });
  const anim = animate(ctx, (dt) => { if (dt === Infinity) return false; t0 += dt; view.redraw(); return true; });
  anim.kick();
  ctx.hint(() => ctl.el.m);
  soundNote(ctx);
  ctx.stage.__ready = { t, el: ctl.el, pane: view.pane, custom: (verb, a) => { const m = a === 'play-et' ? 'et' : 'just'; ctl.set('m', m); mode = m; t.pick(a).check(); view.redraw(); } };
}

async function tuneup(ctx) {
  const t = tasks(ctx, [{ select: 'tuned' }]), s = sound(ctx), FE = 82.407 * 2 ** (5 / 12); // low E at fret 5: 110.00 Hz
  let t0 = 0, held = 0, done = false;
  const onA = () => { player.update(); view.redraw(); };
  const ctl = sliders(ctx, [{ id: 'fa', label: 'Peg of the A string', min: 104, max: 116, step: 0.05, value: 107.3 }], onA);
  fineRow(ctx, ctl, 'fa', [-0.5, -0.05, 0.05, 0.5], onA);
  const player = pairPlayer(ctx, s, () => [FE, ctl.v.fa]);
  const view = stage(ctx, { wide: [820, 480], tall: [480, 640] }, (d, pane) => {
    const up = pane.upright, W = pane.W, diff = Math.abs(ctl.v.fa - FE);
    d.clear();
    d.text('low E at fret 5', 24, 34, { size: 18, color: C.gold, weight: 600 }); d.text('open A string', up ? 24 : 300, up ? 60 : 34, { size: 18, color: C.acc, weight: 600 });
    // a lamp that pulses with the beats: the only read-out
    const lamp = 0.5 + 0.5 * Math.cos(2 * Math.PI * diff * t0), lx = W - 70, ly = up ? 46 : 40;
    d.circle(lx, ly, 26, { fill: alpha(diff < 0.6 ? C.ok : C.gold, 0.25 + 0.75 * (diff < 0.6 ? 1 : lamp)), glow: diff < 0.6 ? C.ok : null });
    d.text(done ? `in tune: A ${fmtHz(ctl.v.fa)} Hz` : diff < 0.6 ? 'almost still…' : 'wah, wah, wah', 24, up ? 100 : 74, { size: 20, weight: 700, color: diff < 0.6 ? C.ok : C.text });
    band(d, 24, up ? 120 : 96, W - 48, up ? 200 : 180, FE, ctl.v.fa, 3, t0);
    d.wrap('The wave of the two notes over three seconds. Each bulge is one beat: fewer bulges, closer notes.', 24, up ? 340 : 296, W - 48, { size: 17, color: C.muted });
  });
  const anim = animate(ctx, (dt) => {
    if (dt === Infinity) return false; t0 += dt;
    if (Math.abs(ctl.v.fa - FE) < 0.6) { held += dt; if (held > 0.8 && !done) { done = true; t.pick('tuned').check(); } } else held = 0;
    view.redraw(); return true;
  });
  anim.kick();
  ctx.hint(() => ctl.el.fa);
  soundNote(ctx);
  ctx.stage.__ready = { t, el: ctl.el, pane: view.pane, custom: () => { ctl.set('fa', 110); onA(); } };
}

export default { wobble, third, tuneup };
