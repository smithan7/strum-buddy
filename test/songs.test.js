import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILT_IN_SONGS, parseSong, songSteps, chordsUsed, listOrder, seasonalList, MAIN_LIST, fillWords } from '../js/songs.js';

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
  assert.ok(byList('Thanksgiving').length >= 3);
});

test('lists: main first, then holidays, then her own, no repeats', () => {
  assert.deepEqual(listOrder(['Halloween', "New Year's", 'Songs', 'Christmas', 'Songs']), ['Songs', 'Christmas', "New Year's", 'Halloween']);
});

test('the holiday list opens in season', () => {
  assert.equal(seasonalList(new Date(2026, 11, 10)), 'Christmas');
  assert.equal(seasonalList(new Date(2026, 11, 30)), "New Year's");
  assert.equal(seasonalList(new Date(2027, 0, 2)), "New Year's");
  assert.equal(seasonalList(new Date(2026, 10, 25)), 'Thanksgiving');
  assert.equal(seasonalList(new Date(2027, 5, 2)), MAIN_LIST);
});

test('paste words: one line of words per chord line, headers skipped', () => {
  const song = 'title: T\n# Verse\nG C | line 1\nEm D | line 2\n# Chorus\nC G | line 3';
  const r = fillWords(song, '[Verse 1]\nfirst words\n\nsecond words\nChorus:\nthird words');
  assert.equal(r.text, 'title: T\n# Verse\nG C | first words\nEm D | second words\n# Chorus\nC G | third words');
  assert.equal(r.extra, 0);
});

test('paste words: extra words repeat the last section chords', () => {
  const r = fillWords('# V\nEm C | a\nD Em | b', 'one\ntwo\nthree\nfour\nfive');
  assert.deepEqual(r.text.split('\n').slice(3), ['Em C | three', 'D Em | four', 'Em C | five']);
  assert.equal(r.extra, 3);
  assert.deepEqual(parseSong(r.text).errors, []);
});

test('paste words: a lyric that starts with "Chorus" is kept', () => {
  assert.equal(fillWords('G | a', 'Chorus of the bells').text, 'G | Chorus of the bells');
});

test('paste words: fewer words leaves the rest as they were', () => {
  const r = fillWords('G | a\nD | b', 'only');
  assert.equal(r.text, 'G | only\nD | b');
});
