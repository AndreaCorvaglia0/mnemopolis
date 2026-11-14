# What the engine reads

The engine has no content of its own. `npm run course <slug>` (run automatically by `build`,
`check` and `dev`; default slug `chroma`, or the `COURSE` environment variable) points it at
`courses/<slug>/`:

| File | Holds | Format |
|---|---|---|
| `course.json` | Everything the learner reads; the design of every lab station | `skills/knowledge-base/schema/course.schema.json` |
| `labs/<conceptId>.js` | Interaction code only: `export default { <stationId>: mount, ... }` | below |
| `anims.js` | Optional. `export const ANIMS = { name(g, seconds, canvas) {} }` for page figures | 720 x 400 canvas |
| `world.json` | Optional overrides of what the engine derives | below |

## Derived, unless `world.json` says otherwise

| From the course | The engine makes |
|---|---|
| concept `type` | the building: mechanism → lab, process → workshop, view → observatory, parts → archive, choice → hall, cases → studio, story → museum, deep → cave |
| theme `cue` | the landscape and landmark of the district (unused ones are assigned if missing) |
| concept `place`, `sign`, order | house name, sign, house number |
| concept `idea` | the host's one line |
| `finalCheck` | the league hall |

```json
{ "hub": { "name": "Prism Square", "monument": "fountain", "guide": { "name": "Iris", "hi": "..." } },
  "themes": { "light": { "nature": "river", "landmark": "obelisk" } },
  "places": { "lamps": { "kind": "lab", "host": { "name": "Lux", "look": "tech", "hi": "..." } } } }
```

Character looks: `mentor`, `kid`, `nurse`, `fisher`, `archivist`, `surveyor`, `tech`, `keeper`, `tess`.

## Goals on the ending card

`goals` in `course.json` are strings, or `{ "text": "...", "concepts": ["print"] }` for a goal that
an extra concept teaches: the ending card lists it only when each named concept is core or was
finished by the player (lab done, or its badge). Plain strings are always listed.

## Locks and upper floors: `riddles`, `advanced`

Both optional; the rules are in `skills/knowledge-base/references/7-progression.md`, the engine side
in `ENGINE.md` ("Locks", "Upper floors").

| Field | Where | Meaning |
|---|---|---|
| `"advanced": true` | a lab station | it lives on the house's upper floor: not in the ground-floor lab, not in the main path's `lab n/m` count. Its code is a station like any other, in `labs/<conceptId>.js` |
| `riddles` | a concept, up to 3 | locks with a free answer: a safe, a computer, a door with a hatch |

A riddle:

```json
{ "id": "marta-safe", "kind": "safe",
  "clue": "Combination: where my green sits on the wheel. In degrees. M.",
  "answer": 120, "type": "number", "tolerance": 1, "unit": "°",
  "from": { "station": "dials" },
  "inside": { "note": "Marta's note. Lightness on my dials is not how light ...", "coins": 15 },
  "where": "upstairs" }
```

| Key | |
|---|---|
| `id` | unique in the course (lowercase, digits, dashes); the save keeps `locks[id]`, `tries[id]` |
| `kind` | `safe` (digit keys for numbers and codes), `computer` (a login), `door` (a voice behind a hatch); others are drawn as a safe |
| `clue` | the sticky note, or what the voice asks: a line or two |
| `answer` | one accepted answer or a list; at most three words or one number |
| `type` | `text` (default for strings), `number` (default for numbers), `code` (digits, exact) |
| `tolerance`, `unit` | numbers only; default tolerance: exact for an integer. A number read off a lab's live value: 1, and the lab must let the learner land on it exactly |
| `from` | where the answer is taught: `{ "page": true }` or `{ "station": "<id>" }`, of this concept or of `"concept": "<id>"`. The thought after a miss points there |
| `inside` | `note` (1 to 4 sentences), `station` (an advanced station of this concept), `link` (a `further` link: its index or url), `coins`, `tool` (key, pickaxe, saw, shears), `key` (a concept id: its upper floor) |
| `where` | `upstairs` (default) or `room` (the ground floor). Any other text is a placement hint and counts as upstairs |

A house gets an upper floor when its concept has an advanced station, a riddle upstairs or a
`further` link, and is drawn as a room (not a workshop, not a museum). The ground floor then has
a staircase, opened by the owner's key (`state.keys[id]`).

## A station without code: `ready`

A station may name a ready-made pattern and give its data instead of code:
`"ready": { "kind": "slider-reveal" | "compare" | "sort" | "order", ... }`. Its tasks are then
written `{ "text": "...", "when": { "<verb>": ... } }`, so that they can tick. The data of each
kind, the tries vocabulary and the expression language are in
`skills/knowledge-base/references/8-ready-labs.md`; the validator checks them. Code in
`labs/<conceptId>.js` for the same station id wins over `ready`. Custom code is the normal case;
a pattern can also be called from code (`sliderReveal(ctx, data)`) and extended.

## A station's code

```js
import { h, seg, slider, readout } from '../../../engine/src/lab/shell.js';
import { canvasPane, draggable } from '../../../engine/src/lab/kit.js';

async function mix(ctx) { /* draw into ctx.stage, add controls to ctx.controls */ }
export default { mix };            // the key is the station id in course.json
```

Goal, tasks, takeaway, source and the prediction question come from `course.json` and are shown
by the lab frame. The code only draws and reacts. Your `mount` runs as soon as the station opens:
the picture is visible from the first moment, frozen while the prediction question is open.

| | |
|---|---|
| `ctx.stage` | The picture area: most of the screen. Append a `canvasPane` or your own elements. |
| `ctx.station` | The station as `course.json` gives it: texts, `ready` data, and `ctx.station.when[i]`, the condition of task `i` when it is written `{ text, when }`. |
| `ctx.controls` | Sliders, switches, read-outs: in the panel beside the picture, directly under the picture on a phone. Hidden until the prediction is made. |
| `ctx.did(i)` | Task `i` of the station's `tries` is done. When all are, the verdict and the takeaway appear. Calls made before the prediction are kept and shown after it. |
| `ctx.reveal()` | Show the verdict and the takeaway now. |
| `ctx.alive()` | `false` once the learner has left. Check it after every `await`. |
| `ctx.onCleanup(fn)` | Stop timers, audio and animation frames here. |
| `ctx.size()` | Optional. `{ w, h, upright }`: the stage in screen pixels; `upright` when the panel is a bottom sheet. |
| `ctx.onResize(fn)` | Optional. `fn(ctx.size())` whenever the stage changes size. |
| `ctx.phase()`, `ctx.said()` | Optional. `'ask'`, `'explore'` or `'done'`, and the index of the answer picked (or `null`). |
| `ctx.hint(fn)` | Optional. `fn(k)` says where to act for task `k`: `[x, y]` in the units of your `canvasPane`, a control element (or a list), or `{ el, at }`. The frame outlines the control while the task is current and pulses a ring at the point when the learner taps the step. `pane.hint(fn)` is the same for points only. |
| `ctx.nudge(text, ms)` | Optional. A short line shown for a few seconds in the step card and the bar under the picture. Use it once, when a hint becomes useful ("Point at the overlap to read the light there"), instead of a permanent read-out. |

The lab kit (`lab/kit.js`, also re-exported there: `stage`, `sliders`, `button`, `tasks`, `ink`,
`C`, `animate`, `spring`, `shuffle`, `hit`, the expression language, the patterns) makes a
station shorter: see "The lab author's card" in `references/8-ready-labs.md`. In a game packed
into the prebuilt player, lab code may import only `lab/kit.js`, `lab/shell.js`,
`lab/patterns/index.js` and `systems/audio.js`.

`canvasPane(stage, w, hgt, caption, { portrait: [w2, h2] })` (in `lab/kit.js`) is the usual
picture. You draw in your own units (`w` x `hgt`); the pane scales that box to the largest size
the stage allows, at the screen's real resolution, and redraws nothing by itself:

| | |
|---|---|
| `pane.g` | The 2D context, in your units. `getImageData` and `putImageData` also take your units. |
| `pane.W`, `pane.H`, `pane.upright` | The box in use: `(w, hgt)`, or the `portrait` box when the stage is not wide (a phone held upright). |
| `pane.onResize(draw)` | Call your draw after every resize (a resize clears the canvas). Without it the pane stretches the last picture. |
| `pane.font(size, weight)` | A CSS font of `size` units that is never smaller than 16 screen pixels. Use it for all text. |
| `pane.px(n)` | `n` screen pixels in your units (hairlines, hit areas). |
| `pane.drag(fn)`, `pane.hover(fn)` | `fn(x, y, phase)` in your units; works with a finger. |
| `pane.tip(fn)` | `fn(x, y)` returns HTML or `null`: a small read-out next to the pointer, or above the finger. Good for charts. |
| `pane.caption(text)` | One line above the picture. |

Old station code needs no change. `pane.cv.width` and `pane.cv.height` read the station's units
(`w` x `hgt`, as when the canvas had exactly that size); setting them changes the box and clears
the picture; `pane.cv.getContext('2d')` returns `pane.g`, so old drawing and pixel calls stay
in station units; a station without `onResize` gets its last picture rescaled after a resize.
The real backing store, in device pixels, is `pane.backing()`.

### Upgrading a station

1. Pass a `portrait` box and lay out from `pane.W` / `pane.H`; call `pane.onResize(draw)`.
2. Replace every `pane.cv.width` / `height` with `pane.W` / `pane.H` (they may differ on a phone).
3. Remove texts that repeat the frame: "Drag a lamp" read-outs, ticks, "well done", your own
   instructions. Turn a hint that matters at one moment into `ctx.nudge`, and a read-out that
   follows the pointer into `pane.tip`.
4. Add `ctx.hint` so that tapping a step points at the right lamp or slider.
5. Check `npm run shots:lab` on desktop and phone: nothing covered, nothing cut.

A code panel whose values are controls (see `lab/code.js`): export its specification as
`<stationId>Code` next to the mount.

`npm run check` fails if a station in `course.json` has no code.

## Mini-games, withheld lines, experience: `games`, `withheld`

All optional; the complete reference for authors, with examples that `npm test` validates, is
`skills/knowledge-base/references/10-games.md`. The engine side: `ENGINE.md`, "Experience",
"Mini-games", "Sound for labs and interactions".

| Field | Where | Meaning |
|---|---|---|
| `games` | top level of `course.json`, an array | short arcade-like games started by an interaction; never part of the main path |
| `withheld` | top level, an array (at most 6) | things a person starts to tell and stops; told at an experience tier, then kept in the notebook's Clues |

A game:

```json
{ "id": "higher", "title": "Higher or lower?", "concepts": ["pitch"], "kind": "which",
  "where": "town", "object": "piano", "rounds": 8, "learn": "More squeezes per second: a higher note.",
  "data": { "ask": "Which note is higher?", "pick": "max",
            "make": { "kind": "tone", "from": 220, "to": 880, "gap": [7, 0.5], "unit": "semitones" } } }
```

| Key | |
|---|---|
| `id`, `title` | unique id (lowercase, digits, dashes); a title of at most 5 words |
| `concepts` | the concepts it practises; it opens when each is remembered (`"unlock": "lab"`: when their labs are done) |
| `kind` | `which`, `match-fast`, `sort-fast`, `odd-one-out`, `sequence`, `estimate`, `custom` |
| `where` | `town` (default: an object on a spot placed by the engine), `person` (a townsperson offers it), `host` (the owner of the first concept's house offers it) |
| `object` | `town` only: `piano`, `board`, `hat`, `box`, `bench` |
| `rounds` | 3 to 20, default 8 (`match-fast`: boards, default 3) |
| `learn` | one line for the result screen |
| `data` | what the kind needs: `references/10-games.md` |

A custom game: `courses/<slug>/games/<id>.js`, `export default { mount(g) { ... } }`, importing
only the lab modules (`lab/kit.js`, `lab/shell.js`, `lab/patterns/index.js`, `systems/audio.js`),
so it packs into the prebuilt player like a lab file.

A withheld line: `{ "id", "by": "<conceptId>" | "town", "tier": "passing" | "settling" | "known" | "home", "teaser", "told" }`.

`world.json`: `"games": false` hides every game; `"experience": false` switches off experience, the
people's remarks about it, withheld lines and the door that knows you (the town as before).

## Sound in a station

`sound(ctx)` from `lab/kit.js`: tones, a plucked string, a soft piano, a bell, chords (equal or just),
beats, sustained tones for sliders, a scope to draw what sounds. Stopped when the station closes;
the ambient music ducks while it plays. The kit's controls click and tick by themselves;
`stage(ctx, sizes, draw, { quiet: true })` or `ctx.quiet()` silences them. Details and an example:
`references/10-games.md`, "Sound for labs and games".
