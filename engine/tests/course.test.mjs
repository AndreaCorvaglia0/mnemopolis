// The course format: the optional "expert" of a concept, the validator, and where homes come from.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kindOf, expertOf, KIND_OF } from '../src/course/course.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const validator = path.join(root, 'skills', 'knowledge-base', 'scripts', 'validate.mjs');
function validate(edit) {
  const dir = mkdtempSync(path.join(tmpdir(), 'course-'));
  cpSync(path.join(root, 'courses', 'chroma'), dir, { recursive: true });
  const f = path.join(dir, 'course.json'), c = JSON.parse(readFileSync(f, 'utf8'));
  edit(c.concepts.find((p) => p.id === 'wheel'));
  writeFileSync(f, JSON.stringify(c));
  const r = spawnSync('node', [validator, dir], { encoding: 'utf8' });
  return { status: r.status, out: r.stdout };
}

test('the validator accepts an expert and rejects a malformed one', () => {
  assert.equal(validate(() => {}).status, 0, 'the example course is valid');
  assert.equal(validate((p) => { p.expert = { trade: 'painter' }; }).status, 0, 'name and line are optional');
  const free = validate((p) => { p.expert = { name: 'Ola', trade: 'beekeeper', line: 'Bees see colours we do not.' }; });
  assert.equal(free.status, 0, 'a trade outside the registry is allowed');
  assert.match(free.out, /generic home/);
  assert.equal(validate((p) => { p.expert = 'Marta'; }).status, 1, 'a string is not an expert');
  assert.equal(validate((p) => { p.expert = { name: 'Marta' }; }).status, 1, 'a trade is required');
  assert.equal(validate((p) => { p.expert = { trade: 'painter', age: 40 }; }).status, 1, 'unknown fields are refused');
  assert.match(validate((p) => { p.expert = { trade: 'painter', name: 'Maximiliana' }; }).out, /name plate/);
});

test('a concept becomes a home only when asked', () => {
  const c = (type, extra = {}) => ({ id: 'x', type, lab: {}, ...extra });
  for (const type of Object.keys(KIND_OF)) assert.equal(kindOf(c(type), {}, {}), KIND_OF[type], `${type} without an expert stays as before`);
  assert.equal(kindOf(c('view', { expert: { trade: 'painter' } }), {}, {}), 'home');
  assert.equal(kindOf(c('view', { expert: { trade: 'painter' } }), { kind: 'observatory' }, {}), 'observatory', 'world.json wins');
  assert.equal(kindOf(c('cases'), {}, { homes: 'auto' }), 'home');
  assert.equal(kindOf(c('mechanism'), {}, { homes: 'auto' }), 'lab', 'automatic homes only for story, cases and choice');
  assert.equal(kindOf({ id: 's', type: 'story' }, {}, { homes: 'auto' }), 'museum', 'a story without a lab keeps its museum');
  const e = expertOf(c('choice'), {}, { homes: 'auto' });
  assert.ok(e.name && e.trade, 'an automatic expert gets a name and a trade');
  assert.deepEqual(expertOf(c('choice'), {}, { homes: 'auto' }), e, 'the same every time');
});
