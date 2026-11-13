// Answer matching for locks (riddles). Pure, no imports: the validator reads it in Node too.
//
//   matches(riddle, input)     true when the typed input opens the lock
//   typeOf(riddle)             'text' | 'number' | 'code'
//   accepted(riddle)           the accepted answers, as a list
//   normText(s)                the normal form of a text answer (shown in tests and the validator)
//
// The rules (engine/docs/ENGINE.md, "Locks"):
//   text    case, accents, punctuation and extra spaces do not count; a leading article (English
//           or Italian) is dropped; a final plural "s" on the last word is tolerated (on words of 4
//           letters or more before the "s", not "ss"); ONE typo (an insertion, a deletion, a substitution or two letters swapped) is
//           tolerated in one word of 6 letters or more; the words may be typed without spaces.
//   number  comma or dot for decimals; a unit after the number is ignored ("120°", "120 degrees");
//           within `tolerance` (default: exact for an integer, half a unit of the last decimal
//           otherwise). Anything with a second number in it is refused.
//   code    the digits exactly, leading zeros included; spaces and dashes between them are ignored.
// An empty answer never opens anything.

const ARTICLES = new Set(['the', 'a', 'an', 'il', 'lo', 'la', 'i', 'gli', 'le', 'l', 'un', 'uno', 'una']);

export function normText(s) {
  let t = String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  t = t.replace(/[’'`]/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
  const w = t.split(' ').filter(Boolean);
  if (w.length > 1 && ARTICLES.has(w[0])) w.shift();
  return w.join(' ');
}

export const typeOf = (r) => r.type || (typeof [].concat(r.answer)[0] === 'number' ? 'number' : 'text');
export const accepted = (r) => [].concat(r.answer ?? []).filter((a) => a !== '' && a != null);

// Edit distance (Levenshtein, with two swapped neighbours counted as one typo), stopping early above `max`
export function distance(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j), pp = prev;
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], pp[j - 2] + 1); // two letters swapped
      best = Math.min(best, cur[j]);
    }
    if (best > max && i > 1) return max + 1;
    pp = prev; prev = cur;
  }
  return prev[b.length];
}

const stem = (w) => (w.length >= 5 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);

export function textMatches(input, answer) {
  const a = normText(answer), b = normText(input);
  if (!a || !b) return false;
  if (a === b || a.replace(/ /g, '') === b.replace(/ /g, '')) return true;
  const A = a.split(' '), B = b.split(' ');
  if (A.length !== B.length) return false;
  A[A.length - 1] = stem(A[A.length - 1]); B[B.length - 1] = stem(B[B.length - 1]);
  let typos = 0;
  for (let i = 0; i < A.length; i++) {
    if (A[i] === B[i]) continue;
    if (A[i].length < 6 || /\d/.test(A[i])) return false; // short words and numbers in words: exact
    typos += distance(A[i], B[i], 1);
    if (typos > 1) return false;
  }
  return true;
}

// "1,5", "1.5", "120°", "120 deg", "-3" -> a number; anything else -> null
export function parseNumber(input) {
  const s = String(input ?? '').trim().replace(/\s+/g, ' ');
  const m = s.match(/^([+-]?)\s*(\d+(?:[.,]\d+)?|[.,]\d+)\s*(.*)$/);
  if (!m) return null;
  if (m[3] && /\d/.test(m[3])) return null; // "12 3", "1/2", "12-15": not one number
  if (m[3] && !/^[\p{L}°%'"º ]*\.?$/u.test(m[3])) return null;
  const v = Number(m[2].replace(',', '.'));
  return Number.isFinite(v) ? (m[1] === '-' ? -v : v) : null;
}

const decimals = (x) => { const s = String(x); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };
export function numberMatches(input, answer, tolerance) {
  const v = parseNumber(input), a = Number(answer);
  if (v == null || !Number.isFinite(a)) return false;
  const tol = tolerance != null ? Math.abs(+tolerance) : Number.isInteger(a) ? 0 : 0.5 * 10 ** -decimals(a);
  return Math.abs(v - a) <= tol + 1e-9;
}

export function codeMatches(input, answer) {
  const s = String(input ?? '').replace(/[\s-]/g, '');
  return /^\d+$/.test(s) && s === String(answer).replace(/[\s-]/g, '');
}

export function matches(r, input) {
  if (input == null || !String(input).trim()) return false;
  const t = typeOf(r);
  return accepted(r).some((a) => (t === 'number' ? numberMatches(input, a, r.tolerance) : t === 'code' ? codeMatches(input, a) : textMatches(input, a)));
}

// Whether a text contains an accepted answer (whole words, normalised): the validator warns when a
// clue gives its answer away, and the "go back to" thoughts are checked never to contain it.
export function mentions(text, r) {
  const t = ` ${normText(text)} `;
  return accepted(r).some((a) => { const n = typeOf(r) === 'text' ? normText(a) : String(a); return n && t.includes(` ${n} `); });
}
