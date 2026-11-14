// After the ending: the fog returns (docs/STORY.md). Each remembered house keeps when it was last
// remembered; after 1, 3, 7, 16 days its windows dim and its owner is a little confused again; two
// right answers there bring it back, and the next interval is longer. The schedule is pure
// (logic.js); this keeps it in the save. ?days=N moves the clock (config.js now()).
import { state, save } from '../../systems/state.js';
import { Q } from '../quest/active.js';
import { fogDue, fogCleared, fogStart } from './logic.js';
import { now } from './config.js';
import { rememberedRow } from './stages.js';

const table = () => ((state.story ||= {}).fog ||= {});
// the schedule starts at the ending, for every house remembered by then; later ones when remembered
export function startFog(t = now()) {
  const f = table();
  for (const r of Q.progress(state)) if (rememberedRow(r) && !f[r.id]) f[r.id] = fogStart(t);
  save();
}
export function noteRemembered(id) { if (!state.ended) return; const f = table(); if (!f[id]) { f[id] = fogStart(now()); save(); } }
export const isFoggy = (id) => !!state.ended && fogDue(table()[id], now());
export function clearFog(id) { const f = table(); f[id] = fogCleared(f[id], now()); save(); }
