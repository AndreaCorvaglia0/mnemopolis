// The soundscape as a Web Audio graph. Works on a live AudioContext and on an OfflineAudioContext
// (scripts/soundcheck.mjs renders minutes of it in headless Chrome and measures them). It imports
// nothing from the game: index.js owns the context, the settings and the game state.
//
//   pads  -> padLP -> bedOut ---------+-> dry ------------------+
//   notes -> noteLP -> notesOut ------+-> hallSend -> convolver +-> music (on/off) -> master
//   motif cues -> cueOut -------------+-> roomSend -> 2 delays -+                     ^
//   duel pulse --------------------------------------------------------------------+   |
//   place: water, wind, fountain (looped noise), crickets, birds, creaks -> place ----+-> limiter -> out
//   sfx (steps, clicks...) -> sfxLP -> sfx --------------------------------------------+
//
// Nothing is allocated per frame: pump() is called on a timer (or once, offline) and creates the
// short-lived oscillators of the events it schedules; the beds of noise run all the time.
import { Planner, hz, snap, CUES, themeNotes } from './theory.js';

// Every level in one place (linear gains). Measured, not guessed: see ENGINE.md "Sound".
export const LEVELS = {
  master: 0.9, // times the volume of world.json (default 0.6); raised from 0.36: inaudible on phone speakers
  pad: 0.038, note: 0.08, cue: 0.09, drone: 0.05, choir: 0.018, pulse: 0.03, creak: 0.025,
  water: 0.035, wind: 0.024, fountain: 0.03, cricket: 0.0035, bird: 0.006, sfx: 0.42, // sfx: the old master was 0.5
  theme: 0.1, // the story's theme: a little louder than the sparse notes (0.08), never during labs
  rain: 0.03, // the story's rain, a place sound that follows how much the town remembers
};

const prng = (seed) => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// partials: [ratio, amplitude, share of the ring time]; attack in seconds; ring time in seconds
const VOICES = {
  bell: { attack: 0.014, ring: 6, partials: [[1, 1, 1], [2, 0.28, 0.55], [2.76, 0.22, 0.4], [5.4, 0.07, 0.18]] },
  pluck: { attack: 0.012, ring: 2.4, partials: [[1, 1, 1], [2, 0.16, 0.3], [5.6, 0.05, 0.08]] },
  glass: { attack: 0.45, ring: 5, partials: [[1, 0.8, 1], [1.0017, 0.6, 1], [2, 0.1, 0.6]] },
  box: { attack: 0.006, ring: 3.2, partials: [[1, 1, 1], [2, 0.32, 0.5], [3, 0.1, 0.3], [4.2, 0.06, 0.18]] }, // a music box, for the theme
};

export function createSoundscape(ctx, { piece, rng, out = ctx.destination, volume = 0.6, seed = 1 }) {
  const R = prng(seed); // noise, reverb and place sounds: deterministic too
  const node = {
    gain: (v = 1) => { const g = ctx.createGain(); g.gain.value = v; return g; },
    filter: (type, f, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; },
    osc: (type, f) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; return o; },
    pan: (p) => { if (!ctx.createStereoPanner) return null; const s = ctx.createStereoPanner(); s.pan.value = p; return s; },
  };
  const glide = (param, v, at, tc) => param.setTargetAtTime(Number.isFinite(v) ? v : 0, Math.max(at, ctx.currentTime), tc);
  const via = (src, p, dest) => { const s = node.pan(p || 0); if (s) { src.connect(s); s.connect(dest); } else src.connect(dest); };

  // ---- buffers, made once
  const sr = ctx.sampleRate, noise = ctx.createBuffer(1, sr * 4, sr);
  { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = R() * 2 - 1; }
  const irLen = Math.floor(sr * 4.2), ir = ctx.createBuffer(2, irLen, sr);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c); let lp = 0;
    for (let i = 0; i < irLen; i++) {
      const t = i / sr, k = Math.min(0.97, 0.35 + t * 0.2); // the tail gets darker
      lp = lp * k + (R() * 2 - 1) * (1 - k);
      d[i] = t < 0.025 ? 0 : lp * Math.exp(-t / 0.62) * 3;
    }
  }

  // ---- the graph
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -14; limiter.knee.value = 8; limiter.ratio.value = 6; limiter.attack.value = 0.01; limiter.release.value = 0.4;
  const all = node.gain(1), master = node.gain(volume * LEVELS.master), music = node.gain(1), dry = node.gain(1);
  all.connect(limiter); limiter.connect(out); master.connect(all); music.connect(master); dry.connect(music);
  const padLP = node.filter('lowpass', 620, 0.5), bedOut = node.gain(0), noteLP = node.filter('lowpass', 2600, 0.5), notesOut = node.gain(0);
  padLP.connect(bedOut); noteLP.connect(notesOut);
  const cueOut = node.gain(1), pulseOut = node.gain(1);
  const hallSend = node.gain(0.7), conv = ctx.createConvolver(); conv.buffer = ir;
  const roomSend = node.gain(0), d1 = ctx.createDelay(0.2), d2 = ctx.createDelay(0.2), fb1 = node.gain(0.42), fb2 = node.gain(0.4), roomLP = node.filter('lowpass', 2400, 0.5), roomOut = node.gain(0.6);
  d1.delayTime.value = 0.037; d2.delayTime.value = 0.053;
  roomSend.connect(d1); roomSend.connect(d2); d1.connect(roomLP); roomLP.connect(fb1); fb1.connect(d2); d2.connect(fb2); fb2.connect(d1); d1.connect(roomOut); d2.connect(roomOut); roomOut.connect(music);
  for (const b of [bedOut, notesOut, cueOut]) { b.connect(dry); b.connect(hallSend); b.connect(roomSend); }
  hallSend.connect(conv); conv.connect(music); pulseOut.connect(music);
  const cueSend = node.gain(0.5); cueOut.connect(cueSend); cueSend.connect(conv);

  // place sounds: three loops of noise, filtered, slowly breathing
  const place = node.gain(0);
  const outdoor = node.gain(1); // multiplies the place loops (index.js: 0 indoors)
  const outdoor0 = () => outdoor;
  const loop = (rate, offset) => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.playbackRate.value = rate; s.start(ctx.currentTime, offset); return s; };
  const lfo = (f, depth, param) => { const o = node.osc('sine', f), g = node.gain(depth); o.connect(g); g.connect(param); o.start(); return g; };
  const water = node.gain(0), wind = node.gain(0), fount = node.gain(0), rain = node.gain(0);
  { const f = node.filter('lowpass', 420, 0.6), sw = node.gain(1); loop(1, 0).connect(f); f.connect(sw); sw.connect(water); lfo(0.09, 0.45, sw.gain); lfo(0.023, 120, f.frequency); }
  { const f = node.filter('bandpass', 520, 0.9), sw = node.gain(1); loop(0.5, 1.3).connect(f); f.connect(sw); sw.connect(wind); lfo(0.047, 260, f.frequency); lfo(0.071, 0.5, sw.gain); }
  { const f = node.filter('bandpass', 1300, 0.7), f2 = node.filter('lowpass', 3200, 0.5), sw = node.gain(1); loop(1, 2.7).connect(f); f.connect(f2); f2.connect(sw); sw.connect(fount); lfo(2.3, 0.18, sw.gain); }
  // rain (the story): a broad hiss, low-passed under 3.4 kHz, with a slow swell
  { const f = node.filter('bandpass', 1500, 0.35), f2 = node.filter('lowpass', 3400, 0.5), sw = node.gain(1); loop(0.8, 3.1).connect(f); f.connect(f2); f2.connect(sw); sw.connect(rain); lfo(0.05, 0.2, sw.gain); }
  for (const g of [water, wind, fount]) g.connect(place);
  rain.connect(outdoor0());
  const sfx = node.gain(LEVELS.sfx), sfxLP = node.filter('lowpass', 5200, 0.5); sfx.connect(sfxLP); sfxLP.connect(all); // not under the music volume
  place.connect(outdoor); outdoor.connect(master);

  // ---- voices
  function tone(e, dest, level, ring = 1) {
    const v = VOICES[e.voice] || VOICES.bell, f0 = hz(e.midi), t = e.t, T = v.ring * ring;
    const sum = node.gain(level * e.vel);
    for (const [ratio, amp, share] of v.partials) {
      const f = f0 * ratio; if (f > 5200) continue; // no harsh highs
      const o = node.osc('sine', f), g = node.gain(0);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + v.attack); g.gain.setTargetAtTime(0, t + v.attack, (T * share) / 5);
      o.connect(g); g.connect(sum); o.start(t); o.stop(t + T * share + 0.2);
    }
    via(sum, e.pan, dest);
  }
  function padVoice(e, dest, level, wave = piece.wave) {
    const f = hz(e.midi), t = e.t, a = e.attack ?? 5, rel = Math.min(9, e.dur * 0.4), env = node.gain(0);
    // a soft body (triangle or sine) and a quieter saw: the saw is what the low-pass opens by day
    const saw = wave === 'sawtooth', o1 = node.osc(saw ? 'triangle' : wave, f), o2 = node.osc('sawtooth', f), g2 = node.gain(saw ? 0.6 : 0.3);
    o1.detune.setValueAtTime(-7, t); o1.detune.linearRampToValueAtTime(3, t + e.dur);
    o2.detune.setValueAtTime(8, t); o2.detune.linearRampToValueAtTime(-4, t + e.dur);
    const peak = level * e.vel * (saw ? 0.75 : wave === 'sine' ? 1.15 : 1);
    env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(peak, t + a);
    env.gain.setValueAtTime(peak, t + e.dur - rel); env.gain.linearRampToValueAtTime(0, t + e.dur);
    o1.connect(env); o2.connect(g2); g2.connect(env); via(env, e.pan, dest);
    o1.start(t); o2.start(t); o1.stop(t + e.dur + 0.1); o2.stop(t + e.dur + 0.1);
  }
  function drone(e) { // a foghorn far out: two low saws beating, very dark
    const f = hz(e.midi), t = e.t, lp = node.filter('lowpass', 240, 0.8), env = node.gain(0), pk = LEVELS.drone * e.vel;
    env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(pk, t + 2.6); env.gain.setValueAtTime(pk, t + e.dur - 4.5); env.gain.linearRampToValueAtTime(0, t + e.dur);
    for (const m of [1, 1.006]) { const o = node.osc('sawtooth', f * m); o.connect(lp); o.start(t); o.stop(t + e.dur + 0.1); }
    lp.connect(env); env.connect(padLP);
  }
  function choir(e) { // a faint "ah": saws through two formants, with a slow vibrato
    const f = hz(e.midi), t = e.t, env = node.gain(0), pk = LEVELS.choir * e.vel, vib = node.osc('sine', 4.6), vg = node.gain(f * 0.004);
    env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(pk, t + 5); env.gain.setValueAtTime(pk, t + e.dur - 6); env.gain.linearRampToValueAtTime(0, t + e.dur);
    vib.connect(vg);
    for (const m of [1, 1.004]) { const o = node.osc('sawtooth', f * m); vg.connect(o.frequency); for (const [ff, q] of [[650, 5], [1080, 6]]) { const bp = node.filter('bandpass', ff, q); o.connect(bp); bp.connect(env); } o.start(t); o.stop(t + e.dur + 0.1); }
    vib.start(t); vib.stop(t + e.dur + 0.1);
    via(env, e.pan, padLP);
  }
  function creak(e) { // old boards: a short rubbed saw, wobbling, far in the room
    const t = e.t, d = 0.5 + R() * 0.5, o = node.osc('sawtooth', 95 + R() * 40), bp = node.filter('bandpass', 650 + R() * 300, 3), env = node.gain(0), pk = LEVELS.creak * e.vel;
    o.frequency.setValueAtTime(o.frequency.value, t); o.frequency.linearRampToValueAtTime(o.frequency.value * (1.3 + R() * 0.4), t + d * 0.6); o.frequency.linearRampToValueAtTime(o.frequency.value * 1.1, t + d);
    env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(pk, t + 0.06); env.gain.setValueAtTime(pk * 0.7, t + d * 0.7); env.gain.linearRampToValueAtTime(0, t + d);
    o.connect(bp); bp.connect(env); via(env, e.pan, master); env.connect(roomSend);
    o.start(t); o.stop(t + d + 0.05);
  }
  function pulse(e) { // lub-dub, very soft
    for (const [dt, k] of [[0, 1], [0.28, 0.6]]) {
      const t = e.t + dt, f = hz(e.midi), o = node.osc('sine', f * 1.5), g = node.gain(0), pk = LEVELS.pulse * e.vel * k;
      o.frequency.setValueAtTime(f * 1.5, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.09);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + 0.025); g.gain.setTargetAtTime(0, t + 0.025, 0.09);
      o.connect(g); g.connect(pulseOut); o.start(t); o.stop(t + 0.6);
    }
  }
  function chirps(kind, t0, t1, level) { // crickets at night, birds by day: a few short sine figures
    if (level < 0.02) return;
    let t = t0 + R() * (t1 - t0);
    while (t < t1) {
      if (kind === 'cricket') {
        const o = node.osc('sine', 4100 + R() * 500), g = node.gain(0), pk = LEVELS.cricket * level * (0.5 + R() * 0.5), n = 3 + Math.floor(R() * 3);
        g.gain.setValueAtTime(0, t);
        for (let i = 0; i < n; i++) { const a = t + i * 0.055; g.gain.linearRampToValueAtTime(pk, a + 0.012); g.gain.linearRampToValueAtTime(0, a + 0.035); }
        o.connect(g); via(g, (R() - 0.5) * 1.6, place); o.start(t); o.stop(t + n * 0.055 + 0.05);
        t += 0.6 + R() * (2.4 / level);
      } else {
        const o = node.osc('sine', 2300), g = node.gain(0), pk = LEVELS.bird * level * (0.5 + R() * 0.5), n = 2 + Math.floor(R() * 3), lo = 2000 + R() * 800;
        g.gain.setValueAtTime(0, t);
        for (let i = 0; i < n; i++) { const a = t + i * 0.13; o.frequency.setValueAtTime(lo, a); o.frequency.linearRampToValueAtTime(lo * (1.25 + R() * 0.3), a + 0.08); g.gain.linearRampToValueAtTime(pk, a + 0.02); g.gain.linearRampToValueAtTime(0, a + 0.09); }
        o.connect(g); via(g, (R() - 0.5) * 1.6, place); g.connect(hallSend); o.start(t); o.stop(t + n * 0.13 + 0.05);
        t += 4 + R() * (14 / level);
      }
    }
  }

  // ---- state
  const planner = new Planner(piece, rng, ctx.currentTime);
  let mix = { bed: 0, notes: 0, density: 0, voices: 2, place: 0 }, levels = { water: 0, wind: 0, fountain: 0, crickets: 0, birds: 0 }, tChirp = ctx.currentTime;

  const counts = {};
  const api = {
    piece, counts,
    taps: { bed: bedOut, notes: notesOut, cue: cueOut, place, music, master, all },
    sfxBus: sfx, noise,
    get mix() { return mix; },
    setPiece(p) { piece = p; api.piece = p; planner.setPiece(p); },
    setVolume(v, at = ctx.currentTime) { glide(master.gain, v * LEVELS.master, at, 0.3); },
    setMuted(m, at = ctx.currentTime) { glide(all.gain, m ? 0 : 1, at, 0.05); },
    setMusicOn(on, at = ctx.currentTime) { glide(music.gain, on ? 1 : 0, at, 0.6); },
    // tc: time constant of the glide in seconds (2.5 = about 7 s to settle)
    setMix(m, at = ctx.currentTime, tc = 2.5) {
      mix = m;
      glide(bedOut.gain, m.bed * (piece.bed ?? 1), at, tc);
      glide(notesOut.gain, m.notes, at, tc);
      glide(padLP.frequency, m.padCut * 1.6, at, tc); // x1.6: small speakers reproduce little below 400 Hz glide(noteLP.frequency, m.noteCut, at, tc);
      glide(hallSend.gain, m.hall, at, tc); glide(roomSend.gain, m.room, at, tc);
      glide(place.gain, m.place, at, tc);
    },
    setOutdoor(on, at = ctx.currentTime) { glide(outdoor.gain, on ? 1 : 0, at, 1.2); },
    // the story's rain, 0..1 (it is not under the place mix: the rain is heard as long as one is outdoors)
    setRain(v, at = ctx.currentTime) { glide(rain.gain, Math.max(0, Math.min(1, v)) * LEVELS.rain, at, 2); },
    setPlace(l, at = ctx.currentTime) {
      levels = l;
      glide(water.gain, l.water * LEVELS.water, at, 1.5); glide(wind.gain, l.wind * LEVELS.wind, at, 2);
      glide(fount.gain, l.fountain * LEVELS.fountain, at, 1.5);
    },
    // schedule everything that starts before `until`. music false: only the place sounds.
    pump(until, music = true) {
      const now = ctx.currentTime;
      if (!music) planner.reset(until);
      else for (const e of planner.until(until, mix)) {
        if (e.t < now) continue; // never in the past (after a stall)
        counts[e.type] = (counts[e.type] || 0) + 1;
        if (e.type === 'note') tone(e, noteLP, LEVELS.note);
        else if (e.type === 'pad') padVoice(e, padLP, LEVELS.pad);
        else if (e.type === 'drone') drone(e);
        else if (e.type === 'choir') choir(e);
        else if (e.type === 'creak') creak(e);
        else if (e.type === 'pulse') pulse(e);
      }
      if (until > tChirp) {
        const p = mix.place ?? 0;
        chirps('cricket', Math.max(tChirp, now), until, levels.crickets * p);
        chirps('bird', Math.max(tChirp, now), until, levels.birds * p);
        tChirp = until;
      }
    },
    resync(now = ctx.currentTime) { planner.reset(now); tChirp = now; },
    // the story's theme: a music box over a soft bed; 'full' ends on the ending's cadence. Returns its length.
    theme(kind = 'fragment', at = ctx.currentTime + 0.1) {
      const th = themeNotes(piece, kind);
      for (const n of th.notes) tone({ t: at + n.t, voice: 'box', midi: n.midi, vel: n.vel, pan: 0 }, cueOut, LEVELS.theme, Math.max(0.6, n.dur / 1.2));
      for (const p of th.pads) padVoice({ t: at + p.t, midi: p.midi, dur: p.dur, attack: 1.2, vel: 0.8, pan: 0 }, cueOut, LEVELS.pad * 0.9, 'triangle');
      counts.theme = (counts.theme || 0) + th.notes.length;
      if (th.cadence) return th.length + api.cue('ending', at + th.length + 0.3) + 0.3;
      return th.length + 2.5;
    },
    // the motif, in the variation of the moment; not ducked: it is the answer to the learner
    cue(kind, at = ctx.currentTime + 0.05) {
      const c = CUES[kind]; if (!c) return 0;
      const base = piece.noteRoot, sc = piece.scale;
      c.notes.forEach((s, i) => tone({ t: at + i * c.gap, voice: c.voice, midi: base + snap(s, sc), vel: c.vel * (i === c.notes.length - 1 ? 1 : 0.85), pan: (i - 1.5) * 0.15 }, cueOut, LEVELS.cue));
      const end = at + c.notes.length * c.gap;
      if (c.echo) c.notes.forEach((s, i) => tone({ t: end + 1.4 + i * c.gap * 1.2, voice: c.voice, midi: base + 12 + snap(s, sc), vel: 0.3, pan: 0.4 - i * 0.3 }, cueOut, LEVELS.cue));
      if (c.under) padVoice({ t: at, midi: piece.root + 12, dur: 6, attack: 0.9, vel: 1, pan: 0 }, cueOut, LEVELS.pad * 1.2, 'triangle');
      if (c.cadence) { // the one resolution of the game: IV then I, in major, warm and short
        const r = piece.root + 12, t = end + 0.2;
        [5, 9, 12, 17].forEach((s, i) => padVoice({ t, midi: r + s, dur: 3.2, attack: 0.8, vel: 0.9, pan: (i - 1.5) * 0.3 }, cueOut, LEVELS.pad * 1.1, 'triangle'));
        [0, 4, 7, 12, 16].forEach((s, i) => padVoice({ t: t + 2.6, midi: r + s - (i === 0 ? 12 : 0), dur: 8, attack: 0.9, vel: 0.9, pan: (i - 2) * 0.25 }, cueOut, LEVELS.pad * 1.1, 'triangle'));
        tone({ t: t + 2.6, voice: 'bell', midi: base + 12, vel: 0.7, pan: 0 }, cueOut, LEVELS.cue);
        return end + 11 - at;
      }
      return end + (c.echo ? 4 : 2) - at;
    },
  };
  return api;
}
