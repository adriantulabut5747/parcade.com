// All sound is synthesised here, so there are no audio files to load or license.
// Gunshots are built in layers: a sharp crack, a low thump for the body, and a short room tail.
let ac = null;
let master = null;
let noiseData = null;
let live = 0;
let muted = false;
try {
  muted = localStorage.getItem('parcade-muted') === '1';
} catch {}

const MAX_LIVE = 28;

export const isMuted = () => muted;

// The title screen's self-playing fight stays silent, so only the music plays there.
let quiet = false;
export const setQuiet = (on) => (quiet = on);

export function setMuted(on) {
  muted = on;
  try {
    localStorage.setItem('parcade-muted', on ? '1' : '0');
  } catch {}
}

// Browsers only allow sound after a tap or key press.
export function unlockAudio() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const squash = ac.createDynamicsCompressor();
    squash.threshold.value = -14;
    squash.ratio.value = 6;
    squash.attack.value = 0.002;
    squash.release.value = 0.12;
    master = ac.createGain();
    master.gain.value = 0.8;
    master.connect(squash).connect(ac.destination);
    // One second of noise, made once and reused, so a fast gun allocates nothing per shot.
    noiseData = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const out = noiseData.getChannelData(0);
    for (let i = 0; i < out.length; i++) out[i] = Math.random() * 2 - 1;
    startMusicBus();
  }
  if (ac.state === 'suspended') ac.resume();
  if (!musicTimer) musicTimer = setInterval(scheduleMusic, 50);
}

function track(node) {
  live++;
  node.onended = () => live--;
}

function tone(from, to, dur, type = 'square', vol = 0.05, delay = 0) {
  const o = ac.createOscillator();
  const v = ac.createGain();
  const t = ac.currentTime + delay;
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur);
  v.gain.setValueAtTime(vol, t);
  v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(v).connect(master);
  track(o);
  o.start(t);
  o.stop(t + dur);
}

function noise(dur, vol = 0.1, cutoff = 1800, delay = 0, kind = 'lowpass', q = 0.8) {
  const src = ac.createBufferSource();
  src.buffer = noiseData;
  const f = ac.createBiquadFilter();
  f.type = kind;
  f.frequency.value = cutoff;
  f.Q.value = q;
  const v = ac.createGain();
  const t = ac.currentTime + delay;
  v.gain.setValueAtTime(vol, t);
  v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(v).connect(master);
  track(src);
  src.start(t, Math.random() * 0.8, dur);
}

// A metal click, for slides and bolts.
const click = (delay, vol = 0.12) => (noise(0.018, vol, 3800, delay, 'bandpass', 3), tone(1900, 1200, 0.012, 'square', vol * 0.25, delay));

const SOUNDS = {
  // A classic game pistol: a hard snap on top, a short punch underneath, a quick room slap after.
  shot: () => {
    noise(0.04, 0.6, 3000, 0, 'bandpass', 0.7);
    tone(1500, 320, 0.028, 'square', 0.11);
    tone(230, 62, 0.1, 'triangle', 0.5);
    noise(0.16, 0.13, 1500);
    noise(0.08, 0.05, 1100, 0.07);
  },
  // Tighter and brighter than the pistol.
  rifle: () => {
    noise(0.028, 0.5, 4200, 0, 'bandpass', 0.8);
    tone(280, 95, 0.06, 'triangle', 0.34);
    noise(0.1, 0.1, 2200);
  },
  // Very short, so 15 shots a second reads as a rattle.
  minigun: () => {
    noise(0.018, 0.28, 5000, 0, 'bandpass', 1);
    tone(210, 110, 0.03, 'triangle', 0.17);
  },
  // Huge low boom, then the pump: back and forward.
  shotgun: () => {
    noise(0.05, 0.7, 2100, 0, 'bandpass', 0.6);
    tone(135, 36, 0.28, 'sine', 0.75);
    noise(0.42, 0.32, 1100);
    click(0.3);
    click(0.4);
  },
  // A long crack that rolls away across the arena, then the bolt working.
  snipe: () => {
    noise(0.05, 0.85, 2600, 0, 'bandpass', 0.6);
    tone(120, 30, 0.42, 'sine', 0.75);
    noise(0.7, 0.26, 800);
    noise(0.3, 0.12, 700, 0.2);
    click(0.5, 0.09);
    click(0.62, 0.09);
  },
  rocketFire: () => {
    noise(0.1, 1, 1200);
    tone(95, 280, 0.32, 'sawtooth', 0.3);
    noise(0.45, 0.7, 650);
  },
  flame: () => noise(0.09, 0.5, 950, 0, 'bandpass', 0.6),
  laser: () => {
    tone(2600, 190, 0.17, 'sawtooth', 0.24);
    tone(1300, 420, 0.22, 'sine', 0.3);
    noise(0.04, 0.12, 6000, 0, 'highpass');
  },
  hit: () => (tone(190, 70, 0.1, 'triangle', 0.45), noise(0.06, 0.3, 1400)),
  hitbig: () => (tone(150, 34, 0.32, 'sawtooth', 0.4), noise(0.26, 0.8, 1200)),
  equip: () => (click(0, 0.35), click(0.1, 0.35), tone(1250, 1500, 0.2, 'sine', 0.22, 0.19)),
  throw: () => (tone(170, 620, 0.25, 'sine', 0.3), noise(0.25, 0.2, 900)),
  snare: () => (tone(420, 110, 0.14, 'square', 0.22), noise(0.12, 0.35, 2200)),
  snap: () => noise(0.09, 0.4, 3600),
  fade: () => tone(400, 90, 0.5, 'sine', 0.22),
  teleport: () => (tone(110, 1300, 0.18, 'sawtooth', 0.2), tone(1400, 180, 0.2, 'sine', 0.3, 0.16)),
  ko: () => (tone(210, 36, 0.55, 'sawtooth', 0.3), noise(0.5, 0.6, 800)),
  fight: () => (tone(392, 392, 0.1, 'square', 0.2), tone(587, 587, 0.22, 'square', 0.2, 0.11)),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.2, 'square', 0.2, i * 0.13)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, f * 0.97, 0.26, 'triangle', 0.4, i * 0.17)),
  pick: () => tone(660, 990, 0.1, 'square', 0.2),
  browse: () => tone(520, 620, 0.05, 'square', 0.1),
  blast: () => (noise(0.05, 0.6, 2000, 0, 'bandpass', 0.6), tone(170, 28, 0.5, 'sine', 0.8), noise(0.5, 0.36, 900)),
  speed: () => (tone(300, 1500, 0.22, 'sawtooth', 0.2), noise(0.12, 0.2, 5000)),
  shrink: () => tone(900, 170, 0.2, 'triangle', 0.4),
  wave: () => (tone(70, 150, 0.5, 'sine', 0.5), noise(0.5, 0.4, 500)),
  blind: () => (tone(520, 80, 0.45, 'sine', 0.35), noise(0.2, 0.2, 800)),
  dash: () => (noise(0.2, 0.4, 5200), tone(500, 1100, 0.14, 'sine', 0.2)),
  smokebomb: () => (noise(0.3, 0.6, 700), tone(220, 70, 0.2, 'sine', 0.35)),
  block: () => tone(1100, 540, 0.14, 'triangle', 0.4),
  hop: () => tone(330, 520, 0.07, 'sine', 0.1),
  hop2: () => (tone(520, 980, 0.1, 'sine', 0.16), tone(780, 1400, 0.08, 'triangle', 0.08, 0.03)),
  bark: () => (tone(520, 240, 0.09, 'sawtooth', 0.3), tone(430, 210, 0.1, 'sawtooth', 0.28, 0.12)),
  rumble: () => (tone(90, 38, 0.35, 'sine', 0.6), noise(0.3, 0.35, 500)),
  pickup: () => [660, 880].forEach((f, i) => tone(f, f, 0.08, 'square', 0.2, i * 0.07)),
  rare: () => [660, 880, 1100, 1320].forEach((f, i) => tone(f, f, 0.1, 'square', 0.22, i * 0.07)),
};

// A gun firing 30 times a second mustn't stack into a roar, so each sound has a minimum gap.
const GAP = { flame: 0.085, minigun: 0.06 };
const lastPlayed = {};

export function play(name) {
  if (muted || quiet || !ac || ac.state !== 'running' || live > MAX_LIVE) return;
  const now = ac.currentTime;
  if (now - (lastPlayed[name] ?? -1) < (GAP[name] ?? 0.04)) return;
  lastPlayed[name] = now;
  SOUNDS[name]();
}


// ---------- Music: two original pieces for a Roman tournament, written out as notes and synthesised live ----------

let musicOn = true;
try {
  musicOn = localStorage.getItem('parcade-music') !== '0';
} catch {}
let musicTimer = 0;
let musicBus = null;
let songBus = null;
let song = 'menu';
let nextStep = 0;
let stepNo = 0;

export const isMusicOn = () => musicOn;

export function setMusicOn(on) {
  musicOn = on;
  try {
    localStorage.setItem('parcade-music', on ? '1' : '0');
  } catch {}
}

export function setSong(name) {
  if (name === song) return;
  song = name;
  stepNo = 0;
  fadeSong();
}

// Long notes would otherwise ring on after a song change or the music toggle.
function fadeSong() {
  if (!songBus) return;
  const old = songBus;
  songBus = null;
  old.gain.setTargetAtTime(0, ac.currentTime, 0.12);
  setTimeout(() => old.disconnect(), 1000);
}

// A big stone hall, for the music only. Bare sawtooth notes sound like beeps without it.
function stoneHall() {
  const len = Math.floor(ac.sampleRate * 1.4);
  const echo = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const out = echo.getChannelData(ch);
    let dark = 0;
    for (let i = 0; i < len; i++) {
      dark += (Math.random() * 2 - 1 - dark) * 0.35;
      out[i] = dark * (1 - i / len) ** 3;
    }
  }
  return echo;
}

function startMusicBus() {
  musicBus = ac.createGain();
  musicBus.gain.value = 0.75;
  musicBus.connect(master);
  const hall = ac.createConvolver();
  hall.buffer = stoneHall();
  const hallLevel = ac.createGain();
  hallLevel.gain.value = 0.32;
  musicBus.connect(hall).connect(hallLevel).connect(master);
}

// Chords in D minor, lowest note first, one per bar. MIDI note numbers.
const Dm = [50, 57, 62, 65];
const Bb = [46, 58, 62, 65];
const F = [53, 57, 60, 65];
const C = [48, 55, 60, 64];
const Gm = [55, 58, 62, 67];
const Eb = [51, 58, 63, 67];
const A = [45, 57, 61, 64];

const HARP = [0, 1, 2, 3, 2, 3, 1, 2];
const GALLOP = [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1];
const WAR_DRUM = [0, 3, 6, 8, 11, 14];
// The chord's root, down where the basses and drums live: A1 to G#2.
const low = (chord) => 33 + ((chord[0] - 33) % 12);

// Melodies are pairs: note, then length in sixteenths. A note of 0 is a rest. Each line is one bar.
export const SONGS = {
  // A slow procession into the arena: dotted trumpet calls over held strings, a harp and kettle drums.
  menu: {
    bpm: 72,
    brass: 0.036,
    chords: [Dm, Bb, F, C, Gm, Dm, Eb, A, F, C, Dm, Bb, Gm, A, Dm, A],
    melody: [
      62, 3, 62, 1, 69, 8, 67, 2, 65, 2,
      65, 6, 67, 2, 65, 4, 62, 4,
      60, 3, 60, 1, 65, 4, 69, 8,
      67, 8, 64, 4, 60, 4,
      62, 3, 62, 1, 67, 4, 70, 8,
      69, 6, 67, 2, 65, 4, 62, 4,
      67, 6, 70, 2, 67, 4, 63, 4,
      64, 12, 0, 4,
      69, 3, 69, 1, 72, 4, 77, 8,
      76, 6, 74, 2, 72, 4, 67, 4,
      69, 3, 69, 1, 74, 4, 77, 8,
      74, 6, 72, 2, 70, 4, 65, 4,
      67, 6, 69, 2, 70, 4, 74, 4,
      73, 6, 74, 2, 76, 8,
      74, 12, 0, 4,
      64, 3, 64, 1, 61, 4, 57, 8,
    ],
    backing(chord, s, when, step, bar) {
      const root = low(chord);
      if (s === 0) {
        for (const n of chord) musicNote(n, step * 16, when, { vol: 0.017, cut: 1500, attack: 0.5, release: 0.6 });
        musicNote(root + 12, step * 16, when, { vol: 0.05, cut: 600, attack: 0.2, release: 0.5 });
        boom(noteHz(root), 0.15, when);
        if (bar % 8 === 0) drumNoise('highpass', 5500, 0.95, 0.03, when);
      }
      if (s % 2 === 0) musicNote(chord[HARP[s / 2]] + 12, 0.01, when, { type: 'triangle', vol: 0.05, cut: 4000, attack: 0.004, release: 1.1 });
      if (s === 8) boom(noteHz(root), 0.09, when);
      if (bar % 2 === 1 && s >= 14) boom(noteHz(root), 0.05, when);
      if (s === 12 || s === 14) drumNoise('bandpass', 1900, 0.09, 0.03, when);
    },
  },
  // The battle: galloping low strings and war drums, trumpets on top, then a broad heroic middle and a call and answer.
  fight: {
    bpm: 132,
    brass: 0.04,
    chords: [Dm, Dm, Bb, C, Dm, Dm, Gm, A, F, C, Dm, Bb, Gm, Eb, A, A, Dm, Dm, Eb, Eb, Dm, C, A, A],
    melody: [
      74, 3, 74, 1, 74, 2, 69, 2, 74, 4, 77, 4,
      76, 3, 77, 1, 76, 2, 74, 2, 69, 8,
      70, 3, 70, 1, 70, 2, 65, 2, 70, 4, 74, 4,
      72, 3, 74, 1, 72, 2, 70, 2, 67, 8,
      77, 3, 77, 1, 77, 2, 76, 2, 74, 4, 81, 4,
      79, 3, 77, 1, 76, 2, 77, 2, 74, 8,
      70, 2, 74, 2, 79, 8, 77, 2, 76, 2,
      76, 4, 73, 4, 69, 8,
      69, 8, 72, 8,
      76, 12, 74, 2, 72, 2,
      74, 8, 77, 8,
      77, 12, 74, 4,
      79, 8, 77, 4, 74, 4,
      75, 8, 70, 8,
      73, 12, 76, 4,
      81, 12, 0, 4,
      62, 3, 62, 1, 65, 4, 69, 8,
      0, 16,
      63, 3, 63, 1, 67, 4, 70, 8,
      0, 16,
      62, 3, 62, 1, 65, 4, 69, 4, 74, 4,
      72, 3, 72, 1, 67, 4, 64, 8,
      64, 3, 64, 1, 69, 4, 73, 8,
      76, 3, 76, 1, 76, 2, 76, 2, 76, 8,
    ],
    backing(chord, s, when, step, bar) {
      const root = low(chord);
      if (s === 0) {
        for (const n of chord) musicNote(n, step * 16, when, { vol: 0.012, cut: 1600, attack: 0.15, release: 0.3 });
        musicNote(root, step * 16, when, { vol: 0.045, cut: 450, attack: 0.03, release: 0.2 });
        if (bar % 8 === 0) drumNoise('highpass', 5500, 0.95, 0.04, when);
      }
      if (GALLOP[s]) musicNote(root + (s >= 14 ? 19 : 12), step * 0.7, when, { vol: s % 4 === 0 ? 0.055 : 0.034, cut: 1100, attack: 0.005, release: 0.05 });
      if (WAR_DRUM.includes(s)) boom(noteHz(root), s % 8 === 0 ? 0.13 : 0.085, when);
      if (s === 4 || s === 12) drumNoise('bandpass', 1900, 0.12, 0.07, when);
      if (bar % 4 === 3 && s > 12) drumNoise('bandpass', 1900, 0.08, 0.05, when);
    },
  },
};

for (const tune of Object.values(SONGS)) {
  tune.notes = {};
  tune.steps = 0;
  for (let i = 0; i < tune.melody.length; i += 2) {
    if (tune.melody[i]) tune.notes[tune.steps] = [tune.melody[i], tune.melody[i + 1]];
    tune.steps += tune.melody[i + 1];
  }
}

const noteHz = (n) => 440 * 2 ** ((n - 69) / 12);

function musicNote(n, dur, when, { type = 'sawtooth', vol, cut, attack = 0.01, release = 0.1, detune = 0 }) {
  const o = ac.createOscillator();
  const f = ac.createBiquadFilter();
  const v = ac.createGain();
  const end = when + Math.max(dur, attack);
  o.type = type;
  o.frequency.value = noteHz(n);
  o.detune.value = detune;
  // The tone opens up as the note speaks, the way a bow or a breath does.
  f.frequency.setValueAtTime(cut * 0.45, when);
  f.frequency.exponentialRampToValueAtTime(cut, when + attack * 2);
  v.gain.setValueAtTime(0, when);
  v.gain.linearRampToValueAtTime(vol, when + attack);
  v.gain.setValueAtTime(vol, end);
  v.gain.exponentialRampToValueAtTime(0.0001, end + release);
  o.connect(f).connect(v).connect(songBus);
  o.start(when);
  o.stop(end + release + 0.02);
}

function trumpets(n, dur, when, vol) {
  for (const detune of [-7, 7]) musicNote(n, dur, when, { vol, cut: Math.min(noteHz(n) * 4, 5000), detune, attack: 0.04, release: 0.16 });
}

function drumNoise(type, hz, dur, vol, when) {
  const src = ac.createBufferSource();
  src.buffer = noiseData;
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = hz;
  const v = ac.createGain();
  v.gain.setValueAtTime(vol, when);
  v.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  src.connect(f).connect(v).connect(songBus);
  src.start(when, Math.random() * (1 - dur), dur);
}

function boom(hz, vol, when) {
  const o = ac.createOscillator();
  const v = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(hz * 1.7, when);
  o.frequency.exponentialRampToValueAtTime(hz, when + 0.06);
  v.gain.setValueAtTime(vol, when);
  v.gain.exponentialRampToValueAtTime(0.0001, when + 0.45);
  o.connect(v).connect(songBus);
  o.start(when);
  o.stop(when + 0.47);
  // Phone speakers can't play the low part, so the drum skin has to carry the hit there.
  drumNoise('bandpass', 420, 0.07, vol * 0.6, when);
}

// Looks a little ahead on a slow timer and books the notes, so a busy frame can't make the music stumble.
function scheduleMusic() {
  if (!ac || ac.state !== 'running' || muted || !musicOn || document.hidden) {
    nextStep = 0;
    fadeSong();
    return;
  }
  if (!songBus) {
    songBus = ac.createGain();
    songBus.connect(musicBus);
  }
  const tune = SONGS[song];
  const stepLen = 60 / tune.bpm / 4;
  if (nextStep < ac.currentTime) nextStep = ac.currentTime + 0.05;
  while (nextStep < ac.currentTime + 0.2) {
    const i = stepNo % tune.steps;
    const bar = Math.floor(i / 16);
    tune.backing(tune.chords[bar], i % 16, nextStep, stepLen, bar);
    const note = tune.notes[i];
    if (note) trumpets(note[0], note[1] * stepLen * 0.92, nextStep, tune.brass);
    stepNo++;
    nextStep += stepLen;
  }
}
