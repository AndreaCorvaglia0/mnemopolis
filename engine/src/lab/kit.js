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
//   pane.hint(fn)                     // fn(k) for task k: [x, y] in your units, or a control element:
//                                     //   the frame points there when the learner taps the current step
//
// Pixel calls (getImageData, putImageData) take and give your units, as before. Old stations
// keep working: `pane.cv.width` and `pane.cv.height` read your units (as when the canvas was
// w x hgt), `pane.cv.getContext('2d')` returns `pane.g`, and a station that never calls onResize
// gets its last picture rescaled after a resize. The backing store is `pane.backing()`.
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
  // the real size of the canvas, in device pixels; cv.width and cv.height are the station's units
  const DW = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width'), DH = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'height');
  const rw = () => DW.get.call(cv), rh = () => DH.get.call(cv);
  let dpr = 1, s = 1, ox = 0, oy = 0, cw = 0, chh = 0, resizers = [];

  const shapeFor = (bw, bh) => (opts.portrait && bh > bw * 0.8 ? opts.portrait : [w, hgt]);
  const base = () => { raw.setTransform(s, 0, 0, s, ox, oy); raw.beginPath(); raw.rect(0, 0, pane.W, pane.H); raw.clip(); };
  // size the backing store to the element; returns true if anything changed
  const fit = (keep = true) => {
    const r = wrap.getBoundingClientRect();
    const bw = Math.max(1, Math.round(r.width || w)), bh = Math.max(1, Math.round(r.height || hgt)), d = Math.min(3, window.devicePixelRatio || 1);
    const [W2, H2] = shapeFor(bw, bh);
    if (keep && bw === cw && bh === chh && d === dpr && W2 === pane.W && H2 === pane.H && rw() > 1) return false;
    // keep the last picture for stations that do not redraw themselves
    let snap = null;
    if (keep && !resizers.length && rw() > 1) { snap = document.createElement('canvas'); snap.width = Math.max(1, Math.round(pane.W * s)); snap.height = Math.max(1, Math.round(pane.H * s)); snap.getContext('2d').drawImage(cv, ox, oy, snap.width, snap.height, 0, 0, snap.width, snap.height); }
    cw = bw; chh = bh; dpr = d; pane.W = W2; pane.H = H2; pane.upright = W2 !== w || H2 !== hgt;
    DW.set.call(cv, Math.round(bw * d)); DH.set.call(cv, Math.round(bh * d));
    s = Math.min(rw() / W2, rh() / H2); ox = Math.round((rw() - W2 * s) / 2); oy = Math.round((rh() - H2 * s) / 2);
    pane.scale = s / d;
    base();
    if (snap) { raw.save(); raw.globalCompositeOperation = 'source-over'; raw.globalAlpha = 1; raw.drawImage(snap, 0, 0, pane.W, pane.H); raw.restore(); }
    return true;
  };
  // old station code reads and sets cv.width / cv.height in its own units
  Object.defineProperty(cv, 'width', { configurable: true, get: () => pane.W, set: (v) => { v = Math.max(1, Math.round(+v || 1)); if (!pane.upright) w = v; fit(false); } });
  Object.defineProperty(cv, 'height', { configurable: true, get: () => pane.H, set: (v) => { v = Math.max(1, Math.round(+v || 1)); if (!pane.upright) hgt = v; fit(false); } });

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
    get(t, p) { if (p in over) return over[p]; if (p === 'canvas') return cv; const v = t[p]; if (typeof v !== 'function') return v; if (!bound.has(p)) bound.set(p, v.bind(t)); return bound.get(p); },
    set(t, p, v) { t[p] = v; return true; },
  });
  cv.getContext = () => pane.g;

  // pointer position in the station's units
  const pos = (e) => { const r = cv.getBoundingClientRect(), k = rw() / Math.max(1, r.width); return [((e.clientX - r.left) * k - ox) / s, ((e.clientY - r.top) * k - oy) / s]; };
  let down = false, onDrag = null, onHover = null, onTip = null;
  let tipHide = 0;
  const tip = (e, x, y) => {
    const html = onTip?.(x, y);
    clearTimeout(tipHide);
    if (!html) { tipEl.hidden = true; return; }
    tipEl.innerHTML = html; tipEl.hidden = false;
    const r = wrap.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    const finger = e.pointerType !== 'mouse';
    tipEl.classList.toggle('dock', finger);
    const tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
    if (finger) {
      // a finger covers what is under it: the read-out goes to the far edge of the picture
      tipEl.style.left = `${Math.max(6, (r.width - tw) / 2)}px`;
      tipEl.style.top = `${py > r.height / 2 ? 6 : r.height - th - 6}px`;
    } else {
      tipEl.style.left = `${Math.max(6, Math.min(r.width - tw - 6, px - tw / 2))}px`;
      tipEl.style.top = `${py - th - 18 < 6 ? Math.min(r.height - th - 6, py + 24) : py - th - 18}px`;
    }
  };
  cv.addEventListener('pointerdown', (e) => { down = true; try { cv.setPointerCapture(e.pointerId); } catch { /* synthetic events */ } const [x, y] = pos(e); onDrag?.(x, y, 'down'); tip(e, x, y); });
  cv.addEventListener('pointermove', (e) => { const [x, y] = pos(e); if (down) onDrag?.(x, y, 'move'); else onHover?.(x, y); tip(e, x, y); });
  const up = (e) => { if (down) { down = false; onDrag?.(...pos(e), 'up'); } if (e.pointerType !== 'mouse') tipHide = setTimeout(() => { tipEl.hidden = true; }, 2500); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { if (!down) tipEl.hidden = true; });

  Object.assign(pane, {
    pos,
    drag: (fn) => { onDrag = fn; },
    hover: (fn) => { onHover = fn; },
    tip: (fn) => { onTip = fn; },
    hint: (fn) => { pane.__hint = fn; },
    backing: () => ({ width: rw(), height: rh() }),
    caption: (t) => { cap.textContent = t; cap.hidden = !t; },
    onResize: (fn) => { resizers.push(fn); },
    // a font of `size` units, never below 16 screen pixels
    font: (size, weight = 400) => `${weight} ${Math.max(size, 16 / pane.scale).toFixed(1)}px system-ui,-apple-system,"Segoe UI",sans-serif`,
    // `n` screen pixels in the station's units (for hairlines and hit areas)
    px: (n) => n / pane.scale,
    // where a point of the station's units is on the screen (client pixels); for tests and tours
    toScreen: (x, y) => { const r = cv.getBoundingClientRect(), k = r.width / Math.max(1, rw()); return [r.left + (ox + x * s) * k, r.top + (oy + y * s) * k]; },
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

// The lab kit for authors (patterns/index.js): stage, sliders, button, tasks, animate, spring,
// shuffle, hit, ink, C, color, alpha, compile, template, fmt, and the ready-made patterns as
// functions: sliderReveal, compare, sort, order.
export * from './patterns/index.js';
export { h, seg, slider, readout } from './shell.js';
