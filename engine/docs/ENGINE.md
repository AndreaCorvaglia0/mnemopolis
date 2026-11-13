# The engine: commands, files, pitfalls

## Commands (run in `engine/`)

| | |
|---|---|
| `npm install` | Once. Needs Node 18 or later. |
| `npm run course <slug>` | Points the engine at `courses/<slug>/` (default `chroma`, or `COURSE=`). Run by the commands below. |
| `npm run check` | Validates the knowledge base, and that every designed station has code. |
| `npm run build` | Check, then build one self-contained page: `dist/index.html`. |
| `npm run shots:phone` | The same tour on a phone held upright (390 x 844, touch mode), into `shots/phone/`. |
| `npm run shots:lab` | The lab frame state by state (question, after it, one task, verdict, panel folded, theory, full screen) and the first state of every station, on a desktop window and a phone, into `shots/lab/`. The tasks are done with real drags. `STATION=lamps:0` picks the station walked through. |
| `npm run shots` | Opens the build in headless Chrome and saves a picture of the town, of a real walk into a house and back, of every room, station and page, to `shots/`. Needs Chrome or Chromium (`CHROME=/path` if it is not found). |
| `npm run dev` | Live server while editing, if a browser is available. |

Add `?lite` to the address for lighter graphics. The game also switches to them by itself on a
slow machine.

Publishing: `dist/index.html` is a single file with everything inside. Publish it as an artifact,
or send the file. It saves progress in the browser's local storage when available and works
without it.

## Files

```
engine/src/
  course/          adapter: turns courses/<slug>/course.json into what the scenes need
  world/townMap.js generates the town from the course
  scenes/          Boot, Town, Interior (standard room), Workshop (belt), Museum (timeline), UI
  lab/             shell.js (station frame), style.js (its look), kit.js (canvas, drag, read-outs),
                   code.js (code panel), reading.js (reading wall), map.js (the map), museum.js (plaques)
  art/             everything drawn in code: ground, buildings, sprites, palette
  systems/         state (save), audio (music and sounds), walker (movement)
  data/content.js  read-only views of the course for the scenes
```

Course work happens in `courses/<slug>/`, not here. See `WORLD.md` for what a custom look touches.

## How things connect

- A house's `id` is the key everywhere: `LABS[id]`, `PAGES[id]`, the saved progress.
- `state.visited[id]` is set when the learner opens a lab or a museum. Review questions come
  only from visited houses.
- `state.done['id:k']` is set when station `k` shows its takeaway. The map shows `lab 2/3`.
- `state.stamps[id]` is set when the house quiz is passed (two of three). `state.passedLeague`
  for the league. `state.insight` holds the points (certainty-based: sure and right earns more,
  sure and wrong costs). Points are stored for a later version; nothing spends them yet.

## Pitfalls already paid for

- **Scenes are reused.** Phaser keeps the scene object between visits. Any flag set when leaving
  (`locked`, `leaving`) must be reset in `create`, or the player freezes on return. `npm run shots`
  walks into a house and back to catch this.
- **Module-level constants computed from a place** break as soon as there are two places of that
  kind. Compute them in `create({ id })`.
- **Labs and pages are HTML on top of the canvas.** `UI.page()` pauses the game and hands over
  the keyboard. Always go through `ui.lab(id, station)`, `ui.reading(id)`, `ui.plaque(...)`.
- **A raw canvas in the stage is stretched to fill it.** Use `canvasPane`, which keeps
  proportions, draws at the screen's resolution and converts pointer positions. For a grid of
  small canvases, wrap them in `<div class="lab-box">`.
- **After every `await` in `mount`, check `ctx.alive()`.** The learner may have moved on.
- **Text.** Draw text in a pane with `pane.font(size)`: never below 16 screen pixels. Keep code lines under about 60 characters in the side panel. Long labels on
  buildings are cut at 9 characters. The pixel font on signs has capitals, digits, `-` and `.`.
- **Headless Chrome is slow** (a few frames per second with software rendering). Waits in the
  tour are long on purpose. A real browser is fast.
- **The darkness layer** is as large as the camera view, not the map. If you add lights, add
  them to `this.lights` in `Town`; they are skipped when off screen.
- **Size.** Everything is inlined in one page. Keep images small (256 to 512 pixels), compress
  data, and stay under about 8 MB.
- **Network.** The game must not load anything at run time: no CDN scripts, no remote fonts or
  images. Import assets so that the build inlines them.

## Adding a room behaviour

Standard houses need no code. A workshop takes its machines from the lab's stations; a museum
takes its plaques from `timeline`. For anything else, prefer a new station pattern inside the lab
over a new scene: the lab frame is where the learner already knows how to behave.

## Phones and screen shapes

| | Rule | Where |
|---|---|---|
| Zoom of the town and the museum | The **short side** of the screen shows about 14 tiles, upright or sideways, phone or monitor; whole-number zoom so pixel art stays sharp. Try other values with `?tiles=N` in the address. | `src/systems/view.js` |
| Rooms and the workshop | The whole room fits the screen, at the largest whole-number zoom. | each scene's `layout()` |
| Interface (dialogues, quiz, prompts) | Sideways: a 960 x 540 stage scaled to fit. Upright: 600 virtual pixels across, as tall as the screen, so text keeps a readable size; boxes span the width and sit at the bottom; the quiz stacks its buttons. | `UI.frame()` in `src/scenes/UI.js` |
| Touch | Tap where you want to go; tap a person, sign, plaque or machine to walk to it and use it; tap a building to go to its door. Buttons replace the key hints (Map, Music, Grass); the gold prompt can be tapped. Turns on by itself on touch screens; `?touch` forces it. | `src/systems/tapnav.js`, `UI.setLocation()` |
| Labs | Below 760 px wide, or upright and below 1000 px: the picture on top, the panel as a bottom sheet (drag or tap its handle), the main button at the bottom within thumb reach. The header stays one line: other stations shrink to their number. | `src/lab/shell.js`, `style.js` |

Lab code must work with a finger: see `skills/game-build/SKILL.md`.

## The lab frame, and why it looks the way it does

The lab is the core learning screen. Its rules, each answering something learners got wrong:

- **The picture is the screen.** The stage takes everything except a one-line header and a
  panel of 380 px (a bottom sheet of at most 46 % on a phone). It is drawn from the first
  moment. A station with a question shows its picture frozen, with "Answer the question first",
  because an empty box was read as broken. Freezing, not dimming: in the colour stations the
  picture itself is what the question is about.
- **One thing to do at a time.** Question with large answer buttons; then "You said X. Now check
  it on the picture."; then the tasks; then the verdict, the takeaway and one button, "Next"
  (or "Back to the room"). Without a verdict learners could not tell whether they were right, so
  `predict.answer` in `course.json` lets the frame say "That is right" or "The answer is ...";
  without it, the frame says "Compare it with what you saw". The verdict waits until the tasks
  are done, so the discovery stays the learner's.
- **Tasks are steps, not checkboxes.** Numbered circles, the current one highlighted, a line
  saying they tick themselves; a done step turns green with a short pop. They are not
  focusable or clickable, because they are not things to click.
- **Panels fold away.** The panel folds to a slim rail (a strip on a phone) that keeps the
  progress dots and, when done, the Next arrow. The theory is a drawer (a sheet on a phone)
  with the reading page and the station's `source` note, so neither is on the main screen.
  The stage has its own full-screen button. Esc closes the drawer, then full screen, then the lab.
- **Navigation in one place.** The header shows the stations as one row: number or tick, and
  the name of the current one; the others shrink to their number when there is no room. No
  room or floor labels. Arrow keys and 1-9 also move between stations.
- **Legible.** Text at least 16 px, contrast above 4.5:1, touch targets at least 44 px, the
  accent colour (teal) only for the primary action and the current position, gold for the
  learner's own answer. Motion is short and switched off with `prefers-reduced-motion`.
- **All words in one place**: `TEXT` at the top of `shell.js`, for a course in another language.

Station code keeps its old contract (`ctx.stage`, `ctx.controls`, `did`, `reveal`); what was
added is optional and listed in `SCHEMA.md`.
