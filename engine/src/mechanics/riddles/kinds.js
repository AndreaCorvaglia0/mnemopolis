// Kinds of lock: plain data, Node-safe. English and Italian.
//
// A kind gives:
//   zone     the group of furniture that carries it in a room (gen/interior/zones.js)
//   piece    the piece of that group the player uses (gen/interior/pieces.js)
//   keypad   number and code answers are typed on big digit keys (otherwise a text field)
//   name     what the prompt calls it ("Space  Try the safe"), with its article in Italian
//   title    the heading of the close-up
//   ask      the line under the clue that says what to do (the clue itself comes from the course)
//   clueBy   how the clue is shown: 'note' (a sticky note), 'voice' (said through the hatch)
//   miss     the lock's own reaction to a wrong answer (cycled)
//   open     the lock's reaction when it opens
//   doc      what a secret note is shown as: the heading of the paper or the file
// The painters of the close-ups are in art.js (one function per kind), the pieces in the room
// in gen/interior/furniture.js. To add a kind: one entry here, a painter in art.js, a zone with
// its piece in zones.js and pieces.js, and its musings in musings/lines.js (key objects: `point`). `npm test` checks all four.
export const LOCK_KINDS = {
  safe: {
    zone: 'vault', piece: 'safe', keypad: true, clueBy: 'note',
    name: { en: 'safe', it: 'la cassaforte' }, title: { en: 'A safe', it: 'Una cassaforte' },
    ask: { en: 'Type the combination.', it: 'Digita la combinazione.' },
    miss: { en: ['Bzzt. The dial clicks back to zero.', 'A dry buzz. Nothing moves.', 'The handle will not turn.'], it: ['Bzzt. La manopola torna a zero.', 'Un ronzio secco. Non si muove niente.', 'La maniglia non gira.'] },
    open: { en: 'Clunk. The handle turns, and the heavy door swings open.', it: 'Clunk. La maniglia gira e la porta pesante si apre.' },
    doc: { en: 'A folded paper, inside', it: 'Un foglio piegato, dentro' },
  },
  computer: {
    zone: 'terminal', piece: 'pcdesk', keypad: false, clueBy: 'note',
    name: { en: 'computer', it: 'il computer' }, title: { en: 'A computer', it: 'Un computer' },
    ask: { en: 'Type the password.', it: 'Digita la password.' },
    miss: { en: ['ACCESS DENIED.', 'Wrong password. The cursor blinks, unimpressed.', 'Login failed. Try again.'], it: ['ACCESSO NEGATO.', 'Password errata. Il cursore lampeggia, per niente colpito.', 'Accesso non riuscito. Riprova.'] },
    open: { en: 'Welcome. One file on the desktop.', it: 'Benvenuto. Un file sulla scrivania.' },
    doc: { en: 'A file on the screen', it: 'Un file sullo schermo' },
  },
  door: {
    zone: 'hatch', piece: 'hatchdoor', keypad: false, clueBy: 'voice',
    name: { en: 'door with the hatch', it: 'la porta con lo spioncino' }, title: { en: 'A door with a hatch', it: 'Una porta con lo spioncino' },
    ask: { en: 'Say the password.', it: 'Di\' la parola d\'ordine.' },
    miss: { en: ['"No." The eyes narrow.', '"Wrong word." The hatch rattles.', '"Hm. No. Think, then knock again."'], it: ['"No." Gli occhi si stringono.', '"Parola sbagliata." Lo spioncino sbatte.', '"Mh. No. Pensaci, poi bussa di nuovo."'] },
    open: { en: 'The hatch slams shut. Bolts slide, one, two, three. The door opens.', it: 'Lo spioncino si chiude di colpo. I chiavistelli scorrono, uno, due, tre. La porta si apre.' },
    doc: { en: 'Pinned inside the door', it: 'Appeso dentro la porta' },
  },
};
export const LOCK_KIND_NAMES = Object.keys(LOCK_KINDS);

// The small words of locks and floors, English and Italian.
export const LOCK_WORDS = {
  try: { en: 'Space  Try the {thing}', it: 'Space  Prova {thing}' },
  look: { en: 'Space  Look again', it: 'Space  Guarda di nuovo' },
  tryBtn: { en: 'Try', it: 'Prova' },
  dispOpen: { en: 'OPEN', it: 'APERTA' },
  dispError: { en: 'ERROR', it: 'ERRORE' },
  back: { en: 'Step back', it: 'Fatti indietro' },
  clear: { en: 'Clear', it: 'Cancella' },
  del: { en: 'Delete', it: 'Cancella una cifra' },
  typeHere: { en: 'Type here', it: 'Scrivi qui' },
  note: { en: 'Sticky note', it: 'Post-it' },
  voice: { en: 'Behind the door', it: 'Dietro la porta' },
  opened: { en: 'Open', it: 'Aperto' },
  inside: { en: 'Inside', it: 'Dentro' },
  openStation: { en: 'Open the experiment', it: 'Apri l\'esperimento' },
  reopenStation: { en: 'Open the experiment again', it: 'Riapri l\'esperimento' },
  readLink: { en: 'Read more (opens a new tab)', it: 'Approfondisci (si apre in una nuova scheda)' },
  coins: { en: '+{n} coins', it: '+{n} monete' },
  tool: { en: 'You take {tool}.', it: 'Prendi {tool}.' },
  key: { en: 'A key: the upper floor of the {house}.', it: 'Una chiave: il piano di sopra di {house}.' },
  journal: { en: 'Opened locks', it: 'Serrature aperte' },
  journalNone: { en: 'Some things in town are locked. The clue is always there to be read.', it: 'In paese alcune cose sono chiuse a chiave. L\'indizio è sempre lì da leggere.' },
  password: { en: 'Password', it: 'Password' },
  user: { en: 'User', it: 'Utente' },
  thinking: { en: 'You think', it: 'Pensi' },
  marker: { en: 'a lock', it: 'una serratura' },
  // floors
  upstairs: { en: 'Space  Go upstairs', it: 'Space  Sali al piano di sopra' },
  downstairs: { en: 'Go downstairs', it: 'Scendi' },
  stairsTry: { en: 'Space  The stairs', it: 'Space  Le scale' },
  shelf: { en: 'Space  The bookshelf', it: 'Space  La libreria' },
  bench: { en: 'Space  The advanced bench', it: 'Space  Il banco avanzato' },
  shelfTitle: { en: 'To go further', it: 'Per andare oltre' },
  shelfIntro: { en: 'A short reading list, left on the shelf by whoever works up here.', it: 'Una breve lista di letture, lasciata sullo scaffale da chi lavora quassù.' },
  upLab: { en: 'Upstairs', it: 'Al piano di sopra' },
  keyGot: { en: 'Key of the upper floor', it: 'Chiave del piano di sopra' },
};
