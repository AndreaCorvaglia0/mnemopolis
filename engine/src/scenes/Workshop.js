import Phaser from 'phaser';
import { sfx, setMusic, setFire, setSea } from '../systems/audio.js';
import { Walker } from '../systems/walker.js';
import { makeCanvas, rect, px, hash, addTex } from '../art/px.js';
import { drawText, textWidth } from '../art/buildings.js';
import { LABS } from '../course/labs.js';
import { PLACE, MASTERS } from '../data/content.js';

// A workshop is the room of a PROCESS: the stations of its lab are machines on one conveyor belt,
// in order. The belt runs left to right along the top, then back along the bottom. Up to 8 stations.
const T = 16, W = 21, H = 12, TOP = 3, BOT = 8;
const ZONE_COL = ['#3c5ea6', '#b9463b', '#2a8c87', '#d9822f', '#6b4fa0'];
const PATH = [[0, TOP], [18, TOP], [18, BOT], [1, BOT]];

function layout(n) {
  const a = Math.ceil(n / 2), b = n - a, out = [];
  for (let i = 0; i < a; i++) out.push([a === 1 ? 9 : 3 + Math.round((i * 13) / (a - 1)), TOP]);
  for (let j = 0; j < b; j++) out.push([b === 1 ? 9 : 16 - Math.round((j * 13) / (b - 1)), BOT]);
  return out;
}

function belt(ctx, x0, y0, x1, y1) {
  const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0);
  for (let x = x0, y = y0; ; x += dx, y += dy) {
    rect(ctx, x * T + 2, y * T + 3, 12, 10, '#23262e'); rect(ctx, x * T + (dx ? 0 : 2), y * T + (dy ? 0 : 3), dx ? 16 : 12, dy ? 16 : 10, '#2e323c');
    rect(ctx, x * T + (dx ? 0 : 2), y * T + (dy ? 0 : 3), dx ? 16 : 1, dy ? 16 : 1, '#555b69');
    const cx = x * T + 8, cy = y * T + 8;
    for (let k = -1; k <= 1; k++) px(ctx, cx - dx * Math.abs(k) + dy * k, cy - dy * Math.abs(k) + dx * k, '#ffcf5a');
    if (x === x1 && y === y1) break;
  }
}

function machine(ctx, i, x, y, label, col) {
  const X = x * T, Y = y * T;
  rect(ctx, X, Y - 9, 16, 24, '#17151c'); rect(ctx, X + 1, Y - 8, 14, 22, col); rect(ctx, X + 1, Y - 8, 14, 2, '#ffffff55'); rect(ctx, X + 1, Y + 9, 14, 5, '#00000044');
  rect(ctx, X + 3, Y - 4, 10, 7, '#0c1220'); rect(ctx, X + 4, Y - 3, 8, 5, '#4fd1c5'); px(ctx, X + 5, Y - 2, '#fff');
  px(ctx, X + 4, Y + 6, '#7ddc8a'); px(ctx, X + 7, Y + 6, '#ffcf5a'); px(ctx, X + 10, Y + 6, '#ff7a6b');
  const tw = textWidth(label) + 4; rect(ctx, X + 8 - tw / 2, Y - 18, tw, 7, '#17151c'); drawText(ctx, label, X + 10 - tw / 2, Y - 17, '#ffcf5a');
  rect(ctx, X + 5, Y - 26, 7, 7, col); drawText(ctx, String(i + 1), X + 7, Y - 25, '#fff');
}

function paint(lab, spots) {
  const [c, ctx] = makeCanvas(W * T, H * T);
  rect(ctx, 0, 0, W * T, 32, '#3b4250'); for (let x = 0; x < W * T; x += 24) rect(ctx, x, 0, 1, 32, '#2c323d');
  rect(ctx, 0, 0, W * T, 3, '#23262e'); rect(ctx, 0, 29, W * T, 3, '#23262e');
  for (let x = 20; x < W * T - 20; x += 48) { rect(ctx, x, 8, 22, 14, '#17151c'); rect(ctx, x + 1, 9, 20, 12, '#ffd98a'); rect(ctx, x + 10, 9, 1, 12, '#17151c'); }
  for (let y = 32; y < 176; y++) for (let x = 0; x < W * T; x++) px(ctx, x, y, x % 16 === 0 || y % 16 === 0 ? '#565c69' : hash(x >> 4, y >> 4, 5) > 0.5 ? '#6f7684' : '#687080');
  for (let k = 0; k < 5; k++) { ctx.fillStyle = `rgba(10,12,20,${0.25 - k * 0.05})`; ctx.fillRect(0, 32 + k, W * T, 1); }
  for (let i = 0; i < PATH.length - 1; i++) belt(ctx, ...PATH[i], ...PATH[i + 1]);
  drawText(ctx, 'IN', 3, TOP * T - 8, '#e6e8ee'); drawText(ctx, 'OUT', 3, BOT * T - 8, '#e6e8ee');
  rect(ctx, 0, 176, W * T, 16, '#23262e'); rect(ctx, 0, 176, W * T, 2, '#17151c');
  rect(ctx, 19 * T, 177, 16, 15, '#3a3f6b'); rect(ctx, 19 * T + 1, 178, 14, 13, '#c9563f'); for (let y = 180; y < 190; y += 3) rect(ctx, 19 * T + 3, y, 10, 1, '#e7a34f');
  const zones = [...new Set(lab.stations.map((s) => s.zone || ''))];
  spots.forEach(([x, y], i) => { const st = lab.stations[i]; machine(ctx, i, x, y, (st.short || st.tab).toUpperCase().slice(0, 9), ZONE_COL[zones.indexOf(st.zone || '') % ZONE_COL.length]); });
  return c;
}

export class Workshop extends Phaser.Scene {
  constructor() { super('Workshop'); }

  create({ id }) {
    this.id = id;
    this.ui = this.scene.get('UI');
    this.leaving = false;
    const lab = LABS[id], place = PLACE[id];
    if (!lab || lab.stations.length > 8) throw new Error(`Workshop "${id}" needs a lab with 1 to 8 stations.`);
    this.lab = lab;
    const spots = layout(lab.stations.length), key = `workshop-${id}`;
    if (!this.textures.exists(key)) addTex(this, key, paint(lab, spots));
    if (!this.textures.exists('belt-card')) { const [c, ctx] = makeCanvas(9, 9); rect(ctx, 0, 0, 9, 9, '#17151c'); rect(ctx, 1, 1, 7, 7, '#f3ead6'); rect(ctx, 2, 3, 5, 1, '#8f877a'); rect(ctx, 2, 5, 3, 1, '#8f877a'); addTex(this, 'belt-card', c); }
    this.add.image(0, 0, key).setOrigin(0).setDepth(0);
    this.at = new Map(spots.map(([x, y], i) => [`${x},${y}`, i]));
    this.card = this.add.image(0, 0, 'belt-card').setDepth(40);
    this.segs = PATH.slice(1).map((p, i) => ({ a: PATH[i], b: p, len: Math.abs(p[0] - PATH[i][0]) + Math.abs(p[1] - PATH[i][1]) }));
    this.total = this.segs.reduce((s, g) => s + g.len, 0);
    this.guide = new Walker(this, `ch-${MASTERS[id].look}`, 10, 5, 'down');
    this.player = new Walker(this, 'ch-player', 19, 10, 'up');
    const cam = this.cameras.main;
    cam.setBackgroundColor('#0d0f1e'); cam.setRoundPixels(true);
    this.ui.setLocation(place.name, 'room');
    this.layout();
    this.scale.on('resize', this.layout, this);
    const dropFx = () => cam.postFX.clear();
    if (!this.registry.get('lite')) { cam.postFX.addVignette(0.5, 0.5, 0.95, 0.35); cam.postFX.addBloom(0xffffff, 1, 1, 1, 0.3, 4); }
    this.game.events.on('lite', dropFx);
    this.events.once('shutdown', () => { this.scale.off('resize', this.layout, this); this.game.events.off('lite', dropFx); });
    cam.fadeIn(250);
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT,SPACE,ENTER,E');
    this.input.keyboard.on('keydown-TAB', (e) => { e.preventDefault?.(); if (!this.ui.busy) this.ui.showAtlas(); });
    setMusic('building'); setFire(0); setSea(0);
  }

  layout() {
    const Ws = this.scale.width, Hs = this.scale.height, k = Math.min(Ws / 960, Hs / 540), safe = this.ui.hudSafe ? this.ui.hudSafe() : [];
    let z = Math.max(1, Math.floor(Math.min(Ws / (W * T), Hs / (H * T))));
    for (; z > 1; z--) { const rx = (Ws - W * T * z) / 2, ry = (Hs - H * T * z) / 2; if (safe.every((b) => rx >= b.w * k || ry >= b.h * k)) break; }
    const cam = this.cameras.main; cam.setSize(Ws, Hs); cam.setZoom(z); cam.centerOn((W * T) / 2, (H * T) / 2);
  }

  canEnter = (x, y) => {
    if (x === 19 && y === 11) return { exit: true };
    if (x < 0 || x >= W || y < 2 || y > 10) return false;
    if (this.at.has(`${x},${y}`) || (this.guide.tx === x && this.guide.ty === y)) return false;
    return true;
  };

  update(time) {
    let d = ((time / 1000) * 2.2) % (this.total + 2);
    const s = this.segs.find((g) => (d <= g.len ? true : ((d -= g.len), false)));
    this.card.setVisible(!!s);
    if (s) { const f = d / s.len; this.card.setPosition((s.a[0] + (s.b[0] - s.a[0]) * f) * T + 8, (s.a[1] + (s.b[1] - s.a[1]) * f) * T + 6); }
    const k = this.keys;
    if (this.ui.busy || this.leaving || this.player.moving) {
      Phaser.Input.Keyboard.JustDown(k.SPACE); Phaser.Input.Keyboard.JustDown(k.ENTER); Phaser.Input.Keyboard.JustDown(k.E);
      return;
    }
    const [fx, fy] = this.player.facing(), m = this.at.get(`${fx},${fy}`), guide = this.guide.tx === fx && this.guide.ty === fy;
    this.ui.setPrompt(guide ? `Space  Talk to ${MASTERS[this.id].name}` : m !== undefined ? `Space  ${m + 1}. ${this.lab.stations[m].tab}` : null);
    if (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER) || Phaser.Input.Keyboard.JustDown(k.E)) {
      if (guide) return this.talk();
      if (m !== undefined) return this.ui.lab(this.id, m);
      return;
    }
    const dir = k.LEFT.isDown || k.A.isDown ? 'left' : k.RIGHT.isDown || k.D.isDown ? 'right' : k.UP.isDown || k.W.isDown ? 'up' : k.DOWN.isDown || k.S.isDown ? 'down' : null;
    if (!dir) { this.player.stopAnim(); return; }
    const res = this.player.step(dir, this.canEnter, k.SHIFT.isDown ? 95 : 150, () => sfx.step('stone'));
    if (res && res.exit) {
      this.leaving = true; sfx.door();
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Town', { from: this.id }));
    }
  }

  async talk() {
    const m = MASTERS[this.id], ui = this.ui;
    this.guide.faceToward(this.player.tx, this.player.ty);
    sfx.select();
    await ui.converse(m.name, { root: { say: m.hi, options: [
      { label: 'Take me to machine 1', do: async () => { await ui.lab(this.id, 0); return 'end'; } },
      { label: 'Show me the reading page', do: async () => { await ui.reading(this.id); return 'end'; } },
      { label: 'Thanks' },
    ] } });
    this.guide.face('down');
  }
}
