// The practice bots' brain. A bot only ever presses the same keys a player can, under the same rules: no stat bonuses at any level.
// Every few steps it tries its possible moves through the real movePlayer, scores where each one ends up against what it can see coming, and takes the best.
// Levels differ in how late and how often it notices things, how much noise is in its choices, and which tricks it knows.
import {
  ANGLER, AQUILLES, BIKE_HIT, CASSIO, DEXTAR, DOG_REACH, DUSK, GIFT_RADIUS, GUARD_TOUCH, GUNS, H, HANDLER, HOOK_HIT, ILLUSIONIST, KEY, KNIFE_HIT, MAX_RUN, METEOR_RADIUS, MOSSBACK, NET_RADIUS, NINJA, OUT_MARGIN, PISTOL, PLATFORMS,
  POACHER, RIME, ROCKET, ROCKET_RADIUS, SANTA, SCREEN_H, SEEDEA, SHADE, SHIFTER, SHOTGUN, FLAME, SNIPER, SNIPER_GUN, SPRINTER, STORM_RADIUS, TETHER, TRAP_REACH, TRAPPER, VAC_RADIUS, VI, W, WALL_H, WALL_W, WAVE_HEIGHT, bodySize, movePlayer, muzzleY,
} from './sim.js';

// think: steps between plans. horizon: steps tried ahead. react: steps before it reacts to a new threat. notice: chance it reacts at all.
// noise: randomness in its choices. fire: chance it takes a shot it could take. lead: aims where you'll be. skill: chance per step it uses a skill it has a reason to use.
// defend: uses skills to block or escape. dash: dashes to dodge; rescue: dashes only to get back from the edge. crate: how far it goes for a crate.
// edge: fights from the inside to push you off. line: gets out of the way of shots you haven't fired yet. predict: learns your habits.
export const LEVELS = {
  easy: { label: 'Easy', blurb: 'Slow and clumsy. Never dodges.', think: 12, horizon: 18, react: 14, notice: 0, noise: 70, fire: 0.2, lead: false, skill: 0.01, defend: false, dash: false, rescue: false, crate: 0, edge: false, line: false, predict: false, focus: 0.7 },
  medium: { label: 'Medium', blurb: 'Jumps over your shots and skills.', think: 6, horizon: 20, react: 11, notice: 0.7, noise: 25, fire: 0.5, lead: false, skill: 0.04, defend: false, dash: false, rescue: true, crate: 140, edge: false, line: false, predict: false, focus: 0.7 },
  hard: { label: 'Hard', blurb: 'Blocks and counters your skills with its own.', think: 4, horizon: 22, react: 6, notice: 0.9, noise: 8, fire: 0.75, lead: true, skill: 0.2, defend: true, dash: true, rescue: true, crate: 260, edge: false, line: false, predict: false, focus: 0.7 },
  veryhard: { label: 'Very hard', blurb: 'Learns your habits and predicts your moves.', think: 2, horizon: 24, react: 1, notice: 1, noise: 0, fire: 1, lead: true, skill: 1, defend: true, dash: true, rescue: true, crate: 400, edge: true, line: true, predict: true, focus: 0.6 },
};

const SHOT_RANGE = { [PISTOL]: 220, [SHOTGUN]: 130, [FLAME]: 90, [ROCKET]: 300, [SNIPER_GUN]: 350 };
const TRACK_STEPS = 48;
const MAX_THREATS = 24;
const SEEN_LIMIT = 400;
const URGENT_STEPS = 8;
const DOOMED = 600;
const DEAD = 3000;
// The second jump and the dash are what save you from a fall, so they aren't spent on a dodge a single jump could do.
const DASH_COST = 45;
const RESCUE_DASH_COST = 5;
const JUMP_COST = 2;
const SECOND_JUMP_COST = 12;
const HIT_WEIGHT = { net: 40, hook: 70, wave: 30, storm: 60, gift: 60, rock: 40, dog: 25, guard: 30, trap: 40, bike: 70, knife: 45, vac: 55 };

// ---------- Moves to try ----------

function moves(onGround) {
  const list = [];
  for (const dir of [-1, 0, 1]) {
    if (onGround) {
      for (const [j1, j2] of [[-1, -1], [0, -1], [0, 8]]) list.push({ dir, j1, j2, down: false, dash: false });
      list.push({ dir, j1: -1, j2: -1, down: true, dash: false });
    } else {
      for (const j1 of [-1, 0, 4, 10]) list.push({ dir, j1, j2: -1, down: false, dash: false });
    }
    if (dir) {
      list.push({ dir, j1: -1, j2: -1, down: false, dash: true });
      list.push({ dir, j1: 0, j2: -1, down: false, dash: true });
    }
  }
  return list;
}
const GROUND_MOVES = moves(true);
const AIR_MOVES = moves(false);

function moveKeys(c, t) {
  let k = c.dir < 0 ? KEY.LEFT : c.dir > 0 ? KEY.RIGHT : 0;
  if (t === c.j1 || t === c.j2) k |= KEY.JUMP;
  if (c.down && t < 4) k |= KEY.DOWN;
  if (c.dash && t === 0) k |= KEY.DASH;
  return k;
}

// ---------- The map ----------

const landingOn = (x, half, y) => {
  let best = -1;
  for (let i = 0; i < PLATFORMS.length; i++) {
    const pl = PLATFORMS[i];
    if (pl.y >= y - 2 && x + half > pl.x && x - half < pl.x + pl.w && (best < 0 || pl.y < PLATFORMS[best].y)) best = i;
  }
  return best;
};
const hasFloor = (x, y) => landingOn(x, 0, y) >= 0;

// Which platform to head for next to get from any platform to any other, worked out once per map.
const navs = new WeakMap();
export function navFor(platforms) {
  let nav = navs.get(platforms);
  if (nav) return nav;
  const n = platforms.length;
  const links = platforms.map((a) =>
    platforms.flatMap((b, j) => {
      if (a === b) return [];
      const gap = Math.max(0, b.x - (a.x + a.w), a.x - (b.x + b.w));
      const rise = a.y - b.y;
      return (rise > 0 ? rise <= 140 && gap <= 90 : gap <= 150) ? [j] : [];
    }),
  );
  nav = { hops: [], next: [] };
  for (let goal = 0; goal < n; goal++) {
    const hops = new Array(n).fill(Infinity);
    const next = new Array(n).fill(goal);
    hops[goal] = 0;
    const queue = [goal];
    while (queue.length) {
      const at = queue.shift();
      for (let i = 0; i < n; i++) {
        if (hops[i] === Infinity && links[i].includes(at)) {
          hops[i] = hops[at] + 1;
          next[i] = at;
          queue.push(i);
        }
      }
    }
    nav.hops.push(hops);
    nav.next.push(next);
  }
  navs.set(platforms, nav);
  return nav;
}

// ---------- What a player will do next ----------

const scratchTrack = {};

// Where someone will be if they keep doing this. xs[0] is where they are now.
function track(out, who, keysAt, walls, falls) {
  Object.assign(scratchTrack, who);
  for (let i = 0; i < TRACK_STEPS; i++) {
    out.xs[i] = scratchTrack.x;
    out.ys[i] = scratchTrack.y;
    movePlayer(scratchTrack, keysAt(i), walls, falls);
  }
  return out;
}
const newTrack = () => ({ xs: new Float32Array(TRACK_STEPS), ys: new Float32Array(TRACK_STEPS) });
const held = (who) => who.b & (KEY.LEFT | KEY.RIGHT | KEY.DOWN);

// The watcher learns what a player tends to do next in each kind of situation, so very hard bots can aim where a habit will take them.
const ACTIONS = { NONE: 0, JUMP: 1, DROP: 2, DASH: 3, TURN: 4, STOP: 5 };
const WINDOW = 10;
const FORGET = 0.97;
const MIN_SEEN = 4;
const SURE = 0.5;

export const newWatcher = () => ({ table: new Map(), open: null, last: new Map() });

function situation(s, p) {
  const dir = (p.b & KEY.RIGHT ? 1 : 0) - (p.b & KEY.LEFT ? 1 : 0);
  let foe = null;
  let far = Infinity;
  for (const o of s.players) {
    const gap = Math.abs(o.x - p.x);
    if (o.id !== p.id && o.lives > 0 && gap < far) {
      far = gap;
      foe = o;
    }
  }
  const moving = !dir ? 0 : foe && Math.sign(foe.x - p.x) === dir ? 1 : 2;
  const shotAt = s.bullets.some((b) => b.o !== p.id && (p.x - b.x) * b.vx > 0 && Math.abs(p.x - b.x) < 260 && b.y > p.y - 40 && b.y < p.y + 4);
  const edge = dir !== 0 && !hasFloor(p.x + dir * 60, p.y);
  return (p.g ? 1 : 0) + (shotAt ? 2 : 0) + moving * 4 + (edge ? 12 : 0);
}

// Call once per step for the player being studied.
export function observe(w, s, p) {
  if (!p || p.lives <= 0 || p.hero === null || s.pick > 0 || s.over > 0) {
    w.open = null;
    return;
  }
  const was = w.last.get(p.id) ?? 0;
  w.last.set(p.id, p.b);
  const press = (key) => p.b & key && !(was & key);
  const dirOf = (b) => (b & KEY.RIGHT ? 1 : 0) - (b & KEY.LEFT ? 1 : 0);
  const before = dirOf(was);
  const now = dirOf(p.b);
  const action = press(KEY.JUMP) ? ACTIONS.JUMP : press(KEY.DASH) ? ACTIONS.DASH : press(KEY.DOWN) ? ACTIONS.DROP : before && now === -before ? ACTIONS.TURN : before && !now ? ACTIONS.STOP : ACTIONS.NONE;
  if (w.open) {
    w.open.left--;
    if (action || w.open.left <= 0) {
      const row = w.table.get(w.open.at) ?? new Array(6).fill(0);
      for (let i = 0; i < row.length; i++) row[i] *= FORGET;
      row[action]++;
      w.table.set(w.open.at, row);
      w.open = null;
    }
  }
  if (!w.open) w.open = { at: situation(s, p), left: WINDOW };
}

// What this player will probably do next, if the watcher is sure enough.
export function guess(w, s, p) {
  const row = w.table.get(situation(s, p));
  if (!row) return ACTIONS.NONE;
  const total = row.reduce((sum, n) => sum + n, 0);
  if (total < MIN_SEEN) return ACTIONS.NONE;
  const top = row.indexOf(Math.max(...row));
  return row[top] / total >= SURE ? top : ACTIONS.NONE;
}
export { ACTIONS };

function habitKeys(action, who) {
  const dirs = who.b & (KEY.LEFT | KEY.RIGHT);
  const flipped = dirs === KEY.LEFT ? KEY.RIGHT : dirs === KEY.RIGHT ? KEY.LEFT : 0;
  return (t) => {
    if (action === ACTIONS.JUMP) return dirs | (t === 1 ? KEY.JUMP : 0);
    if (action === ACTIONS.DASH) return dirs | (t === 1 ? KEY.DASH : 0);
    if (action === ACTIONS.DROP) return dirs | (t < 4 ? KEY.DOWN : 0);
    if (action === ACTIONS.TURN) return flipped;
    if (action === ACTIONS.STOP) return 0;
    return dirs;
  };
}

// ---------- What it can see coming ----------

const foeOf = (s, id) => s.players.find((o) => o.id === id);

function notice(s, b, id) {
  let entry = b.seen.get(id);
  if (!entry) {
    if (b.seen.size > SEEN_LIMIT) b.seen.clear();
    entry = { at: s.tick, sees: Math.random() < b.level.notice };
    b.seen.set(id, entry);
  }
  if (entry.sees && s.tick - entry.at === b.level.react) b.urgent = true;
  return entry.sees && s.tick - entry.at >= b.level.react;
}

function lineBlocked(s, fromX, toX, y) {
  const lo = Math.min(fromX, toX);
  const hi = Math.max(fromX, toX);
  return s.falls.some((f) => f.x > lo && f.x < hi) || s.walls.some((w) => w.x > lo && w.x < hi && y > w.y - WALL_H && y < w.y) || s.screens.some((c) => c.hp > 0 && c.x > lo && c.x < hi && y > c.y - SCREEN_H && y < c.y);
}

function readThreats(s, p, b) {
  const list = [];
  const add = (t) => list.length < MAX_THREATS && list.push(t);
  const within = (x, y, range) => Math.abs(x - p.x) < range && Math.abs(y - p.y) < range;
  for (const u of s.bullets) {
    if (u.o === p.id || !notice(s, b, u.id)) continue;
    const coming = (p.x - u.x) * u.vx > -40;
    if (!coming || Math.abs(p.x - u.x) > Math.abs(u.vx) * Math.min(u.t, b.level.horizon + 2) + 60 || lineBlocked(s, u.x, p.x, u.y)) continue;
    const rocket = u.g === ROCKET;
    add({ kind: 'shot', x: u.x, y: u.y, vx: u.vx, vy: u.vy, ttl: u.t, extra: GUNS[u.g].hit ?? 0, near: rocket ? ROCKET_RADIUS / 2 : 0, cost: u.k * (rocket ? 3 : 1.5), push: Math.sign(u.vx) });
  }
  for (const n of s.nets) if (n.o !== p.id && notice(s, b, n.id)) add({ kind: 'ball', x: n.x, y: n.y, vx: n.vx, vy: n.vy, ttl: n.t, radius: NET_RADIUS, cost: HIT_WEIGHT.net, push: Math.sign(n.vx) });
  for (const n of s.bikes) if (n.o !== p.id && notice(s, b, n.id)) add({ kind: 'ball', x: n.x, y: n.y, vx: n.vx, vy: 0, ttl: n.t, radius: BIKE_HIT, cost: HIT_WEIGHT.bike, push: 0 });
  for (const n of s.knives) if (n.o !== p.id && notice(s, b, n.id)) add({ kind: 'ball', x: n.x, y: n.y, vx: n.vx, vy: 0, ttl: n.t, radius: KNIFE_HIT, cost: HIT_WEIGHT.knife, push: 0 });
  for (const v of s.vacs) if (v.open && v.o !== p.id && notice(s, b, v.id)) add({ kind: 'vac', x: v.x, y: v.y, ttl: v.t, cost: HIT_WEIGHT.vac, push: 0 });
  for (const r of s.rocks) if (notice(s, b, r.id) && within(r.x, r.y, 400)) add({ kind: 'ball', x: r.x, y: r.y, vx: r.vx, vy: r.vy, ttl: 60, radius: METEOR_RADIUS, cost: HIT_WEIGHT.rock, push: Math.sign(r.vx) || 1 });
  for (const k of s.hooks) if (k.o !== p.id && k.c === undefined && notice(s, b, k.id)) add({ kind: 'ball', x: k.x, y: k.y, vx: k.vx, vy: 0, ttl: k.t, radius: HOOK_HIT, cost: HIT_WEIGHT.hook, push: -k.f });
  for (const w of s.waves) if (w.o !== p.id && !w.hit.includes(p.id) && notice(s, b, w.id)) add({ kind: 'wave', x: w.x, y: w.y, vx: w.vx, ttl: w.t, cost: HIT_WEIGHT.wave, push: Math.sign(w.vx) });
  for (const w of s.storms) if (w.o !== p.id && notice(s, b, w.id)) add({ kind: 'storm', x: w.x, y: w.y, vx: w.vx, ttl: w.t, cost: HIT_WEIGHT.storm, push: Math.sign(w.vx) });
  // A gift isn't worth following bounce by bounce: it slows quickly and its blast is 200 wide.
  for (const g of s.gifts) if (g.o !== p.id && notice(s, b, g.id)) add({ kind: 'gift', x: g.x + g.vx * g.t * 0.5, y: g.y, ttl: g.t, cost: HIT_WEIGHT.gift, push: 0 });
  for (const d of s.dogs) if (d.o !== p.id && notice(s, b, d.id) && within(d.x, d.y, 300)) add({ kind: 'dog', x: d.x, y: d.y, ttl: d.t, cost: HIT_WEIGHT.dog, push: d.f });
  for (const t of s.traps) if (t.o !== p.id && t.g && notice(s, b, t.id) && within(t.x, t.y, 200)) add({ kind: 'trap', x: t.x, y: t.y, ttl: 999, cost: HIT_WEIGHT.trap, push: 0 });
  for (const o of s.players) {
    if (o.id === p.id || o.lives <= 0 || o.hero === null) continue;
    if (o.gd > 0 && within(o.x, o.y, 160) && b.level.defend) add({ kind: 'guard', x: o.x, y: o.y, ttl: o.gd, cost: HIT_WEIGHT.guard, push: Math.sign(p.x - o.x) || 1 });
    // A shot that hasn't been fired yet. Beams and hooks are too fast to dodge afterwards, so a very hard bot won't stand in line for one.
    if (b.level.line && o.iv === 0) {
      const beam = GUNS[o.gun].beam && o.c === 0;
      const castable = (o.hero === ANGLER || o.hero === TRAPPER) && o.cd === 0;
      if (beam || castable) add({ kind: 'line', x: o.x, y: muzzleY(o), f: o.f, ttl: 999, after: 0, cost: castable ? 30 : 18, push: o.f });
      // Ending a move level with a gun pointing at you means dodging a stream of bullets with your jumps already spent.
      else add({ kind: 'line', x: o.x, y: muzzleY(o), f: o.f, ttl: 999, after: b.level.horizon - 8, cost: GUNS[o.gun].knock * 0.6, push: o.f });
    }
  }
  return list;
}

function threatHits(th, q, t, half, height) {
  if (t > th.ttl) return false;
  switch (th.kind) {
    case 'shot': {
      const x = th.x + th.vx * t;
      const y = th.y + th.vy * t;
      const reach = half + (th.extra || 6) + th.near;
      const lo = Math.min(x, x - th.vx);
      const hi = Math.max(x, x - th.vx);
      return q.x > lo - reach && q.x < hi + reach && y > q.y - height - th.extra - th.near && y < q.y + th.extra + th.near;
    }
    case 'ball': {
      const x = th.x + th.vx * t;
      const y = th.y + th.vy * t;
      return Math.abs(x - q.x) < half + th.radius && y > q.y - height - th.radius && y < q.y + th.radius;
    }
    case 'wave':
      return Math.abs(q.x - (th.x + th.vx * t)) <= 26 && Math.abs(q.y - height / 2 - th.y) <= WAVE_HEIGHT / 2;
    case 'storm':
      return Math.hypot(q.x - (th.x + th.vx * t), q.y - height / 2 - th.y) <= STORM_RADIUS;
    case 'vac':
      return Math.hypot(q.x - th.x, q.y - th.y) <= VAC_RADIUS;
    case 'gift':
      return t === th.ttl && Math.hypot(q.x - th.x, q.y - height / 2 - th.y) <= GIFT_RADIUS;
    case 'dog':
      // A dog runs at you, so anywhere close enough for it to reach by then counts.
      return Math.abs(q.x - th.x) < DOG_REACH + t * 5 && Math.abs(q.y - th.y) < 40 && t < 12;
    case 'guard':
      return Math.abs(q.x - th.x) <= GUARD_TOUCH && Math.abs(q.y - th.y) <= height;
    case 'trap':
      return q.g && Math.abs(q.y - th.y) <= 4 && Math.abs(q.x - th.x) <= half + TRAP_REACH;
    case 'line':
      return t >= th.after && Math.sign(q.x - th.x) === th.f && th.y > q.y - height && th.y < q.y;
    default:
      return false;
  }
}

// ---------- Scoring a move ----------

// How far a body still has to go to land on something, past what its jumps and dash can cover. 0 means it can make it.
function shortfall(q, half) {
  const carry = Math.abs(q.vx) > MAX_RUN ? (q.vx - Math.sign(q.vx) * MAX_RUN) / 0.04 : 0;
  const x = q.ds > 0 ? q.x : q.x + carry;
  const rise = (q.j >= 2 ? 150 : q.j === 1 ? 75 : 0) + (q.vy < 0 ? (q.vy * q.vy) / 3.2 : 0);
  const across = MAX_RUN * (q.j * 25 + 12) + (q.dc === 0 ? 110 : 0);
  let best = Infinity;
  let near = Infinity;
  for (const pl of PLATFORMS) {
    const gap = Math.max(0, pl.x - x - half, x + half - (pl.x + pl.w));
    const past = Math.max(0, gap - across) + Math.max(0, q.y - pl.y - rise);
    if (past < best) best = past;
    if (gap < near) near = gap;
  }
  return { past: best, gap: near };
}

const roll = { hitIn: -1, threat: null, doomed: false };
const scratchBody = {};

function tryMove(c, p, s, plan) {
  const { threats, horizon, goal, nav, aim, gunNow } = plan;
  const q = Object.assign(scratchBody, p);
  let score = 0;
  let hitMask = 0;
  let shotDone = !aim;
  roll.hitIn = -1;
  roll.threat = null;
  roll.doomed = false;
  if (c.dash) score -= plan.onStage ? DASH_COST : RESCUE_DASH_COST;
  if (c.j1 >= 0) score -= p.g ? JUMP_COST : SECOND_JUMP_COST;
  if (c.j2 >= 0) score -= SECOND_JUMP_COST;
  for (let t = 0; t < horizon; t++) {
    movePlayer(q, moveKeys(c, t), s.walls, s.falls);
    const size = bodySize(q);
    if (q.i <= 0 && q.gd <= 0) {
      for (let n = 0; n < threats.length; n++) {
        if (hitMask & (1 << n)) continue;
        const th = threats[n];
        if (!threatHits(th, q, t + 1, size.w / 2, size.h)) continue;
        hitMask |= 1 << n;
        if (roll.hitIn < 0) {
          roll.hitIn = t + 1;
          roll.threat = th;
        }
        // A hit next to a drop is a lost life, not just a shove.
        const ledge = th.push && !hasFloor(q.x + th.push * 170, q.y) ? 2.5 : 1;
        score -= th.cost * ledge * (q.sh > 0 ? 0.3 : 1) * (1 - t / (horizon * 2));
      }
    }
    if (!shotDone && q.f === aim.dir) {
      const flight = gunNow.beam ? 0 : Math.ceil(Math.abs(aim.track.xs[0] - q.x) / gunNow.speed);
      const i = Math.min(t + flight, TRACK_STEPS - 1);
      const by = muzzleY(q);
      if (by > aim.track.ys[i] - aim.height && by < aim.track.ys[i]) {
        score += aim.worth * (1 - t / (horizon * 2));
        shotDone = true;
      }
    }
    if (q.y > H + OUT_MARGIN || q.x < -OUT_MARGIN || q.x > W + OUT_MARGIN) {
      roll.doomed = true;
      return score - DEAD;
    }
  }
  const half = bodySize(q).w / 2;
  const at = landingOn(q.x, half, q.y);
  if (at < 0) {
    const { past, gap } = shortfall(q, half);
    if (past > 0) {
      roll.doomed = true;
      return score - DOOMED - past * 2;
    }
    return score - 40 - gap - (2 - Math.min(q.j, 2)) * 30;
  }
  let way = Math.abs(q.x - goal.x);
  if (goal.at >= 0 && goal.at !== at) {
    const hops = nav.hops[goal.at][at];
    const pl = PLATFORMS[nav.next[goal.at][at]];
    const hopX = Math.max(pl.x + 20, Math.min(pl.x + pl.w - 20, q.x));
    way = (hops === Infinity ? 6 : hops) * 100 + Math.abs(q.x - hopX);
  }
  score -= way;
  if (q.g && (!hasFloor(q.x - 40, q.y) || !hasFloor(q.x + 40, q.y))) score -= 12;
  return score;
}

// ---------- Who to fight and where to stand ----------

function chooseTarget(s, p, b) {
  let best = null;
  let bestScore = Infinity;
  for (const o of s.players) {
    if (o.id === p.id || o.lives <= 0 || o.hero === null || o.iv > 0 || o.i > 0) continue;
    let score = Math.hypot(o.x - p.x, (o.y - p.y) * 1.5) * (o.id === b.human ? b.level.focus : 1);
    if (o.id === b.targetId) score *= 0.75;
    if (score < bestScore) {
      bestScore = score;
      best = o;
    }
  }
  b.targetId = best ? best.id : null;
  // Only the two easier levels are fooled by an Illusionist's copies.
  if (!b.level.defend) {
    for (const c of s.clones) {
      if (c.o !== p.id && Math.hypot(c.x - p.x, c.y - p.y) * b.level.focus < bestScore) {
        bestScore = Math.hypot(c.x - p.x, c.y - p.y) * b.level.focus;
        best = c;
      }
    }
  }
  return best;
}

function chooseGoal(s, p, b, foe) {
  const L = b.level;
  if (L.crate) {
    for (const c of s.crates) {
      if (c.g && Math.hypot(c.x - p.x, c.y - p.y) < L.crate && (!foe || Math.abs(foe.x - c.x) > Math.abs(p.x - c.x))) {
        return { x: c.x, at: landingOn(c.x, 0, c.y) };
      }
    }
  }
  if (!foe) return { x: W / 2, at: landingOn(W / 2, 0, 0) };
  const at = landingOn(foe.x, 0, foe.y);
  const range = SHOT_RANGE[p.gun] ?? 240;
  // Pushing you off means standing between you and the middle of the arena.
  const side = L.edge ? Math.sign(W / 2 - foe.x) || 1 : Math.sign(p.x - foe.x) || 1;
  let x = foe.x + side * range;
  if (p.hero === SHADE && p.iv > 0) x = foe.x + side * 120;
  if (at >= 0) {
    const pl = PLATFORMS[at];
    x = Math.max(pl.x + 20, Math.min(pl.x + pl.w - 20, x));
  }
  return { x, at };
}

// ---------- Skills ----------

// A skill to use right now, as the way to face while using it (0 = whichever way it's facing). null means don't.
function chooseSkill(s, p, b, foe, info) {
  const L = b.level;
  const danger = info.hitIn >= 0 && info.hitIn <= URGENT_STEPS;
  const caught = p.n > 0 || p.jw > 0;
  const shot = info.threat && (info.threat.kind === 'shot' || info.threat.kind === 'ball');
  const faceThreat = info.threat ? Math.sign(info.threat.x - p.x) || p.f : p.f;

  if (p.hero === NINJA && p.st > 0) {
    // Swapping back breaks a net and escapes a drop. Any time before the log fades it also gives 3 shurikens.
    if (L.defend && (info.doomed || caught || danger)) return 0;
    if (p.st < 20 && p.g && Math.random() < L.skill * 5) return 0;
    return null;
  }
  // The second press of these two doesn't wait for the cooldown.
  if (p.hero === CASSIO && p.bk > 0) {
    if (!foe || foe.gd > 0 || foe.i > 0) return p.bk < 10 ? 0 : null;
    const near = Math.abs(foe.y - p.y) < 30 && Math.abs(foe.x - p.x) < 640 && !lineBlocked(s, p.x, foe.x, muzzleY(p));
    return (near && Math.random() < Math.max(L.skill, 0.05)) || p.bk < 10 ? Math.sign(foe.x - p.x) || p.f : null;
  }
  if (p.hero === DEXTAR && p.mr > 0) {
    // Harder bots save it to catch you at a ledge, but never let the mark run out.
    const prey = s.players.find((o) => o.id === p.mk);
    const worth = !L.edge || (prey && !hasFloor(prey.x + prey.f * 120, prey.y));
    return p.mr < 30 || (worth && Math.random() < Math.max(L.skill, 0.05)) ? 0 : null;
  }
  if (p.cd > 0) return null;

  if (L.defend) {
    if (danger) {
      if (p.hero === AQUILLES || p.hero === ILLUSIONIST || p.hero === SPRINTER || p.hero === SHADE) return 0;
      if ((p.hero === MOSSBACK || p.hero === HANDLER || p.hero === SEEDEA) && shot) return faceThreat;
      if (p.hero === SHIFTER && info.threat.kind === 'shot' && p.g) return 0;
    }
    if (p.hero === TETHER && (info.doomed || danger) && s.players.some((o) => o.id !== p.id && o.lives > 0 && o.iv === 0 && o.i === 0 && !(o.gd > 0))) return 0;
  }

  if (!foe || foe.gd > 0 || foe.i > 0 || Math.random() >= (foe.n > 0 || foe.jw > 0 || foe.hk > 0 ? Math.min(1, L.skill * 3) : L.skill)) return null;
  const dx = foe.x - p.x;
  const across = Math.abs(dx);
  const up = Math.abs(foe.y - p.y);
  const face = Math.sign(dx) || p.f;
  const clear = !lineBlocked(s, p.x, foe.x, muzzleY(p));
  // Is this enemy one shove from the drop, on the side we'd push them?
  const onEdge = !hasFloor(foe.x + face * 120, foe.y);
  switch (p.hero) {
    case SNIPER:
      return up < 18 && across > 120 && clear ? face : null;
    case TRAPPER:
      return up < 30 && across < 650 && clear ? face : null;
    case NINJA:
      return p.g && across < 420 && hasFloor(p.x - 60, p.y) && hasFloor(p.x + 60, p.y) ? 0 : null;
    case SPRINTER:
      return up < 40 && across < 500 ? face : null;
    case SHIFTER:
      return across < 300 && up < 40 && !L.defend ? face : null;
    case SANTA:
      return across < (onEdge ? 260 : 160) && up < 110 ? face : null;
    case DUSK:
      return up < WAVE_HEIGHT / 2 && across < 650 ? face : null;
    case AQUILLES:
      // A very hard bulwark keeps its guard for blocking, unless the shove itself would knock someone off.
      return across < 70 && up < 40 && (onEdge || !L.edge) ? face : null;
    case ILLUSIONIST:
      return !L.defend && across < 500 && up < 40 ? face : null;
    case POACHER:
      return foe.g && up < 20 && across < 240 ? face : null;
    case ANGLER: {
      if (up > 22 || !clear) return null;
      // The catch lands just behind the thrower, so with a drop behind them it's a lost life.
      const dropBehind = !hasFloor(p.x - face * 40, p.y);
      return !L.edge || dropBehind || onEdge || Math.random() < 0.03 ? face : null;
    }
    case HANDLER:
      return across < 600 ? face : null;
    case MOSSBACK:
      return !L.defend && across < 260 && up < 30 ? face : null;
    case RIME:
      return up < STORM_RADIUS && across < 450 ? face : null;
    case TETHER:
      return !L.defend ? (across > 220 ? 0 : null) : onEdge && across > 120 ? 0 : null;
    case SHADE:
      return across < 320 && up < 60 && !L.defend ? 0 : null;
    case SEEDEA:
      return !L.defend && across > 90 && across < 400 && up < 60 ? face : null;
    case CASSIO:
      return across > 180 && across < 800 ? face : null;
    case DEXTAR:
      return up < 22 && across < 900 && clear ? face : null;
    case VI:
      return across > 140 && across < 400 && up < 60 ? face : null;
    default:
      return null;
  }
}

// ---------- One bot ----------

export function newBrain(id, level, human = 0, watcher = null) {
  // Started at different points, so bots don't all plan on the same step.
  return { id, level, human, watcher, plan: null, at: id * 7, seen: new Map(), urgent: false, targetId: null, info: { hitIn: -1, threat: null, doomed: false }, track: newTrack(), habit: newTrack(), haveHabit: false, trackAt: 0 };
}

function makePlan(s, p, b, foe) {
  const L = b.level;
  const threats = readThreats(s, p, b);
  const real = foe && foe.hero !== undefined;
  let aim = null;
  if (foe && L.lead && real) {
    track(b.track, foe, () => held(foe), s.walls, s.falls);
    const action = L.predict && b.watcher && foe.id === b.human ? guess(b.watcher, s, foe) : ACTIONS.NONE;
    b.haveHabit = action !== ACTIONS.NONE;
    if (b.haveHabit) track(b.habit, foe, habitKeys(action, foe), s.walls, s.falls);
    b.trackAt = s.tick;
    const worth = 28 * (L.edge && !hasFloor(foe.x + Math.sign(foe.x - p.x) * 120, foe.y) ? 2 : 1);
    aim = foe.gd > 0 || foe.i > 0 ? null : { dir: Math.sign(foe.x - p.x) || p.f, track: b.haveHabit ? b.habit : b.track, height: bodySize(foe).h, worth };
  }
  const onStage = landingOn(p.x, bodySize(p).w / 2, p.y) >= 0;
  const plan = { threats, horizon: L.horizon, goal: chooseGoal(s, p, b, foe), nav: navFor(PLATFORMS), aim, gunNow: GUNS[p.gun], onStage };
  let best = null;
  let bestScore = -Infinity;
  // Clumsiness goes into which way it walks. Random jumps would dodge shots by accident.
  const wander = L.noise ? [Math.random() * L.noise, Math.random() * L.noise, Math.random() * L.noise] : null;
  for (const c of p.g ? GROUND_MOVES : AIR_MOVES) {
    if (c.dash && (p.dc > 0 || !(L.dash || (L.rescue && !onStage)))) continue;
    if (c.j1 >= 0 && !p.g && p.j === 0) continue;
    let score = tryMove(c, p, s, plan);
    if (wander) score += wander[c.dir + 1];
    // Changing its mind every step looks like shaking.
    if (b.plan && c.dir === b.plan.dir) score += 3;
    if (score > bestScore) {
      bestScore = score;
      best = c;
      b.info.hitIn = roll.hitIn;
      b.info.threat = roll.threat;
      b.info.doomed = roll.doomed;
    }
  }
  b.plan = best;
  b.at = 0;
  b.urgent = false;
}

function wantShot(s, p, b, foe) {
  if (!foe || p.c > 0 || foe.gd > 0 || foe.i > 0) return 0;
  const L = b.level;
  const gun = GUNS[p.eb ? SNIPER_GUN : p.gun];
  const dir = Math.sign(foe.x - p.x) || p.f;
  const across = Math.abs(foe.x - p.x);
  if (!gun.beam && across > gun.speed * gun.life) return 0;
  // Coming out of hiding gives the sniper shot only once, so it's saved for a close one.
  if (p.iv > 0 && across > 220) return 0;
  const by = muzzleY(p);
  if (lineBlocked(s, p.x, foe.x, by)) return 0;
  const height = foe.hero === undefined ? 36 : bodySize(foe).h;
  let hits;
  if (L.lead && foe.hero !== undefined && b.targetId === foe.id) {
    const flight = (gun.beam ? 0 : Math.ceil(across / gun.speed)) + (s.tick - b.trackAt);
    const i = Math.min(flight, TRACK_STEPS - 1);
    const along = (t) => by > t.ys[i] - height && by < t.ys[i];
    hits = along(b.haveHabit ? b.habit : b.track);
  } else {
    hits = by > foe.y - height && by < foe.y;
  }
  return hits && Math.random() < L.fire ? dir : 0;
}

// The keys this bot presses this step.
export function botKeys(s, b) {
  const p = foeOf(s, b.id);
  if (!p || p.lives <= 0 || p.hero === null || p.zp > 0) return 0;
  const foe = chooseTarget(s, p, b);
  // Registered every step, so reaction time counts from when a shot really appeared.
  for (const u of s.bullets) if (u.o !== p.id) notice(s, b, u.id);
  if (!b.plan || b.at >= b.level.think || b.urgent) makePlan(s, p, b, foe);
  let keys = moveKeys(b.plan, b.at++);

  const urgent = b.info.hitIn >= 0 && b.info.hitIn <= URGENT_STEPS;
  const shotDir = wantShot(s, p, b, foe);
  if (shotDir && (shotDir === p.f || (!urgent && !b.info.doomed))) {
    keys |= KEY.SHOOT;
    if (shotDir !== p.f) keys = (keys & ~(KEY.LEFT | KEY.RIGHT)) | (shotDir < 0 ? KEY.LEFT : KEY.RIGHT);
  }
  const face = chooseSkill(s, p, b, foe, b.info);
  if (face !== null && !(p.b & KEY.SKILL)) {
    keys |= KEY.SKILL;
    if (face) keys = (keys & ~(KEY.LEFT | KEY.RIGHT)) | (face < 0 ? KEY.LEFT : KEY.RIGHT);
  }
  return keys;
}
