// The lab kit for authors and the prebuilt player: the expression language, the tries
// vocabulary, the data checks of the ready-made patterns, the examples of
// references/8-ready-labs.md (docs that cannot rot), the demo course, and packing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, tryCompile, template, fmt } from '../src/lab/patterns/expr.js';
import { record, noteValue, test as holds, tracker, checkWhen } from '../src/lab/patterns/when.js';
import { checkReady, checkShapes, PATTERN_NAMES } from '../src/lab/patterns/specs.js';
import { rewriteImports, stationsIn, uncovered, makePayload, insertPayload, KIT_MODULES, kitKey } from '../src/course/packing.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const json = (f) => JSON.parse(readFileSync(path.join(root, f), 'utf8'));

// ---- the expression language ----
test('expressions: numbers, operators, precedence, functions, variables', () => {
  const cases = [
    ['1 + 2 * 3', {}, 7], ['(1 + 2) * 3', {}, 9], ['2^3^2', {}, 512], ['-2^2', {}, -4], ['(-2)^2', {}, 4], ['10 % 4', {}, 2],
    ['.5 + 1e2', {}, 100.5], ['2.5e-1', {}, 0.25], ['--3', {}, 3], ['+4', {}, 4], ['1 - -1', {}, 2],
    ['min(3, 1, 2)', {}, 1], ['max(3, 1, 2)', {}, 3], ['abs(-4)', {}, 4], ['sqrt(16)', {}, 4], ['round(2.567, 2)', {}, 2.57], ['round(2.5)', {}, 3],
    ['floor(2.9) + ceil(2.1)', {}, 5], ['clamp(15, 0, 10)', {}, 10], ['sign(-3)', {}, -1], ['log(e)', {}, 1], ['log10(1000)', {}, 3], ['exp(0)', {}, 1],
    ['sin(pi/2)', {}, 1], ['cos(0)', {}, 1], ['if(1 > 2, 10, 20)', {}, 20], ['3 >= 3', {}, 1], ['3 != 3', {}, 0], ['0.1 + 0.2 == 0.3', {}, 1],
    ['343 / f', { f: 343 }, 1], ['pi * r^2', { r: 2 }, Math.PI * 4], ['a*b + c', { a: 2, b: 3, c: 1 }, 7], ['x_1 + X2', { x_1: 1, X2: 2 }, 3],
    [42, {}, 42],
  ];
  for (const [src, vars, want] of cases) assert.ok(Math.abs(compile(src, Object.keys(vars))(vars) - want) < 1e-9, `${src} = ${want}`);
  assert.equal(compile('pi', ['pi'])({ pi: 3 }), 3, 'a variable named like a constant wins');
  assert.ok(Number.isNaN(compile('x', ['x'])({})), 'a missing value is NaN, not an error');
  assert.ok(Number.isNaN(compile('sqrt(-1)')()), 'math errors give NaN');
});

test('expressions refuse anything unsafe or malformed, with a message that says what to do', () => {
  const bad = [
    ['alert(1)', /unknown function "alert"/], ['constructor', /unknown name "constructor"/], ['__proto__', /unknown name/], ['x.y', /unexpected character "\."/],
    ['x[0]', /unexpected character "\["/], ['"a"', /unexpected character/], ['a = 1', /unexpected character "="/], ['1; 2', /unexpected character ";"/],
    ['`1`', /unexpected character/], ['this', /unknown name "this"/], ['Function', /unknown name/], ['globalThis', /unknown name/],
    ['1 +', /ends too early/], ['(1', /expected "\)"/], ['1)', /unexpected "\)"/], ['max()', /takes 1 to 8 arguments, not 0/], ['sin(1, 2)', /takes 1 argument, not 2/],
    ['clamp(1, 2)', /takes 3 arguments/], ['2 x', /missing an operator/], ['1 < 2 < 3', /cannot be chained/], ['', /empty/], ['   ', /empty/],
    ['sin', /sin is a function/], ['f * 2', /Names you can use here: a, b/], ['x'.repeat(301), /longer than 300/], ['('.repeat(60) + '1' + ')'.repeat(60), /nested too deeply/],
    [null, /must be a string or a number/], [[1], /not a list/], [Infinity, /finite/],
  ];
  for (const [src, re] of bad) {
    const r = tryCompile(src, src === 'f * 2' ? ['a', 'b'] : []);
    assert.ok(r.error, `${String(src).slice(0, 20)} is refused`);
    assert.match(r.error, re, `${String(src).slice(0, 20)}: ${r.error}`);
  }
});

test('labels with live values', () => {
  assert.equal(template('Period {1000/f:2} ms', ['f'])({ f: 440 }), 'Period 2.27 ms');
  assert.equal(template('{x} and {{braces}}', ['x'])({ x: 5 }), '5.00 and {braces}');
  assert.equal(template('{n:0} squeezes', ['n'])({ n: 11.4 }), '11 squeezes');
  assert.equal(fmt(-0.0001, 2), '0.00'); assert.equal(fmt(-3, 0), '−3'); assert.equal(fmt(1234.5), '1235'); assert.equal(fmt(NaN), '–');
  assert.throws(() => template('{f', ['f']), /without "}"/);
  assert.throws(() => template('{g}', ['f']), /unknown name "g"/);
});

// ---- the tries vocabulary ----
test('tries: reach, cross, both, try on a control', () => {
  const r = record(), ctl = { f: { min: 100, max: 1000, step: 10 } };
  const reach = { reach: { control: 'f', value: 440, within: 5 } }, cross = { cross: { control: 'f', above: 880 } }, both = { both: { control: 'f' } }, tryN = { try: { count: 3, control: 'f' } };
  assert.equal(holds(reach, r, ctl), false, 'nothing done yet');
  noteValue(r, 'f', 440, ctl.f); assert.equal(holds(reach, r, ctl), true);
  noteValue(r, 'f', 900, ctl.f); assert.equal(holds(reach, r, ctl), false, 'reach is about now'); assert.equal(holds(cross, r, ctl), true, 'cross is about ever');
  noteValue(r, 'f', 440, ctl.f); assert.equal(holds(cross, r, ctl), true, 'once crossed, crossed');
  assert.equal(holds(tryN, r, ctl), false, 'two distinct settings so far'); noteValue(r, 'f', 600, ctl.f); assert.equal(holds(tryN, r, ctl), true);
  assert.equal(holds(both, r, ctl), false); noteValue(r, 'f', 100, ctl.f); noteValue(r, 'f', 1000, ctl.f); assert.equal(holds(both, r, ctl), true);
  assert.equal(holds({ reach: { control: 'f', min: 900 } }, r, ctl), true, 'a range');
  assert.equal(holds({ reach: { control: 'f', value: 990 } }, r, ctl), true, 'default tolerance: a step or 2% of the range');
});

test('tries: place, run, select, combine, pair, label, nudge, count, sketch, reveal, gap, all, any', () => {
  const r = record();
  r.items = ['a', 'b']; r.correct = { a: 'x', b: 'y' };
  r.placed.a = 'x'; assert.equal(holds({ place: { item: 'a', bin: 'x' } }, r), true); assert.equal(holds({ place: { all: true } }, r), false);
  r.placed.b = 'x'; assert.equal(holds({ place: { all: true } }, r), true); assert.equal(holds({ place: { correct: true } }, r), false);
  r.placed.b = 'y'; assert.equal(holds({ place: { correct: true } }, r), true);
  assert.equal(holds({ run: true }, r), false); r.runs = 1; assert.equal(holds({ run: true }, r), true); assert.equal(holds({ run: 'correct' }, r), false); r.runsRight = 1; assert.equal(holds({ run: 'correct' }, r), true);
  r.selected.add('p'); assert.equal(holds({ select: 'p' }, r), true); assert.equal(holds({ select: ['p', 'q'] }, r), false);
  r.pot = ['red', 'green']; assert.equal(holds({ combine: ['green', 'red'] }, r), true); assert.equal(holds({ combine: ['red'] }, r), false);
  r.lefts = ['l1', 'l2']; r.paired.add('l1'); assert.equal(holds({ pair: 'l1' }, r), true); assert.equal(holds({ pair: 'all' }, r), false);
  r.spots = ['s']; r.labelled.add('s'); assert.equal(holds({ label: 'all' }, r), true);
  r.nudged.add('rain:up'); assert.equal(holds({ nudge: { box: 'rain' } }, r), true); assert.equal(holds({ nudge: { box: 'rain', dir: 'down' } }, r), false);
  r.counts['sick:below'] = 0; assert.equal(holds({ count: { of: 'sick:below', max: 0 } }, r), true);
  r.handles = 3; r.moved.add(0); r.moved.add(1); assert.equal(holds({ sketch: true }, r), false); r.moved.add(2); assert.equal(holds({ sketch: true }, r), true);
  assert.equal(holds({ gap: { below: 0.2 } }, r), false); r.revealed = true; r.gap = 0.1; assert.equal(holds({ reveal: true }, r), true); assert.equal(holds({ gap: { below: 0.2 } }, r), true);
  assert.equal(holds({ all: [{ run: true }, { select: 'p' }] }, r), true); assert.equal(holds({ any: [{ select: 'zz' }, { run: true }] }, r), true);
  assert.equal(holds({ nonsense: 1 }, r), false); assert.equal(holds(null, r), false);
});

test('tries: the tracker ticks each task once, in any order, only when asked after an action', () => {
  const ticked = [], r = record();
  const t = tracker([{ select: 'b' }, { select: 'a' }, null], (i) => ticked.push(i));
  r.selected.add('a'); r.selected.add('b');
  assert.deepEqual(ticked, [], 'nothing before update');
  t.update(r); t.update(r);
  assert.deepEqual(ticked, [0, 1], 'once each; a task without a condition is left to code');
  assert.equal(t.current(), -1);
});

test('tries: conditions are checked against what the pattern offers', () => {
  const refs = { verbs: ['reach', 'cross', 'try'], controls: { f: { min: 0, max: 10 } } };
  assert.deepEqual(checkWhen({ reach: { control: 'f', value: 5 } }, refs), []);
  const msgs = [
    [{ reach: { control: 'g', value: 5 } }, /unknown control "g". Known: "f"/],
    [{ reach: { control: 'f', value: 50 } }, /outside the control's range 0 to 10/],
    [{ cross: { control: 'f', above: 10 } }, /never goes above 10/],
    [{ cross: { control: 'f' } }, /"above" or "below"/],
    [{ place: { item: 'x', bin: 'y' } }, /"place" does not apply to this lab. Verbs for this lab: reach, cross, try/],
    [{ teleport: 1 }, /unknown verb "teleport"/],
    [{ reach: {}, cross: {} }, /exactly one key/],
    ['reach', /an object with one key/],
    [{ try: { count: 1 } }, /from 2 to 20/],
    [{ all: [{ reach: { control: 'h', value: 1 } }] }, /all\[0\]: reach: unknown control "h"/],
  ];
  for (const [c, re] of msgs) assert.match(checkWhen(c, refs).join(' | '), re);
});

// ---- the data of each pattern ----
const station = (ready, tries) => ({ id: 's', tries, ready });
const T = (when) => ({ text: 'Do it.', when });
const GOOD = {
  'slider-reveal': station({ kind: 'slider-reveal', controls: [{ id: 'f', label: 'Frequency', min: 100, max: 1000, step: 10, value: 200, unit: 'Hz' }], vars: { T: '1000/f' }, plot: { x: { min: 0, max: 10, label: 'ms' }, y: { min: -1, max: 1 } }, layers: [{ curve: 'sin(2*pi*f*x/1000)' }, { region: [0, 'T'], when: 'f > 400', label: 'one period' }, { marker: ['T', 0] }, { threshold: 0.5, axis: 'y' }, { points: [[0, 0], [10, 'f/1000']] }, { readout: 'Period {T:2} ms' }, { bars: [{ label: 'f', value: 'f' }], max: 1000 }, { shapes: [{ circle: [50, 50, 'f/50'] }, { text: '{f} Hz', at: [50, 90] }] }] }, [T({ reach: { control: 'f', value: 440 } }), T({ cross: { control: 'f', above: 800 } })]),
  compare: station({ kind: 'compare', controls: [{ id: 'v', label: 'Speed', min: 10, max: 100, value: 50 }], cases: [{ id: 'a', label: 'Dry', vars: { mu: 0.7 } }, { id: 'b', label: 'Wet', vars: { mu: 0.4 } }], vars: { d: 'v^2/(2*mu*9.81)' }, layers: [{ bars: [{ label: 'distance', value: 'd' }], max: 500 }], diff: { value: 'd', label: 'Distance', unit: 'm' } }, [T({ reach: { control: 'v', value: 50 } })]),
  sort: station({ kind: 'sort', bins: [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }], cards: [{ id: 'a', label: 'A', bin: 'x', why: 'because.' }, { id: 'b', label: 'B', bin: 'y', why: 'because.' }, { id: 'c', label: 'C', bin: 'x', why: 'because.' }] }, [T({ place: { item: 'a', bin: 'x' } }), T({ place: { correct: true } })]),
  order: station({ kind: 'order', steps: [{ id: 'a', label: 'First' }, { id: 'b', label: 'Second', early: 'Too soon.' }, { id: 'c', label: 'Third', result: 'Done.' }] }, [T({ run: true }), T({ run: 'correct' })]),
};
test('every pattern has a good example that passes', () => {
  assert.deepEqual(Object.keys(GOOD).sort(), [...PATTERN_NAMES].sort());
  for (const [k, s] of Object.entries(GOOD)) assert.deepEqual(checkReady(s), [], k);
});

test('bad data is refused with messages that say what to write', () => {
  const edit = (k, f) => { const s = structuredClone(GOOD[k]); f(s.ready, s); return checkReady(s).join(' | '); };
  const cases = [
    [edit('slider-reveal', (r) => { r.kind = 'slider'; }), /"kind" must be one of slider-reveal, compare, sort, order \(found "slider"\)/],
    [edit('slider-reveal', (r) => { r.controls = []; }), /needs 1 or 2 controls/],
    [edit('slider-reveal', (r) => { r.controls[0].min = 2000; }), /"min" must be smaller than "max"/],
    [edit('slider-reveal', (r) => { r.layers[0].curve = 'sin(2*pi*g*x)'; }), /layer 1 curve.*unknown name "g". Names you can use here: f, T, x/],
    [edit('slider-reveal', (r) => { delete r.plot; }), /a curve is drawn on the plot: add "plot"/],
    [edit('slider-reveal', (r) => { r.layers.push({ curve: 'x', bars: [] }); }), /exactly one of/],
    [edit('slider-reveal', (r) => { r.layers[6].max = undefined; }), /bars need "max"/],
    [edit('slider-reveal', (r) => { r.layers[7].shapes[0].colour = 'red'; }), /unknown key "colour"/],
    [edit('slider-reveal', (r) => { r.layers[7].shapes[0].color = 'reddish'; }), /colour "reddish" is not a name/],
    [edit('slider-reveal', (r) => { r.fancy = true; }), /unknown field "fancy" for slider-reveal/],
    [edit('slider-reveal', (r, s) => { s.tries = ['Move it.']; }), /plain text: a ready lab needs \{ "text": "...", "when"/],
    [edit('slider-reveal', (r, s) => { s.tries[0].when = { place: { item: 'a', bin: 'x' } }; }), /"place" does not apply to this lab/],
    [edit('compare', (r) => { r.cases.pop(); }), /exactly 2 cases/],
    [edit('compare', (r) => { r.cases[1].vars = { k: 1 }; }), /same variables/],
    [edit('compare', (r) => { r.diff = { label: 'x' }; }), /"diff" is \{ "value"/],
    [edit('sort', (r) => { r.cards[0].bin = 'z'; }), /"bin" must be the id of a bin \(x, y\)/],
    [edit('sort', (r) => { delete r.cards[1].why; }), /"why".*is missing/],
    [edit('sort', (r) => { r.cards = r.cards.filter((c) => c.bin === 'x'); r.cards.push({ id: 'd', label: 'D', bin: 'x', why: 'w' }); }), /bin "y" gets no card/],
    [edit('sort', (r) => { r.cards[1].id = 'a'; }), /id "a" is used twice/],
    [edit('sort', (r) => { r.scale = { label: 'Mass' }; }), /with "scale", every card needs a number "value"/],
    [edit('order', (r) => { r.steps = r.steps.slice(0, 2); }), /3 to 7 steps/],
    [edit('order', (r, s) => { s.tries[0].when = { run: 'yes' }; }), /run takes true or "correct"/],
  ];
  for (const [msg, re] of cases) assert.match(msg, re);
  assert.match(checkShapes([{ rect: [1, 2, 3] }], [], 'p').join(), /"rect" needs 4 numbers/);
  assert.match(checkShapes([{ emoji: 'abcdef', at: [1, 1] }], [], 'p').join(), /one emoji/);
});

// ---- the author's reference: every complete example in it is valid ----
test('every example in references/8-ready-labs.md is valid', () => {
  const md = readFileSync(path.join(root, 'skills', 'knowledge-base', 'references', '8-ready-labs.md'), 'utf8');
  const blocks = [...md.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => m[1]);
  let n = 0;
  for (const b of blocks) {
    let o; try { o = JSON.parse(b); } catch (e) { assert.fail(`a json block does not parse: ${e.message}\n${b.slice(0, 200)}`); }
    const st = o.ready ? o : null;
    if (!st) continue;
    n++;
    assert.deepEqual(checkReady(st), [], `example "${st.ready.kind}" (${st.id})`);
  }
  assert.ok(n >= PATTERN_NAMES.length, `${n} complete station examples, at least one per pattern`);
  for (const k of PATTERN_NAMES) assert.ok(md.includes(`"kind": "${k}"`), `the reference shows ${k}`);
});

// ---- the demo course ----
test('the pocket demo validates with no errors and no warnings, and every station is covered', () => {
  const r = spawnSync('node', [path.join(root, 'skills', 'knowledge-base', 'scripts', 'validate.mjs'), path.join(root, 'courses', 'pocket-demo')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /0 errors, 0 warnings/);
  const c = json('courses/pocket-demo/course.json'), labs = Object.fromEntries(readdirSync(path.join(root, 'courses', 'pocket-demo', 'labs')).map((f) => [f.slice(0, -3), readFileSync(path.join(root, 'courses', 'pocket-demo', 'labs', f), 'utf8')]));
  assert.deepEqual(uncovered(c, labs).missing, []);
  assert.ok(!existsSync(path.join(root, 'courses', 'pocket-demo', 'world.json')), 'no world.json: the look is the engine\'s default');
  assert.ok(c.concepts.every((p) => !p.emblem && !p.expert && !p.riddles), 'no emblems, experts or riddles chosen');
});

// ---- packing ----
test('lab imports are rewritten to the kit; anything else is refused by file and line', () => {
  const src = "// a lab\nimport { slider, h as hh } from '../../../engine/src/lab/shell.js';\nimport * as K from '../../../engine/src/lab/kit.js';\nimport {\n  sfx\n} from '../../../engine/src/systems/audio.js';\nexport default { a: () => 1 };";
  const r = rewriteImports(src, 'labs/x.js');
  assert.deepEqual(r.errors, []);
  assert.match(r.code, /const \{ slider, h: hh \} = globalThis\.__mnemoKit\["lab\/shell\.js"\];/);
  assert.match(r.code, /const K = globalThis\.__mnemoKit\["lab\/kit\.js"\];/);
  assert.match(r.code, /const \{ sfx \} = globalThis\.__mnemoKit\["systems\/audio\.js"\];/);
  assert.doesNotMatch(r.code, /\bimport\b/);
  assert.equal(kitKey('C:\\x\\engine\\src\\lab\\kit.js'), 'lab/kit.js');
  const bad = [
    ["import x from 'https://cdn.example/x.js';", /line 1: import from "https:\/\/cdn.example\/x.js" is not available/],
    ["\n\nimport { TOWN } from '../../../engine/src/world/townMap.js';", /line 3: "engine\/src\/world\/townMap.js" is not part of the lab kit/],
    ["import './helper.js';", /import from ".\/helper.js" is not available/],
    ["const m = await import('../x.js');", /dynamic import\(\) is not available/],
    ["export * from '../../../engine/src/lab/kit.js';", /"export ... from" is not available/],
  ];
  for (const [s, re] of bad) assert.match(rewriteImports(s, 'labs/y.js').errors.join(' | '), re);
  assert.deepEqual(Object.keys(KIT_MODULES).sort(), ['lab/kit.js', 'lab/patterns/index.js', 'lab/shell.js', 'systems/audio.js']);
});

test('station names are read from export default without running the code', () => {
  assert.deepEqual(stationsIn('export default { inks, compare, dots: dotsStation };'), ['inks', 'compare', 'dots']);
  assert.deepEqual(stationsIn("export default { a: (x) => { return { b: 1 }; }, 'c': f, async d(ctx) { }, e };"), ['a', 'c', 'd', 'e']);
  assert.equal(stationsIn('export default stations;'), null);
  for (const f of readdirSync(path.join(root, 'courses', 'chroma', 'labs'))) assert.ok(stationsIn(readFileSync(path.join(root, 'courses', 'chroma', 'labs', f), 'utf8')).length, f);
});

test('packing chroma and the demo needs no change to their lab files; a station without code is named', () => {
  for (const slug of ['chroma', 'pocket-demo']) {
    const dir = path.join(root, 'courses', slug), labs = {};
    for (const f of readdirSync(path.join(dir, 'labs'))) labs[f.slice(0, -3)] = readFileSync(path.join(dir, 'labs', f), 'utf8');
    const anims = existsSync(path.join(dir, 'anims.js')) ? readFileSync(path.join(dir, 'anims.js'), 'utf8') : null;
    const r = makePayload({ course: json(`courses/${slug}/course.json`), labs, anims, slug });
    assert.deepEqual(r.errors, [], slug);
  }
  const c = json('courses/chroma/course.json'), labs = { lamps: readFileSync(path.join(root, 'courses', 'chroma', 'labs', 'lamps.js'), 'utf8') };
  assert.match(makePayload({ course: c, labs }).errors.join(), /no code and no "ready" pattern: .*wheel\.dials/);
});

test('the course is inserted once, safely, into the player', () => {
  const player = '<!doctype html><html lang="en"><head><title>Mnemopolis</title></head><body><script type="module">const s = "</body>";</script><script type="application/json" id="mnemo-course"></script>\n</body></html>';
  const out = insertPayload(player, { course: { title: 'A </script><b>', language: 'it' }, labs: {} });
  assert.match(out, /<title>A &lt;\/script&gt;&lt;b&gt;<\/title>/);
  assert.match(out, /<html lang="it"/);
  assert.equal(out.split('</script>').length - 1, 2, 'no early end of a script: < is escaped in the data');
  assert.throws(() => insertPayload(out, { course: {} }), /not an empty player/);
});
