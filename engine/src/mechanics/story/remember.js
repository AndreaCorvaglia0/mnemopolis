// Finding a memento (docs/STORY.md, beat 5): a cinematic moment with a fragment of the theme, the
// close-up, the character's thought (uneasy, escalating), and one page of the notebook restored. The
// last page restores the whole: the pages read in order, the big idea, the lighthouse and its word.
import { h } from '../../lab/shell.js';
import { state, save } from '../../systems/state.js';
import { COURSE, PLACE, MASTERS } from '../../data/content.js';
import { Q } from '../quest/active.js';
import { cinema } from './cinema.js';
import { mementoCanvas } from './mementos.js';
import { mementosFor, pageText } from './logic.js';
import { S_WORDS } from './words.js';
import { tr, fill } from './config.js';
import { theWord } from './lighthouse.js';

export const MEMENTO_OF = mementosFor(Q.core.map((p) => p.id));
export const mementoKind = (id) => MEMENTO_OF[id] || null;
export const hasMemento = (id) => !!MEMENTO_OF[id] && !state.story?.mementos?.[id];

const paperCss = 'padding:18px 22px;max-width:min(88vw,560px);background:#efe6cf;color:#1f2d5c;font:italic clamp(19px,3.2vw,26px)/1.45 Georgia,serif;box-shadow:0 10px 40px #000;transform:rotate(-1deg);background-image:repeating-linear-gradient(transparent 0 calc(1.45em - 1px),#cfd8e0 calc(1.45em - 1px) 1.45em)';
const paperOf = (lines) => { const d = h('div', {}); d.style.cssText = paperCss; for (const l of [].concat(lines)) d.append(h('p', { style: 'margin:0 0 .3em' }, l)); return d; };

// id: the house; given: the owner hands it over (a house with no upstairs: the workshop, the museum)
export async function findMemento(ui, id, { given = false } = {}) {
  const kind = mementoKind(id);
  if (!kind || state.story?.mementos?.[id]) return;
  const name = state.story?.name || tr(S_WORDS.defaultName), M = S_WORDS.mementos[kind];
  const house = ui.registry.get('buildings')?.[id]?.canvas;
  const st = (state.story ||= {}); (st.mementos ||= {})[id] = kind;
  const last = Q.core.every((p) => !MEMENTO_OF[p.id] || st.mementos[p.id]);
  if (last) st.understood = 1;
  save();
  await cinema(ui, async (c) => {
    c.root.style.background = '#07060b';
    c.theme('fragment');
    await c.say(given ? fill(tr(S_WORDS.mementoGiven), { name: MASTERS[id]?.name || '' }) : tr(S_WORDS.mementoIntro));
    const mc = mementoCanvas(kind, { name, house, arrived: st.arrivedAt });
    c.show(mc.el);
    await c.say(tr(M.title), { min: 1600 });
    await c.say(fill(tr(M.thought), { name }), { min: 3400 });
    mc.stop();
    c.show(paperOf(pageText(PLACE[id])));
    await c.say(tr(S_WORDS.pageBack), { min: 3000 });
    if (last) {
      // the pages, in order, say one thing
      c.show(paperOf(Q.core.map((p) => pageText(PLACE[p.id]))));
      await c.say(tr(S_WORDS.understood)[0], { min: 3600 });
      c.show(paperOf([COURSE.bigIdea, fill(tr(S_WORDS.lastLine), { word: theWord() })]));
      await c.say(fill(tr(S_WORDS.understood)[1], { big: COURSE.bigIdea }), { min: 4000 });
      await c.say(tr(S_WORDS.understood)[2], { min: 3000 });
    }
    c.hide();
  });
}
