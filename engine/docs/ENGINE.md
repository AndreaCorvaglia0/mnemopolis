# The engine: commands, files, pitfalls

## Commands (run in `engine/`)

| | |
|---|---|
| `npm install` | Once. Needs Node 18 or later. |
| `npm run check` | Validates the course against the limits. |
| `npm run build` | Check, then build one self-contained page: `dist/index.html`. |
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
  course/          THE COURSE: course.js, pages.js, labs/         <- you work here
  world/townMap.js generates the town from the course
  scenes/          Boot, Town, Interior (standard room), Workshop (belt), Museum (timeline), UI
  lab/             shell.js (station frame), kit.js (canvas, drag, predict), code.js (code panel),
                   reading.js (reading wall), map.js (the map), museum.js (plaques)
  art/             everything drawn in code: ground, buildings, sprites, palette
  systems/         state (save), audio (music and sounds), walker (movement)
  data/content.js  read-only views of the course for the scenes
```

You should rarely need to leave `course/`. See `WORLD.md` for what a custom look touches.

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
- **A canvas inside `.lab-view` is stretched to fill it.** Use `canvasPane`, which keeps
  proportions and converts pointer positions. For a grid of small canvases, wrap them in
  `<div class="lab-box">`.
- **After every `await` in `mount`, check `ctx.alive()`.** The learner may have moved on.
- **Text.** Keep code lines under about 60 characters in the side panel. Long labels on
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
