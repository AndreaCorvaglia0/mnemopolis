// The harbour at night, illustrated: the arrival (the ship comes in to the quay in heavy rain and its
// lights go out) and the leaving (the ship lit at the quay, the rain stopped, the horn). One painter,
// parameters: dock (0..1, the ship coming in), lights (0..1), rain (0..1), stars (0..1), beam (0..1:
// the far lighthouse lit), notebook (0..1: the notebook left on the boards, in the foreground).
import { canvas, lin, rad, glow, blobs, rain, rnd, smooth, soften, C } from '../paint.js';
import { paintShip, Smoke } from './ship.js';

export function harbourPainter() {
  let ship = null, shipLen = 0, soft = null, softLit = null, fog = null, fogKey = '';
  const smoke = new Smoke(5);
  const geo = (W, H) => {
    const tall = H > W;
    const hz = H * (tall ? 0.5 : 0.55), wl = H * (tall ? 0.63 : 0.72);
    const len = Math.round(tall ? W * 0.94 : Math.min(W * 0.66, H * 1.25));
    const quayX = tall ? W * 0.18 : W * 0.3;
    return { tall, hz, wl, len, quayX };
  };
  const shipX = (W, G, dock) => { const e = 1 - (1 - dock) ** 3, end = G.tall ? W * 0.04 : G.quayX - G.len * 0.08; return W + 20 - e * (W + 20 - end); };
  return {
    baseKeys: ['beam', 'stars'],
    focus: (W, H) => { const G = geo(W, H); return [W * 0.55, G.wl - G.len * 0.2]; },
    base(g, W, H, P) {
      const G = geo(W, H);
      // the sky: low, heavy, a little lighter at the horizon
      g.fillStyle = lin(g, 0, 0, 0, G.hz, [[0, '#05070e'], [0.6, '#0e1426'], [1, '#1f2a42']]); g.fillRect(0, 0, W, G.hz + 2);
      if (P.stars) { const r = rnd(11); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(230,236,255,${(0.2 + r() * 0.6) * P.stars})`; const s = r() < 0.9 ? 1 : 2; g.fillRect(r() * W, r() * G.hz * 0.85, s * (W / 1400 + 0.5), s * (W / 1400 + 0.5)); } }
      g.drawImage(blobs(W, G.hz, 60, '#2a3450', { seed: 3, y: [0.05, 0.7], rx: [0.15, 0.4], ry: [0.04, 0.1], a: [0.25, 0.6], k: 10 }), 0, 0);
      g.drawImage(blobs(W, G.hz, 40, '#0a0e1a', { seed: 8, y: [0, 0.5], rx: [0.2, 0.45], ry: [0.05, 0.12], a: [0.4, 0.8], k: 10 }), 0, 0);
      g.drawImage(blobs(W, G.hz, 30, '#3a4460', { seed: 21, y: [0.55, 0.95], rx: [0.2, 0.5], ry: [0.02, 0.05], a: [0.15, 0.35], k: 10 }), 0, 0);
      // the far headland and, on it, the lighthouse, dark (or lit, at the end)
      const hx = G.tall ? W * 0.62 : W * 0.9, hw = G.tall ? W * 0.45 : W * 0.22;
      g.fillStyle = '#0a0d17'; g.beginPath(); g.moveTo(hx - hw, G.hz + 1);
      smooth(g, [[hx - hw, G.hz + 1], [hx - hw * 0.5, G.hz - H * 0.025], [hx, G.hz - H * 0.04], [hx + hw * 0.4, G.hz - H * 0.02], [hx + hw, G.hz + 1]]);
      g.closePath(); g.fill();
      const tx = hx, ty = G.hz - H * 0.04, th = H * 0.075, tw = th * 0.13;
      g.fillStyle = '#121626'; g.beginPath(); g.moveTo(tx - tw, ty); g.lineTo(tx - tw * 0.7, ty - th); g.lineTo(tx + tw * 0.7, ty - th); g.lineTo(tx + tw, ty); g.fill();
      g.fillRect(tx - tw * 0.9, ty - th - tw * 0.3, tw * 1.8, tw * 0.3); g.fillRect(tx - tw * 0.5, ty - th - tw * 1.4, tw, tw * 1.1);
      g.beginPath(); g.arc(tx, ty - th - tw * 1.4, tw * 0.55, Math.PI, 0); g.fill();
      if (P.beam) glow(g, tx, ty - th - tw * 0.9, th * 0.6, C.lampHot, P.beam);
      // the sea: dark, its swell catching what little light there is
      g.fillStyle = lin(g, 0, G.hz, 0, H, [[0, '#18233a'], [0.15, '#0f1829'], [1, '#05080f']]); g.fillRect(0, G.hz, W, H - G.hz);
      const r = rnd(4);
      for (let i = 0; i < 900; i++) { const d = r() ** 1.6, y = G.hz + d * (H - G.hz), w = (6 + d * 60) * (W / 1400 + 0.4); g.fillStyle = `rgba(110,140,190,${0.05 + (1 - d) * 0.1})`; g.fillRect(r() * W, y, w, Math.max(1, d * 2.5)); }
      // mist lying on the water
      g.drawImage(blobs(W, H, 30, '#3c4864', { seed: 13, y: [G.hz / H - 0.01, G.hz / H + 0.05], rx: [0.2, 0.5], ry: [0.01, 0.03], a: [0.2, 0.4], k: 8 }), 0, 0);
    },
    live(g, W, H, t, P) {
      const G = geo(W, H);
      if (!ship || shipLen !== G.len) { ship = paintShip(G.len); shipLen = G.len; soft = soften(ship.canvas, 5); softLit = soften(ship.lit, 3); }
      if (fogKey !== `${W}x${H}`) { fogKey = `${W}x${H}`; fog = blobs(W, H, 22, '#46526e', { seed: 31, y: [G.wl / H + 0.008, G.wl / H + 0.04], rx: [0.15, 0.35], ry: [0.008, 0.02], a: [0.12, 0.28], k: 8 }); }
      const sx = shipX(W, G, P.dock ?? 1), bob = Math.sin(t * 0.9) * H * 0.002 * (1 - (P.dock ?? 1) * 0.6);
      const x = sx - ship.x0, y = G.wl - ship.water + bob;
      // reflections about the waterline, broken into strips by the swell: the hull dark and soft, the
      // lights long and trembling
      const strips = 26, depth = H - G.wl, sh = depth / strips;
      for (let i = 0; i < strips; i++) {
        const wy = G.wl + i * sh, wob = Math.sin(t * 1.4 + i * 0.9) * W * 0.004 * (1 + i * 0.08);
        // the strip of water at wy shows the ship at height wl - (wy - wl) / k
        for (const [img, k, a, add] of [[soft, 0.5, 0.22, false], [softLit, 0.75, 0.42 * (P.lights ?? 1), true]]) {
          if (a <= 0.01) continue;
          const src0 = (G.wl - (wy - G.wl) / k) - y, srcH = sh / k;
          if (src0 - srcH < 0 || src0 > img.height) continue;
          g.save(); g.globalAlpha = a * (1 - i / strips); if (add) g.globalCompositeOperation = 'lighter';
          g.translate(0, wy + sh); g.scale(1, -1);
          g.drawImage(img, 0, Math.max(0, src0 - srcH), img.width, srcH, x + wob, 0, img.width, sh);
          g.restore();
        }
      }
      g.drawImage(ship.canvas, x, y);
      if ((P.lights ?? 1) > 0.01) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = P.lights ?? 1; g.drawImage(ship.lit, x, y); g.restore(); }
      // the water's skin over the bottom of the hull
      g.fillStyle = lin(g, 0, G.wl - 2, 0, G.wl + H * 0.03, [[0, 'rgba(15,24,41,0)'], [0.3, 'rgba(15,24,41,0.9)'], [1, 'rgba(10,15,26,0.6)']]); g.fillRect(x, G.wl - 1, ship.canvas.width, H * 0.03);
      // a haze lying on the water, in front of the hull
      g.drawImage(fog, Math.sin(t * 0.05) * W * 0.02, 0);
      // smoke from the funnels, torn by the wind
      smoke.step(t, ship.funnels.map(([fx, fy]) => [x + fx, y + fy]), 1, (P.smoke ?? 1) * (0.4 + (P.lights ?? 1) * 0.6), ship.scale * 1.6);
      smoke.draw(g, '96,100,118');
      // the quay in the foreground: planks on their piles, a bollard, the lamp
      const qx = G.quayX, qy = G.wl - H * 0.012;
      g.fillStyle = '#05060a';
      for (let px = W * 0.01; px < qx; px += W * 0.035) g.fillRect(px, qy, W * 0.008, H - qy);
      g.fillStyle = lin(g, 0, qy - H * 0.02, 0, qy + H * 0.015, [[0, '#2c2119'], [1, '#120c09']]);
      g.beginPath(); g.moveTo(-5, qy - H * 0.024); g.lineTo(qx, qy - H * 0.018); g.lineTo(qx, qy + H * 0.012); g.lineTo(-5, qy + H * 0.02); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = Math.max(1, W / 1400);
      for (let px = 0; px < qx; px += W * 0.022) { g.beginPath(); g.moveTo(px, qy - H * 0.023); g.lineTo(px, qy + H * 0.016); g.stroke(); }
      // the wet boards hold the lamp's light
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(g, qx * 0.55, qy - H * 0.01, 0, qx * 0.6, [[0, 'rgba(255,190,110,0.22)'], [1, 'rgba(255,190,110,0)']]); g.fillRect(0, qy - H * 0.026, qx, H * 0.04); g.restore();
      g.fillStyle = '#0b0b10'; g.beginPath(); g.ellipse(qx - W * 0.02, qy - H * 0.026, W * 0.008, H * 0.006, 0, 0, Math.PI * 2); g.fill(); g.fillRect(qx - W * 0.027, qy - H * 0.045, W * 0.014, H * 0.02);
      const lx = qx * 0.55, ly = qy - H * 0.2, flick = 0.85 + Math.sin(t * 13) * 0.05 + (Math.sin(t * 2.3) > 0.97 ? -0.3 : 0);
      g.fillStyle = '#07070b'; g.fillRect(lx - W * 0.003, ly, W * 0.006, qy - ly - H * 0.02); g.fillRect(lx - W * 0.009, ly - H * 0.028, W * 0.018, H * 0.03);
      g.fillStyle = `rgba(255,215,130,${0.9 * flick})`; g.fillRect(lx - W * 0.006, ly - H * 0.024, W * 0.012, H * 0.02);
      glow(g, lx, ly - H * 0.014, H * 0.22, '#ffb35c', 0.35 * flick);
      glow(g, lx, ly - H * 0.014, H * 0.05, '#fff1c4', 0.6 * flick);
      // the notebook, left on the boards
      if (P.notebook) {
        const nx = qx * 0.7, ny = qy - H * 0.02, nw = W * 0.05;
        g.save(); g.globalAlpha = P.notebook; g.translate(nx, ny); g.rotate(-0.12);
        g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(-nw * 0.48, -nw * 0.08, nw, nw * 0.22);
        g.fillStyle = '#4a2e20'; g.fillRect(-nw / 2, -nw * 0.18, nw, nw * 0.24); g.fillStyle = '#e8dcc0'; g.fillRect(-nw / 2 + 2, nw * 0.02, nw - 4, nw * 0.04);
        g.fillStyle = '#8c3129'; g.fillRect(-nw * 0.1, -nw * 0.18, nw * 0.04, nw * 0.3); g.restore();
        glow(g, nx, ny, W * 0.05, '#ffd77a', 0.2 * P.notebook);
      }
    },
    over(g, W, H, t, P) { rain(g, W, H, t, P.rain ?? 1, 3); },
  };
}
