// Torches and firelight for the castle: flickering flames, warm glows and a darkness
// layer that the torches (and the player) cut holes into.
import Phaser from 'phaser';
import { makeCanvas, px, rect, addTex } from './px.js';

const FLAME = [
  ['..y..', '.yy..', '.yoy.', 'yooy.', 'yorry', '.orr.', '..r..'],
  ['...y.', '..yy.', '.yoy.', '.yooy', 'yrroy', '.rro.', '..r..'],
];
const COL = { y: '#ffe58a', o: '#ffb347', r: '#e2582c' };

function ensure(scene) {
  if (scene.textures.exists('flame-0')) return;
  FLAME.forEach((rows, i) => {
    const [c, ctx] = makeCanvas(5, 7);
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (COL[ch]) px(ctx, x, y, COL[ch]); }));
    addTex(scene, `flame-${i}`, c);
  });
}

// Draws the iron bracket of a wall torch into a room painting.
export function bracket(ctx, x, y) {
  rect(ctx, x - 1, y + 3, 3, 6, '#2a2018'); rect(ctx, x - 2, y + 2, 5, 2, '#5a4a36'); rect(ctx, x, y + 9, 1, 3, '#2a2018');
}

export class FireLight {
  // torches: [[x, y], ...] in room pixels; follow: a sprite that carries a small light of its own
  constructor(scene, w, h, torches, follow, { dark = 0.62, tint = 0x140a06, radius = 44 } = {}) {
    ensure(scene);
    Object.assign(this, { scene, torches, follow, dark, tint, radius });
    this.flames = torches.map(([x, y]) => scene.add.image(x, y, 'flame-0').setOrigin(0.5, 1).setDepth(8000));
    this.glows = torches.map(([x, y]) => scene.add.image(x, y - 3, 'glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(9001).setScale(0.8));
    this.rt = scene.add.renderTexture(0, 0, w, h).setOrigin(0).setDepth(9000);
    this.brush = scene.make.image({ key: 'light', add: false });
    this.seed = torches.map(() => Math.random() * 10);
  }

  update(time) {
    const rt = this.rt, b = this.brush;
    rt.clear(); rt.fill(this.tint, this.dark);
    this.torches.forEach(([x, y], i) => {
      const f = 0.9 + 0.1 * Math.sin(time / 90 + this.seed[i]) + 0.06 * Math.sin(time / 37 + this.seed[i] * 3);
      b.setScale((this.radius * 2 * f) / 128); rt.erase(b, x, y + 6);
      this.flames[i].setTexture(Math.floor(time / 130 + this.seed[i]) % 2 ? 'flame-0' : 'flame-1');
      this.glows[i].setAlpha(0.55 * f).setScale(0.75 * f);
    });
    if (this.follow) { b.setScale(0.55); rt.erase(b, this.follow.x, this.follow.y - 10); }
  }
}
