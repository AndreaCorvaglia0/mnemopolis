// `estimate`: place a value on a line (log or wrapped), confirm; right within the tolerance.
import { h } from '../../../lab/shell.js';
import { estimateRound, judgeEstimate, toPos, fromPos } from '../gen.js';
import { itemView } from './items.js';

const fmt = (v, sc) => `${v >= 100 ? Math.round(v) : Math.round(v * 10) / 10}${sc.unit ? ` ${sc.unit}` : ''}`;
export default function estimate(g) {
  const d = g.data, sc = d.scale;
  let r = null, pos = 0.5, locked = false;
  const show = h('div', { class: 'gm-pick', style: 'cursor:default;flex:none;width:200px;min-height:110px' });
  const again = h('button', { type: 'button', class: 'gm-btn' }, g.words('playAgain'));
  const track = h('div', { style: `position:relative;width:100%;height:64px;border-radius:12px;border:1px solid #4a4258;touch-action:none;cursor:pointer;background:${sc.paint === 'hue' ? 'linear-gradient(90deg,hsl(0 85% 52%),hsl(60 85% 52%),hsl(120 85% 52%),hsl(180 85% 52%),hsl(240 85% 52%),hsl(300 85% 52%),hsl(360 85% 52%))' : 'linear-gradient(#211b2c,#17131f)'}` });
  const marks = h('div', { style: 'position:relative;width:100%;height:26px;font-size:14px;color:#a9a2b8' });
  const knob = h('div', { style: 'position:absolute;top:-6px;width:6px;height:76px;margin-left:-3px;background:#ffcf5a;border-radius:3px;box-shadow:0 0 0 2px #0b0910' });
  const truth = h('div', { hidden: '', style: 'position:absolute;top:-6px;width:4px;height:76px;margin-left:-2px;background:#4fd1c5;border-radius:2px' });
  const band = h('div', { hidden: '', style: 'position:absolute;top:0;height:100%;background:rgba(79,209,197,.22);border-radius:8px' });
  const read = h('div', { class: 'gm-txt', style: 'font-variant-numeric:tabular-nums' });
  const ok = h('button', { type: 'button', class: 'gm-btn big primary' }, g.words('confirm'));
  track.append(band, truth, knob);
  for (const m of sc.marks || []) marks.append(h('span', { style: `position:absolute;left:${toPos(sc, m) * 100}%;transform:translateX(-50%);white-space:nowrap` }, fmt(m, sc).replace(` ${sc.unit || ''}`, '')));
  g.stage.append(show, again, h('div', { style: 'width:100%;padding:0 12px' }, track, marks), read, ok);
  const place = () => { knob.style.left = `${pos * 100}%`; read.textContent = fmt(fromPos(sc, pos), sc); };
  const at = (e) => { const b = track.getBoundingClientRect(); pos = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)); place(); };
  let drag = false;
  track.addEventListener('pointerdown', (e) => { if (locked) return; drag = true; try { track.setPointerCapture(e.pointerId); } catch { /* synthetic */ } at(e); });
  track.addEventListener('pointermove', (e) => { if (drag && !locked) at(e); });
  track.addEventListener('pointerup', () => { drag = false; });
  const listen = () => { if (r?.item.sound) g.sound.play(r.item.sound); };
  again.onclick = listen;
  const confirm = () => {
    if (!r || locked) return;
    locked = true;
    const guess = fromPos(sc, pos), j = judgeEstimate(sc, guess, r.value, r.tolerance);
    truth.hidden = false; truth.style.left = `${toPos(sc, r.value) * 100}%`;
    g.answer(j.right, { truth: fmt(r.value, sc), weight: j.right ? 0.6 + 0.6 * j.quality : 1 });
  };
  ok.onclick = confirm;
  g.onKey((e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { if (!locked) { pos = Math.max(0, Math.min(1, pos + (e.key === 'ArrowLeft' ? -0.01 : 0.01))); place(); } return true; } if (e.key === 'Enter') { confirm(); return true; } if (e.key === ' ') { listen(); return true; } return false; });
  g.onRound((n, level) => {
    r = estimateRound(d, level, g.rng);
    g.ask(g.t(d.ask).replace('{value}', r.item.text || ''));
    show.innerHTML = ''; show.append(...itemView({ ...r.item, label: r.item.sound ? '?' : r.item.label }, 0, g, { label: false }));
    again.hidden = !r.item.sound;
    truth.hidden = true; band.hidden = true; pos = 0.5; place(); locked = false;
    listen();
  });
}
