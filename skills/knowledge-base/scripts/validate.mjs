#!/usr/bin/env node
// Validates a course knowledge base. No dependencies.
//   node skills/knowledge-base/scripts/validate.mjs courses/<slug>
// Checks structure, the limits that keep a course learnable, and the logic of the map and the path.
// Errors must be fixed. Warnings are advice from the method (see ../references).
//
// The checks are one pure function, validateCourse(course, env), that reads no file: the command
// line below reads the course folder and the engine's registries and passes them in; the /play/
// page (engine/player/) calls the same function in the browser.
import { checkProgression } from './riddles.mjs';
import { checkCourseProse } from './prose.mjs';

// env: { EMBLEMS, TRADES, TEMPERS, match, tools: names from the engine (null = not checked),
//        brief: the text of knowledge/brief.md, has(file): whether the course folder holds it,
//        checkReady(station, where): the checks of ready-made labs (engine/src/lab/patterns/specs.js) }
// Returns { errors, warns, summary }.
export function validateCourse(c, env = {}) {
// (the body keeps the indentation of the script it was, so that its history stays readable)
const { EMBLEMS = null, TRADES = null, TEMPERS = null, match = null, tools = null, brief = '', has = () => true, checkReady = null, checkGames = null } = env;
const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);
const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const need = (o, keys, where) => keys.forEach((k) => { if (o[k] === undefined || o[k] === '' || o[k] === null) err(`${where}: "${k}" is missing`); });
const max = (s, n, where) => { if (words(s) > n) err(`${where} has ${words(s)} words: keep it to ${n} or fewer`); };

const TYPES = ['mechanism', 'process', 'view', 'parts', 'choice', 'cases', 'story', 'deep'];
const REL = ['requires', 'part-of', 'causes', 'contrasts', 'same-structure', 'example-of', 'used-in'];
const PATTERNS = ['handle', 'cause-effect', 'break-it', 'predict-test', 'contrast', 'zoom', 'match', 'step-through', 'sort-cases', 'linked-analogy', 'puzzle', 'role-play', 'sandbox'];
const VERBS_WEAK = /^(understand|know|learn|be aware|appreciate|familiar)/i;

// ---- course ----
need(c, ['id', 'language', 'title', 'subject', 'bigIdea', 'themes', 'concepts', 'relations', 'finalCheck'], 'course');
if (c.version !== 1) err('course: "version" must be 1');
if (c.id && !/^[a-z][a-z0-9-]*$/.test(c.id)) err('course: "id" must be a lowercase slug');
max(c.bigIdea, 28, 'bigIdea');
if (!c.goals?.length) warn('course: no "goals" (what the learner can do at the end)');
const goalText = (g) => (typeof g === 'string' ? g : g?.text);
(c.goals || []).forEach((g, k) => { if (!goalText(g)) err(`goal ${k + 1}: a goal is a string or { "text", "concepts" }`); });
if (!c.learner) warn('course: no "learner" (who it is for, what they know)');
if (!c.sources?.length) warn('course: no "sources". Every claim should rest on one.');
const sourceIds = new Set((c.sources || []).map((s) => s.id));

// ---- themes ----
const themes = c.themes || [], concepts = c.concepts || [];
if (themes.length < 1 || themes.length > 4) err(`${themes.length} themes: a course has 1 to 4`);
const themeIds = new Set();
const dup = (arr) => arr.filter((v, i) => v && arr.indexOf(v) !== i);
themes.forEach((t) => {
  const T = `theme "${t.id}"`;
  need(t, ['id', 'name', 'idea'], T);
  if (themeIds.has(t.id)) err(`${T}: id used twice`); themeIds.add(t.id);
  max(t.idea, 18, `${T} idea`);
  const n = concepts.filter((x) => x.theme === t.id).length;
  if (n < 1 || n > 4) err(`${T}: ${n} concepts, a theme has 1 to 4`);
});
dup(themes.map((t) => t.cue?.landscape)).forEach((v) => err(`two themes share the landscape "${v}": cues must differ`));
dup(themes.map((t) => t.cue?.landmark)).forEach((v) => err(`two themes share the landmark "${v}": cues must differ`));

// ---- concepts ----
const ids = new Set(), order = new Map();
if (concepts.length > 12) warn(`${concepts.length} concepts: more than 12 is hard to keep in mind. Consider two courses.`);
let lastTheme = -1, rememberTotal = 0;
const answerPos = [];
concepts.forEach((p, i) => {
  const P = `concept "${p.id}"`;
  need(p, ['id', 'theme', 'type', 'name', 'place', 'objective', 'idea', 'wrongBelief', 'remember', 'questions'], P);
  if (ids.has(p.id)) err(`${P}: id used twice`); ids.add(p.id); order.set(p.id, i);
  if (!/^[a-z][a-z0-9]*$/.test(p.id || '')) err(`${P}: id must be lowercase letters and digits`);
  if (!themeIds.has(p.theme)) err(`${P}: unknown theme "${p.theme}"`);
  const ti = themes.findIndex((t) => t.id === p.theme);
  if (ti < lastTheme) err(`${P}: concepts must be listed in path order, theme by theme (theme "${p.theme}" comes back after a later one)`);
  lastTheme = Math.max(lastTheme, ti);
  if (!TYPES.includes(p.type)) err(`${P}: type must be one of ${TYPES.join(', ')}`);
  max(p.idea, 28, `${P} idea`);
  if (p.emblem !== undefined && EMBLEMS && !EMBLEMS.includes(p.emblem)) warn(`${P}: emblem "${p.emblem}" is not one of ${EMBLEMS.join(', ')}; the house will show none`);
  if (p.sign && p.sign.length > 9) err(`${P}: sign "${p.sign}" is longer than 9 characters`);
  if (p.core !== undefined && typeof p.core !== 'boolean') err(`${P}: "core" must be true or false (leave it out for true)`);
  if (p.expert !== undefined) { // the person who lives in the concept's house
    const e = p.expert;
    if (!e || typeof e !== 'object' || Array.isArray(e)) err(`${P}: "expert" must be an object { name, trade, line }`);
    else {
      Object.keys(e).filter((k) => !['name', 'trade', 'line', 'temper'].includes(k)).forEach((k) => err(`${P}: expert has an unknown field "${k}" (name, trade, line, temper)`));
      if (e.temper !== undefined && (typeof e.temper !== 'string' || !e.temper.trim())) err(`${P}: expert "temper" must be a non-empty string`);
      else if (e.temper && TEMPERS && !TEMPERS.includes(e.temper)) warn(`${P}: expert temper "${e.temper}" is not one of ${TEMPERS.join(', ')}; the engine picks one by seed`);
      if (typeof e.trade !== 'string' || !e.trade.trim()) err(`${P}: expert needs a "trade" (one word, e.g. painter)`);
      else if (TRADES && !TRADES.includes(e.trade)) warn(`${P}: expert trade "${e.trade}" is not one of ${TRADES.join(', ')}; the house will be a generic home`);
      if (e.name !== undefined && (typeof e.name !== 'string' || !e.name.trim())) err(`${P}: expert "name" must be a non-empty string`);
      else if (e.name && e.name.length > 8) warn(`${P}: expert name "${e.name}" is longer than 8 characters; the name plate shows 8`);
      if (e.line !== undefined && (typeof e.line !== 'string' || !e.line.trim())) err(`${P}: expert "line" must be a non-empty string`);
      else if (e.line) max(e.line, 30, `${P} expert line`);
      if (p.type === 'story' && !p.lab) warn(`${P}: a story without a lab stays a museum (its timeline lives there); the expert becomes its host`);
    }
  }
  if (VERBS_WEAK.test(p.objective || '')) err(`${P}: the objective starts with a verb that cannot be observed ("${p.objective.split(' ')[0]}"). Use predict, explain, choose, compute, recognise...`);
  if (p.remember && (p.remember.length < 1 || p.remember.length > 3)) err(`${P}: ${p.remember.length} remember lines, keep 1 to 3`);
  rememberTotal += p.remember?.length || 0;
  if (p.type !== 'story') {
    if (!p.anchor) warn(`${P}: no anchor (analogy, metaphor, example or contrast)`);
    else if (['analogy', 'metaphor'].includes(p.anchor.type) && !p.anchor.limits) err(`${P}: an ${p.anchor.type} needs "limits": where it stops being true`);
    if (!p.explain) warn(`${P}: no explain prompt`);
    if (!p.application) warn(`${P}: no application (where the learner meets this in real life)`);
    if (!p.page?.length) warn(`${P}: no page sections`);
  }
  if (i > 0 && !p.callbacks?.length) warn(`${P}: no call-back to an earlier concept (planned repetition)`);
  (p.callbacks || []).forEach((cb) => { if (!ids.has(cb.to) || cb.to === p.id) err(`${P}: call-back to "${cb.to}", which is not an earlier concept`); });
  (p.sources || []).forEach((s) => { if (!sourceIds.has(s)) err(`${P}: source "${s}" is not in course.sources`); });
  if (c.sources?.length && !p.sources?.length) warn(`${P}: no sources listed`);
  if ((p.further?.length || 0) > 3) err(`${P}: ${p.further.length} "further" links, keep 3 at most`);
  (p.further || []).forEach((f, k) => { if (!f.title || !/^https?:\/\//.test(f.url || '') || !f.why) err(`${P} further ${k + 1}: needs a title, an http(s) url and a one-line "why"`); });

  // lab
  if (p.type === 'story') {
    const n = p.timeline?.length || 0;
    if (n < 4 || n > 14) err(`${P}: a story has a timeline of 4 to 14 events (found ${n})`);
    (p.timeline || []).forEach((m, k) => { need(m, ['year', 'title', 'text'], `${P} event ${k + 1}`); if (!m.src) warn(`${P} event ${k + 1}: no source`); if (m.thread && !p.threads?.[m.thread]) err(`${P} event ${k + 1}: unknown thread "${m.thread}"`); });
    if (p.lab) warn(`${P}: a story has no lab; "lab" is ignored`);
  } else {
    const st = p.lab?.stations || [], cap = p.type === 'process' ? 8 : 3;
    if (!p.lab) err(`${P}: no lab`);
    const gn = st.filter((s) => !s.advanced).length; // advanced stations live upstairs (riddles.mjs)
    if (p.lab && (gn < 1 || gn > cap)) err(`${P}: ${gn} ground-floor stations, a ${p.type} concept has 1 to ${cap}`);
    const sids = new Set();
    st.forEach((s, k) => {
      const S = `${P} station ${k + 1}`;
      need(s, ['id', 'tab', 'goal', 'pattern', 'object', 'action', 'surprise', 'tries', 'takeaway', 'source'], S);
      if (sids.has(s.id)) err(`${S}: id used twice`); sids.add(s.id);
      max(s.goal, 26, `${S} goal`);
      if (s.pattern && !PATTERNS.includes(s.pattern)) err(`${S}: pattern must be one of ${PATTERNS.join(', ')}`);
      if (s.tries && (s.tries.length < 1 || s.tries.length > 3)) err(`${S}: ${s.tries.length} tasks, keep 1 to 3`);
      if ((s.controls?.length || 0) > 2) err(`${S}: ${s.controls.length} controls, two at most. A third means a second station.`);
      if (s.pattern === 'sandbox' && k !== st.length - 1) err(`${S}: a sandbox comes last`);
      if (/^(use|try|play|explore|learn)\b/i.test(s.goal || '')) warn(`${S}: the goal reads like an instruction. State the idea instead.`);
      if (s.predict && (s.predict.options?.length < 3 || s.predict.options?.length > 4)) err(`${S}: predict needs 3 or 4 options`);
      if (s.predict && s.predict.answer != null && !(Number.isInteger(s.predict.answer) && s.predict.answer >= 0 && s.predict.answer < (s.predict.options?.length || 0))) err(`${S}: predict.answer must be the index of one of the options (0 = the first)`);
      if (s.predict && s.predict.answer == null) warn(`${S}: predict has no answer. Without it the lab cannot tell the learner whether the prediction was right.`);
      // tasks may carry the condition that ticks them ({ text, when }: references/8-ready-labs.md); a "ready" station draws a ready-made pattern
      (Array.isArray(s.tries) ? s.tries : []).forEach((t, j) => { if (typeof t !== 'string' && !(t && typeof t === 'object' && typeof t.text === 'string' && t.text.trim())) err(`${S}: task ${j + 1} must be a string, or { "text": "...", "when": { ... } }`); });
      if (s.ready !== undefined && checkReady) checkReady(s, `${S} ready`).forEach(err);
    });
    if (st.length && !st.some((s) => s.predict || ['predict-test', 'puzzle', 'match', 'sort-cases', 'role-play', 'break-it'].includes(s.pattern))) warn(`${P}: no station asks the learner to predict, decide or work something out. Watching an effect is not enough.`);
  }

  // questions
  const qs = p.questions || [], l1 = qs.filter((q) => q.level === 1), up = qs.filter((q) => q.level >= 2);
  if (!l1.length) err(`${P}: no level-1 question (one per remember line)`);
  if (l1.length > 3) err(`${P}: ${l1.length} level-1 questions, keep 3 at most`);
  if (p.remember && l1.length < p.remember.length) warn(`${P}: ${p.remember.length} remember lines but ${l1.length} level-1 questions`);
  if (!up.length) err(`${P}: no level-2 or level-3 question`);
  qs.forEach((q, k) => {
    const Q = `${P} question ${k + 1}`;
    need(q, ['level', 'q', 'options', 'why'], Q);
    if (![1, 2, 3].includes(q.level)) err(`${Q}: level must be 1, 2 or 3`);
    const n = q.options?.length || 0;
    if (n < 3 || n > 4) err(`${Q}: ${n} options, use 3 or 4`);
    if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < n)) err(`${Q}: answer index out of range`);
    else answerPos.push(q.answer);
    if (dup(q.options || []).length) err(`${Q}: two identical options`);
    if ((q.options || []).some((o) => /^(all|none) of the above/i.test(o))) err(`${Q}: no "all of the above" or "none of the above"`);
    if (/\b(NOT|EXCEPT)\b|\bnot\b.*\?$/.test(q.q || '') && /which/i.test(q.q)) warn(`${Q}: negative stem. Ask what is true instead.`);
    if (!q.traps) warn(`${Q}: no traps (the mistake each wrong option catches)`);
    else if (q.traps.length !== n) err(`${Q}: traps must have one entry per option`);
    else {
      if (q.traps[q.answer] !== null) err(`${Q}: the trap of the right option must be null`);
      q.traps.forEach((t, j) => { if (j !== q.answer && !t) err(`${Q}: option ${j + 1} has no trap. If you cannot name the mistake, it is filler.`); });
      // the duel shows a trap to the learner after a wrong answer ("Why “X” tempts: <trap>"): a sentence, not a label
      const terse = q.traps.filter((t, j) => j !== q.answer && t && words(t) < 8);
      if (terse.length) warn(`${Q}: ${terse.length === 1 ? 'a trap is' : `${terse.length} traps are`} a label ("${terse[0]}"). The learner reads it after a wrong answer: write a short sentence that says why the option tempts and why it fails`);
    }
    if (n && Number.isInteger(q.answer)) { const L = q.options.map((o) => o.length), right = L[q.answer], others = L.filter((_, j) => j !== q.answer); if (right > 1.8 * Math.max(...others) && right > 30) warn(`${Q}: the right option is much longer than the others`); }
  });
});
if (answerPos.length >= 8) { const counts = [0, 1, 2, 3].map((k) => answerPos.filter((a) => a === k).length), top = Math.max(...counts); if (top / answerPos.length > 0.5) warn(`${Math.round((100 * top) / answerPos.length)}% of right answers are in position ${counts.indexOf(top) + 1}: spread them`); }
if (concepts.length >= 4 && !concepts.some((p) => ['cases', 'choice'].includes(p.type))) warn('no concept of type "cases" or "choice": where does the learner use the knowledge?');
if (concepts.length && concepts[0].type === 'deep') err('the first concept cannot be a deep dive');

// ---- relations: the map ----
const rel = c.relations || [], linked = new Set(), req = new Map();
rel.forEach((r, k) => {
  const R = `relation ${k + 1}`;
  if (!ids.has(r.from) || !ids.has(r.to)) return err(`${R}: "${r.from}" → "${r.to}" names an unknown concept`);
  if (r.from === r.to) return err(`${R}: a concept cannot relate to itself`);
  if (!REL.includes(r.type)) return err(`${R}: type must be one of ${REL.join(', ')}`);
  linked.add(r.from); linked.add(r.to);
  if (r.type === 'requires') { req.set(r.from, [...(req.get(r.from) || []), r.to]); if (order.get(r.to) > order.get(r.from)) err(`path: "${r.from}" requires "${r.to}", which comes later. Reorder the concepts.`); }
});
if (concepts.length > 1) concepts.forEach((p) => { if (!linked.has(p.id)) err(`concept "${p.id}" has no relation to any other: an orphan is not part of the map`); });
const visiting = new Set(), done = new Set();
const cyc = (id) => { if (done.has(id)) return false; if (visiting.has(id)) return true; visiting.add(id); const r = (req.get(id) || []).some(cyc); visiting.delete(id); done.add(id); return r; };
if ([...ids].some(cyc)) err('relations: "requires" forms a loop');
if (themes.length > 1) themes.forEach((t) => { const inside = new Set(concepts.filter((p) => p.theme === t.id).map((p) => p.id)); if (!rel.some((r) => inside.has(r.from) !== inside.has(r.to))) warn(`theme "${t.id}" has no link to another theme: the course risks being separate chapters`); });

// ---- final check ----
const f = c.finalCheck || {};
if (!(f.size >= 4) || !(f.pass > 0 && f.pass <= 1)) err('finalCheck needs "size" (4 or more) and "pass" (0 to 1)');


// ---- core and extra: the main story of the game (references/3-path.md, "Core and extra") ----
// Core concepts are the minimum set to take home in about an hour; only they gate the final check.
const core = concepts.filter((p) => p.core !== false), extra = concepts.filter((p) => p.core === false);
if (concepts.length && core.length < Math.min(3, concepts.length)) err(`${core.length} core concepts: the main story needs at least ${Math.min(3, concepts.length)}. Mark fewer concepts "core": false.`);
if (concepts.length && concepts[0].core === false) err(`concept "${concepts[0].id}": the first concept of the path is where everyone starts; it must be core`);
const isExtra = new Set(extra.map((p) => p.id));
(c.goals || []).forEach((g, k) => (g?.concepts || []).forEach((id) => { if (!ids.has(id)) err(`goal ${k + 1}: unknown concept "${id}"`); }));
rel.forEach((r) => { if (r.type === 'requires' && !isExtra.has(r.from) && isExtra.has(r.to)) err(`core concept "${r.from}" requires "${r.to}", which is extra: the main story would need something it never asks for. Make "${r.to}" core or drop the requirement.`); });
if (core.length > 6) warn(`${core.length} core concepts: a core of about 4 to 6 fits an hour of play. Mark the least essential ones "core": false.`);
// A core concept's questions are its house duel (at most six turns). Simulated learners
// (engine/tests/duel.test.mjs) show that six questions separate a learner right 70% of the time from
// one right 40% of the time, and four do not: references/6-questions.md, "Questions in duels".
core.forEach((p) => {
  const n = (p.questions || []).length;
  if (n < 3) err(`concept "${p.id}": ${n} questions. A core concept is proven in a duel with its expert: give it at least 3 (6 make a fair duel)`);
  else if (n < 6) warn(`concept "${p.id}": ${n} questions. Its duel can ask at most ${n}; with fewer than 6 a learner who knows 40% wins too often and one who knows 70% loses too often. Write ${6 - n} more (levels 1 to 3)`);
});

// the final check asks only about core concepts (the League of the game)
const pool = core.reduce((s, p) => s + (p.questions || []).filter((q) => q.level >= 2).length, 0);
if (f.size > pool) err(`finalCheck asks for ${f.size} questions but the core concepts have only ${pool} of level 2 or 3`);

// ---- locks, advanced stations, progression (riddles.mjs; references/7-progression.md) ----
{
  const care = (brief.match(/\*\*Care:?\*\*:?\s*(light|standard|curated)/i) || [])[1]?.toLowerCase() || null;
  const r = checkProgression(c, { match, tools, care });
  r.errors.forEach(err); r.warns.forEach(warn);
}

// ---- mini-games and withheld lines (references/10-games.md; engine/src/mechanics/games/spec.js) ----
if (checkGames) { const r = checkGames(c, { hasCode: (id) => has(`games/${id}.js`) }); r.errors.forEach(err); r.warns.forEach(warn); }
else if (c.games || c.withheld) warn('games and withheld lines were not checked (the engine is not beside the skill)');

// ---- the register of expository text (references/9-prose.md): warnings, never errors ----
checkCourseProse(c).forEach((w) => warn(`prose: ${w}`));

// ---- working documents ----
['knowledge/brief.md', 'knowledge/sources.md', 'knowledge/map.md'].forEach((k) => { if (!has(k)) warn(`${k} is missing`); });

// ---- play time ----
// 6.5 minutes per lab station and 3 per concept (its reading wall), as in references/3-path.md, plus
// the duel with each house's expert (3 to 6 questions of about 20 seconds: 1.5 minutes) and the final
// check (about 20 seconds a question). Rounded to 5 minutes for printing.
function playMinutes(list, round = false) {
  const st = list.reduce((n, p) => n + (p.lab?.stations || []).filter((x) => !x.advanced).length, 0); // advanced stations live upstairs, off the main path
  const m = st * 6.5 + list.length * 3 + list.length * 1.5 + (f.size || 0) / 3;
  return round ? Math.round(m / 5) * 5 : m;
}
const coreMin = playMinutes(core);
if (core.length && coreMin > 60) warn(`the core path is about ${Math.round(coreMin)} minutes of play, more than an hour: mark the least essential concepts "core": false (they stay in town as extras to explore)`);

const stations = concepts.reduce((s, p) => s + (p.lab?.stations?.length || 0), 0);
const summary = [`${c.title || 'course'}: ${themes.length} themes, ${concepts.length} concepts${extra.length ? ` (${core.length} core, ${extra.length} extra)` : ''}, ${stations} lab stations, ${rememberTotal} lines to remember`,
  `core path about ${playMinutes(core, true)} min; everything about ${playMinutes(concepts, true)} min`];
return { errors, warns, summary };
}

// ---- the command line ----
const nodeImport = (m) => import(/* @vite-ignore */ m);
async function main() {
  const { readFileSync, existsSync } = await nodeImport('node:fs');
  const path = (await nodeImport('node:path')).default;
  const { fileURLToPath, pathToFileURL } = await nodeImport('node:url');
  const dir = process.argv[2];
  if (!dir) { console.error('usage: validate.mjs courses/<slug>'); process.exit(2); }
  const file = path.join(dir, 'course.json');
  if (!existsSync(file)) { console.error(`not found: ${file}`); process.exit(2); }
  let c;
  try { c = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.error(`course.json is not valid JSON: ${e.message}`); process.exit(1); }
  // names from the engine, when it is there (these modules have no imports, so Node can read them)
  const eng = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'engine', 'src');
  const load = async (rel, pick) => { try { const f = path.join(eng, ...rel.split('/')); return existsSync(f) ? pick(await import(pathToFileURL(f).href)) : null; } catch { return null; } };
  const env = {
    EMBLEMS: await load('gen/emblems.js', (m) => m.EMBLEMS),
    TRADES: await load('gen/interior/trades.js', (m) => m.TRADE_NAMES),
    TEMPERS: await load('mechanics/duel/tempers.js', (m) => m.TEMPER_NAMES),
    match: await load('mechanics/riddles/match.js', (m) => m),
    tools: await load('mechanics/obstacles/kinds.js', (m) => Object.keys(m.TOOLS)),
    checkReady: await load('lab/patterns/specs.js', (m) => m.checkReady),
    checkGames: await load('mechanics/games/spec.js', (m) => m.checkGames),
    brief: existsSync(path.join(dir, 'knowledge', 'brief.md')) ? readFileSync(path.join(dir, 'knowledge', 'brief.md'), 'utf8') : '',
    has: (k) => existsSync(path.join(dir, k)),
  };
  const { errors, warns, summary } = validateCourse(c, env);
  warns.forEach((w) => console.log(`warning  ${w}`));
  errors.forEach((e) => console.log(`ERROR    ${e}`));
  console.log(`\n${summary.join('\n')}`);
  console.log(`${errors.length} errors, ${warns.length} warnings`);
  process.exit(errors.length ? 1 : 0);
}
if (typeof process !== 'undefined' && /validate\.mjs$/.test(process.argv?.[1] || '')) main();
