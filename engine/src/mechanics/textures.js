// Registers the layer's pictures once per game: animal sheets and their animations, obstacles
// (closed and open), the "not yet" markers, the rewards, the small things of the secrets.
import { addSheet, addTex } from '../art/px.js';
import { animalSheet, SHEETS } from './animals/art.js';
import { obstacleTexture, markerTexture, rewardTexture, OBSTACLE_ART } from './obstacles/art.js';
import { secretTexture } from './secrets/art.js';
import { TOOLS } from './obstacles/kinds.js';

export function lifeTextures(scene) {
  if (scene.textures.exists('life-ready')) return;
  for (const name of Object.keys(SHEETS)) {
    addSheet(scene, `life-${name}`, animalSheet(name), 16, 16);
    const a = scene.anims;
    if (!a.exists(`life-${name}-idle`)) a.create({ key: `life-${name}-idle`, frames: a.generateFrameNumbers(`life-${name}`, { frames: [0, 1] }), frameRate: 2, repeat: -1 });
    if (!a.exists(`life-${name}-move`)) a.create({ key: `life-${name}-move`, frames: a.generateFrameNumbers(`life-${name}`, { frames: [2, 3] }), frameRate: 10, repeat: -1 });
  }
  for (const k of Object.keys(OBSTACLE_ART)) { addTex(scene, `life-ob-${k}`, obstacleTexture(k)); addTex(scene, `life-ob-${k}-open`, obstacleTexture(k, true)); }
  for (const t of Object.keys(TOOLS)) addTex(scene, `life-mark-${t}`, markerTexture(t));
  for (const r of ['chest', 'glint', 'plant']) addTex(scene, `life-prize-${r}`, rewardTexture(r));
  for (const s of ['apple', 'bottle', 'prints', 'muddy', 'hollow', 'note', 'lantern', 'star']) addTex(scene, `life-${s}`, secretTexture(s));
  addTex(scene, 'life-ready', secretTexture('star'));
}
