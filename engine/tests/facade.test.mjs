// Expert homes from outside: every shape, in every theme, for every trade, paints without error.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDocument } from './helpers.mjs';
installFakeDocument();
const { paintFacade, HOME_SHAPES } = await import('../src/gen/facade.js');
const { THEMES } = await import('../src/gen/core.js');
const { TRADES } = await import('../src/gen/interior/trades.js');
const { KINDS } = await import('../src/world/townMap.js');

test('home fronts paint in every shape, theme and trade, on the home footprint', () => {
  const k = KINDS.home;
  assert.ok(k && k.w === 5 && k.h === 5);
  for (const theme of Object.values(THEMES)) for (const shape of HOME_SHAPES) for (const trade of Object.keys(TRADES)) {
    const b = { id: `h-${trade}`, kind: 'home', paint: 'home', x: 0, y: 0, w: k.w, h: k.h, doors: k.doors, label: trade.toUpperCase().slice(0, 9), trade, expert: 'Oda', nature: 'meadow' };
    const res = paintFacade(b, { theme, shape, seed: `t:${shape}` });
    assert.equal(res.canvas.width, k.w * 16); assert.equal(res.canvas.height, k.h * 16 + 16);
    assert.ok(Array.isArray(res.glows));
  }
});
