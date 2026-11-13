# Pocket mode (planned)

A way to make a small, good game with a small budget of model tokens. Status: design note, not
built. It will be folded into `DESIGN.md` and the skills when implemented.

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
2. **A kit of ready-made labs.** The lab patterns of `references/5-labs.md` built once in the
   engine as configurable pieces (slide and reveal, mix, compare two cases, sort, put in order,
   find the threshold, match, label a picture, what changes if, predict the curve...), tested and
   good-looking on desktop and phone. A station names a pattern and gives its data. No code, no
   screenshots. Custom code stays possible and is where a larger budget goes.
3. **One wow lab.** The saved budget is spent on the one concept where a picture changes the
   learner's mind: the most striking pattern, tuned with care (or the only custom station).
4. **A small shape.** Three or four core concepts, one station each (two for the wow lab), about
   two questions per concept and a League of six, one extra, one lock. One district, a smaller
   town. Around twenty minutes of play.
5. **A fixed look.** One theme by seed, generated houses and rooms as they come, homes and
   tempers by seed, standard phrases. No world file.
6. **A prebuilt player.** The engine built once and published; a script (and a page on the
   project's site) packs a `course.json` into it. With ready-made labs a course is pure data, so
   a game can be produced without installing or building anything, and even from a chat that
   cannot run code: the model writes the course, the page makes the game.
7. **A pocket skill.** One page: the steps, the rules that keep quality (every fact checked, the
   four tests of a lab, one idea per station), and the template to fill.

## What does not shrink

Accuracy, the order "understand, then remember", feedback on wrong answers, the main path with
its tracker and ending.

## How we will know it works

Build the same small subject in pocket and in standard mode with a mid-size model, compare the
tokens used, and have simulated first-time players go through both.
