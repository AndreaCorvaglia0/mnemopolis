# Architecture

The design of the game itself (main story, duels, the three axes, guidance) is in `DESIGN.md`;
the reasons are in `wiki/`, published to the repository's wiki.

Three layers, each replaceable without touching the others.

```
courses/<slug>/            a course (content only)
  knowledge/               working documents: brief, sources, map and path
  course.json              the contract between design and game
  labs/<conceptId>.js      interaction code, one function per station id
  anims.js, world.json     optional: page animations; overrides of the derived world

skills/knowledge-base/     how to design a course; validator; schema
engine/                    how to play one
  src/world/               generates the town from the course
  src/scenes/              town, standard room, workshop, museum, interface
  src/lab/                 frame of a lab station, reading page, map, helpers
  src/art/                 everything drawn in code (the look)
  src/gen/                 optional generators: house fronts, town dressing, themes
  src/gen/interior/        composed rooms: plans, zones, trades, kinds, compose, rules, paint
  src/systems/             save, audio, movement
  src/mechanics/           game dynamics: ambient life (thoughts, animals, secrets, obstacles); later coins and a shop
    riddles/               locks with free answers: matching, close-ups, the thought that says where to look
    floors/                upper floors: stairs, keys, the advanced bench, the split of ground and advanced stations
  src/mechanics/experience/ experience (one number, tiers), the commenting world, withheld lines, canEnter
  src/mechanics/games/     mini-games: the frame, the ready kinds, scoring, placement in town
  src/mechanics/quest/     the main path: core and extra, nextStep (one source for every hint), the
                           tracker's words, the menu (Journey, Map, Mysteries), the ending card
  tests/                   Node tests (npm test): rooms, homes, the course format, the main path, ambient life
```

`npm test` (in `engine/` or at the root) runs the tests with Node's own runner, in a few seconds;
the CI workflow runs it before building. The room generator is split so that each file has one
job: `plans.js` (room shapes), `zones.js` (groups of furniture, as data), `trades.js` (experts'
trades, as data), `kinds.js` (each building kind's room), `pieces.js` (furniture sizes),
`compose.js` (the composition, pure data, runs in Node), `rules.js` (the rules, as lists of
problems), `furniture.js` and `paint.js` (pixels), `index.js` (the public API).

## The contract: `course.json`

Defined by `skills/knowledge-base/schema/course.schema.json`. It holds everything the learner
reads and the specification of everything they do. It holds nothing about pixels: no building
kinds, no characters, no coordinates. The engine derives those (a `mechanism` becomes a lab
building, a `process` a workshop, a `story` a museum, a concept with an `expert` that person's
home) and a course may override them later in a separate file.

## Where future work goes

| Addition | Place | Must not touch |
|---|---|---|
| A new learning technique or rule | `skills/knowledge-base/references/`, and a check in `scripts/validate.mjs` | the engine |
| A new field in the course | the schema, the validator, the example, then the engine | |
| A new kind of lab interaction | a helper in `engine/src/lab/`, a row in `references/5-labs.md` | scenes |
| Game dynamics (points to spend, shops, quests, streaks) | `engine/src/mechanics/`, reading progress from `systems/state.js`; its first resident is the ambient-life layer | the course format: dynamics are a property of the game, not of the knowledge |
| A mini-game kind | `engine/src/mechanics/games/kinds/<kind>.js` (a mount on the frame's context), its rounds in `gen.js`, its checks in `spec.js`, an example in `references/10-games.md` (the test validates it) | the course: a course that needs a one-off game writes it in `games/<id>.js` |
| Something experience should change | a line in `experience/lines.js`, or an entry in `ENTRY_NEEDS` (`canEnter`), or a rule in `ENDING_RULES` | the main path: experience never gates learning |
| Coins, a shop, tools that open obstacles | `engine/src/mechanics/`: the obstacles and `canPass(obstacle, state)` are there (`obstacles/kinds.js`), reading `state.tools`; a shop only has to write that | the course, and anything the course needs: an obstacle never stands in the way of learning |
| Art: buildings, landmarks, landscapes, characters | `engine/src/art/`, registered in `engine/src/world/` | lab code |
| A room zone, an expert's trade, a room plan, a furniture piece | one entry in the registry of `engine/src/gen/interior/` (`zones.js`, `trades.js`, `plans.js`, `pieces.js`); `npm test` checks it | the composition and the rules |
| A generated variation (house style, room plan, dressing piece, theme) | `engine/src/gen/`, each module behind its switch in `world.json` (`"gen"`), seeded by the course id | the hand-made fallback it replaces |
| Another front end (cards, a printable workbook, a 3D world) | a sibling of `engine/` reading the same `course.json` | |

## Interaction grammar

One gesture per kind of thing, one look per gesture (details in `engine/docs/ENGINE.md`, "Ambient
life"): a single tap or Space is for what matters to learning (people, doors, labs, reading, and
obstacles, locks and stairs as key objects) and opens the dialogue box or a page (a lock: its first-person close-up); a double tap or T is for atmosphere
and shows a thought bubble that fades by itself; animals and happenings react to proximity with no
interface at all; secrets are found by exploring and collected on the discoveries page. Nothing of
the atmosphere opens while learning is on screen.

## Decisions

- **Generated, not placed.** The town is computed from the course, so the map of the course and
  the map of the town cannot drift apart.
- **One page.** The build is a single HTML file with no network access at run time.
- **Limits are enforced by code**, in the validator, not left to good intentions.
- **Sounds are samples computed by pure code** (`systems/sound/synth.js`): what the player hears in
  a lab or a game is what the tests measure in Node.
