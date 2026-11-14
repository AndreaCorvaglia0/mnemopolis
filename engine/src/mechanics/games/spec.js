// Mini-games and withheld lines in course.json: the checks, as messages that say what to write.
// No imports: the validator (skills/knowledge-base/scripts/validate.mjs) and the /play/ page read it.
//   checkGames(course, { hasCode(id) }) -> { errors, warns }
//   checkGame(game, course)             -> { errors, warns } for one entry
// The format: skills/knowledge-base/references/10-games.md.

export const KINDS = ['which', 'match-fast', 'sort-fast', 'odd-one-out', 'sequence', 'estimate', 'custom'];
export const WHERE = ['town', 'person', 'host'];
export const OBJECTS = ['piano', 'board', 'hat', 'box', 'bench'];
export const TIERS_TOLD = ['passing', 'settling', 'known', 'home'];
const MAKES = { which: ['tone', 'hsl', 'number', 'size'], estimate: ['tone', 'hue', 'number'] };
const VOICES = ['pure', 'pluck', 'piano', 'bell'];
const NOTE = /^(do|re|mi|fa|sol|la|si|[a-g])\s*([#♯]{1,2}|[b♭]{1,2})?\s*-?\d+$/i;
const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const range = (r) => isNum(r) || (Array.isArray(r) && r.length === 2 && r.every(isNum));

function checkSound(s, where, err) {
  if (!s || typeof s !== 'object') return err(`${where}: "sound" must be an object like { "hz": 440 } or { "note": "A4" }`);
  const keys = ['hz', 'note', 'notes', 'ratios'].filter((k) => s[k] != null);
  if (!keys.length) err(`${where}: a sound needs "hz", "note", "notes" or "ratios"`);
  const hz = Array.isArray(s.hz) ? s.hz : s.hz != null ? [s.hz] : [];
  if (hz.some((f) => !isNum(f) || f < 20 || f > 12000)) err(`${where}: frequencies must be numbers between 20 and 12000 Hz`);
  for (const n of [...(s.note ? [s.note] : []), ...(s.notes || [])]) if (!NOTE.test(String(n))) err(`${where}: "${n}" is not a note name (write e.g. "A4", "C#3", "Bb2", "La4")`);
  if (s.ratios && (!Array.isArray(s.ratios) || s.ratios.some((q) => !isNum(q) || q <= 0))) err(`${where}: "ratios" must be positive numbers, e.g. [1, 1.25, 1.5]`);
  if (s.voice && !VOICES.includes(s.voice)) err(`${where}: voice "${s.voice}" unknown; use ${VOICES.join(', ')}`);
}
function checkItem(it, where, err) {
  if (typeof it === 'string' || typeof it === 'number') return;
  if (!it || typeof it !== 'object') return err(`${where}: an item is a string or an object with "text", "colour", "shape" or "sound"`);
  if (!['text', 'colour', 'shape', 'sound'].some((k) => it[k] != null)) err(`${where}: the item shows nothing: give it "text", "colour", "shape" or "sound"`);
  if (it.sound) checkSound(it.sound, where, err);
  if (it.size != null && !(isNum(it.size) && it.size >= 0.1 && it.size <= 1)) err(`${where}: "size" must be between 0.1 and 1`);
}

export function checkGame(g, course = {}) {
  const errors = [], warns = [], err = (m) => errors.push(m), warn = (m) => warns.push(m);
  const G = `game "${g?.id || '?'}"`;
  if (!g || typeof g !== 'object') { err('games: every entry must be an object'); return { errors, warns }; }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.id || '')) err(`${G}: "id" must be lowercase letters, digits and dashes`);
  if (!g.title) err(`${G}: "title" is missing`); else if (words(g.title) > 5) err(`${G}: the title has ${words(g.title)} words; keep it to 5`);
  if (!KINDS.includes(g.kind)) err(`${G}: "kind" must be one of ${KINDS.join(', ')}`);
  const ids = new Set((course.concepts || []).map((c) => c.id));
  if (!Array.isArray(g.concepts) || !g.concepts.length) err(`${G}: "concepts" must name the concept(s) it practises: it opens only after they are met`);
  else for (const id of g.concepts) if (!ids.has(id)) err(`${G}: unknown concept "${id}"`);
  if (g.where != null && !WHERE.includes(g.where)) err(`${G}: "where" must be ${WHERE.join(', ')}`);
  if (g.object != null && !OBJECTS.includes(g.object)) err(`${G}: "object" must be ${OBJECTS.join(', ')}`);
  if (g.object != null && g.where && g.where !== 'town') warn(`${G}: "object" is used only with "where": "town"`);
  if (g.unlock != null && !['remembered', 'lab'].includes(g.unlock)) err(`${G}: "unlock" must be "remembered" or "lab"`);
  if (g.rounds != null && !(Number.isInteger(g.rounds) && g.rounds >= 3 && g.rounds <= 20)) err(`${G}: "rounds" must be a whole number from 3 to 20`);
  if (g.learn && words(g.learn) > 16) err(`${G}: "learn" has ${words(g.learn)} words; keep it to 16`);
  const d = g.data || {};
  if (g.kind !== 'custom' && (!g.data || typeof g.data !== 'object')) { err(`${G}: "data" is missing (what the ${g.kind} game shows)`); return { errors, warns }; }
  if (g.kind !== 'custom' && g.kind !== 'sequence' && !d.ask) err(`${G}: data needs "ask", the question every round asks`);
  const W = (k) => `${G} data.${k}`;

  if (g.kind === 'which') {
    if (d.pick != null && !['max', 'min'].includes(d.pick)) err(`${W('pick')}: "max" or "min"`);
    if (d.count != null && !(Number.isInteger(d.count) && d.count >= 2 && d.count <= 4)) err(`${W('count')}: 2 to 4`);
    if (d.make && d.items) err(`${G}: give "make" (a rule) or "items" (a list), not both`);
    if (!d.make && !d.items) err(`${G}: give "make" (a rule that generates the items) or "items" (a list)`);
    if (d.make) {
      if (!MAKES.which.includes(d.make.kind)) err(`${W('make.kind')}: one of ${MAKES.which.join(', ')}`);
      if (d.make.gap != null && !range(d.make.gap)) err(`${W('make.gap')}: a number or [easy, hard]`);
      if (d.make.from != null && d.make.to != null && !(d.make.from < d.make.to)) err(`${W('make')}: "from" must be below "to"`);
      if (d.make.kind === 'tone' && ((d.make.from ?? 220) < 40 || (d.make.to ?? 880) > 8000)) err(`${W('make')}: tones between 40 and 8000 Hz`);
      if (d.make.kind === 'hsl' && d.make.vary && !['h', 's', 'l'].includes(d.make.vary)) err(`${W('make.vary')}: "h", "s" or "l"`);
      if (d.make.unit && !['semitones', 'hz'].includes(d.make.unit)) err(`${W('make.unit')}: "semitones" or "hz"`);
      const gap = Array.isArray(d.make.gap) ? Math.max(...d.make.gap) : d.make.gap;
      if (isNum(gap) && d.make.kind !== 'tone' && d.make.to != null && d.make.from != null && gap * ((d.count || 2) - 1) > d.make.to - d.make.from) err(`${W('make')}: the gap does not fit between "from" and "to"`);
    }
    if (d.items) {
      if (!Array.isArray(d.items) || d.items.length < 3) err(`${W('items')}: at least 3 items`);
      else d.items.forEach((it, k) => { checkItem(it, `${W('items')}[${k}]`, err); if (!isNum(it?.value)) err(`${W('items')}[${k}]: every item needs a numeric "value" to compare`); });
      if (Array.isArray(d.items) && new Set(d.items.map((i) => i?.value)).size < (d.count || 2)) err(`${W('items')}: need at least ${d.count || 2} different values`);
    }
  } else if (g.kind === 'match-fast') {
    const per = d.per ?? 4;
    if (!(Number.isInteger(per) && per >= 2 && per <= 6)) err(`${W('per')}: 2 to 6 pairs per board`);
    if (!Array.isArray(d.pairs) || d.pairs.length < per) err(`${W('pairs')}: at least ${per} pairs ([left, right])`);
    else d.pairs.forEach((p, k) => { if (!Array.isArray(p) || p.length !== 2) err(`${W('pairs')}[${k}]: a pair is [left, right]`); else { checkItem(p[0], `${W('pairs')}[${k}][0]`, err); checkItem(p[1], `${W('pairs')}[${k}][1]`, err); } });
    if (d.time != null && !range(d.time)) err(`${W('time')}: seconds per board, a number or [easy, hard]`);
  } else if (g.kind === 'sort-fast') {
    if (!Array.isArray(d.bins) || d.bins.length < 2 || d.bins.length > 3) err(`${W('bins')}: two or three bin names`);
    if (!Array.isArray(d.cards) || d.cards.length < 4) err(`${W('cards')}: at least 4 cards`);
    else {
      const used = new Set();
      d.cards.forEach((c, k) => {
        checkItem(c, `${W('cards')}[${k}]`, err);
        const b = typeof c?.bin === 'number' ? c.bin : (d.bins || []).indexOf(c?.bin);
        if (!(b >= 0 && b < (d.bins || []).length)) err(`${W('cards')}[${k}]: "bin" must be a bin's name or index`); else used.add(b);
      });
      if (Array.isArray(d.bins) && used.size < d.bins.length) err(`${W('cards')}: every bin needs at least one card`);
    }
    if (d.time != null && !range(d.time)) err(`${W('time')}: seconds per card, a number or [easy, hard]`);
  } else if (g.kind === 'odd-one-out') {
    if (d.groups) {
      const gs = Object.entries(d.groups);
      if (gs.length < 2) err(`${W('groups')}: at least two groups`);
      if (!gs.some(([, v]) => Array.isArray(v) && v.length >= 3)) err(`${W('groups')}: at least one group of 3 items or more`);
      gs.forEach(([k, v]) => { if (!Array.isArray(v) || !v.length) err(`${W('groups')}.${k}: a list of items`); else v.forEach((it, j) => checkItem(it, `${W('groups')}.${k}[${j}]`, err)); });
    } else if (Array.isArray(d.sets) && d.sets.length) {
      d.sets.forEach((s, k) => {
        if (!Array.isArray(s?.items) || s.items.length !== 4) err(`${W('sets')}[${k}]: four items`);
        else s.items.forEach((it, j) => checkItem(it, `${W('sets')}[${k}].items[${j}]`, err));
        if (!(Number.isInteger(s?.odd) && s.odd >= 0 && s.odd < 4)) err(`${W('sets')}[${k}]: "odd" is the index (0 to 3) of the one that does not belong`);
      });
    } else err(`${G}: give "groups" (a rule) or "sets" (listed rounds)`);
  } else if (g.kind === 'sequence') {
    if (!Array.isArray(d.pads) || d.pads.length < 3 || d.pads.length > 6) err(`${W('pads')}: 3 to 6 pads`);
    else d.pads.forEach((p, k) => { checkItem(p, `${W('pads')}[${k}]`, err); if (!p?.sound && !p?.colour) err(`${W('pads')}[${k}]: a pad needs a "sound" or a "colour"`); });
    if (d.start != null && !(Number.isInteger(d.start) && d.start >= 2 && d.start <= 6)) err(`${W('start')}: 2 to 6`);
    if (d.longest != null && !(Number.isInteger(d.longest) && d.longest >= (d.start ?? 3) && d.longest <= 12)) err(`${W('longest')}: from "start" to 12`);
  } else if (g.kind === 'estimate') {
    const s = d.scale;
    if (!s || !isNum(s.from) || !isNum(s.to) || !(s.from < s.to)) err(`${W('scale')}: { "from", "to" } with from below to`);
    else {
      if (s.log && s.from <= 0) err(`${W('scale')}: a log scale starts above 0`);
      if (s.marks && (!Array.isArray(s.marks) || s.marks.some((m) => !isNum(m) || m < s.from || m > s.to))) err(`${W('scale.marks')}: numbers inside the scale`);
    }
    if (d.make && d.items) err(`${G}: give "make" or "items", not both`);
    if (!d.make && !d.items) err(`${G}: give "make" (tone, hue, number) or "items"`);
    if (d.make && !MAKES.estimate.includes(d.make.kind)) err(`${W('make.kind')}: one of ${MAKES.estimate.join(', ')}`);
    if (d.make && s && (d.make.from ?? s.from) < s.from) err(`${W('make')}: values must stay inside the scale`);
    if (d.make && s && (d.make.to ?? s.to) > s.to) err(`${W('make')}: values must stay inside the scale`);
    if (d.items) (Array.isArray(d.items) ? d.items : []).forEach((it, k) => { checkItem(it, `${W('items')}[${k}]`, err); if (!isNum(it?.value) || (s && (it.value < s.from || it.value > s.to))) err(`${W('items')}[${k}]: a numeric "value" inside the scale`); });
    if (d.close != null && !(range(d.close) && [].concat(d.close).every((x) => x > 0 && x < 0.5))) err(`${W('close')}: shares of the scale between 0 and 0.5, e.g. [0.15, 0.05]`);
  }
  return { errors, warns };
}

export function checkGames(course = {}, { hasCode = null } = {}) {
  const errors = [], warns = [];
  const gs = course.games;
  if (gs != null && !Array.isArray(gs)) errors.push('"games" must be an array');
  const list = Array.isArray(gs) ? gs : [];
  const seen = new Set();
  for (const g of list) {
    const r = checkGame(g, course);
    errors.push(...r.errors); warns.push(...r.warns);
    if (g?.id && seen.has(g.id)) errors.push(`game "${g.id}": two games with this id`);
    if (g?.id) seen.add(g.id);
    if (g?.kind === 'custom' && hasCode && !hasCode(g.id)) errors.push(`game "${g.id}" is custom: write courses/<slug>/games/${g.id}.js (export default { mount(g) { ... } })`);
  }
  const per = {};
  for (const g of list) for (const c of g?.concepts || []) per[c] = (per[c] || 0) + 1;
  for (const [c, n] of Object.entries(per)) if (n > 3) warns.push(`concept "${c}" is practised by ${n} games: one or two per concept, three at most`);
  if (list.length > 8) warns.push(`${list.length} games: two or three are plenty for a course`);
  // withheld lines
  const wl = course.withheld;
  if (wl != null && !Array.isArray(wl)) errors.push('"withheld" must be an array');
  const ids = new Set((course.concepts || []).map((c) => c.id)), wseen = new Set();
  (Array.isArray(wl) ? wl : []).forEach((l, k) => {
    const L = `withheld ${k + 1}${l?.id ? ` ("${l.id}")` : ''}`;
    if (!l?.id) errors.push(`${L}: "id" is missing`); else if (wseen.has(l.id)) errors.push(`${L}: duplicate id`); else wseen.add(l.id);
    if (!TIERS_TOLD.includes(l?.tier)) errors.push(`${L}: "tier" must be ${TIERS_TOLD.join(', ')}`);
    if (!l?.told) errors.push(`${L}: "told" (what is finally said) is missing`);
    else if (words(l.told) > 60) warns.push(`${L}: "told" has ${words(l.told)} words; one to three sentences`);
    if (l?.by != null && l.by !== 'town' && !ids.has(l.by)) errors.push(`${L}: "by" names an unknown concept "${l.by}" (or write "town")`);
    if (l?.teaser && words(l.teaser) > 20) warns.push(`${L}: the teaser is long; it is cut off mid-sentence`);
  });
  if (Array.isArray(wl) && wl.length > 6) errors.push(`${wl.length} withheld lines: at most 6`);
  return { errors, warns };
}
