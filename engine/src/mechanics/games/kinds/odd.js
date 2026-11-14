// `odd-one-out`: four items, one does not belong.
import { h } from '../../../lab/shell.js';
import { oddRound } from '../gen.js';
import { itemView, itemName, playInTurn } from './items.js';

export default function odd(g) {
  const d = g.data;
  let r = null, cards = [], locked = false, k = 0;
  const row = h('div', { class: 'gm-row' }), again = h('button', { type: 'button', class: 'gm-btn' }, g.words('playAgain'));
  g.stage.append(row, again);
  const sounds = () => r && r.items.some((it) => it.sound);
  let playing = false;
  const listen = async () => { if (!sounds() || playing) return; playing = true; await playInTurn(g, r.items, cards); playing = false; };
  again.onclick = listen;
  const choose = (i) => {
    if (!r || locked) return;
    locked = true;
    cards.forEach((c, j) => c.classList.add(j === r.answer ? 'yes' : j === i ? 'no' : 'dim'));
    g.answer(i === r.answer, { truth: itemName(r.items[r.answer], r.answer, g), why: i === r.answer ? null : r.why });
  };
  g.onKey((e) => { const n = Number(e.key); if (n >= 1 && n <= cards.length) { choose(n - 1); return true; } if (e.key === ' ') { listen(); return true; } return false; });
  g.onRound((n, level) => {
    r = oddRound(d, level, g.rng, k++);
    g.ask(g.t(d.ask));
    row.innerHTML = '';
    cards = r.items.map((it, i) => { const b = h('button', { type: 'button', class: 'gm-pick', style: 'flex-basis:120px;min-height:96px' }, h('span', { class: 'k' }, String(i + 1)), ...itemView(it, i, g)); b.onclick = () => choose(i); row.append(b); return b; });
    again.hidden = !sounds();
    locked = false;
    if (sounds()) listen();
  });
}
