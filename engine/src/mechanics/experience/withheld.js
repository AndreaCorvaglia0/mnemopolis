// Withheld lines: a person starts to tell you something, looks at you, and stops. At or above the
// line's tier they tell it, once, and the notebook keeps it under Clues. The engine's own lines are
// about its extras, so they work for any course; a course may add its own (`withheld` in
// course.json, references/10-games.md). Pure: no imports from the browser.
//
//   GENERIC                     the engine's lines (teaser, tier, told; `needs` a part of the game)
//   withheldFor(course, opts)   the lines of a course: the engine's that apply, then the course's
//   assign(lines, people, seed) person id -> [line ids], by seed (each townsperson one or two)
//   pending(state, ids, tier)   what a person would say now: { line, told: bool } or null

export const GENERIC = [
  { id: 'x-cat', tier: 'passing', needs: 'secrets',
    teaser: { en: 'At night, by the landmarks, there\'s a little light that walks on four—', it: 'Di notte, vicino ai monumenti, c\'è una lucina che cammina su quattro—' },
    told: { en: 'A cat carries a lantern at night. Its paw prints glow near the landmarks; follow them, one rhyme at a time, and it waits for you on the square.', it: 'Di notte un gatto porta una lanterna. Le sue impronte brillano vicino ai monumenti: seguile, una rima alla volta, e ti aspetta in piazza.' } },
  { id: 'x-think', tier: 'passing', needs: 'musings',
    teaser: { en: 'Some trees here are hollow. If you stop and really think about one—', it: 'Certi alberi qui sono cavi. Se ti fermi e ci pensi davvero—' },
    told: { en: 'Things give up their secrets to whoever stops and thinks about them: a hollow tree, an old well. Think aloud (T, or tap twice) where something looks odd.', it: 'Le cose cedono i loro segreti a chi si ferma a pensarci: un albero cavo, un vecchio pozzo. Pensa ad alta voce (T, o tocca due volte) dove qualcosa sembra strano.' } },
  { id: 'x-locks', tier: 'settling', needs: 'locks',
    teaser: { en: 'The safes upstairs. The trick is, they never want more than—', it: 'Le casseforti di sopra. Il trucco è che non vogliono mai più di—' },
    told: { en: 'A lock never wants more than three words or one number, and always something you were shown in that house. A wrong try costs nothing.', it: 'Una serratura non vuole mai più di tre parole o un numero, e sempre qualcosa che ti hanno mostrato in quella casa. Un tentativo sbagliato non costa nulla.' } },
  { id: 'x-star', tier: 'settling', needs: 'secrets',
    teaser: { en: 'If you sit on a bench at night and keep still long enough, the sky—', it: 'Se di notte ti siedi su una panchina e stai fermo abbastanza, il cielo—' },
    told: { en: 'Stand still by a bench at night, a good while, and look up. Something crosses the sky for whoever waits.', it: 'Di notte resta fermo accanto a una panchina, a lungo, e guarda su. Qualcosa attraversa il cielo per chi aspetta.' } },
  { id: 'x-keys', tier: 'passing',
    teaser: { en: 'The owners keep keys to their upstairs. They only hand them to someone who—', it: 'I padroni di casa tengono la chiave del piano di sopra. La danno solo a chi—' },
    told: { en: 'Help an owner remember and they hand you the key to their upstairs. What is up there is harder, and worth it.', it: 'Aiuta un padrone di casa a ricordare e ti darà la chiave del piano di sopra. Lassù è più difficile, e ne vale la pena.' } },
  { id: 'x-fog', tier: 'known', story: true,
    teaser: { en: 'Even after you\'ve helped them, the fog comes back. Days later. Unless you—', it: 'Anche dopo che li hai aiutati, la nebbia torna. Giorni dopo. A meno che tu—' },
    told: { en: 'After the end, the fog returns to a house after a day, then three, then a week, then longer. Two right answers there bring it back, and it stays away longer each time.', it: 'Dopo la fine, la nebbia torna su una casa dopo un giorno, poi tre, poi una settimana, poi di più. Due risposte giuste la scacciano, e ogni volta resta lontana più a lungo.' } },
  { id: 'x-register', tier: 'known', story: true,
    teaser: { en: 'The keeper writes down every arrival. Every single one. Even—', it: 'Il guardiano annota ogni arrivo. Ogni singolo arrivo. Perfino—' },
    told: { en: 'The keeper\'s register has more pages than this town has years. The same hand fills most of them.', it: 'Il registro del guardiano ha più pagine di quanti anni abbia questo paese. La stessa mano ne riempie quasi tutte.' } },
  { id: 'x-ship', tier: 'home', story: true,
    teaser: { en: 'The ship. It always comes back to the same berth, and the purser always asks—', it: 'La nave. Torna sempre allo stesso ormeggio, e il commissario chiede sempre—' },
    told: { en: 'The ship has never left with anyone who truly stayed. That is what they say on the quay. Nobody remembers it happening, but they say it.', it: 'La nave non è mai partita con qualcuno che fosse rimasto davvero. Così dicono in banchina. Nessuno ricorda che sia successo, ma lo dicono.' } },
  { id: 'x-door', tier: 'settling',
    teaser: { en: 'That door on the square that never opens. It does, for some people. For people who—', it: 'Quella porta in piazza che non si apre mai. Si apre, per qualcuno. Per chi—' },
    told: { en: 'The shut door on the square opens to people the town knows. Come back to it when they all know your name.', it: 'La porta chiusa in piazza si apre a chi il paese conosce. Tornaci quando tutti sapranno il tuo nome.' } },
  { id: 'x-games', tier: 'passing', needs: 'games',
    teaser: { en: 'People here play little games. The trick to the high scores is—', it: 'Qui la gente fa dei giochetti. Il trucco per i punteggi alti è—' },
    told: { en: 'The games get harder when you get two right, and easier after a miss. Come back another day: they remember where you left off.', it: 'I giochi diventano più difficili quando ne indovini due, e più facili dopo un errore. Torna un altro giorno: ricordano dove eri arrivato.' } },
  { id: 'x-tools', tier: 'known', needs: 'obstacles',
    teaser: { en: 'The fallen trunks, the bramble, the boulders. Someday someone will sell the—', it: 'I tronchi caduti, i rovi, i massi. Un giorno qualcuno venderà gli—' },
    told: { en: 'What blocks the little nooks in town is not for now. One day there will be tools for it; until then, what is behind waits.', it: 'Ciò che chiude i piccoli angoli del paese non è per adesso. Un giorno ci saranno gli attrezzi; fino ad allora, quello che c\'è dietro aspetta.' } },
  { id: 'x-lamp', tier: 'home', story: true,
    teaser: { en: 'When the lamp is lit, the keeper says one thing. But what the keeper doesn\'t say is—', it: 'Quando il faro si accende, il guardiano dice una cosa. Ma quello che non dice è—' },
    told: { en: 'The keeper never said you must go. Only that you always do. Climb the lighthouse again when you have stayed long enough.', it: 'Il guardiano non ha mai detto che devi partire. Solo che parti sempre. Risali al faro quando sarai rimasto abbastanza.' } },
];

const tierOk = (t) => ['passing', 'settling', 'known', 'home'].includes(t);

// opts: { story, secrets, musings, locks, games, obstacles } (booleans: what this game has)
export function withheldFor(course, opts = {}) {
  const has = (k) => opts[k] !== false;
  const engine = GENERIC.filter((l) => (!l.story || has('story')) && (!l.needs || has(l.needs)));
  const own = (course?.withheld || []).filter((l) => l && l.id && l.told && tierOk(l.tier)).map((l) => ({
    id: l.id, tier: l.tier, by: l.by && l.by !== 'town' ? l.by : null, course: true,
    teaser: l.teaser ? { en: l.teaser, it: l.teaser } : null, told: { en: l.told, it: l.told },
  }));
  return [...own, ...engine];
}

// a tiny seeded generator (the engine's `seeded` lives with the browser code; this stays pure)
function rng(seed) { let h = 2166136261; for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } let a = h >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// people: ids of townspeople (not the guide); hosts: concept id -> true for houses. Lines with `by`
// go to that house's owner (key `host:<id>`); the rest are dealt to people by the seed, round-robin
// after a shuffle, so each person has one or two.
export function assign(lines, people, seed = 'course') {
  const out = {}, r = rng(`withheld:${seed}`), list = lines.filter((l) => !l.by);
  const ppl = people.slice();
  for (let i = ppl.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ppl[i], ppl[j]] = [ppl[j], ppl[i]]; }
  list.forEach((l, i) => { if (!ppl.length) return; (out[ppl[i % ppl.length]] ||= []).push(l.id); });
  for (const l of lines) if (l.by) (out[`host:${l.by}`] ||= []).push(l.id);
  return out;
}

// What a person says now: the first of their lines not yet told; told when the tier is reached.
const ORDER = ['arrival', 'passing', 'settling', 'known', 'home'];
export function pending(told = {}, ids = [], lines = [], tier = 'arrival') {
  const byId = Object.fromEntries(lines.map((l) => [l.id, l]));
  const open = ids.map((id) => byId[id]).filter((l) => l && !told[l.id]);
  if (!open.length) return null;
  const ready = open.find((l) => ORDER.indexOf(tier) >= ORDER.indexOf(l.tier));
  return ready ? { line: ready, told: true } : { line: open[0], told: false };
}
