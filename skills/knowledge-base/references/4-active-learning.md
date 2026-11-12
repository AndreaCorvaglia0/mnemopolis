# Step 5a. Activate: what the learner does to understand

For every concept, decide what happens in the learner's head. This file is the toolbox and the
rule for choosing from it. Lab design is in `5-labs.md`.

## The yardstick: what is the learner doing?

Activities differ in how much thinking they demand (the ICAP framework):

| Mode | The learner... | Examples | Worth |
|---|---|---|---|
| Passive | receives | reads a page, watches an animation | lowest |
| Active | manipulates what is given | moves a slider, clicks through, highlights | better |
| **Constructive** | **produces something that was not given** | predicts, explains, draws, decides, builds, finds a rule | much better |
| Interactive | builds on another person's ideas in dialogue | explains to a friend who objects | best |

A solo game can reach **constructive**. That is the target for every concept: at least one
moment where the learner must produce a prediction, a decision or an explanation. Moving a
slider and watching is only "active": a start, not the goal.

Being busy is not the same as thinking. An activity can look interactive while the mind idles.
Ask of every activity: **what does the learner have to work out?** If the answer is "nothing",
it is decoration with buttons.

The top mode needs another person. The course can invite it: the "explain it" prompt says to
say the answer aloud, and to a real person when there is one.

## The arc of one concept

Each concept follows the same four beats. Not every beat needs its own lab station.

1. **A question first.** Before any explanation, the learner meets a problem or makes a
   prediction. It gives the explanation a purpose and exposes the wrong belief.
2. **Hands on the concrete case.** They act on one tangible instance and see what happens.
3. **The rule.** Only now is the general idea stated, in words and with its proper names. It
   arrives as the answer to what they just saw.
4. **Use it elsewhere.** The idea returns in a different setting: an application, a twist, a
   question with a new surface.

## The toolbox

Choose **one or two** per concept, by fit. Using all of them is how courses become crowded.

| Technique | What the learner does | Fits when | Field in `course.json` |
|---|---|---|---|
| **Predict, then find out** | commits to an answer before trying | intuition is probably wrong | `predict` on a lab station |
| **Structural analogy** | maps a familiar system onto the new one, part by part | the concept is a mechanism whose parts correspond | `anchor` type `analogy`, with `limits` |
| **Metaphor or image** | holds an abstract idea as a concrete picture | the idea has no visible form | `anchor` type `metaphor`, with `limits` |
| **Concrete example, then the rule** | works one tangible case, then sees detail stripped away | the rule is abstract and has real instances | `anchor` type `example`; station order |
| **Compare and contrast** | sets two similar things side by side | the concept is confused with a neighbour | `anchor` type `contrast`; a `contrasts` relation |
| **Application** | sees where the idea is used, and uses it on a real case | always worth one line; a whole concept when using it is a goal | `application`; a `cases` concept |
| **Why question** | answers "why is this so?" in their own words | the fact has a reason that can be worked out | `explain` |
| **Explain it simply** (Feynman) | says it aloud for a beginner; gaps show at once | once per concept | `explain` |
| **Words plus picture** | meets the same idea as a sentence and as an image | always | lab `goal` next to the stage; the place itself |
| **Generate** | produces an answer, a drawing or an example before being shown one | the learner knows enough to try | lab tasks; `explain` |
| **Retrieve** | recalls a key fact from memory, later | always, for the `remember` lines | level-1 questions |

### Writing an anchor

- One sentence. Familiar to **this** learner (check the brief: an analogy from plumbing helps a
  plumber and nobody else).
- For an analogy, say what corresponds to what.
- Always fill `limits`: where the analogy or metaphor **stops being true**. An unexamined
  metaphor produces confident wrong ideas. If you cannot say where it breaks, you do not
  control it.
- The best anchor is one the lab lets the learner operate.

### Writing the application

One line that answers "where would I meet this?" with something real and specific: a device, a
job, a decision, a mistake it prevents. "Used in many fields" is not an application.

### Writing the explain prompt

- A **why** or **explain-to-a-friend** question that cannot be answered by repeating the idea.
  Good: "A screen has no yellow lamp. Explain to a friend how it shows a lemon."
  Weak: "What is additive mixing?"
- A model answer of two or three sentences, in plain words, shown only on request.
- The learner is told to say their answer aloud before looking.

### Writing the remember lines

- 1 to 3 per concept. Not a summary: the lines without which the rest falls apart.
- Each is a full sentence that is true on its own, and short enough to recall whole.
- Read all of them in a row for the whole course: it should be a fair abstract of the subject
  (about 15 to 25 lines for a standard course).

## What weakens learning

- **Extra interesting material** that is not the goal: anecdotes, trivia, decoration. Leave it out.
- **Too much at once.** One idea per station, key terms named before they are needed.
- **Telling first.** An explanation before the learner has a question is forgotten.
- **Rereading as review.** Review by asking, not by showing again.
- **Help that never fades.** Hints and pictures support the first meeting; later questions must
  be answerable without them.

Sources for this file are in `evidence.md`.
