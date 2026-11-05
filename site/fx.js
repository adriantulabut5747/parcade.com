// Things flying through the arena and every skill and hit animation. No game rules here.
import { ARC, DECOY_STEPS, DOG_HP, FALL_STEPS, FALL_W, FLAME, H, ITEMS, LASER, MINIGUN, NET_STEPS, RIFLE, ROCKET, SHOTGUN, SHURIKEN, SNIPER_GUN, VAC_RADIUS, VAC_STEPS, W, WALL_H, WALL_HP, WALL_STEPS, WALL_W } from './sim.js';
import { play } from './audio.js';
import { LAVA_Y } from './art.js';
import { CREAM, GOLD, INK, drawBike, drawHero, drawItemIcon, drawKnife, outlined, sprite, stamp, star } from './heroes.js';

const CALM = matchMedia('(prefers-reduced-motion: reduce)').matches;
// The title screen's fight plays behind a menu, so it doesn't shake the screen.
let noShake = false;
export const setNoShake = (on) => (noShake = on);
// What the map's ground throws up, and what a fall into its hazard splashes.
const MAP_LOOK = [
  { dust: '#b9b3a8', splash: [CREAM, GOLD, '#ff8c16', '#f04a0d'] },
  { dust: '#b9d48a', splash: ['#dcffb4', '#a6e86a', '#55b84a', '#1f7f3c'] },
  { dust: '#e8c98a', splash: [CREAM, '#ffe28f', '#e6ab3c', '#b97a1e'] },
  { dust: '#c9b4ff', splash: ['#f3e6ff', '#c79cff', '#8a4fe0', '#4a2296'] },
  { dust: '#c8b49a', splash: ['#eefaff', '#a8e0ec', '#4f9fb8', '#1f5f78'] },
  { dust: '#c9a26a', splash: [CREAM, '#e0a24a', '#9a5a1e', '#4a2410'] },
  { dust: '#9fc98a', splash: ['#d8f59a', '#7fc47a', '#2f7f5a', '#123f30'] },
];
let look = MAP_LOOK[0];
export const setFxMap = (map) => (look = MAP_LOOK[map]);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
let view = { l: 0, t: 0, w: W, h: H };
let maxParticles = 300;

export const setFxView = (v) => (view = v);
export const setFxQuality = (q) => (maxParticles = q === 'low' ? 110 : 300);
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

// ---------- Flying things ----------

const shurikenSprite = () =>
  sprite('shuriken', [-24, -24, 48, 48], (g) => {
    star(g, 0, 0, 23, INK);
    star(g, 0, 0, 19, '#e4e9f0');
    outlined(g, '#3b4058', () => g.arc(0, 0, 4, 0, Math.PI * 2), 2);
  });

export function drawBullet(g, b, x) {
  const dir = Math.sign(b.vx);
  if (b.g === SHURIKEN) {
    g.save();
    g.translate(x, b.y);
    g.rotate(x * 0.05);
    stamp(g, shurikenSprite());
    g.restore();
    return;
  }
  if (b.g === SNIPER_GUN) {
    const tail = g.createLinearGradient(x, 0, x - dir * 120, 0);
    tail.addColorStop(0, 'rgba(255,241,184,.95)');
    tail.addColorStop(1, 'rgba(255,160,50,0)');
    g.fillStyle = tail;
    g.fillRect(dir > 0 ? x - 120 : x, b.y - 2.5, 120, 5);
    g.fillStyle = '#fff';
    g.fillRect(x - 9, b.y - 2, 18, 4);
    return;
  }
  if (b.g === ROCKET) {
    bit(x - dir * 16, b.y + rand(-3, 3), -dir * rand(0.5, 2), rand(-1, 1), Math.random() < 0.5 ? '#ffb321' : '#6a6a70', rand(3, 6), 16, 0, 'smoke');
    outlined(g, '#c8ccd3', () => g.roundRect(x - 13, b.y - 5, 22, 10, 3), 2);
    outlined(g, '#d9412b', () => {
      g.moveTo(x + dir * 9, b.y - 5);
      g.lineTo(x + dir * 18, b.y);
      g.lineTo(x + dir * 9, b.y + 5);
      g.closePath();
    }, 2);
    return;
  }
  if (b.g === FLAME) {
    const age = 1 - b.t / 14;
    g.globalAlpha = 1 - age * 0.7;
    g.fillStyle = age < 0.35 ? CREAM : age < 0.7 ? '#ffb321' : '#f0500f';
    g.beginPath();
    g.arc(x, b.y + Math.sin(b.id) * age * 12, 5 + age * 11, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    return;
  }
  g.fillStyle = 'rgba(255,190,70,.45)';
  g.fillRect(dir > 0 ? x - 18 : x, b.y - 1.5, 18, 3);
  outlined(g, CREAM, () => g.roundRect(x - 5, b.y - 3, 10, 6, 3), 1.5);
}

function netShape(g, r, spin) {
  g.save();
  g.rotate(spin);
  const pass = (color, width) => {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    for (const part of [0.5, 1]) {
      for (let i = 0; i <= 8; i++) {
        const a = (i * Math.PI) / 4;
        const px = Math.cos(a) * r * part;
        const py = Math.sin(a) * r * part;
        if (i) g.lineTo(px, py);
        else g.moveTo(px, py);
      }
    }
    g.stroke();
  };
  pass(INK, 3.5);
  pass('#f3e1b0', 1.6);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 8;
    outlined(g, GOLD, () => g.arc(Math.cos(a) * r, Math.sin(a) * r, 3.2, 0, Math.PI * 2), 1.6);
  }
  g.restore();
}

// The net opens as it flies, spinning, on a rope back to the thrower's hand.
export function drawNet(g, n, x, y, from, t) {
  const open = clamp((28 - n.t) / 3, 0.35, 1);
  if (from) {
    const midX = (from.x + x) / 2;
    const midY = Math.max(from.y - 18, y) + 26;
    for (const [color, width] of [
      [INK, 3.5],
      ['#f3e1b0', 1.5],
    ]) {
      g.strokeStyle = color;
      g.lineWidth = width;
      g.beginPath();
      g.moveTo(from.x, from.y - 22);
      g.quadraticCurveTo(midX, midY, x, y);
      g.stroke();
    }
  }
  g.save();
  g.translate(x, y);
  g.scale(1, 0.82);
  netShape(g, 26 * open, t * 0.016);
  g.restore();
}

// Wrapped up: the net squeezes in fast, then a gold ring counts down the 1.5 s.
export function drawSnare(g, x, y, n, t) {
  const age = (NET_STEPS - n) / NET_STEPS;
  const squeeze = 1 + Math.max(0, 0.6 - age * 8);
  const cy = y - 28;
  g.save();
  g.translate(x, cy);
  g.beginPath();
  g.ellipse(0, 0, 27 * squeeze, 36 * squeeze, 0, 0, Math.PI * 2);
  g.fillStyle = 'rgba(243,225,176,.18)';
  g.fill();
  g.save();
  g.clip();
  for (const [color, width] of [
    [INK, 3],
    ['#f3e1b0', 1.5],
  ]) {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.beginPath();
    for (let i = -6; i <= 6; i++) {
      const s = i * 11 + Math.sin(t * 0.03) * 1.5;
      g.moveTo(-40, s - 40);
      g.lineTo(40, s + 40);
      g.moveTo(-40, s + 40);
      g.lineTo(40, s - 40);
    }
    g.stroke();
  }
  g.restore();
  g.beginPath();
  g.ellipse(0, 0, 27 * squeeze, 36 * squeeze, 0, 0, Math.PI * 2);
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.stroke();
  g.strokeStyle = '#f3e1b0';
  g.lineWidth = 1.5;
  g.stroke();
  for (const [wx, wy] of [
    [-20 * squeeze, 24 * squeeze],
    [20 * squeeze, 24 * squeeze],
  ]) {
    outlined(g, GOLD, () => g.arc(wx, wy, 4, 0, Math.PI * 2), 2);
  }
  g.restore();
  g.lineCap = 'round';
  g.strokeStyle = INK;
  g.lineWidth = 6;
  g.beginPath();
  g.arc(x, y - 84, 8, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * n) / NET_STEPS);
  g.stroke();
  g.strokeStyle = GOLD;
  g.lineWidth = 3;
  g.stroke();
  g.lineCap = 'butt';
}

// The ninja's decoy: a log wearing the ninja's headband, with a ring showing the 7 s left to swap back.
export function drawDecoy(g, o, t) {
  const left = o.st / DECOY_STEPS;
  const urgent = left < 0.3;
  const { x, y } = o;
  outlined(g, '#8a5a2b', () => g.roundRect(x - 11, y - 38, 22, 38, 8));
  g.fillStyle = '#6d431d';
  g.fillRect(x - 6, y - 30, 2, 22);
  g.fillRect(x + 3, y - 24, 2, 20);
  outlined(g, '#c79a5e', () => g.ellipse(x, y - 38, 11, 4.5, 0, 0, Math.PI * 2), 2);
  g.strokeStyle = '#8a5a2b';
  g.lineWidth = 1.2;
  g.beginPath();
  g.ellipse(x, y - 38, 5, 2, 0, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = o.color;
  g.fillRect(x - 11, y - 28, 22, 4);
  const wave = Math.sin(t * 0.008) * 2;
  g.fillRect(x - 18, y - 27 + wave, 8, 3);
  g.strokeStyle = INK;
  g.lineWidth = 6;
  g.beginPath();
  g.arc(x, y - 22, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
  g.stroke();
  g.strokeStyle = urgent ? '#ff6a6a' : CREAM;
  g.lineWidth = 3;
  g.stroke();
  if (Math.random() < 0.18) smoke(x + rand(-12, 12), y - rand(0, 12), 1, 0.4);
}

const giftSprite = (lit) =>
  sprite(`gift${lit ? 1 : 0}`, [-13, -18, 26, 30], (g) => {
    outlined(g, lit ? '#ff6a4d' : '#d8301f', () => g.roundRect(-9, -8, 18, 17, 3), 2.5);
    g.fillStyle = GOLD;
    g.fillRect(-2, -8, 4, 17);
    g.fillRect(-9, -2, 18, 4);
    outlined(g, GOLD, () => g.ellipse(-5, -11, 5, 3, 0.4, 0, Math.PI * 2), 2);
    outlined(g, GOLD, () => g.ellipse(5, -11, 5, 3, -0.4, 0, Math.PI * 2), 2);
  });

// A wrapped present, tumbling in the air and flashing faster as the fuse runs out.
export function drawGift(g, n, x, y, t) {
  const hot = n.t < 15;
  g.save();
  g.translate(x, y - 9);
  g.rotate(Math.sin(t * 0.012) * 0.25);
  stamp(g, giftSprite(Math.floor(t / (hot ? 60 : 200)) % 2));
  g.restore();
}

const jawsSprite = (shut, size = 1) =>
  sprite(`jaws${shut ? 1 : 0}|${size}`, [-18 * size, -16 * size, 36 * size, 19 * size], (g) => {
    g.scale(size, size);
    g.strokeStyle = INK;
    g.lineWidth = 2;
    for (const dir of [-1, 1]) {
      const reach = shut ? 2 : 13;
      outlined(g, '#9aa3ae', () => {
        g.moveTo(0, 0);
        g.lineTo(dir * reach, shut ? -11 : -8);
        for (let i = 0; i < 3; i++) {
          g.lineTo(dir * (reach - i * 3 - 1.5), shut ? -7 : -3 - i);
          g.lineTo(dir * (reach - i * 3 - 3), shut ? -11 : -7 - i);
        }
        g.closePath();
      }, 1.8);
    }
    outlined(g, '#5e6573', () => g.roundRect(-15, -2, 30, 4, 2), 2);
    outlined(g, '#c99a3a', () => g.arc(0, 0, 3, 0, Math.PI * 2), 1.5);
  });

// Its owner sees it clearly. Everyone else has to look for it, and it blinks for the last 3 seconds.
export function drawTrap(g, n, x, y, mine, t) {
  if (n.t < 90 && Math.floor(t / 150) % 2) return;
  if (n.g && !mine) g.globalAlpha = 0.6;
  stamp(g, jawsSprite(false, 2.5), x, y);
  g.globalAlpha = 1;
  // Its owner also sees how far it reaches.
  if (n.g && mine) {
    g.strokeStyle = 'rgba(255,211,92,.65)';
    g.lineWidth = 2;
    g.setLineDash([6, 6]);
    g.beginPath();
    g.ellipse(x, y - 2, 67, 8, 0, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
  }
}

const stormSprite = (layer) =>
  sprite(`storm${layer}`, [-92, -92, 184, 184], (g) => {
    if (layer === 0) {
      const soft = g.createRadialGradient(0, 0, 10, 0, 0, 90);
      soft.addColorStop(0, 'rgba(226,246,255,.62)');
      soft.addColorStop(0.7, 'rgba(190,232,250,.34)');
      soft.addColorStop(1, 'rgba(190,232,250,0)');
      g.fillStyle = soft;
      g.beginPath();
      g.arc(0, 0, 90, 0, Math.PI * 2);
      g.fill();
      return;
    }
    // Curved blades of snow, then ice shards among them.
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 + layer;
      const reach = layer === 1 ? 66 : 42;
      g.strokeStyle = layer === 1 ? 'rgba(255,255,255,.8)' : 'rgba(159,228,242,.9)';
      g.lineWidth = 4;
      g.lineCap = 'round';
      g.beginPath();
      g.arc(0, 0, reach, a, a + 0.9);
      g.stroke();
      const sx = Math.cos(a + 0.9) * reach;
      const sy = Math.sin(a + 0.9) * reach;
      outlined(g, '#e6f8ff', () => {
        g.moveTo(sx, sy - 6);
        g.lineTo(sx + 4, sy);
        g.lineTo(sx, sy + 6);
        g.lineTo(sx - 4, sy);
        g.closePath();
      }, 1.5);
    }
  });

// Rime's blizzard, stamped in three turning layers.
export function drawStorm(g, w, x, y, t) {
  const fade = Math.min(1, w.t / 15);
  g.save();
  g.translate(x, y);
  g.globalAlpha = fade;
  stamp(g, stormSprite(0));
  g.rotate(t * 0.005);
  stamp(g, stormSprite(1));
  g.rotate(-t * 0.012);
  stamp(g, stormSprite(2));
  g.restore();
  g.globalAlpha = 1;
  if (Math.random() < 0.6) bit(x + rand(-70, 70), y + rand(-60, 60), w.vx * 0.5 + rand(-1, 1), rand(0.5, 2.2), '#ffffff', rand(2, 4), 20);
}

// Tether's web, drawn tight from hand to target, with sticky fibres branching off along it.
export function drawZip(g, from, to) {
  const x0 = from.x;
  const y0 = from.y - 24;
  const dx = to.x - x0;
  const dy = to.y - 24 - y0;
  const long = Math.hypot(dx, dy) || 1;
  const nx = -dy / long;
  const ny = dx / long;
  const knots = Math.max(2, Math.floor(long / 18));
  for (const [color, width, thin] of [
    [INK, 4, 3],
    ['#f6f3ea', 2, 1.2],
  ]) {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(to.x, to.y - 24);
    g.stroke();
    // A second strand weaves back and forth across the first, which reads as web rather than wire.
    g.lineWidth = thin;
    g.beginPath();
    g.moveTo(x0, y0);
    for (let i = 1; i < knots; i++) {
      const side = i % 2 ? 5 : -5;
      g.lineTo(x0 + (dx * i) / knots + nx * side, y0 + (dy * i) / knots + ny * side);
    }
    g.lineTo(to.x, to.y - 24);
    g.stroke();
  }
}

// Frost on the feet of anyone caught by Rime's whiteout.
const frostSprite = () =>
  sprite('frost', [-22, -14, 44, 20], (g) => {
    outlined(g, '#bdeefa', () => {
      g.moveTo(-18, 3);
      g.lineTo(-13, -7);
      g.lineTo(-7, -2);
      g.lineTo(-1, -11);
      g.lineTo(6, -2);
      g.lineTo(12, -8);
      g.lineTo(18, 3);
      g.closePath();
    }, 2);
  });
export const drawFrost = (g, x, y) => stamp(g, frostSprite(), x, y);

const puffSprite = (purple) =>
  sprite(purple ? 'puffp' : 'puff', [-34, -34, 68, 68], (g) => {
    const soft = g.createRadialGradient(0, 0, 4, 0, 0, 32);
    soft.addColorStop(0, purple ? 'rgba(150,92,214,.95)' : 'rgba(150,158,170,.95)');
    soft.addColorStop(0.65, purple ? 'rgba(96,52,150,.8)' : 'rgba(112,120,132,.8)');
    soft.addColorStop(1, purple ? 'rgba(96,52,150,0)' : 'rgba(112,120,132,0)');
    g.fillStyle = soft;
    g.beginPath();
    g.arc(0, 0, 32, 0, Math.PI * 2);
    g.fill();
  });

// Shade's and the Illusionist's smoke hangs where they were for 3 s. Only a few stamped puffs, so it's cheap to draw.
function smokeCloud(x, y, purple = false) {
  const puffs = Array.from({ length: 7 }, (_, i) => ({ a: (i * Math.PI * 2) / 7, r: i % 2 ? 26 : 40, s: rand(0.0008, 0.0016) * (i % 2 ? 1 : -1) }));
  effect(3000, (g, p) => {
    const age = p * 3000;
    g.globalAlpha = Math.min(1, age / 120, (1 - p) / 0.3);
    for (const q of puffs) stamp(g, puffSprite(purple), x + Math.cos(q.a + age * q.s) * q.r, y + Math.sin(q.a + age * q.s) * q.r * 0.75 - p * 16);
    g.globalAlpha = 1;
  });
}

// Puffs off the ground when you take off or land.
function dust(x, y, count, reach) {
  const n = maxParticles < 300 ? Math.ceil(count / 2) : count;
  for (let i = 0; i < n; i++) {
    const dir = i % 2 ? 1 : -1;
    bit(x + dir * rand(2, 12), y - rand(0, 4), dir * rand(0.6, reach), -rand(0.1, 0.8), look.dust, rand(3, 7), rand(12, 22), -0.01, 'smoke');
  }
}

// Double jump: a flat ring kicks off the air under your feet, so it reads as a second jump.
function jumpRing(x, y) {
  for (const [delay, color] of [
    [0, CREAM],
    [70, GOLD],
  ]) {
    setTimeout(() => {
      effect(260, (g, p) => {
        const w = 10 + p * 34;
        g.globalAlpha = 1 - p;
        for (const [stroke, width] of [
          [INK, 5],
          [color, 2.5],
        ]) {
          g.strokeStyle = stroke;
          g.lineWidth = width * (1 - p * 0.6);
          g.beginPath();
          g.ellipse(x, y + p * 8, w, w * 0.3, 0, 0, Math.PI * 2);
          g.stroke();
        }
        g.globalAlpha = 1;
      });
    }, delay);
  }
  burst(x, y, 8, 3, [CREAM, GOLD], 2.4, 12, 0.08);
}

// Slowed: the trap stays clamped on the feet.
export const drawClamp = (g, x, y) => stamp(g, jawsSprite(true), x, y);

// Stunned by a hook: stars circling the head.
export function drawStun(g, x, y, t) {
  for (let i = 0; i < 3; i++) {
    const a = t * 0.012 + (i * Math.PI * 2) / 3;
    star(g, x + Math.cos(a) * 16, y - 66 + Math.sin(a) * 5, 5, CREAM);
  }
}

// A line from the thrower's hand to a barbed hook.
export function drawHook(g, k, x, y, from) {
  if (from) {
    for (const [color, width] of [
      [INK, 3.5],
      ['#dfe6ee', 1.5],
    ]) {
      g.strokeStyle = color;
      g.lineWidth = width;
      g.beginPath();
      g.moveTo(from.x + k.f * 10, from.y - 24);
      g.lineTo(x, y);
      g.stroke();
    }
  }
  g.save();
  g.translate(x, y);
  g.scale(k.f, 1);
  g.lineCap = 'round';
  for (const [color, width] of [
    [INK, 6.5],
    ['#c9d4e2', 3],
  ]) {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.beginPath();
    g.arc(3, 4, 7, -Math.PI * 0.55, Math.PI * 0.75);
    g.moveTo(-2, 8);
    g.lineTo(-5, 3);
    g.stroke();
  }
  g.lineCap = 'butt';
  g.restore();
}

// Dark brown with a white chest, muzzle and paws, and a red collar. Frames: 0 and 1 run, 2 stands, 3 leaps.
const dogSprite = (frame) =>
  sprite(`dog${frame}`, [-30, -38, 60, 44], (g) => {
    const brown = '#4a2a15';
    const white = '#f6efe2';
    const legSets = [
      [-13, 7, -5, 12],
      [-9, 3, -13, 7],
      [-13, -8, 3, 8],
      [-17, -11, 8, 13],
    ][frame];
    for (const [i, x] of legSets.entries()) outlined(g, i % 2 ? white : brown, () => g.roundRect(x, frame === 3 ? -13 : -11, 6, frame === 3 ? 8 : 11, 2), 2);
    outlined(g, brown, () => {
      g.moveTo(-17, -21);
      g.quadraticCurveTo(-27, -31, -24, -36);
      g.quadraticCurveTo(-20, -29, -13, -24);
      g.closePath();
    }, 2);
    outlined(g, brown, () => g.roundRect(-18, -24, 34, 14, 7));
    g.fillStyle = white;
    g.beginPath();
    g.ellipse(9, -13.5, 6, 3, 0, 0, Math.PI * 2);
    g.fill();
    outlined(g, brown, () => g.arc(16, -28, 9, 0, Math.PI * 2));
    outlined(g, white, () => g.roundRect(18, -28, 11, 8, 4), 2);
    g.fillStyle = INK;
    g.beginPath();
    g.arc(27.5, -27, 2, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(17.5, -30.5, 1.6, 2.5, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(18, -31.5, 0.7, 0, Math.PI * 2);
    g.fill();
    outlined(g, '#2e1a0c', () => g.ellipse(10, -32, 4, 7, 0.5, 0, Math.PI * 2), 2);
    outlined(g, '#d8261c', () => g.roundRect(6, -22, 12, 4, 2), 1.8);
    outlined(g, GOLD, () => g.arc(13, -17, 2, 0, Math.PI * 2), 1.2);
  });

export function drawDog(g, d, x, y, t) {
  if (d.t < 45 && Math.floor(t / 110) % 2) g.globalAlpha = 0.5;
  const frame = !d.g ? 3 : Math.abs(d.vx) > 1 ? Math.floor(t / 90) % 2 : 2;
  g.save();
  g.translate(x, y);
  g.scale(d.f, 1);
  stamp(g, dogSprite(frame));
  g.restore();
  g.globalAlpha = 1;
  // One pip per shot it can still take.
  const left = Math.ceil(d.hp);
  if (left < DOG_HP) {
    g.fillStyle = INK;
    g.fillRect(x - 21, y - 47, 42, 7);
    g.fillStyle = '#ff5a4d';
    for (let i = 0; i < left; i++) g.fillRect(x - 19 + i * 8, y - 45, 6, 3);
  }
}

// Earth and stone, topped with moss. Cracks open as it takes shots.
const wallSprite = (stage) =>
  sprite(`wall${stage}`, [-WALL_W / 2 - 6, -WALL_H - 10, WALL_W + 12, WALL_H + 14], (g) => {
    const half = WALL_W / 2;
    outlined(g, '#6b4a2b', () => g.roundRect(-half, -WALL_H, WALL_W, WALL_H, 5));
    for (const [x, y, w, h, c] of [
      [-half + 3, -WALL_H + 12, 14, 12, '#856039'],
      [-1, -WALL_H + 30, 13, 11, '#7a5734'],
      [-half + 4, -WALL_H + 44, 12, 12, '#8f6a41'],
      [1, -WALL_H + 56, 11, 13, '#775433'],
    ]) outlined(g, c, () => g.roundRect(x, y, w, h, 3), 1.6);
    outlined(g, '#4f8a3a', () => {
      g.moveTo(-half - 3, -WALL_H + 9);
      g.quadraticCurveTo(-half - 1, -WALL_H - 5, 0, -WALL_H - 5);
      g.quadraticCurveTo(half + 1, -WALL_H - 5, half + 3, -WALL_H + 9);
      g.lineTo(half - 3, -WALL_H + 5);
      g.lineTo(half - 8, -WALL_H + 12);
      g.lineTo(0, -WALL_H + 6);
      g.lineTo(-half + 8, -WALL_H + 13);
      g.lineTo(-half + 3, -WALL_H + 6);
      g.closePath();
    }, 2);
    g.strokeStyle = INK;
    g.lineWidth = 2.2;
    g.beginPath();
    if (stage > 0) {
      g.moveTo(-half + 2, -44);
      g.lineTo(-3, -36);
      g.lineTo(2, -28);
      g.lineTo(-4, -17);
    }
    if (stage > 1) {
      g.moveTo(half - 2, -60);
      g.lineTo(4, -49);
      g.lineTo(9, -40);
      g.lineTo(2, -28);
      g.moveTo(-half + 3, -22);
      g.lineTo(-5, -11);
    }
    g.stroke();
  });

export function drawWall(g, w, x, y, t) {
  const rise = Math.min(1, (WALL_STEPS - w.t + 1) / 4);
  if (w.t < 45 && Math.floor(t / 120) % 2) g.globalAlpha = 0.55;
  g.save();
  g.translate(x, y);
  g.scale(1, rise);
  stamp(g, wallSprite(w.hp > WALL_HP * 0.66 ? 0 : w.hp > WALL_HP * 0.33 ? 1 : 2));
  g.restore();
  g.globalAlpha = 1;
}

// A tall wave of ink rolling sideways, with a pale crest on its leading edge.
export function drawWave(g, w, x, t) {
  const dir = Math.sign(w.vx);
  const top = w.y - 110;
  const bottom = w.y + 110;
  const fade = Math.min(1, w.t / 10);
  g.save();
  g.globalAlpha = 0.9 * fade;
  const body = g.createLinearGradient(x, 0, x - dir * 84, 0);
  body.addColorStop(0, '#0c0f2c');
  body.addColorStop(0.55, 'rgba(24,18,70,.85)');
  body.addColorStop(1, 'rgba(24,18,70,0)');
  g.fillStyle = body;
  g.beginPath();
  g.moveTo(x - dir * 84, top - 14);
  for (let y = top; y <= bottom; y += 14) {
    const curl = Math.sin(y * 0.05 + t * 0.012) * 9 + Math.sin(y * 0.13 - t * 0.02) * 5;
    g.lineTo(x + dir * curl, y);
  }
  g.lineTo(x - dir * 84, bottom + 14);
  g.closePath();
  g.fill();
  g.strokeStyle = '#7fe0ff';
  g.lineWidth = 2.5;
  g.beginPath();
  for (let y = top; y <= bottom; y += 14) {
    const curl = Math.sin(y * 0.05 + t * 0.012) * 9 + Math.sin(y * 0.13 - t * 0.02) * 5;
    g.lineTo(x + dir * curl, y);
  }
  g.stroke();
  g.restore();
  if (Math.random() < 0.6) bit(x, rand(top, bottom), -dir * rand(1, 3), rand(-1, 1), '#7fe0ff', 2.4, 16);
}

function chuteSprite(rare) {
  return sprite(`chute${rare ? 1 : 0}`, [-40, -100, 80, 74], (g) => {
    g.strokeStyle = INK;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(-17, -28);
    g.lineTo(-24, -58);
    g.moveTo(17, -28);
    g.lineTo(24, -58);
    g.moveTo(0, -28);
    g.lineTo(0, -74);
    g.stroke();
    outlined(g, rare ? GOLD : '#e8e2d4', () => {
      g.moveTo(-34, -56);
      g.quadraticCurveTo(0, -96, 34, -56);
      g.quadraticCurveTo(17, -66, 0, -56);
      g.quadraticCurveTo(-17, -66, -34, -56);
      g.closePath();
    });
    g.fillStyle = rare ? '#d4882a' : '#d9412b';
    g.beginPath();
    g.moveTo(-11, -60);
    g.quadraticCurveTo(0, -89, 11, -60);
    g.quadraticCurveTo(0, -64, -11, -60);
    g.fill();
  });
}

function crateSprite(i) {
  const rare = ITEMS[i].rare;
  return sprite(`crate${i}`, [-20, -34, 40, 38], (g) => {
    outlined(g, rare ? '#e0a52e' : '#a06a33', () => g.roundRect(-16, -30, 32, 30, 5));
    g.strokeStyle = rare ? '#8a5a12' : '#6d431d';
    g.lineWidth = 2;
    g.strokeRect(-13, -27, 26, 24);
    // Guns are dark, so their crates get a light panel to be readable from far away.
    g.fillStyle = ITEMS[i].gun !== undefined ? '#f0e4c6' : 'rgba(10,6,20,.72)';
    g.beginPath();
    g.roundRect(-13, -27, 26, 24, 3);
    g.fill();
    g.translate(0, -15);
    drawItemIcon(g, i);
  });
}

// A crate on a parachute. Rare ones are gold, so everyone sees what's worth racing for.
export function drawCrate(g, c, t) {
  const rare = ITEMS[c.i].rare;
  const x = c.x + (c.g ? 0 : Math.sin(t * 0.0025 + c.id) * 8);
  // Blinking before it disappears, as fair warning.
  if (c.g && c.t < 60 && Math.floor(t / 120) % 2) g.globalAlpha = 0.45;
  if (!c.g) stamp(g, chuteSprite(rare), x, c.y);
  if (rare) {
    g.globalAlpha = Math.min(g.globalAlpha, 0.25 + Math.sin(t * 0.006) * 0.12);
    g.fillStyle = GOLD;
    g.beginPath();
    g.arc(x, c.y - 14, 28, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
  }
  stamp(g, crateSprite(c.i), x, c.y);
  g.globalAlpha = 1;
}

export function drawRock(g, r) {
  for (let i = 1; i < 5; i++) {
    g.fillStyle = `rgba(255,${200 - i * 30},60,${0.6 - i * 0.12})`;
    g.beginPath();
    g.arc(r.x - r.vx * i * 1.4, r.y - r.vy * i * 1.1, 10 - i * 1.5, 0, Math.PI * 2);
    g.fill();
  }
  outlined(g, '#6a4f3b', () => g.arc(r.x, r.y, 10, 0, Math.PI * 2));
  g.fillStyle = '#ff9a2e';
  g.fillRect(r.x - 3, r.y - 2, 3, 3);
  g.fillRect(r.x + 3, r.y + 2, 2, 2);
}

// ---------- Seedea's waterfall ----------

const FALL_TILE = 120;

// One seamless stretch of rising water, scrolled and repeated up the screen.
const fallSprite = () =>
  sprite('falltile', [-FALL_W / 2 - 6, 0, FALL_W + 12, FALL_TILE], (g) => {
    const half = FALL_W / 2;
    const body = g.createLinearGradient(-half, 0, half, 0);
    body.addColorStop(0, 'rgba(18,108,176,.86)');
    body.addColorStop(0.22, 'rgba(62,194,232,.8)');
    body.addColorStop(0.5, 'rgba(176,244,252,.7)');
    body.addColorStop(0.78, 'rgba(62,194,232,.8)');
    body.addColorStop(1, 'rgba(18,108,176,.86)');
    g.fillStyle = body;
    g.fillRect(-half, 0, FALL_W, FALL_TILE);
    // Long streaks that meet themselves top to bottom, so the repeat never shows.
    g.lineCap = 'round';
    for (const [x, y, len, w, a] of [[-18, 8, 46, 3, 0.75], [-7, 58, 38, 2, 0.9], [4, 16, 52, 3.4, 0.85], [15, 66, 42, 2.4, 0.7], [-13, 84, 24, 1.6, 0.6], [9, 86, 26, 1.6, 0.7], [20, 12, 26, 1.6, 0.5]]) {
      g.strokeStyle = `rgba(244,254,255,${a})`;
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y + len);
      g.stroke();
    }
    g.lineCap = 'butt';
    // The dark edge every solid thing in the game has.
    g.fillStyle = INK;
    g.fillRect(-half - 2, 0, 2.5, FALL_TILE);
    g.fillRect(half - 0.5, 0, 2.5, FALL_TILE);
    g.fillStyle = '#d8fbff';
    g.fillRect(-half + 0.5, 0, 1.5, FALL_TILE);
    g.fillRect(half - 2, 0, 1.5, FALL_TILE);
  });

const bubbleSprite = () =>
  sprite('bubble', [-9, -9, 18, 18], (g) => {
    g.fillStyle = 'rgba(210,248,255,.28)';
    g.beginPath();
    g.arc(0, 0, 7, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#effdff';
    g.lineWidth = 1.5;
    g.stroke();
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(-2.4, -2.6, 1.6, 0, Math.PI * 2);
    g.fill();
  });

// Water climbing from the hazard to the top of the screen, with bubbles racing up it.
export function drawFall(g, f, top, t) {
  const age = FALL_STEPS - f.t;
  const bottom = LAVA_Y + 6;
  const grow = Math.min(1, (age + 1) / 8);
  const shrink = Math.min(1, f.t / 8);
  const high = bottom - (bottom - top) * grow;
  g.save();
  g.beginPath();
  g.rect(f.x - FALL_W / 2 - 4, high, FALL_W + 8, bottom - high);
  g.clip();
  g.globalAlpha = shrink;
  const tile = fallSprite();
  const scroll = (t * 0.32) % FALL_TILE;
  for (let y = bottom - scroll + FALL_TILE; y > high - FALL_TILE; y -= FALL_TILE) stamp(g, tile, f.x, y - FALL_TILE);
  const bubble = bubbleSprite();
  for (let i = 0; i < 12; i++) {
    const rise = (t * (0.3 + (i % 4) * 0.04) + i * 67) % (bottom - top);
    stamp(g, bubble, f.x + Math.sin(t * 0.004 + i * 2.1) * 15, bottom - rise);
  }
  g.restore();
  // Foam where it leaves the surface.
  g.globalAlpha = shrink;
  for (let i = 0; i < 4; i++) {
    const wob = Math.sin(t * 0.009 + i * 1.7) * 3;
    outlined(g, i % 2 ? '#d8fbff' : '#8fe6f4', () => g.ellipse(f.x - 24 + i * 16, bottom - 6 + wob, 12, 6, 0, 0, Math.PI * 2), 1.8);
  }
  g.globalAlpha = 1;
}

// Whoever the water is carrying rides up inside a big bubble.
export function drawRideBubble(g, x, y, t) {
  const r = 32 + Math.sin(t * 0.012) * 1.5;
  g.fillStyle = 'rgba(190,244,255,.2)';
  g.beginPath();
  g.ellipse(x, y - 25, r, r + 3, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 4;
  g.stroke();
  g.strokeStyle = '#d8fbff';
  g.lineWidth = 2;
  g.stroke();
  g.strokeStyle = '#fff';
  g.lineWidth = 2.5;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(x, y - 25, r - 6, Math.PI * 1.1, Math.PI * 1.45);
  g.stroke();
  g.lineCap = 'butt';
}

// ---------- Cassio's thrown bike ----------

const bikeSprite = () => sprite('bike', [-52, -52, 104, 62], (g) => drawBike(g, 90, true));

// Flung sideways, tumbling end over end, with sparks off the back.
export function drawThrownBike(g, n, x, y, t) {
  const dir = Math.sign(n.vx);
  g.save();
  g.translate(x, y);
  g.scale(dir, 1);
  g.rotate(t * 0.018);
  g.translate(0, 20);
  stamp(g, bikeSprite());
  g.restore();
  if (Math.random() < 0.7) bit(x - dir * 34, y + rand(-14, 14), -dir * rand(1, 4), rand(-2, 2), Math.random() < 0.5 ? GOLD : '#ff7a33', rand(2, 4), 14, 0.15);
}

// ---------- Dextar's knife and his mark ----------

const flyingKnifeSprite = () => sprite('flyingknife', [-62, -22, 124, 44], (g) => drawKnife(g, 2));

export function drawFlyingKnife(g, n, x, y) {
  const dir = Math.sign(n.vx);
  // A pale slash behind it, so it can be seen coming from across the map.
  g.fillStyle = 'rgba(255,90,110,.32)';
  g.fillRect(dir > 0 ? x - 110 : x + 30, y - 2.5, 80, 5);
  g.fillStyle = 'rgba(255,240,240,.75)';
  g.fillRect(dir > 0 ? x - 60 : x + 30, y - 1, 30, 2);
  g.save();
  g.translate(x, y);
  g.scale(dir, 1);
  stamp(g, flyingKnifeSprite());
  g.restore();
}

const markSprite = () =>
  sprite('mark', [-22, -22, 44, 44], (g) => {
    g.strokeStyle = INK;
    g.lineWidth = 5;
    g.beginPath();
    g.arc(0, 0, 15, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = '#ff3a50';
    g.lineWidth = 2.4;
    g.stroke();
    for (let i = 0; i < 4; i++) {
      g.save();
      g.rotate((i * Math.PI) / 2);
      outlined(g, '#fff1f1', () => {
        g.moveTo(-3.4, -21);
        g.lineTo(3.4, -21);
        g.lineTo(0, -9);
        g.closePath();
      }, 1.6);
      g.restore();
    }
  });

// A turning sigil over whoever Dextar has marked. Everyone can see it.
export function drawMark(g, x, y, t, left) {
  if (left < 30 && Math.floor(t / 110) % 2) return;
  g.save();
  g.translate(x, y - 84);
  g.rotate(t * 0.004);
  stamp(g, markSprite());
  g.restore();
}

// ---------- VI's grenade and vortex ----------

const grenadeSprite = () =>
  sprite('vigrenade', [-14, -14, 28, 28], (g) => {
    outlined(g, '#2a1248', () => g.arc(0, 0, 9, 0, Math.PI * 2), 2.5);
    g.strokeStyle = '#c79cff';
    g.lineWidth = 1.6;
    g.beginPath();
    g.ellipse(0, 0, 9, 3.4, 0.5, 0, Math.PI * 2);
    g.stroke();
    outlined(g, '#f3e6ff', () => g.arc(0, 0, 3.4, 0, Math.PI * 2), 1.4);
    outlined(g, GOLD, () => g.roundRect(-3, -12, 6, 4, 1.4), 1.4);
  });

const vortexSprite = (layer) =>
  sprite(`vortex${layer}`, [-VAC_RADIUS, -VAC_RADIUS, VAC_RADIUS * 2, VAC_RADIUS * 2], (g) => {
    if (layer === 0) {
      const soft = g.createRadialGradient(0, 0, 0, 0, 0, VAC_RADIUS);
      soft.addColorStop(0, 'rgba(18,4,40,.86)');
      soft.addColorStop(0.2, 'rgba(92,40,180,.5)');
      soft.addColorStop(0.72, 'rgba(120,60,220,.16)');
      soft.addColorStop(1, 'rgba(120,60,220,0)');
      g.fillStyle = soft;
      g.beginPath();
      g.arc(0, 0, VAC_RADIUS, 0, Math.PI * 2);
      g.fill();
      return;
    }
    // Arms of a spiral, thin at the rim and bright at the heart.
    g.lineCap = 'round';
    for (let arm = 0; arm < 5; arm++) {
      const start = (arm * Math.PI * 2) / 5;
      for (let i = 0; i < 26; i++) {
        const a = i / 26;
        const r0 = VAC_RADIUS * (1 - a);
        const r1 = VAC_RADIUS * (1 - (i + 1) / 26);
        const turn0 = start + a * 3.4;
        const turn1 = start + ((i + 1) / 26) * 3.4;
        g.strokeStyle = `rgba(${a > 0.6 ? '243,230,255' : '199,156,255'},${0.2 + a * 0.75})`;
        g.lineWidth = 1 + a * 3.6;
        g.beginPath();
        g.moveTo(Math.cos(turn0) * r0, Math.sin(turn0) * r0);
        g.lineTo(Math.cos(turn1) * r1, Math.sin(turn1) * r1);
        g.stroke();
      }
    }
    g.lineCap = 'butt';
  });

export function drawVac(g, v, x, y, t) {
  if (!v.open) {
    g.save();
    g.translate(x, y);
    g.rotate(t * 0.02);
    stamp(g, grenadeSprite());
    g.restore();
    return;
  }
  const age = 1 - v.t / VAC_STEPS;
  // It snaps open at once and collapses only at the very end, so its reach is honest the whole time.
  const size = Math.min(1, age * 7) * Math.min(1, (v.t + 2) / 5);
  g.save();
  g.translate(x, y);
  g.globalAlpha = Math.min(1, size * 1.2);
  g.scale(size, size);
  stamp(g, vortexSprite(0));
  g.rotate(t * 0.009);
  stamp(g, vortexSprite(1));
  g.restore();
  g.globalAlpha = 1;
  // The rim of the reach, then a hard bright core.
  g.strokeStyle = INK;
  g.lineWidth = 4;
  g.beginPath();
  g.arc(x, y, VAC_RADIUS * size, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = '#c79cff';
  g.lineWidth = 2;
  g.stroke();
  outlined(g, '#12042a', () => g.arc(x, y, 12 * size + 2, 0, Math.PI * 2), 2.5);
  g.strokeStyle = '#f3e6ff';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(x, y, 7 * size, 0, Math.PI * 2);
  g.stroke();
  // Grit dragged in from the edge.
  if (Math.random() < 0.8) {
    const a = rand(0, Math.PI * 2);
    const r = VAC_RADIUS * rand(0.7, 1);
    bit(x + Math.cos(a) * r, y + Math.sin(a) * r, -Math.cos(a) * r * 0.06, -Math.sin(a) * r * 0.06, Math.random() < 0.5 ? '#c79cff' : '#f3e6ff', rand(2, 4), 16);
  }
}

// Slowed by the bike or the vortex: heavy arrows pressing down over the head.
const slowSprite = () =>
  sprite('softslow', [-16, -8, 32, 18], (g) => {
    for (const x of [-9, 9]) {
      outlined(g, '#c7cedb', () => {
        g.moveTo(x - 5, -4);
        g.lineTo(x + 5, -4);
        g.lineTo(x + 5, 1);
        g.lineTo(x + 8, 1);
        g.lineTo(x, 8);
        g.lineTo(x - 8, 1);
        g.lineTo(x - 5, 1);
        g.closePath();
      }, 1.6);
    }
  });
export const drawSoftSlow = (g, x, y) => stamp(g, slowSprite(), x, y + 12);

// Blinded: everything goes black except a small circle around you.
export function drawBlindness(g, x, y, left, total) {
  const fade = Math.min(1, Math.min(left, total - left + 4) / 8);
  const r = 88;
  const dark = g.createRadialGradient(x, y - 18, r * 0.55, x, y - 18, r);
  dark.addColorStop(0, 'rgba(3,3,10,0)');
  dark.addColorStop(1, `rgba(3,3,10,${0.985 * fade})`);
  g.fillStyle = dark;
  g.fillRect(view.l - 40, view.t - 40, view.w + 80, view.h + 80);
}

// A rush of speed: streaks behind whoever has a boost.
export function speedTrail(x, y, vx, color) {
  if (Math.abs(vx) > 4 && Math.random() < 0.7) bit(x - Math.sign(vx) * 12, y - rand(8, 34), -vx * 0.15, 0, color, rand(2, 4), 14);
}

// ---------- Animations ----------

let particles = [];
let effects = [];
let shake = 0;

function bit(x, y, vx, vy, color, size, life, gravity = 0, kind = 'spark') {
  if (particles.length < maxParticles) particles.push({ x, y, vx, vy, color, size, life, max: life, gravity, kind });
}

function burst(x, y, n, speed, colors, size, life, gravity = 0.08, dir = 0) {
  for (let i = 0; i < n; i++) {
    const a = dir ? (dir > 0 ? 0 : Math.PI) + rand(-0.7, 0.7) : rand(0, Math.PI * 2);
    const v = rand(speed * 0.3, speed);
    bit(x, y, Math.cos(a) * v, Math.sin(a) * v, colors[i % colors.length], rand(size * 0.5, size), rand(life * 0.6, life), gravity);
  }
}

function smoke(x, y, n, spread = 1.6, colors = ['#b9bcc4', '#70737d']) {
  // Soft circles are the costliest particles, so there are fewer on phones.
  const count = maxParticles < 300 ? Math.ceil(n / 2) : n;
  for (let i = 0; i < count; i++) {
    bit(x + rand(-8, 8), y + rand(-8, 8), rand(-spread, spread), rand(-2.2, -0.4), colors[i % colors.length], rand(7, 15), rand(24, 44), -0.01, 'smoke');
  }
}

function effect(dur, draw) {
  effects.push({ start: performance.now(), dur, draw });
}

function ring(x, y, from, to, color, dur, width = 4) {
  effect(dur, (g, p) => {
    g.globalAlpha = 1 - p;
    g.strokeStyle = color;
    g.lineWidth = width * (1 - p) + 0.5;
    g.beginPath();
    g.arc(x, y, from + (to - from) * p, 0, Math.PI * 2);
    g.stroke();
    g.globalAlpha = 1;
  });
}

function shout(text, x, y, color, size = 32) {
  effect(800, (g, p) => {
    const pop = Math.min(1, p * 7);
    g.save();
    g.translate(clamp(x, view.l + 90, view.l + view.w - 90), clamp(y, view.t + 60, H - 40) - p * 26);
    g.scale(pop * (1.25 - Math.min(0.25, p * 1.5)), pop * (1.25 - Math.min(0.25, p * 1.5)));
    g.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1;
    g.textAlign = 'center';
    g.font = `italic 900 ${size}px Tourney, Sora, sans-serif`;
    g.lineJoin = 'round';
    g.lineWidth = 7;
    g.strokeStyle = INK;
    g.strokeText(text, 0, 0);
    g.fillStyle = color;
    g.fillText(text, 0, 0);
    g.restore();
  });
}

const addShake = (n) => {
  if (!CALM && !noShake) shake = Math.max(shake, n);
};

let lastTracer = null;
const heroAt = new Map();

// Where each hero was last drawn, so an animation can follow them.
export const noteHero = (id, x, y, f) => heroAt.set(id, { x, y, f });
export const positionOf = (id) => heroAt.get(id);

function shotEffect(f) {
  const { x, y, g: gun } = f;
  if (gun === SNIPER_GUN) {
    // Sniper: a white-hot trace across the arena. It stops short if the bullet connects.
    play('snipe');
    const start = x + f.f * 44;
    const tracer = { end: start + f.f * 1100 };
    lastTracer = tracer;
    effect(380, (g, p) => {
      const fade = 1 - p;
      for (const [color, width] of [
        [`rgba(255,150,40,${fade * 0.45})`, 11 * fade + 1],
        [`rgba(255,241,184,${fade})`, 4 * fade + 0.5],
        [`rgba(255,255,255,${fade})`, 1.6],
      ]) {
        g.strokeStyle = color;
        g.lineWidth = width;
        g.beginPath();
        g.moveTo(start, y);
        g.lineTo(tracer.end, y);
        g.stroke();
      }
    });
    ring(start, y, 4, 34, CREAM, 220, 5);
    burst(start, y, 12, 7, [CREAM, GOLD], 3, 16, 0.08, f.f);
    addShake(6);
  } else if (gun === LASER || gun === ARC) {
    play('laser');
    const start = x + f.f * 40;
    const stop = f.to ?? start + f.f * 1300;
    // The Sprinter's arc gun fires a thinner gold bolt.
    const arc = gun === ARC;
    effect(240, (g, p) => {
      const fade = 1 - p;
      for (const [color, width] of [
        [arc ? `rgba(255,190,50,${fade * 0.5})` : `rgba(70,200,255,${fade * 0.5})`, (arc ? 10 : 16) * fade + 1],
        [arc ? `rgba(255,246,200,${fade})` : `rgba(220,250,255,${fade})`, (arc ? 3 : 5) * fade + 1],
      ]) {
        g.strokeStyle = color;
        g.lineWidth = width;
        g.beginPath();
        g.moveTo(start, y);
        g.lineTo(stop, y);
        g.stroke();
      }
    });
    addShake(4);
  } else if (gun === SHOTGUN) {
    play('shotgun');
    burst(x + f.f * 34, y, 10, 8, [CREAM, GOLD, '#ff9a2e'], 3, 12, 0.05, f.f);
    bit(x, y, -f.f * rand(2, 4), -rand(3, 5), '#d9412b', 4, 30, 0.3);
    addShake(5);
  } else if (gun === ROCKET) {
    play('rocketFire');
    smoke(x - f.f * 18, y, 8);
    addShake(4);
  } else if (gun === FLAME) {
    play('flame');
  } else {
    play(gun === MINIGUN ? 'minigun' : gun === RIFLE ? 'rifle' : 'shot');
    bit(x - f.f * 4, y, -f.f * rand(1, 3), -rand(2, 4), GOLD, 2.4, 22, 0.28);
  }
}

export function trigger(f) {
  const { x, y } = f;
  if (f.k === 'shot') {
    shotEffect(f);
  } else if (f.k === 'hit') {
    play('hit');
    burst(x, y, 12, 6, [CREAM, GOLD, '#ff9a2e'], 3, 18, 0.1, f.f);
    addShake(3);
  } else if (f.k === 'hitbig') {
    play('hitbig');
    if (lastTracer) lastTracer.end = x;
    ring(x, y, 8, 86, GOLD, 360, 8);
    ring(x, y, 4, 54, CREAM, 260, 5);
    burst(x, y, 26, 11, [CREAM, GOLD, '#ff9a2e', '#ff5a2e'], 4.5, 26, 0.12, f.f);
    shout('BOOM', x, y - 54, GOLD, 26);
    addShake(11);
  } else if (f.k === 'equip') {
    // Sniper: a scope sight snaps down onto the hero, then the rifle glints.
    play('equip');
    effect(650, (g, p) => {
      const at = positionOf(f.id) || f;
      const snap = Math.min(1, p * 2.6);
      const r = 80 - 52 * (1 - (1 - snap) ** 3);
      g.save();
      g.translate(at.x, at.y - 28);
      g.rotate((1 - snap) * 1.6);
      g.globalAlpha = p > 0.65 ? (1 - p) / 0.35 : 1;
      for (const [color, width] of [
        [INK, 5],
        [GOLD, 2.5],
      ]) {
        g.strokeStyle = color;
        g.lineWidth = width;
        g.beginPath();
        g.arc(0, 0, r, 0, Math.PI * 2);
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          g.moveTo(Math.cos(a) * (r - 10), Math.sin(a) * (r - 10));
          g.lineTo(Math.cos(a) * (r + 12), Math.sin(a) * (r + 12));
        }
        g.stroke();
      }
      g.restore();
      if (p > 0.35 && p < 0.7) star(g, at.x + at.f * 24, at.y - 30, 26 * (1 - Math.abs(p - 0.52) * 5), CREAM);
    });
    shout('5 ROUNDS', x, y - 70, GOLD, 22);
  } else if (f.k === 'throw') {
    // Trapper: the rope whirls round in a circle before it lets go.
    play('throw');
    effect(150, (g, p) => {
      const at = positionOf(f.id) || f;
      g.strokeStyle = `rgba(243,225,176,${1 - p})`;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(at.x, at.y - 44, 22 + p * 12, p * 7, p * 7 + 4.2);
      g.stroke();
    });
  } else if (f.k === 'snare') {
    // Trapper: the net slams shut and rope fibres fly off.
    play('snare');
    ring(x, y, 54, 16, '#f3e1b0', 200, 6);
    burst(x, y, 16, 6, ['#f3e1b0', '#cdb27a'], 3, 20, 0.2);
    shout('TRAPPED', x, y - 62, '#f3e1b0', 24);
    addShake(4);
  } else if (f.k === 'netdrop') {
    effect(420, (g, p) => {
      g.save();
      g.globalAlpha = 1 - p;
      g.translate(x + f.f * 40 * p, y + 90 * p * p);
      g.scale(1, 0.6);
      netShape(g, 26 * (1 - p * 0.3), p * 3);
      g.restore();
    });
  } else if (f.k === 'decoy') {
    // Ninja: a smoke bomb goes off at the feet, and a log is left standing in the cloud.
    play('smokebomb');
    smoke(x, y + 14, 22);
    ring(x, y + 16, 6, 54, '#d6d8de', 320, 5);
    burst(x, y + 12, 8, 4, ['#8a5a2b', '#c79a5e'], 3.5, 20, 0.2);
  } else if (f.k === 'fade') {
    play('fade');
    smoke(x, y, 14, 1);
    burst(x, y, 14, 4, ['#8a5a2b', '#c79a5e'], 4, 24, 0.22);
  } else if (f.k === 'teleport') {
    // Ninja: a burst of smoke where you were, the log splinters, and you stand where it stood.
    play('teleport');
    const { fromX, fromY } = f;
    effect(220, (g, p) => {
      const fade = 1 - p;
      for (let i = 0; i < 6; i++) {
        const off = -15 + i * 6;
        g.strokeStyle = `rgba(235,238,245,${fade * (i % 2 ? 0.8 : 0.45)})`;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(fromX + (x - fromX) * p * 0.6, fromY + off + (y - fromY) * p * 0.6);
        g.lineTo(x, y + off);
        g.stroke();
      }
    });
    smoke(fromX, fromY, 22);
    smoke(x, y, 12);
    burst(x, y, 18, 8, ['#8a5a2b', '#c79a5e', '#6d431d'], 4.5, 26, 0.3);
    effect(300, (g, p) => {
      g.save();
      g.translate(fromX, fromY);
      g.rotate(p * 8);
      g.globalAlpha = 1 - p;
      star(g, 0, 0, 22 * (1 - p * 0.3), '#d6d8de');
      g.restore();
    });
    addShake(4);
  } else if (f.k === 'speed') {
    // Sprinter: a jolt of lightning and a ring blown outward.
    play('speed');
    ring(x, y, 12, 72, '#ffd92e', 320, 6);
    for (let i = 0; i < 3; i++) {
      const a = rand(0, Math.PI * 2);
      const kink = Array.from({ length: 4 }, () => [rand(-8, 8), rand(-8, 8)]);
      effect(240, (g, p) => {
        g.strokeStyle = `rgba(255,235,90,${1 - p})`;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x, y);
        kink.forEach(([kx, ky], n) => g.lineTo(x + Math.cos(a) * 16 * (n + 1) + kx, y + Math.sin(a) * 16 * (n + 1) + ky));
        g.stroke();
      });
    }
    shout('OVERDRIVE', x, y - 66, '#ffd92e', 22);
  } else if (f.k === 'shrink') {
    // Shifter: the blob squashes down with a burst of bubbles.
    play('shrink');
    ring(x, y + 8, 46, 8, '#2ec4a6', 260, 7);
    for (let i = 0; i < 14; i++) bit(x + rand(-16, 16), y + rand(-6, 16), rand(-2.4, 2.4), rand(-3.6, -0.8), '#8df0d8', rand(3, 6), rand(16, 30), -0.02, 'smoke');
  } else if (f.k === 'lob') {
    play('throw');
  } else if (f.k === 'blast') {
    // A gift or rocket going off: flash, shockwave, fire and thrown debris. A gift throws wrapping paper too.
    play('blast');
    if (f.gift) burst(x, y, 26, 11, ['#d8301f', GOLD, '#2e9c44', '#fff6e6'], 6, 44, 0.22);
    const r = f.r;
    effect(160, (g, p) => {
      g.globalAlpha = 1 - p;
      g.fillStyle = '#fff3c4';
      g.beginPath();
      g.arc(x, y, r * (0.4 + p * 0.5), 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
    });
    effect(320, (g, p) => {
      g.globalAlpha = (1 - p) * 0.9;
      g.fillStyle = '#ff7a1a';
      g.beginPath();
      g.arc(x, y, r * (0.35 + p * 0.55), 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
    });
    ring(x, y, r * 0.3, r * 1.1, CREAM, 380, 9);
    burst(x, y, 30, 12, [CREAM, GOLD, '#ff7a1a', '#6a4f3b'], 5, 30, 0.3);
    smoke(x, y, 14, 2.6, ['#4c4c52', '#2e2e34']);
    addShake(13);
  } else if (f.k === 'wave') {
    // Dusk: the air darkens around her as the wave rises.
    play('wave');
    ring(x, y, 8, 70, '#7fe0ff', 300, 5);
    smoke(x, y + 16, 12, 1.8, ['#141a44', '#0c0f2c']);
  } else if (f.k === 'blinded') {
    play('blind');
    ring(x, y, 50, 6, '#7fe0ff', 280, 6);
    shout('BLINDED', x, y - 62, '#7fe0ff', 24);
    smoke(x, y, 10, 1.4, ['#141a44', '#0c0f2c']);
  } else if (f.k === 'dash') {
    // Anyone's dash: wind rings along the path and a burst of air at the start.
    play('dash');
    for (let i = 0; i < 4; i++) {
      const gx = x + f.f * i * 28;
      setTimeout(() => ring(gx, y, 8, 30, '#c9fbff', 180, 4), i * 28);
    }
    effect(260, (g, p) => {
      const fade = 1 - p;
      for (let i = 0; i < 7; i++) {
        const off = -24 + i * 8;
        g.strokeStyle = `rgba(210,250,255,${fade * 0.75})`;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x - f.f * (24 + (i % 3) * 18), y + off);
        g.lineTo(x + f.f * 110 * p, y + off);
        g.stroke();
      }
    });
    addShake(3);
  } else if (f.k === 'block') {
    play('block');
    ring(x, y, 20, 62, '#8ad0ff', 300, 7);
    burst(x, y, 14, 6, ['#8ad0ff', '#e3f4ff'], 3, 20, 0.05);
    shout('BLOCK', x, y - 60, '#8ad0ff', 22);
  } else if (f.k === 'jump') {
    play('hop');
    dust(x, y + 18, 4, 1.8);
  } else if (f.k === 'jump2') {
    play('hop2');
    jumpRing(x, y + 18);
  } else if (f.k === 'land') {
    dust(x, y + 18, 8, 2.6);
  } else if (f.k === 'storm') {
    // Rime: a burst of cold, and the blizzard starts to roll.
    play('wave');
    ring(x, y, 10, 74, '#e6f8ff', 320, 6);
    burst(x, y, 16, 6, ['#ffffff', '#9fe4f2'], 3, 20, 0.05);
  } else if (f.k === 'chill') {
    play('hit');
    ring(x, y, 12, 48, '#e6f8ff', 220, 5);
    burst(x, y, 12, 6, ['#ffffff', '#9fe4f2'], 3, 16, 0.08, f.f);
    addShake(3);
  } else if (f.k === 'zip') {
    play('throw');
    burst(x, y, 8, 4, ['#f2ece0', CREAM], 2.5, 12, 0.1);
  } else if (f.k === 'zipped') {
    play('snare');
    ring(x, y, 40, 10, '#f2ece0', 180, 5);
    burst(x, y, 12, 5, ['#f2ece0', '#ffffff'], 3, 16, 0.2);
    effect(700, (g, p) => {
      g.save();
      g.translate(x, y);
      g.globalAlpha = 1 - p;
      netShape(g, 28, 0.3);
      g.restore();
      g.globalAlpha = 1;
    });
    shout('WEBBED', x, y - 60, '#f2ece0', 20);
    addShake(4);
  } else if (f.k === 'vanish') {
    // Shade: the smoke goes off and stays where she stood.
    play('smokebomb');
    smokeCloud(x, y);
    ring(x, y + 12, 6, 52, '#a7b1bf', 300, 5);
  } else if (f.k === 'fallup') {
    // Seedea: the water bursts out of the surface and climbs the whole screen.
    play('water');
    burst(x, LAVA_Y, 26, 11, ['#d8fbff', '#8fe6f4', '#3ec2e8'], 4.5, 26, 0.3);
    addShake(4);
  } else if (f.k === 'falldown') {
    play('splash');
    for (let i = 0; i < 26; i++) bit(x + rand(-24, 24), rand(view.t + 20, LAVA_Y), rand(-1, 1), rand(1, 5), i % 2 ? '#d8fbff' : '#3ec2e8', rand(2, 4), rand(14, 26), 0.3);
  } else if (f.k === 'splash') {
    play('splash');
    burst(x, y, 8, 4, ['#d8fbff', '#8fe6f4'], 3, 14, 0.2, -f.f);
  } else if (f.k === 'launch') {
    // Thrown out of the top of the water.
    play('splash');
    ring(x, y, 12, 62, '#d8fbff', 280, 6);
    burst(x, y, 18, 9, ['#d8fbff', '#8fe6f4', '#ffffff'], 3.6, 22, 0.18);
  } else if (f.k === 'mount') {
    // Cassio: a kick of exhaust, and the bike is under him.
    play('engine');
    smoke(x, y + 14, 12, 1.8, ['#6d6f78', '#3a3c44']);
    ring(x, y + 12, 8, 60, '#ff7a33', 260, 5);
    burst(x, y + 12, 12, 7, [GOLD, '#ff7a33'], 3, 16, 0.2);
    shout('RIDE', x, y - 66, '#ff7a33', 24);
    addShake(5);
  } else if (f.k === 'bikethrow') {
    play('throw');
    play('engine');
    addShake(4);
  } else if (f.k === 'crash') {
    play('crash');
    ring(x, y, 10, 92, '#ff7a33', 340, 8);
    ring(x, y, 6, 58, CREAM, 240, 5);
    burst(x, y, 30, 12, [CREAM, GOLD, '#ff7a33', '#26282e', '#c6ccd6'], 5, 28, 0.3);
    smoke(x, y, 12, 2.4, ['#6d6f78', '#3a3c44']);
    shout('CRASH', x, y - 60, '#ff7a33', 28);
    addShake(12);
  } else if (f.k === 'clank') {
    play('clank');
    burst(x, y, 10, 6, [CREAM, '#c9d0da'], 2.6, 14, 0.25, -f.f);
  } else if (f.k === 'knife') {
    play('knife');
    ring(x, y, 6, 32, '#ff3a50', 180, 4);
  } else if (f.k === 'marked') {
    play('marked');
    ring(x, y, 46, 12, '#ff3a50', 260, 6);
    burst(x, y, 12, 6, ['#ff3a50', '#fff1f1'], 3, 16, 0.08, f.f);
    shout('MARKED', x, y - 62, '#ff5a6e', 24);
    addShake(3);
  } else if (f.k === 'blink') {
    // Dextar: cards and red smoke where he was, and he's already behind you.
    play('blink');
    const { fromX, fromY } = f;
    smoke(fromX, fromY, 14, 1.4, ['#a81a30', '#3a0a14']);
    smoke(x, y, 10, 1.4, ['#a81a30', '#3a0a14']);
    effect(240, (g, p) => {
      const fadeOut = 1 - p;
      for (let i = 0; i < 5; i++) {
        const off = -18 + i * 9;
        g.strokeStyle = `rgba(255,${i % 2 ? 58 : 220},${i % 2 ? 80 : 220},${fadeOut * 0.8})`;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(fromX + (x - fromX) * p * 0.8, fromY + off + (y - fromY) * p * 0.8);
        g.lineTo(x, y + off);
        g.stroke();
      }
    });
    for (let i = 0; i < 8; i++) {
      const dx = rand(-4, 4);
      const dy = rand(-5, -1);
      const spin = rand(-0.03, 0.03);
      effect(620, (g, p) => {
        g.save();
        g.translate(fromX + dx * p * 16, fromY + dy * p * 14 + p * p * 40);
        g.rotate(spin * p * 400);
        g.globalAlpha = 1 - p;
        outlined(g, '#fffdf4', () => g.roundRect(-4, -5.6, 8, 11.2, 1.4), 1.2);
        g.fillStyle = '#c81e36';
        g.beginPath();
        g.arc(0, 0, 1.8, 0, Math.PI * 2);
        g.fill();
        g.restore();
      });
    }
    addShake(5);
  } else if (f.k === 'stunned') {
    play('hitbig');
    ring(x, y, 44, 10, CREAM, 220, 6);
    burst(x, y, 14, 7, [CREAM, '#ff3a50'], 3, 18, 0.1);
    shout('STUNNED', x, y - 62, CREAM, 24);
    addShake(7);
  } else if (f.k === 'vacopen') {
    // VI: the grenade hits the floor and the air folds in on it.
    play('vortex');
    ring(x, y, VAC_RADIUS, 20, '#f3e6ff', 300, 7);
    burst(x, y, 14, 6, ['#c79cff', '#f3e6ff'], 3, 18, 0.05);
    addShake(7);
  } else if (f.k === 'pulled') {
    shout('PULLED', x, y - 60, '#c79cff', 20);
  } else if (f.k === 'paperhit') {
    play('paper');
    burst(x, y, 6, 3, ['#f7ecd2', '#d9c49a'], 3, 16, 0.15, -f.f);
  } else if (f.k === 'papertear') {
    play('tear');
    for (let i = 0; i < 18; i++) bit(x + rand(-8, 8), y + rand(-28, 28), rand(-3, 3), rand(-3, 1), i % 2 ? '#f7ecd2' : '#d9c49a', rand(3, 5), rand(22, 40), 0.14);
  } else if (f.k === 'paperup') {
    play('snap');
  } else if (f.k === 'door') {
    // Through a sliding door: a puff at both ends.
    play('door');
    smoke(f.fromX, f.fromY, 8, 1.2, ['#b9a98f', '#6e5f4a']);
    smoke(x, y, 8, 1.2, ['#b9a98f', '#6e5f4a']);
  } else if (f.k === 'guard') {
    // Aquilles: the shield slams into place with a gold ring.
    play('equip');
    ring(x, y, 60, 30, GOLD, 240, 7);
    burst(x, y, 12, 6, [GOLD, CREAM], 3, 18, 0.05);
    shout('GUARD', x, y - 66, GOLD, 22);
  } else if (f.k === 'clones') {
    // Illusionist: purple smoke that hangs like Shade's, with no shout, so nothing says who is real.
    play('smokebomb');
    smokeCloud(x, y, true);
    ring(x, y, 6, 56, '#c79cff', 300, 5);
  } else if (f.k === 'poof') {
    play('fade');
    smoke(x, y, 12, 1.4, ['#8a4fd0', '#4c2a78']);
    burst(x, y, 10, 4, ['#c79cff', CREAM], 3, 18, 0.05);
  } else if (f.k === 'trapset') {
    play('snap');
    burst(x, y, 6, 3, ['#9aa3ae', CREAM], 2.4, 12, 0.2);
  } else if (f.k === 'trapped') {
    // Poacher: the jaws slam shut.
    play('snare');
    ring(x, y - 8, 44, 10, '#dfe6ee', 200, 6);
    burst(x, y - 8, 14, 6, ['#9aa3ae', '#dfe6ee'], 3, 18, 0.25);
    shout('SLOWED', x, y - 74, '#dfe6ee', 24);
    addShake(4);
  } else if (f.k === 'cast') {
    play('throw');
  } else if (f.k === 'hooked') {
    // Angler: caught, and on the way back.
    play('snare');
    ring(x, y, 42, 8, '#dfe6ee', 180, 6);
    burst(x, y, 12, 6, [CREAM, '#dfe6ee'], 3, 16, 0.1, -f.f);
    shout('HOOKED', x, y - 60, CREAM, 24);
    addShake(5);
  } else if (f.k === 'dogcall') {
    play('bark');
    burst(x, y + 12, 8, 4, ['#4a2a15', '#b8945a'], 3, 16, 0.2);
  } else if (f.k === 'bite') {
    play('bark');
    play('hit');
    burst(x, y, 12, 6, [CREAM, '#d8261c'], 3, 18, 0.1, f.f);
    addShake(3);
  } else if (f.k === 'dogout') {
    play('fade');
    smoke(x, y, 12, 1.4);
    burst(x, y, 10, 4, ['#4a2a15', '#f6efe2'], 3, 20, 0.2);
  } else if (f.k === 'wallup') {
    // Mossback: the ground heaves and the wall shoves its way up.
    play('rumble');
    smoke(x, y - 6, 12, 2, ['#8a6a44', '#5c4429']);
    burst(x, y - 6, 16, 7, ['#6b4a2b', '#4f8a3a', '#8f6a41'], 4, 22, 0.35);
    addShake(6);
  } else if (f.k === 'wallhit') {
    if (f.g === SNIPER_GUN && lastTracer) lastTracer.end = x;
    play('block');
    burst(x, y, 8, 5, ['#8f6a41', '#6b4a2b', CREAM], 3, 14, 0.25, -f.f);
  } else if (f.k === 'walldown') {
    play('rumble');
    smoke(x, y, 16, 2, ['#8a6a44', '#5c4429']);
    burst(x, y, 24, 8, ['#6b4a2b', '#4f8a3a', '#8f6a41'], 5, 28, 0.35);
    addShake(5);
  } else if (f.k === 'pickup') {
    const it = ITEMS[f.i];
    play(it.rare ? 'rare' : 'pickup');
    ring(x, y, 8, 54, it.rare ? GOLD : CREAM, 320, 5);
    burst(x, y, it.rare ? 24 : 12, 5, it.rare ? [GOLD, CREAM] : [CREAM, '#8ee6ff'], 3, 22, -0.02);
    shout(it.name.toUpperCase(), x, y - 28, it.rare ? GOLD : CREAM, it.rare ? 24 : 18);
  } else if (f.k === 'ko') {
    play('ko');
    const inLava = y >= H - 2;
    const kx = clamp(x, view.l + 20, view.l + view.w - 20);
    burst(kx, inLava ? LAVA_Y + 6 : y, 34, 14, look.splash, 6, 42, 0.42);
    if (inLava) {
      for (const dx of [-16, 16]) {
        effect(500, (g, p) => {
          g.globalAlpha = 1 - p;
          outlined(g, look.splash[2], () => g.ellipse(kx + dx * p * 3, LAVA_Y - 34 * Math.sin(p * Math.PI), 8 * (1 - p) + 2, 22 * (1 - p) + 2, 0, 0, Math.PI * 2), 2);
          g.globalAlpha = 1;
        });
      }
    }
    ring(kx, inLava ? LAVA_Y : y, 10, 110, GOLD, 420, 8);
    shout('KO!', kx, inLava ? LAVA_Y - 70 : y - 30, '#ff7a33', 44);
    addShake(14);
  } else if (f.k === 'gust') {
    play('gust');
  } else if (f.k === 'fell') {
    play('splash');
    burst(clamp(x, view.l + 20, view.l + view.w - 20), LAVA_Y + 6, 20, 10, look.splash, 5, 30, 0.42);
    addShake(6);
  } else if (f.k === 'snap') {
    play('snare');
    burst(x, y - 8, 16, 7, [CREAM, '#8f6a41', '#3a2210'], 3.5, 22, 0.3);
    addShake(6);
  } else if (f.k === 'flag') {
    play('pick');
    ring(x, y - 40, 8, 60, GOLD, 360, 4);
    burst(x, y - 50, 12, 4, [GOLD, CREAM], 3, 20, -0.02);
    shout('CHECKPOINT', x, y - 86, CREAM, 18);
  } else if (f.k === 'thud') {
    play('hitbig');
    burst(x, y - 4, 22, 7, [look.dust, CREAM, GOLD], 4, 26, 0.2);
    ring(x, y - 6, 10, 90, CREAM, 340, 5);
    addShake(10);
  } else if (f.k === 'become') {
    play('become');
    if (!CALM) {
      effect(420, (g, p) => {
        g.globalAlpha = (1 - p) * 0.85;
        g.fillStyle = '#fff6d6';
        g.fillRect(view.l - 40, view.t - 40, view.w + 80, view.h + 80);
        g.globalAlpha = 1;
      });
    }
    ring(x, y - 22, 12, 210, GOLD, 620, 9);
    ring(x, y - 22, 6, 130, CREAM, 460, 6);
    burst(x, y - 22, 46, 11, [GOLD, CREAM, '#ffffff'], 6, 40, 0.1);
    addShake(16);
  }
}

// ---------- The campaign: a beaten boss's body, and its power crossing to you ----------

const lerp = (a, b, p) => a + (b - a) * p;

const fallenSprite = (hero) =>
  sprite(`fallen${hero}`, [-56, -46, 112, 62], (g) => {
    if (g.filter !== undefined) g.filter = 'grayscale(.6) brightness(.72)';
    g.translate(-33, -15);
    g.rotate(Math.PI / 2);
    drawHero(g, { hero, color: '#8f8a7c', x: 0, y: 0, f: 1, vx: 0, ground: true, t: 0, scale: 1, preview: true, noGun: true });
  });

// The hero as pure light, for the power leaving the body.
const soulSprite = (hero) =>
  sprite(`soul${hero}`, [-50, -78, 100, 86], (g) => {
    drawHero(g, { hero, color: GOLD, x: 0, y: 0, f: 1, vx: 0, ground: true, t: 0, scale: 1, preview: true, noGun: true });
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#ffe9a6';
    g.fillRect(-50, -78, 100, 86);
  });

const claimSprite = () =>
  sprite('absorb', [-72, -62, 144, 62], (g) => {
    g.font = 'italic 900 24px Tourney, Sora, sans-serif';
    g.textAlign = 'center';
    g.lineJoin = 'round';
    g.lineWidth = 6;
    g.strokeStyle = INK;
    g.strokeText('ABSORB', 0, -32);
    g.fillStyle = GOLD;
    g.fillText('ABSORB', 0, -32);
    outlined(g, GOLD, () => {
      g.moveTo(-13, -24);
      g.lineTo(13, -24);
      g.lineTo(0, -6);
      g.closePath();
    });
  });

// c is what the room says; t is its step count, smoothed between snapshots. to is where you are.
export function drawBody(g, c, t, to, now) {
  if (c.ph === 'death') {
    const p = Math.min(1, t / c.deathSteps);
    const x = lerp(clamp(c.fx, view.l + 40, view.l + view.w - 40), c.x, p);
    const y = lerp(LAVA_Y, c.y, p) - Math.sin(p * Math.PI) * 250;
    g.save();
    g.translate(x, y);
    g.rotate((1 - p) * Math.PI * 3);
    stamp(g, fallenSprite(c.h));
    g.restore();
    bit(x + rand(-14, 14), y + rand(-14, 14), rand(-1, 1), rand(-1, 1), Math.random() < 0.5 ? GOLD : look.splash[1], rand(2, 5), 18, 0.05);
    return;
  }
  if (c.ph === 'claim') {
    stamp(g, fallenSprite(c.h), c.x, c.y);
    // A slow gleam over it, so the prize is the first thing you look for.
    for (let i = 0; i < 7; i++) {
      const q = (now / 1300 + i / 7) % 1;
      g.globalAlpha = Math.sin(q * Math.PI);
      g.fillStyle = i % 2 ? GOLD : CREAM;
      g.fillRect(c.x - 40 + ((i * 37) % 80), c.y - 6 - q * 46, 3.2, 3.2);
    }
    g.globalAlpha = 1;
    stamp(g, claimSprite(), c.x, c.y - 38 + Math.sin(now / 240) * 5);
    return;
  }
  if (c.ph !== 'absorb' || !to) return;
  const p = Math.min(1, t / c.swapAt);
  if (p < 1) {
    g.globalAlpha = 1 - p;
    stamp(g, fallenSprite(c.h), c.x, c.y);
    // The stream of power, always heading for you.
    for (let i = 0; i < 26; i++) {
      const q = (now / 620 + i / 26) % 1;
      const eased = q * q;
      g.globalAlpha = Math.min(1, p * 4) * (1 - q * 0.4);
      g.fillStyle = i % 3 ? GOLD : CREAM;
      const size = 5 - q * 2.5;
      g.fillRect(lerp(c.x, to.x, eased) + Math.sin(i * 2.1 + q * 7) * 34 * (1 - q) - size / 2, lerp(c.y - 16, to.y - 22, eased) - Math.sin(q * Math.PI) * (46 + (i % 5) * 9) - size / 2, size, size);
    }
    // The body's own shape rises, crosses over and shrinks into you.
    const q = clamp((p - 0.08) / 0.8, 0, 1);
    const eased = q * q * (3 - 2 * q);
    g.save();
    g.translate(lerp(c.x, to.x, eased), lerp(c.y - 6, to.y - 4, eased) - Math.sin(q * Math.PI) * 74);
    const size = 1.15 - eased * 0.75;
    g.scale(size, size);
    g.globalAlpha = 0.85 * Math.min(1, q * 6) * (1 - Math.max(0, q - 0.86) / 0.14);
    stamp(g, soulSprite(c.h));
    g.restore();
    // Rings closing in on you.
    g.strokeStyle = GOLD;
    g.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const close = (now / 520 + i / 3) % 1;
      g.globalAlpha = close * p;
      g.beginPath();
      g.arc(to.x, to.y - 22, 14 + (1 - close) * 84, 0, Math.PI * 2);
      g.stroke();
    }
    g.globalAlpha = 1;
  }
}

// The net tears apart when its 1.5 s are up.
export function snapNet(x, y) {
  play('snap');
  burst(x, y - 24, 22, 7, ['#f3e1b0', '#cdb27a', GOLD], 3.2, 24, 0.22);
  ring(x, y - 24, 16, 58, '#f3e1b0', 240, 4);
}

export function clearEffects() {
  particles = [];
  effects = [];
  shake = 0;
  lastTracer = null;
}

export function drawEffects(g, now) {
  let kept = 0;
  for (let i = 0; i < effects.length; i++) {
    const e = effects[i];
    const p = (now - e.start) / e.dur;
    if (p >= 1) continue;
    if (p >= 0) e.draw(g, p);
    effects[kept++] = e;
  }
  effects.length = kept;
  kept = 0;
  for (let i = 0; i < particles.length; i++) {
    const b = particles[i];
    if (--b.life <= 0) continue;
    b.x += b.vx;
    b.y += b.vy;
    b.vy += b.gravity;
    const left = b.life / b.max;
    g.globalAlpha = b.kind === 'smoke' ? left * 0.75 : Math.min(1, left * 1.6);
    g.fillStyle = b.color;
    if (b.kind === 'smoke') {
      g.beginPath();
      g.arc(b.x, b.y, b.size * (1.5 - left * 0.5), 0, Math.PI * 2);
      g.fill();
    } else {
      g.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
    }
    particles[kept++] = b;
  }
  particles.length = kept;
  g.globalAlpha = 1;
}

// Returns the camera shake for this frame, and lets it die down.
export function takeShake() {
  shake *= 0.86;
  if (shake < 0.3) shake = 0;
  return shake ? [rand(-shake, shake), rand(-shake, shake)] : [0, 0];
}

