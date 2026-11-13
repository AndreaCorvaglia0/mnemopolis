// The import surface of lab code in the prebuilt player (src/course/packing.js, KIT_MODULES):
// a packed lab file's `import { x } from '.../engine/src/<key>'` reads KIT[key].
import * as shell from './shell.js';
import * as kit from './kit.js';
import * as patterns from './patterns/index.js';
import * as audio from '../systems/audio.js';

export const KIT = { 'lab/shell.js': shell, 'lab/kit.js': kit, 'lab/patterns/index.js': patterns, 'systems/audio.js': audio };
