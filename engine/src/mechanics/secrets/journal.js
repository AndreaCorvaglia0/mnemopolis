// The discoveries page (J, or the button on the map): found secrets with their little picture,
// the others as silhouettes until found ("3 of 9"). No points, no effect on the course.
import { overlay, h } from '../../lab/shell.js';
import { makeCanvas, rect, px, ellipse } from '../../art/px.js';
import { state } from '../../systems/state.js';
import { TOWN } from '../../world/townMap.js';
import { LANG, tr, fill, WORDS } from '../config.js';
import { SECRETS, rhymeFor } from './registry.js';
import { SECRET_ART } from './art.js';
import { PAINTINGS, openPainting } from './paintings.js';
import { REWARDS } from '../obstacles/kinds.js';
import { lockSection } from '../riddles/journal.js';

const INK = '#1b1a2b';
const GLYPH = {
  apple: (c) => { c.translate(4, 4); SECRET_ART.apple(c); },
  bottle: (c) => { c.translate(2, 5); SECRET_ART.bottle(c); },
  note: (c) => { c.translate(3, 2); SECRET_ART.note(c); },
  paw: (c) => { rect(c, 5, 7, 5, 4, '#ffd86a'); for (const [x, y] of [[3, 4], [6, 2], [9, 2], [12, 4]]) rect(c, x, y, 2, 2, '#ffd86a'); },
  star: (c) => { rect(c, 6, 2, 2, 10, '#fff1c4'); rect(c, 2, 6, 10, 2, '#fff1c4'); rect(c, 5, 5, 4, 4, '#ffffff'); },
  button: (c) => { ellipse(c, 7, 7, 5, 5, INK); ellipse(c, 7, 7, 4, 4, '#c9a24a'); for (const [x, y] of [[6, 6], [8, 6], [6, 8], [8, 8]]) px(c, x, y, INK); },
  coin: (c) => { ellipse(c, 7, 7, 5, 5, INK); ellipse(c, 7, 7, 4, 4, '#b8a070'); rect(c, 7, 4, 1, 6, '#5a4636'); rect(c, 6, 4, 3, 1, '#5a4636'); },
  well: (c) => { rect(c, 2, 6, 11, 7, INK); rect(c, 3, 7, 9, 5, '#8f8a82'); rect(c, 3, 2, 1, 5, '#5e3e27'); rect(c, 11, 2, 1, 5, '#5e3e27'); rect(c, 2, 1, 11, 2, '#a5483a'); },
  frame: (c) => { rect(c, 1, 2, 13, 11, INK); rect(c, 2, 3, 11, 9, '#c9a24a'); rect(c, 3, 4, 9, 7, '#7fb0c8'); rect(c, 3, 8, 9, 3, '#4f7a45'); },
  lock: (c) => { rect(c, 5, 2, 5, 1, INK); rect(c, 4, 3, 1, 3, INK); rect(c, 10, 3, 1, 3, INK); rect(c, 3, 6, 9, 7, INK); rect(c, 4, 7, 7, 5, '#e0a93a'); rect(c, 7, 8, 1, 2, INK); },
};
const glyphOf = (s) => (s.kind === 'hollow' ? 'button' : s.kind === 'stone' ? 'coin' : SECRETS[s.kind].glyph);

function glyph(name, shadow) {
  const [c, ctx] = makeCanvas(15, 15);
  GLYPH[name](ctx);
  if (shadow) { ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = '#3a3f5a'; ctx.fillRect(0, 0, 15, 15); }
  return c;
}

const CSS = `.jr{flex:1;overflow:auto;padding:20px 18px 60px}.jr-in{max-width:880px;margin:0 auto}
.jr-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;color:#c9cfdd;margin-bottom:14px}.jr-head b{color:#ffcf5a;font-size:22px}
.jr-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
.jr-c{display:flex;gap:12px;border:1px solid #2a3240;border-radius:10px;padding:12px;background:#131821;align-items:flex-start}
.jr-c canvas{width:45px;height:45px;image-rendering:pixelated;flex:none;background:#0e1116;border-radius:6px;padding:4px}
.jr-c h3{margin:0 0 4px;font-size:16px;color:#f1ecd9}.jr-c p{margin:0;font-size:14px;color:#9aa0b6}.jr-c.no h3{color:#6f7789}
.jr-c .rh{font-style:italic;color:#e6dcc0;font-size:14px;margin:4px 0 0}.jr-c button{margin-top:8px;background:#1e2a38;border:1px solid #4fd1c5;color:#4fd1c5;border-radius:8px;min-height:40px;padding:0 14px;font:inherit;cursor:pointer}
.jr-c .tag{display:inline-block;font-size:12px;border:1px solid #e0a93a;color:#e0a93a;border-radius:999px;padding:0 8px;margin-top:6px}`;
let styled = false;

// The page's body: also the Mysteries tab of the menu (mechanics/quest/menu.js), so the discoveries
// live in one place. busy(true/false) is told when a painting opens on top, so keys wait for it.
export function journalBody(plan, busy = () => {}) {
  if (!styled) { document.head.append(h('style', { html: CSS })); styled = true; }
  const found = state.life?.found || {}, list = plan.secrets.filter((s) => s.kind !== 'sealed'), sealed = plan.secrets.filter((s) => s.kind === 'sealed');
  const look = async (id, mark) => { busy(true); await openPainting(id, TOWN, mark); busy(false); };
  const card = (s) => {
    const ok = !!found[s.id], k = SECRETS[s.kind];
    const kids = [h('h3', {}, ok ? tr(k.title) : '?  ?  ?')];
    if (s.kind === 'prints') {
      const n = Object.keys(state.life?.prints || {}).length, lines = rhymeFor(s.prints.length, LANG).slice(0, n);
      kids[0] = h('h3', {}, n ? tr(k.title) : '?  ?  ?');
      kids.push(h('p', {}, `${n} / ${s.prints.length}`), ...lines.map((l) => h('div', { class: 'rh' }, l)));
      if (ok) kids.push(h('button', { type: 'button', onclick: () => look('lanterncat') }, tr(WORDS.look)));
    } else if (ok && s.kind === 'painting') kids.push(h('p', {}, tr(PAINTINGS[s.painting].title)), h('button', { type: 'button', onclick: () => look(s.painting) }, tr(WORDS.look)));
    else if (ok && s.kind === 'note') kids.push(h('p', {}, `"${s.text}"`));
    else kids.push(h('p', {}, ok ? '' : tr(WORDS.unknown)));
    return h('div', { class: `jr-c${ok || (s.kind === 'prints' && Object.keys(state.life?.prints || {}).length) ? '' : ' no'}` }, glyph(glyphOf(s), !ok && !(s.kind === 'prints' && Object.keys(state.life?.prints || {}).length)), h('div', {}, kids));
  };
  const sealedCard = (s) => {
    const ok = !!found[s.id], r = REWARDS[s.prize];
    return h('div', { class: `jr-c${ok ? '' : ' no'}` }, glyph(ok ? 'star' : 'lock', false), h('div', {}, h('h3', {}, ok ? tr(r.title) : tr(SECRETS.sealed.title)), h('p', {}, ok ? tr(r.text) : tr(WORDS.sealedNote)), ok ? null : h('span', { class: 'tag' }, tr(WORDS.sealed))));
  };
  const n = list.filter((s) => found[s.id]).length;
  return h('div', { class: 'jr-in' },
    h('div', { class: 'jr-head' }, h('span', {}, tr(WORDS.intro)), h('b', {}, fill(tr(WORDS.count), { n, m: list.length }))),
    h('div', { class: 'jr-grid' }, list.map(card), sealed.map(sealedCard)), lockSection());
}

export function openJournal(plan) {
  const { root, close } = overlay(tr(WORDS.journal), '');
  let busy = false;
  const body = h('div', { class: 'jr', tabindex: '0' }, journalBody(plan, (b) => { busy = b; }));
  root.append(body);
  body.focus();
  root.dataset.ready = '1';
  return new Promise((resolve) => {
    const done = () => { window.removeEventListener('keydown', key, true); root.remove(); resolve(); };
    const key = (e) => { if (busy) return; if (e.key === 'Escape' || e.key === 'j' || e.key === 'J') { e.preventDefault(); done(); } };
    window.addEventListener('keydown', key, true);
    close.onclick = done;
  });
}
