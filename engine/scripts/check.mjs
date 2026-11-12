// Checks the course database against the limits that keep a town learnable. Run: npm run check
// Errors stop the build. Warnings are advice.
import { COURSE } from '../src/course/course.js';

const KINDS = ['lab', 'archive', 'hall', 'studio', 'observatory', 'workshop', 'museum', 'cave'];
const NATURES = ['river', 'shore', 'forest', 'meadow', 'hill'];
const MONUMENTS = ['fountain', 'obelisk', 'statue', 'arch', 'bell', 'stones'];
const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);
const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

let LABS = {}, PAGES = {};
try { ({ LABS } = await import('../src/course/labs/index.js')); } catch (e) { warn(`labs could not be loaded outside the browser (${e.message.split('\n')[0]}); lab checks skipped`); LABS = null; }
try { ({ PAGES } = await import('../src/course/pages.js')); } catch (e) { warn(`pages could not be loaded (${e.message.split('\n')[0]})`); PAGES = null; }

if (!COURSE.id || COURSE.id === 'chroma-demo') warn('course.id is still the demo id: change it, or saves from the demo will leak into your course');
if (!COURSE.bigIdea) err('bigIdea is missing: the one sentence the whole course hangs on');
else if (words(COURSE.bigIdea) > 28) err(`bigIdea has ${words(COURSE.bigIdea)} words: keep it to 28 or fewer`);
const ds = COURSE.districts || [];
if (ds.length < 1 || ds.length > 4) err(`${ds.length} districts: a town has 1 to 4`);
const dup = (arr) => arr.filter((v, i) => v && arr.indexOf(v) !== i);
dup(ds.map((d) => d.nature)).forEach((n) => err(`two districts share the landscape "${n}": each district needs its own, it is the memory cue`));
dup([COURSE.hub?.monument || 'fountain', ...ds.map((d) => d.landmark || 'obelisk')]).forEach((n) => err(`two places share the landmark "${n}": landmarks must all differ`));
if (COURSE.hub?.monument && !MONUMENTS.includes(COURSE.hub.monument)) err(`hub.monument "${COURSE.hub.monument}" is not one of ${MONUMENTS.join(', ')}`);
const ids = new Set();
let total = 0;
for (const d of ds) {
  const D = `district "${d.id}"`;
  if (!NATURES.includes(d.nature)) err(`${D}: nature must be one of ${NATURES.join(', ')}`);
  if (d.landmark && !MONUMENTS.includes(d.landmark)) err(`${D}: landmark must be one of ${MONUMENTS.join(', ')}`);
  if (!d.idea) err(`${D}: idea is missing`); else if (words(d.idea) > 18) err(`${D}: idea has ${words(d.idea)} words, keep it to 18 or fewer`);
  const ps = d.places || [];
  if (ps.length < 1 || ps.length > 4) err(`${D}: ${ps.length} places, a district has 1 to 4`);
  for (const p of ps) {
    const Pn = `place "${p.id}"`;
    total++;
    if (ids.has(p.id)) err(`${Pn}: id used twice`); ids.add(p.id);
    if (!/^[a-z][a-z0-9]*$/.test(p.id || '')) err(`${Pn}: id must be lowercase letters and digits`);
    if (!KINDS.includes(p.kind)) err(`${Pn}: kind must be one of ${KINDS.join(', ')}`);
    for (const f of ['name', 'concept', 'objective', 'idea']) if (!p[f]) err(`${Pn}: ${f} is missing`);
    if (words(p.idea) > 28) err(`${Pn}: idea has ${words(p.idea)} words, keep it to 28 or fewer`);
    if (p.sign && p.sign.length > 9) err(`${Pn}: sign "${p.sign}" is longer than 9 characters`);
    if (!p.sign && p.name && p.name.length > 9) warn(`${Pn}: no sign given, the building will show "${p.name.toUpperCase().slice(0, 9)}"`);
    if (!p.host?.name) warn(`${Pn}: no host`);
    if (!p.anchor && p.kind !== 'museum') warn(`${Pn}: no anchor (analogy, metaphor, example or contrast)`);
    if (!p.remember?.length) err(`${Pn}: remember is missing: 1 to 3 lines the learner must keep`);
    else if (p.remember.length > 3) err(`${Pn}: ${p.remember.length} remember lines, keep 3 at most`);
    if (!p.explain && p.kind !== 'museum') warn(`${Pn}: no explain question ("explain it yourself")`);
    const qs = p.questions || [], l1 = qs.filter((q) => (q.level || 1) === 1), up = qs.filter((q) => q.level >= 2);
    if (!l1.length) err(`${Pn}: no level-1 question (a key fact for the review meadows)`);
    if (l1.length > 3) err(`${Pn}: ${l1.length} level-1 questions, keep 3 at most: few facts, repeated`);
    if (!up.length) err(`${Pn}: no level-2 or level-3 question (needed for the house quiz and the league)`);
    qs.forEach((q, i) => {
      if (!q.q || !Array.isArray(q.options) || q.options.length < 3 || q.options.length > 4) err(`${Pn} question ${i + 1}: needs a text and 3 or 4 options`);
      else if (!(q.answer >= 0 && q.answer < q.options.length)) err(`${Pn} question ${i + 1}: answer index out of range`);
      if (!q.why) err(`${Pn} question ${i + 1}: "why" is missing: every answer is explained`);
    });
    if (p.kind === 'museum') {
      const n = p.timeline?.length || 0;
      if (n < 4 || n > 14) err(`${Pn}: a museum timeline has 4 to 14 plaques (found ${n})`);
      (p.timeline || []).forEach((m, i) => { for (const f of ['year', 'title', 'text']) if (!m[f]) err(`${Pn} plaque ${i + 1}: ${f} is missing`); if (!m.src) warn(`${Pn} plaque ${i + 1}: no source`); });
    } else if (LABS) {
      const lab = LABS[p.id];
      if (!lab) { err(`${Pn}: no lab in src/course/labs/index.js`); continue; }
      const max = p.kind === 'workshop' ? 8 : 3, n = lab.stations?.length || 0;
      if (n < 1 || n > max) err(`${Pn}: ${n} stations, a ${p.kind} has 1 to ${max}`);
      (lab.stations || []).forEach((st, i) => {
        const S = `${Pn} station ${i + 1}`;
        for (const f of ['tab', 'takeaway']) if (!st[f]) err(`${S}: ${f} is missing`);
        if (!st.goal && !st.why) err(`${S}: goal is missing`);
        if (words(st.goal || st.why) > 26) err(`${S}: goal has ${words(st.goal || st.why)} words, keep it to 26 or fewer`);
        if (!st.tries?.length || st.tries.length > 3) err(`${S}: needs 1 to 3 "try this" lines`);
        if (typeof st.mount !== 'function') err(`${S}: mount is missing`);
        else if (!/\.did\(|\.reveal\(/.test(st.mount.toString()) && !/did\(|reveal\(/.test(String(lab.stations.map((x) => x.mount)))) warn(`${S}: mount never calls ctx.did() or ctx.reveal(), so the takeaway cannot appear`);
        if (!st.source) warn(`${S}: no source line (say what is real, simplified or computed)`);
      });
    }
    if (PAGES && !PAGES[p.id] && p.kind !== 'museum') warn(`${Pn}: no reading page in src/course/pages.js`);
  }
}
if (total > 12) warn(`${total} places: more than 12 is hard to keep in mind. Consider a second town.`);
const lg = COURSE.league || {};
if (!(lg.size > 0) || !(lg.pass > 0 && lg.pass <= 1)) err('league needs size (number of questions) and pass (0 to 1)');

warns.forEach((w) => console.log(`warning  ${w}`));
errors.forEach((e) => console.log(`ERROR    ${e}`));
console.log(`${ds.length} districts, ${total} places: ${errors.length} errors, ${warns.length} warnings`);
process.exit(errors.length ? 1 : 0);
