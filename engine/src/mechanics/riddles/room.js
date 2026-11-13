// Locks in a room (scenes/Interior.js): the pieces placed by the room composer (a safe, a desk with
// a computer, a door with a hatch) are key objects. Near one, a small padlock with a question mark
// shows above it; a single tap or Space opens its close-up (closeup.js). A double tap gives a
// musing, as for any thing (musings/lines.js).
import { state, save } from '../../systems/state.js';
import { sfx } from '../../systems/audio.js';
import { MASTERS, PLACE } from '../../data/content.js';
import { openLab } from '../../lab/shell.js';
import { tr, fill } from '../config.js';
import { LOCK_KINDS, LOCK_WORDS as W } from './kinds.js';
import { RIDDLE, whereFor, LANG } from './data.js';
import { ensureLocks, isOpenLock } from './logic.js';
import { openCloseup } from './closeup.js';
import { lockTextures } from './art.js';
import { floorsOf } from '../floors/plan.js';

const T = 16;

export function attachLocks(scene) {
  const list = (scene.room?.locks || []).filter((l) => RIDDLE[l.id]);
  if (!list.length) return null;
  ensureLocks(state);
  lockTextures(scene);
  return new Locks(scene, list);
}

class Locks {
  constructor(scene, list) {
    Object.assign(this, { scene, ui: scene.ui, id: scene.id });
    this.locks = list.map((l) => ({ ...l, r: RIDDLE[l.id], mark: scene.add.image((l.x + l.fw / 2) * T, (l.y + 1) * T - l.ph - 4, 'lock-mark-q').setOrigin(0.5, 1).setDepth(6000).setAlpha(0) }));
  }
  at(fx, fy) { return this.locks.find((l) => fy === l.y && fx >= l.x && fx < l.x + l.fw) || null; }
  prompt(fx, fy) {
    const l = this.at(fx, fy);
    if (!l) return null;
    return isOpenLock(state, l.r) ? tr(W.look) : fill(tr(W.try), { thing: tr((LOCK_KINDS[l.r.kind] || LOCK_KINDS.safe).name) });
  }
  async use(fx, fy) {
    const l = this.at(fx, fy);
    if (!l) return false;
    sfx.select?.();
    const r = l.r, p = PLACE[this.id];
    const res = await this.ui.page(() => openCloseup(r, {
      state, lang: LANG, where: whereFor(this.scene.floor), title: p.name, owner: MASTERS[this.id]?.name,
    }));
    save();
    if (res?.opened) l.mark.setAlpha(0);
    if (res?.station) await this.openStation(res.station);
    return true;
  }
  // an advanced station from a lock: the upper lab, at that station, with whatever else is open
  async openStation(sid) {
    const f = floorsOf(PLACE[this.id]);
    const opened = new Set((PLACE[this.id].riddles || []).filter((r) => state.locks?.[r.id]).flatMap((r) => [].concat(r.inside?.station || [])));
    const ids = f.advanced.filter((s) => !f.guarded.includes(s.id) || opened.has(s.id)).map((s) => s.id);
    await this.ui.page(() => openLab(this.id, Math.max(0, ids.indexOf(sid)), { upper: ids }));
  }
  update() {
    const p = this.scene.player;
    for (const l of this.locks) {
      const near = !this.ui.busy && !isOpenLock(state, l.r) && Math.abs(p.ty - (l.y + 1)) <= 1 && p.tx >= l.x - 1 && p.tx <= l.x + l.fw;
      l.mark.setAlpha(l.mark.alpha + ((near ? 1 : 0) - l.mark.alpha) * 0.15);
      if (near && l.mark.alpha > 0.5) l.mark.y = (l.y + 1) * T - l.ph - 4 + Math.round(Math.sin(this.scene.time.now / 300));
    }
  }
}
