// Port Octave, mini-game "Find the note": a note name is called, the learner taps it on the neck
// before the clock runs out. Easy: the A string and letter names; harder: the low E and D strings
// too, sharps, and less time. Practises the Twelve-Hour Tower (one fret, one half step).
import { stage } from '../../../engine/src/lab/kit.js';
import { TUNING, hz, nameOf, isLetter, neckGeom, drawNeck, dot } from '../labs/lib/music.js';

export default {
  mount(g) {
    let target = null, strings = [1], shown = null, lock = false;
    const geo = (pane) => (pane.upright ? neckGeom({ x: 26, y: 150, w: pane.W - 34, h: strings.length > 1 ? 160 : 0 }, { strings, frets: 12, open: 40 }) : neckGeom({ x: 50, y: 150, w: 700, h: strings.length > 1 ? 160 : 0 }, { strings, frets: 12, open: 44 }));
    const view = stage(g, { wide: [800, 380], tall: [480, 420] }, (d, pane) => {
      d.clear();
      const G = geo(pane);
      drawNeck(d, G);
      if (target != null) d.text(`Find ${nameOf(target)}`, pane.W / 2, 60, { size: 34, weight: 700, color: '#ffcf5a', align: 'center' });
      if (strings.length > 1) d.text('on any of these strings', pane.W / 2, 92, { size: 17, color: '#b0b8c9', align: 'center' });
      if (shown) dot(d, G, shown.s, shown.k, { fill: shown.ok ? '#7ddc8a' : '#ff7a6b', text: nameOf(TUNING[shown.s] + shown.k), r: 16 });
    });
    view.pane.drag((x, y, ph) => {
      if (ph !== 'down' || lock || target == null) return;
      const hit = geo(view.pane).at(x, y); if (!hit) return;
      const ok = ((hit.m - target) % 12 + 12) % 12 === 0;
      shown = { s: hit.s, k: hit.k, ok }; lock = true; view.redraw();
      g.sound.pluck(hz(hit.m), { dur: 1.2 });
      clock?.stop();
      g.answer(ok, { said: `${nameOf(hit.m)} at fret ${hit.k}` });
    });
    let clock = null;
    g.onRound((n, level) => {
      strings = level < 0.35 ? [1] : level < 0.7 ? [1, 0] : [2, 1, 0];
      const pool = [];
      for (let p = 0; p < 12; p++) if (level >= 0.5 || isLetter(p)) pool.push(p);
      let p; do { p = g.pick(pool); } while (p === target % 12 && pool.length > 1);
      target = 48 + p; shown = null; lock = false; view.redraw();
      clock = g.timer(Math.round(10 - 6 * level), () => { lock = true; g.answer(false, { said: 'too late' }); });
    });
  },
};
