// Frame times on a slowed-down phone in a busy 4-player fight, with 3 bots on the real room server.
const SP = process.argv[2];
const RATE = Number(process.argv[3] || 4);
const stamp = Date.now().toString(36).toUpperCase().replace(/[^A-Z2-9]/g, 'Z').slice(-3).padStart(3, 'Z');
const ROOM = 'PF' + stamp;
const BASE = 'http://192.168.254.100:8766/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
  if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description?.slice(0, 200));
};
const send = (method, params = {}) =>
  new Promise((res) => {
    const id = ++n;
    wait.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });
const ev = async (expression, awaitPromise = false) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
  if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400));
  return r.result.result.value;
};
await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Performance.enable');
const metric = async () => Object.fromEntries((await send('Performance.getMetrics')).result.metrics.map((m) => [m.name, m.value]));
await send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 3, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.navigate', { url: BASE + '?room=' + ROOM });
const until = async (expr, ms = 25000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await ev(expr)) return;
    await sleep(100);
  }
  throw new Error('timeout ' + expr);
};
await until("globalThis.__arena && __arena.screen()==='pick'");
await ev('__arena.pick(0)');
await until("__arena.screen()==='play'");

// Three bots, on the same room server, firing and moving.
const bots = [];
for (const [i, hero] of [13, 8, 11].entries()) {
  const b = new WebSocket(`ws://192.168.254.100:8787/room/${ROOM}`, { headers: { Origin: 'http://192.168.254.100:8766' } });
  let seq = 0;
  let timer;
  b.onopen = () => {
    b.send(JSON.stringify({ h: hero }));
    timer = setInterval(() => {
      if (b.readyState !== 1) return clearInterval(timer);
      seq++;
      const dir = seq % 80 < 40 ? 1 : 2;
      const skill = seq % 45 < 3 ? 32 : 0;
      const jump = seq % 30 < 2 ? 4 : 0;
      b.send(JSON.stringify({ s: seq, b: dir | 16 | skill | jump }));
    }, 33);
    setTimeout(() => b.readyState === 1 && b.send(JSON.stringify({ h: hero })), 500);
  };
  bots.push(b);
  await sleep(150);
}
await sleep(800);
await ev('__arena.pick(0)');
await until("__arena.screen()==='play' && __arena.latest().p.length===4");
await sleep(1500);
await ev('__arena.setKeys(16)');
// A real phone plays sound and music through the fight, so they count too.
await ev("import('/audio.js').then((A) => { A.setMuted(false); A.setMusicOn(true); A.unlockAudio(); })", true);
await send('Emulation.setCPUThrottlingRate', { rate: RATE });
await sleep(800);
const m0 = await metric();
const stats = await ev(
  `new Promise((done) => {
    const gaps = []; let last = performance.now(); const start = last;
    const tick = (now) => { gaps.push(now - last); last = now; if (now - start < 8000) requestAnimationFrame(tick); else {
      gaps.sort((a,b)=>a-b);
      const avg = gaps.reduce((s,g)=>s+g,0)/gaps.length;
      done({ frames: gaps.length, fps: +(1000/avg).toFixed(1), avgMs: +avg.toFixed(1), p95Ms: +gaps[Math.floor(gaps.length*.95)].toFixed(1), worstMs: +gaps[gaps.length-1].toFixed(1), over33: +(100*gaps.filter(g=>g>33.4).length/gaps.length).toFixed(1) });
    }};
    requestAnimationFrame(tick);
  })`,
  true,
);
const m1 = await metric();
await send('Emulation.setCPUThrottlingRate', { rate: 1 });
const busy = m1.TaskDuration - m0.TaskDuration;
const script = m1.ScriptDuration - m0.ScriptDuration;
const paint = busy - script;
console.log(`main thread per frame: ${((busy * 1000) / stats.frames).toFixed(1)} ms of 16.6 budget (scripts ${((script * 1000) / stats.frames).toFixed(1)}, other ${((paint * 1000) / stats.frames).toFixed(1)}), busy ${((100 * busy) / (m1.Timestamp - m0.Timestamp)).toFixed(0)}%`);
const canvasSize = await ev("(()=>{const c=document.getElementById('game');return [c.width,c.height]})()");
const crowd = await ev('__arena.latest().p.length');
console.log(`CPU slowed ${RATE}x, ${crowd} players, canvas ${canvasSize.join('x')}:`, JSON.stringify(stats));
console.log('errors', JSON.stringify(errs));
for (const b of bots) b.close();
process.exit(0);
