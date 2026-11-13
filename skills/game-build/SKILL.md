---
name: game-build
description: Build the playable game from a validated course knowledge base (courses/<slug>/course.json) by coding each lab station from its specification, testing it and delivering one HTML page. Use after the knowledge-base skill, once the user has approved the map.
---

# Game build

The course is designed. Your job is to make each lab station work as specified, and to prove it.
The engine does everything else: you do not touch `engine/src/` unless a station needs a helper
that does not exist.

## Before you start

- `node skills/knowledge-base/scripts/validate.mjs courses/<slug>` reports no errors.
- The map has been shown to the user. Their approval is not required unless they asked for it.
- Read `engine/docs/SCHEMA.md` (what a station's code receives) and one lab of the example,
  `courses/chroma/labs/lamps.js`, as the quality bar.

## Steps

1. **Set up once.** `npm run setup` (installs the engine's packages).
2. **One station first, end to end.** Pick the first station of the first concept. Write
   `courses/<slug>/labs/<conceptId>.js` exporting `{ <stationId>: mount }`, then
   `COURSE=<slug> npm run build` and `npm run shots`. Open the pictures, publish the game so the
   user can already play, and **continue without waiting**.
3. **Then the rest, concept by concept.** After each concept: build, shots, look.
4. **Deliver** (see below). The work is done when every station has code and the game is
   published, not before. If you are running out of room, finish whole concepts, publish what
   works, and say exactly which stations are still missing.

Stations without code do not break the game during the work: they show a notice, and
`npm run check` lists them. A course is finished when that list is empty.

## Coding a station from its specification

The specification in `course.json` is the contract. Each field tells you something to build:

| Field | What you build |
|---|---|
| `object` | What is drawn on the stage. The stage is most of the screen: fill it (see below) |
| `action` | The interaction, on the stage itself whenever possible (`canvasPane`, `draggable`) |
| `controls` | At most two controls in `ctx.controls` (`slider`, `seg`), with full-word labels. On a phone they sit right under the picture |
| `tries` | For each task, a condition on the state that calls `ctx.did(i)` when it becomes true, and `ctx.hint(k => ...)`: where to act for it (a point on the picture or the control it needs) |
| `surprise` | The state the first task must lead to. Check that it is actually reachable and visible |
| `predict` | Nothing: the frame asks it while your picture is shown, frozen, and gives the verdict at the end (from `predict.answer`). Draw the starting state so that it does not give the answer away |
| `goal`, `takeaway`, `source` | Nothing: the frame shows them (`source` only in the theory drawer) |
| `data` | Real material to embed: import it so the build inlines it; keep it small |

Rules:

- **Everything on screen is computed from the state.** No number, colour or label typed by hand
  to look like a result.
- **Each task must be completable**, and must tick only when really done. Play it yourself in
  your head: which pointer moves reach the end state? Are the thresholds forgiving enough for
  a finger on a phone?
- **One redraw function.** Change the state, call it. Check the tasks inside it.
- **After every `await`, test `ctx.alive()`.** Stop timers, audio and animation frames in
  `ctx.onCleanup`.
- **No network at run time.** No CDN, no remote fonts or images.
- Texts shown by your code (captions, readouts) follow the course's language and tone: plain,
  no praise, no exclamation marks.
- **Draw for the whole stage.** Use `canvasPane(ctx.stage, w, hgt, caption, { portrait: [w2, h2] })`
  with a wide box for screens and laptops (about 3:2) and a near-square box for a phone held
  upright (about 480 x 520). Lay out from `pane.W` and `pane.H` (or `pane.upright`), and pass
  your draw function to `pane.onResize`. Never leave a small drawing in a corner of a large box.
- **Readable at any size.** Write every font as `pane.font(size, weight)` (never below 16 screen
  pixels), lines 2 to 4 units wide, things to drag at least 40 px across on a phone, task
  thresholds forgiving for a finger. Where a chart has values, offer them with `pane.tip(fn)`.
- **No text that answers the question.** Captions and read-outs must not reveal the prediction
  before the learner has found it on the stage.
- **No permanent instructions.** A hint that matters at one moment ("Point at the overlap to
  read the light") is `ctx.nudge(text)` at that moment; a read-out that follows the pointer is
  `pane.tip`. Name things in full words on the picture ("light A", "lamp B: red part"), not
  single letters.
- **The flow is the frame's.** Do not draw your own instructions, ticks, "well done" or Next
  buttons: call `ctx.did(i)` and the frame does the rest. Check with `npm run shots:lab` and
  `npm run shots:phone`.
- Aim for 40 to 80 lines per station. If it grows beyond that, the design is probably two
  stations: say so.

**If the specification cannot be built honestly** (the surprise does not happen, the task has no
detectable end, the model would have to fake a result), stop and go back to the knowledge base:
change `course.json`, validate, tell the user what changed and why. Never bend the code to
match a wrong design, and never change `course.json` silently.

## Testing

| Command | What it proves |
|---|---|
| `COURSE=<slug> npm run check` | The course is valid, every station has code, every door in the town is reachable and near |
| `COURSE=<slug> npm run build` | The above, then `engine/dist/index.html` |
| `npm run shots` | Pictures in `engine/shots/`: the town, a walk into a house and back, every room, station and page |
| `npm run shots:phone` | The same on a phone held upright, with touch, in `engine/shots/phone/` |
| `npm run shots:lab` | One station walked through every state of the frame, and the first state of every station, desktop and phone, in `engine/shots/lab/` |

Pictures show the first state of each station, not the interaction. For each station also
verify the logic of its tasks by reading your own conditions against the drawing code.

If there is no Chrome in your environment, `npm run shots` says so and skips. Then tell the user
plainly that nothing was checked on screen, and ask them to play each station once.

## Care: graphics and testing

The care chosen in the brief (see `skills/knowledge-base/SKILL.md`) sets the polish, never the
correctness: every station must still work as specified.

| | light | standard (default) | curated |
|---|---|---|---|
| Graphics | fully generated: default theme, no custom art, `world.json` only for switches, no emblems | generated, emblems chosen per concept | a theme chosen or tuned for the project; custom emblems or art pieces allowed |
| Screenshots | one pass | `npm run shots` | `npm run shots` and `npm run shots:phone` |
| Labs | build once | build once | refine after a first play |
| Voice (read aloud) | `"voice": true` in `world.json` | `"voice": true` | `"voice": true`, plus a `say` map for acronyms and symbols the voice gets wrong |

The generators can be switched off in `courses/<slug>/world.json`
(`"gen": {"facade": false, "interior": false, "dressing": false}`) and a theme chosen
(`"theme": "harbour"`, `"nordic"` or `"citadel"`); see `engine/src/gen/core.js`.

Read-aloud costs nothing to build and nothing in size, so it is on at every level of care: it uses
the browser's own voices and only speaks when the learner presses Listen. See "Voice" in
`engine/docs/ENGINE.md`.

## Delivering

- The game: `engine/dist/index.html`, one self-contained page with no network access.
  **In a Claude chat, publish it as an artifact**: pass that file as it is to your artifact tool
  (it is a complete HTML page; do not rewrite or shorten it), give it the course title, and
  tell the user in one line what it is. On every later change, republish the **same** artifact
  so the user's link stays valid. Only if you have no artifact tool, send the file instead.
  Publish early: as soon as the first station works, so the user plays while you build the rest.
- The course: zip `courses/<slug>/` and send it too. It is the source: without it the game
  cannot be changed later. If you can push to the user's repository, commit it there instead.
- Tell the user: what is simplified, what you could not test, and which stations you are least
  sure about.

## Working in a chat instead of a coding tool

A chat's workspace does not last. Therefore:

- at the checkpoint of the knowledge base, and at the end, **send the course folder as a zip**;
- to continue later, the user attaches that zip and the repository link again;
- prefer a small course (4 to 6 concepts) for a first run, and build one theme at a time.
