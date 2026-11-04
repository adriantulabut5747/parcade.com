# Parcade

Online 2D arena shooter: knock everyone off the platforms into the lava. 3 lives, up to 4 players, 16 heroes with one skill each plus a dash for everyone, 3 maps, power-up crates. Plain HTML/CSS/JS with no build step and no framework. It is separate from Parchrome (parcore.com) and must stay out of that repo.

The plan and every decision made so far: https://claude.ai/artifact/SG87iViZGUWYd8gJXRBwWD

## Run it

Two terminals, both from this folder. Servers started by an earlier session may have stopped with it.

```
cd worker && npx wrangler dev --ip 0.0.0.0 --port 8787
python -m http.server 8766 -d site
```

Open http://192.168.254.100:8766/?room=57lxg on PC and phone. Use the LAN address on both, because `localhost` only works on the PC. The client connects to port 8787 only when the page is on port 8766, and the Worker only accepts local pages on 8766.

The network is set to Public in Windows. Adrian's phone has reached the game, so the firewall is not blocking it at the moment.

## Files

| File | What it holds |
| --- | --- |
| `site/sim.js` | All game rules and numbers. The Worker runs them for real, and the client runs `movePlayer` to predict your own moves |
| `site/client.js` | Network, prediction, input, draw loop, HUD, pick screen, menu, fullscreen |
| `site/art.js` | The 3 maps' backgrounds, platforms and hazards. Baked once per screen size and per map |
| `site/heroes.js` | Hero, gun and icon drawing, plus the sprite cache (`sprite`, `stamp`, `stampHero`) |
| `site/fx.js` | Bullets, nets, crates, skill and hit animations |
| `site/audio.js` | All sounds, synthesised. No audio files |
| `site/style.css`, `site/index.html` | Interface |
| `worker/worker.js` | Cloudflare Durable Object: one per room, runs the match |
| `sim-test.mjs` | Rules test: `node sim-test.mjs`. Add a check for every new rule |
| `browser-tests/` | Real-browser tests, see below |

## Rules Adrian set

- **Original only.** Gun Mayhem is the genre reference, and Omen and Jett inspired the mechanics of Dusk and the dash; other games' heroes inspired the mechanics only of Angler, Rime, Tether and Sprinter's buff. Adrian has asked for Franco, Ayaka, Spider-Man and Neon look-alikes: those looks and names are refused, and original designs offered. Map layouts take ideas from his reference pictures but aren't traced. Never reuse any game's names, characters, art, music or maps. Clash Royale is a feel reference (chunky and toy-like), not something to copy.
- **Look:** quiet black and gold, no purple anywhere in the interface or the arena (Adrian's call, Nov 4). The home title is just the word, with no sign, frame or bulbs: he didn't want an arcade look. Titles in Tourney italic, text in Sora.
- **Music (Nov 4):** elegant and fighting, like a Roman tournament or a battle of the century. Not arcade or chiptune. Keep it well under the gunshots. Every panel and button has a dark 2px edge and a raised or sunken look. No coloured glows or halos, and no thick coloured accent stripes on cards.
- **Pitch before big redesigns:** offer 2-3 simple ideas and build after Adrian picks, even when told to "go crazy". Ask about unclear behaviour. Don't sugarcoat a weak idea.
- **Phones:** landscape only, game fills the screen, controls sit on the arena. The joystick or 4 arrows are a setting.
- **No lag on phones, and controls must respond instantly.** Adrian was explicit about this.
- **Arena:** a wider screen shows more background. Platforms never move for a screen size.
- **Keyboard:** Space is jump only. Shoot is J or X, dash is K or C, skill is L or V.
- **Down** never drops you into the lava, even when held through several platforms. One exception Adrian asked for: Greenwood's second row (`free: true`) lets a fresh press of Down drop through anywhere, even over the lava. Holding Down from the row above still stops there.
- **Crates** every 15-21 s, at most 2 at once. Meteor shower is endgame only and very rare.
- **Movement (Nov 4):** run 195 px/s, one jump about 88 px, both about 156 px. Platform rows are 70-75 apart so one jump reaches the next row. Everyone's knockback is `KNOCK_MORE` (1.2) in `push`, and every gun but the sniper got 25% more on top.
- **Maps:** The Forge, Greenwood (all green, no sky) and Sun Steps, in `MAPS`. `useMap` sets the active map and must run before anything moves, because rooms can share a process. The room's host (first in; passes to the lowest id when they leave) chooses on the pick screen's Map tab. The default is random every round.
- **Effects:** dust on take-off and landing for everyone, and a flat ring on a second jump. They show even for an invisible Shade, which is her only tell.
- **Dash:** everyone has it, 110 px on a 7 s cooldown, no speed boost afterwards. It cancels knockback but can't break a net.
- **Hero numbers Adrian chose or agreed (Nov 4):** Santa's gift has a 1.1 s fuse, 200 radius, 15 s cooldown and never goes off on contact. Bulwark's guard lasts 4 s on a 20 s cooldown, blocks bullets, blasts, nets, hooks and traps, and touch shoves enemies at the old pistol strength (he called double overpowered). Illusionist's 2 clones run around for 5 s, fire real shots at 1/4 knockback, and die to any one hit. Poacher has at most 3 traps (a 4th removes the oldest), 15 s cooldown, each lasting 70 s, catching from about 45 px, and slowing to 35% for 3 s. Angler's hook crosses the whole map, leaves the enemy just behind you with a 0.8 s stun, on a 20 s cooldown. Handler's dog is on a 25 s cooldown, lasts 12 s, shoves every 1.5 s, takes 5 shots and chases clones too. Mossback's wall lasts 10 s, takes 10 shots, stops bullets, lasers and hooks, can be stood on, and blasts pass through it. Sprinter's boost also draws a 5-shot arc gun. Rime's storm rolls forward slowly for 4 s and repeatedly throws back anyone near, on a 25 s cooldown. Tether zips to the nearest enemy anywhere, clones included, slowing them for 1 s, on a 20 s cooldown. Shade drops 3 s of smoke and is invisible for 6 s on a 25 s cooldown; firing reveals her, and that one shot is a sniper bullet.
- **Hero changes Adrian asked for (Nov 4, these replace anything above):** Trapper's net holds for 1 s. Handler's dog lasts 15 s. Mossback's cooldown is 15 s. Poacher's trap catches from about 67 px, holds still for 0.8 s, then slows for 1 s. Ninja's swap back gives 3 shurikens (knock 28, between pistol and sniper, connecting from much further away). Dusk gets 1.7x speed for 3 s when the ink hits someone, and everyone sees a BLINDED tag over that player. Shifter runs 1.2x while small. Rime's storm also slows to 0.2x for 1.5 s (my number; he only said very very hard). Sniper is at 0.4 opacity for up to 13 s or until the rifle is gone. Tether's Zip Line is a web; his basic shots stay the pistol, as he chose.
- **Tether's look:** Adrian asked for red and blue from a Spider-Man picture, "not Spider-Man". It stays an original suit: blue hood and plated mask with eight small eyes, red legs and harness, no white eye patches, no web pattern on the suit. Keep those differences.
- **Skill looks:** `skillShowing` in `client.js` decides when a hero's picture changes, and each body in `heroes.js` reads `o.skin`. Illusionist's copies lose the hat too, or the real one would be obvious. Handler's dog itself must not change.
- **Pick screen:** the title, tabs, detail box and footer must not move between heroes or tabs. `--pick-h` sets the fixed height; raise it if a longer hero text ever clips.
- **Shots against walls and dogs** use `dmg` in `GUNS`: a shotgun pellet is 0.4, a minigun bullet 0.5, a flame 0.1, the rest 1.

## Keeping it fast

Measured with `browser-tests/perf.mjs` at 6x CPU slowdown, 4 players, with sound and music on: 5.2 ms of main-thread work per frame on Nov 4, using the heavier heroes (Rime, Illusionist, Handler). Finger down to hero moving is about 15 ms. Re-measure before and after adding anything that draws per frame. That PC's graphics chip is far faster than a phone's, so these numbers can't show GPU cost, and a real phone has not confirmed them yet. The music's hall echo runs on the audio thread, which this number doesn't cover either.

What keeps it fast, so don't undo these:

- Heroes, guns, labels and crates are stamped from sprites during a fight. `drawHero` (shape by shape) is only for the pick screen and portraits.
- The phone canvas is capped at 1 backing pixel per world unit, and steps down on its own if frames run slow.
- The page's HUD updates 10 times a second from `onSnapshot`, never per frame. Writing to the page every frame is what stuttered.
- No gradient creation per frame. No animating `box-shadow`: use opacity or transform.
- Menus draw the arena at about 15 fps, and hero tiles are drawn once.
- No CSS transitions on anything a thumb presses.
- The Worker builds each snapshot once with numbers rounded, and its input queue drains so bursts can't become lasting lag.

## Browser tests

Start headless Chrome first, then run a test with a folder for its screenshots. They use the LAN address and need both servers up.

```
chrome --headless=new --autoplay-policy=no-user-gesture-required --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows --remote-debugging-port=9333 --user-data-dir=E:/claude-tmp/parcade-chrome about:blank
node browser-tests/mobile-test.mjs E:/claude-tmp/shots
node browser-tests/perf.mjs E:/claude-tmp/shots 6
```

- `mobile-test`: full-screen layout, arrow response, rotate screen.
- `perf`: frame cost in a 4-player fight with bots.
- `heroes-test`: all 16 skills, the new skills against a second real player, the K and L keys, the title screen, the map tab, each map, and a whole round to the results screen.
- `sound-and-burst-test`: every sound's loudness, fullscreen click, server input burst.

Gotchas:

- Headless Chrome pauses frames in background tabs, so call `Page.bringToFront` before waiting on a tab. A paused tab also sends no keys, so its last key stays held on the server.
- The test browser profile remembers the Controls setting between runs.
- `http.server` sends no cache rules, so a browser can keep running an old JS file after an edit, including the test browser and Adrian's phone. If a change seems to do nothing, clear the cache (`Network.clearBrowserCache` in tests, Ctrl+Shift+R on PC).
- C: is nearly full, so keep temp files and screenshots on E:.
- Bash heredocs with quotes have broken here. Write scripts with the Write tool and run them.
- `wrangler dev` runs through nested shells. To stop it, kill the exact process tree, then check that port 8787 has one listener. Two instances sharing `.wrangler` state hang.

## Open items

- **Live lag, NOT fixed (start here, Nov 5).** On the live server some rooms run at about 66 ms and others at 1-5 s, at random per room. Adrian wants to play on mobile data only, so Cloudflare stays the route. Measured so far: game rules cost about 0.03 ms a step, so they aren't the cause, and it isn't any one hero. The server's own timer stays at 33 ms even in slow rooms, so updates arrive late on the way to the player. Osaka and Tokyo rooms were always slow, Singapore rooms mostly fast but 3 of 12 slow. `worker.js` has an untested-in-play room picker (`GOOD_SITES`, `choose`) that only partly helped: 7 of 16 rooms still slow, and some codes never reached Singapore. Next test, never finished: same room with fresh connections and fewer updates per second, to see whether delay follows the room, the connection or the data rate. Nothing has been measured on real mobile data yet. The live server may be running a temporary measuring build rather than this `worker.js`, so redeploy the real one. Deploys were blocked by the permission system on the last try, so Adrian has to allow or run them.
- **GitHub (Nov 5):** the repo is `adriantulabut5747/parcade.com`, branch `main`, so Adrian can work on it remotely from mobile data. It is **public** by his choice, so everything committed is visible to anyone: never commit tokens. A cloud session has no local servers or LAN phone, so test against the live server or say what wasn't tested.
- **GitHub Pages (Nov 5):** every push to `main` publishes `site/` to https://adriantulabut5747.github.io/parcade.com/ (`.github/workflows/pages.yml`). It serves one folder deep, so every path inside `site/` must stay relative: no leading `/`. It joins rooms only once the Worker with that address in `allowedOrigin` is deployed.
- **Deployment:** the rooms server went live on Nov 4 at `wss://parcade.adriantulabut5747.workers.dev`. Any change to `sim.js` or `worker/worker.js` needs `cd worker && npx wrangler deploy` with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` set; never save the token in a file. The page is live at https://parcades.netlify.app (parcade.netlify.app belongs to someone else); Adrian updates it by dragging `site/` onto Netlify. `allowedOrigin` in `worker/worker.js` allows that address and its preview links only, so a different Netlify name means changing it and redeploying. For now the game is just for Adrian and a friend, so `noindex` in `index.html` stays.
- **Not confirmed on a real phone:** the speed numbers, the new layout, and fullscreen. iPhones don't let websites go fullscreen, and Android may refuse the landscape lock over plain http.
- **Sounds:** loudness was measured, but nobody has judged how they sound. Adrian asked for the pistol to sound like a game pistol.
- **Balance to test with Adrian:** Ninja may be too strong. Blindness may be harsh at 3 s. Shifter may be too safe. Slower movement, smaller platforms and more knockback together may end rounds too fast. Two dog shoves can knock a player who stands still off the floor. Angler's whole-map hook with a 0.8 s stun is nearly always a kill from a ledge; Adrian chose this over my stun-break suggestion, so watch it.
- **Placeholder names:** hero and skill names are mine until Adrian names them. New on Nov 4: Bulwark (was Gale), Illusionist (his "Illusioner" is a Minecraft mob's name), Poacher, Angler, Handler, Mossback, Rime, Tether, Shade, plus Greenwood and Sun Steps.
- **Music:** two original pieces in `SONGS` in `audio.js`, written Nov 4, with their own menu toggle: a 53 s procession for the menus and a 44 s battle piece. Levels and notes were checked by meter and spectrogram, but nobody has judged how they sound yet.
- **Clone and trap details not confirmed by Adrian:** enemies see traps at 60% opacity. Clones can't pick up crates or set off traps.
