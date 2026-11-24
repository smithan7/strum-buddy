import { CHORDS, LEARN_ORDER, OPEN_MIDI, STRING_NAMES, shapeFor, tipFor, shapeMidi } from './chords.js';
import { detectPitch, nearestString, tuneAdvice } from './pitch.js';
import { BUILT_IN_SONGS, parseSong, songSteps, chordsUsed, listOrder, seasonalList, MAIN_LIST } from './songs.js';
import { chordDiagram, fingerLegend, STRING_WIDTHS, thicknessKey } from './diagram.js';
import { classify, rms, Judge } from './detect.js';
import { audio } from './audio.js';

const $app = document.getElementById('app');

// ---------- saved stuff (stays on this iPad) ----------
const store = {
  get(k, d) {
    try { const v = localStorage.getItem('sb:' + k); return v === null ? d : JSON.parse(v); } catch { return d; }
  },
  set(k, v) {
    try { localStorage.setItem('sb:' + k, JSON.stringify(v)); } catch { /* private mode */ }
  },
};
let easy = store.get('easy', true);
const stars = store.get('stars', {});
const addStar = (key) => { stars[key] = (stars[key] || 0) + 1; store.set('stars', stars); };
const starStr = (n) => (n ? '⭐'.repeat(Math.min(n, 3)) : '');

const customSongs = () => store.get('songs', {});
const songText = (id) => customSongs()[id] ?? BUILT_IN_SONGS.find((s) => s.id === id)?.text ?? '';
const isBuiltIn = (id) => BUILT_IN_SONGS.some((s) => s.id === id);
function allSongIds() {
  const ids = BUILT_IN_SONGS.map((s) => s.id);
  for (const k of Object.keys(customSongs())) if (!ids.includes(k)) ids.push(k);
  return ids;
}

// ---------- tiny helpers ----------
let cleanup = null;
function show(html) {
  if (cleanup) { cleanup(); cleanup = null; }
  $app.innerHTML = html;
  window.scrollTo(0, 0);
}
const $ = (sel) => $app.querySelector(sel);
const on = (sel, ev, fn) => $app.querySelectorAll(sel).forEach((el) => el.addEventListener(ev, fn));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const topbar = (title, right = '') =>
  `<div class="topbar"><button class="back">‹ Back</button><h1>${title}</h1><div class="right">${right}</div></div>`;
const PRAISE = ['Yes!', 'Nice!', 'Awesome!', 'You got it!', 'Great!', 'Woo!', 'Rock star!'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ---------- screens ----------
function home() {
  show(`
    <header class="hero"><h1>🎸 Strum Buddy</h1><p>Play a chord and I'll listen!</p></header>
    <div class="cards">
      <button class="card c1" data-go="chords"><b>1</b><span>Learn the chords</span><small>Where your fingers go</small></button>
      <button class="card c2" data-go="switch"><b>2</b><span>Switch it up</span><small>Change chords faster</small></button>
      <button class="card c3" data-go="songs"><b>3</b><span>Play songs</span><small>The app waits for you</small></button>
      <button class="card c4" data-go="tuner"><b>🎵</b><span>Tune up</span><small>Do this first!</small></button>
    </div>
    <label class="toggle"><input type="checkbox" id="easy" ${easy ? 'checked' : ''}> Easy one-finger G and C</label>`);
  on('[data-go]', 'click', (e) => ({ chords: chordsScreen, switch: switchScreen, songs: songsScreen, tuner: tunerScreen })[e.currentTarget.dataset.go]());
  on('#easy', 'change', (e) => { easy = e.target.checked; store.set('easy', easy); });
}

function chordsScreen() {
  show(topbar('Learn the chords') + `<p class="hint">Start with E minor, it's the easiest. Tap a chord to practise it.</p>
    <div class="grid">${LEARN_ORDER.map((n) => `
      <button class="chordcard" data-chord="${n}">
        <h2>${n}</h2>${chordDiagram(shapeFor(n, easy), { width: 160 })}
        <div class="stars">${starStr(stars['chord:' + n])}</div>
      </button>`).join('')}</div>`);
  on('.back', 'click', home);
  on('[data-chord]', 'click', (e) => {
    const n = e.currentTarget.dataset.chord;
    play({ title: `Practise ${n}`, key: 'chord:' + n, steps: Array.from({ length: 4 }, () => ({ chord: n })), back: chordsScreen });
  });
}

const PAIRS = [['Em', 'G'], ['G', 'D'], ['D', 'Em'], ['G', 'C'], ['C', 'Em'], ['C', 'D'], ['Am', 'C'], ['Em', 'Am']];
function switchScreen() {
  show(topbar('Switch it up') + `<p class="hint">Go back and forth between two chords. Try to get faster each time!</p>
    <div class="pairs">${PAIRS.map(([a, b], i) => `
      <button class="pair" data-i="${i}"><span>${a}</span>↔<span>${b}</span>
      <div class="stars">${starStr(stars[`switch:${a}-${b}`])}</div></button>`).join('')}</div>`);
  on('.back', 'click', home);
  on('[data-i]', 'click', (e) => {
    const [a, b] = PAIRS[+e.currentTarget.dataset.i];
    const steps = Array.from({ length: 8 }, (_, k) => ({ chord: k % 2 ? b : a }));
    play({ title: `${a} ↔ ${b}`, key: `switch:${a}-${b}`, steps, back: switchScreen });
  });
}

// Which song list is showing: the one she picked last, or the holiday one in season.
let songList = store.get('songList', null);
const LIST_ICONS = { [MAIN_LIST]: '🎵', Christmas: '🎄', "New Year's": '🎆' };

function songsScreen() {
  const songs = allSongIds().map((id) => ({ id, song: parseSong(songText(id)) }));
  const lists = listOrder([MAIN_LIST, ...songs.map((x) => x.song.list)]);
  let cur = songList && lists.includes(songList) ? songList : seasonalList();
  if (!lists.includes(cur)) cur = MAIN_LIST;
  const tabs = lists.map((n) => `<button class="tab${n === cur ? ' on' : ''}" data-list="${esc(n)}">${LIST_ICONS[n] ?? '⭐'} ${esc(n)}</button>`).join('');
  const rows = songs.filter((x) => x.song.list === cur).map(({ id, song }) => `<div class="songrow">
      <button class="songplay" data-play="${esc(id)}">
        <span class="songtitle">${esc(song.title)}</span>
        <span class="chips">${chordsUsed(song).map((c) => `<i>${c}</i>`).join('')}</span>
        <span class="stars">${starStr(stars['song:' + id])}</span>
      </button>
      <button class="edit" data-edit="${esc(id)}" aria-label="edit">✏️</button>
    </div>`);
  show(topbar('Songs') + `<div class="tabs">${tabs}</div><div class="songs">${rows.join('')}</div>
    <button class="ghost" id="new">+ Add a song${cur === MAIN_LIST ? '' : ` to ${esc(cur)}`}</button>`);
  on('.back', 'click', home);
  on('[data-list]', 'click', (e) => { songList = e.currentTarget.dataset.list; store.set('songList', songList); songsScreen(); });
  on('[data-play]', 'click', (e) => {
    const id = e.currentTarget.dataset.play;
    const song = parseSong(songText(id));
    const steps = songSteps(song);
    if (steps.length) play({ title: song.title, note: song.note, key: 'song:' + id, steps, back: songsScreen });
  });
  on('[data-edit]', 'click', (e) => editScreen(e.currentTarget.dataset.edit));
  on('#new', 'click', () => editScreen('my-' + Date.now().toString(36),
    `title: My song\n${cur === MAIN_LIST ? '' : `list: ${cur}\n`}# Verse\nG C | words go here\nEm D | more words`));
}

function editScreen(id, starter) {
  const text = starter ?? songText(id);
  const customised = isBuiltIn(id) && customSongs()[id] != null;
  show(topbar('Edit song') + `
    <div class="editor">
      <textarea id="txt" spellcheck="false" autocapitalize="off">${esc(text)}</textarea>
      <div class="edithelp">
        <p><b>How to write a song</b></p>
        <p><code>title: Song name</code><br><code>note: capo, tips…</code><br><code>list: Christmas</code> puts it in a list (make up any name, like Halloween)<br><code># Verse 1</code> starts a section<br>
        <code>G C Em D | the words</code> one strum per chord, words after the <code>|</code></p>
        <p>Chords I know: ${Object.keys(CHORDS).join(', ')}</p>
        <div id="errs" class="errs"></div>
      </div>
    </div>
    <div class="controls">
      <button id="save" class="big">Save</button>
      ${customised ? '<button id="reset">Undo my changes</button>' : ''}
      ${!isBuiltIn(id) && !starter ? '<button id="del">Delete song</button>' : ''}
    </div>`);
  const check = () => {
    const errs = parseSong($('#txt').value).errors;
    $('#errs').innerHTML = errs.map(esc).join('<br>');
  };
  check();
  on('#txt', 'input', check);
  on('.back', 'click', songsScreen);
  on('#save', 'click', () => { const all = customSongs(); all[id] = $('#txt').value; store.set('songs', all); songsScreen(); });
  on('#reset', 'click', () => { const all = customSongs(); delete all[id]; store.set('songs', all); editScreen(id); });
  on('#del', 'click', () => { const all = customSongs(); delete all[id]; store.set('songs', all); songsScreen(); });
}

// ---------- tuner: pluck one string, see if it's too low, too high or just right ----------
function tunerScreen() {
  const strings = STRING_NAMES.map((name, i) => `
    <button class="tstring" data-s="${i}" aria-label="Play the ${name} string">
      <svg viewBox="0 0 40 120" class="tsvg"><line x1="20" x2="20" y1="6" y2="114" stroke="currentColor" stroke-width="${STRING_WIDTHS[i] * 1.2}" stroke-linecap="round"/></svg>
      <b>${name}</b><span class="tick">✓</span>
    </button>`).join('');
  show(topbar('Tune up') + `
    <p class="hint">Pluck one string at a time and let it ring. Start with the thickest string. Tap a string below to hear how it should sound.</p>
    <div class="tuner">
      <div class="tnote" id="tnote">–</div>
      <div class="tmeter" aria-hidden="true"><div class="tzone"></div><div class="tneedle" id="needle"></div><span class="lo">too low</span><span class="hi">too high</span></div>
      <div class="bubble" id="tmsg">Tap "Start listening", then pluck a string 🎸</div>
      <div class="tstrings">${strings}</div>
      <svg viewBox="0 0 300 30" class="tkey" aria-hidden="true">${thicknessKey(20, 280, 6)}</svg>
    </div>
    <div class="controls"><button id="listen" class="big">🎤 Start listening</button></div>`);
  on('.back', 'click', home);
  const done = new Set();
  let recent = [], goodSince = null, timer = null;
  const say = (t, cls = '') => { $('#tmsg').textContent = t; $('#tmsg').className = 'bubble ' + cls; };
  on('[data-s]', 'click', (e) => audio.play([OPEN_MIDI[+e.currentTarget.dataset.s]]));
  function tick() {
    if (audio.muted) return;
    const buf = audio.read();
    const level = rms(buf.subarray(buf.length - 2048));
    const hz = level > 0.008 ? detectPitch(buf, audio.ctx.sampleRate) : null;
    if (!hz) { recent = []; goodSince = null; return; }
    recent = [...recent.slice(-4), hz];
    const mid = [...recent].sort((a, b) => a - b)[Math.floor(recent.length / 2)];
    const ns = nearestString(mid);
    const adv = tuneAdvice(ns.cents);
    $('#tnote').textContent = ns.name;
    $('#needle').style.left = `${50 + Math.max(-50, Math.min(50, ns.cents))}%`;
    $('#needle').classList.toggle('ok', adv.ok);
    $app.querySelectorAll('[data-s]').forEach((b) => b.classList.toggle('now', +b.dataset.s === ns.index));
    if (adv.ok) {
      goodSince ??= audio.now;
      if (audio.now - goodSince > 0.8 && !done.has(ns.index)) {
        done.add(ns.index);
        $app.querySelector(`[data-s="${ns.index}"]`).classList.add('done');
        audio.cheer();
      }
      say(done.size === 6 ? 'All 6 strings are in tune! 🎉 Time to play.' : `${ns.name} string: ${adv.text}`, 'good');
    } else { goodSince = null; say(`${ns.name} string: ${adv.text}`, 'try'); }
  }
  const start = () => { $('#listen').style.display = 'none'; say('Listening… pluck a string 👂'); timer = setInterval(tick, 50); };
  cleanup = () => clearInterval(timer);
  on('#listen', 'click', async () => {
    try { await audio.start(); start(); } catch { say("I can't hear the microphone. Ask a grown-up to allow it (Settings › Safari › Microphone).", 'try'); }
  });
  if (audio.running) start();
}

// ---------- the play screen: listens and waits for her ----------
function play({ title, note = '', key, steps, back }) {
  let i = 0;
  let done = false;
  const judge = new Judge();
  const hitTimes = [];
  let startedAt = null;
  let lastFeedback = 0;

  show(topbar(esc(title), '<span id="count"></span>') + `
    ${note ? `<p class="hint">${esc(note)}</p>` : ''}
    <div class="play">
      <div class="now" id="now">
        <div class="nowname" id="nowname"></div>
        <div class="nowdiag" id="nowdiag"></div>
        <div id="legend"></div>
        <p class="tip" id="tip"></p>
      </div>
      <div class="side">
        <div class="lane" id="lane"></div>
        <div class="next"><small>Next up</small><div id="nextname"></div><div id="nextdiag"></div></div>
      </div>
    </div>
    <div class="bubble" id="bubble"></div>
    <div class="meter"><div id="level"></div></div>
    <div class="controls">
      <button id="listen" class="big">🎤 Start listening</button>
      <button id="hear">🔊 Hear it</button>
      <button id="skip">I played it ➜</button>
    </div>`);

  const say = (msg, cls = '') => { const b = $('#bubble'); b.textContent = msg; b.className = 'bubble ' + cls; };

  function render() {
    const step = steps[i];
    const shape = shapeFor(step.chord, easy);
    $('#count').textContent = `${i + 1} / ${steps.length}`;
    $('#nowname').textContent = step.chord;
    $('#nowdiag').innerHTML = chordDiagram(shape, { width: 260 });
    $('#legend').innerHTML = fingerLegend(shape);
    $('#tip').textContent = tipFor(step.chord, easy);
    const nxt = steps[i + 1];
    $('#nextname').textContent = nxt ? nxt.chord : '🏁';
    $('#nextdiag').innerHTML = nxt ? chordDiagram(shapeFor(nxt.chord, easy), { width: 110 }) : '';
    $('#lane').innerHTML = laneHtml();
  }

  function laneHtml() {
    const step = steps[i];
    if (!step.line) {
      return `<div class="boxes">${steps.map((s, k) =>
        `<span class="box ${k < i ? 'played' : k === i ? 'current' : ''}">${s.chord}</span>`).join('')}</div>`;
    }
    // song: show this line and the next one
    const lines = [];
    for (let k = i; k < steps.length && lines.length < 2; k++) {
      const s = steps[k];
      if (!lines.length || lines[lines.length - 1].line !== s.line) lines.push({ line: s.line, section: s.section, first: k - s.ci });
    }
    return lines.map(({ line, section, first }, n) => `
      <div class="songline ${n ? 'upcoming' : ''}">
        ${section && (n === 0 || line !== lines[0].line) ? `<div class="section">${esc(section)}</div>` : ''}
        <div class="boxes">${line.chords.map((c, ci) => {
          const k = first + ci;
          return `<span class="box ${k < i ? 'played' : k === i ? 'current' : ''}">${c}</span>`;
        }).join('')}</div>
        ${line.words ? `<div class="words">${esc(line.words)}</div>` : ''}
      </div>`).join('');
  }

  function advance(fromSkip) {
    hitTimes.push(audio.now);
    if (!fromSkip) {
      audio.cheer();
      say(`${pick(PRAISE)} That's ${steps[i].chord} 🎉`, 'good');
      $('#now').classList.remove('pop'); void $('#now').offsetWidth; $('#now').classList.add('pop');
    }
    i++;
    if (i >= steps.length) return finish();
    render();
    judge.reset(steps[i].chord, steps[i].chord === steps[i - 1].chord, audio.now);
    if (fromSkip) say(`Now ${steps[i].chord}!`);
  }

  function finish() {
    done = true;
    addStar(key);
    const secs = Math.max(1, Math.round(audio.now - (startedAt ?? audio.now)));
    const changes = hitTimes.slice(1).map((t, k) => t - hitTimes[k]).filter((d) => d > 0.2);
    const best = changes.length ? Math.min(...changes).toFixed(1) : null;
    setTimeout(() => {
      show(`<div class="finish">
        <div class="confetti">🎉🎸⭐</div>
        <h1>You did it!</h1>
        <p class="big-stars">${starStr(stars[key])}</p>
        <p>${esc(title)}: ${steps.length} chords in ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}</p>
        ${best ? `<p>Fastest chord change: <b>${best} seconds</b></p>` : ''}
        <div class="controls"><button class="big" id="again">Play again</button><button id="back">Back</button></div>
      </div>`);
      on('#again', 'click', () => play({ title, note, key, steps, back }));
      on('#back', 'click', back);
    }, 700);
  }

  function handle(ev) {
    if (!ev || done) return;
    if (ev.type === 'success') return advance(false);
    if (audio.now - lastFeedback < 1.5) return;
    lastFeedback = audio.now;
    if (ev.type === 'wrong') {
      say(`Hmm, that sounded like ${ev.heard}. Check your fingers for ${steps[i].chord}! 👀`, 'try');
      $('#now').classList.remove('wiggle'); void $('#now').offsetWidth; $('#now').classList.add('wiggle');
    } else if (ev.type === 'quiet') {
      say(`Give it a strum! 🎸 Play ${steps[i].chord}.`);
    }
  }

  let timer = null;
  let wakeLock = null;
  function startLoop() {
    startedAt = audio.now;
    judge.reset(steps[0].chord, false, audio.now);
    $('#listen').style.display = 'none';
    say(`I'm listening! Play ${steps[0].chord} 👂`);
    navigator.wakeLock?.request('screen').then((l) => (wakeLock = l)).catch(() => {});
    timer = setInterval(() => {
      if (done) return;
      const buf = audio.read();
      const level = rms(buf.subarray(buf.length - 2048));
      $('#level').style.width = Math.min(100, Math.sqrt(level) * 400) + '%';
      if (audio.muted) return;
      const ranking = level > 0.001 ? classify(buf, audio.ctx.sampleRate) : null;
      handle(judge.push({ t: audio.now, rms: level, ranking }));
    }, 40);
  }
  cleanup = () => { clearInterval(timer); wakeLock?.release?.().catch(() => {}); };

  on('.back', 'click', back);
  on('#hear', 'click', () => audio.play(shapeMidi(shapeFor(steps[i].chord, easy))));
  on('#skip', 'click', () => { if (!done) advance(true); });
  on('#listen', 'click', async () => {
    try {
      await audio.start();
      startLoop();
    } catch (err) {
      say("I can't hear the microphone. Ask a grown-up to allow it (Settings › Safari › Microphone).", 'try');
    }
  });

  render();
  if (audio.running) startLoop();
  else say('Tap "Start listening" so I can hear you 🎤');
}

home();
