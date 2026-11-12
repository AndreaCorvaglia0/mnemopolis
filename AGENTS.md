# For AI agents working in this repository

This repository turns a subject into a learning game in three independent steps. Do them in
order, and do not start a step before the previous one is accepted by the user.

| Step | You do | Instructions | Output |
|---|---|---|---|
| 1. Knowledge base | Design the course: sources, concept map, path, lab designs, questions | `skills/knowledge-base/SKILL.md` | `courses/<slug>/course.json` + `knowledge/*.md`, validated |
| 2. Game | Code each lab station from its specification in `course.json`; the engine does the rest | `skills/game-build/SKILL.md` | `courses/<slug>/labs/*.js`, then `engine/dist/index.html` |
| 3. Look (optional) | Adjust the town's appearance | `engine/docs/WORLD.md` | the same build |

Rules that hold everywhere:

- Speak to the user in their language. Write the course in the language of the brief.
- Accuracy first: nothing reaches the learner that does not rest on a source.
- Few concepts, one objective per lab station, nothing decorative.
- Step 1 never touches `engine/`. Steps 2 and 3 never change the content of `course.json`:
  if the build reveals a problem in the design, go back to step 1 and say so.
- Look at the screenshots (`npm run shots` in `engine/`) before saying the game works.

Commands, from the repository root: `npm run new -- <slug>`, `npm run validate -- courses/<slug>`,
`npm run setup`, `COURSE=<slug> npm run build`, `npm run shots`.

If you are in a chat and not in a coding tool: your workspace does not last. Send the user the
course folder as a zip at the checkpoint and at the end (see `skills/game-build/SKILL.md`).
