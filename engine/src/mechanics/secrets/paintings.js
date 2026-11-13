// Original paintings, drawn in code at 64 x 48 pixels, and the viewer that shows one in large.
// None copies a real artwork: a landscape, a cat's portrait, a still life, an old map of this very
// town, a night sky (with a constellation shaped like a cat), and the lantern cat's portrait.
import { makeCanvas, rect, px, ellipse, mix, hash } from '../../art/px.js';
import { h } from '../../lab/shell.js';
import { tr, WORDS } from '../config.js';

const INK = '#1b1a2b', W = 64, H = 48;
const grad = (ctx, y0, y1, a, b) => { for (let y = y0; y < y1; y++) rect(ctx, 0, y, W, 1, mix(a, b, (y - y0) / Math.max(1, y1 - y0 - 1))); };

export const PAINTINGS = {
  landscape: { title: { en: 'Evening over the hills', it: 'Sera sulle colline' }, paint(ctx) {
    grad(ctx, 0, 30, '#f3b46a', '#e7d2a0');
    ellipse(ctx, 46, 20, 6, 6, '#fff1c4');
    for (let x = 0; x < W; x++) { const y1 = 24 + Math.round(Math.sin(x / 9) * 4), y2 = 31 + Math.round(Math.sin(x / 6 + 2) * 3); rect(ctx, x, y1, 1, H - y1, '#7a8a6a'); rect(ctx, x, y2, 1, H - y2, '#4f7a45'); }
    for (let y = 34; y < H; y++) { const cx = 30 + Math.round(Math.sin(y / 3) * 4) + (y - 34); rect(ctx, cx - 1 - (y - 34) / 4, y, 3 + (y - 34) / 2, 1, '#7fb0c8'); }
    rect(ctx, 12, 31, 6, 4, '#e8dcc0'); rect(ctx, 11, 29, 8, 2, '#a5483a'); px(ctx, 14, 33, '#ffd86a');
    for (const [x, y] of [[52, 34], [56, 36], [8, 40]]) { rect(ctx, x, y - 4, 1, 4, '#3a2b1d'); ellipse(ctx, x, y - 6, 2, 3, '#2c5a30'); }
  } },
  catportrait: { title: { en: 'Portrait of a distinguished cat', it: 'Ritratto di un gatto distinto' }, paint(ctx) {
    grad(ctx, 0, H, '#2f4a3a', '#1c2a24');
    ellipse(ctx, 32, 50, 22, 16, '#3a2b5a'); ellipse(ctx, 32, 36, 14, 4, '#f3efe4'); for (let x = 20; x < 45; x += 3) px(ctx, x, 37, '#cfc6b0');
    ellipse(ctx, 32, 24, 13, 12, '#c98a4b');
    for (const s of [-1, 1]) { const x = 32 + s * 9; for (let k = 0; k < 8; k++) rect(ctx, x - (s > 0 ? k / 2 : 0) - 1, 8 + k, Math.max(1, 6 - k * 0.7), 1, '#c98a4b'); px(ctx, x, 12, '#e58a8a'); }
    ellipse(ctx, 32, 28, 7, 5, '#e8b57c');
    for (const s of [-1, 1]) { ellipse(ctx, 32 + s * 5, 21, 2, 2, '#d8e86a'); rect(ctx, 32 + s * 5, 20, 1, 3, INK); }
    rect(ctx, 31, 26, 3, 2, '#e58a8a'); rect(ctx, 32, 28, 1, 2, INK); rect(ctx, 30, 30, 5, 1, INK);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) rect(ctx, s < 0 ? 18 : 38, 27 + k * 2, 8, 1, '#f3efe4');
    rect(ctx, 22, 15, 3, 1, '#9a6234'); rect(ctx, 39, 15, 3, 1, '#9a6234'); rect(ctx, 31, 13, 2, 4, '#9a6234');
  } },
  stilllife: { title: { en: 'Still life with a jug', it: 'Natura morta con brocca' }, paint(ctx) {
    grad(ctx, 0, 30, '#5a4636', '#3a2b22'); rect(ctx, 0, 30, W, 18, '#7a5230'); rect(ctx, 0, 30, W, 2, '#a5714a');
    rect(ctx, 6, 28, 40, 10, '#e8e2d0'); for (let x = 8; x < 46; x += 6) rect(ctx, x, 34, 3, 4, '#cfc6b0');
    ellipse(ctx, 20, 20, 8, 10, INK); ellipse(ctx, 20, 20, 7, 9, '#4f7fa8'); ellipse(ctx, 17, 16, 2, 4, '#9fc4e0'); rect(ctx, 16, 8, 8, 4, '#4f7fa8'); rect(ctx, 27, 15, 3, 8, '#4f7fa8');
    for (const [x, y, c] of [[36, 26, '#d9443a'], [43, 27, '#e0a43a'], [39, 22, '#d9443a']]) { ellipse(ctx, x, y, 4, 4, INK); ellipse(ctx, x, y, 3, 3, c); px(ctx, x - 1, y - 2, '#ffffff'); }
    ellipse(ctx, 52, 25, 3, 5, INK); ellipse(ctx, 52, 25, 2, 4, '#a8c050'); rect(ctx, 52, 19, 1, 2, '#5e3e27');
  } },
  townmap: { title: { en: 'An old map of this town', it: 'Una vecchia mappa di questo paese' }, paint(ctx, town, mark) {
    rect(ctx, 0, 0, W, H, '#e9dcb8');
    if (town) {
      const sx = town.W / (W - 6), sy = town.H / (H - 6), s = Math.max(sx, sy);
      for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
        const tx = Math.floor((x - 3) * s), ty = Math.floor((y - 3) * s), ch = town.TERRAIN[ty]?.[tx];
        const col = { '~': '#8fb8c8', T: '#8a9a6a', p: '#c9a87a', c: '#b8a07a', w: '#8a6a48', R: '#9a8a7a', r: '#c8b898', G: '#a8b880' }[ch];
        if (col) px(ctx, x, y, col);
      }
      for (const b of town.BUILDINGS) rect(ctx, 3 + Math.floor(b.x / s), 3 + Math.floor(b.y / s), Math.max(2, Math.round(b.w / s)), Math.max(2, Math.round(b.h / s)), '#7a3b2a');
      if (mark) { const x = 3 + Math.floor(mark[0] / s), y = 3 + Math.floor(mark[1] / s); for (let k = -2; k <= 2; k++) { px(ctx, x + k, y + k, '#c0302a'); px(ctx, x + k, y - k, '#c0302a'); } }
    }
    for (let k = 0; k < W; k += 2) { px(ctx, k, 1, '#a8916a'); px(ctx, k, H - 2, '#a8916a'); }
    rect(ctx, 54, 4, 1, 6, '#5a4636'); rect(ctx, 52, 6, 5, 1, '#5a4636'); px(ctx, 54, 3, '#c0302a');
  } },
  nightsky: { title: { en: 'The night the cat appeared', it: 'La notte in cui apparve il gatto' }, paint(ctx) {
    grad(ctx, 0, H, '#0b1030', '#2a2a5a');
    for (let k = 0; k < 70; k++) px(ctx, Math.floor(hash(k, 3, 9) * W), Math.floor(hash(k, 5, 9) * 38), k % 7 ? '#9fb3d9' : '#ffffff');
    ellipse(ctx, 52, 9, 5, 5, '#fff1c4'); ellipse(ctx, 54, 8, 4, 4, '#14183a');
    const stars = [[14, 18], [17, 12], [20, 16], [24, 12], [26, 18], [24, 25], [16, 25], [30, 27], [34, 22]];
    for (let i = 0; i < stars.length - 1; i++) { const [a, b] = stars[i], [c, d] = stars[i + 1]; for (let t = 0; t <= 1; t += 0.1) px(ctx, Math.round(a + (c - a) * t), Math.round(b + (d - b) * t), '#4a5a9a'); }
    for (const [x, y] of stars) { rect(ctx, x - 1, y, 3, 1, '#ffe9a0'); rect(ctx, x, y - 1, 1, 3, '#ffe9a0'); }
    for (let x = 0; x < W; x++) { const y = 40 + (Math.floor(x / 9) % 3) * 2; rect(ctx, x, y, 1, H - y, '#05060f'); }
    for (const x of [6, 23, 47]) px(ctx, x, 43, '#ffd86a');
  } },
  lanterncat: { title: { en: 'The lantern cat', it: 'Il gatto con la lanterna' }, paint(ctx) {
    grad(ctx, 0, H, '#141836', '#2a2246');
    ellipse(ctx, 40, 30, 16, 14, '#3a3050'); ellipse(ctx, 40, 30, 10, 9, '#5a4a50'); ellipse(ctx, 40, 31, 5, 5, '#a08050');
    ellipse(ctx, 24, 32, 10, 12, '#4b4a63'); ellipse(ctx, 24, 18, 8, 7, '#4b4a63');
    for (const s of [-1, 1]) { rect(ctx, 24 + s * 5 - 1, 9, 3, 4, '#4b4a63'); px(ctx, 24 + s * 5, 8, '#4b4a63'); ellipse(ctx, 24 + s * 3, 18, 1, 2, '#ffd86a'); }
    px(ctx, 24, 21, '#e58a8a'); ellipse(ctx, 24, 34, 5, 6, '#6d6b8c');
    rect(ctx, 33, 21, 1, 7, INK); box2(ctx, 37, 26, 7, 9); rect(ctx, 30, 20, 8, 1, INK);
    rect(ctx, 6, 42, 40, 3, '#302f42'); for (let x = 8; x < 34; x += 6) px(ctx, x, 43, '#6d6b8c');
  } },
};
function box2(ctx, x, y, w, h) { rect(ctx, x, y, w, h, INK); rect(ctx, x + 1, y + 1, w - 2, h - 2, '#ffd86a'); rect(ctx, x + 1, y + 1, 2, 2, '#fff6c8'); }

export function paintingCanvas(id, town = null, mark = null) {
  const [c, ctx] = makeCanvas(W, H);
  PAINTINGS[id].paint(ctx, town, mark);
  return c;
}

const CSS = `.lf-bg{position:fixed;inset:0;z-index:30;background:rgba(8,6,4,.8);display:grid;place-items:center;padding:16px;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#efe6d2}
.lf-frame{background:#5e3e27;padding:14px;border:3px solid #1b1a2b;box-shadow:inset 0 0 0 3px #c9a24a,0 20px 60px #000;border-radius:4px}
.lf-frame canvas{display:block;width:min(560px,82vw);image-rendering:pixelated;border:2px solid #1b1a2b}
.lf-cap{text-align:center;margin-top:12px;font-style:italic;color:#e9e2c9}
.lf-x{position:fixed;top:12px;right:12px;min-width:44px;height:44px;border-radius:8px;border:1px solid #8a6a3a;background:#2a2118;color:#efe6d2;font:inherit;cursor:pointer;padding:0 12px}`;
let styled = false;
// Resolves when closed (Esc, Space, Enter, a tap outside, or Close).
export function openPainting(id, town = null, mark = null) {
  if (!styled) { document.head.append(h('style', { html: CSS })); styled = true; }
  const cv = paintingCanvas(id, town, mark);
  const close = h('button', { type: 'button', class: 'lf-x', 'aria-label': tr(WORDS.close) }, `✕  ${tr(WORDS.close)}`);
  const bg = h('div', { class: 'lf-bg', role: 'dialog', 'aria-label': tr(PAINTINGS[id].title) }, h('div', {}, h('div', { class: 'lf-frame' }, cv), h('div', { class: 'lf-cap' }, tr(PAINTINGS[id].title))), close);
  document.body.append(bg);
  return new Promise((resolve) => {
    const done = () => { window.removeEventListener('keydown', key, true); bg.remove(); resolve(); };
    const key = (e) => { if (['Escape', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); done(); } };
    window.addEventListener('keydown', key, true);
    close.onclick = done;
    bg.addEventListener('pointerdown', (e) => { if (e.target === bg) done(); });
  });
}
