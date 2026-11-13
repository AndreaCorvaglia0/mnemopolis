// The split of a house's lab stations between the ground floor and the upper floor, for the active
// course. The ground stations are THE stations of a house: the lab on the ground floor, the main
// path's "lab n/m" count and the tour use only them (course/labs.js builds LABS from them);
// stations marked "advanced" live upstairs (course/labs.js: UPPER_LABS).
//   groundStations(placeId)     the station objects of course.json, in order
//   advancedStations(placeId)
import { DATA } from '../../course/_data.js';
import { isGround } from './plan.js';

const stationsOf = (id) => DATA.concepts.find((p) => p.id === id)?.lab?.stations || [];
export const groundStations = (id) => stationsOf(id).filter(isGround);
export const advancedStations = (id) => stationsOf(id).filter((s) => !isGround(s));
