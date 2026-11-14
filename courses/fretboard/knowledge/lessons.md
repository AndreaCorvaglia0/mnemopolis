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
  doc line updated). Tested in `riddles.test.mjs`.
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

## Sound (the kit's sound API, first used by a lab here)

- **The switch was one file**, as planned: `labs/lib/sound.js` first rendered its own additive
  pluck on its own AudioContext, then became a thin wrapper over the kit's `sound(ctx)`. The
  stations did not change. Owning that seam is worth recommending to every course with sound.
- **Pitch is exact.** The kit's Karplus-Strong pluck, measured offline in Node by autocorrelation
  for every frequency the labs ask for (the six open strings, the octave at fret 12, harmonics 2 to
  4, the notes of the scale and chord stations): worst error 0.10 cent.
- **`fundamental()` in `systems/sound/synth.js` returns the strongest partial, not the
  fundamental.** For a bright pluck at 110 Hz it reports 330 Hz, and at E2 1154 Hz. Anyone checking
  pitch with it will think the pluck is wrong. *Proposal:* rename it `strongest()`, and add a
  period-based `fundamental` (autocorrelation, as in this course's check).
- **Missing: a sustained tone with harmonics.** `hold` is a sine or a triangle. Two pure sines a
  fifth apart never beat, so "the fifth is smooth because harmonics meet" needs complex tones; the
  course builds each sustained string from six `hold`s at 1/k. *Proposal:* `hold(f, { harmonics: 6 })`.
- **`on` is false until the context runs**, and nothing queues: a sound asked for before the first
  gesture is lost. In labs the learner has always tapped, so it never mattered here.
- **Not measured:** the live chain (the lab bus, the limiter, the ducking, the analyser), and how
  it sounds. Levels were kept modest (single notes at gain 0.5, strums at 0.34 per string, sustained
  harmonics at 0.16/k). Nobody has listened to this course.
- Everything drawn is computed from the same numbers as the sound, so every station works on mute;
  one gentle line says once that sound helps.

## Mini-games

- The ready kinds covered all three games with data only (`which` with generated plucked pairs,
  `sort-fast` with sounding cards for intervals and for major or minor). A fourth, custom game
  ("Find the note", the course's neck from `labs/lib/`) was written and pictured, then removed when
  the course was closed at three games; it is in the git history (commit b5b587e).
- **A custom game that draws on a canvas gets a stage with no height** (`.gm-stage` is a centred
  column), and the lab's CSS is not on that screen; the game sets its own box and styles. *Proposal:*
  a `g.canvas(w, h)` that returns a pane sized like a lab's.
- **`g.bot` must be written by hand** for `worldshots` to play a custom game; without it the script
  waits for the timer and then times out on the next game. Worth a line in `10-games.md`.

## Left for later

- "Find the note" against the clock: custom game, written and working (git history), dropped to keep three games.
- `ctx.onPhase(fn)` in the lab frame, instead of polling `ctx.phase()` (here `onPhase` in `labs/lib/sound.js`).
- A picture that keeps its height on a phone when the result sheet opens (the done state squeezes text).
- `hold(f, { harmonics })` in the sound API; `fundamental()` renamed and a period-based one added.
- `g.canvas(w, h)` for custom games that draw; a line in `10-games.md` that `g.bot` is needed for the pictures.
- Ignore colons between digits (2:1) in `prose.mjs`; say in `9-prose.md` that digits count as words.
- A "minutes left" line in the validator's summary, and the station budget of a five-house core in the skill.
- The Twelve-Hour Tower's question shows a neck with twelve frets: a careful learner can count them before answering.
- A second listening pass by a person: nobody has heard the course; levels were set by numbers only.
- The live Web Audio chain (lab bus, limiter, ducking, analyser) measured in a browser.
