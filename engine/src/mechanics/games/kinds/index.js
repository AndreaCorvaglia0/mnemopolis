// The ready kinds of mini-games, by name (references/10-games.md). Each is a mount on the frame's
// context, the same as a course's custom game.
import which from './which.js';
import matchFast from './match.js';
import sortFast from './sort.js';
import odd from './odd.js';
import sequence from './sequence.js';
import estimate from './estimate.js';

export const KIND_MOUNTS = { which, 'match-fast': matchFast, 'sort-fast': sortFast, 'odd-one-out': odd, sequence, estimate };
