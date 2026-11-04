// Drawing the heroes, their guns and the power-up icons. All original, all made of plain shapes.
import { ANGLER, ARC, BULWARK, DUSK, FLAME, HANDLER, ILLUSIONIST, ITEMS, LASER, MINIGUN, MOSSBACK, NINJA, PISTOL, POACHER, RIFLE, RIME, ROCKET, SANTA, SHADE, SHIFTER, SHOTGUN, SHURIKEN, SNIPER, SNIPER_GUN, SPRINTER, TETHER, TRAPPER } from './sim.js';

export const INK = '#060708';
export const GOLD = '#ffd35c';
export const CREAM = '#fff1b8';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function outlined(g, fill, path, width = 2.5) {
  g.beginPath();
  path();
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = width;
  g.stroke();
}

export function star(g, x, y, r, color) {
  g.fillStyle = color;
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const d = i % 2 ? r * 0.3 : r;
    g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  g.closePath();
  g.fill();
}

function legs(g, swing, air, color, shoe) {
  const lift = air ? 3 : 0;
  outlined(g, color, () => g.roundRect(-9 + swing * 0.7, -10 - lift, 8, air ? 9 : 10, 3), 2);
  outlined(g, color, () => g.roundRect(1 - swing * 0.7, air ? -9 : -10, 8, air ? 8 : 10, 3), 2);
  if (shoe) {
    g.fillStyle = shoe;
    g.fillRect(-9 + swing * 0.7, -3 - lift, 8, 3);
    g.fillRect(1 - swing * 0.7, -3, 8, 3);
  }
}

// ---------- Guns ----------

// Where each gun's muzzle sits, for flashes and for the sniper's laser.
export const MUZZLE = { [PISTOL]: 27, [SNIPER_GUN]: 48, [RIFLE]: 40, [SHOTGUN]: 36, [ROCKET]: 38, [MINIGUN]: 40, [FLAME]: 36, [LASER]: 40, [ARC]: 34, [SHURIKEN]: 24 };

const part = (g, fill, x, y, w, h, r = 2) => outlined(g, fill, () => g.roundRect(x, y, w, h, r), 2);

export function drawGun(g, gun, y, t) {
  if (gun === SNIPER_GUN) {
    part(g, '#2f3a4c', -6, y - 3, 24, 7);
    part(g, '#59657a', 16, y - 2, 28, 4, 1);
    part(g, GOLD, 4, y - 9, 15, 5);
    star(g, 19, y - 7, 2 + Math.max(0, Math.sin(t * 0.006)) * 3, CREAM);
  } else if (gun === RIFLE) {
    part(g, '#3f4b34', -4, y - 3, 26, 7);
    part(g, '#7c8a6a', 20, y - 1.5, 16, 3, 1);
    part(g, '#2b3324', 8, y + 3, 6, 8);
    part(g, '#2b3324', 1, y - 7, 10, 3, 1);
  } else if (gun === SHOTGUN) {
    part(g, '#6d4524', -5, y - 2, 14, 7);
    part(g, '#5b636e', 7, y - 3.5, 26, 3.5, 1);
    part(g, '#5b636e', 7, y, 26, 3.5, 1);
    part(g, '#2d2f35', 15, y + 3, 11, 4, 1);
  } else if (gun === ROCKET) {
    part(g, '#475a44', -12, y - 6, 46, 11, 3);
    part(g, '#2d2f35', 28, y - 7, 7, 13, 2);
    part(g, '#ffb321', 34, y - 4, 6, 7, 3);
    part(g, '#2b3324', 4, y + 4, 6, 7);
  } else if (gun === MINIGUN) {
    part(g, '#494d57', -6, y - 5, 20, 12, 3);
    for (const dy of [-4, -1, 2]) part(g, '#878d98', 13, y + dy, 24, 2.5, 1);
    part(g, '#ffb321', 13, y - 5, 4, 11, 1);
  } else if (gun === FLAME) {
    part(g, '#b3361c', -9, y - 6, 12, 15, 5);
    part(g, '#5b636e', 2, y - 2, 28, 5, 1);
    part(g, '#2d2f35', 28, y - 4, 6, 9, 2);
    star(g, 36, y, 3 + Math.abs(Math.sin(t * 0.03)) * 2, '#ff9a2e');
  } else if (gun === LASER) {
    part(g, '#e9edf3', -3, y - 4, 22, 9, 4);
    part(g, '#58e1ff', 16, y - 2, 20, 5, 2);
    part(g, '#3147b8', 4, y + 4, 6, 6);
    star(g, 37, y, 2 + Math.abs(Math.sin(t * 0.01)) * 2, '#c9f6ff');
  } else if (gun === ARC) {
    part(g, '#2d3a8c', -3, y - 4, 18, 8, 3);
    part(g, GOLD, 13, y - 2.5, 16, 5, 2);
    part(g, '#1b2358', 3, y + 3, 5, 7);
    star(g, 31, y, 2.5 + Math.abs(Math.sin(t * 0.012)) * 2, CREAM);
  } else if (gun === SHURIKEN) {
    star(g, 14, y, 13, INK);
    star(g, 14, y, 10, '#c9d0da');
    outlined(g, '#3b4058', () => g.arc(14, y, 2.5, 0, Math.PI * 2), 1.5);
  } else {
    part(g, '#9aa3ae', 6, y - 3, 17, 6);
    part(g, '#59606b', 8, y + 2, 5, 7);
  }
}

// ---------- Heroes ----------

function sniper(g, o, bob, swing, air) {
  legs(g, swing, air, '#3c4a26');
  outlined(g, '#6d8a3f', () => g.roundRect(-11, -26 + bob, 22, 19, 6));
  g.fillStyle = '#4c6329';
  g.fillRect(-3, -24 + bob, 3, 15);
  outlined(g, o.color, () => g.roundRect(-11, -29 + bob, 22, 6, 3), 2);
  outlined(g, '#f0c49b', () => g.arc(1, -39 + bob, 12, 0, Math.PI * 2));
  outlined(g, '#2e3d1b', () => g.ellipse(-1, -48 + bob, 13, 6.5, -0.2, 0, Math.PI * 2));
  g.fillStyle = o.color;
  g.beginPath();
  g.arc(-7, -48 + bob, 2.4, 0, Math.PI * 2);
  g.fill();
  outlined(g, GOLD, () => g.arc(7, -40 + bob, 4.5, 0, Math.PI * 2), 2);
  g.fillStyle = '#16304a';
  g.beginPath();
  g.arc(7, -40 + bob, 2.4, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = INK;
  g.fillRect(-2, -42 + bob, 3, 4);
  g.fillRect(0, -33 + bob, 6, 1.6);
}

function trapper(g, o, bob, swing, air) {
  legs(g, swing, air, '#54331a');
  if (!o.skin) {
    outlined(g, '#cdb27a', () => g.arc(-13, -18 + bob, 9, 0, Math.PI * 2), 2);
    g.strokeStyle = '#7a5f2e';
    g.lineWidth = 1;
    for (let i = -6; i <= 6; i += 4) {
      g.beginPath();
      g.moveTo(-19, -18 + bob + i);
      g.lineTo(-7, -18 + bob - i);
      g.moveTo(-19, -18 + bob - i);
      g.lineTo(-7, -18 + bob + i);
      g.stroke();
    }
  }
  outlined(g, '#9a6431', () => g.roundRect(-10, -26 + bob, 21, 19, 6));
  outlined(g, o.color, () => g.roundRect(-10, -16 + bob, 21, 5, 2), 2);
  outlined(g, '#d8a070', () => g.arc(1, -37 + bob, 12, 0, Math.PI * 2));
  outlined(g, '#6a3e1b', () => g.ellipse(1, -45 + bob, 20, 5, 0, 0, Math.PI * 2));
  outlined(g, '#7d4b22', () => g.roundRect(-9, -57 + bob, 20, 12, 5));
  g.fillStyle = o.color;
  g.fillRect(-8, -49 + bob, 18, 3);
  g.fillStyle = INK;
  g.fillRect(3, -39 + bob, 3, 4);
  g.fillRect(8, -39 + bob, 3, 4);
  g.fillStyle = '#7a4a24';
  g.beginPath();
  g.arc(4, -30 + bob, 6, 0, Math.PI);
  g.fill();
}

function ninja(g, o, bob, swing, air) {
  legs(g, swing, air, '#1a1d2b', '#3b4058');
  // A katana across the back.
  g.save();
  g.translate(-6, -22 + bob);
  g.rotate(-0.9);
  part(g, '#c9d0da', -2, -24, 4, 20, 1);
  part(g, GOLD, -4, -5, 8, 3, 1);
  part(g, '#7a1626', -2, -2, 4, 10, 1);
  g.restore();
  outlined(g, '#232738', () => g.roundRect(-10, -26 + bob, 21, 19, 6));
  outlined(g, o.color, () => g.roundRect(-10, -15 + bob, 21, 4, 2), 2);
  outlined(g, '#1b1e2c', () => g.arc(1, -38 + bob, 12, 0, Math.PI * 2));
  // Eye slit, and only the eyes showing.
  g.fillStyle = '#f0c49b';
  g.beginPath();
  g.roundRect(-5, -43 + bob, 17, 7, 3);
  g.fill();
  g.fillStyle = INK;
  g.fillRect(3, -41.5 + bob, 3, 4);
  g.fillRect(8, -41.5 + bob, 3, 4);
  // Headband, with tails that stream out behind. It comes off during Smoke Step.
  if (o.skin) return;
  g.fillStyle = o.color;
  g.fillRect(-11, -47 + bob, 24, 3.5);
  const wave = Math.sin(o.t * 0.012) * 3;
  outlined(
    g,
    o.color,
    () => {
      g.moveTo(-11, -47 + bob);
      g.quadraticCurveTo(-19, -49 + bob + wave, -26, -44 + bob - wave);
      g.lineTo(-24, -41 + bob - wave);
      g.quadraticCurveTo(-18, -44 + bob + wave, -11, -43 + bob);
      g.closePath();
    },
    1.5,
  );
}

function sprinter(g, o, bob, swing, air) {
  legs(g, swing * 1.4, air, '#2d3a8c', '#ff3b30');
  outlined(g, '#ffcb2e', () => g.roundRect(-10, -26 + bob, 20, 19, 6));
  // A lightning bolt across the chest.
  g.fillStyle = o.color;
  g.beginPath();
  g.moveTo(2, -25 + bob);
  g.lineTo(-5, -15 + bob);
  g.lineTo(0, -15 + bob);
  g.lineTo(-3, -8 + bob);
  g.lineTo(6, -18 + bob);
  g.lineTo(1, -18 + bob);
  g.closePath();
  g.fill();
  outlined(g, '#ffd2a6', () => g.arc(1, -37 + bob, 12, 0, Math.PI * 2));
  // Spiky hair swept backward.
  outlined(g, o.skin ? '#ffe04a' : '#ff7a1a', () => {
    g.moveTo(-11, -38 + bob);
    g.lineTo(-20, -44 + bob);
    g.lineTo(-11, -46 + bob);
    g.lineTo(-16, -54 + bob);
    g.lineTo(-5, -50 + bob);
    g.lineTo(-4, -57 + bob);
    g.lineTo(4, -50 + bob);
    g.lineTo(11, -48 + bob);
    g.lineTo(13, -42 + bob);
    g.lineTo(0, -44 + bob);
    g.closePath();
  });
  // Racing goggles.
  outlined(g, '#59e0ff', () => g.roundRect(0, -42 + bob, 13, 7, 3), 2);
  g.fillStyle = 'rgba(255,255,255,.75)';
  g.fillRect(3, -41 + bob, 3, 2);
  g.fillStyle = INK;
  g.fillRect(3, -31 + bob, 7, 1.6);
}

function shifter(g, o, bob) {
  // A blob with one big eye. It wobbles because it's never quite one shape.
  const wob = Math.sin(o.t * 0.008) * 1.5;
  outlined(g, o.skin ? '#8df0d8' : '#2ec4a6', () => {
    g.moveTo(-14 - wob, 0);
    g.quadraticCurveTo(-16 - wob, -28 + bob, -6, -42 + bob);
    g.quadraticCurveTo(1, -50 + bob + wob, 9, -42 + bob);
    g.quadraticCurveTo(17 + wob, -26 + bob, 14 + wob, 0);
    g.closePath();
  });
  g.fillStyle = 'rgba(255,255,255,.28)';
  g.beginPath();
  g.ellipse(-5, -32 + bob, 3, 8, 0.3, 0, Math.PI * 2);
  g.fill();
  outlined(g, o.color, () => g.roundRect(-14, -13 + bob, 28, 5, 2), 2);
  outlined(g, '#f7fff9', () => g.arc(4, -30 + bob, 8.5, 0, Math.PI * 2), 2);
  g.fillStyle = INK;
  g.beginPath();
  g.arc(6, -30 + bob, 4, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.fillRect(7, -33 + bob, 2, 2);
}

function santa(g, o, bob, swing, air) {
  legs(g, swing, air, '#b5261c', '#1c1e22');
  // A round red coat with a white trim down the front.
  outlined(g, '#d8301f', () => g.roundRect(-14, -28 + bob, 28, 22, 9));
  g.fillStyle = '#fff6e6';
  g.fillRect(-2, -27 + bob, 5, 20);
  // The belt is the team colour, with a gold buckle.
  outlined(g, o.color, () => g.roundRect(-14, -16 + bob, 28, 5, 2), 2);
  outlined(g, GOLD, () => g.roundRect(-3, -17 + bob, 7, 7, 2), 1.5);
  outlined(g, '#f4c9a4', () => g.arc(1, -37 + bob, 12, 0, Math.PI * 2));
  // A big white beard.
  outlined(g, '#fff6e6', () => {
    g.moveTo(-10, -36 + bob);
    g.quadraticCurveTo(-10, -20 + bob, 3, -19 + bob);
    g.quadraticCurveTo(14, -21 + bob, 13, -36 + bob);
    g.quadraticCurveTo(2, -29 + bob, -10, -36 + bob);
    g.closePath();
  });
  g.fillStyle = INK;
  g.fillRect(3, -41 + bob, 3, 4);
  g.fillRect(8, -41 + bob, 3, 4);
  // A floppy hat, with its bobble hanging behind. It comes off for the throw, showing white hair.
  if (o.skin) {
    outlined(g, '#fff6e6', () => g.arc(1, -43 + bob, 12, Math.PI, 0));
    return;
  }
  outlined(g, '#d8301f', () => {
    g.moveTo(-12, -44 + bob);
    g.quadraticCurveTo(-4, -64 + bob, -22, -56 + bob);
    g.lineTo(-20, -52 + bob);
    g.quadraticCurveTo(-11, -55 + bob, -13, -44 + bob);
    g.lineTo(14, -44 + bob);
    g.quadraticCurveTo(10, -60 + bob, -4, -60 + bob);
    g.closePath();
  });
  outlined(g, '#fff6e6', () => g.arc(-22, -53 + bob, 4, 0, Math.PI * 2), 2);
  outlined(g, '#fff6e6', () => g.roundRect(-14, -48 + bob, 30, 6, 3), 2);
}

function dusk(g, o, bob) {
  // A tall witch in ink-dark robes, with a pale crescent mask.
  const wave = (i) => Math.sin(o.t * 0.006 + i * 1.3) * 2;
  // After the ink connects she is a shadow: black robes, a dark mask, and only the eye still bright.
  const robe = o.skin ? '#05060c' : '#18224a';
  outlined(g, robe, () => {
    g.moveTo(-8, -32 + bob);
    g.lineTo(-17 + wave(0), 0);
    g.lineTo(-7, -3 + wave(1));
    g.lineTo(2, 0);
    g.lineTo(9, -3 + wave(2));
    g.lineTo(17 + wave(3), 0);
    g.lineTo(9, -32 + bob);
    g.closePath();
  });
  outlined(g, o.color, () => g.roundRect(-9, -26 + bob, 18, 4, 2), 2);
  outlined(g, o.skin ? '#1d2438' : '#e8ecf5', () => g.arc(1, -38 + bob, 11, 0, Math.PI * 2));
  // A dark crescent cut out of the mask.
  g.fillStyle = robe;
  g.beginPath();
  g.arc(-5, -38 + bob, 10, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#7fe0ff';
  g.beginPath();
  g.ellipse(7, -39 + bob, 1.8, 3, 0, 0, Math.PI * 2);
  g.fill();
  // Pointed hat, bent at the tip.
  outlined(g, o.skin ? '#05060c' : '#121a3a', () => {
    g.moveTo(-15, -43 + bob);
    g.lineTo(15, -43 + bob);
    g.lineTo(5, -55 + bob);
    g.lineTo(-7, -70 + bob);
    g.lineTo(-4, -55 + bob);
    g.closePath();
  });
  g.fillStyle = o.color;
  g.fillRect(-9, -47 + bob, 18, 3);
}

const kiteShield = (g, x, y, w, h, fill, width) =>
  outlined(
    g,
    fill,
    () => {
      g.moveTo(x - w / 2, y - h / 2);
      g.lineTo(x + w / 2, y - h / 2);
      g.lineTo(x + w / 2, y + h * 0.12);
      g.lineTo(x, y + h / 2);
      g.lineTo(x - w / 2, y + h * 0.12);
      g.closePath();
    },
    width,
  );

function bulwark(g, o, bob, swing, air) {
  // Her long ponytail streams out behind, longer the faster she's moving.
  const stream = clamp(Math.abs(o.vx) * 0.8, 0, 12);
  const wave = Math.sin(o.t * 0.014) * 3;
  outlined(g, '#ff6fa8', () => {
    g.moveTo(-8, -46 + bob);
    g.quadraticCurveTo(-22 - stream, -46 + bob + wave, -28 - stream, -26 + bob - wave);
    g.quadraticCurveTo(-20 - stream, -30 + bob, -8, -36 + bob);
    g.closePath();
  });
  legs(g, swing, air, '#5a6b82', '#2d3545');
  // A shield slung on her back, and a steel breastplate.
  if (!o.skin) {
    kiteShield(g, -13, -21 + bob, 16, 26, '#c9d4e2', 2);
    g.fillStyle = '#ff6fa8';
    g.fillRect(-14.5, -29 + bob, 3, 18);
  }
  outlined(g, '#8ea3bd', () => {
    g.moveTo(-9, -26 + bob);
    g.lineTo(9, -26 + bob);
    g.lineTo(11, -8 + bob);
    g.lineTo(-11, -8 + bob);
    g.closePath();
  });
  g.fillStyle = 'rgba(255,255,255,.45)';
  g.fillRect(-5, -24 + bob, 3, 14);
  outlined(g, o.color, () => g.roundRect(-11, -29 + bob, 22, 5, 2), 2);
  outlined(g, '#ffe0c8', () => g.arc(1, -38 + bob, 12, 0, Math.PI * 2));
  outlined(g, '#ff6fa8', () => g.arc(0, -42 + bob, 12, Math.PI * 0.95, Math.PI * 2.1));
  // Round eyes with lashes, and blush.
  g.fillStyle = INK;
  g.beginPath();
  g.ellipse(4, -37 + bob, 1.8, 2.8, 0, 0, Math.PI * 2);
  g.ellipse(10, -37 + bob, 1.8, 2.8, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(2, -41 + bob);
  g.lineTo(5, -40.5 + bob);
  g.moveTo(8, -41 + bob);
  g.lineTo(12, -40.5 + bob);
  g.stroke();
  g.fillStyle = 'rgba(255,100,130,.5)';
  g.beginPath();
  g.ellipse(0, -33 + bob, 2.6, 1.6, 0, 0, Math.PI * 2);
  g.ellipse(11, -33 + bob, 2, 1.6, 0, 0, Math.PI * 2);
  g.fill();
}

function illusionist(g, o, bob, swing, air) {
  legs(g, swing, air, '#2b1740', '#141018');
  // A long purple tailcoat with a stage magician's bow tie.
  outlined(g, '#6c2fb0', () => {
    g.moveTo(-10, -27 + bob);
    g.lineTo(10, -27 + bob);
    g.lineTo(12, -7 + bob);
    g.lineTo(2, -11 + bob);
    g.lineTo(-13, -5 + bob);
    g.closePath();
  });
  outlined(g, o.color, () => g.roundRect(-11, -18 + bob, 22, 4, 2), 2);
  outlined(g, '#f0d0ff', () => {
    g.moveTo(-5, -30 + bob);
    g.lineTo(6, -24 + bob);
    g.lineTo(6, -30 + bob);
    g.lineTo(-5, -24 + bob);
    g.closePath();
  }, 1.5);
  outlined(g, '#f4d3b5', () => g.arc(1, -38 + bob, 12, 0, Math.PI * 2));
  // A half mask, and a curled moustache under it.
  outlined(g, '#f4eefc', () => g.roundRect(-3, -44 + bob, 16, 8, 4), 2);
  g.fillStyle = INK;
  g.fillRect(3, -42 + bob, 3, 4);
  g.fillRect(8, -42 + bob, 3, 4);
  g.strokeStyle = INK;
  g.lineWidth = 1.8;
  g.beginPath();
  g.moveTo(1, -32 + bob);
  g.quadraticCurveTo(6, -35 + bob, 11, -31 + bob);
  g.stroke();
  // Tall top hat with a band. It comes off while the copies are out, showing slicked hair.
  if (o.skin) {
    outlined(g, '#1f1230', () => g.arc(1, -43 + bob, 11.5, Math.PI, 0));
    return;
  }
  outlined(g, '#1f1230', () => g.roundRect(-8, -66 + bob, 19, 20, 2));
  g.fillStyle = o.color;
  g.fillRect(-7, -52 + bob, 17, 4);
  outlined(g, '#1f1230', () => g.roundRect(-14, -48 + bob, 31, 4, 2), 2);
  star(g, -15, -60 + bob, 4, '#f0d0ff');
}

function poacher(g, o, bob, swing, air) {
  legs(g, swing, air, '#3a3f28', '#2a1c10');
  // A patched canvas vest, with a spare trap hanging from the belt.
  outlined(g, '#6f7a3e', () => g.roundRect(-11, -27 + bob, 22, 20, 5));
  g.fillStyle = '#505a2c';
  g.fillRect(-9, -24 + bob, 5, 6);
  g.fillRect(4, -18 + bob, 5, 6);
  outlined(g, o.color, () => g.roundRect(-11, -15 + bob, 22, 4, 2), 2);
  if (!o.skin) outlined(g, '#9aa3ae', () => g.arc(-11, -8 + bob, 5, Math.PI, 0), 2);
  outlined(g, '#e0ae84', () => g.arc(1, -37 + bob, 12, 0, Math.PI * 2));
  // A rough beard and a flat cap with a short peak.
  g.fillStyle = '#5c3a1c';
  g.beginPath();
  g.arc(2, -32 + bob, 9, 0.1, Math.PI - 0.1);
  g.fill();
  g.fillStyle = INK;
  g.fillRect(3, -40 + bob, 3, 4);
  g.fillRect(8, -40 + bob, 3, 4);
  outlined(g, '#59492a', () => g.ellipse(0, -47 + bob, 14, 6.5, -0.05, 0, Math.PI * 2));
  outlined(g, '#433619', () => g.roundRect(3, -46 + bob, 16, 3.5, 2), 2);
}

function angler(g, o, bob, swing, air) {
  // A fishing rod over the shoulder, its line hanging behind.
  if (!o.skin) {
    g.strokeStyle = INK;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(-2, -22 + bob);
    g.lineTo(-30, -68 + bob);
    g.stroke();
    g.strokeStyle = '#a06a33';
    g.lineWidth = 2;
    g.stroke();
    g.strokeStyle = '#dfe6ee';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-30, -68 + bob);
    g.lineTo(-30, -40 + bob);
    g.stroke();
  }
  legs(g, swing, air, '#2f4f63', '#1c2a33');
  // A yellow oilskin coat and a bucket hat.
  outlined(g, '#f2c230', () => g.roundRect(-12, -27 + bob, 24, 21, 6));
  g.strokeStyle = '#a97f12';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(1, -26 + bob);
  g.lineTo(1, -8 + bob);
  g.stroke();
  outlined(g, o.color, () => g.roundRect(-12, -17 + bob, 24, 4, 2), 2);
  outlined(g, '#eebd96', () => g.arc(1, -37 + bob, 12, 0, Math.PI * 2));
  g.fillStyle = INK;
  g.fillRect(3, -39 + bob, 3, 4);
  g.fillRect(8, -39 + bob, 3, 4);
  g.fillStyle = '#dcdcdc';
  g.beginPath();
  g.arc(3, -31 + bob, 8, 0.2, Math.PI - 0.2);
  g.fill();
  outlined(g, '#d6a925', () => {
    g.moveTo(-16, -42 + bob);
    g.lineTo(18, -42 + bob);
    g.lineTo(11, -54 + bob);
    g.lineTo(-9, -54 + bob);
    g.closePath();
  });
}

function handler(g, o, bob, swing, air) {
  // An old dog lover: flat cap, white moustache, round glasses and a cardigan with a paw on it.
  legs(g, swing, air, '#55503f', '#2a1c10');
  outlined(g, '#8c5f3a', () => g.roundRect(-11, -27 + bob, 22, 20, 6));
  g.fillStyle = '#6e4829';
  g.fillRect(-1, -26 + bob, 2, 18);
  g.fillStyle = CREAM;
  for (const [x, y, r] of [[5, -17, 2.4], [2.5, -20.5, 1.1], [5, -21.5, 1.1], [7.5, -20.5, 1.1]]) {
    g.beginPath();
    g.arc(x, y + bob, r, 0, Math.PI * 2);
    g.fill();
  }
  outlined(g, o.color, () => g.roundRect(-11, -15 + bob, 22, 4, 2), 2);
  // While the real dog is out his arms are empty and the lead on his belt has gone with it.
  if (!o.skin) {
    g.strokeStyle = '#d8261c';
    g.lineWidth = 2.5;
    g.beginPath();
    g.arc(-11, -10 + bob, 4, 0, Math.PI * 2);
    g.stroke();
    // His K9 pup, tucked under his arm, in the same colours as the dog he sends out.
    outlined(g, '#4a2a15', () => g.roundRect(-36, -25 + bob, 22, 12, 5), 2);
    outlined(g, '#f6efe2', () => g.ellipse(-22, -15 + bob, 5, 2.4, 0, 0, Math.PI * 2), 1.3);
    outlined(g, '#4a2a15', () => g.arc(-19, -30 + bob, 7, 0, Math.PI * 2), 2);
    outlined(g, '#f6efe2', () => g.roundRect(-17, -30 + bob, 8, 6, 3), 1.6);
    outlined(g, '#2e1a0c', () => g.ellipse(-23, -33 + bob, 2.6, 4.8, 0.5, 0, Math.PI * 2), 1.5);
    g.fillStyle = INK;
    g.fillRect(-19.5, -33 + bob, 2.2, 2.2);
    g.fillRect(-11, -29 + bob, 2, 2);
    outlined(g, '#d8261c', () => g.roundRect(-25, -25 + bob, 10, 2.8, 1), 1.2);
  }
  outlined(g, '#e0b08a', () => g.arc(1, -37 + bob, 12, 0, Math.PI * 2));
  // White hair at the sides, showing under the cap.
  outlined(g, '#f4f1ea', () => g.ellipse(-9, -38 + bob, 4, 6, 0.1, 0, Math.PI * 2), 1.6);
  // Round glasses.
  g.strokeStyle = INK;
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(4.5, -39 + bob, 3.4, 0, Math.PI * 2);
  g.moveTo(13.4, -39 + bob);
  g.arc(10, -39 + bob, 3.4, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = INK;
  g.fillRect(3.5, -40 + bob, 2, 2.4);
  g.fillRect(9, -40 + bob, 2, 2.4);
  // A big white moustache.
  outlined(g, '#f4f1ea', () => {
    g.moveTo(-1, -31 + bob);
    g.quadraticCurveTo(6, -36 + bob, 13, -31 + bob);
    g.quadraticCurveTo(6, -28.5 + bob, -1, -31 + bob);
    g.closePath();
  }, 1.5);
  // Flat cap with a short peak at the front.
  outlined(g, '#6d6a55', () => g.ellipse(0, -47 + bob, 14, 6, -0.05, 0, Math.PI * 2));
  outlined(g, '#55523f', () => g.roundRect(3, -46 + bob, 15, 3.4, 2), 2);
}

function mossback(g, o, bob, swing, air) {
  legs(g, swing, air, '#4b3a26');
  // A walking boulder: wide, cracked, with moss on its shoulders and branches for horns.
  for (const dir of o.skin ? [] : [-1, 1]) {
    g.strokeStyle = INK;
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(dir * 7, -46 + bob);
    g.lineTo(dir * 15, -62 + bob);
    g.moveTo(dir * 12, -56 + bob);
    g.lineTo(dir * 21, -58 + bob);
    g.stroke();
    g.strokeStyle = '#7a5a34';
    g.lineWidth = 3;
    g.stroke();
  }
  outlined(g, '#7b6a55', () => {
    g.moveTo(-18, -8 + bob);
    g.quadraticCurveTo(-22, -32 + bob, -11, -46 + bob);
    g.quadraticCurveTo(2, -54 + bob, 13, -46 + bob);
    g.quadraticCurveTo(22, -30 + bob, 18, -8 + bob);
    g.closePath();
  });
  g.strokeStyle = '#4c3f30';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-10, -12 + bob);
  g.lineTo(-5, -22 + bob);
  g.lineTo(-11, -28 + bob);
  g.stroke();
  outlined(g, '#4f8a3a', () => {
    g.moveTo(-14, -38 + bob);
    g.quadraticCurveTo(0, -60 + bob, 16, -38 + bob);
    g.lineTo(11, -41 + bob);
    g.lineTo(7, -36 + bob);
    g.lineTo(1, -41 + bob);
    g.lineTo(-5, -36 + bob);
    g.lineTo(-9, -41 + bob);
    g.closePath();
  });
  outlined(g, o.color, () => g.roundRect(-17, -17 + bob, 34, 4, 2), 2);
  // Amber eyes deep in the stone, and a jagged mouth.
  for (const x of [3, 11]) {
    g.fillStyle = INK;
    g.fillRect(x - 2.5, -33 + bob, 6, 6);
    g.fillStyle = '#ffc93f';
    g.fillRect(x - 0.5, -31.5 + bob, 3, 3);
  }
  g.fillStyle = INK;
  g.beginPath();
  g.moveTo(1, -25 + bob);
  g.lineTo(14, -25 + bob);
  g.lineTo(12, -21 + bob);
  g.lineTo(9, -23 + bob);
  g.lineTo(6, -21 + bob);
  g.lineTo(3, -23 + bob);
  g.closePath();
  g.fill();
}

function rime(g, o, bob, swing, air) {
  // A polar explorer: a long dark braid, a white fur hood and a frost-blue parka, with a crystal on the hood.
  outlined(g, '#16363f', () => {
    g.moveTo(-9, -36 + bob);
    g.quadraticCurveTo(-20, -30 + bob, -18, -13 + bob);
    g.lineTo(-13, -14 + bob);
    g.quadraticCurveTo(-14, -26 + bob, -6, -32 + bob);
    g.closePath();
  }, 2);
  outlined(g, '#9fe4f2', () => g.arc(-15.5, -12 + bob, 3.2, 0, Math.PI * 2), 1.6);
  legs(g, swing, air, '#27455c', '#f2f7fb');
  outlined(g, o.skin ? '#d7f1f8' : '#3aa7c4', () => {
    g.moveTo(-10, -27 + bob);
    g.lineTo(10, -27 + bob);
    g.lineTo(14, -7 + bob);
    g.lineTo(-14, -7 + bob);
    g.closePath();
  });
  outlined(g, '#f2f7fb', () => g.roundRect(-15, -11 + bob, 30, 6, 3), 2);
  g.fillStyle = '#f2f7fb';
  g.fillRect(-1.5, -27 + bob, 3, 16);
  outlined(g, o.color, () => g.roundRect(-11, -20 + bob, 22, 4, 2), 2);
  // The hood is a thick ring of fur around the face.
  outlined(g, '#f2f7fb', () => g.arc(1, -38 + bob, 15, 0, Math.PI * 2));
  outlined(g, '#f6d7bd', () => g.arc(2, -38 + bob, 10, 0, Math.PI * 2), 2);
  g.fillStyle = '#16363f';
  g.beginPath();
  g.arc(2, -42 + bob, 9.5, Math.PI, 0);
  g.fill();
  g.fillStyle = INK;
  g.beginPath();
  g.ellipse(4, -38 + bob, 1.7, 2.6, 0, 0, Math.PI * 2);
  g.ellipse(9, -38 + bob, 1.5, 2.6, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(255,120,150,.5)';
  g.beginPath();
  g.ellipse(-1, -34 + bob, 2.4, 1.4, 0, 0, Math.PI * 2);
  g.fill();
  if (o.skin) return;
  outlined(g, '#9fe4f2', () => {
    g.moveTo(1, -60 + bob);
    g.lineTo(6, -52 + bob);
    g.lineTo(1, -48 + bob);
    g.lineTo(-4, -52 + bob);
    g.closePath();
  }, 2);
}

function tether(g, o, bob, swing, air) {
  // A spider-themed climber of our own: blue hood and plated mask with eight small eyes, red legs and harness.
  // Spider legs unfold from the back while the skill is showing.
  if (o.skin) {
    for (const [kx, ky, fx, fy] of [[-24, -48, -33, -30], [-29, -34, -38, -14], [-22, -18, -30, -2], [-17, -52, -30, -58]]) {
      for (const [color, width] of [[INK, 4.5], ['#c9261e', 2.2]]) {
        g.strokeStyle = color;
        g.lineWidth = width;
        g.beginPath();
        g.moveTo(-8, -24 + bob);
        g.lineTo(kx, ky + bob);
        g.lineTo(fx, fy + bob);
        g.stroke();
      }
    }
  }
  legs(g, swing, air, '#b3261e', '#101a3d');
  outlined(g, '#1d3a8f', () => g.roundRect(-11, -27 + bob, 22, 20, 5));
  g.strokeStyle = '#c9261e';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(-8, -27 + bob);
  g.lineTo(7, -11 + bob);
  g.moveTo(8, -27 + bob);
  g.lineTo(-7, -11 + bob);
  g.stroke();
  outlined(g, o.color, () => g.roundRect(-11, -15 + bob, 22, 4, 2), 2);
  outlined(g, '#16296b', () => g.arc(1, -38 + bob, 13.5, 0, Math.PI * 2));
  g.strokeStyle = '#c9261e';
  g.lineWidth = 2.4;
  g.beginPath();
  g.arc(1, -38 + bob, 10.5, Math.PI * 0.95, Math.PI * 1.55);
  g.stroke();
  outlined(g, '#0a0f26', () => g.roundRect(-2.5, -45.5 + bob, 16.5, 14, 6), 2);
  g.fillStyle = '#ffc93f';
  // Eight eyes, laid out the way a jumping spider's are: two big ones in the middle.
  for (const [x, y, r] of [[3.7, -39.5, 2.6], [9.3, -39.5, 2.6], [0.4, -41.5, 1.1], [12.6, -41.5, 1.1], [0.2, -37.2, 1], [12.8, -37.2, 1], [5, -35, 0.9], [8, -35, 0.9]]) {
    g.beginPath();
    g.arc(x, y + bob, r, 0, Math.PI * 2);
    g.fill();
  }
}

function shade(g, o, bob, swing, air) {
  // A cloaked scout: slate hood, grey scarf trailing behind, pale eyes in the dark.
  const wave = Math.sin(o.t * 0.01) * 3;
  if (!o.skin) {
    outlined(g, '#8d97a6', () => {
      g.moveTo(-6, -30 + bob);
      g.quadraticCurveTo(-18, -32 + bob + wave, -28, -24 + bob - wave);
      g.lineTo(-25, -19 + bob - wave);
      g.quadraticCurveTo(-16, -25 + bob + wave, -6, -24 + bob);
      g.closePath();
    }, 1.8);
  }
  legs(g, swing, air, '#222a36', '#141920');
  outlined(g, '#333e4f', () => {
    g.moveTo(-9, -28 + bob);
    g.lineTo(9, -28 + bob);
    g.lineTo(13, -5 + bob);
    g.lineTo(7, -8 + bob);
    g.lineTo(2, -4 + bob);
    g.lineTo(-3, -8 + bob);
    g.lineTo(-13, -5 + bob);
    g.closePath();
  });
  outlined(g, o.color, () => g.roundRect(-10, -19 + bob, 20, 4, 2), 2);
  outlined(g, '#8d97a6', () => g.roundRect(-9, -31 + bob, 20, 6, 3), 2);
  outlined(g, '#2a3442', () => {
    g.moveTo(-13, -30 + bob);
    g.quadraticCurveTo(-16, -48 + bob, -3, -54 + bob);
    g.quadraticCurveTo(14, -52 + bob, 14, -30 + bob);
    g.closePath();
  });
  g.fillStyle = '#0d1219';
  g.beginPath();
  g.ellipse(4, -39 + bob, 9, 8, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#d7f4ff';
  g.beginPath();
  g.ellipse(3, -39 + bob, 1.9, 2.8, 0, 0, Math.PI * 2);
  g.ellipse(9, -39 + bob, 1.7, 2.8, 0, 0, Math.PI * 2);
  g.fill();
}

const BODIES = {
  [RIME]: rime,
  [TETHER]: tether,
  [SHADE]: shade,
  [SNIPER]: sniper,
  [TRAPPER]: trapper,
  [NINJA]: ninja,
  [SPRINTER]: sprinter,
  [SHIFTER]: shifter,
  [SANTA]: santa,
  [DUSK]: dusk,
  [BULWARK]: bulwark,
  [ILLUSIONIST]: illusionist,
  [POACHER]: poacher,
  [ANGLER]: angler,
  [HANDLER]: handler,
  [MOSSBACK]: mossback,
};

// ---------- Sprites: each picture is drawn once and then stamped, which is what keeps phones at full speed ----------

const sprites = new Map();
let spriteScale = 1;

export function setSpriteScale(q) {
  if (q === spriteScale) return;
  spriteScale = q;
  sprites.clear();
}

// box = [left, top, width, height] around the picture's own origin.
export function sprite(key, box, paint) {
  let c = sprites.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = Math.ceil(box[2] * spriteScale);
    c.height = Math.ceil(box[3] * spriteScale);
    const g = c.getContext('2d');
    g.scale(spriteScale, spriteScale);
    g.translate(-box[0], -box[1]);
    paint(g);
    c.box = box;
    sprites.set(key, c);
  }
  return c;
}

export const stamp = (g, c, x = 0, y = 0) => g.drawImage(c, x + c.box[0], y + c.box[1], c.box[2], c.box[3]);

const BODY_BOX = [-50, -78, 100, 86];
const GUN_BOX = [-18, -16, 72, 32];
const RUN_FRAMES = 6;
const IDLE_FRAMES = 4;

// The same few frames of animation for everyone, so they can all be reused.
function frameOf(o) {
  if (!o.ground) {
    const t = Math.floor(o.t / 240) % 2;
    return { mode: 'a', i: t, t: t * 240, bob: 0, swing: 0, air: true, vx: o.vx };
  }
  if (Math.abs(o.vx) > 1) {
    const i = Math.floor(o.t / 63) % RUN_FRAMES;
    const t = i * 63;
    return { mode: 'r', i, t, bob: -Math.abs(Math.sin(t / 60)) * 2, swing: Math.sin(t / 60) * 6, air: false, vx: 9 };
  }
  const i = Math.floor(o.t / 500) % IDLE_FRAMES;
  const t = i * 500;
  return { mode: 'i', i, t, bob: Math.sin(t / 320) * 0.8, swing: 0, air: false, vx: 0 };
}

function bodySprite(o, fr) {
  return sprite(`b${o.hero}|${o.color}|${o.ghost ? 1 : 0}|${o.skin ? 1 : 0}|${fr.mode}${fr.i}`, BODY_BOX, (g) => BODIES[o.hero](g, { color: o.color, t: fr.t, vx: fr.vx, ghost: o.ghost, skin: o.skin }, fr.bob, fr.swing, fr.air));
}

const gunSprite = (gun) => sprite(`g${gun}`, GUN_BOX, (g) => drawGun(g, gun, 0, 400));

const labelSprite = (text, color) =>
  sprite(`l${text}|${color}`, [-30, -12, 60, 18], (g) => {
    g.textAlign = 'center';
    g.font = '800 12px Sora, system-ui, sans-serif';
    g.lineWidth = 3;
    g.strokeStyle = INK;
    g.strokeText(text, 0, 0);
    g.fillStyle = color;
    g.fillText(text, 0, 0);
  });

// Everyone can see who is under Dusk's ink.
const blindTagSprite = () =>
  sprite('blindtag', [-34, -14, 68, 18], (g) => {
    outlined(g, '#18224a', () => g.roundRect(-30, -12, 60, 15, 5), 2);
    g.textAlign = 'center';
    g.font = '800 10px Sora, system-ui, sans-serif';
    g.fillStyle = '#bfefff';
    g.fillText('BLINDED', 0, -1);
  });

const heavySprite = () =>
  sprite('heavy', [-14, -8, 28, 12], (g) => {
    outlined(g, '#6f7684', () => g.roundRect(-11, -5, 11, 6, 2), 2);
    outlined(g, '#6f7684', () => g.roundRect(1, -5, 11, 6, 2), 2);
  });

const guardSprite = () =>
  sprite('guard', [-4, -66, 44, 64], (g) => {
    kiteShield(g, 18, -34, 34, 56, '#c9d4e2', 3);
    kiteShield(g, 18, -35, 22, 40, GOLD, 2);
    g.fillStyle = 'rgba(255,255,255,.55)';
    g.fillRect(9, -54, 4, 22);
  });

// In-match drawing: the same picture as drawHero below, stamped from sprites.
export function stampHero(g, o) {
  const fr = frameOf(o);
  const size = o.small ? 0.5 : o.giant ? 2 : 1;
  const gun = o.gun || 0;
  const struggle = o.netted ? Math.sin(o.t / 35) * 0.09 : 0;
  const lean = clamp(o.vx * o.f * 0.012, -0.2, 0.2) + struggle;
  g.save();
  g.translate(o.x, o.y);
  if (size !== 1) g.scale(size, size);
  if (o.alpha !== 1) g.globalAlpha = o.alpha;
  g.scale(o.f, 1);
  // A laser sight warns everyone a heavy bullet is coming. Drawn before the body leans, so it stays level.
  if (gun === SNIPER_GUN) {
    g.fillStyle = 'rgba(255,70,70,.5)';
    g.fillRect(48, -18.5, 1300, 1);
  }
  if (o.boots) {
    star(g, -5 - fr.swing * 0.5, 2, 4 + Math.abs(Math.sin(o.t * 0.04)) * 3, '#ff9a2e');
    star(g, 5 + fr.swing * 0.5, 2, 4 + Math.abs(Math.cos(o.t * 0.04)) * 3, '#ffd35c');
  }
  if (lean) g.rotate(lean);
  if (o.heavy) stamp(g, heavySprite());
  stamp(g, bodySprite(o, fr));
  if (o.throwing > 0) {
    g.save();
    g.translate(0, -24 + fr.bob);
    g.rotate(-2.6 + (1 - o.throwing) * 2.8);
    outlined(g, '#c9a27e', () => g.roundRect(0, -3, 22, 6, 3), 2);
    g.restore();
  } else {
    stamp(g, gunSprite(gun), 0, -17 + fr.bob);
    if (o.golden) star(g, MUZZLE[gun], -17 + fr.bob, 5 + Math.sin(o.t * 0.02) * 2, GOLD);
  }
  if (o.flash > 0) {
    const big = o.flashGun === SNIPER_GUN || o.flashGun === SHOTGUN || o.flashGun === ROCKET;
    star(g, MUZZLE[o.flashGun], -17 + fr.bob, big ? 16 : 9, CREAM);
    star(g, MUZZLE[o.flashGun], -17 + fr.bob, big ? 8 : 4, '#ff9a2e');
  }
  if (o.guard) stamp(g, guardSprite());
  g.restore();
  if (o.guard) {
    g.beginPath();
    g.arc(o.x, o.y - 26, 38, 0, Math.PI * 2);
    g.strokeStyle = INK;
    g.lineWidth = 5;
    g.stroke();
    g.strokeStyle = GOLD;
    g.lineWidth = 2.5;
    g.stroke();
  }
  if (o.shield > 0) {
    const r = o.giant ? 56 : o.small ? 18 : 34;
    g.beginPath();
    g.arc(o.x, o.y - (o.giant ? 40 : o.small ? 10 : 24), r, 0, Math.PI * 2);
    g.fillStyle = 'rgba(100,190,255,.18)';
    g.fill();
    g.strokeStyle = o.shield > 1 ? '#8ad0ff' : 'rgba(138,208,255,.5)';
    g.lineWidth = 2.5;
    g.stroke();
  }
  const labelY = o.y - (o.giant ? 124 : o.small ? 40 : 66);
  if (o.label) stamp(g, labelSprite(o.label, o.isMe ? CREAM : o.color), o.x, labelY);
  if (o.blind) stamp(g, blindTagSprite(), o.x, labelY - 15);
}

// Pick screen and portraits: drawn fresh at any size. Not for use during a fight.
export function drawHero(g, o) {
  const swing = 0;
  const bob = Math.sin(o.t / 320) * 0.8;
  const size = o.scale || 1;
  const gun = o.gun || 0;
  g.save();
  g.translate(o.x, o.y);
  g.scale(size, size);
  if (o.alpha !== undefined) g.globalAlpha = o.alpha;
  g.scale(o.f, 1);
  BODIES[o.hero](g, o, bob, swing, false);
  if (!o.noGun) drawGun(g, gun, -17 + bob, o.t);
  g.restore();
}

// ---------- Power-up icons ----------

function text(g, label, size, color) {
  g.font = `800 ${size}px Sora, system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = 3;
  g.strokeStyle = INK;
  g.strokeText(label, 0, 1);
  g.fillStyle = color;
  g.fillText(label, 0, 1);
  g.textBaseline = 'alphabetic';
}

const ICONS = {
  cd3: (g) => text(g, '-3s', 12, '#8ee6ff'),
  cd5: (g) => text(g, '-5s', 12, '#8ee6ff'),
  cd10: (g) => text(g, '-10', 12, '#8ee6ff'),
  refresh: (g) => {
    g.strokeStyle = INK;
    g.lineWidth = 6;
    g.beginPath();
    g.arc(0, 0, 8, 0.5, Math.PI * 1.7);
    g.stroke();
    g.strokeStyle = '#8ee6ff';
    g.lineWidth = 3;
    g.stroke();
    outlined(
      g,
      '#8ee6ff',
      () => {
        g.moveTo(4, -11);
        g.lineTo(11, -7);
        g.lineTo(4, -1);
        g.closePath();
      },
      1.5,
    );
  },
  shield: (g) => outlined(g, '#8ad0ff', () => {
    g.moveTo(-9, -9);
    g.lineTo(9, -9);
    g.lineTo(8, 3);
    g.lineTo(0, 11);
    g.lineTo(-8, 3);
    g.closePath();
  }),
  heavy: (g) => {
    part(g, '#868d9b', -5, -10, 10, 13, 2);
    part(g, '#5e6573', -7, 2, 16, 7, 2);
  },
  life: (g) => outlined(g, '#ff5a6e', () => {
    g.moveTo(0, 10);
    g.bezierCurveTo(-14, 0, -10, -11, 0, -4);
    g.bezierCurveTo(10, -11, 14, 0, 0, 10);
    g.closePath();
  }),
  boots: (g) => {
    part(g, '#d94f2b', -6, -9, 9, 12, 2);
    part(g, '#d94f2b', -6, 0, 14, 5, 2);
    star(g, -1, 9, 5, '#ffb321');
  },
  golden: (g) => {
    part(g, GOLD, -10, -4, 15, 8, 2);
    outlined(g, GOLD, () => g.arc(5, 0, 5, -Math.PI / 2, Math.PI / 2), 2);
  },
  giant: (g) => outlined(g, '#7fe08a', () => {
    g.moveTo(0, -11);
    g.lineTo(9, -1);
    g.lineTo(4, -1);
    g.lineTo(4, 10);
    g.lineTo(-4, 10);
    g.lineTo(-4, -1);
    g.lineTo(-9, -1);
    g.closePath();
  }),
  lowg: (g) => {
    outlined(g, '#c2e0ff', () => g.arc(0, 0, 7, 0, Math.PI * 2));
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(0, 0, 12, 4, -0.4, 0, Math.PI * 2);
    g.stroke();
  },
  meteor: (g) => {
    star(g, -2, -2, 10, '#ff9a2e');
    outlined(g, '#6a4f3b', () => g.arc(3, 3, 6, 0, Math.PI * 2));
  },
};

export function drawItemIcon(g, i) {
  const it = ITEMS[i];
  if (it.gun !== undefined) {
    g.save();
    g.scale(0.5, 0.5);
    g.translate(-16, 0);
    drawGun(g, it.gun, 0, 0);
    g.restore();
  } else {
    ICONS[it.id](g);
  }
}

