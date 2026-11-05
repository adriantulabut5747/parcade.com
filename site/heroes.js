// Drawing the heroes, their guns and the power-up icons. All original, all made of plain shapes.
import { ANGLER, ARC, AQUILLES, CASSIO, DEXTAR, DUSK, FLAME, HANDLER, ILLUSIONIST, ITEMS, LASER, LOOKOUT, MINIGUN, MOSSBACK, NINJA, PISTOL, POACHER, RIFLE, RIME, ROCKET, SANTA, SEEDEA, SHADE, SHIFTER, SHOTGUN, SHURIKEN, SNIPER, SNIPER_GUN, SPRINTER, TETHER, TRAPPER, VI } from './sim.js';

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

// The one eye every hero shares: an upright black oval with a small shine. A light one, for faces in the dark, has no shine.
function oneEye(g, x, y, size = 1, color = INK) {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, 2 * size, 3.3 * size, 0, 0, Math.PI * 2);
  g.fill();
  if (color !== INK) return;
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(x + 0.6 * size, y - 1.3 * size, 0.85 * size, 0, Math.PI * 2);
  g.fill();
}

// Everyone's eyes. y is the top of the eye, x the middle of the first one.
function eyes(g, y, x = 3, size = 1, color = INK) {
  oneEye(g, x, y + 2, size, color);
  oneEye(g, x + 5.2, y + 2, size, color);
}

// ---------- Guns ----------

// Where each gun's muzzle sits, for flashes and for the sniper's laser.
export const MUZZLE = { [PISTOL]: 27, [SNIPER_GUN]: 48, [RIFLE]: 40, [SHOTGUN]: 36, [ROCKET]: 38, [MINIGUN]: 40, [FLAME]: 36, [LASER]: 40, [ARC]: 34, [SHURIKEN]: 24 };

const part = (g, fill, x, y, w, h, r = 2) => {
  outlined(g, fill, () => g.roundRect(x, y, w, h, r), 2);
  g.fillStyle = 'rgba(255,255,255,.34)';
  g.fillRect(x + 1, y + 0.8, w - 2, Math.max(0.8, h * 0.22));
  g.fillStyle = 'rgba(0,0,0,.24)';
  g.fillRect(x + 1, y + h * 0.66, w - 2, h * 0.24);
};

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
    // A proper pistol: a dark slide catching the light, a wooden grip, a trigger guard and a gold front sight.
    outlined(g, fade(g, 0, y - 4, 0, y + 3, '#d4dae3', '#6e7682'), () => g.roundRect(5, y - 3.4, 20, 6, 1.6), 1.9);
    g.fillStyle = 'rgba(20,24,32,.55)';
    for (const x of [7, 9.4, 11.8]) g.fillRect(x, y - 2.6, 1, 2.6);
    g.fillStyle = 'rgba(255,255,255,.75)';
    g.fillRect(14, y - 2.7, 9.6, 1);
    outlined(g, '#3a3f4a', () => g.roundRect(13, y + 1.8, 7, 3.6, 1.6), 1.2);
    outlined(g, fade(g, 0, y + 1, 0, y + 10, '#9c6a3a', '#5c3a1c'), () => {
      g.moveTo(6, y + 2);
      g.lineTo(13, y + 2);
      g.lineTo(12.4, y + 9.8);
      g.lineTo(6.4, y + 9.8);
      g.closePath();
    }, 1.7);
    line(g, 'rgba(40,22,8,.6)', 0.8, 7.6, y + 4.4, 11.4, y + 4.4);
    line(g, 'rgba(40,22,8,.6)', 0.8, 7.6, y + 6.6, 11.4, y + 6.6);
    g.fillStyle = GOLD;
    g.fillRect(22.6, y - 4.6, 1.8, 1.4);
  }
}

// Legs and boots with a toe pointing forward, the way the newest heroes stand.
function feet(g, pants, shoe, swing, air, w = 5.4, gap = 4.4, hip = -13, sole = null) {
  const up = air ? 3 : 0;
  for (const [x, step, raise] of [[-gap, swing * 0.75, up], [gap, -swing * 0.75, 0]]) {
    limb(g, pants, w, x, hip, x + step, -3.6 - raise);
    outlined(g, shoe, () => {
      g.moveTo(x + step - 3.8, -5.6 - raise);
      g.lineTo(x + step + 1.8, -5.6 - raise);
      g.quadraticCurveTo(x + step + 6.8, -4.6 - raise, x + step + 6.8, -0.4 - raise);
      g.lineTo(x + step - 3.8, -0.4 - raise);
      g.closePath();
    }, 1.6);
    if (sole) {
      g.fillStyle = sole;
      g.fillRect(x + step - 3.2, -1.9 - raise, 9.4, 1.3);
    }
  }
}

// The head every human hero shares, centred on the same spot as the newest ones.
const headShape = (g, light, dark) =>
  outlined(g, fade(g, -8, -50, 10, -30, light, dark), () => {
    g.moveTo(-9.2, -41);
    g.quadraticCurveTo(-9.2, -50.4, 1.5, -50.4);
    g.quadraticCurveTo(12, -50.4, 12, -41);
    g.quadraticCurveTo(11.8, -34.4, 5.2, -31.2);
    g.quadraticCurveTo(1.8, -30.2, -1.6, -31.6);
    g.quadraticCurveTo(-9, -35, -9.2, -41);
    g.closePath();
  });

const blots = (g, color, list) => {
  g.fillStyle = color;
  for (const [x, y, rx, ry, a = 0] of list) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, a, 0, Math.PI * 2);
    g.fill();
  }
};

// A plain sleeve and hand at each side, the far one hanging and the near one reaching for the gun.
function farArm(g, sleeve, hand, w = 4.4) {
  limb(g, sleeve, w, -8, -29, -12, -21, -10, -15);
  outlined(g, hand, () => g.arc(-10, -13.6, 2.3, 0, Math.PI * 2), 1.3);
}
function nearArm(g, sleeve, hand, w = 4.4) {
  limb(g, sleeve, w, 8, -29, 11, -22, 8, -17.6);
  outlined(g, hand, () => g.arc(7.4, -16.6, 2.5, 0, Math.PI * 2), 1.3);
}

// ---------- Heroes ----------

function sniper(g, o, bob, swing, air) {
  const stream = clamp(Math.abs(o.vx) * 0.9, 0, 10);
  const wave = Math.sin(o.t * 0.011) * 1.6;
  feet(g, fade(g, 0, -14, 0, 0, '#65783f', '#384722'), '#2a1f12', swing, air, 6, 4.6, -12, '#120c06');
  // Knee pads.
  for (const [x, s] of [[-4.6, swing * 0.4], [4.6, -swing * 0.4]]) outlined(g, '#a39468', () => g.roundRect(x + s - 3, -8.4, 6, 3.4, 1.2), 1.1);
  g.save();
  g.translate(0, bob);
  // The tail of a scarf in his team's colour, whipping behind him.
  outlined(g, o.color, () => {
    g.moveTo(-6, -32);
    g.quadraticCurveTo(-15 - stream * 0.5, -31 + wave, -23 - stream, -25 - wave);
    g.lineTo(-20 - stream, -20 - wave);
    g.quadraticCurveTo(-13 - stream * 0.4, -26 + wave, -5, -27);
    g.closePath();
  }, 1.8);
  farArm(g, fade(g, 0, -30, 0, -14, '#7f9550', '#566a32'), '#3a2a18');
  // A camouflage smock, with blots of darker and paler green.
  outlined(g, fade(g, 0, -33, 0, -8, '#83994f', '#5a6e33'), () => {
    g.moveTo(-10.6, -32);
    g.quadraticCurveTo(0, -35, 10.6, -32);
    g.quadraticCurveTo(12, -20, 10.8, -9);
    g.lineTo(-10.8, -9);
    g.quadraticCurveTo(-12, -20, -10.6, -32);
    g.closePath();
  });
  blots(g, '#46582a', [[-6.4, -26, 3, 2, 0.4], [6, -14, 3.4, 2.2, -0.3], [-5, -13, 2.4, 1.6]]);
  blots(g, '#a4b56a', [[6, -28, 2.2, 1.4, 0.3], [-1, -17, 2, 1.2, -0.4]]);
  // Chest rig: a dark plate with two pouches, and a belt of long gold rounds across it.
  outlined(g, fade(g, 0, -30, 0, -14, '#3b4526', '#232b16'), () => g.roundRect(-7.4, -28.6, 14.8, 15, 3), 1.7);
  for (const x of [-5.8, 0.6]) {
    outlined(g, '#56663a', () => g.roundRect(x, -21, 5.2, 6.2, 1.2), 1.1);
    line(g, '#232b16', 0.9, x + 0.8, -19.2, x + 4.4, -19.2);
  }
  line(g, '#5c3d1c', 2.4, -8, -30, 7.6, -22);
  for (let i = 0; i < 5; i++) {
    g.save();
    g.translate(-6 + i * 3, -28.6 + i * 1.5);
    g.rotate(-1.1);
    outlined(g, GOLD, () => g.roundRect(-0.8, -2.8, 1.6, 4.6, 0.6), 0.7);
    g.restore();
  }
  outlined(g, '#2c2214', () => g.roundRect(-11, -12.6, 22, 3.8, 1.2), 1.6);
  outlined(g, GOLD, () => g.roundRect(-1.8, -13.2, 4.2, 5, 1), 1.1);
  nearArm(g, fade(g, 0, -30, 0, -14, '#8ba258', '#5f7437'), '#3a2a18');
  // The scarf, wrapped round his neck.
  outlined(g, o.color, () => g.roundRect(-7.4, -34.6, 16, 5.8, 2.4), 1.8);
  line(g, 'rgba(0,0,0,.25)', 1, -5.4, -32, 6.4, -31);
  headShape(g, '#f6cfa8', '#dca97e');
  oneEye(g, -1, -40);
  // A strap round his head holds the scope over one eye.
  line(g, '#2c2214', 1.6, -9, -45, 3, -44);
  outlined(g, fade(g, 2, -46, 12, -36, '#fff0a0', '#b67c1e'), () => g.arc(7.4, -41, 5.6, 0, Math.PI * 2), 1.8);
  outlined(g, fade(g, 4, -44, 10, -38, '#6ec8ff', '#0e2e4e'), () => g.arc(7.4, -41, 3.5, 0, Math.PI * 2), 1.1);
  spot(g, '#fff', 6, -42.6, 1.1);
  // A green beret, pulled to one side, with a gold badge and leaves tucked into it.
  outlined(g, fade(g, -10, -56, 10, -46, '#54693a', '#2c3a1d'), () => {
    g.moveTo(-12, -44.6);
    g.bezierCurveTo(-18, -55, -6, -60, 4, -57);
    g.quadraticCurveTo(13, -54, 12.4, -46.4);
    g.quadraticCurveTo(0, -48.6, -12, -44.6);
    g.closePath();
  });
  line(g, '#1f2a14', 2, -11.6, -44.8, 12, -46.2);
  outlined(g, fade(g, 0, -55, 0, -49, '#fff1b8', '#c98a1e'), () => g.arc(-4.4, -51.6, 2.6, 0, Math.PI * 2), 1.1);
  for (const [x, y, a] of [[-12, -51, -0.8], [-15, -48, -1.2], [-8, -56, -0.3]]) {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    outlined(g, '#7f9f45', () => g.ellipse(0, -3, 1.5, 3.4, 0, 0, Math.PI * 2), 0.9);
    g.restore();
  }
  g.restore();
}

function trapper(g, o, bob, swing, air) {
  feet(g, fade(g, 0, -14, 0, 0, '#6e4826', '#40280f'), '#2e1c0d', swing, air, 6, 4.6, -12, '#150c05');
  // Fur cuffs on the boots.
  for (const [x, s, up] of [[-4.6, swing * 0.75, air ? 3 : 0], [4.6, -swing * 0.75, 0]]) outlined(g, '#c9b390', () => g.roundRect(x + s - 4, -8.4 - up, 8, 3, 1.4), 1.1);
  g.save();
  g.translate(0, bob);
  // A net rolled up on his back. It's what he throws, so it's gone during the throw.
  if (!o.skin) {
    outlined(g, fade(g, -22, -30, -6, -8, '#ddc48c', '#9c7f46'), () => g.arc(-14, -19, 10.5, 0, Math.PI * 2), 1.9);
    g.strokeStyle = '#7a5f2e';
    g.lineWidth = 0.9;
    g.beginPath();
    for (let i = -8; i <= 8; i += 4) {
      g.moveTo(-23, -19 + i);
      g.lineTo(-5, -19 - i);
      g.moveTo(-23, -19 - i);
      g.lineTo(-5, -19 + i);
    }
    g.stroke();
    outlined(g, '#c9963a', () => g.arc(-14, -19, 2.4, 0, Math.PI * 2), 1);
  }
  farArm(g, fade(g, 0, -30, 0, -14, '#b57c42', '#7e5028'), '#e0ab7e');
  // A buckskin jacket with a fringe along the hem.
  outlined(g, fade(g, 0, -33, 0, -7, '#c88c50', '#8c5a2c'), () => {
    g.moveTo(-10.6, -32);
    g.quadraticCurveTo(0, -35, 10.6, -32);
    g.quadraticCurveTo(12, -20, 11, -8);
    g.lineTo(-11, -8);
    g.quadraticCurveTo(-12, -20, -10.6, -32);
    g.closePath();
  });
  g.strokeStyle = '#7a4c22';
  g.lineWidth = 1;
  g.beginPath();
  for (let x = -10; x <= 10; x += 2.5) {
    g.moveTo(x, -8.4);
    g.lineTo(x + 0.3, -4.4);
  }
  g.stroke();
  // Open front with a dark shirt, a yoke of fringe, and a coil of rope.
  outlined(g, '#4b3a26', () => {
    g.moveTo(-3, -33);
    g.lineTo(4, -33);
    g.lineTo(2, -14);
    g.lineTo(-1, -14);
    g.closePath();
  }, 1.2);
  line(g, '#7a4c22', 1.2, -10, -27, -3, -29);
  line(g, '#7a4c22', 1.2, 4, -29, 10.6, -27);
  g.strokeStyle = '#7a4c22';
  g.lineWidth = 0.8;
  g.beginPath();
  for (const x of [-9, -7, -5, 6, 8, 10]) {
    g.moveTo(x, x < 0 ? -27.4 : -27.6);
    g.lineTo(x, x < 0 ? -24.4 : -24.6);
  }
  g.stroke();
  for (let i = 0; i < 3; i++) {
    g.strokeStyle = INK;
    g.lineWidth = 2.8;
    g.beginPath();
    g.ellipse(-8.6, -8.6 + i * 1.2, 4.2, 2.6, 0, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = '#e8d4a2';
    g.lineWidth = 1.2;
    g.stroke();
  }
  outlined(g, o.color, () => g.roundRect(-11, -15.4, 22, 4.2, 1.6), 1.7);
  outlined(g, fade(g, 0, -16, 0, -10, '#fff1b8', '#b67c1e'), () => g.roundRect(-2, -16, 4.6, 5.4, 1), 1.1);
  // A little powder horn on a cord.
  outlined(g, '#efe2c4', () => {
    g.moveTo(5.8, -24);
    g.quadraticCurveTo(11, -23, 9, -17.6);
    g.quadraticCurveTo(8, -21, 5, -21);
    g.closePath();
  }, 1);
  nearArm(g, fade(g, 0, -30, 0, -14, '#c98f52', '#8c5a2c'), '#e6b488');
  outlined(g, '#d8a070', () => g.roundRect(-2.4, -34, 7, 4.6, 2), 1.3);
  headShape(g, '#f0bc8e', '#cf9264');
  eyes(g, -41.5, 3.4);
  // A wide leather hat with a dent in the crown, his team's colour for a band, and a feather.
  outlined(g, fade(g, 0, -62, 0, -48, '#9a6a34', '#5e3a18'), () => {
    g.moveTo(-9, -48);
    g.bezierCurveTo(-10, -60, -5, -62, 1, -58.6);
    g.bezierCurveTo(6, -62, 12, -60, 11, -48);
    g.closePath();
  });
  outlined(g, o.color, () => g.roundRect(-9.4, -51.6, 21, 4, 1), 1.4);
  outlined(g, fade(g, 0, -52, 0, -43, '#8a5c2c', '#54320f'), () => {
    g.moveTo(-21, -46.6);
    g.quadraticCurveTo(0, -52, 23, -46.6);
    g.quadraticCurveTo(14, -43.6, 1, -44);
    g.quadraticCurveTo(-12, -43.6, -21, -46.6);
    g.closePath();
  }, 2);
  line(g, 'rgba(255,230,180,.45)', 1, -15, -47.6, -2, -49.4);
  outlined(g, '#f5f1e4', () => {
    g.moveTo(-8, -52);
    g.quadraticCurveTo(-16, -56, -21, -66);
    g.quadraticCurveTo(-11, -64, -5.4, -53);
    g.closePath();
  }, 1.1);
  line(g, '#b9412a', 1, -18, -63, -12, -58);
  g.restore();
}

function ninja(g, o, bob, swing, air) {
  const wave = Math.sin(o.t * 0.012) * 2.6;
  const stream = clamp(Math.abs(o.vx) * 0.8, 0, 9);
  const cloth = fade(g, 0, -14, 0, 0, '#3b4058', '#1b1e2e');
  feet(g, cloth, '#10121c', swing, air, 5.6, 4.4, -12, '#40465c');
  // Shin wraps, in pale cloth.
  for (const [x, s, up] of [[-4.4, swing * 0.5, air ? 3 : 0], [4.4, -swing * 0.5, 0]]) {
    line(g, '#c7ccd8', 1, x + s - 2.6, -9.6 - up, x + s + 2.6, -8.4 - up);
    line(g, '#c7ccd8', 1, x + s - 2.6, -7.6 - up, x + s + 2.6, -6.4 - up);
  }
  g.save();
  g.translate(0, bob);
  // A katana slung across the back: bright blade, gold guard, red wrapped grip.
  g.save();
  g.translate(-7, -24);
  g.rotate(-0.92);
  outlined(g, fade(g, -3, 0, 3, 0, '#ffffff', '#9aa4b4'), () => {
    g.moveTo(-2, -2);
    g.lineTo(2, -2);
    g.lineTo(2, -28);
    g.lineTo(0, -33);
    g.lineTo(-2, -30);
    g.closePath();
  }, 1.5);
  outlined(g, GOLD, () => g.roundRect(-4.4, -3, 8.8, 3, 1), 1.2);
  outlined(g, '#a01c2c', () => g.roundRect(-1.9, -0.2, 3.8, 12, 1), 1.3);
  for (const y of [2.2, 5, 7.8]) line(g, '#f0d8c0', 0.8, -1.6, y, 1.6, y + 1.2);
  outlined(g, GOLD, () => g.arc(0, 13, 2, 0, Math.PI * 2), 1);
  g.restore();
  farArm(g, fade(g, 0, -30, 0, -14, '#343950', '#1f2233'), '#10121c', 4.2);
  // Dark layered jacket crossed at the chest, with mail showing at the neck.
  outlined(g, fade(g, 0, -33, 0, -8, '#3a3f58', '#1a1d2c'), () => {
    g.moveTo(-10, -32);
    g.quadraticCurveTo(0, -35, 10, -32);
    g.quadraticCurveTo(10.6, -21, 8.4, -9);
    g.lineTo(-8.4, -9);
    g.quadraticCurveTo(-10.6, -21, -10, -32);
    g.closePath();
  });
  outlined(g, '#6b7286', () => {
    g.moveTo(-3, -33);
    g.lineTo(5, -33);
    g.lineTo(1, -25);
    g.closePath();
  }, 1.1);
  g.strokeStyle = '#3b4058';
  g.lineWidth = 0.6;
  g.beginPath();
  for (let i = 0; i < 4; i++) {
    g.moveTo(-3 + i * 2, -33);
    g.lineTo(-1 + i * 1, -26);
  }
  g.stroke();
  line(g, '#6b7286', 1.6, -7.6, -31, 4.4, -16);
  line(g, '#6b7286', 1.6, 8, -31, 1.4, -22);
  // A steel plate on one shoulder.
  outlined(g, fade(g, 4, -36, 13, -26, '#b5bdcc', '#5d6578'), () => g.roundRect(5.4, -33.6, 7.4, 6, 2.2), 1.4);
  // His sash, in his team's colour, knotted at the side, with a throwing star tucked in.
  outlined(g, o.color, () => g.roundRect(-9.4, -15.6, 18.8, 4.4, 1.6), 1.7);
  outlined(g, o.color, () => {
    g.moveTo(-8, -13);
    g.lineTo(-14, -6 + wave * 0.4);
    g.lineTo(-10.6, -5.4 + wave * 0.4);
    g.lineTo(-6, -11.6);
    g.closePath();
  }, 1.3);
  star(g, 3.6, -13.4, 4.4, INK);
  star(g, 3.6, -13.4, 3.1, '#d8dde6');
  // Arm wraps at the wrist.
  nearArm(g, fade(g, 0, -30, 0, -14, '#3e4360', '#22253a'), '#10121c', 4.2);
  line(g, '#c7ccd8', 1, 8.4, -22, 12, -21);
  line(g, '#c7ccd8', 1, 8, -20, 11.4, -19);
  // A full hood, with only a slit for the eyes.
  outlined(g, fade(g, -10, -52, 10, -30, '#32374e', '#14172a'), () => {
    g.moveTo(-10, -41);
    g.quadraticCurveTo(-10, -52, 1.5, -52);
    g.quadraticCurveTo(13, -52, 13, -41);
    g.quadraticCurveTo(12.6, -33, 5, -30);
    g.quadraticCurveTo(1.8, -29.2, -2, -30.4);
    g.quadraticCurveTo(-9.6, -34, -10, -41);
    g.closePath();
  });
  outlined(g, fade(g, 0, -45, 0, -36, '#f8d4ac', '#dfae84'), () => g.roundRect(-5, -45, 17, 8.8, 3.6), 1.3);
  eyes(g, -42.6, 3.8);
  line(g, 'rgba(120,130,160,.5)', 1, -7, -36, -2, -31.4);
  // His headband and its long tails. They come off during Smoke Step.
  if (o.skin) {
    g.restore();
    return;
  }
  outlined(g, o.color, () => g.roundRect(-10.6, -49.6, 24, 4.2, 1.4), 1.6);
  outlined(g, fade(g, 0, -50, 0, -46, '#e4e9f0', '#8a93a6'), () => g.roundRect(1, -49.2, 7.6, 3.4, 0.8), 0.9);
  spot(g, INK, 4.8, -47.5, 0.9);
  for (const [dy, reach] of [[0, 1], [3, 0.8]]) {
    outlined(g, o.color, () => {
      g.moveTo(-10, -48 + dy);
      g.quadraticCurveTo(-18 - stream * reach, -50 + dy + wave, -29 * reach - stream, -44 + dy - wave);
      g.lineTo(-27 * reach - stream, -41 + dy - wave);
      g.quadraticCurveTo(-18 - stream * 0.6, -45 + dy + wave, -10, -45 + dy);
      g.closePath();
    }, 1.4);
  }
  g.restore();
}

function sprinter(g, o, bob, swing, air) {
  // Racing tights and red shoes with white soles, running twice as wide as anyone else's.
  feet(g, fade(g, 0, -14, 0, 0, '#3f51bb', '#222d78'), fade(g, 0, -6, 0, 0, '#ff5a44', '#c21f12'), swing * 1.4, air, 5.2, 4.2, -12, '#ffffff');
  // White stripes down the legs.
  for (const [x, s, up] of [[-4.2, swing * 0.5, air ? 1.5 : 0], [4.2, -swing * 0.5, 0]]) line(g, '#ffe14a', 1, x + s + 1.2, -11, x + s + 1.8, -5 - up);
  g.save();
  g.translate(0, bob);
  // A short flying cape of pure speed, in his team's colour.
  const stream = clamp(Math.abs(o.vx) * 0.9, 0, 11);
  outlined(g, o.color, () => {
    g.moveTo(-7, -31);
    g.quadraticCurveTo(-16 - stream, -27, -21 - stream, -16);
    g.lineTo(-13 - stream * 0.6, -19);
    g.quadraticCurveTo(-11, -14, -9, -12);
    g.quadraticCurveTo(-7, -22, -5, -28);
    g.closePath();
  }, 1.7);
  farArm(g, fade(g, 0, -30, 0, -14, '#ffd63a', '#e09a12'), '#ffffff');
  // A bright racing top, with blue sides and a bolt across the chest.
  outlined(g, fade(g, 0, -33, 0, -9, '#ffe24a', '#f2ac1a'), () => {
    g.moveTo(-9.6, -32);
    g.quadraticCurveTo(0, -35, 9.6, -32);
    g.quadraticCurveTo(10.4, -21, 8.4, -9);
    g.lineTo(-8.4, -9);
    g.quadraticCurveTo(-10.4, -21, -9.6, -32);
    g.closePath();
  });
  g.fillStyle = '#2d3a9c';
  g.beginPath();
  g.moveTo(-9.6, -29);
  g.lineTo(-6.6, -29);
  g.lineTo(-5.6, -9.6);
  g.lineTo(-8.2, -9.6);
  g.closePath();
  g.moveTo(9.6, -29);
  g.lineTo(6.6, -29);
  g.lineTo(5.6, -9.6);
  g.lineTo(8.2, -9.6);
  g.closePath();
  g.fill();
  outlined(g, fade(g, 0, -30, 0, -13, '#ff5a44', '#c21f12'), () => {
    g.moveTo(3, -30);
    g.lineTo(-4.4, -20);
    g.lineTo(0, -20);
    g.lineTo(-2.4, -12);
    g.lineTo(5, -23);
    g.lineTo(1, -23);
    g.closePath();
  }, 1.2);
  outlined(g, o.color, () => g.roundRect(-9, -13, 18, 3.6, 1.4), 1.6);
  nearArm(g, fade(g, 0, -30, 0, -14, '#ffe24a', '#f0a816'), '#ffffff');
  outlined(g, o.color, () => g.roundRect(8.2, -21.4, 5.2, 3, 1), 1.1);
  outlined(g, '#eab484', () => g.roundRect(-2.4, -34.4, 7, 4.6, 2), 1.3);
  headShape(g, '#ffdcb2', '#f0b888');
  // Spiky hair swept back hard. Under the boost it burns yellow.
  const hair = o.skin ? fade(g, -18, -60, 10, -44, '#fffbb0', '#ffe04a', '#ffae1a') : fade(g, -18, -60, 10, -44, '#ffb25a', '#ff7a1a', '#d4470a');
  outlined(g, hair, () => {
    g.moveTo(-9.6, -36);
    g.lineTo(-22, -40);
    g.lineTo(-13, -44);
    g.lineTo(-26, -51);
    g.lineTo(-13, -51);
    g.lineTo(-21, -61);
    g.lineTo(-7, -55);
    g.lineTo(-8, -65);
    g.lineTo(1, -56);
    g.lineTo(6, -62);
    g.lineTo(8, -54);
    g.quadraticCurveTo(13, -52, 13.4, -44);
    g.lineTo(0, -46);
    g.quadraticCurveTo(-6, -44, -6, -36);
    g.closePath();
  });
  line(g, 'rgba(255,255,255,.7)', 1.1, -12, -50, -2, -49);
  line(g, 'rgba(255,255,255,.55)', 1, -8, -56, -2, -51);
  // Racing goggles, with his eyes behind the glass and a strap in his team's colour.
  line(g, o.color, 2.6, -9, -42, 0, -41.4);
  outlined(g, fade(g, 0, -46, 0, -37, '#9df0ff', '#2fb4dc'), () => g.roundRect(-0.6, -45.6, 13.6, 8.4, 3.4), 1.7);
  eyes(g, -43.4, 3.6, 0.8);
  line(g, 'rgba(255,255,255,.8)', 1, 0.6, -39, 3, -44.4);
  // Sparks jump off him while the boost is on.
  if (o.skin) {
    for (const [x, y, s] of [[-20, -32, 4], [19, -46, 3.4], [-14, -6, 3], [20, -28, 2.6]]) star(g, x, y, s, '#fff28a');
  }
  g.restore();
}

function shifter(g, o, bob) {
  // A living blob of jelly with one big eye. It wobbles because it's never quite one shape.
  const wob = Math.sin(o.t * 0.008) * 1.5;
  const rip = Math.sin(o.t * 0.013);
  const body = o.skin ? fade(g, -10, -48, 8, 0, '#d8fff4', '#8df0d8', '#3fd4b6') : fade(g, -10, -48, 8, 0, '#8ff5dc', '#2ec4a6', '#0f7f78');
  g.save();
  // A paler ghost of its shape behind, so it looks like there's depth to the jelly.
  outlined(g, o.skin ? '#7ae0c8' : '#117a72', () => {
    g.moveTo(-18 - wob, -2);
    g.quadraticCurveTo(-20 - wob, -30 + bob, -7, -45 + bob);
    g.quadraticCurveTo(1, -52 + bob + wob, 10, -45 + bob);
    g.quadraticCurveTo(20 + wob, -28 + bob, 18 + wob, -2);
    g.closePath();
  }, 1.6);
  // A dripping hem and the main body.
  outlined(g, body, () => {
    g.moveTo(-15 - wob, -3);
    g.quadraticCurveTo(-17 - wob, -28 + bob, -6, -42 + bob);
    g.quadraticCurveTo(1, -50 + bob + wob, 9, -42 + bob);
    g.quadraticCurveTo(18 + wob, -26 + bob, 15 + wob, -3);
    g.quadraticCurveTo(13 + wob, 1 + rip, 10, -2);
    g.quadraticCurveTo(7, 2 - rip, 3, -1.6);
    g.quadraticCurveTo(0, 1 + rip, -3, -1.6);
    g.quadraticCurveTo(-7, 2 - rip, -10, -2);
    g.quadraticCurveTo(-13 - wob, 1 + rip, -15 - wob, -3);
    g.closePath();
  });
  // Light on its skin, and bubbles rising inside.
  g.fillStyle = 'rgba(255,255,255,.42)';
  g.beginPath();
  g.ellipse(-6, -31 + bob, 3, 9, 0.32, 0, Math.PI * 2);
  g.fill();
  spot(g, 'rgba(255,255,255,.7)', -3, -39 + bob, 1.6);
  for (const [x, y, r] of [[-8, -17, 2.4], [-3, -9, 1.5], [8, -12, 2], [11, -20, 1.2], [-11, -9, 1.2]]) {
    g.strokeStyle = 'rgba(235,255,250,.75)';
    g.lineWidth = 0.9;
    g.beginPath();
    g.arc(x, y + bob - (o.t * 0.002 % 1) * 2, r, 0, Math.PI * 2);
    g.stroke();
    spot(g, 'rgba(255,255,255,.8)', x - r * 0.3, y + bob - r * 0.4, r * 0.25);
  }
  // A swirl deep in the jelly.
  g.strokeStyle = 'rgba(8,80,76,.5)';
  g.lineWidth = 1.4;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(0, -7 + bob, 4.6, 0.3 + wob * 0.2, 4.4 + wob * 0.2);
  g.stroke();
  g.lineCap = 'butt';
  // A belt in its team's colour, sunk in the jelly, with a gold buckle.
  outlined(g, o.color, () => g.roundRect(-15.4, -14 + bob, 30.8, 4.4, 1.6), 1.7);
  outlined(g, fade(g, 0, -15, 0, -9, '#fff1b8', '#b67c1e'), () => g.roundRect(-2.6, -14.8 + bob, 5.6, 6, 1.2), 1.1);
  // A stubby arm of jelly reaches out to hold the gun.
  outlined(g, body, () => {
    g.moveTo(11, -24 + bob);
    g.quadraticCurveTo(18, -23 + bob, 13, -15 + bob);
    g.quadraticCurveTo(10, -16 + bob, 9, -18 + bob);
    g.closePath();
  }, 1.6);
  // The one big eye, with a heavy lid of jelly over it.
  outlined(g, fade(g, 0, -40, 0, -21, '#ffffff', '#d8efe9'), () => g.ellipse(4, -30 + bob, 9.2, 10, 0, 0, Math.PI * 2), 2);
  g.fillStyle = '#0e7a6e';
  g.beginPath();
  g.ellipse(6, -30 + bob, 5.2, 7, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = INK;
  g.beginPath();
  g.ellipse(6, -30 + bob, 3.4, 5.4, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(7.2, -32.6 + bob, 1.5, 0, Math.PI * 2);
  g.fill();
  spot(g, 'rgba(255,255,255,.65)', 4.4, -27.4 + bob, 0.7);
  g.restore();
}

function santa(g, o, bob, swing, air) {
  feet(g, fade(g, 0, -14, 0, 0, '#c8301f', '#8a160e'), fade(g, 0, -6, 0, 0, '#34363c', '#111216'), swing, air, 7, 5.4, -12, '#050506');
  // White fur at the top of each boot.
  for (const [x, s, up] of [[-5.4, swing * 0.75, air ? 3 : 0], [5.4, -swing * 0.75, 0]]) outlined(g, '#fff6e6', () => g.roundRect(x + s - 4.6, -8.8 - up, 9.2, 3.4, 1.6), 1.2);
  g.save();
  g.translate(0, bob);
  // A sack of gifts over his shoulder, with a gold ribbon. It's empty during the throw, so it's gone.
  if (!o.skin) {
    outlined(g, fade(g, -28, -36, -8, -10, '#b28048', '#6c441f'), () => {
      g.moveTo(-14, -35);
      g.bezierCurveTo(-30, -33, -33, -14, -22, -9);
      g.quadraticCurveTo(-12, -6, -8, -14);
      g.closePath();
    }, 2);
    line(g, 'rgba(50,28,8,.55)', 1, -22, -30, -26, -14);
    line(g, 'rgba(255,230,180,.4)', 1.2, -25, -29, -28, -19);
    outlined(g, GOLD, () => g.roundRect(-17, -36.4, 7, 4, 1.4), 1.1);
  }
  limb(g, fade(g, 0, -30, 0, -14, '#e2382a', '#a81d12'), 6, -11, -28, -15, -20, -12, -14);
  outlined(g, '#fff6e6', () => g.roundRect(-16, -15.4, 7.6, 3, 1.4), 1.1);
  outlined(g, '#fff6e6', () => g.arc(-12, -11.8, 2.8, 0, Math.PI * 2), 1.3);
  // A round red coat with a white trim down the front and along the hem.
  outlined(g, fade(g, -14, -32, 14, -8, '#ee4432', '#a81d12'), () => {
    g.moveTo(-12, -30);
    g.quadraticCurveTo(0, -34, 12, -30);
    g.quadraticCurveTo(18, -18, 15, -7);
    g.lineTo(-15, -7);
    g.quadraticCurveTo(-18, -18, -12, -30);
    g.closePath();
  });
  outlined(g, '#fff6e6', () => g.roundRect(-16, -9.6, 32, 4.8, 2.2), 1.6);
  outlined(g, '#fff6e6', () => g.roundRect(-2, -30, 5.6, 21, 1.6), 1.2);
  for (const y of [-27, -22.4]) outlined(g, GOLD, () => g.arc(0.8, y, 1.2, 0, Math.PI * 2), 0.8);
  // Holly on his chest.
  blots(g, '#2e9c44', [[-7, -26, 2.8, 1.5, 0.5], [-3.4, -26, 2.8, 1.5, -0.5]]);
  spot(g, '#d8261c', -5.2, -25, 1.2);
  // A wide belt in his team's colour with a big gold buckle.
  outlined(g, o.color, () => g.roundRect(-16.4, -17.4, 32.8, 5.4, 1.8), 1.8);
  outlined(g, fade(g, 0, -19, 0, -11, '#fff1b8', '#b67c1e'), () => g.roundRect(-3.8, -18.6, 8.6, 7.8, 1.6), 1.3);
  outlined(g, o.color, () => g.roundRect(-1.6, -16.4, 4.2, 3.4, 0.6), 0.8);
  // A striped candy cane stuck in the belt.
  limb(g, '#fff6e6', 1.8, 10, -11, 11, -21);
  g.strokeStyle = '#fff6e6';
  g.lineWidth = 1.8;
  g.beginPath();
  g.arc(13, -21, 2, Math.PI, 0);
  g.stroke();
  limb(g, fade(g, 0, -30, 0, -14, '#ee4432', '#b4200f'), 6, 12, -28, 15, -21, 8, -17);
  outlined(g, '#fff6e6', () => g.roundRect(9.4, -20.8, 6.6, 3, 1.4), 1.1);
  outlined(g, '#fff6e6', () => g.arc(7.2, -16.4, 2.8, 0, Math.PI * 2), 1.3);
  headShape(g, '#ffe0c4', '#f2bc9a');
  eyes(g, -42.4, 3.4);
  // A huge curly white beard: his only face.
  outlined(g, fade(g, 0, -40, 0, -18, '#ffffff', '#e0d8c8'), () => {
    g.moveTo(-10, -37.4);
    g.quadraticCurveTo(-13, -30, -9, -24);
    g.quadraticCurveTo(-7, -18, -2, -20);
    g.quadraticCurveTo(1, -16, 4.6, -19.4);
    g.quadraticCurveTo(10, -18, 11.4, -24.4);
    g.quadraticCurveTo(15, -30, 13, -37);
    g.quadraticCurveTo(10, -33, 2, -33.6);
    g.quadraticCurveTo(-6, -33, -10, -37.4);
    g.closePath();
  }, 2);
  g.strokeStyle = 'rgba(170,150,120,.42)';
  g.lineWidth = 1;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-6, -31);
  g.quadraticCurveTo(-8, -26, -5, -22.6);
  g.moveTo(1, -31);
  g.quadraticCurveTo(-1, -26, 1, -20.6);
  g.moveTo(8, -31);
  g.quadraticCurveTo(10, -26, 7, -22);
  g.stroke();
  g.lineCap = 'butt';
  // Under the hat, or just white hair when it comes off for the throw.
  if (o.skin) {
    outlined(g, fade(g, 0, -56, 0, -44, '#ffffff', '#e0d8c8'), () => {
      g.moveTo(-11, -40);
      g.bezierCurveTo(-14, -52, -6, -56, 2, -55);
      g.bezierCurveTo(11, -55, 16, -50, 13, -41);
      g.quadraticCurveTo(10, -47, 4, -47);
      g.quadraticCurveTo(-5, -47.6, -7, -40);
      g.closePath();
    }, 2);
    g.restore();
    return;
  }
  outlined(g, fade(g, 0, -62, 0, -46, '#ee4432', '#a81d12'), () => {
    g.moveTo(-12, -47);
    g.bezierCurveTo(-8, -62, -4, -67, -14, -66);
    g.quadraticCurveTo(-23, -64, -26, -57);
    g.quadraticCurveTo(-16, -61, -14, -56);
    g.quadraticCurveTo(-13, -52, -13.6, -47);
    g.closePath();
  }, 2);
  outlined(g, fade(g, 0, -62, 0, -46, '#ee4432', '#a81d12'), () => {
    g.moveTo(-12, -47);
    g.bezierCurveTo(-8, -61, 8, -63, 14, -47);
    g.closePath();
  }, 2);
  line(g, 'rgba(255,255,255,.3)', 1.4, -6, -56, 1, -59);
  outlined(g, '#fff6e6', () => g.arc(-26, -55, 4.6, 0, Math.PI * 2), 1.8);
  outlined(g, fade(g, 0, -50, 0, -44, '#ffffff', '#e0d8c8'), () => g.roundRect(-15, -51, 31, 7, 3.4), 1.9);
  g.restore();
}

function dusk(g, o, bob) {
  // A tall witch in ink-dark robes, with a pale crescent mask.
  const wave = (i) => Math.sin(o.t * 0.006 + i * 1.3) * 2;
  // After the ink connects she is a shadow: black robes, a dark mask, and only the eye still bright.
  const shadow = o.skin;
  const robeLight = shadow ? '#0c0e18' : '#2a3a7c';
  const robeDark = shadow ? '#03040a' : '#0e1433';
  // Drops of ink hanging in the air around her.
  for (const [x, y, r, i] of [[-22, -18, 2.4, 0], [20, -8, 1.8, 2], [-26, -36, 1.6, 4], [23, -30, 1.4, 5]]) {
    outlined(g, shadow ? '#000' : '#18224a', () => {
      const dy = wave(i) + bob;
      g.moveTo(x, y - r * 2 + dy);
      g.quadraticCurveTo(x + r * 1.3, y + dy, x, y + r + dy);
      g.quadraticCurveTo(x - r * 1.3, y + dy, x, y - r * 2 + dy);
      g.closePath();
    }, 1);
  }
  // Long hair the colour of night, behind her.
  outlined(g, fade(g, -8, -46, -12, -18, '#233064', '#0c1230'), () => {
    g.moveTo(-8, -44 + bob);
    g.quadraticCurveTo(-18, -36 + bob, -15 + wave(1), -20 + bob);
    g.quadraticCurveTo(-11, -24 + bob, -7, -28 + bob);
    g.closePath();
  }, 1.7);
  // A tattered robe spreading to the floor.
  outlined(g, fade(g, 0, -34, 0, 0, robeLight, robeDark), () => {
    g.moveTo(-8, -33 + bob);
    g.quadraticCurveTo(0, -36 + bob, 8.6, -33 + bob);
    g.quadraticCurveTo(12, -16, 19 + wave(3), 0);
    g.lineTo(13, -4 + wave(2));
    g.lineTo(8, 0);
    g.lineTo(3, -4 + wave(1));
    g.lineTo(-2, 0);
    g.lineTo(-7, -4 + wave(0));
    g.lineTo(-12, 0);
    g.lineTo(-19 + wave(2), 0);
    g.quadraticCurveTo(-12, -16, -8, -33 + bob);
    g.closePath();
  });
  // Stars and a moon sewn into the cloth, and folds of darker ink.
  if (!shadow) {
    star(g, -8, -12, 3.2, '#bfefff');
    star(g, 6, -6, 2.4, '#bfefff');
    star(g, 8, -18 + bob, 2, '#bfefff');
    star(g, -3, -24 + bob, 1.8, '#bfefff');
    g.fillStyle = '#ffe9a0';
    g.beginPath();
    g.arc(0.6, -14, 3, 0.7, 5.6);
    g.arc(2, -14.4, 2.3, 5, 1, true);
    g.closePath();
    g.fill();
  }
  line(g, 'rgba(0,0,10,.4)', 1.2, -5, -22, -10, -3);
  line(g, 'rgba(0,0,10,.4)', 1.2, 5, -22, 10, -3);
  g.save();
  g.translate(0, bob);
  // Long bell sleeves.
  limb(g, fade(g, 0, -30, 0, -16, robeLight, robeDark), 5, -8, -30, -13, -21, -12, -15);
  outlined(g, shadow ? '#0c0e18' : '#e8ecf5', () => g.arc(-12, -13.4, 2, 0, Math.PI * 2), 1.2);
  // A gold moon clasp on a sash in her team's colour.
  outlined(g, o.color, () => g.roundRect(-8.4, -27, 17, 3.6, 1.4), 1.6);
  outlined(g, fade(g, 0, -28, 0, -22, '#fff1b8', '#b67c1e'), () => g.arc(0.2, -25.2, 2.4, 0, Math.PI * 2), 1);
  limb(g, fade(g, 0, -30, 0, -16, robeLight, robeDark), 5, 8.4, -30, 12, -22, 8, -17.6);
  outlined(g, shadow ? '#0c0e18' : '#e8ecf5', () => g.arc(7.2, -16.6, 2.3, 0, Math.PI * 2), 1.2);
  // A high collar behind the head.
  outlined(g, robeDark, () => {
    g.moveTo(-11, -34);
    g.quadraticCurveTo(-13, -42, -9, -46);
    g.lineTo(9, -46);
    g.quadraticCurveTo(14, -42, 12, -34);
    g.closePath();
  }, 1.7);
  // The mask, with a dark crescent cut out of it, and her one eye.
  outlined(g, shadow ? '#1d2438' : fade(g, 0, -50, 0, -28, '#ffffff', '#c4cbdd'), () => g.arc(1, -38.6, 11, 0, Math.PI * 2));
  g.fillStyle = robeDark;
  g.beginPath();
  g.arc(-7.4, -38.6, 10, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 1;
  g.stroke();
  // A little line of runes down the bright side of the mask.
  if (!shadow) {
    g.fillStyle = 'rgba(60,70,110,.55)';
    for (const y of [-33.4, -31]) g.fillRect(6, y, 2.4, 1);
  }
  oneEye(g, 7, -39.6, 0.95, shadow ? '#7fe0ff' : INK);
  // A wide pointed hat, bent over at the tip, with a buckle.
  outlined(g, shadow ? '#03040a' : fade(g, 0, -72, 0, -44, '#293a7a', '#0e1433'), () => {
    g.moveTo(-11, -46);
    g.lineTo(12, -46);
    g.quadraticCurveTo(7, -56, 2, -62);
    g.quadraticCurveTo(-2, -70, -14, -71);
    g.quadraticCurveTo(-7, -66, -7, -58);
    g.closePath();
  });
  outlined(g, shadow ? '#03040a' : fade(g, 0, -48, 0, -42, '#293a7a', '#0a1028'), () => {
    g.moveTo(-20, -44.6);
    g.quadraticCurveTo(1, -50, 22, -44.6);
    g.quadraticCurveTo(1, -41.6, -20, -44.6);
    g.closePath();
  }, 1.8);
  outlined(g, o.color, () => g.roundRect(-9.4, -50.6, 19.4, 3.8, 1.2), 1.4);
  outlined(g, GOLD, () => g.roundRect(-1.8, -51.2, 4.6, 5, 0.8), 1);
  if (!shadow) star(g, -5, -60, 2.4, '#bfefff');
  g.restore();
}

// An arm or a leg: a thick line with a dark edge, rounded at both ends. Takes x, y, x, y...
function limb(g, color, width, ...pts) {
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.strokeStyle = INK;
  g.lineWidth = width + 2.6;
  g.stroke();
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
  g.lineCap = 'butt';
  g.lineJoin = 'miter';
}

const fade = (g, x0, y0, x1, y1, ...colors) => {
  const paint = g.createLinearGradient(x0, y0, x1, y1);
  colors.forEach((c, i) => paint.addColorStop(i / (colors.length - 1), c));
  return paint;
};

const spot = (g, color, x, y, r) => {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
};

const line = (g, color, width, ...pts) => {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.stroke();
  g.lineCap = 'butt';
};

// One thick, flowing lock of hair, from its root to a rounded tip.
function lock(g, fill, x0, y0, cx, cy, x1, y1, w) {
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x0, y0);
  g.quadraticCurveTo(cx, cy, x1, y1);
  g.strokeStyle = INK;
  g.lineWidth = w * 1.3 + 2.6;
  g.stroke();
  g.strokeStyle = fill;
  g.lineWidth = w * 1.3;
  g.stroke();
  g.lineCap = 'butt';
}

// ---------- Aquilles: a Greek hero, bare-chested, with long golden hair ----------

function bronzeShield(g, x, y, r) {
  outlined(g, fade(g, x - r, y - r, x + r, y + r, '#ffe08a', '#c98a2a', '#7a4a14'), () => g.arc(x, y, r, 0, Math.PI * 2), 2.5);
  outlined(g, fade(g, x + r, y - r, x - r, y + r, '#e8b04a', '#8a5518'), () => g.arc(x, y, r * 0.78, 0, Math.PI * 2), 1.6);
  // A band of beads, then a sun at the middle.
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    spot(g, CREAM, x + Math.cos(a) * r * 0.89, y + Math.sin(a) * r * 0.89, r * 0.045);
  }
  outlined(g, '#7a1626', () => g.arc(x, y, r * 0.5, 0, Math.PI * 2), 1.4);
  g.fillStyle = GOLD;
  g.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    const d = r * (i % 2 ? 0.2 : 0.44);
    g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  g.closePath();
  g.fill();
  spot(g, '#fff1b8', x, y, r * 0.13);
  // Light across the top, the way polished bronze catches it.
  g.strokeStyle = 'rgba(255,255,255,.5)';
  g.lineWidth = r * 0.07;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(x, y, r * 0.66, Math.PI * 1.15, Math.PI * 1.6);
  g.stroke();
  g.lineCap = 'butt';
}

function leafTip(g, x, y, angle, size) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  outlined(g, fade(g, 0, -size * 0.3, 0, size * 0.3, '#fff6d8', '#c8a04a'), () => {
    g.moveTo(-size * 0.2, 0);
    g.quadraticCurveTo(size * 0.2, -size * 0.34, size, 0);
    g.quadraticCurveTo(size * 0.2, size * 0.34, -size * 0.2, 0);
    g.closePath();
  }, 1.8);
  line(g, 'rgba(90,54,10,.6)', 1, 0, 0, size * 0.75, 0);
  g.restore();
}

const SPEAR_MUZZLE = 82;

// The spear as a gun: leather grip and breech at the hand, a bronze barrel banded along the shaft, the leaf blade at the muzzle.
function spearGun(g) {
  limb(g, '#6d3f1a', 3.4, -10, 1, 58, -2);
  outlined(g, fade(g, 0, -7, 0, 7, '#f0c668', '#7a4a14'), () => g.roundRect(-2, -6, 26, 11, 3), 2);
  outlined(g, '#3a2212', () => g.roundRect(5, 3, 7, 10, 2), 1.8);
  outlined(g, '#2d2f35', () => g.roundRect(20, -5.5, 36, 7, 2), 1.8);
  for (const x of [26, 36, 46]) {
    g.fillStyle = GOLD;
    g.fillRect(x, -5.5, 3, 7);
  }
  star(g, 10, -7, 4, CREAM);
  leafTip(g, 58, -2, -0.04, 26);
}

function aquilles(g, o, bob, swing, air) {
  const raised = o.skin;
  const stream = clamp(Math.abs(o.vx) * 0.9, 0, 12);
  const wave = Math.sin(o.t * 0.012) * 2;
  const skinTone = fade(g, -14, -34, 14, -6, '#f6c897', '#d9925c');

  // Spear and shield slung across his back. Both leave it when the guard goes up.
  if (!raised) {
    limb(g, '#6d3f1a', 2.6, -38, 4, 18, -66);
    leafTip(g, 18, -66, -0.9, 13);
    bronzeShield(g, -14, -26 + bob, 18);
  }

  // Long golden hair falling behind him, streaming out as he runs.
  g.save();
  g.translate(0, bob);
  outlined(g, fade(g, 0, -52, -10, -12, '#fff0a0', '#f2bf3e', '#b9771a'), () => {
    g.moveTo(9, -50);
    g.bezierCurveTo(-4, -56, -17, -52, -18 - stream * 0.4, -40);
    g.bezierCurveTo(-20 - stream * 0.7, -30 + wave, -22 - stream, -22, -21 - stream, -12 + wave);
    g.lineTo(-16 - stream * 0.7, -17);
    g.lineTo(-14 - stream * 0.6, -10 + wave);
    g.lineTo(-10 - stream * 0.3, -19);
    g.lineTo(-7, -13);
    g.quadraticCurveTo(-5, -26, -6, -34);
    g.closePath();
  }, 2);
  line(g, 'rgba(140,84,14,.55)', 1, -12, -44, -15 - stream * 0.5, -26);
  line(g, 'rgba(255,250,210,.7)', 1.1, -6, -48, -11, -34);
  g.restore();

  // Bare legs, with bronze greaves and sandal straps.
  const lift = air ? 3 : 0;
  for (const [x, step, up] of [[-5, swing * 0.7, lift], [5, -swing * 0.7, 0]]) {
    limb(g, skinTone, 6.4, x, -12, x + step, -3 - up);
    outlined(g, fade(g, x + step - 4, 0, x + step + 4, 0, '#ffe08a', '#a86c1c'), () => g.roundRect(x + step - 3.6, -8 - up, 7.2, 6, 2), 1.5);
    outlined(g, '#5c3417', () => g.roundRect(x + step - 4, -2.6 - up, 9.4, 2.8, 1.2), 1.4);
  }

  g.save();
  g.translate(0, bob);
  // The far arm, with a gold band.
  limb(g, skinTone, 5.4, -11, -28, -14, -18, -11, -12);
  outlined(g, GOLD, () => g.roundRect(-16.4, -23, 5.6, 3.2, 1), 1.2);

  // A broad bare chest narrowing to the waist.
  outlined(g, skinTone, () => {
    g.moveTo(-13, -31);
    g.quadraticCurveTo(0, -35, 13, -31);
    g.quadraticCurveTo(13, -21, 8.5, -13);
    g.lineTo(-8.5, -13);
    g.quadraticCurveTo(-13, -21, -13, -31);
    g.closePath();
  });
  // Chest and stomach muscles, drawn with a few soft lines.
  const crease = 'rgba(122,62,22,.62)';
  g.strokeStyle = crease;
  g.lineWidth = 1.2;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-9, -24.5);
  g.quadraticCurveTo(-3.6, -21.5, 0.2, -25);
  g.quadraticCurveTo(4, -21.5, 9, -24.5);
  g.moveTo(0.2, -30);
  g.lineTo(0.2, -14.5);
  for (const y of [-20.6, -17.6]) {
    g.moveTo(-4.8, y);
    g.lineTo(5.2, y);
  }
  g.stroke();
  g.lineCap = 'butt';
  g.fillStyle = 'rgba(255,240,210,.34)';
  g.beginPath();
  g.ellipse(-5, -27.6, 3.4, 2, -0.2, 0, Math.PI * 2);
  g.ellipse(5.4, -27.6, 3.2, 1.9, 0.2, 0, Math.PI * 2);
  g.fill();

  // Fighting shorts of red leather, gold-edged, on a belt in his team's colour.
  outlined(g, fade(g, 0, -15, 0, -5, '#a32a2a', '#5e1418'), () => {
    g.moveTo(-9.5, -14);
    g.lineTo(9.5, -14);
    g.lineTo(11, -6);
    g.lineTo(1.6, -6);
    g.lineTo(0, -9);
    g.lineTo(-1.6, -6);
    g.lineTo(-11, -6);
    g.closePath();
  }, 2);
  line(g, GOLD, 1.1, -10, -6.9, -2, -6.9);
  line(g, GOLD, 1.1, 2, -6.9, 10, -6.9);
  outlined(g, o.color, () => g.roundRect(-10.5, -16, 21, 4, 1.6), 1.8);
  outlined(g, GOLD, () => g.arc(0.2, -14, 2.8, 0, Math.PI * 2), 1.2);

  // The arm that holds the weapon.
  limb(g, skinTone, 5.4, 11, -28, 13, -20, 7, -17);
  outlined(g, GOLD, () => g.roundRect(9.4, -24.6, 5.6, 3.2, 1), 1.2);

  // Neck and head, with a strong jaw.
  outlined(g, '#e4a772', () => g.roundRect(-3, -33, 8, 6, 2), 1.6);
  outlined(g, fade(g, -8, -50, 10, -28, '#fbd5a6', '#e8ab78'), () => {
    g.moveTo(-9.6, -42);
    g.quadraticCurveTo(-9, -51, 1.5, -51);
    g.quadraticCurveTo(12.6, -51, 12.6, -41);
    g.quadraticCurveTo(12.8, -33, 6, -29.4);
    g.quadraticCurveTo(1.5, -28.4, -2.6, -30.4);
    g.quadraticCurveTo(-9.4, -34, -9.6, -42);
    g.closePath();
  });
  eyes(g, -42);

  // Golden hair over the top, a loose lock at the temple, and a thin gold band.
  outlined(g, fade(g, -8, -56, 8, -42, '#fff5b4', '#f5c544', '#c98a1e'), () => {
    g.moveTo(-11, -38);
    g.bezierCurveTo(-14, -50, -6, -56, 3, -55.5);
    g.bezierCurveTo(11, -55, 15, -50, 13.4, -44);
    g.quadraticCurveTo(8, -48.4, 2.4, -47.4);
    g.quadraticCurveTo(-2, -46.6, -4, -44);
    g.quadraticCurveTo(-5.6, -41, -5.6, -35);
    g.quadraticCurveTo(-9, -33, -11, -38);
    g.closePath();
  }, 2);
  line(g, 'rgba(160,100,16,.6)', 1, -3, -53, 7, -50);
  line(g, 'rgba(160,100,16,.6)', 1, -8, -46, -3, -50.6);
  line(g, 'rgba(255,255,230,.85)', 1.2, 0, -54, 6, -53);
  outlined(g, fade(g, 0, -31, -3, -18, '#fff0a0', '#d99a24'), () => {
    g.moveTo(-7, -36);
    g.quadraticCurveTo(-9.4, -28, -6.4, -20);
    g.quadraticCurveTo(-3.4, -24, -3.4, -33);
    g.closePath();
  }, 1.5);
  g.fillStyle = GOLD;
  g.fillRect(-9, -47.4, 2.4, 2);
  line(g, GOLD, 1.5, -8.6, -46.8, 2.4, -48.8, 12.6, -45.8);
  g.restore();
}

// ---------- Seedea: a water spirit, her hair and gown made of the sea ----------

function seedea(g, o, bob, swing, air) {
  const flow = Math.sin(o.t * 0.006);
  const up = o.skin;
  const skinTone = fade(g, -8, -50, 10, -26, '#eafcfb', '#bfe9ee');
  g.save();
  g.translate(0, bob);

  // Hair of running water, falling behind her. While her fall stands, it lifts like a wave breaking upward.
  const hairTone = fade(g, 8, -60, -14, up ? -74 : -6, '#c8faff', '#46cfe9', '#1578bd');
  outlined(g, hairTone, () => {
    g.moveTo(10, -47);
    if (up) {
      g.bezierCurveTo(3, -60, -12, -60, -15, -47);
      g.quadraticCurveTo(-14, -38, -7, -32);
    } else {
      g.bezierCurveTo(3, -60, -14, -60, -17, -46);
      g.bezierCurveTo(-18 + flow, -36, -24 + flow, -30, -23 + flow * 2, -18);
      g.quadraticCurveTo(-24 + flow * 2, -11, -29 + flow * 2, -8);
      g.quadraticCurveTo(-21, -7, -16 + flow, -13);
      g.quadraticCurveTo(-16 + flow, -9, -11, -6);
      g.quadraticCurveTo(-10, -13, -7, -22);
    }
    g.lineTo(-6, -36);
    g.closePath();
  });
  if (up) {
    lock(g, hairTone, -8, -50, -12, -66, -8 + flow, -77, 4.4);
    lock(g, hairTone, -11, -46, -24, -58, -33, -73 + flow, 4.6);
    lock(g, hairTone, -11, -40, -28, -44, -42, -57 + flow, 4.4);
    lock(g, hairTone, -8, -35, -26, -30, -38, -38 + flow, 3.8);
  } else {
    g.strokeStyle = 'rgba(235,255,255,.8)';
    g.lineWidth = 1.3;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-10, -50);
    g.quadraticCurveTo(-15, -40, -17 + flow, -24);
    g.moveTo(-8, -40);
    g.quadraticCurveTo(-11, -30, -13 + flow, -18);
    g.stroke();
    g.lineCap = 'butt';
  }
  // Bubbles caught in it.
  for (const [x, y, r] of up ? [[-14, -68, 2], [-22, -58, 1.5], [-26, -46, 1.6], [-34, -66, 1.3], [-2, -70, 1.6]] : [[-19 + flow, -32, 1.8], [-14, -22, 1.4], [-21 + flow, -18, 1.2]]) {
    g.strokeStyle = 'rgba(255,255,255,.95)';
    g.lineWidth = 0.9;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.stroke();
    spot(g, '#fff', x - r * 0.3, y - r * 0.35, r * 0.28);
  }

  // Bare feet under the gown.
  const lift = air ? 2.5 : 0;
  for (const [x, step] of [[-4, swing * 0.8], [5, -swing * 0.8]]) {
    outlined(g, '#cdeff1', () => g.ellipse(x + step + 1, -2 - bob - lift, 4, 2.2, 0, 0, Math.PI * 2), 1.4);
  }

  // The far arm.
  limb(g, '#cdeff1', 3.2, -7, -29, -11, -21, -9, -15);

  // A gown of water: a slim bodice, then a skirt that breaks into waves at the hem.
  const sway = swing * 0.5 + flow * 0.8;
  outlined(g, fade(g, 0, -32, 0, 0, '#a9f0f7', '#39b9de', '#1c7fc4', '#0f4f97'), () => {
    g.moveTo(-6.6, -31);
    g.quadraticCurveTo(0, -33.5, 6.6, -31);
    g.quadraticCurveTo(5.4, -26, 4.6, -23);
    g.quadraticCurveTo(10, -14, 15 + sway, -5);
    g.quadraticCurveTo(13 + sway, -1.5, 9 + sway, -4);
    g.quadraticCurveTo(6 + sway, -1, 2.4 + sway, -3.4);
    g.quadraticCurveTo(-1 + sway, -1, -4.4 + sway, -3.4);
    g.quadraticCurveTo(-8 + sway, -1, -10.6 + sway, -4);
    g.quadraticCurveTo(-14 + sway, -1.5, -15 + sway, -5);
    g.quadraticCurveTo(-10, -14, -4.6, -23);
    g.quadraticCurveTo(-5.4, -26, -6.6, -31);
    g.closePath();
  });
  // Light running down the folds of the skirt, and foam along the hem.
  g.strokeStyle = 'rgba(225,252,255,.7)';
  g.lineWidth = 1.1;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-2, -21);
  g.quadraticCurveTo(-5, -13, -8 + sway, -6);
  g.moveTo(2.4, -20);
  g.quadraticCurveTo(3, -12, 4 + sway, -6);
  g.moveTo(5, -18);
  g.quadraticCurveTo(8, -12, 11 + sway, -7);
  g.stroke();
  g.lineCap = 'butt';
  for (const [x, r] of [[-12, 1.3], [-7, 1], [-1, 1.4], [5, 1], [11, 1.2]]) spot(g, 'rgba(255,255,255,.85)', x + sway, -5.2, r);

  // Sash in her team's colour, with a shell clasp.
  outlined(g, o.color, () => g.roundRect(-6, -25.4, 12, 3.2, 1.4), 1.6);
  outlined(g, '#fff0e0', () => g.arc(0, -23.8, 2.3, 0, Math.PI * 2), 1.1);

  // The arm that holds the gun.
  limb(g, '#d6f4f4', 3.2, 7, -29, 10, -22, 7, -17);
  outlined(g, '#7fe6f2', () => g.roundRect(7.8, -25.6, 4.2, 2.4, 1), 1);

  // Neck, then a pearl necklace, then her face.
  outlined(g, '#cdeff1', () => g.roundRect(-2, -34, 6, 5, 2), 1.4);
  for (const x of [-3.6, -1.2, 1.2, 3.6, 5.8]) spot(g, '#fffdf2', x, -30.4 + Math.abs(x - 1) * -0.12, 0.95);
  outlined(g, skinTone, () => {
    g.moveTo(-9, -41);
    g.quadraticCurveTo(-9, -50, 1.5, -50);
    g.quadraticCurveTo(11.6, -50, 11.6, -41);
    g.quadraticCurveTo(11.4, -34.6, 5.2, -31.4);
    g.quadraticCurveTo(2, -30.4, -1.2, -31.8);
    g.quadraticCurveTo(-8.8, -35, -9, -41);
    g.closePath();
  });
  eyes(g, -41.5);

  // Her fringe, sweeping down one side like a wave.
  outlined(g, fade(g, -8, -56, 10, -38, '#d8fcff', '#57d5ee', '#1f8ccb'), () => {
    g.moveTo(-10.6, -37);
    g.bezierCurveTo(-14, -48, -6, -55, 3, -54.4);
    g.bezierCurveTo(11, -54, 14, -48, 12.6, -42);
    g.quadraticCurveTo(10, -47, 5.6, -47.6);
    g.quadraticCurveTo(3, -43.6, -2, -43.4);
    g.quadraticCurveTo(-5.4, -42.4, -5.4, -33);
    g.quadraticCurveTo(-9, -33, -10.6, -37);
    g.closePath();
  }, 2);
  line(g, 'rgba(240,255,255,.9)', 1.2, -6, -49.4, 2.6, -52);
  line(g, 'rgba(10,90,150,.45)', 1, -7, -44, -2, -49);
  // A shell at the temple and a teardrop jewel on her brow.
  outlined(g, '#ffd9c8', () => {
    g.moveTo(-9.6, -44);
    g.quadraticCurveTo(-14, -48, -11, -52);
    g.quadraticCurveTo(-6, -52, -5.6, -47);
    g.closePath();
  }, 1.3);
  line(g, '#d98a7a', 0.7, -9.6, -44.6, -11, -50);
  line(g, '#d98a7a', 0.7, -9, -44.6, -8, -50.6);
  outlined(g, '#eaffff', () => {
    g.moveTo(4, -52.4);
    g.quadraticCurveTo(7, -48.4, 4, -46.6);
    g.quadraticCurveTo(1, -48.4, 4, -52.4);
    g.closePath();
  }, 1.1);
  g.restore();
}

// ---------- Cassio: a huge biker in leather, and the chopper he summons ----------

export function drawBike(g, t, thrown = false) {
  const wheel = (x, y) => {
    outlined(g, '#16171b', () => g.arc(x, y, 10.5, 0, Math.PI * 2), 2);
    outlined(g, '#2d2f36', () => g.arc(x, y, 7.2, 0, Math.PI * 2), 1);
    g.strokeStyle = '#c6ccd6';
    g.lineWidth = 0.9;
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = t * 0.02 + (i * Math.PI) / 3;
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * 6.8, y + Math.sin(a) * 6.8);
    }
    g.stroke();
    outlined(g, '#e8ecf2', () => g.arc(x, y, 2.2, 0, Math.PI * 2), 1);
  };
  const chrome = fade(g, 0, -34, 0, 0, '#ffffff', '#aab2bd', '#5e6470');
  // Long raked forks up to tall handlebars.
  limb(g, chrome, 2.4, 33, -10, 21, -33);
  limb(g, chrome, 2, 21, -33, 17, -43, 10, -44);
  outlined(g, '#16171b', () => g.roundRect(6, -46, 7, 3.6, 1.6), 1.2);
  // Rear fender, frame and exhaust.
  outlined(g, '#a32418', () => {
    g.moveTo(-42, -10);
    g.quadraticCurveTo(-40, -24, -24, -22);
    g.lineTo(-20, -18);
    g.quadraticCurveTo(-34, -18, -36, -9);
    g.closePath();
  }, 1.8);
  wheel(-30, -10.5);
  wheel(33, -10.5);
  limb(g, '#26282e', 3, -30, -10.5, -8, -7, 14, -20, 21, -30);
  limb(g, '#26282e', 2.6, -30, -10.5, -12, -21, 10, -24);
  limb(g, chrome, 2.8, 4, -5, -18, -3, -40, -7);
  outlined(g, '#c6ccd6', () => g.roundRect(-43, -9.6, 11, 4.6, 2), 1.3);
  // The engine, with its cooling fins.
  outlined(g, fade(g, 0, -20, 0, -2, '#8d939e', '#33363e'), () => g.roundRect(-8, -18, 19, 15, 3), 1.8);
  g.fillStyle = 'rgba(8,9,12,.7)';
  for (let y = -16; y < -5; y += 3) g.fillRect(-6, y, 15, 1.2);
  outlined(g, '#d8dde5', () => g.arc(1, -7, 3, 0, Math.PI * 2), 1.1);
  // The teardrop tank, with flames licking back along it.
  outlined(g, fade(g, 0, -34, 0, -18, '#ff5a3c', '#b3200e'), () => {
    g.moveTo(-4, -22);
    g.quadraticCurveTo(-3, -32, 8, -33);
    g.quadraticCurveTo(21, -33, 22, -27);
    g.quadraticCurveTo(15, -21, -4, -22);
    g.closePath();
  }, 2);
  g.fillStyle = GOLD;
  g.beginPath();
  g.moveTo(20, -27);
  g.lineTo(8, -29);
  g.lineTo(11, -27);
  g.lineTo(2, -27.6);
  g.lineTo(9, -25);
  g.lineTo(4, -24);
  g.lineTo(14, -24);
  g.closePath();
  g.fill();
  line(g, 'rgba(255,255,255,.65)', 1.1, 4, -30.4, 14, -31);
  // A low seat, and the headlight.
  outlined(g, '#1e1612', () => {
    g.moveTo(-22, -22);
    g.quadraticCurveTo(-14, -28, -4, -24);
    g.lineTo(-3, -20.6);
    g.lineTo(-20, -19);
    g.closePath();
  }, 1.8);
  outlined(g, chrome, () => g.arc(26, -30, 5.4, 0, Math.PI * 2), 1.6);
  outlined(g, thrown ? '#fff1b8' : GOLD, () => g.arc(27.6, -30, 3.4, 0, Math.PI * 2), 1);
}

function cassio(g, o, bob, swing, air) {
  const riding = o.skin;
  if (riding) drawBike(g, o.t);
  const raise = riding ? -13 : 0;
  // He sits back on the seat, so the tank, the bars and the headlight all show in front of him.
  const back = riding ? -11 : 0;
  const skinTone = fade(g, -18, -32, 18, -8, '#e0a070', '#a86c42');
  const denim = fade(g, 0, -14, 0, 0, '#3f5a86', '#243752');

  // Big legs and boots. On the bike they bend to the pegs.
  if (riding) {
    limb(g, denim, 7.6, -14, -19, -1, -14, -6, -6);
    outlined(g, '#1e1612', () => g.roundRect(-9, -8, 12, 6, 2.4), 1.8);
  } else {
    const lift = air ? 3 : 0;
    for (const [x, step, up] of [[-7, swing * 0.7, lift], [7, -swing * 0.7, 0]]) {
      limb(g, denim, 8.6, x, -10, x + step, -4 - up);
      outlined(g, '#1e1612', () => g.roundRect(x + step - 6, -6.4 - up, 13, 6.4, 2.4), 1.8);
      g.fillStyle = '#8d939e';
      g.fillRect(x + step - 5, -5.6 - up, 3, 1.2);
    }
  }

  g.save();
  g.translate(back, bob + raise);
  // The far arm is as thick as a leg, with a tattoo band.
  limb(g, skinTone, 8.4, -17, -29, -21, -19, -18, -11);
  line(g, 'rgba(25,30,60,.8)', 1.6, -24, -22, -18.4, -20.6);
  line(g, 'rgba(25,30,60,.8)', 1, -24, -19.6, -18.2, -18.2);
  outlined(g, '#1e1612', () => g.roundRect(-22, -12.4, 8, 5.6, 2), 1.6);

  // A barrel of a body: grey shirt, then an open leather vest with studs.
  outlined(g, fade(g, -18, 0, 18, 0, '#6e7380', '#a9afba', '#5c616d'), () => {
    g.moveTo(-17, -31);
    g.quadraticCurveTo(0, -38, 17, -31);
    g.quadraticCurveTo(21, -20, 17, -8);
    g.lineTo(-17, -8);
    g.quadraticCurveTo(-21, -20, -17, -31);
    g.closePath();
  });
  const vest = fade(g, 0, -36, 0, -8, '#3a3331', '#17120f');
  outlined(g, vest, () => {
    g.moveTo(-17, -31);
    g.quadraticCurveTo(-9, -35, -5.4, -34);
    g.lineTo(-2.4, -8);
    g.lineTo(-17, -8);
    g.quadraticCurveTo(-21, -20, -17, -31);
    g.closePath();
  }, 2);
  outlined(g, vest, () => {
    g.moveTo(17, -31);
    g.quadraticCurveTo(10, -35, 7.4, -34);
    g.lineTo(6, -8);
    g.lineTo(17, -8);
    g.quadraticCurveTo(21, -20, 17, -31);
    g.closePath();
  }, 2);
  for (const [x, y] of [[-12, -29], [-8, -29.6], [-14, -24], [12, -29], [10, -24], [14, -24]]) spot(g, '#d8dde5', x, y, 0.85);
  line(g, 'rgba(255,255,255,.28)', 1.3, -14, -26, -15, -13);
  // A chain looping from belt to pocket.
  g.strokeStyle = '#d8dde5';
  g.lineWidth = 1.1;
  g.setLineDash([1.6, 1.2]);
  g.beginPath();
  g.moveTo(-13, -11);
  g.quadraticCurveTo(-8, -3, -3, -10.6);
  g.stroke();
  g.setLineDash([]);
  // Belt in his team's colour, with a big square buckle.
  outlined(g, o.color, () => g.roundRect(-18, -13, 36, 5.4, 2), 2);
  outlined(g, fade(g, 0, -15, 0, -7, '#fff1b8', '#b9771a'), () => g.roundRect(-3.6, -14.4, 9.2, 8, 1.8), 1.5);

  // The arm that holds the gun, in a leather glove.
  limb(g, skinTone, 8.4, 17, -29, 19, -20, 9, -17);
  line(g, 'rgba(25,30,60,.8)', 1.5, 15, -25, 21, -24);
  outlined(g, '#1e1612', () => g.roundRect(6, -20.6, 7.6, 7, 2), 1.6);

  // A thick neck and a square head.
  outlined(g, fade(g, -9, -56, 12, -32, '#ecb284', '#c98a5c'), () => g.roundRect(-9, -53, 22, 23, 8));
  eyes(g, -44, 4);
  // A red bandana with its knot and tails behind.
  outlined(g, fade(g, 0, -60, 0, -46, '#e0402a', '#9c1f12'), () => {
    g.moveTo(-10, -47);
    g.quadraticCurveTo(-11, -59, 3, -59);
    g.quadraticCurveTo(15, -59, 14.4, -47);
    g.quadraticCurveTo(2, -51, -10, -47);
    g.closePath();
  });
  for (const [x, y] of [[-3, -54.6], [2.6, -56], [8, -54.6], [3, -52.4]]) spot(g, '#fff1e0', x, y, 0.75);
  const flap = Math.sin(o.t * 0.014) * 2 + clamp(Math.abs(o.vx) * 0.5, 0, 7);
  outlined(g, '#b92a18', () => {
    g.moveTo(-10, -50);
    g.lineTo(-20 - flap, -54 - flap * 0.3);
    g.lineTo(-18 - flap, -48);
    g.lineTo(-23 - flap, -44 + flap * 0.2);
    g.lineTo(-10, -46);
    g.closePath();
  }, 1.6);
  outlined(g, '#c98a5c', () => g.arc(-8.6, -42, 2.4, 0, Math.PI * 2), 1.2);
  spot(g, GOLD, -9.4, -39.8, 0.9);
  g.restore();
}

// ---------- Dextar: a blade magician in a long coat, with knives across his chest ----------

export function drawKnife(g, size = 1, bright = false) {
  g.save();
  g.scale(size, size);
  // Blade, double-edged with a dark fuller.
  outlined(g, fade(g, 0, -5, 0, 5, '#ffffff', bright ? '#ffd9d9' : '#c9d0da', '#7d8794'), () => {
    g.moveTo(-3, -4.2);
    g.quadraticCurveTo(14, -6.4, 30, 0);
    g.quadraticCurveTo(14, 6.4, -3, 4.2);
    g.closePath();
  }, 1.8);
  line(g, 'rgba(30,34,44,.75)', 1, 0, 0, 20, 0);
  // Crossguard, grip and a ruby in the pommel.
  outlined(g, fade(g, 0, -8, 0, 8, '#fff1b8', '#b9771a'), () => g.roundRect(-6.4, -8, 4, 16, 1.6), 1.5);
  outlined(g, '#5a1020', () => g.roundRect(-16, -2.6, 10, 5.2, 1.6), 1.4);
  outlined(g, '#ff4a5e', () => g.arc(-18, 0, 3, 0, Math.PI * 2), 1.3);
  g.restore();
}

function dextar(g, o, bob, swing, air) {
  const marked = o.skin;
  const stream = clamp(Math.abs(o.vx) * 0.9, 0, 11);
  const wave = Math.sin(o.t * 0.01) * 1.6;
  g.save();
  g.translate(0, bob);

  // The tails of his coat fly out behind, showing a crimson lining.
  outlined(g, fade(g, -4, -24, -20, 0, '#c81e36', '#5a0f1e'), () => {
    g.moveTo(-7, -26);
    g.quadraticCurveTo(-14 - stream * 0.5, -14, -19 - stream, -3 + wave);
    g.lineTo(-12 - stream * 0.5, -6);
    g.lineTo(-8 - stream * 0.3, -1 + wave);
    g.quadraticCurveTo(-5, -9, -3, -20);
    g.closePath();
  }, 2);
  // A big dagger on his hip.
  g.save();
  g.translate(-9, -21);
  g.rotate(1.75);
  drawKnife(g, 0.56);
  g.restore();

  // Slim dark trousers and pointed boots.
  const lift = air ? 3 : 0;
  for (const [x, step, up] of [[-3.6, swing * 0.8, lift], [4, -swing * 0.8, 0]]) {
    limb(g, fade(g, 0, -16, 0, 0, '#4e5166', '#2a2c38'), 4.6, x, -13, x + step, -3 - up);
    outlined(g, '#121318', () => {
      g.moveTo(x + step - 3.4, -5 - up);
      g.lineTo(x + step + 2, -5 - up);
      g.lineTo(x + step + 7.4, -1 - up);
      g.lineTo(x + step + 5, -0.2 - up);
      g.lineTo(x + step - 3.4, -0.2 - up);
      g.closePath();
    }, 1.4);
  }

  // The far sleeve.
  limb(g, '#3a3c4e', 4.4, -7, -29, -11, -21, -9, -15);
  outlined(g, '#f5f1e8', () => g.arc(-9, -14, 2, 0, Math.PI * 2), 1.2);

  // Silver waistcoat under an open black coat, narrow at the waist.
  outlined(g, fade(g, 0, -34, 0, -10, '#d8dce4', '#8a90a0'), () => {
    g.moveTo(-7, -32);
    g.lineTo(7, -32);
    g.lineTo(6, -11);
    g.lineTo(-6, -11);
    g.closePath();
  }, 2);
  for (const y of [-24, -20, -16]) spot(g, '#3a3d4c', 0.6, y, 0.8);
  outlined(g, fade(g, 0, -34, 0, -6, '#50536a', '#23242f'), () => {
    g.moveTo(-8, -32.6);
    g.lineTo(-2.6, -32.6);
    g.lineTo(-2, -22);
    g.lineTo(-3, -6);
    g.lineTo(-9.6, -9);
    g.closePath();
  }, 2);
  outlined(g, fade(g, 0, -34, 0, -6, '#50536a', '#23242f'), () => {
    g.moveTo(8, -32.6);
    g.lineTo(3.6, -32.6);
    g.lineTo(3.6, -22);
    g.lineTo(4.6, -7);
    g.lineTo(9.6, -9);
    g.closePath();
  }, 2);
  // Crimson lapels, and an ace in the pocket.
  line(g, '#c81e36', 1.3, -3, -32, -2.4, -22);
  line(g, '#c81e36', 1.3, 3.8, -32, 3.8, -22);
  g.save();
  g.translate(6.8, -18);
  g.rotate(0.12);
  outlined(g, '#fffdf4', () => g.roundRect(-1.8, -6.4, 4, 5.6, 0.8), 0.9);
  spot(g, '#c81e36', 0.2, -3.8, 0.9);
  g.restore();
  // A bandolier of knives across his chest.
  line(g, '#5c3417', 2.2, -7, -30, 7, -13);
  for (const [x, y] of [[-3.6, -26], [0.6, -21], [4.4, -16.4]]) {
    g.save();
    g.translate(x, y);
    g.rotate(-1.2);
    outlined(g, '#e4e9f0', () => {
      g.moveTo(-1, -1.4);
      g.lineTo(5.4, 0);
      g.lineTo(-1, 1.4);
      g.closePath();
    }, 0.8);
    g.restore();
  }
  outlined(g, o.color, () => g.roundRect(-8, -13.6, 16, 3.6, 1.4), 1.7);
  outlined(g, GOLD, () => g.roundRect(-1.8, -14.2, 4.2, 4.8, 1), 1.1);

  // The arm that holds the gun, with a white cuff.
  limb(g, '#50536a', 4.4, 7, -29, 11, -22, 7, -17);
  outlined(g, '#f5f1e8', () => g.roundRect(7, -20.4, 5.2, 3.6, 1), 1.2);

  // A crimson cravat and a long pale face with a pointed chin.
  outlined(g, '#a81a30', () => {
    g.moveTo(-3.6, -32);
    g.lineTo(4.4, -32);
    g.lineTo(2.2, -27);
    g.lineTo(0.4, -24.6);
    g.lineTo(-1.6, -27);
    g.closePath();
  }, 1.4);
  outlined(g, '#e6cbb6', () => g.roundRect(-2.4, -35, 6.4, 4, 2), 1.3);
  outlined(g, fade(g, -8, -50, 10, -30, '#fbe7d8', '#e0bda3'), () => {
    g.moveTo(-9, -42);
    g.quadraticCurveTo(-9, -50, 1.5, -50.4);
    g.quadraticCurveTo(11.6, -50.4, 11.6, -41);
    g.quadraticCurveTo(11.4, -35, 7.6, -31.4);
    g.quadraticCurveTo(4.6, -28.4, 3, -28.4);
    g.quadraticCurveTo(0.6, -29, -2.6, -32);
    g.quadraticCurveTo(-8.6, -36, -9, -42);
    g.closePath();
  });
  eyes(g, -42);

  // Black hair swept back into points, with one white streak.
  outlined(g, fade(g, 0, -60, 0, -40, '#2c2f3e', '#0c0d13'), () => {
    g.moveTo(-10, -37);
    g.quadraticCurveTo(-14, -42, -18, -41);
    g.quadraticCurveTo(-14, -46, -18, -50);
    g.quadraticCurveTo(-13, -50, -12.6, -55);
    g.quadraticCurveTo(-7, -53, -4, -59);
    g.quadraticCurveTo(0, -55, 6, -58);
    g.quadraticCurveTo(13, -55, 13.4, -45);
    g.quadraticCurveTo(10, -48.6, 5.6, -48);
    g.lineTo(2.4, -44.6);
    g.lineTo(1, -47.6);
    g.quadraticCurveTo(-5, -46, -5, -36);
    g.quadraticCurveTo(-8, -35, -10, -37);
    g.closePath();
  }, 2);
  line(g, '#f5f1e8', 1.8, 3, -49.8, -3, -52, -10, -49);
  line(g, 'rgba(140,150,190,.5)', 0.9, -2, -47.6, -10, -44.6);

  // With a mark on someone, his knives lift off and hang in the air behind him.
  if (marked) {
    for (const [x, y, a] of [[-27, -44, -0.4], [-30, -28, 0.1], [-26, -13, 0.5]]) {
      g.save();
      g.translate(x, y + wave);
      g.rotate(a);
      drawKnife(g, 0.46, true);
      g.restore();
    }
  }
  g.restore();
}

// ---------- VI: tall, slim and white-haired, and everything near her floats ----------

function vi(g, o, bob, swing, air) {
  const power = o.skin;
  const flow = Math.sin(o.t * 0.005);
  const lift = power ? 1 : 0;
  g.save();
  g.translate(0, bob);

  // Long white hair falling to her waist. When she reaches out with her mind it rises and spreads.
  outlined(g, fade(g, 6, -60, -14, power ? -72 : -12, '#ffffff', '#e7e4f7', '#b6a8e2'), () => {
    g.moveTo(9, -52);
    if (power) {
      g.bezierCurveTo(2, -63, -13, -62, -14, -50);
      g.quadraticCurveTo(-13, -42, -7, -38);
    } else {
      g.bezierCurveTo(2, -63, -13, -62, -15, -48);
      g.bezierCurveTo(-16, -38, -16 + flow, -28, -19 + flow * 2, -15);
      g.quadraticCurveTo(-15 + flow, -15, -13 + flow, -19);
      g.quadraticCurveTo(-12 + flow, -14, -8, -12);
      g.quadraticCurveTo(-7, -20, -6, -28);
    }
    g.lineTo(-5, -40);
    g.closePath();
  }, 2);
  if (power) {
    const white = fade(g, 0, -40, -30, -76, '#c4b8e8', '#ffffff');
    lock(g, white, -6, -56, -8, -68, -3 + flow, -77, 3.8);
    lock(g, white, -9, -53, -20, -63, -24, -76 + flow, 4);
    lock(g, white, -11, -47, -26, -54, -38, -69 + flow, 4.2);
    lock(g, white, -9, -42, -28, -42, -44, -53 + flow, 3.8);
  } else {
    g.strokeStyle = 'rgba(126,104,196,.55)';
    g.lineWidth = 1;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-10, -50);
    g.quadraticCurveTo(-13, -38, -15 + flow, -21);
    g.moveTo(-7, -46);
    g.quadraticCurveTo(-10, -34, -10 + flow, -17);
    g.stroke();
    g.lineCap = 'butt';
  }

  // Long, slim legs in thigh-high boots, with a bright line up the side.
  const up = air ? 3.4 : 0;
  const bootTone = fade(g, 0, -20, 0, 0, '#6a3cb4', '#2c1456');
  for (const [x, step, raise] of [[-3.2, swing * 0.85, up], [3.4, -swing * 0.85, 0]]) {
    limb(g, bootTone, 4.4, x, -19 - bob, x + step * 0.55, -10, x + step, -3 - raise);
    line(g, '#e6d0ff', 0.9, x + 1, -17 - bob, x + step * 0.55 + 1, -10, x + step + 1, -4 - raise);
    outlined(g, '#2c1456', () => {
      g.moveTo(x + step - 2.6, -4.6 - raise);
      g.lineTo(x + step + 1.6, -4.6 - raise);
      g.lineTo(x + step + 6, -0.6 - raise);
      g.lineTo(x + step + 1.2, -0.4 - raise);
      g.lineTo(x + step - 1.8, -0.4 - raise);
      g.closePath();
    }, 1.2);
  }

  // The far arm, slim, held out from her side.
  limb(g, '#f8e6da', 3, -5, -35, -9, -28, -13 - lift * 5, -22 - lift * 8);
  outlined(g, '#2a1248', () => g.roundRect(-11.2 - lift * 2, -28.4 - lift * 3, 4, 3, 1), 0.9);

  // A fitted violet bodysuit: narrow waist, soft curve at the hip.
  outlined(g, fade(g, 0, -38, 0, -14, '#8a4fe0', '#4a2296'), () => {
    g.moveTo(-5.6, -37.4);
    g.quadraticCurveTo(0, -39, 5.6, -37.4);
    g.bezierCurveTo(6.8, -32.6, 5, -29.6, 3.8, -27);
    g.bezierCurveTo(3.8, -24, 7, -21.6, 6.8, -17.6);
    g.quadraticCurveTo(0, -14.6, -6.8, -17.6);
    g.bezierCurveTo(-7, -21.6, -3.8, -24, -3.8, -27);
    g.bezierCurveTo(-5, -29.6, -6.8, -32.6, -5.6, -37.4);
    g.closePath();
  }, 2);
  // Bright seams that follow the shape of the suit.
  g.strokeStyle = '#d6b3ff';
  g.lineWidth = 0.9;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-3.4, -36.6);
  g.bezierCurveTo(-3.6, -31, -2.2, -28, -2.2, -26.6);
  g.moveTo(3.4, -36.6);
  g.bezierCurveTo(3.6, -31, 2.2, -28, 2.2, -26.6);
  g.stroke();
  g.lineCap = 'butt';
  // A pale cropped jacket over the shoulders, with a high collar.
  outlined(g, fade(g, 0, -40, 0, -30, '#ffffff', '#d4cdee'), () => {
    g.moveTo(-6.8, -38.4);
    g.quadraticCurveTo(-8.8, -35, -7.2, -30.6);
    g.lineTo(-3.8, -30);
    g.lineTo(-2.4, -36.6);
    g.lineTo(-6.8, -38.4);
    g.closePath();
  }, 1.6);
  outlined(g, fade(g, 0, -40, 0, -30, '#ffffff', '#d4cdee'), () => {
    g.moveTo(6.8, -38.4);
    g.quadraticCurveTo(8.8, -35, 7.2, -30.6);
    g.lineTo(3.8, -30);
    g.lineTo(2.4, -36.6);
    g.lineTo(6.8, -38.4);
    g.closePath();
  }, 1.6);
  // A thin belt in her team's colour at the hip, and an amethyst on the buckle.
  outlined(g, o.color, () => g.roundRect(-6.6, -22, 13.2, 2.6, 1), 1.4);
  outlined(g, '#c79cff', () => {
    g.moveTo(0, -23.4);
    g.lineTo(2, -20.7);
    g.lineTo(0, -18);
    g.lineTo(-2, -20.7);
    g.closePath();
  }, 1);

  // The arm that holds the gun, or reaches out when her power is on.
  limb(g, '#fff0e6', 3, 5.4, -35, 9, -27, 7 + lift * 3, -18 - lift * 3);
  outlined(g, '#2a1248', () => g.roundRect(6.8, -30.4, 4, 3, 1), 0.9);

  // A slim neck and a small, fine-boned face.
  outlined(g, '#f3dfd2', () => g.roundRect(-1.2, -41, 4.4, 4.6, 1.6), 1.2);
  outlined(g, fade(g, -7, -56, 9, -38, '#fff2e9', '#f2d6c6'), () => {
    g.moveTo(-7.6, -48);
    g.quadraticCurveTo(-7.6, -55.4, 1, -55.6);
    g.quadraticCurveTo(10, -55.4, 10, -47.4);
    g.quadraticCurveTo(9.8, -42.6, 5.2, -39.4);
    g.quadraticCurveTo(2.8, -37.8, 1, -38);
    g.quadraticCurveTo(-1.4, -38.4, -3, -40.4);
    g.quadraticCurveTo(-7.4, -43.6, -7.6, -48);
    g.closePath();
  }, 2);
  eyes(g, -48, 2);

  // White hair over the crown, parted to one side, with one long lock down the front.
  outlined(g, fade(g, -6, -60, 8, -44, '#ffffff', '#eeeaf9', '#c4b8e8'), () => {
    g.moveTo(-9.4, -42);
    g.bezierCurveTo(-13, -54, -5, -61, 2, -60.4);
    g.bezierCurveTo(10, -60, 13, -54, 11, -47);
    g.quadraticCurveTo(9.6, -52, 5.6, -53.6);
    g.quadraticCurveTo(1.6, -49.6, -3, -49.6);
    g.quadraticCurveTo(-5, -47, -5, -38);
    g.quadraticCurveTo(-8, -38, -9.4, -42);
    g.closePath();
  }, 2);
  line(g, 'rgba(126,104,196,.6)', 0.9, -5, -56, -2, -51.4);
  line(g, 'rgba(126,104,196,.6)', 0.9, 1, -58, 4.4, -54);
  outlined(g, fade(g, 0, -40, 0, -24, '#ffffff', '#c4b8e8'), () => {
    g.moveTo(-5.6, -44);
    g.quadraticCurveTo(-8.4, -35, -6, -26);
    g.quadraticCurveTo(-3.4, -32, -3.4, -41);
    g.closePath();
  }, 1.3);
  // A gold circlet with an amethyst.
  line(g, GOLD, 1.3, -8.4, -51, 1.6, -54.6, 10.6, -51.6);
  outlined(g, '#a860ff', () => {
    g.moveTo(1.6, -57.6);
    g.lineTo(3.8, -54.6);
    g.lineTo(1.6, -51.6);
    g.lineTo(-0.6, -54.6);
    g.closePath();
  }, 1);

  // Her power: light gathered in both hands, and small stones lifted around her.
  if (power) {
    for (const [x, y] of [[-18, -30], [10, -21]]) {
      spot(g, 'rgba(190,120,255,.35)', x, y, 8);
      outlined(g, '#e6c9ff', () => g.arc(x, y, 3.6, 0, Math.PI * 2), 1.2);
      spot(g, '#fff', x - 0.8, y - 0.8, 1.2);
    }
    for (const [x, y, r] of [[-30, -18, 3], [18, -46, 2.6], [24, -28, 2.2], [-22, -6, 2.4]]) {
      outlined(g, '#6a4fa0', () => {
        g.moveTo(x - r, y);
        g.lineTo(x - r * 0.3, y - r);
        g.lineTo(x + r, y - r * 0.3);
        g.lineTo(x + r * 0.5, y + r);
        g.closePath();
      }, 1);
    }
  }
  g.restore();
}

function illusionist(g, o, bob, swing, air) {
  feet(g, fade(g, 0, -14, 0, 0, '#2e1a44', '#160c22'), fade(g, 0, -6, 0, 0, '#3a3540', '#0e0c12'), swing, air, 5.2, 4.2, -12);
  // White spats on the shoes.
  for (const [x, s, up] of [[-4.2, swing * 0.75, air ? 3 : 0], [4.2, -swing * 0.75, 0]]) outlined(g, '#f4eefc', () => g.roundRect(x + s - 3.2, -6.4 - up, 6.4, 2.6, 0.8), 0.9);
  g.save();
  g.translate(0, bob);
  const stream = clamp(Math.abs(o.vx) * 0.8, 0, 9);
  const wave = Math.sin(o.t * 0.009) * 1.6;
  // A short showman's cape, lined with red and scattered with little stars.
  outlined(g, fade(g, -6, -34, -18, -6, '#d62c4a', '#6e1024'), () => {
    g.moveTo(-7, -33);
    g.quadraticCurveTo(-17 - stream, -24, -18 - stream, -7 + wave);
    g.lineTo(-12 - stream * 0.5, -10);
    g.lineTo(-8 - stream * 0.3, -6 + wave);
    g.quadraticCurveTo(-6, -16, -5, -28);
    g.closePath();
  }, 1.8);
  star(g, -13 - stream * 0.5, -20, 2.2, GOLD);
  star(g, -10, -12, 1.6, GOLD);
  // The far hand holds up a white-tipped wand, with a spark on the end.
  limb(g, fade(g, 0, -30, 0, -14, '#7b3ac8', '#4c1f8a'), 4, -8, -29, -13, -24, -16, -30);
  limb(g, INK, 0.9, -16, -30, -21, -41);
  line(g, '#ffffff', 1.4, -20, -39, -21, -41.4);
  line(g, '#1b0e26', 1.4, -16.4, -31, -20, -39);
  outlined(g, '#ffffff', () => g.arc(-16, -30, 2.4, 0, Math.PI * 2), 1.2);
  star(g, -21.6, -43, 3.2, '#f0d0ff');
  // A long purple tailcoat with gold edging, over a white shirt front.
  outlined(g, fade(g, 0, -33, 0, -5, '#8e46e0', '#4c1f8a'), () => {
    g.moveTo(-9.6, -32);
    g.quadraticCurveTo(0, -35, 9.6, -32);
    g.quadraticCurveTo(11, -20, 12, -6);
    g.lineTo(3, -10);
    g.lineTo(-3, -10);
    g.lineTo(-13, -5);
    g.quadraticCurveTo(-11, -20, -9.6, -32);
    g.closePath();
  });
  outlined(g, fade(g, 0, -33, 0, -14, '#ffffff', '#d8d2e6'), () => {
    g.moveTo(-4, -33);
    g.lineTo(5, -33);
    g.lineTo(3, -14);
    g.lineTo(-2, -14);
    g.closePath();
  }, 1.2);
  for (const y of [-27, -23, -19]) spot(g, '#2a1248', 0.6, y, 0.8);
  line(g, GOLD, 1.1, -4.4, -32, -3, -14);
  line(g, GOLD, 1.1, 5.4, -32, 4, -14);
  line(g, GOLD, 1, -12, -6.4, -4, -10);
  line(g, GOLD, 1, 11, -7, 4, -10);
  // A cummerbund in his team's colour, and a fan of cards in the pocket.
  outlined(g, o.color, () => g.roundRect(-9.6, -16.6, 19.2, 3.8, 1.4), 1.6);
  for (const [x, a] of [[6.6, -0.3], [8, 0], [9.4, 0.3]]) {
    g.save();
    g.translate(x, -19);
    g.rotate(a);
    outlined(g, '#fffdf4', () => g.roundRect(-1.4, -5, 2.8, 5, 0.5), 0.7);
    g.restore();
  }
  spot(g, '#d62c4a', 8, -22.4, 0.6);
  nearArm(g, fade(g, 0, -30, 0, -14, '#8e46e0', '#5a26a0'), '#ffffff', 4.2);
  outlined(g, '#ffffff', () => g.roundRect(8, -20.6, 5.2, 2.8, 0.8), 1);
  // A big bow tie.
  outlined(g, fade(g, 0, -34, 0, -28, '#d62c4a', '#8a1630'), () => {
    g.moveTo(-5.4, -34.4);
    g.lineTo(0.6, -31.8);
    g.lineTo(6.6, -34.4);
    g.lineTo(6.6, -28.6);
    g.lineTo(0.6, -31);
    g.lineTo(-5.4, -28.6);
    g.closePath();
  }, 1.3);
  headShape(g, '#f8dcc0', '#e0b892');
  // An ornate half mask, with his eyes through it.
  outlined(g, fade(g, 0, -47, 0, -36, '#ffffff', '#d8cff0'), () => {
    g.moveTo(-7, -46);
    g.quadraticCurveTo(0, -47.6, 3.4, -45);
    g.quadraticCurveTo(7, -47.6, 13.4, -46);
    g.quadraticCurveTo(13.8, -38, 8.6, -36.4);
    g.quadraticCurveTo(5, -36, 3.4, -38.4);
    g.quadraticCurveTo(1, -36, -2, -36.4);
    g.quadraticCurveTo(-7, -38, -7, -46);
    g.closePath();
  }, 1.6);
  eyes(g, -43.2, 1, 0.92);
  line(g, GOLD, 0.9, -5.6, -45.6, 2, -44.2);
  line(g, GOLD, 0.9, 5, -44.2, 12.4, -45.6);
  // Slicked hair shows only when the hat comes off.
  if (o.skin) {
    outlined(g, fade(g, 0, -56, 0, -46, '#3a2458', '#160c22'), () => {
      g.moveTo(-10.6, -40);
      g.bezierCurveTo(-14, -52, -5, -55, 3, -54.4);
      g.bezierCurveTo(11, -54, 14, -51, 13, -46);
      g.quadraticCurveTo(4, -50, -6, -46.6);
      g.quadraticCurveTo(-7.4, -44, -7.4, -38);
      g.closePath();
    }, 2);
    line(g, 'rgba(200,170,240,.6)', 1, -7, -50, 3, -52);
    g.restore();
    return;
  }
  // A tall top hat, with a band in his team's colour, a gold star, and a rabbit's ears peeping out.
  for (const x of [-3.2, 4.2]) outlined(g, '#fff6f6', () => g.ellipse(x, -72, 1.8, 5, x < 0 ? -0.2 : 0.2, 0, Math.PI * 2), 1.1);
  outlined(g, fade(g, -8, 0, 12, 0, '#3e2460', '#160c22', '#2c1848'), () => {
    g.moveTo(-9, -69);
    g.lineTo(12, -69);
    g.lineTo(10.6, -49);
    g.lineTo(-7.6, -49);
    g.closePath();
  });
  outlined(g, o.color, () => g.roundRect(-8.2, -54.6, 19.2, 4.4, 0.8), 1.3);
  outlined(g, '#2c1848', () => g.ellipse(1.5, -69, 10.6, 1.8, 0, 0, Math.PI * 2), 1.3);
  line(g, 'rgba(255,255,255,.35)', 1.4, -5.6, -66, -4.6, -56);
  outlined(g, fade(g, 0, -50, 0, -46, '#3e2460', '#160c22'), () => g.roundRect(-15.4, -49.6, 34, 3.8, 1.8), 1.6);
  star(g, 6, -60, 3, GOLD);
  g.restore();
}

function poacher(g, o, bob, swing, air) {
  feet(g, fade(g, 0, -14, 0, 0, '#585e3c', '#2c3020'), '#2c1c0e', swing, air, 6, 4.6, -12, '#120a04');
  // Patches on the knees, stitched on.
  for (const [x, s] of [[-4.6, swing * 0.4], [4.6, -swing * 0.4]]) outlined(g, '#8a7a4a', () => g.roundRect(x + s - 2.6, -9.4, 5.2, 3.2, 0.6), 0.9);
  g.save();
  g.translate(0, bob);
  // A pelt slung over the back, tail and all.
  outlined(g, fade(g, -14, -30, -22, -8, '#c78f52', '#7a5026'), () => {
    g.moveTo(-8, -32);
    g.quadraticCurveTo(-17, -28, -18, -16);
    g.quadraticCurveTo(-22, -9, -18, -5);
    g.quadraticCurveTo(-14, -9, -13, -14);
    g.quadraticCurveTo(-9, -18, -6, -28);
    g.closePath();
  }, 1.7);
  outlined(g, '#fff4dc', () => g.ellipse(-18.6, -6.4, 2, 2.6, 0, 0, Math.PI * 2), 1);
  line(g, 'rgba(70,42,16,.5)', 0.9, -13, -26, -15, -16);
  farArm(g, fade(g, 0, -30, 0, -14, '#8a8050', '#5e5634'), '#40301e');
  // A worn shirt under a patched canvas vest with big pockets.
  outlined(g, fade(g, 0, -33, 0, -9, '#a59a64', '#6f6840'), () => {
    g.moveTo(-10.6, -32);
    g.quadraticCurveTo(0, -35, 10.6, -32);
    g.quadraticCurveTo(12, -20, 10.8, -9);
    g.lineTo(-10.8, -9);
    g.quadraticCurveTo(-12, -20, -10.6, -32);
    g.closePath();
  });
  outlined(g, fade(g, 0, -33, 0, -9, '#7c883f', '#4e5a26'), () => {
    g.moveTo(-10.6, -32);
    g.quadraticCurveTo(-6, -34, -3.4, -33.6);
    g.lineTo(-1.6, -9.4);
    g.lineTo(-10.8, -9);
    g.quadraticCurveTo(-12, -20, -10.6, -32);
    g.closePath();
  }, 1.7);
  outlined(g, fade(g, 0, -33, 0, -9, '#7c883f', '#4e5a26'), () => {
    g.moveTo(10.6, -32);
    g.quadraticCurveTo(7, -34, 5, -33.6);
    g.lineTo(3.4, -9.4);
    g.lineTo(10.8, -9);
    g.quadraticCurveTo(12, -20, 10.6, -32);
    g.closePath();
  }, 1.7);
  for (const [x, y] of [[-9.6, -25], [-8.6, -19], [4.4, -19]]) {
    outlined(g, '#5e6a2e', () => g.roundRect(x, y, 5.6, 5.4, 0.8), 1);
    line(g, '#3a4218', 0.9, x + 0.6, y + 1.4, x + 5, y + 1.4);
  }
  // A brown patch with cross stitches.
  outlined(g, '#8a5c2c', () => g.roundRect(5.8, -30, 4.2, 4.6, 0.5), 0.9);
  line(g, '#f0e0b0', 0.6, 6.6, -29, 9, -26.4);
  line(g, '#f0e0b0', 0.6, 9, -29, 6.6, -26.4);
  // A belt in his team's colour with a knife at the side, and a spare trap hanging from it. It's gone when he throws it.
  outlined(g, o.color, () => g.roundRect(-11, -13.4, 22, 3.8, 1.4), 1.7);
  outlined(g, fade(g, 0, -14, 0, -9, '#fff1b8', '#b67c1e'), () => g.roundRect(-2, -14, 4.4, 5, 1), 1.1);
  outlined(g, '#5c3417', () => g.roundRect(7, -12.6, 3.4, 8, 1), 1.1);
  line(g, '#d8dde6', 1, 8.7, -13.6, 8.7, -15.6);
  if (!o.skin) {
    g.save();
    g.translate(-10, -6);
    outlined(g, '#5e6573', () => g.roundRect(-5.4, -0.6, 10.8, 2.2, 1), 1.1);
    for (const dir of [-1, 1]) {
      outlined(g, '#c4ccd8', () => {
        g.moveTo(dir * 1, 0);
        g.lineTo(dir * 5, -5);
        g.lineTo(dir * 3.6, -2.8);
        g.lineTo(dir * 2.8, -5);
        g.lineTo(dir * 1.6, -2.4);
        g.closePath();
      }, 0.9);
    }
    g.restore();
  }
  nearArm(g, fade(g, 0, -30, 0, -14, '#a59a64', '#7a7248'), '#40301e');
  // A fur collar.
  outlined(g, fade(g, 0, -36, 0, -29, '#d8a868', '#8a5c2c'), () => {
    g.moveTo(-8, -32);
    g.lineTo(-6, -35.4);
    g.lineTo(-3, -33.6);
    g.lineTo(0, -35.6);
    g.lineTo(3, -33.6);
    g.lineTo(6, -35.6);
    g.lineTo(9, -32);
    g.lineTo(6.4, -29.6);
    g.lineTo(3, -31);
    g.lineTo(0, -29.2);
    g.lineTo(-3, -31);
    g.lineTo(-6, -29.6);
    g.closePath();
  }, 1.3);
  headShape(g, '#ecba92', '#cd9268');
  eyes(g, -41.6, 3.4);
  // A flat cap, ear flaps tied up, with a short peak.
  outlined(g, fade(g, 0, -56, 0, -44, '#6f5a32', '#40321a'), () => {
    g.moveTo(-11, -44);
    g.bezierCurveTo(-13, -55, -3, -58, 5, -56);
    g.bezierCurveTo(12, -55, 14, -50, 12.6, -45.6);
    g.quadraticCurveTo(1, -48.4, -11, -44);
    g.closePath();
  });
  outlined(g, '#5a4826', () => g.roundRect(-11.4, -46.6, 6, 7.4, 2.4), 1.4);
  outlined(g, fade(g, 0, -48, 0, -43.6, '#54431f', '#2c2210'), () => {
    g.moveTo(1, -48);
    g.quadraticCurveTo(13, -49, 20, -44.6);
    g.quadraticCurveTo(10, -45, 1, -44.8);
    g.closePath();
  }, 1.6);
  line(g, 'rgba(255,240,200,.35)', 1.1, -6, -52.6, 3, -54.4);
  g.restore();
}

function angler(g, o, bob, swing, air) {
  // A fishing rod over the shoulder, with a reel, its line and a little fish on the end. It's gone when he casts.
  if (!o.skin) {
    limb(g, fade(g, 0, -70, 0, -10, '#c78c44', '#7a4c1e'), 2.2, -2, -18 + bob, -30, -69 + bob);
    for (const [x, y] of [[-10, -33], [-16, -44], [-22, -55]]) outlined(g, '#dfe6ee', () => g.arc(x, y + bob, 1.2, 0, Math.PI * 2), 0.7);
    outlined(g, fade(g, -7, -28, -2, -22, '#e4e9f0', '#6d7686'), () => g.arc(-5, -25.4 + bob, 3.6, 0, Math.PI * 2), 1.2);
    const sway = Math.sin(o.t * 0.006) * 1.5;
    g.strokeStyle = '#eef3f8';
    g.lineWidth = 0.9;
    g.beginPath();
    g.moveTo(-30, -69 + bob);
    g.lineTo(-31 + sway, -38 + bob);
    g.stroke();
    outlined(g, fade(g, 0, -40, 0, -32, '#9fe4ff', '#2c7fb4'), () => {
      const x = -31 + sway;
      g.moveTo(x, -38 + bob);
      g.quadraticCurveTo(x + 4.4, -33 + bob, x, -29 + bob);
      g.quadraticCurveTo(x - 4.4, -33 + bob, x, -38 + bob);
      g.closePath();
    }, 1.1);
    outlined(g, '#2c7fb4', () => {
      const x = -31 + sway;
      g.moveTo(x, -29.6 + bob);
      g.lineTo(x + 3, -26 + bob);
      g.lineTo(x - 3, -26 + bob);
      g.closePath();
    }, 1);
    spot(g, INK, -31.8 + sway, -35 + bob, 0.7);
  }
  // Tall rubber waders with turned-down tops.
  feet(g, fade(g, 0, -14, 0, 0, '#3f6b80', '#1f3e50'), fade(g, 0, -6, 0, 0, '#2c4d5e', '#142a36'), swing, air, 6.6, 4.8, -12, '#0a1820');
  for (const [x, s, up] of [[-4.8, swing * 0.55, air ? 2 : 0], [4.8, -swing * 0.55, 0]]) outlined(g, '#6a9ab0', () => g.roundRect(x + s - 4, -10.4 - up, 8, 2.6, 1), 1);
  g.save();
  g.translate(0, bob);
  // A wicker basket at his hip.
  outlined(g, fade(g, 0, -18, 0, -6, '#c4955a', '#7a5428'), () => g.roundRect(-18, -19, 11, 11, 2.6), 1.7);
  g.strokeStyle = 'rgba(70,44,18,.6)';
  g.lineWidth = 0.8;
  g.beginPath();
  for (const y of [-16, -13, -10]) {
    g.moveTo(-17, y);
    g.lineTo(-8, y);
  }
  for (const x of [-15, -12, -9.4]) {
    g.moveTo(x, -18);
    g.lineTo(x, -9);
  }
  g.stroke();
  limb(g, fade(g, 0, -30, 0, -14, '#f7cf3e', '#c79a14'), 5, -9, -28, -12, -22, -9, -16);
  outlined(g, '#eebd96', () => g.arc(-8.6, -14.6, 2.3, 0, Math.PI * 2), 1.2);
  // A long yellow oilskin coat with a fold of shadow and a line of clips.
  outlined(g, fade(g, -12, -32, 12, -6, '#ffe05a', '#d6a514'), () => {
    g.moveTo(-11, -32);
    g.quadraticCurveTo(0, -35, 11, -32);
    g.quadraticCurveTo(13.6, -18, 12.6, -7);
    g.lineTo(-12.6, -7);
    g.quadraticCurveTo(-13.6, -18, -11, -32);
    g.closePath();
  });
  line(g, '#a97f12', 1.3, 1, -33, 1, -7);
  for (const y of [-29, -24, -19, -12]) outlined(g, '#3f5a6b', () => g.roundRect(-1, y, 4, 1.8, 0.6), 0.7);
  line(g, 'rgba(255,255,255,.55)', 1.3, -8, -30, -9.6, -12);
  // A sleeveless vest over the coat, with floats and a spare lure pinned to it.
  outlined(g, '#5a7a4c', () => g.roundRect(-11, -30, 8.6, 15, 2), 1.3);
  outlined(g, '#5a7a4c', () => g.roundRect(4, -30, 8.6, 15, 2), 1.3);
  outlined(g, '#44603a', () => g.roundRect(-9.6, -22, 6, 5.6, 0.8), 0.9);
  outlined(g, '#44603a', () => g.roundRect(5.4, -22, 6, 5.6, 0.8), 0.9);
  outlined(g, '#ff5a44', () => g.arc(-6.6, -26.4, 1.5, 0, Math.PI), 0.8);
  outlined(g, '#fff6e6', () => g.arc(-6.6, -26.4, 1.5, Math.PI, 0), 0.8);
  outlined(g, o.color, () => g.roundRect(-12.6, -15.6, 25.2, 3.8, 1.4), 1.6);
  outlined(g, fade(g, 0, -16, 0, -11, '#fff1b8', '#b67c1e'), () => g.roundRect(-1.2, -16.2, 4.4, 5, 1), 1);
  nearArm(g, fade(g, 0, -30, 0, -14, '#ffe05a', '#d6a514'), '#f2c49e', 5);
  headShape(g, '#f8cfaa', '#e0aa80');
  eyes(g, -41.4, 3.4);
  // A sou'wester rain hat, long at the back, with its brim turned up in front.
  outlined(g, fade(g, 0, -50, 0, -36, '#ffe05a', '#c79a14'), () => {
    g.moveTo(-9, -46);
    g.quadraticCurveTo(-19, -42, -19, -30);
    g.quadraticCurveTo(-13, -33, -9, -38);
    g.closePath();
  }, 1.8);
  outlined(g, fade(g, 0, -58, 0, -44, '#ffe05a', '#c79a14'), () => {
    g.moveTo(-10, -45);
    g.bezierCurveTo(-11, -58, 13, -58, 13, -45);
    g.closePath();
  }, 2);
  outlined(g, fade(g, 0, -50, 0, -42, '#ffe88a', '#d6a514'), () => {
    g.moveTo(-14, -44);
    g.quadraticCurveTo(1, -49, 20, -44);
    g.quadraticCurveTo(1, -42.6, -14, -44);
    g.closePath();
  }, 1.8);
  line(g, 'rgba(255,255,255,.6)', 1.2, -4, -53, 3, -54.6);
  line(g, '#a97f12', 1, 1.5, -56, 1.5, -47);
  g.restore();
}

function handler(g, o, bob, swing, air) {
  // An old dog lover: flat cap, round glasses and a cardigan with a paw on it.
  feet(g, fade(g, 0, -14, 0, 0, '#6f6a52', '#3e3a2a'), fade(g, 0, -6, 0, 0, '#5c3a1c', '#2c1a0a'), swing, air, 5.8, 4.4, -12, '#120a04');
  g.save();
  g.translate(0, bob);
  farArm(g, fade(g, 0, -30, 0, -14, '#a0724a', '#6e4a2a'), '#e8bc98');
  // A chunky cardigan with cable knitting, elbow patches and wooden buttons.
  outlined(g, fade(g, -11, -33, 11, -8, '#a8764a', '#6e4829'), () => {
    g.moveTo(-10.6, -32);
    g.quadraticCurveTo(0, -35, 10.6, -32);
    g.quadraticCurveTo(12.4, -20, 11, -8);
    g.lineTo(-11, -8);
    g.quadraticCurveTo(-12.4, -20, -10.6, -32);
    g.closePath();
  });
  g.strokeStyle = 'rgba(60,34,14,.45)';
  g.lineWidth = 0.8;
  g.beginPath();
  for (const x of [-8, -5, 6, 9]) {
    g.moveTo(x, -30);
    g.lineTo(x, -10);
  }
  g.stroke();
  outlined(g, '#f0e6d0', () => {
    g.moveTo(-3, -33);
    g.lineTo(4, -33);
    g.lineTo(1, -27);
    g.closePath();
  }, 1.1);
  line(g, '#5a3a1e', 1.4, 0.6, -27, 0.6, -9);
  for (const y of [-24, -19, -14]) outlined(g, '#d8b070', () => g.arc(0.6, y, 1, 0, Math.PI * 2), 0.7);
  // The paw on his chest.
  blots(g, CREAM, [[5.6, -17.4, 2.5, 2.1], [3, -20.8, 1.05, 1.2], [5.6, -21.8, 1.05, 1.2], [8, -20.8, 1.05, 1.2]]);
  // A belt in his team's colour, and the lead looped on it.
  outlined(g, o.color, () => g.roundRect(-11, -13.4, 22, 3.8, 1.4), 1.6);
  if (!o.skin) {
    g.strokeStyle = INK;
    g.lineWidth = 3.8;
    g.beginPath();
    g.arc(-9, -7.4, 3.8, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = '#d8261c';
    g.lineWidth = 1.9;
    g.stroke();
  }
  // While the real dog is out his arms are empty and the lead on his belt has gone with it.
  if (!o.skin) {
    // His K9 pup, tucked under his arm, in the same colours as the dog he sends out.
    outlined(g, '#4a2a15', () => g.roundRect(-36, -25, 22, 12, 5), 2);
    outlined(g, '#f6efe2', () => g.ellipse(-22, -15, 5, 2.4, 0, 0, Math.PI * 2), 1.3);
    outlined(g, '#4a2a15', () => g.arc(-19, -30, 7, 0, Math.PI * 2), 2);
    outlined(g, '#f6efe2', () => g.roundRect(-17, -30, 8, 6, 3), 1.6);
    outlined(g, '#2e1a0c', () => g.ellipse(-23, -33, 2.6, 4.8, 0.5, 0, Math.PI * 2), 1.5);
    g.fillStyle = INK;
    g.fillRect(-11, -29, 2, 2);
    oneEye(g, -18.4, -32, 0.6);
    outlined(g, '#d8261c', () => g.roundRect(-25, -25, 10, 2.8, 1), 1.2);
    outlined(g, GOLD, () => g.arc(-19.6, -21.8, 1.3, 0, Math.PI * 2), 0.8);
  }
  nearArm(g, fade(g, 0, -30, 0, -14, '#b0804e', '#7c5230'), '#eec6a4');
  outlined(g, '#8a5c34', () => g.roundRect(9.4, -25.4, 4.4, 4.6, 1.6), 0.9);
  headShape(g, '#f4c8a6', '#d8a27c');
  // White hair at the side and the back.
  outlined(g, fade(g, 0, -50, 0, -32, '#ffffff', '#d6d0c4'), () => {
    g.moveTo(-9.4, -46);
    g.quadraticCurveTo(-13, -40, -9.6, -33.6);
    g.quadraticCurveTo(-6, -34, -5, -38);
    g.quadraticCurveTo(-5.4, -42, -5.4, -46);
    g.closePath();
  }, 1.5);
  // Round glasses, with his eyes behind them.
  g.fillStyle = 'rgba(225,245,255,.55)';
  g.beginPath();
  g.arc(4, -40, 3.6, 0, Math.PI * 2);
  g.arc(9.6, -40, 3.2, 0, Math.PI * 2);
  g.fill();
  eyes(g, -42, 4.2, 0.66);
  g.strokeStyle = INK;
  g.lineWidth = 1.3;
  g.beginPath();
  g.arc(4, -40, 3.6, 0, Math.PI * 2);
  g.moveTo(12.8, -40);
  g.arc(9.6, -40, 3.2, 0, Math.PI * 2);
  g.moveTo(0.4, -40.6);
  g.lineTo(-6, -41.6);
  g.stroke();
  // A tweed flat cap with a short peak.
  outlined(g, fade(g, 0, -57, 0, -44, '#8c8870', '#55523f'), () => {
    g.moveTo(-11, -45);
    g.bezierCurveTo(-13, -55, -3, -58, 5, -56.4);
    g.bezierCurveTo(12, -55, 14, -50, 12.6, -46);
    g.quadraticCurveTo(1, -49, -11, -45);
    g.closePath();
  });
  g.strokeStyle = 'rgba(50,46,30,.4)';
  g.lineWidth = 0.7;
  g.beginPath();
  for (const x of [-7, -3, 1, 5, 9]) {
    g.moveTo(x, -55);
    g.lineTo(x - 1.6, -47);
  }
  g.stroke();
  outlined(g, fade(g, 0, -49, 0, -44, '#6d6a55', '#3e3c2c'), () => {
    g.moveTo(1, -48.6);
    g.quadraticCurveTo(13, -49.6, 19.6, -45);
    g.quadraticCurveTo(10, -45.6, 1, -45.4);
    g.closePath();
  }, 1.5);
  g.restore();
}

function mossback(g, o, bob, swing, air) {
  // Stone feet.
  const up = air ? 3 : 0;
  for (const [x, step, raise] of [[-8, swing * 0.7, up], [8, -swing * 0.7, 0]]) {
    outlined(g, fade(g, 0, -10, 0, 0, '#7a6a54', '#4b3a26'), () => g.roundRect(x + step - 6, -10 - raise, 12, 10, 3), 1.9);
    for (const dx of [-3, 0.4, 3.6]) line(g, '#2e2316', 0.9, x + step + dx, -1 - raise, x + step + dx, -4 - raise);
  }
  g.save();
  g.translate(0, bob);
  // Branches for horns, sprouting leaves. They drop away when he raises the wall.
  if (!o.skin) {
    for (const dir of [-1, 1]) {
      limb(g, fade(g, 0, -64, 0, -44, '#a07a44', '#6a4c26'), 3, dir * 7, -46, dir * 15, -62);
      limb(g, '#7a5a34', 1.8, dir * 12, -56, dir * 21, -59);
      limb(g, '#7a5a34', 1.6, dir * 14, -60, dir * 11, -68);
      for (const [x, y, a] of [[21, -60, 0.6], [15, -64, -0.6], [11, -69, -0.2]]) {
        g.save();
        g.translate(dir * x, y);
        g.rotate(dir * a);
        outlined(g, '#6fb84a', () => g.ellipse(0, -2, 1.7, 3.2, 0, 0, Math.PI * 2), 1);
        g.restore();
      }
    }
  }
  // A boulder for a body: lit from above, with plates of stone laid over it.
  limb(g, fade(g, 0, -30, 0, -8, '#8d7a62', '#5a4a36'), 8, -17, -26, -22, -16, -18, -8);
  outlined(g, fade(g, -18, -50, 16, -6, '#a59278', '#7a6850', '#4f4130'), () => {
    g.moveTo(-18, -8);
    g.quadraticCurveTo(-23, -32, -11, -46);
    g.quadraticCurveTo(2, -55, 13, -46);
    g.quadraticCurveTo(23, -30, 18, -8);
    g.closePath();
  });
  for (const [x, y, w, h, c] of [[-16, -28, 9, 7, '#8a7860'], [-14, -18, 11, 6, '#6e5e48'], [10, -24, 7, 8, '#8f7c62'], [5, -14, 11, 5, '#73634c']]) outlined(g, c, () => g.roundRect(x, y, w, h, 2), 1.3);
  // Cracks.
  g.strokeStyle = '#3a2e20';
  g.lineWidth = 1.5;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-3, -11);
  g.lineTo(0, -18);
  g.lineTo(-3, -22);
  g.lineTo(-1, -26);
  g.moveTo(0, -18);
  g.lineTo(4, -20);
  g.stroke();
  g.lineCap = 'butt';
  // A crown of moss spilling over the shoulders, with mushrooms and a flower in it.
  outlined(g, fade(g, 0, -56, 0, -36, '#8ed45e', '#3f7a2e'), () => {
    g.moveTo(-15, -38);
    g.quadraticCurveTo(-13, -48, -8, -50);
    g.quadraticCurveTo(1, -60, 10, -50);
    g.quadraticCurveTo(16, -48, 17, -38);
    g.lineTo(13, -41);
    g.lineTo(9.6, -35.6);
    g.lineTo(5, -40);
    g.lineTo(0.6, -36.6);
    g.lineTo(-3, -40.6);
    g.lineTo(-7, -35.6);
    g.lineTo(-11, -41);
    g.closePath();
  });
  blots(g, 'rgba(210,255,150,.5)', [[-6, -48, 3, 1.5, -0.4], [4, -52, 3.4, 1.5, 0.1], [11, -45, 2, 1.2, 0.6]]);
  // A little red mushroom and a white one.
  outlined(g, '#f0e6d0', () => g.roundRect(-11.6, -52, 2.6, 4.4, 0.8), 0.9);
  outlined(g, '#d8341f', () => {
    g.moveTo(-14.6, -51);
    g.quadraticCurveTo(-10.4, -58, -6, -51);
    g.closePath();
  }, 1.1);
  spot(g, '#fff', -11.6, -53, 0.7);
  spot(g, '#fff', -8.6, -52, 0.5);
  outlined(g, '#f0e6d0', () => g.roundRect(13, -48.6, 2, 3.2, 0.6), 0.8);
  outlined(g, '#f4e8c8', () => {
    g.moveTo(11.2, -48);
    g.quadraticCurveTo(14, -52.6, 16.8, -48);
    g.closePath();
  }, 0.9);
  // A flower.
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    spot(g, '#ffdff0', 3 + Math.cos(a) * 1.5, -56 + Math.sin(a) * 1.5, 1);
  }
  spot(g, GOLD, 3, -56, 0.8);
  // A vine belt in his team's colour, and moss creeping up from the feet.
  outlined(g, o.color, () => g.roundRect(-18, -16, 36, 4.4, 1.8), 1.7);
  outlined(g, fade(g, 0, -17, 0, -11, '#c9a24a', '#7a5a22'), () => g.arc(0, -13.8, 3, 0, Math.PI * 2), 1.1);
  blots(g, '#5f9a3e', [[-14, -9.4, 4, 2], [12, -9, 4.6, 2.2], [-1, -8.4, 2.6, 1.4]]);
  // A stone arm reaching for the gun.
  limb(g, fade(g, 0, -30, 0, -14, '#9a8870', '#6a5a44'), 7.6, 16, -26, 16, -18, 9, -17);
  outlined(g, '#5f9a3e', () => g.ellipse(16.4, -27, 4.4, 2.2, 0.2, 0, Math.PI * 2), 1);
  eyes(g, -34, 3, 1.15);
  g.restore();
}

function rime(g, o, bob, swing, air) {
  const flow = Math.sin(o.t * 0.006);
  feet(g, fade(g, 0, -14, 0, 0, '#3a6480', '#1f3e54'), fade(g, 0, -6, 0, 0, '#ffffff', '#c8d8e4'), swing, air, 6.2, 4.6, -11, '#7a95a8');
  // Fur at the top of the boots.
  for (const [x, s, up] of [[-4.6, swing * 0.75, air ? 3 : 0], [4.6, -swing * 0.75, 0]]) outlined(g, '#f2f7fb', () => g.roundRect(x + s - 4.6, -8.4 - up, 9.2, 3.2, 1.6), 1.1);
  g.save();
  g.translate(0, bob);
  // A long dark braid over the shoulder, tied with ice beads.
  limb(g, fade(g, -10, -36, -18, -12, '#27505c', '#112e38'), 4, -8, -36, -15 + flow, -28, -17 + flow, -14);
  g.strokeStyle = 'rgba(160,220,235,.5)';
  g.lineWidth = 0.8;
  g.beginPath();
  for (const y of [-32, -27, -22, -18]) {
    g.moveTo(-18 + flow, y);
    g.lineTo(-13 + flow, y + 2);
  }
  g.stroke();
  outlined(g, '#9fe4f2', () => g.arc(-17 + flow, -11.6, 2.6, 0, Math.PI * 2), 1.2);
  limb(g, fade(g, 0, -30, 0, -14, '#56c0dc', '#2a8aa8'), 6, -10, -28, -14, -20, -12, -14);
  outlined(g, '#f2f7fb', () => g.arc(-12, -12.4, 3.2, 0, Math.PI * 2), 1.3);
  // A long frost-blue parka, or white while her storm rolls, with fur at the hem and down the front.
  outlined(g, o.skin ? fade(g, 0, -32, 0, -6, '#ffffff', '#c4e8f2') : fade(g, 0, -32, 0, -6, '#5ec8e4', '#2288a8'), () => {
    g.moveTo(-10, -32);
    g.quadraticCurveTo(0, -35, 10, -32);
    g.lineTo(15, -7);
    g.lineTo(-15, -7);
    g.closePath();
  });
  outlined(g, fade(g, 0, -12, 0, -4, '#ffffff', '#c8d8e4'), () => g.roundRect(-16.4, -11, 32.8, 6.4, 3), 1.7);
  outlined(g, '#f2f7fb', () => g.roundRect(-2, -32, 5, 22, 1.4), 1.1);
  g.strokeStyle = 'rgba(120,170,190,.7)';
  g.lineWidth = 0.7;
  g.beginPath();
  for (const y of [-29, -25, -21, -17, -13]) {
    g.moveTo(-1, y);
    g.lineTo(2, y);
  }
  g.stroke();
  // A snowflake stitched on the chest, and a compass on a cord.
  g.strokeStyle = '#ffffff';
  g.lineWidth = 1;
  g.lineCap = 'round';
  g.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    g.moveTo(-6.6 + Math.cos(a) * 3.2, -24 + Math.sin(a) * 3.2);
    g.lineTo(-6.6 - Math.cos(a) * 3.2, -24 - Math.sin(a) * 3.2);
  }
  g.stroke();
  g.lineCap = 'butt';
  outlined(g, fade(g, 0, -28, 0, -20, '#fff1b8', '#b67c1e'), () => g.arc(7.4, -23.4, 2.8, 0, Math.PI * 2), 1.1);
  line(g, '#d8261c', 0.9, 7.4, -25.6, 7.4, -21.6);
  outlined(g, o.color, () => g.roundRect(-11.4, -19, 22.8, 3.8, 1.4), 1.6);
  limb(g, fade(g, 0, -30, 0, -14, '#6ad0ea', '#2a8aa8'), 6, 10, -28, 13, -21, 8, -17);
  outlined(g, '#f2f7fb', () => g.arc(7.2, -16.4, 3, 0, Math.PI * 2), 1.3);
  // A thick ring of fur around the face, shaggy at the edge.
  outlined(g, fade(g, 0, -55, 0, -24, '#ffffff', '#d4e0ea'), () => {
    for (let i = 0; i < 18; i++) {
      const a = (i * Math.PI) / 9;
      const r = i % 2 ? 16.4 : 14.6;
      g.lineTo(1.4 + Math.cos(a) * r, -39 + Math.sin(a) * r);
    }
    g.closePath();
  }, 2);
  outlined(g, fade(g, -8, -48, 8, -30, '#ffe6d0', '#f0c8a8'), () => g.arc(2, -39, 10.2, 0, Math.PI * 2), 1.8);
  // Her fringe, and snow goggles pushed up on the hood.
  outlined(g, fade(g, 0, -50, 0, -42, '#27505c', '#112e38'), () => {
    g.moveTo(-8.2, -40);
    g.quadraticCurveTo(-7, -50, 2, -49.6);
    g.quadraticCurveTo(11, -50, 12, -41);
    g.quadraticCurveTo(7, -46, 3, -45);
    g.quadraticCurveTo(-3, -44.6, -8.2, -40);
    g.closePath();
  }, 1.4);
  eyes(g, -41, 3.4);
  outlined(g, fade(g, 0, -56, 0, -50, '#9df0ff', '#2fb4dc'), () => g.roundRect(-5, -55, 14, 5, 2.2), 1.5);
  line(g, 'rgba(255,255,255,.8)', 0.9, -3, -51.4, -1, -54);
  // A crystal on the hood. It goes when the storm starts.
  if (!o.skin) {
    outlined(g, fade(g, -3, -64, 5, -54, '#e6fbff', '#6fcce4'), () => {
      g.moveTo(2, -69);
      g.lineTo(7, -60);
      g.lineTo(2, -55);
      g.lineTo(-3, -60);
      g.closePath();
    }, 1.6);
    line(g, 'rgba(255,255,255,.9)', 0.9, 1, -65, -1, -60.4);
  } else {
    for (const [x, y, r] of [[-22, -50, 3], [22, -44, 2.4], [-26, -30, 2.2], [24, -20, 2.6]]) star(g, x, y, r, '#e6fbff');
  }
  g.restore();
}

function tether(g, o, bob, swing, air) {
  // A spider-themed climber of our own: blue hood and plated mask with eight small eyes, red legs and harness.
  // Spider legs unfold from the back while the skill is showing.
  g.save();
  g.translate(0, bob);
  if (o.skin) {
    for (const dir of [-1, 1]) {
      for (const [kx, ky, fx, fy] of [[-24, -46, -33, -30], [-29, -33, -38, -14], [-22, -18, -30, -2], [-17, -50, -30, -58]]) {
        limb(g, fade(g, 0, -60, 0, 0, '#ff4a3a', '#8a1812'), 2, -8, -24, kx, ky, fx, fy);
        outlined(g, '#16296b', () => g.arc(kx, ky, 1.8, 0, Math.PI * 2), 1);
      }
      if (dir < 0) break;
    }
  }
  // A pack on his back holding spools of web.
  outlined(g, fade(g, -18, -30, -8, -12, '#2a4aaa', '#142260'), () => g.roundRect(-18, -30, 10, 18, 3), 1.7);
  outlined(g, '#f6f3ea', () => g.arc(-13, -25, 3, 0, Math.PI * 2), 1.1);
  outlined(g, '#f6f3ea', () => g.arc(-13, -17.4, 3, 0, Math.PI * 2), 1.1);
  spot(g, '#b3261e', -13, -25, 1);
  spot(g, '#b3261e', -13, -17.4, 1);
  g.restore();
  // Red legs with blue armour at the shin.
  feet(g, fade(g, 0, -14, 0, 0, '#e03a2e', '#a01c14'), fade(g, 0, -6, 0, 0, '#2546a8', '#101a3d'), swing, air, 5.6, 4.4, -12, '#0a0f26');
  for (const [x, s, up] of [[-4.4, swing * 0.55, air ? 2 : 0], [4.4, -swing * 0.55, 0]]) outlined(g, '#1d3a8f', () => g.roundRect(x + s - 2.8, -9.8 - up, 5.6, 4, 1), 1);
  g.save();
  g.translate(0, bob);
  limb(g, fade(g, 0, -30, 0, -14, '#2a4aaa', '#16296b'), 4.4, -8, -29, -12, -21, -10, -15);
  outlined(g, '#b3261e', () => g.arc(-10, -13.6, 2.3, 0, Math.PI * 2), 1.2);
  // A blue plated suit, with red harness straps crossing the chest and a gold spider clasp.
  outlined(g, fade(g, -10, -33, 10, -9, '#3158c8', '#14236a'), () => {
    g.moveTo(-10, -32);
    g.quadraticCurveTo(0, -35, 10, -32);
    g.quadraticCurveTo(11, -20, 8.6, -9);
    g.lineTo(-8.6, -9);
    g.quadraticCurveTo(-11, -20, -10, -32);
    g.closePath();
  });
  for (const [x, y, w] of [[-7, -19, 6], [1.4, -19, 6]]) outlined(g, '#2546a8', () => g.roundRect(x, y, w, 5, 1), 0.9);
  outlined(g, '#2546a8', () => g.roundRect(-3, -13.6, 6.6, 3.4, 0.8), 0.8);
  limb(g, fade(g, 0, -32, 0, -14, '#ff4a3a', '#a01c14'), 2.2, -8, -31, 7, -15);
  limb(g, fade(g, 0, -32, 0, -14, '#ff4a3a', '#a01c14'), 2.2, 8, -31, -7, -15);
  outlined(g, fade(g, 0, -26, 0, -18, '#fff1b8', '#b67c1e'), () => g.arc(0.2, -23, 3, 0, Math.PI * 2), 1.2);
  spot(g, INK, 0.2, -23, 1.2);
  outlined(g, o.color, () => g.roundRect(-9, -13, 18, 3.4, 1.2), 1.5);
  // The near arm, with a spinner on the wrist.
  limb(g, fade(g, 0, -30, 0, -14, '#3158c8', '#16296b'), 4.4, 8, -29, 11, -22, 8, -17.6);
  outlined(g, fade(g, 0, -23, 0, -18, '#ff4a3a', '#a01c14'), () => g.roundRect(8, -22.6, 6, 4.4, 1.2), 1.1);
  outlined(g, '#b3261e', () => g.arc(7.4, -16.6, 2.5, 0, Math.PI * 2), 1.2);
  // Blue hood, a red seam round the face, and a plated mask with eight eyes.
  outlined(g, fade(g, -11, -54, 12, -28, '#2546a8', '#101d55'), () => g.arc(1.4, -39, 13.8, 0, Math.PI * 2));
  g.strokeStyle = fade(g, 0, -52, 0, -30, '#ff4a3a', '#a01c14');
  g.lineWidth = 2.2;
  g.beginPath();
  g.arc(1.4, -39, 10.8, Math.PI * 0.85, Math.PI * 1.65);
  g.stroke();
  line(g, 'rgba(180,200,255,.5)', 1.1, -6, -48, -2, -50.6);
  outlined(g, fade(g, 0, -46, 0, -31, '#1b2452', '#050818'), () => g.roundRect(-2.8, -46.4, 17, 15, 6), 1.7);
  line(g, 'rgba(120,150,230,.7)', 1, 5.6, -46, 5.6, -43);
  line(g, 'rgba(120,150,230,.45)', 0.9, -1, -37, 2, -33);
  line(g, 'rgba(120,150,230,.45)', 0.9, 12.4, -37, 9.4, -33);
  g.fillStyle = '#ffc93f';
  // Eight eyes, laid out the way a jumping spider's are: two big ones in the middle.
  for (const [x, y, r] of [[3.4, -40.4, 2.7], [9, -40.4, 2.7], [0.1, -42.4, 1.1], [12.3, -42.4, 1.1], [-0.1, -38.1, 1], [12.5, -38.1, 1], [4.7, -35.9, 0.9], [7.7, -35.9, 0.9]]) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  spot(g, '#fff', 2.6, -41.4, 0.7);
  spot(g, '#fff', 8.2, -41.4, 0.7);
  g.restore();
}

function shade(g, o, bob, swing, air) {
  // A cloaked scout: slate hood, grey scarf trailing behind, pale eyes in the dark.
  const wave = Math.sin(o.t * 0.01) * 3;
  const stream = clamp(Math.abs(o.vx) * 0.9, 0, 11);
  feet(g, fade(g, 0, -14, 0, 0, '#3a4556', '#1c2430'), '#141920', swing, air, 5.4, 4.2, -11, '#0a0d12');
  g.save();
  g.translate(0, bob);
  // The scarf. It's the first thing she loses when she vanishes.
  if (!o.skin) {
    outlined(g, fade(g, -6, -30, -30, -22, '#b4bdca', '#6d7786'), () => {
      g.moveTo(-6, -33);
      g.quadraticCurveTo(-18 - stream * 0.5, -35 + wave, -30 - stream, -26 - wave);
      g.lineTo(-26 - stream, -22 - wave);
      g.lineTo(-29 - stream, -18 - wave);
      g.quadraticCurveTo(-16 - stream * 0.4, -26 + wave, -6, -27);
      g.closePath();
    }, 1.7);
    line(g, 'rgba(50,60,74,.5)', 0.9, -14, -29 + wave * 0.5, -24 - stream, -23 - wave);
  }
  // A ragged cloak hanging to the shins, in layers of slate.
  outlined(g, fade(g, 0, -32, 0, -5, '#3c4759', '#1a212d'), () => {
    g.moveTo(-10, -32);
    g.lineTo(-15, -6);
    g.lineTo(-10, -9 + wave * 0.3);
    g.lineTo(-7, -4);
    g.lineTo(-3, -8);
    g.lineTo(0, -5);
    g.lineTo(3, -8);
    g.lineTo(7, -4);
    g.lineTo(10, -9 - wave * 0.3);
    g.lineTo(15, -6);
    g.lineTo(10, -32);
    g.closePath();
  });
  farArm(g, fade(g, 0, -30, 0, -14, '#3a4556', '#1f2733'), '#141920');
  // Close-fitting armour under the cloak, with straps and pouches.
  outlined(g, fade(g, 0, -32, 0, -11, '#58657a', '#2a3442'), () => g.roundRect(-6.8, -31, 13.6, 20, 3), 1.6);
  line(g, '#141920', 1.8, -6, -29, 6, -14);
  line(g, '#8a5c34', 1.2, -6, -29, 6, -14);
  for (const [x, y] of [[-3, -26.4], [1.8, -21]]) outlined(g, '#d8dde6', () => g.arc(x, y, 0.8, 0, Math.PI * 2), 0.5);
  // A belt in her team's colour, with smoke vials hanging from it.
  outlined(g, o.color, () => g.roundRect(-10, -15, 20, 3.8, 1.4), 1.6);
  for (const [x, c] of [[-8, '#a7b1bf'], [-3.8, '#a7b1bf'], [6.2, '#7fd8ff']]) {
    outlined(g, c, () => g.roundRect(x, -11.6, 3, 5.6, 1.2), 1);
    spot(g, 'rgba(255,255,255,.7)', x + 0.9, -9.8, 0.5);
  }
  // A short blade strapped across the small of her back.
  g.save();
  g.translate(9, -22);
  g.rotate(0.9);
  outlined(g, '#2c1f14', () => g.roundRect(-1.2, -8, 2.4, 6, 0.8), 0.9);
  g.restore();
  nearArm(g, fade(g, 0, -30, 0, -14, '#46536a', '#26303e'), '#141920');
  line(g, '#8a97a8', 0.9, 8.6, -22, 12.4, -21);
  line(g, '#8a97a8', 0.9, 8.2, -20, 11.8, -19);
  // The scarf at her neck.
  outlined(g, fade(g, 0, -36, 0, -29, '#b4bdca', '#6d7786'), () => g.roundRect(-8, -35, 18, 6.4, 3), 1.7);
  line(g, 'rgba(50,60,74,.45)', 0.9, -5, -32, 8, -31);
  // A deep hood with a peak, a slate cowl over the shoulders, and darkness inside it.
  outlined(g, fade(g, -13, -56, 13, -32, '#4a586c', '#222b38'), () => {
    g.moveTo(-13, -33);
    g.quadraticCurveTo(-17, -48, -7, -55);
    g.quadraticCurveTo(0, -60, 3, -58);
    g.quadraticCurveTo(14, -54, 14.4, -34);
    g.quadraticCurveTo(1, -29, -13, -33);
    g.closePath();
  });
  line(g, 'rgba(160,175,195,.55)', 1.2, -9, -46, -4, -53);
  line(g, 'rgba(10,14,20,.5)', 1, -9, -36, -7, -48);
  g.fillStyle = '#0a0e14';
  g.beginPath();
  g.ellipse(4, -40.6, 9.2, 9, 0, 0, Math.PI * 2);
  g.fill();
  eyes(g, -42.6, 1.6, 1, '#d7f4ff');
  g.restore();
}

// A road's guard, not a hero you can pick: a plain villager in a wool cap and patched coat, keeping watch.
function lookout(g, o, bob, swing, air) {
  feet(g, fade(g, 0, -14, 0, 0, '#4d4638', '#2b261c'), '#1f1a12', swing, air, 5.4, 4.4, -12, '#0e0b07');
  g.save();
  g.translate(0, bob);
  farArm(g, fade(g, 0, -30, 0, -14, '#6d6450', '#494232'), '#d9ad85');
  outlined(g, fade(g, 0, -33, 0, -8, '#7a7059', '#4b4433'), () => {
    g.moveTo(-10.2, -32);
    g.quadraticCurveTo(0, -35, 10.2, -32);
    g.quadraticCurveTo(11.4, -20, 10.6, -8);
    g.lineTo(-10.6, -8);
    g.quadraticCurveTo(-11.4, -20, -10.2, -32);
    g.closePath();
  });
  // A patch on the coat, and a sash in their team's colour.
  outlined(g, '#a39468', () => g.roundRect(-8, -20, 5.4, 5.4, 0.8), 1);
  line(g, '#3a3426', 0.8, -8, -17.6, -2.6, -17.6);
  line(g, o.color, 3, -9, -30, 8, -13);
  outlined(g, '#2c2214', () => g.roundRect(-10.8, -12, 21.6, 3.4, 1.2), 1.4);
  nearArm(g, fade(g, 0, -30, 0, -14, '#7a7059', '#544c3a'), '#d9ad85');
  headShape(g, '#f0c8a0', '#d3a077');
  eyes(g, -42);
  // A wool cap with a turned-up edge.
  outlined(g, fade(g, -10, -58, 10, -46, '#8a4a2c', '#552a16'), () => {
    g.moveTo(-10.4, -45.6);
    g.quadraticCurveTo(-11, -59, 1.5, -59);
    g.quadraticCurveTo(13, -59, 13, -45.6);
    g.closePath();
  });
  outlined(g, '#a8643e', () => g.roundRect(-11, -48.4, 24.6, 4.6, 1.8), 1.3);
  g.restore();
}

const BODIES = {
  [LOOKOUT]: lookout,
  [SEEDEA]: seedea,
  [CASSIO]: cassio,
  [DEXTAR]: dextar,
  [VI]: vi,
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
  [AQUILLES]: aquilles,
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
  sprite(`l${text}|${color}`, [-60, -12, 120, 18], (g) => {
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

// Aquilles' guard: the shield comes off his back and up in front of him.
const guardSprite = () => sprite('guard', [-2, -50, 54, 54], (g) => bronzeShield(g, 25, -23, 23));

// ...and the spear swings forward, with a gun's grip and barrel opening out of its shaft.
const spearGunSprite = () => sprite('speargun', [-14, -20, 104, 34], spearGun);

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
  if (o.guard) stamp(g, guardSprite());
  const speared = o.guard && o.hero === AQUILLES && gun === PISTOL;
  if (o.throwing > 0) {
    g.save();
    g.translate(0, -24 + fr.bob);
    g.rotate(-2.6 + (1 - o.throwing) * 2.8);
    outlined(g, '#c9a27e', () => g.roundRect(0, -3, 22, 6, 3), 2);
    g.restore();
  } else {
    stamp(g, speared ? spearGunSprite() : gunSprite(gun), 0, -17 + fr.bob);
    if (o.golden) star(g, speared ? SPEAR_MUZZLE : MUZZLE[gun], -17 + fr.bob, 5 + Math.sin(o.t * 0.02) * 2, GOLD);
  }
  if (o.flash > 0) {
    const big = o.flashGun === SNIPER_GUN || o.flashGun === SHOTGUN || o.flashGun === ROCKET;
    const at = speared && o.flashGun === PISTOL ? SPEAR_MUZZLE : MUZZLE[o.flashGun];
    star(g, at, -17 + fr.bob, big ? 16 : 9, CREAM);
    star(g, at, -17 + fr.bob, big ? 8 : 4, '#ff9a2e');
  }
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

