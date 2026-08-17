(function (g) {
  function scoreAction(state, pid, a) {
    const p = state.players[pid];
    const opp = state.players[1 - pid];
    const def = (u) => g.HOLO.defOf(state, u);
    switch (a.type) {
      case "MULLIGAN": {
        const debuts = p.hand.filter((u) => {
          const d = def(u);
          return d.type === "holomem" && d.bloom === "debut";
        }).length;
        return a.redo ? (debuts < 2 ? 50 : -20) : (debuts >= 2 ? 40 : 0);
      }
      case "PLACE_CENTER":
        return 80 + (def(p.hand[a.handIndex]).hp || 0);
      case "PLACE_BACK":
        return 40 + (def(p.hand[a.handIndex]).bloom === "debut" ? 10 : 0);
      case "DONE_BACK":
        return 5;
      case "ATTACH_CHEER": {
        if (a.zone === "center") return 60;
        if (a.zone === "collab") return 40;
        return 15;
      }
      case "PLAY_HOLOMEM":
        return 55;
      case "BLOOM": {
        const d = def(p.hand[a.handIndex]);
        return 70 + (d.bloom === "second" ? 20 : 0) + (d.hp || 0) / 10;
      }
      case "COLLAB":
        return 50;
      case "BATON":
        return p.center && p.center.damage > 40 ? 35 : 8;
      case "PLAY_SUPPORT": {
        const d = def(p.hand[a.handIndex]);
        if (d.id === "sup-energy" || d.id === "sup-manager") return 65;
        if (d.id === "sup-mic") return 30;
        return 25;
      }
      case "OSHI":
        return 28;
      case "SP_OSHI":
        return opp.center && opp.center.damage > 40 ? 70 : 20;
      case "PERFORM": {
        const slot = p[a.from];
        const arts = g.HOLO.topDef(state, slot).arts[a.artsIndex];
        const tgt = opp[a.target];
        const dmg = g.HOLO.artsDamage(state, p, slot, arts, tgt);
        let s = 40 + dmg;
        if (tgt && tgt.damage + dmg >= g.HOLO.topDef(state, tgt).hp) s += 80;
        if (a.target === "center") s += 8;
        return s;
      }
      case "END_MAIN":
        return 1;
      case "END_PERFORMANCE":
        return 1;
      case "LOOK_KEEP":
        return 10 - a.keepIndex;
      default:
        return 0;
    }
  }

  function chooseAction(state, pid) {
    const legal = g.HOLO.getLegalActions(state, pid);
    if (!legal.length) return null;
    let best = legal[0];
    let bestS = -1e9;
    legal.forEach((a) => {
      const s = scoreAction(state, pid, a) + Math.random() * 0.2;
      if (s > bestS) {
        bestS = s;
        best = a;
      }
    });
    return best;
  }

  function playTurn(state, pid, maxSteps) {
    const steps = [];
    for (let i = 0; i < (maxSteps || 40); i++) {
      if (state.winner != null) break;
      if (state.pending && state.pending.player !== pid) break;
      if (state.phase === "setup" && state.setup.player !== pid) break;
      if (state.phase !== "setup" && !state.pending && state.turn !== pid) break;
      const a = chooseAction(state, pid);
      if (!a) break;
      const r = g.HOLO.applyAction(state, pid, a);
      if (!r.ok) break;
      steps.push(a);
    }
    return steps;
  }

  g.HOLO.chooseAction = chooseAction;
  g.HOLO.playTurn = playTurn;
})(typeof globalThis !== "undefined" ? globalThis : this);
