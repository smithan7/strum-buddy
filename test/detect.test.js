import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHORDS, shapeFor, shapeMidi } from '../js/chords.js';
import { strum, mulberry32 } from '../js/synth.js';
import { classify, isCloseEnough, Judge, rms } from '../js/detect.js';

const SR = 48000;
const N = 8192;

function windowAt(sig, sec) {
  const s = Math.floor(sec * SR);
  return sig.subarray(s, s + N);
}

test('chord shapes only use notes from the chord', () => {
  for (const [name, c] of Object.entries(CHORDS)) {
    for (const easy of [false, true]) {
      for (const m of shapeMidi(shapeFor(name, easy))) {
        assert.ok(c.tones.includes(m % 12), `${name} easy=${easy} has stray note ${m}`);
      }
    }
  }
});

for (const name of Object.keys(CHORDS)) {
  for (const easy of [false, true]) {
    test(`hears ${name}${easy ? ' (easy)' : ''}`, () => {
      const rand = mulberry32(name.length * 7 + (easy ? 1 : 0));
      const sig = strum(shapeMidi(shapeFor(name, easy)), SR, { rand });
      // add a bit of room noise
      for (let i = 0; i < sig.length; i++) sig[i] += (rand() * 2 - 1) * 0.01;
      for (const at of [0.15, 0.5, 1.0]) {
        const ranking = classify(windowAt(sig, at), SR);
        assert.equal(ranking[0].name, name, `at ${at}s got ${JSON.stringify(ranking.slice(0, 3))}`);
        assert.ok(isCloseEnough(ranking, name));
      }
    });
  }
}

function feed(judge, sig, t0, frameSec = 0.04) {
  const events = [];
  for (let t = 0; t + N / SR < sig.length / SR; t += frameSec) {
    const win = windowAt(sig, t);
    const r = rms(win.subarray(N - 2048));
    const ev = judge.push({ t: t0 + t, rms: r, ranking: r > 0.003 ? classify(win, SR) : null });
    if (ev) events.push({ ...ev, t: t0 + t });
  }
  return events;
}

function silenceThen(sig, sec = 0.5) {
  const out = new Float32Array(Math.floor(sec * SR) + sig.length);
  out.set(sig, Math.floor(sec * SR));
  return out;
}

test('judge: right chord → success', () => {
  const j = new Judge();
  j.reset('G', true, 0);
  const sig = silenceThen(strum(shapeMidi(shapeFor('G')), SR, { rand: mulberry32(1) }));
  const ev = feed(j, sig, 0);
  assert.equal(ev[0]?.type, 'success');
});

test('judge: wrong chord → tells her what it heard', () => {
  const j = new Judge();
  j.reset('G', true, 0);
  const sig = silenceThen(strum(shapeMidi(shapeFor('C')), SR, { rand: mulberry32(2) }));
  const ev = feed(j, sig, 0);
  assert.ok(!ev.some((e) => e.type === 'success'));
  assert.deepEqual(ev.find((e) => e.type === 'wrong'), { type: 'wrong', heard: 'C', t: ev.find((e) => e.type === 'wrong').t });
});

test('judge: same chord twice needs a new strum', () => {
  const j = new Judge();
  j.reset('G', true, 0);
  const sig = silenceThen(strum(shapeMidi(shapeFor('G')), SR, { rand: mulberry32(3), duration: 3 }));
  let gotFirst = false, gotSecond = false;
  for (let t = 0; t + N / SR < sig.length / SR; t += 0.04) {
    const win = windowAt(sig, t);
    const r = rms(win.subarray(N - 2048));
    const ev = j.push({ t, rms: r, ranking: r > 0.003 ? classify(win, SR) : null });
    if (ev?.type === 'success') {
      if (!gotFirst) { gotFirst = true; j.reset('G', true, t); }
      else gotSecond = true;
    }
  }
  assert.ok(gotFirst);
  assert.ok(!gotSecond, 'one ringing strum should not count twice');
});

test('judge: two real strums of the same chord both count', () => {
  const j = new Judge();
  j.reset('D', true, 0);
  const one = strum(shapeMidi(shapeFor('D')), SR, { rand: mulberry32(4), duration: 1.2 });
  const two = strum(shapeMidi(shapeFor('D')), SR, { rand: mulberry32(5), duration: 1.5 });
  const sig = new Float32Array(Math.floor(0.5 * SR) + one.length + two.length);
  sig.set(one, Math.floor(0.5 * SR));
  sig.set(two, Math.floor(0.5 * SR) + one.length);
  let count = 0;
  for (let t = 0; t + N / SR < sig.length / SR; t += 0.04) {
    const win = windowAt(sig, t);
    const r = rms(win.subarray(N - 2048));
    const ev = j.push({ t, rms: r, ranking: r > 0.003 ? classify(win, SR) : null });
    if (ev?.type === 'success') { count++; j.reset('D', true, t); }
  }
  assert.equal(count, 2);
});
