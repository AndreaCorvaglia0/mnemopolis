// Writes the sounds of the hands and of the lab API to WAV files for the owner to hear, and prints
// what was measured (the same measures as tests/soundui.test.mjs). No browser: the sounds are
// rendered by the pure synth (src/systems/sound/synth.js, ui.js), as the game renders them.
//   /tmp/sound-ui.wav            every interaction sound in turn (+12 dB over the game, to be heard)
//   /tmp/sound-pluck-scale.wav   E minor pentatonic over two octaves, plucked, up and down
//   /tmp/sound-beats.wav         440 Hz with 444 Hz: four beats a second
//   /tmp/sound-chord.wav         C major: equal-tempered, then just (pure tones, then piano)
import { writeFileSync } from 'node:fs';
import { pluck, piano, tone, mixAt, peak, rms, dbfs, toWav, fundamental, beatRate } from '../src/systems/sound/synth.js';
import { UI_NAMES, renderUi } from '../src/systems/sound/ui.js';
import { toHz, chordHz } from '../src/systems/sound/notes.js';
import { compose } from '../src/systems/sound/theory.js';
import { LEVELS } from '../src/systems/sound/engine.js';
import { seeded } from '../src/gen/core.js';

const SR = 48000, out = process.env.OUT || '/tmp';
const save = (name, s) => { writeFileSync(`${out}/${name}`, toWav(s, SR)); console.log(`${out}/${name}  ${(s.length / SR).toFixed(1)} s  peak ${dbfs(peak(s)).toFixed(1)} dBFS  rms ${dbfs(rms(s)).toFixed(1)} dBFS`); };

const p = compose({ id: process.env.COURSE || 'chroma', theme: 'harbour', mood: 'mist', rng: seeded('music', process.env.COURSE || 'chroma') });
const key = { root: p.noteRoot, scale: p.scale };
console.log(`key: ${p.key} (root MIDI ${p.noteRoot})`);
// the interaction sounds, as heard: times the sfx bus level; a gap of 0.6 s between them
let t = 0; const parts = [];
for (const n of UI_NAMES) {
  const s = renderUi(n, key, SR, 0.5).map((x) => x * LEVELS.sfx);
  console.log(`  ${n.padEnd(10)} at ${t.toFixed(1)} s  peak ${dbfs(peak(s)).toFixed(1)} dBFS`);
  parts.push({ t, s }); t += s.length / SR + 0.6;
}
// written 12 dB louder than in the game, so that it can be heard on a laptop (relative levels kept)
save('sound-ui.wav', mixAt(parts, SR).map((x) => x * 4));

const scale = ['E2', 'G2', 'A2', 'B2', 'D3', 'E3', 'G3', 'A3', 'B3', 'D4', 'E4'];
const seq = [...scale, ...scale.slice(0, -1).reverse()];
const pl = mixAt(seq.map((n, i) => ({ t: i * 0.42, s: pluck(toHz(n), SR, { dur: 1.8, gain: 0.45 }) })), SR);
for (const n of ['E2', 'A3', 'E4']) { const f = toHz(n); console.log(`  pluck ${n}: asked ${f.toFixed(2)} Hz, FFT ${fundamental(pluck(f, SR, { dur: 2 }), SR, f * 0.7, f * 1.3).toFixed(2)} Hz`); }
save('sound-pluck-scale.wav', pl);

const beats = mixAt([{ s: tone(440, SR, { dur: 6, gain: 0.3, attack: 0.3, release: 0.5 }) }, { s: tone(444, SR, { dur: 6, gain: 0.3, attack: 0.3, release: 0.5 }) }], SR);
console.log(`  beats: ${beatRate(beats, SR).toFixed(3)} per second (expected 4)`);
save('sound-beats.wav', beats);

const et = chordHz(['C4', 'E4', 'G4']), just = chordHz(['C4', 'E4', 'G4'], { just: true });
console.log(`  C major tempered ${et.map((f) => f.toFixed(2)).join(' ')} Hz; just ${just.map((f) => f.toFixed(2)).join(' ')} Hz`);
const chord = (fs, t0, v) => fs.map((f) => ({ t: t0, s: v(f) }));
const pure = (f) => tone(f, SR, { dur: 4, gain: 0.2, attack: 0.2, release: 0.4 }), pia = (f) => piano(f, SR, { dur: 3, gain: 0.22 });
save('sound-chord.wav', mixAt([...chord(et, 0, pure), ...chord(just, 4.6, pure), ...chord(et, 9.2, pia), ...chord(just, 12.6, pia)], SR));
