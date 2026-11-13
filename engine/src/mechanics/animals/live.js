// Animals in the town scene. A handful of sprites, each at one of its spots (place.js). A tick every
// 200 ms looks only at the animals near the camera: those off screen are hidden and skipped, so the
// cost does not grow with the map. They react to the player coming close, never to clicks, never
// block a step, and follow the time of day (N). Behaviour uses Math.random: it is cosmetic only.
import { CAST } from './cast.js';
import { sfx } from '../../systems/audio.js';

const T = 16, SHEET = { cat: 'cat', sparrow: 'sparrow', owl: 'owl', frog: 'frog', squirrel: 'squirrel', dog: 'dog', fish: 'fish', gull: 'gull', crab: 'crab', hare: 'hare', fox: 'fox', crow: 'crow' };
const rnd = (a, b) => a + Math.random() * (b - a);

export class Animals {
  constructor(scene, plan, ctx) {
    this.scene = scene; this.c = ctx; this.list = [];
    let cats = 0;
    for (const a of plan.animals.town) {
      const cast = CAST[a.kind], sheet = a.kind === 'cat' && cats++ ? 'cat2' : SHEET[a.kind];
      const n = cast.n || 1;
      for (let k = 0; k < n; k++) {
        const s = scene.add.sprite(0, 0, `life-${sheet}`, 0).setOrigin(0.5, 1).setVisible(false);
        const an = { ...a, cast, sheet, s, k, spot: (k + Math.floor(Math.random() * a.spots.length)) % a.spots.length, mode: 'idle', until: 0 };
        this.place(an);
        this.list.push(an);
      }
    }
    this.event = scene.time.addEvent({ delay: 200, loop: true, callback: () => this.tick() });
  }

  // where on screen a spot is, by the kind of perch
  pos(an, [x, y]) {
    const p = an.cast.perch, dx = an.k ? 6 : 0;
    if (p === 'roof') { const b = this.c.building(x, y); return { x: x * T + 8 + dx, y: y * T + 6, d: b ? (b.y + b.h) * T + 1 : y * T + 20 }; }
    if (p === 'tree') return { x: x * T + 8, y: y * T - 3, d: y * T + 17 };
    if (p === 'water') return { x: x * T + 8, y: y * T + 14, d: 2.7 };
    return { x: x * T + 8 + dx, y: y * T + 15 - (an.k ? 3 : 0), d: y * T + 14 };
  }

  place(an) {
    const q = this.pos(an, an.spots[an.spot]);
    an.s.setPosition(q.x, q.y).setDepth(q.d).setAlpha(1).setFlipX(Math.random() < 0.5);
    an.tile = an.spots[an.spot];
    if (an.cast.react === 'ripple') an.s.setVisible(false);
    else an.s.play(`life-${an.sheet}-idle`, true);
    if (an.cast.react === 'watch') an.s.anims.stop();
  }

  awake(an) {
    const tod = this.scene.tod;
    return an.cast.when === 'any' || tod === 'dusk' || an.cast.when === (tod === 'day' ? 'day' : 'night');
  }

  tick() {
    const sc = this.scene, pl = sc.player, v = sc.cameras.main.worldView, now = sc.time.now;
    if (!pl) return;
    const px = pl.sprite.x / T - 0.5, py = pl.sprite.y / T - 1;
    for (const an of this.list) {
      const [tx, ty] = an.tile, inView = tx * T > v.x - 48 && tx * T < v.right + 48 && ty * T > v.y - 48 && ty * T < v.bottom + 64;
      if (!this.awake(an)) { if (an.s.visible) an.s.setVisible(false); an.mode = 'idle'; continue; }
      if (an.mode === 'hidden') {
        // back at another spot, later, where the player is not looking
        if (now > an.until) { an.spot = (an.spot + 1 + Math.floor(Math.random() * (an.spots.length - 1 || 1))) % an.spots.length; const [nx, ny] = an.spots[an.spot]; if (Math.hypot(nx - px, ny - py) > 6) { an.mode = 'idle'; this.place(an); an.s.setVisible(true).setAlpha(0); sc.tweens.add({ targets: an.s, alpha: 1, duration: 600 }); } }
        continue;
      }
      if (!inView) { if (an.s.visible && an.mode === 'idle') an.s.setVisible(false); continue; }
      if (an.mode !== 'idle') continue;
      const d = Math.hypot(tx - px, ty - py);
      const kind = an.cast.react;
      if (kind === 'ripple') { if (now > an.until) this.ripple(an); continue; }
      if (!an.s.visible) an.s.setVisible(true);
      if (kind === 'watch') this.watch(an, px, py, d, now);
      else if (kind === 'sleep') this.sleep(an, d, tx === pl.tx && ty === pl.ty);
      else if (d <= an.cast.r) this[kind](an, px, py);
    }
  }

  // the animal nearest a world point (for a double tap), within r pixels, if it can be seen
  at(wx, wy, r = 12) {
    let best = null, bd = r;
    for (const an of this.list) {
      if (!an.s.visible || an.s.alpha < 0.5 || an.cast.react === 'ripple') continue;
      const d = Math.hypot(an.s.x - wx, an.s.y - 6 - wy);
      if (d < bd) { bd = d; best = an; }
    }
    return best;
  }
  near(tx, ty, r = 2.5) { return this.list.find((an) => an.s.visible && an.cast.react !== 'ripple' && Math.hypot(an.s.x / T - 0.5 - tx, an.s.y / T - 1 - ty) <= r) || null; }
  musingKind(an) { return an.kind; }

  // runs to the nearest cover away from the player, and is gone for a while
  flee(an, px, py) {
    const [tx, ty] = an.tile, c = this.c;
    let best = null, bs = -1e9;
    for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) {
      const x = tx + i, y = ty + j;
      if (!c.inMap(x, y) || !(c.building(x, y) || 'Tb'.includes(c.ter(x, y)))) continue;
      const s = Math.hypot(x - px, y - py) * 1.2 - Math.hypot(i, j);
      if (s > bs) { bs = s; best = [x, y]; }
    }
    const to = best ? [best[0] * T + 8, best[1] * T + 14] : [an.s.x + (an.s.x > px * T ? 60 : -60), an.s.y];
    an.mode = 'moving';
    an.s.setFlipX(to[0] < an.s.x).play(`life-${an.sheet}-move`, true);
    const ms = Math.max(350, Math.hypot(to[0] - an.s.x, to[1] - an.s.y) * 7);
    this.scene.tweens.add({ targets: an.s, x: to[0], y: to[1], duration: ms, ease: 'Sine.easeIn', onUpdate: () => an.s.setDepth(an.s.y), onComplete: () => this.hide(an) });
    this.scene.tweens.add({ targets: an.s, alpha: 0, delay: ms * 0.6, duration: ms * 0.4 });
  }

  // takes off and lands at another spot
  fly(an) {
    an.mode = 'moving';
    sfx.flutter?.();
    an.spot = (an.spot + 1 + Math.floor(Math.random() * Math.max(1, an.spots.length - 1))) % an.spots.length;
    const q = this.pos(an, an.spots[an.spot]), s = an.s, x0 = s.x, y0 = s.y, peak = Math.min(y0, q.y) - 50;
    s.setFlipX(q.x < x0).play(`life-${an.sheet}-move`, true).setDepth(9500);
    this.scene.tweens.addCounter({ from: 0, to: 1, duration: 1400 + Math.hypot(q.x - x0, q.y - y0) * 3, onUpdate: (tw) => {
      const t = tw.getValue(); s.setPosition(x0 + (q.x - x0) * t, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * peak + t * t * q.y);
    }, onComplete: () => { an.mode = 'idle'; an.tile = an.spots[an.spot]; s.setDepth(q.d).play(`life-${an.sheet}-idle`, true); } });
  }

  // jumps into the nearest water with a splash
  jump(an) {
    const [tx, ty] = an.tile, c = this.c;
    const w = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [tx + dx, ty + dy]).find(([x, y]) => c.ter(x, y) === '~');
    if (!w) return this.flee(an, tx, ty + 1);
    an.mode = 'moving';
    const s = an.s, x0 = s.x, y0 = s.y, x1 = w[0] * T + 8, y1 = w[1] * T + 12;
    s.setFrame(2).anims.stop(); s.setFlipX(x1 < x0);
    this.scene.tweens.addCounter({ from: 0, to: 1, duration: 420, onUpdate: (tw) => { const t = tw.getValue(); s.setPosition(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 10); }, onComplete: () => {
      sfx.plop?.();
      this.rings(x1, y1);
      this.hide(an);
    } });
  }

  rings(x, y) {
    const r = this.scene.add.sprite(x, y + 4, 'life-fish', 0).setOrigin(0.5, 1).setDepth(2.8);
    r.play({ key: 'life-fish-move', frameRate: 5, repeat: 0 });
    this.scene.tweens.add({ targets: r, alpha: 0, delay: 300, duration: 500, onComplete: () => r.destroy() });
  }

  ripple(an) {
    an.until = this.scene.time.now + rnd(3500, 9000);
    an.spot = Math.floor(Math.random() * an.spots.length); an.tile = an.spots[an.spot];
    const q = this.pos(an, an.tile);
    an.s.setPosition(q.x + rnd(-4, 4), q.y).setDepth(2.8).setVisible(true).setAlpha(0.9).setFrame(0);
    an.s.play({ key: 'life-fish-move', frameRate: 4, repeat: 0 });
    this.scene.tweens.add({ targets: an.s, alpha: 0, delay: 500, duration: 700 });
  }

  // a sleeping dog lifts its head and wags while the player is near; it shuffles aside if stepped on
  sleep(an, d, under) {
    if (under) { an.spot = (an.spot + 1) % an.spots.length; this.place(an); return; }
    const want = d <= an.cast.r ? 'move' : 'idle';
    if (an.s.anims.currentAnim?.key !== `life-${an.sheet}-${want}`) an.s.play({ key: `life-${an.sheet}-${want}`, frameRate: want === 'move' ? 4 : 1.2 });
  }

  // the owl turns its head toward the player, blinks now and then, and leaves if one comes too close
  watch(an, px, py, d, now) {
    if (d <= an.cast.r) { an.mode = 'moving'; this.scene.tweens.add({ targets: an.s, alpha: 0, y: an.s.y - 12, duration: 500, onComplete: () => this.hide(an) }); return; }
    if (now > (an.blink || 0)) { an.blink = now + rnd(2500, 6000); an.s.setFrame(3); return; }
    an.s.setFrame(d > 7 ? 0 : px < an.tile[0] - 0.5 ? 1 : px > an.tile[0] + 0.5 ? 2 : 0);
  }

  hide(an) { an.mode = 'hidden'; an.until = this.scene.time.now + rnd(14000, 30000); an.s.setVisible(false).setAlpha(1); an.s.anims.stop(); }

  destroy() { this.event?.remove(false); }
}
