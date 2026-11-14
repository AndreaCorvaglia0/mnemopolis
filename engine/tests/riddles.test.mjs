// Locks (src/mechanics/riddles/): answer matching, the "go back to" thought, rewards granted once,
// the saved state, the registries, and the validator's rules for riddles.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { matches, normText, parseNumber, mentions, distance } from '../src/mechanics/riddles/match.js';
import { backTo, PRECISE_AFTER, HINT_LINES } from '../src/mechanics/riddles/hints.js';
import { attempt, openLock, ensureLocks, contentsOf } from '../src/mechanics/riddles/logic.js';
import { LOCK_KINDS, LOCK_WORDS } from '../src/mechanics/riddles/kinds.js';
import { ART } from '../src/mechanics/riddles/art.js';
import { ZONES } from '../src/gen/interior/zones.js';
import { PIECES } from '../src/gen/interior/pieces.js';
import { PAINT } from '../src/gen/interior/furniture.js';
import { LINES } from '../src/mechanics/musings/lines.js';
import { checkProgression } from '../../skills/knowledge-base/scripts/riddles.mjs';
import * as M from '../src/mechanics/riddles/match.js';

const text = (answer, extra = {}) => ({ id: 't', answer, ...extra });
const yes = (r, ...xs) => xs.forEach((x) => assert.ok(matches(r, x), `${JSON.stringify(x)} should open ${JSON.stringify(r.answer)}`));
const no = (r, ...xs) => xs.forEach((x) => assert.ok(!matches(r, x), `${JSON.stringify(x)} should NOT open ${JSON.stringify(r.answer)}`));

test('text answers: case, accents, punctuation, spaces, articles, one typo, plurals', () => {
  yes(text('magenta'), 'magenta', 'Magenta', ' MAGENTA ', 'magenta!', 'the magenta', 'a magenta', 'la magenta', 'magneta', 'mgenta', 'magentaa', 'magentas', 'magent');
  no(text('magenta'), '', '   ', 'mgnta', 'red', 'magenta red', 'cyan', 'magentaaa');
  yes(text(['simultaneous contrast', 'contrast']), 'Simultaneous contrast', 'simultaneous-contrast', 'simultaneouscontrast', 'contrast', 'contrasts', 'simultanous contrast', 'the contrast');
  no(text(['simultaneous contrast', 'contrast']), 'simultanous contrats', 'contra', 'simultaneous', 'contrast simultaneous', 'constant');
  // short words: exact (after normalisation)
  yes(text('red'), 'Red', 'red.', 'the red');
  no(text('red'), 'rad', 'reds', 'bed', 'redd');
  yes(text('cone'), 'cones', 'Cone');
  no(text('glass'), 'glas'); // no plural stripping of "ss"
  // Italian: accents and articles
  yes(text('perché'), 'perche', 'PERCHÉ', 'perchè');
  yes(text('contrasto simultaneo'), 'il contrasto simultaneo', 'Contrasto simultaneo', 'contrasto simultanio');
  yes(text("l'occhio"), 'occhio', "l'occhio", 'l occhio');
  yes(text('luminosità'), 'luminosita', 'Luminosità', 'luminosta');
  no(text('luminosità'), 'luminosa', 'luce');
  // only one typo in total
  no(text('saturation lightness'), 'saturaton lightnes');
  yes(text('saturation lightness'), 'saturaton lightness');
});

test('numbers: comma or dot, units ignored, tolerance, nothing else', () => {
  const r = { id: 'n', answer: 120, tolerance: 3, unit: '°' };
  yes(r, '120', '120°', '120 °', '120 degrees', '118', '123', '120.0', '120,4', ' 121 ');
  no(r, '', '116', '124', '12', '1200', '120 130', '12 0', 'one hundred twenty', '-120', 'x120', '120/2');
  const e = { id: 'e', answer: 128 }; // integer, no tolerance: exact
  yes(e, '128', '128.0', '128,0');
  no(e, '127', '129', '128.4');
  const d = { id: 'd', answer: 0.22 }; // decimal: half a unit of the last digit
  yes(d, '0.22', '0,22', '.22', '0.215', '0,224', '0.22 W');
  no(d, '0.23', '0.2', '22', '0.214');
  yes({ id: 'l', answer: [22, 21.6], tolerance: 0.5 }, '22%', '21,6 %', '21.5');
  assert.equal(parseNumber('3,5 m'), 3.5); assert.equal(parseNumber('-2'), -2); assert.equal(parseNumber('2-3'), null); assert.equal(parseNumber(''), null);
});

test('codes: exact digits, leading zeros, spaces and dashes ignored', () => {
  const c = { id: 'c', answer: '0451', type: 'code' };
  yes(c, '0451', '04 51', '0-4-5-1');
  no(c, '451', '04510', '0452', 'o451', '', '0451a');
  yes({ id: 'c2', answer: 1984, type: 'code' }, '1984');
  no({ id: 'c2', answer: 1984, type: 'code' }, '1984.0', '01984');
});

test('Levenshtein and normalisation helpers', () => {
  assert.equal(distance('kitten', 'sitting', 5), 3);
  assert.equal(distance('abc', 'abc'), 0);
  assert.equal(normText("  The   Grey-Wall!  "), 'grey wall');
  assert.equal(normText("L'Arcobaleno"), 'arcobaleno');
  assert.ok(mentions('Password: magenta ok', text('magenta')));
  assert.ok(!mentions('the magentas are here', text('magenta'))); // whole words only
});

const where = (lang = 'en', floor = 'up') => ({
  lang, floor, house: (id) => ({ lamps: 'Three Lamps House', context: "Dyer's House", odd: 'Magenta House' }[id] || ''),
  station: (c, s) => ({ mix: { tab: 'Three lamps', n: 0 }, grey: { tab: 'Same grey?', n: 0 }, two: { tab: 'Magenta check', n: 1 } }[s] || null),
});

test('the "go back to" thought: house first, then the spot; never the answer; varied', () => {
  for (const lang of ['en', 'it']) {
    const r = { id: 'x', place: 'wheel', answer: 'magenta', from: { concept: 'lamps', station: 'mix' } };
    const lines = Array.from({ length: 8 }, (_, i) => backTo(r, i + 1, where(lang)));
    assert.match(lines[0], /Three Lamps House/);
    assert.ok(!/Three lamps"/.test(lines[0]) && !/"Three lamps"/.test(lines[1]), 'the first misses name only the house');
    for (let i = PRECISE_AFTER - 1; i < 8; i++) assert.match(lines[i], /Three lamps|first experiment|primo esperimento/, `miss ${i + 1} names the station (${lang})`);
    assert.ok(new Set(lines).size >= 4, 'the lines vary');
    lines.forEach((l) => assert.ok(!mentions(l, r), `never the answer: ${l}`));
    // the answer is taught in this very house
    const here = { id: 'y', place: 'context', answer: ['simultaneous contrast', 'contrast'], from: { station: 'grey' } };
    assert.match(backTo(here, 1, where(lang, 'up')), lang === 'en' ? /downstairs/ : /di sotto/);
    assert.match(backTo(here, 1, where(lang, 'ground')), lang === 'en' ? /this very house/ : /questa casa/);
    assert.match(backTo(here, 3, where(lang, 'ground')), /Same grey\?|first|primo/);
    // the reading wall
    const page = { id: 'z', place: 'wheel', answer: 'hue', from: { concept: 'lamps', page: true } };
    assert.match(backTo(page, 4, where(lang)), lang === 'en' ? /reading wall|wall/ : /parete/);
  }
  // a house or a station named like the answer: the thought gets vaguer instead of telling
  const leak = { id: 'l', place: 'wheel', answer: 'magenta', from: { concept: 'odd', station: 'two' } };
  for (let i = 1; i <= 6; i++) { const l = backTo(leak, i, where()); assert.ok(!mentions(l, leak), l); assert.ok(l.length > 5); }
  for (const lang of ['en', 'it']) for (const [k, v] of Object.entries(HINT_LINES[lang])) assert.ok(v.length >= 3 || k === 'nth', `${lang} ${k}`);
});

test('attempts: misses counted and free, the right answer opens once, rewards granted once', () => {
  const st = {};
  ensureLocks(st);
  const r = { id: 'safe1', place: 'wheel', answer: 120, tolerance: 3, from: { station: 'dials' }, inside: { note: 'A note.', coins: 15, tool: 'key', key: 'lamps', station: 'adv' } };
  assert.deepEqual(attempt(st, r, '', where()).empty, true);
  assert.equal(st.tries.safe1, undefined, 'an empty answer is not a miss');
  const m1 = attempt(st, r, '99', where());
  assert.equal(m1.ok, false); assert.equal(m1.misses, 1); assert.ok(m1.thought);
  attempt(st, r, '100', where()); const m3 = attempt(st, r, '101', where());
  assert.equal(st.tries.safe1, 3); assert.equal(m3.misses, 3);
  assert.equal(st.insight, 0, 'wrong answers cost nothing');
  const ok = attempt(st, r, '121', where());
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.rewards.map((x) => x.kind).sort(), ['coins', 'key', 'tool']);
  assert.equal(st.insight, 15); assert.equal(st.tools.key, true); assert.equal(st.keys.lamps, true); assert.equal(st.locks.safe1, true);
  const again = attempt(st, r, 'anything', where());
  assert.equal(again.ok, true); assert.deepEqual(again.rewards, [], 'an opened lock stays open and gives nothing twice');
  assert.deepEqual(openLock(st, r), []);
  assert.equal(st.insight, 15);
  assert.deepEqual(contentsOf(r).map((c) => c.kind), ['note', 'station', 'coins', 'tool', 'key']);
  // saved state round trip
  const back = JSON.parse(JSON.stringify(st));
  assert.deepEqual(back.locks, { safe1: true }); assert.equal(back.tries.safe1, 3);
  assert.equal(attempt(back, r, '', where()).ok, true);
});

test('every kind of lock has its words, zone, piece, painter, close-up and musings, in English and Italian', () => {
  for (const [k, K] of Object.entries(LOCK_KINDS)) {
    for (const f of ['name', 'title', 'ask', 'open', 'doc']) for (const l of ['en', 'it']) assert.ok(K[f]?.[l], `${k}.${f}.${l}`);
    for (const l of ['en', 'it']) assert.ok(K.miss[l].length >= 2);
    assert.ok(ZONES[K.zone]?.fixture, `${k}: zone ${K.zone}`);
    assert.equal(ZONES[K.zone].back.pieces[0][0], K.piece, `${k}: the first piece of its zone is the lock`);
    assert.ok(PIECES[K.piece] && PAINT[K.piece], `${k}: piece and painter`);
    assert.ok(ART[k]?.paint, `${k}: close-up painter`);
  }
  for (const w of Object.values(LOCK_WORDS)) for (const l of ['en', 'it']) assert.ok(w[l], JSON.stringify(w));
  for (const k of ['stairs', 'safe', 'terminal', 'hatchdoor']) assert.ok(LINES[k]?.point, `musings for ${k}`);
});

// ---- the validator
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const course = () => JSON.parse(readFileSync(path.join(root, 'courses', 'chroma', 'course.json'), 'utf8'));
const check = (edit, o = {}) => { const c = course(); edit(c, (id) => c.concepts.find((p) => p.id === id)); return checkProgression(c, { match: M, tools: ['key', 'pickaxe', 'saw', 'shears'], ...o }); };

test('the validator accepts good riddles and rejects bad ones', () => {
  assert.deepEqual(check(() => {}).errors, [], 'the example course');
  const bad = (fn, re) => { const r = check(fn); assert.ok(r.errors.some((e) => re.test(e)), `expected an error ${re}: ${r.errors.join(' | ')}`); };
  const warned = (fn, re) => { const r = check(fn); assert.ok(r.warns.some((e) => re.test(e)), `expected a warning ${re}: ${r.warns.join(' | ')}`); };
  const R = (c, P) => P('wheel').riddles[0];
  bad((c, P) => { R(c, P).answer = []; }, /no accepted answer/);
  bad((c, P) => { R(c, P).answer = 'a very long answer here'; R(c, P).type = 'text'; }, /three at most/);
  bad((c, P) => { R(c, P).answer = '12 or 13'; }, /not one number/);
  bad((c, P) => { R(c, P).type = 'code'; R(c, P).answer = '12a'; }, /digits only/);
  bad((c, P) => { R(c, P).from = { station: 'nope' }; }, /from.station/);
  bad((c, P) => { R(c, P).from = { concept: 'nowhere' }; }, /from.concept/);
  bad((c, P) => { R(c, P).inside = { station: 'dials' }; }, /ground-floor station/);
  bad((c, P) => { R(c, P).inside = { station: 'nope' }; }, /not a station/);
  bad((c, P) => { R(c, P).inside = { link: 4 }; }, /further/);
  bad((c, P) => { R(c, P).inside = { tool: 'wand' }; }, /inside.tool/);
  bad((c, P) => { R(c, P).inside = { key: 'castle' }; }, /inside.key/);
  bad((c, P) => { R(c, P).inside = {}; }, /empty/);
  bad((c, P) => { P('lamps').riddles[0].id = 'marta-safe'; }, /used twice/);
  bad((c, P) => { P('lamps').lab.stations.forEach((s) => { s.advanced = true; }); }, /ground-floor lab needs/);
  warned((c, P) => { R(c, P).clue = 'The code is 120, Marta.'; }, /contains the answer/);
  warned((c, P) => { P('context').riddles[0].answer = ['simultaneouscontrastnesses']; }, /hard to type/);
  warned((c, P) => { R(c, P).kind = 'chest'; }, /will be a safe/);
  warned((c, P) => { P('print').riddles = [{ id: 'p1', kind: 'safe', clue: 'x', answer: 1, from: { page: true }, inside: { coins: 1 } }]; }, /no upper floor/);
  assert.ok(check(() => {}, { care: 'light' }).warns.some((w) => /care "light"/.test(w)));
});

test('musical signs in lock answers: # and ♯ read as sharp, ♭ as flat', () => {
  const r = { answer: ['G sharp'] };
  assert.ok(matches(r, 'G#') && matches(r, 'g♯') && matches(r, 'Gsharp'));
  assert.ok(!matches(r, 'G'));
  assert.ok(matches({ answer: ['B flat'] }, 'B♭'));
  assert.ok(!matches({ answer: ['F'] }, 'F#'));
});
