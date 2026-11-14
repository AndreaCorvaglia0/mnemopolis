// `sort-fast`: one card at a time into one of two or three bins, before its time runs out.
import { h } from '../../../lab/shell.js';
import { sortCard } from '../gen.js';
import { itemView, itemName } from './items.js';

export default function sortFast(g) {
  const d = g.data;
  let r = null, last = null, locked = false;
  const card = h('div', { class: 'gm-pick', style: 'cursor:default;max-width:260px;min-height:150px;flex:none;width:220px' });
  const bins = h('div', { class: 'gm-row' });
  const btns = d.bins.map((b, i) => { const el = h('button', { type: 'button', class: 'gm-btn big', style: 'flex:1;max-width:200px' }, `${['←', d.bins.length === 3 ? '↓' : '→', '→'][i] || ''} ${g.t(b)}`.trim()); el.onclick = () => choose(i); bins.append(el); return el; });
  g.stage.append(card, bins);
  const choose = (i) => {
    if (!r || locked) return;
    locked = true;
    const right = i === r.answer;
    btns.forEach((b, j) => { b.style.borderColor = j === r.answer ? '#4fd1c5' : j === i ? '#b98a8a' : ''; });
    card.style.transform = `translateX(${(i - (d.bins.length - 1) / 2) * 80}px) scale(.9)`;
    g.answer(right, { truth: g.t(d.bins[r.answer]) });
  };
  g.onKey((e) => {
    const map = d.bins.length === 3 ? { ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2 } : { ArrowLeft: 0, ArrowRight: 1 };
    const k = e.key in map ? map[e.key] : Number(e.key) - 1;
    if (k >= 0 && k < d.bins.length) { choose(k); return true; }
    return false;
  });
  g.onRound((n, level) => {
    r = sortCard(d, level, g.rng, last); last = r.card.i;
    g.ask(g.t(d.ask));
    btns.forEach((b) => { b.style.borderColor = ''; });
    card.style.transition = 'none'; card.style.transform = '';
    card.innerHTML = ''; card.append(...itemView(r.card, 0, g));
    void card.offsetWidth; card.style.transition = 'transform .25s';
    if (r.card.sound) g.sound.play(r.card.sound);
    locked = false;
    g.timer(r.time, () => { if (!locked) { locked = true; g.answer(false, { truth: g.t(d.bins[r.answer]), timeUp: true }); } });
  });
}
