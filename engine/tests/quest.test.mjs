// The main path (src/mechanics/quest/): core and extra, nextStep over whole games (the example course
// and synthetic ones), the League's gate, the validator's "core" and its two time estimates, the
// strings in both languages, places seen for the map, the ending's numbers, old saves.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { questOf, isCore, hasDuel, DUEL_ROOMS } from '../src/mechanics/quest/model.js';
import { Q } from '../src/mechanics/quest/active.js';
import { Q_WORDS, trackerLine, answerLine, gateLine, introLines, listOf } from '../src/mechanics/quest/strings.js';
import { markSeen, knownAs } from '../src/mechanics/quest/townmap.js';
import { endingNumbers } from '../src/mechanics/quest/ending.js';
import { PLACES } from '../src/data/content.js';
import { rng } from '../scripts/synthetic.mjs';

const LANGS = ['en', 'it'];
const fresh = () => ({ seenIntro: false, visited: {}, done: {}, stamps: {}, keys: {}, passedLeague: false, ended: false });

// What a diligent player does about a step: the smallest action that moves it on.
function act(s, st, Qx) {
  if (st.kind === 'intro') s.seenIntro = true;
  else if (st.kind === 'visit') s.visited[st.place.id] = true;
  else if (st.kind === 'lab') { s.visited[st.place.id] = true; s.done[`${st.place.id}:${st.n}`] = true; }
  else if (st.kind === 'duel') { s.stamps[st.place.id] = true; s.keys[st.place.id] = true; }
  else if (st.kind === 'league') { assert.ok(Qx.leagueOpen(s), 'the League is proposed while closed'); s.passedLeague = true; }
  else if (st.kind === 'ending') s.ended = true;
}

// Plays a whole game and checks the sequence of steps.
function playThrough(Qx, { wander = null } = {}) {
  const s = fresh(), kinds = [], orders = [];
  for (let i = 0; i < 400; i++) {
    const st = Qx.nextStep(s);
    kinds.push(st.kind);
    if (st.place) {
      assert.ok(Qx.core.includes(st.place), `points to an extra: ${st.place.id}`);
      assert.ok(!Qx.placeProgress(st.place, s).done, `points to a finished place: ${st.place.id}`);
      orders.push(st.place.order);
      // never skips a core house: every earlier core house is done
      for (const p of Qx.core) if (p.order < st.place.order) assert.ok(Qx.placeProgress(p, s).done, `skips house ${p.order} for ${st.place.order}`);
    }
    if (st.kind === 'free') break;
    act(s, st, Qx);
    wander?.(s, i);
  }
  assert.equal(kinds[0], 'intro');
  assert.deepEqual(kinds.slice(-3), ['league', 'ending', 'free'], `ends with ${kinds.slice(-3)}`);
  for (let i = 1; i < orders.length; i++) assert.ok(orders[i] >= orders[i - 1], 'the path goes backwards');
  for (const p of Qx.core) assert.ok(Qx.placeProgress(p, s).done, `core house ${p.id} never done`);
  return { s, kinds };
}

test('the example course: core and extra as course.json says, and a whole game in order', () => {
  assert.deepEqual(Q.core.map((p) => p.id), ['lamps', 'wheel', 'context', 'cones']);
  assert.deepEqual(Q.extra.map((p) => p.id), ['print', 'history']);
  const { kinds } = playThrough(Q);
  // intro, then for each core house visit (or lab at once), its stations, its duel; league; ending; free
  assert.equal(kinds.filter((k) => k === 'duel').length, 4);
  assert.equal(kinds.filter((k) => k === 'league').length, 1);
});

test('a player who wanders, does extras and houses out of order is never pointed backwards or at an extra', () => {
  const r = rng(7);
  for (let g = 0; g < 30; g++) playThrough(Q, { wander: (s) => {
    const p = PLACES[Math.floor(r() * PLACES.length)];
    if (r() < 0.5) s.visited[p.id] = true;
    if (r() < 0.2) s.stamps[p.id] = true;
    if (r() < 0.3 && p.lab) s.done[`${p.id}:${Math.floor(r() * p.lab.stations.length)}`] = true;
  } });
});

// synthetic courses: random sizes, kinds, labs, questions and core marks
function synth(i) {
  const r = rng(i * 31 + 5), n = 3 + Math.floor(r() * 14), kinds = [...DUEL_ROOMS, 'workshop', 'museum'];
  const places = Array.from({ length: n }, (_, k) => {
    const kind = kinds[Math.floor(r() * kinds.length)], st = kind === 'museum' ? 0 : 1 + Math.floor(r() * 3);
    return { id: `p${k}`, order: k + 1, name: `Place ${k + 1}`, kind, lab: st ? { stations: Array(st).fill({}) } : undefined, questions: Array(Math.floor(r() * 5)).fill({}), host: { name: `Host${k}` }, ...(k > 0 && r() < 0.4 ? { core: false } : {}) };
  });
  return questOf({ places, guide: 'Iris', champion: 'Ada' });
}

test('synthetic courses: every game runs intro -> core houses in order -> league -> ending -> free', () => {
  for (let i = 0; i < 120; i++) {
    const Qx = synth(i);
    playThrough(Qx);
    const r = rng(i);
    playThrough(Qx, { wander: (s) => { const p = Qx.all[Math.floor(r() * Qx.all.length)]; if (r() < 0.4) s.visited[p.id] = true; if (r() < 0.15) s.stamps[p.id] = true; } });
  }
});

test('leagueOpen: every core house done, whatever the extras; houses without a duel are done when visited with their lab', () => {
  const places = [
    { id: 'a', order: 1, kind: 'lab', lab: { stations: [{}, {}] }, questions: [{}, {}, {}] },
    { id: 'w', order: 2, kind: 'workshop', lab: { stations: [{}] }, questions: [{}, {}] },
    { id: 'm', order: 3, kind: 'museum', questions: [{}, {}] },
    { id: 'q', order: 4, kind: 'lab', lab: { stations: [{}] }, questions: [{}] },
    { id: 'x', order: 5, kind: 'cave', core: false, lab: { stations: [{}] }, questions: [{}, {}] },
  ];
  const Qx = questOf({ places });
  assert.equal(hasDuel(places[0]), true);
  assert.equal(hasDuel(places[1]), false, 'the workshop has no host duel');
  assert.equal(hasDuel(places[2]), false, 'the museum has no host duel');
  assert.equal(hasDuel(places[3]), false, 'one question is not a duel');
  const s = { ...fresh(), seenIntro: true };
  assert.equal(Qx.leagueOpen(s), false);
  s.stamps.a = true;
  s.visited.w = true; assert.equal(Qx.placeProgress(places[1], s).done, false, 'the workshop needs its lab');
  s.done['w:0'] = true; s.visited.m = true; s.visited.q = true; s.done['q:0'] = true;
  assert.equal(Qx.leagueOpen(s), true, 'the extra is not needed');
  assert.deepEqual(Qx.missing({ ...fresh(), stamps: { a: true } }).map((r) => r.id), ['w', 'm', 'q']);
  // a badge always counts, even where today there is no duel (the duel module may add one)
  assert.equal(Qx.placeProgress(places[1], { ...fresh(), stamps: { w: true } }).done, true);
});

test('core and extra: unmarked means core; a course with no core left falls back to everything', () => {
  assert.equal(isCore({}), true);
  assert.equal(isCore({ core: true }), true);
  assert.equal(isCore({ core: false }), false);
  const all = questOf({ places: [{ id: 'a', order: 1 }, { id: 'b', order: 2 }] });
  assert.equal(all.core.length, 2);
  const none = questOf({ places: [{ id: 'a', order: 1, core: false }, { id: 'b', order: 2, core: false }] });
  assert.equal(none.core.length, 2, 'never stuck with an empty main path');
  // the room the player stands in: the lab, not "go to"
  const Qx = questOf({ places: [{ id: 'a', order: 1, kind: 'lab', lab: { stations: [{}] }, questions: [{}, {}] }] });
  const s = { ...fresh(), seenIntro: true };
  assert.equal(Qx.nextStep(s).kind, 'visit');
  assert.deepEqual([Qx.nextStep(s, { inside: 'a' }).kind, Qx.nextStep(s, { inside: 'a' }).here], ['lab', true]);
});

test('every string of the main path exists in English and Italian, with the same placeholders', () => {
  const walk = (o, where) => {
    if (o && typeof o === 'object' && !Array.isArray(o) && 'en' in o) {
      for (const l of LANGS) assert.ok(o[l] !== undefined && o[l] !== '', `${where}: no ${l}`);
      const holes = (v) => JSON.stringify(v).match(/\{\w+\}/g)?.sort().join() || '';
      if (!Array.isArray(o.en)) assert.equal(holes(o.it), holes(o.en), `${where}: placeholders differ`);
      else assert.equal(o.it.length, o.en.length, `${where}: lists differ in length`);
      return;
    }
    if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, `${where}.${k}`);
  };
  walk(Q_WORDS, 'Q_WORDS');
  // the lines built from steps have no holes, in both languages, over a whole game
  const s = fresh();
  for (let i = 0; i < 60; i++) {
    const st = Q.nextStep(s);
    for (const l of LANGS) for (const line of [trackerLine(st, l), answerLine(st, l)]) assert.ok(line && !/\{\w+\}/.test(line), `hole: ${line}`);
    if (st.kind === 'free') break;
    act(s, st, Q);
  }
  for (const l of LANGS) {
    assert.ok(!introLines(Q.core[0], 'Chroma Town', l).join(' ').match(/\{\w+\}/));
    assert.match(gateLine(Q.missing(fresh()), l), /4/);
  }
  assert.equal(listOf([2, 4]), '2 and 4');
  assert.equal(listOf([2, 4, 5], 'it'), '2, 4 e 5');
  assert.match(gateLine([{ order: 2, duel: true }, { order: 4, duel: true }], 'en'), /^Two experts .*houses 2 and 4\.$/);
});

test('places are seen from nearby, extras show as "?" only then, and the ending counts what is left', () => {
  const town = { BUILDINGS: [{ id: 'a', x: 10, y: 10, w: 5, h: 5 }, { id: 'b', x: 40, y: 10, w: 5, h: 5 }, { id: 'league', league: true, x: 0, y: 0, w: 8, h: 5 }] };
  const s = { seen: {} };
  assert.equal(markSeen(19, 12, s, town), true);
  assert.deepEqual(s.seen, { a: true });
  assert.equal(markSeen(19, 12, s, town), false, 'nothing new');
  assert.equal(markSeen(21, 12, { seen: {} }, town), false, 'six tiles away is not near');
  const ex = Q.extra[0];
  assert.equal(knownAs({ id: ex.id }, { visited: {}, seen: {} }), 'hidden');
  assert.equal(knownAs({ id: ex.id }, { visited: {}, seen: { [ex.id]: true } }), 'mystery');
  assert.equal(knownAs({ id: Q.core[1].id }, { visited: {}, seen: {} }), 'core');
  const n = endingNumbers({ q: { a: { seen: 3, right: 2 }, b: { seen: 1, right: 1 } }, bets: { 3: [2, 3] }, visited: { a: true }, life: { found: { s1: 1 } }, played: 600 }, [{ id: 'a' }, { id: 'b' }], [{ id: 's1' }, { id: 's2' }]);
  assert.deepEqual(n, { answered: 4, right: 3, accuracy: 75, certain: [2, 3], played: 600, left: 2 });
});

test('an old save without the new fields loads with them', async () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const { state, load } = await import('../src/systems/state.js');
  const { COURSE } = await import('../src/course/course.js');
  store.set(`mnemopolis-${COURSE.id}`, JSON.stringify({ insight: 40, stamps: { lamps: true }, visited: { lamps: true }, seenIntro: true }));
  load();
  assert.equal(state.insight, 40);
  assert.deepEqual(state.keys, {});
  assert.equal(state.ended, false);
  assert.deepEqual(state.seen, {});
  assert.equal(state.played, 0);
  assert.deepEqual([Q.nextStep(state).kind, Q.nextStep(state).place.id], ['visit', 'wheel'], 'the old save goes on where it was');
  delete globalThis.localStorage;
});

// ---- the validator ----
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const validator = path.join(root, 'skills', 'knowledge-base', 'scripts', 'validate.mjs');
function validate(edit) {
  const dir = mkdtempSync(path.join(tmpdir(), 'core-'));
  cpSync(path.join(root, 'courses', 'chroma'), dir, { recursive: true });
  const f = path.join(dir, 'course.json'), c = JSON.parse(readFileSync(f, 'utf8'));
  edit(c);
  writeFileSync(f, JSON.stringify(c));
  const r = spawnSync('node', [validator, dir], { encoding: 'utf8' });
  return { status: r.status, out: r.stdout };
}
const byId = (c, id) => c.concepts.find((p) => p.id === id);

test('the validator: "core" is a boolean, the core needs three concepts and the first one, and never requires an extra', () => {
  const ok = validate(() => {});
  assert.equal(ok.status, 0);
  assert.match(ok.out, /core path about 60 min; everything about \d+ min/);
  assert.match(ok.out, /4 core, 2 extra/);
  assert.equal(validate((c) => { byId(c, 'wheel').core = 'yes'; }).status, 1, 'a string is not a boolean');
  const first = validate((c) => { byId(c, 'lamps').core = false; });
  assert.equal(first.status, 1);
  assert.match(first.out, /first concept/);
  const few = validate((c) => { byId(c, 'wheel').core = false; byId(c, 'context').core = false; });
  assert.equal(few.status, 1);
  assert.match(few.out, /at least 3/);
  const req = validate((c) => { byId(c, 'cones').core = false; byId(c, 'print').core = true; c.relations.push({ from: 'context', to: 'cones', type: 'requires' }); });
  assert.equal(req.status, 1);
  assert.match(req.out, /requires "cones", which is extra/);
});

test('the validator warns when the core path is over an hour, and says what to do', () => {
  const all = validate((c) => { for (const p of c.concepts) delete p.core; });
  assert.equal(all.status, 0);
  assert.match(all.out, /core path is about \d+ minutes.*"core": false/);
  const m = all.out.match(/core path about (\d+) min; everything about (\d+) min/);
  assert.equal(m[1], m[2], 'everything core: the two numbers agree');
});
