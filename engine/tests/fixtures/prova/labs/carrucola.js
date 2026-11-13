// Casa di Gino (fixture, Italian): a fixed and a movable pulley lifting 100 N.
import { seg } from '../../../../src/lab/shell.js';
import { canvasPane } from '../../../../src/lab/kit.js';

async function paranco(ctx) {
  const pane = canvasPane(ctx.stage, 720, 400, '', { portrait: [480, 420] });
  let kind = null; const seen = new Set();
  const draw = () => {
    const g = pane.g, W = pane.W, H = pane.H, cx = W / 2;
    g.fillStyle = '#16202c'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#5b6b80'; g.fillRect(0, 0, W, 16);
    g.strokeStyle = '#e8eaf0'; g.lineWidth = 3; g.fillStyle = '#c99a5b';
    if (kind === 'mobile') {
      g.beginPath(); g.moveTo(cx - 40, 16); g.lineTo(cx - 40, 220); g.moveTo(cx + 40, 220); g.lineTo(cx + 40, 60); g.stroke();
      g.beginPath(); g.arc(cx, 220, 40, 0, Math.PI); g.stroke();
      g.fillRect(cx - 30, 270, 60, 50);
    } else {
      g.beginPath(); g.arc(cx, 60, 34, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(cx - 34, 60); g.lineTo(cx - 34, 270); g.moveTo(cx + 34, 60); g.lineTo(cx + 34, 330); g.stroke();
      g.fillRect(cx - 64, 270, 60, 50);
    }
    g.fillStyle = '#e8eaf0'; g.font = pane.font(19); g.textAlign = 'left';
    if (kind) { g.fillText(`carico: 100 N`, 16, 50); g.fillText(`forza: ${kind === 'mobile' ? 50 : 100} N`, 16, 80); g.fillText(`corda per 1 m: ${kind === 'mobile' ? 2 : 1} m`, 16, 110); }
    if (kind === 'fissa') { seen.add('fissa'); ctx.did(0); }
    if (kind === 'mobile' && seen.has('fissa')) ctx.did(1);
  };
  pane.onResize(draw);
  const pick = seg([['fissa', 'Carrucola fissa'], ['mobile', 'Carrucola mobile']], null, (v) => { kind = v; draw(); });
  ctx.controls.append(pick);
  ctx.hint?.(() => pick);
  draw();
}

export default { paranco };
