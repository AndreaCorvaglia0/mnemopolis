// The /play/ page: course files in, a game out, all in the browser. Nothing is uploaded.
// The checks are the ones of the command line: the validator of the knowledge-base skill
// (validateCourse) and the packing of src/course/packing.js (lab imports, stations without code).
import { validateCourse } from '../../skills/knowledge-base/scripts/validate.mjs';
import { checkReady } from '../src/lab/patterns/specs.js';
import { checkGames } from '../src/mechanics/games/spec.js';
import { EMBLEMS } from '../src/gen/emblems.js';
import { TRADE_NAMES } from '../src/gen/interior/trades.js';
import { TEMPER_NAMES } from '../src/mechanics/duel/tempers.js';
import * as match from '../src/mechanics/riddles/match.js';
import { TOOLS } from '../src/mechanics/obstacles/kinds.js';
import { makePayload, insertPayload } from '../src/course/packing.js';

const IT = /^it\b/i.test(navigator.language || '');
const T = IT ? {
  title: 'Crea un gioco da un corso',
  how1: 'Scegli i file della cartella del tuo corso: <code>course.json</code> e, se ci sono, <code>labs/*.js</code>, <code>anims.js</code>, <code>world.json</code>. Oppure trascinali qui, o incolla solo <code>course.json</code>.',
  how2: 'La pagina controlla il corso con le stesse regole del validatore e ti dice in parole semplici cosa correggere.',
  how3: 'Se va tutto bene, gioca qui oppure scarica il gioco come un unico file HTML da condividere.',
  private: 'Tutto avviene nel tuo browser: nessun file viene caricato su un server.',
  code: 'Attenzione: il codice dei laboratori (<code>labs/*.js</code>) viene eseguito in questa pagina, come in qualunque gioco scaricato. Usa solo file di cui ti fidi.',
  drop: 'Trascina qui i file o l’intera cartella del corso',
  pickFiles: 'Scegli i file', pickFolder: 'Scegli una cartella', paste: 'Oppure incolla course.json', check: 'Controlla',
  download: 'Scarica il gioco come un unico file', play: 'Gioca qui', close: 'Chiudi',
  ok: (t, w) => `<b>${t}</b> è pronto.${w ? ` ${w} avvisi, sotto: non bloccano il gioco.` : ''}`,
  errs: (n) => `${n === 1 ? 'Un problema impedisce' : `${n} problemi impediscono`} di creare il gioco:`,
  warns: (n) => `${n} avvisi (consigli del metodo, non bloccano)`,
  noCourse: 'Manca course.json: scegli anche quel file.', badJson: (m) => `course.json non è JSON valido: ${m}`, badWorld: (m) => `world.json non è JSON valido: ${m}`,
  noPlayer: 'Il motore del gioco (player.html) non si trova accanto a questa pagina. Apri la pagina dal sito del progetto, oppure usa da terminale: node scripts/pack.mjs courses/<nome>.',
  files: 'File letti:',
} : {
  title: 'Make a game from a course',
  how1: 'Choose the files of your course folder: <code>course.json</code> and, if there are any, <code>labs/*.js</code>, <code>anims.js</code>, <code>world.json</code>. Or drop them here, or paste <code>course.json</code> alone.',
  how2: 'The page checks the course with the same rules as the validator and tells you in plain words what to fix.',
  how3: 'When it is fine, play it here, or download the game as one HTML file to share.',
  private: 'Everything happens in your browser: no file is uploaded to any server.',
  code: 'Note: the lab code (<code>labs/*.js</code>) runs in this page, as in any game you download. Use only files you trust.',
  drop: 'Drop the files, or the whole course folder, here',
  pickFiles: 'Choose files', pickFolder: 'Choose a folder', paste: 'Or paste course.json', check: 'Check',
  download: 'Download the game as one file', play: 'Play it here', close: 'Close',
  ok: (t, w) => `<b>${t}</b> is ready.${w ? ` ${w} warnings below: they do not stop the game.` : ''}`,
  errs: (n) => `${n === 1 ? 'One problem stops' : `${n} problems stop`} the game from being made:`,
  warns: (n) => `${n} warnings (advice from the method; they do not stop the game)`,
  noCourse: 'course.json is missing: choose that file too.', badJson: (m) => `course.json is not valid JSON: ${m}`, badWorld: (m) => `world.json is not valid JSON: ${m}`,
  noPlayer: 'The game engine (player.html) is not next to this page. Open the page from the project\'s website, or in a terminal use: node scripts/pack.mjs courses/<name>.',
  files: 'Files read:',
};
document.documentElement.lang = IT ? 'it' : 'en';
document.querySelectorAll('[data-t]').forEach((el) => { el.innerHTML = T[el.dataset.t]; });

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
let player = null, game = null;
const getPlayer = async () => { if (player) return player; const r = await fetch('player.html'); if (!r.ok) throw new Error(r.status); player = await r.text(); return player; };

// files: [{ path, text }] -> the parts of a course
function sortFiles(files) {
  const by = (re) => files.find((f) => re.test(f.path));
  const course = by(/(^|\/)course\.json$/) || files.find((f) => f.path.endsWith('.json') && /"concepts"/.test(f.text));
  const root = course ? course.path.replace(/course\.json$|[^/]*$/, '') : '';
  const world = by(/(^|\/)world\.json$/), anims = by(/(^|\/)anims\.js$/);
  const labs = {};
  const games = {}, libs = {};
  files.filter((f) => f.path.endsWith('.js') && f !== anims).forEach((f) => { (/(^|\/)labs\/lib\/[^/]+\.js$/.test(f.path) ? libs : /(^|\/)games\/[^/]+\.js$/.test(f.path) ? games : labs)[f.path.split('/').pop().slice(0, -3)] = f.text; });
  const knowledge = new Set(files.filter((f) => f.path.startsWith(`${root}knowledge/`)).map((f) => f.path.slice(root.length)));
  const brief = files.find((f) => f.path === `${root}knowledge/brief.md`)?.text || '';
  return { course, world, anims, labs, games, libs, knowledge, brief, folder: files.some((f) => f.path.includes('/')) };
}

async function make(files) {
  $('files').innerHTML = files.length ? `<li>${esc(T.files)}</li>${files.map((f) => `<li>${esc(f.path)}</li>`).join('')}` : '';
  const out = $('out'), F = sortFiles(files), errors = [], warns = [];
  out.innerHTML = '';
  if (!F.course) { out.innerHTML = `<div class="msg bad">${esc(T.noCourse)}</div>`; return; }
  let course, world = {};
  try { course = JSON.parse(F.course.text); } catch (e) { out.innerHTML = `<div class="msg bad">${esc(T.badJson(e.message))}</div>`; return; }
  if (F.world) try { world = JSON.parse(F.world.text); } catch (e) { out.innerHTML = `<div class="msg bad">${esc(T.badWorld(e.message))}</div>`; return; }
  const v = validateCourse(course, { EMBLEMS, TRADES: TRADE_NAMES, TEMPERS: TEMPER_NAMES, match, tools: Object.keys(TOOLS), checkReady, checkGames, brief: F.brief, has: (k) => (k.startsWith('games/') ? !!F.games[k.slice(6, -3)] : !F.folder || F.knowledge.has(k)) });
  errors.push(...v.errors); warns.push(...v.warns);
  const p = makePayload({ course, world, labs: F.labs, anims: F.anims?.text || null, slug: course.id, games: F.games, libs: F.libs });
  errors.push(...p.errors); warns.push(...p.warnings);
  const warnHtml = warns.length ? `<details><summary>${esc(T.warns(warns.length))}</summary><ul class="warn">${warns.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></details>` : '';
  if (errors.length) { out.innerHTML = `<div class="msg bad">${esc(T.errs(errors.length))}<ul>${errors.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>${warnHtml}`; return; }
  let html;
  try { html = insertPayload(await getPlayer(), p.payload); } catch { out.innerHTML = `<div class="msg bad">${esc(T.noPlayer)}</div>${warnHtml}`; return; }
  game = { html, name: `${course.id || 'game'}.html`, title: course.title };
  out.innerHTML = `<div class="msg ok">${T.ok(esc(course.title), warns.length)}<div class="row" style="justify-content:flex-start"><button type="button" class="primary" id="play">${esc(T.play)}</button><button type="button" id="dl">${esc(T.download)}</button></div></div>${warnHtml}`;
  $('play').onclick = play; $('dl').onclick = download;
}

function download() {
  if (!game) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([game.html], { type: 'text/html' })); a.download = game.name;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function play() {
  if (!game) return;
  const url = URL.createObjectURL(new Blob([game.html], { type: 'text/html' }));
  $('frame').src = url; $('gameTitle').textContent = game.title; $('game').hidden = false; $('frame').focus();
}
$('close').onclick = () => { const f = $('frame'); URL.revokeObjectURL(f.src); f.src = 'about:blank'; $('game').hidden = true; };
$('dl2').onclick = download;

const readAll = (list) => Promise.all([...list].map(async (f) => ({ path: f.webkitRelativePath || f.relPath || f.name, text: await f.text() })));
$('pick').onchange = async (e) => make(await readAll(e.target.files));
$('pickDir').onchange = async (e) => make(await readAll(e.target.files));
$('usePaste').onclick = () => make([{ path: 'course.json', text: $('pasted').value }]);
// drag and drop: files, or a folder (walked recursively)
const drop = $('drop');
['dragenter', 'dragover'].forEach((k) => drop.addEventListener(k, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((k) => drop.addEventListener(k, () => drop.classList.remove('over')));
const walk = (entry, base = '') => new Promise((res) => {
  if (entry.isFile) entry.file((f) => { f.relPath = base + f.name; res([f]); }, () => res([]));
  else if (entry.isDirectory) { const r = entry.createReader(), all = []; const next = () => r.readEntries(async (es) => { if (!es.length) { res((await Promise.all(all)).flat()); return; } es.forEach((x) => all.push(walk(x, `${base}${entry.name}/`))); next(); }, () => res([])); next(); }
  else res([]);
});
drop.addEventListener('drop', async (e) => {
  e.preventDefault();
  const items = [...(e.dataTransfer.items || [])].map((i) => i.webkitGetAsEntry?.()).filter(Boolean);
  const files = items.length ? (await Promise.all(items.map((x) => walk(x)))).flat() : [...e.dataTransfer.files];
  make(await readAll(files.filter((f) => /\.(json|js|md)$/.test(f.name))));
});
// for tests: window.__play.make([{ path, text }])
window.__play = { make, game: () => game };
