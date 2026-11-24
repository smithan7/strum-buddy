import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OPEN_MIDI } from '../js/chords.js';
import { strum, mulberry32, midiToHz } from '../js/synth.js';
import { detectPitch, nearestString, tuneAdvice, cents } from '../js/pitch.js';

const SR = 48000;

OPEN_MIDI.forEach((m, i) => {
  for (const detune of [0, -25, 40]) {
    test(`hears string ${i + 1} (${detune} cents)`, () => {
      const hz = midiToHz(m) * Math.pow(2, detune / 1200);
      // a plucked string, read 0.3s after the pluck
      const sig = strum([69 + 12 * Math.log2(hz / 440)], SR, { rand: mulberry32(i + 10), duration: 1 });
      const got = detectPitch(sig.subarray(Math.floor(0.3 * SR), Math.floor(0.3 * SR) + 4096), SR);
      assert.ok(got, 'no pitch');
      const ns = nearestString(got);
      assert.equal(ns.index, i);
      // cents are checked on an exact tone with overtones (the test synth rounds its pitch)
      const tone = Float32Array.from({ length: 4096 }, (_, k) =>
        [1, 0.6, 0.4, 0.25, 0.15].reduce((acc, amp, h) => acc + amp * Math.sin(2 * Math.PI * hz * (h + 1) * k / SR), 0));
      const exact = nearestString(detectPitch(tone, SR));
      assert.equal(exact.index, i);
      assert.ok(Math.abs(exact.cents - detune) < 2, `cents ${exact.cents.toFixed(1)} vs ${detune}`);
    });
  }
});

test('silence and noise give no pitch', () => {
  assert.equal(detectPitch(new Float32Array(4096), SR), null);
  const rand = mulberry32(1);
  const noise = Float32Array.from({ length: 4096 }, () => rand() * 2 - 1);
  assert.equal(detectPitch(noise, SR), null);
});

test('advice', () => {
  assert.equal(tuneAdvice(3).ok, true);
  assert.match(tuneAdvice(-50).text, /^Too low\. Tighten/);
  assert.match(tuneAdvice(15).text, /^A little high/);
  assert.ok(Math.abs(cents(220, 110) - 1200) < 1e-9);
});
