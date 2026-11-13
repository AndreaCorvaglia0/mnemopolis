// Obstacles: things that visibly bar the way and cannot be passed YET. Plain data, Node-safe.
// Each one guards an optional side place (never anything the course needs) and will one day be
// opened by a tool. The tools do not exist yet: they will come from a shop paid with the coins of
// answered questions (docs/ROADMAP.md). Until then canPass() is false, except for tools granted by
// hand for testing: ?tools=key,pickaxe in the address, or __hb.give('key') in the console.
//
// A kind:
//   needs   the tool that opens it (a key of TOOLS)
//   where   'spur' (the mouth of a dead-end nook), 'nook' (the gate of a little hedged garden),
//           'side' (a cellar hatch beside a house), 'room' (a small locked door on a room's back wall)
//   name    what the prompt calls it ("Try the gate"), with its article in Italian
//   say     what the player thinks when trying it without the tool (cycled)
//   opened  the thought when it opens
//   lines   musings (T or double tap): it is a key object, so these only point at it
// The painters are in art.js; placement in place.js; the scene side in live.js.
export const TOOLS = {
  key: { en: 'a key', it: 'una chiave' },
  pickaxe: { en: 'a pickaxe', it: 'un piccone' },
  saw: { en: 'a saw', it: 'una sega' },
  shears: { en: 'garden shears', it: 'delle cesoie' },
};

export const OBSTACLES = {
  boulder: { needs: 'pickaxe', where: 'spur', name: { en: 'boulder', it: 'il masso' },
    say: { en: ['Too heavy to move. With the right tool, maybe.', 'I pushed. It did not notice.', 'A pickaxe would have a word with this.'],
      it: ['Troppo pesante da spostare. Con l\'attrezzo giusto, forse.', 'Ho spinto. Non se n\'è accorto.', 'Un piccone avrebbe qualcosa da dirgli.'] },
    opened: { en: 'Crack. The way is clear.', it: 'Crac. La strada è libera.' },
    lines: { en: ['That boulder isn\'t going anywhere today.', 'Someone put a rock exactly where I wanted to go.'], it: ['Quel masso oggi non va da nessuna parte.', 'Qualcuno ha messo un sasso proprio dove volevo andare.'] } },
  log: { needs: 'saw', where: 'spur', name: { en: 'fallen trunk', it: 'il tronco caduto' },
    say: { en: ['A whole tree, lying down. I\'d need a saw.', 'Too high to climb, too long to go round.', 'It fell here and decided to stay.'],
      it: ['Un albero intero, sdraiato. Servirebbe una sega.', 'Troppo alto da scavalcare, troppo lungo da aggirare.', 'È caduto qui e ha deciso di restare.'] },
    opened: { en: 'Two neat halves. Through.', it: 'Due metà precise. Si passa.' },
    lines: { en: ['A fallen trunk. Something behind it, though.', 'Moss on one side. Mystery on the other.'], it: ['Un tronco caduto. Ma dietro c\'è qualcosa.', 'Muschio da una parte. Mistero dall\'altra.'] } },
  thicket: { needs: 'shears', where: 'spur', name: { en: 'thicket', it: 'il roveto' },
    say: { en: ['Thorns. Lots of them. Shears, maybe.', 'The brambles say no. Politely, but no.', 'I\'m not walking into that without a tool.'],
      it: ['Spine. Tantissime. Servirebbero delle cesoie.', 'I rovi dicono di no. Con garbo, ma no.', 'Lì dentro non ci entro senza un attrezzo.'] },
    opened: { en: 'Snip, snip. A gap just my size.', it: 'Zac, zac. Un varco della mia misura.' },
    lines: { en: ['A wall of brambles. Something glints behind it.', 'Those thorns are guarding something.'], it: ['Un muro di rovi. Dietro qualcosa luccica.', 'Quelle spine fanno la guardia a qualcosa.'] } },
  gate: { needs: 'key', where: 'nook', name: { en: 'gate', it: 'il cancelletto' },
    say: { en: ['Locked. I\'d need a key.', 'A padlock the size of my fist. No key, no garden.', 'I rattled it. Very securely locked.'],
      it: ['Chiuso a chiave. Mi servirebbe una chiave.', 'Un lucchetto grande come un pugno. Niente chiave, niente giardino.', 'L\'ho scosso. Chiuso per bene.'] },
    opened: { en: 'Click. The gate swings open.', it: 'Clic. Il cancelletto si apre.' },
    lines: { en: ['A little locked garden. I want in.', 'Whoever keeps this garden keeps the key too.'], it: ['Un giardinetto chiuso a chiave. Voglio entrare.', 'Chi cura questo giardino tiene anche la chiave.'] } },
  hatch: { needs: 'key', where: 'side', name: { en: 'cellar hatch', it: 'la botola' },
    say: { en: ['A cellar hatch with a padlock. Key needed.', 'Something down there. Locked up there.', 'I knocked. The cellar kept its secrets.'],
      it: ['Una botola con il lucchetto. Serve una chiave.', 'Qualcosa là sotto. Chiuso qui sopra.', 'Ho bussato. La cantina si tiene i suoi segreti.'] },
    opened: { en: 'The padlock drops. Steps lead down.', it: 'Il lucchetto cade. Dei gradini scendono.' },
    lines: { en: ['A padlocked hatch. Cellars always have stories.', 'I wonder what\'s stored down there.'], it: ['Una botola col lucchetto. Le cantine hanno sempre storie.', 'Chissà cosa tengono là sotto.'] } },
  closet: { needs: 'key', where: 'room', name: { en: 'little door', it: 'la porticina' },
    say: { en: ['Locked. I\'d need a key.', 'A small door, a big padlock.', 'I tried the handle. It tried me back.'],
      it: ['Chiusa a chiave. Mi servirebbe una chiave.', 'Una porta piccola, un lucchetto grande.', 'Ho provato la maniglia. Niente da fare.'] },
    opened: { en: 'The little door creaks open.', it: 'La porticina si apre cigolando.' },
    lines: { en: ['A little locked door. A cupboard, or a whole other room?', 'Every house has one door it doesn\'t talk about.'], it: ['Una porticina chiusa. Un armadio o un\'altra stanza?', 'Ogni casa ha una porta di cui non parla.'] } },
};
export const OBSTACLE_KINDS = Object.keys(OBSTACLES);

// What waits behind: a placeholder reward today, listed as "sealed" in the discoveries until opened.
export const REWARDS = {
  chest: { title: { en: 'A small chest', it: 'Un piccolo forziere' }, text: { en: 'Inside: a folded map of somewhere else.', it: 'Dentro: una mappa piegata di un altro posto.' } },
  glint: { title: { en: 'Something that glints', it: 'Qualcosa che luccica' }, text: { en: 'A brass compass that points at the nearest unread page.', it: 'Una bussola d\'ottone che indica la pagina non ancora letta più vicina.' } },
  plant: { title: { en: 'A strange plant', it: 'Una pianta strana' }, text: { en: 'It glows faintly and turns its leaves toward voices.', it: 'Brilla appena e gira le foglie verso le voci.' } },
};

// An obstacle is open once opened, or when the player carries its tool (then a tap opens it).
export const isOpen = (ob, state) => !!state.opened?.[ob.id];
export const hasTool = (ob, state) => !!state.tools?.[OBSTACLES[ob.kind]?.needs];
export const canPass = (ob, state) => isOpen(ob, state) || hasTool(ob, state);

// Tools granted for testing: ?tools=key,pickaxe
export function toolsFromQuery(search = typeof location !== 'undefined' ? location.search : '') {
  const v = new URLSearchParams(search).get('tools');
  return v ? v.split(',').map((s) => s.trim()).filter((t) => TOOLS[t]) : [];
}
