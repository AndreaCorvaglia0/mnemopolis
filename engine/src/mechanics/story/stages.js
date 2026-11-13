// How much the town remembers, and what people say for it (docs/STORY.md, beats 2 and 6): cold
// (curt, unhelpful: the notebook keeps the way), thawing, warm. Pure over the state.
import { Q } from '../quest/active.js';
import { Deck } from '../musings/think.js';
import { progressOf, stageOf, rainOf } from './logic.js';
import { S_WORDS } from './words.js';
import { tr } from './config.js';

// a core house is remembered when its owner remembered (the badge), or, without a remembering, when
// its lab is done; the memento upstairs is not needed for the town to warm
export const rememberedRow = (r) => r.won || (!r.duel && r.visited && r.n >= r.m);
export function townProgress(s) { return progressOf(Q.coreProgress(s).map((r) => ({ done: rememberedRow(r) }))); }
export const stageNow = (s) => stageOf(townProgress(s), !!(s.ended || s.passedLeague));
export const rainNow = (s) => rainOf(townProgress(s), !!(s.ended || s.passedLeague)); // the lamp lit: the rain stops

const deck = new Deck();
export const greeting = (s) => deck.draw(`greet:${stageNow(s)}`, tr(S_WORDS.greet[stageNow(s)]));
export const curtLine = () => deck.draw('curt', tr(S_WORDS.curt));
