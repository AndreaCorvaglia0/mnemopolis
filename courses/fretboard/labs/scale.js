// The Step Ladder: the major scale is one pattern of steps from any note.
//   stencil   a stencil of seven holes over the dial of twelve notes, and the same scale as steps on
//             one string (a ruler of half steps); turn it to a new root, play it, find what changed
//   relative  (upstairs) C major's notes started from A: the minor pattern, with no note changed
import { stage, button, tasks, animate, spring, C, alpha, L } from '../../../engine/src/lab/kit.js';
import { hz, pc, nameOf, letterOf, toLetter, bothLabel, isIt, MAJOR, STEPS, stepName, keyNames, dialGeom, drawDial } from './lib/music.js';
import { sound, soundNote } from './lib/sound.js';

const C3 = 48;
// the ruler: 13 cells of one half step each, from the root; the scale's notes lit, steps written under
function ruler(d, x, y, w, root, notes, { names, playing = -1, steps = STEPS, tap = null, lab = '' } = {}) {
  const cw = w / 12;
  for (let i = 0; i <= 12; i++) {
    const on = notes.includes(i % 12) || i === 12, cx = x + i * cw;
    d.box(cx - cw * 0.46, y, cw * 0.92, 50, { fill: on ? (playing === notes.indexOf(i % 12) || (i === 12 && playing === 7) ? C.gold : C.acc) : '#151b27', stroke: on ? null : C.line2, r: 6 });
    d.text(names[i], cx, y + 32, { size: cw > 34 ? 17 : 16, weight: on ? 700 : 400, color: on ? '#04201d' : C.dim, align: 'center' });
    if (tap) tap.push({ c: names[i], i, x: cx - cw / 2, y, w: cw, h: 50 });
  }
  // the steps between lit notes
  const lit = [...notes, 12];
  for (let j = 0; j < 7; j++) { const a = lit[j], b = lit[j + 1], cx = x + ((a + b) / 2) * cw, H = steps[j] === 'H'; d.text(stepName(steps[j]), cx, y + 78, { size: 18, weight: 700, color: H ? C.gold : C.muted, align: 'center' }); }
  if (lab) d.text(lab, x - cw / 2, y - 12, { size: 16, color: C.dim });
}

async function stencil(ctx) {
  const FSHARP = L('F♯: the seventh note, a half step below G', 'Fa♯ (F♯): la settima nota, un semitono sotto il Sol (G)');
  const t = tasks(ctx, [{ select: 'playG' }, { select: 'fs' }]), s = sound(ctx);
  let root = 0, playing = -1, flash = null; const rot = spring(0, 8);
  const notes = () => MAJOR.map((x) => pc(root + x));
  const geo = (pane) => (pane.upright ? { D: dialGeom(pane.W / 2, 168, 104), R: [40, 440, pane.W - 80] } : { D: dialGeom(200, 240, 122), R: [420, 250, 370] });
  const play = () => {
    s.stopAll(); const base = C3 + root;
    MAJOR.concat(12).forEach((x, i) => { s.pluck(hz(base + x), { dur: 1.2, gain: 0.5, at: i * 0.32 }); setTimeout(() => { if (ctx.alive()) { playing = i; view.redraw(); } }, i * 320 + 10); });
    setTimeout(() => { if (ctx.alive()) { playing = -1; view.redraw(); } }, 8 * 320 + 300);
    if (root === 0) t.pick('playC'); if (root === 7) t.pick('playG'); t.check();
  };
  const setRoot = (p) => { root = pc(p); let target = root; const cur = rot.target; while (target - cur > 6) target -= 12; while (target - cur < -6) target += 12; rot.to(target); anim.kick(); view.redraw(); };
  const view = stage(ctx, { wide: [820, 480], tall: [480, 640] }, (d, pane) => {
    const { D, R } = geo(pane), ns = notes(), names = keyNames(root);
    d.clear();
    // the stencil: a ring with seven windows, turned by the root
    const r0 = rot.v;
    d.circle(D.cx, D.cy, D.r * 1.36, { fill: alpha('#c7a76a', 0.18), stroke: '#c7a76a', width: 3 });
    const label = new Array(12).fill(null); ns.forEach((p, i) => (label[p] = names[i]));
    drawDial(d, D, { lit: new Set(ns), gold: new Set([pc(root)]), names: label.map((n, p) => n || nameOf(p)) });
    for (let j = 0; j < 7; j++) { const a = D.ang(r0 + (MAJOR[j] + (MAJOR[j + 1] ?? 12)) / 2); d.text(stepName(STEPS[j]), D.cx + Math.cos(a) * D.r * 1.28, D.cy + Math.sin(a) * D.r * 1.28 + 6, { size: 17, weight: 700, color: STEPS[j] === 'H' ? C.gold : '#d8c49a', align: 'center' }); }
    d.text(L(`${names[0]} major`, `${names[0]} maggiore`), D.cx, D.cy + 8, { size: 24, weight: 700, color: C.gold, align: 'center' });
    // the same scale on one string: one cell per fret
    const cells = Array.from({ length: 13 }, (_, i) => { const p = pc(root + i), k = ns.indexOf(p); return k >= 0 ? toLetter(names[k]) : letterOf(p, false); });  // the cells are a fretboard: letters
    const [rx, ry, rw] = R; tapCells = [];
    ruler(d, rx, ry, rw, root, MAJOR, { names: cells, playing, tap: tapCells, lab: L('on one string: one cell per fret', 'su una corda: una casella per tasto') });
    const sharps = names.filter((n) => n.includes('♯')), flats = names.filter((n) => n.includes('♭'));
    const txt = sharps.length ? L(`${sharps.length} sharp${sharps.length > 1 ? 's' : ''}: ${sharps.join(' ')}`, `${sharps.length} diesis: ${sharps.map(bothLabel).join(' ')}`) : flats.length ? L(`${flats.length} flat${flats.length > 1 ? 's' : ''}: ${flats.join(' ')}`, `${flats.length} bemolle: ${flats.map(bothLabel).join(' ')}`) : L('no sharps or flats', 'nessun diesis né bemolle');
    d.text(names.join('  '), rx, ry - 70, { size: 22, weight: 700, color: C.text, max: rw + 30 });
    d.text(txt, rx, ry - 42, { size: 18, color: sharps.length || flats.length ? C.gold : C.muted });
    if (flash) d.text(flash, rx, ry + 120, { size: 18, color: C.ok, max: rw + 30 });
  });
  let tapCells = [];
  const anim = animate(ctx, (dt) => { const more = rot.step(dt); view.redraw(); return more; });
  view.pane.drag((x, y, ph) => {
    if (ph !== 'down') return;
    const { D } = geo(view.pane), p = Math.hypot(x - D.cx, y - D.cy) < D.r * 1.4 ? D.pick(x, y) : null;
    if (p != null) { setRoot(p); s.pluck(hz(C3 + p), { dur: 0.8 }); return; }
    const c = tapCells.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
    if (c) { s.pluck(hz(C3 + root + c.i), { dur: 1 }); if (root === 7 && c.i === 11) { t.pick('fs').check(); flash = FSHARP; } view.redraw(); }
  });
  button(ctx, L('Play the scale', 'Suona la scala'), play, { primary: true });
  ctx.hint((i) => { const { D, R } = geo(view.pane); if (i === 0) return D.at(7); return [R[0] + (11 * R[2]) / 12, R[1] + 25]; });
  Object.defineProperty(view.pane, 'items', { get: () => { const { D, R } = geo(view.pane); return [...Array.from({ length: 12 }, (_, p) => ({ c: `dial${p}`, x: D.at(p)[0], y: D.at(p)[1] })), ...Array.from({ length: 13 }, (_, i) => ({ c: `cell${i}`, x: R[0] + (i * R[2]) / 12, y: R[1] + 25 }))]; }, configurable: true });
  soundNote(ctx);
  ctx.stage.__ready = { t, pane: view.pane, custom: (verb, a) => { if (a === 'playC') { setRoot(0); play(); } if (a === 'playG') { setRoot(7); play(); } if (a === 'fs') { setRoot(7); t.pick('fs').check(); flash = FSHARP; view.redraw(); } } };
}

async function relative(ctx) {
  const t = tasks(ctx, [{ select: 'playA' }, { select: 'h1' }]), s = sound(ctx);
  let start = 0, playing = -1, flash = null, tapSteps = [];
  const C_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];   // letters: the cells of the ruler are a fretboard
  const SHOWN = C_NAMES.map((c, j) => L(c, nameOf([0, 2, 4, 5, 7, 9, 11][j])));
  const FIRST = L('The first half step: from B to C, the 2nd step', 'Il primo semitono: da Si a Do, il 2º passo');
  // the seven notes of C major from the chosen start, as half steps from it, and the steps between
  const from = () => { const base = MAJOR[start]; return MAJOR.map((_, j) => (MAJOR[(start + j) % 7] - base + 12) % 12); };
  const stepsFrom = () => { const n = [...from(), 12]; return n.slice(0, 7).map((x, j) => (n[j + 1] - x === 1 ? 'H' : 'W')); };
  const play = () => {
    s.stopAll(); const base = 48 + MAJOR[start] + (start >= 5 ? -12 : 0);
    [...from(), 12].forEach((x, i) => { s.pluck(hz(base + x), { dur: 1.2, at: i * 0.32 }); setTimeout(() => { if (ctx.alive()) { playing = i; view.redraw(); } }, i * 320 + 10); });
    setTimeout(() => { if (ctx.alive()) { playing = -1; view.redraw(); } }, 2900);
    if (start === 5) t.pick('playA'); t.check();
  };
  const view = stage(ctx, { wide: [820, 480], tall: [480, 640] }, (d, pane) => {
    const up = pane.upright, W = pane.W, n = from(), st = stepsFrom();
    d.clear();
    d.text(L('the notes of C major, started from', 'le note di Do maggiore (C), partendo da'), 24, 40, { size: 18, color: C.muted });
    // the seven start buttons
    tapStarts = [];
    const bw = (W - 48) / 7;
    C_NAMES.forEach((nm, j) => { const x = 24 + j * bw; d.box(x + 4, 56, bw - 8, 52, { fill: j === start ? C.gold : C.card2, r: 10 }); if (isIt()) { d.text(SHOWN[j], x + bw / 2, 82, { size: 20, weight: 700, color: j === start ? '#04201d' : C.text, align: 'center' }); d.text(nm, x + bw / 2, 100, { size: 16, color: j === start ? '#04201d' : C.dim, align: 'center' }); } else d.text(nm, x + bw / 2, 90, { size: 22, weight: 700, color: j === start ? '#04201d' : C.text, align: 'center' }); tapStarts.push({ j, x, y: 56, w: bw, h: 52 }); });
    const names = Array.from({ length: 13 }, (_, i) => { const k = n.indexOf(i % 12); return k >= 0 ? C_NAMES[(start + k) % 7] : '·'; });
    tapSteps = [];
    const rx = 40, ry = up ? 220 : 200, rw = W - 80;
    ruler(d, rx, ry, rw, 0, n, { names, playing, steps: st, lab: L('one cell per fret', 'una casella per tasto') });
    const lit = [...n, 12], cw = rw / 12; for (let j = 0; j < 7; j++) tapSteps.push({ j, x: rx + ((lit[j] + lit[j + 1]) / 2) * cw - 22, y: ry + 56, w: 44, h: 34 });
    const minor = start === 5, major = start === 0;
    d.text(`${SHOWN[start]} … ${SHOWN[start]}:  ${st.map(stepName).join(' ')}`, 24, ry + 140, { size: 22, weight: 700, color: minor ? C.purple : major ? C.acc : C.text });
    const hh = d.wrap(major ? L('the major pattern', 'lo schema maggiore') : minor ? L('the natural minor pattern: A minor, the relative minor of C', 'lo schema minore naturale: La minore (Am), la relativa minore di Do') : L('another pattern from the same seven notes', 'un altro schema con le stesse sette note'), 24, ry + 156, W - 48, { size: 17, color: C.muted, lines: 2 });
    if (flash) d.wrap(flash, 24, ry + 166 + hh, W - 48, { size: 18, color: C.ok, lines: 2 });
  });
  let tapStarts = [];
  view.pane.drag((x, y, ph) => {
    if (ph !== 'down') return;
    const b = tapStarts.find((q) => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h);
    if (b) { start = b.j; flash = null; s.pluck(hz(48 + MAJOR[start]), { dur: 0.8 }); view.redraw(); return; }
    const q = tapSteps.find((q2) => x >= q2.x && x <= q2.x + q2.w && y >= q2.y && y <= q2.y + q2.h);
    if (q && start === 5) { const st = stepsFrom(); if (q.j === st.indexOf('H')) { flash = FIRST; t.pick('h1').check(); } else flash = st[q.j] === 'H' ? L('A half step, but not the first one', 'Un semitono, ma non il primo') : L('A whole step: two frets', 'Un tono: due tasti'); view.redraw(); }
  });
  button(ctx, L('Play the scale', 'Suona la scala'), play, { primary: true });
  ctx.hint((i) => { if (i === 0) { const b = tapStarts[5]; return b ? [b.x + b.w / 2, b.y + b.h / 2] : null; } const q = tapSteps[1]; return q ? [q.x + q.w / 2, q.y + q.h / 2] : null; });
  Object.defineProperty(view.pane, 'items', { get: () => [...tapStarts.map((b) => ({ c: `start${b.j}`, x: b.x + b.w / 2, y: b.y + b.h / 2 })), ...tapSteps.map((q) => ({ c: `step${q.j}`, x: q.x + q.w / 2, y: q.y + q.h / 2 }))], configurable: true });
  soundNote(ctx);
  ctx.stage.__ready = { t, pane: view.pane, custom: (verb, a) => { if (a === 'playA') { start = 5; play(); } if (a === 'h1') { start = 5; flash = FIRST; t.pick('h1').check(); view.redraw(); } } };
}

export default { stencil, relative };
