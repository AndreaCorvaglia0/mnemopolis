import Phaser from 'phaser';
import { T, MAP_W, MAP_H, TERRAIN, BUILDINGS, LAMPS, SIGNS, NPCS, MONUMENTS, PROPS, QUARTERS, HUB, START, terrainAt, quarterAt } from '../world/townMap.js';
import { state, save, pickQuestion } from '../systems/state.js';
import { sfx, initAudio, setMusic, setFire, setSea } from '../systems/audio.js';
import { COURSE, DIALOG, TALK, QUESTIONS, LEAGUE } from '../data/content.js';
import { Walker } from '../systems/walker.js';
import { TapNav } from '../systems/tapnav.js';
import { townZoom } from '../systems/view.js';
import { hash } from '../art/px.js';
import { GEN } from '../gen/core.js';
import { addDressing } from '../gen/dressing.js';
import { attachTownLife } from '../mechanics/town.js';

const TOD = {
  dusk: { dark: 0.44, tint: 0x2a1d55, lit: 0.95, glow: 0.85, beam: 0.6, fire: 0.75, sun: 0.55, spark: 0.9 },
  night: { dark: 0.7, tint: 0x0b1030, lit: 1, glow: 1, beam: 0.95, fire: 1, sun: 0, spark: 0.5 },
  day: { dark: 0, tint: 0x000000, lit: 0, glow: 0, beam: 0, fire: 0, sun: 0, spark: 0.7 },
};
const ORDER = ['dusk', 'night', 'day'];
let titleShown = false;

export class Town extends Phaser.Scene {
  constructor() { super('Town'); }

  create(data = {}) {
    this.ui = this.scene.get('UI');
    this.locked = false; // the scene object is reused: a lock left over from entering a door froze the player
    this.tod = this.registry.get('tod') || 'night';
    this.cur = { ...TOD[this.tod] };
    this.lights = [];
    this.glows = [];
    this.grass = [];
    this.npcs = [];
    this.objects = new Map(); // "x,y" -> { kind, ... }
    this.blocked = new Uint8Array(MAP_W * MAP_H);

    this.add.image(0, 0, 'ground').setOrigin(0).setDepth(0);
    this.makeWater();
    this.makeTerrainObjects();
    this.makeBuildings();
    this.makeProps();
    if (GEN.dressing) addDressing(this); // optional small things: gardens, fences, jetty... (gen/dressing.js)
    this.makeNPCs();

    const p = data.from ? this.exitTile(data.from) : state.pos || START;
    this.player = new Walker(this, 'ch-player', p.x, p.y, p.dir || 'up');
    this.lights.push({ follow: this.player.sprite, r: 30, oy: -10 });

    this.makeLighting();
    this.makeAtmosphere();

    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W * T, MAP_H * T);
    cam.setRoundPixels(true);
    // a tap on a building means its door
    this.nav = new TapNav(this, { w: MAP_W, h: MAP_H, redirect: (x, y) => { const b = BUILDINGS.find((o) => !o.home && x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h); return b ? b.doors[0] : null; } });
    this.layout();
    this.life = attachTownLife(this); // optional ambient life: thoughts, animals, secrets, obstacles (src/mechanics/)
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
    if (!this.registry.get('lite')) {
      cam.postFX.addVignette(0.5, 0.5, 0.92, 0.3);
      cam.postFX.addBloom(0xffffff, 1, 1, 1, 0.3, 4);
    }
    const dropFx = () => cam.postFX.clear();
    this.game.events.on('lite', dropFx);
    this.events.once('shutdown', () => this.game.events.off('lite', dropFx));

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT,SPACE,ENTER,E,N,M,TAB,ESC');
    this.input.keyboard.on('keydown', () => initAudio());
    this.input.keyboard.on('keydown-N', () => { if (!this.ui.busy) this.cycleTime(); });
    this.input.keyboard.on('keydown-G', () => { if (this.ui.busy) return; state.grassOff = !state.grassOff; save(); this.ui.toast(state.grassOff ? 'Grass questions off' : 'Grass questions on'); });
    this.input.keyboard.on('keydown-TAB', (e) => { e.preventDefault?.(); if (!this.ui.busy) this.ui.showAtlas(); });
    this.grassSteps = 0;

    const ready = () => {
      if (!titleShown) {
        titleShown = true;
        // Slow drift over the bay behind the title.
        const q0 = QUARTERS[0], eye = { x: ((q0.x0 + q0.x1) / 2) * T, y: ((q0.y0 + q0.y1) / 2) * T };
        cam.centerOn(eye.x, eye.y);
        const drift = this.tweens.add({ targets: eye, x: HUB.x * T, y: HUB.y * T, duration: 16000, ease: 'Sine.easeInOut', onUpdate: () => cam.centerOn(eye.x, eye.y) });
        this.ui.showTitle().then(() => {
          drift.stop();
          if (!this.sys.isActive()) return;
          cam.pan(this.player.sprite.x, this.player.sprite.y, 900, 'Sine.easeInOut', false, (c, t) => {
            if (t === 1) {
              cam.startFollow(this.player.sprite, true, 0.15, 0.15);
              if (!state.seenIntro) this.intro();
            }
          });
        });
      } else {
        cam.startFollow(this.player.sprite, true, 0.15, 0.15);
        cam.fadeIn(250);
      }
    };
    if (this.ui.ready) ready(); else this.ui.events.once('ui-ready', ready);
    this.where = null; this.showWhere(this.player.tx, this.player.ty);
    setMusic(this.tod === 'night' ? 'night' : 'town'); setFire(0); setSea(0.035);
  }

  // Whole-number zoom keeps every art pixel the same size; aim for a view of about 320x180.
  layout() {
    const W = this.scale.width, H = this.scale.height;
    const cam = this.cameras.main;
    cam.setSize(W, H);
    cam.setZoom(townZoom(W, H));
    if (this.brush) this.sizeDark();
  }

  exitTile(id) {
    const b = BUILDINGS.find((x) => x.id === id);
    const [dx, dy] = b.doors[0];
    return { x: dx, y: dy + 1, dir: 'down' };
  }

  // ---------- world building ----------
  block(x, y) { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) this.blocked[y * MAP_W + x] = 1; }

  makeWater() {
    this.foamA = this.add.image(0, 0, 'foam-0').setOrigin(0).setDepth(1);
    this.foamB = this.add.image(0, 0, 'foam-1').setOrigin(0).setDepth(1).setAlpha(0);
    this.tweens.add({ targets: this.foamA, alpha: 0.25, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.foamB, alpha: 0.85, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.sparkles = [];
    const spots = [...this.registry.get('sparkles')];
    for (let k = 0; k < 60; k++) spots.push([10 + hash(k, 3) * 300, MAP_H * T - 4 - hash(k, 4) * 80]); // sunset glitter path
    spots.forEach(([x, y], i) => {
      if (terrainAt(Math.floor(x / T), Math.floor(y / T)) !== '~') return;
      const s = this.add.image(x, y, 'sparkle').setDepth(2).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      this.tweens.add({ targets: s, alpha: { from: 0, to: 0.85 }, duration: 380 + (i % 5) * 120, yoyo: true, repeat: -1, delay: (i * 137) % 3000, repeatDelay: 900 + (i * 53) % 2400 });
      this.sparkles.push(s);
    });
  }

  makeTerrainObjects() {
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
      const ch = TERRAIN[y][x];
      if ('~ReTbF'.includes(ch)) this.block(x, y);
      if (ch === 'T') {
        const ox = (hash(x, y, 8) - 0.5) * 4;
        this.add.image(x * T + 8 + ox + 3, y * T + 15, 'shadow-m').setDepth(3).setAlpha(0.9);
        this.add.image(x * T + 8 + ox, y * T + 16, `tree-${hash(x, y, 2) > 0.5 ? 1 : 0}`).setOrigin(0.5, 1).setDepth(y * T + 16);
      } else if (ch === 'F') {
        const vert = TERRAIN[y - 1]?.[x] === 'F' || TERRAIN[y + 1]?.[x] === 'F';
        this.add.image(x * T, y * T, vert && !(TERRAIN[y][x - 1] === 'F' || TERRAIN[y][x + 1] === 'F') ? 'fence-v' : 'fence-h').setOrigin(0).setDepth(y * T + 12);
      } else if (ch === 'b') {
        this.add.image(x * T + 8, y * T + 16, 'bush').setOrigin(0.5, 1).setDepth(y * T + 15);
      } else if (ch === 'G') {
        const flip = hash(x, y, 9) > 0.5;
        const back = this.add.image(x * T, y * T, 'grass-back-0').setOrigin(0).setDepth(y * T + 1).setFlipX(flip);
        const front = this.add.image(x * T, y * T, 'grass-front-0').setOrigin(0).setDepth(y * T + T + 2).setFlipX(flip);
        this.grass.push({ x, y, back, front, sway: 0 });
      }
    }
    this.grassIndex = new Map(this.grass.map((g) => [`${g.x},${g.y}`, g]));
    this.time.addEvent({ delay: 280, loop: true, callback: () => {
      for (let i = 0; i < 10; i++) {
        const g = this.grass[(Math.random() * this.grass.length) | 0];
        if (!g) return;
        g.sway = 1 - g.sway;
        g.back.setTexture(`grass-back-${g.sway}`);
        g.front.setTexture(`grass-front-${g.sway}`);
      }
    } });
  }

  makeBuildings() {
    const info = this.registry.get('buildings');
    this.doors = new Map();
    for (const b of BUILDINGS) {
      const res = info[b.id];
      const bx = b.x * T, by = (b.y + b.h) * T;
      const H = res.canvas.height;
      this.add.rectangle(bx + 5, by - 3, b.w * T, 8, 0x10121f, 0.22).setOrigin(0).setDepth(2);
      this.add.image(bx, by, `bld-${b.id}`).setOrigin(0, 1).setDepth(by - 1);
      const lit = this.add.image(bx, by, `bld-${b.id}-lit`).setOrigin(0, 1).setDepth(by - 0.5).setAlpha(this.cur.lit);
      this.glows.push({ img: lit, kind: 'lit' });
      for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) this.block(x, y);
      b.doors.forEach(([dx, dy]) => this.doors.set(`${dx},${dy}`, b));
      for (const [gx, gy, kind] of res.glows) {
        const wx = bx + gx, wy = by - H + gy;
        if (kind === 'lantern') {
          this.lantern = { x: wx, y: wy };
          this.lights.push({ x: wx, y: wy, r: 60 });
          this.addGlow(wx, wy, 'glow', 2.2, 'lantern');
        } else if (kind === 'teal') {
          this.addGlow(wx, wy, 'glow-teal', 1.1, 'glow');
          this.lights.push({ x: wx, y: wy, r: 26 });
        } else {
          this.addGlow(wx, wy, 'glow', 0.45, 'glow');
          this.lights.push({ x: wx, y: wy, r: 16 });
        }
      }
    }
  }

  addGlow(x, y, key, scale, kind) {
    const g = this.add.image(x, y, key).setDepth(9001).setBlendMode(Phaser.BlendModes.ADD).setScale(scale).setAlpha(this.cur.glow);
    this.glows.push({ img: g, kind });
    return g;
  }

  makeProps() {
    for (const [x, y] of LAMPS) {
      this.add.image(x * T + 8, y * T + 16, 'lamp').setOrigin(0.5, 1).setDepth(y * T + 15);
      this.add.image(x * T + 9, y * T + 15, 'shadow-s').setDepth(3);
      this.block(x, y);
      this.lights.push({ x: x * T + 8, y: y * T - 10, r: 54 });
      this.addGlow(x * T + 8, y * T - 10, 'glow', 0.9, 'glow');
    }
    for (const s of SIGNS) {
      this.add.image(s.x * T + 8, s.y * T + 16, 'sign').setOrigin(0.5, 1).setDepth(s.y * T + 14);
      this.block(s.x, s.y);
      this.objects.set(`${s.x},${s.y}`, { kind: 'sign', lines: s.lines });
    }
    PROPS.forEach(([x, y, k]) => {
      this.add.image(x * T + 8, y * T + 15, k).setOrigin(0.5, 1).setDepth(y * T + 14);
      this.block(x, y);
    });
    // landmarks: the visual anchor of each district. Reading one recalls the district's idea and its houses.
    for (const mn of MONUMENTS) {
      this.add.image(mn.x * T + 18, (mn.y + 1) * T - 1, 'shadow-l').setDepth(3);
      this.add.image(mn.x * T, (mn.y + 1) * T, `mon-${mn.kind}`).setOrigin(0, 1).setDepth((mn.y + 1) * T - 2);
      this.block(mn.x, mn.y); this.block(mn.x + 1, mn.y);
      const o = { kind: 'monument', lines: mn.lines, title: mn.title };
      this.objects.set(`${mn.x},${mn.y}`, o); this.objects.set(`${mn.x + 1},${mn.y}`, o);
      this.lights.push({ x: mn.x * T + 16, y: mn.y * T - 6, r: 40 });
    }
  }

  makeNPCs() {
    for (const n of NPCS) {
      const w = new Walker(this, `ch-${n.look}`, n.x, n.y, n.dir);
      w.def = n;
      w.home = n.dir;
      this.npcs.push(w);
    }
    this.time.addEvent({ delay: 2600, loop: true, callback: () => {
      for (const w of this.npcs) {
        
        if (this.ui.busy || Math.random() > 0.35) continue;
        w.face(Phaser.Utils.Array.GetRandom(['up', 'down', 'left', 'right']));
      }
    } });
  }

  npcAt(x, y) { return this.npcs.find((n) => n.tx === x && n.ty === y); }

  canEnter = (x, y) => {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return false;
    const door = this.doors.get(`${x},${y}`);
    if (door) return { door };
    if (this.blocked[y * MAP_W + x]) return false;
    if (this.npcAt(x, y)) return false;
    return true;
  };

  // ---------- light and atmosphere ----------
  makeLighting() {
    const W = MAP_W * T, H = MAP_H * T;
    this.sizeDark();
    this.brush = this.make.image({ key: 'light', add: false });
    if (this.lantern) {
      this.beam = this.add.image(this.lantern.x, this.lantern.y, 'beam').setOrigin(0, 0.5).setDepth(9002).setBlendMode(Phaser.BlendModes.ADD).setAlpha(this.cur.beam);
      this.beamBrush = this.make.image({ key: 'beam', add: false }).setOrigin(0, 0.5);
    }
    this.sun = this.add.image(-40, H + 30, 'glow').setScale(9, 6).setDepth(9001).setBlendMode(Phaser.BlendModes.ADD).setAlpha(this.cur.sun).setTint(0xff9a5a);
  }

  // The darkness layer covers only what the camera sees (plus a margin), not the whole map:
  // the map can be large, and a map-sized layer redrawn every frame is slow on weak machines.
  sizeDark() {
    const cam = this.cameras.main, w = Math.ceil(cam.width / cam.zoom) + 16, h = Math.ceil(cam.height / cam.zoom) + 16;
    if (this.dark && this.dark.width === w && this.dark.height === h) return;
    this.dark?.destroy();
    this.dark = this.add.renderTexture(0, 0, w, h).setOrigin(0).setDepth(9000);
  }

  makeAtmosphere() {
    this.fireflies = [];
    const spots = [];
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if ('GTb'.includes(TERRAIN[y][x]) && hash(x, y, 77) > 0.86) spots.push([x, y]);
    spots.slice(0, 34).forEach(([x, y], i) => {
      const f = this.add.image(x * T + 8, y * T + 4, 'firefly').setDepth(9003).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      this.tweens.add({ targets: f, x: `+=${(hash(i, 1) - 0.5) * 40}`, y: `+=${(hash(i, 2) - 0.5) * 30}`, duration: 2600 + hash(i, 3) * 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      f.phase = hash(i, 4) * 6.28;
      this.fireflies.push(f);
    });
  }

  cycleTime() {
    const next = ORDER[(ORDER.indexOf(this.tod) + 1) % ORDER.length];
    this.tod = next;
    this.registry.set('tod', next);
    setMusic(next === 'night' ? 'night' : 'town');
    this.tweens.addCounter({ from: 0, to: 1, duration: 1200, onUpdate: (tw) => {
      const t = tw.getValue();
      const a = { ...this.cur }, b = TOD[next];
      for (const k of ['dark', 'lit', 'glow', 'beam', 'fire', 'sun', 'spark']) this.cur[k] = a[k] + (b[k] - a[k]) * t;
      this.cur.tint = b.tint;
    } });
    this.ui.toast({ dusk: 'Dusk', night: 'Night', day: 'Day' }[next]);
  }

  updateLighting(time) {
    const c = this.cur;
    const v = this.cameras.main.worldView, ox = Math.floor(v.x) - 8, oy = Math.floor(v.y) - 8, dw = this.dark.width, dh = this.dark.height;
    this.dark.setPosition(ox, oy);
    this.dark.clear();
    if (c.dark > 0.01) {
      this.dark.fill(c.tint, c.dark);
      for (const l of this.lights) {
        const x = l.follow ? l.follow.x : l.x, y = l.follow ? l.follow.y + (l.oy || 0) : l.y;
        if (x < ox - l.r || y < oy - l.r || x > ox + dw + l.r || y > oy + dh + l.r) continue;
        this.brush.setScale((l.r * 2) / 128 * (1 + Math.sin(time / 300 + x) * 0.02));
        this.dark.erase(this.brush, x - ox, y - oy);
      }
      if (this.beam) {
        this.beamBrush.setRotation(this.beam.rotation).setAlpha(0.8);
        this.dark.erase(this.beamBrush, this.lantern.x - ox, this.lantern.y - oy);
      }
    }
    for (const g of this.glows) g.img.setAlpha(g.kind === 'lit' ? c.lit : g.kind === 'lantern' ? c.glow * (0.85 + Math.sin(time / 180) * 0.15) : c.glow);
    if (this.beam) { this.beam.setRotation(time / 1400); this.beam.setAlpha(c.beam); }
    this.sun.setAlpha(c.sun);
    for (const f of this.fireflies) f.setAlpha(c.fire * (0.5 + 0.5 * Math.sin(time / 260 + f.phase)));
    for (const s of this.sparkles) s.setVisible(c.spark > 0.05);
  }

  // ---------- play ----------
  update(time) {
    this.updateLighting(time);
    this.life?.update(time);
    const k = this.keys;
    if (this.ui.busy || this.locked || this.player.moving) {
      Phaser.Input.Keyboard.JustDown(k.SPACE); Phaser.Input.Keyboard.JustDown(k.ENTER); Phaser.Input.Keyboard.JustDown(k.E);
      return;
    }
    const [px, py] = this.player.facing(), near = this.npcAt(px, py);
    this.ui.setPrompt(near ? `Space  Talk to ${near.def.name}` : this.objects.get(`${px},${py}`)?.kind === 'sign' ? 'Space  Read the sign' : this.objects.get(`${px},${py}`)?.kind === 'monument' ? 'Space  Look at the landmark' : this.life?.prompt(px, py) || null);
    const key = k.LEFT.isDown || k.A.isDown ? 'left' : k.RIGHT.isDown || k.D.isDown ? 'right' : k.UP.isDown || k.W.isDown ? 'up' : k.DOWN.isDown || k.S.isDown ? 'down' : null;
    if (key) this.nav.cancel();
    const tapped = !key && this.nav.walking, dir = key || this.nav.next();
    if (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER) || Phaser.Input.Keyboard.JustDown(k.E) || this.nav.act()) return this.interact();
    if (!dir) { this.player.stopAnim(); return; }
    const speed = k.SHIFT.isDown ? 95 : tapped ? 110 : 150;
    const res = this.player.step(dir, this.canEnter, speed, (x, y) => this.arrived(x, y));
    if (res && res.door) this.tryDoor(res.door);
    else if (res === false) { if (tapped) this.nav.blocked(); else if (time - (this.lastBump || 0) > 300) { this.lastBump = time; sfx.bump(); } }
  }

  arrived(x, y) {
    state.pos = { x, y, dir: this.player.dir };
    state.steps += 1;
    this.showWhere(x, y);
    this.life?.step(x, y);
    if (state.steps % 8 === 0) save();
    const g = this.grassIndex.get(`${x},${y}`);
    if (g) {
      g.sway = 1 - g.sway;
      g.back.setTexture(`grass-back-${g.sway}`);
      g.front.setTexture(`grass-front-${g.sway}`);
      this.grassSteps += 1;
      if (!state.grassOff && this.grassSteps > 2 && Math.random() < 0.14) { this.grassSteps = 0; this.encounter(); }
    } else this.grassSteps = 0;
    const tc = terrainAt(x, y);
    sfx.step(tc === 'G' ? 'grass' : tc === 's' || tc === 'd' ? 'sand' : tc === 'w' ? 'wood' : tc === 'c' || tc === 'r' ? 'stone' : tc === 'p' ? 'path' : 'none');
  }

  // The corner of the screen always says which district you are in: the place is the memory cue.
  showWhere(x, y) {
    const q = quarterAt(x, y), name = q ? q.name : COURSE.title;
    if (name !== this.where) { this.where = name; this.ui.setLocation(name, 'town'); }
  }

  // Review questions: key facts (level 1) from houses the player has already visited.
  async encounter() {
    const pool = QUESTIONS.filter((q) => q.stars === 1 && state.visited[q.topic]);
    if (!pool.length) return;
    this.player.stopAnim();
    const q = pickQuestion(pool, (this.recentQ || []).slice(0, Math.max(0, pool.length - 1)));
    this.recentQ = [q.id, ...(this.recentQ || [])].slice(0, 4);
    await this.ui.encounter(q);
  }

  async interact() {
    const [fx, fy] = this.player.facing();
    const npc = this.npcAt(fx, fy);
    if (npc) return this.talk(npc);
    const obj = this.objects.get(`${fx},${fy}`);
    if (obj && obj.kind === 'sign') { sfx.select(); return this.ui.say(obj.lines, { name: 'Sign' }); }
    if (obj && obj.kind === 'monument') { sfx.select(); return this.ui.say(obj.lines, { name: obj.title }); }
    const door = this.doors.get(`${fx},${fy}`);
    if (door) return this.tryDoor(door);
    this.life?.use(fx, fy);
  }

  async talk(npc) {
    npc.faceToward(this.player.tx, this.player.ty);
    sfx.select();
    // One line, then the player picks what to ask. Every answer is one line too.
    const t = TALK[npc.def.id], bye = { label: 'Bye' };
    const nodes = { root: { say: t.hi, options: [...t.options.map((o, i) => ({ label: o[0], to: `a${i}` })), bye] } };
    t.options.forEach((o, i) => { nodes[`a${i}`] = { say: o[1], options: [...t.options.filter((_, j) => j !== i).map((x) => ({ label: x[0], to: `a${t.options.indexOf(x)}` })), { label: 'Thanks, bye' }] }; });
    await this.ui.converse(npc.def.name, nodes);
    npc.face(npc.home);
  }

  // The league hall: the final check. Optional, and Esc leaves at any point.
  async league() {
    const seen = Object.keys(state.visited).length;
    await this.ui.converse(LEAGUE.host?.name || 'Judge', {
      root: { say: state.passedLeague ? 'You already hold the league badge. Another round?' : seen ? `The ${LEAGUE.name}: ${LEAGUE.size} questions from every house. ${Math.round(LEAGUE.pass * 100)}% and you pass.` : 'Visit a few houses first. The league asks about all of them.', options: [
        { label: 'Start the league', do: async () => { await this.ui.league(); return 'end'; } },
        { label: 'Not now' },
      ] },
    });
  }

  async tryDoor(b) {
    this.player.stopAnim();
    if (b.open) {
      (b.scene ? sfx.gate : sfx.door)();
      this.locked = true;
      state.pos = { x: b.doors[0][0], y: b.doors[0][1] + 1, dir: 'down' };
      save();
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(b.scene || 'Interior', { id: b.id }));
      return;
    }
    if (b.league) return this.league();
    return this.ui.say(DIALOG.closedHome, { name: b.name });
  }

  async intro() {
    this.locked = true;
    await new Promise((r) => this.time.delayedCall(400, r));
    const guide = this.npcs.find((n) => n.def.id === 'guide');
    guide?.faceToward(this.player.tx, this.player.ty);
    await this.ui.say(DIALOG.intro, { name: guide?.def.name || '' });
    state.seenIntro = true;
    save();
    this.locked = false;
  }
}
