// The lab: a full-screen, clean viewer that opens on top of the town.
// One station = one learning objective: a goal, one thing to try, one takeaway.
import { LABS } from '../course/labs/index.js';
import { state, save } from '../systems/state.js';
import { sfx } from '../systems/audio.js';
import { codePanel } from './code.js';
import { COURSE } from '../course/course.js';

const CSS = `
.hb-over{position:fixed;inset:0;z-index:20;background:#0e1116;color:#e6e8ee;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;flex-direction:column}
.hb-over *{box-sizing:border-box}
.hb-top{display:flex;align-items:center;gap:18px;padding:10px 16px;border-bottom:1px solid #232a36;background:#131821}
.hb-top h1{font-size:16px;margin:0;font-weight:600;white-space:nowrap}
.hb-top h1 span{color:#8b93a7;font-weight:400}
.hb-tabs{display:flex;gap:6px;flex:1;flex-wrap:wrap}
.hb-tab{background:none;border:1px solid #2a3240;color:#aeb6c8;border-radius:999px;padding:5px 14px;font:inherit;font-size:14px;cursor:pointer}
.hb-tab b{color:#4fd1c5;margin-right:6px}
.hb-tab[aria-selected=true]{background:#1d2a33;border-color:#4fd1c5;color:#fff}
.hb-close{background:#1b212c;border:1px solid #2a3240;color:#e6e8ee;border-radius:8px;padding:6px 12px;font:inherit;font-size:14px;cursor:pointer;white-space:nowrap}
.hb-close:hover,.hb-tab:hover{border-color:#4fd1c5}
.hb-main{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 340px}
.hb-main.wide{grid-template-columns:minmax(0,1fr) 500px}
.hb-step{display:flex;align-items:center;gap:10px;flex:1;font-size:14px;color:#aeb6c8}.hb-step b{color:#fff}.hb-step .zone{color:#4fd1c5;font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.lab-side>*{flex-shrink:0}
.lab-box{flex:1;min-width:0;min-height:0;position:relative;background:#0e1116;border-radius:8px;overflow:auto}
.lab-stage{min-width:0;min-height:0;display:flex;gap:10px;padding:14px;background:#07090d}
.lab-col{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;gap:10px}
.lab-view{flex:1;min-width:0;min-height:0;position:relative;background:#000;border-radius:8px;overflow:hidden}
.lab-view canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}
.lab-side{border-left:1px solid #232a36;padding:18px;overflow:auto;display:flex;flex-direction:column;gap:16px}
.lab-k{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8b93a7;margin-bottom:4px}
.lab-goal{font-size:18px;line-height:1.35;font-weight:600;text-wrap:balance}
.lab-try{margin:0;padding-left:0;list-style:none}.lab-try li{margin:4px 0;padding-left:26px;position:relative}
.lab-try li::before{content:'';position:absolute;left:2px;top:4px;width:13px;height:13px;border:2px solid #4a5568;border-radius:4px}
.lab-try li.ok{color:#9fe3b0}.lab-try li.ok::before{background:#7ddc8a;border-color:#7ddc8a;content:'✓';color:#06211f;font-size:12px;font-weight:700;line-height:13px;text-align:center}
.lab-cap{position:absolute;left:12px;top:10px;font-size:13px;font-weight:600;color:#fff;text-shadow:0 1px 3px #000;pointer-events:none}
.lab-view canvas.fit{object-fit:contain}
.lab-ctl{display:flex;flex-direction:column;gap:12px}
.lab-seg{display:flex;border:1px solid #2a3240;border-radius:8px;overflow:hidden}
.lab-seg button{flex:1;background:#151a23;border:0;border-right:1px solid #2a3240;color:#c9cfdd;padding:8px 6px;font:inherit;font-size:14px;cursor:pointer}
.lab-seg button:last-child{border-right:0}
.lab-seg button[aria-pressed=true]{background:#4fd1c5;color:#06211f;font-weight:600}
.lab-row label{display:flex;justify-content:space-between;font-size:13px;color:#aeb6c8}
.lab-row output{color:#fff;font-variant-numeric:tabular-nums}
.lab-row input[type=range]{width:100%;accent-color:#4fd1c5}
.lab-read{background:#151a23;border:1px solid #232a36;border-radius:8px;padding:10px 12px;font-variant-numeric:tabular-nums;min-height:44px}
.lab-read b{color:#ffcf5a}
.lab-read code,.lab-take code,.hb-page code{font:13px ui-monospace,Menlo,Consolas,monospace;color:#9fe3db}
.lab-take{border-left:3px solid #ffcf5a;background:#1c1a12;padding:10px 12px;border-radius:0 8px 8px 0;animation:hbin .35s ease-out}
.lab-src{font-size:12px;color:#6f7789;margin-top:auto}
.lab-btn{background:#1b212c;border:1px solid #2a3240;color:#e6e8ee;border-radius:8px;padding:8px 12px;font:inherit;font-size:14px;cursor:pointer}
.lab-btn:hover{border-color:#4fd1c5}
.lab-chips{display:flex;flex-wrap:wrap;gap:6px}
.lab-chip{border:1px solid #2a3240;border-radius:999px;padding:3px 10px;font-size:13px;color:#8b93a7}
.lab-chip.on{border-color:#7ddc8a;color:#7ddc8a}
.lab-panel{background:#0e1116;border:1px solid #232a36;border-radius:8px;overflow:auto;min-height:0}
@keyframes hbin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media (max-width:900px){.hb-main{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) auto}.lab-side{border-left:0;border-top:1px solid #232a36;max-height:42vh}}
@media (prefers-reduced-motion:reduce){.lab-take{animation:none}}
.hb-page{flex:1;overflow:auto;scroll-behavior:smooth}
.hb-page article{max-width:760px;margin:0 auto;padding:28px 22px 80px;font-size:17px;line-height:1.65}
.hb-page h2{font-size:30px;line-height:1.2;margin:8px 0 6px;text-wrap:balance}
.hb-page h3{font-size:20px;margin:38px 0 6px;color:#ffcf5a}
.hb-page p{margin:10px 0}.hb-page .lead{color:#aeb6c8;font-size:18px}
.hb-page figure{margin:18px 0}.hb-page figcaption{font-size:14px;color:#8b93a7;margin-top:6px}
.hb-figrow{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.hb-figrow img,.hb-page canvas{width:100%;display:block;border-radius:8px;background:#000}
.hb-page img{image-rendering:auto}
.hb-key{border-left:3px solid #4fd1c5;background:#121c20;padding:10px 14px;border-radius:0 8px 8px 0}
.hb-num{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#4fd1c5}
.hb-det{background:#151a23;border:1px solid #232a36;border-radius:8px;padding:8px 14px}.hb-det summary{cursor:pointer;color:#aeb6c8}
.hb-rem{border-left:3px solid #ffcf5a;background:#1c1a12;margin:8px 0;padding:10px 14px 10px 34px;border-radius:0 8px 8px 0}.hb-rem li{margin:4px 0}
.hb-go{display:inline-block;margin-top:14px;background:#4fd1c5;color:#06211f;border:0;border-radius:8px;padding:10px 16px;font:600 16px system-ui,sans-serif;cursor:pointer}
`;

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
  const el = h('div', { class: 'lab-seg' });
  const set = (v, fire = true) => { if (fire) sfx.tick(); [...el.children].forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === String(v))); if (fire) onChange(v); };
  options.forEach(([v, label]) => el.append(h('button', { 'data-v': v, 'aria-pressed': String(v) === String(value), onclick: () => set(v) }, label)));
  el.set = set;
  return el;
}

export function slider(label, min, max, value, onInput, { step = 1, fmt = (v) => v } = {}) {
  const out = h('output', {}, String(fmt(value)));
  const input = h('input', { type: 'range', min, max, step, value, oninput: () => { out.textContent = fmt(+input.value); onInput(+input.value); } });
  const el = h('div', { class: 'lab-row' }, h('label', {}, label, out), input);
  el.set = (v) => { input.value = v; out.textContent = fmt(+v); };
  return el;
}

export const readout = (html = '') => h('div', { class: 'lab-read', html });

const PLACE_NAME = (id) => COURSE.districts.flatMap((d) => d.places).find((p) => p.id === id)?.name || id;
let styled = false;
export function overlay(title, sub) {
  if (!styled) { document.head.append(h('style', { html: CSS })); styled = true; }
  const close = h('button', { class: 'hb-close' }, 'Close  (Esc)');
  const tabs = h('div', { class: 'hb-tabs' });
  const root = h('div', { class: 'hb-over', role: 'dialog', 'aria-label': title }, h('div', { class: 'hb-top' }, h('h1', { html: `${title} <span>· ${sub}</span>` }), tabs, close));
  document.body.append(root);
  return { root, tabs, close };
}

// Opens the lab of one building. Resolves when the player goes back to town.
export function openLab(id, start = 0) {
  const lab = LABS[id];
  const { root, tabs, close } = overlay(PLACE_NAME(id), lab.title);
  const stage = h('div', { class: 'lab-stage' }), side = h('aside', { class: 'lab-side' });
  root.append(h('div', { class: `hb-main${lab.wide ? ' wide' : ''}` }, stage, side));
  let current = start, result;
  let cleanup = [], token = 0;

  const show = async (i) => {
    const my = ++token, st = lab.stations[i];
    current = i;
    cleanup.forEach((f) => f()); cleanup = [];
    stage.replaceChildren(); side.replaceChildren();
    if (!lab.stepper) [...tabs.children].forEach((b, j) => b.setAttribute('aria-selected', j === i));
    const controls = h('div', { class: 'lab-ctl' });
    const take = h('div', { class: 'lab-take', html: `<div class="lab-k">Takeaway</div>${st.takeaway}` });
    let code = null;
    side.append(h('div', {}, h('div', { class: 'lab-k' }, st.why ? 'Why this step' : 'Goal'), h('div', { class: 'lab-goal' }, st.why || st.goal)));
    if (st.code) { code = codePanel(st.code, (state, key) => ctx.onCode?.(state, key)); side.append(code.el); }
    const tries = st.tries.map((t) => h('li', { html: t }));
    side.append(h('div', {}, h('div', { class: 'lab-k' }, 'Try this'), h('ul', { class: 'lab-try' }, tries)), controls);
    if (lab.stepper) {
      tabs.className = 'hb-step';
      tabs.replaceChildren(h('button', { class: 'hb-close', disabled: i === 0 ? '' : null, onclick: () => show(i - 1) }, '‹'),
        h('span', {}, h('span', { class: 'zone' }, `${st.zone}  `), h('b', {}, `${i + 1}. ${st.tab}`), ` of ${lab.stations.length}`),
        h('button', { class: 'hb-close', disabled: i === lab.stations.length - 1 ? '' : null, onclick: () => show(i + 1) }, 'next ›'));
    }
    const src = h('div', { class: 'lab-src' }, st.source || '');
    // every station can send the learner to the theory and back
    if (st.deep !== false) side.append(h('button', { class: 'lab-btn', onclick: () => { result = { deep: Array.isArray(st.deep) ? st.deep : [id, st.anchor || null], station: i }; close.onclick(); } }, 'Theory: open the reading wall →'));
    side.append(src);
    let shown = false;
    const ctx = {
      stage, controls, code,
      reveal: () => { if (!shown && my === token) { shown = true; side.insertBefore(take, src); sfx.reveal(); state.done[`${id}:${i}`] = true; save(); } },
      // tick one of the "try this" lines; when all are ticked the takeaway appears
      did: (k) => { if (my !== token || !tries[k] || tries[k].classList.contains('ok')) return; tries[k].classList.add('ok'); sfx.tick(); if (tries.every((li) => li.classList.contains('ok'))) ctx.reveal(); },
      onCleanup: (f) => cleanup.push(f),
      alive: () => my === token,
    };
    root.dataset.station = `${id}:${i}`;
    root.dataset.ready = '0';
    await st.mount(ctx);
    if (my === token) root.dataset.ready = '1';
  };

  if (!lab.stepper) lab.stations.forEach((st, i) => tabs.append(h('button', { class: 'hb-tab', role: 'tab', onclick: () => show(i) }, h('b', {}, String(i + 1)), st.tab)));
  return new Promise((resolve) => {
    const done = () => { cleanup.forEach((f) => f()); window.removeEventListener('keydown', key, true); root.remove(); resolve(result); };
    const key = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); done(); }
      else if (!lab.stepper && /^[1-9]$/.test(e.key) && +e.key <= lab.stations.length && e.target.tagName !== 'INPUT') show(+e.key - 1);
      else if (lab.stepper && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { const n = current + (e.key === 'ArrowRight' ? 1 : -1); if (n >= 0 && n < lab.stations.length) show(n); }
    };
    window.addEventListener('keydown', key, true);
    close.onclick = done;
    show(Math.min(start, lab.stations.length - 1));
  });
}
