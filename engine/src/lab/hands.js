// The sounds of the hands in a lab (systems/sound/ui.js): the kit's controls call hand(name) and
// every station gains them without its author doing anything. A station that wants silence calls
// ctx.quiet() or passes { quiet: true } to stage(); the frame resets it when a station opens.
import { uiSound } from '../systems/sound/index.js';

let quiet = false;
export const setQuiet = (q) => { quiet = !!q; };
export const isQuiet = () => quiet;
export function hand(name, o) { if (!quiet) uiSound(name, o); }
