// Helpers that make a custom station short: a stage that lays itself out for wide and upright
// screens, sliders and switches from a list, tasks ticked by conditions (patterns/when.js), an
// animation loop that stops by itself, and a deterministic shuffle. See
// skills/knowledge-base/references/8-ready-labs.md ("The lab author's card").
import { canvasPane } from '../kit.js';
import { h, slider, seg } from '../shell.js';
import { sfx } from '../../systems/audio.js';
import { ink, reduced } from './draw.js';
import { record, noteValue, tracker } from './when.js';
import { fmt } from './expr.js';

// stage(ctx, { wide: [w, h], tall: [w, h], caption }, draw): a canvas for the whole stage.
// draw(d, pane) is called now and after every resize; pane.upright says which box is in use.
// Returns { pane, d, redraw }.
export function stage(ctx, { wide = [760, 480], tall = [480, 600], caption = '' } = {}, draw = () => {}) {
  const pane = canvasPane(ctx.stage, wide[0], wide[1], caption, { portrait: tall });
  const d = ink(pane);
  const redraw = () => { if (ctx.alive && !ctx.alive()) return; draw(d, pane); };
  pane.onResize(redraw);
  queueMicrotask(redraw);
  return { pane, d, redraw };
}

// sliders(ctx, [{ id, label, min, max, step, value, unit, decimals }], onInput): sliders in the
// controls panel (under the picture on a phone). Returns { v: { id: value }, el: { id: element }, set(id, value) }.
// A def with "options": [[value, label], ...] makes a switch (segmented buttons) instead.
export function sliders(ctx, defs, onInput = () => {}) {
  const v = {}, el = {};
  for (const c of defs) {
    v[c.id] = c.value ?? c.min ?? 0;
    if (c.options) el[c.id] = seg(c.options, v[c.id], (x) => { v[c.id] = typeof c.options[0][0] === 'number' ? +x : x; onInput(c.id, v[c.id]); });
    else {
      const show = (x) => `${fmt(x, c.decimals ?? decimalsOf(c.step))}${c.unit ? ` ${c.unit}` : ''}`;
      el[c.id] = slider(c.label, c.min, c.max, v[c.id], (x) => { v[c.id] = x; onInput(c.id, x); }, { step: c.step ?? (c.max - c.min) / 100, fmt: show });
    }
    if (c.options && c.label) ctx.controls.append(h('div', { class: 'lab-k' }, c.label));
    ctx.controls.append(el[c.id]);
  }
  return { v, el, set: (id, x) => { v[id] = x; el[id].set?.(x, false); } };
}
const decimalsOf = (step) => { if (!step) return null; const s = String(step); return s.includes('.') ? s.split('.')[1].length : 0; };

// button(ctx, label, onClick, { primary }): a large button in the controls panel
export function button(ctx, label, onClick, { primary = false } = {}) {
  const b = h('button', { type: 'button', class: 'lab-btn', style: `width:100%;font-weight:600;${primary ? 'background:var(--acc);color:var(--acc-ink);border-color:var(--acc)' : ''}`, onclick: () => { sfx.tick(); onClick(b); } }, label);
  ctx.controls.append(b);
  return b;
}

// tasks(ctx, whens, ranges): ticks the station's tasks from conditions (patterns/when.js).
//   whens: one condition per task, in order; by default the "when" of each task in course.json
//   ranges: { controlId: { min, max, step } } for reach/both/try
// Call the note functions on every learner action, then t.check():
//   t.value(id, x) a control moved · t.pick(id) something tapped · t.state(key) a distinct state
// t.rec is the learner record: place, pair, label, nudge... can be written to it directly.
export function tasks(ctx, whens = ctx.station?.when || [], ranges = {}) {
  const rec = record();
  const tr = tracker(whens, (i) => ctx.did(i), ranges);
  const t = {
    rec, whens,
    value(id, x) { noteValue(rec, id, x, ranges[id]); rec.states.add(JSON.stringify(rec.values)); return t; },
    pick(id) { rec.selected.add(id); return t; },
    state(key) { rec.states.add(String(key)); return t; },
    check() { tr.update(rec); return t; },
    // the index of the first task not done yet (-1 when all are)
    current: () => tr.current(),
    done: (i) => tr.done(i),
  };
  return t;
}

// animate(ctx, frame): calls frame(dt, t) on every animation frame while it returns true; kick()
// starts it again. Stops when the learner leaves. With reduced motion, frame gets dt = Infinity
// once (jump to the end).
export function animate(ctx, frame) {
  let id = 0, last = 0, t0 = 0;
  const loop = (now) => {
    if (ctx.alive && !ctx.alive()) { id = 0; return; }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    const more = frame(reduced() ? Infinity : dt, (now - t0) / 1000);
    id = more ? requestAnimationFrame(loop) : 0;
  };
  ctx.onCleanup?.(() => { if (id) cancelAnimationFrame(id); id = 0; });
  return { kick() { if (!id) { last = 0; t0 = performance.now(); id = requestAnimationFrame(loop); } }, running: () => !!id };
}

// A value that eases toward its target: s = spring(0); s.to(1); s.step(dt) -> true while moving
export function spring(v = 0, speed = 10) {
  const s = { v, target: v, to(x) { s.target = x; return s; }, set(x) { s.v = s.target = x; return s; },
    step(dt) { if (dt === Infinity) { s.v = s.target; return false; } s.v += (s.target - s.v) * (1 - Math.exp(-speed * dt)); if (Math.abs(s.target - s.v) < 1e-3) { s.v = s.target; return false; } return true; } };
  return s;
}

// shuffle(list, seed): the same order every time for the same seed (a string), never the identity
// when it can be avoided
export function shuffle(list, seed = 'mnemo') {
  let x = 2166136261;
  for (const ch of String(seed)) x = Math.imul(x ^ ch.charCodeAt(0), 16777619);
  const rnd = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 1e6) / 1e6; };
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  if (a.length > 1 && a.every((v, i) => v === list[i])) a.push(a.shift());
  return a;
}

// hit(list, x, y, slack): the last item whose box [x, y, w, h] or circle (x, y, r) holds the point
export function hit(list, x, y, slack = 0) {
  for (let i = list.length - 1; i >= 0; i--) {
    const it = list[i];
    if (it.r != null ? Math.hypot(x - it.x, y - it.y) <= it.r + slack : x >= it.x - slack && x <= it.x + it.w + slack && y >= it.y - slack && y <= it.y + it.h + slack) return it;
  }
  return null;
}
