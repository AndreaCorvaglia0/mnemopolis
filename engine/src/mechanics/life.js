// The scene side shared by the town and the rooms: the saved state of the layer, thinking aloud,
// finding a secret, the counts. Uses Phaser only through the scenes it is given.
import { state, save } from '../systems/state.js';
import { sfx } from '../systems/audio.js';
import { touch } from '../systems/view.js';
import { LEAGUE } from '../data/content.js';
import { Q } from './quest/active.js';
import { LIFE, LANG, tr, fill, WORDS } from './config.js';
import { Deck, musing } from './musings/think.js';
import { lifePlan } from './active.js';
import { SECRETS } from './secrets/registry.js';
import { toolsFromQuery, TOOLS } from './obstacles/kinds.js';
import { Thought } from './bubble.js';

export { LIFE, LANG, tr, fill, WORDS };
export const deck = new Deck();
let count = 0;

// what the layer keeps in the save: found secrets, paw prints, opened obstacles, tools (none yet)
export function ensureState(s = state) {
  s.life ||= { found: {}, prints: {} };
  s.life.found ||= {}; s.life.prints ||= {};
  s.tools ||= {}; s.opened ||= {};
  for (const t of toolsFromQuery()) s.tools[t] = true;
  return s;
}
// for testing the opening path: __hb.give('key')
export function give(tool) { ensureState(); if (!TOOLS[tool]) return `no tool "${tool}": ${Object.keys(TOOLS).join(', ')}`; state.tools[tool] = true; save(); return `${tool} given`; }

export const counted = () => lifePlan().secrets.filter((s) => s.kind !== 'sealed');
export const foundCount = () => counted().filter((s) => state.life?.found[s.id]).length;
export const isFound = (s) => !!state.life?.found[s.id];

export function thought(ui) { return (ui.__thought ||= new Thought(ui)); }
export function say(scene, text, o) { if (!scene.ui) return; sfx.tick(); thought(scene.ui).show(scene, text, o); }

// the facts a nudge is built from (musings/think.js)
export const gameFacts = (here = null, inside = null) => ({ step: Q.nextStep({ ...state, seenIntro: true }, { inside }), finalName: LEAGUE.name, here });

export function thinkAbout(scene, kind, { here = null, inside = null, hint = false, lines = null } = {}) {
  let text;
  if (lines) text = deck.draw(`lines:${lines[0]}`, lines);
  else text = musing(kind, { lang: LANG, count: count++, deck, game: gameFacts(here, inside), hint }).text;
  say(scene, text);
  return text;
}

// A secret is found: saved, said in the thought bubble, counted in a small toast.
export function discover(scene, s, text) {
  ensureState();
  if (state.life.found[s.id]) return false;
  state.life.found[s.id] = Date.now();
  save();
  sfx.chime?.();
  const hold = Math.max(3200, Math.min(6000, 1500 + (text?.length || 0) * 45));
  if (text) say(scene, text, { hold });
  if (s.kind !== 'sealed') {
    const n = foundCount(), m = counted().length, first = n === 1;
    scene.time.delayedCall(text ? hold + 450 : 0, () => scene.ui?.toast(first ? tr(touch.on ? WORDS.firstFoundTouch : WORDS.firstFound) : fill(tr(WORDS.found), { n, m }), '#ffcf5a'));
  }
  return true;
}
export const foundText = (s) => { const f = tr(SECRETS[s.kind].found); return Array.isArray(f) ? f[(s.msg || 0) % f.length] : f; };
