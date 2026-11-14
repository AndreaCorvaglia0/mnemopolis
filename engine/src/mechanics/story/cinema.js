// Cinematic moments (docs/STORY.md): black bars slide in at the top and the bottom, the HUD and the
// tracker hide, the input is taken over, the camera moves by script, one line of text at a time in a
// caption; then everything returns exactly as it was. Always skippable: a tap, Space or Enter goes to
// the next line; Esc or "Skip" ends the scene (the script still runs to its end at once, so whatever
// it changes in the game is changed: only the pictures are skipped). prefers-reduced-motion: no
// camera moves (cuts) and no sliding.
//
//   await cinema(ui, async (c) => { c.theme('fragment'); await c.pan(x, y, 900); await c.say('...'); }, { scene })
//
// c.say(text, { hold })   one caption; waits for a tap, or for the time to read it (hold: wait for a tap)
// c.wait(ms)              c.pan(x, y, ms)  c.zoom(k, ms)  (k: times the scene's zoom)  c.follow()
// c.show(el) / c.hide()   a picture in the middle (a close-up's canvas, a page)
// c.dim(alpha, ms)        a black veil between the bars (0..1)
// c.theme(kind)           the story's theme (systems/sound): 'fragment' | 'opening' | 'full'
// c.skipped               true once the player skipped
import { h } from '../../lab/shell.js';
import { sfx } from '../../systems/audio.js';
import { touch } from '../../systems/view.js';
import { S_WORDS } from './words.js';
import { tr } from './config.js';

const CSS = `
.cn{position:fixed;inset:0;z-index:24;pointer-events:auto;user-select:none;-webkit-user-select:none;font:20px/1.4 Georgia,"Times New Roman",serif;color:#f1ecd9;cursor:pointer}
.cn *{box-sizing:border-box}
.cn-bar{position:absolute;left:0;right:0;height:max(12vh,86px);background:#000;transition:transform .55s cubic-bezier(.3,.7,.2,1);z-index:3}
.cn-top{top:0;transform:translateY(-101%)}.cn-bot{bottom:0;transform:translateY(101%)}
.cn.in .cn-top,.cn.in .cn-bot{transform:none}
.cn-veil{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .6s;z-index:1;pointer-events:none}
.cn-mid{position:absolute;left:0;right:0;top:max(12vh,86px);bottom:max(12vh,86px);display:flex;align-items:center;justify-content:center;z-index:2;pointer-events:none}
.cn-mid>*{pointer-events:auto}
.cn-cap{position:absolute;left:0;right:0;bottom:0;height:max(12vh,86px);display:flex;align-items:center;justify-content:center;padding:6px 16px 10px;text-align:center;z-index:4;pointer-events:none}
.cn-cap p{margin:0;max-width:min(92vw,820px);font-size:clamp(18px,2.4vw,24px);letter-spacing:.01em;text-wrap:balance;opacity:0;transform:translateY(4px);transition:opacity .45s,transform .45s}
.cn-cap p.on{opacity:1;transform:none}
.cn-skip{position:absolute;top:10px;right:10px;z-index:5;min-height:44px;min-width:44px;padding:0 16px;border-radius:10px;border:1px solid #3a3a44;background:#0b0b10;color:#c9c4b4;font:16px system-ui,sans-serif;cursor:pointer;opacity:0;transition:opacity .4s .3s}
.cn.in .cn-skip{opacity:1}
.cn-hint{position:absolute;right:14px;bottom:8px;z-index:5;font:14px system-ui,sans-serif;color:#8f8a7c;opacity:0;transition:opacity .4s}
.cn-hint.on{opacity:1}
@media (prefers-reduced-motion:reduce){.cn-bar,.cn-cap p,.cn-veil,.cn-skip{transition:none}}
`;
let styled = false;
export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function cinema(ui, script, { scene = null, hint = true } = {}) {
  if (!styled) { document.head.append(h('style', { html: CSS })); styled = true; }
  const reduced = reducedMotion();
  // ---- take over: the HUD and the prompt hide, the scenes see the interface as busy
  ui.open('cinema');
  const hudWas = ui.hud?.visible;
  ui.setHudVisible?.(false);
  ui.setPrompt?.(null);
  const cap = h('p', {}), veil = h('div', { class: 'cn-veil' }), mid = h('div', { class: 'cn-mid' });
  const skip = h('button', { type: 'button', class: 'cn-skip' }, `${tr(S_WORDS.skip)} ›`);
  const hintEl = h('div', { class: 'cn-hint' }, tr(touch.on ? S_WORDS.tapOn : S_WORDS.keyOn));
  const root = h('div', { class: 'cn', role: 'dialog', 'aria-live': 'polite' }, h('div', { class: 'cn-bar cn-top' }), h('div', { class: 'cn-bar cn-bot' }), veil, mid, h('div', { class: 'cn-cap' }, cap), skip, hintEl);
  document.body.append(root);
  requestAnimationFrame(() => root.classList.add('in'));

  let tapped = null;
  const c = { skipped: false, root, mid };
  const tap = () => { const f = tapped; tapped = null; f?.(); };
  const doSkip = () => { if (c.skipped) return; c.skipped = true; tap(); };
  root.addEventListener('pointerdown', (e) => { if (e.target === skip || e.target.closest?.('input,button,a')) return; e.preventDefault(); tap(); });
  skip.addEventListener('click', (e) => { e.stopPropagation(); doSkip(); });
  const onKey = (e) => {
    if (e.target?.closest?.('input')) return; // a field inside a scene (the purser's register) keeps its keys
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); doSkip(); }
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); tap(); }
  };
  window.addEventListener('keydown', onKey, true);
  // waits for a tap or the time, whichever comes first (or at once when skipped)
  const until = (ms) => (c.skipped ? Promise.resolve() : new Promise((r) => { let done = false; const end = () => { if (!done) { done = true; tapped = null; r(); } }; tapped = end; if (ms != null) setTimeout(end, ms); }));

  const cam = scene?.cameras?.main, base = cam ? { zoom: cam.zoom } : null;
  const player = scene?.player?.sprite;
  if (cam) cam.stopFollow();

  c.say = async (text, { hold = false, min = 2200 } = {}) => {
    if (c.skipped || !text) return;
    cap.classList.remove('on');
    await sleep(reduced ? 0 : 120);
    cap.textContent = text;
    void cap.offsetWidth; cap.classList.add('on');
    if (hint) hintEl.classList.add('on');
    const words = String(text).split(/\s+/).length;
    await until(hold ? null : Math.max(min, 900 + words * 330));
    cap.classList.remove('on');
  };
  c.clear = () => { cap.classList.remove('on'); };
  c.wait = (ms) => (c.skipped ? Promise.resolve() : until(ms));
  c.sleep = (ms) => (c.skipped ? Promise.resolve() : sleep(ms));
  c.pan = (x, y, ms = 900) => new Promise((r) => {
    if (!cam) return r();
    if (c.skipped || reduced || ms <= 0) { cam.centerOn(x, y); return r(); }
    cam.pan(x, y, ms, 'Sine.easeInOut', true, (_, t) => { if (t >= 1) r(); });
  });
  c.zoom = (k, ms = 900) => new Promise((r) => {
    if (!cam) return r();
    const z = base.zoom * k;
    if (c.skipped || reduced || ms <= 0) { cam.setZoom(z); return r(); }
    cam.zoomTo(z, ms, 'Sine.easeInOut', true, (_, t) => { if (t >= 1) r(); });
  });
  c.follow = () => { if (cam && player) { cam.setZoom(base.zoom); cam.startFollow(player, true, 0.15, 0.15); } };
  c.show = (el) => { mid.replaceChildren(el); };
  c.hide = () => mid.replaceChildren();
  c.dim = (a, ms = 600) => { veil.style.transitionDuration = `${reduced || c.skipped ? 0 : ms}ms`; veil.style.opacity = String(a); return c.sleep(ms); };
  c.theme = (kind) => sfx.theme?.(kind) || 0;

  try { await script(c); } finally {
    // ---- give back exactly what was taken
    window.removeEventListener('keydown', onKey, true);
    if (cam) { cam.setZoom(base.zoom); if (player) cam.startFollow(player, true, 0.15, 0.15); }
    root.classList.remove('in');
    cap.classList.remove('on');
    await sleep(reduced ? 0 : 420);
    root.remove();
    ui.setHudVisible?.(hudWas !== false);
    ui.close();
    ui.refreshQuest?.(true);
  }
  return c;
}
