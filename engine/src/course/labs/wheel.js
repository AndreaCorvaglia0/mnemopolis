// Hue Tower: hue, saturation, lightness.
import { slider, readout } from '../../lab/shell.js';
import { canvasPane, hslToRgb, rgbCss } from '../../lab/kit.js';

async function dials(ctx) {
  const W = 720, H = 480, R = 200, CX = 240, CY = 240, pane = canvasPane(ctx.stage, W, H, 'Angle = hue. Distance from the centre = saturation.');
  const v = { h: 0, s: 1, l: 0.5 };
  const out = readout();
  let disc = null, discL = -1;
  const draw = () => {
    const g = pane.g;
    if (discL !== v.l) { // repaint the disc only when lightness changes
      disc = g.createImageData(R * 2, R * 2); discL = v.l;
      for (let y = 0; y < R * 2; y++) for (let x = 0; x < R * 2; x++) { const dx = x - R, dy = y - R, r = Math.hypot(dx, dy); if (r > R) continue; const [a, b, c] = hslToRgb((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, r / R, v.l), i = (y * R * 2 + x) * 4; disc.data[i] = a; disc.data[i + 1] = b; disc.data[i + 2] = c; disc.data[i + 3] = 255; }
    }
    g.fillStyle = '#0e1116'; g.fillRect(0, 0, W, H);
    g.putImageData(disc, CX - R, CY - R);
    const px = CX + Math.cos(v.h * Math.PI / 180) * v.s * R, py = CY + Math.sin(v.h * Math.PI / 180) * v.s * R, rgb = hslToRgb(v.h, v.s, v.l);
    g.strokeStyle = '#000'; g.lineWidth = 4; g.beginPath(); g.arc(px, py, 9, 0, 7); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
    g.fillStyle = rgbCss(rgb); g.fillRect(500, 60, 180, 180); g.strokeStyle = '#2a3240'; g.lineWidth = 1; g.strokeRect(500.5, 60.5, 180, 180);
    g.fillStyle = '#e6e8ee'; g.font = '15px system-ui';
    [`hue ${Math.round(v.h)}°`, `saturation ${Math.round(v.s * 100)}%`, `lightness ${Math.round(v.l * 100)}%`].forEach((t, i) => g.fillText(t, 500, 272 + i * 24));
    out.innerHTML = `The same colour as three lamps: <b>${rgb.map(Math.round).join(', ')}</b>`;
    if ((v.h > 320 || v.h < 12) && v.s > 0.45 && v.l >= 0.74 && v.l < 0.95) ctx.did(0);
    if (v.s < 0.06) ctx.did(1);
  };
  pane.drag((x, y) => { const dx = x - CX, dy = y - CY; v.h = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360; v.s = Math.min(1, Math.hypot(dx, dy) / R); draw(); });
  pane.cv.style.cursor = 'crosshair';
  ctx.controls.append(slider('Lightness', 5, 95, 50, (x) => { v.l = x / 100; draw(); }, { fmt: (x) => `${x}%` }), out);
  draw();
}

export default {
  title: 'Three dials',
  stations: [
    { tab: 'Three dials', goal: 'Any colour can be described the way people talk: which colour, how vivid, how light.',
      tries: ['Find a pastel pink: a red hue, vivid, and very light.', 'Turn any colour into a grey without touching lightness.'],
      takeaway: '<b>Hue</b> is which colour, <b>saturation</b> how far it is from grey, <b>lightness</b> how close to white or black. It is the same colour as RGB, with the numbers rearranged.',
      source: 'HSL computed live from the standard conversion to RGB.', mount: dials },
  ],
};
