// Drawing helpers for lab stations: the frame's colours, text that scales and wraps, rounded
// boxes, arrows, glows, and a picture made of simple declarative shapes. All sizes are in the
// pane's units (canvasPane), all text goes through pane.font (never below 16 screen pixels).
//
//   const d = ink(pane);
//   d.clear();                                            // the stage colour
//   d.box(x, y, w, h, { fill: C.card, stroke: C.line, r: 12, glow: C.acc });
//   d.text('Wavelength', x, y, { size: 20, weight: 600, color: C.muted, align: 'center', max: 200 });
//   const hgt = d.wrap('A long sentence...', x, y, 260, { size: 18 });   // returns the height used
//   d.circle(x, y, r, { fill, stroke, width }); d.line([[x1, y1], [x2, y2]], { color, width, dash });
//   d.arrow(x1, y1, x2, y2, { color, width, head });
//   d.emoji('🔔', x, y, size);
//   d.shapes(list, box, vars)                             // a declarative picture (see SHAPES below)

// the colours of the lab frame (lab/style.js), and a few for series
export const C = {
  bg: '#0d1016', stage: '#080a0f', panel: '#131821', card: '#192030', card2: '#202a3d', line: '#263041', line2: '#3a4659',
  text: '#e8eaf0', muted: '#b0b8c9', dim: '#7d879b', acc: '#4fd1c5', accInk: '#04201d', gold: '#ffcf5a', ok: '#7ddc8a', bad: '#ff7a6b', blue: '#6f93e0', purple: '#c38cf0', orange: '#ffa25a',
};
// named colours a course may use in data: these names, or "#rgb" / "#rrggbb"
export const NAMED = { accent: C.acc, teal: C.acc, gold: C.gold, yellow: C.gold, green: C.ok, red: C.bad, blue: C.blue, purple: C.purple, orange: C.orange, text: C.text, white: '#ffffff', muted: C.muted, grey: C.dim, gray: C.dim, dark: C.card, black: '#000000' };
export const SERIES = [C.acc, C.gold, C.bad, C.blue, C.purple, C.ok, C.orange];
export const color = (c, k = 0) => (typeof c === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) ? c : NAMED[c] || SERIES[k % SERIES.length]);
export const isColor = (c) => typeof c === 'string' && (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) || Object.hasOwn(NAMED, c));
// "#rrggbb" + alpha 0..1 -> rgba()
export function alpha(hex, a) {
  let h = color(hex).slice(1); if (h.length === 3) h = [...h].map((x) => x + x).join('');
  const n = parseInt(h, 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
// mix two colours, t in 0..1
export function mixColor(a, b, t) {
  const p = (c) => { let h = color(c).slice(1); if (h.length === 3) h = [...h].map((x) => x + x).join(''); const n = parseInt(h, 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const x = p(a), y = p(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * Math.max(0, Math.min(1, t)))).join(',')})`;
}
export const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export function ink(pane) {
  const g = pane.g;
  const font = (size = 18, weight = 400) => pane.font(size, weight);
  const d = {
    g, pane, C,
    clear(fill = C.stage) { g.globalAlpha = 1; g.shadowBlur = 0; g.setLineDash?.([]); g.globalCompositeOperation = 'source-over'; g.fillStyle = fill; g.fillRect(0, 0, pane.W, pane.H); },
    path(x, y, w, h, r = 10) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); else g.rect(x, y, w, h); },
    box(x, y, w, h, { fill = C.card, stroke = null, width = 2, r = 12, glow = null, glowSize = 18, alpha: a = 1 } = {}) {
      g.save(); g.globalAlpha = a;
      if (glow) { g.shadowColor = glow; g.shadowBlur = glowSize; }
      d.path(x, y, w, h, r);
      if (fill) { g.fillStyle = fill; g.fill(); }
      g.shadowBlur = 0;
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(); }
      g.restore();
    },
    circle(x, y, r, { fill = null, stroke = null, width = 2, glow = null, glowSize = 20, alpha: a = 1 } = {}) {
      g.save(); g.globalAlpha = a; if (glow) { g.shadowColor = glow; g.shadowBlur = glowSize; }
      g.beginPath(); g.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
      if (fill) { g.fillStyle = fill; g.fill(); }
      g.shadowBlur = 0; if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(); }
      g.restore();
    },
    line(pts, { color: c = C.line2, width = 2, dash = null, cap = 'round', alpha: a = 1, glow = null } = {}) {
      if (pts.length < 2) return;
      g.save(); g.globalAlpha = a; g.strokeStyle = c; g.lineWidth = width; g.lineCap = cap; g.lineJoin = 'round'; if (dash) g.setLineDash(dash); if (glow) { g.shadowColor = glow; g.shadowBlur = 14; }
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore();
    },
    arrow(x1, y1, x2, y2, { color: c = C.muted, width = 3, head = 12, dash = null, alpha: a = 1 } = {}) {
      const ang = Math.atan2(y2 - y1, x2 - x1), hx = x2 - Math.cos(ang) * head * 0.6, hy = y2 - Math.sin(ang) * head * 0.6;
      d.line([[x1, y1], [hx, hy]], { color: c, width, dash, alpha: a });
      g.save(); g.globalAlpha = a; g.fillStyle = c; g.beginPath(); g.moveTo(x2, y2);
      g.lineTo(x2 - Math.cos(ang - 0.45) * head, y2 - Math.sin(ang - 0.45) * head); g.lineTo(x2 - Math.cos(ang + 0.45) * head, y2 - Math.sin(ang + 0.45) * head); g.closePath(); g.fill(); g.restore();
    },
    // one line of text; `max` shrinks it to fit a width (never below 16 screen pixels: then it is cut with …)
    text(s, x, y, { size = 18, weight = 400, color: c = C.text, align = 'left', base = 'alphabetic', max = null, alpha: a = 1 } = {}) {
      s = String(s ?? '');
      g.save(); g.globalAlpha = a; g.fillStyle = c; g.textAlign = align; g.textBaseline = base;
      let sz = size; g.font = font(sz, weight);
      if (max) { while (sz > 10 && g.measureText(s).width > max) { sz -= 1; g.font = font(sz, weight); } if (g.measureText(s).width > max) { while (s.length > 1 && g.measureText(`${s}…`).width > max) s = s.slice(0, -1); s += '…'; } }
      g.fillText(s, x, y); const w = g.measureText(s).width; g.restore(); return w;
    },
    measure(s, size = 18, weight = 400) { g.save(); g.font = font(size, weight); const w = g.measureText(String(s)).width; g.restore(); return w; },
    // the real height of a line of text of `size` units (it may be larger than size on a small screen)
    lineH: (size = 18) => Math.max(size, 16 / pane.scale) * 1.25,
    // wrapped text inside a width; returns the height used. `lines` caps the number of lines.
    wrap(s, x, y, w, { size = 18, weight = 400, color: c = C.text, align = 'left', lines = 99, alpha: a = 1, measure = false } = {}) {
      const words = String(s ?? '').split(/\s+/).filter(Boolean), out = [];
      g.save(); g.font = font(size, weight);
      let cur = '';
      for (const wd of words) { const t = cur ? `${cur} ${wd}` : wd; if (g.measureText(t).width > w && cur) { out.push(cur); cur = wd; } else cur = t; }
      if (cur) out.push(cur);
      if (out.length > lines) { out.length = lines; let l = out[lines - 1]; while (l.length > 1 && g.measureText(`${l}…`).width > w) l = l.slice(0, -1); out[lines - 1] = `${l}…`; }
      const lh = d.lineH(size);
      if (!measure) { g.globalAlpha = a; g.fillStyle = c; g.textAlign = align; g.textBaseline = 'top'; const ax = align === 'center' ? x + w / 2 : align === 'right' ? x + w : x; out.forEach((l, i) => g.fillText(l, ax, y + i * lh)); }
      g.restore();
      return out.length * lh;
    },
    emoji(e, x, y, size = 40, { alpha: a = 1 } = {}) { g.save(); g.globalAlpha = a; g.font = `${Math.max(size, 16 / pane.scale)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, x, y); g.restore(); },
    // a declarative picture: see SHAPES
    shapes: (list, box, vars = {}, opts = {}) => drawShapes(d, list, box, vars, opts),
  };
  return d;
}

// ---- declarative pictures ----
// A list of shapes in a 0..100 box (x to the right, y down). Positions are shares of the box;
// sizes (r, size, width) are shares of its smaller side, so circles stay round on any screen.
// Any number may be an expression of the variables in scope (patterns/expr.js), as a string.
//   { "rect": [x, y, w, h], "color": "accent", "round": 3 }
//   { "circle": [x, y, r], "color": "#ff0", "outline": true }
//   { "line": [[x1, y1], [x2, y2], ...], "color": "muted", "width": 0.6, "dash": true }
//   { "arrow": [[x1, y1], [x2, y2]], "color": "gold" }
//   { "text": "Pitch {f} Hz", "at": [x, y], "size": 5, "align": "center", "color": "text" }
//   { "emoji": "🔔", "at": [x, y], "size": 12 }
// Common: "opacity" (0..1), "show" (shown when the expression is not 0), "glow": true,
// "part": "<id>" (a pattern may light the part up). Colours: names (accent, gold, red, green,
// blue, purple, orange, text, muted, grey, white, black, dark) or "#rrggbb".
export const SHAPE_KINDS = ['rect', 'circle', 'line', 'arrow', 'text', 'emoji'];
export const SHAPE_KEYS = ['color', 'opacity', 'show', 'glow', 'part', 'round', 'outline', 'width', 'dash', 'size', 'align', 'at', 'weight'];

export function drawShapes(d, list, box, vars = {}, { num = defaultNum, lit = null, tpl = (s) => s } = {}) {
  const [bx, by, bw, bh] = box, u = Math.min(bw, bh) / 100;
  const X = (v) => bx + (num(v, vars) / 100) * bw, Y = (v) => by + (num(v, vars) / 100) * bh, S = (v) => num(v, vars) * u;
  for (const sh of list || []) {
    if (sh.show != null && !num(sh.show, vars)) continue;
    const kind = SHAPE_KINDS.find((k) => sh[k] != null), on = lit && sh.part && lit(sh.part);
    const op = sh.opacity != null ? clamp(num(sh.opacity, vars), 0, 1) : 1, col = color(sh.color || (kind === 'text' ? 'text' : 'accent'));
    const glow = sh.glow || on ? (on ? C.gold : col) : null;
    if (op <= 0) continue;
    if (kind === 'rect') { const [x, y, w, h] = sh.rect; const o = { r: S(sh.round ?? 1.5), alpha: op, glow, fill: sh.outline ? null : col, stroke: sh.outline || on ? (on ? C.gold : col) : null, width: S(sh.width ?? 0.6) }; d.box(X(x), Y(y), (num(w, vars) / 100) * bw, (num(h, vars) / 100) * bh, o); }
    else if (kind === 'circle') { const [x, y, r] = sh.circle; d.circle(X(x), Y(y), S(r), { fill: sh.outline ? null : col, stroke: sh.outline || on ? (on ? C.gold : col) : null, width: S(sh.width ?? 0.6), alpha: op, glow }); }
    else if (kind === 'line' || kind === 'arrow') {
      const pts = sh[kind].map(([x, y]) => [X(x), Y(y)]);
      if (kind === 'line') d.line(pts, { color: on ? C.gold : col, width: S(sh.width ?? 0.6), dash: sh.dash ? [S(2), S(1.5)] : null, alpha: op, glow });
      else d.arrow(...pts[0], ...pts[pts.length - 1], { color: on ? C.gold : col, width: S(sh.width ?? 0.7), head: S(3.5), dash: sh.dash ? [S(2), S(1.5)] : null, alpha: op });
    } else if (kind === 'text') { const [x, y] = sh.at || [50, 50]; d.text(tpl(sh.text, vars), X(x), Y(y), { size: S(sh.size ?? 5), weight: sh.weight ?? 600, color: on ? C.gold : col, align: sh.align || 'center', base: 'middle', alpha: op }); }
    else if (kind === 'emoji') { const [x, y] = sh.at || [50, 50]; d.emoji(sh.emoji, X(x), Y(y), S(sh.size ?? 12), { alpha: op }); }
  }
}
const defaultNum = (v) => (typeof v === 'number' ? v : parseFloat(v) || 0);
