// Composed rooms: determinism, the order rules and reachability over many rooms, the registries.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakeCtx } from './helpers.mjs';
import { planRoom, generateRoom, allProblems, PLAN_NAMES, ZONES, ZONE_NAMES, TRADES, TRADE_NAMES, KINDS } from '../src/gen/interior/index.js';
import { PIECES } from '../src/gen/interior/pieces.js';
import { PAINT, SIGNATURES } from '../src/gen/interior/furniture.js';
import { DECOR } from '../src/gen/interior/paint.js';
import { THEMES } from '../src/gen/core.js';
import { LOOKS } from '../src/art/sprites.js';

const KIND_NAMES = Object.keys(KINDS);
const THEME_LIST = Object.values(THEMES);
const plain = (L) => JSON.stringify(L, (k, v) => (ArrayBuffer.isView(v) ? Array.from(v) : v));
const place = (i, kind, extra = {}) => ({ id: `t${i}-${kind}`, kind, order: (i % 8) + 1, concept: ['Why it works', 'Hue, saturation, lightness', 'Colour depends on context', 'A rather long concept name for a short wall'][i % 4], trade: kind === 'home' ? TRADE_NAMES[i % TRADE_NAMES.length] : undefined, ...extra });

test('the same house always gets the same room', () => {
  for (const kind of KIND_NAMES) for (const theme of THEME_LIST) {
    const p = place(7, kind);
    assert.equal(plain(planRoom(p, { theme })), plain(planRoom({ ...p }, { theme })));
  }
});

test('every room keeps the order rules and can be walked, across kinds, trades, plans, themes and sizes', () => {
  let n = 0;
  const plans = new Set(), zones = new Set();
  for (let i = 0; i < 60; i++) for (const kind of KIND_NAMES) {
    const theme = THEME_LIST[i % THEME_LIST.length], L = planRoom(place(i, kind), { theme });
    assert.deepEqual(allProblems(L, theme), [], `${L.id}: ${allProblems(L, theme).join('; ')}`);
    assert.ok(L.w <= 16, `${L.id} is ${L.w} tiles wide: a phone held upright keeps zoom 3 up to 16`);
    assert.ok(L.zones.length >= 2, `${L.id} has ${L.zones.length} zone`);
    plans.add(L.plan); L.zones.forEach((z) => zones.add(z.name)); n++;
  }
  // every plan forced, with every kind
  for (const plan of PLAN_NAMES) for (const kind of KIND_NAMES) for (let i = 0; i < 4; i++) {
    const theme = THEME_LIST[i % 3], L = planRoom(place(100 + i, kind), { theme, plan });
    assert.deepEqual(allProblems(L, theme), [], `${L.id} on ${plan}`); n++;
  }
  assert.ok(n >= 400, `${n} rooms`);
  assert.deepEqual([...plans].sort(), [...PLAN_NAMES].sort(), 'every plan is chosen by some house');
});

test('every zone can be placed, keeps the rules, and paints', () => {
  for (const name of ZONE_NAMES) {
    const Z = ZONES[name];
    if (Z.fixture || Z.upper) continue; // stairs, locks and attic furniture: tests/floors.test.mjs
    assert.ok(Z.back || Z.side || Z.island, `${name} has no layout`);
    const kinds = KIND_NAMES.filter((k) => KINDS[k].zones?.includes(name)), trades = TRADE_NAMES.filter((t) => TRADES[t].zones.includes(name));
    assert.ok(kinds.length || trades.length, `zone ${name} is used by no kind and no trade`);
    let placed = 0;
    for (let i = 0; i < 12 && !placed; i++) {
      const p = kinds.length ? place(i, kinds[0]) : place(i, 'home', { trade: trades[0] });
      const L = planRoom(p, { zones: [name, ...(kinds.length ? KINDS[kinds[0]].zones : TRADES[trades[0]].zones).filter((z) => z !== name)] });
      assert.deepEqual(allProblems(L), [], `${L.id} with ${name} first`);
      if (L.zones.some((z) => z.name === name)) placed++;
    }
    assert.ok(placed, `zone ${name} never fits in a room`);
    for (const lay of [Z.back, Z.side, Z.island].filter(Boolean)) for (const [type] of lay.pieces) { assert.ok(PIECES[type], `${name}: unknown piece ${type}`); assert.ok(PAINT[type], `${name}: no painter for ${type}`); }
    for (const [type] of Z.back?.wall || []) assert.ok(DECOR[type], `${name}: no painter for the wall decoration ${type}`);
  }
});

test('every trade has zones, a signature, a look and decorations that exist, and its rooms paint', () => {
  for (const t of Object.keys(TRADES)) {
    const T = TRADES[t];
    T.zones.forEach((z) => assert.ok(ZONES[z], `${t}: unknown zone ${z}`));
    assert.ok(SIGNATURES[T.signature], `${t}: no painter for the signature ${T.signature}`);
    assert.ok(LOOKS[T.look], `${t}: unknown look ${T.look}`);
    T.decor.forEach((d) => assert.ok(DECOR[d], `${t}: no painter for ${d}`));
    for (const theme of THEME_LIST) {
      const room = generateRoom(place(3, 'home', { trade: t, id: `paint-${t}` }), { theme }), ctx = fakeCtx();
      room.paint(ctx); room.props.forEach((p) => p.paint(ctx));
      assert.ok(ctx.calls > 1000);
    }
  }
  for (const k of KIND_NAMES) if (KINDS[k].sigs) KINDS[k].sigs.forEach((s) => assert.ok(SIGNATURES[s], `${k}: no painter for ${s}`));
  for (const k of KIND_NAMES) if (k !== 'home') { const room = generateRoom(place(5, k)), ctx = fakeCtx(); room.paint(ctx); room.props.forEach((p) => p.paint(ctx)); }
});

test('a trade that is not in the registry gives a generic home', () => {
  const L = planRoom({ id: 'odd', kind: 'home', trade: 'beekeeper', order: 2, concept: 'Hives' });
  assert.equal(L.trade, 'home');
  assert.deepEqual(allProblems(L), []);
});
