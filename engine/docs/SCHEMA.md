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
