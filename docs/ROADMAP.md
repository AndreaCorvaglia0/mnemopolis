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

- The spine of the game (`engine/src/mechanics/quest/`): core and extra concepts (`"core": false`,
  validated, with the time of the core path), one `nextStep` behind every hint, a one-line tracker
  and a mark over the next house, people who answer "what now?" and hint at more, a menu with
  Journey, Map (the town as explored, and the mind map) and Mysteries, the League gated by the core
  houses, and an ending card.

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

- Ambient life (`engine/src/mechanics/`, the first resident of the place for game dynamics): the
  player thinks aloud (double tap or T, a thought bubble; one thought in four or five nudges toward
  the next house), animals that move and hide (by theme and time of day), rare secrets and one small
  mystery (the lantern cat and its rhyme), a discoveries page, obstacles on optional side places
  that will open with tools. Switchable in `world.json` (`"life"`), English and Italian, deterministic,
  checked over hundreds of towns: nothing of it stands in the way of the course.

## Next

1. Play-testing with real learners, and a second example course that uses the layouts and
   landscapes the first one does not.
2. The game around the course, in the order of `docs/DESIGN.md`: duels of eloquence and the
   League as a duel (the spine is done), then locks and upper floors, coins and shop; ambient
   music; a gate on the town's edge for the ending (today the scene plays at the League hall).
3. Pocket mode (`docs/POCKET.md`): one question about budget at the start, ready-made parametric
   labs, a prebuilt player that packs a course without a build, a one-page skill, a small fixed
   shape of game.
4. Coins from questions, a shop for tools, obstacles opened by tools. The obstacles, their tools
   (`needs`), `canPass` and the saved `state.tools` / `state.opened` exist (`engine/src/mechanics/obstacles/`);
   what waits behind them is a placeholder listed as "sealed".

## Later

- Ambient life, ideas left out on purpose: a door knocker that answers, a weathervane on a roof,
  footprints in snow or sand that lead somewhere, a broken bridge plank to a tiny island, birds on
  the roofs at dusk, an attic hatch indoors, a canary; animals in the workshop and the museum;
  musings read aloud; the night sky gaining a constellation (the town is seen from above, so there
  is no sky to put it in: the night-sky painting carries it instead); per-course lines in
  `world.json`; a third language.

- Labs of the example course drawn for small screens (some canvas text is small on a phone).

- Game dynamics: spending points, shops, avatar items, quests.
- Generators: more variety for studio, museum and league hall; more themes; more zones and
  trades; room plans with two rooms seen through a doorway.
- More art: landmarks, seasons.
- Per-option feedback on questions, using the `traps` already in the course.
- Courses in several towns, linked.
- Play-testing protocol and its results.
