// The mind map of the course: the second view of the menu's Map tab (mechanics/quest/menu.js). Same
// structure as the town, so that looking at one recalls the other: big idea in the middle, one branch
// per district, one leaf per house. The "next" tag is the house of the main path's next step; an
// extra house the player has not been inside shows as "?" (extras are hinted, never listed).
import { overlay, h } from './shell.js';
import { COURSE, DISTRICTS, PLACES, QUESTIONS } from '../data/content.js';
import { LABS } from '../course/labs.js';
import { state } from '../systems/state.js';
import { Q, isCorePlace } from '../mechanics/quest/active.js';

const COL = ['#6f93e0', '#ef7a6d', '#4fd1c5', '#f0a45a'];
const NATURE = { river: 'across the river', shore: 'on the shore', forest: 'in the forest', meadow: 'in the meadow', hill: 'on the hill' };
const CSS = `
.mm{padding:22px 4px 20px}
.mm-page .mm{padding:22px 20px 60px}
.mm-root{max-width:760px;margin:0 auto 6px;text-align:center;border:2px solid #ffcf5a;border-radius:14px;padding:14px 20px;background:#1c1a12}
.mm-root h2{margin:0;font-size:24px}.mm-root p{margin:6px 0 0;color:#e6dcc0;font-size:17px;text-wrap:balance}
.mm-trunk{width:2px;height:22px;background:#3a4252;margin:0 auto}
.mm-cols{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));max-width:1180px;margin:0 auto;border-top:2px solid #3a4252;padding-top:16px}
.mm-d{border-top:4px solid var(--c);background:#131821;border-radius:0 0 12px 12px;padding:12px 12px 14px}
.mm-d h3{margin:0;font-size:18px;color:var(--c)}.mm-d .where{font-size:12px;color:#8b93a7;text-transform:uppercase;letter-spacing:.08em}
.mm-d .idea{margin:6px 0 12px;font-size:15px;color:#e6e8ee}
.mm-p{border:1px solid #2a3240;border-radius:10px;padding:9px 11px;margin-top:8px;background:#0e1116;position:relative}
.mm-p.next{border-color:#ffcf5a;box-shadow:0 0 0 1px #ffcf5a}
.mm-p b{font-size:15px}.mm-p .n{display:inline-block;min-width:20px;text-align:center;background:var(--c);color:#06121f;border-radius:5px;font-weight:700;font-size:13px;margin-right:7px;padding:0 4px}
.mm-p .c{font-size:13px;color:#8b93a7;margin-left:27px}.mm-p .i{font-size:14px;color:#c9cfdd;margin:5px 0 6px}
.mm-chips{display:flex;gap:6px;flex-wrap:wrap}.mm-chip{font-size:12px;border:1px solid #2a3240;border-radius:999px;padding:1px 8px;color:#6f7789}
.mm-chip.on{border-color:#4fd1c5;color:#4fd1c5}.mm-chip.gold{border-color:#ffcf5a;color:#ffcf5a}
.mm-tag{position:absolute;top:-9px;right:10px;background:#ffcf5a;color:#1c1a12;font-size:11px;font-weight:700;border-radius:5px;padding:0 6px}
.mm-jr{background:#1c1a12;border:1px solid #ffcf5a;color:#ffcf5a;border-radius:8px;min-height:44px;padding:0 16px;font:inherit;cursor:pointer}
.mm-p.unk{border-style:dashed}.mm-p.unk b{color:#8b93a7}
.mm-page{flex:1;overflow:auto}
.mm-foot{max-width:1180px;margin:18px auto 0;color:#8b93a7;font-size:14px;display:flex;gap:18px;flex-wrap:wrap;justify-content:space-between}
`;
let styled = false;

export function mindMap() {
  if (!styled) { document.head.append(h('style', { html: CSS })); styled = true; }
  const st = Q.nextStep({ ...state, seenIntro: true }), next = st.place?.id;
  const leaf = (p) => {
    if (!isCorePlace(p.id) && !state.visited[p.id]) return h('div', { class: 'mm-p unk' }, h('div', {}, h('span', { class: 'n' }, String(p.order)), h('b', {}, '?')));
    const lab = LABS[p.id], n = lab ? lab.stations.length : 0, done = lab ? lab.stations.filter((_, i) => state.done[`${p.id}:${i}`]).length : 0;
    const facts = QUESTIONS.filter((q) => q.topic === p.id && q.stars === 1), known = facts.filter((q) => state.q[q.id]?.right).length;
    return h('div', { class: `mm-p${next === p.id ? ' next' : ''}` }, next === p.id ? h('span', { class: 'mm-tag' }, 'next') : null,
      h('div', {}, h('span', { class: 'n' }, String(p.order)), h('b', {}, p.name)), h('div', { class: 'c' }, p.concept), h('div', { class: 'i' }, p.idea),
      h('div', { class: 'mm-chips' },
        h('span', { class: `mm-chip${state.visited[p.id] ? ' on' : ''}` }, state.visited[p.id] ? 'visited' : 'not visited'),
        n ? h('span', { class: `mm-chip${done === n ? ' on' : ''}` }, `lab ${done}/${n}`) : null,
        facts.length ? h('span', { class: `mm-chip${known === facts.length ? ' on' : ''}` }, `facts ${known}/${facts.length}`) : null,
        state.stamps[p.id] ? h('span', { class: 'mm-chip gold' }, 'badge') : null));
  };
  return h('div', { class: 'mm' },
    h('div', { class: 'mm-root' }, h('h2', {}, COURSE.hub.name), h('p', {}, COURSE.bigIdea)), h('div', { class: 'mm-trunk' }),
    h('div', { class: 'mm-cols' }, DISTRICTS.map((d, i) => h('div', { class: 'mm-d', style: `--c:${COL[i % COL.length]}` },
      h('div', { class: 'where' }, `${NATURE[d.nature] || ''} · landmark: ${d.landmark || 'obelisk'}`), h('h3', {}, d.name), h('div', { class: 'idea' }, d.idea),
      PLACES.filter((p) => p.district === d).map(leaf)))),
    h('div', { class: 'mm-foot' }, h('span', {}, 'Houses are numbered in the order of the learning path.')));
}

// The mind map alone, as a page (kept for scripts and the console).
export function openMap() {
  const { root, close } = overlay(COURSE.title, 'Map');
  const body = h('div', { class: 'mm-page', tabindex: '0' }, mindMap());
  root.append(body);
  body.focus();
  root.dataset.ready = '1';
  return new Promise((resolve) => {
    const done = (v) => { window.removeEventListener('keydown', key, true); root.remove(); resolve(v); };
    const key = (e) => { if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); done(); } };
    window.addEventListener('keydown', key, true);
    close.onclick = () => done();
  });
}
