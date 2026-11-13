# The engine: commands, files, pitfalls

## Commands (run in `engine/`)

| | |
|---|---|
| `npm install` | Once. Needs Node 18 or later. |
| `npm run course <slug>` | Points the engine at `courses/<slug>/` (default `chroma`, or `COURSE=`). Run by the commands below. |
| `npm test` | Node tests, about half a minute: hundreds of composed rooms against their rules, every zone and trade, home fronts, the `expert` field of the course format, and the ambient-life layer over 240 synthetic towns. |
| `npm run check` | Validates the knowledge base, and that every designed station has code. |
| `npm run build` | Check, then build one self-contained page: `dist/index.html`. |
| `npm run shots:phone` | The same tour on a phone held upright (390 x 844, touch mode), into `shots/phone/`. |
| `npm run shots:lab` | The lab frame state by state (question, after it, one task done with the panel open, folded and full screen, done with the panel open and folded, theory, done in full screen), the first state of every station and a mid state of the slider stations, on a desktop window and a phone, into `shots/lab/` (`OUT2=/dir` copies them). It also reports text cut with an ellipsis. The tasks are done with real drags. `STATION=lamps:0` picks the station walked through. |
| `npm run shots` | Opens the build in headless Chrome and saves a picture of the town, of a real walk into a house and back, of every room, station and page, to `shots/`; then the duels (`scripts/duelshots.mjs`: a house duel at the start, after a hit, after a miss, won, a friendly rematch, lost; the League mid-way, lost and won) into `shots/duel/`, copied to `/tmp/duel-*.png`. Needs Chrome or Chromium (`CHROME=/path` if it is not found). |
| `npm run shots:life` | Pictures of the ambient-life layer (thoughts outdoors and indoors, a double click, an animal, a secret, an obstacle tried and opened, a locked door, a painting, the discoveries), desktop then phone, into `shots/life*/` (`OUT2=/dir` copies them). Also run at the end of `shots`. |
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
  mechanics/       optional ambient life: thoughts, animals, secrets, obstacles (see "Ambient life");
                   duel/: the duel of eloquence (see "Duels")
  data/content.js  read-only views of the course for the scenes
```

Course work happens in `courses/<slug>/`, not here. See `WORLD.md` for what a custom look touches.

## How things connect

- A house's `id` is the key everywhere: `LABS[id]`, `PAGES[id]`, the saved progress.
- `state.visited[id]` is set when the learner opens a lab or a museum. Review questions come
  only from visited houses.
- `state.done['id:k']` is set when station `k` shows its takeaway. The map shows `lab 2/3`.
- `state.stamps[id]` (badge) and `state.keys[id]` (key to the upper floor) are set when the duel
  with the host of that house is won; `state.passedLeague` when the League's duel is won (see
  "Duels"). `state.insight` holds the points (certainty-based: sure and right earns more, sure and
  wrong costs, except in duels, where a wrong answer costs composure and no points). Points are
  stored for a later version; nothing spends them yet.

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

## Ambient life

An optional layer of atmosphere in `src/mechanics/` (the place for game dynamics: they are a
property of the game, not of the course). It costs nothing per course and is on by default. Four
parts: **musings** (the player thinks aloud), **animals**, **secrets** (rare, optional discoveries,
one small mystery), **obstacles** (things that bar an optional side place and will open one day).

### The interaction grammar

Each kind of thing has its own gesture and its own look, so the learning flow never gets muddled:

| What | Gesture | What the learner sees |
|---|---|---|
| Things that matter for learning: people, doors, signs, landmarks, the lab door, the reading wall; and obstacles (key objects) | single tap or click, Space | the dialogue box at the bottom, a page, or for an obstacle a short thought ("Locked. I'd need a key.") and a padlock with the tool that will open it |
| Atmosphere: anything else | double tap or double click on a thing within 3 tiles, or T for what the player faces (across empty ground, the first thing up to 3 tiles ahead) | a thought bubble above the head: a pale cloud with small circles, no name, no arrow, gone by itself in 2 to 4 s, never stacked, clear of the HUD, no sound but a soft tick, not read aloud |
| Animals and happenings | coming close | no interface at all: the cat runs and hides, birds take off, the apple falls |
| Secrets | exploring: walking somewhere, thinking about something, standing still | the thought bubble, then a small toast "Discovery 3 of 9"; the discoveries page (J, or the button on the map) |

Rules: the normal interaction always wins (T on a person only says "Maybe I should just say
hello."; a double tap on a house, a door, a sign, a person or an obstacle is an ordinary tap).
Nothing of this layer opens or reacts while a lab, a reading page, a dialogue, a quiz or the map is
open (`ui.busy`); it adds two keys, T and J, used nowhere else.

**The touch gesture: double tap, with the walk cancelled.** A single tap acts at once, as before
(no waiting to see whether a second tap comes, so single taps never feel late). If a second tap
lands on the same spot within 380 ms, on a thing within 3 tiles that has no function and cannot be
walked on, the walk the first tap started stops (at most a step or two toward the thing, which reads
as "going to look") and the player turns to it and thinks. A double tap on ground one can walk on
(grass, lanes, floor, rugs) is never taken: people double-tap where they want to go when impatient.
Long press was considered and left out: it cannot be discovered, it fights the browser's own long
press (selection, callouts), and the owner asked for a double tap. On a computer, a double click
does the same, and T is there for the keyboard. The title screen names the gesture.

### Switches

`courses/<slug>/world.json`:

```
"life": false                                                              everything off: the game is exactly as without it
"life": { "musings": true, "animals": true, "secrets": true, "obstacles": true }    parts on or off (all on by default)
"life": { "secrets": [ { "kind": "note", "text": "...", "near": "<conceptId>" } ] } curated: a note or two themed on the course,
                                                                           found near that concept's house
```

`?nolife` in the address switches the layer off; `?tools=key,pickaxe` grants tools for testing the
opening of obstacles (also `__hb.give('key')` in the console). `__hb.life()` shows the plan of the
town, `__hb.lifeSheet()` a contact sheet of the layer's pictures, `npm run shots:life` its pictures
(also run at the end of `npm run shots` and `shots:phone`, copied to `/tmp/life-*.png`).

### Files

```
src/mechanics/
  config.js          switches, language (English or Italian, by the course), the layer's own words
  context.js         what the planners know of a town (solid tiles, distances, door approaches, lanes)
  plan.js            planLife() and checkLife(): obstacles, secrets and animal spots as plain data   (Node)
  active.js          the plan of the active course, cached
  life.js            the scene side shared by town and rooms: saved state, thinking, finding
  town.js, room.js   the scene side of the town and of a room
  bubble.js          the thought bubble
  textures.js, sheet.js   pictures, registered once; a contact sheet
  musings/   lines.js (the registry of lines by kind of thing, nudges), think.js (cycling, nudge: pure),
             things.js (what kind of thing is at a tile, from data the town and rooms already have)
  animals/   cast.js (who, when, where, how they react), place.js (spots, pure), art.js, live.js
  secrets/   registry.js (kinds, texts, the rhyme), place.js (pure), art.js, paintings.js, journal.js
  obstacles/ kinds.js (registry, canPass), place.js (pure), art.js
```

Everything placed is deterministic (`seeded('life:...')`); behaviour (when a bird takes off, which
line comes next) uses `Math.random` and is cosmetic. Per frame the layer does nothing in proportion
to the map: the animals are about a dozen sprites, looked at every 200 ms and only near the camera;
secrets are checked when the player arrives on a tile.

### What there is

- **Musings**: 89 kinds of thing outdoors, indoors and animals, 3 to 6 lines each (319 in each
  language). About one musing in four or five is a **nudge** built from the game state by one pure
  function (`nudgeTarget`, tested): the first house of the path not yet visited (the same one the
  map marks "next"), with its landmark or "right around here"; inside that very house, its lab; then
  the final check; then a done line. Nudges never name a visited place. Sometimes a nudge hints at an
  undiscovered secret nearby ("Did something just move over there?").
- **Animals**: a cat (two in the citadel theme) that runs to cover and comes back elsewhere later;
  sparrows on the plazas by day; an owl in a tree at night that turns its head to follow you; a frog
  by the water that jumps in with rings; a squirrel in the trees by day; a dog asleep beside a home
  that lifts its head and wags; rings of fish in the water. Harbour adds a seagull and a crab, nordic
  a hare (day) and a fox (night), citadel a crow. Indoors, a cat asleep on an armchair in one home.
  Dusk counts as day and night. Fireflies are the town's own and unchanged.
- **Secrets** (about 6 to 10 per town, plus what waits behind obstacles): an apple that falls when
  you walk under its tree; a hollow tree with a brass button (found by thinking about it); a loose
  stone with an old coin at the edge of a plaza; a bottle with a message in the water; a shooting
  star for whoever stands still by a bench at night; a well that echoes (where the dressing has a
  well); one or two paintings in rooms that open in large (five original paintings drawn in code:
  a landscape, a cat's portrait, a still life, an old map of this very town with a cross on an
  undiscovered secret, a night sky with a cat constellation); notes from `world.json`.
- **The mystery: the lantern cat.** At night a small light is glimpsed at the edge of the view, a
  dark cat carrying a lantern, walking toward the nearest trail it left. Four to six trails of
  glowing paw prints lie near the landmarks, benches and signs, each a step or two off a lane; each
  one found gives the next line of a rhyme whose last line sends you back to the square. There the
  cat waits, can be petted (T or a double tap), and its portrait joins the discoveries. Complete
  today, with no obstacle in its way.
- **Obstacles** (2 to 4 in town, 1 or 2 in rooms): a boulder (pickaxe), a fallen trunk (saw) or a
  bramble thicket (shears) at the mouth of a dead-end nook the town already has; a locked gate
  (key) in a small hedged garden added for it; a cellar hatch with a padlock (key) beside a house;
  a small locked door (key) on a room's back wall where nothing else hangs. Behind each, something
  to look forward to and in view where possible (a chest, a glint, a strange plant), listed as
  "sealed" in the discoveries until opened. No tool can be had yet: `canPass(obstacle, state)`
  reads `state.tools`, empty today. **Hard rule**, checked by `npm run check`, the stress test and
  the tests: with every obstacle closed, every lane, plaza, door step and the tiles beside people,
  signs and landmarks keep exactly their walking distance, nothing reachable becomes unreachable
  except the nook behind, every obstacle can be walked up to, and opened, what is behind is
  reachable. Obstacles stand on no door approach and no required tile.

### How to add

- **A line**: append it to both languages of its kind in `musings/lines.js`. Short, light, dry,
  generic for any subject, never about the interface. `npm test` checks both languages are there.
- **A kind of thing**: an entry in `lines.js` (with its noun `n`), and the tile, piece or furniture
  type that produces it in `musings/things.js`.
- **An animal**: an entry in `animals/cast.js` (when, perch, react, radius), its frames in
  `animals/art.js` (four 16 x 16 frames: two idle, two moving), its lines in `lines.js`; add it to
  `BASE` or to a theme in `BY_THEME`. A new kind of perch is one predicate in `animals/place.js`.
- **A secret**: an entry in `secrets/registry.js` (title, found, how, glyph), its placement in
  `secrets/place.js` (a trigger tile the player can stand on, at most 4 steps from a lane), its
  trigger in `town.js` (`step` for walking, `think` for thinking). `checkLife` and the tests check
  reachability over hundreds of towns.
- **An obstacle**: an entry in `obstacles/kinds.js` (needs, where, name, say, opened, lines), its
  closed and open look in `obstacles/art.js`; a new kind of place for it in `obstacles/place.js`,
  where every candidate must pass `keepsDistances`.

## Duels

The house quiz and the League are a **duel of eloquence**: a skin over the course's questions
(`docs/DESIGN.md` is the specification; the reasons are in the wiki). Everything is in
`src/mechanics/duel/`:

```
rules.js    the rules as pure functions (Node): bars, a turn, the end, which questions, feedback,
            and the simulation used to tune the numbers
tempers.js  the registry of tempers (no imports: the course validator reads the names)
lines.js    stock phrases of debating and every word of the screen, English and Italian
prize.js    what winning gives, on the state object: badge, key, League (each once)
screen.js   the duel screen (HTML over the game, opened with ui.page), style.js its look
index.js    houseDuel(ui, id) (Interior.quizSeries) and leagueDuel(ui) (UI.league)
```

### Rules

| | House duel | League |
|---|---|---|
| Questions | the concept's own; levels 1 and 2 first, level 3 only to fill; a friendly rematch (house already won) puts levels 2 and 3 first | `finalCheck.size` of levels 2 and 3, one from each house per round, shuffled |
| Turns | at most `min(6, questions of the concept)` | `finalCheck.size` |
| Opponent's conviction | 7 | `2 × ceil(size × pass)` (12 for 8 at 0.7) |
| Player's composure | 5 | `2 × (size − need) + 1` (5 for 8 at 0.7) |

Each turn the player picks a **tone** (the confidence bet), preselected at *State* every turn, and
taps an answer: one tap commits both. Right: the opponent loses 1, 2 or 3 (murmur, state,
proclaim). Wrong: the player loses 1, 2 or 4 composure. A bar at zero ends the duel. When the
turns (or the questions) run out, the fuller bar, as a share of its start, wins; on an exact tie
the player wins only with at least the pass share right (2/3 in a house, `pass` in the League).

With every answer *stated*, a house duel is "three right before three wrong", and the League is
exactly the old pass mark: `ceil(size × pass)` right wins, one slip more loses (tested for sizes
8 to 12). Proclaiming wins sooner and risks more; murmuring is safe and slow, and over a short
duel the slow side tends to run out of turns.

**Coins in a duel**: a right answer earns the usual certainty-based reward (`scoreAnswer`, which
also keeps the question history and the bet statistics); a wrong answer takes no coins, whatever
the tone. Its cost is composure: charging twice for the same mistake would contradict "mistakes
cost nothing but a turn". **Losing** takes nothing; Rematch draws other questions at once
(`pickQuestion` prefers unseen, then missed ones). **Step back** (Esc) leaves at any time; only
coins already earned stay.

**Why the tone comes before the answer, preselected**: one tap per turn in the common case, and
the stake is visible before committing: the striped part of each bar is what the chosen tone puts
at risk (theirs if right, yours if wrong). Answer first, then tone (the old quiz) costs two taps
every turn and shows the stake only once the answer is chosen. Resetting to *State* every turn keeps a bold tone a decision about
this question, not a leftover.

### Simulated win rates

Simulated learners are right on a question with probability `p_q`, drawn around their mean `p`
(Beta, concentration 6: some questions known well, some not). *state* always states; *calibrated*
feels `p_q` and proclaims above 0.75, murmurs below 0.45; *reckless* always proclaims.
`npm test` prints this table (4000 duels per cell):

| Duel | p=.4 state | p=.4 calibrated | p=.6 state | p=.6 calibrated | p=.6 reckless | p=.7 state | p=.7 calibrated | p=.9 state |
|---|---|---|---|---|---|---|---|---|
| house, 4 questions | 17% | 33% | 47% | 58% | 46% | 65% | 73% | 95% |
| house, 5 questions | 31% | 28% | 67% | 61% | 46% | 84% | 76% | 99% |
| house, 6 questions | 18% | 28% | 54% | 61% | 46% | 75% | 76% | 98% |

League (8 turns, pass 0.7): at p = pass about a coin flip (state 56%, calibrated 57%, reckless
54%); at p = pass + 0.15, 90% (state) and 83% (calibrated); at p = pass − 0.15, 23%. No duel ever
lasted more than its turns (6 in a house, 8 in this League).

Reading it: with six questions the targets hold (p = 0.7 wins about 75%, p = 0.4 loses over 80%
when stating). Fewer questions discriminate less, and no rule can fix that: with four questions
a learner at 0.7 who always states wins 65% (73% calibrated); with five, a learner at 0.4 still
wins about 30%. A calibrated learner at 0.4 wins more often than one who always states because
they proclaim what they do know well: that is the bet doing its job. Recklessness never pays: at
0.6 the reckless player wins 46%, the calibrated one about 60%. Concepts with five or six
questions make the fairest duels (`skills/knowledge-base/references/6-questions.md`).

### Feedback

After a wrong answer the rebuttal shows the chosen option and the right one, side by side, then
"Why <chosen> tempts:" with the option's `trap`, then the right answer with the question's `why`.
Without a trap: the right answer and `why` only. After a right answer: `why`, never just
"correct". In the League the house of the question is named only after answering (recognising
which idea a question needs is part of the League). A lost duel ends with what to look at again:
the concept, the reading wall here and the lab (house duel, with a Read the wall button), or the
houses of the missed questions by number and name (League); then Rematch and Not now.

### Tempers and lines

A house owner's temper comes from `expert.temper` in `course.json` when it names one (the
validator warns about unknown names), otherwise from `seeded('<id>:temper')`. Tempers:
smitten, sore (sore loser), admirer, letwin (insists they let you win), theatrical, absent
(absent-minded), craftsman (proud craftsman). The League's champion has its own, grander temper
(`CHAMPION`), and steps aside when beaten: the duel sets `state.passedLeague` and returns.

- **A temper**: one more entry in `TEMPERS` with `open`, `hit` (2+), `score` (2+), `lose` (hands
  over the key), `again` (a friendly rematch lost), `win` (in character; the screen adds what to
  review), in `en` and `it`. Add its name to the description of `expert.temper` in
  `course.schema.json`. `npm test` checks both languages, lengths, and that `lose` mentions the key.
- **A stock phrase**: append it to both languages in `STOCK` (`lines.js`). Short; about debating,
  never about the learner. Lines cycle without immediate repeats (`Deck`).
- **Another language**: one more key in `TEMPERS[*]`, `CHAMPION`, `STOCK`, `WORDS`, `CHALLENGE`.

### The screen

Readable first: the question is the largest text (20 to 22 px), answers are 52 px buttons 8 px
apart, the tone is three buttons with what each lands and risks, the turn counter sits between
the fighters, Step back is always in the header. The two characters are the game's own painters
(side frame, scaled up, crisp); the opponent is the host or expert with their look, the League's
the champion. Bars shake and drop when hit; with `prefers-reduced-motion` nothing moves. Sounds
are the soft existing ones (`confirm`, `bump`, `reveal`) and follow the sound switches; questions
are not read aloud.

Keys: 1 to 4 answer; arrows up and down move between answers and Enter answers; Q, W, E (or
arrows left and right) pick the tone; Enter or Space for Next; Esc steps back.
