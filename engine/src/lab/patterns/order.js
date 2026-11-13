// Ready-made pattern "order": 3 to 7 steps on a track, shuffled. The learner drags a step onto
// another place to swap them, then runs the sequence: a light travels along the track, each step
// that is in its place lights up and shows what it produces ("result"); at the first step out of
// place the run stops, the place flashes and the step says what goes wrong ("early").
//   order(ctx, { steps: [{ id, label, emoji, result, early }], run: "Run it" })  -> { pane, d, t, run(), redraw, over(fn) }
// The steps are listed in the right order in the data.
import { C, alpha, lerp } from './draw.js';
import { stage, tasks, animate, spring, shuffle, hit, button } from './author.js';
import { LANG } from '../shell.js';
import { sfx } from '../../systems/audio.js';

const WORDS = {
  en: { run: 'Run the sequence', again: 'Run it again', first: (a, b) => `“${a}” cannot happen yet: “${b}” has to come first.`, ok: 'Every step in its place.' },
  it: { run: 'Fai partire la sequenza', again: 'Falla ripartire', first: (a, b) => `“${a}” non può ancora accadere: prima deve venire “${b}”.`, ok: 'Ogni passo al suo posto.' },
};

export function order(ctx, data, whens = ctx.station?.when) {
  const T = WORDS[LANG] || WORDS.en, t = tasks(ctx, whens || []);
  const steps = data.steps.map((s, k) => ({ ...s, k }));
  const slots = shuffle(steps, ctx.station?.id || 'order').map((s) => ({ ...s, x: 0, y: 0, w: 0, h: 0, sx: spring(0, 14), sy: spring(0, 14) }));
  const extra = [];
  let drag = null, L = null, first = true, run = null, lit = -1, broke = -1, msg = '', flash = 0;

  const layout = (pane) => {
    const up = pane.upright, n = slots.length, pad = 16;
    if (up) { const mh = 132, h = Math.min(86, (pane.H - pad * 2 - mh - (n - 1) * 12) / n); return { up, n, pad, w: pane.W - pad * 2 - 44, h, x0: pad + 44, y0: pad, gap: 12, msgY: pad + n * (h + 12) + 6 }; }
    const gap = 26, w = (pane.W - pad * 2 - (n - 1) * gap) / n, h = Math.min(250, pane.H * 0.5);
    return { up, n, pad, w, h, x0: pad, y0: pad + 40, gap, msgY: pad + 40 + h + 34 };
  };
  const posOf = (L, i) => (L.up ? [L.x0, L.y0 + i * (L.h + L.gap)] : [L.x0 + i * (L.w + L.gap), L.y0]);
  const place = () => slots.forEach((s, i) => { const [x, y] = posOf(L, i); s.w = L.w; s.h = L.h; s.tx = x; s.ty = y; if (first) { s.sx.set(x); s.sy.set(y); } });
  const anim = animate(ctx, (dt) => {
    let more = false;
    for (const s of slots) { if (s === drag) continue; s.sx.to(s.tx); s.sy.to(s.ty); more = s.sx.step(dt) | s.sy.step(dt) || more; s.x = s.sx.v; s.y = s.sy.v; }
    if (flash > 0) { flash = dt === Infinity ? 0 : Math.max(0, flash - dt * 1.4); more = true; }
    if (run) { more = true; run.t += dt === Infinity ? 99 : dt; if (run.t >= 0.55) { run.t = 0; advance(); } }
    view.redraw(); return more;
  });
  const advance = () => {
    const i = run.i;
    if (i >= slots.length) { run = null; msg = T.ok; lit = slots.length - 1; t.rec.runsRight++; sfx.reveal?.(); t.check(); return; }
    if (slots[i].k !== i) { broke = i; flash = 1; const want = steps[i]; msg = slots[i].early || T.first(slots[i].label, want.label); run = null; sfx.thud?.(); ctx.nudge?.(msg, 9000); t.check(); return; }
    lit = i; msg = slots[i].result || ''; sfx.tick?.(); run.i++;
  };
  const go = () => { if (run) return; broke = -1; lit = -1; msg = ''; run = { i: 0, t: 0.5 }; t.rec.runs++; t.check(); runBtn.textContent = T.again; anim.kick(); };

  const view = stage(ctx, { wide: data.wide || [880, 500], tall: data.tall || [480, 760], caption: data.caption || '' }, (d, pane) => {
    L = layout(pane); place(); if (first) { slots.forEach((s) => { s.x = s.tx; s.y = s.ty; }); first = false; }
    d.clear();
    // the track: arrows between places, the places' numbers
    for (let i = 0; i < slots.length; i++) {
      const [x, y] = posOf(L, i), on = i <= lit && broke < 0 || (broke >= 0 && i < broke);
      if (L.up) d.text(String(i + 1), L.pad + 16, y + L.h / 2 + 7, { size: 20, weight: 800, color: on ? C.gold : C.dim, align: 'center' });
      else d.text(String(i + 1), x + L.w / 2, y - 14, { size: 20, weight: 800, color: on ? C.gold : C.dim, align: 'center' });
      d.box(x, y, L.w, L.h, { fill: null, stroke: i === broke ? alpha(C.bad, 0.5 + 0.5 * flash) : C.line, width: i === broke ? 4 : 2, r: 14 });
      if (i < slots.length - 1) { if (L.up) d.arrow(L.pad + 16, y + L.h / 2 + 18, L.pad + 16, y + L.h + L.gap + L.h / 2 - 16, { color: i < lit && broke < 0 ? C.gold : C.line2, width: 3, head: 9 }); else d.arrow(x + L.w + 4, y + L.h / 2, x + L.w + L.gap - 4, y + L.h / 2, { color: i < lit && broke < 0 ? C.gold : C.line2, width: 3, head: 10 }); }
    }
    for (const s of slots) if (s !== drag) card(d, s);
    if (drag) card(d, drag);
    if (msg) {
      const bad = broke >= 0, y = L.msgY, w = pane.W - L.pad * 2;
      const hh = d.wrap(msg, L.pad + 16, y + 12, w - 32, { size: 19, weight: 600, measure: true });
      d.box(L.pad, y, w, hh + 24, { fill: bad ? alpha(C.bad, 0.12) : alpha(C.gold, 0.1), stroke: bad ? C.bad : C.gold, r: 12 });
      d.wrap(msg, L.pad + 16, y + 12, w - 32, { size: 19, weight: 600, color: bad ? '#ffd0c9' : C.gold });
    }
    extra.forEach((f) => f(d, { slots, lit, broke }, L));
  });
  function card(d, s) {
    const i = slots.indexOf(s), on = (i <= lit && broke < 0) || (broke >= 0 && i < broke), bad = i === broke, lift = s === drag;
    const x = s.x, y = s.y + (lift ? -4 : 0);
    d.box(x + 4, y + 4, s.w - 8, s.h - 8, { fill: bad ? alpha(C.bad, 0.18) : on ? alpha(C.gold, 0.14) : C.card2, stroke: bad ? C.bad : on ? C.gold : lift ? C.acc : C.line2, width: on || bad || lift ? 3 : 2, r: 12, glow: on ? alpha(C.gold, 0.8) : lift ? alpha(C.acc, 0.6) : null, glowSize: on ? 22 : 18 });
    if (L.up) {
      const ex = s.emoji ? 44 : 0; if (s.emoji) d.emoji(s.emoji, x + 30, y + s.h / 2, 30);
      const lines = Math.max(1, Math.min(2, Math.floor((s.h - 12) / d.lineH(18))));
      const th = d.wrap(s.label, x + 18 + ex, 0, s.w - 34 - ex, { size: 18, weight: 600, lines, measure: true });
      d.wrap(s.label, x + 18 + ex, y + (s.h - th) / 2, s.w - 34 - ex, { size: 18, weight: 600, lines });
    } else {
      if (s.emoji) d.emoji(s.emoji, x + s.w / 2, y + 48, 44);
      d.wrap(s.label, x + 14, y + (s.emoji ? 86 : 22), s.w - 28, { size: 18, weight: 600, align: 'center', lines: 5 });
    }
  }
  const runBtn = button(ctx, data.run || T.run, go, { primary: true });
  let start = null;
  view.pane.drag((x, y, phase) => {
    if (run) return;
    if (phase === 'down') { const s = hit(slots, x, y); if (s) { drag = s; start = [x - s.x, y - s.y]; t.pick(s.id); view.pane.cv.style.cursor = 'grabbing'; } }
    else if (phase === 'move' && drag) { drag.x = drag.sx.v = x - start[0]; drag.y = drag.sy.v = y - start[1]; view.redraw(); }
    else if (phase === 'up' && drag) {
      const s = drag; drag = null; view.pane.cv.style.cursor = 'grab';
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      let best = -1, bd = Infinity;
      slots.forEach((_, i) => { const [px, py] = posOf(L, i), dd = Math.hypot(px + L.w / 2 - cx, py + L.h / 2 - cy); if (dd < bd) { bd = dd; best = i; } });
      const from = slots.indexOf(s);
      if (best >= 0 && best !== from && bd < Math.max(L.w, L.h)) { [slots[from], slots[best]] = [slots[best], slots[from]]; sfx.plop?.(); broke = -1; lit = -1; msg = ''; t.state(slots.map((q) => q.id).join(',')).check(); }
      place(); anim.kick();
    }
  });
  view.pane.cv.style.cursor = 'grab';
  ctx.hint?.((k) => { const w = t.whens[k]; if (w?.run === true || (w?.run === 'correct' && slots.every((s, i) => s.k === i))) return runBtn; const i = slots.findIndex((s, j) => s.k !== j); return i >= 0 && L ? [slots[i].x + L.w / 2, slots[i].y + L.h / 2] : runBtn; });
  return { pane: view.pane, d: view.d, t, run: go, redraw: view.redraw, over: (f) => { extra.push(f); view.redraw(); } };
}
