// The story (src/mechanics/story/, docs/STORY.md), its pure parts: the stage of the town and its rain
// from progress, the order of the mementos for any number of houses, the returning fog's schedule,
// the pages from the course, the word at the lighthouse door, every word in English and Italian, and
// the story switched off giving the plain town.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stageOf, rainOf, progressOf, mementoOrder, mementosFor, MEMENTO_ORDER, pageText, doorWord, fogInterval, fogDue, fogCleared, fogStart, foggy, FOG_DAYS, DAY_MS, FOG_BARS } from '../src/mechanics/story/logic.js';
import { S_WORDS, Q_STORY, REMEMBER, R_TEMPERS, KEEPER, NUDGES_STORY } from '../src/mechanics/story/words.js';
import { storyConfig, STORY } from '../src/mechanics/story/config.js';
import { questOf } from '../src/mechanics/quest/model.js';
import { Q_BASE, Q_WORDS, mergeWords, trackerLine, answerLine } from '../src/mechanics/quest/strings.js';
import { floorsOf } from '../src/mechanics/floors/plan.js';
import { generate } from '../src/world/townMap.js';
import { COURSE } from '../src/course/course.js';
import { PLACES } from '../src/data/content.js';
import { startDuel, answer } from '../src/mechanics/duel/rules.js';
import { matches } from '../src/mechanics/riddles/match.js';

const LANGS = ['en', 'it'];

test('the town warms with progress: cold, thawing, warm; the rain thins and stops at the ending', () => {
  assert.equal(stageOf(0), 'cold'); assert.equal(stageOf(0.25), 'cold');
  assert.equal(stageOf(0.5), 'thawing'); assert.equal(stageOf(0.74), 'thawing');
  assert.equal(stageOf(0.75), 'warm'); assert.equal(stageOf(1), 'warm');
  assert.equal(stageOf(0, true), 'warm', 'after the ending everyone is warm');
  assert.equal(rainOf(0), 1);
  for (let p = 0; p < 1; p += 0.1) assert.ok(rainOf(p + 0.1) < rainOf(p), 'thinner with every house');
  assert.ok(rainOf(1) > 0 && rainOf(1) < 0.3, 'still a drizzle before the lighthouse');
  assert.equal(rainOf(0.5, true), 0, 'none after the ending');
  assert.equal(progressOf([{ done: true }, { done: false }, { done: true }, { done: false }]), 0.5);
  assert.equal(progressOf([]), 1);
});

test('mementos: one per core house, escalating, always the first a page and the last the card', () => {
  assert.deepEqual(mementoOrder(8), MEMENTO_ORDER);
  assert.deepEqual(mementoOrder(3), ['page', 'photo', 'card'], 'few houses: the first, the photograph and the card');
  assert.deepEqual(mementoOrder(1), ['card']);
  assert.deepEqual(mementoOrder(2), ['page', 'card']);
  assert.deepEqual(mementoOrder(0), []);
  for (let n = 3; n <= 14; n++) {
    const m = mementoOrder(n);
    assert.equal(m.length, n, `${n} houses`);
    assert.equal(m[0], 'page'); assert.equal(m.at(-1), 'card');
    assert.ok(m.includes('photo'), 'the photograph always');
    const rank = m.filter((k, i) => k !== 'page' || i === 0).map((k) => MEMENTO_ORDER.indexOf(k));
    for (let i = 1; i < rank.length; i++) assert.ok(rank[i] > rank[i - 1], `${n}: the order escalates (${m})`);
    assert.equal(new Set(m.filter((k) => k !== 'page')).size, m.filter((k) => k !== 'page').length, 'no other memento twice');
  }
  assert.deepEqual(mementosFor(['a', 'b', 'c', 'd']), { a: 'page', b: 'ticket', c: 'photo', d: 'card' });
  for (const k of MEMENTO_ORDER) for (const l of LANGS) assert.ok(S_WORDS.mementos[k].title[l] && S_WORDS.mementos[k].thought[l], `${k} ${l}`);
  // "This is my handwriting" comes late, never in the first half
  const late = MEMENTO_ORDER.indexOf('letter');
  assert.ok(late >= MEMENTO_ORDER.length / 2 && /handwriting/.test(S_WORDS.mementos.letter.thought.en) && /calligrafia/.test(S_WORDS.mementos.letter.thought.it));
  assert.match(S_WORDS.mementos.card.thought.en, /\{name\}/);
});

test('the fog returns after 1, 3, 7, 16 days, longer after each return; a pure schedule', () => {
  assert.deepEqual(FOG_DAYS, [1, 3, 7, 16]);
  const t0 = Date.UTC(2026, 10, 13);
  let e = fogStart(t0);
  assert.equal(fogDue(e, t0 + DAY_MS - 1), false);
  assert.equal(fogDue(e, t0 + DAY_MS), true);
  e = fogCleared(e, t0 + DAY_MS);
  assert.equal(fogInterval(e.n), 3 * DAY_MS);
  assert.equal(fogDue(e, t0 + 3 * DAY_MS), false);
  assert.equal(fogDue(e, t0 + 4 * DAY_MS), true);
  for (let i = 0; i < 6; i++) e = fogCleared(e, t0);
  assert.equal(fogInterval(e.n), 16 * DAY_MS, 'it stays at sixteen days');
  assert.equal(fogDue(undefined, t0), false, 'a house never remembered has no fog to return');
  assert.deepEqual(foggy({ a: fogStart(t0), b: fogStart(t0 + 5 * DAY_MS) }, t0 + 2 * DAY_MS), ['a']);
  // the short return: two right answers, decided in at most three questions
  let d = startDuel(FOG_BARS); d = answer(answer(d, true), true);
  assert.ok(d.over && d.won);
  d = answer(answer(startDuel(FOG_BARS), false), false);
  assert.ok(d.over && !d.won);
});

test('the pages come from the course: each concept\'s idea; the word at the door from the big idea', () => {
  for (const p of PLACES) assert.equal(pageText(p), p.idea);
  assert.equal(pageText({ concept: 'Additive mixing' }), 'Additive mixing', 'a concept without an idea: its name');
  assert.equal(doorWord('Colour is three numbers: three lights on a screen, three signals in the eye.'), 'numbers');
  assert.equal(doorWord('Il suono è una spinta che passa da molecola a molecola.'), 'molecola');
  assert.equal(doorWord('anything', 'tide'), 'tide', 'world.json may choose it');
  const w = doorWord(COURSE.bigIdea), r = { answer: [w] };
  assert.ok(w.length >= 4);
  assert.ok(matches(r, w.toUpperCase()) && matches(r, ` ${w} `), 'matched with tolerance');
  if (w.length >= 6) assert.ok(matches(r, w.slice(0, -1) + (w.at(-1) === 'x' ? 'y' : 'x')), 'one typo');
});

// every leaf { en, it } of a table: both languages, the same {placeholders}, lists of the same length
function walk(o, where, out = []) {
  if (o && typeof o === 'object' && !Array.isArray(o) && ('en' in o || 'it' in o)) {
    for (const l of LANGS) assert.ok(o[l] !== undefined && o[l] !== '', `${where}: no ${l}`);
    const holes = (v) => JSON.stringify(v).match(/\{\w+\}/g)?.sort().join() || '';
    if (Array.isArray(o.en)) { assert.equal(o.it.length, o.en.length, `${where}: lists differ`); o.en.forEach((s, i) => assert.equal(holes(o.it[i]), holes(s), `${where}[${i}]: placeholders`)); }
    else if (typeof o.en === 'string') assert.equal(holes(o.it), holes(o.en), `${where}: placeholders differ`);
    out.push(o);
    return out;
  }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, `${where}.${k}`, out);
  return out;
}

test('every word of the story in English and Italian, the same placeholders; spare captions, no exclamation marks', () => {
  const leaves = walk(S_WORDS, 'S_WORDS');
  walk(Q_STORY, 'Q_STORY'); walk(NUDGES_STORY, 'NUDGES_STORY');
  assert.ok(leaves.length > 60);
  for (const o of leaves) for (const l of LANGS) for (const s of [].concat(o[l])) {
    if (typeof s !== 'string') continue;
    assert.ok(!s.includes('!'), `no exclamation marks in the story's own words: ${s}`);
    assert.ok(s.length <= 140, `short: ${s}`);
  }
  // captions are one sentence each
  for (const k of ['opening', 'notebook', 'turn', 'leaving', 'climb', 'understood']) for (const l of LANGS) for (const s of S_WORDS[k][l]) assert.ok((s.match(/[.?]\s/g) || []).length === 0, `one sentence: ${s}`);
  assert.deepEqual(Object.keys(REMEMBER.it).sort(), Object.keys(REMEMBER.en).sort());
  for (const t of Object.values(R_TEMPERS)) assert.deepEqual(Object.keys(t.it).sort(), Object.keys(t.en).sort());
  assert.deepEqual(Object.keys(KEEPER.it).sort(), Object.keys(KEEPER.en).sort());
  // the tracker has a line for the step "look upstairs", and no hole in it
  for (const l of LANGS) {
    const st = { kind: 'memento', place: { name: 'Dyer\'s House' }, order: 3 };
    assert.equal(trackerLine(st, l), STORY.on ? (l === 'en' ? 'House 3: look upstairs' : 'Casa 3: guarda di sopra') : trackerLine(st, l));
    assert.ok(!/\{\w+\}/.test(answerLine({ ...st, place: { name: 'X', district: {} } }, l, { gate: false })));
  }
});

test('the story switched off is the plain town: no harbour, no attic, no memento step, the plain words', () => {
  assert.equal(storyConfig({ story: false }).on, false);
  assert.equal(storyConfig({}).on, true, 'on by default');
  assert.equal(storyConfig({}, new URLSearchParams('?story=0')).on, false);
  assert.deepEqual(storyConfig({ story: { word: ' tide ', ship: false } }), { on: true, ship: false, word: 'tide' });
  // the town
  const plain = generate(COURSE, { harbour: false }), story = generate(COURSE, { harbour: true });
  assert.equal(plain.HARBOUR, null);
  assert.ok(story.HARBOUR, 'the example course gets its quay');
  assert.equal(story.GATE, null, 'the harbour replaces the gate');
  assert.deepEqual(plain.BUILDINGS.map((b) => b.id), story.BUILDINGS.map((b) => b.id));
  // the main path: a memento step only with mementos
  const places = [{ id: 'a', order: 1, kind: 'lab', lab: { stations: [{}] }, questions: [{}, {}] }, { id: 'b', order: 2, kind: 'lab', lab: { stations: [{}] }, questions: [{}, {}] }];
  const s = { seenIntro: true, visited: { a: true }, done: { 'a:0': true }, stamps: { a: true }, keys: { a: true } };
  assert.equal(questOf({ places }).nextStep(s).place.id, 'b');
  const withM = questOf({ places, mementos: new Set(['a', 'b']) });
  assert.deepEqual([withM.nextStep(s).kind, withM.nextStep(s).place.id], ['memento', 'a']);
  assert.equal(withM.nextStep({ ...s, story: { mementos: { a: 'page' } } }).place.id, 'b');
  // floors: an attic only when the story asks for it
  assert.equal(floorsOf({ kind: 'lab' }).up, false);
  assert.equal(floorsOf({ kind: 'lab', attic: true }).up, true);
  assert.equal(floorsOf({ kind: 'workshop', attic: true }).up, false, 'the workshop has no upstairs: its owner hands the memento over');
  // the words
  assert.equal(mergeWords(Q_BASE, {}).tracker.league.en, Q_BASE.tracker.league.en);
  assert.equal(Q_WORDS.tracker.league.en, STORY.on ? 'Go to the lighthouse' : Q_BASE.tracker.league.en);
  assert.equal(mergeWords(Q_BASE, Q_STORY).tracker.visit, Q_BASE.tracker.visit, 'what the story does not change stays');
});
