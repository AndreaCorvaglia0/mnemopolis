// The duels in the game: a house duel with its host (Interior.quizSeries) and the League
// (UI.league). Rules in rules.js (pure), the screen in screen.js, words in lines.js, tempers in
// tempers.js, what winning gives in prize.js.
import { state, save, scoreAnswer, pickQuestion } from '../../systems/state.js';
import { PLACE, PLACES, QUESTIONS, LEAGUE, MASTERS } from '../../data/content.js';
import { DATA } from '../../course/_data.js';
import { seeded } from '../../gen/core.js';
import { LANG } from '../config.js';
import { TEMPERS, CHAMPION, temperFor } from './tempers.js';
import { houseBars, leagueBars, houseTiers, leagueQuestions } from './rules.js';
import { awardHouse, awardLeague, isFriendly } from './prize.js';
import { openDuel } from './screen.js';
import { CHALLENGE } from './lines.js';
import { STORY } from '../story/config.js';
import { R_TEMPERS, KEEPER, REMEMBER, REMEMBER_STOCK, REMEMBER_CHALLENGE, S_WORDS } from '../story/words.js';
import { fill, tr } from '../config.js';
import { findMemento } from '../story/remember.js';
import { noteRemembered } from '../story/fog.js';
import { floorsOf } from '../floors/plan.js';
import { Q } from '../quest/active.js';

// The temper of a house: `expert.temper` in course.json if it names one, else seeded by the place.
export function temperOf(id) {
  const c = DATA.concepts.find((x) => x.id === id);
  return temperFor(c?.expert?.temper, seeded(`${id}:temper`));
}

// Coins by the level of the question when right; nothing taken when wrong. The question history
// is kept by scoreAnswer as usual (it is what picks unseen and missed questions first).
const score = (q, right) => scoreAnswer(q, right);

// The story's skin (docs/STORY.md): remembering instead of a duel of words.
const SKIN = STORY.on ? { words: REMEMBER, stock: REMEMBER_STOCK, fill: true } : null;
const linesOf = (temper) => (STORY.on ? R_TEMPERS[temper] || R_TEMPERS.admirer : TEMPERS[temper])[LANG];

const place = (id) => { const p = PLACE[id]; return p && { order: p.order, name: p.name, concept: p.concept }; };
const sprite = (ui) => (look) => { const t = ui.textures.get(`ch-${look}`); return t && t.key !== '__MISSING' ? t.getSourceImage() : null; };
function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

export const houseQuestions = (id) => QUESTIONS.filter((q) => q.topic === id);

// The label of the host's dialogue option.
export const challengeLabel = (id) => fill((STORY.on ? REMEMBER_CHALLENGE : CHALLENGE)[LANG][isFriendly(state, id) ? 'friendly' : 'first'], { name: MASTERS[id]?.name || '' });

// A duel with the host of house `id`. Rematches loop here; Esc or "Not now" ends it.
export async function houseDuel(ui, id) {
  const pool = houseQuestions(id);
  if (!pool.length) return null;
  const m = MASTERS[id], lines = linesOf(temperOf(id));
  for (;;) {
    const friendly = isFriendly(state, id);
    const res = await ui.page(() => openDuel({
      kind: 'house', houseId: id, friendly, skin: SKIN, upstairs: floorsOf(PLACE[id]).up, room: PLACE[id].kind, bars: houseBars(pool.length), tiers: houseTiers(pool, friendly), pick: pickQuestion,
      score, place, sprite: sprite(ui), opponent: { name: m.name, look: m.look, lines },
      onEnd: (d) => { if (!d.won) return {}; const p = awardHouse(state, id); save(); return p; },
    }));
    ui.refreshHUD();
    if (res.won && res.prize?.badge && !STORY.on) await ui.stamp(id); // the story lights a window instead (story/town.js)
    if (res.won && STORY.on) {
      noteRemembered(id); // after the ending: the returning fog starts its schedule for this house
      if (res.prize?.badge && !floorsOf(PLACE[id]).up) await findMemento(ui, id, { given: true }); // no upstairs: the owner hands it over
    }
    if (res.next === 'rematch') continue;
    if (res.next === 'reading') await ui.reading(id);
    return res;
  }
}

// The League: LEAGUE.size questions of levels 2 and 3 over all houses; the champion steps aside
// when beaten (what happens next is the quest's: this only sets state.passedLeague).
export async function leagueDuel(ui) {
  const host = STORY.on ? { name: tr(S_WORDS.keeper), look: 'keeper-hood' } : LEAGUE.host || { name: 'Judge', look: 'nurse' };
  for (;;) {
    const picked = leagueQuestions(Q.core, QUESTIONS, LEAGUE.size, shuffle); // the League asks only about the main path (docs/DESIGN.md)
    if (!picked.length) return null;
    const res = await ui.page(() => openDuel({
      kind: 'league', title: STORY.on ? tr(S_WORDS.lighthouse) : LEAGUE.name, skin: SKIN && { ...SKIN, dark: true }, bars: leagueBars(picked.length, LEAGUE.pass), tiers: [picked], pick: (l) => l[0],
      score, place, sprite: sprite(ui), opponent: { name: host.name, look: host.look, lines: (STORY.on ? KEEPER : CHAMPION)[LANG] },
      onEnd: (d) => { if (!d.won) return {}; const p = awardLeague(state); save(); return p; },
    }));
    ui.refreshHUD();
    if (res.won && res.prize?.first && !STORY.on) await ui.stamp(null, 'review'); // the story turns instead
    if (res.next === 'rematch') continue;
    return res;
  }
}

// After the ending, when the fog returns to a house (story/fog.js): a short remembering of two
// right answers with its owner, friendly questions. Resolves with the duel's result.
export async function fogDuel(ui, id, bars) {
  const pool = houseQuestions(id);
  if (!pool.length) return null;
  const m = MASTERS[id];
  return ui.page(() => openDuel({
    kind: 'house', houseId: id, friendly: true, skin: SKIN, upstairs: false, room: PLACE[id].kind, bars, tiers: houseTiers(pool, true), pick: pickQuestion,
    score, place, sprite: sprite(ui), opponent: { name: m.name, look: m.look, lines: linesOf(temperOf(id)) },
    onEnd: () => ({}),
  }));
}
