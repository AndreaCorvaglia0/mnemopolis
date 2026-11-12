// Checks the active course before a build:
//   1. the knowledge base itself, with the validator of the knowledge-base skill;
//   2. that every lab station designed in course.json has code;
//   3. that the town can be generated from it.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SLUG } from '../src/course/_data.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const v = spawnSync('node', [path.join(root, 'skills', 'knowledge-base', 'scripts', 'validate.mjs'), path.join(root, 'courses', SLUG)], { stdio: 'inherit' });
if (v.status) process.exit(v.status);

const { LABS } = await import('../src/course/labs.js');
let bad = 0;
for (const [id, lab] of Object.entries(LABS)) for (const s of lab.stations) if (!s.coded) { console.log(`ERROR    station "${id}.${s.id}" has no code: export it from courses/${SLUG}/labs/${id}.js`); bad++; }
try { const m = await import('../src/world/townMap.js'); console.log(`town: ${m.MAP_W} x ${m.MAP_H} tiles, ${m.BUILDINGS.length} buildings`); } catch (e) { console.log(`ERROR    the town cannot be generated: ${e.message}`); bad++; }
process.exit(bad ? 1 : 0);
