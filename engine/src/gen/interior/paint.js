// Painting a composed room on a canvas (browser; with a recording context it also runs in Node).
// The background holds walls, floor, rugs, the learning wall and the decorations; furniture is
// drawn piece by piece in furniture.js so the scene can sort it by depth.
// What looks the same in every room on purpose: the lab door with its LAB tag, the reading wall,
// the exit mat, the concept's name, the house number.
import { rect, px, ellipse, hash, mix } from '../../art/px.js';
import { drawText, textWidth } from '../../art/buildings.js';
import { P } from '../../art/palette.js';
import { cellAt, T } from './plans.js';
import { box, lighten, darken } from './furniture.js';

const ink = P.ink;

function floorColour(L, C, x, y) {
  const s = L.floor;
  if (s === 'tile') { const a = lighten(C.lower, 0.55), b = C.lower; if (x % 16 === 0 || y % 16 === 0) return darken(C.lower, 0.12); return ((x >> 4) + (y >> 4)) % 2 ? a : mix(a, b, 0.6); }
  if (s === 'small') { if (x % 8 === 0 || y % 8 === 0) return darken(C.lower, 0.1); return lighten(C.lower, 0.45); }
  if (s === 'wood') { const row = Math.floor(y / 5), off = (row * 23) % 40; if (y % 5 === 4 || (x + off) % 40 === 0) return C.woodD; return mix(C.woodL, C.wood, hash(Math.floor((x + off) / 40), row, 3) * 0.7); }
  if (s === 'parquet') { const bx = x >> 3, by = y >> 3, hz = (bx + by) % 2, k = hz ? y % 8 : x % 8; if (k % 4 === 3) return C.woodD; return mix(C.woodL, C.wood, (hz ? 0.2 : 0.55) + hash(bx, by, 4) * 0.25); }
  if (s === 'marble') { const d = ((x + y) >> 4) + ((x - y + 512) >> 4); if ((x + y) % 16 === 0 || (x - y + 512) % 16 === 0) return C.stoneD; return d % 2 ? lighten(C.stone, 0.62 + hash(x >> 2, y >> 2, 2) * 0.05) : mix(C.stone, C.band, 0.25); }
  if (s === 'stone') { const r0 = Math.floor(y / 11), sh = (r0 % 2) * 6, cell = hash(Math.floor((x + sh) / 13), r0, 5); if (y % 11 === 0 || (x + sh) % 13 === 0) return C.stoneD; return mix(C.stone, C.stoneL, 0.4 + cell * 0.6); }
  if (s === 'flag') { if (x % 16 === 0 || y % 16 === 0) return darken(C.stone, 0.55); return mix(darken(C.stone, 0.35), darken(C.stone, 0.22), hash(x >> 4, y >> 4, 3)); }
  const n = hash(x >> 2, y >> 2, 7); return n > 0.93 ? darken(C.stone, 0.6) : mix(darken(C.stone, 0.42), darken(C.stone, 0.3), hash(x >> 3, y >> 3, 1));
}

function rockAt(C, gx, gy) {
  const n = hash(gx >> 3, (gy + ((gx >> 3) % 2) * 4) >> 3, 11);
  let col = mix(C.wall, C.lower, n * 0.8);
  if ((gy + ((gx >> 3) % 2) * 4) % 8 === 0 && hash(gx >> 1, gy, 2) > 0.3) col = '#2f2c37';
  if (gx % 8 === 0 && hash(gx, gy >> 3, 6) > 0.5) col = '#34313c';
  return col;
}

function paintWallColumn(ctx, L, C, x) {
  const X = x * T, Y = L.top[x] * T, st = L.wallStyle;
  rect(ctx, X, Y, T, 48, C.wall);
  if (st === 'rock') { for (let j = 0; j < 46; j++) for (let i = 0; i < T; i++) px(ctx, X + i, Y + j, rockAt(C, X + i, Y + j)); rect(ctx, X, Y + 46, T, 2, ink); return; }
  if (st === 'stripes') for (let i = 0; i < T; i += 4) rect(ctx, X + i, Y + 3, 2, 27, mix(C.wall, C.band, 0.1));
  if (st === 'tiles') for (let j = 4; j < 30; j += 6) { rect(ctx, X, Y + j, T, 1, darken(C.wall, 0.08)); for (let i = (j / 6) % 2 ? 0 : 4; i < T; i += 8) rect(ctx, X + i, Y + j, 1, 6, darken(C.wall, 0.08)); }
  if (st === 'brick') for (let j = 4; j < 30; j += 5) { rect(ctx, X, Y + j, T, 1, darken(C.wall, 0.12)); for (let i = (j / 5) % 2 ? 2 : 6; i < T; i += 8) rect(ctx, X + i, Y + j, 1, 5, darken(C.wall, 0.12)); }
  if (st === 'blocks') for (let j = 3; j < 30; j += 9) { rect(ctx, X, Y + j, T, 1, darken(C.wall, 0.1)); rect(ctx, X + ((j / 9) % 2 ? 0 : 8), Y + j, 1, 9, darken(C.wall, 0.1)); }
  if (st === 'paper') for (let j = 6; j < 28; j += 7) for (let i = ((j / 7) % 2) * 4 + 2; i < T; i += 8) { px(ctx, X + i, Y + j, mix(C.wall, C.band, 0.35)); px(ctx, X + i, Y + j + 1, mix(C.wall, C.band, 0.2)); }
  if (st === 'attic') { // vertical boards, a knot here and there
    for (let i = 0; i < T; i += 4) { rect(ctx, X + i, Y + 3, 1, 27, darken(C.wall, 0.18)); rect(ctx, X + i + 1, Y + 3, 3, 27, mix(C.wall, C.wood, 0.25 + hash(x, i, 9) * 0.15)); }
    if (hash(x, 7, 4) > 0.6) ellipse(ctx, X + 6, Y + 12 + Math.floor(hash(x, 2, 3) * 10), 1, 1, darken(C.wood, 0.3));
  }
  if (st === 'plaster') for (let k = 0; k < 6; k++) px(ctx, X + Math.floor(hash(x, k, 3) * T), Y + 4 + Math.floor(hash(k, x, 5) * 24), darken(C.wall, 0.05));
  rect(ctx, X, Y, T, 3, C.band);
  if (st === 'panel' || st === 'paper') { rect(ctx, X, Y + 30, T, 16, C.wood); rect(ctx, X, Y + 30, T, 2, C.woodL); rect(ctx, X + 2, Y + 34, 12, 9, C.woodD); rect(ctx, X + 3, Y + 35, 10, 7, mix(C.wood, C.woodL, 0.4)); }
  else { rect(ctx, X, Y + 30, T, 16, C.lower); rect(ctx, X, Y + 30, T, 1, C.band); }
  rect(ctx, X, Y + 29, T, 1, mix(C.wall, C.trim, 0.5));
  rect(ctx, X, Y + 46, T, 2, ink);
}

// Above a back wall that stands lower (alcove, a notch): the wall goes on up, in shade, with a
// cornice and a row of recessed panels, so the room keeps its full height on screen.
function paintUpperWall(ctx, L, C, x) {
  const X = x * T, H = L.top[x] * T;
  if (L.dark) { for (let j = 0; j < H; j++) for (let i = 0; i < T; i++) px(ctx, X + i, j, darken(rockAt(C, X + i, j), 0.25)); return; }
  const c = darken(C.wall, 0.1);
  rect(ctx, X, 0, T, H, c);
  if (L.home) { for (let j = 6; j < H - 4; j += 7) for (let i = ((j / 7) % 2) * 4 + 2; i < T; i += 8) px(ctx, X + i, j, mix(c, C.band, 0.3)); }
  else { rect(ctx, X + 3, 9, 10, H - 13, darken(c, 0.07)); rect(ctx, X + 4, 8, 8, 1, darken(c, 0.07)); rect(ctx, X + 3, 9, 1, H - 13, darken(c, 0.14)); rect(ctx, X + 12, 9, 1, H - 13, lighten(c, 0.1)); }
  rect(ctx, X, 0, T, 3, darken(C.band, 0.15)); rect(ctx, X, 3, T, 1, mix(c, C.trim, 0.45));
  rect(ctx, X, H - 3, T, 2, mix(c, C.wood, 0.6)); rect(ctx, X, H - 1, T, 1, darken(c, 0.25));
}

// In front of a front wall that stands higher (a notch): a small courtyard garden, seen over the
// wall: grass, a tree in the middle, a flower border and stepping stones.
function paintCourtyard(ctx, L, C, x0, x1, y0, y1) {
  const X0 = x0 * T, Y0 = y0 * T, W = (x1 - x0 + 1) * T, H = (y1 - y0 + 1) * T;
  if (L.dark) { for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) px(ctx, X0 + i, Y0 + j, darken(rockAt(C, X0 + i, Y0 + j), 0.3)); return; }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const n = hash((X0 + i) >> 1, (Y0 + j) >> 1, 5); px(ctx, X0 + i, Y0 + j, n > 0.85 ? P.grassLight : n < 0.12 ? P.grassDark : P.grass); }
  for (let i = 4; i < W - 4; i += 4) { px(ctx, X0 + i, Y0 + H - 4, ['#e0574f', '#f2c94c', '#f5f1e6'][(i >> 2) % 3]); px(ctx, X0 + i + 1, Y0 + H - 5, P.grassDark); }
  for (let k = 0; k < Math.floor(W / 14); k++) { const sx = X0 + 6 + k * 14, sy = Y0 + H - 12 - (k % 2) * 3; ellipse(ctx, sx, sy, 3, 2, ink); ellipse(ctx, sx, sy, 2, 1, '#cfc8bb'); }
  const cx = X0 + Math.round(W / 2), cy = Y0 + Math.round(H / 2) - 2, r = Math.min(10, Math.floor(Math.min(W, H) / 3));
  ellipse(ctx, cx + 2, cy + r - 1, r, 3, 'rgba(20,40,20,0.35)');
  rect(ctx, cx - 1, cy, 3, r, ink); rect(ctx, cx, cy, 1, r, C.wood);
  ellipse(ctx, cx, cy - 2, r + 1, r, ink); ellipse(ctx, cx, cy - 2, r, r - 1, P.grassDark); ellipse(ctx, cx - 2, cy - 4, Math.max(2, r - 4), Math.max(2, r - 5), P.grassLight);
  for (const [dx, dy] of [[-3, -5], [3, -1], [0, -7]]) px(ctx, cx + dx, cy + dy, '#f2a03c');
}

// An upper floor under the roof: rafters sloping down at both ends of the back wall, a tie beam,
// posts, and a dimmer light; the stairwell down where the ground floor has its exit mat.
function paintAttic(ctx, L, C) {
  const W = L.w * T, beam = darken(C.wood, 0.25), edge = ink;
  ctx.fillStyle = 'rgba(16,12,24,0.35)'; ctx.fillRect(0, 0, W, 14);
  for (const s of [0, 1]) for (let j = 0; j < 30; j++) { // the slope of the roof in the two upper corners
    const n = 30 - j, x0 = s ? W - n : 0;
    ctx.fillStyle = 'rgba(16,12,24,0.45)'; ctx.fillRect(x0, j, n, 1);
    rect(ctx, s ? W - n - 2 : n, j, 2, 1, beam); px(ctx, s ? W - n - 3 : n + 2, j, edge);
  }
  rect(ctx, 0, 6, W, 3, edge); rect(ctx, 0, 6, W, 2, beam); rect(ctx, 0, 6, W, 1, lighten(beam, 0.2));
  for (let x = 3 * T; x < W - 2 * T; x += 4 * T) { rect(ctx, x - 1, 8, 4, 38, edge); rect(ctx, x, 8, 2, 38, beam); }
}
function stairwell(ctx, mx, my) { // the way down: steps sinking into the floor, a rail on each side
  rect(ctx, mx - 1, my, 18, 16, ink); rect(ctx, mx, my + 1, 16, 15, '#0d0b14');
  for (let k = 0; k < 4; k++) { const y = my + 2 + k * 3; rect(ctx, mx + 1 + k, y, 14 - 2 * k, 2, mix(P.wood, '#0d0b14', 0.25 + k * 0.2)); }
  rect(ctx, mx - 2, my - 6, 2, 22, P.woodDark); rect(ctx, mx + 16, my - 6, 2, 22, P.woodDark); rect(ctx, mx - 2, my - 7, 2, 1, P.gold); rect(ctx, mx + 16, my - 7, 2, 1, P.gold);
}
// upstairs the reading wall is a bookshelf: a short reading list (the concept's "further" links)
function paintShelf(ctx, L, C) {
  const { x0, n, top } = L.board, X = x0 * T + 1, Y = top * T + 6, W = n * T - 2;
  rect(ctx, X, Y, W, 40, ink); rect(ctx, X + 1, Y + 1, W - 2, 39, C.woodD);
  for (let r = 0; r < 3; r++) {
    const sy = Y + 2 + r * 12;
    for (let bx = X + 2, i = 0; bx < X + W - 4; i++) { const bw = 2 + Math.floor(hash(i, r, 5) * 3), bh = 7 + Math.floor(hash(r, i, 6) * 3); rect(ctx, bx, sy + 10 - bh, bw, bh, ['#b9463b', '#3c5ea6', '#2f5d50', '#d9a441', '#6b4fa0', '#e9e2c9'][Math.floor(hash(i, r, 7) * 6)]); bx += bw + (hash(i, r, 8) > 0.8 ? 2 : 0); }
    rect(ctx, X + 1, sy + 10, W - 2, 2, C.wood);
  }
  rect(ctx, X + W - 9, Y + 3, 6, 7, '#fbf8ef'); rect(ctx, X + W - 8, Y + 5, 4, 1, '#8f877a'); // a slip of paper: the list
}

function door(ctx, x, y, label) { // the lab door: the same everywhere
  rect(ctx, x - 1, y - 1, 16, 26, ink);
  rect(ctx, x, y, 14, 25, P.woodDark);
  rect(ctx, x + 1, y + 1, 12, 24, P.wood);
  rect(ctx, x + 6, y + 1, 1, 24, P.woodDark);
  px(ctx, x + 10, y + 13, P.gold);
  const lw = textWidth(label) + 4, lx = x + 7 - Math.ceil(lw / 2); rect(ctx, lx, y - 9, lw, 7, ink); drawText(ctx, label, lx + 2, y - 8, '#ffcf5a');
}

function paintBoard(ctx, L, C, place) { // the reading wall: the same everywhere, only its width follows the room
  const { x0, n, top } = L.board, X = x0 * T + 2, Y = top * T + 5, W = n * T - 4, dark = L.dark;
  rect(ctx, X, Y, W, 26, ink); rect(ctx, X + 1, Y + 1, W - 2, 24, dark ? '#e9dcb8' : '#fbf8ef'); rect(ctx, X + 1, Y + 1, W - 2, 4, dark ? '#8a5a34' : C.band);
  const lw = W - 20;
  for (let k = 0; k < 5; k++) rect(ctx, X + 4, Y + 8 + k * 3, Math.max(6, Math.floor(lw * 0.45) + Math.floor(hash(k, place.order || 1, 8) * lw * 0.5)), 1, '#8f877a');
  rect(ctx, X + W - 14, Y + 8, 12, 10, dark ? '#8a5a34' : C.band); rect(ctx, X + W - 13, Y + 9, 10, 8, '#ffffff');
  const dy = (top + 3) * T + 2;
  rect(ctx, x0 * T, dy, n * T, 12, ink); rect(ctx, x0 * T + 1, dy + 1, n * T - 2, 9, '#cfd4d6'); rect(ctx, x0 * T + 1, dy + 1, n * T - 2, 2, '#e9eeee');
  rect(ctx, x0 * T + 2, dy + 12, 3, 4, P.metalDark); rect(ctx, x0 * T + n * T - 5, dy + 12, 3, 4, P.metalDark);
}

// The concept on the wall. In a dark room it is a light plaque with dark letters, so it can be read.
function paintLabel(ctx, L, C) {
  const lb = L.label, cx = lb.cx, wmax = Math.max(...lb.lines.map(textWidth)), nl = lb.lines.length, hgt = nl * 7 + 4, y = lb.top * T + (nl > 1 ? 2 : 4);
  const bg = L.dark ? '#e9dcb8' : C.band, fg = L.dark ? '#2b2018' : '#ffffff';
  rect(ctx, Math.round(cx - wmax / 2 - 4), y, wmax + 8, hgt, ink);
  rect(ctx, Math.round(cx - wmax / 2 - 3), y + 1, wmax + 6, hgt - 2, bg);
  if (L.dark) rect(ctx, Math.round(cx - wmax / 2 - 3), y + 1, wmax + 6, 1, '#fff6dc');
  lb.lines.forEach((s, i) => drawText(ctx, s, Math.round(cx - textWidth(s) / 2), y + 3 + i * 7, fg));
}

function paintWindow(ctx, X, Y, n) {
  const W = n * T - 6;
  box(ctx, X + 3, Y + 7, W, 22, '#e9e2c9');
  rect(ctx, X + 5, Y + 9, W - 4, 18, '#16213f');
  for (let k = 0; k < 7; k++) px(ctx, X + 6 + Math.floor(hash(X, k, 3) * (W - 6)), Y + 10 + Math.floor(hash(k, Y, 5) * 14), k % 3 ? '#9fb3d9' : '#ffffff');
  rect(ctx, X + 3 + Math.floor(W / 2), Y + 9, 1, 18, '#e9e2c9'); rect(ctx, X + 5, Y + 18, W - 4, 1, '#e9e2c9');
  rect(ctx, X + 1, Y + 29, W + 4, 3, ink); rect(ctx, X + 2, Y + 29, W + 2, 2, '#e9e2c9');
}

const frame = (ctx, X, Y, w, h, inner, C) => { box(ctx, X, Y, w, h, C.woodD); rect(ctx, X + 1, Y + 1, w - 2, 1, C.woodL); rect(ctx, X + 2, Y + 2, w - 4, h - 4, inner); };
// Decorations on the back wall. d: { type, x, n, top }.
export const DECOR = {
  window: (ctx, X, Y, n) => paintWindow(ctx, X, Y, n),
  chart(ctx, X, Y, n, C) { box(ctx, X + 3, Y + 6, n * T - 6, 20, '#fbf8ef'); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) rect(ctx, X + 6 + i * 6, Y + 9 + j * 5, 4, 3, [C.band, '#4fd1c5', C.accent, '#8f877a'][(i + j) % 4]); },
  starchart(ctx, X, Y, n, C) { box(ctx, X + 3, Y + 5, n * T - 6, 22, '#1c2a52'); for (let k = 0; k < 9; k++) px(ctx, X + 5 + Math.floor(hash(k, X, 2) * (n * T - 10)), Y + 7 + Math.floor(hash(X, k, 4) * 18), '#ffffff'); rect(ctx, X + 8, Y + 12, 10, 1, '#5a7ec4'); rect(ctx, X + 17, Y + 12, 1, 8, '#5a7ec4'); ellipse(ctx, X + n * T - 10, Y + 16, 4, 4, '#2c4580'); },
  lightbox(ctx, X, Y, n) { box(ctx, X + 3, Y + 6, n * T - 6, 20, '#d9f4f7'); rect(ctx, X + 6, Y + 9, 10, 14, '#2b3a44'); ellipse(ctx, X + 11, Y + 15, 3, 4, '#a9c6cc'); rect(ctx, X + 19, Y + 9, 8, 14, '#2b3a44'); rect(ctx, X + 22, Y + 11, 2, 10, '#c7dfe3'); },
  portrait(ctx, X, Y, n, C) { box(ctx, X + 3, Y + 7, 10, 13, P.gold); rect(ctx, X + 5, Y + 9, 6, 9, darken(C.band, 0.2)); ellipse(ctx, X + 8, Y + 12, 2, 2, '#f3c99b'); rect(ctx, X + 6, Y + 15, 4, 3, C.wood); },
  clock(ctx, X, Y) { ellipse(ctx, X + 8, Y + 15, 6, 6, ink); ellipse(ctx, X + 8, Y + 15, 5, 5, '#fbf8ef'); rect(ctx, X + 8, Y + 11, 1, 4, ink); rect(ctx, X + 8, Y + 15, 3, 1, ink); },
  banner(ctx, X, Y, n, C) { rect(ctx, X + 2, Y + 4, 12, 1, C.woodD); rect(ctx, X + 3, Y + 5, 10, 22, ink); rect(ctx, X + 4, Y + 5, 8, 20, C.band); for (let i = 0; i < 4; i++) px(ctx, X + 4 + i * 2, Y + 25 + (i % 2), ink); rect(ctx, X + 6, Y + 10, 4, 4, C.accent); rect(ctx, X + 4, Y + 6, 8, 1, lighten(C.band, 0.3)); },
  map(ctx, X, Y, n, C) { frame(ctx, X + 3, Y + 6, n * T - 6, 20, '#efe2bf', C); rect(ctx, X + 7, Y + 10, 8, 6, '#9fc79a'); rect(ctx, X + 13, Y + 14, 7, 5, '#9fc79a'); rect(ctx, X + 6, Y + 19, n * T - 14, 2, '#8fc9e0'); px(ctx, X + 17, Y + 12, C.accent); },
  landscape(ctx, X, Y, n, C) { frame(ctx, X + 3, Y + 6, n * T - 6, 18, '#9ad0e6', C); rect(ctx, X + 5, Y + 16, n * T - 10, 6, '#67a952'); ellipse(ctx, X + 12, Y + 16, 5, 3, P.grassDark); ellipse(ctx, X + n * T - 10, Y + 11, 2, 2, C.accent); },
  botanical(ctx, X, Y, n, C) { frame(ctx, X + 3, Y + 6, 10, 15, '#f6f1e3', C); rect(ctx, X + 8, Y + 10, 1, 9, P.grassDark); ellipse(ctx, X + 6, Y + 13, 2, 1, P.grassLight); ellipse(ctx, X + 10, Y + 15, 2, 1, P.grassLight); px(ctx, X + 8, Y + 9, C.accent); },
  herbs(ctx, X, Y, n, C) { rect(ctx, X + 2, Y + 8, 12, 1, C.woodD); for (let i = 0; i < 3; i++) { rect(ctx, X + 4 + i * 4, Y + 9, 1, 3, C.woodD); ellipse(ctx, X + 4 + i * 4, Y + 15, 2, 3, i % 2 ? P.grassLight : P.grassDark); } },
  sheet(ctx, X, Y, n, C) { frame(ctx, X + 3, Y + 7, 10, 14, '#fbf8ef', C); for (let j = 0; j < 4; j++) rect(ctx, X + 5, Y + 10 + j * 2, 6, 1, '#8f877a'); px(ctx, X + 7, Y + 11, ink); px(ctx, X + 9, Y + 13, ink); },
  plate(ctx, X, Y, n, C) { ellipse(ctx, X + 8, Y + 14, 6, 6, ink); ellipse(ctx, X + 8, Y + 14, 5, 5, '#f3efe4'); ellipse(ctx, X + 8, Y + 14, 3, 3, C.band); ellipse(ctx, X + 8, Y + 14, 1, 1, '#f3efe4'); },
  cloth(ctx, X, Y, n, C) { rect(ctx, X + 2, Y + 5, 12, 2, C.woodD); rect(ctx, X + 3, Y + 7, 10, 20, ink); for (let j = 0; j < 18; j++) rect(ctx, X + 4, Y + 7 + j, 8, 1, (j >> 2) % 2 ? C.band : C.dye); },
  poster(ctx, X, Y, n, C) { box(ctx, X + 3, Y + 5, n * T - 6, 22, '#f6f1e3'); rect(ctx, X + 6, Y + 8, n * T - 12, 4, C.band); for (let j = 0; j < 3; j++) rect(ctx, X + 6, Y + 15 + j * 3, n * T - 14 - j * 4, 1, ink); },
  // part of a group
  cloths(ctx, X, Y, n, C) { rect(ctx, X + 2, Y + 6, n * T - 4, 1, C.woodD); [C.band, C.accent, C.dye].forEach((c, i) => { const cx = X + 6 + i * 15; rect(ctx, cx - 1, Y + 7, 10, 20, ink); rect(ctx, cx, Y + 7, 8, 19, c); rect(ctx, cx, Y + 7, 1, 18, lighten(c, 0.3)); px(ctx, cx + 2, Y + 6, ink); px(ctx, cx + 6, Y + 6, ink); }); },
  pans(ctx, X, Y, n, C) { rect(ctx, X + 3, Y + 7, n * T - 6, 2, C.woodD); for (let i = 0; i < 3; i++) { const cx = X + 8 + i * 8; rect(ctx, cx, Y + 9, 1, 4, ink); ellipse(ctx, cx, Y + 17, 3, 3, ink); ellipse(ctx, cx, Y + 17, 2, 2, i === 1 ? '#c26a3c' : P.metal); } },
};

export function paintBackground(ctx, L, place) {
  const C = L.palette, { w, h } = L;
  for (let x = 0; x < w; x++) { if (L.top[x] > 0) paintUpperWall(ctx, L, C, x); paintWallColumn(ctx, L, C, x); }
  { // the courtyard in a front notch: one garden over the whole cut corner
    const cols = []; for (let x = 0; x < w; x++) if (L.bot[x] < h - 1) cols.push(x);
    if (cols.length) paintCourtyard(ctx, L, C, cols[0], cols[cols.length - 1], Math.min(...cols.map((x) => L.bot[x])) + 1, h - 1);
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (cellAt(L, x, y) !== 'floor') continue;
    for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) px(ctx, x * T + i, y * T + j, floorColour(L, C, x * T + i, y * T + j));
  }
  // raised platform: planks (or rock) with a border of the house colour and a step at the front
  if (L.dais) {
    const [p0, p1, r0, r1] = L.dais, X = p0 * T, Y = r0 * T, W = (p1 - p0 + 1) * T, H = (r1 - r0 + 1) * T - 5;
    const top = L.dark ? darken(C.stone, 0.15) : C.woodL, seam = L.dark ? darken(C.stone, 0.4) : C.wood;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) px(ctx, X + i, Y + j, j % 6 === 5 || (i + (Math.floor(j / 6) % 2) * 12) % 24 === 0 ? seam : mix(top, seam, hash(Math.floor((i + (Math.floor(j / 6) % 2) * 12) / 24), Math.floor(j / 6), 7) * 0.35));
    if (!L.dark) { rect(ctx, X + 3, Y + 2, W - 6, H - 4, mix(C.band, ink, 0.1)); rect(ctx, X + 4, Y + 3, W - 8, H - 6, C.band); rect(ctx, X + 5, Y + 4, W - 10, 1, lighten(C.band, 0.25)); for (let i = X + 8; i < X + W - 8; i += 6) px(ctx, i, Y + H - 5, C.accent); }
    rect(ctx, X - 1, Y, 1, H + 5, ink); rect(ctx, X + W, Y, 1, H + 5, ink);
    rect(ctx, X - 1, Y + H, W + 2, 1, ink); rect(ctx, X, Y + H + 1, W, 3, L.dark ? darken(C.stone, 0.45) : C.woodD); rect(ctx, X - 1, Y + H + 4, W + 2, 1, ink);
    ctx.fillStyle = 'rgba(20,18,40,0.18)'; ctx.fillRect(X, Y + H + 5, W, 3);
  }
  // rugs, under their groups
  for (const g of L.rugs) {
    const X = g.x * T + 2, Y = g.y * T + 4, W = g.w * T - 4, H = g.h * T - 5, base = g.style === 1 ? darken(C.band, 0.15) : g.style === 2 ? mix(C.accent, C.band, 0.55) : mix(C.band, '#ffffff', 0.15);
    rect(ctx, X, Y, W, H, ink); rect(ctx, X + 1, Y + 1, W - 2, H - 2, base);
    rect(ctx, X + 3, Y + 3, W - 6, H - 6, C.accent); rect(ctx, X + 4, Y + 4, W - 8, H - 8, base);
    for (let i = X + 8; i < X + W - 8; i += 6) for (let j = Y + 8; j < Y + H - 8; j += 6) px(ctx, i, j, mix(base, C.accent, 0.5));
    for (let i = X + 1; i < X + W - 1; i += 2) { px(ctx, i, Y - 1, '#e9e2c9'); px(ctx, i, Y + H, '#e9e2c9'); }
  }
  // night light from the windows, on the floor
  for (const d of L.wall) if (d.type === 'window') {
    const fy = (d.top + 3) * T;
    for (let j = 0; j < 22; j++) { ctx.fillStyle = `rgba(170,205,255,${0.1 - j * 0.004})`; ctx.fillRect(d.x * T + 4 + Math.round(j * 0.4), fy + j, d.n * T - 8, 1); }
  }
  // shadow along the back wall, returns of deeper walls, side walls
  for (let x = 0; x < w; x++) {
    const fy = (L.top[x] + 3) * T;
    for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgba(20,18,40,${0.18 - k * 0.03})`; ctx.fillRect(x * T, fy + k, T, 1); }
    for (const s of [-1, 1]) {
      const n = x + s; if (n < 0 || n >= w) continue;
      if (L.top[n] < L.top[x]) { const X = s < 0 ? x * T : x * T + T - 1; rect(ctx, X, L.top[x] * T, 1, 48, ink); ctx.fillStyle = 'rgba(20,18,40,0.22)'; ctx.fillRect(s < 0 ? x * T - 4 : x * T + T, (L.top[n] + 3) * T, 4, (L.top[x] - L.top[n]) * T); }
    }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (cellAt(L, x, y) !== 'floor') continue;
    for (const s of [-1, 1]) {
      const c = cellAt(L, x + s, y); if (c === 'floor' || c === 'wall') continue;
      const X = s < 0 ? x * T : x * T + T - 4;
      rect(ctx, X, y * T, 4, T, darken(C.front, 0.25)); rect(ctx, s < 0 ? X + 3 : X, y * T, 1, T, mix(C.front, '#ffffff', 0.2)); rect(ctx, s < 0 ? X : X + 3, y * T, 1, T, ink);
    }
  }
  // front wall and the exit mat
  for (let x = 0; x < w; x++) {
    const Y = L.bot[x] * T;
    rect(ctx, x * T, Y, T, T, C.front); rect(ctx, x * T, Y, T, 2, ink); rect(ctx, x * T, Y + T - 1, T, 1, darken(C.front, 0.4));
    if (!['front', 'floor'].includes(cellAt(L, x - 1, L.bot[x]))) rect(ctx, x * T, Y, 1, T, ink);
    if (!['front', 'floor'].includes(cellAt(L, x + 1, L.bot[x]))) rect(ctx, x * T + T - 1, Y, 1, T, ink);
  }
  for (let x = 0; x < w; x++) {
    for (const s of [-1, 1]) if (['void', 'out'].includes(cellAt(L, x + s, L.top[x]))) rect(ctx, s < 0 ? x * T : x * T + T - 1, L.top[x] * T, 1, 48, ink);
    rect(ctx, x * T, L.top[x] * T, T, 1, ink);
  }
  const [ex, ey] = L.exit, mx = ex * T, my = ey * T;
  if (L.upper) stairwell(ctx, mx, my);
  else {
    rect(ctx, mx, my + 1, 16, 15, '#3a3f6b'); rect(ctx, mx + 1, my + 2, 14, 13, '#c9563f');
    for (let y = my + 4; y < my + 14; y += 3) rect(ctx, mx + 3, y, 10, 1, '#e7a34f');
  }
  // the back wall: lab door, reading wall, the concept, the number, decorations, torches
  if (L.attic) paintAttic(ctx, L, C);
  if (L.lab) door(ctx, L.lab[0] * T + 1, L.top[L.lab[0]] * T + 22, L.upper ? 'LAB II' : 'LAB');
  if (L.board) (L.upper ? paintShelf : paintBoard)(ctx, L, C, place);
  paintLabel(ctx, L, C);
  if (L.number) { const num = String(place.order || ''), X = L.number.x * T + 1, Y = L.number.top * T + 8; rect(ctx, X, Y, 14, 13, ink); rect(ctx, X + 1, Y + 1, 12, 11, P.gold); drawText(ctx, num, X + 7 - textWidth(num) / 2, Y + 4, ink); }
  for (const d of L.wall) (DECOR[d.type] || DECOR.portrait)(ctx, d.x * T, d.top * T, d.n, C);
  for (const [x, y] of L.torches) { rect(ctx, x - 1, y + 3, 3, 6, '#2a2018'); rect(ctx, x - 2, y + 2, 5, 2, '#5a4a36'); rect(ctx, x, y + 9, 1, 3, '#2a2018'); }
}
