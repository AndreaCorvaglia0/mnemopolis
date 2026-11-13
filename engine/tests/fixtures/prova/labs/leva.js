// Casa della Leva (fixture, Italian): an adult and a child on a seesaw.
import { slider } from '../../../../src/lab/shell.js';
import { canvasPane } from '../../../../src/lab/kit.js';

async function altalena(ctx) {
  const pane = canvasPane(ctx.stage, 720, 400, 'Sposta il bambino lungo l\'asse.', { portrait: [480, 420] });
  const v = { d: 10 }; // the child's distance from the fulcrum, in decimetres (the adult: 40 kg at 1,5 m)
  const draw = () => {
    const g = pane.g, W = pane.W, H = pane.H, cx = W / 2, cy = H * 0.62, half = W * 0.44, m = half / 4; // 4 m each side
    const tilt = Math.max(-0.22, Math.min(0.22, (40 * 1.5 - 20 * (v.d / 10)) * 0.006));
    g.fillStyle = '#16202c'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#6d5a3a'; g.beginPath(); g.moveTo(cx - 26, cy + 70); g.lineTo(cx + 26, cy + 70); g.lineTo(cx, cy); g.fill();
    g.save(); g.translate(cx, cy); g.rotate(-tilt);
    g.fillStyle = '#c99a5b'; g.fillRect(-half, -8, half * 2, 12);
    const kid = (x, r, col, label) => { g.fillStyle = col; g.beginPath(); g.arc(x, -8 - r, r, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = pane.font(17, 600); g.textAlign = 'center'; g.fillText(label, x, -8 - 2 * r - 8); };
    kid(-1.5 * m, 30, '#ff7a6b', '40 kg');
    kid((v.d / 10) * m, 21, '#4fd1c5', '20 kg');
    g.restore();
    g.fillStyle = '#e8eaf0'; g.font = pane.font(18); g.textAlign = 'left';
    g.fillText(`adulto: 40 × 1,5 = 60`, 16, 30); g.fillText(`bambino: 20 × ${(v.d / 10).toFixed(1).replace('.', ',')} = ${String(20 * v.d / 10).replace('.', ',')}`, 16, 58);
    if (v.d === 30) { g.fillStyle = '#7ddc8a'; g.fillText('In equilibrio!', 16, 86); ctx.did(0); }
  };
  pane.onResize(draw);
  const dist = slider('Distanza del bambino dal fulcro', 5, 40, v.d, (x) => { v.d = x; draw(); }, { step: 5, fmt: (x) => `${String(x / 10).replace('.', ',')} m` });
  ctx.controls.append(dist);
  ctx.hint?.(() => dist);
  draw();
}

export default { altalena };
