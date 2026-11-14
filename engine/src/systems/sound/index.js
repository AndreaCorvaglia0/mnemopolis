// The live side of the sound: one AudioContext, one soundscape, the learner's settings and the
// game state that drives the mix. systems/audio.js re-exports this under the old names, so the
// scenes did not change. See engine/docs/ENGINE.md, "Sound".
//
// Settings: courses/<slug>/world.json  "music": { "mood": "lantern", "volume": 0.6 }  or  false
//           the address                ?mood=mist|lantern|deep
//           the menu                   the Mood button next to Music (saved with the game)
import { DATA, WORLD } from '../../course/_data.js';
import { seeded, THEME } from '../../gen/core.js';
import { state, save } from '../state.js';
import { terrainAt, HUB, MONUMENTS } from '../../world/townMap.js';
import { tr } from '../../mechanics/config.js';
import { compose, MOODS, MOOD_ORDER } from './theory.js';
import { mixFor, placeLevels } from './mix.js';
import { createSoundscape } from './engine.js';
import { makeSfx } from './sfx.js';
import { renderUi, DEFAULT_KEY } from './ui.js';

const CFG = WORLD?.music, NO_MUSIC = CFG === false;
const VOLUME = Math.max(0, Math.min(1, Number(CFG?.volume ?? 0.6)));
const query = () => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(''); } };
// the address first (for listening tests), then the learner's choice, then the course's, then mist
export function chosenMood(q = query(), saved = state.mood, world = CFG) {
  for (const m of [q.get('mood'), saved, world?.mood]) if (MOODS[m]) return m;
  return 'mist';
}

let ctx = null, scape = null, muted = false, musicOn = true, mood = 'mist', timers = [];
let where = { scene: 'town', tod: 'night', square: false, focus: null, ending: false }, town = null, outdoor = true;
const FOUNTAINS = (MONUMENTS || []).filter((m) => m.kind === 'fountain').map((m) => [m.x + 1, m.y]);
const pieceFor = (m) => compose({ id: DATA.id, theme: THEME.name, mood: m, rng: seeded('music') });
const io = () => (ctx && scape && !muted && ctx.state === 'running' ? { ctx, bus: scape.sfxBus, noise: scape.noise } : null);
const fx = makeSfx(io);
const playing = () => !NO_MUSIC && musicOn && !muted;

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended' && !document.hidden) ctx.resume().then(() => scape?.resync()).catch(() => {}); return; }
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return; // no Web Audio: the game is silent, nothing else changes
  try {
    ctx = new AC();
    mood = chosenMood();
    const seed = Math.floor(seeded('music:noise')() * 2 ** 31);
    scape = createSoundscape(ctx, { piece: pieceFor(mood), rng: seeded('music:play'), volume: VOLUME, seed });
    scape.setMusicOn(playing(), ctx.currentTime);
    scape.setOutdoor(outdoor);
    applyMix(0.8);
    // one timer schedules the music a little ahead; one reads the player's tile, once a second
    timers.push(setInterval(() => { if (ctx.state === 'running' && !muted) scape.pump(ctx.currentTime + 1.5, playing()); }, 300));
    timers.push(setInterval(readPlace, 1000));
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend().catch(() => {});
      else ctx.resume().then(() => scape.resync()).catch(() => {});
    });
    if (fireWanted) fx.setFire(fireWanted);
    if (rainWanted) scape.setRain(rainWanted);
  } catch (e) { ctx = null; scape = null; }
}

function applyMix(tc = 2.5) {
  if (!scape) return;
  scape.setMix(mixFor(where, { bright: scape.piece.bright }), ctx.currentTime, tc);
}

function readPlace() {
  if (!scape || !town) return;
  const sc = town;
  if (!sc.sys?.isActive?.() || !sc.player) return;
  const x = sc.player.tx, y = sc.player.ty, tod = sc.tod || 'night', square = Math.hypot(x - HUB.x, y - HUB.y) < 7;
  scape.setPlace(placeLevels(terrainAt, x, y, { tod, fountains: FOUNTAINS }));
  if (tod !== where.tod || square !== where.square) { where = { ...where, tod, square }; applyMix(); }
}

export function toggleMute() {
  muted = !muted;
  if (scape) { scape.setMuted(muted); scape.setMusicOn(playing()); if (!muted) scape.resync(); }
  return muted;
}

// Where the player is. Town passes itself (`setMusic(name, this)`) so the place sounds can follow
// its tiles; other names: 'building' (a room), 'castle' (a dark room, the museum), 'upstairs'.
export function setMusic(name, scene) {
  if (name === 'town' || name === 'night') {
    if (scene) town = scene;
    where = { ...where, scene: 'town', tod: town?.tod || (name === 'night' ? 'night' : 'day') };
  } else {
    town = null;
    where = { ...where, scene: name === 'upstairs' ? 'upstairs' : name === 'castle' ? 'dark' : 'room', square: false };
  }
  applyMix();
  readPlace();
}
export function setMusicOn(on) {
  musicOn = on;
  if (!scape) return;
  scape.setMusicOn(playing());
  if (playing()) scape.resync();
}
// Labs, reading pages, close-ups of locks and duels: the bed ducks to a whisper.
export function duckMusic(on) {
  where = { ...where, focus: on ? 'page' : null };
  applyMix(on ? 0.6 : 1.5);
}
// the story's rain as a place sound, 0..1 (story/weather.js); 0 when the story is off
let rainWanted = 0;
export function setRain(v) { rainWanted = v; scape?.setRain(v); }
export function setSea(level) { outdoor = level > 0; scape?.setOutdoor(outdoor); }
let fireWanted = 0;
export function setFire(level) { fireWanted = level; fx.setFire(level); }

// ---- moods
export function currentMood() { return mood; }
export function setMood(m) {
  if (!MOODS[m]) return mood;
  mood = m; state.mood = m; save();
  if (scape) { scape.setPiece(pieceFor(m)); applyMix(3); }
  return mood;
}
export const cycleMood = () => setMood(MOOD_ORDER[(MOOD_ORDER.indexOf(mood) + 1) % MOOD_ORDER.length]);
// for the menu's settings (mechanics/quest/menu.js): a small cycle button next to Music
export function moodSetting() {
  if (NO_MUSIC) return [];
  if (!ctx) mood = chosenMood();
  return [{ label: tr({ en: 'Mood', it: 'Atmosfera' }), on: () => !state.musicOff, value: () => tr(MOODS[mood].label), toggle: () => { cycleMood(); } }];
}

// ---- the motif and the duel's pulse, as sound effects (the callers already import sfx)
// The small interface sounds of before (square-wave blips) now come from the designed set (ui.js),
// in the course's key; the bigger events (stamp, encounter, gate, whoosh) keep their own.
export const sfx = {
  ...fx.sfx,
  blip: () => uiSound('tab', { gain: 0.7 }),
  select: () => uiSound('button'),
  confirm: () => uiSound('toggleOn'),
  tick: () => uiSound('detent', { v: 0.5 }),
  door: () => uiSound('door'),
  page: () => uiSound('page'),
  right: () => uiSound('right'),
  wrong: () => uiSound('wrong'),
  reveal: () => uiSound('find'),
  ui: uiSound,
  // secret | lock | cat | key | ending. Without music the old chime says it instead.
  motif: (kind) => { if (scape && playing() && ctx.state === 'running') scape.cue(kind); else if (kind !== 'ending') fx.sfx.chime(); },
  // the story's theme (docs/STORY.md): 'fragment' | 'opening' | 'full'. Never over a lab, a page or a
  // remembering; without music, the old chime. Returns its length in seconds (0 when not played).
  theme: (kind = 'fragment') => {
    if (where.focus) return 0;
    if (scape && playing() && ctx.state === 'running') return scape.theme(kind);
    fx.sfx.chime(); return 0;
  },
  horn: () => { if (scape && !muted && ctx.state === 'running') return scape.horn(); return 0; },
  tension: (on) => { where = { ...where, focus: on ? 'duel' : where.focus === 'duel' ? 'page' : where.focus }; applyMix(0.8); },
};

// ---- the sounds of the hands (ui.js): one entry point, buffers rendered once per name and key
const uiCache = new Map();
let uiQuietUntil = 0;
export function uiSound(name, { v, gain = 1 } = {}) {
  const s = io(); if (!s) return;
  const now = s.ctx.currentTime;
  if (name === 'detent' && now < uiQuietUntil) return; // a dragged slider: at most one detent per 45 ms
  if (name === 'detent') uiQuietUntil = now + 0.045;
  const key = scape?.piece ? { root: scape.piece.noteRoot, scale: scape.piece.scale } : DEFAULT_KEY;
  const q = v == null ? '' : Math.round(Math.max(0, Math.min(1, v)) * 7);
  const id = `${name}:${q}:${key.root}`;
  let buf = uiCache.get(id);
  if (!buf) {
    const data = renderUi(name, key, s.ctx.sampleRate, v == null ? undefined : q / 7);
    if (!data.length) return;
    buf = s.ctx.createBuffer(1, data.length, s.ctx.sampleRate); buf.copyToChannel(data, 0); uiCache.set(id, buf);
  }
  const src = s.ctx.createBufferSource(), g = s.ctx.createGain();
  src.buffer = buf; g.gain.value = gain; src.connect(g); g.connect(s.bus); src.start(now + 0.005);
}
export const ui = { sound: uiSound };

// ---- the lab's own bus (lab.js): above the sfx, under a hard limiter, ducking the music while it plays
let lab = null, labActive = 0, labTimer = null;
export function labIO() {
  if (!ctx || !scape) initAudio();
  if (!ctx || !scape) return null;
  if (!lab) {
    const g = ctx.createGain(), lim = ctx.createDynamicsCompressor(), an = ctx.createAnalyser();
    g.gain.value = 0.5; // a source of gain 1 comes out at about -12 dBFS before the limiter
    lim.threshold.value = -9; lim.knee.value = 3; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.15;
    an.fftSize = 2048; an.smoothingTimeConstant = 0.6;
    g.connect(lim); lim.connect(scape.taps.all); g.connect(an);
    lab = { ctx, bus: g, analyser: an };
  }
  return { ...lab, on: !muted && ctx.state === 'running' };
}
// a lab sound starts (and ends `secs` later): the ambient music ducks to a breath meanwhile
export function labSounding(secs = 1) {
  if (!scape) return;
  labActive += 1;
  scape.taps.music.gain.setTargetAtTime(0.15, ctx.currentTime, 0.08);
  setTimeout(() => { labActive = Math.max(0, labActive - 1); if (!labActive) { clearTimeout(labTimer); labTimer = setTimeout(() => { if (!labActive && scape) scape.taps.music.gain.setTargetAtTime(playing() ? 1 : 0, ctx.currentTime, 0.6); }, 300); } }, Math.max(50, secs * 1000));
}
export const soundMuted = () => muted || !ctx;

// for the console: __sound() shows what plays
if (typeof window !== 'undefined') window.__sound = () => ({ ctx: ctx?.state, muted, musicOn, noMusic: NO_MUSIC, mood, key: scape?.piece.key, where, mix: scape?.mix });
