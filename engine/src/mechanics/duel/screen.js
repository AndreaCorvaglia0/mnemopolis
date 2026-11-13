// The duel screen: an HTML page on top of the game (opened through ui.page, which pauses the game
// and hands over the keyboard). Readable first, funny second.
//   top:    title and "Step back" (Esc), always there, no penalty
//   arena:  the player (left) and the opponent (right), each with a labelled bar; the turn counter
//   say:    what the opponent says (opening, reaction, verdict)
//   card:   the question, the TONE (preselected "State", changeable), the answers. One tap on an
//           answer commits it with the current tone: the fewest taps for the common case.
//   after:  the options shrink to "you said" and "right answer", with the trap and the reason;
//           one button, Next
//   end:    won (badge and key) or lost (what to look at again; Rematch, Not now)
// Keys: 1-4 answer, arrows + Enter, Q W E tone, Enter/Space next, Esc step back.
import { h } from '../../lab/shell.js';
import { sfx } from '../../systems/audio.js';
import { touch } from '../../systems/view.js';
import { Deck } from '../musings/think.js';
import { LANG, fill } from '../config.js';
import { CSS } from './style.js';
import { STOCK, WORDS } from './lines.js';
import { startDuel, answer, settle, nextQuestion, feedback, missedTopics, HIT, COST } from './rules.js';

function style() {
  if (document.getElementById('dl-style')) return;
  document.head.append(h('style', { id: 'dl-style' }, CSS));
}

const KEY_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="20" cy="32" r="13" fill="none" stroke="#ffcf5a" stroke-width="7"/><path d="M32 32h26M50 32v10M42 32v7" stroke="#ffcf5a" stroke-width="7" stroke-linecap="round" fill="none"/></svg>';
const BADGE_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" fill="#3c5ea6" stroke="#fff" stroke-width="4"/><circle cx="32" cy="32" r="20" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/><path d="M32 18l4 9 10 1-7.5 6.5 2.3 9.8L32 39l-8.8 5.3 2.3-9.8L18 28l10-1z" fill="#ffcf5a"/></svg>';
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// A character painter's side frame, scaled up, crisp. flip: face right.
function spriteCanvas(src, flip) {
  const c = h('canvas', { class: 'dl-sprite', width: 16, height: 24, 'aria-hidden': 'true' });
  if (src) {
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    if (flip) { g.translate(16, 0); g.scale(-1, 1); }
    g.drawImage(src, 6 * 16, 0, 16, 24, 0, 0, 16, 24);
  }
  return c;
}

function fighter(side, name, label, max, src) {
  const fill = h('div', { class: 'dl-fill', style: 'width:100%' }), risk = h('div', { class: 'dl-risk', style: 'width:0' }), ticks = h('div', { class: 'dl-ticks' });
  for (let i = 1; i < max; i++) ticks.append(h('i', { style: `left:${(100 * i) / max}%` }));
  const num = h('span', { class: 'dl-num' });
  const bar = h('div', { class: 'dl-bar', role: 'meter', 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': max }, fill, risk, ticks);
  const sprite = spriteCanvas(src, side === 'me');
  const el = h('div', { class: `dl-f ${side}` }, h('div', { class: 'dl-body' }, sprite, h('div', { class: 'dl-who' }, h('div', { class: 'dl-name' }, name), h('div', { class: 'dl-label' }, label, ' ', num))), bar);
  const set = (v) => { fill.style.width = `${(100 * v) / max}%`; num.textContent = `${v}/${max}`; bar.setAttribute('aria-valuenow', v); el.v = v; };
  // the striped part of the bar that the chosen tone puts at stake
  const stake = (n) => { const w = (100 * Math.min(n, el.v)) / max, at = (100 * el.v) / max - w; risk.style.width = `${w}%`; risk.style[side === 'me' ? 'left' : 'right'] = `${at}%`; };
  const pop = (txt, bad) => { el.querySelectorAll('.dl-pop').forEach((o) => o.remove()); const p = h('div', { class: `dl-pop${bad ? ' bad' : ''}` }, txt); el.append(p); setTimeout(() => p.remove(), 1200); };
  const shake = () => { el.classList.remove('dl-shake'); void el.offsetWidth; el.classList.add('dl-shake'); };
  return { el, set, stake, pop, shake, sprite };
}

export function openDuel(cfg) {
  style();
  const W = WORDS[LANG], T = cfg.opponent.lines, deck = new Deck();
  const kindName = cfg.kind === 'league' ? cfg.title : cfg.friendly ? W.friendly : W.duel;
  const close = h('button', { type: 'button', class: 'dl-x', title: 'Esc' }, '✕ ', W.stepBack);
  const root = h('div', { class: 'dl', role: 'dialog', 'aria-label': `${kindName} · ${cfg.opponent.name}` },
    h('div', { class: 'dl-top' }, h('h1', { class: 'dl-title', html: `${kindName} <span>· ${cfg.opponent.name}</span>` }), close));
  let d = startDuel(cfg.bars);
  const me = fighter('me', W.you, W.composure, d.max.composure, cfg.sprite?.('player'));
  const them = fighter('them', cfg.opponent.name, W.conviction, d.max.conviction, cfg.sprite?.(cfg.opponent.look));
  me.set(d.composure); them.set(d.conviction);
  const turnEl = h('b'), vs = h('div', { class: 'dl-vs', 'aria-hidden': 'true' }, h('span', {}, 'VS'), turnEl);
  const say = h('div', { class: 'dl-say', 'aria-live': 'polite' });
  const card = h('div', {});
  const col = h('div', { class: 'dl-col' }, h('div', { class: 'dl-arena' }, me.el, vs, them.el), say, card);
  const scroll = h('div', { class: 'dl-scroll' }, col);
  root.append(scroll);
  document.body.append(root);

  const speak = (line) => { say.innerHTML = ''; say.append(h('b', {}, `${cfg.opponent.name}: `), line); say.classList.remove('in'); void say.offsetWidth; say.classList.add('in'); };
  const asked = [], results = [];
  let tone = 2, q = null, mode = 'q', sel = 0, keys = {}, prize = {};
  root.dataset.mode = 'q';

  return new Promise((resolve) => {
    const finish = (r) => { removeEventListener('keydown', onKey, true); root.remove(); resolve({ prize, ...r, duel: d, asked, results }); };
    close.onclick = () => finish({ left: true, won: d.over ? d.won : null });
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish({ left: true, won: d.over ? d.won : null }); return; }
      const f = keys[e.key] || keys[e.key.toLowerCase()];
      if (f) { e.preventDefault(); e.stopPropagation(); f(); }
    };
    addEventListener('keydown', onKey, true);

    const showTurn = () => {
      q = nextQuestion(cfg.tiers, asked, cfg.pick);
      if (!q) { d = settle(d, 0); return end(); }
      mode = 'q'; root.dataset.mode = 'q';
      root.querySelectorAll('.dl-pop').forEach((o) => o.remove());
      tone = 2; // every turn starts at State: a bolder or a softer tone is a choice made for this question
      const place = cfg.place?.(q.topic);
      const meta = h('div', { class: 'dl-meta' }, h('span', {}, fill(W.turn, { n: d.turn + 1, m: d.turns })), cfg.friendly ? h('span', { class: 'dl-chip' }, W.friendlyChip) : null);
      const tones = h('div', { class: 'dl-tones', role: 'radiogroup', 'aria-label': W.tone });
      const toneBtns = W.tones.map((n, i) => h('button', { type: 'button', class: 'dl-t', role: 'radio', 'aria-pressed': String(i + 1 === tone), 'aria-checked': String(i + 1 === tone), onclick: () => setTone(i + 1) },
        h('span', { class: 'n' }, n, h('span', { class: 'k' }, ` ${'QWE'[i]}`)), h('span', { class: 'e' }, h('span', { class: 'l' }, W.toneHelp[i][0]), ' ', h('span', { class: 'r' }, W.toneHelp[i][1]))));
      tones.append(...toneBtns);
      const setTone = (t, quiet) => {
        tone = t;
        toneBtns.forEach((b, i) => { b.setAttribute('aria-pressed', String(i + 1 === t)); b.setAttribute('aria-checked', String(i + 1 === t)); });
        them.stake(HIT[t]); me.stake(COST[t]);
        if (!quiet) sfx.tick();
      };
      const opts = h('div', { class: 'dl-opts' });
      const btns = q.options.map((o, i) => h('button', { type: 'button', class: 'dl-o', onclick: () => commit(i) }, h('span', { class: 'k' }, String(i + 1)), h('span', {}, o)));
      opts.append(...btns);
      card.replaceChildren(h('div', { class: 'dl-card' }, meta, h('p', { class: 'dl-q' }, q.q),
        h('div', { class: 'dl-tone' }, h('p', { class: 'dl-tone-h' }, W.toneHint), tones), opts,
        h('p', { class: 'dl-help' }, touch.on ? W.pick : W.pickKeys)));
      setTone(tone, true);
      sel = 0;
      const focus = (i) => { sel = (i + btns.length) % btns.length; btns[sel].focus(); };
      keys = { q: () => setTone(1), w: () => setTone(2), e: () => setTone(3), ArrowDown: () => focus(sel + 1), ArrowUp: () => focus(sel - 1), ArrowLeft: () => setTone(Math.max(1, tone - 1)), ArrowRight: () => setTone(Math.min(3, tone + 1)), Enter: () => commit(sel) };
      btns.forEach((b, i) => { keys[String(i + 1)] = () => commit(i); b.addEventListener('focus', () => { sel = i; }); });
      if (!touch.on) btns[0].focus({ preventScroll: true });
      scroll.scrollTop = 0;
      root.dataset.q = q.id;
    };

    const commit = (choice) => {
      if (mode !== 'q') return;
      mode = 'fb'; root.dataset.mode = 'fb';
      const fb = feedback(q, choice), t = tone;
      const delta = cfg.score(q, fb.right, t);
      asked.push(q); results.push(fb.right);
      d = answer(d, fb.right, t);
      if (!d.over && !nextQuestion(cfg.tiers, asked, (l) => l[0])) d = settle(d, 0);
      them.stake(0); me.stake(0);
      if (fb.right) { them.set(d.conviction); them.shake(); them.pop(`−${d.last.hit}`); me.pop(deck.draw('land', STOCK.land[LANG])); sfx.confirm(); }
      else { me.set(d.composure); me.shake(); me.pop(`−${d.last.cost}`, true); sfx.bump(); }
      if (!d.over) speak(fb.right ? deck.draw('hit', T.hit) : deck.draw('score', T.score));
      // the options shrink to what matters: your answer and the right one
      const opts = card.querySelector('.dl-opts'), btns = [...opts.children];
      btns.forEach((b, i) => { b.disabled = true; if (i === q.answer) b.classList.add('ok'); else if (i === choice) b.classList.add('no'); else b.hidden = true; });
      card.querySelector('.dl-tone').hidden = true;
      card.querySelector('.dl-help').hidden = true;
      const coins = delta > 0 ? h('span', { class: 'c' }, fill(W.coins, { n: delta })) : null;
      const box = fb.right
        ? h('div', { class: 'dl-fb ok', role: 'status' }, h('h3', {}, `✓ ${W.right}`, coins), fb.why ? h('p', {}, fb.why) : null)
        : h('div', { class: 'dl-fb no', role: 'status' }, h('h3', {}, `✗ ${deck.draw('rebut', STOCK.rebut[LANG])}`, coins),
          fb.trap ? h('p', {}, h('span', { class: 'lab' }, `${fill(W.tempts, { x: fb.chosen })} `), h('span', { class: 'trap' }, cap(fb.trap).replace(/[.!?]?$/, '.'))) : null,
          h('p', {}, h('span', { class: 'lab' }, `${W.answerIs} `), h('b', {}, fb.correct), fb.why ? ` — ${fb.why}` : ''));
      const next = h('button', { type: 'button', class: 'dl-b go', onclick: () => (d.over ? end() : showTurn()) }, d.over ? W.finish : W.next);
      const from = cfg.kind === 'league' && cfg.place?.(q.topic);
      if (from) box.append(h('p', { class: 'lab' }, fill(W.fromHouse, { n: from.order, name: from.name, concept: from.concept })));
      card.firstChild.append(box, h('div', { class: 'dl-actions' }, next));
      keys = { Enter: () => next.click(), ' ': () => next.click() };
      setTimeout(() => next.focus({ preventScroll: true }), 30);
      requestAnimationFrame(() => next.scrollIntoView({ block: 'nearest' }));
    };

    const end = () => {
      mode = 'end'; root.dataset.mode = 'end'; root.dataset.won = String(!!d.won);
      turnEl.textContent = '';
      (d.won ? them : me).el.classList.add('beaten');
      prize = cfg.onEnd?.(d, asked, results) || {};
      const league = cfg.kind === 'league';
      if (d.won) speak(league ? T.lose : prize.key ? T.lose : T.again);
      else speak(T.win);
      const parts = [h('h2', {}, d.won ? (league ? W.leagueWon : W.won) : (league ? W.leagueLost : W.lost)),
        h('p', { class: 'sub' }, fill(W.score, { r: d.right, n: d.turn }) + (d.how === 'time' ? ` · ${W.outOfTurns}` : ''))];
      if (d.won && (prize.badge || prize.key || prize.first)) {
        const row = h('div', { class: 'dl-prizes' });
        if (prize.badge || prize.first) row.append(h('div', { class: 'dl-prize new', html: `${BADGE_SVG}<span>${W.badge}</span>` }));
        if (prize.key) row.append(h('div', { class: 'dl-prize new', html: `${KEY_SVG}<span>${W.key}</span>` }));
        parts.push(row);
        sfx.reveal();
      }
      if (!d.won) {
        const topics = missedTopics(asked, results);
        if (league) topics.sort((a, b) => cfg.place(a).order - cfg.place(b).order);
        if (league) {
          const ul = h('ul', {}, topics.map((t) => { const p = cfg.place(t); return h('li', {}, `${p.order} · ${p.name}: ${p.concept}`); }));
          if (topics.length) parts.push(h('div', { class: 'dl-advice' }, h('b', {}, W.reviewLeague), ul));
        } else {
          const p = cfg.place(cfg.houseId);
          parts.push(h('div', { class: 'dl-advice' }, h('b', {}, `${W.review}: ${p.concept}.`), h('p', { style: 'margin:4px 0 0' }, W.reviewHouse)));
        }
        parts.push(h('p', { class: 'sub', style: 'margin-top:10px' }, W.nothingLost));
      }
      const acts = h('div', { class: 'dl-actions' });
      let first;
      if (d.won) acts.append(first = h('button', { type: 'button', class: 'dl-b go', onclick: () => finish({ won: true, prize }) }, W.cont));
      else {
        acts.append(first = h('button', { type: 'button', class: 'dl-b go', onclick: () => finish({ won: false, next: 'rematch' }) }, W.rematch));
        if (!league) acts.append(h('button', { type: 'button', class: 'dl-b', onclick: () => finish({ won: false, next: 'reading' }) }, W.readWall));
        acts.append(h('button', { type: 'button', class: 'dl-b', onclick: () => finish({ won: false }) }, W.notNow));
      }
      card.replaceChildren(h('div', { class: 'dl-end', role: 'status' }, ...parts, acts));
      keys = { Enter: () => first.click() };
      setTimeout(() => first.focus({ preventScroll: true }), 30);
      scroll.scrollTop = 0;
    };

    speak(T.open);
    showTurn();
  });
}
