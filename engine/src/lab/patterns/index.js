// The lab kit for authors: ready-made patterns you can call from your own station, and the
// helpers they are made of. Everything here is also exported by lab/kit.js.
//   import { stage, sliders, tasks, ink, C, sliderReveal } from '../../../engine/src/lab/kit.js';
// Patterns are functions (ctx, data) -> handle; a station may call one and draw on top of it with
// handle.over((d, vars, areas) => ...). The same data in course.json ("ready") needs no code.
import { sliderReveal, compare } from './scene.js';
import { sort } from './sort.js';
import { order } from './order.js';

export { sliderReveal, compare, sort, order };
export { stage, sliders, button, tasks, animate, spring, shuffle, hit } from './author.js';
export { ink, C, color, alpha, mixColor, ease, lerp, clamp, reduced, drawShapes } from './draw.js';
export { compile, tryCompile, template, fmt } from './expr.js';
export { test as testWhen, record, noteValue } from './when.js';

// pattern name (as in "ready": { "kind": ... }) -> function
export const PATTERN_FNS = { 'slider-reveal': sliderReveal, compare, sort, order };
