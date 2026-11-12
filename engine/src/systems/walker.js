// Grid movement for the player and the townsfolk.
export const DIRS = {
  up: { dx: 0, dy: -1, frame: 3, anim: 'walk-up', flip: false },
  down: { dx: 0, dy: 1, frame: 0, anim: 'walk-down', flip: false },
  left: { dx: -1, dy: 0, frame: 6, anim: 'walk-side', flip: false },
  right: { dx: 1, dy: 0, frame: 6, anim: 'walk-side', flip: true },
};

export class Walker {
  constructor(scene, key, tx, ty, dir = 'down', T = 16) {
    this.scene = scene;
    this.key = key;
    this.T = T;
    this.tx = tx;
    this.ty = ty;
    this.dir = dir;
    this.moving = false;
    this.shadow = scene.add.image(0, 0, 'shadow-s').setOrigin(0.5, 0.5);
    this.sprite = scene.add.sprite(0, 0, key, DIRS[dir].frame).setOrigin(0.5, 1);
    this.place();
  }

  place() {
    const x = this.tx * this.T + this.T / 2, y = this.ty * this.T + this.T;
    this.sprite.setPosition(x, y - 1);
    this.syncShadow();
    this.face(this.dir);
  }

  syncShadow() {
    this.shadow.setPosition(this.sprite.x, this.sprite.y - 1);
    this.sprite.setDepth(this.sprite.y);
    this.shadow.setDepth(3);
  }

  get gone() { return !this.sprite.scene; } // the scene shut down under a running cutscene

  face(dir) {
    this.dir = dir;
    if (this.gone) return;
    if (!this.moving) {
      this.sprite.anims.stop();
      this.sprite.setFrame(DIRS[dir].frame);
    }
    this.sprite.setFlipX(DIRS[dir].flip);
  }

  // Try to step; canEnter(tx, ty) returns true, false, or a string for special tiles
  step(dir, canEnter, speed = 150, onDone = null) {
    if (this.gone) return false; // a cutscene awaiting this step simply stops here
    if (this.moving) return false;
    this.face(dir);
    const d = DIRS[dir];
    const nx = this.tx + d.dx, ny = this.ty + d.dy;
    const res = canEnter(nx, ny);
    if (res !== true) return res;
    this.moving = true;
    this.sprite.anims.play(`${this.key}-${d.anim}`, true);
    this.sprite.anims.timeScale = 150 / speed;
    this.scene.tweens.add({
      targets: this.sprite,
      x: nx * this.T + this.T / 2,
      y: ny * this.T + this.T - 1,
      duration: speed,
      onUpdate: () => this.syncShadow(),
      onComplete: () => {
        this.tx = nx;
        this.ty = ny;
        this.moving = false;
        this.syncShadow();
        if (onDone) onDone(nx, ny);
      },
    });
    return true;
  }

  stopAnim() {
    if (!this.moving && !this.gone) {
      this.sprite.anims.stop();
      this.sprite.setFrame(DIRS[this.dir].frame);
    }
  }

  facing() {
    const d = DIRS[this.dir];
    return [this.tx + d.dx, this.ty + d.dy];
  }

  faceToward(tx, ty) {
    const dx = tx - this.tx, dy = ty - this.ty;
    if (Math.abs(dx) > Math.abs(dy)) this.face(dx > 0 ? 'right' : 'left');
    else this.face(dy > 0 ? 'down' : 'up');
  }
}
