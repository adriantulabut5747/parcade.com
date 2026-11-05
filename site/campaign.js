// The campaign: the hero order, the stops on the trail, the parkour road, saved progress, and the two kinds of room a stop runs in.
// Rooms here look like a connection to client.js, the same way practice.js does, and need no server.
import { LEVELS, botKeys, newBrain } from './bot.js';
import {
  ANGLER, AQUILLES, CASSIO, DEXTAR, DUSK, H, HANDLER, ILLUSIONIST, KEY, LOOKOUT, MAPS, MOSSBACK, NET_STEPS, NINJA, PH, POACHER, PW, RIME, SANTA, SEEDEA, SHADE, SHIFTER, SNIPER, SPRINTER, STEPS_PER_SEC, TETHER, TRAPPER, TRAP_HOLD, VI, W,
  addPlayer, clearWorld, newGame, push, snapshotOf, spawn, startRound, step, usePlatforms,
} from './sim.js';

const HUMAN = 0;
const BOSS = 1;
export const HOLLOW = MAPS.findIndex((m) => m.name === 'Hunter’s Hollow');
const GROVE = MAPS.findIndex((m) => m.name === 'Mossback’s Grove');

// Adrian's formation, group by group. This one list sets the pick screen's order and the campaign's. He expects to change it.
// Region names are placeholders. `soon` is a hero who isn't in the game yet.
export const REGIONS = [
  { name: 'The Hunting Wood', look: 'wood', heroes: [SNIPER, TRAPPER, POACHER, MOSSBACK] },
  { name: 'Slow River', look: 'river', heroes: [ANGLER, HANDLER] },
  { name: 'The Hidden Valley', look: 'dojo', heroes: [NINJA], soon: 'Mae' },
  { name: 'The Sun Road', look: 'sun', heroes: [SPRINTER, AQUILLES, SANTA] },
  { name: 'Nightfall', look: 'night', heroes: [SHIFTER, ILLUSIONIST, DUSK, SHADE] },
  { name: 'The Storm Coast', look: 'storm', heroes: [SEEDEA, RIME, TETHER] },
  { name: 'The Drift', look: 'drift', heroes: [CASSIO, DEXTAR, VI] },
];
export const ROSTER = REGIONS.flatMap((r) => r.heroes);

// Only what's been built can be played. A boss uses its skill far more often than a plain bot of its level, so the fight shows what you're about to win. Same rules as anyone: no stat changes.
const BUILT_FIGHTS = new Map([
  [TRAPPER, { level: { ...LEVELS.easy, skill: 0.25 }, map: HOLLOW }],
  // Between Easy and Medium: straight Medium beat a beginner-level player 39 fights in 40.
  [POACHER, { level: { ...LEVELS.medium, think: 9, react: 13, notice: 0.35, noise: 45, fire: 0.32, skill: 0.2 }, map: HOLLOW }],
  [MOSSBACK, { level: { ...LEVELS.medium, skill: 0.2 }, map: GROVE }],
]);

// Rows sit where the arena's do, so one jump reaches a row 75 up. Numbers are checked by a real run in campaign-test.mjs.
// A road walks through the life of whoever you just beat, built around the skill you took from them.
// logs: swing over a floor. gusts: wind that blows on and off. rollers: send barrels along a row. foes: at most 3, because player ids index the 4 team colours.
// props: scenery standing on a floor. story: lines that show once as you pass x, with `at` naming who says them (none means you).
export const ROADS = [
  {
    name: 'Ken’s Village',
    tip: 'You are Ken here. His net holds a swinging log still and ties up a lookout for 4 seconds.',
    logs: [
      { x: 520, floor: 420, reach: 90, period: 96, phase: 0 },
      { x: 745, floor: 420, reach: 75, period: 84, phase: 2.2 },
    ],
    gusts: [{ x0: 1700, x1: 2130, dir: -1, on: 75, off: 75 }],
    rollers: [{ x: 3790, y: 270, dir: -1, every: 120 }],
    foes: [
      { kind: 'lookout', x: 2395, y: 420 },
      { kind: 'lookout', x: 3760, y: 270 },
    ],
    props: [
      { k: 'rack', x: -90, y: 420 },
      { k: 'house', x: 240, y: 420 },
      { k: 'house', x: 1590, y: 195 },
      { k: 'crutch', x: 1496, y: 195 },
      { k: 'rack', x: 2265, y: 420 },
      { k: 'house', x: 3470, y: 270 },
    ],
    story: [
      { x: 60, text: 'Ken. “Nobody escaped his net.” One name crossed off.' },
      { x: 200, who: 'A voice', at: { x: 214, y: 340 }, text: 'Ken! You’re back early.' },
      { x: 200, who: 'A voice', at: { x: 214, y: 340 }, text: '...You’re not Ken.' },
      { x: 370, text: 'His net works for me now. It holds a swinging log still and ties up a lookout.' },
      { x: 1470, text: 'A child’s crutch by the door. I keep moving.' },
      { x: 2225, who: 'Lookout', at: { x: 2395, y: 345 }, text: 'That’s Ken’s coat. Where’s Ken?' },
      { x: 3405, who: 'A voice', at: { x: 3444, y: 190 }, text: 'Tell Ken his boy keeps asking for him.' },
    ],
    start: { x: 120, y: 420 },
    goal: { x: 3660, y: 270 },
    end: 3800,
    platforms: [
      { x: -500, y: 420, w: 860 },
      { x: 440, y: 420, w: 160 },
      { x: 680, y: 420, w: 130 },
      { x: 890, y: 385, w: 130 },
      { x: 1090, y: 345, w: 120 },
      { x: 1270, y: 270, w: 110 },
      { x: 1450, y: 195, w: 200 },
      { x: 1760, y: 270, w: 100 },
      { x: 1960, y: 345, w: 100 },
      { x: 2170, y: 420, w: 260 },
      { x: 2540, y: 420, w: 80 },
      { x: 2760, y: 420, w: 80 },
      { x: 2980, y: 345, w: 80 },
      { x: 3200, y: 270, w: 80 },
      { x: 3400, y: 270, w: 400 },
    ],
    checks: [
      { x: 1550, y: 195 },
      { x: 2215, y: 420 },
    ],
    traps: [
      { x: 2320, y: 420 },
      { x: 3520, y: 270 },
    ],
  },
  {
    name: 'Ethan’s Camp',
    // The last stretch is already Mossback's land: the forest fades into jungle, and everything past mossFrom is overgrown.
    jungle: { from: 3150, to: 3620 },
    mossFrom: 3400,
    gate: 'moss',
    tip: 'You are Ethan here. His bear traps catch the guards who chase you and hold them for 4 seconds.',
    logs: [
      { x: 575, floor: 420, reach: 85, period: 92, phase: 0 },
      { x: 3750, floor: 270, reach: 80, period: 88, phase: 1 },
    ],
    gusts: [{ x0: 2300, x1: 2810, dir: -1, on: 70, off: 80 }],
    rollers: [{ x: 3320, y: 420, dir: -1, every: 105 }],
    foes: [
      { kind: 'guard', x: 1330, y: 345 },
      { kind: 'guard', x: 2160, y: 195 },
      { kind: 'lookout', x: 3290, y: 420 },
    ],
    props: [
      { k: 'hides', x: -70, y: 420 },
      { k: 'fire', x: 110, y: 420 },
      { k: 'tent', x: 270, y: 420 },
      { k: 'tent', x: 1060, y: 345 },
      { k: 'cage', x: 1950, y: 195 },
      { k: 'hides', x: 2970, y: 420 },
      { k: 'tent', x: 3180, y: 420 },
      { k: 'fern', x: 3462, y: 345 },
      { k: 'boulder', x: 3506, y: 345 },
      { k: 'fern', x: 3664, y: 270 },
      { k: 'idol', x: 3700, y: 270 },
      { k: 'boulder', x: 3812, y: 270 },
      { k: 'fern', x: 3905, y: 270 },
      { k: 'boulder', x: 4050, y: 270 },
      { k: 'fern', x: 4016, y: 270 },
    ],
    story: [
      { x: 60, text: 'Ethan. “He sold everything he caught.” Two names crossed off.' },
      { x: 330, text: 'His traps came with the boots. They stop anyone who chases me.' },
      { x: 965, who: 'A voice', at: { x: 1060, y: 265 }, text: 'Ethan? You said you’d be back by dark.' },
      { x: 965, who: 'A voice', at: { x: 1060, y: 265 }, text: '...Those are his boots. Where is he?' },
      { x: 1860, text: 'A fox with a bandaged leg. Someone has been feeding it.' },
      { x: 2860, who: 'Lookout', at: { x: 3290, y: 345 }, text: 'Get away from his things!' },
      { x: 3030, who: 'A voice', at: { x: 3180, y: 300 }, text: 'Whoever you are, he fed half this camp.' },
      { x: 3440, text: 'Moss over everything from here on. This is Mossback’s land.' },
    ],
    start: { x: 120, y: 420 },
    goal: { x: 3960, y: 270 },
    end: 4100,
    platforms: [
      { x: -500, y: 420, w: 900 },
      { x: 500, y: 420, w: 150 },
      { x: 750, y: 385, w: 110 },
      { x: 950, y: 345, w: 560 },
      { x: 1610, y: 270, w: 110 },
      { x: 1810, y: 195, w: 480 },
      { x: 2390, y: 270, w: 110 },
      { x: 2600, y: 345, w: 110 },
      { x: 2810, y: 420, w: 520 },
      { x: 3430, y: 345, w: 110 },
      { x: 3640, y: 270, w: 460 },
    ],
    checks: [
      { x: 1855, y: 195 },
      { x: 2855, y: 420 },
    ],
    traps: [
      { x: 1180, y: 345 },
      { x: 3860, y: 270 },
    ],
  },
];

function buildStops() {
  const fights = ROSTER.slice(1);
  let road = 0;
  return fights.flatMap((hero, i) => {
    const built = BUILT_FIGHTS.get(hero);
    const fight = { kind: 'fight', hero, area: i * 2 + 1, open: !!built, ...built };
    if (i === fights.length - 1) return [fight];
    const open = road < ROADS.length;
    // A road locks you to the hero you just took: `as` is who you are on it.
    return [fight, { kind: 'road', area: i * 2 + 2, open, as: hero, ...(open ? { road: ROADS[road++] } : {}) }];
  });
}
export const STOPS = buildStops();

// ---------- Saved progress: this browser only, there are no accounts ----------

const SAVE_KEY = 'parcade-campaign';

export function loadSave() {
  try {
    const { done, hero } = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (Number.isInteger(done) && done >= 0 && done <= STOPS.length) {
      const save = { done, hero: SNIPER };
      if (unlockedHeroes(done).includes(hero)) save.hero = hero;
      return save;
    }
  } catch {}
  return { done: 0, hero: SNIPER };
}

export function storeSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {}
}

// Replaying an old stop never loses your place.
export function finishStop(save, i) {
  const stop = STOPS[i];
  return { done: Math.max(save.done, i + 1), hero: stop.kind === 'fight' ? stop.hero : save.hero };
}

export const unlockedHeroes = (done) => [SNIPER, ...STOPS.slice(0, done).flatMap((s) => (s.kind === 'fight' ? [s.hero] : []))];
export const canPlay = (i, done) => !!STOPS[i]?.open && i <= done;

// ---------- A boss fight ----------

export const DEATH_STEPS = 48;
export const ABSORB_STEPS = 84;
export const SWAP_AT = 66;
const CLAIM_X = 34;
const CLAIM_Y = 44;

// The middle of the lowest row, or as near as that row's floor gets.
export function bodySpot(platforms) {
  const low = Math.max(...platforms.map((p) => p.y));
  let x = 0;
  let best = Infinity;
  for (const p of platforms) {
    if (p.y !== low) continue;
    const near = Math.max(p.x + 30, Math.min(p.x + p.w - 30, W / 2));
    if (Math.abs(near - W / 2) < best) {
      best = Math.abs(near - W / 2);
      x = near;
    }
  }
  return { x, y: low };
}

export function createFight(stop, hero, receive) {
  const game = newGame();
  addPlayer(game, HUMAN).hero = hero;
  addPlayer(game, BOSS).hero = stop.hero;
  game.choice = stop.map;
  startRound(game);
  const me = game.players[HUMAN];
  const brain = newBrain(BOSS, stop.level, HUMAN);
  const spot = bodySpot(MAPS[stop.map].platforms);
  let keys = 0;
  let ack = 0;
  let phase = 'fight';
  let t = 0;
  let from = null;

  const go = (next) => {
    phase = next;
    t = 0;
  };

  function bossDown(boss) {
    // Going out on the same step still counts as a win.
    if (me.lives <= 0) {
      me.lives = 1;
      spawn(me);
    }
    from = { x: boss.x, y: Math.min(H, boss.y) };
    // With the boss gone nothing can score, so a fall from here on costs nothing.
    Object.assign(game, { over: 0, win: null, players: [me], drop: Infinity });
    clearWorld(game);
    Object.assign(me, { mk: -1, mr: 0 });
    go('death');
  }

  function become() {
    const { x, y, f, g } = me;
    spawn(me);
    Object.assign(me, { x, y, f, g, vy: 0, i: 0, cd: 0, j: 2, hero: stop.hero });
  }

  return {
    readyState: 1,
    game,
    send(text) {
      const m = JSON.parse(text);
      if ('b' in m) {
        keys = m.b;
        ack = m.s;
      }
    },
    tick() {
      // Waits here for the buttons on the end screen.
      if (phase === 'lost' || phase === 'done') return;
      const held = phase === 'absorb' ? 0 : keys;
      step(game, (id) => (id === HUMAN ? held : botKeys(game, brain)));
      t++;
      if (phase === 'fight' && game.over > 0) {
        const boss = game.players[BOSS];
        if (boss.lives <= 0) bossDown(boss);
        else {
          game.over = 0;
          go('lost');
        }
      } else if (phase === 'death' && t >= DEATH_STEPS) go('claim');
      else if (phase === 'claim' && Math.abs(me.x - spot.x) < CLAIM_X && Math.abs(me.y - spot.y) < CLAIM_Y) {
        Object.assign(me, { vx: 0 });
        go('absorb');
      } else if (phase === 'absorb') {
        if (t === SWAP_AT) become();
        if (t >= ABSORB_STEPS) go('done');
      }
      const body = from && { h: stop.hero, x: spot.x, y: spot.y, fx: from.x, fy: from.y, deathSteps: DEATH_STEPS, swapAt: SWAP_AT };
      receive(JSON.parse(JSON.stringify({ a: ack, ...snapshotOf(game), camp: { ph: phase, t, ...body } })));
      game.fx = [];
    },
  };
}

// ---------- A parkour road ----------

const FELL_AT = H + 40;
const TRAP_X = 22;
const GOAL_X = 26;
const RETURN_SAFE = 30;
const LOG_PIVOT = -120;
const LOG_ABOVE = 20;
const LOG_W = 32;
const LOG_H = 14;
const LOG_KNOCK = 15;
const LOG_AGAIN = 30;
const LOG_HOLD = STEPS_PER_SEC * 5;
const GUST_FORCE = 1.3;
const BARREL_R = 16;
const BARREL_SPEED = 5;
const BARREL_KNOCK = 13;
const BARREL_NEAR = 1100;
const FOE_TIED = STEPS_PER_SEC * 4;
const FOE_KNOCK = 13;
const FIRE_EVERY = 55;
const FIRE_REACH = 560;
const RUN_SEE = 380;
const SPRINT_AT = 140;
const BUMP_X = 26;
const BUMP_KNOCK = 14;
const BUMP_AGAIN = 30;
// Skills come back three times as fast on a road, or you'd spend it waiting.
const ROAD_COOL = 2;

// Where a swinging log is at its own clock t, and which way it's moving.
export function logAt(log, t) {
  const len = log.floor - LOG_ABOVE - LOG_PIVOT;
  const wave = (t / log.period) * Math.PI * 2 + log.phase;
  const a = Math.asin(log.reach / len) * Math.sin(wave);
  return { x: log.x + Math.sin(a) * len, y: LOG_PIVOT + Math.cos(a) * len, a, dir: Math.cos(wave) >= 0 ? 1 : -1, pivotX: log.x, pivotY: LOG_PIVOT };
}

// A little warning before the wind arrives, so a jump can wait for it to pass.
export function gustState(gust, tick) {
  const t = tick % (gust.on + gust.off);
  return { on: t < gust.on, warn: t >= gust.on + gust.off - 25, started: t === 0 };
}

export function createRoad(stop, hero, receive) {
  const { road } = stop;
  const game = newGame();
  game.map = HOLLOW;
  const me = addPlayer(game, HUMAN);
  me.hero = hero;
  for (const [n, foe] of road.foes.entries()) {
    const p = addPlayer(game, n + 1);
    Object.assign(p, { hero: LOOKOUT, kind: foe.kind, home: foe.x, x: foe.x, y: foe.y, vy: 0, g: true, j: 2, i: 0, f: -1, bump: 0 });
  }
  // A second player would open the pick screen, and nothing should fall from the sky here.
  Object.assign(game, { pick: 0, over: 0, win: null, drop: Infinity, floors: road.platforms });
  usePlatforms(road.platforms);
  const logs = road.logs.map(() => ({ t: 0, h: 0, c: 0 }));
  let barrels = [];
  let keys = 0;
  let ack = 0;
  let phase = 'road';
  let at = -1;

  function place(spot) {
    spawn(me);
    Object.assign(me, { x: spot.x, y: spot.y - 2, vy: 0, g: true, j: 2, i: RETURN_SAFE });
  }
  place(road.start);

  // Falling sends the living foes home too, so a retry starts the same way. One you knocked off stays gone.
  function fell() {
    game.fx.push({ k: 'fell', id: HUMAN, x: me.x, y: Math.min(H, me.y), f: me.f });
    place(road.checks[at] ?? road.start);
    for (const p of game.players.slice(1)) Object.assign(p, { x: p.home, y: road.foes[p.id - 1].y, vx: 0, vy: 0, g: true, n: 0, jw: 0, tr: 0, ss: 0, f: -1 });
    game.bullets = game.bullets.filter((b) => b.o === HUMAN);
  }

  const floorAt = (x, y) => road.platforms.some((p) => p.y === y && x > p.x && x < p.x + p.w);

  function foeKeys(p) {
    const dx = me.x - p.x;
    const far = Math.abs(dx);
    const level = Math.abs(me.y - p.y) < 30;
    // Netted or in a jaw: out of action, but a shot can still knock them off.
    if (!p.g || p.n > 0 || p.jw > 0) return 0;
    if (p.kind === 'guard') {
      if (!level || far > RUN_SEE || far < 8) return 0;
      const dir = Math.sign(dx);
      if (!floorAt(p.x + dir * 22, p.y)) return 0;
      // Plods up, then rushes the last stretch.
      if (far > SPRINT_AT) p.ss = 2;
      return dir < 0 ? KEY.LEFT : KEY.RIGHT;
    }
    // A lookout walks back to their post after a shove, then fires when you're in line.
    const back = p.home - p.x;
    if (Math.abs(back) > 6) return back < 0 ? KEY.LEFT : KEY.RIGHT;
    p.f = Math.sign(dx) || p.f;
    return level && far < FIRE_REACH && game.tick % FIRE_EVERY === p.id * 9 ? KEY.SHOOT : 0;
  }

  function moveLogs() {
    road.logs.forEach((log, i) => {
      const s = logs[i];
      if (s.c > 0) s.c--;
      if (s.h > 0) s.h--;
      else s.t++;
      const { x, y, dir } = logAt(log, s.t);
      game.nets = game.nets.filter((n) => {
        if (s.h > 0 || Math.abs(n.x - x) > LOG_W + 20 || Math.abs(n.y - y) > LOG_H + 20) return true;
        s.h = LOG_HOLD;
        game.fx.push({ k: 'snare', id: HUMAN, x, y, f: Math.sign(n.vx) });
        return false;
      });
      if (s.c > 0 || me.i > 0 || Math.abs(me.x - x) > LOG_W + PW / 2 || Math.abs(me.y - PH / 2 - y) > LOG_H + PH / 2) return;
      s.c = LOG_AGAIN;
      // A held log is only in the way.
      if (s.h > 0) return;
      push(game, me, dir * LOG_KNOCK, -6);
      game.fx.push({ k: 'hitbig', id: HUMAN, x: me.x, y: me.y - PH / 2, f: dir });
    });
  }

  function moveGusts() {
    for (const g of road.gusts) {
      const { on, started } = gustState(g, game.tick);
      const near = me.x > g.x0 && me.x < g.x1;
      if (started && Math.abs(me.x - (g.x0 + g.x1) / 2) < 900) game.fx.push({ k: 'gust', id: HUMAN, x: me.x, y: me.y, f: g.dir });
      if (on && near && me.zp === 0) me.vx += g.dir * GUST_FORCE;
    }
  }

  function moveBarrels() {
    for (const r of road.rollers) {
      if (game.tick % r.every === 0 && Math.abs(me.x - r.x) < BARREL_NEAR) barrels.push({ id: game.nextId++, x: r.x, y: r.y, vx: r.dir * BARREL_SPEED, vy: 0 });
    }
    barrels = barrels.filter((b) => {
      b.x += b.vx;
      if (b.vy > 0 || !floorAt(b.x, b.y)) {
        b.vy += 1.6;
        b.y += b.vy;
      }
      const shot = game.bullets.find((n) => n.o === HUMAN && Math.abs(n.x - b.x) < BARREL_R + 12 && Math.abs(n.y - (b.y - BARREL_R)) < BARREL_R + 6);
      if (shot) {
        game.bullets = game.bullets.filter((n) => n !== shot);
        game.fx.push({ k: 'hit', id: HUMAN, x: b.x, y: b.y - BARREL_R, f: Math.sign(shot.vx) });
        return false;
      }
      if (me.i === 0 && Math.abs(me.x - b.x) < BARREL_R + PW / 2 && me.y > b.y - BARREL_R * 2 && me.y - PH < b.y) {
        push(game, me, Math.sign(b.vx) * BARREL_KNOCK, -6);
        game.fx.push({ k: 'hit', id: HUMAN, x: b.x, y: b.y - BARREL_R, f: Math.sign(b.vx) });
        return false;
      }
      return b.y < H + 40 && b.x > -600;
    });
  }

  function moveFoes() {
    for (const p of game.players.slice(1)) {
      if (p.bump > 0) p.bump--;
      // Caught this very step: a road's net or jaw holds far longer than a fight's, since there's only one of you.
      if (p.n === NET_STEPS) p.n = FOE_TIED;
      if (p.jw === TRAP_HOLD) Object.assign(p, { jw: FOE_TIED, tr: FOE_TIED });
      if (p.y > FELL_AT) {
        game.fx.push({ k: 'fell', id: p.id, x: p.x, y: Math.min(H, p.y), f: p.f });
        game.players = game.players.filter((o) => o !== p);
        continue;
      }
      if (p.kind === 'guard' && p.n === 0 && p.jw === 0 && p.bump === 0 && me.i === 0 && Math.abs(me.x - p.x) < BUMP_X && Math.abs(me.y - p.y) < PH) {
        p.bump = BUMP_AGAIN;
        const dir = Math.sign(me.x - p.x) || p.f;
        push(game, me, dir * BUMP_KNOCK, -6, p.id);
        game.fx.push({ k: 'hit', id: HUMAN, x: me.x, y: me.y - PH / 2, f: dir });
      }
    }
    for (const b of game.bullets) if (b.o !== HUMAN) b.k = FOE_KNOCK;
  }

  return {
    readyState: 1,
    game,
    send(text) {
      const m = JSON.parse(text);
      if ('b' in m) {
        keys = m.b;
        ack = m.s;
      }
    },
    tick() {
      if (phase === 'goal') return;
      step(game, (id) => {
        if (id === HUMAN) return keys;
        return foeKeys(game.players.find((p) => p.id === id));
      });
      if (me.cd > 0) me.cd = Math.max(0, me.cd - ROAD_COOL);
      moveLogs();
      moveGusts();
      moveBarrels();
      moveFoes();
      const next = road.checks.findIndex((c, i) => i > at && me.g && me.y === c.y && me.x >= c.x);
      if (next >= 0) {
        at = next;
        game.fx.push({ k: 'flag', id: HUMAN, x: road.checks[at].x, y: road.checks[at].y, f: 1 });
      }
      if (me.y > FELL_AT) fell();
      else if (me.g && me.i === 0 && road.traps.some((c) => c.y === me.y && Math.abs(c.x - me.x) < TRAP_X)) {
        game.fx.push({ k: 'snap', id: HUMAN, x: me.x, y: me.y, f: me.f });
        fell();
      } else if (me.g && me.y === road.goal.y && Math.abs(me.x - road.goal.x) < GOAL_X) phase = 'goal';
      receive(JSON.parse(JSON.stringify({ a: ack, ...snapshotOf(game), camp: { ph: phase, at, lg: logs, br: barrels } })));
      game.fx = [];
    },
  };
}
