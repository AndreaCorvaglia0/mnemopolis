// The lighthouse (docs/STORY.md, beats 7 and 8): the League, hidden in plain sight. Unmarked and
// dark on the square from the first minute; its door only says it is locked from the inside until
// the last page is back. Then the notebook gives the word; the door asks for it in a first-person
// close-up (the locks' door with the hatch), typed freely, matched with tolerance; after two misses
// the character remembers the word. Up the stair: the keeper and the final remembering (the League's
// rules: finalCheck size and pass, core concepts only), staged darker. Won: the turn (turn.js).
import { state, save } from '../../systems/state.js';
import { sfx } from '../../systems/audio.js';
import { COURSE } from '../../data/content.js';
import { Q } from '../quest/active.js';
import { say } from '../life.js';
import { openCloseup } from '../riddles/closeup.js';
import { LANG } from '../config.js';
import { S_WORDS } from './words.js';
import { STORY, tr, fill } from './config.js';
import { doorWord } from './logic.js';
import { cinema } from './cinema.js';
import { playTurn } from './turn.js';

export const theWord = () => doorWord(COURSE.bigIdea, STORY.word);
export const DOOR_RIDDLE = () => ({ id: 'story-lighthouse', kind: 'door', clue: tr(S_WORDS.doorClue), answer: [theWord()], type: 'text', place: null });

export async function lighthouseDoor(town) {
  const ui = town.ui, keeper = tr(S_WORDS.keeper);
  if (state.ended) {
    await ui.converse(keeper, { root: { say: tr(S_WORDS.keeperAgain), options: [{ label: tr(S_WORDS.keeperFace), do: async () => { await ui.league(); return 'end'; } }, { label: tr(S_WORDS.notNow) }] } });
    return;
  }
  if (!Q.leagueOpen(state)) { sfx.bump?.(); say(town, tr(S_WORDS.locked)); return; }
  const st = (state.story ||= {});
  if (!st.door) {
    const r = DOOR_RIDDLE();
    const res = await ui.page(() => openCloseup(r, {
      state, lang: LANG, heading: tr(S_WORDS.lighthouseDoor), ask: tr(S_WORDS.doorAsk), closeOnOpen: true,
      thought: (x) => (x.misses >= 2 ? fill(tr(S_WORDS.doorMiss2), { word: theWord() }) : tr(S_WORDS.doorMiss1)),
    }));
    if (!res?.opened) return;
    st.door = true; save();
  } else {
    let go = false;
    await ui.converse(keeper, { root: { say: tr(S_WORDS.keeperAgain), options: [{ label: tr(S_WORDS.keeperFace), do: async () => { go = true; return 'end'; } }, { label: tr(S_WORDS.notNow) }] } });
    if (!go) return;
  }
  await climbAndFace(town);
}

async function climbAndFace(town) {
  const ui = town.ui;
  await cinema(ui, async (c) => {
    await c.dim(0.85, 700);
    for (const l of tr(S_WORDS.climb)) await c.say(l);
  }, { scene: town });
  await ui.league();
  if (state.passedLeague && !state.story?.turned) await playTurn(town);
  else if (!state.passedLeague) say(town, tr(S_WORDS.climbDown));
}
