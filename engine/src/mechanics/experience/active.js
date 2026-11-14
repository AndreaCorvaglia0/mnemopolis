// Experience for the active course: the switches, the scale, the tier now, and the lines people say
// about you (lines.js) chosen by tier, stage and what you just did. The scene side is world.js.
//   world.json "experience": false (or ?noxp) switches all of it off: the town as before.
import { DATA, WORLD } from '../../course/_data.js';
import { state, save } from '../../systems/state.js';
import { NPCS } from '../../world/townMap.js';
import { STORY } from '../story/config.js';
import { LIFE, tr, LANG, fill } from '../config.js';
import { Deck } from '../musings/think.js';
import { lifePlan } from '../active.js';
import { scaleOf, tiersOf, tierOf, experienceOf, syncXp, ensureXp, signals, completionOf, tally, atLeast, tierProgress, TIERS } from './model.js';
import { XLINES, GROUP } from './lines.js';
import { withheldFor, assign, pending } from './withheld.js';

const query = (() => { try { return new URLSearchParams(location.search); } catch { return new URLSearchParams(''); } })();
export const XP_ON = WORLD?.experience !== false && !query.has('noxp');
const FORCE = query.has('xpremark'); // pictures: always the tier's remark (scripts/worldshots.mjs)
export const GAMES_ON = WORLD?.games !== false && !query.has('nogames');
export const COURSE_GAMES = GAMES_ON && Array.isArray(DATA.games) ? DATA.games.filter((g) => g && g.id && g.kind) : [];

let SCALE = null;
export function scale() {
  if (SCALE) return SCALE;
  let secrets = 8, obstacles = 2;
  try { const p = lifePlan(); secrets = p.secrets.filter((s) => s.kind !== 'sealed').length || (LIFE.secrets ? 6 : 0); obstacles = p.obstacles.length + p.closets.length; } catch { /* no plan: estimates */ }
  SCALE = scaleOf(DATA, { story: STORY.on, secrets, obstacles, games: COURSE_GAMES.length });
  return SCALE;
}
export const xpNow = () => experienceOf(state);
export const tierNow = () => (XP_ON ? tierOf(state, scale()) : 'arrival');
export const tiers = () => tiersOf(scale());
export const completionNow = () => completionOf(state, scale());
export const progressNow = () => tierProgress(state, scale());
export { TIERS, atLeast };

// Bring the save up to date; a tier change is kept to be announced once (world.js)
export function syncNow(now = Date.now()) {
  if (!XP_ON) return null;
  ensureXp(state);
  const ch = syncXp(state, scale(), now);
  if (ch) { state.xp.announce = ch.tier; (state.xp.notes ||= []).push({ tier: ch.tier, at: now }); save(); }
  return ch;
}

// ---- lines
const deck = new Deck();
const L = (v) => tr(v, LANG);
const draw = (key, v) => deck.draw(`${key}:${LANG}`, L(v));
// a townsperson's first line. stage: cold | thawing | warm (the story), or null in the plain town.
// The stage sets the temperature; the tier sets how they regard you; just now: what you just did.
export function greetLine(stage = null, fallback = null) {
  if (!XP_ON) return fallback;
  const s = signals(state), t = tierNow(), temp = stage === 'cold' ? 'cold' : 'warm';
  if (!FORCE && s.fresh && s.last && XLINES.did[s.last] && Math.random() < 0.6) return draw(`did:${s.last}`, XLINES.did[s.last]);
  // at the arrival the story's own greeting (its stage) carries the scene more often
  if (!FORCE && fallback && Math.random() < (t === 'arrival' ? 0.5 : 0.3)) return fallback;
  return draw(`greet:${t}:${temp}`, XLINES.greet[t][temp]);
}
export function ownerLine(remembered) {
  if (!XP_ON) return null;
  const g = GROUP[tierNow()];
  return draw(`owner:${remembered ? 'after' : 'before'}:${g}`, XLINES.owner[remembered ? 'after' : 'before'][g]);
}
// the owner's first words in a room: a remark about you, then their usual line
export function ownerSay(id, hi) {
  const rem = !!state.stamps?.[id];
  const r = ownerLine(rem);
  if (!r) return hi;
  if (!hi) return r;
  return `${r} ${hi}`.length <= 170 ? `${r} ${hi}` : Math.random() < 0.5 ? r : hi;
}
export const masterLine = () => (XP_ON ? draw(`master:${tierNow()}`, XLINES.master[tierNow()]) : null);
export const purserLine = () => (XP_ON ? draw(`purser:${GROUP[tierNow()]}`, XLINES.purser[GROUP[tierNow()]]) : null);
export const keeperLoopLine = () => (XP_ON ? draw(`kl:${GROUP[tierNow()]}`, XLINES.keeperLoop[GROUP[tierNow()]]) : null);
export const musingLine = () => (XP_ON ? draw(`musing:${tierNow()}`, XLINES.musing[tierNow()]) : null);
export const marginLine = () => { const t = tierNow(); return XP_ON && t !== 'arrival' ? draw(`margin:${t}`, XLINES.margin[t]) : null; };
export const tierWord = (t = tierNow()) => L(XLINES.tierWord[t]);
export const tierNote = (t) => L(XLINES.tierNote[t]);
export const tierUpLine = (t) => L(XLINES.tierUp[t])[0];

// What is still missing, for the keeper on a return: the kinds of thing, vaguely, most missing first
export function missingKinds() {
  const sc = scale(), t = tally(state), out = [];
  if (sc.locks && t.locks < sc.locks) out.push(['locks', 1 - t.locks / sc.locks]);
  if (sc.advanced && t.advanced < sc.advanced) out.push(['upstairs', 1 - t.advanced / sc.advanced]);
  if (sc.secrets && t.secrets < sc.secrets * 0.7) out.push(['secrets', 1 - t.secrets / sc.secrets]);
  if (sc.games && Object.keys(state.xp?.games || {}).length < sc.games) out.push(['games', 0.6]);
  if (sc.houses && t.houses < sc.houses) out.push(['houses', 1 - t.houses / sc.houses]);
  if ((state.xp?.days?.length || 0) < 4) out.push(['days', 0.5]);
  if (state.ended) out.push(['fog', 0.3]);
  return out.sort((a, b) => b[1] - a[1]).map((x) => x[0]);
}
// the keeper when the player climbs again after the ending: the tier, then one kind of thing missing
export function keeperReturnLines() {
  const t = tierNow(), lines = [draw(`kr:${t}`, XLINES.keeperReturn[t])];
  const miss = missingKinds();
  if (miss.length && t !== 'home') lines.push(L(XLINES.missing[miss[0]])[0]);
  return lines;
}

// ---- withheld lines
let WL = null, WHO = null;
export function withheldLines() {
  if (WL) return WL;
  WL = withheldFor(DATA, { story: STORY.on, secrets: LIFE.secrets, musings: LIFE.musings, locks: (DATA.concepts || []).some((c) => (c.riddles || []).length), games: COURSE_GAMES.length > 0, obstacles: LIFE.obstacles });
  return WL;
}
export function whoTells() {
  if (WHO) return WHO;
  // townspeople, and the owners of houses with a remembering (they tell only once they remember):
  // most towns have few people in the lanes, so the owners carry half the lines
  const people = [...NPCS.filter((n) => n.id !== 'champion').map((n) => n.id), ...(DATA.concepts || []).filter((c) => (c.questions || []).length >= 2).map((c) => `host:${c.id}`)];
  WHO = assign(withheldLines(), people, DATA.id);
  return WHO;
}
// what person `key` (an NPC id, or `host:<conceptId>`) would say now: { line, told } or null
export function withheldNow(key) {
  if (!XP_ON) return null;
  const ids = whoTells()[key] || [];
  if (!ids.length) return null;
  if (key.startsWith('host:') && !state.stamps?.[key.slice(5)]) return null; // an owner tells only after remembering
  return pending(state.xp?.told || {}, ids, withheldLines(), tierNow());
}
export const refuseLine = () => draw('refuse', XLINES.refuse);
export const tellLine = () => draw('tell', XLINES.tell);
export const toldList = () => {
  const told = state.xp?.told || {}, byId = Object.fromEntries(withheldLines().map((l) => [l.id, l]));
  return Object.entries(told).filter(([id]) => byId[id]).sort((a, b) => a[1] - b[1]).map(([id, at]) => ({ id, at, text: L(byId[id].told) }));
};
export { XLINES, L as trLine, fill };
