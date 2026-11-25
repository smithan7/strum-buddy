// Songs are plain text so they're easy to edit on the iPad:
//
//   title: Song name
//   note: anything to show under the title (capo, tips)
//   list: Christmas   (which list it shows in; leave it out for the main list)
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
  {
    id: 'overriver',
    text: `title: Over the River and Through the Wood
list: Thanksgiving
note: The old song about going to grandfather's house for Thanksgiving. G, C and D.
# Verse 1
G C G | Over the river and through the wood
G D | To grandfather's house we go
G C | The horse knows the way to carry the sleigh
G D G | Through the white and drifted snow
G C G | Over the river and through the wood
G D | Oh, how the wind does blow!
G C | It stings the toes and bites the nose
G D G | As over the ground we go`,
  },
  {
    id: 'simplegifts',
    text: `title: Simple Gifts
list: Thanksgiving
note: A gentle thank-you song. Mostly G and D.
# Verse
G G | 'Tis the gift to be simple, 'tis the gift to be free
G D | 'Tis the gift to come down where we ought to be
G G | And when we find ourselves in the place just right
D G | 'Twill be in the valley of love and delight
# Chorus
D G | When true simplicity is gained
G D | To bow and to bend we shan't be ashamed
G C | To turn, turn will be our delight
D G | Till by turning, turning we come round right`,
  },
  {
    id: 'gather',
    text: `title: We Gather Together
list: Thanksgiving
note: A Thanksgiving hymn people sing before the big dinner.
# Verse
G C D | We gather together to ask the Lord's blessing
G C D | He chastens and hastens His will to make known
Em C D | The wicked oppressing now cease from distressing
G C D G | Sing praises to His name; He forgets not His own`,
  },
  {
    id: 'gobble',
    text: `title: Gobble Strum
list: Thanksgiving
note: A silly one made just for Strum Buddy, with the four main chords.
# Verse
Em C | Gobble, gobble, here we go
G D | Strumming on a turkey day
Em C | Pass the pie and say thank you
D G | Happy Thanksgiving, hooray!`,
  },
  {
    id: 'jingle',
    text: `title: Jingle Bells
list: Christmas
note: G, C and D. Strum once for each box. Shout "Hey!" if you like.
# Verse
G C | Dashing through the snow, in a one-horse open sleigh
D G | O'er the fields we go, laughing all the way
G C | Bells on bobtails ring, making spirits bright
D G | What fun it is to ride and sing a sleighing song tonight!
# Chorus
G G | Jingle bells, jingle bells
C G | Jingle all the way
C G | Oh what fun it is to ride
D D | In a one-horse open sleigh, hey!
G G | Jingle bells, jingle bells
C G | Jingle all the way
C G | Oh what fun it is to ride
D G | In a one-horse open sleigh`,
  },
  {
    id: 'silent',
    text: `title: Silent Night
list: Christmas
note: Slow and gentle. Let each strum ring.
# Verse
G G | Silent night, holy night
D G | All is calm, all is bright
C G | Round yon virgin, mother and child
C G | Holy infant so tender and mild
D G | Sleep in heavenly peace
D G | Sleep in heavenly peace`,
  },
  {
    id: 'wewish',
    text: `title: We Wish You a Merry Christmas
list: Christmas
note: Uses Am too. Bouncy and fast-ish, but go at your speed!
# Verse
G C | We wish you a merry Christmas
Am D | We wish you a merry Christmas
Em C | We wish you a merry Christmas
D G | And a happy New Year!
# Chorus
G D | Good tidings we bring
Am D | To you and your kin
G Em | Good tidings for Christmas
C D G | And a happy New Year!`,
  },
  {
    id: 'joy',
    text: `title: Joy to the World
list: Christmas
note: G, C and D.
# Verse
G C D G | Joy to the world, the Lord is come
C D G | Let earth receive her King
G G | Let every heart prepare Him room
G D | And heaven and nature sing
C G D G | And heaven, and heaven and nature sing`,
  },
  {
    id: 'auld',
    text: `title: Auld Lang Syne
list: New Year's
note: The song everyone sings at midnight on New Year's Eve.
# Verse
G D | Should auld acquaintance be forgot
G C | And never brought to mind?
G D | Should auld acquaintance be forgot
Em C D G | And auld lang syne?
# Chorus
G D | For auld lang syne, my dear
G C | For auld lang syne
G D | We'll take a cup of kindness yet
Em C D G | For auld lang syne`,
  },
  {
    id: 'countdown',
    text: `title: Countdown Strum
list: New Year's
note: Count down to midnight with one strum per number, using the four chords.
# Get ready…
G | Ten!
D | Nine!
Em | Eight!
C | Seven!
G | Six!
D | Five!
Em | Four!
C | Three!
D | Two!
D | One!
G | Happy New Year! 🎆`,
  },
];

// The main list first, then the holidays, then any list she makes up.
export const MAIN_LIST = 'Songs';
const LIST_ORDER = [MAIN_LIST, 'Thanksgiving', 'Christmas', "New Year's"];
export function listOrder(names) {
  const rank = (n) => (LIST_ORDER.includes(n) ? LIST_ORDER.indexOf(n) : LIST_ORDER.length);
  return [...new Set(names)].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

// Which list to open on: Thanksgiving in November, Christmas in December, New Year's around New Year.
export function seasonalList(date = new Date()) {
  const m = date.getMonth(), d = date.getDate();
  if (m === 11 && d >= 27) return "New Year's";
  if (m === 0 && d <= 7) return "New Year's";
  if (m === 11) return 'Christmas';
  if (m === 10) return 'Thanksgiving';
  return MAIN_LIST;
}

export function parseSong(text) {
  const song = { title: 'Untitled', note: '', list: MAIN_LIST, sections: [], errors: [] };
  let sec = null;
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    let m;
    if ((m = line.match(/^title:\s*(.*)$/i))) song.title = m[1].trim() || song.title;
    else if ((m = line.match(/^list:\s*(.*)$/i))) song.list = m[1].trim() || MAIN_LIST;
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

// "Paste words": put pasted lyrics on the chord lines, one line of words per chord line, in order.
// Header lines in the paste ("[Chorus]", "Verse 2:", blank lines) are skipped. If there are more
// lines of words than chord lines, the last section's chord lines repeat to hold them. Chord
// lines with no words left keep what they had.
const isHeader = (l) => /^\[.*\]$/.test(l) || /^\(.*\)$/.test(l) || /^(verse|chorus|bridge|intro|outro|pre-chorus|refrain)(\s*\d+)?\s*:?$/i.test(l);
export function fillWords(text, pasted) {
  const words = pasted.split('\n').map((l) => l.trim()).filter((l) => l && !isHeader(l));
  const lines = text.replace(/\s+$/, '').split('\n');
  const isChordLine = (raw) => {
    const l = raw.trim();
    return l && !/^(title|note|list):/i.test(l) && !l.startsWith('#');
  };
  const chordsOf = (raw) => { const i = raw.indexOf('|'); return (i < 0 ? raw : raw.slice(0, i)).trim(); };
  let w = 0;
  const out = lines.map((raw) => (isChordLine(raw) && w < words.length ? `${chordsOf(raw)} | ${words[w++]}` : raw));
  // Chord patterns of the last section, to repeat for leftover words.
  let lastSec = [];
  for (const raw of lines) {
    if (raw.trim().startsWith('#')) lastSec = [];
    else if (isChordLine(raw)) lastSec.push(chordsOf(raw));
  }
  if (!lastSec.length) lastSec = ['G'];
  for (let k = 0; w < words.length; k++) out.push(`${lastSec[k % lastSec.length]} | ${words[w++]}`);
  return { text: out.join('\n'), used: Math.min(w, words.length), extra: Math.max(0, words.length - lines.filter(isChordLine).length) };
}
