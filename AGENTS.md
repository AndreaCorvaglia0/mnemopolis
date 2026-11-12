# For AI agents working in this repository

This repository turns a subject into a learning game in three independent steps.

**Go all the way.** Unless the user says otherwise, a request for a game means: do steps 1 and 2
in one go and deliver the playable game. Do not stop after the knowledge base, do not wait for
approval of the map, and do not end with a plan or an offer to continue. Take sensible defaults,
say which ones you took, show the map in passing, and keep building. Stop early only if the user
asked to be consulted first ("ask me before", "show me the map first") or if you cannot even
tell what the subject is.

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
- In a Claude chat, deliver the game by publishing `engine/dist/index.html` as an artifact, and
  republish the same artifact after every change.
- Look at the screenshots (`npm run shots` in `engine/`) before saying the game works.

Commands, from the repository root: `npm run new -- <slug>`, `npm run validate -- courses/<slug>`,
`npm run setup`, `COURSE=<slug> npm run build`, `npm run shots`.

If you are in a chat and not in a coding tool: your workspace does not last. Send the user the
course folder as a zip at the checkpoint and at the end (see `skills/game-build/SKILL.md`).
