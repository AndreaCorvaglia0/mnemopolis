# Roadmap

## Done

- Knowledge-base method as an independent skill, with schema, validator and a worked example.
- Engine: generated town, standard rooms, workshop, museum, lab frame, reading pages, map,
  review questions, final check, save, music.

## Next

1. **Engine reads `course.json`.** Course text comes from the knowledge base; `courses/<slug>/labs/`
   holds only interaction code, one function per station id. Remove `engine/src/course/`.
2. **A smaller, more natural town.** Compact layout with curved streets, a river through it,
   small squares, more landmarks and vegetation; night as the default mood.
3. **A build skill** (`skills/game-build/`): from a validated course to a tested game.

## Later

- Game dynamics: spending points, shops, avatar items, quests.
- More art: building variants, landmarks, seasons.
- Per-option feedback on questions, using the `traps` already in the course.
- Courses in several towns, linked.
- Play-testing protocol and its results.
