// Checks of the languages of a course (the rest of the validator runs once per language, on the
// localised tree: validate.mjs). A text is a plain string or { "en": "...", "it": "..." }.
//   - "languages" holds known codes, and "language" (the default) is one of them;
//   - parity: every language object has every declared language, not empty;
//   - language keys mixed with other keys in one object, or an object in a language the course does
//     not declare, are mistakes;
//   - a plain string where the text should be in two languages: a WARNING (proper names, note
//     letters and the like are legitimately the same), with the first few paths.
// Pure: no DOM, no Node APIs. Returns { errors, warns }.
import { LANGS, isLangObject } from './localise.mjs';

// the keys that hold text the learner reads (the same list as the schema's text fields)
const TEXT_KEYS = new Set(['title', 'subject', 'bigIdea', 'learner', 'pitch', 'credit', 'note', 'name', 'idea', 'text', 'why', 'learn', 'teaser', 'told', 'place', 'sign', 'objective', 'wrongBelief', 'limits', 'application', 'remember', 'q', 'a', 'how', 'caption', 'who', 'line', 'tab', 'goal', 'object', 'action', 'surprise', 'options', 'controls', 'tries', 'takeaway', 'clue', 'goals', 'traps', 'label', 'labels', 'prompt', 'items', 'hint', 'threads']);
const MAX_LISTED = 5;

export function checkLanguages(c, langs) {
  const errors = [], warns = [], plain = [];
  const known = (c.languages ?? []);
  if (c.languages !== undefined && (!Array.isArray(c.languages) || !c.languages.length)) errors.push('languages: an array of language codes, e.g. ["en", "it"]');
  else known.filter((l) => !LANGS.includes(l)).forEach((l) => errors.push(`languages: "${l}" is not supported (only ${LANGS.join(' and ')})`));
  if (Array.isArray(c.languages) && c.language && !c.languages.includes(String(c.language).slice(0, 2))) errors.push(`languages: the default "language" (${c.language}) must be one of them`);
  const multi = langs.length > 1;
  let used = false;
  const path = (p, k, item) => (typeof k === 'number' ? `${p}[${item?.id ? `"${item.id}"` : k + 1}]` : p ? `${p}.${k}` : String(k));
  const walk = (v, p, textual) => {
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, path(p, i, x), textual)); return; }
    if (v && typeof v === 'object') {
      const keys = Object.keys(v), lk = keys.filter((k) => LANGS.includes(k));
      if (isLangObject(v)) {
        used = true;
        if (multi) for (const l of langs) if (v[l] === undefined || v[l] === null || (typeof v[l] === 'string' && !v[l].trim())) errors.push(`${p}: the ${l} text is missing or empty (a bilingual course has every text in ${langs.join(' and ')})`);
        // the text inside may itself be text; nothing deeper is expected
        return;
      }
      if (lk.length && lk.length < keys.length && lk.length === keys.filter((k) => /^[a-z]{2}$/.test(k)).length && keys.length - lk.length <= 1 && keys.some((k) => /^[a-z]{2}$/.test(k) && !LANGS.includes(k))) errors.push(`${p}: language keys (${lk.join(', ')}) mixed with others (${keys.filter((k) => !LANGS.includes(k)).join(', ')}); only ${LANGS.join(' and ')} are supported`);
      keys.forEach((k) => walk(v[k], path(p, k), textual || TEXT_KEYS.has(k)));
      return;
    }
    if (typeof v === 'string' && textual && multi && /\p{L}/u.test(v) && (/\s/.test(v.trim()) || v.length >= 12)) plain.push(p);
  };
  walk(c, '', false);
  // `used` only matters for a one-language course that wrote language objects
  if (!multi && used) errors.push('some texts are { "en": ..., "it": ... } but the course does not declare its languages: add "languages": ["en", "it"] (otherwise only the default language is played)');
  if (plain.length) warns.push(`languages: ${plain.length} text${plain.length === 1 ? '' : 's'} left as a plain string in a course that declares ${langs.join(' and ')} (the learner reads them in every language; proper names and note letters are fine as they are). First ${Math.min(MAX_LISTED, plain.length)}: ${plain.slice(0, MAX_LISTED).join('; ')}`);
  return { errors, warns };
}
