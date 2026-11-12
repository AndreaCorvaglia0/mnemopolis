// A plaque of a museum timeline. The timeline itself lives in the course database (place.timeline).
import { h } from './shell.js';
import { sfx } from '../systems/audio.js';
import { touch } from '../systems/view.js';

const CSS = `.hb-card{position:relative}.hb-card .tag{margin-right:44px}.hb-card .x{position:absolute;top:10px;right:12px;background:none;border:1px solid #5a4630;color:#e6dcc0;border-radius:8px;width:36px;height:36px;font-size:16px;cursor:pointer}
.hb-card-bg{position:fixed;inset:0;z-index:20;background:rgba(8,6,4,.72);display:grid;place-items:center;font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;color:#efe6d2;padding:16px}
.hb-card{width:min(640px,100%);background:#1d1712;border:2px solid #8a6a3a;border-radius:10px;padding:26px 30px 18px;box-shadow:0 0 0 6px #120e0a,0 20px 60px #000}
.hb-card .yr{font:700 54px/1 Georgia,serif;color:#ffcf5a}.hb-card h2{margin:6px 0 2px;font-size:26px;text-wrap:balance}
.hb-card .who{color:#b8a988;font-size:14px;margin-bottom:12px}.hb-card .tag{float:right;border:1px solid;border-radius:999px;padding:2px 10px;font-size:12px}
.hb-card .why{border-left:3px solid #ffcf5a;padding:4px 0 4px 12px;margin:14px 0 10px;color:#fff}
.hb-card .src{font-size:12px;color:#8c7e64}.hb-card nav{display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-size:14px;color:#b8a988}
.hb-card button{background:#2a2118;border:1px solid #8a6a3a;color:#efe6d2;border-radius:8px;padding:6px 12px;font:inherit;cursor:pointer}.hb-card button:disabled{opacity:.3;cursor:default}`;
let styled = false;

// Shows one plaque. Arrow keys walk along the corridor; resolves with the index last shown.
export function openPlaque(list, start, kinds = {}) {
  if (!styled) { document.head.append(h('style', { html: CSS })); styled = true; }
  let i = start;
  const card = h('div', { class: 'hb-card' }), bg = h('div', { class: 'hb-card-bg', role: 'dialog' }, card);
  document.body.append(bg);
  return new Promise((resolve) => {
    const show = () => {
      const m = list[i], [kn, kc] = kinds[m.kind] || ['', '#ffcf5a'];
      card.replaceChildren(h('button', { class: 'x', 'aria-label': 'Close', onclick: () => done() }, '✕'), kn ? h('span', { class: 'tag', style: `color:${kc}` }, kn) : null, h('div', { class: 'yr' }, String(m.year)), h('h2', {}, m.title), h('div', { class: 'who' }, m.who || ''),
        h('div', {}, m.text), m.why ? h('div', { class: 'why' }, m.why) : null, m.src ? h('div', { class: 'src' }, `Source: ${m.src}`) : null,
        h('nav', {}, h('button', { disabled: i === 0 ? '' : null, onclick: () => go(-1) }, '← earlier'), h('span', {}, touch.on ? `${i + 1} of ${list.length}` : `${i + 1} of ${list.length}  ·  Esc to close`), h('button', { disabled: i === list.length - 1 ? '' : null, onclick: () => go(1) }, 'later →')));
    };
    const go = (d) => { const n = Math.max(0, Math.min(list.length - 1, i + d)); if (n !== i) { i = n; sfx.page(); show(); } };
    const done = () => { window.removeEventListener('keydown', key, true); bg.remove(); resolve(i); };
    const key = (e) => { if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); done(); } else if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); };
    window.addEventListener('keydown', key, true);
    bg.addEventListener('pointerdown', (e) => { if (e.target === bg) done(); });
    show();
  });
}
