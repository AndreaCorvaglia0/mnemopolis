// The duel of eloquence: the rules, as pure functions (no browser, no Phaser, no state).
// A duel is a skin over the course's questions. Two bars: the opponent's CONVICTION and the
// player's COMPOSURE. One turn = one question. Before answering, the player picks a TONE, which
// is the confidence bet of certainty-based marking under another name:
//   1 murmur    right: the argument lands for 1    wrong: composure -1
//   2 state     right: lands for 2                 wrong: composure -2
//   3 proclaim  right: lands for 3                 wrong: composure -4
// The duel ends when a bar is empty, or when the turns run out: then the fuller bar (as a share
// of its start) wins; on a tie the player wins only with at least the pass share of right answers.
// The numbers are tuned by simulation (tests/duel.test.mjs prints the table).

export const TONES = [1, 2, 3];
export const HIT = [0, 1, 2, 3]; // conviction the opponent loses on a right answer, by tone
export const COST = [0, 1, 2, 4]; // composure the player loses on a wrong answer, by tone

// House duel: first to three "stated" arguments wins; two stated slips are survived, a third is not.
export const HOUSE = { maxTurns: 6, conviction: 7, composure: 5, pass: 2 / 3 };

// The League: LEAGUE.size turns; with every answer "stated", winning means exactly the old pass
// mark (ceil(size * pass) right), and losing means one slip more than the old mark allowed.
export function leagueBars(size, pass) {
  const need = Math.max(1, Math.ceil(size * pass)), slips = Math.max(0, size - need);
  return { conviction: 2 * need, composure: 2 * slips + 1, turns: size, pass };
}

export function houseBars(poolSize) {
  return { conviction: HOUSE.conviction, composure: HOUSE.composure, turns: Math.min(HOUSE.maxTurns, poolSize), pass: HOUSE.pass };
}

// A fresh duel. `turns` is how many questions there are at most.
export function startDuel({ conviction, composure, turns, pass }) {
  return { conviction, composure, max: { conviction, composure }, turns, pass, turn: 0, right: 0, wrong: 0, log: [], over: false, won: null, how: null };
}

// One answer. Returns a new duel; `last` describes what happened (for the screen and the lines).
export function answer(d, right, tone) {
  const t = TONES.includes(tone) ? tone : 2;
  if (d.over) return d;
  const hit = right ? HIT[t] : 0, cost = right ? 0 : COST[t];
  const n = {
    ...d, turn: d.turn + 1, right: d.right + (right ? 1 : 0), wrong: d.wrong + (right ? 0 : 1),
    conviction: Math.max(0, d.conviction - hit), composure: Math.max(0, d.composure - cost),
    log: [...d.log, { right, tone: t, hit, cost }],
  };
  n.last = n.log[n.log.length - 1];
  return settle(n);
}

// Ends the duel if a bar is empty or the turns are used up. `left` = questions still available
// (when the pool runs dry before `turns`, the duel ends the same way).
export function settle(d, left = Infinity) {
  if (d.over) return d;
  if (d.conviction <= 0) return { ...d, over: true, won: true, how: 'conviction' };
  if (d.composure <= 0) return { ...d, over: true, won: false, how: 'composure' };
  if (d.turn >= d.turns || left <= 0) return { ...d, over: true, won: timeWinner(d), how: 'time' };
  return d;
}

// Out of questions: the fuller bar wins. The player's bar is composure; the opponent's is conviction.
export function timeWinner(d) {
  const mine = d.composure / d.max.composure, theirs = d.conviction / d.max.conviction;
  if (Math.abs(mine - theirs) > 1e-9) return mine > theirs;
  return d.turn > 0 && d.right / d.turn >= d.pass - 1e-9;
}

// ---- which questions ----
// House duel: the concept's questions, levels 1 and 2 first, level 3 only to fill. A friendly
// rematch (house already won) puts levels 2 and 3 first. `pick(list, avoid)` chooses within a
// tier (the game passes pickQuestion: unseen first, then missed, then the oldest).
export function houseTiers(pool, friendly = false) {
  const lv = (q) => q.stars || q.level || 1;
  return friendly ? [pool.filter((q) => lv(q) >= 2), pool.filter((q) => lv(q) < 2)] : [pool.filter((q) => lv(q) <= 2), pool.filter((q) => lv(q) > 2)];
}

export function nextQuestion(tiers, asked, pick = (l) => l[0]) {
  const ids = asked.map((q) => q.id ?? q);
  for (const tier of tiers) {
    const left = tier.filter((q) => !ids.includes(q.id));
    if (left.length) return pick(left, ids);
  }
  return null;
}

// The League: levels 2 and 3, spread over all houses in rounds (one from each house, then a
// second from each...), shuffled so that districts alternate. `shuffle` is injected.
export function leagueQuestions(places, questions, size, shuffle = (a) => a) {
  const byPlace = places.map((p) => shuffle(questions.filter((q) => q.topic === p.id && (q.stars || 1) >= 2))), picked = [];
  for (let round = 0; picked.length < size && byPlace.some((l) => l.length > round); round++) for (const l of byPlace) if (l[round] && picked.length < size) picked.push(l[round]);
  return shuffle(picked);
}

// ---- feedback ----
// What the opponent's rebuttal is built from: the trap of the chosen option (why it tempts) when
// the course names one, the right option, and the question's explanation (why).
export function feedback(q, choice) {
  const right = choice === q.answer;
  const trap = !right && Array.isArray(q.traps) && typeof q.traps[choice] === 'string' && q.traps[choice].trim() ? q.traps[choice].trim() : null;
  return { right, trap, chosen: q.options[choice], correct: q.options[q.answer], why: q.why || null };
}

// The ideas to look at again after a lost duel: the topics of the missed questions, most missed first.
export function missedTopics(asked, results) {
  const n = {};
  asked.forEach((q, i) => { if (results[i] === false) n[q.topic] = (n[q.topic] || 0) + 1; });
  return Object.entries(n).sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

// Coins in a duel: the certainty-based reward for a right answer, nothing taken for a wrong one
// (the cost of a wrong answer in a duel is composure, not coins).
export const duelDelta = (rawDelta) => Math.max(0, rawDelta);

// ---- simulation (used by the tests and to tune the numbers) ----
// A learner whose chance of being right on a question is p_q, drawn around p (a Beta with
// concentration k); a calibrated learner feels p_q and picks the tone that pays, others follow a
// fixed policy. rnd: a random source in [0, 1).
export const POLICIES = {
  state: () => 2,
  murmur: () => 1,
  reckless: () => 3,
  calibrated: (pq) => (pq >= 0.75 ? 3 : pq >= 0.45 ? 2 : 1),
};

function gamma(k, rnd) { // Marsaglia and Tsang, k >= 1 (k < 1 by boosting)
  if (k < 1) return gamma(k + 1, rnd) * rnd() ** (1 / k);
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v;
    do { const u1 = rnd() || 1e-12, u2 = rnd(); x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); v = 1 + c * x; } while (v <= 0);
    v = v * v * v;
    const u = rnd();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
const beta = (a, b, rnd) => { const x = gamma(a, rnd); return x / (x + gamma(b, rnd)); };

export function simulate({ bars, p, policy = 'state', runs = 4000, k = 4, rnd = Math.random }) {
  const pol = POLICIES[policy];
  let wins = 0, turns = 0, longest = 0;
  for (let r = 0; r < runs; r++) {
    let d = startDuel(bars);
    while (!d.over) {
      const pq = p >= 1 ? 1 : p <= 0 ? 0 : beta(p * k, (1 - p) * k, rnd);
      d = answer(d, rnd() < pq, pol(pq));
    }
    if (d.won) wins += 1;
    turns += d.turn;
    longest = Math.max(longest, d.turn);
  }
  return { win: wins / runs, turns: turns / runs, longest };
}

// A small seeded random source for reproducible simulations.
export function mulberry(seed = 1) {
  let a = seed >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
