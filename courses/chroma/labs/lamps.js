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

// One function per station id of this concept in course.json. Texts live there, not here.
export default { mix, pixel };
