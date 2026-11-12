// Small building blocks for lab stations. Keep stations short: one canvas, one or two controls.
import { h } from './shell.js';
import { sfx } from '../systems/audio.js';

// A canvas that fills the stage and keeps its proportions. Draw in (w x hgt) units; pointer positions
// come back in the same units. `drag(fn)` calls fn(x, y, phase) with phase 'down' | 'move' | 'up';
// `hover(fn)` calls fn(x, y) while the pointer moves without a button.
export function canvasPane(stage, w, hgt, caption = '') {
  const cv = h('canvas', { width: w, height: hgt, class: 'fit' });
  const cap = h('div', { class: 'lab-cap' }, caption);
  const el = h('div', { class: 'lab-view' }, cv, cap);
  stage.append(el);
  const pos = (e) => { const r = cv.getBoundingClientRect(), s = Math.min(r.width / w, r.height / hgt); return [(e.clientX - r.left - (r.width - w * s) / 2) / s, (e.clientY - r.top - (r.height - hgt * s) / 2) / s]; };
  let down = false, onDrag = null, onHover = null;
  cv.addEventListener('pointerdown', (e) => { down = true; cv.setPointerCapture(e.pointerId); onDrag?.(...pos(e), 'down'); });
  cv.addEventListener('pointermove', (e) => { if (down) onDrag?.(...pos(e), 'move'); else onHover?.(...pos(e)); });
  const up = (e) => { if (down) { down = false; onDrag?.(...pos(e), 'up'); } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  return { el, cv, g: cv.getContext('2d', { willReadFrequently: true }), pos, drag: (fn) => { onDrag = fn; }, hover: (fn) => { onHover = fn; }, caption: (t) => { cap.textContent = t; } };
}

// Draggable discs: returns the disc under a point, and moves it while dragged.
export function draggable(pane, items, redraw, { radius = (it) => it.r, bounds = null } = {}) {
  let cur = null, ox = 0, oy = 0;
  pane.drag((x, y, phase) => {
    if (phase === 'down') { cur = [...items].reverse().find((it) => Math.hypot(x - it.x, y - it.y) <= radius(it)) || null; if (cur) { ox = x - cur.x; oy = y - cur.y; items.splice(items.indexOf(cur), 1); items.push(cur); } }
    else if (cur && phase === 'move') { cur.x = x - ox; cur.y = y - oy; if (bounds) { cur.x = Math.max(bounds[0], Math.min(bounds[2], cur.x)); cur.y = Math.max(bounds[1], Math.min(bounds[3], cur.y)); } redraw(); }
    else if (phase === 'up') cur = null;
  });
  pane.cv.style.cursor = 'grab';
}

// "Predict first": the learner commits to an answer before touching anything. No score: the lab is
// where they find out. Resolves with the index picked. Use it when intuition is likely to be wrong.
export function predict(controls, question, options) {
  return new Promise((resolve) => {
    const box = h('div', { class: 'lab-read' }, h('div', { class: 'lab-k' }, 'Predict first'), h('div', { style: 'margin-bottom:8px' }, question));
    const row = h('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' });
    options.forEach((o, i) => row.append(h('button', { class: 'lab-btn', onclick: () => { sfx.tick(); [...row.children].forEach((b, j) => { b.disabled = true; b.style.opacity = j === i ? 1 : 0.4; if (j === i) b.style.borderColor = '#ffcf5a'; }); box.append(h('div', { style: 'margin-top:8px;color:#ffcf5a' }, 'Now find out: the stage is yours.')); resolve(i); } }, o)));
    box.append(row);
    controls.append(box);
  });
}

export const rgbCss = ([r, g, b]) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
export function hslToRgb(hh, s, l) { // h in degrees, s and l in 0..1
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((hh / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x] : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
