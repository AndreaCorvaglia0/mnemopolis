// The language switch. The language is chosen once at boot (course/localise.js: ?lang=, the saved
// choice, the browser, the course's own); changing it saves the choice and reloads the page, so that
// everything (the town, the labs, the voice) starts again in the new language. The save file does not
// change: it holds ids and numbers, never text, so progress survives the switch.
// Shown only when the course has more than one language.
import { LANG, LANGUAGES } from '../course/_data.js';
import { saveLang } from '../course/localise.js';

export const LANG_NAMES = { en: 'English', it: 'Italiano' };
export const multilingual = () => LANGUAGES.length > 1;
const nextOf = (lang = LANG) => LANGUAGES[(LANGUAGES.indexOf(lang) + 1) % LANGUAGES.length];

// choose `lang`: save it, then reload. A ?lang= in the address would win over the saved choice, so it
// is rewritten; an address that cannot carry a query (a blob: page of the /play/ viewer) just reloads.
export function setLanguage(lang, { reload = () => location.reload() } = {}) {
  if (!LANGUAGES.includes(lang) || lang === LANG) return false;
  const saved = saveLang(lang);
  try {
    const q = new URLSearchParams(location.search);
    if ((q.has('lang') || !saved) && !/^blob:/.test(location.href)) {
      q.set('lang', lang);
      location.search = q.toString();
      return true;
    }
  } catch (e) { /* fall through */ }
  reload();
  return true;
}

// the entry of the settings list of the menu and the notebook: { label, value, on, toggle }
export const languageSettings = () => (multilingual()
  ? [{ label: 'Language · Lingua', on: () => true, value: () => LANG_NAMES[LANG], toggle: () => { setLanguage(nextOf()); } }]
  : []);

// A small EN / IT switch on the title screen (HTML, above the canvas). Returns a function that removes it.
export function mountTitleSwitch(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc || !multilingual()) return () => {};
  const box = doc.createElement('div');
  box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Language · Lingua'); box.dataset.langSwitch = '1';
  box.style.cssText = 'position:fixed;top:12px;right:12px;z-index:30;display:flex;gap:6px;font:600 14px/1 system-ui,sans-serif';
  for (const l of LANGUAGES) {
    const b = doc.createElement('button');
    b.type = 'button'; b.textContent = l.toUpperCase(); b.lang = l; b.title = LANG_NAMES[l]; b.setAttribute('aria-pressed', String(l === LANG)); b.dataset.lang = l;
    b.style.cssText = `min-width:44px;min-height:36px;padding:6px 10px;border-radius:8px;border:1px solid #4fd1c5;cursor:pointer;color:${l === LANG ? '#0d0f1e' : '#e9e2c9'};background:${l === LANG ? '#4fd1c5' : 'rgba(13,15,30,.7)'}`;
    b.onclick = (e) => { e.stopPropagation(); setLanguage(l); };
    box.append(b);
  }
  for (const ev of ['keydown', 'keyup', 'pointerdown', 'mousedown', 'touchstart']) box.addEventListener(ev, (e) => e.stopPropagation());
  doc.body.append(box);
  return () => box.remove();
}
