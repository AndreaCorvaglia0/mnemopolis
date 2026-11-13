// Three Lamps House: additive mixing. Two stations, one idea each.
import { slider } from '../../../engine/src/lab/shell.js';
import { canvasPane, draggable, rgbCss } from '../../../engine/src/lab/kit.js';

const NAMES = { '000': 'no light (black)', '100': 'red', '010': 'green', '001': 'blue', '110': 'yellow', '011': 'cyan', '101': 'magenta', '111': 'white' };

// Discs keep their place in proportion when the stage turns from wide to upright.
function refit(items, from, to) { items.forEach((it) => { it.x *= to.W / from.W; it.y *= to.H / from.H; it.r = to.r; }); }

async function mix(ctx) {
  const pane = canvasPane(ctx.stage, 720, 480, 'A dark wall and three lamps. Drag them.', { portrait: [480, 530] });
  const up = () => pane.W < pane.H;
  const layout = () => (up() ? { W: 480, H: 530, r: 88, at: [[135, 160], [345, 160], [240, 370]] } : { W: 720, H: 480, r: 105, at: [[190, 170], [530, 170], [360, 340]] });
  let L = layout();
  const lamps = ['#ff0000', '#00ff00', '#0000ff'].map((c, i) => ({ x: L.at[i][0], y: L.at[i][1], r: L.r, c }));
  let told = false;
  const read = (x, y) => {
    if (x < 0 || y < 0 || x >= pane.W || y >= pane.H) return null;
    const [r, g, b] = pane.g.getImageData(x, y, 1, 1).data, key = [r, g, b].map((v) => (v > 127 ? 1 : 0)).join('');
    return `Red <b>${r > 127 ? 'on' : 'off'}</b> · green <b>${g > 127 ? 'on' : 'off'}</b> · blue <b>${b > 127 ? 'on' : 'off'}</b><br>= <b>${NAMES[key]}</b>`;
  };
  const draw = () => {
    const g = pane.g;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000'; g.fillRect(0, 0, pane.W, pane.H);
    g.globalCompositeOperation = 'lighter'; // lights add
    lamps.forEach((l) => { g.fillStyle = l.c; g.beginPath(); g.arc(l.x, l.y, l.r, 0, 7); g.fill(); });
    g.globalCompositeOperation = 'source-over';
    const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) / (L.r / 105);
    const [R, G, B] = ['#ff0000', '#00ff00', '#0000ff'].map((c) => lamps.find((l) => l.c === c));
    if (d(R, G) < 150) {
      ctx.did(0);
      // the read-out becomes useful once two lights overlap: say so once, where the learner looks
      if (!told) { told = true; ctx.nudge?.('Point at the overlap, or touch it, to read which lights are on there.', 9000); }
    }
    if (d(R, G) < 120 && d(G, B) < 120 && d(R, B) < 120) ctx.did(1);
  };
  pane.onResize(() => { const L2 = layout(); if (L2.W !== L.W) refit(lamps, L, L2); L = L2; draw(); });
  draggable(pane, lamps, draw, { bounds: () => [50, 50, pane.W - 50, pane.H - 50] });
  pane.tip(read);
  // where to act: the red lamp first, then the blue one
  pane.hint((k) => { const l = lamps.find((o) => o.c === (k === 0 ? '#ff0000' : '#0000ff')); return [l.x, l.y]; });
  draw();
}

async function pixel(ctx) {
  const pane = canvasPane(ctx.stage, 760, 480, '', { portrait: [480, 450] });
  const v = { r: 255, g: 60, b: 0, n: 1 };
  const draw = () => {
    const g = pane.g, up = pane.upright;
    // the magnified pixel, as large as the box allows, and the flat colour beside or below it
    const size = up ? 330 : 420, x0 = up ? 16 : 30, y0 = up ? 16 : 30, cell = size / v.n, sw = cell / 3;
    const fx = up ? 362 : 490, fy = up ? 16 : 30, fw = up ? 102 : 240, fh = up ? 330 : 240;
    g.fillStyle = '#000'; g.fillRect(0, 0, pane.W, pane.H);
    for (let j = 0; j < v.n; j++) for (let i = 0; i < v.n; i++) [[v.r, 0, 0], [0, v.g, 0], [0, 0, v.b]].forEach((c, k) => { g.fillStyle = rgbCss(c); g.fillRect(x0 + i * cell + k * sw, y0 + j * cell, Math.max(1, sw - (v.n < 12 ? 2 : 0)), Math.max(1, cell - (v.n < 12 ? 2 : 0))); });
    g.fillStyle = rgbCss([v.r, v.g, v.b]); g.fillRect(fx, fy, fw, fh);
    g.fillStyle = '#c9cfdd'; g.font = pane.font(20);
    const tx = up ? x0 : fx, ty = up ? 384 : fy + fh + 34;
    if (up) { g.fillText('Right: the same three numbers', tx, ty); g.fillText('as one flat colour', tx, ty + 28); } else { g.fillText('the same three', tx, ty); g.fillText('numbers as one', tx, ty + 26); g.fillText('flat colour', tx, ty + 52); }
    if (v.n === 1) { g.strokeStyle = '#3a4252'; g.lineWidth = 1; for (let k = 0; k < 3; k++) g.strokeRect(x0 + k * sw + 0.5, y0 + 0.5, sw - 2, cell - 2); }
    pane.caption(v.n === 1 ? 'One pixel, very close: three small lamps' : `${v.n * v.n} identical pixels, further away`);
    if (v.r > 200 && v.g > 90 && v.g < 190 && v.b < 70) ctx.did(0);
    if (Math.abs(v.r - v.g) < 8 && Math.abs(v.g - v.b) < 8 && v.r > 40 && v.r < 216) ctx.did(1);
    if (v.n >= 60) ctx.did(2);
  };
  pane.onResize(draw);
  const s = (label, key, max = 255, min = 0) => slider(label, min, max, v[key], (x) => { v[key] = x; draw(); });
  const lamps = [s('Red lamp', 'r'), s('Green lamp', 'g'), s('Blue lamp', 'b')], back = s('Step back from the screen', 'n', 100, 1);
  ctx.controls.append(...lamps, back);
  ctx.hint?.((k) => (k < 2 ? lamps : back));
  draw();
}

// Upstairs (advanced): the numbers are not amounts of light. The light a value sends out, as a share
// of white's, follows the sRGB formula in the WCAG 2.1 definition of relative luminance.
export const lightOf = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };

async function gamma(ctx) {
  const pane = canvasPane(ctx.stage, 760, 460, 'Left: fine lines, half black and half white. Right: one flat grey.', { portrait: [480, 640] });
  const v = { g: 60 };
  // a 1 x 2 tile, white over black, drawn at one screen pixel per row: the lines must not be blurred
  const [tile, tg] = (() => { const c = document.createElement('canvas'); c.width = 1; c.height = 2; const t = c.getContext('2d'); t.fillStyle = '#fff'; t.fillRect(0, 0, 1, 1); t.fillStyle = '#000'; t.fillRect(0, 1, 1, 1); return [c, t]; })();
  const draw = () => {
    const g = pane.g, up = pane.upright, light = lightOf(v.g), pct = Math.round(light * 100);
    const L = up ? { a: [30, 20, 200, 300], b: [250, 20, 200, 300], bars: 350, tx: 30 } : { a: [40, 24, 300, 260], b: [420, 24, 300, 260], bars: 306, tx: 40 };
    g.fillStyle = '#0e1116'; g.fillRect(0, 0, pane.W, pane.H);
    const pat = g.createPattern(tile, 'repeat'), dev = pane.scale * Math.min(3, window.devicePixelRatio || 1);
    pat.setTransform?.(new DOMMatrix().scale(1 / dev));
    g.fillStyle = pat; g.fillRect(...L.a);
    g.fillStyle = `rgb(${v.g},${v.g},${v.g})`; g.fillRect(...L.b);
    g.strokeStyle = '#3a4659'; g.lineWidth = 2; g.strokeRect(...L.a); g.strokeRect(...L.b);
    // how much light each sends out, as a bar: the lines always 50%
    const bar = (x, w, share, label, y) => {
      g.fillStyle = '#1b2230'; g.fillRect(x, y, w, 22); g.fillStyle = '#ffcf5a'; g.fillRect(x, y, w * share, 22);
      g.strokeStyle = '#3a4659'; g.strokeRect(x, y, w, 22); g.fillStyle = '#e8eaf0'; g.font = pane.font(19); g.fillText(label, x, y + 52);
    };
    bar(L.a[0], L.a[2], 0.5, 'light: 50% of white', L.bars);
    bar(L.b[0], L.b[2], light, `light: ${pct}% of white`, L.bars);
    g.fillStyle = '#c9cfdd'; g.font = pane.font(19);
    g.fillText(`grey value ${v.g} = ${Math.round((v.g / 255) * 100)}% of 255`, up ? L.a[0] : L.b[0], L.bars + 84); // the number is not the light
    if (Math.abs(v.g - 128) <= 2) ctx.did(0);
    if (pct >= 47 && pct <= 53) ctx.did(1);
  };
  pane.onResize(draw);
  const grey = slider('Grey value, 0 to 255', 0, 255, v.g, (x) => { v.g = x; draw(); });
  ctx.controls.append(grey);
  ctx.hint?.(() => grey);
  draw();
}

// One function per station id of this concept in course.json. Texts live there, not here.
export default { mix, pixel, gamma };
