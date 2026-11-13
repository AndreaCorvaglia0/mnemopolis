// The turn and leaving (docs/STORY.md, beats 9 and 10). After the final remembering the keeper
// lowers the hood: your own face; the handwriting is yours; the card bears the name you gave the
// purser. Then, in the town: the lamp catches (its beam sweeps the town), the rain stops, every window
// is lit, the ship sounds its horn, the whole theme plays; the ending card (its heading "You
// remember."); a last choice: leave the notebook on the quay.
import { h } from '../../lab/shell.js';
import { state, save } from '../../systems/state.js';
import { sfx } from '../../systems/audio.js';
import { makeCanvas } from '../../art/px.js';
import { cinema, reducedMotion } from './cinema.js';
import { mementoCanvas } from './mementos.js';
import { startFog } from './fog.js';
import { S_WORDS } from './words.js';
import { tr, fill } from './config.js';

// a character, large and crisp: the front frame of its sheet, on a dark ground, in the lamp's light
function portrait(src, label) {
  const [c, g] = makeCanvas(48, 40);
  const glow = g.createRadialGradient(24, 14, 2, 24, 18, 30); glow.addColorStop(0, '#3a3020'); glow.addColorStop(1, '#07070b');
  g.fillStyle = glow; g.fillRect(0, 0, 48, 40);
  if (src) g.drawImage(src, 0, 0, 16, 24, 16, 10, 16, 24);
  c.setAttribute('aria-label', label);
  c.style.cssText = 'width:min(80vw,calc((100vh - 2*max(12vh,86px)) * 1.15));image-rendering:pixelated;display:block';
  return c;
}

export async function playTurn(town) {
  const ui = town.ui, story = town.story, name = state.story?.name || tr(S_WORDS.defaultName), T = tr(S_WORDS.turn);
  const src = (k) => (town.textures.exists(k) ? town.textures.get(k).getSourceImage() : null);
  // ---- the keeper turns
  await cinema(ui, async (c) => {
    c.root.style.background = '#050507';
    const hood = portrait(src('ch-keeper-hood'), tr(S_WORDS.keeper)), face = portrait(src('ch-player'), name);
    c.show(hood);
    await c.sleep(700);
    await c.say(T[0]);
    hood.style.transition = reducedMotion() ? 'none' : 'opacity 1.2s'; hood.style.opacity = '0';
    await c.sleep(reducedMotion() ? 0 : 900);
    c.show(face);
    c.theme('fragment');
    await c.say(T[1]);
    const card = mementoCanvas('card', { name });
    c.show(card.el);
    await c.say(T[2]);
    await c.say(fill(T[3], { name }));
    card.stop();
    c.hide();
    await c.say(T[4], { min: 3200 });
    await c.say(T[5], { min: 3200 });
  });
  // ---- leaving: the lamp, the rain, the windows, the ship
  state.story.turned = true;
  state.passedLeague = true;
  await cinema(ui, async (c) => {
    const L = story.lamp;
    if (L) { await c.zoom(0.75, 1000); await c.pan(L.x, L.y + 70, 1400); }
    story.lightLamp(true);
    sfx.motif?.('lock');
    await c.say(tr(S_WORDS.leaving)[0]);
    story.weather.set(0);
    state.ended = true; save(); // every window lit, everyone warm
    story.refresh();
    await c.say(tr(S_WORDS.leaving)[1]);
    const S = story.shipAt;
    if (S) await c.pan(S.x, S.y - 30, 2200);
    story.shipLights(true);
    sfx.horn?.();
    const len = c.theme('full');
    await c.say(tr(S_WORDS.leaving)[2], { min: 4200 });
    if (len && !c.skipped) await c.sleep(Math.min(9000, len * 1000 - 6000));
  }, { scene: town });
  startFog();
  // ---- the ending card, then the last choice
  await ui.ending();
  if (!town.sys.isActive()) return;
  const i = await ui.choose(tr(S_WORDS.choiceQ), [tr(S_WORDS.leaveNotebook), tr(S_WORDS.keepNotebook)]);
  if (i === 0) {
    state.story.left = true; save();
    story.placeNotebook();
    await cinema(ui, async (c) => {
      const N = story.notebookAt;
      if (N) { await c.pan(N.x, N.y, 1600); await c.zoom(1.6, 900); }
      await c.say(tr(S_WORDS.leftIt), { min: 3600 });
    }, { scene: town });
  }
  void h;
}
