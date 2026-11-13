// Ambient life: the switches, the language and the small words of the layer. Node-safe.
//
// world.json:
//   "life": false                       everything off: the game is exactly as without this layer
//   "life": true  (or nothing)          everything on
//   "life": { "musings": true, "animals": true, "secrets": true, "obstacles": true }   parts on or off
//   "life": { "secrets": [ { "kind": "note", "text": "...", "near": "<conceptId>" } ] }
//                                       curated: secrets on, plus a note or two themed on the course
// ?nolife in the address switches everything off (for tests and comparisons).
import { DATA, WORLD } from '../course/_data.js';

const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();

export function lifeConfig(world = WORLD, nolife = q.has('nolife')) {
  const w = world?.life;
  const off = { on: false, musings: false, animals: false, secrets: false, obstacles: false, notes: [] };
  if (nolife || w === false) return off;
  const o = w && typeof w === 'object' ? w : {};
  const part = (k) => o[k] !== false;
  const notes = Array.isArray(o.secrets) ? o.secrets.filter((s) => s && s.text) : [];
  const c = { on: true, musings: part('musings'), animals: part('animals'), secrets: part('secrets'), obstacles: part('obstacles'), notes };
  c.on = c.musings || c.animals || c.secrets || c.obstacles;
  return c.on ? c : off;
}
export const LIFE = lifeConfig();

// English and Italian, by the course language; English for anything else.
export const LANG = String(DATA.language || 'en').slice(0, 2).toLowerCase() === 'it' ? 'it' : 'en';
// a registry entry { en, it } -> the string (or list) in the course language
export const tr = (v, lang = LANG) => (v && typeof v === 'object' && !Array.isArray(v) ? v[lang] ?? v.en : v);
export const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

// Words of the layer's own interface.
export const WORDS = {
  journal: { en: 'Discoveries', it: 'Scoperte' },
  count: { en: '{n} of {m}', it: '{n} di {m}' },
  sealed: { en: 'sealed', it: 'sigillato' },
  sealedNote: { en: 'Behind something that does not open yet.', it: 'Dietro qualcosa che ancora non si apre.' },
  unknown: { en: 'Not found yet', it: 'Non ancora trovato' },
  look: { en: 'Look', it: 'Guarda' },
  close: { en: 'Close', it: 'Chiudi' },
  intro: { en: 'Small things found by wandering. They count for nothing, on purpose.', it: 'Piccole cose trovate girovagando. Non contano nulla, apposta.' },
  found: { en: 'Discovery {n} of {m}', it: 'Scoperta {n} di {m}' },
  firstFound: { en: 'Noted in Discoveries (J)', it: 'Annotato nelle Scoperte (J)' },
  firstFoundTouch: { en: 'Noted in Discoveries (Menu, then Mysteries)', it: 'Annotato nelle Scoperte (Menu, poi Misteri)' },
  hintKeys: { en: 'T  think aloud  ·  J  discoveries', it: 'T  pensa ad alta voce  ·  J  scoperte' },
  hintKeysNoSecrets: { en: 'T  think aloud', it: 'T  pensa ad alta voce' },
  titleKeys: { en: 'T to think aloud about what you face', it: 'T per pensare ad alta voce su ciò che hai davanti' },
  titleTouch: { en: 'Double-tap anything else to wonder about it.', it: 'Tocca due volte qualsiasi altra cosa per rifletterci.' },
  rhyme: { en: 'The rhyme so far', it: 'La filastrocca finora' },
  try: { en: 'Space  Try the {thing}', it: 'Space  Prova {thing}' },
};
