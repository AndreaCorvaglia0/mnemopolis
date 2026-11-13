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

// The nudge: always true. It names the first house of the learning path not yet visited (the same
// one the map marks "next"), with where it is; inside that very house, the lab; when every house is
// visited, the final check; when that is passed too, a done line.
//   g = { places: [{ id, name, order, district: { id, landmark } }], visited: {id: true},
//         passedFinal, finalName, here: districtId | null, inside: placeId | null }
export function nudgeTarget(g) {
  const next = g.places.find((p) => !g.visited[p.id]);
  if (next && g.inside === next.id) return { kind: 'here', place: next };
  if (next) return { kind: 'next', place: next };
  if (!g.passedFinal) return { kind: 'final' };
  return { kind: 'done' };
}

export function nudgeLine(g, noun, lang, pick = (l) => l[0]) {
  const t = nudgeTarget(g), list = NUDGES[t.kind][lang] || NUDGES[t.kind].en;
  const p = t.place, near = p ? (g.here && p.district?.id === g.here ? NEAR.here : NEAR[p.district?.landmark] || NEAR.here) : null;
  return { target: t, text: fill(pick(list), { n: noun, place: p?.name, near: near?.[lang] ?? near?.en, order: p?.order, final: g.finalName }) };
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
