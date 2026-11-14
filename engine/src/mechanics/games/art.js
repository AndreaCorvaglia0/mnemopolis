// The game objects in town, drawn in code in the game's style (dark outline, light from the upper
// left), and the small mark over them: a gold die with a play arrow, unlike the lock's padlock and
// the obstacles' tools. Registered once per game (gameTextures).
import { makeCanvas, rect, px, ellipse, addTex } from '../../art/px.js';

const INK = '#1b1a2b', WOOD = ['#4a2f1f', '#7a4e31', '#a0683f', '#c98d5c'], GOLD = '#ffcf5a';
const box = (g, x, y, w, h, fill) => { rect(g, x, y, w, h, INK); rect(g, x + 1, y + 1, w - 2, h - 2, fill); };

const PAINT = {
  piano: { w: 16, h: 20, draw(g) { // an upright piano, keys toward you
    ellipse(g, 8, 19, 8, 1.5, 'rgba(20,18,40,0.35)');
    box(g, 0, 2, 16, 17, WOOD[1]); rect(g, 1, 3, 14, 2, WOOD[2]); rect(g, 1, 3, 3, 1, WOOD[3]);
    box(g, 1, 9, 14, 4, '#efe8d6'); for (let x = 2; x < 15; x += 2) rect(g, x, 9, 1, 3, INK);
    for (const x of [3, 5, 9, 11, 13]) rect(g, x, 10, 1, 1, '#2a2436');
    rect(g, 2, 14, 12, 4, WOOD[0]); rect(g, 3, 6, 10, 2, WOOD[0]); px(g, 4, 6, GOLD); px(g, 11, 6, GOLD);
    rect(g, 1, 18, 2, 1, INK); rect(g, 13, 18, 2, 1, INK);
  } },
  board: { w: 16, h: 18, draw(g) { // a small table with a chequered board and two pieces
    ellipse(g, 8, 17, 8, 1.5, 'rgba(20,18,40,0.35)');
    rect(g, 2, 11, 2, 6, INK); rect(g, 12, 11, 2, 6, INK); rect(g, 3, 11, 1, 5, WOOD[2]); rect(g, 12, 11, 1, 5, WOOD[2]);
    box(g, 0, 6, 16, 6, WOOD[1]); rect(g, 1, 7, 14, 1, WOOD[3]);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 6; x++) rect(g, 2 + x * 2, 8 + y * 2, 2, 2, (x + y) % 2 ? '#e8dcbf' : '#5a3a28');
    ellipse(g, 5, 5, 2, 2, INK); ellipse(g, 5, 5, 1, 1, '#e8e2c9'); ellipse(g, 11, 5, 2, 2, INK); ellipse(g, 11, 5, 1, 1, '#c0503a');
  } },
  hat: { w: 16, h: 14, draw(g) { // a street musician's hat on a stool, a few coins in it
    ellipse(g, 8, 13, 8, 1.5, 'rgba(20,18,40,0.35)');
    ellipse(g, 8, 10, 8, 3, INK); ellipse(g, 8, 10, 7, 2, '#3a3150'); rect(g, 3, 4, 10, 6, INK); rect(g, 4, 5, 8, 5, '#4a3f66'); rect(g, 4, 7, 8, 1, '#c0503a');
    px(g, 6, 9, GOLD); px(g, 9, 9, GOLD); px(g, 8, 10, '#d9d9d9'); rect(g, 5, 5, 2, 1, '#6a5c8c');
    // a little note floating
    px(g, 13, 1, GOLD); px(g, 13, 2, GOLD); px(g, 12, 3, GOLD); px(g, 14, 1, GOLD);
  } },
  box: { w: 16, h: 22, draw(g) { // a curiosity box: a small cabinet with a glowing window and a crank
    ellipse(g, 8, 21, 8, 1.5, 'rgba(20,18,40,0.35)');
    box(g, 1, 1, 14, 20, '#3b2f5a'); rect(g, 2, 2, 12, 2, '#55467e'); px(g, 3, 2, '#7a6aa8');
    box(g, 3, 5, 10, 7, '#0d1a1e'); rect(g, 4, 6, 8, 5, '#1f6e66'); rect(g, 5, 7, 2, 1, '#9ff2e8'); rect(g, 8, 9, 3, 1, '#4fd1c5');
    rect(g, 3, 13, 10, 2, WOOD[1]); px(g, 5, 13, GOLD); px(g, 10, 13, '#ff7a6b');
    rect(g, 4, 16, 8, 3, '#2a2140'); rect(g, 7, 17, 2, 1, GOLD); // the coin slot
    rect(g, 15, 9, 1, 4, INK); rect(g, 15, 9, 1, 1, GOLD);
  } },
  bench: { w: 16, h: 14, draw(g) { // a bench with a deck of cards laid out
    ellipse(g, 8, 13, 8, 1.5, 'rgba(20,18,40,0.35)');
    rect(g, 1, 9, 2, 4, INK); rect(g, 13, 9, 2, 4, INK);
    box(g, 0, 6, 16, 4, WOOD[2]); rect(g, 1, 7, 14, 1, WOOD[3]); box(g, 0, 2, 16, 3, WOOD[1]);
    for (const [x, c] of [[3, '#f1ecd9'], [6, '#f1ecd9'], [9, '#ffcf5a']]) { rect(g, x, 5, 3, 3, INK); rect(g, x, 5, 2, 2, c); }
    px(g, 3, 5, '#c0503a'); px(g, 7, 6, '#2a2436');
  } },
};

export function objectTexture(kind) {
  const p = PAINT[kind] || PAINT.box, [c, g] = makeCanvas(p.w, p.h);
  p.draw(g);
  return c;
}
// the mark: a gold die (9 x 10) with a play arrow, floating above the object while the player is near
export function gameMarkTexture() {
  const [c, g] = makeCanvas(11, 11);
  box(g, 0, 0, 11, 11, GOLD); rect(g, 1, 1, 9, 1, '#ffe7a3');
  rect(g, 4, 3, 1, 5, INK); rect(g, 5, 4, 1, 3, INK); rect(g, 6, 5, 1, 1, INK);
  return c;
}
export const GAME_OBJECTS = Object.keys(PAINT);
export function gameTextures(scene) {
  if (scene.textures.exists('gm-mark')) return;
  for (const k of GAME_OBJECTS) addTex(scene, `gm-${k}`, objectTexture(k));
  addTex(scene, 'gm-mark', gameMarkTexture());
}
