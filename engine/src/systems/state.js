// Game state with a small localStorage save. Storage can be unavailable, so every access is guarded.
import { COURSE } from '../course/course.js';

const KEY = `mnemopolis-${COURSE.id}`;

const fresh = () => ({
  pos: null,
  insight: 0,
  stamps: {}, // place id -> true once its house quiz is passed
  visited: {}, // place id -> true once the player has opened its lab or timeline
  done: {}, // 'place:station' -> true once the takeaway of a lab station was reached
  passedLeague: false,
  predicted: {},
  seenIntro: false,
  passedReview: false,
  q: {}, // id -> { seen, right, last }
  bets: { 1: [0, 0], 2: [0, 0], 3: [0, 0] }, // confidence -> [right, total]
  steps: 0,
  musicOff: false,
  voiceOff: false, // read-aloud switched off by the player (only when the course has a voice)
  grassOff: false, // tall-grass questions switched off by the player
  // ambient life (src/mechanics/): secrets found and paw prints of the trail (no points, no progress),
  // obstacles opened, tools carried (none can be had yet: they will come from a shop)
  life: { found: {}, prints: {} },
  opened: {},
  tools: {},
  // the main path (src/mechanics/quest/): keys of upper floors (won in duels), the ending seen, places
  // seen from nearby (the town map shows them), seconds played, townsfolk who already congratulated
  keys: {},
  ended: false,
  seen: {},
  played: 0,
  cheered: {},
});

export const state = fresh();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) Object.assign(state, fresh(), JSON.parse(raw));
  } catch (e) { /* no storage: play without saving */ }
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

export function reset() {
  Object.assign(state, fresh());
  save();
}

export const stampCount = () => Object.values(state.stamps).filter(Boolean).length;

// Certainty-based marking (Gardner-Medwin): right = +1/+2/+3, wrong = 0/-2/-6, scaled by difficulty
export function scoreAnswer(question, right, confidence) {
  const marks = right ? confidence : [0, 0, -2, -6][confidence];
  const delta = marks * question.stars * 5;
  const s = state.q[question.id] || { seen: 0, right: 0, last: 0 };
  s.seen += 1;
  if (right) s.right += 1;
  s.last = Date.now();
  state.q[question.id] = s;
  const b = state.bets[confidence];
  b[1] += 1;
  if (right) b[0] += 1;
  state.insight = Math.max(0, state.insight + delta);
  save();
  return delta;
}

// Prefer questions never seen, then those answered wrong, then the oldest.
export function pickQuestion(pool, avoid = []) {
  const scored = pool.filter((q) => !avoid.includes(q.id)).map((q) => {
    const s = state.q[q.id];
    let w = !s ? 3 : s.right < s.seen ? 2 : 1;
    if (s) w += Math.min(1, (Date.now() - s.last) / 600000);
    return [q, w + Math.random() * 1.2];
  });
  scored.sort((a, b) => b[1] - a[1]);
  return scored.length ? scored[0][0] : pool[0];
}
