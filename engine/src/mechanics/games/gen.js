// Mini-games: the content of each round, from the course's data and the difficulty. Pure: every
// function takes an rng () -> [0, 1) and a level 0..1. tests/games.test.mjs checks them.
import { lerp } from './scoring.js';
import { toHz } from '../../systems/sound/notes.js';

const pickOf = (rng, a) => a[Math.floor(rng() * a.length)];
export function shuffle(rng, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
const between = (rng, r) => (Array.isArray(r) ? r[0] + rng() * (r[1] - r[0]) : r);
const round = (v, d = 0) => { const k = 10 ** d; return Math.round(v * k) / k; };

// an item as the frame shows it: always an object
export function item(x) {
  if (x == null) return { text: '' };
  if (typeof x === 'string' || typeof x === 'number') return { text: String(x) };
  return { ...x };
}
export const hsl = (h, s, l) => `hsl(${round(((h % 360) + 360) % 360, 1)} ${round(s * 100, 1)}% ${round(l * 100, 1)}%)`;
// what an item is called in feedback ("You said …")
export function nameOf(it, i = 0, lang = 'en') {
  if (it.label) return it.label;
  if (it.text) return it.text;
  const ord = (lang === 'it' ? ['il primo', 'il secondo', 'il terzo', 'il quarto'] : ['the first', 'the second', 'the third', 'the fourth'])[i] || String(i + 1);
  return ord;
}
// the frequencies of a sound spec (for playing and for checking)
export function soundHz(s) {
  if (!s) return [];
  if (s.ratios) { const r = toHz(s.hz ?? s.note ?? 261.63); return s.ratios.map((q) => r * q); }
  if (s.notes) return s.notes.map((n) => toHz(n));
  if (s.note) return [toHz(s.note)];
  if (Array.isArray(s.hz)) return s.hz.map(Number);
  if (s.hz != null) return [Number(s.hz)];
  return [];
}

// ---- which
function valuesApart(rng, from, to, gap, n, log = false) {
  // n values, consecutive ones `gap` apart (in log2 when log), placed at random inside [from, to]
  if (log) {
    const lf = Math.log2(from), lt = Math.log2(to), span = (gap / 12) * (n - 1);
    const lo = lf + rng() * Math.max(0, lt - lf - span);
    return Array.from({ length: n }, (_, i) => 2 ** (lo + (i * gap) / 12));
  }
  const span = gap * (n - 1), lo = from + rng() * Math.max(0, to - from - span);
  return Array.from({ length: n }, (_, i) => lo + i * gap);
}
export function whichRound(data, level, rng) {
  const n = Math.max(2, Math.min(4, data.count || 2)), pick = data.pick === 'min' ? 'min' : 'max';
  let items;
  if (data.make) {
    const m = data.make, gap = lerp(m.gap ?? defaultGap(m), level);
    if (m.kind === 'tone') {
      const vs = m.unit === 'hz' ? valuesApart(rng, m.from ?? 220, m.to ?? 880, gap, n) : valuesApart(rng, m.from ?? 220, m.to ?? 880, gap, n, true);
      items = vs.map((f) => ({ sound: { hz: round(f, 2), voice: m.voice || 'pure', dur: m.dur ?? 0.8 }, value: f }));
    } else if (m.kind === 'hsl') {
      const vary = m.vary || 'l', vs = valuesApart(rng, m.from ?? (vary === 'h' ? 0 : 0.15), m.to ?? (vary === 'h' ? 300 : 0.85), gap, n);
      const fixed = { h: between(rng, m.h ?? [0, 360]), s: between(rng, m.s ?? 0.7), l: between(rng, m.l ?? 0.5) };
      items = vs.map((v) => { const c = { ...fixed, [vary]: v }; return { colour: hsl(c.h, c.s, c.l), value: v }; });
    } else if (m.kind === 'size') {
      const vs = valuesApart(rng, m.from ?? 0.3, m.to ?? 1, gap, n);
      items = vs.map((v) => ({ shape: m.shape || 'circle', size: v, colour: m.colour || '#e8d8a8', value: v }));
    } else { // number
      const vs = valuesApart(rng, m.from ?? 1, m.to ?? 100, gap, n);
      items = vs.map((v) => ({ text: String(round(v, m.decimals || 0)), value: round(v, m.decimals || 0) }));
    }
    items = shuffle(rng, items);
  } else {
    const pool = shuffle(rng, (data.items || []).map(item)), seen = new Set();
    items = [];
    for (const it of pool) { if (items.length >= n) break; if (seen.has(it.value)) continue; seen.add(it.value); items.push(it); }
  }
  const vals = items.map((it) => it.value), best = pick === 'max' ? Math.max(...vals) : Math.min(...vals);
  return { items, answer: vals.indexOf(best) };
}
function defaultGap(m) { return m.kind === 'tone' ? (m.unit === 'hz' ? [100, 10] : [7, 1]) : m.kind === 'hsl' ? (m.vary === 'h' ? [60, 10] : [0.3, 0.05]) : m.kind === 'size' ? [0.3, 0.06] : [30, 2]; }

// ---- estimate
export function scaleSpan(scale) { return scale.log ? Math.log2(scale.to / scale.from) : scale.to - scale.from; }
// error of a guess as a share of the scale (0 = exact)
export function estimateError(scale, guess, value) {
  if (scale.log) return Math.abs(Math.log2(guess / value)) / scaleSpan(scale);
  let d = Math.abs(guess - value);
  if (scale.wrap) d = Math.min(d, scaleSpan(scale) - d);
  return d / scaleSpan(scale);
}
// position 0..1 on the line <-> value
export const toPos = (scale, v) => (scale.log ? Math.log2(v / scale.from) / scaleSpan(scale) : (v - scale.from) / scaleSpan(scale));
export const fromPos = (scale, p) => (scale.log ? scale.from * 2 ** (p * scaleSpan(scale)) : scale.from + p * scaleSpan(scale));
export function estimateRound(data, level, rng) {
  const sc = data.scale, tol = lerp(data.close ?? [0.15, 0.05], level);
  let it;
  if (data.make) {
    const m = data.make;
    if (m.kind === 'tone') { const lo = Math.log2(m.from ?? sc.from), hi = Math.log2(m.to ?? sc.to), f = round(2 ** (lo + rng() * (hi - lo)), 1); it = { sound: { hz: f, voice: m.voice || 'pure', dur: m.dur ?? 1.4 }, value: f }; }
    else if (m.kind === 'hue') { const v = Math.round((m.from ?? 0) + rng() * ((m.to ?? 360) - (m.from ?? 0))) % 360; it = { colour: hsl(v, m.s ?? 0.85, m.l ?? 0.52), value: v }; }
    else { const v = round((m.from ?? sc.from) + rng() * ((m.to ?? sc.to) - (m.from ?? sc.from)), m.decimals || 0); it = { text: String(v), value: v }; }
  } else it = item(pickOf(rng, data.items));
  return { item: it, value: it.value, tolerance: tol };
}
// right within the tolerance; quality 0..1 (1 = exact) for the points
export function judgeEstimate(scale, guess, value, tol) {
  const e = estimateError(scale, guess, value);
  return { right: e <= tol, error: e, quality: Math.max(0, 1 - e / tol) };
}

// ---- match-fast: one board
export function matchBoard(data, level, rng) {
  const per = Math.max(2, Math.min(6, data.per || 4)), pairs = shuffle(rng, data.pairs).slice(0, per);
  const left = pairs.map((p, i) => ({ ...item(p[0]), k: i })), right = shuffle(rng, pairs.map((p, i) => ({ ...item(p[1]), k: i })));
  return { left, right, time: lerp(data.time ?? [30, 15], level) };
}

// ---- sort-fast: one card
export function binIndex(data, bin) { return typeof bin === 'number' ? bin : data.bins.indexOf(bin); }
export function sortCard(data, level, rng, last = null) {
  const cards = data.cards.map((c, i) => ({ ...item(c), bin: binIndex(data, c.bin), i }));
  let c = pickOf(rng, cards);
  if (last != null && cards.length > 1) for (let t = 0; t < 5 && c.i === last; t++) c = pickOf(rng, cards);
  return { card: c, answer: c.bin, time: lerp(data.time ?? [6, 2.5], level) };
}

// ---- odd-one-out
const fill = (s, v) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
export function oddRound(data, level, rng, n = 0) {
  if (data.groups) {
    const names = shuffle(rng, Object.keys(data.groups).filter((k) => data.groups[k].length >= 3));
    const g = names[0], o = names[1] || Object.keys(data.groups).find((k) => k !== g);
    const three = shuffle(rng, data.groups[g]).slice(0, 3), odd = pickOf(rng, data.groups[o]);
    const items = shuffle(rng, [...three.map(item), { ...item(odd), odd: true }]);
    const answer = items.findIndex((x) => x.odd);
    return { items, answer, why: data.why ? fill(data.why, { odd: nameOf(items[answer]), group: g, oddGroup: o }) : null };
  }
  const set = data.sets[n % data.sets.length];
  const items = shuffle(rng, set.items.map((x, i) => ({ ...item(x), odd: i === set.odd })));
  return { items, answer: items.findIndex((x) => x.odd), why: set.why || null };
}

// ---- sequence: the length follows the staircase step
export function sequenceRound(data, step, rng) {
  const n = data.pads.length, len = Math.max(2, Math.min(data.longest ?? 8, (data.start ?? 3) + step));
  const seq = [];
  while (seq.length < len) { const k = Math.floor(rng() * n); if (seq.length >= 2 && seq[seq.length - 1] === k && seq[seq.length - 2] === k) continue; seq.push(k); }
  return { seq, len };
}
