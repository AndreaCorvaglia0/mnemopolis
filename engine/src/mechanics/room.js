// Ambient life in a room (the Interior scene): thinking aloud about furniture and walls, a small
// locked door on some back walls (a key object, opened one day by a key), a painting that can be
// looked at in large, a cat asleep on an armchair in someone's home. Nothing of this opens inside a
// lab or a reading page: those pause the game.
//   this.life = attachRoomLife(this)    in Interior.create(); then update(), prompt(), use() as in town
import { state, save } from '../systems/state.js';
import { sfx } from '../systems/audio.js';
import { makeCanvas, rect, addTex } from '../art/px.js';
import { LIFE, LANG, tr, fill, WORDS, ensureState, say, thinkAbout, discover, foundText, isFound, deck } from './life.js';
import { lifePlan } from './active.js';
import { lifeTextures } from './textures.js';
import { roomThingAt } from './musings/things.js';
import { OBSTACLES, REWARDS, canPass } from './obstacles/kinds.js';
import { paintingCanvas, openPainting } from './secrets/paintings.js';
import { TOWN } from '../world/townMap.js';

const T = 16, GROUND = new Set(['floor', 'rug']);

export function attachRoomLife(scene) {
  if (!LIFE.on) return null;
  ensureState();
  lifeTextures(scene);
  const life = new RoomLife(scene, lifePlan());
  scene.events.once('shutdown', () => life.destroy());
  return life;
}

class RoomLife {
  constructor(scene, plan) {
    Object.assign(this, { scene, plan, ui: scene.ui, id: scene.id, L: scene.room.layout || null });
    const sc = scene, id = this.id;
    this.closets = LIFE.obstacles ? plan.closets.filter((o) => o.place === id && this.L) : [];
    this.paintings = LIFE.secrets ? plan.secrets.filter((s) => s.kind === 'painting' && s.place === id && this.L) : [];
    this.doors = this.closets.map((o) => {
      const open = !!state.opened[o.id];
      const img = sc.add.image(o.x * T + 1, o.top * T + 23, `life-ob-closet${open ? '-open' : ''}`).setOrigin(0).setDepth(1);
      const mark = sc.add.image(o.x * T + 8, o.top * T + 21, 'life-mark-key').setOrigin(0.5, 1).setDepth(6000).setAlpha(0);
      return { o, img, mark, sealed: plan.secrets.find((s) => s.kind === 'sealed' && s.ob === o.id) };
    });
    // a painting hung where the room had none to look at
    for (const p of this.paintings.filter((s) => s.hung)) {
      const key = `life-hung-${p.painting}`;
      if (!sc.textures.exists(key)) {
        const [c, ctx] = makeCanvas(14, 12), src = paintingCanvas(p.painting, TOWN);
        rect(ctx, 0, 0, 14, 12, '#1b1a2b'); rect(ctx, 1, 1, 12, 10, '#c9a24a'); ctx.imageSmoothingEnabled = false; ctx.drawImage(src, 0, 0, 64, 48, 2, 2, 10, 8);
        addTex(sc, key, c);
      }
      sc.add.image(p.x * T + 1, p.top * T + 8, key).setOrigin(0).setDepth(1);
    }
    // a cat asleep on an armchair (homes only, one per town)
    const cat = LIFE.animals && plan.animals.inside.find((a) => a.place === id);
    if (cat && this.L) {
      this.sleepcat = { x: cat.x, y: cat.y };
      sc.add.sprite(cat.x * T + 8, cat.y * T + 9, 'life-sleepcat', 0).setOrigin(0.5, 1).setDepth((cat.y + 1) * T + 1).play({ key: 'life-sleepcat-idle', frameRate: 0.8 });
    }
    const kb = sc.input.keyboard;
    if (LIFE.musings) { kb.on('keydown-T', () => this.thinkAhead()); sc.nav.onDouble = (tx, ty) => this.doubleTap(tx, ty); }
    if (LIFE.secrets) kb.on('keydown-J', () => { if (this.idle) this.ui.showAtlas('mysteries'); });
  }

  get idle() { return !this.ui.busy && !this.scene.leaving && this.scene.sys.isActive(); }
  extra() { const r = this.scene.room; return { master: [this.scene.master.tx, this.scene.master.ty], exit: r.exit, lab: r.lab, exhibit: r.exhibit, closets: this.closets, paintings: this.paintings }; }
  thing(tx, ty) {
    if (this.sleepcat && this.sleepcat.x === tx && this.sleepcat.y === ty) return { kind: 'sleepcat' };
    return roomThingAt(this.L, tx, ty, this.extra());
  }

  think(tx, ty) {
    if (!LIFE.musings || !this.idle) return false;
    const th = this.thing(tx, ty);
    if (!th) return false;
    if (th.painting) { this.look(th.painting); return true; }
    if (th.obstacle) { thinkAbout(this.scene, null, { lines: tr(OBSTACLES.closet.lines) }); return true; }
    thinkAbout(this.scene, th.kind, { inside: this.id });
    return true;
  }
  async look(p) {
    const ui = this.ui;
    if (!isFound(p)) { discover(this.scene, p, null); }
    sfx.page();
    await ui.page(() => openPainting(p.painting, TOWN, this.markFor()));
    say(this.scene, foundText(p));
  }
  // the old map of the town marks an undiscovered secret with a cross
  markFor() { const s = this.plan.secrets.find((x) => (x.kind === 'hollow' || x.kind === 'bottle' || x.kind === 'stone') && !isFound(x)); return s ? [s.x, s.y] : null; }

  thinkAhead() {
    if (!this.idle) return;
    const p = this.scene.player, [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir];
    let x = p.tx + dx, y = p.ty + dy;
    for (let k = 1; k <= 3; k++) { const th = this.thing(p.tx + dx * k, p.ty + dy * k); if (th && !GROUND.has(th.kind)) { x = p.tx + dx * k; y = p.ty + dy * k; break; } }
    this.think(x, y);
  }
  doubleTap(tx, ty) {
    if (!this.idle) return false;
    const p = this.scene.player;
    if (Math.max(Math.abs(tx - p.tx), Math.abs(ty - p.ty)) > 3) return false;
    const th = this.thing(tx, ty);
    if (!th || th.point || GROUND.has(th.kind)) return false;
    this.scene.time.delayedCall(0, () => p.faceToward(tx, ty));
    return this.think(tx, ty);
  }

  door(fx, fy) { return this.doors.find((d) => d.o.x === fx && d.o.y === fy && !state.opened[d.o.id]) || null; }
  prompt(fx, fy) { return this.door(fx, fy) ? fill(tr(WORDS.try), { thing: tr(OBSTACLES.closet.name) }) : null; }
  use(fx, fy) {
    const d = this.door(fx, fy);
    if (!d) return false;
    if (!canPass(d.o, state)) { sfx.bump(); say(this.scene, deck.draw(`try:closet:${LANG}`, tr(OBSTACLES.closet.say))); return true; }
    state.opened[d.o.id] = true; save();
    sfx.creak?.();
    d.img.setTexture('life-ob-closet-open'); d.mark.setAlpha(0);
    say(this.scene, tr(OBSTACLES.closet.opened));
    if (d.sealed) this.scene.time.delayedCall(1800, () => discover(this.scene, d.sealed, REWARDS[d.o.prize] ? `${tr(REWARDS[d.o.prize].title)}. ${tr(REWARDS[d.o.prize].text)}` : null));
    return true;
  }

  update() {
    const th = this.ui.__thought;
    if (th?.visible && th.world === this.scene) th.follow();
    const p = this.scene.player;
    for (const d of this.doors) { const want = !state.opened[d.o.id] && Math.abs(d.o.x - p.tx) + Math.abs(d.o.y + 1 - p.ty) <= 2 && !this.ui.busy ? 1 : 0; d.mark.setAlpha(d.mark.alpha + (want - d.mark.alpha) * 0.15); }
  }
  destroy() { this.ui.__thought?.hide(true); }
}
