// Generated houses (optional: GEN.facade). A small shape grammar in three passes, as in
// procedural architecture:
//   1. massing   the big shape of the kind (tower, hall, castle...), its storeys and its roof type;
//   2. facade    walls, bays, where windows and the door go, the sign;
//   3. details   shutters, flower boxes, awnings, chimneys, lamps, the emblem.
// The pieces are drawn by hand in code; the generator decides how they combine. The big shapes
// stay predictable (the silhouette tells the learner what kind of knowledge is inside); the small
// details vary. Everything is deterministic: seeded(`${b.id}:facade`), never Math.random.
//
// paintFacade(b, { theme, seed, district, slot }) returns { canvas, lit, glows } like the painters
// in art/buildings.js: same footprint, door where KINDS puts it, canvas one tile taller.
import { THEME, THEMES, seeded } from './core.js';
import { drawEmblem } from './emblems.js';
import { P } from '../art/palette.js';
import { makeCanvas, rect, px, ellipse, mix, hash } from '../art/px.js';
import { drawText, textWidth } from '../art/buildings.js';

const INK = P.ink;
const tone = (c, t) => (t >= 0 ? mix(c, '#ffffff', t) : mix(c, INK, -t));
const shades = (c) => ({ b: c, l: tone(c, 0.2), ll: tone(c, 0.42), d: tone(c, -0.22), dd: tone(c, -0.45) });
const shadow = (a) => `rgba(27,26,43,${a})`;
const MAX_GLOWS = 7;

// ---------------------------------------------------------------- materials
// Roof colour: the district's family (stable per district, so place helps memory), one step
// lighter or darker per house. Wall colour and the "strong feature" follow the house's slot in its
// district, so two houses of one district never share both.
const ROOF_STEP = [0, 0.2, -0.2, 0.36];
function materials(F, o) {
  const { th, r, b } = F;
  const di = o.district ?? b.di, slot = o.slot ?? b.dj ?? r.int(0, 3);
  const fam = di == null || di < 0 ? th.hubRoof || th.roofs[0] : th.roofs[di % th.roofs.length];
  const roof = shades(tone(fam, ROOF_STEP[slot % 4] + (r() - 0.5) * 0.06));
  const wall = shades(tone(th.wall[(slot + (di > 0 ? di : 0)) % th.wall.length], (r() - 0.5) * 0.06));
  const S = F.S;
  return {
    roof, wall, fam: shades(fam), trim: th.trim, wood: shades(th.wood), stone: shades(th.stone),
    door: shades(S.doors[(slot + r.int(0, 3)) % S.doors.length]), shutter: shades(S.shutters[(slot + (di > 0 ? di : 0)) % S.shutters.length]),
    accent: th.accent, slot, feat: (slot + (di > 0 ? di : 0)) % 4,
  };
}

function start(b, o = {}) {
  const th = o.theme || THEME, S = th.style || THEMES.harbour.style;
  const W = b.w * 16, H = b.h * 16 + 16;
  const [canvas, ctx] = makeCanvas(W, H), [litC, lit] = makeCanvas(W, H);
  const r = seeded(o.seed ?? `${b.id}:facade`);
  const xs = b.doors.map(([x]) => (x - b.x) * 16);
  const dl = Math.min(...xs), dr = Math.max(...xs) + 16;
  const F = { b, th, S, W, H, canvas, ctx, litC, lit, r, dl, dr, dc: (dl + dr) / 2, glows: [], label: (b.label || String(b.kind || '').toUpperCase()).slice(0, 9), emblem: b.emblem };
  F.M = materials(F, o);
  return F;
}
const done = (F, extra = {}) => ({ canvas: F.canvas, lit: F.litC, glows: F.glows, ...extra });
const glow = (F, x, y, kind = 'warm') => { if (kind !== 'warm' || F.glows.filter((g) => g[2] === 'warm').length < MAX_GLOWS) F.glows.push([Math.round(x), Math.round(y), kind]); };

// ---------------------------------------------------------------- pass 1: roofs
function roofTex(F, x, y, w, h, R, tex) {
  const { ctx } = F;
  rect(ctx, x, y, w, h, R.d);
  if (tex === 'seam') {
    rect(ctx, x, y, w, h, R.b);
    for (let k = x + 2; k < x + w - 1; k += 4) { rect(ctx, k, y, 1, h, R.d); rect(ctx, k + 1, y, 1, h, R.l); }
  } else {
    const rowH = tex === 'slate' ? 3 : 4, step = tex === 'slate' ? 5 : 7;
    for (let yy = y, row = 0; yy < y + h; yy += rowH, row++) {
      const t = (yy - y) / Math.max(1, h), base = t < 0.5 ? mix(R.l, R.b, t * 2) : mix(R.b, R.d, (t - 0.5) * 1.2);
      const hh = Math.min(rowH - 1, y + h - yy);
      rect(ctx, x, yy, w, hh, base);
      if (tex === 'tile') rect(ctx, x, yy, w, 1, tone(base, 0.12));
      const off = row % 2 ? Math.floor(step / 2) : 0;
      for (let k = x + off - step; k < x + w; k += step) {
        const n = hash(k, yy, 11);
        if (n > 0.78) rect(ctx, Math.max(x, k + 1), yy + (tex === 'tile' ? 1 : 0), step - 1, hh - (tex === 'tile' ? 1 : 0), tone(base, 0.07));
        else if (n < 0.18) rect(ctx, Math.max(x, k + 1), yy, step - 1, hh, tone(base, -0.08));
        if (k >= x) rect(ctx, k, yy, 1, hh, mix(base, R.dd, 0.6));
      }
    }
  }
}

// type: slope | hip | gable | mansard | flat. Returns where a mark (emblem, kind sign) fits best.
function roof(F, type, x, y, w, h, o = {}) {
  const { ctx, M, S } = F, R = o.R || M.roof, tex = o.tex || S.tex;
  const info = { type, x, y, w, h, cx: x + w / 2, cy: y + h / 2 - 2 };
  if (type === 'flat') {
    const deck = Math.max(3, h - 9), dc = mix(F.th.stone, '#d8d6cf', 0.55);
    rect(ctx, x, y, w, h, INK);
    rect(ctx, x + 1, y + 1, w - 2, deck, dc);
    for (let k = 0; k < (w * deck) / 18; k++) px(ctx, x + 2 + hash(k, 1, 5) * (w - 4), y + 2 + hash(k, 2, 5) * (deck - 2), tone(dc, -0.12));
    rect(ctx, x + 1, y + deck, w - 2, 1, tone(dc, -0.25));
    // parapet with a cornice in the roof colour
    rect(ctx, x + 1, y + deck + 1, w - 2, h - deck - 3, R.b);
    rect(ctx, x + 1, y + deck + 1, w - 2, 1, R.l);
    rect(ctx, x + 1, y + h - 3, w - 2, 1, R.d);
    rect(ctx, x, y + h - 2, w, 2, INK);
    info.cy = y + deck / 2; info.deck = deck;
    return info;
  }
  if (type === 'mansard') {
    const top = Math.max(4, Math.round(h * 0.28));
    rect(ctx, x, y, w, h, INK);
    rect(ctx, x + 1, y + 1, w - 2, top - 1, R.l);
    for (let k = x + 3; k < x + w - 2; k += 6) rect(ctx, k, y + 1, 1, top - 1, R.b);
    rect(ctx, x + 1, y + top, w - 2, 1, F.M.trim);
    roofTex(F, x + 1, y + top + 1, w - 2, h - top - 3, R, tex);
    rect(ctx, x, y + h - 2, w, 2, INK);
    info.cy = y + top + (h - top) / 2 - 1; info.top = top;
    return info;
  }
  roofTex(F, x + 1, y + 1, w - 2, h - 3, R, tex);
  rect(ctx, x, y, w, 1, INK); rect(ctx, x, y, 1, h, INK); rect(ctx, x + w - 1, y, 1, h, INK);
  rect(ctx, x + 1, y + 1, w - 2, 1, R.ll); // ridge
  rect(ctx, x, y + h - 2, w, 2, INK); // eave
  rect(ctx, x + 1, y + h - 3, w - 2, 1, R.dd);
  if (type === 'hip') {
    const ins = Math.min(Math.round(w * 0.22), Math.round(h * 0.8)), cut = Math.round(ins * 0.45);
    for (let yy = y; yy < y + h - 2; yy++) {
      const t = 1 - (yy - y) / (h - 2), sl = Math.round(cut * t), hl = Math.round(ins * t);
      ctx.clearRect(x, yy, sl, 1); ctx.clearRect(x + w - sl, yy, sl, 1);
      if (hl > sl) { rect(ctx, x + sl, yy, hl - sl, 1, mix(R.l, R.b, 0.3)); rect(ctx, x + w - hl, yy, hl - sl, 1, R.d); }
      px(ctx, x + sl, yy, INK); px(ctx, x + w - 1 - sl, yy, INK);
      if (hl > sl) { px(ctx, x + hl, yy, R.ll); px(ctx, x + w - 1 - hl, yy, R.dd); }
    }
    rect(ctx, x + cut, y, w - 2 * cut, 1, INK);
  }
  if (type === 'gable') { // a front gable over the door: wall triangle, barge boards, a round window or the emblem
    const gw = o.gw || Math.min(w - 8, 44), gx = Math.round(o.gx ?? x + w / 2), gh = h - 2;
    for (let yy = y; yy < y + gh; yy++) {
      const half = Math.round(((yy - y + 1) / gh) * gw / 2);
      rect(ctx, gx - half, yy, half * 2, 1, (yy - y) % 4 === 3 && F.S.wall !== 'ashlar' ? M.wall.d : M.wall.b);
      rect(ctx, gx - half - 3, yy, 3, 1, R.b); rect(ctx, gx + half, yy, 3, 1, R.d);
      px(ctx, gx - half - 3, yy, INK); px(ctx, gx + half + 2, yy, INK); px(ctx, gx - half - 1, yy, M.trim); px(ctx, gx + half, yy, M.trim);
    }
    rect(ctx, gx - 1, y, 2, 2, INK);
    rect(ctx, gx - gw / 2 - 3, y + gh, gw + 6, 2, INK);
    rect(ctx, gx - gw / 2, y + gh - 3, gw, 3, shadow(0.18));
    info.cx = gx; info.cy = y + Math.round(gh * 0.62); info.gw = gw; info.gable = true;
  }
  return info;
}

function chimney(F, x, top, h, R) {
  const { ctx } = F, c = R || F.M.stone;
  rect(ctx, x, top, 8, h, INK);
  rect(ctx, x + 1, top + 2, 6, h - 2, c.b);
  for (let y = top + 4; y < top + h; y += 3) rect(ctx, x + 1, y, 6, 1, c.d);
  rect(ctx, x + 1, top + 2, 1, h - 2, c.l); rect(ctx, x + 6, top + 2, 1, h - 2, c.d);
  rect(ctx, x - 1, top, 10, 2, INK); rect(ctx, x, top, 8, 1, c.l);
}

// ---------------------------------------------------------------- pass 2: walls, windows, doors, signs
function wall(F, x, y, w, h, o = {}) {
  const { ctx, M, S } = F, C = o.C || M.wall, tex = o.tex || S.wall;
  rect(ctx, x, y, w, h, C.b);
  if (tex === 'clapboard') for (let k = y + 4; k < y + h - 3; k += 4) { rect(ctx, x, k, w, 1, tone(C.b, -0.1)); rect(ctx, x, k + 1, w, 1, tone(C.b, 0.06)); }
  else if (tex === 'boards') for (let k = x + 3; k < x + w; k += 5) { rect(ctx, k, y, 1, h, tone(C.b, -0.16)); rect(ctx, k + 1, y, 1, h, tone(C.b, 0.08)); }
  else if (tex === 'ashlar' || tex === 'brick') {
    const rh = tex === 'brick' ? 4 : 6, bw = tex === 'brick' ? 8 : 11, mortar = tone(C.b, tex === 'brick' ? 0.25 : -0.14);
    for (let k = y, row = 0; k < y + h; k += rh, row++) {
      rect(ctx, x, k, w, 1, mortar);
      for (let j = x + (row % 2 ? bw >> 1 : 0) - bw; j < x + w; j += bw) {
        const n = hash(j, k, 3);
        if (n > 0.7) rect(ctx, Math.max(x, j + 1), k + 1, bw - 1, rh - 1, tone(C.b, 0.07)); else if (n < 0.25) rect(ctx, Math.max(x, j + 1), k + 1, bw - 1, rh - 1, tone(C.b, -0.07));
        if (j >= x) rect(ctx, j, k + 1, 1, rh - 1, mortar);
      }
    }
  } else if (tex === 'metal') for (let k = x + 1; k < x + w; k += 3) { rect(ctx, k, y, 1, h, tone(C.b, 0.14)); rect(ctx, k + 1, y, 1, h, tone(C.b, -0.12)); }
  else for (let k = 0; k < (w * h) / 40; k++) px(ctx, x + hash(k, 3, 9) * w, y + hash(k, 4, 9) * h, tone(C.b, -0.06));
  if (o.quoins ?? S.quoins) for (let k = y + 3, i = 0; k < y + h - 3; k += 5, i++) { const qw = i % 2 ? 4 : 6; [x + 1, x + w - 1 - qw].forEach((qx) => { rect(ctx, qx, k, qw, 4, M.stone.l); rect(ctx, qx, k + 4, qw, 1, M.stone.d); }); }
  // light from the upper left: shadow under the eave, a lit left edge, a darker right edge
  rect(ctx, x, y, w, 2, shadow(0.32)); rect(ctx, x, y + 2, w, 2, shadow(0.14));
  rect(ctx, x + 1, y, 1, h, 'rgba(255,255,255,0.18)'); rect(ctx, x + w - 3, y, 2, h, shadow(0.12));
  if (!o.noBase) { rect(ctx, x, y + h - 4, w, 4, M.stone.b); rect(ctx, x, y + h - 4, w, 1, M.stone.l); rect(ctx, x, y + h - 1, w, 1, M.stone.d); }
  rect(ctx, x, y, 1, h, INK); rect(ctx, x + w - 1, y, 1, h, INK);
}

const WIN = { square: [10, 9], tall: [8, 12], wide: [14, 9], arched: [9, 12], round: [8, 8], narrow: [8, 9], slit: [4, 10], grid: [14, 11] };
// A window centred on cx with its bottom at `bottom`. Draws the lit pane on the lit layer.
function win(F, cx, bottom, style, o = {}) {
  const { ctx, lit, M } = F, [w, h] = o.size || WIN[style] || WIN.square;
  const x = Math.round(cx - w / 2), y = bottom - h, fr = o.frame || M.trim, glass = o.glass || P.window;
  const arch = style === 'arched', round = style === 'round';
  const shape = (c, ins, col) => { // fill the window shape inset by `ins`
    for (let yy = y + ins; yy < y + h - ins; yy++) {
      let a = ins;
      if (arch) { const dy = (y + w / 2) - yy; if (dy > 0) a = Math.max(ins, Math.round(w / 2 - Math.sqrt(Math.max(0, (w / 2) ** 2 - dy * dy)))); }
      if (round) { const dy = yy - (y + h / 2 - 0.5); a = Math.max(ins, Math.round(w / 2 - Math.sqrt(Math.max(0, (w / 2) ** 2 - dy * dy)))); }
      if (w - 2 * a > 0) { c.fillStyle = col; c.fillRect(x + a, yy, w - 2 * a, 1); }
    }
  };
  // outline: the frame shape, grown by one pixel
  ctx.fillStyle = INK;
  for (let yy = y - 1; yy <= y + h; yy++) {
    let a = 0;
    const in0 = Math.min(Math.max(yy, y), y + h - 1);
    if (arch) { const dy = (y + w / 2) - in0; if (dy > 0) a = Math.round(w / 2 - Math.sqrt(Math.max(0, (w / 2) ** 2 - dy * dy))); }
    if (round) { const dy = in0 - (y + h / 2 - 0.5); a = Math.round(w / 2 - Math.sqrt(Math.max(0, (w / 2) ** 2 - dy * dy))); }
    ctx.fillRect(x + a - 1, yy, w - 2 * a + 2, 1);
  }
  shape(ctx, 0, fr);
  shape(ctx, 1, glass);
  // a reflection from the upper left
  rect(ctx, x + 1, y + (arch ? 3 : 1), Math.max(1, w - 2), 1, mix(glass, P.glass, 0.55));
  px(ctx, x + 2, y + (arch ? 4 : 2), mix(glass, P.glass, 0.4));
  shape(lit, 1, P.windowLit);
  lit.fillStyle = P.windowLitHot; lit.fillRect(x + 2, y + Math.round(h * 0.25), Math.max(1, w - 4), Math.max(1, Math.round(h * 0.3)));
  // mullions
  const bars = (c) => {
    c.fillStyle = fr;
    if (style === 'wide' || style === 'grid') { c.fillRect(x + Math.round(w / 3), y + 1, 1, h - 2); c.fillRect(x + Math.round((2 * w) / 3), y + 1, 1, h - 2); c.fillRect(x + 1, y + Math.floor(h / 2), w - 2, 1); if (style === 'grid') c.fillRect(x + 1, y + Math.floor(h / 4), w - 2, 1); }
    else if (style === 'tall') { c.fillRect(x + Math.floor(w / 2), y + 1, 1, h - 2); c.fillRect(x + 1, y + Math.round(h / 3), w - 2, 1); c.fillRect(x + 1, y + Math.round((2 * h) / 3), w - 2, 1); }
    else if (style === 'round') { c.fillRect(x + Math.floor(w / 2), y + 1, 1, h - 2); c.fillRect(x + 1, y + Math.floor(h / 2), w - 2, 1); }
    else if (style === 'slit') {}
    else { c.fillRect(x + Math.floor(w / 2), y + 1, 1, h - 2); c.fillRect(x + 1, y + Math.floor(h / 2) + (arch ? 1 : 0), w - 2, 1); }
  };
  bars(ctx); bars(lit);
  if (o.curtain) { lit.fillStyle = '#f0a85a'; lit.fillRect(x + 1, y + 1, 2, h - 2); lit.fillRect(x + w - 3, y + 1, 2, h - 2); }
  if (!round && style !== 'slit') { rect(ctx, x - 2, y + h + 1, w + 4, 1, INK); rect(ctx, x - 1, y + h, w + 2, 1, o.sill || M.stone.l); }
  if (o.shutters) {
    const S = o.shutters, sw = 3;
    [x - sw - 1, x + w + 1].forEach((sx) => { rect(ctx, sx - (sx < x ? 1 : 0), y - 1, sw + 1, h + 2, INK); rect(ctx, sx + (sx < x ? 0 : 0), y, sw, h, S.b); for (let k = y + 1; k < y + h; k += 2) rect(ctx, sx, k, sw, 1, S.d); rect(ctx, sx, y, 1, h, S.l); });
  }
  if (o.box) {
    rect(ctx, x - 1, y + h + 1, w + 2, 3, INK); rect(ctx, x, y + h + 1, w, 2, o.box.b || M.wood.b);
    for (let k = 0; k < w; k += 2) { px(ctx, x + k, y + h, k % 4 ? P.flowerRed : P.flowerYellow); px(ctx, x + k + 1, y + h - 1, P.grassLight); }
  }
  if (o.awning) {
    const A = o.awning, ay = y - 5, ax = x - 2, aw = w + 4;
    rect(ctx, ax - 1, ay - 1, aw + 2, 6, INK);
    for (let k = 0; k < aw; k++) { const c = Math.floor(k / 2) % 2 ? M.trim : A; rect(ctx, ax + k, ay, 1, 4, c); if (k % 2 === 0) px(ctx, ax + k, ay + 4, c); }
    rect(ctx, ax, ay, aw, 1, 'rgba(255,255,255,0.3)');
  }
  if (o.glow !== false) glow(F, cx, y + h / 2);
  return { x, y, w, h };
}

// Door centred on cx, bottom on the ground. Styles: plank, panel, arched, double, glass.
function door(F, cx, style, o = {}) {
  const { ctx, lit, H, M } = F, w = o.w || (style === 'double' ? 18 : style === 'glass' ? 14 : 10), h = o.h || (style === 'arched' ? 18 : 16);
  const x = Math.round(cx - w / 2), y = H - 1 - h, D = o.D || M.door;
  rect(ctx, x - 1, y - 1, w + 2, h + 1, INK);
  if (style === 'glass') {
    rect(ctx, x, y, w, h, P.metal); rect(ctx, x + 1, y + 1, w - 2, h - 1, P.glass);
    rect(ctx, x + Math.floor(w / 2), y + 1, 1, h - 1, P.metal);
    for (let k = 0; k < 4; k++) px(ctx, x + 2 + k, y + 2 + k, '#d8f1fa');
    lit.fillStyle = P.windowLit; lit.fillRect(x + 1, y + 1, w - 2, h - 1); lit.fillStyle = P.metal; lit.fillRect(x + Math.floor(w / 2), y + 1, 1, h - 1);
  } else {
    rect(ctx, x, y, w, h, D.dd); rect(ctx, x + 1, y + 1, w - 2, h - 1, D.b);
    if (style === 'plank') for (let k = x + 3; k < x + w - 1; k += 3) rect(ctx, k, y + 1, 1, h - 1, D.d);
    if (style === 'panel' || style === 'double') {
      const leaves = style === 'double' ? 2 : 1, lw = (w - 2) / leaves;
      for (let i = 0; i < leaves; i++) { const lx = Math.round(x + 1 + i * lw); rect(ctx, lx + 1, y + 2, Math.round(lw) - 2, 5, D.d); rect(ctx, lx + 1, y + 9, Math.round(lw) - 2, h - 11, D.d); rect(ctx, lx + 2, y + 3, Math.round(lw) - 4, 3, D.l); rect(ctx, lx + 2, y + 10, Math.round(lw) - 4, h - 13, D.l); }
      if (leaves === 2) rect(ctx, x + Math.floor(w / 2), y, 1, h, D.dd);
    }
    if (style === 'arched') { for (let k = x + 3; k < x + w - 1; k += 3) rect(ctx, k, y + 1, 1, h - 1, D.d); for (let k = 0; k < 3; k++) rect(ctx, x + 1, y + 4 + k * 5, w - 2, 1, P.metalDark); }
    rect(ctx, x + 1, y + 1, 1, h - 1, 'rgba(255,255,255,0.18)');
    px(ctx, x + w - 3, y + Math.floor(h / 2) + 1, P.gold);
    if (style === 'double') px(ctx, x + Math.floor(w / 2) - 2, y + Math.floor(h / 2) + 1, P.gold);
    if (style === 'arched') { // round the top corners
      for (let k = 0; k < 3; k++) { const c = 3 - k; ctx.clearRect(x - 1, y - 1 + k, c, 1); ctx.clearRect(x + w + 1 - c, y - 1 + k, c, 1); px(ctx, x - 1 + c, y - 1 + k, INK); px(ctx, x + w - c, y - 1 + k, INK); }
    }
    lit.fillStyle = 'rgba(255,190,100,0.35)'; lit.fillRect(x, y + h - 2, w, 2);
  }
  if (o.fanlight) { // a half-round window over the door that glows at night
    const fy = y - 5;
    for (let k = 0; k < 4; k++) { const half = Math.round(Math.sqrt(16 - (3 - k) * (3 - k)) * (w / 8)); rect(ctx, cx - half - 1, fy + k, half * 2 + 2, 1, INK); rect(ctx, cx - half, fy + k + 1, half * 2, 1, P.window); lit.fillStyle = P.windowLit; lit.fillRect(Math.round(cx - half), fy + k + 1, half * 2, 1); }
    rect(ctx, x - 1, y - 1, w + 2, 1, INK);
  }
  if (o.lintel) { rect(ctx, x - 3, y - 3, w + 6, 3, INK); rect(ctx, x - 2, y - 2, w + 4, 1, o.lintel); }
  // a step
  rect(ctx, x - 2, H - 2, w + 4, 2, M.stone.l); rect(ctx, x - 2, H - 2, w + 4, 1, tone(M.stone.l, 0.25));
  if (o.lamp) { // wall lamp beside the door
    const lx = o.lamp > 0 ? x + w + 3 : x - 5;
    rect(ctx, lx, y + 2, 3, 5, INK); rect(ctx, lx + 1, y + 3, 1, 3, P.lamp); px(ctx, lx + 1, y + 1, INK);
    lit.fillStyle = P.lampHot; lit.fillRect(lx + 1, y + 3, 1, 3);
    glow(F, lx + 1, y + 4);
  }
  return { x, y, w, h };
}

// The name sign, with the emblem at its left when there is room. Returns false for the emblem
// when it did not fit, so that the caller can put it on a gable or a roof.
function sign(F, cx, y, o = {}) {
  const { ctx } = F, tw = textWidth(F.label), withE = !!F.emblem && o.emblem !== false && tw + 18 <= (o.max ?? F.W - 4);
  const w = tw + 6 + (withE ? 11 : 0), x = Math.round(Math.max(1, Math.min(F.W - 1 - w, cx - w / 2)));
  const bg = o.bg || F.M.trim, fg = o.fg || INK;
  if (o.hang) { rect(ctx, x + 3, y - 3, 1, 3, INK); rect(ctx, x + w - 4, y - 3, 1, 3, INK); }
  rect(ctx, x, y, w, 9, INK); rect(ctx, x + 1, y + 1, w - 2, 7, bg); rect(ctx, x + 1, y + 1, w - 2, 1, tone(bg, 0.25));
  if (withE) { rect(ctx, x + 1, y - 1, 11, 11, INK); rect(ctx, x + 2, y, 9, 9, o.ebg || F.M.roof.d); drawEmblem(ctx, F.emblem, x + 2, y, 1, o.efg || F.M.accent); }
  drawText(ctx, F.label, x + 3 + (withE ? 11 : 0), y + 2, fg);
  return { x, w, emblem: withE };
}

// The emblem in a round medallion (gables, towers, roofs).
function medal(F, cx, cy, o = {}) {
  if (!F.emblem) return false;
  const { ctx } = F; cx = Math.round(cx); cy = Math.round(cy);
  ellipse(ctx, cx, cy, 7, 7, INK); ellipse(ctx, cx, cy, 6, 6, o.ring || F.M.accent); ellipse(ctx, cx, cy, 5, 5, o.bg || F.M.roof.dd);
  drawEmblem(ctx, F.emblem, cx - 4, cy - 4, 1, o.fg || F.M.accent);
  if (o.lit) drawEmblem(F.lit, F.emblem, cx - 4, cy - 4, 1, P.windowLitHot);
  return true;
}

// Windows in bays (one per tile) along a row, skipping the door and anything in `avoid` ([x0,x1]).
function windowRow(F, bottom, style, o = {}) {
  const { W, r } = F, [w] = WIN[style] || WIN.square, pad = o.shutters ? 4 : 1, out = [];
  const bays = [];
  for (let t = 0; t < W / 16; t++) {
    // edge bays move inwards so that shutters stay on the wall
    const cx = Math.max(2 + w / 2 + pad, Math.min(W - 2 - w / 2 - pad, t * 16 + 8)), x0 = cx - w / 2 - pad, x1 = cx + w / 2 + pad;
    if ((o.avoid || []).some(([a, bb]) => x1 > a && x0 < bb)) continue;
    if (bays.length && x0 < bays[bays.length - 1] + w / 2 + pad + 1) continue;
    bays.push(cx);
  }
  const every = o.every || 1;
  bays.forEach((cx, i) => { if (i % every === 0 || i === bays.length - 1) out.push(win(F, cx, bottom, style, { ...o, curtain: r.chance(0.3) })); });
  return out;
}

// ---------------------------------------------------------------- pass 3: details
function vines(F, x, top, bottom) {
  const { ctx } = F;
  for (let y = top; y < bottom; y++) { const w = 1 + Math.round(hash(x, y, 7) * 2); rect(ctx, x + Math.round(Math.sin(y / 3) * 1.5), y, w, 1, y % 3 ? P.grassDark : P.grassLight); if (hash(y, x, 8) > 0.85) px(ctx, x + 2, y, P.flowerPurple); }
}
function bush(F, x, y, w) { // a low round shrub with flowers, sitting on the ground line
  const { ctx } = F, cx = x + w / 2;
  ellipse(ctx, cx, y - 3, w / 2, 3, INK); ellipse(ctx, cx, y - 3, w / 2 - 1, 2, P.grassDark);
  rect(ctx, cx - w / 2 + 2, y - 5, w - 4, 1, P.grassLight); rect(ctx, x, y, w, 1, INK);
  for (let k = x + 2; k < x + w - 2; k += 3) px(ctx, k, y - 3 - (k % 2), hash(k, y, 4) > 0.5 ? P.flowerRed : P.flowerWhite);
}
function porch(F, cx, w, top, R) { // a little roof over the door on two posts
  const { ctx, H, M } = F, x = Math.round(cx - w / 2);
  rect(ctx, x, top, w, 6, INK); rect(ctx, x + 1, top + 1, w - 2, 3, R.b); rect(ctx, x + 1, top + 1, w - 2, 1, R.l); rect(ctx, x + 1, top + 4, w - 2, 1, R.dd);
  [x + 1, x + w - 3].forEach((pxx) => { rect(ctx, pxx, top + 6, 2, H - top - 8, INK); px(ctx, pxx, top + 6, M.trim); rect(ctx, pxx, top + 7, 1, H - top - 10, M.trim); });
}
function smoke(F, x, y) { const { ctx } = F; [[0, 0, 3], [2, -4, 2], [-1, -7, 2]].forEach(([dx, dy, s]) => { if (y + dy - s >= 0) rect(ctx, x + dx, y + dy - s, s, s, 'rgba(225,225,230,0.55)'); }); }

// ---------------------------------------------------------------- the kinds
// Roof height between lo and hi, steeper in steep-roofed themes.
const pitch = (F, lo, hi) => Math.round(lo + (hi - lo) * Math.max(0, Math.min(1, F.S.pitch + (F.r() - 0.5) * 0.3)));
const pickRoof = (F, allow) => { const l = F.S.roofs.filter((t) => allow.includes(t)); return l.length ? F.r.pick(l) : allow[0]; };

// A house with a front wall and a roof: lab, hall, the guide's cottage. `mark` paints the sign of
// the kind on the roof.
function house(F, cfg) {
  const { ctx, W, H, M, S, r, dc } = F;
  const storeys = cfg.storeys ?? (r.chance(0.5) ? 2 : 1), wallH = (storeys === 2 ? 50 : 33) + (cfg.extraWall || 0), wallTop = H - wallH;
  let type = cfg.roof || pickRoof(F, cfg.roofs || ['slope', 'hip', 'gable', 'mansard', 'flat']);
  const lo = Math.max(type === 'flat' ? 12 : 16, wallTop + 2 - 16), hi = wallTop + 2;
  let roofH = type === 'flat' ? Math.max(lo, Math.min(hi, 14 + r.int(0, 4))) : pitch(F, lo, hi);
  const roofTop = wallTop + 2 - roofH;
  wall(F, 0, wallTop, W, wallH, cfg.wall || {});
  // chimney behind the roof edge, unless the mark needs the whole roof
  const chim = type !== 'flat' && r.chance(S.chimney) && !cfg.noChimney;
  const cxh = chim ? (r.chance(0.5) ? 6 + r.int(0, 6) : W - 14 - r.int(0, 6)) : 0;
  const info = roof(F, type, 0, roofTop, W, roofH, { gx: cfg.gableX ?? dc, gw: cfg.gw });
  if (chim) { chimney(F, cxh, Math.max(0, roofTop - 6), Math.min(14, roofH - 4)); if (r.chance(0.5)) smoke(F, cxh + 3, Math.max(0, roofTop - 7)); }
  if (type === 'mansard') { // dormers on the steep part
    const dy = roofTop + info.top + 2;
    [W * 0.22, W * 0.78].forEach((x) => { if (Math.abs(x - info.cx) < 18 && cfg.mark) return; rect(ctx, x - 6, dy - 2, 12, 3, INK); rect(ctx, x - 5, dy - 1, 10, 1, M.roof.l); win(F, x, dy + 10, 'narrow', { size: [7, 8] }); });
  }
  const markOn = cfg.mark ? cfg.mark(info) : false;
  if (!markOn && info.gable) medal(F, info.cx, info.cy, { lit: true });
  // the facade: door, sign, windows
  const style = cfg.window || r.pick(S.windows), feat = M.feat;
  const doorStyle = cfg.door || (S.wall === 'ashlar' ? 'arched' : r.pick(['plank', 'panel', 'panel']));
  const shutters = (feat === 0 || r.chance(S.shutters.length > 1 ? 0.15 : 0.05)) && style !== 'wide' && style !== 'arched' ? M.shutter : null;
  const wst = shutters && style === 'square' ? 'narrow' : style;
  const d = door(F, dc, doorStyle, { fanlight: cfg.fanlight ?? (doorStyle === 'panel' && r.chance(0.5)), lamp: r.chance(0.6) ? (r.chance(0.5) ? 1 : -1) : 0, w: cfg.doorW });
  const sg = cfg.sign !== false ? sign(F, dc, d.y - 12, { bg: cfg.signBg, fg: cfg.signFg, hang: true }) : null;
  if (sg && !sg.emblem && !info.gable && !markOn) medal(F, dc, Math.max(roofTop + 9, wallTop - 9));
  const avoid = [[d.x - 3, d.x + d.w + 3]]; if (sg) avoid.push([sg.x - 1, sg.x + sg.w + 1]);
  const box = (feat === 1 || r.chance(S.boxes * 0.5)) ? { b: M.wood.b } : null;
  const awning = (feat === 2 || r.chance(S.awning * 0.3)) && storeys === 1 ? M.roof.b : null;
  const ground = windowRow(F, H - 15, wst, { avoid, shutters, box, awning: awning && !shutters ? awning : null, every: cfg.every || 1 });
  if (storeys === 2) {
    const upAvoid = info.gable ? [] : [];
    const up = style === 'wide' && r.chance(0.5) ? 'square' : wst;
    windowRow(F, wallTop + 17, up, { avoid: upAvoid, shutters, box: box && r.chance(0.6) ? box : null, every: r.chance(0.3) ? 2 : 1 });
  }
  if (feat === 3) { if (r.chance(0.5)) vines(F, 3, wallTop + 4, H - 4); else vines(F, W - 6, wallTop + 4, H - 4); }
  if (cfg.porch ?? (feat === 2 && storeys === 2)) porch(F, dc, d.w + 10, d.y - 8, M.roof);
  if (r.chance(0.5)) bush(F, ground.length && ground[0].x < dc ? 3 : W - 15, H - 1, 12);
  return { info, wallTop, roofTop, storeys, d };
}

// A dark panel with a gold wireframe cube: the lab, where a mechanism is tried out.
function cube(F, cx, cy, s = 12) {
  const { ctx, lit } = F, a = Math.round(cx - (s + s / 2) / 2), b0 = Math.round(cy - (s + s / 2) / 2), h = s / 2;
  const pw = s + h + 8, ph = s + h + 7, x0 = Math.round(cx - pw / 2), y0 = Math.round(cy - ph / 2);
  rect(ctx, x0, y0, pw, ph, INK); rect(ctx, x0 + 1, y0 + 1, pw - 2, ph - 2, tone(F.M.roof.dd, -0.2)); rect(ctx, x0 + 1, y0 + 1, pw - 2, 1, F.M.roof.d);
  const line = (x0_, y0_, x1, y1) => { const n = Math.max(Math.abs(x1 - x0_), Math.abs(y1 - y0_)); for (let i = 0; i <= n; i++) { const X = Math.round(x0_ + (x1 - x0_) * i / n), Y = Math.round(y0_ + (y1 - y0_) * i / n); px(ctx, X, Y, P.gold); lit.fillStyle = '#ffe9a6'; lit.fillRect(X, Y, 1, 1); } };
  const A = a, B = b0;
  line(A, B + h, A + s, B + h); line(A, B + h + s, A + s, B + h + s); line(A, B + h, A, B + h + s); line(A + s, B + h, A + s, B + h + s);
  line(A + h, B, A + h + s, B); line(A + h, B + s, A + h + s, B + s); line(A + h, B, A + h, B + s); line(A + h + s, B, A + h + s, B + s);
  line(A, B + h, A + h, B); line(A + s, B + h, A + h + s, B); line(A, B + h + s, A + h, B + s); line(A + s, B + h + s, A + h + s, B + s);
  glow(F, cx, cy, 'warm');
}

function lab(F) {
  const { r, S } = F;
  return house(F, {
    roofs: ['slope', 'hip', 'gable', 'mansard', 'flat'],
    mark: (info) => {
      const cy = info.type === 'flat' ? info.y - 2 + Math.max(10, info.h / 2) : info.cy;
      if (info.type === 'flat') { // a cube on a plinth on the flat roof
        cube(F, info.cx, info.y + 4, 10);
        return false;
      }
      cube(F, info.gable ? info.cx : info.cx + (r.chance(0.5) ? 0 : 0), Math.min(cy, info.y + info.h - 14), info.h > 34 ? 12 : 10);
      return true;
    },
    storeys: S.pitch > 0.6 ? 1 : undefined,
  });
}

// The hall of choices: a wide hall, a board with a balance on the roof.
function hall(F) {
  const { ctx, M, W, r } = F;
  const brick = M.feat === 1 || (M.feat === 3 && r.chance(0.5));
  return house(F, {
    storeys: 1, extraWall: 8, window: r.pick(['tall', 'arched', 'tall']), door: 'double', doorW: 16, fanlight: true,
    roofs: ['slope', 'hip', 'mansard'],
    wall: brick ? { tex: 'brick', C: shades(tone('#a8553f', (r() - 0.5) * 0.15)), quoins: false } : {},
    noChimney: true,
    mark: (info) => {
      const bw = 50, bh = 22, cx = info.gable ? (info.cx < W / 2 ? W - 30 : 30) : W / 2, cy = Math.max(info.y + bh / 2 + 2, info.cy);
      const sx = Math.round(cx - bw / 2), sy = Math.round(cy - bh / 2);
      if (info.gable && sx < 2) return false;
      rect(ctx, sx, sy, bw, bh, INK); rect(ctx, sx + 1, sy + 1, bw - 2, bh - 2, '#f6f1e3'); rect(ctx, sx + 1, sy + bh - 3, bw - 2, 2, '#e3dccb');
      const bx = sx + bw / 2, by = sy + 3, C = M.roof.dd;
      rect(ctx, bx - 1, by, 2, 14, C); rect(ctx, bx - 6, by + 14, 12, 2, C); rect(ctx, bx - 18, by + 2, 36, 2, C); rect(ctx, bx - 2, by - 1, 4, 4, P.gold);
      [-17, 17].forEach((o, k) => { rect(ctx, bx + o, by + 4, 1, 5 + k * 2, INK); rect(ctx, bx + o - 5, by + 9 + k * 2, 11, 2, INK); rect(ctx, bx + o - 4, by + 10 + k * 2, 9, 2, k ? P.teal : P.gold); });
      return !info.gable;
    },
  });
}

function cottage(F) { return house(F, { roofs: ['slope', 'gable', 'hip'], storeys: 1, sign: false, every: 1 }); }

// The studio: a clinic with a flat roof, a coloured band with its name, a ring on the roof.
function studio(F) {
  const { ctx, lit, W, H, M, r, dc } = F;
  const two = r.chance(0.5), wallTop = two ? H - 56 : H - 42, roofTop = Math.max(0, wallTop - 46);
  const roofH = wallTop + 2 - roofTop;
  wall(F, 0, wallTop, W, H - wallTop, { tex: F.S.wall === 'ashlar' ? 'ashlar' : F.S.wall === 'boards' ? 'boards' : 'plaster', C: shades(mix(F.th.trim, M.wall.b, 0.45)), quoins: false });
  roof(F, 'flat', 0, roofTop, W, roofH, { R: shades(mix(M.roof.b, '#cfd4d6', 0.75)) });
  // the band with the sign, in the district colour
  rect(ctx, 0, wallTop, W, 10, M.roof.b); rect(ctx, 0, wallTop, W, 1, M.roof.l); rect(ctx, 0, wallTop + 9, W, 1, M.roof.dd); rect(ctx, 0, wallTop, 1, 10, INK); rect(ctx, W - 1, wallTop, 1, 10, INK);
  const sg = sign(F, W / 2, wallTop + 1, { bg: M.roof.b, fg: '#ffffff', ebg: M.roof.dd });
  // the ring on the roof (the scanner): kept, the colour follows the district
  const cx = Math.round(r.chance(0.5) ? W / 2 : W / 2 + (r.chance(0.5) ? -14 : 14)), cy = Math.round(roofTop + Math.min(21, (roofH - 10) / 2 + 2));
  for (let y = -18; y <= 18; y++) for (let x = -18; x <= 18; x++) {
    const rr = Math.sqrt(x * x + y * y * 1.6);
    if (rr <= 17 && rr >= 9.5) { let col = rr > 15.5 ? INK : rr < 11 ? M.roof.dd : '#f4f6f6'; if (rr >= 11 && rr <= 15.5) col = x - y < -6 ? '#ffffff' : x - y > 8 ? '#c9d2d4' : '#e9eeee'; px(ctx, cx + x, cy + y, col); }
    if (rr < 9.5 && rr > 8.5) px(ctx, cx + x, cy + y, INK);
    if (rr >= 9.5 && rr <= 11) { lit.fillStyle = '#7ff3e6'; lit.fillRect(cx + x, cy + y, 1, 1); }
  }
  rect(ctx, cx - 14, cy + 9, 28, 4, INK); rect(ctx, cx - 13, cy + 9, 26, 3, '#9aa6ab'); rect(ctx, cx - 13, cy + 9, 26, 1, '#c3ccd0');
  glow(F, cx, cy, 'teal');
  if (!sg.emblem) medal(F, cx < W / 2 ? W - 16 : 16, roofTop + 14);
  // canopy and glass door
  const d = door(F, dc, 'glass', { w: 14, h: 20 });
  const cw = r.chance(0.5) ? 20 : 26;
  rect(ctx, dc - cw / 2, d.y - 4, cw, 4, INK); rect(ctx, dc - cw / 2 + 1, d.y - 3, cw - 2, 2, M.roof.b); rect(ctx, dc - cw / 2 + 1, d.y - 3, cw - 2, 1, M.roof.l);
  glow(F, dc, d.y + 8);
  // window strips (one long glazed band, or separate windows), one or two rows
  const strip = r.chance(0.5), avoid = [[dc - cw / 2 - 2, dc + cw / 2 + 2]];
  const rows = two ? [H - 15, wallTop + 30] : [H - 15];
  rows.forEach((bottom, i) => {
    if (strip) {
      const segs = i === 0 ? [[4, avoid[0][0] - 1], [avoid[0][1] + 1, W - 4]] : [[4, W - 4]];
      segs.forEach(([a, bb]) => { if (bb - a < 10) return; rect(ctx, a - 1, bottom - 13, bb - a + 2, 14, INK); rect(ctx, a, bottom - 12, bb - a, 12, P.window); rect(ctx, a, bottom - 12, bb - a, 1, mix(P.window, P.glass, 0.6)); lit.fillStyle = P.windowLit; lit.fillRect(a, bottom - 12, bb - a, 12); lit.fillStyle = P.windowLitHot; lit.fillRect(a + 1, bottom - 10, bb - a - 2, 4); for (let k = a + 7; k < bb; k += 8) { rect(ctx, k, bottom - 12, 1, 12, '#e8eef0'); rect(lit, k, bottom - 12, 1, 12, '#e8eef0'); } rect(ctx, a - 1, bottom + 1, bb - a + 2, 1, M.stone.l); for (let k = a + 4; k < bb; k += 16) glow(F, k, bottom - 6); });
    } else windowRow(F, bottom, r.pick(['wide', 'square']), { avoid: i === 0 ? avoid : [], frame: '#e8eef0' });
  });
  if (M.feat === 1 || r.chance(0.4)) { bush(F, 2, H - 1, 12); bush(F, W - 14, H - 1, 12); }
  if (M.feat === 2) { rect(ctx, W - 10, roofTop + 4, 6, 8, INK); rect(ctx, W - 9, roofTop + 5, 4, 6, P.metalLight); } // a roof vent
  if (M.feat === 3) for (let k = 0; k < 3; k++) { rect(ctx, 6 + k * 6, roofTop + 4, 4, 3, INK); rect(ctx, 7 + k * 6, roofTop + 5, 2, 1, P.glass); } // skylights
  return done(F);
}

// The archive: columns and a pediment. Columns, roof colour, tympanum and steps vary.
function archive(F) {
  const { ctx, W, H, M, r, dc } = F;
  const roofH = pitch(F, 30, 42), entTop = roofH - 2;
  const C = shades(tone(F.th.trim, -0.06)), stoneW = shades(mix(M.wall.b, F.th.trim, 0.5));
  wall(F, 0, entTop, W, H - entTop, { C: shades(tone(stoneW.b, -0.12)), tex: 'ashlar', quoins: false, noBase: true });
  rect(ctx, 1, entTop + 12, W - 2, H - entTop - 12, shadow(0.18)); // the portico's shade
  roof(F, r.chance(0.5) ? 'hip' : 'slope', 0, 0, W, roofH, { tex: F.S.tex === 'slate' ? 'slate' : 'tile' });
  // pediment
  const pw = W - 10, ph = Math.min(roofH - 6, 18), py = roofH - ph - 1;
  for (let k = 0; k < ph; k++) { const half = Math.round(((k + 1) / ph) * pw / 2); rect(ctx, W / 2 - half - 1, py + k, half * 2 + 2, 1, INK); if (k > 0) rect(ctx, W / 2 - half + 1, py + k, half * 2 - 2, 1, k < 2 ? C.l : C.b); }
  rect(ctx, W / 2 - pw / 2 + 4, py + ph - 3, pw - 8, 1, C.d);
  if (!medal(F, W / 2, py + ph - 8, { bg: M.roof.d })) { ellipse(ctx, W / 2, py + ph - 7, 4, 3, INK); ellipse(ctx, W / 2, py + ph - 7, 3, 2, P.window); rect(F.lit, W / 2 - 2, py + ph - 8, 5, 3, P.windowLit); }
  if (r.chance(0.5)) { rect(ctx, W / 2 - 1, py - 4, 3, 4, INK); px(ctx, W / 2, py - 3, P.gold); } // acroterion
  // entablature with the name
  rect(ctx, 0, entTop, W, 11, INK); rect(ctx, 1, entTop + 1, W - 2, 9, C.b); rect(ctx, 1, entTop + 1, W - 2, 1, C.l); rect(ctx, 1, entTop + 9, W - 2, 1, C.d);
  for (let k = 4; k < W - 3; k += 4) px(ctx, k, entTop + 8, C.d);
  sign(F, W / 2, entTop + 1, { bg: C.b, fg: M.roof.dd, emblem: false });
  // columns: 4 or 6, round or square
  const n = r.pick([4, 4, 6]), round = r.chance(0.6), cw = n === 6 ? 4 : 6;
  const xs = n === 4 ? [5, 20, W - 20 - cw, W - 5 - cw] : [3, 13, 23, W - 23 - cw, W - 13 - cw, W - 3 - cw];
  const ct = entTop + 11, cb = H - 5;
  // windows between the columns, behind them
  const wst = r.pick(['tall', 'arched', 'tall']);
  [(xs[0] + xs[1] + cw) / 2, (xs[n - 2] + xs[n - 1] + cw) / 2].forEach((x) => win(F, x, H - 12, wst, { frame: C.l }));
  door(F, dc, r.pick(['double', 'panel', 'arched']), { w: 12, h: 18, fanlight: false });
  xs.forEach((x) => {
    rect(ctx, x - 1, ct, cw + 2, cb - ct, INK);
    rect(ctx, x, ct, cw, cb - ct, C.b);
    if (round) { rect(ctx, x, ct, 1, cb - ct, C.ll); rect(ctx, x + cw - 1, ct, 1, cb - ct, C.d); for (let k = x + 2; k < x + cw - 1; k += 2) rect(ctx, k, ct + 2, 1, cb - ct - 4, tone(C.b, -0.06)); }
    else { rect(ctx, x, ct, Math.floor(cw / 2), cb - ct, C.l); }
    rect(ctx, x - 2, ct, cw + 4, 3, INK); rect(ctx, x - 1, ct + 1, cw + 2, 1, C.l); // capital
    rect(ctx, x - 2, cb - 2, cw + 4, 3, INK); rect(ctx, x - 1, cb - 1, cw + 2, 1, C.l); // base
  });
  // steps across the front
  rect(ctx, 0, H - 4, W, 4, INK); rect(ctx, 1, H - 4, W - 2, 2, M.stone.ll); rect(ctx, 1, H - 2, W - 2, 2, M.stone.l);
  if (M.feat === 2 || r.chance(0.3)) [xs[1] + cw + 2, xs[n - 2] - 7].forEach((x) => { rect(ctx, x, ct + 2, 5, 14, INK); rect(ctx, x + 1, ct + 2, 3, 13, M.roof.b); px(ctx, x + 2, ct + 6, M.accent); }); // banners
  if (M.feat === 3) [2, W - 8].forEach((x) => { rect(ctx, x, H - 12, 6, 8, INK); rect(ctx, x + 1, H - 11, 4, 3, M.stone.l); bush(F, x - 1, H - 11, 8); }); // urns
  if (M.feat === 1) { const y = ct + 3; [xs[1] + cw + 3, xs[n - 2] - 6].forEach((x) => { rect(ctx, x, y, 3, 5, INK); px(ctx, x + 1, y + 1, P.lamp); F.lit.fillStyle = P.lampHot; F.lit.fillRect(x + 1, y + 1, 1, 2); glow(F, x + 1, y + 2); }); }
  glow(F, dc, H - 10);
  return done(F);
}

// The observatory: a tower with a light. Shape, bands, cap and windows vary.
function observatory(F) {
  const { ctx, lit, W, H, M, S, r, dc } = F;
  const style = M.feat === 3 ? r.pick(['stripes', 'plain', 'stone']) : S.tower, taper = r.chance(S.tower === 'stone' ? 0.3 : 0.7);
  const top = 30 + r.int(-2, 4), bottom = H - 1, band = r.pick([10, 13, 16]);
  const A = style === 'stone' ? shades(mix(F.th.stone, '#d8d2c4', 0.45)) : style === 'plain' ? M.wall : shades(F.th.trim), B = M.roof;
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / (bottom - top), half = Math.round(taper ? 11 + t * 7 : 14);
    const x0 = W / 2 - half, x1 = W / 2 + half, alt = style === 'stripes' && Math.floor((y - top) / band) % 2 === 1;
    const c = alt ? B : A;
    for (let x = x0; x <= x1; x++) {
      const u = (x - x0) / (x1 - x0);
      let col = u < 0.28 ? c.l : u > 0.72 ? c.d : c.b;
      if (style === 'stone' && ((y - top) % 6 === 0 || (x + (Math.floor((y - top) / 6) % 2) * 4) % 8 === 0)) col = tone(col, -0.14);
      if (style === 'plain' && (x - x0) % 5 === 0) col = tone(col, -0.12);
      if (x === x0 || x === x1) col = INK;
      px(ctx, x, y, col);
    }
  }
  if (style === 'plain') for (let y = top + 8; y < bottom; y += 20) rect(ctx, W / 2 - 14, y, 29, 2, B.b); // painted bands
  // gallery and lantern room
  const gy = top - 4;
  rect(ctx, W / 2 - 15, gy, 30, 5, INK); rect(ctx, W / 2 - 14, gy + 1, 28, 2, P.metal);
  for (let x = W / 2 - 14; x < W / 2 + 14; x += 3) rect(ctx, x, gy - 5, 1, 5, P.metalDark);
  rect(ctx, W / 2 - 14, gy - 6, 28, 1, P.metalDark);
  const lh = r.pick([11, 13]), ly = gy - 1 - lh;
  rect(ctx, W / 2 - 8, ly, 16, lh + 1, INK); rect(ctx, W / 2 - 7, ly + 1, 14, lh - 1, '#ffe9a6');
  for (let x = W / 2 - 4; x < W / 2 + 7; x += 4) rect(ctx, x, ly + 1, 1, lh - 1, P.metalDark);
  rect(ctx, W / 2 - 3, ly + 3, 6, 6, '#fff8dc');
  lit.fillStyle = '#fff6d0'; lit.fillRect(W / 2 - 7, ly + 1, 14, lh - 1);
  const cap = M.feat === 2 ? r.pick(['dome', 'cone', 'crenel']) : S.cap;
  if (cap === 'cone') { for (let k = 0; k < 9; k++) { const half = 2 + k; rect(ctx, W / 2 - half - 1, ly - 9 + k, half * 2 + 2, 1, INK); rect(ctx, W / 2 - half, ly - 9 + k, half, 1, B.l); rect(ctx, W / 2, ly - 9 + k, half, 1, B.d); } rect(ctx, W / 2, Math.max(0, ly - 13), 1, 4, P.metalDark); }
  else if (cap === 'crenel') { rect(ctx, W / 2 - 10, ly - 4, 20, 5, INK); rect(ctx, W / 2 - 9, ly - 3, 18, 3, B.b); for (let x = W / 2 - 10; x < W / 2 + 10; x += 5) { rect(ctx, x, ly - 7, 3, 4, INK); px(ctx, x + 1, ly - 6, B.l); } }
  else { ellipse(ctx, W / 2, ly - 1, 9, 4, INK); ellipse(ctx, W / 2, ly - 2, 8, 3, B.b); rect(ctx, W / 2 - 5, ly - 4, 4, 1, B.l); rect(ctx, W / 2 - 1, Math.max(0, ly - 9), 2, 5, P.metalDark); }
  // windows up the tower
  const wst = style === 'stone' ? 'slit' : r.pick(['round', 'round', 'narrow']);
  const n = r.int(2, 3);
  for (let i = 0; i < n; i++) { const y = top + 16 + i * Math.round((bottom - top - 44) / n); win(F, W / 2 + (i % 2 && r.chance(0.5) ? 3 : 0), y + 8, wst, { size: wst === 'round' ? [7, 7] : wst === 'slit' ? [3, 9] : [6, 8] }); }
  // balcony half way
  if (M.feat === 1) { const by = top + Math.round((bottom - top) * 0.45); rect(ctx, W / 2 - 15, by, 30, 3, INK); rect(ctx, W / 2 - 14, by, 28, 1, P.metalLight); for (let x = W / 2 - 14; x < W / 2 + 14; x += 3) rect(ctx, x, by - 4, 1, 4, P.metalDark); rect(ctx, W / 2 - 14, by - 5, 28, 1, P.metalDark); }
  medal(F, W / 2, bottom - 36, { bg: B.dd });
  // door, sign above it
  const d = door(F, dc, 'arched', { w: 10, h: 17 });
  sign(F, W / 2, d.y - 12, { bg: B.b, fg: '#ffffff', max: W - 2, emblem: false });
  glow(F, dc, d.y + 6);
  return done(F, { glows: [[W / 2, ly + lh / 2, 'lantern'], ...F.glows], beam: [W / 2, ly + lh / 2] });
}

// The workshop: a factory with a saw-tooth roof and a chimney. Teeth, chimneys, walls vary.
function workshop(F) {
  const { ctx, lit, W, H, M, r, dc } = F;
  const roofH = 40, n = r.pick([3, 3, 4, 2]), tw = W / n, flip = r.chance(0.3);
  const glassC = r.pick(['#9fd3e6', '#b8e0d0', '#c9d8f0']);
  const stacks = M.feat === 0 ? 2 : 1, sx = stacks === 2 ? [W * 0.2, W * 0.8] : [r.chance(0.5) ? W - 18 : 10];
  // stacks behind the roof
  sx.forEach((x, i) => { x = Math.round(x); const t = i ? 4 : 0; rect(ctx, x, t, 10, roofH - t, INK); rect(ctx, x + 1, t + 1, 8, roofH - t - 2, '#8c4a3a'); for (let y = t + 5; y < roofH; y += 4) rect(ctx, x + 1, y, 8, 1, '#7a3e30'); rect(ctx, x + 1, t + 1, 2, roofH - t - 2, '#a65a46'); rect(ctx, x - 1, t, 12, 3, INK); rect(ctx, x, t + 1, 10, 1, '#5a2f25'); rect(ctx, x + 1, t + 10, 8, 2, M.roof.b); if (r.chance(0.6)) smoke(F, x + 4, t); });
  for (let t = 0; t < n; t++) {
    const x0 = Math.round(t * tw), x1 = Math.round((t + 1) * tw);
    for (let k = 0; k < x1 - x0; k++) {
      const kk = flip ? x1 - x0 - 1 - k : k, hh = Math.round(26 * (1 - kk / (x1 - x0))) + 6, X = x0 + k;
      const col = kk < 2 ? INK : kk < 9 ? glassC : kk === 9 ? INK : mix(M.roof.l, M.roof.d, kk / (x1 - x0));
      rect(ctx, X, roofH - hh, 1, hh, col);
      px(ctx, X, roofH - hh, INK);
      if (kk >= 2 && kk < 9) { rect(lit, X, roofH - hh + 2, 1, hh - 6, '#ffe9a8'); if ((kk - 2) % 3 === 2) rect(ctx, X, roofH - hh, 1, hh, mix(glassC, INK, 0.35)); }
      else if (kk > 9 && kk % 4 === 0) rect(ctx, X, roofH - hh + 1, 1, hh - 1, M.roof.d);
    }
    glow(F, flip ? x1 - 6 : x0 + 6, roofH - 22);
  }
  rect(ctx, 0, roofH - 1, W, 2, INK);
  const wt = M.feat === 1 ? 'brick' : M.feat === 2 ? 'boards' : r.pick(['metal', 'brick', 'metal']);
  wall(F, 0, roofH, W, H - roofH, { tex: wt, C: wt === 'brick' ? shades('#9e5a44') : wt === 'boards' ? M.wall : shades('#aab2bd'), quoins: false });
  rect(ctx, 0, roofH, W, 10, INK); rect(ctx, 1, roofH, W - 2, 9, M.roof.b); rect(ctx, 1, roofH, W - 2, 1, M.roof.l);
  sign(F, W / 2, roofH, { bg: M.roof.b, fg: '#ffffff', ebg: M.roof.dd });
  // the big door: rolling shutter or barn doors
  const dw = 22, dx = Math.round(dc - dw / 2);
  rect(ctx, dx - 1, H - 31, dw + 2, 31, INK);
  if (r.chance(0.5)) { rect(ctx, dx, H - 30, dw, 30, '#4a5260'); for (let y = H - 28; y < H; y += 3) rect(ctx, dx, y, dw, 1, '#363c47'); rect(ctx, dx, H - 30, dw, 1, '#6a7484'); }
  else { const D = M.door; rect(ctx, dx, H - 30, dw, 30, D.b); rect(ctx, dc, H - 30, 1, 30, INK); [dx, dc + 1].forEach((x) => { const w = dw / 2 - 1; for (let k = 0; k < 30; k++) { px(ctx, x + Math.round((k / 30) * (w - 1)), H - 30 + k, D.l); } rect(ctx, x, H - 30, w, 2, D.dd); rect(ctx, x, H - 2, w, 2, D.dd); }); }
  rect(lit, dx, H - 9, dw, 9, 'rgba(255,200,110,0.5)');
  rect(ctx, dx - 2, H - 2, dw + 4, 2, F.M.stone.l);
  // factory windows
  const wst = r.pick(['grid', 'wide']);
  windowRow(F, H - 12, wst, { avoid: [[dx - 2, dx + dw + 2]], frame: '#e8eef0' });
  if (M.feat === 3 || r.chance(0.4)) { rect(ctx, W - 13, H - 9, 9, 8, INK); rect(ctx, W - 12, H - 8, 7, 6, F.M.wood.b); rect(ctx, W - 12, H - 6, 7, 1, F.M.wood.d); px(ctx, W - 9, H - 8, F.M.wood.l); } // a crate
  if (r.chance(0.5)) { rect(ctx, 2, roofH + 10, 3, H - roofH - 14, INK); rect(ctx, 3, roofH + 10, 1, H - roofH - 14, P.metalLight); } // a pipe
  glow(F, dc, H - 12);
  return done(F);
}

// The museum: a castle. Tower tops, tower widths, banners and stone vary.
function museum(F) {
  const { ctx, lit, W, H, M, S, r } = F;
  const st = shades(tone(S.castle || '#a8a4b0', (r() - 0.5) * 0.1)), st2 = shades(tone(st.b, 0.08));
  const stone = (x, y, w, h, c) => {
    rect(ctx, x, y, w, h, INK); rect(ctx, x + 1, y + 1, w - 2, h - 1, c.b);
    for (let yy = y + 6; yy < y + h; yy += 6) { rect(ctx, x + 1, yy, w - 2, 1, c.d); for (let xx = x + 1 + (((yy - y) / 6) % 2) * 5; xx < x + w - 1; xx += 10) rect(ctx, xx, yy - 5, 1, 5, c.d); }
    rect(ctx, x + 1, y + 1, 1, h - 1, c.l); rect(ctx, x + w - 3, y + 1, 2, h - 1, shadow(0.14));
  };
  const crenels = (x, y, w, c) => { for (let xx = x; xx < x + w - 3; xx += 8) { rect(ctx, xx, y - 6, 6, 7, INK); rect(ctx, xx + 1, y - 5, 4, 6, c.b); px(ctx, xx + 1, y - 5, c.l); } };
  const conical = (x, y, w) => { const h = 16; for (let k = 0; k < h; k++) { const half = Math.round(((k + 1) / h) * (w / 2 + 2)); rect(ctx, x + w / 2 - half - 1, y - h + k, half * 2 + 2, 1, INK); rect(ctx, x + w / 2 - half, y - h + k, half, 1, M.roof.l); rect(ctx, x + w / 2, y - h + k, half, 1, M.roof.d); } };
  const tw = r.pick([26, 28, 30]), tops = S.cap === 'cone' || M.feat === 2 ? 'cone' : 'crenel';
  const lt = tops === 'cone' ? 22 : 14 + r.int(0, 4), rt = tops === 'cone' ? 22 + (M.feat === 3 ? 6 : 0) : 14 + r.int(0, 4);
  stone(20, 38, W - 40, H - 38, st); crenels(22, 38, W - 42, st);
  if (M.feat === 0) { stone(W / 2 - 14, 26, 28, 20, st2); crenels(W / 2 - 13, 26, 28, st2); } // a gatehouse keep
  stone(0, lt, tw, H - lt, st2); stone(W - tw, rt, tw, H - rt, st2);
  if (tops === 'cone') { conical(0, lt, tw); conical(W - tw, rt, tw); } else { crenels(1, lt, tw, st2); crenels(W - tw + 1, rt, tw, st2); }
  // flags on the towers
  [[tw / 2, lt - (tops === 'cone' ? 16 : 6)], [W - tw / 2, rt - (tops === 'cone' ? 16 : 6)]].forEach(([x, y]) => { if (y < 10) return; rect(ctx, x, y - 10, 1, 10, INK); rect(ctx, x + 1, y - 10, 6, 4, M.roof.b); rect(ctx, x + 1, y - 7, 6, 1, M.roof.d); });
  const slit = (x, y) => { rect(ctx, x, y, 4, 11, INK); rect(ctx, x + 1, y + 1, 2, 9, '#2b2620'); rect(lit, x + 1, y + 1, 2, 9, '#ffcf7a'); };
  const arched = r.chance(0.5);
  [[tw / 2 - 2, lt + 14], [tw / 2 - 2, lt + 46], [W - tw / 2 - 2, rt + 14], [W - tw / 2 - 2, rt + 46]].forEach(([x, y]) => (arched ? win(F, x + 2, y + 11, 'arched', { size: [7, 10], frame: st.l, glow: false }) : slit(x, y)));
  slit(40, 52); slit(W - 44, 52);
  // gate with a portcullis, between the doors
  const gx = F.dl + 1, gw = F.dr - F.dl - 2, gy = H - 32;
  rect(ctx, gx - 2, gy - 4, gw + 4, 36, INK); rect(ctx, gx, gy + 4, gw, 28, '#2a1d14'); ellipse(ctx, gx + gw / 2, gy + 5, gw / 2, 7, '#2a1d14');
  rect(lit, gx + 2, gy + 6, gw - 4, 26, 'rgba(255,170,80,0.55)');
  for (let x = gx + 4; x < gx + gw; x += 6) rect(ctx, x, gy, 1, 22, '#15100b');
  for (let y = gy + 4; y < gy + 22; y += 6) rect(ctx, gx, y, gw, 1, '#15100b');
  sign(F, W / 2, gy - 17, { bg: '#3a2b1d', fg: P.gold, ebg: '#2a1d14', efg: P.gold });
  // banners in the district colour, with the emblem when there is one
  const bh = r.pick([20, 24]);
  [34, W - 42].forEach((x) => { rect(ctx, x, 58, 8, bh, INK); rect(ctx, x + 1, 59, 6, bh - 2, M.roof.b); rect(ctx, x + 1, 59, 1, bh - 2, M.roof.l); rect(ctx, x + 3, 64, 2, 8, M.accent); rect(ctx, x + 1, 56 + bh, 2, 2, st.b); rect(ctx, x + 5, 56 + bh, 2, 2, st.b); });
  [gx - 9, gx + gw + 8].forEach((x) => { rect(ctx, x - 1, gy + 8, 3, 7, '#2a2018'); rect(ctx, x - 2, gy + 6, 5, 2, '#5a4a36'); rect(ctx, x - 1, gy + 2, 3, 4, '#ffb347'); px(ctx, x, gy + 1, '#ffe58a'); rect(lit, x - 2, gy, 5, 6, '#ffe58a'); });
  F.glows.push([gx - 9, gy + 3, 'warm'], [gx + gw + 8, gy + 3, 'warm'], [tw / 2, lt + 20, 'warm'], [W - tw / 2, rt + 20, 'warm']);
  return done(F);
}

// The cave: a mouth in a rock mound. Rock, moss, frame of the mouth and lights vary.
function cave(F) {
  const { ctx, lit, W, H, M, r } = F;
  const dx = F.dc, rock = shades(mix(F.th.stone, '#857f77', 0.4)), moss = r.chance(0.6);
  const peak = r.int(0, 8), lean = (r() - 0.5) * 0.3;
  for (let y = 4 + peak; y < H; y++) {
    const t = (y - 4 - peak) / (H - 4 - peak), half = Math.round((W / 2 - 2) * Math.sqrt(1 - (1 - t) * (1 - t)) * 0.98) + 1, c = W / 2 + Math.round(lean * (1 - t) * 20);
    for (let x = c - half; x < c + half; x++) {
      const n = hash(x >> 2, y >> 2, 31 + F.M.slot), edge = x < c - half + 2 || x >= c + half - 2 || y < 6 + peak;
      const u = (x - (c - half)) / (2 * half);
      let col = edge ? INK : n > 0.72 ? rock.l : n > 0.35 ? rock.b : rock.d;
      if (!edge && u > 0.75) col = tone(col, -0.08);
      if (!edge && moss && y < 18 + peak + hash(x, 1, 3) * 6) col = hash(x, y, 2) > 0.4 ? P.grassDark : P.grassLight;
      px(ctx, x, y, col);
    }
  }
  for (let k = 0; k < 9; k++) { const x = 8 + hash(k, 1, 7 + M.slot) * (W - 16), y = 22 + hash(k, 2, 7) * (H - 44); rect(ctx, x, y, 5 + hash(k, 3, 7) * 6, 1, rock.dd); }
  // the mouth
  for (let y = H - 26; y < H; y++) { const half = y < H - 18 ? Math.round(Math.sqrt(64 - (H - 18 - y) * (H - 18 - y)) * 1.25) : 10; rect(ctx, dx - half - 1, y, half * 2 + 2, 1, INK); rect(ctx, dx - half + 1, y, half * 2 - 2, 1, '#14111a'); }
  rect(lit, dx - 6, H - 8, 12, 8, 'rgba(255,190,100,0.35)');
  if (M.feat === 0 || M.feat === 2) { // a timber frame, as at a mine
    const W2 = M.wood; rect(ctx, dx - 13, H - 24, 4, 24, INK); rect(ctx, dx + 9, H - 24, 4, 24, INK); rect(ctx, dx - 12, H - 23, 2, 23, W2.b); rect(ctx, dx + 10, H - 23, 2, 23, W2.b); rect(ctx, dx - 15, H - 27, 30, 4, INK); rect(ctx, dx - 14, H - 26, 28, 2, W2.l);
  }
  if (M.feat === 1 || M.feat === 3) for (let k = 0; k < 4; k++) { const x = 10 + hash(k, 5, M.slot + 2) * (W - 20), y = 30 + hash(k, 6, 3) * (H - 60); if (Math.abs(x - dx) < 30 && y > H - 54) continue; rect(ctx, x, y, 3, 5, INK); rect(ctx, x + 1, y + 1, 1, 3, '#7ff3e6'); px(ctx, x + 1, y, '#bffaf2'); rect(lit, x + 1, y + 1, 1, 3, '#bffaf2'); } // crystals
  const torch = r.chance(0.5);
  [dx - 18, dx + 16].forEach((x) => { if (torch) { rect(ctx, x, H - 20, 3, 10, INK); rect(ctx, x + 1, H - 19, 1, 9, M.wood.b); rect(ctx, x - 1, H - 25, 5, 5, '#ffb347'); px(ctx, x + 1, H - 26, '#ffe58a'); rect(lit, x - 1, H - 25, 5, 5, '#fff3c4'); } else { rect(ctx, x, H - 22, 3, 12, INK); rect(ctx, x - 1, H - 27, 5, 6, INK); rect(ctx, x, H - 26, 3, 4, '#ffcf5a'); rect(lit, x, H - 26, 3, 4, '#fff3c4'); } });
  sign(F, dx, H - 40, { bg: '#3a2b1d', fg: P.gold, ebg: '#2a1d14', efg: P.gold });
  F.glows.push([dx - 17, H - 24, 'warm'], [dx + 17, H - 24, 'warm']);
  return done(F);
}

// The league hall on the square: a civic hall with the star emblem. Its roof follows the theme.
function league(F) {
  const { ctx, lit, W, H, M, S, r } = F;
  const roofH = pitch(F, 40, 50), wallTop = roofH - 2;
  wall(F, 0, wallTop, W, H - wallTop, { C: shades(F.th.trim), tex: S.wall === 'ashlar' ? 'ashlar' : 'plaster', quoins: S.quoins });
  roof(F, S.roofs.includes('hip') ? 'hip' : 'slope', 0, 0, W, roofH, { R: M.roof });
  const cx = W / 2, cy = Math.round(roofH / 2 - 1);
  ellipse(ctx, cx, cy, 18, 14, INK); ellipse(ctx, cx, cy, 17, 13, '#f3f2ec'); ellipse(ctx, cx, cy, 15, 11, M.roof.dd);
  for (let k = 0; k < 5; k++) { const a1 = -Math.PI / 2 + (k * 2 * Math.PI) / 5; for (let q = 0; q < 8; q++) rect(ctx, Math.round(cx + Math.cos(a1) * q) - 1, Math.round(cy + Math.sin(a1) * q) - 1, 3, 3, P.gold); }
  rect(ctx, cx - 3, cy - 3, 7, 7, P.gold);
  for (let k = 0; k < 5; k++) { const a1 = -Math.PI / 2 + (k * 2 * Math.PI) / 5; for (let q = 0; q < 7; q++) { lit.fillStyle = '#ffe9a6'; lit.fillRect(Math.round(cx + Math.cos(a1) * q), Math.round(cy + Math.sin(a1) * q), 1, 1); } }
  rect(ctx, 0, wallTop, W, 10, M.roof.b); rect(ctx, 0, wallTop, W, 1, M.roof.l); rect(ctx, 0, wallTop + 9, W, 1, M.roof.dd); rect(ctx, 0, wallTop, 1, 10, INK); rect(ctx, W - 1, wallTop, 1, 10, INK);
  sign(F, W / 2, wallTop + 1, { bg: M.roof.b, fg: '#ffffff' });
  const wst = S.windows[0] === 'arched' ? 'arched' : S.windows[0] === 'tall' ? 'tall' : 'square';
  for (let t = 0; t < W / 16; t++) { if (t === 3 || t === 4) continue; win(F, t * 16 + 8, H - 13, wst, { frame: '#e8eef0' }); }
  const dx = F.dl;
  rect(ctx, dx - 4, H - 30, 40, 5, INK); rect(ctx, dx - 3, H - 29, 38, 3, M.roof.b); rect(ctx, dx - 3, H - 29, 38, 1, M.roof.l);
  door(F, F.dc, 'glass', { w: 28, h: 22 });
  glow(F, F.dc, H - 12);
  return done(F);
}

const KIND_PAINTERS = { lab, archive, hall, studio, observatory, workshop, museum, cave, league, cottage };

// The generated painter. b: a building of townMap (id, kind, paint, w, h, doors, label, emblem,
// di = district index, dj = place in the district). o.theme and o.seed override the course's own
// (the gallery uses them to show all themes).
export function paintFacade(b, o = {}) {
  const fn = KIND_PAINTERS[b.paint] || KIND_PAINTERS[b.kind];
  if (!fn) return null;
  const F = start(b, o), res = fn(F);
  return res && res.canvas ? res : done(F);
}
export const FACADE_KINDS = Object.keys(KIND_PAINTERS);
