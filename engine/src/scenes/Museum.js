import { w } from '../data/words.js';
import Phaser from 'phaser';
import { sfx, setMusic, setFire, setSea } from '../systems/audio.js';
import { Walker } from '../systems/walker.js';
import { TapNav } from '../systems/tapnav.js';
import { townZoom } from '../systems/view.js';
import { makeCanvas, rect, px, hash, addTex } from '../art/px.js';
import { drawText, textWidth } from '../art/buildings.js';
import { FireLight, bracket } from '../art/fire.js';
import { PLACE, MASTERS } from '../data/content.js';
import { houseDuel, challengeLabel, houseQuestions } from '../mechanics/duel/index.js';
import { ownerTalk } from '../mechanics/experience/owner.js';
import { state, save } from '../systems/state.js';

// The main corridor of the castle: walk east and you walk forward in time.
// A museum is the room of a STORY IN TIME: one plaque per event, oldest on the left.
const T = 16, H = 9, X0 = 4, STEP = 2;
const slotX = (i) => X0 + i * STEP;

function paint(MILESTONES, KIND, W) {
  const [c, ctx] = makeCanvas(W * T, H * T);
  // back wall of stone blocks
  rect(ctx, 0, 0, W * T, 48, '#4a4652');
  for (let y = 0; y < 48; y += 8) { rect(ctx, 0, y, W * T, 1, '#3a3641'); for (let x = (y / 8 % 2) * 8; x < W * T; x += 16) rect(ctx, x, y, 1, 8, '#3a3641'); }
  rect(ctx, 0, 0, W * T, 3, '#2b2833'); rect(ctx, 0, 45, W * T, 3, '#2b2833');
  // flagstone floor and a long carpet
  for (let y = 48; y < 128; y++) for (let x = 0; x < W * T; x++) {
    const cx = Math.floor(x / 16), cy = Math.floor(y / 16);
    px(ctx, x, y, x % 16 === 0 || y % 16 === 0 ? '#4f4a57' : hash(cx, cy, 3) > 0.5 ? '#6b6672' : '#625d69');
  }
  for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgba(10,8,14,${0.3 - k * 0.05})`; ctx.fillRect(0, 48 + k, W * T, 1); }
  rect(ctx, 24, 82, W * T - 48, 28, '#7a2a2a'); rect(ctx, 24, 82, W * T - 48, 2, '#c99a3b'); rect(ctx, 24, 108, W * T - 48, 2, '#c99a3b');
  for (let x = 40; x < W * T - 40; x += 32) { rect(ctx, x, 94, 4, 4, '#c99a3b'); px(ctx, x + 1, 95, '#7a2a2a'); px(ctx, x + 2, 96, '#7a2a2a'); }
  // front wall with the way out
  rect(ctx, 0, 128, W * T, 16, '#2b2833'); rect(ctx, 0, 128, W * T, 2, '#17151c');
  rect(ctx, 2 * T, 129, 16, 15, '#3a3f6b'); rect(ctx, 2 * T + 1, 130, 14, 13, '#c9563f');
  for (let y = 132; y < 142; y += 3) rect(ctx, 2 * T + 3, y, 10, 1, '#e7a34f');
  // exhibits and the arches to the wings
  MILESTONES.forEach((m, i) => {
    const x = slotX(i) * T;
    const col = (KIND[m.kind] || ['', '#ffcf5a'])[1];
    rect(ctx, x, 9, 16, 22, '#17151c'); rect(ctx, x + 1, 10, 14, 20, '#8a6a3a'); rect(ctx, x + 2, 11, 12, 18, '#1d1712');
    rect(ctx, x + 3, 12, 10, 3, col); for (let k = 0; k < 4; k++) rect(ctx, x + 3, 17 + k * 3, 6 + Math.floor(hash(i, k, 8) * 5), 1, '#b8a988');
    rect(ctx, x, 34, 16, 7, '#17151c'); drawText(ctx, String(m.year), x + 1, 35, '#ffcf5a');
  });
  return c;
}

export class Museum extends Phaser.Scene {
  constructor() { super('Museum'); }

  create({ id }) {
    this.id = id;
    this.ui = this.scene.get('UI');
    this.leaving = false;
    const place = PLACE[id], MILESTONES = place.timeline || [];
    this.place = place; this.list = MILESTONES;
    const W = Math.max(14, X0 + MILESTONES.length * STEP + 3);
    this.W = W;
    const key = `museum-${id}`;
    if (!this.textures.exists(key)) addTex(this, key, paint(MILESTONES, place.kinds || {}, W));
    this.add.image(0, 0, key).setOrigin(0).setDepth(0);
    this.slots = new Map(MILESTONES.map((m, i) => [slotX(i), m]));
    this.guide = new Walker(this, `ch-${MASTERS[id].look}`, 4, 6, 'down');
    this.player = new Walker(this, 'ch-player', 2, 7, 'up');
    if (!state.visited[id]) { state.visited[id] = true; save(); }
    // a torch in every second gap between exhibits
    const torches = [];
    for (let i = 0; i < this.list.length - 1; i += 2) torches.push([slotX(i) * T + 24, 26]);
    torches.unshift([2 * T + 8, 26]);
    const g = this.add.graphics().setDepth(1);
    torches.forEach(([x, y]) => { g.fillStyle(0x2a2018, 1).fillRect(x - 1, y, 3, 7).fillStyle(0x5a4a36, 1).fillRect(x - 2, y - 1, 5, 2); });
    this.fire = new FireLight(this, W * T, H * T, torches, this.player.sprite, { radius: 46 });

    const cam = this.cameras.main;
    cam.setBackgroundColor('#0b0806'); cam.setRoundPixels(true);
    this.nav = new TapNav(this, { w: this.W, h: 9 });
    this.layout();
    cam.startFollow(this.player.sprite, true, 0.15, 0.15);
    this.scale.on('resize', this.layout, this);
    const dropFx = () => cam.postFX.clear();
    if (!this.registry.get('lite')) { cam.postFX.addVignette(0.5, 0.5, 0.9, 0.45); cam.postFX.addBloom(0xffffff, 1, 1, 1, 0.35, 4); }
    this.game.events.on('lite', dropFx);
    this.events.once('shutdown', () => { this.scale.off('resize', this.layout, this); this.game.events.off('lite', dropFx); });
    cam.fadeIn(300);
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT,SPACE,ENTER,E');
    this.input.keyboard.on('keydown-TAB', (e) => { e.preventDefault?.(); if (!this.ui.busy) this.ui.showAtlas(); });
    this.ui.setLocation(place.name, 'room');
    setMusic('castle'); setFire(1); setSea(0);
  }

  layout() {
    const Ws = this.scale.width, Hs = this.scale.height, cam = this.cameras.main, W = this.W;
    // the corridor scrolls sideways, so the zoom follows the same rule as the town
    const z = Math.max(1, Math.min(townZoom(Ws, Hs), Math.floor(Hs / (H * T + 30))));
    cam.setSize(Ws, Hs); cam.setZoom(z);
    const vh = Hs / z;
    cam.setBounds(0, -(vh - H * T) / 2, W * T, vh);
  }

  canEnter = (x, y) => {
    if (x === 2 && y === 8) return { exit: true };
    const m = this.slots.get(x);
    if (x < 0 || x >= this.W || y <= 2 || y >= 8) return false;
    if (this.guide.tx === x && this.guide.ty === y) return false;
    return true;
  };

  update(time) {
    this.fire.update(time);
    const k = this.keys;
    if (this.ui.busy || this.leaving || this.player.moving) {
      Phaser.Input.Keyboard.JustDown(k.SPACE); Phaser.Input.Keyboard.JustDown(k.ENTER); Phaser.Input.Keyboard.JustDown(k.E);
      return;
    }
    const [fx, fy] = this.player.facing(), m = fy === 2 ? this.slots.get(fx) : null, guide = this.guide.tx === fx && this.guide.ty === fy;
    this.ui.setPrompt(guide ? `Space  ${w('town.talkTo', { name: MASTERS[this.id].name })}` : m ? `Space  ${m.year}: ${m.title}` : null);
    if (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER) || Phaser.Input.Keyboard.JustDown(k.E) || this.nav.act()) {
      if (guide) return this.talk();
      if (m) return this.ui.plaque(this.list, this.list.indexOf(m), this.place.kinds);
      return;
    }
    const key = k.LEFT.isDown || k.A.isDown ? 'left' : k.RIGHT.isDown || k.D.isDown ? 'right' : k.UP.isDown || k.W.isDown ? 'up' : k.DOWN.isDown || k.S.isDown ? 'down' : null;
    if (key) this.nav.cancel();
    const tapped = !key && this.nav.walking, dir = key || this.nav.next();
    if (!dir) { this.player.stopAnim(); return; }
    const res = this.player.step(dir, this.canEnter, k.SHIFT.isDown || tapped ? 95 : 150, () => sfx.step('stone'));
    if (res && res.exit) this.go('Town', { from: this.id }, sfx.gate);
  }

  go(scene, data, sound) {
    this.leaving = true; sound();
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene, data));
  }

  async talk() {
    const m = MASTERS[this.id], ui = this.ui, kinds = Object.values(this.place.kinds || {});
    this.guide.faceToward(this.player.tx, this.player.ty);
    sfx.select();
    const bye = { label: w('town.thanks') };
    const o = await ownerTalk(ui, this.id, m.name, m.hi);
    await ui.converse(m.name, {
      root: { say: o.say, options: [...o.options, kinds.length ? { label: w('room.colours'), to: 'col' } : null, { label: w('room.firstPlaque'), do: async () => { await ui.plaque(this.list, 0, this.place.kinds); return 'end'; } }, houseQuestions(this.id).length >= 2 ? { label: challengeLabel(this.id), do: async () => { await houseDuel(ui, this.id); return 'end'; } } : null, bye].filter(Boolean) },
      col: { say: w('room.coloursAre', { list: kinds.map((k) => k[0]).join(', ') }), options: [bye] },
    });
    this.guide.face('down');
  }
}
