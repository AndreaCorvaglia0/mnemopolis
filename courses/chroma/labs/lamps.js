// Three Lamps House: additive mixing. Two stations, one idea each.
import { h, slider, readout } from '../../../engine/src/lab/shell.js';
import { canvasPane, draggable, rgbCss } from '../../../engine/src/lab/kit.js';

const NAMES = { '000': 'no light (black)', '100': 'red', '010': 'green', '001': 'blue', '110': 'yellow', '011': 'cyan', '101': 'magenta', '111': 'white' };

async function mix(ctx) {
  const W = 720, H = 480, pane = canvasPane(ctx.stage, W, H, 'A dark wall and three lamps. Drag them.');
  const lamps = [{ x: 190, y: 170, r: 105, c: '#ff0000' }, { x: 530, y: 170, r: 105, c: '#00ff00' }, { x: 360, y: 360, r: 105, c: '#0000ff' }];
  const out = readout('Point at the wall to read the light at that spot.');
  const draw = () => {
    const g = pane.g;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter'; // lights add
    lamps.forEach((l) => { g.fillStyle = l.c; g.beginPath(); g.arc(l.x, l.y, l.r, 0, 7); g.fill(); });
    const d = (a, b) => Math.hypot(lamps[a].x - lamps[b].x, lamps[a].y - lamps[b].y);
    const [R, G, B] = ['#ff0000', '#00ff00', '#0000ff'].map((c) => lamps.findIndex((l) => l.c === c));
    if (d(R, G) < 150) ctx.did(0);
    if (d(R, G) < 120 && d(G, B) < 120 && d(R, B) < 120) ctx.did(1);
  };
  ctx.controls.append(out);
  draggable(pane, lamps, draw, { bounds: [60, 60, W - 60, H - 60] });
  pane.hover((x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const [r, g, b] = pane.g.getImageData(x, y, 1, 1).data, key = [r, g, b].map((v) => (v > 127 ? 1 : 0)).join('');
    out.innerHTML = `Here: red <b>${r ? 'on' : 'off'}</b> · green <b>${g ? 'on' : 'off'}</b> · blue <b>${b ? 'on' : 'off'}</b> → <b>${NAMES[key]}</b>`;
  });
  draw();
}

async function pixel(ctx) {
  const W = 720, H = 480, pane = canvasPane(ctx.stage, W, H, '');
  const v = { r: 255, g: 60, b: 0, n: 1 };
  const out = readout();
  const draw = () => {
    const g = pane.g, size = 420, x0 = 40, y0 = 30, cell = size / v.n, sw = cell / 3;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let j = 0; j < v.n; j++) for (let i = 0; i < v.n; i++) [[v.r, 0, 0], [0, v.g, 0], [0, 0, v.b]].forEach((c, k) => { g.fillStyle = rgbCss(c); g.fillRect(x0 + i * cell + k * sw, y0 + j * cell, Math.max(1, sw - (v.n < 12 ? 2 : 0)), Math.max(1, cell - (v.n < 12 ? 2 : 0))); });
    g.fillStyle = rgbCss([v.r, v.g, v.b]); g.fillRect(520, 30, 160, 160);
    g.fillStyle = '#aeb6c8'; g.font = '15px system-ui'; g.fillText('the same three numbers', 520, 212); g.fillText('as one flat colour', 520, 232);
    if (v.n === 1) { g.strokeStyle = '#3a4252'; g.lineWidth = 1; for (let k = 0; k < 3; k++) g.strokeRect(x0 + k * sw + 0.5, y0 + 0.5, sw - 2, cell - 2); }
    pane.caption(v.n === 1 ? 'One pixel, very close: three small lamps' : `${v.n * v.n} identical pixels, further away`);
    out.innerHTML = `This pixel is the three numbers <b>${v.r}, ${v.g}, ${v.b}</b>.`;
    if (v.r > 200 && v.g > 90 && v.g < 190 && v.b < 70) ctx.did(0);
    if (Math.abs(v.r - v.g) < 8 && Math.abs(v.g - v.b) < 8 && v.r > 40 && v.r < 216) ctx.did(1);
    if (v.n >= 60) ctx.did(2);
  };
  const s = (label, key, max = 255, min = 0) => slider(label, min, max, v[key], (x) => { v[key] = x; draw(); });
  ctx.controls.append(s('Red lamp', 'r'), s('Green lamp', 'g'), s('Blue lamp', 'b'), s('Step back from the screen', 'n', 100, 1), out);
  draw();
}

// One function per station id of this concept in course.json. Texts live there, not here.
export default { mix, pixel };
