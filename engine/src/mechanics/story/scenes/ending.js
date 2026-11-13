// The ending, illustrated (docs/STORY.md, beats 8 to 10): the lamp room and its keeper (hooded, never
// unmasked), the arrivals register with the same name signed down the page, the pages torn out and
// taken home by the wind over the roofs, the purser at the gangway.
//   lampRoomPainter()  P.lamp 0..1 (the lamp lighting)
//   registerPainter()  P.name, P.arrived
//   pagesPainter()     P.pages (how many), the wind takes them toward the lit windows
//   gangwayPainter()   P.name (the purser's register), P.lights
import { canvas, lin, rad, glow, blobs, rnd, smooth, soften, paper, handwrite, HAND, SERIF, rain, C } from '../paint.js';

// ---- the lamp room: the great lens, the glass all round, the keeper reaching for the lamp, the desk
export function lampRoomPainter() {
  return {
    baseKeys: [],
    focus: (W, H) => [W * 0.45, H * 0.45],
    base(g, W, H) {
      // the night through the glass: panes between iron mullions, rain on them
      g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#070a14'], [0.7, '#111a2e'], [1, '#0a0d16']]); g.fillRect(0, 0, W, H);
      g.drawImage(blobs(W, H * 0.7, 30, '#1e2840', { seed: 6, rx: [0.2, 0.5], ry: [0.05, 0.12], a: [0.3, 0.6] }), 0, 0);
      const r = rnd(5);
      for (let i = 0; i < 260; i++) { const x = r() * W, y = r() * H * 0.72, l = H * (0.01 + r() * 0.04); g.strokeStyle = `rgba(160,180,220,${0.05 + r() * 0.1})`; g.lineWidth = Math.max(1, W / 1600); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y + l); g.stroke(); }
      for (let k = 0; k <= 6; k++) { const x = (k / 6) * W; g.fillStyle = '#05060a'; g.fillRect(x - W * 0.008, 0, W * 0.016, H * 0.74); }
      g.fillStyle = '#05060a'; g.fillRect(0, H * 0.06, W, H * 0.014); g.fillRect(0, H * 0.4, W, H * 0.01);
      // the gallery's floor and the low wall
      g.fillStyle = lin(g, 0, H * 0.72, 0, H, [[0, '#1c1a20'], [1, '#0b0a0d']]); g.fillRect(0, H * 0.72, W, H * 0.28);
      g.fillStyle = '#0e0d11'; g.fillRect(0, H * 0.72, W, H * 0.02);
      // the desk on the right, and the register lying open on it
      const dx = W * 0.62, dy = H * 0.76, dw = W * 0.34;
      g.fillStyle = '#2a1c14'; g.fillRect(dx, dy, dw, H * 0.03); g.fillStyle = '#160e0a'; g.fillRect(dx + dw * 0.05, dy + H * 0.03, dw * 0.04, H * 0.2); g.fillRect(dx + dw * 0.9, dy + H * 0.03, dw * 0.04, H * 0.2);
      g.save(); g.translate(dx + dw * 0.5, dy - H * 0.005); g.transform(1, 0, -0.5, 0.35, 0, 0);
      paper(g, -dw * 0.36, -H * 0.2, dw * 0.35, H * 0.2, { color: '#d9ccaa', seed: 3, ruled: true }); paper(g, dw * 0.01, -H * 0.2, dw * 0.35, H * 0.2, { color: '#ddd0ae', seed: 4, ruled: true });
      g.restore();
    },
    live(g, W, H, t, P) {
      const L = P.lamp || 0, cx = W * 0.36, cy = H * 0.42, lw = Math.min(W * 0.22, H * 0.3), lh = lw * 1.7;
      // the light first: it fills the room as the lamp catches
      if (L > 0.01) {
        glow(g, cx, cy, Math.max(W, H) * 0.7, '#ffb35c', 0.35 * L);
        // the beam, turning, through the glass
        const a = t * 0.6;
        g.save(); g.globalCompositeOperation = 'lighter'; g.translate(cx, cy);
        for (const side of [0, Math.PI]) { const ang = a + side, len = Math.max(W, H) * 1.2, k = Math.abs(Math.cos(ang)); g.rotate(0); g.fillStyle = rad(g, 0, 0, 0, len, [[0, `rgba(255,236,180,${0.35 * L * k})`], [1, 'rgba(255,236,180,0)']]); g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(ang) * len, -lh * 0.22 * k); g.lineTo(Math.cos(ang) * len, lh * 0.22 * k); g.fill(); }
        g.restore();
      }
      // the lens: a beehive of glass rings, dark until it is lit
      g.save();
      g.beginPath(); smooth(g, [[cx - lw * 0.35, cy - lh / 2], [cx - lw * 0.5, cy - lh * 0.2], [cx - lw * 0.52, cy + lh * 0.15], [cx - lw * 0.4, cy + lh / 2], [cx + lw * 0.4, cy + lh / 2], [cx + lw * 0.52, cy + lh * 0.15], [cx + lw * 0.5, cy - lh * 0.2], [cx + lw * 0.35, cy - lh / 2]], true);
      g.fillStyle = lin(g, cx - lw / 2, 0, cx + lw / 2, 0, [[0, '#1a2234'], [0.45, `rgba(${Math.round(60 + 195 * L)},${Math.round(70 + 160 * L)},${Math.round(90 + 60 * L)},1)`], [1, '#0e121c']]); g.fill();
      g.clip();
      for (let k = 0; k < 18; k++) { const y = cy - lh / 2 + (k / 18) * lh; g.fillStyle = `rgba(255,${200 + 40 * L},${150 + 60 * L},${0.06 + 0.25 * L})`; g.fillRect(cx - lw, y, lw * 2, lh * 0.012); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(cx - lw, y + lh * 0.03, lw * 2, lh * 0.008); }
      if (L > 0.01) glow(g, cx, cy, lw * 0.5, '#fff6d8', L);
      g.restore();
      g.fillStyle = '#0a0a0e'; g.fillRect(cx - lw * 0.45, cy + lh / 2, lw * 0.9, H * 0.04); g.fillRect(cx - lw * 0.3, cy - lh / 2 - H * 0.02, lw * 0.6, H * 0.025);
      // the keeper, hooded, seen from behind and to the side, one arm toward the lamp; a rim of its light
      const kx = W * 0.6, ky = H * 0.78, kh = H * 0.62;
      g.save();
      g.beginPath();
      smooth(g, [[kx - kh * 0.18, ky + H * 0.05], [kx - kh * 0.2, ky - kh * 0.45], [kx - kh * 0.13, ky - kh * 0.78], [kx - kh * 0.02, ky - kh * 0.98], [kx + kh * 0.1, ky - kh * 0.86], [kx + kh * 0.14, ky - kh * 0.62], [kx + kh * 0.22, ky - kh * 0.4], [kx + kh * 0.24, ky + H * 0.05]]);
      g.closePath(); g.fillStyle = lin(g, kx - kh * 0.2, 0, kx + kh * 0.25, 0, [[0, '#1d1a24'], [1, '#0a090d']]); g.fill();
      // the arm, reaching toward the lens
      g.beginPath(); smooth(g, [[kx - kh * 0.12, ky - kh * 0.6], [kx - kh * 0.3, ky - kh * 0.52], [kx - kh * 0.46, ky - kh * 0.48], [kx - kh * 0.5, ky - kh * 0.44], [kx - kh * 0.42, ky - kh * 0.4], [kx - kh * 0.22, ky - kh * 0.44], [kx - kh * 0.12, ky - kh * 0.46]]); g.closePath(); g.fillStyle = '#16141c'; g.fill();
      // the rim light: the lamp catches the edge of the hood and the sleeve
      g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,200,120,${0.15 + 0.6 * L})`; g.lineWidth = Math.max(1.5, H / 300);
      g.beginPath(); smooth(g, [[kx - kh * 0.2, ky - kh * 0.45], [kx - kh * 0.13, ky - kh * 0.78], [kx - kh * 0.02, ky - kh * 0.98]]); g.stroke();
      g.beginPath(); smooth(g, [[kx - kh * 0.3, ky - kh * 0.52], [kx - kh * 0.46, ky - kh * 0.48], [kx - kh * 0.5, ky - kh * 0.44]]); g.stroke();
      g.restore();
      // the register on the desk catches the light too
      if (L > 0.01) glow(g, W * 0.79, H * 0.72, W * 0.12, '#ffd9a0', 0.25 * L);
    },
  };
}

// ---- the arrivals register: the same name signed down the page, dates going back; the last line empty
export function registerPainter() {
  return {
    baseKeys: ['name'],
    base(g, W, H, P) {
      g.fillStyle = '#120c09'; g.fillRect(0, 0, W, H);
      const pw = Math.min(W * 0.9, H * 0.95 * 0.78), ph = pw / 0.78, x = (W - pw) / 2, y = (H - ph) / 2 + H * 0.02;
      g.save(); g.translate(W / 2, H / 2); g.rotate(-0.015); g.translate(-W / 2, -H / 2);
      g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = pw * 0.05; g.fillStyle = '#000'; g.fillRect(x, y, pw, ph); g.shadowBlur = 0;
      paper(g, x, y, pw, ph, { color: '#e3d6b4', seed: 21, edge: 0.4 });
      const u = ph / 100, cols = [x + pw * 0.06, x + pw * 0.3, x + pw * 0.66];
      g.fillStyle = '#5a4a30'; g.font = `${2.4 * u}px ${SERIF}`; g.textBaseline = 'alphabetic';
      g.fillText('ARRIVALS', x + pw * 0.06, y + 6 * u);
      g.font = `${1.7 * u}px ${SERIF}`; ['DATE', 'NAME', 'SIGNATURE'].forEach((s, i) => g.fillText(s, cols[i], y + 11 * u));
      g.strokeStyle = 'rgba(90,70,40,0.5)'; g.lineWidth = Math.max(1, u * 0.12);
      for (const cx of cols.slice(1)) { g.beginPath(); g.moveTo(cx - pw * 0.02, y + 8.5 * u); g.lineTo(cx - pw * 0.02, y + ph - 4 * u); g.stroke(); }
      const rows = 11, top = y + 13 * u, rh = (ph - 17 * u) / rows, name = String(P.name || '');
      const d0 = new Date(P.arrived || Date.now()), r = rnd(13);
      for (let i = 0; i < rows; i++) {
        const yy = top + (i + 1) * rh;
        g.beginPath(); g.moveTo(x + pw * 0.04, yy + u * 0.6); g.lineTo(x + pw * 0.96, yy + u * 0.6); g.stroke();
        if (i === rows - 1) continue; // the last line: empty
        const back = rows - 2 - i, dt = new Date(d0.getTime() - back * (360 + Math.floor(r() * 60)) * 86400000);
        const ink = `rgba(${Math.round(70 - back * 3)},${Math.round(55 - back * 2)},${Math.round(80 + (8 - back) * 4)},${0.95 - back * 0.04})`; // older lines browner and paler
        handwrite(g, `${dt.getDate()}.${dt.getMonth() + 1}.${dt.getFullYear()}`, cols[0], yy - rh * 0.22, pw * 0.22, rh * 0.42, { color: ink, seed: 30 + i });
        handwrite(g, name, cols[1], yy - rh * 0.22, pw * 0.34, rh * 0.48, { color: ink, seed: 50 + i });
        // the signature: the same hand, a little different every time
        g.save(); g.strokeStyle = ink; g.lineWidth = Math.max(1, u * 0.22); g.lineCap = 'round'; g.beginPath();
        const sx = cols[2] + pw * 0.02, sy = yy - rh * 0.3, sw = pw * 0.24;
        g.moveTo(sx, sy + rh * 0.1);
        for (let k = 0; k < 9; k++) { const kx = sx + (k / 8) * sw; g.quadraticCurveTo(kx - sw * 0.05, sy - rh * (0.15 + r() * 0.25) * (k % 2 ? 1 : -0.4), kx, sy + rh * (r() - 0.5) * 0.12); }
        g.moveTo(sx - sw * 0.05, sy + rh * 0.22); g.quadraticCurveTo(sx + sw * 0.5, sy + rh * (0.32 + r() * 0.1), sx + sw * 1.05, sy + rh * 0.12); g.stroke(); g.restore();
      }
      g.restore();
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(g, W * 0.3, 0, 0, Math.hypot(W, H), [[0, 'rgba(255,200,120,0.25)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, W, H); g.restore();
    },
  };
}

// ---- the pages: torn out one by one, taken by the wind over the roofs, each toward a lit window
export function pagesPainter() {
  let roofs = null, key = '';
  const windowsOf = (W, H) => { const r = rnd(41), out = []; for (let i = 0; i < 14; i++) out.push([W * (0.06 + r() * 0.88), H * (0.33 + r() * 0.16)]); return out; };
  return {
    baseKeys: [],
    focus: (W, H) => [W / 2, H * 0.45],
    base(g, W, H) {
      // a clear night: the rain has stopped; stars; the beam far off
      g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#060a16'], [0.55, '#14203a'], [1, '#0a0e18']]); g.fillRect(0, 0, W, H);
      const r = rnd(8); for (let i = 0; i < 220; i++) { g.fillStyle = `rgba(230,236,255,${0.2 + r() * 0.6})`; g.fillRect(r() * W, r() * H * 0.45, 1 + (r() < 0.1), 1 + (r() < 0.1)); }
      g.drawImage(blobs(W, H * 0.5, 20, '#26324e', { seed: 2, y: [0.3, 0.9], rx: [0.2, 0.5], ry: [0.03, 0.06], a: [0.2, 0.4] }), 0, 0);
    },
    live(g, W, H, t, P) {
      if (key !== `${W}x${H}`) {
        key = `${W}x${H}`;
        const [c, cg] = canvas(W, H), r = rnd(19);
        // the roofs of the town, one after another, and their windows lit
        for (let layer = 0; layer < 2; layer++) {
          let x = -W * 0.05; const base = H * (0.5 + layer * 0.08), col = layer ? '#07080d' : '#0d0f18';
          while (x < W * 1.05) {
            const w = W * (0.06 + r() * 0.08), hh = H * (0.06 + r() * 0.09), peak = H * (0.03 + r() * 0.05);
            cg.fillStyle = col; cg.beginPath(); cg.moveTo(x, H); cg.lineTo(x, base - hh); cg.lineTo(x + w / 2, base - hh - peak); cg.lineTo(x + w, base - hh); cg.lineTo(x + w, H); cg.fill();
            if (r() < 0.4) cg.fillRect(x + w * 0.7, base - hh - peak * 0.9, w * 0.08, peak * 0.6);
            for (let k = 0; k < 2; k++) { if (r() < 0.25) continue; const wx = x + w * (0.2 + k * 0.4), wy = base - hh * 0.6; cg.fillStyle = '#ffcf7a'; cg.fillRect(wx, wy, w * 0.14, hh * 0.22); cg.save(); cg.globalCompositeOperation = 'lighter'; cg.fillStyle = rad(cg, wx + w * 0.07, wy, 0, w * 0.4, [[0, 'rgba(255,190,100,0.3)'], [1, 'rgba(0,0,0,0)']]); cg.fillRect(wx - w * 0.4, wy - w * 0.4, w * 0.9, w * 0.9); cg.restore(); cg.fillStyle = col; }
            x += w * (0.9 + r() * 0.3);
          }
        }
        // the lighthouse, lit, over the roofs
        const tx = W * 0.8, ty = H * 0.47; cg.fillStyle = '#0b0d14'; cg.beginPath(); cg.moveTo(tx - W * 0.018, ty); cg.lineTo(tx - W * 0.011, ty - H * 0.28); cg.lineTo(tx + W * 0.011, ty - H * 0.28); cg.lineTo(tx + W * 0.018, ty); cg.fill();
        cg.fillRect(tx - W * 0.016, ty - H * 0.3, W * 0.032, H * 0.012);
        roofs = { c, lamp: [tx, ty - H * 0.315] };
      }
      // the beam, turning
      const [lx, ly] = roofs.lamp, a = t * 0.7;
      g.save(); g.globalCompositeOperation = 'lighter'; const len = W * 1.1, k = Math.abs(Math.cos(a));
      g.fillStyle = rad(g, lx, ly, 0, len, [[0, `rgba(255,236,180,${0.3 * k})`], [1, 'rgba(255,236,180,0)']]); g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + Math.cos(a) * len, ly - H * 0.06 * k); g.lineTo(lx + Math.cos(a) * len, ly + H * 0.04 * k); g.fill(); g.restore();
      glow(g, lx, ly, H * 0.05, '#fff6d8', 0.9);
      g.drawImage(roofs.c, 0, 0);
      // the pages: from the bottom of the frame (the notebook, in your hands) up over the roofs, turning,
      // each toward a window; the n-th leaves at n * gap seconds
      const wins = windowsOf(W, H), n = P.pages || 6, gap = 1.1, fly = 4.2, pw = Math.min(W, H) * 0.06;
      for (let i = 0; i < n; i++) {
        const s = (t - 0.6 - i * gap) / fly; if (s <= 0 || s >= 1.05) continue;
        const [wx, wy] = wins[i % wins.length], x0 = W * (0.46 + (i % 3) * 0.04), y0 = H * 1.02, cx = lerp2(x0, wx, s) + Math.sin(s * 9 + i) * W * 0.04 * (1 - s), cy = lerp2(y0, wy, s) - Math.sin(s * Math.PI) * H * 0.35;
        const sc = (1 - s * 0.75) * pw, rot = Math.sin(s * 12 + i) * 1.2, flip = Math.cos(s * 14 + i);
        g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(flip, 1); g.globalAlpha = s > 0.9 ? (1.05 - s) / 0.15 : 1;
        g.fillStyle = lin(g, -sc / 2, 0, sc / 2, 0, [[0, '#e6dcc0'], [1, '#bfb08c']]); g.fillRect(-sc / 2, -sc * 0.65, sc, sc * 1.3);
        g.fillStyle = 'rgba(40,50,90,0.5)'; for (let k = 0; k < 5; k++) g.fillRect(-sc * 0.35, -sc * 0.45 + k * sc * 0.2, sc * 0.6, Math.max(1, sc * 0.03));
        g.restore();
        if (s > 0.85) glow(g, wx, wy, pw * 1.6, '#ffd77a', (s - 0.85) * 4);
      }
    },
  };
}
const lerp2 = (a, b, t) => a + (b - a) * Math.min(1, t);

// ---- the gangway: the hull's side, a lamp over the door, the purser with the register open
export function gangwayPainter() {
  return {
    baseKeys: [],
    focus: (W, H) => [W * 0.6, H * 0.45],
    base(g, W, H) {
      g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#070b16'], [1, '#0c1320']]); g.fillRect(0, 0, W, H);
      const r = rnd(4); for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(230,236,255,${0.2 + r() * 0.5})`; g.fillRect(r() * W, r() * H * 0.25, 1, 1); }
      // the hull, black plates and rivets, filling the right of the frame
      const hx = W * 0.32, top = H * 0.22;
      g.fillStyle = lin(g, hx, 0, W, 0, [[0, '#1c1b24'], [1, '#0b0a10']]); g.fillRect(hx, top, W - hx, H - top);
      g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = Math.max(1, W / 1200);
      for (let y = top + H * 0.08; y < H; y += H * 0.1) { g.beginPath(); g.moveTo(hx, y); g.lineTo(W, y); g.stroke(); }
      for (let x = hx + W * 0.06; x < W; x += W * 0.09) { g.beginPath(); g.moveTo(x, top); g.lineTo(x, H); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.06)'; for (let x = hx; x < W; x += W * 0.012) for (let y = top + H * 0.08; y < H; y += H * 0.1) g.fillRect(x, y - 2, 2, 2);
      g.fillStyle = '#3a3846'; g.fillRect(hx, top, W - hx, H * 0.012); // the rail
      // portholes, lit
      for (let x = hx + W * 0.08; x < W; x += W * 0.1) { const y = top + H * 0.16; g.fillStyle = '#5a4a2c'; g.beginPath(); g.arc(x, y, H * 0.022, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffd9a0'; g.beginPath(); g.arc(x, y, H * 0.015, 0, Math.PI * 2); g.fill(); glow(g, x, y, H * 0.06, '#ffb35c', 0.4); }
      // the door in the hull, open, warm light inside
      const dx = W * 0.56, dy = top + H * 0.3, dw = W * 0.09, dh = H * 0.2;
      g.fillStyle = '#ffcf8a'; g.fillRect(dx, dy, dw, dh); g.fillStyle = 'rgba(120,70,30,0.6)'; g.fillRect(dx, dy + dh * 0.6, dw, dh * 0.4);
      glow(g, dx + dw / 2, dy + dh / 2, dh * 1.4, '#ffb35c', 0.45);
      // the lamp over the door
      g.fillStyle = '#0a0a0e'; g.fillRect(dx + dw / 2 - W * 0.004, dy - H * 0.07, W * 0.008, H * 0.03); g.fillStyle = '#ffe8b0'; g.fillRect(dx + dw / 2 - W * 0.008, dy - H * 0.05, W * 0.016, H * 0.025);
      glow(g, dx + dw / 2, dy - H * 0.04, H * 0.25, '#ffd77a', 0.5);
      // the gangway: a sloping plank with its rails, from the quay up to the door
      g.strokeStyle = '#2a2018'; g.lineWidth = H * 0.02; g.lineCap = 'butt';
      g.beginPath(); g.moveTo(W * 0.05, H * 0.92); g.lineTo(dx + dw * 0.1, dy + dh); g.stroke();
      g.strokeStyle = '#4a3a2a'; g.lineWidth = Math.max(1, H / 300);
      g.beginPath(); g.moveTo(W * 0.05, H * 0.86); g.lineTo(dx + dw * 0.1, dy + dh - H * 0.06); g.stroke();
      for (let k = 0; k <= 8; k++) { const t2 = k / 8, x = W * 0.05 + (dx + dw * 0.1 - W * 0.05) * t2, y = H * 0.92 + (dy + dh - H * 0.92) * t2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - H * 0.06); g.stroke(); }
      // the quay below, wet
      g.fillStyle = lin(g, 0, H * 0.9, 0, H, [[0, '#1e1712'], [1, '#0c0907']]); g.fillRect(0, H * 0.9, hx + W * 0.05, H * 0.1);
    },
    live(g, W, H, t, P) {
      // the purser at the top of the gangway, in the doorway: a dark uniform, a peaked cap, the register
      // open in his hands; his face stays under the cap's shadow
      const top = H * 0.22, dx = W * 0.56, dy = top + H * 0.3, dw = W * 0.09, dh = H * 0.2, px = dx + dw * 0.5, py = dy + dh;
      const ph = dh * 0.95, sway = Math.sin(t * 0.8) * ph * 0.004;
      g.save(); g.translate(px, py + sway);
      g.fillStyle = '#0d0e14';
      g.beginPath(); smooth(g, [[-ph * 0.14, 0], [-ph * 0.16, -ph * 0.55], [-ph * 0.12, -ph * 0.72], [ph * 0.12, -ph * 0.72], [ph * 0.16, -ph * 0.55], [ph * 0.14, 0]]); g.closePath(); g.fill();
      g.beginPath(); g.ellipse(0, -ph * 0.8, ph * 0.07, ph * 0.085, 0, 0, Math.PI * 2); g.fill(); // the head, in shadow
      g.fillRect(-ph * 0.1, -ph * 0.9, ph * 0.2, ph * 0.035); g.beginPath(); g.ellipse(0, -ph * 0.91, ph * 0.08, ph * 0.035, 0, Math.PI, 0); g.fill(); // the cap
      g.fillStyle = 'rgba(255,200,120,0.5)'; g.fillRect(-ph * 0.1, -ph * 0.875, ph * 0.2, ph * 0.006); // the cap's band catching the lamp
      // the register, open, pale in the light
      g.save(); g.translate(-ph * 0.02, -ph * 0.48); g.rotate(-0.15); g.fillStyle = '#d9ccaa'; g.fillRect(-ph * 0.16, -ph * 0.05, ph * 0.32, ph * 0.1); g.fillStyle = 'rgba(60,50,40,0.6)'; g.fillRect(-ph * 0.005, -ph * 0.05, ph * 0.01, ph * 0.1); g.restore();
      // the gold of the buttons
      g.fillStyle = '#c99a3a'; for (let k = 0; k < 3; k++) g.fillRect(-ph * 0.01, -ph * (0.6 - k * 0.1), ph * 0.02, ph * 0.02);
      g.restore();
      if (P.rain) rain(g, W, H, t, P.rain, 5);
    },
  };
}
