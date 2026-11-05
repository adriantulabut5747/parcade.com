// The campaign map: one long painted world you drag sideways, with a road through every stop.
// The world is a canvas under plain buttons, so scrolling is the browser's own and costs nothing per frame.
import { CREAM, GOLD, INK } from './heroes.js';
import { REGIONS, ROSTER, STOPS, canPlay, unlockedHeroes } from './campaign.js';

const WORLD_H = 540;
const FIGHT_GAP = 150;
const ROAD_GAP = 120;
const MARGIN = 170;

function seeded(n) {
  return () => {
    n = (n * 16807) % 2147483647;
    return n / 2147483647;
  };
}

// Where everything goes, in world units. Stops follow the formation; a road belongs to the fight before it.
function layout() {
  const nodes = [{ kind: 'camp' }];
  const spans = [];
  let at = 0;
  for (const region of REGIONS) {
    const first = nodes.length;
    for (const hero of region.heroes) {
      // The first hero is where you start, so they have no fight.
      if (STOPS[at]?.hero !== hero) continue;
      nodes.push({ kind: 'fight', i: at++ });
      if (STOPS[at]?.kind === 'road') nodes.push({ kind: 'road', i: at++ });
    }
    if (region.soon) nodes.push({ kind: 'soon', name: region.soon });
    spans.push({ region, first, last: nodes.length - 1 });
  }
  let x = MARGIN;
  nodes.forEach((n, i) => {
    if (i) x += n.kind === 'road' || nodes[i - 1].kind === 'road' ? ROAD_GAP : FIGHT_GAP;
    n.x = x;
    n.y = 235 + Math.sin(i * 0.82) * 72 + Math.sin(i * 0.31 + 1) * 24;
  });
  const width = x + MARGIN;
  for (const [k, s] of spans.entries()) {
    s.x0 = k ? (nodes[s.first - 1].x + nodes[s.first].x) / 2 : 0;
    s.x1 = k === spans.length - 1 ? width : (nodes[s.last].x + nodes[s.last + 1].x) / 2;
  }
  return { nodes, spans, width };
}

// ---------- Painting the regions ----------

function band(g, x0, x1, stops) {
  const fill = g.createLinearGradient(0, 0, 0, WORLD_H);
  stops.forEach((c, i) => fill.addColorStop(i / (stops.length - 1), c));
  g.fillStyle = fill;
  g.fillRect(x0, 0, x1 - x0, WORLD_H);
}

function ridge(g, r, x0, x1, base, height, step, color, sharp = true) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x0, WORLD_H);
  g.lineTo(x0, base);
  for (let x = x0; x < x1; ) {
    const across = step * (0.6 + r() * 0.8);
    const up = height * (0.5 + r() * 0.6);
    if (sharp) {
      g.lineTo(x + across / 2, base - up);
      g.lineTo(x + across, base - up * 0.15);
    } else g.quadraticCurveTo(x + across / 2, base - up, x + across, base - up * 0.2);
    x += across;
  }
  g.lineTo(x1, base);
  g.lineTo(x1, WORLD_H);
  g.closePath();
  g.fill();
}

function disc(g, x, y, radius, color) {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}

const SCENES = {
  wood(g, r, x0, x1) {
    band(g, x0, x1, ['#160c06', '#3f210c', '#94521a', '#d3893a', '#5a2f12']);
    ridge(g, r, x0, x1, 330, 120, 46, '#9a5520');
    ridge(g, r, x0, x1, 400, 170, 66, '#5e3213');
    ridge(g, r, x0, x1, 470, 210, 96, '#2e170a');
    g.fillStyle = '#100905';
    for (let x = x0 + 20; x < x1; x += 90 + r() * 110) g.fillRect(x, 0, 16 + r() * 22, WORLD_H);
    for (let x = x0; x < x1; x += 34) disc(g, x + r() * 20, 20 + r() * 26, 26 + r() * 22, ['#2a1408', '#5a2a0c', '#9a4f18'][Math.floor(r() * 3)]);
    for (let i = 0; i < (x1 - x0) / 22; i++) {
      g.fillStyle = ['#e0a24a', '#c56a1e'][i % 2];
      g.fillRect(x0 + r() * (x1 - x0), 90 + r() * 400, 4, 2.5);
    }
  },
  river(g, r, x0, x1) {
    band(g, x0, x1, ['#071317', '#103038', '#1d4b52', '#0d2a2f']);
    ridge(g, r, x0, x1, 250, 90, 120, '#123038', false);
    ridge(g, r, x0, x1, 300, 80, 150, '#0b2329', false);
    g.fillStyle = '#2f7f88';
    g.beginPath();
    g.moveTo(x0, 330);
    for (let x = x0; x <= x1; x += 30) g.lineTo(x, 330 + Math.sin(x * 0.009) * 26);
    for (let x = x1; x >= x0; x -= 30) g.lineTo(x, 470 + Math.sin(x * 0.007 + 2) * 22);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(190,240,240,.42)';
    for (let i = 0; i < (x1 - x0) / 16; i++) g.fillRect(x0 + r() * (x1 - x0), 348 + r() * 108, 14 + r() * 40, 2);
    g.strokeStyle = '#06181b';
    g.lineWidth = 3;
    for (let x = x0; x < x1; x += 14 + r() * 20) {
      const y = r() < 0.5 ? 340 : 490;
      g.beginPath();
      g.moveTo(x, y + 30);
      g.quadraticCurveTo(x + 3, y, x + (r() - 0.5) * 16, y - 18 - r() * 26);
      g.stroke();
    }
  },
  dojo(g, r, x0, x1) {
    band(g, x0, x1, ['#05070e', '#0e1626', '#1b2a42', '#0a111c']);
    disc(g, x0 + (x1 - x0) * 0.62, 118, 62, '#e9e2c0');
    disc(g, x0 + (x1 - x0) * 0.62 + 16, 108, 12, 'rgba(180,170,140,.5)');
    ridge(g, r, x0, x1, 380, 120, 130, '#101b2c', false);
    for (const at of [0.25, 0.76]) {
      const cx = x0 + (x1 - x0) * at;
      for (let k = 0; k < 3; k++) {
        const y = 380 - k * 56;
        const half = 92 - k * 22;
        g.fillStyle = '#060a12';
        g.beginPath();
        g.moveTo(cx - half, y);
        g.quadraticCurveTo(cx - half * 0.5, y - 10, cx - half * 0.34, y - 26);
        g.lineTo(cx + half * 0.34, y - 26);
        g.quadraticCurveTo(cx + half * 0.5, y - 10, cx + half, y);
        g.closePath();
        g.fill();
        g.fillRect(cx - half * 0.6, y, half * 1.2, 34);
        g.fillStyle = '#e8a74a';
        g.fillRect(cx - 10, y + 10, 20, 16);
      }
    }
    g.fillStyle = '#16321f';
    for (let x = x0; x < x1; x += 22 + r() * 38) {
      g.fillRect(x, 0, 7, WORLD_H);
      for (let y = 40 + r() * 40; y < WORLD_H; y += 74) {
        g.fillStyle = '#0a1c11';
        g.fillRect(x - 1, y, 9, 3);
        g.fillStyle = '#16321f';
      }
    }
    g.fillStyle = 'rgba(255,196,212,.85)';
    for (let i = 0; i < (x1 - x0) / 24; i++) g.fillRect(x0 + r() * (x1 - x0), r() * 500, 4, 2.5);
  },
  sun(g, r, x0, x1) {
    band(g, x0, x1, ['#3a1d08', '#9a5316', '#ec9f3a', '#ffd577', '#c98a34']);
    const cx = x0 + (x1 - x0) * 0.5;
    disc(g, cx, 250, 140, 'rgba(255,233,160,.35)');
    disc(g, cx, 250, 104, '#fff0b8');
    ridge(g, r, x0, x1, 360, 70, 190, '#b9772a', false);
    // A ring of old arches: the Sun Road's arena.
    g.fillStyle = '#5a3412';
    const ax = x0 + (x1 - x0) * 0.72;
    g.fillRect(ax, 250, 300, 130);
    g.fillStyle = '#ffd577';
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(ax + 14 + i * 48, 380);
      g.lineTo(ax + 14 + i * 48, 306);
      g.arc(ax + 30 + i * 48, 306, 16, Math.PI, 0);
      g.lineTo(ax + 46 + i * 48, 380);
      g.closePath();
      g.fill();
    }
    ridge(g, r, x0, x1, 420, 60, 230, '#8f5a1e', false);
    ridge(g, r, x0, x1, 490, 60, 280, '#5e3812', false);
  },
  night(g, r, x0, x1) {
    band(g, x0, x1, ['#030409', '#080c16', '#121a2a', '#070a12']);
    g.fillStyle = '#f2ecd4';
    for (let i = 0; i < (x1 - x0) / 9; i++) g.fillRect(x0 + r() * (x1 - x0), r() * 280, 1 + r() * 1.6, 1 + r() * 1.6);
    const mx = x0 + (x1 - x0) * 0.3;
    disc(g, mx, 104, 44, '#efe7c6');
    disc(g, mx + 18, 94, 40, '#070b14');
    ridge(g, r, x0, x1, 400, 90, 110, '#0b101c', false);
    g.strokeStyle = '#020305';
    g.lineCap = 'round';
    const branch = (x, y, a, len, w) => {
      if (w < 1.4) return;
      const ex = x + Math.cos(a) * len;
      const ey = y + Math.sin(a) * len;
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(ex, ey);
      g.stroke();
      branch(ex, ey, a - 0.5 - r() * 0.3, len * 0.74, w * 0.68);
      branch(ex, ey, a + 0.42 + r() * 0.3, len * 0.7, w * 0.68);
    };
    for (let x = x0 + 60; x < x1; x += 180 + r() * 160) branch(x, 500, -Math.PI / 2 + (r() - 0.5) * 0.3, 74 + r() * 34, 14);
    g.lineCap = 'butt';
    g.fillStyle = 'rgba(190,205,225,.1)';
    for (let x = x0; x < x1; x += 170) {
      g.beginPath();
      g.ellipse(x + r() * 90, 440 + r() * 40, 170, 22, 0, 0, Math.PI * 2);
      g.fill();
    }
  },
  storm(g, r, x0, x1) {
    band(g, x0, x1, ['#0a141a', '#1c333f', '#38596a', '#142530']);
    ridge(g, r, x0, x1, 330, 190, 130, '#a7c6d4');
    ridge(g, r, x0, x1, 370, 150, 110, '#4f7486');
    const fx = x0 + (x1 - x0) * 0.5;
    g.fillStyle = 'rgba(214,240,250,.75)';
    g.fillRect(fx, 150, 52, 300);
    g.fillStyle = 'rgba(120,180,205,.8)';
    for (let i = 0; i < 9; i++) g.fillRect(fx + 3 + i * 5.4, 150 + r() * 80, 2, 220);
    ridge(g, r, x0, x1, 450, 60, 80, '#1b2f3a');
    g.strokeStyle = 'rgba(220,240,250,.28)';
    g.lineWidth = 1.5;
    for (let i = 0; i < (x1 - x0) / 7; i++) {
      const x = x0 + r() * (x1 - x0);
      const y = r() * 500;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x - 7, y + 22);
      g.stroke();
    }
    g.strokeStyle = '#fff6d6';
    g.lineWidth = 3;
    g.beginPath();
    let bx = x0 + (x1 - x0) * 0.2;
    let by = 0;
    g.moveTo(bx, by);
    while (by < 210) {
      bx += (r() - 0.5) * 50;
      by += 26 + r() * 22;
      g.lineTo(bx, by);
    }
    g.stroke();
  },
  // VI's home, the one purple place on the map.
  drift(g, r, x0, x1) {
    band(g, x0, x1, ['#08021a', '#22094a', '#4a1f8c', '#16063a']);
    g.fillStyle = '#e6d0ff';
    for (let i = 0; i < (x1 - x0) / 12; i++) g.fillRect(x0 + r() * (x1 - x0), r() * 300, 1.6, 1.6);
    for (let i = 0; i < (x1 - x0) / 85; i++) {
      const x = x0 + r() * (x1 - x0);
      const y = 110 + r() * 340;
      const w = 34 + r() * 86;
      g.fillStyle = '#1c0b3e';
      g.beginPath();
      g.moveTo(x - w, y);
      g.lineTo(x + w, y);
      g.lineTo(x + w * 0.4, y + 18 + r() * 12);
      g.lineTo(x, y + 38 + r() * 26);
      g.lineTo(x - w * 0.5, y + 16 + r() * 8);
      g.closePath();
      g.fill();
      g.fillStyle = '#c79cff';
      g.fillRect(x - w, y - 2, w * 2, 3);
    }
  },
};

function paint(canvas, map, done, unit) {
  const g = canvas.getContext('2d', { alpha: false });
  const dpr = Math.min(1.5, devicePixelRatio || 1);
  const scale = Math.min(1.5, unit * dpr);
  canvas.width = Math.round(map.width * scale);
  canvas.height = Math.round(WORLD_H * scale);
  g.scale(scale, scale);
  for (const [k, s] of map.spans.entries()) {
    g.save();
    g.beginPath();
    g.rect(s.x0, 0, s.x1 - s.x0, WORLD_H);
    g.clip();
    SCENES[s.region.look](g, seeded(811 + k * 137), s.x0, s.x1);
    g.restore();
  }
  // Soft dark seams, so one land fades into the next.
  for (const s of map.spans.slice(1)) {
    const seam = g.createLinearGradient(s.x0 - 70, 0, s.x0 + 70, 0);
    seam.addColorStop(0, 'rgba(6,7,8,0)');
    seam.addColorStop(0.5, 'rgba(6,7,8,.92)');
    seam.addColorStop(1, 'rgba(6,7,8,0)');
    g.fillStyle = seam;
    g.fillRect(s.x0 - 70, 0, 140, WORLD_H);
  }
  // The road: an ink edge, a dark bed, dashes ahead of you and solid gold behind.
  const trace = (upTo) => {
    const { nodes } = map;
    g.beginPath();
    g.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i <= upTo; i++) {
      const a = nodes[i - 1];
      const b = nodes[i];
      g.bezierCurveTo((a.x + b.x) / 2, a.y, (a.x + b.x) / 2, b.y, b.x, b.y);
    }
  };
  const all = map.nodes.length - 1;
  const reached = map.nodes.findIndex((n) => n.i === done);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  trace(all);
  g.strokeStyle = INK;
  g.lineWidth = 16;
  g.stroke();
  g.strokeStyle = '#3d3423';
  g.lineWidth = 11;
  g.stroke();
  g.setLineDash([3, 16]);
  g.strokeStyle = CREAM;
  g.lineWidth = 4;
  g.stroke();
  g.setLineDash([]);
  trace(reached < 0 ? all : reached);
  g.strokeStyle = GOLD;
  g.lineWidth = 9;
  g.stroke();
}

// ---------- The buttons on top ----------

const ROAD_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19h6l2-6h5l2-6h3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// tools: the client's portrait(), hero list and what to do on Play or on choosing who to play as.
export function createTrail(tools) {
  const { $, portrait, HEROES, onPlay, onHero } = tools;
  const map = layout();
  const scroller = $('trail-scroll');
  const world = $('trail-world');
  const canvas = $('trail-art');
  const faces = new Map();
  let save = null;
  let picked = 0;
  let unit = 1;

  const face = (c, hero, dark = false) => {
    const g = c.getContext('2d');
    portrait(g, hero, '#ffc94d', 0);
    if (dark) {
      // A silhouette: who it is stays a surprise, and it's painted once rather than filtered on every scroll.
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = '#17140f';
      g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = 'source-over';
    }
  };

  for (const s of map.spans) {
    const label = document.createElement('span');
    label.className = 'trail-region';
    label.textContent = s.region.name;
    label.style.left = `calc(${(s.x0 + s.x1) / 2} * var(--u))`;
    world.append(label);
  }

  for (const n of map.nodes) {
    const el = document.createElement(n.kind === 'fight' || n.kind === 'road' ? 'button' : 'div');
    el.className = `stop stop-${n.kind}`;
    el.style.left = `calc(${n.x} * var(--u))`;
    el.style.top = `calc(${n.y} * var(--u))`;
    n.el = el;
    if (n.kind === 'fight' || n.kind === 'camp') {
      const c = document.createElement('canvas');
      c.width = c.height = 96;
      el.append(c);
      n.face = c;
    } else if (n.kind === 'road') {
      el.innerHTML = ROAD_ICON;
    } else {
      el.textContent = '?';
    }
    const tag = document.createElement('span');
    tag.className = 'stop-tag';
    el.append(tag);
    n.tag = tag;
    if (el.tagName === 'BUTTON') {
      el.type = 'button';
      el.addEventListener('click', () => {
        if (dragged) return;
        select(n.i);
      });
    }
    world.append(el);
    if (n.kind === 'fight') faces.set(n.i, n);
  }

  function select(i) {
    picked = i;
    for (const n of map.nodes) n.el.classList.toggle('picked', n.i === i);
    const stop = STOPS[i];
    const can = canPlay(i, save.done);
    const seen = i <= save.done;
    const name = stop.kind === 'fight' && seen ? HEROES[stop.hero].full : '';
    $('trail-name').textContent = stop.kind === 'road' ? `Area ${stop.area}: ${stop.road?.name ?? 'The road'}` : `Area ${stop.area}: ${name || 'Unknown'}`;
    $('trail-text').textContent = !seen
      ? 'Clear the earlier areas to open this one.'
      : !stop.open
        ? 'This area is on the way.'
        : stop.kind === 'road'
          ? `${stop.road.tip} Reach the gate at the far end. A fall sends you back to the last flag.`
          : `Defeat ${name} and absorb the power of ${HEROES[stop.hero].skill}.`;
    const go = $('trail-go');
    go.disabled = !can;
    go.textContent = !can ? (seen ? 'Soon' : 'Locked') : stop.kind === 'road' ? 'Run' : 'Fight';
    drawAs();
  }

  function drawAs() {
    const heroes = unlockedHeroes(save.done);
    $('trail-count').textContent = `${heroes.length} / ${HEROES.length} heroes`;
    // A road is always played as the hero you took just before it. A fight lets you choose from everyone you have.
    const stop = STOPS[picked];
    const locked = stop?.kind === 'road' && canPlay(picked, save.done) ? stop.as : null;
    $('trail-as-label').textContent = locked === null ? 'Fight as' : 'Locked to';
    $('trail-as').replaceChildren(
      ...(locked === null ? heroes : [locked]).map((h) => {
        const b = document.createElement('button');
        b.type = 'button';
        const on = locked === null ? h === save.hero : true;
        b.className = `as-hero${on ? ' on' : ''}`;
        b.setAttribute('aria-label', `Play as ${HEROES[h].full}`);
        b.setAttribute('aria-pressed', String(on));
        b.disabled = locked !== null;
        const c = document.createElement('canvas');
        c.width = c.height = 72;
        b.append(c);
        b.addEventListener('click', () => {
          save = onHero(h);
          drawAs();
          refresh();
        });
        // Drawn after it's on the page, as portrait() only needs the canvas.
        face(c, h);
        return b;
      }),
    );
  }

  function refresh() {
    for (const n of map.nodes) {
      if (n.kind === 'camp') {
        face(n.face, ROSTER[0]);
        n.tag.textContent = `${HEROES[ROSTER[0]].name} · start`;
      } else if (n.kind === 'soon') {
        n.tag.textContent = `${n.name} · soon`;
      } else {
        const stop = STOPS[n.i];
        const beaten = n.i < save.done;
        const current = n.i === save.done;
        n.el.classList.toggle('beaten', beaten);
        n.el.classList.toggle('current', current);
        n.el.classList.toggle('locked', !beaten && !current);
        if (n.kind === 'fight') {
          face(n.face, stop.hero, !beaten && !current);
          n.tag.textContent = beaten || current ? HEROES[stop.hero].name : `Area ${stop.area}`;
        } else n.tag.textContent = `Area ${stop.area}`;
      }
    }
  }

  // A PC has no finger to drag with, so the wheel and a held mouse do it. Touch scrolls natively.
  let dragged = false;
  let grab = null;
  scroller.addEventListener(
    'wheel',
    (e) => {
      if (!e.deltaY) return;
      e.preventDefault();
      scroller.scrollLeft += e.deltaY;
    },
    { passive: false },
  );
  scroller.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    grab = { x: e.clientX, left: scroller.scrollLeft };
    dragged = false;
  });
  addEventListener('pointermove', (e) => {
    if (!grab) return;
    if (Math.abs(e.clientX - grab.x) > 6) dragged = true;
    if (dragged) scroller.scrollLeft = grab.left - (e.clientX - grab.x);
  });
  addEventListener('pointerup', () => {
    grab = null;
    // Lets the click that ends a drag see it, then clears.
    setTimeout(() => (dragged = false));
  });

  function fit() {
    const h = scroller.clientHeight;
    if (!h) return;
    unit = h / WORLD_H;
    world.style.setProperty('--u', `${unit}px`);
    world.style.width = `${map.width * unit}px`;
    if (save) paint(canvas, map, save.done, unit);
  }

  return {
    fit,
    open(next) {
      save = next;
      fit();
      refresh();
      const target = Math.min(save.done, STOPS.length - 1);
      select(target);
      const node = map.nodes.find((n) => n.i === target);
      scroller.scrollLeft = node.x * unit - scroller.clientWidth * 0.42;
    },
    play: () => onPlay(picked),
  };
}
