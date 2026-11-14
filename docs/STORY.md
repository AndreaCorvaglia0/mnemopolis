# The story

The fiction that carries the main path. It belongs to the engine, not to a course: the same story
frames any subject. Status: agreed design, first version built (how, in `engine/docs/ENGINE.md`,
"The story"); on by default, `"story": false` in `world.json` gives the plain town. It refines
`DESIGN.md` (which keeps the rules); where the two differ, this file is the newer intent.

## In one paragraph

You arrive at night, in heavy rain, on an old steamship with two great funnels. The town is odd:
its people are curt and confused, because they have forgotten what they know. On the quay you
find a soaked notebook with most of its pages gone. House by house you set their things working
again and help each owner remember; each of them, remembering, lets you upstairs, where you find
something that should not be there: a page in a familiar hand, a black and white family
photograph, a visiting card. The dark lighthouse that you have seen since the first minute turns
out to be where it all leads. At the top the keeper lights the lamp and shows you the arrivals
register: your name, in your hand, down the whole page, years back. What you were looking for was
never here; it came with you, on the ship. You walk back to the quay, tear out the pages, let the
cover fall where you found it, and board. The ship's lights go out; the rain begins again; the last
shot is the first. The town is your memory, and you keep coming back to it.

## Tone

Melancholy outside, wit in the people. The rain and the music carry the sadness; the owners carry
the comedy (one falls for you once they remember, one insists they never forgot anything, one is
offended to have been helped). Never grim, never mocking the learner.

## Beats

| # | Beat | What the player sees | What it is for |
|---|---|---|---|
| 1 | Arrival | A short scene: rain, the ship docking, its lights going out. It stays at the quay, at the end of the road out of town, in every town. A purser asks your name for the register (optional, kept on the device) | The name is used later. The ship in view is the way out |
| 2 | The cold town | People answer briefly and do not help. Windows are dark | A gap to close: what happened here? |
| 3 | The notebook | Found on the quay, tally marks scratched on its cover. One legible line points to house 1. It becomes the whole menu (below); the tracker is the short form of its latest entry | The guide, in fiction |
| 4 | Remembering | In a house: the lab sets their instruments working again; then you help the owner remember | Replaces the duel (see below) |
| 5 | Mementos | Upstairs in each core house, one object of yours: never explained, each a little more personal | The mystery turns from "what happened to them" to "who was here" |
| 6 | The town warms | With each house: a window lit, people a little kinder, the music a little fuller | Progress you can see and hear |
| 7 | The lighthouse | Unmarked, in plain sight from the start, dark: it stands where the League hall stood, on the square. The pages together say where to go and what to say at its door | The League, hidden in plain sight |
| 8 | The keeper | At the top, hooded, the one who keeps the forgetting. The final test, on everything. The keeper stays hooded: you never see a face, yours or another | The exam |
| 9 | The register | The keeper lights the lamp: "What you are looking for was never here." "It came with you, on the ship." On the desk the arrivals register lies open: the same name, yours, signed down the page, the dates going back, the last line empty. One line: "That is my signature." | Change of frame: the town is a memory palace, yours, and you have been here before |
| 10 | The loop | The town lit, the rain stopped; people say goodbye as to someone they have seen leave before; the harbour master: "Same berth as always." On the quay you tear the pages out (they scatter nearby; someone will pick them up), drop the cover where you found it, one more tally mark on it. The purser: "Another round, <name>?" You board; the lights go out as at the arrival; the rain begins again; the last shot is the first shot, with the first caption. The title, then the ending card | The loop closes. Bitter for now; to be revisited (see "Endings (planned)") |

## Cinematic moments

A few moments are staged, briefly, like film: black bars slide in at the top and bottom, the HUD
hides, the camera moves by itself, one line of text at a time, and a short theme plays. Each lasts
seconds, can be skipped with a tap, and returns control at once.

| Moment | Staging |
|---|---|
| Opening | The ship in the rain, the gangway, the lights going out; two or three lines of context |
| The notebook | The camera closes on the quay; the cover with its tally marks; the first legible line |
| Each memento | The close-up, a held note of the theme, the page restoring itself |
| The town remembering | A window lighting, seen from above, after each house |
| The lighthouse understood | The camera lifts to the dark tower when the last page is read |
| The lamp | The lamp room, the keeper hooded, the lamp lit; the register; "That is my signature." |
| The loop | The pages on the quay, the cover, the purser at the gangway, the lights out, the first shot again |

The theme is one melody of the course's key, the only tune in the game, built on the motif that
already marks discoveries; it is heard in fragments at the mementos and the windows, a longer phrase
at the arrival and the notebook, and whole only at the very end, over the first shot again.
A tap, Space or Enter goes to the next line; Esc or "Skip" ends the moment (what it changes in the
game is changed all the same); with reduced motion the camera cuts instead of moving.

**Foreshadowing.** The purser hesitates over your name ("...Of course."); the harbour master's
first line starts as if he knew you ("You ag— Never mind."); the tally marks on the notebook's
cover are already there at the arrival.

## Two visual registers

The town, its people and the remembering screens stay pixel art. The cinematic moments and the
close-ups (the ship and the harbour, the mementos, the notebook on the quay, the lamp room, the
register, the pages on the quay, the purser) are a second register: still drawn in code, but
illustrated, with gradients, soft light, grain and vignette, in the palette of the town at night,
so that the two do not clash. Cuts between them are cross-dissolves or a fade through black, never
a jump.

## The notebook (the menu)

In the story the whole menu is the notebook found on the quay, open: on a desktop a two-page
spread, on a phone one page at a time ("Next page"). Its three sections are ribbon tabs
(1 Journey, 2 Map, 3 Clues; Tab, Esc, 1 2 3 and the arrows as in the plain menu). Everything on
the paper is in the character's hand, first person, short ("House 3 next. The painter's house." /
«Poi la casa 3. ...»): a handwriting face where the system has one, else an italic serif, never
smaller than 17 px, dark ink, no capitals-only script.

- **Journey**: the goal; the houses as entries, ticked and struck through when remembered, the
  current one circled and underlined; the lighthouse ("Locked from the inside."); a pencilled
  "?" for a place visited off the way (never a task); the latest entry, which is the next step
  (the tracker is its short form). Facing page: the pages restored, pasted in; the torn ones as
  stubs; after the ending, "What the pages said".
- **Map**: the town as an ink sketch, houses numbered by hand, the next one circled in red pencil,
  "?" pencilled where a house was walked past, the ship at its berth, "× me". Facing page: the
  mind map as another sketch.
- **Clues**: what was learnt, written down when it was learnt (the harbour master's direction,
  each owner remembering and pointing on, each memento's unease, the word for the door, the
  register, the pages torn out); the mementos pasted in as small pictures with a caption; keys and
  tools; opened locks; things found by chance; the coins as a tally.

Settings stay plain UI, in a corner. With `"story": false` the menu keeps its plain look.
## Remembering (in place of the duel)

Same rules as the duel in `DESIGN.md` (turns, tolerance, no loss on failure), without the tones, a different
meaning:

- The owner's bar is their **memory**, which fills; yours is your **clarity**, which the fog eats.
- A right answer brings a piece back ("Yes... the vats. Three of them."). A wrong one thickens the
  fog, and the owner clings to a **false memory**: the trap of the chosen option, which you are
  then shown how to correct.
- Owners resist. They defend what they misremember, sometimes with sarcasm. That is where the bite
  of the old duel survives.
- When the memory is back the owner changes, by temper, and gives the key to the upstairs.
- No tone and no "how sure are you?": the learner just answers. One right answer brings back one
  piece, one wrong answer costs one step of clarity. The same holds for the questions in the tall
  grass (coins by the question's level, nothing lost on a wrong one). With six questions an owner
  remembers after four right answers, and the fog wins at three wrong ones: a learner right 70% of
  the time usually succeeds (three times in four), one right 40% of the time usually does not.
- The host's line is "Help <name> remember"; after success, "Remember together again" (harder
  questions, nothing at stake). A window of the house lights up when the player steps outside.

## Mementos

One per core house, upstairs, in an order that escalates. A registry in the engine, painted in
code, shown in a first-person illustrated close-up on a table under a lamp:

1. a page of the notebook (ordinary: a clue)
2. a steamship ticket, years old
3. a pressed flower in a book, with a date
4. a black and white family photograph in front of this very house; one face is scratched out
   (the first thing one notices)
5. a child's drawing of the lighthouse, lit
6. a letter never sent, unsigned, in the notebook's hand
7. a pocket watch stopped at the hour you arrived
8. a visiting card: your name

Each memento restores one page of the notebook. The page's text comes from the course: the
concept's idea in one line, as if you had once written it down. A course with fewer houses uses
the first, the photograph and the card (then, as houses allow, the ticket, the watch, the letter,
the drawing, the flower); the order always ends on the card. The upstairs exists for this in every
core house; a workshop or a museum has none, and its owner hands the memento over on remembering.
The character's thought escalates: "This is my handwriting" comes late, with the letter.

## The pages and the lighthouse

The restored pages, in order, read as the big idea of the course. Their last line names the
lighthouse and gives the word for its door (a key word of the big idea, or one the course chooses
in `world.json`). Nothing in town labels the lighthouse; before the last page its door only says
that it is locked from the inside. At the door the word is typed freely, as at any lock; after two
misses the character remembers it, so nobody is stuck there.

## After the ending

- **The fog returns.** Some days after it was last remembered, a house dims, and its owner starts
  to confuse things again. Two right answers there bring it back. This is spaced retrieval in
  costume: the intervals grow each time (1, 3, 7, 16 days, then 16). The tracker does not nag; the
  notebook marks the house.
- **Deeper rooms.** Locks, hidden buildings and the lantern cat hold memories you did not know you
  had. The cat is the only one in town who never forgot.
- The ending can be seen again; the notebook stays readable. "Another round" does not erase the
  save: the town stays as you left it (a true new game plus is an idea in `docs/ROADMAP.md`).

## Endings (planned)

Not built: a plan note, now with its triggers fixed. The bitter ending with the identical loop is the
ending of a player who did only the main path, and today it is the only one. One function of the
state chooses the ending, `endingOf(state, { tier, completion })` in
`engine/src/mechanics/story/logic.js`; its inputs are the player's experience tier (arrival, passing,
settling, known, home: `engine/docs/ENGINE.md`, "Experience") and the completion, the share of the
optional things done (extra houses, locks, advanced stations, secrets, games played, the fog cleared
after an ending). The rules are data there, `ENDING_RULES`, checked by the tests:

| Ending | Triggered by | What it would be |
|---|---|---|
| **good** | tier `home`, completion at least 0.8, and at least one house brought back from the returning fog | the notebook is kept instead of torn; the ship leaves with its lights on; the crossing is remembered |
| **hope** | tier `known`, completion at least 0.5 | the loop, but one page stays in your pocket; the purser does not ask "Another round" |
| **loop** | anything else | built: the bitter, identical loop |

Until an ending is built, `endingOf` answers `loop` (`BUILT_ENDINGS`); `plannedEnding` says what the
rules would choose. Meanwhile the loop **acknowledges** the tier in two lines and changes no event:
the keeper at the lamp ("Short, this time." / "You stayed longer this time. Not long enough." /
"Longer than ever. There may be another way out of this."), the purser after "Another round, <name>?"
("Quick, this time." / "You stayed a little longer, I see." / "You stayed long this time. Almost long
enough."). After the ending the player may stay, gather experience and climb the lighthouse again:
the keeper speaks by tier ("Still here. Good." ... "Almost. There are rooms you haven't opened.")
and names, vaguely, the kind of thing most missing. Constancy pays: that is the lesson about
learning the endings will tell. A new ending is a new entry in `ENDINGS` (`finale.js`), its name in
`BUILT_ENDINGS`, and nothing else.

## What changes in the game

| Part | Change |
|---|---|
| Opening | Arrival scene; name asked once (kept on the device only); the ship moored at a quay |
| Town | Rain on arrival that lets up within about half a minute, or when the first lab is opened; dark windows that light up; the League hall becomes an unmarked lighthouse |
| People | Lines by stage: cold, thawing, warm; the guide becomes the harbour master |
| Duel | Reskinned as remembering: strings, bars, tempers; rules unchanged |
| Upstairs | Every core house has one (for the memento), even with no advanced material |
| Menu | The whole menu is the notebook: Journey, Map, Clues, in hand on paper |
| Ending | The keeper, the lamp and the register, the loop; then the returning fog |
| Sound | Rain as a place sound; the mix opens as the town remembers |

## Rules that still hold

The basic path stays explicit (the notebook always says the next step); nothing optional is
listed; mistakes cost nothing; the story can be switched off in `world.json` for a plain town.
