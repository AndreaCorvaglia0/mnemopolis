# Roadmap

## Done

- Knowledge-base method as an independent skill, with schema, validator and a worked example.
- The engine reads `courses/<slug>/course.json`; a course folder holds only content and the
  interaction code of its lab stations.
- A compact, organic town: winding lanes, a river with ponds and a bridge, small plazas, groves;
  night by default; every door checked to be reachable and close to the square.
- Engine: generated town, standard rooms, workshop, museum, lab frame, reading pages, map,
  review questions, final check, save, music.

- A build skill, root commands, a course scaffold, and a workflow that validates, builds and
  publishes every course on push.

- Phones: tap to walk and to use things, touch buttons, an interface laid out for upright
  screens, one zoom rule for every screen shape, a phone screenshot tour.

- Optional generators (`engine/src/gen/`): house fronts, rooms and town dressing that differ per
  house and per project (three themes, emblems), deterministic, each one switchable in
  `world.json`. Size and care of a course are independent settings of the brief.

- Optional read-aloud (`engine/src/systems/voice.js`): the browser's own speech reads the reading
  wall, lab stations, plaques and people's lines when the learner presses Listen; `"voice"` in
  `world.json`, saved on/off switch, pronunciation map.

- Composed rooms (`engine/src/gen/interior/`): a room is an axis, a focal point and two or three
  groups of furniture from a registry, with order rules (tall pieces against walls, one focal
  point, rugs under groups, 55% free floor, pairs in rhythm) checked in code; six plans, no dead
  space; readable labels in caves.
- Experts' homes: an optional `expert` on a concept (validated) turns its house into the home of a
  person with a trade (twelve trades, five house shapes, three themes); `"homes": "auto"` in
  `world.json`; two homes in the example course.
- Tests with Node's runner (`npm test`), run by the CI workflow.

## Next

1. Play-testing with real learners, and a second example course that uses the layouts and
   landscapes the first one does not.

## Later

- Labs of the example course drawn for small screens (some canvas text is small on a phone).

- Game dynamics: spending points, shops, avatar items, quests.
- Generators: more variety for studio, museum and league hall; more themes; more zones and
  trades; room plans with two rooms seen through a doorway.
- More art: landmarks, seasons.
- Per-option feedback on questions, using the `traps` already in the course.
- Courses in several towns, linked.
- Play-testing protocol and its results.
