// The duels in the game: a house duel with its host (Interior.quizSeries) and the League
// (UI.league). Rules in rules.js (pure), the screen in screen.js, words in lines.js, tempers in
// tempers.js, what winning gives in prize.js.
import { state, save, scoreAnswer, pickQuestion } from '../../systems/state.js';
import { PLACE, PLACES, QUESTIONS, LEAGUE, MASTERS } from '../../data/content.js';
import { DATA } from '../../course/_data.js';
import { seeded } from '../../gen/core.js';
import { LANG } from '../config.js';
import { TEMPERS, CHAMPION, temperFor } from './tempers.js';
import { houseBars, leagueBars, houseTiers, leagueQuestions, duelDelta } from './rules.js';
import { awardHouse, awardLeague, isFriendly } from './prize.js';
import { openDuel } from './screen.js';
import { CHALLENGE } from './lines.js';
import { floorsOf } from '../floors/plan.js';

// The temper of a house: `expert.temper` in course.json if it names one, else seeded by the place.
export function temperOf(id) {
  const c = DATA.concepts.find((x) => x.id === id);
  return temperFor(c?.expert?.temper, seeded(`${id}:temper`));
}

// Coins: the certainty-based reward when right; a wrong answer takes no coins in a duel (its cost
// is composure). The question history and the bet statistics are kept by scoreAnswer as usual.
function score(q, right, tone) {
  const before = state.insight, raw = scoreAnswer(q, right, tone);
  if (raw < 0) { state.insight = before; save(); }
  return duelDelta(raw);
}

const place = (id) => { const p = PLACE[id]; return p && { order: p.order, name: p.name, concept: p.concept }; };
const sprite = (ui) => (look) => { const t = ui.textures.get(`ch-${look}`); return t && t.key !== '__MISSING' ? t.getSourceImage() : null; };
function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

export const houseQuestions = (id) => QUESTIONS.filter((q) => q.topic === id);

// The label of the host's dialogue option.
export const challengeLabel = (id) => CHALLENGE[LANG][isFriendly(state, id) ? 'friendly' : 'first'];

// A duel with the host of house `id`. Rematches loop here; Esc or "Not now" ends it.
export async function houseDuel(ui, id) {
  const pool = houseQuestions(id);
  if (!pool.length) return null;
  const m = MASTERS[id], lines = TEMPERS[temperOf(id)][LANG];
  for (;;) {
    const friendly = isFriendly(state, id);
    const res = await ui.page(() => openDuel({
      kind: 'house', houseId: id, friendly, upstairs: floorsOf(PLACE[id]).up, room: PLACE[id].kind, bars: houseBars(pool.length), tiers: houseTiers(pool, friendly), pick: pickQuestion,
      score, place, sprite: sprite(ui), opponent: { name: m.name, look: m.look, lines },
      onEnd: (d) => { if (!d.won) return {}; const p = awardHouse(state, id); save(); return p; },
    }));
    ui.refreshHUD();
    if (res.won && res.prize?.badge) await ui.stamp(id);
    if (res.next === 'rematch') continue;
    if (res.next === 'reading') await ui.reading(id);
    return res;
  }
}

// The League: LEAGUE.size questions of levels 2 and 3 over all houses; the champion steps aside
// when beaten (what happens next is the quest's: this only sets state.passedLeague).
export async function leagueDuel(ui) {
  const host = LEAGUE.host || { name: 'Judge', look: 'nurse' };
  for (;;) {
    const picked = leagueQuestions(PLACES, QUESTIONS, LEAGUE.size, shuffle);
    if (!picked.length) return null;
    const res = await ui.page(() => openDuel({
      kind: 'league', title: LEAGUE.name, bars: leagueBars(picked.length, LEAGUE.pass), tiers: [picked], pick: (l) => l[0],
      score, place, sprite: sprite(ui), opponent: { name: host.name, look: host.look, lines: CHAMPION[LANG] },
      onEnd: (d) => { if (!d.won) return {}; const p = awardLeague(state); save(); return p; },
    }));
    ui.refreshHUD();
    if (res.won && res.prize?.first) await ui.stamp(null, 'review');
    if (res.next === 'rematch') continue;
    return res;
  }
}
