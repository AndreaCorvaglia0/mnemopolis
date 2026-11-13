# Prose: three registers, and where each one applies

A course speaks to the learner in three kinds of text, and each has its own register. The
explanation of an idea is written like a good technical handbook; the instructions of a lab are
short and operative; the people of the town have a voice and may be funny. Mixing them is the
commonest fault of a course written in a hurry: a reading page made of punchlines, or an expert
who lectures. This file says which register goes where, and how to revise a text. The handbook
register is adapted from the author's *prosa-didattica* skill; it applies in Italian and in English
alike, only the connectives change.

## Expository text: the handbook register

**Where:** the reading page of every concept (`page`), `application`, `anchor` and its `limits`,
the answer of `explain`, the `why` of a prediction and of a question, the `traps` (the learner reads
them after a miss), the takeaway of a station, the notes inside locks, `further` descriptions, the
plaques of a museum, the big idea and the goals that the ending card shows.

- **Paragraphs, not notes.** A block is a paragraph of two to five complete sentences that says what
  the thing is, why it matters and what the example shows. Sentences are linked with *because, so,
  while, which, for example, this way* (*perché, quindi, mentre, che, per esempio, in questo modo*).
- **No telegraphic runs.** Three or four short sentences in a row without connectives read as notes
  the learner must link alone.
- **Colons** introduce a list or an example; they never weld two half sentences ("Restart resets the
  kernel: variables vanish, code stays").
- **No label lines** ("Example:", "Union:"): the label becomes a sentence.
- **No effects.** No punchlines, antitheses, slogans, rhythmic triads, exclamation marks, rhetorical
  questions or enthusiasm words (powerful, crucial, incredible, magic, simply; *potente,
  fondamentale, incredibile*). The text does not chase attention, it repays it with information.
- **The expected result is a sentence**: "The two squares have the same numbers", not "Result: same".
- **Flat titles**: "Lights add", "Three inks instead of red, green and blue"; no promises, no questions.
- **Explain once, well, then go to the example.** This is not an invitation to pad: a reading page
  is two or three short paragraphs, read on a phone.
- **Technical terms stay in English** where practice uses English (RGB, pixel, sRGB, kernel).

Two carve-outs belong to the method of this project, and are not exceptions to be ashamed of:

1. **Analogies are a teaching device** (elaboration, `references/4-active-learning.md`): allowed when
   they are explicit, used to explain, and come with their limit (`anchor.limits`). Decorative
   metaphors that explain nothing are not.
2. **Genuine questions the learner must answer** are part of the method: the prediction of a lab,
   "explain it in your own words", the questions of a duel. They are tasks, marked as such by their
   field. A question used as a hook inside an explanation is not.

## Instruction text: short and operative

**Where:** a station's `goal`, its `tries` (the steps), prompts. One instruction per step, as a
full sentence ("Drag the red lamp onto the green one."), with its reason when it helps. No chain of
bare imperatives where one sentence fits ("Press. Run. Look.").

## Voice text: the game's fiction

**Where:** duel lines and tempers, thoughts aloud, the clues on sticky notes and through hatches,
what passers-by say, the guide, an expert's `line`. Here the handbook register does **not** apply:
wit, character and brevity are wanted. One rule holds: voice text never carries the explanation of
an idea. If a line must teach something, the teaching belongs in expository text, and the voice
only points to it.

## Revising a text

1. Read everything as the learner will see it (the reading page, the lab panel, the duel's
   rebuttal) and mark the blocks that are notes rather than explanations.
2. Keep what already flows: a simple sentence that is complete and linked stays as it is.
3. Rewrite the marked blocks, folding label lines and neighbouring fragments into one paragraph.
4. Do not touch the rest: numbers, answers, code, links, the structure of the sections. A number
   that must be checked is checked against the source or the lab, not from memory.
5. Read the result again as a learner, and fix what still sounds like a note or an effect.
6. Report what changed with two or three before-and-after pairs, and list every technical claim
   added while rewriting: those are the ones to verify against `sources.md`.

## The checker

`npm run validate` runs `scripts/prose.mjs` over the expository fields of `course.json` in the
course's language and prints **warnings** (never errors): label lines, telegraphic runs (three or
more sentences averaging under eight words), chains of colons without connectives, questions in
exposition, openings with Here/Now/Then (*Qui/Ora/Poi*), exclamation marks and brochure words.
Instructions are checked only for exclamation marks and brochure words, tasks only for brochure
words, voice text not at all. The checker finds the obvious cases; whether a paragraph flows is
judged by rereading it.

### Before and after

> Before: "Lights start from dark and add: more lights, brighter. Paints start from white and take
> away: more paints, darker."
> After: "Lights start from dark and add, so more lights give a brighter colour. Paints start from
> white paper and take light away, so more paints give a darker one."

> Prima: "Fissa: stessa forza, direzione più comoda. Mobile: metà forza, ma il doppio della corda."
> Dopo: "La carrucola fissa lascia la stessa forza e cambia solo la direzione in cui si tira. La
> carrucola mobile richiede metà della forza, ma per sollevare il carico di 1 m bisogna tirare 2 m
> di corda."
