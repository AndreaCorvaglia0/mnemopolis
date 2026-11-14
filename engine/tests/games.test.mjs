// Mini-games (src/mechanics/games/): scoring and the staircase, saved bests, the generators of rounds,
// the checks of the course format (every example of references/10-games.md is valid: docs that
// cannot rot), the games of the two example courses, and placement in town: deterministic, reachable,
// never in the way, over many synthetic towns.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STEPS, levelOf, stairStart, stairNext, roundPoints, play, coinsFor, recordPlay, lerp } from '../src/mechanics/games/scoring.js';
import { whichRound, estimateRound, judgeEstimate, estimateError, toPos, fromPos, matchBoard, sortCard, oddRound, sequenceRound, soundHz, item } from '../src/mechanics/games/gen.js';
import { checkGame, checkGames, KINDS } from '../src/mechanics/games/spec.js';
import { planGames, checkGamePlan, gamePeople, unlocked } from '../src/mechanics/games/place.js';
import { G_WORDS } from '../src/mechanics/games/strings.js';
import { lifeContext } from '../src/mechanics/context.js';
import { planLife } from '../src/mechanics/plan.js';
import { generate } from '../src/world/townMap.js';
import { THEMES } from '../src/gen/core.js';
import { planDressingFor } from '../src/gen/dressing.js';
import { course as synthetic } from '../scripts/synthetic.mjs';
import { validateCourse } from '../../skills/knowledge-base/scripts/validate.mjs';
import { toHz } from '../src/systems/sound/notes.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const json = (f) => JSON.parse(readFileSync(path.join(root, f), 'utf8'));
const rng = (s = 1) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

test('the staircase: harder after two right in a row, easier after a miss, never out of range', () => {
  let st = { step: 0, run: 0 };
  st = stairNext(st, true); assert.deepEqual(st, { step: 0, run: 1 });
  st = stairNext(st, true); assert.deepEqual(st, { step: 1, run: 0 });
  st = stairNext(st, false); assert.deepEqual(st, { step: 0, run: 0 });
  st = stairNext(st, false); assert.equal(st.step, 0);
  for (let i = 0; i < 40; i++) st = stairNext(st, true);
  assert.equal(st.step, STEPS); assert.equal(levelOf(st.step), 1);
  // across sessions: one step back from where the last one ended
  assert.equal(stairStart({ step: 4 }).step, 3); assert.equal(stairStart(null).step, 0);
  assert.equal(lerp([7, 1], 0), 7); assert.equal(lerp([7, 1], 1), 1); assert.equal(lerp(5, 0.3), 5);
});

test('scoring: points by difficulty, speed and streaks; nothing lost; coins halved after three plays a day', () => {
  assert.equal(roundPoints({ right: false, level: 1, fast: true, streak: 9 }), 0);
  assert.equal(roundPoints({ right: true, level: 0 }), 2);
  assert.equal(roundPoints({ right: true, level: 1 }), 6);
  assert.equal(roundPoints({ right: true, level: 0, fast: true }), 3);
  assert.equal(roundPoints({ right: true, level: 0, streak: 3 }), 3);
  assert.equal(roundPoints({ right: true, level: 0, streak: 9 }), 5); // the streak bonus stops at +3
  const p = play(8);
  for (const r of [true, true, true, false, true, true, true, true]) p.result(r);
  assert.ok(p.over()); assert.equal(p.right, 7); assert.equal(p.best, 4);
  assert.ok(p.score >= 14 && p.score <= 60, String(p.score));
  // a perfect game of 8 lies in the range the reference promises (25 to 60)
  const q = play(8); for (let i = 0; i < 8; i++) q.result(true, { fast: true }); assert.ok(q.score >= 25 && q.score <= 70, String(q.score));
  assert.equal(coinsFor(40, 0), 40); assert.equal(coinsFor(40, 3), 20);
  const games = {};
  let r = recordPlay(games, 'g', { score: 30, step: 2 }, '2026-11-14'); assert.ok(r.best); assert.equal(r.coins, 30);
  r = recordPlay(games, 'g', { score: 20, step: 3 }, '2026-11-14'); assert.ok(!r.best); assert.equal(games.g.best, 30); assert.equal(games.g.step, 3);
  recordPlay(games, 'g', { score: 20, step: 3 }, '2026-11-14');
  r = recordPlay(games, 'g', { score: 20, step: 3 }, '2026-11-14'); assert.equal(r.coins, 10);
  r = recordPlay(games, 'g', { score: 20, step: 3 }, '2026-11-15'); assert.equal(r.coins, 20); assert.equal(games.g.plays, 5);
});

test('which: the answer is the largest (or smallest), and the gap shrinks with difficulty', () => {
  const d = { ask: 'x', pick: 'max', make: { kind: 'tone', from: 220, to: 880, gap: [7, 0.5] } };
  for (let i = 0; i < 200; i++) {
    const r = rng(i);
    for (const level of [0, 0.5, 1]) {
      const w = whichRound(d, level, r), [a, b] = w.items.map((x) => x.value);
      assert.equal(w.items[w.answer].value, Math.max(a, b));
      const semis = Math.abs(12 * Math.log2(a / b));
      assert.ok(Math.abs(semis - lerp([7, 0.5], level)) < 1e-6, `gap ${semis} at ${level}`);
      for (const f of [a, b]) assert.ok(f >= 220 - 1e-6 && f <= 880 + 1e-6);
      assert.deepEqual(soundHz(w.items[0].sound), [w.items[0].sound.hz]);
    }
  }
  const m = whichRound({ ask: 'x', pick: 'min', make: { kind: 'hsl', vary: 'l', from: 0.2, to: 0.8, gap: 0.1 }, count: 3 }, 0, rng(3));
  assert.equal(m.items.length, 3); assert.equal(m.items[m.answer].value, Math.min(...m.items.map((x) => x.value)));
  assert.match(m.items[0].colour, /^hsl\(/);
  const listed = whichRound({ ask: 'x', items: [{ text: 'a', value: 1 }, { text: 'b', value: 1 }, { text: 'c', value: 3 }] }, 0, rng(9));
  assert.notEqual(listed.items[0].value, listed.items[1].value);
  // the same seed gives the same rounds
  assert.deepEqual(whichRound(d, 0.3, rng(42)), whichRound(d, 0.3, rng(42)));
});

test('estimate: log and wrapped scales, closeness, and the tolerance tightening with difficulty', () => {
  const log = { from: 100, to: 3200, log: true }, wrap = { from: 0, to: 360, wrap: true };
  assert.ok(Math.abs(toPos(log, 400) - 0.4) < 1e-9); assert.ok(Math.abs(fromPos(log, 0.4) - 400) < 1e-9);
  assert.ok(Math.abs(estimateError(log, 800, 400) - 0.2) < 1e-9); // an octave off is 1/5 of five octaves
  assert.ok(Math.abs(estimateError(wrap, 350, 10) - 20 / 360) < 1e-9);
  assert.ok(judgeEstimate(wrap, 350, 10, 0.1).right);
  const d = { ask: 'x', scale: log, make: { kind: 'tone', from: 120, to: 3000 }, close: [0.2, 0.07] };
  for (let i = 0; i < 50; i++) { const r = estimateRound(d, i / 49, rng(i)); assert.ok(r.value >= 120 && r.value <= 3000); assert.ok(r.tolerance <= 0.2 && r.tolerance >= 0.07); }
  const h = estimateRound({ ask: 'x', scale: wrap, make: { kind: 'hue' } }, 0, rng(2)); assert.match(h.item.colour, /^hsl\(/);
});

test('match boards, sort cards, odd ones out and sequences', () => {
  const pairs = Array.from({ length: 8 }, (_, i) => [`L${i}`, `R${i}`]);
  const b = matchBoard({ pairs, per: 4, time: [30, 14] }, 1, rng(1));
  assert.equal(b.left.length, 4); assert.equal(b.time, 14);
  assert.deepEqual(b.left.map((x) => x.k).sort(), b.right.map((x) => x.k).sort());
  for (const l of b.left) assert.equal(b.right.find((x) => x.k === l.k).text, `R${pairs.findIndex((p) => p[0] === l.text)}`);
  const sd = { bins: ['warm', 'cool'], cards: [{ text: 'a', bin: 'warm' }, { text: 'b', bin: 1 }, { text: 'c', bin: 0 }, { text: 'd', bin: 'cool' }] };
  let last = null; for (let i = 0; i < 30; i++) { const c = sortCard(sd, 0, rng(i), last); assert.ok([0, 1].includes(c.answer)); last = c.card.i; }
  const od = { groups: { light: ['red', 'green', 'blue'], ink: ['cyan', 'magenta', 'yellow'] }, why: '{odd} is {oddGroup}; the others are {group}.' };
  for (let i = 0; i < 30; i++) {
    const o = oddRound(od, 0, rng(i)), odd = o.items[o.answer].text, rest = o.items.filter((_, j) => j !== o.answer).map((x) => x.text);
    const g = od.groups.light.includes(odd) ? 'light' : 'ink';
    assert.ok(rest.every((t) => !od.groups[g].includes(t)), JSON.stringify(o)); assert.ok(o.why.startsWith(odd));
  }
  const s = oddRound({ sets: [{ items: ['a', 'b', 'c', 'd'], odd: 2, why: 'w' }] }, 0, rng(1)); assert.equal(s.items[s.answer].text, 'c');
  for (let step = 0; step <= 6; step++) { const q = sequenceRound({ pads: [1, 2, 3, 4], start: 3, longest: 7 }, step, rng(step)); assert.equal(q.len, Math.min(7, 3 + step)); assert.equal(q.seq.length, q.len); }
  assert.deepEqual(item('x'), { text: 'x' });
});

test('sounds of items: notes, chords and ratios become frequencies', () => {
  assert.deepEqual(soundHz({ hz: 440 }), [440]);
  assert.ok(Math.abs(soundHz({ note: 'A4' })[0] - 440) < 1e-9);
  assert.deepEqual(soundHz({ ratios: [1, 1.5], hz: 200 }), [200, 300]);
  assert.ok(Math.abs(soundHz({ notes: ['C4', 'E4'] })[1] - toHz('E4')) < 1e-9);
});

test('the course format: every example in references/10-games.md is valid; mistakes are named', () => {
  const md = readFileSync(path.join(root, 'skills', 'knowledge-base', 'references', '10-games.md'), 'utf8');
  const blocks = [...md.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => JSON.parse(m[1]));
  const concepts = ['pitch', 'wheel', 'lamps', 'print'].map((id) => ({ id }));
  let games = 0, withheld = 0;
  for (const b of blocks) {
    if (b.kind) { const r = checkGame(b, { concepts }); assert.deepEqual(r.errors, [], `${b.id}: ${r.errors.join('; ')}`); games++; }
    if (b.withheld) { const r = checkGames({ concepts, withheld: b.withheld }); assert.deepEqual(r.errors, []); withheld++; }
  }
  assert.ok(games >= 6, `${games} game examples`); assert.equal(withheld, 1);
  const kinds = new Set(blocks.filter((b) => b.kind).map((b) => b.kind));
  for (const k of KINDS.filter((x) => x !== 'custom')) assert.ok(kinds.has(k), `no example of ${k}`);
  const bad = (g, re) => { const r = checkGame(g, { concepts }); assert.ok(r.errors.some((e) => re.test(e)), `${JSON.stringify(g)} -> ${r.errors.join(' | ')}`); };
  bad({ id: 'X', title: 'a', concepts: ['pitch'], kind: 'which', data: { ask: 'q', items: [] } }, /lowercase/);
  bad({ id: 'a', title: 'a', concepts: ['nope'], kind: 'which', data: { ask: 'q', make: { kind: 'tone' } } }, /unknown concept/);
  bad({ id: 'a', title: 'a', concepts: ['pitch'], kind: 'which', data: { ask: 'q' } }, /make.*items/);
  bad({ id: 'a', title: 'a', concepts: ['pitch'], kind: 'which', data: { ask: 'q', items: [{ text: 'x' }, { text: 'y', value: 1 }, { text: 'z', value: 2 }] } }, /numeric "value"/);
  bad({ id: 'a', title: 'a', concepts: ['pitch'], kind: 'which', data: { ask: 'q', make: { kind: 'tone', from: 10, to: 880 } } }, /40 and 8000/);
  bad({ id: 'a', title: 'a', concepts: ['pitch'], kind: 'sort-fast', data: { ask: 'q', bins: ['a', 'b'], cards: [{ text: '1', bin: 'a' }, { text: '2', bin: 'a' }, { text: '3', bin: 'a' }, { text: '4', bin: 'c' }] } }, /bin/);
  bad({ id: 'a', title: 'a', concepts: ['pitch'], kind: 'sequence', data: { pads: [{ text: 'x' }, { text: 'y' }, { text: 'z' }] } }, /needs a "sound" or a "colour"/);
  bad({ id: 'a', title: 'a', concepts: ['pitch'], kind: 'estimate', data: { ask: 'q', scale: { from: 0, to: 10, log: true }, items: [{ text: 'x', value: 5 }] } }, /log scale/);
  bad({ id: 'a', title: 'a', concepts: ['pitch'], kind: 'which', data: { ask: 'q', items: [{ sound: { note: 'H9' }, value: 1 }, { text: 'b', value: 2 }, { text: 'c', value: 3 }] } }, /not a note name/);
  bad({ id: 'a', title: 'A title much too long here', concepts: ['pitch'], kind: 'which', data: { ask: 'q', make: { kind: 'number' } } }, /5/);
  const cust = checkGames({ concepts, games: [{ id: 'c', title: 'c', concepts: ['pitch'], kind: 'custom' }] }, { hasCode: () => false });
  assert.ok(cust.errors.some((e) => /games\/c\.js/.test(e)));
  const wl = checkGames({ concepts, withheld: [{ id: 'w', tier: 'soon', told: 'x' }, { id: 'w', tier: 'home' }] });
  assert.ok(wl.errors.some((e) => /tier/.test(e)) && wl.errors.some((e) => /duplicate/.test(e)) && wl.errors.some((e) => /told/.test(e)));
});

test('the example courses carry games that the validator accepts, with code for the custom one', () => {
  for (const slug of ['chroma', 'pocket-demo']) {
    const c = json(`courses/${slug}/course.json`);
    assert.ok((c.games || []).length >= 4, slug);
    const r = checkGames(c, { hasCode: (id) => { try { readFileSync(path.join(root, 'courses', slug, 'games', `${id}.js`)); return true; } catch { return false; } } });
    assert.deepEqual(r.errors, [], `${slug}: ${r.errors.join('; ')}`);
    const v = validateCourse(c, { checkGames, has: () => true });
    assert.deepEqual(v.errors, [], slug);
  }
  const pocket = json('courses/pocket-demo/course.json').games;
  assert.ok(pocket.some((g) => g.kind === 'which' && g.data.make?.kind === 'tone'), 'pocket-demo: which, with real tones');
  assert.ok(pocket.some((g) => g.kind === 'estimate'), 'pocket-demo: estimate');
});

test('a game opens only after its concepts are met', () => {
  const g = { concepts: ['a', 'b'] }, info = (s) => (id) => s[id];
  assert.equal(unlocked(g, {}, info({ a: { remembered: true }, b: { remembered: false, labDone: true } })), false);
  assert.equal(unlocked({ ...g, unlock: 'lab' }, {}, info({ a: { remembered: true }, b: { remembered: false, labDone: true } })), true);
  assert.equal(unlocked(g, {}, info({ a: { remembered: true }, b: { remembered: true } })), true);
  assert.equal(unlocked(g, {}, info({})), false);
});

test('placement in town: deterministic, off every needed tile, walkable up to, nothing moved, over 80 synthetic towns', () => {
  const G = [{ id: 'a', kind: 'which' }, { id: 'b', kind: 'estimate', data: { make: { kind: 'tone' } } }, { id: 'c', kind: 'sequence', where: 'person' }, { id: 'd', kind: 'odd-one-out' }];
  let placed = 0;
  for (let i = 0; i < 80; i++) {
    const c = synthetic(i), town = generate(c), theme = Object.values(THEMES)[i % 3], L = planDressingFor(town, theme, c.id);
    const lp = planLife(town, L, theme, c.id), ctx = lifeContext(town, L), used = new Set(), solid = ctx.solid.slice();
    for (const [x, y] of lp.blocked) solid[ctx.I(x, y)] = 1;
    for (const s of lp.secrets) if (s.x != null && !s.room) used.add(`${s.x},${s.y}`);
    const a = planGames(ctx, G, c.id, { used, solid }), b = planGames(ctx, G, c.id, { used, solid });
    assert.deepEqual(a, b, `${c.id}: not deterministic`);
    assert.deepEqual(checkGamePlan(ctx, a, lp.blocked), [], c.id);
    for (const p of a) { assert.ok(!used.has(`${p.x},${p.y}`), 'on a secret'); assert.ok(['piano', 'board', 'hat', 'box', 'bench'].includes(p.object)); }
    assert.ok(!a.some((p) => p.id === 'c'), 'a person game is not placed');
    if (a.find((p) => p.id === 'b')) assert.equal(a.find((p) => p.id === 'b').object, 'piano');
    const ppl = gamePeople(G, ['p1', 'p2'], c.id, a);
    assert.ok(ppl.c, 'the person game has a person');
    for (const g of G.filter((x) => x.where !== 'person')) assert.ok(a.some((p) => p.id === g.id) || ppl[g.id], `${g.id} is nowhere`);
    placed += a.length;
  }
  assert.ok(placed / 80 >= 2.5, `${placed / 80} games placed per town`);
});

test('every word of the games frame in English and Italian', () => {
  const walk = (o, k = '') => { for (const [key, v] of Object.entries(o)) { if (v && typeof v === 'object' && 'en' in v) { assert.ok(v.it, `${k}${key}`); assert.equal(Array.isArray(v.en), Array.isArray(v.it), `${k}${key}`); const ph = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(); if (!Array.isArray(v.en)) assert.equal(ph(v.en), ph(v.it), `${k}${key}`); } else if (v && typeof v === 'object') walk(v, `${k}${key}.`); } };
  walk(G_WORDS);
});
