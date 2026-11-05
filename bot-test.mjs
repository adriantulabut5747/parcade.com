// Bot tests: node bot-test.mjs. Add "report" to print the numbers. Seeded, so a run gives the same result every time.
import assert from 'node:assert/strict';
import { ACTIONS, LEVELS, botKeys, guess, navFor, newBrain, newWatcher, observe } from './site/bot.js';
import { createPractice } from './site/practice.js';
import { ALL_KEYS, ANGLER, AQUILLES, GUNS, HERO_COUNT, ILLUSIONIST, KEY, MAPS, MOSSBACK, NINJA, PISTOL, STEPS_PER_SEC, TETHER, addPlayer, muzzleY, newGame, startRound, step, useMap } from './site/sim.js';

const report = process.argv.includes('report');
const say = (...a) => report && console.log(...a);
const NAMES = Object.keys(LEVELS);

let seed = 12345;
Math.random = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (n) => Math.floor(Math.random() * n);

function match(players, map = pick(MAPS.length)) {
  const s = newGame();
  for (const pl of players) addPlayer(s, pl.id).hero = pl.hero;
  s.choice = map;
  startRound(s);
  return s;
}

// ---------- Every platform can reach every other, or a bot could never get to you ----------
for (const m of MAPS) {
  const { hops } = navFor(m.platforms);
  for (const row of hops) for (const n of row) assert.ok(n < Infinity, `${m.name}: a platform can't be reached`);
}

// ---------- Left alone, a bot doesn't throw itself off the map ----------
for (const name of NAMES) {
  let falls = 0;
  const seconds = 60;
  for (const map of MAPS.keys()) {
    const s = match([{ id: 0, hero: 0 }, { id: 1, hero: 8 }], map);
    const b = newBrain(1, LEVELS[name]);
    const dummy = s.players[0];
    dummy.x = MAPS[map].platforms[0].x + 60;
    for (let t = 0; t < seconds * STEPS_PER_SEC; t++) {
      step(s, (id) => {
        if (id === 0) return 0;
        const keys = botKeys(s, b);
        assert.ok(Number.isInteger(keys) && keys >= 0 && keys <= ALL_KEYS);
        return keys & ~KEY.SHOOT & ~KEY.SKILL;
      });
      for (const p of s.players) p.lives = 3;
      falls += s.fx.filter((f) => f.k === 'ko' && f.id === 1).length;
      s.fx = [];
    }
  }
  say(`${name}: fell by itself ${falls} times in ${seconds * 3} s`);
  if (name !== 'easy') assert.ok(falls <= 1, `${name} walks off the map: ${falls} falls`);
  else assert.ok(falls <= 12, `easy walks off the map too much: ${falls} falls`);
}

// ---------- The harder the level, the fewer shots land. Medium and up really dodge ----------
function hitRate(name, gunIndex = PISTOL) {
  let shots = 0;
  let hits = 0;
  for (const map of MAPS.keys()) {
    for (let round = 0; round < 6; round++) {
      const s = match([{ id: 0, hero: 7 }, { id: 1, hero: 11 }], map);
      const b = newBrain(1, LEVELS[name]);
      const shooter = s.players[0];
      const target = s.players[1];
      for (let t = 0; t < 40 * STEPS_PER_SEC; t++) {
        // A turret that teleports level with the bot, 300 px away, and fires.
        const landed = s.round > 45 && target.g && t % 40 === 0;
        step(s, (id) => {
          if (id === 1) {
            const keys = botKeys(s, b) & ~KEY.SHOOT & ~KEY.SKILL;
            return keys;
          }
          if (landed) {
            const side = target.x < 480 ? 1 : -1;
            Object.assign(shooter, { x: target.x + side * 300, y: target.y, vy: 0, vx: 0, g: true, f: -side, c: 0, gun: gunIndex, ammo: 99, i: 999 });
            shots++;
            return KEY.SHOOT;
          }
          Object.assign(shooter, { y: -2000, vy: 0, vx: 0, i: 999 });
          return 0;
        });
        for (const p of s.players) p.lives = 3;
        hits += s.fx.filter((f) => (f.k === 'hit' || f.k === 'hitbig') && f.id === 1).length;
        s.fx = [];
      }
    }
  }
  return hits / Math.max(1, shots);
}
const rates = Object.fromEntries(NAMES.map((n) => [n, hitRate(n)]));
say('share of pistol shots that land:', rates);
assert.ok(rates.easy > 0.6, `easy should mostly get hit: ${rates.easy}`);
assert.ok(rates.medium < rates.easy * 0.7, `medium should dodge: ${JSON.stringify(rates)}`);
assert.ok(rates.hard < rates.medium, `hard should dodge better than medium: ${JSON.stringify(rates)}`);
assert.ok(rates.veryhard <= rates.hard + 0.02 && rates.veryhard < 0.1, `very hard should almost never be hit by a far shot: ${JSON.stringify(rates)}`);

// ---------- Hard and up block with skills: a shot at a bot in a net, which can't jump out of the way ----------
function blocks(name, hero) {
  let used = 0;
  const tries = 20;
  for (let i = 0; i < tries; i++) {
    const s = match([{ id: 0, hero: 7 }, { id: 1, hero }], 2);
    const b = newBrain(1, LEVELS[name]);
    const [a, me] = s.players;
    Object.assign(a, { x: 300, y: 420, g: true, f: 1, vx: 0, vy: 0, i: 0, c: 0, cd: 999 });
    Object.assign(me, { x: 470, y: 420, g: true, f: -1, vx: 0, vy: 0, i: 0, cd: 0, n: 30, dc: 999 });
    for (let t = 0; t < 12; t++) {
      step(s, (id) => {
        if (id === 0) {
          Object.assign(a, { x: 300, y: 420 });
          return t === 0 ? KEY.SHOOT : 0;
        }
        return botKeys(s, b);
      });
      if (me.cd > 0) {
        used++;
        break;
      }
    }
  }
  return used / tries;
}
for (const hero of [AQUILLES, ILLUSIONIST, MOSSBACK]) {
  const hard = blocks('hard', hero);
  const easy = blocks('easy', hero);
  say(`hero ${hero} blocks a close shot: hard ${hard}, easy ${easy}`);
  assert.ok(hard >= 0.6, `hard hero ${hero} should block: ${hard}`);
  // Easy can still happen to use a skill as an attack in that moment, so this is a gap, not a zero.
  assert.ok(hard - easy >= 0.4, `hero ${hero}: hard ${hard} should block far more than easy ${easy}`);
}

// ---------- Tether and Ninja use their skill to get back when knocked off ----------
function rescued(hero) {
  let saved = 0;
  const tries = 12;
  for (let i = 0; i < tries; i++) {
    const s = match([{ id: 0, hero: 7 }, { id: 1, hero }], 0);
    const b = newBrain(1, LEVELS.veryhard);
    const [a, me] = s.players;
    Object.assign(a, { x: 480, y: 410, g: true, cd: 999, i: 0 });
    Object.assign(me, { x: 60, y: 470, vx: -14, vy: 2, g: false, j: 0, dc: 999, i: 0, cd: hero === NINJA ? 999 : 0, st: hero === NINJA ? 150 : 0, sx: 480, sy: 410 });
    for (let t = 0; t < 60; t++) {
      step(s, (id) => (id === 0 ? 0 : botKeys(s, b)));
      if (me.falls) break;
    }
    if (!me.falls) saved++;
  }
  return saved / tries;
}
for (const hero of [TETHER, NINJA]) {
  const rate = rescued(hero);
  say(`hero ${hero} saves itself from a fall: ${rate}`);
  assert.ok(rate >= 0.8, `hero ${hero} should get back with its skill: ${rate}`);
}

// ---------- Very hard learns a habit: someone who always jumps when shot at ----------
{
  const s = match([{ id: 0, hero: 7 }, { id: 1, hero: 11 }], 2);
  const w = newWatcher();
  const [me, foe] = s.players;
  Object.assign(me, { x: 200, y: 420, g: true, i: 0, b: 0 });
  Object.assign(foe, { x: 700, y: 420, g: true, i: 0 });
  const shot = (x) => ({ id: s.nextId++, x, y: 402, vx: -18, vy: 0, o: 1, t: 30, k: 21, g: PISTOL });
  for (let i = 0; i < 12; i++) {
    s.bullets = [shot(350)];
    observe(w, s, me); // opens a window while being shot at
    me.b = KEY.JUMP;
    observe(w, s, me); // the jump closes it
    me.b = 0;
    s.bullets = [];
    w.open = null;
    w.last.set(0, 0);
  }
  s.bullets = [shot(350)];
  assert.equal(guess(w, s, me), ACTIONS.JUMP, 'the watcher should learn the jump');
  s.bullets = [];
  assert.equal(guess(w, s, me), ACTIONS.NONE, 'no shot means no habit to read yet');
}

// ---------- Each level beats the one below it, with random heroes and maps ----------
function duel(upper, lower, rounds) {
  let wins = 0;
  for (let r = 0; r < rounds; r++) {
    const heroes = [pick(HERO_COUNT), pick(HERO_COUNT)];
    const s = match([{ id: 0, hero: heroes[0] }, { id: 1, hero: heroes[1] }]);
    const brains = [newBrain(0, LEVELS[upper], -1), newBrain(1, LEVELS[lower], -1)];
    // 5 lives take longer than the 3 this was first measured at.
    for (let t = 0; t < 300 * STEPS_PER_SEC && !s.over; t++) {
      step(s, (id) => botKeys(s, brains[id]));
      s.fx = [];
    }
    if (s.win === 0) wins++;
    else if (s.win === null) {
      // Out of time: whoever has more lives left takes it.
      const [a, b] = s.players;
      if (a.lives > b.lives) wins++;
    }
  }
  return wins / rounds;
}
const ROUNDS = 40;
for (let i = 0; i + 1 < NAMES.length; i++) {
  const rate = duel(NAMES[i + 1], NAMES[i], ROUNDS);
  say(`${NAMES[i + 1]} beats ${NAMES[i]}: ${Math.round(rate * 100)}% of ${ROUNDS}`);
  // Measured over 250 rounds, each level wins about 74%. 40 rounds with random heroes swings by about 15 points, so the bar sits below that.
  assert.ok(rate >= 0.6, `${NAMES[i + 1]} should beat ${NAMES[i]} clearly: ${rate}`);
}

// ---------- The practice room runs a round, deals bots heroes, needs no clock, and ends when you're out ----------
{
  let last = null;
  const room = createPractice(3, 'hard', (m) => (last = m));
  assert.equal(room.game.players.length, 4);
  for (let t = 0; t < STEPS_PER_SEC * 60; t++) room.tick();
  assert.ok(last.pk > 0, 'waits for you with no clock');
  const bots = last.p.filter((p) => p.id !== 0);
  assert.ok(bots.every((p) => p.ready && p.hero !== null));
  assert.equal(new Set(bots.map((p) => p.hero)).size, 3, 'no two bots share a hero');
  room.send(JSON.stringify({ mp: 1 }));
  room.send(JSON.stringify({ h: 7 }));
  room.tick();
  assert.equal(last.pk, 0);
  assert.equal(last.m, 1, 'the map you chose');
  room.send(JSON.stringify({ s: 5, b: KEY.LEFT }));
  room.tick();
  assert.equal(last.a, 5);
  assert.equal(last.p[0].b, KEY.LEFT);
  room.send(JSON.stringify({ s: 6, b: 0 }));
  for (const p of room.game.players) if (p.id === 0) p.lives = 1;
  Object.assign(room.game.players[0], { y: 5000, i: 0 });
  room.tick();
  assert.ok(last.o > 0, 'the round ends once you are out');
  assert.ok(last.w !== null && last.w !== 0, 'and a bot takes it');
  let again = 0;
  while (last.pk === 0 && again++ < 400) room.tick();
  assert.ok(last.pk > 0, 'then back to the pick screen');
  room.tick();
  assert.ok(last.p.filter((p) => p.id !== 0).every((p) => p.ready));
}

// ---------- It has to be cheap, because phones run it ----------
{
  useMap(0);
  const room = createPractice(3, 'veryhard', () => {});
  room.send(JSON.stringify({ h: 7 }));
  room.tick();
  const start = performance.now();
  const steps = 30 * STEPS_PER_SEC;
  let worst = 0;
  for (let t = 0; t < steps; t++) {
    const at = performance.now();
    room.tick();
    worst = Math.max(worst, performance.now() - at);
    if (room.game.over || room.game.pick) room.send(JSON.stringify({ h: 7 }));
    for (const p of room.game.players) if (p.id === 0) p.lives = 3;
  }
  const each = (performance.now() - start) / steps;
  say(`3 very hard bots: ${each.toFixed(2)} ms a step on average, worst ${worst.toFixed(2)} ms`);
  assert.ok(each < 2, `too slow for a phone: ${each} ms a step`);
}

console.log('bots ok');
