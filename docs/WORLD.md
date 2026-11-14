# The world branch: a study aid that builds its own towns (plan)

Status: **planned, nothing built**. This page fixes the idea and the order of work. The catalogue
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

## Architecture (first sketch)

- **Town** = a small `course.json` (the existing format, a strict subset) plus optional lab code.
- **World** = a list of towns with their order and routes, per-player progress, one notebook.
- **Storage** = the artifact's own store: towns private to their builder by default; sharing a
  town with others (a class, a sibling) as a later, explicit choice. Playing a town already built
  costs nothing.
- **Engine** = the prebuilt player, extended to switch town without a reload and to draw the chart.
- **Builder** = a module of the page: the conversation, the calls to the model with tools, the
  adult's check, the save.

## Unknowns to try first (a small technical trial)

1. Does an artifact let the page run code generated on the spot (a lab made to measure)? If not,
   the world keeps to ready-made patterns, and their catalogue must grow.
2. How long, and how much usage, does one town take with patterns only, and with one lab to measure?
3. Is the store enough for towns with photos and lab code (sizes, limits)?
4. Does the game run well inside the artifact viewer on a phone (sound, touch, full screen)?

## Order of work

1. The trial above; write down the answers here.
2. One children's town built by hand in the small format (the target the builder must hit), with
   the children's register as a profile.
3. The builder inside the page, patterns only; the adult's check.
4. The world: chart, routes, switching town, one notebook and tally.
5. Labs to measure, if the trial allows; more patterns in any case.
6. Sharing towns; the catalogue open to contributed courses (rules for a pull request, review).

## Decided with the owner (14 Nov 2026)

- **Age: 8 to 10.**
- **Who builds: child and parent together.** The owner would also like the child alone, with the
  model answerable for the material. Constraint: a Claude account is for adults only (18+, by
  Anthropic's terms), so building always happens on an adult's account and the adult is the one
  who answers for it. What remains open is *playing* without an account: a town already built
  calls no model, so it could be exported as a stand-alone file for the public player (`/play/`).
  To check in the trial.
- **Because the adult may not read everything**, the builder must lean on the material given
  (photos, documents) rather than on what the model remembers, show where each statement comes
  from, keep the adult's one-page summary, and give the child a "this seems wrong" button on
  every question.
- **The children's world needs its own fiction**, coherent across many islands; the catalogue's
  story (rain, forgetting, the bitter loop) is not reused.

## The common dynamic across islands (proposal, not approved)

One thing that grows with the child and travels on the ship from island to island:

- **A companion** that the child raises. It gains levels from what the child understands (labs)
  and remembers (questions); each island gives it one new ability tied to that island's topic.
- **Challenges as friendly fights.** Each house is kept by a small creature of the fog (what is
  not yet understood); the companion's moves are the child's answers. Nobody is hurt: a beaten
  creature clears up and stays in the house as a friend. The island's last check is its keeper.
- **Coming back matters.** On islands already cleared, the fog creeps back after some days and
  the creatures return a little stronger: this is spaced repetition, dressed as the game's own
  rule, and it is where most of the memory work happens.
- **Coins** from repetition, spent on things that show (the companion's looks, the ship, the
  island's lights) and on tools that open small secret places. Levels come only from learning,
  never from spending.
- **A very clear progression**: stars per house, a seal per island, the companion's level, the
  chart filling in.

The link with the catalogue is light: the fog of forgetting is the same idea, told for children.
All of this is the engine's (creatures drawn by the generators, fixed rules): no tokens.

## Open questions for the owner

- Fights or not: the proposal above says yes, mild. To confirm after seeing one on screen.
- Italian first, with English as the second language, or both from the start?
