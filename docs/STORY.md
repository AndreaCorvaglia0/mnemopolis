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
out to be where it all leads. At the top you learn that the traveller who came before you was
you. The town is your memory.

## Tone

Melancholy outside, wit in the people. The rain and the music carry the sadness; the owners carry
the comedy (one falls for you once they remember, one insists they never forgot anything, one is
offended to have been helped). Never grim, never mocking the learner.

## Beats

| # | Beat | What the player sees | What it is for |
|---|---|---|---|
| 1 | Arrival | A short scene: rain, the ship docking, its lights going out. It stays at the quay, at the end of the road out of town, in every town. A purser asks your name for the register (optional, kept on the device) | The name is used later. The ship in view is the way out |
| 2 | The cold town | People answer briefly and do not help. Windows are dark | A gap to close: what happened here? |
| 3 | The notebook | Found on the quay. One legible line points to house 1. It becomes the Journey tab; the tracker reads as its last line | The guide, in fiction |
| 4 | Remembering | In a house: the lab sets their instruments working again; then you help the owner remember | Replaces the duel (see below) |
| 5 | Mementos | Upstairs in each core house, one object of yours: never explained, each a little more personal | The mystery turns from "what happened to them" to "who was here" |
| 6 | The town warms | With each house: a window lit, the rain a little thinner, people a little kinder, the music a little fuller | Progress you can see and hear |
| 7 | The lighthouse | Unmarked, in plain sight from the start, dark: it stands where the League hall stood, on the square. The pages together say where to go and what to say at its door | The League, hidden in plain sight |
| 8 | The keeper | At the top, the one who keeps the forgetting. The final test, on everything | The exam |
| 9 | The turn | The keeper has your face. The handwriting is yours. The card bears the name you gave the purser. You were the traveller before you | Change of frame: the town is a memory palace, yours |
| 10 | Leaving | The lamp is lit, the rain stops, the ship sounds its horn. You may leave the notebook on the quay for whoever arrives next | Ending card; the loop closes |

## Cinematic moments

A few moments are staged, briefly, like film: black bars slide in at the top and bottom, the HUD
hides, the camera moves by itself, one line of text at a time, and a short theme plays. Each lasts
seconds, can be skipped with a tap, and returns control at once.

| Moment | Staging |
|---|---|
| Opening | The ship in the rain, the gangway, the lights going out; two or three lines of context |
| The notebook | The camera closes on the quay; the cover; the first legible line |
| Each memento | The close-up, a held note of the theme, the page restoring itself |
| The town remembering | A window lighting, seen from above, after each house |
| The lighthouse understood | The camera lifts to the dark tower when the last page is read |
| The turn | The longest: the keeper, the handwriting, the card |
| Leaving | The lamp, the rain stopping, the horn |

The theme is one melody of the course's key, the only tune in the game, built on the motif that
already marks discoveries; it is heard in fragments at the mementos and the windows, a longer phrase
at the arrival and the notebook, and whole only at the turn and the leaving, where it comes home.
A tap, Space or Enter goes to the next line; Esc or "Skip" ends the moment (what it changes in the
game is changed all the same); with reduced motion the camera cuts instead of moving.

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

One per core house, upstairs, in an order that escalates. A registry in the engine, drawn in code,
shown in a first-person close-up like the locks:

1. a page of the notebook (ordinary: a clue)
2. a steamship ticket, years old
3. a pressed flower in a book, with a date
4. a black and white family photograph in front of this very house; one face is scratched out
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
- The ending can be seen again; the notebook stays readable.

## What changes in the game

| Part | Change |
|---|---|
| Opening | Arrival scene; name asked once (kept on the device only); the ship moored at a quay |
| Town | Rain that thins with progress; dark windows that light up; the League hall becomes an unmarked lighthouse |
| People | Lines by stage: cold, thawing, warm; the guide becomes the harbour master |
| Duel | Reskinned as remembering: strings, bars, tempers; rules unchanged |
| Upstairs | Every core house has one (for the memento), even with no advanced material |
| Menu | Journey tab drawn as the notebook, with the pages found |
| Ending | The keeper, the turn, the leaving; then the returning fog |
| Sound | Rain as a place sound; the mix opens as the town remembers |

## Rules that still hold

The basic path stays explicit (the notebook always says the next step); nothing optional is
listed; mistakes cost nothing; the story can be switched off in `world.json` for a plain town.
