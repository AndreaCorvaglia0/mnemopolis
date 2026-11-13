// The Squeeze House: sound is a squeeze passed from molecule to molecule; the air itself stays.
// The learner pushes the speaker cone by hand. Each molecule's shift is the cone's shift a moment
// earlier (the time the squeeze takes to reach it): a travelling wave, slowed down to be seen.
import { stage, tasks, animate, C, alpha, clamp, sfx } from '../../../engine/src/lab/kit.js';

async function push(ctx) {
  const t = tasks(ctx); // ticks the tasks by their "when" in course.json
  const hist = [], SPEED = 260, MAXP = 26; // squeeze speed in units per second (slowed down), cone travel
  const t0 = performance.now(), clock = () => (performance.now() - t0) / 1000; // one wall clock: frames and pointer events agree
  let cone = 0, grab = false, now = 0, lastMove = -9, heard = 0, lastHit = -9, ring = 0, goldMin = 0, goldMax = 0, wasOut = false;
  const shiftAt = (dist, at = now) => { const tt = at - dist / SPEED; for (let i = hist.length - 1; i >= 0; i--) if (hist[i][0] <= tt) return hist[i][1] * Math.exp(-dist / 1400); return 0; };
  const L = (p) => (p.upright ? { x0: 118, cols: 10, rows: 13, gx: 28, gy: 34, top: 70, ear: 428 } : { x0: 150, cols: 22, rows: 9, gx: 26, gy: 34, top: 80, ear: 760 });
  const view = stage(ctx, { wide: [820, 470], tall: [480, 620] }, (d, pane) => {
    const l = L(pane), cy = l.top + ((l.rows - 1) * l.gy) / 2, gold = { c: 2, r: Math.floor(l.rows / 2) };
    d.clear();
    // the speaker: a box and a cone the learner pushes
    d.box(14, cy - 90, 62, 180, { fill: C.card2, stroke: C.line2, r: 10 });
    d.box(76 + cone, cy - 70, 16, 140, { fill: grab ? C.acc : C.muted, r: 6, glow: grab ? C.acc : null });
    d.text('speaker', 45, cy + 118, { size: 16, color: C.dim, align: 'center' });
    // the air: every molecule shifted by the squeeze that has reached it; squeezed air glows
    for (let r = 0; r < l.rows; r++) for (let c = 0; c < l.cols; c++) {
      const hx = l.x0 + c * l.gx, dist = hx - 90, u = shiftAt(dist), squeeze = clamp((shiftAt(dist - 8) - shiftAt(dist + 8)) / 10, -1, 1);
      const isGold = c === gold.c && r === gold.r, x = hx + u, y = l.top + r * l.gy;
      if (isGold) { d.line([[hx, y - 16], [hx, y + 16]], { color: alpha(C.gold, 0.5), width: 2, dash: [4, 4] }); d.circle(x, y, 9, { fill: C.gold, glow: C.gold }); }
      // squeezed air: larger, bright teal; stretched air: small and dim
      else d.circle(x, y, 5 + 3 * Math.max(0, squeeze), { fill: squeeze > 0.05 ? alpha(C.acc, 0.5 + 0.5 * squeeze) : alpha(C.muted, clamp(0.55 + 0.45 * squeeze, 0.15, 0.6)) });
    }
    // how far the gold molecule has ever gone: a short bracket under it
    const gx0 = l.x0 + gold.c * l.gx, gy = l.top + gold.r * l.gy + 26;
    if (goldMax - goldMin > 2) { d.line([[gx0 + goldMin, gy], [gx0 + goldMax, gy]], { color: C.gold, width: 4 }); d.wrap(`the gold molecule's whole trip: ${Math.round(goldMax - goldMin)} units (the ear is ${Math.round(l.ear - gx0)} away)`, 16, l.top + l.rows * l.gy + 4, pane.W - 32, { size: 17, weight: 600, color: C.gold, lines: 2 }); }
    // the ear, which lights up when a squeeze arrives
    d.circle(l.ear, cy, 34 + ring * 16, { fill: alpha(C.gold, 0.1 + 0.3 * ring), glow: ring > 0.05 ? C.gold : null });
    d.emoji('👂', l.ear, cy, 44);
    d.text(heard ? `heard: ${heard}` : 'ear', Math.min(l.ear, pane.W - 40), cy + 72, { size: 17, weight: 600, color: heard ? C.gold : C.dim, align: 'center' });
  });
  const anim = animate(ctx, (dt) => {
    const prev = now; now = clock();
    hist.push([now, cone]); while (hist.length > 2 && hist[1][0] < now - 6) hist.shift();
    // the ear and the gold molecule are sampled between frames too, so a slow device misses nothing
    const l = L(view.pane), step = Math.min(1, now - prev), sub = (dist) => [0, 1, 2, 3, 4, 5, 6, 7].map((k) => shiftAt(dist, now - (step * k) / 8));
    const us = sub(l.ear - 90), u = us.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a), 0), gs = sub(l.x0 + 2 * l.gx - 90);
    gs.forEach((x) => { goldMin = Math.min(goldMin, x); goldMax = Math.max(goldMax, x); });
    if (Math.abs(u) > 6 && !wasOut && now - lastHit > 0.25) { heard++; lastHit = now; ring = 1; sfx.tick(); t.pick('heard').state(`heard${heard}`).check(); }
    wasOut = Math.abs(u) > 6; ring = Math.max(0, ring - (dt === Infinity ? 1 : dt) * 2);
    if (!grab) { cone *= Math.exp(-10 * (now - prev)); hist.push([now, cone]); } // the cone springs back when let go, at the same pace on any device
    if (Math.abs(cone) > 0.5) lastMove = now;
    view.redraw();
    return grab || now - lastMove < 5 || ring > 0; // runs until the last squeeze has crossed the air
  });
  view.pane.drag((x, y, phase) => {
    if (phase === 'down') { grab = x < 140; if (grab) { anim.kick(); t.pick('push').check(); } }
    else if (phase === 'move' && grab) { cone = clamp(x - 84, -MAXP, MAXP); hist.push([clock(), cone]); }
    else if (phase === 'up') { grab = false; anim.kick(); }
  });
  view.pane.cv.style.cursor = 'grab';
  view.pane.hint(() => [84, L(view.pane).top + ((L(view.pane).rows - 1) * L(view.pane).gy) / 2]);
  // for the screenshots (scripts/readyshots.mjs): do a task by pushing the cone
  const pulse = () => { grab = true; cone = MAXP; hist.push([clock(), cone]); anim.kick(); t.pick('push').check(); setTimeout(() => { grab = false; hist.push([clock(), cone]); }, 160); };
  ctx.stage.__ready = { t, custom: (verb) => { pulse(); if (verb === 'try') [700, 1400].forEach((ms) => setTimeout(pulse, ms)); } };
}

export default { push };
