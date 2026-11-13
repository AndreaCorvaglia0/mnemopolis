// The story's second visual register (docs/STORY.md, "Two registers"): the cinematic moments and the
// first-person close-ups are ILLUSTRATED, painted in code on a high-resolution canvas (smooth paths,
// gradients, soft light, a fine grain and a vignette), while the playable town and rooms stay pixel
// art, like a game whose cutscenes are painted stills. Same palette as the pixel night: the blues,
// the lamp's gold, the teal accent.
//
//   const v = view(parent, painter, params)   a full-screen painted scene, device-pixel-ratio aware
//     painter = { base(g, W, H, P) once per size (cached), live(g, W, H, t, P) every frame, focus: [x, y] }
//     v.set({ ...params }) changes the parameters (base repainted when painter.baseKeys change)
//     v.stop()
// Everything is drawn in code: no image files. Static layers are painted once into offscreen canvases.
import { h } from '../../lab/shell.js';
import { reducedMotion } from './cinema.js';

// ---- the palette of the night, shared with the pixel town (art/palette.js)
export const C = {
  ink: '#0a0c14', night: '#0b1020', deep: '#101830', dusk: '#1d2a40', mist: '#33405c', fog: '#56627c',
  lamp: '#ffd77a', lampHot: '#fff1c4', warm: '#ffb35c', teal: '#2a8c87', tealDeep: '#1d6764',
  red: '#8c3129', paper: '#efe6cf', paperShade: '#d8ccaa', ink2: '#24305e', sepia: '#6b5230',
};

export const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; return [c, g]; };
export const rnd = (seed) => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
export const lerp = (a, b, t) => a + (b - a) * t;

// gradients
export function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); for (const [t, c] of stops) gr.addColorStop(t, c); return gr; }
export function rad(g, x, y, r0, r1, stops, x1 = x, y1 = y) { const gr = g.createRadialGradient(x, y, r0, x1, y1, r1); for (const [t, c] of stops) gr.addColorStop(t, c); return gr; }
// a soft light, additive
export function glow(g, x, y, r, color, a = 1, comp = 'lighter') {
  if (a <= 0.003 || r <= 0) return;
  g.save(); g.globalCompositeOperation = comp; g.globalAlpha = Math.min(1, a);
  g.fillStyle = rad(g, x, y, 0, r, [[0, color], [1, hexA(color, 0)]]);
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore();
}
export function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
export function mixHex(a, b, t) { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const ch = (s) => Math.round(lerp((A >> s) & 255, (B >> s) & 255, t)); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; }

// a blur that works everywhere: down to a small canvas and back (smooth), instead of ctx.filter
export function soften(src, k = 6) {
  const w = src.width, hh = src.height, [s, sg] = canvas(w / k, hh / k); sg.drawImage(src, 0, 0, s.width, s.height);
  const [o, og] = canvas(w, hh); og.drawImage(s, 0, 0, w, hh); return o;
}
// a path from points with smooth curves through them (Catmull-Rom as Béziers)
export function smooth(g, pts, close = false) {
  const n = pts.length, P = (i) => pts[close ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < (close ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (close) g.closePath();
}
// clouds, mist: many soft blobs painted on a small canvas, then scaled up (soft by construction)
export function blobs(w, hh, n, color, { seed = 1, rx = [0.08, 0.25], ry = [0.03, 0.08], y = [0, 1], a = [0.2, 0.6], k = 8 } = {}) {
  const [c, g] = canvas(w / k, hh / k), r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const X = r() * c.width, Y = lerp(y[0], y[1], r()) * c.height, RX = lerp(rx[0], rx[1], r()) * c.width, RY = lerp(ry[0], ry[1], r()) * c.height;
    g.globalAlpha = lerp(a[0], a[1], r()); g.fillStyle = rad(g, X, Y, 0, Math.max(RX, RY), [[0, color], [1, hexA(color.startsWith('#') ? color : '#000000', 0)]]);
    g.save(); g.translate(X, Y); g.scale(1, RY / RX); g.beginPath(); g.arc(0, 0, RX, 0, Math.PI * 2); g.restore(); g.fill();
  }
  const [o, og] = canvas(w, hh); og.drawImage(c, 0, 0, w, hh); return o;
}

// ---- the finish: a fine grain and a vignette (the grain tile is made once)
let grainTile = null;
function grainOf() {
  if (grainTile) return grainTile;
  const [c, g] = canvas(256, 256), img = g.createImageData(256, 256), r = rnd(9);
  for (let i = 0; i < img.data.length; i += 4) { const v = 110 + r() * 145; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0); grainTile = c; return c;
}
export function grain(g, W, H, a = 0.07, t = 0) {
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = a;
  const p = g.createPattern(grainOf(), 'repeat'), ox = Math.floor((t * 97) % 256), oy = Math.floor((t * 61) % 256);
  g.translate(-ox, -oy); g.fillStyle = p; g.fillRect(0, 0, W + 256, H + 256); g.restore();
}
export function vignette(g, W, H, a = 0.55) {
  g.save(); g.fillStyle = rad(g, W / 2, H / 2, Math.min(W, H) * 0.35, Math.hypot(W, H) * 0.62, [[0, 'rgba(0,0,0,0)'], [1, `rgba(0,0,0,${a})`]]); g.fillRect(0, 0, W, H); g.restore();
}
// rain: soft slanted lines, cheap (a few hundred strokes a frame)
export function rain(g, W, H, t, amount = 1, seed = 3, color = '200,212,235') {
  if (amount <= 0.01) return;
  const r = rnd(seed), n = Math.round((W * H) / 9000 * amount), sc = Math.max(1, H / 900);
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const depth = r(), L = (18 + depth * 34) * sc, sp = (900 + depth * 1300) * sc, x0 = r() * (W + 200), y0 = r() * (H + L);
    const y = ((y0 + t * sp) % (H + L)) - L, x = ((x0 - (y + L) * 0.22) % (W + 200) + W + 200) % (W + 200) - 100;
    g.strokeStyle = `rgba(${color},${(0.08 + depth * 0.22) * Math.min(1, amount * 1.2)})`; g.lineWidth = (0.6 + depth * 1.1) * sc;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - L * 0.22, y + L); g.stroke();
  }
  g.restore();
}

// handwriting: a script face where the system has one, slanted and a little uneven where it has not
export const HAND = '"Segoe Script","Bradley Hand","Snell Roundhand","Apple Chancery","Lucida Handwriting","URW Chancery L","Z003",cursive';
export const SERIF = 'Georgia,"Times New Roman","DejaVu Serif",serif';
// writes `text` wrapped to width at (x, y); reveal 0..1 shows it letter by letter; returns the bottom y
export function handwrite(g, text, x, y, width, size, { color = '#26305c', reveal = 1, seed = 5, lineH = 1.45 } = {}) {
  const r = rnd(seed);
  g.save(); g.font = `${size}px ${HAND}`; g.fillStyle = color; g.textBaseline = 'alphabetic';
  const words = String(text).split(/\s+/), lines = []; let line = '';
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (g.measureText(t).width > width && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  const total = lines.join('').length; let shown = Math.floor(total * reveal), yy = y;
  for (const l of lines) {
    let xx = x;
    for (const ch of l) {
      if (shown-- <= 0) break;
      const w = g.measureText(ch).width;
      g.save(); g.translate(xx, yy + (r() - 0.5) * size * 0.06); g.rotate((r() - 0.5) * 0.06 - 0.03); g.globalAlpha = 0.82 + r() * 0.18; g.fillText(ch, 0, 0); g.restore();
      xx += w * (0.98 + r() * 0.04);
    }
    yy += size * lineH;
  }
  g.restore();
  return yy;
}

// paper: warm, a little uneven, darker at the edges
export function paper(g, x, y, w, hh, { color = C.paper, seed = 2, ruled = false, edge = 0.25 } = {}) {
  g.save();
  g.fillStyle = color; g.fillRect(x, y, w, hh);
  const r = rnd(seed);
  for (let i = 0; i < 40; i++) { g.globalAlpha = 0.05; g.fillStyle = r() < 0.5 ? '#b9a67a' : '#fffaf0'; g.beginPath(); g.ellipse(x + r() * w, y + r() * hh, 20 + r() * w * 0.2, 10 + r() * hh * 0.1, r() * 3, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1;
  if (ruled) { g.strokeStyle = 'rgba(120,150,190,0.35)'; g.lineWidth = Math.max(1, hh / 700); for (let yy = y + hh * 0.12; yy < y + hh * 0.96; yy += hh * 0.062) { g.beginPath(); g.moveTo(x + w * 0.04, yy); g.lineTo(x + w * 0.97, yy); g.stroke(); } }
  g.fillStyle = rad(g, x + w / 2, y + hh / 2, Math.min(w, hh) * 0.3, Math.hypot(w, hh) * 0.6, [[0, 'rgba(0,0,0,0)'], [1, `rgba(90,60,20,${edge})`]]); g.fillRect(x, y, w, hh);
  g.restore();
}
// a drop shadow under a rectangle-ish object on a table
export function shadowRect(g, x, y, w, hh, blur, a = 0.5, dx = 8, dy = 12) {
  g.save(); g.shadowColor = `rgba(0,0,0,${a})`; g.shadowBlur = blur; g.shadowOffsetX = dx; g.shadowOffsetY = dy; g.fillStyle = 'rgba(0,0,0,1)'; g.fillRect(x, y, w, hh); g.restore();
}
// the dark table of the close-ups, lit by a lamp at the upper left
export function table(g, W, H, { seed = 4, lamp = [0.12, 0.05] } = {}) {
  g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#2a1d16'], [1, '#160f0c']]); g.fillRect(0, 0, W, H);
  const r = rnd(seed);
  g.save(); g.globalAlpha = 0.25;
  for (let y = 0; y < H; y += H / 7) { g.fillStyle = r() < 0.5 ? '#3a281c' : '#24180f'; g.fillRect(0, y, W, H / 7 - 2); g.fillStyle = '#0c0806'; g.fillRect(0, y + H / 7 - 2, W, 2); }
  g.globalAlpha = 0.08; g.strokeStyle = '#5a3f2a';
  for (let i = 0; i < 120; i++) { const y = r() * H; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + (r() - 0.5) * 20, W * 0.6, y + (r() - 0.5) * 20, W, y + (r() - 0.5) * 10); g.stroke(); }
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = rad(g, W * lamp[0], H * lamp[1], 0, Math.hypot(W, H) * 0.8, [[0, 'rgba(255,190,110,0.35)'], [0.5, 'rgba(255,170,90,0.08)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, W, H);
  g.restore();
}

// ---- the view: a full-screen painted scene behind the cinema's bars
export function view(parent, painter, params = {}) {
  const cv = h('canvas', { 'aria-hidden': 'true' });
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;display:block;background:#05060a';
  parent.prepend(cv);
  const reduced = reducedMotion();
  let P = { ...params }, W = 0, H = 0, base = null, baseKey = '', raf = 0, alive = true, t0 = performance.now();
  const g = cv.getContext('2d');
  const size = () => {
    const d = Math.min(2, window.devicePixelRatio || 1), w = Math.round(cv.clientWidth * d), hh = Math.round(cv.clientHeight * d);
    if (w !== W || hh !== H) { W = cv.width = w; H = cv.height = hh; baseKey = ''; }
  };
  const keyOf = () => JSON.stringify((painter.baseKeys || []).map((k) => P[k])) + `${W}x${H}`;
  const frame = (now) => {
    if (!alive) return;
    size();
    const t = reduced ? 0 : (now - t0) / 1000;
    if (keyOf() !== baseKey) { baseKey = keyOf(); const [b, bg] = canvas(W, H); painter.base(bg, W, H, P); base = b; }
    g.save();
    const push = reduced ? 1 : 1 + Math.min(1, t / (P.pushTime || 26)) * (P.push ?? 0.05), [fx, fy] = painter.focus?.(W, H, P) || [W / 2, H / 2];
    g.translate(fx, fy); g.scale(push, push); g.translate(-fx, -fy);
    g.drawImage(base, 0, 0);
    painter.live?.(g, W, H, t, P);
    g.restore();
    painter.over?.(g, W, H, t, P); // not pushed in: rain on the lens, light flashes
    grain(g, W, H, 0.06, reduced ? 0 : Math.floor(t * 12));
    vignette(g, W, H, P.vignette ?? 0.6);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return {
    el: cv,
    set(p) { Object.assign(P, p); },
    get params() { return P; },
    fade(key, to, ms) { // a parameter glides
      const from = P[key] ?? 0, s = performance.now();
      if (reduced || ms <= 0) { P[key] = to; return Promise.resolve(); }
      return new Promise((res) => { const step = (n) => { const k = Math.min(1, (n - s) / ms); P[key] = from + (to - from) * (k * k * (3 - 2 * k)); if (k < 1 && alive) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
    },
    stop() { alive = false; cancelAnimationFrame(raf); cv.remove(); },
  };
}
