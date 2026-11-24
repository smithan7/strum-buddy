import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILT_IN_SONGS, parseSong, songSteps, chordsUsed, listOrder, seasonalList, MAIN_LIST } from '../js/songs.js';

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

test('songs go in the main list unless they say otherwise', () => {
  assert.equal(parseSong('G D').list, MAIN_LIST);
  assert.equal(parseSong('list: Halloween\nEm C').list, 'Halloween');
  assert.equal(parseSong('list:\nG').list, MAIN_LIST);
});

test('there are Christmas and New Year songs, all with chords she knows', () => {
  const byList = (l) => BUILT_IN_SONGS.filter((s) => parseSong(s.text).list === l);
  assert.ok(byList('Christmas').length >= 3);
  assert.ok(byList("New Year's").length >= 2);
});

test('lists: main first, then holidays, then her own, no repeats', () => {
  assert.deepEqual(listOrder(['Halloween', "New Year's", 'Songs', 'Christmas', 'Songs']), ['Songs', 'Christmas', "New Year's", 'Halloween']);
});

test('the holiday list opens in season', () => {
  assert.equal(seasonalList(new Date(2026, 11, 10)), 'Christmas');
  assert.equal(seasonalList(new Date(2026, 11, 30)), "New Year's");
  assert.equal(seasonalList(new Date(2027, 0, 2)), "New Year's");
  assert.equal(seasonalList(new Date(2027, 5, 2)), MAIN_LIST);
});
