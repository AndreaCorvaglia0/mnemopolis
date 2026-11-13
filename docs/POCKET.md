# Pocket mode (planned)

A way to make a small, good game with a small budget of model tokens. Status: pieces 2 and 6 are
built (the lab kit with four ready-made patterns, and the prebuilt player with `scripts/pack.mjs`
and the `/play/` page; see `engine/docs/ENGINE.md`); the pocket skill (7) is not written yet.

## Aim

The model's intelligence is spent only on what cannot be prepared in advance: finding and
checking the content, choosing the few key concepts, drawing the concept map, designing the labs.
Everything else is ready-made: the game dynamics, the look, the phrases, the build.

## Where the tokens go today

| Cost | Why | Remedy |
|---|---|---|
| Reading the method | a skill, seven references, engine docs | one short pocket skill with a fill-in course template |
| Writing lab code | custom JavaScript per station, debugging | ready-made parametric labs: the course only supplies data |
| Building and checking | installing, building, screenshots read as images | a prebuilt player: a course is packed into it without a build; checks by the text validator |
| Optional choices | theme, emblems, experts, world file | fixed defaults chosen by seed |
| Size | many concepts, stations, questions | a small fixed shape |

## The pieces

1. **One question at the start.** The agent asks how much to spend, once, with three choices:
   *pocket* (smallest cost), *standard*, *curated*. Each is a preset of size, care and level. No
   answer means standard.
2. **A kit for building labs.** The labs stay designed for their concepts: their visual and
   interaction design is where the tokens go. What is made cheap is the building: a one-page
   author's card with a complete station, helpers that keep a custom station to 30 to 60 lines
   (layout for laptop and phone, readable text, thumb-sized controls, tasks that tick from
   declarative conditions, a safe expression language), and ready-made patterns (slider-reveal,
   compare, sort, order) that a station can call from code and extend, or, when the design is
   exactly that pattern, name in `course.json` with its data and no code
   (`references/8-ready-labs.md`).
3. **One wow lab.** The saved budget is spent on the one concept where a picture changes the
   learner's mind: the most striking pattern, tuned with care (or the only custom station).
4. **A small shape.** Three or four core concepts, one station each (two for the wow lab), about
   two questions per concept and a League of six, one extra, one lock. One district, a smaller
   town. Around twenty minutes of play.
5. **A fixed look.** One theme by seed, generated houses and rooms as they come, homes and
   tempers by seed, standard phrases. No world file.
6. **A prebuilt player.** The engine built once and published; a script (`scripts/pack.mjs`) and a
   page on the project's site (`/play/`) put a course into it: `course.json`, and the course's own
   lab files, whose engine imports are rewritten to the player's kit. A game is produced without
   installing or building anything, and even from a chat that cannot run code: the model writes
   the course and its labs, the page makes the game.
7. **A pocket skill.** One page: the steps, the rules that keep quality (every fact checked, the
   four tests of a lab, one idea per station), and the template to fill.

## What does not shrink

Accuracy, the order "understand, then remember", feedback on wrong answers, the main path with
its tracker and ending.

## How we will know it works

Build the same small subject in pocket and in standard mode with a mid-size model, compare the
tokens used, and have simulated first-time players go through both.
