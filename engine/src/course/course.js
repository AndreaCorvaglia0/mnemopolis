// The engine's view of the active course. Content comes from courses/<slug>/course.json (the
// knowledge base). Everything about the world that the knowledge base does not say is DERIVED
// here, and can be overridden by an optional courses/<slug>/world.json:
//   { "hub": { "name", "monument", "guide": { "name", "look", "hi" } },
//     "places": { "<conceptId>": { "kind", "host": { "name", "look", "hi" } } },
//     "themes": { "<themeId>": { "nature", "landmark" } }, "finalCheckHost": { "name", "look" } }
import { DATA, WORLD } from './_data.js';

// the kind of building follows from the kind of knowledge
export const KIND_OF = { mechanism: 'lab', process: 'workshop', view: 'observatory', parts: 'archive', choice: 'hall', cases: 'studio', story: 'museum', deep: 'cave' };
const NATURES = ['river', 'hill', 'forest', 'meadow', 'shore'], MONUMENTS = ['fountain', 'obelisk', 'statue', 'arch', 'bell', 'stones'];
const HOSTS = [['Lux', 'tech'], ['Tinta', 'fisher'], ['Tono', 'keeper'], ['Tess', 'tess'], ['Orsola', 'archivist'], ['Marlo', 'surveyor'], ['Ada', 'nurse'], ['Pixel', 'kid']];
const THREAD_COL = ['#4fd1c5', '#ffcf5a', '#ff7a6b', '#6f93e0'];

const W = WORLD || {}, usedNature = new Set(DATA.themes.map((t) => W.themes?.[t.id]?.nature || t.cue?.landscape).filter(Boolean));
const usedMon = new Set([W.hub?.monument, ...DATA.themes.map((t) => W.themes?.[t.id]?.landmark || t.cue?.landmark)].filter(Boolean));
const next = (pool, used) => { const v = pool.find((x) => !used.has(x)); used.add(v); return v; };
const hubMonument = W.hub?.monument || next(MONUMENTS, usedMon);

let n = 0;
const place = (p) => {
  const w = W.places?.[p.id] || {}, [hn, hl] = HOSTS[n++ % HOSTS.length], kind = w.kind || KIND_OF[p.type];
  return {
    ...p, kind, concept: p.name, name: p.place, sign: p.sign,
    host: { name: hn, look: hl, hi: p.idea, ...w.host },
    kinds: p.threads ? Object.fromEntries(Object.entries(p.threads).map(([k, label], i) => [k, [label, THREAD_COL[i % THREAD_COL.length]]])) : undefined,
    timeline: p.timeline?.map((m) => ({ ...m, kind: m.thread })),
  };
};

export const COURSE = {
  id: DATA.id, title: DATA.title, subject: DATA.subject, bigIdea: DATA.bigIdea, credit: DATA.credit || '',
  hub: {
    name: W.hub?.name || 'Central Square', monument: hubMonument,
    guide: { name: 'Iris', look: 'mentor', hi: `Welcome to ${DATA.title}. Every house holds one idea, and a lab to try it.`,
      options: [
        ['Where do I start?', 'At house number 1. The numbers on the walls are the order. Tab shows the map.'],
        ['What is in a house?', 'A lab behind the glowing door, a reading wall, and someone who knows the place.'],
        ['What are the meadows for?', 'Tall grass hides quick questions about houses you have already visited. Say "not now" whenever you like.'],
      ], ...W.hub?.guide },
  },
  districts: DATA.themes.map((t) => ({
    id: t.id, name: t.name, idea: t.idea,
    nature: W.themes?.[t.id]?.nature || t.cue?.landscape || next(NATURES, usedNature),
    landmark: W.themes?.[t.id]?.landmark || t.cue?.landmark || next(MONUMENTS, usedMon),
    places: DATA.concepts.filter((p) => p.theme === t.id).map(place),
  })),
  league: { name: DATA.finalCheck.name, size: DATA.finalCheck.size, pass: DATA.finalCheck.pass, host: { name: 'Judge Ada', look: 'nurse', ...W.finalCheckHost } },
};
