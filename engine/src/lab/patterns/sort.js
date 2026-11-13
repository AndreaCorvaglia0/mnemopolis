// Ready-made pattern "sort": cards are dragged (or tapped, then a bin tapped) into 2 to 4 bins.
// Each placement has a consequence: the bin takes the card with a bounce and a glow, its count (and,
// with "scale", its total) grows, and the card's own explanation ("why") appears where the learner
// looks. Cards in the wrong bin are marked only once every card is placed: then they wobble.
//   sort(ctx, { bins: [{ id, label, emoji, color }], cards: [{ id, label, emoji, bin, why, value }],
//               scale: { label, unit } })   -> { pane, d, t, redraw, over(fn) }
import { C, color, alpha, clamp } from './draw.js';
import { stage, tasks, animate, spring, shuffle, hit } from './author.js';
import { fmt } from './expr.js';
import { sfx } from '../../systems/audio.js';

export function sort(ctx, data, whens = ctx.station?.when) {
  const t = tasks(ctx, whens || []);
  const bins = data.bins.map((b, k) => ({ ...b, col: color(b.color, k + 1), n: 0, sum: spring(0, 9), pulse: 0 }));
  const cards = shuffle(data.cards, ctx.station?.id || 'sort').map((c) => ({ ...c, at: null, x: 0, y: 0, w: 0, h: 0, sx: spring(0, 14), sy: spring(0, 14), wob: 0 }));
  t.rec.items = cards.map((c) => c.id);
  cards.forEach((c) => { t.rec.correct[c.id] = c.bin; });
  const extra = [];
  let drag = null, picked = null, L = null, settled = false, allIn = false, started = false;
  const tray = spring(0, 8); // the tray shrinks as it empties, and the bins rise into its room

  // where everything goes, for the current box
  const layout = (pane) => {
    const up = pane.upright, W = pane.W, H = pane.H, pad = 16, nb = bins.length;
    const cols = up ? 2 : Math.min(4, Math.max(3, Math.ceil(cards.length / 2))), chh = up ? 58 : 62;
    // the tray is as tall as the cards need at the start; the bins get the rest
    const left = cards.filter((c) => !c.at).length;
    tray.to(left ? Math.min(H * (up ? 0.5 : 0.45), Math.ceil(left / cols) * (chh + 10) + 22) : 0);
    if (!started) tray.set(tray.target);
    const trayH = tray.v;
    const cw = (W - pad * 2 - (cols - 1) * 12) / cols;
    const k = Math.min(1, trayH / 40), binY = trayH + (up ? 14 : 22) * k + pad * (1 - k), binH = H - binY - pad, bw = (W - pad * 2 - (nb - 1) * 14) / nb;
    return { up, W, H, pad, trayH, cols, cw, chh, binY, binH, bw, small: up ? 40 : 42 };
  };
  const home = (L) => {
    const inTray = cards.filter((c) => !c.at);
    inTray.forEach((c, i) => { c.w = L.cw; c.h = L.chh; c.tx = L.pad + (i % L.cols) * (L.cw + 12); c.ty = L.pad + 6 + Math.floor(i / L.cols) * (L.chh + 10); });
    bins.forEach((b, k) => {
      // wide: bins side by side; upright (a phone): bins as bands one above the other, cards as chips in two columns
      if (L.up) { const bh = (L.binH - (bins.length - 1) * 10) / bins.length; b.x = L.pad; b.y = L.binY + k * (bh + 10); b.w = L.W - L.pad * 2; b.h = bh; }
      else { b.x = L.pad + k * (L.bw + 14); b.y = L.binY; b.w = L.bw; b.h = L.binH; }
      const inBin = cards.filter((c) => c.at === b.id), head = b.head || 64;
      if (L.up) {
        // chips flow two to a row; a label too long for half the band takes a whole row
        const cw2 = (b.w - 24 - 8) / 2, full = (c) => (L.measure ? L.measure(c) : 0) > cw2;
        let col = 0, row = 0;
        const at = inBin.map((c) => { const f = full(c); if (f && col) { row++; col = 0; } const p = [col, row, f]; if (f || col) { row++; col = 0; } else col = 1; return p; });
        const rows = row + (col ? 1 : 0), step = Math.min(L.small + 6, (b.h - head - 6) / Math.max(1, rows));
        inBin.forEach((c, i) => { const [cc, rr, f] = at[i]; c.w = f ? b.w - 24 : cw2; c.h = L.small; c.tx = b.x + 12 + cc * (cw2 + 8); c.ty = b.y + head + rr * step; });
      } else {
        const room = b.h - head - 10, step = Math.min(L.small + 6, room / Math.max(1, inBin.length));
        inBin.forEach((c, i) => { c.w = b.w - 16; c.h = L.small; c.tx = b.x + 8; c.ty = b.y + head + i * step; });
      }
    });
  };
  const anim = animate(ctx, (dt) => {
    let more = false;
    for (const c of cards) { if (c === drag) continue; c.sx.to(c.tx); c.sy.to(c.ty); more = c.sx.step(dt) | c.sy.step(dt) || more; c.x = c.sx.v; c.y = c.sy.v; if (c.wob > 0) { c.wob = dt === Infinity ? 0 : Math.max(0, c.wob - dt); more = true; } }
    more = tray.step(dt) || more;
    for (const b of bins) { more = b.sum.step(dt) || more; if (b.pulse > 0) { b.pulse = dt === Infinity ? 0 : Math.max(0, b.pulse - dt * 1.6); more = true; } }
    view.redraw(); return more;
  });

  const drawCard = (d, c, inBin) => {
    const lift = c === drag, sel = c === picked, wrong = allIn && c.at && c.at !== c.bin;
    const dx = wrong ? Math.sin(c.wob * 30) * 6 * c.wob : 0;
    d.box(c.x + dx, c.y + (lift ? -3 : 0), c.w, c.h, { fill: lift ? '#26324a' : C.card2, stroke: sel ? C.gold : wrong ? C.bad : lift ? C.acc : C.line2, width: sel || wrong ? 3 : 2, r: 10, glow: lift ? alpha(C.acc, 0.6) : null, glowSize: 22 });
    const ex = c.emoji ? (inBin ? 28 : 36) : 0, fs = inBin ? 16 : 18;
    if (c.emoji) d.emoji(c.emoji, c.x + dx + 10 + ex / 2, c.y + c.h / 2, inBin ? 22 : 28);
    if (inBin) d.text(c.label, c.x + dx + 14 + ex, c.y + c.h / 2 + 6, { size: fs, weight: 600, max: c.w - 22 - ex });
    else d.wrap(c.label, c.x + dx + 14 + ex, c.y + (c.h - Math.min(2, Math.ceil(d.measure(c.label, fs, 600) / (c.w - 24 - ex))) * d.lineH(fs)) / 2, c.w - 24 - ex, { size: fs, weight: 600, lines: 2 });
  };
  const view = stage(ctx, { wide: data.wide || [840, 540], tall: data.tall || [480, 760], caption: data.caption || '', fluid: true }, (d, pane) => {
    L = layout(pane); L.measure = (c) => d.measure(c.label, 16, 600) + (c.emoji ? 28 : 0) + 30; started = true; if (!settled) { home(L); cards.forEach((c) => { c.sx.set(c.tx); c.sy.set(c.ty); c.x = c.tx; c.y = c.ty; }); settled = true; } else home(L);
    d.clear();
    if (L.trayH > 12) d.box(8, 6, L.W - 16, L.trayH, { fill: '#0f141d', stroke: C.line, r: 14 });
    const maxSum = Math.max(1e-9, ...bins.map((b) => Math.abs(b.sum.target)));
    bins.forEach((b) => {
      const hot = drag && hit([b], drag.x + drag.w / 2, drag.y + drag.h / 2);
      d.box(b.x, b.y, b.w, b.h, { fill: alpha(b.col, hot ? 0.2 : 0.08 + 0.12 * b.pulse), stroke: hot || b.pulse > 0 ? b.col : alpha(b.col, 0.55), width: hot ? 4 : 2.5, r: 16, glow: b.pulse > 0 || hot ? b.col : null, glowSize: 10 + 26 * b.pulse });
      // the head: emoji, the label on up to two lines, the count in a badge
      const ex = b.emoji ? 34 : 0, cw2 = d.measure(String(b.n), 18, 800) + 18;
      if (b.emoji) d.emoji(b.emoji, b.x + 12 + 15, b.y + 26, 26);
      const th = d.wrap(b.label, b.x + 12 + ex, b.y + 12, b.w - 30 - ex - cw2, { size: 18, weight: 700, color: b.col, lines: 2 });
      d.box(b.x + b.w - 10 - cw2, b.y + 10, cw2, 30, { fill: alpha(b.col, 0.25 + 0.5 * b.pulse), r: 15 });
      d.text(String(b.n), b.x + b.w - 10 - cw2 / 2, b.y + 31, { size: 18, weight: 800, color: C.text, align: 'center' });
      b.head = Math.max(L.up ? 44 : 52, th + (L.up ? 16 : 22)) + (data.scale ? 16 : 0);
      if (data.scale) {
        const frac = clamp(b.sum.v / maxSum, 0, 1), y = b.y + b.head - 22;
        d.box(b.x + 12, y, b.w - 24, 10, { fill: C.line, r: 5 });
        d.box(b.x + 12, y, Math.max(0, (b.w - 24) * frac), 10, { fill: b.col, r: 5 });
      }
    });
    if (data.scale) bins.forEach((b) => d.text(`${data.scale.label ? `${data.scale.label}: ` : ''}${fmt(b.sum.target)}${data.scale.unit ? ` ${data.scale.unit}` : ''}`, b.x + b.w / 2, b.y + b.h - 12, { size: 16, color: C.muted, align: 'center', max: b.w - 12 }));
    cards.filter((c) => c.at && c !== drag).forEach((c) => drawCard(d, c, true));
    cards.filter((c) => !c.at && c !== drag).forEach((c) => drawCard(d, c, false));
    if (drag) drawCard(d, drag, false);
    extra.forEach((f) => f(d, { bins, cards }, L));
  });

  const place = (c, b) => {
    const from = c.at;
    if (from === (b?.id ?? null)) return;
    if (from) { const fb = bins.find((x) => x.id === from); fb.n--; fb.sum.to(fb.sum.target - (c.value || 0)); }
    c.at = b ? b.id : null;
    if (b) { b.n++; b.sum.to(b.sum.target + (c.value || 0)); b.pulse = 1; t.rec.placed[c.id] = b.id; sfx.plop?.(); if (c.why) ctx.nudge?.(`${c.label}: ${c.why}`, 9000); }
    else delete t.rec.placed[c.id];
    const was = allIn;
    allIn = cards.every((x) => x.at);
    if (allIn && !was) { cards.forEach((x) => { if (x.at !== x.bin) x.wob = 1; }); if (cards.some((x) => x.at !== x.bin)) sfx.thud?.(); }
    t.state(JSON.stringify(t.rec.placed)).check();
    anim.kick();
  };
  let downAt = null, moved = false;
  view.pane.drag((x, y, phase) => {
    if (phase === 'down') {
      const c = hit([...cards].sort((a, b) => (a.at ? 0 : 1) - (b.at ? 0 : 1)), x, y, view.pane.px(6));
      downAt = [x, y]; moved = false;
      if (c) { drag = c; drag.ox = x - c.x; drag.oy = y - c.y; t.pick(c.id); view.pane.cv.style.cursor = 'grabbing'; }
      else if (picked) { const b = hit(bins, x, y); if (b) { place(picked, b); picked = null; } }
    } else if (phase === 'move' && drag) {
      if (Math.hypot(x - downAt[0], y - downAt[1]) > view.pane.px(6)) moved = true;
      drag.x = drag.sx.v = x - drag.ox; drag.y = drag.sy.v = y - drag.oy; drag.sx.target = drag.x; drag.sy.target = drag.y; view.redraw();
    } else if (phase === 'up' && drag) {
      const c = drag; drag = null; view.pane.cv.style.cursor = 'grab';
      if (!moved) { picked = picked === c ? null : c; if (picked) ctx.nudge?.(data.tapHint || 'Now tap the bin it belongs in.', 4000); anim.kick(); view.redraw(); return; }
      const b = hit(bins, c.x + c.w / 2, c.y + c.h / 2) || hit(bins, x, y);
      picked = null;
      place(c, b || null); anim.kick();
    }
  });
  view.pane.cv.style.cursor = 'grab';
  ctx.hint?.((k) => {
    const w = t.whens[k], p = w?.place;
    const c = p?.item ? cards.find((x) => x.id === p.item) : cards.find((x) => !x.at) || cards.find((x) => x.at !== x.bin);
    if (p?.bin && c?.at !== p.bin && c) return [c.x + c.w / 2, c.y + c.h / 2];
    return c ? [c.x + c.w / 2, c.y + c.h / 2] : null;
  });
  return (ctx.stage.__ready = { kind: 'sort', anim, pane: view.pane, d: view.d, t, cards, bins, redraw: view.redraw, over: (f) => { extra.push(f); view.redraw(); } });
}
