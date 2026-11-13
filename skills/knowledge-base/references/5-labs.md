# Step 5b. Labs: design the interaction

A lab is where a concept becomes something the learner can handle. Here you **design** it as a
specification in `course.json`. Someone else, or you later, will code it.

## What the good ones do

Three families of tools get the effect you are after. They agree on more than they differ.

**Guided interactive lessons** (Brilliant is the best known):
- a question or a decision comes before any explanation;
- the learner acts on the problem: moves a point, tests a pattern, estimates, picks a strategy;
- concrete, manipulable visuals come first and are linked to symbols afterwards;
- one idea per step, starting from the simplest useful case;
- feedback arrives while the thinking is still warm, so the learner revises instead of reading a verdict;
- later practice removes the help, changes the surface of the problem, and comes back after a gap.

**Explorable explanations** (Bret Victor, Nicky Case):
- start with a question, then start on the ground with a concrete experience;
- climb to the abstract slowly, each step joined to the last by "therefore" or "but", not "and then";
- use the twist: the moment the obvious expectation fails;
- step back down to the concrete when the abstraction runs ahead;
- end with a sandbox, once the learner knows what to look for. A sandbox alone explains nothing.
- named patterns: *puzzle it out* (solve inside the simulation), *place your bets* (predict,
  then see reality), *role play* (hard choices with no right answer), *sandbox*.

**Research simulations** (PhET):
- **implicit scaffolding**: the design guides without instructions. What the learner *can* do
  (a draggable thing looks draggable), what they *cannot* do (few controls, bounded ranges),
  what catches the eye first, and what answers back immediately;
- make the invisible visible; show the same thing in two linked representations;
- tie it to something from real life;
- watch real people use it, and fix what confuses them.

## The station

A lab has 1 to 3 stations (a `process` concept: up to 8, one per step). Each station is one
idea. Its specification:

| Field | What to write |
|---|---|
| `tab` | A short name (2 or 3 words). |
| `goal` | The idea as a sentence with a verb, 26 words at most. "Lights add up", not "Use the sliders". |
| `beat` | Its place in the concept's arc: `ground` (hands on the concrete case), `rule` (the general idea made visible), `twist` (the expectation fails), `sandbox` (free use, last). |
| `pattern` | The main kind of interaction, from the table below. |
| `object` | The concrete thing on the stage. A light on a wall, a file, a curve, a sentence, a cell. |
| `action` | What the learner does to it, with their hands. A verb. |
| `surprise` | The exact moment the wrong belief breaks. |
| `predict` | Optional. A question to commit to before touching anything, with 3 or 4 options, `answer`: the index of the option the exploration proves right, and optionally `why`: one short sentence giving the reason, shown with the verdict. The learner sees the picture while answering, so the question must be about it; words such as "left" and "right" can change place on a phone, so name things by what they are. |
| `controls` | At most two, besides acting on the stage directly. |
| `tries` | 1 to 3 small tasks, each with an end state a program can detect. They tick themselves. If there is a `predict`, the first task leads to the state that answers it. |
| `takeaway` | The rule, one or two sentences, key words in bold. Shown only after the tasks are done. |
| `source` | One honest line: what is real data, what is computed live, what is recorded, what is simplified. Shown in the theory drawer: it must not give the answer away. |
| `data` | Optional. What real material is needed (images, a file, a recording) and where it comes from. |

## Finding the interaction

For each concept, in this order:

1. **The change.** "Before: they believe X. After: they see Y." X is the wrong belief from the
   map. No X, no job for the station.
2. **The object.** What is the concrete thing this concept is about? Put that on the stage, not
   a diagram about it.
3. **The verb.** What would an expert *do* to that object to show a beginner? Overlap it, cut it,
   stretch it, remove a piece, step closer, run it one step at a time, sort it.
4. **The surprise.** At which moment does X fail? Make the first task lead there.
5. **The scaffolding.** What can the learner do, what can they not do, what do they notice
   first, what answers back? If it needs a paragraph of instructions, redesign it.
6. **The four tests.**

### The four tests

- **Swap.** Replace the subject with another. If the station still works unchanged, it is
  generic. Flip cards, "drag the label to the box", a slider beside a paragraph, a quiz in a
  costume: all fail.
- **Hands.** Does the learner touch the thing, or a control panel about the thing? Dragging two
  lamps until they overlap passes. Choosing "red + green" from a menu and reading "yellow" fails.
- **Silence.** Cover the text. Does watching someone use the station still show the idea?
- **Mind.** What must the learner work out, predict or decide? If nothing, it is clicking.

## Patterns

A starting list, not a menu. The best stations join one of these to something only that concept has.

| `pattern` | The learner... | Fits |
|---|---|---|
| `handle` | drags, draws, cuts, rotates the thing itself | anything with spatial form |
| `cause-effect` | changes one input and watches one output, live | mechanisms with a clear dependency |
| `break-it` | removes a part or does a step wrong, and sees what fails | why a part or a step exists |
| `predict-test` | commits to an answer, then tries | intuition is wrong |
| `contrast` | sees two options on the same case, side by side | neighbours that get confused; choices |
| `zoom` | moves through scales: far to near, whole to part | structure hidden at another scale |
| `match` | adjusts until two things agree | equivalences |
| `step-through` | runs a process one step at a time, seeing the state after each | procedures, algorithms, cycles |
| `sort-cases` | judges or orders real examples until the criterion appears | categories, diagnosis, style |
| `linked-analogy` | works two linked panels, the familiar system and the new one | structural analogies |
| `puzzle` | reaches a stated target inside the simulation | when the rule is best found by needing it |
| `role-play` | makes a hard choice as someone, and sees its consequences | trade-offs with no single right answer |
| `sandbox` | uses the full model freely | last station only, after the idea is in place |

Reach also for what the concept is made of: **sound** (hear the frequency you are changing),
**time** (scrub a recording of a real process), a **real file** opened and explored, a **map**,
a **body**, a **score**, real **code** whose values are the controls.

## Real, computed, recorded, simplified

In order of preference:

1. real data, computed live;
2. a real rule computed live on simple inputs;
3. a recording of something real that cannot run in a browser, scrubbed by the learner, and
   labelled as a recording;
4. a simplified model that keeps the behaviour that matters, with the simplification named.

Never numbers typed by hand and shown as results. Never an animation of something that does not
work that way.

## Texts

- Goal: the idea, as a sentence with a verb.
- Tasks: start with a verb, name the end state. "Drag cyan onto magenta." "Find a pastel pink."
- Takeaway: the rule. It must still make sense a week later, without the station.
- Use the real terms of the field, introduced once and then kept.
- No exclamation marks, no praise, no "simply" or "just".

## What the learner sees

The station's picture fills the screen from the start. If there is a `predict`, the question
comes first, over the frozen picture; then "You said X. Now check it"; then the tasks, one
at a time as "Now: <task>"; when all are done, the verdict on the prediction and the `takeaway`, with
a button to the next station. Design for that order: the picture must make the question
concrete, and the first task must lead to the moment that settles it.

## Checklist for every station

- [ ] One idea, and it is the `goal`.
- [ ] It corrects a named wrong belief.
- [ ] Swap, hands, silence and mind tests pass.
- [ ] Two controls at most; each visibly changes the stage.
- [ ] Each task has a detectable end state.
- [ ] If there is a `predict`, it has an `answer`, and the tasks lead to the state that shows it.
- [ ] `source` says what is real and what is simplified.
- [ ] Nothing moves or sounds unless it means something.
- [ ] An expert would not wince.

Sources for this file are in `evidence.md`.
