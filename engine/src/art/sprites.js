// Characters, vegetation, props and light sprites. All drawn in code.
import { P, charPalette } from './palette.js';
import { makeCanvas, drawRows, hash, noise, mix, ellipse, rect, px, radial, addSheet, addTex } from './px.js';

// Rows are written as run-length tokens: "3. o 8h o 3." -> "...ohhhhhhhho...". Every row must be 16 px.
const rle = (s) => s.trim().split(/\s+/).map((t) => { const m = t.match(/^(\d*)(.)$/); return m[2].repeat(m[1] ? +m[1] : 1); }).join('');
const R = (rows) => rows.map(rle);

const HEAD_FRONT = R(['16.', '4. 8o 4.', '3. o 8h o 3.', '3. o 8h o 3.', '3. o h 2H 5h o 3.', '3. o 8h o 3.', '3. o h 6s h o 3.',
  '3. o s e 4s e s o 3.', '3. o s e 4s e s o 3.', '3. o S 6s S o 3.', '4. o S s 2m s S o 4.', '5. 2o 2s 2o 5.']);
const BODY_FRONT = R(['3. o 8c o 3.', '2. o C 8c C o 2.', '2. o C 3c a 4c C o 2.', '2. o C 8c C o 2.', '2. o s 8c s o 2.', '3. o 8C o 3.']);
const LEGS_FRONT = R(['4. o 6p o 4.', '4. o 2p 2o 2p o 4.', '4. o 2p 2o 2p o 4.', '4. o 2P 2o 2P o 4.', '4. o 2b 2o 2b o 4.', '4. 3o 2. 3o 4.']);
const LEGS_FRONT_A = R(['4. o 6p o 4.', '4. o 2p 2o 2p o 4.', '4. o 2P 2o 2p o 4.', '4. o 2b 2o 2P o 4.', '4. 4o o 2b o 4.', '8. 4o 4.']);
const LEGS_FRONT_B = LEGS_FRONT_A.map((r) => r.split('').reverse().join(''));

const HEAD_BACK = R(['16.', '4. 8o 4.', '3. o 8h o 3.', '3. o 8h o 3.', '3. o 5h 2H h o 3.', '3. o 8h o 3.', '3. o 8h o 3.',
  '3. o 8h o 3.', '3. o 8h o 3.', '3. o 8h o 3.', '4. o 6h o 4.', '5. 2o 2s 2o 5.']);
const BODY_BACK = R(['3. o 8c o 3.', '2. o C c 6k c C o 2.', '2. o C c k 4K k c C o 2.', '2. o C c 6k c C o 2.', '2. o s 8c s o 2.', '3. o 8C o 3.']);

const HEAD_SIDE = R(['16.', '5. 6o 5.', '4. o 6h o 4.', '3. o 7h o 4.', '3. o 2h 2H 3h o 4.', '3. o 7h o 4.', '3. o 2s 5h o 4.',
  '3. o s e s 4h o 4.', '2. o 4s 4h o 4.', '3. o S 3s 3h o 4.', '4. o m 2s 2h o 5.', '5. o 2s 2o 6.']);
const BODY_SIDE = R(['4. o 6c o 4.', '4. o 2c 2C 2c o 4.', '4. o 2c 2C 2c o 4.', '4. o 2c 2s 2c o 4.', '4. o 6c o 4.', '4. o 6C o 4.']);
const LEGS_SIDE = R(['5. o 4p o 5.', '5. o 4p o 5.', '5. o 4P o 5.', '5. o 4P o 5.', '4. o 5b o 5.', '4. 7o 5.']);
const LEGS_SIDE_A = R(['5. o 4p o 5.', '4. o 6p o 4.', '3. o 2P o 2. o 2P o 3.', '3. o 2P o 2. o 2P o 3.', '2. o 3b o 2. o 2b o 3.', '2. 5o 2. 4o 3.']);

function setPx(rows, y, x, ch) {
  const r = rows[y].split('');
  r[x] = ch;
  rows[y] = r.join('');
}

function styleRows(view, rows, style) {
  const out = rows.slice();
  const has = (s) => style.includes(s);
  if (has('bun')) out[0] = rle('6. o 2h o 6.');
  if (has('long')) {
    if (view === 'front') for (let y = 6; y <= 11; y++) { setPx(out, y, 3, y < 11 ? 'h' : 'o'); setPx(out, y, 12, y < 11 ? 'h' : 'o'); setPx(out, y, 2, 'o'); setPx(out, y, 13, 'o'); }
    if (view === 'back') for (let y = 10; y <= 13; y++) out[y] = rle('3. o 8h o 3.');
    if (view === 'side') for (let y = 6; y <= 12; y++) { setPx(out, y, 10, 'h'); setPx(out, y, 11, 'h'); setPx(out, y, 12, 'o'); }
  }
  if (has('cap')) {
    for (let y = 1; y <= 4; y++) out[y] = out[y].replace(/h/g, 'q').replace(/H/g, 'Q');
    if (view === 'front') out[5] = rle('2. o 10Q o 2.');
    if (view === 'side') out[5] = rle('1. 2o 2Q 4q 2h o 4.');
  }
  if (has('beard') && view !== 'back') {
    if (view === 'front') { out[9] = rle('3. o z 6s z o 3.'); out[10] = rle('4. o 2z 2m 2z o 4.'); out[11] = rle('5. o 4z o 5.'); }
    if (view === 'side') { out[9] = rle('3. o z 3s 3h o 4.'); out[10] = rle('4. o 3z 2h o 5.'); }
  }
  if (has('glasses') && view === 'front') { out[7] = rle('3. o s 2E 2s 2E s o 3.'); out[8] = rle('3. o s 2E 2s 2E s o 3.'); }
  return out;
}

export const LOOKS = {
  player: { pal: { hair: '#5a3a28', hairHi: '#7d5640', top: '#2a8c87', topShade: '#1d6764', accent: '#ffcf5a' }, k: ['#8c5b3a', '#653f28'], style: [] },
  mentor: { pal: { hair: '#e8e5de', hairHi: '#ffffff', top: '#f3f2ec', topShade: '#cfc9bb', pants: '#5d6670', pantsShade: '#454c55', shoes: '#3d434b', accent: '#2a8c87' }, style: ['bun'] },
  kid: { pal: { skin: 'tan', hair: '#3b2a20', top: '#f2c94c', topShade: '#c99a2b', pants: '#3c5ea6', pantsShade: '#2c4580', accent: '#e0574f' }, q: ['#e0574f', '#a93a33'], style: ['cap'] },
  nurse: { pal: { hair: '#2d2a40', hairHi: '#4a4566', top: '#59b8b0', topShade: '#3c8c86', pants: '#59b8b0', pantsShade: '#3c8c86', accent: '#f3f2ec' }, style: ['bun'] },
  fisher: { pal: { skin: 'tan', hair: '#9a948a', top: '#5f8b3d', topShade: '#46692c', pants: '#6b4a30', pantsShade: '#4f3522', shoes: '#3d434b', accent: '#d9c27a' }, q: ['#d9c27a', '#b39a55'], z: '#c9c4bb', style: ['cap', 'beard'] },
  archivist: { pal: { skin: 'deep', hair: '#2b1d16', hairHi: '#4a3326', top: '#7d5737', topShade: '#5c3f27', pants: '#3d434b', accent: '#e9e2c9' }, style: ['glasses'] },
  surveyor: { pal: { hair: '#1b1a2b', hairHi: '#3a3550', top: '#6b55a0', topShade: '#4f3e7a', pants: '#2a3047', accent: '#ffcf5a' }, style: ['long'] },
  tech: { pal: { skin: 'tan', hair: '#23202f', hairHi: '#3e3a52', top: '#2c4580', topShade: '#1f325d', pants: '#2c4580', pantsShade: '#1f325d', accent: '#4fd1c5' }, style: [] },
  keeper: { pal: { hair: '#c9c4bb', top: '#2c4580', topShade: '#1f325d', pants: '#38405c', accent: '#ffcf5a', shoes: '#3d434b' }, q: ['#f3f2ec', '#cfc9bb'], z: '#d8d4cc', style: ['cap', 'beard'] },
  tess: { pal: { hair: '#c4622a', hairHi: '#e0813f', top: '#d9822f', topShade: '#a95f1f', pants: '#38405c', accent: '#f3f2ec' }, style: ['long', 'glasses'] },
};

export function makeCharacter(scene, key, look) {
  const pal = charPalette(look.pal);
  pal.k = look.k ? look.k[0] : pal.c;
  pal.K = look.k ? look.k[1] : pal.C;
  pal.q = look.q ? look.q[0] : pal.h;
  pal.Q = look.q ? look.q[1] : pal.H;
  pal.z = look.z || pal.h;
  pal.E = '#2b3550';
  const style = look.style || [];
  const [c, ctx] = makeCanvas(16 * 9, 24);
  const frame = (i, head, body, legs, view, bob = 0) => {
    const rows = styleRows(view, [...head, ...body, ...legs], style);
    drawRows(ctx, rows, pal, i * 16, bob);
  };
  frame(0, HEAD_FRONT, BODY_FRONT, LEGS_FRONT, 'front');
  frame(1, HEAD_FRONT, BODY_FRONT, LEGS_FRONT_A, 'front');
  frame(2, HEAD_FRONT, BODY_FRONT, LEGS_FRONT_B, 'front');
  frame(3, HEAD_BACK, BODY_BACK, LEGS_FRONT, 'back');
  frame(4, HEAD_BACK, BODY_BACK, LEGS_FRONT_A, 'back');
  frame(5, HEAD_BACK, BODY_BACK, LEGS_FRONT_B, 'back');
  frame(6, HEAD_SIDE, BODY_SIDE, LEGS_SIDE, 'side');
  frame(7, HEAD_SIDE, BODY_SIDE, LEGS_SIDE_A, 'side');
  // frame 8: stand with a one-pixel bob
  const tmp = styleRows('side', [...HEAD_SIDE, ...BODY_SIDE, ...LEGS_SIDE], style);
  drawRows(ctx, tmp.slice(1), pal, 8 * 16, 0);
  addSheet(scene, key, c, 16, 24);
  const a = scene.anims;
  const mk = (name, frames, rate) => { if (!a.exists(`${key}-${name}`)) a.create({ key: `${key}-${name}`, frames: frames.map((f) => ({ key, frame: f })), frameRate: rate, repeat: -1 }); };
  mk('walk-down', [1, 0, 2, 0], 8);
  mk('walk-up', [4, 3, 5, 3], 8);
  mk('walk-side', [7, 8, 7, 6], 8);
}

// ---------- vegetation ----------
function blobTree(seed, palette) {
  const [c, ctx] = makeCanvas(32, 40);
  // trunk
  rect(ctx, 13, 26, 6, 12, P.woodDark);
  rect(ctx, 14, 26, 3, 12, P.wood);
  px(ctx, 15, 30, P.woodLight); px(ctx, 14, 34, P.woodLight);
  rect(ctx, 12, 37, 8, 2, P.woodDark);
  const blobs = seed === 0 ? [[16, 13, 12], [8, 18, 7], [24, 18, 7], [16, 6, 7], [11, 9, 6], [21, 9, 6]] : [[16, 14, 11], [9, 16, 8], [23, 15, 8], [15, 6, 8], [20, 21, 6], [11, 22, 5]];
  const inside = (x, y) => blobs.some(([bx, by, r]) => (x - bx) ** 2 + (y - by) ** 2 <= r * r);
  for (let y = 0; y < 30; y++) for (let x = 0; x < 32; x++) {
    if (!inside(x, y)) continue;
    let best = blobs[0], bd = 1e9;
    for (const b of blobs) { const d = (x - b[0]) ** 2 + (y - b[1]) ** 2 - b[2] * b[2]; if (d < bd) { bd = d; best = b; } }
    const nx = (x - best[0]) / best[2], ny = (y - best[1]) / best[2];
    const light = -0.62 * nx - 0.78 * ny + (noise(x * 0.5, y * 0.5, seed + 3) - 0.5) * 0.5;
    let col = palette[1];
    if (light > 0.55) col = palette[3];
    else if (light > 0.15) col = palette[2];
    else if (light < -0.45) col = palette[0];
    if (hash(x, y, seed + 9) > 0.93 && light > 0) col = palette[3];
    const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
    px(ctx, x, y, edge ? palette[4] : col);
  }
  return c;
}

function bush() {
  const [c, ctx] = makeCanvas(16, 16);
  const blobs = [[8, 9, 6], [4, 11, 4], [12, 11, 4], [8, 5, 4]];
  const inside = (x, y) => blobs.some(([bx, by, r]) => (x - bx) ** 2 + (y - by) ** 2 <= r * r);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!inside(x, y)) continue;
    const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
    const l = -0.6 * (x - 8) / 8 - 0.8 * (y - 8) / 8;
    px(ctx, x, y, edge ? '#1f3d22' : l > 0.4 ? P.grassLight : l < -0.3 ? P.grassDeep : P.grassDark);
    if (!edge && hash(x, y, 4) > 0.94) px(ctx, x, y, P.flowerRed);
  }
  return c;
}

function tallGrass(front, sway) {
  const [c, ctx] = makeCanvas(16, 16);
  const tufts = [[2, 9], [7, 7], [12, 9], [4, 15], [10, 14], [14, 15], [0, 14]];
  for (const [tx, ty] of tufts) {
    if (front && ty < 12) continue;
    const blades = [[-2, 4], [-1, 6], [0, 7], [1, 6], [2, 4], [3, 3]];
    for (const [dx, hgt] of blades) {
      for (let k = 0; k < hgt; k++) {
        const lean = sway && k > hgt / 2 ? 1 : 0;
        const x = tx + dx + lean, y = ty - k;
        if (x < 0 || x > 15 || y < 0) continue;
        px(ctx, x, y, k === hgt - 1 ? P.tallTip : k > hgt / 2 ? P.tallB : P.tallA);
      }
    }
  }
  return c;
}

// ---------- props ----------
function lampPost() {
  const [c, ctx] = makeCanvas(16, 32);
  rect(ctx, 7, 9, 2, 20, P.metalDark);
  px(ctx, 7, 12, P.metalLight); px(ctx, 7, 18, P.metalLight);
  rect(ctx, 5, 28, 6, 3, P.metalDark);
  rect(ctx, 6, 28, 4, 1, P.metal);
  rect(ctx, 4, 2, 8, 1, P.metalDark); // cap
  rect(ctx, 5, 1, 6, 1, P.metalDark);
  rect(ctx, 5, 3, 6, 6, P.metalDark);
  rect(ctx, 6, 4, 4, 4, P.lamp);
  rect(ctx, 7, 5, 2, 2, P.lampHot);
  rect(ctx, 6, 9, 4, 1, P.metalDark);
  return c;
}

function signPost() {
  const [c, ctx] = makeCanvas(16, 16);
  rect(ctx, 7, 9, 2, 7, P.woodDark);
  rect(ctx, 1, 2, 14, 8, P.woodDark);
  rect(ctx, 2, 3, 12, 6, P.woodLight);
  rect(ctx, 3, 4, 7, 1, P.woodDark); rect(ctx, 3, 6, 9, 1, P.woodDark);
  return c;
}

function boat() {
  const [c, ctx] = makeCanvas(32, 18);
  ellipse(ctx, 16, 10, 14, 5, P.woodDark);
  ellipse(ctx, 16, 9, 13, 4, P.wood);
  rect(ctx, 4, 9, 24, 1, P.wallWhite);
  ellipse(ctx, 16, 8, 10, 2, '#5b3c27');
  rect(ctx, 14, 0, 2, 9, P.woodDark);
  for (let y = 1; y < 8; y++) rect(ctx, 16, y, Math.max(1, 8 - y), 1, y < 4 ? P.wallWhite : '#e3ddcf');
  return c;
}

function crate() {
  const [c, ctx] = makeCanvas(12, 12);
  rect(ctx, 0, 0, 12, 12, P.woodDark);
  rect(ctx, 1, 1, 10, 10, P.woodLight);
  rect(ctx, 1, 5, 10, 2, P.wood);
  rect(ctx, 5, 1, 2, 10, P.wood);
  return c;
}

function boulder() {
  const [c, ctx] = makeCanvas(14, 10);
  ellipse(ctx, 7, 6, 6, 3, P.boneDark);
  ellipse(ctx, 7, 5, 5, 3, P.boneMid);
  ellipse(ctx, 6, 4, 3, 2, P.boneLight);
  return c;
}

function bench() {
  const [c, ctx] = makeCanvas(16, 12);
  rect(ctx, 1, 2, 14, 3, P.woodDark); rect(ctx, 2, 3, 12, 1, P.woodLight);
  rect(ctx, 1, 6, 14, 3, P.woodDark); rect(ctx, 2, 7, 12, 1, P.woodLight);
  rect(ctx, 2, 9, 2, 3, P.metalDark); rect(ctx, 12, 9, 2, 3, P.metalDark);
  return c;
}

function shadow(w, h, a = 0.28) {
  const [c, ctx] = makeCanvas(w, h);
  ctx.globalAlpha = a;
  ellipse(ctx, Math.floor(w / 2), Math.floor(h / 2), Math.floor(w / 2) - 1, Math.floor(h / 2), '#10121f');
  return c;
}

function beam() {
  const L = 420, Wd = 150;
  const [c, ctx] = makeCanvas(L, Wd);
  for (let x = 0; x < L; x++) {
    const t = x / L;
    const half = 3 + t * (Wd / 2 - 4);
    const g = ctx.createLinearGradient(0, Wd / 2 - half, 0, Wd / 2 + half);
    const a = 0.55 * (1 - t) ** 1.2;
    g.addColorStop(0, 'rgba(255,240,190,0)');
    g.addColorStop(0.5, `rgba(255,240,190,${a})`);
    g.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, Wd / 2 - half, 1, half * 2);
  }
  return c;
}

function sparkle() {
  const [c, ctx] = makeCanvas(3, 3);
  px(ctx, 1, 0, 'rgba(255,255,255,0.45)'); px(ctx, 1, 2, 'rgba(255,255,255,0.45)');
  px(ctx, 0, 1, 'rgba(255,255,255,0.45)'); px(ctx, 2, 1, 'rgba(255,255,255,0.45)');
  px(ctx, 1, 1, '#ffffff');
  return c;
}

// ---- landmarks: one per district, 32 x 48, standing on two tiles. Their silhouettes must stay easy to tell apart. ----
const STONE = ['#17151c', '#8f8a82', '#b4afa6', '#d6d2c8', '#6f6a64'];
function plinth(ctx, y = 40, w = 26) { rect(ctx, 16 - w / 2 - 1, y - 1, w + 2, 9, STONE[0]); rect(ctx, 16 - w / 2, y, w, 7, STONE[1]); rect(ctx, 16 - w / 2, y, w, 2, STONE[3]); rect(ctx, 16 - w / 2, y + 5, w, 2, STONE[4]); }
const MONUMENTS = {
  fountain(ctx) {
    ellipse(ctx, 16, 39, 15, 8, STONE[0]); ellipse(ctx, 16, 38, 14, 7, STONE[2]); ellipse(ctx, 16, 37, 11, 5, '#3f8fb5'); ellipse(ctx, 15, 36, 7, 3, '#6fc0dc');
    rect(ctx, 13, 18, 6, 20, STONE[0]); rect(ctx, 14, 19, 4, 19, STONE[2]); rect(ctx, 14, 19, 1, 19, STONE[3]);
    ellipse(ctx, 16, 19, 7, 3, STONE[0]); ellipse(ctx, 16, 18, 6, 2, STONE[3]);
    [[16, 8], [15, 10], [17, 11], [13, 13], [19, 13], [11, 16], [21, 16], [12, 22], [20, 23], [16, 6]].forEach(([x, y]) => px(ctx, x, y, '#d6f3ff'));
    [[14, 12], [18, 12], [16, 10], [10, 19], [22, 19]].forEach(([x, y]) => px(ctx, x, y, '#8fd3ea'));
  },
  obelisk(ctx) {
    plinth(ctx, 40, 22); rect(ctx, 8, 35, 16, 6, STONE[0]); rect(ctx, 9, 36, 14, 4, STONE[2]);
    for (let y = 6; y < 36; y++) { const half = 3 + Math.floor((y - 6) / 10); rect(ctx, 16 - half - 1, y, half * 2 + 2, 1, STONE[0]); rect(ctx, 16 - half, y, half * 2, 1, STONE[2]); px(ctx, 16 - half, y, STONE[3]); px(ctx, 16 + half - 1, y, STONE[4]); }
    for (let k = 0; k < 5; k++) { rect(ctx, 16 - k - 1, 5 - k, k * 2 + 2, 1, STONE[0]); if (k) rect(ctx, 16 - k, 5 - k + 1, k * 2, 1, '#ffcf5a'); }
    for (let y = 14; y < 32; y += 5) rect(ctx, 14, y, 4, 1, STONE[4]);
  },
  statue(ctx) {
    plinth(ctx, 38, 20); rect(ctx, 9, 28, 14, 11, STONE[0]); rect(ctx, 10, 29, 12, 9, STONE[2]); rect(ctx, 10, 29, 12, 2, STONE[3]);
    const B = ['#17151c', '#3f7f72', '#5aa694', '#2c5a52'];
    rect(ctx, 12, 14, 8, 15, B[0]); rect(ctx, 13, 15, 6, 14, B[1]); rect(ctx, 13, 15, 2, 14, B[2]); rect(ctx, 17, 20, 2, 9, B[3]);
    ellipse(ctx, 16, 10, 4, 4, B[0]); ellipse(ctx, 16, 10, 3, 3, B[1]); px(ctx, 15, 9, B[2]);
    rect(ctx, 20, 8, 3, 10, B[0]); rect(ctx, 21, 9, 1, 8, B[1]); rect(ctx, 19, 4, 5, 5, B[0]); rect(ctx, 20, 5, 3, 3, '#ffcf5a'); // a raised lantern
  },
  arch(ctx) {
    plinth(ctx, 41, 30);
    [3, 22].forEach((x) => { rect(ctx, x, 12, 8, 30, STONE[0]); rect(ctx, x + 1, 13, 6, 29, STONE[2]); rect(ctx, x + 1, 13, 2, 29, STONE[3]); for (let y = 18; y < 40; y += 6) rect(ctx, x + 1, y, 6, 1, STONE[4]); });
    for (let x = 3; x < 30; x++) { const t = (x - 16) / 13, top = Math.round(4 + t * t * 9); rect(ctx, x, top - 1, 1, 9, STONE[0]); rect(ctx, x, top, 1, 7, STONE[2]); px(ctx, x, top, STONE[3]); }
    rect(ctx, 13, 2, 6, 8, STONE[0]); rect(ctx, 14, 3, 4, 6, '#ffcf5a');
  },
  bell(ctx) {
    plinth(ctx, 41, 28);
    const Wd = ['#17151c', '#7a5230', '#9c6e44', '#5a3a20'];
    [4, 24].forEach((x) => { rect(ctx, x, 8, 5, 34, Wd[0]); rect(ctx, x + 1, 9, 3, 33, Wd[1]); rect(ctx, x + 1, 9, 1, 33, Wd[2]); });
    rect(ctx, 1, 4, 30, 6, Wd[0]); rect(ctx, 2, 5, 28, 4, Wd[1]); rect(ctx, 2, 5, 28, 1, Wd[2]);
    for (let y = 12; y < 28; y++) { const half = y < 16 ? 3 : y < 24 ? 5 : 7; rect(ctx, 16 - half - 1, y, half * 2 + 2, 1, Wd[0]); rect(ctx, 16 - half, y, half * 2, 1, '#c99a3b'); px(ctx, 16 - half + 1, y, '#ffe08a'); }
    rect(ctx, 15, 9, 2, 4, Wd[0]); rect(ctx, 15, 28, 3, 3, Wd[0]); px(ctx, 16, 29, '#c99a3b');
  },
  stones(ctx) {
    ellipse(ctx, 16, 43, 15, 4, 'rgba(20,18,40,0.25)');
    [[2, 20, 8, 24], [12, 8, 9, 36], [23, 24, 7, 20]].forEach(([x, y, w, hh], k) => {
      rect(ctx, x, y + 2, w, hh - 2, STONE[0]); rect(ctx, x + 1, y, w - 2, hh, STONE[0]);
      rect(ctx, x + 1, y + 2, w - 2, hh - 3, STONE[1 + (k % 2)]); rect(ctx, x + 2, y + 1, w - 4, 2, STONE[3]); rect(ctx, x + 1, y + 3, 2, hh - 6, STONE[3]);
      for (let j = 0; j < 3; j++) rect(ctx, x + 3 + j, y + 8 + j * 5, w - 6, 1, STONE[4]);
    });
    rect(ctx, 14, 16, 5, 1, '#4fd1c5'); rect(ctx, 16, 14, 1, 5, '#4fd1c5');
  },
};
function monument(kind) { const [c, ctx] = makeCanvas(32, 48); (MONUMENTS[kind] || MONUMENTS.obelisk)(ctx); return c; }
export const MONUMENT_KINDS = Object.keys(MONUMENTS);

function fence(vertical) {
  const [c, ctx] = makeCanvas(16, 16);
  const W = ['#17151c', '#b08a5a', '#d2ad7a', '#7d5c38'];
  if (vertical) { rect(ctx, 6, 0, 4, 16, W[0]); rect(ctx, 7, 0, 2, 16, W[1]); rect(ctx, 7, 0, 1, 16, W[2]); [2, 10].forEach((y) => { rect(ctx, 5, y, 6, 4, W[0]); rect(ctx, 6, y + 1, 4, 2, W[2]); }); }
  else { [4, 9].forEach((y) => { rect(ctx, 0, y, 16, 3, W[0]); rect(ctx, 0, y + 1, 16, 1, W[1]); }); [2, 10].forEach((x) => { rect(ctx, x, 1, 4, 14, W[0]); rect(ctx, x + 1, 2, 2, 12, W[1]); rect(ctx, x + 1, 2, 1, 12, W[2]); rect(ctx, x + 1, 13, 2, 1, W[3]); }); }
  return c;
}

export function makeWorldSprites(scene) {
  makeTreeVariants(scene);
  addTex(scene, 'bush', bush());
  addTex(scene, 'grass-back-0', tallGrass(false, false));
  addTex(scene, 'grass-back-1', tallGrass(false, true));
  addTex(scene, 'grass-front-0', tallGrass(true, false));
  addTex(scene, 'grass-front-1', tallGrass(true, true));
  addTex(scene, 'lamp', lampPost());
  addTex(scene, 'sign', signPost());
  addTex(scene, 'boat', boat());
  addTex(scene, 'crate', crate());
  addTex(scene, 'boulder', boulder());
  addTex(scene, 'bench', bench());
  addTex(scene, 'fence-h', fence(false));
  addTex(scene, 'fence-v', fence(true));
  MONUMENT_KINDS.forEach((k) => addTex(scene, `mon-${k}`, monument(k)));
  addTex(scene, 'shadow-s', shadow(14, 5));
  addTex(scene, 'shadow-m', shadow(26, 8));
  addTex(scene, 'shadow-l', shadow(40, 10, 0.24));
  addTex(scene, 'light', radial(128, null, null, [[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(255,255,255,0.65)'], [1, 'rgba(255,255,255,0)']]), true);
  addTex(scene, 'glow', radial(64, null, null, [[0, 'rgba(255,215,122,0.75)'], [0.4, 'rgba(255,190,90,0.3)'], [1, 'rgba(255,170,60,0)']]), true);
  addTex(scene, 'glow-teal', radial(64, null, null, [[0, 'rgba(120,255,235,0.8)'], [0.4, 'rgba(79,209,197,0.3)'], [1, 'rgba(79,209,197,0)']]), true);
  addTex(scene, 'firefly', radial(8, null, null, [[0, 'rgba(230,255,140,1)'], [0.5, 'rgba(200,255,120,0.5)'], [1, 'rgba(180,255,100,0)']]));
  addTex(scene, 'sparkle', sparkle());
  addTex(scene, 'beam', beam(), true);
  const [dot, dctx] = makeCanvas(2, 2); rect(dctx, 0, 0, 2, 2, '#ffffff'); addTex(scene, 'dot', dot);
}

function makeTreeVariants(scene) {
  const greenA = ['#2a5a2f', '#3c7a3a', '#4f9447', '#6fb05a', '#1d3a21'];
  const greenB = ['#28533a', '#356f45', '#468a52', '#62a866', '#1a3524'];
  addTex(scene, 'tree-0', blobTree(0, greenA));
  addTex(scene, 'tree-1', blobTree(1, greenB));
}
