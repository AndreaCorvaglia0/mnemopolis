// The ambient-life plan of the active course, computed once (the game, check.mjs).
import { TOWN } from '../world/townMap.js';
import { GEN, THEME } from '../gen/core.js';
import { planDressing } from '../gen/dressing.js';
import { planRoom } from '../gen/interior/compose.js';
import { DATA } from '../course/_data.js';
import { PLACES } from '../data/content.js';
import { LIFE } from './config.js';
import { planLife, checkLife } from './plan.js';
import { floorsOf } from './floors/plan.js';

let cache = null;
export const dressingPlan = () => (GEN.dressing ? planDressing() : null);
// the composed rooms of the course (none when the room generator is off: the standard room has no pictures)
export function courseRooms() {
  if (!GEN.interior) return [];
  return PLACES.filter((p) => p.kind !== 'workshop' && p.kind !== 'museum').map((place) => ({ place, L: planRoom(place) }));
}
// the upper floors (mechanics/floors/): a locked closet may go under the roof
export function courseUppers() {
  if (!GEN.interior) return [];
  return PLACES.filter((p) => floorsOf(p).up).map((place) => ({ place, L: planRoom(place, { floor: 'up' }) }));
}
export function lifePlan() {
  if (cache) return cache;
  cache = LIFE.on ? planLife(TOWN, dressingPlan(), THEME, DATA.id, { life: LIFE, places: PLACES.length, rooms: courseRooms(), uppers: courseUppers() }) : { obstacles: [], closets: [], secrets: [], animals: { town: [], inside: [] }, blocked: [] };
  return cache;
}
export const checkActiveLife = () => checkLife(TOWN, dressingPlan(), lifePlan());
