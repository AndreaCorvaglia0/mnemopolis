// What happens when the player types at a lock. Pure: it works on any state object (the saved one
// in the game, a plain object in the tests).
//
//   ensureLocks(st)                    st.locks, st.tries, st.keys, st.tools exist
//   attempt(st, riddle, input, where)  { ok, empty, misses, thought, rewards }
//   openLock(st, riddle)               marks it open; returns the rewards, granted only the first time
//   isOpenLock(st, riddle)
// Wrong answers cost nothing: they are counted in st.tries[id] only to make the thought more precise.
import { matches } from './match.js';
import { backTo } from './hints.js';

export function ensureLocks(st) {
  st.locks ||= {}; st.tries ||= {}; st.keys ||= {}; st.tools ||= {};
  if (typeof st.insight !== 'number') st.insight = 0;
  return st;
}
export const isOpenLock = (st, r) => !!st.locks?.[r.id];

// the things a riddle holds: note, station, link, coins, tool, key (see the schema)
export function contentsOf(r) {
  const i = r.inside || {}, out = [];
  if (i.note) out.push({ kind: 'note', text: i.note });
  for (const s of [].concat(i.station || [])) out.push({ kind: 'station', id: s });
  for (const l of [].concat(i.link ?? [])) out.push({ kind: 'link', index: l });
  if (i.coins) out.push({ kind: 'coins', n: i.coins });
  for (const t of [].concat(i.tool || [])) out.push({ kind: 'tool', name: t });
  for (const k of [].concat(i.key || [])) out.push({ kind: 'key', id: k });
  return out;
}

export function openLock(st, r) {
  ensureLocks(st);
  if (st.locks[r.id]) return [];
  st.locks[r.id] = true;
  const granted = [];
  for (const c of contentsOf(r)) {
    if (c.kind === 'coins') { st.insight += c.n; granted.push(c); }
    else if (c.kind === 'tool' && !st.tools[c.name]) { st.tools[c.name] = true; granted.push(c); }
    else if (c.kind === 'key' && !st.keys[c.id]) { st.keys[c.id] = true; granted.push(c); }
  }
  return granted;
}

export function attempt(st, r, input, where = {}) {
  ensureLocks(st);
  if (st.locks[r.id]) return { ok: true, misses: st.tries[r.id] || 0, rewards: [] };
  if (input == null || !String(input).trim()) return { ok: false, empty: true, misses: st.tries[r.id] || 0 };
  if (matches(r, input)) return { ok: true, misses: st.tries[r.id] || 0, rewards: openLock(st, r) };
  const misses = (st.tries[r.id] || 0) + 1;
  st.tries[r.id] = misses;
  return { ok: false, misses, thought: backTo(r, misses, where) };
}
