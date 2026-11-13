// The story in the town (docs/STORY.md): the quay and the moored ship, the notebook on the boards, the
// harbour master, the rain, windows dark until their owner remembers, people by stage, the
// lighthouse, and the cinematic moments that happen outdoors. Town.js calls it through a few hooks:
//   this.story = STORY.on ? attachStoryTown(this) : null
//   begin()           after the title (the arrival, the notebook, the harbour master)
//   returned(id)      back from a house (a window lights up; the lighthouse understood)
//   litOf(buildingId) 0..1 for a building's windows;  light(dark, ox, oy) the lamp's beam
//   talk(npc), door(b), prompt(x, y), use(x, y), update(time, delta)
import Phaser from 'phaser';
import { T, HARBOUR, BUILDINGS } from '../../world/townMap.js';
import { state, save } from '../../systems/state.js';
import { sfx } from '../../systems/audio.js';
import { TALK, PLACE } from '../../data/content.js';
import { Q } from '../quest/active.js';
import { Q_WORDS, answerLine } from '../quest/strings.js';
import { say } from '../life.js';
import { Deck } from '../musings/think.js';
import { STORY, SKIP_ARRIVAL, tr, fill } from './config.js';
import { S_WORDS } from './words.js';
import { storyTextures, SHIP_W, FUNNELS } from './art.js';
import { cinema } from './cinema.js';
import { playOpening } from './opening.js';
import { Weather } from './weather.js';
import { stageNow, greeting, curtLine, rememberedRow } from './stages.js';
import { isFoggy } from './fog.js';
import { lighthouseDoor, theWord } from './lighthouse.js';
import { playEnding, TALLY } from './finale.js';
import { view } from './paint.js';
import { objectPainter } from './scenes/objects.js';
import { hasAttic, MEMENTO_OF } from './remember.js';

const talkDeck = new Deck();

// the harbour master is the guide, standing on the quay (Town.makeNPCs asks)
export function storyNpc(n) {
  if (!STORY.on || n.id !== 'guide') return n;
  return { ...n, name: tr(S_WORDS.master), ...(HARBOUR ? { x: HARBOUR.master.x, y: HARBOUR.master.y, dir: 'down' } : {}) };
}
// where a new game starts: on the quay
export const storyStart = () => (STORY.on && HARBOUR ? HARBOUR.start : null);

export function attachStoryTown(scene) { return new StoryTown(scene); }

class StoryTown {
  constructor(scene) {
    this.scene = scene; this.ui = scene.ui; this.fade = {}; this.lit = {}; this.t = 0;
    storyTextures(scene);
    const H = HARBOUR;
    // ---- the ship, moored at the pier
    if (H) {
      const x = H.ship.cx * T, y = H.ship.bottom * T;
      this.ship = scene.add.image(x, y, 'story-ship').setOrigin(0.5, 1).setDepth(y).setFlipX(H.ship.flip);
      this.shipLit = scene.add.image(x, y, 'story-ship-lit').setOrigin(0.5, 1).setDepth(y + 0.5).setFlipX(H.ship.flip).setAlpha(0);
      this.shipAt = { x, y: y - 40 };
      this.funnels = FUNNELS.map(([fx, fy]) => ({ x: x + (H.ship.flip ? -1 : 1) * (fx - SHIP_W / 2) - 4, y: y - 112 + fy }));
      this.puffs = [];
      this.notebookAt = { x: H.notebook.x * T + 8, y: H.notebook.y * T + 10 };
    }
    // ---- the lighthouse (the League hall's building, painted by art.js paintLighthouse)
    const lg = BUILDINGS.find((b) => b.league), info = scene.registry.get('buildings')?.[lg?.id];
    if (lg && info?.lamp) {
      const by = (lg.y + lg.h) * T;
      this.lamp = { x: lg.x * T + info.lamp[0], y: by - info.canvas.height + info.lamp[1] };
    }
    // a house remembered before it kept a memento, with no upstairs to find it in (an old save): the
    // memento counts as handed over, so the path never points at stairs that are not there
    for (const r of Q.coreProgress(state)) if (r.won && r.memento && !r.found && !hasAttic(r.id)) ((state.story ||= {}).mementos ||= {})[r.id] = MEMENTO_OF[r.id];
    this.weather = new Weather(scene);
    if (state.passedLeague) this.lightLamp(false); // the lamp lit stays lit
    if (H && (!state.story?.notebook || state.story?.left)) this.placeNotebook();
    this.refresh();
  }

  // ---------------------------------------------------------------- windows
  refresh() {
    const rows = Q.progress(state), map = {};
    for (const r of rows) map[r.id] = rememberedRow(r) ? (isFoggy(r.id) ? 0.3 : 1) : 0;
    map.home = stageNow(state) === 'warm' ? 1 : 0;
    const lg = BUILDINGS.find((b) => b.league); if (lg) map[lg.id] = state.ended || state.passedLeague ? 1 : 0;
    this.lit = map;
    this.weather.refresh();
  }
  litOf(id) { return id == null ? 1 : this.fade[id] ?? this.lit[id] ?? 1; }

  // ---------------------------------------------------------------- the lamp and the ship
  lightLamp(animate) {
    if (!this.lamp || this.beam) return;
    const sc = this.scene, { x, y } = this.lamp;
    this.beam = sc.add.image(x, y, 'beam').setOrigin(0, 0.5).setDepth(9002).setBlendMode(Phaser.BlendModes.ADD).setAlpha(animate ? 0 : 0.95);
    this.beamBrush = sc.make.image({ key: 'beam', add: false }).setOrigin(0, 0.5);
    this.lampGlow = sc.add.image(x, y, 'glow').setDepth(9001).setBlendMode(Phaser.BlendModes.ADD).setScale(animate ? 0.2 : 2.4).setAlpha(animate ? 0 : 1);
    sc.lights.push({ x, y, r: 70 });
    if (animate) { sc.tweens.add({ targets: this.lampGlow, scale: 2.4, alpha: 1, duration: 1400, ease: 'Sine.easeOut' }); sc.tweens.add({ targets: this.beam, alpha: 0.95, duration: 2200, delay: 600 }); }
  }
  shipLights(on, animate = true) {
    if (!this.shipLit) return;
    this.scene.tweens.add({ targets: this.shipLit, alpha: on ? 1 : 0, duration: animate ? 1600 : 0 });
    if (on && !this.shipGlow) { this.shipGlow = { x: this.shipAt.x, y: this.shipAt.y + 10, r: 90 }; this.scene.lights.push(this.shipGlow); }
  }
  placeNotebook() {
    if (!this.notebookAt || this.notebook) return;
    this.notebook = this.scene.add.image(this.notebookAt.x, this.notebookAt.y, 'story-notebook').setOrigin(0.5).setDepth(this.notebookAt.y - 6);
  }
  // the beam erases the darkness as it turns (the observatory's painter, Town.updateLighting)
  light(dark, ox, oy) {
    if (!this.beam) return;
    this.beamBrush.setRotation(this.beam.rotation).setAlpha(0.8 * this.beam.alpha);
    dark.erase(this.beamBrush, this.lamp.x - ox, this.lamp.y - oy);
  }

  // ---------------------------------------------------------------- every frame
  update(time, delta = 16) {
    this.weather.update(time, delta);
    if (this.beam) this.beam.setRotation(time / 1600);
    if ((this.t += delta) > 600) { this.t = 0; this.refresh(); }
    // smoke, once the ship is lit again (it will leave one day)
    if (this.funnels && state.ended && Math.random() < delta / 500) for (const f of this.funnels) {
      const p = this.scene.add.image(f.x, f.y, 'story-puff').setDepth(this.ship.depth + 1).setAlpha(0.55).setScale(0.35);
      this.scene.tweens.add({ targets: p, x: f.x - 26 - Math.random() * 14, y: f.y - 18 - Math.random() * 8, scale: 1.1, alpha: 0, duration: 4200, onComplete: () => p.destroy() });
    }
  }

  // ---------------------------------------------------------------- the arrival
  async begin() {
    const st = (state.story ||= {});
    if (SKIP_ARRIVAL && !st.arrived) { Object.assign(st, { arrived: true, arrivedAt: Date.now(), notebook: true, name: st.name || tr(S_WORDS.defaultName) }); state.seenIntro = true; save(); this.notebook?.destroy(); this.notebook = null; }
    if (!st.arrived) await playOpening(this.ui);
    if (!st.notebook) await this.findNotebook();
    if (!state.seenIntro) await this.masterIntro();
  }
  async findNotebook() {
    const sc = this.scene, first = Q.core[0];
    await cinema(this.ui, async (c) => {
      // the ship first, dark at the pier; then the boards of the quay
      if (this.shipAt) { await c.dim(1, 0); await c.zoom(0.8, 0); await c.pan(this.shipAt.x, this.shipAt.y, 0); await c.dim(0, 900); await c.sleep(1400); }
      if (this.notebookAt) { await c.pan(this.notebookAt.x, this.notebookAt.y - 10, 1600); await c.zoom(1.5, 900); }
      c.theme('opening');
      // the notebook, close: soaked, on the wet boards (a few marks scratched in its cover, for the attentive)
      await c.dim(1, 600);
      let v = view(c.root, objectPainter('notebook'), { tally: TALLY, rain: 0.7, push: 0.05 });
      await c.dim(0, 900);
      const L = tr(S_WORDS.notebook);
      await c.say(L[0]); await c.say(L[1]);
      // the one line that can still be read, in the notebook's hand
      await c.dim(1, 500); v.stop();
      v = view(c.root, objectPainter('leaf'), { text: fill(tr(S_WORDS.firstLine), { place: first?.name || '' }), push: 0.04 });
      await c.dim(0, 700);
      await c.say(L[2], { min: 3200 });
      await c.dim(1, 600); v.stop(); await c.dim(0, 0);
    }, { scene: sc });
    state.story.notebook = true; save();
    this.notebook?.destroy(); this.notebook = null;
  }
  async masterIntro() {
    const sc = this.scene, m = sc.npcs.find((n) => n.def.id === 'guide');
    sc.locked = true;
    m?.faceToward(sc.player.tx, sc.player.ty);
    await this.ui.say(tr(S_WORDS.masterIntro), { name: tr(S_WORDS.master) });
    state.seenIntro = true; save();
    m?.face(m.home);
    sc.locked = false;
  }

  // ---------------------------------------------------------------- back from a house
  async returned(id) {
    const st = (state.story ||= {}), seen = (st.lit ||= {});
    const r = Q.progress(state).find((x) => x.id === id), b = BUILDINGS.find((x) => x.id === id);
    const lightUp = r && b && rememberedRow(r) && !seen[id];
    const understood = st.understood === 1;
    if (!lightUp && !understood) return;
    const sc = this.scene;
    if (lightUp) { seen[id] = true; save(); this.fade[id] = 0; }
    const before = this.weather.now;
    await cinema(this.ui, async (c) => {
      if (lightUp) {
        await c.zoom(0.7, 900);
        await c.pan((b.x + b.w / 2) * T, (b.y + b.h / 2) * T - 10, 700);
        c.theme('fragment');
        await new Promise((res) => sc.tweens.addCounter({ from: 0, to: 1, duration: c.skipped ? 0 : 1800, onUpdate: (tw) => { this.fade[id] = tw.getValue(); }, onComplete: res }));
        delete this.fade[id];
        this.refresh();
        await c.say(fill(tr(S_WORDS.windowLit), { place: PLACE[id]?.name || '' }));
        if (this.weather.target < before - 0.05) await c.say(tr(S_WORDS.rainEases));
      }
      if (understood && this.lamp) {
        await c.zoom(0.8, 800);
        await c.pan(this.lamp.x, this.lamp.y + 70, 2200);
        await c.say(tr(S_WORDS.understood)[2]);
        await c.say(fill(tr(S_WORDS.lastLine), { word: theWord() }), { min: 3600 });
      }
    }, { scene: sc });
    delete this.fade[id];
    if (understood) { st.understood = 2; save(); }
  }

  // ---------------------------------------------------------------- people, by stage
  async talk(npc) {
    const sc = this.scene, ui = this.ui, name = npc.def.name;
    npc.faceToward(sc.player.tx, sc.player.ty);
    sfx.select();
    if (state.ended && !state.cheered?.[npc.def.id]) {
      (state.cheered ||= {})[npc.def.id] = true; save();
      await ui.say([talkDeck.draw('cheer', tr(Q_WORDS.congrats))], { name });
    }
    const stage = stageNow(state), guide = npc.def.id === 'guide', t = TALK[npc.def.id] || { options: [] };
    // cold people answer curtly; the harbour master gives the way grudgingly; the notebook always has it
    const what = () => (stage === 'cold' && !guide ? curtLine() : sc.whatNow());
    // the way back to the ship: everyone says goodbye, as to someone they have seen leave before
    if (state.passedLeague && !state.ended) { await ui.say([guide ? tr(S_WORDS.berth) : talkDeck.draw('bye', tr(S_WORDS.farewell))], { name }); npc.face(npc.home); return true; }
    const opts = [[tr(Q_WORDS.ask), what], ...(stage === 'cold' ? [] : t.options.map((o) => [o[0], () => o[1]]))];
    const nodes = { root: { say: greeting(state), options: [...opts.map((o, i) => ({ label: o[0], to: `a${i}` })), { label: tr({ en: 'Bye', it: 'Ciao' }) }] } };
    opts.forEach((o, i) => { nodes[`a${i}`] = { get say() { return o[1](); }, options: [...opts.filter((_, j) => j !== i).map((x) => ({ label: x[0], to: `a${opts.indexOf(x)}` })), { label: tr({ en: 'Thanks, bye', it: 'Grazie, ciao' }) }] }; });
    await ui.converse(name, nodes);
    npc.face(npc.home);
    return true;
  }
  whatNowLine() { return answerLine(Q.nextStep(state), undefined, { gate: false }); }

  // ---------------------------------------------------------------- doors, the ship, the notebook
  async door(b) { if (!b.league) return false; await lighthouseDoor(this.scene); return true; }
  onShip(x, y) { return !!HARBOUR?.shipTiles.some(([a, c]) => a === x && c === y); }
  onNotebook(x, y) { return !!this.notebook && HARBOUR && HARBOUR.notebook.x === x && HARBOUR.notebook.y === y; }
  prompt(x, y) {
    if (this.onShip(x, y)) return `Space  ${tr(state.passedLeague && !state.ended ? S_WORDS.shipLines.board : S_WORDS.ship)}`;
    if (this.onNotebook(x, y)) return `Space  ${tr(S_WORDS.notebookPrompt)}`;
    return null;
  }
  use(x, y) {
    if (this.onShip(x, y) && state.passedLeague && !state.ended) { playEnding(this.scene); return true; }
    if (this.onShip(x, y)) { const L = S_WORDS.shipLines; say(this.scene, tr(state.ended ? L.ended : stageNow(state) === 'cold' ? L.cold : L.later)); return true; }
    if (this.onNotebook(x, y)) { say(this.scene, tr(S_WORDS.dropped)); return true; }
    return false;
  }
  // walking onto the end of the pier, once the lamp is lit: the ending
  step(x, y) { if (state.passedLeague && !state.ended && HARBOUR?.pier.some((p) => p.x === x && p.y === y)) playEnding(this.scene); }
  // the notebook and the ship stand on tiles one cannot walk on
  blocks(x, y) { return this.onNotebook(x, y); }
}
