// The duel (remembering, in the story) (src/mechanics/duel/): the numbers, tuned by simulation, and the rules
// around them; the tempers and lines in both languages; the feedback from traps; what winning gives.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HIT, COST, houseBars, leagueBars, startDuel, answer, settle, timeWinner, houseTiers, nextQuestion, leagueQuestions, feedback, missedTopics, coinsFor, simulate, mulberry } from '../src/mechanics/duel/rules.js';
import { R_TEMPERS, KEEPER, REMEMBER, REMEMBER_STOCK, REMEMBER_CHALLENGE } from '../src/mechanics/story/words.js';
import { TEMPERS, CHAMPION, TEMPER_NAMES, temperFor } from '../src/mechanics/duel/tempers.js';
import { STOCK, WORDS, CHALLENGE } from '../src/mechanics/duel/lines.js';
import { awardHouse, awardLeague, isFriendly } from '../src/mechanics/duel/prize.js';
import { QUESTIONS, PLACES, LEAGUE } from '../src/data/content.js';

const LANGS = ['en', 'it'];
const RUNS = 4000, K = 6; // runs per cell; spread of the learner's knowledge across questions (Beta concentration)
const rate = (bars, p, seed = 11) => simulate({ bars, p, runs: RUNS, k: K, rnd: mulberry(seed) });

test('the table of simulated win rates (printed) meets the targets', () => {
  const pct = (x) => `${Math.round(x * 100)}%`.padStart(5), P = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  const lines = ['', 'Simulated success rates (4000 per cell; one right = one piece, one wrong = one step; learners right with probability p, spread Beta k=6)', '',
    `remembering         need/slips | ${P.map((p) => `p=${p}`.padEnd(6)).join(' | ')} | longest`];
  const rows = [];
  for (const n of [3, 4, 5, 6]) {
    const b = houseBars(n), r = Object.fromEntries(P.map((p) => [p, rate(b, p)]));
    const longest = Math.max(...Object.values(r).map((x) => x.longest));
    lines.push(`house, ${n} questions    ${b.conviction} right / ${b.composure} wrong | ${P.map((p) => pct(r[p].win).padEnd(6)).join(' | ')} | ${longest}`);
    rows.push({ n, r, longest });
  }
  const L = leagueBars(LEAGUE.size, LEAGUE.pass), lp = LEAGUE.pass, lr = {};
  for (const [k, p] of [['p', lp], ['q', lp + 0.15], ['l', lp - 0.15]]) lr[k] = rate(L, Math.min(0.99, p));
  lines.push('', `The keeper (${LEAGUE.size} turns, pass ${lp}: ${L.conviction} right before ${L.composure} wrong)`,
    `  p=pass ${pct(lr.p.win)}   p=pass+.15 ${pct(lr.q.win)}   p=pass-.15 ${pct(lr.l.win)}   longest ${Math.max(...Object.values(lr).map((x) => x.longest))}`, '');
  console.log(lines.join('\n'));

  for (const { n, r, longest } of rows) {
    assert.ok(longest <= Math.min(6, n), `a remembering with ${n} questions lasted ${longest} turns`);
    assert.ok(r[0.9].win >= 0.9, `p=.9 nearly always succeeds (${n}): ${r[0.9].win}`);
    if (n >= 5) assert.ok(r[0.7].win >= 0.7, `p=.7 usually succeeds (${n}): ${r[0.7].win}`);
    if (n >= 4) assert.ok(r[0.4].win <= 0.35, `p=.4 usually does not (${n}): ${r[0.4].win}`);
    for (let i = 1; i < P.length; i++) assert.ok(r[P[i]].win >= r[P[i - 1]].win - 0.02, 'knowing more never makes it harder');
  }
  const six = rows.find((x) => x.n === 6).r;
  assert.ok(six[0.7].win >= 0.7 && six[0.4].win <= 0.2, `six questions: p=.7 ${six[0.7].win}, p=.4 ${six[0.4].win}`);
  // the keeper: a coin flip at the pass mark, clearly winnable 15 points above
  assert.ok(lr.p.win > 0.4 && lr.p.win < 0.7, `keeper at p=pass: ${lr.p.win}`);
  assert.ok(lr.q.win >= 0.8, `keeper at p=pass+.15: ${lr.q.win}`);
  assert.ok(lr.l.win < 0.3, `keeper at p=pass-.15: ${lr.l.win}`);
  assert.ok(Object.values(lr).every((x) => x.longest <= LEAGUE.size));
});

test('the League bars are exactly the pass mark', () => {
  for (const size of [8, 10, 12]) for (const pass of [0.6, 0.7, 0.8]) {
    const need = Math.ceil(size * pass);
    for (let right = 0; right <= size; right++) {
      // the worst order for the player: the wrong answers first
      let d = startDuel(leagueBars(size, pass));
      for (let i = 0; i < size && !d.over; i++) d = answer(d, i >= size - right);
      assert.equal(d.won, right >= need, `size ${size} pass ${pass}: ${right} right`);
    }
  }
});

test('a turn: a right answer is one piece, a wrong one one step; a remembering is always decided in its turns', () => {
  assert.equal(HIT, 1); assert.equal(COST, 1);
  const b = houseBars(6);
  assert.deepEqual([b.conviction, b.composure, b.turns], [4, 3, 6], 'six questions: four right before three wrong');
  let d = startDuel(b);
  d = answer(d, true);
  assert.equal(d.conviction, b.conviction - 1);
  d = answer(d, false);
  assert.equal(d.composure, b.composure - 1);
  d = answer(answer(d, false), false);
  assert.equal(d.composure, 0);
  assert.equal(d.over, true);
  assert.equal(d.won, false);
  assert.equal(answer(d, true), d, 'a finished remembering does not move');
  for (let n = 1; n <= 9; n++) {
    const hb = houseBars(n);
    for (let mask = 0; mask < 1 << hb.turns; mask++) {
      let e = startDuel(hb);
      for (let i = 0; i < hb.turns && !e.over; i++) e = answer(e, !!(mask & (1 << i)));
      assert.ok(e.over && e.how !== 'time', `${n} questions: decided by a bar, not by the clock`);
    }
  }
});

test('out of questions: the fuller bar wins; a tie goes to the player only at the pass share', () => {
  let d = startDuel({ conviction: 2, composure: 2, turns: 2, pass: 0.5 });
  d = answer(answer(d, true), false);
  assert.equal(d.how, 'time');
  assert.equal(d.won, true, 'a tie with half right at pass 0.5');
  let e = startDuel({ conviction: 2, composure: 2, turns: 2, pass: 2 / 3 });
  e = answer(answer(e, true), false);
  assert.equal(e.won, false, 'a tie with half right at pass 2/3');
  const g = settle(answer(startDuel(houseBars(6)), true), 0);
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

test('League questions: levels 2 and 3, spread over the core houses, never an extra', async () => {
  const { Q } = await import('../src/mechanics/quest/active.js');
  const qs = leagueQuestions(Q.core, QUESTIONS, LEAGUE.size), core = new Set(Q.core.map((p) => p.id));
  assert.equal(qs.length, Math.min(LEAGUE.size, QUESTIONS.filter((q) => q.stars >= 2 && core.has(q.topic)).length));
  assert.ok(qs.every((q) => q.stars >= 2));
  assert.ok(qs.every((q) => core.has(q.topic)), 'the League asks only about the main path');
  const houses = new Set(qs.map((q) => q.topic));
  assert.equal(houses.size, Math.min(qs.length, Q.core.filter((p) => QUESTIONS.some((q) => q.topic === p.id && q.stars >= 2)).length), 'one from each house before a second from any');
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

test('coins: by the level of the question when right, nothing taken when wrong', () => {
  assert.equal(coinsFor({ stars: 1 }, true), 10);
  assert.equal(coinsFor({ stars: 3 }, true), 30);
  assert.equal(coinsFor({ stars: 3 }, false), 0);
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
  d = answer(d, true);
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
  // the story's tempers: the same names, both languages, the key handed over when they remember
  for (const n of TEMPER_NAMES) {
    assert.ok(R_TEMPERS[n], `story temper ${n}`);
    check(`story ${n}`, R_TEMPERS[n]);
    assert.match(R_TEMPERS[n].en.lose, /key/i); assert.match(R_TEMPERS[n].it.lose, /chiave/i);
  }
  check('keeper', KEEPER);
  assert.equal(temperFor('sore', () => 0.99), 'sore', 'the course chooses');
  assert.ok(TEMPER_NAMES.includes(temperFor('grumpy', () => 0.5)), 'unknown: one by seed');
  const seeds = new Set([0, 0.2, 0.4, 0.6, 0.8, 0.99].map((r) => temperFor(undefined, () => r)));
  assert.ok(seeds.size >= 5, 'the seed spreads the tempers');
});

test('lines and words: both languages, the same keys, short stock phrases', () => {
  for (const [k, v] of Object.entries(STOCK)) for (const l of LANGS) { assert.ok(v[l].length >= 4, `${k} ${l}`); assert.equal(new Set(v[l]).size, v[l].length); for (const s of v[l]) assert.ok(s.length <= 32, s); }
  assert.deepEqual(Object.keys(WORDS.it).sort(), Object.keys(WORDS.en).sort());
  for (const l of LANGS) { assert.ok(!('tones' in WORDS[l]) && !/how sure|quanto sei sicur/i.test(JSON.stringify(WORDS[l])), 'no tone, no "how sure"'); assert.ok(CHALLENGE[l].first && CHALLENGE[l].friendly); assert.ok(REMEMBER_CHALLENGE[l].first.includes('{name}')); }
  assert.deepEqual(Object.keys(REMEMBER.it).sort(), Object.keys(REMEMBER.en).sort());
  assert.deepEqual(Object.keys(REMEMBER.en).sort(), Object.keys(WORDS.en).filter((k) => !['wrongWas', 'fails', 'nextKey'].includes(k)).sort().filter((k) => k in REMEMBER.en));
  for (const [k, v] of Object.entries(REMEMBER_STOCK)) for (const l of LANGS) { assert.ok(v[l].length >= 4, `${k} ${l}`); for (const s of v[l]) assert.ok(s.length <= 32, s); }
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
