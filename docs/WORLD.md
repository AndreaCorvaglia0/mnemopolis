# The world branch: a study aid that builds its own towns (plan)

Status: **chosen as the next line of work (14 Nov 2026); nothing built yet.** Compartments and phases below. This page fixes the idea and the order of work. The catalogue
(`docs/SITE.md`) and the full method (`skills/`) stay as they are; this is a second way to use the
same engine.

## Two products on one engine

| | Catalogue | World |
|---|---|---|
| What | Finished courses, playable at once | A world the learner's family or teacher grows, town by town |
| Who makes a town | An author with an agent, in this repo (could become community-driven: a course is a folder and a pull request) | The person who opens the artifact, from inside the game |
| Where it runs | Anywhere (a web page) | Inside a Claude artifact; building needs a Claude subscription and uses the builder's own usage |
| Size | About an hour, 6 to 8 houses, upper floors | Really small: 2 or 3 houses, one floor, 10 to 15 minutes |
| Audience | Adults and students | Children: a hard topic from school made clear, then checked |
| Labs | Designed one by one | Ready-made patterns first; made to measure when the trial below allows it |
| Look | Per course (theme, emblems, experts' homes) | Fixed, varied only by the engine's generators; the model never spends a token on it |

## The world, as the player meets it

1. **Starting it.** One artifact, published once (by the owner of this repo, or by anyone from the
   repo with one command: to be decided). Opening it shows an empty sea chart and a ship.
2. **Building a town.** From inside the game, a short conversation: what are you studying (a
   description, photos of the book or the notebook, documents), for what age, for when. The game
   asks a few questions back (what is hard, what the teacher insists on). Then it builds.
3. **Playing it.** A small town: few key concepts, each a house with one lab that makes the hard
   idea visible, then memory questions. Finished in one sitting.
4. **The world view.** A sea chart with the towns as islands joined by routes. The ship is the way
   between them; a finished town shows its seal; "build the next town" is always a place on the
   chart. One notebook and one tally of points for the whole world.

## What the model does, and what it never does

The model is asked only for what needs judgement:

- reading the material and choosing the few key concepts, in an order that builds;
- the short theory of each (the prose register of `references/9-prose.md`, at a child's level);
- one lab per concept: first choosing and filling a ready-made pattern, later writing one to measure;
- the memory questions with their traps, and the checks that the idea was understood.

Everything else is the engine's and costs no tokens: the town, the houses, the rooms, the people,
the music, the points, the fights, the chart. This is pocket mode (`docs/POCKET.md`) taken to its end.

**The builder's loop inside the page.** The page gives the model tools it can call while it works:
validate the town; run a lab and report errors; play a lab's tasks and say whether they can be
completed; later, a picture of the running lab to judge. The same loop an agent runs in this repo,
in small. The method (the lab author's card, the kit's functions, two good examples) travels as
text inside the artifact: the repo is not needed at run time.

**An adult looks first.** Before a town opens to a child, the builder sees a one-page summary
(concepts, the statements the questions treat as true) and approves or corrects it. The validator
checks shape, not facts.

## The children's register

A different climate from the catalogue's story (the rain, the forgetting, the bitter loop), which
does not suit a nine-year-old doing homework:

- **Fights, plainly.** Questions are friendly battles with a visible opponent, bars and a clear win.
- **Points and a very clear progression.** Always visible: where I am, what is next, how much is
  left; stars per house, a seal per town, a tally for the world.
- **Short everything.** Sentences, labs, sessions. Read aloud available everywhere.
- **Mistakes are cheap.** A miss explains and comes back later; nothing is lost.
- **Checking memory and understanding separately.** Recall questions (did it stay?) and one
  "explain it or use it" task per concept (did it land?), with a small report the adult can read.

To decide when designing: whether the children's register is a `world.json` profile of the same
game (story off, new strings, new duel skin) or a separate set of mechanics. First guess: a profile.

## Where it lives: a branch of the project, in the same repository

One repository, two products, one shared engine:

```
engine/     the game engine, shared
skills/     the method for catalogue courses
courses/    catalogue courses, curated by the owner (Chroma Town, Port Octave, ...)
world/      the children's world: one more entry of the catalogue, but alive
  format/   what a small town is, its validator
  towns/    towns made by hand (the golden examples and fixtures)
  builder/  the builder that runs inside the artifact
  app/      the artifact page
  docs/     its own plan, design pages, results of the trials
spikes/     throw-away technical trials
```

- **Not a fork.** A fork copies the engine, and from that day every fix must be made twice; the
  two games would drift apart within weeks.
- **Not a long-lived git branch** either: it rots against `main`. Work happens in short branches
  merged into `main`; the separation is by folder and by a switch, not by history.
- **Separate where it counts**: `world/` has its own docs, roadmap, tests and CI job; nothing
  under `courses/` or `skills/` depends on it; what it needs from the engine (the children's
  profile, the chart, the store) sits in the engine behind `profile: "kids"`, off for every
  catalogue course.
- **A door left open**: if `world/` grows into its own product, it can be moved to its own
  repository that takes the engine as a dependency. The folder boundary above is what makes that
  a move and not a rewrite. Not before the engine's interface has stopped changing.
- On the site, the world appears in the catalogue as one card ("build your own islands"), which
  opens the artifact instead of a game.

## Compartments (who knows what)

Seven parts, each with one job and a written contract. The rule that keeps it from becoming one
lump: **the builder and the engine never import each other; they meet only in the town format.**

| Part | Job | Knows about | Lives in |
|---|---|---|---|
| 1. Town format | What a small town is: a strict subset of `course.json`, its schema, the validator's "kids" rules | nothing else | `world/format/` |
| 2. Player | Plays one town | the format | `engine/` (as today) |
| 3. Children's profile | Companion, friendly fights, points, the progression always on screen; the catalogue's story off | the player's state contract | `engine/src/mechanics/kids/`, switched by `world.json` (`profile: "kids"`) |
| 4. World | The sea chart, routes, changing town, what is shared between towns (companion, coins, seals, the fog coming back) | player, store | `engine/src/atlas/` |
| 5. Store | Save and load towns and progress, behind one interface | nothing else | `engine/src/store/`: one implementation on the browser's storage (development, public player), one on the artifact's store |
| 6. Builder | The conversation, the prompts, the model's tools, the adult's check; gives back a town that passes the validator | the format, the validator, the catalogue of lab patterns; the model only through an `ask()` interface with two implementations (the artifact's, and a recorded one for tests) | `world/builder/` (its own tests, not part of the engine) |
| 7. Artifact shell | Wires builder, store and player; declares what the page may do | everything; as thin as possible | `world/app/` |

Consequences: the player and the world can be built and tested with hand-made towns and the
browser's storage, with no model and no artifact; the builder can be tested with recorded answers
and no game; only the shell needs the real artifact. The catalogue's courses never see any of it
(the profile is a switch; CI keeps playing Chroma Town to the end on every change).

## Technical trials needed before a real plan

One throw-away test page published as an artifact. The owner opens it on his phone and presses
"run": the trials need a real viewer (consent, the model call on the viewer's account, the
phone). Results are written to the page's store, where they can be read back and copied here.

| # | Question | How | It decides |
|---|---|---|---|
| T1 | Can the page run code written on the spot? | Three ways of loading a generated module (blob import, data address, an inner frame) | Labs made to measure, or patterns only |
| T2 | What does a call to the model allow? | A town-sized answer as JSON: time, where it is cut, the tiers, tools called by the model, a photo as input (size, how many) | The shape of the builder's loop, how much goes in one call |
| T3 | How reliable and how dear is one town? | Ten builds of a three-house town with patterns: calls, time, how many pass the validator at once and after one repair | Whether "economical" holds; the builder's budget |
| T4 | What can the store hold? | Sizes and counts; private data per person; reading again on another device | Where towns and progress live; photos kept or not |
| T5 | Does the game run well inside the artifact on a phone? | The real engine in the page: weight, start time, sound, touch, full screen, changing town without a reload | Whether the player goes in as it is |
| T6 | Who can use one published artifact? | A second account opens the same page: is its world private, whose usage pays for building | How a new family starts: one shared page, or a copy each |
| T7 | Can a finished town be played with no account? | Export a town and open it in the public player | The child's own device |
| T8 | Is the content good enough? | Three school topics built and read against the golden town | Needs phase 1 first; the only trial that is about quality, not plumbing |

T1 to T7 fit in one page and one evening of the owner's phone; T8 comes after the golden town.

## Phases (each ends with something the owner plays or uses)

| Phase | Work | Done when |
|---|---|---|
| 0. Trials | The test page in `spikes/`, never merged into the engine: T1 to T7 above | The answers are written in `world/docs/`, and this plan is revised on them |
| 1. The golden town | The town format and its rules; one children's town made by hand (the target the builder must hit later), played with the engine as it is | The owner plays it on a phone; the format is frozen |
| 2. The children's profile | Companion, fights, points, progression; simulated children and parents (small models) on screenshots | The same town reads as a children's game; the design page for the fiction is approved first |
| 3. World and store | A second hand-made town; the chart, the ship between islands, shared progress, the fog coming back (spaced repetition); browser storage | The owner sails between two islands and finds his progress the next day |
| 4. Builder | Conversation, prompts, tools, the adult's check; patterns only; first with recorded answers, then the real model | A town built from a photo of a school book passes the validator and is worth playing |
| 5. The artifact | The shell, the artifact's store, starting a world from nothing, export for the public player if the trial allows | A new person opens the artifact and gets a first island without help |
| 6. Beyond | Labs made to measure (if the trial said yes), more patterns, sharing towns | separately planned |

Rules of work for every phase: a short design page approved before code (`docs/world/<n>-<name>.md`);
one theme per phase; at most two agents at once, each owning its folders; the contracts above
change only by editing this page first; a phase is not closed until its "done when" is met on a
real phone.

## Decided with the owner (14 Nov 2026)

- **Age: 8 to 10.**
- **Who uses it: the adult.** A Claude account is for adults only (18+, by Anthropic's terms),
  so the artifact is opened and the towns are built on an adult's account, with the child beside
  them. Whether a finished town can also be played without an account (exported as a stand-alone
  file for the public player, `/play/`: a built town calls no model) is a question for the trial.
- **Because the adult may not read everything**, the builder must lean on the material given
  (photos, documents) rather than on what the model remembers, show where each statement comes
  from, keep the adult's one-page summary, and give the child a "this seems wrong" button on
  every question.
- **The children's world needs its own fiction**, coherent across many islands; the catalogue's
  story (rain, forgetting, the bitter loop) is not reused.

## The common dynamic: points, a villain, islands set free (first draft)

Decided by the owner: the game is about earning points, beating the villain and freeing the
islands, and growing as you go. Whether a companion evolves is left for later; the points come first.

- **Each island is held by a villain** who keeps it in fog. Each house is one key concept.
- **Three ways to earn**, matching what the adult wants to know:
  - *understand*: finish a house's lab, one to three stars by how it went;
  - *remember*: answer the house's questions, points for each, more for a run without a miss;
  - *come back*: a short review on an island already freed, some days later, pays again (less).
- **The villain's bar is the island's progress.** Every house cleared takes a visible piece off
  it. With all houses done, the last fight is the island's final check: win, and the island is
  free (lights on, a seal on the chart).
- **Growing.** Points add up to a level for the whole world; levels open what is next on the
  chart (routes, a place to build a new island) and things that show (the ship, the flag).
- **The fog comes back.** A freed island slowly greys on the chart; a short review keeps it free.
  This is spaced repetition as the game's own rule.
- **Nothing is ever taken away.** A wrong answer explains and returns later; at most the villain
  gets a little of his bar back.
- One currency to start with (points and stars). Coins and a shop only if the game needs them.

To settle in the design page of phase 2: the numbers, who the villain is, companion or not.

## Open questions for the owner

- Fights or not: the proposal above says yes, mild. To confirm after seeing one on screen.
- Italian first, with English as the second language, or both from the start?
