#!/usr/bin/env node
// Builds the front page of the site (English at /, Italian at /it/) from the courses.
//   node scripts/build-site.mjs [--out site] [--courses courses] [--featured <slug>]
// Run after the games are built into <out>/<slug>/index.html: a course is listed when its game is there.
// Reads courses/*/course.json (folders starting with "_" are skipped), asks the validator for the play
// time, and uses the pictures <out>/_site/media/<slug>-town.webp and -lab.webp when they exist
// (engine/scripts/cataloguemedia.mjs makes them); without a picture the card has a drawn placeholder.
// No dependencies, no network, no build step on the page: see docs/SITE.md for the choices.
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCourse } from '../skills/knowledge-base/scripts/validate.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = path.resolve(arg('out', 'site')), COURSES = path.resolve(arg('courses', 'courses')), FEATURED = arg('featured', '');
// Public addresses, for the share tags only (the page itself uses relative links). In CI they follow the
// repository, so that a copy of the template gets its own.
const REPO = process.env.GITHUB_REPOSITORY || 'AndreaCorvaglia0/mnemopolis';
const [OWNER, NAME] = REPO.split('/');
const SITE_URL = (process.env.SITE_URL || `https://${OWNER.toLowerCase()}.github.io/${NAME}/`).replace(/\/?$/, '/');
const GITHUB = `https://github.com/${REPO}`, WIKI = `${GITHUB}/wiki`;
const ASSETS = '_site'; // can never be a course slug (slugs start with a letter)

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---- the courses ----
function readCourses() {
  const list = [];
  for (const d of readdirSync(COURSES, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith('_')) continue;
    const file = path.join(COURSES, d.name, 'course.json');
    if (!existsSync(file) || !existsSync(path.join(OUT, d.name, 'index.html'))) { console.log(`site: ${d.name} not listed (no course.json or no built game)`); continue; }
    let c;
    try { c = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.log(`site: ${d.name} not listed (${e.message})`); continue; }
    if (!c.title || !c.bigIdea || !c.concepts?.length) { console.log(`site: ${d.name} not listed (incomplete)`); continue; }
    const { stats } = validateCourse(c, {}); // the validator's own estimate of the main path
    const core = new Set(c.concepts.filter((p) => p.core !== false).map((p) => p.id));
    const goals = (c.goals || []).filter((g) => typeof g === 'string' || (g.concepts || []).every((id) => core.has(id))).map((g) => (typeof g === 'string' ? g : g.text)).slice(0, 3);
    const media = (k) => (existsSync(path.join(OUT, ASSETS, 'media', `${d.name}-${k}.webp`)) ? `${ASSETS}/media/${d.name}-${k}.webp` : null);
    list.push({ slug: d.name, title: c.title, subject: c.subject, bigIdea: c.bigIdea, pitch: c.pitch, tags: (c.tags || []).slice(0, 4), level: c.level || 'introductory',
      lang: c.language || 'en', goals, minutes: stats.coreMinutes, houses: stats.houses, labs: stats.stations, town: media('town'), lab: media('lab') });
  }
  list.sort((a, b) => (b.slug === FEATURED) - (a.slug === FEATURED) || a.slug.localeCompare(b.slug));
  return list;
}

// ---- the words, English and Italian (written for each language, not translated word by word) ----
const T = {
  en: {
    htmlLang: 'en', skip: 'Skip to the games', home: 'Mnemopolis',
    title: 'Mnemopolis: learn a subject by playing', desc: 'Small learning games: walk through a town at night where every house holds one idea. Play in your browser, about an hour, no sign-up. Free and open source.',
    heroH: 'Learn a subject by walking through a town at night.', heroP: 'Every house holds one idea. Try it with your hands, then help the people who live there remember. About an hour, no sign-up.',
    play: (t) => `Play ${t}`, heroNote: (c) => `${c.subject}`, seeAll: 'What you can study',
    studyH: 'What you can study', studyP: 'Each game is a small town on one subject. Pick one and start.',
    youWill: 'You will be able to', playBtn: (t) => `Play ${t}`, playShort: 'Play',
    time: (m) => (m >= 55 && m <= 65 ? 'About an hour' : `About ${m} min`), houses: (n) => `${n} ${n === 1 ? 'house' : 'houses'}`, labs: (n) => `${n} ${n === 1 ? 'lab' : 'labs'}`,
    levels: { introductory: 'Beginner', intermediate: 'Some background', advanced: 'Advanced' }, langName: { en: 'English', it: 'Italian' },
    filter: 'Language', all: 'All', shotTown: (t) => `The town of ${t} at night, in the rain, with lit windows`, shotLab: (t) => `A lab inside ${t}: a question and an interactive picture`,
    howH: 'How it works', how: [
      ['Walk in', 'You arrive by ship, in the rain, in a town that has forgotten what it knew. Each house is one idea; your notebook says where to begin.'],
      ['Do the lab', 'Inside, a small interactive lab: guess, try it, be surprised. A mistake costs a turn and always comes with the reason.'],
      ['Help them remember', 'The owner has lost the idea. Answer what they ask and they let you upstairs, and a window in town lights up.']],
    why: 'You understand by doing, then you remember by being asked. No points, no badges.', whyLink: 'Why it works',
    mineH: 'Turn your own subject into a town', mineP: 'For teachers, trainers and the curious. A course is a folder of plain files; the engine does the rest.',
    r1H: 'Bring a course file', r1P: 'Already have a course folder? Open the make-a-game page, drop it in and play. It runs in your browser and nothing is uploaded.', r1A: 'Open the page',
    r2H: 'Start from the template', r2P: 'Press Use this template on GitHub, open it with an AI coding assistant and say:', r2A: 'Get the template', copy: 'Copy', copied: 'Copied',
    prompt: 'Read AGENTS.md. I want a course on ‹subject›. My material is in ‹folder›.',
    foot: 'Free and open source, MIT licence.', footRepo: 'Code on GitHub', footWiki: 'The reasons (wiki)', footPrivacy: 'Games run entirely in your browser and keep your progress only on this device. No accounts, no tracking.',
    sw: 'Italiano', swLabel: 'Leggi in italiano', swCode: 'it', nav: 'Language', beta: 'Early and not yet tested with many learners: tell us what you think on GitHub.',
    emptyH: 'The first town is on its way', emptyP: 'No game is published yet. Come back soon, or make one.',
  },
  it: {
    htmlLang: 'it', skip: 'Vai ai giochi', home: 'Mnemopolis',
    title: 'Mnemopolis: impara una materia giocando', desc: 'Piccoli giochi per imparare: attraversi di notte una città in cui ogni casa custodisce un’idea. Si gioca nel browser, in circa un’ora, senza registrazione. Gratuito e open source.',
    heroH: 'Impara una materia passeggiando per una città di notte.', heroP: 'Ogni casa custodisce un’idea. Provala con le mani, poi aiuta gli abitanti a ricordare. Circa un’ora, senza registrazione.',
    play: (t) => `Gioca a ${t}`, heroNote: (c) => `${c.subject}`, seeAll: 'Cosa puoi studiare',
    studyH: 'Cosa puoi studiare', studyP: 'Ogni gioco è una piccola città su un solo argomento. Scegline una e comincia.',
    youWill: 'Alla fine saprai', playBtn: (t) => `Gioca a ${t}`, playShort: 'Gioca',
    time: (m) => (m >= 55 && m <= 65 ? 'Circa un’ora' : `Circa ${m} min`), houses: (n) => `${n} ${n === 1 ? 'casa' : 'case'}`, labs: (n) => `${n} ${n === 1 ? 'laboratorio' : 'laboratori'}`,
    levels: { introductory: 'Per iniziare', intermediate: 'Serve qualche base', advanced: 'Avanzato' }, langName: { en: 'Inglese', it: 'Italiano' },
    filter: 'Lingua', all: 'Tutte', shotTown: (t) => `La città di ${t} di notte, sotto la pioggia, con le finestre accese`, shotLab: (t) => `Un laboratorio in ${t}: una domanda e un’immagine interattiva`,
    howH: 'Come funziona', how: [
      ['Entra', 'Arrivi in nave, sotto la pioggia, in una città che ha dimenticato ciò che sapeva. Ogni casa è un’idea; il quaderno ti dice da dove cominciare.'],
      ['Fai il laboratorio', 'Dentro c’è un piccolo laboratorio interattivo: prevedi, prova, resta sorpreso. Sbagliare costa un turno e ti spiega sempre il perché.'],
      ['Aiutali a ricordare', 'Il padrone di casa ha perso l’idea. Rispondi alle sue domande e ti farà salire al piano di sopra, e in città si accende una finestra.']],
    why: 'Si capisce facendo, poi si ricorda venendo interrogati. Niente punti, niente medaglie.', whyLink: 'Perché funziona',
    mineH: 'Trasforma la tua materia in una città', mineP: 'Per insegnanti, formatori e curiosi. Un corso è una cartella di file semplici; al resto pensa il motore.',
    r1H: 'Porta un file del corso', r1P: 'Hai già la cartella di un corso? Apri la pagina per creare il gioco, trascinala dentro e gioca. Funziona nel browser e non carica nulla.', r1A: 'Apri la pagina',
    r2H: 'Parti dal modello', r2P: 'Premi Use this template su GitHub, aprilo con un assistente AI per il codice e scrivi:', r2A: 'Prendi il modello', copy: 'Copia', copied: 'Copiato',
    prompt: 'Read AGENTS.md. I want a course on ‹subject›. My material is in ‹folder›.',
    foot: 'Gratuito e open source, licenza MIT.', footRepo: 'Codice su GitHub', footWiki: 'Le ragioni (wiki, in inglese)', footPrivacy: 'I giochi girano interamente nel tuo browser e tengono i progressi solo su questo dispositivo. Nessun account, nessun tracciamento.',
    sw: 'English', swLabel: 'Read in English', swCode: 'en', nav: 'Lingua', beta: 'Agli inizi e ancora poco provato con chi impara davvero: dicci cosa ne pensi su GitHub.',
    emptyH: 'La prima città è in arrivo', emptyP: 'Non c’è ancora nessun gioco pubblicato. Torna presto, oppure creane uno.',
  },
};

// ---- the picture at the top: a night harbour, drawn, a few kilobytes ----
function scene() {
  const stars = [[60, 40], [140, 90], [230, 30], [310, 120], [400, 60], [470, 22], [560, 100], [700, 40], [790, 88], [860, 26], [1010, 120], [1090, 52], [1150, 100], [90, 150], [520, 150], [930, 160], [1180, 28], [750, 140]]
    .map(([x, y], i) => `<circle class="tw t${i % 3}" cx="${x}" cy="${y}" r="${i % 4 === 0 ? 1.8 : 1.2}" fill="#e8eaf0"/>`).join('');
  const house = (x, w, h, roof, c, wins) => {
    const y = 330 - h;
    const ws = wins.map(([wx, wy, k]) => `<rect class="${k}" x="${x + wx}" y="${y + wy}" width="9" height="12" rx="1.5" fill="#ffcf5a"/>`).join('');
    return `<path d="M${x} 330V${y}L${x + w / 2} ${y - roof}L${x + w} ${y}V330Z" fill="${c}"/>${ws}`;
  };
  const houses = [
    house(40, 70, 56, 34, '#131829', [[14, 18, 'w2'], [42, 18, 'w1']]),
    house(122, 56, 80, 24, '#1a2036', [[12, 22, 'w1'], [34, 22, 'w3'], [12, 50, 'w2']]),
    house(196, 84, 52, 40, '#171d31', [[18, 16, 'w3'], [56, 16, 'w1']]),
    house(304, 70, 64, 34, '#161b2e', [[14, 20, 'w1'], [44, 20, 'w2']]),
    house(690, 60, 56, 30, '#171d31', [[14, 16, 'w2'], [36, 16, 'w1']]),
    house(870, 84, 72, 40, '#141a2c', [[16, 22, 'w3'], [48, 22, 'w1'], [14, 46, 'w2']]),
    house(962, 60, 50, 30, '#1b2238', [[14, 16, 'w1'], [36, 16, 'w2']]),
    house(1032, 90, 78, 44, '#131829', [[16, 22, 'w2'], [48, 22, 'w3'], [66, 52, 'w1']]),
    house(1134, 56, 60, 30, '#1a2036', [[12, 18, 'w3'], [34, 18, 'w1']]),
  ].join('');
  const lamps = [[290, 322], [674, 322], [850, 322], [1020, 322]].map(([x, y]) => `<circle class="lp" cx="${x}" cy="${y - 10}" r="14" fill="#ffcf5a" opacity=".14"/><rect x="${x - 1}" y="${y - 12}" width="2" height="14" fill="#2a3350"/><circle cx="${x}" cy="${y - 13}" r="3" fill="#ffd978"/>`).join('');
  const rain = (id) => `<pattern id="${id}" width="26" height="42" patternUnits="userSpaceOnUse" patternTransform="rotate(12)"><rect x="4" y="2" width="1.2" height="12" fill="#b9c6e6"/><rect x="17" y="24" width="1.2" height="10" fill="#b9c6e6"/></pattern>`;
  return `<svg class="scene" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070914"/><stop offset=".55" stop-color="#15163a"/><stop offset="1" stop-color="#43305f"/></linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101a38"/><stop offset="1" stop-color="#070c1c"/></linearGradient>
<radialGradient id="moon"><stop offset="0" stop-color="#f4efd2" stop-opacity=".5"/><stop offset="1" stop-color="#f4efd2" stop-opacity="0"/></radialGradient>${rain('r1')}</defs>
<rect width="1200" height="420" fill="url(#sky)"/>${stars}
<circle cx="1010" cy="120" r="70" fill="url(#moon)"/><circle cx="1010" cy="120" r="24" fill="#f4efd2"/><circle cx="1001" cy="114" r="4.5" fill="#d9d1ac"/><circle cx="1019" cy="129" r="3.2" fill="#d9d1ac"/>
<path d="M0 300C120 262 220 286 330 270S560 240 700 276 960 250 1200 284V340H0Z" fill="#0d1226"/>
<path d="M0 320C150 296 300 316 460 306S800 290 1200 314V340H0Z" fill="#0a0e1d"/>
${houses}
<g transform="translate(150 0)"><path d="M628 330 636 150h28l8 180Z" fill="#cfc6b0"/><path d="M633 200h34l-1 22h-32Zm-4 84h42l-1 22h-40Z" fill="#7a2f3a"/><rect x="630" y="124" width="40" height="30" fill="#161b2e"/><path d="M622 124 650 100l28 24Z" fill="#7a2f3a"/><rect x="622" y="150" width="56" height="6" fill="#161b2e"/></g>
${lamps}
<rect y="330" width="1200" height="90" fill="url(#sea)"/>
<g class="refl" opacity=".5"><rect x="300" y="338" width="3" height="26" fill="#ffcf5a" opacity=".5"/><rect x="700" y="342" width="3" height="30" fill="#ffcf5a" opacity=".5"/><rect x="868" y="340" width="3" height="28" fill="#ffcf5a" opacity=".5"/><rect x="1040" y="342" width="3" height="32" fill="#ffcf5a" opacity=".5"/></g>
<g transform="translate(250 0)"><g class="ship"><path d="M138 358h284l-30 40H170Z" fill="#03040a"/><path d="M138 358h284" stroke="#7a2f3a" stroke-width="3"/>
<rect x="180" y="326" width="200" height="32" fill="#1a2242"/><rect x="214" y="298" width="120" height="28" fill="#222c52"/><rect x="226" y="286" width="96" height="12" fill="#1a2242"/>
<rect x="232" y="240" width="30" height="48" fill="#161d3a"/><rect x="286" y="246" width="30" height="42" fill="#161d3a"/><rect x="232" y="240" width="30" height="8" fill="#9a3a46"/><rect x="286" y="246" width="30" height="8" fill="#9a3a46"/>
<g fill="#ffcf5a"><circle class="w1" cx="196" cy="376" r="3"/><circle class="w2" cx="220" cy="376" r="3"/><circle class="w3" cx="244" cy="376" r="3"/><circle class="w1" cx="268" cy="376" r="3"/><circle class="w2" cx="292" cy="376" r="3"/><circle class="w3" cx="316" cy="376" r="3"/><circle class="w1" cx="340" cy="376" r="3"/><circle class="w2" cx="364" cy="376" r="3"/>
<rect class="w2" x="192" y="336" width="10" height="10"/><rect class="w1" x="214" y="336" width="10" height="10"/><rect class="w3" x="236" y="336" width="10" height="10"/><rect class="w1" x="300" y="336" width="10" height="10"/><rect class="w2" x="336" y="336" width="10" height="10"/><rect class="w3" x="228" y="304" width="9" height="9"/><rect class="w1" x="262" y="304" width="9" height="9"/><rect class="w2" x="296" y="304" width="9" height="9"/></g></g></g>
<g class="rain"><rect y="-420" width="1200" height="840" fill="url(#r1)" opacity=".42"/></g>
<rect y="396" width="1200" height="24" fill="#070c1c" opacity=".0"/></svg>`;
}

const FAVICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0d1016"/><path d="M12 54V30l20-14 20 14v24z" fill="#1c2540"/><rect x="26" y="32" width="12" height="14" rx="2" fill="#ffcf5a"/></svg>');

// the icons of the three steps: small, drawn, decorative
const ICONS = [
  '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 56V28l22-16 22 16v28z" fill="#1c2540"/><rect x="24" y="30" width="16" height="26" rx="2" fill="#ffcf5a"/><circle cx="36" cy="44" r="1.6" fill="#7a5a14"/></svg>',
  '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="14" width="48" height="32" rx="4" fill="#1c2540" stroke="#4fd1c5" stroke-width="2.5"/><circle cx="26" cy="30" r="8" fill="#ff5a5a" opacity=".85"/><circle cx="38" cy="30" r="8" fill="#5affa0" opacity=".85"/><rect x="16" y="52" width="32" height="4" rx="2" fill="#4fd1c5"/></svg>',
  '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 56V30l22-16 22 16v26z" fill="#1c2540"/><rect x="18" y="32" width="10" height="12" rx="2" fill="#ffcf5a"/><rect x="36" y="32" width="10" height="12" rx="2" fill="#ffcf5a"/><rect x="27" y="46" width="10" height="10" rx="2" fill="#ffcf5a"/><path d="M50 12l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffcf5a"/></svg>',
];

function card(c, t, featured) {
  const play = `${c.slug}/`;
  const shot = (src, alt, cls, w, h) => (src ? `<img class="${cls}" src="${src}" alt="${esc(alt)}" width="${w}" height="${h}" loading="${featured ? 'eager' : 'lazy'}" decoding="async">` : '');
  const placeholder = `<div class="ph" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M8 54V30l24-16 24 16v24z" fill="#1c2540"/><rect x="26" y="32" width="12" height="14" rx="2" fill="#ffcf5a"/></svg><span>${esc(c.title)}</span></div>`;
  const media = c.town
    ? `<div class="shots">${shot(c.town, t.shotTown(c.title), 'town', 960, 540)}${c.lab ? shot(c.lab, t.shotLab(c.title), 'lab', 960, 540) : ''}</div>`
    : `<div class="shots">${placeholder}</div>`;
  const hook = c.pitch || c.bigIdea;
  const goals = c.goals.length ? `<p class="k">${esc(t.youWill)}</p><ul>${c.goals.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>` : '';
  const langName = t.langName[c.lang] || (() => { try { return new Intl.DisplayNames([t.htmlLang], { type: 'language' }).of(c.lang); } catch { return c.lang; } })();
  const chips = [t.time(c.minutes), `${t.houses(c.houses)} · ${t.labs(c.labs)}`, langName, t.levels[c.level] || c.level].map((x) => `<li>${esc(x)}</li>`).join('');
  return `<li class="card${featured ? ' feat' : ''}" data-lang="${esc(c.lang)}">
<a class="shotlink" href="${play}" tabindex="-1" aria-hidden="true">${media}</a>
<div class="body"><h3><a href="${play}">${esc(c.title)}</a></h3><p class="subj">${esc(c.subject)}</p>
<p class="hook">${esc(hook)}</p>${goals}<ul class="chips">${chips}</ul>
<a class="btn" href="${play}">${esc(t.playBtn(c.title))}</a></div></li>`;
}

const CSS = `
:root{--bg:#0d1016;--stage:#080a0f;--panel:#131821;--card:#192030;--line:#263041;--text:#e8eaf0;--muted:#b0b8c9;--acc:#4fd1c5;--acc-ink:#04201d;--gold:#ffcf5a;--r:16px}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font:17px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:inherit}img{max-width:100%;height:auto;display:block}
:focus-visible{outline:3px solid var(--gold);outline-offset:3px;border-radius:6px}
.skip{position:absolute;left:12px;top:-60px;background:var(--gold);color:#241a00;padding:10px 16px;border-radius:10px;font-weight:700;z-index:10}.skip:focus{top:12px}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
/* hero */
.hero{position:relative;overflow:hidden;background:#070914;display:flex;flex-direction:column}
.hero .wrap{width:100%}
.hero .scene{display:block;width:100%;height:clamp(230px,32vw,400px);margin-top:12px;-webkit-mask-image:linear-gradient(transparent,#000 34%);mask-image:linear-gradient(transparent,#000 34%)}
.top{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;padding-top:14px;padding-bottom:6px}
.brand{font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:15px;text-decoration:none;display:inline-flex;align-items:center;min-height:44px;gap:10px}
.brand i{width:12px;height:16px;border-radius:2px;background:var(--gold);box-shadow:0 0 14px #ffcf5a99}
.sw{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border:1px solid #3a4659;border-radius:22px;text-decoration:none;font-weight:600;font-size:16px;background:#0d1016aa}
.sw:hover{border-color:var(--acc)}
.herotext{position:relative;z-index:2;padding-top:clamp(18px,5svh,56px);padding-bottom:20px}
h1{max-width:15em;font-size:clamp(30px,7.4vw,56px);line-height:1.1;margin:0 0 14px;letter-spacing:-.01em;text-wrap:balance}
.lead{font-size:clamp(18px,2.6vw,21px);color:#d3d9e6;margin:0 0 22px;max-width:34em}
.cta{display:flex;flex-wrap:wrap;gap:14px 22px;align-items:center}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:52px;padding:0 26px;border-radius:14px;background:var(--acc);color:var(--acc-ink);font-weight:800;font-size:18px;text-decoration:none;border:0;box-shadow:0 6px 28px #4fd1c540;transition:transform .12s,box-shadow .12s}
.btn:hover{transform:translateY(-1px);box-shadow:0 8px 34px #4fd1c566}
.btn.big{min-height:60px;font-size:20px;padding:0 32px}
.note{margin:12px 0 0;color:var(--muted);font-size:15px}
.textlink{color:var(--text);font-weight:600;min-height:44px;display:inline-flex;align-items:center;text-underline-offset:4px}
/* sections */
section{padding:clamp(40px,8vw,84px) 0}
h2{font-size:clamp(26px,4.6vw,38px);line-height:1.15;margin:0 0 8px;letter-spacing:-.01em}
.sub{color:var(--muted);margin:0 0 28px;max-width:40em}
.grid{list-style:none;padding:0;margin:0;display:grid;gap:22px;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))}.grid.n1{max-width:540px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;display:flex;flex-direction:column}
.card:hover{border-color:#3a4659}
.shotlink{display:block;position:relative;background:var(--stage)}
.shots{position:relative;aspect-ratio:16/9;overflow:hidden}
.shots .town{width:100%;height:100%;object-fit:cover}
.shots .lab{position:absolute;right:10px;bottom:10px;width:42%;height:auto;border-radius:10px;border:2px solid var(--gold);box-shadow:0 6px 22px #000a}
.ph{height:100%;display:grid;place-content:center;justify-items:center;gap:8px;background:linear-gradient(#0a0c1c,#2a2147);color:var(--muted);font-weight:700}.ph svg{width:72px}
.body{padding:20px 20px 22px;display:flex;flex-direction:column;gap:10px;flex:1}
.card h3{margin:0;font-size:24px;line-height:1.2}.card h3 a{text-decoration:none}.card h3 a:hover{text-decoration:underline;text-underline-offset:4px}
.subj{margin:0;color:var(--gold);font-weight:600;font-size:16px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.hook{margin:2px 0 0;font-size:18px}
.k{margin:8px 0 0;color:var(--muted);font-size:14px;letter-spacing:.06em;text-transform:uppercase;font-weight:700}
.card ul:not(.chips){margin:0;padding-left:20px;list-style:disc}.card li{margin:3px 0}
.chips{list-style:none;padding:0;margin:8px 0 6px;display:flex;flex-wrap:wrap;gap:8px}
.chips li{margin:0;padding:3px 12px;border:1px solid var(--line);border-radius:999px;font-size:14px;color:var(--muted);background:#0f141d}
.card .btn{margin-top:auto;width:100%}
.feat .btn{box-shadow:0 6px 28px #4fd1c540}
@media(min-width:760px){.grid:has(> :nth-child(2)) .feat{grid-column:span 1}}
.filter{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 22px;align-items:center}.filter span{color:var(--muted);font-size:15px;margin-right:4px}
.filter button{min-height:44px;padding:0 16px;border-radius:22px;border:1px solid #3a4659;background:none;color:var(--text);font:600 16px system-ui,sans-serif;cursor:pointer}
.filter button[aria-pressed=true]{background:var(--acc);color:var(--acc-ink);border-color:var(--acc)}
.empty{padding:28px;border:1px dashed #3a4659;border-radius:var(--r);text-align:center;color:var(--muted)}
/* how it works */
.how{background:#0a0d14;border-block:1px solid var(--line)}
.steps{list-style:none;padding:0;margin:0 0 26px;display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));counter-reset:s}
.steps li{display:grid;grid-template-columns:64px 1fr;gap:6px 16px;align-items:start;padding:18px;border-radius:var(--r);background:var(--panel);border:1px solid var(--line)}
.steps svg{width:64px;height:64px;grid-row:span 2}.steps h3{margin:2px 0 0;font-size:20px}.steps h3::before{counter-increment:s;content:counter(s) ". ";color:var(--gold)}.steps p{margin:0;color:var(--muted);font-size:16px}
.why{font-size:19px;max-width:40em;margin:0}.why a{color:var(--acc);text-underline-offset:4px;font-weight:600}
/* make your own */
.mine{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))}
.route{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:22px;display:flex;flex-direction:column;gap:10px}.route h3{margin:0;font-size:21px}.route p{margin:0;color:var(--muted);font-size:16px}
.acts{margin-top:auto;display:flex;flex-wrap:wrap;gap:10px}.route>.btn{margin-top:auto}.route .btn{align-self:flex-start;background:none;color:var(--text);border:2px solid var(--acc);box-shadow:none;min-height:48px;font-size:17px}.route .btn:hover{background:#13242a}
pre{margin:4px 0;padding:14px;background:var(--stage);border:1px solid var(--line);border-radius:12px;white-space:pre-wrap;word-break:break-word;font:15px/1.5 ui-monospace,Menlo,Consolas,monospace;color:#e8eaf0}
.copy{min-height:48px;padding:0 16px;border-radius:10px;border:1px solid #3a4659;background:none;color:var(--text);font:600 16px system-ui,sans-serif;cursor:pointer}.copy:hover{border-color:var(--acc)}
footer{border-top:1px solid var(--line);padding:34px 0 48px;color:var(--muted);font-size:16px}footer p{margin:6px 0;max-width:44em}
footer nav{display:flex;flex-wrap:wrap;gap:6px 22px;margin:12px 0}footer a{color:var(--text);min-height:44px;display:inline-flex;align-items:center;text-underline-offset:4px}
/* motion: slow and quiet; off when asked */
.rain{animation:rain .75s linear infinite}@keyframes rain{to{transform:translateY(420px)}}
.ship{animation:bob 6s ease-in-out infinite}@keyframes bob{50%{transform:translateY(3px)}}
.tw{animation:tw 4s ease-in-out infinite}.t1{animation-delay:-1.3s}.t2{animation-delay:-2.6s}@keyframes tw{50%{opacity:.25}}
.w1{animation:wn 7s steps(1) infinite}.w2{animation:wn 9s steps(1) infinite -3s}.w3{animation:wn 11s steps(1) infinite -6s}@keyframes wn{0%{opacity:1}92%{opacity:.35}96%{opacity:1}}
.lp{animation:lp 3.2s ease-in-out infinite}@keyframes lp{50%{opacity:.26}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;scroll-behavior:auto!important}.btn{transition:none}}
`;

function page(lang, courses) {
  const t = T[lang], other = T[lang === 'en' ? 'it' : 'en'];
  const rel = lang === 'en' ? '' : '../';             // links to the games are relative to this page
  const fix = (html) => (rel ? html.replace(/(href|src)="(?!https?:|#|\.\.?\/|data:|mailto:)/g, `$1="${rel}`) : html);
  const feat = courses[0];
  const filter = courses.length > 5 && new Set(courses.map((c) => c.lang)).size > 1;
  const langs = [...new Set(courses.map((c) => c.lang))];
  const url = SITE_URL + (lang === 'en' ? '' : 'it/'), og = `${SITE_URL}${ASSETS}/og.jpg`;
  const cards = courses.map((c, i) => card(c, t, i === 0)).join('\n');
  const body = `<a class="skip" href="#games">${esc(t.skip)}</a>
<header class="hero">
<div class="wrap top"><a class="brand" href="${lang === 'en' ? './' : './'}"><i></i>${esc(t.home)}</a>
<nav aria-label="${esc(t.nav)}"><a class="sw" href="${lang === 'en' ? 'it/' : '../#en'}" hreflang="${t.swCode}" lang="${t.swCode}" aria-label="${esc(t.swLabel)}">${esc(t.sw)}</a></nav></div>
<div class="wrap herotext"><h1>${esc(t.heroH)}</h1><p class="lead">${esc(t.heroP)}</p>
<div class="cta">${feat ? `<a class="btn big" href="${feat.slug}/">${esc(t.play(feat.title))}</a>` : ''}<a class="textlink" href="#games">${esc(t.seeAll)} ↓</a></div>
${feat ? `<p class="note">${esc(feat.subject)} · ${esc(t.time(feat.minutes))}</p>` : ''}</div>
${scene()}
</header>
<main>
<section id="games" aria-labelledby="h-games"><div class="wrap"><h2 id="h-games">${esc(t.studyH)}</h2><p class="sub">${esc(t.studyP)}</p>
${filter ? `<div class="filter" role="group" aria-label="${esc(t.filter)}"><span>${esc(t.filter)}</span><button type="button" aria-pressed="true" data-f="">${esc(t.all)}</button>${langs.map((l) => `<button type="button" aria-pressed="false" data-f="${esc(l)}">${esc(t.langName[l] || l)}</button>`).join('')}</div>` : ''}
${courses.length ? `<ul class="grid${courses.length === 1 ? ' n1' : ''}" id="grid">${cards}</ul>` : `<div class="empty"><strong>${esc(t.emptyH)}</strong><br>${esc(t.emptyP)}</div>`}
</div></section>
<section class="how" aria-labelledby="h-how"><div class="wrap"><h2 id="h-how">${esc(t.howH)}</h2><br>
<ol class="steps">${t.how.map(([h, p], i) => `<li>${ICONS[i]}<h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join('')}</ol>
<p class="why">${esc(t.why)} <a href="${WIKI}">${esc(t.whyLink)}</a></p></div></section>
<section aria-labelledby="h-mine"><div class="wrap"><h2 id="h-mine">${esc(t.mineH)}</h2><p class="sub">${esc(t.mineP)}</p>
<div class="mine">
<div class="route"><h3>${esc(t.r1H)}</h3><p>${esc(t.r1P)}</p><a class="btn" href="play/">${esc(t.r1A)}</a></div>
<div class="route"><h3>${esc(t.r2H)}</h3><p>${esc(t.r2P)}</p><pre id="prompt">${esc(t.prompt)}</pre><div class="acts"><button type="button" class="copy" data-copied="${esc(t.copied)}">${esc(t.copy)}</button><a class="btn" href="${GITHUB}">${esc(t.r2A)}</a></div></div>
</div></div></section>
</main>
<footer><div class="wrap"><p><strong>Mnemopolis</strong>. ${esc(t.foot)}</p><nav aria-label="Links"><a href="${GITHUB}">${esc(t.footRepo)}</a><a href="${WIKI}">${esc(t.footWiki)}</a><a href="${GITHUB}/blob/main/LICENSE">MIT</a></nav><p>${esc(t.footPrivacy)}</p><p>${esc(t.beta)}</p></div></footer>`;
  // the English page sends Italian browsers to /it/ once (unless they came back with #en)
  const redirect = lang === 'en' ? `if(/^it\\b/i.test(navigator.language||'')&&location.hash!=='#en')location.replace('it/');` : '';
  const js = `<script>${redirect}
document.querySelectorAll('.copy').forEach(function(b){var l=b.textContent;b.addEventListener('click',function(){var t=document.getElementById('prompt').textContent;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent=b.dataset.copied;setTimeout(function(){b.textContent=l},1800)},function(){var r=document.createRange();r.selectNodeContents(document.getElementById('prompt'));var s=getSelection();s.removeAllRanges();s.addRange(r)})})});
document.querySelectorAll('.filter button').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('.filter button').forEach(function(x){x.setAttribute('aria-pressed',x===b)});document.querySelectorAll('#grid .card').forEach(function(c){c.hidden=!!b.dataset.f&&c.dataset.lang!==b.dataset.f})})});
</script>`;
  const html = `<!doctype html>
<html lang="${t.htmlLang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="theme-color" content="#070914">
<title>${esc(t.title)}</title><meta name="description" content="${esc(t.desc)}">
<link rel="canonical" href="${url}"><link rel="alternate" hreflang="en" href="${SITE_URL}"><link rel="alternate" hreflang="it" href="${SITE_URL}it/"><link rel="alternate" hreflang="x-default" href="${SITE_URL}">
<link rel="icon" href="${FAVICON}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Mnemopolis"><meta property="og:title" content="${esc(t.title)}"><meta property="og:description" content="${esc(t.desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(t.heroH)}"><meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'it_IT'}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(t.title)}"><meta name="twitter:description" content="${esc(t.desc)}"><meta name="twitter:image" content="${og}">
<style>${CSS}</style></head>
<body>
${fix(body)}
${js}
</body></html>
`;
  return html;
}

// ---- write ----
const courses = readCourses();
mkdirSync(path.join(OUT, 'it'), { recursive: true });
mkdirSync(path.join(OUT, ASSETS), { recursive: true });
writeFileSync(path.join(OUT, 'index.html'), page('en', courses));
writeFileSync(path.join(OUT, 'it', 'index.html'), page('it', courses));
const og = path.join(root, 'assets', 'site-og.jpg');
if (existsSync(og)) copyFileSync(og, path.join(OUT, ASSETS, 'og.jpg'));
console.log(`site: front page for ${courses.length} course(s): ${courses.map((c) => c.slug).join(', ') || 'none'}`);
