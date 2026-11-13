// Bottega delle Rampe (fixture, Italian): a ramp to a step 1 m high, a crate of 100 N.
import { slider } from '../../../../src/lab/shell.js';
import { canvasPane } from '../../../../src/lab/kit.js';

async function rampa(ctx) {
  const pane = canvasPane(ctx.stage, 720, 400, 'Allunga la rampa.', { portrait: [480, 420] });
  const v = { L: 2 };
  const draw = () => {
    const g = pane.g, W = pane.W, H = pane.H, base = H - 50, px = (W - 60) / 5, top = base - px * 1, x1 = W - 30, x0 = x1 - px * Math.sqrt(Math.max(0, v.L * v.L - 1));
    g.fillStyle = '#16202c'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#5b6b80'; g.fillRect(x1 - 4, top, 34, base - top);
    g.strokeStyle = '#c99a5b'; g.lineWidth = 8; g.beginPath(); g.moveTo(x0, base); g.lineTo(x1, top); g.stroke();
    g.fillStyle = '#e8eaf0'; g.font = pane.font(19); g.textAlign = 'left';
    const F = Math.round(100 / v.L);
    g.fillText(`rampa: ${String(v.L).replace('.', ',')} m · altezza: 1 m`, 16, 30);
    g.fillText(`forza per spingere: ${F} N`, 16, 60);
    if (F <= 25) ctx.did(0);
  };
  pane.onResize(draw);
  const len = slider('Lunghezza della rampa', 1, 5, v.L, (x) => { v.L = x; draw(); }, { step: 0.5, fmt: (x) => `${String(x).replace('.', ',')} m` });
  ctx.controls.append(len);
  ctx.hint?.(() => len);
  draw();
}

export default { rampa };
