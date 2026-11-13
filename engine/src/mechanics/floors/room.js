// The scene side of upper floors, in a composed room (scenes/Interior.js):
//   ground floor: the staircase. Without the owner's key it says so, in character; with it, up.
//   upper floor: the stairs down (the room's exit), the advanced bench (LAB II) and the shelf of
//   further reading. The locks of both floors are in ../riddles/room.js.
//   this.extras = [attachFloor(this), attachLocks(this)]   in Interior.create(); then prompt, use, update
import { state, save } from '../../systems/state.js';
import { sfx } from '../../systems/audio.js';
import { MASTERS, PLACE } from '../../data/content.js';
import { openLab, overlay, h } from '../../lab/shell.js';
import { say } from '../life.js';
import { tr, fill } from '../config.js';
import { LOCK_WORDS as W } from '../riddles/kinds.js';
import { floorsOf } from './plan.js';
import { grantQueryKeys } from './keys.js';
import { lockTextures } from '../riddles/art.js';
import { upstairsLamp } from '../../gen/interior/paint.js';
import Phaser from 'phaser';

const T = 16;
const REFUSE = {
  en: ['Private. The owner keeps the key.', 'Locked at the top. {name} has the key.', 'Upstairs is for people with a key. I\'m not one. Yet.', '{name} might hand over the key to someone who shows they understood.'],
  it: ['Privato. Il padrone di casa tiene la chiave.', 'Chiuso in cima. La chiave ce l\'ha {name}.', 'Di sopra si va con la chiave. Io non ce l\'ho. Non ancora.', '{name} potrebbe dare la chiave a chi dimostra di aver capito.'],
};
const REFUSE_HOME = {
  en: ['{name} keeps the key to the upstairs.', 'A rope across the stairs. {name}\'s rule.', 'Not without {name}\'s key.', '{name} might hand over the key to someone who shows they understood.'],
  it: ['{name} tiene la chiave del piano di sopra.', 'Una corda attraverso le scale. Regola di {name}.', 'Non senza la chiave di {name}.', '{name} potrebbe dare la chiave a chi dimostra di aver capito.'],
};
const BARE = { en: 'The bench is bare. Whatever was studied up here is locked away.', it: 'Il banco è vuoto. Quello che si studiava quassù è sotto chiave.' };
const UP = { en: 'Upstairs. It smells of old paper.', it: 'Di sopra. Odora di carta vecchia.' };
let refusals = 0;

export function attachFloor(scene) {
  if (!scene.room?.generated) return null; // the standard room has no floors
  grantQueryKeys(state);
  lockTextures(scene);
  return new Floor(scene);
}

class Floor {
  constructor(scene) {
    Object.assign(this, { scene, ui: scene.ui, id: scene.id, room: scene.room, up: scene.floor === 'up' });
    this.place = PLACE[this.id];
    this.f = floorsOf(this.place);
    const st = this.room.stairs;
    if (st && !this.up) { // a small key mark over the stairs while they are locked and the player is near
      this.mark = scene.add.image((st.x + st.fw / 2) * T, st.y * T - 30, 'lock-mark-key').setOrigin(0.5, 1).setDepth(6000).setAlpha(0);
    }
    if (this.up) this.light();
    if (this.up && scene.registry.get('upFirst') !== this.id) { scene.registry.set('upFirst', this.id); scene.time.delayedCall(700, () => say(scene, tr(UP))); }
  }

  // upstairs is dimmer and warmer than downstairs: a dusk over the room, the lamp's pool of light,
  // a soft light around the player (paint.js draws the lamp and the UPSTAIRS tag)
  light() {
    const sc = this.scene, W = this.room.w * T, H = this.room.h * T;
    sc.add.rectangle(0, 0, W, H, 0x1a0f22, 0.42).setOrigin(0).setDepth(4000);
    if (!sc.textures.exists('glow')) return;
    const [lx, ly] = upstairsLamp(this.room.layout);
    const pool = sc.add.image(lx, ly + 30, 'glow').setScale(2.4, 1.8).setTint(0xffb35c).setBlendMode(Phaser.BlendModes.ADD).setDepth(4001).setAlpha(0.5);
    sc.tweens.add({ targets: pool, alpha: 0.42, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    sc.add.image(lx, ly, 'glow').setScale(0.6).setTint(0xffe2a8).setBlendMode(Phaser.BlendModes.ADD).setDepth(4002).setAlpha(0.9);
    const me = sc.add.image(0, 0, 'glow').setScale(1.4).setTint(0xffd9a0).setBlendMode(Phaser.BlendModes.ADD).setDepth(4001).setAlpha(0.3);
    sc.events.on('update', () => { const p = sc.player?.sprite; if (p) me.setPosition(p.x, p.y - 10); });
  }

  hasKey() { return !!state.keys?.[this.id]; }
  onStairs(fx, fy) { const s = this.room.stairs; return !this.up && s && fy === s.y && fx >= s.x && fx < s.x + s.fw; }
  onShelf(fx, fy) { return this.up && this.room.exhibit?.some(([x, y]) => x === fx && y === fy); }
  onBench(fx, fy) { const l = this.room.lab; return this.up && l && fx === l[0] && fy === l[1]; }
  // the advanced stations the player can open up here: those no lock guards, and those of opened locks
  stations() {
    const opened = new Set((this.place.riddles || []).filter((r) => state.locks?.[r.id]).flatMap((r) => [].concat(r.inside?.station || [])));
    return this.f.advanced.filter((s) => !this.f.guarded.includes(s.id) || opened.has(s.id)).map((s) => s.id);
  }

  prompt(fx, fy) {
    if (this.onStairs(fx, fy)) return tr(this.hasKey() ? W.upstairs : W.stairsTry);
    if (this.onShelf(fx, fy)) return tr(W.shelf);
    if (this.onBench(fx, fy)) return tr(W.bench);
    return null;
  }

  async use(fx, fy) {
    if (this.onStairs(fx, fy)) { if (this.hasKey()) this.goUp(); else this.refuse(); return true; }
    if (this.onShelf(fx, fy)) { sfx.page(); await this.ui.page(() => openShelf(this.place)); return true; }
    if (this.onBench(fx, fy)) { await this.openUpperLab(); return true; }
    return false;
  }

  refuse() {
    sfx.bump?.();
    const list = tr(this.place.kind === 'home' ? REFUSE_HOME : REFUSE);
    say(this.scene, fill(list[refusals++ % list.length], { name: MASTERS[this.id].name }));
  }

  async openUpperLab() {
    const ids = this.stations();
    if (!ids.length) { say(this.scene, tr(BARE)); return; }
    sfx.whoosh?.();
    await this.ui.page(() => openLab(this.id, 0, { upper: ids }));
  }

  go(floor, at) {
    const sc = this.scene;
    if (sc.leaving) return;
    sc.leaving = true;
    sfx.door?.();
    sc.cameras.main.fadeOut(240, 0, 0, 0);
    sc.cameras.main.once('camerafadeoutcomplete', () => sc.scene.start('Interior', { id: this.id, floor, at }));
  }
  goUp() { this.go('up', null); }
  goDown() { this.go('ground', 'stairs'); }

  update() {
    if (!this.mark) return;
    const p = this.scene.player, s = this.room.stairs;
    const near = !this.hasKey() && !this.ui.busy && Math.abs(p.ty - (s.y + 1)) <= 1 && p.tx >= s.x - 1 && p.tx <= s.x + s.fw;
    this.mark.setAlpha(this.mark.alpha + ((near ? 1 : 0) - this.mark.alpha) * 0.15);
  }
}

// The shelf upstairs: the concept's further links, as a short reading list.
export function openShelf(place) {
  const { root, close } = overlay(tr(W.shelfTitle), place.name);
  const list = (place.further || []).map((f) => h('li', { class: 'fl-i' },
    h('a', { href: f.url, target: '_blank', rel: 'noopener' }, f.title), h('p', {}, f.why)));
  root.append(h('style', { html: '.fl{flex:1;overflow:auto;padding:22px 18px 60px}.fl-in{max-width:720px;margin:0 auto}.fl p{color:var(--muted)}.fl ul{list-style:none;padding:0;margin:18px 0 0;display:grid;gap:12px}.fl-i{border:1px solid var(--line);border-radius:10px;padding:14px 16px;background:var(--card)}.fl-i a{color:var(--gold);font-size:18px;font-weight:600;text-decoration:underline;text-underline-offset:3px}.fl-i p{margin:6px 0 0}' }),
    h('div', { class: 'fl' }, h('div', { class: 'fl-in' }, h('p', {}, tr(W.shelfIntro)), h('ul', {}, list))));
  root.dataset.ready = '1';
  return new Promise((resolve) => {
    const done = () => { removeEventListener('keydown', key, true); root.remove(); resolve(); };
    const key = (e) => { if (e.key === 'Escape') { e.preventDefault(); done(); } };
    addEventListener('keydown', key, true);
    close.onclick = done;
  });
}
