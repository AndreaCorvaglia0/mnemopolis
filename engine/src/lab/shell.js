// The lab: a full-screen viewer that opens on top of the town.
// One station = one learning objective. The stage (the station's picture) is the screen; a panel
// beside it (a bottom sheet on an upright screen) leads through one thing at a time:
//   1. the question, if the design has one: the picture is already there, frozen;
//   2. "You said X": the picture comes alive; one step at a time, "Now: <step>", ticking itself;
//   3. when the steps are done: the verdict on the prediction, the takeaway, and one button: Next.
// The panel folds away (a rail, or a one-line strip on a phone) and the stage can go full screen:
// a bar along the picture's bottom edge then keeps the step, the result and Next in view.
// The theory opens beside the picture (a sheet on a phone).
import { LABS, UPPER_LABS } from '../course/labs.js';
import { state, save } from '../systems/state.js';
import { sfx } from '../systems/audio.js';
import { touch } from '../systems/view.js';
import { available, isOn, isSpeaking, onChange, listen, stop as stopVoice, speak, script, VOICE } from '../systems/voice.js';
import { codePanel } from './code.js';
import { CSS } from './style.js';
import { readingArticle } from './reading.js';
import { DATA } from '../course/_data.js';

// Every word the frame shows, in one place: English and Italian. The set follows the course's
// `language` (course.json), with English for anything missing. Another language is one more
// entry in STRINGS with the same keys.
const STRINGS = {
  en: {
    close: 'Close the lab', closeWord: 'Close', theory: 'Theory', stations: 'Stations', stage: 'The picture',
    full: 'Full screen', unfull: 'Exit full screen', hide: 'Hide', show: 'Show', hidePanel: 'Hide the panel', showPanel: 'Show the panel',
    lock: 'Answer the question first', lockGo: 'Show the question',
    pick: 'Pick an answer. Then try it on the picture.',
    question: 'Question', explore: 'Your turn', result: 'Result',
    said: 'You said', check: 'Now check it on the picture.',
    left: (n) => (n === 1 ? 'One more step, then the answer.' : `${n} more steps, then the answer.`),
    now: 'Now', of: (a, b) => `${a} of ${b}`, where: 'Show me where', onPicture: 'Do it on the picture.',
    youRight: (s) => `You said ${s}: right.`, youWrong: (s, a) => `You said ${s}. Answer: ${a}.`, youSaid: (s) => `You said ${s}.`,
    compare: 'Compare it with what you saw.', answer: 'Answer',
    pillRight: (a) => `${a}: right`, pillWrong: (a, s) => `${a}, not ${s}`,
    allDone: 'All steps done', stepsDone: (n) => (n === 1 ? 'Step done' : `${n} steps done`),
    takeaway: 'Takeaway', keep: 'The picture stays live: keep exploring.',
    listen: 'Listen', stop: 'Stop', readAloud: 'Read aloud', stopReading: 'Stop reading aloud',
    next: (t) => `Next: ${t}`, nextShort: 'Next', back: 'Back to the room', more: 'More',
    about: 'About this picture', station: (i, n, t, d) => `Station ${i} of ${n}: ${t}${d ? ', done' : ''}`,
  },
  it: {
    close: 'Chiudi il laboratorio', closeWord: 'Chiudi', theory: 'Teoria', stations: 'Postazioni', stage: "L'immagine",
    full: 'Schermo intero', unfull: 'Esci dallo schermo intero', hide: 'Nascondi', show: 'Mostra', hidePanel: 'Nascondi il pannello', showPanel: 'Mostra il pannello',
    lock: 'Prima rispondi alla domanda', lockGo: 'Vai alla domanda',
    pick: "Scegli una risposta. Poi provala sull'immagine.",
    question: 'Domanda', explore: 'Tocca a te', result: 'Risultato',
    said: 'Hai detto', check: "Ora verificalo sull'immagine.",
    left: (n) => (n === 1 ? 'Ancora un passo, poi la risposta.' : `Ancora ${n} passi, poi la risposta.`),
    now: 'Ora', of: (a, b) => `${a} di ${b}`, where: 'Mostrami dove', onPicture: "Fallo direttamente sull'immagine.",
    youRight: (s) => `Hai detto ${s}: giusto.`, youWrong: (s, a) => `Hai detto ${s}. Risposta: ${a}.`, youSaid: (s) => `Hai detto ${s}.`,
    compare: 'Confrontalo con quello che hai visto.', answer: 'Risposta',
    pillRight: (a) => `${a}: giusto`, pillWrong: (a, s) => `${a}, non ${s}`,
    allDone: 'Tutti i passi fatti', stepsDone: (n) => (n === 1 ? 'Passo fatto' : `${n} passi fatti`),
    takeaway: 'Da ricordare', keep: "L'immagine resta attiva: continua a esplorare.",
    listen: 'Ascolta', stop: 'Ferma', readAloud: 'Leggi ad alta voce', stopReading: 'Ferma la lettura',
    next: (t) => `Avanti: ${t}`, nextShort: 'Avanti', back: 'Torna alla stanza', more: 'Altro',
    about: 'Su questa immagine', station: (i, n, t, d) => `Postazione ${i} di ${n}: ${t}${d ? ', fatta' : ''}`,
  },
};
export const LANG = String(DATA.language || 'en').slice(0, 2).toLowerCase();
export const TEXT = { ...STRINGS.en, ...(STRINGS[LANG] || {}) };
export { STRINGS };

const ICON = {
  x: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  book: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5v13"/></svg>',
  full: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  unfull: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
  chev: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  lock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
  speaker: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>',
  stopsq: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  chevl: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  up: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
  target: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  arrow: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};
const icon = (k) => { const s = document.createElement('span'); s.style.display = 'contents'; s.innerHTML = ICON[k]; return s; };
const plain = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v; else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null) el.append(kid);
  return el;
}

// ---- small controls ----
export function seg(options, value, onChange) {
  const el = h('div', { class: 'lab-seg', role: 'group' });
  const set = (v, fire = true) => { if (fire) sfx.tick(); [...el.children].forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === String(v))); if (fire) onChange(v); };
  options.forEach(([v, label]) => el.append(h('button', { type: 'button', 'data-v': v, 'aria-pressed': String(v) === String(value), onclick: () => set(v) }, label)));
  el.set = set;
  return el;
}

export function slider(label, min, max, value, onInput, { step = 1, fmt = (v) => v } = {}) {
  const out = h('output', {}, String(fmt(value)));
  const input = h('input', { type: 'range', min, max, step, value, 'aria-label': label, oninput: () => { out.textContent = fmt(+input.value); onInput(+input.value); } });
  const el = h('div', { class: 'lab-row' }, h('label', {}, label, out), input);
  el.set = (v) => { input.value = v; out.textContent = fmt(+v); };
  return el;
}

export const readout = (html = '') => h('div', { class: 'lab-read', role: 'status', html });

// "Predict first" as a free-standing control, for stations that ask a second question of their
// own. The frame asks the question of course.json by itself; most stations never call this.
export function predict(controls, question, options) {
  return new Promise((resolve) => {
    const box = h('div', { class: 'lx-choices', role: 'group', 'aria-label': question });
    options.forEach((o, i) => box.append(h('button', { type: 'button', class: 'lx-choice', onclick: () => { sfx.tick(); [...box.children].forEach((b, j) => { b.disabled = true; b.style.opacity = j === i ? 1 : 0.45; if (j === i) b.style.borderColor = 'var(--gold)'; }); resolve(i); } }, h('span', { class: 'k' }, String.fromCharCode(65 + i)), o)));
    controls.append(h('div', { class: 'lx-q' }, question), box);
  });
}

let styled = false;
const style = () => { if (!styled) { document.head.append(h('style', { html: CSS })); styled = true; } };

// Read aloud (systems/voice.js): a Listen / Stop button for the text that getText() returns, or
// null when the course has no voice or the browser cannot speak. Hidden while the learner has the
// voice switched off. `listenKey(e)` is the key that does the same (L). With `cls` 'lx-btn' it
// is the lab's icon button with a short label.
export function listenButton(getText, cls = 'hb-say') {
  if (!available()) return null;
  style();
  const lab = cls.includes('lx-btn');
  const b = h('button', { class: cls, type: 'button', 'aria-pressed': 'false', onclick: () => listen(getText) });
  const draw = () => {
    if (!b.isConnected && b.dataset.on) { off(); return; }
    const on = isSpeaking();
    b.hidden = !isOn();
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? TEXT.stopReading : TEXT.readAloud);
    b.title = on ? TEXT.stopReading : TEXT.readAloud;
    if (lab) b.replaceChildren(icon(on ? 'stopsq' : 'speaker'), h('span', { class: 't' }, on ? TEXT.stop : TEXT.listen));
    else b.textContent = `${on ? TEXT.stop : TEXT.listen}${touch.on ? '' : '  (L)'}`;
  };
  const off = onChange(draw);
  requestAnimationFrame(() => { b.dataset.on = '1'; });
  draw();
  return b;
}
export const listenKey = (e) => (e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName || '') && !e.target?.isContentEditable && isOn();
export { listen, stopVoice, speak, script, VOICE, isOn };

// The frame of the reading wall and the map: a header with a title, Listen (if the course has a
// voice) and a close button.
export function overlay(title, sub, getText = null) {
  style();
  const close = h('button', { type: 'button', class: 'hb-close', 'aria-label': TEXT.closeWord }, icon('x'), TEXT.closeWord);
  const tabs = h('div', { class: 'hb-tabs' });
  const say = getText ? listenButton(getText) : null;
  const root = h('div', { class: 'hb-over', role: 'dialog', 'aria-label': title }, h('div', { class: `hb-top${say ? ' has-say' : ''}` }, h('h1', { html: `${title}${sub ? ` <span>· ${sub}</span>` : ''}` }), tabs, say, close));
  document.body.append(root);
  return { root, tabs, close, say };
}

// Opens the lab of one building. Resolves when the player goes back to town.
// { upper: [stationIds] }: the advanced stations of its upper floor that are open to the player
// (mechanics/floors/), saved as 'id+up:<stationId>' so that the list may grow as locks open.
export function openLab(id, start = 0, { upper = null } = {}) {
  style();
  const lab = upper ? { ...UPPER_LABS[id], stations: UPPER_LABS[id].stations.filter((s) => upper.includes(s.id)) } : LABS[id], N = lab.stations.length;
  const doneKey = (j) => (upper ? `${id}+up:${lab.stations[j].id}` : `${id}:${j}`);

  // ---- header: the lab's name (a title, not a link), the stations as steps, Listen, Theory, Close ----
  const steps = h('nav', { class: `lx-steps${N > 4 ? ' many' : ''}`, 'aria-label': TEXT.stations });
  const tabTip = h('div', { class: 'lx-tabtip', 'aria-hidden': 'true', hidden: '' });
  const theoryBtn = h('button', { type: 'button', class: 'lx-btn lx-theory', 'aria-haspopup': 'dialog', title: TEXT.theory }, icon('book'), h('span', { class: 't' }, TEXT.theory));
  const close = h('button', { type: 'button', class: 'lx-x', 'aria-label': TEXT.close, title: TEXT.close }, icon('x'));
  // what Listen reads: set by each station for its current phase
  let speech = () => '', drawerSpeech = () => '';
  const say = listenButton(() => speech(), 'lx-btn lx-say');
  const tools = h('div', { class: 'lx-tools' }, say, theoryBtn, close);
  const top = h('header', { class: 'lx-top' }, h('h1', { class: 'lx-name' }, lab.title), steps, tools);

  // ---- the stage column: picture, controls docked under it (phone), and a bar along its bottom edge ----
  const stage = h('div', { class: 'lab-stage' });
  const pings = h('div', { class: 'lx-pings', 'aria-hidden': 'true' });
  const stageBox = h('div', { class: 'lx-stagebox' }, stage, pings);
  const dock = h('div', { class: 'lx-dock', hidden: '' });
  // the brief: one line with the progress or the result, wherever the panel is not visible
  const bMark = h('span', { class: 'lx-bmark', 'aria-hidden': 'true' });
  const bText = h('button', { type: 'button', class: 'lx-btext' });
  const bNext = h('button', { type: 'button', class: 'lx-bnext' });
  const brief = h('div', { class: 'lx-brief', role: 'status' }, bMark, bText, bNext);
  const fsBtn = h('button', { type: 'button', class: 'lx-btn lx-fs', 'aria-pressed': 'false' });
  const fsClose = h('button', { type: 'button', class: 'lx-x lx-fsx', 'aria-label': TEXT.close, title: TEXT.close }, icon('x'));
  const bar = h('div', { class: 'lx-bar' }, brief, fsBtn, fsClose);
  const stageWrap = h('section', { class: 'lx-stagewrap', 'aria-label': TEXT.stage }, stageBox, dock, bar);

  // ---- the panel (a bottom sheet on an upright screen) ----
  const hLabel = h('span', { class: 'lab' });
  const handle = h('button', { type: 'button', class: 'lx-handle', 'aria-expanded': 'true' }, h('i', { class: 'grab' }), hLabel);
  const status = h('div', { class: 'lx-status' });
  const pips = h('div', { class: 'lx-pips', 'aria-hidden': 'true' });
  const tog = h('button', { type: 'button', class: 'lx-tog', 'aria-expanded': 'true' });
  const phead = h('div', { class: 'lx-phead' }, status, h('div', { class: 'lx-grow' }), pips, tog);
  const strip = h('div', { class: 'lx-strip' });
  const guide = h('div', { class: 'lx-guide' });
  const extra = h('div', { class: 'lx-extra' });
  const scroll = h('div', { class: 'lx-scroll' }, guide, extra);
  const moreBar = h('button', { type: 'button', class: 'lx-morebar', tabindex: '-1' }, h('span', {}, TEXT.more), icon('down'));
  const act = h('div', { class: 'lx-act' });
  const panel = h('aside', { class: 'lx-panel', 'aria-label': lab.title }, handle, phead, strip, scroll, moreBar, act);
  const main = h('div', { class: 'lx-main' }, stageWrap, panel);

  const dClose = h('button', { type: 'button', class: 'lx-x', 'aria-label': `${TEXT.closeWord}: ${TEXT.theory}`, title: TEXT.closeWord }, icon('x'));
  const dBody = h('div', { class: 'hb-page lx-dbody', tabindex: '0' });
  const dSay = listenButton(() => drawerSpeech(), 'lx-btn lx-say');
  const drawer = h('div', { class: 'lx-drawer', role: 'dialog', 'aria-label': TEXT.theory, inert: '' }, h('div', { class: 'lx-dhead' }, h('h2', {}, TEXT.theory), dSay, dClose), dBody);
  const scrim = h('div', { class: 'lx-scrim' });

  const root = h('div', { class: `hb-over lx${lab.wide ? ' wide' : ''}`, role: 'dialog', 'aria-label': lab.title, lang: LANG }, top, main, scrim, drawer, tabTip);
  document.body.append(root);

  let current = start, cleanup = [], token = 0, collapsed = false, full = false, theory = false;
  let phase = 'explore', controls = null, onPhase = () => {}, drawBrief = () => {};

  // upright screens and narrow windows: stage on top, panel as a bottom sheet
  const stackQ = () => innerWidth < 760 || (innerHeight > innerWidth && innerWidth < 1000);
  const isStack = () => root.classList.contains('stack');
  // where things live depends on the layout: the brief in the folded sheet on a phone, otherwise
  // in the stage bar; Listen and Full screen in the sheet's head on a phone
  const place = () => {
    const st = isStack();
    const briefHome = st && !full && phase !== 'ask' ? strip : bar;
    if (brief.parentNode !== briefHome) briefHome.prepend(brief);
    const fsHome = st && !full ? phead : bar;
    if (fsBtn.parentNode !== fsHome) fsHome.insertBefore(fsBtn, fsHome === bar ? fsClose : tog);
    if (say) { const sh = st ? phead : tools; if (say.parentNode !== sh) sh.insertBefore(say, st ? fsBtn.parentNode === phead ? fsBtn : tog : theoryBtn); }
    // the sheet's Hide / Show: in its head when open, beside the one-line strip when folded
    const hh = st && collapsed ? strip : phead;
    if (handle.parentNode !== hh) hh.append(handle);
    if (controls) { const ch = st ? dock : extra; if (controls.parentNode !== ch) ch.append(controls); }
    dock.hidden = !(st && controls && controls.childElementCount && phase !== 'ask');
  };
  const relayout = () => { root.classList.toggle('stack', stackQ()); place(); drawFs(); drawTog(); cue(); };

  // ---- panel: fold away (rail or strip), drag the sheet, "More" cue ----
  const drawTog = () => {
    const st = isStack();
    tog.replaceChildren(collapsed ? icon('chevl') : h('span', { class: 't' }, TEXT.hide), collapsed ? h('span', { class: 't' }, TEXT.show) : icon('chev'));
    tog.setAttribute('aria-expanded', String(!collapsed)); tog.setAttribute('aria-label', collapsed ? TEXT.showPanel : TEXT.hidePanel); tog.title = tog.getAttribute('aria-label');
    hLabel.replaceChildren(icon(collapsed ? 'up' : 'down'), collapsed ? TEXT.show : TEXT.hide);
    handle.setAttribute('aria-expanded', String(!collapsed)); handle.setAttribute('aria-label', collapsed ? TEXT.showPanel : TEXT.hidePanel);
    handle.hidden = !st;
  };
  const setCollapsed = (v) => {
    collapsed = v; root.classList.toggle('collapsed', v);
    if (v) panel.classList.remove('sized');
    place(); drawTog(); drawBrief();
    requestAnimationFrame(cue);
  };
  tog.onclick = (e) => { e.stopPropagation(); setCollapsed(!collapsed); };
  // on a bottom sheet the handle and the head can be dragged up or down, or tapped
  let drag = null;
  const dragStart = (e) => {
    if (!isStack() || (e.target.closest('button') && e.target.closest('button') !== handle)) return;
    drag = { y: e.clientY, h0: panel.getBoundingClientRect().height, moved: false };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic */ }
  };
  const dragMove = (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dy) < 8) return;
    drag.moved = true;
    const total = main.getBoundingClientRect().height, hgt = Math.max(64, Math.min(total * 0.85, drag.h0 - dy));
    if (collapsed) { collapsed = false; root.classList.remove('collapsed'); drawTog(); }
    panel.classList.add('sized'); panel.style.setProperty('--sheet', `${hgt}px`);
  };
  const dragEnd = (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) { if (e.currentTarget === handle || e.type === 'pointerup') setCollapsed(!collapsed); return; }
    if (panel.getBoundingClientRect().height < 140) { panel.classList.remove('sized'); setCollapsed(true); } else setCollapsed(false);
  };
  for (const el of [handle, phead]) { el.addEventListener('pointerdown', dragStart); el.addEventListener('pointermove', dragMove); el.addEventListener('pointerup', dragEnd); el.addEventListener('pointercancel', () => { drag = null; }); }
  handle.addEventListener('click', (e) => { if (e.detail === 0) setCollapsed(!collapsed); }); // keyboard
  const cue = () => {
    const below = scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight > 12;
    panel.classList.toggle('more', below && !collapsed);
  };
  scroll.addEventListener('scroll', cue, { passive: true });
  new ResizeObserver(cue).observe(scroll);
  addEventListener('resize', relayout);
  moreBar.onclick = () => scroll.scrollBy({ top: scroll.clientHeight * 0.7, behavior: 'smooth' });

  // ---- full screen stage: the bar keeps the progress, the result, Next, a way out and Close ----
  const drawFs = () => {
    const lab2 = full ? TEXT.unfull : TEXT.full;
    fsBtn.replaceChildren(icon(full ? 'unfull' : 'full'), h('span', { class: 't' }, lab2));
    fsBtn.setAttribute('aria-pressed', String(full)); fsBtn.setAttribute('aria-label', lab2); fsBtn.title = lab2;
  };
  const setFull = (v) => { full = v; root.classList.toggle('full', v); place(); drawFs(); drawBrief(); };
  fsBtn.onclick = () => setFull(!full);

  // ---- theory: a side panel over the panel's column on a wide screen (the picture stays visible),
  // a sheet on a phone ----
  let stopAnims = null, lastFocus = null;
  const setTheory = (v) => {
    theory = v; root.classList.toggle('theory', v);
    const modal = isStack();
    top.inert = v && modal; main.inert = v && modal; panel.inert = v;
    if (v) { drawer.removeAttribute('inert'); drawer.setAttribute('aria-modal', String(modal)); lastFocus = document.activeElement; dClose.focus({ preventScroll: true }); }
    else { drawer.setAttribute('inert', ''); stopAnims?.(); stopAnims = null; lastFocus?.focus?.({ preventScroll: true }); }
    stopVoice();
    theoryBtn.setAttribute('aria-expanded', String(v)); theoryBtn.setAttribute('aria-pressed', String(v));
  };
  theoryBtn.onclick = () => {
    if (theory) { setTheory(false); return; }
    const st = lab.stations[current], target = Array.isArray(st.deep) ? st.deep : [id, st.anchor || null];
    dBody.replaceChildren();
    if (st.source) dBody.append(h('div', { class: 'lx-aboutw' }, h('p', { class: 'lx-about' }, h('b', {}, TEXT.about), st.source)));
    if (st.deep !== false) {
      const { art, start: run, spoken } = readingArticle(target[0]);
      drawerSpeech = () => script([st.source && `${TEXT.about}: ${st.source}`, spoken()]);
      dBody.append(art);
      setTheory(true);
      stopAnims = run(dBody);
      if (target[1]) requestAnimationFrame(() => art.querySelector(`#sec-${target[1]}`)?.scrollIntoView());
      else dBody.scrollTop = 0;
    } else { drawerSpeech = () => script([st.source]); setTheory(true); }
  };
  dClose.onclick = () => setTheory(false);
  scrim.onclick = () => setTheory(false);

  // ---- stations as steps: number or tick, name; a label on hover, focus or a long press ----
  const isDone = (j) => !!state.done[doneKey(j)];
  let tipTimer = 0, pressed = false;
  const showTip = (b, text) => {
    clearTimeout(tipTimer);
    tabTip.textContent = text; tabTip.hidden = false;
    const r = b.getBoundingClientRect(), rr = root.getBoundingClientRect(), w = tabTip.offsetWidth;
    tabTip.style.left = `${Math.max(6, Math.min(rr.width - w - 6, r.left + r.width / 2 - w / 2))}px`;
    tabTip.style.top = `${r.bottom + 6}px`;
  };
  const hideTip = (ms = 0) => { clearTimeout(tipTimer); tipTimer = setTimeout(() => { tabTip.hidden = true; }, ms); };
  const renderSteps = () => {
    const kids = [];
    lab.stations.forEach((st, j) => {
      if (j) kids.push(h('i', { class: `lx-link${isDone(j - 1) ? ' done' : ''}`, 'aria-hidden': 'true' }));
      const name = `${j + 1}. ${st.tab}${isDone(j) ? ' ✓' : ''}`;
      const b = h('button', {
        type: 'button', class: `lx-step${j === current ? ' cur' : ''}${isDone(j) ? ' done' : ''}`,
        'aria-current': j === current ? 'step' : null, 'aria-label': TEXT.station(j + 1, N, st.tab, isDone(j)),
        onclick: () => { if (pressed) { pressed = false; return; } hideTip(); if (j !== current) show(j); },
        onmouseenter: () => { tipTimer = setTimeout(() => showTip(b, name), 250); }, onmouseleave: () => hideTip(),
        onfocus: () => { if (b.matches(':focus-visible')) showTip(b, name); }, onblur: () => hideTip(),
        onpointerdown: (e) => { if (e.pointerType !== 'mouse') { pressed = false; clearTimeout(tipTimer); tipTimer = setTimeout(() => { pressed = true; showTip(b, name); }, 450); } },
        onpointerup: (e) => { if (e.pointerType !== 'mouse') { if (pressed) hideTip(1400); else clearTimeout(tipTimer); } },
        oncontextmenu: (e) => { if (pressed) e.preventDefault(); },
      }, h('span', { class: 'm', 'aria-hidden': 'true' }, isDone(j) ? '✓' : String(j + 1)), h('span', { class: 't', 'aria-hidden': 'true' }, st.tab));
      kids.push(b);
    });
    steps.replaceChildren(...kids);
  };
  let leave = () => {};
  const goNext = () => { if (current + 1 < N) show(current + 1); else leave(); };
  bNext.onclick = (e) => { e.stopPropagation(); onPhase('next'); };
  bText.onclick = () => onPhase('brief');
  // a tap on the frozen picture: point at the question instead of doing nothing
  stageBox.addEventListener('pointerdown', () => onPhase('locked-tap'));

  const show = async (i) => {
    const my = ++token, st = lab.stations[i];
    current = i;
    stopVoice();
    cleanup.forEach((f) => f()); cleanup = [];
    if (theory) setTheory(false);
    stage.replaceChildren(); guide.replaceChildren(); extra.replaceChildren(); act.replaceChildren(); dock.replaceChildren(); pings.replaceChildren();
    scroll.scrollTop = 0;
    renderSteps();
    controls = h('div', { class: 'lab-ctl' });
    let code = null;
    if (st.code) { code = codePanel(st.code, (s, key) => ctx.onCode?.(s, key)); extra.append(code.el); }
    extra.append(controls);
    new MutationObserver(() => { if (my === token) place(); }).observe(controls, { childList: true });

    // phase: 'ask' (question pending), 'explore' (tasks), 'done' (verdict and takeaway)
    phase = st.predict ? 'ask' : 'explore';
    let said = null, pendingReveal = false, hintFn = null, nudgeText = '', nudgeTimer = 0, justDone = -1;
    const tries = st.tries || [], ticked = new Set();
    const answer = Number.isInteger(st.predict?.answer) ? st.predict.answer : null;
    const opt = (k) => st.predict.options[k];
    const right = () => (said == null || answer == null ? null : said === answer);
    const nowK = () => tries.findIndex((_, j) => !ticked.has(j));
    const nextLabel = () => (current + 1 < N ? TEXT.next(lab.stations[current + 1].tab) : TEXT.back);

    // ---- where to act: the station may say where (a point on its picture, or a control) ----
    const hintAt = (k) => {
      let v = null;
      try { const f = hintFn || stage.querySelector('.lab-view')?.__pane?.__hint; v = f ? f(k) : null; } catch { v = null; }
      if (!v) return null;
      if (v instanceof Element) return { els: [v] };
      if (Array.isArray(v) && typeof v[0] === 'number') return { at: v };
      if (Array.isArray(v)) return { els: v.filter((e) => e instanceof Element) };
      return { els: [].concat(v.el || []), at: v.at, pane: v.pane };
    };
    const ping = (pane, [x, y]) => {
      const [sx, sy] = pane.toScreen(x, y), r = stageBox.getBoundingClientRect();
      const p = h('i', { class: 'lx-ping', style: `left:${sx - r.left}px;top:${sy - r.top}px` });
      pings.replaceChildren(p);
      setTimeout(() => p.remove(), 2400);
    };
    const pointAt = (k, auto = false) => {
      root.querySelectorAll('.lx-cue').forEach((e) => e.classList.remove('lx-cue', 'lx-cue-go'));
      if (k < 0 || phase !== 'explore') return;
      const t = hintAt(k);
      if (!t) { if (!auto) { nudge(TEXT.onPicture, 2600); stageBox.classList.remove('lx-flash'); void stageBox.offsetWidth; stageBox.classList.add('lx-flash'); } return; }
      (t.els || []).forEach((e) => { e.classList.add('lx-cue'); if (!auto) { e.classList.add('lx-cue-go'); e.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }); } });
      const pane = t.pane || stage.querySelector('.lab-view')?.__pane;
      if (t.at && pane) ping(pane, t.at);
      if (!auto && collapsed && !t.at && !isStack()) setCollapsed(false);
    };
    const nudge = (text, ms = 6000) => {
      if (my !== token) return;
      clearTimeout(nudgeTimer); nudgeText = text || '';
      drawBrief(); drawNudge();
      if (text) nudgeTimer = setTimeout(() => { if (my === token) { nudgeText = ''; drawBrief(); drawNudge(); } }, ms);
    };
    cleanup.push(() => clearTimeout(nudgeTimer));
    const drawNudge = () => { const n = guide.querySelector('.lx-nudge'); if (n) { n.textContent = nudgeText; n.hidden = !nudgeText; } };

    // ---- the brief: what the bar under the picture and the folded sheet say ----
    drawBrief = () => {
      if (my !== token) return;
      brief.dataset.phase = phase;
      brief.classList.toggle('nudging', !!nudgeText);
      bNext.hidden = true; bMark.className = 'lx-bmark';
      if (phase === 'ask') {
        bMark.replaceChildren(icon('lock')); bText.textContent = TEXT.lock;
        bNext.replaceChildren(TEXT.lockGo); bNext.hidden = !(collapsed || full);
        bText.title = TEXT.lockGo;
      } else if (phase === 'explore') {
        const k = nowK();
        if (tries.length && k >= 0) { bMark.textContent = `${k + 1}/${tries.length}`; bMark.classList.add('n'); } else bMark.replaceChildren();
        bText.textContent = nudgeText || (k >= 0 ? plain(tries[k]) : plain(st.goal || ''));
        bText.title = TEXT.where;
      } else {
        const r = right();
        bMark.textContent = r === false ? '✗' : '✓'; bMark.classList.add(r === false ? 'no' : 'ok');
        const a = answer != null ? opt(answer) : null, s = said != null ? opt(said) : null;
        bText.textContent = nudgeText || (s == null ? TEXT.allDone : r == null ? TEXT.youSaid(s) : r ? TEXT.pillRight(a) : a.length + s.length <= 30 ? TEXT.pillWrong(a, s) : `${TEXT.answer}: ${a}`);
        bText.title = TEXT.takeaway;
        bNext.replaceChildren(h('span', { class: 't' }, nextLabel()), icon('arrow')); bNext.setAttribute('aria-label', nextLabel());
        bNext.hidden = !(collapsed || full);
      }
      // on a phone the sheet's head names the station (with a lock while the picture is frozen)
      status.replaceChildren(...(isStack() ? [phase === 'ask' ? icon('lock') : '', st.tab] : [phase === 'ask' ? TEXT.question : phase === 'explore' ? TEXT.explore : TEXT.result]));
      pips.replaceChildren(...tries.map((_, j) => h('i', { class: ticked.has(j) || phase === 'done' ? 'on' : '' })));
    };
    onPhase = (what) => {
      if (my !== token) return;
      if (what === 'next') { if (phase === 'done') goNext(); else if (phase === 'ask') askAgain(); return; }
      if (what === 'locked-tap') { if (phase === 'ask') askAgain(true); return; }
      if (phase === 'ask') askAgain();
      else if (phase === 'explore') pointAt(nowK());
      else { if (full) setFull(false); setCollapsed(false); }
    };
    // bring the question into view and shake it gently: the picture is frozen until it is answered
    const askAgain = (tap = false) => {
      if (full && !tap) setFull(false);
      if (collapsed) setCollapsed(false);
      for (const el of [guide.querySelector('.lx-choices'), brief]) if (el) { el.classList.remove('lx-shake'); void el.offsetWidth; el.classList.add('lx-shake'); }
      if (!tap) guide.querySelector('.lx-q')?.focus({ preventScroll: true });
    };

    const lockStage = (v) => { stageWrap.classList.toggle('locked', v); stage.inert = v; extra.hidden = v && !code; controls.hidden = v; if (code) code.el.inert = v; };

    const render = () => {
      guide.replaceChildren(); act.replaceChildren();
      root.dataset.phase = phase;
      if (phase === 'ask') {
        lockStage(true);
        const short = st.predict.options.every((o) => o.length <= 16);
        const box = h('div', { class: `lx-choices${short ? ' two' : ''}`, role: 'group', 'aria-label': st.predict.q });
        st.predict.options.forEach((o, j) => box.append(h('button', { type: 'button', class: 'lx-choice', onclick: () => choose(j) }, h('span', { class: 'k', 'aria-hidden': 'true' }, String.fromCharCode(65 + j)), h('span', {}, o))));
        guide.append(h('h2', { class: 'lx-q', tabindex: '-1' }, st.predict.q), h('p', { class: 'lx-hint lx-pick' }, TEXT.pick), box);
      } else if (phase === 'explore') {
        lockStage(false);
        const k = nowK();
        if (said != null) guide.append(h('p', { class: 'lx-said lx-in', tabindex: '-1' }, h('span', {}, `${TEXT.said} `), h('b', {}, opt(said)), h('span', {}, `. ${ticked.size ? TEXT.left(tries.length - ticked.size) : TEXT.check}`)));
        else guide.append(h('h2', { class: 'lx-goal' }, st.why || st.goal));
        if (tries.length) {
          const doneL = tries.map((t, j) => (ticked.has(j) ? h('li', { class: j === justDone ? 'just' : '' }, h('span', { class: 'm', 'aria-hidden': 'true' }, '✓'), h('span', { html: t })) : null)).filter(Boolean);
          if (doneL.length) guide.append(h('ol', { class: 'lx-donel', 'aria-label': TEXT.stepsDone(doneL.length) }, doneL));
          if (k >= 0) {
            guide.append(h('button', { type: 'button', class: `lx-now${justDone >= 0 ? ' lx-in' : ''}`, onclick: () => pointAt(k) },
              h('span', { class: 'lx-nowl' }, h('b', {}, TEXT.now), h('span', {}, TEXT.of(k + 1, tries.length)), h('span', { class: 'dots', 'aria-hidden': 'true' }, tries.map((_, j) => h('i', { class: ticked.has(j) ? 'on' : j === k ? 'cur' : '' })))),
              h('span', { class: 'lx-nowt', html: tries[k] }),
              h('span', { class: 'lx-nudge', hidden: '' }),
              h('span', { class: 'lx-where' }, icon('target'), TEXT.where)));
          }
        }
        drawNudge();
      } else {
        lockStage(false);
        if (said != null) {
          const r = right();
          guide.append(h('div', { class: `lx-verdict lx-in ${r === false ? 'no' : r == null ? 'plain' : 'ok'}`, tabindex: '-1' },
            h('span', { class: 'm', 'aria-hidden': 'true' }, r === false ? '✗' : r == null ? '?' : '✓'),
            h('div', {}, h('p', { class: 'big' }, r == null ? TEXT.youSaid(opt(said)) : r ? TEXT.youRight(opt(said)) : TEXT.youWrong(opt(said), opt(answer))),
              st.predict.why ? h('p', { html: st.predict.why }) : r == null ? h('p', {}, TEXT.compare) : null)));
        } else guide.append(h('h2', { class: 'lx-goal' }, st.why || st.goal));
        guide.append(h('div', { class: 'lx-take lx-in', role: 'status' }, h('span', { class: 'l' }, TEXT.takeaway), h('span', { html: st.takeaway })));
        guide.append(h('p', { class: 'lx-hint lx-keep' }, tries.length ? `✓ ${TEXT.stepsDone(tries.length)}. ` : '', TEXT.keep));
        act.append(h('button', { type: 'button', class: 'lx-primary', onclick: goNext }, h('span', { class: 't' }, nextLabel()), icon('arrow')));
      }
      place(); drawBrief();
      requestAnimationFrame(cue);
    };

    // Listen reads what is on the panel now: the question and its answers; the answer given and
    // the step to do; or the verdict and the takeaway
    speech = () => {
      const k = nowK();
      if (phase === 'ask') return script([st.predict.q, ...st.predict.options.map((o, j) => `${String.fromCharCode(65 + j)}: ${o}`)]);
      if (phase === 'explore') return script([said != null ? `${TEXT.youSaid(opt(said))} ${TEXT.check}` : st.why || st.goal, k >= 0 && tries[k]]);
      const r = right();
      return script([said != null && (r == null ? TEXT.youSaid(opt(said)) : r ? TEXT.youRight(opt(said)) : TEXT.youWrong(opt(said), opt(answer))), said != null && st.predict.why, st.takeaway]);
    };
    const finish = () => {
      if (my !== token || phase === 'done') return;
      phase = 'done'; nudgeText = '';
      pointAt(-1);
      state.done[doneKey(i)] = true; save(); sfx.reveal();
      if (VOICE.auto && isOn()) speak(speech());
      renderSteps();
      if (isStack() && !full) setCollapsed(false);
      render();
      scroll.scrollTop = 0;
      if (!collapsed && !full) act.querySelector('button')?.focus({ preventScroll: true });
    };
    const choose = (j) => {
      if (my !== token || phase !== 'ask') return;
      said = j; sfx.tick(); phase = 'explore';
      // on a phone the sheet folds to one line so that the picture and its controls have the room
      if (isStack() && !full) setCollapsed(true);
      render();
      stageWrap.classList.remove('go'); void stageWrap.offsetWidth; stageWrap.classList.add('go');
      if (!collapsed) guide.querySelector('.lx-said')?.focus({ preventScroll: true });
      if (pendingReveal || (tries.length && ticked.size === tries.length)) finish();
      else setTimeout(() => { if (my === token) pointAt(nowK(), true); }, 350);
    };
    const ctx = {
      stage, controls, code,
      // the station as course.json gives it (texts, "ready" data, the "when" of each task)
      station: st,
      // show the takeaway now (used by stations whose tasks are not "tries")
      reveal: () => { if (my !== token) return; if (phase === 'ask') pendingReveal = true; else finish(); },
      // tick one of the "try this" lines; when all are ticked the verdict and the takeaway appear
      did: (k) => {
        if (my !== token || !tries[k] || ticked.has(k)) return;
        ticked.add(k);
        if (phase !== 'explore') return;
        sfx.tick(); justDone = k;
        render();
        if (ticked.size === tries.length) setTimeout(finish, 650);
        else setTimeout(() => { if (my === token) pointAt(nowK(), true); }, 300);
      },
      // optional: where to act for task k: an element (a control), [x, y] in the units of the
      // station's canvasPane, or { el, at, pane }. A tap on the current step points there.
      hint: (fn) => { hintFn = fn; if (phase === 'explore') pointAt(nowK(), true); },
      // optional: a short line shown where the learner is looking (the step, or the bar), for a few seconds
      nudge: (text, ms) => nudge(text, ms),
      // optional, for stations: the size of the stage in screen pixels, and a callback when it changes
      size: () => { const r = stage.getBoundingClientRect(); return { w: r.width, h: r.height, upright: isStack() }; },
      onResize: (f) => { const ro = new ResizeObserver(() => { if (my === token) f(ctx.size()); }); ro.observe(stage); cleanup.push(() => ro.disconnect()); },
      // optional: the phase of the frame ('ask' | 'explore' | 'done') and the answer picked, if any
      phase: () => phase, said: () => said,
      onCleanup: (f) => cleanup.push(f),
      alive: () => my === token,
    };
    root.dataset.station = `${id}:${i}`;
    root.dataset.ready = '0';
    if (phase === 'ask' && collapsed && isStack()) setCollapsed(false);
    render();
    if (VOICE.auto && isOn()) speak(speech());
    if (phase === 'ask') guide.querySelector('.lx-q')?.focus({ preventScroll: true });
    // the station draws at once: its picture is visible (frozen) while the question is open
    await st.mount(ctx);
    if (my !== token) return;
    root.dataset.ready = '1';
    place();
    // a phone with controls under the picture: the sheet starts folded to its one-line step
    if (phase === 'explore' && isStack() && !full && !dock.hidden) setCollapsed(true);
    if (phase === 'explore') setTimeout(() => { if (my === token) pointAt(nowK(), true); }, 300);
    root.__lab = { ctx, choose, finish, setCollapsed, setFull, theory: () => theoryBtn.click(), pointAt: () => pointAt(nowK()) };
  };
  relayout();
  return new Promise((resolve) => {
    const done = () => { stopVoice(); cleanup.forEach((f) => f()); stopAnims?.(); removeEventListener('keydown', key, true); removeEventListener('resize', relayout); root.remove(); resolve(); };
    leave = done;
    const key = (e) => {
      const tag = e.target.tagName, typing = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
      if (e.key === 'Escape') { e.preventDefault(); if (theory) setTheory(false); else if (full) setFull(false); else done(); return; }
      if (listenKey(e)) { e.preventDefault(); listen(() => (theory ? drawerSpeech() : speech())); return; }
      if ((theory && isStack()) || typing || e.altKey || e.ctrlKey || e.metaKey) return;
      if (/^[1-9]$/.test(e.key) && +e.key <= N) { e.preventDefault(); show(+e.key - 1); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = current + (e.key === 'ArrowRight' ? 1 : -1); if (n >= 0 && n < N) { e.preventDefault(); show(n); } }
    };
    addEventListener('keydown', key, true);
    close.onclick = done;
    fsClose.onclick = done;
    show(Math.min(start, N - 1));
  });
}
