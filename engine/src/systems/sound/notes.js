// Notes, frequencies and intervals: pure (Node-tested). Used by the lab sound API (lab.js), the
// mini-games (mechanics/games/) and anything that names a pitch.
//   A4 = 440 Hz, twelve-tone equal temperament; exact ratios for just intervals.
//   English names (C D E F G A B, # and b) and Italian ones (Do Re Mi Fa Sol La Si, # and b).

export const A4 = 440;
const EN = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const EN_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const IT = ['Do', 'Do#', 'Re', 'Mib', 'Mi', 'Fa', 'Fa#', 'Sol', 'Lab', 'La', 'Sib', 'Si'];
const IT_SHARP = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
const STEP = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11, do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 };

export const midiToHz = (m, a4 = A4) => a4 * 2 ** ((m - 69) / 12);
export const hzToMidi = (f, a4 = A4) => 69 + 12 * Math.log2(f / a4);
// cents from f1 up to f2
export const cents = (f1, f2) => 1200 * Math.log2(f2 / f1);

// 'A4', 'C#3', 'Bb2', 'Do4', 'Sib3', 'sol#2', 'E' (octave 4 by default) -> MIDI number, or NaN
export function noteToMidi(name, octave = 4) {
  const m = String(name).trim().match(/^(do|re|mi|fa|sol|la|si|[a-g])\s*([#♯]{1,2}|[b♭]{1,2})?\s*(-?\d+)?$/i);
  if (!m) return NaN;
  const base = STEP[m[1].toLowerCase()];
  if (base == null) return NaN;
  const acc = m[2] ? (/[#♯]/.test(m[2]) ? 1 : -1) * m[2].length : 0;
  const oct = m[3] != null ? Number(m[3]) : octave;
  return (oct + 1) * 12 + base + acc;
}
// a note name or a number (Hz) -> Hz
export function toHz(x, a4 = A4) {
  if (typeof x === 'number') return x;
  if (typeof x === 'string' && /^\s*\d+(\.\d+)?\s*(hz)?\s*$/i.test(x)) return parseFloat(x);
  const m = noteToMidi(x);
  return Number.isFinite(m) ? midiToHz(m, a4) : NaN;
}
// MIDI -> 'A4' / 'La4'; { sharp: true } spells black keys with sharps; { octave: false } drops it
export function midiToName(m, { lang = 'en', sharp = false, octave = true } = {}) {
  const r = Math.round(m), pc = ((r % 12) + 12) % 12, names = lang === 'it' ? (sharp ? IT_SHARP : IT) : sharp ? EN_SHARP : EN;
  return octave ? `${names[pc]}${Math.floor(r / 12) - 1}` : names[pc];
}
// the nearest note to a frequency, and how far from it in cents
export function nearestNote(f, opts = {}) {
  const m = hzToMidi(f), r = Math.round(m);
  return { midi: r, name: midiToName(r, opts), cents: (m - r) * 100 };
}

// intervals by semitones (0..12), English and Italian
const INTERVALS = [
  ['unison', 'unisono'], ['minor second', 'seconda minore'], ['major second', 'seconda maggiore'],
  ['minor third', 'terza minore'], ['major third', 'terza maggiore'], ['perfect fourth', 'quarta giusta'],
  ['tritone', 'tritono'], ['perfect fifth', 'quinta giusta'], ['minor sixth', 'sesta minore'],
  ['major sixth', 'sesta maggiore'], ['minor seventh', 'settima minore'], ['major seventh', 'settima maggiore'],
  ['octave', 'ottava'],
];
export function intervalName(semis, lang = 'en') {
  const s = Math.round(Math.abs(semis));
  if (s > 12) { const o = Math.floor(s / 12), r = s % 12; return r ? `${INTERVALS[r][lang === 'it' ? 1 : 0]} + ${o} ${lang === 'it' ? (o > 1 ? 'ottave' : 'ottava') : o > 1 ? 'octaves' : 'octave'}` : `${o} ${lang === 'it' ? 'ottave' : 'octaves'}`; }
  return INTERVALS[s][lang === 'it' ? 1 : 0];
}
// just (pure) ratios of the usual intervals, by semitones and by short name
export const JUST = { 0: [1, 1], 1: [16, 15], 2: [9, 8], 3: [6, 5], 4: [5, 4], 5: [4, 3], 6: [45, 32], 7: [3, 2], 8: [8, 5], 9: [5, 3], 10: [9, 5], 11: [15, 8], 12: [2, 1] };
const BY_NAME = { unison: 0, second: 2, 'minor third': 3, third: 4, 'major third': 4, fourth: 5, tritone: 6, fifth: 7, 'minor sixth': 8, sixth: 9, 'major sixth': 9, 'minor seventh': 10, seventh: 11, octave: 12 };
export function justRatio(x) {
  const s = typeof x === 'number' ? Math.round(x) : BY_NAME[String(x).toLowerCase().replace(/^perfect /, '')];
  if (s == null) return NaN;
  const o = Math.floor(s / 12), [a, b] = JUST[s - o * 12];
  return (a / b) * 2 ** o;
}
// equal-tempered ratio of n semitones
export const etRatio = (n) => 2 ** (n / 12);

// a chord: names or Hz -> Hz; { just: true } tunes every note to the first by the just ratio of its
// interval (C4 E4 G4 -> f, 5/4 f, 3/2 f); { ratios, root } gives exact ratios over a root
export function chordHz(notes, { just = false, ratios = null, root = null, a4 = A4 } = {}) {
  if (ratios) { const r0 = toHz(root ?? notes?.[0] ?? 261.63, a4); return ratios.map((q) => r0 * q); }
  const hz = notes.map((n) => toHz(n, a4));
  if (!just) return hz;
  const mids = notes.map((n) => (typeof n === 'number' ? hzToMidi(n, a4) : noteToMidi(n)));
  return mids.map((m) => hz[0] * justRatio(Math.round(m - mids[0])));
}

// The pure-math picture of what sounds: samples of a sum of sines (for drawing when audio is off,
// and for the tests). parts: [{ f, a }]; t0 in seconds; n samples over `span` seconds.
export function waveOf(parts, n = 512, span = 0.02, t0 = 0) {
  const out = new Float32Array(n);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    const t = t0 + (i / n) * span;
    let v = 0;
    for (const p of parts) v += (p.a ?? 1) * Math.sin(2 * Math.PI * p.f * t + (p.ph || 0));
    out[i] = v; peak = Math.max(peak, Math.abs(v));
  }
  if (peak > 1) for (let i = 0; i < n; i++) out[i] /= peak;
  return out;
}
// the spectrum as bins 0..1 over 0..maxHz (one bump per part)
export function spectrumOf(parts, n = 256, maxHz = 4000) {
  const out = new Float32Array(n);
  for (const p of parts) {
    const k = (p.f / maxHz) * n;
    for (let i = Math.max(0, Math.floor(k - 3)); i < Math.min(n, Math.ceil(k + 3)); i++) out[i] = Math.max(out[i], (p.a ?? 1) * Math.exp(-((i - k) ** 2) / 2));
  }
  return out;
}
