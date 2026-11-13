# The engine: commands, files, pitfalls

## Commands (run in `engine/`)

| | |
|---|---|
| `npm install` | Once. Needs Node 18 or later. |
| `npm run course <slug>` | Points the engine at `courses/<slug>/` (default `chroma`, or `COURSE=`). Run by the commands below. |
| `npm test` | Node tests, a few seconds: hundreds of composed rooms against their rules, every zone and trade, home fronts, the `expert` field of the course format. |
| `npm run check` | Validates the knowledge base, and that every designed station has code. |
| `npm run build` | Check, then build one self-contained page: `dist/index.html`. |
| `npm run shots:phone` | The same tour on a phone held upright (390 x 844, touch mode), into `shots/phone/`. |
| `npm run shots:lab` | The lab frame state by state (question, after it, one task done with the panel open, folded and full screen, done with the panel open and folded, theory, done in full screen), the first state of every station and a mid state of the slider stations, on a desktop window and a phone, into `shots/lab/` (`OUT2=/dir` copies them). It also reports text cut with an ellipsis. The tasks are done with real drags. `STATION=lamps:0` picks the station walked through. |
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
  systems/         state (save), audio (music and sounds), voice (read aloud), walker (movement)
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
| Touch | Tap where you want to go; tap a person, sign, plaque or machine to walk to it and use it; tap a building to go to its door. Buttons replace the key hints (Map, Music, Grass, and Voice when the course has one); the gold prompt can be tapped. Turns on by itself on touch screens; `?touch` forces it. | `src/systems/tapnav.js`, `UI.setLocation()` |
| Labs | Below 760 px wide, or upright and below 1000 px: the picture on top, the station's controls right under it, the panel as a bottom sheet (Hide / Show, or drag it) that folds to a one-line step while exploring, the main button at the bottom within thumb reach. The header shows the stations as numbered circles. | `src/lab/shell.js`, `style.js` |

Lab code must work with a finger: see `skills/game-build/SKILL.md`.

## The lab frame, and why it looks the way it does

The lab is the core learning screen. Its rules, each answering something learners got wrong:

- **The picture is the screen.** The stage takes everything except a one-line header and a
  panel of 380 px (a bottom sheet on a phone). It is drawn from the first moment. A station with
  a question shows its picture frozen: a lock beside the station's name (phone), a not-allowed
  cursor, the station's caption hidden (it may say "Drag them", which is not yet possible), and "Answer the
  question first" in the bar under the picture, never on it. A tap on the frozen picture shakes
  the answers and opens the panel if it was folded. Freezing, not dimming: in the colour
  stations the picture itself is what the question is about.
- **One thing to do at a time.** Question with large answer buttons; then "You said X. Now check
  it on the picture."; then one step at a time; then the verdict, the takeaway and one button,
  "Next" (or "Back to the room"). The answer card follows the phase: after the first step it
  says how many steps are left before the answer; at the end it becomes the verdict in one card,
  with `predict.why` as the reason when the course gives one. The verdict waits until the tasks
  are done, so the discovery stays the learner's. A wrong answer is the expected, useful case:
  the verdict is a neutral card with a plain cross (or a green tick), never an amber warning.
- **A step is an instruction, not a checklist.** Only the current step is shown, large: "Now ·
  1 of 2 — Drag the red lamp onto the green one", with dots for the progress; done steps shrink
  to a thin ticked line above it (hidden on a phone). Tapping the step points at where to act:
  a ring pulses on the picture, or the control the step needs is outlined (the station says
  where with `ctx.hint`); without a hint it says "Do it on the picture" and flashes the stage.
  When a step becomes current the frame points there once by itself, and the control it needs
  stays outlined.
- **The result and the next step never disappear.** A bar along the bottom edge of the picture
  carries one line: the lock notice, the current step ("2/2 Bring all three lamps together"),
  or the result ("✗ Yellow, not Brown"). When the panel is folded (a rail on a wide screen, a
  one-line strip on a phone) or the stage is full screen, the same line carries the action:
  "Show the question" or "Next: One pixel". Full screen keeps "Exit full screen" and Close in
  that bar. One learner can do a whole station without unfolding anything.
- **Short lines where the learner looks.** A hint a station needs only at one moment ("Point at
  the overlap to read the light there") is a `ctx.nudge`: it appears for a few seconds in the
  step card and the bar, once, when it becomes useful. Read-outs that follow the pointer stay
  near the mouse; under a finger they move to the far edge of the picture.
- **Phones.** Controls (`ctx.controls`) sit directly under the picture, thumb-sized, not in the
  sheet. The sheet folds to its one-line step as soon as the question is answered (or at once,
  when the station has controls), and opens by itself for the result: one result card, the
  takeaway, Next. Its head has the station's name, Listen, Full screen and a labelled
  Hide / Show; if the content is longer than the sheet, a labelled "More" bar sits at its
  bottom edge, never a floating button on the text. The header shows the stations as numbered
  circles joined by a line (name on long press, and in the accessible name).
- **Wide screens.** The panel is a card as tall as its content, not a full-height column with an
  empty lower half. (A card floating over the stage's corner was considered: the stations draw
  edge to edge, so it would cover the picture.) The theory opens beside the picture, over the
  panel's column, and does not dim or block the stage.
- **Navigation in one place.** The header: the lab's name as a plain title (hidden on narrow
  screens), then the stations as steps you can jump to (hover and focus states, a label on
  hover, focus or long press, a tick when done). Arrow keys and 1-9 also move between stations.
  Esc closes the theory, then full screen, then the lab.
- **Legible.** Text at least 16 px, contrast above 4.5:1, touch targets at least 44 px, no text
  cut with an ellipsis at 390 px (the lab pictures check for it), the accent colour (teal) only
  for the primary action and the current position, gold for the learner's own answer. Motion is
  short and switched off with `prefers-reduced-motion`.
- **Listen** (when the course has a voice) reads what the panel shows now: the question and its
  answers, the step to do, or the verdict, the reason and the takeaway. L does the same.
- **Words.** All words of the frame are in `TEXT` in `shell.js`, in English and Italian, chosen
  by `language` in `course.json` (English for anything else). Another language is one more entry
  in `STRINGS` with the same keys.

Round two (this version) answered two simulated first-time users on the first redesign: the
verdict and Next vanished when the panel was folded; the answer card went stale; the step list
read as a checklist to tick; the lock pill covered the yellow ink; captions said "Drag" while
the picture was frozen; on the phone a floating chevron covered text, titles and captions were
cut, and dense stations put their controls below the fold.

Station code keeps its old contract (`ctx.stage`, `ctx.controls`, `did`, `reveal`); what was
added is optional and listed in `SCHEMA.md`, with a note on upgrading an old station.

## Voice

Optional read-aloud with the browser's own speech synthesis (Web Speech API). No audio files, no
network, nothing added to the page size. Everything is in `src/systems/voice.js`.

- **What it reads**, only when the learner presses Listen (or L): the reading wall (the page in
  order, without the hidden answer of "explain it yourself" and without links); the lab station
  (goal, the prediction question and its options while it is open, "try this", the takeaway once
  shown); museum plaques; the lines of people and signs in dialogue boxes. Quiz questions are not
  read. Pressing again stops. Speech stops on leaving a page, changing station or plaque, closing
  a dialogue, hiding the tab, and with V (all sound off).
- **Enable** in `courses/<slug>/world.json`: `"voice": true`, or an object
  `{ "auto": false, "rate": 1, "say": { "RGB": "R G B" } }`. `auto` reads each page, station,
  plaque and line as it opens (off by default). `?voice` in the address turns it on for testing.
  Without it nothing changes on screen.
- **The learner** switches it on and off with L or the Voice button (touch); the choice is saved
  like the music setting. Off hides the Listen buttons.
- **Language and voice**: `language` of `course.json`. The best installed voice for it is chosen
  (same language, then same region, local before network voices).
- **Text**: markup is stripped and a few symbols are said as words (`%`, `→`, `=`, `≈`, `×`, and
  a dash between numbers) in English, Italian, Spanish, French and German; other languages get a
  pause for `→` and leave the rest to the voice. `say` replaces whole words or symbols before
  that, so it can also fix a symbol.
- **Limits**: voice quality depends on the device and the voices installed; a language with no
  installed voice may be read by a voice of another language. Inside some embedded viewers or
  sandboxed frames speech is missing or silent: after two attempts that never start, the controls
  hide themselves. Headless Chrome cannot be heard, so checks record the calls to
  `speechSynthesis` instead (`__hb.voice.debug()` in the console shows the state).
