// The menu (Tab, or the Menu button): one screen, three tabs, on the same overlay as the pages.
//   Journey    the goal, the main path as a checklist (core houses only), the League, one line
//              that the town keeps more to itself; after the ending, the ending card again
//   Map        the town as explored so far (townmap.js), and the mind map of the course one tap away
//   Mysteries  the discoveries page (secrets/journal.js), keys and tools carried, coins
// Footer: settings as plain toggles, and the keys. Tab or Esc closes; 1 2 3 or the arrows switch tabs.
//
// openMenu({ tab, settings, touch }) resolves with 'ending' (the player asked to see the ending card
// again) or undefined. settings: [{ label, value: () => string, on: () => bool, toggle: () => void }].
import { overlay, h } from '../../lab/shell.js';
import { mindMap } from '../../lab/map.js';
import { COURSE, PLACE } from '../../data/content.js';
import { state } from '../../systems/state.js';
import { LIFE } from '../config.js';
import { lifePlan } from '../active.js';
import { journalBody, journalStyle } from '../secrets/journal.js';
import { lockSection } from '../riddles/journal.js';
import { TOOLS } from '../obstacles/kinds.js';
import { Q } from './active.js';
import { Q_WORDS, tr, fill, trackerLine } from './strings.js';
import { townMapView, MAP_CSS } from './townmap.js';
import { floorsOf } from '../floors/plan.js';
import { STORY } from '../story/config.js';
import { notebookView, mementoSection, NB_CSS } from '../story/notebook.js';

const TABS = ['journey', 'map', 'mysteries'];
const W = Q_WORDS;

const CSS = `
.qm .hb-top{gap:10px}
.qm .hb-tabs{display:flex;gap:4px;flex:0 1 auto;min-width:0}
.qm-tab{min-height:44px;padding:0 16px;border-radius:10px;background:none;border:1px solid transparent;color:var(--muted);font-size:16px;cursor:pointer;white-space:nowrap}
.qm-tab:hover{background:#1e2633;color:var(--text)}
.qm-tab[aria-selected=true]{background:#1e2836;border-color:#2f3b4f;color:#fff;font-weight:600;box-shadow:inset 0 -3px 0 var(--acc)}
.qm-tab .k{color:#6f7789;font-size:13px;margin-right:6px}
@media (max-width:640px){.qm .hb-top h1{display:none}.qm .hb-tabs{flex:1}.qm-tab{flex:1;padding:0 8px}.qm-tab .k{display:none}}
.qm-body{flex:1;overflow:auto;padding:20px 16px 28px;overscroll-behavior:contain}
.qm-in{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.qm-goal{margin:0;padding:14px 18px;border-radius:14px;background:#1c1a12;border:1px solid #4d4220;color:#ece3c6;font-size:17px;line-height:1.5}
.qm-goal p{margin:0}.qm-goal p+p{margin-top:4px}
.qm-h{margin:6px 0 -6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600}
.qm-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.qm-row{display:grid;grid-template-columns:36px 1fr;gap:4px 12px;align-items:center;padding:12px 14px;border-radius:12px;background:var(--panel);border:1px solid var(--line)}
.qm-row .n{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:#273246;color:#e8eaf0;font-weight:700;font-size:16px}
.qm-row .nm{font-size:17px;font-weight:600;min-width:0}
.qm-row .st{grid-column:2;display:flex;gap:6px;flex-wrap:wrap}
.qm-row .now{grid-column:1/-1;margin-top:6px;padding:8px 12px;border-radius:10px;background:#13242a;border:1px solid #2c5f5a;color:#bff3ec;font-size:16px;font-weight:600}
.qm-row.cur{border-color:var(--acc);box-shadow:inset 4px 0 0 var(--acc)}
.qm-row.cur .n{background:var(--acc);color:var(--acc-ink)}
.qm-row.done .n{background:var(--ok);color:#0b1a10}
.qm-row.done .nm{color:#c9d6cc}
.qm-chip{display:inline-flex;align-items:center;gap:5px;min-height:26px;padding:0 10px;border-radius:13px;border:1px solid #34405a;color:#8f98ab;font-size:14px}
.qm-chip.on{border-color:#3f7f55;color:#a5e8b3;background:#15281c}
.qm-chip.gold{border-color:#7d6526;color:var(--gold);background:#231d0d}
.qm-row.league .n{background:#3a3f5a;color:var(--gold)}
.qm-more{margin:4px 0 0;color:#a9b0c4;font-style:italic;font-size:16px;text-align:center}
.qm-btn{align-self:center;display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:0 20px;border-radius:12px;background:var(--acc);color:var(--acc-ink);border:0;font-weight:700;font-size:16px;cursor:pointer}
.qm-btn.ghost{background:none;border:1px solid var(--line);color:var(--text);font-weight:600}
.qm-carry{display:flex;flex-wrap:wrap;gap:8px}
.qm-item{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border-radius:12px;background:var(--panel);border:1px solid var(--line);font-size:16px}
.qm-item i{font-style:normal;font-size:18px}
.qm-coins{display:flex;align-items:baseline;gap:10px;font-size:16px;color:var(--muted)}.qm-coins b{font-size:28px;color:var(--gold)}
.qm-foot{flex:none;border-top:1px solid var(--line);background:var(--panel);padding:8px 12px calc(8px + env(safe-area-inset-bottom))}
.qm-foot-in{max-width:980px;margin:0 auto;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.qm-tog{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border-radius:10px;background:none;border:1px solid var(--line);cursor:pointer;font-size:16px}
.qm-tog .v{color:var(--muted)}.qm-tog[aria-pressed=true] .v{color:var(--acc);font-weight:600}
.qm-keysb{margin-left:auto}
.qm-setb{display:none}
@media (max-width:640px){.qm-setb{display:inline-flex}.qm-foot:not(.open) .qm-tog:not(.qm-setb){display:none}.qm-foot:not(.open) .qm-keys{display:none}.qm-foot.open .qm-setb{background:#1e2836}}
.qm-keys{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;width:100%;margin:6px 0 2px;font-size:16px;color:var(--muted)}
.qm-keys kbd{font:inherit;color:var(--text);white-space:nowrap}
.qm-jr .jr-in{max-width:none}
${MAP_CSS}
${NB_CSS}
`;
let styled = false;

const chip = (text, cls = '') => h('span', { class: `qm-chip ${cls}` }, text);

function journey(onEnding) {
  const st = Q.nextStep(state), rows = Q.coreProgress(state);
  const now = st.place ? st.place.id : null;
  const list = rows.map((r) => {
    const cur = r.id === now && !state.ended, chips = [chip(r.visited ? `✓ ${tr(W.journey.visited)}` : tr(W.journey.notVisited), r.visited ? 'on' : '')];
    if (r.m) chips.push(chip(fill(tr(W.journey.lab), { n: r.n, m: r.m }), r.n >= r.m ? 'on' : ''));
    if (r.duel) chips.push(chip(r.won ? `★ ${tr(W.journey.won)}` : tr(W.journey.duel), r.won ? 'gold' : ''));
    return h('li', { class: `qm-row${cur ? ' cur' : ''}${r.done ? ' done' : ''}` }, h('span', { class: 'n' }, r.done ? '✓' : String(r.order)),
      h('span', { class: 'nm' }, PLACE[r.id].name), h('span', { class: 'st' }, chips), cur ? h('div', { class: 'now' }, trackerLine(st)) : null);
  });
  const open = Q.leagueOpen(state), lstate = state.passedLeague ? tr(W.journey.wonLeague) : open ? tr(W.journey.open) : tr(W.journey.locked);
  const lcur = !state.ended && (st.kind === 'league' || st.kind === 'ending');
  list.push(h('li', { class: `qm-row league${lcur ? ' cur' : ''}${state.passedLeague ? ' done' : ''}` }, h('span', { class: 'n' }, state.passedLeague ? '✓' : '★'),
    h('span', { class: 'nm' }, COURSE.league.name), h('span', { class: 'st' }, chip(lstate, state.passedLeague ? 'gold' : open ? 'on' : '')), lcur ? h('div', { class: 'now' }, trackerLine(st)) : null));
  const kids = [h('div', { class: 'qm-goal' }, tr(W.goalShort).map((l) => h('p', {}, l)))];
  if (state.ended) kids.push(h('p', { class: 'qm-more', style: 'font-style:normal' }, tr(W.journey.done)), h('button', { type: 'button', class: 'qm-btn', onclick: onEnding }, tr(W.card.reopen)));
  kids.push(h('div', { class: 'qm-h' }, tr(W.journey.path)), h('ol', { class: 'qm-list' }, list), h('p', { class: 'qm-more' }, tr(W.journey.more)));
  return h('div', { class: 'qm-in' }, kids);
}

function mapTab() {
  let mind = false;
  const box = h('div', { class: 'qm-in', style: 'max-width:1200px' });
  const draw = () => {
    box.replaceChildren(h('button', { type: 'button', class: 'qm-btn ghost', onclick: () => { mind = !mind; draw(); } }, tr(mind ? W.map.town : W.map.mind)), mind ? mindMap() : townMapView());
  };
  draw();
  return box;
}

function mysteries(busy) {
  const items = [];
  // a key matters only where there is an upstairs to open (a house without one gets none to show)
  for (const [id, has] of Object.entries(state.keys || {})) if (has && PLACE[id] && floorsOf(PLACE[id]).up) items.push(h('span', { class: 'qm-item' }, h('i', { 'aria-hidden': 'true' }, '🗝'), fill(tr(W.mysteries.key), { place: PLACE[id].name })));
  for (const [t, has] of Object.entries(state.tools || {})) if (has && TOOLS[t]) items.push(h('span', { class: 'qm-item' }, h('i', { 'aria-hidden': 'true' }, '⚒'), tr(TOOLS[t])));
  const kids = [
    h('div', { class: 'qm-coins' }, h('b', {}, String(state.insight || 0)), tr(W.mysteries.coins)),
    ...(STORY.on ? [mementoSection()] : []), // the story: the things found upstairs that were never theirs
    h('div', { class: 'qm-h' }, tr(W.mysteries.carry)),
    items.length ? h('div', { class: 'qm-carry' }, items) : h('p', { class: 'qm-more', style: 'text-align:left' }, tr(W.mysteries.nothing)),
  ];
  if (LIFE.secrets) kids.push(h('div', { class: 'qm-jr' }, journalBody(lifePlan(), busy)));
  else { const locks = lockSection(); if (locks) { journalStyle(); kids.push(h('div', { class: 'qm-jr' }, locks)); } } // opened locks belong to the game, not to ambient life
  return h('div', { class: 'qm-in' }, kids);
}

export function openMenu({ tab = null, settings = [], touch = false } = {}) {
  if (!styled) { document.head.append(h('style', { html: CSS })); styled = true; }
  const { root, tabs, close } = overlay(COURSE.title, '');
  root.classList.add('qm');
  let cur = tab || (state.ended ? 'map' : 'journey'), busy = false, result;
  const body = h('div', { class: 'qm-body', tabindex: '-1' });
  const btns = TABS.map((t, i) => h('button', { type: 'button', class: 'qm-tab', role: 'tab', onclick: () => show(t) }, h('span', { class: 'k' }, String(i + 1)), tr(W.tabs[t])));
  tabs.setAttribute('role', 'tablist');
  tabs.append(...btns);
  // footer: toggles and the keys
  const keysBox = h('div', { class: 'qm-keys', hidden: '' }, (touch ? tr(W.touchHelp) : tr(W.keysHelp)).flatMap(([k, v]) => [h('kbd', {}, k), h('span', {}, v)]));
  const togs = settings.map((s) => {
    const b = h('button', { type: 'button', class: 'qm-tog' });
    const draw = () => { b.setAttribute('aria-pressed', String(s.on())); b.replaceChildren(h('span', {}, s.label), h('span', { class: 'v' }, s.value())); };
    b.onclick = () => { s.toggle(); draw(); };
    draw();
    return b;
  });
  const keysBtn = h('button', { type: 'button', class: 'qm-tog qm-keysb', 'aria-expanded': 'false' }, tr(W.settings.keys));
  keysBtn.onclick = () => { const o = keysBox.hidden; keysBox.hidden = !o; keysBtn.setAttribute('aria-expanded', String(o)); };
  // on a narrow screen the toggles fold behind one button, so the tabs keep the height
  const foot = h('div', { class: 'qm-foot' });
  const setBtn = h('button', { type: 'button', class: 'qm-tog qm-setb', 'aria-expanded': 'false' }, tr(W.settings.title));
  setBtn.onclick = () => { const o = foot.classList.toggle('open'); setBtn.setAttribute('aria-expanded', String(o)); };
  foot.append(h('div', { class: 'qm-foot-in' }, setBtn, togs, keysBtn, keysBox));
  root.append(body, foot);
  const done = (v) => { result = v; finish(); };
  let finish = () => {};
  function show(t) {
    cur = t;
    btns.forEach((b, i) => b.setAttribute('aria-selected', String(TABS[i] === t)));
    body.replaceChildren(t === 'journey' ? (STORY.on ? notebookView(() => done('ending')) : journey(() => done('ending'))) : t === 'map' ? mapTab() : mysteries((v) => { busy = v; }));
    body.scrollTop = 0;
    root.dataset.tab = t;
  }
  show(cur);
  body.focus();
  root.dataset.ready = '1';
  return new Promise((resolve) => {
    finish = () => { window.removeEventListener('keydown', key, true); root.remove(); resolve(result); };
    const key = (e) => {
      if (busy) return;
      const i = TABS.indexOf(cur);
      if (e.key === 'Escape' || e.key === 'Tab' || ((e.key === 'j' || e.key === 'J') && cur === 'mysteries')) { e.preventDefault(); finish(); }
      else if (e.key >= '1' && e.key <= '3') { e.preventDefault(); show(TABS[+e.key - 1]); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(TABS[(i + (e.key === 'ArrowRight' ? 1 : 2)) % 3]); }
    };
    window.addEventListener('keydown', key, true);
    close.onclick = () => finish();
  });
}
