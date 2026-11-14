// Port Octave: the sound of the labs, behind one small helper so that the stations do not depend on
// how sound is made. The stations draw what sounds from the same numbers, so they work with the
// sound off.
import { sound as kitSound } from '../../../../engine/src/lab/kit.js';

// The kit's sound (engine/src/systems/sound/lab.js): an exactly tuned Karplus-Strong pluck, sustained
// tones that glide, the lab's own limited bus, the music ducked while it plays, nothing when muted.
// Added here: a sustained string with harmonics (what beats against another string at 3:2) and a
// strum.
export function sound(owner = null) {
  const s = kitSound(owner);
  return {
    get on() { return s.on; },
    pluck: (f, { dur = 1.6, gain = 0.5, at = 0, bright = 0.5 } = {}) => s.pluck(f, { dur, gain, at, bright }),
    tone: (f, o = {}) => s.tone(f, o),
    // notes in Hz, strummed from the first (arp seconds apart)
    chord: (fs, { arp = 0.035, dur = 2.2, gain } = {}) => { const g = gain ?? Math.min(0.45, 0.8 / Math.sqrt(fs.length)); return fs.map((f, i) => s.pluck(f, { dur, gain: g, at: i * arp })); },
    hold: (f, { gain = 0.2 } = {}) => s.hold(f, { gain }),
    // a sustained tone with harmonics 1..n at amplitudes 1/k: a string that keeps sounding
    rich(f, { n = 6, gain = 0.16 } = {}) {
      const hs = Array.from({ length: n }, (_, i) => s.hold(f * (i + 1), { gain: gain / (i + 1) }));
      return { freq(nf) { hs.forEach((x, i) => x.freq(nf * (i + 1))); }, stop() { hs.forEach((x) => x.stop()); } };
    },
    stopAll: () => s.stopAll(),
  };
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

// Calls fn when the frame's phase changes ('ask' -> 'explore' -> 'done'): the stations hide, while the
// prediction is open, what would answer it, and draw it as soon as the learner has committed.
export function onPhase(ctx, fn) {
  let last = ctx.phase?.();
  const id = setInterval(() => { const p = ctx.phase?.(); if (p !== last) { last = p; fn(p); } }, 150);
  ctx.onCleanup?.(() => clearInterval(id));
  return () => ctx.phase?.() === 'ask';
}
