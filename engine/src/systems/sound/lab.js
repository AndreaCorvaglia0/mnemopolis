// The sound API for labs and mini-games (references/10-games.md, "Sound for labs and games").
//
//   const s = sound(ctx)        ctx: a lab station's ctx or a game's g (anything with onCleanup)
//   s.tone(f, o) s.pluck(f, o) s.piano(f, o) s.bell(f, o)     one note; f in Hz or a note name
//   s.chord(notes, { voice, arp, dur, just, ratios, root })   several at once (or arpeggiated)
//   s.beats(f1, f2, { dur, hold })                            two exact tones together
//   s.hold(f, { voice, gain })                                a sustained tone: freq(f, glide), gain(g), stop()
//   s.play(spec)                                              an item's sound spec from a game ({ hz | note | notes | ratios, voice, dur, arp })
//   s.stopAll()                                               silence (done when the station closes)
//   s.scope()                                                 { wave(n), spectrum(n), sounding() } to draw what sounds
//   s.on                                                      false when sound is off or not started: draw anyway
//   sound.note('A4') 440, sound.midi('A4') 69, sound.name(69, 'it') 'La4', sound.interval(7) 'perfect fifth', sound.ratio('fifth') 1.5
//
// Notes are rendered as samples by synth.js (exactly tuned, measured in Node) and played on the lab's
// own bus: a hard limiter, a level well under clipping, the ambient music ducked while they sound.
// Sustained and beating tones are oscillators, so a slider can glide them.
import { labIO, labSounding } from './index.js';
import { VOICE } from './synth.js';
import { toHz, noteToMidi, midiToName, intervalName, justRatio, chordHz, waveOf, spectrumOf } from './notes.js';
import { soundHz } from '../../mechanics/games/gen.js';

const MAX_GAIN = 0.8; // a single voice never above this before the bus (the bus and the limiter do the rest)
const clampGain = (g, d) => Math.max(0, Math.min(MAX_GAIN, g ?? d));

export function sound(owner = null) {
  const voices = new Set(), parts = new Set(); // what is sounding: nodes to stop; { f, a, until } for the scope
  const io = () => labIO();
  const now = () => io()?.ctx.currentTime ?? performance.now() / 1000;
  const track = (fs, a, dur) => { const until = now() + dur; const ps = fs.map((f) => ({ f, a, until })); ps.forEach((p) => parts.add(p)); setTimeout(() => ps.forEach((p) => parts.delete(p)), dur * 1000 + 50); };

  function buffer(samples, { at = 0, gain = 1 } = {}) {
    const s = io(); if (!s || !s.on) return null;
    const b = s.ctx.createBuffer(1, samples.length, s.ctx.sampleRate); b.copyToChannel(samples, 0);
    const src = s.ctx.createBufferSource(), g = s.ctx.createGain();
    src.buffer = b; g.gain.value = gain; src.connect(g); g.connect(s.bus);
    src.start(s.ctx.currentTime + 0.01 + at);
    const v = { stop: () => { try { g.gain.setTargetAtTime(0, s.ctx.currentTime, 0.02); src.stop(s.ctx.currentTime + 0.1); } catch { /* stopped */ } } };
    voices.add(v); src.onended = () => voices.delete(v);
    labSounding(samples.length / s.ctx.sampleRate + at);
    return v;
  }
  function note(voice, f, o = {}) {
    const hz = toHz(f); if (!Number.isFinite(hz)) return null;
    const dur = o.dur ?? (voice === 'pure' || voice === 'sine' ? 0.9 : voice === 'bell' ? 2.4 : 1.6);
    track([hz], o.gain ?? 0.5, dur);
    const s = io(); if (!s || !s.on) return null;
    const fn = VOICE[voice] || VOICE.pure;
    return buffer(fn(hz, s.ctx.sampleRate, { ...o, dur, gain: clampGain(o.gain, 0.5) }), { at: o.at || 0 });
  }
  // an oscillator that can glide
  function osc(f, { type = 'sine', gain = 0.35, attack = 0.04 } = {}) {
    const s = io(), hz = toHz(f), part = { f: hz, a: gain, until: Infinity };
    parts.add(part);
    let o = null, g = null;
    if (s && s.on) {
      o = s.ctx.createOscillator(); g = s.ctx.createGain();
      o.type = type === 'triangle' ? 'triangle' : 'sine'; o.frequency.value = hz;
      g.gain.setValueAtTime(0, s.ctx.currentTime); g.gain.linearRampToValueAtTime(clampGain(gain), s.ctx.currentTime + attack);
      o.connect(g); g.connect(s.bus); o.start();
    }
    let ducking = setInterval(() => labSounding(0.6), 500); labSounding(0.6);
    const v = {
      freq(nf, glide = 0.03) { const h = toHz(nf); part.f = h; if (o) o.frequency.setTargetAtTime(h, s.ctx.currentTime, Math.max(0.001, glide)); return v; },
      gain(ng) { part.a = ng; if (g) g.gain.setTargetAtTime(clampGain(ng), s.ctx.currentTime, 0.03); return v; },
      stop() { clearInterval(ducking); ducking = null; parts.delete(part); voices.delete(v); if (o) { g.gain.setTargetAtTime(0, s.ctx.currentTime, 0.04); o.stop(s.ctx.currentTime + 0.3); o = null; } },
      get f() { return part.f; },
    };
    voices.add(v);
    return v;
  }

  const api = {
    get on() { return !!io()?.on; },
    tone: (f, o) => note('pure', f, o),
    pluck: (f, o) => note('pluck', f, o),
    piano: (f, o) => note('piano', f, o),
    bell: (f, o) => note('bell', f, o),
    chord(notes, { voice = 'piano', arp = 0, dur, just = false, ratios = null, root = null, gain } = {}) {
      const fs = chordHz(notes, { just, ratios, root });
      const g = gain ?? Math.min(0.5, 0.75 / Math.sqrt(fs.length));
      return fs.map((f, i) => note(voice, f, { dur, gain: g, at: i * arp }));
    },
    beats(f1, f2, { dur = 4, hold = false, gain = 0.3 } = {}) {
      const a = osc(f1, { gain }), b = osc(f2, { gain });
      if (!hold) setTimeout(() => { a.stop(); b.stop(); }, dur * 1000);
      return { freq(i, f) { (i === 0 ? a : b).freq(f); }, stop() { a.stop(); b.stop(); }, voices: [a, b] };
    },
    hold: (f, { voice = 'sine', gain = 0.35 } = {}) => osc(f, { type: voice, gain }),
    // an item's sound in a game
    play(spec = {}, o = {}) {
      const fs = soundHz(spec), voice = spec.voice || 'pure', dur = spec.dur ?? 0.9;
      if (fs.length === 1) return [note(voice, fs[0], { dur, ...o })];
      const g = Math.min(0.5, 0.75 / Math.sqrt(fs.length));
      return fs.map((f, i) => note(voice, f, { dur, gain: g, at: i * (spec.arp || 0) }));
    },
    stopAll() { for (const v of [...voices]) v.stop(); voices.clear(); parts.clear(); },
    scope() {
      return {
        sounding: () => [...parts].filter((p) => p.until > now()).map((p) => ({ f: p.f, a: p.a })),
        wave(n = 512, span = 0.02) {
          const s = io();
          if (s && s.on && parts.size) { const a = new Float32Array(s.analyser.fftSize); s.analyser.getFloatTimeDomainData(a); const out = new Float32Array(n); let pk = 0; for (let i = 0; i < n; i++) { out[i] = a[Math.floor((i / n) * Math.min(a.length, span * s.ctx.sampleRate))]; pk = Math.max(pk, Math.abs(out[i])); } if (pk > 1e-4) { for (let i = 0; i < n; i++) out[i] /= Math.max(pk, 0.25); return out; } }
          return waveOf([...parts].filter((p) => p.until > now()), n, span, now());
        },
        spectrum(n = 256, maxHz = 4000) {
          const s = io();
          if (s && s.on && parts.size) { const a = new Float32Array(s.analyser.frequencyBinCount); s.analyser.getFloatFrequencyData(a); const out = new Float32Array(n), binHz = s.ctx.sampleRate / s.analyser.fftSize; for (let i = 0; i < n; i++) { const db = a[Math.min(a.length - 1, Math.round(((i / n) * maxHz) / binHz))]; out[i] = Math.max(0, Math.min(1, (db + 90) / 70)); } return out; }
          return spectrumOf([...parts].filter((p) => p.until > now()), n, maxHz);
        },
      };
    },
    note: toHz, midi: noteToMidi,
  };
  owner?.onCleanup?.(() => api.stopAll());
  return api;
}
sound.note = toHz;
sound.midi = noteToMidi;
// `name` is a function's own read-only property: defined, not assigned
Object.defineProperty(sound, 'name', { value: (m, lang = 'en', o = {}) => midiToName(typeof m === 'string' ? noteToMidi(m) : m, { lang, ...o }), configurable: true });
sound.interval = (semis, lang = 'en') => intervalName(semis, lang);
sound.ratio = justRatio;
sound.chordHz = chordHz;
