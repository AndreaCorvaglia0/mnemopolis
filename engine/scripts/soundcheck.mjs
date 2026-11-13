// Listening by measurement: renders the soundscape offline in headless Chrome (OfflineAudioContext,
// the same engine.js as the game) and measures it, since nobody here can listen.
// Run: npm run sound   (in engine/; needs Chrome or Chromium, CHROME=/path if not found)
//   - 120 s of each mood for two course ids, town at night with place sounds: peak and RMS, the
//     share of energy above 4 kHz and the spectral centroid, the note layer's longest silence and
//     longest stretch without silence, note events per minute, NaN and clipping
//   - a journey (night, day in the square, a room, upstairs, a page, a duel, the town again) with
//     the level of each part, and the ducking measured
//   - the same id twice (identical), two ids (different keys), the old chiptune for comparison
// Writes /tmp/music-<mood>.wav (30 s) and /tmp/music-<mood>.png (spectrogram and levels of the 120 s),
// /tmp/music-motifs.wav (the five variations of the motif) and /tmp/music-journey.png. OUT=/dir changes /tmp.
// Exits with 1 if an assertion fails.
import puppeteer from 'puppeteer-core';
import { build } from 'esbuild';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), OUT = process.env.OUT || '/tmp';
const CHROME = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
if (!CHROME) { console.log('No Chrome or Chromium found (set CHROME=/path). Sound not measured.'); process.exit(0); }

const entry = `
import { compose, MOODS } from './src/systems/sound/theory.js';
import { mixFor } from './src/systems/sound/mix.js';
import { createSoundscape } from './src/systems/sound/engine.js';
import { seeded } from './src/gen/core.js';
window.SND = { compose, MOODS, mixFor, createSoundscape, seeded };`;
const bundle = await build({ stdin: { contents: entry, resolveDir: path.join(here, '..'), loader: 'js' }, bundle: true, format: 'iife', write: false, logLevel: 'silent' });
const code = bundle.outputFiles[0].text;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 600000, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text()); });
await page.goto('about:blank');
await page.addScriptTag({ content: code });
await page.addScriptTag({ content: PAGE_CODE() });

const fails = [];
const check = (ok, what) => { if (!ok) fails.push(what); return ok ? 'ok' : 'FAIL'; };
const db = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : String(x));

const IDS = ['chroma', 'medical-imaging'];
const THEME = 'harbour';
console.log('Keys (harbour, mist):', (await page.evaluate((ids) => ids.map((id) => `${id}: ${SND.compose({ id, theme: 'harbour', mood: 'mist', rng: SND.seeded('music', id) }).key}`), IDS)).join(' | '));
for (const th of ['harbour', 'nordic', 'citadel']) console.log(`  ${th}:`, (await page.evaluate((th) => ['chroma', 'medical-imaging', 'pancreas', 'fl-liver', 'colour', 'optics'].map((id) => SND.compose({ id, theme: th, mood: 'mist', rng: SND.seeded('music', id) }).key), th)).join(', '));

const rows = [];
for (const mood of ['mist', 'lantern', 'deep']) for (const id of IDS) {
  const r = await page.evaluate((o) => render(o), { id, theme: THEME, mood, seconds: 120, script: 'night', wav: id === IDS[0] ? [20, 50] : null, png: id === IDS[0] });
  if (r.wav) writeFileSync(path.join(OUT, `music-${mood}.wav`), Buffer.from(r.wav, 'base64'));
  if (r.png) writeFileSync(path.join(OUT, `music-${mood}.png`), Buffer.from(r.png.split(',')[1], 'base64'));
  rows.push({ mood, id, ...r.stats });
}
console.log('\n120 s, town at night, near a little water and grass (place sounds on):');
console.log('mood     id               key           peak dBFS  RMS dBFS  RMS dB(A)  quietest/loudest 0.4 s  >4kHz %  centroid Hz  notes/min  pads/min  longest silence s  longest sound s  NaN  clip');
for (const r of rows) {
  console.log(`${r.mood.padEnd(8)} ${r.id.padEnd(16)} ${r.key.padEnd(13)} ${f1(db(r.peak)).padStart(9)} ${f1(db(r.rms)).padStart(9)} ${f1(db(r.rmsA)).padStart(10)}  ${f1(db(r.minWin)).padStart(10)} / ${f1(db(r.maxWin)).padEnd(10)} ${f1(r.hi4k * 100).padStart(7)} ${f1(r.centroid).padStart(12)} ${f1(r.notesPerMin).padStart(10)} ${f1(r.padsPerMin).padStart(9)} ${f1(r.longestSilence).padStart(18)} ${f1(r.longestSound).padStart(16)} ${String(r.nan).padStart(4)} ${String(r.clip).padStart(5)}`);
  check(db(r.peak) < -6, `${r.mood}/${r.id}: peak ${f1(db(r.peak))} dBFS should be below -6`);
  check(db(r.rms) > -48 && db(r.rms) < -26, `${r.mood}/${r.id}: RMS ${f1(db(r.rms))} dBFS should be in -48..-26`);
  check(r.hi4k < 0.02, `${r.mood}/${r.id}: ${f1(r.hi4k * 100)}% of the energy above 4 kHz (max 2%)`);
  check(r.centroid < 900, `${r.mood}/${r.id}: centroid ${f1(r.centroid)} Hz (max 900)`);
  check(r.notesPerMin > 1.5 && r.notesPerMin < 12, `${r.mood}/${r.id}: ${f1(r.notesPerMin)} notes per minute (sparse: 1.5..12)`);
  check(r.longestSilence >= 4, `${r.mood}/${r.id}: the notes should leave silences (longest ${f1(r.longestSilence)} s)`);
  check(r.longestSound < 40, `${r.mood}/${r.id}: no endless stretch of notes (longest ${f1(r.longestSound)} s)`);
  check(r.nan === 0 && r.clip === 0, `${r.mood}/${r.id}: NaN ${r.nan}, clipped ${r.clip}`);
}
for (const mood of ['mist', 'lantern', 'deep']) { const [a, b] = rows.filter((r) => r.mood === mood); check(a.key !== b.key, `${mood}: two ids gave the same key ${a.key}`); }

// the same id twice: the same piece, sample for sample
const same = await page.evaluate(() => sameTwice());
console.log(`\nSame id rendered twice (20 s): largest sample difference ${same.maxDiff} (${check(same.maxDiff < 1e-6, 'the same id must give the same piece')})`);

// the journey: how the game state moves the mix
const j = await page.evaluate(() => render({ id: 'chroma', theme: 'harbour', mood: 'mist', seconds: 300, script: 'journey', png: true }));
writeFileSync(path.join(OUT, 'music-journey.png'), Buffer.from(j.png.split(',')[1], 'base64'));
console.log('\nJourney (mist, chroma): RMS of the steady part of each segment');
for (const s of j.stats.segments) console.log(`  ${s.name.padEnd(28)} ${String(s.from).padStart(3)}-${String(s.to).padEnd(3)} s  RMS ${f1(db(s.rms)).padStart(6)} dBFS ${f1(db(s.rmsA)).padStart(6)} dB(A)  centroid ${f1(s.centroid).padStart(6)} Hz, of the bed ${f1(s.bedCentroid).padStart(6)} Hz`);
const seg = Object.fromEntries(j.stats.segments.map((s) => [s.name, s]));
// ducking, exactly: the same 90 s twice, a page opened at 60 s in one of them
const dk = await page.evaluate(() => duckTwin({ focus: 'page' })), dy = await page.evaluate(() => duckTwin({ tod: 'day', square: true })), rm = await page.evaluate(() => duckTwin({ scene: 'room' }));
console.log(`  ducking (same piece with and without a page from 60 s, measured 66-90 s): bed ${f1(dk.bed)} dB, notes ${Number.isFinite(dk.notes) ? f1(dk.notes) + ' dB' : 'silent in that window'}, whole mix ${f1(dk.mix)} dB (intended: bed -20 dB)`);
check(dk.bed < -18 && dk.bed > -22, `the bed should duck by 20 dB (${f1(dk.bed)})`);
check(dk.mix < -12, `the whole mix should drop by more than 12 dB on a page (${f1(dk.mix)})`);
console.log(`  the same notes by day in the square: bed ${f1(dy.bed)} dB, its centroid ${f1(dy.cenA)} -> ${f1(dy.cenB)} Hz, its share of energy above 800 Hz ${f1(dy.air)} dB; in a room: whole mix ${f1(rm.mix)} dB`);
check(dy.air > 4, `the bed by day in the square should be brighter than at night (+${f1(dy.air)} dB above 800 Hz, wanted 4)`);
check(rm.mix < -2, 'a room should be quieter than the town');
check(seg.upstairs.rms < seg['a room'].rms, 'upstairs should be quieter than a room');
check(j.stats.nan === 0 && j.stats.clip === 0, 'journey: NaN or clipping');

// the motif and its variations, and the old chiptune for comparison
const m = await page.evaluate(() => motifs());
writeFileSync(path.join(OUT, 'music-motifs.wav'), Buffer.from(m.wav, 'base64'));
console.log(`\nMotif variations (secret, lock, cat, key, ending) over the bed: peak ${f1(db(m.peak))} dBFS, ${m.nan} NaN (${check(db(m.peak) < -6 && m.nan === 0, 'motif peak')})`);
const old = await page.evaluate(() => oldChiptune());
for (const o of old) console.log(`Old chiptune "${o.name}" (60 s, as it was): peak ${f1(db(o.peak))} dBFS, RMS ${f1(db(o.rms))} dBFS = ${f1(db(o.rmsA))} dB(A), >4 kHz ${f1(o.hi4k * 100)}%, centroid ${f1(o.centroid)} Hz`);
// loudness as heard: A-weighted (the ear hears little of the low pads); every mood at least 6 dB under the old night tune
for (const r of rows) check(db(r.rmsA) < db(old[0].rmsA) - 6, `${r.mood}/${r.id}: ${f1(db(r.rmsA))} dB(A) should be at least 6 dB under the old night music (${f1(db(old[0].rmsA))} dB(A))`);

await browser.close();
console.log(`\nFiles: ${['mist', 'lantern', 'deep'].map((x) => `${OUT}/music-${x}.wav ${OUT}/music-${x}.png`).join(' ')} ${OUT}/music-motifs.wav ${OUT}/music-journey.png`);
if (fails.length) { console.log(`\n${fails.length} check(s) failed:\n  ${fails.join('\n  ')}`); process.exit(1); }
console.log('\nAll sound checks passed (by measurement: nobody listened).');

// ------------------------------------------------------------------ the code that runs in the page
function PAGE_CODE() {
  return String.raw`
const SR = 44100;
function fft(re, im) { // in place, radix 2
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
}
function above(x, from, to, f0) { const s = spectrumBand(x, from, to, f0); return s; }
function spectrumBand(x, from, to, f0) { const N = 4096; let hi = 0, tot = 0; for (let s = from; s + N <= to; s += N) { const re = new Float32Array(N), im = new Float32Array(N); for (let i = 0; i < N; i++) re[i] = x[s + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / N)); fft(re, im); for (let k = 1; k < N / 2; k++) { const e = re[k] * re[k] + im[k] * im[k]; tot += e; if (k * SR / N > f0) hi += e; } } return hi / (tot || 1); }
const aW = (f) => { const f2 = f * f, r = (12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2)); return (r * 1.2589) ** 2; }; // A-weighting, as power, 0 dB at 1 kHz
function spectrum(x, from, to) { // energy share above 4 kHz, centroid, A-weighted share; frames of 4096
  const N = 4096, w = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N)); let hi = 0, tot = 0, cen = 0, aw = 0;
  const frames = [];
  for (let s = from; s + N <= to; s += N) {
    const re = new Float32Array(N), im = new Float32Array(N); for (let i = 0; i < N; i++) re[i] = x[s + i] * w[i];
    fft(re, im); const col = new Float32Array(N / 2);
    for (let k = 1; k < N / 2; k++) { const e = re[k] * re[k] + im[k] * im[k], f = k * SR / N; col[k] = e; tot += e; cen += e * f; aw += e * aW(f); if (f > 4000) hi += e; }
    frames.push(col);
  }
  return { hi4k: hi / (tot || 1), centroid: cen / (tot || 1), aShare: aw / (tot || 1), frames };
}
const rmsOf = (x, a, b) => { let s = 0; for (let i = a; i < b; i++) s += x[i] * x[i]; return Math.sqrt(s / Math.max(1, b - a)); };
function wav(L, R, a, b) {
  const n = b - a, buf = new ArrayBuffer(44 + n * 4), v = new DataView(buf), str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, SR, true); v.setUint32(28, SR * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) { v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[a + i])) * 32767, true); v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[a + i])) * 32767, true); }
  let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s);
}
const WHERE = {
  'town night': { scene: 'town', tod: 'night' }, 'day, in the square': { scene: 'town', tod: 'day', square: true }, 'a room': { scene: 'room' },
  upstairs: { scene: 'upstairs' }, 'page (ducked)': { scene: 'town', tod: 'night', focus: 'page' }, 'duel (pulse)': { scene: 'room', focus: 'duel' }, 'town night again': { scene: 'town', tod: 'night' },
};
const PLACE = { night: { water: 0.35, wind: 0.25, fountain: 0, crickets: 0.6, birds: 0 }, day: { water: 0.1, wind: 0.2, fountain: 0.7, crickets: 0, birds: 0.6 }, none: { water: 0, wind: 0, fountain: 0, crickets: 0, birds: 0 } };
async function render({ id, theme, mood, seconds, script, wav: cut, png }) {
  const ctx = new OfflineAudioContext(4, SR * seconds, SR), merger = ctx.createChannelMerger(4), out = ctx.createGain(), split = ctx.createChannelSplitter(2);
  out.connect(split); split.connect(merger, 0, 0); split.connect(merger, 1, 1); merger.connect(ctx.destination);
  const piece = SND.compose({ id, theme, mood, rng: SND.seeded('music', id) });
  const sc = SND.createSoundscape(ctx, { piece, rng: SND.seeded('music:play', id), out, volume: 0.6, seed: Math.floor(SND.seeded('music:noise', id)() * 2 ** 31) });
  const tn = ctx.createGain(), tb = ctx.createGain(); sc.taps.notes.connect(tn); tn.connect(merger, 0, 2); sc.taps.bed.connect(tb); tb.connect(merger, 0, 3);
  const segs = script === 'journey' ? [['town night', 0, 50, 'night'], ['day, in the square', 50, 95, 'day'], ['a room', 95, 140, 'none'], ['upstairs', 140, 185, 'none'], ['page (ducked)', 185, 215, 'night'], ['duel (pulse)', 215, 250, 'none'], ['town night again', 250, 300, 'night']] : [['town night', 0, seconds, 'night']];
  sc.setMix(SND.mixFor(WHERE[segs[0][0]], { bright: piece.bright }), 0, 0.8); sc.setPlace(PLACE[segs[0][3]], 0); sc.setOutdoor(true, 0);
  // the timer of the game, simulated: pump one second ahead, change the mix at each boundary
  for (let t = 1; t < seconds; t += 1) {
    const s = segs.find((g) => g[1] === t);
    ctx.suspend(t).then(() => {
      if (s) { const w = WHERE[s[0]], m = SND.mixFor(w, { bright: piece.bright }); sc.setMix(m, t, w.focus ? 0.6 : 2.5); sc.setPlace(PLACE[s[3]], t); sc.setOutdoor(w.scene === 'town', t); }
      sc.pump(t + 2.5, true); ctx.resume();
    });
  }
  sc.pump(1.5, true);
  const buf = await ctx.startRendering(), L = buf.getChannelData(0), R = buf.getChannelData(1), N = buf.getChannelData(2), B = buf.getChannelData(3);
  const mono = new Float32Array(L.length); let peak = 0, nan = 0, clip = 0;
  for (let i = 0; i < L.length; i++) { const a = L[i], b = R[i]; if (!Number.isFinite(a) || !Number.isFinite(b)) { nan++; continue; } mono[i] = (a + b) / 2; const p = Math.max(Math.abs(a), Math.abs(b)); if (p > peak) peak = p; if (p >= 1) clip++; }
  const start = SR * 8; // the first seconds fade in
  const win = Math.floor(SR * 0.4), wins = [];
  for (let i = start; i + win <= mono.length; i += win) wins.push(rmsOf(mono, i, i + win));
  // the note layer: silent where it is 40 dB under its loudest 50 ms
  const nw = Math.floor(SR * 0.05), nr = []; for (let i = 0; i + nw <= N.length; i += nw) nr.push(rmsOf(N, i, i + nw));
  const nmax = Math.max(...nr.slice(Math.floor(8 / 0.05))), thr = nmax * 0.01;
  let longestSilence = 0, longestSound = 0, run = 0, runS = 0;
  for (const v of nr.slice(Math.floor(8 / 0.05))) { if (v < thr) { run += 0.05; runS = 0; } else { runS += 0.05; run = 0; } longestSilence = Math.max(longestSilence, run); longestSound = Math.max(longestSound, runS); }
  const sp = spectrum(mono, start, mono.length);
  const rms = rmsOf(mono, start, mono.length), stats = { key: piece.key, peak, rms, rmsA: rms * Math.sqrt(sp.aShare), minWin: Math.min(...wins), maxWin: Math.max(...wins), hi4k: sp.hi4k, centroid: sp.centroid,
    notesPerMin: (sc.counts.note || 0) / (seconds / 60), padsPerMin: (sc.counts.pad || 0) / (seconds / 60), longestSilence, longestSound, nan, clip };
  if (script === 'journey') {
    stats.segments = segs.map(([name, a, b]) => { const from = a + Math.min(12, (b - a) / 2), to = b; const s = spectrum(mono, from * SR, to * SR); const rms = rmsOf(mono, from * SR, to * SR); return { name, from, to, rms, rmsA: rms * Math.sqrt(s.aShare), centroid: s.centroid, bedCentroid: spectrum(B, from * SR, to * SR).centroid }; });
    stats.duckBed = 20 * Math.log10(rmsOf(B, 197 * SR, 214 * SR) / rmsOf(B, 30 * SR, 49 * SR));
  }
  const res = { stats };
  if (cut) res.wav = wav(L, R, cut[0] * SR, cut[1] * SR);
  if (png) res.png = picture(sp.frames, wins, nr, seconds, start, segs, piece.key + ' · ' + mood + ' · ' + id);
  return res;
}
function picture(frames, wins, nr, seconds, start, segs, title) {
  const W = 1200, H = 520, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#0d0f1e'; g.fillRect(0, 0, W, H);
  const top = 30, sh = 300, fmin = 40, fmax = 8000, x0 = 50, pw = W - 70, t0 = start / SR;
  // spectrogram, log frequency, dB colour
  const N = 4096, cols = frames.length;
  for (let x = 0; x < pw; x++) {
    const f = frames[Math.min(cols - 1, Math.floor(x / pw * cols))]; if (!f) continue;
    for (let y = 0; y < sh; y++) {
      const fr = fmin * Math.pow(fmax / fmin, 1 - y / sh), k = Math.round(fr * N / SR), e = f[k] + f[k + 1] + (f[k - 1] || 0);
      const d = 10 * Math.log10(e + 1e-14), v = Math.max(0, Math.min(1, (d + 40) / 60));
      g.fillStyle = 'rgb(' + Math.round(255 * Math.min(1, v * 1.6)) + ',' + Math.round(255 * Math.max(0, v * 1.4 - 0.4)) + ',' + Math.round(120 * (1 - v) + 80 * v) + ')';
      g.fillRect(x0 + x, top + y, 1, 1);
    }
  }
  g.fillStyle = '#ccc'; g.font = '12px sans-serif';
  for (const f of [50, 100, 200, 500, 1000, 2000, 4000, 8000]) { const y = top + sh * (1 - Math.log(f / fmin) / Math.log(fmax / fmin)); g.fillText(f >= 1000 ? f / 1000 + 'k' : f, 8, y + 4); g.fillRect(x0 - 4, y, 4, 1); }
  // levels: the whole mix (0.4 s RMS) and the note layer (50 ms), in dBFS
  const ly = top + sh + 30, lh = 140, dbY = (d) => ly + lh * (1 - (d + 70) / 60);
  g.strokeStyle = '#444'; for (const d of [-70, -50, -30, -10]) { g.beginPath(); g.moveTo(x0, dbY(d)); g.lineTo(x0 + pw, dbY(d)); g.stroke(); g.fillText(d + ' dB', 4, dbY(d) + 4); }
  g.strokeStyle = '#7fd1ff'; g.beginPath(); wins.forEach((v, i) => { const x = x0 + i / wins.length * pw, y = dbY(20 * Math.log10(v + 1e-9)); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  const ns = nr.slice(Math.floor(t0 / 0.05)); g.strokeStyle = '#ffcf5a'; g.beginPath(); ns.forEach((v, i) => { const x = x0 + i / ns.length * pw, y = dbY(20 * Math.log10(v * 0.42 + 1e-9)); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  g.fillStyle = '#fff'; g.font = '14px sans-serif'; g.fillText(title + '   (' + t0 + '-' + seconds + ' s; blue: whole mix RMS 0.4 s; yellow: note layer)', x0, 20);
  g.font = '11px sans-serif'; g.fillStyle = '#9f9';
  if (segs.length > 1) for (const [name, a] of segs) { const x = x0 + (a - t0) / (seconds - t0) * pw; if (x >= x0) { g.fillRect(x, top, 1, sh + lh + 30); g.fillText(name, x + 3, top + 12); } }
  return c.toDataURL('image/png');
}
async function duckTwin(whereB) {
  const go = async (duck) => { const ctx = new OfflineAudioContext(4, SR * 90, SR), merger = ctx.createChannelMerger(4), out = ctx.createGain(), split = ctx.createChannelSplitter(2);
    out.connect(split); split.connect(merger, 0, 0); split.connect(merger, 1, 1); merger.connect(ctx.destination);
    const piece = SND.compose({ id: 'chroma', theme: 'harbour', mood: 'mist', rng: SND.seeded('music', 'chroma') });
    const sc = SND.createSoundscape(ctx, { piece, rng: SND.seeded('music:play', 'chroma'), out, seed: 5 });
    const tn = ctx.createGain(), tb = ctx.createGain(); sc.taps.notes.connect(tn); tn.connect(merger, 0, 2); sc.taps.bed.connect(tb); tb.connect(merger, 0, 3);
    sc.setMix(SND.mixFor({}, { bright: piece.bright }), 0, 0.5); sc.setPlace(PLACE.night, 0); sc.pump(90, true); // the plan does not depend on the duck: same notes in both
    if (duck) sc.setMix(SND.mixFor(whereB, { bright: piece.bright }), 60, 0.6);
    const b = await ctx.startRendering(); return [0, 1, 2, 3].map((c) => b.getChannelData(c)); };
  const a = await go(false), b = await go(true), r = (x) => rmsOf(x, 66 * SR, 90 * SR), d = (i) => 20 * Math.log10(r(b[i]) / r(a[i]));
  const mixA = Math.hypot(r(a[0]), r(a[1])), mixB = Math.hypot(r(b[0]), r(b[1]));
  return { bed: d(3), notes: d(2), mix: 20 * Math.log10(mixB / mixA), cenA: spectrum(a[3], 66 * SR, 90 * SR).centroid, cenB: spectrum(b[3], 66 * SR, 90 * SR).centroid, air: 10 * Math.log10(above(b[3], 66 * SR, 90 * SR, 800) / above(a[3], 66 * SR, 90 * SR, 800)) };
}
async function sameTwice() {
  const go = async () => { const ctx = new OfflineAudioContext(2, SR * 20, SR), piece = SND.compose({ id: 'chroma', theme: 'harbour', mood: 'mist', rng: SND.seeded('music', 'chroma') });
    const sc = SND.createSoundscape(ctx, { piece, rng: SND.seeded('music:play', 'chroma'), seed: 7 }); sc.setMix(SND.mixFor({}), 0, 0.5); sc.setPlace(PLACE.night, 0); sc.pump(20, true); return (await ctx.startRendering()).getChannelData(0); };
  const a = await go(), b = await go(); let d = 0; for (let i = 0; i < a.length; i++) d = Math.max(d, Math.abs(a[i] - b[i])); return { maxDiff: d };
}
async function motifs() {
  const ctx = new OfflineAudioContext(2, SR * 48, SR), piece = SND.compose({ id: 'chroma', theme: 'harbour', mood: 'mist', rng: SND.seeded('music', 'chroma') });
  const sc = SND.createSoundscape(ctx, { piece, rng: SND.seeded('music:play', 'chroma'), seed: 3 });
  sc.setMix(SND.mixFor({ scene: 'town', focus: 'page' }), 0, 0.5); sc.pump(48, true);
  let t = 1; for (const k of ['secret', 'lock', 'cat', 'key', 'ending']) t += sc.cue(k, t) + 1.5;
  const b = await ctx.startRendering(), L = b.getChannelData(0), R = b.getChannelData(1); let peak = 0, nan = 0;
  for (let i = 0; i < L.length; i++) { if (!Number.isFinite(L[i])) nan++; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
  return { wav: wav(L, R, 0, L.length), peak, nan };
}
// the music as it was before (systems/audio.js until this change), to compare levels
async function oldChiptune() {
  const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 }, hzn = (n, o) => 440 * 2 ** ((SEMI[n] + 12 * (o + 1) - 69) / 12);
  const CHORD = { C: ['C', 'E', 'G'], Em: ['E', 'G', 'B'], F: ['F', 'A', 'C'], G: ['G', 'B', 'D'], Am: ['A', 'C', 'E'] };
  const TR = { night: { bpm: 84, wave: 'triangle', vol: 0.06, chords: ['Am', 'F', 'C', 'G'], arp: [0, -1, 1, -1, 2, -1, 1, -1], lead: 'E5 _ _ _ A5 _ _ _ C6 _ _ A5 _ _ _ . G5 _ _ _ E5 _ _ _ D5 _ _ B4 _ _ _ .' },
    town: { bpm: 126, wave: 'square', vol: 0.035, chords: ['C', 'Em', 'F', 'G', 'C', 'G', 'F', 'C'], arp: [0, 1, 2, 1, 0, 1, 2, 1], lead: 'E5 _ G5 _ C6 _ B5 A5 G5 _ E5 _ G5 _ _ . F5 _ A5 _ C6 _ A5 G5 D5 _ G5 _ B5 _ _ . E5 _ G5 _ C6 _ D6 E6 D6 _ B5 _ G5 _ _ . A5 _ C6 _ B5 _ G5 A5 G5 _ E5 D5 C5 _ _ .' } };
  const out = [];
  for (const name of ['night', 'town']) {
    const ctx = new OfflineAudioContext(1, SR * 60, SR), master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    const tr = TR[name], sd = 30 / tr.bpm, lead = tr.lead.split(' ');
    const voice = (f, dur, wave, vol, t) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = wave; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.setValueAtTime(vol, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.03); };
    for (let ix = 0, t = 0.05; t < 60; ix++, t += sd) {
      const i = ix % lead.length, tok = lead[i], chord = CHORD[tr.chords[Math.floor(i / 8) % tr.chords.length]];
      if (tok !== '_' && tok !== '.') { let n = 1; while (lead[(i + n) % lead.length] === '_' && n < 8) n++; voice(hzn(tok.slice(0, -1), +tok.slice(-1)), sd * n * 0.95, tr.wave, tr.vol, t); }
      if (i % 4 === 0) voice(hzn(chord[i % 8 === 0 ? 0 : 2], 3) / (i % 8 === 0 ? 1 : 2), sd * 3.4, 'triangle', 0.07, t);
      const a = tr.arp[i % 8]; if (a >= 0) voice(hzn(chord[a], 4), sd * 0.9, 'triangle', 0.022, t);
    }
    const x = (await ctx.startRendering()).getChannelData(0); let peak = 0; for (const v of x) peak = Math.max(peak, Math.abs(v));
    const sp = spectrum(x, 0, x.length); const rms = rmsOf(x, 0, x.length); out.push({ name, peak, rms, rmsA: rms * Math.sqrt(sp.aShare), hi4k: sp.hi4k, centroid: sp.centroid });
  }
  return out;
}
`;
}
