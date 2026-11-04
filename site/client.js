// Browser side of the game: send keys, predict your own moves right away, then correct
// them against the server. Other players are drawn slightly in the past so they move smoothly.
import * as Art from '/art.js';
import { isMusicOn, isMuted, play, setMusicOn, setMuted, setQuiet, setSong, unlockAudio } from '/audio.js';
import * as Fx from '/fx.js';
import { drawHero, setSpriteScale, stampHero } from '/heroes.js';
import { BLIND_STEPS, BULWARK, DASH_CD, DECOY_STEPS, DID, DUSK, GUNS, GUN_SHIFT, HANDLER, HERO_COUNT, ILLUSIONIST, KEY, LIVES, MAPS, MOSSBACK, NINJA, PICK_STEPS, PISTOL, PLATFORMS, SHADE, SHIFTER, SKILL_CD, SNIPER, SNIPER_GUN, SPRINTER, STEPS_PER_SEC, W, addPlayer, movePlayer, newGame, padKeys, snapshotOf, startRound, step, stickKeys, useMap } from '/sim.js';

const SERVER = location.port === '8766' ? `ws://${location.hostname}:8787` : 'wss://parcade.adriantulabut5747.workers.dev';
const STEP_MS = 1000 / STEPS_PER_SEC;
const VIEW_DELAY_MS = 100;
const ARENA_H = 540;
// The whole arena is always on screen, with at least this much world across. Wider screens just see more forge.
const MIN_VIEW_W = 1100;
const COLORS = ['#ff5a4d', '#4da3ff', '#5ad16a', '#ffc94d'];
const KEYS = {
  KeyA: KEY.LEFT,
  ArrowLeft: KEY.LEFT,
  KeyD: KEY.RIGHT,
  ArrowRight: KEY.RIGHT,
  KeyW: KEY.JUMP,
  ArrowUp: KEY.JUMP,
  Space: KEY.JUMP,
  KeyS: KEY.DOWN,
  ArrowDown: KEY.DOWN,
  KeyJ: KEY.SHOOT,
  KeyX: KEY.SHOOT,
  KeyK: KEY.DASH,
  KeyC: KEY.DASH,
  KeyL: KEY.SKILL,
  KeyV: KEY.SKILL,
};

// Icons and text are in hero order: Sniper, Trapper, Ninja, Sprinter, Shifter, Santa, Dusk, Bulwark, Illusionist, Poacher, Angler, Handler, Mossback, Rime, Tether, Shade.
const svg = (inner) => `<svg viewBox="0 0 48 48" aria-hidden="true">${inner}</svg>`;
const ICONS = [
  svg('<circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" stroke-width="5"/><path d="M24 3v13M24 32v13M3 24h13M32 24h13" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="24" r="3.5" fill="currentColor"/>'),
  svg('<path d="M24 4 44 24 24 44 4 24ZM14 14 34 34M34 14 14 34" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/><circle cx="24" cy="4.5" r="3.5" fill="currentColor"/><circle cx="4.5" cy="24" r="3.5" fill="currentColor"/><circle cx="43.5" cy="24" r="3.5" fill="currentColor"/><circle cx="24" cy="43.5" r="3.5" fill="currentColor"/>'),
  svg('<path d="M24 3 29 19 45 24 29 29 24 45 19 29 3 24 19 19Z" fill="currentColor"/><circle cx="24" cy="24" r="4.5" fill="#160a2a"/>'),
  svg('<path d="M28 3 9 27h13l-4 18 21-27H25Z" fill="currentColor"/>'),
  svg('<path d="M15 6h18l-9 11ZM15 42h18l-9-11Z" fill="currentColor"/><circle cx="24" cy="24" r="5" fill="currentColor"/>'),
  svg('<path d="M7 19h34v24H7ZM21 19h6v24h-6ZM5 13h38v7H5Z" fill="currentColor"/><path d="M24 13C17 3 9 4 11 10c1 3 8 3 13 3 5 0 12 0 13-3 2-6-6-7-13 3Z" fill="none" stroke="currentColor" stroke-width="3.5"/>'),
  svg('<path d="M36 5A20 20 0 1 0 43 34 16 16 0 0 1 36 5Z" fill="currentColor"/>'),
  svg('<path d="M7 7h34v18L24 44 7 25Z" fill="currentColor"/>'),
  svg('<circle cx="24" cy="15" r="9" fill="currentColor"/><path d="M12 44c0-13 5-17 12-17s12 4 12 17Z" fill="currentColor"/><circle cx="7" cy="23" r="5" fill="currentColor" opacity=".55"/><path d="M0 44c0-9 2-13 7-13 3 0 5 1 6 3-2 3-3 6-3 10Z" fill="currentColor" opacity=".55"/><circle cx="41" cy="23" r="5" fill="currentColor" opacity=".55"/><path d="M48 44c0-9-2-13-7-13-3 0-5 1-6 3 2 3 3 6 3 10Z" fill="currentColor" opacity=".55"/>'),
  svg('<path d="M4 34h40v7H4ZM6 34V14l6 9 6-11 6 11 6-11 6 11 6-9v20Z" fill="currentColor"/>'),
  svg('<path d="M28 3v21a10 10 0 1 1-18-6" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M4 26 10 12l8 11Z" fill="currentColor"/><circle cx="28" cy="6" r="4.5" fill="currentColor"/>'),
  svg('<ellipse cx="24" cy="31" rx="11" ry="9" fill="currentColor"/><circle cx="9" cy="23" r="5" fill="currentColor"/><circle cx="19" cy="13" r="5.5" fill="currentColor"/><circle cx="31" cy="13" r="5.5" fill="currentColor"/><circle cx="40" cy="23" r="5" fill="currentColor"/>'),
  svg('<path d="M4 44V27h13V13h14v14h13v17ZM4 21h10v3H4ZM34 21h10v3H34ZM19 8h10v3H19Z" fill="currentColor"/>'),
  svg('<path d="M24 3v42M5 13.5l38 21M43 13.5l-38 21M24 12l-6-6M24 12l6-6M24 36l-6 6M24 36l6 6" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>'),
  svg('<ellipse cx="24" cy="27" rx="7" ry="9" fill="currentColor"/><circle cx="24" cy="14" r="5" fill="currentColor"/><path d="M18 21 9 12 4 15M17 26H7l-4 5M18 32l-8 7-1 6M30 21l9-9 5 3M31 26h10l4 5M30 32l8 7 1 6" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'),
  svg('<path d="M4 25c6-9 13-13 20-13s14 4 20 13c-6 8-13 12-20 12S10 33 4 25Z" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/><circle cx="24" cy="25" r="6" fill="currentColor"/><path d="M8 43 40 7" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>'),
];
const DASH_ICON = svg('<path d="M4 17h24a6 6 0 1 0-6-6M4 26h34a6 6 0 1 1-6 6M4 35h16a5 5 0 1 1-5 5" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>');
const HEROES = [
  { name: 'Sniper', skill: 'Long Shot', cd: '25 s cooldown', text: 'Equip a rifle with 5 heavy bullets. Each one shoves enemies twice as far and kicks you back hard. You fade almost out of sight for up to 13 seconds while you hold it.' },
  { name: 'Trapper', skill: 'Snare Net', cd: '15 s cooldown', text: 'Throw a long-range net. The first enemy it catches can’t run or jump for 1 second, but can still be pushed.' },
  { name: 'Ninja', skill: 'Smoke Step', cd: '20 s after the log is gone', text: 'Leave a log in a puff of smoke, then press again within 7 seconds to swap back to it. That breaks a net and arms you with 3 big shurikens that are easy to land and hit hard.' },
  { name: 'Sprinter', skill: 'Overdrive', cd: '25 s cooldown', text: 'Run half as fast again for 6 seconds and draw an arc gun with 5 shots that hits harder than your pistol and reaches right across the map.' },
  { name: 'Shifter', skill: 'Shrink', cd: '20 s cooldown', text: 'Shrink and run a little faster for 5 seconds. Bullets fired from your own floor fly right over your head.' },
  { name: 'Santa', skill: 'Gift Bomb', cd: '15 s cooldown', text: 'Toss a gift just in front of you. After 1.1 seconds it bursts with a huge sideways shove on every enemy in a wide circle.' },
  { name: 'Dusk', skill: 'Ink Tide', cd: '25 s cooldown', text: 'Send a tall wave of ink across the arena. Enemies it touches are slowed and can barely see for 3 seconds. Landing it turns you into a fast shadow for 3 seconds.' },
  { name: 'Bulwark', skill: 'Iron Guard', cd: '20 s cooldown', text: 'Raise your shield for 4 seconds. Bullets, blasts, nets and hooks all stop, and anyone who touches you gets shoved away.' },
  { name: 'Illusionist', skill: 'Double Trouble', cd: '20 s cooldown', text: 'Summon 2 copies of yourself that run around and fire weak shots for 5 seconds. One hit from anything and a copy vanishes.' },
  { name: 'Poacher', skill: 'Bear Trap', cd: '15 s cooldown', text: 'Toss a wide trap onto a platform. The first enemy near it is held still for 0.8 seconds, then slowed for 1 more. Up to 3 stay out, each for 70 seconds.' },
  { name: 'Angler', skill: 'Reel In', cd: '20 s cooldown', text: 'Cast a fast hook right across the map. It drags the first enemy to just behind you and stuns them for 0.8 seconds. Deadly at a ledge.' },
  { name: 'Handler', skill: 'Good Dog', cd: '25 s cooldown', text: 'Send your dog at the nearest enemy for 15 seconds. It shoves them every 1.5 seconds, and 5 shots bring it down.' },
  { name: 'Mossback', skill: 'Earth Wall', cd: '15 s cooldown', text: 'Raise a wall of earth for 10 seconds. It stops players and bullets, you can stand on it, and it takes 10 shots. Blasts still go through.' },
  { name: 'Rime', skill: 'Whiteout', cd: '25 s cooldown', text: 'Send a slow blizzard rolling forward for 4 seconds. Anyone it reaches is thrown back and slowed to a crawl, again and again, while you keep fighting.' },
  { name: 'Tether', skill: 'Zip Line', cd: '20 s cooldown', text: 'Shoot a web at the nearest enemy, wherever they are, and zip straight to them. They are webbed and slowed for 1 second when you land.' },
  { name: 'Shade', skill: 'Vanish', cd: '25 s cooldown', text: 'Drop a smoke cloud and turn invisible for 6 seconds. Firing shows you again, but that one shot hits as hard as a sniper bullet.' },
];
const MAP_CARDS = [null, 0, 1, 2];
const MAP_BLURB = ['Lava under a black iron forge', 'A huge forest and a poison swamp', 'A golden temple and quicksand'];
const gunFor = (hero) => (hero === SNIPER ? SNIPER_GUN : PISTOL);

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d', { alpha: false });
const params = new URLSearchParams(location.search);
// ?lag=120 adds 120 ms each way, to try bad connections without leaving this PC.
const lag = Math.min(Number(params.get('lag')) || 0, 1000);
const delayed = (fn) => (lag ? setTimeout(fn, lag) : fn());
const isTouch = matchMedia('(pointer: coarse)').matches;
const upright = matchMedia('(pointer: coarse) and (orientation: portrait)');

const room = (params.get('room') || '').toUpperCase();
const hasRoom = /^[A-Z2-9]{5}$/.test(room);

const held = new Set();
const lastThrow = new Map();
const wasNetted = new Map();
const tileArt = [];
const detailArt = $('detail-art').getContext('2d');
const view = { l: 0, t: 0, w: W, h: ARENA_H };
let keys = 0;
let touchKeys = 0;
let ws = null;
let myId = null;
let me = null;
let myPrev = null;
let errX = 0;
let errY = 0;
let seq = 0;
let pending = [];
let snaps = [];
let clockOffset = null;
let ping = null;
let flash = 0;
let flashGun = PISTOL;
let stepClock = 0;
let lastTime = performance.now();
let inputChanged = false;
let scale = 1;
let quality = 0;
let qualityFloor = 0;
let arena = null;
let changingHero = false;
let lastPk = null;
let lastOver = 0;
let fxQueue = [];
let screen = '';
let plateSig = '';
let skillSig = '';
let dashSig = '';
let pickSig = '';
let buffSig = '';
let bannerTimer = 0;
let browsing = 0;
let browsed = false;
let sentAtClock = false;
let tilesDirty = true;
let drewOverlay = 0;
let lastFrame = 0;
let slowSum = 0;
let slowFrames = 0;
let slowStrikes = 0;
let currentMap = 0;
let pickTab = 'heroes';
let thumbsDrawn = false;
let resultsSig = '';
const lastKo = new Map();
let attract = null;
let attractAt = 0;

function say(text, ...extras) {
  $('status').replaceChildren(text, ...extras);
  $('status').hidden = !text;
}

function button(label, onClick, className = 'key key-small') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = className;
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function randomRoom() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(5)), (n) => letters[n % letters.length]).join('');
}

async function copyInvite(e) {
  const b = e.currentTarget;
  const old = b.textContent;
  try {
    await navigator.clipboard.writeText(location.href);
    b.textContent = 'Copied';
  } catch {
    b.textContent = 'Copy failed: use the address bar';
  }
  setTimeout(() => (b.textContent = old), 2000);
}

function connect() {
  say('Connecting...');
  ws = new WebSocket(`${SERVER}/room/${room}`);
  ws.addEventListener('message', (e) => delayed(() => onMessage(JSON.parse(e.data))));
  ws.addEventListener('close', (e) => {
    const why = { 4000: 'This room is full (4 players).', 4001: 'Disconnected: too many messages.', 4002: 'Disconnected for being idle.' };
    say(
      why[e.code] || 'Connection lost.',
      button('Reconnect', () => location.reload()),
    );
    me = null;
    setScreen('lost');
  });
}

function onMessage(m) {
  if (m.t === 'hi') {
    myId = m.id;
    tilesDirty = true;
    say('');
  } else if (m.t === 's') {
    onSnapshot(m);
  }
}

// Everything that depends on the map changes together. Baking costs a moment, so it happens only when the map really changes.
function syncMap(map) {
  if (map === currentMap) return;
  currentMap = map;
  useMap(map);
  Art.setArtMap(map);
  Fx.setFxMap(map);
  arena = Art.bakeArena(view, quality, map);
}

function nameOf(id) {
  return id === myId ? 'YOU' : `P${id + 1}`;
}

function addFeed(f, s) {
  const row = document.createElement('div');
  row.className = 'feed-row';
  const who = (id) => {
    const tag = document.createElement('b');
    tag.textContent = nameOf(id);
    tag.style.color = COLORS[id];
    return tag;
  };
  if (f.by === null) row.append(who(f.id), ' fell');
  else row.append(who(f.by), ' knocked out ', who(f.id));
  $('feed').prepend(row);
  while ($('feed').children.length > 4) $('feed').lastChild.remove();
  setTimeout(() => row.remove(), 4000);

  const victim = s.p.find((p) => p.id === f.id);
  const now = performance.now();
  if (f.by !== null) {
    if (now - (lastKo.get(f.by) ?? -1e9) < 5000) showBanner(`${nameOf(f.by)} DOUBLE KO`, 'call');
    lastKo.set(f.by, now);
  }
  if (victim?.lives === 1) showBanner(f.id === myId ? 'LAST LIFE' : `${nameOf(f.id)} LAST LIFE`, 'call');
}

function showResults(s) {
  const iWon = s.w === myId;
  $('results-title').textContent = s.w === null ? 'Draw' : iWon ? 'You win' : `P${s.w + 1} wins`;
  const order = [...s.p].filter((p) => p.hero !== null).sort((a, b) => (b.id === s.w) - (a.id === s.w) || b.kos - a.kos || a.falls - b.falls);
  $('results-cards').replaceChildren(
    ...order.map((p) => {
      const card = document.createElement('div');
      card.className = `result-card box${p.id === s.w ? ' winner' : ''}`;
      const face = document.createElement('canvas');
      face.width = face.height = 120;
      face.style.setProperty('--team', COLORS[p.id]);
      portrait(face.getContext('2d'), p.hero, COLORS[p.id], 0, gunFor(p.hero));
      const name = document.createElement('p');
      name.className = 'result-name';
      name.textContent = `${nameOf(p.id)} · ${HEROES[p.hero].name}`;
      const stats = document.createElement('div');
      stats.className = 'result-stats';
      for (const [label, value] of [
        ['KOs', p.kos],
        ['Hits', p.hits],
        ['Falls', p.falls],
      ]) {
        const cell = document.createElement('span');
        cell.className = 'well';
        cell.append(Object.assign(document.createElement('b'), { textContent: value }), label);
        stats.append(cell);
      }
      card.append(face, name, stats);
      if (p.wins) card.append(Object.assign(document.createElement('p'), { className: 'result-wins', textContent: `★ ${p.wins} ${p.wins === 1 ? 'round' : 'rounds'} won` }));
      return card;
    }),
  );
  $('results').hidden = false;
  resultsSig = '';
}

function onSnapshot(s) {
  syncMap(s.m);
  snaps.push(s);
  if (snaps.length > 12) snaps.shift();
  const now = performance.now();
  const sample = now - s.k * STEP_MS;
  clockOffset = clockOffset === null ? sample : clockOffset + (sample - clockOffset) * 0.05;

  const acked = pending.find((i) => i.s === s.a);
  if (acked) ping = now - acked.sent;
  pending = pending.filter((i) => i.s > s.a);

  // Other players are shown a little in the past, so their effects wait for them.
  for (const f of s.x) {
    // Your own jumps were already shown the moment you pressed.
    if (f.id === myId && (f.k === 'jump' || f.k === 'jump2' || f.k === 'land')) continue;
    fxQueue.push({ f, at: f.id === myId ? now : now + VIEW_DELAY_MS });
    if (f.k === 'ko' && s.p.length > 1) addFeed(f, s);
  }

  if (lastPk > 0 && s.pk === 0) {
    Fx.clearEffects();
    showBanner('FIGHT!', 'fight');
    play('fight');
    sentAtClock = false;
  }
  lastPk = s.pk;
  if (s.o > 0 && lastOver === 0) {
    hideBanner();
    showResults(s);
    play(s.w === myId ? 'win' : 'lose');
  } else if (s.o === 0 && lastOver > 0) {
    $('results').hidden = true;
  }
  lastOver = s.o;
  if (s.o > 0) {
    const left = Math.ceil(s.o / STEPS_PER_SEC);
    if (left !== resultsSig) {
      resultsSig = left;
      $('results-next').textContent = `Next round in ${left}`;
    }
  }

  const server = s.p.find((p) => p.id === myId);
  if (!server) return;
  const old = me;
  me = { ...server };
  if (!s.o && !s.pk && me.lives > 0 && me.hero !== null) for (const i of pending) movePlayer(me, i.b, s.wl);
  // Hide small corrections by easing into them; a respawn should just jump.
  if (old) {
    const dx = old.x - me.x;
    const dy = old.y - me.y;
    if (Math.hypot(dx, dy) < 150) {
      errX += dx;
      errY += dy;
    } else {
      errX = errY = 0;
      myPrev = null;
    }
  }
  // Touching the page 10 times a second is plenty; every frame is what makes phones stutter.
  if (s.k % 3 === 0) updateHud(s);
}

function predictStep() {
  if (!ws || ws.readyState !== WebSocket.OPEN || myId === null) return;
  seq++;
  const msg = JSON.stringify({ s: seq, b: keys });
  delayed(() => ws.readyState === WebSocket.OPEN && ws.send(msg));
  pending.push({ s: seq, b: keys, sent: performance.now() });
  // shortcut: a stalled connection stops growing this at 2 s of inputs; a longer stall just snaps back on the next snapshot.
  if (pending.length > STEPS_PER_SEC * 2) pending.shift();

  const last = snaps[snaps.length - 1];
  if (me && last && !last.o && !last.pk && me.lives > 0 && me.hero !== null) {
    myPrev = { x: me.x, y: me.y };
    const did = movePlayer(me, keys, last.wl);
    if (did & DID.SHOT) {
      flashGun = did >> GUN_SHIFT;
      flash = GUNS[flashGun].cool > 12 ? 5 : 3;
    }
    if (did & DID.JUMP) Fx.trigger({ k: 'jump', x: me.x, y: me.y - 18, f: me.f });
    if (did & DID.JUMP2) Fx.trigger({ k: 'jump2', x: me.x, y: me.y - 18, f: me.f });
    if (did & DID.LAND) Fx.trigger({ k: 'land', x: me.x, y: me.y - 18, f: me.f });
    // A teleport or a respawn is a jump, not movement.
    if (Math.abs(me.x - myPrev.x) > 60 || Math.abs(me.y - myPrev.y) > 60) myPrev = null;
  }
}

function runSteps() {
  const now = performance.now();
  stepClock += now - lastTime;
  lastTime = now;
  // A new press doesn't wait for the next regular step, so it shows on the very next frame.
  if (inputChanged && stepClock > STEP_MS * 0.4) stepClock = STEP_MS;
  inputChanged = false;
  let steps = 0;
  while (stepClock >= STEP_MS && steps < 5) {
    predictStep();
    stepClock -= STEP_MS;
    steps++;
  }
  // Waking from a throttled background tab shouldn't replay the whole gap.
  if (stepClock >= STEP_MS) stepClock = 0;
}

function sendHero(h) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  unlockAudio();
  play('pick');
  changingHero = false;
  document.activeElement?.blur?.();
  const msg = JSON.stringify({ h });
  delayed(() => ws.readyState === WebSocket.OPEN && ws.send(msg));
}

// ---------- Drawing the arena ----------

// The two snapshots either side of the moment we're showing, and how far between them it is.
function viewAt(renderTick) {
  for (let i = snaps.length - 1; i > 0; i--) {
    if (snaps[i - 1].k <= renderTick) {
      const a = snaps[i - 1];
      const b = snaps[i];
      return { a, b, mix: Math.min(1, (renderTick - a.k) / (b.k - a.k)) };
    }
  }
  return { a: snaps[0], b: snaps[0], mix: 0 };
}

function between(from, to, mix) {
  // A big jump is a respawn, not movement, so don't slide across the arena.
  return Math.abs(from - to) > 150 ? to : from + (to - from) * mix;
}

const heroLook = {};

// Whether a hero's skill is on show right now, which changes their picture slightly.
function skillShowing(p, snap) {
  if (p.hero === NINJA) return p.st > 0;
  if (p.hero === SNIPER) return p.sc > 0 && p.gun === SNIPER_GUN;
  if (p.hero === DUSK) return p.gh > 0;
  if (p.hero === SPRINTER) return p.sp > 0;
  if (p.hero === SHIFTER) return p.sm > 0;
  if (p.hero === BULWARK) return p.gd > 0;
  if (p.hero === SHADE) return p.iv > 0;
  if (p.hero === ILLUSIONIST) return snap.cl.some((c) => c.o === p.id);
  if (p.hero === HANDLER) return snap.dg.some((d) => d.o === p.id);
  if (p.hero === MOSSBACK) return snap.wl.some((w) => w.o === p.id);
  return p.sk > 0;
}

function heroFrame(p, x, y, now, snap) {
  const isMe = p.id === myId;
  Fx.noteHero(p.id, x, y, p.f);
  const thrown = lastThrow.get(p.id);
  if (p.sp > 0) Fx.speedTrail(x, y, p.vx, '#ffd92e');
  if (p.gh > 0) Fx.speedTrail(x, y, p.vx, '#7fe0ff');
  // One reused object: this runs for every hero on every frame.
  const o = heroLook;
  o.hero = p.hero;
  o.color = COLORS[p.id];
  o.x = x;
  o.y = y;
  o.f = p.f;
  o.vx = p.vx;
  o.ground = p.g;
  o.t = now + p.id * 300;
  o.gun = p.gun;
  o.netted = p.n > 0 || p.jw > 0;
  o.skin = skillShowing(p, snap);
  o.blind = p.bl > 0;
  o.small = p.sm > 0;
  o.giant = p.gi > 0;
  o.shield = p.sh;
  o.guard = p.gd > 0;
  o.boots = p.rb > 0;
  o.heavy = p.hv > 0;
  o.golden = p.gb > 0;
  // Only you can see yourself while you're invisible.
  o.alpha = p.iv > 0 ? 0.42 : p.i > 0 && Math.floor(now / 80) % 2 ? 0.4 : o.skin && p.hero === SNIPER ? 0.4 : o.skin && p.hero === DUSK ? 0.6 : 1;
  o.flash = isMe ? flash : 0;
  o.flashGun = flashGun;
  o.throwing = thrown ? Math.max(0, 1 - (now - thrown) / 260) : 0;
  o.label = isMe ? 'YOU' : `P${p.id + 1}`;
  o.isMe = isMe;
  stampHero(ctx, o);
  if (p.n > 0) Fx.drawSnare(ctx, x, y, p.n, now);
  if (p.tr > 0) Fx.drawClamp(ctx, x, y);
  if (p.fz > 0) Fx.drawFrost(ctx, x, y);
  if (p.hk > 0) Fx.drawStun(ctx, x, y, now);
  if (wasNetted.get(p.id) && !p.n) Fx.snapNet(x, y);
  wasNetted.set(p.id, p.n > 0);
  markOffscreen(p, x, y);
}

const cloneLook = { blind: false, netted: false, small: false, giant: false, shield: 0, guard: false, boots: false, heavy: false, golden: false, flash: 0, flashGun: PISTOL, throwing: 0 };

// To enemies a clone is the real thing, name tag and all. Its owner sees it faded, to keep track of who's who.
function cloneFrame(c, x, y, now) {
  const mine = c.o === myId;
  const o = cloneLook;
  o.hero = c.h;
  // Copies lose the hat too, or the real one would be obvious.
  o.skin = c.h === ILLUSIONIST;
  o.color = COLORS[c.o];
  o.x = x;
  o.y = y;
  o.f = c.f;
  o.vx = c.vx;
  o.ground = c.g;
  o.t = now + c.id * 137;
  o.gun = c.gun;
  o.alpha = mine ? 0.55 : 1;
  o.label = mine ? '' : `P${c.o + 1}`;
  o.isMe = false;
  stampHero(ctx, o);
}

// Someone flung past the top or the sides still has an arrow on the screen's edge.
function markOffscreen(p, x, y) {
  const left = view.l + 16;
  const right = view.l + view.w - 16;
  const top = view.t + 14;
  if (x > left - 12 && x < right + 12 && y > top) return;
  const ax = Math.max(left, Math.min(right, x));
  const ay = y < top ? top : Math.min(y - 20, 480);
  const a = x < left - 12 ? Math.PI : x > right + 12 ? 0 : -Math.PI / 2;
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(13, 0);
  ctx.lineTo(-8, -10);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.fillStyle = COLORS[p.id];
  ctx.fill();
  ctx.strokeStyle = '#060708';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
}

function ownPosition(t) {
  const x = me.x;
  const y = me.y;
  if (!myPrev) return [x + errX, y + errY];
  // Drawn at where you're heading, not one step behind, so a press shows at once.
  const dx = x - myPrev.x;
  const dy = y - myPrev.y;
  return [x + dx * t + errX, (dy < 0 ? y + dy * t : myPrev.y + dy * t) + errY];
}

function drawMatch(now) {
  const { a, b, mix } = viewAt((now - clockOffset - VIEW_DELAY_MS) / STEP_MS);
  errX *= 0.8;
  errY *= 0.8;
  if (Math.abs(errX) < 0.05) errX = 0;
  if (Math.abs(errY) < 0.05) errY = 0;
  if (flash > 0) flash--;

  if (fxQueue.length) {
    const clock = performance.now();
    let kept = 0;
    for (let i = 0; i < fxQueue.length; i++) {
      const q = fxQueue[i];
      if (q.at > clock) {
        fxQueue[kept++] = q;
        continue;
      }
      if (q.f.k === 'throw' || q.f.k === 'lob' || q.f.k === 'cast') lastThrow.set(q.f.id, now);
      Fx.trigger(q.f);
    }
    fxQueue.length = kept;
  }
  if (b.pk) return;

  for (const c of b.c) Fx.drawCrate(ctx, c, now);
  for (const w of b.wl) Fx.drawWall(ctx, w, w.x, w.y, now);
  for (const nb of b.tp) {
    const na = a.tp.find((old) => old.id === nb.id) || nb;
    Fx.drawTrap(ctx, nb, between(na.x, nb.x, mix), between(na.y, nb.y, mix), nb.o === myId, now);
  }
  for (const p of b.p) {
    const q = p.id === myId && me ? me : p;
    if (q.hero === NINJA && q.st > 0) Fx.drawDecoy(ctx, { x: q.sx, y: q.sy, st: q.st, color: COLORS[q.id] }, now);
  }
  for (const nb of b.u) {
    const na = a.u.find((old) => old.id === nb.id);
    Fx.drawBullet(ctx, nb, na ? between(na.x, nb.x, mix) : nb.x);
  }
  for (const nb of b.n) {
    const na = a.n.find((old) => old.id === nb.id) || nb;
    Fx.drawNet(ctx, nb, between(na.x, nb.x, mix), between(na.y, nb.y, mix), Fx.positionOf(nb.o), now);
  }
  for (const nb of b.gr) {
    const na = a.gr.find((old) => old.id === nb.id) || nb;
    Fx.drawGift(ctx, nb, between(na.x, nb.x, mix), between(na.y, nb.y, mix), now);
  }
  for (const nb of b.dg) {
    const na = a.dg.find((old) => old.id === nb.id) || nb;
    Fx.drawDog(ctx, nb, between(na.x, nb.x, mix), between(na.y, nb.y, mix), now);
  }
  for (const nb of b.cl) {
    const na = a.cl.find((old) => old.id === nb.id) || nb;
    cloneFrame(nb, between(na.x, nb.x, mix), between(na.y, nb.y, mix), now);
  }
  for (const pb of b.p) {
    if (pb.id === myId || pb.lives <= 0 || pb.hero === null || pb.iv > 0) continue;
    const pa = a.p.find((old) => old.id === pb.id) || pb;
    heroFrame(pb, between(pa.x, pb.x, mix), between(pa.y, pb.y, mix), now, b);
  }
  if (me && me.lives > 0 && me.hero !== null) {
    const [x, y] = ownPosition(Math.min(1, stepClock / STEP_MS));
    heroFrame(me, x, y, now, b);
  }
  for (const nb of b.hk) {
    const na = a.hk.find((old) => old.id === nb.id) || nb;
    Fx.drawHook(ctx, nb, between(na.x, nb.x, mix), between(na.y, nb.y, mix), Fx.positionOf(nb.o));
  }
  for (const z of b.zs) {
    const from = Fx.positionOf(z.o);
    const to = z.cl >= 0 ? b.cl.find((c) => c.id === z.cl) : Fx.positionOf(z.c);
    if (from && to) Fx.drawZip(ctx, from, to);
  }
  for (const nb of b.sm) {
    const na = a.sm.find((old) => old.id === nb.id) || nb;
    Fx.drawStorm(ctx, nb, between(na.x, nb.x, mix), nb.y, now);
  }
  for (const nb of b.v) {
    const na = a.v.find((old) => old.id === nb.id);
    Fx.drawWave(ctx, nb, na ? between(na.x, nb.x, mix) : nb.x, now);
  }
  for (const r of b.r) Fx.drawRock(ctx, r);
  Fx.drawEffects(ctx, now);
}

function drawWorld(now) {
  const [sx, sy] = Fx.takeShake();
  const q = quality;
  ctx.setTransform(q, 0, 0, q, (sx - view.l) * q, (sy - view.t) * q);
  if (arena) ctx.drawImage(arena, view.l - Art.SHAKE_ROOM, view.t - Art.SHAKE_ROOM, view.w + Art.SHAKE_ROOM * 2, view.h + Art.SHAKE_ROOM * 2);
  Art.drawLavaBack(ctx, view, now);
  if (snaps.length) drawMatch(now);
  Art.drawLavaFront(ctx, view, now);
  // Blindness comes last, so nothing shows through it. Only the blinded player's screen is dark.
  if (me && me.bl > 0 && me.lives > 0 && screen === 'play') {
    const at = Fx.positionOf(myId);
    if (at) Fx.drawBlindness(ctx, at.x, at.y, me.bl, BLIND_STEPS);
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  // A 120 Hz phone doesn't need twice the work: 60 frames a second is the target everywhere.
  if (now - lastFrame < 14) return;
  const gap = now - lastFrame;
  lastFrame = now;
  if (hasRoom) runSteps();
  else runAttract(now);
  updateScreen();
  if (upright.matches) return;
  if (screen === 'play') {
    drawWorld(now);
    watchSpeed(gap);
    return;
  }
  // Menus cover the arena, so it only needs to tick over slowly behind them. The title screen's fight is on show, so a PC draws it more often.
  if (now - drewOverlay < (screen === 'home' && !isTouch ? 30 : 66)) return;
  drewOverlay = now;
  drawWorld(now);
  drawPortraits(now);
  const last = snaps[snaps.length - 1];
  if (screen === 'pick' && last) updatePick(last);
}

// If this device can't keep up, draw fewer pixels rather than drop frames. It only ever steps down, so it can't flicker.
function watchSpeed(gap) {
  if (gap > 200) return;
  slowSum += gap;
  if (++slowFrames < 60) return;
  const average = slowSum / slowFrames;
  slowSum = slowFrames = 0;
  slowStrikes = average > 20 ? slowStrikes + 1 : 0;
  if (slowStrikes >= 2 && quality > qualityFloor) {
    slowStrikes = 0;
    applyQuality(Math.max(qualityFloor, quality * 0.8));
  }
}

function applyQuality(q) {
  quality = q;
  canvas.width = Math.round(view.w * q);
  canvas.height = Math.round(view.h * q);
  setSpriteScale(Math.min(2, Math.max(1, q)));
  arena = Art.bakeArena(view, q, currentMap);
}

// ---------- The title screen: 4 bots really play, in the page, with the real rules ----------

function newAttract() {
  attract = newGame();
  for (let id = 0; id < 4; id++) addPlayer(attract, id).hero = Math.floor(Math.random() * HERO_COUNT);
  startRound(attract);
  for (const p of attract.players) Object.assign(p, { botKeys: 0, botWait: 0 });
  snaps = [];
  clockOffset = null;
  syncMap(attract.map);
}

function botKeys(id) {
  const p = attract.players.find((o) => o.id === id);
  if (--p.botWait > 0) return p.botWait % 3 ? p.botKeys : p.botKeys & ~KEY.JUMP;
  p.botWait = 6 + Math.floor(Math.random() * 14);
  const foes = attract.players.filter((o) => o.id !== id && o.lives > 0);
  const foe = foes[Math.floor(Math.random() * foes.length)];
  let k = 0;
  const floor = PLATFORMS.some((pl) => pl.y >= p.y - 2 && p.x > pl.x - 4 && p.x < pl.x + pl.w + 4);
  if (!floor) {
    // Over the hazard: head for the middle and jump.
    k |= (p.x < W / 2 ? KEY.RIGHT : KEY.LEFT) | KEY.JUMP;
    if (p.dc === 0) k |= KEY.DASH;
  } else if (foe) {
    if (Math.random() < 0.7) k |= foe.x > p.x ? KEY.RIGHT : KEY.LEFT;
    if (foe.y < p.y - 20 && Math.random() < 0.6) k |= KEY.JUMP;
    if (foe.y > p.y + 30 && Math.random() < 0.5) k |= KEY.DOWN;
    if (Math.abs(foe.y - p.y) < 40) k |= KEY.SHOOT;
    if (Math.random() < 0.08) k |= KEY.SKILL;
  }
  p.botKeys = k;
  return k;
}

function runAttract(now) {
  if (!attract) {
    setQuiet(true);
    Fx.setNoShake(true);
    newAttract();
    attractAt = now;
  }
  let steps = 0;
  while (now - attractAt >= STEP_MS && steps < 3) {
    attractAt += STEP_MS;
    step(attract, botKeys);
    steps++;
  }
  if (now - attractAt > 1000) attractAt = now;
  if (!steps) return;
  // The same copy of the world a real room would send.
  const s = JSON.parse(JSON.stringify(snapshotOf(attract)));
  attract.fx = [];
  snaps.push(s);
  if (snaps.length > 12) snaps.shift();
  const sample = now - s.k * STEP_MS;
  clockOffset = clockOffset === null ? sample : clockOffset + (sample - clockOffset) * 0.05;
  for (const f of s.x) fxQueue.push({ f, at: now + VIEW_DELAY_MS });
  if (attract.over > 0) newAttract();
}

function fit() {
  const cssW = innerWidth;
  const cssH = innerHeight;
  if (!cssW || !cssH) return;
  scale = Math.min(cssW / MIN_VIEW_W, cssH / ARENA_H);
  view.w = cssW / scale;
  view.h = cssH / scale;
  view.l = (W - view.w) / 2;
  // The floor stays at the bottom of the screen; any extra height is open air above.
  view.t = ARENA_H - view.h;
  Fx.setFxView(view);
  const dpr = devicePixelRatio || 1;
  // Phones have very dense screens, and drawing every one of those pixels is the biggest single cost in the game.
  const best = Math.min(isTouch ? 1 : 2, dpr * scale);
  qualityFloor = isTouch ? Math.min(best, 0.7) : Math.min(best, 1);
  applyQuality(quality && quality < best ? Math.max(quality, qualityFloor) : best);
  tilesDirty = true;
}

// ---------- Screens and interface ----------

function setScreen(name) {
  if (screen === name) return;
  screen = name;
  document.body.dataset.screen = name;
  setSong(name === 'play' ? 'fight' : 'menu');
  pickSig = '';
  releaseControls();
  if (name === 'pick') {
    browsed = false;
    tilesDirty = true;
    browse(me?.hero ?? browsing, false);
  }
  if (name === 'home') tilesDirty = true;
}

function updateScreen() {
  if (!hasRoom) return setScreen('home');
  if (screen === 'lost') return;
  const last = snaps[snaps.length - 1];
  if (!last || !me) return setScreen('wait');
  setScreen(last.pk > 0 || me.hero === null || changingHero ? 'pick' : 'play');
}

function showBanner(text, kind, stay = false) {
  const b = $('banner');
  b.textContent = text;
  b.className = '';
  b.hidden = false;
  void b.offsetWidth;
  b.className = `show ${kind}`;
  clearTimeout(bannerTimer);
  if (!stay) bannerTimer = setTimeout(hideBanner, 1100);
}

function hideBanner() {
  $('banner').hidden = true;
}

function fitCanvas(c) {
  const r = c.getBoundingClientRect();
  const dpr = Math.min(2, devicePixelRatio || 1);
  const w = Math.round(r.width * dpr);
  const h = Math.round(r.height * dpr);
  if (w && h && (c.width !== w || c.height !== h)) {
    c.width = w;
    c.height = h;
  }
}

function portrait(g, hero, color, t, gun = PISTOL) {
  const c = g.canvas;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, c.width, c.height);
  // Room for the tallest hero: Dusk's hat.
  const size = Math.min(c.width, c.height * 1.05) / 80;
  // A long gun sticks out in front, so its owner stands a little further back to stay centred.
  const x = c.width / 2 - size * (gun === SNIPER_GUN ? 14 : 2);
  // Stood in the middle of a tall frame rather than at its very bottom.
  const y = Math.min(c.height * 0.95, c.height / 2 + size * 34);
  drawHero(g, { hero, color, x, y, f: 1, vx: 0, ground: true, t, scale: size, preview: true, gun });
}

// Only the big picture of the hero you're reading about moves; the rest are drawn once.
function drawPortraits(now) {
  const color = COLORS[myId ?? 0];
  if (tilesDirty) {
    tilesDirty = false;
    for (const { g, hero } of tileArt) {
      if (!g.canvas.offsetParent) continue;
      fitCanvas(g.canvas);
      portrait(g, hero, color, 0, gunFor(hero));
    }
  }
  if (screen === 'pick' && detailArt.canvas.offsetParent) {
    fitCanvas(detailArt.canvas);
    portrait(detailArt, browsing, color, now, gunFor(browsing));
  }
}

// Browsing shows a hero's details; locking in is a separate press, so you can read them all first.
function browse(h, byHand = true) {
  browsing = h;
  if (byHand) {
    browsed = true;
    unlockAudio();
    play('browse');
  }
  for (const tile of $('roster').children) tile.classList.toggle('browsing', Number(tile.dataset.h) === h);
  const hero = HEROES[h];
  $('detail').className = `box tone-${hero.name.toLowerCase()}`;
  $('detail-name').textContent = hero.name;
  $('detail-skill').innerHTML = `<span class="card-icon">${ICONS[h]}</span>${hero.skill}`;
  $('detail-text').textContent = hero.text;
  $('detail-cd').textContent = hero.cd;
  pickSig = '';
}

function updatePick(last) {
  // Whatever you were looking at when the clock runs out is your pick.
  if (browsed && !sentAtClock && last.pk > 0 && last.pk <= 10 && me && !me.ready) {
    sentAtClock = true;
    sendHero(browsing);
  }
  const clockSecs = Math.ceil(last.pk / STEPS_PER_SEC);
  $('pick-clock').style.setProperty('--left', last.pk / PICK_STEPS);
  const signature = `${clockSecs}${last.p.map((p) => `${p.id}:${p.hero}:${p.ready}`).join()}${changingHero}${browsing}|${last.ch}|${last.h}|${myId}`;
  if (signature === pickSig) return;
  pickSig = signature;
  updateMapTab(last);
  const lockedOn = !changingHero && me?.ready ? me.hero : null;
  for (const tile of $('roster').children) {
    const h = Number(tile.dataset.h);
    tile.classList.toggle('picked', lockedOn === h);
    tile.querySelector('.chips').replaceChildren(
      ...last.p
        .filter((p) => p.ready && p.hero === h)
        .map((p) => {
          const chip = document.createElement('span');
          chip.className = 'chip';
          chip.style.background = COLORS[p.id];
          chip.textContent = p.id === myId ? 'YOU' : `P${p.id + 1}`;
          return chip;
        }),
    );
  }
  $('lock').textContent = lockedOn === browsing ? 'Locked in' : lockedOn === null ? `Lock in ${HEROES[browsing].name}` : `Switch to ${HEROES[browsing].name}`;
  const waiting = last.p.filter((p) => !p.ready).map((p) => (p.id === myId ? 'you' : `P${p.id + 1}`));
  const alone = last.p.length < 2;
  $('pick-note').textContent = alone
    ? 'You’re alone in this room. Pick a hero to practise, or invite someone first.'
    : !last.pk
      ? 'A round is on. Pick a hero to jump in.'
      : waiting.length
        ? `Waiting for ${waiting.join(', ')}. The round starts when the clock runs out.`
        : 'Everyone’s ready.';
  $('pick-clock').hidden = alone || !last.pk;
  $('pick-clock').textContent = clockSecs;
  $('pick-room').textContent = `Room ${room}`;
}

function updateMapTab(last) {
  const isHost = last.h === myId;
  const choice = last.ch === null ? 'Random' : MAPS[last.ch].name;
  $('tab-map').textContent = `Map: ${choice}`;
  for (const card of $('map-cards').children) {
    const map = card.dataset.map === '' ? null : Number(card.dataset.map);
    card.classList.toggle('picked', map === last.ch);
    card.disabled = !isHost;
  }
  $('map-note').textContent = isHost ? 'You are the host. Random picks a new map every round.' : `Only the host (${last.h === null ? 'nobody yet' : nameOf(last.h)}) can change the map.`;
}

function setPickTab(tab) {
  pickTab = tab;
  $('pick').dataset.tab = tab;
  for (const [id, name] of [
    ['tab-heroes', 'heroes'],
    ['tab-map', 'map'],
  ]) {
    $(id).classList.toggle('on', name === tab);
    $(id).setAttribute('aria-selected', String(name === tab));
  }
  if (tab === 'map' && !thumbsDrawn) {
    thumbsDrawn = true;
    for (const c of document.querySelectorAll('[data-thumb]')) Art.drawMapThumb(c, Number(c.dataset.thumb));
  }
}

function sendMap(map) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  unlockAudio();
  play('pick');
  const msg = JSON.stringify({ mp: map });
  delayed(() => ws.readyState === WebSocket.OPEN && ws.send(msg));
}

function buildMapCards() {
  for (const map of MAP_CARDS) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'map-card';
    card.dataset.map = map ?? '';
    const name = map === null ? 'Random' : MAPS[map].name;
    const blurb = map === null ? 'A new map every round' : MAP_BLURB[map];
    card.innerHTML = `<span class="map-art">${map === null ? '<span class="map-any">?</span>' : `<canvas data-thumb="${map}"></canvas>`}</span><span class="map-name">${name}</span><span class="map-blurb">${blurb}</span>`;
    card.addEventListener('click', () => sendMap(map));
    $('map-cards').append(card);
  }
  $('tab-heroes').addEventListener('click', () => setPickTab('heroes'));
  $('tab-map').addEventListener('click', () => setPickTab('map'));
  setPickTab('heroes');
}

function buildCards() {
  for (const [i, h] of HEROES.entries()) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = `tile tone-${h.name.toLowerCase()}`;
    tile.dataset.h = i;
    tile.setAttribute('aria-label', `${h.name}: ${h.skill}`);
    // Number keys reach the first 10 heroes, with 0 as the 10th.
    tile.innerHTML = `<span class="tile-art"><canvas></canvas><span class="chips"></span></span><span class="tile-name">${h.name}</span>${i < 10 ? `<kbd>${(i + 1) % 10}</kbd>` : ''}`;
    tile.addEventListener('click', () => browse(i));
    $('roster').append(tile);
    tileArt.push({ g: tile.querySelector('canvas').getContext('2d'), hero: i });
  }
  buildMapCards();
  $('lock').addEventListener('click', () => {
    if (isTouch) goFullscreen();
    sendHero(browsing);
  });
  browse(0, false);
}

function updateHud(last) {
  const signature = last.p.map((p) => `${p.id}:${p.hero}:${p.lives}:${p.wins}`).join() + myId;
  if (signature !== plateSig) {
    plateSig = signature;
    $('plates').replaceChildren(
      ...last.p.map((p) => {
        const mine = p.id === myId;
        const plate = document.createElement('div');
        plate.className = `plate${mine ? ' mine' : ''}`;
        plate.style.setProperty('--team', COLORS[p.id]);
        plate.setAttribute('aria-label', `${mine ? 'You' : `Player ${p.id + 1}`}, ${p.hero === null ? 'choosing' : HEROES[p.hero].name}, ${p.lives} lives, ${p.wins} wins`);
        const face = document.createElement('canvas');
        face.width = face.height = 72;
        if (p.hero !== null) portrait(face.getContext('2d'), p.hero, COLORS[p.id], 0);
        const name = document.createElement('span');
        name.className = 'plate-name';
        name.textContent = mine ? 'YOU' : `P${p.id + 1}`;
        if (p.wins) name.append(Object.assign(document.createElement('span'), { className: 'wins', textContent: `★${p.wins}` }));
        const lives = document.createElement('span');
        lives.className = 'lives';
        for (let i = 0; i < Math.max(LIVES, p.lives); i++) lives.append(Object.assign(document.createElement('i'), { className: i < p.lives ? 'on' : '' }));
        const words = document.createElement('span');
        words.className = 'plate-words';
        words.append(name, lives);
        plate.append(face, words);
        return plate;
      }),
    );
  }
  $('change-hero').hidden = last.p.length > 1;
  const pingText = ping === null ? '' : `${Math.round(ping / 10) * 10} ms${lag ? ` (+${lag} each way)` : ''}`;
  if ($('ping').textContent !== pingText && last.k % 30 === 0) $('ping').textContent = pingText;
  if (me) {
    updateSkill(me);
    updateDash(me);
    updateBuffs(me);
  }
}

function updateBuffs(p) {
  const secs = (n) => Math.ceil(n / STEPS_PER_SEC);
  const chips = [];
  if (p.iv > 0) chips.push(['good', `Hidden ${secs(p.iv)}s`]);
  if (p.gun !== PISTOL) chips.push(['gun', `${GUNS[p.gun].name} ${p.ammo}`]);
  if (p.gd > 0) chips.push(['good', `Guard ${secs(p.gd)}s`]);
  if (p.sh > 0) chips.push(['good', `Shield ${p.sh}`]);
  if (p.sp > 0) chips.push(['good', `Speed ${secs(p.sp)}s`]);
  if (p.sm > 0) chips.push(['good', `Small ${secs(p.sm)}s`]);
  if (p.gh > 0) chips.push(['good', `Shadow ${secs(p.gh)}s`]);
  if (p.hv > 0) chips.push(['good', `Heavy boots ${secs(p.hv)}s`]);
  if (p.rb > 0) chips.push(['good', `Rocket boots ${secs(p.rb)}s`]);
  if (p.gb > 0) chips.push(['good', `Golden ${secs(p.gb)}s`]);
  if (p.gi > 0) chips.push(['good', `Giant ${secs(p.gi)}s`]);
  if (p.lg > 0) chips.push(['good', `Low gravity ${secs(p.lg)}s`]);
  if (p.bl > 0) chips.push(['bad', `Blinded ${secs(p.bl)}s`]);
  if (p.jw > 0) chips.push(['bad', `Held ${secs(p.jw)}s`]);
  if (p.tr > 0) chips.push(['bad', `Slowed ${secs(p.tr)}s`]);
  if (p.fz > 0) chips.push(['bad', `Frozen ${secs(p.fz)}s`]);
  const signature = chips.join();
  if (signature === buffSig) return;
  buffSig = signature;
  $('buffs').replaceChildren(
    ...chips.map(([kind, label]) => {
      const chip = document.createElement('span');
      chip.className = `buff ${kind}`;
      chip.textContent = label;
      return chip;
    }),
  );
}

function updateSkill(p) {
  if (p.hero === null) return;
  const armed = p.hero === NINJA && p.st > 0;
  const cooling = p.cd > 0;
  const btn = $('skill');
  if (armed || cooling) btn.style.setProperty('--left', (armed ? p.st / DECOY_STEPS : p.cd / SKILL_CD[p.hero]).toFixed(3));
  const seconds = Math.ceil((armed ? p.st : p.cd) / STEPS_PER_SEC);
  const signature = [p.hero, armed, cooling, seconds].join();
  if (signature === skillSig) return;
  skillSig = signature;
  if (p.hero !== Number(btn.dataset.hero)) {
    btn.dataset.hero = p.hero;
    btn.className = `tone-${HEROES[p.hero].name.toLowerCase()}`;
    $('skill-icon').innerHTML = ICONS[p.hero];
  }
  btn.classList.toggle('armed', armed);
  btn.classList.toggle('cooling', cooling);
  btn.classList.toggle('ready', !armed && !cooling);
  $('skill-num').textContent = cooling ? seconds : '';
  const name = armed ? `Swap back ${seconds}` : HEROES[p.hero].skill;
  $('skill-name').textContent = name;
  btn.setAttribute('aria-label', cooling ? `${name}, ready in ${seconds} seconds` : `${name}, ready`);
}

function updateDash(p) {
  const btn = $('dash');
  const cooling = p.dc > 0;
  if (cooling) btn.style.setProperty('--left', (p.dc / DASH_CD).toFixed(3));
  const seconds = Math.ceil(p.dc / STEPS_PER_SEC);
  if (seconds === dashSig) return;
  dashSig = seconds;
  btn.classList.toggle('cooling', cooling);
  $('dash-num').textContent = cooling ? seconds : '';
  btn.setAttribute('aria-label', cooling ? `Dash, ready in ${seconds} seconds` : 'Dash, ready');
}

// ---------- Input ----------

function updateKeys() {
  const next = [...held].reduce((all, code) => all | KEYS[code], touchKeys);
  if (next !== keys) inputChanged = true;
  keys = next;
}

function setMenu(open) {
  $('menu').hidden = !open;
  $('menu-open').setAttribute('aria-expanded', String(open));
}

addEventListener('keydown', (e) => {
  unlockAudio();
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Escape' && hasRoom) return setMenu($('menu').hidden);
  if (screen === 'pick') {
    if (/^Digit\d$/.test(e.code)) return browse((Number(e.code[5]) + 9) % 10);
    if (e.code === 'Enter' && e.target.tagName !== 'BUTTON') return sendHero(browsing);
  }
  // Space on a focused button should press the button, not jump.
  if (!(e.code in KEYS) || (e.code === 'Space' && e.target.tagName === 'BUTTON')) return;
  e.preventDefault();
  held.add(e.code);
  updateKeys();
});
addEventListener('keyup', (e) => {
  held.delete(e.code);
  updateKeys();
});
addEventListener('pointerdown', unlockAudio, { passive: true });

// Phone controls: the joystick or the 4-way pad bottom left, hold to fire and tap the skill bottom right.
const MOVE_KEYS = KEY.LEFT | KEY.RIGHT | KEY.JUMP | KEY.DOWN;
const pads = [];

// square = the pad's arrows: every point of its box counts, so a tap on the edge of an arrow is never lost.
function bindPad(el, toKeys, onMove, square) {
  let box = null;
  const pad = {
    pointer: null,
    release() {
      pad.pointer = null;
      onMove(0, 0, 0);
      touchKeys &= ~MOVE_KEYS;
      updateKeys();
    },
  };
  const move = (e) => {
    const radius = box.width / 2;
    let dx = (e.clientX - box.left - radius) / radius;
    let dy = (e.clientY - box.top - radius) / radius;
    if (!square) {
      const far = Math.hypot(dx, dy);
      if (far > 1) {
        dx /= far;
        dy /= far;
      }
    }
    const bits = toKeys(dx, dy);
    onMove(dx, dy, bits);
    const next = (touchKeys & ~MOVE_KEYS) | bits;
    if (next !== touchKeys) {
      touchKeys = next;
      updateKeys();
    }
  };
  el.addEventListener('pointerdown', (e) => {
    if (pad.pointer !== null) return;
    e.preventDefault();
    pad.pointer = e.pointerId;
    box = el.getBoundingClientRect();
    el.setPointerCapture(e.pointerId);
    move(e);
  });
  el.addEventListener('pointermove', (e) => e.pointerId === pad.pointer && move(e));
  // A control that disappears mid-press loses its pointer, and must not stay held.
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    el.addEventListener(type, (e) => e.pointerId === pad.pointer && pad.release());
  }
  pads.push(pad);
}

const knob = $('knob');
bindPad($('stick'), stickKeys, (dx, dy) => {
  knob.style.transform = dx || dy ? `translate3d(${dx * 40}px, ${dy * 40}px, 0)` : '';
});
const arrows = [...$('pad').querySelectorAll('[data-key]')];
let litArrows = 0;
bindPad(
  $('pad'),
  padKeys,
  (dx, dy, bits) => {
    if (bits === litArrows) return;
    litArrows = bits;
    for (const arrow of arrows) arrow.classList.toggle('on', !!(bits & KEY[arrow.dataset.key]));
  },
  true,
);

function holdButton(el, bit) {
  const set = (on) => {
    el.classList.toggle('on', on);
    touchKeys = on ? touchKeys | bit : touchKeys & ~bit;
    updateKeys();
  };
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    set(true);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(type, () => set(false));
  return set;
}
const setShoot = holdButton($('shoot'), KEY.SHOOT);
const setSkill = holdButton($('skill'), KEY.SKILL);
const setDash = holdButton($('dash'), KEY.DASH);
$('dash-icon').innerHTML = DASH_ICON;

function releaseControls() {
  held.clear();
  for (const pad of pads) pad.release();
  setShoot(false);
  setSkill(false);
  setDash(false);
}

// A long press must not open the phone's menu mid-fight, nor two taps zoom the page.
addEventListener('contextmenu', (e) => isTouch && e.preventDefault());
addEventListener('gesturestart', (e) => e.preventDefault());
addEventListener('dblclick', (e) => e.preventDefault());
// Alt-tabbing away must not leave a key stuck down.
addEventListener('blur', releaseControls);

let controls = 'stick';
try {
  controls = localStorage.getItem('parcade-controls') || 'stick';
} catch {}

function syncControls() {
  document.body.dataset.controls = controls;
  for (const b of document.querySelectorAll('.controls-toggle')) b.textContent = `Controls: ${controls === 'stick' ? 'Joystick' : '4 arrows'}`;
}
for (const b of document.querySelectorAll('.controls-toggle')) {
  b.addEventListener('click', () => {
    controls = controls === 'stick' ? 'arrows' : 'stick';
    try {
      localStorage.setItem('parcade-controls', controls);
    } catch {}
    releaseControls();
    syncControls();
  });
}
syncControls();

// ---------- Fullscreen ----------

const root = document.documentElement;
const canFullscreen = !!(root.requestFullscreen || root.webkitRequestFullscreen);
const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

function goFullscreen() {
  if (!canFullscreen || isFull()) return;
  const asked = root.requestFullscreen ? root.requestFullscreen({ navigationUI: 'hide' }) : root.webkitRequestFullscreen();
  // Phones that allow it also lock to landscape. Those that don't still get the turn-your-phone screen.
  Promise.resolve(asked)
    .then(() => screen.orientation?.lock?.('landscape'))
    .catch(() => {});
}

function toggleFullscreen() {
  if (!isFull()) return goFullscreen();
  (document.exitFullscreen || document.webkitExitFullscreen).call(document);
}

function syncFullscreen() {
  for (const b of document.querySelectorAll('.fullscreen-toggle')) {
    b.hidden = !canFullscreen;
    if (b.classList.contains('fullscreen-word')) b.textContent = isFull() ? 'Exit fullscreen' : b.closest('#rotate') ? 'Play fullscreen' : 'Fullscreen';
  }
}
for (const b of document.querySelectorAll('.fullscreen-toggle')) b.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', syncFullscreen);
document.addEventListener('webkitfullscreenchange', syncFullscreen);
syncFullscreen();

// ---------- Start ----------

// Only redraw the background once a resize has settled: rotating a phone fires several in a row.
let fitTimer = 0;
addEventListener('resize', () => {
  clearTimeout(fitTimer);
  fitTimer = setTimeout(fit, 80);
});
fit();
setFxArtQuality();

function setFxArtQuality() {
  const q = isTouch ? 'low' : 'high';
  Art.setArtQuality(q);
  Fx.setFxQuality(q);
}

buildCards();

function syncMute() {
  $('mute').textContent = isMuted() ? 'Sound: off' : 'Sound: on';
  $('mute').setAttribute('aria-pressed', String(isMuted()));
  $('music').textContent = isMusicOn() ? 'Music: on' : 'Music: off';
  $('music').setAttribute('aria-pressed', String(!isMusicOn()));
}
$('mute').addEventListener('click', () => {
  setMuted(!isMuted());
  syncMute();
});
$('music').addEventListener('click', () => {
  setMusicOn(!isMusicOn());
  syncMute();
});
syncMute();
$('menu-open').addEventListener('click', () => setMenu(true));
$('menu-close').addEventListener('click', () => setMenu(false));
$('change-hero').addEventListener('click', () => {
  changingHero = true;
  setMenu(false);
});
for (const b of document.querySelectorAll('.copy-link')) b.addEventListener('click', copyInvite);
$('room-code').textContent = room;

$('create').addEventListener('click', () => {
  params.set('room', randomRoom());
  location.search = params.toString();
});
$('join').addEventListener('submit', (e) => {
  e.preventDefault();
  const code = $('join-code').value.trim().toUpperCase();
  if (/^[A-Z2-9]{5}$/.test(code)) {
    params.set('room', code);
    location.search = params.toString();
  } else {
    $('join-error').textContent = 'Room codes are 5 letters or numbers.';
  }
});

if (hasRoom) connect();

// Frames drive the game; this only keeps a hidden tab connected, since browsers stop frames there.
setInterval(() => {
  if (document.hidden) runSteps();
}, 100);
requestAnimationFrame(frame);

globalThis.__arena = { me: () => me, latest: () => snaps[snaps.length - 1], ping: () => ping, setKeys: (k) => (keys = k), pick: sendHero, map: sendMap, screen: () => screen, view: () => ({ ...view, quality, scale }) };
