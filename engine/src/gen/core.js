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
export function seeded(key, id = DATA.id) {
  let a = hash(`${id}:${key}`) || 1;
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
  harbour: { name: 'harbour', roofs: ['#b9463b', '#3c5ea6', '#2a8c87', '#d9822f'], wall: ['#f3ead6', '#e6dcc0', '#d9cbb0', '#cfe0e3'], wood: '#7a5230', stone: '#8f8a82', trim: '#ffffff', accent: '#ffcf5a',
    // added for the facade generator (gen/facade.js): structure, not only colour
    hubRoof: '#3c5ea6',
    style: { pitch: 0.45, roofs: ['slope', 'hip', 'gable'], tex: 'tile', wall: 'clapboard', windows: ['square', 'square', 'wide'], doors: ['#2f5d8a', '#2a8c87', '#9c3440', '#7a5230'], shutters: ['#2f5d8a', '#2a8c87', '#3f7f52', '#b9463b'], chimney: 0.6, boxes: 0.7, awning: 0.5, quoins: false, tower: 'stripes', cap: 'dome', castle: '#b9b3a6' } },
  nordic: { name: 'nordic', roofs: ['#3a3f6b', '#5b6b8c', '#2f5d50', '#7a3b3b'], wall: ['#c9563f', '#e7c873', '#dfe6ea', '#4f7f8f'], wood: '#5a3a20', stone: '#7b8088', trim: '#f4f1e8', accent: '#ffd98a',
    hubRoof: '#2f3a52',
    style: { pitch: 0.9, roofs: ['slope', 'gable', 'gable'], tex: 'slate', wall: 'boards', windows: ['tall', 'tall', 'square'], doors: ['#2f3b52', '#5a3a20', '#2f5d50', '#7a3b3b'], shutters: ['#f4f1e8'], chimney: 0.95, boxes: 0.25, awning: 0.1, quoins: false, tower: 'plain', cap: 'cone', castle: '#8e96a3' } },
  citadel: { name: 'citadel', roofs: ['#6b4fa0', '#8a5a34', '#3f7f72', '#9c3440'], wall: ['#d6d2c8', '#b4afa6', '#c9b89a', '#d8c7a6'], wood: '#6a4a2c', stone: '#6f6a64', trim: '#e8e2d2', accent: '#ffb85c',
    hubRoof: '#4f3e7a',
    style: { pitch: 0.15, roofs: ['hip', 'flat', 'mansard'], tex: 'tile', wall: 'ashlar', windows: ['arched', 'arched', 'square'], doors: ['#6a4a2c', '#4a3020', '#3a2b1d'], shutters: ['#3f7f72', '#9c3440', '#6b4fa0'], chimney: 0.35, boxes: 0.45, awning: 0.35, quoins: true, tower: 'stone', cap: 'crenel', castle: '#c9b48e' } },
};
// added for the dressing generator (gen/dressing.js): which small things a project's town gets and
// their colours. Lists are weighted by repetition. `floral` and `worked` are the two district moods.
THEMES.harbour.dressing = {
  fence: { floral: 'picket', worked: 'rope' }, plots: { floral: ['flowers', 'flowers', 'orchard'], worked: ['veg', 'veg', 'flowers'] },
  plaza: ['planter', 'barrels', 'stall', 'bench', 'crates', 'planter'], side: { floral: ['flowerbed', 'planter', 'barrels'], worked: ['barrels', 'crates', 'nets'] },
  corner: { floral: ['laundry', 'flowerbed', 'barrels'], worked: ['nets', 'crates', 'laundry', 'barrels'] },
  water: { pier: true, boats: 2, reeds: 0.3, lilies: 0.04 }, lantern: 'pier',
  flowers: ['#e0574f', '#f2c94c', '#f5f1e6', '#5fb0d2'], cloth: ['#3c5ea6', '#f3ead6', '#b9463b', '#2a8c87'], fruit: '#e0574f', paint: '#f3f2ec',
};
THEMES.nordic.dressing = {
  fence: { floral: 'picket', worked: 'rail' }, plots: { floral: ['flowers', 'orchard'], worked: ['veg', 'veg', 'orchard'] },
  plaza: ['lantern', 'bench', 'woodpile', 'planter', 'sledge'], side: { floral: ['flowerbed', 'lantern', 'woodpile'], worked: ['woodpile', 'woodpile', 'sledge', 'barrels'] },
  corner: { floral: ['fir', 'beehive', 'laundry'], worked: ['woodpile', 'fir', 'sledge', 'laundry', 'beehive'] },
  water: { pier: true, boats: 1, reeds: 0.4, lilies: 0.05 }, lantern: 'post',
  flowers: ['#f2c94c', '#9a6ad1', '#f5f1e6', '#e0574f'], cloth: ['#c9563f', '#e7c873', '#dfe6ea', '#4f7f8f'], fruit: '#d9443a', paint: '#f4f1e8',
};
THEMES.citadel.dressing = {
  fence: { floral: 'hedge', worked: 'wall' }, plots: { floral: ['flowers', 'flowers', 'orchard'], worked: ['veg', 'orchard'] },
  plaza: ['well', 'statue', 'topiary', 'planter', 'bench', 'stall'], side: { floral: ['topiary', 'planter', 'flowerbed'], worked: ['barrels', 'crates', 'well'] },
  corner: { floral: ['topiary', 'statue', 'beehive'], worked: ['crates', 'barrels', 'beehive', 'laundry'] },
  water: { pier: false, boats: 1, reeds: 0.3, lilies: 0.08 }, lantern: 'well',
  flowers: ['#e0574f', '#9a6ad1', '#ffb85c', '#f5f1e6'], cloth: ['#9c3440', '#e8e2d2', '#6b4fa0', '#3f7f72'], fruit: '#f2a03c', paint: '#e8e2d2',
};
const names = Object.keys(THEMES);
export const THEME = THEMES[WORLD?.theme] || THEMES[names[hash(DATA.id) % names.length]];
