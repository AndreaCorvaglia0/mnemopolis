#!/usr/bin/env node
// Validates a course knowledge base. No dependencies.
//   node skills/knowledge-base/scripts/validate.mjs courses/<slug>
// Checks structure, the limits that keep a course learnable, and the logic of the map and the path.
// Errors must be fixed. Warnings are advice from the method (see ../references).
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = process.argv[2];
if (!dir) { console.error('usage: validate.mjs courses/<slug>'); process.exit(2); }
const file = path.join(dir, 'course.json');
if (!existsSync(file)) { console.error(`not found: ${file}`); process.exit(2); }
let c;
try { c = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.error(`course.json is not valid JSON: ${e.message}`); process.exit(1); }

const errors = [], warns = [];
// emblem names come from the engine (engine/src/gen/emblems.js has no imports, so Node can read it)
let EMBLEMS = null;
try { const f = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'engine', 'src', 'gen', 'emblems.js'); if (existsSync(f)) EMBLEMS = (await import(pathToFileURL(f).href)).EMBLEMS; } catch { EMBLEMS = null; }
// trade names too (engine/src/gen/interior/trades.js has no imports either)
let TRADES = null;
try { const f = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'engine', 'src', 'gen', 'interior', 'trades.js'); if (existsSync(f)) TRADES = (await import(pathToFileURL(f).href)).TRADE_NAMES; } catch { TRADES = null; }
// and the tempers of the duels (engine/src/mechanics/duel/tempers.js, no imports)
let TEMPERS = null;
try { const f = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'engine', 'src', 'mechanics', 'duel', 'tempers.js'); if (existsSync(f)) TEMPERS = (await import(pathToFileURL(f).href)).TEMPER_NAMES; } catch { TEMPERS = null; }
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
    else { if (q.traps[q.answer] !== null) err(`${Q}: the trap of the right option must be null`); q.traps.forEach((t, j) => { if (j !== q.answer && !t) err(`${Q}: option ${j + 1} has no trap. If you cannot name the mistake, it is filler.`); }); }
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
const pool = concepts.reduce((s, p) => s + (p.questions || []).filter((q) => q.level >= 2).length, 0);
if (f.size > pool) err(`finalCheck asks for ${f.size} questions but only ${pool} of level 2 or 3 exist`);

// ---- locks, advanced stations, progression (riddles.mjs; references/7-progression.md) ----
{
  const eng = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'engine', 'src', 'mechanics');
  let match = null, tools = null;
  try { const f = path.join(eng, 'riddles', 'match.js'); if (existsSync(f)) match = await import(pathToFileURL(f).href); } catch { match = null; }
  try { const f = path.join(eng, 'obstacles', 'kinds.js'); if (existsSync(f)) tools = Object.keys((await import(pathToFileURL(f).href)).TOOLS); } catch { tools = null; }
  const brief = existsSync(path.join(dir, 'knowledge', 'brief.md')) ? readFileSync(path.join(dir, 'knowledge', 'brief.md'), 'utf8') : '';
  const care = (brief.match(/\*\*Care:?\*\*:?\s*(light|standard|curated)/i) || [])[1]?.toLowerCase() || null;
  const { checkProgression } = await import('./riddles.mjs');
  const r = checkProgression(c, { match, tools, care });
  r.errors.forEach(err); r.warns.forEach(warn);
}

// ---- working documents ----
['knowledge/brief.md', 'knowledge/sources.md', 'knowledge/map.md'].forEach((k) => { if (!existsSync(path.join(dir, k))) warn(`${k} is missing`); });

warns.forEach((w) => console.log(`warning  ${w}`));
errors.forEach((e) => console.log(`ERROR    ${e}`));
const stations = concepts.reduce((s, p) => s + (p.lab?.stations?.length || 0), 0);
console.log(`\n${c.title || dir}: ${themes.length} themes, ${concepts.length} concepts, ${stations} lab stations, ${rememberTotal} lines to remember, about ${Math.round((stations * 6.5 + concepts.length * 3) / 5) * 5} minutes of play`);
console.log(`${errors.length} errors, ${warns.length} warnings`);
process.exit(errors.length ? 1 : 0);
