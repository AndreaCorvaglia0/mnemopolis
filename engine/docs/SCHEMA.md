# The course database: `engine/src/course/`

> This describes the engine as it is today, with the course in `engine/src/course/course.js`. It will change when the engine reads `course.json` (see `docs/ROADMAP.md`).

Three places hold the whole course. Nothing else in the engine contains content.

| File | Holds |
|---|---|
| `course.js` | The world, the districts, the houses, the questions, museum timelines |
| `pages.js` | The middle part of each reading page, and small animations for them |
| `labs/index.js` + `labs/<id>.js` | One lab per house (not for museums) |

Run `npm run check` after every change. It enforces the limits below.

## `course.js`

```js
export const COURSE = {
  id: 'my-course',            // save-game key. Change it for every course.
  title: 'Chroma Town',       // name of the town (title screen, tab title)
  subject: 'How colour works',// one line under the title
  bigIdea: '...',             // one sentence, 28 words at most
  credit: '...',              // optional small line on the title screen (data sources, author)

  hub: {
    name: 'Prism Square',
    monument: 'fountain',     // fountain | obelisk | statue | arch | bell | stones
    guide: { name, look, hi, options: [[question, one-line answer], ...] },
  },

  districts: [                // 1 to 4, in learning order (clockwise from the west)
    {
      id, name,
      nature: 'river',        // river | shore | forest | meadow | hill   (all different)
      landmark: 'obelisk',    // as hub.monument                           (all different)
      idea: '...',            // the theme in one sentence, 18 words at most
      resident: { name, look, hi, options },   // optional person on the plaza
      places: [ /* 1 to 4 houses, see below */ ],
    },
  ],

  league: { name, host: { name, look }, size: 8, pass: 0.7 },
};
```

### A house (`places[]`)

```js
{
  id: 'lamps',                // lowercase letters and digits; also the key of its lab and page
  kind: 'lab',                // lab | archive | hall | studio | observatory | workshop | museum | cave
  name: 'Three Lamps House',
  sign: 'LAMPS',              // on the building, 9 characters at most
  concept: 'Additive mixing', // the name of the concept (2 to 5 words)
  objective: 'Predict the colour of any mix of red, green and blue light.',  // starts with a verb
  idea: '...',                // the concept in one sentence, 28 words at most
  anchor: { type: 'example', text: '...' },   // analogy | metaphor | example | contrast
  host: { name: 'Lux', look: 'tech', hi: 'One line.' },
  remember: ['...', '...'],   // 1 to 3 lines
  explain: { q: 'Why ...?', a: 'Model answer in two or three sentences.' },
  questions: [
    { level: 1, q: '...', options: ['..', '..', '..', '..'], answer: 1, why: '...' },  // 1 to 3 at level 1
    { level: 2, q: '...', options: [...], answer: 0, why: '...' },                    // at least one at 2 or 3
  ],
  // museum only:
  kinds: { key: ['Label', '#colour'], ... },   // optional threads that colour the plaques
  timeline: [ { year, kind, title, who, text, why, src }, ... ],   // 4 to 14
}
```

Character looks available: `mentor`, `kid`, `nurse`, `fisher`, `archivist`, `surveyor`, `tech`,
`keeper`, `tess`.

## `labs/<id>.js`

```js
import { h, seg, slider, readout } from '../../lab/shell.js';
import { canvasPane, draggable, predict } from '../../lab/kit.js';

async function mount(ctx) { /* draw into ctx.stage, add controls to ctx.controls */ }

export default {
  title: 'Additive mixing',   // shown next to the house name
  stepper: true,              // optional: previous/next instead of tabs (use it for a workshop)
  wide: true,                 // optional: a wider side panel (use it with code panels)
  stations: [
    { tab: 'Three lamps',     // short name
      short: 'LAMPS', zone: 'Mix',   // workshop only: label on the machine, colour group
      goal: '...', tries: ['...', '...'], takeaway: '... <b>key words</b> ...', source: '...',
      code: { ... },          // optional code panel, see lab/code.js
      mount },
  ],
};
```

`ctx` inside `mount`:

| | |
|---|---|
| `ctx.stage` | The large area on the left. Append a `canvasPane` or your own elements. |
| `ctx.controls` | The column for controls and readouts, under "Try this". |
| `ctx.did(i)` | Tick task `i`. When all are ticked, the takeaway appears. |
| `ctx.reveal()` | Show the takeaway directly (when tasks are not the right fit). |
| `ctx.alive()` | `false` once the learner has left the station. Check it after every `await`. |
| `ctx.onCleanup(fn)` | Stop timers, audio and animation frames here. |
| `ctx.code`, `ctx.onCode` | The code panel and its change handler, when the station has `code`. |

Helpers (`lab/shell.js`, `lab/kit.js`): `h(tag, attrs, ...children)`, `seg(options, value, onChange)`,
`slider(label, min, max, value, onInput, { step, fmt })`, `readout(html)`,
`canvasPane(stage, w, h, caption)` giving `{ g, cv, drag(fn), hover(fn), caption(text) }`,
`draggable(pane, items, redraw, { bounds })`, `predict(controls, question, options)`,
`hslToRgb`, `rgbCss`. Register every lab in `labs/index.js` under the house id.

## `pages.js`

```js
export const ANIMS = { name(g, seconds, canvas) { /* draw one frame on a 720 x 400 canvas */ } };
export const PAGES = { lamps: { html: `<h3>...</h3><p>...</p> ...` } };
```

The engine adds the frame around your HTML: number and district, concept, idea, anchor, then your
sections, then "Explain it yourself" and "Remember". Write two to four sections of under 120
words. For a figure drawn in code use
`<canvas data-anim="name" width="720" height="400"></canvas>`. Images can be imported in
`pages.js` (`import url from './img/x.png'`) and used as `<img src="${url}">`; they are inlined
in the page, so keep them small.

## Limits enforced by `npm run check`

1 to 4 districts; 1 to 4 houses each; distinct landscapes and landmarks; every house has
objective, idea (28 words), 1 to 3 `remember` lines, 1 to 3 level-1 questions and at least one of
level 2 or 3; every question has 3 or 4 options and a `why`; a house has 1 to 3 stations (a
workshop up to 8); a station has a goal (26 words), 1 to 3 tasks, a takeaway and a `mount`; a
museum has 4 to 14 plaques.
