// The Choir House: a triad stacks two thirds on a root; an open chord repeats its three notes.
//   stack   the dial with E, its third and its fifth; the open E chord on the neck with each string's
//           note and role; strum, move the third down a half step, see which string changed
//   shapes  (upstairs) the five open shapes, C A G E D, each string labelled root, third or fifth
import { stage, sliders, button, tasks, C, alpha } from '../../../engine/src/lab/kit.js';
import { TUNING, hz, pc, nameOf, neckGeom, drawNeck, dot, dialGeom, drawDial } from './lib/music.js';
import { sound, soundNote } from './lib/sound.js';

// open shapes in standard tuning, low E to high E (x = not played)
const SHAPES = { C: 'x32010', A: 'x02220', G: '320003', E: '022100', D: 'xx0232' };
const ROOT = { C: 0, A: 9, G: 7, E: 4, D: 2 };
const frets = (code) => [...code].map((c) => (c === 'x' ? null : +c));
const role = (m, root, third) => { const i = pc(m - root); return i === 0 ? 'R' : i === third ? '3' : i === 7 ? '5' : '?'; };
const ROLE_COL = { R: C.bad, 3: C.gold, 5: C.acc, '?': C.dim };

function chordPicture(d, G, fs, root, third, { strummed = -1, names = true }) {
  for (let st = 0; st < 6; st++) {
    const k = fs[st];
    if (k == null) { d.text('×', G.x0 - 20, G.sy(G.strings.indexOf(st)) + 7, { size: 20, color: C.dim, align: 'center' }); continue; }
    const m = TUNING[st] + k, r = role(m, root, third), on = strummed >= 0 && st <= strummed;
    dot(d, G, st, k, { fill: k === 0 ? alpha(ROLE_COL[r], 0.35) : ROLE_COL[r], text: names ? nameOf(m) : r, color: k === 0 ? C.text : '#04201d', r: 16, ring: on ? '#ffffff' : k === 0 ? ROLE_COL[r] : null });
  }
}

async function stack(ctx) {
  const t = tasks(ctx, [{ select: 'major' }, { select: 'minor' }, { select: 'gstring' }]), s = sound(ctx);
  let third = 4, strummed = -1, heard = null, flash = null; const R = 40; // E2
  const fs = () => (third === 4 ? frets('022100') : frets('022000'));
  const strum = () => {
    s.stopAll(); const f = fs();
    f.forEach((k, st) => { if (k != null) s.pluck(hz(TUNING[st] + k), { dur: 2.4, gain: 0.34, at: st * 0.045 }); });
    for (let i = 0; i < 6; i++) setTimeout(() => { if (ctx.alive()) { strummed = i; view.redraw(); } }, i * 45);
    heard = third; t.pick(third === 4 ? 'major' : 'minor').check(); view.redraw();
  };
  const geo = (pane) => (pane.upright ? { D: dialGeom(130, 175, 90), G: neckGeom({ x: 26, y: 340, w: pane.W - 34, h: 200 }, { frets: 4, open: 44 }), tx: 248 } : { D: dialGeom(150, 235, 112), G: neckGeom({ x: 330, y: 150, w: 470, h: 230 }, { frets: 4, open: 48 }), tx: 330 });
  const view = stage(ctx, { wide: [820, 480], tall: [480, 640] }, (d, pane) => {
    const { D, G, tx } = geo(pane), up = pane.upright; d.clear();
    const notes = [R, R + third, R + 7].map(pc);
    drawDial(d, D, { lit: new Set(notes.slice(1)), gold: new Set([notes[0]]), small: true });
    // the stack: root → third → fifth, with the half steps of each third
    const pts = notes.map((p) => D.at(p, D.r * 0.78));
    d.line([[D.cx, D.cy], pts[0]], { color: C.bad, width: 3 }); d.line([pts[0], pts[1]], { color: C.gold, width: 4 }); d.line([pts[1], pts[2]], { color: C.acc, width: 4 });
    d.text(`${third} + ${7 - third} half steps`, D.cx, D.cy + D.r * 1.18 + 30, { size: 20, weight: 700, color: C.text, align: 'center' });
    const third_name = nameOf(R + third);
    d.text(`E ${third === 4 ? 'major' : 'minor'}: E ${third_name} B`, tx, up ? 70 : 52, { size: up ? 22 : 26, weight: 700, color: C.gold, max: pane.W - tx - 16 });
    d.text(`third: ${third_name}, ${third} half steps up${third === 4 ? ' (major)' : ' (minor)'}`, tx, up ? 100 : 82, { size: 17, color: C.muted, max: pane.W - tx - 16 });
    drawNeck(d, G, { numbers: true });
    chordPicture(d, G, fs(), R, third, { strummed });
    if (heard != null) {
      const f = fs(), names = f.map((k, st) => (k == null ? null : nameOf(TUNING[st] + k))).filter(Boolean), uniq = [...new Set(names)];
      const y = up ? 600 : 440;
      d.text(`six strings: ${names.join(' ')}  →  ${uniq.length} names: ${uniq.join(' ')}`, up ? 20 : tx, y, { size: 18, weight: 600, color: C.text, max: pane.W - (up ? 30 : tx + 10) });
    }
    if (flash) d.text(flash, up ? 20 : tx, up ? 626 : 468, { size: 17, color: C.ok, max: pane.W - (up ? 30 : tx + 10) });
    d.text('root', up ? 20 : 54, up ? 330 : 440, { size: 16, color: C.bad }); d.text('third', up ? 70 : 104, up ? 330 : 440, { size: 16, color: C.gold }); d.text('fifth', up ? 128 : 162, up ? 330 : 440, { size: 16, color: C.acc });
  });
  // drag or tap the third on the dial: it snaps to 3 or 4 half steps above E
  view.pane.drag((x, y, ph) => {
    if (ph === 'up') return; const { D, G } = geo(view.pane);
    if (Math.hypot(x - D.cx, y - D.cy) < D.r * 1.25) { const p = D.pick(x, y); if (p === pc(R + 3) || p === pc(R + 4)) { const nt = pc(p - R); if (nt !== third) { third = nt; flash = null; s.pluck(hz(R + 12 + third), { dur: 0.8 }); view.redraw(); } } return; }
    if (ph === 'down') { const hit = G.at(x, y); if (hit && hit.s === 3 && third === 3 && heard === 3) { flash = 'The G string: fret 1 (G♯) lifted to the open G, a half step lower.'; t.pick('gstring').check(); view.redraw(); } else if (hit) s.pluck(hz(TUNING[hit.s] + (fs()[hit.s] ?? 0)), { dur: 1.2 }); }
  });
  const ctl = sliders(ctx, [{ id: 'third', label: 'The third', options: [[4, 'Major: 4 half steps'], [3, 'Minor: 3 half steps']], value: 4 }], (id, v) => { third = v; flash = null; view.redraw(); });
  button(ctx, 'Strum the chord', () => { strum(); ctl.set('third', third); }, { primary: true });
  ctx.hint((i) => { const { D, G } = geo(view.pane); if (i === 1) return D.at(pc(R + 3)); if (i === 2) return G.pos(3, 0); return null; });
  Object.defineProperty(view.pane, 'items', { get: () => { const { D, G } = geo(view.pane); const [x3, y3] = D.at(pc(R + 3)), [x4, y4] = D.at(pc(R + 4)), [gx, gy] = G.pos(3, 0); return [{ c: 'minor3', x: x3, y: y3 }, { c: 'major3', x: x4, y: y4 }, { c: 'gstring', x: gx, y: gy }]; }, configurable: true });
  soundNote(ctx);
  ctx.stage.__ready = { t, el: ctl.el, pane: view.pane, custom: (verb, a) => { if (a === 'major') { third = 4; strum(); } if (a === 'minor') { third = 3; ctl.set('third', 3); strum(); } if (a === 'gstring') { flash = 'The G string: fret 1 (G♯) lifted to the open G, a half step lower.'; t.pick('gstring').check(); view.redraw(); } } };
}

async function shapes(ctx) {
  const t = tasks(ctx, [{ try: { count: 3 } }, { select: 'D' }]), s = sound(ctx);
  let shape = 'E', strummed = -1;
  const ctl = sliders(ctx, [{ id: 'shape', label: 'Open shape', options: Object.keys(SHAPES).map((k) => [k, k]), value: 'E' }], (id, v) => { shape = v; strummed = -1; view.redraw(); });
  const strum = () => {
    s.stopAll(); const f = frets(SHAPES[shape]);
    f.forEach((k, st) => { if (k != null) s.pluck(hz(TUNING[st] + k), { dur: 2.4, gain: 0.34, at: st * 0.045 }); });
    strummed = 5; t.state(shape); if (shape === 'D') t.pick('D'); t.check(); view.redraw();
  };
  button(ctx, 'Strum it', strum, { primary: true });
  const geo = (pane) => (pane.upright ? neckGeom({ x: 26, y: 170, w: pane.W - 34, h: 230 }, { frets: 4, open: 44 }) : neckGeom({ x: 60, y: 150, w: 600, h: 230 }, { frets: 4, open: 48 }));
  const view = stage(ctx, { wide: [820, 480], tall: [480, 640] }, (d, pane) => {
    const G = geo(pane), f = frets(SHAPES[shape]), root = ROOT[shape]; d.clear();
    drawNeck(d, G);
    chordPicture(d, G, f, root, 4, { strummed, names: false });
    const ms = f.map((k, st) => (k == null ? null : TUNING[st] + k)), played = ms.filter((m) => m != null), low = Math.min(...played);
    const names = [...new Set(played.map((m) => nameOf(m)))];
    d.text(`${shape} major, fretted ${SHAPES[shape]}`, 24, 44, { size: 24, weight: 700, color: C.gold });
    d.text(`${played.length} strings, ${names.length} names: ${names.join(' ')}  ·  lowest string played: ${nameOf(low)}, the root`, 24, 74, { size: 17, color: C.muted, max: pane.W - 48 });
    const ly = pane.upright ? 470 : 440;
    [['R', 'root'], ['3', 'third'], ['5', 'fifth']].forEach(([r, w], i) => { d.circle(40 + i * 120, ly, 13, { fill: ROLE_COL[r] }); d.text(r, 40 + i * 120, ly + 6, { size: 15, weight: 700, color: '#04201d', align: 'center' }); d.text(w, 60 + i * 120, ly + 6, { size: 17, color: C.text }); });
  });
  ctx.hint((i) => ctl.el.shape);
  soundNote(ctx);
  ctx.stage.__ready = { t, el: ctl.el, pane: view.pane, custom: (verb, a) => { const go = (k) => { ctl.set('shape', k); shape = k; strum(); }; if (verb === 'try') ['C', 'A', 'G'].forEach(go); if (a === 'D') go('D'); } };
}

export default { stack, shapes };
