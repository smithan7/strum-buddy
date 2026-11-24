// Single-note pitch detection (YIN) for the tuner.
import { OPEN_MIDI, STRING_NAMES } from './chords.js';
import { midiToHz } from './synth.js';

// Returns the pitch in Hz, or null when there's no clear note.
export function detectPitch(buf, sampleRate, { minHz = 70, maxHz = 1000, threshold = 0.15 } = {}) {
  const n = Math.min(buf.length, 4096);
  const x = buf.subarray(buf.length - n);
  const W = Math.floor(n / 2);
  const maxTau = Math.min(W - 1, Math.floor(sampleRate / minHz));
  const minTau = Math.max(2, Math.floor(sampleRate / maxHz));
  const d = new Float64Array(maxTau + 2);
  for (let tau = 1; tau <= maxTau + 1; tau++) {
    let s = 0;
    for (let j = 0; j < W; j++) { const v = x[j] - x[j + tau]; s += v * v; }
    d[tau] = s;
  }
  // cumulative mean normalised difference
  const c = new Float64Array(maxTau + 2);
  c[0] = 1;
  let run = 0;
  for (let tau = 1; tau <= maxTau + 1; tau++) { run += d[tau]; c[tau] = run ? (d[tau] * tau) / run : 1; }
  let tau = -1;
  for (let t = minTau; t <= maxTau; t++) {
    if (c[t] < threshold) {
      while (t + 1 <= maxTau && c[t + 1] < c[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) return null;
  const a = c[tau - 1], b = c[tau], e = c[tau + 1];
  const den = a - 2 * b + e;
  const off = den ? (0.5 * (a - e)) / den : 0;
  return sampleRate / (tau + off);
}

export const cents = (hz, target) => 1200 * Math.log2(hz / target);

// The guitar string this pitch is closest to (standard tuning).
export function nearestString(hz) {
  let best = 0, bestAbs = Infinity;
  OPEN_MIDI.forEach((m, i) => {
    const c = Math.abs(cents(hz, midiToHz(m)));
    if (c < bestAbs) { bestAbs = c; best = i; }
  });
  const target = midiToHz(OPEN_MIDI[best]);
  return { index: best, name: STRING_NAMES[best], target, cents: cents(hz, target) };
}

// What to tell an 8-year-old.
export function tuneAdvice(c) {
  if (Math.abs(c) <= 7) return { ok: true, text: 'Perfect! ✓' };
  if (c < 0) return { ok: false, text: c < -30 ? 'Too low. Tighten it (turn the peg so the note goes up).' : 'A little low. Tighten it a tiny bit.' };
  return { ok: false, text: c > 30 ? 'Too high. Loosen it (turn the peg so the note goes down).' : 'A little high. Loosen it a tiny bit.' };
}
