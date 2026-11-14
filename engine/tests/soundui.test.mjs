// The sounds of the hands and the lab sound API, measured (nobody can listen here): note names and
// frequencies exact to 0.01 Hz, just ratios, the pluck's fundamental by FFT within 1 Hz, beats at the
// difference frequency, every interaction sound quieter than the music's motif, none clipping, none
// bright. scripts/soundui.mjs writes the same sounds to /tmp as WAV files to listen to.
import test from 'node:test';
import assert from 'node:assert/strict';
import { noteToMidi, midiToHz, toHz, midiToName, nearestNote, intervalName, justRatio, etRatio, chordHz, waveOf, spectrumOf, cents } from '../src/systems/sound/notes.js';
import { pluck, piano, bell, tone, mixAt, peak, rms, dbfs, fundamental, energyAbove, beatRate } from '../src/systems/sound/synth.js';
import { UI_NAMES, renderUi, uiEvents } from '../src/systems/sound/ui.js';
import { LEVELS } from '../src/systems/sound/engine.js';
import { compose } from '../src/systems/sound/theory.js';
import { seeded } from '../src/gen/core.js';

const SR = 48000;

test('note names, MIDI and frequencies (A4 = 440 Hz, equal temperament), exact to 0.01 Hz', () => {
  const table = { A4: 440, A3: 220, C4: 261.63, 'C#4': 277.18, Db4: 277.18, E2: 82.41, G3: 196, B3: 246.94, E4: 329.63, C8: 4186.01, A0: 27.5, Bb2: 116.54 };
  for (const [n, f] of Object.entries(table)) assert.ok(Math.abs(toHz(n) - f) < 0.01, `${n}: ${toHz(n)} vs ${f}`);
  assert.equal(noteToMidi('A4'), 69); assert.equal(noteToMidi('C4'), 60); assert.equal(noteToMidi('C-1'), 0);
  // Italian names
  assert.equal(noteToMidi('La4'), 69); assert.equal(noteToMidi('Do4'), 60); assert.equal(noteToMidi('Sib3'), 58); assert.equal(noteToMidi('sol#2'), 44);
  assert.equal(midiToName(69), 'A4'); assert.equal(midiToName(69, { lang: 'it' }), 'La4'); assert.equal(midiToName(61), 'C#4'); assert.equal(midiToName(70, { lang: 'it' }), 'Sib4');
  for (let m = 21; m <= 108; m++) { assert.equal(noteToMidi(midiToName(m)), m); assert.equal(noteToMidi(midiToName(m, { lang: 'it' })), m); assert.ok(Math.abs(midiToHz(m) - 440 * 2 ** ((m - 69) / 12)) < 1e-9); }
  assert.ok(Number.isNaN(noteToMidi('H4')));
  const nn = nearestNote(445); assert.equal(nn.name, 'A4'); assert.ok(Math.abs(nn.cents - cents(440, 445)) < 1e-9);
});

test('intervals: names in both languages, just and tempered ratios, chords', () => {
  assert.equal(intervalName(7), 'perfect fifth'); assert.equal(intervalName(7, 'it'), 'quinta giusta');
  assert.equal(intervalName(4), 'major third'); assert.equal(intervalName(12, 'it'), 'ottava'); assert.equal(intervalName(19), 'perfect fifth + 1 octave');
  assert.equal(justRatio('fifth'), 1.5); assert.equal(justRatio(4), 1.25); assert.equal(justRatio('major third'), 1.25); assert.equal(justRatio(12), 2); assert.equal(justRatio(19), 3);
  assert.ok(Math.abs(etRatio(7) - 1.498307) < 1e-6);
  const just = chordHz(['C4', 'E4', 'G4'], { just: true }), et = chordHz(['C4', 'E4', 'G4']);
  assert.ok(Math.abs(just[1] / just[0] - 1.25) < 1e-12 && Math.abs(just[2] / just[0] - 1.5) < 1e-12);
  assert.ok(Math.abs(et[1] - 329.63) < 0.01 && Math.abs(et[2] - 392.0) < 0.01);
  assert.deepEqual(chordHz([], { ratios: [1, 1.25, 1.5], root: 200 }), [200, 250, 300]);
  // the tempered third is about 14 cents sharp of the just one
  assert.ok(Math.abs(cents(just[1], et[1]) - 13.69) < 0.05);
});

test('the pluck is tuned: its fundamental within 1 Hz of the note, by FFT, over the guitar range', () => {
  for (const n of ['E2', 'A2', 'D3', 'G3', 'B3', 'E4', 'A4', 'E5', 'C6']) {
    const f = toHz(n), s = pluck(f, SR, { dur: 2 }), got = fundamental(s, SR, f * 0.7, f * 1.3);
    assert.ok(Math.abs(got - f) < 1, `${n}: ${got.toFixed(2)} Hz for ${f.toFixed(2)}`);
    assert.ok(peak(s) <= 0.51 && Number.isFinite(rms(s)), n);
    // it decays: the last quarter is much quieter than the first
    const q = s.length >> 2; assert.ok(rms(s.subarray(3 * q)) < rms(s.subarray(0, q)) * 0.6, `${n} decays`);
  }
  for (const v of [piano, bell, tone]) { const s = v(440, SR); assert.ok(Math.abs(fundamental(s, SR, 300, 600) - 440) < 2, v.name); assert.ok(peak(s) <= 0.51); }
});

test('two tones together beat at the difference of their frequencies', () => {
  for (const [a, b] of [[440, 444], [440, 443], [220, 225]]) {
    const s = mixAt([{ s: tone(a, SR, { dur: 4, gain: 0.3 }) }, { s: tone(b, SR, { dur: 4, gain: 0.3 }) }]);
    const r = beatRate(s, SR);
    assert.ok(Math.abs(r - (b - a)) < 0.1, `${a}+${b}: ${r.toFixed(3)} beats/s`);
  }
});

test('the drawing fallback: a sum of sines and a spectrum with peaks where the tones are', () => {
  const w = waveOf([{ f: 440, a: 1 }, { f: 444, a: 1 }], 400, 0.5);
  assert.ok(Math.max(...w) <= 1 && Math.min(...w) >= -1);
  const sp = spectrumOf([{ f: 1000, a: 1 }], 256, 4000);
  assert.equal(sp.indexOf(Math.max(...sp)), 64);
});

test('every interaction sound: quiet, under the motif, no clipping, no harsh highs, in the key', () => {
  const p = compose({ id: 'chroma', theme: 'harbour', mood: 'mist', rng: seeded('music', 'chroma') });
  const key = { root: p.noteRoot, scale: p.scale };
  // the motif's loudest note at the output: a bell partial sum at LEVELS.cue through the music master (volume 0.6)
  const motifPeak = peak(bell(440, SR, { gain: 1 })) * LEVELS.cue * 0.6 * LEVELS.master;
  for (const name of UI_NAMES) {
    const s = renderUi(name, key, SR, 0.5), out = peak(s) * LEVELS.sfx; // the sfx bus
    assert.ok(s.length > 0 && s.length < SR * 1.6, `${name}: ${s.length} samples`);
    assert.ok(out < motifPeak, `${name}: ${dbfs(out).toFixed(1)} dBFS is not under the motif (${dbfs(motifPeak).toFixed(1)})`);
    assert.ok(peak(s) < 0.2, `${name} peaks at ${peak(s)}`);
    assert.ok(energyAbove(s, SR, 4000) < 0.08, `${name}: ${(energyAbove(s, SR, 4000) * 100).toFixed(1)}% above 4 kHz`);
    for (const e of uiEvents(name, key, 0.5)) if (e.f) {
      const pc = ((Math.round(12 * Math.log2(e.f / 440) + 69) - p.root) % 12 + 12) % 12;
      assert.ok(p.scale.includes(pc) || pc === 7, `${name}: a note outside the key`);
    }
  }
  // the wrong answer is gentle: not louder than the right one, and lower
  assert.ok(peak(renderUi('wrong', key)) <= peak(renderUi('right', key)) * 1.05);
  // slider detents rise with the value
  const f0 = uiEvents('detent', key, 0).find((e) => e.f).f, f1 = uiEvents('detent', key, 1).find((e) => e.f).f;
  assert.ok(f1 > f0);
});
