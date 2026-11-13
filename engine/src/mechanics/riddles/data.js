// The riddles of the active course, and what the scenes ask of them. Node-safe.
//   RIDDLES                 every riddle, with `place` (its concept) and `where`
//   RIDDLE[id]
//   riddlesIn(placeId, floor)   the locks standing on that floor of that house ('up' | 'ground')
//   whereFor(floor)         the `where` argument of backTo() and attempt() for this course
//   openedLocks(st)         the opened locks, for the discoveries page
import { DATA } from '../../course/_data.js';
import { whereOf, isGround } from '../floors/plan.js';
import { LOCK_KINDS } from './kinds.js';
import { contentsOf } from './logic.js';

export const LANG = String(DATA.language || 'en').slice(0, 2).toLowerCase() === 'it' ? 'it' : 'en';
const concepts = DATA.concepts || [];
export const RIDDLES = concepts.flatMap((p) => (p.riddles || []).map((r) => ({ ...r, place: p.id, where: whereOf(r) })));
export const RIDDLE = Object.fromEntries(RIDDLES.map((r) => [r.id, r]));
export const riddlesIn = (placeId, floor = 'ground') => RIDDLES.filter((r) => r.place === placeId && (floor === 'up' ? r.where === 'upstairs' : r.where === 'room'));

const concept = (id) => concepts.find((p) => p.id === id);
export const houseName = (id) => concept(id)?.place || concept(id)?.name || '';
export function stationInfo(conceptId, stationId) {
  const st = concept(conceptId)?.lab?.stations || [], s = st.find((x) => x.id === stationId);
  if (!s) return null;
  const list = st.filter((x) => isGround(x) === isGround(s));
  return { tab: s.tab, n: list.indexOf(s), advanced: !!s.advanced };
}
export const whereFor = (floor) => ({ lang: LANG, floor, house: houseName, station: stationInfo });

// inside.link: an index into the concept's `further` (0 = the first), or its url
export const linkOf = (p, l) => (typeof l === 'number' ? p?.further?.[l] : p?.further?.find((f) => f.url === l)) || null;

export function openedLocks(st) {
  return RIDDLES.filter((r) => st?.locks?.[r.id]).map((r) => {
    const p = concept(r.place), c = contentsOf(r);
    return {
      id: r.id, kind: r.kind, place: r.place, house: houseName(r.place), title: (LOCK_KINDS[r.kind] || LOCK_KINDS.safe).title,
      note: c.find((x) => x.kind === 'note')?.text || null,
      stations: c.filter((x) => x.kind === 'station').map((x) => ({ id: x.id, tab: p?.lab?.stations?.find((s) => s.id === x.id)?.tab || x.id })),
      links: c.filter((x) => x.kind === 'link').map((x) => linkOf(p, x.index)).filter(Boolean),
    };
  });
}
