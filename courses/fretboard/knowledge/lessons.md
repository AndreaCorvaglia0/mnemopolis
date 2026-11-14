# Lessons for the template, from building Port Octave

What helped, what got in the way, and short proposals. Written while building the second showcase
course (music theory for guitarists, with real sound).

## The method

- **The syllabus survey paid off, and the method should ask for it explicitly.** `1-sources.md`
  asks for two or three reference outlines. Reading fourteen (guitar courses, books, university
  courses, physics pages) changed two decisions: intervals lost their house (two respected guitar
  courses teach them after triads, using thirds and fifths where needed), and the pentatonic box
  became an early extra (the pattern-first books start with it). *Proposal:* at care curated, a
  `knowledge/syllabi.md` with a comparison table (source, audience, order) and a short argued
  conclusion; one line in `1-sources.md` and the template.
- **The hour decides the shape of the core, and nobody sees it coming.** The validator's model
  (6.5 min a station, 4.5 a house, 20 s a final question) allows **five houses with one ground
  station each**, or four houses with six stations. The brief asked for "5 or 6 houses" and the
  knowledge-base skill says "1 to 3 stations: see it, the rule, use it", which together do not fit.
  *Proposal:* print the budget in the skill: "about 34 minutes of stations for a core of 5, so one
  station per core house; the second idea goes upstairs". A "minutes left" line in the validator's
  summary would make the trade-off visible while designing.
- **Word limits count numbers.** "major is four then three half steps" passes, "4 + 3" fails less
  readably. Fine as it is, but say in `9-prose.md` that symbols and digits count as words.
- **Ratios contain colons**, so the prose checker's "chain of colons" warning fires on "2:1 and
  3:2". It did not fire here because the sentences had connectives, but a course on ratios will
  meet it. *Proposal:* ignore colons between digits in `prose.mjs`.

## The validator and the engine (small fixes made here)

- **Lock answers with musical signs were silently wrong.** `normText` stripped `#`, so "G#"
  matched "G" and a lock whose answer is G♯ opened on G. Fixed in
  `engine/src/mechanics/riddles/match.js`: `#` and `♯` read as "sharp", `♭` as "flat" (and the
  doc line updated). Worth a test in `riddles.test.mjs`.
- **Trades.** No trade fitted a luthier or a piano tuner, and a generic home loses the point of an
  expert. Added `luthier` (bench, drawers, harp corner) and `tuner` (piano, bench) to
  `gen/interior/trades.js`, using existing zones; `npm test` passes. The trade list in
  `3-path.md` and `WORLD.md` was updated.
- **A course cannot share code between its lab files** (packing accepts only engine imports). This
  course needs one neck, one dial and one sound helper in seven files; copying them seven times
  would have been worse than any other fault. The labs import `labs/lib/*.js`; the bundled build
  resolves it, and packing was extended to carry course-local modules (see the commit). *Proposal:*
  document `labs/lib/` in `8-ready-labs.md` ("The import surface").
- **`shots:course`** (new, `engine/scripts/courseshots.mjs`): every station of one course,
  ground floor and upstairs, before, mid and done, desktop and phone, into
  `/tmp/<prefix>-*.png`. `shots:lab` walks one station only and `shots:ready` skips upstairs.

## The lab kit

- **The prediction freezes the picture but cannot hide it.** Several stations drew the answer
  (a beat rate, the notes of a chord, a dial of twelve when the question was "how many notes")
  while the question was open. The frame cannot know; the author must check each "before" picture.
  A helper to react to the phase (`onPhase` here, polling `ctx.phase()`) would be better as
  `ctx.onPhase(fn)` in the frame. *Proposal:* add it, and add to the author's card: "draw the ask
  state on purpose; hide numbers and labels that answer the question".
- **The done state on a phone squeezes the picture** into the space above the result sheet, and
  text that keeps 16 screen pixels then overlaps. `stage({ fluid: true })` helps a little.
  *Proposal:* when the result sheet is open, let the picture keep its height and scroll the sheet
  over it, or draw stations a "compact" variant (`pane.compact`).
- **`pane.items`** is how the playthrough bot finds what to tap. Exposing named places from a
  custom station (a getter, so it follows the layout) made recipes short and real (real taps at
  real positions). *Proposal:* document it on the author's card as the way to make a station
  testable.

## Sound

- A synthesised plucked string by additive synthesis (harmonics of a string plucked at a fifth of
  its length, each decaying a little faster) is exact in pitch by construction: measured in Node
  by autocorrelation within 0.03 Hz of what was asked, for all six open strings.
- **Beats need harmonics.** Two pure sines a fifth apart never beat; the lesson "the fifth is
  smooth because harmonics meet" needs complex tones. The station builds each string from six
  sustained sines (1/k amplitudes). A sound API should offer a sustained tone with harmonics
  (`hold(f, { harmonics: 6 })`), not only sine and triangle.
- Everything drawn is computed from the same numbers as the sound, so every station works on mute;
  one gentle line says once that sound helps.
