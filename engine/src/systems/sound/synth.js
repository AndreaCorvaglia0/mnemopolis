// Sounds as samples: pure functions (no Web Audio), so that they can be measured in Node and written
// to WAV files. The live game turns them into AudioBuffers (lab.js, ui.js); tests/soundui.test.mjs
// measures them (levels, the pluck's fundamental by FFT, beats, spectra).
//
//   pluck(f, sr, o)   a plucked string: Karplus-Strong with an all-pass for exact tuning
//   piano(f, sr, o)   a soft piano: a few partials, slightly stretched, the highs dying first
//   bell(f, sr, o)    a bell: inharmonic partials, long ring
//   tone(f, sr, o)    a pure tone with a smooth envelope
//   render(spec, sr)  a short designed sound: [{ f, t, dur, a, kind, ... }] summed
//   measures: peak, rms, dbfs, fundamental (FFT + parabolic peak), spectrum, energyAbove, toWav

const TAU = Math.PI * 2;
const prng = (seed = 1) => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// a smooth attack and release over a buffer of n samples (in place)
function envelope(out, sr, attack = 0.005, release = 0.05) {
  const a = Math.max(1, Math.round(attack * sr)), r = Math.max(1, Math.round(release * sr)), n = out.length;
  for (let i = 0; i < Math.min(a, n); i++) out[i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / a);
  for (let i = 0; i < Math.min(r, n); i++) out[n - 1 - i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / r);
  return out;
}

export function tone(f, sr = 48000, { dur = 0.8, gain = 0.5, attack = 0.02, release = 0.12, type = 'sine' } = {}) {
  const n = Math.round(dur * sr), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const ph = (f * i) / sr;
    out[i] = gain * (type === 'triangle' ? 1 - 4 * Math.abs(ph - Math.floor(ph + 0.5)) * 1 : Math.sin(TAU * ph));
  }
  return envelope(out, sr, attack, release);
}

// Karplus-Strong. The loop delay is the period P = sr / f: an integer delay line, the two-point
// average (half a sample) and a first-order all-pass for the fraction, so the pitch is exact.
export function pluck(f, sr = 48000, { dur = 1.6, gain = 0.5, bright = 0.5, decay = 0.996, seed = 7 } = {}) {
  const n = Math.round(dur * sr), out = new Float32Array(n), P = sr / f;
  let N = Math.floor(P - 0.5 - 0.1); if (N < 2) N = 2;
  const d = P - 0.5 - N, c = (1 - d) / (1 + d); // all-pass coefficient for a delay of d samples
  const line = new Float32Array(N), r = prng(seed);
  // the excitation: noise, low-passed by brightness (a softer pick is darker)
  let lp = 0; const k = 0.15 + 0.8 * bright;
  for (let i = 0; i < N; i++) { lp += k * (r() * 2 - 1 - lp); line[i] = lp; }
  let mean = 0; for (let i = 0; i < N; i++) mean += line[i]; mean /= N; for (let i = 0; i < N; i++) line[i] -= mean;
  // the loss per period sets the ring: a little more damping for high notes
  const g = Math.min(0.9995, decay + (1 - decay) * Math.min(1, 110 / f) * 0.5);
  let idx = 0, prev = 0, apIn = 0, apOut = 0;
  for (let i = 0; i < n; i++) {
    const x = line[idx];
    const avg = 0.5 * (x + prev) * g; prev = x;
    const y = c * avg + apIn - c * apOut; apIn = avg; apOut = y; // all-pass: fractional delay
    line[idx] = y; idx = (idx + 1) % N;
    out[i] = x;
  }
  let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(out[i]));
  const s = pk ? gain / pk : 0;
  for (let i = 0; i < n; i++) out[i] *= s;
  return envelope(out, sr, 0.002, Math.min(0.2, dur * 0.2));
}

// partials: [ratio, amplitude, decay seconds]
function additive(f, sr, partials, { dur, gain, attack }) {
  const n = Math.round(dur * sr), out = new Float32Array(n);
  for (const [ratio, amp, tau] of partials) {
    const fk = f * ratio; if (fk > sr * 0.45 || fk > 9000) continue;
    const w = (TAU * fk) / sr;
    for (let i = 0; i < n; i++) out[i] += amp * Math.exp(-i / sr / tau) * Math.sin(w * i);
  }
  let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(out[i]));
  const s = pk ? gain / pk : 0;
  for (let i = 0; i < n; i++) out[i] *= s;
  return envelope(out, sr, attack, Math.min(0.25, dur * 0.25));
}
export function piano(f, sr = 48000, { dur = 1.6, gain = 0.5 } = {}) {
  const B = 0.0004, p = (k) => k * Math.sqrt(1 + B * k * k); // a little stretched, as real strings are
  const dk = Math.max(0.35, Math.min(1.6, 260 / f)); // low notes ring longer
  return additive(f, sr, [[p(1), 1, 1.4 * dk], [p(2), 0.42, 0.8 * dk], [p(3), 0.2, 0.5 * dk], [p(4), 0.1, 0.32 * dk], [p(5), 0.05, 0.22 * dk]], { dur, gain, attack: 0.004 });
}
export function bell(f, sr = 48000, { dur = 2.4, gain = 0.45 } = {}) {
  return additive(f, sr, [[1, 1, 1.6], [2, 0.3, 0.9], [2.76, 0.24, 0.6], [5.4, 0.08, 0.25]], { dur, gain, attack: 0.006 });
}
export const VOICE = { pure: tone, sine: tone, pluck, piano, bell };

// mix lists of samples, each at an offset in seconds
export function mixAt(parts, sr = 48000) {
  const len = Math.max(0, ...parts.map((p) => Math.round((p.t || 0) * sr) + p.s.length));
  const out = new Float32Array(len);
  for (const p of parts) { const o = Math.round((p.t || 0) * sr); for (let i = 0; i < p.s.length; i++) out[o + i] += p.s[i]; }
  return out;
}

// A designed short sound: a list of events, each a sine blip, a soft noise tick, or a glide.
//   { f, t, dur, a, kind: 'blip' | 'tick' | 'noise' | 'glide' | 'thump', to (glide target), q (noise brightness) }
export function render(events, sr = 48000, seed = 3) {
  const r = prng(seed), parts = [];
  for (const e of events) {
    const n = Math.max(1, Math.round((e.dur || 0.05) * sr)), s = new Float32Array(n), a = e.a ?? 0.05;
    if (e.kind === 'noise' || e.kind === 'tick') {
      // band-limited noise: a one-pole low-pass of brightness q, a gentle high-pass under it
      let lp = 0, lp2 = 0, lp3 = 0, hp = 0; const k = e.q ?? 0.3;
      for (let i = 0; i < n; i++) { lp += k * (r() * 2 - 1 - lp); lp2 += k * (lp - lp2); lp3 += k * (lp2 - lp3); hp += 0.05 * (lp3 - hp); s[i] = (lp3 - hp) * a * 2.2 * Math.exp(-i / sr / ((e.dur || 0.05) * 0.3)); }
    } else {
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const x = i / n, f = e.kind === 'glide' ? e.f * (e.to / e.f) ** x : e.f;
        ph += f / sr;
        const env = e.kind === 'thump' ? Math.exp(-i / sr / ((e.dur || 0.1) * 0.25)) : Math.exp(-i / sr / ((e.dur || 0.05) * (e.ring ?? 0.35)));
        s[i] = a * env * (Math.sin(TAU * ph) + (e.h2 || 0) * Math.sin(2 * TAU * ph));
      }
      envelope(s, sr, e.attack ?? 0.003, Math.min(0.02, (e.dur || 0.05) * 0.3));
    }
    parts.push({ t: e.t || 0, s });
  }
  return mixAt(parts, sr);
}

// ---- measures
export const peak = (s) => { let p = 0; for (let i = 0; i < s.length; i++) p = Math.max(p, Math.abs(s[i])); return p; };
export const rms = (s) => { let q = 0; for (let i = 0; i < s.length; i++) q += s[i] * s[i]; return Math.sqrt(q / Math.max(1, s.length)); };
export const dbfs = (v) => 20 * Math.log10(Math.max(1e-9, v));

// magnitude spectrum by FFT (radix 2) of the first 2^k samples, with a Hann window
export function spectrum(s, sr = 48000, size = 1 << 15, from = 0) {
  const N = size, re = new Float64Array(N), im = new Float64Array(N);
  for (let i = 0; i < N; i++) re[i] = (s[from + i] || 0) * (0.5 - 0.5 * Math.cos((TAU * i) / (N - 1)));
  for (let i = 1, j = 0; i < N; i++) { let bit = N >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= N; len <<= 1) {
    const ang = -TAU / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < N; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const ar = re[i + j], ai = im[i + j], br = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci, bi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr;
        re[i + j] = ar + br; im[i + j] = ai + bi; re[i + j + len / 2] = ar - br; im[i + j + len / 2] = ai - bi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
  const mag = new Float64Array(N / 2);
  for (let i = 0; i < N / 2; i++) mag[i] = Math.hypot(re[i], im[i]);
  return { mag, hz: sr / N };
}
// the strongest peak between lo and hi Hz, refined by a parabola through the three bins around it
export function fundamental(s, sr = 48000, lo = 30, hi = 5000, size = 1 << 16) {
  const { mag, hz } = spectrum(s, sr, size);
  let k = Math.ceil(lo / hz), best = k;
  for (; k < Math.min(mag.length - 1, hi / hz); k++) if (mag[k] > mag[best]) best = k;
  const a = Math.log(mag[best - 1] + 1e-12), b = Math.log(mag[best] + 1e-12), c = Math.log(mag[best + 1] + 1e-12);
  return (best + (0.5 * (a - c)) / (a - 2 * b + c)) * hz;
}
export function energyAbove(s, sr, f0) {
  const { mag, hz } = spectrum(s, sr, 1 << 14);
  let hi = 0, all = 0;
  for (let i = 0; i < mag.length; i++) { const e = mag[i] * mag[i]; all += e; if (i * hz > f0) hi += e; }
  return all ? hi / all : 0;
}
// the envelope's own frequency (beats): rectify, smooth, then find the strongest low frequency
export function beatRate(s, sr = 48000, maxHz = 20) {
  const step = Math.round(sr / 400), env = [];
  let lp = 0;
  for (let i = 0; i < s.length; i++) { lp += 0.002 * (Math.abs(s[i]) - lp); if (i % step === 0) env.push(lp); }
  const m = env.reduce((a, b) => a + b, 0) / env.length, x = env.map((v) => v - m), esr = sr / step;
  let size = 1; while (size < x.length) size <<= 1;
  return fundamental(Float32Array.from(x), esr, 0.5, maxHz, Math.max(1024, size));
}

// 16-bit PCM WAV, mono
export function toWav(s, sr = 48000) {
  const n = s.length, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const str = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s[i])) * 32767, true);
  return new Uint8Array(buf);
}
