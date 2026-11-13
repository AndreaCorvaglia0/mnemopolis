// The duel of eloquence (src/mechanics/duel/): the numbers, tuned by simulation, and the rules
// around them; the tempers and lines in both languages; the feedback from traps; what winning gives.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HIT, COST, HOUSE, houseBars, leagueBars, startDuel, answer, settle, timeWinner, houseTiers, nextQuestion, leagueQuestions, feedback, missedTopics, duelDelta, simulate, mulberry } from '../src/mechanics/duel/rules.js';
import { TEMPERS, CHAMPION, TEMPER_NAMES, temperFor } from '../src/mechanics/duel/tempers.js';
import { STOCK, WORDS, CHALLENGE } from '../src/mechanics/duel/lines.js';
import { awardHouse, awardLeague, isFriendly } from '../src/mechanics/duel/prize.js';
import { QUESTIONS, PLACES, LEAGUE } from '../src/data/content.js';

const LANGS = ['en', 'it'];
const RUNS = 4000, K = 6; // runs per cell; spread of the learner's knowledge across questions (Beta concentration)
const rate = (bars, p, policy, seed = 11) => simulate({ bars, p, policy, runs: RUNS, k: K, rnd: mulberry(seed) });

test('the table of simulated win rates (printed) meets the targets', () => {
  const rows = [], pct = (x) => `${Math.round(x * 100)}%`.padStart(5);
  const cell = (bars, p, pol) => { const s = rate(bars, p, pol); return s; };
  const lines = ['', 'Simulated win rates (4000 duels per cell; learners right with probability p, knowledge spread Beta k=6)', '',
    'duel             turns | p=.4 state | p=.4 calib | p=.6 state | p=.6 calib | p=.6 reckless | p=.7 state | p=.7 calib | p=.9 state | longest'];
  for (const n of [4, 5, 6]) {
    const b = houseBars(n), r = {};
    for (const [k, p, pol] of [['s4', 0.4, 'state'], ['c4', 0.4, 'calibrated'], ['s6', 0.6, 'state'], ['c6', 0.6, 'calibrated'], ['r6', 0.6, 'reckless'], ['s7', 0.7, 'state'], ['c7', 0.7, 'calibrated'], ['s9', 0.9, 'state']]) r[k] = cell(b, p, pol);
    const longest = Math.max(...Object.values(r).map((x) => x.longest));
    lines.push(`house (${n} questions)  ${String(n).padStart(2)} | ${pct(r.s4.win)}      | ${pct(r.c4.win)}      | ${pct(r.s6.win)}      | ${pct(r.c6.win)}      | ${pct(r.r6.win)}         | ${pct(r.s7.win)}      | ${pct(r.c7.win)}      | ${pct(r.s9.win)}      | ${longest}`);
    rows.push({ n, r, longest });
  }
  const L = leagueBars(LEAGUE.size, LEAGUE.pass), lp = LEAGUE.pass, lr = {};
  for (const [k, p, pol] of [['sp', lp, 'state'], ['cp', lp, 'calibrated'], ['sq', lp + 0.15, 'state'], ['cq', lp + 0.15, 'calibrated'], ['rk', lp, 'reckless'], ['sl', lp - 0.15, 'state']]) lr[k] = rate(L, Math.min(0.99, p), pol);
  lines.push('', `League (${LEAGUE.size} turns, pass ${lp}: conviction ${L.conviction}, composure ${L.composure})`,
    `  p=pass state ${pct(lr.sp.win)} · calibrated ${pct(lr.cp.win)} · reckless ${pct(lr.rk.win)}   p=pass+.15 state ${pct(lr.sq.win)} · calibrated ${pct(lr.cq.win)}   p=pass-.15 state ${pct(lr.sl.win)}   longest ${Math.max(...Object.values(lr).map((x) => x.longest))}`, '');
  console.log(lines.join('\n'));

  for (const { n, r, longest } of rows) {
    assert.ok(longest <= Math.min(6, n), `house duel with ${n} questions lasted ${longest} turns`);
    assert.ok(r.s9.win >= 0.94, `p=.9 nearly always wins (${n}): ${r.s9.win}`);
    assert.ok(r.c6.win > r.r6.win + 0.08, `a reckless proclaimer at p=.6 does worse than a calibrated one (${n}): ${r.r6.win} vs ${r.c6.win}`);
    assert.ok(r.c7.win >= 0.7, `p=.7 calibrated usually wins (${n}): ${r.c7.win}`);
    assert.ok(r.s4.win <= 0.35 && r.c4.win <= 0.38, `p=.4 usually loses (${n}): ${r.s4.win} / ${r.c4.win}`);
  }
  // six questions: the full targets; five and four are what a small pool allows (see ENGINE.md)
  const six = rows.find((x) => x.n === 6).r;
  assert.ok(six.s7.win >= 0.72 && six.c7.win >= 0.72, `six questions: p=.7 wins about 75%: ${six.s7.win} / ${six.c7.win}`);
  assert.ok(six.s4.win <= 0.25, `six questions: p=.4 loses at least 75%: ${six.s4.win}`);
  assert.ok(rows.find((x) => x.n === 5).r.s7.win >= 0.75, 'five questions: p=.7 wins at least 75%');
  // the League: a coin flip at the pass mark, clearly winnable 15 points above
  assert.ok(lr.sp.win > 0.4 && lr.sp.win < 0.68, `League at p=pass: ${lr.sp.win}`);
  assert.ok(lr.sq.win >= 0.8 && lr.cq.win >= 0.78, `League at p=pass+.15: ${lr.sq.win} / ${lr.cq.win}`);
  assert.ok(lr.sl.win < 0.3, `League at p=pass-.15: ${lr.sl.win}`);
  assert.ok(Object.values(lr).every((x) => x.longest <= LEAGUE.size));
});

test('the League bars agree with the old pass mark when every answer is stated', () => {
  for (const size of [8, 10, 12]) for (const pass of [0.6, 0.7, 0.8]) {
    const need = Math.ceil(size * pass);
    for (let right = 0; right <= size; right++) {
      // the worst order for the player: the wrong answers first
      let d = startDuel(leagueBars(size, pass));
      for (let i = 0; i < size && !d.over; i++) d = answer(d, i >= size - right, 2);
      assert.equal(d.won, right >= need, `size ${size} pass ${pass}: ${right} right`);
    }
  }
});

test('a turn: a right answer lands the tone, a wrong one costs composure, bars never go below zero', () => {
  let d = startDuel(houseBars(6));
  d = answer(d, true, 3);
  assert.equal(d.conviction, HOUSE.conviction - HIT[3]);
  d = answer(d, false, 1);
  assert.equal(d.composure, HOUSE.composure - COST[1]);
  d = answer(d, false, 3);
  assert.equal(d.composure, 0);
  assert.equal(d.over, true);
  assert.equal(d.won, false);
  assert.equal(answer(d, true, 3), d, 'a finished duel does not move');
  assert.deepEqual([HIT[1] < HIT[2], HIT[2] < HIT[3], COST[1] < COST[2], COST[2] < COST[3]], [true, true, true, true], 'bolder is both stronger and riskier');
});

test('out of questions: the fuller bar wins; a tie goes to the player only at the pass share', () => {
  // two questions only: one right (stated), one wrong (stated)
  let d = startDuel({ conviction: 4, composure: 4, turns: 2, pass: 0.5 });
  d = answer(answer(d, true, 2), false, 2);
  assert.equal(d.how, 'time');
  assert.equal(d.won, true, 'a tie with half right at pass 0.5');
  let e = startDuel({ conviction: 4, composure: 4, turns: 2, pass: 2 / 3 });
  e = answer(answer(e, true, 2), false, 2);
  assert.equal(e.won, false, 'a tie with half right at pass 2/3');
  // fuller bar
  let f = startDuel({ conviction: 6, composure: 5, turns: 2, pass: 2 / 3 });
  f = answer(answer(f, true, 1), true, 1);
  assert.equal(f.how, 'time');
  assert.equal(f.won, true, 'two murmured rights: their bar is emptier');
  // the pool runs dry before the turns do
  const g = settle(answer(startDuel(houseBars(6)), true, 2), 0);
  assert.equal(g.over, true);
  assert.equal(g.won, timeWinner(g));
  assert.equal(timeWinner(startDuel(houseBars(6))), false, 'no answer, no win');
});

test('house questions: levels 1 and 2 first, level 3 only to fill; a friendly rematch puts the hard ones first', () => {
  const pool = [{ id: 'a', stars: 3 }, { id: 'b', stars: 1 }, { id: 'c', stars: 2 }, { id: 'd', stars: 1 }];
  const order = (friendly) => { const tiers = houseTiers(pool, friendly), asked = []; let q; while ((q = nextQuestion(tiers, asked))) asked.push(q); return asked.map((x) => x.id); };
  assert.deepEqual(order(false).at(-1), 'a', 'level 3 last');
  assert.equal(order(false).length, 4, 'no question twice');
  assert.deepEqual(order(true).slice(0, 2).sort(), ['a', 'c'], 'friendly: levels 2 and 3 first');
  assert.equal(houseBars(4).turns, 4);
  assert.equal(houseBars(9).turns, 6, 'never more than six turns');
  // every house of the example course can hold a duel of at least three turns
  for (const p of PLACES) assert.ok(QUESTIONS.filter((q) => q.topic === p.id).length >= 3, `${p.id}: fewer than 3 questions`);
});

test('League questions: levels 2 and 3, spread over the houses', () => {
  const qs = leagueQuestions(PLACES, QUESTIONS, LEAGUE.size);
  assert.equal(qs.length, Math.min(LEAGUE.size, QUESTIONS.filter((q) => q.stars >= 2).length));
  assert.ok(qs.every((q) => q.stars >= 2));
  const houses = new Set(qs.map((q) => q.topic));
  assert.equal(houses.size, Math.min(qs.length, PLACES.filter((p) => QUESTIONS.some((q) => q.topic === p.id && q.stars >= 2)).length), 'one from each house before a second from any');
});

test('feedback: the trap of the chosen wrong option, or the plain right answer', () => {
  const q = { q: '?', options: ['Yellow', 'Brown', 'Purple'], answer: 0, why: 'Lights add.', traps: [null, 'paint-mixing intuition', ''] };
  assert.deepEqual(feedback(q, 1), { right: false, trap: 'paint-mixing intuition', chosen: 'Brown', correct: 'Yellow', why: 'Lights add.' });
  assert.equal(feedback(q, 2).trap, null, 'an empty trap is no trap');
  assert.equal(feedback({ ...q, traps: undefined }, 1).trap, null, 'no traps in the course');
  assert.equal(feedback(q, 0).right, true);
  assert.equal(feedback({ ...q, why: undefined }, 1).why, null);
  // every wrong option of the example course has a trap, so every rebuttal can explain
  for (const x of QUESTIONS) x.options.forEach((_, i) => { if (i !== x.answer) assert.ok(feedback(x, i).trap, `${x.id} option ${i}: no trap`); });
  assert.deepEqual(missedTopics([{ topic: 'a' }, { topic: 'b' }, { topic: 'b' }, { topic: 'c' }], [false, false, false, true]), ['b', 'a']);
});

test('coins in a duel: the reward when right, nothing taken when wrong', () => {
  assert.equal(duelDelta(15), 15);
  assert.equal(duelDelta(-30), 0);
  assert.equal(duelDelta(0), 0);
});

test('winning: badge and key once; a rematch gives no second key; the League once', () => {
  const st = { stamps: {}, keys: {}, passedLeague: false };
  assert.equal(isFriendly(st, 'x'), false);
  assert.deepEqual(awardHouse(st, 'x'), { badge: true, key: true });
  assert.equal(isFriendly(st, 'x'), true, 'the next duel is friendly');
  assert.deepEqual(awardHouse(st, 'x'), { badge: false, key: false }, 'a rematch won gives nothing new');
  assert.deepEqual(st, { stamps: { x: true }, keys: { x: true }, passedLeague: false });
  // a save from before keys existed: the badge is there, the key comes with the next win
  const old = { stamps: { y: true } };
  assert.equal(isFriendly(old, 'y'), false);
  assert.deepEqual(awardHouse(old, 'y'), { badge: false, key: true });
  assert.deepEqual(awardLeague(st), { first: true });
  assert.deepEqual(awardLeague(st), { first: false });
  assert.equal(st.passedLeague, true);
  // leaving mid-duel: nothing is awarded (the screen calls the award only at the end of a won duel)
  const left = { stamps: {}, keys: {}, passedLeague: false };
  let d = startDuel(houseBars(5));
  d = answer(d, true, 2);
  assert.equal(d.over, false);
  assert.deepEqual(left, { stamps: {}, keys: {}, passedLeague: false });
});

test('tempers: complete in English and Italian, short, and chosen by seed or by the course', () => {
  assert.ok(TEMPER_NAMES.length >= 6);
  const check = (name, t) => {
    for (const l of LANGS) {
      const e = t[l];
      assert.ok(e, `${name}: no ${l}`);
      for (const k of ['open', 'lose', 'again', 'win']) { assert.equal(typeof e[k], 'string', `${name} ${l} ${k}`); assert.ok(e[k].length > 5 && e[k].length <= 130, `${name} ${l} ${k} too long: ${e[k]}`); }
      for (const k of ['hit', 'score']) { assert.ok(Array.isArray(e[k]) && e[k].length >= 2, `${name} ${l} ${k}`); for (const s of e[k]) assert.ok(s.length <= 80, `${name} ${l} ${k}: ${s}`); }
      assert.equal(e.hit.length, t.en.hit.length, `${name}: ${l} has as many hit lines as English`);
    }
  };
  for (const n of TEMPER_NAMES) {
    check(n, TEMPERS[n]);
    assert.match(TEMPERS[n].en.lose, /key/i, `${n}: the losing line hands over the key`);
    assert.match(TEMPERS[n].it.lose, /chiave/i, `${n}: the Italian losing line hands over the key`);
  }
  check('champion', CHAMPION);
  assert.equal(temperFor('sore', () => 0.99), 'sore', 'the course chooses');
  assert.ok(TEMPER_NAMES.includes(temperFor('grumpy', () => 0.5)), 'unknown: one by seed');
  const seeds = new Set([0, 0.2, 0.4, 0.6, 0.8, 0.99].map((r) => temperFor(undefined, () => r)));
  assert.ok(seeds.size >= 5, 'the seed spreads the tempers');
});

test('lines and words: both languages, the same keys, short stock phrases', () => {
  for (const [k, v] of Object.entries(STOCK)) for (const l of LANGS) { assert.ok(v[l].length >= 4, `${k} ${l}`); assert.equal(new Set(v[l]).size, v[l].length); for (const s of v[l]) assert.ok(s.length <= 32, s); }
  assert.deepEqual(Object.keys(WORDS.it).sort(), Object.keys(WORDS.en).sort());
  for (const l of LANGS) { assert.equal(WORDS[l].tones.length, 3); assert.equal(WORDS[l].toneHelp.length, 3); assert.ok(CHALLENGE[l].first && CHALLENGE[l].friendly); }
});

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
test('the validator accepts a known temper, warns on an unknown one, refuses a non-string', () => {
  const run = (temper) => {
    const dir = mkdtempSync(path.join(tmpdir(), 'course-'));
    cpSync(path.join(root, 'courses', 'chroma'), dir, { recursive: true });
    const f = path.join(dir, 'course.json'), c = JSON.parse(readFileSync(f, 'utf8'));
    c.concepts.find((p) => p.expert).expert.temper = temper;
    writeFileSync(f, JSON.stringify(c));
    return spawnSync('node', [path.join(root, 'skills', 'knowledge-base', 'scripts', 'validate.mjs'), dir], { encoding: 'utf8' });
  };
  const ok = run('theatrical');
  assert.equal(ok.status, 0);
  assert.doesNotMatch(ok.stdout, /temper/);
  const odd = run('grumpy');
  assert.equal(odd.status, 0);
  assert.match(odd.stdout, /temper "grumpy"/);
  assert.equal(run(3).status, 1);
});
