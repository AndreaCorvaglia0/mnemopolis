// Painters of the dressing pieces (see gen/dressing.js). Pixel art drawn in code: dark outline,
// light from the upper left, colours from the project THEME. Kept small and quiet on purpose:
// dressing is background and must never be louder than the houses.
//
//   FLAT[type](ctx, x, y, p, C)    x, y = top left of the tile, on the ground layer
//   TALL[type](ctx, x, b, p, C)    x = left edge, b = bottom edge of the piece, on a row strip
import { rect, px, ellipse, mix, hash, makeCanvas } from '../art/px.js';
import { P } from '../art/palette.js';
import { T, MAP_W, MAP_H } from '../world/townMap.js';

const INK = P.ink, STRIP = 48; // a standing piece may rise 32 px above its tile
const box = (ctx, x, y, w, h, fill, edge = INK) => { rect(ctx, x, y, w, h, edge); rect(ctx, x + 1, y + 1, w - 2, h - 2, fill); };
const shade = (c, t) => mix(c, t > 0 ? '#ffffff' : '#10121f', Math.abs(t));

export function colours(theme) {
  const D = theme.dressing, c = { ...D };
  c.wood = theme.wood; c.woodL = shade(theme.wood, 0.28); c.woodD = shade(theme.wood, -0.35);
  c.stone = theme.stone; c.stoneL = shade(theme.stone, 0.4); c.stoneLL = shade(theme.stone, 0.62); c.stoneD = shade(theme.stone, -0.3);
  c.paintD = shade(D.paint, -0.22); c.accent = theme.accent; c.roof = theme.roofs[0]; c.roofD = shade(theme.roofs[0], -0.3);
  c.leaf = ['#1f3d22', '#2c5a30', '#3b7239', '#4f9447', '#6fb05a'];
  c.soil = ['#4a3020', '#5e3e27', '#73502f'];
  c.kerb = [mix(P.cobbleDark, theme.stone, 0.4), mix(P.cobble, theme.stone, 0.3), mix(P.cobbleLight, theme.stone, 0.2)];
  return c;
}

// ---------------------------------------------------------------- flat pieces (ground layer)
const FLAT = {
  kerb(ctx, x, y, p, C) { // a border of dressed stones where grass meets a plaza
    const m = p.m, side = (k, fn) => { if (m & (1 << k)) fn(); };
    const run = (x0, y0, w, h, vert) => {
      rect(ctx, x0, y0, w, h, C.kerb[1]);
      const n = vert ? h : w;
      for (let i = 0; i < n; i += 5) { if (vert) { rect(ctx, x0, y0 + i, w, 1, C.kerb[0]); px(ctx, x0 + 1, y0 + i + 1, C.kerb[2]); } else { rect(ctx, x0 + i, y0, 1, h, C.kerb[0]); px(ctx, x0 + i + 1, y0, C.kerb[2]); } }
    };
    side(0, () => { run(x + 13, y, 3, 16, true); rect(ctx, x + 12, y, 1, 16, '#22301f'); });
    side(1, () => { run(x, y, 3, 16, true); rect(ctx, x + 3, y, 1, 16, '#22301f'); });
    side(2, () => { run(x, y + 13, 16, 3, false); rect(ctx, x, y + 12, 16, 1, '#22301f'); });
    side(3, () => { run(x, y, 16, 3, false); rect(ctx, x, y + 3, 16, 1, '#22301f'); });
  },
  steps(ctx, x, y, p, C) { // a flat stepping stone
    [[6 + (p.v & 1) * 3, 7 + (p.v >> 1) * 2, 4, 3]].forEach(([sx, sy, rx, ry]) => { ellipse(ctx, x + sx + 1, y + sy + 1, rx, ry, 'rgba(16,18,31,0.35)'); ellipse(ctx, x + sx, y + sy, rx, ry, C.stoneD); ellipse(ctx, x + sx, y + sy - 1, rx - 1, ry - 1, C.stoneL); px(ctx, x + sx - 1, y + sy - 1, C.stoneLL); });
  },
  pier(ctx, x, y, p, C) { // a plank jetty; walkable
    const v = p.dir === 'v';
    if (v) {
      rect(ctx, x + 1, y, 14, 16, INK);
      for (let j = 0; j < 16; j += 4) { rect(ctx, x + 2, y + j, 12, 3, hash(x, y + j, 3) > 0.5 ? C.woodL : C.wood); rect(ctx, x + 2, y + j + 3, 12, 1, C.woodD); }
      rect(ctx, x + 2, y, 1, 16, C.woodD);
      if (p.end) [[1, 12], [12, 12]].forEach(([a, b]) => { box(ctx, x + a, y + b, 3, 4, C.woodD); });
    } else {
      rect(ctx, x, y + 2, 16, 13, INK);
      for (let i = 0; i < 16; i += 4) { rect(ctx, x + i, y + 3, 3, 11, hash(x + i, y, 3) > 0.5 ? C.woodL : C.wood); rect(ctx, x + i + 3, y + 3, 1, 11, C.woodD); }
      rect(ctx, x, y + 3, 16, 1, C.woodL);
      rect(ctx, x, y + 13, 16, 1, C.woodD);
    }
    if (p.end) { const [a, b] = v ? [6, 13] : [12, 7]; px(ctx, x + a, y + b, '#d8c69a'); px(ctx, x + a + 1, y + b, '#b39a6a'); }
  },
  boat(ctx, x, y, p, C) { // a rowboat moored on the water
    const v = p.dir === 'v', hull = C.cloth[p.v % C.cloth.length], hullD = shade(hull, -0.35);
    const [cw, ch] = v ? [12, 28] : [28, 12], ox = x + (v ? 2 : 2), oy = y + (v ? 2 : 2);
    ellipse(ctx, ox + cw / 2 + 1, oy + ch / 2 + 2, cw / 2, ch / 2, 'rgba(10,20,40,0.35)');
    ellipse(ctx, ox + cw / 2, oy + ch / 2, cw / 2, ch / 2, INK);
    ellipse(ctx, ox + cw / 2, oy + ch / 2, cw / 2 - 1, ch / 2 - 1, hullD);
    ellipse(ctx, ox + cw / 2 - (v ? 0 : 0), oy + ch / 2 - 1, cw / 2 - 1, ch / 2 - 2, hull);
    ellipse(ctx, ox + cw / 2, oy + ch / 2, cw / 2 - 3, ch / 2 - 3, C.woodD);
    ellipse(ctx, ox + cw / 2, oy + ch / 2, cw / 2 - 4, ch / 2 - 4, C.wood);
    if (v) { [9, 17].forEach((k) => rect(ctx, ox + 2, oy + k, cw - 4, 2, C.woodL)); rect(ctx, ox + cw - 2, oy + 6, 1, 14, C.woodD); }
    else { [9, 17].forEach((k) => rect(ctx, ox + k, oy + 2, 2, ch - 4, C.woodL)); rect(ctx, ox + 6, oy + ch - 2, 14, 1, C.woodD); }
  },
  reeds(ctx, x, y, p, C) { // reeds and bulrushes along the bank
    const spots = [];
    const m = p.m;
    if (m & 8) for (let i = 0; i < 4; i++) spots.push([x + 2 + i * 4 + (hash(x, i, 1) * 2 | 0), y + 6 + (hash(y, i, 2) * 3 | 0)]);
    if (m & 4) for (let i = 0; i < 3; i++) spots.push([x + 3 + i * 5, y + 15]);
    if (m & 1) for (let i = 0; i < 3; i++) spots.push([x + 12 + (i & 1), y + 5 + i * 5]);
    if (m & 2) for (let i = 0; i < 3; i++) spots.push([x + 2 + (i & 1), y + 5 + i * 5]);
    spots.forEach(([sx, sy], i) => { // a clump: three stalks, a leaf, sometimes a bulrush
      for (let k = -1; k <= 1; k++) {
        const h = 4 + Math.floor(hash(sx + k, sy, 7) * 5) - Math.abs(k);
        rect(ctx, sx + k, sy - h, 1, h, k ? '#3f6b33' : '#5d8a3f');
        if (k === 0 && hash(sx, sy, 9) > 0.5) { rect(ctx, sx, sy - h - 3, 1, 3, '#5a3a22'); px(ctx, sx, sy - h - 3, '#7a5232'); }
      }
      px(ctx, sx - 2, sy - 2, '#5d8a3f'); px(ctx, sx + 2, sy - 3, '#7fae58');
      rect(ctx, sx - 1, sy, 3, 1, 'rgba(16,30,40,0.35)');
    });
  },
  border(ctx, x, y, p, C) { // a narrow flower border at the foot of a house front
    rect(ctx, x, y, 16, 4, p.mood === 'worked' ? C.soil[1] : '#2f6232');
    for (let i = 0; i < 5; i++) { const a = x + 1 + i * 3 + (p.v & 1), col = C.flowers[(i + p.v) % C.flowers.length]; rect(ctx, a, y + 1, 2, 2, '#3b7239'); if ((i + p.v) % (p.mood === 'worked' ? 3 : 2) === 0) { px(ctx, a, y + 1, col); px(ctx, a + 1, y + 2, shade(col, -0.25)); } }
    rect(ctx, x, y + 4, 16, 1, 'rgba(16,18,31,0.25)');
  },
  lily(ctx, x, y, p) {
    [[5, 6, 3], [10, 11, 2]].forEach(([a, b, r], i) => { ellipse(ctx, x + a, y + b, r + 1, r, '#2c5a30'); ellipse(ctx, x + a, y + b - 1, r, r - 1, '#4f9447'); px(ctx, x + a + 1, y + b - 1, '#2c5a30'); if (i === 0 && p.v < 2) { px(ctx, x + a - 1, y + b - 2, '#f5f1e6'); px(ctx, x + a, y + b - 2, p.v ? '#f2b8c6' : '#f5f1e6'); } });
  },
  bed(ctx, x, y, p, C) { // one tile of a bed inside a plot, laid out by the WFC
    const t = p.bed, F = C.flowers;
    if (t === 'lawn') { rect(ctx, x, y, 16, 16, '#3f7f3c'); for (let j = 0; j < 16; j += 4) rect(ctx, x, y + j, 16, 2, '#4a8c45'); return; }
    rect(ctx, x, y, 16, 16, C.soil[1]);
    for (let j = 1; j < 16; j += 5) { rect(ctx, x, y + j, 16, 1, C.soil[0]); rect(ctx, x, y + j + 1, 16, 1, C.soil[2]); }
    if (t === 'cabbage') for (const [a, b] of [[4, 5], [11, 5], [4, 12], [11, 12]]) { ellipse(ctx, x + a, y + b, 3, 2, '#2f5a3a'); ellipse(ctx, x + a, y + b - 1, 2, 2, '#6fa86a'); px(ctx, x + a - 1, y + b - 2, '#a6d48c'); }
    if (t === 'carrot') for (let i = 0; i < 4; i++) for (const b of [5, 12]) { const a = 2 + i * 4; px(ctx, x + a, y + b, '#e58a2c'); rect(ctx, x + a - 1, y + b - 3, 3, 2, '#4f9447'); px(ctx, x + a, y + b - 4, '#6fb05a'); }
    if (t.startsWith('bloom')) {
      const col = F[+t.slice(5) % F.length];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) { const a = x + 2 + i * 4 + (j & 1) * 2, b = y + 3 + j * 5; rect(ctx, a - 1, b, 3, 2, '#2c5a30'); px(ctx, a, b - 1, col); px(ctx, a - 1, b, col); px(ctx, a + 1, b, shade(col, -0.25)); if (hash(a, b, 3) > 0.6) px(ctx, a, b - 1, '#fff4cf'); }
    }
  },
};

// ---------------------------------------------------------------- standing pieces (row strips)
const leafy = (ctx, cx, cy, rx, ry, C, seed = 0) => { // a shaded round crown, light from the upper left
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
    if (d > 1) continue;
    const edge = (x - 1) ** 2 / (rx * rx) + (y * y) / (ry * ry) > 1 || (x + 1) ** 2 / (rx * rx) + (y * y) / (ry * ry) > 1 || (x * x) / (rx * rx) + (y - 1) ** 2 / (ry * ry) > 1 || (x * x) / (rx * rx) + (y + 1) ** 2 / (ry * ry) > 1;
    const l = -0.6 * x / rx - 0.8 * y / ry + (hash(cx + x, cy + y, seed) - 0.5) * 0.4;
    px(ctx, cx + x, cy + y, edge ? C.leaf[0] : l > 0.55 ? C.leaf[4] : l > 0.1 ? C.leaf[3] : l < -0.45 ? C.leaf[1] : C.leaf[2]);
  }
};
const barrel = (ctx, x, b, h, C, lid = true) => {
  box(ctx, x, b - h, 8, h, C.wood); rect(ctx, x + 1, b - h + 1, 2, h - 2, C.woodL); rect(ctx, x + 6, b - h + 1, 1, h - 2, C.woodD);
  [2, h - 3].forEach((k) => rect(ctx, x + 1, b - h + k, 6, 1, P.metalDark));
  if (lid) { rect(ctx, x, b - h, 8, 2, INK); rect(ctx, x + 1, b - h, 6, 1, C.woodL); }
};
const crate = (ctx, x, b, s, C) => { box(ctx, x, b - s, s, s, C.woodL); rect(ctx, x + 1, b - s + 1, s - 2, 1, shade(C.woodL, 0.2)); rect(ctx, x + 1, b - Math.ceil(s / 2), s - 2, 1, C.woodD); rect(ctx, x + Math.floor(s / 2), b - s + 1, 1, s - 2, C.woodD); };

const STAND = {
  fence(ctx, x, b, p, C) {
    const m = p.m, E = m & 1, Wst = m & 2, S = m & 4, N = m & 8, foot = b - 4, cx = x + 7;
    const st = p.style;
    const H = { picket: 11, rail: 10, rope: 9, wall: 9, hedge: 11 }[st];
    const top = foot - H;
    const x0 = Wst ? x : cx, x1 = E ? x + 16 : cx + 2;
    // vertical runs, seen from above: a strip toward the post of the next tile up or down
    const vert = (y0, y1) => {
      // hedge and wall: open at both ends, so the strips of neighbouring tiles join without a seam
      if (st === 'hedge') { rect(ctx, cx - 3, y0, 8, y1 - y0, INK); rect(ctx, cx - 2, y0, 6, y1 - y0, C.leaf[2]); rect(ctx, cx - 2, y0, 2, y1 - y0, C.leaf[3]); for (let k = y0 + 1; k < y1; k += 4) px(ctx, cx + 2, k, C.leaf[1]); return; }
      if (st === 'wall') { rect(ctx, cx - 2, y0, 6, y1 - y0, INK); rect(ctx, cx - 1, y0, 4, y1 - y0, C.stoneL); rect(ctx, cx - 1, y0, 1, y1 - y0, C.stoneLL); for (let k = y0 + 3; k < y1; k += 5) rect(ctx, cx, k, 3, 1, C.stone); return; }
      if (st === 'rope') { rect(ctx, cx + 1, y0, 1, y1 - y0, '#c9b07a'); return; }
      const col = st === 'picket' ? C.paintD : C.wood, colD = st === 'picket' ? shade(C.paintD, -0.3) : C.woodD;
      rect(ctx, cx - 1, y0, 4, y1 - y0, INK); rect(ctx, cx, y0, 2, y1 - y0, col);
      for (let k = y0 + 1; k < y1; k += 3) rect(ctx, cx, k, 2, 1, colD);
      if (st === 'picket') for (let k = y0 + 2; k < y1; k += 3) px(ctx, cx, k, C.paint);
    };
    if (N) vert(top - 16 + 2, top + 3);
    if (S) vert(top + 2, top + 16 + 2);
    if (p.gate) { // a gate in a straight run, with a post on each side
      if (st === 'wall') { [x, x + 12].forEach((a) => { box(ctx, a, top - 4, 5, H + 4, C.stoneL); rect(ctx, a, top - 5, 5, 2, INK); px(ctx, a + 1, top - 3, C.stoneLL); }); for (let i = x + 5; i < x + 12; i += 2) rect(ctx, i, top + 1, 1, H - 1, P.metalDark); rect(ctx, x + 5, top + 2, 7, 1, P.metalDark); return; }
      [x, x + 13].forEach((a) => { box(ctx, a, top - 2, 3, H + 3, C.woodD); px(ctx, a + 1, top - 1, C.woodL); });
      const gc = st === 'picket' ? C.paintD : C.woodL, gd = st === 'picket' ? shade(C.paintD, -0.3) : C.woodD;
      rect(ctx, x + 3, top + 1, 10, H - 1, INK);
      for (let i = x + 4; i < x + 12; i += 2) rect(ctx, i, top + 2, 1, H - 3, gc);
      rect(ctx, x + 4, top + 3, 8, 1, gd); rect(ctx, x + 4, top + H - 3, 8, 1, gd);
      for (let i = 0; i < 8; i++) px(ctx, x + 4 + i, top + H - 3 - Math.round(i * (H - 6) / 7), gd);
      return;
    }
    if (st === 'hedge' || st === 'wall') { // a clipped hedge or a low wall with a coping; outlined only where the run ends
      const a = Wst ? x : cx - 3, z = E ? x + 16 : cx + 5, w = z - a, hh = H + 2;
      rect(ctx, a, top, w, hh, INK);
      const l = Wst ? 0 : 1, rr = E ? 0 : 1, ia = a + l, iw = w - l - rr;
      if (st === 'hedge') {
        rect(ctx, ia, top + 1, iw, hh - 2, C.leaf[2]); rect(ctx, ia, top + 1, iw, 4, C.leaf[3]); rect(ctx, ia, top + 1, iw, 1, C.leaf[4]);
        for (let i = ia; i < ia + iw; i++) { if ((i * 7) % 5 === 0) px(ctx, i, top + 7 + (i & 1) * 2, C.leaf[1]); if ((i * 3) % 7 === 0) px(ctx, i, top + 3, C.leaf[4]); }
      } else {
        rect(ctx, ia, top + 1, iw, hh - 2, C.stone); rect(ctx, ia, top + 1, iw, 2, C.stoneLL); rect(ctx, ia, top + 3, iw, 1, C.stoneD);
        for (let row = 0; row < 2; row++) for (let i = (row ? 2 : 5); i < 16; i += 6) { const X = x + i; if (X > ia && X < ia + iw - 1) rect(ctx, X, top + 4 + row * 3, 1, 3, C.stoneD); }
        rect(ctx, ia, top + 7, iw, 1, C.stoneD);
      }
      return;
    }
    if (st === 'rope') { // posts with a sagging rope
      if (E || Wst) for (let i = x0; i < x1; i++) { const t = Math.abs(i - (Wst && E ? x + 8 : cx)) / 8; px(ctx, i, top + 5 - Math.round((1 - t * t) * -1) + (Wst && E ? Math.round(2 * (1 - ((i - x - 8) / 8) ** 2)) : 0), '#c9b07a'); }
      box(ctx, cx - 1, top, 4, H + 1, C.wood); rect(ctx, cx - 1, top, 4, 2, C.paint); rect(ctx, cx, top + 2, 1, H - 2, C.woodL);
      return;
    }
    // picket or rail
    const col = st === 'picket' ? C.paint : C.wood, colL = st === 'picket' ? '#ffffff' : C.woodL, colD = st === 'picket' ? C.paintD : C.woodD;
    if (E || Wst) [top + 3, top + 7].forEach((k) => { rect(ctx, x0, k - (st === 'picket' ? 0 : 1), x1 - x0, st === 'picket' ? 2 : 3, INK); rect(ctx, x0, k, x1 - x0, 1, colD); });
    if (st === 'picket') { // slim pickets with pointed tops; outlined as one shape, not one box each
      const a = Wst ? x : cx - 2, z = E ? x + 16 : cx + 4;
      for (let i = a; i < z; i += 3) { rect(ctx, i, top + 1, 2, H - 1, col); px(ctx, i + 1, top + 2, colD); rect(ctx, i + 1, top + 3, 1, H - 3, colD); px(ctx, i, top, INK); px(ctx, i + 1, top + 1, INK); px(ctx, i + 2, top + 1, INK); rect(ctx, i + 2, top + 2, 1, H - 2, shade(C.leaf[1], -0.2)); }
      rect(ctx, a, foot, z - a, 1, INK);
    } else {
      box(ctx, cx - 1, top - 1, 4, H + 2, col); rect(ctx, cx, top, 1, H, colL);
      if (E || Wst) [top + 3, top + 7].forEach((k) => rect(ctx, x0, k, x1 - x0, 1, col));
      box(ctx, cx - 1, top - 1, 4, H + 2, col); rect(ctx, cx, top, 1, H, colL);
    }
  },
  flowerbed(ctx, x, b, p, C) { // a raised bed edged with boards or stone
    const edge = p.mood === 'floral' && C.fence.floral === 'wall' ? C.stone : C.wood;
    box(ctx, x + 1, b - 8, 14, 7, shade(edge, -0.1)); rect(ctx, x + 2, b - 7, 12, 1, shade(edge, 0.3));
    for (let i = 0; i < 6; i++) { const a = x + 2 + i * 2 + (i & 1), h = 3 + ((i * 7 + p.v) % 3), col = C.flowers[(i + p.v) % C.flowers.length]; rect(ctx, a, b - 8 - h + 2, 1, h, '#3b7239'); rect(ctx, a - 1, b - 9 - h + 2, 3, 2, col); px(ctx, a, b - 10 - h + 2, shade(col, 0.4)); }
  },
  topiary(ctx, x, b, p, C) { // a clipped ball (or cone) in a pot
    box(ctx, x + 4, b - 6, 8, 5, C.stone); rect(ctx, x + 5, b - 5, 6, 1, C.stoneLL); rect(ctx, x + 3, b - 7, 10, 2, INK); rect(ctx, x + 4, b - 7, 8, 1, C.stoneL);
    rect(ctx, x + 7, b - 10, 2, 4, C.woodD);
    if (p.v & 1) { for (let k = 0; k < 14; k++) { const w = 1 + Math.floor(k / 2.3); rect(ctx, x + 8 - w - 1, b - 24 + k, w * 2 + 2, 1, INK); rect(ctx, x + 8 - w, b - 24 + k, w * 2, 1, k < 5 ? C.leaf[3] : C.leaf[2]); px(ctx, x + 8 - w, b - 24 + k, C.leaf[4]); } }
    else leafy(ctx, x + 8, b - 15, 6, 6, C, 5);
  },
  birdbath(ctx, x, b, p, C) { rect(ctx, x + 6, b - 9, 4, 8, INK); rect(ctx, x + 7, b - 9, 2, 8, C.stoneL); box(ctx, x + 4, b - 3, 8, 3, C.stone); ellipse(ctx, x + 8, b - 11, 6, 2, INK); ellipse(ctx, x + 8, b - 11, 5, 1, C.stoneLL); rect(ctx, x + 5, b - 11, 6, 1, '#5fb0d2'); },
  fruittree(ctx, x, b, p, C) { // a small orchard tree with fruit
    ellipse(ctx, x + 10, b - 2, 6, 2, 'rgba(16,18,31,0.3)');
    rect(ctx, x + 6, b - 11, 4, 10, INK); rect(ctx, x + 7, b - 11, 2, 9, C.woodD); px(ctx, x + 7, b - 8, C.woodL);
    leafy(ctx, x + 8, b - 18, 7, 6 + (p.v & 1), C, 11 + p.v);
    for (let i = 0; i < 5; i++) { const a = x + 3 + Math.floor(hash(p.x, i, 2) * 10), c = b - 22 + Math.floor(hash(p.y, i, 3) * 9); px(ctx, a, c, C.fruit); px(ctx, a, c - 1, shade(C.fruit, 0.35)); }
  },
  beehive(ctx, x, b, p, C) { // a straw skep on a little stand
    rect(ctx, x + 3, b - 4, 10, 3, INK); rect(ctx, x + 4, b - 4, 8, 2, C.woodL); rect(ctx, x + 4, b - 2, 1, 2, C.woodD); rect(ctx, x + 11, b - 2, 1, 2, C.woodD);
    for (let k = 0; k < 9; k++) { const w = Math.round(5 * Math.sqrt(1 - ((8 - k) / 9) ** 2)) + 1; rect(ctx, x + 8 - w - 1, b - 13 + k, w * 2 + 2, 1, INK); rect(ctx, x + 8 - w, b - 13 + k, w * 2, 1, k % 3 === 2 ? '#b8862f' : '#e0b04c'); px(ctx, x + 8 - w, b - 13 + k, '#f3d27a'); }
    rect(ctx, x + 7, b - 6, 2, 2, INK);
  },
  scarecrow(ctx, x, b, p, C) {
    rect(ctx, x + 7, b - 20, 2, 19, C.woodD); rect(ctx, x + 2, b - 15, 12, 2, C.woodD);
    box(ctx, x + 4, b - 16, 8, 8, C.cloth[0]); rect(ctx, x + 2, b - 16, 3, 3, C.cloth[0]); rect(ctx, x + 11, b - 16, 3, 3, C.cloth[0]); px(ctx, x + 6, b - 13, '#e0b04c'); px(ctx, x + 9, b - 11, '#e0b04c');
    box(ctx, x + 5, b - 22, 6, 6, '#e6c88c'); px(ctx, x + 6, b - 20, INK); px(ctx, x + 9, b - 20, INK);
    rect(ctx, x + 3, b - 24, 10, 2, INK); rect(ctx, x + 5, b - 27, 6, 3, INK); rect(ctx, x + 4, b - 23, 8, 1, '#9a7a3a'); rect(ctx, x + 6, b - 26, 4, 2, '#9a7a3a');
  },
  beans(ctx, x, b, p, C) { // bean poles in a bed
    [3, 8, 13].forEach((a, i) => { rect(ctx, x + a, b - 16 + i, 1, 15 - i, C.woodD); for (let k = b - 15 + i; k < b - 2; k += 2) { px(ctx, x + a + ((k >> 1) & 1 ? 1 : -1), k, '#4f9447'); if ((k + a) % 5 === 0) px(ctx, x + a + 1, k + 1, '#6fb05a'); } px(ctx, x + a - 1, b - 8, '#c9e07a'); });
  },
  barrels(ctx, x, b, p, C) { barrel(ctx, x + 2, b - 1, 11, C); barrel(ctx, x + 8, b, 8, C); if (p.v & 1) rect(ctx, x + 3, b - 13, 6, 1, '#5fb0d2'); },
  crates(ctx, x, b, p, C) { crate(ctx, x + 1, b - 1, 9, C); crate(ctx, x + 8, b, 7, C); crate(ctx, x + 3, b - 10, 7, C); },
  woodpile(ctx, x, b, p, C) { // split logs under a little lean-to roof
    rect(ctx, x + 1, b - 18, 15, 2, INK); rect(ctx, x + 1, b - 17, 15, 1, C.roof); rect(ctx, x + 1, b - 16, 1, 15, C.woodD); rect(ctx, x + 14, b - 16, 1, 15, C.woodD);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - (r === 2 ? 1 : 0); i++) { const a = x + 3 + i * 3 + (r & 1), c = b - 4 - r * 4; ellipse(ctx, a, c, 2, 2, INK); ellipse(ctx, a, c, 1, 1, '#d8b27c'); px(ctx, a, c, '#a77a45'); }
  },
  nets(ctx, x, b, p, C) { // a fishing net hung to dry between two poles, with floats
    [x + 1, x + 13].forEach((a) => { rect(ctx, a, b - 22, 2, 21, C.woodD); px(ctx, a, b - 22, C.woodL); });
    for (let j = 0; j < 12; j++) for (let i = 0; i < 10; i++) if ((i + j) % 3 === 0 || (i - j + 30) % 3 === 0) px(ctx, x + 3 + i, b - 20 + j + Math.round(Math.sin(i / 3) * 0.6), '#cbbd96');
    [x + 4, x + 8, x + 11].forEach((a, i) => { px(ctx, a, b - 20, i === 1 ? '#e0574f' : '#f2c94c'); });
  },
  laundry(ctx, x, b, p, C) { // two posts, a line, the washing (two tiles wide)
    [x + 2, x + 28].forEach((a) => { rect(ctx, a, b - 22, 2, 21, INK); rect(ctx, a, b - 22, 1, 21, C.woodL); });
    const line = (i) => b - 20 + Math.round(3 * Math.sin((i / 26) * Math.PI));
    for (let i = 0; i < 26; i++) px(ctx, x + 3 + i, line(i), '#d8d0bc');
    [[4, 6, 7], [12, 5, 9], [19, 6, 6]].forEach(([a, w, h], k) => { const col = C.cloth[(k + p.v) % C.cloth.length], y0 = line(a) + 1; box(ctx, x + 3 + a, y0, w, h, col); rect(ctx, x + 4 + a, y0 + 1, w - 2, 1, shade(col, 0.3)); px(ctx, x + 4 + a, y0 - 1, '#8f8a82'); });
  },
  sledge(ctx, x, b, p, C) {
    rect(ctx, x + 1, b - 3, 14, 2, INK); rect(ctx, x + 1, b - 3, 13, 1, P.metalLight); rect(ctx, x + 14, b - 6, 2, 3, INK);
    rect(ctx, x + 3, b - 6, 2, 3, C.woodD); rect(ctx, x + 11, b - 6, 2, 3, C.woodD);
    box(ctx, x + 2, b - 8, 12, 3, C.cloth[0]); rect(ctx, x + 3, b - 8, 10, 1, shade(C.cloth[0], 0.3));
  },
  lantern(ctx, x, b, p, C) { // a lantern on a wooden post (it glows at night)
    rect(ctx, x + 6, b - 18, 3, 17, INK); rect(ctx, x + 7, b - 18, 1, 17, C.woodL); rect(ctx, x + 5, b - 2, 5, 2, INK);
    rect(ctx, x + 8, b - 19, 4, 1, INK); rect(ctx, x + 10, b - 18, 1, 2, INK);
    box(ctx, x + 8, b - 16, 5, 6, P.lamp); px(ctx, x + 10, b - 14, P.lampHot); rect(ctx, x + 8, b - 17, 5, 1, INK);
  },
  fir(ctx, x, b, p, C) { // a young fir
    rect(ctx, x + 7, b - 5, 2, 4, C.woodD);
    const dark = '#1d3a28', mid = '#2b5a3c', lit = '#3f7a4c', hi = '#5f9a5c';
    for (let k = 0; k < 24; k++) { const tier = k % 8, w = Math.min(7, 1 + Math.floor(k / 3.2) - (tier < 2 && k > 6 ? 1 : 0)); rect(ctx, x + 8 - w - 1, b - 28 + k, w * 2 + 2, 1, INK); rect(ctx, x + 8 - w, b - 28 + k, w * 2, 1, tier > 5 ? dark : mid); rect(ctx, x + 8 - w, b - 28 + k, Math.max(1, w - 1), 1, tier > 5 ? mid : lit); if (tier === 2) px(ctx, x + 8 - w + 1, b - 28 + k, hi); }
    if (p.v & 1) for (const [a, c] of [[6, 10], [9, 16], [5, 21]]) px(ctx, x + a, b - 28 + c, '#f5f1e6');
  },
  statue(ctx, x, b, p, C) { // a small stone figure on a plinth
    box(ctx, x + 2, b - 8, 12, 7, C.stone); rect(ctx, x + 3, b - 7, 10, 2, C.stoneLL); rect(ctx, x + 3, b - 3, 10, 1, C.stoneD);
    box(ctx, x + 5, b - 20, 6, 13, C.stoneL); rect(ctx, x + 6, b - 19, 2, 11, C.stoneLL);
    ellipse(ctx, x + 8, b - 22, 3, 3, INK); ellipse(ctx, x + 8, b - 22, 2, 2, C.stoneL); px(ctx, x + 7, b - 23, C.stoneLL);
    rect(ctx, x + 10, b - 22, 2, 8, INK); rect(ctx, x + 10, b - 21, 1, 6, C.stoneL);
  },
  well(ctx, x, b, p, C) { // a round stone well with a little roof
    rect(ctx, x + 2, b - 22, 2, 14, INK); rect(ctx, x + 12, b - 22, 2, 14, INK); rect(ctx, x + 2, b - 22, 1, 14, C.woodL); rect(ctx, x + 12, b - 22, 1, 14, C.woodL);
    for (let k = 0; k < 6; k++) { rect(ctx, x + 1 + Math.max(0, 5 - k), b - 27 + k, 14 - Math.max(0, 5 - k) * 2, 1, k === 0 ? INK : k < 3 ? C.roof : C.roofD); }
    rect(ctx, x, b - 22, 16, 1, INK);
    rect(ctx, x + 4, b - 17, 8, 1, C.woodD); rect(ctx, x + 7, b - 16, 1, 3, '#cbbd96'); box(ctx, x + 6, b - 13, 3, 3, C.wood);
    box(ctx, x + 1, b - 9, 14, 8, C.stone); ellipse(ctx, x + 8, b - 9, 6, 2, INK); ellipse(ctx, x + 8, b - 9, 5, 1, '#1c4a73');
    for (let i = 0; i < 3; i++) rect(ctx, x + 3 + i * 4, b - 6 + (i & 1) * 2, 3, 1, C.stoneLL);
  },
  planter(ctx, x, b, p, C) { // a box of flowers
    box(ctx, x + 1, b - 7, 14, 6, C.wood); rect(ctx, x + 2, b - 6, 12, 1, C.woodL); rect(ctx, x + 2, b - 3, 12, 1, C.woodD);
    for (let i = 0; i < 6; i++) { const a = x + 2 + i * 2 + (i & 1), col = C.flowers[(i + p.v) % C.flowers.length]; rect(ctx, a - 1, b - 9, 3, 2, '#3b7239'); px(ctx, a, b - 10 - (i & 1), col); px(ctx, a + 1, b - 9 - (i & 1), shade(col, -0.2)); }
  },
  stall(ctx, x, b, p, C) { // a market stall with a striped awning (two tiles wide)
    [x + 2, x + 28].forEach((a) => { rect(ctx, a, b - 24, 2, 23, INK); rect(ctx, a, b - 24, 1, 23, C.woodL); });
    box(ctx, x + 1, b - 10, 30, 9, C.wood); rect(ctx, x + 2, b - 9, 28, 1, C.woodL); rect(ctx, x + 2, b - 4, 28, 1, C.woodD);
    for (let i = 0; i < 7; i++) { const col = [C.fruit, '#6fb05a', '#f2c94c', C.flowers[1]][i % 4]; ellipse(ctx, x + 5 + i * 4, b - 12, 1, 1, col); px(ctx, x + 4 + i * 4, b - 13, shade(col, 0.4)); }
    rect(ctx, x, b - 29, 32, 7, INK);
    for (let i = 0; i < 30; i += 5) { rect(ctx, x + 1 + i, b - 28, 5, 5, (i / 5) % 2 ? C.paint : C.roof); }
    for (let i = 0; i < 30; i += 5) rect(ctx, x + 1 + i, b - 23, 4, 1, (i / 5) % 2 ? C.paintD : C.roofD);
  },
  bench(ctx, x, b, p, C) {
    rect(ctx, x + 1, b - 12, 14, 3, INK); rect(ctx, x + 2, b - 11, 12, 1, C.woodL);
    rect(ctx, x + 1, b - 8, 14, 3, INK); rect(ctx, x + 2, b - 7, 12, 1, C.woodL);
    rect(ctx, x + 2, b - 5, 2, 4, P.metalDark); rect(ctx, x + 12, b - 5, 2, 4, P.metalDark);
  },
};

// The tall pieces whose sprite is wider than their tiles cast no extra shadow; others get a small one.
const SHADOW = { fence: 0, laundry: 0, stall: [24, 4], fruittree: 0, fir: [12, 3] };

export function paintDressing(L, theme) {
  const C = colours(theme);
  const [g, gx] = makeCanvas(MAP_W * T, MAP_H * T);
  const rows = new Map();
  for (const p of L.pieces) {
    if (FLAT[p.t]) { FLAT[p.t](gx, p.x * T, p.y * T, p, C); continue; }
    const paint = STAND[p.t];
    if (!paint) continue;
    if (p.under) FLAT.bed(gx, p.x * T, p.y * T, { ...p, bed: p.under }, C);
    const y = p.y + (p.h || 1) - 1;
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y).push(p);
    const sh = SHADOW[p.t];
    if (sh !== 0) { const [w, h] = sh || [12, 3]; gx.globalAlpha = 0.28; ellipse(gx, p.x * T + Math.round(((p.w || 1) * T) / 2) + 2, (y + 1) * T - 2, Math.round(w / 2), Math.ceil(h / 2), '#10121f'); gx.globalAlpha = 1; }
  }
  const strips = [];
  for (const [y, list] of rows) {
    const x0 = Math.min(...list.map((p) => p.x)), x1 = Math.max(...list.map((p) => p.x + (p.w || 1)));
    const [c, ctx] = makeCanvas((x1 - x0) * T, STRIP);
    for (const p of list) STAND[p.t](ctx, (p.x - x0) * T, STRIP, p, C);
    strips.push({ key: `dress-row-${y}`, canvas: c, x: x0 * T, y: (y + 1) * T, depth: y * T + 14 });
  }
  return { ground: g, rows: strips };
}

// One canvas with every piece of a theme, for __hb.gallery().
export function dressingSheet(theme, scale = 1) {
  const C = colours(theme), D = theme.dressing;
  const tall = ['fence', 'gate', 'flowerbed', 'topiary', 'birdbath', 'fruittree', 'beehive', 'scarecrow', 'beans', 'barrels', 'crates', 'woodpile', 'nets', 'laundry', 'sledge', 'lantern', 'fir', 'statue', 'well', 'planter', 'stall', 'bench'];
  const flat = ['kerb', 'steps', 'pier', 'boat', 'reeds', 'lily', 'cabbage', 'carrot', 'bloom0', 'bloom1'];
  const w = tall.reduce((s, t) => s + (t === 'laundry' || t === 'stall' ? 34 : 18), 0) + flat.reduce((s, t) => s + (t === 'boat' ? 34 : 18), 0);
  const [c, ctx] = makeCanvas(w, STRIP + 4);
  ctx.fillStyle = '#4e8f45'; ctx.fillRect(0, 0, w, STRIP + 4);
  let x = 0;
  for (const t of tall) {
    const p = { t, x: 0, y: 0, v: 1, m: 3, style: D.fence.floral, gate: t === 'gate', mood: 'floral' };
    if (t === 'gate') { p.style = D.fence.worked; }
    STAND[t === 'gate' ? 'fence' : t](ctx, x, STRIP, p, C);
    x += t === 'laundry' || t === 'stall' ? 34 : 18;
  }
  for (const t of flat) {
    const y = STRIP - 16;
    if (['reeds', 'lily', 'boat', 'pier'].includes(t)) { ctx.fillStyle = '#25638f'; ctx.fillRect(x, y - (t === 'boat' ? 0 : 0), t === 'boat' ? 32 : 16, 16); }
    if (t === 'kerb') { ctx.fillStyle = P.cobble; ctx.fillRect(x, y, 16, 4); }
    const p = { t, x: 0, y: 0, v: 1, m: t === 'kerb' ? 8 : 8 | 2, dir: 'h', end: true, bed: t };
    (FLAT[t] || FLAT.bed)(ctx, x, y, p, C);
    x += t === 'boat' ? 34 : 18;
  }
  if (scale === 1) return c;
  const [s, sx] = makeCanvas(c.width * scale, c.height * scale);
  sx.drawImage(c, 0, 0, s.width, s.height);
  return s;
}
