// Generated rooms: the public face of src/gen/interior/. Optional: world.json
// { "gen": { "interior": false } } brings back the single standard room of src/scenes/Interior.js.
//
//   planRoom(place, { theme, plan })   pure data: plan, zones, furniture, blocked tiles     (Node)
//   generateRoom(place, { theme })     planRoom + paint functions for the scene             (browser)
//   roomProblems(L), orderProblems(L)  the rules, as lists of problems (empty when fine)
//   checkRoom(L)                       throws a clear error when a rule is broken
//
// Modules, one job each: plans.js (room shapes), zones.js (groups of furniture), trades.js (who
// lives in a home), kinds.js (what each kind of building's room is like), pieces.js (furniture
// sizes), compose.js (the composition), rules.js (the rules), furniture.js and paint.js (pixels).
// Deterministic: seeded(`${place.id}:interior`). Same course, same rooms.
import { THEME } from '../core.js';
import { planRoom } from './compose.js';
import { roomProblems, orderProblems } from './rules.js';
import { PIECES } from './pieces.js';
import { PAINT, paintSignature } from './furniture.js';
import { paintBackground } from './paint.js';
import { T } from './plans.js';

export { planRoom, profileOf } from './compose.js';
export { roomProblems, orderProblems, allProblems } from './rules.js';
export { PLAN_NAMES, PLANS, UPPER_PLANS, cellAt } from './plans.js';
export { ZONES, ZONE_NAMES } from './zones.js';
export { TRADES, TRADE_NAMES } from './trades.js';
export { KINDS } from './kinds.js';
export { T };

export function checkRoom(L, theme = THEME) {
  const p = [...roomProblems(L, true), ...orderProblems(L, theme)];
  if (p.length) throw new Error(`Room of "${L.id}" (plan ${L.plan}, ${L.w} x ${L.h}): ${p.join('; ')}. See src/gen/interior/.`);
  return true;
}

const SIG_GLOW = { bigcrystal: 'glow-teal', prism: 'glow', orrery: 'glow', hearth: 'glow' };

// The room description the scene uses. Furniture comes as separate pieces ("props") so that the
// player can walk behind it.
export function generateRoom(place, o = {}) {
  const L = planRoom(place, o), C = L.palette;
  const glows = [L.lab ? [L.lab[0] * T + 8, (L.top[L.lab[0]] + 2) * T + 4, 'glow', 0.75, 'door'] : null];
  for (const d of L.wall) if (d.type === 'window') glows.push([d.x * T + d.n * 8, d.top * T + 20, 'glow-teal', 0.55, 'window']);
  for (const it of L.items) { const g = PIECES[it.type]?.glow; if (g) glows.push([it.x * T + it.fw * 8, (it.y + 1) * T - it.ph + 6, g === 'teal' ? 'glow-teal' : 'glow', 0.45, it.type]); }
  const sg = L.sig;
  if (sg.emblem || SIG_GLOW[sg.object]) glows.push([(sg.x + sg.fw / 2) * T, (sg.y + 1) * T - 30, sg.emblem ? 'glow' : SIG_GLOW[sg.object], 0.6, 'signature']);
  const props = L.items.map((it) => {
    const w = it.fw * T, b = (it.y + it.fh) * T, top = b - Math.max(it.ph + 4, it.fh * T) - 2;
    return {
      x: it.x * T - 2, y: top, w: w + 4, h: b - top, depth: b - 0.5,
      paint(ctx) { ctx.save(); ctx.translate(-(it.x * T - 2), -top); if (it.type === 'sig') paintSignature(ctx, it, C, L.dark); else PAINT[it.type](ctx, it.x * T, b, w, it, C); ctx.restore(); },
    };
  });
  return {
    generated: true, plan: L.plan, layout: L,
    w: L.w, h: L.h, blocked: L.blocked, lab: L.lab, upper: L.upper, stairs: L.stairs, locks: L.locks, exhibit: L.exhibit, master: L.master, exit: L.exit, start: L.start,
    labGlow: glows[0], glows: glows.slice(1),
    torches: L.torches.length ? L.torches : null, dark: L.dark, step: L.step, props,
    paint(ctx) { paintBackground(ctx, L, place); },
  };
}
