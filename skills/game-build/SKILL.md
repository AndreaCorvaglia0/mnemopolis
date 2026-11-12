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
- The user has seen and accepted the map. If not, go back: do not build an unapproved course.
- Read `engine/docs/SCHEMA.md` (what a station's code receives) and one lab of the example,
  `courses/chroma/labs/lamps.js`, as the quality bar.

## Steps

1. **Set up once.** `npm run setup` (installs the engine's packages).
2. **One station first, end to end.** Pick the first station of the first concept. Write
   `courses/<slug>/labs/<conceptId>.js` exporting `{ <stationId>: mount }`, then
   `COURSE=<slug> npm run build` and `npm run shots`. Open the pictures. Show the user this one
   station before writing the others: it is the cheapest moment to correct the style.
3. **Then the rest, concept by concept.** After each concept: build, shots, look.
4. **Deliver** (see below).

Stations without code do not break the game during the work: they show a notice, and
`npm run check` lists them. A course is finished when that list is empty.

## Coding a station from its specification

The specification in `course.json` is the contract. Each field tells you something to build:

| Field | What you build |
|---|---|
| `object` | What is drawn on the stage, as large as possible |
| `action` | The interaction, on the stage itself whenever possible (`canvasPane`, `draggable`) |
| `controls` | At most two controls in `ctx.controls` (`slider`, `seg`) |
| `tries` | For each task, a condition on the state that calls `ctx.did(i)` when it becomes true |
| `surprise` | The state the first task must lead to. Check that it is actually reachable and visible |
| `predict` | Nothing: the frame asks it before your code runs |
| `goal`, `takeaway`, `source` | Nothing: the frame shows them |
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

Pictures show the first state of each station, not the interaction. For each station also
verify the logic of its tasks by reading your own conditions against the drawing code.

If there is no Chrome in your environment, `npm run shots` says so and skips. Then tell the user
plainly that nothing was checked on screen, and ask them to play each station once.

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
