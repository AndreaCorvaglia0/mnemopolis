import Phaser from 'phaser';
import { state, save, scoreAnswer } from '../systems/state.js';
import { sfx, initAudio, toggleMute, setMusicOn, duckMusic } from '../systems/audio.js';
import { openPlaque } from '../lab/museum.js';
import { COURSE, TOPICS, PLACES, PLACE, DISTRICTS, QUESTIONS, LEAGUE } from '../data/content.js';
import { openMap } from '../lab/map.js';
import { touch } from '../systems/view.js';
import { openLab } from '../lab/shell.js';
import { openReading } from '../lab/reading.js';
import { available as voiceAvailable, isOn as voiceOn, isSpeaking, onChange as onVoice, listen, speak, stop as stopVoice, toggle as toggleVoice, VOICE } from '../systems/voice.js';

// DotGothic16 for reading (clear C/O and 5/S at small sizes); Pixelify Sans for big display lines.
const BODY = '"DotGothic16", monospace';
const DISPLAY = '"Pixelify Sans", monospace';
const VW = 960, VH = 540; // virtual UI canvas; the camera scales it to the screen
const C = { bg: 0x141629, bg2: 0x1e2240, line: 0xe9e2c9, inner: 0x3a3f6b, teal: 0x4fd1c5, gold: 0xffcf5a, coral: 0xff7a6b, green: 0x7ddc8a, text: '#f1ecd9', muted: '#9aa0c3' };
const HUD_W = 100, HUD_H = 82;
const PORTRAIT_W = 600;
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
    this.input.keyboard.on('keydown-V', () => { const off = toggleMute(); if (off) stopVoice(); this.toast(off ? 'All sound off' : 'Sound on'); });
    // read-aloud on or off (only when the course has a voice); inside a dialogue L means Listen
    this.input.keyboard.on('keydown-L', () => { if (voiceAvailable() && !this.modals) this.switchVoice(); });
    // a browser that turns out unable to speak loses the voice controls
    let could = voiceAvailable();
    onVoice(() => { if (could && !voiceAvailable()) { could = false; if (this.where) this.setLocation(...this.where); } });
    this.layout();
    this.makeHUD();
    this.placeHUD();
    this.scale.on('resize', () => { this.layout(); this.placeHUD(); });
    window.addEventListener('touchmode', () => { if (this.where) this.setLocation(...this.where); this.placeHUD(); });
    this.ready = true;
    this.events.emit('ui-ready');
  }

  // The UI is laid out on a 960x540 virtual canvas. The camera zooms it to fit the
  // screen, and text is rendered at the same zoom so it stays sharp.
  layout() {
    const W = this.scale.width, H = this.scale.height;
    // Landscape: the 960 x 540 stage fits the screen. Portrait: the screen shows 600 virtual pixels
    // across (and as many down as it has), so text keeps a readable size on a phone.
    this.portrait = H > W;
    const k = this.portrait ? Math.min(W / PORTRAIT_W, H / VH) : Math.min(W / VW, H / VH);
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
  // The rectangle that dialogues, quizzes and cards are laid out in, in virtual pixels: the 960 x 540
  // stage in landscape, the whole visible area in portrait.
  frame() {
    const v = this.view, P = this.portrait;
    const x = P ? v.x0 : 0, y = P ? v.y0 : 0, w = P ? v.x1 - v.x0 : VW, h = P ? v.y1 - v.y0 : VH;
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, b: y + h, r: x + w, P, M: P ? 14 : 40, top: P ? HUD_H + 26 : 30 };
  }

  // words for the current input: keyboard or finger
  get touch() { return touch.on; }
  hintAct() { return this.touch ? 'Tap' : 'Space'; }

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

  panel(x, y, w, h, fill = C.bg, alpha = 0.95, border = C.line) { return this.panelInto(this.add.graphics(), x, y, w, h, fill, alpha, border); }

  panelInto(g, x, y, w, h, fill = C.bg, alpha = 0.95, border = C.line) {
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
    // on touch screens, buttons replace the key hints
    this.btns = this.add.container(0, 26);
    this.hudRight.add([this.loc, this.hint, this.btns]);
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
      { w: 12 + Math.max(this.loc.width, this.hint.width, this.touch ? this.btns.getBounds().width : 0) + 4, h: 10 + 24 + (this.touch ? 40 : this.hint.height) + 4 },
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
    const vk = voiceAvailable() ? '\nL  voice' : '';
    this.hint.setText(this.touch ? '' : where === 'town' ? `Tab  Map\nN  time of day\nG  grass questions\nM  music  ·  V  all sound${vk}` : `Tab  Map\nM  music  ·  V  all sound${vk}`);
    this.btns.removeAll(true);
    if (!this.touch) return;
    const items = [['Map', () => this.showAtlas()], [state.musicOff ? 'Music off' : 'Music on', () => { state.musicOff = !state.musicOff; save(); setMusicOn(!state.musicOff); this.setLocation(...this.where); }]];
    if (voiceAvailable()) items.push([voiceOn() ? 'Voice on' : 'Voice off', () => this.switchVoice()]);
    if (where === 'town') items.push([state.grassOff ? 'Grass off' : 'Grass on', () => { state.grassOff = !state.grassOff; save(); this.setLocation(...this.where); this.toast(state.grassOff ? 'Grass questions off' : 'Grass questions on'); }]);
    let x = 0;
    for (const [label, fn] of items.reverse()) {
      const t = this.text(0, 0, label, 17, C.text), w = Math.ceil(t.width) + 22;
      x -= w;
      const g = this.add.graphics().fillStyle(C.bg, 0.88).fillRoundedRect(x, 0, w, 36, 8).lineStyle(2, C.line, 0.9).strokeRoundedRect(x, 0, w, 36, 8);
      t.setPosition(x + 11, 7);
      const z = this.add.zone(x, 0, w, 36).setOrigin(0).setInteractive();
      z.on('pointerdown', (p, lx, ly, ev) => { ev?.stopPropagation(); if (!this.busy) { sfx.select(); fn(); } });
      this.btns.add([g, t, z]);
      x -= 8;
    }
  }

  switchVoice() {
    const on = toggleVoice();
    if (this.where) this.setLocation(...this.where);
    this.toast(on ? (this.touch ? 'Voice on: tap Listen on a page' : 'Voice on: L or Listen reads a page') : 'Voice off');
  }

  // A Listen / Stop control inside a dialogue box, at (x, y) with origin (1, 0.5). L does the same.
  // Returns a function that removes it and stops the voice; null when there is no voice.
  voiceButton(c, x, y, getText) {
    if (!voiceOn()) return null;
    const t = this.text(x, y, '', this.touch ? 17 : 14, C.muted).setOrigin(1, 0.5);
    // the tap area is larger than the word, for a finger
    const z = this.add.zone(x + 8, y, 120, 40).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    const draw = () => { const on = isSpeaking(); t.setText(this.touch ? (on ? 'Stop' : 'Listen') : on ? 'L  Stop' : 'L  Listen').setColor(on ? '#4fd1c5' : C.muted); };
    z.on('pointerdown', (p, lx, ly, ev) => { ev?.stopPropagation(); listen(getText); });
    c.add(z);
    const key = () => listen(getText);
    this.input.keyboard.on('keydown-L', key);
    const off = onVoice(draw);
    draw();
    c.add(t);
    return () => { off(); this.input.keyboard.off('keydown-L', key); stopVoice(); };
  }

  toast(msg, color = C.text) {
    const F = this.frame(), y = F.y + (F.P ? F.top + 24 : 92);
    const t = this.text(F.cx, y, msg, 22, color).setOrigin(0.5).setDepth(50).setAlpha(0);
    const bg = this.add.graphics().setDepth(49);
    const w = t.width + 36;
    bg.fillStyle(C.bg, 0.9).fillRoundedRect(F.cx - w / 2, y - 18, w, 38, 8).lineStyle(2, C.line, 0.8).strokeRoundedRect(F.cx - w / 2, y - 18, w, 38, 8);
    bg.setAlpha(0);
    this.tweens.add({ targets: [t, bg], alpha: 1, duration: 160, yoyo: true, hold: 1300, onComplete: () => { t.destroy(); bg.destroy(); } });
  }

  // ---------- title ----------
  showTitle() {
    this.open('title');
    return new Promise((resolve) => {
      const c = this.add.container(0, 0).setDepth(100);
      const shade = this.dim(0x0b0d1c, 0.25);
      const F = this.frame(), cy = F.cy, n = Math.max(8, COURSE.title.length), wrap = { wordWrap: { width: F.w - 60 }, align: 'center' };
      const title = this.text(F.cx, cy - 100, COURSE.title.toUpperCase(), Math.min(76, Math.floor((F.w * 1.05) / n)), '#ffcf5a', { display: true, fontStyle: '600', stroke: '#1b1a2b', strokeThickness: 10 }).setOrigin(0.5);
      const sub = this.text(F.cx, cy - 32, COURSE.subject, 24, '#f1ecd9', { display: true, stroke: '#1b1a2b', strokeThickness: 6, ...wrap }).setOrigin(0.5);
      const press = this.text(F.cx, cy + 110, this.touch ? 'Tap to start' : 'Press Space or click to start', 26, '#4fd1c5', { display: true, stroke: '#1b1a2b', strokeThickness: 6 }).setOrigin(0.5);
      const ctr = this.text(F.cx, cy + 156, this.touch ? 'Tap where you want to go.\nTap a person, a sign or a door to use it.' : 'Arrows or WASD to walk  ·  Shift to run  ·  Space to talk  ·  or click where you want to go', 16, '#f1ecd9', { stroke: '#1b1a2b', strokeThickness: 5, ...wrap }).setOrigin(0.5);
      const cred = this.text(F.cx, F.b - 28, COURSE.credit || '', 13, '#cfd3e8', { stroke: '#1b1a2b', strokeThickness: 4, ...wrap }).setOrigin(0.5);
      c.add([shade, title, sub, press, ctr, cred]);
      this.tweens.add({ targets: press, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: title, y: title.y - 6, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.waitKey().then(() => {
        sfx.confirm();
        this.tweens.add({ targets: c, alpha: 0, duration: 450, onComplete: () => { c.destroy(); this.setHudVisible(true); this.close(); resolve(); } });
      });
    });
  }

  // ---------- dialogue ----------
  // Where is the player on screen? Used to keep dialogue boxes off the characters.
  playerScreenY() {
    for (const key of ['Town', 'Interior', 'Workshop', 'Museum']) {
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
    const F = this.frame(), pw = F.w - 2 * F.M, x0 = F.x + F.M, wrap = pw - 60;
    // the box is as tall as the longest line needs
    const probe = this.text(0, 0, '', 23, C.text, { wordWrap: { width: wrap } });
    let th = 0;
    for (const l of lines) { probe.setText(l); th = Math.max(th, probe.height); }
    probe.destroy();
    const talk = !!name && voiceOn(); // people and signs can be read aloud
    const ph = Math.max(140, Math.ceil(th) + 64 + (talk ? 14 : 0));
    const atTop = this.playerScreenY() > F.y + F.h * 0.6;
    const py = atTop ? F.y + F.top : F.b - 20 - ph;
    const c = this.add.container(0, 0).setDepth(60);
    c.add(this.panel(x0, py, pw, ph));
    if (name) {
      const tw = this.text(0, 0, name, 18, '#1b1a2b', { fontStyle: '600' });
      const g = this.add.graphics();
      g.fillStyle(C.gold, 1).fillRoundedRect(x0 + 20, py - 18, tw.width + 26, 32, 7).lineStyle(2, 0x1b1a2b, 1).strokeRoundedRect(x0 + 20, py - 18, tw.width + 26, 32, 7);
      tw.setPosition(x0 + 33, py - 13);
      c.add([g, tw]);
    }
    const body = this.text(x0 + 28, py + 24, '', 23, C.text, { wordWrap: { width: wrap } });
    const arrow = this.text(x0 + pw - 30, py + ph - 32, '▼', 18, '#ffcf5a').setOrigin(0.5);
    c.add([body, arrow]);
    this.tweens.add({ targets: arrow, y: arrow.y + 6, duration: 400, yoyo: true, repeat: -1 });
    let current = '';
    const unvoice = talk ? this.voiceButton(c, x0 + pw - 54, py + ph - 30, () => current) : null;
    for (const line of lines) {
      arrow.setVisible(false);
      current = line;
      stopVoice();
      if (unvoice && VOICE.auto) speak(line);
      await this.typewrite(body, line);
      arrow.setVisible(true);
      const key = await this.waitKey(['SPACE', 'ENTER', 'E', 'ESC']);
      sfx.blip();
      if (key === 'ESC') break; // walk away at any point
    }
    unvoice?.();
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
    if (textOrNull === this.promptText && this.promptTouch === this.touch) return;
    this.promptText = textOrNull;
    this.promptTouch = this.touch;
    this.promptBox?.destroy();
    this.promptBox = null;
    if (!textOrNull) return;
    const F = this.frame(), y = F.b - 28, label = this.touch ? textOrNull.replace(/^Space {2}/, 'Tap here: ') : textOrNull;
    const t = this.text(F.cx, y, label, this.touch ? 19 : 16, '#1b1a2b').setOrigin(0.5);
    const w = t.width + 24, h = this.touch ? 36 : 28;
    const g = this.add.graphics();
    g.fillStyle(C.gold, 0.95).fillRoundedRect(F.cx - w / 2, y - h / 2, w, h, 8);
    const z = this.add.zone(F.cx - w / 2, y - h / 2, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    z.on('pointerdown', (p, lx, ly, ev) => { ev?.stopPropagation(); this.actRequest = true; });
    this.promptBox = this.add.container(0, 0, [g, t, z]).setDepth(12);
  }

  typewrite(textObj, line) {
    return new Promise((resolve) => {
      let i = 0;
      let finished = false;
      const finish = () => { if (finished) return; finished = true; ev.remove(); textObj.setText(line); this.input.keyboard.off('keydown-SPACE', skip); this.input.keyboard.off('keydown-ENTER', skip); this.input.off('pointerdown', skip); resolve(); };
      const skip = () => finish();
      const ev = this.time.addEvent({ delay: 18, loop: true, callback: () => {
        i += 1;
        textObj.setText(line.slice(0, i));
        if (i % 3 === 0) sfx.blip();
        if (i >= line.length) finish();
      } });
      this.time.delayedCall(80, () => { if (!finished) { this.input.keyboard.once('keydown-SPACE', skip); this.input.keyboard.once('keydown-ENTER', skip); this.input.once('pointerdown', skip); } });
    });
  }

  // ---------- choice ----------
  // Resolves with the index picked, or -1 if the player presses Esc.
  async choose(question, options, { name = '' } = {}) {
    this.open('choose');
    const F = this.frame(), pw = F.w - 2 * F.M, x0 = F.x + F.M, rowH = this.touch ? 46 : 32;
    const c = this.add.container(0, 0).setDepth(60);
    const q = this.text(x0 + 28, 0, question, 21, C.text, { wordWrap: { width: pw - 60 } });
    const texts = options.map((o) => this.text(x0 + 70, 0, o, 21, C.text, { wordWrap: { width: pw - 100 } }));
    const hs = texts.map((t) => Math.max(rowH, Math.ceil(t.height) + 10));
    const H = (name ? 30 : 0) + q.height + 30 + hs.reduce((a, b) => a + b, 0) + 34, top = F.b - 16 - H;
    c.add(this.panel(x0, top, pw, H));
    if (name) c.add(this.text(x0 + 28, top + 14, name, 16, '#ffcf5a'));
    // a person's line can be read aloud; the learner's own options are not read
    const unvoice = name ? this.voiceButton(c, x0 + pw - 28, top + 24, () => question) : null;
    if (unvoice && VOICE.auto) speak(question);
    q.setY(top + (name ? 42 : 18));
    c.add(q);
    let y = q.y + q.height + 16;
    const rows = texts.map((t, i) => {
      const h = hs[i], ty = y + (h - t.height) / 2 - 2;
      t.setY(ty);
      const z = this.add.zone(x0 + 50, y - 4, pw - 80, h).setOrigin(0).setInteractive({ useHandCursor: true });
      c.add([t, z]);
      const r = { t, z, y: ty };
      y += h;
      return r;
    });
    const cursor = this.text(x0 + 44, rows[0].y, '▶', 19, '#4fd1c5');
    const leave = this.text(x0 + pw - 28, top + H - 20, this.touch ? 'Leave  ✕' : 'Esc to leave', this.touch ? 16 : 13, C.muted).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    c.add([cursor, leave]);
    let sel = 0;
    const draw = () => { cursor.setY(rows[sel].y); rows.forEach((r, i) => r.t.setColor(i === sel ? '#4fd1c5' : C.text)); };
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
      leave.on('pointerdown', esc);
    });
    sfx.select();
    unvoice?.();
    c.destroy();
    this.close();
    return choice;
  }

  // ---------- quiz card ----------
  // Lays out the question and options, shrinking the type until everything fits
  // above the confidence buttons.
  quizBody(q, tx, tw, qy, limit, rowMin) {
    let body = null;
    for (const [qs, os] of [[24, 19], [21, 17], [19, 15], [17, 14]]) {
      if (body) body.destroy();
      body = this.add.container(0, 0);
      const qt = this.text(tx, qy, q.q, qs, C.text, { wordWrap: { width: tw } });
      body.add(qt);
      let y = Math.max(qt.y + qt.height + 16, qy + 68);
      body.rows = q.options.map((o, i) => {
        const t = this.text(tx + 48, 0, o, os, C.text, { wordWrap: { width: tw - 62 } }).setOrigin(0, 0.5);
        const h = Math.max(rowMin, Math.ceil(t.height) + 16);
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
      if (body.bottom <= limit) break;
    }
    return body;
  }

  async quiz(q, { banner = '' } = {}) {
    this.open('quiz-choose');
    const F = this.frame(), P = F.P;
    const cw = P ? F.w - 24 : 820, x0 = P ? F.x + 12 : F.x + 70, tx = x0 + 34, tw = cw - 68;
    const top = P ? F.y + F.top - 8 : F.y + 24;
    const c = this.add.container(0, 0).setDepth(70);
    c.add(this.dim(0x070812, 0.62));
    const card = this.add.graphics();
    c.add(card);
    const drawCard = (h) => this.panelInto(card.clear(), x0, top, cw, h);
    const topic = q.topic ? TOPICS[q.topic].name.toUpperCase() : 'CASE REVIEW';
    const chipT = this.text(0, top + 40, topic, 15, '#ffffff').setOrigin(0.5);
    const chipW = Math.round(chipT.width) + 28;
    chipT.setX(x0 + 26 + chipW / 2);
    const chip = this.add.graphics().fillStyle(TOPIC_COL[q.topic || 'review'], 1).fillRoundedRect(x0 + 26, top + 26, chipW, 28, 6);
    const sg = this.add.graphics();
    for (let i = 0; i < 3; i++) this.star(sg, x0 + 42 + chipW + i * 26, top + 40, 10, i < q.stars ? C.gold : 0x3a3f6b);
    const leave = this.text(x0 + cw - 26, top + 40, this.touch ? 'Leave  ✕' : 'Esc to leave', this.touch ? 16 : 13, C.muted).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    c.add([chip, chipT, sg, leave]);
    let qy = top + 68;
    if (banner) { c.add(this.text(tx - 8, top + 72, banner, 15, '#4fd1c5')); qy += 26; }
    const body = this.quizBody(q, tx, tw, qy, P ? Infinity : top + 392, this.touch ? 52 : 44);
    c.add(body);
    const rows = body.rows;
    const by = P ? body.bottom + 18 : Math.max(top + 380, body.bottom + 14);
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
    let sel = this.touch ? -1 : 0;
    drawRows(sel);
    this.quizState = { answer: q.answer, sel: () => sel };
    const help = this.text(F.cx, by + 16, this.touch ? 'Tap an answer' : '↑ ↓ to choose, Space to confirm', 15, C.muted).setOrigin(0.5);
    c.add(help);
    drawCard(P ? help.y + 30 - top : 492);

    const choice = await new Promise((resolve) => {
      const move = (d) => { sel = (Math.max(sel, 0) + d + rows.length) % rows.length; sfx.blip(); drawRows(sel); };
      const up = () => move(-1), down = () => move(1);
      const ok = () => { if (sel < 0) return; cleanup(); resolve(sel); };
      const quit = () => { cleanup(); resolve(-1); };
      const ev = [['keydown-UP', up], ['keydown-W', up], ['keydown-DOWN', down], ['keydown-S', down], ['keydown-SPACE', ok], ['keydown-ENTER', ok], ['keydown-ESC', quit]];
      const cleanup = () => { ev.forEach(([e, f]) => this.input.keyboard.off(e, f)); leave.off('pointerdown', quit); };
      this.time.delayedCall(150, () => ev.forEach(([e, f]) => this.input.keyboard.on(e, f)));
      leave.on('pointerdown', quit);
      rows.forEach((r, i) => { r.z.on('pointerover', () => { if (!this.touch) { sel = i; drawRows(sel); } }); r.z.on('pointerdown', () => { sel = i; drawRows(sel); ok(); }); });
    });
    if (choice === -1) { c.destroy(); this.close(); return { ran: true }; }
    sfx.select();

    // confidence bet: three buttons in a row, or stacked on a narrow screen
    rows.forEach((r) => r.z.disableInteractive());
    help.setText(this.touch ? 'How sure are you? Tap one.' : 'How sure are you?  1, 2 or 3  (or click)');
    this.phase = 'quiz-bet';
    const bets = [['Guessing', '+1 / 0'], ['Fairly sure', '+2 / -2'], ['Certain', '+3 / -6']];
    const bw = P ? tw : 236, bh = 58;
    help.setY(by + 10);
    const b0 = by + 28;
    const betObjs = bets.map(([label, pay], i) => {
      const x = P ? tx : tx + i * 258, y = P ? b0 + i * (bh + 8) : b0;
      const g = this.add.graphics();
      g.fillStyle(C.bg2, 1).fillRoundedRect(x, y, bw, bh, 8).lineStyle(2, [C.teal, C.gold, C.coral][i], 1).strokeRoundedRect(x, y, bw, bh, 8);
      const t1 = this.text(x + bw / 2, y + 19, `${i + 1}  ${label}`, 19, C.text).setOrigin(0.5);
      const t2 = this.text(x + bw / 2, y + 41, `marks ${pay}  × ${q.stars * 5}`, 14, C.muted).setOrigin(0.5);
      const z = this.add.zone(x, y, bw, bh).setOrigin(0).setInteractive({ useHandCursor: true });
      c.add([g, t1, t2, z]);
      return [g, t1, t2, z];
    });
    const betBottom = P ? b0 + 3 * (bh + 8) - 8 : b0 + bh;
    drawCard(P ? betBottom + 20 - top : 492);
    const conf = await new Promise((resolve) => {
      const pick = (v) => { cleanup(); resolve(v); };
      const k1 = () => pick(1), k2 = () => pick(2), k3 = () => pick(3), quit = () => pick(0);
      const ev = [['keydown-ONE', k1], ['keydown-TWO', k2], ['keydown-THREE', k3], ['keydown-ESC', quit]];
      const cleanup = () => { ev.forEach(([e, f]) => this.input.keyboard.off(e, f)); leave.off('pointerdown', quit); };
      this.time.delayedCall(120, () => ev.forEach(([e, f]) => this.input.keyboard.on(e, f)));
      leave.on('pointerdown', quit);
      betObjs.forEach((b, i) => b[3].on('pointerdown', () => pick(i + 1)));
    });
    betObjs.forEach((b) => b.forEach((o) => o.destroy()));
    if (!conf) { c.destroy(); this.close(); return { ran: true }; }
    leave.setVisible(false);
    const right = choice === q.answer;
    const delta = scoreAnswer(q, right, conf);
    (right ? sfx.right : sfx.wrong)();
    drawRows(-1, { choice });
    this.refreshHUD();

    // reveal: the box grows with the explanation
    const verdict = right ? ['Right!', 'Spot on.', 'Exactly.'][Math.floor(Math.random() * 3)] : 'Not quite.';
    const dtxt = `${delta >= 0 ? '+' : ''}${delta} Insight`;
    const rx = x0 + 26, rw = cw - 52;
    let why, dt, bh2;
    if (P) {
      dt = this.text(rx + rw - 14, by + 22, dtxt, 22, delta > 0 ? '#ffcf5a' : delta < 0 ? '#ff7a6b' : '#cfd3e8').setOrigin(1, 0.5);
      why = this.text(rx + 14, by + 44, `${verdict}  ${q.why}`, 17, C.text, { wordWrap: { width: rw - 28 } });
      bh2 = Math.ceil(why.height) + 58;
    } else {
      why = this.text(rx + 20, by + 12, `${verdict}  ${q.why}`, 16, C.text, { wordWrap: { width: 580 } });
      if (by + why.height + 24 > top + 464) { why.destroy(); why = this.text(rx + 20, by + 10, `${verdict}  ${q.why}`, 14, C.text, { wordWrap: { width: 600 } }); }
      bh2 = Math.max(64, Math.ceil(why.height) + 22);
      dt = this.text(rx + rw - 16, by + bh2 / 2, dtxt, 24, delta > 0 ? '#ffcf5a' : delta < 0 ? '#ff7a6b' : '#cfd3e8').setOrigin(1, 0.5);
    }
    const rg = this.add.graphics().fillStyle(right ? 0x163b2c : 0x3b1620, 1).fillRoundedRect(rx, by, rw, bh2, 8).lineStyle(2, right ? C.green : C.coral, 1).strokeRoundedRect(rx, by, rw, bh2, 8);
    c.add([rg, why, dt]);
    this.tweens.add({ targets: dt, scale: { from: 1.6, to: 1 }, duration: 300, ease: 'Back.easeOut' });
    help.setText(this.touch ? 'Tap to continue' : 'Space to continue').setY(P ? by + bh2 + 22 : Math.min(top + 482, by + bh2 + 16));
    drawCard(P ? help.y + 26 - top : 492);
    this.phase = 'quiz-reveal';
    await this.waitKey();
    c.destroy();
    this.close();
    return { right, conf, delta };
  }

  // ---------- a question from the tall grass: always an offer, never a trap ----------
  async encounter(q) {
    sfx.encounter();
    const pick = await this.choose('Something rustles in the grass: a question. Take it?', ['Take it', 'Not now', this.touch ? 'Stop asking  (the Grass button turns them back on)' : 'Stop asking  (G turns them back on)']);
    if (pick === 2) { state.grassOff = true; save(); this.toast('Grass questions off'); if (this.where) this.setLocation(...this.where); }
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
    const F = this.frame();
    const holder = this.add.container(F.cx, F.cy - 40, [g]).setScale(3).setAngle(-25).setAlpha(0);
    if (kind !== 'atlas') holder.add(this.text(0, -10, kind === 'review' ? 'PASS' : TOPICS[topic].name.toUpperCase(), kind === 'review' ? 40 : 19, '#ffffff', { display: kind === 'review', fontStyle: '600', align: 'center' }).setOrigin(0.5));
    c.add(holder);
    this.tweens.add({ targets: holder, scale: 1, angle: kind === 'atlas' ? 0 : -8, alpha: 1, duration: 380, ease: 'Back.easeOut', onComplete: () => this.cameras.main.shake(180, 0.008) });
    const t1 = this.text(F.cx, F.cy + 102, label, 32, '#ffcf5a', { stroke: '#1b1a2b', strokeThickness: 5, wordWrap: { width: F.w - 40 }, align: 'center' }).setOrigin(0.5).setAlpha(0);
    const t2 = this.text(F.cx, F.cy + 150, sub, 20, C.text, { wordWrap: { width: F.w - 60 }, align: 'center' }).setOrigin(0.5, 0).setAlpha(0);
    const t3 = this.text(F.cx, F.b - 40, this.touch ? 'Tap to continue' : 'Space to continue', 16, '#4fd1c5').setOrigin(0.5).setAlpha(0);
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
    } else await this.say([`${right} of ${picked.length}. You need ${need}.`, this.touch ? 'The Map button shows which houses to visit again.' : 'The map (Tab) shows which houses to visit again.'], { name });
  }
}
