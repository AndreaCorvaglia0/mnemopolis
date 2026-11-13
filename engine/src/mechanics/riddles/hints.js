// The thought after a wrong answer: where to look, never what to type. Pure, tested.
//
//   backTo(riddle, misses, where)  the line the character thinks after `misses` wrong answers
//     riddle   { place, from, answer, ... }   (place: the concept the lock belongs to)
//     where    { lang, floor: 'up'|'ground', house(id) -> name, station(conceptId, stationId) -> { tab, n } }
// It escalates: the first two misses name the house ("I should go back to the Dyer's House", or
// "something I saw downstairs" when the answer is taught in this very house); from the third miss
// it names the spot: the reading wall there, or which experiment of the lab. Lines vary with the
// count. A line that would contain an accepted answer (a house named like the answer, say) is
// replaced by a vaguer one, down to a line with no names at all.
import { mentions } from './match.js';

const L = {
  en: {
    house: ['Hm. No. I should go back to the {house}.', 'Not that. The {house} had something on this.', 'Wrong. I\'m sure I saw this at the {house}.'],
    down: ['Hm. It must be something I saw downstairs.', 'No. The answer is downstairs, I\'m sure.', 'Not that. Downstairs, somewhere. Think.'],
    here: ['Hm. It must be something I saw in this very house.', 'No. I\'ve seen this here, in this house.', 'Not that. It\'s somewhere in this house.'],
    page: ['The {house}: the reading wall there.', 'It\'s written on the reading wall of the {house}.', 'I need to read the wall in the {house} again.'],
    pageHere: ['The reading wall, downstairs. It\'s written there.', 'Downstairs, on the reading wall. I skimmed it.', 'The reading wall below. I should read it properly.'],
    pageRoom: ['The reading wall, right here. It\'s written there.', 'This house\'s reading wall. I skimmed it.', 'The wall over there. I should read it properly.'],
    station: ['The {nth} experiment in the lab of the {house}: "{tab}".', 'Back to the {house}, the lab, the {nth} experiment. Watch the numbers.', 'The {house}, "{tab}". I need to try it again.'],
    stationHere: ['The lab downstairs, the {nth} experiment: "{tab}".', 'Downstairs, the lab: "{tab}". Watch the numbers.', 'The {nth} experiment of the lab below. Try it again.'],
    stationRoom: ['The lab in this house, the {nth} experiment: "{tab}".', 'This house\'s lab: "{tab}". Watch the numbers.', 'The {nth} experiment of the lab here. Try it again.'],
    vague: ['Hm. No. Somewhere in this town I learnt this.', 'Not that. I know I saw it on my way here.', 'Wrong. Think back over the houses.'],
    nth: ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'],
  },
  it: {
    house: ['Mh. No. Dovrei ripassare da {house}.', 'Non è quello. In {house} c\'era qualcosa su questo.', 'Sbagliato. Sono sicuro di averlo visto in {house}.'],
    down: ['Mh. Dev\'essere qualcosa che ho visto di sotto.', 'No. La risposta è di sotto, ne sono sicuro.', 'Non è quello. Di sotto, da qualche parte. Pensa.'],
    here: ['Mh. Dev\'essere qualcosa che ho visto proprio in questa casa.', 'No. L\'ho visto qui, in questa casa.', 'Non è quello. È da qualche parte in questa casa.'],
    page: ['{house}: la parete da leggere.', 'È scritto sulla parete da leggere di {house}.', 'Devo rileggere la parete di {house}.'],
    pageHere: ['La parete da leggere, di sotto. È scritto lì.', 'Di sotto, sulla parete da leggere. L\'ho letta di corsa.', 'La parete qui sotto. Dovrei leggerla per bene.'],
    pageRoom: ['La parete da leggere, proprio qui. È scritto lì.', 'La parete di questa casa. L\'ho letta di corsa.', 'Quella parete laggiù. Dovrei leggerla per bene.'],
    station: ['Il {nth} esperimento nel laboratorio di {house}: "{tab}".', 'Torna in {house}, il laboratorio, il {nth} esperimento. Guarda i numeri.', '{house}, "{tab}". Devo riprovarlo.'],
    stationHere: ['Il laboratorio di sotto, il {nth} esperimento: "{tab}".', 'Di sotto, il laboratorio: "{tab}". Guarda i numeri.', 'Il {nth} esperimento del laboratorio qui sotto. Riprovalo.'],
    stationRoom: ['Il laboratorio di questa casa, il {nth} esperimento: "{tab}".', 'Il laboratorio qui: "{tab}". Guarda i numeri.', 'Il {nth} esperimento del laboratorio qui. Riprovalo.'],
    vague: ['Mh. No. L\'ho imparato da qualche parte, in paese.', 'Non è quello. So di averlo visto venendo qui.', 'Sbagliato. Ripensa alle case.'],
    nth: ['primo', 'secondo', 'terzo', 'quarto', 'quinto', 'sesto', 'settimo', 'ottavo'],
  },
};
export const HINT_LINES = L;
export const PRECISE_AFTER = 3; // from this many misses on, the thought names the spot

const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

// the place the answer is taught: { concept, page } or { concept, station }
export const sourceOf = (r) => ({ concept: r.from?.concept || r.place, page: !!r.from?.page || !r.from?.station, station: r.from?.station || null });

export function backTo(r, misses, where = {}) {
  const T = L[where.lang === 'it' ? 'it' : 'en'], src = sourceOf(r), k = Math.max(0, misses - 1);
  const same = src.concept === r.place, up = where.floor === 'up';
  const house = where.house?.(src.concept) || '';
  const st = src.station ? where.station?.(src.concept, src.station) : null;
  const v = { house, tab: st?.tab || '', nth: T.nth[st?.n ?? 0] || '' };
  const pick = (list) => list[k % list.length];
  const broad = same ? (up ? T.down : T.here) : T.house;
  const tries = [];
  if (misses >= PRECISE_AFTER) {
    if (src.station && st) tries.push(pick(same ? (up ? T.stationHere : T.stationRoom) : T.station));
    else tries.push(pick(same ? (up ? T.pageHere : T.pageRoom) : T.page));
  }
  tries.push(pick(broad), pick(T.vague), T.vague[0]);
  for (const t of tries) {
    if ((t.includes('{house}') && !v.house) || (t.includes('{tab}') && !v.tab)) continue;
    const line = fill(t, v);
    if (!mentions(line, r)) return line;
  }
  return '...';
}
