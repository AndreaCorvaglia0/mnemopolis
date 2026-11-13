// Two ready-made patterns that share one picture language:
//   sliderReveal(ctx, data)  one or two controls drive a plot, bars and/or a picture of shapes
//   compare(ctx, data)       the same picture twice, side by side, for two cases that differ in
//                            their own variables, driven by the same controls; the difference is
//                            measured and lit
// The data format is in specs.js (and references/8-ready-labs.md). Both return a handle:
//   { pane, d, v, redraw, over(fn) }: over(fn(d, vars, area)) draws your own things on top.
import { compile, template, fmt } from './expr.js';
import { ink, C, color, alpha, clamp, lerp } from './draw.js';
import { stage, sliders, tasks, animate } from './author.js';
import { sfx } from '../../systems/audio.js';

// ---- compiling the data once ----
export function namesOf(data, extra = []) {
  const n = [...(data.controls || []).map((c) => c.id), ...extra];
  for (const k of Object.keys(data.cases?.[0]?.vars || {})) if (!n.includes(k)) n.push(k);
  for (const k of Object.keys(data.vars || {})) n.push(k);
  return n;
}
// numbers in data: a number, or an expression string
const numFn = (v, names) => (typeof v === 'number' ? () => v : compile(v, names));

export function compileScene(data) {
  const names = namesOf(data), withX = [...names, 'x'];
  const vars = Object.entries(data.vars || {}).map(([k, e], i) => [k, compile(e, namesOf({ ...data, vars: Object.fromEntries(Object.entries(data.vars).slice(0, i)) }))]);
  const N = (v) => numFn(v, names), T = (s) => template(String(s ?? ''), names);
  const layers = (data.layers || []).map((L) => {
    if (L.curve != null) return { kind: 'curve', f: compile(L.curve, withX), col: color(L.color, 0), label: T(L.label), width: L.width ?? 3, show: L.show != null ? N(L.show) : null };
    if (L.points) return { kind: 'points', pts: L.points.map(([x, y]) => [N(x), N(y)]), col: color(L.color, 1), label: T(L.label), dots: L.dots !== false, show: L.show != null ? N(L.show) : null };
    if (L.threshold != null) return { kind: 'threshold', at: N(L.threshold), axis: L.axis || 'y', col: color(L.color || 'gold'), label: T(L.label) };
    if (L.region) return { kind: 'region', from: N(L.region[0]), to: N(L.region[1]), axis: L.axis || 'x', when: L.when != null ? N(L.when) : () => 1, col: color(L.color || 'gold'), label: T(L.label) };
    if (L.marker) return { kind: 'marker', x: N(L.marker[0]), y: N(L.marker[1]), col: color(L.color || 'gold'), label: T(L.label) };
    if (L.bars) return { kind: 'bars', bars: L.bars.map((b, k) => ({ label: T(b.label), v: N(b.value), col: color(b.color, k) })), max: N(L.max ?? 1), unit: L.unit || '' };
    if (L.shapes) return { kind: 'shapes', list: L.shapes };
    if (L.readout != null) return { kind: 'readout', text: T(L.readout) };
    return null;
  }).filter(Boolean);
  const shapeNum = (v, scope) => { if (typeof v === 'number') return v; let f = cache.get(v); if (!f) { f = compile(String(v), names); cache.set(v, f); } return f(scope); };
  const cache = new Map(), tcache = new Map();
  const shapeTpl = (s, scope) => { let f = tcache.get(s); if (!f) { f = template(s, names); tcache.set(s, f); } return f(scope); };
  const scope = (v) => { const s = { ...v }; for (const [k, f] of vars) s[k] = f(s); return s; };
  const ax = (a) => a && { min: a.min, max: a.max, label: a.label || '', log: false };
  return { names, layers, scope, plot: data.plot ? { x: ax(data.plot.x), y: ax(data.plot.y) } : null, shapeNum, shapeTpl };
}

// ---- drawing ----
function niceTicks(a, b, n = 5) {
  const span = b - a, raw = span / n, mag = 10 ** Math.floor(Math.log10(raw)), st = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((k) => span / k <= n + 0.5) || raw;
  const out = []; for (let t = Math.ceil(a / st) * st; t <= b + st * 1e-6; t += st) out.push(+t.toFixed(10)); return out;
}

function drawPlot(d, S, rect, s, glow) {
  const { g } = d, [x0, y0, w, h] = rect, P = S.plot, X = (x) => x0 + ((x - P.x.min) / (P.x.max - P.x.min)) * w, Y = (y) => y0 + h - ((y - P.y.min) / (P.y.max - P.y.min)) * h;
  d.box(x0, y0, w, h, { fill: '#0f141d', stroke: C.line, r: 8 });
  // grid and ticks
  const fs = 15, tick = (v) => fmt(v, Math.abs(v) < 10 && v % 1 ? 1 : 0);
  for (const t of niceTicks(P.x.min, P.x.max, w > 420 ? 6 : 4)) { d.line([[X(t), y0], [X(t), y0 + h]], { color: '#1a2130', width: 1 }); d.text(tick(t), X(t), y0 + h + d.lineH(fs), { size: fs, color: C.dim, align: 'center' }); }
  for (const t of niceTicks(P.y.min, P.y.max, h > 300 ? 5 : 4)) { d.line([[x0, Y(t)], [x0 + w, Y(t)]], { color: '#1a2130', width: 1 }); d.text(tick(t), x0 - 8, Y(t) + 5, { size: fs, color: C.dim, align: 'right' }); }
  if (P.y.min < 0 && P.y.max > 0) d.line([[x0, Y(0)], [x0 + w, Y(0)]], { color: C.line2, width: 1.5 });
  if (P.x.label) d.text(P.x.label, x0 + w, y0 + h + d.lineH(fs) * 2.1, { size: 16, color: C.muted, align: 'right', max: w });
  if (P.y.label) d.text(P.y.label, x0 + 6, y0 - 10, { size: 16, color: C.muted, max: w });
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  let ci = 0, legend = [];
  for (const L of S.layers) {
    if (L.kind === 'region') {
      const on = !!L.when(s), a = Math.min(X(L.from(s)), X(L.to(s))), b = Math.max(X(L.from(s)), X(L.to(s)));
      const k = glow.get(L) ?? 0;
      d.box(L.axis === 'x' ? a : x0, L.axis === 'x' ? y0 : Math.min(Y(L.from(s)), Y(L.to(s))), L.axis === 'x' ? b - a : w, L.axis === 'x' ? h : Math.abs(Y(L.to(s)) - Y(L.from(s))), { fill: alpha(L.col, on ? 0.16 + 0.22 * k : 0.05), r: 0 });
      const lab = L.label(s), rw = L.axis === 'x' ? b - a : w;
      // the label inside the band (up to 3 lines); a narrow band puts it above the plot
      if (lab && rw >= 90) d.wrap(lab, (L.axis === 'x' ? a : x0) + 4, y0 + 8, rw - 8, { size: 16, weight: 600, color: on ? L.col : C.dim, align: 'center', lines: 3 });
      else if (lab) d.text(lab, clamp((a + b) / 2, x0 + 80, x0 + w), y0 - 10, { size: 16, weight: 600, color: on ? L.col : C.dim, align: 'right', max: w / 2 });
    }
  }
  for (const L of S.layers) {
    if (L.kind === 'curve' && (!L.show || L.show(s))) {
      const pts = [], n = Math.max(80, Math.round(w / 2));
      for (let i = 0; i <= n; i++) { const xv = P.x.min + ((P.x.max - P.x.min) * i) / n, yv = L.f({ ...s, x: xv }); if (Number.isFinite(yv)) pts.push([X(xv), Y(clamp(yv, P.y.min - (P.y.max - P.y.min), P.y.max + (P.y.max - P.y.min)))]); else if (pts.length) { d.line(pts, { color: L.col, width: L.width }); pts.length = 0; } }
      d.line(pts, { color: L.col, width: L.width, glow: alpha(L.col, 0.5) });
      const lab = L.label(s); if (lab) legend.push([lab, L.col]); ci++;
    } else if (L.kind === 'points' && (!L.show || L.show(s))) {
      const pts = L.pts.map(([fx, fy]) => [X(fx(s)), Y(fy(s))]);
      d.line(pts, { color: L.col, width: 2.5 });
      if (L.dots) pts.forEach(([px, py]) => d.circle(px, py, 5, { fill: L.col }));
      const lab = L.label(s); if (lab) legend.push([lab, L.col]);
    } else if (L.kind === 'threshold') {
      const v = L.at(s), p = L.axis === 'x' ? X(v) : Y(v);
      d.line(L.axis === 'x' ? [[p, y0], [p, y0 + h]] : [[x0, p], [x0 + w, p]], { color: L.col, width: 2, dash: [8, 6] });
      const lab = L.label(s); if (lab) d.text(lab, L.axis === 'x' ? p + 6 : x0 + w - 6, L.axis === 'x' ? y0 + h - 10 : p - 8, { size: 16, color: L.col, align: L.axis === 'x' ? 'left' : 'right', max: w * 0.6 });
    }
  }
  for (const L of S.layers) if (L.kind === 'marker') {
    const px = X(L.x(s)), py = Y(L.y(s));
    if (Number.isFinite(px) && Number.isFinite(py)) { d.circle(px, py, 13, { fill: alpha(L.col, 0.25) }); d.circle(px, py, 7, { fill: L.col, glow: L.col }); const lab = L.label(s); if (lab) d.text(lab, clamp(px, x0 + 60, x0 + w - 60), py - 20 < y0 + 20 ? py + 34 : py - 20, { size: 17, weight: 700, color: L.col, align: 'center' }); }
  }
  g.restore();
  // legend, top left inside the plot
  let ly = y0 + 10;
  legend.forEach(([t, c]) => { d.line([[x0 + 12, ly + 10], [x0 + 34, ly + 10]], { color: c, width: 4 }); ly += d.wrap(t, x0 + 42, ly, w - 56, { size: 16, lines: 2 }) + 4; });
  return { X, Y };
}

function drawBars(d, L, rect, s) {
  const [x0, y0, w, h] = rect, n = L.bars.length, gap = Math.min(28, w / n / 4), bw = (w - gap * (n + 1)) / n, top = L.max(s) || 1;
  const lh = d.lineH(16), base = y0 + h - lh * 1.6;
  d.line([[x0, base], [x0 + w, base]], { color: C.line2, width: 2 });
  L.bars.forEach((b, i) => {
    const v = b.v(s), bh = clamp(v / top, 0, 1.05) * (base - y0 - lh * 1.4), x = x0 + gap + i * (bw + gap);
    d.box(x, base - bh, bw, bh, { fill: b.col, r: 6, glow: alpha(b.col, 0.6) });
    d.text(`${fmt(v)}${L.unit ? ` ${L.unit}` : ''}`, x + bw / 2, base - bh - 8, { size: 17, weight: 700, color: C.text, align: 'center', max: bw + gap });
    d.text(b.label(s), x + bw / 2, base + lh * 1.1, { size: 16, color: C.muted, align: 'center', max: bw + gap });
  });
}

// the areas of one picture: plot, bars and shapes share the box, side by side or stacked
function areas(S, box, upright) {
  const kinds = new Set(S.layers.map((L) => L.kind)), parts = [];
  if (kinds.has('shapes')) parts.push('shapes');
  if (kinds.has('bars')) parts.push('bars');
  if (S.plot) parts.push('plot');
  const ro = S.layers.filter((L) => L.kind === 'readout').length;
  const [x, y, w, h0] = box, h = h0 - ro * (w < 520 ? 52 : 34);
  const out = { readout: [x, y + h + 4, w, ro * 34] };
  const stack = upright || w < 520 ? 'v' : 'h', k = parts.length || 1;
  parts.forEach((p, i) => {
    const pad = p === 'plot' ? [52, 30, 14, 58] : [0, 0, 0, 0]; // left, top, right, bottom
    const r = stack === 'h' ? [x + (w / k) * i, y, w / k - (i < k - 1 ? 16 : 0), h] : [x, y + (h / k) * i, w, h / k - (i < k - 1 ? 12 : 0)];
    out[p] = [r[0] + pad[0], r[1] + pad[1], r[2] - pad[0] - pad[2], r[3] - pad[1] - pad[3]];
  });
  return out;
}

function drawScene(d, S, box, s, upright, glow) {
  const A = areas(S, box, upright);
  let plotMap = null;
  if (A.shapes) for (const L of S.layers) if (L.kind === 'shapes') d.shapes(L.list, A.shapes, s, { num: S.shapeNum, tpl: S.shapeTpl });
  if (A.bars) for (const L of S.layers) if (L.kind === 'bars') drawBars(d, L, A.bars, s);
  if (A.plot) plotMap = drawPlot(d, S, A.plot, s, glow);
  const ro = S.layers.filter((L) => L.kind === 'readout');
  // a readout wraps to two lines rather than being cut
  ro.forEach((L, i) => d.wrap(L.text(s), A.readout[0], A.readout[1] + 6 + i * 34, A.readout[2], { size: 20, weight: 700, color: C.gold, align: 'center', lines: 2 }));
  return { A, plotMap };
}

// lights that ease in when a region turns on, with a sound
function lights(S, ctx) {
  const glow = new Map(), was = new Map();
  const anim = animate(ctx, (dt) => { let more = false; for (const [L, k] of glow) { const nk = dt === Infinity ? 0 : Math.max(0, k - dt * 1.2); glow.set(L, nk); if (nk > 0) more = true; } anim.redraw?.(); return more; });
  return {
    glow,
    update(s, redraw) {
      anim.redraw = redraw;
      for (const L of S.layers) if (L.kind === 'region') { const on = !!L.when(s); if (on && !was.get(L)) { glow.set(L, 1); sfx.chime?.(); anim.kick(); } was.set(L, on); }
    },
  };
}

const ranges = (data) => Object.fromEntries((data.controls || []).map((c) => [c.id, c.options ? { min: Math.min(...c.options.map((o) => +o[0])), max: Math.max(...c.options.map((o) => +o[0])), step: 1 } : { min: c.min, max: c.max, step: c.step }]));

export function sliderReveal(ctx, data, whens = ctx.station?.when) {
  const S = compileScene(data);
  const t = tasks(ctx, whens || [], ranges(data));
  const extra = [];
  let L = null, ctl = null;
  const view = stage(ctx, { wide: data.wide || [780, 500], tall: data.tall || [480, 640], caption: data.caption || '', fluid: true }, (d, pane) => {
    const s = S.scope(ctl ? ctl.v : {});
    L?.update(s, () => view.redraw());
    d.clear();
    const pad = pane.upright ? 14 : 20;
    const r = drawScene(d, S, [pad, pad, pane.W - pad * 2, pane.H - pad * 2], s, pane.upright, L?.glow || new Map());
    extra.forEach((f) => f(d, s, r));
  });
  L = lights(S, ctx);
  ctl = sliders(ctx, data.controls || [], (id, x) => { t.value(id, x).check(); view.redraw(); });
  // the tip on a plot: the value of the first curve under the pointer
  view.pane.tip((x) => {
    const r = drawSceneAreas(S, view.pane), c = S.layers.find((l) => l.kind === 'curve');
    if (!r.plot || !c) return null;
    const [x0, , w] = r.plot; if (x < x0 || x > x0 + w) return null;
    const xv = S.plot.x.min + ((x - x0) / w) * (S.plot.x.max - S.plot.x.min), yv = c.f({ ...S.scope(ctl.v), x: xv });
    return `${S.plot.x.label || 'x'}: <b>${fmt(xv)}</b><br>${S.plot.y.label || 'y'}: <b>${fmt(yv)}</b>`;
  });
  ctx.hint?.((k) => hintControl(t.whens[k], ctl));
  return (ctx.stage.__ready = { kind: 'slider-reveal', pane: view.pane, d: view.d, v: ctl.v, el: ctl.el, t, redraw: view.redraw, over: (f) => { extra.push(f); view.redraw(); } });
}
const drawSceneAreas = (S, pane) => { const pad = pane.upright ? 14 : 20; return areas(S, [pad, pad, pane.W - pad * 2, pane.H - pad * 2], pane.upright); };

// where to act for a condition on a control: that control's element
export function hintControl(w, ctl) {
  const c = w && Object.values(w)[0], id = c?.control || (Array.isArray(c) ? null : null);
  if (id && ctl.el[id]) return ctl.el[id];
  if (w?.all || w?.any) return hintControl((w.all || w.any)[0], ctl);
  return Object.values(ctl.el);
}

export function compare(ctx, data, whens = ctx.station?.when) {
  const S = compileScene(data);
  const t = tasks(ctx, whens || [], ranges(data));
  const cases = data.cases, diff = data.diff ? { f: compile(String(data.diff.value), S.names), label: template(data.diff.label || '', S.names), unit: data.diff.unit || '', dec: data.diff.decimals } : null;
  const extra = [], G = [new Map(), new Map()];
  let ctl = null, shown = [0, 0];
  const anim = animate(ctx, (dt) => {
    let more = false;
    scopes().forEach((sc, i) => { const target = diff ? diff.f(sc) : 0, nv = dt === Infinity ? target : lerp(shown[i], target, 1 - Math.exp(-12 * dt)); const moving = Math.abs(nv - target) > Math.abs(target) * 1e-3 + 1e-9; shown[i] = moving ? nv : target; more ||= moving; });
    view.redraw(); return more;
  });
  const scopes = () => cases.map((c) => S.scope({ ...(ctl ? ctl.v : {}), ...c.vars }));
  const view = stage(ctx, { wide: data.wide || [820, 500], tall: data.tall || [480, 700], caption: data.caption || '', fluid: true }, (d, pane) => {
    d.clear();
    const up = pane.upright, pad = up ? 12 : 18, dh = diff ? (up ? 120 : 112) : 0;
    const s = scopes(), W = pane.W - pad * 2, H = pane.H - pad * 2 - dh;
    const boxes = up ? [[pad, pad, W, H / 2 - 8], [pad, pad + H / 2 + 8, W, H / 2 - 8]] : [[pad, pad, W / 2 - 10, H], [pad + W / 2 + 10, pad, W / 2 - 10, H]];
    const res = boxes.map((b, i) => {
      d.box(b[0], b[1], b[2], b[3], { fill: '#0f141d', stroke: C.line, r: 14 });
      d.text(template(cases[i].label, S.names)(s[i]), b[0] + 16, b[1] + d.lineH(19) * 0.95, { size: 19, weight: 700, color: i ? C.gold : C.acc, max: b[2] - 32 });
      const inner = [b[0] + 10, b[1] + d.lineH(19) * 1.4, b[2] - 20, b[3] - d.lineH(19) * 1.4 - 10];
      // each case stays inside its own panel
      d.g.save(); d.path(b[0] + 2, b[1] + 2, b[2] - 4, b[3] - 4, 12); d.g.clip();
      const r = drawScene(d, S, inner, s[i], true, G[i]);
      d.g.restore();
      return r;
    });
    if (diff) drawDiff(d, diff, s, shown, [pad, pane.H - pad - dh + 10, W, dh - 10], cases);
    extra.forEach((f) => f(d, s, res));
  });
  ctl = sliders(ctx, data.controls || [], (id, x) => { t.value(id, x).check(); anim.kick(); view.redraw(); });
  shown = scopes().map((sc) => (diff ? diff.f(sc) : 0));
  ctx.hint?.((k) => hintControl(t.whens[k], ctl));
  return (ctx.stage.__ready = { kind: 'compare', pane: view.pane, d: view.d, v: ctl.v, el: ctl.el, t, redraw: view.redraw, over: (f) => { extra.push(f); view.redraw(); } });
}

// the measured difference: two bars on one scale, and the ratio between them, lit when large
function drawDiff(d, diff, s, shown, [x, y, w, h], cases) {
  const vals = s.map((sc) => diff.f(sc)), top = Math.max(1e-9, ...shown.map(Math.abs), ...vals.map(Math.abs));
  const lab = diff.label(s[0]), lh = d.lineH(17);
  d.box(x, y, w, h, { fill: C.panel, stroke: C.line, r: 12 });
  const ratio = vals[0] ? vals[1] / vals[0] : Infinity, big = Number.isFinite(ratio) && (ratio >= 1.5 || ratio <= 1 / 1.5);
  const rtxt = !Number.isFinite(ratio) ? '' : ratio >= 1 ? `${fmt(ratio, ratio < 10 ? 1 : 0)}×` : `÷${fmt(1 / ratio, 1 / ratio < 10 ? 1 : 0)}`;
  const rw = Math.max(90, d.measure(rtxt, 30, 800) + 24), bx = x + 14, bwid = w - 28 - rw - 14;
  d.text(lab, bx, y + lh * 0.95, { size: 17, weight: 600, color: C.muted, max: bwid });
  const rowH = (h - lh * 1.3 - 10) / 2;
  shown.forEach((v, i) => {
    const by = y + lh * 1.3 + i * rowH, bh = Math.max(10, rowH - 10), len = Math.max(2, (Math.abs(v) / top) * (bwid * 0.62));
    d.box(bx, by, len, bh, { fill: i ? C.gold : C.acc, r: 5 });
    d.text(`${fmt(vals[i], diff.dec)}${diff.unit ? ` ${diff.unit}` : ''}`, bx + len + 8, by + bh / 2 + 6, { size: 17, weight: 700, color: C.text, max: bwid - len - 8 });
  });
  if (rtxt) {
    d.box(x + w - rw - 14, y + 12, rw, h - 24, { fill: big ? alpha(C.gold, 0.16) : C.card, stroke: big ? C.gold : C.line, r: 12, glow: big ? alpha(C.gold, 0.7) : null });
    d.text(rtxt, x + w - 14 - rw / 2, y + h / 2 + 4, { size: 30, weight: 800, color: big ? C.gold : C.text, align: 'center', base: 'middle', max: rw - 10 });
    const cap = `${cases[1].short || 'B'} ÷ ${cases[0].short || 'A'}`;
    if (d.measure(cap, 16) <= rw - 10) d.text(cap, x + w - 14 - rw / 2, y + h - 20, { size: 16, color: C.muted, align: 'center' });
  }
}
