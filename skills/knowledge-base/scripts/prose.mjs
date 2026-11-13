// The register of expository text (references/9-prose.md), checked by machine: label lines, runs
// of telegraphic sentences, colons welding half sentences, questions and exclamations in
// exposition, openings with Here/Now/Then (Qui/Ora/Poi), brochure words. Warnings only: the
// checks find the obvious cases, and a paragraph is judged by rereading it.
// Ported to dependency-free Node from the author's prosa-didattica skill (controlla_stile.py).
//
//   proseIssues(text, { lang, task })         -> [{ what, quote, fix }] for one text
//   proseFields(course)                       -> [{ where, text, kind }] the course's texts by register
//   checkCourseProse(course)                  -> [string] the validator's warnings
// kind: 'exposition' (all checks), 'instruction' (exclamations and brochure words only), 'task'
// (a question the learner answers: brochure words only). Voice text (duel lines, clues, people,
// experts' lines) is not collected at all: wit is wanted there.

export const BROCHURE = {
  it: ['potent', 'fondamentale', 'cruciale', 'incredibil', 'straordinari', 'rivoluzionari', 'semplicissim', 'magia', 'magico', 'davvero', 'sul serio', 'senza paura', 'vale la pena', 'è importante notare', 'da notare che', 'in sintesi', 'ricapitolando', 'esploreremo', 'scopriamo insieme', 'vediamo insieme', 'immagina', 'best practice', 'game changer', 'e molto altro'],
  en: ['powerful', 'crucial', 'incredibl', 'amazing', 'revolutionar', 'simply', 'magic', 'it is important to note', "it's important to note", 'it is worth noting', "let's explore", 'let us explore', 'dive into', 'delve', 'game changer', 'game-changer', 'and much more', 'in summary', 'in a nutshell', 'unlock', 'seamless', 'fundamentally'],
};
const CONNECTIVES = {
  it: /\b(perché|quindi|mentre|invece|cioè|infatti|poiché|dunque|per esempio|in questo modo|che|quando)\b/i,
  en: /\b(because|so|while|whereas|instead|that is|in fact|since|therefore|for example|this way|which|that|when)\b/i,
};
const OPENING = { it: /(^|[.!?]\s+)(Qui|Ora|Poi) [a-zàèéìòù]/, en: /(^|[.!?]\s+)(Here|Now|Then) [a-z]/ };
const SAY = {
  label: { en: 'a label line: fold it into the sentence that explains', it: 'riga etichetta: fonderla nella frase che spiega' },
  tele: { en: 'telegraphic sentences ({n} sentences, {w} words on average): link them into a paragraph with because, so, while, which', it: 'frasi telegrafiche ({n} frasi, {w} parole in media): legarle in un paragrafo con perché, quindi, mentre, che' },
  colons: { en: 'a chain of colons without connectives: give the sentence a subject and a verb', it: 'catena di due punti senza connettivi: dare alla frase soggetto e verbo' },
  question: { en: 'a question in expository text: state the point instead (questions belong to tasks)', it: 'domanda nel testo espositivo: dire la cosa invece di chiederla (le domande stanno nelle consegne)' },
  opening: { en: 'an opening with Here/Now/Then: start from the subject', it: 'apertura con Qui/Ora/Poi: cominciare dal soggetto' },
  bang: { en: 'an exclamation mark: the text informs, it does not exclaim', it: 'punto esclamativo: il testo informa, non esclama' },
  brochure: { en: 'a brochure word "{w}": say what the thing does instead', it: 'parola da brochure "{w}": dire che cosa fa la cosa' },
};
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const clean = (t) => String(t || '').replace(/<[^>]+>/g, '').replace(/`[^`]*`/g, 'X').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export function proseIssues(text, { lang = 'en', kind = 'exposition' } = {}) {
  const L = lang === 'it' ? 'it' : 'en', p = clean(text), out = [];
  if (!p) return out;
  const quote = p.length > 60 ? `${p.slice(0, 57)}...` : p, say = (k, v = {}) => out.push({ what: k, quote, fix: fill(SAY[k][L], v) });
  const words = p.split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w));
  if (kind === 'exposition') {
    if (words.length <= 4 && p.endsWith(':')) { say('label'); return out; }
    const sentences = p.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
    if (sentences.length >= 3 && words.length / sentences.length < 8) say('tele', { n: sentences.length, w: Math.floor(words.length / sentences.length) });
    if ((p.match(/:/g) || []).length >= 2 && words.length >= 8 && words.length < 50 && !CONNECTIVES[L].test(p)) say('colons');
    if (p.includes('?')) say('question');
    if (OPENING[L].test(p)) say('opening');
  }
  if (kind !== 'task' && p.includes('!')) say('bang');
  const low = p.toLowerCase();
  for (const w of BROCHURE[L]) if (low.includes(w)) say('brochure', { w });
  return out;
}

// The texts of a course by register (references/9-prose.md, "Where each register applies").
export function proseFields(c) {
  const out = [], add = (where, text, kind = 'exposition') => { if (typeof text === 'string' && text.trim()) out.push({ where, text, kind }); };
  add('course: bigIdea', c.bigIdea);
  (c.goals || []).forEach((g, i) => add(`goal ${i + 1}`, typeof g === 'string' ? g : g?.text));
  for (const p of c.concepts || []) {
    const P = `concept "${p.id}"`;
    add(`${P}: idea`, p.idea);
    add(`${P}: application`, p.application);
    if (p.anchor) { add(`${P}: anchor`, p.anchor.text); add(`${P}: anchor limits`, p.anchor.limits); }
    (p.page || []).forEach((s, i) => add(`${P} page ${i + 1} "${s.title || ''}"`, s.text));
    if (p.explain) { add(`${P}: explain (question)`, p.explain.q, 'task'); add(`${P}: explain (answer)`, p.explain.a); }
    (p.further || []).forEach((f, i) => add(`${P} further ${i + 1}`, f.why));
    (p.timeline || []).forEach((m, i) => { add(`${P} plaque ${i + 1}`, m.text); add(`${P} plaque ${i + 1} (why)`, m.why); });
    for (const s of p.lab?.stations || []) {
      const S = `${P} station "${s.id}"`;
      add(`${S}: goal`, s.goal, 'instruction');
      (s.tries || []).forEach((t, i) => add(`${S}: step ${i + 1}`, t, 'instruction'));
      add(`${S}: takeaway`, s.takeaway);
      if (s.predict) { add(`${S}: predict (question)`, s.predict.q, 'task'); add(`${S}: predict (why)`, s.predict.why); }
    }
    (p.questions || []).forEach((q, i) => {
      const Q = `${P} question ${i + 1}`;
      add(`${Q} (question)`, q.q, 'task');
      add(`${Q} (why)`, q.why);
      (q.traps || []).forEach((t, j) => add(`${Q} trap ${j + 1}`, t));
    });
    (p.riddles || []).forEach((r) => add(`${P} lock "${r.id}": note`, r.inside?.note));
  }
  return out;
}

export function checkCourseProse(c) {
  const lang = String(c.language || 'en').slice(0, 2).toLowerCase();
  return proseFields(c).flatMap((f) => proseIssues(f.text, { lang, kind: f.kind }).map((x) => `${f.where}: ${x.fix} ("${x.quote}")`));
}
