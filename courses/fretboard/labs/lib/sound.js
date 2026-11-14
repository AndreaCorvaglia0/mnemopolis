// Port Octave: the sound of the labs, behind one small helper so that the stations do not depend on
// how sound is made. The names follow the engine's lab sound API (references/10-games.md, "Sound for
// labs and games"): sound(ctx) -> { pluck, tone, chord, hold, rich, stopAll, on, wave }.
// Every frequency asked for is exactly the one played: notes are rendered sample by sample
// (additive synthesis of a string's harmonics), sustained tones are oscillators that can glide.
// The stations draw what sounds from the same numbers, so they work with the sound off.

let ac = null, bus = null;
const AC = () => (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) || null;
function io() {
  if (!ac) {
    const A = AC(); if (!A) return null;
    try {
      ac = new A();
      const lim = ac.createDynamicsCompressor(); lim.threshold.value = -12; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.2;
      bus = ac.createGain(); bus.gain.value = 0.5; bus.connect(lim); lim.connect(ac.destination);
    } catch (e) { ac = null; return null; }
  }
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  return { ctx: ac, bus };
}

// a plucked string: harmonics n = 1..N with the spectrum of a string plucked at 1/5 of its length,
// each decaying a little faster than the one below (only = keep only harmonics that are multiples of it)
export function pluckSamples(f, rate, { dur = 1.6, gain = 0.5, only = 1, pos = 0.2, bright = 1 } = {}) {
  const n = Math.floor(dur * rate), out = new Float32Array(n), parts = [];
  for (let k = only; k * f < Math.min(9000, rate / 2.2) && k <= 24; k += only) {
    const a = Math.abs(Math.sin(k * Math.PI * pos)) / k ** (1.6 - 0.4 * bright);
    if (a > 1e-3) parts.push([k * f, a, 2.2 + 0.9 * k]);
  }
  const sum = parts.reduce((s, p) => s + p[1], 0) || 1;
  for (const [fk, a, dec] of parts) {
    const w = (2 * Math.PI * fk) / rate, amp = (a / sum) * gain;
    for (let i = 0; i < n; i++) out[i] += amp * Math.sin(w * i) * Math.exp((-dec * i) / rate);
  }
  const att = Math.floor(0.004 * rate), rel = Math.floor(0.08 * rate);
  for (let i = 0; i < att; i++) out[i] *= i / att;
  for (let i = 0; i < rel; i++) out[n - 1 - i] *= i / rel;
  return out;
}

export function sound(owner = null) {
  const voices = new Set();
  const api = {
    get on() { return !!io(); },
    pluck(f, o = {}) {
      const s = io(); if (!s || !(f > 0)) return null;
      const smp = pluckSamples(f, s.ctx.sampleRate, o), b = s.ctx.createBuffer(1, smp.length, s.ctx.sampleRate);
      b.copyToChannel(smp, 0);
      const src = s.ctx.createBufferSource(), g = s.ctx.createGain(); src.buffer = b; src.connect(g); g.connect(s.bus);
      src.start(s.ctx.currentTime + 0.01 + (o.at || 0));
      const v = { stop() { try { g.gain.setTargetAtTime(0, s.ctx.currentTime, 0.02); src.stop(s.ctx.currentTime + 0.1); } catch (e) { /* done */ } } };
      voices.add(v); src.onended = () => voices.delete(v);
      return v;
    },
    tone(f, o = {}) { return api.pluck(f, { ...o, pos: 0.5, bright: 0 }); },
    // notes in Hz, strummed from the first (arp seconds apart)
    chord(fs, { arp = 0.035, dur = 2.2, gain } = {}) { const g = gain ?? Math.min(0.45, 0.8 / Math.sqrt(fs.length)); return fs.map((f, i) => api.pluck(f, { dur, gain: g, at: i * arp })); },
    // a sustained sine that can glide: { freq(f), gain(g), stop() }
    hold(f, { gain = 0.2, type = 'sine' } = {}) {
      const s = io(); let o = null, g = null;
      if (s) { o = s.ctx.createOscillator(); g = s.ctx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, s.ctx.currentTime); g.gain.linearRampToValueAtTime(gain, s.ctx.currentTime + 0.08); o.connect(g); g.connect(s.bus); o.start(); }
      const v = {
        freq(nf) { if (o) o.frequency.setTargetAtTime(nf, s.ctx.currentTime, 0.02); return v; },
        gain(ng) { if (g) g.gain.setTargetAtTime(ng, s.ctx.currentTime, 0.03); return v; },
        stop() { voices.delete(v); if (o) { g.gain.setTargetAtTime(0, s.ctx.currentTime, 0.05); const oo = o; setTimeout(() => { try { oo.stop(); } catch (e) { /* done */ } }, 300); o = null; } },
      };
      voices.add(v); return v;
    },
    // a sustained tone with harmonics 1..n at amplitudes 1/k: what beats against another string
    rich(f, { n = 6, gain = 0.16 } = {}) {
      const hs = Array.from({ length: n }, (_, i) => api.hold(f * (i + 1), { gain: gain / (i + 1) }));
      const v = { freq(nf) { hs.forEach((x, i) => x.freq(nf * (i + 1))); return v; }, stop() { hs.forEach((x) => x.stop()); voices.delete(v); } };
      voices.add(v); return v;
    },
    stopAll() { for (const v of [...voices]) v.stop(); voices.clear(); },
  };
  owner?.onCleanup?.(() => api.stopAll());
  return api;
}

// The sum of two (or more) strings with harmonics 1..n at 1/k, at time t (seconds): what the
// stations draw. tones: [[f, amplitude], ...]
export function richAt(tones, t, n = 6) {
  let y = 0;
  for (const [f, a] of tones) for (let k = 1; k <= n; k++) y += (a / k) * Math.sin(2 * Math.PI * f * k * t);
  return y;
}

// One gentle line, once per station, that sound helps here and that the picture is enough without it.
export function soundNote(ctx) {
  const t = setTimeout(() => { if (!ctx.alive || ctx.alive()) ctx.nudge?.('Sound helps here: turn the volume up a little. With it off, the picture shows the same thing.', 6000); }, 1200);
  ctx.onCleanup?.(() => clearTimeout(t));
}
