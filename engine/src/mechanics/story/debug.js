// __hb.story: helpers for testing and for the pictures of `npm run shots:story` (scripts/storyshots.mjs).
// They edit the save and call the story's moments directly; nothing here runs in normal play.
//   __hb.story.at(n)          the state after n core houses (remembered, mementos found), arrived, named
//   __hb.story.memento(id)    the cinematic moment of finding that house's memento (upstairs)
//   __hb.story.window(id)     the window of a house lighting up (back in town)
//   __hb.story.door()         the lighthouse door (locked, the word, the keeper)
//   __hb.story.lamp()         the lamp room and the register (after the keeper)
//   __hb.story.ending()       the quay, the pages, the purser, the loop, then the ending card
//   __hb.story.fog(id)        the fog returns to a house (after the ending)
//   __hb.story.where(what)    the town camera on 'ship' | 'lighthouse' | 'quay' | a house id
import { state, save } from '../../systems/state.js';
import { Q } from '../quest/active.js';
import { T, BUILDINGS, HARBOUR } from '../../world/townMap.js';
import { findMemento, MEMENTO_OF } from './remember.js';
import { lighthouseDoor } from './lighthouse.js';
import { playLamp, playEnding } from './finale.js';
import { houseDuel } from '../duel/index.js';
import { DAY } from './config.js';
import { view } from './paint.js';
import { PAINTERS } from './scenes/index.js';

export function storyDebug(game) {
  const town = () => game.scene.getScene('Town'), ui = () => game.scene.getScene('UI');
  const done = (p) => { state.visited[p.id] = true; (p.lab?.stations || []).filter((s) => !s.advanced).forEach((_, i) => { state.done[`${p.id}:${i}`] = true; }); };
  return {
    MEMENTO_OF,
    arrive(name = 'Andrea') { const s = (state.story ||= {}); Object.assign(s, { name, arrived: true, arrivedAt: s.arrivedAt || Date.now() - 3600e3, notebook: true }); state.seenIntro = true; save(); return 1; },
    at(n, { mementos = true } = {}) {
      this.arrive(state.story?.name || 'Andrea');
      Q.core.forEach((p, i) => { if (i < n) { done(p); state.stamps[p.id] = true; state.keys[p.id] = true; if (mementos) ((state.story.mementos ||= {})[p.id] = MEMENTO_OF[p.id]); (state.story.lit ||= {})[p.id] = true; } });
      if (n >= Q.core.length && mementos) state.story.understood = 2;
      save(); return 1;
    },
    restart(pos) { if (pos) state.pos = pos; save(); town().scene.restart(); return 1; },
    memento: (id) => { findMemento(ui(), id); return 1; },
    window: (id) => { const p = Q.byId[id]; done(p); state.stamps[id] = true; state.keys[id] = true; if (state.story.lit) delete state.story.lit[id]; save(); town().story.returned(id); return 1; },
    understood() { this.at(Q.core.length); state.story.understood = 1; save(); town().story.returned(Q.core[0].id); return 1; },
    door: () => { lighthouseDoor(town()); return 1; },
    lamp: () => { state.passedLeague = true; save(); playLamp(town()); return 1; },
    ending: () => { state.passedLeague = true; (state.story ||= {}).turned = true; save(); playEnding(town()); return 1; },
    remember: (id) => { houseDuel(ui(), id); return 1; },
    fog(id) { state.ended = true; const f = ((state.story ||= {}).fog ||= {}); f[id] = { at: Date.now() - 2 * DAY, n: 0 }; save(); town()?.story?.refresh(); return 1; },
    where(what) {
      const sc = town(), cam = sc.cameras.main; cam.stopFollow();
      const b = BUILDINGS.find((x) => x.id === what || (what === 'lighthouse' && x.league));
      if (what === 'ship' && sc.story?.shipAt) cam.centerOn(sc.story.shipAt.x, sc.story.shipAt.y);
      else if (what === 'quay' && HARBOUR) cam.centerOn(HARBOUR.start.x * T, HARBOUR.start.y * T - 30);
      else if (b) cam.centerOn((b.x + b.w / 2) * T, (b.y + (what === 'lighthouse' ? -3 : b.h / 2)) * T);
      return 1;
    },
    // a painted scene alone, full screen, for looking at it: __hb.story.paint('harbour', { dock: 1 })
    paint(name, params = {}) { document.getElementById('st-paint')?.remove(); const d = document.createElement('div'); d.id = 'st-paint'; d.style.cssText = 'position:fixed;inset:0;z-index:40;background:#000'; document.body.append(d); this._v = view(d, PAINTERS[name](), params); return 1; },
    follow: () => { const sc = town(); sc.cameras.main.startFollow(sc.player.sprite, true, 0.15, 0.15); return 1; },
  };
}
