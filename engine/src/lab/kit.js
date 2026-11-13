// Small building blocks for lab stations. Keep stations short: one canvas, one or two controls.
import { h } from './shell.js';
import { sfx } from '../systems/audio.js';

// A canvas that fills the stage. The station draws in its own units (w x hgt); the pane scales
// that box to the largest size that fits the stage, keeps its proportions, centres it, and lets
// the stage's own background show around it. The canvas is drawn at the real screen resolution
// (device pixels), so lines and text stay sharp at any size, and it follows window changes.
//
//   const pane = canvasPane(ctx.stage, 720, 480, 'caption', { portrait: [480, 600] });
//   pane.onResize(draw);              // redraw after a resize (the canvas is cleared by one)
//   pane.W, pane.H                    // the box in use: (w, hgt), or the portrait box when the stage is not wide
//   pane.upright                      // true while the portrait box is in use
//   pane.font(18, 600)                // a CSS font of 18 units, never smaller than 16 screen pixels
//   pane.drag(fn) / pane.hover(fn)    // fn(x, y, phase) in your units; phase 'down' | 'move' | 'up'
//   pane.tip(fn)                      // fn(x, y) returns html or null: a read-out next to the pointer or finger
//
// Pixel calls (getImageData, putImageData) take and give your units, as before. Old stations
// that never call onResize keep working: after a resize the pane rescales the last picture.
export function canvasPane(stage, w, hgt, caption = '', opts = {}) {
  const cv = h('canvas', { class: 'fit', tabindex: '-1' });
  const cap = h('div', { class: 'lab-cap' }, caption);
  const tipEl = h('div', { class: 'lab-tip', role: 'status', hidden: '' });
  const wrap = h('div', { class: 'lab-cv' }, cv, tipEl);
  const el = h('div', { class: 'lab-view' }, cap, wrap);
  if (!caption) cap.hidden = true;
  stage.append(el);
  const raw = cv.getContext('2d', { willReadFrequently: true });
  const pane = { el, cv, W: w, H: hgt, scale: 1 };
  let dpr = 1, s = 1, ox = 0, oy = 0, cw = 0, chh = 0, resizers = [];

  const shapeFor = (bw, bh) => (opts.portrait && bh > bw * 0.8 ? opts.portrait : [w, hgt]);
  const base = () => { raw.setTransform(s, 0, 0, s, ox, oy); raw.beginPath(); raw.rect(0, 0, pane.W, pane.H); raw.clip(); };
  // size the backing store to the element; returns true if anything changed
  const fit = () => {
    const r = wrap.getBoundingClientRect();
    const bw = Math.max(1, Math.round(r.width || w)), bh = Math.max(1, Math.round(r.height || hgt)), d = Math.min(3, window.devicePixelRatio || 1);
    const [W2, H2] = shapeFor(bw, bh);
    if (bw === cw && bh === chh && d === dpr && W2 === pane.W && H2 === pane.H && cv.width) return false;
    // keep the last picture for stations that do not redraw themselves
    let snap = null;
    if (!resizers.length && cv.width > 1) { snap = document.createElement('canvas'); snap.width = Math.max(1, Math.round(pane.W * s)); snap.height = Math.max(1, Math.round(pane.H * s)); snap.getContext('2d').drawImage(cv, ox, oy, snap.width, snap.height, 0, 0, snap.width, snap.height); }
    cw = bw; chh = bh; dpr = d; pane.W = W2; pane.H = H2; pane.upright = W2 !== w || H2 !== hgt;
    cv.width = Math.round(bw * d); cv.height = Math.round(bh * d);
    s = Math.min(cv.width / W2, cv.height / H2); ox = Math.round((cv.width - W2 * s) / 2); oy = Math.round((cv.height - H2 * s) / 2);
    pane.scale = s / d;
    base();
    if (snap) { raw.save(); raw.globalCompositeOperation = 'source-over'; raw.globalAlpha = 1; raw.drawImage(snap, 0, 0, pane.W, pane.H); raw.restore(); }
    return true;
  };

  // The context the station draws with: the real one, with the scale applied and the pixel calls
  // translated to the station's units.
  const tmp = document.createElement('canvas'), tg = tmp.getContext('2d', { willReadFrequently: true });
  const over = {
    setTransform(a, b, c, d2, e, f) { if (typeof a === 'object' && a) ({ a, b, c, d: d2, e, f } = a); raw.setTransform(s, 0, 0, s, ox, oy); raw.transform(a ?? 1, b ?? 0, c ?? 0, d2 ?? 1, e ?? 0, f ?? 0); },
    resetTransform() { raw.setTransform(s, 0, 0, s, ox, oy); },
    getImageData(x, y, iw, ih, o) {
      if (iw === 1 && ih === 1) return raw.getImageData(Math.floor(ox + (Math.floor(x) + 0.5) * s), Math.floor(oy + (Math.floor(y) + 0.5) * s), 1, 1, o);
      tmp.width = iw; tmp.height = ih; tg.imageSmoothingEnabled = true;
      tg.drawImage(cv, ox + x * s, oy + y * s, iw * s, ih * s, 0, 0, iw, ih);
      return tg.getImageData(0, 0, iw, ih, o);
    },
    putImageData(img, x, y, dx = 0, dy = 0, dw = img.width, dh = img.height) {
      tmp.width = img.width; tmp.height = img.height; tg.putImageData(img, 0, 0);
      raw.save(); raw.globalCompositeOperation = 'source-over'; raw.globalAlpha = 1; raw.filter = 'none'; raw.imageSmoothingEnabled = true;
      raw.drawImage(tmp, dx, dy, dw, dh, x + dx, y + dy, dw, dh); raw.restore();
    },
  };
  const bound = new Map();
  pane.g = new Proxy(raw, {
    get(t, p) { if (p in over) return over[p]; const v = t[p]; if (typeof v !== 'function') return v; if (!bound.has(p)) bound.set(p, v.bind(t)); return bound.get(p); },
    set(t, p, v) { t[p] = v; return true; },
  });

  // pointer position in the station's units
  const pos = (e) => { const r = cv.getBoundingClientRect(), k = cv.width / Math.max(1, r.width); return [((e.clientX - r.left) * k - ox) / s, ((e.clientY - r.top) * k - oy) / s]; };
  let down = false, onDrag = null, onHover = null, onTip = null;
  const tip = (e, x, y) => {
    const html = onTip?.(x, y);
    if (!html) { tipEl.hidden = true; return; }
    tipEl.innerHTML = html; tipEl.hidden = false;
    const r = wrap.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
    const above = e.pointerType === 'touch' ? 64 : 18; // keep it clear of the finger
    tipEl.style.left = `${Math.max(6, Math.min(r.width - tw - 6, px - tw / 2))}px`;
    tipEl.style.top = `${py - th - above < 6 ? Math.min(r.height - th - 6, py + 24) : py - th - above}px`;
  };
  cv.addEventListener('pointerdown', (e) => { down = true; try { cv.setPointerCapture(e.pointerId); } catch { /* synthetic events */ } const [x, y] = pos(e); onDrag?.(x, y, 'down'); tip(e, x, y); });
  cv.addEventListener('pointermove', (e) => { const [x, y] = pos(e); if (down) onDrag?.(x, y, 'move'); else onHover?.(x, y); tip(e, x, y); });
  const up = (e) => { if (down) { down = false; onDrag?.(...pos(e), 'up'); } if (e.pointerType === 'touch') tipEl.hidden = true; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { if (!down) tipEl.hidden = true; });

  Object.assign(pane, {
    pos,
    drag: (fn) => { onDrag = fn; },
    hover: (fn) => { onHover = fn; },
    tip: (fn) => { onTip = fn; },
    caption: (t) => { cap.textContent = t; cap.hidden = !t; },
    onResize: (fn) => { resizers.push(fn); },
    // a font of `size` units, never below 16 screen pixels
    font: (size, weight = 400) => `${weight} ${Math.max(size, 16 / pane.scale).toFixed(1)}px system-ui,-apple-system,"Segoe UI",sans-serif`,
    // `n` screen pixels in the station's units (for hairlines and hit areas)
    px: (n) => n / pane.scale,
    // where a point of the station's units is on the screen (client pixels); for tests and tours
    toScreen: (x, y) => { const r = cv.getBoundingClientRect(), k = r.width / Math.max(1, cv.width); return [r.left + (ox + x * s) * k, r.top + (oy + y * s) * k]; },
  });
  el.__pane = pane;
  fit();
  const ro = new ResizeObserver(() => { if (fit()) { tipEl.hidden = true; resizers.forEach((f) => f(pane)); } });
  ro.observe(wrap);
  // stop observing once the station is gone
  const gone = new MutationObserver(() => { if (!el.isConnected) { ro.disconnect(); gone.disconnect(); } });
  gone.observe(document.body, { childList: true, subtree: true });
  return pane;
}

// Draggable discs: returns the disc under a point, and moves it while dragged.
export function draggable(pane, items, redraw, { radius = (it) => it.r, bounds = null } = {}) {
  let cur = null, ox = 0, oy = 0;
  pane.items = items;
  const bx = () => (typeof bounds === 'function' ? bounds() : bounds);
  pane.drag((x, y, phase) => {
    // a finger is wide: grab a disc if the touch is within 12 screen pixels of it
    const slack = pane.px ? pane.px(12) : 0;
    if (phase === 'down') { cur = [...items].reverse().find((it) => Math.hypot(x - it.x, y - it.y) <= radius(it) + slack) || null; if (cur) { ox = x - cur.x; oy = y - cur.y; items.splice(items.indexOf(cur), 1); items.push(cur); pane.cv.style.cursor = 'grabbing'; } }
    else if (cur && phase === 'move') { cur.x = x - ox; cur.y = y - oy; const b = bx(); if (b) { cur.x = Math.max(b[0], Math.min(b[2], cur.x)); cur.y = Math.max(b[1], Math.min(b[3], cur.y)); } redraw(); }
    else if (phase === 'up') { cur = null; pane.cv.style.cursor = 'grab'; }
  });
  pane.cv.style.cursor = 'grab';
}

export { predict } from './shell.js';

export const rgbCss = ([r, g, b]) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
export function hslToRgb(hh, s, l) { // h in degrees, s and l in 0..1
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((hh / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x] : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
