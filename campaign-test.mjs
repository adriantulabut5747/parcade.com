// Campaign test: node campaign-test.mjs
// The order, the stops, whether the road can really be crossed under the real movement rules, and every step of a fight from first hit to becoming the boss.
import assert from 'node:assert/strict';
import { ABSORB_STEPS, ROADS, ROSTER, STOPS, SWAP_AT, bodySpot, canPlay, createFight, createRoad, finishStop, gustState, loadSave, logAt, unlockedHeroes } from './site/campaign.js';
import { ANGLER, AQUILLES, CASSIO, DEXTAR, DUSK, H, HANDLER, HERO_COUNT, ILLUSIONIST, KEY, LOOKOUT, MAPS, MOSSBACK, NET_STEPS, NINJA, POACHER, RIME, SANTA, SEEDEA, SHADE, SHIFTER, SNIPER, SPRINTER, TETHER, TRAPPER, TRAP_HOLD, VI, W, movePlayer, newGame, addPlayer, usePlatforms, useMap } from './site/sim.js';

// ---------- The order Adrian gave, Santa after Aquilles ----------
assert.deepEqual(ROSTER, [SNIPER, TRAPPER, POACHER, MOSSBACK, ANGLER, HANDLER, NINJA, SPRINTER, AQUILLES, SANTA, SHIFTER, ILLUSIONIST, DUSK, SHADE, SEEDEA, RIME, TETHER, CASSIO, DEXTAR, VI]);
assert.equal(new Set(ROSTER).size, HERO_COUNT, 'every hero once');

// ---------- The stops ----------
assert.deepEqual(STOPS.slice(0, 4).map((s) => [s.area, s.kind, s.open]), [[1, 'fight', true], [2, 'road', true], [3, 'fight', true], [4, 'road', true]]);
assert.equal(STOPS[4].open, true, 'Area 5 is Mossback');
assert.equal(STOPS[4].hero, MOSSBACK);
assert.equal(MAPS[STOPS[4].map].name, 'Mossback’s Grove');
assert.equal(STOPS[0].hero, TRAPPER);
assert.equal(STOPS[2].hero, POACHER);
assert.equal(STOPS[5].open, false, 'later stops wait');
assert.equal(STOPS[1].as, TRAPPER, 'a road locks you to the hero just before it');
assert.equal(STOPS[3].as, POACHER, 'Area 4 is Ethan only');
assert.equal(STOPS.filter((s) => s.kind === 'fight').length, HERO_COUNT - 1, 'a fight for everyone but the starter');
STOPS.forEach((s, i) => assert.equal(s.area, i + 1));

assert.ok(canPlay(0, 0));
assert.ok(!canPlay(1, 0), 'one at a time');
assert.ok(canPlay(3, 3), 'Area 4 is open');
assert.ok(canPlay(4, 4), 'Area 5 is open');
assert.ok(!canPlay(5, 5), 'not built yet');
assert.deepEqual(unlockedHeroes(0), [SNIPER]);
assert.deepEqual(unlockedHeroes(1), [SNIPER, TRAPPER]);
assert.deepEqual(unlockedHeroes(3), [SNIPER, TRAPPER, POACHER]);
assert.deepEqual(finishStop({ done: 0, hero: SNIPER }, 0), { done: 1, hero: TRAPPER }, 'you become the boss');
assert.deepEqual(finishStop({ done: 3, hero: POACHER }, 1), { done: 3, hero: POACHER }, 'replaying a road changes nothing');
assert.deepEqual(finishStop({ done: 3, hero: POACHER }, 0), { done: 3, hero: TRAPPER }, 'replaying a fight never loses your place');
assert.deepEqual(loadSave(), { done: 0, hero: SNIPER }, 'no storage means a fresh start');

// ---------- The body always lands on a floor ----------
for (const m of MAPS) {
  const { x, y } = bodySpot(m.platforms);
  assert.ok(m.platforms.some((p) => p.y === y && x > p.x && x < p.x + p.w), `${m.name}: body on a floor`);
}
assert.deepEqual(bodySpot(MAPS[STOPS[0].map].platforms), { x: W / 2, y: 420 }, 'dead centre of the first row in the Hollow');

// ---------- The road can be crossed, one hop at a time, without a dash and without a perfect jump ----------
const fresh = (hero, pl, platforms) => {
  const s = newGame();
  const p = addPlayer(s, 0);
  p.hero = hero;
  // addPlayer puts the arena's floors back.
  usePlatforms(platforms);
  Object.assign(p, { x: pl.x + pl.w - 26, y: pl.y, vx: 6.5, vy: 0, g: true, j: 2, i: 0, f: 1, b: 0 });
  return p;
};

// Takes off from 14 px short of the edge at full run, and tries the second jump at every moment.
function hop(hero, a, b, platforms = ROADS[0].platforms) {
  for (let second = -1; second < 26; second++) {
    const p = fresh(hero, a, platforms);
    p.x = a.x + a.w - 14;
    for (let t = 0; t < 70; t++) {
      const jump = t === 0 || t === second + 2;
      movePlayer(p, KEY.RIGHT | (jump ? KEY.JUMP : 0));
      if (p.g && p.y === b.y && p.x > b.x && p.x < b.x + b.w) return second;
      if (p.y > H) break;
    }
  }
  return null;
}

for (const road of ROADS) {
  usePlatforms(road.platforms);
  const ordered = [...road.platforms].sort((a, b) => a.x - b.x);
  for (let i = 1; i < ordered.length; i++) {
    for (const hero of [SNIPER, TRAPPER, POACHER]) assert.ok(hop(hero, ordered[i - 1], ordered[i], road.platforms) !== null, `${road.name}: hop to ${ordered[i].x},${ordered[i].y}`);
  }
  const floor = (o) => road.platforms.some((p) => p.y === o.y && o.x > p.x && o.x < p.x + p.w);
  for (const o of [road.start, road.goal, ...road.checks, ...road.traps, ...road.foes, ...road.props, ...road.rollers.map((r) => ({ x: r.x - r.dir * -4, y: r.y }))]) assert.ok(floor(o), `${road.name}: ${o.x},${o.y} has a floor`);
  for (const l of road.logs) assert.ok(floor({ x: l.x, y: l.floor }), `${road.name}: the log at ${l.x} swings over a floor`);
  assert.ok(road.foes.length <= 3, 'ids index the 4 team colours');
  assert.deepEqual(road.story.map((s) => s.x), road.story.map((s) => s.x).sort((a, b) => a - b), `${road.name}: lines are in the order you reach them`);
  for (const c of road.traps) {
    const pl = road.platforms.find((p) => p.y === c.y && c.x > p.x && c.x < p.x + p.w);
    assert.ok(c.x - pl.x > 90 && pl.x + pl.w - c.x > 90, `${road.name}: room to land either side of the trap at ${c.x}`);
  }
}

// Plays each whole road in the real room with every hazard on, using only run, jump and the second jump, so no road can be impassable without the skill.
// Deterministic: nothing on a road is random. Falls are expected, because they cost only time.
for (const [n, road] of ROADS.entries()) {
  usePlatforms(road.platforms);
  const ordered = [...road.platforms].sort((a, b) => a.x - b.x);
  const hops = ordered.map((pl, i) => (i ? hop(SNIPER, ordered[i - 1], pl, road.platforms) : null));
  let last = null;
  const room = createRoad({ kind: 'road', road }, n ? POACHER : TRAPPER, (m) => (last = m));
  const me = room.game.players[0];
  let seq = 0;
  let airborne = 0;
  let plan = null;
  let falls = 0;
  let t = 0;
  for (; t < 30 * 600 && last?.camp.ph !== 'goal'; t++) {
    const at = ordered.findIndex((pl) => me.y === pl.y && me.x >= pl.x && me.x < pl.x + pl.w);
    let keys = KEY.RIGHT;
    if (me.g) airborne = 0;
    const trap = road.traps.find((c) => c.y === me.y && c.x - me.x < 70 && c.x - me.x > 0);
    const barrel = (last?.camp.br ?? []).find((b) => b.y === me.y && b.x > me.x && b.x - me.x < 70);
    if (me.g && at >= 0 && at < ordered.length - 1 && me.x >= ordered[at].x + ordered[at].w - 14) {
      plan = hops[at + 1];
      keys |= KEY.JUMP;
      airborne = 1;
    } else if (me.g && (trap || barrel)) {
      plan = -1;
      keys |= KEY.JUMP;
      airborne = 1;
    } else if (airborne) {
      airborne++;
      if (plan >= 0 && airborne === plan + 3) keys |= KEY.JUMP;
    }
    room.send(JSON.stringify({ s: ++seq, b: keys }));
    room.tick();
    if (last.x.some((f) => f.k === 'fell' && f.id === 0)) falls++;
  }
  assert.equal(last.camp.ph, 'goal', `reached the end of ${road.name}, stopped at x ${me.x} after ${falls} falls`);
  assert.equal(last.camp.at, road.checks.length - 1, 'passed every flag');
  console.log(`${road.name}: a bot with no skill and no dash crossed in ${Math.round(t / 30)} s with ${falls} falls`);
}

// What a road does: the hero, the skill, every hazard, and the fall.
{
  const road = ROADS[0];
  const room = (hero = TRAPPER, r = road) => {
    let last = null;
    const made = createRoad({ kind: 'road', road: r }, hero, (m) => (last = m));
    return { made, game: made.game, me: made.game.players[0], last: () => last, press: (b) => { made.send(JSON.stringify({ s: 1, b })); made.tick(); } };
  };
  const stand = (me, x, y) => Object.assign(me, { x, y, vx: 0, vy: 0, g: true, i: 0, f: 1 });

  let r = room();
  assert.equal(r.me.hero, TRAPPER);
  assert.equal(r.last(), null);
  assert.equal(r.game.pick, 0, 'no pick screen, though foes count as players');
  assert.ok(r.game.players.slice(1).every((p) => p.hero === LOOKOUT));
  r.press(KEY.SKILL);
  assert.ok(r.me.cd > 0, 'the skill works on a road');
  const full = r.me.cd;
  r.press(0);
  assert.equal(r.me.cd, full - 3, 'and comes back three times as fast');
  assert.equal(r.game.nets.length, 1, 'the net is really in the air');
  r = room();
  r.press(KEY.SHOOT);
  assert.equal(r.game.bullets.length, 1, 'the gun works too');

  // A log shoves you the way it's swinging, unless a net is holding it.
  r = room();
  const log = road.logs[0];
  r.press(0);
  for (let i = 0; i < 400 && Math.abs(logAt(log, r.last().camp.lg[0].t).x - log.x) > 5; i++) r.press(0);
  const swing = logAt(log, r.last().camp.lg[0].t + 1);
  stand(r.me, swing.x, log.floor);
  r.press(0);
  assert.ok(Math.abs(r.me.vx) > 10, `a log shoves you, vx ${r.me.vx}`);
  assert.equal(Math.sign(r.me.vx), swing.dir, 'the way it was swinging');
  assert.ok(r.last().x.some((f) => f.k === 'hitbig'));

  r = room();
  stand(r.me, log.x - 200, log.floor);
  r.press(KEY.SKILL);
  for (let i = 0; i < 30 && !r.last().camp.lg[0].h; i++) r.press(0);
  assert.ok(r.last().camp.lg[0].h > 0, 'the net catches the log');
  const heldAt = r.last().camp.lg[0].t;
  r.press(0);
  assert.equal(r.last().camp.lg[0].t, heldAt, 'and it stops swinging');
  stand(r.me, logAt(log, heldAt).x, log.floor);
  r.press(0);
  assert.ok(Math.abs(r.me.vx) < 7, 'a held log doesn’t shove');
  for (let i = 0; i < 160; i++) r.press(0);
  assert.equal(r.last().camp.lg[0].h, 0, 'it swings again in the end');
  assert.ok(r.last().camp.lg[0].t > heldAt);

  // A lookout fires when you're level and in range, gently, and a net stops it.
  r = room();
  const lookout = r.game.players[1];
  stand(r.me, lookout.x - 300, lookout.y);
  r.game.tick = 0;
  let shots = 0;
  for (let i = 0; i < 60; i++) {
    stand(r.me, lookout.x - 300, lookout.y);
    r.press(0);
    if (r.game.bullets.length) shots++;
  }
  assert.ok(shots > 0, 'a lookout fires');
  assert.ok(r.game.bullets.every((b) => b.k === 13), 'with a road’s softer shot');
  assert.equal(lookout.f, -1, 'facing you');
  stand(r.me, lookout.x - 300, lookout.y);
  r.game.bullets = [];
  r.press(KEY.SKILL);
  for (let i = 0; i < 30 && !(lookout.n > 0); i++) r.press(0);
  assert.ok(lookout.n > NET_STEPS, `a road's net holds longer, ${lookout.n}`);
  r.game.bullets = [];
  for (let i = 0; i < 60; i++) {
    stand(r.me, lookout.x - 300, lookout.y);
    r.press(0);
  }
  assert.equal(r.game.bullets.length, 0, 'tied up: no more shots');

  // Knock a foe off and they're gone, even after you fall. A foe still standing goes home.
  r = room();
  Object.assign(r.game.players[1], { y: H + 100, g: false });
  r.press(0);
  assert.equal(r.game.players.length, road.foes.length, 'one off the road');
  Object.assign(r.game.players[1], { x: 3000 });
  Object.assign(r.me, { x: 620, y: H + 100 });
  r.press(0);
  assert.equal(r.me.x, road.start.x, 'back to the start before any flag');
  assert.ok(r.last().x.some((f) => f.k === 'fell'));
  assert.equal(r.game.players.length, road.foes.length, 'stays gone');
  assert.equal(r.game.players[1].x, road.foes[1].x, 'the other went home');

  // Flags and bear traps work as before.
  r = room();
  stand(r.me, road.checks[0].x + 4, road.checks[0].y);
  r.press(0);
  assert.equal(r.last().camp.at, 0, 'flag taken');
  assert.ok(r.last().x.some((f) => f.k === 'flag'));
  stand(r.me, road.traps[0].x, road.traps[0].y);
  r.press(0);
  assert.equal(r.me.x, road.checks[1].x, 'a trap sends you back to the flag on its own floor');
  assert.ok(r.last().x.some((f) => f.k === 'snap'));

  // Wind blows only while it's on, only inside its stretch.
  r = room();
  const gust = road.gusts[0];
  let on = 0;
  for (let i = 0; i < gust.on + gust.off; i++) {
    stand(r.me, (gust.x0 + gust.x1) / 2, 345);
    r.press(0);
    if (r.me.vx < -1) on++;
  }
  assert.ok(Math.abs(on - gust.on) <= 2, `blew for ${on} steps of ${gust.on}`);
  assert.equal(gustState(gust, gust.on).on, false);
  assert.equal(gustState(gust, gust.on + gust.off - 1).warn, true, 'with a warning first');
  stand(r.me, gust.x0 - 100, 345);
  for (let i = 0; i < gust.on + gust.off; i++) {
    r.me.vx = 0;
    r.press(0);
    if (r.me.x < gust.x0) assert.ok(r.me.vx > -1, 'nothing outside it');
    stand(r.me, gust.x0 - 100, 345);
  }

  // Barrels roll at you, shove you and break, and a shot breaks them first.
  r = room();
  const roll = road.rollers[0];
  stand(r.me, roll.x - 300, roll.y);
  for (let i = 0; i < 400 && !r.last()?.camp.br.length; i++) {
    stand(r.me, roll.x - 300, roll.y);
    r.press(0);
  }
  assert.equal(r.last().camp.br.length, 1, 'a barrel comes');
  const barrel = r.last().camp.br[0];
  stand(r.me, barrel.x - 20, roll.y);
  r.press(0);
  assert.ok(r.me.vx < -5, `a barrel shoves you, vx ${r.me.vx}`);
  assert.equal(r.last().camp.br.length, 0, 'and breaks');
  r = room();
  for (let i = 0; i < 400 && !r.last()?.camp.br.length; i++) {
    stand(r.me, roll.x - 300, roll.y);
    r.press(0);
  }
  stand(r.me, r.last().camp.br[0].x - 60, roll.y);
  r.press(KEY.SHOOT);
  for (let i = 0; i < 8 && r.last().camp.br.length; i++) r.press(0);
  assert.equal(r.last().camp.br.length, 0, 'a shot breaks a barrel');

  // Area 4: a guard runs at you and shoves you, and Ethan's trap stops him.
  const camp = ROADS[1];
  r = room(POACHER, camp);
  assert.equal(r.me.hero, POACHER);
  const guard = r.game.players[1];
  assert.equal(guard.kind, 'guard');
  stand(r.me, guard.x - 300, guard.y);
  const before = guard.x;
  for (let i = 0; i < 20; i++) {
    stand(r.me, before - 300, guard.y);
    r.press(0);
  }
  assert.ok(guard.x < before - 10, `a guard comes for you, from ${before} to ${guard.x}`);
  stand(r.me, guard.x - 20, guard.y);
  r.press(0);
  assert.ok(r.me.vx < -5, `and shoves you, vx ${r.me.vx}`);
  r = room(POACHER, camp);
  const caught = r.game.players[1];
  stand(r.me, caught.x - 90, caught.y);
  r.press(KEY.SKILL);
  for (let i = 0; i < 40 && !(caught.jw > 0); i++) {
    stand(r.me, caught.x - 90, caught.y);
    r.press(0);
  }
  assert.ok(caught.jw > TRAP_HOLD, `a road's trap holds longer, ${caught.jw}`);
  // He skids a little first, from running speed.
  for (let i = 0; i < 12; i++) {
    stand(r.me, caught.x - 90, caught.y);
    r.press(0);
  }
  const held = caught.x;
  for (let i = 0; i < 20; i++) {
    stand(r.me, held - 90, caught.y);
    r.press(0);
  }
  assert.ok(Math.abs(caught.x - held) < 3, 'and he stays put');
  useMap(0);
}

// ---------- A fight, from the first step to becoming the boss ----------
function fight(hero = SNIPER) {
  let last = null;
  const room = createFight(STOPS[0], hero, (m) => (last = m));
  room.send(JSON.stringify({ s: 1, b: 0 }));
  return { room, game: room.game, me: room.game.players[0], boss: room.game.players[1], last: () => last, run: (n = 1) => { for (let i = 0; i < n; i++) room.tick(); } };
}

{
  const f = fight();
  f.run();
  assert.equal(f.last().camp.ph, 'fight');
  assert.equal(f.last().pk, 0, 'no pick screen in the campaign');
  assert.equal(f.game.map, STOPS[0].map, 'the stop chooses the arena');
  assert.equal(f.me.hero, SNIPER);
  assert.equal(f.boss.hero, TRAPPER);

  // Knock the boss out for good.
  f.boss.lives = 1;
  Object.assign(f.boss, { x: 700, y: H + 200 });
  f.run();
  assert.equal(f.last().camp.ph, 'death');
  assert.equal(f.last().o, 0, 'no results screen');
  assert.equal(f.game.players.length, 1, 'the boss is gone');
  assert.ok(Math.abs(f.last().camp.fx - 700) < 30, 'the body starts where the boss went in');
  assert.ok(f.last().x.some((x) => x.k === 'ko'), 'the last KO still shows');

  // Falling from here costs nothing.
  const lives = f.me.lives;
  Object.assign(f.me, { y: H + 200 });
  f.run();
  assert.equal(f.me.lives, lives, 'no life lost after the win');
  assert.equal(f.last().camp.ph, 'death', 'and the boss stays beaten');

  f.run(60);
  assert.equal(f.last().camp.ph, 'claim');
  assert.deepEqual([f.last().camp.x, f.last().camp.y], [W / 2, 420], 'the body lies at the centre of the first row');
  f.run(200);
  assert.equal(f.last().camp.ph, 'claim', 'it waits for you');

  // Walk there. Keys are locked while the power comes across.
  Object.assign(f.me, { x: W / 2 + 20, y: 420, vx: 0, vy: 0, g: true, i: 0 });
  f.run();
  assert.equal(f.last().camp.ph, 'absorb');
  f.room.send(JSON.stringify({ s: 2, b: KEY.LEFT | KEY.JUMP }));
  const x = f.me.x;
  f.run(SWAP_AT - 1);
  assert.equal(f.me.x, x, 'held still');
  assert.equal(f.me.hero, SNIPER, 'not yet');
  f.run();
  assert.equal(f.me.hero, TRAPPER, 'you become the boss');
  assert.equal(f.me.cd, 0, 'with the new skill ready');
  assert.equal(f.last().p[0].hero, TRAPPER, 'and the screen hears about it');
  f.run(ABSORB_STEPS - SWAP_AT);
  assert.equal(f.last().camp.ph, 'done');
  const k = f.last().k;
  f.run(5);
  assert.equal(f.last().k, k, 'waits for the end screen');
  useMap(0);
}

// Losing all your lives ends the fight, without a next round.
{
  const f = fight();
  f.run();
  f.me.lives = 1;
  Object.assign(f.me, { y: H + 200, i: 0 });
  f.run();
  assert.equal(f.last().camp.ph, 'lost');
  assert.equal(f.last().o, 0);
  useMap(0);
}

// Both out on the same step: you still win, alive.
{
  const f = fight();
  f.run();
  f.me.lives = 1;
  f.boss.lives = 1;
  Object.assign(f.me, { y: H + 200, i: 0 });
  Object.assign(f.boss, { y: H + 200, i: 0 });
  f.run();
  assert.equal(f.last().camp.ph, 'death');
  assert.equal(f.me.lives, 1);
  assert.ok(f.me.y < H, 'back on the map');
  useMap(0);
}

// A boss really fights, and a whole round against it ends one way or the other, under the same rules as anyone.
{
  const f = fight();
  // Its cooldown, not a net in the air: thrown point blank, a net lands within the step it was thrown.
  let used = false;
  for (let t = 0; t < 30 * 240 && f.last()?.camp?.ph !== 'lost' && f.last()?.camp?.ph !== 'death'; t++) {
    f.run();
    used ||= f.boss.cd > 0;
  }
  assert.ok(used, 'the Trapper uses its skill');
  assert.ok(['lost', 'death'].includes(f.last().camp.ph), `the fight ended, ${f.last().camp.ph}`);
  useMap(0);
}

console.log('campaign tests passed');
