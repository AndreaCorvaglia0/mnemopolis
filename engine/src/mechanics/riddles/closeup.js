// The first-person close-up of a lock: a full-screen page drawn in the game's pixel style (art.js)
// with real HTML on top where it must be read or typed: the sticky note (or the voice behind the
// door), the safe's display and keypad, the computer's login prompt, a text field and a Try button.
//   openCloseup(riddle, { where, state, lang, title, owner, onStation }) -> Promise<{ opened, station }>
// A wrong answer shakes the lock and the character thinks where to look (hints.js); a right one
// plays a short event (the handle turns and the door swings open, the screen unlocks, the hatch
// slams and the bolts slide) and shows what is inside. An opened lock shows its content again.
// Esc or "Step back" closes it at any time. Motion follows prefers-reduced-motion.
import { h } from '../../lab/shell.js';
import { sfx } from '../../systems/audio.js';
import { save } from '../../systems/state.js';
import { touch } from '../../systems/view.js';
import { tr, fill } from '../config.js';
import { LOCK_KINDS, LOCK_WORDS as W } from './kinds.js';
import { TOOLS } from '../obstacles/kinds.js';
import { ART, AW, AH } from './art.js';
import { attempt, isOpenLock, contentsOf } from './logic.js';
import { typeOf } from './match.js';
import { linkOf } from './data.js';
import { PLACE } from '../../data/content.js';

const CSS = `
.lk{position:fixed;left:0;top:0;width:100%;height:100%;z-index:22;background:#07060b;color:#f1ecd9;display:flex;flex-direction:column;font:16px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;overflow:hidden}
.lk *{box-sizing:border-box}.lk [hidden]{display:none !important}.lk button,.lk input{font:inherit;color:inherit}
.lk :focus-visible{outline:3px solid #ffcf5a;outline-offset:2px}
.lk-top{display:flex;align-items:center;gap:12px;min-height:52px;padding:4px 8px 4px 16px;background:#0f0d16;border-bottom:1px solid #2a2436;flex:none}
.lk-top h1{flex:1;min-width:0;margin:0;font-size:17px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lk-top h1 span{color:#a9a2b8;font-weight:400}
.lk-back{min-height:44px;padding:0 14px;border-radius:10px;background:none;border:1px solid #3a3348;cursor:pointer;white-space:nowrap}
.lk-back:hover{background:#1c1826}
.lk-main{flex:1;min-height:0;display:flex;flex-direction:column}
.lk-stage{position:relative;flex:1;min-height:120px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.lk-stage canvas{image-rendering:pixelated;display:block;position:absolute}
.lk-layer{position:absolute;pointer-events:none}.lk-layer>*{pointer-events:auto}
.lk-note{position:absolute;background:#ffe066;color:#2b2410;padding:10px 12px 12px;font-family:"Pixelify Sans",system-ui,sans-serif;line-height:1.25;box-shadow:3px 5px 0 rgba(0,0,0,.45);transform-origin:50% 0;max-width:min(62vw,360px)}
.lk-note::before{content:'';position:absolute;left:30%;top:-9px;width:40%;height:16px;background:rgba(235,230,210,.55);transform:rotate(-2deg)}
.lk-note small{display:block;font-family:system-ui,sans-serif;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#6d5b1e;margin-bottom:2px}
.lk-bubble{position:absolute;background:#f6f1e3;color:#1b1a2b;border:3px solid #0d0b14;border-radius:14px;padding:10px 14px;box-shadow:4px 5px 0 rgba(0,0,0,.4);max-width:min(84vw,460px)}
.lk-bubble::before{content:'';position:absolute;top:-14px;left:calc(50% - 10px);border:10px solid transparent;border-bottom:12px solid #0d0b14;border-top:0}
.lk-bubble small{display:block;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#6a6278;margin-bottom:2px}
.lk-disp{position:absolute;display:flex;align-items:center;justify-content:flex-end;gap:4px;padding:0 .35em;font-family:"DotGothic16",ui-monospace,monospace;color:#9dffa8;text-shadow:0 0 6px #4fe06a;letter-spacing:.12em;white-space:nowrap;overflow:hidden}
.lk-disp.err{color:#ff8a80;text-shadow:0 0 6px #ff4f45}
.lk-screen{position:absolute;padding:.5em .7em;font-family:"DotGothic16",ui-monospace,monospace;color:#7ff0e2;text-shadow:0 0 6px rgba(79,209,197,.7);display:flex;flex-direction:column;justify-content:center;gap:.3em;overflow:hidden}
.lk-screen .row{display:flex;align-items:center;gap:.4em;white-space:nowrap}
.lk-screen input{flex:1;min-width:2em;background:rgba(79,209,197,.08);border:0;border-bottom:2px solid #4fd1c5;color:#c8fff6;caret-color:#c8fff6;font-family:inherit;font-size:inherit;padding:2px 4px;outline:none;text-shadow:inherit}
.lk-screen .msg{min-height:1.2em;color:#ff8a80;text-shadow:0 0 6px #ff4f45}.lk-screen .msg.ok{color:#c8fff6}
.lk-ctl{flex:none;display:flex;flex-direction:column;gap:10px;padding:12px 14px calc(12px + env(safe-area-inset-bottom));background:#0f0d16;border-top:1px solid #2a2436}
.lk-row{display:flex;gap:10px;align-items:center}
.lk-row label{color:#c9c2d6;white-space:nowrap}
.lk-in{flex:1;min-width:0;min-height:48px;padding:0 14px;border-radius:10px;border:2px solid #4fd1c5;background:#14111d;color:#fff;font-size:18px}
.lk-in::placeholder{color:#7d768c}
.lk-try{min-height:48px;min-width:96px;padding:0 18px;border-radius:10px;border:0;background:#4fd1c5;color:#04201d;font-weight:700;font-size:18px;cursor:pointer}
.lk-try:disabled{opacity:.45;cursor:default}
.lk-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.lk-pad button{min-height:52px;border-radius:10px;border:1px solid #4a4258;background:linear-gradient(#2a2433,#1d1826);font-size:22px;font-weight:700;cursor:pointer;box-shadow:0 3px 0 #0a080e}
.lk-pad button:active{transform:translateY(2px);box-shadow:0 1px 0 #0a080e}
.lk-pad button.sm{font-size:15px;font-weight:600;color:#c9c2d6}
.lk-think{position:absolute;left:0;right:0;margin:0 auto;width:fit-content;bottom:12px;max-width:min(92%,560px);background:#f6f1e3;color:#2d2a40;border:3px solid #1b1a2b;border-radius:18px;padding:10px 16px;font-size:18px;text-align:center;box-shadow:0 4px 0 rgba(0,0,0,.35);z-index:3}
.lk-think::after{content:'';position:absolute;left:24px;bottom:-16px;width:12px;height:12px;border-radius:50%;background:#f6f1e3;border:3px solid #1b1a2b}
.lk-think small{display:block;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#7a7288}
.lk-doc{flex:none;max-height:58%;overflow:auto;padding:14px 16px calc(16px + env(safe-area-inset-bottom));background:#0f0d16;border-top:1px solid #2a2436}
.lk-doc .paper{max-width:640px;margin:0 auto;background:#efe6cf;color:#2a2318;border-radius:4px;padding:16px 18px;box-shadow:0 4px 0 rgba(0,0,0,.4);font-family:Georgia,"Times New Roman",serif;font-size:18px;line-height:1.5}
.lk-doc .paper h2{margin:0 0 6px;font:600 13px system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#7a6a48}
.lk-doc .acts{max-width:640px;margin:12px auto 0;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.lk-doc .acts a,.lk-doc .acts button{min-height:46px;display:inline-flex;align-items:center;padding:0 16px;border-radius:10px;border:1px solid #4fd1c5;background:none;color:#4fd1c5;cursor:pointer;text-decoration:none}
.lk-doc .acts button.main{background:#4fd1c5;color:#04201d;font-weight:700;border:0}
.lk-gain{display:inline-block;color:#ffcf5a;font-weight:700;animation:lkpop .6s ease-out}
@keyframes lkpop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.25)}100%{transform:scale(1);opacity:1}}
@media (min-width:900px) and (min-height:520px){.lk-main{flex-direction:row}.lk-ctl{width:340px;border-top:0;border-left:1px solid #2a2436;justify-content:center}.lk-doc{max-height:none;width:420px;border-top:0;border-left:1px solid #2a2436;display:flex;flex-direction:column;justify-content:center}}
.lk-ctl .lk-note,.lk-ctl .lk-bubble{position:relative;left:auto!important;top:auto!important;width:auto!important;max-width:none;transform:rotate(-1deg)!important;font-size:17px!important;padding:6px 10px 8px;margin:4px 0 2px}.lk-ctl .lk-bubble::before{display:none}
.lk-ctl .lk-think{position:relative;bottom:auto;margin:0 auto 6px;font-size:17px;padding:8px 14px}
@media (max-height:560px){.lk-pad button{min-height:44px}.lk-ctl{gap:8px;padding-top:8px}}
@media (prefers-reduced-motion:reduce){.lk-gain{animation:none}}`;
let styled = false;

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const tween = (ms, fn) => new Promise((res) => {
  if (reduced() || ms <= 0) { fn(1); res(); return; }
  const t0 = performance.now();
  const step = (now) => { const k = Math.min(1, (now - t0) / ms); fn(k); if (k < 1) requestAnimationFrame(step); else res(); };
  requestAnimationFrame(step);
});
const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? Math.min(ms, 120) : ms));

export function openCloseup(r, o = {}) {
  if (!styled) { document.head.append(h('style', { html: CSS })); styled = true; }
  const st = o.state, lang = o.lang || 'en', T = (v) => tr(v, lang);
  const K = LOCK_KINDS[r.kind] || LOCK_KINDS.safe, kind = LOCK_KINDS[r.kind] ? r.kind : 'safe', A = ART[kind];
  const type = typeOf(r), keypad = K.keypad && type !== 'text';
  const s = { t: 0, open: 0, shake: 0, turn: 0, hatch: kind === 'door' ? 0 : 1, eyes: true, bolts: 0, motes: !reduced() };

  // ---- frame
  const back = h('button', { type: 'button', class: 'lk-back' }, T(W.back));
  const cv = h('canvas', { width: AW, height: AH, 'aria-hidden': 'true' });
  const layer = h('div', { class: 'lk-layer' });
  const think = h('div', { class: 'lk-think', role: 'status', 'aria-live': 'polite', hidden: '' });
  const stage = h('div', { class: 'lk-stage' }, cv, layer, think);
  const ctl = h('div', { class: 'lk-ctl' });
  const main = h('div', { class: 'lk-main' }, stage, ctl);
  const root = h('div', { class: 'lk', role: 'dialog', 'aria-label': `${T(K.title)}. ${r.clue}` },
    h('div', { class: 'lk-top' }, h('h1', { html: `${T(K.title)}${o.title ? ` <span>· ${o.title}</span>` : ''}` }), back), main);
  document.body.append(root);
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;

  // ---- the clue: a sticky note on the lock, or what the voice behind the door says
  let clueEl;
  if (K.clueBy === 'voice') clueEl = h('div', { class: 'lk-bubble' }, h('small', {}, T(W.voice)), `"${r.clue}"`);
  else clueEl = h('div', { class: 'lk-note' }, h('small', {}, T(W.note)), r.clue);
  layer.append(clueEl);

  // ---- input: the keypad and the display, or a text field (on the screen of a computer)
  let value = '', input = null, disp = null, msg = null;
  const tryBtn = h('button', { type: 'button', class: 'lk-try' }, T(W.tryBtn));
  if (keypad) {
    disp = h('div', { class: 'lk-disp', 'aria-live': 'polite' });
    layer.append(disp);
    const pad = h('div', { class: 'lk-pad', role: 'group', 'aria-label': T(K.ask) });
    const key = (label, fn, cls = '', aria = label) => h('button', { type: 'button', class: cls, 'aria-label': aria, onclick: () => { fn(); sfx.tick?.(); } }, label);
    for (const d of '123456789') pad.append(key(d, () => press(d)));
    pad.append(key(T(W.clear), () => setValue(''), 'sm'), key('0', () => press('0')), key('⌫', () => setValue(value.slice(0, -1)), 'sm', T(W.del)));
    if (type === 'number' && [].concat(r.answer).some((a) => !Number.isInteger(+a))) pad.children[9].replaceWith(key(',', () => press(','), 'sm', 'comma'));
    ctl.append(h('div', { class: 'lk-row' }, h('label', {}, T(K.ask))), pad, h('div', { class: 'lk-row' }, h('span', { style: 'flex:1' }), tryBtn));
  } else {
    input = h('input', { class: kind === 'computer' ? '' : 'lk-in', type: kind === 'computer' && type === 'text' ? 'password' : 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'go', inputmode: type === 'text' ? 'text' : 'decimal', 'aria-label': T(K.ask), placeholder: kind === 'computer' ? '' : T(W.typeHere), maxlength: '40' });
    input.addEventListener('input', () => { value = input.value; tryBtn.disabled = !value.trim(); });
    if (kind === 'computer') {
      msg = h('div', { class: 'msg', 'aria-live': 'polite' });
      const scr = h('div', { class: 'lk-screen' }, h('div', { class: 'row' }, `${T(W.user)}: ${o.owner || '...'}`), h('div', { class: 'row' }, `${T(W.password)}:`, input), msg);
      layer.append(scr);
      ctl.append(h('div', { class: 'lk-row' }, h('label', { style: 'flex:1' }, T(K.ask)), tryBtn));
    } else ctl.append(h('div', { class: 'lk-row' }, h('label', {}, T(K.ask))), h('div', { class: 'lk-row' }, input, tryBtn));
    if (r.unit && type !== 'text') ctl.querySelector('.lk-row:last-child')?.insertBefore(h('span', {}, r.unit), tryBtn);
  }
  const setValue = (v) => { value = v; if (disp) { disp.classList.remove('err'); disp.textContent = v || '_ _ _'; if (r.unit && v) disp.append(h('span', {}, r.unit)); } tryBtn.disabled = !value.trim(); };
  const press = (d) => { if (value.length < 8) setValue(value + d); };
  setValue('');

  // ---- layout: the picture as large as the stage allows; HTML on top in art pixels
  let k = 1;
  const place = (el, x, y, w, hh) => { el.style.left = `${x * k}px`; el.style.top = `${y * k}px`; if (w) el.style.width = `${w * k}px`; if (hh) el.style.height = `${hh * k}px`; };
  const layout = () => {
    const vv = window.visualViewport;
    if (vv) { root.style.height = `${vv.height}px`; root.style.top = `${vv.offsetTop}px`; } // the phone keyboard
    const bw = stage.clientWidth, bh = stage.clientHeight;
    // an upright stage may crop up to a quarter of the picture's width: the lock is in the middle
    k = Math.max(0.5, Math.min(Math.max(bw / AW, Math.min(bw / (AW * 0.75), bh / AH)), bh / AH));
    const w = AW * k, hh = AH * k, x0 = (bw - w) / 2, y0 = (bh - hh) / 2;
    Object.assign(cv.style, { width: `${w}px`, height: `${hh}px`, left: `${x0}px`, top: `${y0}px` });
    Object.assign(layer.style, { width: `${w}px`, height: `${hh}px`, left: `${x0}px`, top: `${y0}px` });
    const fs = (n, cap = 28) => `${Math.max(16, Math.min(cap, Math.round(n * k)))}px`;
    // the clue stays readable: on the picture where it fits, otherwise in the controls (a very short
    // stage, as with a phone keyboard open)
    const shortStage = bh < 300;
    if (shortStage && clueEl.parentNode !== ctl) { ctl.prepend(clueEl); clueEl.classList.add('in-ctl'); }
    if (!shortStage && clueEl.parentNode !== layer) { layer.append(clueEl); clueEl.classList.remove('in-ctl'); }
    if (A.note && !shortStage) {
      const [x, y, nw, rot] = A.note, fits = x0 + (x + nw + 8) * k <= bw - 4 && k >= 3.2;
      clueEl.style.fontSize = fits ? fs(5.2) : '17px';
      clueEl.style.transform = `rotate(${rot}deg)`;
      if (!fits) { const nw2 = Math.min(bw * 0.62, 260); clueEl.style.left = `${bw - x0 - nw2 - 8}px`; clueEl.style.top = `${Math.max(4, y * k)}px`; clueEl.style.width = `${nw2}px`; }
      else place(clueEl, x, y, nw + 8);
    }
    if (A.bubble && !shortStage) { clueEl.style.fontSize = fs(4.4, 24); const [, y] = A.bubble, bw2 = Math.min(bw - 16, 460); clueEl.style.left = `${w / 2 - bw2 / 2}px`; clueEl.style.top = `${y * k}px`; clueEl.style.width = `${bw2}px`; }
    if (disp) { const [x, y, dw, dh] = A.display; place(disp, x, y, dw, dh); disp.style.fontSize = fs(9, 64); }
    const scr = layer.querySelector('.lk-screen');
    if (scr) { const [x, y, sw, sh] = A.screen; place(scr, x, y, sw, sh); scr.style.fontSize = fs(5.6, 34); }
  };
  layout();
  const ro = new ResizeObserver(layout); ro.observe(stage);
  window.visualViewport?.addEventListener('resize', layout);
  window.visualViewport?.addEventListener('scroll', layout);

  // ---- the picture, alive: dust, eyes that blink and look, the dial idling
  let raf = 0, last = performance.now(), alive = true;
  const frame = (now) => {
    if (!alive) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now; s.t += dt;
    if (kind === 'door') { s.blink = s.t % 4.1 < 0.14; s.look = Math.round(Math.sin(s.t * 0.6) * 1.2); }
    if (kind === 'safe' && s.motes) s.dial = Math.sin(s.t * 0.3) * 0.05;
    g.clearRect(0, 0, AW, AH);
    A.paint(g, s);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  if (kind === 'door' && !isOpenLock(st, r)) { sfx.page?.(); tween(420, (q) => { s.hatch = q; }); } // the hatch slides open

  // ---- the thought after a miss
  const thinkLine = (text) => {
    think.hidden = false; think.replaceChildren(h('small', {}, T(W.thinking)), text);
    const narrow = !matchMedia('(min-width:900px) and (min-height:520px)').matches;
    if (narrow && think.parentNode !== ctl) ctl.prepend(think); else if (!narrow && think.parentNode !== stage) stage.append(think);
  };
  let busy = false;
  const reaction = (text, ok = false) => {
    if (disp) { disp.textContent = ok ? 'OPEN' : 'ERROR'; disp.classList.toggle('err', !ok); }
    if (msg) { msg.textContent = text; msg.classList.toggle('ok', ok); }
    if (kind === 'door') clueEl.replaceChildren(h('small', {}, T(W.voice)), text);
  };

  let resolveOut, result = { opened: isOpenLock(st, r), station: null };
  const done = () => {
    if (!alive) return;
    alive = false; cancelAnimationFrame(raf); ro.disconnect();
    window.visualViewport?.removeEventListener('resize', layout); window.visualViewport?.removeEventListener('scroll', layout);
    removeEventListener('keydown', onKey, true); root.remove(); resolveOut(result);
  };

  async function submit() {
    if (busy || !value.trim()) return;
    busy = true; tryBtn.disabled = true;
    const res = attempt(st, r, value, o.where);
    save();
    if (res.ok) { await opening(res.rewards || []); busy = false; return; }
    sfx.bump?.();
    const misses = T(K.miss);
    reaction(misses[(res.misses - 1) % misses.length]);
    s.err = true;
    await tween(reduced() ? 0 : 420, (q) => { s.shake = Math.sin(q * Math.PI * 6) * 3 * (1 - q); });
    s.shake = 0;
    thinkLine(res.thought);
    o.onMiss?.(res);
    setTimeout(() => { s.err = false; if (keypad) setValue(''); else { input.select(); } }, 650);
    if (kind === 'door') setTimeout(() => { if (alive && !s.open) clueEl.replaceChildren(h('small', {}, T(W.voice)), `"${r.clue}"`); }, 2600);
    busy = false; tryBtn.disabled = !value.trim();
    if (input && !touch.on) input.focus();
  }

  async function opening(rewards) {
    think.hidden = true;
    reaction(T(K.open), true);
    sfx.motif?.('lock');
    if (kind === 'safe') { await tween(650, (q) => { s.turn = q; }); await wait(150); sfx.door?.(); await tween(900, (q) => { s.open = q * q * (3 - 2 * q); }); }
    else if (kind === 'computer') { await tween(500, (q) => { s.open = q; }); }
    else { await tween(260, (q) => { s.hatch = 1 - q; }); await tween(520, (q) => { s.bolts = q; }); await wait(160); sfx.door?.(); await tween(850, (q) => { s.open = q * q * (3 - 2 * q); }); }
    result.opened = true;
    o.onOpen?.(rewards);
    showInside(rewards, true);
  }

  // ---- what is inside: the document, an experiment, a link; rewards once, with a flourish
  function showInside(rewards, fresh) {
    s.open = 1; s.turn = 1; s.bolts = 1; s.hatch = 0;
    const c = contentsOf(r), p = PLACE[r.place] || {}, note = c.find((x) => x.kind === 'note');
    const acts = h('div', { class: 'acts' });
    for (const x of c.filter((y) => y.kind === 'station')) {
      const tab = p.lab?.stations?.find((y) => y.id === x.id)?.tab || x.id, seen = st.done?.[`${r.place}+up:${x.id}`];
      acts.append(h('button', { type: 'button', class: 'main', onclick: () => { result.station = x.id; done(); } }, `${T(seen ? W.reopenStation : W.openStation)}: ${tab}`));
    }
    for (const x of c.filter((y) => y.kind === 'link')) { const f = linkOf(p, x.index); if (f) acts.append(h('a', { href: f.url, target: '_blank', rel: 'noopener' }, `${f.title} ↗`)); }
    const gains = (fresh ? rewards : []).map((x) => (x.kind === 'coins' ? fill(T(W.coins), { n: x.n }) : x.kind === 'tool' ? fill(T(W.tool), { tool: T(TOOLS[x.name] || { en: x.name }) }) : fill(T(W.key), { house: PLACE[x.id]?.name || x.id })));
    for (const t of gains) acts.append(h('span', { class: 'lk-gain' }, t));
    acts.append(h('button', { type: 'button', onclick: done }, T(W.back)));
    const doc = h('div', { class: 'lk-doc', role: 'region', 'aria-label': T(K.doc) },
      note ? h('div', { class: 'paper' }, h('h2', {}, T(K.doc)), note.text) : null, acts);
    ctl.replaceWith(doc);
    if (A.note && kind !== 'computer') clueEl.hidden = true;
    if (kind === 'computer') { const sc = layer.querySelector('.lk-screen'); sc?.replaceChildren(h('div', { class: 'msg ok' }, T(K.open))); if (sc) sc.style.justifyContent = 'flex-end'; }
    if (kind === 'door') clueEl.hidden = true;
    if (disp) disp.hidden = true;
    requestAnimationFrame(layout);
    acts.querySelector('button')?.focus({ preventScroll: true });
  }

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); done(); return; }
    if (result.opened || busy) return;
    if (e.key === 'Enter') { e.preventDefault(); submit(); return; }
    if (keypad) {
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); press(e.key); }
      else if ((e.key === ',' || e.key === '.') && type === 'number') { e.preventDefault(); press(','); }
      else if (e.key === 'Backspace') { e.preventDefault(); setValue(value.slice(0, -1)); }
    }
  };
  addEventListener('keydown', onKey, true);
  tryBtn.onclick = submit;
  back.onclick = done;
  root.dataset.ready = '1';

  if (isOpenLock(st, r)) showInside([], false);
  else if (input && !touch.on) setTimeout(() => input.focus(), 60);
  else tryBtn.focus?.({ preventScroll: true });
  return new Promise((res) => { resolveOut = res; });
}
