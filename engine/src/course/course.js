// The engine's view of the active course. Content comes from courses/<slug>/course.json (the
// knowledge base). Everything about the world that the knowledge base does not say is DERIVED
// here, and can be overridden by an optional courses/<slug>/world.json:
//   { "hub": { "name", "monument", "guide": { "name", "look", "hi" } },
//     "places": { "<conceptId>": { "kind", "host": { "name", "look", "hi" } } },
//     "themes": { "<themeId>": { "nature", "landmark" } }, "finalCheckHost": { "name", "look" },
//     "homes": "auto", "next": { "title": "<next course>", "url": "https://..." } }
// "next" names the town the ending card offers to go on to (mechanics/quest/ending.js).
// "voice" (read aloud) is read by systems/voice.js, "gen" and "theme" by gen/core.js.
import { DATA, WORLD } from './_data.js';
import { seeded } from '../gen/core.js';
import { TRADES, TRADE_NAMES, EXPERT_NAMES, tradeOf } from '../gen/interior/trades.js';
import { w } from '../data/words.js';

// the kind of building follows from the kind of knowledge
export const KIND_OF = { mechanism: 'lab', process: 'workshop', view: 'observatory', parts: 'archive', choice: 'hall', cases: 'studio', story: 'museum', deep: 'cave' };
const NATURES = ['river', 'hill', 'forest', 'meadow', 'shore'], MONUMENTS = ['fountain', 'obelisk', 'statue', 'arch', 'bell', 'stones'];
const HOSTS = [['Lux', 'tech'], ['Tinta', 'fisher'], ['Tono', 'keeper'], ['Tess', 'tess'], ['Orsola', 'archivist'], ['Marlo', 'surveyor'], ['Ada', 'nurse'], ['Pixel', 'kid']];
const THREAD_COL = ['#4fd1c5', '#ffcf5a', '#ff7a6b', '#6f93e0'];

const W = WORLD || {}, usedNature = new Set(DATA.themes.map((t) => W.themes?.[t.id]?.nature || t.cue?.landscape).filter(Boolean));
const usedMon = new Set([W.hub?.monument, ...DATA.themes.map((t) => W.themes?.[t.id]?.landmark || t.cue?.landmark)].filter(Boolean));
const next = (pool, used) => { const v = pool.find((x) => !used.has(x)); used.add(v); return v; };
const hubMonument = W.hub?.monument || next(MONUMENTS, usedMon);

// Homes of experts: THE place where a concept becomes a person's house (kind "home").
//   - a concept with "expert" in course.json lives in its expert's home, unless world.json gives
//     it another kind; the expert is the host (name, the look of the trade, the line in their voice);
//   - world.json "homes": "auto" also makes homes of concepts of type story, cases and choice, with
//     a trade that suits the type and a name, both chosen by the seed;
//   - world.json "places": { "<id>": { "kind": "home" } } makes one home with a seeded expert.
// A story without a lab keeps its museum (the timeline lives there); its expert becomes the host.
// A trade not in src/gen/interior/trades.js gives a generic home. Nothing changes for a course
// that names no expert and does not ask for automatic homes.
export const AUTO_HOME = ['story', 'cases', 'choice'];
// p: a concept of course.json; w: its entry in world.json "places"; world: world.json
export function expertOf(p, w = {}, world = W) {
  if (w.kind && w.kind !== 'home') return null;
  const auto = world.homes === 'auto' && AUTO_HOME.includes(p.type);
  if (!p.expert && !auto && w.kind !== 'home') return null;
  const r = seeded(`${p.id}:expert`), fit = TRADE_NAMES.filter((t) => TRADES[t].suits.includes(p.type));
  const trade = p.expert?.trade || r.pick(fit.length ? fit : TRADE_NAMES);
  return { trade, key: tradeOf(trade), name: p.expert?.name || r.pick(EXPERT_NAMES), line: p.expert?.line };
}

export function kindOf(p, w = {}, world = W) {
  const ex = expertOf(p, w, world), museum = p.type === 'story' && !p.lab;
  return w.kind || (ex && !museum ? 'home' : KIND_OF[p.type]);
}

let n = 0;
const place = (p) => {
  const w = W.places?.[p.id] || {}, [hn, hl] = HOSTS[n++ % HOSTS.length], ex = expertOf(p, w), kind = kindOf(p, w);
  return {
    ...p, kind, concept: p.name, name: p.place, sign: p.sign,
    trade: ex && kind === 'home' ? ex.key : undefined, expert: ex ? { name: ex.name, trade: ex.trade, line: ex.line } : undefined,
    host: { name: hn, look: hl, hi: p.idea, ...(ex && { name: ex.name, look: TRADES[ex.key].look, hi: ex.line || p.idea }), ...w.host },
    kinds: p.threads ? Object.fromEntries(Object.entries(p.threads).map(([k, label], i) => [k, [label, THREAD_COL[i % THREAD_COL.length]]])) : undefined,
    timeline: p.timeline?.map((m) => ({ ...m, kind: m.thread })),
  };
};

export const COURSE = {
  id: DATA.id, title: DATA.title, subject: DATA.subject, bigIdea: DATA.bigIdea, credit: DATA.credit || '',
  hub: {
    name: W.hub?.name || w('town.square'), monument: hubMonument,
    guide: { name: 'Iris', look: 'mentor', hi: w('guide.hi', { title: DATA.title }),
      options: [[w('guide.q1'), w('guide.a1')], [w('guide.q2'), w('guide.a2')]], ...W.hub?.guide },
  },
  districts: DATA.themes.map((t) => ({
    id: t.id, name: t.name, idea: t.idea,
    nature: W.themes?.[t.id]?.nature || t.cue?.landscape || next(NATURES, usedNature),
    landmark: W.themes?.[t.id]?.landmark || t.cue?.landmark || next(MONUMENTS, usedMon),
    places: DATA.concepts.filter((p) => p.theme === t.id).map(place),
  })),
  league: { name: DATA.finalCheck.name, size: DATA.finalCheck.size, pass: DATA.finalCheck.pass, host: { name: w('town.judge'), look: 'nurse', ...W.finalCheckHost } },
};
