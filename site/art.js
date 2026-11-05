// The maps: each one's background, platforms and moving hazard. No game rules here.
// The platforms never move; a wider screen only shows more of the world around them.
import { H, MAPS, SCREEN_H, SCREEN_HP, SCREEN_W, W } from './sim.js';
import { CREAM, GOLD, INK, outlined, sprite, stamp } from './heroes.js';
import { gustState, logAt } from './campaign.js';

export const LAVA_Y = 492;
// Baked past the screen edge, so a camera shake never shows what's behind it.
export const SHAKE_ROOM = 24;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

// ---------- Everything that never moves is drawn once and reused ----------

function seeded(n) {
  return () => {
    n = (n * 16807) % 2147483647;
    return n / 2147483647;
  };
}

function jaggedBand(g, r, view, fromTop, depth, spacing, fill) {
  const left = view.l - SHAKE_ROOM;
  const right = view.l + view.w + SHAKE_ROOM;
  const edge = fromTop ? view.t - SHAKE_ROOM : H + SHAKE_ROOM;
  const way = fromTop ? 1 : -1;
  const base = fromTop ? view.t : H;
  g.beginPath();
  g.moveTo(left, edge);
  for (let x = left; x <= right + spacing; x += spacing) {
    const reach = depth * (0.35 + r() * 0.65);
    g.lineTo(x, base + way * reach);
    g.lineTo(x + spacing / 2, base + way * reach * 0.45);
  }
  g.lineTo(right + spacing, edge);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
}

function pillar(g, view, x, w) {
  const side = g.createLinearGradient(x, 0, x + w, 0);
  side.addColorStop(0, '#1b1410');
  side.addColorStop(0.5, '#33261d');
  side.addColorStop(1, '#15100c');
  g.fillStyle = side;
  g.fillRect(x, view.t - SHAKE_ROOM, w, H - view.t + SHAKE_ROOM * 2);
  g.fillStyle = 'rgba(0,0,0,.28)';
  for (let y = view.t + 22; y < H; y += 44) g.fillRect(x, y, w, 2);
  for (const y of [110, 240, 370]) {
    g.fillStyle = '#6d4a1d';
    g.fillRect(x - 3, y, w + 6, 10);
    g.fillStyle = '#b98a35';
    g.fillRect(x - 3, y, w + 6, 2);
  }
}

// A far-off fall of molten rock, in the extra space a wide screen shows.
function lavaFall(g, view, x, w) {
  const top = view.t - SHAKE_ROOM;
  const glow = g.createLinearGradient(x - 26, 0, x + w + 26, 0);
  glow.addColorStop(0, 'rgba(255,110,20,0)');
  glow.addColorStop(0.5, 'rgba(255,110,20,.26)');
  glow.addColorStop(1, 'rgba(255,110,20,0)');
  g.fillStyle = glow;
  g.fillRect(x - 26, top, w + 52, H - top);
  const body = g.createLinearGradient(x, 0, x + w, 0);
  body.addColorStop(0, '#b3320c');
  body.addColorStop(0.45, '#ff9a22');
  body.addColorStop(0.6, '#ffc64a');
  body.addColorStop(1, '#b3320c');
  g.fillStyle = body;
  g.fillRect(x, top, w, H - top);
}

function banner(g, x, y, h) {
  outlined(
    g,
    '#7a1626',
    () => {
      g.moveTo(x - 24, y);
      g.lineTo(x + 24, y);
      g.lineTo(x + 24, y + h);
      g.lineTo(x, y + h - 16);
      g.lineTo(x - 24, y + h);
      g.closePath();
    },
    2,
  );
  g.strokeStyle = '#c9963a';
  g.lineWidth = 2;
  g.strokeRect(x - 19, y + 5, 38, h - 28);
  // A forge hammer, our own emblem.
  g.save();
  g.translate(x, y + h / 2 - 12);
  g.rotate(-0.6);
  g.fillStyle = '#e3b64b';
  g.fillRect(-2.5, -10, 5, 26);
  g.fillRect(-11, -16, 22, 11);
  g.restore();
}

function chain(g, x, y1, y2) {
  for (let y = y1, odd = 0; y < y2; y += 11, odd ^= 1) {
    g.strokeStyle = '#0d0a08';
    g.lineWidth = 3.5;
    g.beginPath();
    g.ellipse(x, y, odd ? 2 : 4, 6, 0, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = '#7c6a55';
    g.lineWidth = 1.4;
    g.stroke();
  }
}

function platform(g, pl, r) {
  const big = pl.w > 400;
  const depth = big ? 30 : 22;
  const { x, y, w } = pl;
  // Rough rock hanging below the stonework.
  g.beginPath();
  g.moveTo(x + 8, y + depth - 2);
  const hang = big ? 34 : 24;
  const parts = Math.round(w / 34);
  for (let i = 0; i <= parts; i++) {
    const px = x + 8 + ((w - 16) * i) / parts;
    const edge = Math.min(i, parts - i) / (parts / 2);
    g.lineTo(px, y + depth + (i % 2 ? r() * hang * (0.25 + edge * 0.75) : 2));
  }
  g.lineTo(x + w - 8, y + depth - 2);
  g.closePath();
  g.fillStyle = '#2d2b29';
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.stroke();

  // The stone block.
  const face = g.createLinearGradient(0, y, 0, y + depth);
  face.addColorStop(0, '#94908a');
  face.addColorStop(1, '#55514c');
  g.beginPath();
  g.roundRect(x, y, w, depth, 7);
  g.fillStyle = face;
  g.fill();
  g.save();
  g.clip();
  g.strokeStyle = 'rgba(20,17,14,.55)';
  g.lineWidth = 1.5;
  const bh = (depth - 7) / 2;
  for (let row = 0; row < 2; row++) {
    const ty = y + 7 + row * bh;
    g.beginPath();
    g.moveTo(x, ty);
    g.lineTo(x + w, ty);
    for (let bx = x + (row ? 14 : 34); bx < x + w; bx += 40) {
      g.moveTo(bx, ty);
      g.lineTo(bx, ty + bh);
    }
    g.stroke();
  }
  // The lit top is what makes a platform readable against the fire.
  const lip = g.createLinearGradient(0, y, 0, y + 8);
  lip.addColorStop(0, CREAM);
  lip.addColorStop(0.45, GOLD);
  lip.addColorStop(1, '#c98a1e');
  g.fillStyle = lip;
  g.fillRect(x, y, w, 8);
  g.restore();
  g.beginPath();
  g.roundRect(x, y, w, depth, 7);
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.stroke();
  // Gold end caps with rivets.
  for (const cx of [x, x + w - 16]) {
    g.beginPath();
    g.roundRect(cx, y, 16, depth, 5);
    g.fillStyle = '#c28d2a';
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = CREAM;
    g.beginPath();
    g.arc(cx + 8, y + depth / 2 + 2, 2.4, 0, Math.PI * 2);
    g.fill();
  }
}

// ---------- Greenwood: nothing but forest, wall to wall, with no sky ----------

function flower(g, x, y, size, petals) {
  g.fillStyle = petals;
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    g.beginPath();
    g.arc(x + Math.cos(a) * size, y + Math.sin(a) * size, size * 0.72, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#ffd35c';
  g.beginPath();
  g.arc(x, y, size * 0.62, 0, Math.PI * 2);
  g.fill();
}

function trunk(g, x, w, top, bottom, light, dark, r) {
  const side = g.createLinearGradient(x, 0, x + w, 0);
  side.addColorStop(0, dark);
  side.addColorStop(0.45, light);
  side.addColorStop(1, dark);
  g.fillStyle = side;
  g.beginPath();
  g.moveTo(x + w * 0.1, top);
  g.lineTo(x + w * 0.9, top);
  g.quadraticCurveTo(x + w * 0.85, (top + bottom) / 2, x + w * 1.12, bottom);
  g.lineTo(x - w * 0.12, bottom);
  g.quadraticCurveTo(x + w * 0.15, (top + bottom) / 2, x + w * 0.1, top);
  g.closePath();
  g.fill();
  // Bark lines.
  g.strokeStyle = 'rgba(0,0,0,.2)';
  g.lineWidth = Math.max(1, w * 0.035);
  for (let i = 0; i < w / 9; i++) {
    const bx = x + w * 0.15 + r() * w * 0.7;
    const by = top + r() * (bottom - top);
    g.beginPath();
    g.moveTo(bx, by);
    g.lineTo(bx + (r() - 0.5) * 4, by + 26 + r() * 50);
    g.stroke();
  }
}

// A leafy mass: overlapping circles, darkest first.
function leaves(g, r, x, y, spread, count, size, colors) {
  for (const color of colors) {
    g.fillStyle = color;
    for (let i = 0; i < count; i++) {
      g.beginPath();
      g.arc(x + (r() - 0.5) * spread, y + (r() - 0.5) * spread * 0.5, size * (0.55 + r() * 0.7), 0, Math.PI * 2);
      g.fill();
    }
  }
}

function forestBackdrop(g, view, r, left, top, wide, tall) {
  const base = g.createLinearGradient(0, top, 0, top + tall);
  base.addColorStop(0, '#0a2c17');
  base.addColorStop(0.45, '#1c6a34');
  base.addColorStop(0.75, '#14562b');
  base.addColorStop(1, '#0a3319');
  g.fillStyle = base;
  g.fillRect(left, top, wide, tall);

  // Row upon row of trees, paler the further away, so the forest looks endless.
  const rows = [
    { step: 74, min: 18, max: 34, light: '#2a7a42', dark: '#1e6535' },
    { step: 118, min: 34, max: 58, light: '#1f6336', dark: '#144a27' },
    { step: 176, min: 58, max: 92, light: '#174d2a', dark: '#0c331b' },
  ];
  for (const row of rows) {
    for (let x = left - 40; x < left + wide + 40; x += row.step * (0.72 + r() * 0.56)) trunk(g, x, row.min + r() * (row.max - row.min), top, H + SHAKE_ROOM, row.light, row.dark, r);
    // Each row of trees has its own leaves among the trunks.
    for (let x = left; x < left + wide; x += 150) leaves(g, r, x + r() * 90, 150 + r() * 240, 120, 5, 26, [row.dark]);
  }

  // Soft shafts of green light falling through the leaves.
  for (let i = 0; i < 7; i++) {
    const x = left + r() * wide;
    g.fillStyle = `rgba(190,255,130,${0.035 + r() * 0.04})`;
    g.beginPath();
    g.moveTo(x, top);
    g.lineTo(x + 46 + r() * 50, top);
    g.lineTo(x - 40 + r() * 30, H);
    g.lineTo(x - 150 + r() * 30, H);
    g.closePath();
    g.fill();
  }

  // The canopy closes the whole top of the screen.
  for (let x = left - 30; x < left + wide + 60; x += 64) leaves(g, r, x, top + 34 + (view.t - top), 120, 4, 42, ['#0a2c17', '#0e3a1e']);
  for (let x = left - 30; x < left + wide + 60; x += 70) leaves(g, r, x, view.t + 62 + r() * 34, 130, 4, 26, ['#14522a', '#1c6a34', '#2b8a44']);

  // Hanging vines, with a few leaves on each.
  for (let i = 0; i < 18; i++) {
    const x = left + r() * wide;
    const end = view.t + 90 + r() * 180;
    g.strokeStyle = '#0d3a1e';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x, view.t);
    g.quadraticCurveTo(x + (r() - 0.5) * 30, (view.t + end) / 2, x + (r() - 0.5) * 20, end);
    g.stroke();
    g.fillStyle = '#2b8a44';
    for (let y = view.t + 40; y < end; y += 24) {
      g.beginPath();
      g.ellipse(x + (r() - 0.5) * 12, y, 7, 3.5, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  }

  // Bushes and flowers along the forest floor.
  for (let x = left; x < left + wide; x += 52) leaves(g, r, x, 470 + r() * 14, 80, 4, 24, ['#0c3a1d', '#17602f', '#2b8a44']);
  const colors = ['#ffe36b', '#ff8fb0', '#ffffff', '#ffb45c', '#e5a3ff'];
  for (let i = 0; i < wide / 13; i++) flower(g, left + r() * wide, 432 + r() * 54, 2.6 + r() * 3.4, colors[Math.floor(r() * colors.length)]);
}

// The two great trees that carry the platforms, and short boughs between the rows.
function forestFrame(g, platforms, r) {
  const lowest = Math.max(...platforms.map((pl) => pl.y));
  const highest = Math.min(...platforms.map((pl) => pl.y));
  for (const x of [222, 678]) trunk(g, x, 60, highest + 75, H + SHAKE_ROOM, '#6b4a26', '#31210f', r);
  for (const x of [345, 590]) trunk(g, x, 24, highest, highest + 80, '#6b4a26', '#31210f', r);
  for (const x of [120, 190, 770, 840]) trunk(g, x, 18, lowest - 150, lowest - 70, '#6b4a26', '#31210f', r);
}

function logPlatform(g, pl, r) {
  const { x, y, w } = pl;
  const depth = 22;
  const wood = g.createLinearGradient(0, y, 0, y + depth);
  wood.addColorStop(0, '#9a6c35');
  wood.addColorStop(1, '#55361a');
  g.beginPath();
  g.roundRect(x, y, w, depth, 9);
  g.fillStyle = wood;
  g.fill();
  g.save();
  g.clip();
  g.strokeStyle = 'rgba(30,16,4,.45)';
  g.lineWidth = 1.5;
  for (let i = 0; i < w / 26; i++) {
    const bx = x + r() * w;
    const by = y + 8 + r() * 12;
    g.beginPath();
    g.moveTo(bx, by);
    g.lineTo(bx + 18 + r() * 26, by + (r() - 0.5) * 3);
    g.stroke();
  }
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.stroke();
  // Cut log ends, with their rings.
  for (const cx of [x + 9, x + w - 9]) {
    outlined(g, '#d8ad6a', () => g.ellipse(cx, y + depth / 2, 8, depth / 2 - 1, 0, 0, Math.PI * 2), 2);
    g.strokeStyle = '#94682f';
    g.lineWidth = 1.2;
    g.beginPath();
    g.ellipse(cx, y + depth / 2, 4, depth / 4, 0, 0, Math.PI * 2);
    g.stroke();
  }
  // Moss along the top is what you stand on, so it's the brightest line in the picture.
  g.beginPath();
  g.moveTo(x + 4, y + 3);
  for (let px = x + 4; px < x + w - 4; px += 11) g.lineTo(px + 5.5, y + 6 + r() * 7), g.lineTo(px + 11, y + 4);
  g.lineTo(x + w - 3, y - 2);
  g.quadraticCurveTo(x + w / 2, y - 4, x + 3, y - 2);
  g.closePath();
  g.fillStyle = '#5fb84a';
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = '#c8f08a';
  g.fillRect(x + 6, y - 1.5, w - 12, 2.5);
  // Tufts and flowers growing on it.
  for (let i = 0; i < w / 42; i++) {
    const fx = x + 14 + r() * (w - 28);
    if (r() < 0.6) {
      g.strokeStyle = '#2b8a44';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(fx, y);
      g.lineTo(fx - 3, y - 9);
      g.moveTo(fx, y);
      g.lineTo(fx + 3, y - 8);
      g.stroke();
    } else {
      flower(g, fx, y - 4, 2.2, ['#ffe36b', '#ff8fb0', '#ffffff'][Math.floor(r() * 3)]);
    }
  }
}

// ---------- Sun Steps: a golden stepped temple against an enormous setting sun ----------

function sunBackdrop(g, view, r, left, top, wide, tall, platforms) {
  const sky = g.createLinearGradient(0, top, 0, H);
  sky.addColorStop(0, '#1b1208');
  sky.addColorStop(0.42, '#5a3510');
  sky.addColorStop(0.72, '#c07a1c');
  sky.addColorStop(1, '#f3b845');
  g.fillStyle = sky;
  g.fillRect(left, top, wide, tall);

  // Rays first, then the sun over them.
  g.fillStyle = 'rgba(255,220,130,.1)';
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 + 0.13;
    g.beginPath();
    g.moveTo(W / 2, 260);
    g.lineTo(W / 2 + Math.cos(a) * 1200, 260 + Math.sin(a) * 1200);
    g.lineTo(W / 2 + Math.cos(a + 0.2) * 1200, 260 + Math.sin(a + 0.2) * 1200);
    g.closePath();
    g.fill();
  }
  for (const [radius, color] of [
    [250, 'rgba(255,190,70,.2)'],
    [214, 'rgba(255,205,90,.34)'],
    [176, '#ffd35c'],
  ]) {
    g.fillStyle = color;
    g.beginPath();
    g.arc(W / 2, 260, radius, 0, Math.PI * 2);
    g.fill();
  }

  // Far dunes either side.
  for (const [base, color] of [
    [410, '#8a5a1a'],
    [450, '#6b4412'],
  ]) {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(left, H + SHAKE_ROOM);
    for (let x = left; x <= left + wide + 90; x += 90) g.quadraticCurveTo(x + 45, base - 26 - r() * 44, x + 90, base + r() * 16);
    g.lineTo(left + wide + 90, H + SHAKE_ROOM);
    g.closePath();
    g.fill();
  }

  // The body of the temple, one tier at a time, widest at the bottom. It's darker than the steps so they stand out.
  const tiers = [...platforms].sort((a, b) => a.y - b.y);
  for (const [i, pl] of tiers.entries()) {
    const bottom = i + 1 < tiers.length ? tiers[i + 1].y : H + SHAKE_ROOM;
    const body = g.createLinearGradient(0, pl.y, 0, bottom);
    body.addColorStop(0, '#6e4a1f');
    body.addColorStop(1, '#4e3314');
    g.fillStyle = body;
    g.fillRect(pl.x + 6, pl.y + 8, pl.w - 12, bottom - pl.y);
    g.strokeStyle = 'rgba(25,14,3,.5)';
    g.lineWidth = 1.5;
    for (let row = pl.y + 40, odd = 0; row < bottom; row += 15, odd ^= 1) {
      g.beginPath();
      g.moveTo(pl.x + 6, row);
      g.lineTo(pl.x + pl.w - 6, row);
      for (let bx = pl.x + 6 + (odd ? 22 : 0); bx < pl.x + pl.w - 6; bx += 44) {
        g.moveTo(bx, row);
        g.lineTo(bx, row + 15);
      }
      g.stroke();
    }
  }
  // Fires at the very top, and our own sun mark over the temple door.
  const crown = tiers[0];
  for (const x of [crown.x + 16, crown.x + crown.w - 16]) {
    outlined(g, '#4e3314', () => g.roundRect(x - 7, crown.y - 22, 14, 22, 3), 2);
    outlined(g, '#ff9a2e', () => {
      g.moveTo(x - 9, crown.y - 22);
      g.quadraticCurveTo(x - 12, crown.y - 36, x, crown.y - 48);
      g.quadraticCurveTo(x + 12, crown.y - 36, x + 9, crown.y - 22);
      g.closePath();
    }, 2);
    outlined(g, '#ffe08a', () => g.ellipse(x, crown.y - 29, 4, 8, 0, 0, Math.PI * 2), 1.5);
  }
  outlined(g, '#ffd35c', () => g.arc(W / 2, tiers[1].y - 36, 18, 0, Math.PI * 2), 2.5);
  g.fillStyle = INK;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    g.fillRect(W / 2 + Math.cos(a) * 22 - 2, tiers[1].y - 36 + Math.sin(a) * 22 - 2, 4, 4);
  }
}

function stepPlatform(g, pl) {
  const { x, y, w } = pl;
  const depth = 26;
  const stone = g.createLinearGradient(0, y, 0, y + depth);
  stone.addColorStop(0, '#d8a94e');
  stone.addColorStop(1, '#94661f');
  g.beginPath();
  g.roundRect(x, y, w, depth, 5);
  g.fillStyle = stone;
  g.fill();
  g.save();
  g.clip();
  // Carved blocks, with a repeating triangle of our own.
  g.strokeStyle = 'rgba(40,22,4,.55)';
  g.lineWidth = 1.5;
  g.fillStyle = 'rgba(40,22,4,.4)';
  for (let bx = x + 8; bx < x + w; bx += 40) {
    g.beginPath();
    g.moveTo(bx, y + 8);
    g.lineTo(bx, y + depth);
    g.stroke();
    g.beginPath();
    g.moveTo(bx + 12, y + depth - 5);
    g.lineTo(bx + 20, y + 11);
    g.lineTo(bx + 28, y + depth - 5);
    g.closePath();
    g.fill();
  }
  const lip = g.createLinearGradient(0, y, 0, y + 8);
  lip.addColorStop(0, CREAM);
  lip.addColorStop(0.45, GOLD);
  lip.addColorStop(1, '#c98a1e');
  g.fillStyle = lip;
  g.fillRect(x, y, w, 8);
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.beginPath();
  g.roundRect(x, y, w, depth, 5);
  g.stroke();
}

function forgeBackdrop(g, view, r, left, top, wide, tall, platforms) {
  const sky = g.createLinearGradient(0, view.t, 0, H);
  sky.addColorStop(0, '#120e0b');
  sky.addColorStop(0.45, '#2e1a12');
  sky.addColorStop(0.72, '#6d2418');
  sky.addColorStop(0.92, '#c2410f');
  sky.addColorStop(1, '#f07a12');
  g.fillStyle = sky;
  g.fillRect(left, top, wide, tall);

  // Far furnace mouth, glowing behind the top platforms.
  const mouth = g.createRadialGradient(W / 2, 330, 20, W / 2, 330, 300);
  mouth.addColorStop(0, 'rgba(255,120,40,.26)');
  mouth.addColorStop(1, 'rgba(255,120,40,0)');
  g.fillStyle = mouth;
  g.fillRect(left, top, wide, tall);

  // The extra forge either side, so a player flying off the arena stays in view against something.
  if (view.l < -40) {
    lavaFall(g, view, -74, 24);
    lavaFall(g, view, W + 50, 24);
  }
  jaggedBand(g, r, view, false, 190, 64, '#2b1711');
  jaggedBand(g, r, view, false, 110, 44, '#1e100c');
  jaggedBand(g, r, view, true, 86, 52, '#120b08');

  pillar(g, view, 0, 30);
  pillar(g, view, W - 30, 30);
  for (const x of [300, 660]) chain(g, x, view.t, 70);
  banner(g, 300, 62, 112);
  banner(g, 660, 62, 112);
  for (const pl of platforms) {
    if (pl.y < 200) {
      chain(g, pl.x + 24, view.t, pl.y);
      chain(g, pl.x + pl.w - 24, view.t, pl.y);
    }
  }

  // Keep the fighting area calm, so characters and platforms stay the brightest things in it.
  const calm = g.createLinearGradient(0, 30, 0, 470);
  calm.addColorStop(0, 'rgba(14,8,6,0)');
  calm.addColorStop(0.2, 'rgba(14,8,6,.26)');
  calm.addColorStop(0.8, 'rgba(14,8,6,.26)');
  calm.addColorStop(1, 'rgba(14,8,6,0)');
  g.fillStyle = calm;
  g.fillRect(left, 30, wide, 440);
}

// ---------- The Drift: VI's home, a purple void where everything floats ----------

// A lump of rock, flat on top, jagged below, hanging in the air.
function rockShape(g, x, y, w, depth, r) {
  const parts = Math.max(3, Math.round(w / 22));
  g.moveTo(x, y);
  g.lineTo(x + w, y);
  for (let i = parts; i >= 0; i--) {
    const px = x + (w * i) / parts;
    const edge = 1 - Math.abs(i / parts - 0.5) * 2;
    g.lineTo(px, y + 5 + depth * edge * (0.5 + r() * 0.6) + (i % 2 ? 0 : -depth * 0.14));
  }
  g.closePath();
}

function crystal(g, x, y, h, lean, fill) {
  outlined(g, fill, () => {
    g.moveTo(x - h * 0.22, y);
    g.lineTo(x - h * 0.2 + lean * 0.4, y - h * 0.62);
    g.lineTo(x + lean, y - h);
    g.lineTo(x + h * 0.2 + lean * 0.4, y - h * 0.62);
    g.lineTo(x + h * 0.22, y);
    g.closePath();
  }, 1.8);
  g.fillStyle = 'rgba(255,255,255,.5)';
  g.beginPath();
  g.moveTo(x - h * 0.1, y - 2);
  g.lineTo(x - h * 0.08 + lean * 0.5, y - h * 0.6);
  g.lineTo(x + lean, y - h * 0.94);
  g.closePath();
  g.fill();
}

// A marble column broken off at both ends, and left drifting.
function brokenColumn(g, x, y, w, h, tilt) {
  g.save();
  g.translate(x, y);
  g.rotate(tilt);
  const body = g.createLinearGradient(-w / 2, 0, w / 2, 0);
  body.addColorStop(0, '#5c4d86');
  body.addColorStop(0.45, '#a699cf');
  body.addColorStop(1, '#46386f');
  outlined(g, body, () => {
    g.moveTo(-w / 2, -h / 2 + 4);
    g.lineTo(-w / 6, -h / 2);
    g.lineTo(w / 5, -h / 2 + 7);
    g.lineTo(w / 2, -h / 2 + 2);
    g.lineTo(w / 2, h / 2 - 3);
    g.lineTo(w / 8, h / 2 + 3);
    g.lineTo(-w / 4, h / 2 - 5);
    g.lineTo(-w / 2, h / 2);
    g.closePath();
  }, 2);
  g.strokeStyle = 'rgba(30,18,60,.5)';
  g.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) {
    g.beginPath();
    g.moveTo(-w / 2 + (w * i) / 4, -h / 2 + 8);
    g.lineTo(-w / 2 + (w * i) / 4, h / 2 - 8);
    g.stroke();
  }
  g.restore();
}

// Upside-down spires of a palace, hanging far off in the void.
function spire(g, x, top, w, h, color, windows) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x - w / 2, top);
  g.lineTo(x + w / 2, top);
  g.lineTo(x + w * 0.3, top + h * 0.5);
  g.lineTo(x, top + h);
  g.lineTo(x - w * 0.3, top + h * 0.5);
  g.closePath();
  g.fill();
  g.fillStyle = windows;
  for (let y = top + 12; y < top + h * 0.56; y += 16) g.fillRect(x - 1.5, y, 3, 7);
}

function driftBackdrop(g, view, r, left, top, wide, tall) {
  const sky = g.createLinearGradient(0, top, 0, H);
  sky.addColorStop(0, '#0a0418');
  sky.addColorStop(0.4, '#1f0b42');
  sky.addColorStop(0.72, '#3d1672');
  sky.addColorStop(1, '#6a2cb0');
  g.fillStyle = sky;
  g.fillRect(left, top, wide, tall);

  // Clouds of colour in the void.
  for (const [x, y, rad, color] of [
    [W * 0.15, 150, 300, 'rgba(120,50,200,.3)'],
    [W * 0.88, 260, 340, 'rgba(180,70,210,.2)'],
    [W * 0.5, 450, 420, 'rgba(150,80,240,.26)'],
    [W * 0.42, 40, 240, 'rgba(70,50,190,.22)'],
  ]) {
    const cloud = g.createRadialGradient(x, y, 0, x, y, rad);
    cloud.addColorStop(0, color);
    cloud.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = cloud;
    g.fillRect(left, top, wide, tall);
  }
  for (let i = 0; i < wide / 8; i++) {
    g.fillStyle = `rgba(235,220,255,${0.2 + r() * 0.7})`;
    const size = r() < 0.12 ? 2.4 : 1.2;
    g.fillRect(left + r() * wide, top + r() * (tall * 0.8), size, size);
  }

  // VI's palace, far away and upside down, hanging out of the dark at the top.
  for (const [x, w, h] of [[120, 54, 170], [190, 34, 110], [58, 30, 96], [810, 60, 190], [880, 36, 120], [742, 30, 100], [-120, 44, 130], [W + 120, 44, 140]]) spire(g, x, top, w, h + (view.t - top), '#1a0a36', 'rgba(220,170,255,.55)');

  // The great ring behind the middle island: the eye of the place.
  const cx = W / 2;
  const cy = 262;
  const halo = g.createRadialGradient(cx, cy, 40, cx, cy, 250);
  halo.addColorStop(0, 'rgba(190,120,255,.42)');
  halo.addColorStop(0.55, 'rgba(120,60,220,.16)');
  halo.addColorStop(1, 'rgba(120,60,220,0)');
  g.fillStyle = halo;
  g.fillRect(cx - 260, cy - 260, 520, 520);
  for (const [rad, width, color] of [
    [176, 13, '#2a1250'],
    [176, 7, '#7a48c8'],
    [176, 2, '#e6d0ff'],
    [130, 3, 'rgba(199,156,255,.55)'],
  ]) {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.beginPath();
    g.arc(cx, cy, rad, 0, Math.PI * 2);
    g.stroke();
  }
  // Runes around the ring, in shapes of our own.
  g.fillStyle = '#e6d0ff';
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 + 0.26;
    g.save();
    g.translate(cx + Math.cos(a) * 153, cy + Math.sin(a) * 153);
    g.rotate(a + Math.PI / 2);
    g.fillRect(-1.2, -6, 2.4, 12);
    g.fillRect(-5, i % 2 ? -6 : 3, 10, 2.4);
    g.restore();
  }

  // Far rubble, dim and small, then nearer pieces of the old city that VI keeps in the air.
  for (let i = 0; i < 26; i++) {
    const x = left + r() * wide;
    const y = 30 + r() * 420;
    const w = 8 + r() * 26;
    g.fillStyle = r() < 0.5 ? '#2a1454' : '#361b66';
    g.beginPath();
    rockShape(g, x, y, w, w * 0.5, r);
    g.fill();
  }
  for (const [x, y, w, h, tilt] of [[305, 100, 24, 72, 0.4], [655, 92, 22, 62, -0.5], [20, 130, 26, 80, -0.2], [940, 110, 26, 82, 0.3], [330, 470, 20, 54, 1], [640, 472, 22, 58, -1.1], [-70, 300, 26, 90, 0.2], [1030, 320, 26, 90, -0.3]]) brokenColumn(g, x, y, w, h, tilt);

  // Thin threads of her power, running from island to island around the ring.
  g.setLineDash([3, 7]);
  g.strokeStyle = 'rgba(214,179,255,.5)';
  g.lineWidth = 1.5;
  g.beginPath();
  for (const [x0, y0, x1, y1] of [[255, 345, 105, 270], [705, 345, 855, 270], [105, 270, 255, 195], [855, 270, 705, 195], [255, 195, 400, 120], [705, 195, 560, 120], [255, 345, 400, 420], [705, 345, 560, 420], [480, 270, 480, 420], [480, 270, 480, 120]]) {
    g.moveTo(x0, y0 + 14);
    g.lineTo(x1, y1 + 14);
  }
  g.stroke();
  g.setLineDash([]);

  // Calm over the middle, so the fighters stay the brightest things in it.
  g.fillStyle = 'rgba(10,3,24,.2)';
  g.fillRect(left, 40, wide, 430);
}

function islandPlatform(g, pl, r) {
  const { x, y, w } = pl;
  const depth = Math.min(62, 22 + w * 0.13);
  // Bits that have broken off and hang underneath.
  for (let i = 0; i < 3; i++) {
    const bx = x + w * (0.2 + i * 0.3) + (r() - 0.5) * 16;
    const by = y + depth + 10 + r() * 16;
    const size = 6 + r() * 7;
    outlined(g, '#2e1a56', () => rockShape(g, bx, by, size, size * 0.7, r), 1.6);
  }
  const rock = g.createLinearGradient(0, y, 0, y + depth);
  rock.addColorStop(0, '#5d4596');
  rock.addColorStop(1, '#22123f');
  outlined(g, rock, () => rockShape(g, x + 3, y + 2, w - 6, depth, r), 2.5);
  // Cracks that catch her light.
  g.strokeStyle = 'rgba(214,179,255,.55)';
  g.lineWidth = 1.4;
  for (let i = 0; i < w / 42; i++) {
    const cx = x + 18 + r() * (w - 36);
    g.beginPath();
    g.moveTo(cx, y + 12);
    g.lineTo(cx + (r() - 0.5) * 12, y + 19 + r() * 7);
    g.lineTo(cx + (r() - 0.5) * 16, y + 26 + r() * 10);
    g.stroke();
  }
  // Crystals growing from the underside.
  for (let i = 0; i < w / 60; i++) {
    const cx = x + w * 0.2 + r() * w * 0.6;
    g.save();
    g.translate(cx, y + depth * 0.55);
    g.scale(1, -1);
    crystal(g, 0, 0, 9 + r() * 9, (r() - 0.5) * 5, '#b98cf5');
    g.restore();
  }
  // The walkable top, the brightest line in the picture.
  const top = g.createLinearGradient(0, y - 1, 0, y + 11);
  top.addColorStop(0, '#fffaff');
  top.addColorStop(0.4, '#d9bcff');
  top.addColorStop(1, '#7c4cc8');
  outlined(g, top, () => g.roundRect(x, y - 1, w, 11, 5), 2.5);
  // Small crystals standing at each end, not in the way of anyone's feet.
  crystal(g, x + 9, y, 15, -2, '#c79cff');
  crystal(g, x + w - 9, y, 17, 2, '#c79cff');
  crystal(g, x + 19, y, 8, 1, '#e6d0ff');
}

// ---------- Hidden Dojo: a ninja hideout over still water, at night ----------

function bamboo(g, x, top, bottom, w, color, joint) {
  g.fillStyle = color;
  g.fillRect(x, top, w, bottom - top);
  g.fillStyle = joint;
  for (let y = top + ((x * 7) % 40); y < bottom; y += 42) g.fillRect(x - 0.8, y, w + 1.6, 2.4);
}

// A curved roof with turned-up corners, seen from the side.
function roof(g, x, y, w, h, fill) {
  outlined(g, fill, () => {
    g.moveTo(x - 14, y - 7);
    g.quadraticCurveTo(x + 2, y + 1, x + w * 0.16, y - h * 0.5);
    g.quadraticCurveTo(x + w / 2, y - h * 1.3, x + w * 0.84, y - h * 0.5);
    g.quadraticCurveTo(x + w - 2, y + 1, x + w + 14, y - 7);
    g.quadraticCurveTo(x + w / 2, y + 8, x - 14, y - 7);
    g.closePath();
  }, 2.5);
}

function lantern(g, x, y, size) {
  g.fillStyle = 'rgba(255,170,70,.16)';
  g.beginPath();
  g.arc(x, y, size * 3, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 1.8;
  g.beginPath();
  g.moveTo(x, y - size * 2.2);
  g.lineTo(x, y - size);
  g.stroke();
  outlined(g, '#d8341f', () => g.ellipse(x, y, size, size * 1.15, 0, 0, Math.PI * 2), 2);
  g.fillStyle = '#ffb648';
  g.beginPath();
  g.ellipse(x, y, size * 0.5, size * 0.95, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = INK;
  g.fillRect(x - size * 0.55, y - size * 1.22, size * 1.1, size * 0.28);
  g.fillRect(x - size * 0.55, y + size * 0.94, size * 1.1, size * 0.28);
}

// A lit paper window, seen in the wall behind the fighting.
function litWindow(g, x, y, w, h) {
  const glow = g.createLinearGradient(0, y, 0, y + h);
  glow.addColorStop(0, '#e8b35e');
  glow.addColorStop(1, '#b57a32');
  g.fillStyle = glow;
  g.fillRect(x, y, w, h);
  g.strokeStyle = '#3a2412';
  g.lineWidth = 1.6;
  g.beginPath();
  for (let i = 0; i <= 4; i++) {
    g.moveTo(x + (w * i) / 4, y);
    g.lineTo(x + (w * i) / 4, y + h);
  }
  for (let i = 0; i <= 3; i++) {
    g.moveTo(x, y + (h * i) / 3);
    g.lineTo(x + w, y + (h * i) / 3);
  }
  g.stroke();
}

function dojoBackdrop(g, view, r, left, top, wide, tall, map) {
  const sky = g.createLinearGradient(0, top, 0, H);
  sky.addColorStop(0, '#060a1c');
  sky.addColorStop(0.5, '#142440');
  sky.addColorStop(0.82, '#274a62');
  sky.addColorStop(1, '#3d6b7e');
  g.fillStyle = sky;
  g.fillRect(left, top, wide, tall);
  for (let i = 0; i < wide / 14; i++) {
    g.fillStyle = `rgba(225,235,255,${0.2 + r() * 0.6})`;
    g.fillRect(left + r() * wide, top + r() * 200, 1.4, 1.4);
  }

  // A pale moon with a haze round it, off to one side, and thin bars of cloud over it.
  const mx = 618;
  const my = 66;
  const haze = g.createRadialGradient(mx, my, 40, mx, my, 210);
  haze.addColorStop(0, 'rgba(230,240,255,.3)');
  haze.addColorStop(1, 'rgba(230,240,255,0)');
  g.fillStyle = haze;
  g.fillRect(mx - 210, my - 210, 420, 420);
  g.fillStyle = '#f2f1dc';
  g.beginPath();
  g.arc(mx, my, 48, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(190,195,180,.5)';
  for (const [x, y, s] of [[-14, -12, 9], [11, 6, 13], [-17, 17, 6], [20, -20, 5]]) {
    g.beginPath();
    g.arc(mx + x, my + y, s, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(16,28,54,.82)';
  for (const [x, y, w, h] of [[mx - 96, my + 20, 170, 5], [mx - 40, my + 32, 150, 4], [mx - 130, my - 18, 100, 4], [300, 60, 150, 5], [250, 76, 120, 4]]) {
    g.beginPath();
    g.roundRect(x, y, w, h, h / 2);
    g.fill();
  }

  // Layered mountains fading into the mist.
  for (const [base, peak, color] of [
    [330, 150, '#1c3350'],
    [390, 110, '#16293f'],
  ]) {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(left, H + SHAKE_ROOM);
    let x = left;
    while (x < left + wide + 120) {
      const rise = base - peak * (0.35 + r() * 0.65);
      g.lineTo(x + 60, rise);
      g.lineTo(x + 120, base - r() * 20);
      x += 120;
    }
    g.lineTo(x, H + SHAKE_ROOM);
    g.closePath();
    g.fill();
  }

  // Bamboo groves to either side, deep then nearer.
  for (const [count, w, color, joint] of [
    [46, 6, '#16343c', '#0e252c'],
    [30, 9, '#1b4a44', '#113430'],
  ]) {
    for (let i = 0; i < count; i++) {
      const side = i % 2;
      const x = side ? W * 0.72 + r() * (left + wide - W * 0.72) : left + r() * (W * 0.28 - left);
      bamboo(g, x, top, H + SHAKE_ROOM, w, color, joint);
      if (r() < 0.7) {
        g.fillStyle = color;
        for (let k = 0; k < 4; k++) {
          const ly = 40 + r() * 340;
          g.beginPath();
          g.ellipse(x + (side ? -13 : 13), ly, 14, 3, side ? 0.4 : -0.4, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
  }

  // A red gate standing in the water, far behind the middle of the arena.
  const gx = W / 2;
  outlined(g, '#6e1a14', () => g.roundRect(gx - 118, 318, 16, 180, 3), 2);
  outlined(g, '#6e1a14', () => g.roundRect(gx + 102, 318, 16, 180, 3), 2);
  outlined(g, '#7e201a', () => g.roundRect(gx - 136, 344, 272, 11, 3), 2);
  outlined(g, '#8a241c', () => {
    g.moveTo(gx - 160, 304);
    g.quadraticCurveTo(gx, 322, gx + 160, 304);
    g.lineTo(gx + 150, 324);
    g.quadraticCurveTo(gx, 338, gx - 150, 324);
    g.closePath();
  }, 2);

  // The hideout: dark timber walls behind every floor, with lit paper windows in them, and pillars between the rows.
  const { platforms: floors } = map;
  const wall = '#1f1a22';
  const blocks = [
    [50, 345, 280, 75],
    [630, 345, 280, 75],
    [240, 195, 480, 75],
    [110, 120, 170, 75],
    [680, 120, 170, 75],
  ];
  for (const [x, y, w, h] of blocks) {
    g.fillStyle = wall;
    g.fillRect(x + 8, y, w - 16, h);
    g.fillStyle = 'rgba(70,52,40,.5)';
    for (let bx = x + 14; bx < x + w - 10; bx += 11) g.fillRect(bx, y, 1.6, h);
    const panes = Math.floor((w - 24) / 66);
    for (let i = 0; i < panes; i++) litWindow(g, x + 20 + i * ((w - 40) / panes), y + 16, 44, 40);
  }
  for (const [x, y0, y1] of [[120, 345, 495], [260, 345, 495], [700, 345, 495], [840, 345, 495], [300, 270, 495], [660, 270, 495], [160, 195, 345], [800, 195, 345]]) {
    const side = g.createLinearGradient(x, 0, x + 12, 0);
    side.addColorStop(0, '#2a1a12');
    side.addColorStop(0.5, '#5c3a22');
    side.addColorStop(1, '#22150e');
    g.fillStyle = side;
    g.fillRect(x, y0, 12, y1 - y0);
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.strokeRect(x, y0, 12, y1 - y0);
  }

  // The little hall at the summit, under its own roof.
  g.fillStyle = wall;
  g.fillRect(388, 72, 184, 48);
  litWindow(g, 420, 80, 120, 32);
  for (const x of [380, 568]) {
    g.fillStyle = '#5c3a22';
    g.fillRect(x, 66, 12, 54);
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.strokeRect(x, 66, 12, 54);
  }

  // Curved tile roofs over the two high wings and the summit.
  for (const pl of floors.filter((f) => f.y === 195)) roof(g, pl.x, pl.y - 66, pl.w, 26, '#28344c');
  roof(g, 376, 74, 208, 30, '#2e3c58');
  outlined(g, GOLD, () => g.arc(480, 46, 5, 0, Math.PI * 2), 1.8);

  // Lanterns under the eaves.
  for (const [x, y] of [[300, 300], [660, 300], [480, 300], [176, 228], [784, 228], [176, 376], [784, 376], [480, 450]]) lantern(g, x, y, 8);

  // A clan banner of our own: a white circle on deep red.
  for (const x of [196, 764]) {
    outlined(g, '#7a1626', () => {
      g.moveTo(x - 20, 124);
      g.lineTo(x + 20, 124);
      g.lineTo(x + 20, 182);
      g.lineTo(x, 172);
      g.lineTo(x - 20, 182);
      g.closePath();
    }, 2);
    g.strokeStyle = '#f7ecd2';
    g.lineWidth = 3.4;
    g.beginPath();
    g.arc(x, 146, 10, 0.4, Math.PI * 1.9);
    g.stroke();
  }

  // The sliding doors, standing on their floors.
  for (const d of map.doors) slidingDoor(g, d.x, d.y);

  // Mist along the water.
  const mist = g.createLinearGradient(0, 400, 0, 495);
  mist.addColorStop(0, 'rgba(180,215,225,0)');
  mist.addColorStop(1, 'rgba(180,215,225,.2)');
  g.fillStyle = mist;
  g.fillRect(left, 400, wide, 95);
}

// A tall sliding door, standing a little open, with warm light behind it.
function slidingDoor(g, x, y) {
  const w = 42;
  const h = 62;
  outlined(g, '#3e2614', () => g.roundRect(x - w / 2 - 5, y - h - 7, w + 10, h + 7, 3), 2.5);
  const light = g.createLinearGradient(0, y - h, 0, y);
  light.addColorStop(0, '#ffe2a0');
  light.addColorStop(1, '#ffb648');
  g.fillStyle = light;
  g.fillRect(x - w / 2, y - h, w, h);
  // The panel, slid partway across the light.
  g.fillStyle = '#f7ecd2';
  g.fillRect(x - w / 2, y - h, w * 0.58, h);
  g.strokeStyle = '#3e2614';
  g.lineWidth = 1.8;
  g.beginPath();
  for (let i = 0; i <= 3; i++) {
    g.moveTo(x - w / 2 + (w * 0.58 * i) / 3, y - h);
    g.lineTo(x - w / 2 + (w * 0.58 * i) / 3, y);
  }
  for (let i = 1; i < 4; i++) {
    g.moveTo(x - w / 2, y - h + (h * i) / 4);
    g.lineTo(x - w / 2 + w * 0.58, y - h + (h * i) / 4);
  }
  g.stroke();
  // Lintel with the clan's mark, so a door reads as a door from across the arena.
  outlined(g, '#7e201a', () => g.roundRect(x - w / 2 - 9, y - h - 13, w + 18, 9, 3), 2);
  g.fillStyle = CREAM;
  g.beginPath();
  g.arc(x, y - h - 8.5, 2.6, 0, Math.PI * 2);
  g.fill();
}

function dojoPlatform(g, pl, r) {
  const { x, y, w } = pl;
  const depth = 24;
  // A red-lacquered beam underneath, with blue roof tiles curling along its lower edge.
  const beam = g.createLinearGradient(0, y, 0, y + depth);
  beam.addColorStop(0, '#9c2a1c');
  beam.addColorStop(1, '#4e120c');
  outlined(g, beam, () => {
    g.moveTo(x - 6, y + 6);
    g.lineTo(x + w + 6, y + 6);
    g.lineTo(x + w - 4, y + depth);
    g.lineTo(x + 4, y + depth);
    g.closePath();
  }, 2.5);
  for (let tx = x + 4; tx < x + w - 6; tx += 15) {
    outlined(g, tx % 2 ? '#3a4d6e' : '#2e3f5c', () => g.arc(tx + 7, y + depth, 7, 0, Math.PI), 1.6);
  }
  // Gold studs along the beam.
  g.fillStyle = GOLD;
  for (let sx = x + 14; sx < x + w - 8; sx += 34) {
    g.beginPath();
    g.arc(sx, y + 14, 1.8, 0, Math.PI * 2);
    g.fill();
  }
  // Dark polished boards on top, with their seams.
  const board = g.createLinearGradient(0, y, 0, y + 10);
  board.addColorStop(0, CREAM);
  board.addColorStop(0.35, '#e0b878');
  board.addColorStop(1, '#8a5a30');
  outlined(g, board, () => g.roundRect(x - 3, y - 1, w + 6, 10, 3), 2.5);
  g.strokeStyle = 'rgba(60,32,12,.6)';
  g.lineWidth = 1.2;
  g.beginPath();
  for (let bx = x + 12 + r() * 20; bx < x + w - 6; bx += 30 + r() * 26) {
    g.moveTo(bx, y + 2);
    g.lineTo(bx, y + 8);
  }
  g.stroke();
  // Turned-up gold ends, like the corners of a temple roof.
  for (const dir of [-1, 1]) {
    const ex = dir < 0 ? x - 4 : x + w + 4;
    outlined(g, GOLD, () => {
      g.moveTo(ex, y + 1);
      g.quadraticCurveTo(ex + dir * 9, y + 2, ex + dir * 10, y - 8);
      g.quadraticCurveTo(ex + dir * 4, y - 3, ex - dir * 2, y + 8);
      g.closePath();
    }, 1.8);
  }
}

// A paper screen on a wooden frame. Each stage shows more holes, and the last is only the bare frame.
const screenSprite = (hp) =>
  sprite(`screen${hp}`, [-SCREEN_W / 2 - 6, -SCREEN_H - 6, SCREEN_W + 12, SCREEN_H + 8], (g) => {
    const half = SCREEN_W / 2;
    if (hp > 0) {
      const paper = g.createLinearGradient(-half, 0, half, 0);
      paper.addColorStop(0, '#d8c79f');
      paper.addColorStop(0.5, '#fbf3dc');
      paper.addColorStop(1, '#d8c79f');
      g.fillStyle = paper;
      g.fillRect(-half, -SCREEN_H, SCREEN_W, SCREEN_H);
      // Tears and scorch marks as it takes shots.
      g.fillStyle = 'rgba(20,18,26,.9)';
      if (hp < SCREEN_HP) {
        g.beginPath();
        g.moveTo(-half, -44);
        g.lineTo(2, -39);
        g.lineTo(-3, -33);
        g.lineTo(-half, -30);
        g.closePath();
        g.fill();
      }
      if (hp < SCREEN_HP - 1) {
        g.beginPath();
        g.moveTo(half, -22);
        g.lineTo(-2, -19);
        g.lineTo(3, -11);
        g.lineTo(half, -8);
        g.closePath();
        g.fill();
      }
    }
    // The frame and its crosspieces are always there.
    g.strokeStyle = INK;
    g.lineWidth = 2.2;
    g.strokeRect(-half, -SCREEN_H, SCREEN_W, SCREEN_H);
    g.strokeStyle = '#5c3a22';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, -SCREEN_H);
    g.lineTo(0, 0);
    for (let i = 1; i < 5; i++) {
      g.moveTo(-half, -SCREEN_H + (SCREEN_H * i) / 5);
      g.lineTo(half, -SCREEN_H + (SCREEN_H * i) / 5);
    }
    g.stroke();
    outlined(g, '#6e4426', () => g.roundRect(-half - 3, -SCREEN_H - 4, SCREEN_W + 6, 5, 1.5), 1.8);
    outlined(g, '#6e4426', () => g.roundRect(-half - 3, -2.5, SCREEN_W + 6, 4, 1.5), 1.8);
  });

export function drawScreens(g, map, hps) {
  const screens = MAPS[map].screens;
  if (!screens) return;
  for (let i = 0; i < screens.length; i++) stamp(g, screenSprite(Math.max(0, Math.ceil(hps?.[i] ?? SCREEN_HP))), screens[i].x, screens[i].y);
}

// view = the part of the world on screen: l, t, w, h. It always covers the whole arena, and more on wide screens.
export function bakeArena(view, q, map = 0) {
  const c = document.createElement('canvas');
  c.width = Math.round((view.w + SHAKE_ROOM * 2) * q);
  c.height = Math.round((view.h + SHAKE_ROOM * 2) * q);
  const g = c.getContext('2d', { alpha: false });
  g.scale(q, q);
  g.translate(SHAKE_ROOM - view.l, SHAKE_ROOM - view.t);
  const r = seeded(4217 + map * 991);
  const left = view.l - SHAKE_ROOM;
  const top = view.t - SHAKE_ROOM;
  const wide = view.w + SHAKE_ROOM * 2;
  const tall = view.h + SHAKE_ROOM * 2;
  const { platforms } = MAPS[map];
  if (map === 1) {
    forestBackdrop(g, view, r, left, top, wide, tall);
    forestFrame(g, platforms, r);
    for (const pl of platforms) logPlatform(g, pl, r);
  } else if (map === 2) {
    sunBackdrop(g, view, r, left, top, wide, tall, platforms);
    for (const pl of platforms) stepPlatform(g, pl);
  } else if (map === 3) {
    driftBackdrop(g, view, r, left, top, wide, tall);
    for (const pl of platforms) islandPlatform(g, pl, r);
  } else if (map === 4) {
    dojoBackdrop(g, view, r, left, top, wide, tall, MAPS[map]);
    for (const pl of platforms) dojoPlatform(g, pl, r);
  } else if (map === 5) {
    hollowBackdrop(g, view, r, left, top, wide, tall);
    for (const pl of platforms) plankPlatform(g, pl, r);
  } else if (map === 6) {
    groveBackdrop(g, view, r, left, top, wide, tall);
    for (const pl of platforms) slabPlatform(g, pl, r);
  } else {
    forgeBackdrop(g, view, r, left, top, wide, tall, platforms);
    for (const pl of platforms) platform(g, pl, r);
  }
  return c;
}

// A small picture of a map for the map tab, hazard and all. Drawn once.
export function drawMapThumb(canvas, map) {
  const box = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(box.width));
  canvas.height = Math.max(1, Math.round(box.height));
  const view = { l: -70, t: 0, w: 1100, h: 540 };
  const q = Math.max(canvas.width / view.w, canvas.height / view.h);
  const g = canvas.getContext('2d');
  g.drawImage(bakeArena(view, Math.min(1, q * 2), map), (canvas.width - (view.w + SHAKE_ROOM * 2) * q) / 2, canvas.height - (view.h + SHAKE_ROOM * 2) * q, (view.w + SHAKE_ROOM * 2) * q, (view.h + SHAKE_ROOM * 2) * q);
  g.fillStyle = HAZARD_THUMB[map];
  g.fillRect(0, (LAVA_Y + SHAKE_ROOM) * q + (canvas.height - (view.h + SHAKE_ROOM * 2) * q), canvas.width, canvas.height);
  if (MAPS[map].screens) {
    g.save();
    g.translate((canvas.width - (view.w + SHAKE_ROOM * 2) * q) / 2 + (SHAKE_ROOM - view.l) * q, canvas.height - (view.h + SHAKE_ROOM * 2) * q + (SHAKE_ROOM - view.t) * q);
    g.scale(q, q);
    drawScreens(g, map);
    g.restore();
  }
}

// ---------- Hunter's Hollow: an autumn wood at last light, with hunters' walkways on stilts over a bog ----------

// A jagged line of far pines, filled down to the floor.
function pineLine(g, r, left, wide, base, height, step, color) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(left, H + SHAKE_ROOM);
  g.lineTo(left, base);
  for (let x = left; x < left + wide + step; ) {
    const across = step * (0.55 + r() * 0.9);
    const tall = height * (0.55 + r() * 0.6);
    g.lineTo(x + across * 0.5, base - tall);
    g.lineTo(x + across, base - tall * 0.12);
    x += across;
  }
  g.lineTo(left + wide + step, H + SHAKE_ROOM);
  g.closePath();
  g.fill();
}

// A hide stretched on a pole frame, the way a hunters' camp dries them.
function hideRack(g, x, y, size) {
  g.strokeStyle = '#120a05';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(x - size * 0.75, y);
  g.lineTo(x - size * 0.45, y - size * 1.5);
  g.moveTo(x + size * 0.75, y);
  g.lineTo(x + size * 0.45, y - size * 1.5);
  g.moveTo(x - size * 0.65, y - size * 1.32);
  g.lineTo(x + size * 0.65, y - size * 1.32);
  g.stroke();
  g.fillStyle = '#2a170b';
  g.beginPath();
  g.moveTo(x - size * 0.42, y - size * 1.24);
  g.quadraticCurveTo(x, y - size * 1.1, x + size * 0.42, y - size * 1.24);
  g.quadraticCurveTo(x + size * 0.3, y - size * 0.75, x + size * 0.36, y - size * 0.3);
  g.quadraticCurveTo(x, y - size * 0.46, x - size * 0.36, y - size * 0.3);
  g.quadraticCurveTo(x - size * 0.3, y - size * 0.75, x - size * 0.42, y - size * 1.24);
  g.fill();
}

function hollowBackdrop(g, view, r, left, top, wide, tall) {
  const sky = g.createLinearGradient(0, top, 0, H);
  sky.addColorStop(0, '#170d07');
  sky.addColorStop(0.34, '#4f2a10');
  sky.addColorStop(0.6, '#b4641c');
  sky.addColorStop(0.78, '#e39a38');
  sky.addColorStop(1, '#6b3714');
  g.fillStyle = sky;
  g.fillRect(left, top, wide, tall);

  pineLine(g, r, left, wide, 400, 150, 58, '#a65c20');
  // Low mist sits between the rows of trees, so the far ones stay pale.
  g.fillStyle = 'rgba(255,210,140,.11)';
  for (let x = left; x < left + wide; x += 260) {
    g.beginPath();
    g.ellipse(x + r() * 130, 385 + r() * 30, 190, 24, 0, 0, Math.PI * 2);
    g.fill();
  }
  pineLine(g, r, left, wide, 435, 190, 84, '#6b3815');
  pineLine(g, r, left, wide, 470, 230, 126, '#361b0b');

  // Great black trunks up close. They're the darkest thing here, so the pale decks stand out against them.
  for (let x = left - 40; x < left + wide + 40; x += 150 + r() * 150) trunk(g, x, 34 + r() * 44, top, H + SHAKE_ROOM, '#25160c', '#0c0704', r);
  for (let x = left + 90; x < left + wide; x += 340 + r() * 280) hideRack(g, x, 492, 42 + r() * 18);

  // The canopy: rust and gold leaves, dark at the top.
  for (let x = left - 30; x < left + wide + 60; x += 66) leaves(g, r, x, view.t + 18, 130, 4, 40, ['#170d07', '#2c1508']);
  for (let x = left - 30; x < left + wide + 60; x += 74) leaves(g, r, x, view.t + 62 + r() * 28, 130, 4, 24, ['#5a2a0c', '#9a4f18', '#d98a2a']);
  // Leaves on their way down.
  for (let i = 0; i < wide / 26; i++) {
    g.fillStyle = ['#e0a24a', '#c56a1e', '#8f4414'][Math.floor(r() * 3)];
    g.beginPath();
    g.ellipse(left + r() * wide, view.t + 100 + r() * (440 - view.t - 100), 4 + r() * 2.5, 2, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  // Reeds along the edge of the bog.
  g.lineWidth = 2.5;
  for (let x = left; x < left + wide; x += 16 + r() * 22) {
    const lean = (r() - 0.5) * 12;
    const up = 24 + r() * 34;
    g.strokeStyle = r() < 0.5 ? '#2a1a0b' : '#46280f';
    g.beginPath();
    g.moveTo(x, 500);
    g.quadraticCurveTo(x, 500 - up * 0.6, x + lean, 500 - up);
    g.stroke();
  }
}

// A hunter's walkway: sawn planks lashed to poles, nothing like the forest's mossy logs.
function plankPlatform(g, pl, r, posts = 30) {
  const { x, y, w } = pl;
  const depth = 14;
  const spots = w > 240 ? [x + 16, x + w / 2, x + w - 16] : [x + 16, x + w - 16];
  for (const px of spots) {
    outlined(g, '#3a2210', () => g.rect(px - 4.5, y + depth - 2, 9, posts), 2);
    g.fillStyle = 'rgba(255,220,160,.2)';
    g.fillRect(px - 2.5, y + depth, 2, posts - 4);
  }
  const wood = g.createLinearGradient(0, y, 0, y + depth);
  wood.addColorStop(0, '#c08a48');
  wood.addColorStop(1, '#6a3f1c');
  g.beginPath();
  g.roundRect(x, y, w, depth, 3);
  g.fillStyle = wood;
  g.fill();
  g.save();
  g.clip();
  g.fillStyle = 'rgba(40,20,6,.75)';
  for (let px = x + 10 + r() * 12; px < x + w - 6; px += 16 + r() * 10) g.fillRect(px, y, 2, depth);
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.stroke();
  // What you stand on is the brightest line in the picture.
  g.fillStyle = '#f7e2ac';
  g.fillRect(x + 3, y + 1.2, w - 6, 2.6);
  // Rope lashings over each pole.
  for (const px of spots) {
    outlined(g, '#e6cf96', () => g.roundRect(px - 7, y + 2.5, 14, depth - 1, 2), 1.5);
    g.strokeStyle = 'rgba(90,60,20,.75)';
    g.lineWidth = 1.2;
    g.beginPath();
    for (const dy of [6, 9.5, 13]) {
      g.moveTo(px - 6, y + dy);
      g.lineTo(px + 6, y + dy);
    }
    g.stroke();
  }
}

// ---------- Mossback's Grove: deep jungle, old stone, and moss over all of it ----------

// A shaggy edge of moss hanging down from a top line, which stays the brightest thing so you can see where to stand.
function mossDrape(g, x, y, w, r, deep = 9) {
  const fill = g.createLinearGradient(0, y, 0, y + deep + 6);
  fill.addColorStop(0, '#8ccf4c');
  fill.addColorStop(1, '#2f6b2a');
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + w, y);
  for (let px = x + w; px > x; ) {
    const across = Math.min(px - x, 7 + r() * 11);
    g.quadraticCurveTo(px - across / 2, y + deep * (0.5 + r() * 0.9) + 3, px - across, y + 3 + r() * 3);
    px -= across;
  }
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = '#dcf79c';
  g.fillRect(x + 3, y + 1.1, w - 6, 2.6);
}

function hangingVine(g, x, y, long, r) {
  const sway = (r() - 0.5) * 12;
  g.strokeStyle = INK;
  g.lineWidth = 3.2;
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x + sway, y + long / 2, x + sway * 0.4, y + long);
  g.stroke();
  g.strokeStyle = '#4f9a36';
  g.lineWidth = 1.5;
  g.stroke();
  g.fillStyle = '#6fb84a';
  for (let i = 8; i < long; i += 11 + r() * 8) {
    const t = i / long;
    g.beginPath();
    g.ellipse(x + sway * t * (2 - t) * 0.72 + (i % 2 ? 3 : -3), y + i, 3.1, 1.8, i % 2 ? 0.5 : -0.5, 0, Math.PI * 2);
    g.fill();
  }
}

// Mossback's land is marked with these: an old stone post, carved with his branching horns.
function paintIdol(g) {
  for (const dir of [-1, 1]) {
    g.strokeStyle = INK;
    g.lineWidth = 8;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(dir * 10, -96);
    g.lineTo(dir * 26, -124);
    g.moveTo(dir * 20, -112);
    g.lineTo(dir * 38, -114);
    g.moveTo(dir * 24, -120);
    g.lineTo(dir * 18, -136);
    g.stroke();
    g.strokeStyle = '#8c9384';
    g.lineWidth = 4.6;
    g.stroke();
    g.lineCap = 'butt';
  }
  const stone = g.createLinearGradient(-24, 0, 24, 0);
  stone.addColorStop(0, '#50594c');
  stone.addColorStop(0.45, '#a0a896');
  stone.addColorStop(1, '#3f473c');
  outlined(g, stone, () => {
    g.moveTo(-23, 0);
    g.lineTo(-18, -92);
    g.quadraticCurveTo(0, -106, 18, -92);
    g.lineTo(23, 0);
    g.closePath();
  });
  g.fillStyle = INK;
  for (const x of [-7, 7]) {
    g.beginPath();
    g.ellipse(x, -72, 3.4, 5.6, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = 'rgba(20,26,18,.7)';
  g.lineWidth = 1.8;
  g.beginPath();
  g.moveTo(-15, -50);
  g.lineTo(15, -50);
  g.moveTo(-17, -30);
  g.lineTo(17, -30);
  g.moveTo(-6, -24);
  g.lineTo(3, -8);
  g.stroke();
  const r = seeded(4411);
  mossDrape(g, -19, -98, 38, r, 15);
  mossDrape(g, -24, -7, 48, r, 4);
}

function paintBoulder(g) {
  const stone = g.createLinearGradient(0, -48, 0, 0);
  stone.addColorStop(0, '#8d9586');
  stone.addColorStop(1, '#3d453a');
  outlined(g, stone, () => {
    g.moveTo(-40, 0);
    g.quadraticCurveTo(-44, -30, -18, -42);
    g.quadraticCurveTo(10, -52, 30, -32);
    g.quadraticCurveTo(44, -16, 40, 0);
    g.closePath();
  });
  g.strokeStyle = 'rgba(20,26,18,.6)';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(-12, -14);
  g.lineTo(2, -24);
  g.lineTo(16, -14);
  g.stroke();
  // Moss laid over the top of it.
  g.fillStyle = '#5fa63c';
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-36, -22);
  g.quadraticCurveTo(-22, -44, 4, -47);
  g.quadraticCurveTo(26, -44, 36, -24);
  g.quadraticCurveTo(26, -18, 20, -27);
  g.quadraticCurveTo(10, -22, 2, -30);
  g.quadraticCurveTo(-8, -20, -16, -28);
  g.quadraticCurveTo(-28, -16, -36, -22);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = 'rgba(220,247,156,.55)';
  g.beginPath();
  g.ellipse(-4, -41, 15, 3, -0.1, 0, Math.PI * 2);
  g.fill();
}

function paintFern(g) {
  for (const [a, long, c] of [[-1.15, 30, '#2f7a30'], [1.15, 30, '#2f7a30'], [-0.62, 38, '#4f9a36'], [0.62, 38, '#4f9a36'], [0, 42, '#79bd48']]) {
    g.save();
    g.rotate(a);
    outlined(g, c, () => {
      g.moveTo(0, 0);
      g.quadraticCurveTo(-8, -long * 0.55, 0, -long);
      g.quadraticCurveTo(8, -long * 0.55, 0, 0);
      g.closePath();
    }, 1.6);
    g.strokeStyle = 'rgba(10,40,14,.55)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, -3);
    g.lineTo(0, -long + 4);
    g.stroke();
    g.restore();
  }
}

// A big jungle leaf, for filling the corners of the picture.
function broadLeaf(g, x, y, long, angle, fill, vein) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.fillStyle = fill;
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(long * 0.45, -long * 0.3, long, 0);
  g.quadraticCurveTo(long * 0.45, long * 0.3, 0, 0);
  g.fill();
  g.strokeStyle = vein;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(long * 0.92, 0);
  g.stroke();
  g.restore();
}

// A far ruin, seen through the trees: a stepped stone tower with one pale colour for all of it.
function farRuin(g, x, base, size, color) {
  g.fillStyle = color;
  for (let i = 0; i < 4; i++) g.fillRect(x - size * (1 - i * 0.2), base - size * 0.42 * (i + 1), size * 2 * (1 - i * 0.2), size * 0.44);
  g.fillRect(x - size * 0.14, base - size * 2.1, size * 0.28, size * 0.5);
}

function groveBackdrop(g, view, r, left, top, wide, tall) {
  const air = g.createLinearGradient(0, top, 0, top + tall);
  air.addColorStop(0, '#051510');
  air.addColorStop(0.34, '#0f3d29');
  air.addColorStop(0.62, '#2f7f50');
  air.addColorStop(0.8, '#65ad62');
  air.addColorStop(1, '#123a28');
  g.fillStyle = air;
  g.fillRect(left, top, wide, tall);

  // Sunlight falling through the canopy in slanted shafts.
  g.fillStyle = 'rgba(224,255,176,.075)';
  for (let x = left - 120; x < left + wide; x += 170 + r() * 190) {
    const w = 34 + r() * 56;
    g.beginPath();
    g.moveTo(x, top);
    g.lineTo(x + w, top);
    g.lineTo(x + w + 150, H);
    g.lineTo(x + 150 - w * 0.2, H);
    g.closePath();
    g.fill();
  }

  for (let x = left + 40 + r() * 200; x < left + wide; x += 480 + r() * 340) farRuin(g, x, 470, 40 + r() * 26, '#4b9462');
  for (let x = left - 20; x < left + wide; x += 74 + r() * 60) trunk(g, x, 16 + r() * 14, top, H + SHAKE_ROOM, '#4b9462', '#3a8354', r);
  g.fillStyle = 'rgba(214,250,190,.12)';
  for (let x = left; x < left + wide; x += 240) {
    g.beginPath();
    g.ellipse(x + r() * 120, 400 + r() * 34, 180, 26, 0, 0, Math.PI * 2);
    g.fill();
  }
  for (let x = left - 30; x < left + wide; x += 118 + r() * 110) trunk(g, x, 26 + r() * 22, top, H + SHAKE_ROOM, '#2c6a44', '#1b4f32', r);

  // The great trunks up close, with moss climbing them. They're the darkest thing here, so the pale slabs stand out.
  for (let x = left - 40; x < left + wide + 40; x += 210 + r() * 190) {
    const w = 40 + r() * 42;
    trunk(g, x, w, top, H + SHAKE_ROOM, '#17331f', '#08160d', r);
    g.fillStyle = '#2f6b2a';
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.ellipse(x + w * (0.2 + r() * 0.6), 150 + r() * 330, w * (0.14 + r() * 0.2), 9 + r() * 18, 0, 0, Math.PI * 2);
      g.fill();
    }
  }

  // Broad leaves crowding in, thickest at the water.
  const greens = ['#123f24', '#1b5a30', '#28743b'];
  for (let x = left; x < left + wide; x += 30 + r() * 34) {
    const c = greens[Math.floor(r() * 3)];
    const fan = -1.45 + r() * 0.2;
    for (let i = 0; i < 5; i++) broadLeaf(g, x, 498, 44 + r() * 46, fan + (i - 2) * (0.42 + r() * 0.1) - Math.PI * 0, c, 'rgba(120,200,110,.35)');
  }

  // The canopy, then vines hanging out of it.
  for (let x = left - 30; x < left + wide + 60; x += 62) leaves(g, r, x, view.t + 14, 130, 4, 44, ['#04120c', '#0a2717']);
  for (let x = left - 30; x < left + wide + 60; x += 70) leaves(g, r, x, view.t + 56 + r() * 24, 130, 4, 24, ['#0f3d22', '#1f6a34', '#3f9a44']);
  for (let x = left + r() * 60; x < left + wide; x += 56 + r() * 90) hangingVine(g, x, view.t + 30 + r() * 44, 60 + r() * 150, r);
}

// A slab of old cut stone, carpeted in moss, with roots and vines trailing under it. Nothing else in the game stands on this.
function slabPlatform(g, pl, r) {
  const { x, y, w } = pl;
  const depth = 22;
  for (let px = x + 12 + r() * 12; px < x + w - 8; px += 16 + r() * 26) hangingVine(g, px, y + depth - 3, 16 + r() * 34, r);
  const stone = g.createLinearGradient(0, y, 0, y + depth);
  stone.addColorStop(0, '#a4ac98');
  stone.addColorStop(1, '#4a5346');
  outlined(g, stone, () => g.roundRect(x, y + 1, w, depth, 4));
  // Where the blocks meet, and a few cracks.
  g.strokeStyle = 'rgba(18,24,16,.7)';
  g.lineWidth = 1.6;
  g.beginPath();
  for (let px = x + 28 + r() * 30; px < x + w - 14; px += 44 + r() * 34) {
    g.moveTo(px, y + 9);
    g.lineTo(px + (r() - 0.5) * 5, y + depth);
  }
  g.stroke();
  mossDrape(g, x - 2, y, w + 4, r, 10);
}

// ---------- A campaign road: floors far past the arena's width, under a slower-moving forest ----------

const ROAD_DRIFT = 0.2;
// Room behind the start, so you begin well clear of a phone's joystick.
const ROAD_LEFT = 320;

// One long picture, drawn once, that slides at a fifth of the camera's speed.
export function bakeRoad(view, q, road) {
  const wide = view.w + SHAKE_ROOM * 2 + (road.end + ROAD_LEFT) * ROAD_DRIFT;
  const tall = view.h + SHAKE_ROOM * 2;
  const c = document.createElement('canvas');
  c.width = Math.round(wide * q);
  c.height = Math.round(tall * q);
  const g = c.getContext('2d', { alpha: false });
  g.scale(q, q);
  g.translate(0, SHAKE_ROOM - view.t);
  hollowBackdrop(g, view, seeded(9127), 0, view.t - SHAKE_ROOM, wide, tall);
  c.wide = wide;
  c.tall = tall;
  // A road that ends in another land gets that land's picture too, sliding the same way over its last stretch.
  if (road.jungle) {
    const far = view.w + SHAKE_ROOM * 2 + (road.end - road.jungle.from) * ROAD_DRIFT;
    const j = document.createElement('canvas');
    j.width = Math.round(far * q);
    j.height = c.height;
    const jg = j.getContext('2d', { alpha: false });
    jg.scale(q, q);
    jg.translate(0, SHAKE_ROOM - view.t);
    groveBackdrop(jg, view, seeded(5503), 0, view.t - SHAKE_ROOM, far, tall);
    j.wide = far;
    j.tall = tall;
    c.jungle = j;
  }
  return c;
}

export const roadCamera = (road, x, view) => clamp(x - view.w * 0.38, -ROAD_LEFT, Math.max(-ROAD_LEFT, road.end - view.w));

export function drawRoadBack(g, back, view, road) {
  // Roughly where you are: the camera keeps you this far across the screen.
  const you = view.l + view.w * 0.38;
  const mix = road.jungle ? clamp((you - road.jungle.from) / (road.jungle.to - road.jungle.from), 0, 1) : 0;
  if (mix < 1) g.drawImage(back, view.l - SHAKE_ROOM - (view.l + ROAD_LEFT) * ROAD_DRIFT, view.t - SHAKE_ROOM, back.wide, back.tall);
  if (mix > 0) {
    g.globalAlpha = mix;
    g.drawImage(back.jungle, view.l - SHAKE_ROOM - Math.max(0, you - road.jungle.from) * ROAD_DRIFT, view.t - SHAKE_ROOM, back.jungle.wide, back.jungle.tall);
    g.globalAlpha = 1;
  }
}

const plankSprite = (pl, mossy) =>
  sprite(`plank${pl.x},${pl.y},${pl.w}${mossy ? 'm' : ''}`, [pl.x - 4, pl.y - 4, pl.w + 8, LAVA_Y + 16 - pl.y], (g) => {
    const r = seeded(pl.x * 7 + pl.y + 991);
    plankPlatform(g, pl, r, LAVA_Y + 8 - pl.y - 14);
    if (mossy) mossDrape(g, pl.x - 1, pl.y, pl.w + 2, r, 8);
  });

// The way into Mossback's land: two old stone posts, overgrown, with his horns over the gap.
const mossGateSprite = () =>
  sprite('mossgate', [-70, -158, 140, 162], (g) => {
    const r = seeded(7719);
    for (const dir of [-1, 1]) {
      g.strokeStyle = INK;
      g.lineWidth = 7;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(dir * 10, -122);
      g.lineTo(dir * 28, -148);
      g.moveTo(dir * 20, -136);
      g.lineTo(dir * 40, -138);
      g.stroke();
      g.strokeStyle = '#8c9384';
      g.lineWidth = 4;
      g.stroke();
      g.lineCap = 'butt';
    }
    for (const x of [-46, 46]) {
      const stone = g.createLinearGradient(x - 12, 0, x + 12, 0);
      stone.addColorStop(0, '#50594c');
      stone.addColorStop(0.45, '#a0a896');
      stone.addColorStop(1, '#3f473c');
      outlined(g, stone, () => g.roundRect(x - 12, -112, 24, 112, 3));
      g.strokeStyle = 'rgba(20,26,18,.65)';
      g.lineWidth = 1.5;
      g.beginPath();
      for (const y of [-84, -56, -28]) {
        g.moveTo(x - 11, y);
        g.lineTo(x + 11, y);
      }
      g.stroke();
      mossDrape(g, x - 14, -7, 28, r, 4);
    }
    outlined(g, '#7f8879', () => g.roundRect(-64, -124, 128, 18, 3));
    mossDrape(g, -65, -125, 130, r, 14);
    hangingVine(g, -24, -108, 42, r);
    hangingVine(g, 26, -108, 30, r);
  });

const flagSprite = (lit) =>
  sprite(`flag${lit}`, [-8, -72, 54, 76], (g) => {
    outlined(g, '#3a2210', () => g.rect(-2.5, -68, 5, 68), 2);
    outlined(g, lit ? GOLD : '#6b6250', () => {
      g.moveTo(3, -66);
      g.lineTo(40, -56);
      g.lineTo(3, -44);
      g.closePath();
    });
    outlined(g, CREAM, () => g.arc(0, -69, 3.5, 0, Math.PI * 2), 1.5);
  });

const gateSprite = () =>
  sprite('gate', [-58, -128, 116, 132], (g) => {
    for (const x of [-44, 44]) outlined(g, '#3a2210', () => g.rect(x - 6, -116, 12, 116), 2.5);
    outlined(g, '#6a3f1c', () => g.roundRect(-54, -122, 108, 14, 3), 2.5);
    g.fillStyle = '#f7e2ac';
    g.fillRect(-51, -120.5, 102, 2.2);
    for (const x of [-44, 44]) outlined(g, '#e6cf96', () => g.roundRect(x - 8, -112, 16, 12, 2), 1.5);
    g.strokeStyle = '#1a0f07';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, -108);
    g.lineTo(0, -90);
    g.stroke();
    outlined(g, GOLD, () => g.roundRect(-8, -90, 16, 20, 4), 2);
    g.fillStyle = CREAM;
    g.fillRect(-4, -85, 8, 10);
  });

// ---------- What a road walks past: the life of whoever you just beat ----------

const boards = (g, color, x0, x1, y0, y1, gap) => {
  g.strokeStyle = color;
  g.lineWidth = 1.4;
  g.beginPath();
  for (let y = y0; y < y1; y += gap) {
    g.moveTo(x0, y);
    g.lineTo(x1, y);
  }
  g.stroke();
};

function paintHouse(g) {
  const wall = g.createLinearGradient(0, -96, 0, 0);
  wall.addColorStop(0, '#73502c');
  wall.addColorStop(1, '#3d2613');
  outlined(g, wall, () => g.rect(-66, -92, 132, 92));
  boards(g, 'rgba(20,10,4,.5)', -64, 64, -80, -2, 13);
  const roof = g.createLinearGradient(0, -148, 0, -86);
  roof.addColorStop(0, '#54402a');
  roof.addColorStop(1, '#241809');
  outlined(g, roof, () => {
    g.moveTo(-84, -86);
    g.lineTo(0, -148);
    g.lineTo(84, -86);
    g.closePath();
  });
  boards(g, 'rgba(10,6,2,.45)', -62, 62, -112, -88, 10);
  // A lit window: someone is home.
  outlined(g, '#ffcf6a', () => g.rect(-50, -68, 38, 32));
  g.fillStyle = INK;
  g.fillRect(-32, -68, 2.4, 32);
  g.fillRect(-50, -53, 38, 2.4);
  outlined(g, '#8a5c2c', () => g.rect(-54, -37, 46, 6), 2);
  // The door.
  outlined(g, '#2a180b', () => g.roundRect(16, -64, 32, 64, [4, 4, 0, 0]));
  boards(g, 'rgba(120,80,40,.35)', 19, 45, -56, -2, 11);
  outlined(g, GOLD, () => g.arc(41, -30, 2.6, 0, Math.PI * 2), 1.2);
}

function paintRack(g) {
  for (const x of [-52, 52]) outlined(g, '#4a2d14', () => g.roundRect(x - 4, -86, 8, 86, 2), 2);
  outlined(g, '#5e3a1a', () => g.roundRect(-62, -92, 124, 8, 2), 2);
  // A net hung up to dry.
  g.strokeStyle = '#e2cf9f';
  g.lineWidth = 1.1;
  g.beginPath();
  for (let i = -44; i <= 44; i += 11) {
    g.moveTo(i, -84);
    g.quadraticCurveTo(i + 6, -48, i + 2, -18 - Math.abs(i) * 0.25);
    g.moveTo(-46, -84 + (i + 44) * 0.68);
    g.quadraticCurveTo(0, -74 + (i + 44) * 0.68, 46, -84 + (i + 44) * 0.68);
  }
  g.stroke();
}

function paintCrutch(g) {
  g.save();
  g.rotate(0.16);
  outlined(g, '#c9a06a', () => g.roundRect(-2.5, -44, 5, 44, 1.5), 1.8);
  outlined(g, '#c9a06a', () => g.roundRect(-9, -50, 18, 5, 2), 1.8);
  outlined(g, '#8a6438', () => g.roundRect(-5, -28, 10, 3.6, 1), 1.4);
  g.restore();
}

function paintTent(g) {
  const hide = g.createLinearGradient(0, -104, 0, 0);
  hide.addColorStop(0, '#a98454');
  hide.addColorStop(1, '#58391b');
  outlined(g, hide, () => {
    g.moveTo(-78, 0);
    g.lineTo(0, -100);
    g.lineTo(78, 0);
    g.closePath();
  });
  outlined(g, '#1d1208', () => {
    g.moveTo(-20, 0);
    g.lineTo(0, -62);
    g.lineTo(20, 0);
    g.closePath();
  }, 2);
  g.strokeStyle = 'rgba(40,20,6,.5)';
  g.lineWidth = 1.5;
  g.beginPath();
  for (const x of [-46, -26, 26, 46]) {
    g.moveTo(x * 0.2, -86);
    g.lineTo(x, 0);
  }
  g.stroke();
  for (const x of [-8, 6]) outlined(g, '#4a2d14', () => g.roundRect(x, -114, 4, 28, 1), 1.6);
}

function paintHides(g) {
  for (const x of [-44, 44]) outlined(g, '#4a2d14', () => g.roundRect(x - 3.5, -78, 7, 78, 2), 2);
  outlined(g, '#5e3a1a', () => g.roundRect(-52, -80, 104, 6, 2), 2);
  outlined(g, '#a97a48', () => {
    g.moveTo(-28, -72);
    g.quadraticCurveTo(0, -66, 28, -72);
    g.lineTo(32, -30);
    g.quadraticCurveTo(0, -18, -32, -30);
    g.closePath();
  });
  g.fillStyle = 'rgba(60,34,12,.45)';
  g.beginPath();
  g.ellipse(0, -48, 14, 18, 0, 0, Math.PI * 2);
  g.fill();
}

function paintFire(g) {
  for (const [x, y] of [[-20, -3], [-8, -6], [8, -6], [20, -3]]) outlined(g, '#6a6660', () => g.ellipse(x, y, 7, 4.6, 0, 0, Math.PI * 2), 1.6);
  outlined(g, '#4a2d14', () => g.roundRect(-16, -12, 32, 5, 2), 1.6);
  outlined(g, '#f08a22', () => {
    g.moveTo(-9, -12);
    g.quadraticCurveTo(-13, -26, 0, -38);
    g.quadraticCurveTo(13, -26, 9, -12);
    g.closePath();
  }, 1.8);
  g.fillStyle = '#ffdf7a';
  g.beginPath();
  g.ellipse(0, -18, 4, 7, 0, 0, Math.PI * 2);
  g.fill();
}

function paintCage(g) {
  // The fox, with a bandaged back leg.
  outlined(g, '#d0702a', () => g.ellipse(-2, -14, 15, 9, 0, 0, Math.PI * 2), 1.8);
  outlined(g, '#d0702a', () => {
    g.moveTo(10, -20);
    g.lineTo(13, -33);
    g.lineTo(18, -26);
    g.lineTo(23, -32);
    g.lineTo(24, -18);
    g.quadraticCurveTo(18, -11, 10, -20);
    g.closePath();
  }, 1.8);
  outlined(g, '#fff1b8', () => g.ellipse(-16, -13, 8, 4, -0.5, 0, Math.PI * 2), 1.4);
  outlined(g, '#f3e9d2', () => g.roundRect(-11, -11, 7, 9, 1.5), 1.2);
  g.fillStyle = INK;
  g.beginPath();
  g.ellipse(18.5, -23, 1.5, 2.5, 0, 0, Math.PI * 2);
  g.fill();
  // The cage round it, door hanging open.
  g.strokeStyle = INK;
  g.lineWidth = 3.4;
  g.beginPath();
  for (let x = -34; x <= 34; x += 11.3) {
    g.moveTo(x, -46);
    g.lineTo(x, 0);
  }
  g.stroke();
  g.strokeStyle = '#8f8a7e';
  g.lineWidth = 1.5;
  g.stroke();
  outlined(g, '#5e3a1a', () => g.roundRect(-38, -50, 76, 6, 2), 2);
  outlined(g, '#5e3a1a', () => g.roundRect(-38, -4, 76, 6, 2), 2);
}

const PROPS = {
  house: [[-88, -152, 176, 156], paintHouse],
  rack: [[-66, -96, 132, 100], paintRack],
  crutch: [[-16, -56, 40, 60], paintCrutch],
  tent: [[-82, -118, 164, 122], paintTent],
  idol: [[-46, -146, 92, 150], paintIdol],
  boulder: [[-48, -56, 96, 60], paintBoulder],
  fern: [[-46, -48, 92, 50], paintFern],
  hides: [[-56, -84, 112, 88], paintHides],
  fire: [[-30, -42, 60, 46], paintFire],
  cage: [[-42, -54, 84, 60], paintCage],
};

const logSprite = (held) =>
  sprite(`roadlog${held}`, [-40, -20, 80, 40], (g) => {
    const wood = g.createLinearGradient(0, -14, 0, 14);
    wood.addColorStop(0, '#8f6438');
    wood.addColorStop(1, '#46290f');
    outlined(g, wood, () => g.roundRect(-34, -14, 68, 28, 12));
    g.strokeStyle = 'rgba(25,12,3,.55)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(-24, -6);
    g.lineTo(12, -7);
    g.moveTo(-14, 6);
    g.lineTo(24, 5);
    g.stroke();
    outlined(g, '#c9a06a', () => g.ellipse(30, 0, 5, 11.5, 0, 0, Math.PI * 2), 1.8);
    if (!held) return;
    // Ken's net, wrapped round it.
    g.strokeStyle = '#fff1b8';
    g.lineWidth = 1.5;
    g.beginPath();
    for (let x = -34; x <= 26; x += 12) {
      g.moveTo(x, -15);
      g.lineTo(x + 12, 15);
      g.moveTo(x + 12, -15);
      g.lineTo(x, 15);
    }
    g.stroke();
  });

const barrelSprite = () =>
  sprite('roadbarrel', [-20, -20, 40, 40], (g) => {
    const wood = g.createRadialGradient(-4, -5, 2, 0, 0, 18);
    wood.addColorStop(0, '#a87842');
    wood.addColorStop(1, '#4e2f13');
    outlined(g, wood, () => g.arc(0, 0, 16, 0, Math.PI * 2));
    g.strokeStyle = INK;
    g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(-15, -4);
    g.lineTo(15, -4);
    g.moveTo(-15, 5);
    g.lineTo(15, 5);
    g.stroke();
    outlined(g, '#c9a06a', () => g.arc(0, 0, 3, 0, Math.PI * 2), 1.2);
  });

function drawLog(g, log, s, mix) {
  const held = s?.h > 0;
  const { x, y, a, pivotX, pivotY } = logAt(log, (s?.t ?? 0) + (held ? 0 : mix));
  g.strokeStyle = INK;
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(pivotX, pivotY);
  g.lineTo(x, y - 12);
  g.stroke();
  g.strokeStyle = '#c9a06a';
  g.lineWidth = 2;
  g.stroke();
  g.save();
  g.translate(x, y);
  g.rotate(-a);
  stamp(g, logSprite(held));
  g.restore();
}

function drawWind(g, gust, tick, view, now) {
  const { on, warn } = gustState(gust, tick);
  if (!on && !warn) return;
  const x0 = Math.max(gust.x0, view.l);
  const x1 = Math.min(gust.x1, view.l + view.w);
  if (x1 <= x0) return;
  const span = gust.x1 - gust.x0;
  g.strokeStyle = on ? 'rgba(255,241,184,.55)' : 'rgba(255,241,184,.18)';
  g.lineWidth = on ? 2.2 : 1.5;
  g.beginPath();
  for (let i = 0; i < 16; i++) {
    const x = gust.x0 + (((i * 137 + (now * gust.dir * (on ? 0.9 : 0.3))) % span) + span) % span;
    if (x < x0 || x > x1) continue;
    const y = 90 + ((i * 61) % 340);
    g.moveTo(x, y);
    g.lineTo(x - gust.dir * (on ? 54 : 26), y);
  }
  g.stroke();
}

// A line someone says. Each is drawn once and reused, so talking costs nothing per frame.
function bubbleSprite(text, who) {
  return sprite(`say|${who}|${text}`, ...bubbleShape(text, who));
}

const measure = document.createElement('canvas').getContext('2d');
const SAY_FONT = '600 15px Sora, system-ui, sans-serif';
const SAY_WIDE = 270;
const SAY_LINE = 20;

function bubbleShape(text, who) {
  measure.font = SAY_FONT;
  const lines = [];
  let row = '';
  for (const word of text.split(' ')) {
    const longer = row ? `${row} ${word}` : word;
    if (row && measure.measureText(longer).width > SAY_WIDE) {
      lines.push(row);
      row = word;
    } else row = longer;
  }
  lines.push(row);
  measure.font = '800 10.5px Sora, system-ui, sans-serif';
  const label = measure.measureText(who.toUpperCase()).width;
  measure.font = SAY_FONT;
  const w = Math.ceil(Math.max(label, ...lines.map((l) => measure.measureText(l).width))) + 26;
  const h = 26 + lines.length * SAY_LINE;
  const box = [-w / 2 - 3, -h - 15, w + 6, h + 18];
  return [box, (g) => {
    outlined(g, '#17140f', () => {
      g.roundRect(-w / 2, -h - 12, w, h, 9);
    }, 2);
    outlined(g, '#17140f', () => {
      g.moveTo(-8, -13.5);
      g.lineTo(0, 0);
      g.lineTo(8, -13.5);
    }, 2);
    g.fillStyle = '#17140f';
    g.fillRect(-7, -15, 14, 4);
    g.fillStyle = 'rgba(255,211,92,.3)';
    g.fillRect(-w / 2 + 4, -h - 10, w - 8, 1);
    g.textAlign = 'left';
    g.font = '800 10.5px Sora, system-ui, sans-serif';
    g.fillStyle = GOLD;
    g.fillText(who.toUpperCase(), -w / 2 + 13, -h + 7);
    g.font = SAY_FONT;
    g.fillStyle = CREAM;
    lines.forEach((l, i) => g.fillText(l, -w / 2 + 13, -h + 26 + i * SAY_LINE));
  }];
}

export function drawBubble(g, text, who, x, y, view, alpha) {
  const c = bubbleSprite(text, who);
  const half = c.box[2] / 2;
  const left = view.l + half + 6;
  const right = view.l + view.w - half - 6;
  const atX = clamp(x, left, Math.max(left, right));
  // Clear of the top bar. A voice you've already run past moves up there too, because the joystick sits at the screen's lower corner.
  const top = view.t + 54 - c.box[1];
  const atY = atX === x ? Math.max(y, top) : top;
  g.globalAlpha = alpha;
  stamp(g, c, atX, atY);
  g.globalAlpha = 1;
}

// Only what's on screen is drawn, from sprites, so a long road costs no more than a short one.
export function drawRoad(g, road, view, camp, tick, mix, now) {
  const l = view.l - 60;
  const right = view.l + view.w + 60;
  const at = camp?.at ?? -1;
  for (const p of road.props) {
    const [box, paint] = PROPS[p.k];
    if (p.x + box[0] + box[2] > l && p.x + box[0] < right) stamp(g, sprite(`prop${p.k}`, box, paint), p.x, p.y);
  }
  for (const w of road.gusts) drawWind(g, w, tick, view, now);
  for (const pl of road.platforms) if (pl.x + pl.w > l && pl.x < right) stamp(g, plankSprite(pl, road.mossFrom !== undefined && pl.x >= road.mossFrom));
  for (let i = 0; i < road.checks.length; i++) {
    const c = road.checks[i];
    if (c.x > l && c.x < right) stamp(g, flagSprite(i <= at), c.x, c.y);
  }
  if (road.goal.x > l && road.goal.x < right) stamp(g, road.gate === 'moss' ? mossGateSprite() : gateSprite(), road.goal.x, road.goal.y);
  road.logs.forEach((log, i) => {
    if (log.x + log.reach + 60 > l && log.x - log.reach - 60 < right) drawLog(g, log, camp?.lg?.[i], mix);
  });
  for (const b of camp?.br ?? []) {
    if (b.x < l || b.x > right) continue;
    g.save();
    g.translate(b.x + b.vx * mix, b.y - 16);
    g.rotate((b.x / 16) % (Math.PI * 2));
    stamp(g, barrelSprite());
    g.restore();
  }
}

// ---------- The moving hazard at the bottom: lava, swamp or quicksand ----------

const THEMES = [
  { stops: ['#ffcf47', '#ff8c16', '#f04a0d', '#a82309'], rim: CREAM, crust: 'rgba(120,22,6,.5)', bubble: '#ffbe46', heat: '255,110,20', mote: '#ffb040' },
  { stops: ['#a6e86a', '#55b84a', '#1f7f3c', '#0c4a24'], rim: '#dcffb4', crust: 'rgba(6,46,22,.5)', bubble: '#a6e86a', heat: '150,255,90', mote: '#e6ff8a' },
  { stops: ['#ffe28f', '#e6ab3c', '#b97a1e', '#7a4d10'], rim: CREAM, crust: 'rgba(92,56,10,.5)', bubble: '#ffd35c', heat: '255,190,70', mote: '#ffe7a8' },
  { stops: ['#d9bcff', '#8a4fe0', '#4a2296', '#1c0a3c'], rim: '#f3e6ff', crust: 'rgba(14,4,34,.55)', bubble: '#c79cff', heat: '170,90,255', mote: '#e6d0ff' },
  { stops: ['#7fc4d4', '#2f6f88', '#143a50', '#081c2c'], rim: '#dff6fb', crust: 'rgba(200,235,245,.16)', bubble: '#a8e0ec', heat: '120,200,220', mote: '#ffe9a0' },
  { stops: ['#d9963f', '#8f4f1a', '#46240e', '#1a0b04'], rim: '#ffe2a8', crust: 'rgba(16,7,2,.55)', bubble: '#c9812e', heat: '230,130,40', mote: '#ffb75c' },
  { stops: ['#7fc47a', '#2f7f5a', '#123f30', '#061c16'], rim: '#d8f59a', crust: 'rgba(4,22,14,.55)', bubble: '#8fd07e', heat: '110,220,120', mote: '#dcff8a' },
];
const HAZARD_THUMB = THEMES.map((theme) => theme.stops[1]);

let theme = THEMES[0];
export const setArtMap = (map) => (theme = THEMES[map]);

let quality = 'high';
const embers = Array.from({ length: 26 }, () => ({ x: rand(-120, W + 120), y: rand(0, H), v: rand(0.2, 0.7), s: rand(1.2, 2.8), d: rand(0, 6) }));
const bubbles = Array.from({ length: 7 }, () => ({ x: rand(0, W), t: rand(0, 1), v: rand(0.0035, 0.008), r: rand(4, 9) }));
const surface = (x, t, lift = 0) => LAVA_Y - lift + Math.sin(x * 0.018 + t * 0.0013) * 5 + Math.sin(x * 0.047 - t * 0.0009) * 2.4;

export const setArtQuality = (q) => (quality = q);

// Gradients are made once per map: creating them every frame was a real cost on phones.
function fills(g) {
  if (theme.heatFill) return;
  theme.heatFill = g.createLinearGradient(0, 330, 0, LAVA_Y);
  theme.heatFill.addColorStop(0, `rgba(${theme.heat},0)`);
  theme.heatFill.addColorStop(1, `rgba(${theme.heat},1)`);
  theme.lavaFill = g.createLinearGradient(0, LAVA_Y - 6, 0, H);
  theme.lavaFill.addColorStop(0, theme.stops[0]);
  theme.lavaFill.addColorStop(0.22, theme.stops[1]);
  theme.lavaFill.addColorStop(0.65, theme.stops[2]);
  theme.lavaFill.addColorStop(1, theme.stops[3]);
}

function lavaPath(g, view, t, lift, stepX) {
  const left = view.l - SHAKE_ROOM;
  const right = view.l + view.w + SHAKE_ROOM;
  g.beginPath();
  g.moveTo(left, H + SHAKE_ROOM);
  for (let x = left; x < right + stepX; x += stepX) g.lineTo(x, surface(x, t, lift));
  g.lineTo(right + stepX, H + SHAKE_ROOM);
  g.closePath();
}

// ---------- Things that keep moving in the background of the two new maps ----------

const debrisSprite = (i) =>
  sprite(`debris${i}`, [-26, -26, 52, 52], (g) => {
    const r = seeded(77 + i * 13);
    if (i === 3) return brokenColumn(g, 0, 0, 13, 40, 0.5);
    outlined(g, i === 1 ? '#6a4fa0' : '#4a3280', () => rockShape(g, -16 - i, -6, 32 + i * 2, 18, r), 2);
    g.fillStyle = '#d9bcff';
    g.fillRect(-13 - i, -7, 26 + i * 2, 2.4);
    if (i !== 2) crystal(g, -4, -6, 12, 1, '#c79cff');
  });

const DEBRIS = [
  [130, 66, 0, 0.00052, 0],
  [352, 208, 1, 0.00061, 1.4],
  [608, 216, 2, 0.00047, 2.7],
  [852, 150, 0, 0.00058, 3.9],
  [34, 392, 3, 0.00043, 5.1],
  [928, 402, 1, 0.00055, 0.8],
  [230, 448, 2, 0.00066, 2.1],
  [730, 450, 3, 0.00049, 4.4],
];

const petalSprite = () =>
  sprite('petal', [-5, -4, 10, 8], (g) => {
    g.fillStyle = '#ffc4d4';
    g.beginPath();
    g.ellipse(0, 0, 4, 2.4, 0.4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(190,70,110,.6)';
    g.fillRect(-1, -0.5, 3, 1);
  });

// Rocks and broken columns that VI keeps in the air, bobbing and turning slowly.
function drawDebris(g, t, low) {
  for (let i = 0; i < (low ? 4 : DEBRIS.length); i++) {
    const [x, y, kind, speed, phase] = DEBRIS[i];
    g.save();
    g.translate(x + Math.sin(t * speed * 0.7 + phase) * 7, y + Math.sin(t * speed * 2 + phase) * 11);
    g.rotate(Math.sin(t * speed + phase) * 0.45);
    stamp(g, debrisSprite(kind));
    g.restore();
  }
}

// Blossom drifting down across the hideout. Nothing but a clock decides where each one is, so there's nothing to keep.
function drawPetals(g, view, t, low) {
  const petal = petalSprite();
  const span = LAVA_Y - view.t;
  for (let i = 0; i < (low ? 8 : 18); i++) {
    const fall = (t * (0.024 + (i % 5) * 0.004) + i * 83) % span;
    const across = ((i * 197 + t * 0.012) % (view.w + 80)) + view.l - 40;
    stamp(g, petal, across + Math.sin(t * 0.0016 + i) * 22, view.t + fall);
  }
}

export function drawLavaBack(g, view, t) {
  fills(g);
  if (theme === THEMES[3]) drawDebris(g, t, quality === 'low');
  else if (theme === THEMES[4]) drawPetals(g, view, t, quality === 'low');
  const low = quality === 'low';
  g.globalAlpha = 0.15 + Math.sin(t * 0.0018) * 0.04;
  g.fillStyle = theme.heatFill;
  g.fillRect(view.l - SHAKE_ROOM, 330, view.w + SHAKE_ROOM * 2, LAVA_Y - 330);
  g.globalAlpha = 1;

  const count = low ? 12 : embers.length;
  for (let i = 0; i < count; i++) {
    const e = embers[i];
    e.y -= e.v;
    if (e.y < view.t - 5) {
      e.y = LAVA_Y;
      e.x = rand(view.l, view.l + view.w);
    }
    g.globalAlpha = clamp((e.y - view.t) / 300, 0, 0.8);
    g.fillStyle = theme.mote;
    g.fillRect(e.x + Math.sin(t * 0.002 + e.d) * 7, e.y, e.s, e.s);
  }
  g.globalAlpha = 1;

  lavaPath(g, view, t * 0.8, 12, low ? 32 : 20);
  g.fillStyle = theme.stops[3];
  g.fill();
}

export function drawLavaFront(g, view, t) {
  fills(g);
  const low = quality === 'low';
  const stepX = low ? 32 : 20;
  lavaPath(g, view, t, 0, stepX);
  g.fillStyle = theme.lavaFill;
  g.fill();
  g.strokeStyle = theme.rim;
  g.lineWidth = 2.5;
  g.beginPath();
  for (let x = view.l - SHAKE_ROOM; x < view.l + view.w + SHAKE_ROOM + stepX; x += stepX) g.lineTo(x, surface(x, t));
  g.stroke();

  // Cooling crust drifting across.
  g.fillStyle = theme.crust;
  const span = view.w + 120;
  for (let i = 0; i < (low ? 3 : 6); i++) {
    const drift = (i * 190 + t * 0.012 * (i % 2 ? 1 : -1)) % span;
    g.beginPath();
    g.ellipse(view.l - 60 + (drift < 0 ? drift + span : drift), 515 + (i % 3) * 8, 34 + i * 3, 4, 0, 0, Math.PI * 2);
    g.fill();
  }
  const bubbleCount = low ? 3 : bubbles.length;
  g.lineWidth = 1.5;
  g.fillStyle = theme.bubble;
  g.strokeStyle = theme.rim;
  for (let i = 0; i < bubbleCount; i++) {
    const b = bubbles[i];
    b.t += b.v;
    if (b.t > 1) {
      b.t = 0;
      b.x = rand(view.l, view.l + view.w);
    }
    g.globalAlpha = 1 - b.t;
    g.beginPath();
    g.arc(b.x, surface(b.x, t) - b.t * 8, b.r * (0.4 + b.t * 0.6), 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }
  g.globalAlpha = 1;
}
