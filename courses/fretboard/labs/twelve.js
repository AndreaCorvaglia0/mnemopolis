// The Twelve-Hour Tower: twelve half steps fill the octave; each fret is one of them.
//   circle     a dial of the twelve notes linked to the A string: turn the dial or tap a fret, hear it
//   fifthfret  (upstairs) the six strings: fret 5 gives the next open string, fret 4 on the G string
import { stage, button, tasks, animate, spring, C, alpha } from '../../../engine/src/lab/kit.js';
import { TUNING, hz, nameOf, fmtHz, pc, isLetter, neckGeom, drawNeck, dot, dialGeom, drawDial } from './lib/music.js';
import { sound, soundNote, onPhase } from './lib/sound.js';

const A2 = 45;

async function circle(ctx) {
  const t = tasks(ctx, [{ select: 'octave' }, { select: 'c' }]), s = sound(ctx);
  let fret = 0; const seen = new Set([0]), hand = spring(0, 9);
  const go = (k, play = true) => {
    k = Math.max(0, Math.min(12, k)); if (k === fret && !play) return;
    fret = k; seen.add(k); hand.to(k); if (play) s.pluck(hz(A2 + k), { dur: 1.4, gain: 0.5 });
    if (k === 12 && seen.size >= 5) t.pick('octave');
    if (k === 3 && t.done(0)) t.pick('c');
    t.check(); anim.kick();
  };
  const geo = (pane) => {
    const up = pane.upright, W = pane.W;
    const D = up ? dialGeom(W / 2, 165, 112, { order: 1 }) : dialGeom(170, 200, 130, { order: 1 });
    const G = up ? neckGeom({ x: 24, y: 560, w: W - 40, h: 0 }, { strings: [1], frets: 12, open: 38 }) : neckGeom({ x: 350, y: 300, w: 450, h: 0 }, { strings: [1], frets: 12, open: 40 });
    return { up, D, G };
  };
  const asking = onPhase(ctx, () => view.redraw());
  const view = stage(ctx, { wide: [820, 480], tall: [480, 640] }, (d, pane) => {
    const { up, D, G } = geo(pane); d.clear();
    const m = A2 + fret, lit = new Set([pc(m)]);
    if (asking()) { d.circle(D.cx, D.cy, D.r * 1.18, { fill: C.card, stroke: C.line2, width: 2 }); d.text('?', D.cx, D.cy + 14, { size: 40, color: C.dim, align: 'center' }); drawNeck(d, G, { numbers: false, markers: false }); dot(d, G, 1, 0, { fill: C.gold, r: 12 }); d.text('A', ...G.pos(1, 0).map((v, i) => v - (i ? 30 : 0)), { size: 18, weight: 700, color: C.gold, align: 'center' }); return; }
    drawDial(d, D, { lit });
    // the hand: from the centre to the note, turned by the number of half steps above A
    const a = D.ang((9 + hand.v) % 12), turns = Math.floor(hand.v / 12 + 1e-6);
    d.line([[D.cx, D.cy], [D.cx + Math.cos(a) * D.r * 0.7, D.cy + Math.sin(a) * D.r * 0.7]], { color: C.gold, width: 5 });
    d.circle(D.cx, D.cy, 9, { fill: C.gold });
    d.text(`${fret} half step${fret === 1 ? '' : 's'} above A`, D.cx, D.cy + D.r * 1.18 + 34, { size: 18, color: C.muted, align: 'center' });
    if (turns) d.text('one full turn', D.cx, D.cy + 30, { size: 16, weight: 700, color: C.gold, align: 'center' });
    // the A string, with the fret where the finger is
    const { y1 } = drawNeck(d, G, { labels: true });
    for (let k = 0; k <= 12; k++) if (seen.has(k)) { const [x, y] = G.pos(1, k); if (k !== fret) d.circle(x, y, 7, { fill: alpha(C.acc, 0.7) }); d.text(nameOf(A2 + k), x, y - 30 - (isLetter(A2 + k) ? 0 : 20), { size: isLetter(A2 + k) ? 18 : 16, weight: k === fret ? 700 : 500, color: k === fret ? C.gold : isLetter(A2 + k) ? C.text : C.muted, align: 'center' }); }
    dot(d, G, 1, fret, { fill: C.gold, r: 12 });
    const rx = up ? 24 : 350, ry = up ? 400 : 90;
    d.text(`${nameOf(m)}  ·  fret ${fret}  ·  ${fmtHz(hz(m))} Hz`, rx, ry, { size: up ? 24 : 28, weight: 700, color: C.gold, max: pane.W - rx - 20 });
    d.text(`× ${(hz(m) / hz(A2)).toFixed(3)} the open A string (110 Hz)`, rx, ry + 30, { size: 17, color: C.muted, max: pane.W - rx - 20 });
    d.text(isLetter(m) ? 'a letter name' : `a sharp: between ${nameOf(m - 1)} and ${nameOf(m + 1)}`, rx, ry + 56, { size: 17, color: C.muted, max: pane.W - rx - 20 });
    void y1;
  });
  const anim = animate(ctx, (dt) => { const more = hand.step(dt); view.redraw(); return more; });
  let dragDial = false;
  view.pane.drag((x, y, ph) => {
    const { D, G } = geo(view.pane);
    if (ph === 'down') { dragDial = Math.hypot(x - D.cx, y - D.cy) < D.r * 1.25; }
    if (dragDial && ph !== 'up') { const p = D.pick(x, y); if (p == null) return; let k = (p - 9 + 12) % 12; if (fret >= 11 && k === 0) k = 12; if (k !== fret) go(k); return; }
    if (ph === 'down') { const hit = G.at(x, y, 3); if (hit) go(hit.k); }
  });
  button(ctx, 'One fret up', () => go(fret + 1), { primary: true });
  button(ctx, 'Back to the open string', () => { go(0); });
  ctx.hint((i) => { const { G } = geo(view.pane); return i === 0 ? G.pos(1, Math.min(12, fret + 1)) : G.pos(1, 3); });
  Object.defineProperty(view.pane, 'items', { get: () => { const { G } = geo(view.pane); return Array.from({ length: 13 }, (_, k) => { const [x, y] = G.pos(1, k); return { c: `fret${k}`, x, y }; }); }, configurable: true });
  soundNote(ctx);
  ctx.stage.__ready = { t, pane: view.pane, custom: (verb, a) => { if (a === 'octave') { for (let k = 1; k <= 12; k++) go(k, false); hand.set(12); } if (a === 'c') go(3); } };
}

async function fifthfret(ctx) {
  const t = tasks(ctx, [{ select: 'e5' }, { select: 'g4' }]), s = sound(ctx);
  let pick = null;
  const geo = (pane) => (pane.upright ? neckGeom({ x: 22, y: 120, w: pane.W - 34, h: 260 }, { frets: 7, open: 40 }) : neckGeom({ x: 40, y: 110, w: 740, h: 250 }, { frets: 7, open: 44 }));
  const view = stage(ctx, { wide: [820, 480], tall: [480, 640] }, (d, pane) => {
    const G = geo(pane); d.clear();
    drawNeck(d, G);
    for (const st of G.strings) dot(d, G, st, 0, { fill: C.card2, text: nameOf(TUNING[st]), color: C.text, r: 14 });
    if (pick) {
      const m = TUNING[pick.s] + pick.k, next = pick.s < 5 ? TUNING[pick.s + 1] : null, same = next != null && pc(m) === pc(next) && m === next;
      dot(d, G, pick.s, pick.k, { fill: C.gold, text: nameOf(m), r: 15 });
      if (next != null) dot(d, G, pick.s + 1, 0, { fill: same ? C.ok : C.card2, text: nameOf(next), color: same ? '#04201d' : C.text, r: 15, ring: same ? C.ok : null });
      const line = next == null ? `${nameOf(m)} at fret ${pick.k} of the top string` : same ? `fret ${pick.k} on the ${nameOf(TUNING[pick.s])} string is ${nameOf(m)}, the same note as the open ${nameOf(next)} string` : `fret ${pick.k} on the ${nameOf(TUNING[pick.s])} string is ${nameOf(m)}; the open string above is ${nameOf(next)}`;
      d.wrap(line, 24, pane.upright ? 430 : 410, pane.W - 48, { size: 19, weight: 600, color: same ? C.ok : C.text, lines: 3 });
      d.text(`${fmtHz(hz(m))} Hz${next != null ? `  against  ${fmtHz(hz(next))} Hz` : ''}`, 24, pane.upright ? 520 : 460, { size: 17, color: C.muted });
    } else d.wrap('Tap a fret on any string to hear it and compare it with the next string up.', 24, pane.upright ? 430 : 410, pane.W - 48, { size: 18, color: C.muted });
    d.text('high E at the top, low E at the bottom, as in tablature', 24, 40, { size: 16, color: C.dim, max: pane.W - 48 });
  });
  view.pane.drag((x, y, ph) => {
    if (ph !== 'down') return; const hit = geo(view.pane).at(x, y); if (!hit) return;
    pick = hit; const m = TUNING[hit.s] + hit.k, next = TUNING[hit.s + 1];
    s.pluck(hz(m), { dur: 1.6 }); if (next != null && m === next) s.pluck(hz(next), { dur: 1.6, at: 0.35 });
    if (hit.s === 0 && hit.k === 5) t.pick('e5'); if (hit.s === 3 && hit.k === 4) t.pick('g4');
    t.check(); view.redraw();
  });
  ctx.hint((i) => geo(view.pane).pos(i === 0 ? 0 : 3, i === 0 ? 5 : 4));
  Object.defineProperty(view.pane, 'items', { get: () => { const G = geo(view.pane); return [[0, 5, 'e5'], [3, 4, 'g4'], [3, 5, 'g5']].map(([st, k, c]) => { const [x, y] = G.pos(st, k); return { c, x, y }; }); }, configurable: true });
  soundNote(ctx);
  ctx.stage.__ready = { t, pane: view.pane, custom: (verb, a) => { const [st, k] = a === 'e5' ? [0, 5] : [3, 4]; pick = { s: st, k }; t.pick(a).check(); view.redraw(); } };
}

export default { circle, fifthfret };
