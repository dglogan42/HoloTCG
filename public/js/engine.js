(function (g) {
  const card = (id) => g.HOLO.BY_ID[id];

  function rngNext(state) {
    state.rng = (state.rng + 0x6d2b79f5) >>> 0;
    let t = state.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function shuffle(state, arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rngNext(state) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function uid(state) {
    return "c" + ++state.uidSeq;
  }

  function makeInst(state, id) {
    const u = uid(state);
    state.cards[u] = { uid: u, id };
    return u;
  }

  function defOf(state, u) {
    return card(state.cards[u].id);
  }

  function clone(s) {
    return JSON.parse(JSON.stringify(s));
  }

  function emptyFlags() {
    return {
      firstTurn: true,
      limitedUsed: false,
      batonUsed: false,
      collabUsed: false,
      oshiUsed: false,
      performed: { center: false, collab: false },
      artsBonus: {},
      eventsUsed: 0,
    };
  }

  function slotKey(zone, idx) {
    return zone === "back" ? "back:" + idx : zone;
  }

  function getSlot(p, zone, idx) {
    if (zone === "center") return p.center;
    if (zone === "collab") return p.collab;
    return p.back[idx];
  }

  function allSlots(p) {
    const out = [];
    if (p.center) out.push({ zone: "center", idx: 0, slot: p.center });
    if (p.collab) out.push({ zone: "collab", idx: 0, slot: p.collab });
    p.back.forEach((s, i) => out.push({ zone: "back", idx: i, slot: s }));
    return out;
  }

  function topDef(state, slot) {
    return defOf(state, slot.stack[0]);
  }

  function stageCount(p) {
    return (p.center ? 1 : 0) + (p.collab ? 1 : 0) + p.back.length;
  }

  function cheerColors(state, slot) {
    const counts = { W: 0, R: 0, U: 0, G: 0, P: 0, Y: 0 };
    slot.cheers.forEach((u) => {
      const c = defOf(state, u).color;
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }

  function canPayArts(state, slot, arts) {
    const c = cheerColors(state, slot);
    const need = {};
    let any = 0;
    arts.cost.forEach((x) => {
      if (x === "X") any++;
      else need[x] = (need[x] || 0) + 1;
    });
    for (const k of Object.keys(need)) {
      if ((c[k] || 0) < need[k]) return false;
    }
    const used = Object.values(need).reduce((a, b) => a + b, 0);
    return slot.cheers.length >= used + any;
  }

  function namesOf(d) {
    return g.HOLO.namesOf(d);
  }

  function colorsOf(d) {
    return g.HOLO.colorsOf(d);
  }

  function hasName(state, p, name) {
    return allSlots(p).some((s) => namesOf(topDef(state, s.slot)).includes(name));
  }

  function rollDie(state) {
    return 1 + Math.floor(rngNext(state) * 6);
  }

  function artsDamage(state, p, slot, arts, targetSlot) {
    let d = arts.dmg;
    if (arts.bonusVs && targetSlot) {
      if (colorsOf(topDef(state, targetSlot)).includes(arts.bonusVs.color)) d += arts.bonusVs.dmg;
    }
    if (arts.tokkou && targetSlot) {
      if (colorsOf(topDef(state, targetSlot)).includes(arts.tokkou.color)) d += arts.tokkou.dmg;
    }
    if (arts.ifCheer) {
      const cc = cheerColors(state, slot);
      if ((cc[arts.ifCheer.color] || 0) >= arts.ifCheer.n) d += arts.ifCheer.dmg;
    }
    if (arts.ifCollabed && p.flags.collabUsed) d += arts.ifCollabed;
    if (arts.ifOthers && stageCount(p) >= 2) d += arts.ifOthers;
    if (arts.ifName && hasName(state, p, arts.ifName) && arts.ifNameDmg) d += arts.ifNameDmg;
    if (arts.ifEvents) d += (p.flags.eventsUsed || 0) * arts.ifEvents;
    if (arts.ifFood && p.archive.some((u) => defOf(state, u).food)) d += arts.ifFood;
    if (arts.ifColors) {
      const seen = {};
      allSlots(p).forEach((s) =>
        s.slot.cheers.forEach((u) => {
          seen[defOf(state, u).color] = true;
        })
      );
      if (Object.keys(seen).length >= arts.ifColors) d += 20;
    }
    if (p.flags.artsBonus["*"]) d += p.flags.artsBonus["*"];
    if (p.flags.artsBonus.center && slot === p.center) d += p.flags.artsBonus.center;
    if (p.flags.artsBonus.collab && slot === p.collab) d += p.flags.artsBonus.collab;
    return d;
  }

  function bloomRank(b) {
    return { debut: 0, first: 1, second: 2 }[b];
  }

  function canBloomOnto(from, onto) {
    if (from.bloom === "spot" || onto.bloom === "spot") return false;
    const fn = namesOf(from);
    const on = namesOf(onto);
    if (!fn.some((n) => on.includes(n))) return false;
    const a = bloomRank(from.bloom);
    const b = bloomRank(onto.bloom);
    if (a == null || b == null) return false;
    return a === b || a === b + 1;
  }

  function log(state, msg) {
    state.log.push(msg);
    if (state.log.length > 240) state.log.shift();
  }

  function newSlot(u, entered) {
    return { stack: [u], cheers: [], damage: 0, rest: false, enteredThisTurn: !!entered, hpBonus: 0 };
  }

  function createGame(cfg) {
    const state = {
      rng: (cfg.seed == null ? Date.now() : cfg.seed) >>> 0,
      uidSeq: 0,
      cards: {},
      turn: cfg.first || 0,
      firstPlayer: cfg.first || 0,
      phase: "setup",
      setup: { step: "mulligan", player: 0 },
      winner: null,
      winReason: null,
      log: [],
      turnCount: [0, 0],
      pending: null,
      pendingCheer: null,
      players: [null, null],
    };
    [cfg.p0, cfg.p1].forEach((deck, i) => {
      const p = {
        name: deck.name || "Player " + (i + 1),
        oshiId: deck.oshi,
        oshiSpUsed: false,
        deck: [],
        hand: [],
        archive: [],
        holopower: [],
        cheerDeck: [],
        life: [],
        center: null,
        collab: null,
        back: [],
        flags: emptyFlags(),
        isFirst: i === (cfg.first || 0),
      };
      deck.main.forEach((id) => p.deck.push(makeInst(state, id)));
      deck.cheer.forEach((id) => p.cheerDeck.push(makeInst(state, id)));
      shuffle(state, p.deck);
      shuffle(state, p.cheerDeck);
      const oshi = card(deck.oshi);
      for (let k = 0; k < oshi.life; k++) p.life.push(p.cheerDeck.pop());
      for (let k = 0; k < 7; k++) if (p.deck.length) p.hand.push(p.deck.pop());
      state.players[i] = p;
    });
    log(state, "Game start. " + state.players[0].name + " vs " + state.players[1].name + ".");
    return state;
  }

  function hasDebut(state, p) {
    return p.hand.some((u) => {
      const d = defOf(state, u);
      return d.type === "holomem" && d.bloom === "debut";
    });
  }

  function forceDebut(state, p) {
    let drawN = 7;
    while (!hasDebut(state, p)) {
      if (!p.hand.length || drawN <= 1) return false;
      p.deck.push(...p.hand);
      p.hand = [];
      shuffle(state, p.deck);
      drawN -= 1;
      for (let i = 0; i < drawN; i++) if (p.deck.length) p.hand.push(p.deck.pop());
    }
    return true;
  }

  function effectActions(state, pid, base, fx) {
    if (!fx) return [{ ...base }];
    const p = state.players[pid];
    const opp = state.players[1 - pid];
    if (fx.who === "chooseYours") {
      return allSlots(p).map((s) => ({ ...base, zone: s.zone, idx: s.idx }));
    }
    if (fx.who === "chooseOppFront") {
      const out = [];
      if (opp.center) out.push({ ...base, zone: "center", idx: 0 });
      if (opp.collab) out.push({ ...base, zone: "collab", idx: 0 });
      return out;
    }
    if (fx.t === "moveCheer") {
      const out = [];
      const slots = allSlots(p);
      slots.forEach((a) => {
        if (!a.slot.cheers.length) return;
        slots.forEach((b) => {
          if (a.zone === b.zone && a.idx === b.idx) return;
          out.push({ ...base, fromZone: a.zone, fromIdx: a.idx, zone: b.zone, idx: b.idx });
        });
      });
      return out;
    }
    if (fx.t === "returnHolomem") {
      const out = [];
      p.archive.forEach((u, i) => {
        const d = defOf(state, u);
        if (d.type !== "holomem") return;
        if (fx.color && !colorsOf(d).includes(fx.color)) return;
        out.push({ ...base, archiveIndex: i });
      });
      return out;
    }
    if (fx.t === "archiveCheersTo") {
      return allSlots(p)
        .filter((s) => colorsOf(topDef(state, s.slot)).includes(fx.color))
        .map((s) => ({ ...base, zone: s.zone, idx: s.idx }));
    }
    if (fx.t === "swapOppCenter") {
      if (!opp.center || !opp.back.length) return [];
      return opp.back.map((_, i) => ({ ...base, idx: i }));
    }
    if (fx.t === "searchBloom" || fx.t === "dieCheer") {
      const withCheer = allSlots(p).filter((s) => s.slot.cheers.length);
      if (fx.t === "searchBloom" && !withCheer.length) return [];
      if (fx.t === "dieCheer") return [{ ...base }];
      return withCheer.map((s) => ({ ...base, zone: s.zone, idx: s.idx }));
    }
    if (fx.t === "reload5") {
      return p.hand.length > 1 ? [{ ...base }] : [];
    }
    if (fx.t === "scoopNames") {
      if (fx.maxHandExcl != null && p.hand.length - 1 > fx.maxHandExcl) return [];
      return p.deck.length ? [{ ...base }] : [];
    }
    if (fx.t === "placeDebut") {
      return p.deck.some((u) => defOf(state, u).bloom === "debut") && stageCount(p) < 6 ? [{ ...base }] : [];
    }
    if (fx.t === "hpBonus" || fx.t === "omurice" || fx.t === "penlight") {
      if (fx.t === "penlight" && !p.holopower.length) return [];
      return allSlots(p)
        .filter((s) => !fx.name || namesOf(topDef(state, s.slot)).includes(fx.name))
        .map((s) => ({ ...base, zone: s.zone, idx: s.idx }));
    }
    if (fx.t === "freeBaton") {
      if (!p.center) return [];
      const out = [];
      p.back.forEach((s, i) => {
        if (!s.rest) out.push({ ...base, idx: i });
      });
      return out;
    }
    if (fx.t === "archiveCheerHeal") {
      return allSlots(p)
        .filter((s) => s.slot.cheers.length)
        .map((s) => ({ ...base, zone: s.zone, idx: s.idx }));
    }
    if (fx.t === "lookKeep") {
      return p.deck.length ? [{ ...base }] : [];
    }
    return [{ ...base }];
  }

  function setupActions(state, pid) {
    const p = state.players[pid];
    const step = state.setup.step;
    if (step === "mulligan") {
      return [
        { type: "MULLIGAN", redo: false },
        { type: "MULLIGAN", redo: true },
      ];
    }
    if (step === "center") {
      const acts = [];
      p.hand.forEach((u, i) => {
        const d = defOf(state, u);
        if (d.type === "holomem" && d.bloom === "debut") {
          acts.push({ type: "PLACE_CENTER", handIndex: i });
        }
      });
      return acts;
    }
    if (step === "backs") {
      const acts = [{ type: "DONE_BACK" }];
      if (stageCount(p) < 6) {
        p.hand.forEach((u, i) => {
          const d = defOf(state, u);
          if (d.type === "holomem" && (d.bloom === "debut" || d.bloom === "spot")) {
            acts.push({ type: "PLACE_BACK", handIndex: i });
          }
        });
      }
      return acts;
    }
    return [];
  }

  function cheerActions(state, pid) {
    return allSlots(state.players[pid]).map((s) => ({
      type: "ATTACH_CHEER",
      zone: s.zone,
      idx: s.idx,
    }));
  }

  function mainActions(state, pid) {
    const p = state.players[pid];
    const acts = [{ type: "END_MAIN" }];
    const firstTurnRestrict = p.flags.firstTurn;

    if (stageCount(p) < 6) {
      p.hand.forEach((u, i) => {
        const d = defOf(state, u);
        if (d.type === "holomem" && (d.bloom === "debut" || d.bloom === "spot")) {
          acts.push({ type: "PLAY_HOLOMEM", handIndex: i });
        }
      });
    }

    if (!firstTurnRestrict) {
      p.hand.forEach((u, i) => {
        const d = defOf(state, u);
        if (d.type !== "holomem") return;
        allSlots(p).forEach((s) => {
          if (s.slot.enteredThisTurn) return;
          if (!canBloomOnto(d, topDef(state, s.slot))) return;
          if (s.slot.damage >= d.hp) return;
          acts.push({ type: "BLOOM", handIndex: i, zone: s.zone, idx: s.idx });
        });
      });
    }

    if (!p.flags.collabUsed && !p.collab && p.deck.length) {
      p.back.forEach((s, i) => {
        if (!s.rest) acts.push({ type: "COLLAB", idx: i });
      });
    }

    if (!p.flags.batonUsed && p.center && !p.center.rest) {
      const need = topDef(state, p.center).baton || 0;
      if (p.center.cheers.length >= need) {
        p.back.forEach((s, i) => {
          if (!s.rest) acts.push({ type: "BATON", idx: i });
        });
      }
    }

    p.hand.forEach((u, i) => {
      const d = defOf(state, u);
      if (d.type !== "support") return;
      if (d.limited && (p.flags.limitedUsed || (p.isFirst && p.flags.firstTurn))) return;
      acts.push(...effectActions(state, pid, { type: "PLAY_SUPPORT", handIndex: i }, d.effect));
    });

    const oshi = card(p.oshiId);
    if (!p.flags.oshiUsed && p.holopower.length >= oshi.skill.cost) {
      acts.push(...effectActions(state, pid, { type: "OSHI" }, oshi.skill.effect));
    }
    if (!p.oshiSpUsed && p.holopower.length >= oshi.sp.cost) {
      acts.push(...effectActions(state, pid, { type: "SP_OSHI" }, oshi.sp.effect));
    }
    return acts;
  }

  function perfActions(state, pid) {
    const p = state.players[pid];
    const opp = state.players[1 - pid];
    const acts = [{ type: "END_PERFORMANCE" }];
    if (p.isFirst && p.flags.firstTurn) return acts;
    ["center", "collab"].forEach((zone) => {
      const slot = p[zone];
      if (!slot || slot.rest || p.flags.performed[zone]) return;
      const d = topDef(state, slot);
      (d.arts || []).forEach((arts, ai) => {
        if (!canPayArts(state, slot, arts)) return;
        if (opp.center) acts.push({ type: "PERFORM", from: zone, artsIndex: ai, target: "center" });
        if (opp.collab) acts.push({ type: "PERFORM", from: zone, artsIndex: ai, target: "collab" });
      });
    });
    return acts;
  }

  function pendingActions(state) {
    const pend = state.pending;
    if (pend && pend.type === "lookKeep") {
      return pend.peeked.map((_, i) => ({ type: "LOOK_KEEP", keepIndex: i }));
    }
    return [];
  }

  function getLegalActions(state, pid) {
    if (state.winner != null) return [];
    if (state.pending) {
      if (state.pending.player !== pid) return [];
      return pendingActions(state);
    }
    if (state.phase === "setup") {
      if (state.setup.player !== pid) return [];
      return setupActions(state, pid);
    }
    if (state.turn !== pid) return [];
    if (state.phase === "cheer") return cheerActions(state, pid);
    if (state.phase === "main") return mainActions(state, pid);
    if (state.phase === "performance") return perfActions(state, pid);
    return [];
  }

  function drawCards(state, p, n) {
    for (let i = 0; i < n; i++) {
      if (!p.deck.length) return;
      p.hand.push(p.deck.pop());
    }
  }

  function searchHand(state, p, pred) {
    const i = p.deck.findIndex((u) => pred(defOf(state, u)));
    if (i >= 0) {
      p.hand.push(p.deck.splice(i, 1)[0]);
      shuffle(state, p.deck);
    }
  }

  function payPower(p, n) {
    for (let i = 0; i < n; i++) if (p.holopower.length) p.archive.push(p.holopower.pop());
  }

  function checkWins(state) {
    if (state.winner != null) return;
    state.players.forEach((p, i) => {
      if (state.winner != null) return;
      if (p.life.length === 0) {
        state.winner = 1 - i;
        state.winReason = p.name + " ran out of life.";
      } else if (stageCount(p) === 0 && state.phase !== "setup") {
        state.winner = 1 - i;
        state.winReason = p.name + " has no talents on stage.";
      }
    });
  }

  function applyDamage(state, pid, zone, idx, dmg) {
    const p = state.players[pid];
    const slot = getSlot(p, zone, idx);
    if (!slot) return;
    slot.damage += dmg;
    if (slot.damage >= topDef(state, slot).hp + (slot.hpBonus || 0)) downHolomem(state, pid, zone, idx);
  }

  function downHolomem(state, pid, zone, idx) {
    const p = state.players[pid];
    const slot = getSlot(p, zone, idx);
    if (!slot) return;
    const def = topDef(state, slot);
    const name = def.name;
    const lifeLoss = def.buzz ? 2 : 1;
    slot.stack.forEach((u) => p.archive.push(u));
    slot.cheers.forEach((u) => p.archive.push(u));
    if (zone === "center") p.center = null;
    else if (zone === "collab") p.collab = null;
    else p.back.splice(idx, 1);
    log(state, name + " was downed!" + (def.buzz ? " (Buzz: life −2)" : ""));
    for (let n = 0; n < lifeLoss; n++) {
      if (!p.life.length) break;
      const lifeCard = p.life.pop();
      const remain = allSlots(p);
      if (remain.length) {
        const tgt = p.center || p.collab || remain[0].slot;
        tgt.cheers.push(lifeCard);
      } else p.archive.push(lifeCard);
    }
    checkWins(state);
  }

  function resolveEffect(state, pid, fx, ctx) {
    if (!fx) return;
    const p = state.players[pid];
    const opp = state.players[1 - pid];
    if (fx.t === "heal") {
      const n = fx.n;
      if (fx.who === "allYours") {
        allSlots(p).forEach((s) => {
          s.slot.damage = Math.max(0, s.slot.damage - n);
        });
      } else if (fx.who === "center" && p.center) {
        p.center.damage = Math.max(0, p.center.damage - n);
      } else if (fx.who === "self" && ctx.slot) {
        ctx.slot.damage = Math.max(0, ctx.slot.damage - n);
      } else if (fx.who === "back" && p.back[0]) {
        p.back[0].damage = Math.max(0, p.back[0].damage - n);
      } else {
        const slot = getSlot(p, ctx.zone, ctx.idx);
        if (slot) slot.damage = Math.max(0, slot.damage - n);
      }
    } else if (fx.t === "draw") {
      drawCards(state, p, fx.n);
    } else if (fx.t === "searchDebut") {
      searchHand(state, p, (c) => c.type === "holomem" && c.bloom === "debut");
    } else if (fx.t === "searchName") {
      searchHand(state, p, (c) => c.name === fx.name);
    } else if (fx.t === "attachArchiveCheer") {
      let slot = ctx.slot || getSlot(p, ctx.zone, ctx.idx);
      if (fx.who === "center") slot = p.center;
      if (fx.tag) {
        const hit = allSlots(p).find((s) => (topDef(state, s.slot).tags || []).includes(fx.tag));
        if (hit) slot = hit.slot;
      }
      const i = p.archive.findIndex((u) => {
        const d = defOf(state, u);
        if (d.type !== "cheer") return false;
        if (fx.colors && !fx.colors.includes(d.color)) return false;
        return true;
      });
      if (i >= 0 && slot) slot.cheers.push(p.archive.splice(i, 1)[0]);
    } else if (fx.t === "attachTopCheer") {
      const attach = (slot) => {
        if (p.cheerDeck.length && slot) slot.cheers.push(p.cheerDeck.pop());
      };
      if (fx.who === "allYours") allSlots(p).forEach((s) => attach(s.slot));
      else if (fx.who === "self") attach(ctx.slot || getSlot(p, ctx.zone, ctx.idx));
      else attach(getSlot(p, ctx.zone, ctx.idx));
    } else if (fx.t === "holopower") {
      for (let i = 0; i < fx.n; i++) if (p.deck.length) p.holopower.push(p.deck.pop());
    } else if (fx.t === "artsBonus") {
      const key = fx.who === "allYours" ? "*" : fx.who === "center" ? "center" : slotKey(ctx.zone, ctx.idx);
      p.flags.artsBonus[key] = (p.flags.artsBonus[key] || 0) + fx.n;
    } else if (fx.t === "damage" || fx.t === "damageDraw") {
      if (fx.who === "oppCollab") {
        if (opp.collab) applyDamage(state, 1 - pid, "collab", 0, fx.n);
      } else if (getSlot(opp, ctx.zone, ctx.idx)) applyDamage(state, 1 - pid, ctx.zone, ctx.idx, fx.n);
      if (fx.t === "damageDraw") drawCards(state, p, fx.d || 1);
    } else if (fx.t === "lookKeep") {
      const n = Math.min(fx.look, p.deck.length);
      if (!n) return;
      const peeked = [];
      for (let i = 0; i < n; i++) peeked.push(p.deck.pop());
      state.pending = { type: "lookKeep", player: pid, peeked, keep: fx.keep };
    } else if (fx.t === "moveCheer") {
      const from = getSlot(p, ctx.fromZone, ctx.fromIdx);
      const to = getSlot(p, ctx.zone, ctx.idx);
      if (from && to && from.cheers.length) to.cheers.push(from.cheers.pop());
    } else if (fx.t === "returnHolomem") {
      if (ctx.archiveIndex != null && p.archive[ctx.archiveIndex]) {
        p.hand.push(p.archive.splice(ctx.archiveIndex, 1)[0]);
      }
    } else if (fx.t === "freeBaton") {
      const back = p.back[ctx.idx];
      p.back[ctx.idx] = p.center;
      p.center = back;
    } else if (fx.t === "drawPower") {
      drawCards(state, p, fx.n || 1);
      if (p.deck.length) p.holopower.push(p.deck.pop());
    } else if (fx.t === "archiveCheerHeal") {
      const slot = getSlot(p, ctx.zone, ctx.idx);
      if (slot && slot.cheers.length) {
        p.archive.push(slot.cheers.pop());
        slot.damage = Math.max(0, slot.damage - fx.n);
      }
    } else if (fx.t === "swapOppCenter") {
      if (opp.center && opp.back[ctx.idx]) {
        const back = opp.back[ctx.idx];
        opp.back[ctx.idx] = opp.center;
        opp.center = back;
        if (fx.bonus && p.center && colorsOf(topDef(state, p.center)).includes(fx.bonusColor || "W")) {
          p.flags.artsBonus.center = (p.flags.artsBonus.center || 0) + fx.bonus;
        }
      }
    } else if (fx.t === "placeDebut") {
      const i = p.deck.findIndex((u) => defOf(state, u).bloom === "debut");
      if (i >= 0 && stageCount(p) < 6) {
        const u = p.deck.splice(i, 1)[0];
        p.back.push(newSlot(u, true));
        shuffle(state, p.deck);
        log(state, p.name + " placed " + defOf(state, u).name + " from the deck.");
      }
    } else if (fx.t === "reload5") {
      p.deck.push(...p.hand);
      p.hand = [];
      shuffle(state, p.deck);
      drawCards(state, p, 5);
    } else if (fx.t === "scoopNames") {
      const n = Math.min(fx.look, p.deck.length);
      const take = [];
      const rest = [];
      for (let i = 0; i < n; i++) {
        const u = p.deck.pop();
        const d = defOf(state, u);
        if (d.type === "holomem" && namesOf(d).some((nm) => fx.names.includes(nm))) take.push(u);
        else rest.push(u);
      }
      p.hand.push(...take);
      p.deck = rest.concat(p.deck);
    } else if (fx.t === "lookKeepLimited") {
      const n = Math.min(fx.look, p.deck.length);
      const peeked = [];
      for (let i = 0; i < n; i++) peeked.push(p.deck.pop());
      const limited = peeked.filter((u) => defOf(state, u).limited);
      if (limited.length) state.pending = { type: "lookKeep", player: pid, peeked: limited.concat(peeked.filter((u) => !defOf(state, u).limited)), keep: 1 };
      else p.deck = peeked.concat(p.deck);
    } else if (fx.t === "searchBloom") {
      const slot = getSlot(p, ctx.zone, ctx.idx);
      if (slot && slot.cheers.length) p.archive.push(slot.cheers.pop());
      searchHand(state, p, (c) => c.type === "holomem" && (c.bloom === "first" || c.bloom === "second") && !c.buzz);
    } else if (fx.t === "dieCheer") {
      const r = rollDie(state);
      log(state, p.name + " rolled a " + r + ".");
      if (r >= (fx.min || 3)) {
        const i = p.archive.findIndex((u) => defOf(state, u).type === "cheer");
        const tgt = p.center || (allSlots(p)[0] && allSlots(p)[0].slot);
        if (i >= 0 && tgt) tgt.cheers.push(p.archive.splice(i, 1)[0]);
      }
    } else if (fx.t === "dieCheerBack") {
      const r = rollDie(state);
      log(state, p.name + " rolled a " + r + ".");
      if (r <= (fx.max || 4) && p.cheerDeck.length && p.back.length) {
        p.back[0].cheers.push(p.cheerDeck.pop());
      }
    } else if (fx.t === "powerSwap") {
      if (p.holopower.length) p.hand.push(p.holopower.pop());
      if (p.hand.length) p.holopower.push(p.hand.pop());
    } else if (fx.t === "koyori") {
      if (p.center && namesOf(topDef(state, p.center)).includes("Tokino Sora")) drawCards(state, p, 1);
      if (p.center && namesOf(topDef(state, p.center)).includes("AZKi") && p.cheerDeck.length) {
        p.center.cheers.push(p.cheerDeck.pop());
      }
    } else if (fx.t === "archiveCheersTo") {
      const slot = getSlot(p, ctx.zone, ctx.idx);
      if (slot) {
        const cheers = [];
        p.archive = p.archive.filter((u) => {
          if (defOf(state, u).type === "cheer") {
            cheers.push(u);
            return false;
          }
          return true;
        });
        slot.cheers.push(...cheers);
      }
    } else if (fx.t === "hpBonus") {
      const slot = getSlot(p, ctx.zone, ctx.idx);
      if (slot) slot.hpBonus = (slot.hpBonus || 0) + fx.n;
    } else if (fx.t === "omurice") {
      const slot = getSlot(p, ctx.zone, ctx.idx);
      if (slot) {
        slot.damage = Math.max(0, slot.damage - 20);
        if (allSlots(p).some((s) => (topDef(state, s.slot).tags || []).includes("Cooking"))) {
          p.flags.artsBonus[slotKey(ctx.zone, ctx.idx)] = (p.flags.artsBonus[slotKey(ctx.zone, ctx.idx)] || 0) + 20;
        }
      }
    } else if (fx.t === "penlight") {
      if (p.holopower.length) p.archive.push(p.holopower.pop());
      const slot = getSlot(p, ctx.zone, ctx.idx);
      const cols = new Set();
      allSlots(p).forEach((s) => colorsOf(topDef(state, s.slot)).forEach((c) => cols.add(c)));
      const i = p.cheerDeck.findIndex((u) => cols.has(defOf(state, u).color));
      if (i >= 0 && slot) {
        slot.cheers.push(p.cheerDeck.splice(i, 1)[0]);
        shuffle(state, p.cheerDeck);
      }
    } else if (fx.t === "drawUntil") {
      while (p.hand.length < (fx.n || 3) && p.deck.length) p.hand.push(p.deck.pop());
    } else if (fx.t === "drawDump") {
      drawCards(state, p, fx.n || 2);
      if (p.hand.length) p.archive.push(p.hand.pop());
    } else if (fx.t === "drawIfOshi") {
      if (card(p.oshiId).color === fx.color) drawCards(state, p, 1);
    } else if (fx.t === "searchFood") {
      if (p.hand.length) p.archive.push(p.hand.pop());
      searchHand(state, p, (c) => c.food);
    } else if (fx.t === "returnEvent") {
      const i = p.archive.findIndex((u) => {
        const d = defOf(state, u);
        return d.type === "support" && d.event && !d.limited;
      });
      if (i >= 0) p.hand.push(p.archive.splice(i, 1)[0]);
    } else if (fx.t === "searchMascotFan") {
      if (p.center && namesOf(topDef(state, p.center)).includes("Nekomata Okayu")) {
        searchHand(state, p, (c) => c.mascot || c.fan);
      }
    } else if (fx.t === "gamersIntrusion") {
      if (p.center && (topDef(state, p.center).tags || []).includes("GAMERS")) {
        if (opp.center) applyDamage(state, 1 - pid, "center", 0, 10);
        if (opp.back[0]) applyDamage(state, 1 - pid, "back", 0, 10);
      }
    } else if (fx.t === "revealDebutCheer") {
      if (!p.deck.length) return;
      const top = p.deck[p.deck.length - 1];
      const d = defOf(state, top);
      p.deck.pop();
      p.deck.unshift(top);
      if ((d.bloom === "debut" || d.bloom === "spot") && p.cheerDeck.length && ctx.slot) {
        ctx.slot.cheers.push(p.cheerDeck.pop());
      }
    } else if (fx.t === "subaru") {
      if (p.center && namesOf(topDef(state, p.center)).includes("Yuzuki Choco")) {
        const i = p.archive.findIndex((u) => defOf(state, u).type === "cheer");
        const tgt = p.center;
        if (i >= 0 && tgt) tgt.cheers.push(p.archive.splice(i, 1)[0]);
      }
    }
  }

  function advanceSetup(state) {
    const s = state.setup;
    if (s.step === "mulligan") {
      if (s.player === 0) s.player = 1;
      else {
        s.step = "center";
        s.player = 0;
      }
    } else if (s.step === "center") {
      s.step = "backs";
    } else if (s.step === "backs") {
      if (s.player === 0) {
        s.step = "center";
        s.player = 1;
      } else beginTurn(state);
    }
  }

  function beginTurn(state) {
    const p = state.players[state.turn];
    p.flags.limitedUsed = false;
    p.flags.batonUsed = false;
    p.flags.collabUsed = false;
    p.flags.oshiUsed = false;
    p.flags.performed = { center: false, collab: false };
    p.flags.artsBonus = {};
    p.flags.eventsUsed = 0;
    allSlots(p).forEach((s) => {
      s.slot.enteredThisTurn = false;
      s.slot.rest = false;
    });
    if (p.collab) {
      p.collab.rest = true;
      p.back.push(p.collab);
      p.collab = null;
    }
    if (!p.center && p.back.length) {
      const active = p.back.findIndex((s) => !s.rest);
      p.center = p.back.splice(active >= 0 ? active : 0, 1)[0];
    }
    checkWins(state);
    if (state.winner != null) return;
    if (!p.deck.length) {
      state.winner = 1 - state.turn;
      state.winReason = p.name + " could not draw.";
      return;
    }
    p.hand.push(p.deck.pop());
    state.turnCount[state.turn]++;
    log(state, "— " + p.name + "'s turn —");
    if (p.cheerDeck.length && stageCount(p)) {
      state.pendingCheer = p.cheerDeck.pop();
      state.phase = "cheer";
    } else {
      state.phase = "main";
    }
  }

  function endTurn(state) {
    const p = state.players[state.turn];
    p.flags.firstTurn = false;
    if (!p.center && p.back.length) {
      const active = p.back.findIndex((s) => !s.rest);
      p.center = p.back.splice(active >= 0 ? active : 0, 1)[0];
    }
    checkWins(state);
    if (state.winner != null) return;
    state.turn = 1 - state.turn;
    beginTurn(state);
  }

  function performArts(state, pid, a) {
    const p = state.players[pid];
    const opp = state.players[1 - pid];
    const slot = p[a.from];
    const d = topDef(state, slot);
    const arts = d.arts[a.artsIndex];
    p.flags.performed[a.from] = true;
    const tslot = opp[a.target];
    let dmg = artsDamage(state, p, slot, arts, tslot);
    if (arts.dieBonus) {
      const r = rollDie(state);
      if (r % 2 === 1) dmg += 50;
      if (r === 1) dmg += 50;
      log(state, "Die roll " + r + " on " + arts.name + ".");
    }
    if (arts.dieCheerOrDraw) {
      const r = rollDie(state);
      if (r % 2 === 1 && p.cheerDeck.length) slot.cheers.push(p.cheerDeck.pop());
      else if (r % 2 === 0) drawCards(state, p, 1);
      log(state, "Die roll " + r + " on " + arts.name + ".");
    }
    log(state, p.name + "'s " + d.name + " used " + arts.name + " for " + dmg + ".");
    applyDamage(state, 1 - pid, a.target, 0, dmg);
    if (arts.onHit) resolveEffect(state, pid, arts.onHit, { zone: a.from, idx: 0, slot });
  }

  function doAction(state, pid, a) {
    const p = state.players[pid];
    if (a.type === "MULLIGAN") {
      if (a.redo) {
        p.deck.push(...p.hand);
        p.hand = [];
        shuffle(state, p.deck);
        for (let i = 0; i < 7; i++) if (p.deck.length) p.hand.push(p.deck.pop());
        log(state, p.name + " mulliganed.");
      } else log(state, p.name + " kept their hand.");
      if (!forceDebut(state, p)) {
        state.winner = 1 - pid;
        state.winReason = p.name + " could not find a Debut talent.";
        return;
      }
      advanceSetup(state);
      return;
    }
    if (a.type === "PLACE_CENTER") {
      const u = p.hand.splice(a.handIndex, 1)[0];
      p.center = newSlot(u, false);
      log(state, p.name + " set " + defOf(state, u).name + " as center.");
      advanceSetup(state);
      return;
    }
    if (a.type === "PLACE_BACK" || a.type === "PLAY_HOLOMEM") {
      const u = p.hand.splice(a.handIndex, 1)[0];
      const slot = newSlot(u, a.type === "PLAY_HOLOMEM");
      p.back.push(slot);
      const d = defOf(state, u);
      log(state, p.name + " played " + d.name + " to the back.");
      if (a.type === "PLAY_HOLOMEM" && d.playFx) {
        resolveEffect(state, pid, d.playFx, { zone: "back", idx: p.back.length - 1, slot });
      }
      return;
    }
    if (a.type === "DONE_BACK") {
      advanceSetup(state);
      return;
    }
    if (a.type === "ATTACH_CHEER") {
      const slot = getSlot(p, a.zone, a.idx);
      slot.cheers.push(state.pendingCheer);
      state.pendingCheer = null;
      log(state, p.name + " sent a cheer to " + topDef(state, slot).name + ".");
      state.phase = "main";
      return;
    }
    if (a.type === "BLOOM") {
      const u = p.hand.splice(a.handIndex, 1)[0];
      const slot = getSlot(p, a.zone, a.idx);
      slot.stack.unshift(u);
      const d = defOf(state, u);
      log(state, p.name + " bloomed " + d.name + " to " + (g.HOLO.BLOOM_LABEL[d.bloom] || d.bloom) + ".");
      if (d.bloomFx) resolveEffect(state, pid, d.bloomFx, { zone: a.zone, idx: a.idx, slot });
      return;
    }
    if (a.type === "COLLAB") {
      const slot = p.back.splice(a.idx, 1)[0];
      p.collab = slot;
      p.flags.collabUsed = true;
      if (p.deck.length) p.holopower.push(p.deck.pop());
      const d = topDef(state, slot);
      log(state, p.name + " collabed with " + d.name + ".");
      if (d.collabFx) resolveEffect(state, pid, d.collabFx, { zone: "collab", idx: 0, slot });
      return;
    }
    if (a.type === "BATON") {
      const need = topDef(state, p.center).baton || 0;
      for (let i = 0; i < need; i++) if (p.center.cheers.length) p.archive.push(p.center.cheers.pop());
      const back = p.back[a.idx];
      p.back[a.idx] = p.center;
      p.center = back;
      p.flags.batonUsed = true;
      log(state, p.name + " baton passed.");
      return;
    }
    if (a.type === "PLAY_SUPPORT") {
      const u = p.hand.splice(a.handIndex, 1)[0];
      const d = defOf(state, u);
      if (d.limited) p.flags.limitedUsed = true;
      if (d.event) p.flags.eventsUsed = (p.flags.eventsUsed || 0) + 1;
      p.archive.push(u);
      log(state, p.name + " played " + d.name + ".");
      resolveEffect(state, pid, d.effect, a);
      return;
    }
    if (a.type === "OSHI" || a.type === "SP_OSHI") {
      const oshi = card(p.oshiId);
      const sk = a.type === "OSHI" ? oshi.skill : oshi.sp;
      payPower(p, sk.cost);
      if (a.type === "OSHI") p.flags.oshiUsed = true;
      else p.oshiSpUsed = true;
      log(state, p.name + " used " + sk.name + ".");
      resolveEffect(state, pid, sk.effect, a);
      return;
    }
    if (a.type === "END_MAIN") {
      if (p.isFirst && p.flags.firstTurn) endTurn(state);
      else state.phase = "performance";
      return;
    }
    if (a.type === "PERFORM") {
      performArts(state, pid, a);
      return;
    }
    if (a.type === "END_PERFORMANCE") {
      endTurn(state);
      return;
    }
    if (a.type === "LOOK_KEEP") {
      const pend = state.pending;
      const keep = pend.peeked.splice(a.keepIndex, 1)[0];
      p.hand.push(keep);
      p.deck = pend.peeked.concat(p.deck);
      state.pending = null;
      log(state, p.name + " kept " + defOf(state, keep).name + " from the top.");
    }
  }

  function applyAction(state, pid, action) {
    if (state.winner != null) return { ok: false, error: "Game over" };
    const legal = getLegalActions(state, pid);
    const key = JSON.stringify(action);
    if (!legal.some((a) => JSON.stringify(a) === key)) return { ok: false, error: "Illegal action" };
    doAction(state, pid, action);
    checkWins(state);
    return { ok: true };
  }

  function getView(state, pid) {
    const view = {
      me: pid,
      phase: state.phase,
      setup: state.setup,
      turn: state.turn,
      firstPlayer: state.firstPlayer,
      winner: state.winner,
      winReason: state.winReason,
      log: state.log.slice(-80),
      turnCount: state.turnCount,
      cards: state.cards,
      pending: state.pending && state.pending.player === pid
        ? { type: state.pending.type, peeked: state.pending.peeked }
        : state.pending
          ? { type: state.pending.type, waiting: true }
          : null,
      pendingCheer: state.pendingCheer && state.turn === pid ? state.pendingCheer : null,
      legal: getLegalActions(state, pid),
      players: state.players.map((p, i) => ({
        name: p.name,
        oshiId: p.oshiId,
        oshiSpUsed: p.oshiSpUsed,
        handCount: p.hand.length,
        deckCount: p.deck.length,
        cheerCount: p.cheerDeck.length,
        powerCount: p.holopower.length,
        lifeCount: p.life.length,
        archiveCount: p.archive.length,
        archive: i === pid ? p.archive.slice() : p.archive.slice(),
        hand: i === pid ? p.hand.slice() : p.hand.map(() => null),
        center: p.center,
        collab: p.collab,
        back: p.back,
        flags: p.flags,
        isFirst: p.isFirst,
      })),
    };
    return view;
  }

  g.HOLO.createGame = createGame;
  g.HOLO.applyAction = applyAction;
  g.HOLO.getLegalActions = getLegalActions;
  g.HOLO.getView = getView;
  g.HOLO.clone = clone;
  g.HOLO.defOf = defOf;
  g.HOLO.topDef = topDef;
  g.HOLO.allSlots = allSlots;
  g.HOLO.cheerColors = cheerColors;
  g.HOLO.canPayArts = canPayArts;
  g.HOLO.artsDamage = artsDamage;
  g.HOLO.stageCount = stageCount;
  g.HOLO.getSlot = getSlot;
})(typeof globalThis !== "undefined" ? globalThis : this);
