# The engine: commands, files, pitfalls

## Commands (run in `engine/`)

| | |
|---|---|
| `npm install` | Once. Needs Node 18 or later. |
| `npm run course <slug>` | Points the engine at `courses/<slug>/` (default `chroma`, or `COURSE=`). Run by the commands below. |
| `npm test` | Node tests, about half a minute: hundreds of composed rooms against their rules, every zone and trade, home fronts, the `expert` and `core` fields of the course format, the main path over whole simulated games, and the ambient-life layer over 240 synthetic towns. |
| `npm run check` | Validates the knowledge base, and that every designed station has code. |
| `npm run build` | Check, then build one self-contained page: `dist/index.html`. |
| `npm run shots:phone` | The same tour on a phone held upright (390 x 844, touch mode), into `shots/phone/`. |
| `npm run shots:lab` | The lab frame state by state (question, after it, one task done with the panel open, folded and full screen, done with the panel open and folded, theory, done in full screen), the first state of every station and a mid state of the slider stations, on a desktop window and a phone, into `shots/lab/` (`OUT2=/dir` copies them). It also reports text cut with an ellipsis. The tasks are done with real drags. `STATION=lamps:0` picks the station walked through. |
| `npm run build:player` | The prebuilt player: the engine without a course, `dist/player.html` (about 2.2 MB, a little smaller than a course build). Courses are put into it later without a build (below, "The prebuilt player"). |
| `npm run build:play` | The `/play/` page, `dist/play/index.html` (about 80 KB): course files in, a game out, in the browser. It fetches `player.html` from its own folder. |
| `npm run shots:ready` | Every station of the pocket demo and of the pattern gallery (`tests/fixtures/patterns/`), before the prediction, after one task and done, desktop and phone, into `shots/ready/`, copied to `/tmp/ready-*.png`. Tasks are done with real pointer events by reading each task's `when`. `COURSES=<slug>,...` picks the courses. |
| `node scripts/packcheck.mjs <bundled.html> <packed.html> <course>` | Opens both games and compares what they expose: places, questions, League, and for every station its code, controls and a fingerprint of its first picture. |
| `node scripts/playcheck.mjs [course folder]` | The `/play/` page end to end over http: files in, no problem reported, the game starts in the page; a broken course and a foreign import are refused in plain words. |
| `npm run shots` | Opens the build in headless Chrome and saves a picture of the town, of a real walk into a house and back, of every room, station and page, to `shots/`; then the duels (`scripts/duelshots.mjs`: a house duel at the start, after a hit, after a miss, won, a friendly rematch, lost; the League mid-way, lost and won) into `shots/duel/`, copied to `/tmp/duel-*.png`. Needs Chrome or Chromium (`CHROME=/path` if it is not found). |
| `npm run shots` (end) | Also runs `scripts/spineshots.mjs`: the main path in pictures (the guide's first speech, the tracker at the start, the mark over the next house, the three tabs of the menu in mid-game, a room's tracker, the League refused, the champion stepping aside, the ending card, free roaming), into `shots/spine*/`, copied to `/tmp/spine-*.png` (`OUT2=/dir` to change). |
| `npm run shots:story` | The story in pictures (see "The story"): the arrival played for real, then every moment up to the ending card, desktop and phone, into `/tmp/story-*.png` and `/tmp/story-phone-*.png`. |
| `npm run shots:life` | Pictures of the ambient-life layer (thoughts outdoors and indoors, a double click, an animal, a secret, an obstacle tried and opened, a locked door, a painting, the discoveries), desktop then phone, into `shots/life*/` (`OUT2=/dir` copies them). Also run at the end of `shots`. |
| `npm run shots:locks` | Pictures of locks and upper floors: a room with stairs, the stairs refused without the key, the upper floor, each close-up before typing, misses with the thought, each lock opened, the discoveries page, the advanced station, the way back down; desktop then phone (with the phone keyboard open), into `shots/locks*/`, copied to `/tmp/locks-*.png`. |
| `npm run play` | A real play-through (`scripts/playthrough.mjs`): a bot plays the built game from the title to the ending through the real screens, as a player would (taps or clicks on tiles and buttons, keys, drags on the lab pictures, typing into locks; it knows the right answers from the course). It checks the tracker at every step against its own plan, loses one duel on purpose and takes the rematch, opens the menu at the start, in mid-game and at the end, answers one tall-grass question, visits an extra house, types one wrong answer into every lock first, walks through the town gate. Pictures `/tmp/play-*.png`, log `/tmp/play-log.txt` (`OUT=` to change). It only reads the state (`__hb`, the scenes), except that every run starts from a fresh save. Exit code 1 on any problem. About 8 minutes of headless Chrome for the example course. |
| `npm run play:phone` | The same on a phone held upright (390 x 844, taps): `/tmp/play-phone-*`. About 10 minutes. |
| `npm run play:ci` | The same story, with the player carried in front of each door instead of walking the town (the one place where the bot writes state). `Q='&nolife'` adds to the address (also try `world.json` `"gen": false` or `"voice": false`). |
| `npm run shots:it` | The Italian test course (`engine/tests/fixtures/prova`: three simple machines, a lab, a workshop, an expert's home with a temper and a safe; never published) played through on a desktop window and a phone: `/tmp/it-*.png`, `/tmp/it-phone-*.png`. Then the engine points back at the course it used. `COURSE=prova npm run build` builds that course alone. |
| `npm run sound` | Renders the music offline in headless Chrome and measures it (levels, brightness, density, silences, ducking); writes `/tmp/music-*.wav` and `.png`. A few minutes. See "Sound". |
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
                   code.js (code panel), reading.js (reading wall), map.js (the mind map), museum.js (plaques)
  art/             everything drawn in code: ground, buildings, sprites, palette
  systems/         state (save), audio.js + sound/ (ambient music, place sounds, effects: see "Sound"),
                   voice (read aloud), walker (movement)
  mechanics/       game dynamics: the main path (quest/: tracker, menu, ending), duel/ (the duel of
                   eloquence, see "Duels"), riddles/ and floors/ (locks and upper floors, see "Locks",
                   "Upper floors") and the optional ambient life: thoughts, animals, secrets,
                   obstacles (see the sections below)
  data/content.js  read-only views of the course for the scenes
```

Course work happens in `courses/<slug>/`, not here. See `WORLD.md` for what a custom look touches.

## How things connect

- A house's `id` is the key everywhere: `LABS[id]`, `PAGES[id]`, the saved progress.
- `state.visited[id]` is set when the learner opens a lab or a museum. Review questions come
  only from visited houses.
- `state.done['id:k']` is set when station `k` shows its takeaway. The Journey shows `lab 2/3`. `k`
  counts the ground-floor stations only (`LABS[id].stations`); advanced stations are saved as
  `state.done['id+up:<stationId>']` (`UPPER_LABS`, see "Upper floors").
- `state.stamps[id]` (badge) and `state.keys[id]` (key to the upper floor) are set when the duel
  with the host of that house is won; `state.passedLeague` when the League's duel is won (see
  "Duels"); `state.ended` once the ending card was seen, `state.seen[id]` for houses walked near
  (the town map), `state.played` for seconds played. `state.insight` holds the points, shown as
  coins (10 per level of the question for a right answer, nothing lost for a wrong one; no
  confidence bet); nothing spends them yet. `state.story` holds the story's own progress (see "The
  story").
- Every hint of what to do next comes from one pure function, `nextStep` (next section).

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
- **Lag smoothing of tweens.** Phaser advances tweens by only 33 ms per frame when a frame takes
  more than 500 ms. Below two frames a second the player's steps crawled (seconds per tile) and the
  phone play-through looked frozen. `Walker` switches lag smoothing off in its scene, and a watchdog
  snaps a step that has not finished after three seconds (it logs `walker: ...`).
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

## Words

Every word a player reads is in English and Italian, chosen by `language` in `course.json`
(English for anything else, `mechanics/config.js`). The older interface (title screen, HUD and
toasts, prompts, dialogue options, the tall-grass quiz, the badge card, the reading wall, the mind
map, the museum's plaques, the code panel, the guide's default lines, signs) reads
`src/data/words.js` through `w('ui.musicOff')`, `w('town.talkTo', { name })`; the newer modules keep
their own tables (`quest/strings.js`, `duel/lines.js`, `riddles/kinds.js`, `floors/room.js`,
`lab/shell.js`, `mechanics/config.js`, the musings). A prompt is written `Space  <what>`; the HUD
turns it into `Spazio  <what>` or, on touch, `Tocca qui: <what>`. `tests/words.test.mjs` walks every
table: each entry has both languages, the same `{placeholders}`, the same keys. A string written
straight into a scene escapes that test: `npm run shots:it` is where it shows.

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

## The main path: quest, tracker, menu, ending

The game's main story (`docs/DESIGN.md`): every **core** house in path order (enter, do its lab,
beat its expert in a duel), then the League, then the ending; afterwards the town stays open.
Everything that tells the player what comes next reads **one** pure function, so the tracker, the
mark over a house, people, thoughts, the Journey and the mind map's "next" tag can never disagree.

```
src/mechanics/quest/
  model.js     questOf({ places, guide, champion }) -> core, extra, progress(state), leagueOpen(state),
               missing(state), nextStep(state, { inside }), stepKey: pure, tested on synthetic games
  active.js    Q: the same for the active course
  strings.js   every word of the main path, English and Italian (tracker, people, gate, ending, menu)
  menu.js      the menu (Tab / Menu button): Journey, Map, Mysteries; settings and keys in the footer
  townmap.js   the Map tab's drawn town; markSeen() (houses walked near), knownAs()
  ending.js    the ending card and its numbers
```

- **Core**: a concept is core unless `course.json` says `"core": false`. Only core houses appear
  in the Journey, gate the League and are named by the tracker. Extras show as "?" on the map once
  seen and in the mind map until visited.
- **Done**: a house with a duel is done with its badge (`state.stamps`). `hasDuel(p)`: the house
  has at least two questions; every room's host offers the challenge then (Interior, Workshop and
  Museum all call `houseDuel` from `mechanics/duel/`). A house without a duel is done when visited
  with every lab station finished. A badge always counts. `tests/quest.test.mjs` checks that the
  League is always reachable.
- **Steps**: `intro` (the guide's first speech, `seenIntro`), then per core house `visit` ->
  `lab` (n/m; `here` when the player stands in it: "Do the lab") -> `duel` (`person`: the host);
  then `league` (`Q.leagueOpen`), `ending` (League won, card not seen), `free` (after
  `state.ended`). `stepKey(step)` changes exactly when the tracker's line should.
- **Pitfall paid for**: the key that closes a box (the badge card) must not act again in the scene
  underneath. On a slow machine the scene's next update can come after the 180 ms cooldown, and its
  `JustDown(SPACE)` was still true: the host's dialogue reopened by itself. `UI.close()` now
  consumes Space, Enter and E in every active scene.
- **Tracker** (`UI.refreshQuest`, `layoutRight`): top right, under the place name; one line in a
  pill, cut to stay on one line; recomputed every 400 ms from the state (so it follows labs, duels
  and the League whoever changed them), lights up when the step changes, and emits `quest` on
  `game.events`. A tap or click on it opens the Map tab. `Tab  Menu` under it on a keyboard, a Menu
  button on touch: the key hints of old live in the menu's footer.
- **Mark**: `Town.pointAt` puts a small gold chevron, bobbing, above the door of the house the step
  names (or the League hall). It is a world sprite: off screen means not seen. No arrows anywhere.
- **People**: the guide's first speech is `DIALOG.intro` (`introLines`: the goal in three lines,
  then the first house and its landmark). Every townsperson answers "What should I do now?" from
  `nextStep`, and about one time in three adds a hint that the town holds more (`Q_WORDS.hints`,
  never a name). After the ending each congratulates once (`state.cheered`).
- **Thoughts**: the nudge of `musings/think.js` is built from the step (`nudgeLine`); after the
  ending it turns to curiosity (`NUDGES.free`).
- **League and gate**: the champion (`LEAGUE.host`) stands before the town gate at the end of the
  road out of town ("The road out of town" below), or before the League hall's second door in a town
  without a gate. Talking to the champion or walking into the gate: while the League is closed, one
  line naming what is missing (`gateLine`); open, the League duel (`ui.league()`); won, `Town.ending()`:
  the champion steps aside with one line in character and the gate opens; walking through it sets
  `state.ended` and opens the ending card (`ui.ending()`), which the Journey tab can reopen. Without
  a gate the card opens at once. `world.json` `"next": { "title", "url" }` adds "On to <title>" to
  the card and to the gate afterwards. The card lists the goals the path taught (`goalsShown`).

**Adding a step kind**: return it from `nextStep` in `model.js` (with what it needs: `place`,
`person`, `n`, `m`), give it a tracker line and a "what should I do" answer in `strings.js` (both
languages; `npm test` checks), a nudge in `musings/lines.js` (`NUDGES`, mapped in
`think.js:nudgeKind`), and if it names a building, `Town.pointAt` finds it by id. Then walk it in
`tests/quest.test.mjs` (`act` says how a simulated player completes it).

## The road out of town

`world/townMap.js` lays, after everything else, a straight lane two tiles wide from one side of
the square to the edge of the map (south first, then east, west, north; at most 32 tiles; only
over grass, flowers, lanes and plazas, never through the meadow, water, a house, or beside a
landmark, a person or a house's signpost), and returns `GATE = { tiles, stand, aside, posts, dir,
across, edge }`: the two gate tiles two tiles before the edge, where the champion stands and where
they step aside, the two stone posts (props `gatepost`). The road is a dead end: the generator
builds the same town without it and drops the road if any door's walking distance changes
(trees keep a tile off lanes, so a road through a grove could open a shortcut). The stress test
checks it again with the dressing of every theme and reports how many towns have a gate (about
four in five).

`scenes/Town.js`: the gate is drawn by `world/gateArt.js` (shut, open; front view when the road
leaves north or south, side view east or west); walking into it or pressing Space before it is
`useGate()`: before the League, the champion's business (`league()`); after the win (the champion
steps aside, the gate swings open, the tracker says the road is open, the mark floats over the
gate) the ending card; afterwards "the next town is not built yet", or the `next` link. The League
hall's door carries a note that sends the player to the gate. A town without a gate plays the
ending at the League hall as before.

## The story

The fiction of `docs/STORY.md`, on by default: `"story": false` in `world.json` gives the plain
town (the guide, the League hall, the champion at the gate), `?story=0` in the address does the same
for a test, `STORY=0` in the environment for scripts in Node. Everything is in
`src/mechanics/story/`; the rest of the engine has small hooks (marked "the story" in the code).

```
src/mechanics/story/
  config.js    STORY (on, ship, word), now() for the fog (?days=N), ?arrived (skip the arrival)
  logic.js     pure: stage and rain from progress, the order of the mementos, the pages, the word
               at the lighthouse door, the fog's schedule, the notebook's log (notesOf), which
               ending plays (endingOf) (tests/story.test.mjs)
  words.js     every word of the story, English and Italian: S_WORDS (captions, people, mementos,
               notebook (nb), lighthouse, lamp, register, loop, fog), Q_STORY (laid over the main path's words),
               REMEMBER (the duel's screen), R_TEMPERS and KEEPER (the owners' lines)
  cinema.js    the cinematic moments: bars, caption, camera, skip
  paint.js     the illustrated register's toolkit: gradients, glow, soft blur, grain, vignette, rain,
               a handwriting stack, paper; view() runs a painter full screen (DPR-aware, slow push-in)
  scenes/      the painters: ship.js (the steamship), harbour.js (the quay, the ship, the headland),
               objects.js (each memento and the notebook on a table), ending.js (the lamp room, the
               register, the pages on the quay, the gangway), index.js (by name)
  opening.js   the arrival: the harbour painted, the purser's register, the title
  finale.js    the lamp and the register (playLamp), the loop (playEnding, ENDINGS by endingOf)
  art.js       the pixel register: the steamship and the lighthouse in town, rain tiles, the notebook on the quay
  town.js      the story in the town: the ship at the quay, the notebook, the harbour master, rain,
               windows, people by stage, the lamp; begin() and returned(id) play the outdoor moments
  stages.js    how much the town remembers; greetings and curt answers by stage
  weather.js   the rain overlay and its place sound
  remember.js  the moment of finding a memento (its illustrated close-up, the page restored)
  mementos.js  the older pixel close-ups of the mementos (kept, unused by the story's moments)
  notebook.js  the menu as the notebook: Journey, Map, Clues on paper, in hand (openNotebook)
  lighthouse.js the door (the word), the climb, the keeper
  room.js      in a house: the memento upstairs, the owner when the fog returns, keys of old saves
  fog.js       the returning fog, kept in the save
  debug.js     __hb.story: jump between moments (the pictures of npm run shots:story)
```

**The harbour.** The road out of town that the generator lays for the gate (`world/townMap.js`)
ends, in the story, at a harbour inlet at the edge of the map (`HARBOUR`): a cobbled quay two tiles
deep, a pier of planks, water to the edge with a strip of sand, and the steamship moored at the
pier's end (11 x 7 tiles, its waterline on the water). The map grows by 15 tiles on that side.
Where no straight road leaves the square (four districts close around it), a road leaves from the
end of a district's lane instead, the one nearest the square first; when a road would change any
door's walking distance the next one is tried. The quay is a dead end beyond the town's content:
every door keeps its distance (the generator checks, the stress test checks over hundreds of towns,
200 of 200 got their quay); the dressing keeps off it. A new game starts on the quay (`HARBOUR.start`),
the guide stands there as the harbour master; the square, `START` and every check about the town
are unchanged. The gate is not built in the story: the ending is the lighthouse.

**The lighthouse** is the League hall's building (same footprint, same door tiles), painted by
`art.js` `paintLighthouse` as a keeper's cottage with a banded tower about nine tiles tall, dark
glass in the lantern room; its lit layer (lamp and windows) stays off until the end. The door, before
every core memento is found, only gives the thought "Locked from the inside."; then a first-person
close-up of the locks' door with the hatch (`riddles/closeup.js`, with three small options: a
heading, a line to ask, a thought of the caller's own, close on open) wants the word: `doorWord`
of the course's big idea (its longest uncommon word) or `"story": { "word" }`, matched like any lock's
text answer; after two misses the character remembers the word. Up the stair the keeper: the League's
duel with the story's skin, darker.

**Windows.** `Town.updateLighting` multiplies a building's lit layer and its glows by
`story.litOf(id)`: 0 until its owner remembers (the badge; a house without questions: its lab done),
1 after, 0.3 when the fog has returned; the guide's house lights at the warm stage, the lighthouse at
the end. Back from a house just remembered, `returned(id)` lights its window in a short cinematic.

**Rain** is two tiles of streaks scrolled over the view above the darkness (no sprite per drop),
and a place sound (`setRain`, a band of noise under 3.4 kHz) of the same amount: `1 − 0.75 ×` the
share of core houses remembered, 0 after the ending, gliding.

**Stages.** cold (under 30% of the core remembered), thawing, warm (75% and over, and after the
ending): what people say first (`S_WORDS.greet`), and what they answer to "What should I do now?":
curtly when cold ("Look in that notebook of yours"; the tracker and the notebook always have the
way), from `nextStep` otherwise. The harbour master always gives the way, grudgingly.

**The path.** `questOf({ mementos })` adds one step after the remembering of a core house: `memento`
("House 3: look upstairs"), done when `state.story.mementos[id]` is set. Every core house drawn as a
composed room gets an upstairs (`attic: true` on the place, `floors/plan.js`), even with no advanced
material; a workshop or a museum has none, and its owner hands the memento over when they remember.
The League opens when every core house is remembered and its memento found.

**Mementos** (`logic.js` `mementoOrder`): page, ticket, flower, photograph, drawing, letter, watch,
card, escalating; with fewer houses always the first, the photograph and the card, then the ticket,
the watch, the letter, the drawing, the flower as houses allow; more houses than kinds: more pages.
Each close-up is an illustrated painting (`scenes/objects.js`) on a table under a lamp: the
photograph puts a house of the town's shape in sepia with four people and one face violently
scratched out (the first thing one sees); the child's drawing is in crayon; the watch stops at the hour of the
arrival; the ticket and the flower carry the arrival's date in another year; the card carries the
name given to the purser as real text. Finding one restores a page of the notebook: the concept's
`idea`. The last page plays the pages in order, the big idea, and the lighthouse with its word; back
in town the camera lifts to the dark tower.

**The lamp and the register** (`finale.js` `playLamp`, after the keeper is won): the lamp room
painted, the keeper hooded (never a face), the lamp lit; two lines; the arrivals register on the
desk (`registerPainter`: the course's town name, the player's name handwritten down the page with
dates going back, the last line empty); "That is my signature." Then in town: the lamp lights and
its beam sweeps, the rain stops, every window lit; people say goodbye, the harbour master "Same
berth as always.", the tracker says the ship.

**The loop** (`playEnding`, at "Board the ship" or the pier's end): `endingOf(state)` picks the
sequence in `ENDINGS`; today always `loop`: the pages scattered on the quay and the first stretch
of the lane (a figure stooping, the harbour master pocketing one), the cover with one more tally
mark, the purser at the gangway ("Another round, <name>?"), the ship's lights going out as at the
arrival, then the first shot again (cross-dissolve), the rain beginning, the first caption, the
title, the ending card ("Another round.", "What you carry this time", the numbers), "Back to town".
The save is kept (`state.story.rounds` counts the rounds). Cuts are cross-dissolves (`cut`).

**The notebook (the menu)** (`notebook.js`): `quest/menu.js` `openMenu` hands over to
`openNotebook` when the story is on. A dark backdrop, a leather cover, paper pages (a fibre tile
painted once per session, ruled lines in CSS): a spread on a desktop, one page and "Next page" on a
phone (under 760 px). Ribbon tabs for the sections, plain Settings and Close buttons in the corner
(44 px targets). Handwriting: system handwriting faces upright where present, else an italic serif
(`font-synthesis: none`), 17 px and over. The Journey's latest entry comes from `nextStep` in the
character's words (`S_WORDS.nb.next`); the Map is drawn on a canvas from the town data (lane
edges in jittered ink, water hatched, houses outlined, the ship sketched, numbers as buttons); the
Clues' log is `notesOf(state, coreProgress)`, derived from the state (old saves show it too); the
mementos are thumbnails painted once from their close-up painters and cropped.

**After the ending** (`fog.js`, `logic.js`): per house `{ at, n }` in `state.story.fog`, started at
the ending (later for houses remembered afterwards). After 1, 3, 7, 16 days (then 16) the house's
windows dim, the notebook marks it "fog again", and its owner says "Do I know you?": two right
answers in a short remembering (`fogDuel`, friendly questions) bring it back and lengthen the next
interval. The tracker never nags about it. `?days=3` in the address moves the clock.

**Sound.** `sfx.theme('fragment' | 'opening' | 'full')` (see "Sound"), `sfx.horn()`, `setRain(v)`.

**State.** `state.story`: `name`, `arrived`, `arrivedAt`, `notebook`, `mementos` (id -> kind),
`lit` (windows shown lighting), `understood` (1: the lighthouse pan pending; 2: done), `door`,
`turned`, `left`, `rounds`, `fog`. Old saves load: a house with a badge and no key gets the key in the story.

**Pictures**: `npm run shots:story` (`scripts/storyshots.mjs`) plays the arrival for real, then
jumps with `__hb.story` (`at(n)`, `memento(id)`, `window(id)`, `understood()`, `door()`, `lamp()`, `ending()`, `paint(name, params)`,
`fog(id)`, `where(what)`), desktop 1440 x 800 then a phone 390 x 844, into `/tmp/story-*.png` and
`/tmp/story-phone-*.png`; the notebook's three sections at the start, mid-game and after the
ending are `story-nb-*.png`. One painter alone: `node scripts/paintshot.mjs harbour '{"dock":1}'
/tmp/x.png [w h dpr]`. The older picture scripts add `?arrived` (the story on, the arrival
skipped), except `spineshots.mjs` and the play-through bot (`npm run play`), which show and play the
plain town's main path (`?story=0`).

**Adding**: a caption or a line in `words.js` (both languages; `npm test` checks the placeholders,
one sentence per caption, no exclamation marks outside the owners' comedy); a memento: a kind in
`MEMENTO_ORDER` and `ADD` (`logic.js`), its painter in `mementos.js`, its title and thought in
`S_WORDS.mementos`.

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
| Locks (a safe, a computer, a door with a hatch) and stairs: key objects | single tap or click, Space | a lock: its first-person close-up, with a padlock and a question mark above it while the player is near and it is shut; stairs: up, or without the key a short thought and a key mark |
| Atmosphere: anything else | double tap or double click on a thing within 3 tiles, or T for what the player faces (across empty ground, the first thing up to 3 tiles ahead) | a thought bubble above the head: a pale cloud with small circles, no name, no arrow, gone by itself in 2 to 4 s, never stacked, clear of the HUD, no sound but a soft tick, not read aloud |
| Animals and happenings | coming close | no interface at all: the cat runs and hides, birds take off, the apple falls |
| Secrets | exploring: walking somewhere, thinking about something, standing still | the thought bubble, then a small toast "Discovery 3 of 9"; the discoveries (J, or the menu's Mysteries tab) |

Rules: the normal interaction always wins (T on a person only says "Maybe I should just say
hello."; a double tap on a house, a door, a sign, a person or an obstacle is an ordinary tap).
Nothing of this layer opens or reacts while a lab, a reading page, a dialogue, a quiz or the menu is
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
  secrets/   registry.js (kinds, texts, the rhyme), place.js (pure), art.js, paintings.js,
             journal.js (the discoveries: the menu's Mysteries tab, or a page of its own)
  obstacles/ kinds.js (registry, canPass), place.js (pure), art.js
```

Everything placed is deterministic (`seeded('life:...')`); behaviour (when a bird takes off, which
line comes next) uses `Math.random` and is cosmetic. Per frame the layer does nothing in proportion
to the map: the animals are about a dozen sprites, looked at every 200 ms and only near the camera;
secrets are checked when the player arrives on a tile.

### What there is

- **Musings**: 89 kinds of thing outdoors, indoors and animals, 3 to 6 lines each (319 in each
  language). About one musing in four or five is a **nudge** built from the next step of the main
  path (`nextStep`, see above; `nudgeLine` in `think.js`, tested): the house to go to, with its
  landmark or "right around here"; inside that very house, its lab; a duel; the League; after the
  ending, curiosity about what the town still hides. Nudges never name an extra. Sometimes a nudge hints at an
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

## Locks

Locks are the central object of exploring (`docs/DESIGN.md`, "Explore"): a safe, a computer that
asks for its password, a door that wants the word of the day. The course declares them as
`riddles` on a concept (`SCHEMA.md`); `src/mechanics/riddles/` does the rest.

```
src/mechanics/riddles/
  match.js     answer matching, pure (also read by the validator)
  hints.js     the thought after a miss: where to look, never what to type (pure)
  logic.js     attempt, open, rewards granted once, on any state object (pure)
  kinds.js     the registry of lock kinds; the words of locks and floors, English and Italian
  data.js      the riddles of the active course; openedLocks(state)
  art.js       the close-ups drawn in code (160 x 120, shown large), and the marks in rooms
  closeup.js   the first-person page: picture, clue, input, Try, Step back
  room.js      locks in a room: mark, prompt, use
  journal.js   the "Opened locks" section of the discoveries page (one call in secrets/journal.js)
```

**In a room.** The composer places a lock's piece (a fixture, `WORLD.md`) on the floor its `where`
names. Near a shut lock a padlock with a question mark floats above it; Space or a single tap opens
the close-up; a double tap gives a musing (`musings/lines.js`: `safe`, `terminal`, `hatchdoor`).

**The close-up** is a page over the game (`ui.page`): the lock drawn large in the game's pixel
style, in a dim room with dust in the lamp light, and real HTML on top where it must be read or
typed: the sticky note (crooked, with its tape) or the voice's bubble, the safe's display and big
digit keys (numbers and codes), the computer's login line, a text field, a clear Try button, Step
back and Esc. Text is at least 16 px. On a short stage (a phone with its keyboard open: the page
follows `visualViewport`) the clue and the thought move into the controls, so the clue, the field
and Try stay in view. Motion (dust, shake, the opening) follows `prefers-reduced-motion`.

**A miss** costs nothing: the lock reacts (a buzz, ACCESS DENIED, the eyes narrow), shakes, and the
character thinks where to look. The first two misses name the house ("Hm. No. I should go back to
the Dyer's House.", or "something I saw downstairs" when it is taught in this very house); from
the third (`PRECISE_AFTER`) the spot: the reading wall there, or which experiment of the lab, by
its name. Lines vary with the count. A line that would contain an accepted answer is replaced by a
vaguer one. Misses are counted in `state.tries[id]`, only for that.

**Opening** plays a small event: the safe's handle turns and its door swings open on a glowing
paper; the screen unlocks to one file; the hatch slams, three bolts slide and the door opens. Then
what is inside: the `note` as a document (kept, and listed in the discoveries under "Opened locks"),
a button to open the advanced `station` (the upper lab, at that station), a `link`, and coins, a
tool or a key granted once, with a flourish. `state.locks[id]` keeps it open; using it again shows
the content again and grants nothing.

**Matching** (`match.js`):

| Type | Accepted |
|---|---|
| text | case, accents, punctuation, extra spaces ignored; a leading article (the, a, an; il, lo, la, i, gli, le, l', un, uno, una) dropped; the words typed without spaces; a final plural `s` on the last word (on a word of 4 letters or more before the `s`, not `ss`); one typo in total (an insertion, a deletion, a substitution or two letters swapped) in a word of 6 letters or more; any of the accepted answers |
| number | comma or dot; a unit after it ignored (`120°`, `120 degrees`); within `tolerance` (default: exact for an integer, half a unit of the last decimal otherwise); anything with a second number refused |
| code | the digits exactly, leading zeros included; spaces and dashes ignored |

An empty answer never opens anything. `npm test` (`tests/riddles.test.mjs`) runs many accepted and
refused cases in English and Italian.

**Add a lock kind:** an entry in `kinds.js` (zone, piece, keypad, clue by note or voice, words in
both languages), its close-up painter in `art.js` (`ART[kind] = { paint, note | bubble, display |
screen }`, the spots in art pixels), a fixture zone in `gen/interior/zones.js` whose first piece is
the lock, the piece in `pieces.js` and its painter in `furniture.js`, its musings in
`musings/lines.js` (with `point: true`). `npm test` checks all of them.

**Layout.** Nothing may cover the place where the answer shows (the safe's display, the login
line on the screen). The sticky note is always in the controls (on a wide screen the side column,
on a phone above the keys), as a note taken off the lock; the voice behind a door stays a bubble
over the hatch, where nothing is typed (in the controls on a short stage); the thought after a miss
goes in the controls, above the keys. On an upright screen the picture is as tall as it needs, no
taller, so there are no dark bands. The password field shows its letters.

**Debug:** `__hb.riddles()` lists the course's riddles with their answers; `npm run shots:locks`.

## Upper floors

`src/mechanics/floors/`: `plan.js` (what a house keeps upstairs, pure: `floorsOf`, `fixturesOf`),
`stations.js` (`groundStations(id)`, `advancedStations(id)`), `keys.js` (keys for testing),
`room.js` (the scene side).

- A house has an upper floor when its concept has an advanced station, a riddle upstairs or a
  `further` link, and is drawn as a composed room (a workshop or a museum has none; the validator
  warns). Its ground floor gets a staircase; houses with nothing upstairs have none.
- **The key** is `state.keys[id]`, handed over by the owner when their duel is won
  (`mechanics/duel/`). Without it the stairs say so in character ("Private. The owner keeps the
  key." / "Marta keeps the key to the upstairs." / "... might hand over the key to someone who
  shows they understood"), and a key mark floats over them.
- **Upstairs** is `Interior` started with `{ id, floor: 'up' }` (`{ floor: 'ground', at: 'stairs' }`
  on the way down, at the foot of the stairs). Nobody lives there. The advanced bench (LAB II)
  opens the upper lab with the advanced stations no lock guards, and those of opened locks; the
  shelf opens the reading list (`further`); the stairwell in the front wall goes down.
- **Stations.** `LABS[id]` holds the ground-floor stations only: the lab downstairs, the tour and
  the main path's count use it. `UPPER_LABS[id]` holds the advanced ones (`openLab(id, k, { upper:
  [stationIds] })`), saved as `state.done['id+up:<stationId>']`.
- **Keys for testing:** `?keys=all` or `?keys=wheel,context` in the address, `__hb.giveKey('wheel')`
  (or `'all'`) in the console.
- **The look upstairs** differs on purpose: the room composer begins the plaque with UPSTAIRS (DI
  SOPRA) and paints it gold on dark wood, `paint.js` hangs a lamp from the beam
  (`upstairsLamp(L)`), and `floors/room.js` lays a warm dusk over the room with a pool of light
  under the lamp and a soft light around the player.
- **The locked closet** (ambient life's indoor obstacle) goes on a ground floor with a tidy wall,
  else under the roof (`planLife(..., { uppers })`, `closet.floor`).
- A key is shown and mentioned (duel prize, badge card, Mysteries) only for a house with an upstairs.


## Duels

The house quiz and the League are a **duel**: a skin over the course's questions (`docs/DESIGN.md`
is the specification). In the story (`docs/STORY.md`, on by default) the same duel is **remembering**:
the owner's bar is MEMORY, which fills, the player's is CLARITY, the League's champion is the keeper
of the lighthouse; in the plain town it is a duel of eloquence (conviction and composure). Everything
is in `src/mechanics/duel/` (the story's words and tempers are in `src/mechanics/story/words.js`):

```
rules.js    the rules as pure functions (Node): bars, a turn, the end, which questions, feedback,
            and the simulation used to tune the numbers
tempers.js  the registry of tempers (no imports: the course validator reads the names)
lines.js    stock phrases of debating and every word of the screen, English and Italian
prize.js    what winning gives, on the state object: badge, key, League (each once)
screen.js   the duel screen (HTML over the game, opened with ui.page), style.js its look;
            cfg.skin (the story) swaps the words, fills the opponent's bar, darkens the keeper's room
index.js    houseDuel(ui, id) (Interior.quizSeries), leagueDuel(ui) (UI.league), fogDuel (the story)
```

### Rules

| | House | League |
|---|---|---|
| Questions | the concept's own; levels 1 and 2 first, level 3 only to fill; a friendly rematch (house already won) puts levels 2 and 3 first | `finalCheck.size` of levels 2 and 3, one from each core house per round, shuffled |
| Turns | at most `min(6, questions of the concept)` | `finalCheck.size` |
| Right answers needed (the opponent's bar) | `ceil(0.6 × turns)`: 4 of 6, 3 of 5, 3 of 4 | `ceil(size × pass)` (6 for 8 at 0.7) |
| Wrong answers that end it (the player's bar) | `turns − need + 1`: 3, 3, 2 | `size − need + 1` (3 for 8 at 0.7) |

The learner just answers: no tone, no bet, no "how sure are you" (removed from the whole game,
the tall grass included). One right answer moves the opponent's bar by one (in the story: one
piece of memory comes back); one wrong answer costs one step of the player's. A bar done ends it,
so a house is always decided within its turns; the League is exactly the old pass mark (tested
for sizes 8 to 12). When the questions run out first, the fuller bar, as a share of its start,
wins; on an exact tie the player wins only with at least the pass share right.

**Coins**: 10 per level of the question for a right answer (`scoreAnswer`, which also keeps the
question history), nothing for a wrong one, in the duel and in the tall grass. **Losing** takes
nothing; Rematch ("Try again") draws other questions at once (`pickQuestion` prefers unseen, then
missed ones). **Step back** (Esc) leaves at any time; only coins already earned stay. An old save
with the confidence bet's statistics (`bets`) loads; they are ignored.

### Simulated success rates

Simulated learners are right on a question with probability `p_q`, drawn around their mean `p`
(Beta, concentration 6: some questions known well, some not). `npm test` prints this table (4000
per cell):

| Remembering | need / wrong | p=.4 | p=.5 | p=.6 | p=.7 | p=.8 | p=.9 | longest |
|---|---|---|---|---|---|---|---|---|
| house, 3 questions | 2 / 2 | 35% | 50% | 63% | 78% | 90% | 97% | 3 |
| house, 4 questions | 3 / 2 | 17% | 31% | 46% | 66% | 82% | 95% | 4 |
| house, 5 questions | 3 / 3 | 32% | 50% | 67% | 84% | 94% | 99% | 5 |
| house, 6 questions | 4 / 3 | 18% | 34% | 54% | 75% | 90% | 98% | 6 |

The keeper (8 turns, pass 0.7: 6 right before 3 wrong): at p = pass 56%, at p = pass + 0.15 90%,
at p = pass − 0.15 23%. Nothing ever lasted more than its turns.

Reading it: with six questions the targets hold (p = 0.7 succeeds three times in four, p = 0.4
fails more than four times in five). Fewer questions discriminate less, and no rule can fix that:
with four, a learner at 0.7 succeeds about two times in three; with five or three, one at 0.4 still
succeeds about a third of the time. Concepts with five or six questions make the fairest
rememberings (`skills/knowledge-base/references/6-questions.md`).

### Feedback

After a wrong answer the screen shows the chosen option and the right one, then "Why <chosen>
tempts:" (in the story: "The false memory, <chosen>:") with the option's `trap`, then the right answer
with the question's `why`; the owner defends the false memory in character. Without a trap: the
right answer and `why` only. After a right answer: `why`, never just "correct". In the League the
house of the question is named only after answering. A lost duel ends with what to look at again:
the concept, the reading wall here and the lab (house, with a Read the wall button), or the houses
of the missed questions by number and name (League); then Try again and Not now.

### Tempers and lines

A house owner's temper comes from `expert.temper` in `course.json` when it names one (the
validator warns about unknown names), otherwise from `seeded('<id>:temper')`. Tempers:
smitten, sore (sore loser), admirer, letwin (insists they let you win), theatrical, absent
(absent-minded), craftsman (proud craftsman). The League's champion has its own, grander temper
(`CHAMPION`), and steps aside when beaten; in the story, the keeper (`KEEPER`).

- **A temper**: one more entry in `TEMPERS` with `open`, `hit` (2+), `score` (2+), `lose` (hands
  over the key), `again` (a friendly rematch lost), `win` (in character; the screen adds what to
  review), in `en` and `it`, and the same in `R_TEMPERS` (story/words.js: opening confused, pieces
  coming back, the false memory defended, remembering and handing over the key). Add its name to
  the description of `expert.temper` in `course.schema.json`. `npm test` checks both languages,
  lengths, and that `lose` mentions the key.
- **A stock phrase**: append it to both languages in `STOCK` (`lines.js`) or `REMEMBER_STOCK`.
- **Another language**: one more key in `TEMPERS[*]`, `CHAMPION`, `STOCK`, `WORDS`, `CHALLENGE`,
  and in the story's tables.

### The screen

Readable first: the question is the largest text (20 to 22 px), answers are 52 px buttons 8 px
apart, the turn counter sits between the fighters, Step back is always in the header. The two
characters are the game's own painters (side frame, scaled up, crisp); the opponent is the host or
expert with their look, the League's the champion (the hooded keeper in the story). Bars shake and
move when hit; with `prefers-reduced-motion` nothing moves. Sounds are the soft existing ones
(`confirm`, `bump`, `reveal`) and follow the sound switches; questions are not read aloud.

Keys: 1 to 4 answer; arrows up and down move between answers and Enter answers; Enter or Space for
Next; Esc steps back.

## The lab kit and ready-made labs

Files: `src/lab/patterns/` (all new, small modules):

| File | |
|---|---|
| `expr.js` | The expression language of the data: a tokenizer and a recursive-descent parser that build closures. No `eval`, no `Function`; only listed functions and the variables the caller names. Pure. |
| `when.js` | The tries vocabulary: the learner record, `test(condition, record)`, `tracker(whens, did)`, `checkWhen` (the validator's messages). Pure. |
| `specs.js` | What each pattern accepts (`PATTERNS`: verbs, what the learner does, what it fits) and `checkReady(station)`, used by the validator, the `/play/` page and the tests. Pure. |
| `draw.js` | `C` (the frame's colours), `ink(pane)` (boxes, circles, lines, arrows, text that keeps 16 screen pixels and shrinks or wraps, emoji), declarative `shapes` in a 0..100 box. |
| `author.js` | `stage`, `sliders`, `button`, `tasks`, `animate`, `spring`, `shuffle`, `hit`: what a custom station needs. |
| `scene.js`, `sort.js`, `order.js` | The patterns: `sliderReveal` and `compare` (one picture language: plot, bars, shapes, regions, markers, readouts), `sort`, `order`. Each is a function `(ctx, data, whens) -> handle` and sets `ctx.stage.__ready` to its handle (the shots drive it). |
| `index.js` | Exports everything; `PATTERN_FNS` maps a `kind` to its function. `lab/kit.js` re-exports it all, so a lab file imports from one place. |
| `mount.js` | `readyMount(station)`: mounts the pattern named by `station.ready.kind` with its data. |

`course/labs.js` decides what a station runs: the course's own code for that station id if there is
any, else the pattern of `"ready"`, else the notice "no code yet". Code is looked up when the
station opens, not when the table is built (the packed player loads lab files a moment after
start-up). A task written `{ text, when }` reaches the frame as its text, and the conditions as
`station.when`; the frame passes the station to the code as `ctx.station`.

**Adding a pattern.** Write `src/lab/patterns/<name>.js` exporting a function `(ctx, data, whens)`
built on `stage` and `tasks` (lay out for `pane.upright`, fonts through `d.text`, `ctx.hint` for
each task, one strong effect with `spring` or `animate`, `ctx.stage.__ready = handle`). Register it
in `index.js` (`PATTERN_FNS`), describe it and check its data in `specs.js` (`PATTERNS`,
`checkReady`: messages that say what to write), add its kind to the schema's `ready.kind` enum,
a good and a bad example to `tests/patterns.test.mjs`, a complete example to
`references/8-ready-labs.md` (the test validates it), and a station to the gallery fixture
`tests/fixtures/patterns/` for `npm run shots:ready`. Then look at the pictures.

Built: `slider-reveal`, `compare`, `sort`, `order`. Not built (the plan named them): `mix`,
`threshold`, `match`, `label`, `what-if`, `predict-curve`. Their verbs (`combine`, `count`,
`pair`, `label`, `nudge`, `sketch`, `reveal`, `gap`) exist in `when.js` for custom code; the
demo's "Guess the curve" is a predict-curve written by hand with the kit.

## The prebuilt player

The same engine can bundle a course at build time (as always: `scripts/use-course.mjs` writes
`_data.js` and `_active.js` with the course inside) or read it at run time:
`use-course.mjs --player` writes versions of those two files that read
`<script type="application/json" id="mnemo-course">` (`src/course/payload.js`), and
`npm run build:player` builds that into `dist/player.html` with the placeholder empty.

Packing (`src/course/packing.js`, pure, shared by `scripts/pack.mjs` and the `/play/` page):

1. the course is validated (`validateCourse` of the knowledge-base skill: the same function as the
   command line);
2. each lab file (and `anims.js`) is kept as an ES module, its engine imports rewritten to read
   `globalThis.__mnemoKit` (`src/lab/api.js`: `lab/shell.js`, `lab/kit.js`, `lab/patterns/index.js`,
   `systems/audio.js`); any other import, a dynamic `import()` or an `export ... from` is refused
   with the file and line;
3. stations with neither code (the keys of `export default { ... }`, read without running the
   file) nor `"ready"` are named and refused;
4. `{ slug, course, world, labs, anims }` goes into the placeholder as JSON with `<` escaped; the
   title and `lang` of the page follow the course.

At start-up the player's `_active.js` loads each lab module from a Blob URL once every engine
module has run (`LOADED`); stations wait for it. Seeds, saves and everything else are as in a
bundled build: the save key and the town come from the course, not from the file. The player
holds the whole kit, so a packed game is a few kilobytes larger than its course's data.

`/play/` (`player/index.html`, `player/play.js`) takes files, a folder or pasted `course.json`,
validates and packs in the browser, starts the game in an iframe from a Blob URL, and downloads it
as one file. Nothing is uploaded; the page says so, and says that lab code runs in the page.
CI (`.github/workflows/build.yml`) builds the player and the page, publishes them at `/play/`,
packs `courses/pocket-demo` with `pack.mjs` and publishes it at `/pocket-demo/`, and runs
`packcheck.mjs` (packed chroma and packed demo against their bundled builds) and `playcheck.mjs`.

## Sound

Everything is synthesised in the page with the Web Audio API: no audio files, no network, nothing
added to the page size worth mentioning. The work is in `src/systems/sound/`; `src/systems/audio.js`
only re-exports it under the names the scenes always used (`initAudio`, `setMusic`, `duckMusic`,
`setMusicOn`, `toggleMute`, `setSea`, `setFire`, `sfx`).

```
systems/sound/theory.js  scales, moods, themes, the piece of a course, the planner of events (pure)
systems/sound/mix.js     game state -> levels of the layers; tiles -> place sounds (pure)
systems/sound/engine.js  the Web Audio graph; works on a live or an offline context
systems/sound/sfx.js     the short sound effects (steps, clicks, answers, doors) and the fire
systems/sound/index.js   the live context, the settings, the hooks of the game state
```

### The layers

The music is ambient and never resolves: mystery is the game's word for curiosity, so the sound
keeps a question open until the ending.

- **The bed**: two or three sustained pads at once (a triangle or sine body and a quieter saw,
  slightly detuned and drifting, attacks of 4 to 9 s, 16 to 40 s each) through a gentle low-pass.
  The chord under them changes every 25 to 60 s: open fifths with a ninth, a third only with
  "warmth" (day, the lantern mood). Harbour towns add a far foghorn every 2 to 5 minutes outdoors;
  citadels a faint choir-like pad (saws through two formants).
- **The sparse notes**: a distant bell, a kalimba-like pluck, a glass tone, in gestures of one to
  three notes with 2.5 to 40 s of silence between them, on a random walk over a scale without a
  leading tone (Lydian without the seventh, major pentatonic, Dorian, minor pentatonic with a
  second, Aeolian). No grid, no rhythm section; over an hour no five-note phrase comes back more
  than three times (tested).
- **The reverb**: a generated impulse response (4.2 s, darker as it decays) for the town, and a
  small two-delay room for indoors; the mix moves between them.
- **The motif**: the only recognisable theme, four notes (root, fifth, ninth, sixth, snapped to
  the course's scale: a question that does not close), heard only when something is found:
  `sfx.motif('secret' | 'lock' | 'cat' | 'key' | 'ending')`, each a variation (three bell notes;
  four quick plucks rising; glass with an echo; plucks over a low note; and at the ending the one
  resolution of the game: the motif, then IV to I in major, warm and short). It is not ducked.
  With music off the old chime says it instead.
- **The theme** (the story): one melody, the only tune of the game, built on the motif and snapped
  to the course's scale (`theory.js` `themeNotes`): four phrases (the motif, its answer, a rise, a
  close that comes home on the root), on a music-box voice (`box`) over a soft triangle bed, at
  `LEVELS.theme` 0.1 (a little above the sparse notes, 0.08). `sfx.theme('fragment')` (the motif,
  about 4 s: a memento, a window), `'opening'` (two phrases: the arrival, the notebook), `'full'`
  (all four, then the ending's cadence: the first shot again, at the loop). Never over a lab, a page or a duel (it
  returns 0 then); without music, the old chime. `sfx.horn()`: the ship's horn, the foghorn's saws,
  near. Tested for determinism, the motif first, every note in the scale, lengths and levels.
- **Rain** (the story): a place sound, a band of noise low-passed at 3.4 kHz with a slow swell,
  `setRain(0..1)` from `story/weather.js`, heard outdoors only.
- **Place sounds**, under the music and quiet: water (low-passed noise breathing slowly) near the
  river, the ponds and the sea; wind (band-passed noise, its band drifting) in the groves;
  a fountain near a fountain monument; crickets at night in the grass; a few birds by day. Three
  noise loops run all the time; crickets and birds are short sine figures.
- **Sound effects** (steps, clicks, answers, doors) are the old ones on their own bus, outside
  the music volume, through a low-pass at 5.2 kHz; the loudest were brought down 20 to 35 %.

### How the game drives it

`mix.js` maps where the player is to targets; `engine.js` glides there with time constants of
2.5 s (about 7 s to settle) for places and times of day, 0.6 s into a page and 1.5 s out of it.

| Where | What changes |
|---|---|
| town at night (default) | sparse, dark (pad low-pass about 690 Hz), long reverb, place sounds |
| dusk, day | the low-pass opens (x1.3, x1.8), a few more notes, more thirds |
| the square (7 tiles around the hub) | three pads instead of two, slightly fuller and denser |
| a room (`building`) | quieter, closer and drier: the small room reverb, no place sounds |
| a dark room, the museum (`castle`) | darker filter, fewer notes, more reverb |
| upstairs (`upstairs`) | very quiet (-10 dB against a room), wood creaks about once a minute |
| a lab, a reading page, a lock's close-up, the menu, a duel (`duckMusic`) | the bed ducks by 20 dB to a whisper, notes almost stop |
| a duel's question (`sfx.tension`) | a very soft heartbeat on the root |
| the ending card | the cadence above |

The Town passes itself (`setMusic(name, this)`); once a second `index.js` reads the player's
tile, the time of day and the distance to the square (`placeLevels` in `mix.js`, a 9 x 9 window of
terrain letters), never per frame. One timer plans the music 1.5 s ahead every 0.3 s.

### Moods and switches

| Mood | Character |
|---|---|
| `mist` (default) | the calmest: about 4 notes a minute, bells and glass, open fifths |
| `lantern` | warmer and brighter: about 6.5 notes a minute, mostly plucks, more thirds, a brighter scale |
| `deep` | darker and more mysterious: everything a fourth lower, a darker scale, longer pads, mostly glass |

- `courses/<slug>/world.json`: `"music": { "mood": "lantern", "volume": 0.6 }` (volume 0..1,
  default 0.6) or `"music": false` (no music at all; place sounds and effects stay).
- The address: `?mood=deep` (wins over everything, for listening tests).
- The menu: a Mood button next to Music cycles the three; the choice is saved (`state.mood`).
- M switches the music, V all sound. The context starts at the first key or click, suspends when
  the tab is hidden and resumes with nothing owed from the pause; without Web Audio the game is
  silent and nothing else changes. `__sound()` in the console shows what plays.
- Per course, deterministic: `seeded('music')` from the course id picks the tonic and the scale
  among the THEME's (harbour airy: Lydian, major pentatonic, Dorian; nordic cold and glassy:
  minor pentatonic with a second, Dorian, slightly higher; citadel darker: Dorian, Aeolian,
  slightly lower); the mood moves the scale along the list from bright to dark. Notes during play
  come from `seeded('music:play')`, the noise and the reverb from `seeded('music:noise')`.

### Measured, not heard

`npm run sound` renders minutes of every mood offline in headless Chrome with the same
`engine.js` and checks: peak below -6 dBFS (it is about -25), RMS in -48..-26 dBFS (about -41,
that is -46 to -50 dB(A), 7.5 to 11 dB under the old chiptune at -38.5 dB(A)), under 2 % of the
energy above 4 kHz (it is 0.0 to 0.1 %), 1.5 to 12 notes a minute, silences between notes, no NaN,
no clipping, the same id giving the same samples, two ids giving different keys, the 20 dB duck,
day brighter than night, a room quieter than the town. It writes `/tmp/music-<mood>.wav` (30 s),
`/tmp/music-<mood>.png` (spectrogram and levels), `/tmp/music-motifs.wav` and
`/tmp/music-journey.png`. LOOK at the pictures; listen to the files if you can. `npm test` covers
the pure parts (`tests/sound.test.mjs`): scales and keys, an hour of every mood and theme, the
state-to-mix table, the place levels, and the graph against a fake AudioContext.

### How to add

- **A mood**: one entry in `MOODS` (`theory.js`) and its name in `MOOD_ORDER`; its fields are
  documented above the table. Then `npm test` and `npm run sound` (add it to the list of moods in
  `scripts/soundcheck.mjs`).
- **A place sound**: a level in `placeLevels` (`mix.js`) from the terrain letters, a source in
  `engine.js` (a noise loop with a filter, or a figure in `chirps`) and a line in `LEVELS`.
- **A cue**: one entry in `CUES` (`theory.js`), then `sfx.motif('<name>')` where it happens.
- **Levels**: all in `LEVELS` (`engine.js`). Change them only with `npm run sound` afterwards.
