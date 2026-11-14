// Painter's House: hue, saturation, lightness.
import { h, slider } from '../../../engine/src/lab/shell.js';
import { canvasPane, hslToRgb, rgbCss, L } from '../../../engine/src/lab/kit.js';

async function dials(ctx) {
  const pane = canvasPane(ctx.stage, 760, 480, L('Angle = hue. Distance from the centre = saturation.', 'Angolo = tinta. Distanza dal centro = saturazione.'), { portrait: [480, 590] });
  const v = { h: 0, s: 1, l: 0.5 };
  let disc = null, discL = -1;
  // disc centre and the swatch: side by side when wide, one above the other when upright
  const LY = () => (pane.W < pane.H ? { R: 175, cx: 240, cy: 190, sw: [30, 400, 140, 160], tx: 196, ty: 426 } : { R: 200, cx: 250, cy: 250, sw: [500, 50, 220, 200], tx: 500, ty: 300 });
  const draw = () => {
    const g = pane.g, { R, cx, cy, sw, tx, ty } = LY();
    if (discL !== v.l || disc.width !== R * 2) { // repaint the disc only when lightness changes
      disc = g.createImageData(R * 2, R * 2); discL = v.l;
      for (let y = 0; y < R * 2; y++) for (let x = 0; x < R * 2; x++) { const dx = x - R, dy = y - R, r = Math.hypot(dx, dy); if (r > R) continue; const [a, b, c] = hslToRgb((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, r / R, v.l), i = (y * R * 2 + x) * 4; disc.data[i] = a; disc.data[i + 1] = b; disc.data[i + 2] = c; disc.data[i + 3] = 255; }
    }
    g.fillStyle = '#0e1116'; g.fillRect(0, 0, pane.W, pane.H);
    g.putImageData(disc, cx - R, cy - R);
    const px = cx + Math.cos(v.h * Math.PI / 180) * v.s * R, py = cy + Math.sin(v.h * Math.PI / 180) * v.s * R, rgb = hslToRgb(v.h, v.s, v.l);
    g.strokeStyle = '#000'; g.lineWidth = 5; g.beginPath(); g.arc(px, py, 12, 0, 7); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = rgbCss(rgb); g.fillRect(...sw); g.strokeStyle = '#3a4659'; g.lineWidth = 2; g.strokeRect(...sw);
    g.fillStyle = '#e8eaf0'; g.font = pane.font(21);
    [L(`hue ${Math.round(v.h)}°`, `tinta ${Math.round(v.h)}°`), L(`saturation ${Math.round(v.s * 100)}%`, `saturazione ${Math.round(v.s * 100)}%`), L(`lightness ${Math.round(v.l * 100)}%`, `luminosità ${Math.round(v.l * 100)}%`)].forEach((t, i) => g.fillText(t, tx, ty + i * 32));
    // the same colour as three lamps (red, green, blue)
    g.fillStyle = '#c9cfdd'; g.fillText(`RGB ${rgb.map(Math.round).join(', ')}`, tx, ty + 3 * 32 + 8);
    if ((v.h > 320 || v.h < 12) && v.s > 0.45 && v.l >= 0.74 && v.l < 0.95) ctx.did(0);
    if (v.s < 0.06) ctx.did(1);
  };
  pane.onResize(draw);
  pane.drag((x, y) => { const { R, cx, cy } = LY(), dx = x - cx, dy = y - cy; v.h = Math.round((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360) % 360; v.s = Math.min(1, Math.hypot(dx, dy) / R); draw(); });
  pane.cv.style.cursor = 'crosshair';
  const light = slider(L('Lightness', 'Luminosità'), 5, 95, 50, (x) => { v.l = x / 100; draw(); }, { fmt: (x) => `${x}%` });
  // one degree at a time: a finger on the disc moves the hue by a few degrees, these land it exactly
  const turn = (d) => { v.h = (Math.round(v.h) + d + 360) % 360; draw(); };
  const fine = h('div', { style: 'display:flex;gap:8px;align-items:center', role: 'group', 'aria-label': L('Turn the hue one degree', 'Gira la tinta di un grado') },
    h('span', { class: 'lab-k', style: 'flex:1' }, L('Hue, one degree', 'Tinta, un grado')),
    h('button', { type: 'button', class: 'lab-btn', 'aria-label': L('Hue minus one degree', 'Tinta meno un grado'), onclick: () => turn(-1) }, '− 1°'),
    h('button', { type: 'button', class: 'lab-btn', 'aria-label': L('Hue plus one degree', 'Tinta più un grado'), onclick: () => turn(1) }, '+ 1°'));
  ctx.controls.append(light, fine);
  // where to act: a vivid red on the disc and the lightness control; then the centre of the disc
  ctx.hint?.((k) => { const { R, cx, cy } = LY(), a = (-12 * Math.PI) / 180; return k === 0 ? { el: light, at: [cx + Math.cos(a) * R * 0.75, cy + Math.sin(a) * R * 0.75] } : { at: [cx, cy] }; });
  draw();
}

// One function per station id of this concept in course.json. Texts live there, not here.
export default { dials };
