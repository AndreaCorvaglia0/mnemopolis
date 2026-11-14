// The story's pure logic: stages of the town, rain, the order of the mementos, the pages of the
// notebook, the word for the lighthouse door, and the schedule of the returning fog. No browser, no
// Phaser: tests/story.test.mjs drives it.

// ---- how far the town has remembered: the share of core houses remembered (0..1)
// A core house is remembered when its owner was helped to remember (state.stamps), or, for a house
// with no remembering (fewer than two questions), when it is done in the main path's sense.
export function progressOf(rows) {
  if (!rows.length) return 1;
  return rows.filter((r) => r.done).length / rows.length;
}

// cold (people curt, windows dark), thawing, warm; after the ending always warm
export function stageOf(p, ended = false) {
  if (ended) return 'warm';
  if (p < 0.3) return 'cold';
  if (p < 0.75) return 'thawing';
  return 'warm';
}

// the rain: heavy at the start, thinner with each house, gone at the ending
export function rainOf(p, ended = false) {
  if (ended) return 0;
  return Math.max(0, Math.min(1, 1 - 0.75 * p));
}

// ---- mementos: one per core house, in an order that escalates. With fewer houses: always the
// first (a page), the photograph and, last, the card; then, as houses allow, the ticket, the watch,
// the letter, the drawing, the flower. More houses than mementos: plain pages after the first.
export const MEMENTO_ORDER = ['page', 'ticket', 'flower', 'photo', 'drawing', 'letter', 'watch', 'card'];
const ADD = ['ticket', 'watch', 'letter', 'drawing', 'flower'];
export function mementoOrder(n) {
  if (n <= 0) return [];
  if (n === 1) return ['card'];
  if (n === 2) return ['page', 'card'];
  const set = new Set(['page', 'photo', 'card']);
  for (const k of ADD) { if (set.size >= n) break; set.add(k); }
  const list = MEMENTO_ORDER.filter((k) => set.has(k));
  while (list.length < n) list.splice(1, 0, 'page'); // more houses than kinds: more pages, early
  return list;
}
// house id -> memento kind, for the core houses in path order
export const mementosFor = (coreIds) => Object.fromEntries(mementoOrder(coreIds.length).map((k, i) => [coreIds[i], k]));

// ---- the notebook's pages: the concept's idea, as if you had once written it down
export function pageText(concept) {
  const s = String(concept?.idea || concept?.concept || concept?.name || '').trim();
  return s;
}

// ---- the word at the lighthouse door: world.json's, else a key word of the big idea: the longest
// word that is not a common one (ties: the first), in its plain form
const STOP = new Set(('the a an and or but of to in on at by for with from as is are was were be been it its this that these those '
  + 'what which who how why when where there their they them his her you your our we one two can not no more most less very each every '
  + 'il lo la i gli le un uno una e o ma di da in su per con tra fra che chi come quando dove non più meno ogni sono è era del della dei delle '
  + 'al alla ai alle nel nella nei nelle sul sulla questo questa quello quella loro suo sua').split(' '));
export function doorWord(bigIdea = '', override = null) {
  if (override) return override;
  const words = String(bigIdea).toLowerCase().normalize('NFC').match(/[\p{L}]+/gu) || [];
  let best = '';
  for (const w of words) if (!STOP.has(w) && w.length > best.length) best = w;
  return best || 'light';
}

// ---- the fog returns (after the ending): spaced retrieval in costume. Each house remembered keeps
// { at: last time remembered (ms), n: successful returns so far }. The interval grows: 1, 3, 7, 16
// days, then stays at 16.
export const FOG_DAYS = [1, 3, 7, 16];
export const DAY_MS = 86400000;
export const fogInterval = (n = 0) => FOG_DAYS[Math.min(n, FOG_DAYS.length - 1)] * DAY_MS;
export function fogDue(entry, now) {
  if (!entry || typeof entry.at !== 'number') return false;
  return now - entry.at >= fogInterval(entry.n || 0);
}
// a return remembered: the clock restarts and the next interval is longer
export function fogCleared(entry, now) { return { at: now, n: Math.min((entry?.n || 0) + 1, FOG_DAYS.length - 1) }; }
// first remembered (or the ending): the schedule starts at the first interval
export const fogStart = (now) => ({ at: now, n: 0 });
// the houses whose fog is due, for a fog table { id: entry }
export const foggy = (fog = {}, now) => Object.keys(fog).filter((id) => fogDue(fog[id], now));
// the two questions of a short return: bars of a small remembering
export const FOG_BARS = { conviction: 2, composure: 2, turns: 3, pass: 2 / 3 };

// Which ending plays when the player boards the ship (finale.js, ENDINGS). One function of the
// state and of what experience reads from it: `tier` (mechanics/experience: arrival, passing,
// settling, known, home) and `completion` (0..1, the share of the optional things done). Today it is
// always the bitter, identical loop; the loop itself acknowledges the tier in two lines (the keeper,
// the purser). The planned endings and exactly what would trigger them are in docs/STORY.md,
// "Endings (planned)": ENDING_RULES below states them as data, unused until they are built.
export const ENDING_RULES = [
  { ending: 'good', tier: 'home', completion: 0.8, fogCleared: 1 },
  { ending: 'hope', tier: 'known', completion: 0.5 },
];
export const BUILT_ENDINGS = new Set(['loop']);
const ORDER = ['arrival', 'passing', 'settling', 'known', 'home'];
// the ending that the rules would choose (planned), whether built or not
export function plannedEnding(s, { tier = 'arrival', completion = 0 } = {}) {
  const fog = Object.values(s?.story?.fog || {}).reduce((a, e) => a + (e?.n || 0), 0);
  for (const r of ENDING_RULES) if (ORDER.indexOf(tier) >= ORDER.indexOf(r.tier) && completion >= r.completion && fog >= (r.fogCleared || 0)) return r.ending;
  return 'loop';
}
export function endingOf(s, info = {}) {
  const e = plannedEnding(s, info);
  return BUILT_ENDINGS.has(e) ? e : 'loop';
}

// The notebook's log (notebook.js, the Clues section): what the character has learnt, in the order
// it was learnt, derived from the state (so an old save shows it too). rows: Q.coreProgress(s).
// Entries: { k: 'master' | 'remembered' | 'memento' | 'word' | 'door' | 'register' | 'tore', ... }
export function notesOf(s, rows) {
  const out = [], st = s.story || {};
  if (s.seenIntro && rows[0]) out.push({ k: 'master', id: rows[0].id, order: rows[0].order });
  rows.forEach((r, i) => {
    if (r.won) out.push({ k: 'remembered', id: r.id, order: r.order, next: rows[i + 1]?.order ?? null });
    if (st.mementos?.[r.id]) out.push({ k: 'memento', id: r.id, order: r.order, kind: st.mementos[r.id] });
  });
  if (rows.length && rows.every((r) => r.done)) out.push({ k: 'word' });
  if (st.door || s.passedLeague) out.push({ k: 'door' });
  if (s.passedLeague) out.push({ k: 'register' });
  if (s.ended) out.push({ k: 'tore' });
  return out;
}
