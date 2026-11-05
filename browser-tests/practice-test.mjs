// Practice mode in a real browser: the setup screen, a whole round against bots, pausing, and frame cost on a slowed-down phone.
// Needs only the page server and headless Chrome, no room server: node browser-tests/practice-test.mjs E:/claude-tmp/shots
import assert from 'node:assert/strict';
import fs from 'node:fs';

const SP = process.argv[2];
const BASE = 'http://127.0.0.1:8766/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];

async function open() {
  const t = await (await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let n = 0;
  const wait = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id) {
      wait.get(m.id)?.(m);
      wait.delete(m.id);
    }
    if (m.method === 'Runtime.exceptionThrown') errors.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 300));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/fonts\.g/.test(m.params.entry.url || '')) errors.push(`${m.params.entry.text} ${m.params.entry.url || ''}`);
  };
  const send = (method, params = {}) =>
    new Promise((res) => {
      const id = ++n;
      wait.set(id, res);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const ev = async (expression, awaitPromise = false) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
    if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500));
    return r.result.result.value;
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  const page = {
    send,
    ev,
    go: (url) => send('Page.navigate', { url }),
    size: (w, h, mobile) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: !!mobile }),
    touch: (on) => send('Emulation.setTouchEmulationEnabled', { enabled: on, maxTouchPoints: 5 }),
    shot: async (name) => {
      await send('Page.bringToFront');
      await sleep(80);
      const r = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${SP}/${name}.png`, Buffer.from(r.result.data, 'base64'));
    },
    until: async (expression, ms = 8000) => {
      const end = Date.now() + ms;
      while (Date.now() < end) {
        if (await ev(expression)) return true;
        await sleep(100);
      }
      throw new Error(`timed out waiting for: ${expression}`);
    },
    fits: () => ev('({ w: document.documentElement.scrollWidth, iw: innerWidth, h: document.documentElement.scrollHeight, ih: innerHeight })'),
  };
  return page;
}

const panelFits = `(() => { const r = document.querySelector('.home-panel').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; })()`;

// ---------- Phone: the whole way through, on the hardest setting ----------
const p = await open();
await p.size(844, 390, true);
await p.touch(true);
await p.go(BASE);
await p.until(`window.__arena?.screen() === 'home'`);
await sleep(400);
await p.shot('phone-home');
assert.ok(await p.ev(panelFits), 'the home panel fits a phone');
await p.ev(`document.getElementById('practice-open').click()`);
await sleep(100);
await p.shot('phone-setup');
assert.ok(await p.ev(panelFits), 'the setup fits a phone');
assert.equal(await p.ev(`document.getElementById('bot-count').children.length`), 3);
assert.equal(await p.ev(`document.getElementById('bot-level').children.length`), 4);
await p.ev(`document.querySelector('#bot-count .tab:nth-child(3)').click(); document.querySelector('#bot-level .tab:nth-child(4)').click()`);
assert.match(await p.ev(`document.getElementById('level-blurb').textContent`), /predicts/);
await p.shot('phone-setup-picked');
await p.ev(`document.querySelector('#practice-setup [type=submit]').click()`);
await sleep(600);
assert.match(await p.ev('location.search'), /bots=3/);
assert.match(await p.ev('location.search'), /level=veryhard/);
await p.until(`window.__arena?.screen() === 'pick'`);
await sleep(400);
await p.shot('phone-pick');
assert.match(await p.ev(`document.getElementById('pick-note').textContent`), /Very hard practice against 3 bots/);
assert.equal(await p.ev(`[...document.querySelectorAll('.copy-link')].every((b) => b.hidden)`), true, 'nothing to invite anyone to');
assert.equal(await p.ev(`document.getElementById('pick-clock').hidden`), true, 'no clock');
assert.equal(await p.ev(`document.getElementById('pick-leave').hidden`), false, 'a way out');
const before = await p.ev(`__arena.latest().pk`);
await sleep(1500);
assert.equal(await p.ev(`__arena.latest().pk`), before, 'practice waits for you');
assert.equal(await p.ev(`__arena.latest().p.filter((o) => o.id > 0 && o.ready && o.hero !== null).length`), 3);

await p.ev(`__arena.pick(7)`);
await p.until(`window.__arena.screen() === 'play'`);
const start = await p.ev(`JSON.stringify(__arena.latest().p.map((o) => [o.x, o.y]))`);
await sleep(2500);
const moved = await p.ev(`JSON.stringify(__arena.latest().p.map((o) => [o.x, o.y]))`);
assert.notEqual(start, moved, 'the bots move');
assert.equal(await p.ev(`document.getElementById('ping').textContent`), '', 'no ping on a game with no connection');
await p.shot('phone-fight');

// The menu pauses it.
await p.ev(`document.getElementById('menu-open').click()`);
await sleep(200);
const frozen = await p.ev(`__arena.latest().k`);
await sleep(800);
assert.equal(await p.ev(`__arena.latest().k`), frozen, 'the menu pauses practice');
assert.equal(await p.ev(`document.getElementById('leave').textContent`), 'Leave practice');
assert.equal(await p.ev(`document.getElementById('menu-room').hidden`), true);
await p.shot('phone-menu');
await p.ev(`document.getElementById('menu-close').click()`);
await sleep(500);
assert.ok((await p.ev(`__arena.latest().k`)) > frozen, 'and closing it carries on');

// Frame cost at 6x CPU slowdown, the same way perf.mjs measures it.
await p.send('Emulation.setCPUThrottlingRate', { rate: 6 });
await p.send('Page.bringToFront');
const perf = await p.ev(
  `new Promise((done) => {
    const gaps = [];
    let last = performance.now();
    let busy = 0;
    const seen = new PerformanceObserver((l) => { for (const e of l.getEntries()) busy += e.duration; });
    seen.observe({ entryTypes: ['longtask'] });
    const started = last;
    function tick(now) {
      gaps.push(now - last);
      last = now;
      if (now - started < 12000) return requestAnimationFrame(tick);
      gaps.sort((a, b) => a - b);
      done({ frames: gaps.length, median: gaps[gaps.length >> 1], p95: gaps[Math.floor(gaps.length * 0.95)], worst: gaps[gaps.length - 1], longTaskMs: busy, alive: __arena.latest().p.filter((o) => o.lives > 0).length, k: __arena.latest().k });
    }
    requestAnimationFrame(tick);
  })`,
  true,
);
console.log('6x slowdown, 3 very hard bots:', perf);
await p.send('Emulation.setCPUThrottlingRate', { rate: 1 });
assert.ok(perf.p95 < 40, `frames too slow: ${JSON.stringify(perf)}`);

// You stand still, so the bots knock you out and the round ends.
await p.until(`__arena.latest().o > 0`, 120000);
await sleep(600);
await p.shot('phone-results');
assert.ok((await p.ev(`document.getElementById('results-title').textContent`)).length > 0);
const results = await p.ev(`JSON.stringify(__arena.latest().p.map((o) => ({ id: o.id, lives: o.lives, kos: o.kos, hits: o.hits, falls: o.falls })))`);
console.log('round result, you standing still:', results);
await p.until(`__arena.latest().pk > 0`, 15000);
await sleep(300);
assert.equal(await p.ev(`__arena.latest().p.filter((o) => o.id > 0 && o.ready).length`), 3, 'the bots are ready for the next round');

// ---------- Desktop ----------
await p.touch(false);
await p.size(1280, 720, false);
await p.go(BASE);
await p.until(`window.__arena?.screen() === 'home'`);
await sleep(500);
await p.shot('desk-home');
await p.ev(`document.getElementById('practice-open').click()`);
await sleep(100);
await p.shot('desk-setup');
await p.ev(`document.getElementById('practice-back').click()`);
assert.equal(await p.ev(`document.getElementById('home-start').hidden`), false, 'Back returns to the start');

// A hand-typed address with nonsense settings just goes home.
for (const q of ['?bots=9&level=hard', '?bots=2&level=toString', '?bots=2']) {
  await p.go(BASE + q);
  await sleep(500);
  await p.until(`window.__arena?.screen() === 'home'`);
}

// Easy on a desktop too, and the keyboard reaches a real hero.
await p.go(`${BASE}?bots=1&level=easy`);
await p.until(`window.__arena?.screen() === 'pick'`);
await sleep(200);
await p.shot('desk-pick');
await p.ev(`__arena.pick(0)`);
await p.until(`window.__arena.screen() === 'play'`);
await p.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyD', key: 'd', windowsVirtualKeyCode: 68 });
await sleep(1500);
const right = await p.ev(`__arena.me().x`);
await p.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyD', key: 'd', windowsVirtualKeyCode: 68 });
await p.shot('desk-fight');
console.log('walked right to x =', right);

assert.deepEqual(errors, [], 'no page errors');
console.log('practice in the browser ok');
process.exit(0);
