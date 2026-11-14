// A custom mini-game (references/10-games.md, "custom"): two sound levels in decibels; how many
// times as intense is the louder one? Every 10 dB is ten times the intensity (the Loudness house).
import { h } from '../../../engine/src/lab/kit.js';

export default {
  mount(g) {
    const show = h('div', { class: 'gm-txt', style: 'font-size:26px' });
    const row = h('div', { class: 'gm-row' });
    g.stage.append(show, row);
    const names = (n) => (n === 1 ? g.t({ en: 'the same', it: 'uguale' }) : `${n.toLocaleString(g.lang)}×`);
    g.onRound((n, level) => {
      // harder rounds: bigger steps (up to 40 dB apart)
      const steps = 1 + Math.floor(g.rng() * (1 + Math.round(level * 3))), a = 30 + 10 * Math.floor(g.rng() * 5), b = a + 10 * steps;
      const right = 10 ** steps, wrong = g.shuffle([2 * steps, 10 * steps, 10 ** (steps + 1), steps === 1 ? 2 : 10 ** (steps - 1)].filter((x) => x !== right)).slice(0, 2);
      g.ask(g.t(g.data.ask));
      show.textContent = `${a} dB → ${b} dB`;
      row.innerHTML = '';
      g.shuffle([right, ...wrong]).forEach((x, i) => {
        const b2 = h('button', { type: 'button', class: 'gm-pick', style: 'min-height:84px' }, h('span', { class: 'k' }, String(i + 1)), h('div', { class: 'gm-txt' }, names(x)));
        b2.onclick = () => { b2.classList.add(x === right ? 'yes' : 'no'); g.answer(x === right, { truth: names(right) }); };
        row.append(b2);
      });
    });
    g.onKey((e) => { const k = Number(e.key); const b2 = row.children[k - 1]; if (b2) { b2.click(); return true; } return false; });
  },
};
