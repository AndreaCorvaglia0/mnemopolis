// A station with "ready": { "kind": ..., ...data } and no code of its own: the engine mounts the
// pattern with the data. Its tasks tick by their "when" (the frame passes them as station.when).
import { PATTERN_FNS } from './index.js';

export const readyMount = (st) => async (ctx) => {
  const f = PATTERN_FNS[st.ready?.kind];
  if (!f) { ctx.stage.append(Object.assign(document.createElement('div'), { className: 'lab-box', style: 'padding:24px;color:#ffb3a8', textContent: `Unknown ready-made lab "${st.ready?.kind}".` })); return; }
  f(ctx, st.ready, st.when);
};
