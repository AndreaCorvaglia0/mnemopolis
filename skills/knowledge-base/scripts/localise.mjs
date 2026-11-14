// Languages of a course: the resolver and the choice of the active language. Pure: no DOM, no Node
// APIs, so the same code runs in the engine, in the generated _data.js, in the validator and in tests.
//
// Any learner-facing text of course.json (and of world.json) may be a plain string or an object
// with language keys: { "en": "...", "it": "..." }. localise() replaces every such object by the
// string of one language, once, where the course enters the engine; after that everything reads plain
// strings. See engine/docs/ENGINE.md, "Languages".

export const LANGS = ['en', 'it'];
export const LANG_KEY = 'mnemopolis-lang';

const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
// A language object: a plain object with at least one key, every key a known language code, and
// every value text-like (a string, or a list/object of text). Anything else is ordinary data.
export function isLangObject(v) {
  if (!isPlain(v)) return false;
  const k = Object.keys(v);
  return k.length > 0 && k.every((x) => LANGS.includes(x)) && k.every((x) => typeof v[x] === 'string' || (v[x] !== null && typeof v[x] === 'object'));
}

const norm = (l) => { const s = String(l || '').slice(0, 2).toLowerCase(); return LANGS.includes(s) ? s : null; };
export const langOf = (l) => norm(l) || 'en';

// the string of a language object: the language, else the fallback, else English, else any present;
// an empty string counts as missing
export function pick(v, lang, fallback) {
  const has = (l) => l && v[l] !== undefined && v[l] !== null && v[l] !== '';
  for (const l of [lang, fallback, 'en']) if (has(l)) return v[l];
  const any = LANGS.find(has);
  return any ? v[any] : '';
}

// Deep copy of a JSON tree with every language object replaced by its string in `lang`.
export function localise(value, lang, fallback = 'en') {
  const go = (v) => {
    if (Array.isArray(v)) return v.map(go);
    if (!isPlain(v)) return v;
    if (isLangObject(v)) return go(pick(v, lang, fallback));
    const out = {};
    for (const k of Object.keys(v)) out[k] = go(v[k]);
    return out;
  };
  return go(value);
}

// L(en, it) or L({ en, it }) for a language: the string of that language, English when it is missing or empty
export const makeL = (lang) => (en, it) => {
  if (isPlain(en)) return pick(en, lang, 'en');
  return lang === 'it' && it != null && it !== '' ? it : en;
};

// the languages a course offers: "languages" (known codes only), else just its "language"
export function languagesOf(course) {
  const def = langOf(course?.language);
  const l = Array.isArray(course?.languages) ? course.languages.map(norm).filter(Boolean) : [];
  const set = [...new Set(l.length ? l : [def])];
  return set.includes(def) || !l.length ? set : [def, ...set];
}

// The order of choice, once at boot: ?lang=, else the saved choice, else the browser's language (if
// the course offers it), else the course's own `language`. env: { search, saved, browser } where
// browser is a language tag or a list of them.
export function chooseLang(course, env = {}) {
  const offered = languagesOf(course);
  const ok = (l) => { const n = norm(l); return n && offered.includes(n) ? n : null; };
  let fromUrl = null;
  try { fromUrl = new URLSearchParams(env.search || '').get('lang'); } catch (e) { /* no address */ }
  const browser = [].concat(env.browser || []).map(ok).find(Boolean);
  return ok(fromUrl) || ok(env.saved) || browser || langOf(course?.language);
}

// the real environment, when there is one (a browser); {} in Node
export function envNow() {
  const env = {};
  try { env.search = typeof location !== 'undefined' ? location.search : ''; } catch (e) { /* */ }
  // Node (tests, scripts): MNEMO_LANG=it picks the language, as ?lang= does in a browser
  if (!env.search && typeof process !== 'undefined' && process.env?.MNEMO_LANG) env.search = `?lang=${process.env.MNEMO_LANG}`;
  try { env.saved = typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_KEY) : null; } catch (e) { /* storage blocked */ }
  try { if (typeof navigator !== 'undefined') env.browser = navigator.languages?.length ? [...navigator.languages] : [navigator.language]; } catch (e) { /* */ }
  return env;
}

// Everything the engine reads, from the raw course: { LANGUAGES, LANG, DATA, WORLD }.
export function resolveCourse(raw, world = {}, env = envNow()) {
  const LANGUAGES = languagesOf(raw), LANG = chooseLang(raw, env), def = langOf(raw.language);
  return { LANGUAGES, LANG, DATA: { ...localise(raw, LANG, def), language: LANG, languages: LANGUAGES }, WORLD: localise(world || {}, LANG, def) };
}

// the player's choice, saved; the page then reloads (mechanics/quest/menu.js)
export function saveLang(lang) { try { localStorage.setItem(LANG_KEY, lang); return true; } catch (e) { return false; } }
