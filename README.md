# Mnemopolis

Turn any subject into a small game you learn by playing: a pixel-art town where every house is
one concept and holds a lab to handle it. Built on recognised active-learning techniques
(retrieval practice, spacing, prediction, self-explanation, method of loci), not on points and
badges.

An AI coding agent does the work. You bring the subject and your material.

## How it works

| Layer | What it is | Where |
|---|---|---|
| **Knowledge base** | The course as data: concept map, learning path, lab designs, questions | `skills/knowledge-base/` writes `courses/<name>/` |
| **Engine** | The town, the rooms, the lab frame, the map, the questions | `engine/` |
| **Look** | Landscape, landmarks, buildings, music | `engine/src/art/` |

The knowledge base stands on its own: it is a course design a teacher can read, and the engine
is only one way to walk through it.

## Make your own

1. Use this repository as a template and open it with an AI coding agent (Claude Code or similar).
2. Say: *"Read AGENTS.md. I want a course on ‹subject›. My material is in ‹folder›."*
3. Answer its questions, approve the map it shows you, play the result.

`courses/chroma/` is a complete example (a short course on colour).

## Status

Early. The knowledge-base method, its validator and the engine work end to end on the example
course. The town's look is being reworked.
See [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

The research behind the method: [skills/knowledge-base/references/evidence.md](skills/knowledge-base/references/evidence.md).

MIT licence.
