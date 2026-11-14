# Step 10 (optional). Mini-games, experience and sound

Three things a course may add once its concepts, labs and questions are designed. None is
required: a course without them plays exactly as before, and the main path never needs them.

1. **Mini-games** (`games` in `course.json`): short arcade-like rounds of one skill, started by
   an interaction in the town. Practice dressed as play.
2. **Withheld lines** (`withheld` in `course.json`): things a person starts to tell you and stops
   ("No. Too early for that."), told once you have been around long enough. Experience decides.
3. **Sound in labs and games**: a small sound API (tones, a plucked string, a soft piano, beats,
   chords, glides, a scope) for subjects that can be heard.

The engine side is in `engine/docs/ENGINE.md` ("Experience", "Mini-games", "Sound for labs and
interactions"); the fields are summarised in `engine/docs/SCHEMA.md`. Every complete JSON
example below is checked by `npm test` (`engine/tests/games.test.mjs`), so it cannot rot.

## When a mini-game is the right tool

A mini-game is for **fluency**, not for understanding. Use one when, after the lab has made an
idea clear, the learner gains from doing the same small judgement many times, fast:

- a perceptual discrimination (which of two notes is higher, which swatch is lighter);
- a quick recognition (this triplet is that colour, this symbol is that name);
- a classification (warm or cool, consonant or dissonant, solid or liquid);
- an estimate that sharpens with practice (a frequency, a date, a hue);
- a short memory span (repeat a melody, a sequence of steps).

Not for: explaining (that is the lab), checking understanding (that is remembering with the
owner), or anything the learner has not met yet. A game never teaches a new fact: every item in
it must already be in the concept's page, lab or questions, and must not contradict them. This is
the author's duty; the validator cannot check meaning.

Two or three games are plenty for a course; one per concept is the most. Games are never
required: the notebook never lists them, the ending never waits for them.

## A game in `course.json`

`games` is an optional array at the top level of the course (beside `concepts`).

```json
{
  "id": "higher",
  "title": "Higher or lower?",
  "concepts": ["pitch"],
  "kind": "which",
  "where": "town",
  "object": "piano",
  "rounds": 8,
  "learn": "More squeezes per second: a higher note.",
  "data": {
    "ask": "Which note is higher?",
    "pick": "max",
    "make": { "kind": "tone", "from": 220, "to": 880, "gap": [7, 0.5], "unit": "semitones" }
  }
}
```

| Key | |
|---|---|
| `id` | unique in the course: lowercase letters, digits, dashes. The save keeps the best score by it |
| `title` | at most 5 words; shown on the start and result screens and in the notebook's Clues |
| `concepts` | one or more concept ids that the game practises. It opens only when each of them is remembered (its owner helped: the badge), or, for a concept with no remembering, its lab done. A game must never ask what has not been met |
| `unlock` | optional: `"remembered"` (default, as above) or `"lab"` (open as soon as the concepts' labs are done) |
| `kind` | `which`, `match-fast`, `sort-fast`, `odd-one-out`, `sequence`, `estimate`, or `custom` (code: below) |
| `where` | `"town"` (default): an object on a spot of the town, placed by the engine; `"person"`: a townsperson offers it ("Fancy a game?"); `"host"`: the owner of the first concept's house offers it, in the room, once they remember |
| `object` | for `"town"`: what stands there, `piano`, `board`, `hat` (a street musician's hat), `box` (a curiosity box, like an old arcade cabinet), `bench` (someone plays there). Default: chosen by the seed, a piano when the game makes sound |
| `rounds` | 3 to 20, default 8 (`match-fast`: boards, default 3) |
| `learn` | optional: one line shown on the result screen, "what this practises". At most 16 words |
| `data` | what the kind needs (below) |

The frame does the rest: the title, a 3-2-1 start, the rounds, a timer or a counter where the
kind uses one, immediate feedback with a sound, the result (score, best, the `learn` line, coins
and experience earned, Again, Done). Esc or Done leaves at any time, with no penalty.

**Difficulty** adapts by itself: a staircase that goes one step harder after two right answers in
a row and one step easier after a miss, starting where the last session left off (one step back).
The data gives the easy and the hard end of a range (`gap: [easy, hard]`, `time: [easy, hard]`);
the staircase moves between them. Listed items have no difficulty of their own: the staircase then
only shortens the time where there is one.

**Coins**: 2 per right round, plus up to 4 more by difficulty, +1 for a quick answer, +1 per
round in a streak of three or more (at most +3). A typical game of 8 rounds pays 25 to 60 coins.
From the fourth play of the same game on the same day, coins are halved. Nothing is ever lost.

### Items

Every kind shows **items**. An item is a string (shown as text) or an object with any of:

| Key | |
|---|---|
| `text` | a word, a number, a symbol |
| `colour` | a CSS colour (`"#e33"`, `"rgb(255,0,0)"`, `"hsl(120 80% 50%)"`): a swatch |
| `shape` | `circle`, `square`, `triangle`, `star`, drawn at `size` (0.2 to 1) |
| `sound` | something to hear (below); the item gets a Play button and plays on its turn |
| `value` | the number a criterion compares (`which`, `estimate`) |
| `label` | what to call the item when it is not text (a sound: "1", "2" by default) |

A **sound** is an object: `{ "hz": 440 }`, `{ "hz": [261.63, 329.63, 392] }` (together),
`{ "note": "A4" }`, `{ "notes": ["C4", "E4", "G4"] }`, or `{ "ratios": [1, 1.25, 1.5], "hz": 220 }`
(exact ratios over a base, for just intervals). Optional: `"voice"` (`pure`, `pluck`, `piano`,
`bell`; default `pure`), `"dur"` in seconds (default 0.9), `"arp"` (seconds between the notes of
a chord, 0 = together). Note names: `C4` to `B4` around middle C, `#` and `b` for accidentals,
A4 = 440 Hz, equal temperament; Italian names work too (`Do4`, `La4`, `Sib3`).

### `which`: pick one by a criterion

Two (or `count`: up to 4) items are shown side by side, or played one after another when they
are sounds; the learner picks the one with the largest (`"pick": "max"`) or smallest
(`"pick": "min"`) `value`. Items are listed, or generated by a rule (`make`).

```json
{
  "id": "lighter",
  "title": "Which is lighter?",
  "concepts": ["wheel"],
  "kind": "which",
  "rounds": 10,
  "learn": "Lightness is how much white is in a colour.",
  "data": {
    "ask": "Which swatch is lighter?",
    "pick": "max",
    "make": { "kind": "hsl", "vary": "l", "h": [0, 360], "s": 0.7, "from": 0.2, "to": 0.8, "gap": [0.3, 0.04] }
  }
}
```

| `make.kind` | Generates | Keys |
|---|---|---|
| `tone` | pure tones (value: the frequency in Hz) | `from`, `to` (Hz), `gap: [easy, hard]` in `unit` (`semitones`, default, or `hz`), `voice` |
| `hsl` | swatches (value: the varied component) | `vary` (`h`, `s` or `l`), `from`, `to` (0..1 for s and l, degrees for h), `gap`; the other two components fixed (`h`, `s`, `l`: a number or a `[min, max]` range drawn per round) |
| `number` | numbers as text (value: the number) | `from`, `to`, `gap`, `decimals` (default 0) |
| `size` | the same shape at two sizes (value: the size) | `shape`, `from`, `to` (0.2..1), `gap` |

Listed items instead of a rule: `"items": [{ "text": "1066", "value": 1066 }, ...]` (at least
three, each with a `value`); every round draws `count` items with different values.

### `match-fast`: pairs against the clock

A board of `per` pairs (default 4): the left column and the right column shuffled; the learner taps
a left item, then its partner. A round is one board, with `time` seconds for it.

```json
{
  "id": "triplets",
  "title": "Name that triplet",
  "concepts": ["lamps"],
  "kind": "match-fast",
  "rounds": 3,
  "learn": "Each RGB triplet is how strongly each lamp shines.",
  "data": {
    "ask": "Match each triplet to its colour.",
    "per": 4,
    "time": [30, 14],
    "pairs": [
      ["255, 0, 0", { "colour": "#ff0000", "label": "red" }],
      ["0, 255, 0", { "colour": "#00ff00", "label": "green" }],
      ["0, 0, 255", { "colour": "#0000ff", "label": "blue" }],
      ["255, 255, 0", { "colour": "#ffff00", "label": "yellow" }],
      ["0, 255, 255", { "colour": "#00ffff", "label": "cyan" }],
      ["255, 0, 255", { "colour": "#ff00ff", "label": "magenta" }],
      ["255, 255, 255", { "colour": "#ffffff", "label": "white" }],
      ["0, 0, 0", { "colour": "#000000", "label": "black" }]
    ]
  }
}
```

At least `per` pairs; more pairs than `per` make each board different. Left and right items are
items (text, colour, sound...). A wrong tap costs a second of the clock and a point of the board.

### `sort-fast`: into bins before time runs out

Cards come one at a time; the learner sends each to one of two or three bins (tap a bin, or the
arrow keys and 1 2 3). A round is one card; `time` is the seconds per card.

```json
{
  "id": "warm-cool",
  "title": "Warm or cool?",
  "concepts": ["wheel"],
  "kind": "sort-fast",
  "rounds": 10,
  "data": {
    "ask": "Warm or cool?",
    "bins": ["warm", "cool"],
    "time": [6, 2.5],
    "cards": [
      { "colour": "#e8452c", "bin": "warm" },
      { "colour": "#f5a623", "bin": "warm" },
      { "colour": "#f8d34a", "bin": "warm" },
      { "colour": "#2a7de1", "bin": "cool" },
      { "colour": "#33b5a6", "bin": "cool" },
      { "colour": "#6a4fc4", "bin": "cool" }
    ]
  }
}
```

`bin` is a bin's name or its index. At least four cards, each bin used at least once.

### `odd-one-out`: four items, one does not belong

```json
{
  "id": "odd-primary",
  "title": "The odd one",
  "concepts": ["lamps", "print"],
  "kind": "odd-one-out",
  "rounds": 6,
  "data": {
    "ask": "Which one does not belong?",
    "groups": {
      "a primary of light": ["red", "green", "blue"],
      "a primary of ink": ["cyan", "magenta", "yellow"]
    },
    "why": "{odd} is {oddGroup}; the others are each {group}."
  }
}
```

With `groups` (two or more, three items or more each), every round takes three items of one group
and one of another; `why` (optional) is shown after the answer, with `{odd}`, `{group}`,
`{oddGroup}` filled in. Or list the rounds: `"sets": [{ "items": [..4..], "odd": 3, "why": "..." }]`.

### `sequence`: repeat a growing sequence

Pads (3 to 6) each with a sound and/or a colour light up in a sequence; the learner repeats it.
The staircase sets the length: one longer after two right, one shorter after a miss.

```json
{
  "id": "echo",
  "title": "Echo the tune",
  "concepts": ["pitch"],
  "kind": "sequence",
  "rounds": 8,
  "learn": "Higher pads, higher frequencies.",
  "data": {
    "ask": "Listen, then play it back.",
    "start": 3,
    "longest": 8,
    "pads": [
      { "label": "220 Hz", "sound": { "hz": 220, "voice": "pluck" }, "colour": "#6f93e0" },
      { "label": "330 Hz", "sound": { "hz": 330, "voice": "pluck" }, "colour": "#4fd1c5" },
      { "label": "440 Hz", "sound": { "hz": 440, "voice": "pluck" }, "colour": "#ffcf5a" },
      { "label": "660 Hz", "sound": { "hz": 660, "voice": "pluck" }, "colour": "#ff7a6b" }
    ]
  }
}
```

### `estimate`: place it on a line

Something is shown or played; the learner drags a marker along a scale and confirms. A round is
right when the error is within `close` (a share of the scale's width: `[easy, hard]`); the score
grows with closeness.

```json
{
  "id": "guess-hz",
  "title": "Guess the frequency",
  "concepts": ["pitch"],
  "kind": "estimate",
  "rounds": 6,
  "learn": "Each doubling of frequency is one octave higher.",
  "data": {
    "ask": "How many hertz is this tone?",
    "scale": { "from": 100, "to": 3200, "log": true, "unit": "Hz", "marks": [100, 200, 400, 800, 1600, 3200] },
    "make": { "kind": "tone", "from": 120, "to": 3000 },
    "close": [0.2, 0.07]
  }
}
```

| Key | |
|---|---|
| `scale` | `from`, `to`, `unit`, `marks` (labelled ticks), `log` (each doubling the same width: frequencies), `wrap` (the ends meet: hues, angles), `paint: "hue"` (the line painted as a rainbow of hues) |
| `make` | `tone` (plays a tone; value in Hz), `hue` (shows a colour; value in degrees, `s` and `l` fixed), or `number` (shows nothing but `ask` with `{value}`... rarely useful) |
| `items` | instead of `make`: `[{ "sound": { "note": "A4" }, "value": 440 }, { "text": "The Battle of Hastings", "value": 1066 }]` |
| `close` | `[easy, hard]`: the share of the scale within which an answer is right (default `[0.15, 0.05]`) |

### `custom`: your own game

`"kind": "custom"` and code in `courses/<slug>/games/<id>.js`, written like a lab station: it may
import only from `engine/src/lab/kit.js` (and the other lab modules), so it works in the packed
player too.

```js
// courses/<slug>/games/chord-quality.js: is this chord major or minor?
import { h } from '../../../engine/src/lab/kit.js';

export default {
  mount(g) {
    // g.stage: the play area; g.data: this game's data; g.lang: 'en' | 'it'
    const roots = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'];
    let major = true;
    const play = () => {
      const r = g.sound.note(g.pick(roots));
      g.sound.chord(major ? [r, r * 2 ** (4 / 12), r * 2 ** (7 / 12)] : [r, r * 2 ** (3 / 12), r * 2 ** (7 / 12)], { voice: 'piano' });
    };
    const again = h('button', { class: 'gm-btn', onclick: play }, g.t({ en: 'Play again', it: 'Riascolta' }));
    const pick = (m) => g.answer(m === major, { said: m ? 'major' : 'minor' });
    g.stage.append(again, h('div', { class: 'gm-row' },
      h('button', { class: 'gm-btn big', onclick: () => pick(true) }, 'Major'),
      h('button', { class: 'gm-btn big', onclick: () => pick(false) }, 'Minor')));
    g.onRound((n, level) => { major = g.rng() < 0.5; play(); });
  },
};
```

| The game's context `g` | |
|---|---|
| `g.stage` | the play area (an element); fill it once in `mount`, update it in `onRound` |
| `g.data`, `g.lang`, `g.t({ en, it })` | the game's `data`, the language, a string in the language |
| `g.onRound(fn)` | `fn(n, level)` at the start of every round: `n` from 1, `level` the difficulty 0..1 |
| `g.answer(right, { said, weight })` | ends the round: the feedback and its sound, the points, then the next round or the result. `said` is shown ("You said major"); `weight` multiplies the round's points (a board of pairs) |
| `g.timer(seconds, onEnd)` | a visible countdown for this round; `onEnd` usually calls `g.answer(false)`. Returns `{ stop(), left() }` |
| `g.say(text)` | one line in the feedback bar |
| `g.sound` | the sound API below, bound to the game (stopped when it closes) |
| `g.rng()`, `g.pick(list)`, `g.shuffle(list)` | random numbers for this play |
| `g.level()`, `g.round`, `g.rounds` | the difficulty now, the round number, how many rounds |
| `g.alive()`, `g.onCleanup(fn)` | as in a lab station |

The ready kinds are written on this same context; their code (`engine/src/mechanics/games/kinds/`)
is the best example of a custom game.

## Withheld lines: "No. Too early for that."

People in town sometimes start to tell you something, look at you, and stop: you have not been here
long enough. Once your experience reaches a tier, they tell it, once, and the notebook keeps it under
Clues. The engine has a dozen of its own, about its extras (the lantern cat, the locks, the fog,
the lighthouse); a course may add its own optional knowledge the same way:

```json
{
  "withheld": [
    {
      "id": "overtones",
      "by": "pitch",
      "tier": "known",
      "teaser": "A plucked string does something odd. It sings more than one—",
      "told": "A plucked string sounds its own note and, more quietly, two, three and four times that frequency at once. Those are its overtones."
    }
  ]
}
```

| Key | |
|---|---|
| `id` | unique in the course |
| `by` | optional: a concept id (the owner of that house tells it, after they remember) or `"town"` (a townsperson, by the seed; the default) |
| `tier` | the tier at which it is told: `passing`, `settling`, `known` or `home` (tiers below) |
| `teaser` | optional: the start of the sentence that is cut short. The refusal ("No. Not yet.") is the engine's, in varied words |
| `told` | the content, one to three sentences, from the course's sources like everything else: optional knowledge, never needed by the main path |

At most six. A withheld line is a reward for staying, not a lock: nothing of the main path may
depend on it.

## Experience: how it is earned, what it does

Experience is everything the player has done, as one number that never goes down. Coins are what
one can spend; experience is who one has become here.

| | Experience |
|---|---|
| every coin ever earned (answers, games, locks) | 1 each |
| a house remembered | 50 |
| a lab station done (ground floor) | 8 |
| an advanced station done | 25 |
| a memento found | 15 |
| a lock opened | 40 |
| a secret found | 15 |
| an obstacle opened | 20 |
| a mini-game's best score | up to 40 per game |
| a house brought back from the returning fog | 30 |
| a day on which the player came back | 20 (once a day) |
| the keeper | 100 |

**Tiers.** `arrival`, `passing` (passing through), `settling` (settling in), `known` (known
here), `home` (at home). The thresholds scale with what the course offers: a pocket course and a
large one both reach `home` at about full completion plus some days of practice; the first change,
to `passing`, comes within the first house. Today the tiers are mostly **perceived**: people greet
you by them, the keeper and the purser notice them, the notebook draws them. Two things are real:
withheld lines are told at their tier, and one door on the square opens only to someone the town
knows. Later, endings will depend on them (`docs/STORY.md`, "Endings (planned)").

`world.json`: `"experience": false` switches all of this off (the town as before); `"games": false`
hides every mini-game.

## Sound for labs and games

Everything is synthesised; nothing is loaded. A station gets the API from the kit:

```js
import { stage, sliders, sound } from '../../../engine/src/lab/kit.js';

async function beats(ctx) {
  const s = sound(ctx);                       // stopped when the station closes; ducks the music
  const ctl = sliders(ctx, [{ id: 'f', label: 'Second string', min: 430, max: 450, step: 0.5, value: 444, unit: 'Hz' }],
    (id, v) => { pair.freq(1, v); });
  const pair = s.beats(440, ctl.v.f, { hold: true });   // two tones together: you hear |f1 - f2| beats a second
  const scope = s.scope();                    // what is sounding, to draw
  stage(ctx, { wide: [760, 420], tall: [480, 560] }, (d, pane) => {
    const wave = scope.wave(512);             // Float32Array -1..1 (computed from the frequencies when audio is off)
    d.clear(); /* draw wave */
  }, { animate: true });
}
```

| `s = sound(ctx)` | |
|---|---|
| `s.tone(f, { dur, attack, release, gain, type })` | a pure tone (`type`: sine, triangle) |
| `s.pluck(f, { dur, gain, bright })` | a plucked string (Karplus-Strong), the guitar's voice; `f` in Hz or a note name |
| `s.piano(f, opts)`, `s.bell(f, opts)` | a soft piano, a bell |
| `s.chord(notes, { voice, arp, dur, just, root })` | notes: names, Hz, or with `just: true` exact ratios to the root (`["C4", "E4", "G4"]` becomes 1, 5/4, 3/2) |
| `s.beats(f1, f2, { dur, hold })` | two tones together, exactly at f1 and f2; with `hold` returns `{ freq(i, f), stop() }` |
| `s.hold(f, { voice, gain })` | a sustained tone: `{ freq(f, glide), gain(g), stop() }` for a slider |
| `s.stopAll()` | silence (also done when the station closes) |
| `s.scope()` | `{ wave(n), spectrum(n), sounding() }`: from an analyser, or computed from what is playing when sound is off |
| `s.on` | false when the learner switched sound off: draw anyway |
| `sound.note('A4')` / `sound.midi('A4')` / `sound.name(69, lang)` | 440 / 69 / "A4" or "La4" |
| `sound.interval(7, lang)` | "perfect fifth" / "quinta giusta" |
| `sound.ratio('fifth')` | 3/2 (just intervals by name) |

Levels are safe by construction: a limiter, a ceiling well below the music's motif, gentle
attacks, the ambient music ducked while a lab plays sound. Controls of the kit (sliders, buttons,
drags, sorting snaps, task ticks) make small sounds by themselves; a station that wants silence
passes `{ quiet: true }` to `stage`, or calls `ctx.quiet()`.
