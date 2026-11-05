// The campaign in a real browser: home button, map, a fight through to becoming the boss, the road, and the next fight. Screenshots of every step.
// Needs only the page server and headless Chrome: node browser-tests/campaign-test.mjs E:/claude-tmp/shots
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
    if (m.method === 'Runtime.exceptionThrown') errors.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 400));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/fonts\.g/.test(m.params.entry.url || '')) errors.push(`${m.params.entry.text} ${m.params.entry.url || ''}`);
  };
  const send = (method, params = {}) =>
    new Promise((res) => {
      const id = ++n;
      wait.set(id, res);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500));
    return r.result.result.value;
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');
  await send('Network.enable');
  await send('Network.clearBrowserCache');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  return {
    close: () => fetch(`http://127.0.0.1:9333/json/close/${t.id}`),
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
        await sleep(50);
      }
      throw new Error(`timed out waiting for: ${expression}`);
    },
  };
}

const phase = `__arena.latest()?.camp?.ph`;
const room = `__arena.room().game`;

async function play(p, tag) {
  await p.go(BASE);
  await p.until(`window.__arena?.screen() === 'home'`);
  await p.ev(`localStorage.removeItem('parcade-campaign')`);
  await sleep(300);
  await p.shot(`${tag}-1-home`);
  assert.equal(await p.ev(`document.getElementById('campaign-open').textContent`), 'Campaign');
  await p.ev(`document.getElementById('campaign-open').click()`);
  await sleep(400);
  await p.until(`window.__arena?.screen() === 'map'`);
  await sleep(300);
  await p.shot(`${tag}-2-map-start`);
  assert.equal(await p.ev(`document.documentElement.scrollWidth <= innerWidth`), true, 'the map scrolls inside itself, not the page');
  assert.equal(await p.ev(`document.getElementById('trail-go').textContent`), 'Fight');
  assert.equal(await p.ev(`document.querySelectorAll('.stop-fight').length`), 19);
  assert.equal(await p.ev(`document.querySelectorAll('.stop.locked').length`), 36, 'everything past the first stop is locked');
  assert.equal(await p.ev(`document.querySelectorAll('#trail-as .as-hero').length`), 1, 'starts with Sniper alone');
  const end = await p.ev(`(() => { const s = document.getElementById('trail-scroll'); s.scrollLeft = 1e6; return s.scrollLeft; })()`);
  assert.ok(end > 2000, `the trail is long, scrolled to ${end}`);
  await sleep(100);
  await p.shot(`${tag}-3-map-end`);
  for (const at of [0.25, 0.5, 0.75]) {
    await p.ev(`document.getElementById('trail-scroll').scrollLeft = ${end * at}`);
    await sleep(60);
    await p.shot(`${tag}-3-map-${at * 100}`);
  }
  await p.ev(`document.getElementById('trail-scroll').scrollLeft = 0`);

  // The first fight.
  await p.ev(`document.getElementById('trail-go').click()`);
  await p.until(`${phase} === 'fight'`);
  assert.equal(await p.ev(`__arena.screen()`), 'play', 'no pick screen');
  assert.equal(await p.ev(`__arena.me().hero`), 0, 'you start as Sniper');
  await sleep(700);
  await p.shot(`${tag}-4-fight`);
  assert.equal(await p.ev(`__arena.latest().m`), 5, 'in the new forest');
  await p.ev(`(() => { const b = ${room}.players[1]; b.lives = 1; b.x = 700; b.y = 900; })()`);
  await p.until(`${phase} === 'death'`);
  await sleep(600);
  await p.shot(`${tag}-5-death`);
  await p.until(`${phase} === 'claim'`, 4000);
  await sleep(300);
  await p.shot(`${tag}-6-claim`);
  await p.ev(`(() => { const m = ${room}.players[0]; m.x = 480 + 80; m.y = 420; m.vx = 0; m.vy = 0; m.g = true; })()`);
  await sleep(200);
  await p.shot(`${tag}-6-claim-near`);
  await p.ev(`(() => { const m = ${room}.players[0]; m.x = 480 + 25; })()`);
  await p.until(`${phase} === 'absorb'`);
  await sleep(900);
  await p.shot(`${tag}-7-absorb-a`);
  await sleep(800);
  await p.shot(`${tag}-7-absorb-b`);
  await p.until(`__arena.me().hero === 1`, 4000);
  await sleep(60);
  await p.shot(`${tag}-7-absorb-swap`);
  await p.until(`${phase} === 'done'`, 4000);
  await p.until(`!document.getElementById('stop-end').hidden`);
  await sleep(150);
  await p.shot(`${tag}-8-unlocked`);
  assert.deepEqual(await p.ev(`__arena.save()`), { done: 1, hero: 1 }, 'saved, and you are the Trapper');
  assert.deepEqual(JSON.parse(await p.ev(`localStorage.getItem('parcade-campaign')`)), { done: 1, hero: 1 });
  assert.match(await p.ev(`document.getElementById('end-title').textContent`), /Ken unlocked/);

  // The road.
  await p.ev(`document.getElementById('end-next').click()`);
  await p.until(`${phase} === 'road'`);
  await sleep(300);
  await p.shot(`${tag}-9-road-start`);
  assert.equal(await p.ev(`__arena.me().hero`), 1, 'you stay the Trapper');
  if (tag === 'phone') assert.notEqual(await p.ev(`getComputedStyle(document.getElementById('shoot')).display`), 'none', 'your gun works on the road');
  if (tag === 'phone') assert.notEqual(await p.ev(`getComputedStyle(document.getElementById('skill')).display`), 'none', 'and so does Ken’s skill');
  assert.equal(await p.ev(`__arena.latest().p.length`), 3, 'two lookouts on it');
  assert.equal(await p.ev(`document.querySelectorAll('#plates .plate').length`), 1, 'only you get a plate');
  await sleep(500);
  await p.shot(`${tag}-9-road-line`);
  const startL = await p.ev(`__arena.view().l`);
  await p.ev(`__arena.setKeys(2)`);
  await sleep(1500);
  await p.ev(`__arena.setKeys(0)`);
  const movedX = await p.ev(`__arena.me().x`);
  const movedL = await p.ev(`__arena.view().l`);
  assert.ok(movedX > 300, `ran right, x ${movedX}`);
  assert.ok(movedL > startL, `the camera followed, ${startL} to ${movedL}`);
  const visits = [[240, 420], [500, 420], [1520, 195], [1900, 345], [2240, 420], [3440, 270]];
  for (const [x, y] of visits) {
    await p.ev(`(() => { const m = ${room}.players[0]; m.x = ${x}; m.y = ${y}; m.vx = 0; m.vy = 0; m.g = true; m.i = 0; })()`);
    await sleep(350);
    await p.shot(`${tag}-9-road-${x}`);
  }
  await p.ev(`(() => { const m = ${room}.players[0]; m.x = 3640; m.y = 270; m.vx = 0; m.vy = 0; m.g = true; })()`);
  await sleep(100);
  await p.shot(`${tag}-9-road-gate`);
  await p.ev(`(() => { const m = ${room}.players[0]; m.x = 3655; })()`);
  await p.until(`!document.getElementById('stop-end').hidden`);
  await sleep(150);
  await p.shot(`${tag}-A-road-cleared`);
  assert.equal((await p.ev(`__arena.save()`)).done, 2);

  // A road ends with choosing who you fight as.
  assert.match(await p.ev(`document.getElementById('end-next').textContent`), /Choose your hero/);
  await p.ev(`document.getElementById('end-next').click()`);
  await p.until(`__arena.screen() === 'map'`);
  await sleep(300);
  await p.shot(`${tag}-A-choose`);
  assert.equal(await p.ev(`document.getElementById('trail-as-label').textContent`), 'Fight as');
  assert.equal(await p.ev(`document.querySelectorAll('#trail-as .as-hero').length`), 2, 'Sniper or Ken');
  assert.equal(await p.ev(`document.getElementById('trail-name').textContent`), 'Area 3: Ethan the Poacher');
  // The second boss, as Ken. Then lose it, to see the retry.
  await p.ev(`document.getElementById('trail-go').click()`);
  await p.until(`${phase} === 'fight'`);
  assert.equal(await p.ev(`${room}.players[1].hero`), 9, 'the Poacher');
  assert.equal(await p.ev(`${room}.players[0].hero`), 1, 'you are the Trapper');
  await sleep(500);
  await p.shot(`${tag}-B-poacher`);
  await p.ev(`(() => { const m = ${room}.players[0]; m.lives = 1; m.y = 900; m.i = 0; })()`);
  await p.until(`!document.getElementById('stop-end').hidden`);
  await sleep(120);
  await p.shot(`${tag}-C-lost`);
  await p.ev(`document.getElementById('end-map').click()`);
  await p.until(`__arena.screen() === 'map'`);
  await sleep(300);
  await p.shot(`${tag}-D-map-after`);
  assert.equal(await p.ev(`document.querySelectorAll('#trail-as .as-hero').length`), 2, 'Trapper in the collection');
  assert.equal(await p.ev(`document.querySelectorAll('.stop.beaten').length`), 2);
  assert.match(await p.ev(`document.querySelector('.stop-camp .stop-tag').textContent`), /Sniper/, 'the start stays the Sniper');
  assert.ok((await p.ev(`document.getElementById('trail-scroll').scrollLeft`)) >= 0);
  assert.equal(await p.ev(`document.getElementById('trail-name').textContent`), 'Area 3: Ethan the Poacher', 'the map opens on the next stop');

  // Choosing Sniper again.
  await p.ev(`document.querySelector('#trail-as .as-hero').click()`);
  assert.deepEqual(await p.ev(`__arena.save()`), { done: 2, hero: 0 });

  // Fight Ethan as the Sniper; the road after him is Ethan only, whoever you fought as.
  await p.ev(`document.getElementById('trail-go').click()`);
  await p.until(`${phase} === 'fight'`);
  assert.equal(await p.ev(`${room}.players[0].hero`), 0, 'the hero you chose');
  await p.ev(`(() => { const b = ${room}.players[1]; b.lives = 1; b.x = 700; b.y = 900; })()`);
  await p.until(`${phase} === 'claim'`, 5000);
  await p.ev(`(() => { const m = ${room}.players[0]; m.x = 505; m.y = 420; m.vx = 0; m.vy = 0; m.g = true; })()`);
  await p.until(`${phase} === 'done'`, 6000);
  await p.until(`!document.getElementById('stop-end').hidden`);
  await sleep(120);
  await p.shot(`${tag}-E-ethan-unlocked`);
  await p.ev(`document.getElementById('end-next').click()`);
  await p.until(`${phase} === 'road'`);
  assert.equal(await p.ev(`__arena.me().hero`), 9, 'Area 4 locks you to Ethan');
  await sleep(500);
  await p.shot(`${tag}-F-camp-start`);
  for (const [x, y] of [[1000, 345], [1300, 345], [1900, 195], [2500, 270], [3100, 420], [3700, 270]]) {
    await p.ev(`(() => { const m = ${room}.players[0]; m.x = ${x}; m.y = ${y}; m.vx = 0; m.vy = 0; m.g = true; m.i = 0; })()`);
    await sleep(450);
    await p.shot(`${tag}-F-camp-${x}`);
  }
  // The way into Mossback's land, then his arena.
  for (const [x, y] of [[3200, 420], [3480, 345], [3700, 270], [3930, 270]]) {
    await p.ev(`(() => { const m = ${room}.players[0]; m.x = ${x}; m.y = ${y}; m.vx = 0; m.vy = 0; m.g = true; m.i = 0; })()`);
    await sleep(900);
    await p.shot(`${tag}-F-moss-${x}`);
  }
  await p.ev(`__arena.startStop(4)`);
  await p.until(`${phase} === 'fight'`);
  await sleep(1600);
  assert.equal(await p.ev(`__arena.latest().m`), 6, 'in Mossback’s Grove');
  assert.equal(await p.ev(`${room}.players[1].hero`), 12, 'against Mossback');
  assert.equal(await p.ev(`${room}.players[0].lives`), 5, 'with 5 lives');
  assert.equal(await p.ev(`document.querySelectorAll('#plates .lives i').length`), 10, 'a pip for each life on both plates');
  await p.shot(`${tag}-H-grove`);
  // Back on the map, the road says who you're locked to.
  await p.ev(`__arena.toMap()`);
  await p.until(`__arena.screen() === 'map'`);
  await sleep(250);
  assert.equal(await p.ev(`document.getElementById('trail-as-label').textContent`), 'Locked to');
  assert.equal(await p.ev(`document.querySelectorAll('#trail-as .as-hero').length`), 1);
  assert.equal(await p.ev(`document.querySelector('#trail-as .as-hero').disabled`), true);
  await p.shot(`${tag}-G-map-locked`);
}

const phone = await open();
await phone.size(844, 390, true);
await phone.touch(true);
await play(phone, 'phone');

// Frame cost at 6x CPU slowdown, the same way practice-test measures it: while running along the road, and in a fight.
async function frameCost(p, label) {
  await p.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await p.send('Page.bringToFront');
  const r = await p.send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `new Promise((done) => {
      const gaps = [];
      let last = performance.now();
      let busy = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) busy += e.duration; }).observe({ entryTypes: ['longtask'] });
      const started = last;
      function tick(now) {
        gaps.push(now - last);
        last = now;
        if (now - started < 8000) return requestAnimationFrame(tick);
        gaps.sort((a, b) => a - b);
        done({ frames: gaps.length, median: gaps[gaps.length >> 1], p95: gaps[Math.floor(gaps.length * 0.95)], worst: gaps[gaps.length - 1], longTaskMs: busy });
      }
      requestAnimationFrame(tick);
    })`,
  });
  await p.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const perf = r.result.result.value;
  console.log(`6x slowdown, ${label}:`, perf);
  assert.ok(perf.p95 < 40, `${label}: frames too slow`);
}
await phone.ev(`__arena.startStop(1)`);
await phone.until(`${phase} === 'road'`);
await phone.ev(`__arena.setKeys(2)`);
await frameCost(phone, 'on the road');
await phone.ev(`__arena.setKeys(0)`);
await phone.ev(`__arena.setKeys(0)`);
await phone.ev(`__arena.startStop(3)`);
await phone.until(`${phase} === 'road'`);
await phone.ev(`__arena.setKeys(2)`);
await frameCost(phone, 'on Ethan’s road');
await phone.ev(`__arena.setKeys(0)`);
await phone.ev(`__arena.startStop(2)`);
await phone.until(`${phase} === 'fight'`);
await frameCost(phone, 'against a boss');

const pc = await open();
await pc.size(1280, 720, false);
await play(pc, 'pc');

// The pick screen follows the new order, and PvP lets you pick anyone.
await pc.go(`${BASE}?bots=1&level=easy`);
await pc.until(`window.__arena?.screen() === 'pick'`);
await sleep(300);
await pc.shot('pc-E-pick');
const order = await pc.ev(`[...document.querySelectorAll('#roster .tile-name')].map((n) => n.textContent)`);
assert.deepEqual(order, ['Sniper', 'Ken', 'Ethan', 'Mossback', 'Angler', 'Handler', 'Ninja', 'Sprinter', 'Aquilles', 'Santa', 'Shifter', 'Illusionist', 'Dusk', 'Shade', 'Seedea', 'Rime', 'Tether', 'Cassio', 'Dextar', 'VI']);
await pc.ev(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit3', bubbles: true }))`);
await sleep(80);
assert.equal(await pc.ev(`document.getElementById('detail-name').textContent`), 'Ethan the Poacher', 'key 3 is the third tile');
await pc.shot('pc-E-pick-ethan');

// Left open, these pile up run after run and slow the whole browser.
await phone.close();
await pc.close();
assert.deepEqual(errors, [], 'no errors in the page');
console.log('campaign browser test passed');
process.exit(0);
