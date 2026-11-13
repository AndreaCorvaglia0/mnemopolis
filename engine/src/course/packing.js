// Packing a course into the prebuilt player (scripts/pack.mjs, the /play/ page). Pure: no DOM, no
// Node; the same code runs in both.
//
// The player is the engine built once without a course. It holds an empty
//   <script type="application/json" id="mnemo-course"></script>
// and reads it at start-up (src/course/payload.js). Packing fills it with
//   { slug, course, world, labs: { <conceptId>: "<module source>" }, anims: "<module source>" | null }
// Lab files stay ES modules. Their imports of the engine are rewritten to read the player's kit,
// globalThis.__mnemoKit, which holds exactly the modules in KIT_MODULES. Anything else is refused
// with a message that names the file and the line.

// The import surface of lab code in a packed game: the path after engine/src/ -> what it is.
export const KIT_MODULES = {
  'lab/shell.js': 'the lab frame\'s controls: h, seg, slider, readout, predict, TEXT, LANG',
  'lab/kit.js': 'canvasPane, draggable, rgbCss, hslToRgb, predict, and the helpers for authors (tasks, expr, draw, controls, layout, patterns)',
  'lab/patterns/index.js': 'the ready-made patterns as functions (sliderReveal, compare, sort, order, ...) and their helpers',
  'systems/audio.js': 'sfx: short sounds (tick, plop, chime, reveal, thud...)',
};
export const MARK = 'mnemo-course';
const EMPTY = `<script type="application/json" id="${MARK}"></script>`;

const lineOf = (src, i) => src.slice(0, i).split('\n').length;

// "../../../engine/src/lab/kit.js" -> "lab/kit.js"; null when it is not an engine module
export function kitKey(spec) {
  const m = /(?:^|\/)engine\/src\/(.+)$/.exec(spec.replace(/\\/g, '/'));
  return m ? m[1] : null;
}

// The import clause "a, { b as c, d }" or "* as K" -> a destructuring of the kit module.
function binding(clause, key) {
  const mod = `globalThis.__mnemoKit[${JSON.stringify(key)}]`, out = [];
  let rest = clause.trim();
  const star = /^\*\s+as\s+([A-Za-z_$][\w$]*)$/.exec(rest);
  if (star) return `const ${star[1]} = ${mod};`;
  const def = /^([A-Za-z_$][\w$]*)\s*(?:,|$)/.exec(rest);
  if (def && !rest.startsWith('{')) { out.push(`const ${def[1]} = ${mod}.default;`); rest = rest.slice(def[0].length).trim(); }
  const ns = /^\*\s+as\s+([A-Za-z_$][\w$]*)$/.exec(rest);
  if (ns) { out.push(`const ${ns[1]} = ${mod};`); return out.join(' '); }
  if (rest) {
    const named = /^\{([\s\S]*)\}$/.exec(rest);
    if (!named) return null;
    const parts = named[1].split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
      const m = /^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/.exec(s);
      return m ? (m[2] ? `${m[1]}: ${m[2]}` : m[1]) : null;
    });
    if (parts.includes(null)) return null;
    out.push(`const { ${parts.join(', ')} } = ${mod};`);
  }
  return out.join(' ');
}

// Rewrites the static imports of one lab file. Returns { code, errors, uses }.
export function rewriteImports(src, file = 'lab') {
  const errors = [], uses = new Set();
  const IMPORT = /(^|\n)[ \t]*import(?=[\s{*])\s*([^'";]*?)\s*from\s*(['"])([^'"\n]+)\3[ \t]*;?|(^|\n)[ \t]*import\s*(['"])([^'"\n]+)\6[ \t]*;?/g;
  let code = src.replace(IMPORT, (all, nl, clause, _q, spec, nl2, _q2, bare, at) => {
    const s = spec ?? bare, line = lineOf(src, at + (nl || nl2 || '').length), key = kitKey(s);
    const allowed = `Lab code may import only from the engine's ${Object.keys(KIT_MODULES).map((k) => `engine/src/${k}`).join(', ')}`;
    if (!key) { errors.push(`${file}, line ${line}: import from "${s}" is not available in a packed game. ${allowed}.`); return all; }
    if (!KIT_MODULES[key]) { errors.push(`${file}, line ${line}: "engine/src/${key}" is not part of the lab kit. ${allowed}.`); return all; }
    if (bare != null) { errors.push(`${file}, line ${line}: an import without names ("import '${s}'") does nothing in a packed game; remove it`); return all; }
    const b = binding(clause, key);
    if (!b) { errors.push(`${file}, line ${line}: cannot read the import "${clause.replace(/\s+/g, ' ')}". Write import { a, b as c } from '...'`); return all; }
    uses.add(key);
    return `${nl || ''}${b}`;
  });
  // what the regular expression above cannot rewrite safely
  const dyn = /\bimport\s*\(/.exec(code);
  if (dyn) errors.push(`${file}, line ${lineOf(code, dyn.index)}: dynamic import() is not available in a packed game`);
  const reexp = /(^|\n)\s*export\s*(\*|\{[^}]*\})\s*from\s*['"]/.exec(code);
  if (reexp) errors.push(`${file}, line ${lineOf(code, reexp.index + reexp[1].length)}: "export ... from" is not available in a packed game; import the names, then export them`);
  if (/(^|\n)\s*import\s+[\s\S]*?from/.test(code) && !errors.length) errors.push(`${file}: an import statement could not be read`);
  code = `// packed from ${file}\n${code}\n//# sourceURL=${file}`;
  return { code, errors, uses: [...uses] };
}

// The station ids a lab file provides: the keys of its `export default { ... }` (best effort, without
// running it). null when the default export is not an object literal.
export function stationsIn(src) {
  const m = /export\s+default\s*\{/.exec(src);
  if (!m) return null;
  let i = m.index + m[0].length, depth = 1, start = i;
  const keys = [], take = (s) => { s = s.trim(); if (!s) return; const k = /^(?:async\s+)?\*?\s*['"]?([A-Za-z_$][\w$]*)['"]?/.exec(s); if (k) keys.push(k[1]); };
  for (; i < src.length && depth; i++) {
    const c = src[i];
    if (c === '{' || c === '(' || c === '[') depth++;
    else if (c === '}' || c === ')' || c === ']') { depth--; if (!depth) take(src.slice(start, i)); }
    else if (c === ',' && depth === 1) { take(src.slice(start, i)); start = i + 1; }
    else if (c === '"' || c === "'" || c === '`') { const q = c; i++; while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; } }
  }
  return keys;
}

// Which stations of the course have neither code nor a ready-made pattern? `labs`: { conceptId: source }
export function uncovered(course, labs = {}) {
  const missing = [], unknownFiles = [], unread = [];
  const concepts = new Map((course.concepts || []).map((p) => [p.id, p]));
  for (const f of Object.keys(labs)) if (!concepts.get(f)?.lab) unknownFiles.push(f);
  for (const p of course.concepts || []) {
    if (!p.lab) continue;
    const src = labs[p.id], keys = src != null ? stationsIn(src) : [];
    if (src != null && keys == null) { unread.push(p.id); continue; }
    for (const s of p.lab.stations || []) if (!s.ready && !keys.includes(s.id)) missing.push(`${p.id}.${s.id}`);
  }
  return { missing, unknownFiles, unread };
}

// Everything the player needs, from the files of a course folder. Returns { payload, errors, warnings }.
//   files: { course: object, world?: object, labs?: { conceptId: source }, anims?: source, slug? }
export function makePayload({ course, world = {}, labs = {}, anims = null, slug = null }) {
  const errors = [], warnings = [], out = {};
  for (const [id, src] of Object.entries(labs)) {
    const r = rewriteImports(src, `labs/${id}.js`);
    errors.push(...r.errors); out[id] = r.code;
  }
  let a = null;
  if (anims) { const r = rewriteImports(anims, 'anims.js'); errors.push(...r.errors); a = r.code; }
  const cov = uncovered(course, labs);
  if (cov.missing.length) errors.push(`${cov.missing.length === 1 ? 'This station has' : 'These stations have'} no code and no "ready" pattern: ${cov.missing.join(', ')}. Write them in labs/<conceptId>.js (export default { <stationId>: mount }) or give the station "ready": { "kind": ... }.`);
  cov.unknownFiles.forEach((f) => warnings.push(`labs/${f}.js: no concept "${f}" with a lab in course.json; the file is ignored`));
  cov.unread.forEach((f) => warnings.push(`labs/${f}.js: its default export is not an object literal, so its stations could not be checked before playing`));
  return { payload: { v: 1, slug: slug || course.id || 'course', course, world: world || {}, labs: out, anims: a }, errors, warnings };
}

// JSON that is safe inside <script>: no "</script", no "<!--"
export const safeJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function isPlayer(html) { return html.includes(EMPTY); }

// The game: the player with the course inside.
export function insertPayload(player, payload) {
  const n = player.split(EMPTY).length - 1;
  if (n !== 1) throw new Error(n ? 'the player holds the course placeholder more than once' : 'this file is not an empty player (no course placeholder): rebuild it with npm run build:player');
  const lang = String(payload.course.language || 'en').slice(0, 2);
  // the title and the language are set in the head only, before the engine's code
  const cut = player.indexOf('<script'), head = player.slice(0, cut), rest = player.slice(cut);
  return head.replace(/<title>[^<]*<\/title>/, () => `<title>${esc(payload.course.title || 'Mnemopolis')}</title>`).replace(/<html lang="[^"]*"/, () => `<html lang="${esc(lang)}"`)
    + rest.replace(EMPTY, () => `<script type="application/json" id="${MARK}">${safeJson(payload)}</script>`);
}
