// The Fifths Compass: one step of a fifth changes one note of the key.
//   compass  two dials, half steps and fifths, with the seven notes of a major key lit on both;
//            turn the key one fifth at a time and watch the one note that moves
import { stage, button, tasks, animate, spring, C, alpha } from '../../../engine/src/lab/kit.js';
import { hz, pc, MAJOR, keyNames, dialGeom, drawDial, nameOf } from './lib/music.js';
import { sound, soundNote } from './lib/sound.js';

async function compass(ctx) {
  const t = tasks(ctx, [{ select: 'G' }, { select: 'round' }]), s = sound(ctx);
  let root = 0, steps = 0, changed = null; const glow = spring(0, 3);
  const keySet = (r) => new Set(MAJOR.map((x) => pc(r + x)));
  const turn = (dir) => {
    const before = keySet(root); root = pc(root + 7 * dir); steps += dir;
    const after = keySet(root); changed = { from: [...before].find((p) => !after.has(p)), to: [...after].find((p) => !before.has(p)) };
    glow.set(1); glow.to(0); anim.kick();
    MAJOR.forEach((x, i) => s.pluck(hz(48 + root + x), { dur: 0.9, gain: 0.35, at: i * 0.11 }));
    if (root === 7 && steps === 1) t.pick('G');
    if (root === 0 && Math.abs(steps) >= 12) t.pick('round');
    t.check(); view.redraw();
  };
  const geo = (pane) => (pane.upright ? { A: dialGeom(pane.W / 2, 200, 104), B: dialGeom(pane.W / 2, 470, 104, { order: 7 }) } : { A: dialGeom(205, 255, 120), B: dialGeom(615, 255, 120, { order: 7 }) });
  const view = stage(ctx, { wide: [820, 480], tall: [480, 640] }, (d, pane) => {
    const { A, B } = geo(pane), ks = keySet(root), names = keyNames(root); d.clear();
    const label = Array.from({ length: 12 }, (_, p) => { const k = MAJOR.findIndex((x) => pc(root + x) === p); return k >= 0 ? names[k] : nameOf(p); });
    for (const [D, title] of [[A, 'by half steps'], [B, 'by fifths']]) {
      drawDial(d, D, { lit: ks, gold: new Set([root]), names: label, small: true });
      // the key's notes joined in dial order: an irregular shape on one, an arc of seven on the other
      const order = [...ks].sort((a, b) => D.idx(a) - D.idx(b)).map((p) => D.at(p, D.r * 0.8));
      d.line([...order, order[0]], { color: alpha(C.acc, 0.6), width: 2 });
      d.text(title, D.cx, D.cy - D.r * 1.18 - 12, { size: 17, color: C.muted, align: 'center' });
      if (changed) { const [x, y] = D.at(changed.to); d.circle(x, y, D.r * (0.2 + 0.1 * glow.v), { stroke: C.gold, width: 4, alpha: 0.7 + 0.3 * glow.v }); }
    }
    const sh = names.filter((n) => n.includes('♯')), fl = names.filter((n) => n.includes('♭'));
    d.text(`${names[0]} major: ${names.join(' ')}`, 24, 40, { size: pane.upright ? 21 : 24, weight: 700, color: C.gold, max: pane.W - 48 });
    const line2 = `${sh.length ? `${sh.length} sharp${sh.length > 1 ? 's' : ''}` : fl.length ? `${fl.length} flat${fl.length > 1 ? 's' : ''}` : 'no sharps or flats'}${changed ? `   ·   changed: ${nameOf(changed.from)} → ${names[MAJOR.findIndex((x) => pc(root + x) === changed.to)] || nameOf(changed.to)}` : ''}   ·   steps: ${steps}`;
    d.text(line2, 24, 68, { size: 17, color: C.muted, max: pane.W - 48 });
  });
  const anim = animate(ctx, (dt) => { const more = glow.step(dt); view.redraw(); return more; });
  view.pane.drag((x, y, ph) => {
    if (ph !== 'down') return; const { B } = geo(view.pane);
    if (Math.hypot(x - B.cx, y - B.cy) < B.r * 1.3) { const p = B.pick(x, y); if (p == null) return; const dist = ((B.idx(p) - B.idx(root)) % 12 + 12) % 12; if (dist === 1) turn(1); else if (dist === 11) turn(-1); }
  });
  button(ctx, 'One fifth up', () => turn(1), { primary: true });
  button(ctx, 'One fifth down', () => turn(-1));
  ctx.hint(() => null);
  soundNote(ctx);
  ctx.stage.__ready = { t, pane: view.pane, custom: (verb, a) => { if (a === 'G') { if (root !== 0 || steps) { root = 0; steps = 0; } turn(1); } if (a === 'round') { while (!(root === 0 && Math.abs(steps) >= 12)) turn(1); } } };
}

export default { compass };
