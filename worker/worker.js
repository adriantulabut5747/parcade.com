// Cloudflare Worker for Parcade. One Durable Object per room runs the match, so
// players' browsers only send keys and can't decide results.
// Deploy: see wrangler.toml.

import { ALL_KEYS, KEY, MAX_PLAYERS, STEPS_PER_SEC, addPlayer, chooseMap, newGame, removePlayer, setHero, snapshotOf, step } from '../site/sim.js';

const STEP_MS = 1000 / STEPS_PER_SEC;
const MAX_QUEUED = 4;
// A press mustn't be lost when a queued input is dropped.
const TAP_KEYS = KEY.JUMP | KEY.SKILL | KEY.DASH;
const DRAIN_EVERY = STEPS_PER_SEC / 2;
const MAX_MSGS_PER_SEC = 120;
// Running rooms cost money, so an abandoned tab can't keep one alive.
const IDLE_STEPS = STEPS_PER_SEC * 300;
// Browsers send keys constantly, even a throttled background tab, so silence means a dead connection.
const SILENT_STEPS = STEPS_PER_SEC * 10;

// The live sites and Netlify preview links, plus this PC and phones on its network while testing.
function allowedOrigin(origin) {
  return (
    /^https:\/\/([a-z0-9-]+--)?parcades\.netlify\.app$/.test(origin) ||
    origin === 'https://adriantulabut5747.github.io' ||
    /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):8766$/.test(origin)
  );
}

// Rooms in some Cloudflare sites get their updates seconds late, and a room can't choose where it lands.
// Measured from the Philippines, Nov 4: Singapore 65-130 ms, Osaka and Tokyo 1300-2800 ms, with the server's own timer steady in all of them.
// So a room code tries hidden rooms until one lands somewhere good.
// shortcut: this list only suits players near Singapore; measure again before opening the game to other regions.
const GOOD_SITES = ['SIN'];
const MAX_TRIES = 8;
const roomAt = (env, name) => env.ROOM.get(env.ROOM.idFromName(name), { locationHint: 'apac' });

export class Room {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.game = newGame();
    this.conns = new Map(); // player id -> { ws, queue, keys, ack, msgs, active, seen }
    this.timer = null;
  }

  // Which Cloudflare site this object runs in. Saved, because rooms stay where they first landed.
  async site() {
    let site = await this.state.storage.get('site');
    if (!site) {
      const trace = await (await fetch('https://www.cloudflare.com/cdn-cgi/trace')).text();
      site = /colo=(\w+)/.exec(trace)[1];
      await this.state.storage.put('site', site);
    }
    return site;
  }

  // One object per code decides once which hidden room that code uses, so everyone with the code lands in the same one.
  async choose(code) {
    let pick = await this.state.storage.get('pick');
    if (pick !== undefined) return pick;
    pick = 0;
    for (let n = 0; n < MAX_TRIES; n++) {
      // A site we couldn't read counts as not good, so the next room gets tried.
      const site = await roomAt(this.env, `${code}:${n}`)
        .fetch('https://room/site')
        .then((r) => r.text())
        .catch(() => '');
      if (GOOD_SITES.includes(site)) {
        pick = n;
        break;
      }
    }
    await this.state.storage.put('pick', pick);
    return pick;
  }

  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname === '/site') return new Response(await this.site().catch(() => ''));
    if (pathname.startsWith('/pick/')) {
      // Kept as one promise, so two people joining at the same moment wait for the same answer.
      this.picking ??= this.choose(pathname.slice(6));
      return new Response(String(await this.picking));
    }
    this.siteName ??= await this.site().catch(() => '');
    const { 0: client, 1: ws } = new WebSocketPair();
    ws.accept();
    let id = 0;
    while (this.conns.has(id)) id++;
    if (id >= MAX_PLAYERS) {
      ws.close(4000, 'full');
      return new Response(null, { status: 101, webSocket: client });
    }

    addPlayer(this.game, id);
    const conn = { ws, queue: [], keys: 0, ack: 0, msgs: 0, active: this.game.tick, seen: this.game.tick };
    this.conns.set(id, conn);
    // site says which Cloudflare site the room runs in, for measuring delay. The game ignores it.
    ws.send(JSON.stringify({ t: 'hi', id, site: this.siteName }));

    ws.addEventListener('message', (e) => this.onMessage(id, conn, e.data));
    const leave = () => this.leave(id, conn);
    ws.addEventListener('close', leave);
    ws.addEventListener('error', leave);

    if (!this.timer) {
      this.last = Date.now();
      this.timer = setInterval(() => this.tick(), STEP_MS);
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  // Everything here comes from the player's browser, so none of it is trusted.
  onMessage(id, conn, data) {
    if (++conn.msgs > MAX_MSGS_PER_SEC) return conn.ws.close(4001, 'too many messages');
    if (typeof data !== 'string' || data.length > 64) return;
    let m;
    try {
      m = JSON.parse(data);
    } catch {
      return;
    }
    if (m && 'h' in m) {
      conn.seen = conn.active = this.game.tick;
      return setHero(this.game, id, m.h);
    }
    if (m && 'mp' in m) {
      conn.seen = conn.active = this.game.tick;
      return chooseMap(this.game, id, m.mp);
    }
    if (!m || !Number.isSafeInteger(m.s) || !Number.isInteger(m.b) || m.b < 0 || m.b > ALL_KEYS || m.s <= conn.ack) return;
    conn.seen = this.game.tick;
    conn.queue.push(m);
    // One input per step, so sending inputs faster can't make you move faster.
    if (conn.queue.length > MAX_QUEUED) this.dropOldest(conn);
  }

  dropOldest(conn) {
    const old = conn.queue.shift();
    conn.queue[0].b |= old.b & TAP_KEYS;
  }

  leave(id, conn) {
    if (this.conns.get(id) !== conn) return;
    this.conns.delete(id);
    removePlayer(this.game, id);
    if (this.conns.size === 0) {
      clearInterval(this.timer);
      this.timer = null;
      this.game = newGame();
    }
  }

  tick() {
    const now = Date.now();
    let steps = 0;
    // A late timer catches up a little; after a long stall it skips rather than fast-forwards.
    while (now - this.last >= STEP_MS && steps < 3) {
      this.last += STEP_MS;
      steps++;
      for (const conn of this.conns.values()) {
        // A burst from a phone would otherwise sit in the queue as permanent input lag, so it drains.
        if (this.game.tick % DRAIN_EVERY === 0 && conn.queue.length > 1) this.dropOldest(conn);
        const next = conn.queue.shift();
        if (next) {
          conn.keys = next.b;
          conn.ack = next.s;
          if (next.b) conn.active = this.game.tick;
        }
      }
      step(this.game, (id) => this.conns.get(id).keys);
    }
    if (now - this.last > 1000) this.last = now;
    if (!steps) return;

    const { tick } = this.game;
    const everySecond = tick % STEPS_PER_SEC < steps;
    // Built once and shared. Two decimals is plenty, and it's about half the bytes on a phone's connection.
    const world = JSON.stringify(snapshotOf(this.game), (k, v) =>
      typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 100) / 100 : v,
    );
    for (const [id, conn] of [...this.conns]) {
      if (everySecond) conn.msgs = 0;
      if (tick - conn.active > IDLE_STEPS || tick - conn.seen > SILENT_STEPS) {
        conn.ws.close(4002, 'idle');
        this.leave(id, conn);
        continue;
      }
      try {
        conn.ws.send(`{"a":${conn.ack},${world.slice(1)}`);
      } catch {
        this.leave(id, conn);
      }
    }
    // Effects go out once; the next snapshot starts a fresh list.
    this.game.fx = [];
  }
}

export default {
  async fetch(request, env) {
    const match = new URL(request.url).pathname.match(/^\/room\/([A-Z2-9]{5})$/);
    if (!match) return new Response('Not found', { status: 404 });
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    const origin = request.headers.get('Origin') || '';
    if (!allowedOrigin(origin)) return new Response('Forbidden', { status: 403 });
    const code = match[1];
    // Testing on this PC has only one site, so there's nothing to choose.
    const pick = origin.startsWith('http://') ? 0 : await (await roomAt(env, `pick:${code}`).fetch(`https://room/pick/${code}`)).text();
    return roomAt(env, `${code}:${pick}`).fetch(request);
  },
};
