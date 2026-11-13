// Keys of upper floors: state.keys[placeId] = true once the owner has handed it over (the duel does
// that: mechanics/duel/). For testing before then, and in the console:
//   ?keys=all  or  ?keys=wheel,context        in the address
//   __hb.giveKey('wheel')  /  __hb.giveKey('all')
import { DATA } from '../../course/_data.js';

const ids = () => (DATA.concepts || []).map((p) => p.id);
export function keysFromQuery(search = typeof location !== 'undefined' ? location.search : '') {
  const v = new URLSearchParams(search).get('keys');
  if (!v) return [];
  return v === 'all' ? ids() : v.split(',').map((s) => s.trim()).filter((k) => ids().includes(k));
}
export function grantQueryKeys(st) { st.keys ||= {}; for (const k of keysFromQuery()) st.keys[k] = true; return st; }
export function giveKeyTo(st, id) {
  st.keys ||= {};
  const list = id === 'all' ? ids() : [id];
  if (!list.every((k) => ids().includes(k))) return `no house "${id}": ${ids().join(', ')}`;
  for (const k of list) st.keys[k] = true;
  return `key${list.length > 1 ? 's' : ''} given: ${list.join(', ')}`;
}
