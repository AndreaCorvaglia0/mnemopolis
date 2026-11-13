// What winning gives, on a plain state object (Node-testable). The shared contract with the rest of
// the game: state.stamps[id] (badge), state.keys[id] (key to the upper floor), state.passedLeague.
// Each is set once; a rematch after a win gives nothing new.

// A house duel won. A save from before keys existed may have the badge and no key: the key comes then.
export function awardHouse(st, id) {
  st.keys ??= {};
  const badge = !st.stamps[id], key = !st.keys[id];
  if (badge) st.stamps[id] = true;
  if (key) st.keys[id] = true;
  return { badge, key };
}

// Friendly: the house was already won (badge and key held). Level 3 may come first; nothing to give.
export const isFriendly = (st, id) => !!(st.stamps[id] && st.keys?.[id]);

export function awardLeague(st) {
  const first = !st.passedLeague;
  st.passedLeague = true;
  return { first };
}
