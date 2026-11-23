import { STRING_NAMES } from './chords.js';

const FINGER_COLORS = { 1: '#ff5a7a', 2: '#3b9cff', 3: '#21c07a', 4: '#ff9f1c' };
export const FINGER_NAMES = { 1: 'pointer', 2: 'middle', 3: 'ring', 4: 'pinky' };
export { FINGER_COLORS };

// SVG chord box: strings vertical (thick E on the left), frets horizontal.
export function chordDiagram(shape, { width = 220 } = {}) {
  const frets = 4;
  const padX = 26, top = 40, bottom = 30;
  const gapX = (width - padX * 2) / 5;
  const gapY = gapX * 1.25;
  const height = top + gapY * frets + bottom;
  const x = (s) => padX + s * gapX;
  const y = (f) => top + f * gapY;
  const r = gapX * 0.38;

  let svg = `<svg viewBox="0 0 ${width} ${height}" width="100%" class="diagram" role="img" aria-label="chord diagram">`;
  // nut + frets
  svg += `<rect x="${x(0) - 3}" y="${y(0) - 6}" width="${x(5) - x(0) + 6}" height="8" rx="3" fill="var(--ink)"/>`;
  for (let f = 1; f <= frets; f++) svg += `<line x1="${x(0)}" x2="${x(5)}" y1="${y(f)}" y2="${y(f)}" stroke="var(--fret)" stroke-width="3"/>`;
  // strings, thicker for the low ones
  for (let s = 0; s < 6; s++) {
    svg += `<line x1="${x(s)}" x2="${x(s)}" y1="${y(0)}" y2="${y(frets)}" stroke="var(--string)" stroke-width="${3.5 - s * 0.45}"/>`;
    svg += `<text x="${x(s)}" y="${height - 8}" class="dg-label">${STRING_NAMES[s]}</text>`;
  }
  shape.frets.forEach((f, s) => {
    if (f < 0) svg += `<text x="${x(s)}" y="${top - 16}" class="dg-mark dg-x">✕</text>`;
    else if (f === 0) svg += `<circle cx="${x(s)}" cy="${top - 22}" r="${r * 0.55}" fill="none" stroke="var(--ok)" stroke-width="3"/>`;
    else {
      const finger = shape.fingers[s];
      const cy = y(f) - gapY / 2;
      svg += `<circle cx="${x(s)}" cy="${cy}" r="${r}" fill="${FINGER_COLORS[finger] || '#888'}"/>`;
      svg += `<text x="${x(s)}" y="${cy + r * 0.42}" class="dg-finger" style="font-size:${r * 1.15}px">${finger || ''}</text>`;
    }
  });
  svg += '</svg>';
  return svg;
}

export function fingerLegend(shape) {
  const used = [...new Set(shape.fingers.filter((f) => f > 0))].sort();
  if (!used.length) return '';
  return `<div class="legend">${used
    .map((f) => `<span><i style="background:${FINGER_COLORS[f]}">${f}</i>${FINGER_NAMES[f]}</span>`)
    .join('')}</div>`;
}
