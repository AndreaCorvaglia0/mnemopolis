// Finding a memento (docs/STORY.md, beat 5): a cinematic moment with a fragment of the theme, the
// close-up (illustrated: scenes/objects.js), the character's thought (uneasy, escalating), and one
// page of the notebook restored, in its hand. The last page restores the whole: the pages read in
// order, the big idea, the lighthouse and its word.
import { state, save } from '../../systems/state.js';
import { COURSE, PLACE, MASTERS } from '../../data/content.js';
import { Q } from '../quest/active.js';
import { cinema } from './cinema.js';
import { view } from './paint.js';
import { objectPainter } from './scenes/objects.js';
import { BUILDINGS } from '../../world/townMap.js';
import { mementosFor, pageText } from './logic.js';
import { S_WORDS } from './words.js';
import { tr, fill } from './config.js';
import { theWord } from './lighthouse.js';
import { GEN } from '../../gen/core.js';
import { floorsOf } from '../floors/plan.js';

export const MEMENTO_OF = mementosFor(Q.core.map((p) => p.id));
export const mementoKind = (id) => MEMENTO_OF[id] || null;
export const hasMemento = (id) => !!MEMENTO_OF[id] && !state.story?.mementos?.[id];
// an upstairs to find it in: a composed room with an attic (not the workshop, not the museum, not the
// standard room of "gen": { "interior": false }); otherwise the owner hands it over on remembering
export const hasAttic = (id) => !!GEN.interior && floorsOf(PLACE[id] || {}).up;


// id: the house; given: the owner hands it over (a house with no upstairs: the workshop, the museum)
export async function findMemento(ui, id, { given = false } = {}) {
  const kind = mementoKind(id);
  if (!kind || state.story?.mementos?.[id]) return;
  const name = state.story?.name || tr(S_WORDS.defaultName), M = S_WORDS.mementos[kind];
  const st = (state.story ||= {}); (st.mementos ||= {})[id] = kind;
  const last = Q.core.every((p) => !MEMENTO_OF[p.id] || st.mementos[p.id]);
  if (last) st.understood = 1;
  save();
  const b = BUILDINGS.find((x) => x.id === id), house = { wide: (b?.w || 5) >= 6 };
  await cinema(ui, async (c) => {
    c.root.style.background = '#07060b';
    await c.dim(1, 0);
    let v = view(c.root, objectPainter(kind), { name, arrived: st.arrivedAt, house, push: 0.05, pushTime: 18 });
    await c.dim(0, 900);
    c.theme('fragment');
    await c.say(given ? fill(tr(S_WORDS.mementoGiven), { name: MASTERS[id]?.name || '' }) : tr(S_WORDS.mementoIntro));
    await c.say(tr(M.title), { min: 1600 });
    await c.say(fill(tr(M.thought), { name }), { min: 3400 });
    // a page of the notebook comes back: the concept's idea, in the notebook's hand
    const leaf = async (text) => { await c.dim(1, 500); v.stop(); v = view(c.root, objectPainter('leaf'), { text, push: 0.04 }); await c.dim(0, 700); };
    await leaf(pageText(PLACE[id]));
    await c.say(tr(S_WORDS.pageBack), { min: 3000 });
    if (last) {
      // the pages, in order, say one thing; under it, in the same hand, the lighthouse and its word
      await leaf(Q.core.map((p) => pageText(PLACE[p.id])).join(' '));
      await c.say(tr(S_WORDS.understood)[0], { min: 3600 });
      await leaf(`${COURSE.bigIdea} ${fill(tr(S_WORDS.lastLine), { word: theWord() })}`);
      await c.say(fill(tr(S_WORDS.understood)[1], { big: COURSE.bigIdea }), { min: 4000 });
      await c.say(tr(S_WORDS.understood)[2], { min: 3000 });
    }
    await c.dim(1, 500);
    v.stop();
  });
}
