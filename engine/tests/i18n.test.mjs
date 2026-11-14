// Languages of a course: the resolver, the choice of the active language, the kit's L.
import test from 'node:test';
import assert from 'node:assert/strict';
import { localise, isLangObject, languagesOf, chooseLang, resolveCourse, makeL, pick } from '../src/course/localise.js';

test('localise: a language object becomes the string of the language', () => {
  assert.equal(localise({ en: 'Hello', it: 'Ciao' }, 'it'), 'Ciao');
  assert.equal(localise({ en: 'Hello', it: 'Ciao' }, 'en'), 'Hello');
});
test('localise: deep, through objects and arrays, and the input is not changed', () => {
  const tree = { title: { en: 'A', it: 'B' }, list: [{ en: 'x', it: 'y' }, 'plain', 3, null, true], deep: { a: { b: [{ c: { en: '1', it: '2' } }] } } };
  const copy = JSON.stringify(tree);
  assert.deepEqual(localise(tree, 'it'), { title: 'B', list: ['y', 'plain', 3, null, true], deep: { a: { b: [{ c: '2' }] } } });
  assert.equal(JSON.stringify(tree), copy);
});
test('localise: fallback to the default language, then to English, then to any present', () => {
  assert.equal(localise({ en: 'Hello' }, 'it'), 'Hello');
  assert.equal(localise({ en: 'Hello', it: '' }, 'it'), 'Hello');
  assert.equal(localise({ it: 'Ciao' }, 'en'), 'Ciao');
  assert.equal(localise({ it: 'Ciao', en: 'Hi' }, 'xx', 'it'), 'Ciao');
  assert.equal(localise({ it: 'Ciao' }, 'it', 'en'), 'Ciao');
});
test('localise: ordinary objects are not language objects (the false-positive guard)', () => {
  const plain = { en: 'x', it: 'y', fr: 'z' }; // a key that is not a language: ordinary data
  assert.deepEqual(localise(plain, 'it'), plain);
  assert.deepEqual(localise({ en: 'x', text: 'y' }, 'it'), { en: 'x', text: 'y' });
  assert.deepEqual(localise({}, 'it'), {});
  assert.deepEqual(localise({ en: 1, it: 2 }, 'it'), { en: 1, it: 2 }); // numbers are data
  assert.deepEqual(localise({ en: null }, 'it'), { en: null });
  assert.deepEqual(localise({ text: 'a', when: { op: 'gt', n: 3 } }, 'it'), { text: 'a', when: { op: 'gt', n: 3 } });
  assert.equal(isLangObject([]), false);
  assert.equal(isLangObject('en'), false);
  assert.equal(isLangObject({ en: 'a' }), true);
});
test('localise: strings, numbers and nulls pass through; lists inside a language object are localised in turn', () => {
  assert.equal(localise('plain', 'it'), 'plain');
  assert.equal(localise(7, 'it'), 7);
  assert.equal(localise(null, 'it'), null);
  assert.deepEqual(localise({ en: ['a', { en: 'b', it: 'c' }], it: ['d'] }, 'en'), ['a', 'b']);
  assert.deepEqual(localise({ en: ['a'], it: ['d'] }, 'it'), ['d']);
});
test('languagesOf: "languages", else just "language"', () => {
  assert.deepEqual(languagesOf({ language: 'en' }), ['en']);
  assert.deepEqual(languagesOf({ language: 'it' }), ['it']);
  assert.deepEqual(languagesOf({ language: 'en', languages: ['en', 'it'] }), ['en', 'it']);
  assert.deepEqual(languagesOf({ language: 'it', languages: ['en', 'it', 'fr'] }), ['en', 'it']);
  assert.deepEqual(languagesOf({ language: 'en-GB' }), ['en']);
  assert.deepEqual(languagesOf({ language: 'fr' }), ['en']);
});
test('chooseLang: ?lang=, then the saved choice, then the browser, then the course language', () => {
  const c = { language: 'en', languages: ['en', 'it'] };
  assert.equal(chooseLang(c, { search: '?lang=it', saved: 'en', browser: ['en-US'] }), 'it');
  assert.equal(chooseLang(c, { search: '?x=1', saved: 'it', browser: ['en-US'] }), 'it');
  assert.equal(chooseLang(c, { search: '', saved: null, browser: ['it-IT', 'en'] }), 'it');
  assert.equal(chooseLang(c, { search: '', saved: null, browser: ['fr-FR', 'it'] }), 'it');
  assert.equal(chooseLang(c, { search: '', saved: null, browser: ['fr-FR'] }), 'en');
  assert.equal(chooseLang(c, {}), 'en');
  assert.equal(chooseLang({ ...c, language: 'it' }, {}), 'it');
  assert.equal(chooseLang(c, { search: '?lang=fr', saved: 'de', browser: 'it-IT' }), 'it', 'unknown codes are ignored');
  assert.equal(chooseLang(c, { search: '?lang=IT' }), 'it');
});
test('chooseLang: a one-language course ignores every choice', () => {
  const c = { language: 'en' };
  assert.equal(chooseLang(c, { search: '?lang=it', saved: 'it', browser: ['it-IT'] }), 'en');
  assert.equal(chooseLang({ language: 'it' }, { search: '?lang=en', browser: ['en-US'] }), 'it');
});
test('resolveCourse: the course and the world in one language, with language and languages set', () => {
  const raw = { language: 'en', languages: ['en', 'it'], title: { en: 'T', it: 'Tt' }, concepts: [] };
  const r = resolveCourse(raw, { hub: { name: { en: 'Square', it: 'Piazza' } } }, { search: '?lang=it' });
  assert.equal(r.LANG, 'it'); assert.equal(r.DATA.title, 'Tt'); assert.equal(r.DATA.language, 'it'); assert.deepEqual(r.DATA.languages, ['en', 'it']);
  assert.equal(r.WORLD.hub.name, 'Piazza');
  assert.equal(raw.title.en, 'T');
});
test('L: the string of the active language, English when the Italian is missing or empty', () => {
  const it = makeL('it'), en = makeL('en');
  assert.equal(it('Hello', 'Ciao'), 'Ciao'); assert.equal(en('Hello', 'Ciao'), 'Hello');
  assert.equal(it('Hello'), 'Hello'); assert.equal(it('Hello', ''), 'Hello'); assert.equal(it('Hello', null), 'Hello');
  assert.equal(it({ en: 'Hello', it: 'Ciao' }), 'Ciao'); assert.equal(en({ en: 'Hello', it: 'Ciao' }), 'Hello');
  assert.equal(it({ en: 'Hello' }), 'Hello'); assert.equal(it({ en: 'Hello', it: '' }), 'Hello');
  assert.equal(pick({ it: 'Solo' }, 'en', 'en'), 'Solo');
});

// ---- the validator, per language ----
import { readFileSync } from 'node:fs';
import { validateCourse } from '../../skills/knowledge-base/scripts/validate.mjs';
import { checkLanguages } from '../../skills/knowledge-base/scripts/languages.mjs';
import { proseIssues } from '../../skills/knowledge-base/scripts/prose.mjs';
import { setLanguage } from '../src/systems/language.js';
import { LANG_KEY, saveLang } from '../src/course/localise.js';

const here = new URL('.', import.meta.url).pathname;
const duo = () => JSON.parse(readFileSync(`${here}fixtures/duo/course.json`, 'utf8'));
const errorsOf = (c) => validateCourse(c, {}).errors;

test('validator: the bilingual fixture is valid in both languages', () => {
  assert.deepEqual(errorsOf(duo()), []);
});
test('validator: a text missing in one language is an error that names the path and the language', () => {
  const c = duo();
  delete c.title.en;
  c.concepts[0].idea = { en: 'x', it: '' };
  const e = errorsOf(c);
  assert.ok(e.some((m) => /^title: the en text is missing/.test(m)), e.join('\n'));
  assert.ok(e.some((m) => /concepts\["leva"\]\.idea: the it text is missing/.test(m)), e.join('\n'));
});
test('parity: every language object has every declared language, non-empty', () => {
  const c = { language: 'en', languages: ['en', 'it'], a: { en: 'x', it: 'y' }, b: { en: 'x' }, list: ['plain', { en: 'p', it: '  ' }] };
  const { errors } = checkLanguages(c, ['en', 'it']);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /^b: the it text is missing/);
  assert.match(errors[1], /^list\[2\]: the it text is missing/);
});
test('parity: a plain string in a two-language course is a warning with the first paths, not an error', () => {
  const c = duo();
  c.pitch = 'A plain pitch left in one language';
  c.concepts[0].page = [{ title: 'Plain title here', text: 'Plain page text that nobody translated.' }];
  const r = validateCourse(c, {});
  assert.deepEqual(r.errors, []);
  const w = r.warns.find((m) => m.startsWith('languages:'));
  assert.ok(w, 'a warning about plain strings');
  assert.match(w, /pitch/);
  assert.match(w, /concepts\["leva"\]\.page\[1\]/);
});
test('parity: short names and single words stay plain without a warning', () => {
  const { warns } = checkLanguages({ language: 'en', languages: ['en', 'it'], concepts: [{ id: 'a', expert: { name: 'Ola', trade: 'painter' }, sign: 'LEVA', page: [] }] }, ['en', 'it']);
  assert.deepEqual(warns, []);
});
test('validator: limits and the prose register are checked in each language on its own text', () => {
  const c = duo();
  const long = Array.from({ length: 40 }, (_, i) => `parola${i}`).join(' ');
  c.bigIdea = { en: 'A short idea about levers.', it: long };
  const e = errorsOf(c);
  assert.ok(e.some((m) => m.startsWith('[it] bigIdea has 40 words')), e.join('\n'));
  assert.ok(!e.some((m) => /^\[en\] bigIdea/.test(m)));
  // the prose word lists follow the language
  assert.equal(proseIssues('Questo è davvero potente.', { lang: 'it' }).length > 0, true);
  assert.equal(proseIssues('Questo è davvero potente.', { lang: 'en' }).length, 0);
  assert.equal(proseIssues('This is powerful.', { lang: 'en' }).length > 0, true);
});
test('validator: a one-language course is checked exactly as before, and an undeclared bilingual text is refused', () => {
  const one = { language: 'en', title: 'T' };
  assert.deepEqual(checkLanguages(one, ['en']), { errors: [], warns: [] });
  const c = duo(); delete c.languages;
  assert.ok(errorsOf(c).some((m) => /does not declare its languages/.test(m)));
  const bad = duo(); bad.languages = ['en', 'fr'];
  assert.ok(errorsOf(bad).some((m) => /"fr" is not supported/.test(m)));
  const dflt = duo(); dflt.language = 'it'; dflt.languages = ['en'];
  assert.ok(errorsOf(dflt).some((m) => /default "language"/.test(m)));
});
test('validator: riddle answers are one flat list; the clue is text', () => {
  const c = duo();
  const r = c.concepts.find((p) => p.riddles).riddles[0];
  assert.ok(typeof r.clue === 'object' || typeof r.clue === 'string');
  r.type = 'text'; delete r.tolerance; delete r.unit; r.answer = ['risposta', 'answer']; // one flat list, every language's variants
  assert.deepEqual(errorsOf(c), []);
});

// ---- one course, two languages: the same ids, so the same save ----
test('the two languages of a course have the same shape: ids, order, numbers; only texts differ', () => {
  const c = duo(), a = localise(c, 'en'), b = localise(c, 'it');
  const shape = (v) => (Array.isArray(v) ? v.map(shape) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)])) : typeof v === 'string' ? 's' : v);
  assert.equal(JSON.stringify(shape(a)), JSON.stringify(shape(b)));
  for (const k of ['id', 'language', 'languages']) assert.deepEqual(a[k], b[k]);
  assert.deepEqual(a.concepts.map((p) => [p.id, p.theme, p.lab?.stations.map((s) => s.id)]), b.concepts.map((p) => [p.id, p.theme, p.lab?.stations.map((s) => s.id)]));
  assert.notEqual(a.title, b.title);
});
test('the save is shared across languages: its key and its ids do not depend on the language', async () => {
  const src = readFileSync(`${here}../src/systems/state.js`, 'utf8');
  assert.match(src, /const KEY = `mnemopolis-\$\{COURSE\.id\}`/, 'the key holds the course id only');
  assert.ok(!/LANG/.test(src), 'state.js knows nothing of the language');
  // what the progress keys are made of: place ids, station ids, question indexes (content.js)
  const content = readFileSync(`${here}../src/data/content.js`, 'utf8');
  assert.match(content, /id: `\$\{p\.id\}-\$\{i\}`/);
  // the language lives under its own key, outside the save
  assert.notEqual(LANG_KEY, 'mnemopolis-duo');
});

// ---- the switch ----
test('setLanguage: saves the choice and reloads; ?lang= in the address is rewritten; nothing for an unknown or the current language', () => {
  const store = {}, had = { location: globalThis.location, localStorage: globalThis.localStorage };
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
  const opts = { languages: ['en', 'it'], current: 'en' };
  try {
    let reloaded = 0;
    globalThis.location = { search: '', href: 'https://x.test/game/index.html' };
    assert.equal(setLanguage('it', { ...opts, reload: () => { reloaded++; } }), true);
    assert.equal(store[LANG_KEY], 'it'); assert.equal(reloaded, 1);
    assert.equal(setLanguage('en', { ...opts, current: 'en' }), false, 'already English');
    assert.equal(setLanguage('fr', opts), false, 'not offered');
    // an address with ?lang=en would beat the saved choice: it is rewritten
    globalThis.location = { search: '?test&lang=en', href: 'https://x.test/index.html?test&lang=en' };
    assert.equal(setLanguage('it', { ...opts, reload: () => { reloaded++; } }), true);
    assert.equal(globalThis.location.search, 'test=&lang=it');
    // a blob: page cannot carry a query: it just reloads
    globalThis.location = { search: '', href: 'blob:https://x.test/abc' };
    setLanguage('it', { ...opts, reload: () => { reloaded++; } });
    assert.equal(reloaded, 2);
    // storage blocked: the address carries the choice instead
    globalThis.localStorage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    globalThis.location = { search: '', href: 'https://x.test/index.html' };
    setLanguage('it', { ...opts, reload: () => { reloaded++; } });
    assert.equal(globalThis.location.search, 'lang=it');
    assert.equal(saveLang('it'), false);
  } finally { globalThis.location = had.location; globalThis.localStorage = had.localStorage; if (had.location === undefined) delete globalThis.location; if (had.localStorage === undefined) delete globalThis.localStorage; }
});
test('a one-language course shows no switch', async () => {
  const { languageSettings, mountTitleSwitch, multilingual } = await import('../src/systems/language.js');
  const { LANGUAGES } = await import('../src/course/_data.js');
  if (LANGUAGES.length > 1) return; // a bilingual course is active: the switch is then expected
  assert.equal(multilingual(), false);
  assert.deepEqual(languageSettings(), []);
  assert.equal(typeof mountTitleSwitch({ createElement: () => { throw new Error('no DOM for one language'); } }), 'function');
});

// ---- packing and the site ----
import { insertPayload, makePayload, titleOf } from '../src/course/packing.js';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, readFileSync as rd } from 'node:fs';
import { tmpdir } from 'node:os';

test('packing: both languages travel in one payload; the head names the course in its own language', () => {
  const course = duo();
  const { payload, errors } = makePayload({ course, labs: {}, slug: 'duo' });
  assert.ok(errors.every((e) => !/language/.test(e)));
  assert.deepEqual(payload.course.languages, ['en', 'it']);
  assert.equal(typeof payload.course.title, 'object', 'the payload keeps both languages; the player resolves them at start-up');
  assert.equal(titleOf(course), course.title.it);
  const player = '<!doctype html><html lang="en"><head><title>x</title></head><body><script type="application/json" id="mnemo-course"></script><script>1</script></body></html>';
  const html = insertPayload(player, payload);
  assert.match(html, /<html lang="it"/);
  assert.match(html, /<title>Officina Prova<\/title>/);
  assert.ok(html.includes('EN: Officina Prova') && html.includes('"it":"Officina Prova"'), 'both titles are in the payload');
});

test('the site: the Italian page shows the Italian title and links with ?lang=it; the chip names both languages', () => {
  const dir = mkdtempSync(`${tmpdir()}/site-`), courses = `${dir}/courses`, out = `${dir}/site`;
  mkdirSync(`${courses}/duo`, { recursive: true }); mkdirSync(`${out}/duo`, { recursive: true });
  cpSync(`${here}fixtures/duo/course.json`, `${courses}/duo/course.json`);
  writeFileSync(`${out}/duo/index.html`, '<html></html>');
  const r = spawnSync('node', [`${here}../../scripts/build-site.mjs`, '--out', out, '--courses', courses], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const en = rd(`${out}/index.html`, 'utf8'), it = rd(`${out}/it/index.html`, 'utf8');
  assert.match(it, /Officina Prova/);
  assert.ok(it.includes('href="../duo/?lang=it"'), 'Italian page links with ?lang=it');
  assert.ok(!it.includes('EN: Officina Prova'), 'no English title on the Italian page');
  assert.ok(en.includes('EN: Officina Prova') && en.includes('href="duo/"'), 'English page: English title, plain link');
  assert.ok(/Inglese · Italiano/.test(it) && /English · Italian/.test(en), 'the chip shows both languages');
});

test('nothing in the engine takes the player\'s language from the course\'s `language` (it is only the default)', async () => {
  const { readdirSync, statSync } = await import('node:fs');
  const files = [];
  const walk = (d) => { for (const f of readdirSync(d)) { const p = `${d}/${f}`; if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p); } };
  walk(`${here}../src`);
  const allowed = ['course/_data.js', 'course/_active.js', 'course/localise.js', 'course/packing.js', 'course/payload.js'];
  const bad = files.filter((f) => !allowed.some((a) => f.endsWith(a))).filter((f) => /\b(DATA|course|COURSE)\??\.language\b/.test(rd(f, 'utf8')));
  assert.deepEqual(bad, [], 'read LANG (mechanics/config.js) instead');
});
