require("../public/js/cards.js");
require("../public/js/engine.js");
require("../public/js/ai.js");

const pairs = [
  [HOLO.STARTERS.sora, HOLO.STARTERS.ayame, "Sora", "Ayame"],
  [HOLO.STARTERS.okayu, HOLO.STARTERS.choco, "Okayu", "Choco"],
];
let wins = [0, 0];
let errors = 0;
const N = 4;

for (const [a, e, n0, n1] of pairs)
for (let i = 0; i < N; i++) {
  const g = HOLO.createGame({
    p0: { oshi: a.oshi, main: a.main.slice(), cheer: a.cheer.slice(), name: n0 },
    p1: { oshi: e.oshi, main: e.main.slice(), cheer: e.cheer.slice(), name: n1 },
    first: i % 2,
    seed: 1000 + i * 97,
  });
  for (let step = 0; step < 500; step++) {
    if (g.winner != null) break;
    const pid = g.pending ? g.pending.player : g.phase === "setup" ? g.setup.player : g.turn;
    const acts = HOLO.getLegalActions(g, pid);
    if (!acts.length) {
      errors++;
      console.log("STALL", g.phase, g.setup, "turn", g.turn, "pending", g.pending);
      break;
    }
    const r = HOLO.applyAction(g, pid, HOLO.chooseAction(g, pid));
    if (!r.ok) {
      errors++;
      console.log("ILLEGAL", r.error);
      break;
    }
  }
  if (g.winner != null) wins[g.winner]++;
  else errors++;
}

console.log("sim", { games: pairs.length * N, wins, errors });
if (errors) process.exit(1);
