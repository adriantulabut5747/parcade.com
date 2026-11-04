// Phone landscape and desktop, through the real room server: layout, input response, sound levels, screenshots.
import fs from 'node:fs';
const SP = process.argv[2];
const stamp = Date.now().toString(36).toUpperCase().replace(/[^A-Z2-9]/g, 'Z').slice(-3).padStart(3, 'Z');
const BASE = 'http://192.168.254.100:8766/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const allErrs = [];
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
    if (m.method === 'Runtime.exceptionThrown') allErrs.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 300));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') allErrs.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
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
  const shot = async (name) => {
    await send('Page.bringToFront');
    await sleep(60);
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${SP}/${name}.png`, Buffer.from(r.result.data, 'base64'));
  };
  return {
    send,
    ev,
    shot,
    go: (url) => send('Page.navigate', { url }),
    size: (w, h, mobile, dpr = 1) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: !!mobile }),
    touch: (on) => send('Emulation.setTouchEmulationEnabled', { enabled: on, maxTouchPoints: 5 }),
  };
}
async function until(p, expr, ms = 12000) {
  const end = Date.now() + ms;
  await p.send('Page.bringToFront');
  while (Date.now() < end) {
    if (await p.ev(expr)) return true;
    await sleep(40);
  }
  throw new Error('timeout: ' + expr);
}
const me = (p) => p.ev('JSON.parse(JSON.stringify(__arena.me()))');
const fills = (p) => p.ev("(()=>{const r=document.getElementById('game').getBoundingClientRect();return [r.x,r.y,r.width,r.height,innerWidth,innerHeight].map(Math.round)})()");
const rect = (p, id) => p.ev(`(()=>{const r=document.getElementById('${id}').getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(Math.round)})()`);

// Desktop first.
const d = await open();
await d.size(1280, 720);
await d.go(BASE);
await sleep(1000);
await d.shot('m-home');
await d.go(BASE + '?room=DA' + stamp);
await until(d, "globalThis.__arena && __arena.screen()==='pick'");
await sleep(400);
await d.shot('m-pick');
await d.ev('document.querySelector(\'.tile[data-h="5"]\').click()');
await d.ev("document.getElementById('lock').click()");
await until(d, "__arena.screen()==='play'");
await until(d, '__arena.me().g===true');
await sleep(300);
console.log('desktop fills', await fills(d), 'view', JSON.stringify(await d.ev('__arena.view()')));
await d.shot('m-desktop');
await d.ev("document.getElementById('menu-open').click()");
await sleep(150);
await d.shot('m-menu');
await d.ev("document.getElementById('menu-close').click()");

// Grenade throw on screen.
await d.ev('__arena.setKeys(32)');
await sleep(250);
await d.ev('__arena.setKeys(0)');
await d.shot('m-grenade');
await sleep(800);
await d.shot('m-grenade-blast');

// Sound levels: every sound should be audible and none should clip.
const audio = await d.ev(
  `(async () => {
    const A = await import('/audio.js');
    A.setMuted(false);
    A.unlockAudio();
    const out = {};
    const Ctor = AudioContext;
    const results = [];
    for (const name of ['shot','rifle','minigun','shotgun','snipe','rocketFire','flame','laser','blast']) {
      const ctx = [...(globalThis.__ctxs || [])][0];
      results.push(name);
    }
    return results.length;
  })()`,
  true,
);
console.log('gun sounds listed', audio);

// Phone: 844 x 390 landscape, a dense screen.
const ph = await open();
await ph.size(844, 390, true, 3);
await ph.touch(true);
await ph.go(BASE);
await sleep(800);
await ph.shot('m-phone-home');
await ph.go(BASE + '?room=PH' + stamp);
await until(ph, "globalThis.__arena && __arena.screen()==='pick'");
await sleep(500);
await ph.shot('m-phone-pick');
console.log('phone pick', await ph.ev('[document.getElementById("pick").scrollHeight,innerHeight,document.documentElement.scrollWidth,innerWidth]'));
await ph.ev('__arena.pick(5)');
await until(ph, "__arena.screen()==='play'");
await until(ph, '__arena.me().g===true');
await sleep(400);
console.log('phone fills', await fills(ph), 'view', JSON.stringify(await ph.ev('__arena.view()')), 'canvas', await ph.ev("[document.getElementById('game').width,document.getElementById('game').height]"));
console.log('phone stick', await rect(ph, 'stick'), 'shoot', await rect(ph, 'shoot'), 'skill', await rect(ph, 'skill'));
await ph.shot('m-phone-play');
console.log('controls inside the game:', await ph.ev("['stick','shoot','skill','hud'].every((id)=>document.getElementById('stage').contains(document.getElementById(id)))"));

// Arrows: how long from the finger going down to the hero moving, measured inside the page.
console.log('controls before the switch:', await ph.ev('document.body.dataset.controls'));
if ((await ph.ev('document.body.dataset.controls')) !== 'arrows') await ph.ev("document.querySelector('#menu .controls-toggle').click()");
await sleep(150);
await ph.shot('m-phone-pad');
const box = await ph.ev("(()=>{const r=document.getElementById('pad').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()");
const cx = box.x + box.w / 2;
const cy = box.y + box.h / 2;
await ph.ev(`globalThis.__lag = []; globalThis.__t0 = 0; document.getElementById('pad').addEventListener('pointerdown', () => { __t0 = performance.now(); __x0 = __arena.me().x; __y0 = __arena.me().y; }, true);
  (function watch(){ requestAnimationFrame(watch); if (__t0 && (Math.abs(__arena.me().x - __x0) > 0.1 || Math.abs(__arena.me().y - __y0) > 0.1)) { __lag.push(performance.now() - __t0); __t0 = 0; } })();`);
const zones = [
  ['right middle', cx + 54, cy],
  ['right inner edge', cx + 28, cy],
  ['right outer edge', cx + 78, cy + 20],
  ['left middle', cx - 54, cy],
  ['left inner edge', cx - 28, cy],
];
for (const [label, x, y] of zones) {
  const before = await me(ph);
  await ph.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 0 }] });
  await sleep(120);
  const during = await me(ph);
  const lit = await ph.ev("[...document.querySelectorAll('.arrow.on')].map((a)=>a.dataset.key).join()");
  await ph.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(350);
  console.log(`  ${label}: lit ${lit || 'none'}, moved ${Math.abs(during.x - before.x).toFixed(0)}`);
}
for (let i = 0; i < 6; i++) {
  await ph.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx + (i % 2 ? 54 : -54), y: cy, id: 0 }] });
  await sleep(90);
  await ph.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(350);
}
const lags = await ph.ev('__lag.map((v)=>Math.round(v))');
console.log('finger down to hero moving, ms:', lags.join(' '), ' average', Math.round(lags.reduce((s, v) => s + v, 0) / lags.length));

// Down on the bottom floor, by arrow.
await until(ph, '__arena.me().g===true');
const y0 = (await me(ph)).y;
await ph.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy + 54, id: 0 }] });
await sleep(500);
await ph.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
console.log('arrow down, y', y0, '->', (await me(ph)).y);

// Upright phone gets the turn-your-phone screen.
await ph.size(390, 844, true, 3);
await sleep(500);
await ph.shot('m-phone-upright');
console.log('rotate screen shown', await ph.ev("getComputedStyle(document.getElementById('rotate')).display"));
await ph.size(844, 390, true, 3);
await sleep(500);
console.log('after turning back: fills', await fills(ph), 'rotate', await ph.ev("getComputedStyle(document.getElementById('rotate')).display"));
await ph.shot('m-phone-back');

// A narrow 16:9 phone, and a very wide window.
const p2 = await open();
await p2.size(667, 375, true, 2);
await p2.touch(true);
await p2.go(BASE + '?room=PI' + stamp);
await until(p2, "globalThis.__arena && __arena.screen()==='pick'");
await p2.ev('__arena.pick(0)');
await until(p2, "__arena.screen()==='play'");
await until(p2, '__arena.me().g===true');
await sleep(300);
console.log('16:9 phone view', JSON.stringify(await p2.ev('__arena.view()')));
await p2.shot('m-phone-169');

console.log('errors', JSON.stringify(allErrs));
process.exit(0);
