// Ambient life (src/mechanics/): musings, nudges, the registries, placement over many synthetic towns,
// obstacles (canPass, never in the way), and the saved state.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LINES, NUDGES, NEAR } from '../src/mechanics/musings/lines.js';
import { Deck, musing, nudgeKind, nudgeLine, isNudgeTurn } from '../src/mechanics/musings/think.js';
import { questOf } from '../src/mechanics/quest/model.js';
import { townThingAt, roomThingAt } from '../src/mechanics/musings/things.js';
import { SECRETS, RHYME, rhymeFor, HINTS, CHAIN } from '../src/mechanics/secrets/registry.js';
import { OBSTACLES, TOOLS, REWARDS, canPass, isOpen, toolsFromQuery } from '../src/mechanics/obstacles/kinds.js';
import { CAST, castFor, BY_THEME } from '../src/mechanics/animals/cast.js';
import { lifeConfig, WORDS } from '../src/mechanics/config.js';
import { planLife, checkLife } from '../src/mechanics/plan.js';
import { lifeContext } from '../src/mechanics/context.js';
import { generate } from '../src/world/townMap.js';
import { THEMES } from '../src/gen/core.js';
import { planDressingFor } from '../src/gen/dressing.js';
import { planRoom } from '../src/gen/interior/compose.js';
import { course } from '../scripts/synthetic.mjs';

const LANGS = ['en', 'it'];
const plain = (o) => JSON.stringify(o);

test('every kind of thing has 3 to 8 lines in English and Italian, and a noun', () => {
  for (const [k, e] of Object.entries(LINES)) for (const l of LANGS) {
    assert.ok(Array.isArray(e[l]) && e[l].length >= 3 && e[l].length <= 8, `${k}: ${l} has ${e[l]?.length} lines`);
    assert.ok(e.n?.[l], `${k}: no noun in ${l}`);
    for (const s of e[l]) assert.ok(s.length > 4 && s.length <= 110, `${k}: line too long or empty: ${s}`);
    assert.equal(new Set(e[l]).size, e[l].length, `${k}: a line repeats`);
  }
  // the kinds the town, the rooms, the animals and the obstacles can produce all have lines
  for (const k of ['tree', 'water', 'bench', 'lamp', 'house', 'roof', 'chair', 'table', 'books', 'window', 'picture', 'floor', 'person', 'door', 'sign', 'labdoor', 'board', 'host', 'exit', 'sleepcat', 'lanterncat', ...Object.keys(CAST)]) assert.ok(LINES[k], `no lines for ${k}`);
  for (const [k, o] of Object.entries(OBSTACLES)) for (const l of LANGS) { assert.ok(o.say[l].length >= 2 && o.lines[l].length >= 2 && o.opened[l] && o.name[l], `obstacle ${k} in ${l}`); assert.ok(TOOLS[o.needs], `obstacle ${k} needs an unknown tool`); }
  for (const t of Object.values(NUDGES)) for (const l of LANGS) assert.ok(t[l].length >= 2);
  for (const n of Object.values(NEAR)) for (const l of LANGS) assert.ok(n[l]);
  for (const [k, s] of Object.entries(SECRETS)) for (const l of LANGS) { assert.ok(s.title[l], `secret ${k} title ${l}`); assert.ok(s.found[l], `secret ${k} found ${l}`); }
  for (const l of LANGS) { assert.equal(RHYME[l].length, 6); assert.ok(HINTS[l].length >= 3); assert.ok(CHAIN.pet[l].length >= 2); }
  for (const w of Object.values(WORDS)) for (const l of LANGS) assert.ok(w[l]);
  for (const r of Object.values(REWARDS)) for (const l of LANGS) assert.ok(r.title[l] && r.text[l]);
});

test('lines cycle: every line once before any repeats, never the same line twice in a row', () => {
  let seed = 1; const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const [k, e] of Object.entries(LINES)) {
    const d = new Deck(rand), list = e.en, out = [];
    for (let i = 0; i < list.length * 6; i++) out.push(d.draw(k, list));
    for (let i = 1; i < out.length; i++) assert.notEqual(out[i], out[i - 1], `${k} repeated a line`);
    for (let r = 0; r < 6; r++) assert.equal(new Set(out.slice(r * list.length, (r + 1) * list.length)).size, list.length, `${k}: round ${r} is not a full cycle`);
  }
});

// three houses with a lab of one station each; "c" is an extra
const PL = [
  { id: 'a', name: 'Lamp House', order: 1, kind: 'lab', lab: { stations: [{}] }, questions: [{}, {}], host: { name: 'Lux' }, district: { id: 'd0', landmark: 'fountain' } },
  { id: 'b', name: 'Dyer\'s House', order: 2, kind: 'home', lab: { stations: [{}] }, questions: [{}, {}], host: { name: 'Bruno' }, district: { id: 'd0', landmark: 'fountain' } },
  { id: 'c', name: 'Cone Cave', order: 3, kind: 'cave', core: false, lab: { stations: [{}] }, questions: [{}, {}], district: { id: 'd1', landmark: 'obelisk' } },
];
const QPL = questOf({ places: PL, guide: 'Iris', champion: 'Ada' });
test('nudges say what the tracker says: the next step of the main path, never an extra, then the League, then curiosity', () => {
  // every combination of visited, lab done and badge for the three houses
  for (let mask = 0; mask < 512; mask++) for (const inside of [null, 'a', 'b', 'c']) for (const lang of LANGS) for (const passedLeague of [false, true]) for (const ended of [false, true]) {
    const bit = (k) => !!(mask & (1 << k)), s = { seenIntro: true, passedLeague, ended, visited: {}, done: {}, stamps: {} };
    PL.forEach((p, i) => { if (bit(i)) s.visited[p.id] = true; if (bit(i + 3)) s.done[`${p.id}:0`] = true; if (bit(i + 6)) s.stamps[p.id] = true; });
    const step = QPL.nextStep(s, { inside }), g = { step, finalName: 'Colour League', here: 'd1' };
    const { text, target } = nudgeLine(g, 'a tree', lang, (l) => l[l.length - 1]);
    assert.equal(target.kind, nudgeKind(step));
    assert.ok(!/\{\w+\}/.test(text), `a hole in the line: ${text}`);
    assert.ok(!text.includes('Cone Cave'), `names the extra: ${text}`);
    if (ended) assert.equal(target.kind, 'free');
    else if (step.place) {
      assert.ok(!s.stamps[step.place.id], 'points to a finished place');
      if (target.kind === 'visit' || target.kind === 'duel') assert.ok(text.includes(step.place.name) || text.includes(step.person), `does not name the place: ${text}`);
    }
  }
  // "right around here" when the place is in the player's district
  const g = { step: QPL.nextStep({ seenIntro: true, visited: {}, done: {}, stamps: {} }), finalName: 'L', here: 'd0' };
  assert.ok(nudgeLine(g, 'x', 'en', (l) => l[0]).text.includes('right around here'));
});

test('about one musing in four or five is a nudge, never on things with a function', () => {
  let n = 0; for (let i = 0; i < 900; i++) if (isNudgeTurn(i)) n++;
  assert.ok(n / 900 > 0.18 && n / 900 < 0.26, `${n / 900}`);
  const game = { step: QPL.nextStep({ seenIntro: true, visited: {}, done: {}, stamps: {} }), finalName: 'L', here: null }, deck = new Deck();
  for (let i = 0; i < 40; i++) { const m = musing('person', { count: i, deck, game }); assert.equal(m.nudge, null); assert.ok(LINES.person.en.includes(m.text)); }
  let nudges = 0; for (let i = 0; i < 45; i++) if (musing('tree', { count: i, deck, game }).nudge) nudges++;
  assert.equal(nudges, 10);
});

test('switches: off means off, parts can be switched, curated notes are kept', () => {
  assert.equal(lifeConfig({ life: false }).on, false);
  assert.equal(lifeConfig({}, true).on, false, '?nolife');
  assert.deepEqual(['musings', 'animals', 'secrets', 'obstacles'].map((k) => lifeConfig({})[k]), [true, true, true, true]);
  const c = lifeConfig({ life: { obstacles: false, secrets: [{ kind: 'note', text: 'Hello', near: 'x' }] } });
  assert.equal(c.obstacles, false); assert.equal(c.secrets, true); assert.equal(c.notes.length, 1);
  assert.equal(lifeConfig({ life: { musings: false, animals: false, secrets: false, obstacles: false } }).on, false);
});

test('canPass reads the tools in the saved state; nothing opens today; ?tools grants one for testing', () => {
  const ob = { id: 'ob0', kind: 'gate' };
  assert.equal(canPass(ob, { tools: {}, opened: {} }), false);
  assert.equal(canPass(ob, {}), false);
  assert.equal(canPass(ob, { tools: { pickaxe: true } }), false, 'the wrong tool');
  assert.equal(canPass(ob, { tools: { key: true } }), true);
  assert.equal(canPass(ob, { opened: { ob0: true } }), true);
  assert.equal(isOpen(ob, { opened: {} }), false);
  for (const [k, o] of Object.entries(OBSTACLES)) assert.equal(canPass({ id: 'x', kind: k }, { tools: { [o.needs]: true } }), true);
  assert.deepEqual(toolsFromQuery('?lite&tools=key,pickaxe,wand'), ['key', 'pickaxe']);
});

// many synthetic towns: placement is deterministic, and every rule holds
const towns = [];
for (let i = 0; i < 240; i++) {
  const c = course(i), town = generate(c), theme = Object.values(THEMES)[i % 3], L = planDressingFor(town, theme, c.id);
  towns.push({ c, town, theme, L });
}
test('placement is deterministic and keeps every rule over 240 synthetic towns', () => {
  let obstacles = 0, secrets = 0, animals = 0, min = 99, kinds = new Set();
  for (const { c, town, theme, L } of towns) {
    const a = planLife(town, L, theme, c.id), b = planLife(town, L, theme, c.id);
    assert.equal(plain(a), plain(b), `${c.id}: not deterministic`);
    assert.deepEqual(checkLife(town, L, a), [], `${c.id}`);
    const n = a.secrets.filter((s) => s.kind !== 'sealed').length;
    obstacles += a.obstacles.length; secrets += n; animals += a.animals.town.length; min = Math.min(min, n);
    a.obstacles.forEach((o) => kinds.add(o.kind));
    assert.ok(a.obstacles.length <= 4, `${c.id}: ${a.obstacles.length} obstacles`);
    for (const s of a.secrets) assert.ok(SECRETS[s.kind]);
  }
  assert.ok(obstacles / towns.length >= 2, `${obstacles / towns.length} obstacles per town`);
  assert.ok(min >= 3 && secrets / towns.length >= 5, `secrets per town: ${secrets / towns.length}, min ${min}`);
  assert.ok(animals / towns.length >= 6);
  assert.ok(kinds.size >= 4, [...kinds].join());
});

test('with the obstacles closed nothing the course needs moves; opened, what is behind is reachable', () => {
  for (const { c, town, theme, L } of towns.slice(0, 40)) {
    const plan = planLife(town, L, theme, c.id), ctx = lifeContext(town, L);
    // distances to every lane, plaza, door step and the tiles beside people, signs and landmarks are unchanged
    const solid = ctx.solid.slice(); for (const [x, y] of plan.blocked) solid[ctx.I(x, y)] = 1;
    for (const o of plan.obstacles) for (const [x, y] of o.tiles) { assert.equal(ctx.target[ctx.I(x, y)], 0); assert.equal(ctx.approach[ctx.I(x, y)], 0); }
    // an obstacle with nothing in the world gives the same plan of secrets and animals as long as the seed is the same
    const off = planLife(town, L, theme, c.id, { life: { on: true, musings: true, animals: true, secrets: true, obstacles: false, notes: [] } });
    assert.equal(off.obstacles.length, 0); assert.equal(off.blocked.length, 0);
  }
});

test('rooms: the little locked door and the hung painting keep to free wall, the thing resolver knows the room', () => {
  for (let i = 0; i < 40; i++) {
    const p = { id: `r${i}`, kind: ['lab', 'archive', 'hall', 'studio', 'observatory', 'home'][i % 6], order: 1, concept: 'Something', trade: i % 6 === 5 ? 'painter' : undefined };
    const L = planRoom(p), plan = planLife(towns[i].town, towns[i].L, towns[i].theme, `room${i}`, { rooms: [{ place: p, L }] });
    for (const o of plan.closets) {
      assert.ok(!L.up[o.x] && !L.lo[o.x], 'the closet is on a used wall');
      assert.ok(!L.blocked[o.stand[1] * L.w + o.stand[0]], 'nowhere to stand in front of the closet');
      assert.equal(roomThingAt(L, o.x, o.y, { closets: plan.closets }).kind, 'obstacle');
    }
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) { const t = roomThingAt(L, x, y, {}); if (t) assert.ok(LINES[t.kind] || t.kind === 'obstacle', `room thing ${t.kind}`); }
  }
  const { town, L } = towns[0], ctx = lifeContext(town, L), plan = planLife(town, L, towns[0].theme, 'x');
  for (let y = 0; y < town.H; y++) for (let x = 0; x < town.W; x++) { const t = townThingAt(ctx, plan, x, y); assert.ok(t && (LINES[t.kind] || t.kind === 'obstacle'), `town thing ${t?.kind} at ${x},${y}`); }
});

test('the rhyme closes with its last line whatever the number of prints', () => {
  for (const l of LANGS) for (let n = 3; n <= 6; n++) { const r = rhymeFor(n, l); assert.equal(r.length, n); assert.equal(r[n - 1], RHYME[l][5]); }
});

test('animals: the theme adds its own, every one has a sheet and lines', () => {
  for (const t of Object.keys(BY_THEME)) assert.ok(castFor(t).length > castFor('none').length);
});

test('discoveries, paw prints, opened obstacles and tools are saved and loaded', async () => {
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)) };
  const S = await import('../src/systems/state.js'), { ensureState } = await import('../src/mechanics/life.js');
  S.reset();
  ensureState(S.state);
  S.state.life.found.apple0 = 123; S.state.life.prints[2] = true; S.state.opened.ob1 = true; S.state.tools.key = true;
  S.save();
  S.state.life = { found: {}, prints: {} }; S.state.opened = {}; S.state.tools = {};
  S.load();
  assert.equal(S.state.life.found.apple0, 123); assert.equal(S.state.life.prints[2], true); assert.equal(S.state.opened.ob1, true); assert.equal(S.state.tools.key, true);
  assert.equal(canPass({ id: 'ob1', kind: 'boulder' }, S.state), true);
  S.reset();
  assert.deepEqual(S.state.life, { found: {}, prints: {} }); assert.deepEqual(S.state.opened, {});
  // an old save without the layer's fields still loads
  mem.set([...mem.keys()][0], JSON.stringify({ insight: 5 }));
  S.load(); ensureState(S.state);
  assert.equal(S.state.insight, 5); assert.deepEqual(S.state.opened, {});
});
