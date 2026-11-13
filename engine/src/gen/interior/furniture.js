// Painters of furniture pieces and signature objects. Each draws upward from the bottom of its
// footprint: PAINT[type](ctx, x, b, w, it, C) with x the footprint's left edge in pixels, b its
// bottom, w its width, it the item (it.opt: fill, tint, ladder, face), C the room's palette.
// Light comes from the upper left; every shape has a dark outline. Colours come from C (the room's
// palette) or are fixed colours of the object itself (glass, brass, paper).
import { rect, px, ellipse, hash, mix } from '../../art/px.js';
import { P } from '../../art/palette.js';
import { drawEmblem } from '../emblems.js';

const ink = P.ink;
export const lighten = (c, t) => mix(c, '#ffffff', t), darken = (c, t) => mix(c, ink, t);
export function box(ctx, x, y, w, h, fill, edge = ink) { rect(ctx, x, y, w, h, edge); rect(ctx, x + 1, y + 1, w - 2, h - 2, fill); }
function legs(ctx, x, b, w, col) { rect(ctx, x + 2, b - 6, 2, 6, col); rect(ctx, x + w - 4, b - 6, 2, 6, col); }
function table(ctx, x, b, w, top, edge) { legs(ctx, x, b - 1, w, edge); rect(ctx, x, b - 14, w, 9, ink); rect(ctx, x + 1, b - 13, w - 2, 6, top); rect(ctx, x + 1, b - 13, w - 2, 1, lighten(top, 0.3)); rect(ctx, x + 1, b - 7, w - 2, 1, darken(top, 0.25)); }
const tint = (it, C, d = 'band') => C[it.opt?.tint || d] || C.band;
const BOOKS = ['#b9463b', '#3c5ea6', '#2f5d50', '#d9a441', '#6b4fa0', '#e9e2c9'];

// what stands on the shelves of a shelf: books, jars, pots, plates, cloth
function shelfRow(ctx, x0, x1, sy, fill, it, C, s) {
  if (fill === 'jars') { for (let x = x0 + 1; x + 4 < x1; x += 5) { box(ctx, x, sy + 3, 4, 7, '#cfe6ea'); rect(ctx, x + 1, sy + 6, 2, 3, [C.accent, C.band, '#67a952', C.dye][(x + s) % 4]); rect(ctx, x, sy + 2, 4, 1, C.woodD); } return; }
  if (fill === 'pots') { for (let x = x0 + 1; x + 5 < x1; x += 6) { const c = [C.stoneL, '#c26a3c', C.band][(x + s) % 3]; ellipse(ctx, x + 2, sy + 7, 3, 3, ink); ellipse(ctx, x + 2, sy + 7, 2, 2, c); rect(ctx, x + 1, sy + 3, 3, 2, ink); px(ctx, x + 2, sy + 4, c); } return; }
  if (fill === 'plates') { for (let x = x0 + 1; x + 5 < x1; x += 6) { ellipse(ctx, x + 2, sy + 5, 3, 4, ink); ellipse(ctx, x + 2, sy + 5, 2, 3, '#f3efe4'); px(ctx, x + 2, sy + 5, C.band); } return; }
  if (fill === 'cloth') { for (let x = x0 + 1; x + 4 < x1; x += 4) { box(ctx, x, sy + 3, 4, 7, [C.band, C.accent, C.dye, C.trim][(x + s) % 4]); } return; }
  for (let i = 0, bx = x0; bx < x1 - 1; i++) { const bw = 2 + Math.floor(hash(i, s, it.v) * 2), bh = 6 + Math.floor(hash(s, i, it.v + 1) * 3); rect(ctx, bx, sy + 10 - bh, Math.min(bw, x1 - bx), bh, BOOKS[Math.floor(hash(i, s, it.v + 2) * 6)]); bx += bw; }
}

export const PAINT = {
  // ---- living
  desk(ctx, x, b, w, it, C) {
    table(ctx, x, b, w, C.woodL, C.woodD);
    box(ctx, x + w - 12, b - 13, 10, 12, C.wood); rect(ctx, x + w - 10, b - 9, 6, 1, C.woodD); px(ctx, x + w - 7, b - 7, P.gold);
    rect(ctx, x + 4, b - 15, 9, 3, '#fbf8ef'); rect(ctx, x + 5, b - 14, 6, 1, '#b8ad98'); rect(ctx, x + 15, b - 16, 3, 3, ink); px(ctx, x + 16, b - 19, '#f5f1e6'); px(ctx, x + 17, b - 20, '#f5f1e6');
  },
  chair(ctx, x, b, w, it, C) {
    const c = tint(it, C, 'wood');
    if (it.opt?.face === 'up') { legs(ctx, x + 1, b, 14, C.woodD); rect(ctx, x + 3, b - 10, 10, 4, ink); rect(ctx, x + 4, b - 9, 8, 2, C.woodL); box(ctx, x + 3, b - 18, 10, 9, c); rect(ctx, x + 5, b - 16, 6, 1, lighten(c, 0.3)); return; }
    box(ctx, x + 3, b - 19, 10, 9, c); rect(ctx, x + 5, b - 17, 6, 1, lighten(c, 0.3)); rect(ctx, x + 2, b - 11, 12, 5, ink); rect(ctx, x + 3, b - 10, 10, 3, lighten(c, 0.15)); legs(ctx, x + 1, b, 14, C.woodD);
  },
  armchair(ctx, x, b, w, it, C) {
    const c = tint(it, C);
    rect(ctx, x + 2, b - 3, 2, 3, C.woodD); rect(ctx, x + 12, b - 3, 2, 3, C.woodD);
    box(ctx, x + 2, b - 20, 12, 11, c); rect(ctx, x + 4, b - 18, 8, 2, lighten(c, 0.25));
    box(ctx, x, b - 13, 4, 10, darken(c, 0.1)); box(ctx, x + 12, b - 13, 4, 10, darken(c, 0.1));
    box(ctx, x + 3, b - 10, 10, 6, lighten(c, 0.12)); rect(ctx, x + 4, b - 9, 8, 1, lighten(c, 0.35));
  },
  sidetable(ctx, x, b, w, it, C) {
    rect(ctx, x + 7, b - 10, 2, 9, C.woodD); rect(ctx, x + 4, b - 2, 8, 2, ink);
    ellipse(ctx, x + 8, b - 11, 6, 2, ink); ellipse(ctx, x + 8, b - 11, 5, 1, C.woodL);
    box(ctx, x + 6, b - 16, 4, 4, '#f3efe4'); px(ctx, x + 7, b - 15, C.band); rect(ctx, x + 10, b - 14, 1, 2, '#f3efe4');
  },
  lamp(ctx, x, b, w, it, C) {
    rect(ctx, x + 4, b - 3, 8, 3, ink); rect(ctx, x + 7, b - 24, 2, 22, C.woodD);
    for (let j = 0; j < 8; j++) { const hw = 3 + Math.round(j * 0.5); rect(ctx, x + 8 - hw - 1, b - 32 + j, hw * 2 + 2, 1, ink); rect(ctx, x + 8 - hw, b - 32 + j, hw * 2, 1, j < 2 ? lighten(C.accent, 0.5) : C.accent); }
    rect(ctx, x + 4, b - 24, 8, 1, '#fff1c4');
  },
  stool(ctx, x, b, w, it, C) { rect(ctx, x + 4, b - 6, 2, 6, C.woodD); rect(ctx, x + 10, b - 6, 2, 6, C.woodD); rect(ctx, x + 3, b - 11, 10, 5, ink); rect(ctx, x + 4, b - 10, 8, 3, C.woodL); },
  pew(ctx, x, b, w, it, C) { rect(ctx, x + 1, b - 18, w - 2, 9, ink); rect(ctx, x + 2, b - 17, w - 4, 7, C.wood); rect(ctx, x + 2, b - 17, w - 4, 1, C.woodL); rect(ctx, x + 1, b - 10, w - 2, 5, ink); rect(ctx, x + 2, b - 9, w - 4, 3, C.woodL); legs(ctx, x, b - 1, w, C.woodD); },
  chest(ctx, x, b, w, it, C) { box(ctx, x + 1, b - 14, 14, 13, C.wood); rect(ctx, x + 2, b - 13, 12, 3, C.woodL); rect(ctx, x + 1, b - 9, 14, 1, ink); rect(ctx, x + 7, b - 10, 2, 3, P.gold); },
  // ---- storage
  shelf(ctx, x, b, w, it, C) {
    box(ctx, x, b - 38, w, 37, C.woodD); rect(ctx, x + 2, b - 36, w - 4, 33, darken(C.wood, 0.55));
    for (let s = 0; s < 3; s++) { const sy = b - 36 + s * 11; shelfRow(ctx, x + 2, x + w - 2, sy, it.opt?.fill || 'books', it, C, s); rect(ctx, x + 1, sy + 10, w - 2, 1, C.wood); }
    rect(ctx, x, b - 38, w, 2, C.woodL);
    if (it.opt?.ladder) { for (const lx of [x + w - 10, x + w - 4]) rect(ctx, lx, b - 40, 2, 40, ink); for (let y = b - 36; y < b; y += 6) rect(ctx, x + w - 9, y, 6, 1, C.woodL); rect(ctx, x + w - 9, b - 40, 1, 40, C.woodL); rect(ctx, x + w - 3, b - 40, 1, 40, C.wood); }
  },
  shelf1(ctx, x, b, w, it, C) { PAINT.shelf(ctx, x, b, w, it, C); },
  drawers(ctx, x, b, w, it, C) {
    box(ctx, x + 1, b - 28, 14, 27, C.wood); rect(ctx, x + 1, b - 28, 14, 2, C.woodL);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) { rect(ctx, x + 3 + i * 6, b - 24 + j * 6, 5, 5, C.woodD); rect(ctx, x + 4 + i * 6, b - 23 + j * 6, 3, 3, C.woodL); px(ctx, x + 5 + i * 6, b - 22 + j * 6, P.gold); }
  },
  planchest(ctx, x, b, w, it, C) {
    box(ctx, x + 1, b - 17, w - 2, 16, C.wood); rect(ctx, x + 2, b - 16, w - 4, 2, C.woodL);
    for (let j = 0; j < 4; j++) { rect(ctx, x + 3, b - 13 + j * 3, w - 6, 1, C.woodD); px(ctx, x + w / 2, b - 12 + j * 3, P.gold); }
    rect(ctx, x + 3, b - 20, w - 10, 3, '#efe2bf'); rect(ctx, x + 4, b - 19, 6, 1, '#9fc79a');
  },
  cabinet(ctx, x, b, w, it, C) {
    box(ctx, x + 1, b - 34, 14, 33, '#dfe6ea'); rect(ctx, x + 3, b - 32, 10, 13, '#8fc9e0'); rect(ctx, x + 3, b - 18, 10, 13, '#8fc9e0');
    rect(ctx, x + 3, b - 26, 10, 1, '#5d6670'); rect(ctx, x + 3, b - 12, 10, 1, '#5d6670');
    for (let i = 0; i < 3; i++) { rect(ctx, x + 4 + i * 3, b - 30 + (i % 2), 2, 4, [C.accent, C.band, '#4fd1c5'][i]); rect(ctx, x + 4 + i * 3, b - 16 + ((i + 1) % 2), 2, 4, [C.band, '#4fd1c5', C.accent][i]); }
    rect(ctx, x + 2, b - 3, 12, 2, '#5d6670');
  },
  basket(ctx, x, b, w, it, C) {
    ellipse(ctx, x + 8, b - 5, 6, 4, ink); ellipse(ctx, x + 8, b - 5, 5, 3, C.woodL); for (let i = x + 4; i < x + 13; i += 2) rect(ctx, i, b - 7, 1, 5, C.wood);
    ellipse(ctx, x + 6, b - 9, 2, 2, ink); ellipse(ctx, x + 6, b - 9, 1, 1, C.band); ellipse(ctx, x + 10, b - 9, 2, 2, ink); ellipse(ctx, x + 10, b - 9, 1, 1, C.accent);
  },
  papers(ctx, x, b, w, it, C) { box(ctx, x + 2, b - 8, 12, 7, C.wood); for (let j = 0; j < 3; j++) { rect(ctx, x + 3 + (j % 2), b - 11 - j * 2, 10, 2, ink); rect(ctx, x + 4 + (j % 2), b - 11 - j * 2, 8, 1, '#fbf8ef'); } },
  // ---- tables
  readtable(ctx, x, b, w, it, C) {
    table(ctx, x, b, w, C.woodL, C.woodD);
    rect(ctx, x + 6, b - 16, 12, 6, ink); rect(ctx, x + 7, b - 16, 5, 5, '#fbf8ef'); rect(ctx, x + 12, b - 16, 5, 5, '#f0e8d4'); rect(ctx, x + 8, b - 14, 3, 1, '#8f877a'); rect(ctx, x + 13, b - 14, 3, 1, '#8f877a');
    rect(ctx, x + w - 8, b - 21, 3, 7, '#f5f1e6'); px(ctx, x + w - 7, b - 23, '#ffcf5a'); px(ctx, x + w - 7, b - 22, '#ffb347');
  },
  longtable(ctx, x, b, w, it, C) {
    table(ctx, x, b, w, C.woodL, C.woodD); rect(ctx, x + 4, b - 12, w - 8, 2, tint(it, C));
    for (let i = 10; i < w - 6; i += 14) ellipse(ctx, x + i, b - 11, 3, 1, '#f5f1e6');
    rect(ctx, x + w / 2 - 1, b - 20, 2, 7, '#f5f1e6'); px(ctx, x + w / 2 - 1, b - 22, '#ffcf5a');
  },
  worktable(ctx, x, b, w, it, C) {
    table(ctx, x, b, w, C.woodL, C.woodD);
    box(ctx, x + 4, b - 16, 10, 4, lighten(C.wood, 0.4)); ellipse(ctx, x + 20, b - 15, 5, 2, ink); ellipse(ctx, x + 20, b - 15, 4, 1, '#f3efe4');
    px(ctx, x + 19, b - 17, '#e0574f'); px(ctx, x + 21, b - 17, '#67a952'); px(ctx, x + 20, b - 18, '#f2c94c'); rect(ctx, x + 7, b - 15, 4, 1, '#67a952');
  },
  charttable(ctx, x, b, w, it, C) {
    table(ctx, x, b, w, C.woodL, C.woodD);
    rect(ctx, x + 4, b - 14, w - 8, 6, '#efe2bf'); rect(ctx, x + 7, b - 13, 6, 3, '#9fc79a'); rect(ctx, x + 16, b - 12, 8, 2, '#8fc9e0'); px(ctx, x + 20, b - 13, C.accent);
    rect(ctx, x + 5, b - 9, 1, 1, ink); rect(ctx, x + w - 6, b - 9, 1, 1, ink);
  },
  labtable(ctx, x, b, w, it, C) {
    table(ctx, x, b, w, '#cfd4d6', P.metalDark);
    box(ctx, x + 5, b - 21, 5, 8, '#8fc9e0'); rect(ctx, x + 6, b - 17, 3, 3, C.accent);
    rect(ctx, x + 14, b - 19, 8, 6, ink); rect(ctx, x + 15, b - 18, 6, 4, '#3d434b'); px(ctx, x + 17, b - 17, '#4fd1c5');
    box(ctx, x + w - 8, b - 20, 4, 7, '#8fc9e0'); rect(ctx, x + w - 7, b - 16, 2, 2, C.band);
  },
  examtable(ctx, x, b, w, it, C) {
    legs(ctx, x, b - 1, w, P.metalDark); rect(ctx, x, b - 14, w, 8, ink); rect(ctx, x + 1, b - 13, w - 2, 5, mix(C.band, '#ffffff', 0.35)); rect(ctx, x + 2, b - 13, 7, 4, '#ffffff');
    rect(ctx, x + w - 4, b - 26, 2, 13, P.metalDark); rect(ctx, x + w - 9, b - 27, 7, 3, ink); rect(ctx, x + w - 8, b - 26, 5, 1, '#fff1c4');
  },
  bench(ctx, x, b, w, it, C) {
    rect(ctx, x, b - 18, w, 18, ink); rect(ctx, x + 1, b - 17, w - 2, 16, '#cfd4d6'); rect(ctx, x + 1, b - 17, w - 2, 3, '#eef2f2');
    for (let i = 0; i < w / 16; i++) { rect(ctx, x + 3 + i * 16, b - 11, 10, 8, '#b5bcc0'); px(ctx, x + 8 + i * 16, b - 7, P.metalDark); }
    box(ctx, x + 4, b - 24, 5, 8, '#8fc9e0'); rect(ctx, x + 5, b - 20, 3, 3, '#4fd1c5'); box(ctx, x + 11, b - 22, 4, 6, '#8fc9e0'); rect(ctx, x + 12, b - 19, 2, 2, C.accent);
    rect(ctx, x + w - 12, b - 26, 3, 10, ink); rect(ctx, x + w - 14, b - 18, 8, 2, ink); rect(ctx, x + w - 11, b - 28, 4, 3, P.metal);
  },
  computer(ctx, x, b, w, it, C) {
    table(ctx, x, b, w, C.woodL, C.woodD);
    box(ctx, x + 5, b - 28, 18, 13, '#2b3346'); rect(ctx, x + 7, b - 26, 14, 9, '#16213f');
    for (let i = 0; i < 12; i++) px(ctx, x + 8 + i, b - 21 - Math.round(Math.sin((i + it.v) * 0.9) * 2), '#4fd1c5');
    rect(ctx, x + 12, b - 15, 4, 2, ink); rect(ctx, x + 22, b - 16, 6, 2, '#cfd4d6');
  },
  // ---- trades
  range(ctx, x, b, w, it, C) {
    rect(ctx, x + w / 2 - 4, b - 34, 8, 12, ink); rect(ctx, x + w / 2 - 3, b - 34, 6, 12, '#4a4652'); // flue
    box(ctx, x + 1, b - 22, w - 2, 21, '#3d3a46'); rect(ctx, x + 2, b - 21, w - 4, 2, '#5d5966');
    box(ctx, x + 5, b - 15, 12, 10, '#2a2730'); rect(ctx, x + 7, b - 12, 8, 5, '#ff9a3c'); rect(ctx, x + 8, b - 11, 6, 2, '#ffd27a');
    rect(ctx, x + 20, b - 16, 8, 2, P.metal); rect(ctx, x + 20, b - 12, 8, 2, P.metal);
    box(ctx, x + 6, b - 28, 10, 7, '#5d6670'); rect(ctx, x + 7, b - 27, 8, 1, P.metalLight); rect(ctx, x + 16, b - 26, 4, 1, ink);
  },
  vat(ctx, x, b, w, it, C) { // a wooden tub of dye, seen from above the rim
    const c = tint(it, C);
    rect(ctx, x + 1, b - 13, 14, 12, ink); rect(ctx, x + 2, b - 12, 12, 11, C.woodL); for (let i = x + 4; i < x + 14; i += 3) rect(ctx, i, b - 12, 1, 11, C.wood);
    for (const y of [b - 10, b - 4]) rect(ctx, x + 1, y, 14, 1, P.metalDark);
    ellipse(ctx, x + 8, b - 14, 7, 3, ink); ellipse(ctx, x + 8, b - 14, 6, 2, C.woodL); ellipse(ctx, x + 8, b - 14, 5, 2, c); rect(ctx, x + 5, b - 15, 3, 1, lighten(c, 0.45));
    rect(ctx, x + 11, b - 21, 1, 8, C.woodD);
  },
  rack(ctx, x, b, w, it, C) {
    rect(ctx, x + 1, b - 34, 2, 34, ink); rect(ctx, x + w - 3, b - 34, 2, 34, ink); rect(ctx, x + 1, b - 34, w - 2, 2, ink); rect(ctx, x + 2, b - 33, w - 4, 1, C.woodL);
    [C.band, C.accent, C.dye].forEach((c, i) => { const cx = x + 5 + i * 8; rect(ctx, cx - 1, b - 32, 7, 20 - (i % 2) * 4, ink); rect(ctx, cx, b - 32, 5, 19 - (i % 2) * 4, c); rect(ctx, cx, b - 32, 1, 18 - (i % 2) * 4, lighten(c, 0.3)); });
    rect(ctx, x + 1, b - 2, w - 2, 2, C.woodD);
  },
  loom(ctx, x, b, w, it, C) {
    rect(ctx, x + 2, b - 32, 3, 32, ink); rect(ctx, x + w - 5, b - 32, 3, 32, ink); rect(ctx, x + 3, b - 31, 1, 31, C.woodL); rect(ctx, x + w - 4, b - 31, 1, 31, C.wood);
    rect(ctx, x + 1, b - 33, w - 2, 3, ink); rect(ctx, x + 2, b - 32, w - 4, 1, C.woodL);
    for (let i = x + 6; i < x + w - 6; i += 2) rect(ctx, i, b - 30, 1, 10, '#e9e2c9');
    rect(ctx, x + 5, b - 20, w - 10, 9, ink); for (let j = 0; j < 7; j++) rect(ctx, x + 6, b - 19 + j, w - 12, 1, j % 2 ? C.band : lighten(C.band, 0.25));
    rect(ctx, x + 4, b - 11, w - 8, 3, ink); rect(ctx, x + 5, b - 10, w - 10, 1, C.woodL); rect(ctx, x + 6, b - 8, 2, 8, C.woodD); rect(ctx, x + w - 8, b - 8, 2, 8, C.woodD);
  },
  piano(ctx, x, b, w, it, C) {
    const body = darken(C.wood, 0.45);
    box(ctx, x + 1, b - 32, w - 2, 28, body); rect(ctx, x + 2, b - 31, w - 4, 2, lighten(body, 0.2));
    rect(ctx, x + 4, b - 26, w - 8, 9, darken(body, 0.2)); rect(ctx, x + 6, b - 24, w - 12, 5, mix(body, '#c9a440', 0.25));
    rect(ctx, x, b - 17, w, 5, ink); rect(ctx, x + 1, b - 16, w - 2, 3, '#f5f1e6'); for (let i = x + 3; i < x + w - 2; i += 3) rect(ctx, i, b - 16, 1, 2, ink);
    rect(ctx, x + 3, b - 4, 3, 4, body); rect(ctx, x + w - 6, b - 4, 3, 4, body);
    rect(ctx, x + 6, b - 36, 2, 4, '#f5f1e6'); px(ctx, x + 6, b - 37, '#ffcf5a'); rect(ctx, x + w - 8, b - 36, 2, 4, '#f5f1e6'); px(ctx, x + w - 8, b - 37, '#ffcf5a');
  },
  musicstand(ctx, x, b, w, it, C) { rect(ctx, x + 7, b - 16, 2, 16, ink); rect(ctx, x + 4, b - 1, 8, 1, ink); box(ctx, x + 2, b - 24, 12, 9, '#fbf8ef'); for (let j = 0; j < 3; j++) rect(ctx, x + 4, b - 22 + j * 2, 8, 1, '#8f877a'); px(ctx, x + 6, b - 21, ink); px(ctx, x + 10, b - 19, ink); },
  harp(ctx, x, b, w, it, C) {
    rect(ctx, x + 3, b - 4, 10, 4, ink); rect(ctx, x + 4, b - 3, 8, 2, C.woodD);
    rect(ctx, x + 3, b - 30, 3, 27, ink); rect(ctx, x + 4, b - 29, 1, 26, '#e0b450');
    for (let j = 0; j < 9; j++) rect(ctx, x + 5 + j, b - 31 + Math.round(j * 0.6), 2, 2, j < 8 ? '#c9a440' : ink);
    for (let i = 0; i < 4; i++) rect(ctx, x + 6 + i * 2, b - 28 + Math.round(i * 1.2), 1, 24 - Math.round(i * 1.2), '#f5f1e6');
    rect(ctx, x + 12, b - 28, 2, 25, ink); rect(ctx, x + 12, b - 27, 1, 23, '#c9a440');
  },
  pottingbench(ctx, x, b, w, it, C) {
    table(ctx, x, b, w, C.woodL, C.woodD);
    for (let i = 0; i < 3; i++) { const cx = x + 6 + i * 9; rect(ctx, cx - 3, b - 19, 6, 5, ink); rect(ctx, cx - 2, b - 18, 4, 4, '#c26a3c'); ellipse(ctx, cx, b - 21, 3, 2, P.grassDark); px(ctx, cx - 1, b - 22, P.grassLight); }
  },
  planter(ctx, x, b, w, it, C) {
    box(ctx, x + 2, b - 9, 12, 8, C.wood); rect(ctx, x + 3, b - 8, 10, 1, C.woodL);
    for (const [dx, dy, r] of [[0, 14, 5], [-3, 11, 3], [3, 12, 4], [0, 19, 3]]) ellipse(ctx, x + 8 + dx, b - dy, r + 1, r, ink);
    for (const [dx, dy, r] of [[0, 14, 4], [-3, 11, 2], [3, 12, 3], [0, 19, 2]]) ellipse(ctx, x + 8 + dx, b - dy, r, r - 1 || 1, P.grassDark);
    px(ctx, x + 6, b - 16, P.grassLight); px(ctx, x + 9, b - 13, P.grassLight); px(ctx, x + 10, b - 18, '#f2c94c');
  },
  plant(ctx, x, b, w, it, C) {
    rect(ctx, x + 4, b - 8, 8, 7, ink); rect(ctx, x + 5, b - 7, 6, 6, '#8c4a3a'); rect(ctx, x + 5, b - 7, 6, 1, '#a85b49');
    for (const [dx, dy, r1] of [[0, 14, 4], [-3, 10, 3], [3, 11, 3], [0, 19, 3]]) ellipse(ctx, x + 8 + dx, b - dy, r1, r1 - 1, P.grassDark);
    ellipse(ctx, x + 7, b - 16, 2, 2, P.grassLight); ellipse(ctx, x + 10, b - 11, 2, 1, P.grassLight);
  },
  clockbench(ctx, x, b, w, it, C) {
    table(ctx, x, b, w, C.woodL, C.woodD);
    rect(ctx, x + 4, b - 15, 10, 2, '#efe2bf'); for (const [gx, r] of [[7, 3], [12, 2]]) { ellipse(ctx, x + gx, b - 17, r, r, '#c9a440'); px(ctx, x + gx, b - 17, ink); }
    rect(ctx, x + w - 10, b - 24, 2, 10, ink); rect(ctx, x + w - 10, b - 24, 8, 2, ink); ellipse(ctx, x + w - 3, b - 21, 3, 3, ink); ellipse(ctx, x + w - 3, b - 21, 2, 2, '#bfe3ee');
  },
  wheel(ctx, x, b, w, it, C) {
    box(ctx, x + 3, b - 8, 10, 7, C.woodD); rect(ctx, x + 7, b - 11, 2, 3, ink); ellipse(ctx, x + 8, b - 11, 6, 2, ink); ellipse(ctx, x + 8, b - 11, 5, 1, C.stoneL);
    rect(ctx, x + 5, b - 16, 6, 5, ink); rect(ctx, x + 6, b - 15, 4, 4, '#c26a3c'); rect(ctx, x + 6, b - 15, 1, 4, '#d9895b');
  },
  kiln(ctx, x, b, w, it, C) {
    for (let j = 0; j < 30; j++) { const hw = j < 10 ? Math.round(Math.sqrt(100 - (10 - j) ** 2) * 1.3) : 13; rect(ctx, x + w / 2 - hw - 1, b - 30 + j, hw * 2 + 2, 1, ink); rect(ctx, x + w / 2 - hw, b - 30 + j, hw * 2, 1, (j + (j >> 2)) % 4 === 0 ? '#8c4a3a' : '#a65a46'); }
    ellipse(ctx, x + w / 2, b - 9, 6, 5, ink); ellipse(ctx, x + w / 2, b - 9, 5, 4, '#ff9a3c'); rect(ctx, x + w / 2 - 3, b - 9, 6, 2, '#ffd27a');
    rect(ctx, x + w / 2 - 2, b - 34, 4, 5, ink); rect(ctx, x + w / 2 - 1, b - 34, 2, 4, '#8c4a3a');
  },
  canvases(ctx, x, b, w, it, C) {
    for (let k = 0; k < 3; k++) { const X = x + 2 + k * 2; box(ctx, X, b - 22 + k * 3, 10, 21 - k * 3, k === 2 ? '#fbf8ef' : '#e9e2c9'); rect(ctx, X + 1, b - 21 + k * 3, 1, 19 - k * 3, C.woodL); }
    rect(ctx, x + 9, b - 14, 3, 3, C.band); rect(ctx, x + 8, b - 10, 4, 2, C.accent);
  },
  painttable(ctx, x, b, w, it, C) {
    legs(ctx, x, b, 16, C.woodD); rect(ctx, x + 1, b - 10, 14, 5, ink); rect(ctx, x + 2, b - 9, 12, 3, C.woodL);
    [C.band, C.accent, C.dye].forEach((c, i) => { box(ctx, x + 2 + i * 4, b - 15, 4, 5, c); });
    rect(ctx, x + 12, b - 18, 1, 8, C.woodD); px(ctx, x + 12, b - 19, C.accent);
  },
  lectern(ctx, x, b, w, it, C) {
    rect(ctx, x + 5, b - 3, 6, 3, ink); rect(ctx, x + 7, b - 20, 2, 18, C.woodD);
    for (let j = 0; j < 8; j++) rect(ctx, x + 1 + Math.round(j * 0.3), b - 30 + j, 14 - Math.round(j * 0.6), 1, j === 0 ? ink : C.wood);
    rect(ctx, x + 2, b - 32, 12, 4, ink); rect(ctx, x + 3, b - 31, 5, 2, '#fbf8ef'); rect(ctx, x + 8, b - 31, 5, 2, '#f0e8d4');
  },
  easel(ctx, x, b, w, it, C) {
    rect(ctx, x + 3, b - 30, 2, 30, C.woodD); rect(ctx, x + 11, b - 30, 2, 30, C.woodD); rect(ctx, x + 7, b - 32, 2, 28, C.wood);
    box(ctx, x + 1, b - 30, 14, 14, '#fbf8ef'); rect(ctx, x + 3, b - 26, 5, 5, C.accent); ellipse(ctx, x + 10, b - 21, 2, 2, C.band);
    rect(ctx, x + 1, b - 16, 14, 2, C.wood);
  },
  screen(ctx, x, b, w, it, C) { for (let i = 0; i < 3; i++) box(ctx, x + 1 + i * 10, b - 29, 10, 28, i % 2 ? mix(C.band, '#ffffff', 0.55) : mix(C.band, '#ffffff', 0.4)); },
  globe(ctx, x, b, w, it, C) {
    rect(ctx, x + 5, b - 3, 6, 2, ink); rect(ctx, x + 7, b - 10, 2, 8, C.woodD);
    ellipse(ctx, x + 8, b - 17, 6, 6, ink); ellipse(ctx, x + 8, b - 17, 5, 5, '#3a88b3'); rect(ctx, x + 5, b - 20, 4, 3, '#67a952'); rect(ctx, x + 9, b - 15, 3, 2, '#67a952');
    rect(ctx, x + 1, b - 18, 1, 4, '#c9a440'); rect(ctx, x + 14, b - 18, 1, 4, '#c9a440');
  },
  scope(ctx, x, b, w, it, C) {
    rect(ctx, x + 3, b - 10, 1, 9, C.woodD); rect(ctx, x + 12, b - 10, 1, 9, C.woodD); rect(ctx, x + 7, b - 12, 2, 11, C.woodD);
    for (let i = 0; i < 9; i++) rect(ctx, x + 2 + i, b - 14 - i * 2, 4, 3, i > 6 ? ink : '#c9a440');
    rect(ctx, x + 1, b - 13, 3, 3, ink);
  },
  candelabra(ctx, x, b, w, it, C) {
    rect(ctx, x + 5, b - 4, 6, 3, ink); rect(ctx, x + 7, b - 24, 2, 21, '#c9a440'); rect(ctx, x + 3, b - 22, 10, 2, '#c9a440');
    for (const i of [3, 7, 11]) { rect(ctx, x + i, b - 27, 2, 5, '#f5f1e6'); px(ctx, x + i, b - 29, '#ffe58a'); px(ctx, x + i + 1, b - 28, '#ffb347'); }
  },
  // ---- the cave
  rock(ctx, x, b, w, it, C) { ellipse(ctx, x + 8, b - 6, 7, 5, ink); ellipse(ctx, x + 8, b - 7, 6, 4, '#5f5a68'); ellipse(ctx, x + 6, b - 8, 3, 2, '#77717f'); },
  rock2(ctx, x, b, w, it, C) { ellipse(ctx, x + 12, b - 8, 11, 7, ink); ellipse(ctx, x + 12, b - 9, 10, 6, '#5a5563'); ellipse(ctx, x + 22, b - 6, 7, 5, ink); ellipse(ctx, x + 22, b - 6, 6, 4, '#66606f'); ellipse(ctx, x + 9, b - 12, 4, 2, '#77717f'); },
  stalagmite(ctx, x, b, w, it, C) { for (let j = 0; j < 26; j++) { const hw = Math.max(1, Math.round(6 * (j / 26))); rect(ctx, x + 8 - hw - 1, b - 27 + j, hw * 2 + 2, 1, ink); rect(ctx, x + 8 - hw, b - 27 + j, hw * 2, 1, j % 6 < 3 ? '#625d6a' : '#575260'); } rect(ctx, x + 7, b - 24, 1, 14, '#7a7484'); },
  crystal(ctx, x, b, w, it, C) {
    const cols = it.v % 2 ? ['#4fd1c5', '#a8f0e8'] : ['#9a6ad1', '#d6c2f2'];
    ellipse(ctx, x + 8, b - 3, 6, 2, '#2b2833');
    for (const [dx, hgt, wd] of [[-4, 14, 3], [0, 22, 4], [4, 16, 3]]) { rect(ctx, x + 8 + dx - wd / 2 - 1, b - hgt - 2, wd + 2, hgt, ink); rect(ctx, x + 8 + dx - wd / 2, b - hgt - 1, wd, hgt - 2, cols[0]); rect(ctx, x + 8 + dx - wd / 2, b - hgt - 1, 1, hgt - 3, cols[1]); }
  },
  // ---- the building
  pillar(ctx, x, b, w, it, C) {
    rect(ctx, x + 1, b - 6, 14, 6, ink); rect(ctx, x + 2, b - 5, 12, 4, C.stoneL);
    rect(ctx, x + 3, b - 44, 10, 38, ink); rect(ctx, x + 4, b - 44, 8, 38, lighten(C.stone, 0.45)); rect(ctx, x + 4, b - 44, 2, 38, lighten(C.stone, 0.7)); rect(ctx, x + 10, b - 44, 2, 38, C.stone);
    rect(ctx, x + 1, b - 48, 14, 5, ink); rect(ctx, x + 2, b - 47, 12, 3, C.stoneL);
  },
};

// ---------------------------------------------------------------- signature objects
// Drawn in a 32 px wide box centred on the footprint, at most SIG_H (46) px tall, standing on a
// low plinth as wide as the footprint: the place of honour.
export const SIGNATURES = {
  orrery(ctx, x, b, C) {
    box(ctx, x + 6, b - 9, 20, 9, C.woodD); rect(ctx, x + 7, b - 8, 18, 2, C.woodL); rect(ctx, x + 14, b - 31, 4, 23, ink); rect(ctx, x + 15, b - 30, 2, 22, '#c9a440');
    ellipse(ctx, x + 16, b - 34, 14, 5, '#c9a440'); ellipse(ctx, x + 16, b - 34, 13, 4, darken(C.band, 0.6));
    ellipse(ctx, x + 16, b - 35, 6, 6, ink); ellipse(ctx, x + 16, b - 35, 5, 5, '#ffcf5a'); px(ctx, x + 15, b - 37, '#fff1c4');
    ellipse(ctx, x + 4, b - 34, 2, 2, '#4fd1c5'); ellipse(ctx, x + 27, b - 33, 2, 2, '#ff7a6b'); ellipse(ctx, x + 22, b - 41, 2, 2, '#9a6ad1');
  },
  bigglobe(ctx, x, b, C) {
    box(ctx, x + 9, b - 6, 14, 6, C.woodD); rect(ctx, x + 15, b - 13, 2, 8, C.woodD);
    ellipse(ctx, x + 16, b - 28, 14, 14, ink); ellipse(ctx, x + 16, b - 28, 13, 13, '#3a88b3'); ellipse(ctx, x + 12, b - 31, 6, 5, '#67a952'); ellipse(ctx, x + 21, b - 23, 4, 5, '#67a952'); ellipse(ctx, x + 10, b - 35, 3, 2, '#9ad0e6');
    for (let a = 0; a < 40; a++) { const t = (a / 40) * Math.PI; px(ctx, x + 16 + Math.round(Math.cos(t) * 16), b - 28 - Math.round(Math.sin(t) * 16), '#c9a440'); }
  },
  bigcrystal(ctx, x, b, C) {
    ellipse(ctx, x + 16, b - 3, 14, 3, '#2b2833');
    for (const [dx, hgt, wd, c] of [[-9, 22, 5, 0], [0, 42, 8, 1], [9, 28, 6, 0], [5, 16, 4, 1]]) {
      const cs = c ? ['#4fd1c5', '#c6fbf4', '#2a8c87'] : ['#9a6ad1', '#e1d1f7', '#6b4fa0'];
      rect(ctx, x + 16 + dx - wd / 2 - 1, b - hgt - 1, wd + 2, hgt - 1, ink); rect(ctx, x + 16 + dx - wd / 2, b - hgt, wd, hgt - 3, cs[0]);
      rect(ctx, x + 16 + dx - wd / 2, b - hgt, 2, hgt - 4, cs[1]); rect(ctx, x + 16 + dx + wd / 2 - 1, b - hgt + 2, 1, hgt - 6, cs[2]);
      rect(ctx, x + 16 + dx - wd / 2 + 1, b - hgt - 3, wd - 2, 2, ink); rect(ctx, x + 16 + dx - wd / 2 + 2, b - hgt - 2, wd - 4, 1, cs[1]);
    }
  },
  tablet(ctx, x, b, C) { // a carved standing stone
    for (let j = 0; j < 40; j++) { const hw = j < 6 ? Math.round(Math.sqrt(36 - (6 - j) ** 2) * 1.6) : 10; rect(ctx, x + 16 - hw - 1, b - 41 + j, hw * 2 + 2, 1, ink); rect(ctx, x + 16 - hw, b - 41 + j, hw * 2, 1, j % 9 === 4 ? '#5a5563' : '#6e6878'); }
    rect(ctx, x + 8, b - 34, 2, 30, '#7f798a'); for (let j = 0; j < 5; j++) rect(ctx, x + 11, b - 32 + j * 5, 10 - (j % 2) * 3, 1, '#a9e9e1');
    rect(ctx, x + 4, b - 2, 24, 2, '#2b2833');
  },
  clock(ctx, x, b, C) {
    box(ctx, x + 7, b - 46, 18, 46, C.woodD); rect(ctx, x + 8, b - 45, 16, 2, C.woodL);
    ellipse(ctx, x + 16, b - 36, 7, 7, ink); ellipse(ctx, x + 16, b - 36, 6, 6, '#fbf8ef'); rect(ctx, x + 16, b - 41, 1, 5, ink); rect(ctx, x + 16, b - 36, 4, 1, ink);
    rect(ctx, x + 11, b - 27, 10, 21, darken(C.wood, 0.6)); rect(ctx, x + 15, b - 27, 2, 14, '#c9a440'); ellipse(ctx, x + 16, b - 12, 3, 3, '#c9a440');
  },
  tree(ctx, x, b, C) {
    box(ctx, x + 8, b - 12, 16, 12, '#a85b49'); rect(ctx, x + 9, b - 11, 14, 2, '#c47862');
    rect(ctx, x + 14, b - 26, 4, 15, C.woodD); rect(ctx, x + 10, b - 22, 5, 2, C.woodD);
    for (const [dx, dy, rr] of [[0, 33, 11], [-8, 28, 7], [8, 29, 8], [-3, 40, 6], [6, 39, 6]]) ellipse(ctx, x + 16 + dx, b - dy, rr + 1, rr, ink);
    for (const [dx, dy, rr] of [[0, 33, 10], [-8, 28, 6], [8, 29, 7], [-3, 40, 5], [6, 39, 5]]) ellipse(ctx, x + 16 + dx, b - dy, rr, rr - 1, P.grassDark);
    for (const [dx, dy] of [[-4, 36], [4, 31], [-9, 29], [2, 41]]) ellipse(ctx, x + 16 + dx, b - dy, 2, 2, P.grassLight);
    for (const [dx, dy] of [[5, 35], [-6, 32], [9, 27], [-1, 28]]) { px(ctx, x + 16 + dx, b - dy, '#f2a03c'); px(ctx, x + 17 + dx, b - dy, '#f2a03c'); }
  },
  prism(ctx, x, b, C) {
    box(ctx, x + 4, b - 8, 24, 8, C.stoneL);
    for (let j = 0; j < 30; j++) { const hw = Math.round(12 * (j / 30)); rect(ctx, x + 16 - hw - 1, b - 39 + j, hw * 2 + 2, 1, ink); rect(ctx, x + 16 - hw, b - 39 + j, hw * 2, 1, j < 3 ? '#ffffff' : '#bfe3ee'); }
    rect(ctx, x + 13, b - 32, 2, 18, '#e8f6fb');
    ['#e0574f', '#f2c94c', '#67a952', '#3a88b3', '#9a6ad1'].forEach((c, i) => rect(ctx, x + 22 + i, b - 22 + i, 9 - i, 1, c));
    rect(ctx, x, b - 25, 10, 1, '#fff1c4');
  },
  hourglass(ctx, x, b, C) {
    box(ctx, x + 6, b - 6, 20, 6, C.woodD); box(ctx, x + 6, b - 46, 20, 6, C.woodD);
    rect(ctx, x + 8, b - 40, 2, 34, C.woodD); rect(ctx, x + 22, b - 40, 2, 34, C.woodD);
    for (let j = 0; j < 34; j++) { const hw = 1 + Math.round(5 * Math.abs(j - 17) / 17); rect(ctx, x + 16 - hw, b - 40 + j, hw * 2, 1, (j > 7 && j < 17) || j > 27 ? '#e7c873' : '#d9f0f7'); }
  },
  // the experts' things
  clothframe(ctx, x, b, C) { // a frame of freshly dyed cloths
    rect(ctx, x + 2, b - 44, 3, 44, ink); rect(ctx, x + 27, b - 44, 3, 44, ink); rect(ctx, x + 3, b - 43, 1, 43, C.woodL); rect(ctx, x + 28, b - 43, 1, 43, C.wood);
    rect(ctx, x + 1, b - 45, 30, 3, ink); rect(ctx, x + 2, b - 44, 28, 1, C.woodL);
    [C.band, C.accent, C.dye].forEach((c, i) => { const X = x + 6 + i * 7; rect(ctx, X - 1, b - 42, 7, 30 - (i % 2) * 6, ink); rect(ctx, X, b - 42, 5, 29 - (i % 2) * 6, c); rect(ctx, X, b - 42, 1, 28 - (i % 2) * 6, lighten(c, 0.3)); for (let k = 0; k < 3; k++) px(ctx, X + 1 + k * 2, b - 13 - (i % 2) * 6 + (k % 2), c); });
    for (let i = 0; i < 4; i++) { rect(ctx, x + 6 + i * 6, b - 4, 4, 2, darken(C.dye, 0.2)); }
  },
  hearth(ctx, x, b, C) { // a stone hearth with a fire and a pot
    rect(ctx, x + 1, b - 46, 30, 46, ink); for (let j = 0; j < 44; j++) rect(ctx, x + 2, b - 45 + j, 28, 1, j % 6 === 5 ? C.stoneD : mix(C.stone, C.stoneL, hash(j, 3, 4) * 0.6));
    for (let j = 0; j < 44; j += 6) for (let i = (j / 6) % 2 ? 6 : 2; i < 28; i += 8) rect(ctx, x + 2 + i, b - 45 + j, 1, 6, C.stoneD);
    rect(ctx, x, b - 32, 32, 4, ink); rect(ctx, x + 1, b - 31, 30, 2, C.woodL);
    rect(ctx, x + 6, b - 26, 20, 24, '#1d1712'); ellipse(ctx, x + 16, b - 26, 10, 4, '#1d1712');
    for (let k = 0; k < 4; k++) rect(ctx, x + 10 + k * 3, b - 9 - (k % 2) * 3, 3, 7 + (k % 2) * 3, k % 2 ? '#ffd27a' : '#ff9a3c');
    rect(ctx, x + 8, b - 3, 16, 2, '#5a3a20'); ellipse(ctx, x + 16, b - 16, 5, 4, ink); ellipse(ctx, x + 16, b - 16, 4, 3, '#3d3a46'); rect(ctx, x + 15, b - 26, 1, 7, ink);
  },
  bigharp(ctx, x, b, C) {
    rect(ctx, x + 8, b - 6, 18, 6, ink); rect(ctx, x + 9, b - 5, 16, 4, C.woodD);
    rect(ctx, x + 8, b - 44, 4, 38, ink); rect(ctx, x + 9, b - 43, 2, 37, '#e0b450');
    for (let j = 0; j < 16; j++) rect(ctx, x + 10 + j, b - 45 + Math.round(Math.sin(j / 5) * 4) + Math.round(j * 0.4), 2, 3, j < 15 ? '#c9a440' : ink);
    rect(ctx, x + 25, b - 40, 3, 34, ink); rect(ctx, x + 26, b - 39, 1, 33, '#c9a440');
    for (let i = 0; i < 7; i++) rect(ctx, x + 12 + i * 2, b - 40 + Math.round(i * 0.5), 1, 34 - Math.round(i * 0.5), '#f5f1e6');
  },
  skeleton(ctx, x, b, C) { // the anatomy model on its stand
    rect(ctx, x + 10, b - 3, 12, 3, ink); rect(ctx, x + 15, b - 12, 2, 10, P.metalDark);
    const bone = '#efe9da';
    ellipse(ctx, x + 16, b - 40, 5, 5, ink); ellipse(ctx, x + 16, b - 40, 4, 4, bone); px(ctx, x + 14, b - 41, ink); px(ctx, x + 17, b - 41, ink); rect(ctx, x + 15, b - 37, 3, 1, ink);
    rect(ctx, x + 15, b - 35, 2, 20, bone); for (let k = 0; k < 4; k++) { rect(ctx, x + 10, b - 32 + k * 3, 12, 1, ink); rect(ctx, x + 11, b - 32 + k * 3, 10, 1, bone); }
    rect(ctx, x + 8, b - 33, 2, 14, bone); rect(ctx, x + 22, b - 33, 2, 14, bone); rect(ctx, x + 11, b - 16, 10, 3, bone);
    rect(ctx, x + 12, b - 13, 2, 10, bone); rect(ctx, x + 18, b - 13, 2, 10, bone);
  },
  bigeasel(ctx, x, b, C) { // a large canvas with a painting in progress
    rect(ctx, x + 6, b - 44, 3, 44, C.woodD); rect(ctx, x + 23, b - 44, 3, 44, C.woodD); rect(ctx, x + 15, b - 46, 2, 40, C.wood);
    box(ctx, x + 2, b - 42, 28, 24, '#fbf8ef'); rect(ctx, x + 3, b - 41, 26, 10, '#9ad0e6'); rect(ctx, x + 3, b - 31, 26, 4, C.dye); rect(ctx, x + 3, b - 27, 26, 8, '#67a952');
    ellipse(ctx, x + 22, b - 37, 3, 3, C.accent); rect(ctx, x + 7, b - 33, 5, 6, C.band);
    rect(ctx, x + 2, b - 18, 28, 2, C.wood);
  },
  bigbook(ctx, x, b, C) { // a great book open on a stand
    rect(ctx, x + 12, b - 3, 8, 3, ink); rect(ctx, x + 14, b - 26, 4, 24, C.woodD);
    for (let j = 0; j < 10; j++) rect(ctx, x + 3 + j, b - 32 + j, 26 - j * 2, 1, j === 0 ? ink : C.wood);
    rect(ctx, x + 2, b - 40, 28, 10, ink); rect(ctx, x + 3, b - 39, 12, 8, '#fbf8ef'); rect(ctx, x + 17, b - 39, 12, 8, '#f0e8d4');
    for (let k = 0; k < 3; k++) { rect(ctx, x + 5, b - 37 + k * 2, 8, 1, '#8f877a'); rect(ctx, x + 19, b - 37 + k * 2, 8, 1, '#8f877a'); }
    rect(ctx, x + 15, b - 40, 2, 10, C.band); px(ctx, x + 16, b - 29, C.accent); px(ctx, x + 16, b - 28, C.accent);
  },
  urn(ctx, x, b, C) {
    box(ctx, x + 6, b - 8, 20, 8, C.stoneL);
    for (let j = 0; j < 34; j++) { const t = j / 33, hw = Math.round(4 + 9 * Math.sin(Math.min(1, t * 1.15) * Math.PI) * (j < 4 ? 0.6 : 1)); rect(ctx, x + 16 - hw - 1, b - 42 + j, hw * 2 + 2, 1, ink); rect(ctx, x + 16 - hw, b - 42 + j, hw * 2, 1, j % 9 === 6 ? C.band : '#c26a3c'); rect(ctx, x + 16 - hw, b - 42 + j, 2, 1, '#d9895b'); }
    rect(ctx, x + 11, b - 44, 10, 3, ink); rect(ctx, x + 12, b - 43, 8, 1, '#d9895b');
  },
  tapestry(ctx, x, b, C) { // a woven hanging on a stand
    rect(ctx, x + 2, b - 44, 2, 44, C.woodD); rect(ctx, x + 28, b - 44, 2, 44, C.woodD); rect(ctx, x + 1, b - 46, 30, 3, ink); rect(ctx, x + 2, b - 45, 28, 1, C.woodL);
    rect(ctx, x + 5, b - 43, 22, 34, ink);
    for (let j = 0; j < 32; j++) for (let i = 0; i < 20; i++) { const d = Math.abs(i - 9.5) + Math.abs(j - 15.5) * 0.6; px(ctx, x + 6 + i, b - 42 + j, d < 4 ? C.accent : d < 7 ? C.band : (i + j) % 4 === 0 ? darken(C.dye, 0.2) : C.dye); }
    for (let i = 0; i < 6; i++) rect(ctx, x + 7 + i * 4, b - 9, 1, 3, C.band);
  },
  bigpress(ctx, x, b, C) { // a printing press
    rect(ctx, x + 3, b - 44, 4, 44, ink); rect(ctx, x + 25, b - 44, 4, 44, ink); rect(ctx, x + 4, b - 43, 2, 43, '#3d3a46'); rect(ctx, x + 26, b - 43, 2, 43, '#3d3a46');
    rect(ctx, x + 2, b - 46, 28, 5, ink); rect(ctx, x + 3, b - 45, 26, 3, '#4a4652');
    rect(ctx, x + 15, b - 41, 2, 12, P.metal); rect(ctx, x + 8, b - 36, 16, 2, P.metalDark); ellipse(ctx, x + 24, b - 35, 2, 2, '#c9a440');
    rect(ctx, x + 6, b - 29, 20, 5, ink); rect(ctx, x + 7, b - 28, 18, 3, P.metal);
    rect(ctx, x + 4, b - 18, 24, 4, ink); rect(ctx, x + 5, b - 17, 22, 2, '#fbf8ef'); rect(ctx, x + 7, b - 17, 10, 1, ink);
    rect(ctx, x + 2, b - 12, 28, 3, C.woodD);
  },
};

// The signature, with the concept's emblem when it has one (pedestal, display case or banner).
export function paintSignature(ctx, s, C, dark) {
  const x0 = s.x * 16, b = (s.y + 1) * 16 - 1, W = s.fw * 16, x = x0 + (W - 32) / 2, acc = C.accent;
  // the plinth: the place of honour, as wide as the footprint
  rect(ctx, x0 + 1, b - 3, W - 2, 4, ink); rect(ctx, x0 + 2, b - 2, W - 4, 2, dark ? '#3d3945' : darken(C.band, 0.15)); rect(ctx, x0 + 2, b - 2, W - 4, 1, dark ? '#4a4652' : lighten(C.band, 0.2));
  const bb = b - 3;
  // objects taller than SIG_TOP are set down into the plinth, so the concept's name fits above them
  const fn = s.emblem ? (c, X, B, CC) => EMBLEM_FORMS[s.form] ? EMBLEM_FORMS[s.form](c, X, B, CC, s.emblem, dark) : EMBLEM_FORMS.pedestal(c, X, B, CC, s.emblem, dark) : SIGNATURES[s.object] || SIGNATURES.hourglass;
  const d = Math.max(0, topOf(fn, s.emblem ? `${s.form}` : s.object) - SIG_TOP);
  ctx.save(); ctx.translate(0, d); fn(ctx, x, bb, C); ctx.restore();
  if (d) { rect(ctx, x0 + 1, b - 1, W - 2, 2, ink); rect(ctx, x0 + 2, b - 1, W - 4, 1, dark ? '#3d3945' : darken(C.band, 0.15)); }
}
// The concept's emblem, shown big: on a pedestal (stone in a cave), in a display case, on a banner.
const EMBLEM_FORMS = {
  case(ctx, x, bb, C, e) {
    box(ctx, x + 1, bb - 12, 30, 12, C.woodD); rect(ctx, x + 2, bb - 11, 28, 2, C.woodL);
    box(ctx, x + 2, bb - 42, 28, 31, '#bfe3ee'); rect(ctx, x + 3, bb - 41, 26, 29, '#2a3352');
    drawEmblem(ctx, e, x + 3, bb - 39, 3, C.accent); rect(ctx, x + 4, bb - 40, 1, 26, 'rgba(255,255,255,0.35)');
  },
  banner(ctx, x, bb, C, e) {
    rect(ctx, x + 3, bb - 42, 2, 42, C.woodD); rect(ctx, x + 27, bb - 42, 2, 42, C.woodD); rect(ctx, x + 2, bb - 43, 28, 3, ink); rect(ctx, x + 3, bb - 42, 26, 1, C.woodL);
    rect(ctx, x + 5, bb - 40, 22, 33, ink); rect(ctx, x + 6, bb - 40, 20, 31, C.band);
    for (let i = 0; i < 5; i++) px(ctx, x + 6 + i * 4, bb - 9 + (i % 2), ink);
    drawEmblem(ctx, e, x + 7, bb - 34, 2, C.accent); rect(ctx, x + 6, bb - 38, 20, 1, lighten(C.band, 0.35));
  },
  pedestal(ctx, x, bb, C, e, dark) {
    box(ctx, x + 7, bb - 14, 18, 14, dark ? '#5a5563' : C.stoneL); rect(ctx, x + 8, bb - 13, 16, 2, dark ? '#6e6878' : lighten(C.stone, 0.55));
    box(ctx, x + 2, bb - 42, 29, 29, dark ? '#2b2833' : darken(C.band, 0.45));
    drawEmblem(ctx, e, x + 3, bb - 40, 3, darken(C.accent, 0.45)); drawEmblem(ctx, e, x + 3, bb - 41, 3, C.accent);
  },
};
const SIG_TOP = 42, tops = new Map();
function topOf(fn, key) { // how far above its base a painter draws: measured once with a recording context
  if (!tops.has(key)) { let min = 0; const rec = { fillStyle: '', fillRect(x, y, w, h) { if (w > 0 && h > 0) min = Math.min(min, y); }, clearRect() {}, save() {}, restore() {}, translate() {} }; fn(rec, 0, 0, new Proxy({}, { get: () => '#808080' })); tops.set(key, -min); }
  return tops.get(key);
}
