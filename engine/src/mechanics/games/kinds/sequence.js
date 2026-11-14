// `sequence`: pads light up (and sound) in a sequence; repeat it. Its length follows the staircase.
import { h } from '../../../lab/shell.js';
import { sequenceRound } from '../gen.js';
import { itemView } from './items.js';

export default function sequence(g) {
  const d = g.data;
  let r = null, at = 0, listening = false;
  const grid = h('div', { class: 'gm-row', style: 'max-width:440px' });
  const pads = d.pads.map((p, i) => {
    const el = h('button', { type: 'button', class: 'gm-pick', style: `flex:1 1 40%;min-height:96px;max-width:200px;background:${p.colour ? `color-mix(in srgb, ${p.colour} 28%, #17131f)` : '#17131f'}` }, h('span', { class: 'k' }, String(i + 1)), h('div', { class: 'gm-txt', style: 'font-size:18px' }, p.label || p.text || ''));
    el.onclick = () => press(i);
    grid.append(el); return el;
  });
  g.stage.append(grid);
  const flash = async (i, ms = 420) => {
    const p = d.pads[i], el = pads[i];
    el.style.boxShadow = `0 0 0 4px ${p.colour || '#ffcf5a'}, 0 0 24px ${p.colour || '#ffcf5a'}`; el.style.transform = 'scale(1.04)';
    if (p.sound) g.sound.play({ ...p.sound, dur: Math.min(0.6, p.sound.dur ?? 0.5) });
    await new Promise((res) => setTimeout(res, ms));
    el.style.boxShadow = ''; el.style.transform = '';
  };
  async function show() {
    listening = true; g.say(g.words('listen'));
    await new Promise((res) => setTimeout(res, 450));
    for (const i of r.seq) { if (!g.alive()) return; await flash(i); await new Promise((res) => setTimeout(res, 140)); }
    listening = false; at = 0; g.say(g.words('yourTurn'));
  }
  function press(i) {
    if (!r || listening) return;
    flash(i, 220);
    if (i !== r.seq[at]) { listening = true; g.answer(false, { truth: r.seq.map((k) => d.pads[k].label || k + 1).join(' ') }); return; }
    at += 1;
    if (at === r.seq.length) { listening = true; g.answer(true, { weight: 0.6 + r.len / 6, fast: false }); }
  }
  g.bot = async (right = true) => { while (listening && g.alive()) await new Promise((res) => setTimeout(res, 100)); const seq = r.seq.slice(); for (let i = 0; i < seq.length; i++) { press(right || i < seq.length - 1 ? seq[i] : (seq[i] + 1) % pads.length); await new Promise((res) => setTimeout(res, 120)); } };
  g.onKey((e) => { const k = Number(e.key); if (k >= 1 && k <= pads.length) { press(k - 1); return true; } return false; });
  g.onRound(() => { r = sequenceRound(d, g.step(), g.rng); g.ask(g.t(d.ask)); show(); });
}
