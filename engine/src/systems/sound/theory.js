// The music's grammar, pure (no Web Audio, no browser): scales, the piece of a course, the planner
// that decides when the next note, pad or drone happens. engine.js turns its events into sound;
// tests/sound.test.mjs checks its statistics over simulated hours.
//
// Everything here takes its randomness from an rng passed in (gen/core.js `seeded`), so the same
// course always gets the same piece and the same first hour.

// Scales without a leading tone (no semitone 11): nothing pulls home, so the music never sounds
// finished. Ordered from bright to dark; a mood moves a theme's scale along this list.
export const SCALES = {
  lydian: [0, 2, 4, 6, 7, 9], // the major seventh left out on purpose
  majpenta: [0, 2, 4, 7, 9],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  penta2: [0, 2, 3, 5, 7, 10], // minor pentatonic with an added second
  aeolian: [0, 2, 3, 5, 7, 8, 10],
};
const DARKNESS = Object.keys(SCALES);

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
export const noteName = (midi) => `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
export const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// The three moods the learner can choose (menu, ?mood=, world.json "music": { "mood" }).
//   rate: note events per minute at night in the town (the base); gesture: most notes in a row;
//   bright: multiplies the filters; warmth: chance of a third in the pads (0 = open fifths only);
//   timbres: weights of the sparse instruments; register: semitones added to the notes;
//   shift: steps along SCALES (+ darker); bed: level of the sustained pads.
export const MOODS = {
  mist: { label: { en: 'Mist', it: 'Nebbia' }, rate: 4, gesture: 2, bright: 1, warmth: 0.15, register: 0, shift: 0, bed: 1, padDur: [20, 32], timbres: { bell: 0.45, glass: 0.35, pluck: 0.2 } },
  lantern: { label: { en: 'Lantern', it: 'Lanterna' }, rate: 6.5, gesture: 3, bright: 1.3, warmth: 0.45, register: 0, shift: -1, bed: 1, padDur: [16, 26], timbres: { pluck: 0.5, bell: 0.3, glass: 0.2 } },
  deep: { label: { en: 'Deep', it: 'Abisso' }, rate: 3.2, gesture: 2, bright: 0.72, warmth: 0, register: -5, shift: 2, bed: 1, padDur: [26, 40], timbres: { glass: 0.5, bell: 0.4, pluck: 0.1 } },
};
export const MOOD_ORDER = ['mist', 'lantern', 'deep'];

// What a THEME (gen/core.js) adds: harbour airy with a foghorn now and then, nordic cold and
// glassy, citadel darker with a faint choir.
export const THEME_SOUND = {
  harbour: { scales: ['lydian', 'majpenta', 'dorian'], roots: [2, 4, 7, 9], air: 1.12, cold: 0, register: 0, wave: 'triangle', foghorn: true, choir: false, bias: { bell: 0.15 } },
  nordic: { scales: ['penta2', 'dorian', 'majpenta'], roots: [4, 9, 11, 2], air: 1.05, cold: 0.3, register: 3, wave: 'sine', foghorn: false, choir: false, bias: { glass: 0.25 } },
  citadel: { scales: ['dorian', 'aeolian', 'penta2'], roots: [0, 2, 5, 10], air: 0.85, cold: 0, register: -2, wave: 'sawtooth', foghorn: false, choir: true, bias: { bell: 0.05 } },
};

// The only recognisable theme of the game, in semitones above the root, snapped to the scale:
// a fifth, a ninth, then a sixth: a question that does not close. Each moment has its variation.
export const MOTIF = [0, 7, 14, 9];
export const CUES = {
  secret: { notes: [0, 7, 14], gap: 0.55, voice: 'bell', vel: 0.9 },
  lock: { notes: [0, 7, 14, 19], gap: 0.32, voice: 'pluck', vel: 1 },
  cat: { notes: [14, 7, 9], gap: 0.9, voice: 'glass', vel: 0.85, echo: true },
  key: { notes: [0, 7, 14, 9], gap: 0.45, voice: 'pluck', vel: 0.95, under: true },
  ending: { notes: [0, 7, 14, 9, 7], gap: 0.7, voice: 'bell', vel: 0.9, cadence: true },
};

// The story's THEME (docs/STORY.md): one melody, the only tune of the game, built on the motif and
// snapped to the course's scale. Four phrases: the motif (a question), its answer, a rise, and a
// close that comes home. Notes as [semitones above the note root, beats].
//   fragment: the motif alone (a memento)   opening: motif and answer (the arrival, the notebook)
//   full: all four, then the ending's cadence (the turn, leaving)
export const THEME_PHRASES = [
  [[0, 1], [7, 1], [14, 1.5], [9, 2.5]],
  [[7, 1], [9, 1], [12, 1], [14, 1], [12, 1.5], [7, 2.5]],
  [[9, 1], [14, 1], [16, 1.5], [14, 1], [12, 1], [9, 2.5]],
  [[7, 1], [9, 1], [7, 1], [4, 1], [2, 1.5], [0, 3]],
];
export const THEME_KINDS = { fragment: 1, opening: 2, full: 4 };
export const THEME_BEAT = 0.62; // seconds: slow, a music box winding down
// -> { notes: [{ t, midi, dur, vel }], pads: [{ t, midi, dur }], length, cadence }
export function themeNotes(piece, kind = 'fragment', beat = THEME_BEAT) {
  const n = THEME_KINDS[kind] || 1, notes = [], pads = [];
  let t = 0;
  THEME_PHRASES.slice(0, n).forEach((ph, i) => {
    pads.push({ t, midi: piece.root + 12 + snap(i === 2 ? 5 : 0, piece.scale), dur: ph.reduce((a, [, b]) => a + b, 0) * beat + 1.5 });
    ph.forEach(([semi, beats], k) => {
      notes.push({ t, midi: piece.noteRoot + snap(semi, piece.scale), dur: beats * beat, vel: k === ph.length - 1 ? 0.8 : k === 0 ? 1 : 0.88 });
      t += beats * beat;
    });
    t += beat * 0.5; // a breath between phrases
  });
  return { notes, pads, length: t, cadence: kind === 'full' };
}

// nearest tone of the scale (ties go down: darker)
export function snap(semi, scale) {
  const oct = Math.floor(semi / 12), pc = semi - oct * 12;
  let best = scale[0], d0 = 99;
  for (const s of [...scale, 12]) { const d = Math.abs(s - pc); if (d < d0) { d0 = d; best = s; } }
  return oct * 12 + best;
}
// scale step i (any integer) -> semitones above the root
export function step(i, scale) {
  const n = scale.length, o = Math.floor(i / n);
  return o * 12 + scale[i - o * n];
}

// The piece of a course: decided once from the course id, the theme and the mood.
export function compose({ id = 'course', theme = 'harbour', mood = 'mist', rng }) {
  const th = THEME_SOUND[theme] || THEME_SOUND.harbour, md = MOODS[mood] || MOODS.mist;
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const pc = pick(th.roots), base = pick(th.scales);
  const scaleName = DARKNESS[Math.max(0, Math.min(DARKNESS.length - 1, DARKNESS.indexOf(base) + md.shift))];
  const root = 48 + pc - (pc > 9 ? 12 : 0); // the floor of the pads: Bb2 (117 Hz) to A3 (220 Hz)
  const timbres = { ...md.timbres };
  for (const [k, v] of Object.entries(th.bias)) timbres[k] = (timbres[k] || 0) + v;
  const rate = md.rate * (0.9 + rng() * 0.2);
  return {
    id, theme: th === THEME_SOUND[theme] ? theme : 'harbour', mood: MOODS[mood] ? mood : 'mist',
    root: root + md.register, key: `${NOTE_NAMES[(root + md.register + 12) % 12]} ${scaleName}`, scaleName, scale: SCALES[scaleName],
    rate, gesture: md.gesture, bright: md.bright * th.air, warmth: Math.max(0, md.warmth - th.cold), bed: md.bed,
    noteRoot: root + md.register + 12 + th.register, padDur: md.padDur, wave: th.wave, timbres,
    foghorn: th.foghorn, choir: th.choir, motif: MOTIF.map((s) => snap(s, SCALES[scaleName])),
  };
}

const weighted = (rng, w) => { const e = Object.entries(w), tot = e.reduce((a, [, v]) => a + v, 0); let r = rng() * tot; for (const [k, v] of e) { r -= v; if (r <= 0) return k; } return e[e.length - 1][0]; };
const between = (rng, [a, b]) => a + rng() * (b - a);

// Chords of the bed: open fifths with a ninth on a scale tone; a third only with warmth.
const CHORD_ROOTS = [0, 0, 5, 7, 10, 3, 9, 2];
function chordAt(piece, rng, warmth) {
  const r = snap(CHORD_ROOTS[Math.floor(rng() * CHORD_ROOTS.length)], piece.scale);
  const tones = [r, snap(r + 7, piece.scale), snap(r + 14, piece.scale)];
  if (rng() < warmth) tones.push(snap(r + (piece.scale.includes((r + 4) % 12) ? 4 : 3), piece.scale) + 12);
  return tones;
}

// The planner: asked for everything that starts before `until`, given the mix of the moment.
// Events: { t, type: 'note'|'pad'|'drone'|'choir'|'creak'|'pulse', midi, vel, dur, voice, pan }
export class Planner {
  constructor(piece, rng, t0 = 0) {
    this.piece = piece; this.rng = rng;
    this.lo = -3; this.hi = Math.max(6, piece.scale.length + 4); // note range in scale steps
    this.at = Math.floor((this.lo + this.hi) / 2);
    this.reset(t0);
  }
  setPiece(piece) { this.piece = piece; this.hi = Math.max(6, piece.scale.length + 4); this.at = Math.min(this.at, this.hi); this.chord = null; }
  // after a pause (hidden tab, mute): nothing is owed from the past
  reset(t) {
    const r = this.rng;
    this.tNote = t + 3 + r() * 5; this.tPad = t; this.tChord = t; this.tDrone = t + 60 + r() * 90;
    this.tChoir = t + 20 + r() * 30; this.tCreak = t + 8 + r() * 20; this.tPulse = t + 0.5; this.chord = null; this.padIx = 0;
  }
  until(until, mix) {
    const out = [], r = this.rng, p = this.piece;
    // the bed
    if (mix.bed > 0.001) {
      while (this.tPad < until) {
        if (!this.chord || this.tPad >= this.tChord) { this.chord = chordAt(p, r, Math.min(1, p.warmth + (mix.warmth || 0))); this.tChord = this.tPad + 25 + r() * 35; }
        const dur = between(r, p.padDur), voices = Math.max(1, mix.voices || 2);
        const tone = this.chord[this.padIx++ % this.chord.length];
        out.push({ t: this.tPad, type: 'pad', midi: p.root + tone + (tone < 7 && r() < 0.3 ? 12 : 0), dur, attack: 4 + r() * 5, vel: 0.75 + r() * 0.25, pan: (r() - 0.5) * 0.9 });
        this.tPad += dur / (voices + 0.4) * (0.85 + r() * 0.3);
      }
    } else this.tPad = Math.max(this.tPad, until);
    // the sparse notes, in gestures of one to three
    const rate = p.rate * (mix.density ?? 1);
    while (this.tNote < until) {
      if (rate < 0.05) { this.tNote += 2; continue; }
      const n = 1 + Math.floor(Math.pow(r(), 1.8) * p.gesture), voice = weighted(r, p.timbres), dir = r() < 0.5 ? -1 : 1;
      let t = this.tNote;
      for (let k = 0; k < n; k++) {
        const s = [1, 1, 1, 2, 2, 3, 4][Math.floor(r() * 7)] * (k === 0 ? (r() < 0.5 ? -1 : 1) : dir);
        this.at += s;
        if (this.at > this.hi) this.at = 2 * this.hi - this.at;
        if (this.at < this.lo) this.at = 2 * this.lo - this.at;
        out.push({ t, type: 'note', voice, midi: p.noteRoot + step(this.at, p.scale), vel: 0.55 + r() * 0.45, pan: (r() - 0.5) * 1.1 });
        t += 0.7 + r() * 1.7;
      }
      const mean = (60 / rate) * (1 + (p.gesture - 1) * 0.35);
      let gap = 2.5 + -Math.log(1 - r() * 0.98) * (mean - 2.5);
      if (r() < 0.08) gap *= 2.2; // now and then a long breath
      this.tNote = t + Math.min(gap, Math.max(38, mean * 2)); // a cap on silences, except when nearly silent is the point
    }
    // the foghorn (harbour), outdoors only
    while (this.tDrone < until) {
      if (p.foghorn && (mix.place || 0) > 0.2 && mix.bed > 0.2) out.push({ t: this.tDrone, type: 'drone', midi: p.root - 12, dur: 9 + r() * 3, vel: 0.8 + r() * 0.2 });
      this.tDrone += 120 + r() * 180;
    }
    // the faint choir (citadel)
    while (this.tChoir < until) {
      if (p.choir && mix.bed > 0.3) out.push({ t: this.tChoir, type: 'choir', midi: p.root + 12 + snap(this.chord ? this.chord[0] : 0, p.scale), dur: 14 + r() * 8, vel: 0.7 + r() * 0.3, pan: (r() - 0.5) * 0.6 });
      this.tChoir += 45 + r() * 50;
    }
    // wood creaks upstairs: rare
    while (this.tCreak < until) {
      if ((mix.creak || 0) > 0) out.push({ t: this.tCreak, type: 'creak', vel: 0.6 + r() * 0.4, pan: (r() - 0.5) * 1.4 });
      this.tCreak += 15 + -Math.log(1 - r() * 0.98) * (60 / Math.max(0.2, mix.creak || 1));
    }
    // a duel: a very soft heartbeat
    while (this.tPulse < until) {
      if ((mix.pulse || 0) > 0) out.push({ t: this.tPulse, type: 'pulse', midi: p.root, vel: mix.pulse });
      this.tPulse += 1.55;
    }
    return out.sort((a, b) => a.t - b.t);
  }
}

// An hour (or any span) of events in one go, for tests and for the offline render.
export function simulate(piece, rng, seconds, mixAt) {
  const pl = new Planner(piece, rng, 0), out = [];
  for (let t = 0; t < seconds; t += 1) out.push(...pl.until(t + 1, typeof mixAt === 'function' ? mixAt(t) : mixAt));
  return out;
}
