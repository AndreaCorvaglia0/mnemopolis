// The notebook (docs/STORY.md, beat 3): the Journey tab of the menu, drawn as the notebook found on the
// quay. Its first line, in hand, is the next step (the same nextStep as the tracker); then the way (the
// main path), the lighthouse, and the pages: the restored ones carry the concept's idea as if you
// had once written it down; the missing ones are torn stubs. Text stays 16 px or more.
import { h } from '../../lab/shell.js';
import { COURSE, PLACE } from '../../data/content.js';
import { state } from '../../systems/state.js';
import { Q } from '../quest/active.js';
import { trackerLine } from '../quest/strings.js';
import { S_WORDS } from './words.js';
import { tr, fill } from './config.js';
import { pageText } from './logic.js';
import { isFoggy } from './fog.js';
import { theWord } from './lighthouse.js';

export const NB_CSS = `
.nb{max-width:720px;margin:0 auto;padding:22px 20px 26px 34px;background:#efe6cf;color:#2a2318;border-radius:6px 10px 10px 6px;box-shadow:0 6px 24px #0008,inset 10px 0 0 #d9ccaa,inset 12px 0 0 #b9a982;background-image:repeating-linear-gradient(#efe6cf 0 31px,#cfd8e0 31px 32px);background-position:0 14px;font:17px/32px Georgia,"Times New Roman",serif}
.nb h3{margin:0;font:600 15px/32px system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#8a7a58}
.nb .hand{font-style:italic;color:#2b3a6b}
.nb .next{font-size:21px;color:#1f2d5c}
.nb .goal{color:#5a4a30;font-size:16px}
.nb ol{list-style:none;margin:0;padding:0}
.nb li{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.nb li .n{min-width:22px;font-weight:700;color:#6a5a3a}
.nb li .nm{font-weight:600}
.nb li .st{color:#6a5a3a;font-size:16px}
.nb li.cur .nm{color:#1f2d5c;text-decoration:underline;text-decoration-color:#b9463b;text-underline-offset:4px}
.nb li.done .nm{color:#5c6a52}
.nb .fog{display:inline-block;padding:0 8px;border-radius:10px;background:#d9dde3;color:#4a5160;font:15px/24px system-ui,sans-serif}
.nb .page{margin:6px 0 0;padding:0 0 2px}
.nb .page .from{font:15px/24px system-ui,sans-serif;color:#7a6a48}
.nb .stub{height:30px;margin:6px 0 2px;background:linear-gradient(135deg,transparent 0 8px,#efe6cf 8px) 0 0/16px 100%,repeating-linear-gradient(#e2d6b8 0 31px,#cfd8e0 31px 32px);clip-path:polygon(0 0,100% 0,100% 40%,92% 70%,84% 45%,76% 80%,68% 50%,60% 85%,52% 55%,44% 90%,36% 60%,28% 85%,20% 50%,12% 80%,4% 55%,0 70%);opacity:.8;font:15px/30px system-ui,sans-serif;color:#8a7a58;padding-left:10px}
.nb .last{font-size:19px;color:#1f2d5c}
.nb .btn{margin-top:10px;min-height:46px;padding:0 18px;border-radius:10px;border:0;background:#2a2318;color:#f3e9cf;font:700 16px system-ui,sans-serif;cursor:pointer}
@media (max-width:520px){.nb{padding:16px 14px 20px 24px;font-size:16px}.nb .next{font-size:19px}}
`;

// a house's state, in the notebook's words
function status(r) {
  if (state.ended && isFoggy(r.id)) return null;
  if (r.done || r.found) return tr(S_WORDS.remembered);
  if (r.won && r.memento && !r.found) return tr(S_WORDS.attic);
  if (!r.visited) return '';
  if (r.n < r.m) return `lab ${r.n}/${r.m}`;
  return tr(S_WORDS.notYet);
}

export function notebookView(onEnding) {
  const st = Q.nextStep(state), rows = Q.coreProgress(state), cur = st.place?.id;
  const kids = [];
  kids.push(h('h3', {}, tr(S_WORDS.next)), h('p', { class: 'hand next', style: 'margin:0' }, state.ended ? tr(S_WORDS.endedLine) : trackerLine(st)));
  if (!state.ended) for (const l of tr(S_WORDS.goal)) kids.push(h('p', { class: 'goal', style: 'margin:0' }, l));
  // the way
  kids.push(h('h3', {}, tr(S_WORDS.theWay)));
  const li = rows.map((r) => {
    const s = status(r), fog = state.ended && isFoggy(r.id);
    return h('li', { class: `${r.id === cur && !state.ended ? 'cur' : ''}${r.done ? ' done' : ''}` }, h('span', { class: 'n' }, r.done ? '✓' : String(r.order)), h('span', { class: 'nm hand' }, PLACE[r.id].name), s ? h('span', { class: 'st' }, `· ${s}`) : null, fog ? h('span', { class: 'fog' }, tr(S_WORDS.fogMark)) : null);
  });
  li.push(h('li', { class: !state.ended && (st.kind === 'league' || st.kind === 'ending') ? 'cur' : '' }, h('span', { class: 'n' }, '✦'), h('span', { class: 'nm hand' }, tr(S_WORDS.lighthouse)), h('span', { class: 'st' }, `· ${state.ended ? tr(S_WORDS.lit) : tr(S_WORDS.dark)}`)));
  kids.push(h('ol', {}, li));
  // the pages
  kids.push(h('h3', {}, tr(S_WORDS.pages)));
  for (const r of rows) {
    const found = !!state.story?.mementos?.[r.id];
    if (found) kids.push(h('div', { class: 'page' }, h('div', { class: 'from' }, fill(tr(S_WORDS.pageOf), { order: r.order })), h('p', { class: 'hand', style: 'margin:0' }, pageText(PLACE[r.id]))));
    else kids.push(h('div', { class: 'stub', 'aria-label': tr(S_WORDS.torn) }, tr(S_WORDS.torn)));
  }
  if (Q.leagueOpen(state) || state.ended) kids.push(h('p', { class: 'hand last', style: 'margin:8px 0 0' }, COURSE.bigIdea), h('p', { class: 'hand last', style: 'margin:0' }, fill(tr(S_WORDS.lastLine), { word: theWord() })));
  if (state.ended && onEnding) kids.push(h('button', { type: 'button', class: 'btn', onclick: onEnding }, tr({ en: 'See the ending again', it: 'Rivedi il finale' })));
  return h('div', { class: 'qm-in' }, h('div', { class: 'nb' }, kids));
}

// the Mysteries tab: the things found upstairs that were never theirs
export function mementoSection() {
  const found = Object.entries(state.story?.mementos || {});
  const box = h('div', { class: 'nb', style: 'background-image:none' }, h('h3', {}, tr(S_WORDS.mementoSection)));
  if (!found.length) box.append(h('p', { class: 'hand', style: 'margin:0' }, tr(S_WORDS.mementoNone)));
  for (const [id, kind] of found) {
    const m = S_WORDS.mementos[kind] || S_WORDS.mementos.page;
    box.append(h('p', { style: 'margin:0' }, h('b', {}, tr(m.title)), h('span', { class: 'hand' }, ` — ${fill(tr(m.thought), { name: state.story?.name || tr(S_WORDS.defaultName) })}`), h('span', { style: 'color:#7a6a48;font-size:15px' }, ` (${PLACE[id]?.name || ''})`)));
  }
  return box;
}
