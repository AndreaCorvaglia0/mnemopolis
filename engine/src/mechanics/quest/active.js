// The main path of the active course, built once. Node-safe (content.js has no browser code).
import { PLACES, COURSE, LEAGUE } from '../../data/content.js';
import { questOf } from './model.js';
import { STORY } from '../story/config.js';

// in the story every core house keeps a memento upstairs (docs/STORY.md): finding it is part of the path
const core = PLACES.some((p) => p.core !== false) ? PLACES.filter((p) => p.core !== false) : PLACES;
export const Q = questOf({ places: PLACES, guide: COURSE.hub.guide.name, champion: LEAGUE.host?.name || 'Judge', mementos: STORY.on ? new Set(core.map((p) => p.id)) : null });
export const CORE = new Set(Q.core.map((p) => p.id));
export const isCorePlace = (id) => CORE.has(id);
