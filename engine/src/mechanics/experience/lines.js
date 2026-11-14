// The commenting world: what people say about YOU (docs/GAME.md, "a world that notices"). English and
// Italian, voice text: short, in character, dry warmth. No imports (tests read it in Node).
//
// How it sits with the story's stages (story/stages.js): the STAGE (how much the town remembers)
// sets the temperature of a line: cold or warm; the TIER (your experience) sets how they regard you.
// So every greeting exists per tier and per temperature.
//
// Slots (each a list of variants, cycled without immediate repeats by a Deck):
//   greet[tier][cold|warm]     a townsperson's first line
//   did[what]                  what you just did (a few minutes ago), noticed
//   owner.before[low|mid|high] a house's owner before remembering: curt, but they see you
//   owner.after[low|mid|high]  after: they notice your progress elsewhere
//   master[tier]               the harbour master
//   purser[low|mid|high]       the purser at the gangway, after "Another round, <name>?"
//   keeperLoop[low|mid|high]   the keeper at the lamp, one line before the register
//   keeperReturn[tier]         the keeper when you climb again after the ending
//   missing[kind]              what is still missing, vaguely (never a checklist)
//   margin[tier]               a pencilled note in the notebook's margin
//   musing[tier]               a rare thought about oneself
//   tierUp[tier]               the one remark that announces a new tier; tierNote[tier] in the notebook
//   tierWord[tier]             the handwritten word on the Journey page
//   refuse / tell              the frames of a withheld line: declining, and finally telling

export const GROUP = { arrival: 'low', passing: 'low', settling: 'mid', known: 'high', home: 'high' };

export const XLINES = {
  greet: {
    arrival: {
      cold: { en: ['New here, aren\'t you.', 'Off the boat. I can tell.', 'You\'ve only just arrived. It shows.'], it: ['Nuovo di qui, vero?', 'Sceso dalla nave. Si vede.', 'Sei appena arrivato. Si nota.'] },
      warm: { en: ['A new face. Welcome, I suppose.', 'You\'re new. Mind the puddles.', 'Haven\'t seen you before. Or have I?'], it: ['Una faccia nuova. Benvenuto, immagino.', 'Sei nuovo. Attento alle pozzanghere.', 'Non ti ho mai visto. O sì?'] },
    },
    passing: {
      cold: { en: ['Still here, then.', 'You again. Passing through?', 'Haven\'t been here long, have you.'], it: ['Ancora qui, dunque.', 'Di nuovo tu. Di passaggio?', 'Non sei qui da molto, eh.'] },
      warm: { en: ['Oh, it\'s you. Still finding your way?', 'Back again. You\'ll learn the lanes.', 'You\'re getting your bearings.'], it: ['Ah, sei tu. Ancora a cercare la strada?', 'Di nuovo qui. Le vie le imparerai.', 'Cominci a orientarti.'] },
    },
    settling: {
      cold: { en: ['You\'ve been busy. People notice.', 'I see you\'ve kept at it.', 'You\'re not leaving yet, then.'], it: ['Ti sei dato da fare. La gente lo nota.', 'Vedo che non molli.', 'Non riparti ancora, dunque.'] },
      warm: { en: ['You\'ve been here a while now.', 'I see you\'ve kept busy.', 'Settling in, are we?'], it: ['Ormai sei qui da un po\'.', 'Vedo che ti sei tenuto occupato.', 'Ci stiamo ambientando, eh?'] },
    },
    known: {
      cold: { en: ['Everyone knows your face by now.', 'You again. Good. I think.', 'They talk about you in the lanes.'], it: ['Ormai tutti conoscono la tua faccia.', 'Ancora tu. Bene. Credo.', 'Nelle vie si parla di te.'] },
      warm: { en: ['Ah, there you are. We were talking about you.', 'Known around here now, aren\'t you.', 'The whole town knows your step.'], it: ['Eccoti. Parlavamo proprio di te.', 'Ormai qui ti conoscono tutti, eh.', 'Tutto il paese riconosce il tuo passo.'] },
    },
    home: {
      cold: { en: ['You walk like you live here.', 'Hm. You know this place better than I do.', 'You never really left, did you.'], it: ['Cammini come se abitassi qui.', 'Mh. Conosci questo posto meglio di me.', 'In fondo non sei mai partito, vero?'] },
      warm: { en: ['Welcome home. That\'s what it is now.', 'You\'re one of us. Don\'t argue.', 'Same time tomorrow? You always come.'], it: ['Bentornato a casa. Ormai è così.', 'Sei uno di noi. Non discutere.', 'Domani alla stessa ora? Vieni sempre.'] },
    },
  },
  did: {
    remembered: { en: ['You\'ve been busy. The whole lane is talking.', 'Someone up the lane remembers again. That was you, wasn\'t it.', 'A window lit up. They say you did it.'], it: ['Ti sei dato da fare. Tutta la via ne parla.', 'Qualcuno lassù ricorda di nuovo. Sei stato tu, vero?', 'Si è accesa una finestra. Dicono che sia merito tuo.'] },
    memento: { en: ['You look like you\'ve seen a ghost.', 'Found something upstairs, did you. Keep it.'], it: ['Sembri uno che ha visto un fantasma.', 'Hai trovato qualcosa di sopra, eh. Tienilo.'] },
    lock: { en: ['Heard a lock give way. Nobody opens those.', 'You got it open? Nobody ever does.'], it: ['Ho sentito cedere una serratura. Nessuno le apre.', 'L\'hai aperta? Non ci riesce mai nessuno.'] },
    secret: { en: ['You poke around. I like that.', 'Found something, did you? You\'ve got that look.'], it: ['Curiosi in giro. Mi piace.', 'Trovato qualcosa? Hai quella faccia.'] },
    game: { en: ['I saw you at that game. Not bad.', 'Practising? Good. It shows.'], it: ['Ti ho visto a quel gioco. Niente male.', 'Ti alleni? Bene. Si vede.'] },
    station: { en: ['You were in there a long time. Learning something?', 'Your hands are busy lately.'], it: ['Sei stato là dentro un bel po\'. Imparato qualcosa?', 'Hai le mani occupate, ultimamente.'] },
    advanced: { en: ['Upstairs, were you? Not many go up there.'], it: ['Di sopra, eh? Non ci sale quasi nessuno.'] },
    obstacle: { en: ['Something that was shut is open now. Funny, that.'], it: ['Qualcosa che era chiuso ora è aperto. Strano, eh.'] },
    told: { en: ['So they told you. About time.'], it: ['Quindi te l\'hanno detto. Era ora.'] },
    keeper: { en: ['The lamp is lit. You did that.'], it: ['Il faro è acceso. Sei stato tu.'] },
  },
  owner: {
    before: {
      low: { en: ['You. You\'re new.', 'Don\'t touch anything. Well, touch that.'], it: ['Tu. Sei nuovo.', 'Non toccare niente. Be\', quello sì.'] },
      mid: { en: ['I\'ve heard about you. Doesn\'t mean I trust you.', 'They say you help people remember. We\'ll see.'], it: ['Ho sentito parlare di te. Non vuol dire che mi fidi.', 'Dicono che aiuti la gente a ricordare. Vedremo.'] },
      high: { en: ['Everyone speaks of you. Fine. Come in.', 'You again. The others say you know your stuff.'], it: ['Tutti parlano di te. Va bene. Entra.', 'Ancora tu. Gli altri dicono che sai il fatto tuo.'] },
    },
    after: {
      low: { en: ['Back already? Good.', 'Still the only one who listens.'], it: ['Già di ritorno? Bene.', 'Sei ancora l\'unico che ascolta.'] },
      mid: { en: ['I hear you\'ve been helping others too.', 'You\'ve kept busy since. I can tell.'], it: ['Ho sentito che hai aiutato anche altri.', 'Ti sei tenuto occupato, da allora. Si vede.'] },
      high: { en: ['Half the town remembers because of you. Don\'t let it go to your head.', 'You\'re around so much I\'ve stopped locking the door.'], it: ['Mezzo paese ricorda grazie a te. Non montarti la testa.', 'Sei qui così spesso che ho smesso di chiudere la porta.'] },
    },
  },
  master: {
    arrival: { en: ['You ag— never mind. Off you go.'], it: ['Di nuov— lascia stare. Vai pure.'] },
    passing: { en: ['Finding your feet. Good.'], it: ['Trovi la strada. Bene.'] },
    settling: { en: ['You\'ve stayed longer than most.'], it: ['Sei rimasto più a lungo di tanti.'] },
    known: { en: ['The quay knows your step now.'], it: ['La banchina ormai conosce il tuo passo.'] },
    home: { en: ['Same berth as always. And yet.'], it: ['Lo stesso ormeggio di sempre. Eppure.'] },
  },
  purser: {
    low: { en: ['Quick, this time.'], it: ['Veloce, stavolta.'] },
    mid: { en: ['You stayed a little longer, I see.'], it: ['Sei rimasto un po\' di più, vedo.'] },
    high: { en: ['You stayed long this time. Almost long enough.'], it: ['Sei rimasto a lungo, stavolta. Quasi abbastanza.'] },
  },
  keeperLoop: {
    low: { en: ['Short, this time.'], it: ['Breve, questa volta.'] },
    mid: { en: ['You stayed longer this time. Not long enough.'], it: ['Sei rimasto più a lungo, stavolta. Non abbastanza.'] },
    high: { en: ['Longer than ever. There may be another way out of this.'], it: ['Più a lungo che mai. Forse c\'è un\'altra via d\'uscita.'] },
  },
  keeperReturn: {
    arrival: { en: ['Still here. Good.'], it: ['Ancora qui. Bene.'] },
    passing: { en: ['Still here. Good.', 'Back up the stairs. Why?'], it: ['Ancora qui. Bene.', 'Di nuovo su per le scale. Perché?'] },
    settling: { en: ['Still here. Good. Keep going.', 'You climb these stairs more lightly now.'], it: ['Ancora qui. Bene. Continua.', 'Ora sali queste scale con più leggerezza.'] },
    known: { en: ['Almost. There are rooms you haven\'t opened.', 'Closer. Not yet.'], it: ['Quasi. Ci sono stanze che non hai aperto.', 'Più vicino. Non ancora.'] },
    home: { en: ['You know this town now. Perhaps the ship can wait.', 'There it is. The look of someone who stayed.'], it: ['Ora conosci questo paese. Forse la nave può aspettare.', 'Eccolo. Lo sguardo di chi è rimasto.'] },
  },
  missing: {
    locks: { en: ['Some doors in this town still want a word from you.'], it: ['Certe porte del paese aspettano ancora una tua parola.'] },
    upstairs: { en: ['There are rooms upstairs you never climbed to.'], it: ['Ci sono stanze di sopra dove non sei mai salito.'] },
    secrets: { en: ['The town hides small things. You walked past most of them.'], it: ['Il paese nasconde piccole cose. Ci sei passato accanto quasi sempre.'] },
    games: { en: ['People here play. You hardly did.'], it: ['Qui la gente gioca. Tu quasi mai.'] },
    houses: { en: ['Some houses still don\'t know you.'], it: ['Alcune case non ti conoscono ancora.'] },
    days: { en: ['Come back tomorrow. And the day after.'], it: ['Torna domani. E il giorno dopo.'] },
    fog: { en: ['When the fog comes back to a house, don\'t leave it alone.'], it: ['Quando la nebbia torna su una casa, non lasciarla sola.'] },
  },
  margin: {
    passing: { en: ['They look at me differently.', 'Less of a stranger today.'], it: ['Mi guardano in un altro modo.', 'Oggi un po\' meno estraneo.'] },
    settling: { en: ['They nod now, in the lanes.', 'I know which stones wobble.'], it: ['Ora nelle vie mi salutano con un cenno.', 'So quali pietre traballano.'] },
    known: { en: ['Someone said my name before I said it.', 'They stop talking when I pass. Then smile.'], it: ['Qualcuno ha detto il mio nome prima di me.', 'Smettono di parlare quando passo. Poi sorridono.'] },
    home: { en: ['This town feels like it was waiting for me.', 'I could find my way here with my eyes shut.'], it: ['Questo paese sembra che mi aspettasse.', 'Troverei la strada a occhi chiusi.'] },
  },
  musing: {
    arrival: { en: ['Everything here is new. Or feels new.'], it: ['Qui è tutto nuovo. O sembra nuovo.'] },
    passing: { en: ['I\'m starting to know where things are.'], it: ['Comincio a sapere dove stanno le cose.'] },
    settling: { en: ['I\'ve been here a while. Longer than I meant.'], it: ['Sono qui da un po\'. Più di quanto volessi.'] },
    known: { en: ['They know me here. I like that more than I expected.'], it: ['Qui mi conoscono. Mi piace più di quanto pensassi.'] },
    home: { en: ['It\'s strange how easily I walk these lanes.'], it: ['È strano con che facilità cammino per queste vie.'] },
  },
  tierUp: {
    passing: { en: ['Hm. You\'re not quite so new any more.'], it: ['Mh. Non sei più così nuovo.'] },
    settling: { en: ['You\'ve been here a while now, haven\'t you. People notice.'], it: ['Ormai sei qui da un po\', vero? La gente se ne accorge.'] },
    known: { en: ['They all know you now. You know that?'], it: ['Ormai ti conoscono tutti. Lo sai?'] },
    home: { en: ['Funny. You feel like you belong here.'], it: ['Strano. Sembri uno di qui.'] },
  },
  tierNote: {
    passing: { en: 'Less of a stranger.', it: 'Meno estraneo.' },
    settling: { en: 'They nod at me now.', it: 'Ora mi salutano.' },
    known: { en: 'They know my name.', it: 'Sanno il mio nome.' },
    home: { en: 'As if I lived here.', it: 'Come se abitassi qui.' },
  },
  tierWord: {
    arrival: { en: 'a stranger', it: 'un estraneo' },
    passing: { en: 'passing through', it: 'di passaggio' },
    settling: { en: 'settling in', it: 'mi ambiento' },
    known: { en: 'known here', it: 'conosciuto' },
    home: { en: 'at home', it: 'di casa' },
  },
  // the frames of a withheld line
  refuse: {
    en: ['No. Not yet. You haven\'t been here long enough.', '...No. Too early for that.', 'They look you over, and shake their head. "Another time."', 'Hm. Ask me again when people know your face.', 'Never mind. You\'re not ready to hear it.'],
    it: ['No. Non ancora. Non sei qui da abbastanza.', '...No. È troppo presto.', 'Ti squadra, e scuote la testa. «Un\'altra volta.»', 'Mh. Richiedimelo quando la gente conoscerà la tua faccia.', 'Lascia stare. Non sei pronto a sentirlo.'],
  },
  tell: {
    en: ['You\'ve been here long enough. All right.', 'I said I\'d tell you one day. Today, then.', 'Fine. You\'ve earned it.'],
    it: ['Sei qui da abbastanza. D\'accordo.', 'Avevo detto che un giorno te l\'avrei detto. Oggi, allora.', 'Va bene. Te lo sei guadagnato.'],
  },
  // the door that knows you (canEnter's one real use: a door on the square)
  door: {
    shut: { en: ['Come back when they know you better.', 'The door doesn\'t budge. Someone inside says: "Not for strangers."'], it: ['Torna quando ti conosceranno meglio.', 'La porta non si muove. Qualcuno dentro dice: «Non per gli estranei.»'] },
    open: { en: 'The door opens. Someone inside says: "Ah. You. Come in."', it: 'La porta si apre. Qualcuno dentro dice: «Ah. Tu. Entra.»' },
  },
  clues: {
    heading: { en: 'What they told me', it: 'Cosa mi hanno detto' },
    tier: { en: 'How they see me', it: 'Come mi vedono' },
    xp: { en: '{n} experience', it: '{n} di esperienza' },
  },
};
