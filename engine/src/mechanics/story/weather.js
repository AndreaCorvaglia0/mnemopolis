// The rain over the town (docs/STORY.md): heavy at the arrival, thinner with each house remembered,
// gone at the ending. Two tiles of streaks scroll over the view (no sprites per drop), above the
// night's darkness; the rain's place sound follows the same amount. Town only.
import { setRain } from '../../systems/audio.js';
import { state } from '../../systems/state.js';
import { rainNow } from './stages.js';
import { reducedMotion } from './cinema.js';

export class Weather {
  constructor(scene) {
    this.scene = scene;
    this.now = this.target = rainNow(state);
    const cam = scene.cameras.main;
    this.far = scene.add.tileSprite(0, 0, 8, 8, 'story-rain-b').setOrigin(0).setDepth(9040);
    this.near = scene.add.tileSprite(0, 0, 8, 8, 'story-rain-a').setOrigin(0).setDepth(9041);
    this.veil = scene.add.rectangle(0, 0, 8, 8, 0x1a2036, 1).setOrigin(0).setDepth(9039); // the rain greys the air a little
    this.reduced = reducedMotion();
    this.size(cam);
    setRain(this.now);
  }
  size(cam) {
    const w = Math.ceil(cam.width / cam.zoom) + 16, h = Math.ceil(cam.height / cam.zoom) + 16;
    for (const t of [this.far, this.near]) t.setSize(w, h);
    this.veil.setSize(w, h);
  }
  // to a new amount, gliding (the town warms slowly); jump: at once
  set(v, jump = false) { this.target = Math.max(0, Math.min(1, v)); if (jump) this.now = this.target; }
  refresh() { this.set(rainNow(state)); }
  update(time, dt = 16) {
    const cam = this.scene.cameras.main, v = cam.worldView;
    if (Math.abs(this.near.width - (cam.width / cam.zoom + 16)) > 1) this.size(cam);
    this.now += (this.target - this.now) * Math.min(1, dt / 1800);
    if (Math.abs(this.now - this.target) < 0.002) this.now = this.target;
    const a = this.now;
    for (const t of [this.far, this.near, this.veil]) t.setPosition(Math.floor(v.x) - 8, Math.floor(v.y) - 8).setVisible(a > 0.01);
    this.near.setAlpha(Math.min(1, 0.3 + a * 0.7)); this.far.setAlpha(Math.min(1, 0.2 + a * 0.6)); this.veil.setAlpha(a * 0.16);
    if (!this.reduced) {
      // the streaks fall in screen space; the world under them moves with the camera
      this.near.tilePositionY = -time * 0.16 + v.y; this.near.tilePositionX = time * 0.05 + v.x;
      this.far.tilePositionY = -time * 0.1 + v.y * 0.9; this.far.tilePositionX = time * 0.03 + v.x * 0.9;
    }
    if (Math.abs(a - (this.sent ?? -1)) > 0.01) { this.sent = a; setRain(a); }
  }
  stopSound() { setRain(0); }
}
