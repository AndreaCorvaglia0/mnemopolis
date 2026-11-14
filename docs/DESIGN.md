# Game design

The working design of the game around the course: what the player is asked to do, how they know
what comes next, and how they know they have won. The reasons are in the wiki
(`docs/wiki/`, published to the repository's wiki); this file is the specification.

The fiction that carries all this is in `STORY.md` (on by default; `"story": false` in
`world.json` gives the plain town described here): the duel is played as **helping an owner
remember**, the League is a dark **lighthouse** and its champion a **keeper**, the guide is the
harbour master, the ending is the lamp, the register and the loop by ship, and the menu is the notebook. The rules below hold in both.

## One sentence

Understand the key ideas of a subject in about an hour by doing, prove it by helping the town's
people remember (a duel of eloquence in the plain town), and stay as long as you like for what the
town still hides.

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
7. **Two languages, chosen by the course.** Every word a player reads comes in English and
   Italian, picked by `language` in `course.json` (English for anything else); the engine's tables
   are checked by `npm test`.

## The three axes

| Axis | What it is for | In the game | Reward |
|---|---|---|---|
| **Prove** | checking understanding | duels with the experts, then the League | badges, the open road, the ending |
| **Explore** | going beyond the basics | secrets, locked places, upper floors, hidden buildings | advanced material, discoveries |
| **Practise** | memory | many small questions: tall grass, passers-by, rematches; after the ending, the returning fog (`STORY.md`) | coins for the town shop |

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
  set to take home (roughly 4 to 6, whatever the size of the course); only they gate the League,
  and the League asks only about them. If no concept is marked, all are core. The validator
  requires at least three core concepts, the first concept of the path among them, and no core
  concept that `requires` an extra; it prints the time of the core path and of everything (6.5
  minutes per station, 3 per concept, 1.5 per duel, about 20 seconds per League question) and warns
  above 60 minutes. Extra concepts keep their houses and their numbers; they are never listed in
  the Journey and show as "?" on the map once the player has walked near them, and in the mind map
  until visited.
- **Badge.** `state.stamps[id]` (exists): the duel with the host of that house is won. Every
  room's host offers the duel (the workshop's and the museum's too) when the house has at least two
  questions; a house with fewer counts as done when visited with every lab station finished.
- **League.** `state.passedLeague` (exists). Opens when every core house is done. Until then the
  champion, at the town gate, says in one line what is missing ("Two experts still think they know
  better than you: houses 4 and 6."). The League hall on the square has a note on its door that
  sends the player to the gate.
- **Ending.** (In the story the same road ends at a quay where the ship is moored, and the ending is
  the lighthouse, the register and the loop: `STORY.md`. What follows is the plain town.) The road
  out of town is real: a straight lane, two tiles wide, runs from the square to
  the edge of the map and ends in a **town gate**, with the League's champion standing before it.
  The gate is shut until the League is won (walking into it, or talking to the champion, is the
  League: the missing houses while it is closed, the duel once it is open). Beaten, the champion
  steps aside with a line in character and the gate swings open; walking through it opens a short
  ending card: the course title, the big idea, what the player can now do (the course goals that
  the path taught: a goal may name the concepts that teach it, and is then listed only if each is
  core or was done by the player), questions answered, accuracy, time played, and how many things in town are still a question mark (unvisited houses and
  undiscovered secrets, as one count). Then back to the town; the Journey tab reopens the card.
  Walking through the gate again says that the road goes on and the next town is not built yet,
  or, when `world.json` names it (`"next": {"title", "url"}`), offers "On to <title>" (the card
  offers it too). The road is a dead end over open ground: every door keeps exactly its walking
  distance (checked when the town is generated and over hundreds of towns); a town where no side
  of the square has such a way out (about one in five) has no gate, and the champion waits before
  the League hall on the square, where the card opens as soon as the League is won.

## The duel (remembering, in the story)

A skin over questions the course already has; no new content is required. In the story it is
**remembering** (`STORY.md`): the owner's bar is their memory, which fills; the player's is clarity,
which the fog eats; a wrong answer is the owner's false memory. In the plain town it is a duel of
eloquence: conviction and composure. The rules are the same.

- **The learner just answers.** No tone, no bet, no "how sure are you?" anywhere in the game (the
  confidence bet was removed: one tap per question, and nothing to explain that is not the subject).
  A right answer is one piece (the opponent's bar moves by one); a wrong one costs one step of the
  player's bar. After a wrong answer the screen shows the chosen option's `trap` (why it tempts: in
  the story, the false memory the owner clings to) and the right answer with the question's `why`;
  after a right one, the `why`, never "correct" alone.
- **House**: questions of that concept (levels 1 and 2 first, level 3 only to fill), at most six
  turns (fewer if the concept has fewer questions). With n turns, `ceil(0.6 n)` right answers before
  `n − need + 1` wrong ones: six questions, four right before three wrong; five, three before three;
  four, three before two. A remembering is always decided within its turns. Winning gives the badge
  (in the story: a window lights up) and the owner's key. Once won, it becomes a **friendly rematch**
  ("remember together again": levels 2 and 3 first, nothing new to win).
- **League** (the keeper, in the story): `finalCheck.size` turns of levels 2 and 3, one question
  from each core house per round, shuffled; `ceil(size × pass)` right before the remaining slips plus
  one: exactly the pass mark. The house of a question is named only after it is answered.
- **Out of questions**: the fuller bar (as a share of its start) wins; on an exact tie the player
  wins only with at least the pass share right.
- **Losing**: nothing is taken, coins included. The opponent says, in character, which idea to look
  at again: in a house the concept, the reading wall and the lab; in the League the houses of the
  missed questions, by number and name. Rematch draws other questions at once. Step back (Esc)
  leaves at any time.
- **Calibration** is tested by simulation (`engine/tests/duel.test.mjs`, table in
  `engine/docs/ENGINE.md`): with six questions a learner right 70% of the time succeeds three times
  in four and one right 40% of the time fails more than four times in five; at 90% one nearly always
  succeeds; the League is a coin flip at the pass mark and won nine times in ten fifteen points above
  it. Concepts with fewer questions make less decisive rememberings.
- **Tempers.** How an owner resists and gives up the key depends on a temper (smitten, sore loser,
  admirer, insists they let you win, theatrical, absent-minded, proud craftsman), from a registry,
  in English and Italian, chosen by seed or by `expert.temper`; the story has its own lines for each
  (they defend what they misremember, then remember in character). Comic, never mean.

## Explore

Exploring is how the game goes beyond the basics. Its central object is the **lock**.

- **Locks**: a safe, a computer asking for its password, a door that wants the word of the day.
  Using one switches to a **first-person close-up** (the safe's door, the screen with a sticky
  note on its edge, the eyes behind a sliding hatch). The clue is there to be read; the answer is
  **typed freely**, not chosen: a short term or a number that the learner must recall or work
  out. Free recall is harder than recognition, which is why locks belong to exploring and never
  to the main path. Nothing covers the place where the answer shows (the safe's display, the
  login line): the sticky note and the thought after a miss sit beside the keys, and a password
  shows its letters (a game, not a bank: the learner must be able to check the spelling). A
  number that is read off a lab's live value is accepted within one unit, and the lab must let
  the learner land on it exactly (in the example, one-degree buttons beside the colour disc).
  - A wrong answer costs nothing. The character thinks aloud where to look ("Hm. I should go back
    to the Dyer's House."): the lock knows which concept, and which part of it, holds the answer.
    Repeated misses make the thought more specific (the first two name the house, or "downstairs"
    when it is taught in the same house; from the third, the reading wall or the lab station by its
    name), never the answer itself.
  - Locks stand upstairs (the default) or on the ground floor of their house (`"where": "room"`).
    A lock is a key object: a padlock with a question mark shows above it while it is shut and the
    player is near; once open it stays open and shows its content again.
  - Behind a lock is **secret knowledge**: an advanced lab station, a short document, a `further`
    link, and sometimes a tool, coins or a key to an upper floor. Rewards are granted once. A
    station behind a lock is reached only through it; the opened notes are listed in the
    discoveries.
  - In the course a lock is a `riddle` on a concept: kind, clue, accepted answers (text
    normalised for case, accents, articles and one typo; numbers with a tolerance; codes exact),
    where the answer is taught, and what is inside. Answers are at most three words or one number.
- **Keys** come from owners, by winning their duel. A key opens that house's **upper floor**: a
  second room with the advanced side of the concept: stations marked `"advanced": true` (at a bench
  labelled LAB II, unless a lock guards them), its locks, its `further` links on a shelf, and later
  a harder rematch. Nobody lives upstairs. A house gets a staircase only if its concept has
  something for upstairs, and only rooms have floors (not the workshop, not the museum). Advanced
  stations never count in the main path's "lab n/m". Upstairs must not pass for downstairs: it is
  dimmer and warmer (a lamp hangs from the beam, a pool of light under it), and the plaque reads
  "UPSTAIRS - <concept>" in gold on dark wood. A small locked closet (an obstacle for a later
  tool) goes on a ground floor where a tidy wall is left, otherwise under the roof.
- **Tools** come from the shop, for coins. A tool opens a kind of obstacle (exists:
  `mechanics/obstacles`, `canPass`, `state.tools`).
- **Hidden buildings**: an extra concept may stand behind an obstacle (`world.json`).
- The discoveries page lists what is found; what is not found is a silhouette.

## Progression of difficulty

The game never opens at the full depth of the subject. Depth is reached by climbing.

| Where | Depth | Rule |
|---|---|---|
| Ground floor of a core house | the essential idea | 1 to 3 stations: first *see it* (one control, one surprise), then *the rule* (a comparison or a second control), then *use it elsewhere*. Basic, but with a picture and an interaction strong enough to be remembered |
| The duel with the host | recognise and apply | levels 1 and 2 |
| Upper floor (key) | the complication | the exception, the quantity, the second-order effect; one advanced station; locks |
| Extra and hidden buildings | neighbouring ideas | what an expert would add |
| Locks | recall and work out | free answers |

- One new idea per station. Later houses may assume earlier ones; the first house assumes nothing.
- The brief sets a **level** for the whole course, independent of size and care: *introductory*
  (default), *intermediate*, *advanced*. It caps how far the upper floors and the extras go. A
  hard subject at the introductory level still gets simple ground floors: the difficulty is moved
  upstairs, not removed from the picture.
- How many locks: none at care *light*, about one per two houses at *standard*, up to one per
  house at *curated*. The method is in `skills/knowledge-base/references/7-progression.md`.

## Practise

- One currency. The existing score becomes **coins**: earned by answering (tall grass, passers-by,
  duels), with the level of a question as its difficulty and its worth: 10 coins per level for a
  right answer, nothing lost for a wrong one.
- **Shop** in the square: tools (key ring excluded: keys are earned), and small comforts
  (a lantern, a map of footprints). Prices are tuned so that the first tool costs about ten
  good answers.
- Questions prefer what was never seen, then what was answered wrong, then the oldest (exists).

## Guidance

One pure function, `nextStep(state, { inside })` (`engine/src/mechanics/quest/model.js`), is the
single source for every hint. Its steps: intro, then for each core house visit, lab (n/m), duel;
then league, ending, and free roaming after the ending.

- the **tracker**, top right in the town and in rooms, under the place name: one line, e.g.
  "Next: house 3 · Painter's House" / "Do the lab (1/2)" (inside the house) / "House 4: duel Bruno"
  / "The League is open" / after the ending a quiet "Free roaming". It lights up briefly when the
  step changes; a tap on it opens the Map. It replaces the column of key hints: one discreet
  "Tab  Menu" stays (a Menu button on touch);
- a small gold chevron bobbing above the door of the house the tracker names, or above the town
  gate for the League and the ending (nothing for a place off screen);
- the guide's first speech (the goal in three lines, then the first house and its landmark); every
  townsperson's answer to "What should I do now?", sometimes followed by a hint that the town holds
  more, never naming it; the character's thoughts (one in four or five); the "next" tag of the mind
  map;
- the **menu** (Tab, the Menu button), one screen with three tabs (1 2 3 or the arrows):
  - **Journey** (the default until the ending): the goal in two lines, the main path as a checklist
    (one row per core house: visited, lab n/m, duel or badge; the current one with the tracker's
    sentence), the League (locked, open, won), and one line that something else is out there;
  - **Map**: the town drawn from its own data as explored so far (visited houses in their district's
    colour, core houses not visited by number, extras "?" once seen, the League hall, the square,
    the player; a tap on a visited house recalls its idea; the next house ringed), with the mind map
    of the course one tap away;
  - **Mysteries**: coins, keys (of houses with an upstairs) and tools carried, the discoveries
    (J opens this tab) and the opened locks (listed even when ambient life is switched off). Never a
    list of what is missing beyond the silhouettes of the discoveries.
  Settings (music, voice, grass questions, time of day) sit in the menu's footer as plain toggles,
  with the keys (folded behind one button on a phone).

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
| `seen[id]` | house walked near (the map shows it) | new |
| `played` | seconds played (the ending card) | new |
| `cheered[id]` | townsperson who congratulated after the ending | new |
| `locks[id]` | lock opened; `tries[id]` counts misses | exists |

## Where the code goes

| Part | Place |
|---|---|
| Core/extra, `nextStep`, journey data | `engine/src/mechanics/quest/` |
| Tracker, menu, ending card | `engine/src/mechanics/quest/` (`menu.js`, `townmap.js`, `ending.js`, `strings.js`) + the HUD in `scenes/UI.js`, the mark, people and the League hall in `scenes/Town.js`, the mind map in `lab/map.js` |
| Duel rules (pure), duel screen, tempers | `engine/src/mechanics/duel/` |
| Locks (answer matching, close-ups), upper floors | `engine/src/mechanics/riddles/`, `engine/src/mechanics/floors/` |
| Shop, coins | `engine/src/mechanics/shop/` |

## Order of work

1. **Spine**: core/extra, `nextStep`, tracker, menu, gating of the League, ending.
2. **Duel**: house duels and the League as duels, feedback from traps, tempers, keys handed over.
3. **Locks and floors**: riddles with free answers in first person, upper floors opened by keys,
   advanced stations, the progression of difficulty in the course method.
4. **Shop**: coins spent on tools, tools opening obstacles, hidden buildings.
5. Ambient, mysterious music that follows place and time; a second example course in Italian.

## Alternatives considered

| Question | Chosen | Left out, and why |
|---|---|---|
| Final exam | duel with bars | a plain scored quiz (no stakes, no visible tolerance); a card battle with items (heavy, hides the questions) |
| Confidence | the learner just answers | a bet on how sure one is (a tone in the duel, three buttons in the grass): one more decision per question, and a thing to explain that is not the subject; removed |
| Cost of losing | none, plus feedback | losing coins or a waiting time (punishes the errors that teach) |
| What gates the League | core concepts only | every concept (too long for one sitting) |
| Currencies | one | score plus coins (two numbers to explain) |
| Keys | earned in duels | bought (advanced material should follow shown understanding) |
| Guidance | text tracker, house numbers, people, thoughts | arrows and markers on the ground (turn the town into a corridor) |
| Extras | hinted, never listed | a second checklist (kills the mystery) |
