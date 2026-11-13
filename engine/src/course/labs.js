// The labs of the active course: texts and structure from course.json, interaction code from
// courses/<slug>/labs/<conceptId>.js (one function per station id).
//   LABS[id]         the ground-floor lab: the stations of the main path (not "advanced"). Its
//                    station k is saved as state.done['id:k']; the map's "lab n/m" counts these.
//   UPPER_LABS[id]   the advanced stations of that house, shown upstairs (mechanics/floors/);
//                    saved as state.done['id+up:<stationId>']. Only houses that have some.
import { DATA } from './_data.js';
import { MOUNTS, LOADED } from './_active.js';
import { readyMount } from '../lab/patterns/mount.js';
import { isGround } from '../mechanics/floors/plan.js';

const missing = (ctx) => { ctx.stage.append(Object.assign(document.createElement('div'), { className: 'lab-box', style: 'padding:24px;color:#ffb3a8', textContent: 'This station is designed in course.json but has no code yet.' })); };

// Code is looked up when it is used, not when this table is built: in the prebuilt player the
// course's lab files arrive a moment after start-up (LOADED). Custom code wins over a "ready"
// pattern (lab/patterns/). A task may be { text, when } (ready labs): the frame shows the text.
const custom = (p, s) => MOUNTS[p.id]?.[s.id];
const labOf = (p, list) => ({
  title: p.lab.title, stepper: p.type === 'process', get wide() { return list.some((s) => MOUNTS[p.id]?.[`${s.id}Code`]); },
  stations: list.map((s) => ({
    ...s, short: s.id, zone: s.beat || '',
    tries: (s.tries || []).map((t) => (typeof t === 'string' ? t : t.text)), when: (s.tries || []).map((t) => (typeof t === 'string' ? null : t.when || null)),
    get code() { return MOUNTS[p.id]?.[`${s.id}Code`]; },
    get coded() { return !!custom(p, s) || !!s.ready; },
    mount: async (ctx) => { await LOADED; const m = custom(p, s) || (s.ready ? readyMount(s) : missing); return m(ctx); },
  })),
});
// Built on first use: lab code imports the lab frame, which imports this file, so nothing here
// may run while modules are still loading.
let cache = null, upper = null;
const build = () => (cache ||= Object.fromEntries(DATA.concepts.filter((p) => p.lab).map((p) => [p.id, labOf(p, p.lab.stations.filter(isGround))])));
const UP = String(DATA.language || 'en').startsWith('it') ? 'di sopra' : 'upstairs';
const buildUp = () => (upper ||= Object.fromEntries(DATA.concepts.filter((p) => p.lab?.stations.some((s) => !isGround(s))).map((p) => [p.id, { ...labOf(p, p.lab.stations.filter((s) => !isGround(s))), title: `${p.lab.title} · ${UP}`, upper: true }])));
const view = (get) => new Proxy({}, {
  get: (_, k) => get()[k], has: (_, k) => k in get(), ownKeys: () => Reflect.ownKeys(get()),
  getOwnPropertyDescriptor: (_, k) => (k in get() ? { enumerable: true, configurable: true, value: get()[k] } : undefined),
});
export const LABS = view(build);
export const UPPER_LABS = view(buildUp);
