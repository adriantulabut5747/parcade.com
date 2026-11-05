// Game rules. One file on purpose: the room server runs them for real and the browser
// runs the same movePlayer to predict your own moves, so the two can't disagree.
// All speeds are pixels per step; one step = 1/30 s.

export const STEPS_PER_SEC = 30;
const secs = (n) => n * STEPS_PER_SEC;
export const W = 960;
export const H = 540;
export const MAX_PLAYERS = 4;
export const LIVES = 3;
export const PW = 24;
export const PH = 36;
export const KEY = { LEFT: 1, RIGHT: 2, JUMP: 4, DOWN: 8, SHOOT: 16, SKILL: 32, DASH: 64 };
export const ALL_KEYS = 127;

export const SNIPER = 0;
export const TRAPPER = 1;
export const NINJA = 2;
export const SPRINTER = 3;
export const SHIFTER = 4;
export const SANTA = 5;
export const DUSK = 6;
export const BULWARK = 7;
export const ILLUSIONIST = 8;
export const POACHER = 9;
export const ANGLER = 10;
export const HANDLER = 11;
export const MOSSBACK = 12;
export const RIME = 13;
export const TETHER = 14;
export const SHADE = 15;
export const HERO_COUNT = 16;
export const SKILL_CD = [25, 15, 20, 25, 20, 15, 25, 20, 20, 15, 20, 25, 15, 25, 20, 25].map(secs);
export const NET_STEPS = secs(1);
export const DECOY_STEPS = secs(7);
export const SPEED_STEPS = secs(6);
export const SHRINK_STEPS = secs(5);
export const BLIND_STEPS = secs(3);
export const DASH_CD = secs(7);
export const GUARD_STEPS = secs(4);
export const CLONE_STEPS = secs(5);
// Held still for the first 0.8 s, then slowed for 1 s more.
export const TRAP_HOLD = secs(0.8);
export const TRAP_STEPS = secs(1.8);
export const TRAP_LIFE = secs(70);
export const TRAP_MAX = 3;
export const HOOK_STUN = secs(0.8);
export const VANISH_STEPS = secs(6);
export const DOG_STEPS = secs(15);
export const DOG_HP = 5;
export const WALL_STEPS = secs(10);
export const WALL_HP = 10;
export const WALL_W = 30;
export const WALL_H = 76;
export const PICK_STEPS = secs(20);
export const SCOPE_STEPS = secs(13);
export const GHOST_STEPS = secs(3);
export const FREEZE_STEPS = secs(1.5);
// How long a skill with nothing else to time it shows on its hero's picture.
const SKIN_STEPS = secs(3);

// Guns. Ammo 0 means unlimited, so only the pistol has it. When a gun runs dry you're back on the pistol.
// dmg = how much of a "shot" one bullet is against a wall or dog (default 1), so the flamethrower's 30 bullets a second can't melt them.
// hit = how far past the body a bullet still connects, for the ones made to be easy to land.
export const PISTOL = 0;
export const SNIPER_GUN = 1;
export const RIFLE = 2;
export const SHOTGUN = 3;
export const ROCKET = 4;
export const MINIGUN = 5;
export const FLAME = 6;
export const LASER = 7;
export const ARC = 8;
export const SHURIKEN = 9;
export const GUNS = [
  { name: 'Pistol', cool: 8, recoil: 1.5, speed: 18, life: 40, knock: 21, ammo: 0 },
  { name: 'Sniper', cool: 18, recoil: 8, speed: 45, life: 24, knock: 34, ammo: 5 },
  { name: 'Rifle', cool: 5, recoil: 1.2, speed: 24, life: 36, knock: 16, ammo: 30 },
  { name: 'Shotgun', cool: 16, recoil: 6, speed: 20, life: 11, knock: 14, ammo: 10, pellets: [-3, -1.5, 0, 1.5, 3], dmg: 0.4 },
  { name: 'Rocket launcher', cool: 24, recoil: 5, speed: 14, life: 60, knock: 40, ammo: 3 },
  { name: 'Minigun', cool: 2, recoil: 0.9, speed: 22, life: 30, knock: 7.5, ammo: 40, dmg: 0.5 },
  { name: 'Flamethrower', cool: 1, recoil: 0.15, speed: 9, life: 14, knock: 5, ammo: 150, dmg: 0.1 },
  { name: 'Laser', cool: 20, recoil: 4, speed: 0, life: 0, knock: 30, ammo: 6, beam: true },
  { name: 'Arc gun', cool: 14, recoil: 2, speed: 0, life: 0, knock: 25, ammo: 5, beam: true },
  { name: 'Shuriken', cool: 10, recoil: 1, speed: 20, life: 34, knock: 28, ammo: 3, hit: 26 },
];

// What falls from the sky. Bigger weight = more common.
export const ITEMS = [
  { id: 'rifle', name: 'Rifle', w: 10, gun: RIFLE },
  { id: 'shotgun', name: 'Shotgun', w: 10, gun: SHOTGUN },
  { id: 'rocket', name: 'Rocket launcher', w: 6, gun: ROCKET },
  { id: 'minigun', name: 'Minigun', w: 7, gun: MINIGUN },
  { id: 'flame', name: 'Flamethrower', w: 7, gun: FLAME },
  { id: 'laser', name: 'Laser', w: 6, gun: LASER },
  { id: 'cd3', name: 'Cooldown -3 s', w: 10, cut: secs(3) },
  { id: 'cd5', name: 'Cooldown -5 s', w: 7, cut: secs(5) },
  { id: 'cd10', name: 'Cooldown -10 s', w: 4, cut: secs(10) },
  { id: 'refresh', name: 'Skill refreshed', w: 2, rare: true },
  { id: 'shield', name: 'Shield', w: 8 },
  { id: 'heavy', name: 'Heavy boots', w: 6 },
  { id: 'life', name: 'Extra life', w: 1.5, rare: true },
  { id: 'boots', name: 'Rocket boots', w: 7 },
  { id: 'golden', name: 'Golden bullets', w: 6 },
  { id: 'giant', name: 'Giant', w: 5 },
  { id: 'lowg', name: 'Low gravity', w: 5 },
  { id: 'meteor', name: 'Meteor shower', w: 1.5, rare: true, endgame: true },
];
const SHIELD_HITS = 2;
const SHIELD_STEPS = secs(10);
const HEAVY_STEPS = secs(10);
const BOOTS_STEPS = secs(15);
const GOLDEN_STEPS = secs(10);
const GIANT_STEPS = secs(8);
const LOWG_STEPS = secs(8);
const METEOR_STEPS = secs(6);
// Meteors stay an endgame surprise: a long round, with someone down to their last life.
const ENDGAME_AFTER = secs(60);

const FIRST_DROP = secs(8);
export const DROP_MIN = secs(15);
const DROP_SPREAD = secs(6);
const MAX_CRATES = 2;
const CRATE_FALL = 1.4;
const CRATE_STAY = secs(8);

// What movePlayer did this step, as bits, so the server can spawn things and announce them.
// The gun that fired sits above GUN_SHIFT.
export const DID = { SHOT: 1, EQUIP: 2, NET: 4, DECOY: 8, TELEPORT: 16, FADE: 32, SPEED: 64, SHRINK: 128, GIFT: 256, WAVE: 512, DASH: 1024, GUARD: 2048, CLONES: 4096, TRAP: 8192, HOOK: 16384, DOG: 32768, WALL: 65536, STORM: 1 << 17, ZIP: 1 << 18, VANISH: 1 << 19, JUMP: 1 << 20, JUMP2: 1 << 21, LAND: 1 << 22 };
export const GUN_SHIFT = 24;

// Joystick position (-1 to 1 each way) to keys. Jump and drop need a firmer push, so running doesn't trigger them.
export function stickKeys(dx, dy) {
  return (dx < -0.3 ? KEY.LEFT : 0) | (dx > 0.3 ? KEY.RIGHT : 0) | (dy < -0.6 ? KEY.JUMP : 0) | (dy > 0.7 ? KEY.DOWN : 0);
}

// The 4-way pad: a thumb between two arrows presses both, so a running jump needs only one thumb.
export function padKeys(dx, dy) {
  const across = Math.abs(dx);
  const along = Math.abs(dy);
  let keys = 0;
  if (across > 0.18 && across >= along * 0.75) keys |= dx < 0 ? KEY.LEFT : KEY.RIGHT;
  if (along > 0.18 && along >= across * 0.75) keys |= dy < 0 ? KEY.JUMP : KEY.DOWN;
  return keys;
}

// One-way platforms: you land on top and jump up through them.
// The maps. Rows sit 70-75 apart, so one jump (about 88 high) always reaches the row above.
export const MAPS = [
  {
    name: 'The Forge',
    spawn: [240, 720, 420, 540],
    platforms: [
      { x: 270, y: 410, w: 420 },
      { x: 40, y: 270, w: 120 },
      { x: 800, y: 270, w: 120 },
      { x: 400, y: 270, w: 160 },
      { x: 150, y: 340, w: 120 },
      { x: 690, y: 340, w: 120 },
      { x: 190, y: 200, w: 120 },
      { x: 650, y: 200, w: 120 },
      { x: 410, y: 130, w: 140 },
    ],
  },
  {
    name: 'Greenwood',
    spawn: [170, 790, 420, 540],
    platforms: [
      { x: 130, y: 420, w: 250 },
      { x: 580, y: 420, w: 250 },
      { x: 40, y: 345, w: 200 },
      { x: 720, y: 345, w: 200 },
      { x: 90, y: 270, w: 240 },
      { x: 630, y: 270, w: 240 },
      // free: a fresh press of Down drops through even with nothing below. Adrian wants the choice here.
      { x: 220, y: 195, w: 520, free: true },
      { x: 310, y: 120, w: 340 },
    ],
  },
  {
    name: 'Sun Steps',
    spawn: [200, 760, 420, 540],
    platforms: [
      { x: 60, y: 420, w: 840 },
      { x: 140, y: 345, w: 680 },
      { x: 220, y: 270, w: 520 },
      { x: 300, y: 195, w: 360 },
      { x: 380, y: 120, w: 200 },
    ],
  },
];

// One-way platforms: you land on top and jump up through them.
// Rooms can share a server process, so whatever moves things calls useMap first, in the same breath.
export let PLATFORMS = MAPS[0].platforms;
let SPAWN_X = MAPS[0].spawn;
export function useMap(i) {
  PLATFORMS = MAPS[i].platforms;
  SPAWN_X = MAPS[i].spawn;
}

const GRAVITY = 1.6;
const LOW_GRAVITY = 0.7;
const MAX_FALL = 24;
export const MAX_RUN = 6.5;
const ACCEL_GROUND = 1.8;
const ACCEL_AIR = 1;
const GRIP_GROUND = 0.75;
const GRIP_AIR = 0.96;
const GRIP_LOW = 0.985;
const JUMP_1 = -16;
const JUMP_2 = -14;
const KNOCK_UP = -6;
// Every push is this much stronger. One number, so it's easy to tune after playing.
const KNOCK_MORE = 1.2;
const SPEED_BOOST = 1.5;
const BLIND_SLOW = 0.75;
const GHOST_RUSH = 1.7;
const SHRINK_RUSH = 1.2;
const FREEZE_SLOW = 0.2;
const DASH_STEPS = 5;
const DASH_SPEED = 22;
const NET_SPEED = 32;
const NET_LIFT = -1.1;
const NET_GRAVITY = 0.08;
const NET_LIFE = 28;
export const NET_RADIUS = 20;
const LOB_X = 5.5;
const LOB_Y = -8;
const LOB_GRAVITY = 0.9;
const GIFT_FUSE = 33;
export const GIFT_RADIUS = 200;
const GIFT_FORCE = 46;
const GIFT_LIFT = -2;
const GUARD_KNOCK = 17;
export const GUARD_TOUCH = 30;
const GUARD_AGAIN = 15;
const BLOCK_FX_GAP = 6;
const CLONE_THINK = 12;
const CLONE_FIRE = 18;
const CLONE_KNOCK = 0.25;
const TRAP_SLOW = 0.35;
const TRAP_JUMP = 0.75;
export const TRAP_REACH = 55;
const HOOK_SPEED = 48;
const HOOK_LIFE = 22;
export const HOOK_HIT = 22;
const HOOK_PULL = 8;
const HOOK_BEHIND = 34;
const DOG_SPEED = 7;
const DOG_W = 34;
const DOG_H = 24;
export const DOG_REACH = 26;
const DOG_BITE_GAP = secs(1.5);
const DOG_KNOCK = 17;
const WALL_GAP = 44;
const STORM_SPEED = 4;
const STORM_LIFE = secs(4);
export const STORM_RADIUS = 70;
const STORM_KNOCK = 14;
const STORM_AGAIN = 20;
const ZIP_SPEED = 44;
const ZIP_GAP = 28;
const ZIP_LIMIT = 30;
const ZIP_SLOW = secs(1);
const LAST_HIT = secs(5);
const LAND_DUST = 8;
const SLIDE_STEPS = 14;
const GRIP_SLIDE = 0.93;
export const ROCKET_RADIUS = 100;
const WAVE_SPEED = 13;
const WAVE_LIFE = 60;
export const WAVE_HEIGHT = 220;
export const METEOR_RADIUS = 11;
const METEOR_KNOCK = 22;
const RESPAWN_SAFE = 45;
export const END_HOLD = secs(7);
export const OUT_MARGIN = 160;

// Everything that counts down on its own. n and st have their own rules below.
const TIMERS = ['cd', 'sp', 'sm', 'bl', 'shT', 'hv', 'rb', 'gb', 'gi', 'lg', 'i', 'c', 'sl', 'dc', 'gd', 'tr', 'hk', 'ck', 'iv', 'lt', 'zp', 'sk', 'sc', 'gh', 'fz', 'jw'];

// The body you can be hit on. Small enough to sit under a bullet fired from the same floor.
export function bodySize(p) {
  if (p.sm > 0) return { w: 14, h: 16 };
  if (p.gi > 0) return { w: PW * 2, h: PH * 2 };
  return { w: PW, h: PH };
}

export const muzzleY = (p) => p.y - (p.gi > 0 ? 30 : p.sm > 0 ? 8 : 18);
const overlaps = (p, x, y, r) => {
  const { w, h } = bodySize(p);
  return Math.abs(x - p.x) < w / 2 + r && y > p.y - h - r && y < p.y + r;
};
const inLine = (p, y) => y > p.y - bodySize(p).h && y < p.y;
const hittable = (s) => s.players.filter((p) => p.hero !== null && p.lives > 0);
const wallAt = (s, x, y, r = 0) => s.walls.find((w) => Math.abs(x - w.x) < WALL_W / 2 + r && y > w.y - WALL_H - r && y < w.y + r);
const cloneAt = (s, owner, x, y, r) => s.clones.find((c) => c.o !== owner && Math.abs(x - c.x) < PW / 2 + r && y > c.y - PH - r && y < c.y + r);

function spawn(p) {
  // Losing a decoy with a life still starts its cooldown.
  if (p.st > 0) p.cd = SKILL_CD[NINJA];
  Object.assign(p, {
    x: SPAWN_X[p.id],
    y: 100,
    vx: 0,
    vy: 0,
    g: false,
    j: 1,
    c: 0,
    i: RESPAWN_SAFE,
    gun: PISTOL,
    ammo: 0,
    n: 0,
    st: 0,
    sp: 0,
    sm: 0,
    ds: 0,
    dc: 0,
    gd: 0,
    tr: 0,
    hk: 0,
    ck: 0,
    lb: -99,
    iv: 0,
    eb: 0,
    zp: 0,
    lh: null,
    lt: 0,
    bl: 0,
    sh: 0,
    shT: 0,
    hv: 0,
    rb: 0,
    gb: 0,
    gi: 0,
    sl: 0,
    sk: 0,
    sc: 0,
    gh: 0,
    fz: 0,
    jw: 0,
  });
}

function clearWorld(s) {
  Object.assign(s, { bullets: [], nets: [], gifts: [], waves: [], crates: [], rocks: [], clones: [], traps: [], hooks: [], dogs: [], walls: [], storms: [], zips: [], meteors: 0 });
}

export function newGame() {
  const s = { tick: 0, players: [], fx: [], nextId: 0, over: 0, win: null, pick: PICK_STEPS, round: 0, drop: FIRST_DROP, map: 0, choice: null, host: null };
  clearWorld(s);
  return s;
}

export function startPick(s) {
  Object.assign(s, { pick: PICK_STEPS, over: 0, win: null });
  clearWorld(s);
  for (const p of s.players) p.ready = false;
}

export function startRound(s) {
  // Random unless the host picked a map.
  const map = s.choice ?? Math.floor(Math.random() * MAPS.length);
  Object.assign(s, { pick: 0, over: 0, win: null, round: 0, drop: FIRST_DROP, map });
  useMap(map);
  clearWorld(s);
  for (const p of s.players) {
    Object.assign(p, { kos: 0, hits: 0, falls: 0 });
    // Whoever ran out the clock without ever picking gets a hero anyway, so one player can't stall a room.
    if (p.hero === null) p.hero = (s.tick + p.id) % HERO_COUNT;
    p.lives = LIVES;
    p.ready = false;
    p.st = 0;
    p.lg = 0;
    spawn(p);
    p.cd = 0;
  }
}

export function addPlayer(s, id) {
  useMap(s.map);
  s.host ??= id;
  const p = { id, f: id % 2 ? -1 : 1, b: 0, lives: LIVES, wins: 0, hero: null, ready: false, cd: 0, st: 0, sx: 0, sy: 0, lg: 0, kos: 0, hits: 0, falls: 0 };
  spawn(p);
  s.players.push(p);
  // A second player arriving turns solo practice into a real round.
  if (s.players.length === 2) startPick(s);
  return p;
}

export function removePlayer(s, id) {
  useMap(s.map);
  s.players = s.players.filter((p) => p.id !== id);
  // The host's power passes on when they leave.
  if (s.host === id) s.host = s.players.length ? Math.min(...s.players.map((p) => p.id)) : null;
  if (s.players.length === 1 && s.pick === 0) {
    if (s.players[0].hero === null) startPick(s);
    else startRound(s);
  }
}

// Heroes change only on the pick screen, except that practising alone may switch any time
// and someone who joined mid-round picks once to enter it.
export function setHero(s, id, hero) {
  useMap(s.map);
  const p = s.players.find((pl) => pl.id === id);
  if (!p || !Number.isInteger(hero) || hero < 0 || hero >= HERO_COUNT) return;
  if (s.pick > 0) {
    p.hero = hero;
    p.ready = true;
  } else if (s.players.length < 2 || p.hero === null) {
    p.hero = hero;
    p.st = 0;
    spawn(p);
    p.cd = 0;
  }
}

// Where a wall would stand: in front of you, on your own level, or on the first floor below if you're in the air.
function wallSpot(p) {
  const x = p.x + p.f * WALL_GAP;
  if (p.g) return { x, y: p.y };
  const floors = PLATFORMS.filter((pl) => pl.y > p.y && x > pl.x && x < pl.x + pl.w);
  return floors.length ? { x, y: Math.min(...floors.map((pl) => pl.y)) } : null;
}

// Only the host chooses, and null means random. Alone in a room, it takes effect straight away.
export function chooseMap(s, id, map) {
  if (id !== s.host || !(map === null || (Number.isInteger(map) && map >= 0 && map < MAPS.length))) return;
  s.choice = map;
  if (map !== null && s.pick > 0) s.map = map;
  if (s.players.length === 1 && s.pick === 0 && s.players[0].hero !== null) startRound(s);
}

function useSkill(p) {
  if (p.hero === NINJA && p.st > 0) {
    // Swapping places with the decoy also breaks a net, and leaves 3 shurikens in hand.
    Object.assign(p, { x: p.sx, y: p.sy, vx: 0, vy: 0, n: 0, jw: 0, st: 0, cd: SKILL_CD[NINJA], gun: SHURIKEN, ammo: GUNS[SHURIKEN].ammo, c: 0 });
    return DID.TELEPORT;
  }
  if (p.hero === null || p.cd > 0) return 0;
  if (p.hero === NINJA) {
    Object.assign(p, { sx: p.x, sy: p.y, st: DECOY_STEPS });
    return DID.DECOY;
  }
  // No floor to stand it on means no wall, and the cooldown isn't spent.
  const spot = p.hero === MOSSBACK && wallSpot(p);
  if (p.hero === MOSSBACK && !spot) return 0;
  p.cd = SKILL_CD[p.hero];
  p.sk = p.hero === RIME ? STORM_LIFE : SKIN_STEPS;
  if (p.hero === SNIPER) {
    p.sc = SCOPE_STEPS;
    // A refill, not an extra clip: unfired bullets don't stack. It replaces any gun you were holding.
    p.gun = SNIPER_GUN;
    p.ammo = GUNS[SNIPER_GUN].ammo;
    return DID.EQUIP;
  }
  if (p.hero === TRAPPER) return DID.NET;
  if (p.hero === SPRINTER) {
    p.sp = SPEED_STEPS;
    // A short-lived sidearm too. Like the sniper's rifle, it replaces whatever you were holding.
    p.gun = ARC;
    p.ammo = GUNS[ARC].ammo;
    p.c = 0;
    return DID.SPEED;
  }
  if (p.hero === SHIFTER) {
    p.sm = SHRINK_STEPS;
    return DID.SHRINK;
  }
  if (p.hero === SANTA) return DID.GIFT;
  if (p.hero === DUSK) return DID.WAVE;
  if (p.hero === BULWARK) {
    p.gd = GUARD_STEPS;
    return DID.GUARD;
  }
  if (p.hero === ILLUSIONIST) return DID.CLONES;
  if (p.hero === POACHER) return DID.TRAP;
  if (p.hero === ANGLER) return DID.HOOK;
  if (p.hero === HANDLER) return DID.DOG;
  if (p.hero === RIME) return DID.STORM;
  if (p.hero === TETHER) {
    p.zp = ZIP_LIMIT;
    return DID.ZIP;
  }
  if (p.hero === SHADE) {
    p.iv = VANISH_STEPS;
    return DID.VANISH;
  }
  p.wx = spot.x;
  p.wy = spot.y;
  return DID.WALL;
}

// One step for anything with feet. Walls are the arena's only solid thing: blocked from the sides and below, walkable on top.
function moveBody(b, half, h, walls, dropping, freeDrop = false) {
  const oldX = b.x;
  const oldY = b.y;
  const reach = half + WALL_W / 2;
  b.x += b.vx;
  for (const w of walls) {
    // The whole path counts, so a huge hit can't throw someone through a wall.
    if (oldY > w.y - WALL_H && oldY - h < w.y && Math.min(oldX, b.x) < w.x + reach && Math.max(oldX, b.x) > w.x - reach) {
      b.x = w.x + (oldX < w.x ? -reach : reach);
      b.vx = 0;
    }
  }
  b.y += b.vy;
  b.g = false;
  if (b.vy >= 0) {
    for (const pl of PLATFORMS) {
      if (oldY <= pl.y && b.y >= pl.y && b.x + half > pl.x && b.x - half < pl.x + pl.w) {
        // Down drops through a platform only if there's another one under it, never into the lava. A free platform also takes a fresh press while standing on it, so holding Down from higher up still stops here.
        if (dropping && (PLATFORMS.some((o) => o.y > pl.y && b.x + half > o.x && b.x - half < o.x + o.w) || (freeDrop && pl.free && oldY === pl.y))) continue;
        b.y = pl.y;
        b.vy = 0;
        b.g = true;
        break;
      }
    }
  }
  for (const w of walls) {
    if (Math.abs(b.x - w.x) >= reach) continue;
    const top = w.y - WALL_H;
    if (b.vy >= 0 && oldY <= top && b.y >= top) {
      b.y = top;
      b.vy = 0;
      b.g = true;
    } else if (b.vy < 0 && oldY - h >= w.y && b.y - h < w.y) {
      b.y = w.y + h;
      b.vy = 0;
    }
  }
}

// Moves one player one step. Returns the DID bits for what they did. The browser passes the walls from its latest snapshot.
export function movePlayer(p, keys, walls = []) {
  let did = 0;
  for (const k of TIMERS) if (p[k] > 0) p[k]--;
  // Mid-zip the server flies you along the line, and nothing else happens.
  if (p.zp > 0) {
    p.vx = p.vy = 0;
    p.b = keys;
    return did;
  }
  if (p.sh > 0 && !p.shT) p.sh = 0;
  if (p.st > 0 && --p.st === 0) {
    p.cd = SKILL_CD[NINJA];
    did |= DID.FADE;
  }

  const wanted = (keys & KEY.RIGHT ? 1 : 0) - (keys & KEY.LEFT ? 1 : 0);
  // In a net you can still turn to aim, but your feet don't work.
  if (wanted) p.f = wanted;
  // Hooked: you can't do anything at all until the short stun ends.
  const stunned = p.hk > 0;
  if (!stunned && keys & KEY.SKILL && !(p.b & KEY.SKILL)) did |= useSkill(p);

  const netted = p.n > 0 || p.jw > 0 || stunned;
  if (p.n > 0) p.n--;
  const dir = netted ? 0 : wanted;
  const pace = (p.sp > 0 ? SPEED_BOOST : 1) * (p.gh > 0 ? GHOST_RUSH : 1) * (p.sm > 0 ? SHRINK_RUSH : 1) * (p.bl > 0 ? BLIND_SLOW : 1) * (p.tr > 0 ? TRAP_SLOW : 1) * (p.fz > 0 ? FREEZE_SLOW : 1);
  const top = MAX_RUN * pace;
  // Everyone's dash. It wipes out any knockback you're carrying, but it can't break a net.
  if (!netted && keys & KEY.DASH && !(p.b & KEY.DASH) && p.dc === 0) {
    p.ds = DASH_STEPS;
    p.dc = DASH_CD;
    did |= DID.DASH;
  }
  if (p.ds > 0) {
    p.ds--;
    p.vx = p.f * DASH_SPEED;
    p.vy = 0;
    if (p.ds === 0) p.vx = p.f * MAX_RUN;
  } else {
    // Under top speed you steer freely; above it (knockback) only friction slows you, so hits carry.
    if (dir && p.vx * dir < top) p.vx = Math.min(p.vx * dir + (p.g ? ACCEL_GROUND : ACCEL_AIR) * pace, top) * dir;
    if (!dir || Math.abs(p.vx) > top) p.vx *= p.g ? (p.sl > 0 ? GRIP_SLIDE : GRIP_GROUND) : p.lg > 0 ? GRIP_LOW : GRIP_AIR;
    p.vy = Math.min(p.vy + (p.lg > 0 ? LOW_GRAVITY : GRAVITY), MAX_FALL);
  }

  const jumps = p.rb > 0 ? 3 : 2;
  if (p.j > jumps) p.j = jumps;
  if (!netted && keys & KEY.JUMP && !(p.b & KEY.JUMP) && p.j > 0) {
    did |= p.j === jumps ? DID.JUMP : DID.JUMP2;
    p.vy = (p.j === jumps ? JUMP_1 : JUMP_2) * (p.tr > 0 || p.fz > 0 ? TRAP_JUMP : 1);
    p.j--;
    p.g = false;
  }

  const dropping = !netted && keys & KEY.DOWN;
  const size = bodySize(p);
  const falling = p.vy;
  moveBody(p, size.w / 2, size.h, walls, dropping, !(p.b & KEY.DOWN));
  if (p.g) p.j = jumps;
  if (p.g && falling > LAND_DUST) did |= DID.LAND;
  // Walking off a ledge spends the ground jump.
  if (!p.g && p.j === jumps) p.j = jumps - 1;

  p.b = keys;
  if (!stunned && keys & KEY.SHOOT && p.c === 0) {
    const gun = p.gun;
    // Firing gives Shade away, but that first shot from hiding hits like a sniper's.
    if (p.iv > 0) {
      p.iv = 0;
      p.eb = 1;
    }
    p.c = GUNS[gun].cool;
    p.vx -= p.f * GUNS[gun].recoil;
    if (gun !== PISTOL && --p.ammo <= 0) {
      p.gun = PISTOL;
      p.ammo = 0;
    }
    did |= DID.SHOT | (gun << GUN_SHIFT);
  }
  return did;
}

// A raised guard or a crate shield stops whatever was coming. Returns true if one did.
function blocked(s, p, dir) {
  const say = () => s.fx.push({ k: 'block', id: p.id, x: p.x, y: p.y - bodySize(p).h / 2, f: dir || 1 });
  if (p.gd > 0) {
    // A minigun mustn't turn the guard into 15 shouts a second.
    if (s.tick - p.lb > BLOCK_FX_GAP) {
      p.lb = s.tick;
      say();
    }
    return true;
  }
  if (p.sh > 0) {
    p.sh--;
    say();
    return true;
  }
  return false;
}

// Every push goes through here, so shields and heavy boots always count.
function push(s, p, vx, vy, by) {
  if (blocked(s, p, Math.sign(vx))) return false;
  if (by !== undefined && by !== p.id) {
    p.lh = by;
    p.lt = LAST_HIT;
    const shooter = s.players.find((o) => o.id === by);
    if (shooter) shooter.hits++;
  }
  const weight = (p.hv > 0 ? 0.5 : 1) * KNOCK_MORE;
  p.vx += vx * weight;
  p.vy = Math.min(p.vy, vy * weight);
  p.g = false;
  return true;
}

// A flat blast shoves sideways with barely any lift, and lets the target slide along the floor.
function popClone(s, c) {
  s.clones = s.clones.filter((o) => o !== c);
  s.fx.push({ k: 'poof', id: c.o, x: c.x, y: c.y - PH / 2, f: c.f });
}

// Blasts go through walls: the wall takes one shot's worth, and whoever is behind it still gets shoved.
function blast(s, x, y, radius, force, spare, flat = false, by = spare) {
  s.fx.push({ k: 'blast', id: spare ?? -1, x, y, r: radius, f: 1, gift: flat });
  for (const w of s.walls) if (w.o !== spare && Math.hypot(w.x - x, w.y - WALL_H / 2 - y) < radius) w.hp--;
  for (const d of s.dogs) if (d.o !== spare && Math.hypot(d.x - x, d.y - DOG_H / 2 - y) < radius) d.hp--;
  for (const c of [...s.clones]) if (c.o !== spare && Math.hypot(c.x - x, c.y - PH / 2 - y) < radius) popClone(s, c);
  for (const p of hittable(s)) {
    if (p.id === spare || p.i > 0) continue;
    const dx = p.x - x;
    const dy = p.y - PH / 2 - y;
    const far = Math.hypot(dx, dy);
    if (far > radius) continue;
    const power = force * (1 - (far / radius) * 0.5);
    if (flat) {
      if (push(s, p, (Math.sign(dx) || 1) * power, GIFT_LIFT, by)) p.sl = SLIDE_STEPS;
    } else {
      push(s, p, far ? (dx / far) * power : power, far ? Math.min(KNOCK_UP, (dy / far) * power) : KNOCK_UP, by);
    }
  }
}

function fireGun(s, p, fired) {
  const gun = p.eb ? SNIPER_GUN : fired;
  p.eb = 0;
  const g = GUNS[gun];
  const y = muzzleY(p);
  const knock = g.knock * (p.gb > 0 ? 2 : 1) * (p.gi > 0 ? 1.5 : 1);
  if (g.beam) {
    // The beam stops dead at the first wall in line.
    const ahead = (x) => (x - p.x) * p.f;
    const wall = s.walls.filter((w) => ahead(w.x) > 0 && y > w.y - WALL_H && y < w.y).sort((m, n) => ahead(m.x) - ahead(n.x))[0];
    const reach = wall ? ahead(wall.x) : Infinity;
    const inBeam = (x) => ahead(x) > 0 && ahead(x) < reach;
    if (wall && wall.o !== p.id) wall.hp--;
    s.fx.push({ k: 'shot', id: p.id, x: p.x, y, f: p.f, g: gun, to: wall?.x });
    for (const o of hittable(s)) {
      if (o.id === p.id || o.i > 0 || !inBeam(o.x) || !inLine(o, y)) continue;
      if (push(s, o, p.f * knock, KNOCK_UP, p.id)) s.fx.push({ k: 'hit', id: o.id, x: o.x, y, f: p.f });
    }
    for (const c of [...s.clones]) if (c.o !== p.id && inBeam(c.x) && y > c.y - PH && y < c.y) popClone(s, c);
    for (const d of s.dogs) if (d.o !== p.id && inBeam(d.x) && y > d.y - DOG_H && y < d.y) d.hp--;
    return;
  }
  s.fx.push({ k: 'shot', id: p.id, x: p.x, y, f: p.f, g: gun });
  for (const vy of g.pellets || [0]) {
    s.bullets.push({ id: s.nextId++, x: p.x + p.f * PW, y, vx: p.f * g.speed, vy, o: p.id, t: g.life, k: knock, g: gun });
  }
}

// The closest enemy that can be seen and touched, clones included.
function nearestFoe(s, owner, from) {
  let best = null;
  let far = Infinity;
  for (const o of s.players) {
    if (o.id === owner || o.hero === null || o.lives <= 0 || o.i > 0 || o.iv > 0) continue;
    const gap = Math.hypot(o.x - from.x, o.y - from.y);
    if (gap < far) {
      far = gap;
      best = o;
    }
  }
  for (const c of s.clones) {
    if (c.o === owner) continue;
    const gap = Math.hypot(c.x - from.x, c.y - from.y);
    if (gap < far) {
      far = gap;
      best = c;
    }
  }
  return best;
}

function act(s, p, did, fromX, fromY) {
  const y = p.y - PH / 2;
  const say = (k, extra) => s.fx.push({ k, id: p.id, x: p.x, y, f: p.f, ...extra });
  if (did & DID.SHOT) fireGun(s, p, did >> GUN_SHIFT);
  if (did & DID.EQUIP) say('equip');
  if (did & DID.NET) {
    s.nets.push({ id: s.nextId++, x: p.x + p.f * PW, y, vx: p.f * NET_SPEED, vy: NET_LIFT, o: p.id, t: NET_LIFE });
    say('throw');
  }
  if (did & DID.DECOY) say('decoy');
  if (did & DID.FADE) say('fade', { x: p.sx, y: p.sy - PH / 2 });
  if (did & DID.TELEPORT) say('teleport', { fromX, fromY: fromY - PH / 2 });
  if (did & DID.SPEED) say('speed');
  if (did & DID.SHRINK) say('shrink');
  if (did & DID.GIFT) {
    s.gifts.push({ id: s.nextId++, x: p.x + p.f * 14, y: y - 8, vx: p.f * LOB_X, vy: LOB_Y, o: p.id, t: GIFT_FUSE });
    say('lob');
  }
  if (did & DID.GUARD) say('guard');
  if (did & DID.CLONES) {
    for (const dir of [-1, 1]) s.clones.push({ id: s.nextId++, o: p.id, h: p.hero, gun: p.gun, x: p.x, y: p.y, vx: 0, vy: 0, g: p.g, f: dir, d: dir, w: CLONE_THINK, t: CLONE_STEPS, sh: 8, aim: 0 });
    say('clones');
  }
  if (did & DID.TRAP) {
    // 70 s of life on a 20 s cooldown would make 4, so the oldest goes to keep it at 3.
    const mine = s.traps.filter((t) => t.o === p.id);
    if (mine.length >= TRAP_MAX) {
      s.traps = s.traps.filter((t) => t !== mine[0]);
      s.fx.push({ k: 'poof', id: p.id, x: mine[0].x, y: mine[0].y - 6, f: 1 });
    }
    s.traps.push({ id: s.nextId++, x: p.x + p.f * 14, y: y - 8, vx: p.f * LOB_X, vy: LOB_Y, o: p.id, t: TRAP_LIFE, g: false });
    say('lob');
  }
  if (did & DID.HOOK) {
    s.hooks.push({ id: s.nextId++, x: p.x + p.f * PW, y, vx: p.f * HOOK_SPEED, f: p.f, o: p.id, t: HOOK_LIFE });
    say('cast');
  }
  if (did & DID.DOG) {
    s.dogs.push({ id: s.nextId++, o: p.id, x: p.x + p.f * 20, y: p.y, vx: 0, vy: 0, g: false, f: p.f, t: DOG_STEPS, hp: DOG_HP, c: 0 });
    say('dogcall');
  }
  if (did & DID.STORM) {
    s.storms.push({ id: s.nextId++, o: p.id, x: p.x + p.f * 30, y: p.y - 34, vx: p.f * STORM_SPEED, t: STORM_LIFE });
    say('storm');
  }
  if (did & DID.ZIP) {
    const target = nearestFoe(s, p.id, p);
    if (target) {
      s.zips.push({ id: s.nextId++, o: p.id, c: 'o' in target ? -1 : target.id, cl: 'o' in target ? target.id : -1, n: ZIP_LIMIT });
      say('zip');
    } else {
      // Nobody to zip to: alone in a room, the press costs nothing.
      p.zp = 0;
      p.cd = 0;
    }
  }
  if (did & DID.VANISH) say('vanish');
  if (did & DID.JUMP) say('jump');
  if (did & DID.JUMP2) say('jump2');
  if (did & DID.LAND) say('land');
  if (did & DID.WALL) {
    s.walls.push({ id: s.nextId++, o: p.id, x: p.wx, y: p.wy, hp: WALL_HP, t: WALL_STEPS });
    say('wallup', { x: p.wx, y: p.wy });
  }
  if (did & DID.WAVE) {
    s.waves.push({ id: s.nextId++, x: p.x + p.f * 20, y, vx: p.f * WAVE_SPEED, o: p.id, t: WAVE_LIFE, hit: [] });
    say('wave');
  }
  if (did & DID.DASH) say('dash');
}

// Walls, clones and dogs stop a bullet before any player can. Returns true if one did.
function bulletStopped(s, b, lo, hi) {
  const crosses = (x, half) => x > lo - half && x < hi + half;
  const wall = s.walls.find((w) => crosses(w.x, WALL_W / 2) && b.y > w.y - WALL_H && b.y < w.y);
  const clone = !wall && s.clones.find((c) => c.o !== b.o && crosses(c.x, PW / 2 + 6) && b.y > c.y - PH && b.y < c.y);
  const dog = !wall && !clone && s.dogs.find((d) => d.o !== b.o && crosses(d.x, DOG_W / 2 + 6) && b.y > d.y - DOG_H && b.y < d.y);
  if (!wall && !clone && !dog) return false;
  if (b.g === ROCKET) {
    blast(s, b.x, b.y, ROCKET_RADIUS, b.k, undefined, false, b.o);
    return true;
  }
  const dmg = b.dmg ?? GUNS[b.g].dmg ?? 1;
  const dir = Math.sign(b.vx);
  if (clone) {
    popClone(s, clone);
    return true;
  }
  // The flamethrower hits 30 times a second, so it stays silent.
  if (b.g !== FLAME) s.fx.push({ k: wall ? 'wallhit' : 'hit', id: b.o, x: wall ? wall.x - (dir * WALL_W) / 2 : dog.x, y: b.y, f: dir, g: b.g });
  // Your own bullets stop at your own wall, without chipping it.
  if (dog) dog.hp -= dmg;
  else if (wall.o !== b.o) wall.hp -= dmg;
  return true;
}

function moveBullets(s, playing) {
  s.bullets = s.bullets.filter((b) => {
    const from = b.x;
    b.x += b.vx;
    b.y += b.vy;
    b.t--;
    // Check the whole path, so a fast bullet can't jump over a player between steps.
    const lo = Math.min(from, b.x);
    const hi = Math.max(from, b.x);
    if (bulletStopped(s, b, lo, hi)) return false;
    for (const p of playing) {
      if (p.id === b.o || p.i > 0) continue;
      const extra = GUNS[b.g].hit ?? 0;
      const reach = bodySize(p).w / 2 + (extra || 6);
      if (p.x > lo - reach && p.x < hi + reach && b.y > p.y - bodySize(p).h - extra && b.y < p.y + extra) {
        if (b.g === ROCKET) {
          blast(s, b.x, b.y, ROCKET_RADIUS, b.k, undefined, false, b.o);
        } else if (push(s, p, Math.sign(b.vx) * b.k, KNOCK_UP, b.o)) {
          s.fx.push({ k: b.g === SNIPER_GUN || b.g === SHURIKEN ? 'hitbig' : 'hit', id: p.id, x: p.x, y: b.y, f: Math.sign(b.vx) });
        }
        return false;
      }
    }
    if (b.t <= 0 && b.g === ROCKET) blast(s, b.x, b.y, ROCKET_RADIUS, b.k, undefined, false, b.o);
    return b.t > 0;
  });
}

function moveNets(s, playing) {
  s.nets = s.nets.filter((n) => {
    n.x += n.vx;
    n.vy += NET_GRAVITY;
    n.y += n.vy;
    n.t--;
    const clone = cloneAt(s, n.o, n.x, n.y, NET_RADIUS);
    if (clone) {
      popClone(s, clone);
      return false;
    }
    for (const p of playing) {
      if (p.id === n.o || p.i > 0 || !overlaps(p, n.x, n.y, NET_RADIUS)) continue;
      if (blocked(s, p, Math.sign(n.vx))) return false;
      p.n = NET_STEPS;
      s.fx.push({ k: 'snare', id: p.id, x: p.x, y: p.y - PH / 2, f: Math.sign(n.vx) });
      return false;
    }
    if (n.t <= 0 || wallAt(s, n.x, n.y, 6)) {
      s.fx.push({ k: 'netdrop', id: n.o, x: n.x, y: n.y, f: Math.sign(n.vx) });
      return false;
    }
    return true;
  });
}

// One step of something lobbed. Returns the platform it came down on, if any.
function fly(s, n) {
  const oldY = n.y;
  n.vy += LOB_GRAVITY;
  n.x += n.vx;
  n.y += n.vy;
  if (wallAt(s, n.x, n.y, 6)) {
    n.x -= n.vx;
    n.vx *= -0.5;
  }
  if (n.vy <= 0) return null;
  const floor = PLATFORMS.find((pl) => oldY <= pl.y && n.y >= pl.y && n.x > pl.x && n.x < pl.x + pl.w);
  if (floor) n.y = floor.y;
  return floor;
}

// A gift always runs its whole fuse: touching an enemy doesn't set it off.
function moveGifts(s) {
  s.gifts = s.gifts.filter((n) => {
    if (fly(s, n)) {
      n.vy *= -0.5;
      n.vx *= 0.55;
    }
    if (--n.t > 0) return true;
    blast(s, n.x, n.y, GIFT_RADIUS, GIFT_FORCE, n.o, true);
    return false;
  });
}

function moveTraps(s, playing) {
  s.traps = s.traps.filter((t) => {
    if (--t.t <= 0) return false;
    if (!t.g) {
      if (fly(s, t)) {
        Object.assign(t, { g: true, vx: 0, vy: 0 });
        s.fx.push({ k: 'trapset', id: t.o, x: t.x, y: t.y, f: 1 });
      }
      return t.y < H + 20;
    }
    for (const p of playing) {
      if (p.id === t.o || p.i > 0 || !p.g || Math.abs(p.y - t.y) > 4 || Math.abs(p.x - t.x) > bodySize(p).w / 2 + TRAP_REACH) continue;
      if (!blocked(s, p, 1)) {
        p.tr = TRAP_STEPS;
        p.jw = TRAP_HOLD;
        s.fx.push({ k: 'trapped', id: p.id, x: t.x, y: t.y, f: 1 });
      }
      return false;
    }
    return true;
  });
}

// Flies straight until it catches someone, then drags them to just behind the thrower for a short stun.
function moveHooks(s, playing) {
  s.hooks = s.hooks.filter((k) => {
    const owner = s.players.find((p) => p.id === k.o);
    if (!owner) return false;
    if (k.c !== undefined) {
      const prey = s.players.find((p) => p.id === k.c);
      if (!prey) return false;
      const share = 1 / k.t--;
      prey.x += (owner.x - k.f * HOOK_BEHIND - prey.x) * share;
      prey.y += (owner.y - prey.y) * share;
      prey.vx = prey.vy = 0;
      k.x = prey.x;
      k.y = prey.y - PH / 2;
      return k.t > 0;
    }
    k.x += k.vx;
    k.t--;
    // Twice, because it flies further in a step than a wall is wide.
    if (wallAt(s, k.x, k.y, 6) || wallAt(s, k.x - k.vx / 2, k.y, 6)) return false;
    const clone = cloneAt(s, k.o, k.x, k.y, HOOK_HIT);
    if (clone) {
      popClone(s, clone);
      return false;
    }
    for (const p of playing) {
      if (p.id === k.o || p.i > 0 || !overlaps(p, k.x, k.y, HOOK_HIT)) continue;
      if (blocked(s, p, k.f)) return false;
      Object.assign(p, { hk: HOOK_PULL + HOOK_STUN, ds: 0, g: false });
      k.c = p.id;
      k.t = HOOK_PULL;
      s.fx.push({ k: 'hooked', id: p.id, x: p.x, y: p.y - PH / 2, f: k.f });
      return true;
    }
    return k.t > 0;
  });
}

function floorAhead(s, b, dir) {
  const x = b.x + dir * 22;
  return PLATFORMS.some((pl) => pl.y === b.y && x > pl.x && x < pl.x + pl.w) || s.walls.some((w) => w.y - WALL_H === b.y && Math.abs(x - w.x) < WALL_W / 2);
}

// Clones wander on their own and turn back at ledges, so they don't all fall off in the first second.
function moveClones(s) {
  for (const c of [...s.clones]) {
    if (--c.t <= 0 || c.y > H + 60) {
      popClone(s, c);
      continue;
    }
    if (--c.w <= 0) {
      c.w = CLONE_THINK + Math.floor(Math.random() * CLONE_THINK * 2);
      c.d = [-1, -1, 0, 1, 1][Math.floor(Math.random() * 5)];
      if (c.g && Math.random() < 0.35) c.vy = JUMP_1;
    }
    if (c.g && c.d && !floorAhead(s, c, c.d)) c.d = -c.d;
    if (c.aim > 0) c.aim--;
    else if (c.d) c.f = c.d;
    // Clones really fire, weakly, at whoever is level with them, so a bullet doesn't tell you who's real.
    const foe = nearestFoe(s, c.o, c);
    if (--c.sh <= 0 && foe && Math.abs(foe.y - c.y) < 50) {
      c.sh = CLONE_FIRE + Math.floor(Math.random() * CLONE_FIRE);
      c.f = Math.sign(foe.x - c.x) || c.f;
      c.aim = 12;
      const y = c.y - 18;
      s.fx.push({ k: 'shot', id: c.o, x: c.x, y, f: c.f, g: PISTOL });
      s.bullets.push({ id: s.nextId++, x: c.x + c.f * PW, y, vx: c.f * GUNS[PISTOL].speed, vy: 0, o: c.o, t: GUNS[PISTOL].life, k: GUNS[PISTOL].knock * CLONE_KNOCK, g: PISTOL, dmg: CLONE_KNOCK });
    }
    c.vx = c.d * MAX_RUN;
    c.vy = Math.min(c.vy + GRAVITY, MAX_FALL);
    moveBody(c, PW / 2, PH, s.walls, false);
  }
}

// The dog runs at the nearest enemy, clones included, and shoves them every 1.5 s until it dies or its time is up.
function moveDogs(s, playing) {
  s.dogs = s.dogs.filter((d) => {
    if (--d.t <= 0 || d.hp <= 0 || d.y > H + 60) {
      s.fx.push({ k: 'dogout', id: d.o, x: d.x, y: Math.min(d.y, H) - DOG_H / 2, f: d.f });
      return false;
    }
    if (d.c > 0) d.c--;
    let prey = null;
    let far = Infinity;
    for (const o of [...playing, ...s.clones]) {
      if (('o' in o ? o.o : o.id) === d.o || o.i > 0 || o.iv > 0) continue;
      const gap = Math.hypot(o.x - d.x, o.y - d.y);
      if (gap < far) {
        far = gap;
        prey = o;
      }
    }
    const dx = prey ? prey.x - d.x : 0;
    const dy = prey ? prey.y - d.y : 0;
    const dir = Math.abs(dx) > 8 ? Math.sign(dx) : 0;
    if (dir) d.f = dir;
    d.vx = dir * DOG_SPEED;
    d.vy = Math.min(d.vy + GRAVITY, MAX_FALL);
    if (d.g && ((dy < -30 && Math.abs(dx) < 170) || (dir && !floorAhead(s, d, dir)))) d.vy = JUMP_1;
    moveBody(d, DOG_W / 2, DOG_H, s.walls, dy > 30);
    if (prey && d.c === 0 && Math.abs(prey.x - d.x) < DOG_REACH && Math.abs(prey.y - d.y) < 40) {
      d.c = DOG_BITE_GAP;
      s.fx.push({ k: 'bite', id: d.o, x: prey.x, y: prey.y - PH / 2, f: d.f });
      if ('o' in prey) popClone(s, prey);
      else push(s, prey, d.f * DOG_KNOCK, KNOCK_UP, d.o);
    }
    return true;
  });
}

// A slow blizzard that rolls forward and throws back anyone it reaches.
function moveStorms(s, playing) {
  s.storms = s.storms.filter((w) => {
    w.x += w.vx;
    for (const c of [...s.clones]) if (c.o !== w.o && Math.hypot(c.x - w.x, c.y - PH / 2 - w.y) < STORM_RADIUS) popClone(s, c);
    for (const p of playing) {
      if (p.id === w.o || p.i > 0 || p.ck > 0 || Math.hypot(p.x - w.x, p.y - PH / 2 - w.y) > STORM_RADIUS) continue;
      const away = Math.sign(p.x - w.x) || Math.sign(w.vx);
      p.ck = STORM_AGAIN;
      if (push(s, p, away * STORM_KNOCK, KNOCK_UP, w.o)) {
        p.fz = FREEZE_STEPS;
        s.fx.push({ k: 'chill', id: p.id, x: p.x, y: p.y - PH / 2, f: away });
      }
    }
    return --w.t > 0;
  });
}

// Flies the owner along a line to just beside their target, wherever it is, and slows the target on arrival.
function moveZips(s) {
  s.zips = s.zips.filter((z) => {
    const owner = s.players.find((p) => p.id === z.o);
    const to = z.cl >= 0 ? s.clones.find((c) => c.id === z.cl) : s.players.find((p) => p.id === z.c && p.lives > 0);
    if (!owner) return false;
    if (!to || --z.n <= 0) {
      owner.zp = 0;
      return false;
    }
    const side = Math.sign(to.x - owner.x) || owner.f;
    const dx = to.x - side * ZIP_GAP - owner.x;
    const dy = to.y - owner.y;
    const gap = Math.hypot(dx, dy);
    if (gap > ZIP_SPEED) {
      owner.x += (dx / gap) * ZIP_SPEED;
      owner.y += (dy / gap) * ZIP_SPEED;
      owner.zp = 2;
      return true;
    }
    Object.assign(owner, { x: to.x - side * ZIP_GAP, y: to.y, f: side, vx: 0, vy: 0, zp: 0, j: Math.max(owner.j, 1) });
    if ('o' in to) {
      popClone(s, to);
    } else if (!blocked(s, to, side)) {
      to.tr = ZIP_SLOW;
      s.fx.push({ k: 'zipped', id: to.id, x: to.x, y: to.y - PH / 2, f: side });
    }
    return false;
  });
}

function moveWalls(s) {
  s.walls = s.walls.filter((w) => {
    if (--w.t > 0 && w.hp > 0) return true;
    s.fx.push({ k: 'walldown', id: w.o, x: w.x, y: w.y - WALL_H / 2, f: 1 });
    return false;
  });
}

// A raised guard knocks away anyone touching it, twice as hard as a pistol hit.
function guardTouch(s, playing) {
  for (const p of playing) {
    if (!(p.gd > 0)) continue;
    for (const o of playing) {
      if (o.id === p.id || o.i > 0 || o.ck > 0 || Math.abs(o.x - p.x) > GUARD_TOUCH || Math.abs(o.y - p.y) > PH) continue;
      const away = Math.sign(o.x - p.x) || p.f;
      o.ck = GUARD_AGAIN;
      if (push(s, o, away * GUARD_KNOCK, KNOCK_UP, p.id)) s.fx.push({ k: 'hitbig', id: o.id, x: o.x, y: o.y - PH / 2, f: away });
    }
    const clone = cloneAt(s, p.id, p.x, p.y - PH / 2, GUARD_TOUCH);
    if (clone) popClone(s, clone);
  }
}

function moveWaves(s, playing) {
  s.waves = s.waves.filter((w) => {
    w.x += w.vx;
    w.t--;
    for (const p of playing) {
      if (p.id === w.o || p.i > 0 || w.hit.includes(p.id)) continue;
      if (Math.abs(p.x - w.x) > 26 || Math.abs(p.y - PH / 2 - w.y) > WAVE_HEIGHT / 2) continue;
      w.hit.push(p.id);
      if (!blocked(s, p, Math.sign(w.vx))) {
        p.bl = BLIND_STEPS;
        const owner = s.players.find((o) => o.id === w.o);
        if (owner) owner.gh = GHOST_STEPS;
        s.fx.push({ k: 'blinded', id: p.id, x: p.x, y: p.y - PH / 2, f: Math.sign(w.vx) });
      }
    }
    return w.t > 0;
  });
}

function moveMeteors(s, playing) {
  if (s.meteors > 0 && --s.meteors % 9 === 0) {
    s.rocks.push({ id: s.nextId++, x: 40 + Math.random() * (W - 80), y: -20, vx: Math.random() * 4 - 2, vy: 11 });
  }
  s.rocks = s.rocks.filter((r) => {
    r.x += r.vx;
    r.y += r.vy;
    for (const p of playing) {
      if (p.i > 0 || !overlaps(p, r.x, r.y, METEOR_RADIUS)) continue;
      const away = Math.sign(p.x - r.x) || 1;
      if (push(s, p, away * METEOR_KNOCK, KNOCK_UP)) s.fx.push({ k: 'hit', id: p.id, x: p.x, y: r.y, f: away });
      return false;
    }
    return r.y < H + 20;
  });
}

export function isEndgame(s) {
  return s.round >= ENDGAME_AFTER && s.players.length >= 2 && hittable(s).some((p) => p.lives === 1);
}

// Picks what falls next. roll is 0 to 1, so the test can pass exact values.
export function chooseItem(s, roll = Math.random()) {
  const open = ITEMS.filter((it) => !it.endgame || isEndgame(s));
  let left = roll * open.reduce((sum, it) => sum + it.w, 0);
  for (const it of open) {
    left -= it.w;
    if (left <= 0) return ITEMS.indexOf(it);
  }
  return ITEMS.indexOf(open[open.length - 1]);
}

export function dropCrate(s, item) {
  // Over a platform, so nearly every crate lands somewhere you can reach.
  const pl = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
  s.crates.push({ id: s.nextId++, i: item, x: pl.x + 24 + Math.random() * (pl.w - 48), y: -24, t: CRATE_STAY, g: false });
}

export function applyItem(s, p, item) {
  const it = ITEMS[item];
  s.fx.push({ k: 'pickup', id: p.id, x: p.x, y: p.y - PH, f: p.f, i: item });
  if (it.gun !== undefined) {
    p.gun = it.gun;
    p.ammo = GUNS[it.gun].ammo;
    p.c = 0;
  } else if (it.cut) {
    p.cd = Math.max(0, p.cd - it.cut);
  } else if (it.id === 'refresh') {
    p.cd = 0;
  } else if (it.id === 'shield') {
    p.sh = SHIELD_HITS;
    p.shT = SHIELD_STEPS;
  } else if (it.id === 'heavy') {
    p.hv = HEAVY_STEPS;
  } else if (it.id === 'life') {
    p.lives++;
  } else if (it.id === 'boots') {
    if (!p.rb) p.j++;
    p.rb = BOOTS_STEPS;
  } else if (it.id === 'golden') {
    p.gb = GOLDEN_STEPS;
  } else if (it.id === 'giant') {
    p.gi = GIANT_STEPS;
    p.sm = 0;
  } else if (it.id === 'lowg') {
    for (const o of s.players) o.lg = LOWG_STEPS;
  } else if (it.id === 'meteor') {
    s.meteors = METEOR_STEPS;
  }
}

function moveCrates(s, playing) {
  if (--s.drop <= 0 && s.crates.length < MAX_CRATES) {
    s.drop = DROP_MIN + Math.floor(Math.random() * DROP_SPREAD);
    dropCrate(s, chooseItem(s));
  }
  s.crates = s.crates.filter((c) => {
    if (c.g) {
      c.t--;
    } else {
      const oldY = c.y;
      c.y += CRATE_FALL;
      const floor = PLATFORMS.find((pl) => oldY <= pl.y && c.y >= pl.y && c.x > pl.x && c.x < pl.x + pl.w);
      if (floor) {
        c.y = floor.y;
        c.g = true;
      }
    }
    const taker = playing.find((p) => overlaps(p, c.x, c.y - 14, 16));
    if (taker) {
      applyItem(s, taker, c.i);
      return false;
    }
    return c.t > 0 && c.y < H + 30;
  });
}

// One step of the match. keysOf(playerId) gives that player's keys for this step.
export function step(s, keysOf) {
  useMap(s.map);
  s.tick++;
  if (s.pick > 0) {
    // Practising alone has no clock.
    if (s.players.length >= 2) s.pick--;
    if (s.pick === 0 || (s.players.length > 0 && s.players.every((p) => p.ready))) startRound(s);
    return;
  }
  if (s.over > 0) {
    if (--s.over === 0) startPick(s);
    return;
  }
  s.round++;
  const playing = hittable(s);
  for (const p of playing) {
    const { x, y } = p;
    act(s, p, movePlayer(p, keysOf(p.id), s.walls), x, y);
  }
  moveBullets(s, playing);
  moveNets(s, playing);
  moveHooks(s, playing);
  moveGifts(s);
  moveTraps(s, playing);
  moveWaves(s, playing);
  moveMeteors(s, playing);
  moveCrates(s, playing);
  moveClones(s);
  moveDogs(s, playing);
  moveStorms(s, playing);
  moveZips(s);
  moveWalls(s);
  guardTouch(s, playing);

  const inMatch = s.players.filter((p) => p.hero !== null);
  const scoring = inMatch.length >= 2;
  for (const p of playing) {
    if (p.y > H + OUT_MARGIN || p.x < -OUT_MARGIN || p.x > W + OUT_MARGIN) {
      // Whoever hit you within the last 5 s gets the KO.
      const by = p.lt > 0 ? p.lh : null;
      s.fx.push({ k: 'ko', id: p.id, x: p.x, y: Math.min(H, p.y), f: p.f, by });
      if (scoring) {
        p.lives--;
        p.falls++;
        const scorer = s.players.find((o) => o.id === by);
        if (scorer) scorer.kos++;
      }
      // A hook or zip in progress lets go if either end of it is gone.
      s.hooks = s.hooks.filter((k) => k.o !== p.id && k.c !== p.id);
      s.zips = s.zips.filter((z) => z.o !== p.id && z.c !== p.id);
      if (p.lives > 0) spawn(p);
    }
  }
  if (scoring) {
    const alive = inMatch.filter((p) => p.lives > 0);
    if (alive.length <= 1) {
      s.over = END_HOLD;
      s.win = alive.length ? alive[0].id : null;
      if (alive.length) alive[0].wins++;
    }
  }
}

// What everyone is sent each step. Short keys, because a phone's connection pays for every byte.
export function snapshotOf(s) {
  return { t: 's', k: s.tick, p: s.players, u: s.bullets, n: s.nets, gr: s.gifts, v: s.waves, c: s.crates, r: s.rocks, cl: s.clones, tp: s.traps, hk: s.hooks, dg: s.dogs, wl: s.walls, sm: s.storms, zs: s.zips, x: s.fx, o: s.over, w: s.win, pk: s.pick, m: s.map, ch: s.choice, h: s.host };
}
