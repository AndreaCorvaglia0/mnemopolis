# Architecture

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
  src/gen/                 optional generators: house fronts, rooms, town dressing, themes
  src/systems/             save, audio, movement
```

## The contract: `course.json`

Defined by `skills/knowledge-base/schema/course.schema.json`. It holds everything the learner
reads and the specification of everything they do. It holds nothing about pixels: no building
kinds, no characters, no coordinates. The engine derives those (a `mechanism` becomes a lab
building, a `process` a workshop, a `story` a museum) and a course may override them later in
a separate file.

## Where future work goes

| Addition | Place | Must not touch |
|---|---|---|
| A new learning technique or rule | `skills/knowledge-base/references/`, and a check in `scripts/validate.mjs` | the engine |
| A new field in the course | the schema, the validator, the example, then the engine | |
| A new kind of lab interaction | a helper in `engine/src/lab/`, a row in `references/5-labs.md` | scenes |
| Game dynamics (points to spend, shops, quests, streaks) | a new `engine/src/mechanics/`, reading progress from `systems/state.js` | the course format: dynamics are a property of the game, not of the knowledge |
| Art: buildings, landmarks, landscapes, characters | `engine/src/art/`, registered in `engine/src/world/` | lab code |
| A generated variation (house style, room plan, dressing piece, theme) | `engine/src/gen/`, each module behind its switch in `world.json` (`"gen"`), seeded by the course id | the hand-made fallback it replaces |
| Another front end (cards, a printable workbook, a 3D world) | a sibling of `engine/` reading the same `course.json` | |

## Decisions

- **Generated, not placed.** The town is computed from the course, so the map of the course and
  the map of the town cannot drift apart.
- **One page.** The build is a single HTML file with no network access at run time.
- **Limits are enforced by code**, in the validator, not left to good intentions.
