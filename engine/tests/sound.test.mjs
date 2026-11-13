// The pure parts of the sound (src/systems/sound/): scales and keys, the planner's statistics over
// simulated hours, the mapping from game state to mix, the place sounds from tiles, and the Web
// Audio graph against a fake AudioContext (no NaN reaches a parameter). How it actually SOUNDS is
// measured by `npm run sound` (offline render in headless Chrome), not here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SCALES, MOODS, MOOD_ORDER, THEME_SOUND, CUES, compose, snap, step, simulate, Planner, hz } from '../src/systems/sound/theory.js';
import { mixFor, placeLevels, DUCK } from '../src/systems/sound/mix.js';
import { createSoundscape } from '../src/systems/sound/engine.js';
import { seeded } from '../src/gen/core.js';

const piece = (id, theme = 'harbour', mood = 'mist') => compose({ id, theme, mood, rng: seeded('music', id) });
const NIGHT = mixFor({ scene: 'town', tod: 'night' });

test('scales have no leading tone, and snap and step stay inside them', () => {
  for (const [name, sc] of Object.entries(SCALES)) {
    assert.ok(!sc.includes(11), `${name} has a leading tone`);
    assert.equal(sc[0], 0);
    for (let s = -24; s < 36; s++) assert.ok(sc.includes(((snap(s, sc) % 12) + 12) % 12), `${name}: snap(${s})`);
    for (let i = -10; i < 20; i++) assert.ok(sc.includes(((step(i, sc) % 12) + 12) % 12));
  }
  for (const c of Object.values(CUES)) assert.ok(c.notes.length >= 3 && c.notes.length <= 5);
});

test('the piece of a course is deterministic, and courses get different keys', () => {
  assert.deepEqual(piece('chroma'), piece('chroma'));
  assert.notEqual(piece('chroma').key, piece('medical-imaging').key);
  const ids = Array.from({ length: 60 }, (_, i) => `course-${i}`);
  for (const theme of Object.keys(THEME_SOUND)) {
    const keys = new Set(ids.map((id) => piece(id, theme).key));
    assert.ok(keys.size >= 6, `${theme}: only ${keys.size} keys over 60 courses`);
  }
  // the mood keeps the course's tonic (mist, lantern) or moves it a fourth down (deep), and darkens the scale
  const order = Object.keys(SCALES);
  for (const id of ids.slice(0, 20)) {
    const m = piece(id, 'harbour', 'mist'), l = piece(id, 'harbour', 'lantern'), d = piece(id, 'harbour', 'deep');
    assert.equal(m.root, l.root);
    assert.equal(d.root, m.root - 5);
    assert.ok(order.indexOf(l.scaleName) <= order.indexOf(m.scaleName) && order.indexOf(d.scaleName) >= order.indexOf(m.scaleName));
  }
});

// statistics over a simulated hour, for every mood and theme
const HOUR = 3600;
function stats(ev) {
  const notes = ev.filter((e) => e.type === 'note'), pads = ev.filter((e) => e.type === 'pad');
  let maxGap = 0; for (let i = 1; i < notes.length; i++) maxGap = Math.max(maxGap, notes[i].t - notes[i - 1].t);
  // how often the most common five-note phrase comes back
  const grams = new Map(); for (let i = 0; i + 5 <= notes.length; i++) { const k = notes.slice(i, i + 5).map((n) => n.midi).join(','); grams.set(k, (grams.get(k) || 0) + 1); }
  let maxPads = 0; for (let t = 60; t < HOUR; t += 5) maxPads = Math.max(maxPads, pads.filter((p) => p.t <= t && p.t + p.dur > t).length);
  let minPads = 9; for (let t = 60; t < HOUR; t += 5) minPads = Math.min(minPads, pads.filter((p) => p.t <= t && p.t + p.dur > t).length);
  return { perMin: notes.length / (HOUR / 60), maxGap, repeat: Math.max(...grams.values()), distinct: grams.size / Math.max(1, notes.length - 4), maxPads, minPads, notes };
}
for (const mood of MOOD_ORDER) for (const theme of Object.keys(THEME_SOUND)) {
  test(`an hour of ${mood} in a ${theme} town is sparse, never empty, never repeating`, () => {
    const p = piece('chroma', theme, mood), s = stats(simulate(p, seeded('music:play', 'chroma'), HOUR, NIGHT));
    assert.ok(s.perMin > MOODS[mood].rate * 0.6 && s.perMin < MOODS[mood].rate * 1.6, `notes per minute ${s.perMin.toFixed(2)}`);
    assert.ok(s.perMin < 12, 'sparse');
    assert.ok(s.maxGap < 60, `a silence of ${s.maxGap.toFixed(1)} s between notes`);
    assert.ok(s.repeat <= 3, `a five-note phrase came back ${s.repeat} times in an hour`);
    assert.ok(s.distinct > 0.94, `phrases are almost all different (${s.distinct.toFixed(3)})`);
    assert.ok(s.minPads >= 1 && s.maxPads <= 5, `pads at once: ${s.minPads}..${s.maxPads}`);
    for (const n of s.notes) assert.ok(hz(n.midi) > 120 && hz(n.midi) < 1400, `note ${n.midi} out of the gentle range`);
  });
}

test('the planner follows the mix: denser by day, nearly silent on a page, none at the ending', () => {
  const p = piece('chroma'), count = (m) => simulate(p, seeded('music:play', 'x'), 3600, m).filter((e) => e.type === 'note').length;
  const night = count(NIGHT), day = count(mixFor({ scene: 'town', tod: 'day', square: true })), page = count(mixFor({ focus: 'page' })), end = count(mixFor({ ending: true }));
  assert.ok(day > night, `day ${day} vs night ${night}`);
  assert.ok(page < night * 0.3, `page ${page} vs night ${night}`);
  assert.equal(end, 0);
  const up = simulate(p, seeded('music:play', 'x'), 1200, mixFor({ scene: 'upstairs' }));
  const creaks = up.filter((e) => e.type === 'creak').length;
  assert.ok(creaks >= 5 && creaks <= 40, `creaks upstairs in 20 min: ${creaks}`);
  assert.equal(simulate(p, seeded('music:play', 'x'), 600, NIGHT).filter((e) => e.type === 'creak' || e.type === 'pulse').length, 0);
  assert.ok(simulate(p, seeded('music:play', 'x'), 60, mixFor({ focus: 'duel' })).filter((e) => e.type === 'pulse').length > 20);
  // the foghorn only in a harbour town, outdoors; the choir only in a citadel
  assert.ok(simulate(p, seeded('a'), 1800, NIGHT).some((e) => e.type === 'drone'));
  assert.ok(!simulate(p, seeded('a'), 1800, mixFor({ scene: 'room' })).some((e) => e.type === 'drone'));
  assert.ok(simulate(piece('chroma', 'citadel'), seeded('a'), 600, NIGHT).some((e) => e.type === 'choir'));
  assert.ok(!simulate(piece('chroma', 'nordic'), seeded('a'), 600, NIGHT).some((e) => e.type === 'choir' || e.type === 'drone'));
});

test('a reset after a pause owes nothing from the past', () => {
  const pl = new Planner(piece('chroma'), seeded('r'), 0);
  pl.until(30, NIGHT); pl.reset(1000);
  assert.ok(pl.until(1001, NIGHT).every((e) => e.t >= 1000));
});

test('game state -> mix', () => {
  const night = mixFor({ scene: 'town', tod: 'night' }), day = mixFor({ scene: 'town', tod: 'day' }), dusk = mixFor({ scene: 'town', tod: 'dusk' });
  const square = mixFor({ scene: 'town', tod: 'night', square: true }), room = mixFor({ scene: 'room' }), up = mixFor({ scene: 'upstairs' }), dark = mixFor({ scene: 'dark' });
  assert.ok(night.padCut < dusk.padCut && dusk.padCut < day.padCut, 'night darker than dusk, dusk darker than day');
  assert.ok(day.warmth > night.warmth && day.density > night.density);
  assert.ok(square.voices > night.voices && square.bed > night.bed, 'the square is fuller');
  assert.ok(room.hall < night.hall && room.room > 0 && room.place === 0, 'indoors: closer, drier, no place sounds');
  assert.ok(up.bed < room.bed && up.notes < room.notes && up.creak > 0, 'upstairs: very quiet, creaks');
  assert.ok(dark.padCut < room.padCut);
  for (const w of [{ scene: 'town' }, { scene: 'room' }, { scene: 'upstairs' }]) {
    const a = mixFor(w), b = mixFor({ ...w, focus: 'page' });
    assert.ok(Math.abs(b.bed - a.bed * DUCK) < 1e-9, 'a page ducks the bed to a whisper');
    assert.ok(b.density < a.density * 0.2 && b.pulse === 0);
  }
  assert.equal(mixFor({ scene: 'room', focus: 'duel' }).pulse, 1);
  assert.equal(mixFor({ ending: true }).density, 0);
  // the mood's brightness moves the filters
  assert.ok(mixFor({}, { bright: 0.7 }).padCut < mixFor({}, { bright: 1.3 }).padCut);
  for (const m of [night, day, square, room, up, dark]) for (const [k, v] of Object.entries(m)) assert.ok(Number.isFinite(v), `${k} is ${v}`);
});

test('place sounds come from the tiles around the player', () => {
  const map = ['~~~~~~~~~~~~~~~~~~~~', '~~~~~~~~~~~~~~~~~~~~', 'ssssssssssssssssssss', 'pppppppppppppppppppp', 'gggggggggTTTTTTTTTTT', 'gggggggggTTTTTTTTTTT', 'GGGGGGGGGTTTTTTTTTTT', 'gggggggggTTTTTTTTTTT', 'cccccccccccccccccccc', 'cccccccccccccccccccc'];
  const at = (x, y) => map[y]?.[x] ?? 'T';
  const shore = placeLevels(at, 3, 2, { tod: 'night' }), grass = placeLevels(at, 3, 6, { tod: 'night' }), grove = placeLevels(at, 15, 5, { tod: 'night' });
  assert.ok(shore.water > 0.5 && grass.water === 0);
  assert.ok(grass.crickets > shore.crickets && grass.birds === 0);
  assert.ok(grove.wind > grass.wind);
  const day = placeLevels(at, 3, 6, { tod: 'day' });
  assert.ok(day.crickets === 0 && day.birds > 0.3);
  assert.ok(placeLevels(at, 3, 9, { fountains: [[4, 9]] }).fountain > 0.8 && placeLevels(at, 3, 2, { fountains: [[4, 9]] }).fountain < 0.3);
  for (const v of Object.values(shore)) assert.ok(v >= 0 && v <= 1);
});

// ---- a fake AudioContext: records every automation value, checks that none is NaN or infinite
function fakeContext() {
  let bad = [], nodes = 0, t = 0;
  const param = (v = 0) => {
    const p = { value: v };
    for (const k of ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime', 'cancelScheduledValues']) p[k] = (val, at, tc) => { if (k !== 'cancelScheduledValues' && ![val, at, tc ?? 0].every(Number.isFinite)) bad.push(`${k}(${val}, ${at}, ${tc})`); if (k === 'exponentialRampToValueAtTime' && val <= 0) bad.push('exponential ramp to 0'); return p; };
    return p;
  };
  const base = () => { nodes++; return { connect() {}, disconnect() {} }; };
  const ctx = {
    sampleRate: 8000, get currentTime() { return t; }, set now(v) { t = v; }, destination: base(), state: 'running',
    createGain: () => ({ ...base(), gain: param(1) }),
    createBiquadFilter: () => ({ ...base(), type: '', frequency: param(350), Q: param(1) }),
    createOscillator: () => ({ ...base(), type: '', frequency: param(440), detune: param(0), start() {}, stop() {} }),
    createStereoPanner: () => ({ ...base(), pan: param(0) }),
    createDelay: () => ({ ...base(), delayTime: param(0) }),
    createConvolver: () => ({ ...base(), buffer: null }),
    createDynamicsCompressor: () => ({ ...base(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }),
    createBufferSource: () => ({ ...base(), buffer: null, loop: false, playbackRate: param(1), start() {}, stop() {} }),
    createBuffer: (ch, len) => { const data = Array.from({ length: ch }, () => new Float32Array(len)); return { getChannelData: (c) => data[c] }; },
  };
  return { ctx, bad: () => bad, nodes: () => nodes };
}

test('the Web Audio graph: a handful of standing nodes, events on demand, no NaN anywhere', () => {
  const f = fakeContext(), p = piece('chroma', 'citadel', 'deep');
  const sc = createSoundscape(f.ctx, { piece: p, rng: seeded('music:play', 'chroma'), seed: 1 });
  const standing = f.nodes();
  assert.ok(standing < 60, `${standing} standing nodes`);
  sc.setMix(NIGHT); sc.setPlace({ water: 0.5, wind: 0.3, fountain: 0.2, crickets: 0.7, birds: 0 });
  for (let t = 0; t < 600; t += 0.3) { f.ctx.now = t; sc.pump(t + 1.5, true); }
  assert.ok(sc.counts.note > 10 && sc.counts.pad > 10, JSON.stringify(sc.counts));
  for (const w of [{ scene: 'room' }, { scene: 'upstairs' }, { focus: 'page' }, { scene: 'room', focus: 'duel' }, { scene: 'town', tod: 'day', square: true }]) { sc.setMix(mixFor(w)); for (let t = 600; t < 700; t += 0.3) { f.ctx.now = t; sc.pump(t + 1.5, true); } }
  for (const k of Object.keys(CUES)) assert.ok(sc.cue(k) > 1);
  sc.setPiece(piece('chroma', 'harbour', 'lantern')); sc.setVolume(0.3); sc.setMusicOn(false); sc.setMuted(true); sc.resync();
  // music off: nothing new is planned, and nothing is owed when it comes back
  const before = sc.counts.note; f.ctx.now = 800; sc.pump(900, false); assert.equal(sc.counts.note, before);
  assert.deepEqual(f.bad(), []);
});

test('the mood: the address, then the learner, then world.json, then mist', async () => {
  const { chosenMood, moodSetting, sfx, initAudio } = await import('../src/systems/sound/index.js');
  const q = (s) => new URLSearchParams(s);
  assert.equal(chosenMood(q('?mood=deep'), 'lantern', { mood: 'mist' }), 'deep');
  assert.equal(chosenMood(q(''), 'lantern', { mood: 'deep' }), 'lantern');
  assert.equal(chosenMood(q('?mood=loud'), undefined, { mood: 'deep' }), 'deep');
  assert.equal(chosenMood(q(''), undefined, undefined), 'mist');
  // without Web Audio (here, Node) everything is silent and nothing throws
  initAudio(); sfx.step('grass'); sfx.motif('lock'); sfx.tension(true); sfx.tension(false);
  const [s] = moodSetting();
  assert.ok(s.label && typeof s.toggle === 'function' && s.value());
});
