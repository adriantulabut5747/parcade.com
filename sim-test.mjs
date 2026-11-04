// Checks the game rules. Run: node sim-test.mjs
import assert from 'node:assert/strict';
import {
  BLIND_STEPS,
  DASH_CD,
  DECOY_STEPS,
  DID,
  DROP_MIN,
  DUSK,
  FLAME,
  FREEZE_STEPS,
  GHOST_STEPS,
  SCOPE_STEPS,
  SHURIKEN,
  TRAP_HOLD,
  useMap,
  ANGLER,
  ARC,
  MAPS,
  RIME,
  SHADE,
  TETHER,
  VANISH_STEPS,
  chooseMap,
  snapshotOf,
  BULWARK,
  DOG_HP,
  GUARD_STEPS,
  HANDLER,
  HOOK_STUN,
  ILLUSIONIST,
  MOSSBACK,
  POACHER,
  SANTA,
  TRAP_LIFE,
  TRAP_STEPS,
  WALL_H,
  WALL_HP,
  WALL_STEPS,
  WALL_W,
  GUNS,
  GUN_SHIFT,
  HERO_COUNT,
  ITEMS,
  KEY,
  LASER,
  LIVES,
  MINIGUN,
  NET_STEPS,
  NINJA,
  PICK_STEPS,
  PISTOL,
  PLATFORMS,
  RIFLE,
  ROCKET,
  SHIFTER,
  SHOTGUN,
  SKILL_CD,
  SNIPER,
  SNIPER_GUN,
  SPEED_STEPS,
  SPRINTER,
  TRAPPER,
  addPlayer,
  applyItem,
  chooseItem,
  dropCrate,
  isEndgame,
  movePlayer,
  newGame,
  padKeys,
  removePlayer,
  setHero,
  startRound,
  step,
  stickKeys,
} from './site/sim.js';

const none = () => 0;
const run = (s, n, keysOf = none) => {
  for (let i = 0; i < n; i++) step(s, keysOf);
};
const onMain = (p, x = 480) => Object.assign(p, { x, y: PLATFORMS[0].y, vx: 0, vy: 0, g: true, j: 2, i: 0, c: 0, b: 0 });
// A round in progress with these heroes.
function match(...heroes) {
  const s = newGame();
  s.choice = 0;
  const players = heroes.map((hero, id) => {
    const p = addPlayer(s, id);
    p.hero = hero;
    return p;
  });
  startRound(s);
  // Crates arrive at random, so most checks keep the sky clear.
  s.drop = 1e9;
  return [s, ...players];
}
const press = (p, key = KEY.SKILL) => {
  const did = movePlayer(p, key);
  movePlayer(p, 0);
  return did;
};
const item = (id) => ITEMS.findIndex((it) => it.id === id);
const shooter = (id) => (who) => (who === id ? KEY.SHOOT : 0);
const skill = (id) => (who) => (who === id ? KEY.SKILL : 0);

// Falling lands on a platform top.
let [s, a] = match(SNIPER);
run(s, 30);
assert.equal(a.g, true);

// Jumping up passes through a platform.
Object.assign(onMain(a, 180), { y: PLATFORMS[1].y + 40 });
a.x = PLATFORMS[1].x + 100;
for (let i = 0; i < 4; i++) movePlayer(a, i ? 0 : KEY.JUMP);
assert.ok(a.y < PLATFORMS[1].y && a.vy < 0 && !a.g);

// Down drops through a platform when there's another below it.
Object.assign(onMain(a), { x: PLATFORMS[3].x + 100, y: PLATFORMS[3].y });
for (let i = 0; i < 5; i++) movePlayer(a, KEY.DOWN);
assert.ok(a.y > PLATFORMS[3].y && !a.g);

// Down never drops you into the lava: not from the bottom floor, not from a ledge with nothing under it.
onMain(a);
for (let i = 0; i < 20; i++) movePlayer(a, KEY.DOWN);
assert.equal(a.y, PLATFORMS[0].y);
assert.equal(a.g, true);
Object.assign(onMain(a), { x: PLATFORMS[1].x + 30, y: PLATFORMS[1].y });
for (let i = 0; i < 20; i++) movePlayer(a, KEY.DOWN);
assert.equal(a.y, PLATFORMS[1].y);

// Holding Down the whole way from the top ends on a platform, not in the lava.
for (const pl of PLATFORMS) {
  for (const x of [pl.x + 5, pl.x + pl.w / 2, pl.x + pl.w - 5]) {
    Object.assign(onMain(a), { x, y: pl.y });
    for (let i = 0; i < 90; i++) movePlayer(a, KEY.DOWN);
    assert.equal(a.g, true, `fell through from ${pl.x},${pl.y} at x ${x}, now y ${a.y}`);
  }
}

// Only two jumps before landing; holding the key doesn't jump again.
onMain(a);
movePlayer(a, KEY.JUMP);
assert.equal(a.j, 1);
movePlayer(a, KEY.JUMP);
assert.equal(a.j, 1);
movePlayer(a, 0);
movePlayer(a, KEY.JUMP);
assert.equal(a.j, 0);
movePlayer(a, 0);
const vy = a.vy;
movePlayer(a, KEY.JUMP);
assert.ok(a.vy > vy, 'third jump must not fire');

// A shot knocks the other player away and lifts them; the shooter can't hit themselves.
let b;
[s, a, b] = match(SNIPER, SNIPER);
onMain(a, 400);
onMain(b, 480);
a.f = 1;
run(s, 6, shooter(0));
assert.ok(b.vx > 10, `knockback, got ${b.vx}`);
assert.ok(a.vx < 0, 'recoil pushes the shooter back');
assert.equal(a.lives, LIVES);

// Falling off costs a life; the last one standing wins and the pick screen follows.
[s, a, b] = match(SNIPER, TRAPPER);
for (let life = LIVES; life > 0; life--) {
  onMain(a);
  b.x = 2000;
  run(s, 1);
  assert.equal(b.lives, life - 1);
}
assert.equal(s.win, 0);
assert.equal(a.wins, 1);
assert.ok(s.over > 0);
run(s, s.over);
assert.equal(s.over, 0);
assert.equal(s.pick, PICK_STEPS);

// Alone, falling off is free; a player leaving mid-match resets the survivor's lives.
[s, a] = match(SNIPER);
a.x = 2000;
run(s, 1);
assert.equal(a.lives, LIVES);
[s, a, b] = match(SNIPER, TRAPPER);
b.x = 2000;
run(s, 1);
assert.equal(b.lives, LIVES - 1);
removePlayer(s, 0);
assert.equal(s.players.length, 1);
assert.equal(b.lives, LIVES);

// Pick screen: the first player waits with no clock, and the round starts once they pick.
s = newGame();
a = addPlayer(s, 0);
run(s, PICK_STEPS * 2);
assert.equal(s.pick, PICK_STEPS);
setHero(s, 0, TRAPPER);
run(s, 1);
assert.equal(s.pick, 0);
assert.equal(a.hero, TRAPPER);

// A second player reopens it with a clock; nobody can stall, and a bad hero number is ignored.
b = addPlayer(s, 1);
assert.equal(s.pick, PICK_STEPS);
setHero(s, 1, 99);
setHero(s, 1, 1.5);
assert.equal(b.hero, null);
run(s, PICK_STEPS);
assert.equal(s.pick, 0);
assert.ok(b.hero >= 0 && b.hero < HERO_COUNT);
assert.equal(a.hero, TRAPPER);

// Mid-round heroes are locked with 2 players, but free when practising alone.
setHero(s, 0, NINJA);
assert.equal(a.hero, TRAPPER);
[s, a] = match(SNIPER);
setHero(s, 0, NINJA);
assert.equal(a.hero, NINJA);

// A third player joining mid-round stays out of the match until they pick.
[s, a, b] = match(SNIPER, TRAPPER);
const late = addPlayer(s, 2);
const startX = late.x;
run(s, 5);
assert.equal(late.x, startX);
assert.equal(s.pick, 0);
setHero(s, 2, NINJA);
assert.equal(late.hero, NINJA);
assert.equal(late.lives, LIVES);

// Every hero's cooldown, as agreed.
assert.deepEqual(SKILL_CD, [750, 450, 600, 750, 600, 450, 750, 600, 600, 450, 600, 750, 450, 750, 600, 750]);

// Sniper: 5 bullets, and using it again refills to 5 rather than adding.
[s, a, b] = match(SNIPER, TRAPPER);
onMain(a, 400);
onMain(b, 480);
assert.equal(press(a) & DID.EQUIP, DID.EQUIP);
assert.equal(a.gun, SNIPER_GUN);
assert.equal(a.ammo, 5);
const cdAfterPress = a.cd;
press(a);
assert.equal(a.ammo, 5, 'no refill during the cooldown');
assert.ok(a.cd < cdAfterPress, 'pressing again does not restart the cooldown');
a.cd = 0;
a.ammo = 3;
press(a);
assert.equal(a.ammo, 5, 'refill never stacks');

// Sniper bullets push harder both ways, and the pistol comes back after the 5th.
const fire = (gun, ammo) => {
  const [g, x, y] = match(SNIPER, TRAPPER);
  onMain(x, 400);
  onMain(y, 460);
  x.f = 1;
  x.gun = gun;
  x.ammo = ammo;
  run(g, 1, shooter(0));
  const recoil = -x.vx;
  run(g, 3);
  return { recoil, knock: y.vx };
};
const normal = fire(PISTOL, 0);
const sniped = fire(SNIPER_GUN, 1);
assert.ok(sniped.recoil > normal.recoil * 3, `sniper recoil ${sniped.recoil} vs ${normal.recoil}`);
assert.ok(sniped.knock > normal.knock * 1.5, `sniper knockback ${sniped.knock} vs ${normal.knock}`);
assert.ok(normal.knock > 11, `pistol push went up, got ${normal.knock}`);
[s, a] = match(SNIPER);
onMain(a);
a.gun = SNIPER_GUN;
a.ammo = 1;
assert.equal(movePlayer(a, KEY.SHOOT) >> GUN_SHIFT, SNIPER_GUN);
assert.equal(a.gun, PISTOL);
a.c = 0;
assert.equal(movePlayer(a, KEY.SHOOT) >> GUN_SHIFT, PISTOL);

// A fast bullet can't jump over a target between steps, at any distance.
for (let gap = 40; gap < 300; gap += 7) {
  const [g, x, y] = match(SNIPER, TRAPPER);
  onMain(x, 300);
  onMain(y, 300 + gap);
  x.f = 1;
  x.gun = SNIPER_GUN;
  x.ammo = 1;
  run(g, 1, shooter(0));
  run(g, 12);
  assert.ok(y.vx > 3, `missed at gap ${gap}`);
}

// Trapper: the net holds a player for 1 s, on a 15 s cooldown, and reaches across most of the arena.
[s, a, b] = match(TRAPPER, SNIPER);
onMain(a, 280);
onMain(b, 680);
a.f = 1;
assert.equal(NET_STEPS, 30);
run(s, 1, skill(0));
assert.equal(s.nets.length, 1);
assert.equal(a.cd, SKILL_CD[TRAPPER]);
run(s, 13);
assert.equal(s.nets.length, 0);
assert.ok(b.n > 0, 'net connected from 400 px away, in under half a second');
b.b = 0;
Object.assign(b, { n: 30 });
const heldX = b.x;
const heldY = b.y;
run(s, 1, (id) => (id === 1 ? KEY.RIGHT | KEY.JUMP : 0));
assert.ok(Math.abs(b.x - heldX) < 1 && b.y === heldY, 'netted player cannot run or jump');
assert.equal(b.f, 1, 'but can still turn');
const heldVx = b.vx;
s.bullets.push({ id: 900, x: b.x - 30, y: b.y - 18, vx: 18, vy: 0, o: 0, t: 5, k: 17, g: PISTOL });
run(s, 1);
assert.ok(b.vx > heldVx + 5, 'hits still push a netted player');

// A missed net still spends the cooldown, and a shooter keeps shooting from inside a net.
[s, a, b] = match(TRAPPER, SNIPER);
onMain(a, 400);
onMain(b, 300);
a.f = 1;
run(s, 1, skill(0));
run(s, 60);
assert.equal(s.nets.length, 0);
assert.ok(a.cd > 0);
Object.assign(onMain(b, 300), { n: 30 });
assert.equal(movePlayer(b, KEY.SHOOT) & DID.SHOT, DID.SHOT);

// Ninja: leave a decoy, return within 7 s, and the 20 s cooldown starts only when it's gone.
[s, a] = match(NINJA);
onMain(a, 300);
assert.equal(DECOY_STEPS, 210);
assert.equal(press(a) & DID.DECOY, DID.DECOY);
assert.equal(a.sx, 300);
assert.equal(a.cd, 0, 'no cooldown while the decoy is up');
a.x = 700;
assert.equal(press(a) & DID.TELEPORT, DID.TELEPORT);
assert.equal(a.x, 300);
assert.equal(a.st, 0);
assert.equal(a.cd, SKILL_CD[NINJA] - 1);
assert.equal(press(a), 0, 'cooldown blocks a new decoy');

// Not returning: the decoy fades at 7 s, and the same cooldown starts then.
[s, a] = match(NINJA);
onMain(a, 300);
press(a);
let faded = 0;
for (let i = 0; i < DECOY_STEPS; i++) faded |= movePlayer(a, 0);
assert.equal(faded & DID.FADE, DID.FADE);
assert.equal(a.st, 0);
assert.ok(a.cd >= SKILL_CD[NINJA] - 2, `cooldown after fade, got ${a.cd}`);

// The ninja can return out of a net.
[s, a] = match(NINJA);
onMain(a, 300);
press(a);
a.x = 600;
a.n = 30;
press(a);
assert.equal(a.x, 300);
assert.equal(a.n, 0);

// Losing a life clears crate guns and the decoy, and the decoy's cooldown still starts.
[s, a, b] = match(NINJA, SNIPER);
onMain(a, 300);
press(a);
a.x = 2000;
b.gun = SNIPER_GUN;
b.ammo = 3;
run(s, 1);
assert.equal(a.lives, LIVES - 1);
assert.equal(a.st, 0);
assert.equal(a.cd, SKILL_CD[NINJA]);
b.x = 2000;
run(s, 1);
assert.equal(b.gun, PISTOL);
assert.equal(b.ammo, 0);

// A new round wipes cooldowns.
startRound(s);
assert.equal(a.cd, 0);

// Sprinter: 25 s cooldown, runs half as fast again for 6 s.
const topSpeed = (p) => {
  onMain(p, 280);
  for (let i = 0; i < 20; i++) movePlayer(p, KEY.RIGHT);
  return p.vx;
};
[s, a] = match(SPRINTER);
const walking = topSpeed(a);
onMain(a, 200);
press(a);
assert.equal(a.sp, SPEED_STEPS - 1);
const running = topSpeed(a);
assert.ok(running > walking * 1.4, `boost ${running} vs ${walking}`);
for (let i = 0; i < SPEED_STEPS; i++) movePlayer(a, 0);
assert.equal(a.sp, 0);

// Shifter: while small, a bullet from the same floor flies over; it can still be hit from the side when big.
[s, a, b] = match(SNIPER, SHIFTER);
onMain(a, 400);
onMain(b, 480);
a.f = 1;
b.sm = 100;
run(s, 6, shooter(0));
assert.ok(Math.abs(b.vx) < 1, `small target on the same floor is safe, got ${b.vx}`);
[s, a, b] = match(SNIPER, SHIFTER);
onMain(a, 400);
onMain(b, 480);
a.f = 1;
run(s, 6, shooter(0));
assert.ok(b.vx > 10, 'at normal size the same shot connects');
[s, b] = match(SHIFTER);
onMain(b);
assert.equal(press(b) & DID.SHRINK, DID.SHRINK);
assert.ok(b.sm > 0);

// Santa: a really short throw, then a sideways shove with almost no lift. It spares the thrower.
[s, a, b] = match(SANTA, SNIPER);
onMain(a, 300);
onMain(b, 680);
a.f = 1;
run(s, 1, skill(0));
assert.equal(s.gifts.length, 1);
assert.equal(a.cd, SKILL_CD[SANTA]);
const flight = s.gifts[0];
let farthest = 0;
let fuse = 0;
for (let i = 0; i < 60 && s.gifts.length; i++) {
  farthest = flight.x - 300;
  fuse++;
  run(s, 1);
}
assert.equal(s.gifts.length, 0);
assert.equal(fuse + 1, 33, 'a gift waits 1.1 s, counting the step it was thrown');
assert.ok(farthest < 170, `the throw stays short, went ${farthest}`);
assert.ok(s.fx.some((f) => f.k === 'blast'));
[s, a, b] = match(SANTA, SNIPER);
onMain(a, 400);
onMain(b, 450);
s.gifts.push({ id: 1, x: 420, y: PLATFORMS[0].y - 18, vx: 0, vy: 0, o: 0, t: 1 });
run(s, 1);
assert.ok(Math.abs(a.vx) < 1, `thrower spared, got ${a.vx}`);
assert.ok(b.vx > 20, `a gift shoves hard sideways, got ${b.vx}`);
assert.ok(b.vy > -3, `with almost no lift, got ${b.vy}`);
const slideFrom = b.x;
let highest = b.y;
for (let i = 0; i < 10; i++) {
  run(s, 1);
  highest = Math.min(highest, b.y);
}
assert.ok(PLATFORMS[0].y - highest < 8, `barely leaves the floor, rose ${PLATFORMS[0].y - highest}`);
assert.ok(b.x - slideFrom > 120, `and keeps sliding, went ${b.x - slideFrom}`);

// Dusk: the tall wave goes through players, and blinds and slows each enemy once.
[s, a, b] = match(DUSK, SNIPER, TRAPPER);
onMain(a, 280);
onMain(b, 400);
Object.assign(s.players[2], { x: 600, y: PLATFORMS[0].y, vx: 0, vy: 0, g: true, j: 2, i: 0, c: 0, b: 0 });
a.f = 1;
run(s, 1, skill(0));
assert.equal(s.waves.length, 1);
run(s, 40);
assert.ok(b.bl > 0, 'first enemy blinded');
assert.ok(s.players[2].bl > 0, 'wave carried on to the second enemy');
assert.equal(a.bl, 0, 'not the caster');
const blindCount = s.fx.filter((f) => f.k === 'blinded').length;
assert.equal(blindCount, 2, 'each enemy hit once');
[s, b] = match(SNIPER);
const clearRun = topSpeed(b);
b.bl = BLIND_STEPS;
const slowRun = topSpeed(b);
assert.ok(slowRun < clearRun * 0.8, `blind slows, ${slowRun} vs ${clearRun}`);
assert.ok(slowRun > clearRun * 0.6, 'but only a little');
// The wave is tall: it reaches someone on the platform above.
[s, a, b] = match(DUSK, SNIPER);
onMain(a, 300);
Object.assign(onMain(b, 245), { y: PLATFORMS[4].y });
b.x = 200;
a.f = -1;
run(s, 1, skill(0));
run(s, 10);
assert.ok(b.bl > 0, 'wave hit a player one floor up');

// Movement: run 195 px/s, one jump about 88 px, both jumps about 156 px.
[s, a] = match(SNIPER);
assert.equal(topSpeed(a) * 30, 195);
const jumpHeight = (presses) => {
  onMain(a);
  let top = a.y;
  for (let i = 0; i < 60; i++) {
    const press = presses.includes(i) ? KEY.JUMP : 0;
    movePlayer(a, press);
    top = Math.min(top, a.y);
  }
  return PLATFORMS[0].y - top;
};
assert.ok(Math.abs(jumpHeight([0]) - 88) < 3, `one jump, got ${jumpHeight([0])}`);
assert.ok(Math.abs(jumpHeight([0, 10]) - 156) < 14, `two jumps, got ${jumpHeight([0, 10])}`);

// The map: every platform can be reached from one below it, with one jump or two.
for (const [i, pl] of PLATFORMS.entries()) {
  if (i === 0) continue;
  const below = PLATFORMS.filter((o) => o.y > pl.y && o.y - pl.y <= 150);
  const near = below.some((o) => o.x < pl.x + pl.w + 130 && o.x + o.w > pl.x - 130);
  assert.ok(near, `platform ${i} can't be reached`);
  assert.ok(pl.w <= 160, `platform ${i} is small`);
}
assert.ok(PLATFORMS[0].w < 600 && PLATFORMS.length === 9);

// Everyone's dash: short, on its own 7 s cooldown, doesn't touch the skill, and stops any knockback you carried.
[s, a] = match(SNIPER);
onMain(a, 300);
a.f = 1;
assert.equal(movePlayer(a, KEY.DASH) & DID.DASH, DID.DASH);
for (let i = 0; i < 4; i++) movePlayer(a, 0);
assert.ok(a.x - 300 > 90 && a.x - 300 < 130, `dash distance, got ${a.x - 300}`);
assert.equal(a.cd, 0, 'the dash leaves the skill alone');
assert.equal(a.sp, 0, 'and gives no speed boost');
assert.equal(a.dc, DASH_CD - 4);
assert.equal(press(a, KEY.DASH) & DID.DASH, 0, 'cooldown blocks a second dash');
a.dc = 0;
Object.assign(a, { vx: -30, f: 1, g: false, y: 200 });
press(a, KEY.DASH);
assert.ok(a.vx > 0, 'a dash cancels knockback');
// A net holds you through a dash now.
a.dc = 0;
Object.assign(onMain(a, 300), { n: 30 });
assert.equal(movePlayer(a, KEY.DASH) & DID.DASH, 0, 'no dash in a net');
assert.ok(a.n > 0);

// Every hit pushes 20% harder than before.
[s, a, b] = match(SNIPER, TRAPPER);
onMain(b, 450);
s.bullets.push({ id: 950, x: 420, y: b.y - 18, vx: 18, vy: 0, o: 0, t: 5, k: 10, g: PISTOL });
run(s, 1);
assert.ok(Math.abs(b.vx - 12) < 1.5, `knockback is 1.2x, got ${b.vx}`);

// Bulwark: blocks bullets for 4 s, and whoever touches her flies back at twice a pistol hit.
[s, a, b] = match(BULWARK, SNIPER);
onMain(a, 400);
onMain(b, 600);
assert.equal(press(a) & DID.GUARD, DID.GUARD);
assert.equal(a.gd, GUARD_STEPS - 1);
assert.equal(a.cd, SKILL_CD[BULWARK] - 1);
s.bullets.push({ id: 951, x: 370, y: a.y - 18, vx: 18, vy: 0, o: 1, t: 5, k: 17, g: PISTOL });
run(s, 2);
assert.ok(Math.abs(a.vx) < 1, `guard stops the bullet, got ${a.vx}`);
assert.equal(s.bullets.length, 0);
onMain(b, a.x + 20);
run(s, 1);
assert.ok(b.vx > 15 && b.vx < 25, `touching her throws you back, but no harder than a pistol, got ${b.vx}`);
const thrown = b.vx;
run(s, 1);
assert.ok(b.vx <= thrown, 'only one shove per touch');
[s, a, b] = match(BULWARK, SNIPER);
onMain(a, 400);
Object.assign(onMain(b, 420));
run(s, 2);
assert.ok(Math.abs(b.vx) < 1, 'no shove without the guard up');
a.gd = 1;
movePlayer(a, 0);
assert.equal(a.gd, 0);

// Illusionist: 2 clones for 5 s, on a 20 s cooldown. Any hit removes one, and they don't hurt or collect anything.
[s, a, b] = match(ILLUSIONIST, SNIPER);
onMain(a, 400);
onMain(b, 680);
run(s, 1, skill(0));
assert.equal(s.clones.length, 2);
assert.equal(a.cd, SKILL_CD[ILLUSIONIST]);
assert.equal(s.clones[0].o, 0);
const clone = s.clones[0];
Object.assign(clone, { x: 500, y: PLATFORMS[0].y, vx: 0, vy: 0, g: true, w: 99, d: 0, sh: 99 });
s.bullets.push({ id: 952, x: 470, y: clone.y - 18, vx: 18, vy: 0, o: 1, t: 5, k: 17, g: PISTOL });
run(s, 2);
assert.equal(s.clones.length, 1, 'a bullet removes a clone');
assert.equal(s.bullets.length, 0, 'and is used up on it');
assert.ok(s.fx.some((f) => f.k === 'poof'));
run(s, 150, () => 0);
assert.equal(s.clones.length, 0, 'gone within 5 s');
[s, a, b] = match(ILLUSIONIST, SNIPER);
onMain(a, 400);
run(s, 1, skill(0));
s.clones[0].x = 500;
s.clones[0].y = PLATFORMS[0].y;
s.bullets.push({ id: 953, x: 470, y: s.clones[0].y - 18, vx: 18, vy: 0, o: 0, t: 2, k: 17, g: PISTOL });
run(s, 1);
assert.equal(s.clones.length, 2, 'your own bullets pass through your clones');

// Clones wander but stay out of the lava for the most part: they turn back at a ledge.
let clonesLeft = 0;
for (let i = 0; i < 40; i++) {
  [s, a] = match(ILLUSIONIST);
  onMain(a, 480);
  run(s, 1, skill(0));
  run(s, 75);
  clonesLeft += s.clones.length;
}
assert.ok(clonesLeft > 50, `clones should still be around at 2.5 s, got ${clonesLeft}/80`);

// Poacher: the trap lands on the floor, slows the first enemy for 3 s, and only they lose it.
[s, a, b] = match(POACHER, SNIPER);
onMain(a, 400);
onMain(b, 680);
a.f = 1;
run(s, 1, skill(0));
assert.equal(s.traps.length, 1);
assert.equal(a.cd, SKILL_CD[POACHER]);
for (let i = 0; i < 30 && !s.traps[0].g; i++) run(s, 1);
const trap = s.traps[0];
assert.ok(trap.g && trap.y === PLATFORMS[0].y, 'trap landed');
assert.equal(trap.t > TRAP_LIFE - 30, true);
onMain(a, trap.x);
run(s, 1);
assert.equal(s.traps.length, 1, "doesn't catch its owner");
onMain(a, 300);
onMain(b, trap.x);
run(s, 1);
assert.equal(s.traps.length, 0, 'one use');
assert.equal(b.tr, TRAP_STEPS);
[s, b] = match(SNIPER);
const freeRun = topSpeed(b);
b.tr = 100;
const trapRun = topSpeed(b);
assert.ok(trapRun < freeRun * 0.5, `very slow, ${trapRun} vs ${freeRun}`);
b.tr = 100;
onMain(b);
movePlayer(b, KEY.JUMP);
assert.ok(b.vy > -14, 'and jumps less');

// Never more than 3 traps: a 4th removes the oldest, even though 70 s and 20 s would allow 4. They vanish at 70 s.
[s, a] = match(POACHER);
onMain(a, 480);
const trapIds = [];
for (let i = 0; i < 4; i++) {
  a.cd = 0;
  Object.assign(a, { b: 0, x: 300 + i * 80, y: PLATFORMS[0].y, vy: 0, g: true });
  run(s, 1, skill(0));
  trapIds.push(s.traps[s.traps.length - 1].id);
  a.b = 0;
  run(s, 1);
}
assert.equal(s.traps.length, 3);
assert.deepEqual(
  s.traps.map((t) => t.id),
  trapIds.slice(1),
);
s.traps.length = 1;
s.traps[0].t = 2;
run(s, 3);
assert.equal(s.traps.length, 0, 'gone when its time is up');

// Angler: the hook catches an enemy and leaves them just behind you, stunned for 0.4 s. It reaches about 400 px.
[s, a, b] = match(ANGLER, SNIPER);
onMain(a, 300);
onMain(b, 600);
a.f = 1;
run(s, 1, skill(0));
assert.equal(s.hooks.length, 1);
assert.equal(a.cd, SKILL_CD[ANGLER]);
for (let i = 0; i < 40 && s.hooks.length; i++) run(s, 1);
assert.ok(b.x < a.x, `hooked enemy ends up behind you, ${b.x} vs ${a.x}`);
assert.ok(Math.abs(b.x - (a.x - 34)) < 8, `right behind you, ${b.x} vs ${a.x}`);
assert.ok(b.hk > 0 && b.hk <= HOOK_STUN, `and stunned, got ${b.hk}`);
const stunnedX = b.x;
Object.assign(b, { g: true, vx: 0, vy: 0, y: PLATFORMS[0].y, b: 0 });
assert.equal(movePlayer(b, KEY.SHOOT | KEY.DASH | KEY.JUMP | KEY.RIGHT), 0, 'a stunned player can do nothing');
assert.ok(Math.abs(b.x - stunnedX) < 1);
assert.ok(b.vy >= 0);
assert.equal(HOOK_STUN, 24);
// Facing the wrong way, standing at the edge: the enemy lands over the lava with nothing under them.
[s, a, b] = match(ANGLER, SNIPER);
onMain(a, 285);
onMain(b, 500);
a.f = 1;
run(s, 1, skill(0));
for (let i = 0; i < 40 && s.hooks.length; i++) run(s, 1);
assert.ok(b.x + 12 < PLATFORMS[0].x, `dropped off the edge, x ${b.x}`);
run(s, 8);
assert.ok(b.y > PLATFORMS[0].y, 'and falling');
// It reaches right across the map.
[s, a, b] = match(ANGLER, SNIPER);
Object.assign(onMain(a, 280), { f: 1 });
Object.assign(b, { x: 950, y: PLATFORMS[0].y, vx: 0, vy: 0, g: true, i: 0 });
run(s, 1, skill(0));
for (let i = 0; i < 40 && !b.hk; i++) {
  b.y = PLATFORMS[0].y;
  b.vy = 0;
  run(s, 1);
}
assert.ok(b.hk > 0, 'caught from 670 px away');
// It flies past nobody: a player behind it is not caught.
[s, a, b] = match(ANGLER, SNIPER);
Object.assign(onMain(a, 500), { f: 1 });
onMain(b, 300);
run(s, 30, skill(0));
assert.equal(b.hk, 0, 'nothing behind the thrower');
// The hook can't fly through a wall, even at this speed.
for (let x = 340; x < 400; x += 7) {
  [s, a, b] = match(ANGLER, MOSSBACK);
  Object.assign(onMain(a, 300), { f: 1 });
  onMain(b, 600);
  s.walls.push({ id: 900, o: 1, x, y: PLATFORMS[0].y, hp: 10, t: 100 });
  run(s, 30, skill(0));
  assert.equal(b.hk, 0, `hook went through a wall at ${x}`);
}
// A guard blocks it and a clone wastes it.
[s, a, b] = match(ANGLER, BULWARK);
onMain(a, 300);
onMain(b, 400);
a.f = 1;
b.gd = 60;
run(s, 1, skill(0));
run(s, 8);
assert.equal(s.hooks.length, 0);
assert.equal(b.hk, 0, 'blocked');
assert.ok(b.x > a.x);

// Handler: the dog chases the nearest enemy, shoves them every 1.5 s, dies after 5 shots or 12 s, and is 30 s apart.
[s, a, b] = match(HANDLER, SNIPER);
onMain(a, 300);
onMain(b, 450);
b.i = 0;
a.f = 1;
run(s, 1, skill(0));
assert.equal(s.dogs.length, 1);
assert.equal(a.cd, SKILL_CD[HANDLER]);
assert.equal(SKILL_CD[HANDLER], 750);
let bites = 0;
for (let i = 0; i < 80; i++) {
  Object.assign(b, { x: 450, y: PLATFORMS[0].y, vx: 0, vy: 0, g: true, i: 0 });
  run(s, 1);
  if (b.vx !== 0) bites++;
}
assert.equal(bites, 2, `first bite on arrival, then 1.5 s apart, got ${bites}`);
const dog = s.dogs[0];
assert.ok(dog.x > 300, 'the dog ran at them');
for (let i = 0; i < DOG_HP; i++) {
  assert.equal(s.dogs.length, 1, `still alive after ${i} shots`);
  s.bullets.push({ id: 960 + i, x: dog.x - 30, y: dog.y - 12, vx: 18, vy: 0, o: 1, t: 5, k: 17, g: PISTOL });
  Object.assign(dog, { c: 99 });
  run(s, 2);
}
assert.equal(s.dogs.length, 0, 'dies on the 5th shot');
assert.ok(s.fx.some((f) => f.k === 'dogout'));
[s, a, b] = match(HANDLER, SNIPER);
onMain(a, 300);
run(s, 1, skill(0));
s.dogs[0].t = 2;
Object.assign(b, { x: 600, y: 100, i: 1e9 });
run(s, 3);
assert.equal(s.dogs.length, 0, 'gone when its time is up');
// A dog in the lava is gone, and a flamethrower can't kill it in a blink.
[s, a, b] = match(HANDLER, SNIPER);
s.dogs.push({ id: 980, o: 0, x: 100, y: 620, vx: 0, vy: 0, g: false, f: 1, t: 100, hp: DOG_HP, c: 0 });
Object.assign(a, { x: 300, y: 100, i: 1e9 });
Object.assign(b, { x: 600, y: 100, i: 1e9 });
run(s, 1);
assert.equal(s.dogs.length, 0);
assert.ok(GUNS[FLAME].dmg < 0.2 && GUNS[MINIGUN].dmg < 1);

// Mossback: a wall in front of you. Nobody walks through it, bullets stop, and it can be stood on.
[s, a, b] = match(MOSSBACK, SNIPER);
onMain(a, 400);
onMain(b, 600);
a.f = 1;
run(s, 1, skill(0));
assert.equal(s.walls.length, 1);
assert.equal(a.cd, SKILL_CD[MOSSBACK]);
const wall = s.walls[0];
assert.equal(wall.hp, WALL_HP);
assert.equal(wall.y, PLATFORMS[0].y);
assert.ok(wall.x > a.x, 'in front of you');
Object.assign(onMain(b, wall.x + 60));
const walkLeft = (id) => (id === 1 ? KEY.LEFT : 0);
run(s, 30, walkLeft);
assert.ok(b.x >= wall.x + WALL_W / 2 + 11, `walked into a wall, x ${b.x} vs wall ${wall.x}`);
s.bullets.push({ id: 970, x: wall.x + 40, y: b.y - 18, vx: -18, vy: 0, o: 1, t: 8, k: 17, g: PISTOL });
const aBefore = a.vx;
run(s, 6);
assert.equal(s.bullets.length, 0, 'bullet stopped');
assert.equal(wall.hp, WALL_HP - 1, 'and chipped the wall');
assert.ok(Math.abs(a.vx - aBefore) < 1, 'nothing reached the far side');
// Standing on top.
Object.assign(b, { x: wall.x, y: wall.y - WALL_H - 10, vx: 0, vy: 0, g: false, i: 0 });
run(s, 8);
assert.equal(b.y, wall.y - WALL_H);
assert.equal(b.g, true, 'stands on the wall');
// Being knocked hard into one can't punch through it.
Object.assign(onMain(b, wall.x + 40), { vx: -200 });
run(s, 1);
assert.ok(b.x > wall.x, 'a huge hit stops at the wall');
// A laser stops at it too.
[s, a, b] = match(SNIPER, MOSSBACK);
onMain(a, 300);
onMain(b, 500);
s.walls.push({ id: 971, o: 1, x: 400, y: PLATFORMS[0].y, hp: WALL_HP, t: 100 });
a.f = 1;
a.gun = LASER;
a.ammo = 6;
run(s, 1, shooter(0));
assert.ok(Math.abs(b.vx) < 1, `laser stopped, got ${b.vx}`);
assert.equal(s.walls[0].hp, WALL_HP - 1);
// Blasts go through: the wall loses one shot, and whoever is behind it still gets shoved.
[s, a, b] = match(SNIPER, MOSSBACK);
onMain(a, 300);
onMain(b, 450);
s.walls.push({ id: 972, o: 1, x: 400, y: PLATFORMS[0].y, hp: WALL_HP, t: 100 });
s.bullets.push({ id: 973, x: 360, y: b.y - 18, vx: 14, vy: 0, o: 0, t: 5, k: 32, g: ROCKET });
run(s, 2);
assert.ok(s.fx.some((f) => f.k === 'blast'), 'rocket bursts on the wall');
assert.ok(b.vx > 4, `blast reached behind it, got ${b.vx}`);
assert.equal(s.walls[0].hp, WALL_HP - 1);
// 10 shots break it, and flames count for very little. It also vanishes at 10 s.
s.walls[0].hp = 1;
s.bullets.push({ id: 974, x: 360, y: b.y - 18, vx: 18, vy: 0, o: 0, t: 5, k: 17, g: PISTOL });
run(s, 2);
assert.equal(s.walls.length, 0, '10th shot breaks it');
assert.equal(WALL_STEPS, 300);
[s, a] = match(MOSSBACK);
onMain(a, 400);
a.f = 1;
run(s, 1, skill(0));
s.walls[0].t = 2;
run(s, 2);
assert.equal(s.walls.length, 0, 'gone at 10 s');
// In mid-air with no floor below, nothing happens and the cooldown is kept.
[s, a] = match(MOSSBACK);
Object.assign(a, { x: 20, y: 300, vy: 0, g: false, i: 0, b: 0, f: -1 });
assert.equal(movePlayer(a, KEY.SKILL), 0);
assert.equal(a.cd, 0);
// The browser predicts with the same walls, so it can't walk through one either.
[s, a] = match(MOSSBACK);
onMain(a, 400);
movePlayer(a, KEY.RIGHT, [{ x: 440, y: PLATFORMS[0].y }]);
for (let i = 0; i < 20; i++) movePlayer(a, KEY.RIGHT, [{ x: 440, y: PLATFORMS[0].y }]);
assert.ok(a.x <= 440 - WALL_W / 2 - 12, `prediction respects walls, x ${a.x}`);

// Guns: limited ammo, then back to the pistol. A shotgun has exactly 10 shots.
assert.equal(GUNS[SHOTGUN].ammo, 10);
[s, a] = match(SNIPER);
onMain(a);
applyItem(s, a, item('shotgun'));
assert.equal(a.gun, SHOTGUN);
let shots = 0;
for (let i = 0; i < 400 && a.gun === SHOTGUN; i++) {
  Object.assign(a, { x: 480, y: PLATFORMS[0].y, vy: 0 });
  if (movePlayer(a, KEY.SHOOT) & DID.SHOT) shots++;
}
assert.equal(shots, 10);
assert.equal(a.gun, PISTOL);

// A shotgun blast is a spread of pellets; a rifle fires single, faster shots than a pistol.
[s, a] = match(SNIPER);
onMain(a);
a.gun = SHOTGUN;
a.ammo = 10;
run(s, 1, shooter(0));
assert.equal(s.bullets.length, 5);
assert.ok(GUNS[RIFLE].cool < GUNS[PISTOL].cool);
assert.ok(GUNS[MINIGUN].cool < GUNS[RIFLE].cool);
assert.equal(GUNS[FLAME].life < GUNS[PISTOL].life, true, 'flamethrower is short range');

// A laser hits everyone in line at once, on that side only.
[s, a, b] = match(SNIPER, TRAPPER, NINJA);
const third = s.players[2];
onMain(a, 300);
onMain(b, 450);
onMain(third, 600);
const behind = addPlayer(s, 3);
behind.hero = SHIFTER;
onMain(behind, 280);
a.f = 1;
a.gun = LASER;
a.ammo = 6;
run(s, 1, shooter(0));
assert.ok(b.vx > 10 && third.vx > 10, 'laser reached both');
assert.ok(Math.abs(behind.vx) < 1, 'nothing behind the shooter');

// A rocket bursts on the first player it reaches and can catch the shooter too.
[s, a, b] = match(SNIPER, TRAPPER);
onMain(a, 400);
onMain(b, 470);
a.f = 1;
a.gun = ROCKET;
a.ammo = 3;
run(s, 4, shooter(0));
assert.ok(s.fx.some((f) => f.k === 'blast'));
assert.ok(b.vx > 8, `rocket pushed the target, got ${b.vx}`);
assert.ok(a.vx < -3, `rocket pushed the shooter too, got ${a.vx}`);

// Cooldown power-ups cut 3, 5 and 10 s; the rare refresh wipes it.
[s, a] = match(TRAPPER);
for (const [id, cut] of [
  ['cd3', 90],
  ['cd5', 150],
  ['cd10', 300],
]) {
  a.cd = 400;
  applyItem(s, a, item(id));
  assert.equal(a.cd, 400 - cut);
}
a.cd = 50;
applyItem(s, a, item('cd10'));
assert.equal(a.cd, 0, 'never below zero');
a.cd = 400;
applyItem(s, a, item('refresh'));
assert.equal(a.cd, 0);
assert.ok(ITEMS[item('refresh')].rare);

// Shield: stops 2 hits then pops; it also runs out after 10 s.
[s, a, b] = match(SNIPER, TRAPPER);
onMain(a, 400);
onMain(b, 450);
a.f = 1;
applyItem(s, b, item('shield'));
const shieldHit = () => {
  s.bullets.push({ id: 901, x: 420, y: b.y - 18, vx: 18, vy: 0, o: 0, t: 5, k: 17, g: PISTOL });
  run(s, 1);
};
shieldHit();
assert.equal(b.sh, 1);
assert.ok(Math.abs(b.vx) < 1);
onMain(b, 450);
shieldHit();
assert.equal(b.sh, 0);
assert.ok(Math.abs(b.vx) < 1);
onMain(b, 450);
shieldHit();
assert.ok(b.vx > 5, 'third hit lands');
[s, a] = match(SNIPER);
onMain(a);
applyItem(s, a, item('shield'));
for (let i = 0; i < 300; i++) {
  Object.assign(a, { vy: 0, y: PLATFORMS[0].y });
  movePlayer(a, 0);
}
assert.equal(a.sh, 0);

// Heavy boots halve a hit.
const hitWith = (id) => {
  const [g, x, y] = match(SNIPER, TRAPPER);
  onMain(x, 400);
  onMain(y, 450);
  if (id) applyItem(g, y, item(id));
  g.bullets.push({ id: 902, x: 420, y: y.y - 18, vx: 18, vy: 0, o: 0, t: 5, k: 20, g: PISTOL });
  run(g, 1);
  return y.vx;
};
const plain = hitWith();
const heavy = hitWith('heavy');
assert.ok(heavy < plain * 0.7, `heavy ${heavy} vs ${plain}`);

// Extra life adds one and the HUD isn't capped by it.
[s, a] = match(SNIPER);
applyItem(s, a, item('life'));
assert.equal(a.lives, LIVES + 1);

// Rocket boots: a third jump, for 15 s.
[s, a] = match(SNIPER);
onMain(a);
applyItem(s, a, item('boots'));
assert.equal(a.rb, 450);
onMain(a);
a.j = 3;
for (let i = 0; i < 6; i++) movePlayer(a, i % 2 ? 0 : KEY.JUMP);
assert.equal(a.j, 0, 'three jumps used');

// Golden bullets push twice as hard; a giant's bullets harder too, and a giant is a bigger target.
const pushed = (id) => {
  const [g, x, y] = match(SNIPER, TRAPPER);
  onMain(x, 400);
  onMain(y, 460);
  x.f = 1;
  if (id) applyItem(g, x, item(id));
  run(g, 4, shooter(0));
  return y.vx;
};
const base = pushed();
assert.ok(pushed('golden') > base * 1.7, 'golden bullets');
assert.ok(pushed('giant') > base * 1.3, 'giant bullets');

// Low gravity floats everyone in the room, and only for a while.
[s, a, b] = match(SNIPER, TRAPPER);
applyItem(s, a, item('lowg'));
assert.equal(b.lg, a.lg);
onMain(a);
movePlayer(a, KEY.JUMP);
const floatRise = a.vy;
[s, b] = match(SNIPER);
onMain(b);
movePlayer(b, KEY.JUMP);
assert.equal(b.lg, 0);
for (let i = 0; i < 4; i++) {
  movePlayer(a, 0);
  movePlayer(b, 0);
}
assert.ok(a.y < b.y, 'floats higher');
assert.ok(floatRise < 0);

// Crates fall slowly, land on a platform, and go to whoever touches them.
[s, a] = match(SNIPER);
Object.assign(a, { x: 2000, y: 0, i: 1e9 });
const held = () => Object.assign(a, { x: 300, y: -500, vx: 0, vy: 0 });
dropCrate(s, item('rifle'));
held();
const crate = s.crates[0];
const startY = crate.y;
for (let i = 0; i < 30; i++) {
  run(s, 1);
  held();
}
assert.ok(crate.y - startY < 60, `falls under 60 px a second, got ${crate.y - startY}`);
for (let i = 0; i < 400 && !crate.g; i++) {
  run(s, 1);
  held();
}
assert.ok(crate.g, 'landed on a platform');
assert.equal(s.crates.length, 1);
Object.assign(a, { x: crate.x, y: crate.y, vy: 0, g: true });
run(s, 1);
assert.equal(a.gun, RIFLE);
assert.equal(s.crates.length, 0);
assert.ok(s.fx.some((f) => f.k === 'pickup'));

// Crates keep coming on their own, at least 15 s apart, and never more than 2 at once.
[s, a] = match(SNIPER);
s.drop = 1;
Object.assign(a, { x: 300, y: -500, i: 1e9 });
let lastDrop = -1;
let seenCrates = 0;
const gaps = [];
for (let i = 0; i < 2400; i++) {
  a.y = -500;
  a.vy = 0;
  const before = s.nextId;
  run(s, 1);
  if (s.nextId > before) {
    if (lastDrop >= 0) gaps.push(i - lastDrop);
    lastDrop = i;
    seenCrates++;
  }
  assert.ok(s.crates.length <= 2);
}
assert.ok(seenCrates >= 2, `crates arrived, got ${seenCrates}`);
assert.ok(
  gaps.every((g) => g >= DROP_MIN),
  `at least 15 s apart, got ${gaps}`,
);

// Meteors are endgame only: never early, never while everyone has lives to spare.
[s, a, b] = match(SNIPER, TRAPPER);
assert.equal(isEndgame(s), false);
const rolls = (g) => {
  const seen = new Set();
  for (let r = 0; r <= 1; r += 0.001) seen.add(ITEMS[chooseItem(g, r)].id);
  return seen;
};
assert.ok(!rolls(s).has('meteor'), 'not at the start');
s.round = 1e5;
assert.ok(!rolls(s).has('meteor'), 'not while nobody is on their last life');
b.lives = 1;
s.round = 100;
assert.ok(!rolls(s).has('meteor'), 'not early, even on a last life');
s.round = 1e5;
assert.equal(isEndgame(s), true);
assert.ok(rolls(s).has('meteor'), 'possible at the end');
const total = ITEMS.reduce((sum, it) => sum + it.w, 0);
assert.ok(ITEMS[item('meteor')].w / total < 0.02, 'and rare even then');
applyItem(s, a, item('meteor'));
Object.assign(onMain(a), { i: 1e9 });
Object.assign(onMain(b), { i: 1e9 });
run(s, 30);
assert.ok(s.rocks.length > 0, 'rocks are falling');

// Joystick: dead in the middle, running doesn't jump, a firm push up does.
assert.equal(stickKeys(0.1, -0.1), 0);
assert.equal(stickKeys(-1, 0), KEY.LEFT);
assert.equal(stickKeys(0.9, -0.3), KEY.RIGHT);
assert.equal(stickKeys(0.7, -0.7), KEY.RIGHT | KEY.JUMP);
assert.equal(stickKeys(0, 1), KEY.DOWN);

// 4-way pad: each arm is one direction, and a thumb between two presses both.
assert.equal(padKeys(0, 0), 0);
assert.equal(padKeys(0, -1), KEY.JUMP);
assert.equal(padKeys(0, 1), KEY.DOWN);
assert.equal(padKeys(-1, 0), KEY.LEFT);
assert.equal(padKeys(1, 0), KEY.RIGHT);
assert.equal(padKeys(0.7, -0.7), KEY.RIGHT | KEY.JUMP);
assert.equal(padKeys(-0.25, 0), KEY.LEFT, 'the inner edge of an arrow works');
assert.equal(padKeys(-0.65, 0.3), KEY.LEFT, 'a thumb off-centre on one arrow presses only that arrow');
assert.equal(padKeys(0.1, 0.1), 0, 'the very middle does nothing');

// Every gun but the sniper pushes harder than it used to.
assert.equal(GUNS[SNIPER_GUN].knock, 34);
assert.equal(GUNS[PISTOL].knock, 21);
assert.ok(GUNS[RIFLE].knock > 13 && GUNS[SHOTGUN].knock > 11 && GUNS[ROCKET].knock > 32 && GUNS[MINIGUN].knock > 6 && GUNS[FLAME].knock > 4 && GUNS[LASER].knock > 24);

// Poacher's trap catches from about 67 px away.
[s, a, b] = match(POACHER, SNIPER);
onMain(a, 300);
onMain(b, 440);
s.traps.push({ id: 990, x: 400, y: PLATFORMS[0].y, vx: 0, vy: 0, o: 0, t: 100, g: true });
run(s, 1);
assert.equal(b.tr, TRAP_STEPS, 'caught at 40 px');
[s, a, b] = match(POACHER, SNIPER);
onMain(a, 300);
onMain(b, 480);
s.traps.push({ id: 991, x: 400, y: PLATFORMS[0].y, vx: 0, vy: 0, o: 0, t: 100, g: true });
run(s, 1);
assert.equal(b.tr, 0, 'safe at 80 px');

// Clones fire weak real bullets at a level enemy, and those bullets belong to their owner.
[s, a, b] = match(ILLUSIONIST, SNIPER);
onMain(a, 400);
onMain(b, 600);
run(s, 1, skill(0));
for (const c of s.clones) Object.assign(c, { sh: 1, y: PLATFORMS[0].y, g: true, x: 480, w: 99, d: 0 });
run(s, 2);
assert.equal(s.bullets.length, 2, 'both clones fired');
assert.ok(s.bullets.every((n) => n.o === 0 && n.vx > 0 && n.k < GUNS[PISTOL].knock * 0.3), 'weak shots at the enemy');
for (let i = 0; i < 12; i++) {
  Object.assign(b, { y: PLATFORMS[0].y, vy: 0, g: true });
  run(s, 1);
}
assert.ok(b.vx !== 0 || b.x !== 600, 'and they really nudge you');

// Sprinter: the boost comes with a 5-shot beam gun, stronger than the pistol, weaker than the sniper.
[s, a, b] = match(SPRINTER, SNIPER);
onMain(a, 300);
onMain(b, 500);
a.f = 1;
press(a);
assert.equal(a.gun, ARC);
assert.equal(a.ammo, 5);
assert.ok(GUNS[ARC].knock > GUNS[PISTOL].knock && GUNS[ARC].knock < GUNS[SNIPER_GUN].knock);
a.c = 0;
run(s, 1, shooter(0));
assert.ok(b.vx > 20, `the beam hit from 200 px away, got ${b.vx}`);
assert.equal(a.ammo, 4);

// Rime: a slow storm rolls forward for 4 s and throws back whoever it reaches, again and again.
[s, a, b] = match(RIME, SNIPER);
onMain(a, 300);
onMain(b, 480);
a.f = 1;
run(s, 1, skill(0));
assert.equal(s.storms.length, 1);
assert.equal(a.cd, SKILL_CD[RIME]);
const stormStart = s.storms[0].x;
run(s, 10);
assert.ok(s.storms[0].x - stormStart < 50, 'it rolls slowly');
s.storms[0].x = 440;
const nudged = b.vx;
Object.assign(b, { x: 480, y: PLATFORMS[0].y, vy: 0, g: true, i: 0 });
run(s, 1);
assert.ok(b.vx > nudged + 5, `pushed away from the storm, got ${b.vx}`);
assert.ok(b.ck > 0, 'and not again until a short while later');
assert.equal(a.vx, 0, 'its owner is safe');
run(s, 130);
assert.equal(s.storms.length, 0, 'gone after 4 s');

// Tether: zips to the nearest enemy from anywhere, lands beside them, and slows them for 1 s.
[s, a, b] = match(TETHER, SNIPER);
onMain(a, 300);
Object.assign(b, { x: 650, y: PLATFORMS[6].y, vx: 0, vy: 0, g: true, i: 0, j: 2 });
a.f = -1;
run(s, 1, skill(0));
assert.equal(s.zips.length, 1);
assert.equal(a.cd, SKILL_CD[TETHER]);
for (let i = 0; i < 30 && s.zips.length; i++) run(s, 1);
assert.equal(s.zips.length, 0);
assert.ok(Math.abs(a.x - b.x) <= 30 && Math.abs(a.y - b.y) < 2, `zipped to the enemy, ${a.x},${a.y} vs ${b.x},${b.y}`);
assert.equal(a.zp, 0);
assert.ok(b.tr > 0 && b.tr <= 30, `target slowed for 1 s, got ${b.tr}`);
assert.ok(a.f === Math.sign(b.x - a.x), 'facing them on arrival');
// Alone in a room, the press costs nothing.
[s, a] = match(TETHER);
onMain(a, 300);
run(s, 1, skill(0));
assert.equal(a.cd, 0);
assert.equal(a.zp, 0);
// A clone can fool it.
[s, a, b] = match(TETHER, ILLUSIONIST);
onMain(a, 300);
onMain(b, 680);
s.clones.push({ id: 992, o: 1, h: ILLUSIONIST, gun: 0, x: 400, y: PLATFORMS[0].y, vx: 0, vy: 0, g: true, f: 1, d: 0, w: 99, t: 90, sh: 99, aim: 0 });
run(s, 1, skill(0));
for (let i = 0; i < 30 && s.zips.length; i++) run(s, 1);
assert.ok(a.x < 500, 'went for the nearer clone');
assert.equal(s.clones.length, 0, 'and popped it');

// Shade: invisible for 6 s. Firing ends it, and that one shot hits like a sniper's.
[s, a, b] = match(SHADE, SNIPER);
onMain(a, 300);
onMain(b, 420);
a.f = 1;
run(s, 1, skill(0));
assert.equal(a.iv, VANISH_STEPS);
assert.equal(a.cd, SKILL_CD[SHADE]);
run(s, 10);
assert.ok(a.iv > 0 && a.iv < VANISH_STEPS);
a.c = 0;
run(s, 1, shooter(0));
assert.equal(a.iv, 0, 'firing shows her');
assert.equal(s.bullets[0].g, SNIPER_GUN);
assert.equal(s.bullets[0].k, GUNS[SNIPER_GUN].knock);
assert.equal(a.eb, 0);
a.c = 0;
run(s, 8);
s.bullets.length = 0;
run(s, 1, shooter(0));
assert.equal(s.bullets[0].g, PISTOL, 'only the first shot is enhanced');
// Invisible she can't be chased: not by a dog, not by a zip.
[s, a, b] = match(SHADE, HANDLER);
onMain(a, 400);
onMain(b, 300);
a.iv = 100;
s.dogs.push({ id: 993, o: 1, x: 350, y: PLATFORMS[0].y, vx: 0, vy: 0, g: true, f: 1, t: 100, hp: 5, c: 0 });
run(s, 5);
assert.equal(s.dogs[0].vx, 0, 'the dog has nobody to chase');
const hiddenAt = a.x;
const bullet = { id: 994, x: hiddenAt - 30, y: a.y - 18, vx: 18, vy: 0, o: 1, t: 5, k: 17, g: PISTOL };
s.bullets.push(bullet);
run(s, 2);
assert.ok(a.vx > 5, 'but a bullet still hits her');
assert.ok(a.iv > 0, 'and being hit does not show her');
// When the 6 s run out, the enhanced shot goes with them.
Object.assign(a, { iv: 1 });
movePlayer(a, 0);
assert.equal(a.iv, 0);
assert.equal(a.eb, 0);

// Jumps and landings are announced, for the dust and the double jump ring.
[s, a] = match(SNIPER);
onMain(a);
assert.ok(movePlayer(a, KEY.JUMP) & DID.JUMP);
movePlayer(a, 0);
assert.ok(movePlayer(a, KEY.JUMP) & DID.JUMP2);
let landed = 0;
for (let i = 0; i < 80 && !a.g; i++) landed |= movePlayer(a, 0);
assert.ok(landed & DID.LAND, 'a real fall lands with dust');
assert.equal(movePlayer(a, 0) & DID.LAND, 0, 'standing still does not');

// KOs: whoever hit you last, within 5 s, gets the credit. The results screen shows real numbers.
[s, a, b] = match(SNIPER, TRAPPER);
onMain(a, 400);
onMain(b, 450);
s.bullets.push({ id: 995, x: 420, y: b.y - 18, vx: 18, vy: 0, o: 0, t: 5, k: 17, g: PISTOL });
run(s, 1);
assert.equal(a.hits, 1);
assert.equal(b.lh, 0);
b.x = 2000;
run(s, 1);
assert.equal(a.kos, 1);
assert.equal(b.falls, 1);
assert.ok(s.fx.some((f) => f.k === 'ko' && f.by === 0));
assert.equal(b.lh, null, 'a respawn clears who hit you');
b.x = 2000;
run(s, 1);
assert.equal(a.kos, 1, 'a fall nobody caused gives nobody a KO');
assert.equal(b.falls, 2);
assert.ok(s.fx.some((f) => f.k === 'ko' && f.by === null));
b.lh = 0;
b.lt = 1;
run(s, 2);
b.x = 2000;
run(s, 1);
assert.equal(a.kos, 1, 'an old hit no longer counts');
startRound(s);
assert.equal(a.kos + a.hits + b.falls, 0, 'a new round starts clean');

// Maps: three of them, every platform reachable from the one below, with a spawn over a platform.
assert.equal(MAPS.length, 3);
for (const map of MAPS) {
  for (const x of map.spawn) assert.ok(map.platforms.some((pl) => x > pl.x && x < pl.x + pl.w), `${map.name}: spawn at ${x} has a floor`);
  const lowest = Math.max(...map.platforms.map((pl) => pl.y));
  for (const pl of map.platforms) {
    assert.ok(pl.y + 40 < 492, `${map.name} clears the hazard`);
    if (pl.y === lowest) continue;
    const near = map.platforms.some((o) => o.y > pl.y && o.y - pl.y <= 150 && o.x < pl.x + pl.w + 130 && o.x + o.w > pl.x - 130);
    assert.ok(near, `${map.name}: platform at ${pl.x},${pl.y} can't be reached`);
  }
}

function useMap0() {
  [s, a] = match(SNIPER);
}

// Holding Down never ends in the hazard, on any map.
for (let m = 0; m < MAPS.length; m++) {
  [s, a] = match(SNIPER);
  s.choice = m;
  startRound(s);
  assert.equal(s.map, m);
  for (const pl of MAPS[m].platforms) {
    for (const x of [pl.x + 5, pl.x + pl.w / 2, pl.x + pl.w - 5]) {
      // Already holding Down: only a fresh press may drop through a free platform.
      Object.assign(a, { x, y: pl.y, vx: 0, vy: 0, g: true, j: 2, i: 0, c: 0, b: KEY.DOWN });
      for (let i = 0; i < 90; i++) movePlayer(a, KEY.DOWN);
      assert.equal(a.g, true, `${MAPS[m].name}: fell from ${pl.x},${pl.y} at x ${x}`);
    }
  }
}

// A room defaults to a random map, each round. Only the host can choose, and it passes on when they leave.
s = newGame();
a = addPlayer(s, 0);
b = addPlayer(s, 1);
assert.equal(s.host, 0);
assert.equal(s.choice, null);
const seen = new Set();
for (let i = 0; i < 40; i++) {
  startRound(s);
  seen.add(s.map);
}
assert.equal(seen.size, MAPS.length, 'random covers every map');
s.pick = 100;
chooseMap(s, 1, 2);
assert.equal(s.choice, null, 'only the host');
chooseMap(s, 0, 2);
assert.equal(s.choice, 2);
assert.equal(s.map, 2);
for (const bad of [9, -1, 1.5, '1', {}]) {
  chooseMap(s, 0, bad);
  assert.equal(s.choice, 2, 'a bad map is ignored');
}
startRound(s);
assert.equal(s.map, 2);
chooseMap(s, 0, null);
assert.equal(s.choice, null, 'back to random');
removePlayer(s, 0);
assert.equal(s.host, 1);
removePlayer(s, 1);
assert.equal(s.host, null);
// Alone, changing the map restarts at once.
[s, a] = match(SNIPER);
chooseMap(s, 0, 1);
assert.equal(s.map, 1);
assert.equal(PLATFORMS, MAPS[1].platforms);
useMap0();

// Rooms sharing one process can't mix up their maps.
const roomA = newGame();
const roomB = newGame();
const pa = addPlayer(roomA, 0);
const pb = addPlayer(roomB, 0);
Object.assign(roomA, { choice: 1 });
Object.assign(roomB, { choice: 2 });
pa.hero = pb.hero = SNIPER;
startRound(roomA);
startRound(roomB);
for (let i = 0; i < 40; i++) {
  step(roomA, none);
  step(roomB, none);
}
assert.ok(MAPS[1].platforms.some((pl) => pl.y === pa.y), `room A landed on its own map, y ${pa.y}`);
assert.ok(MAPS[2].platforms.some((pl) => pl.y === pb.y), `room B landed on its own map, y ${pb.y}`);

// The snapshot carries the map and everything new.
const snap = snapshotOf(roomA);
assert.equal(snap.m, 1);
for (const key of ['sm', 'zs', 'cl', 'tp', 'hk', 'dg', 'wl', 'ch', 'h']) assert.ok(key in snap, key);

// Greenwood's second row lets a fresh Down drop through, even where nothing is below it.
[s, a] = match(SNIPER);
s.choice = 1;
startRound(s);
useMap(1);
const freeRow = MAPS[1].platforms.find((pl) => pl.free);
assert.equal(freeRow.y, 195);
Object.assign(a, { x: 480, y: 195, vx: 0, vy: 0, g: true, j: 2, i: 0, c: 0, b: 0 });
for (let i = 0; i < 3; i++) movePlayer(a, KEY.DOWN);
assert.ok(a.y > 195 && !a.g, `dropped, y ${a.y}`);
useMap(0);

// Ninja: swapping back gives 3 shurikens, harder than a pistol, softer than a sniper, easier to land.
[s, a, b] = match(NINJA, SNIPER);
onMain(a, 300);
press(a);
press(a);
assert.equal(a.gun, SHURIKEN);
assert.equal(a.ammo, 3);
assert.ok(GUNS[SHURIKEN].knock > GUNS[PISTOL].knock && GUNS[SHURIKEN].knock < GUNS[SNIPER_GUN].knock);
onMain(b, 500);
s.bullets.push({ id: 900, x: 480, y: b.y - 55, vx: 20, vy: 0, o: 0, t: 5, k: 28, g: SHURIKEN });
run(s, 1);
assert.ok(b.vx > 0, 'a shuriken over the head still connects');
onMain(b, 500);
s.bullets.push({ id: 901, x: 480, y: b.y - 55, vx: 20, vy: 0, o: 0, t: 5, k: 21, g: PISTOL });
run(s, 1);
assert.ok(b.vx <= 0, 'a pistol bullet at that height misses');

// Sniper: the scope timer starts with the rifle.
[s, a] = match(SNIPER);
press(a);
assert.ok(a.sc > SCOPE_STEPS - 3 && a.gun === SNIPER_GUN);

// Trapper's picture changes for a moment after the throw.
[s, a] = match(TRAPPER);
press(a);
assert.ok(a.sk > 0);

// Poacher: held still first, then slowed.
[s, a, b] = match(POACHER, SNIPER);
onMain(a, 300);
onMain(b, 440);
s.traps.push({ id: 992, x: 400, y: PLATFORMS[0].y, vx: 0, vy: 0, o: 0, t: 100, g: true });
run(s, 1);
assert.equal(b.jw, TRAP_HOLD);
assert.equal(b.tr, TRAP_STEPS);
onMain(b, 440);
b.jw = 10;
const heldAt = b.x;
for (let i = 0; i < 8; i++) movePlayer(b, KEY.RIGHT);
assert.equal(b.x, heldAt, "can't walk while held");

// Dusk: the ink landing gives its owner the speed boost, and the target stays blinded.
[s, a, b] = match(DUSK, SNIPER);
onMain(a, 300);
onMain(b, 380);
a.f = 1;
run(s, 1, skill(0));
for (let i = 0; i < 8 && !b.bl; i++) run(s, 1);
assert.ok(b.bl > 0, 'target blinded');
assert.ok(a.gh > GHOST_STEPS - 10, 'owner boosted');
[s, a] = match(SNIPER);
const baseRun = topSpeed(a);
[s, a] = match(DUSK);
a.gh = 100;
assert.ok(topSpeed(a) > baseRun * 1.5, 'a high boost');

// Shifter runs a little faster while small.
[s, a] = match(SHIFTER);
a.sm = 100;
const smallRun = topSpeed(a);
assert.ok(smallRun > baseRun && smallRun < baseRun * 1.4, `a small boost, ${smallRun}`);

// Rime: the whiteout slows very hard, on top of the throw.
[s, a, b] = match(RIME, SNIPER);
onMain(a, 300);
onMain(b, 380);
a.f = 1;
run(s, 1, skill(0));
for (let i = 0; i < 8 && !b.fz; i++) run(s, 1);
assert.ok(b.fz > FREEZE_STEPS - 10, 'frozen');
[s, a] = match(SNIPER);
a.fz = 100;
assert.ok(topSpeed(a) < baseRun * 0.25, 'very hard slow');

// Every melody must fill its chords exactly, or the music drifts out of step with itself on each loop.
const { SONGS } = await import('./site/audio.js');
for (const [name, tune] of Object.entries(SONGS)) assert.equal(tune.steps, tune.chords.length * 16, name);

console.log('game sim ok');
