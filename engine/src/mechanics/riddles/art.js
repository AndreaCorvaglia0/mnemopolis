// Art of locks, drawn in code: the first-person close-ups (one painter per kind, 160 x 120 pixels,
// shown large and sharp) and the small marks above a lock or a locked staircase in a room.
//   ART[kind] = { w, h, paint(ctx, s), spots }   s: the animation state (closeup.js)
//     s = { t: seconds, open: 0..1 (the lock opening), shake: px, motes: bool, ... per kind }
//   spots: where the HTML on top goes, in art pixels: the sticky note, the display, the screen
// Light comes from one lamp at the upper left; the room around is dim; a little dust floats.
import { makeCanvas, rect, px, ellipse, mix, hash, addTex } from '../../art/px.js';

const INK = '#0d0b14';
export const AW = 160, AH = 120;

// static layers are drawn once and kept (the close-ups redraw every frame)
const memo = new Map();
function cached(key, w, h, draw) {
  let c = memo.get(key);
  if (!c) { const [cv, cx] = makeCanvas(w, h); draw(cx); memo.set(key, (c = cv)); }
  return c;
}
function room(ctx, wall, floorY) { ctx.drawImage(cached(`room:${wall}:${floorY}`, AW, AH, (c) => roomOnce(c, wall, floorY)), 0, 0); }
function roomOnce(ctx, wall, floorY) { // a dim wall, a floor, the lamp's light from the upper left
  for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) {
    const d = Math.hypot(x - 18, y - 6) / 170, lit = Math.max(0, 0.55 - d);
    let c = y < floorY ? wall : '#17121c';
    if (y < floorY && x % 12 === 0) c = mix(wall, INK, 0.25);
    if (y >= floorY && (y - floorY) % 5 === 4) c = '#110d16';
    px(ctx, x, y, lit > 0.02 ? mix(c, '#ffd9a0', lit * 0.45) : c);
  }
  rect(ctx, 0, floorY - 1, AW, 1, INK);
}
function vignette(ctx) { ctx.drawImage(cached('vignette', AW, AH, vignetteOnce), 0, 0); }
function vignetteOnce(ctx) { // darker towards the edges: the lamp does not reach the corners
  for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) {
    const dx = (x - AW / 2) / (AW / 2), dy = (y - AH / 2) / (AH / 2), e = Math.sqrt(dx * dx * 0.8 + dy * dy * 0.9);
    if (e < 0.62) continue;
    ctx.fillStyle = INK; ctx.globalAlpha = Math.min(0.78, (e - 0.62) * 1.1); ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
}
function dust(ctx, t) {
  for (let i = 0; i < 14; i++) {
    const x = (hash(i, 1, 9) * AW + t * (3 + hash(i, 2, 9) * 4)) % AW, y = (hash(i, 3, 9) * AH + Math.sin(t * 0.7 + i) * 4 + t * 1.5) % AH;
    const a = Math.hypot(x - 18, y - 6) < 120 ? '#f3e2b8' : '#6e6578';
    px(ctx, Math.floor(x), Math.floor(y), a);
  }
}
function glowAt(ctx, cx, cy, r, col, a) { // a soft light, drawn on the pixel grid
  if (a <= 0.005) return;
  cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
  const g = cached(`glow:${r}:${col}`, 2 * r, 2 * r, (c) => {
    for (let y = 0; y < 2 * r; y++) for (let x = 0; x < 2 * r; x++) { const d = Math.hypot(x - r, y - r) / r; if (d >= 1) continue; c.fillStyle = col; c.globalAlpha = (1 - d) * (1 - d); c.fillRect(x, y, 1, 1); }
  });
  ctx.globalAlpha = Math.min(1, a); ctx.drawImage(g, cx - r, cy - r); ctx.globalAlpha = 1;
}
const steel = (ctx, x, y, w, h, base) => { rect(ctx, x, y, w, h, INK); rect(ctx, x + 1, y + 1, w - 2, h - 2, base); rect(ctx, x + 1, y + 1, w - 2, 1, mix(base, '#ffffff', 0.35)); rect(ctx, x + 1, y + 1, 1, h - 2, mix(base, '#ffffff', 0.2)); rect(ctx, x + 1, y + h - 2, w - 2, 1, mix(base, INK, 0.4)); };
function paper(ctx, x, y, w, h, glow) {
  if (glow) glowAt(ctx, x + w / 2, y + h / 2, Math.max(w, h), '#fff1c4', 0.5);
  rect(ctx, x, y, w, h, INK); rect(ctx, x + 1, y + 1, w - 2, h - 2, '#efe6cf');
  for (let j = 0; j < Math.floor((h - 6) / 3); j++) rect(ctx, x + 3, y + 4 + j * 3, w - 6 - ((j * 7) % 5), 1, '#9b9078');
}

// ---- the safe: steel door, brass dial, a small display, a three-spoke handle; it swings open
function paintSafe(ctx, s) {
  room(ctx, '#2a2233', 104);
  const o = s.open || 0, sh = Math.round(s.shake || 0);
  // the body and, behind the door, the inside (seen as the door swings)
  steel(ctx, 20, 8, 120, 102, '#3b424d');
  rect(ctx, 26, 14, 108, 90, '#0e0c14');
  glowAt(ctx, 80, 62, 40, '#ffcf5a', 0.25 * o);
  if (o > 0.15) { rect(ctx, 32, 82, 96, 2, '#2d2a36'); paper(ctx, 60, 58, 30, 22, o > 0.6); }
  // the door: full width when shut, narrowing towards the hinge as it opens
  const dw = Math.max(6, Math.round(108 * (1 - o * 0.92))), x0 = 26 + sh;
  steel(ctx, x0, 14, dw, 90, '#56606d');
  if (dw > 40) {
    const k = dw / 108;
    rect(ctx, x0 + 4, 18, dw - 8, 82, '#4b5460'); rect(ctx, x0 + 4, 18, dw - 8, 1, '#6f7a87');
    for (let i = 0; i < 6; i++) { px(ctx, x0 + 7 + Math.round(i * (dw - 14) / 5), 21, '#8b96a3'); px(ctx, x0 + 7 + Math.round(i * (dw - 14) / 5), 96, '#8b96a3'); }
    // the display
    const dx = x0 + Math.round(18 * k), dwid = Math.round(60 * k);
    rect(ctx, dx, 24, dwid, 14, INK); rect(ctx, dx + 1, 25, dwid - 2, 12, s.err ? '#3a0f10' : o > 0 ? '#0e2a12' : '#0a1f12');
    glowAt(ctx, dx + dwid / 2, 31, 18, s.err ? '#ff5a4f' : '#7dff8a', 0.18);
    // the dial
    const cx = x0 + Math.round(40 * k), cy = 66, r = Math.max(6, Math.round(17 * k));
    ellipse(ctx, cx, cy, r + 2, r + 2, INK); ellipse(ctx, cx, cy, r + 1, r + 1, '#8a6a2a'); ellipse(ctx, cx, cy, r, r, '#c9a24a'); ellipse(ctx, cx - 2, cy - 2, r - 5, r - 5, '#dcb862');
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + (s.dial || 0); px(ctx, Math.round(cx + Math.cos(a) * (r - 2)), Math.round(cy + Math.sin(a) * (r - 2)), INK); }
    ellipse(ctx, cx, cy, 3, 3, INK); ellipse(ctx, cx, cy, 2, 2, '#8a6a2a');
    // the handle: three spokes that turn when it opens
    const hx = x0 + Math.round(84 * k), hy = 66, hr = Math.max(5, Math.round(13 * k)), ang = (s.turn || 0) * Math.PI;
    for (let i = 0; i < 3; i++) { const a = ang + (i / 3) * Math.PI * 2 - Math.PI / 2; for (let j = 2; j <= hr; j++) { const X = Math.round(hx + Math.cos(a) * j), Y = Math.round(hy + Math.sin(a) * j); rect(ctx, X - 1, Y - 1, 3, 3, INK); px(ctx, X, Y, '#c9cfd8'); } ellipse(ctx, Math.round(hx + Math.cos(a) * hr), Math.round(hy + Math.sin(a) * hr), 2, 2, '#e8ecf0'); }
    ellipse(ctx, hx, hy, 4, 4, INK); ellipse(ctx, hx, hy, 3, 3, '#8b96a3');
    // the lock's maker, worn
    rect(ctx, x0 + Math.round(30 * k), 92, Math.round(48 * k), 4, '#3d4450');
  }
  rect(ctx, x0 - 1, 22, 2, 8, INK); rect(ctx, x0 - 1, 84, 2, 8, INK); // hinges
  rect(ctx, 28, 110, 12, 4, INK); rect(ctx, 120, 110, 12, 4, INK); // feet
  if (s.motes !== false) dust(ctx, s.t || 0);
  vignette(ctx);
}

// ---- the computer: a monitor in a dim room, the screen's glow, a keyboard; it unlocks to a file
function paintComputer(ctx, s) {
  room(ctx, '#1e1b2a', 100);
  const sh = Math.round(s.shake || 0), o = s.open || 0;
  rect(ctx, 0, 100, AW, 20, '#3a2c24'); rect(ctx, 0, 100, AW, 2, '#5a4636'); // the desk
  glowAt(ctx, 80 + sh, 48, 70, s.err ? '#ff5a4f' : '#4fd1c5', 0.22);
  // monitor
  const X = 24 + sh;
  rect(ctx, X + 44, 90, 24, 8, INK); rect(ctx, X + 46, 90, 20, 7, '#a9a294'); rect(ctx, X + 34, 97, 44, 4, INK); rect(ctx, X + 35, 97, 42, 3, '#bdb6a6');
  rect(ctx, X, 6, 112, 86, INK); rect(ctx, X + 1, 7, 110, 84, '#c9c2b1'); rect(ctx, X + 1, 7, 110, 2, '#e3ddcf'); rect(ctx, X + 1, 88, 110, 3, '#a39c8c');
  rect(ctx, X + 8, 13, 96, 70, INK);
  for (let y = 14; y < 82; y++) for (let x = X + 9; x < X + 103; x++) {
    const cx = (x - X - 56) / 47, cy = (y - 48) / 34, d = cx * cx + cy * cy;
    let c = s.err ? '#1d0b0d' : o > 0.5 ? '#0d2e2c' : '#06191a';
    if (y % 2 === 0) c = mix(c, INK, 0.25);
    if (d > 0.82) c = mix(c, INK, 0.5);
    px(ctx, x, y, c);
  }
  if (o > 0.5) { // the desktop with one file
    rect(ctx, X + 46, 36, 18, 22, INK); rect(ctx, X + 47, 37, 16, 20, '#e9f6f3'); rect(ctx, X + 57, 37, 6, 6, '#9fd9d0');
    for (let j = 0; j < 4; j++) rect(ctx, X + 49, 45 + j * 3, 10, 1, '#4fa79b');
    glowAt(ctx, X + 55, 47, 22, '#bff8f2', 0.25);
  }
  rect(ctx, X + 98, 85, 4, 2, s.err ? '#ff5a4f' : '#7dff8a'); // power light
  rect(ctx, 30, 106, 100, 12, INK); rect(ctx, 31, 107, 98, 10, '#b8b1a1'); // keyboard
  for (let r = 0; r < 2; r++) for (let k = 0; k < 14; k++) rect(ctx, 33 + k * 7, 108 + r * 4, 5, 3, '#d6d0c2');
  // a mug and a pen, for life
  rect(ctx, 138, 92, 10, 12, INK); rect(ctx, 139, 93, 8, 10, '#7a3b3b'); rect(ctx, 147, 95, 3, 5, INK); rect(ctx, 6, 104, 16, 2, '#2d4a8a');
  if (s.motes !== false) dust(ctx, s.t || 0);
  vignette(ctx);
}

// ---- the door: planks, iron bands, a sliding hatch with eyes behind it; bolts, then it opens
function paintDoor(ctx, s) {
  room(ctx, '#2b2420', 112);
  const sh = Math.round(s.shake || 0), o = s.open || 0, hatch = s.hatch ?? 1;
  // stone frame
  for (let y = 0; y < 112; y++) for (let x = 18; x < 142; x++) { if (x > 28 && x < 132 && y > 6) continue; const c = hash(x >> 3, y >> 2, 4) > 0.5 ? '#4a4248' : '#3f383e'; px(ctx, x, y, (y % 8 === 0 || ((x + (y >> 3) * 4) % 16 === 0)) ? '#2a2428' : c); }
  // behind the door: a lit room, seen as it opens
  rect(ctx, 29, 7, 103, 105, '#3a2a18'); glowAt(ctx, 80, 50, 60, '#ffcf5a', 0.5 * o);
  if (o > 0.2) paper(ctx, 66, 34, 28, 34, o > 0.6);
  const dw = Math.max(5, Math.round(103 * (1 - o * 0.93))), x0 = 29 + sh;
  rect(ctx, x0, 7, dw, 105, INK);
  for (let i = 0; i < 6; i++) { const pw = dw / 6, x = Math.round(x0 + 1 + i * pw); rect(ctx, x, 8, Math.max(1, Math.round(pw) - 1), 103, i % 2 ? '#6a4a2e' : '#5e4128'); for (let y = 14; y < 108; y += 17) px(ctx, x + 2, y + ((i * 5) % 9), '#4a3220'); }
  if (dw > 50) {
    const k = dw / 103;
    for (const y of [22, 92]) { rect(ctx, x0, y, dw, 5, INK); rect(ctx, x0, y + 1, dw, 3, '#3c3f46'); for (let i = 0; i < 7; i++) px(ctx, x0 + 6 + Math.round(i * (dw - 12) / 6), y + 2, '#9aa3ad'); }
    // the hatch: a slot at eye height, its cover slides sideways
    const hx = x0 + Math.round(30 * k), hw = Math.round(44 * k), hy = 38, hh = 16;
    rect(ctx, hx - 2, hy - 2, hw + 4, hh + 4, INK); rect(ctx, hx - 1, hy - 1, hw + 2, hh + 2, '#2a2d33');
    rect(ctx, hx, hy, hw, hh, '#07060a');
    if (hatch > 0.5 && s.eyes) { // eyes in the dark, blinking now and then
      const blink = s.blink, ey = hy + 8;
      for (const ex of [hx + Math.round(hw * 0.32), hx + Math.round(hw * 0.68)]) {
        if (blink) rect(ctx, ex - 4, ey, 9, 1, '#d9cfb8');
        else { ellipse(ctx, ex, ey, 4, 2, '#e9e1cc'); rect(ctx, ex - 1 + (s.look || 0), ey - 1, 3, 3, '#3b2414'); px(ctx, ex + (s.look || 0), ey - 1, '#ffffff'); }
      }
      if (s.err) { rect(ctx, hx + 6, hy + 4, Math.round(hw * 0.3), 1, '#d9cfb8'); rect(ctx, hx + hw - 6 - Math.round(hw * 0.3), hy + 4, Math.round(hw * 0.3), 1, '#d9cfb8'); }
    }
    const cover = Math.round(hw * (1 - hatch)); // the cover slides over from the right
    if (cover > 0) { rect(ctx, hx + hw - cover, hy, cover, hh, '#5a5f68'); rect(ctx, hx + hw - cover, hy, 1, hh, '#8b929c'); }
    // bolts on the right edge
    for (let i = 0; i < 3; i++) { const by = 32 + i * 26, bx = x0 + dw - 14 + Math.round((s.bolts || 0) * 10); rect(ctx, bx - 1, by - 1, 12, 5, INK); rect(ctx, bx, by, 10, 3, '#9aa3ad'); px(ctx, bx + 2, by, '#e8ecf0'); }
    // ring handle
    ellipse(ctx, x0 + Math.round(16 * k), 66, 5, 5, INK); ellipse(ctx, x0 + Math.round(16 * k), 66, 4, 4, '#c9a24a'); ellipse(ctx, x0 + Math.round(16 * k), 66, 2, 2, '#5e4128');
  }
  // a lantern on the wall beside the door: a bracket, a cage, a flame
  glowAt(ctx, 151, 38, 26, '#ffcf5a', 0.4);
  rect(ctx, 144, 26, 8, 2, INK); rect(ctx, 150, 26, 2, 5, INK);
  rect(ctx, 147, 31, 9, 2, INK); rect(ctx, 147, 44, 9, 2, INK); rect(ctx, 147, 33, 1, 11, INK); rect(ctx, 155, 33, 1, 11, INK); rect(ctx, 151, 33, 1, 11, '#2a2018');
  rect(ctx, 148, 33, 3, 11, '#ffe9a8'); rect(ctx, 152, 33, 3, 11, '#ffd36a'); rect(ctx, 149, 36, 1, 4, '#ffffff'); rect(ctx, 149, 29, 5, 2, INK);
  if (s.motes !== false) dust(ctx, s.t || 0);
  vignette(ctx);
}

// spots, in art pixels: note [x, y, w] (the sticky note), display/screen/hatch [x, y, w, h]
export const ART = {
  safe: { paint: paintSafe, note: [106, 2, 44, 4], display: [44, 24, 60, 14] },
  computer: { paint: paintComputer, note: [112, 2, 42, 5], screen: [34, 15, 92, 66] },
  door: { paint: paintDoor, bubble: [30, 56], hatch: [59, 38, 45, 16] },
};

// The marks over things in a room: a padlock with a question mark (a lock), a key (a locked staircase).
export function lockTextures(scene) {
  if (scene.textures.exists('lock-mark-q')) return;
  const mk = (key, draw) => { const [c, ctx] = makeCanvas(13, 15); draw(ctx); addTex(scene, key, c); };
  mk('lock-mark-q', (c) => {
    rect(c, 3, 0, 7, 1, INK); rect(c, 2, 1, 1, 5, INK); rect(c, 10, 1, 1, 5, INK); rect(c, 3, 1, 1, 4, '#c9cfd8'); rect(c, 9, 1, 1, 4, '#c9cfd8');
    rect(c, 0, 5, 13, 10, INK); rect(c, 1, 6, 11, 8, '#ffcf5a'); rect(c, 1, 6, 11, 1, '#fff1c4');
    rect(c, 5, 7, 3, 1, INK); rect(c, 7, 8, 1, 2, INK); rect(c, 6, 10, 1, 1, INK); rect(c, 6, 12, 1, 1, INK); // ?
  });
  mk('lock-mark-key', (c) => {
    ellipse(c, 4, 4, 4, 4, INK); ellipse(c, 4, 4, 3, 3, '#ffcf5a'); rect(c, 3, 3, 2, 2, INK);
    rect(c, 7, 3, 6, 3, INK); rect(c, 7, 4, 6, 1, '#ffcf5a'); rect(c, 10, 6, 1, 2, INK); rect(c, 12, 6, 1, 3, INK);
    rect(c, 2, 10, 9, 5, INK); rect(c, 3, 11, 7, 3, '#e05a4f'); rect(c, 5, 12, 3, 1, '#ffffff'); // a "no" tag
  });
}
