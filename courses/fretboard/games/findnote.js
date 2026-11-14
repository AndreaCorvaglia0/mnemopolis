// Port Octave, mini-game "Find the note": a note name is called, the learner taps it on the neck
// before the clock runs out. Easy: the A string and letter names; harder: the low E and D strings
// too, sharps, and less time. Practises the Twelve-Hour Tower (one fret, one half step).
import { stage, h } from '../../../engine/src/lab/kit.js';
import { TUNING, hz, nameOf, isLetter, neckGeom, drawNeck, dot } from '../labs/lib/music.js';

export default {
  mount(g) {
    let target = null, strings = [1], shown = null, lock = false;
    const geo = (pane) => (pane.upright ? neckGeom({ x: 26, y: 150, w: pane.W - 34, h: strings.length > 1 ? 160 : 0 }, { strings, frets: 12, open: 40 }) : neckGeom({ x: 50, y: 150, w: 700, h: strings.length > 1 ? 160 : 0 }, { strings, frets: 12, open: 44 }));
    // the frame's stage is a column with no height of its own: the neck gets a box of its own
    const box = h('div', { style: 'align-self:stretch;width:100%;height:min(48vh,380px);position:relative;display:flex' });
    g.stage.append(box);
    const view = stage({ stage: box, alive: g.alive, onCleanup: g.onCleanup }, { wide: [800, 380], tall: [480, 420] }, (d, pane) => {
      d.clear();
      const G = geo(pane);
      drawNeck(d, G);
      if (shown) dot(d, G, shown.s, shown.k, { fill: shown.ok ? '#7ddc8a' : '#ff7a6b', text: nameOf(TUNING[shown.s] + shown.k), r: 16 });
    });
    // the lab's styles are not on this screen: the picture fills its box by itself
    view.pane.el.style.cssText = 'flex:1;display:flex;flex-direction:column;min-width:0';
    view.pane.cv.parentElement.style.cssText = 'flex:1;position:relative;min-height:0';
    view.pane.cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
    requestAnimationFrame(() => dispatchEvent(new Event('resize')));
    const tapAt = (x, y) => {
      if (lock || target == null) return;
      const hit = geo(view.pane).at(x, y); if (!hit) return;
      const ok = ((hit.m - target) % 12 + 12) % 12 === 0;
      shown = { s: hit.s, k: hit.k, ok }; lock = true; view.redraw();
      g.sound.pluck(hz(hit.m), { dur: 1.2 });
      clock?.stop();
      g.answer(ok, { said: `${nameOf(hit.m)} at fret ${hit.k}` });
    };
    view.pane.drag((x, y, ph) => { if (ph === 'down') tapAt(x, y); });
    // for the pictures (scripts/worldshots.mjs): tap the right fret of the lowest string shown, or the one after it
    g.bot = (right = true) => { const s0 = strings[strings.length - 1], k = ((target - TUNING[s0]) % 12 + 12) % 12 + (right ? 0 : 1); tapAt(...geo(view.pane).pos(s0, k)); };
    let clock = null;
    g.onRound((n, level) => {
      strings = level < 0.35 ? [1] : level < 0.7 ? [1, 0] : [2, 1, 0];
      const pool = [];
      for (let p = 0; p < 12; p++) if (level >= 0.5 || isLetter(p)) pool.push(p);
      let p; do { p = g.pick(pool); } while (p === target % 12 && pool.length > 1);
      target = 48 + p; shown = null; lock = false; view.redraw();
      g.ask?.(`Find ${nameOf(target)}${strings.length > 1 ? ' on any of these strings' : ' on the A string'}`);
      clock = g.timer(Math.round(10 - 6 * level), () => { lock = true; g.answer(false, { said: 'too late' }); });
    });
  },
};
