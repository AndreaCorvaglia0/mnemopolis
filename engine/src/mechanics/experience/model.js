// Experience: everything the player has done, as one number that never goes down (docs/GAME.md,
// "Experience, and a world that notices"). Pure: no browser, no Phaser; tests/experience.test.mjs.
//
//   ensureXp(state)                 the save's own part, state.xp (old saves: earned starts at insight)
//   syncXp(state, scale, now)       bring it up to date: coins earned, days, the last notable thing;
//                                   returns { tier, from } when the tier just changed
//   experienceOf(state)             the number
//   scaleOf(course, opts)           what the course offers, from course.json (the thresholds scale with it)
//   tiersOf(scale)                  [{ id, at }] in order
//   tierOf(state, scale)            'arrival' | 'passing' | 'settling' | 'known' | 'home'
//   completionOf(state, scale)      the share of the optional things done (0..1), for the endings
//   signals(state, now)             cheap signals: minutes played, houses remembered, streak of days,
//                                   what was just done and how long ago

export const TIERS = ['arrival', 'passing', 'settling', 'known', 'home'];
export const tierIndex = (t) => Math.max(0, TIERS.indexOf(t));
export const atLeast = (t, min) => tierIndex(t) >= tierIndex(min);

// what each thing is worth, beyond the coins it paid (references/10-games.md has the same table)
export const XP = { house: 50, station: 8, advanced: 25, memento: 15, lock: 40, secret: 15, obstacle: 20, gameCap: 40, fog: 30, day: 20, keeper: 100 };

const count = (o) => (o ? Object.values(o).filter(Boolean).length : 0);
export const dayKey = (now) => { const d = new Date(now); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function ensureXp(s) {
  if (!s.xp || typeof s.xp !== 'object') s.xp = {};
  const x = s.xp;
  if (typeof x.earned !== 'number') { x.earned = Math.max(0, s.insight || 0); x.seen = s.insight || 0; } // old saves: everything held was earned
  if (typeof x.seen !== 'number') x.seen = s.insight || 0;
  x.days ||= []; x.told ||= {}; x.teased ||= {}; x.games ||= {};
  x.tier ||= 'arrival';
  return x;
}

// the counts that experience and the notable things are made of
export function tally(s) {
  const done = Object.keys(s.done || {}).filter((k) => s.done[k]);
  const st = s.story || {}, fog = st.fog || {};
  return {
    houses: count(s.stamps),
    stations: done.filter((k) => !k.includes('+up:')).length,
    advanced: done.filter((k) => k.includes('+up:')).length,
    mementos: count(st.mementos),
    locks: count(s.locks),
    secrets: count(s.life?.found),
    obstacles: count(s.opened),
    games: Object.values(s.xp?.games || {}).reduce((a, g) => a + (g.plays || 0), 0),
    gameBest: Object.values(s.xp?.games || {}).reduce((a, g) => a + Math.min(XP.gameCap, g.best || 0), 0),
    fog: Object.values(fog).reduce((a, e) => a + (e?.n || 0), 0) + (s.xp?.fogCleared || 0),
    days: Math.max(0, (s.xp?.days?.length || 1) - 1),
    keeper: s.passedLeague ? 1 : 0,
    told: count(s.xp?.told),
  };
}

export function earnedOf(s) {
  const x = s.xp || {};
  return (typeof x.earned === 'number' ? x.earned : s.insight || 0) + Math.max(0, (s.insight || 0) - (x.seen ?? s.insight ?? 0));
}

export function experienceOf(s) {
  const t = tally(s);
  return Math.max(s.xp?.max || 0, Math.round(earnedOf(s) + t.houses * XP.house + t.stations * XP.station + t.advanced * XP.advanced + t.mementos * XP.memento
    + t.locks * XP.lock + t.secrets * XP.secret + t.obstacles * XP.obstacle + t.gameBest + t.fog * XP.fog + t.days * XP.day + t.keeper * XP.keeper));
}

// What a course offers, from course.json. opts: { story, secrets (expected in town), obstacles, games }
export function scaleOf(course, { story = true, secrets = 8, obstacles = 2, games = null } = {}) {
  const cs = course?.concepts || [];
  let coins = 0, houses = 0, stations = 0, advanced = 0, locks = 0, core = 0;
  for (const c of cs) {
    const qs = c.questions || [];
    coins += qs.reduce((a, q) => a + 10 * (q.level || 1), 0);
    if (qs.length >= 2) houses += 1;
    const st = c.lab?.stations || [];
    stations += st.filter((x) => !x.advanced).length;
    advanced += st.filter((x) => x.advanced).length;
    locks += (c.riddles || []).length;
    if (c.core !== false) core += 1;
  }
  coins += (course?.finalCheck?.size || 0) * 20;
  const g = games ?? (course?.games || []).length;
  const first = cs.find((c) => c.core !== false) || cs[0];
  const firstHouse = first ? (first.lab?.stations || []).filter((x) => !x.advanced).length * XP.station + XP.house + 40 : 100;
  const full = coins + houses * XP.house + stations * XP.station + advanced * XP.advanced + (story ? core * XP.memento : 0) + locks * XP.lock
    + secrets * XP.secret + obstacles * XP.obstacle + g * 30 + XP.keeper;
  return { full, firstHouse, coins, houses, stations, advanced, locks, core, games: g, secrets, obstacles, concepts: cs.length };
}

// Thresholds: the first change comes inside the first house; the top needs about everything plus
// a few days of practice. Never two tiers at the same number.
export function tiersOf(scale) {
  const F = Math.max(200, scale.full);
  const passing = Math.round(Math.max(20, Math.min(0.045 * F, scale.firstHouse * 0.5)));
  const settling = Math.max(passing + 20, Math.round(0.22 * F));
  const known = Math.max(settling + 20, Math.round(0.5 * F));
  const home = Math.max(known + 20, Math.round(0.9 * F) + 3 * XP.day);
  return [{ id: 'arrival', at: 0 }, { id: 'passing', at: passing }, { id: 'settling', at: settling }, { id: 'known', at: known }, { id: 'home', at: home }];
}
export function tierOfXp(xp, scale) {
  let t = 'arrival';
  for (const x of tiersOf(scale)) if (xp >= x.at) t = x.id;
  return t;
}
export const tierOf = (s, scale) => tierOfXp(experienceOf(s), scale);
// how far into the current tier (0..1): for the notebook's drawn mark, never shown as a number
export function tierProgress(s, scale) {
  const xp = experienceOf(s), ts = tiersOf(scale), i = tierIndex(tierOfXp(xp, scale));
  if (i >= ts.length - 1) return 1;
  return Math.max(0, Math.min(1, (xp - ts[i].at) / (ts[i + 1].at - ts[i].at)));
}

// The share of the optional things done: extra houses, locks, advanced stations, secrets, games
// played, fog cleared. The endings (planned) read it with the tier.
export function completionOf(s, scale) {
  const t = tally(s);
  const extraHouses = Math.max(0, scale.houses - scale.core);
  const parts = [
    [Math.min(t.houses, scale.houses) - Math.min(t.houses, scale.core), extraHouses],
    [t.locks, scale.locks], [t.advanced, scale.advanced], [t.secrets, scale.secrets],
    [Math.min(Object.keys(s.xp?.games || {}).length, scale.games), scale.games], [Math.min(t.fog, 2), s.ended ? 2 : 0],
  ].filter(([, of]) => of > 0);
  if (!parts.length) return 1;
  return parts.reduce((a, [n, of]) => a + Math.min(1, Math.max(0, n) / of), 0) / parts.length;
}

// The notable thing just done: compare a snapshot of the counts with the last one.
const NOTABLE = ['keeper', 'houses', 'mementos', 'locks', 'advanced', 'obstacles', 'secrets', 'told', 'games', 'stations'];
export const WHAT = { keeper: 'keeper', houses: 'remembered', mementos: 'memento', locks: 'lock', advanced: 'advanced', obstacles: 'obstacle', secrets: 'secret', told: 'told', games: 'game', stations: 'station' };
export function noticeOf(prev, now) {
  if (!prev) return null;
  for (const k of NOTABLE) if ((now[k] || 0) > (prev[k] || 0)) return WHAT[k];
  return null;
}

// Bring state.xp up to date. Returns { tier, from } when the tier changed since the last call that
// announced one (the caller announces it once), else null.
export function syncXp(s, scale, now = Date.now()) {
  const x = ensureXp(s);
  const ins = s.insight || 0;
  if (ins > x.seen) x.earned += ins - x.seen;
  x.seen = ins; // spending (later: a shop) lowers insight and never experience
  const day = dayKey(now);
  if (x.days[x.days.length - 1] !== day) { x.days.push(day); if (x.days.length > 400) x.days.splice(0, x.days.length - 400); }
  const t = tally(s), what = noticeOf(x.snap, t);
  if (what) x.last = { what, at: now };
  x.snap = t;
  x.max = experienceOf(s); // never goes down, whatever happens to the counts (a fog restarted, a reset part)
  const tier = tierOf(s, scale);
  if (tierIndex(tier) > tierIndex(x.tier)) { const from = x.tier; x.tier = tier; return { tier, from }; }
  return null;
}

// streak: consecutive days up to the last one played
export function streakOf(days = []) {
  if (!days.length) return 0;
  let n = 1;
  for (let i = days.length - 1; i > 0; i--) {
    const a = Date.parse(`${days[i - 1]}T12:00:00`), b = Date.parse(`${days[i]}T12:00:00`);
    if (Math.round((b - a) / 86400000) === 1) n += 1; else break;
  }
  return n;
}
export function signals(s, now = Date.now()) {
  const x = s.xp || {}, t = tally(s);
  return {
    minutes: Math.round((s.played || 0) / 60), houses: t.houses, streak: streakOf(x.days || []), days: (x.days || []).length,
    last: x.last?.what || null, ago: x.last ? (now - x.last.at) / 1000 : Infinity,
    fresh: !!x.last && now - x.last.at < 4 * 60 * 1000, // "just": within four minutes
  };
}
