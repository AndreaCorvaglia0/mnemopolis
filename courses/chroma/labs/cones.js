// Cone Cave (deep dive): why three numbers are enough. Two different lights, one colour.
import { slider } from '../../../engine/src/lab/shell.js';
import { canvasPane, rgbCss } from '../../../engine/src/lab/kit.js';

// Simplified cone sensitivities: bell curves at roughly the right places. Good for the idea, not for measurement.
const bell = (peak, width) => (nm) => Math.exp(-((nm - peak) ** 2) / (2 * width * width));
const CONES = [['L', bell(565, 48), '#ff7a6b'], ['M', bell(540, 42), '#7ddc8a'], ['S', bell(445, 26), '#6f93e0']];
const RED = 630, GREEN = 535;
// One function turns cone signals into a screen colour, for both lights: equal signals give equal swatches by construction.
const seen = ([L, M]) => { const q = M / Math.max(L, 1e-6), k = Math.min(1, (L + M) / 1.5); return [255 * k * Math.max(0, Math.min(1, 1.9 - 1.3 * q)), 255 * k * Math.max(0, Math.min(1, 1.9 * q - 0.25)), 0]; };
const hue = (nm) => (nm < 490 ? [0, (nm - 440) * 5, 255] : nm < 510 ? [0, 255, (510 - nm) * 12] : nm < 580 ? [(nm - 510) * 3.6, 255, 0] : nm < 645 ? [255, (645 - nm) * 3.9, 0] : [255, 0, 0]).map((v) => Math.max(0, Math.min(255, v)));

async function match(ctx) {
  const pane = canvasPane(ctx.stage, 860, 520, '', { portrait: [480, 660] });
  const v = { nm: 580, r: 0.2, g: 0.2 }, matched = new Set();
  // the chart, the signal bars and the two swatches: in a row when wide, stacked when upright
  const L = () => (pane.W < pane.H
    ? { x0: 30, x1: 450, top: 70, base: 200, bx: 30, by: 336, bw: 420, row: 56, sy: 538, sh: 70, sa: 30, sb: 250, swW: 200 }
    : { x0: 40, x1: 470, top: 80, base: 270, bx: 540, by: 70, bw: 290, row: 70, sy: 384, sh: 90, sa: 40, sb: 290, swW: 220 });
  const draw = () => {
    const g = pane.g, l = L(), X = (nm) => l.x0 + ((nm - 400) / 300) * (l.x1 - l.x0), Y = (s) => l.base - s * (l.base - l.top);
    g.textAlign = 'left'; g.setLineDash([]);
    g.fillStyle = '#0e1116'; g.fillRect(0, 0, pane.W, pane.H);
    g.fillStyle = '#e8eaf0'; g.font = pane.font(19, 600); g.fillText('How strongly each cone answers', l.x0, 30);
    // spectrum and the three curves, each named beside its peak
    for (let nm = 400; nm <= 700; nm += 2) { g.fillStyle = rgbCss(hue(nm)); g.fillRect(X(nm), l.base + 6, (l.x1 - l.x0) / 150 + 0.6, 12); }
    CONES.forEach(([n, f, col]) => { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); for (let nm = 400; nm <= 700; nm += 2) g[nm === 400 ? 'moveTo' : 'lineTo'](X(nm), Y(f(nm))); g.stroke(); });
    g.font = pane.font(19, 700);
    g.fillStyle = '#6f93e0'; g.fillText('S', X(445) + 12, Y(0.92));
    g.fillStyle = '#7ddc8a'; g.textAlign = 'right'; g.fillText('M', X(540) - 14, Y(0.95)); g.textAlign = 'left';
    g.fillStyle = '#ff7a6b'; g.fillText('L', X(652), Y(0.3));
    // light A: one solid line; lamp B: two dashed lines, its red and its green part
    const mark = (nm, a, col, dash) => { g.strokeStyle = col; g.lineWidth = 4; g.setLineDash(dash ? [7, 5] : []); g.beginPath(); g.moveTo(X(nm), l.base); g.lineTo(X(nm), l.base - a * (l.base - l.top) * 0.8); g.stroke(); g.setLineDash([]); };
    mark(v.nm, 1, '#fff', false); mark(RED, v.r, '#ff7a6b', true); mark(GREEN, v.g, '#7ddc8a', true);
    g.font = pane.font(17, 700); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('A', X(v.nm), l.base - (l.base - l.top) * 0.8 - 8); g.textAlign = 'left';
    g.font = pane.font(16); g.fillStyle = '#c9cfdd';
    g.fillText('400 nm', l.x0, l.base + 42); g.textAlign = 'right'; g.fillText('700 nm', l.x1, l.base + 42); g.textAlign = 'left';
    // legend: what the lines are
    const ly = l.base + 70; g.lineWidth = 4;
    g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(l.x0, ly - 6); g.lineTo(l.x0 + 22, ly - 6); g.stroke();
    g.fillStyle = '#e8eaf0'; g.fillText('light A', l.x0 + 30, ly);
    const lx = l.x0 + 30 + g.measureText('light A').width + 24;
    g.setLineDash([7, 5]); g.strokeStyle = '#ff7a6b'; g.beginPath(); g.moveTo(lx, ly - 6); g.lineTo(lx + 22, ly - 6); g.stroke(); g.strokeStyle = '#7ddc8a'; g.beginPath(); g.moveTo(lx + 28, ly - 6); g.lineTo(lx + 50, ly - 6); g.stroke(); g.setLineDash([]);
    g.fillText('lamp B: red + green', lx + 58, ly);
    // cone signals of the two lights, with full names on every bar
    const A = CONES.map(([, f]) => f(v.nm)), B = CONES.map(([, f]) => v.r * f(RED) + v.g * f(GREEN));
    g.fillStyle = '#e8eaf0'; g.font = pane.font(19, 600); g.fillText('What the eye keeps', l.bx, l.by - 14);
    const name = 92, bh = Math.min(18, (l.row - 10) / 2);
    CONES.forEach(([n, , col], i) => {
      const y = l.by + i * l.row;
      g.fillStyle = col; g.font = pane.font(19, 700); g.fillText(n, l.bx, y + bh + 6);
      [[A[i], 'light A', 1], [B[i], 'lamp B', 0.6]].forEach(([val, lab, al], k) => {
        const x = l.bx + 28 + name, yy = y + k * (bh + 4), w = l.bw - 28 - name;
        g.fillStyle = '#c9cfdd'; g.font = pane.font(15); g.fillText(lab, l.bx + 28, yy + bh - 2);
        g.fillStyle = '#1e2633'; g.fillRect(x, yy, w, bh);
        g.fillStyle = col; g.globalAlpha = al; g.fillRect(x, yy, Math.min(w, val * w * 0.8), bh); g.globalAlpha = 1;
      });
    });
    const ok = Math.abs(A[0] - B[0]) < 0.035 && Math.abs(A[1] - B[1]) < 0.035;
    g.fillStyle = rgbCss(seen(A)); g.fillRect(l.sa, l.sy, l.swW, l.sh); g.fillStyle = rgbCss(seen(B)); g.fillRect(l.sb, l.sy, l.swW, l.sh);
    g.fillStyle = '#e8eaf0'; g.font = pane.font(17); g.fillText(`Light A: ${v.nm} nm`, l.sa, l.sy - 10); g.fillText('Lamp B', l.sb, l.sy - 10);
    if (ok) { g.strokeStyle = '#7ddc8a'; g.lineWidth = 4; g.strokeRect(l.sa - 5, l.sy - 5, l.sb - l.sa + l.swW + 10, l.sh + 10); }
    g.font = pane.font(17, 600); g.fillStyle = ok ? '#7ddc8a' : '#c9cfdd';
    g.fillText(ok ? 'Same three signals: the same colour.' : 'Not the same yet: compare the bars.', l.sa, l.sy + l.sh + 32);
    if (ok) { matched.add(v.nm); ctx.did(0); if ([...matched].some((a) => Math.abs(a - [...matched][0]) >= 15)) ctx.did(1); }
  };
  // point at the chart to read the three cone answers at that wavelength
  pane.tip((x, y) => { const l = L(); if (x < l.x0 || x > l.x1 || y < l.top - 30 || y > l.base + 24) return null; const nm = Math.round(400 + ((x - l.x0) / (l.x1 - l.x0)) * 300); return `<b>${nm} nm</b><br>${CONES.map(([n, f]) => `${n} ${f(nm).toFixed(2)}`).join(' · ')}`; });
  pane.onResize(draw);
  const wave = slider('Light A: wavelength', 550, 615, v.nm, (x) => { v.nm = x; draw(); }, { fmt: (x) => `${x} nm` });
  const red = slider('Lamp B: red part', 0, 150, 20, (x) => { v.r = x / 100; draw(); }, { fmt: (x) => `${x}%` });
  const green = slider('Lamp B: green part', 0, 150, 20, (x) => { v.g = x / 100; draw(); }, { fmt: (x) => `${x}%` });
  ctx.controls.append(red, green, wave);
  // the controls the current task needs: lamp B's two parts first, then light A's wavelength
  ctx.hint?.((k) => (k === 0 ? [red, green] : wave));
  draw();
}

// One function per station id of this concept in course.json. Texts live there, not here.
export default { match };
