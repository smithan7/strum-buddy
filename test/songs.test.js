import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILT_IN_SONGS, parseSong, songSteps, chordsUsed } from '../js/songs.js';

test('built-in songs parse with no errors', () => {
  for (const s of BUILT_IN_SONGS) {
    const song = parseSong(s.text);
    assert.deepEqual(song.errors, [], s.id);
    assert.ok(songSteps(song).length > 0, s.id);
  }
});

test('parses title, note, sections, chords and words', () => {
  const song = parseSong(`title: Test
note: hello
# Verse
G  D | some words | more
em C`);
  assert.equal(song.title, 'Test');
  assert.equal(song.note, 'hello');
  assert.equal(song.sections[0].name, 'Verse');
  assert.deepEqual(song.sections[0].lines[0], { chords: ['G', 'D'], words: 'some words | more' });
  assert.deepEqual(song.sections[0].lines[1].chords, ['Em', 'C']);
  assert.deepEqual(chordsUsed(song), ['G', 'D', 'Em', 'C']);
});

test('unknown chords are reported, not crashed on', () => {
  const song = parseSong('G F#m D');
  assert.equal(song.errors.length, 1);
  assert.deepEqual(songSteps(song).map((s) => s.chord), ['G', 'D']);
});

test('the four-chord jam uses G D Em C', () => {
  const song = parseSong(BUILT_IN_SONGS.find((s) => s.id === 'fourchord').text);
  assert.deepEqual(chordsUsed(song), ['G', 'D', 'Em', 'C']);
});
