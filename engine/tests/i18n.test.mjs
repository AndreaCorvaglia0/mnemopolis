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
