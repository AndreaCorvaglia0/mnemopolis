# The game in one picture

The coherent view of what Mnemopolis is, gathered from decisions taken piece by piece. Details
live in `DESIGN.md` (rules), `STORY.md` (fiction), `POCKET.md` (small budgets), `ARCHITECTURE.md`
(code) and the wiki (reasons). Where they disagree, this file states the intent and the others
are to be brought in line.

## What it is for

A person should understand the key ideas of a subject in about an hour by doing, want to stay
longer, and come back. Three things carry that: **understanding before memory**, **curiosity as
mystery**, and **a world that answers to what you do**.

## The loop of a session

```
arrive by ship in the rain -> a town that has forgotten -> the notebook
for each core house, in the order of its number:
    lab (understand by doing) -> help the owner remember (prove) -> key -> upstairs (a thing of yours)
all pages found -> the dark lighthouse -> the keeper (final test) -> the ship -> the loop
afterwards: the town stays open; what you do there changes how it treats you, and how it ends
```

## The layers, and who makes them

| Layer | Made by | Changes per course |
|---|---|---|
| Knowledge: sources, concept map, key concepts, goals, questions, riddles | the course author (a model), with the knowledge-base skill | everything |
| Labs: one object, one action, one surprise; visual and interaction design | the course author | everything; this is where effort goes |
| Game dynamics: main path, remembering, locks, floors, mini-games, experience | the engine | nothing |
| Story: arrival, notebook, mementos, lighthouse, endings | the engine | only names and the pages' text |
| Look and sound: town, houses, rooms, illustrated scenes, music, interaction sounds | the engine, by seed and theme | nothing at small budgets; more care with more budget |

Three independent settings of a course: **size** (how many concepts), **care** (effort per unit),
**level** (how deep). The **pocket** way spends tokens only on the first two rows.

## Three axes of play

| Axis | Need | In the game | Earns |
|---|---|---|---|
| Prove | check understanding | helping owners remember; the keeper | keys, pages, the ending |
| Explore | go beyond the basics | locks with free answers, upper floors, hidden places, secrets, the lantern cat | advanced knowledge, discoveries |
| Practise | remember | small questions and **mini-games** scattered through the town | coins and experience |

## Mini-games

Short arcade-like games started by an interaction (a person, an object, a spot in town), each a
few rounds of one skill of the subject, fast and repeatable: tell which of two notes is higher,
sort ten cards against the clock, catch the odd one out. They are practice dressed as play: a
score, a best score, no penalty. A course lists them (`games`) and supplies their content; the
engine supplies the frame, the scoring and a few ready kinds; a course may write its own.

## Experience, and a world that notices

- **Experience** is everything you have done, as one number that never goes down (lifetime coins
  earned, plus what coins do not pay for: houses remembered, locks, secrets, returns). Coins are
  what you can spend; experience is who you have become here.
- **The world comments on it.** People notice how long you have been around and what you have
  done: "You're new here, aren't you." / "I see you've kept busy." Some start to tell you
  something and stop: "No. Too early for that." The keeper and the purser read you the same way.
- **Perception first.** For now this is said, not enforced: it costs nothing and already makes the
  town feel alive. The hooks are single functions of the state (`tierOf`, `endingOf`), so that
  real consequences can be switched on later: places that open with experience, lines that are
  finally spoken, endings.
- **Endings by what you did.** Only the main path: the bitter loop. More experience and
  exploration: endings with hope, then the good one. After the first ending you may keep playing,
  gather experience and climb the lighthouse again. Constancy pays: that is the lesson about
  learning that the game is built to tell.

## Immersion

- **Sound answers the hands.** Every control in a lab and every interaction in town has a small
  sound of its own; labs may make real sound when the subject is audible. The ambient music stays
  quiet and unresolved; one theme belongs to the story.
- **Two visual registers.** The playable world is pixel art; staged moments and close-ups are
  illustrated.
- **One grammar of gestures.** Tap or Space for what matters; double tap or T for a thought;
  walking near for animals and happenings; exploring for secrets.
- **The notebook is the menu.** What to do next is always written there in your own hand; what is
  optional is never listed.

## Principles that settle arguments

1. Understanding comes before memory.
2. The basic path is explicit; everything else is a mystery.
3. Mistakes cost nothing but a turn, and always return an explanation.
4. The world should seem to change with what you do, before it really does.
5. Reuse before adding; everything optional can be switched off.
6. Accuracy of content never drops, at any budget.

## State of things

Built: the knowledge-base method, labs and their kit, the town generators, the main path, the
story with its bitter ending, remembering, locks and upper floors, ambient life and obstacles,
ambient music, voice, the prebuilt player, two example courses.

Being built: experience and the commenting world, mini-games, interaction sounds, a course on
music theory for guitarists, a new front page for the site.

Planned: endings by experience, the shop and tools, a pocket skill with the budget question, a
second round (new game plus), play-testing with real learners.
