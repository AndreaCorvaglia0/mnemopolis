// The labs of the active course: texts and structure from course.json, interaction code from
// courses/<slug>/labs/<conceptId>.js (one function per station id).
//   LABS[id]         the ground-floor lab: the stations of the main path (not "advanced"). Its
//                    station k is saved as state.done['id:k']; the map's "lab n/m" counts these.
//   UPPER_LABS[id]   the advanced stations of that house, shown upstairs (mechanics/floors/);
//                    saved as state.done['id+up:<stationId>']. Only houses that have some.
import { DATA } from './_data.js';
import { MOUNTS } from './_active.js';
import { isGround } from '../mechanics/floors/plan.js';

const missing = (ctx) => { ctx.stage.append(Object.assign(document.createElement('div'), { className: 'lab-box', style: 'padding:24px;color:#ffb3a8', textContent: 'This station is designed in course.json but has no code yet.' })); };

const labOf = (p, list) => ({
  title: p.lab.title, stepper: p.type === 'process', wide: list.some((s) => MOUNTS[p.id]?.[`${s.id}Code`]),
  stations: list.map((s) => ({ ...s, short: s.id, zone: s.beat || '', code: MOUNTS[p.id]?.[`${s.id}Code`], mount: MOUNTS[p.id]?.[s.id] || missing, coded: !!MOUNTS[p.id]?.[s.id] })),
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
