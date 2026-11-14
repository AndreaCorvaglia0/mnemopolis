// Mini-games: scoring, the difficulty staircase and the saved bests. Pure (tests/games.test.mjs).
//
//   level 0..1 comes from a staircase of STEPS steps: one step harder after two right in a row,
//   one easier after a miss. A new session starts one step below where the last one ended.
//   Points of a round: 2 for right, up to 4 more by difficulty, +1 quick, +1 per round of a streak
//   of three or more (at most +3). Nothing is ever lost. Coins = points, halved from the fourth
//   play of the same game on the same day.

export const STEPS = 6;
export const levelOf = (step) => Math.max(0, Math.min(STEPS, step)) / STEPS;
export const lerp = (r, level) => (Array.isArray(r) ? r[0] + (r[1] - r[0]) * level : r);

export function stairStart(saved) { return { step: Math.max(0, Math.round((saved?.step ?? 0) - 1)), run: 0 }; }
export function stairNext(st, right) {
  if (right) { const run = st.run + 1; return run >= 2 ? { step: Math.min(STEPS, st.step + 1), run: 0 } : { step: st.step, run }; }
  return { step: Math.max(0, st.step - 1), run: 0 };
}

export function roundPoints({ right, level = 0, fast = false, streak = 0, weight = 1 }) {
  if (!right) return 0;
  return Math.round((2 + Math.round(4 * level) + (fast ? 1 : 0) + (streak >= 3 ? Math.min(3, streak - 2) : 0)) * weight);
}

// a play of `rounds` rounds: feed results one by one
export function play(rounds, saved = null) {
  const p = { rounds, n: 0, score: 0, right: 0, streak: 0, best: 0, stair: stairStart(saved), log: [] };
  p.level = () => levelOf(p.stair.step);
  p.result = (right, { fast = false, weight = 1 } = {}) => {
    const level = p.level();
    p.streak = right ? p.streak + 1 : 0;
    p.best = Math.max(p.best, p.streak);
    const pts = roundPoints({ right, level, fast, streak: p.streak, weight });
    p.score += pts; p.right += right ? 1 : 0; p.n += 1;
    p.stair = stairNext(p.stair, right);
    p.log.push({ right, level, pts });
    return pts;
  };
  p.over = () => p.n >= p.rounds;
  return p;
}

export const coinsFor = (score, playsToday = 0) => (playsToday >= 3 ? Math.floor(score / 2) : score);

// save of one game: { best, plays, step, day, today } ; returns { best: new best?, coins }
export function recordPlay(games, id, { score, step }, day) {
  const g = (games[id] ||= { best: 0, plays: 0, step: 0, day: null, today: 0 });
  if (g.day !== day) { g.day = day; g.today = 0; }
  const coins = coinsFor(score, g.today);
  const isBest = score > g.best;
  g.best = Math.max(g.best, score); g.plays += 1; g.today += 1; g.step = step;
  return { best: isBest, coins, prev: isBest ? null : g.best };
}
