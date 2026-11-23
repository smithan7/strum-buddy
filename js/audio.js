import { strum } from './synth.js';

const FFT_SIZE = 8192;

// One shared audio context + mic for the whole app.
export const audio = {
  ctx: null,
  analyser: null,
  buf: null,
  stream: null,
  mutedUntil: 0,

  async start() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    if (!this.stream) {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const src = this.ctx.createMediaStreamSource(this.stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = FFT_SIZE;
      src.connect(this.analyser);
      this.buf = new Float32Array(FFT_SIZE);
    }
  },

  get running() {
    return !!this.stream;
  },

  read() {
    this.analyser.getFloatTimeDomainData(this.buf);
    return this.buf;
  },

  get now() {
    return this.ctx ? this.ctx.currentTime : 0;
  },

  // Play a chord so she can hear what it should sound like.
  play(midis) {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = this.ctx;
    if (ctx.state === 'suspended') ctx.resume();
    const data = strum(midis, ctx.sampleRate, { duration: 2.5, gap: 0.03 });
    const b = ctx.createBuffer(1, data.length, ctx.sampleRate);
    b.copyToChannel(data, 0);
    const node = ctx.createBufferSource();
    node.buffer = b;
    const gain = ctx.createGain();
    gain.gain.value = 0.9;
    node.connect(gain).connect(ctx.destination);
    node.start();
    // don't let the app "hear" itself
    this.mutedUntil = ctx.currentTime + 2.6;
  },

  get muted() {
    return this.ctx && this.ctx.currentTime < this.mutedUntil;
  },

  cheer() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.mutedUntil = Math.max(this.mutedUntil, ctx.currentTime + 0.5);
    [0, 0.09, 0.18].forEach((d, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = [784, 988, 1175][i];
      g.gain.setValueAtTime(0.0001, ctx.currentTime + d);
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + d);
      o.stop(ctx.currentTime + d + 0.3);
    });
  },
};
