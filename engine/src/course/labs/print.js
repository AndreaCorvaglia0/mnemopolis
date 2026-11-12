// Print Works (a workshop: three machines on one belt): subtractive mixing.
import { h, seg, slider, readout } from '../../lab/shell.js';
import { canvasPane, draggable, rgbCss } from '../../lab/kit.js';

async function inks(ctx) {
  const W = 720, H = 480, pane = canvasPane(ctx.stage, W, H, 'White paper and three transparent inks. Drag them.');
  const dots = [{ x: 190, y: 170, r: 105, c: '#00ffff', n: 'cyan' }, { x: 530, y: 170, r: 105, c: '#ff00ff', n: 'magenta' }, { x: 360, y: 360, r: 105, c: '#ffff00', n: 'yellow' }];
  const out = readout('Point at the paper to see which light comes back from that spot.');
  const draw = () => {
    const g = pane.g;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'multiply'; // each ink removes light
    dots.forEach((l) => { g.fillStyle = l.c; g.beginPath(); g.arc(l.x, l.y, l.r, 0, 7); g.fill(); });
    const by = (n) => dots.find((d) => d.n === n), d = (a, b) => Math.hypot(by(a).x - by(b).x, by(a).y - by(b).y);
    if (d('cyan', 'magenta') < 150) ctx.did(0);
    if (d('cyan', 'magenta') < 120 && d('magenta', 'yellow') < 120 && d('cyan', 'yellow') < 120) ctx.did(1);
  };
  ctx.controls.append(out);
  draggable(pane, dots, draw, { bounds: [60, 60, W - 60, H - 60] });
  pane.hover((x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const [r, g, b] = pane.g.getImageData(x, y, 1, 1).data, t = (v) => (v > 127 ? '<b>comes back</b>' : '<span style="color:#ff7a6b">absorbed</span>');
    out.innerHTML = `Red light: ${t(r)}<br>Green light: ${t(g)}<br>Blue light: ${t(b)}`;
  });
  draw();
}

async function compare(ctx) {
  const W = 720, H = 400, pane = canvasPane(ctx.stage, W, H, '');
  const on = { red: false, green: false, blue: false }, RGB = { red: [255, 0, 0], green: [0, 255, 0], blue: [0, 0, 255] };
  let seen = new Set();
  const draw = () => {
    const g = pane.g, keys = Object.keys(on).filter((k) => on[k]);
    const light = keys.reduce((a, k) => a.map((v, i) => Math.min(255, v + RGB[k][i])), [0, 0, 0]);
    const paint = keys.reduce((a, k) => a.map((v, i) => (v * RGB[k][i]) / 255), [255, 255, 255]);
    g.fillStyle = '#0e1116'; g.fillRect(0, 0, W, H);
    [[30, light, 'AS LIGHTS on a dark wall', `dark ${keys.map((k) => `+ ${k}`).join(' ')}`], [380, paint, 'AS PAINTS on white paper', `white ${keys.map((k) => `− all but ${k}`).join(' ')}`]].forEach(([x, c, title, formula]) => {
      g.fillStyle = rgbCss(c); g.fillRect(x, 60, 310, 250); g.strokeStyle = '#2a3240'; g.strokeRect(x + 0.5, 60.5, 310, 250);
      g.fillStyle = '#aeb6c8'; g.font = '600 14px system-ui'; g.fillText(title, x, 44);
      g.font = '15px system-ui'; g.fillStyle = '#e6e8ee'; g.fillText(formula, x, 340);
    });
    seen.add(keys.length);
    if (keys.length === 3) ctx.did(0);
    if (seen.has(0) && seen.has(2)) ctx.did(1);
  };
  const row = h('div', { style: 'display:flex;gap:8px' });
  Object.keys(on).forEach((k) => { const b = h('button', { class: 'lab-btn', style: 'flex:1', onclick: () => { on[k] = !on[k]; b.style.borderColor = on[k] ? '#ffcf5a' : ''; b.style.color = on[k] ? '#ffcf5a' : ''; draw(); } }, k); row.append(b); });
  ctx.controls.append(h('div', { class: 'lab-k' }, 'Switch colours on and off'), row);
  draw();
}

async function dotsStation(ctx) {
  const W = 960, H = 720, pane = canvasPane(ctx.stage, W, H, '');
  const st = { zoom: 1, view: 'dots' };
  // the "photo": a shaded ball on a soft background, as tone values 0 (black) .. 1 (white)
  const tone = (u, v) => { const dx = u - 0.5, dy = v - 0.52, r = Math.hypot(dx, dy); if (r < 0.3) { const z = Math.sqrt(0.09 - r * r) / 0.3, l = Math.max(0, (-dx * 0.5 - dy * 0.6) / 0.3 * 0.55 + z * 0.75); return Math.min(1, 0.08 + l * 0.9); } return 0.55 + v * 0.4 - Math.max(0, 0.25 - Math.hypot(dx - 0.08, dy - 0.3) * 1.2); };
  const draw = () => {
    const g = pane.g, z = st.zoom, cell = 3 * z, cx = 0.42, cy = 0.42; // zoom toward the bright edge of the ball
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    if (st.view === 'tone') { const im = g.createImageData(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const t = tone(cx + (x / W - 0.5) / z, cy + (y / H - 0.5) / z) * 255, i = (y * W + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = t; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); }
    else { g.fillStyle = '#111'; for (let y = cell / 2; y < H + cell; y += cell) for (let x = cell / 2; x < W + cell; x += cell) { const t = tone(cx + (x / W - 0.5) / z, cy + (y / H - 0.5) / z), rad = Math.sqrt((1 - t) / Math.PI) * cell * 1.05; if (rad > 0.2) { g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); } } }
    pane.caption(st.view === 'tone' ? 'The original tones' : z < 2 ? 'A printed photo at reading distance' : `The same print, ${z}× closer`);
    if (z >= 8 && st.view === 'dots') ctx.did(0);
    if (st.view === 'tone') ctx.did(1);
  };
  ctx.controls.append(slider('Step closer', 1, 12, 1, (v) => { st.zoom = v; draw(); }, { fmt: (v) => `${v}×` }), seg([['dots', 'The print'], ['tone', 'The original tones']], 'dots', (v) => { st.view = v; draw(); }));
  draw();
}

export default {
  title: 'Subtractive mixing',
  stepper: true,
  stations: [
    { tab: 'Ink removes light', short: 'INK', zone: 'Mix', goal: 'Paper is white because it sends back all light. An ink works by keeping some of it.',
      tries: ['Drag cyan onto magenta and read what comes back.', 'Stack all three inks.'],
      takeaway: 'Cyan absorbs <b>red</b>, magenta absorbs <b>green</b>, yellow absorbs <b>blue</b>. Two inks leave one light; three leave none: black.',
      source: 'Drawn live with multiply blending: each ink removes its own channel.', mount: inks },
    { tab: 'Light or paint', short: 'COMPARE', zone: 'Mix', goal: 'The same colours behave in opposite ways as lights and as paints.',
      tries: ['Switch on all three.', 'Compare none with two.'],
      takeaway: 'Lights start from <b>dark and add</b>: more lights, brighter. Paints start from <b>white and take away</b>: more paints, darker.',
      source: 'Idealised lights and paints: each paint is taken to reflect one primary only.', mount: compare },
    { tab: 'Dots', short: 'DOTS', zone: 'Print', goal: 'A printer cannot make light grey ink. It prints black dots of different sizes.',
      tries: ['Step closer until you see single dots.', 'Compare the print with the original tones.'],
      takeaway: 'Tone on paper is <b>dot size</b>: big dots look dark, small dots look light. From reading distance the eye averages them.',
      source: 'A halftone computed live from a simple shaded ball.', mount: dotsStation },
  ],
};
