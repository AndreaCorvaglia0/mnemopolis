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
by the lab frame. The code only draws and reacts.

| | |
|---|---|
| `ctx.stage` | The large area on the left. Append a `canvasPane` or your own elements. |
| `ctx.controls` | The column for controls and readouts. |
| `ctx.did(i)` | Tick task `i` of the station's `tries`. When all are ticked, the takeaway appears. |
| `ctx.reveal()` | Show the takeaway directly. |
| `ctx.alive()` | `false` once the learner has left. Check it after every `await`. |
| `ctx.onCleanup(fn)` | Stop timers, audio and animation frames here. |

A code panel whose values are controls (see `lab/code.js`): export its specification as
`<stationId>Code` next to the mount.

`npm run check` fails if a station in `course.json` has no code.
