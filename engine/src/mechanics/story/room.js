// The story inside a house (Interior.js): the memento upstairs (a small paper that glints, on a free
// tile; using it is the cinematic moment of remembering.js), the owner confused again when the fog
// returns after the ending, and the keys of old saves. One more of Interior's extras: prompt, use,
// update, and talk() for the owner.
import { state, save } from '../../systems/state.js';
import { MASTERS, PLACE } from '../../data/content.js';
import { Q } from '../quest/active.js';
import { hasDuel } from '../quest/model.js';
import { fogDuel } from '../duel/index.js';
import { storyTextures } from './art.js';
import { S_WORDS } from './words.js';
import { tr, fill } from './config.js';
import { FOG_BARS } from './logic.js';
import { isFoggy, clearFog } from './fog.js';
import { hasMemento, findMemento } from './remember.js';

const T = 16;
export function attachStoryRoom(scene) { return new StoryRoom(scene); }

class StoryRoom {
  constructor(scene) {
    Object.assign(this, { scene, ui: scene.ui, id: scene.id, up: scene.floor === 'up' });
    storyTextures(scene);
    // keys: a house remembered (or done, without a remembering) always opens its upstairs
    const r = Q.progress(state).find((x) => x.id === this.id);
    if (r && (r.won || (!hasDuel(r.place) && r.visited && r.n >= r.m)) && !state.keys?.[this.id]) { (state.keys ||= {})[this.id] = true; save(); }
    if (this.up && hasMemento(this.id)) this.place();
  }
  // a free tile against something (a wall, a piece of furniture), reachable, that cuts no way
  place() {
    const rm = this.scene.room, W = rm.w, H = rm.h, B = rm.blocked, ex = rm.exit, st = rm.start;
    const free = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && !B[y * W + x] && !(x === ex[0] && y === ex[1]) && !(rm.lab && x === rm.lab[0] && y === rm.lab[1]);
    const reach = (skip) => { const d = new Int16Array(W * H).fill(-1), q = [st[1] * W + st[0]]; d[q[0]] = 0; for (let i = 0; i < q.length; i++) { const x = q[i] % W, y = (q[i] / W) | 0; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + a, Y = y + b; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (d[j] >= 0 || B[j] || j === skip) continue; d[j] = 1; q.push(j); } } return d; };
    const all = reach(-1), cx = W / 2, cy = H / 2;
    const cands = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (free(x, y) && B[(y - 1) * W + x] && free(x, y + 1) && all[y * W + x] >= 0) cands.push([Math.hypot(x - cx, y - cy), x, y]);
    cands.sort((a, b) => a[0] - b[0]);
    for (const [, x, y] of cands) {
      const d = reach(y * W + x);
      let ok = true; for (let i = 0; i < W * H; i++) if (all[i] >= 0 && i !== y * W + x && d[i] < 0) { ok = false; break; }
      if (!ok || d[(y + 1) * W + x] < 0) continue;
      this.tile = [x, y]; B[y * W + x] = 1;
      const px = x * T + 8, py = y * T + 10;
      this.sprite = this.scene.add.image(px, py, 'story-memento').setOrigin(0.5).setDepth(py);
      this.glint = this.scene.add.image(px + 3, py - 3, 'glow').setScale(0.35).setBlendMode(1).setDepth(5003).setAlpha(0.2);
      this.scene.tweens.add({ targets: this.glint, alpha: 0.85, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return;
    }
  }
  on(fx, fy) { return !!this.tile && this.tile[0] === fx && this.tile[1] === fy; }
  prompt(fx, fy) { return this.on(fx, fy) ? `Space  ${tr(S_WORDS.mementoPrompt)}` : null; }
  async use(fx, fy) {
    if (!this.on(fx, fy)) return false;
    await findMemento(this.ui, this.id);
    this.sprite?.destroy(); this.glint?.destroy(); this.sprite = null;
    const rm = this.scene.room; rm.blocked[this.tile[1] * rm.w + this.tile[0]] = 0; this.tile = null;
    return true;
  }
  update() {}
  // the owner, when the fog has come back (after the ending): confused again; two right answers
  async talk() {
    if (!isFoggy(this.id)) return false;
    const m = MASTERS[this.id], ui = this.ui;
    let won = null;
    await ui.converse(m.name, { root: { say: tr(S_WORDS.fogHi), options: [
      { label: fill(tr(S_WORDS.fogHelp), { name: m.name }), do: async () => { const r = await fogDuel(ui, this.id, FOG_BARS); won = !!r?.won; return 'end'; } },
      { label: tr({ en: 'Bye', it: 'Ciao' }) },
    ] } });
    if (won) { clearFog(this.id); await ui.say([tr(S_WORDS.fogBack)], { name: m.name }); }
    else if (won === false) await ui.say([tr(S_WORDS.fogStill)], { name: m.name });
    return true;
  }
}
export const placeName = (id) => PLACE[id]?.name || '';
