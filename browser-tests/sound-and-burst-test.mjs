// Sound levels, the fullscreen button with a real click, and a burst of inputs against the real room server.
import fs from 'node:fs';
const SP = process.argv[2];
const BASE = 'http://192.168.254.100:8766/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = Date.now().toString(36).toUpperCase().replace(/[^A-Z2-9]/g, 'Z').slice(-3).padStart(3, 'Z');
const t = await (await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let n = 0;
const wait = new Map();
const errs = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id) {
    wait.get(m.id)?.(m);
    wait.delete(m.id);
  }
  if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails.exception?.description || '').slice(0, 300));
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
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `(() => {
    const real = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (to, ...rest) {
      if (to instanceof AudioDestinationNode && !globalThis.__meter) {
        const m = this.context.createAnalyser();
        m.fftSize = 2048;
        globalThis.__meter = m;
        real.call(this, m);
        real.call(m, to);
        return to;
      }
      return real.call(this, to, ...rest);
    };
  })();`,
});
await send('Page.navigate', { url: BASE + '?room=SN' + stamp });
const until = async (expr, ms = 15000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await ev(expr)) return;
    await sleep(50);
  }
  throw new Error('timeout ' + expr);
};
await until("globalThis.__arena && __arena.screen()==='pick'");
await sleep(300);
await send('Page.captureScreenshot', { format: 'png' }).then((r) => fs.writeFileSync(`${SP}/f-pick.png`, Buffer.from(r.result.data, 'base64')));
await ev('__arena.pick(0)');
await until("__arena.screen()==='play'");
await until('__arena.me().g===true');

const levels = await ev(
  `(async () => {
    const A = await import('/audio.js');
    A.setMuted(false);
    A.unlockAudio();
    await new Promise((r) => setTimeout(r, 200));
    const buf = new Float32Array(2048);
    const out = [];
    for (const name of ['shot', 'rifle', 'minigun', 'shotgun', 'snipe', 'rocketFire', 'flame', 'laser', 'blast', 'hit', 'hitbig', 'ko', 'equip', 'throw', 'snare', 'snap', 'smokebomb', 'teleport', 'fade', 'speed', 'shrink', 'wave', 'blind', 'dash', 'block', 'pickup', 'rare', 'fight', 'win', 'lose', 'pick', 'browse']) {
      A.play(name);
      let peak = 0, loudFor = 0;
      const start = performance.now();
      while (performance.now() - start < 620) {
        __meter.getFloatTimeDomainData(buf);
        let p = 0;
        for (const v of buf) p = Math.max(p, Math.abs(v));
        peak = Math.max(peak, p);
        if (p > 0.01) loudFor = performance.now() - start;
        await new Promise((r) => setTimeout(r, 15));
      }
      out.push(name.padEnd(11) + ' peak ' + peak.toFixed(2) + '  rings for ' + Math.round(loudFor) + ' ms');
    }
    return out;
  })()`,
  true,
);
console.log(levels.join('\n'));

// Fullscreen with a genuine click, since browsers refuse it without one.
await ev("document.querySelector('#hud .fullscreen-toggle').scrollIntoView()");
const box = await ev("(()=>{const r=document.querySelector('#hud .fullscreen-toggle').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
await sleep(500);
console.log('fullscreen after click:', await ev('!!document.fullscreenElement'), 'menu word:', await ev("document.querySelector('#menu .fullscreen-word').textContent"));
await ev('document.exitFullscreen && document.fullscreenElement && document.exitFullscreen()', true);

// A burst of inputs, as a phone sends after a hiccup: the server must catch up fast and not lose the jump.
const ROOM = 'BU' + stamp;
const bot = new WebSocket(`ws://192.168.254.100:8787/room/${ROOM}`, { headers: { Origin: 'http://192.168.254.100:8766' } });
let snap = null;
let acks = [];
bot.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.t === 's') {
    snap = m;
    acks.push({ at: performance.now(), a: m.a });
  }
};
await new Promise((r) => (bot.onopen = r));
bot.send(JSON.stringify({ h: 0 }));
let seq = 0;
const tick = setInterval(() => bot.send(JSON.stringify({ s: ++seq, b: 0 })), 33);
const pickDeadline = Date.now() + 5000;
while (Date.now() < pickDeadline && !(snap && snap.pk === 0 && snap.p[0].g)) await sleep(30);
console.log('bot on the ground', snap.p[0].g, 'y', snap.p[0].y);
clearInterval(tick);
await sleep(300);
const y0 = snap.p[0].y;
const sentAt = performance.now();
// The jump is the first of 12 inputs sent at once, so it's one of those the queue has to drop.
for (let i = 0; i < 12; i++) bot.send(JSON.stringify({ s: ++seq, b: i === 0 ? 4 : 0 }));
const last = seq;
acks = [];
const tock = setInterval(() => bot.send(JSON.stringify({ s: ++seq, b: 0 })), 33);
let minY = y0;
let caughtUp = null;
const watchEnd = Date.now() + 1200;
while (Date.now() < watchEnd) {
  minY = Math.min(minY, snap.p[0].y);
  if (caughtUp === null && snap.a >= last) caughtUp = performance.now() - sentAt;
  await sleep(10);
}
clearInterval(tock);
console.log(`burst of 12: server caught up in ${Math.round(caughtUp)} ms; the jump survived: ${minY < y0 - 20} (rose ${Math.round(y0 - minY)})`);
const behind = seq - snap.a;
console.log('inputs still queued afterward:', behind);
const bytes = JSON.stringify(snap).length;
console.log('snapshot size', bytes, 'bytes');
bot.close();
console.log('errors', JSON.stringify(errs));
process.exit(0);
