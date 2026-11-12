// Paints the whole town ground as one canvas, pixel by pixel, so edges look hand-drawn.
import { P } from './palette.js';
import { hexToRgb, hash, noise, fbm, makeCanvas } from './px.js';
import { TERRAIN, MAP_W, MAP_H, T } from '../world/townMap.js';

const W = MAP_W * T, H = MAP_H * T;
const C = Object.fromEntries(Object.entries(P).map(([k, v]) => [k, hexToRgb(v)]));
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Ground classes
const GRASS = 1, TALL = 2, PATH = 3, COBBLE = 4, SAND = 5, DUNE = 6, WATER = 7, ROCK = 8, FACE = 9, PIER = 10;
const SOFT = new Set(['g', 'G', 's', 'd', '~', 'p', 'f', 'T', 'b']);
const classOf = (ch) => ({ g: GRASS, f: GRASS, T: GRASS, b: GRASS, G: TALL, p: PATH, c: COBBLE, s: SAND, d: DUNE, '~': WATER, r: ROCK, e: ROCK, R: FACE, w: PIER }[ch] || GRASS);

function tileAt(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return 'g';
  return TERRAIN[ty][tx];
}

export function paintGround() {
  const cls = new Uint8Array(W * H);
  // 1. Classify every pixel; soft borders are warped by noise so coasts and paths look organic.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const raw = tileAt(Math.floor(x / T), Math.floor(y / T));
      let ch = raw;
      if (SOFT.has(raw)) {
        const dx = (noise(x * 0.09, y * 0.09, 11) - 0.5) * 9;
        const dy = (noise(x * 0.09 + 40, y * 0.09 + 40, 23) - 0.5) * 9;
        const warped = tileAt(Math.floor((x + dx) / T), Math.floor((y + dy) / T));
        if (SOFT.has(warped)) ch = warped;
      }
      cls[y * W + x] = classOf(ch);
    }
  }

  // 2. Distance (in px) from water to land and from land to water, by breadth-first search.
  const distField = (isSource) => {
    const d = new Int16Array(W * H).fill(999);
    const q = new Int32Array(W * H);
    let head = 0, tail = 0;
    for (let i = 0; i < W * H; i++) if (isSource(cls[i])) { d[i] = 0; q[tail++] = i; }
    while (head < tail) {
      const i = q[head++], x = i % W, y = (i / W) | 0, nd = d[i] + 1;
      if (nd > 60) continue;
      if (x > 0 && d[i - 1] > nd) { d[i - 1] = nd; q[tail++] = i - 1; }
      if (x < W - 1 && d[i + 1] > nd) { d[i + 1] = nd; q[tail++] = i + 1; }
      if (y > 0 && d[i - W] > nd) { d[i - W] = nd; q[tail++] = i - W; }
      if (y < H - 1 && d[i + W] > nd) { d[i + W] = nd; q[tail++] = i + W; }
    }
    return d;
  };
  const toLand = distField((c) => c !== WATER && c !== PIER);
  const toWater = distField((c) => c === WATER);

  const [canvas, ctx] = makeCanvas(W, H);
  const img = ctx.createImageData(W, H);
  const out = img.data;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? GRASS : cls[y * W + x]);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x, c = cls[i];
      const n = fbm(x * 0.045, y * 0.045, 5, 2);
      const h = hash(x, y, 3);
      let col;
      if (c === GRASS || c === TALL) {
        col = c === GRASS ? lerp(C.grassDark, C.grassLight, n * 0.9) : lerp(C.grassDeep, C.grassDark, n);
        if (h > 0.985) col = c === GRASS ? C.tallTip : C.grassDark;
        else if (h < 0.025) col = lerp(col, C.grassDeep, 0.6);
        // tiny wildflowers on open grass
        if (c === GRASS && hash(x >> 2, y >> 2, 91) > 0.992 && (x & 3) === 1 && (y & 3) === 1) col = hash(x, y, 5) > 0.5 ? C.flowerWhite : C.flowerYellow;
        // shade under a cliff face
        for (let k = 1; k <= 4; k++) if (at(x, y - k) === FACE) { col = lerp(col, C.grassDeep, 0.55 - k * 0.1); break; }
      } else if (c === PATH) {
        col = lerp(C.pathDark, C.pathLight, n);
        if (h > 0.975) col = C.pathLight;
        else if (h < 0.03) col = C.pathDark;
        const edge = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some((v) => v !== PATH && v !== COBBLE && v !== PIER);
        if (edge) col = C.pathEdge;
      } else if (c === COBBLE) {
        const row = Math.floor(y / 5), off = (row % 2) * 3, sx = Math.floor((x + off) / 7);
        const mortar = y % 5 === 4 || (x + off) % 7 === 6;
        const v = hash(sx, row, 13);
        col = mortar ? C.cobbleDark : lerp(C.cobble, C.cobbleLight, v * 0.8);
        if (!mortar && y % 5 === 0) col = lerp(col, C.cobbleLight, 0.5);
        if (!mortar && y % 5 === 3) col = lerp(col, C.cobbleDark, 0.25);
      } else if (c === SAND || c === DUNE) {
        col = lerp(C.sandDark, C.sandLight, n);
        const ripple = Math.sin(x * 0.22 + y * 0.9 + fbm(x * 0.05, y * 0.05, 7) * 8);
        if (ripple > 0.93) col = lerp(col, C.sandLight, 0.6);
        if (ripple < -0.95) col = lerp(col, C.sandDark, 0.5);
        const dw = toWater[i];
        if (dw < 7) col = lerp(col, C.wetSand, (7 - dw) / 9);
        if (h > 0.996) col = hash(x, y, 77) > 0.5 ? C.flowerWhite : [232, 168, 160];
        if (c === DUNE) {
          // grass tufts
          const cx = Math.floor(x / 9), cy = Math.floor(y / 8);
          if (hash(cx, cy, 31) > 0.55) {
            const ox = cx * 9 + 2 + Math.floor(hash(cx, cy, 32) * 5), oy = cy * 8 + 3 + Math.floor(hash(cx, cy, 33) * 4);
            const dx = x - ox, dy = y - oy;
            if ((dy === 0 && Math.abs(dx) <= 1) || (dy === -1 && (dx === -1 || dx === 1)) || (dy === -2 && dx === 0)) col = dy === -2 ? C.tallTip : C.grassDark;
          }
        }
      } else if (c === WATER || c === PIER) {
        const dl = toLand[i];
        const t = Math.min(1, dl / 42);
        col = lerp(C.waterShallow, C.waterDeep, Math.pow(t, 0.75));
        if (dl < 9) col = lerp(col, C.waterLight, (9 - dl) / 14);
        const streak = noise(x * 0.11, y * 0.55, 17);
        if (streak > 0.8 && hash(x >> 1, y, 21) > 0.35) col = lerp(col, C.waterLight, 0.35);
        if (c === PIER) {
          const px0 = x - 22 * T; // pier spans tiles 22-23
          const board = y % 5;
          const plank = hash(Math.floor(y / 5), 0, 41);
          col = lerp(C.wood, C.woodLight, plank * 0.7);
          if (board === 4) col = C.woodDark;
          if (board === 0) col = lerp(col, C.woodLight, 0.4);
          if (px0 <= 1 || px0 >= 30) col = C.woodDark;
          if ((px0 <= 2 || px0 >= 29) && y % 16 < 3) col = [70, 44, 30];
        }
      } else if (c === ROCK) {
        const big = fbm(x * 0.02, y * 0.02, 63, 3);
        col = lerp(C.boneMid, C.boneLight, Math.min(1, n * 0.7 + big * 0.5));
        // flat slabs with soft shading
        const slab = noise(x * 0.06, y * 0.06, 64);
        if (slab > 0.62) col = lerp(col, C.boneLight, 0.35);
        if (slab < 0.3) col = lerp(col, C.boneFace, 0.25);
        const crack = Math.abs(noise(x * 0.07, y * 0.07, 61) - 0.5);
        if (crack < 0.014) col = C.boneFace;
        if (crack < 0.006) col = C.boneDark;
        // hardy grass tufts and moss in the cracks
        if (big < 0.42 && hash(x >> 1, y >> 1, 66) > 0.82) col = lerp(C.grassDark, C.grass, hash(x, y, 67));
        if (h > 0.988) col = C.boneDark;
        const edge = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some((v) => v !== ROCK && v !== PATH && v !== FACE);
        const edge2 = [at(x - 2, y), at(x + 2, y), at(x, y - 2), at(x, y + 2)].some((v) => v !== ROCK && v !== PATH && v !== FACE);
        if (edge) col = C.boneDark;
        else if (edge2) col = C.boneFace;
      } else if (c === FACE) {
        // vertical cliff face, 2 tiles tall
        let top = y;
        while (top > 0 && at(x, top - 1) === FACE) top--;
        const fy = y - top;
        const stria = noise(x * 0.35, 0, 71);
        col = lerp(C.boneFace, C.boneDark, Math.min(1, fy / 30) * 0.7 + (stria > 0.6 ? 0.15 : 0));
        if (fy < 2) col = C.boneLight;
        else if (fy < 3) col = C.boneMid;
        if (h > 0.97) col = C.boneDark;
      } else {
        col = C.grass;
      }
      const o = i * 4;
      out[o] = col[0]; out[o + 1] = col[1]; out[o + 2] = col[2]; out[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Foam frames along the shore
  const foam = [0, 1].map((f) => {
    const [fc, fx] = makeCanvas(W, H);
    const fi = fx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      if (cls[i] !== WATER) continue;
      const d = toLand[i];
      const x = i % W, y = (i / W) | 0;
      const band = f === 0 ? d >= 1 && d <= 2 : d >= 3 && d <= 4;
      if (band && hash(x >> 1, y, 50 + f) > (f === 0 ? 0.3 : 0.55)) {
        const o = i * 4;
        fi.data[o] = 232; fi.data[o + 1] = 246; fi.data[o + 2] = 251; fi.data[o + 3] = f === 0 ? 220 : 150;
      }
    }
    fx.putImageData(fi, 0, 0);
    return fc;
  });

  // Candidate positions for sparkles on open water
  const sparkles = [];
  for (let k = 0; k < 4000 && sparkles.length < 140; k++) {
    const x = Math.floor(hash(k, 1, 7) * W), y = Math.floor(hash(k, 2, 7) * H);
    const i = y * W + x;
    if (cls[i] === WATER && toLand[i] > 10) sparkles.push([x, y]);
  }
  return { canvas, foam, sparkles };
}
