// Optional read-aloud with the browser's own speech synthesis (Web Speech API). No audio files, no
// network. Off unless the course asks for it in world.json ("voice": true, or
// { "auto": false, "rate": 1, "say": { "RGB": "R G B" } }) or the address has ?voice.
// Nothing reads by itself unless "auto" is true: the learner presses Listen.
// Everything about speech lives here. No function in this file may throw: the API can be missing,
// blocked or silent (some embedded viewers), and the game must not notice.
import { DATA, WORLD } from '../course/_data.js';
import { state, save } from './state.js';

const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const raw = WORLD?.voice ?? (q.has('voice') ? true : false);
const CFG = raw && typeof raw === 'object' ? { auto: false, rate: 1, say: {}, ...raw } : { auto: false, rate: 1, say: {} };
const LANG = String(DATA.language || 'en').replace('_', '-');
const synth = (() => {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') return null;
    return window.speechSynthesis;
  } catch (e) { return null; }
})();

// The feature: on in this build and possible in this browser. `broken` is set when the browser
// refuses to speak, and hides every control.
export const VOICE = { enabled: !!raw && !!synth, auto: !!CFG.auto };
let broken = false, silent = 0, lastError = null;
export const available = () => VOICE.enabled && !broken;
// the learner's choice, saved with the game like the music setting
export const isOn = () => available() && !state.voiceOff;

// listeners redraw their button when speech starts or stops, or the voice is switched
const subs = new Set();
let speaking = false;
export const isSpeaking = () => speaking;
export function onChange(fn) { subs.add(fn); return () => subs.delete(fn); }
const notify = () => subs.forEach((fn) => { try { fn(); } catch (e) { /* a closed page */ } });
const setSpeaking = (v) => { if (speaking !== v) { speaking = v; notify(); } };

// ---- the voice: the best installed one for the course language ----
let chosen;
function pickVoice() {
  if (chosen !== undefined) return chosen;
  let list = [];
  try { list = synth.getVoices() || []; } catch (e) { list = []; }
  if (!list.length) return null; // not loaded yet: the browser picks by lang, and we try again later
  const want = LANG.toLowerCase(), base = want.split('-')[0];
  const mine = typeof navigator !== 'undefined' ? String(navigator.language || '').toLowerCase() : '';
  let best = null, top = 0;
  for (const v of list) {
    const l = String(v.lang || '').replace('_', '-').toLowerCase();
    if (l.split('-')[0] !== base) continue;
    const s = 10 + (l === want ? 4 : 0) + (l === mine ? 2 : 0) + (v.localService ? 3 : 0) + (v.default ? 1 : 0);
    if (s > top) { top = s; best = v; }
  }
  chosen = best;
  return chosen;
}
if (VOICE.enabled) {
  try { synth.addEventListener?.('voiceschanged', () => { chosen = undefined; }); } catch (e) { /* ignore */ }
  // leaving the page or hiding the tab stops the voice
  try {
    window.addEventListener('pagehide', () => stop());
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  } catch (e) { /* ignore */ }
}

// ---- text: from what the learner reads to what a voice can say ----
const WORDS = {
  en: { '%': ' percent', '→': ', gives ', '=': ' equals ', '≈': ' about ', '×': ' times ', '–': ' to ' },
  it: { '%': ' per cento', '→': ', dà ', '=': ' uguale a ', '≈': ' circa ', '×': ' per ', '–': ' a ' },
  es: { '%': ' por ciento', '→': ', da ', '=': ' igual a ', '≈': ' aproximadamente ', '×': ' por ', '–': ' a ' },
  fr: { '%': ' pour cent', '→': ', donne ', '=': ' égale ', '≈': ' environ ', '×': ' fois ', '–': ' à ' },
  de: { '%': ' Prozent', '→': ', ergibt ', '=': ' gleich ', '≈': ' etwa ', '×': ' mal ', '–': ' bis ' },
};
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

// Makes written course text speakable: no markup, symbols as words, the course's own pronunciations.
// Symbols without words in the course language become a pause or are left to the voice.
export function speakable(text, lang = LANG) {
  let s = String(text ?? '');
  s = s.replace(/<br\s*\/?>|<\/(p|li|h\d|div|figcaption)>/gi, '. ').replace(/<[^>]*>/g, '')
    .replace(/&(#\d+|[a-z]+);/gi, (m, e) => (e[0] === '#' ? String.fromCharCode(+e.slice(1)) : ENT[e.toLowerCase()] ?? m));
  s = s.replace(/`+|\*\*|__|^#+\s*|^\s*[-*•]\s+/gm, '');
  for (const [k, v] of Object.entries(CFG.say || {})) s = s.replace(new RegExp(`(^|[^\\p{L}\\p{N}])${reEsc(k)}(?=$|[^\\p{L}\\p{N}])`, 'gu'), `$1${v}`);
  const w = WORDS[String(lang).toLowerCase().split('-')[0]];
  s = s.replace(/(\d)(?:\s*–\s*|-)(\d)/g, w ? `$1${w['–']}$2` : '$1, $2');
  s = s.replace(/[%→≈×=]/g, (c) => (w ? w[c] : c === '→' ? ', ' : c));
  s = s.replace(/[·|]/g, ', ').replace(/[←↑↓▶▼✓✕]/g, ' ');
  return s.replace(/\s+([,.;:!?])/g, '$1').replace(/([.,;:!?])(?:\s*[.,;:])+/g, '$1').replace(/\s+/g, ' ').trim();
}

// Joins blocks (a title, a paragraph, a list item) so that each ends as a sentence.
export function script(parts) {
  return parts.filter(Boolean).map((p) => speakable(p)).filter(Boolean).map((p) => (/[.!?:;…]$/.test(p) ? p : `${p}.`)).join(' ');
}

// Short pieces: some browsers stop a long utterance after about fifteen seconds.
function chunks(text, max = 200) {
  const out = [];
  for (const sent of text.match(/[^.!?…]+[.!?…]*["')\]]*\s*/g) || []) {
    let s = sent.trim();
    while (s.length > max) {
      const cut = Math.max(s.lastIndexOf(', ', max), s.lastIndexOf('; ', max), s.lastIndexOf(' ', max));
      const at = cut > max / 3 ? cut + 1 : max;
      out.push(s.slice(0, at).trim()); s = s.slice(at).trim();
    }
    if (s) out.push(s);
  }
  return out;
}

// ---- speaking ----
let token = 0, watch = 0;
export function stop() {
  token++;
  clearInterval(watch);
  if (synth) try { synth.cancel(); } catch (e) { /* ignore */ }
  setSpeaking(false);
}

// Reads a text aloud, cancelling whatever was being read. Resolves when it ends or is stopped.
export function speak(text, { lang = LANG } = {}) {
  stop();
  if (!isOn()) return Promise.resolve(false);
  const parts = chunks(speakable(text, lang));
  if (!parts.length) return Promise.resolve(false);
  const my = token;
  setSpeaking(true);
  return new Promise((resolve) => {
    let i = 0, started = false, idle = 0, cur = null;
    const end = (ok) => { cur = null; if (my === token) { clearInterval(watch); setSpeaking(false); } resolve(ok); };
    const next = () => {
      if (my !== token) return resolve(false);
      if (i >= parts.length) return end(true);
      let u;
      try {
        u = new SpeechSynthesisUtterance(parts[i++]);
        u.lang = lang; u.rate = Math.max(0.5, Math.min(2, +CFG.rate || 1));
        const v = pickVoice();
        if (v) try { u.voice = v; } catch (e) { /* the browser picks by lang */ }
      } catch (e) { return end(false); }
      cur = u; idle = 0;
      u.onstart = () => { started = true; silent = 0; };
      u.onend = () => { if (cur === u) { cur = null; next(); } };
      u.onerror = (e) => {
        if (cur !== u) return;
        cur = null;
        if (e && (e.error === 'not-allowed' || e.error === 'synthesis-unavailable' || e.error === 'audio-hardware')) { broken = true; notify(); return end(false); }
        if (e && (e.error === 'canceled' || e.error === 'interrupted')) return end(false);
        if (!started) { lastError = e?.error || 'error'; if (++silent >= 2) { broken = true; notify(); } return end(false); }
        next();
      };
      try { synth.resume(); synth.speak(u); } catch (e) { broken = true; notify(); end(false); }
    };
    // Safari and some embedded viewers do not always fire "end", or never start: look every second
    clearInterval(watch);
    watch = setInterval(() => {
      if (my !== token) return clearInterval(watch);
      let busy = true;
      try { busy = synth.speaking || synth.pending; } catch (e) { busy = false; }
      if (busy) { idle = 0; return; }
      if (++idle < 3) return;
      if (!started && ++silent >= 2) { broken = true; notify(); } // nothing ever played: hide the controls
      if (!started) return end(false);
      if (cur) { cur = null; next(); }
    }, 1000);
    next();
  });
}

// Listen / Stop in one: reads the text, or stops if something is being read.
export function listen(getText) {
  if (speaking) { stop(); return; }
  const t = typeof getText === 'function' ? getText() : getText;
  speak(t);
}

// The learner's on/off switch. Returns the new state.
export function toggle() {
  if (!available()) return false;
  state.voiceOff = !state.voiceOff;
  save();
  stop();
  notify();
  return isOn();
}

// for checks in the browser: what the voice would say for a text, and with which voice
export const debug = () => ({ enabled: VOICE.enabled, broken, lastError, on: isOn(), lang: LANG, voice: pickVoice()?.name || null, rate: CFG.rate });
