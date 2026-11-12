import Phaser from 'phaser';
import { state, save, scoreAnswer } from '../systems/state.js';
import { sfx, initAudio, toggleMute, setMusicOn, duckMusic } from '../systems/audio.js';
import { openPlaque } from '../lab/museum.js';
import { COURSE, TOPICS, PLACES, PLACE, DISTRICTS, QUESTIONS, LEAGUE } from '../data/content.js';
import { openMap } from '../lab/map.js';
import { openLab } from '../lab/shell.js';
import { openReading } from '../lab/reading.js';

// DotGothic16 for reading (clear C/O and 5/S at small sizes); Pixelify Sans for big display lines.
const BODY = '"DotGothic16", monospace';
const DISPLAY = '"Pixelify Sans", monospace';
const VW = 960, VH = 540; // virtual UI canvas; the camera scales it to the screen
const C = { bg: 0x141629, bg2: 0x1e2240, line: 0xe9e2c9, inner: 0x3a3f6b, teal: 0x4fd1c5, gold: 0xffcf5a, coral: 0xff7a6b, green: 0x7ddc8a, text: '#f1ecd9', muted: '#9aa0c3' };
const HUD_W = 100, HUD_H = 82;
// one colour per district, used on question chips, stamps and the map
const DCOL = [0x3c5ea6, 0xb9463b, 0x2a8c87, 0xd9822f];
const TOPIC_COL = new Proxy({}, { get: (_, id) => (PLACE[id] ? DCOL[DISTRICTS.indexOf(PLACE[id].district) % DCOL.length] : 0x6b4fa0) });

export class UI extends Phaser.Scene {
  constructor() { super('UI'); }

  get busy() { return this.modals > 0 || this.time.now < this.cooldown; }

  create() {
    this.modals = 0;
    this.cooldown = 0;
    this.texts = new Set();
    this.res = 1;
    this.keys = this.input.keyboard.addKeys('SPACE,ENTER,E,ESC,UP,DOWN,LEFT,RIGHT,W,S,A,D,ONE,TWO,THREE,TAB');
    this.input.keyboard.on('keydown', () => initAudio());
    this.input.keyboard.on('keydown-M', () => { state.musicOff = !state.musicOff; save(); setMusicOn(!state.musicOff); this.toast(state.musicOff ? 'Music off' : 'Music on'); });
    this.input.keyboard.on('keydown-V', () => this.toast(toggleMute() ? 'All sound off' : 'Sound on'));
    this.layout();
    this.makeHUD();
    this.placeHUD();
    this.scale.on('resize', () => { this.layout(); this.placeHUD(); });
    this.ready = true;
    this.events.emit('ui-ready');
  }

  // The UI is laid out on a 960x540 virtual canvas. The camera zooms it to fit the
  // screen, and text is rendered at the same zoom so it stays sharp.
  layout() {
    const W = this.scale.width, H = this.scale.height;
    const k = Math.min(W / VW, H / VH);
    this.k = k;
    const cam = this.cameras.main;
    cam.setSize(W, H);
    cam.setZoom(k);
    cam.centerOn(VW / 2, VH / 2);
    const hw = W / (2 * k), hh = H / (2 * k);
    this.view = { x0: VW / 2 - hw, y0: VH / 2 - hh, x1: VW / 2 + hw, y1: VH / 2 + hh };
    const res = Math.max(0.75, k);
    if (Math.abs(res - this.res) > 1e-3) {
      this.res = res;
      for (const t of this.texts) t.setResolution(res);
    }
  }

  // A full-screen backdrop, whatever the window shape.
  dim(color, alpha) { return this.add.rectangle(VW / 2, VH / 2, 6000, 4000, color, alpha); }

  // ---------- helpers ----------
  text(x, y, s, size = 22, color = C.text, opts = {}) {
    const { display, ...rest } = opts;
    const style = { fontFamily: display ? DISPLAY : BODY, fontSize: `${size}px`, color, lineSpacing: 6, ...rest };
    if (!display) delete style.fontStyle; // DotGothic16 has a single weight
    const t = this.add.text(x, y, s, style).setResolution(this.res);
    this.texts.add(t);
    t.once('destroy', () => this.texts.delete(t));
    return t;
  }

  panel(x, y, w, h, fill = C.bg, alpha = 0.95, border = C.line) {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35).fillRoundedRect(x + 4, y + 5, w, h, 10);
    g.fillStyle(fill, alpha).fillRoundedRect(x, y, w, h, 10);
    g.lineStyle(3, border, 1).strokeRoundedRect(x, y, w, h, 10);
    g.lineStyle(1, C.inner, 1).strokeRoundedRect(x + 5, y + 5, w - 10, h - 10, 7);
    return g;
  }

  star(g, x, y, r, col) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
      pts.push(new Phaser.Geom.Point(x + Math.cos(a) * rr, y + Math.sin(a) * rr));
    }
    g.fillStyle(col, 1).fillPoints(pts, true);
  }

  open(phase = 'modal') { this.modals += 1; this.phase = phase; this.setPrompt(null); }
  close() { this.modals = Math.max(0, this.modals - 1); this.cooldown = this.time.now + 180; if (!this.modals) this.phase = null; }

  waitKey(keys = ['SPACE', 'ENTER', 'E'], allowClick = true) {
    return new Promise((resolve) => {
      const handlers = [];
      const done = (v) => { handlers.forEach(([ev, fn]) => this.input.keyboard.off(ev, fn)); if (allowClick) this.input.off('pointerdown', click); resolve(v); };
      keys.forEach((k) => { const fn = () => done(k); handlers.push([`keydown-${k}`, fn]); this.input.keyboard.once(`keydown-${k}`, fn); });
      const click = () => done('CLICK');
      if (allowClick) this.time.delayedCall(60, () => this.input.once('pointerdown', click));
    });
  }

  // ---------- HUD ----------
  // Compact HUD: Insight and stamps top-left, place and keys top-right. Both stay
  // small enough to sit in the side margins of a room.
  makeHUD() {
    this.hud = this.add.container(0, 0).setDepth(10);
    const g = this.add.graphics();
    g.fillStyle(C.bg, 0.84).fillRoundedRect(0, 0, HUD_W, HUD_H, 10);
    g.lineStyle(2, C.line, 0.9).strokeRoundedRect(0, 0, HUD_W, HUD_H, 10);
    const lens = this.add.graphics();
    lens.lineStyle(3, C.gold, 1).strokeCircle(18, 20, 7);
    lens.lineStyle(4, C.gold, 1).lineBetween(23, 25, 29, 31);
    this.insightText = this.text(36, 5, '0', 22, '#ffcf5a', { fontStyle: '600' });
    this.insightLabel = this.text(36, 29, 'Insight', 11, C.muted);
    this.stampG = this.add.graphics();
    this.hud.add([g, lens, this.insightText, this.insightLabel, this.stampG]);
    this.hudRight = this.add.container(0, 0).setDepth(10);
    const ink = { stroke: '#0d0f1e', strokeThickness: 4 };
    this.loc = this.text(0, 0, '', 16, C.text, { fontStyle: '600', ...ink }).setOrigin(1, 0);
    this.hint = this.text(0, 24, '', 12, '#c7cbe3', { align: 'right', lineSpacing: 3, ...ink }).setOrigin(1, 0);
    this.hudRight.add([this.loc, this.hint]);
    this.lastInsight = state.insight;
    if (this.where) this.setLocation(...this.where);
    this.refreshHUD();
    this.setHudVisible(false);
  }

  setHudVisible(v) { this.hud.setVisible(v); this.hudRight.setVisible(v); }

  placeHUD() {
    if (!this.hud) return;
    this.hud.setPosition(Math.round(this.view.x0 + 10), Math.round(this.view.y0 + 10));
    this.hudRight.setPosition(Math.round(this.view.x1 - 12), Math.round(this.view.y0 + 10));
  }

  // Screen corners a room must keep clear, in virtual pixels.
  hudSafe() {
    return [
      { w: 10 + HUD_W + 4, h: 10 + HUD_H + 4 },
      { w: 12 + Math.max(this.loc.width, this.hint.width) + 4, h: 10 + 24 + this.hint.height + 4 },
    ];
  }

  refreshHUD() {
    this.insightText.setText(String(state.insight));
    if (state.insight !== this.lastInsight) {
      this.lastInsight = state.insight;
      this.tweens.add({ targets: this.insightText, scale: { from: 1.35, to: 1 }, duration: 260, ease: 'Back.easeOut' });
    }
    const g = this.stampG;
    g.clear();
    // one dot per house: outlined = not visited, teal = visited, gold = stamped
    PLACES.forEach((p, i) => {
      const x = 14 + (i % 8) * 10.5, y = 56 + Math.floor(i / 8) * 12;
      if (state.stamps[p.id]) g.fillStyle(C.gold, 1).fillCircle(x, y, 4);
      else if (state.visited[p.id]) g.fillStyle(C.teal, 1).fillCircle(x, y, 4);
      else g.lineStyle(1.5, C.line, 0.6).strokeCircle(x, y, 3.5);
    });
  }

  setLocation(name, where = 'town') {
    this.where = [name, where];
    if (!this.loc) return; // the HUD picks it up when it is built
    this.loc.setText(name);
    this.hint.setText(where === 'town' ? 'Tab  Map\nN  time of day\nG  grass questions\nM  music  ·  V  all sound' : 'Tab  Map\nM  music  ·  V  all sound');
  }

  toast(msg, color = C.text) {
    const t = this.text(480, 92, msg, 22, color).setOrigin(0.5).setDepth(50).setAlpha(0);
    const bg = this.add.graphics().setDepth(49);
    const w = t.width + 36;
    bg.fillStyle(C.bg, 0.9).fillRoundedRect(480 - w / 2, 74, w, 38, 8).lineStyle(2, C.line, 0.8).strokeRoundedRect(480 - w / 2, 74, w, 38, 8);
    bg.setAlpha(0);
    this.tweens.add({ targets: [t, bg], alpha: 1, duration: 160, yoyo: true, hold: 1300, onComplete: () => { t.destroy(); bg.destroy(); } });
  }

  // ---------- title ----------
  showTitle() {
    this.open('title');
    return new Promise((resolve) => {
      const c = this.add.container(0, 0).setDepth(100);
      const shade = this.dim(0x0b0d1c, 0.25);
      const title = this.text(480, 170, COURSE.title.toUpperCase(), Math.min(76, Math.floor(1000 / Math.max(8, COURSE.title.length))), '#ffcf5a', { display: true, fontStyle: '600', stroke: '#1b1a2b', strokeThickness: 10 }).setOrigin(0.5);
      const sub = this.text(480, 238, COURSE.subject, 24, '#f1ecd9', { display: true, stroke: '#1b1a2b', strokeThickness: 6 }).setOrigin(0.5);
      const press = this.text(480, 380, 'Press Space or click to start', 26, '#4fd1c5', { display: true, stroke: '#1b1a2b', strokeThickness: 6 }).setOrigin(0.5);
      const ctr = this.text(480, 420, 'Arrows or WASD to walk  ·  Shift to run  ·  Space to talk', 16, '#f1ecd9', { stroke: '#1b1a2b', strokeThickness: 5 }).setOrigin(0.5);
      const cred = this.text(480, 512, COURSE.credit || '', 13, '#cfd3e8', { stroke: '#1b1a2b', strokeThickness: 4 }).setOrigin(0.5);
      c.add([shade, title, sub, press, ctr, cred]);
      this.tweens.add({ targets: press, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: title, y: 164, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.waitKey().then(() => {
        sfx.confirm();
        this.tweens.add({ targets: c, alpha: 0, duration: 450, onComplete: () => { c.destroy(); this.setHudVisible(true); this.close(); resolve(); } });
      });
    });
  }

  // ---------- dialogue ----------
  // Where is the player on screen? Used to keep dialogue boxes off the characters.
  playerScreenY() {
    for (const key of ['Town', 'Interior']) {
      const s = this.scene.get(key);
      if (s && this.scene.isActive(key) && s.player) {
        const cam = s.cameras.main;
        const dy = (s.player.sprite.y - cam.worldView.y) * cam.zoom;
        return VH / 2 + (dy - this.scale.height / 2) / this.k;
      }
    }
    return 0;
  }

  async say(lines, { name = '' } = {}) {
    this.open('say');
    const top = this.playerScreenY() > 330;
    const c = this.add.container(0, top ? -350 : 0).setDepth(60);
    c.add(this.panel(40, 380, 880, 140));
    let tag = null;
    if (name) {
      const tw = this.text(0, 0, name, 18, '#1b1a2b', { fontStyle: '600' });
      const g = this.add.graphics();
      g.fillStyle(C.gold, 1).fillRoundedRect(60, 362, tw.width + 26, 32, 7).lineStyle(2, 0x1b1a2b, 1).strokeRoundedRect(60, 362, tw.width + 26, 32, 7);
      tw.setPosition(73, 367);
      c.add([g, tw]);
      tag = tw;
    }
    const body = this.text(68, 404, '', 23, C.text, { wordWrap: { width: 820 } });
    const arrow = this.text(890, 488, '▼', 18, '#ffcf5a').setOrigin(0.5);
    c.add([body, arrow]);
    this.tweens.add({ targets: arrow, y: 494, duration: 400, yoyo: true, repeat: -1 });
    for (const line of lines) {
      arrow.setVisible(false);
      await this.typewrite(body, line);
      arrow.setVisible(true);
      const key = await this.waitKey(['SPACE', 'ENTER', 'E', 'ESC']);
      sfx.blip();
      if (key === 'ESC') break; // walk away at any point
    }
    c.destroy();
    this.close();
  }

  // A short conversation that branches on the player's choice. Esc or "Bye" ends it.
  // nodes: { root: { say, options: [{ label, to?, do?, if? }] }, ... }
  async converse(name, nodes, start = 'root') {
    let key = start;
    while (key) {
      const node = nodes[key], opts = node.options.filter((o) => !o.if || o.if());
      const i = await this.choose(node.say, opts.map((o) => o.label), { name });
      if (i < 0) return;
      const o = opts[i];
      if (o.do && (await o.do()) === 'end') return;
      key = o.to ?? null;
    }
  }

  // Labs and reading walls are web pages on top of the game: pause the game and
  // hand the keyboard over while one is open.
  async page(fn) {
    this.open('lab');
    const kb = this.game.input.keyboard;
    kb.enabled = false;
    this.game.loop.sleep();
    duckMusic(true);
    try { return await fn(); } finally {
      duckMusic(false);
      this.game.loop.wake();
      kb.enabled = true;
      for (const sc of this.game.scene.getScenes(true)) sc.input.keyboard?.resetKeys();
      this.close();
    }
  }

  // A station can ask for its deep-dive page; afterwards the lab reopens where it was.
  async lab(id, station = 0) {
    sfx.whoosh();
    if (!state.visited[id]) { state.visited[id] = true; save(); this.refreshHUD(); }
    for (;;) {
      const r = await this.page(() => openLab(id, station));
      if (!r?.deep) return;
      await this.page(() => openReading(r.deep[0], r.deep[1]));
      station = r.station;
    }
  }

  plaque(list, i, kinds) { sfx.page(); return this.page(() => openPlaque(list, i, kinds)); }

  async reading(id) {
    if ((await this.page(() => openReading(id))) === 'lab') await this.lab(id);
  }

  // "Space  Talk" style hint for whatever the player is facing.
  setPrompt(textOrNull) {
    if (textOrNull === this.promptText) return;
    this.promptText = textOrNull;
    this.promptBox?.destroy();
    this.promptBox = null;
    if (!textOrNull) return;
    const t = this.text(480, 512, textOrNull, 16, '#1b1a2b').setOrigin(0.5);
    const g = this.add.graphics();
    g.fillStyle(C.gold, 0.95).fillRoundedRect(480 - t.width / 2 - 12, 498, t.width + 24, 28, 8);
    this.promptBox = this.add.container(0, 0, [g, t]).setDepth(12);
  }


  typewrite(textObj, line) {
    return new Promise((resolve) => {
      let i = 0;
      let finished = false;
      const finish = () => { if (finished) return; finished = true; ev.remove(); textObj.setText(line); this.input.keyboard.off('keydown-SPACE', skip); this.input.keyboard.off('keydown-ENTER', skip); resolve(); };
      const skip = () => finish();
      const ev = this.time.addEvent({ delay: 18, loop: true, callback: () => {
        i += 1;
        textObj.setText(line.slice(0, i));
        if (i % 3 === 0) sfx.blip();
        if (i >= line.length) finish();
      } });
      this.time.delayedCall(80, () => { if (!finished) { this.input.keyboard.once('keydown-SPACE', skip); this.input.keyboard.once('keydown-ENTER', skip); } });
    });
  }

  // ---------- choice ----------
  // Resolves with the index picked, or -1 if the player presses Esc.
  async choose(question, options, { name = '' } = {}) {
    this.open('choose');
    const c = this.add.container(0, 0).setDepth(60);
    const q = this.text(68, 0, question, 21, C.text, { wordWrap: { width: 820 } });
    const H = (name ? 30 : 0) + q.height + 30 + options.length * 32 + 34, top = 524 - H;
    c.add(this.panel(40, top, 880, H));
    if (name) c.add(this.text(68, top + 14, name, 16, '#ffcf5a'));
    q.setY(top + (name ? 42 : 18));
    c.add(q);
    const y0 = q.y + q.height + 16;
    const rows = options.map((o, i) => {
      const y = y0 + i * 32;
      const t = this.text(110, y, o, 21, C.text);
      const z = this.add.zone(90, y - 2, 780, 30).setOrigin(0).setInteractive({ useHandCursor: true });
      c.add([t, z]);
      return { t, z };
    });
    const cursor = this.text(84, y0, '▶', 19, '#4fd1c5');
    c.add([cursor, this.text(892, top + H - 20, 'Esc to leave', 13, C.muted).setOrigin(1, 0.5)]);
    let sel = 0;
    const draw = () => { cursor.setY(y0 + sel * 32); rows.forEach((r, i) => r.t.setColor(i === sel ? '#4fd1c5' : C.text)); };
    draw();
    const choice = await new Promise((resolve) => {
      const up = () => { sel = (sel + options.length - 1) % options.length; sfx.blip(); draw(); };
      const down = () => { sel = (sel + 1) % options.length; sfx.blip(); draw(); };
      const ok = () => { cleanup(); resolve(sel); };
      const esc = () => { cleanup(); resolve(-1); };
      const ev = [['keydown-UP', up], ['keydown-W', up], ['keydown-DOWN', down], ['keydown-S', down], ['keydown-SPACE', ok], ['keydown-ENTER', ok], ['keydown-E', ok], ['keydown-ESC', esc]];
      const cleanup = () => ev.forEach(([e, f]) => this.input.keyboard.off(e, f));
      this.time.delayedCall(120, () => ev.forEach(([e, f]) => this.input.keyboard.on(e, f)));
      rows.forEach((r, i) => { r.z.on('pointerover', () => { sel = i; draw(); }); r.z.on('pointerdown', () => { sel = i; draw(); ok(); }); });
    });
    sfx.select();
    c.destroy();
    this.close();
    return choice;
  }

  // ---------- quiz card ----------
  // Lays out the question and options, shrinking the type until everything fits
  // above the confidence buttons.
  quizBody(q, tx, tw, hasImg) {
    let body = null;
    for (const [qs, os] of [[24, 19], [21, 17], [19, 15], [17, 14]]) {
      if (body) body.destroy();
      body = this.add.container(0, 0);
      const qt = this.text(tx, 92, q.q, qs, C.text, { wordWrap: { width: tw } });
      body.add(qt);
      let y = Math.max(qt.y + qt.height + 16, hasImg ? 150 : 160);
      body.rows = q.options.map((o, i) => {
        const t = this.text(tx + 48, 0, o, os, C.text, { wordWrap: { width: tw - 62 } }).setOrigin(0, 0.5);
        const h = Math.max(44, Math.ceil(t.height) + 16);
        t.setY(Math.round(y + h / 2));
        const g = this.add.graphics();
        const letter = this.text(tx + 22, Math.round(y + h / 2), 'ABCD'[i], 19, '#1b1a2b').setOrigin(0.5);
        const z = this.add.zone(tx, y, tw, h).setOrigin(0).setInteractive({ useHandCursor: true });
        body.add([g, letter, t, z]);
        const row = { g, t, z, y, h };
        y += h + 8;
        return row;
      });
      body.bottom = y - 8;
      if (body.bottom <= 416) break;
    }
    return body;
  }

  async quiz(q, { canRun = false, banner = '' } = {}) {
    this.open('quiz-choose');
    const c = this.add.container(0, 0).setDepth(70);
    c.add(this.dim(0x070812, 0.62));
    c.add(this.panel(70, 24, 820, 492));
    const hasImg = !!q.img;
    const tx = hasImg ? 360 : 104, tw = hasImg ? 500 : 752;
    if (hasImg) {
      const im = this.add.image(210, 248, q.img).setDisplaySize(250, 250);
      const fr = this.add.graphics().lineStyle(3, C.line, 1).strokeRect(85, 123, 250, 250);
      c.add([im, fr]);
    }
    const topic = q.topic ? TOPICS[q.topic].name.toUpperCase() : 'CASE REVIEW';
    const chipT = this.text(0, 64, topic, 15, '#ffffff').setOrigin(0.5);
    const chipW = Math.round(chipT.width) + 28;
    chipT.setX(96 + chipW / 2);
    const chip = this.add.graphics().fillStyle(TOPIC_COL[q.topic || 'review'], 1).fillRoundedRect(96, 50, chipW, 28, 6);
    c.add([chip, chipT]);
    const sg = this.add.graphics();
    for (let i = 0; i < 3; i++) this.star(sg, 112 + chipW + i * 26, 64, 10, i < q.stars ? C.gold : 0x3a3f6b);
    c.add(sg);
    if (banner) c.add(this.text(864, 64, banner, 16, '#4fd1c5').setOrigin(1, 0.5));
    const body = this.quizBody(q, tx, tw, hasImg);
    c.add(body);
    const rows = body.rows;
    const by = Math.max(404, body.bottom + 14);
    const drawRows = (sel, reveal = null) => rows.forEach((r, i) => {
      r.g.clear();
      let fill = C.bg2, border = i === sel ? C.teal : C.inner, badge = i === sel ? C.teal : C.line;
      if (reveal) {
        if (i === q.answer) { fill = 0x1d4a37; border = C.green; badge = C.green; }
        else if (i === reveal.choice) { fill = 0x4a1d24; border = C.coral; badge = C.coral; }
      }
      r.g.fillStyle(fill, 1).fillRoundedRect(tx, r.y, tw, r.h, 8).lineStyle(2, border, 1).strokeRoundedRect(tx, r.y, tw, r.h, 8);
      r.g.fillStyle(badge, 1).fillRoundedRect(tx + 8, r.y + r.h / 2 - 14, 28, 28, 6);
    });
    let sel = 0;
    drawRows(sel);
    this.quizState = { answer: q.answer, sel: () => sel };
    const runHint = '   ·   Esc to leave';
    const help = this.text(480, by + 80, `↑ ↓ to choose, Space to confirm${runHint}`, 15, C.muted).setOrigin(0.5);
    c.add(help);

    const choice = await new Promise((resolve) => {
      const move = (d) => { sel = (sel + d + rows.length) % rows.length; sfx.blip(); drawRows(sel); };
      const up = () => move(-1), down = () => move(1);
      const ok = () => { cleanup(); resolve(sel); };
      const run = () => { cleanup(); resolve(-1); };
      const ev = [['keydown-UP', up], ['keydown-W', up], ['keydown-DOWN', down], ['keydown-S', down], ['keydown-SPACE', ok], ['keydown-ENTER', ok], ['keydown-ESC', run]];
      const cleanup = () => ev.forEach(([e, f]) => this.input.keyboard.off(e, f));
      this.time.delayedCall(150, () => ev.forEach(([e, f]) => this.input.keyboard.on(e, f)));
      rows.forEach((r, i) => { r.z.on('pointerover', () => { sel = i; drawRows(sel); }); r.z.on('pointerdown', () => { sel = i; drawRows(sel); ok(); }); });
    });
    if (choice === -1) { c.destroy(); this.close(); return { ran: true }; }
    sfx.select();

    // confidence bet
    rows.forEach((r) => r.z.disableInteractive());
    help.setText('How sure are you?  1, 2 or 3  (or click)   ·   Esc to leave');
    this.phase = 'quiz-bet';
    const bets = [['Guessing', '+1 / 0'], ['Fairly sure', '+2 / -2'], ['Certain', '+3 / -6']];
    const betObjs = bets.map(([label, pay], i) => {
      const x = 104 + i * 258;
      const g = this.add.graphics();
      g.fillStyle(C.bg2, 1).fillRoundedRect(x, by, 236, 58, 8).lineStyle(2, [C.teal, C.gold, C.coral][i], 1).strokeRoundedRect(x, by, 236, 58, 8);
      const t1 = this.text(x + 118, by + 19, `${i + 1}  ${label}`, 19, C.text).setOrigin(0.5);
      const t2 = this.text(x + 118, by + 41, `marks ${pay}  × ${q.stars * 5}`, 14, C.muted).setOrigin(0.5);
      const z = this.add.zone(x, by, 236, 58).setOrigin(0).setInteractive({ useHandCursor: true });
      c.add([g, t1, t2, z]);
      return [g, t1, t2, z];
    });
    const conf = await new Promise((resolve) => {
      const pick = (v) => { cleanup(); resolve(v); };
      const k1 = () => pick(1), k2 = () => pick(2), k3 = () => pick(3);
      const ev = [['keydown-ONE', k1], ['keydown-TWO', k2], ['keydown-THREE', k3], ['keydown-ESC', () => pick(0)]];
      const cleanup = () => ev.forEach(([e, f]) => this.input.keyboard.off(e, f));
      this.time.delayedCall(120, () => ev.forEach(([e, f]) => this.input.keyboard.on(e, f)));
      betObjs.forEach((b, i) => b[3].on('pointerdown', () => pick(i + 1)));
    });
    betObjs.forEach((b) => b.forEach((o) => o.destroy()));
    if (!conf) { c.destroy(); this.close(); return { ran: true }; }
    const right = choice === q.answer;
    const delta = scoreAnswer(q, right, conf);
    (right ? sfx.right : sfx.wrong)();
    drawRows(-1, { choice });
    this.refreshHUD();

    // reveal: the box grows with the explanation
    const verdict = right ? ['Right!', 'Spot on.', 'Exactly.'][Math.floor(Math.random() * 3)] : 'Not quite.';
    const dtxt = `${delta >= 0 ? '+' : ''}${delta} Insight`;
    let why = this.text(116, by + 12, `${verdict}  ${q.why}`, 16, C.text, { wordWrap: { width: 580 } });
    if (by + why.height + 24 > 488) { why.destroy(); why = this.text(116, by + 10, `${verdict}  ${q.why}`, 14, C.text, { wordWrap: { width: 600 } }); }
    const bh = Math.max(64, Math.ceil(why.height) + 22);
    const rg = this.add.graphics().fillStyle(right ? 0x163b2c : 0x3b1620, 1).fillRoundedRect(96, by, 768, bh, 8).lineStyle(2, right ? C.green : C.coral, 1).strokeRoundedRect(96, by, 768, bh, 8);
    const dt = this.text(848, by + bh / 2, dtxt, 24, delta > 0 ? '#ffcf5a' : delta < 0 ? '#ff7a6b' : '#cfd3e8').setOrigin(1, 0.5);
    c.add([rg, why, dt]);
    this.tweens.add({ targets: dt, scale: { from: 1.6, to: 1 }, duration: 300, ease: 'Back.easeOut' });
    help.setText('Space to continue').setY(Math.min(506, by + bh + 16));
    this.phase = 'quiz-reveal';
    await this.waitKey();
    c.destroy();
    this.close();
    return { right, conf, delta };
  }

  // ---------- a question from the tall grass: always an offer, never a trap ----------
  async encounter(q) {
    sfx.encounter();
    const pick = await this.choose('Something rustles in the grass: a question. Take it?', ['Take it', 'Not now', 'Stop asking  (G turns them back on)']);
    if (pick === 2) { state.grassOff = true; save(); this.toast('Grass questions off'); }
    if (pick !== 0) return { ran: true };
    return this.quiz(q, { banner: 'from the tall grass' });
  }

  // ---------- stamps and the atlas item ----------
  async stamp(topic, kind = 'stamp') {
    this.open('stamp');
    sfx.stamp();
    const c = this.add.container(0, 0).setDepth(90);
    c.add(this.dim(0x070812, 0.6));
    const g = this.add.graphics();
    let label, sub;
    if (kind === 'atlas') {
      g.fillStyle(0x5c3f27, 1).fillRoundedRect(-70, -90, 140, 180, 10);
      g.fillStyle(0x7d5737, 1).fillRoundedRect(-62, -84, 128, 168, 8);
      g.lineStyle(3, C.gold, 1).strokeRoundedRect(-50, -70, 104, 140, 6);
      g.lineStyle(3, C.gold, 1).strokeCircle(2, -8, 26);
      g.lineBetween(2, -34, 2, 18); g.lineBetween(-24, -8, 28, -8);
      label = 'You received the Atlas';
      sub = 'Every master you meet will stamp it. Tab to open it.';
    } else {
      const col = TOPIC_COL[topic] || TOPIC_COL.review;
      g.fillStyle(col, 1).fillCircle(0, 0, 92);
      g.lineStyle(6, 0xffffff, 1).strokeCircle(0, 0, 80);
      g.lineStyle(2, 0xffffff, 0.8).strokeCircle(0, 0, 70);
      for (let i = 0; i < 3; i++) this.star(g, -36 + i * 36, 36, 9, 0xffffff);
      label = kind === 'review' ? `${LEAGUE.name} passed` : `${TOPICS[topic].name} stamp`;
      sub = kind === 'review' ? COURSE.bigIdea : TOPICS[topic].card;
    }
    const holder = this.add.container(480, 230, [g]).setScale(3).setAngle(-25).setAlpha(0);
    if (kind !== 'atlas') holder.add(this.text(0, -10, kind === 'review' ? 'PASS' : TOPICS[topic].name.toUpperCase(), kind === 'review' ? 40 : 19, '#ffffff', { display: kind === 'review', fontStyle: '600', align: 'center' }).setOrigin(0.5));
    c.add(holder);
    this.tweens.add({ targets: holder, scale: 1, angle: kind === 'atlas' ? 0 : -8, alpha: 1, duration: 380, ease: 'Back.easeOut', onComplete: () => this.cameras.main.shake(180, 0.008) });
    const t1 = this.text(480, 372, label, 32, '#ffcf5a', { stroke: '#1b1a2b', strokeThickness: 5 }).setOrigin(0.5).setAlpha(0);
    const t2 = this.text(480, 412, sub, 20, C.text).setOrigin(0.5).setAlpha(0);
    const t3 = this.text(480, 470, 'Space to continue', 16, '#4fd1c5').setOrigin(0.5).setAlpha(0);
    c.add([t1, t2, t3]);
    this.tweens.add({ targets: [t1, t2, t3], alpha: 1, duration: 300, delay: 420 });
    await new Promise((r) => this.time.delayedCall(500, r));
    await this.waitKey();
    c.destroy();
    this.refreshHUD();
    this.close();
  }

  // ---------- the map: the course as a mind map ----------
  async showAtlas() {
    sfx.page();
    await this.page(() => openMap());
  }

  // ---------- the league: the final check ----------
  // Questions of level 2 and 3, spread over all houses and shuffled so that districts alternate.
  async league() {
    const byPlace = PLACES.map((p) => Phaser.Utils.Array.Shuffle(QUESTIONS.filter((q) => q.topic === p.id && q.stars >= 2))), picked = [];
    for (let round = 0; picked.length < LEAGUE.size && byPlace.some((l) => l.length > round); round++) for (const l of byPlace) if (l[round] && picked.length < LEAGUE.size) picked.push(l[round]);
    if (!picked.length) return;
    Phaser.Utils.Array.Shuffle(picked);
    let right = 0;
    for (let i = 0; i < picked.length; i++) {
      const res = await this.quiz(picked[i], { banner: `${LEAGUE.name}  ·  ${i + 1} of ${picked.length}` });
      if (res.ran) return;
      if (res.right) right += 1;
    }
    const name = LEAGUE.host?.name || 'Judge', need = Math.ceil(picked.length * LEAGUE.pass);
    if (right >= need) {
      state.passedLeague = true;
      save();
      await this.stamp(null, 'review');
      await this.say([`${right} of ${picked.length}. The league badge is yours.`], { name });
    } else await this.say([`${right} of ${picked.length}. You need ${need}.`, 'The map (Tab) shows which houses to visit again.'], { name });
  }
}
