// Dyer's House: perceived colour depends on the surround.
import { seg, readout } from '../../../engine/src/lab/shell.js';
import { canvasPane, draggable } from '../../../engine/src/lab/kit.js';

async function grey(ctx) {
  const W = 720, H = 420, pane = canvasPane(ctx.stage, W, H, '');
  const sq = [{ x: 130, y: 210, r: 60 }, { x: 590, y: 210, r: 60 }];
  let bg = 'gradient';
  const out = readout('');
  const draw = () => {
    const g = pane.g;
    if (bg === 'gradient') { const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#1c1c1c'); gr.addColorStop(1, '#e4e4e4'); g.fillStyle = gr; } else g.fillStyle = '#808080';
    g.fillRect(0, 0, W, H);
    if (bg === 'plain') { g.strokeStyle = '#6a6a6a'; sq.forEach((s) => g.strokeRect(s.x - 44.5, s.y - 44.5, 90, 90)); }
    g.fillStyle = '#808080'; sq.forEach((s) => g.fillRect(s.x - 45, s.y - 45, 90, 90));
    if (Math.abs(sq[0].x - sq[1].x) < 110 && Math.abs(sq[0].y - sq[1].y) < 60) { ctx.did(0); out.innerHTML = 'Both squares are <b>128, 128, 128</b>. They always were.'; }
    if (bg === 'plain') ctx.did(1);
  };
  draggable(pane, sq, draw, { radius: () => 64, bounds: [50, 50, W - 50, H - 50] });
  ctx.controls.append(seg([['gradient', 'Dark-to-light wall'], ['plain', 'Plain wall']], 'gradient', (v) => { bg = v; draw(); }), out);
  draw();
}

async function tint(ctx) {
  const W = 720, H = 420, pane = canvasPane(ctx.stage, W, H, 'The two small patches: same colour or not?');
  let cover = 'off';
  const draw = () => {
    const g = pane.g;
    g.fillStyle = cover === 'on' ? '#8a8a8a' : '#f2c200'; g.fillRect(0, 0, W / 2, H);
    g.fillStyle = cover === 'on' ? '#8a8a8a' : '#2f5fd0'; g.fillRect(W / 2, 0, W / 2, H);
    g.fillStyle = '#8f8f86'; g.fillRect(130, 160, 100, 100); g.fillRect(490, 160, 100, 100);
    if (cover === 'on') { g.strokeStyle = '#6f6f6f'; g.strokeRect(130.5, 160.5, 100, 100); g.strokeRect(490.5, 160.5, 100, 100); ctx.did(0); }
    else if (ctx.wasCovered) ctx.did(1);
    if (cover === 'on') ctx.wasCovered = true;
  };
  ctx.controls.append(seg([['off', 'Coloured walls'], ['on', 'Cover the walls']], 'off', (v) => { cover = v; draw(); }));
  draw();
}

// One function per station id of this concept in course.json. Texts live there, not here.
export default { grey, tint };
