// Synthetic courses for the stress test and the tests: seed i -> 1 to 4 districts, 4 to 16 concepts,
// landscapes, landmarks and kinds of house drawn at random (deterministic in i).
import { KINDS } from '../src/world/townMap.js';

const NATURES = ['river', 'hill', 'forest', 'meadow', 'shore'], MONS = ['fountain', 'obelisk', 'statue', 'arch', 'bell', 'stones'], KS = Object.keys(KINDS);
export const rng = (s) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (a, r) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function course(i) {
  const r = rng(i * 7919 + 13), nd = 1 + Math.floor(r() * 4), nc = Math.max(nd, Math.min(4 * nd, 4 + Math.floor(r() * 13)));
  const per = Array(nd).fill(1); for (let k = nd; k < nc; k++) { let j; do j = Math.floor(r() * nd); while (per[j] >= 4); per[j]++; }
  const nat = shuffle(NATURES, r), mon = shuffle(MONS, r);
  let id = ''; for (let k = 0; k < 7; k++) id += String.fromCharCode(97 + Math.floor(r() * 26)); // ids are random words, as real ones are slugs
  return {
    id, title: `Synthetic ${i}`, bigIdea: 'x', hub: { name: 'Central Square', monument: mon[5], guide: { name: 'Iris', look: 'mentor' } }, league: { name: 'League' },
    districts: per.map((n, d) => ({ id: `d${d}`, name: `District ${d}`, idea: 'x', nature: nat[d], landmark: mon[d], places: Array.from({ length: n }, (_, p) => ({ id: `d${d}p${p}`, kind: KS[Math.floor(r() * KS.length)], name: `Place ${d}.${p}`, concept: 'x', objective: 'Do x' })) })),
  };
}

