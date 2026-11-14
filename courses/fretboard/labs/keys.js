// The Hall of Keys: thirds stacked from a major scale give the key's chords; the scale decides
// which are major and which minor.
import { stage, sliders, button, tasks, animate, spring, C, alpha } from '../../../engine/src/lab/kit.js';
import { hz, pc, MAJOR, keyNames } from './lib/music.js';
import { sound, soundNote } from './lib/sound.js';

const NUM = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const QUAL = (third, fifth) => (third === 4 ? 'major' : fifth === 6 ? 'diminished' : 'minor');

async function family(ctx) {
  const t = tasks(ctx, [{ select: 'all7' }, { select: 'prog' }]), s = sound(ctx);
  let key = 0, built = new Set(), playingCol = -1; const pop = Array.from({ length: 7 }, () => spring(0, 9));
  const chordOf = (j) => { const deg = [j, j + 2, j + 4].map((x) => [x % 7, Math.floor(x / 7)]); const ms = deg.map(([i, o]) => 48 + key + MAJOR[i] + 12 * o); return { ms, third: ms[1] - ms[0], fifth: ms[2] - ms[0], names: deg.map(([i]) => keyNames(key)[i]) }; };
  const strum = (j, at = 0) => { const c = chordOf(j); c.ms.concat(c.ms[0] + 12).forEach((m, i) => s.pluck(hz(m), { dur: 1.8, gain: 0.3, at: at + i * 0.04 })); };
  const build = (j) => { built.add(j); pop[j].set(0.4); pop[j].to(1); anim.kick(); strum(j); if (built.size === 7) t.pick('all7'); t.check(); view.redraw(); };
  const ctl = sliders(ctx, [{ id: 'key', label: 'Key', options: [[0, 'C major'], [7, 'G major']], value: 0 }], (id, v) => { key = v; view.redraw(); });
  const prog = () => {
    s.stopAll(); [0, 4, 5, 3].forEach((j, n) => { strum(j, n * 0.9); setTimeout(() => { if (ctx.alive()) { playingCol = j; view.redraw(); } }, n * 900); });
    setTimeout(() => { if (ctx.alive()) { playingCol = -1; view.redraw(); } }, 3800);
    if (key === 7) t.pick('prog'); t.check();
  };
  button(ctx, 'Play I – V – vi – IV', prog, { primary: true });
  const cols = (pane) => { const up = pane.upright, x0 = 20, w = (pane.W - 40) / 7; return Array.from({ length: 7 }, (_, j) => ({ j, x: x0 + j * w, w, y: up ? 120 : 110, h: up ? 400 : 290 })); };
  const view = stage(ctx, { wide: [820, 480], tall: [480, 640] }, (d, pane) => {
    const up = pane.upright, names = keyNames(key); d.clear();
    d.text(`${names[0]} major: ${names.join(' ')}`, 20, 40, { size: up ? 22 : 26, weight: 700, color: C.gold });
    d.text('tap a column to stack a chord from the scale', 20, 70, { size: 17, color: C.muted });
    for (const c of cols(pane)) {
      const ch = chordOf(c.j), q = QUAL(ch.third, ch.fifth), isB = built.has(c.j), col = q === 'major' ? C.acc : q === 'minor' ? C.purple : C.bad, on = playingCol === c.j;
      d.box(c.x + 3, c.y, c.w - 6, c.h, { fill: on ? alpha(C.gold, 0.25) : C.card, stroke: isB ? col : C.line, width: isB ? 3 : 1.5, r: 10 });
      d.text(names[c.j], c.x + c.w / 2, c.y + 34, { size: 22, weight: 700, color: C.text, align: 'center' });
      if (isB) {
        const k = pop[c.j].v, base = c.y + c.h - 40;
        ch.names.forEach((n, i) => { const yy = base - i * (up ? 62 : 48) * k; d.circle(c.x + c.w / 2, yy, Math.min(20, c.w * 0.34), { fill: i === 0 ? col : alpha(col, 0.75) }); d.text(n, c.x + c.w / 2, yy + 6, { size: 16, weight: 700, color: '#04201d', align: 'center' }); });
        d.text(`${ch.third}+${ch.fifth - ch.third}`, c.x + c.w / 2, c.y + 64, { size: 16, color: C.muted, align: 'center' });
        d.text(NUM[c.j], c.x + c.w / 2, c.y + c.h + 26, { size: 19, weight: 700, color: col, align: 'center' });
        d.text(q === 'major' ? 'maj' : q === 'minor' ? 'min' : 'dim', c.x + c.w / 2, c.y + c.h + 48, { size: 16, color: col, align: 'center' });
      } else d.text('?', c.x + c.w / 2, c.y + c.h / 2, { size: 30, color: C.dim, align: 'center' });
    }
  });
  const anim = animate(ctx, (dt) => { const more = pop.map((p) => p.step(dt)).some(Boolean); view.redraw(); return more; });
  view.pane.drag((x, y, ph) => { if (ph !== 'down') return; const c = cols(view.pane).find((q) => x >= q.x && x <= q.x + q.w && y >= q.y - 10 && y <= q.y + q.h + 50); if (c) build(c.j); });
  ctx.hint((i) => { if (i === 1) return ctl.el.key; const c = cols(view.pane).find((q) => !built.has(q.j)); return c ? [c.x + c.w / 2, c.y + c.h / 2] : null; });
  Object.defineProperty(view.pane, 'items', { get: () => cols(view.pane).map((c) => ({ c: `col${c.j}`, x: c.x + c.w / 2, y: c.y + c.h / 2 })), configurable: true });
  soundNote(ctx);
  ctx.stage.__ready = { t, el: ctl.el, pane: view.pane, custom: (verb, a) => { if (a === 'all7') for (let j = 0; j < 7; j++) build(j); if (a === 'prog') { ctl.set('key', 7); key = 7; prog(); } } };
}

export default { family };
