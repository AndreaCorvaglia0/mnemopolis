// Buildings. Each one gets a day texture plus a "lit" overlay for windows at dusk.
import { STORY } from '../mechanics/story/config.js';
import { paintLighthouse } from '../mechanics/story/art.js';
import { P } from './palette.js';
import { makeCanvas, rect, px, ellipse, hash, mix, addTex } from './px.js';
import { GEN } from '../gen/core.js';
import { paintFacade } from '../gen/facade.js';

// 3x5 pixel font for signboards
const G = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'], ' ': ['...', '...', '...', '...', '...'],
  '-': ['...', '...', '###', '...', '...'], '.': ['...', '...', '...', '...', '.#.'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
  6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '##.'],
};

export function textWidth(s) { return s.length * 4 - 1; }

export function drawText(ctx, s, x, y, col) {
  ctx.fillStyle = col;
  x = Math.round(x); y = Math.round(y);
  [...s.toUpperCase()].forEach((ch, i) => {
    const g = G[ch] || G[' '];
    g.forEach((row, ry) => [...row].forEach((c, rx) => { if (c === '#') ctx.fillRect(x + i * 4 + rx, y + ry, 1, 1); }));
  });
}

function plaque(ctx, text, cx, y, bg, fg, border = P.ink) {
  const w = textWidth(text) + 6;
  const x = Math.round(cx - w / 2);
  rect(ctx, x, y, w, 9, border);
  rect(ctx, x + 1, y + 1, w - 2, 7, bg);
  drawText(ctx, text, x + 3, y + 2, fg);
}

function gableRoof(ctx, x, y, w, h, base, dark, light) {
  rect(ctx, x, y, w, h, dark);
  for (let r = 0; r < h - 3; r += 4) {
    const off = (r / 4) % 2 ? 4 : 0;
    rect(ctx, x + 1, y + r + 1, w - 2, 3, base);
    for (let k = x + 1 + off; k < x + w - 1; k += 8) rect(ctx, k, y + r + 1, 1, 3, dark);
    rect(ctx, x + 1, y + r + 1, w - 2, 1, mix(base, light, 0.45));
  }
  rect(ctx, x + 1, y + 1, w - 2, 2, light); // ridge
  rect(ctx, x, y + h - 2, w, 2, P.ink); // eave line
}

function wall(ctx, x, y, w, h, col, shade, siding = true) {
  rect(ctx, x, y, w, h, col);
  if (siding) for (let k = y + 3; k < y + h - 3; k += 4) rect(ctx, x, k, w, 1, mix(col, shade, 0.5));
  rect(ctx, x, y, w, 2, shade); // shadow under the eave
  rect(ctx, x, y + h - 3, w, 3, P.boneFace); // stone base
  rect(ctx, x, y + h - 3, w, 1, P.boneMid);
  rect(ctx, x, y, 1, h, P.ink); rect(ctx, x + w - 1, y, 1, h, P.ink);
}

function window(ctx, lit, x, y, w = 10, h = 9, frame = P.wallWhite) {
  rect(ctx, x - 1, y - 1, w + 2, h + 2, P.ink);
  rect(ctx, x, y, w, h, frame);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, P.window);
  rect(ctx, x + 1, y + 1, w - 2, 2, mix(P.window, P.glass, 0.6));
  rect(ctx, x + Math.floor(w / 2), y + 1, 1, h - 2, frame);
  rect(ctx, x + 1, y + Math.floor(h / 2), w - 2, 1, frame);
  if (lit) {
    lit.fillStyle = P.windowLit;
    lit.fillRect(x + 1, y + 1, w - 2, h - 2);
    lit.fillStyle = P.windowLitHot;
    lit.fillRect(x + 2, y + 2, w - 4, Math.max(1, Math.floor(h / 2) - 2));
    lit.fillStyle = frame;
    lit.fillRect(x + Math.floor(w / 2), y + 1, 1, h - 2);
    lit.fillRect(x + 1, y + Math.floor(h / 2), w - 2, 1);
  }
}

function woodDoor(ctx, x, y, w = 10, h = 15) {
  rect(ctx, x - 1, y - 1, w + 2, h + 1, P.ink);
  rect(ctx, x, y, w, h, P.woodDark);
  rect(ctx, x + 1, y + 1, w - 2, h - 1, P.wood);
  for (let k = x + 2; k < x + w - 1; k += 3) rect(ctx, k, y + 1, 1, h - 1, P.woodDark);
  px(ctx, x + w - 3, y + Math.floor(h / 2), P.gold);
}

function glassDoor(ctx, lit, x, y, w, h) {
  rect(ctx, x - 1, y - 1, w + 2, h + 1, P.ink);
  rect(ctx, x, y, w, h, P.metal);
  rect(ctx, x + 1, y + 1, w - 2, h - 1, P.glass);
  rect(ctx, x + Math.floor(w / 2), y + 1, 1, h - 1, P.metal);
  for (let k = 0; k < 4; k++) px(ctx, x + 2 + k, y + 2 + k, '#d8f1fa');
  if (lit) { lit.fillStyle = P.windowLit; lit.fillRect(x + 1, y + 1, w - 2, h - 1); lit.fillStyle = P.metal; lit.fillRect(x + Math.floor(w / 2), y + 1, 1, h - 1); }
}

function step(ctx, x, y, w) { rect(ctx, x - 2, y, w + 4, 2, P.boneMid); rect(ctx, x - 2, y, w + 4, 1, P.boneLight); }

// Each painter returns { canvas, lit, glows: [[x,y,kind]] } for a footprint of w x h tiles (+1 tile of roof above)
function cottage(b, roof) {
  const W = b.w * 16, H = b.h * 16 + 16;
  const [c, ctx] = makeCanvas(W, H), [l, lit] = makeCanvas(W, H);
  const roofH = Math.round(H * 0.5);
  wall(ctx, 2, roofH - 2, W - 4, H - roofH + 2, P.wallCream, P.wallShade);
  gableRoof(ctx, 0, 0, W, roofH, roof[0], roof[1], roof[2]);
  rect(ctx, W - 16, 2, 6, 8, '#8c4a3a'); rect(ctx, W - 16, 2, 6, 2, '#6a3328'); // chimney
  const dx = (b.doors[0][0] - b.x) * 16 + 3;
  woodDoor(ctx, dx, H - 17);
  step(ctx, dx, H - 2, 10);
  const glows = [];
  for (let t = 0; t < b.w; t++) {
    const wx = t * 16 + 3;
    if (Math.abs(wx - dx) < 12) continue;
    window(ctx, lit, wx, roofH + 6);
    glows.push([wx + 5, roofH + 10, 'warm']);
  }
  // flower box under the first window
  rect(ctx, 3, roofH + 16, 10, 2, P.woodDark);
  [4, 6, 8, 10, 12].forEach((x, i) => px(ctx, x, roofH + 15, i % 2 ? P.flowerRed : P.flowerYellow));
  return { canvas: c, lit: l, glows };
}

function scannerHall(b) {
  const W = b.w * 16, H = b.h * 16 + 16;
  const [c, ctx] = makeCanvas(W, H), [l, lit] = makeCanvas(W, H);
  const roofH = 46;
  // flat roof
  rect(ctx, 0, 0, W, roofH, P.ink);
  rect(ctx, 1, 1, W - 2, roofH - 2, '#cfd4d6');
  for (let y = 4; y < roofH - 3; y += 6) rect(ctx, 2, y, W - 4, 1, '#bcc2c5');
  rect(ctx, 1, roofH - 5, W - 2, 3, P.roofTeal);
  rect(ctx, 1, roofH - 5, W - 2, 1, P.roofTealLight);
  // gantry ring on the roof
  const cx = W / 2, cy = 21;
  for (let y = -18; y <= 18; y++) for (let x = -18; x <= 18; x++) {
    const r = Math.sqrt(x * x + y * y * 1.6);
    if (r <= 17 && r >= 9.5) {
      let col = r > 15.5 ? P.ink : r < 11 ? P.roofTealDark : '#f4f6f6';
      if (r >= 11 && r <= 15.5) col = x - y < -6 ? '#ffffff' : x - y > 8 ? '#c9d2d4' : '#e9eeee';
      px(ctx, cx + x, cy + y, col);
    }
    if (r < 9.5 && r > 8.5) px(ctx, cx + x, cy + y, P.ink);
  }
  rect(ctx, cx - 14, cy + 9, 28, 4, '#9aa6ab'); // base of the ring
  rect(ctx, cx - 14, cy + 9, 28, 1, '#c3ccd0');
  // ring glow on the lit layer
  for (let y = -12; y <= 12; y++) for (let x = -12; x <= 12; x++) {
    const r = Math.sqrt(x * x + y * y * 1.6);
    if (r >= 9.5 && r <= 11) { lit.fillStyle = '#7ff3e6'; lit.fillRect(cx + x, cy + y, 1, 1); }
  }
  // facade
  wall(ctx, 0, roofH, W, H - roofH, P.wallWhite, '#d5dadb', false);
  rect(ctx, 0, roofH, W, 9, P.roofTeal);
  rect(ctx, 0, roofH + 8, W, 1, P.roofTealDark);
  plaque(ctx, b.label || 'STUDIO', W / 2, roofH + 0, P.roofTeal, '#ffffff', P.roofTeal);
  const dx = (b.doors[0][0] - b.x) * 16;
  // window strips
  const glows = [];
  [[4, dx - 6], [dx + 22, W - 5]].forEach(([x0, x1]) => {
    for (let x = x0; x + 10 <= x1; x += 12) { window(ctx, lit, x, roofH + 14, 10, 12, '#e8eef0'); glows.push([x + 5, roofH + 20, 'warm']); }
  });
  glassDoor(ctx, lit, dx + 1, H - 22, 14, 21);
  rect(ctx, dx - 1, H - 25, 18, 2, P.roofTealDark);
  step(ctx, dx + 1, H - 2, 14);
  glows.push([cx, cy, 'teal'], [dx + 8, H - 12, 'warm']);
  return { canvas: c, lit: l, glows };
}

function taskHall(b) {
  const W = b.w * 16, H = b.h * 16 + 16;
  const [c, ctx] = makeCanvas(W, H), [l, lit] = makeCanvas(W, H);
  const roofH = 46;
  // brick walls
  rect(ctx, 0, roofH - 2, W, H - roofH + 2, '#a8553f');
  for (let y = roofH; y < H - 3; y += 4) {
    rect(ctx, 0, y, W, 1, '#7d3c2c');
    const off = ((y - roofH) / 4) % 2 ? 4 : 0;
    for (let x = off; x < W; x += 8) rect(ctx, x, y + 1, 1, 3, '#7d3c2c');
  }
  for (let y = roofH + 1; y < H - 3; y += 4) for (let x = 0; x < W; x += 8) if (hash(x, y, 2) > 0.6) rect(ctx, x + 1, y, 6, 3, '#b8634a');
  rect(ctx, 0, H - 3, W, 3, P.boneFace);
  rect(ctx, 0, roofH - 2, 1, H - roofH + 2, P.ink); rect(ctx, W - 1, roofH - 2, 1, H - roofH + 2, P.ink);
  gableRoof(ctx, 0, 0, W, roofH, P.roofOrange, P.roofOrangeDark, P.roofOrangeLight);
  // roof sign
  const sx = W / 2 - 30, sy = 9;
  rect(ctx, sx, sy, 60, 24, P.ink);
  rect(ctx, sx + 1, sy + 1, 58, 22, '#f6f1e3');
  // a balance: this is the house of choices and trade-offs
  const bx = sx + 30, by = sy + 4;
  rect(ctx, bx - 1, by, 2, 15, P.roofOrangeDark); rect(ctx, bx - 7, by + 15, 14, 2, P.roofOrangeDark); rect(ctx, bx - 20, by + 2, 40, 2, P.roofOrangeDark); rect(ctx, bx - 2, by - 1, 4, 4, P.gold);
  [-19, 19].forEach((o, k) => { rect(ctx, bx + o, by + 4, 1, 6 + k * 2, P.ink); rect(ctx, bx + o - 6, by + 10 + k * 2, 13, 2, P.ink); rect(ctx, bx + o - 5, by + 11 + k * 2, 11, 2, k ? P.teal : P.gold); });
  plaque(ctx, b.label || 'HALL', W / 2, roofH + 2, '#f6f1e3', P.roofOrangeDark);
  const dx = (b.doors[0][0] - b.x) * 16;
  const glows = [];
  for (let t = 0; t < b.w; t++) {
    const wx = t * 16 + 3;
    if (t * 16 === dx) continue;
    window(ctx, lit, wx, roofH + 16, 10, 11, '#f6f1e3');
    glows.push([wx + 5, roofH + 21, 'warm']);
  }
  woodDoor(ctx, dx + 2, H - 19, 12, 18);
  rect(ctx, dx, H - 22, 16, 2, P.roofOrangeDark);
  step(ctx, dx + 2, H - 2, 12);
  return { canvas: c, lit: l, glows };
}

function hospital(b) {
  const W = b.w * 16, H = b.h * 16 + 16;
  const [c, ctx] = makeCanvas(W, H), [l, lit] = makeCanvas(W, H);
  const roofH = 48;
  rect(ctx, 0, 0, W, roofH, P.ink);
  rect(ctx, 1, 1, W - 2, roofH - 2, P.roofBlue);
  for (let y = 4; y < roofH - 3; y += 5) rect(ctx, 2, y, W - 4, 1, P.roofBlueDark);
  rect(ctx, 1, 1, W - 2, 2, P.roofBlueLight);
  const cx = W / 2, cy = 22;
  ellipse(ctx, cx, cy, 17, 13, '#f3f2ec'); ellipse(ctx, cx, cy, 15, 11, '#4b6db3');
  // a laurel-and-star emblem: this is the league hall, where the course is checked
  for (let k = 0; k < 5; k++) { const a1 = -Math.PI / 2 + (k * 2 * Math.PI) / 5; for (let r = 0; r < 8; r++) rect(ctx, Math.round(cx + Math.cos(a1) * r) - 1, Math.round(cy + Math.sin(a1) * r) - 1, 3, 3, P.gold); }
  rect(ctx, cx - 3, cy - 3, 7, 7, P.gold);
  // facade
  wall(ctx, 0, roofH, W, H - roofH, P.wallWhite, '#d8dcdd', false);
  rect(ctx, 0, roofH, W, 10, '#2a8c87'); rect(ctx, 0, roofH + 9, W, 1, '#1d6764');
  plaque(ctx, b.label || 'LEAGUE', W / 2, roofH + 1, '#2a8c87', '#ffffff', '#2a8c87');
  const glows = [];
  for (let t = 0; t < b.w; t++) {
    if (t === 3 || t === 4) continue;
    window(ctx, lit, t * 16 + 3, roofH + 14, 10, 10, '#e8eef0');
    glows.push([t * 16 + 8, roofH + 19, 'warm']);
  }
  const dx = (b.doors[0][0] - b.x) * 16;
  // canopy and double glass doors
  rect(ctx, dx - 4, H - 30, 40, 5, P.ink); rect(ctx, dx - 3, H - 29, 38, 3, '#2a8c87'); rect(ctx, dx - 3, H - 29, 38, 1, '#3fb0a9');
  glassDoor(ctx, lit, dx + 2, H - 23, 28, 22);
  step(ctx, dx + 2, H - 2, 28);
  glows.push([dx + 16, H - 12, 'warm']);
  return { canvas: c, lit: l, glows };
}

function banner(ctx, cx, y, text) {
  const w = textWidth(text) + 8;
  const x = Math.round(cx - w / 2);
  rect(ctx, x, y, w, 9, P.ink);
  rect(ctx, x + 1, y + 1, w - 2, 7, '#e0574f');
  drawText(ctx, text, x + 4, y + 2, '#fff4d6');
  rect(ctx, x - 2, y + 2, 2, 5, '#e0574f'); rect(ctx, x + w, y + 2, 2, 5, '#e0574f');
}

function archive(b) {
  const W = b.w * 16, H = b.h * 16 + 16;
  const [c, ctx] = makeCanvas(W, H), [l, lit] = makeCanvas(W, H);
  const roofH = 44;
  wall(ctx, 0, roofH - 2, W, H - roofH + 2, P.wallCream, P.wallShade, false);
  gableRoof(ctx, 0, 0, W, roofH, P.roofBrown, P.roofBrownDark, '#9c744f');
  // pediment
  for (let k = 0; k < 10; k++) rect(ctx, W / 2 - 18 + k * 2, roofH - 12 + 0 - k, 36 - k * 4, 1, k ? '#e9dfc7' : P.ink);
  plaque(ctx, b.label || 'ARCHIVE', W / 2, roofH + 1, '#f3ead6', P.roofBrownDark);
  // columns
  [6, 22, 54, 70].forEach((x) => { rect(ctx, x, roofH + 12, 5, H - roofH - 15, P.ink); rect(ctx, x + 1, roofH + 12, 3, H - roofH - 15, '#f6f1e6'); rect(ctx, x + 1, roofH + 12, 1, H - roofH - 15, '#ffffff'); });
  const dx = (b.doors[0][0] - b.x) * 16;
  woodDoor(ctx, dx + 3, H - 18, 10, 17);
  return { canvas: c, lit: l, glows: [] };
}

function geometryLab(b) {
  const W = b.w * 16, H = b.h * 16 + 16;
  const [c, ctx] = makeCanvas(W, H), [l, lit] = makeCanvas(W, H);
  const roofH = 44;
  rect(ctx, 0, 0, W, roofH, P.ink);
  rect(ctx, 1, 1, W - 2, roofH - 2, P.roofPurple);
  for (let x = 4; x < W - 2; x += 8) rect(ctx, x, 2, 1, roofH - 4, P.roofPurpleDark);
  for (let y = 4; y < roofH - 2; y += 8) rect(ctx, 2, y, W - 4, 1, P.roofPurpleDark);
  // wireframe cube
  const g = P.gold, o = [W / 2 - 9, 10];
  const line = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) px(ctx, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), g); };
  const [a, bb] = o;
  line(a, bb + 6, a + 12, bb + 6); line(a, bb + 18, a + 12, bb + 18); line(a, bb + 6, a, bb + 18); line(a + 12, bb + 6, a + 12, bb + 18);
  line(a + 6, bb, a + 18, bb); line(a + 6, bb + 12, a + 18, bb + 12); line(a + 6, bb, a + 6, bb + 12); line(a + 18, bb, a + 18, bb + 12);
  line(a, bb + 6, a + 6, bb); line(a + 12, bb + 6, a + 18, bb); line(a, bb + 18, a + 6, bb + 12); line(a + 12, bb + 18, a + 18, bb + 12);
  wall(ctx, 0, roofH, W, H - roofH, '#dcdbe3', '#c3c1cf', false);
  rect(ctx, 0, roofH, W, 9, P.roofPurple);
  plaque(ctx, b.label || 'LAB', W / 2, roofH, P.roofPurple, '#ffffff', P.roofPurple);
  const dx = (b.doors[0][0] - b.x) * 16;
  window(ctx, lit, 4, roofH + 16, 10, 10, '#eeeef3'); window(ctx, lit, W - 14, roofH + 16, 10, 10, '#eeeef3');
  woodDoor(ctx, dx + 3, H - 18, 10, 17);
  return { canvas: c, lit: l, glows: [] };
}

function lighthouse(b) {
  const W = b.w * 16, H = b.h * 16 + 16;
  const [c, ctx] = makeCanvas(W, H), [l, lit] = makeCanvas(W, H);
  const top = 30, bottom = H - 1;
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / (bottom - top);
    const half = Math.round(11 + t * 7);
    const x0 = W / 2 - half, x1 = W / 2 + half;
    const band = Math.floor((y - top) / 13) % 2 === 0;
    for (let x = x0; x <= x1; x++) {
      const u = (x - x0) / (x1 - x0);
      let col = band ? (u < 0.3 ? '#ffffff' : u > 0.72 ? '#cfc9bb' : P.wallWhite) : (u < 0.3 ? '#d65a4c' : u > 0.72 ? P.roofRedDark : P.roofRed);
      if (x === x0 || x === x1) col = P.ink;
      px(ctx, x, y, col);
    }
  }
  // gallery and lantern room
  rect(ctx, W / 2 - 15, 26, 30, 5, P.ink); rect(ctx, W / 2 - 14, 27, 28, 2, P.metal);
  for (let x = W / 2 - 14; x < W / 2 + 14; x += 3) rect(ctx, x, 22, 1, 5, P.metalDark);
  rect(ctx, W / 2 - 14, 21, 28, 1, P.metalDark);
  rect(ctx, W / 2 - 8, 10, 16, 13, P.ink);
  rect(ctx, W / 2 - 7, 11, 14, 11, '#ffe9a6');
  for (let x = W / 2 - 4; x < W / 2 + 7; x += 4) rect(ctx, x, 11, 1, 11, P.metalDark);
  rect(ctx, W / 2 - 7, 11, 14, 11, '#ffe9a6'); rect(ctx, W / 2 - 3, 13, 6, 6, '#fff8dc');
  ellipse(ctx, W / 2, 9, 9, 4, P.roofRedDark); ellipse(ctx, W / 2, 8, 8, 3, P.roofRed);
  rect(ctx, W / 2 - 1, 1, 2, 5, P.metalDark);
  lit.fillStyle = '#fff6d0'; lit.fillRect(W / 2 - 7, 11, 14, 11);
  // portholes
  [[W / 2, 52], [W / 2, 78]].forEach(([x, y]) => { ellipse(ctx, x, y, 3, 3, P.ink); ellipse(ctx, x, y, 2, 2, P.window); lit.fillStyle = P.windowLit; lit.fillRect(x - 1, y - 1, 3, 3); });
  // door
  const dx = (b.doors[0][0] - b.x) * 16;
  rect(ctx, dx + 2, H - 20, 12, 20, P.ink);
  rect(ctx, dx + 3, H - 19, 10, 19, P.woodDark);
  rect(ctx, dx + 4, H - 18, 8, 18, P.wood);
  ellipse(ctx, dx + 8, H - 19, 5, 2, P.ink);
  px(ctx, dx + 10, H - 9, P.gold);
  return { canvas: c, lit: l, glows: [[W / 2, 16, 'lantern'], [W / 2, 52, 'warm'], [W / 2, 78, 'warm']], beam: [W / 2, 16] };
}

function castle(b) {
  const W = b.w * 16, H = b.h * 16 + 16;
  const [c, ctx] = makeCanvas(W, H), [l, lit] = makeCanvas(W, H);
  const stone = (x, y, w, h, base, dark) => {
    rect(ctx, x, y, w, h, P.ink); rect(ctx, x + 1, y + 1, w - 2, h - 1, base);
    for (let yy = y + 6; yy < y + h; yy += 6) { rect(ctx, x + 1, yy, w - 2, 1, dark); for (let xx = x + 1 + (((yy - y) / 6) % 2) * 5; xx < x + w - 1; xx += 10) rect(ctx, xx, yy - 5, 1, 5, dark); }
    rect(ctx, x + 1, y + 1, w - 2, 1, '#bdb9c6');
  };
  const crenels = (x, y, w, base) => { for (let xx = x; xx < x + w - 3; xx += 8) { rect(ctx, xx, y - 6, 6, 7, P.ink); rect(ctx, xx + 1, y - 5, 4, 6, base); } };
  // curtain wall, then the two towers in front of it
  stone(20, 38, W - 40, H - 38, '#8f8b98', '#77737f'); crenels(22, 38, W - 42, '#8f8b98');
  stone(0, 14, 28, H - 14, '#9d99a6', '#827e8b'); crenels(1, 14, 28, '#9d99a6');
  stone(W - 28, 14, 28, H - 14, '#9d99a6', '#827e8b'); crenels(W - 27, 14, 28, '#9d99a6');
  // arrow slits and windows, lit from inside
  const slit = (x, y) => { rect(ctx, x, y, 4, 11, P.ink); rect(ctx, x + 1, y + 1, 2, 9, '#2b2620'); rect(lit, x + 1, y + 1, 2, 9, '#ffcf7a'); };
  slit(12, 30); slit(12, 62); slit(W - 16, 30); slit(W - 16, 62); slit(40, 52); slit(W - 44, 52);
  // gate with a portcullis
  const gx = (b.doors[0][0] - b.x) * 16 + 1, gw = 30, gy = H - 32;
  rect(ctx, gx - 2, gy - 4, gw + 4, 36, P.ink); rect(ctx, gx, gy + 4, gw, 28, '#2a1d14'); ellipse(ctx, gx + gw / 2, gy + 5, gw / 2, 7, '#2a1d14');
  rect(lit, gx + 2, gy + 6, gw - 4, 26, 'rgba(255,170,80,0.55)');
  for (let x = gx + 4; x < gx + gw; x += 6) rect(ctx, x, gy, 1, 22, '#15100b');
  for (let y = gy + 4; y < gy + 22; y += 6) rect(ctx, gx, y, gw, 1, '#15100b');
  plaque(ctx, b.label || 'MUSEUM', W / 2, gy - 16, '#3a2b1d', P.gold);
  // banners
  [34, W - 42].forEach((x) => { rect(ctx, x, 60, 8, 22, P.ink); rect(ctx, x + 1, 61, 6, 20, '#a8322d'); rect(ctx, x + 3, 66, 2, 8, P.gold); rect(ctx, x + 1, 80, 2, 2, '#8f8b98'); rect(ctx, x + 5, 80, 2, 2, '#8f8b98'); });
  // torch brackets by the gate
  [gx - 9, gx + gw + 8].forEach((x) => { rect(ctx, x - 1, gy + 8, 3, 7, '#2a2018'); rect(ctx, x - 2, gy + 6, 5, 2, '#5a4a36'); rect(ctx, x - 1, gy + 2, 3, 4, '#ffb347'); px(ctx, x, gy + 1, '#ffe58a'); rect(lit, x - 2, gy, 5, 6, '#ffe58a'); });
  return { canvas: c, lit: l, glows: [[gx - 9, gy + 3, 'warm'], [gx + gw + 8, gy + 3, 'warm'], [14, 36, 'warm'], [W - 14, 36, 'warm']] };
}

function workshop(b) {
  const W = b.w * 16, H = b.h * 16 + 16;
  const [c, ctx] = makeCanvas(W, H), [l, lit] = makeCanvas(W, H);
  const roofH = 40;
  // saw-tooth factory roof
  for (let t = 0; t < 3; t++) for (let k = 0; k < 32; k++) { const hh = Math.round(26 * (1 - k / 32)) + 6; rect(ctx, t * 32 + k, roofH - hh, 1, hh, k < 2 ? P.ink : k < 10 ? '#9fd3e6' : '#56606e'); if (k >= 2 && k < 10) rect(lit, t * 32 + k, roofH - hh + 2, 1, hh - 6, '#ffe9a8'); }
  rect(ctx, 0, roofH - 1, W, 2, P.ink);
  rect(ctx, 78, 0, 10, roofH - 6, P.ink); rect(ctx, 79, 1, 8, roofH - 8, '#8c4a3a'); rect(ctx, 78, 0, 10, 3, '#5a2f25');
  wall(ctx, 0, roofH, W, H - roofH, '#b8bec7', '#9aa1ad', false);
  rect(ctx, 0, roofH, W, 9, '#d9822f');
  plaque(ctx, b.label || 'WORKSHOP', W / 2, roofH, '#d9822f', '#ffffff', '#d9822f');
  const dx = (b.doors[0][0] - b.x) * 16;
  rect(ctx, dx - 4, H - 30, 24, 30, P.ink); rect(ctx, dx - 3, H - 29, 22, 29, '#4a5260'); for (let y = H - 27; y < H; y += 4) rect(ctx, dx - 3, y, 22, 1, '#363c47');
  rect(lit, dx - 3, H - 9, 22, 9, 'rgba(255,200,110,0.5)');
  window(ctx, lit, 6, roofH + 16, 12, 10, '#e8eef0'); window(ctx, lit, W - 20, roofH + 16, 12, 10, '#e8eef0');
  return { canvas: c, lit: l, glows: [[12, roofH + 21, 'warm'], [W - 14, roofH + 21, 'warm'], [dx + 8, H - 12, 'warm']] };
}

// A cave mouth in a rock mound: the optional deep dive of a district.
function cave(b) {
  const W = b.w * 16, H = b.h * 16 + 16;
  const [c, ctx] = makeCanvas(W, H), [l, lit] = makeCanvas(W, H);
  const dx = (b.doors[0][0] - b.x) * 16 + 8;
  for (let y = 4; y < H; y++) {
    const t = (y - 4) / (H - 4), half = Math.round((W / 2 - 2) * Math.sqrt(1 - (1 - t) * (1 - t)) * 0.98) + 1;
    for (let x = W / 2 - half; x < W / 2 + half; x++) {
      const n = hash(x >> 2, y >> 2, 31), edge = x < W / 2 - half + 2 || x >= W / 2 + half - 2 || y < 6;
      px(ctx, x, y, edge ? P.ink : n > 0.72 ? '#9a958c' : n > 0.35 ? '#857f77' : '#6f6a64');
    }
  }
  for (let k = 0; k < 9; k++) { const x = 8 + hash(k, 1, 7) * (W - 16), y = 18 + hash(k, 2, 7) * (H - 40); rect(ctx, x, y, 5 + hash(k, 3, 7) * 6, 1, '#5b5650'); }
  // the mouth
  for (let y = H - 26; y < H; y++) { const half = y < H - 18 ? Math.round(Math.sqrt(64 - (H - 18 - y) * (H - 18 - y)) * 1.25) : 10; rect(ctx, dx - half - 1, y, half * 2 + 2, 1, P.ink); rect(ctx, dx - half + 1, y, half * 2 - 2, 1, '#14111a'); }
  rect(lit, dx - 6, H - 8, 12, 8, 'rgba(255,190,100,0.35)');
  [dx - 16, dx + 14].forEach((x) => { rect(ctx, x, H - 22, 3, 12, P.ink); rect(ctx, x - 1, H - 27, 5, 6, P.ink); rect(ctx, x, H - 26, 3, 4, '#ffcf5a'); rect(lit, x, H - 26, 3, 4, '#fff3c4'); });
  plaque(ctx, b.label || 'CAVE', dx, H - 38, '#3a2b1d', P.gold);
  return { canvas: c, lit: l, glows: [[dx - 15, H - 24, 'warm'], [dx + 15, H - 24, 'warm']] };
}

// one painter per kind of building (see KINDS in world/townMap.js)
const PAINTERS = {
  lab: geometryLab, archive, hall: taskHall, studio: scannerHall, observatory: lighthouse, workshop, museum: castle, cave, league: hospital,
  cottage: (b) => cottage(b, [P.roofGreen, P.roofGreenDark, '#7ea55a']),
  // an expert's home, when the generated fronts are off: the cottage with a red roof and its name
  home: (b) => { const res = cottage(b, [P.roofRed, P.roofRedDark, '#d0675a']); const c = res.canvas.getContext('2d'); plaque(c, b.label || 'HOME', (b.doors[0][0] - b.x) * 16 + 8, res.canvas.height - 30, P.wallCream, P.ink); return res; },
};

// Paints one building of a given painter, for the gallery picture of `npm run shots`.
export function paintKind(paint, b) { return PAINTERS[paint](b).canvas; }

export function makeBuildings(scene, buildings) {
  const info = {};
  for (const b of buildings) {
    // generated houses when GEN.facade is on (gen/facade.js); these painters are the fallback
    // the story: the League hall is an unmarked lighthouse, dark until the end (mechanics/story/art.js)
    const res = (STORY.on && b.league && paintLighthouse(b)) || (GEN.facade && paintFacade(b)) || PAINTERS[b.paint](b);
    if (b.order) { // house number: the order of the learning path, visible from the street
      const ctx = res.canvas.getContext('2d'), H = res.canvas.height, t = String(b.order), w = textWidth(t) + 4;
      rect(ctx, 2, H - 10, w + 2, 9, P.ink); rect(ctx, 3, H - 9, w, 7, P.gold); drawText(ctx, t, 5, H - 8, P.ink);
    }
    addTex(scene, `bld-${b.id}`, res.canvas);
    addTex(scene, `bld-${b.id}-lit`, res.lit);
    info[b.id] = res;
  }
  return info;
}
