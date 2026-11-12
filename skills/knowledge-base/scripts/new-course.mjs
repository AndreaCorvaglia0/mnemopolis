#!/usr/bin/env node
// Starts a course folder from the templates:  npm run new -- <slug>
import { mkdirSync, copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const slug = process.argv[2];
if (!/^[a-z][a-z0-9-]*$/.test(slug || '')) { console.error('usage: npm run new -- <slug>   (lowercase letters, digits, dashes)'); process.exit(2); }
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '..', '..', '..'), dir = path.join(root, 'courses', slug);
if (existsSync(dir)) { console.error(`courses/${slug} already exists`); process.exit(1); }
mkdirSync(path.join(dir, 'knowledge'), { recursive: true });
mkdirSync(path.join(dir, 'labs'));
for (const f of ['brief.md', 'sources.md', 'map.md']) copyFileSync(path.join(here, '..', 'templates', f), path.join(dir, 'knowledge', f));
writeFileSync(path.join(dir, 'labs', '.gitkeep'), '');
console.log(`courses/${slug}/ created. Next: follow skills/knowledge-base/SKILL.md and write courses/${slug}/course.json.`);
