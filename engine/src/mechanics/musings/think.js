// Choosing what the player thinks. Pure functions, tested in Node (tests/life.test.mjs).
import { LINES, NUDGES, NEAR } from './lines.js';
import { HINTS } from '../secrets/registry.js';
import { fill } from '../config.js';

// A deck per list: lines come in a shuffled order, every line once before any repeats, and the
// first of a new round is never the last of the previous one. rand: any () => [0, 1).
export class Deck {
  constructor(rand = Math.random) { this.rand = rand; this.state = new Map(); }
  draw(key, list) {
    let s = this.state.get(key);
    if (!s || s.n !== list.length) { s = { order: [], last: -1, n: list.length }; this.state.set(key, s); }
    if (!s.order.length) {
      const o = list.map((_, i) => i);
      for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(this.rand() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
      if (o.length > 1 && o[0] === s.last) [o[0], o[1]] = [o[1], o[0]];
      s.order = o;
    }
    s.last = s.order.shift();
    return list[s.last];
  }
}

// The nudge: always true, and always the same advice as the tracker. It is built from the ONE next
// step of the main path (mechanics/quest/model.js, nextStep): the house to visit next with where it
// is, the lab of the house the player stands in, a duel, the League, the ending; after the ending,
// curiosity about what the town still hides.
//   g = { step: nextStep(state, { inside }), here: districtId | null }
//   a step's place carries { name, order, district: { id, landmark } }
export function nudgeKind(step) {
  const k = step.kind;
  if (k === 'visit' || k === 'lab') return step.here ? 'here' : k === 'lab' ? 'lab' : 'visit';
  if (k === 'duel') return step.here ? 'duelHere' : 'duel';
  if (k === 'intro') return step.place ? 'visit' : 'free';
  return k; // league, ending, free
}

export function nudgeLine(g, noun, lang, pick = (l) => l[0]) {
  const st = g.step, kind = nudgeKind(st), list = NUDGES[kind][lang] || NUDGES[kind].en;
  const p = st.place, near = p ? (g.here && p.district?.id === g.here ? NEAR.here : NEAR[p.district?.landmark] || NEAR.here) : null;
  return { target: { kind, step: st, place: p }, text: fill(pick(list), { n: noun, place: p?.name, near: near?.[lang] ?? near?.en, order: p?.order, final: g.finalName, person: st.person }) };
}

// One musing about a thing of kind `kind`. count = how many musings so far (the 4th and the 9th of
// every nine are nudges, about one in four or five); `hint` = an undiscovered secret is near.
export const isNudgeTurn = (count) => count % 9 === 3 || count % 9 === 8;
export function musing(kind, { lang = 'en', count = 0, deck = new Deck(), game = null, hint = false } = {}) {
  const e = LINES[kind] || LINES.grass, noun = (e.n?.[lang] ?? e.n?.en) || '';
  if (!e.point && isNudgeTurn(count)) {
    if (hint && count % 2 === 1) return { text: deck.draw(`hint:${lang}`, HINTS[lang] || HINTS.en), nudge: 'hint' };
    if (game) { const n = nudgeLine(game, noun, lang, (l) => deck.draw(`nudge:${lang}:${l.length}:${l[0]}`, l)); return { text: n.text, nudge: n.target.kind, target: n.target }; }
  }
  return { text: deck.draw(`${kind}:${lang}`, e[lang] || e.en), nudge: null };
}
