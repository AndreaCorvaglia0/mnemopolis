// How an item looks in a game: text, a colour swatch, a shape, or a sound with a play button.
import { h } from '../../../lab/shell.js';
import { nameOf } from '../gen.js';

const SHAPES = {
  circle: (s) => `<circle cx="50" cy="50" r="${46 * s}"/>`,
  square: (s) => `<rect x="${50 - 44 * s}" y="${50 - 44 * s}" width="${88 * s}" height="${88 * s}" rx="4"/>`,
  triangle: (s) => `<polygon points="50,${50 - 46 * s} ${50 + 46 * s},${50 + 40 * s} ${50 - 46 * s},${50 + 40 * s}"/>`,
  star: (s) => { const p = []; for (let i = 0; i < 10; i++) { const r = (i % 2 ? 20 : 46) * s, a = (Math.PI / 5) * i - Math.PI / 2; p.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`); } return `<polygon points="${p.join(' ')}"/>`; },
};
// the content of an item (inside a button or a card)
export function itemView(it, i, g, { label = true } = {}) {
  const kids = [];
  if (it.colour) kids.push(h('div', { class: 'gm-sw', style: `background:${it.colour}` }));
  if (it.shape) kids.push(h('div', { html: `<svg viewBox="0 0 100 100" width="96" height="96" fill="${it.colour || '#e8d8a8'}" stroke="#0b0910" stroke-width="2">${(SHAPES[it.shape] || SHAPES.circle)(it.size ?? 0.7)}</svg>` }));
  if (it.sound) kids.push(h('div', { class: 'gm-snd' }, h('span', { 'aria-hidden': 'true' }, '♪'), h('span', { class: 'n' }, it.label || String(i + 1))));
  if (it.text && !it.sound) kids.push(h('div', { class: 'gm-txt' }, it.text));
  else if (label && it.label && !it.sound && (it.colour || it.shape)) kids.push(h('div', { class: 'gm-txt', style: 'font-size:17px;font-weight:500' }, it.label));
  return kids;
}
export const itemName = (it, i, g) => nameOf(it, i, g.lang);
// play the sounds of items one after another, lighting each card; resolves when done
export async function playInTurn(g, items, cards, gap = 0.25) {
  for (let i = 0; i < items.length; i++) {
    if (!g.alive()) return;
    const it = items[i]; if (!it.sound) continue;
    cards[i]?.querySelector('.gm-snd')?.classList.add('on');
    g.sound.play(it.sound);
    const d = (it.sound.dur ?? 0.9) + (it.sound.arp || 0) * 3;
    await new Promise((r) => setTimeout(r, (d + gap) * 1000));
    cards[i]?.querySelector('.gm-snd')?.classList.remove('on');
  }
}
