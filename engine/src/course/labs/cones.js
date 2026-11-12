// Cone Cave (deep dive): why three numbers are enough. Two different lights, one colour.
import { h, slider, readout } from '../../lab/shell.js';
import { canvasPane, rgbCss } from '../../lab/kit.js';

// Simplified cone sensitivities: bell curves at roughly the right places. Good for the idea, not for measurement.
const bell = (peak, width) => (nm) => Math.exp(-((nm - peak) ** 2) / (2 * width * width));
const CONES = [['L', bell(565, 48), '#ff7a6b'], ['M', bell(540, 42), '#7ddc8a'], ['S', bell(445, 26), '#6f93e0']];
const RED = 630, GREEN = 535;
// One function turns cone signals into a screen colour, for both lights: equal signals give equal swatches by construction.
const seen = ([L, M]) => { const q = M / Math.max(L, 1e-6), k = Math.min(1, (L + M) / 1.5); return [255 * k * Math.max(0, Math.min(1, 1.9 - 1.3 * q)), 255 * k * Math.max(0, Math.min(1, 1.9 * q - 0.25)), 0]; };
const hue = (nm) => (nm < 490 ? [0, (nm - 440) * 5, 255] : nm < 510 ? [0, 255, (510 - nm) * 12] : nm < 580 ? [(nm - 510) * 3.6, 255, 0] : nm < 645 ? [255, (645 - nm) * 3.9, 0] : [255, 0, 0]).map((v) => Math.max(0, Math.min(255, v)));

async function match(ctx) {
  const W = 760, H = 480, pane = canvasPane(ctx.stage, W, H, '');
  const v = { nm: 580, r: 0.2, g: 0.2 }, matched = new Set();
  const out = readout();
  const X = (nm) => 40 + ((nm - 400) / 300) * 440, Y = (s) => 250 - s * 190;
  const draw = () => {
    const g = pane.g;
    g.fillStyle = '#0e1116'; g.fillRect(0, 0, W, H);
    for (let nm = 400; nm <= 700; nm += 2) { g.fillStyle = rgbCss(hue(nm)); g.fillRect(X(nm), 258, 3.2, 10); }
    CONES.forEach(([n, f, col]) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); for (let nm = 400; nm <= 700; nm += 2) g[nm === 400 ? 'moveTo' : 'lineTo'](X(nm), Y(f(nm))); g.stroke(); g.fillStyle = col; g.font = '600 14px system-ui'; g.fillText(n, X(n === 'S' ? 445 : n === 'M' ? 520 : 590) - 4, 48); });
    const line = (nm, a, col, label) => { g.strokeStyle = col; g.lineWidth = 3; g.setLineDash(label === 'A' ? [] : [5, 4]); g.beginPath(); g.moveTo(X(nm), 258); g.lineTo(X(nm), 258 - a * 95); g.stroke(); g.setLineDash([]); g.fillStyle = '#e6e8ee'; g.font = '13px system-ui'; g.fillText(label, X(nm) - 4, 286); };
    line(v.nm, 1, '#fff', 'A'); line(RED, v.r, '#ff7a6b', 'B'); line(GREEN, v.g, '#7ddc8a', 'B');
    g.fillStyle = '#8b93a7'; g.font = '13px system-ui'; g.fillText('400 nm', 40, 304); g.fillText('700 nm', 440, 304); g.fillText('How strongly each cone answers to each wavelength', 40, 24);
    // cone signals of the two lights
    const A = CONES.map(([, f]) => f(v.nm)), B = CONES.map(([, f]) => v.r * f(RED) + v.g * f(GREEN));
    g.fillStyle = '#aeb6c8'; g.font = '600 13px system-ui'; g.fillText('WHAT THE EYE KEEPS', 520, 24);
    CONES.forEach(([n, , col], i) => { const y = 50 + i * 62; g.fillStyle = '#e6e8ee'; g.font = '14px system-ui'; g.fillText(n, 520, y + 28); [[A[i], 'A'], [B[i], 'B']].forEach(([val, lab], k) => { g.fillStyle = '#1b212c'; g.fillRect(545, y + k * 22, 190, 16); g.fillStyle = col; g.globalAlpha = k ? 0.6 : 1; g.fillRect(545, y + k * 22, Math.min(190, val * 150), 16); g.globalAlpha = 1; g.fillStyle = '#fff'; g.font = '12px system-ui'; g.fillText(lab, 738, y + k * 22 + 12); }); });
    const ok = Math.abs(A[0] - B[0]) < 0.035 && Math.abs(A[1] - B[1]) < 0.035;
    g.fillStyle = rgbCss(seen(A)); g.fillRect(40, 330, 200, 120); g.fillStyle = rgbCss(seen(B)); g.fillRect(280, 330, 200, 120);
    g.fillStyle = '#e6e8ee'; g.font = '14px system-ui'; g.fillText(`Light A: one wavelength, ${v.nm} nm`, 40, 322); g.fillText('Light B: a red lamp + a green lamp', 280, 322);
    if (ok) { g.strokeStyle = '#7ddc8a'; g.lineWidth = 3; g.strokeRect(38.5, 328.5, 443, 123); }
    out.innerHTML = ok ? 'Same three signals: to the eye these two lights are <b>the same colour</b>.' : 'Change lamp B until its three bars equal those of light A.';
    if (ok) { matched.add(v.nm); ctx.did(0); if ([...matched].some((a) => Math.abs(a - [...matched][0]) >= 15)) ctx.did(1); }
  };
  ctx.controls.append(slider('Light A: wavelength', 550, 615, v.nm, (x) => { v.nm = x; draw(); }, { fmt: (x) => `${x} nm` }),
    slider('Lamp B: red', 0, 150, 20, (x) => { v.r = x / 100; draw(); }, { fmt: (x) => `${x}%` }), slider('Lamp B: green', 0, 150, 20, (x) => { v.g = x / 100; draw(); }, { fmt: (x) => `${x}%` }), out);
  draw();
}

export default {
  title: 'Two lights, one colour',
  wide: false,
  stations: [
    { tab: 'Match the light', goal: 'The eye turns any light into three signals. Lights with the same three signals look the same.',
      tries: ['Match light A using only the red and green lamps.', 'Move light A to another wavelength and match it again.'],
      takeaway: 'Pure yellow light and a red-plus-green mix are physically different and look <b>identical</b>: they are <b>metamers</b>. That is why three lamps are enough for a screen.',
      source: 'Cone curves are simplified bell shapes. Both swatches are computed from the three signals with the same rule, so they are approximate but comparable.', mount: match },
  ],
};
