// Chord shapes. Strings are listed low → high: E A D G B e.
// frets: -1 = don't play, 0 = open, n = fret number.
// fingers: 1 = pointer, 2 = middle, 3 = ring, 4 = pinky, 0 = none.

export const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const CHORDS = {
  Em: {
    tones: [4, 7, 11],
    full: { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
    tip: 'Two fingers side by side on fret 2. Strum ALL six strings!',
  },
  G: {
    tones: [7, 11, 2],
    full: { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
    easy: { frets: [-1, -1, 0, 0, 0, 3], fingers: [0, 0, 0, 0, 0, 3] },
    tip: 'Ring finger on the skinny string, fret 3.',
    easyTip: 'Just ONE finger! Ring finger on the skinny string. Strum the 4 skinny strings.',
  },
  D: {
    tones: [2, 6, 9],
    full: { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
    tip: 'Makes a little triangle. Only strum the 4 skinny strings.',
  },
  C: {
    tones: [0, 4, 7],
    full: { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
    easy: { frets: [-1, -1, -1, 0, 1, 0], fingers: [0, 0, 0, 0, 1, 0] },
    tip: 'Fingers make a staircase: 3, 2, 1. Skip the thickest string.',
    easyTip: 'Just ONE finger! Pointer on fret 1 of the second string. Strum the 3 skinny strings.',
  },
  Am: {
    tones: [9, 0, 4],
    full: { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
    tip: 'Like E minor, but every finger moves down one string. Skip the thickest string.',
  },
};

// The order she learns them in.
export const LEARN_ORDER = ['Em', 'G', 'D', 'C', 'Am'];

export function shapeFor(name, easy = false) {
  const c = CHORDS[name];
  return (easy && c.easy) || c.full;
}

export function tipFor(name, easy = false) {
  const c = CHORDS[name];
  return (easy && c.easyTip) || c.tip;
}

export function shapeMidi(shape) {
  return shape.frets.map((f, i) => (f < 0 ? null : OPEN_MIDI[i] + f)).filter((m) => m !== null);
}
