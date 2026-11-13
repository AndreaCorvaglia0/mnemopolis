// The story (docs/STORY.md): switched on by default; `"story": false` in world.json gives the plain
// town. Node-safe.
//
// world.json:
//   "story": false                                 the plain town, exactly as without the story
//   "story": { "word": "three" }                   the word for the lighthouse door (else from the big idea)
//   "story": { "ship": false }                     no quay and no ship (the town keeps its gate, if any)
// The address: ?story=0 switches it off for a test; ?days=N moves the clock N days on (the fog).
import { DATA, WORLD } from '../../course/_data.js';
import { tr, fill, LANG } from '../config.js';

export { tr, fill, LANG };

const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();

export function storyConfig(world = WORLD, query = q) {
  const s = world?.story;
  if (s === false || query.get('story') === '0') return { on: false };
  const o = s && typeof s === 'object' ? s : {};
  return { on: true, ship: o.ship !== false, word: typeof o.word === 'string' && o.word.trim() ? o.word.trim() : null };
}
export const STORY = storyConfig();

// a debug clock for the fog: ?days=3 moves "now" three days ahead
export const DAY = 86400000;
export const now = () => Date.now() + (Number(q.get('days')) || 0) * DAY;

export const COURSE_DATA = DATA;
