// What each ready-made pattern accepts, and the checks the validator runs on a station's "ready"
// data. Pure (no DOM): imported by skills/knowledge-base/scripts/validate.mjs, the /play/ page and
// the tests. Messages say what to write, so that the error text alone is enough to fix the data.
import { tryCompile, template, ExprError, FUNCS } from './expr.js';
import { checkWhen } from './when.js';
import { isColor, SHAPE_KINDS, SHAPE_KEYS, NAMED } from './draw.js';

const CTL = ['reach', 'cross', 'both', 'try'];
export const PATTERNS = {
  'slider-reveal': { verbs: CTL, does: 'moves one or two sliders; a plot, bars or a picture follow live, regions light up when a condition holds', fits: 'mechanisms with a clear dependency (cause-effect), formulas, scales' },
  compare: { verbs: CTL, does: 'moves the same control for two cases side by side and watches the measured difference grow or shrink', fits: 'contrasts: with and without, small and large, A and B' },
  sort: { verbs: ['place', 'select', 'try'], does: 'drags cards into 2 to 4 bins; each bin reacts and each card explains itself', fits: 'categories and criteria (sort-cases)' },
  order: { verbs: ['run', 'select', 'try'], does: 'puts 3 to 7 steps in order and runs them; the run stops where the order breaks', fits: 'processes, cycles, cause-and-effect chains (step-through)' },
};
export const PATTERN_NAMES = Object.keys(PATTERNS);

const ID = /^[a-z][a-z0-9-]*$/i;
const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
const listOf = (a) => (Array.isArray(a) ? a : []);

export function checkReady(st, where = 'ready') {
  const R = st.ready, errs = [], e = (m) => errs.push(`${where}: ${m}`);
  if (!isObj(R)) { e('"ready" must be an object such as { "kind": "slider-reveal", ... }'); return errs; }
  const kind = R.kind;
  if (!PATTERNS[kind]) { e(`"kind" must be one of ${PATTERN_NAMES.join(', ')}${kind ? ` (found "${kind}")` : ''}`); return errs; }
  const known = (keys) => Object.keys(R).filter((k) => !['kind', 'caption', 'wide', 'tall', ...keys].includes(k)).forEach((k) => e(`unknown field "${k}" for ${kind}. Fields: ${keys.join(', ')}`));
  const refs = { verbs: PATTERNS[kind].verbs, controls: {} };
  const text = (v, label, req = true) => { if (v == null) { if (req) e(`${label} is missing`); return; } if (typeof v !== 'string' || !v.trim()) e(`${label} must be a non-empty string`); };
  const ids = (list, label) => { const seen = new Set(); list.forEach((x, k) => { if (!isObj(x)) { e(`${label} ${k + 1} must be an object`); return; } if (typeof x.id !== 'string' || !ID.test(x.id)) e(`${label} ${k + 1}: "id" must be a short name of letters, digits and dashes`); else if (seen.has(x.id)) e(`${label} ${k + 1}: id "${x.id}" is used twice`); seen.add(x.id); }); return seen; };
  const col = (c, label) => { if (c != null && !isColor(c)) e(`${label}: colour "${c}" is not a name (${Object.keys(NAMED).join(', ')}) or "#rrggbb"`); };
  if (R.caption != null) text(R.caption, 'caption');
  for (const k of ['wide', 'tall']) if (R[k] != null && !(Array.isArray(R[k]) && R[k].length === 2 && R[k].every((n) => typeof n === 'number' && n >= 240 && n <= 1600))) e(`"${k}" is [width, height] in units, each 240 to 1600`);

  if (kind === 'slider-reveal' || kind === 'compare') {
    known(kind === 'compare' ? ['controls', 'cases', 'vars', 'plot', 'layers', 'diff'] : ['controls', 'vars', 'plot', 'layers']);
    const cs = listOf(R.controls);
    if (kind === 'slider-reveal' && (cs.length < 1 || cs.length > 2)) e('"controls" needs 1 or 2 controls: [{ "id": "f", "label": "Frequency", "min": 100, "max": 1000, "value": 200 }]');
    if (kind === 'compare' && cs.length > 2) e('"controls": two at most');
    ids(cs, 'control');
    cs.forEach((c, k) => {
      const C = `control ${k + 1}${c?.id ? ` ("${c.id}")` : ''}`;
      if (!isObj(c)) return;
      text(c.label, `${C} "label"`);
      if (c.options) {
        if (!Array.isArray(c.options) || c.options.length < 2 || c.options.length > 4 || !c.options.every((o) => Array.isArray(o) && o.length === 2 && typeof o[0] === 'number' && typeof o[1] === 'string')) e(`${C}: "options" is a switch: [[0, "Off"], [1, "On"]] (2 to 4 [number, label] pairs)`);
        else { const vs = c.options.map((o) => o[0]); refs.controls[c.id] = { min: Math.min(...vs), max: Math.max(...vs), step: 1 }; if (c.value != null && !vs.includes(c.value)) e(`${C}: "value" must be one of the options' numbers`); }
        return;
      }
      for (const f of ['min', 'max', 'value']) if (typeof c[f] !== 'number' || !Number.isFinite(c[f])) e(`${C}: "${f}" must be a number`);
      if (c.min >= c.max) e(`${C}: "min" must be smaller than "max"`);
      if (c.value < c.min || c.value > c.max) e(`${C}: "value" (the start) must be between min and max`);
      if (c.step != null && !(typeof c.step === 'number' && c.step > 0 && c.step <= c.max - c.min)) e(`${C}: "step" must be a positive number smaller than the range`);
      if (c.unit != null) text(c.unit, `${C} "unit"`);
      refs.controls[c.id] = { min: c.min, max: c.max, step: c.step };
    });
    let names = cs.map((c) => c.id).filter(Boolean);
    if (kind === 'compare') {
      const cases = listOf(R.cases);
      if (cases.length !== 2) e('"cases" needs exactly 2 cases: [{ "id": "a", "label": "Small", "vars": { "m": 1 } }, { "id": "b", "label": "Large", "vars": { "m": 3 } }]');
      ids(cases, 'case');
      const keys = cases.map((c) => (isObj(c?.vars) ? Object.keys(c.vars).sort().join(',') : ''));
      if (cases.length === 2 && keys[0] !== keys[1]) e('the two cases must give the same variables in "vars" (with different values)');
      cases.forEach((c, k) => { if (!isObj(c)) return; text(c.label, `case ${k + 1} "label"`); if (c.short != null) text(c.short, `case ${k + 1} "short"`); if (!isObj(c.vars) || !Object.keys(c.vars).length) e(`case ${k + 1}: "vars" gives the numbers that make this case different: { "m": 3 }`); else Object.entries(c.vars).forEach(([n, v]) => { if (typeof v !== 'number') e(`case ${k + 1}: var "${n}" must be a number`); if (!/^[A-Za-z_]\w*$/.test(n)) e(`case ${k + 1}: "${n}" is not a valid variable name`); if (names.includes(n)) e(`case ${k + 1}: "${n}" is also a control id`); }); });
      names = [...names, ...Object.keys(cases[0]?.vars || {})];
    }
    if (R.vars != null) {
      if (!isObj(R.vars)) e('"vars" is an object of derived values: { "T": "1000/f" }');
      else for (const [n, x] of Object.entries(R.vars)) { if (!/^[A-Za-z_]\w*$/.test(n)) e(`vars: "${n}" is not a valid variable name`); else if (names.includes(n)) e(`vars: "${n}" is already a control or case variable`); const r = tryCompile(x, names); if (r.error) e(`vars.${n}: ${r.error}`); names = [...names, n]; }
    }
    const expr = (x, label, extra = []) => { if (typeof x === 'number') return; const r = tryCompile(x, [...names, ...extra]); if (r.error) e(`${label}: ${r.error}`); };
    const tpl = (s, label) => { if (s == null) return; if (typeof s !== 'string') { e(`${label} must be a string`); return; } try { template(s, names); } catch (err) { if (err instanceof ExprError) e(`${label}: ${err.message}`); else throw err; } };
    if (R.plot != null) {
      if (!isObj(R.plot) || !isObj(R.plot.x) || !isObj(R.plot.y)) e('"plot" is { "x": { "min": 0, "max": 10, "label": "time (s)" }, "y": { "min": 0, "max": 1, "label": "..." } }');
      else for (const a of ['x', 'y']) { const A = R.plot[a]; if (typeof A.min !== 'number' || typeof A.max !== 'number' || A.min >= A.max) e(`plot.${a}: "min" and "max" are numbers, min < max`); if (A.label != null) text(A.label, `plot.${a}.label`); }
    }
    const layers = listOf(R.layers);
    if (!layers.length) e('"layers" lists what is drawn: a curve, points, bars, shapes, a threshold, a region, a marker, a readout (at least one)');
    const KINDS = ['curve', 'points', 'threshold', 'region', 'marker', 'bars', 'shapes', 'readout'], PLOT = ['curve', 'points', 'threshold', 'region', 'marker'];
    layers.forEach((L, k) => {
      const W = `layer ${k + 1}`;
      if (!isObj(L)) { e(`${W} must be an object`); return; }
      const ks = KINDS.filter((x) => L[x] != null);
      if (ks.length !== 1) { e(`${W} must have exactly one of ${KINDS.join(', ')}${ks.length ? ` (found ${ks.join(' and ')})` : ''}`); return; }
      const [lk] = ks;
      if (PLOT.includes(lk) && !R.plot) e(`${W}: a ${lk} is drawn on the plot: add "plot": { "x": {...}, "y": {...} }`);
      col(L.color, W); tpl(L.label, `${W} label`);
      if (lk === 'curve') { expr(L.curve, `${W} curve (y as a function of x)`, ['x']); if (L.show != null) expr(L.show, `${W} show`); }
      if (lk === 'points') { if (!Array.isArray(L.points) || L.points.length < 2 || !L.points.every((p) => Array.isArray(p) && p.length === 2)) e(`${W}: "points" is a list of [x, y] pairs, at least 2`); else L.points.forEach((p, j) => p.forEach((x, q) => expr(x, `${W} point ${j + 1} ${q ? 'y' : 'x'}`))); if (L.show != null) expr(L.show, `${W} show`); }
      if (lk === 'threshold') { expr(L.threshold, `${W} threshold`); if (L.axis != null && !['x', 'y'].includes(L.axis)) e(`${W}: "axis" is "x" (a vertical line) or "y" (a horizontal line)`); }
      if (lk === 'region') { if (!Array.isArray(L.region) || L.region.length !== 2) e(`${W}: "region" is [from, to] on the axis`); else L.region.forEach((x, j) => expr(x, `${W} region ${j ? 'to' : 'from'}`)); if (L.when != null) expr(L.when, `${W} when (lit while not 0, e.g. "f > 400")`); if (L.axis != null && !['x', 'y'].includes(L.axis)) e(`${W}: "axis" is "x" or "y"`); }
      if (lk === 'marker') { if (!Array.isArray(L.marker) || L.marker.length !== 2) e(`${W}: "marker" is [x, y], each a number or an expression`); else L.marker.forEach((x, j) => expr(x, `${W} marker ${j ? 'y' : 'x'}`)); }
      if (lk === 'bars') { if (!Array.isArray(L.bars) || L.bars.length < 1 || L.bars.length > 6) e(`${W}: "bars" is a list of 1 to 6 { "label", "value" }`); else L.bars.forEach((b, j) => { if (!isObj(b)) return e(`${W} bar ${j + 1} must be an object`); tpl(b.label, `${W} bar ${j + 1} label`); if (b.value == null) e(`${W} bar ${j + 1}: "value" is missing`); else expr(b.value, `${W} bar ${j + 1} value`); col(b.color, `${W} bar ${j + 1}`); }); if (L.max == null) e(`${W}: bars need "max" (the value of a full bar, a number or an expression)`); else expr(L.max, `${W} max`); }
      if (lk === 'shapes') errs.push(...checkShapes(L.shapes, names, `${where}: ${W}`));
      if (lk === 'readout') tpl(L.readout, `${W} readout`);
    });
    if (kind === 'compare' && R.diff != null) { if (!isObj(R.diff) || R.diff.value == null) e('"diff" is { "value": "<expression>", "label": "Energy", "unit": "J" }: the quantity measured in both cases'); else { expr(R.diff.value, 'diff value'); tpl(R.diff.label, 'diff label'); } }
  }

  if (kind === 'sort') {
    known(['bins', 'cards', 'scale', 'tapHint']);
    const bins = listOf(R.bins), cards = listOf(R.cards);
    if (bins.length < 2 || bins.length > 4) e('"bins" needs 2 to 4 bins: [{ "id": "fast", "label": "Faster than in air" }, ...]');
    if (cards.length < 3 || cards.length > 10) e('"cards" needs 3 to 10 cards: [{ "id": "water", "label": "Water", "bin": "fast", "why": "..." }, ...]');
    refs.bins = ids(bins, 'bin'); refs.items = ids(cards, 'card'); refs.selectable = refs.items;
    bins.forEach((b, k) => { if (isObj(b)) { text(b.label, `bin ${k + 1} "label"`); col(b.color, `bin ${k + 1}`); } });
    cards.forEach((c, k) => {
      if (!isObj(c)) return;
      const C = `card ${k + 1}${c.id ? ` ("${c.id}")` : ''}`;
      text(c.label, `${C} "label"`); text(c.why, `${C} "why" (what the learner reads when the card lands: why it belongs where it belongs)`);
      if (!refs.bins.has(c.bin)) e(`${C}: "bin" must be the id of a bin (${[...refs.bins].join(', ')})`);
      if (R.scale != null && typeof c.value !== 'number') e(`${C}: with "scale", every card needs a number "value"`);
    });
    if (R.scale != null && (!isObj(R.scale) || (R.scale.label != null && typeof R.scale.label !== 'string'))) e('"scale" is { "label": "Speed", "unit": "m/s" }: each bin adds up the "value" of its cards');
    const used = new Set(cards.map((c) => c?.bin));
    bins.forEach((b) => { if (b?.id && !used.has(b.id)) e(`bin "${b.id}" gets no card: every bin needs at least one`); });
  }

  if (kind === 'order') {
    known(['steps', 'run']);
    const steps = listOf(R.steps);
    if (steps.length < 3 || steps.length > 7) e('"steps" needs 3 to 7 steps, in the right order: [{ "id": "a", "label": "...", "result": "...", "early": "..." }, ...]');
    refs.selectable = ids(steps, 'step');
    steps.forEach((s, k) => { if (!isObj(s)) return; const S = `step ${k + 1}${s.id ? ` ("${s.id}")` : ''}`; text(s.label, `${S} "label"`); text(s.result, `${S} "result" (what this step produces, shown as the run passes)`, false); text(s.early, `${S} "early" (what goes wrong if it comes too soon)`, false); });
    if (R.run != null) text(R.run, '"run" (the label of the button)');
  }

  // tasks: { text, when } with a verb this pattern supports
  listOf(st.tries).forEach((tr, k) => {
    if (typeof tr === 'string') { e(`task ${k + 1} is plain text: a ready lab needs { "text": "...", "when": { ... } } so that it can tick. Verbs for ${kind}: ${refs.verbs.join(', ')}`); return; }
    errs.push(...checkWhen(tr.when, refs, `${where}: task ${k + 1}`));
  });
  return errs;
}

// a declarative picture (draw.js, SHAPES)
export function checkShapes(list, names = [], where = 'shapes') {
  const errs = [], e = (m) => errs.push(`${where}: ${m}`);
  if (!Array.isArray(list) || !list.length) { e('"shapes" is a list of shapes: { "rect": [x, y, w, h] }, { "circle": [x, y, r] }, { "line": [[x, y], ...] }, { "arrow": [[x, y], [x, y]] }, { "text": "...", "at": [x, y] }, { "emoji": "🔔", "at": [x, y] }'); return errs; }
  if (list.length > 60) e(`${list.length} shapes: keep a picture to 60 at most`);
  const num = (x, label) => { if (typeof x === 'number') return; const r = tryCompile(x, names); if (r.error) e(`${label}: ${r.error}`); };
  list.forEach((s, k) => {
    const S = `shape ${k + 1}`;
    if (!isObj(s)) { e(`${S} must be an object`); return; }
    const ks = SHAPE_KINDS.filter((x) => s[x] != null);
    if (ks.length !== 1) { e(`${S} must have exactly one of ${SHAPE_KINDS.join(', ')}`); return; }
    const kd = ks[0];
    Object.keys(s).filter((x) => x !== kd && !SHAPE_KEYS.includes(x)).forEach((x) => e(`${S}: unknown key "${x}" (keys: ${SHAPE_KEYS.join(', ')})`));
    if (s.color != null && !isColor(s.color)) e(`${S}: colour "${s.color}" is not a name or "#rrggbb"`);
    const nums = (arr, n, label) => { if (!Array.isArray(arr) || arr.length !== n) e(`${S}: "${label}" needs ${n} numbers`); else arr.forEach((x, j) => num(x, `${S} ${label}[${j}]`)); };
    if (kd === 'rect') nums(s.rect, 4, 'rect');
    if (kd === 'circle') nums(s.circle, 3, 'circle');
    if (kd === 'line' || kd === 'arrow') { if (!Array.isArray(s[kd]) || s[kd].length < 2) e(`${S}: "${kd}" is a list of at least two [x, y] points`); else s[kd].forEach((p, j) => nums(p, 2, `${kd}[${j}]`)); }
    if (kd === 'text') { if (typeof s.text !== 'string') e(`${S}: "text" must be a string`); else { try { template(s.text, names); } catch (err) { e(`${S} text: ${err.message}`); } } }
    if (kd === 'emoji' && (typeof s.emoji !== 'string' || [...s.emoji].length > 4)) e(`${S}: "emoji" is one emoji character`);
    if ((kd === 'text' || kd === 'emoji') && s.at != null) nums(s.at, 2, 'at');
    for (const x of ['opacity', 'show', 'size', 'width', 'round']) if (s[x] != null) num(s[x], `${S} ${x}`);
  });
  return errs;
}

// for the docs and the tests: the functions of the expression language
export const EXPR_FUNCTIONS = Object.keys(FUNCS);
