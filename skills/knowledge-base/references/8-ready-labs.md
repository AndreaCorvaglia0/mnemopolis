# Step 5c. Building a lab: the author's card, the kit, ready-made patterns

A lab is designed for its concept (`5-labs.md`): its object, its verb, its surprise. That design
is where the effort goes. This file makes the building cheap and reliable, in three layers:

1. **The author's card** (below): a complete station to copy, the rules, the usual mistakes.
   Enough to write a correct, good-looking station in one go without reading the engine.
2. **The kit**: helpers a station imports from `engine/src/lab/kit.js` (a stage that lays itself
   out on a laptop and on a phone, sliders, drawing with text that stays readable, tasks that tick
   themselves, animation). A typical custom station is 30 to 60 lines with them.
3. **Ready-made patterns**: `slider-reveal`, `compare`, `sort`, `order`. A station may call one
   from its code and draw its own things on top, or, when the design *is* that pattern, give
   its data in `course.json` (`"ready"`) and write no code at all.

Custom code is the normal case. Use a pattern where it fits the concept, not to avoid designing
the lab: a pattern that does not carry the concept's own object fails the swap test.

## The author's card

### A complete station

`courses/<slug>/labs/<conceptId>.js`: one function per station id, exported by default.

```js
// The Kettle House: water boils at a lower temperature higher up.
import { stage, sliders, tasks, C, alpha, clamp } from '../../../engine/src/lab/kit.js';

async function boil(ctx) {
  const t = tasks(ctx); // ticks the station's tasks by their "when" in course.json
  const ctl = sliders(ctx, [{ id: 'alt', label: 'Altitude', min: 0, max: 8000, step: 100, value: 0, unit: 'm' }],
    (id, v) => { t.value(id, v).check(); view.redraw(); });
  const view = stage(ctx, { wide: [760, 480], tall: [480, 600] }, (d, pane) => {
    const alt = ctl.v.alt, bp = 100 - alt / 300;          // a simplified rule, named in "source"
    const W = pane.W, H = pane.H, up = pane.upright;
    d.clear();
    // the object: a pot of water on the stove
    const px = W / 2 - 110, py = H * 0.35;
    d.box(px, py, 220, 160, { fill: C.card2, stroke: C.line2, r: 18 });
    d.box(px + 10, py + 30, 200, 120, { fill: alpha(C.blue, 0.6), r: 12 });
    for (let i = 0; i < 8; i++) d.circle(px + 30 + i * 22, py + 120 - (i % 3) * 30, 6, { fill: alpha('#ffffff', 0.7) });
    d.text(`boils at ${bp.toFixed(0)} °C`, W / 2, py + 210, { size: 26, weight: 700, color: C.gold, align: 'center' });
    d.text(`altitude ${alt} m`, W / 2, py - 24, { size: 18, color: C.muted, align: 'center' });
  });
  ctx.hint(() => ctl.el.alt); // tapping the step outlines the slider
}

export default { boil };
```

And its station in `course.json` (texts live there, never in the code):

```js
{ "id": "boil", "tab": "Boil higher up", "goal": "...", "pattern": "cause-effect", "object": "...",
  "action": "...", "surprise": "...", "predict": { "q": "...", "options": ["...", "...", "..."], "answer": 1 },
  "tries": [
    { "text": "Climb to 3000 m.", "when": { "reach": { "control": "alt", "value": 3000 } } },
    { "text": "Go above 6000 m.", "when": { "cross": { "control": "alt", "above": 6000 } } } ],
  "takeaway": "...", "source": "..." }
```

### The rules

- **The picture is the object of the station**, as large as the stage: lay out from `pane.W`,
  `pane.H` and `pane.upright` (a phone held upright gets the `tall` box). Never a small drawing in
  a corner.
- **Everything shown is computed from the state.** One draw function; change the state, call
  `view.redraw()`. No number typed by hand to look like a result.
- **Hands on the object.** Drag the thing itself when you can (`view.pane.drag((x, y, phase) => ...)`,
  coordinates in your units); a slider is for a quantity, two controls at most.
- **Every task can tick**, only when really done, and a finger can do it (forgiving thresholds:
  `within`, a step, a range). If there is a prediction, the first task leads to the state that
  answers it.
- **Text through the kit**: `d.text` and `d.wrap` keep at least 16 screen pixels and shrink or
  wrap to the width you give (`max`). Things to drag at least 40 px across on a phone.
- **No instructions, ticks, praise or Next buttons on the picture**: the frame does that from
  `course.json`. A hint needed once is `ctx.nudge('...')`; where to act is `ctx.hint(k => ...)`.
- **Nothing gives the answer away before the prediction**: the picture is shown frozen while the
  question is open; draw the starting state so it does not answer it.
- **Clean up**: `animate` and `ctx.onCleanup` stop loops, timers and sounds when the learner leaves.

### Mistakes that cost a rebuild

| Mistake | Instead |
|---|---|
| `ctx.did(i)` called from the first draw (the task ticks before anything is done) | `tasks(ctx)`: conditions are tested only after `.check()`, which you call on learner actions |
| Text with `g.font = '14px ...'` (unreadable on a phone) | `d.text(s, x, y, { size: 18 })`, `pane.font(18)` |
| Positions in screen pixels | your own units: `stage(ctx, { wide: [760, 480], tall: [480, 600] })` |
| One layout for both shapes | `pane.upright ? tallLayout : wideLayout` |
| Importing other engine files | only `lab/kit.js`, `lab/shell.js`, `lab/patterns/index.js`, `systems/audio.js` (see "The import surface"); anything else is refused when the game is packed |
| A caption that says "Drag the lamp" while the picture is frozen | no caption, or one that names the object |
| A slider beside a paragraph | the slider changes the object, visibly |

### The kit

Import from `'../../../engine/src/lab/kit.js'`:

| | |
|---|---|
| `stage(ctx, { wide, tall, caption }, draw)` | A canvas for the whole stage. `draw(d, pane)` runs now and after every resize. Returns `{ pane, d, redraw }`. `pane.W`, `pane.H`, `pane.upright`; `pane.drag(fn)`, `pane.tip(fn)`, `pane.hint(fn)`, `pane.px(n)` (n screen pixels in your units). |
| `sliders(ctx, defs, onInput)` | Sliders in the controls panel (under the picture on a phone), sized for thumbs. A def: `{ id, label, min, max, step, value, unit, decimals }`, or `{ id, label, options: [[0, 'Off'], [1, 'On']] }` for a switch. Returns `{ v, el, set(id, x) }`: values, elements (for `ctx.hint`), setter. |
| `button(ctx, label, onClick, { primary })` | A large button in the controls panel ("Run", "Show the real curve"). |
| `tasks(ctx, whens?)` | The tries vocabulary from code (below). Default: the `when` of each task in `course.json`. `t.value(id, x)`, `t.pick(id)`, `t.state(key)`, then `t.check()`. `t.rec` is the learner record (`t.rec.placed`, `t.rec.moved`, `t.rec.revealed`...). |
| `d = ink(pane)` (given to `draw`) | `d.clear()`, `d.box(x, y, w, h, { fill, stroke, r, glow })`, `d.circle(x, y, r, {...})`, `d.line(points, { color, width, dash })`, `d.arrow(x1, y1, x2, y2, {...})`, `d.text(s, x, y, { size, weight, color, align, max })`, `d.wrap(s, x, y, w, { size, lines })` (returns the height), `d.emoji('🔔', x, y, size)`, `d.shapes(list, box, vars)`; `d.g` is the 2D context. |
| `C`, `color(name)`, `alpha(c, a)`, `mixColor(a, b, t)` | The frame's colours: `C.acc` (teal: the thing to act on), `C.gold` (results, the learner's own), `C.bad`, `C.ok`, `C.blue`, `C.purple`, `C.text`, `C.muted`, `C.card`, `C.card2`, `C.line`. |
| `animate(ctx, frame)` | `frame(dt, t)` on every animation frame while it returns true; `.kick()` starts it. Stops when the learner leaves; with reduced motion `dt` is `Infinity` once. |
| `spring(v, speed)` | A value that eases to `.to(x)`; `.step(dt)` returns true while moving; `.v` is the value. Snaps and settles that feel good. |
| `shuffle(list, seed)`, `hit(list, x, y)` | A deterministic shuffle (never the identity); the item under a point (`{x, y, w, h}` or `{x, y, r}`). |
| `compile(expr, names)`, `template(text, names)`, `fmt(x, d)` | The expression language below, from code. |
| `sfx.tick()`, `sfx.plop()`, `sfx.chime()`, `sfx.thud()`, `sfx.reveal()` | Short sounds, for a snap or an arrival. |
| `canvasPane`, `draggable`, `slider`, `seg`, `readout`, `h`, `rgbCss`, `hslToRgb` | The older pieces (`engine/docs/SCHEMA.md`), still there. |
| `sliderReveal`, `compare`, `sort`, `order` | The ready-made patterns as functions (below). |

`ctx` (from the frame): `ctx.stage`, `ctx.controls`, `ctx.station` (the station from course.json),
`ctx.did(i)`, `ctx.hint(fn)`, `ctx.nudge(text)`, `ctx.alive()`, `ctx.onCleanup(fn)`, `ctx.phase()`.

### The import surface

A game is made either by the build (`COURSE=<slug> npm run build`) or, without installing
anything, by packing the course into the prebuilt player (`node scripts/pack.mjs courses/<slug>`,
or the `/play/` page). In a packed game a lab file may import only from:

| Module | What it gives |
|---|---|
| `engine/src/lab/kit.js` | everything in the table above (use this one) |
| `engine/src/lab/shell.js` | `h`, `seg`, `slider`, `readout`, `predict`, `TEXT`, `LANG` |
| `engine/src/lab/patterns/index.js` | the patterns and helpers (also in kit.js) |
| `engine/src/systems/audio.js` | `sfx` |

Written as relative paths (`'../../../engine/src/lab/kit.js'`). Static `import { a, b as c }`,
`import * as K` and default imports work; dynamic `import()`, `export ... from`, CDNs and other
files are refused with the file and line. A lab file stays one self-contained module.

## The tries vocabulary

A task may be `{ "text": "...", "when": <condition> }`. A condition is an object with **one**
key, the verb. A ready-made pattern needs this form; custom code may use it through `tasks(ctx)`
or call `ctx.did(i)` itself.

| Verb | Value | Done when | Patterns |
|---|---|---|---|
| `reach` | `{ "control": "f", "value": 440, "within": 5 }` or `{ "control": "f", "min": 400, "max": 500 }` | the control is at that value now (default tolerance: one step, or 2% of the range) | slider-reveal, compare |
| `cross` | `{ "control": "f", "above": 880 }` or `{ "control": "f", "below": 100 }` | the control has gone past the threshold, once | slider-reveal, compare |
| `both` | `{ "control": "f" }` | the control has been at its minimum and at its maximum | slider-reveal, compare |
| `try` | `{ "count": 3, "control": "f" }` (control optional) | that many different settings of the control (or of the whole picture) | slider-reveal, compare, sort, order |
| `select` | `"water"` or `["a", "b"]` | the learner has picked up or tapped that card or step | sort, order |
| `place` | `{ "item": "water", "bin": "fast" }`, `{ "all": true }` or `{ "correct": true }` | that card is in that bin; every card is placed; every card is in its right bin | sort |
| `run` | `true` or `"correct"` | the sequence was run; run in the right order | order |
| `all`, `any` | `[condition, ...]` | every one / at least one holds | all |

Verbs that custom code can feed through `t.rec` (`sketch`, `reveal`, `gap`, `combine`, `pair`,
`label`, `nudge`, `count`): see `engine/src/lab/patterns/when.js`. The validator checks the
conditions of ready stations: an unknown control, a value outside its range, a verb the pattern
does not support, each with the list of what is allowed.

## The expression language

Numbers in the data of a pattern can be expressions, written as strings: `"343/f"`,
`"10^(k*extra/10)"`, `"sin(2*pi*f*x/1000)"`. Safe by construction (a small parser, never `eval`).

- Numbers `12`, `0.5`, `.5`, `1e3`; operators `+ - * / % ^` (power, right-associative:
  `-2^2` is `-4`), parentheses; comparisons `< <= > >= == !=` give 1 or 0.
- Functions: `min max abs sqrt exp log log10 sin cos tan round floor ceil sign clamp(x,a,b)
  if(c,a,b)`; `round(x, 2)` keeps 2 decimals. Constants `pi`, `e`.
- Names: the ids of the controls, the `vars` of the cases (compare), the station's `vars` (each
  may use the ones before it), and `x` inside a `curve`.
- Labels with live values: `"Period {1000/f:2} ms"` (`{expression}` or `{expression:decimals}`).
- An error names the problem and the names you can use: `unknown name "g". Names you can use
  here: f, T, x`.

## Ready-made patterns

| Pattern | The learner | Fits | Data, in two lines |
|---|---|---|---|
| `slider-reveal` | moves one or two sliders; a plot, bars or a picture follow live; regions light up when a condition holds | a mechanism with a clear dependency, a formula, a scale | `controls` (1 or 2), optional `vars` and `plot`; `layers`: `curve`, `points`, `threshold`, `region`, `marker`, `bars`, `shapes`, `readout` |
| `compare` | moves the same control for two cases side by side; the measured difference and its ratio are lit when large | contrasts: with and without, small and large | `cases` (2, each with its own `vars`), `controls` (0 to 2), `layers` drawn for each case, `diff` (the measured quantity) |
| `sort` | drags cards into 2 to 4 bins; each bin takes the card with a bounce and a count, the card explains itself; misplaced cards wobble once all are placed | categories, a criterion found by judging cases | `bins` (2 to 4), `cards` (3 to 10, each with its `bin` and `why`), optional `scale` with a `value` per card |
| `order` | swaps 3 to 7 steps on a track, runs it; the run lights each step and its result, and stops where the order breaks, saying why | processes, cycles, cause-and-effect chains | `steps` in the right order, each with `label`, optional `emoji`, `result`, `early` |

Common fields: `"caption"` (one line above the picture), `"wide"` and `"tall"` (the boxes, in
units, for wide and upright screens). Pictures (`shapes`) are drawn in a 0..100 box: x to the
right, y down, positions as shares of the box, sizes (`r`, `size`, `width`) as shares of its
smaller side. Shapes: `rect [x, y, w, h]`, `circle [x, y, r]`, `line [[x, y], ...]`,
`arrow [[x, y], [x, y]]`, `text "..." at [x, y]`, `emoji "🔔" at [x, y]`; with `color`,
`opacity`, `show` (drawn while not 0), `outline`, `glow`, `round`, `width`, `dash`, `size`,
`align`, `weight`. Colours: `accent`, `gold`, `red`, `green`, `blue`, `purple`, `orange`, `text`,
`muted`, `grey`, `white`, `black`, `dark`, or `"#rrggbb"`. Every number may be an expression.

### slider-reveal

```json
{
  "id": "circle", "tab": "Circle area", "goal": "The area of a circle grows with the square of its radius.",
  "pattern": "cause-effect", "object": "A circle and the curve of its area.", "action": "Changes the radius.",
  "surprise": "Twice the radius gives four times the area.",
  "predict": { "q": "Double the radius. The area becomes...", "options": ["twice as big", "four times as big", "the same"], "answer": 1 },
  "tries": [
    { "text": "Set the radius to 2 cm.", "when": { "reach": { "control": "r", "value": 2 } } },
    { "text": "Double it to 4 cm and read the area.", "when": { "reach": { "control": "r", "value": 4 } } }
  ],
  "takeaway": "Area = π r²: twice the radius, <b>four times</b> the area.", "source": "Computed live.",
  "ready": {
    "kind": "slider-reveal",
    "controls": [{ "id": "r", "label": "Radius", "min": 0.5, "max": 4, "step": 0.1, "value": 1, "unit": "cm" }],
    "vars": { "A": "pi*r^2" },
    "plot": { "x": { "min": 0, "max": 4, "label": "radius (cm)" }, "y": { "min": 0, "max": 52, "label": "area (cm²)" } },
    "layers": [
      { "shapes": [{ "circle": [50, 50, "10*r"], "color": "accent", "glow": true }, { "text": "r = {r:1} cm", "at": [50, 92], "size": 7 }] },
      { "region": [3, 4], "when": "r >= 3", "label": "more than 28 cm²" },
      { "curve": "pi*x^2", "label": "area = π r²" },
      { "marker": ["r", "A"], "label": "{A:1} cm²" },
      { "readout": "Area now {A:1} cm²" }
    ]
  }
}
```

### compare

```json
{
  "id": "decibels", "tab": "Ten times", "goal": "Each 10 decibels more is ten times the sound intensity.",
  "pattern": "contrast", "object": "Two speakers side by side.", "action": "Raises speaker B decibel by decibel.",
  "surprise": "At 10 dB more, B already carries ten times the intensity.",
  "tries": [
    { "text": "Make speaker B 10 dB louder than A.", "when": { "reach": { "control": "extra", "value": 10 } } },
    { "text": "Now 20 dB louder: read the ratio.", "when": { "reach": { "control": "extra", "value": 20 } } }
  ],
  "takeaway": "+10 dB is <b>×10</b> the intensity.", "source": "Computed live from the definition of the decibel.",
  "ready": {
    "kind": "compare",
    "controls": [{ "id": "extra", "label": "Speaker B, louder by", "min": 0, "max": 30, "step": 1, "value": 0, "unit": "dB" }],
    "cases": [
      { "id": "a", "label": "Speaker A: 60 dB", "short": "A", "vars": { "k": 0 } },
      { "id": "b", "label": "Speaker B: {60+extra:0} dB", "short": "B", "vars": { "k": 1 } }
    ],
    "vars": { "amp": "10^(k*extra/20)" },
    "layers": [{ "shapes": [{ "circle": [22, 42, "min(7*amp, 70)"], "color": "accent", "outline": true }, { "text": "{60+k*extra:0} dB", "at": [50, 88], "size": 12, "color": "gold" }] }],
    "diff": { "value": "10^(k*extra/10)", "label": "Sound intensity (A = 1)", "decimals": 0 }
  }
}
```

### sort

```json
{
  "id": "mediums", "tab": "Sort the mediums", "goal": "Sound needs matter: none in a vacuum, faster in water and steel than in air.",
  "pattern": "sort-cases", "object": "Cards of materials and three bins.", "action": "Drags each card into a bin.",
  "surprise": "Steel carries sound about seventeen times faster than air; space carries none.",
  "tries": [
    { "text": "Put outer space in its bin.", "when": { "place": { "item": "space", "bin": "none" } } },
    { "text": "Sort every card correctly.", "when": { "place": { "correct": true } } }
  ],
  "takeaway": "No sound in a <b>vacuum</b>; faster in liquids and solids.", "source": "OpenStax table 17.1.",
  "ready": {
    "kind": "sort",
    "bins": [
      { "id": "slow", "label": "Slower than in air", "emoji": "🐢", "color": "blue" },
      { "id": "fast", "label": "Faster than in air", "emoji": "🚀", "color": "gold" },
      { "id": "none", "label": "No sound at all", "emoji": "🔇", "color": "red" }
    ],
    "cards": [
      { "id": "water", "label": "Fresh water", "emoji": "💧", "bin": "fast", "why": "about 1480 m/s, over four times faster than in air." },
      { "id": "space", "label": "Outer space", "emoji": "🌌", "bin": "none", "why": "a near vacuum: no molecules to pass the squeeze along." },
      { "id": "co2", "label": "Carbon dioxide", "emoji": "🫧", "bin": "slow", "why": "about 259 m/s at 0 °C, where air gives 331 m/s." }
    ]
  }
}
```

### order

```json
{
  "id": "water", "tab": "Water cycle", "goal": "Water moves in a cycle: each stage needs the one before.",
  "pattern": "step-through", "object": "Four stages of the water cycle on a track.", "action": "Puts the stages in order and runs them.",
  "surprise": "Run in the wrong order, the cycle stops at the first stage that has nothing to work on.",
  "tries": [
    { "text": "Run the sequence once.", "when": { "run": true } },
    { "text": "Put the stages in order and run it.", "when": { "run": "correct" } }
  ],
  "takeaway": "Evaporation, condensation, precipitation, collection: <b>each needs the one before</b>.", "source": "A simplified cycle.",
  "ready": {
    "kind": "order",
    "steps": [
      { "id": "evap", "label": "The sun warms the sea: water evaporates", "emoji": "☀️", "result": "Water vapour rises.", "early": "Evaporation needs liquid water warmed by the sun." },
      { "id": "cond", "label": "Vapour cools high up and condenses", "emoji": "☁️", "result": "Clouds form.", "early": "There is no vapour to condense yet." },
      { "id": "rain", "label": "Droplets grow and fall", "emoji": "🌧️", "result": "Rain or snow.", "early": "Rain needs clouds first." },
      { "id": "flow", "label": "Rivers carry it back to the sea", "emoji": "🌊", "result": "The sea is filled again.", "early": "Nothing has fallen yet to flow back." }
    ]
  }
}
```

### A pattern from code, extended

The same data, passed to the function, gives a handle; draw on top with `over`, add controls,
tick extra tasks through `lab.t`. From `courses/pocket-demo/labs/pitch.js`:

```js
import { sliderReveal, button, C } from '../../../engine/src/lab/kit.js';

async function tone(ctx) {
  const lab = sliderReveal(ctx, {
    controls: [{ id: 'f', label: 'Frequency', min: 100, max: 1000, step: 10, value: 220, unit: 'Hz' }],
    plot: { x: { min: 0, max: 25, label: 'time (milliseconds)' }, y: { min: -1.3, max: 1.3, label: 'air pressure at the ear' } },
    layers: [{ curve: 'sin(2*pi*f*x/1000)' }, { readout: '{f:0} squeezes per second' }],
  });
  lab.over((d, s, r) => {               // s: the variables now; r.A.plot: [x, y, w, h] of the plot
    const [x0, y0, w, h] = r.A.plot;
    for (let tx = 250 / s.f; tx <= 25; tx += 1000 / s.f) d.circle(x0 + (tx / 25) * w, y0 + h * 0.06, 7, { fill: C.gold });
  });
  button(ctx, 'Listen to it', () => { /* Web Audio: an oscillator at lab.v.f */ });
}
export default { tone };
```

Handles: `sliderReveal` and `compare` give `{ pane, d, v, el, t, redraw, over }`; `sort` gives
`{ pane, d, t, cards, bins, redraw, over }`; `order` gives `{ pane, d, t, slots, run, redraw, over }`.

## Making one of them the wow lab

The wow lab is where a picture changes the learner's mind (`5-labs.md`, the surprise). A pattern
gets there only when it is tuned for that moment:

- **Lead the first task to the surprise.** A `reach` on the value where the wrong belief breaks
  (`"value": 10` for "+10 dB is ×10").
- **Light the moment.** A `region` with `when` lights and chimes as the condition becomes true; in
  `compare` the ratio box glows past ×1.5; in `sort` the misplaced cards wobble; in `order` the
  run stops on the broken step with its `early` text.
- **Put the concept's own object in the picture** with `shapes` (a speaker, a pot, a cell), not
  only a chart.
- **Add what only this concept has, in code**: the real tone of a frequency, the learner's own
  sketch under the real curve (`pocket-demo/labs/pitch.js`, "Guess the curve"). Usually the wow
  lab is a custom station; the kit keeps it short.

## How long a station is

From the demo course (`courses/pocket-demo/`): the custom "Push the air" (a travelling squeeze in a
field of molecules, a draggable cone, an ear) is about 60 lines; "Guess the curve" (four handles, the
real curve drawn over the guess with the gap shaded) about 50; "More per second" (the pattern
called from code, plus the tone and the counted squeezes) about 30; the two ready stations are
data only. The stations of the example course `courses/chroma/`, written before the kit, are 30
to 90 lines each, with their own layout and drawing code.
