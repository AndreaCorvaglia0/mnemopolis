// Print Works (a workshop: three machines on one belt): subtractive mixing.
import { h, seg, slider, readout } from '../../../engine/src/lab/shell.js';
import { canvasPane, draggable, rgbCss } from '../../../engine/src/lab/kit.js';

function refit(items, from, to) { items.forEach((it) => { it.x *= to.W / from.W; it.y *= to.H / from.H; it.r = to.r; }); }

async function inks(ctx) {
  const pane = canvasPane(ctx.stage, 720, 480, 'White paper and three transparent inks. Drag them.', { portrait: [480, 530] });
  const layout = () => (pane.W < pane.H ? { W: 480, H: 530, r: 88, at: [[135, 160], [345, 160], [240, 370]] } : { W: 720, H: 480, r: 105, at: [[190, 170], [530, 170], [360, 340]] });
  let L = layout();
  const dots = [['#00ffff', 'cyan'], ['#ff00ff', 'magenta'], ['#ffff00', 'yellow']].map(([c, n], i) => ({ x: L.at[i][0], y: L.at[i][1], r: L.r, c, n }));
  const out = readout('Point at the paper, or touch it, to see which light comes back from that spot.');
  const read = (x, y) => {
    if (x < 0 || y < 0 || x >= pane.W || y >= pane.H) return null;
    const [r, g, b] = pane.g.getImageData(x, y, 1, 1).data, t = (v) => (v > 127 ? '<b>comes back</b>' : '<span style="color:#ff9a8d">absorbed</span>');
    return `Red light: ${t(r)}<br>Green light: ${t(g)}<br>Blue light: ${t(b)}`;
  };
  const draw = () => {
    const g = pane.g;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#fff'; g.fillRect(0, 0, pane.W, pane.H);
    g.globalCompositeOperation = 'multiply'; // each ink removes light
    dots.forEach((l) => { g.fillStyle = l.c; g.beginPath(); g.arc(l.x, l.y, l.r, 0, 7); g.fill(); });
    g.globalCompositeOperation = 'source-over';
    const by = (n) => dots.find((d) => d.n === n), d = (a, b) => Math.hypot(by(a).x - by(b).x, by(a).y - by(b).y) / (L.r / 105);
    if (d('cyan', 'yellow') < 150) ctx.did(0);
    if (d('cyan', 'magenta') < 120 && d('magenta', 'yellow') < 120 && d('cyan', 'yellow') < 120) ctx.did(1);
  };
  pane.onResize(() => { const L2 = layout(); if (L2.W !== L.W) refit(dots, L, L2); L = L2; draw(); });
  ctx.controls.append(out);
  draggable(pane, dots, draw, { bounds: () => [50, 50, pane.W - 50, pane.H - 50] });
  pane.hover((x, y) => { const t = read(x, y); if (t) out.innerHTML = t; });
  pane.tip(read);
  draw();
}

async function compare(ctx) {
  const pane = canvasPane(ctx.stage, 760, 440, '', { portrait: [480, 600] });
  const on = { red: false, green: false, blue: false }, RGB = { red: [255, 0, 0], green: [0, 255, 0], blue: [0, 0, 255] };
  const seen = new Set();
  const draw = () => {
    const g = pane.g, keys = Object.keys(on).filter((k) => on[k]), up = pane.W < pane.H;
    const light = keys.reduce((a, k) => a.map((v, i) => Math.min(255, v + RGB[k][i])), [0, 0, 0]);
    const paint = keys.reduce((a, k) => a.map((v, i) => (v * RGB[k][i]) / 255), [255, 255, 255]);
    g.fillStyle = '#0e1116'; g.fillRect(0, 0, pane.W, pane.H);
    // side by side on a wide stage, one above the other on an upright one
    const boxes = up ? [[30, 44, 420, 200], [30, 330, 420, 200]] : [[24, 56, 340, 300], [396, 56, 340, 300]];
    [[light, 'As lights, on a dark wall', `dark ${keys.map((k) => `+ ${k}`).join(' ')}`], [paint, 'As paints, on white paper', `white ${keys.map((k) => `− all but ${k}`).join(' ')}`]].forEach(([c, title, formula], i) => {
      const [x, y, w, hh] = boxes[i];
      g.fillStyle = rgbCss(c); g.fillRect(x, y, w, hh); g.strokeStyle = '#3a4659'; g.lineWidth = 2; g.strokeRect(x, y, w, hh);
      g.fillStyle = '#e8eaf0'; g.font = pane.font(20, 600); g.fillText(title, x, y - 14);
      g.fillStyle = '#c9cfdd'; g.font = pane.font(19); g.fillText(formula, x, y + hh + 30);
    });
    seen.add(keys.length);
    if (keys.length === 3) ctx.did(0);
    if (seen.has(0) && seen.has(2)) ctx.did(1);
  };
  pane.onResize(draw);
  const row = h('div', { style: 'display:flex;gap:8px', role: 'group', 'aria-label': 'Colours' });
  Object.keys(on).forEach((k) => { const b = h('button', { type: 'button', class: 'lab-btn', style: 'flex:1', 'aria-pressed': 'false', onclick: () => { on[k] = !on[k]; b.setAttribute('aria-pressed', String(on[k])); draw(); } }, k); row.append(b); });
  ctx.controls.append(h('div', { class: 'lab-k' }, 'Switch colours on and off'), row);
  draw();
}

async function dotsStation(ctx) {
  const pane = canvasPane(ctx.stage, 960, 720, '', { portrait: [720, 900] });
  const st = { zoom: 1, view: 'dots' };
  // the "photo": a shaded ball on a soft background, as tone values 0 (black) .. 1 (white)
  const tone = (u, v) => { const dx = u - 0.5, dy = v - 0.52, r = Math.hypot(dx, dy); if (r < 0.3) { const z = Math.sqrt(0.09 - r * r) / 0.3, l = Math.max(0, (-dx * 0.5 - dy * 0.6) / 0.3 * 0.55 + z * 0.75); return Math.min(1, 0.08 + l * 0.9); } return 0.55 + v * 0.4 - Math.max(0, 0.25 - Math.hypot(dx - 0.08, dy - 0.3) * 1.2); };
  const draw = () => {
    const g = pane.g, W = pane.W, H = pane.H, S = Math.max(W, H), z = st.zoom, cell = 4 * z, cx = 0.42, cy = 0.42; // zoom toward the bright edge of the ball
    // u, v in the photo's own square, whatever the shape of the stage
    const U = (x) => cx + ((x - W / 2) / S) / z, V = (y) => cy + ((y - H / 2) / S) / z;
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    if (st.view === 'tone') { const im = g.createImageData(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const t = tone(U(x), V(y)) * 255, i = (y * W + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = t; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); }
    else { g.fillStyle = '#111'; for (let y = cell / 2; y < H + cell; y += cell) for (let x = cell / 2; x < W + cell; x += cell) { const t = tone(U(x), V(y)), rad = Math.sqrt((1 - t) / Math.PI) * cell * 1.05; if (rad > 0.2) { g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); } } }
    pane.caption(st.view === 'tone' ? 'The original tones' : z < 2 ? 'A printed photo at reading distance' : `The same print, ${z}× closer`);
    if (z >= 8 && st.view === 'dots') ctx.did(0);
    if (st.view === 'tone') ctx.did(1);
  };
  pane.onResize(draw);
  ctx.controls.append(slider('Step closer', 1, 12, 1, (v) => { st.zoom = v; draw(); }, { fmt: (v) => `${v}×` }), seg([['dots', 'The print'], ['tone', 'The original tones']], 'dots', (v) => { st.view = v; draw(); }));
  draw();
}

// One function per station id of this concept in course.json. Texts live there, not here.
export default { inks, compare, dots: dotsStation };
