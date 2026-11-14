// The ending (docs/STORY.md, beats 8 to 10): a loop. The keeper, hooded, never unmasked, lights the
// lamp: what you are looking for was never here, it came with you on the ship. The arrivals register
// on the desk: your name, signed again and again down the page, dates going back, the last line empty.
// The town lit, the rain stopped: the way back to the ship. On the quay you tear the full notebook's
// pages out, the wind takes each one home; the cover falls where you found it. The purser at the
// gangway: "Another round, <name>?" You board; the lights go out, as at the arrival; the rain begins
// again; the last shot is the first shot. Then the ending card; then the town, free to roam.
//   playLamp(town)    after the final remembering (lighthouse.js)
//   playEnding(town)  on the quay, once the lamp is lit (town.js)
import { h } from '../../lab/shell.js';
import { state, save } from '../../systems/state.js';
import { sfx } from '../../systems/audio.js';
import { COURSE } from '../../data/content.js';
import { Q } from '../quest/active.js';
import { cinema, reducedMotion } from './cinema.js';
import { view } from './paint.js';
import { harbourPainter } from './scenes/harbour.js';
import { objectPainter } from './scenes/objects.js';
import { lampRoomPainter, registerPainter, pagesPainter, gangwayPainter } from './scenes/ending.js';
import { startFog } from './fog.js';
import { S_WORDS } from './words.js';
import { tr, fill } from './config.js';
import { endingOf } from './logic.js';

export const TALLY = 4;

// the town's name (the course's title), over the arrival and over the loop: the same card
export async function titleCard(c) {
  const t = h('div', {}, h('div', {}, COURSE.title.toUpperCase()), h('div', {}, COURSE.subject || ''));
  t.style.cssText = 'text-align:center;color:#f1ecd9;text-shadow:0 2px 24px #000;opacity:0;transition:opacity 2s;padding:0 16px';
  t.firstChild.style.cssText = 'font:600 clamp(32px,7vw,72px) Georgia,serif;letter-spacing:.14em';
  t.lastChild.style.cssText = 'font:italic clamp(18px,2.6vw,26px) Georgia,serif;letter-spacing:.04em;color:#cfc6ae;margin-top:8px';
  c.show(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; });
  await c.sleep(4200);
  t.style.opacity = '0';
  await c.sleep(c.skipped ? 0 : 900);
  c.hide();
} // the marks already scratched on the notebook's cover when it is found

// the next picture comes up under the current one, which fades away (a slow cross-dissolve)
async function cut(c, from, painter, params, ms = 1200) {
  const next = view(c.root, painter, params);
  if (from) {
    from.el.style.zIndex = '0'; next.el.style.zIndex = '0';
    c.root.insertBefore(next.el, from.el); // below the old one
    if (!c.skipped && !reducedMotion()) { from.el.style.transition = `opacity ${ms}ms ease`; requestAnimationFrame(() => { from.el.style.opacity = '0'; }); await c.sleep(ms + 50); }
    from.stop();
  }
  return next;
}

export async function playLamp(town) {
  const ui = town.ui, name = state.story?.name || tr(S_WORDS.defaultName);
  await cinema(ui, async (c) => {
    c.root.style.background = '#05060a';
    await c.dim(1, 0);
    let v = await cut(c, null, lampRoomPainter(), { lamp: 0, push: 0.05, pushTime: 20 });
    await c.dim(0, 1200);
    await c.sleep(900);
    const lit = v.fade('lamp', 1, 3800);
    sfx.motif?.('lock');
    for (const l of tr(S_WORDS.keeperLamp)) await c.say(l, { min: 3200 });
    await (c.skipped ? null : lit);
    v = await cut(c, v, registerPainter(), { name, place: COURSE.title, arrived: state.story?.arrivedAt, push: 0.1, pushTime: 16 }, 1500);
    await c.say(tr(S_WORDS.registerSeen), { min: 3000 });
    await c.sleep(1800); // the player does the arithmetic
    await c.say(tr(S_WORDS.signature), { min: 3400 });
    await c.dim(1, 900);
    v.stop();
  });
  state.passedLeague = true;
  (state.story ||= {}).turned = true;
  save();
  const s = town.story;
  s?.lightLamp(true); s?.weather.set(0); s?.refresh();
}

// The ending sequences, one per kind that endingOf (logic.js) can return. Today only the bitter,
// identical loop exists (docs/STORY.md, "Endings (planned)"): a happier ending is a new entry here
// and a new answer of endingOf, nothing else.
const ENDINGS = {
  async loop(c, { name }) {
    c.root.style.background = '#05060a';
    await c.dim(1, 0);
    // the pages, torn out, scattered along the quay
    let v = await cut(c, null, pagesPainter(), { pages: Math.max(3, Q.core.length), push: 0.04 });
    await c.dim(0, 1200);
    c.theme('fragment');
    for (const l of tr(S_WORDS.tear)) await c.say(l, { min: 3000 });
    await c.sleep(1500);
    // the cover falls where it was found; one more mark on it
    v = await cut(c, v, objectPainter('notebook'), { dry: 0.6, tally: TALLY + 1, fresh: 1, empty: 1, push: 0.05 });
    await c.say(tr(S_WORDS.dropped), { min: 3400 });
    // the purser at the gangway
    v = await cut(c, v, gangwayPainter(), { push: 0.05 });
    await c.say(fill(tr(S_WORDS.anotherRound), { name }), { min: 3600 });
    await c.say(tr(S_WORDS.aboard), { min: 2200 });
    // the ship at the quay, its lights going out, as at the arrival
    v = await cut(c, v, harbourPainter(), { dock: 1, lights: 1, rain: 0, stars: 1, notebook: 1, push: 0 }, 1500);
    await c.sleep(1200);
    await v.fade('lights', 0, 3200);
    await c.sleep(800);
    // the loop: the last shot is the first shot; the rain begins again
    v = await cut(c, v, harbourPainter(), { dock: 0, lights: 1, rain: 0, notebook: 1, push: 0.06, pushTime: 30 }, 3000);
    v.fade('rain', 1, 4000);
    v.fade('dock', 1, 11000);
    c.theme('full');
    await c.say(tr(S_WORDS.opening)[0], { min: 4200 });
    // the title, over it, as at the arrival
    await titleCard(c);
    await c.wait(2500);
    await c.dim(1, 1200);
    v.stop();
  },
};

export async function playEnding(town) {
  const ui = town.ui, name = state.story?.name || tr(S_WORDS.defaultName);
  if (state.ended || town.story?.ending) return;
  town.story.ending = true;
  const ending = ENDINGS[endingOf(state)] || ENDINGS.loop;
  await cinema(ui, (c) => ending(c, { name }));
  state.ended = true;
  Object.assign((state.story ||= {}), { left: true, rounds: (state.story.rounds || 0) + 1 });
  save();
  startFog();
  town.story.ending = false;
  town.story.placeNotebook();
  town.story.refresh();
  await ui.ending();
}
