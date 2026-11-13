// The words of the duel, in English and Italian (chosen by the course's language, see
// mechanics/config.js). Stock phrases of debating are short and cycle without immediate repeats
// (Deck in mechanics/musings/think.js). They poke fun at debating, never at the learner.
// The tempers' own lines are in tempers.js.

export const STOCK = {
  // the player's argument lands (shown as the headline of a right answer)
  land: {
    en: ['Counter-example!', 'I rest my case.', 'Touché.', 'Exhibit A.', 'Q.E.D.', 'Point taken.', 'Hear, hear!'],
    it: ['Controesempio!', 'Non ho altro da aggiungere.', 'Touché.', 'Prova numero uno.', 'Come volevasi dimostrare.', 'Punto a favore.', 'Bravo, bravo!'],
  },
  // the opponent's rebuttal (the headline of a wrong answer)
  rebut: {
    en: ['Citation needed.', 'A bold claim...', 'Objection!', 'Not so fast.', 'Ah, a classic.', 'Tempting. Wrong.'],
    it: ['Fonte, prego.', 'Un\'affermazione audace...', 'Obiezione!', 'Non così in fretta.', 'Ah, un classico.', 'Allettante. Sbagliato.'],
  },
};

export const WORDS = {
  en: {
    duel: 'Duel of eloquence', league: 'League', friendly: 'Friendly rematch',
    you: 'You', conviction: 'Conviction', composure: 'Composure',
    turn: 'Turn {n} of {m}', stepBack: 'Step back',
    tone: 'Tone', tones: ['Murmur', 'State', 'Proclaim'],
    toneHelp: [['lands 1', 'risks 1'], ['lands 2', 'risks 2'], ['lands 3', 'risks 4']],
    toneHint: 'How sure are you? A bolder tone lands harder and risks more.',
    friendlyChip: 'friendly: no badge at stake', fromHouse: 'From house {n}, {name}: {concept}.',
    pick: 'Tap an answer', pickKeys: '1–4 answer · Q W E tone · Esc step back',
    right: 'Right', wrongWas: 'You said', tempts: 'Why “{x}” tempts:', fails: 'The answer', answerIs: 'Right answer:',
    next: 'Next', nextKey: 'Enter', finish: 'See the result',
    won: 'You won the duel', lost: 'You lost the duel', leagueWon: 'You won the League', leagueLost: 'The champion holds',
    key: 'Key to the upstairs', badge: 'Badge',
    review: 'Look again at', reviewHouse: 'The reading wall is right here, and the lab is behind the glowing door.',
    reviewWorkshop: 'The reading page is one question away, and the machines are right here.', reviewMuseum: 'The plaques along the wall tell the whole story again.',
    yieldBadge: 'Fair enough. You win, and that badge is yours.',
    reviewLeague: 'Houses to visit again:', house: 'house',
    rematch: 'Rematch', notNow: 'Not now', readWall: 'Read the wall', cont: 'Continue',
    nothingLost: 'Nothing is lost: a rematch draws other questions.',
    coins: '+{n} coins', score: '{r} right of {n}',
    outOfTurns: 'Out of questions: the fuller bar wins.',
  },
  it: {
    duel: 'Duello di eloquenza', league: 'Lega', friendly: 'Rivincita amichevole',
    you: 'Tu', conviction: 'Convinzione', composure: 'Compostezza',
    turn: 'Turno {n} di {m}', stepBack: 'Fai un passo indietro',
    tone: 'Tono', tones: ['Sussurra', 'Afferma', 'Proclama'],
    toneHelp: [['colpisce 1', 'rischia 1'], ['colpisce 2', 'rischia 2'], ['colpisce 3', 'rischia 4']],
    toneHint: 'Quanto sei sicuro? Un tono più audace colpisce di più e rischia di più.',
    friendlyChip: 'amichevole: nessun distintivo in palio', fromHouse: 'Dalla casa {n}, {name}: {concept}.',
    pick: 'Tocca una risposta', pickKeys: '1–4 risposta · Q W E tono · Esc indietro',
    right: 'Giusto', wrongWas: 'Hai detto', tempts: 'Perché “{x}” tenta:', fails: 'La risposta', answerIs: 'Risposta giusta:',
    next: 'Avanti', nextKey: 'Invio', finish: 'Vedi il risultato',
    won: 'Hai vinto il duello', lost: 'Hai perso il duello', leagueWon: 'Hai vinto la Lega', leagueLost: 'Il campione resiste',
    key: 'Chiave del piano di sopra', badge: 'Distintivo',
    review: 'Riguarda', reviewHouse: 'La parete da leggere è qui, e il laboratorio è dietro la porta che brilla.',
    reviewWorkshop: 'La pagina da leggere è a una domanda di distanza, e le macchine sono qui.', reviewMuseum: 'Le targhe lungo la parete raccontano di nuovo tutta la storia.',
    yieldBadge: 'D\'accordo. Hai vinto, e il distintivo è tuo.',
    reviewLeague: 'Case da rivisitare:', house: 'casa',
    rematch: 'Rivincita', notNow: 'Non ora', readWall: 'Leggi la parete', cont: 'Continua',
    nothingLost: 'Non perdi nulla: una rivincita pesca altre domande.',
    coins: '+{n} monete', score: '{r} giuste su {n}',
    outOfTurns: 'Domande finite: vince la barra più piena.',
  },
};

// The host's dialogue option that opens the duel (Interior.talkMaster).
export const CHALLENGE = {
  en: { first: 'Challenge me to a duel', friendly: 'A friendly rematch' },
  it: { first: 'Sfidami a duello', friendly: 'Una rivincita amichevole' },
};
