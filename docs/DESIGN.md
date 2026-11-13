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
- Each turn is one question. With it the player picks a **tone** (the existing confidence bet):
  *murmur*, *state*, *proclaim*, preselected at *state* every turn so that one tap on an answer
  commits both. A right answer lands an argument (1, 2 or 3); a wrong one costs composure
  (1, 2 or 4) and the opponent's rebuttal explains the mistake with the `trap` of the chosen option
  and the question's `why`. A right answer is followed by its `why`, never by "correct" alone.
- **House duel**: questions of that concept (levels 1 and 2 first, level 3 only to fill), at
  most six turns (fewer if the concept has fewer questions); conviction 7, composure 5: with every
  answer stated, three right before three wrong. Winning gives the badge and the owner's key.
  Once won, the duel becomes a **friendly rematch** (levels 2 and 3 first, nothing new to win).
- **League**: `finalCheck.size` turns of levels 2 and 3, one question from each house per round,
  shuffled; conviction `2 × ceil(size × pass)`, composure `2 × (size − need) + 1`, so that with
  every answer stated the duel is won exactly at the pass mark. The house of a question is named
  only after it is answered.
- **Out of questions**: the fuller bar (as a share of its start) wins; on an exact tie the player
  wins only with at least the pass share right (2/3 in a house).
- **Losing**: nothing is taken, coins included (a wrong answer in a duel costs composure, not
  coins). The opponent says, in character, which idea to look at again: in a house the concept,
  the reading wall and the lab; in the League the houses of the missed questions, by number and
  name. Rematch draws other questions at once. Step back (Esc) leaves at any time.
- **Calibration** is tested by simulation (`engine/tests/duel.test.mjs`, table in
  `engine/docs/ENGINE.md`): with six questions a learner right 70% of the time wins about three
  duels in four and one right 40% of the time loses more than four in five; at 90% one nearly
  always wins; always proclaiming does worse than a calibrated tone; the League is a coin flip
  at the pass mark and won nine times in ten fifteen points above it. Concepts with fewer
  questions make less decisive duels.
- **Tempers.** How an owner duels and gives up the key depends on a temper (smitten, sore loser,
  admirer, insists they let you win, theatrical, absent-minded, proud craftsman), from a
  registry, in English and Italian, chosen by seed or by `expert.temper`. The League's champion
  is grander and steps aside when beaten. Comic, never mean.

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
