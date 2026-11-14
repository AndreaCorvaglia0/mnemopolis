#!/usr/bin/env node
// Turns a course folder into a playable game, one HTML file, without installing anything or
// running the bundler: the course (course.json, optional world.json, labs/*.js, anims.js) goes
// into the prebuilt player.
//   node scripts/pack.mjs courses/<slug> [out.html] [--player path/to/player.html]
//   npm run pack -- <slug>
// The player is engine/dist/player.html (npm run build:player builds it once; CI publishes it at
// /play/player.html). Lab files are ES modules; their imports of the engine are rewritten to the
// player's kit (engine/src/course/packing.js, KIT_MODULES): anything else is refused, by name.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), opt = (k) => { const i = args.indexOf(k); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const playerPath = opt('--player') || path.join(root, 'engine', 'dist', 'player.html');
let [dir, out] = args;
if (!dir) { console.error('usage: node scripts/pack.mjs courses/<slug> [out.html] [--player player.html]'); process.exit(2); }
if (!existsSync(dir) && existsSync(path.join(root, 'courses', dir))) dir = path.join(root, 'courses', dir);
if (!existsSync(path.join(dir, 'course.json'))) { console.error(`No course.json in ${dir}`); process.exit(2); }
if (!existsSync(playerPath)) { console.error(`No player at ${playerPath}. Build it once with: npm run build:player (or pass --player <file>, e.g. the player.html of the project's /play/ page)`); process.exit(2); }

const { validateCourse } = await import(pathToFileURL(path.join(root, 'skills', 'knowledge-base', 'scripts', 'validate.mjs')).href);
const { makePayload, insertPayload } = await import(pathToFileURL(path.join(root, 'engine', 'src', 'course', 'packing.js')).href);
const eng = (rel, pick) => import(pathToFileURL(path.join(root, 'engine', 'src', rel)).href).then(pick).catch(() => null);

const read = (f) => readFileSync(path.join(dir, f), 'utf8');
let course, world = {};
try { course = JSON.parse(read('course.json')); } catch (e) { console.error(`course.json is not valid JSON: ${e.message}`); process.exit(1); }
if (existsSync(path.join(dir, 'world.json'))) try { world = JSON.parse(read('world.json')); } catch (e) { console.error(`world.json is not valid JSON: ${e.message}`); process.exit(1); }

// 1. the course itself, with the validator of the knowledge-base skill
const v = validateCourse(course, {
  EMBLEMS: await eng('gen/emblems.js', (m) => m.EMBLEMS), TRADES: await eng('gen/interior/trades.js', (m) => m.TRADE_NAMES),
  TEMPERS: await eng('mechanics/duel/tempers.js', (m) => m.TEMPER_NAMES), match: await eng('mechanics/riddles/match.js', (m) => m),
  tools: await eng('mechanics/obstacles/kinds.js', (m) => Object.keys(m.TOOLS)), checkReady: await eng('lab/patterns/specs.js', (m) => m.checkReady), checkGames: await eng('mechanics/games/spec.js', (m) => m.checkGames),
  brief: existsSync(path.join(dir, 'knowledge', 'brief.md')) ? read('knowledge/brief.md') : '', has: (k) => existsSync(path.join(dir, k)),
});
v.warns.forEach((w) => console.log(`warning  ${w}`));
v.errors.forEach((e) => console.log(`ERROR    ${e}`));
if (v.errors.length) { console.log(`\n${v.errors.length} errors in course.json: not packed.`); process.exit(1); }

// 2. the lab code and the animations
const labsDir = path.join(dir, 'labs'), labs = {};
if (existsSync(labsDir)) for (const f of readdirSync(labsDir)) if (f.endsWith('.js') && statSync(path.join(labsDir, f)).isFile()) labs[f.slice(0, -3)] = readFileSync(path.join(labsDir, f), 'utf8');
const anims = existsSync(path.join(dir, 'anims.js')) ? read('anims.js') : null;
const libDir = path.join(dir, 'labs', 'lib'), libs = {};
if (existsSync(libDir)) for (const f of readdirSync(libDir)) if (f.endsWith('.js')) libs[f.slice(0, -3)] = readFileSync(path.join(libDir, f), 'utf8');
const gamesDir = path.join(dir, 'games'), games = {};
if (existsSync(gamesDir)) for (const f of readdirSync(gamesDir)) if (f.endsWith('.js')) games[f.slice(0, -3)] = readFileSync(path.join(gamesDir, f), 'utf8');
const slug = path.basename(path.resolve(dir));
const { payload, errors, warnings } = makePayload({ course, world, labs, anims, slug, games, libs });
warnings.forEach((w) => console.log(`warning  ${w}`));
errors.forEach((e) => console.log(`ERROR    ${e}`));
if (errors.length) { console.log(`\n${errors.length} errors in the lab code: not packed.`); process.exit(1); }

// 3. the game
out ||= path.join(root, 'engine', 'dist', `${slug}.html`);
const html = insertPayload(readFileSync(playerPath, 'utf8'), payload);
writeFileSync(out, html);
console.log(`${course.title}: ${Object.keys(labs).length} lab files, ${Object.keys(games).length} game files, ${course.concepts.reduce((n, p) => n + (p.lab?.stations || []).filter((s) => s.ready).length, 0)} ready-made stations -> ${path.relative(process.cwd(), out)} (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
