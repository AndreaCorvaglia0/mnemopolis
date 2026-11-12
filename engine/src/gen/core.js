// Shared ground for the optional generators (facade, interior, dressing).
// Everything generated is DETERMINISTIC: the same course always gives the same town, and each
// course gets its own. Nothing here may use Math.random.
import { DATA, WORLD } from '../course/_data.js';

// Which generators are on. Switch one off at build time in courses/<slug>/world.json:
//   { "gen": { "facade": false, "interior": false, "dressing": false }, "theme": "nordic" }
// A generator that is off must leave the game exactly as it was without it.
export const GEN = { facade: true, interior: true, dressing: true, ...(WORLD?.gen || {}) };

function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// A random source tied to a name. seeded('lamps:facade') is the same sequence in every build.
export function seeded(key) {
  let a = hash(`${DATA.id}:${key}`) || 1;
  const next = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.chance = (p) => next() < p;
  return next;
}

// The look of a project: materials and colours shared by houses, rooms and street furniture.
// Chosen by world.json "theme", otherwise by the course id. Generators may ADD fields to a theme,
// never rename these.
export const THEMES = {
  harbour: { name: 'harbour', roofs: ['#b9463b', '#3c5ea6', '#2a8c87', '#d9822f'], wall: ['#f3ead6', '#e6dcc0', '#d9cbb0'], wood: '#7a5230', stone: '#8f8a82', trim: '#ffffff', accent: '#ffcf5a' },
  nordic: { name: 'nordic', roofs: ['#3a3f6b', '#5b6b8c', '#2f5d50', '#7a3b3b'], wall: ['#c9563f', '#e7c873', '#dfe6ea'], wood: '#5a3a20', stone: '#7b8088', trim: '#f4f1e8', accent: '#ffd98a' },
  citadel: { name: 'citadel', roofs: ['#6b4fa0', '#8a5a34', '#3f7f72', '#9c3440'], wall: ['#d6d2c8', '#b4afa6', '#c9b89a'], wood: '#6a4a2c', stone: '#6f6a64', trim: '#e8e2d2', accent: '#ffb85c' },
};
const names = Object.keys(THEMES);
export const THEME = THEMES[WORLD?.theme] || THEMES[names[hash(DATA.id) % names.length]];
