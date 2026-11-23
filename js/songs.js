// Songs are plain text so they're easy to edit on the iPad:
//
//   title: Song name
//   note: anything to show under the title (capo, tips)
//   # Section name
//   G G C G | words for this line (optional)
//
// Each chord = one strum. The app waits for her before moving on.
import { CHORDS } from './chords.js';

export const BUILT_IN_SONGS = [
  {
    id: 'skip',
    text: `title: Skip to My Lou
note: Just two chords: G and D. Strum once for each box.
# Chorus
G G | Lou, Lou, skip to my Lou
D D | Lou, Lou, skip to my Lou
G G | Lou, Lou, skip to my Lou
D G | Skip to my Lou, my darling`,
  },
  {
    id: 'clementine',
    text: `title: Clementine
note: Still just G and D, with longer lines.
# Verse
G G G D | In a cavern, in a canyon, excavating for a mine
D D D G | Dwelt a miner, forty-niner, and his daughter Clementine
# Chorus
G G G D | Oh my darling, oh my darling, oh my darling Clementine
D G D G | You are lost and gone forever, dreadful sorry, Clementine`,
  },
  {
    id: 'grace',
    text: `title: Amazing Grace
note: Adds C. Slow and steady, there's no rush.
# Verse
G G C G | Amazing grace, how sweet the sound
G G D D | That saved a wretch like me
G G C G | I once was lost, but now am found
G D G G | Was blind, but now I see`,
  },
  {
    id: 'fourchord',
    text: `title: Four Chord Jam
note: G, D, Em, C is the progression from the Axis of Awesome "4 Chords" song, and it's in hundreds of hits. Learn this and you can play loads of songs!
# Round 1
G D Em C
# Round 2
G D Em C
# Round 3
G D Em C
# Round 4
G D Em C | ...and finish on G!
G`,
  },
  {
    id: 'hanging',
    text: `title: The Hanging Tree (simple)
note: A simple version in E minor. Put a capo on fret 5 to match the movie. Tap ✏️ to add the words or change chords.
# Verse 1
Em C | line 1
G D | line 2
Em C | line 3
D Em | line 4
# Verse 2
Em C | line 1
G D | line 2
Em C | line 3
D Em | line 4
# Verse 3
Em C | line 1
G D | line 2
Em C | line 3
D Em | line 4
# Verse 4
Em C | line 1
G D | line 2
Em C | line 3
D Em | line 4`,
  },
  {
    id: 'itsok',
    text: `title: It's OK (simple)
note: A simple version in G using the four main chords. Capo 7 matches the recording. Tap ✏️ to add the words or change chords.
# Verse
G C | line 1
Em D | line 2
G C | line 3
Em D | line 4
# Chorus
C G | line 1
D Em | line 2
C G | line 3
D G | line 4`,
  },
];

export function parseSong(text) {
  const song = { title: 'Untitled', note: '', sections: [], errors: [] };
  let sec = null;
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    let m;
    if ((m = line.match(/^title:\s*(.*)$/i))) song.title = m[1].trim() || song.title;
    else if ((m = line.match(/^note:\s*(.*)$/i))) song.note += (song.note ? ' ' : '') + m[1].trim();
    else if (line.startsWith('#')) {
      sec = { name: line.replace(/^#+\s*/, ''), lines: [] };
      song.sections.push(sec);
    } else {
      const bar = line.indexOf('|');
      const chordPart = bar < 0 ? line : line.slice(0, bar);
      const words = bar < 0 ? '' : line.slice(bar + 1).trim();
      const chords = [];
      for (const tok of chordPart.trim().split(/\s+/).filter(Boolean)) {
        const name = normalizeChord(tok);
        if (name) chords.push(name);
        else song.errors.push(`Line ${i + 1}: I don't know the chord "${tok}" yet`);
      }
      if (!chords.length) return;
      if (!sec) { sec = { name: '', lines: [] }; song.sections.push(sec); }
      sec.lines.push({ chords, words });
    }
  });
  return song;
}

function normalizeChord(tok) {
  if (CHORDS[tok]) return tok;
  const alt = { em: 'Em', e_m: 'Em', am: 'Am', g: 'G', d: 'D', c: 'C', Emin: 'Em', Amin: 'Am' };
  return alt[tok] || alt[tok.toLowerCase()] || null;
}

// Flatten into one step per strum.
export function songSteps(song) {
  const steps = [];
  song.sections.forEach((sec, si) => {
    sec.lines.forEach((line, li) => {
      line.chords.forEach((chord, ci) => {
        steps.push({ chord, section: sec.name, si, li, ci, line });
      });
    });
  });
  return steps;
}

export function chordsUsed(song) {
  return [...new Set(songSteps(song).map((s) => s.chord))];
}
