// The main path: which concepts are core, how far the player is, and the ONE next step. Pure: no
// browser, no Phaser; Node tests drive it over whole games (tests/quest.test.mjs).
//
// Every hint of the game comes from nextStep(): the tracker, the mark over a house, what people say,
// the thoughts aloud, the Journey tab of the menu, the "next" tag of the mind map.
//
//   const Q = questOf({ places, guide, champion })     any course (tests, synthetic towns)
//   import { Q } from './active.js'                    the active course (the game)
//
// A place is the engine's view of a concept (data/content.js PLACES): { id, order, name, kind,
// core, lab: { stations }, questions, host: { name } }. Only `id` and `order` are required.
//
// Rules (docs/DESIGN.md, "Main story"):
//   core       a concept is core unless course.json says "core": false; core houses gate the League
//   duel       a house has a duel when its host can be challenged: every room has a host (the
//              workshop's and the museum's too), so it is a matter of questions: at least two
//              (the host offers the challenge from two). Change hasDuel only.
//   done       a house with a duel: its badge (state.stamps[id]). A house without one (fewer than two
//              questions): visited, and every lab station finished if it has a lab. A badge always counts, whatever the house.
//   steps      intro -> for each core house in path order: visit -> lab (n/m) -> duel
//              -> league -> ending -> free (after state.ended)
//   story      with `mementos` (docs/STORY.md: a set of house ids), a house is done only once its
//              memento is found upstairs (state.story.mementos[id]); its step comes after the duel
export const MIN_DUEL_QUESTIONS = 2;

export const isCore = (p) => p.core !== false;
// the ground-floor stations only: "advanced" ones live upstairs and are not part of the main path
// (mechanics/floors/, the same split as LABS in course/labs.js)
export const stationsOf = (p) => p.lab?.stations?.filter((st) => !st.advanced).length || 0;
export const hasDuel = (p) => (p.questions?.length || 0) >= MIN_DUEL_QUESTIONS;

export function questOf({ places, guide = 'the guide', champion = 'the champion', mementos = null }) {
  const all = [...places].sort((a, b) => a.order - b.order);
  // a course that marks nothing has everything core; one that marks everything extra is not valid,
  // but the game must not get stuck: then everything is core
  const core = all.some(isCore) ? all.filter(isCore) : all;
  const extra = all.filter((p) => !core.includes(p));
  const byId = Object.fromEntries(all.map((p) => [p.id, p]));

  // per place: what the player has done there
  function placeProgress(p, s) {
    const m = stationsOf(p), n = Array.from({ length: m }, (_, i) => !!s.done?.[`${p.id}:${i}`]).filter(Boolean).length;
    const visited = !!s.visited?.[p.id], duel = hasDuel(p), won = !!s.stamps?.[p.id];
    const memento = !!mementos?.has(p.id), found = memento && !!s.story?.mementos?.[p.id];
    const done = (won || (!duel && visited && n >= m)) && (!memento || found);
    return { id: p.id, place: p, order: p.order, core: core.includes(p), visited, n, m, duel, won, key: !!s.keys?.[p.id], done, memento, found };
  }
  const progress = (s) => all.map((p) => placeProgress(p, s));
  const coreProgress = (s) => core.map((p) => placeProgress(p, s));
  const missing = (s) => coreProgress(s).filter((r) => !r.done);
  const leagueOpen = (s) => missing(s).length === 0;

  // ctx.inside: the id of the room the player is in (the tracker says "Do the lab" there, not "go to")
  function nextStep(s, ctx = {}) {
    if (s.ended) return { kind: 'free' };
    if (!s.seenIntro) return { kind: 'intro', person: guide };
    for (const r of coreProgress(s)) {
      if (r.done) continue;
      const p = r.place, here = ctx.inside === p.id;
      const base = { place: p, order: p.order, here };
      if (r.won && r.memento && !r.found) return { kind: 'memento', ...base, here: ctx.inside === `${p.id}+up` }; // remembered: upstairs, whatever else
      if (!r.visited && !(here && r.m)) return { kind: 'visit', ...base };
      if (r.n < r.m) return { kind: 'lab', ...base, n: r.n, m: r.m };
      if (r.duel && !r.won) return { kind: 'duel', ...base, person: p.host?.name || p.expert?.name || 'the host' };
      if (r.memento && !r.found) return { kind: 'memento', ...base, here: ctx.inside === `${p.id}+up` };
      return { kind: 'visit', ...base }; // not reached: a house without a duel is done once visited with its lab finished
    }
    if (!s.passedLeague) return { kind: 'league', person: champion };
    return { kind: 'ending', person: champion };
  }

  // a step as a short stable key: the tracker highlights itself when it changes
  const stepKey = (st) => [st.kind, st.place?.id, st.n, st.m, st.here].join(':');

  return { all, core, extra, byId, placeProgress, progress, coreProgress, missing, leagueOpen, nextStep, stepKey,
    corePlaces: () => core, extraPlaces: () => extra };
}
