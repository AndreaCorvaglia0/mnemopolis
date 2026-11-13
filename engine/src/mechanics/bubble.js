// The thought bubble: the player thinking aloud. Drawn in the interface scene (sharp text at any
// zoom), above the player's head. It never pauses the game, needs no key, fades by itself after 2 to
// 4 seconds, never stacks (a new one replaces the old) and keeps clear of the corners of the HUD.
// It looks nothing like the dialogue box: a pale cloud with the small circles of a thought, dark
// text, no name, no arrow.
const INK = 0x1b1a2b, PAPER = 0xf6f1e3, SHADE = 0xd9d0bb;

export class Thought {
  constructor(ui) { this.ui = ui; this.c = null; this.world = null; }

  // scene: the world scene (for the camera); text: the thought
  show(scene, text, { hold } = {}) {
    const ui = this.ui;
    this.hide(true);
    if (!ui?.sys?.isActive() || ui.modals > 0) return;
    const P = ui.portrait, size = P ? 24 : 19, maxW = Math.min(P ? ui.frame().w - 70 : 400, 420);
    const t = ui.text(0, 0, text, size, '#2d2a40', { wordWrap: { width: maxW }, align: 'center', lineSpacing: 4 }).setOrigin(0.5);
    const w = Math.ceil(t.width) + 34, h = Math.ceil(t.height) + 24;
    const g = ui.add.graphics();
    // the cloud: a rounded body with soft bumps, outlined in ink
    const bumps = [];
    for (let x = 14; x < w - 10; x += 22) bumps.push([x, 2, 11], [x + 11, h - 2, 10]);
    const draw = (col, grow) => {
      g.fillStyle(col, 1).fillRoundedRect(-w / 2 - grow, -h / 2 - grow, w + 2 * grow, h + 2 * grow, 16 + grow);
      for (const [x, y, r] of bumps) g.fillCircle(-w / 2 + x, -h / 2 + y, r + grow);
    };
    draw(INK, 3); draw(PAPER, 0);
    g.fillStyle(SHADE, 1).fillRoundedRect(-w / 2 + 6, h / 2 - 6, w - 12, 3, 2);
    // the trail of small circles toward the head
    const trail = ui.add.graphics();
    [[0, 9, 6], [-8, 24, 4], [-13, 35, 2.5]].forEach(([x, y, r]) => { trail.fillStyle(INK, 1).fillCircle(x, y, r + 2.5); trail.fillStyle(PAPER, 1).fillCircle(x, y, r); });
    this.c = ui.add.container(0, 0, [g, t]).setDepth(9).setAlpha(0);
    this.trail = trail.setDepth(9).setAlpha(0);
    this.size = { w: w + 8, h: h + 8 };
    this.world = scene;
    this.follow();
    ui.tweens.add({ targets: [this.c, this.trail], alpha: 1, duration: 140 });
    const ms = hold ?? Math.max(2000, Math.min(4200, 1500 + text.length * 45));
    const c = this.c, tr = this.trail;
    this.timer = ui.time.delayedCall(ms, () => ui.tweens.add({ targets: [c, tr], alpha: 0, duration: 420, onComplete: () => { if (this.c === c) this.hide(true); else { c.destroy(); tr.destroy(); } } }));
  }

  get visible() { return !!this.c; }

  // keep it above the player's head; below it when the head is near the top or a HUD corner
  follow() {
    const ui = this.ui, s = this.world;
    if (!this.c || !s?.player || !s.sys.isActive()) return this.hide(true);
    if (ui.modals > 0) return this.hide(true);
    const cam = s.cameras.main, sp = s.player.sprite, v = ui.view, cx = (v.x0 + v.x1) / 2, cy = (v.y0 + v.y1) / 2;
    const hx = cx + ((sp.x - cam.worldView.x) * cam.zoom - ui.scale.width / 2) / ui.k;
    const hy = cy + ((sp.y - 24 - cam.worldView.y) * cam.zoom - ui.scale.height / 2) / ui.k;
    const feet = cy + ((sp.y - cam.worldView.y) * cam.zoom - ui.scale.height / 2) / ui.k;
    const { w, h } = this.size, safe = ui.hudSafe ? ui.hudSafe() : [];
    let x = Math.max(v.x0 + w / 2 + 8, Math.min(v.x1 - w / 2 - 8, hx + 18)), y = hy - 44 - h / 2, below = false;
    const hits = (yy) => safe.some((b, i) => { const x0 = i === 0 ? v.x0 : v.x1 - b.w, x1 = i === 0 ? v.x0 + b.w : v.x1; return x + w / 2 > x0 && x - w / 2 < x1 && yy - h / 2 < v.y0 + b.h; });
    if (y - h / 2 < v.y0 + 6 || hits(y)) { y = feet + 30 + h / 2; below = true; }
    this.c.setPosition(Math.round(x), Math.round(y));
    this.trail.setPosition(Math.round(hx + 10), Math.round(below ? feet + 34 : hy - 44)).setScale(1, below ? -1 : 1);
  }

  hide(now = false) {
    this.timer?.remove(false);
    if (this.c) { this.c.destroy(); this.trail.destroy(); }
    this.c = null; this.trail = null;
  }
}
