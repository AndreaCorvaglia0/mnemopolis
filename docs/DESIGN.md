# Game design

The working design of the game around the course: what the player is asked to do, how they know
what comes next, and how they know they have won. The reasons are in the wiki
(`docs/wiki/`, published to the repository's wiki); this file is the specification.

## One sentence

Understand the key ideas of a subject in about an hour by doing, prove it in a duel of
eloquence, and stay as long as you like for what the town still hides.

## Principles

1. **Understanding comes before memory.** Labs first, questions after. No question is asked
   about a house the player has not visited.
2. **The basic path is explicit, the rest is a mystery.** A newcomer always sees the next step of
   the main story. Nothing ever lists the extras: they are hinted at, glimpsed, stumbled on.
3. **Mistakes cost nothing but a turn.** Losing a duel loses no coins and no progress. It returns
   feedback (why the answer was wrong, where to look) and a rematch.
4. **Light and ironic.** The fiction pokes fun at debating, never at the learner.
5. **Reuse before adding.** Every new dynamic must hang on something that already exists.
6. **Everything optional is switchable** in `world.json`, and the course format stays about
   knowledge, not about the game.

## The three axes

| Axis | What it is for | In the game | Reward |
|---|---|---|---|
| **Prove** | checking understanding | duels with the experts, then the League | badges, the open road, the ending |
| **Explore** | going beyond the basics | secrets, locked places, upper floors, hidden buildings | advanced material, discoveries |
| **Practise** | memory | many small questions: tall grass, passers-by, rematches | coins for the town shop |

The axes feed each other: practice earns coins, coins buy tools, tools open places (Explore);
winning a duel earns the owner's key to the upper floor (Explore); what is found upstairs makes
harder duels winnable (Prove).

## Main story (about an hour)

```
arrive -> guide explains the goal in three lines
for each CORE house, in the order of the house numbers:
    enter -> do the lab stations (understand) -> duel the host (prove) -> badge + key
all core badges -> the League opens -> win -> the road out of town opens -> ending
afterwards: the town stays open for exploring and practising, without limit
```

- **Core and extra concepts.** A concept may carry `"core": false`. Core concepts are the minimum
  set to take home; only they gate the League. If no concept is marked, all are core. The
  validator estimates the time of the core path and warns above 60 minutes. Extra concepts keep
  their houses; they are never listed in the Journey and show as "?" on the map until visited.
- **Badge.** `state.stamps[id]` (exists): the duel with the host of that house is won.
- **League.** `state.passedLeague` (exists). Opens when every core concept has its badge.
- **Ending.** The League's champion blocks the road to the next town. Beaten, they step aside:
  a short ending card (the big idea, what the player can now do, accuracy, time, what is still
  hidden as a count of "?"), then back to the town. `world.json` may name the next town
  (`"next": {"title", "url"}`).

## The duel of eloquence

A skin over questions the course already has; no new content is required.

- Two bars: the opponent's **conviction**, the player's **composure**.
- Each turn is one question. Before answering the player picks a **tone** (the existing
  confidence bet): *murmur*, *state*, *proclaim*. A right answer lands an argument (1, 2 or 3);
  a wrong one costs composure (more with a bolder tone) and the opponent's rebuttal explains the
  mistake with the `trap` of the chosen option.
- **House duel**: questions of that concept (levels 1 and 2), short (3 to 6 turns), tolerant of
  about two slips. Winning gives the badge and the owner's key.
- **League**: `finalCheck.size` turns across all core concepts in rounds by district;
  the tolerance is derived from `finalCheck.pass`.
- **Losing**: nothing is taken. The opponent says, in character, which idea to look at again; the
  reading wall and the lab are one step away; a rematch draws other questions.
- **Calibration** is tested by simulation: a learner right 70% of the time usually wins a house
  duel; one right 40% of the time usually loses; no duel exceeds six turns.
- **Tempers.** How an owner gives up the key depends on a temper (smitten, sore loser, admirer,
  pretends to have let you win, theatrical, absent-minded...), from a registry, in English and
  Italian, chosen by seed or by `expert.temper`. Comic, never mean.

## Explore

- **Keys** come from owners, by winning their duel. A key opens that house's **upper floor**: a
  small second room with the advanced side of the concept (its `further` links, level 3
  questions as a harder rematch, an extra station when the course marks one `"advanced": true`,
  and one secret).
- **Tools** come from the shop, for coins. A tool opens a kind of obstacle (exists:
  `mechanics/obstacles`, `canPass`, `state.tools`).
- **Hidden buildings**: an extra concept may stand behind an obstacle (`world.json`).
- The discoveries page lists what is found; what is not found is a silhouette.

## Practise

- One currency. The existing score becomes **coins**: earned by answering (tall grass, passers-by,
  duels), with the level of a question as its difficulty and its worth.
- **Shop** in the square: tools (key ring excluded: keys are earned), and small comforts
  (a lantern, a map of footprints). Prices are tuned so that the first tool costs about ten
  good answers.
- Questions prefer what was never seen, then what was answered wrong, then the oldest (exists).

## Guidance

One pure function, `nextStep(state, course)`, is the single source for every hint:

- the **tracker**, top right in the town: one line, e.g. "Next: house 3, the Painter's House" /
  "Talk to Marta" / "Duel Bruno" / "The League is open";
- the character's thoughts (one in four or five), what passers-by say, the "next" mark on the map;
- the **menu**, one screen with three tabs:
  - **Journey**: the goal in two lines, the main path as a checklist (house: visited, lab n/m,
    duel won), the League, and one line that something else is out there;
  - **Map**: the town as explored so far (visited houses numbered, unknown places "?"), with the
    mind map of the course one tap away;
  - **Mysteries**: discoveries, keys and tools carried. Never a list of what is missing.
  Settings (music, voice, grass questions) sit in the menu's footer.

## State (the contract between modules)

| Field | Meaning | Status |
|---|---|---|
| `visited[id]`, `done['id:i']` | house entered, station finished | exists |
| `stamps[id]` | house duel won (badge) | exists, new meaning |
| `passedLeague` | League won | exists |
| `insight` | coins | exists, shown as coins |
| `keys[id]` | key of that house's upper floor | new |
| `tools[name]`, `opened[id]` | tools carried, obstacles opened | exists |
| `life.found`, `life.prints` | discoveries | exists |
| `ended` | ending card seen | new |

## Where the code goes

| Part | Place |
|---|---|
| Core/extra, `nextStep`, journey data | `engine/src/mechanics/quest/` |
| Tracker, menu | `engine/src/mechanics/quest/` + hooks in `scenes/UI.js`, `lab/map.js` |
| Duel rules (pure), duel screen, tempers | `engine/src/mechanics/duel/` |
| Shop, coins, upper floors | `engine/src/mechanics/shop/`, `engine/src/mechanics/floors/` |

## Order of work

1. **Spine**: core/extra, `nextStep`, tracker, menu, gating of the League, ending.
2. **Duel**: house duels and the League as duels, feedback from traps, tempers, keys handed over.
3. **Beyond**: coins and shop, tools opening obstacles, upper floors, hidden buildings.
4. Ambient, mysterious music that follows place and time; a second example course in Italian.

## Alternatives considered

| Question | Chosen | Left out, and why |
|---|---|---|
| Final exam | duel with bars | a plain scored quiz (no stakes, no visible tolerance); a card battle with items (heavy, hides the questions) |
| Cost of losing | none, plus feedback | losing coins or a waiting time (punishes the errors that teach) |
| What gates the League | core concepts only | every concept (too long for one sitting) |
| Currencies | one | score plus coins (two numbers to explain) |
| Keys | earned in duels | bought (advanced material should follow shown understanding) |
| Guidance | text tracker, house numbers, people, thoughts | arrows and markers on the ground (turn the town into a corridor) |
| Extras | hinted, never listed | a second checklist (kills the mystery) |
