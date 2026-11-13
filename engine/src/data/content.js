// Views of the course database that the scenes use. Do not write content here: edit src/course/course.js.
import { COURSE } from '../course/course.js';
import { introLines } from '../mechanics/quest/strings.js';

export { COURSE };
export const DISTRICTS = COURSE.districts;
// every place, in learning order, with its district and its house number
export const PLACES = DISTRICTS.flatMap((d) => d.places.map((p) => ({ ...p, district: d }))).map((p, i) => ({ ...p, order: i + 1 }));
export const PLACE = Object.fromEntries(PLACES.map((p) => [p.id, p]));

export const TOPICS = Object.fromEntries(PLACES.map((p) => [p.id, { name: p.name, card: p.concept }]));

// level 1 = a key fact to remember (review meadows); levels 2 and 3 = use it (house quiz and league)
export const QUESTIONS = PLACES.flatMap((p) => (p.questions || []).map((q, i) => ({ ...q, id: `${p.id}-${i}`, topic: p.id, stars: q.level || 1 })));

export const MASTERS = Object.fromEntries(PLACES.map((p) => [p.id, { name: p.host?.name || 'Host', look: p.host?.look || 'tech', hi: p.host?.hi || p.idea, stamp: `${p.name}: stamped. ${p.idea}` }]));

const g = COURSE.hub.guide;
export const TALK = { guide: { hi: g.hi, options: g.options || [] }, ...Object.fromEntries(DISTRICTS.filter((d) => d.resident).map((d) => [`res-${d.id}`, { hi: d.resident.hi, options: d.resident.options || [] }])) };

export const DIALOG = {
  // the guide's first speech: the goal of the game in three lines, then the first house of the main path
  intro: introLines(PLACES.find((p) => p.core !== false) || PLACES[0], COURSE.title),
  closedHome: ['Nobody answers.'],
};

export const LEAGUE = COURSE.league;
