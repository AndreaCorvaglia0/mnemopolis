// Tap (or click) to walk. The player walks the shortest path to the tapped tile. Tapping something
// that blocks the way (a person, a sign, a machine, a plaque) walks next to it, turns to it and
// uses it, as Space would. Tapping a door walks through it. Arrow keys cancel the walk.
//
// A scene uses it in three places:
//   this.nav = new TapNav(this, { w, h, redirect })       in create()
//   const dir = keyDir || this.nav.next()                 where it reads the arrow keys
//   if (JustDown(SPACE) || ... || this.nav.act()) ...     where it reads the action key
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const T = 16, DOUBLE = 380;

export class TapNav {
  // w, h: size of the walkable grid in tiles. redirect(x, y): optional, returns another tile to aim
  // for (the town sends a tap on a building to its door).
  constructor(scene, { w, h, redirect = null }) {
    Object.assign(this, { scene, w, h, redirect, path: [], target: null, pending: false });
    // onDouble(tx, ty, worldPoint): optional, set by the ambient-life layer. A second tap on the same
    // spot within DOUBLE ms is offered to it first; if it takes it (returns true), the walk the first
    // tap started stops. A single tap is never delayed.
    this.onDouble = null; this.last = null;
    this.marker = scene.add.graphics().setDepth(8999).setVisible(false);
    scene.input.on('pointerup', (p) => this.tap(p));
    scene.events.once('shutdown', () => { this.path = []; this.pending = false; });
  }

  get walking() { return this.path.length > 0; }

  cancel() { this.path = []; this.pending = false; this.marker.setVisible(false); }

  tap(p) {
    const sc = this.scene, ui = sc.ui;
    if (!ui || ui.busy || sc.locked || sc.leaving) return;
    if (p.getDistance() > 12) return; // a drag, not a tap
    if (ui.input.hitTestPointer(p).length) return; // a button of the interface
    const wp = sc.cameras.main.getWorldPoint(p.x, p.y);
    let tx = Math.floor(wp.x / T), ty = Math.floor(wp.y / T);
    const now = sc.time.now, l = this.last;
    this.last = { t: now, x: tx, y: ty };
    if (this.onDouble && l && now - l.t < DOUBLE && Math.abs(l.x - tx) <= 1 && Math.abs(l.y - ty) <= 1 && this.onDouble(tx, ty, { x: wp.x, y: wp.y })) { this.cancel(); this.last = null; return; }
    if (this.redirect) [tx, ty] = this.redirect(tx, ty) || [tx, ty];
    this.plan(tx, ty);
  }

  plan(tx, ty) {
    const sc = this.scene, pl = sc.player, can = sc.canEnter;
    this.cancel();
    if (tx === pl.tx && ty === pl.ty) return;
    const there = can(tx, ty);
    const ok = (x, y) => can(x, y) === true;
    // goals: the tile itself if one can stand or step there, otherwise any free tile next to it
    let goals;
    if (there === true || (there && typeof there === 'object')) goals = new Set([`${tx},${ty}`]);
    else {
      goals = new Set(Object.values(DIRS).map(([dx, dy]) => [tx + dx, ty + dy]).filter(([x, y]) => (x === pl.tx && y === pl.ty) || ok(x, y)).map(([x, y]) => `${x},${y}`));
      if (!goals.size) return;
    }
    const startK = `${pl.tx},${pl.ty}`, prev = new Map([[startK, null]]), q = [[pl.tx, pl.ty]];
    let end = goals.has(startK) ? startK : null;
    for (let i = 0; i < q.length && !end && i < 8000; i++) {
      const [x, y] = q[i];
      for (const [d, [dx, dy]] of Object.entries(DIRS)) {
        const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
        if (prev.has(k) || nx < -1 || ny < -1 || nx > this.w || ny > this.h) continue;
        const isGoal = goals.has(k);
        if (!ok(nx, ny) && !(isGoal && there && typeof there === 'object')) continue;
        prev.set(k, [`${x},${y}`, d]);
        if (isGoal) { end = k; break; }
        q.push([nx, ny]);
      }
    }
    if (!end) { this.flash(tx, ty, 0xff7a6b); return; }
    const path = [];
    for (let k = end; prev.get(k); k = prev.get(k)[0]) path.unshift(prev.get(k)[1]);
    this.path = path;
    this.target = [tx, ty];
    this.pending = there !== true && !(there && typeof there === 'object'); // something to use on arrival
    this.flash(tx, ty, 0x4fd1c5);
    if (!path.length && this.pending) pl.faceToward(tx, ty);
  }

  // the next step, or null; when the walk ends next to something, turn to it
  next() {
    if (!this.path.length) return null;
    const d = this.path.shift();
    if (!this.path.length) {
      this.marker.setVisible(false);
      if (this.pending) this.scene.time.delayedCall(0, () => this.scene.player.faceToward(...this.target));
    }
    return d;
  }

  // true once, when the walk has ended in front of the tapped thing (or the prompt was tapped)
  act() {
    const ui = this.scene.ui;
    if (ui?.actRequest) { ui.actRequest = false; return true; }
    if (!this.pending || this.path.length || this.scene.player.moving) return false;
    const [fx, fy] = this.scene.player.facing();
    if (fx !== this.target[0] || fy !== this.target[1]) { this.scene.player.faceToward(...this.target); return false; }
    this.pending = false;
    return true;
  }

  // a step failed (someone walked into the way): give up quietly
  blocked() { this.cancel(); }

  flash(tx, ty, col) {
    const g = this.marker;
    g.clear().setVisible(true).setAlpha(1).lineStyle(2, col, 0.9).strokeRoundedRect(tx * T + 1, ty * T + 1, T - 2, T - 2, 4);
    this.scene.tweens.add({ targets: g, alpha: 0.25, duration: 500, yoyo: true, repeat: 1, onComplete: () => g.setVisible(false) });
  }
}
