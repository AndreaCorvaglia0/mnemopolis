// Dyer's House: perceived colour depends on the surround.
import { seg, readout } from '../../../engine/src/lab/shell.js';
import { canvasPane, draggable } from '../../../engine/src/lab/kit.js';

async function grey(ctx) {
  // the wall runs from dark to light along the long side of the stage
  const pane = canvasPane(ctx.stage, 720, 420, '', { portrait: [440, 520] });
  const up = () => pane.W < pane.H;
  const home = () => (up() ? [[220, 110], [220, 410]] : [[130, 210], [590, 210]]);
  const sq = home().map(([x, y]) => ({ x, y, r: 60 }));
  let bg = 'gradient', shape = up();
  const out = readout('Drag a square.');
  const draw = () => {
    const g = pane.g, W = pane.W, H = pane.H;
    if (bg === 'gradient') { const gr = up() ? g.createLinearGradient(0, 0, 0, H) : g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#1c1c1c'); gr.addColorStop(1, '#e4e4e4'); g.fillStyle = gr; } else g.fillStyle = '#808080';
    g.fillRect(0, 0, W, H);
    if (bg === 'plain') { g.strokeStyle = '#6a6a6a'; g.lineWidth = 1; sq.forEach((s) => g.strokeRect(s.x - 44.5, s.y - 44.5, 90, 90)); }
    g.fillStyle = '#808080'; sq.forEach((s) => g.fillRect(s.x - 45, s.y - 45, 90, 90));
    if (Math.abs(sq[0].x - sq[1].x) < 115 && Math.abs(sq[0].y - sq[1].y) < 115) { ctx.did(0); out.innerHTML = 'Both squares are <b>128, 128, 128</b>. They always were.'; }
    if (bg === 'plain') ctx.did(1);
  };
  pane.onResize(() => { if (up() !== shape) { shape = up(); home().forEach(([x, y], i) => Object.assign(sq[i], { x, y })); } draw(); });
  draggable(pane, sq, draw, { radius: () => 64, bounds: () => [50, 50, pane.W - 50, pane.H - 50] });
  ctx.controls.append(seg([['gradient', 'Dark-to-light wall'], ['plain', 'Plain wall']], 'gradient', (v) => { bg = v; draw(); }), out);
  draw();
}

async function tint(ctx) {
  const pane = canvasPane(ctx.stage, 720, 420, '', { portrait: [440, 520] });
  let cover = 'off', covered = false;
  const draw = () => {
    const g = pane.g, W = pane.W, H = pane.H, up = W < H;
    const walls = up ? [[0, 0, W, H / 2], [0, H / 2, W, H / 2]] : [[0, 0, W / 2, H], [W / 2, 0, W / 2, H]];
    [['#f2c200', walls[0]], ['#2f5fd0', walls[1]]].forEach(([c, [x, y, w, hh]]) => { g.fillStyle = cover === 'on' ? '#8a8a8a' : c; g.fillRect(x, y, w, hh); });
    g.fillStyle = '#8f8f86';
    const patches = walls.map(([x, y, w, hh]) => [x + w / 2 - 50, y + hh / 2 - 50]);
    patches.forEach(([x, y]) => g.fillRect(x, y, 100, 100));
    if (cover === 'on') { g.strokeStyle = '#6f6f6f'; g.lineWidth = 1; patches.forEach(([x, y]) => g.strokeRect(x + 0.5, y + 0.5, 100, 100)); ctx.did(0); covered = true; }
    else if (covered) ctx.did(1);
  };
  pane.onResize(draw);
  ctx.controls.append(seg([['off', 'Coloured walls'], ['on', 'Cover the walls']], 'off', (v) => { cover = v; draw(); }));
  draw();
}

// One function per station id of this concept in course.json. Texts live there, not here.
export default { grey, tint };
