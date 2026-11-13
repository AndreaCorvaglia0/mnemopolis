# Progression of difficulty: ground floor, upstairs, locks

The game never opens at the full depth of a subject. Depth is reached by climbing: the ground
floor of a house gives the essential idea, the upper floor the complication, locks ask the learner
to recall and work out. This file says how to spread a concept over those places, and how to write
a lock. Read it in step 1 (the level) and in step 5 (stations and riddles).

## The ladder

| Where | Depth | What goes there |
|---|---|---|
| Ground floor of a house | the essential idea | 1 to 3 stations: *see it* (one control, one surprise), then *the rule* (a comparison or a second control), then *use it elsewhere*. Basic, but with a picture and an interaction strong enough to be remembered |
| The duel with the host | recognise and apply | questions of levels 1 and 2 |
| Upper floor (the owner's key) | the complication | the exception, the quantity, the second-order effect: one advanced station (`"advanced": true`), locks, `further` links |
| Extra and hidden buildings | neighbouring ideas | what an expert would add |
| Locks | recall and work out | a free answer: a short term or a number |

## Rules

1. **One new idea per station.** Two ideas make two stations, or one goes upstairs.
2. **Within a lab, stations ramp.** The first station has one control, one surprise and no
   prerequisite beyond earlier houses. The second adds a comparison or a control. The third
   transfers.
3. **Within a house, difficulty rises from the ground floor to upstairs.** The advanced station
   builds on the ground floor of the same house: it names a quantity the ground floor only showed,
   or the case where the rule bends.
4. **Across the path, early houses are simpler than late ones.** The first house assumes nothing;
   later houses may assume earlier ones.
5. **A hard subject moves its difficulty upstairs; it does not remove it.** Keep the ground floor
   simple and striking even when the subject is not; the complication waits upstairs for whoever
   earned the key.
6. **Do not aim at the full depth of the subject.** The level of the brief caps it:

| Level (brief) | Upper floors | Extras |
|---|---|---|
| introductory (default) | at most one advanced station in a few houses; the complication named and shown, not derived | optional, one or two |
| intermediate | one advanced station in most houses; a quantity worked with | a few |
| advanced | up to two advanced stations a house; the exception treated properly | as many as the subject needs |

7. **An advanced station is an ordinary station** (same fields, same four tests in
   `5-labs.md`) with `"advanced": true`. It does not count in the main path. At most two per
   concept; the ground floor keeps at least one station. Workshops (`process`) and museums
   (`story` without a lab) have no upper floor: put their depth in another house.

## Locks (`riddles`)

A lock is a safe, a computer or a door with a hatch. The learner reads a clue and **types** the
answer: free recall, harder than choosing, which is why locks belong to exploring and are never
needed to finish.

**The answer** is a short term (at most three words) or one number that the learner can recall
from a reading wall or **work out with a lab**. Best of all: a number read off a lab's live
read-out ("where my green sits on the wheel": the learner goes back, drags the marker to green,
reads 120). That sends them back to play, which is the point.

**The clue** is what someone would really leave on a sticky note, or say through a hatch: a
mnemonic, a reminder to oneself, a bit of character. Never a textbook question.

| Good | Bad |
|---|---|
| "pw = red lamp + blue lamp. One word. Don't forget it AGAIN." | "What colour does additive mixing of red and blue produce?" |
| "Combination: where my green sits on the wheel. In degrees. M." | "Enter the hue angle of green." |
| "Password? Bruno's name for the trick the dark wall played on the grey square." | "Name the perceptual phenomenon in station 1." |

**Checklist for a riddle:**

- One defensible answer. Give the accepted variants (`"answer": ["simultaneous contrast",
  "contrast"]`); the engine already forgives case, accents, a leading article, a plural and one
  typo. For a number read off a lab's live value, give `"tolerance": 1`: the learner must read the
  lab, not guess near it; and make sure the station lets them land on the exact value (an integer
  read-out, a fine control on a phone: the example's colour disc has one-degree buttons). If exact
  landing stays fiddly on a phone, use 2 and say why in the brief.
- `from` says where it is taught (`{ "station": "dials" }` or `{ "page": true }`, of this concept
  or another earlier one). After a wrong answer the character thinks of that place: first the
  house, from the third miss the exact spot. The answer is never given.
- The clue does not contain the answer (the validator warns). Text answers stay short enough to
  type on a phone (24 characters).
- **Make what is inside worth the effort**: an advanced insight in 1 to 4 sentences, grounded in
  the sources like everything else; an advanced station; a `further` link. Coins, a tool or a key
  may come with it, never alone: a lock is not a trophy case.
- `where`: `upstairs` (default) or `room` (the ground floor of the house, good for the first lock
  a learner meets). Never guard a ground-floor station: nothing the main path needs may be behind
  a lock (the validator refuses it).

**How many:** none at care *light*; about one per two houses at *standard*; up to one per house
at *curated*. Vary the kinds.

## In course.json

```json
"lab": { "stations": [ { "id": "mix", "...": "..." }, { "id": "gamma", "advanced": true, "...": "..." } ] },
"riddles": [ { "id": "lamps-pc", "kind": "computer", "clue": "pw = red lamp + blue lamp. One word.",
  "answer": ["magenta", "fuchsia"], "from": { "station": "mix" },
  "inside": { "note": "A screen's yellow is red light plus green light ...", "station": "gamma" } } ]
```

The fields are in `schema/course.schema.json` and `engine/docs/SCHEMA.md`; the validator checks
them (`scripts/riddles.mjs`).
