// Every word of the story, in English and Italian (docs/STORY.md). Node-safe; tests/story.test.mjs
// checks both languages and the same {placeholders}. Spare, concrete, a little melancholy: captions
// are one sentence; no exclamation marks outside the owners' own comedy.
//
// S_WORDS: the story's own words. Q_STORY: what the story changes in the main path's words
// (mechanics/quest/strings.js merges it over Q_WORDS when the story is on). REMEMBER: the duel's
// screen as remembering. R_TEMPERS / KEEPER: the owners' lines (same tempers as the duel's).

export const S_WORDS = {
  // ---- the arrival
  opening: {
    en: ['The sea has been black for hours.', 'You don\'t remember buying the ticket.', 'Nobody else gets off.'],
    it: ['Il mare è nero da ore.', 'Non ricordi di aver comprato il biglietto.', 'Non scende nessun altro.'],
  },
  lightsOut: { en: 'Behind you, the lights go out one by one.', it: 'Dietro di te, le luci si spengono una dopo l\'altra.' },
  purser: { en: 'The purser', it: 'Il commissario di bordo' },
  askName: { en: 'Your name, for the register.', it: 'Il suo nome, per il registro.' },
  nameLabel: { en: 'Name', it: 'Nome' },
  defaultName: { en: 'Traveller', it: 'Viaggiatore' },
  sign: { en: 'Sign', it: 'Firma' },
  nameKept: { en: 'Kept only on this device.', it: 'Resta solo su questo dispositivo.' },
  ofCourse: { en: '"...Of course."', it: '«...Certo.»' },
  signed: { en: '"{name}. Mind the step."', it: '«{name}. Attenzione al gradino.»' },
  skip: { en: 'Skip', it: 'Salta' },
  tapOn: { en: 'Tap to go on', it: 'Tocca per continuare' },
  keyOn: { en: 'Space to go on · Esc to skip', it: 'Spazio per continuare · Esc per saltare' },

  // ---- the notebook, on the quay
  notebook: {
    en: ['Something lies on the boards, soaked through.', 'A notebook, most of its pages torn out.', 'One line can still be read.'],
    it: ['Sulle assi c\'è qualcosa, fradicio.', 'Un taccuino, quasi tutte le pagine strappate.', 'Si legge ancora una riga.'],
  },
  firstLine: { en: 'House 1: {place}.', it: 'Casa 1: {place}.' },
  notebookPrompt: { en: 'The notebook', it: 'Il taccuino' },

  // ---- the harbour master (the guide)
  master: { en: 'Harbour master', it: 'Capo del porto' },
  masterIntro: {
    en: ['You ag— Never mind. Another one. Nobody told me.', 'Town\'s that way. The houses have numbers, if you can read.', 'Start at number one. Don\'t ask me what\'s in it. I forget.'],
    it: ['Di nuovo t— Lascia stare. Un altro. Nessuno mi aveva avvisato.', 'Il paese è da quella parte. Le case hanno un numero, se sai leggere.', 'Comincia dal numero uno. Non chiedermi cosa c\'è dentro. Non me lo ricordo.'],
  },
  ship: { en: 'The ship', it: 'La nave' },
  shipLines: {
    cold: { en: 'The ship sits dark at the quay. Nobody on deck.', it: 'La nave è ferma e buia al molo. Nessuno sul ponte.' },
    later: { en: 'The ship waits. It is in no hurry.', it: 'La nave aspetta. Non ha fretta.' },
    ended: { en: 'The ship waits at the quay. It always does.', it: 'La nave aspetta al molo. Aspetta sempre.' },
    board: { en: 'Board the ship', it: 'Sali sulla nave' },
  },

  // ---- people, by how much the town remembers
  greet: {
    cold: {
      en: ['I don\'t know you.', 'Rain. Always rain. What do you want?', 'I had something to do today. I forget what.', 'Do I owe you money? I don\'t remember.'],
      it: ['Non ti conosco.', 'Pioggia. Sempre pioggia. Cosa vuoi?', 'Oggi avevo qualcosa da fare. Non ricordo cosa.', 'Ti devo dei soldi? Non me lo ricordo.'],
    },
    thawing: {
      en: ['Hm. You again.', 'Strange. I slept well last night.', 'A light came on across the way. First in a long time.', 'You\'re the one going house to house.'],
      it: ['Mh. Ancora tu.', 'Strano. Stanotte ho dormito bene.', 'Si è accesa una luce di là. La prima da tanto.', 'Sei tu che vai di casa in casa.'],
    },
    warm: {
      en: ['Ah, it\'s you. Good.', 'The rain\'s letting up. Your doing, they say.', 'I remembered my sister\'s birthday. First time in years.', 'Sit a moment, if you like.'],
      it: ['Ah, sei tu. Bene.', 'La pioggia sta calando. Merito tuo, dicono.', 'Mi sono ricordato del compleanno di mia sorella. Era da anni.', 'Siediti un momento, se vuoi.'],
    },
  },
  // what a cold person answers to "what should I do now?": curt; the notebook always has the way
  curt: {
    en: ['How should I know? Look in that notebook of yours.', 'Ask someone else.', 'Not my business. Your notebook seems to know.', 'Leave me be. It\'s raining.'],
    it: ['Che ne so io? Guarda in quel tuo taccuino.', 'Chiedi a qualcun altro.', 'Non sono affari miei. Il tuo taccuino sembra saperlo.', 'Lasciami stare. Piove.'],
  },

  // ---- a window lights up (back in town after a house remembers)
  windowLit: { en: 'A light comes on at {place}.', it: 'A {place} si accende una luce.' },
  rainEases: { en: 'The rain eases, a little.', it: 'La pioggia cala, un poco.' },

  // ---- upstairs: the mementos
  mementoIntro: { en: 'Something up here does not belong to the house.', it: 'Quassù c\'è qualcosa che non appartiene alla casa.' },
  mementoGiven: { en: '{name} holds something out: it was never theirs.', it: '{name} ti porge qualcosa: non è mai stato suo.' },
  pageBack: { en: 'A page of the notebook comes back.', it: 'Una pagina del taccuino torna al suo posto.' },
  mementoPrompt: { en: 'Look at it', it: 'Guardalo' },
  mementos: {
    page: { title: { en: 'A page', it: 'Una pagina' }, thought: { en: 'A page from the notebook. It must have blown in here.', it: 'Una pagina del taccuino. Dev\'essere volata fin qui.' } },
    ticket: { title: { en: 'A ticket', it: 'Un biglietto' }, thought: { en: 'A ticket for the same ship. Years old.', it: 'Un biglietto per la stessa nave. Vecchio di anni.' } },
    flower: { title: { en: 'A pressed flower', it: 'Un fiore pressato' }, thought: { en: 'A pressed flower, dated the day I arrived, in another year.', it: 'Un fiore pressato, con la data del giorno del mio arrivo, ma di un altro anno.' } },
    photo: { title: { en: 'A photograph', it: 'Una fotografia' }, thought: { en: 'This house, these people, and one face scratched away.', it: 'Questa casa, queste persone, e un volto graffiato via.' } },
    drawing: { title: { en: 'A child\'s drawing', it: 'Il disegno di un bambino' }, thought: { en: 'Someone drew the lighthouse lit, and nobody here has ever seen it lit.', it: 'Qualcuno ha disegnato il faro acceso, e qui nessuno l\'ha mai visto acceso.' } },
    letter: { title: { en: 'A letter', it: 'Una lettera' }, thought: { en: 'A letter never sent, and this is my handwriting.', it: 'Una lettera mai spedita, ed è la mia calligrafia.' } },
    watch: { title: { en: 'A pocket watch', it: 'Un orologio da tasca' }, thought: { en: 'A pocket watch, stopped at the hour the ship came in.', it: 'Un orologio da tasca, fermo all\'ora in cui è arrivata la nave.' } },
    card: { title: { en: 'A visiting card', it: 'Un biglietto da visita' }, thought: { en: 'A visiting card, and the name on it is mine: {name}.', it: 'Un biglietto da visita, e il nome sopra è il mio: {name}.' } },
  },
  mementoSection: { en: 'Things that are not theirs', it: 'Cose che non sono loro' },
  mementoNone: { en: 'Nothing yet. Upstairs, perhaps.', it: 'Ancora niente. Di sopra, forse.' },
  cardText: { en: 'Kept on this device', it: 'Conservato su questo dispositivo' },

  // ---- the notebook (the Journey tab)
  tab: { en: 'Notebook', it: 'Taccuino' },
  theWay: { en: 'The way', it: 'La strada' },
  pages: { en: 'Pages', it: 'Pagine' },
  torn: { en: 'torn out', it: 'strappata' },
  pageOf: { en: 'house {order}', it: 'casa {order}' },
  next: { en: 'Next', it: 'Prossimo' },
  fogMark: { en: 'fog again: go back', it: 'di nuovo nebbia: torna' },
  remembered: { en: 'remembers', it: 'ricorda' },
  notYet: { en: 'forgets', it: 'dimentica' },
  attic: { en: 'upstairs', it: 'di sopra' },
  lighthouse: { en: 'The lighthouse', it: 'Il faro' },
  dark: { en: 'dark', it: 'spento' },
  lit: { en: 'lit', it: 'acceso' },
  lastLine: { en: 'Everything leads to the lighthouse. At its door, say: {word}.', it: 'Tutto porta al faro. Alla sua porta, di\': {word}.' },
  goal: {
    en: ['The people here have forgotten what they knew. In each house, set its things working again, then help the owner remember.', 'The pages of this notebook are somewhere in town.'],
    it: ['Qui la gente ha dimenticato quello che sapeva. In ogni casa rimetti in funzione le cose, poi aiuta chi ci abita a ricordare.', 'Le pagine di questo taccuino sono da qualche parte in paese.'],
  },
  endedLine: { en: 'The town remembers. Stay as long as you like.', it: 'Il paese ricorda. Resta quanto vuoi.' },

  // ---- the lighthouse
  locked: { en: 'Locked from the inside.', it: 'Chiuso dall\'interno.' },
  lighthouseDoor: { en: 'The lighthouse door', it: 'La porta del faro' },
  understood: {
    en: ['The pages, in order, say one thing.', '{big}', 'And under it, in the same hand: the lighthouse.'],
    it: ['Le pagine, in ordine, dicono una cosa sola.', '{big}', 'E sotto, con la stessa mano: il faro.'],
  },
  doorClue: { en: 'Who is there? Say the word, if you have it.', it: 'Chi è? Di\' la parola, se ce l\'hai.' },
  doorAsk: { en: 'Say the word from the notebook.', it: 'Di\' la parola del taccuino.' },
  doorMiss1: { en: 'The last page of the notebook. The word is written there.', it: 'L\'ultima pagina del taccuino. La parola è scritta lì.' },
  doorMiss2: { en: 'Of course. The word is "{word}".', it: 'Ma certo. La parola è «{word}».' },
  doorOpen: { en: 'Bolts slide. The door gives onto a stair.', it: 'I chiavistelli scorrono. La porta dà su una scala.' },
  climb: {
    en: ['The stair turns and turns.', 'At the top, by the dead lamp, someone in a hood is waiting.'],
    it: ['La scala gira e gira.', 'In cima, accanto alla lampada spenta, aspetta qualcuno con il cappuccio.'],
  },
  keeper: { en: 'The keeper', it: 'Il guardiano' },
  keeperAgain: { en: 'The keeper waits at the top.', it: 'Il guardiano aspetta in cima.' },
  keeperFace: { en: 'Face the keeper', it: 'Affronta il guardiano' },
  notNow: { en: 'Not now', it: 'Non ora' },
  climbDown: { en: 'You go back down. The stair remembers your steps.', it: 'Torni giù. La scala ricorda i tuoi passi.' },

  // ---- the lamp room, after the final remembering: the keeper lights the lamp; the register
  keeperLamp: {
    en: ['"What you are looking for was never here."', '"It came with you, on the ship."'],
    it: ['«Quello che cerchi non è mai stato qui.»', '«È venuto con te, sulla nave.»'],
  },
  registerSeen: { en: 'On the desk, the arrivals register lies open.', it: 'Sul tavolo è aperto il registro degli arrivi.' },
  signature: { en: 'That is my signature.', it: 'Questa è la mia firma.' },
  // ---- the walk back to the ship: everyone says goodbye as to someone they have seen leave before
  farewell: {
    en: ['Safe crossing. See you.', 'Off again? Mind the weather.', 'Go on, then. You know the way back.', 'The windows stay lit. They always do, after.'],
    it: ['Buona traversata. A presto.', 'Di nuovo in partenza? Occhio al tempo.', 'Vai, allora. La strada per tornare la conosci.', 'Le finestre restano accese. Dopo, restano sempre accese.'],
  },
  berth: { en: 'Same berth as always.', it: 'Stesso ormeggio di sempre.' },
  // ---- the quay: the pages torn out; the cover left where it was found; the purser; the loop
  tear: {
    en: ['The notebook is full.', 'You tear the pages out, one by one.', 'The wind scatters them along the quay.'],
    it: ['Il taccuino è pieno.', 'Strappi le pagine, una alla volta.', 'Il vento le sparpaglia lungo il molo.'],
  },
  dropped: { en: 'You let the cover fall where you found it.', it: 'Lasci cadere la copertina dove l\'avevi trovata.' },
  anotherRound: { en: '"Another round, {name}?"', it: '«Un altro giro, {name}?»' },
  aboard: { en: 'You go aboard.', it: 'Sali a bordo.' },
  // ---- after the ending: the fog returns
  fogHi: { en: 'Ah, there you are. Help me: it has gone foggy again.', it: 'Ah, eccoti. Aiutami: è tornata la nebbia.' },
  fogHelp: { en: 'Help {name} remember again', it: 'Aiuta {name} a ricordare di nuovo' },
  fogBack: { en: 'There. It stays a little longer every time.', it: 'Ecco. Ogni volta resta un po\' di più.' },
  fogStill: { en: 'Still foggy. Another time.', it: 'Ancora nebbia. Un\'altra volta.' },

  // ---- the lantern cat, the only one who never forgot
  cat: { en: 'The cat looks at you like someone who never forgot a thing. It probably didn\'t.', it: 'Il gatto ti guarda come chi non ha mai dimenticato niente. Probabilmente è così.' },

  // ---- the ending card
  card: {
    title: { en: 'Another round.', it: 'Un altro giro.' },
    big: { en: 'What you carry this time', it: 'Cosa porti con te, questa volta' },
  },
};

// What the story changes in the main path's words (merged over Q_WORDS in quest/strings.js).
export const Q_STORY = {
  tracker: {
    intro: { en: 'Talk to the harbour master', it: 'Parla con il capo del porto' },
    duelHere: { en: 'Help {person} remember', it: 'Aiuta {person} a ricordare' },
    duel: { en: 'House {order}: help {person} remember', it: 'Casa {order}: aiuta {person} a ricordare' },
    mementoHere: { en: 'Look upstairs', it: 'Guarda di sopra' },
    memento: { en: 'House {order}: look upstairs', it: 'Casa {order}: guarda di sopra' },
    league: { en: 'Go to the lighthouse', it: 'Vai al faro' },
    ending: { en: 'Go back to the ship', it: 'Torna alla nave' },
    free: { en: 'The town remembers', it: 'Il paese ricorda' },
  },
  answer: {
    intro: { en: 'Talk to the harbour master. Down on the quay.', it: 'Parla con il capo del porto. Giù al molo.' },
    visit: { en: 'House {order}, {place}, {near}.', it: 'La casa {order}, {place}, {near}.' },
    lab: { en: '{place}. Its machines are still half asleep ({n} of {m}).', it: '{place}. Le sue macchine sono ancora mezze addormentate ({n} di {m}).' },
    duel: { en: '{person}, at {place}. Sit with them and help them remember.', it: 'Vai da {person}, a {place}. Ha bisogno di ricordare.' },
    memento: { en: 'Upstairs at {place}. Nobody goes up there any more.', it: 'Di sopra, a {place}. Lassù non sale più nessuno.' },
    league: { en: 'The lighthouse. It has been dark for as long as anyone remembers, which is not long.', it: 'Il faro. È spento da che si ricordi, cioè da poco.' },
    ending: { en: 'The ship. You know the way.', it: 'La nave. La strada la conosci.' },
    leagueHall: { en: 'The lighthouse. It has been dark for as long as anyone remembers, which is not long.', it: 'Il faro. È spento da che si ricordi, cioè da poco.' },
    endingHall: { en: 'The ship. You know the way.', it: 'La nave. La strada la conosci.' },
    free: { en: 'Whatever you like. We remember now.', it: 'Quello che vuoi. Adesso ricordiamo.' },
  },
  hints: {
    en: ['Not every house in town is on your way, you know.', 'I saw a light {near} last night. I thought nobody lived there.', 'There is a cat with a lantern. Or I dreamt it.', 'Somebody {near} remembers more than they let on.'],
    it: ['Non tutte le case del paese sono sulla tua strada, sai.', 'Ieri sera ho visto una luce {near}. Credevo che non ci abitasse nessuno.', 'C\'è un gatto con una lanterna. O l\'ho sognato.', 'Qualcuno {near} ricorda più di quanto dica.'],
  },
  congrats: {
    en: ['Back again. The windows stayed lit, you see.', 'There you are again.', 'I remember you now. I think I always did.'],
    it: ['Di nuovo qui. Le finestre sono rimaste accese, vedi.', 'Eccoti di nuovo.', 'Adesso mi ricordo di te. Credo di essermene sempre ricordato.'],
  },
  goalShort: S_WORDS.goal,
  tabs: { journey: S_WORDS.tab },
  journey: {
    duel: { en: 'remember', it: 'ricordare' },
    won: { en: 'remembers', it: 'ricorda' },
    league: { en: 'The lighthouse', it: 'Il faro' },
    locked: { en: 'dark', it: 'spento' },
    open: { en: 'the door', it: 'la porta' },
    wonLeague: { en: 'lit', it: 'acceso' },
    more: { en: 'The town keeps a few things to itself.', it: 'Il paese tiene qualcosa per sé.' },
    done: S_WORDS.endedLine,
  },
  map: { league: { en: 'Lighthouse', it: 'Faro' } },
  badge: { en: '{place} remembers', it: '{place} ricorda' },
  leagueWon: { en: 'The lighthouse', it: 'Il faro' },
  card: S_WORDS.card,
};

// The duel's screen, as remembering.
export const REMEMBER = {
  en: {
    duel: 'Remembering', league: 'The keeper', friendly: 'Remembering together',
    you: 'You', conviction: 'Memory', composure: 'Clarity',
    turn: 'Question {n} of {m}', stepBack: 'Step back',
    friendlyChip: 'together: nothing at stake', fromHouse: 'From house {n}, {name}: {concept}.',
    pick: 'Tap an answer', pickKeys: '1–4 answer · Esc step back',
    right: 'It comes back', tempts: 'The false memory, “{x}”:', answerIs: 'What is true:',
    next: 'Next', finish: 'See how it ends',
    won: '{name} remembers', lost: 'The fog holds, for now', leagueWon: 'You remember', leagueLost: 'The fog holds',
    key: 'Key to the upstairs', badge: 'A window lights up',
    review: 'Look again at', reviewHouse: 'The reading wall is right here, and the lab is behind the glowing door.',
    reviewWorkshop: 'The reading page is one question away, and the machines are right here.', reviewMuseum: 'The plaques along the wall tell the whole story again.',
    yieldBadge: 'It\'s back. All of it. Thank you.',
    reviewLeague: 'Houses to visit again:', house: 'house',
    rematch: 'Try again', notNow: 'Not now', readWall: 'Read the wall', cont: 'Continue',
    nothingLost: 'Nothing is lost: next time, other questions.',
    coins: '+{n} coins', score: '{r} right of {n}',
    outOfTurns: 'Out of questions: the fuller bar wins.',
  },
  it: {
    duel: 'Ricordare', league: 'Il guardiano', friendly: 'Ricordare insieme',
    you: 'Tu', conviction: 'Memoria', composure: 'Lucidità',
    turn: 'Domanda {n} di {m}', stepBack: 'Fai un passo indietro',
    friendlyChip: 'insieme: niente in palio', fromHouse: 'Dalla casa {n}, {name}: {concept}.',
    pick: 'Tocca una risposta', pickKeys: '1–4 risposta · Esc indietro',
    right: 'Torna in mente', tempts: 'Il falso ricordo, «{x}»:', answerIs: 'Com\'è davvero:',
    next: 'Avanti', finish: 'Vedi come finisce',
    won: '{name} ricorda', lost: 'La nebbia tiene, per ora', leagueWon: 'Ricordi', leagueLost: 'La nebbia resiste',
    key: 'Chiave del piano di sopra', badge: 'Si accende una finestra',
    review: 'Riguarda', reviewHouse: 'La parete da leggere è qui, e il laboratorio è dietro la porta che brilla.',
    reviewWorkshop: 'La pagina da leggere è a una domanda di distanza, e le macchine sono qui.', reviewMuseum: 'Le targhe lungo la parete raccontano di nuovo tutta la storia.',
    yieldBadge: 'È tornato. Tutto quanto. Grazie.',
    reviewLeague: 'Case da rivisitare:', house: 'casa',
    rematch: 'Riprova', notNow: 'Non ora', readWall: 'Leggi la parete', cont: 'Continua',
    nothingLost: 'Non perdi nulla: la prossima volta, altre domande.',
    coins: '+{n} monete', score: '{r} giuste su {n}',
    outOfTurns: 'Domande finite: vince la barra più piena.',
  },
};
export const REMEMBER_STOCK = {
  land: {
    en: ['It comes back.', 'Yes. That was it.', 'A piece returns.', 'Clearer now.', 'That rings true.', 'There it is.'],
    it: ['Ritorna.', 'Sì. Era così.', 'Un pezzo torna.', 'Ora è più chiaro.', 'Questo suona vero.', 'Eccolo.'],
  },
  rebut: {
    en: ['A false memory.', 'The fog thickens.', 'Not how it went.', 'They cling to it.', 'Close, and wrong.', 'Mist again.'],
    it: ['Un falso ricordo.', 'La nebbia si infittisce.', 'Non è andata così.', 'Ci si aggrappa.', 'Vicino, ma sbagliato.', 'Di nuovo foschia.'],
  },
};
export const REMEMBER_CHALLENGE = {
  en: { first: 'Help {name} remember', friendly: 'Remember together again' },
  it: { first: 'Aiuta {name} a ricordare', friendly: 'Ricordiamo ancora insieme' },
};

// The owners' lines when remembering, by temper (the same names as duel/tempers.js):
//   open (confused, curt), hit (a piece comes back), score (they defend a false memory),
//   lose (they remember, and hand over the KEY), again (a friendly return), win (the fog holds).
export const R_TEMPERS = {
  smitten: {
    en: { open: 'Do I know you? I feel I should. Sit, before I forget I asked.', hit: ['Yes... that\'s right. How did you know?', 'It\'s coming back. So are you, somehow.', 'You have a way of reminding people.'], score: ['No, I\'m quite sure. Sure about you, too, oddly.', 'That\'s how I remember it, and I\'m keeping it.'], lose: 'I remember. All of it. You I\'d remember anywhere. Here\'s the key to the upstairs. Don\'t be long.', again: 'Remembered twice, by you. I\'ll write it down this time.', win: 'Still foggy. Come back? For the memory, of course.' },
    it: { open: 'Ci conosciamo? Mi sembra di sì. Siediti, prima che dimentichi di avertelo chiesto.', hit: ['Sì... è così. Come facevi a saperlo?', 'Mi sta tornando in mente. E anche tu, in qualche modo.', 'Hai un modo tutto tuo di far ricordare la gente.'], score: ['No, non ho dubbi. Neanche su di te, stranamente.', 'Io lo ricordo così, e così me lo tengo.'], lose: 'Ricordo. Tutto. Te ti ricorderei ovunque. Ecco la chiave del piano di sopra. Non metterci troppo.', again: 'Ricordato due volte, e sempre grazie a te. Stavolta lo scrivo.', win: 'È ancora tutto annebbiato. Torni? Per la memoria, s\'intende.' },
  },
  sore: {
    en: { open: 'I don\'t need help remembering. I remember perfectly. What was your name?', hit: ['I was about to say that.', 'Lucky guess. I\'d have got there.', 'Fine. That one came back on its own.'], score: ['Ha. That\'s how it was. I would know.', 'Wrong, and that much I do remember.'], lose: 'Fine. I remember. I did it all myself. Take the key to the upstairs and tell no one.', again: 'Again? I was remembering perfectly well without you.', win: 'See? Nothing wrong with my memory. Whatever you were asking.' },
    it: { open: 'Non ho bisogno di aiuto per ricordare. Ricordo benissimo. Come hai detto che ti chiami?', hit: ['Stavo per dirlo io.', 'Fortuna. Ci arrivavo anche senza di te.', 'Va bene. Questa mi è tornata da sola.'], score: ['Ah. Era proprio così. Lo saprei.', 'Sbagliato, e questo almeno me lo ricordo.'], lose: 'E va bene. Ricordo. Ho fatto tutto da me. Prendi la chiave del piano di sopra e non dirlo a nessuno.', again: 'Di nuovo? Ricordavo benissimo anche senza di te.', win: 'Visto? La mia memoria funziona. Qualunque cosa mi stessi chiedendo.' },
  },
  admirer: {
    en: { open: 'Someone who still remembers things. Help me. I used to know this house.', hit: ['Yes. That\'s exactly it.', 'Clever. It was there all along.', 'Go on. It\'s all coming back.'], score: ['Hm, no, I\'d swear it went like that.', 'That\'s what I remember. Is it wrong?'], lose: 'It\'s all back. You have a gift. The key to the upstairs: whatever is up there, it waited for you.', again: 'Still sharp. And so am I, thanks to you.', win: 'Not yet. But you showed me where to look.' },
    it: { open: 'Qualcuno che ricorda ancora le cose. Aiutami. Questa casa la conoscevo.', hit: ['Sì. È proprio così.', 'Brillante. Era lì da sempre.', 'Continua. Mi sta tornando tutto.'], score: ['Mh, no, giurerei che fosse andata così.', 'Io me lo ricordo così. Sbaglio?'], lose: 'È tornato tutto. Hai un dono. La chiave del piano di sopra: qualunque cosa ci sia lassù, ha aspettato te.', again: 'Lucidità intatta. Anche la mia, grazie a te.', win: 'Non ancora. Ma mi hai mostrato dove cercare.' },
  },
  letwin: {
    en: { open: 'Forgot? Me? I never forget. I\'m only... testing you.', hit: ['Correct. As I knew all along.', 'Exactly what I was going to say.', 'Good. You passed that one. My test, I mean.'], score: ['Ha. A trap. I set it on purpose.', 'Wrong, as I remembered all along.'], lose: 'I let you remember for me. Generous of me. Here\'s the key to the upstairs.', again: 'I let you win again. Too kind, that\'s my trouble.', win: 'I won, naturally. I never forgot a thing.' },
    it: { open: 'Dimenticato? Io? Io non dimentico mai. Ti stavo solo... mettendo alla prova.', hit: ['Giusto. Come sapevo dall\'inizio.', 'Proprio quello che stavo per dire.', 'Bene. Questa l\'hai passata. La mia prova, intendo.'], score: ['Ah. Una trappola. L\'ho messa apposta.', 'Sbagliato, come ricordavo benissimo.'], lose: 'Ti ho lasciato ricordare al posto mio. Che generosità. Ecco la chiave del piano di sopra.', again: 'Ti ho lasciato vincere di nuovo. Che bontà, la mia.', win: 'Ho vinto, naturalmente. Non ho mai dimenticato niente.' },
  },
  theatrical: {
    en: { open: 'Memory, the great deserter. Sit. Let us summon it together.', hit: ['It returns, like a prodigal.', 'Light, through the fog, a light.', 'Bravo. The curtain lifts.'], score: ['No. I cling to it like a sinking ship.', 'A false memory, but what a beautiful one.'], lose: 'I remember! Every line! Take the key to the upstairs, and take a bow.', again: 'An encore, and still word-perfect. Mostly you.', win: 'The fog wins this act. There are other acts.' },
    it: { open: 'La memoria, la grande disertrice. Siediti. Evochiamola insieme.', hit: ['Ritorna, come il figliol prodigo.', 'Luce, nella nebbia, una luce.', 'Bravo. Il sipario si alza.'], score: ['No. Mi ci aggrappo come a una nave che affonda.', 'Un falso ricordo, ma che bel ricordo.'], lose: 'Ricordo! Ogni battuta! Prendi la chiave del piano di sopra, e un inchino.', again: 'Un bis, e ancora a memoria. Merito tuo, quasi tutto.', win: 'Questo atto lo vince la nebbia. Ci sono altri atti.' },
  },
  absent: {
    en: { open: 'Oh, hello. Were we... no. Sorry. What was I doing?', hit: ['Oh. Yes. That.', 'Of course. I wrote that down somewhere.', 'That\'s it. Where are my glasses?'], score: ['I\'m fairly sure it was that. Fairly.', 'That\'s what I remember. Or dreamt.'], lose: 'I remember. Oh, that\'s nice. Here\'s the key to the upstairs. It was in my pocket all along.', again: 'Did we do this before? It was lovely both times.', win: 'Sorry, it slipped away again. Come back? I\'ll try to be here.' },
    it: { open: 'Oh, ciao. Stavamo... no. Scusa. Cosa stavo facendo?', hit: ['Oh. Sì. Quello.', 'Ma certo. L\'avevo scritto da qualche parte.', 'Ecco. Dove sono i miei occhiali?'], score: ['Mi pare proprio che fosse così. Mi pare.', 'Io lo ricordo così. O l\'ho sognato.'], lose: 'Ricordo. Che bello. Ecco la chiave del piano di sopra. Era in tasca da sempre.', again: 'L\'abbiamo già fatto? È stato bello tutte e due le volte.', win: 'Scusa, mi è sfuggito di nuovo. Torni? Cercherò di esserci.' },
  },
  craftsman: {
    en: { open: 'My hands remember the work. My head doesn\'t. Help it catch up.', hit: ['Yes. The hands knew it first.', 'That\'s the trade. It\'s coming back.', 'Good work. Clean.'], score: ['No, that\'s how we always did it. I think.', 'That\'s how I remember it. Thirty years, or three days.'], lose: 'There it is, all of it. Good work. The key to the upstairs; mind the stairs, I built them.', again: 'Sharp as a new chisel. Both of us.', win: 'Not yet. Come back when the fog lifts a little.' },
    it: { open: 'Le mani ricordano il mestiere. La testa no. Aiutala a starci dietro.', hit: ['Sì. Le mani lo sapevano per prime.', 'È il mestiere. Mi sta tornando.', 'Bel lavoro. Pulito.'], score: ['No, si è sempre fatto così. Credo.', 'Io lo ricordo così. Trent\'anni, o tre giorni.'], lose: 'Eccolo, tutto quanto. Bel lavoro. La chiave del piano di sopra: attento alle scale, le ho fatte io.', again: 'Affilati come uno scalpello nuovo. Tutti e due.', win: 'Non ancora. Torna quando la nebbia si alza un po\'.' },
  },
};
export const KEEPER = {
  en: { open: 'You came up. They always do, in the end. Answer, and we will see what you remember.', hit: ['Yes. You kept that one.', 'That stayed with you.', 'Good. Further up.'], score: ['Ah. That one the fog had first.', 'No. You wanted it to be that.'], lose: 'Enough. You remember. Then you should see who kept it for you.', again: 'Again, and still clear. Good.', win: 'Not yet. Some of it is still out there in the rain.' },
  it: { open: 'Sei salito. Lo fanno tutti, alla fine. Rispondi, e vedremo cosa ricordi.', hit: ['Sì. Questo l\'hai tenuto.', 'Questo è rimasto con te.', 'Bene. Più su.'], score: ['Ah. Questo la nebbia l\'ha preso prima.', 'No. Volevi che fosse così.'], lose: 'Basta. Ricordi. Allora è giusto che tu veda chi l\'ha custodito per te.', again: 'Di nuovo, e ancora chiaro. Bene.', win: 'Non ancora. Qualcosa è ancora là fuori, sotto la pioggia.' },
};

// The player's thoughts that point at the next step (musings/think.js), where the story says it
// differently from the plain town.
export const NUDGES_STORY = {
  duelHere: {
    en: ['{person} is right there, trying to remember something.', 'Enough about {n}. {person} looks lost in thought.'],
    it: ['{person} è proprio lì, e cerca di ricordare qualcosa.', 'Basta con {n}. {person} sembra perso nei pensieri.'],
  },
  duel: {
    en: ['{person} at {place} has forgotten something. I could help.', 'It\'s just {n}... and {person} is still in the fog, {near}.'],
    it: ['A {place}, {person} ha dimenticato qualcosa. Potrei aiutare.', 'È solo {n}... e {person} è ancora nella nebbia, {near}.'],
  },
  memento: {
    en: ['Upstairs at {place}. Something is waiting up there.', 'I have the key to {place}. I should look upstairs.'],
    it: ['Di sopra, a {place}. Lassù c\'è qualcosa che aspetta.', 'Ho la chiave di {place}. Dovrei guardare di sopra.'],
  },
  league: {
    en: ['The lighthouse. Everything in the notebook points there.', 'It\'s just {n}... and the lighthouse is still dark.'],
    it: ['Il faro. Tutto nel taccuino porta lì.', 'È solo {n}... e il faro è ancora spento.'],
  },
  ending: {
    en: ['The ship. Same berth as always.', 'It\'s just {n}. The ship is waiting, and I know the way.'],
    it: ['La nave. Stesso ormeggio di sempre.', 'È solo {n}. La nave aspetta, e la strada la conosco.'],
  },
  free: {
    en: ['The town remembers now. It still hides a thing or two.', 'No rain. I can look around properly.', 'The cat with the lantern never forgot anything, I think.'],
    it: ['Adesso il paese ricorda. Nasconde ancora qualcosa.', 'Niente pioggia. Posso guardarmi intorno per bene.', 'Il gatto con la lanterna non ha mai dimenticato niente, credo.'],
  },
};
