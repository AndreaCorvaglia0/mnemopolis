// The Tuning House: pitch is how many squeezes reach the ear each second.
//   tone        the ready-made slider-reveal pattern, called from code: a pressure trace that
//               follows the frequency, plus what the pattern cannot do: the real tone, and the
//               crests counted on the trace
//   wavelength  a custom sketch: the learner guesses how wavelength depends on frequency, then the
//               real curve (343 m/s divided by the frequency) is drawn over the guess
import { sliderReveal, button, stage, tasks, animate, spring, C, alpha, clamp, fmt } from '../../../engine/src/lab/kit.js';

const SOUND = 343; // m/s, air at 20 °C (OpenStax University Physics 1, 17.2)

async function tone(ctx) {
  const lab = sliderReveal(ctx, {
    controls: [{ id: 'f', label: 'Frequency', min: 100, max: 1000, step: 10, value: 220, unit: 'Hz' }],
    plot: { x: { min: 0, max: 25, label: 'time (milliseconds)' }, y: { min: -1.3, max: 1.3, label: 'air pressure at the ear' } },
    layers: [
      { curve: 'sin(2*pi*f*x/1000)', label: 'squeezed above the line, stretched below' },
      { readout: '{f:0} squeezes per second: one every {1000/f:2} ms' },
    ],
  });
  // the crests in the window: one gold dot per squeeze that reaches the ear in these 25 ms
  lab.over((d, s, r) => {
    const [x0, y0, w, h] = r.A.plot, top = y0 + h * (1 - (1 + 1.3) / 2.6); // y = 1 on the plot's -1.3..1.3 scale
    let n = 0;
    for (let tx = 250 / s.f; tx <= 25; tx += 1000 / s.f) { d.circle(x0 + (tx / 25) * w, top, 7, { fill: C.gold, glow: C.gold }); n++; }
    d.text(`${n} squeezes in 25 ms`, x0 + w - 10, y0 + h - 12, { size: 18, weight: 700, color: C.gold, align: 'right' });
  });
  // the real tone, quiet, while the learner wants it
  let audio = null;
  const stop = () => { if (audio) { audio.g.gain.setTargetAtTime(0, audio.c.currentTime, 0.03); const a = audio; setTimeout(() => a.c.close(), 200); audio = null; } };
  button(ctx, 'Listen to it', (b) => {
    if (audio) { stop(); b.textContent = 'Listen to it'; return; }
    const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain();
    o.frequency.value = lab.v.f; g.gain.value = 0; g.gain.setTargetAtTime(0.06, c.currentTime, 0.05);
    o.connect(g).connect(c.destination); o.start(); audio = { c, o, g };
    b.textContent = 'Stop the sound';
  });
  lab.el.f.addEventListener('input', () => { if (audio) audio.o.frequency.setTargetAtTime(lab.v.f, audio.c.currentTime, 0.02); });
  ctx.onCleanup(stop);
}

async function wavelength(ctx) {
  const t = tasks(ctx), F = [200, 400, 600, 800], Y = { min: 0, max: 4 }, X = { min: 100, max: 1000 };
  const guess = F.map(() => spring(1.5, 12)), moved = new Set();
  let real = 0, shown = false, box = null; // real: how much of the true curve is drawn (0..1)
  const lam = (f) => SOUND / f;
  const view = stage(ctx, { wide: [800, 500], tall: [480, 620] }, (d, pane) => {
    d.clear();
    const up = pane.upright, x0 = 70, y0 = up ? 70 : 46, w = pane.W - x0 - 24, h = pane.H - y0 - (up ? 120 : 96);
    box = { x0, y0, w, h };
    const px = (f) => x0 + ((f - X.min) / (X.max - X.min)) * w, py = (l) => y0 + h - ((l - Y.min) / (Y.max - Y.min)) * h;
    d.box(x0, y0, w, h, { fill: '#0f141d', stroke: C.line, r: 8 });
    for (let l = 0; l <= 4; l++) { d.line([[x0, py(l)], [x0 + w, py(l)]], { color: '#1a2130', width: 1 }); d.text(`${l} m`, x0 - 10, py(l) + 6, { size: 16, color: C.dim, align: 'right' }); }
    for (let f = 100; f <= 1000; f += up ? 300 : 100) d.text(String(f), px(f), y0 + h + 24, { size: 16, color: C.dim, align: 'center' });
    d.text('frequency (Hz)', x0 + w, y0 + h + 50, { size: 16, color: C.muted, align: 'right' });
    d.wrap('wavelength: the length of one squeeze and stretch', 16, 4, pane.W - 32, { size: 16, color: C.muted, lines: 2 });
    const pts = F.map((f, i) => [px(f), py(guess[i].v)]);
    if (real > 0) {
      // the gap between the guess and the truth, then the true curve, drawn from left to right
      const end = X.min + (X.max - X.min) * real, g = d.g;
      g.save(); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      for (let i = F.length - 1; i >= 0; i--) g.lineTo(px(F[i]), py(lam(F[i]))); g.closePath(); g.fillStyle = alpha(C.bad, 0.18 * real); g.fill(); g.restore();
      const curve = []; for (let f = X.min; f <= end; f += 5) curve.push([px(f), py(clamp(lam(f), 0, Y.max))]);
      d.line(curve, { color: C.acc, width: 4, glow: C.acc });
    }
    d.line(pts, { color: C.gold, width: 3, dash: [10, 7] });
    pts.forEach(([x, y], i) => { d.circle(x, y, 16, { fill: alpha(C.gold, moved.has(i) ? 0.25 : 0.12), stroke: C.gold, width: 3 }); if (shown) d.text(`${fmt(lam(F[i]), 2)} m`, x, py(lam(F[i])) - 18, { size: 16, weight: 700, color: C.acc, align: 'center' }); });
    if (shown && real >= 1) {
      const err = F.reduce((s, f, i) => s + Math.abs(guess[i].v - lam(f)), 0) / F.length;
      d.text(`your guess is ${fmt(err, 2)} m off on average · at twice the frequency, half the wavelength`, x0, y0 + h + (up ? 84 : 80), { size: 17, weight: 700, color: C.gold, max: w });
    }
  });
  const anim = animate(ctx, (dt) => { let more = guess.map((g) => g.step(dt)).some(Boolean); if (shown && real < 1) { real = dt === Infinity ? 1 : Math.min(1, real + dt * 0.8); more = true; } view.redraw(); return more; });
  let cur = -1;
  view.pane.drag((x, y, phase) => {
    if (!box) return;
    const px = (f) => box.x0 + ((f - X.min) / (X.max - X.min)) * box.w, l = clamp(Y.min + ((box.y0 + box.h - y) / box.h) * (Y.max - Y.min), 0.05, Y.max);
    if (phase === 'down') cur = F.findIndex((f) => Math.abs(px(f) - x) < view.pane.px(30));
    if (cur >= 0 && phase !== 'up') { guess[cur].set(l); moved.add(cur); t.rec.moved.add(cur); view.redraw(); }
    if (phase === 'up' && cur >= 0) { cur = -1; t.state(guess.map((g) => g.v.toFixed(1)).join()).check(); }
  });
  t.rec.handles = F.length;
  const reveal = button(ctx, 'Show the real curve', () => { if (shown) return; shown = true; t.rec.revealed = true; t.check(); anim.kick(); }, { primary: true });
  view.pane.hint((k) => { if (k > 0) return null; const i = F.findIndex((_, j) => !moved.has(j)); if (i < 0 || !box) return null; return [box.x0 + ((F[i] - X.min) / (X.max - X.min)) * box.w, box.y0 + box.h - ((guess[i].v - Y.min) / (Y.max - Y.min)) * box.h]; });
  ctx.hint((k) => (k > 0 ? reveal : view.pane.__hint(k)));
  // for the screenshots: move every handle, or press the button
  ctx.stage.__ready = { t, custom: (verb) => { if (verb === 'sketch') { F.forEach((_, i) => { guess[i].to(1 + i * 0.4); moved.add(i); t.rec.moved.add(i); }); t.check(); anim.kick(); } if (verb === 'reveal') reveal.click(); } };
}

export default { tone, wavelength };
