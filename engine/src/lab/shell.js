// The lab: a full-screen viewer that opens on top of the town.
// One station = one learning objective. The stage (the station's picture) is the screen; a panel
// beside it (a bottom sheet on an upright screen) leads through one thing at a time:
//   1. the question, if the design has one: the picture is already there, frozen;
//   2. "You said X. Now check it": the picture comes alive, the tasks appear and tick themselves;
//   3. when the tasks are done: the verdict on the prediction, the takeaway, and one button: Next.
// The panel folds away to leave only the picture; the theory opens in a drawer.
import { LABS } from '../course/labs.js';
import { state, save } from '../systems/state.js';
import { sfx } from '../systems/audio.js';
import { codePanel } from './code.js';
import { CSS } from './style.js';
import { readingArticle } from './reading.js';

// Every word the frame shows, in one place, so a course in another language can replace them.
export const TEXT = {
  close: 'Close the lab', theory: 'Theory', stations: 'Stations', stage: 'The picture',
  full: 'Full screen', unfull: 'Leave full screen', hide: 'Hide the panel', show: 'Show the panel',
  lock: 'Answer the question first', pick: 'Pick an answer. Then try it on the picture.',
  question: 'Question', explore: 'Your turn', tryIt: 'Try it', of: (a, b) => `${a} of ${b} done`,
  said: 'You said', check: 'Now check it on the picture.', selfTick: 'Each step ticks itself when you do it.',
  right: 'That is right.', answerIs: (a) => `The answer is: ${a}.`, compare: 'Compare it with what you saw.',
  done: 'Done', doneSum: 'Takeaway ready', allDone: 'All steps done.', takeaway: 'Takeaway', keep: 'The picture stays live: keep exploring.',
  next: (t) => `Next: ${t}`, back: 'Back to the room', more: 'More',
  about: 'About this picture', station: (i, n, t, d) => `Station ${i} of ${n}: ${t}${d ? ', done' : ''}`,
};

const ICON = {
  x: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  book: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5v13"/></svg>',
  full: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  unfull: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
  chev: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  lock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
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

// The frame of the reading wall and the map: a header with a title and a close button.
export function overlay(title, sub) {
  style();
  const close = h('button', { type: 'button', class: 'hb-close', 'aria-label': 'Close' }, icon('x'), 'Close');
  const tabs = h('div', { class: 'hb-tabs' });
  const root = h('div', { class: 'hb-over', role: 'dialog', 'aria-label': title }, h('div', { class: 'hb-top' }, h('h1', { html: `${title}${sub ? ` <span>· ${sub}</span>` : ''}` }), tabs, close));
  document.body.append(root);
  return { root, tabs, close };
}

// Opens the lab of one building. Resolves when the player goes back to town.
export function openLab(id, start = 0) {
  style();
  const lab = LABS[id], N = lab.stations.length;

  // ---- the frame, built once ----
  const steps = h('nav', { class: `lx-steps${N > 4 ? ' many' : ''}`, 'aria-label': TEXT.stations });
  const theoryBtn = h('button', { type: 'button', class: 'lx-btn', 'aria-haspopup': 'dialog', title: TEXT.theory }, icon('book'), h('span', {}, TEXT.theory));
  const close = h('button', { type: 'button', class: 'lx-x', 'aria-label': TEXT.close, title: TEXT.close }, icon('x'));
  const tools = h('div', { class: 'lx-tools' }, theoryBtn, close);
  const top = h('header', { class: 'lx-top' }, h('div', { class: 'lx-name' }, lab.title), steps, tools);

  const stage = h('div', { class: 'lab-stage' });
  const lock = h('div', { class: 'lx-lock' }, icon('lock'), TEXT.lock);
  const fsBtn = h('button', { type: 'button', class: 'lx-fs', 'aria-label': TEXT.full, title: TEXT.full, 'aria-pressed': 'false' }, icon('full'));
  const stageWrap = h('section', { class: 'lx-stagewrap', 'aria-label': TEXT.stage }, stage, lock, fsBtn);

  const status = h('div', { class: 'lx-status' });
  const sum = h('div', { class: 'lx-sum' });
  const pips = h('div', { class: 'lx-pips', 'aria-hidden': 'true' });
  const mini = h('button', { type: 'button', class: 'lx-mini' }, icon('arrow'));
  const tog = h('button', { type: 'button', class: 'lx-tog', 'aria-expanded': 'true', 'aria-label': TEXT.hide, title: TEXT.hide }, icon('chev'));
  const phead = h('div', { class: 'lx-phead' }, status, sum, h('div', { class: 'lx-grow' }), pips, mini, tog);
  const guide = h('div', { class: 'lx-guide', style: 'display:flex;flex-direction:column;gap:16px' });
  const extra = h('div', { class: 'lx-extra' });
  const scroll = h('div', { class: 'lx-scroll' }, guide, extra);
  const act = h('div', { class: 'lx-act' });
  const more = h('button', { type: 'button', class: 'lx-more', tabindex: '-1', 'aria-hidden': 'true', title: TEXT.more }, icon('down'));
  const panel = h('aside', { class: 'lx-panel', 'aria-label': lab.title }, phead, scroll, more, act);
  const main = h('div', { class: `lx-main${lab.wide ? ' wide' : ''}` }, stageWrap, panel);

  const dClose = h('button', { type: 'button', class: 'lx-x', 'aria-label': `${TEXT.close}: ${TEXT.theory}` }, icon('x'));
  const dBody = h('div', { class: 'hb-page lx-dbody', tabindex: '0' });
  const drawer = h('div', { class: 'lx-drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': TEXT.theory, inert: '' }, h('div', { class: 'lx-dhead' }, h('h2', {}, TEXT.theory), dClose), dBody);
  const scrim = h('div', { class: 'lx-scrim' });

  const root = h('div', { class: 'hb-over lx', role: 'dialog', 'aria-label': lab.title }, top, main, scrim, drawer);
  document.body.append(root);

  // upright screens and narrow windows: stage on top, panel as a bottom sheet
  const stackQ = () => innerWidth < 760 || (innerHeight > innerWidth && innerWidth < 1000);
  const relayout = () => { root.classList.toggle('stack', stackQ()); cue(); };

  // ---- panel: fold away, drag (bottom sheet), "more below" cue ----
  let collapsed = false;
  const setCollapsed = (v) => {
    collapsed = v; root.classList.toggle('collapsed', v);
    tog.setAttribute('aria-expanded', String(!v)); tog.setAttribute('aria-label', v ? TEXT.show : TEXT.hide); tog.title = v ? TEXT.show : TEXT.hide;
    if (v) panel.classList.remove('sized');
    requestAnimationFrame(cue);
  };
  tog.onclick = (e) => { e.stopPropagation(); setCollapsed(!collapsed); };
  // on a bottom sheet the head is a handle: drag it up or down, or tap it
  let drag = null;
  phead.addEventListener('pointerdown', (e) => {
    if (!root.classList.contains('stack') || e.target.closest('button')) return;
    drag = { y: e.clientY, h0: panel.getBoundingClientRect().height, moved: false };
    try { phead.setPointerCapture(e.pointerId); } catch { /* synthetic */ }
  });
  phead.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dy) < 8) return;
    drag.moved = true;
    const total = main.getBoundingClientRect().height, hgt = Math.max(64, Math.min(total * 0.85, drag.h0 - dy));
    if (collapsed) { collapsed = false; root.classList.remove('collapsed'); }
    panel.classList.add('sized'); panel.style.setProperty('--sheet', `${hgt}px`);
  });
  const endDrag = () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) { setCollapsed(!collapsed); return; }
    const hgt = panel.getBoundingClientRect().height;
    if (hgt < 140) { panel.classList.remove('sized'); setCollapsed(true); } else setCollapsed(false);
  };
  phead.addEventListener('pointerup', endDrag); phead.addEventListener('pointercancel', endDrag);
  const cue = () => { panel.classList.toggle('more', scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight > 12); panel.style.setProperty('--actH', `${act.offsetHeight}px`); };
  scroll.addEventListener('scroll', cue, { passive: true });
  new ResizeObserver(cue).observe(scroll);
  addEventListener('resize', relayout);
  relayout();
  more.onclick = () => scroll.scrollBy({ top: scroll.clientHeight * 0.7, behavior: 'smooth' });

  // ---- full screen stage ----
  let full = false;
  const setFull = (v) => {
    full = v; root.classList.toggle('full', v);
    fsBtn.replaceChildren(icon(v ? 'unfull' : 'full')); fsBtn.setAttribute('aria-pressed', String(v));
    fsBtn.setAttribute('aria-label', v ? TEXT.unfull : TEXT.full); fsBtn.title = v ? TEXT.unfull : TEXT.full;
  };
  fsBtn.onclick = () => setFull(!full);

  // ---- theory drawer ----
  let theory = false, stopAnims = null, lastFocus = null;
  const setTheory = (v) => {
    theory = v; root.classList.toggle('theory', v);
    top.inert = v; main.inert = v; // keep the keyboard inside the drawer while it is open
    if (v) { drawer.removeAttribute('inert'); lastFocus = document.activeElement; dClose.focus({ preventScroll: true }); }
    else { drawer.setAttribute('inert', ''); stopAnims?.(); stopAnims = null; lastFocus?.focus?.({ preventScroll: true }); }
    theoryBtn.setAttribute('aria-expanded', String(v));
  };
  theoryBtn.onclick = () => {
    const st = lab.stations[current], target = Array.isArray(st.deep) ? st.deep : [id, st.anchor || null];
    dBody.replaceChildren();
    if (st.source) dBody.append(h('div', { style: 'max-width:760px;margin:0 auto;padding:20px 24px 0' }, h('p', { class: 'lx-about' }, h('b', {}, TEXT.about), st.source)));
    if (st.deep !== false) {
      const { art, start: run } = readingArticle(target[0]);
      dBody.append(art);
      setTheory(true);
      stopAnims = run(dBody);
      if (target[1]) requestAnimationFrame(() => art.querySelector(`#sec-${target[1]}`)?.scrollIntoView());
      else dBody.scrollTop = 0;
    } else setTheory(true);
  };
  dClose.onclick = () => setTheory(false);
  scrim.onclick = () => setTheory(false);

  // ---- stations ----
  let current = start, cleanup = [], token = 0;
  const isDone = (j) => !!state.done[`${id}:${j}`];
  const renderSteps = () => {
    steps.replaceChildren(...lab.stations.map((st, j) => h('button', {
      type: 'button', class: `lx-step${j === current ? ' cur' : ''}${isDone(j) ? ' done' : ''}`,
      'aria-current': j === current ? 'step' : null, 'aria-label': TEXT.station(j + 1, N, st.tab, isDone(j)), title: st.tab,
      onclick: () => { if (j !== current) show(j); },
    }, h('span', { class: 'm', 'aria-hidden': 'true' }, isDone(j) ? '✓' : String(j + 1)), h('span', { class: 't' }, st.tab))));
  };
  let leave = () => {};
  const goNext = () => { if (current + 1 < N) show(current + 1); else leave(); };

  const show = async (i) => {
    const my = ++token, st = lab.stations[i];
    current = i;
    cleanup.forEach((f) => f()); cleanup = [];
    if (theory) setTheory(false);
    stage.replaceChildren(); guide.replaceChildren(); extra.replaceChildren(); act.replaceChildren();
    scroll.scrollTop = 0;
    renderSteps();
    const controls = h('div', { class: 'lab-ctl' });
    let code = null;
    if (st.code) { code = codePanel(st.code, (s, key) => ctx.onCode?.(s, key)); extra.append(code.el); }
    extra.append(controls);

    // phase: 'ask' (question pending), 'explore' (tasks), 'done' (verdict and takeaway)
    let phase = st.predict ? 'ask' : 'explore', said = null, pendingReveal = false;
    const tries = st.tries || [], ticked = new Set();
    let list = null;
    const answer = Number.isInteger(st.predict?.answer) ? st.predict.answer : null;

    const head = () => {
            status.replaceChildren(...(phase === 'ask' ? [TEXT.question] : phase === 'explore' ? [h('b', {}, TEXT.explore)] : [h('b', {}, TEXT.done)]));
      const nowK = tries.findIndex((_, j) => !ticked.has(j));
      sum.textContent = phase === 'ask' ? st.predict.q : phase === 'explore' ? plain(tries[nowK] || '') : TEXT.doneSum;
      pips.replaceChildren(...tries.map((_, j) => h('i', { class: ticked.has(j) || phase === 'done' ? 'on' : '' })));
      mini.hidden = phase !== 'done';
      mini.setAttribute('aria-label', current + 1 < N ? TEXT.next(lab.stations[current + 1].tab) : TEXT.back);
      mini.title = mini.getAttribute('aria-label');
    };
    const triesList = () => {
      const nowK = tries.findIndex((_, j) => !ticked.has(j));
      list = h('ol', { class: 'lx-tries' }, tries.map((t, j) => h('li', { class: ticked.has(j) || phase === 'done' ? 'done' : j === nowK ? 'now' : '' },
        h('span', { class: 'm', 'aria-hidden': 'true' }, ticked.has(j) || phase === 'done' ? '✓' : String(j + 1)), h('span', { html: t }))));
      return list;
    };
    const lockStage = (v) => { stageWrap.classList.toggle('locked', v); stage.inert = v; extra.hidden = v && !code; controls.hidden = v; if (code) code.el.inert = v; };

    const render = () => {
      guide.replaceChildren(); act.replaceChildren();
      if (phase === 'ask') {
        lockStage(true);
        const short = st.predict.options.every((o) => o.length <= 16);
        const box = h('div', { class: `lx-choices${short ? ' two' : ''}`, role: 'group', 'aria-label': st.predict.q });
        st.predict.options.forEach((o, j) => box.append(h('button', { type: 'button', class: 'lx-choice', onclick: () => choose(j) }, h('span', { class: 'k', 'aria-hidden': 'true' }, String.fromCharCode(65 + j)), h('span', {}, o))));
        guide.append(h('h2', { class: 'lx-q', tabindex: '-1' }, st.predict.q), h('p', { class: 'lx-hint lx-pick' }, TEXT.pick), box);
      } else if (phase === 'explore') {
        lockStage(false);
        if (said != null) guide.append(h('div', { class: 'lx-said lx-in', tabindex: '-1' }, h('span', { class: 'l' }, TEXT.said), h('b', {}, st.predict.options[said]), h('span', {}, TEXT.check)));
        else guide.append(h('h2', { class: 'lx-goal' }, st.why || st.goal));
        guide.append(h('div', { class: 'lx-thead' }, h('h3', {}, TEXT.tryIt), h('span', {}, TEXT.of(ticked.size, tries.length))), triesList());
        if (!ticked.size) guide.append(h('p', { class: 'lx-hint' }, TEXT.selfTick));
      } else {
        lockStage(false);
        if (said != null) {
          const right = answer == null ? null : said === answer;
          guide.append(h('div', { class: `lx-verdict lx-in${right === false ? ' wrong' : right == null ? ' plain' : ''}`, tabindex: '-1' },
            h('span', { class: 'm', 'aria-hidden': 'true' }, right === false ? '!' : right == null ? '?' : '✓'),
            h('div', {}, h('p', { class: 'big' }, `${TEXT.said}: ${st.predict.options[said]}.`),
              h('p', {}, right == null ? TEXT.compare : right ? TEXT.right : TEXT.answerIs(st.predict.options[answer])))));
        } else guide.append(h('h2', { class: 'lx-goal' }, st.why || st.goal));
        guide.append(h('div', { class: 'lx-take lx-in', role: 'status' }, h('span', { class: 'l' }, TEXT.takeaway), h('span', { html: st.takeaway })));
        if (tries.length) guide.append(h('div', { class: 'lx-alldone', style: 'display:flex;flex-direction:column;gap:10px' }, h('div', { class: 'lx-thead' }, h('h3', {}, TEXT.tryIt), h('span', {}, TEXT.allDone)), triesList()));
        guide.append(h('p', { class: 'lx-hint' }, TEXT.keep));
        const label = current + 1 < N ? TEXT.next(lab.stations[current + 1].tab) : TEXT.back;
        act.append(h('button', { type: 'button', class: 'lx-primary', onclick: goNext }, h('span', { class: 't' }, label), icon('arrow')));
      }
      head();
      requestAnimationFrame(cue);
    };

    const finish = () => {
      if (my !== token || phase === 'done') return;
      phase = 'done';
      state.done[`${id}:${i}`] = true; save(); sfx.reveal();
      renderSteps(); render();
      scroll.scrollTop = 0;
      if (!collapsed) act.querySelector('button')?.focus({ preventScroll: true });
    };
    const choose = (j) => {
      if (my !== token || phase !== 'ask') return;
      said = j; sfx.tick(); phase = 'explore';
      render();
      stageWrap.classList.remove('go'); void stageWrap.offsetWidth; stageWrap.classList.add('go');
      guide.querySelector('.lx-said')?.focus({ preventScroll: true });
      if (pendingReveal || (tries.length && ticked.size === tries.length)) finish();
    };
    const ctx = {
      stage, controls, code,
      // show the takeaway now (used by stations whose tasks are not "tries")
      reveal: () => { if (my !== token) return; if (phase === 'ask') pendingReveal = true; else finish(); },
      // tick one of the "try this" lines; when all are ticked the verdict and the takeaway appear
      did: (k) => {
        if (my !== token || !tries[k] || ticked.has(k)) return;
        ticked.add(k);
        if (phase !== 'explore') return;
        sfx.tick();
        const nowK = tries.findIndex((_, j) => !ticked.has(j));
        [...list.children].forEach((li, j) => { const d = ticked.has(j); li.className = d ? `done${j === k ? ' just' : ''}` : j === nowK ? 'now' : ''; li.firstChild.textContent = d ? '✓' : String(j + 1); });
        guide.querySelector('.lx-thead span').textContent = TEXT.of(ticked.size, tries.length);
        guide.querySelector('.lx-hint')?.remove();
        head();
        if (ticked.size === tries.length) setTimeout(finish, 650);
      },
      // optional, for stations: the size of the stage in screen pixels, and a callback when it changes
      size: () => { const r = stage.getBoundingClientRect(); return { w: r.width, h: r.height, upright: root.classList.contains('stack') }; },
      onResize: (f) => { const ro = new ResizeObserver(() => { if (my === token) f(ctx.size()); }); ro.observe(stage); cleanup.push(() => ro.disconnect()); },
      // optional: the phase of the frame ('ask' | 'explore' | 'done') and the answer picked, if any
      phase: () => phase, said: () => said,
      onCleanup: (f) => cleanup.push(f),
      alive: () => my === token,
    };
    root.dataset.station = `${id}:${i}`;
    root.dataset.ready = '0';
    render();
    if (phase === 'ask') guide.querySelector('.lx-q')?.focus({ preventScroll: true });
    // the station draws at once: its picture is visible (frozen) while the question is open
    await st.mount(ctx);
    if (my === token) root.dataset.ready = '1';
    root.__lab = { ctx, choose, finish, setCollapsed, setFull, theory: () => theoryBtn.click() };
  };

  return new Promise((resolve) => {
    const done = () => { cleanup.forEach((f) => f()); stopAnims?.(); removeEventListener('keydown', key, true); removeEventListener('resize', relayout); root.remove(); resolve(); };
    leave = done;
    const key = (e) => {
      const tag = e.target.tagName, typing = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
      if (e.key === 'Escape') { e.preventDefault(); if (theory) setTheory(false); else if (full) setFull(false); else done(); return; }
      if (theory || typing || e.altKey || e.ctrlKey || e.metaKey) return;
      if (/^[1-9]$/.test(e.key) && +e.key <= N) { e.preventDefault(); show(+e.key - 1); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = current + (e.key === 'ArrowRight' ? 1 : -1); if (n >= 0 && n < N) { e.preventDefault(); show(n); } }
    };
    addEventListener('keydown', key, true);
    close.onclick = done;
    mini.onclick = (e) => { e.stopPropagation(); goNext(); };
    show(Math.min(start, N - 1));
  });
}
