# Step 6. Ask: questions for remembering and for using

Questions do two jobs. Recalling a fact from memory strengthens it more than reading it again,
and answering in a new situation shows whether the idea can be used. Every question is
low-stakes: it can be skipped, and a wrong answer costs nothing but shows the reason.

## Three levels

| Level | Asks for | Built from | Used for |
|---|---|---|---|
| 1 | A key fact | a `remember` line | review, spaced over the course |
| 2 | Applying the idea to a case | the lab, with the surface changed | the concept's quiz, the final check |
| 3 | Transfer: a new situation, or two concepts together | the `application`, a cross-theme link | the concept's quiz, the final check |

Per concept: **1 to 3 at level 1** (one per `remember` line), **at least one at level 2**, and a
level 3 for at least half the concepts. A `story` concept needs only levels 1 and 2.

**A core concept needs six questions** (levels 1 to 3), because its questions are its duel (see
"Questions in duels" below). The validator warns below six and refuses fewer than three.

Levels 2 and 3 must **not** be answerable by remembering the lab screen. Change the numbers,
the object, the context: the learner should have to recognise the idea underneath.

## Writing an item

| Part | Rule |
|---|---|
| Stem (`q`) | One clear question about one important idea. Short. No negatives ("which is NOT"). No trick, no opinion, no trivia. Everything needed is in the stem. |
| Options | **Three or four**, one of them right beyond dispute. Three good options beat four with a filler. Similar in length and form. In a natural order where there is one. No "all of the above", no "none of the above". |
| Wrong options | Each is **plausible** and comes from a real mistake: the wrong belief of the concept, a confusion with a neighbouring concept, a typical slip. Never absurd. |
| `traps` | For each option, the mistake it catches (and `null` for the right one), as **one short sentence the learner will read**: why the option tempts, then why it fails. If you cannot name the mistake, the option is filler: replace it. |
| `answer` | The index of the right option. Vary its position across questions. |
| `why` | One or two sentences that give the **reason**, not a restatement. It should also tell someone who chose the commonest wrong option what they missed. |

Avoid giveaways: a right answer that is longer or more precise than the others, words like
"always" and "never" in wrong options only, grammar that fits one option, an option that
repeats a word of the stem.

### Examples

Level 1, from the line "Red + green light = yellow":

> Red light plus green light gives...
> Brown · **Yellow** · Purple · White
> traps (Brown): "Mixing paints gives a muddy brown, so it feels natural for lights too; but
> lights add up, and red plus green light makes the eye see yellow."
> traps (Purple): "Purple is what red and blue make together; green is the other light here, and
> red plus green gives yellow."
> why: Lights add. Red and green together stimulate the eye like yellow does.

Level 3, transfer of "colour depends on its surround" to a design decision:

> You pick a text colour by eye on a dark mock-up. On a white page it looks wrong. Why?
> The file changed · **The surround changed** · White pages are brighter · RGB is unreliable

## Beyond multiple choice

The engine asks multiple-choice questions. Two other kinds of asking live elsewhere in the
course and are as important:

- the **prediction** at the start of a lab station (`predict`): a question before the learning;
- the **explain** prompt on the page: free recall and explanation, ungraded, said aloud.

## Questions in duels

The game asks the questions in **duels**: the host of each house challenges the learner on that
concept's questions (levels 1 and 2 first, at most six turns), and the final check is a duel with
a champion. A wrong answer is answered by a rebuttal built from the `trap` of the chosen option,
then the right answer with `why`:

> ✗ Why “Brown” tempts: Mixing paints gives a muddy brown, so it feels natural for lights too; but
> lights add up, and red plus green light makes the eye see yellow.
> Right answer: Yellow. Lights add. Red and green together stimulate the eye like yellow does.

So:

- every wrong option needs a trap written as **a full short sentence** (about 12 to 30 words) that
  reads well after "Why “…” tempts:": first what makes the option attractive (the intuition, the
  neighbouring idea, the half-truth), then why it fails here. Not a label: "paint-mixing
  intuition" tells a learner who just chose Brown nothing they can use. The validator warns about
  traps under eight words;
- the trap speaks about the idea, never about the learner ("it feels natural", not "you are
  confused"); no answer to another question inside it;
- `why` must say why the right answer holds; it is also shown after a right answer;
- **six questions per core concept.** The duel asks at most six. Simulated learners
  (`engine/tests/duel.test.mjs`, table in `engine/docs/ENGINE.md`) show that with six questions a
  learner right 70% of the time wins about three duels in four and one right 40% of the time loses
  more than four in five; with four questions the two are barely told apart (65% against 17% for
  learners who always state, 73% against 33% for calibrated ones). The validator warns below six
  and refuses fewer than three for a core concept. Extra concepts may have fewer: nothing gates
  on them.

A concept's `expert` may name a `temper` for the duel (optional: smitten, sore, admirer, letwin,
theatrical, absent, craftsman); without it the engine picks one.

`why` and traps are expository text: write them in the handbook register of
`references/9-prose.md` (complete, linked sentences; no punchlines). The validator's prose checks
cover them.

## The final check

The course ends with a set of questions drawn from levels 2 and 3 of every concept, mixed so
that themes alternate. Set its `size` (8 to 12) and its pass mark (`pass`, usually 0.7). Mixing
is deliberate: having to recognise *which* idea a question needs is part of using it.

## Checklist

- [ ] Every `remember` line has a level-1 question.
- [ ] Every concept has a question that changes the surface of what the lab showed.
- [ ] Every wrong option has a trap written as a sentence: why it tempts, why it fails.
- [ ] Every core concept has six questions.
- [ ] Right answers are spread over positions and are not the longest option.
- [ ] Every `why` gives a reason.
- [ ] No question depends on another question.

Sources for this file are in `evidence.md`.
