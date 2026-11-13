// Obstacles drawn in code, in the game's own style (dark outline, light from the upper left).
// Each kind has a closed look and an open look; icons show what will open it one day.
import { makeCanvas, rect, px, ellipse } from '../../art/px.js';

const INK = '#1b1a2b';
const box = (ctx, x, y, w, h, fill) => { rect(ctx, x, y, w, h, INK); rect(ctx, x + 1, y + 1, w - 2, h - 2, fill); };
const WOOD = ['#5e3e27', '#8c5b3a', '#b07a4f', '#d39b6a'], STONE = ['#4f4a57', '#7b7685', '#9d98a6', '#c4bfcb'], LEAF = ['#1f3d22', '#2c5a30', '#3b7239', '#4f9447'];

function padlock(ctx, x, y) { // 7 x 8
  rect(ctx, x + 1, y, 5, 1, INK); rect(ctx, x, y + 1, 1, 3, INK); rect(ctx, x + 6, y + 1, 1, 3, INK); rect(ctx, x + 1, y + 1, 1, 2, '#c9ccd6'); rect(ctx, x + 5, y + 1, 1, 2, '#9aa0b0');
  box(ctx, x, y + 3, 7, 5, '#e0a93a'); rect(ctx, x + 1, y + 4, 2, 1, '#ffd77a'); px(ctx, x + 3, y + 5, INK); px(ctx, x + 3, y + 6, INK);
}

const PAINT = {
  boulder: { w: 16, h: 18, closed(ctx) {
    ellipse(ctx, 8, 16, 7, 2, 'rgba(20,18,40,0.3)');
    ellipse(ctx, 8, 10, 8, 7, INK); ellipse(ctx, 8, 10, 7, 6, STONE[1]); ellipse(ctx, 6, 8, 5, 4, STONE[2]); ellipse(ctx, 5, 6, 2, 2, STONE[3]);
    rect(ctx, 9, 7, 1, 3, STONE[0]); rect(ctx, 10, 9, 1, 3, STONE[0]); rect(ctx, 11, 12, 1, 2, STONE[0]); rect(ctx, 2, 13, 12, 2, STONE[0]); ellipse(ctx, 12, 5, 2, 1, LEAF[3]);
  }, open(ctx) {
    [[3, 13, 3], [9, 14, 2], [12, 12, 2], [6, 11, 2]].forEach(([x, y, r]) => { ellipse(ctx, x, y, r + 1, r, INK); ellipse(ctx, x, y, r, r - 1, STONE[2]); px(ctx, x - 1, y - 1, STONE[3]); });
  } },
  log: { w: 16, h: 14, closed(ctx) {
    ellipse(ctx, 8, 12, 8, 2, 'rgba(20,18,40,0.3)');
    rect(ctx, 0, 4, 16, 8, INK); rect(ctx, 0, 5, 16, 6, WOOD[1]); rect(ctx, 0, 5, 16, 2, WOOD[2]); for (let x = 1; x < 14; x += 4) rect(ctx, x, 8, 3, 1, WOOD[0]);
    ellipse(ctx, 13, 8, 3, 4, INK); ellipse(ctx, 13, 8, 2, 3, WOOD[3]); px(ctx, 13, 8, WOOD[1]); rect(ctx, 2, 3, 5, 2, LEAF[3]); rect(ctx, 3, 2, 2, 1, LEAF[2]); rect(ctx, 6, 1, 1, 3, WOOD[0]); px(ctx, 7, 1, LEAF[3]);
  }, open(ctx) {
    for (const x0 of [0, 11]) { rect(ctx, x0, 6, 5, 6, INK); rect(ctx, x0 + 1, 7, 3, 4, WOOD[1]); ellipse(ctx, x0 + 2, 7, 2, 1, WOOD[3]); }
    rect(ctx, 6, 11, 4, 1, '#d6b98a');
  } },
  thicket: { w: 16, h: 18, closed(ctx) {
    ellipse(ctx, 8, 16, 8, 2, 'rgba(20,18,40,0.3)');
    [[4, 11, 5], [11, 11, 5], [8, 7, 6]].forEach(([x, y, r]) => ellipse(ctx, x, y, r, r - 1, INK));
    [[4, 11, 4], [11, 11, 4], [8, 7, 5]].forEach(([x, y, r], k) => ellipse(ctx, x, y, r, r - 1, LEAF[1 + (k % 2)]));
    ellipse(ctx, 6, 5, 2, 1, LEAF[3]);
    for (const [x, y] of [[2, 9], [13, 8], [7, 3], [10, 13], [4, 14], [12, 4]]) { px(ctx, x, y, '#e8e2c9'); px(ctx, x + 1, y - 1, INK); }
    for (const [x, y] of [[5, 9], [10, 6], [12, 12], [7, 12]]) { px(ctx, x, y, '#5a2a6a'); px(ctx, x + 1, y, '#8a4aa0'); }
  }, open(ctx) {
    for (const x of [2, 7, 12]) { rect(ctx, x, 12, 3, 3, INK); rect(ctx, x + 1, 12, 1, 2, LEAF[2]); }
  } },
  gate: { w: 16, h: 20, closed(ctx) {
    rect(ctx, 0, 2, 3, 18, INK); rect(ctx, 1, 3, 1, 16, WOOD[2]); rect(ctx, 13, 2, 3, 18, INK); rect(ctx, 14, 3, 1, 16, WOOD[2]);
    rect(ctx, 3, 6, 10, 12, INK); for (let x = 4; x < 13; x += 3) { rect(ctx, x, 7, 2, 10, WOOD[1]); rect(ctx, x, 7, 1, 10, WOOD[2]); }
    rect(ctx, 3, 9, 10, 1, WOOD[0]); rect(ctx, 3, 14, 10, 1, WOOD[0]); padlock(ctx, 5, 9);
  }, open(ctx) {
    rect(ctx, 0, 2, 3, 18, INK); rect(ctx, 1, 3, 1, 16, WOOD[2]); rect(ctx, 13, 2, 3, 18, INK); rect(ctx, 14, 3, 1, 16, WOOD[2]);
    rect(ctx, 3, 6, 3, 12, INK); rect(ctx, 4, 7, 1, 10, WOOD[2]);
  } },
  hatch: { w: 16, h: 16, closed(ctx) {
    box(ctx, 1, 3, 14, 12, STONE[1]); box(ctx, 2, 4, 12, 10, WOOD[1]); rect(ctx, 8, 4, 1, 10, INK); for (const y of [6, 9, 12]) rect(ctx, 3, y, 10, 1, WOOD[0]);
    rect(ctx, 3, 5, 4, 1, WOOD[3]); rect(ctx, 6, 8, 5, 2, '#9aa0b0'); padlock(ctx, 5, 8);
  }, open(ctx) {
    box(ctx, 1, 3, 14, 12, STONE[1]); rect(ctx, 2, 4, 12, 10, '#0d0b14'); for (let k = 0; k < 3; k++) rect(ctx, 3, 6 + k * 3, 10, 1, STONE[0]);
    rect(ctx, 1, 0, 6, 4, INK); rect(ctx, 2, 1, 4, 2, WOOD[2]); rect(ctx, 9, 0, 6, 4, INK); rect(ctx, 10, 1, 4, 2, WOOD[2]);
  } },
  closet: { w: 14, h: 24, closed(ctx) {
    box(ctx, 0, 0, 14, 24, '#3a2b1d'); box(ctx, 1, 1, 12, 23, WOOD[1]); rect(ctx, 2, 2, 10, 1, WOOD[2]); rect(ctx, 2, 6, 10, 1, WOOD[0]); rect(ctx, 2, 14, 10, 1, WOOD[0]);
    rect(ctx, 6, 3, 2, 2, '#0d0b14'); padlock(ctx, 4, 11);
  }, open(ctx) {
    box(ctx, 0, 0, 14, 24, '#3a2b1d'); rect(ctx, 1, 1, 12, 23, '#0d0b14'); rect(ctx, 1, 1, 3, 23, WOOD[1]); rect(ctx, 1, 1, 1, 23, WOOD[2]); px(ctx, 9, 15, '#ffd77a');
  } },
};
export const OBSTACLE_ART = PAINT;

export function obstacleTexture(kind, open = false) {
  const P = PAINT[kind], [c, ctx] = makeCanvas(P.w, P.h);
  (open ? P.open : P.closed)(ctx);
  return c;
}

// The "not yet" marker: a padlock in a little bubble, with the tool that will open it.
const TOOL = {
  key(ctx, x, y) { ellipse(ctx, x + 2, y + 2, 2, 2, INK); px(ctx, x + 2, y + 2, '#e0a93a'); rect(ctx, x + 3, y + 2, 5, 1, INK); rect(ctx, x + 6, y + 3, 1, 2, INK); rect(ctx, x + 2, y + 1, 1, 1, '#ffd77a'); },
  pickaxe(ctx, x, y) { rect(ctx, x, y + 1, 8, 2, INK); rect(ctx, x + 1, y + 1, 6, 1, '#c9ccd6'); rect(ctx, x + 3, y + 3, 2, 5, INK); rect(ctx, x + 3, y + 3, 1, 5, WOOD[2]); },
  saw(ctx, x, y) { rect(ctx, x, y + 2, 7, 3, INK); rect(ctx, x + 1, y + 2, 5, 2, '#c9ccd6'); for (let i = 1; i < 7; i += 2) px(ctx, x + i, y + 5, INK); rect(ctx, x + 6, y + 1, 3, 4, WOOD[1]); },
  shears(ctx, x, y) { rect(ctx, x + 1, y, 1, 5, INK); rect(ctx, x + 5, y, 1, 5, INK); rect(ctx, x + 2, y + 4, 3, 1, INK); ellipse(ctx, x + 1, y + 7, 1, 1, '#d4553f'); ellipse(ctx, x + 5, y + 7, 1, 1, '#d4553f'); },
};
export function markerTexture(tool) {
  const [c, ctx] = makeCanvas(22, 14);
  rect(ctx, 1, 0, 20, 13, INK); rect(ctx, 0, 1, 22, 11, INK); rect(ctx, 1, 1, 20, 11, '#f3efe4'); rect(ctx, 9, 13, 3, 1, INK);
  padlock(ctx, 2, 2); (TOOL[tool] || TOOL.key)(ctx, 11, 2);
  return c;
}

// What waits behind (placeholders today)
export function rewardTexture(kind) {
  const [c, ctx] = makeCanvas(16, 16);
  if (kind === 'chest') { box(ctx, 2, 6, 12, 9, WOOD[1]); rect(ctx, 3, 7, 10, 2, WOOD[2]); rect(ctx, 2, 9, 12, 1, INK); rect(ctx, 7, 9, 2, 3, '#e0a93a'); rect(ctx, 3, 6, 2, 9, '#c9a24a'); rect(ctx, 11, 6, 2, 9, '#c9a24a'); }
  else if (kind === 'glint') { rect(ctx, 7, 3, 2, 11, '#fff6c8'); rect(ctx, 3, 8, 10, 1, '#fff6c8'); px(ctx, 8, 8, '#ffffff'); ellipse(ctx, 8, 13, 3, 1, 'rgba(20,18,40,0.3)'); }
  else { rect(ctx, 7, 8, 2, 7, INK); rect(ctx, 7, 9, 1, 5, LEAF[3]); ellipse(ctx, 8, 6, 5, 3, INK); ellipse(ctx, 8, 6, 4, 2, '#7be0d0'); px(ctx, 6, 5, '#e8fffa'); px(ctx, 10, 6, '#e8fffa'); }
  return c;
}
