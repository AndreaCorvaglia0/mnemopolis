// The town gate at the end of the road out of town (world/townMap.js GATE): two stone posts (props
// 'gatepost') and a wooden double gate between them, shut or open. Seen from the front when the
// road leaves the town north or south, from the side when it leaves east or west.
import { makeCanvas, rect, px, addTex } from '../art/px.js';
import { P } from '../art/palette.js';

const STONE = '#8f8a99', STONE_L = '#b8b3c2', STONE_D = '#5d5868', WOOD = '#8a5a34', WOOD_D = '#5c3f27', WOOD_L = '#b07a4a', IRON = '#2a2833';

function post() {
  const [c, g] = makeCanvas(16, 34);
  rect(g, 3, 6, 10, 28, P.ink); rect(g, 4, 7, 8, 27, STONE);
  for (let y = 9; y < 33; y += 5) rect(g, 4, y, 8, 1, STONE_D);
  rect(g, 4, 7, 2, 27, STONE_L);
  rect(g, 1, 2, 14, 6, P.ink); rect(g, 2, 3, 12, 4, STONE_L); rect(g, 2, 6, 12, 1, STONE_D); // the cap
  rect(g, 6, 0, 4, 3, P.ink); px(g, 7, 1, '#ffcf5a'); px(g, 8, 1, '#ffcf5a'); // a small lantern on top
  return c;
}

// front view, 32 x 30: two leaves; open: the leaves folded back against the posts, the road beyond
function front(open) {
  const [c, g] = makeCanvas(32, 30);
  rect(g, 0, 2, 32, 4, P.ink); rect(g, 1, 3, 30, 2, WOOD_D); // the lintel beam
  if (!open) {
    for (const x0 of [1, 16]) {
      rect(g, x0, 6, 15, 24, P.ink); rect(g, x0 + 1, 7, 13, 23, WOOD);
      for (let x = x0 + 4; x < x0 + 14; x += 4) rect(g, x, 7, 1, 23, WOOD_D);
      rect(g, x0 + 1, 7, 13, 1, WOOD_L);
      rect(g, x0 + 1, 11, 13, 2, IRON); rect(g, x0 + 1, 23, 13, 2, IRON);
    }
    rect(g, 15, 15, 2, 4, '#ffcf5a'); // the bolt
  } else {
    for (const x0 of [1, 27]) { rect(g, x0, 6, 4, 24, P.ink); rect(g, x0 + 1, 7, 2, 23, WOOD); }
    rect(g, 1, 3, 30, 1, '#ffcf5a');
  }
  return c;
}

// side view, 32 x 34 (the road runs left-right; the gate across it, seen edge-on)
function side(open) {
  const [c, g] = makeCanvas(32, 34);
  if (!open) {
    rect(g, 12, 2, 8, 32, P.ink); rect(g, 13, 3, 6, 31, WOOD);
    for (let y = 6; y < 34; y += 6) rect(g, 13, y, 6, 1, WOOD_D);
    rect(g, 13, 10, 6, 2, IRON); rect(g, 13, 24, 6, 2, IRON); px(g, 16, 17, '#ffcf5a');
  } else {
    rect(g, 2, 2, 28, 3, P.ink); rect(g, 3, 3, 26, 1, '#ffcf5a');
    rect(g, 2, 2, 4, 32, P.ink); rect(g, 3, 3, 2, 31, WOOD); rect(g, 26, 2, 4, 32, P.ink); rect(g, 27, 3, 2, 31, WOOD);
  }
  return c;
}

export const gateKey = (vert, open) => `gate-${vert ? 'front' : 'side'}-${open ? 'open' : 'shut'}`;

export function gateTextures(scene) {
  if (scene.textures.exists('gatepost')) return;
  addTex(scene, 'gatepost', post());
  for (const open of [false, true]) { addTex(scene, gateKey(true, open), front(open)); addTex(scene, gateKey(false, open), side(open)); }
}
