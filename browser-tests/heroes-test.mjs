// Drives real browsers through the real room server: every hero, every crate kind, phone controls, screenshots.
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
  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true });
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
    size: (w, h, mobile) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: !!mobile }),
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
const KEY = { LEFT: 1, RIGHT: 2, JUMP: 4, DOWN: 8, SHOOT: 16, SKILL: 32, DASH: 64 };
// A background tab has no frames, so it sends no keys: bring it forward first.
const setKeys = async (p, k) => {
  await p.send('Page.bringToFront');
  await p.ev(`__arena.setKeys(${k})`);
};
const me = (p) => p.ev('(()=>{const m=__arena.me();return JSON.parse(JSON.stringify(m))})()');
const tap = async (p, k) => {
  await setKeys(p, k);
  await sleep(70);
  await setKeys(p, 0);
  await sleep(70);
};
const NAMES = ['Sniper', 'Trapper', 'Ninja', 'Sprinter', 'Shifter', 'Santa', 'Dusk', 'Bulwark', 'Illusionist', 'Poacher', 'Angler', 'Handler', 'Mossback', 'Rime', 'Tether', 'Shade'];

const home = await open();
await home.size(1280, 720);
await home.go(BASE);
await sleep(1200);
await home.shot('h-home');

// Pick screen, by real clicks: browse, then lock in.
const a = await open();
await a.size(1280, 720);
await a.go(BASE + '?room=AA' + stamp);
await until(a, "globalThis.__arena && __arena.screen()==='pick'");
await sleep(400);
await a.ev('document.querySelector(\'.tile[data-h="6"]\').click()');
await sleep(250);
await a.shot('h-pick');
console.log('pick overflow', await a.ev('[document.getElementById("pick").scrollHeight,innerHeight,document.documentElement.scrollWidth,innerWidth]'));
console.log('browsing did not start the round:', await a.ev("__arena.screen()"));
await a.ev("document.getElementById('lock').click()");
await until(a, "__arena.screen()==='play'");
console.log('locked hero', NAMES[(await me(a)).hero]);

// Change through every hero in practice and use each skill.
for (let h = 0; h < NAMES.length; h++) {
  await a.ev("document.getElementById('change-hero').click()");
  await until(a, "__arena.screen()==='pick'");
  await a.ev(`document.querySelector('.tile[data-h="${h}"]').click()`);
  await a.ev("document.getElementById('lock').click()");
  await until(a, `__arena.screen()==='play' && __arena.me().hero===${h}`);
  await until(a, '__arena.me().g===true');
  await sleep(250);
  await a.shot(`h-${NAMES[h].toLowerCase()}-idle`);
  const x0 = (await me(a)).x;
  await setKeys(a, KEY.SKILL);
  await sleep(160);
  await a.shot(`h-${NAMES[h].toLowerCase()}-skill`);
  await setKeys(a, 0);
  await sleep(250);
  await a.shot(`h-${NAMES[h].toLowerCase()}-after`);
  const m = await me(a);
  console.log(NAMES[h].padEnd(10), 'cd', String(m.cd).padStart(3), 'gun', m.gun, 'ammo', m.ammo, 'sp', m.sp, 'sm', m.sm, 'st', m.st, 'moved', Math.round(Math.abs(m.x - x0)));
  await sleep(300);
}

// Space jumps, and doesn't fire.
await a.ev("document.getElementById('change-hero').click()");
await until(a, "__arena.screen()==='pick'");
await a.ev('document.querySelector(\'.tile[data-h="0"]\').click()');
await a.ev("document.getElementById('lock').click()");
await until(a, '__arena.screen()===\'play\' && __arena.me().hero===0');
await until(a, '__arena.me().g===true');
const bulletsBefore = await a.ev('__arena.latest().u.length');
await a.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Space', key: ' ', windowsVirtualKeyCode: 32 });
await sleep(120);
const jumped = await me(a);
const bulletsAfter = await a.ev('__arena.latest().u.length');
await a.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Space', key: ' ', windowsVirtualKeyCode: 32 });
console.log('space: in the air', !jumped.g, 'vy', jumped.vy.toFixed(1), 'bullets', bulletsBefore, '->', bulletsAfter);
await until(a, '__arena.me().g===true');

// Down on the bottom floor stays put: run to the main floor and hold S.
await a.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyD', key: 'd', windowsVirtualKeyCode: 68 });
await sleep(1200);
await a.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyD', key: 'd', windowsVirtualKeyCode: 68 });
await until(a, '__arena.me().g===true');
await sleep(600);
const before = await me(a);
await setKeys(a, KEY.DOWN);
await sleep(700);
const after = await me(a);
await setKeys(a, 0);
console.log('hold down from y', before.y, 'at x', Math.round(before.x), '-> y', after.y, 'grounded', after.g);

// Crates fall on their own; wait for some and photograph them.
let crates = 0;
for (let i = 0; i < 150 && crates < 2; i++) {
  crates = await a.ev('__arena.latest().c.length');
  await sleep(100);
}
console.log('crates in the sky', crates);
await sleep(1200);
await a.shot('h-crates');
const sample = await a.ev('__arena.latest().c.map((c)=>[c.i,Math.round(c.x),Math.round(c.y),c.g])');
console.log('crate sample', JSON.stringify(sample));

// Two players: Dusk blinds, Santa blast.
const dusk = await open();
await dusk.size(1280, 720);
await dusk.go(BASE + '?room=BB' + stamp);
await until(dusk, "globalThis.__arena && __arena.screen()==='pick'");
await dusk.ev('__arena.pick(6)');
await until(dusk, "__arena.screen()==='play'");
const vic = await open();
await vic.size(1280, 720);
await vic.go(BASE + '?room=BB' + stamp);
await until(vic, "globalThis.__arena && __arena.screen()==='pick'");
await until(dusk, "__arena.screen()==='pick'");
await sleep(300);
await vic.shot('h-pick-clock');
await dusk.ev('__arena.pick(6)');
await vic.ev('__arena.pick(5)');
await until(dusk, "__arena.screen()==='play'");
await until(vic, "__arena.screen()==='play'");
await until(dusk, '__arena.me().g===true');
await until(vic, '__arena.me().g===true');
await sleep(200);
const dp = await me(dusk);
const vp = await me(vic);
if (vp.x > dp.x !== dp.f > 0) await tap(dusk, vp.x > dp.x ? KEY.RIGHT : KEY.LEFT);
await tap(dusk, KEY.SKILL);
await sleep(200);
await dusk.shot('h-wave');
let blind = 0;
for (let i = 0; i < 80 && !blind; i++) {
  blind = (await me(vic)).bl;
  if (!blind) await sleep(40);
}
console.log('victim blinded', blind > 0, 'bl', blind);
await sleep(120);
await vic.shot('h-blind');

const vm = await me(vic);
const dm = await me(dusk);
if (dm.x > vm.x !== vm.f > 0) await tap(vic, dm.x > vm.x ? KEY.RIGHT : KEY.LEFT);
await tap(vic, KEY.SKILL);
await sleep(180);
await vic.shot('h-gift');
await sleep(1500);
await vic.shot('h-blast');

// Phone: landscape and upright pick screens, then both control styles by touch.
const ph = await open();
await ph.size(844, 390, true);
await ph.touch(true);
await ph.go(BASE + '?room=CC' + stamp);
await until(ph, "globalThis.__arena && __arena.screen()==='pick'");
await sleep(500);
await ph.shot('h-phone-pick');
console.log('phone pick', await ph.ev('[document.getElementById("pick").scrollHeight,innerHeight,document.documentElement.scrollWidth,innerWidth]'));
await ph.ev('__arena.pick(7)');
await until(ph, "__arena.screen()==='play'");
await until(ph, '__arena.me().g===true');
await sleep(300);
await ph.shot('h-phone-stick');
await ph.ev("document.querySelector('#menu .controls-toggle').click()");
await sleep(200);
console.log('controls now', await ph.ev("document.body.dataset.controls"), 'stick shown', await ph.ev("getComputedStyle(document.getElementById('stick')).display"), 'pad shown', await ph.ev("getComputedStyle(document.getElementById('pad')).display"));
await ph.shot('h-phone-pad');
const box = await ph.ev("(()=>{const r=document.getElementById('pad').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()");
const cx = box.x + box.w / 2;
const cy = box.y + box.h / 2;
let px = (await me(ph)).x;
await ph.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx + 58, y: cy, id: 0 }] });
await sleep(300);
let q = await me(ph);
console.log('pad right: x', Math.round(px), '->', Math.round(q.x), 'arrow lit', await ph.ev("document.querySelector('.arrow.right').classList.contains('on')"));
await ph.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await sleep(300);
await until(ph, '__arena.me().g===true');
const py = (await me(ph)).y;
await ph.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy - 58, id: 0 }] });
await sleep(150);
q = await me(ph);
await ph.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
console.log('pad up: y', Math.round(py), '->', Math.round(q.y));
await ph.ev("location.reload()");
await sleep(1500);
await until(ph, "globalThis.__arena && (__arena.screen()==='pick'||__arena.screen()==='play')");
console.log('setting remembered after reload', await ph.ev("document.body.dataset.controls"));
await ph.ev("(document.querySelector('#menu .controls-toggle')).click()");

const up = await open();
await up.size(390, 844, true);
await up.touch(true);
await up.go(BASE + '?room=DD' + stamp);
await until(up, "globalThis.__arena && __arena.screen()==='pick'");
await sleep(500);
await up.shot('h-upright-pick');
console.log('upright pick', await up.ev('[document.getElementById("pick").scrollHeight,innerHeight,document.documentElement.scrollWidth,innerWidth]'));
await up.ev('__arena.pick(2)');
await until(up, "__arena.screen()==='play'");
await until(up, '__arena.me().g===true');
await sleep(300);
await up.shot('h-upright-play');

// Idle tabs still render, and that slows the two players below.
for (const p of [home, a, dusk, vic, ph, up]) await p.go('about:blank');

// The new skills against a second real player. Attacker walks down to the floor facing right, victim facing left, 300 px apart.
const atk = await open();
await atk.size(1280, 720);
const tgt = await open();
await tgt.size(1280, 720);
let roomNo = 0;
async function duel(hero) {
  const room = BASE + '?room=E' + stamp + String.fromCharCode(65 + roomNo++);
  await tgt.go('about:blank');
  await atk.go(room);
  await until(atk, "globalThis.__arena && __arena.screen()==='pick'");
  await atk.ev(`__arena.pick(${hero})`);
  await until(atk, "__arena.screen()==='play'");
  // The host fixes the map, so the two players know where the floor is.
  await atk.ev('__arena.map(0)');
  await until(atk, '__arena.latest().ch===0', 3000);
  await tgt.go(room);
  await until(tgt, "globalThis.__arena && __arena.screen()==='pick'");
  await until(atk, "__arena.screen()==='pick'");
  await atk.ev(`__arena.pick(${hero})`);
  await tgt.ev('__arena.pick(0)');
  await until(atk, "__arena.screen()==='play'");
  await until(tgt, "__arena.screen()==='play'");
  await until(tgt, '__arena.me().i===0');
  await setKeys(tgt, KEY.LEFT);
  await until(tgt, '__arena.me().y===410 && __arena.me().x<=630', 8000);
  await setKeys(tgt, 0);
  await sleep(120);
  await setKeys(atk, KEY.RIGHT);
  await until(atk, '__arena.me().y===410 && __arena.me().x>=330', 8000);
  await setKeys(atk, 0);
  await sleep(300);
  console.log('  duel hero', hero, 'attacker x', Math.round((await me(atk)).x), 'victim x', Math.round((await me(tgt)).x));
}
const world = (p) => p.ev('JSON.parse(JSON.stringify(__arena.latest()))');

await duel(10);
await tap(atk, KEY.SKILL);
await sleep(120);
await atk.shot('n-hook-flying');
await sleep(400);
await sleep(200);
await atk.shot('n-hook-caught');
let aa = await me(atk);
let tt = await me(tgt);
console.log('hook: attacker x', Math.round(aa.x), 'facing', aa.f, 'victim x', Math.round(tt.x), tt.x < aa.x ? 'BEHIND attacker' : 'NOT behind');

await duel(12);
await tap(atk, KEY.SKILL);
await until(atk, '__arena.latest().wl.length===1', 3000);
await sleep(200);
await atk.shot('n-wall');
let w = (await world(atk)).wl[0];
await setKeys(tgt, KEY.LEFT);
await sleep(1500);
await setKeys(tgt, KEY.SHOOT);
await sleep(700);
await setKeys(tgt, 0);
await sleep(100);
tt = await me(tgt);
const w2 = (await world(atk)).wl[0];
console.log('wall at', w.x, 'victim stopped at', Math.round(tt.x), 'hp', w.hp, '->', w2?.hp, 'attacker pushed', (await me(atk)).vx);
await atk.shot('n-wall-chipped');

await duel(11);
await tap(atk, KEY.SKILL);
await sleep(500);
await atk.shot('n-dog');
await sleep(900);
await atk.shot('n-dog-2');
const d = await world(atk);
console.log('dog', JSON.stringify(d.dg.map((n) => ({ x: Math.round(n.x), hp: n.hp, t: n.t }))), 'victim x', Math.round((await me(tgt)).x));

await duel(8);
await tap(atk, KEY.SKILL);
await sleep(700);
await tgt.shot('n-clones-enemy-view');
await atk.shot('n-clones-own-view');
console.log('clones', (await world(atk)).cl.length);

await duel(9);
await tap(atk, KEY.SKILL);
await sleep(800);
await atk.shot('n-trap');
const trap = (await world(atk)).tp[0];
const stood = await me(tgt);
console.log('trap', trap && { x: Math.round(trap.x), y: trap.y, landed: trap.g }, 'victim', Math.round(stood.x), stood.y);
// With its wide reach, it may already have caught them as it landed.
await setKeys(tgt, trap && stood.x <= trap.x ? KEY.RIGHT : KEY.LEFT);
await until(tgt, '__arena.me().tr>0', 6000);
await sleep(150);
await tgt.shot('n-trapped');
const slowFrom = (await me(tgt)).x;
await sleep(500);
const slowTo = (await me(tgt)).x;
await setKeys(tgt, 0);
console.log('slowed: moved', Math.abs(Math.round(slowFrom - slowTo)), 'px in 0.5 s, normal is about 97');

await duel(7);
await tap(atk, KEY.SKILL);
await sleep(200);
await atk.shot('n-guard');
await setKeys(tgt, KEY.LEFT);
await until(tgt, 'Math.abs(__arena.me().vx)>8', 6000);
tt = await me(tgt);
await setKeys(tgt, 0);
console.log('guard touch: victim vx', tt.vx.toFixed(1));

// Real keys: K dashes and L is the skill.
await duel(5);
const x0 = (await me(atk)).x;
await atk.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyK', key: 'k', windowsVirtualKeyCode: 75 });
await sleep(70);
await atk.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyK', key: 'k', windowsVirtualKeyCode: 75 });
await sleep(260);
const dashed = await me(atk);
console.log('K: dash moved', Math.round(dashed.x - x0), 'dc', dashed.dc, 'cd', dashed.cd);
await atk.shot('n-dash-cooling');
await atk.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyL', key: 'l', windowsVirtualKeyCode: 76 });
await sleep(70);
await atk.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyL', key: 'l', windowsVirtualKeyCode: 76 });
await sleep(150);
await atk.shot('n-gift');
console.log('L: skill cd', (await me(atk)).cd, 'gifts', (await world(atk)).gr.length);

// Rime: the storm rolls and throws the victim back.
await duel(13);
await tap(atk, KEY.SKILL);
await sleep(500);
await atk.shot('n-storm');
const storm = (await world(atk)).sm[0];
console.log('storm', storm && { x: Math.round(storm.x), t: storm.t });
tt = await me(tgt);
await sleep(1300);
await atk.shot('n-storm-2');
const after2 = await me(tgt);
console.log('victim pushed by the storm: x', Math.round(tt.x), '->', Math.round(after2.x));

// Tether: zips to the victim.
await duel(14);
await setKeys(atk, KEY.LEFT);
await sleep(500);
await setKeys(atk, 0);
await sleep(120);
aa = await me(atk);
await tap(atk, KEY.SKILL);
await sleep(30);
await atk.shot('n-zip');
await sleep(500);
aa = await me(atk);
tt = await me(tgt);
console.log('zip: attacker', Math.round(aa.x), 'victim', Math.round(tt.x), 'gap', Math.round(Math.abs(aa.x - tt.x)));
await atk.shot('n-zip-2');

// Shade: gone from the enemy's screen, there on her own, then a sniper bullet.
await duel(15);
await tap(atk, KEY.SKILL);
await sleep(300);
await atk.shot('n-shade-own-view');
await tgt.shot('n-shade-enemy-view');
console.log('shade iv', (await me(atk)).iv);
await setKeys(atk, KEY.SHOOT);
await sleep(90);
await atk.shot('n-shade-shot');
await setKeys(atk, 0);
await sleep(100);
const shadeNow = await me(atk);
console.log('after firing iv', shadeNow.iv);

// Jump and double jump effects.
await setKeys(atk, KEY.JUMP);
await sleep(100);
await setKeys(atk, 0);
await sleep(60);
await setKeys(atk, KEY.JUMP);
await sleep(70);
await atk.shot('n-double-jump');
await setKeys(atk, 0);
await sleep(600);
await atk.shot('n-landing');

// The title screen and the map tab, then each map.
const title = await open();
await title.size(1280, 720);
await title.go(BASE);
await sleep(2500);
await title.shot('s-title');
await title.size(844, 390, true);
await sleep(600);
await title.shot('s-title-phone');
await title.size(1280, 720);
console.log('title fighters', await title.ev('__arena.latest().p.map((p)=>p.hero).join()'), 'map', await title.ev('__arena.latest().m'));
await title.go('about:blank');

const host = await open();
await host.size(1280, 720);
await host.go(BASE + '?room=F' + stamp + 'A');
await until(host, "globalThis.__arena && __arena.screen()==='pick'");
await sleep(500);
await host.shot('s-pick');
await host.ev("document.getElementById('tab-map').click()");
await sleep(700);
await host.shot('s-map-tab');
for (const m of [0, 1, 2]) {
  await host.ev(`document.querySelector('.map-card[data-map="${m}"]').click()`);
  await until(host, `__arena.latest().ch===${m}`, 3000);
}
await host.ev("document.querySelector('.map-card[data-map=\"\"]').click()");
await until(host, '__arena.latest().ch===null', 3000);
await host.ev("document.getElementById('tab-heroes').click()");
await host.ev('__arena.pick(1)');
await until(host, "__arena.screen()==='play'");
for (const m of [0, 1, 2]) {
  await host.ev(`__arena.map(${m})`);
  await until(host, `__arena.latest().m===${m} && __arena.me().g===true`, 5000);
  await sleep(500);
  await host.shot(`s-map-${m}`);
}
await host.go('about:blank');

// A second player sees the map tab locked.
const guest1 = await open();
await guest1.size(1280, 720);
await guest1.go(BASE + '?room=F' + stamp + 'B');
await until(guest1, "globalThis.__arena && __arena.screen()==='pick'");
await guest1.ev('__arena.pick(0)');
const guest2 = await open();
await guest2.size(844, 390, true);
await guest2.touch(true);
await guest2.go(BASE + '?room=F' + stamp + 'B');
await until(guest2, "globalThis.__arena && __arena.screen()==='pick'");
await sleep(400);
await guest2.shot('s-phone-pick');
await guest2.ev("document.getElementById('tab-map').click()");
await sleep(700);
await guest2.shot('s-phone-map-locked');
console.log('guest map cards disabled', await guest2.ev("[...document.querySelectorAll('.map-card')].every((c)=>c.disabled)"), '|', await guest2.ev("document.getElementById('map-note').textContent"));
await guest2.go('about:blank');
await guest1.go('about:blank');

// A whole round: the victim runs off the edge three times, so the KO feed and results show real numbers.
await duel(0);
await setKeys(tgt, KEY.LEFT);
for (let i = 0; i < 12 && !(await tgt.ev('__arena.latest().o>0')); i++) {
  await sleep(2500);
  if (i === 1) await tgt.shot('s-feed');
  await atk.send('Page.bringToFront');
  await sleep(150);
  await tgt.send('Page.bringToFront');
}
await setKeys(tgt, 0);
await sleep(500);
await atk.shot('s-results');
await atk.size(844, 390, true);
await sleep(300);
await atk.shot('s-results-phone');
await atk.size(1280, 720);
const end = await world(atk);
console.log('round over', end.o > 0, 'winner', end.w, 'stats', JSON.stringify(end.p.map((p) => [p.id, p.kos, p.hits, p.falls, p.lives])), '| shown', await atk.ev("getComputedStyle(document.getElementById('results')).display"), await atk.ev("document.getElementById('results-next').textContent"));

console.log('errors', JSON.stringify(allErrs));
process.exit(0);
