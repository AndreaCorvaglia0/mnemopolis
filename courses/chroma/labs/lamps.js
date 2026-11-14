// Three Lamps House: additive mixing. Two stations, one idea each.
import { slider } from '../../../engine/src/lab/shell.js';
import { canvasPane, draggable, rgbCss, L } from '../../../engine/src/lab/kit.js';

const NAMES = () => ({ '000': L('no light (black)', 'nessuna luce (nero)'), '100': L('red', 'rosso'), '010': L('green', 'verde'), '001': L('blue', 'blu'), '110': L('yellow', 'giallo'), '011': L('cyan', 'ciano'), '101': L('magenta', 'magenta'), '111': L('white', 'bianco') });

// Discs keep their place in proportion when the stage turns from wide to upright.
function refit(items, from, to) { items.forEach((it) => { it.x *= to.W / from.W; it.y *= to.H / from.H; it.r = to.r; }); }

async function mix(ctx) {
  const pane = canvasPane(ctx.stage, 720, 480, L('A dark wall and three lamps. Drag them.', 'Una parete scura e tre lampade. Trascinale.'), { portrait: [480, 530] });
  const up = () => pane.W < pane.H;
  const layout = () => (up() ? { W: 480, H: 530, r: 88, at: [[135, 160], [345, 160], [240, 370]] } : { W: 720, H: 480, r: 105, at: [[190, 170], [530, 170], [360, 340]] });
  let LY = layout();
  const lamps = ['#ff0000', '#00ff00', '#0000ff'].map((c, i) => ({ x: LY.at[i][0], y: LY.at[i][1], r: LY.r, c }));
  let told = false;
  const read = (x, y) => {
    if (x < 0 || y < 0 || x >= pane.W || y >= pane.H) return null;
    const [r, g, b] = pane.g.getImageData(x, y, 1, 1).data, key = [r, g, b].map((v) => (v > 127 ? 1 : 0)).join('');
    const on = L('on', 'acceso'), off = L('off', 'spento');
    return L(`Red <b>${r > 127 ? on : off}</b> · green <b>${g > 127 ? on : off}</b> · blue <b>${b > 127 ? on : off}</b><br>= <b>${NAMES()[key]}</b>`, `Rosso <b>${r > 127 ? on : off}</b> · verde <b>${g > 127 ? on : off}</b> · blu <b>${b > 127 ? on : off}</b><br>= <b>${NAMES()[key]}</b>`);
  };
  const draw = () => {
    const g = pane.g;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000'; g.fillRect(0, 0, pane.W, pane.H);
    g.globalCompositeOperation = 'lighter'; // lights add
    lamps.forEach((l) => { g.fillStyle = l.c; g.beginPath(); g.arc(l.x, l.y, l.r, 0, 7); g.fill(); });
    g.globalCompositeOperation = 'source-over';
    const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) / (LY.r / 105);
    const [R, G, B] = ['#ff0000', '#00ff00', '#0000ff'].map((c) => lamps.find((l) => l.c === c));
    if (d(R, G) < 150) {
      ctx.did(0);
      // the read-out becomes useful once two lights overlap: say so once, where the learner looks
      if (!told) { told = true; ctx.nudge?.(L('Point at the overlap, or touch it, to read which lights are on there.', 'Punta la sovrapposizione, o toccala, per leggere quali luci sono accese lì.'), 9000); }
    }
    if (d(R, G) < 120 && d(G, B) < 120 && d(R, B) < 120) ctx.did(1);
  };
  pane.onResize(() => { const L2 = layout(); if (L2.W !== LY.W) refit(lamps, LY, L2); LY = L2; draw(); });
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
    if (up) { g.fillText(L('Right: the same three numbers', 'A destra: gli stessi tre numeri'), tx, ty); g.fillText(L('as one flat colour', 'come un unico colore uniforme'), tx, ty + 28); } else { g.fillText(L('the same three', 'gli stessi tre'), tx, ty); g.fillText(L('numbers as one', 'numeri come un'), tx, ty + 26); g.fillText(L('flat colour', 'colore uniforme'), tx, ty + 52); }
    if (v.n === 1) { g.strokeStyle = '#3a4252'; g.lineWidth = 1; for (let k = 0; k < 3; k++) g.strokeRect(x0 + k * sw + 0.5, y0 + 0.5, sw - 2, cell - 2); }
    pane.caption(v.n === 1 ? L('One pixel, very close: three small lamps', 'Un pixel, molto da vicino: tre piccole lampade') : L(`${v.n * v.n} identical pixels, further away`, `${v.n * v.n} pixel identici, più lontani`));
    if (v.r > 200 && v.g > 90 && v.g < 190 && v.b < 70) ctx.did(0);
    if (Math.abs(v.r - v.g) < 8 && Math.abs(v.g - v.b) < 8 && v.r > 40 && v.r < 216) ctx.did(1);
    if (v.n >= 60) ctx.did(2);
  };
  pane.onResize(draw);
  const s = (label, key, max = 255, min = 0) => slider(label, min, max, v[key], (x) => { v[key] = x; draw(); });
  const lamps = [s(L('Red lamp', 'Lampada rossa'), 'r'), s(L('Green lamp', 'Lampada verde'), 'g'), s(L('Blue lamp', 'Lampada blu'), 'b')], back = s(L('Step back from the screen', 'Allontanati dallo schermo'), 'n', 100, 1);
  ctx.controls.append(...lamps, back);
  ctx.hint?.((k) => (k < 2 ? lamps : back));
  draw();
}

// Upstairs (advanced): the numbers are not amounts of light. The light a value sends out, as a share
// of white's, follows the sRGB formula in the WCAG 2.1 definition of relative luminance.
export const lightOf = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };

async function gamma(ctx) {
  const pane = canvasPane(ctx.stage, 760, 460, L('Left: fine lines, half black and half white. Right: one flat grey.', 'A sinistra: linee sottili, metà nere e metà bianche. A destra: un unico grigio uniforme.'), { portrait: [480, 640] });
  const v = { g: 60 };
  // a 1 x 2 tile, white over black, drawn at one screen pixel per row: the lines must not be blurred
  const [tile, tg] = (() => { const c = document.createElement('canvas'); c.width = 1; c.height = 2; const t = c.getContext('2d'); t.fillStyle = '#fff'; t.fillRect(0, 0, 1, 1); t.fillStyle = '#000'; t.fillRect(0, 1, 1, 1); return [c, t]; })();
  const draw = () => {
    const g = pane.g, up = pane.upright, light = lightOf(v.g), pct = Math.round(light * 100);
    const LY = up ? { a: [30, 20, 200, 300], b: [250, 20, 200, 300], bars: 350, tx: 30 } : { a: [40, 24, 300, 260], b: [420, 24, 300, 260], bars: 306, tx: 40 };
    g.fillStyle = '#0e1116'; g.fillRect(0, 0, pane.W, pane.H);
    const pat = g.createPattern(tile, 'repeat'), dev = pane.scale * Math.min(3, window.devicePixelRatio || 1);
    pat.setTransform?.(new DOMMatrix().scale(1 / dev));
    g.fillStyle = pat; g.fillRect(...LY.a);
    g.fillStyle = `rgb(${v.g},${v.g},${v.g})`; g.fillRect(...LY.b);
    g.strokeStyle = '#3a4659'; g.lineWidth = 2; g.strokeRect(...LY.a); g.strokeRect(...LY.b);
    // how much light each sends out, as a bar: the lines always 50%
    const bar = (x, w, share, label, y) => {
      g.fillStyle = '#1b2230'; g.fillRect(x, y, w, 22); g.fillStyle = '#ffcf5a'; g.fillRect(x, y, w * share, 22);
      g.strokeStyle = '#3a4659'; g.strokeRect(x, y, w, 22); g.fillStyle = '#e8eaf0'; g.font = pane.font(19); g.fillText(label, x, y + 52);
    };
    bar(LY.a[0], LY.a[2], 0.5, L('light: 50% of white', 'luce: 50% del bianco'), LY.bars);
    bar(LY.b[0], LY.b[2], light, L(`light: ${pct}% of white`, `luce: ${pct}% del bianco`), LY.bars);
    g.fillStyle = '#c9cfdd'; g.font = pane.font(19);
    g.fillText(L(`grey value ${v.g} = ${Math.round((v.g / 255) * 100)}% of 255`, `grigio ${v.g} = ${Math.round((v.g / 255) * 100)}% di 255`), up ? LY.a[0] : LY.b[0], LY.bars + 84); // the number is not the light
    if (Math.abs(v.g - 128) <= 2) ctx.did(0);
    if (pct >= 47 && pct <= 53) ctx.did(1);
  };
  pane.onResize(draw);
  const grey = slider(L('Grey value, 0 to 255', 'Valore di grigio, da 0 a 255'), 0, 255, v.g, (x) => { v.g = x; draw(); });
  ctx.controls.append(grey);
  ctx.hint?.(() => grey);
  draw();
}

// One function per station id of this concept in course.json. Texts live there, not here.
export default { mix, pixel, gamma };
