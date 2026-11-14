// Mini-games in the town scene: the objects on their spots, the mark over them, the prompt, Space or
// a tap to play; and the people who offer a game in their dialogue (Town and the story call
// offerOption). Town.js: this.games = attachTownGames(this); games.update(time); prompt; use.
import { T } from '../../world/townMap.js';
import { state } from '../../systems/state.js';
import { uiSound } from '../../systems/sound/index.js';
import { tr, fill } from '../config.js';
import { say } from '../life.js';
import { Deck } from '../musings/think.js';
import { G_WORDS } from './strings.js';
import { gameTextures } from './art.js';
import { townGames, byId, isOpen, playGame, gameOfPerson, markSeen, GAMES } from './active.js';

const deck = new Deck();
export function attachTownGames(scene) {
  if (!GAMES.length) return null;
  gameTextures(scene);
  const spots = townGames().map((p) => {
    const img = scene.add.image(p.x * T + 8, p.y * T + 16, `gm-${p.object}`).setOrigin(0.5, 1).setDepth(p.y * T + 15);
    scene.block(p.x, p.y);
    const mark = scene.add.image(p.x * T + 8, p.y * T - 6, 'gm-mark').setOrigin(0.5, 1).setDepth(9600).setAlpha(0);
    scene.tweens.add({ targets: mark, y: mark.y - 2, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return { p, g: byId[p.id], img, mark };
  });
  const at = (x, y) => spots.find((s) => s.p.x === x && s.p.y === y) || null;
  return {
    spots,
    update() {
      const pl = scene.player; if (!pl) return;
      for (const s of spots) {
        const near = Math.abs(pl.tx - s.p.x) + Math.abs(pl.ty - s.p.y) <= 3;
        const want = near && isOpen(s.g) ? 1 : 0;
        if (Math.abs(s.mark.alpha - want) > 0.01) s.mark.setAlpha(s.mark.alpha + (want - s.mark.alpha) * 0.2);
        if (near && isOpen(s.g)) markSeen(s.g.id);
      }
    },
    prompt(x, y) { const s = at(x, y); return s ? (isOpen(s.g) ? fill(tr(G_WORDS.prompt), { title: tr(s.g.title) }) : `Space  ${tr(G_WORDS.objects[s.p.object])}`) : null; },
    use(x, y) {
      const s = at(x, y); if (!s) return false;
      if (!isOpen(s.g)) { uiSound('button'); say(scene, deck.draw('notyet', tr(G_WORDS.notYet))); return true; }
      uiSound('find');
      playGame(scene.ui, s.g);
      return true;
    },
  };
}

// an option for a person's dialogue: "Fancy a game?" when they have an open one
export function offerOption(ui, npcId) {
  const g = gameOfPerson(npcId);
  if (!g || !isOpen(g)) return null;
  markSeen(g.id);
  return { label: fill(tr(G_WORDS.accept), { title: tr(g.title) }), do: async () => { await playGame(ui, g); return 'end'; } };
}
export const offerLine = () => deck.draw('offer', tr(G_WORDS.offer));
export { isOpen, playGame };
