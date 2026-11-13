// Every word of the older engine interface that a player reads, in English and Italian, chosen by
// the course language (mechanics/config.js: English for anything else). Node-safe.
// The newer modules keep their own tables (quest/strings.js, duel/lines.js, riddles/kinds.js,
// floors/room.js, lab/shell.js TEXT, mechanics/config.js WORDS); tests/words.test.mjs checks every
// table for both languages and the same {placeholders}.
//
//   import { w } from '../data/words.js';   w('ui.musicOff')   w('town.talkTo', { name })
// A value may be a string, a list (lines to cycle or pick from) or a pair of lists.
import { tr, fill, LANG } from '../mechanics/config.js';

export { LANG };

export const WORDS = {
  // ---- the HUD, toasts, prompts ----
  ui: {
    musicOff: { en: 'Music off', it: 'Musica spenta' },
    musicOn: { en: 'Music on', it: 'Musica accesa' },
    soundOff: { en: 'All sound off', it: 'Audio spento' },
    soundOn: { en: 'Sound on', it: 'Audio acceso' },
    voiceOnTouch: { en: 'Voice on: tap Listen on a page', it: 'Voce accesa: tocca Ascolta su una pagina' },
    voiceOnKeys: { en: 'Voice on: L or Listen reads a page', it: 'Voce accesa: L o Ascolta legge una pagina' },
    voiceOff: { en: 'Voice off', it: 'Voce spenta' },
    grassOff: { en: 'Grass questions off', it: 'Domande nell\'erba spente' },
    grassOn: { en: 'Grass questions on', it: 'Domande nell\'erba accese' },
    tod: { en: { dusk: 'Dusk', night: 'Night', day: 'Day' }, it: { dusk: 'Tramonto', night: 'Notte', day: 'Giorno' } },
    listen: { en: 'Listen', it: 'Ascolta' },
    stop: { en: 'Stop', it: 'Ferma' },
    listenKey: { en: 'L  Listen', it: 'L  Ascolta' },
    stopKey: { en: 'L  Stop', it: 'L  Ferma' },
    // a prompt is "<key>  <what>"; on touch it becomes "Tap here: <what>"
    space: { en: 'Space', it: 'Spazio' },
    tapHere: { en: 'Tap here: ', it: 'Tocca qui: ' },
    leaveTouch: { en: 'Leave  ✕', it: 'Esci  ✕' },
    leaveKeys: { en: 'Esc to leave', it: 'Esc per uscire' },
    tapContinue: { en: 'Tap to continue', it: 'Tocca per continuare' },
    spaceContinue: { en: 'Space to continue', it: 'Spazio per continuare' },
    loading: { en: 'Painting {title}...', it: 'Sto dipingendo {title}...' },
  },
  // ---- the title screen ----
  title: {
    startTouch: { en: 'Tap to start', it: 'Tocca per iniziare' },
    startKeys: { en: 'Press Space or click to start', it: 'Premi Spazio o fai clic per iniziare' },
    helpTouch: { en: 'Tap where you want to go.\nTap a person, a sign or a door to use it.', it: 'Tocca dove vuoi andare.\nTocca una persona, un cartello o una porta per usarli.' },
    helpKeys: { en: 'Arrows or WASD to walk  ·  Shift to run  ·  Space to talk  ·  or click where you want to go', it: 'Frecce o WASD per camminare  ·  Shift per correre  ·  Spazio per parlare  ·  o fai clic dove vuoi andare' },
  },
  // ---- people and places ----
  town: {
    talkTo: { en: 'Talk to {name}', it: 'Parla con {name}' },
    readSign: { en: 'Read the sign', it: 'Leggi il cartello' },
    landmark: { en: 'Look at the landmark', it: 'Guarda il monumento' },
    sign: { en: 'Sign', it: 'Cartello' },
    bye: { en: 'Bye', it: 'Ciao' },
    thanksBye: { en: 'Thanks, bye', it: 'Grazie, ciao' },
    thanks: { en: 'Thanks', it: 'Grazie' },
    nobody: { en: 'Nobody answers.', it: 'Non risponde nessuno.' },
    judge: { en: 'Judge Ada', it: 'Giudice Ada' },
    host: { en: 'Host', it: 'Padrone di casa' },
    square: { en: 'Central Square', it: 'Piazza Centrale' },
    mapSign: { en: 'The map is in the menu (Tab, or the Menu button).', it: 'La mappa è nel menu (Tab, o il pulsante Menu).' },
    learnHere: { en: 'Here you learn to: {what}', it: 'Qui impari a: {what}' },
    meadow: { en: 'REVIEW MEADOW', it: 'PRATO DEL RIPASSO' },
    leagueSign: { en: 'LEAGUE', it: 'LEGA' },
    meadowText: { en: 'Quick questions hide in the tall grass, only about houses you have visited. They can be switched off in the menu.', it: 'Nell\'erba alta si nascondono domande veloci, solo sulle case che hai visitato. Si possono spegnere dal menu.' },
  },
  // the guide's default lines (world.json hub.guide replaces them)
  guide: {
    hi: { en: 'Welcome to {title}. Every house holds one idea, and a lab to try it.', it: 'Benvenuto a {title}. Ogni casa custodisce un\'idea, e un laboratorio per provarla.' },
    q1: { en: 'What is in a house?', it: 'Cosa c\'è in una casa?' },
    a1: { en: 'A lab behind the glowing door, a reading wall, and someone who knows the place and will argue about it.', it: 'Un laboratorio dietro la porta che brilla, una parete da leggere, e qualcuno che conosce il posto e ne discuterà volentieri con te.' },
    q2: { en: 'What are the meadows for?', it: 'A cosa servono i prati?' },
    a2: { en: 'Tall grass hides quick questions about houses you have already visited. Say "not now" whenever you like.', it: 'L\'erba alta nasconde domande veloci sulle case che hai già visitato. Puoi dire "non ora" quando vuoi.' },
  },
  room: {
    readWall: { en: 'Read the wall', it: 'Leggi la parete' },
    enterLab: { en: 'Enter the lab', it: 'Entra nel laboratorio' },
    openLab: { en: 'Open the lab', it: 'Apri il laboratorio' },
    showWall: { en: 'Show me the reading wall', it: 'Fammi vedere la parete' },
    machine1: { en: 'Take me to machine 1', it: 'Portami alla macchina 1' },
    showPage: { en: 'Show me the reading page', it: 'Fammi vedere la pagina da leggere' },
    colours: { en: 'What do the colours mean?', it: 'Cosa vogliono dire i colori?' },
    coloursAre: { en: 'The colour of a plaque is its thread: {list}.', it: 'Il colore di una targa è il suo filo: {list}.' },
    firstPlaque: { en: 'Start from the first plaque', it: 'Comincia dalla prima targa' },
    upstairsTag: { en: 'UPSTAIRS', it: 'DI SOPRA' },
    beltIn: { en: 'IN', it: 'ENTRA' },
    beltOut: { en: 'OUT', it: 'ESCE' },
  },
  // ---- the quiz of the tall grass ----
  quiz: {
    review: { en: 'CASE REVIEW', it: 'RIPASSO' },
    tapAnswer: { en: 'Tap an answer', it: 'Tocca una risposta' },
    keysAnswer: { en: '↑ ↓ to choose, Space to confirm', it: '↑ ↓ per scegliere, Spazio per confermare' },
    sureTouch: { en: 'How sure are you? Tap one.', it: 'Quanto sei sicuro? Tocca una scelta.' },
    sureKeys: { en: 'How sure are you?  1, 2 or 3  (or click)', it: 'Quanto sei sicuro?  1, 2 o 3  (o fai clic)' },
    bets: { en: ['Guessing', 'Fairly sure', 'Certain'], it: ['Tiro a indovinare', 'Abbastanza sicuro', 'Certo'] },
    pays: { en: 'coins {pay}  × {k}', it: 'monete {pay}  × {k}' },
    right: { en: ['Right!', 'Spot on.', 'Exactly.'], it: ['Giusto!', 'Esatto.', 'Proprio così.'] },
    wrong: { en: 'Not quite.', it: 'Non proprio.' },
    coins: { en: '{d} coins', it: '{d} monete' },
    grass: { en: 'Something rustles in the grass: a question. Take it?', it: 'Qualcosa fruscia nell\'erba: una domanda. La prendi?' },
    take: { en: 'Take it', it: 'La prendo' },
    notNow: { en: 'Not now', it: 'Non ora' },
    stopTouch: { en: 'Stop asking  (the Menu turns them back on)', it: 'Basta domande  (dal Menu si riaccendono)' },
    stopKeys: { en: 'Stop asking  (G or the menu turns them back on)', it: 'Basta domande  (G o il menu le riaccendono)' },
    banner: { en: 'from the tall grass', it: 'dall\'erba alta' },
  },
  stamp: {
    won: { en: 'WON', it: 'VINTA' },
  },
  // ---- the reading wall ----
  page: {
    anchor: { en: { analogy: 'Think of it as', metaphor: 'Think of it as', example: 'Picture this', contrast: 'Compare' }, it: { analogy: 'Pensalo come', metaphor: 'Pensalo come', example: 'Immagina', contrast: 'Confronta' } },
    stops: { en: 'Where it stops working', it: 'Dove smette di funzionare' },
    meet: { en: 'Where you meet it', it: 'Dove lo incontri' },
    explain: { en: 'Explain it yourself', it: 'Spiegalo tu' },
    sayFirst: { en: 'Say your answer out loud first, then compare', it: 'Prima rispondi ad alta voce, poi confronta' },
    remember: { en: 'Remember', it: 'Da ricordare' },
    further: { en: 'Go further', it: 'Per andare oltre' },
    wall: { en: 'Reading wall', it: 'Parete da leggere' },
    deep: { en: 'Deep dive', it: 'Approfondimento' },
    back: { en: 'Back →', it: 'Indietro →' },
    machines: { en: 'Go to the machines →', it: 'Vai alle macchine →' },
    tryLab: { en: 'Try it in the lab →', it: 'Provalo in laboratorio →' },
  },
  // ---- the mind map ----
  mind: {
    nature: { en: { river: 'across the river', shore: 'on the shore', forest: 'in the forest', meadow: 'in the meadow', hill: 'on the hill' }, it: { river: 'oltre il fiume', shore: 'sulla riva', forest: 'nel bosco', meadow: 'nel prato', hill: 'sulla collina' } },
    landmark: { en: 'landmark: {name}', it: 'monumento: {name}' },
    landmarks: { en: { fountain: 'fountain', obelisk: 'obelisk', statue: 'statue', arch: 'arch', bell: 'bell', stones: 'standing stones' }, it: { fountain: 'fontana', obelisk: 'obelisco', statue: 'statua', arch: 'arco', bell: 'campana', stones: 'menhir' } },
    next: { en: 'next', it: 'prossima' },
    visited: { en: 'visited', it: 'visitata' },
    notVisited: { en: 'not visited', it: 'non visitata' },
    lab: { en: 'lab {n}/{m}', it: 'lab {n}/{m}' },
    facts: { en: 'facts {n}/{m}', it: 'fatti {n}/{m}' },
    badge: { en: 'badge', it: 'distintivo' },
    foot: { en: 'Houses are numbered in the order of the learning path.', it: 'Le case sono numerate nell\'ordine del percorso.' },
    map: { en: 'Map', it: 'Mappa' },
  },
  // ---- the museum's plaques, the code panel ----
  plaque: {
    close: { en: 'Close', it: 'Chiudi' },
    source: { en: 'Source: {src}', it: 'Fonte: {src}' },
    earlier: { en: '← earlier', it: '← prima' },
    later: { en: 'later →', it: 'dopo →' },
    of: { en: '{i} of {n}', it: '{i} di {n}' },
    ofKeys: { en: '{i} of {n}  ·  Esc to close', it: '{i} di {n}  ·  Esc per chiudere' },
  },
  code: {
    hint: { en: 'Point at a line to see why it is there. <b>Highlighted values can be changed.</b>', it: 'Indica una riga per vedere perché c\'è. <b>I valori evidenziati si possono cambiare.</b>' },
    toggle: { en: 'Switch this line on or off', it: 'Accendi o spegni questa riga' },
  },
};

const at = (key) => key.split('.').reduce((o, k) => o?.[k], WORDS);
// the word for a key, in the course language, with {placeholders} filled
export function w(key, vars, lang = LANG) {
  const v = tr(at(key), lang);
  if (v == null) return key;
  return vars && typeof v === 'string' ? fill(v, vars) : v;
}
// a prompt: "Space  Talk to Lux" (keys) or "Tap here: Talk to Lux" (touch)
export const promptOf = (what, touchOn, lang = LANG) => (touchOn ? `${w('ui.tapHere', null, lang)}${what}` : `${w('ui.space', null, lang)}  ${what}`);
