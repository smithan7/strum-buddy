// Plucked-string synth (Karplus-Strong). Pure function so tests can use it too.

export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function midiToHz(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

// Strum the given notes low → high. Returns a Float32Array of samples.
export function strum(midis, sampleRate, { duration = 2.2, gap = 0.018, rand = Math.random, decay = 0.996 } = {}) {
  const out = new Float32Array(Math.floor(duration * sampleRate));
  midis.forEach((m, idx) => {
    const L = Math.max(2, Math.round(sampleRate / midiToHz(m) - 0.5));
    const buf = new Float32Array(L);
    for (let i = 0; i < L; i++) buf[i] = rand() * 2 - 1;
    const start = Math.floor(idx * gap * sampleRate);
    let p = 0;
    for (let n = start; n < out.length; n++) {
      const next = (p + 1) % L;
      const v = buf[p];
      buf[p] = decay * 0.5 * (buf[p] + buf[next]);
      out[n] += v * 0.25;
      p = next;
    }
  });
  return out;
}
