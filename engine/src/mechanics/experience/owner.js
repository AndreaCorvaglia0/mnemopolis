// A house's owner noticing you: what they say first (curt before remembering, noticing your progress
// elsewhere after), a withheld line of theirs, and a game they offer ("where": "host").
//   const o = await ownerTalk(ui, id, name, hi); root: { say: o.say, options: [...o.options, ...] }
import { tr, fill } from '../config.js';
import { ownerSay, XP_ON } from './active.js';
import { withheldMoment } from './world.js';
import { hostGames, isOpen, playGame, markSeen } from '../games/active.js';
import { G_WORDS } from '../games/strings.js';

export async function ownerTalk(ui, id, name, hi) {
  if (XP_ON) await withheldMoment(ui, `host:${id}`, name);
  const options = hostGames(id).filter(isOpen).map((g) => { markSeen(g.id); return { label: fill(tr(G_WORDS.accept), { title: tr(g.title) }), do: async () => { await playGame(ui, g); return 'end'; } }; });
  return { say: XP_ON ? ownerSay(id, hi) : hi, options };
}
