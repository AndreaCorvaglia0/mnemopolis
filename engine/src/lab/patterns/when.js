// The tries vocabulary of ready-made labs: when does a task count as done? Pure: no DOM.
//
// A station of a ready lab may write its tasks as objects: { "text": "...", "when": <condition> }.
// A condition is an object with ONE key, the verb. Every pattern keeps a learner record and says
// which verbs it supports (patterns/specs.js, VERBS). Conditions are tested after each action
// of the learner, never on the first picture: a task cannot tick itself before anything is done.
//
//   reach   { control, value, within? } | { control, min?, max? }   a control is at a value (now)
//   cross   { control, above } | { control, below }                 a control has gone past a threshold
//   both    { control }                                             a control has been at its two ends
//   try     { count, control? }                                     that many different settings (of one control, or of the whole picture)
//   select  "id" | ["id", ...]                                      the learner has tapped / used that thing (all of them)
//   place   { item, bin } | { all: true } | { correct: true }       sort: a card in a bin; every card placed; every card in its right bin
//   combine ["id", ...]                                             mix: exactly these ingredients are in the pot
//   run     true | "correct"                                        order: the sequence was run (in the right order)
//   pair    "leftId" | "all"                                        match: that item (every item) is joined to its partner
//   label   "spotId" | "all"                                        label: that spot (every spot) has its right term
//   nudge   { box, dir? }                                           what-if: that box was pushed up, down or either way
//   count   { of, min?, max? }                                      threshold: a named count is within bounds (e.g. "sick:below")
//   sketch  true                                                    predict-curve: every handle has been moved
//   reveal  true                                                    predict-curve: the real curve is shown
//   gap     { below }                                               predict-curve: the sketch is within that share of the y range, on average
//   all     [cond, ...] | any [cond, ...]                           combinations
export const VERB_HELP = {
  reach: '{ "control": "<id>", "value": <number>, "within": <number> } or { "control": "<id>", "min": <number>, "max": <number> }',
  cross: '{ "control": "<id>", "above": <number> } or { "control": "<id>", "below": <number> }',
  both: '{ "control": "<id>" }',
  try: '{ "count": <2 or more>, "control": "<id, optional>" }',
  select: '"<id>" or ["<id>", ...]',
  place: '{ "item": "<card id>", "bin": "<bin id>" } or { "all": true } or { "correct": true }',
  combine: '["<ingredient id>", ...]',
  run: 'true or "correct"',
  pair: '"<left id>" or "all"',
  label: '"<spot id>" or "all"',
  nudge: '{ "box": "<id>", "dir": "up" | "down" | "any" }',
  count: '{ "of": "<class>:<above|below>", "min": <number>, "max": <number> }',
  sketch: 'true',
  reveal: 'true',
  gap: '{ "below": <number between 0 and 1> }',
  all: '[<condition>, ...]',
  any: '[<condition>, ...]',
};

// a fresh learner record
export const record = () => ({
  values: {}, low: {}, high: {}, distinct: {}, states: new Set(), selected: new Set(), placed: {}, correct: {},
  pot: [], runs: 0, runsRight: 0, paired: new Set(), labelled: new Set(), nudged: new Set(), counts: {},
  moved: new Set(), handles: 0, revealed: false, gap: Infinity, items: [], spots: [], lefts: [],
});

// note a control's value: keeps the extremes and the distinct settings
export function noteValue(rec, id, v, { min = 0, max = 1, step = 0 } = {}) {
  rec.values[id] = v;
  rec.low[id] = Math.min(rec.low[id] ?? Infinity, v); rec.high[id] = Math.max(rec.high[id] ?? -Infinity, v);
  const q = step > 0 ? step : (max - min) / 20 || 1; // distinct settings: at least one step (or 5% of the range) apart
  (rec.distinct[id] ||= new Set()).add(Math.round((v - min) / q));
}

const near = (a, b, tol) => Math.abs(a - b) <= tol + 1e-9;

// does the condition hold for this record? `ctl` gives each control's { min, max, step }
export function test(c, rec, ctl = {}) {
  const [verb, a] = Object.entries(c || {})[0] || [];
  switch (verb) {
    case 'reach': { const v = rec.values[a.control]; if (v == null) return false; if (a.value != null) { const k = ctl[a.control] || {}; return near(v, a.value, a.within ?? Math.max(k.step || 0, ((k.max ?? 1) - (k.min ?? 0)) / 50)); } return (a.min == null || v >= a.min - 1e-9) && (a.max == null || v <= a.max + 1e-9); }
    case 'cross': return a.above != null ? (rec.high[a.control] ?? -Infinity) > a.above : (rec.low[a.control] ?? Infinity) < a.below;
    case 'both': { const k = ctl[a.control] || {}, tol = Math.max(k.step || 0, ((k.max ?? 1) - (k.min ?? 0)) / 50); return near(rec.low[a.control] ?? Infinity, k.min ?? 0, tol) && near(rec.high[a.control] ?? -Infinity, k.max ?? 1, tol); }
    case 'try': return (a.control ? rec.distinct[a.control]?.size || 0 : rec.states.size) >= a.count;
    case 'select': return [].concat(a).every((id) => rec.selected.has(id));
    case 'place':
      if (a.all) return rec.items.length > 0 && rec.items.every((id) => rec.placed[id]);
      if (a.correct) return rec.items.length > 0 && rec.items.every((id) => rec.placed[id] && rec.placed[id] === rec.correct[id]);
      return rec.placed[a.item] === a.bin;
    case 'combine': { const want = [...new Set(a)].sort().join('+'); return [...rec.pot].sort().join('+') === want; }
    case 'run': return a === 'correct' ? rec.runsRight > 0 : rec.runs > 0;
    case 'pair': return a === 'all' ? rec.lefts.length > 0 && rec.lefts.every((id) => rec.paired.has(id)) : rec.paired.has(a);
    case 'label': return a === 'all' ? rec.spots.length > 0 && rec.spots.every((id) => rec.labelled.has(id)) : rec.labelled.has(a);
    case 'nudge': return !a.dir || a.dir === 'any' ? rec.nudged.has(`${a.box}:up`) || rec.nudged.has(`${a.box}:down`) : rec.nudged.has(`${a.box}:${a.dir}`);
    case 'count': { const n = rec.counts[a.of]; return n != null && (a.min == null || n >= a.min) && (a.max == null || n <= a.max); }
    case 'sketch': return rec.handles > 0 && rec.moved.size >= rec.handles;
    case 'reveal': return rec.revealed;
    case 'gap': return rec.revealed && rec.gap <= a.below;
    case 'all': return a.every((x) => test(x, rec, ctl));
    case 'any': return a.some((x) => test(x, rec, ctl));
    default: return false;
  }
}

// Checks one condition against what a pattern offers. `refs`: { verbs: [...], controls: { id: {min,max} },
// items, bins, ingredients, lefts, spots, boxes, counts }: sets or arrays of ids. Returns error strings.
export function checkWhen(c, refs, where = 'when') {
  const out = [], e = (m) => out.push(`${where}: ${m}`);
  if (!c || typeof c !== 'object' || Array.isArray(c)) { e(`a condition is an object with one key, such as { "reach": { "control": "x", "value": 3 } }. Verbs for this lab: ${refs.verbs.join(', ')}`); return out; }
  const keys = Object.keys(c);
  if (keys.length !== 1) { e(`a condition has exactly one key (the verb), found ${keys.length ? keys.map((k) => `"${k}"`).join(', ') : 'none'}. Combine with { "all": [...] }`); return out; }
  const [verb] = keys, a = c[verb];
  if (!VERB_HELP[verb]) { e(`unknown verb "${verb}". Verbs for this lab: ${refs.verbs.join(', ')}`); return out; }
  if (!['all', 'any'].includes(verb) && !refs.verbs.includes(verb)) { e(`"${verb}" does not apply to this lab. Verbs for this lab: ${refs.verbs.join(', ')}`); return out; }
  const has = (set, id) => (set instanceof Set ? set.has(id) : (set || []).includes(id));
  const list = (set) => [...(set || [])].map((x) => `"${x}"`).join(', ');
  const ref = (kind, id, label = kind.replace(/s$/, '')) => { if (typeof id !== 'string' || !has(refs[kind], id)) e(`${verb}: unknown ${label} ${JSON.stringify(id)}. Known: ${list(refs[kind]) || 'none'}`); };
  const obj = () => { if (!a || typeof a !== 'object' || Array.isArray(a)) { e(`${verb} takes ${VERB_HELP[verb]}`); return false; } return true; };
  const num = (k, v = a[k]) => { if (typeof v !== 'number' || !Number.isFinite(v)) { e(`${verb}: "${k}" must be a number`); return false; } return true; };
  const ctl = (id) => { ref('controls', id, 'control'); return refs.controls?.[id]; };
  const inRange = (k, v, r) => { if (r && typeof v === 'number' && (v < r.min - 1e-9 || v > r.max + 1e-9)) e(`${verb}: ${k} ${v} is outside the control's range ${r.min} to ${r.max}: the task could never tick`); };
  switch (verb) {
    case 'reach': if (!obj()) break; { const r = ctl(a.control); if (a.value != null) { if (num('value')) inRange('value', a.value, r); if (a.within != null && num('within') && a.within < 0) e('reach: "within" must be 0 or more'); } else if (a.min == null && a.max == null) e(`reach needs "value", or "min" and/or "max": ${VERB_HELP.reach}`); else { if (a.min != null) num('min'); if (a.max != null) num('max'); if (a.min != null && a.max != null && a.min > a.max) e('reach: "min" is larger than "max"'); } } break;
    case 'cross': if (!obj()) break; { const r = ctl(a.control); if ((a.above == null) === (a.below == null)) e(`cross takes "above" or "below" (one of them): ${VERB_HELP.cross}`); else if (num(a.above != null ? 'above' : 'below')) { const t = a.above ?? a.below; if (r && (t >= r.max && a.above != null || t <= r.min && a.below != null)) e(`cross: the control never goes ${a.above != null ? 'above' : 'below'} ${t} (range ${r.min} to ${r.max})`); } } break;
    case 'both': if (obj()) ctl(a.control); break;
    case 'try': if (!obj()) break; if (!Number.isInteger(a.count) || a.count < 2 || a.count > 20) e('try: "count" must be a whole number from 2 to 20'); if (a.control != null) ctl(a.control); break;
    case 'select': [].concat(a).forEach((id) => ref('selectable', id, 'thing to select')); if (Array.isArray(a) && !a.length) e('select: the list is empty'); break;
    case 'place': if (!obj()) break; if (a.all === true || a.correct === true) break; ref('items', a.item, 'card'); ref('bins', a.bin, 'bin'); break;
    case 'combine': if (!Array.isArray(a) || !a.length) { e(`combine takes ${VERB_HELP.combine}`); break; } a.forEach((id) => ref('ingredients', id, 'ingredient')); break;
    case 'run': if (a !== true && a !== 'correct') e(`run takes ${VERB_HELP.run}`); break;
    case 'pair': if (a !== 'all') ref('lefts', a, 'left item'); break;
    case 'label': if (a !== 'all') ref('spots', a, 'spot'); break;
    case 'nudge': if (!obj()) break; ref('boxes', a.box, 'box'); if (refs.nudgeable && a.box && has(refs.boxes, a.box) && !has(refs.nudgeable, a.box)) e(`nudge: box "${a.box}" cannot be pushed (give it "push": true)`); if (a.dir != null && !['up', 'down', 'any'].includes(a.dir)) e('nudge: "dir" is "up", "down" or "any"'); break;
    case 'count': if (!obj()) break; ref('counts', a.of, 'count'); if (a.min == null && a.max == null) e('count needs "min" and/or "max"'); if (a.min != null) num('min'); if (a.max != null) num('max'); break;
    case 'sketch': case 'reveal': if (a !== true) e(`${verb} takes true`); break;
    case 'gap': if (!obj()) break; if (num('below') && (a.below <= 0 || a.below > 1)) e('gap: "below" is a share of the y range, between 0 and 1 (0.1 = within a tenth)'); break;
    case 'all': case 'any': if (!Array.isArray(a) || !a.length) e(`${verb} takes a list of conditions`); else a.forEach((x, k) => out.push(...checkWhen(x, refs, `${where} › ${verb}[${k}]`))); break;
    default: break;
  }
  return out;
}

// Ticks tasks: tracker(whens, did, ctl).update(rec) after every learner action.
export function tracker(whens, did, ctl = {}) {
  const done = new Set();
  return {
    update(rec) { whens.forEach((w, i) => { if (w && !done.has(i) && test(w, rec, ctl)) { done.add(i); did(i); } }); },
    done: (i) => done.has(i),
    // the first condition not met yet (for hints)
    current: () => whens.findIndex((w, i) => w && !done.has(i)),
  };
}
