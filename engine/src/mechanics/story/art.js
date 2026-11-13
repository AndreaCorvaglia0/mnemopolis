// The story's pictures, drawn in code in the game's pixel style (docs/STORY.md): the steamship (with a
// lit layer for its windows), the lighthouse that stands where the League hall stood, rain, the
// notebook on the quay, the hooded keeper (the player's own sheet, under a hood), smoke.
// Browser only (canvases).
import { makeCanvas, rect, px, ellipse, mix, hash, addTex, addSheet } from '../../art/px.js';
import { P } from '../../art/palette.js';

const INK = P.ink;

// ---------------------------------------------------------------- the steamship
// Side view, bow to the right, about 1910: a long black hull with a red waterline, two decks of
// white superstructure, a bridge, two raked buff funnels with black tops, two masts with rigging,
// lifeboats. 176 x 112 pixels; the waterline is the bottom row of the hull (y = 104).
export const SHIP_W = 176, SHIP_H = 112, SHIP_WATER = 104;
export const FUNNELS = [[73, 14], [99, 14]]; // funnel tops, for the smoke

export function paintShip() {
  const W = SHIP_W, H = SHIP_H, [c, g] = makeCanvas(W, H), [l, lit] = makeCanvas(W, H);
  const wl = SHIP_WATER;
  // the hull: a sheer line rising to the bow, a raked stem, a rounded counter stern
  const deck = (x) => 74 - Math.round(Math.max(0, x - 120) * 0.12) - Math.round(Math.max(0, 40 - x) * 0.06);
  const stemX = (y) => 168 - Math.round((wl - y) * 0.28); // the bow leans forward as it rises
  const sternX = (y) => 10 + Math.round(((y - 80) / 24) ** 2 * 10);
  for (let y = 64; y <= wl; y++) for (let x = 6; x <= 172; x++) {
    if (y < deck(x) || x > stemX(y) || x < sternX(y)) continue;
    let col = y >= wl - 4 ? '#7a2a24' : y >= wl - 6 ? '#5a1f1b' : '#1f1d28';
    if (y === deck(x)) col = '#3a3646';
    if (x === stemX(y) || x === sternX(y)) col = INK;
    if (y < wl - 6 && hash(x >> 2, y >> 1, 41) > 0.93) col = '#262433';
    px(g, x, y, col);
  }
  rect(g, 12, wl, 158, 1, INK);
  // portholes along the hull, lit from inside
  for (let x = 24; x < 160; x += 7) { const y = 86; rect(g, x, y, 2, 2, '#3b4256'); rect(lit, x, y, 2, 2, P.windowLit); }
  // the white superstructure
  rect(g, 36, 62, 104, 12, '#d9d4c7'); rect(g, 36, 62, 104, 1, '#f2efe6'); rect(g, 36, 73, 104, 1, '#a49e90');
  rect(g, 50, 52, 76, 10, '#e4e0d4'); rect(g, 50, 52, 76, 1, '#f6f3ea'); rect(g, 50, 61, 76, 1, '#a49e90');
  for (let x = 40; x < 136; x += 6) { rect(g, x, 66, 3, 3, '#2f3a50'); rect(lit, x, 66, 3, 3, P.windowLit); }
  for (let x = 54; x < 122; x += 5) { rect(g, x, 55, 2, 3, '#2f3a50'); if (hash(x, 3, 7) > 0.25) rect(lit, x, 55, 2, 3, P.windowLitHot); }
  // the bridge, forward
  rect(g, 112, 42, 18, 10, '#ebe7dc'); rect(g, 112, 42, 18, 1, '#ffffff'); rect(g, 110, 41, 22, 1, '#8c8679');
  for (let x = 114; x < 129; x += 4) { rect(g, x, 45, 3, 3, '#2f3a50'); rect(lit, x, 45, 3, 3, P.windowLit); }
  // railings
  for (let x = 36; x < 140; x += 3) px(g, x, 61, '#8c8679');
  for (let x = 140; x < 166; x += 3) { px(g, x, deck(x) - 2, '#8c8679'); }
  rect(g, 140, deck(150) - 3, 26, 1, '#8c8679');
  // lifeboats on davits
  for (const x of [56, 76, 96]) { ellipse(g, x + 6, 50, 7, 2, '#f3f0e8'); rect(g, x, 50, 13, 1, '#a49e90'); rect(g, x - 1, 46, 1, 6, '#6e6a62'); rect(g, x + 13, 46, 1, 6, '#6e6a62'); }
  // two funnels, raked aft, buff with black tops
  for (const [fx] of FUNNELS) {
    for (let y = 14; y <= 52; y++) {
      const lean = Math.round((52 - y) * 0.12), x0 = fx - 6 - lean, x1 = fx + 6 - lean;
      for (let x = x0; x <= x1; x++) {
        const u = (x - x0) / (x1 - x0);
        let col = y < 22 ? (u < 0.3 ? '#2b2933' : '#16151d') : u < 0.25 ? '#e9b65a' : u > 0.75 ? '#a8792e' : '#d29a3c';
        if (x === x0 || x === x1) col = INK;
        if (y === 22) col = '#5a4420';
        px(g, x, y, col);
      }
    }
    rect(g, fx - 7 - Math.round(38 * 0.12), 14, 15, 1, INK);
  }
  // masts and rigging
  const mast = (x, top) => { rect(g, x, top, 1, 62 - top + 8, '#5d564a'); rect(g, x - 4, top + 8, 9, 1, '#5d564a'); px(lit, x, top - 1, '#fff1c4'); px(g, x, top - 1, '#e9e2c9'); };
  mast(28, 18); mast(150, 12);
  g.strokeStyle = 'rgba(40,36,48,0.85)'; g.lineWidth = 1;
  const line = (a, b, c2, d) => { g.beginPath(); g.moveTo(a + 0.5, b + 0.5); g.lineTo(c2 + 0.5, d + 0.5); g.stroke(); };
  line(28, 18, 8, 76); line(150, 12, 170, 70); line(28, 18, 66, 14); line(150, 12, 104, 16); line(28, 20, 150, 14);
  // the name on the bow (unreadable from here: three pale marks)
  rect(g, 150, 78, 10, 1, '#c9c2b0');
  return { canvas: c, lit: l };
}

// a soft grey puff of smoke (several sizes are made from it by scaling)
export function puff() {
  const [c, g] = makeCanvas(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5) / 7.5 + (hash(x, y, 5) - 0.5) * 0.25;
    if (d < 1) px(g, x, y, d < 0.5 ? '#9a98a6' : d < 0.8 ? '#7d7b8a' : '#62606f');
  }
  return c;
}

// ---------------------------------------------------------------- the lighthouse
// At the League hall's footprint (8 x 5 tiles, the door at the middle of its front), far taller: a
// keeper's cottage across the foot, a banded tower, the gallery and the lantern room, OFF (dark glass)
// until the end: the lit layer holds only the lamp and two small windows.
export function paintLighthouse(b) {
  const W = b.w * 16, foot = b.h * 16, H = foot + 150, [c, g] = makeCanvas(W, H), [l, lit] = makeCanvas(W, H);
  const cx = W / 2, base = H - 1;
  // the cottage: low, two windows, a slate roof
  const cy0 = H - 44;
  rect(g, 6, cy0, W - 12, 44, '#cfc8b8'); rect(g, 6, cy0, W - 12, 1, '#e6e0d2');
  for (let y = cy0 + 4; y < base; y += 5) rect(g, 7, y, W - 14, 1, '#bdb5a3');
  rect(g, 6, cy0, 1, 44, INK); rect(g, W - 7, cy0, 1, 44, INK);
  for (let k = 0; k < 14; k++) rect(g, 2 + k, cy0 - 14 + k, W - 4 - 2 * k, 1, k === 0 ? INK : mix('#4a5160', '#2e3340', k / 14)); // the roof, as a low hip
  for (const wx of [16, W - 28]) { rect(g, wx, cy0 + 14, 12, 12, INK); rect(g, wx + 1, cy0 + 15, 10, 10, '#232a3a'); rect(g, wx + 6, cy0 + 15, 1, 10, '#cfc8b8'); rect(g, wx + 1, cy0 + 20, 10, 1, '#cfc8b8'); rect(lit, wx + 1, cy0 + 15, 10, 10, P.windowLit); rect(lit, wx + 6, cy0 + 15, 1, 10, '#cfc8b8'); }
  // the tower: from the ground to the gallery, narrowing, banded white and dark red
  const top = 38, bot = base, hw = (y) => 12 + Math.round(((y - top) / (bot - top)) * 9);
  for (let y = top; y <= bot; y++) {
    const half = hw(y), band = Math.floor((y - top) / 22) % 2 === 0;
    for (let x = cx - half; x <= cx + half; x++) {
      const u = (x - (cx - half)) / (2 * half);
      let col = band ? (u < 0.28 ? '#f2efe6' : u > 0.7 ? '#b9b3a4' : '#dcd7ca') : (u < 0.28 ? '#b8574c' : u > 0.7 ? '#6e2a24' : '#94392f');
      if (x === cx - half || x === cx + half) col = INK;
      if (hash(x, y >> 1, 23) > 0.96) col = mix(col, '#3a3646', 0.35); // weather
      px(g, Math.round(x), y, col);
    }
  }
  // small windows up the tower (dark; lit at the end)
  for (const y of [70, 104, 138]) { rect(g, cx - 2, y, 4, 6, INK); rect(g, cx - 1, y + 1, 2, 4, '#232a3a'); rect(lit, cx - 1, y + 1, 2, 4, P.windowLit); }
  // the door at the foot of the tower, on the hall's door tiles
  const dw = 14, dx = Math.round(cx - dw / 2), dh = 22;
  rect(g, dx - 1, base - dh - 1, dw + 2, dh + 1, INK); rect(g, dx, base - dh, dw, dh, P.woodDark); rect(g, dx + 1, base - dh + 1, dw - 2, dh - 1, '#5a3a24');
  ellipse(g, cx, base - dh, dw / 2, 3, INK); rect(g, dx + dw - 4, base - 10, 2, 2, '#9a8a6a');
  rect(g, dx - 3, base - 2, dw + 6, 2, '#8d857a');
  // the gallery and the lantern room
  rect(g, cx - 17, top - 4, 34, 5, INK); rect(g, cx - 16, top - 3, 32, 2, P.metal);
  for (let x = cx - 16; x <= cx + 16; x += 3) rect(g, x, top - 10, 1, 6, P.metalDark);
  rect(g, cx - 16, top - 11, 33, 1, P.metalDark);
  rect(g, cx - 9, top - 26, 18, 16, INK); rect(g, cx - 8, top - 25, 16, 14, '#1d2433'); // dark glass: the lamp is off
  for (let x = cx - 4; x < cx + 8; x += 4) rect(g, x, top - 25, 1, 14, P.metalDark);
  rect(g, cx - 3, top - 21, 6, 6, '#2d3445'); // the dead lamp
  rect(lit, cx - 8, top - 25, 16, 14, '#fff3c8'); rect(lit, cx - 3, top - 21, 6, 6, '#ffffff');
  ellipse(g, cx, top - 28, 11, 4, INK); ellipse(g, cx, top - 28, 10, 3, '#3a3f4e'); ellipse(g, cx, top - 29, 6, 2, '#4d5466');
  rect(g, cx, top - 38, 1, 8, P.metalDark); rect(g, cx - 3, top - 36, 7, 1, P.metalDark); // the vane
  return { canvas: c, lit: l, glows: [], lamp: [cx, top - 18] };
}

// ---------------------------------------------------------------- rain
// A tile of falling streaks (drawn once); the town scrolls two of them at different speeds.
export function rainTile(seed = 1, n = 22, len = [5, 9], a = 0.55) {
  const S = 64, [c, g] = makeCanvas(S, S);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(hash(i, 1, seed) * S), y = Math.floor(hash(i, 2, seed) * S), L = len[0] + Math.floor(hash(i, 3, seed) * (len[1] - len[0]));
    for (let k = 0; k < L; k++) { const X = (x - Math.floor(k / 3) + S) % S, Y = (y + k) % S; g.fillStyle = `rgba(190,205,235,${(a * (0.5 + k / L / 2)).toFixed(3)})`; g.fillRect(X, Y, 1, 1); }
  }
  return c;
}
// a ring where a drop hits a puddle (two frames)
export function splash() {
  const [c, g] = makeCanvas(14, 5);
  g.fillStyle = 'rgba(200,215,240,0.55)';
  for (const [x, y] of [[1, 2], [2, 1], [3, 3], [4, 2], [9, 2], [10, 1], [11, 3], [12, 2]]) g.fillRect(x, y, 1, 1);
  return c;
}

// ---------------------------------------------------------------- the notebook
export function notebookIcon() {
  const [c, g] = makeCanvas(12, 9);
  rect(g, 0, 1, 12, 8, INK); rect(g, 1, 2, 10, 6, '#5b3b2a'); rect(g, 1, 2, 10, 1, '#7a5238');
  rect(g, 2, 7, 9, 1, '#e8dcc0'); rect(g, 10, 2, 1, 5, '#e8dcc0'); // the edges of the pages
  rect(g, 4, 0, 1, 3, '#b9463b'); // the ribbon
  px(g, 3, 4, '#3e2a1e'); px(g, 7, 5, '#3e2a1e'); // water stains
  return c;
}

// ---------------------------------------------------------------- the keeper
// The player's own sheet under a hood: the clothes go dark, the face falls into shadow, and a hood is
// drawn around the head. At the turn the hood comes down: it was the player's face all along.
export function hoodedSheet(src) {
  const [c, g] = makeCanvas(src.width, src.height);
  g.drawImage(src, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data, W = c.width;
  const at = (x, y) => (y * W + x) * 4;
  const skin = new Set(['243,201,155', '217,166,121']);
  const hood = [36, 32, 46], hoodHi = [52, 47, 64], shadow = [44, 39, 54];
  const mask = new Uint8Array(W * c.height);
  for (let y = 0; y < c.height; y++) for (let x = 0; x < W; x++) {
    const i = at(x, y); if (d[i + 3] < 10) continue;
    mask[y * W + x] = 1;
    const k = `${d[i]},${d[i + 1]},${d[i + 2]}`;
    if (skin.has(k)) { [d[i], d[i + 1], d[i + 2]] = shadow; continue; }
    const lum = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255;
    if (y > 9 && lum > 0.12) { const c2 = lum > 0.45 ? hoodHi : hood; [d[i], d[i + 1], d[i + 2]] = c2; }
    else if (y <= 9 && lum > 0.12) { [d[i], d[i + 1], d[i + 2]] = hood; }
  }
  // the hood: one pixel around the head (the top ten rows of each frame)
  for (let y = 0; y < 11; y++) for (let x = 0; x < W; x++) {
    if (mask[y * W + x]) continue;
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => mask[(y + dy) * W + x + dx] && y + dy < 11);
    if (near) { const i = at(x, y); d[i] = INK_RGB[0]; d[i + 1] = INK_RGB[1]; d[i + 2] = INK_RGB[2]; d[i + 3] = 255; }
  }
  g.putImageData(img, 0, 0);
  return c;
}
const INK_RGB = [27, 26, 43];

// register the story's textures once (Town and the cinematic moments use them)
export function storyTextures(scene) {
  const T = scene.textures;
  if (!T.exists('story-ship')) { const s = paintShip(); addTex(scene, 'story-ship', s.canvas); addTex(scene, 'story-ship-lit', s.lit); }
  if (!T.exists('story-puff')) addTex(scene, 'story-puff', puff());
  if (!T.exists('story-rain-a')) { addTex(scene, 'story-rain-a', rainTile(1, 26, [6, 10], 0.6)); addTex(scene, 'story-rain-b', rainTile(7, 18, [3, 6], 0.35)); }
  if (!T.exists('story-notebook')) addTex(scene, 'story-notebook', notebookIcon());
  if (!T.exists('story-splash')) addTex(scene, 'story-splash', splash());
  if (!T.exists('ch-keeper-hood') && T.exists('ch-player')) {
    const sheet = hoodedSheet(T.get('ch-player').getSourceImage());
    addSheet(scene, 'ch-keeper-hood', sheet, 16, 24);
  }
}
