---
name: knowledge-base
description: Turn a subject and its source material into a course knowledge base for a learning game (sources, concept map, learning path, active-learning plan, lab designs, questions) and write it as a validated course.json. Use when someone wants to learn or teach a subject with this repository, before any game code is written.
---

# Knowledge base

You are designing a course, not writing code. The output is a **knowledge base**: a small,
connected set of concepts, the order to meet them in, what the learner will *do* with each one,
and how they will be asked about it later. A game engine turns it into a town to walk through,
but the knowledge base must stand on its own: it should make sense to a teacher who has never
seen the game.

Good courses are made here. A weak map cannot be rescued by graphics.

## Output

Everything goes in `courses/<slug>/`:

| File | What it is | Who reads it |
|---|---|---|
| `knowledge/brief.md` | Learner, goals, scope | You and the user |
| `knowledge/sources.md` | Every source, how far it can be trusted, and which claims rest on it | The user, reviewers |
| `knowledge/map.md` | Concepts kept and left out, links between them, the mind map, the path | The user (this is the checkpoint) |
| `course.json` | The course as data: themes, concepts, labs, questions | The engine, the validator |

Templates are in `templates/`. The format of `course.json` is in `schema/course.schema.json`,
with a complete example in `courses/chroma/`.

## The six steps

Do them in order. Each has a reference file: read it when you reach the step, not before.

| # | Step | You produce | Reference |
|---|---|---|---|
| 1 | **Brief**: who learns, what for, how much | `brief.md` | below |
| 2 | **Gather**: the user's material, then the web, then questions to the user | `sources.md` | `references/1-sources.md` |
| 3 | **Map**: extract ideas, find the big idea, choose, link | first half of `map.md` | `references/2-concept-map.md` |
| 4 | **Path**: order, themes, call-backs | second half of `map.md` | `references/3-path.md` |
| | **Show the map** (do not wait) | the map in the conversation | below |
| 5 | **Activate**: for every concept, what the learner does to understand it | concepts in `course.json` | `references/4-active-learning.md`, `references/5-labs.md`, `references/7-progression.md`, `references/9-prose.md` (how pages, takeaways and notes are written) |
| 6 | **Ask**: questions for remembering and for using | questions in `course.json` | `references/6-questions.md`, `references/9-prose.md` (`why` and traps are expository text) |

Then run `node skills/knowledge-base/scripts/validate.mjs courses/<slug>` until it reports no
errors, and read its warnings.

### Step 1: the brief

**Default: do not ask, decide.** If you know the subject, fill the brief yourself from what the
user wrote and attached, with the defaults below, state your choices in two or three lines, and
go on. Ask (in one message, with a default for each item) only when the user asked to be
consulted, or when the subject itself is unclear. The items of the brief:

- **Subject**, and the **material** the user trusts (files, notes, links). None is acceptable:
  you will work from sources you look up, and list them.
- **Learner**: who, and what they already know.
- **Goals**: two or three things the learner should be able to *do* at the end.
- **Typical mistakes**: what the learner, or people in general, get wrong about this subject.
  This is the most useful thing the user can tell you.
- **Size**: how much content. small (4 to 6 concepts), standard (7 to 10), large (up to 16).
  Default: standard. It says nothing about quality.
- **Care**: how much effort per unit of content: light, standard or curated (table below).
  Default: standard. Size and care are independent: any size can be combined with any care.
  Do not tie the number of lab stations to care, or the reverse.
- **Core**: which concepts make the main story (below). Default: you choose, 4 to 6.
- **Language** of the course.
- **Level**: introductory (default), intermediate or advanced. Independent of size and care: it
  caps how deep the upper floors and the extras go, never how simple the ground floors are. A hard
  subject at the introductory level keeps simple, striking ground floors and moves its difficulty
  upstairs. See `references/7-progression.md` (also for locks: `riddles`).

Write the choices in `brief.md` under "Decisions taken without the user". State in one line
which size, care and level you chose, and that the user can ask for another. If the user mentions
limited credits or wanting it quick, choose care light (size stays what they asked, or standard).

**What each level of care changes.** Accuracy never drops with care: breadth and polish change,
rigour does not. Every fact that reaches the learner is verified at every level.

| | light | standard (default) | curated |
|---|---|---|---|
| Research | focused on the basic concepts; 1 or 2 reference outlines | as in `references/1-sources.md` | more sources and cross-checks |
| Labs | simplest pattern that passes the four tests; no hunt for extra examples or real material | as in `references/5-labs.md` | real open material sought; refined after a first play |
| Experts' homes | none; or `"homes": "auto"` in `world.json` and the engine chooses | a few concepts get an `expert` (trade, name) | experts chosen with care, each with a `line` in their own voice (`references/3-path.md`) |
| Graphics, testing | see `skills/game-build/SKILL.md` | see `skills/game-build/SKILL.md` | see `skills/game-build/SKILL.md` |

### The checkpoint

After step 4, show the user, in the conversation, **and keep working without waiting** (unless
they asked to approve the map first):

1. the big idea;
2. the map as a table: theme, concept, "you will be able to", "in the lab you will" (one line
   each, the last one a first idea, not a design);
3. what you left out and why;
4. anything you could not verify, and any choice that is theirs to make.

If the user answers with changes while you work, apply them: changing the map early is cheap.

## Core and extra

The **core** is the minimum set of key ideas to take home in about one hour of play: it is what
the game's main story requires (visit each core house, do its lab, beat its expert, then the final
check). Every other concept is an **extra**, marked `"core": false` in `course.json`: its house
stays in town for the curious, hinted at but never listed, and the final check does not ask about
it. Any size of course has a core of roughly 4 to 6 concepts; a large course has more extras, not a
bigger core. The core must tell a complete story of the subject on its own, start with the first
concept of the path, and never require an extra. The validator prints the time of the core path
and of everything, and warns when the core is over an hour. Write the choice in `brief.md`
("Core"). Details in `references/3-path.md`.

## Limits

They are what keeps a course in one head. The validator enforces them.

- 1 to 4 themes, 1 to 4 concepts each. More material means a second course, not a bigger one.
- One big idea, 28 words at most. One idea per theme, 18 words. One idea per concept, 28 words.
- 1 to 3 lines to remember per concept.
- 1 to 3 lab stations per concept (a process may have up to 8, one per step). One objective each.
- Every concept is linked to at least one other.

## Rules

- **Accuracy before everything.** Every statement that reaches the learner rests on a source in
  `sources.md` or on the user's material. No gaps filled from a vague memory. Simplifications
  are declared where the learner can see them.
- **Active, in the mind, not in the fingers.** An activity counts only if the learner has to
  predict, decide, generate or explain something. Clicking through is not active learning.
- **The interaction belongs to the concept.** If a lab would work unchanged for another subject,
  it is generic: redesign it.
- **Wrong beliefs drive the design.** Each concept names the belief people hold before. The
  prediction question, the surprise in the lab and the wrong options of the questions all come
  from it.
- **Nothing decorative.** Any element that does not serve a learning goal lowers learning.
- **Say what you left out.** Choosing is the job. Hiding the choice is not.
- **Use the user's own material and examples** wherever they exist, and credit every source.
  Do not copy text or images you have no right to reuse.

## Handing over

When the validator passes, **go straight on to building the game** with
`skills/game-build/SKILL.md`, unless the user asked only for the course design. Keep for the
final message: what is simplified, what is unverified, and the lab designs you are least sure of.
