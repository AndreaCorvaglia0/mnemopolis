// Cone Cave (deep dive): why three numbers are enough. Two different lights, one colour.
import { h, slider, readout } from '../../../engine/src/lab/shell.js';
import { canvasPane, rgbCss } from '../../../engine/src/lab/kit.js';

// Simplified cone sensitivities: bell curves at roughly the right places. Good for the idea, not for measurement.
const bell = (peak, width) => (nm) => Math.exp(-((nm - peak) ** 2) / (2 * width * width));
const CONES = [['L', bell(565, 48), '#ff7a6b'], ['M', bell(540, 42), '#7ddc8a'], ['S', bell(445, 26), '#6f93e0']];
const RED = 630, GREEN = 535;
// One function turns cone signals into a screen colour, for both lights: equal signals give equal swatches by construction.
const seen = ([L, M]) => { const q = M / Math.max(L, 1e-6), k = Math.min(1, (L + M) / 1.5); return [255 * k * Math.max(0, Math.min(1, 1.9 - 1.3 * q)), 255 * k * Math.max(0, Math.min(1, 1.9 * q - 0.25)), 0]; };
const hue = (nm) => (nm < 490 ? [0, (nm - 440) * 5, 255] : nm < 510 ? [0, 255, (510 - nm) * 12] : nm < 580 ? [(nm - 510) * 3.6, 255, 0] : nm < 645 ? [255, (645 - nm) * 3.9, 0] : [255, 0, 0]).map((v) => Math.max(0, Math.min(255, v)));

async function match(ctx) {
  const pane = canvasPane(ctx.stage, 820, 520, '', { portrait: [480, 680] });
  const v = { nm: 580, r: 0.2, g: 0.2 }, matched = new Set();
  const out = readout();
  // the chart, the signal bars and the two swatches: in a row when wide, stacked when upright
  const L = () => (pane.W < pane.H
    ? { x0: 30, x1: 450, base: 240, top: 80, bx: 40, by: 360, bw: 400, sy: 580, sh: 90, sa: 30, sb: 250, swW: 200 }
    : { x0: 40, x1: 480, base: 270, top: 80, bx: 540, by: 80, bw: 220, sy: 404, sh: 100, sa: 40, sb: 300, swW: 220 });
  const draw = () => {
    const g = pane.g, l = L(), X = (nm) => l.x0 + ((nm - 400) / 300) * (l.x1 - l.x0), Y = (s) => l.base - s * (l.base - l.top);
    g.fillStyle = '#0e1116'; g.fillRect(0, 0, pane.W, pane.H);
    g.fillStyle = '#c9cfdd'; g.font = pane.font(19, 600); g.fillText('How strongly each cone answers', l.x0, 30); g.font = pane.font(17); g.fillText('to each wavelength', l.x0, 54);
    for (let nm = 400; nm <= 700; nm += 2) { g.fillStyle = rgbCss(hue(nm)); g.fillRect(X(nm), l.base + 8, (l.x1 - l.x0) / 150 + 0.6, 12); }
    CONES.forEach(([n, f, col]) => { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); for (let nm = 400; nm <= 700; nm += 2) g[nm === 400 ? 'moveTo' : 'lineTo'](X(nm), Y(f(nm))); g.stroke(); g.fillStyle = col; g.font = pane.font(20, 700); g.fillText(n, X(n === 'S' ? 445 : n === 'M' ? 515 : 595) - 6, l.top - 4); });
    const line = (nm, a, col, label) => { g.strokeStyle = col; g.lineWidth = 4; g.setLineDash(label === 'A' ? [] : [7, 5]); g.beginPath(); g.moveTo(X(nm), l.base); g.lineTo(X(nm), l.base - a * 110); g.stroke(); g.setLineDash([]); g.fillStyle = '#e8eaf0'; g.font = pane.font(18, 600); g.fillText(label, X(nm) - 6, l.base + 44); };
    line(v.nm, 1, '#fff', 'A'); line(RED, v.r, '#ff7a6b', 'B'); line(GREEN, v.g, '#7ddc8a', 'B');
    g.fillStyle = '#b0b8c9'; g.font = pane.font(16); g.fillText('400 nm', l.x0, l.base + 70); g.textAlign = 'right'; g.fillText('700 nm', l.x1, l.base + 70); g.textAlign = 'left';
    // cone signals of the two lights
    const A = CONES.map(([, f]) => f(v.nm)), B = CONES.map(([, f]) => v.r * f(RED) + v.g * f(GREEN));
    g.fillStyle = '#c9cfdd'; g.font = pane.font(19, 600); g.fillText('What the eye keeps', l.bx, l.by - 18);
    CONES.forEach(([n, , col], i) => { const y = l.by + i * (l.bw > 300 ? 64 : 76); g.fillStyle = col; g.font = pane.font(20, 700); g.fillText(n, l.bx, y + 30); [[A[i], 'A'], [B[i], 'B']].forEach(([val, lab], k) => { const x = l.bx + 32; g.fillStyle = '#1e2633'; g.fillRect(x, y + k * 28, l.bw - 32, 22); g.fillStyle = col; g.globalAlpha = k ? 0.6 : 1; g.fillRect(x, y + k * 28, Math.min(l.bw - 32, val * (l.bw - 32) * 0.8), 22); g.globalAlpha = 1; g.fillStyle = '#fff'; g.font = pane.font(16, 600); g.fillText(lab, x + l.bw - 26, y + k * 28 + 17); }); });
    const ok = Math.abs(A[0] - B[0]) < 0.035 && Math.abs(A[1] - B[1]) < 0.035;
    g.fillStyle = rgbCss(seen(A)); g.fillRect(l.sa, l.sy, l.swW, l.sh); g.fillStyle = rgbCss(seen(B)); g.fillRect(l.sb, l.sy, l.swW, l.sh);
    g.fillStyle = '#e8eaf0'; g.font = pane.font(17); g.fillText(`Light A: ${v.nm} nm`, l.sa, l.sy - 12); g.fillText('Lamp B: red + green', l.sb, l.sy - 12);
    if (ok) { g.strokeStyle = '#7ddc8a'; g.lineWidth = 4; g.strokeRect(l.sa - 4, l.sy - 4, l.sb - l.sa + l.swW + 8, l.sh + 8); }
    out.innerHTML = ok ? 'Same three signals: to the eye these two lights are <b>the same colour</b>.' : 'Change lamp B until its three bars equal those of light A.';
    if (ok) { matched.add(v.nm); ctx.did(0); if ([...matched].some((a) => Math.abs(a - [...matched][0]) >= 15)) ctx.did(1); }
  };
  // point at the chart to read the three cone answers at that wavelength
  pane.tip((x, y) => { const l = L(); if (x < l.x0 || x > l.x1 || y < l.top - 30 || y > l.base + 24) return null; const nm = Math.round(400 + ((x - l.x0) / (l.x1 - l.x0)) * 300); return `<b>${nm} nm</b><br>${CONES.map(([n, f]) => `${n} ${f(nm).toFixed(2)}`).join(' · ')}`; });
  pane.onResize(draw);
  ctx.controls.append(slider('Light A: wavelength', 550, 615, v.nm, (x) => { v.nm = x; draw(); }, { fmt: (x) => `${x} nm` }),
    slider('Lamp B: red', 0, 150, 20, (x) => { v.r = x / 100; draw(); }, { fmt: (x) => `${x}%` }), slider('Lamp B: green', 0, 150, 20, (x) => { v.g = x / 100; draw(); }, { fmt: (x) => `${x}%` }), out);
  draw();
}

// One function per station id of this concept in course.json. Texts live there, not here.
export default { match };
