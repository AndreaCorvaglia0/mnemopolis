// Tempers: how a house owner duels, and how they give up the key when they lose. No imports, so
// the course validator can read the names (skills/knowledge-base/scripts/validate.mjs).
//
// Each temper, in English and Italian:
//   open    the opening line
//   hit     lines when the player's argument lands (2 or more; cycled without repeats)
//   score   lines when the player slips (2 or more)
//   lose    the line with which they HAND OVER THE KEY to their upper floor (first win only)
//   again   losing a friendly rematch (no key: the player has it already)
//   win     when they win: in character, then the screen adds what to look at again
// {concept} is the house's idea. Comic, never mean, never about the learner's worth.
// To add a temper: one more entry with every field in both languages (npm test checks).

export const TEMPERS = {
  smitten: {
    en: {
      open: 'A duel? With you? Oh. Fine. Try not to be so... articulate.',
      hit: ['That was... rather well put.', 'Stop being right, it is distracting.', 'Oh dear. My conviction is wobbling. And my knees.'],
      score: ['Ha! Even your mistakes are charming. Still mistakes.', 'Wrong, but you said it beautifully.'],
      lose: 'You win. Take the key to the upstairs, and... come back and argue some more? Don\'t touch anything.',
      again: 'Beaten twice. I am writing this in my diary.',
      win: 'I win! Now you have a reason to come back, haven\'t you?',
    },
    it: {
      open: 'Un duello? Con te? Oh. Va bene. Cerca di non essere così... eloquente.',
      hit: ['Questa era... detta proprio bene.', 'Smettila di avere ragione, mi distrai.', 'Oddio. La mia convinzione vacilla. E anche le ginocchia.'],
      score: ['Ah! Anche i tuoi errori sono adorabili. Ma restano errori.', 'Sbagliato, però detto benissimo.'],
      lose: 'Hai vinto. Prendi la chiave del piano di sopra, e... torna a discutere ancora? Non toccare niente.',
      again: 'Battuto due volte. Lo scrivo nel diario.',
      win: 'Ho vinto! Così hai un motivo per tornare, no?',
    },
  },
  sore: {
    en: {
      open: 'Let\'s get this over with. I have better things to lose to.',
      hit: ['Lucky.', 'Hmph. Anyone could have said that.', 'Fine. FINE.'],
      score: ['Ha! Wrong! I love this part.', 'Citation needed, and you have none.'],
      lose: 'I never liked this house anyway. Take the key to the upstairs. Don\'t touch anything.',
      again: 'Again? I demand a recount. I won\'t get one.',
      win: 'Victory. I knew this house was good for something.',
    },
    it: {
      open: 'Facciamola finita. Ho di meglio contro cui perdere.',
      hit: ['Fortuna.', 'Mpf. Lo avrebbe detto chiunque.', 'Va bene. VA BENE.'],
      score: ['Ah! Sbagliato! Questa parte mi piace.', 'Fonte, prego. E tu non ne hai.'],
      lose: 'Questa casa non mi è mai piaciuta. Prendi la chiave del piano di sopra. Non toccare niente.',
      again: 'Di nuovo? Esigo un riconteggio. Non me lo daranno.',
      win: 'Vittoria. Sapevo che questa casa serviva a qualcosa.',
    },
  },
  admirer: {
    en: {
      open: 'At last, someone who thinks. Show me how.',
      hit: ['Elegant. I may steal that argument.', 'Yes! That is exactly the point.', 'What a mind. Again!'],
      score: ['Close, but no. You will see why in a second.', 'A bold claim... and a wrong one.'],
      lose: 'Splendid. A mind like that deserves the upstairs: here is the key. Don\'t touch anything, though.',
      again: 'Still sharp. I knew it.',
      win: 'Not today. But I saw how you think: it will click.',
    },
    it: {
      open: 'Finalmente qualcuno che ragiona. Fammi vedere come.',
      hit: ['Elegante. Questo argomento te lo rubo.', 'Sì! È esattamente il punto.', 'Che testa. Ancora!'],
      score: ['Vicino, ma no. Tra un attimo vedi perché.', 'Un\'affermazione audace... e sbagliata.'],
      lose: 'Splendido. Una mente così merita il piano di sopra: ecco la chiave. Però non toccare niente.',
      again: 'Sempre affilato. Lo sapevo.',
      win: 'Non oggi. Ma ho visto come ragioni: scatterà.',
    },
  },
  letwin: {
    en: {
      open: 'Go easy on me. Or don\'t, I might let you win anyway.',
      hit: ['I let that one through. On purpose.', 'Ouch. Strategically, I mean.', 'All part of my plan.'],
      score: ['See? I could win if I wanted to.', 'Counter-example. Easy, when I try.'],
      lose: 'I let you win, obviously. Here is the key to the upstairs. Don\'t touch anything.',
      again: 'I let you win again. Generous of me.',
      win: 'I didn\'t even try. Next time I will let you win.',
    },
    it: {
      open: 'Vacci piano. O no, magari ti lascio vincere comunque.',
      hit: ['Quella te l\'ho lasciata passare. Apposta.', 'Ahi. Strategicamente, intendo.', 'Tutto secondo i miei piani.'],
      score: ['Visto? Potrei vincere, se volessi.', 'Controesempio. Facile, quando ci provo.'],
      lose: 'Ti ho lasciato vincere, ovvio. Ecco la chiave del piano di sopra. Non toccare niente.',
      again: 'Ti ho lasciato vincere di nuovo. Che generosità.',
      win: 'Non ci ho nemmeno provato. La prossima volta ti lascio vincere.',
    },
  },
  theatrical: {
    en: {
      open: 'Ladies, gentlemen, furniture! A duel of eloquence begins!',
      hit: ['Ahh! Struck to the heart of my argument!', 'The crowd gasps! (The crowd is a chair.)', 'Touché! Touché, I say!'],
      score: ['And the tide... turns!', 'A dramatic pause... for your mistake.'],
      lose: 'I fall! I perish! I... hand you the key to the upstairs. Don\'t touch anything.',
      again: 'Defeated again! Bring the curtain down!',
      win: 'Curtain! But every tragedy has a second act.',
    },
    it: {
      open: 'Signore, signori, mobili! Comincia il duello di eloquenza!',
      hit: ['Ahh! Colpito al cuore del mio argomento!', 'La folla trattiene il fiato! (La folla è una sedia.)', 'Touché! Touché, dico!'],
      score: ['E le sorti... si ribaltano!', 'Una pausa drammatica... per il tuo errore.'],
      lose: 'Cado! Soccombo! Ti... consegno la chiave del piano di sopra. Non toccare niente.',
      again: 'Sconfitto ancora! Giù il sipario!',
      win: 'Sipario! Ma ogni tragedia ha un secondo atto.',
    },
  },
  absent: {
    en: {
      open: 'A duel? Now? Where did I put my arguments...',
      hit: ['Hm? Oh, yes, that was right. I think.', 'Was that my point or yours?', 'I had a reply. It was here a moment ago.'],
      score: ['Oh! I remembered something. You are wrong.', 'Wait, I know this one. Not that.'],
      lose: 'You won? Splendid. Here is a key. The upstairs, I believe. Don\'t touch anything.',
      again: 'Have we met? You won, in any case.',
      win: 'Did I win? How odd. Look it up again, I might be confused.',
    },
    it: {
      open: 'Un duello? Adesso? Dove ho messo i miei argomenti...',
      hit: ['Mh? Ah sì, era giusto. Credo.', 'Era il mio punto o il tuo?', 'Avevo una risposta. Era qui un attimo fa.'],
      score: ['Oh! Mi è tornata in mente una cosa. Sbagli.', 'Aspetta, questa la so. Non quella.'],
      lose: 'Hai vinto? Splendido. Ecco una chiave. Del piano di sopra, credo. Non toccare niente.',
      again: 'Ci conosciamo? Comunque hai vinto.',
      win: 'Ho vinto? Strano. Ricontrolla, magari mi confondo io.',
    },
  },
  craftsman: {
    en: {
      open: 'Words are cheap. Let\'s see if yours hold weight.',
      hit: ['Solid work. That one holds.', 'Clean joint. No gaps.', 'Hm. Well made.'],
      score: ['That one cracks under load.', 'Looks fine, fails in use. Common.'],
      lose: 'Good work deserves good tools. The key to my upstairs. Don\'t touch anything.',
      again: 'Still solid. I checked.',
      win: 'Not ready yet. Back to the bench: it comes with practice.',
    },
    it: {
      open: 'Le parole costano poco. Vediamo se le tue reggono il peso.',
      hit: ['Lavoro solido. Questa regge.', 'Giunto pulito. Niente fessure.', 'Mh. Ben fatto.'],
      score: ['Questa sotto carico si crepa.', 'Sembra a posto, all\'uso cede. Capita.'],
      lose: 'Il buon lavoro merita buoni attrezzi. La chiave del mio piano di sopra. Non toccare niente.',
      again: 'Ancora solido. Ho controllato.',
      win: 'Non ancora pronto. Torna al banco: viene con la pratica.',
    },
  },
};

// The League's champion: grander, slightly pompous. On defeat they step aside.
export const CHAMPION = {
  en: {
    open: 'So. You have collected some badges. Badges are not arguments. Begin.',
    hit: ['A palpable hit. I shall allow it.', 'Hmm. Competent. Annoyingly so.', 'I rest... no, I do not rest yet.'],
    score: ['As I expected. Citation needed.', 'A bold claim. Boldly wrong.'],
    lose: 'Very well. I yield, and I step aside. The road is yours.',
    again: 'Once more defeated. I am getting used to it. I am not.',
    win: 'Not yet. A champion is patient: go back and sharpen it.',
  },
  it: {
    open: 'Dunque. Hai raccolto qualche distintivo. I distintivi non sono argomenti. Comincia.',
    hit: ['Colpo evidente. Lo concedo.', 'Mh. Competente. Fastidiosamente.', 'Ho finito... no, non ho ancora finito.'],
    score: ['Come previsto. Fonte, prego.', 'Un\'affermazione audace. Audacemente sbagliata.'],
    lose: 'E sia. Mi arrendo e mi faccio da parte. La strada è tua.',
    again: 'Sconfitto ancora. Ci sto facendo l\'abitudine. Non è vero.',
    win: 'Non ancora. Un campione sa aspettare: torna ad affinare.',
  },
};

export const TEMPER_NAMES = Object.keys(TEMPERS);

// The temper of a house: the course's `expert.temper` when it names a known one, otherwise one
// picked by a seeded random source (rnd() in [0, 1)) tied to the place.
export function temperFor(explicit, rnd) {
  if (explicit && TEMPERS[explicit]) return explicit;
  return TEMPER_NAMES[Math.floor(rnd() * TEMPER_NAMES.length) % TEMPER_NAMES.length];
}
