// __hb.xp: helpers for tests and for the pictures of `npm run shots:world` (scripts/worldshots.mjs).
//   __hb.xp.info()            { xp, tier, tiers, completion, scale }
//   __hb.xp.add(n)            n more experience (as coins earned: insight and earned grow)
//   __hb.xp.toTier(t)         just enough experience for tier t
//   __hb.xp.talk(npcId)       the player beside that person, then talk to them
//   __hb.xp.games()           the course's games and where they are; __hb.xp.play(id) opens one
//   __hb.xp.spot(id)          the player in front of a town game's object
//   __hb.xp.door()            the shut house on the square (the door that knows you)
import { state, save } from '../../systems/state.js';
import { NPCS, BUILDINGS, T } from '../../world/townMap.js';
import { experienceOf } from './model.js';
import { tiers, tierNow, xpNow, completionNow, scale, syncNow, withheldNow, whoTells } from './active.js';
import { GAMES, townGames, gamesOfPeople, playGame, isOpen } from '../games/active.js';
import { knownDoor } from './world.js';

export function xpDebug(game) {
  const town = () => game.scene.getScene('Town'), ui = () => game.scene.getScene('UI');
  const put = (x, y, dir = 'up') => { const sc = town(); state.pos = { x, y, dir }; save(); sc.scene.restart(); };
  return {
    info: () => ({ xp: xpNow(), tier: tierNow(), tiers: tiers(), completion: completionNow(), scale: scale() }),
    add(n) { state.insight = (state.insight || 0) + n; syncNow(); save(); ui()?.refreshHUD?.(); return xpNow(); },
    toTier(t) { const need = tiers().find((x) => x.id === t)?.at ?? 0, have = experienceOf(state); if (need > have) this.add(need - have + 1); return tierNow(); },
    withheld: (key) => withheldNow(key), who: () => whoTells(),
    async talk(id) {
      const sc = town(), n = sc.npcs.find((x) => x.def.id === id); if (!n) return 0;
      const spots = [[0, 1, 'up'], [0, -1, 'down'], [1, 0, 'left'], [-1, 0, 'right']];
      for (const [dx, dy, dir] of spots) { const x = n.tx + dx, y = n.ty + dy; if (sc.canEnter(x, y) === true) { Object.assign(sc.player, { tx: x, ty: y, dir }); sc.player.place(); break; } }
      sc.talk(n); return 1;
    },
    games: () => ({ games: GAMES.map((g) => ({ id: g.id, kind: g.kind, where: g.where || 'town', open: isOpen(g) })), town: townGames(), people: gamesOfPeople() }),
    play: (id) => { playGame(ui(), GAMES.find((g) => g.id === id)); return 1; },
    spot(id) { const p = townGames().find((s) => s.id === id); if (!p) return 0; const [x, y] = p.stand; const dir = x < p.x ? 'right' : x > p.x ? 'left' : y < p.y ? 'down' : 'up'; put(x, y, dir); return 1; },
    door() { const b = BUILDINGS.find((x) => x.home); knownDoor(ui(), b); return 1; },
    npcs: () => NPCS.map((n) => n.id),
  };
}
