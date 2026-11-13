// The short sound effects of the game (steps, clicks, answers, doors) and the fire of torch-lit
// halls. The same sounds as before; they now go through the sfx bus of engine.js (a gain and a
// gentle low-pass at 5.2 kHz), and the loudest of them were brought down so that nothing jumps out
// of the new, quieter bed. `io()` returns { ctx, bus, noise } or null while there is no sound.
export function makeSfx(io, rnd = Math.random) {
  function tone(freq, dur, type = 'square', vol = 0.08, when = 0, slide = 0) {
    const s = io(); if (!s) return;
    const { ctx, bus } = s, t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, type, freq, vol, when = 0, sweep = 0) {
    const s = io(); if (!s) return;
    const { ctx, bus } = s, t = ctx.currentTime + when, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = s.noise;
    f.type = type; f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.linearRampToValueAtTime(Math.max(60, freq + sweep), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t, rnd() * 3); src.stop(t + dur + 0.05);
  }
  // levels: x0.6 to x0.8 of the old ones for the loud learning sounds (encounter, stamp, right,
  // door, gate), unchanged for the small ones (steps, ticks, blips) that were already quiet
  const sfx = {
    blip: () => tone(880, 0.03, 'square', 0.022),
    select: () => tone(660, 0.06, 'square', 0.04),
    confirm: () => { tone(523, 0.08, 'square', 0.04); tone(784, 0.12, 'square', 0.04, 0.07); },
    bump: () => tone(110, 0.08, 'square', 0.045),
    door: () => { tone(330, 0.08, 'triangle', 0.06); tone(247, 0.12, 'triangle', 0.06, 0.08); },
    encounter: () => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, 0.09, 'square', 0.032, i * 0.07)),
    right: () => [659, 784, 988, 1318].forEach((f, i) => tone(f, 0.12, 'triangle', 0.06, i * 0.08)),
    wrong: () => { tone(330, 0.18, 'sawtooth', 0.03, 0, -120); tone(220, 0.3, 'sawtooth', 0.03, 0.16, -60); },
    stamp: () => [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'triangle', 0.06, i * 0.1)),
    step: (kind = 'path') => {
      if (kind === 'none') return;
      if (kind === 'grass') noise(0.07, 'highpass', 2600, 0.018);
      else if (kind === 'sand') noise(0.08, 'bandpass', 900, 0.02);
      else if (kind === 'wood') { tone(140 + rnd() * 30, 0.04, 'triangle', 0.03); noise(0.03, 'lowpass', 500, 0.018); }
      else if (kind === 'stone') { tone(190 + rnd() * 40, 0.025, 'square', 0.011); noise(0.035, 'bandpass', 1800, 0.018); }
      else tone(90 + rnd() * 30, 0.03, 'triangle', 0.018);
    },
    gate: () => { tone(98, 0.25, 'sawtooth', 0.04, 0, -30); noise(0.3, 'lowpass', 300, 0.05); tone(65, 0.3, 'triangle', 0.07, 0.22); },
    page: () => { noise(0.09, 'highpass', 3000, 0.022); noise(0.12, 'bandpass', 1800, 0.02, 0.07); },
    whoosh: () => { noise(0.28, 'bandpass', 700, 0.04, 0, 2400); tone(392, 0.12, 'triangle', 0.032, 0.12); tone(587, 0.16, 'triangle', 0.032, 0.2); },
    reveal: () => [784, 988, 1175].forEach((f, i) => tone(f, 0.14, 'triangle', 0.04, i * 0.07)),
    tick: () => tone(1200, 0.015, 'square', 0.013),
    splash: () => noise(0.25, 'lowpass', 900, 0.035, 0, -500),
    // ambient life: soft, short, quieter than the learning sounds
    chime: () => [1046, 1318].forEach((f, i) => tone(f, 0.18, 'triangle', 0.022, i * 0.09)),
    thud: () => { tone(90, 0.09, 'triangle', 0.05, 0, -30); noise(0.05, 'lowpass', 400, 0.025); },
    plop: () => { tone(420, 0.06, 'sine', 0.025, 0, -260); noise(0.12, 'lowpass', 700, 0.018, 0.03); },
    flutter: () => { for (let i = 0; i < 4; i++) noise(0.03, 'bandpass', 2400, 0.01, i * 0.05); },
    purr: () => { for (let i = 0; i < 6; i++) tone(55, 0.07, 'sawtooth', 0.012, i * 0.09); },
    echo: () => [0, 0.35, 0.7].forEach((d, i) => tone(392, 0.12, 'triangle', 0.028 / (i + 1), d)),
    creak: () => { tone(180, 0.25, 'sawtooth', 0.016, 0, 120); tone(120, 0.12, 'triangle', 0.032, 0.22); },
  };

  // fire: a low roar plus random crackles, for torch-lit halls. Made on first use.
  let fire = null, level = 0, timer = null;
  function setFire(l) {
    level = l;
    const s = io(); if (!s) return;
    const { ctx, bus } = s;
    if (!fire) {
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter();
      src.buffer = s.noise; src.loop = true;
      f.type = 'lowpass'; f.frequency.value = 420;
      fire = ctx.createGain(); fire.gain.value = 0;
      src.connect(f); f.connect(fire); fire.connect(bus); src.start();
      timer = setInterval(() => { if (level > 0 && io() && rnd() < 0.5) noise(0.02 + rnd() * 0.03, 'bandpass', 1500 + rnd() * 2000, 0.02 * level); }, 140);
    }
    fire.gain.setTargetAtTime(l * 0.05, ctx.currentTime, 0.4);
  }
  return { sfx, setFire, stop: () => { clearInterval(timer); timer = null; fire = null; } };
}
