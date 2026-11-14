# The front page

What a visitor sees at `https://<owner>.github.io/<repo>/` (English) and `/it/` (Italian). Built
by `scripts/build-site.mjs` on every push; nothing is written by hand and nothing is added when a
course is added: a new course folder appears as a new card.

## Who it is for, and the choices

A visitor who arrives from a link, mostly on a phone, and decides in five seconds. So:

- **One sentence and one button first.** The headline says what it is in the visitor's terms (walk
  through a town at night, learn a subject, about an hour, no sign-up) and the only strong button
  plays the featured game. The drawn harbour (rain, a lit ship, windows, a dark lighthouse) is the
  mood of the game; it moves slowly and stops with `prefers-reduced-motion`.
- **The catalogue is the page.** "What you can study" comes right after the hero. One card per
  course: a real picture of the town at night with a small picture of a lab over it, the subject,
  a one-line hook, up to three things you will be able to do, time, houses and labs, language,
  level, and a full-width Play button. The grid is `auto-fit`: two cards sit side by side, ten
  make three columns, one is capped in width. Past five courses in more than one language, a
  language filter appears. Order: the featured course (`--featured`), then by name.
- **How it works** in three steps, with the reason in one line and a link to the wiki. It tells
  the first beats of the story and nothing of its end.
- **Make your own** is one section with two routes (the `/play/` page; the template with an AI
  assistant and the sentence to say, with a copy button). Not a manual.
- **Footer**: open source and licence, repository, wiki, and the promise that games run in the
  browser and keep progress only on the device.
- **Look**: the game's own palette (night blue, lamp gold for accents, teal for the one action),
  system fonts, dark only (a light variant would be a second design, not a free one). Text contrast
  is above AA (checked by `engine/scripts/sitecheck.mjs`), targets are 44 px or more, focus is a
  3 px gold ring, there is a skip link, and the order of headings is h1, h2, h3.
- **No requests but the page's own**: no fonts, no CDN, no analytics. CSS and JS are inline (three
  small behaviours: copy, filter, language redirect). All links are relative, so the base path
  `/<repo>/` works; only the share tags need absolute addresses (taken from `GITHUB_REPOSITORY`,
  or `SITE_URL`).
- **Two languages, one generator.** The words are in `T` in the script, written for each language.
  The English page sends Italian browsers to `/it/` once; the switch in the corner goes to the other
  language (`/#en` stops the redirect). No cookie, no storage. Course cards show the course in its own
  language, with its language written on the card.

## Where the data comes from

| On the card | From |
|---|---|
| Title, subject, hook | `title`, `subject`, `pitch` (optional, else `bigIdea`) of `course.json` |
| You will be able to | `goals`, leaving out those that depend on extra (non-core) houses, first three |
| Time, houses, labs | the validator (`validateCourse(...).stats`), the same estimate as `validate.mjs` prints |
| Language, level, tags | `language`, `level` (optional, introductory by default), `tags` (optional) |
| Pictures | `engine/scripts/cataloguemedia.mjs` on the built game |

A course is listed when `courses/<slug>/course.json` is complete and its built game is in
`site/<slug>/` (courses folders starting with `_` are skipped). Without pictures the card has a
drawn placeholder, so the page never breaks.

## Pictures

In CI, after each game is built, headless Chrome opens it and takes the town at night (the HUD
hidden, the middle of the map) and the first lab of the first house, at 1280x720; a canvas in the
same Chrome shrinks them to 960x540 and encodes WebP (quality 0.8; about 50 to 120 kB for the town,
15 to 25 kB for the lab). No image library. The share picture `assets/site-og.jpg` (1200x630) is
kept in the repository: `node scripts/build-site.mjs --out /tmp/og --courses /tmp/none` and then
`node engine/scripts/siteshots.mjs /tmp/og assets/site-og.jpg --og`.

## Checking it by hand

`node engine/scripts/siteshots.mjs site /tmp/site` serves the folder under `/mnemopolis/`, takes the
page on a phone, a tablet and a desktop in both languages, and reports external requests, errors,
overflow and images without alt text. `node engine/scripts/sitecheck.mjs site/index.html` checks
contrast, headings, landmarks, touch targets and the tab order.

## Known limits

Only dark. The catalogue shows a course's text in its own language, so the Italian page may show
English cards. The hero's play button names a fixed featured course in the workflow
(`--featured chroma`). The first picture of a lab is the question screen, not the lab in use.
