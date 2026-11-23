// Chord detection: samples → 12-note "chroma" → best-matching chord.
import { CHORDS } from './chords.js';

export function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const xr = re[b] * cr - im[b] * ci;
        const xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr; im[b] = im[a] - xi;
        re[a] += xr; im[a] += xi;
        const t = cr * wr - ci * wi;
        ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}

export function rms(samples) {
  let s = 0;
  for (let i = 0; i < samples.length; i++) s += samples[i] * samples[i];
  return Math.sqrt(s / samples.length);
}

const windows = new Map();
function hann(n) {
  if (!windows.has(n)) {
    const w = new Float64Array(n);
    for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    windows.set(n, w);
  }
  return windows.get(n);
}

// samples.length must be a power of two (we use 8192).
export function chroma(samples, sampleRate, { minHz = 70, maxHz = 1400 } = {}) {
  const n = samples.length;
  const w = hann(n);
  const re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < n; i++) re[i] = samples[i] * w[i];
  fft(re, im);
  const half = n / 2;
  const mag = new Float64Array(half);
  let max = 0;
  for (let k = 0; k < half; k++) {
    mag[k] = Math.hypot(re[k], im[k]);
    if (mag[k] > max) max = mag[k];
  }
  const out = new Float64Array(12);
  if (max === 0) return out;
  const binHz = sampleRate / n;
  const lo = Math.max(1, Math.floor(minHz / binHz));
  const hi = Math.min(half - 2, Math.ceil(maxHz / binHz));
  for (let k = lo; k <= hi; k++) {
    const m = mag[k];
    // only spectral peaks, ignore quiet stuff
    if (m < max * 0.04 || m <= mag[k - 1] || m < mag[k + 1]) continue;
    // parabolic interpolation for a more exact frequency
    const a = mag[k - 1], c = mag[k + 1];
    const d = a - 2 * m + c;
    const off = d === 0 ? 0 : (0.5 * (a - c)) / d;
    const f = (k + off) * binHz;
    const midi = 69 + 12 * Math.log2(f / 440);
    const pc = ((Math.round(midi) % 12) + 12) % 12;
    out[pc] += Math.sqrt(m);
  }
  return out;
}

export function scoreChords(ch, names = Object.keys(CHORDS)) {
  const norm = Math.hypot(...ch) || 1;
  return names
    .map((name) => {
      const tones = CHORDS[name].tones;
      let dot = 0;
      for (const t of tones) dot += ch[t];
      return { name, score: dot / (norm * Math.sqrt(tones.length)) };
    })
    .sort((a, b) => b.score - a.score);
}

export function classify(samples, sampleRate, names) {
  return scoreChords(chroma(samples, sampleRate), names);
}

// "Close enough" for an 8-year-old: target doesn't have to win outright.
export function isCloseEnough(ranking, target, { margin = 0.06, minScore = 0.55 } = {}) {
  const best = ranking[0].score;
  const t = ranking.find((r) => r.name === target);
  return !!t && t.score >= minScore && t.score >= best - margin;
}

// Judge watches a stream of frames (~25/s) and decides when she played the target chord.
// rms should be measured on the newest ~40ms of audio so strums show up as sharp jumps.
// push({ t, rms, ranking }) returns null or an event:
//   { type: 'success' } | { type: 'wrong', heard } | { type: 'quiet' }
export class Judge {
  constructor() {
    this.floor = null;
    this.smooth = 0;
    this.lastOnset = -1;
    this.reset('Em', false, 0);
  }

  reset(target, needsNewStrum, t) {
    this.target = target;
    this.needsNewStrum = needsNewStrum;
    this.armed = false;
    this.hits = 0;
    this.frames = 0;
    this.others = {};
    this.sustain = 0;
    this.lastLoud = t;
    this.quietSent = false;
    this.seenOnset = false;
  }

  push({ t, rms, ranking }) {
    if (this.floor === null) this.floor = rms;
    if (rms < this.floor) this.floor = rms;
    else this.floor += (rms - this.floor) * 0.003;

    const loud = rms > Math.max(this.floor * 3, 0.004);
    const onset = loud && rms > this.smooth * 1.6 && t - this.lastOnset > 0.2;
    this.smooth = this.smooth * 0.7 + rms * 0.3;

    if (loud) { this.lastLoud = t; this.quietSent = false; }
    else if (!this.quietSent && t - this.lastLoud > 6) {
      this.quietSent = true;
      return { type: 'quiet' };
    }

    if (onset) {
      this.lastOnset = t;
      this.seenOnset = true;
      this.armed = true;
      this.hits = 0;
      this.frames = 0;
      this.others = {};
    }
    if (!loud || !ranking) { this.sustain = 0; return null; }

    const ok = isCloseEnough(ranking, this.target);

    // Path 1: chord changed and she's holding the right one.
    if (!this.needsNewStrum || this.seenOnset) {
      this.sustain = ok ? this.sustain + 1 : 0;
      if (this.sustain >= 8) return this.success();
    }

    // Path 2: a fresh strum that sounds right.
    if (this.armed) {
      this.frames++;
      if (ok) this.hits++;
      else this.others[ranking[0].name] = (this.others[ranking[0].name] || 0) + 1;
      if (this.hits >= 3) return this.success();
      if (this.frames >= 15) {
        this.armed = false;
        const [heard, n] = Object.entries(this.others).sort((a, b) => b[1] - a[1])[0] || [];
        if (heard && n >= 5) return { type: 'wrong', heard };
      }
    }
    return null;
  }

  success() {
    this.armed = false;
    this.sustain = 0;
    return { type: 'success' };
  }
}
