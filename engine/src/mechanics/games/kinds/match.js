// `match-fast`: a board of pairs against the clock. Tap a left item, then its partner. A round is a
// board: right when finished in time with at most one slip; the points count the pairs.
import { h } from '../../../lab/shell.js';
import { matchBoard } from '../gen.js';
import { itemView } from './items.js';
import { uiSound } from '../../../systems/sound/index.js';

export default function matchFast(g) {
  const d = g.data;
  let b = null, sel = null, done = 0, slips = 0, over = false;
  const L = h('div', { style: 'display:flex;flex-direction:column;gap:8px;flex:1' }), R = h('div', { style: 'display:flex;flex-direction:column;gap:8px;flex:1' });
  g.stage.append(h('div', { style: 'display:flex;gap:14px;width:100%' }, L, R));
  const cell = (it, side) => {
    const el = h('button', { type: 'button', class: 'gm-pick', style: 'min-height:64px;max-width:none;flex:none;flex-direction:row;gap:10px;padding:8px 10px' }, ...itemView(it, it.k, g).map((x) => { if (x.classList?.contains('gm-sw')) { x.style.width = '44px'; x.style.height = '44px'; } if (x.classList?.contains('gm-txt')) x.style.fontSize = '18px'; return x; }));
    el.onclick = () => tap(it, side, el);
    return el;
  };
  function tap(it, side, el) {
    if (over || el.disabled) return;
    if (it.sound) g.sound.play(it.sound);
    if (side === 'L') { [...L.children].forEach((c) => c.classList.remove('yes')); sel = { it, el }; el.classList.add('yes'); return; }
    if (!sel) { el.classList.add('gm-shake'); setTimeout(() => el.classList.remove('gm-shake'), 330); return; }
    if (sel.it.k === it.k) {
      sel.el.disabled = true; el.disabled = true; sel.el.classList.remove('yes'); sel.el.classList.add('dim'); el.classList.add('dim');
      uiSound('snap');
      sel = null; done += 1;
      if (done === b.left.length) { over = true; g.answer(slips <= 1, { weight: b.left.length / 2, truth: null }); }
    } else {
      slips += 1; el.classList.add('no', 'gm-shake'); setTimeout(() => el.classList.remove('no', 'gm-shake'), 400);
      uiSound('wrong');
      if (tm) { const left = tm.left() - 1; if (left <= 0) { over = true; g.answer(false, { timeUp: true }); } else restart(left); }
    }
  }
  let tm = null;
  const restart = (secs) => { tm = g.timer(secs, () => { if (!over) { over = true; g.answer(false, { timeUp: true, weight: done / Math.max(1, b.left.length) }); } }); };
  g.onRound((n, level) => {
    b = matchBoard(d, level, g.rng); sel = null; done = 0; slips = 0; over = false;
    g.ask(g.t(d.ask));
    L.innerHTML = ''; R.innerHTML = '';
    b.left.forEach((it) => L.append(cell(it, 'L')));
    b.right.forEach((it) => R.append(cell(it, 'R')));
    restart(b.time);
  });
}
