// The register of expository text (skills/knowledge-base/references/9-prose.md): the checker finds
// the obvious cases in both languages, leaves tasks and instructions alone where it should, and the
// example courses pass it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { proseIssues, proseFields, checkCourseProse } from '../../skills/knowledge-base/scripts/prose.mjs';

const kinds = (t, o) => proseIssues(t, o).map((x) => x.what);

test('expository text: each defect is found, in English and in Italian', () => {
  assert.deepEqual(kinds('Example:', { lang: 'en' }), ['label']);
  assert.ok(kinds('Lights add. Inks remove. Eyes compare. Simple.', { lang: 'en' }).includes('tele'));
  assert.ok(kinds('Restart riavvia il kernel: le variabili spariscono, il codice resta: semplice e chiaro per tutti.', { lang: 'it' }).includes('colons'));
  assert.ok(kinds('What if we only want half of it? Slicing does it.', { lang: 'en' }).includes('question'));
  assert.ok(kinds('Ora vediamo come funziona la leva.', { lang: 'it' }).includes('opening'));
  assert.ok(kinds('Now we look at the lever.', { lang: 'en' }).includes('opening'));
  assert.ok(kinds('A powerful idea.', { lang: 'en' }).includes('brochure'));
  assert.ok(kinds('Un\'idea fondamentale.', { lang: 'it' }).includes('brochure'));
  assert.ok(kinds('It works!', { lang: 'en' }).includes('bang'));
});

test('a handbook paragraph passes; tasks may ask; instructions are checked only for exclamations and hype', () => {
  assert.deepEqual(kinds('When a red lamp shines on a dark wall, the wall sends red light to the eye. A green lamp on the same spot adds green light, so the wall sends red and green together.', { lang: 'en' }), []);
  assert.deepEqual(kinds('Which lamp is switched off?', { lang: 'en', kind: 'task' }), []);
  assert.deepEqual(kinds('Drag the red lamp. Then the blue one. Now look.', { lang: 'en', kind: 'instruction' }), []);
  assert.deepEqual(kinds('Drag it now!', { lang: 'en', kind: 'instruction' }), ['bang']);
});

test('voice text is not collected; the expository fields are', () => {
  const c = { language: 'en', concepts: [{ id: 'a', expert: { line: 'Wow!' }, page: [{ title: 't', text: 'Example:' }], questions: [{ q: 'Why?', why: 'Because.', traps: [null, 'It tempts!'] }], riddles: [{ clue: 'Guess!', inside: { note: 'Here is a note?' } }] }] };
  const where = proseFields(c).map((f) => f.where).join(' | ');
  assert.ok(!/expert|clue/.test(where));
  const w = checkCourseProse(c).join('\n');
  assert.match(w, /page 1/); assert.match(w, /trap 2/); assert.match(w, /lock/); assert.doesNotMatch(w, /\(question\)/);
});

test('the example course and the Italian test course pass the checker', () => {
  for (const f of ['../../courses/chroma/course.json', 'fixtures/prova/course.json']) {
    const c = JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'));
    assert.deepEqual(checkCourseProse(c), [], f);
  }
});
