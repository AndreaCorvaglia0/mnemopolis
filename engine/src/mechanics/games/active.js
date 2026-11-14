// The mini-games of the active course: which are open, where they are, and playing one.
//   GAMES                         the course's games (none when world.json "games": false)
//   isOpen(g)                     the concepts it practises have been met (remembered, or labs done)
//   townGames(), gameOfPerson(id), hostGames(conceptId)
//   playGame(ui, g)               opens the frame as a page (the music ducks, the game pauses)
import { state, save } from '../../systems/state.js';
import { DATA } from '../../course/_data.js';
import { GAME_CODE, LOADED } from '../../course/_active.js';
import { TOWN, NPCS } from '../../world/townMap.js';
import { LANG } from '../config.js';
import { Q } from '../quest/active.js';
import { lifeContext } from '../context.js';
import { lifePlan, dressingPlan } from '../active.js';
import { COURSE_GAMES, GAMES_ON, xpNow, syncNow } from '../experience/active.js';
import { planGames, gamePeople, unlocked } from './place.js';
import { openGame } from './frame.js';
import { KIND_MOUNTS } from './kinds/index.js';

export const GAMES = COURSE_GAMES;
export const byId = Object.fromEntries(GAMES.map((g) => [g.id, g]));
const info = (id) => {
  const r = Q.progress(state).find((x) => x.id === id);
  if (!r) return null;
  return { remembered: r.won || (!r.duel && r.visited && r.n >= r.m), labDone: r.visited && r.n >= r.m };
};
export const isOpen = (g) => unlocked(g, state, info);

let PLAN = null, PEOPLE = null;
export function townGames() {
  if (PLAN) return PLAN;
  if (!GAMES_ON || !GAMES.length) return (PLAN = []);
  const lp = lifePlan(), c = lifeContext(TOWN, dressingPlan());
  const used = new Set(), solid = c.solid.slice();
  for (const [x, y] of lp.blocked || []) solid[c.I(x, y)] = 1;
  for (const s of lp.secrets) if (s.x != null && !s.room) used.add(`${s.x},${s.y}`);
  for (const a of lp.animals?.town || []) for (const [x, y] of a.spots || []) used.add(`${x},${y}`);
  for (const o of lp.obstacles) for (const [x, y] of [...o.tiles, ...(o.pocket || []), o.stand]) used.add(`${x},${y}`);
  PLAN = planGames(c, GAMES, DATA.id, { used, solid });
  return PLAN;
}
const people = () => NPCS.filter((n) => n.id !== 'champion' && n.id !== 'guide').map((n) => n.id);
export function gamesOfPeople() { return (PEOPLE ||= gamePeople(GAMES, people().length ? people() : ['guide'], DATA.id, townGames())); }
export const gameOfPerson = (npcId) => GAMES.find((g) => gamesOfPeople()[g.id] === npcId) || null;
export const hostGames = (conceptId) => GAMES.filter((g) => g.where === 'host' && g.concepts?.[0] === conceptId);

export async function playGame(ui, g) {
  await LOADED;
  const res = await ui.page(() => openGame(g, {
    state, lang: LANG, save, kinds: KIND_MOUNTS, custom: GAME_CODE, experience: xpNow,
    fast: typeof location !== 'undefined' && /[?&]fastgames\b/.test(location.search),
  }));
  syncNow();
  ui.refreshHUD?.();
  return res;
}
// the list for the notebook's Clues: games found (seen, offered or played), with the best score
export function gamesFound() {
  const xg = state.xp?.games || {}, seen = state.xp?.gamesSeen || {};
  return GAMES.filter((g) => xg[g.id] || seen[g.id]).map((g) => ({ id: g.id, title: g.title, best: xg[g.id]?.best || 0, plays: xg[g.id]?.plays || 0 }));
}
export function markSeen(id) { const x = (state.xp ||= {}); x.gamesSeen ||= {}; if (!x.gamesSeen[id]) { x.gamesSeen[id] = Date.now(); save(); } }
