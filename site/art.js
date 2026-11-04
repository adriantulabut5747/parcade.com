// The three maps: each one's background, platforms and moving hazard. No game rules here.
// The platforms never move; a wider screen only shows more of the world around them.
import { H, MAPS, W } from './sim.js';
import { CREAM, GOLD, INK, outlined } from './heroes.js';

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
}

// ---------- The moving hazard at the bottom: lava, swamp or quicksand ----------

const THEMES = [
  { stops: ['#ffcf47', '#ff8c16', '#f04a0d', '#a82309'], rim: CREAM, crust: 'rgba(120,22,6,.5)', bubble: '#ffbe46', heat: '255,110,20', mote: '#ffb040' },
  { stops: ['#a6e86a', '#55b84a', '#1f7f3c', '#0c4a24'], rim: '#dcffb4', crust: 'rgba(6,46,22,.5)', bubble: '#a6e86a', heat: '150,255,90', mote: '#e6ff8a' },
  { stops: ['#ffe28f', '#e6ab3c', '#b97a1e', '#7a4d10'], rim: CREAM, crust: 'rgba(92,56,10,.5)', bubble: '#ffd35c', heat: '255,190,70', mote: '#ffe7a8' },
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

export function drawLavaBack(g, view, t) {
  fills(g);
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
