// The labs of the active course: texts and structure from course.json, interaction code from
// courses/<slug>/labs/<conceptId>.js (one function per station id).
import { DATA } from './_data.js';
import { MOUNTS } from './_active.js';

const missing = (ctx) => { ctx.stage.append(Object.assign(document.createElement('div'), { className: 'lab-box', style: 'padding:24px;color:#ffb3a8', textContent: 'This station is designed in course.json but has no code yet.' })); };

// Built on first use: lab code imports the lab frame, which imports this file, so nothing here
// may run while modules are still loading.
let cache = null;
const build = () => (cache ||= Object.fromEntries(DATA.concepts.filter((p) => p.lab).map((p) => [p.id, {
  title: p.lab.title, stepper: p.type === 'process', wide: p.lab.stations.some((s) => MOUNTS[p.id]?.[`${s.id}Code`]),
  stations: p.lab.stations.map((s) => ({ ...s, short: s.id, zone: s.beat || '', code: MOUNTS[p.id]?.[`${s.id}Code`], mount: MOUNTS[p.id]?.[s.id] || missing, coded: !!MOUNTS[p.id]?.[s.id] })),
}])));
export const LABS = new Proxy({}, {
  get: (_, k) => build()[k], has: (_, k) => k in build(), ownKeys: () => Reflect.ownKeys(build()),
  getOwnPropertyDescriptor: (_, k) => (k in build() ? { enumerable: true, configurable: true, value: build()[k] } : undefined),
});
