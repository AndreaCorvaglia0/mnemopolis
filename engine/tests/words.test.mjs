// Every table of words a player reads has English and Italian, with the same {placeholders}, the
// same keys and the same number of items where order matters (docs/DESIGN.md: Italian and English
// only, chosen by the course language). A string in a scene that bypasses the tables is caught by
// the Italian screenshots (scripts/itshots.mjs), not here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORDS, w, promptOf } from '../src/data/words.js';
import { Q_WORDS } from '../src/mechanics/quest/strings.js';
import { WORDS as DUEL, STOCK, CHALLENGE } from '../src/mechanics/duel/lines.js';
import { TEMPERS, CHAMPION } from '../src/mechanics/duel/tempers.js';
import { LOCK_WORDS, LOCK_KINDS } from '../src/mechanics/riddles/kinds.js';
import { WORDS as LIFE_WORDS } from '../src/mechanics/config.js';
import { OBSTACLES, TOOLS } from '../src/mechanics/obstacles/kinds.js';
import { SECRETS, RHYME, HINTS } from '../src/mechanics/secrets/registry.js';
import { NUDGES, NEAR } from '../src/mechanics/musings/lines.js';

const holes = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

// compare the English and the Italian of one entry; problems go into out
function same(en, it, where, out) {
  if (typeof en === 'function' || typeof it === 'function') { if (typeof en !== typeof it) out.push(`${where}: a function in one language only`); return; }
  if (typeof en === 'string' || typeof it === 'string') {
    if (typeof en !== 'string' || typeof it !== 'string') return out.push(`${where}: a string in one language only`);
    if (!en.trim() || !it.trim()) out.push(`${where}: empty`);
    if (holes(en).join() !== holes(it).join()) out.push(`${where}: placeholders ${holes(en)} / ${holes(it)}`);
    return;
  }
  if (Array.isArray(en) || Array.isArray(it)) {
    if (!Array.isArray(en) || !Array.isArray(it)) return out.push(`${where}: a list in one language only`);
    if (!en.length || !it.length) return out.push(`${where}: an empty list`);
    // a list of pairs or of fixed items keeps its length; a list of lines to cycle may differ
    const fixed = en.some((x) => Array.isArray(x)) || en.length <= 3;
    if (fixed && en.length !== it.length) out.push(`${where}: ${en.length} items / ${it.length}`);
    const all = (l) => [...new Set(l.flat(2).filter((x) => typeof x === 'string').flatMap(holes))].sort().join();
    if (all(en) !== all(it)) out.push(`${where}: placeholders of the list differ`);
    if (fixed) en.forEach((x, i) => it[i] !== undefined && same(x, it[i], `${where}[${i}]`, out));
    return;
  }
  if (en && typeof en === 'object') {
    if (!it || typeof it !== 'object') return out.push(`${where}: an object in one language only`);
    const a = Object.keys(en).sort().join(), b = Object.keys(it).sort().join();
    if (a !== b) out.push(`${where}: keys differ (${a} / ${b})`);
    for (const k of Object.keys(en)) if (k in it) same(en[k], it[k], `${where}.${k}`, out);
  }
}
// walk a table: wherever an entry has `en`, it must have `it`
function walk(node, where, out) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return;
  if ('en' in node || 'it' in node) {
    if (!('en' in node) || !('it' in node)) out.push(`${where}: only ${'en' in node ? 'en' : 'it'}`);
    else same(node.en, node.it, where, out);
    return;
  }
  for (const [k, v] of Object.entries(node)) walk(v, `${where}.${k}`, out);
}

const TABLES = { words: WORDS, quest: Q_WORDS, duel: DUEL, stock: STOCK, challenge: CHALLENGE, tempers: TEMPERS, champion: CHAMPION, locks: LOCK_WORDS, lockKinds: LOCK_KINDS, life: LIFE_WORDS, obstacles: OBSTACLES, tools: TOOLS, secrets: SECRETS, rhyme: RHYME, hints: HINTS, nudges: NUDGES, near: NEAR };

test('every table of player-facing words has English and Italian with the same placeholders', () => {
  const out = [];
  for (const [name, t] of Object.entries(TABLES)) walk(t, name, out);
  assert.deepEqual(out, []);
});

test('the lab frame has both languages with the same keys', async () => {
  let STRINGS;
  try { ({ STRINGS } = await import('../src/lab/shell.js')); } catch (e) { return; } // needs a DOM
  const out = [];
  same(STRINGS.en, STRINGS.it, 'lab', out);
  assert.deepEqual(out, []);
});

test('the checker itself catches a missing language and a lost placeholder', () => {
  const out = [];
  walk({ a: { en: 'Hello {name}' }, b: { en: 'Go to {place}', it: 'Vai a {posto}' }, c: { en: ['x', 'y'], it: ['x'] } }, 't', out);
  assert.equal(out.length, 3);
});

test('w() fills placeholders and falls back to the key; prompts follow the input', () => {
  assert.equal(w('town.talkTo', { name: 'Lux' }, 'en'), 'Talk to Lux');
  assert.equal(w('town.talkTo', { name: 'Lux' }, 'it'), 'Parla con Lux');
  assert.equal(w('nothing.here'), 'nothing.here');
  assert.equal(promptOf('Leggi', false, 'it'), 'Spazio  Leggi');
  assert.equal(promptOf('Leggi', true, 'it'), 'Tocca qui: Leggi');
});
