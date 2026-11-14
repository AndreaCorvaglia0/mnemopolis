// The Bluesman's House: the minor pentatonic box is movable; the root under the first finger on the
// low E string names the key.
import { stage, button, tasks, animate, spring, C, alpha } from '../../../engine/src/lab/kit.js';
import { TUNING, hz, nameOf, neckGeom, drawNeck, dot } from './lib/music.js';
import { sound, soundNote } from './lib/sound.js';

// the root-position box (Premier Guitar, Cram Session): frets above the root fret, per string, low E first
const BOX = [[0, 3], [0, 2], [0, 2], [0, 2], [0, 3], [0, 3]];
const DEGREE = { 0: '1', 3: '♭3', 5: '4', 7: '5', 10: '♭7' };

async function box(ctx) {
  const t = tasks(ctx, [{ select: 'A' }, { select: 'E' }]), s = sound(ctx);
  let r = 5, lit = -1; const pos = spring(5, 10);
  const geo = (pane) => (pane.upright ? neckGeom({ x: 22, y: 150, w: pane.W - 30, h: 230 }, { frets: 15, open: 34 }) : neckGeom({ x: 36, y: 120, w: 760, h: 230 }, { frets: 15, open: 40 }));
  const notes = (root) => { const out = []; BOX.forEach((fs, st) => fs.forEach((o) => { const k = root + o, m = TUNING[st] + k; out.push({ st, k, m }); })); return out; };
  const play = () => {
    s.stopAll(); const ns = notes(r).sort((a, b) => a.m - b.m);
    s.pluck(hz(TUNING[0] + (r % 12)), { dur: 5.5, gain: 0.35, pos: 0.5, bright: 0 }); // the drone: the root on the low E string
    ns.forEach((n, i) => { s.pluck(hz(n.m), { dur: 1.1, gain: 0.45, at: 0.4 + i * 0.27 }); setTimeout(() => { if (ctx.alive()) { lit = i; view.redraw(); } }, 400 + i * 270); });
    setTimeout(() => { if (ctx.alive()) { lit = -1; view.redraw(); } }, 400 + ns.length * 270 + 300);
    if (r === 5) t.pick('A'); if (r === 0 || r === 12) t.pick('E'); t.check();
  };
  const move = (k) => { r = Math.max(0, Math.min(12, k)); pos.to(r); anim.kick(); view.redraw(); };
  const view = stage(ctx, { wide: [820, 480], tall: [480, 640] }, (d, pane) => {
    const G = geo(pane), root = TUNING[0] + r; d.clear();
    const { y1 } = drawNeck(d, G);
    // the box's outline, sliding with the root
    const pv = pos.v, xa = pv <= 0 ? G.x0 - 34 : G.fx(Math.floor(pv) - 1) + (G.fx(Math.floor(pv)) - G.fx(Math.floor(pv) - 1)) * (pv % 1), xb = G.fx(Math.min(15, Math.round(pv) + 3));
    d.box(xa - 4, G.top - 26, xb - xa + 8, G.bottom - G.top + 52, { fill: alpha(C.gold, 0.08), stroke: alpha(C.gold, 0.6), width: 2, r: 12 });
    const ns = notes(r), order = [...ns].sort((a, b) => a.m - b.m);
    ns.forEach((n) => { const deg = DEGREE[(((n.m - root) % 12) + 12) % 12], isRoot = deg === '1', on = lit >= 0 && order[lit] === n; dot(d, G, n.st, n.k, { fill: on ? C.gold : isRoot ? C.bad : C.acc, text: deg, color: '#04201d', r: 15, ring: on ? C.gold : null }); });
    const names = [0, 3, 5, 7, 10].map((x) => nameOf(root + x, [5, 10, 3, 8, 1].includes((root + 3) % 12)));
    d.text(`${nameOf(root)} minor pentatonic`, 24, 44, { size: pane.upright ? 24 : 28, weight: 700, color: C.gold });
    d.text(`root on the low E string at fret ${r}${r === 0 ? ' (open)' : ''}:  ${names.join('  ')}`, 24, 76, { size: 18, color: C.muted, max: pane.W - 48 });
    d.text('drag the box along the neck', 24, y1 + 54, { size: 16, color: C.dim });
  });
  const anim = animate(ctx, (dt) => { const more = pos.step(dt); view.redraw(); return more; });
  let grab = null;
  view.pane.drag((x, y, ph) => {
    const G = geo(view.pane);
    if (ph === 'down') { const hit = G.at(x, y, 1.2); grab = hit ? hit.k - r : null; if (grab != null && (grab < -1 || grab > 4)) { move(hit.s === 0 ? hit.k : r); grab = null; } }
    else if (ph === 'move' && grab != null) { const hit = G.at(x, G.sy(2), 9); if (hit) { const nk = Math.max(0, Math.min(12, hit.k - grab)); if (nk !== r) move(nk); } }
    else if (ph === 'up') grab = null;
  });
  button(ctx, 'Play the box', play, { primary: true });
  ctx.hint((i) => geo(view.pane).pos(0, i === 0 ? 5 : 12));
  Object.defineProperty(view.pane, 'items', { get: () => { const G = geo(view.pane); return Array.from({ length: 16 }, (_, k) => { const [x, y] = G.pos(0, k); return { c: `low${k}`, x, y }; }); }, configurable: true });
  soundNote(ctx);
  ctx.stage.__ready = { t, pane: view.pane, custom: (verb, a) => { move(a === 'A' ? 5 : 12); pos.set(r); play(); } };
}

export default { box };
