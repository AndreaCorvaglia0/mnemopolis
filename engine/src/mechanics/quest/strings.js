// Every word of the main path (tracker, menu, people's answers, the League's gate, the ending), in
// English and Italian, chosen by the course language as mechanics/config.js does. Node-safe.
// {order} house number, {place} its name, {person} who, {n}/{m} stations, {list} house numbers,
// {count} a number in words. To add a string: both languages (npm test checks).
import { tr, fill, LANG } from '../config.js';
import { NEAR } from '../musings/lines.js';

export { tr, fill, LANG };

export const Q_WORDS = {
  // ---- the tracker: one line, top right ----
  tracker: {
    intro: { en: 'Talk to {person}', it: 'Parla con {person}' },
    visit: { en: 'Next: house {order} · {place}', it: 'Prossima: casa {order} · {place}' },
    labHere: { en: 'Do the lab ({n}/{m})', it: 'Fai il laboratorio ({n}/{m})' },
    lab: { en: 'House {order}: finish the lab ({n}/{m})', it: 'Casa {order}: finisci il laboratorio ({n}/{m})' },
    duelHere: { en: 'Challenge {person} to a duel', it: 'Sfida {person} a duello' },
    duel: { en: 'House {order}: challenge {person}', it: 'Casa {order}: sfida {person}' },
    league: { en: 'The League is open', it: 'La Lega è aperta' },
    ending: { en: 'The road out of town is open', it: 'La strada fuori città è aperta' },
    free: { en: 'Free roaming', it: 'Libero di girare' },
  },
  menu: { en: 'Menu', it: 'Menu' },
  menuKey: { en: 'Tab  Menu', it: 'Tab  Menu' },

  // ---- the goal: the guide's first speech (three lines, then the first step) and the Journey tab ----
  goal: {
    en: ['Welcome to {title}! Every house holds one idea: learn it in its lab, then beat its expert in a duel of words.', 'Beat every expert and the League opens. Win the League, and the road out of town opens.', 'Everything else in town is for the curious.'],
    it: ['Benvenuto a {title}! Ogni casa custodisce un\'idea: capiscila nel suo laboratorio, poi batti il suo esperto in un duello di parole.', 'Batti tutti gli esperti e si apre la Lega. Vinci la Lega e si apre la strada fuori città.', 'Tutto il resto, in città, è per i curiosi.'],
  },
  goalShort: {
    en: ['Learn each house\'s idea, then beat its expert in a duel.', 'Every badge opens the League; the League opens the road out of town.'],
    it: ['Capisci l\'idea di ogni casa, poi batti il suo esperto in duello.', 'Tutti i distintivi aprono la Lega; la Lega apre la strada fuori città.'],
  },
  firstStep: { en: 'Start with house {order}, {place}, {near}. The numbers on the walls are the order.', it: 'Comincia dalla casa {order}, {place}, {near}. I numeri sui muri sono l\'ordine.' },

  // ---- people: "what should I do?" (one line, from the next step) ----
  ask: { en: 'What should I do now?', it: 'Cosa dovrei fare adesso?' },
  answer: {
    intro: { en: 'Listen to me first, then we\'ll see.', it: 'Prima ascoltami, poi vediamo.' },
    visit: { en: 'House {order}, {place}, {near}. Follow the numbers on the walls.', it: 'La casa {order}, {place}, {near}. Segui i numeri sui muri.' },
    lab: { en: 'Go back to {place}: its lab is not finished ({n} of {m}).', it: 'Torna a {place}: il suo laboratorio non è finito ({n} di {m}).' },
    duel: { en: '{person} at {place} is waiting for you: talk to them and challenge them to a duel.', it: '{person}, a {place}, ti aspetta: parlaci e sfidalo a duello.' },
    league: { en: 'You\'ve beaten every expert. The champion waits at the town gate, at the end of the road from the square.', it: 'Hai battuto tutti gli esperti. Il campione ti aspetta alla porta della città, in fondo alla strada che parte dalla piazza.' },
    ending: { en: 'The gate at the end of the road is open: walk through it.', it: 'La porta in fondo alla strada è aperta: attraversala.' },
    // a town without a gate (the generator found no way to the edge): the League hall on the square
    leagueHall: { en: 'You\'ve beaten every expert. The League hall is right here on the square.', it: 'Hai battuto tutti gli esperti. La sala della Lega è proprio qui in piazza.' },
    endingHall: { en: 'The champion is waiting for you by the League hall.', it: 'Il campione ti aspetta davanti alla sala della Lega.' },
    free: { en: 'Whatever you like. The town is yours now.', it: 'Quello che vuoi. Ora la città è tua.' },
  },
  // ---- hints at the extras: never their names (docs/DESIGN.md: hinted, never listed) ----
  hints: {
    en: ['Not every house in town is on the main road, you know.', 'I saw a light {near} last night. Nobody lives there, I thought.', 'They say the oldest stories in town are kept where few people walk.', 'Some folks never get past the main road. Their loss.', 'Somebody {near} knows more than they let on.'],
    it: ['Non tutte le case del paese stanno sulla strada principale, sai.', 'Ieri sera ho visto una luce {near}. Credevo non ci abitasse nessuno.', 'Dicono che le storie più vecchie del paese stiano dove passa poca gente.', 'C\'è chi non va mai oltre la strada principale. Peggio per loro.', 'Qualcuno {near} ne sa più di quanto dica.'],
  },
  congrats: {
    en: ['You won the League! The whole square is talking about it.', 'Champion of the League. Not bad at all.', 'I heard about the League. Well done, really.'],
    it: ['Hai vinto la Lega! In piazza non si parla d\'altro.', 'Campione della Lega. Niente male davvero.', 'Ho saputo della Lega. Bel lavoro, davvero.'],
  },

  // ---- the League's gate ----
  gate: {
    experts1: { en: 'One expert still thinks they know better than you: house {list}.', it: 'Un esperto pensa ancora di saperne più di te: casa {list}.' },
    experts: { en: '{count} experts still think they know better than you: houses {list}.', it: '{count} esperti pensano ancora di saperne più di te: case {list}.' },
    houses1: { en: 'One house of the main road is still waiting for you: house {list}.', it: 'Una casa della strada principale ti aspetta ancora: casa {list}.' },
    houses: { en: '{count} houses of the main road are still waiting for you: houses {list}.', it: '{count} case della strada principale ti aspettano ancora: case {list}.' },
    open: { en: 'Every expert beaten, I hear. I stand between you and the road out of town: the {league}. Beat me in a duel of eloquence.', it: 'Hai battuto tutti gli esperti, dicono. Tra te e la strada fuori città ci sono io: la {league}. Battimi in un duello di eloquenza.' },
    start: { en: 'Challenge the champion', it: 'Sfida il campione' },
    notNow: { en: 'Not now', it: 'Non ora' },
    again: { en: 'You already beat me. A friendly rematch, for the fun of it?', it: 'Mi hai già battuto. Una rivincita amichevole, per divertimento?' },
    ok: { en: 'I\'ll be back', it: 'Tornerò' },
  },
  // ---- the town gate, at the end of the road out of town (Town.js) ----
  townGate: {
    prompt: { en: 'The town gate', it: 'La porta della città' },
    through: { en: 'Walk through the gate', it: 'Attraversa la porta' },
    opens: { en: 'The gate swings open.', it: 'La porta si spalanca.' },
    next: { en: 'The road goes on, out of {title}. The next town is not built yet.', it: 'La strada prosegue, fuori da {title}. La prossima città non è ancora costruita.' },
    nextOn: { en: 'The road goes on to {next}.', it: 'La strada prosegue verso {next}.' },
    stay: { en: 'Stay a little longer', it: 'Resta ancora un po\'' },
    hall: { en: 'Nobody inside. A note on the door: "At the town gate. {person}"', it: 'Dentro non c\'è nessuno. Un biglietto sulla porta: "Sono alla porta della città. {person}"' },
  },
  // the card shown when a badge is won (UI.stamp)
  badge: { en: 'Badge: {place}', it: 'Distintivo: {place}' },
  badgeKey: { en: 'The key to the upstairs is yours.', it: 'La chiave del piano di sopra è tua.' },
  leagueWon: { en: '{league}: won', it: '{league}: vinta' },
  numbers: { en: ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'], it: ['Nessun', 'Un', 'Due', 'Tre', 'Quattro', 'Cinque', 'Sei', 'Sette', 'Otto', 'Nove', 'Dieci'] },
  and: { en: 'and', it: 'e' },

  // ---- the ending ----
  aside: {
    en: ['Well argued. I have nothing left to say, which has never happened before.', 'The road is yours. Go on, before I think of a rebuttal.'],
    it: ['Ben argomentato. Non ho più niente da dire, e non mi era mai successo.', 'La strada è tua. Vai, prima che mi venga in mente una replica.'],
  },
  card: {
    title: { en: 'The road out of town is open', it: 'La strada fuori città è aperta' },
    big: { en: 'The big idea', it: 'La grande idea' },
    can: { en: 'What you can do now', it: 'Cosa sai fare adesso' },
    numbers: { en: 'Your numbers', it: 'I tuoi numeri' },
    answered: { en: 'questions answered', it: 'domande risposte' },
    accuracy: { en: 'right', it: 'giuste' },
    sure: { en: 'When you were certain, you were right {r} times out of {t}.', it: 'Quando puntavi sul sicuro, avevi ragione {r} volte su {t}.' },
    time: { en: 'played', it: 'di gioco' },
    left: { en: 'Things in town still a question mark: {n}.', it: 'Cose in città ancora un punto interrogativo: {n}.' },
    leftNone: { en: 'You have seen everything the town had to show. Almost.', it: 'Hai visto tutto quello che la città aveva da mostrare. Quasi.' },
    back: { en: 'Back to town', it: 'Torna in città' },
    on: { en: 'On to {title}', it: 'Avanti: {title}' },
    reopen: { en: 'See the ending again', it: 'Rivedi il finale' },
  },

  // ---- the menu ----
  tabs: { journey: { en: 'Journey', it: 'Viaggio' }, map: { en: 'Map', it: 'Mappa' }, mysteries: { en: 'Mysteries', it: 'Misteri' } },
  journey: {
    path: { en: 'The main road', it: 'La strada principale' },
    visited: { en: 'visited', it: 'visitata' },
    notVisited: { en: 'not visited', it: 'non visitata' },
    lab: { en: 'lab {n}/{m}', it: 'lab {n}/{m}' },
    noLab: { en: 'no lab', it: 'niente lab' },
    duel: { en: 'duel', it: 'duello' },
    won: { en: 'badge', it: 'distintivo' },
    league: { en: 'The League', it: 'La Lega' },
    locked: { en: 'locked', it: 'chiusa' },
    open: { en: 'open', it: 'aperta' },
    wonLeague: { en: 'won', it: 'vinta' },
    more: { en: 'The town keeps a few things to itself.', it: 'La città tiene qualcosa per sé.' },
    now: { en: 'Now', it: 'Ora' },
    done: { en: 'The main road is done. Stay as long as you like.', it: 'La strada principale è finita. Resta quanto vuoi.' },
  },
  map: {
    square: { en: 'Square', it: 'Piazza' },
    you: { en: 'You', it: 'Tu' },
    tap: { en: 'Tap a house you have visited to recall its idea.', it: 'Tocca una casa che hai visitato per ricordarne l\'idea.' },
    tapKeys: { en: 'Click a house you have visited to recall its idea.', it: 'Clicca una casa che hai visitato per ricordarne l\'idea.' },
    unknown: { en: 'You have not been inside yet.', it: 'Non ci hai ancora messo piede.' },
    mystery: { en: 'Something is there. You have not been inside.', it: 'Lì c\'è qualcosa. Non ci hai ancora messo piede.' },
    mind: { en: 'Mind map of the course', it: 'Mappa mentale del corso' },
    town: { en: 'Town map', it: 'Mappa della città' },
    league: { en: 'League hall', it: 'Sala della Lega' },
  },
  mysteries: {
    carry: { en: 'What you carry', it: 'Cosa porti con te' },
    coins: { en: 'coins', it: 'monete' },
    key: { en: 'key of {place}', it: 'chiave di {place}' },
    nothing: { en: 'No keys or tools yet.', it: 'Ancora nessuna chiave né attrezzo.' },
  },
  settings: {
    title: { en: 'Settings', it: 'Impostazioni' },
    music: { en: 'Music', it: 'Musica' },
    voice: { en: 'Voice', it: 'Voce' },
    grass: { en: 'Grass questions', it: 'Domande nell\'erba' },
    time: { en: 'Time of day', it: 'Ora del giorno' },
    on: { en: 'on', it: 'sì' },
    off: { en: 'off', it: 'no' },
    tod: { en: { dusk: 'dusk', night: 'night', day: 'day' }, it: { dusk: 'tramonto', night: 'notte', day: 'giorno' } },
    keys: { en: 'Keys', it: 'Tasti' },
    close: { en: 'Close', it: 'Chiudi' },
  },
  keysHelp: {
    en: [['Arrows / WASD', 'walk'], ['Shift', 'walk slowly'], ['Space', 'talk, open, read'], ['Tab', 'menu'], ['1 2 3', 'menu tabs'], ['T', 'think aloud'], ['J', 'discoveries'], ['N', 'time of day'], ['G', 'grass questions'], ['M', 'music'], ['V', 'all sound'], ['L', 'voice']],
    it: [['Frecce / WASD', 'cammina'], ['Shift', 'cammina piano'], ['Spazio', 'parla, apri, leggi'], ['Tab', 'menu'], ['1 2 3', 'schede del menu'], ['T', 'pensa ad alta voce'], ['J', 'scoperte'], ['N', 'ora del giorno'], ['G', 'domande nell\'erba'], ['M', 'musica'], ['V', 'tutto l\'audio'], ['L', 'voce']],
  },
  touchHelp: {
    en: [['Tap', 'walk there, or use what you tap'], ['Double tap', 'think aloud about a thing'], ['Menu', 'this screen']],
    it: [['Tocca', 'cammina lì, o usa ciò che tocchi'], ['Doppio tocco', 'pensa ad alta voce su una cosa'], ['Menu', 'questa schermata']],
  },
};

// "2 and 4", "2, 4 and 5"
export function listOf(nums, lang = LANG) {
  const a = nums.map(String);
  return a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} ${tr(Q_WORDS.and, lang)} ${a[a.length - 1]}`;
}
export const countWord = (n, lang = LANG) => tr(Q_WORDS.numbers, lang)[n] ?? String(n);

// The tracker's line for a step (nothing at all is never returned: "free" has its quiet line)
export function trackerLine(st, lang = LANG) {
  const T = Q_WORDS.tracker, v = { person: st.person, order: st.order, place: st.place?.name, n: st.n, m: st.m };
  const key = st.kind === 'lab' ? (st.here ? 'labHere' : 'lab') : st.kind === 'duel' ? (st.here ? 'duelHere' : 'duel') : st.kind;
  return fill(tr(T[key], lang), v);
}

// What a person answers to "what should I do?"
export const nearOf = (p, lang = LANG) => tr(NEAR[p?.district?.landmark] || NEAR.here, lang);
export function answerLine(st, lang = LANG, { gate = true } = {}) {
  const key = !gate && (st.kind === 'league' || st.kind === 'ending') ? `${st.kind}Hall` : st.kind;
  return fill(tr(Q_WORDS.answer[key], lang), { person: st.person, order: st.order, place: st.place?.name, n: st.n, m: st.m, near: nearOf(st.place, lang) });
}

// The champion's line at the League hall while it is closed. missing: progress rows not done.
export function gateLine(missing, lang = LANG) {
  const experts = missing.every((r) => r.duel), one = missing.length === 1;
  const key = experts ? (one ? 'experts1' : 'experts') : one ? 'houses1' : 'houses';
  return fill(tr(Q_WORDS.gate[key], lang), { count: countWord(missing.length, lang), list: listOf(missing.map((r) => r.order), lang) });
}

// The guide's first speech: the goal in three lines, then the first step.
export function introLines(first, title = '', lang = LANG) {
  return [...tr(Q_WORDS.goal, lang).map((l) => fill(l, { title })), fill(tr(Q_WORDS.firstStep, lang), { order: first.order, place: first.name, near: nearOf(first, lang) })];
}

export function playedText(sec = 0, lang = LANG) {
  const m = Math.round(sec / 60);
  if (m < 60) return lang === 'it' ? `${m} min` : `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
}
