// A room that runs inside this page, for practising against bots. It looks like a connection to the client, so everything else works as it does online.
// It needs no server, so there's no connection to lag.
import { LEVELS, botKeys, newBrain, newWatcher, observe } from './bot.js';
import { END_HOLD, HERO_COUNT, PICK_STEPS, addPlayer, chooseMap, newGame, setHero, snapshotOf, step } from './sim.js';

const HUMAN = 0;

export const isLevel = (name) => Object.hasOwn(LEVELS, name);

function shuffled(n) {
  const list = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function createPractice(botCount, levelName, receive) {
  const level = LEVELS[levelName];
  const game = newGame();
  const watcher = newWatcher();
  const brains = new Map();
  addPlayer(game, HUMAN);
  for (let id = 1; id <= botCount; id++) {
    addPlayer(game, id);
    brains.set(id, newBrain(id, level, HUMAN, level.predict ? watcher : null));
  }
  let keys = 0;
  let ack = 0;

  // A new random hero per bot each round, and never two of the same.
  function readyBots() {
    const heroes = shuffled(HERO_COUNT);
    for (const [id] of brains) {
      const p = game.players.find((o) => o.id === id);
      if (!p.ready) Object.assign(p, { hero: heroes[id], ready: true });
    }
  }

  // Once you're out, bots could dodge each other for ever, so the round ends and the strongest one left takes it.
  function endIfOut() {
    const me = game.players.find((p) => p.id === HUMAN);
    if (game.pick > 0 || game.over > 0 || me.lives > 0) return;
    const [winner] = game.players.filter((p) => p.lives > 0).sort((a, b) => b.lives - a.lives || b.kos - a.kos);
    if (!winner) return;
    winner.wins++;
    game.win = winner.id;
    game.over = END_HOLD;
  }

  return {
    readyState: 1,
    game,
    send(text) {
      const m = JSON.parse(text);
      if ('h' in m) setHero(game, HUMAN, m.h);
      else if ('mp' in m) chooseMap(game, HUMAN, m.mp);
      else {
        keys = m.b;
        ack = m.s;
      }
    },
    tick() {
      if (game.pick > 0) {
        // No clock in practice: the round starts when you've picked.
        game.pick = PICK_STEPS;
        readyBots();
      }
      step(game, (id) => (id === HUMAN ? keys : botKeys(game, brains.get(id))));
      if (level.predict) observe(watcher, game, game.players[HUMAN]);
      endIfOut();
      // The same copy of the world a real room would send.
      receive(JSON.parse(JSON.stringify({ a: ack, ...snapshotOf(game) })));
      game.fx = [];
    },
  };
}
