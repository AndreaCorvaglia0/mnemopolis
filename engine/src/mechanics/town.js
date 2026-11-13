// Ambient life in the town scene. Town.js calls, when the layer is on:
//   this.life = attachTownLife(this)          in create(), after the townsfolk and the player
//   this.life?.update(time)                   every frame (cheap: only near the player)
//   this.life?.step(x, y)                     when the player arrives on a tile
//   this.life?.prompt(fx, fy) / use(fx, fy)   the prompt and Space for obstacles (key objects)
// T thinks aloud about what the player faces, J opens the discoveries, and a double tap on a thing
// nearby thinks about it (TapNav.onDouble).
import { TOWN, T } from '../world/townMap.js';
import { state, save } from '../systems/state.js';
import { sfx } from '../systems/audio.js';
import { hash } from '../art/px.js';
import { LIFE, LANG, tr, fill, WORDS, ensureState, say, thinkAbout, discover, foundText, isFound, deck } from './life.js';
import { lifePlan, dressingPlan } from './active.js';
import { lifeContext } from './context.js';
import { lifeTextures } from './textures.js';
import { townThingAt } from './musings/things.js';
import { OBSTACLES, REWARDS, canPass } from './obstacles/kinds.js';
import { CHAIN, rhymeFor } from './secrets/registry.js';
import { Animals } from './animals/live.js';

let C = null; // the context of the town: computed once
const ctx = () => (C ||= lifeContext(TOWN, dressingPlan()));
const GROUND = new Set(['grass', 'path', 'plaza', 'flowers', 'sand', 'tallgrass', 'bridge', 'jetty', 'rock', 'floor', 'rug']);
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function attachTownLife(scene) {
  if (!LIFE.on) return null;
  ensureState();
  lifeTextures(scene);
  const plan = lifePlan(), c = ctx(), life = new TownLife(scene, plan, c);
  scene.events.once('shutdown', () => life.destroy());
  return life;
}

class TownLife {
  constructor(scene, plan, c) {
    Object.assign(this, { scene, plan, c, ui: scene.ui, still: 0, lastMove: 0 });
    this.secrets = Object.fromEntries(plan.secrets.map((s) => [s.id, s]));
    if (LIFE.obstacles) this.makeObstacles();
    if (LIFE.secrets) this.makeSecrets();
    if (LIFE.animals) this.animals = new Animals(scene, plan, c);
    const kb = scene.input.keyboard;
    if (LIFE.musings) kb.on('keydown-T', () => this.thinkAhead());
    if (LIFE.secrets) kb.on('keydown-J', () => this.journal());
    if (LIFE.musings) scene.nav.onDouble = (tx, ty, wp) => this.doubleTap(tx, ty, wp);
    // one lamp flickers when you pass it at night (no entry in the journal: just atmosphere)
    const lamp = TOWN.LAMPS[Math.floor(hash(TOWN.LAMPS.length, 7, 3) * TOWN.LAMPS.length)];
    this.lamp = lamp && { tile: lamp, glow: scene.glows.find((g) => g.img.x === lamp[0] * T + 8 && g.img.y === lamp[1] * T - 10) };
  }

  get idle() { const s = this.scene; return !s.ui.busy && !s.locked && s.sys.isActive(); }
  here() { return this.c.quarter(this.scene.player.tx, this.scene.player.ty)?.id || null; }

  // ---------------------------------------------------------------- musings
  think(tx, ty, an = null) {
    if (!LIFE.musings || !this.idle) return false;
    if (an) return this.thinkAnimal(an);
    const th = townThingAt(this.c, this.plan, tx, ty);
    if (!th) return false;
    // secrets found by thinking: a hollow tree, a well that echoes, the lantern cat
    for (const s of this.plan.secrets) {
      if (isFound(s) || !s.obj || s.obj[0] !== tx || s.obj[1] !== ty) continue;
      if (s.kind === 'hollow' || s.kind === 'well') { discover(this.scene, s, foundText(s)); if (s.kind === 'well') sfx.echo?.(); return true; }
    }
    if (th.obstacle) { thinkAbout(this.scene, null, { lines: tr(OBSTACLES[th.obstacle.kind].lines) }); return true; }
    thinkAbout(this.scene, th.kind, { here: this.here(), hint: this.hintNear() });
    return true;
  }
  thinkAnimal(an) {
    if (an.lantern) { sfx.purr?.(); say(this.scene, deck.draw(`pet:${LANG}`, tr(CHAIN.pet))); return true; }
    thinkAbout(this.scene, an.kind, { here: this.here() });
    return true;
  }
  // T: what the player faces; across empty ground, the first thing up to three tiles ahead
  thinkAhead() {
    if (!this.idle) return;
    const p = this.scene.player, [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir];
    const an = this.animals?.near(p.tx + dx * 1.5, p.ty + dy * 1.5, 1.8) || (this.cat?.visible && Math.hypot(this.cat.x / T - 0.5 - p.tx, this.cat.y / T - 1 - p.ty) < 2.5 ? { lantern: true } : null);
    if (an) return this.think(0, 0, an);
    let x = p.tx + dx, y = p.ty + dy;
    for (let k = 1; k <= 3; k++) {
      const th = townThingAt(this.c, this.plan, p.tx + dx * k, p.ty + dy * k);
      if (th && !GROUND.has(th.kind)) { x = p.tx + dx * k; y = p.ty + dy * k; break; }
    }
    this.think(x, y);
  }
  // a double tap: only on a thing within three tiles that is not something to walk to or use
  doubleTap(tx, ty, wp) {
    if (!this.idle) return false;
    const p = this.scene.player;
    const an = this.animals?.at(wp.x, wp.y) || (this.cat?.visible && Math.hypot(this.cat.x - wp.x, this.cat.y - 8 - wp.y) < 14 ? { lantern: true } : null);
    if (an && Math.hypot(wp.x / T - p.tx, wp.y / T - p.ty) <= 4.5) { p.faceToward(Math.floor(wp.x / T), Math.floor(wp.y / T)); return this.think(0, 0, an); }
    if (Math.max(Math.abs(tx - p.tx), Math.abs(ty - p.ty)) > 3) return false;
    const th = townThingAt(this.c, this.plan, tx, ty);
    if (!th || th.point || (GROUND.has(th.kind) && this.c.walk(tx, ty))) return false;
    if ((th.kind === 'house' || th.kind === 'roof') && this.c.building(tx, ty)?.open) return false; // a tap on a house goes to its door
    this.scene.time.delayedCall(0, () => p.faceToward(tx, ty));
    return this.think(tx, ty);
  }
  hintNear() {
    const p = this.scene.player;
    return this.plan.secrets.some((s) => s.kind !== 'sealed' && s.kind !== 'painting' && !isFound(s) && s.x != null && Math.abs(s.x - p.tx) + Math.abs(s.y - p.ty) <= 8);
  }

  // ---------------------------------------------------------------- obstacles (key objects)
  makeObstacles() {
    const sc = this.scene;
    this.obs = this.plan.obstacles.map((o) => {
      const open = !!state.opened[o.id], flat = o.kind === 'hatch';
      const img = sc.add.image(o.x * T + 8, o.y * T + 16, `life-ob-${o.kind}${open ? '-open' : ''}`).setOrigin(0.5, 1).setDepth(flat ? 2.9 : o.y * T + 15);
      if (!open) sc.block(o.x, o.y);
      for (const [x, y] of o.ring) { sc.add.image(x * T + 8, y * T + 16, 'bush').setOrigin(0.5, 1).setDepth(y * T + 15); sc.block(x, y); }
      const mark = sc.add.image(o.x * T + 8, o.y * T - (flat ? 2 : 6), `life-mark-${OBSTACLES[o.kind].needs}`).setOrigin(0.5, 1).setDepth(9600).setAlpha(0);
      const sealed = this.plan.secrets.find((s) => s.kind === 'sealed' && s.ob === o.id);
      const prize = o.reward && sealed && !isFound(sealed) ? sc.add.image(o.reward[0] * T + 8, o.reward[1] * T + 15, `life-prize-${o.prize}`).setOrigin(0.5, 1).setDepth(o.reward[1] * T + 13) : null;
      if (prize) sc.tweens.add({ targets: prize, alpha: 0.75, duration: 900, yoyo: true, repeat: -1 });
      return { o, img, mark, prize, sealed, tries: 0 };
    });
  }
  obstacleAt(x, y) { return this.obs?.find((b) => b.o.x === x && b.o.y === y && !state.opened[b.o.id]) || null; }
  prompt(fx, fy) {
    const b = this.obstacleAt(fx, fy);
    return b ? fill(tr(WORDS.try), { thing: tr(OBSTACLES[b.o.kind].name) }) : null;
  }
  use(fx, fy) {
    const b = this.obstacleAt(fx, fy);
    if (!b) return false;
    const k = OBSTACLES[b.o.kind];
    if (!canPass(b.o, state)) { sfx.bump(); this.scene.tweens.add({ targets: b.img, x: b.img.x + 1, duration: 50, yoyo: true, repeat: 2 }); say(this.scene, deck.draw(`try:${b.o.kind}:${LANG}`, tr(k.say))); return true; }
    this.open(b);
    return true;
  }
  open(b) {
    const sc = this.scene, o = b.o;
    state.opened[o.id] = true; save();
    sfx.creak?.();
    sc.tweens.add({ targets: b.img, scaleX: 1.15, scaleY: 0.85, duration: 120, yoyo: true, repeat: 1, onComplete: () => {
      b.img.setTexture(`life-ob-${o.kind}-open`);
      for (let i = 0; i < 8; i++) { const d = sc.add.image(b.img.x, b.img.y - 6, 'dot').setDepth(9600).setTint(0xe9e2c9); sc.tweens.add({ targets: d, x: d.x + (Math.random() - 0.5) * 30, y: d.y - 4 - Math.random() * 14, alpha: 0, duration: 500, onComplete: () => d.destroy() }); }
    } });
    sc.blocked[o.y * TOWN.W + o.x] = 0;
    b.mark.setAlpha(0);
    say(sc, tr(OBSTACLES[o.kind].opened));
    if (!o.reward && b.sealed) sc.time.delayedCall(1800, () => discover(sc, b.sealed, prizeLine(o.prize)));
  }

  // ---------------------------------------------------------------- secrets
  makeSecrets() {
    const sc = this.scene;
    this.sprites = {};
    for (const s of this.plan.secrets) {
      const found = isFound(s);
      if (s.kind === 'apple') {
        const [ox, oy] = s.obj;
        this.sprites[s.id] = found ? sc.add.image(s.x * T + 11, s.y * T + 13, 'life-apple').setDepth(s.y * T + 2) : sc.add.image(ox * T + 10, oy * T - (s.fruit ? 2 : 6), 'life-apple').setDepth(oy * T + 17);
      } else if (s.kind === 'hollow') sc.add.image(s.obj[0] * T + 8, s.obj[1] * T + 9, 'life-hollow').setDepth(s.obj[1] * T + 16.5);
      else if (s.kind === 'bottle' && !found) {
        const b = sc.add.image(s.obj[0] * T + 8, s.obj[1] * T + 9, 'life-bottle').setDepth(2.9);
        sc.tweens.add({ targets: b, y: b.y + 1.5, angle: 8, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.sprites[s.id] = b;
      } else if (s.kind === 'note' && !found) this.sprites[s.id] = sc.add.image(s.x * T + 8, s.y * T + 15, 'life-note').setOrigin(0.5, 1).setDepth(s.y * T + 13);
      else if (s.kind === 'prints') this.makePrints(s);
    }
  }
  makePrints(s) {
    const sc = this.scene;
    this.chain = s;
    this.printSprites = s.prints.map(([x, y], i) => {
      if (state.life.prints[i]) return null;
      const img = sc.add.image(x * T, y * T, 'life-muddy').setOrigin(0).setDepth(2.6).setAlpha(0.8);
      const glow = sc.add.image(x * T, y * T, 'life-prints').setOrigin(0).setDepth(9001).setBlendMode('ADD').setAlpha(0);
      return { img, glow };
    });
    if (this.chainDone() || isFound(s)) this.seatCat();
    this.nextGlimpse = sc.time.now + 20000 + Math.random() * 20000;
  }
  chainDone() { return this.chain && this.chain.prints.every((_, i) => state.life.prints[i]); }

  // the lantern cat: a figure with a lantern; glimpsed far away at night, then waiting in the square
  catSprite(x, y) {
    const sc = this.scene, s = sc.add.sprite(x, y, 'life-lanterncat', 0).setOrigin(0.5, 1).setDepth(y);
    const lan = sc.add.image(x + 6, y - 3, 'life-lantern').setOrigin(0.5, 1).setDepth(y + 0.1);
    const glow = sc.add.image(x + 6, y - 6, 'glow').setScale(0.5).setBlendMode('ADD').setDepth(9001);
    const light = { follow: lan, r: 22, oy: -4 };
    sc.lights.push(light);
    s.on('destroy', () => { lan.destroy(); glow.destroy(); sc.lights.splice(sc.lights.indexOf(light), 1); });
    s.parts = [lan, glow];
    s.sync = () => { lan.setPosition(s.x + (s.flipX ? -6 : 6), s.y - 3).setDepth(s.y + 0.1); glow.setPosition(lan.x, lan.y - 3); };
    return s;
  }
  seatCat() {
    if (this.cat) return;
    const [x, y] = this.chain.home;
    this.cat = this.catSprite(x * T + 8, y * T + 15);
    this.cat.play('life-lanterncat-idle');
    this.cat.sync();
  }
  glimpse(time) {
    const sc = this.scene, p = sc.player, todo = this.chain.prints.map((q, i) => [q, i]).filter(([, i]) => !state.life.prints[i]);
    this.nextGlimpse = time + 35000 + Math.random() * 35000;
    if (!todo.length || sc.tod === 'day' || this.glimpsing) return;
    const [[gx, gy]] = todo.sort((a, b) => Math.hypot(a[0][0] - p.tx, a[0][1] - p.ty) - Math.hypot(b[0][0] - p.tx, b[0][1] - p.ty));
    const d = Math.hypot(gx - p.tx, gy - p.ty);
    if (d < 9) return;
    // at the edge of the view, on the way to the nearest trail, walking away from the player
    const ux = (gx - p.tx) / d, uy = (gy - p.ty) / d, sx = Math.round(p.tx + ux * 7), sy = Math.round(p.ty + uy * 5);
    if (!this.c.walk(sx, sy)) return;
    const cat = this.catSprite(sx * T + 8, sy * T + 15).setAlpha(0).setFlipX(ux < 0);
    this.glimpsing = cat;
    cat.play('life-lanterncat-move');
    sc.tweens.add({ targets: [cat, ...cat.parts], alpha: 1, duration: 300 });
    sc.tweens.add({ targets: cat, x: cat.x + ux * 56, y: cat.y + uy * 40, duration: 2600, onUpdate: () => cat.sync(), onComplete: () => sc.tweens.add({ targets: [cat, ...cat.parts], alpha: 0, duration: 400, onComplete: () => { cat.destroy(); this.glimpsing = null; } }) });
  }

  step(x, y) {
    if (!LIFE.secrets && !LIFE.obstacles) return;
    this.lastMove = this.scene.time.now;
    const sc = this.scene, near = (a, b, r = 1) => Math.max(Math.abs(a - x), Math.abs(b - y)) <= r;
    for (const s of this.plan.secrets) {
      if (isFound(s)) continue;
      if (s.kind === 'apple' && s.x === x && s.y === y) this.dropApple(s);
      else if (s.kind === 'stone' && s.x === x && s.y === y) { sfx.bump(); discover(sc, s, foundText(s)); }
      else if (s.kind === 'bottle' && near(s.obj[0], s.obj[1])) { const b = this.sprites[s.id]; sc.tweens.add({ targets: b, x: x * T + 8, y: y * T + 12, alpha: 0, duration: 900 }); discover(sc, s, foundText(s)); }
      else if (s.kind === 'note' && near(s.x, s.y)) { sc.tweens.add({ targets: this.sprites[s.id], alpha: 0, duration: 500 }); discover(sc, s, `${foundText(s)} "${s.text}"`); }
      else if (s.kind === 'sealed' && !s.room && state.opened[s.ob] && near(s.x, s.y)) { const b = this.obs?.find((o) => o.o.id === s.ob); if (b?.prize) sc.tweens.add({ targets: b.prize, alpha: 0, y: b.prize.y - 8, duration: 600 }); discover(sc, s, prizeLine(b?.o.prize)); }
      else if (s.kind === 'prints') this.stepPrints(s, x, y);
    }
    // the flickering lamp
    if (this.lamp?.glow && sc.tod !== 'day' && near(...this.lamp.tile) && !this.flicker) {
      this.flicker = true; const g = this.lamp.glow; g.flick = true;
      sc.time.delayedCall(2500, () => { this.flicker = false; g.flick = false; });
    }
  }
  stepPrints(s, x, y) {
    const sc = this.scene;
    s.prints.forEach(([px, py], i) => {
      if (state.life.prints[i] || Math.abs(px - x) + Math.abs(py - y) > 1) return;
      state.life.prints[i] = true; save();
      const n = Object.keys(state.life.prints).length, lines = rhymeFor(s.prints.length, LANG), sp = this.printSprites[i];
      if (sp) sc.tweens.add({ targets: [sp.img, sp.glow], alpha: 0, duration: 1200 });
      sfx[n >= s.prints.length ? 'motif' : 'chime']?.('cat'); // the last print: the cat appears, with the motif
      const last = n >= s.prints.length;
      say(sc, `${tr({ en: 'Paw prints, glowing faintly.', it: 'Impronte di zampa, che brillano appena.' })} "${lines[n - 1]}"${last ? ` ${tr(CHAIN.last)}` : ''}`, { hold: 5200 });
      if (last) this.seatCat();
    });
    if (this.cat && !isFound(s) && Math.hypot(this.cat.x / T - 0.5 - x, this.cat.y / T - 1 - y) <= 2.2) {
      this.cat.setFlipX(x * T < this.cat.x); this.cat.sync();
      discover(sc, s, `${tr(CHAIN.waiting)} ${tr(CHAIN.done)}`);
    }
  }
  dropApple(s) {
    const sc = this.scene, a = this.sprites[s.id];
    sc.tweens.add({ targets: a, y: s.y * T + 13, x: s.x * T + 11, duration: 420, ease: 'Bounce.easeOut', onComplete: () => a.setDepth(s.y * T + 2) });
    sc.time.delayedCall(180, () => sfx.thud?.());
    discover(sc, s, foundText(s));
  }

  // ---------------------------------------------------------------- every frame
  update(time) {
    const sc = this.scene;
    this.ui.__thought?.visible && this.ui.__thought.world === sc && this.ui.__thought.follow();
    // markers: a padlock with its tool appears when the player is near an obstacle that is still closed
    if (this.obs) for (const b of this.obs) {
      const d = Math.abs(b.o.x - sc.player.tx) + Math.abs(b.o.y - sc.player.ty), want = !state.opened[b.o.id] && d <= 3 && !sc.ui.busy ? 1 : 0;
      if (Math.abs(b.mark.alpha - want) > 0.01) b.mark.setAlpha(b.mark.alpha + (want - b.mark.alpha) * 0.15);
    }
    if (this.printSprites) {
      const night = sc.cur.dark > 0.2;
      for (const p of this.printSprites) if (p && p.img.alpha > 0.5) p.glow.setAlpha(night ? 0.35 + 0.25 * Math.sin(time / 500) : 0);
      if (time > this.nextGlimpse && this.idle) this.glimpse(time);
      this.glimpsing?.sync?.();
    }
    if (this.lamp?.glow?.flick) this.lamp.glow.img.setAlpha(Math.random() < 0.3 ? 0.15 : sc.cur.glow);
    // the shooting star: stand still near the bench at night for a few seconds
    const star = this.plan.secrets.find((s) => s.kind === 'star');
    if (star && LIFE.secrets && !isFound(star) && sc.tod !== 'day' && this.idle && !sc.player.moving && Math.max(Math.abs(star.obj[0] - sc.player.tx), Math.abs(star.obj[1] - sc.player.ty)) <= 1) {
      if (time - this.lastMove > 5000 && time - (this.starAt || 0) > 8000) { this.starAt = time; this.shootingStar(star); }
    }
  }
  shootingStar(s) {
    const sc = this.scene, v = sc.cameras.main.worldView, x0 = v.x + v.width * 0.75, y0 = v.y + 10;
    const head = sc.add.image(x0, y0, 'life-star').setDepth(9700).setBlendMode('ADD'), tail = sc.add.graphics().setDepth(9699).setBlendMode('ADD');
    sc.tweens.addCounter({ from: 0, to: 1, duration: 900, onUpdate: (tw) => {
      const t = tw.getValue(), x = x0 - t * v.width * 0.45, y = y0 + t * v.height * 0.25;
      head.setPosition(x, y); tail.clear().lineStyle(1, 0xfff6c8, 0.8 * (1 - t)).lineBetween(x, y, x + 30, y - 16);
    }, onComplete: () => { head.destroy(); tail.destroy(); discover(sc, s, foundText(s)); } });
  }

  // the discoveries are the Mysteries tab of the menu (mechanics/quest/menu.js)
  journal() { if (this.idle) this.ui.showAtlas('mysteries'); }
  destroy() { this.animals?.destroy(); this.ui.__thought?.hide(true); }
}

// the thought when what waited behind an obstacle is found
export const prizeLine = (k) => (REWARDS[k] ? `${tr(REWARDS[k].title)}. ${tr(REWARDS[k].text)}` : tr({ en: 'Found it.', it: 'Trovato.' }));
