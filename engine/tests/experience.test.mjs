// Experience (src/mechanics/experience/): one number that never goes down, tiers that scale with the
// course (the first change inside the first house, the top at about everything plus practice), old
// saves migrated, the notable thing just done, a tier change announced once, withheld lines dealt to
// people and told at their tier, the remarks in both languages, canEnter, and endingOf's new inputs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { experienceOf, scaleOf, tiersOf, tierOf, tierOfXp, syncXp, ensureXp, completionOf, signals, streakOf, noticeOf, tally, XP, TIERS, atLeast, canEnterAt, dayKey } from '../src/mechanics/experience/model.js';
import { XLINES, GROUP } from '../src/mechanics/experience/lines.js';
import { GENERIC, withheldFor, assign, pending } from '../src/mechanics/experience/withheld.js';
import { endingOf, plannedEnding, ENDING_RULES } from '../src/mechanics/story/logic.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const json = (f) => JSON.parse(readFileSync(path.join(root, f), 'utf8'));
const COURSES = { chroma: json('courses/chroma/course.json'), pocket: json('courses/pocket-demo/course.json') };
const fresh = () => ({ insight: 0, stamps: {}, done: {}, keys: {}, locks: {}, opened: {}, life: { found: {} }, story: {}, passedLeague: false });

// a simulated player: the main path house by house, answering right (coins 10 x level)
function playHouse(s, c, i, { right = 4 } = {}) {
  const p = c.concepts[i];
  (p.lab?.stations || []).filter((x) => !x.advanced).forEach((_, k) => { s.done[`${p.id}:${k}`] = true; });
  s.visited = { ...(s.visited || {}), [p.id]: true };
  s.insight += p.questions.slice(0, right).reduce((a, q) => a + 10 * q.level, 0);
  if (p.questions.length >= 2) s.stamps[p.id] = true;
  (s.story.mementos ||= {})[p.id] = 'page';
}
function everything(s, c) {
  c.concepts.forEach((_, i) => playHouse(s, c, i, { right: 6 }));
  for (const p of c.concepts) { (p.lab?.stations || []).filter((x) => x.advanced).forEach((x) => { s.done[`${p.id}+up:${x.id}`] = true; }); (p.riddles || []).forEach((r) => { s.locks[r.id] = true; }); }
  for (let k = 0; k < 7; k++) s.life.found[`s${k}`] = 1;
  s.opened = { a: true, b: true };
  s.passedLeague = true; s.insight += (c.finalCheck.size || 8) * 20;
  ensureXp(s); for (const g of c.games || []) s.xp.games[g.id] = { best: 35, plays: 2 };
}

test('experience never goes down; old saves start from what they hold', () => {
  const s = fresh(); s.insight = 120; // an old save: no xp yet
  ensureXp(s); assert.equal(s.xp.earned, 120);
  const sc = scaleOf(COURSES.chroma);
  syncXp(s, sc, Date.parse('2026-11-14T10:00:00'));
  const a = experienceOf(s);
  s.insight -= 100; // spending (later: a shop) lowers coins, never experience
  syncXp(s, sc, Date.parse('2026-11-14T10:05:00'));
  assert.ok(experienceOf(s) >= a);
  s.insight += 30; syncXp(s, sc, Date.parse('2026-11-14T10:06:00'));
  assert.equal(s.xp.earned, 150);
  // a part of the save that shrinks (a fog restarted) does not take experience away
  s.stamps.lamps = true; syncXp(s, sc); const b = experienceOf(s); delete s.stamps.lamps; assert.ok(experienceOf(s) >= b);
});

test('tiers scale with the course: the first change inside the first house, the top at everything plus practice', () => {
  for (const [name, c] of Object.entries(COURSES)) {
    const sc = scaleOf(c), ts = tiersOf(sc);
    assert.deepEqual(ts.map((t) => t.id), TIERS);
    for (let i = 1; i < ts.length; i++) assert.ok(ts[i].at > ts[i - 1].at, `${name}: thresholds increase`);
    // the first house: its lab and its remembering cross the first threshold
    const s = fresh(); playHouse(s, c, 0); ensureXp(s);
    assert.ok(atLeast(tierOf(s, sc), 'passing'), `${name}: ${experienceOf(s)} after the first house, needs ${ts[1].at}`);
    // half the lab of the first house is not yet enough for two tiers
    assert.ok(!atLeast(tierOf(s, sc), 'known'), name);
    // the main path alone does not reach the top
    const m = fresh(); c.concepts.forEach((p, i) => { if (p.core !== false) playHouse(m, c, i); }); m.passedLeague = true; ensureXp(m);
    assert.ok(!atLeast(tierOf(m, sc), 'home'), `${name}: the main path alone reaches home (${experienceOf(m)} of ${ts[4].at})`);
    // everything, but no days of practice: known, not home; with a week of coming back: home
    const e = fresh(); everything(e, c);
    assert.ok(atLeast(tierOf(e, sc), 'known'), `${name}: everything gives ${experienceOf(e)}, known at ${ts[3].at}`);
    e.xp.days = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'];
    e.insight += 120; // a few games and rematches on those days
    syncXp(e, sc, Date.parse('2026-11-07T12:00:00'));
    assert.equal(tierOf(e, sc), 'home', `${name}: ${experienceOf(e)} of ${ts[4].at}`);
  }
  // a pocket course and a large one: thresholds proportional to what they offer
  const small = tiersOf(scaleOf(COURSES.pocket)), big = tiersOf(scaleOf(COURSES.chroma));
  assert.ok(small[4].at < big[4].at);
});

test('the notable thing just done, days and streaks, and a tier change announced once', () => {
  assert.equal(noticeOf({ houses: 0, stations: 1 }, { houses: 1, stations: 2 }), 'remembered');
  assert.equal(noticeOf({ locks: 0 }, { locks: 1 }), 'lock');
  assert.equal(noticeOf(null, { locks: 1 }), null);
  const c = COURSES.pocket, sc = scaleOf(c), s = fresh(), t0 = Date.parse('2026-11-14T10:00:00');
  syncXp(s, sc, t0);
  playHouse(s, c, 0);
  const ch = syncXp(s, sc, t0 + 60000);
  assert.ok(ch && atLeast(ch.tier, 'passing'), JSON.stringify(ch)); assert.equal(ch.from, 'arrival');
  assert.equal(syncXp(s, sc, t0 + 70000), null, 'announced once');
  const sig = signals(s, t0 + 90000);
  assert.equal(sig.last, 'remembered'); assert.ok(sig.fresh);
  assert.ok(!signals(s, t0 + 3600e3).fresh);
  assert.equal(streakOf(['2026-11-10', '2026-11-12', '2026-11-13', '2026-11-14']), 3);
  syncXp(s, sc, Date.parse('2026-11-15T09:00:00')); syncXp(s, sc, Date.parse('2026-11-15T19:00:00'));
  assert.equal(s.xp.days.length, 2, 'one entry per day'); assert.equal(tally(s).days, 1);
  assert.equal(dayKey(Date.parse('2026-01-02T10:00:00')), '2026-01-02');
});

test('completion: the share of the optional things done', () => {
  const c = COURSES.chroma, sc = scaleOf(c), s = fresh(); ensureXp(s);
  assert.equal(completionOf(s, sc), 0);
  everything(s, c); s.ended = true; s.story.fog = { lamps: { n: 2 } };
  assert.ok(completionOf(s, sc) > 0.9, String(completionOf(s, sc)));
});

test('the remarks: every slot has every tier, in English and Italian, short, the same shape', () => {
  const both = (v, where) => { assert.ok(v.en && v.it, where); assert.equal(Array.isArray(v.en), Array.isArray(v.it), where); if (Array.isArray(v.en)) { assert.ok(v.en.length >= 1 && v.it.length >= 1, where); for (const l of [...v.en, ...v.it]) assert.ok(l.length <= 150, `${where}: ${l}`); } };
  for (const t of TIERS) for (const temp of ['cold', 'warm']) { both(XLINES.greet[t][temp], `greet.${t}.${temp}`); assert.ok(XLINES.greet[t][temp].en.length >= 3, `greet ${t} ${temp}: at least three variants`); }
  for (const w of ['remembered', 'memento', 'lock', 'secret', 'game', 'station']) both(XLINES.did[w], `did.${w}`);
  for (const g of ['low', 'mid', 'high']) { both(XLINES.owner.before[g], 'owner'); both(XLINES.owner.after[g], 'owner'); both(XLINES.purser[g], 'purser'); both(XLINES.keeperLoop[g], 'keeperLoop'); }
  for (const t of TIERS) { both(XLINES.master[t], 'master'); both(XLINES.keeperReturn[t], 'keeperReturn'); both(XLINES.musing[t], 'musing'); both(XLINES.tierWord[t], 'tierWord'); assert.ok(GROUP[t]); }
  for (const t of TIERS.slice(1)) { both(XLINES.tierUp[t], 'tierUp'); both(XLINES.tierNote[t], 'tierNote'); both(XLINES.margin[t], 'margin'); }
  for (const k of Object.keys(XLINES.missing)) both(XLINES.missing[k], `missing.${k}`);
  both(XLINES.refuse, 'refuse'); both(XLINES.tell, 'tell');
  assert.ok(XLINES.refuse.en.length >= 4, 'the refusal varies');
  // the keeper's and the purser's lines leave the events of the loop alone: no promise of another ending
  for (const l of [...XLINES.purser.high.en, ...XLINES.keeperLoop.high.en]) assert.ok(!/stay|you will/i.test(l) || /may|almost/i.test(l), l);
});

test('withheld lines: a dozen of the engine, a course\'s own, dealt by seed, told once at their tier', () => {
  assert.ok(GENERIC.length >= 8 && GENERIC.length <= 12);
  for (const l of GENERIC) { assert.ok(l.teaser.en && l.teaser.it && l.told.en && l.told.it, l.id); assert.ok(/[—-]$/.test(l.teaser.en.trim()) && /[—-]$/.test(l.teaser.it.trim()), `${l.id}: the teaser is cut off`); assert.ok(['passing', 'settling', 'known', 'home'].includes(l.tier)); }
  const plain = withheldFor({}, { story: false, games: false });
  assert.ok(plain.every((l) => !l.story && l.needs !== 'games'));
  const own = withheldFor({ withheld: [{ id: 'mine', by: 'pitch', tier: 'known', told: 'Overtones.' }] }, {});
  assert.equal(own[0].id, 'mine'); assert.equal(own[0].by, 'pitch');
  const a = assign(own, ['p1', 'p2', 'p3'], 'seed'), b = assign(own, ['p1', 'p2', 'p3'], 'seed');
  assert.deepEqual(a, b); assert.deepEqual(a['host:pitch'], ['mine']);
  const dealt = Object.entries(a).filter(([k]) => !k.startsWith('host:')).flatMap(([, v]) => v);
  assert.equal(dealt.length, own.length - 1);
  for (const k of ['p1', 'p2', 'p3']) assert.ok((a[k] || []).length >= 1);
  const ids = a.p1, first = own.find((l) => l.id === ids[0]);
  assert.deepEqual(pending({}, ids, own, 'arrival'), { line: first, told: first.tier === 'arrival' });
  const told = pending({}, ids, own, 'home'); assert.ok(told.told);
  assert.equal(pending(Object.fromEntries(ids.map((i) => [i, 1])), ids, own, 'home'), null);
});

test('canEnter: today everything, except the one door that knows you', () => {
  assert.deepEqual(canEnterAt('door:lamps', 'arrival'), { ok: true });
  assert.deepEqual(canEnterAt('door:home', 'settling'), { ok: false, need: 'known' });
  assert.deepEqual(canEnterAt('door:home', 'known'), { ok: true });
});

test('endingOf reads the tier and the completion; only the loop is built', () => {
  const s = fresh();
  assert.equal(endingOf(s), 'loop');
  assert.equal(endingOf(s, { tier: 'home', completion: 1 }), 'loop');
  assert.equal(plannedEnding(s, { tier: 'known', completion: 0.6 }), 'hope');
  assert.equal(plannedEnding(s, { tier: 'home', completion: 0.9 }), 'hope', 'the good one also wants a house kept from the fog');
  s.story.fog = { a: { n: 1 } };
  assert.equal(plannedEnding(s, { tier: 'home', completion: 0.9 }), 'good');
  assert.equal(plannedEnding(s, { tier: 'settling', completion: 1 }), 'loop');
  assert.equal(ENDING_RULES.length, 2);
});
