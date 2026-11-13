# Brief: How Sound Works

The showcase of a low-token game: the tokens go to the subject (sources, map, key concepts,
questions) and to the labs, designed one by one for their concepts. Everything else is the
engine's default.

- **Subject:** sound, for curious adults and secondary-school students with no physics.
- **Language:** English.
- **Size:** pocket: 4 core concepts, one district, 5 lab stations (two on the wow concept), 6
  questions per concept, a League of 6.
- **Care:** standard
- **Level:** introductory.
- **Wow concept:** pitch. Its second station lets the learner sketch how wavelength depends on
  frequency before the real curve (343 m/s ÷ f) is drawn over the guess.

## What was customised, and what was not

| Customised (the subject) | Left to the engine's defaults |
|---|---|
| `course.json`: content, map, questions, lab designs | no `world.json`: town, theme, houses, names, guide, League host by seed |
| `labs/wave.js` (one station, 50 lines with the kit) | no emblems, no signs, no experts, no riddles, no animations |
| `labs/pitch.js` (two stations: the slider-reveal pattern called from code and extended, 27 lines; a custom sketch, 46 lines) | phrases, sounds, music, thoughts, ambient life: standard |
| two stations as ready-made patterns, pure data (`compare` for decibels, `sort` for mediums) | the build: `node scripts/pack.mjs courses/pocket-demo` into the prebuilt player |

## Lab plan

| Concept | Station | How it is built | Why this way |
|---|---|---|---|
| wave | Push the air | custom code | the wrong belief (the air travels) needs one picture only this concept has: molecules shifted by a travelling squeeze, one of them watched |
| pitch | More per second | `sliderReveal` from code, plus the real tone and the squeezes counted on the trace | a cause-effect pattern fits; the tone and the count are what make it this concept |
| pitch | Guess the curve | custom code | predict-then-see on a curve: the learner's own sketch must be the object |
| loudness | Ten times | ready `compare` (data) | two speakers side by side and a measured ratio is exactly the pattern |
| medium | Sort the mediums | ready `sort` (data) | a category with a criterion, each card explaining itself |
