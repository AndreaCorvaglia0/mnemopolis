// Synthesised sound: effects, sea and fire ambience, and a small chiptune sequencer whose
// track follows where the player is. Everything is generated here; there are no audio files.
let ctx = null;
let master = null;
let muted = false;
let seaGain = null;
let fireGain = null;
let musicGain = null;
let noiseBuf = null;

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(master);
    startSea();
    startFire();
    setInterval(schedule, 80);
    if (want) { const w = want; want = null; setMusic(w); }
  } catch (e) { ctx = null; }
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

function tone(freq, dur, type = 'square', vol = 0.08, when = 0, slide = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  blip: () => tone(880, 0.03, 'square', 0.025),
  select: () => tone(660, 0.06, 'square', 0.05),
  confirm: () => { tone(523, 0.08, 'square', 0.05); tone(784, 0.12, 'square', 0.05, 0.07); },
  bump: () => tone(110, 0.08, 'square', 0.05),
  door: () => { tone(330, 0.08, 'triangle', 0.08); tone(247, 0.12, 'triangle', 0.08, 0.08); },
  encounter: () => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, 0.09, 'square', 0.05, i * 0.07)),
  right: () => [659, 784, 988, 1318].forEach((f, i) => tone(f, 0.12, 'triangle', 0.08, i * 0.08)),
  wrong: () => { tone(330, 0.18, 'sawtooth', 0.04, 0, -120); tone(220, 0.3, 'sawtooth', 0.04, 0.16, -60); },
  stamp: () => [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'triangle', 0.09, i * 0.1)),
  step: (kind = 'path') => {
    if (kind === 'none') return;
    if (kind === 'grass') noise(0.07, 'highpass', 2600, 0.02);
    else if (kind === 'sand') noise(0.08, 'bandpass', 900, 0.022);
    else if (kind === 'wood') { tone(140 + Math.random() * 30, 0.04, 'triangle', 0.035); noise(0.03, 'lowpass', 500, 0.02); }
    else if (kind === 'stone') { tone(190 + Math.random() * 40, 0.025, 'square', 0.012); noise(0.035, 'bandpass', 1800, 0.02); }
    else tone(90 + Math.random() * 30, 0.03, 'triangle', 0.02);
  },
  gate: () => { tone(98, 0.25, 'sawtooth', 0.05, 0, -30); noise(0.3, 'lowpass', 300, 0.06); tone(65, 0.3, 'triangle', 0.09, 0.22); },
  page: () => { noise(0.09, 'highpass', 3000, 0.03); noise(0.12, 'bandpass', 1800, 0.025, 0.07); },
  whoosh: () => { noise(0.28, 'bandpass', 700, 0.05, 0, 2400); tone(392, 0.12, 'triangle', 0.04, 0.12); tone(587, 0.16, 'triangle', 0.04, 0.2); },
  reveal: () => [784, 988, 1175].forEach((f, i) => tone(f, 0.14, 'triangle', 0.05, i * 0.07)),
  tick: () => tone(1200, 0.015, 'square', 0.015),
  splash: () => noise(0.25, 'lowpass', 900, 0.04, 0, -500),
  // ambient life: soft, short, quieter than the learning sounds
  chime: () => [1046, 1318].forEach((f, i) => tone(f, 0.18, 'triangle', 0.025, i * 0.09)),
  thud: () => { tone(90, 0.09, 'triangle', 0.06, 0, -30); noise(0.05, 'lowpass', 400, 0.03); },
  plop: () => { tone(420, 0.06, 'sine', 0.03, 0, -260); noise(0.12, 'lowpass', 700, 0.02, 0.03); },
  flutter: () => { for (let i = 0; i < 4; i++) noise(0.03, 'bandpass', 2400, 0.012, i * 0.05); },
  purr: () => { for (let i = 0; i < 6; i++) tone(55, 0.07, 'sawtooth', 0.012, i * 0.09); },
  echo: () => [0, 0.35, 0.7].forEach((d, i) => tone(392, 0.12, 'triangle', 0.03 / (i + 1), d)),
  creak: () => { tone(180, 0.25, 'sawtooth', 0.02, 0, 120); tone(120, 0.12, 'triangle', 0.04, 0.22); },
};

function getNoise() {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

function noise(dur, type, freq, vol, when = 0, sweep = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + when, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = getNoise();
  f.type = type; f.frequency.setValueAtTime(freq, t);
  if (sweep) f.frequency.linearRampToValueAtTime(Math.max(60, freq + sweep), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t, Math.random()); src.stop(t + dur + 0.05);
}

// ---- fire: a low roar plus random crackles, for torch-lit halls ----
let fireLevel = 0;
function startFire() {
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter();
  src.buffer = getNoise(); src.loop = true;
  f.type = 'lowpass'; f.frequency.value = 420;
  fireGain = ctx.createGain(); fireGain.gain.value = 0;
  src.connect(f); f.connect(fireGain); fireGain.connect(master);
  src.start();
  setInterval(() => { if (fireLevel > 0 && !muted && Math.random() < 0.5) noise(0.02 + Math.random() * 0.03, 'bandpass', 1500 + Math.random() * 2500, 0.03 * fireLevel); }, 140);
}
export function setFire(level) {
  fireLevel = level;
  if (fireGain && ctx) fireGain.gain.setTargetAtTime(level * 0.05, ctx.currentTime, 0.4);
}

// ---- music: original loops, one per kind of place ----
const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const hz = (name, oct) => 440 * 2 ** ((SEMI[name] + 12 * (oct + 1) - 69) / 12);
const CHORD = { C: ['C', 'E', 'G'], Em: ['E', 'G', 'B'], F: ['F', 'A', 'C'], G: ['G', 'B', 'D'], Am: ['A', 'C', 'E'], Dm: ['D', 'F', 'A'], 'A#': ['A#', 'D', 'F'], Gm: ['G', 'A#', 'D'], A: ['A', 'C#', 'E'] };
// lead: one token per eighth note. "_" holds the previous note, "." is a rest. One chord per bar.
const TRACKS = {
  town: { bpm: 126, wave: 'square', vol: 0.035, chords: ['C', 'Em', 'F', 'G', 'C', 'G', 'F', 'C'], arp: [0, 1, 2, 1, 0, 1, 2, 1],
    lead: 'E5 _ G5 _ C6 _ B5 A5 G5 _ E5 _ G5 _ _ . F5 _ A5 _ C6 _ A5 G5 D5 _ G5 _ B5 _ _ . E5 _ G5 _ C6 _ D6 E6 D6 _ B5 _ G5 _ _ . A5 _ C6 _ B5 _ G5 A5 G5 _ E5 D5 C5 _ _ .' },
  night: { bpm: 84, wave: 'triangle', vol: 0.06, chords: ['Am', 'F', 'C', 'G'], arp: [0, -1, 1, -1, 2, -1, 1, -1],
    lead: 'E5 _ _ _ A5 _ _ _ C6 _ _ A5 _ _ _ . G5 _ _ _ E5 _ _ _ D5 _ _ B4 _ _ _ .' },
  building: { bpm: 104, wave: 'triangle', vol: 0.055, chords: ['F', 'Am', 'A#', 'C'], arp: [0, 2, 1, 2, 0, 2, 1, 2],
    lead: 'A5 _ C6 _ F5 _ _ . E5 _ A5 _ C6 _ _ . D5 _ F5 _ A#5 _ A5 G5 G5 _ E5 _ C5 _ _ .' },
  castle: { bpm: 88, wave: 'square', vol: 0.028, chords: ['Dm', 'A#', 'Gm', 'A', 'Dm', 'A#', 'Gm', 'A'], arp: [0, 1, 2, 1, 0, 1, 2, 1], low: true,
    lead: 'D5 _ _ F5 E5 _ D5 _ F5 _ _ A5 G5 _ F5 _ G5 _ _ A#5 A5 _ G5 _ A5 _ _ _ C#5 _ E5 _ A5 _ _ F5 G5 _ A5 _ A#5 _ _ A5 G5 _ F5 _ G5 _ F5 E5 D5 _ E5 _ C#5 _ _ _ A4 _ _ .' },
};
let track = null, want = null, stepIx = 0, nextT = 0, musicOn = true, duck = 1;

function voice(freq, dur, wave, vol, t) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = wave; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.setValueAtTime(vol, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + dur + 0.03);
}

function schedule() {
  if (!ctx || !track || !musicOn || muted || ctx.state !== 'running') { if (ctx) nextT = ctx.currentTime + 0.1; return; }
  const tr = TRACKS[track], sd = 30 / tr.bpm, lead = (tr.tokens ||= tr.lead.split(' '));
  while (nextT < ctx.currentTime + 0.3) {
    const i = stepIx % lead.length, tok = lead[i], chord = CHORD[tr.chords[Math.floor(i / 8) % tr.chords.length]];
    if (tok !== '_' && tok !== '.') {
      let n = 1; while (lead[(i + n) % lead.length] === '_' && n < 8) n++;
      voice(hz(tok.slice(0, -1), +tok.slice(-1)), sd * n * 0.95, tr.wave, tr.vol, nextT);
    }
    if (i % 4 === 0) voice(hz(chord[i % 8 === 0 ? 0 : 2], tr.low ? 2 : 3) / (i % 8 === 0 ? 1 : 2), sd * 3.4, 'triangle', 0.07, nextT);
    const a = tr.arp[i % 8];
    if (a >= 0) voice(hz(chord[a], 4), sd * 0.9, 'triangle', 0.022, nextT);
    stepIx++; nextT += sd;
  }
}

// Change the tune when the player moves somewhere else: quick fade out, switch, fade in.
export function setMusic(name) {
  if (!ctx) { want = name; return; }
  if (name === track) return;
  const t = ctx.currentTime;
  musicGain.gain.cancelScheduledValues(t);
  musicGain.gain.setTargetAtTime(0, t, 0.12);
  setTimeout(() => { track = name; stepIx = 0; nextT = ctx.currentTime + 0.05; musicGain.gain.setTargetAtTime(musicOn ? duck : 0, ctx.currentTime, 0.2); }, 450);
}
export function setMusicOn(on) {
  musicOn = on;
  if (ctx) musicGain.gain.setTargetAtTime(on ? duck : 0, ctx.currentTime, 0.15);
}
// Labs and reading pages lower the music so it does not compete with thinking.
export function duckMusic(on) {
  duck = on ? 0.35 : 1;
  if (ctx && musicOn) musicGain.gain.setTargetAtTime(duck, ctx.currentTime, 0.3);
}

function startSea() {
  // Filtered noise with a slow swell
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = 500;
  seaGain = ctx.createGain();
  seaGain.gain.value = 0.0;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.12;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.025;
  lfo.connect(lfoGain);
  lfoGain.connect(seaGain.gain);
  src.connect(filt);
  filt.connect(seaGain);
  seaGain.connect(master);
  src.start();
  lfo.start();
  seaGain.gain.setValueAtTime(0.035, ctx.currentTime);
}

export function setSea(level) {
  if (seaGain && ctx) seaGain.gain.setTargetAtTime(level, ctx.currentTime, 0.5);
}
