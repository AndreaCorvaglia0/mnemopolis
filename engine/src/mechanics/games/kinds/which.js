// `which`: pick the item with the largest (or smallest) value. Sounds play one after another.
import { h } from '../../../lab/shell.js';
import { whichRound } from '../gen.js';
import { itemView, itemName, playInTurn } from './items.js';

export default function which(g) {
  const d = g.data;
  let r = null, cards = [], locked = false, playing = false;
  const row = h('div', { class: 'gm-row' }), again = h('button', { type: 'button', class: 'gm-btn' }, g.words('playAgain'));
  g.stage.append(row, again);
  const sounds = () => r && r.items.some((it) => it.sound);
  const listen = async () => { if (!sounds() || playing) return; playing = true; again.disabled = true; await playInTurn(g, r.items, cards); playing = false; again.disabled = false; };
  again.onclick = listen;
  const choose = (i) => {
    if (!r || locked) return;
    g.sound.stopAll();
    const right = i === r.answer;
    cards.forEach((c, j) => c.classList.add(j === r.answer ? 'yes' : j === i ? 'no' : 'dim'));
    r = { ...r, done: true }; locked = true;
    g.answer(right, { truth: itemName(r.items[r.answer], r.answer, g) });
  };
  g.onKey((e) => { const k = Number(e.key); if (k >= 1 && k <= cards.length) { choose(k - 1); return true; } if (e.key === ' ') { listen(); return true; } return false; });
  g.onRound((n, level) => {
    r = whichRound(d, level, g.rng);
    g.ask(g.t(d.ask));
    row.innerHTML = '';
    cards = r.items.map((it, i) => {
      const b = h('button', { type: 'button', class: 'gm-pick', 'aria-label': `${i + 1}: ${itemName(it, i, g)}` }, h('span', { class: 'k' }, String(i + 1)), ...itemView(it, i, g));
      b.onclick = () => choose(i);
      row.append(b); return b;
    });
    again.hidden = !sounds();
    locked = false;
    if (sounds()) listen();
  });
}
