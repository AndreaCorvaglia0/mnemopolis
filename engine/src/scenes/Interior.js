import Phaser from 'phaser';
import { state, save } from '../systems/state.js';
import { sfx, setMusic, setFire, setSea } from '../systems/audio.js';
import { FireLight, bracket } from '../art/fire.js';
import { MASTERS, QUESTIONS, PLACE } from '../data/content.js';
import { Walker } from '../systems/walker.js';
import { TapNav } from '../systems/tapnav.js';
import { makeCanvas, rect, px, ellipse, hash, mix, addTex } from '../art/px.js';
import { drawText, textWidth } from '../art/buildings.js';
import { P } from '../art/palette.js';
import { GEN } from '../gen/core.js';
import { generateRoom } from '../gen/interior.js';

const RW = 15, RH = 11, T = 16; // the size of the standard room

// ---------- room painting ----------
function floor(ctx, style) {
  for (let y = 48; y < 160; y++) for (let x = 0; x < 240; x++) {
    let col;
    if (style === 'tile') {
      const tx = (x >> 4) + (y >> 4);
      col = tx % 2 ? '#e7ecec' : '#d5dddd';
      if (x % 16 === 0 || y % 16 === 0) col = '#bcc7c8';
    } else if (style === 'wood') {
      const row = Math.floor((y - 48) / 5), off = (row * 23) % 40;
      col = mix(P.woodLight, P.wood, hash(Math.floor((x + off) / 40), row, 3) * 0.7);
      if ((y - 48) % 5 === 4 || (x + off) % 40 === 0) col = P.woodDark;
    } else if (style === 'flag') {
      col = x % 16 === 0 || y % 16 === 0 ? '#4f4a57' : hash(x >> 4, y >> 4, 3) > 0.5 ? '#6b6672' : '#625d69';
    } else {
      const cell = hash(Math.floor((x + (Math.floor(y / 11) % 2) * 6) / 13), Math.floor(y / 11), 5);
      col = mix('#b8b0a1', '#d6cfc0', cell);
      if (y % 11 === 0 || (x + (Math.floor(y / 11) % 2) * 6) % 13 === 0) col = '#8f877a';
    }
    px(ctx, x, y, col);
  }
  // soft shadow along the back wall
  for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgba(20,18,40,${0.18 - k * 0.03})`; ctx.fillRect(0, 48 + k, 240, 1); }
}

function backWall(ctx, base, trim, lower) {
  rect(ctx, 0, 0, 240, 48, base);
  rect(ctx, 0, 0, 240, 3, trim);
  rect(ctx, 0, 30, 240, 18, lower);
  rect(ctx, 0, 30, 240, 1, trim);
  rect(ctx, 0, 46, 240, 2, P.ink);
}

function frontWall(ctx, col) {
  rect(ctx, 0, 160, 240, 16, col);
  rect(ctx, 0, 160, 240, 2, P.ink);
  // exit mat at tile 7
  rect(ctx, 112, 161, 16, 15, '#3a3f6b');
  rect(ctx, 113, 162, 14, 13, '#c9563f');
  for (let y = 164; y < 174; y += 3) rect(ctx, 115, y, 10, 1, '#e7a34f');
  rect(ctx, 0, 48, 4, 112, 'rgba(20,18,40,0.25)');
  rect(ctx, 236, 48, 4, 112, 'rgba(20,18,40,0.25)');
}

function door(ctx, x, y, label) {
  rect(ctx, x - 1, y - 1, 16, 26, P.ink);
  rect(ctx, x, y, 14, 25, P.woodDark);
  rect(ctx, x + 1, y + 1, 12, 24, P.wood);
  rect(ctx, x + 6, y + 1, 1, 24, P.woodDark);
  px(ctx, x + 10, y + 13, P.gold);
  if (label) { rect(ctx, x - 4, y - 9, textWidth(label) + 4, 7, P.ink); drawText(ctx, label, x - 2, y - 8, '#ffcf5a'); }
}

function plant(ctx, x, y) {
  rect(ctx, x + 4, y + 9, 8, 7, '#8c4a3a'); rect(ctx, x + 4, y + 9, 8, 2, '#a85b49');
  ellipse(ctx, x + 8, y + 6, 6, 5, P.grassDark); ellipse(ctx, x + 6, y + 4, 3, 3, P.grassLight); ellipse(ctx, x + 10, y + 7, 3, 2, P.grassLight);
}

function desk(ctx, x, y, w) {
  rect(ctx, x, y, w, 12, P.ink);
  rect(ctx, x + 1, y + 1, w - 2, 9, '#cfd4d6');
  rect(ctx, x + 1, y + 1, w - 2, 2, '#e9eeee');
  rect(ctx, x + 2, y + 12, 3, 4, P.metalDark); rect(ctx, x + w - 5, y + 12, 3, 4, P.metalDark);
}

// The standard room (used when the room generator is switched off).
// One room template for every house. Only colours, floor and light change with the kind of house,
// so the player never has to relearn a room: lab door on the left, reading wall next to it, host in the middle.
const THEME = {
  lab: { wall: ['#ecebf2', '#6b4fa0', '#d5d2e2'], floor: 'tile', front: '#6b4fa0', step: 'stone' },
  archive: { wall: ['#efe6d2', '#8a5a34', '#d9cbb0'], floor: 'wood', front: '#5c3f27', step: 'wood' },
  hall: { wall: ['#f6f1e3', '#c9662a', '#ead9bd'], floor: 'wood', front: '#a95f1f', step: 'wood' },
  studio: { wall: ['#f3f4f1', '#2a8c87', '#d7e3e2'], floor: 'tile', front: '#2a8c87', step: 'stone' },
  observatory: { wall: ['#e6edf5', '#2c4580', '#cdd8e8'], floor: 'stone', front: '#2c4580', step: 'stone' },
  cave: { wall: ['#4a4652', '#2b2833', '#3d3945'], floor: 'flag', front: '#2b2833', step: 'stone', torches: [[100, 16], [200, 16]], dark: true },
};

function roomFor(place) {
  const th = THEME[place.kind] || THEME.lab;
  const blocked = new Uint8Array(RW * RH);
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (y <= 2 || y === 10 || x === 0 || x === 14) blocked[y * RW + x] = 1;
  [[2, 3], [3, 3], [4, 3]].forEach(([x, y]) => (blocked[y * RW + x] = 1));
  return {
    ...th,
    paint(ctx) {
      backWall(ctx, ...th.wall);
      if (th.dark) for (let y = 4; y < 30; y += 8) { rect(ctx, 0, y, 240, 1, '#3a3641'); for (let x = ((y >> 3) % 2) * 8; x < 240; x += 16) rect(ctx, x, y - 4, 1, 8, '#3a3641'); }
      floor(ctx, th.floor);
      frontWall(ctx, th.front);
      door(ctx, 17, 22, 'LAB');
      // the reading wall: a board above a desk
      rect(ctx, 34, 5, 44, 26, P.ink); rect(ctx, 35, 6, 42, 24, th.dark ? '#1d1712' : '#fbf8ef'); rect(ctx, 35, 6, 42, 4, th.wall[1]);
      for (let k = 0; k < 5; k++) rect(ctx, 38, 13 + k * 3, 14 + Math.floor(hash(k, place.order || 1, 8) * 20), 1, th.dark ? '#b8a988' : '#8f877a');
      rect(ctx, 62, 13, 12, 10, th.wall[1]); rect(ctx, 63, 14, 10, 8, th.dark ? '#3a2b1d' : '#ffffff');
      desk(ctx, 32, 50, 48);
      // the concept, written on the wall
      const label = (place.concept || place.name).toUpperCase().slice(0, 34), tw = textWidth(label);
      const ly = th.torches ? 33 : 10; // below the torches in a dark room
      rect(ctx, 150 - tw / 2 - 4, ly, tw + 8, 11, P.ink); rect(ctx, 150 - tw / 2 - 3, ly + 1, tw + 6, 9, th.wall[1]); drawText(ctx, label, 150 - tw / 2, ly + 3, '#ffffff');
      const num = String(place.order || ''); rect(ctx, 214, 8, 14, 13, P.ink); rect(ctx, 215, 9, 12, 11, P.gold); drawText(ctx, num, 221 - textWidth(num) / 2, 12, P.ink);
      if (th.torches) th.torches.forEach(([x, y]) => bracket(ctx, x, y));
      else { plant(ctx, 0, 52); plant(ctx, 224, 140); plant(ctx, 0, 140); }
    },
    exhibit: [[2, 3], [3, 3], [4, 3]], master: [8, 5], glows: [],
    w: RW, h: RH, blocked, lab: [1, 2], exit: [7, 10], start: [7, 9], labGlow: [24, 36, 'glow', 0.75], props: [],
  };
}

// The room of a house: generated (src/gen/interior.js), or the standard room when
// world.json says { "gen": { "interior": false } }.
const roomOf = (place) => (GEN.interior ? generateRoom(place) : roomFor(place));

export class Interior extends Phaser.Scene {
  constructor() { super('Interior'); }

  create({ id }) {
    this.id = id;
    this.leaving = false; // the scene object is reused between visits
    this.ui = this.scene.get('UI');
    const place = PLACE[id], room = roomOf(place);
    this.room = room;
    const RW = (this.rw = room.w), RH = (this.rh = room.h);
    const key = `room-${id}`;
    if (!this.textures.exists(key)) {
      const [c, ctx] = makeCanvas(RW * T, RH * T);
      room.paint(ctx, this);
      addTex(this, key, c);
    }
    this.add.image(0, 0, key).setOrigin(0).setDepth(0);
    // tall furniture: separate pieces sorted by depth, so the player can walk behind them
    room.props.forEach((p, i) => {
      const pk = `${key}-p${i}`;
      if (!this.textures.exists(pk)) { const [c, ctx] = makeCanvas(p.w, p.h); p.paint(ctx); addTex(this, pk, c); }
      this.add.image(p.x, p.y, pk).setOrigin(0).setDepth(p.depth);
    });
    room.glows.forEach(([x, y, k, s]) => {
      const g = this.add.image(x, y, k).setScale(s).setBlendMode(Phaser.BlendModes.ADD).setDepth(5000).setAlpha(0.7);
      this.tweens.add({ targets: g, alpha: 0.4, duration: 1400 + x * 3, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    // the lab door glows: it is the main thing to do in a room
    const [gx, gy, gk, gs] = room.labGlow;
    const dg = this.add.image(gx, gy, gk).setScale(gs).setBlendMode(Phaser.BlendModes.ADD).setDepth(5000).setAlpha(0.8);
    this.tweens.add({ targets: dg, alpha: 0.35, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.blocked = room.blocked;
    this.exhibitTiles = new Set(room.exhibit.map(([x, y]) => `${x},${y}`));

    const m = MASTERS[id];
    this.master = new Walker(this, `ch-${m.look}`, room.master[0], room.master[1], 'down');
    this.player = new Walker(this, 'ch-player', room.start[0], room.start[1], 'up');
    this.fire = room.torches ? new FireLight(this, RW * T, RH * T, room.torches.map(([x, y]) => [x, y + 2]), this.player.sprite, { dark: 0.55, radius: 52 }) : null;
    setMusic(room.dark ? 'castle' : 'building'); setFire(room.torches ? 0.8 : 0); setSea(0);

    const cam = this.cameras.main;
    cam.setBackgroundColor('#0d0f1e');
    cam.setRoundPixels(true);
    this.ui.setLocation(place.name, 'room');
    this.nav = new TapNav(this, { w: RW, h: RH });
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
    if (!this.registry.get('lite')) {
      cam.postFX.addVignette(0.5, 0.5, 0.95, 0.35);
      cam.postFX.addBloom(0xffffff, 1, 1, 1, 0.3, 4);
    }
    const dropFx = () => cam.postFX.clear();
    this.game.events.on('lite', dropFx);
    this.events.once('shutdown', () => this.game.events.off('lite', dropFx));
    cam.fadeIn(250);

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT,SPACE,ENTER,E');
    this.input.keyboard.on('keydown-TAB', (e) => { e.preventDefault?.(); if (!this.ui.busy) this.ui.showAtlas(); });
  }

  // Largest whole-number zoom at which the room fits on screen without running
  // under the HUD in the top corners.
  layout() {
    const W = this.scale.width, H = this.scale.height;
    const k = Math.min(W / 960, H / 540);
    const safe = this.ui.hudSafe ? this.ui.hudSafe() : [];
    const rw = this.rw * T, rh = this.rh * T;
    let z = Math.max(1, Math.floor(Math.min(W / rw, H / rh)));
    for (; z > 1; z--) {
      const rx0 = (W - rw * z) / 2, ry0 = (H - rh * z) / 2;
      if (safe.every((b) => rx0 >= b.w * k || ry0 >= b.h * k)) break;
    }
    const cam = this.cameras.main;
    cam.setSize(W, H);
    cam.setZoom(z);
    cam.centerOn(rw / 2, rh / 2);
  }

  canEnter = (x, y) => {
    const { exit, lab } = this.room;
    if (x === exit[0] && y === exit[1]) return { exit: true };
    if (x === lab[0] && y === lab[1]) return { lab: true };
    if (x < 0 || y < 0 || x >= this.rw || y >= this.rh) return false;
    if (this.blocked[y * this.rw + x]) return false;
    if (this.master.tx === x && this.master.ty === y) return false;
    return true;
  };

  update(time) {
    this.fire?.update(time);
    const k = this.keys;
    if (this.ui.busy || this.leaving || this.player.moving) {
      Phaser.Input.Keyboard.JustDown(k.SPACE); Phaser.Input.Keyboard.JustDown(k.ENTER); Phaser.Input.Keyboard.JustDown(k.E);
      return;
    }
    const [fx, fy] = this.player.facing();
    this.ui.setPrompt(this.master.tx === fx && this.master.ty === fy ? `Space  Talk to ${MASTERS[this.id].name}`
      : this.exhibitTiles.has(`${fx},${fy}`) ? 'Space  Read the wall' : fx === this.room.lab[0] && fy === this.room.lab[1] ? 'Space  Enter the lab' : null);
    if (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER) || Phaser.Input.Keyboard.JustDown(k.E) || this.nav.act()) return this.interact();
    const key = k.LEFT.isDown || k.A.isDown ? 'left' : k.RIGHT.isDown || k.D.isDown ? 'right' : k.UP.isDown || k.W.isDown ? 'up' : k.DOWN.isDown || k.S.isDown ? 'down' : null;
    if (key) this.nav.cancel();
    const tapped = !key && this.nav.walking, dir = key || this.nav.next();
    if (!dir) { this.player.stopAnim(); return; }
    const res = this.player.step(dir, this.canEnter, k.SHIFT.isDown || tapped ? 95 : 150, () => sfx.step(this.room.step));
    if (res && res.exit) this.leave();
    else if (res && res.lab) { this.player.stopAnim(); this.ui.lab(this.id); }
  }

  leave() {
    this.leaving = true;
    sfx.door();
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Town', { from: this.id }));
  }

  async interact() {
    const [fx, fy] = this.player.facing();
    if (this.master.tx === fx && this.master.ty === fy) return this.talkMaster();
    if (this.exhibitTiles.has(`${fx},${fy}`)) return this.ui.reading(this.id);
    if (fx === this.room.lab[0] && fy === this.room.lab[1]) return this.ui.lab(this.id);
  }

  // The master says one line and offers what the room has. No lectures.
  async talkMaster() {
    const id = this.id, m = MASTERS[id], ui = this.ui;
    const pool = QUESTIONS.filter((q) => q.topic === id);
    this.master.faceToward(this.player.tx, this.player.ty);
    sfx.select();
    await ui.converse(m.name, { root: { say: m.hi, options: [
      { label: 'Open the lab', do: async () => { await ui.lab(id); return 'end'; } },
      { label: 'Show me the reading wall', do: async () => { await ui.reading(id); return 'end'; } },
      { label: `Quiz me (${Math.min(3, pool.length)} questions)`, if: () => pool.length >= 2, do: async () => { await this.quizSeries(pool); return 'end'; } },
      { label: 'Bye' },
    ] } });
    this.master.face('down');
  }

  // Up to three questions, easiest first. Esc leaves with no penalty; two right earns the house stamp.
  async quizSeries(pool) {
    const m = MASTERS[this.id], ui = this.ui;
    const sh = Phaser.Utils.Array.Shuffle([...pool]), qs = [];
    for (const st of [1, 2, 3]) { const q = sh.find((x) => x.stars === st); if (q) qs.push(q); }
    for (const q of sh) if (qs.length < Math.min(3, pool.length) && !qs.includes(q)) qs.push(q);
    qs.sort((x, y) => x.stars - y.stars);
    let right = 0;
    for (let i = 0; i < qs.length; i++) {
      const r = await ui.quiz(qs[i], { banner: `Question ${i + 1} of ${qs.length}` });
      if (r.ran) return;
      if (r.right) right += 1;
    }
    if (right >= Math.min(2, qs.length) && !state.stamps[this.id]) {
      state.stamps[this.id] = true;
      save();
      await ui.stamp(this.id);
      await ui.say([m.stamp], { name: m.name });
    } else await ui.say([`${right} of ${qs.length}.`], { name: m.name });
  }
}
