// Upper floors (src/mechanics/floors/) and lock pieces in rooms: hundreds of composed rooms with
// stairs and locks keep the order rules and can be walked; upper floors too; no stairs without
// something upstairs; advanced stations stay out of the ground floor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakeCtx } from './helpers.mjs';
import { planRoom, generateRoom, allProblems, KINDS, TRADE_NAMES } from '../src/gen/interior/index.js';
import { ZONES } from '../src/gen/interior/zones.js';
import { THEMES } from '../src/gen/core.js';
import { reach } from '../src/gen/interior/rules.js';
import { floorsOf, fixturesOf, isGround, whereOf } from '../src/mechanics/floors/plan.js';
import { groundStations, advancedStations } from '../src/mechanics/floors/stations.js';
import { keysFromQuery, giveKeyTo } from '../src/mechanics/floors/keys.js';
import { LOCK_KIND_NAMES } from '../src/mechanics/riddles/kinds.js';
import { DATA } from '../src/course/_data.js';

const THEME_LIST = Object.values(THEMES), KIND_NAMES = Object.keys(KINDS);
const plain = (L) => JSON.stringify(L, (k, v) => (ArrayBuffer.isView(v) ? Array.from(v) : k === 'fixture' && v && typeof v === 'object' ? 1 : v));
// a house with something upstairs (an advanced station, locks up and in the room, further links)
const house = (i, kind, o = {}) => ({
  id: `f${i}-${kind}`, kind, order: (i % 8) + 1, concept: ['Why it works', 'Hue, saturation, lightness', 'Colour depends on context'][i % 3],
  trade: kind === 'home' ? TRADE_NAMES[i % TRADE_NAMES.length] : undefined,
  lab: { stations: [{ id: 'a' }, { id: 'b' }, ...(o.adv ? [{ id: 'up', advanced: true }] : [])] },
  riddles: [...(o.up || []).map((k, j) => ({ id: `u${j}`, kind: k, inside: o.guard && j === 0 ? { station: 'up' } : { coins: 1 } })), ...(o.room || []).map((k, j) => ({ id: `r${j}`, kind: k, where: 'room' }))],
  further: o.further ? [{ title: 't', url: 'https://example.org', why: 'w' }] : [],
});
const usable = (L, f) => { const seen = reach(L); for (let x = f.x; x < f.x + f.fw; x++) if (seen[(f.y + 1) * L.w + x]) return true; return false; };

test('rooms with stairs and locks keep every rule and can be walked, on both floors', () => {
  let n = 0, up = 0;
  const combos = [{ adv: true }, { up: ['safe'] }, { up: ['computer', 'door'] }, { further: true, up: ['safe'] }, { adv: true, guard: true, up: ['computer'] }, { room: ['door'] }, { room: ['safe'], up: ['computer'] }, { adv: true, further: true, up: ['safe', 'computer'] }];
  for (let i = 0; i < 40; i++) for (const kind of KIND_NAMES) {
    const o = combos[i % combos.length], p = house(i, kind, o), theme = THEME_LIST[i % THEME_LIST.length], f = floorsOf(p);
    const L = planRoom(p, { theme });
    assert.deepEqual(allProblems(L, theme), [], `${L.id} ground: ${allProblems(L, theme).join('; ')}`);
    assert.equal(!!L.stairs, f.up, `${L.id}: stairs if and only if something is upstairs`);
    if (L.stairs) assert.ok(usable(L, L.stairs), `${L.id}: the stairs can be used`);
    assert.equal(L.locks.length, (o.room || []).length, `${L.id}: every room lock is placed`);
    for (const l of L.locks) assert.ok(usable(L, l), `${L.id}: lock ${l.id} can be used`);
    assert.ok(L.zones.filter((z) => !z.fixture).length >= 2, `${L.id}: furniture besides the fixtures`);
    n++;
    if (f.up) {
      const U = planRoom(p, { theme, floor: 'up' });
      assert.deepEqual(allProblems(U, theme), [], `${U.id} upstairs: ${allProblems(U, theme).join('; ')}`);
      assert.ok(U.upper && !U.stairs && !U.master, 'upstairs: no stairs up, nobody lives there');
      assert.equal(U.locks.length, (o.up || []).length, `${U.id}: every upstairs lock is placed`);
      for (const l of U.locks) assert.ok(usable(U, l), `${U.id}: lock ${l.id} can be used`);
      assert.equal(!!U.lab, f.open.length > 0, `${U.id}: the advanced bench only for stations no lock guards`);
      assert.equal(!!U.board, f.further.length > 0, `${U.id}: the shelf only with further links`);
      assert.ok(U.w <= 16);
      assert.deepEqual(U.start, [U.exit[0], U.exit[1] - 1], 'the walk-in contract: start above the exit (the stairs down)');
      n++; up++;
    }
  }
  assert.ok(n >= 300, `${n} rooms`); assert.ok(up >= 150, `${up} upper floors`);
});

test('houses with nothing upstairs have no stairs, and their rooms do not change', () => {
  for (let i = 0; i < 30; i++) for (const kind of KIND_NAMES) {
    const p = house(i, kind), L = planRoom(p);
    assert.equal(L.stairs, null); assert.equal(fixturesOf(p, 'up'), null);
    const bare = { ...p }; delete bare.riddles; delete bare.lab; delete bare.further;
    assert.equal(plain(L), plain(planRoom(bare)), 'a concept without floors or locks gets exactly the room it had');
  }
  assert.throws(() => planRoom(house(1, 'lab'), { floor: 'up' }), /nothing for an upper floor/);
  // workshops and museums have no floors
  assert.equal(floorsOf({ ...house(2, 'workshop', { adv: true }) }).up, false);
  assert.equal(floorsOf({ ...house(2, 'museum', { further: true }) }).up, false);
});

test('the same house always gets the same rooms, and they paint', () => {
  for (const kind of KIND_NAMES) {
    const p = house(5, kind, { adv: true, further: true, up: ['safe', 'computer'], room: ['door'] });
    assert.equal(plain(planRoom(p)), plain(planRoom({ ...p })));
    assert.equal(plain(planRoom(p, { floor: 'up' })), plain(planRoom({ ...p }, { floor: 'up' })));
    for (const floor of ['ground', 'up']) { const r = generateRoom(p, { floor }), ctx = fakeCtx(); r.paint(ctx); r.props.forEach((q) => q.paint(ctx)); assert.ok(ctx.calls > 500); }
  }
});

test('fixture zones: every lock kind has one, and they are never chosen as furniture', () => {
  for (const k of LOCK_KIND_NAMES) assert.ok(fixturesOf(house(1, 'lab', { room: [k] })).locks[0].zone);
  for (const [name, Z] of Object.entries(ZONES)) if (Z.fixture) {
    for (const k of KIND_NAMES) assert.ok(!KINDS[k].zones?.includes(name), `${name} is not furniture of ${k}`);
    assert.ok(Z.back && Z.back.keep?.length, `${name}: a back layout with a kept tile to use it from`);
  }
  assert.equal(whereOf({}), 'upstairs'); assert.equal(whereOf({ where: 'room' }), 'room'); assert.equal(whereOf({ where: 'by the window' }), 'upstairs');
});

test('advanced stations are excluded from the ground floor', () => {
  assert.ok(isGround({ id: 'a' })); assert.ok(!isGround({ id: 'b', advanced: true }));
  for (const p of DATA.concepts) {
    const all = p.lab?.stations || [], g = groundStations(p.id), a = advancedStations(p.id);
    assert.equal(g.length + a.length, all.length);
    assert.ok(g.every((s) => !s.advanced) && a.every((s) => s.advanced));
    assert.deepEqual(g.map((s) => s.id), all.filter((s) => !s.advanced).map((s) => s.id), 'ground stations keep their order');
  }
  // the example course: Three Lamps House keeps two stations downstairs, one upstairs
  assert.deepEqual(groundStations('lamps').map((s) => s.id), ['mix', 'pixel']);
  assert.deepEqual(advancedStations('lamps').map((s) => s.id), ['gamma']);
});

test('keys for testing: ?keys= and giveKey', () => {
  assert.deepEqual(keysFromQuery('?keys=wheel,nope,lamps'), ['wheel', 'lamps']);
  assert.equal(keysFromQuery('?keys=all').length, DATA.concepts.length);
  assert.deepEqual(keysFromQuery(''), []);
  const st = {};
  assert.match(giveKeyTo(st, 'wheel'), /given/); assert.equal(st.keys.wheel, true);
  assert.match(giveKeyTo(st, 'castle'), /no house/);
});
