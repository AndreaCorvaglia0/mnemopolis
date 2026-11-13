// Secrets: small rare things found by exploring. They count for nothing (no points, no progress,
// no effect on the final check) and are listed in the discoveries page (journal.js).
// Plain data, English and Italian. Placement is in place.js, the scene side in live.js.
//
// A kind:
//   title    the line in the discoveries page once found
//   found    the thought when it is found (shown in the thought bubble), or a list (picked by seed)
//   how      how it is found: 'step' (walk onto or next to it), 'think' (T or a double tap on it),
//            'still' (stand still near it), 'chain' (the mystery trail), 'open' (behind an obstacle)
//   glyph    the little picture in the journal (journal.js draws it)
export const SECRETS = {
  apple: { how: 'step', glyph: 'apple', title: { en: 'An apple, right on cue', it: 'Una mela, puntuale' },
    found: { en: 'Thud. An apple. Right on cue.', it: 'Toc. Una mela. Proprio al momento giusto.' } },
  bottle: { how: 'step', glyph: 'bottle', title: { en: 'A message in a bottle', it: 'Un messaggio in bottiglia' },
    found: { en: ['A bottle with a note: "Whoever finds this: the lamps here never quite go out."', 'A bottle with a note: "If you are reading this, you took the long way round. Good."', 'A bottle with a note: "Day twelve. The cat has my lantern again."'],
      it: ['Una bottiglia con un biglietto: "Chi la trova sappia che qui i lampioni non si spengono mai del tutto."', 'Una bottiglia con un biglietto: "Se stai leggendo, hai preso la strada lunga. Bene."', 'Una bottiglia con un biglietto: "Giorno dodici. Il gatto ha di nuovo la mia lanterna."'] } },
  hollow: { how: 'think', glyph: 'button', title: { en: 'A brass button in a hollow tree', it: 'Un bottone d\'ottone in un albero cavo' },
    found: { en: 'There\'s a hollow in this one... and a brass button inside. Someone\'s coat is missing it.', it: 'Questo è cavo... e dentro c\'è un bottone d\'ottone. A qualche cappotto manca.' } },
  stone: { how: 'step', glyph: 'coin', title: { en: 'An old coin under a loose stone', it: 'Una vecchia moneta sotto una pietra smossa' },
    found: { en: 'This stone wobbles. Underneath: an old coin with a lamp on one side.', it: 'Questa pietra balla. Sotto: una vecchia moneta con un lampione inciso.' } },
  star: { how: 'still', glyph: 'star', title: { en: 'A shooting star', it: 'Una stella cadente' },
    found: { en: 'A shooting star. I didn\'t even have to wish.', it: 'Una stella cadente. Non ho nemmeno dovuto esprimere un desiderio.' } },
  well: { how: 'think', glyph: 'well', title: { en: 'A well that answers', it: 'Un pozzo che risponde' },
    found: { en: 'Hello? ...ello? ...llo... It answered. Sort of.', it: 'Ehi? ...ehi? ...hi... Ha risposto. Più o meno.' } },
  painting: { how: 'think', glyph: 'frame', title: { en: 'A painting worth a closer look', it: 'Un quadro da guardare da vicino' },
    found: { en: 'Hm. This one is better than it looks from the door.', it: 'Mh. Da vicino è molto meglio che dalla porta.' } },
  note: { how: 'step', glyph: 'note', title: { en: 'A note left for someone', it: 'Un biglietto lasciato per qualcuno' }, found: { en: 'A folded note:', it: 'Un biglietto piegato:' } },
  prints: { how: 'chain', glyph: 'paw', title: { en: 'The lantern cat', it: 'Il gatto con la lanterna' },
    found: { en: 'Little paw prints, glowing faintly. A line is scratched beside them:', it: 'Piccole impronte di zampa, che brillano appena. Accanto, una riga incisa:' } },
  sealed: { how: 'open', glyph: 'lock', title: { en: 'Behind a locked way', it: 'Dietro una via chiusa' }, found: { en: 'Found it.', it: 'Trovato.' } },
};
export const SECRET_KINDS = Object.keys(SECRETS);

// The mystery: a small light seen far away at night, a cat carrying a lantern. It leaves 4 to 6
// trails of paw prints near the landmarks; each one found gives the next line of a rhyme (the
// last line always closes it). When all are found the cat waits in the square and can be petted,
// and its portrait appears in the discoveries.
export const RHYME = {
  en: ['A small light walks where the lanterns sleep,', 'it counts the doors and the steps they keep;', 'it naps on walls that the moss forgot,', 'it reads every sign, and it learns a lot;', 'it leaves its prints for the ones who roam:', 'go back to the square, where the light is home.'],
  it: ['Una lucina cammina dove dormono i lampioni,', 'conta le porte, i gradini e i portoni;', 'sonnecchia sui muri che il muschio scordò,', 'legge ogni cartello e qualcosa imparò;', 'lascia le impronte a chi ama girare:', 'torna alla piazza, ti sta ad aspettare.'],
};
// the rhyme for n prints: the first n - 1 lines, then the closing line
export const rhymeFor = (n, lang) => [...RHYME[lang].slice(0, n - 1), RHYME[lang][RHYME[lang].length - 1]];

export const CHAIN = {
  last: { en: 'That was the last one. Back to the square, then.', it: 'Era l\'ultima. Allora, di nuovo in piazza.' },
  waiting: { en: 'There you are. With the lantern and everything.', it: 'Eccoti. Con tanto di lanterna.' },
  pet: { en: ['It purrs. The lantern hums along.', 'A slow blink. That means friends.', 'It leans into my hand, then pretends it didn\'t.'],
    it: ['Fa le fusa. La lanterna ronza con lui.', 'Uno sbattere lento di occhi. Vuol dire amici.', 'Si appoggia alla mia mano, poi fa finta di niente.'] },
  done: { en: 'Its portrait is in the discoveries now.', it: 'Il suo ritratto ora è tra le scoperte.' },
};

// Musing nudges may hint at an undiscovered secret near the player.
export const HINTS = {
  en: ['Did something just move over there?', 'Something glints nearby. Or I\'m tired.', 'I have the feeling I\'m being watched. Kindly.', 'This corner knows something I don\'t.'],
  it: ['Si è mosso qualcosa laggiù?', 'Qualcosa luccica qui vicino. O sono stanco.', 'Ho la sensazione di essere osservato. Con gentilezza.', 'Questo angolo sa qualcosa che io non so.'],
};
