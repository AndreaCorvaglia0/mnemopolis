// The main path of the active course, built once. Node-safe (content.js has no browser code).
import { PLACES, COURSE, LEAGUE } from '../../data/content.js';
import { questOf } from './model.js';

export const Q = questOf({ places: PLACES, guide: COURSE.hub.guide.name, champion: LEAGUE.host?.name || 'Judge' });
export const CORE = new Set(Q.core.map((p) => p.id));
export const isCorePlace = (id) => CORE.has(id);
