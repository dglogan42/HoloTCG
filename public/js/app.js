(function () {
  const $ = (sel, el) => (el || document).querySelector(sel);
  const app = $("#app");
  const COLORS = HOLO.COLORS;
  const BY = HOLO.BY_ID;

  const state = {
    screen: "lobby",
    name: localStorage.getItem("lumina-name") || "Producer",
    deckId: localStorage.getItem("lumina-deck") || "sora",
    custom: null,
    game: null,
    seat: 0,
    vs: "cpu",
    room: null,
    ws: null,
    logOpen: true,
    filter: "all",
    builder: null,
    inspect: null,
  };

  function currentDeck() {
    if (state.custom) return state.custom;
    const s = HOLO.STARTERS[state.deckId] || HOLO.STARTERS.aira;
    return { oshi: s.oshi, main: s.main.slice(), cheer: s.cheer.slice(), name: state.name };
  }

  function costGems(cost) {
    return (cost || []).map((c) => `<i class="gem ${c}"></i>`).join("");
  }

  function cheerDots(slot, game) {
    if (!slot || !slot.cheers) return "";
    return slot.cheers
      .map((u) => {
        const d = game ? HOLO.defOf(game, u) : BY[u];
        return `<i class="gem ${d && d.color ? d.color : "X"}"></i>`;
      })
      .join("");
  }

  function renderCard(def, opts) {
    opts = opts || {};
    if (!def) {
      return `<div class="tcg back ${opts.mini ? "mini" : ""}"></div>`;
    }
    if (opts.uid && opts.game) def = HOLO.defOf(opts.game, opts.uid) || def;
    const cls = ["tcg", def.color || "", def.type, opts.mini ? "mini" : "", opts.legal ? "legal" : ""]
      .filter(Boolean)
      .join(" ");
    if (def.type === "cheer") {
      return `<div class="${cls}" data-id="${def.id}"><i class="gem ${def.color}" style="width:36px;height:36px"></i></div>`;
    }
    if (def.type === "support") {
      return `<div class="${cls}" data-id="${def.id}">
        <div class="tcg-top"><span class="bloom">${def.limited ? "LIMITED" : "SUPPORT"}</span></div>
        <div class="sup-icon">${iconFor(def.icon)}</div>
        <div class="tcg-name">${esc(def.name)}${def.proxy ? " · PROXY" : ""}</div>
        <div class="tcg-arts"><div class="art-line">${esc(def.text || "")}</div></div>
      </div>`;
    }
    const arts = (def.arts || [])
      .map((a) => `<div class="art-line"><span class="costs">${costGems(a.cost)}</span>${esc(a.name)} ${a.dmg}</div>`)
      .join("");
    const bloom =
      def.type === "oshi" ? "OSHI" : (def.buzz ? "1st Buzz" : HOLO.BLOOM_LABEL[def.bloom] || "");
    return `<div class="${cls}" data-id="${def.id}" data-uid="${opts.uid || ""}">
      <div class="tcg-art" style="background-image:url('${def.art || ""}')"></div>
      <div class="tcg-top">
        <span class="bloom">${bloom}</span>
        ${def.hp ? `<span class="hp-badge">HP ${def.hp}</span>` : ""}
      </div>
      <div class="tcg-name">${esc(def.name)}${def.proxy ? " · PROXY" : ""}</div>
      ${def.type === "oshi" ? `<div class="oshi-life">LIFE ${def.life} · ${esc(def.skill.name)}</div>` : `<div class="tcg-arts">${arts}</div>`}
      ${opts.slot ? `<div class="cheers-row">${cheerDots(opts.slot, opts.game)}</div>
        <div class="dmg-bar"><i style="width:${Math.min(100, ((opts.slot.damage || 0) / (def.hp || 1)) * 100)}%"></i></div>` : ""}
    </div>`;
  }

  function iconFor(k) {
    return ({ search: "🔎", draw: "✦", look: "☰", return: "↩", power: "◆", cheer: "✧", move: "⇄", heal: "+", mic: "♫", glow: "✶", swap: "⇅" }[k] || "★");
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function go(screen) {
    state.screen = screen;
    draw();
  }

  function header() {
    return `<div class="brand">
      <div class="logo-mark"><div class="logo-gem"></div>
        <div class="logo-text">LUMINA<span>VIRTUAL IDOL CARD GAME</span></div></div>
      <div class="nav-links">
        <button data-go="lobby">Home</button>
        <button data-go="how">How to play</button>
        <button data-go="gallery">Gallery</button>
        <button data-go="builder">Deck</button>
      </div>
    </div>`;
  }

  function lobbyView() {
    const decks = Object.values(HOLO.STARTERS)
      .map((d) => {
        const o = BY[d.oshi];
        return `<button class="deck-card ${state.deckId === d.id ? "sel" : ""}" data-deck="${d.id}">
          <img src="${o.art}" alt="">
          <div class="body">
            <h3><i class="color-dot" style="background:${COLORS[d.color].ink}"></i>${esc(d.name)}</h3>
            <p>${esc(d.blurb)}</p>
          </div>
        </button>`;
      })
      .join("");
    return `<div class="lobby"><div class="lobby-inner">
      ${header()}
      <div class="hero">
        <h1>Produce the<br><em>stage.</em></h1>
        <p>Unofficial fan client. Cards use official hololive OCG <b>names and public stats</b> with original proxy art — no COVER illustrations. Not affiliated with COVER Corp.</p>
        <div class="cta-row">
          <button class="btn" id="play-cpu">Play vs CPU</button>
          <button class="btn alt" id="create-room">Create room</button>
        </div>
      </div>
      <div class="deck-pick">${decks}</div>
      <div class="online-box">
        <div class="panel">
          <h3>Your name</h3>
          <div class="row"><input id="pname" type="text" maxlength="24" value="${esc(state.name)}"></div>
        </div>
        <div class="panel">
          <h3>Join room</h3>
          <div class="row">
            <input id="rcode" type="text" maxlength="4" placeholder="CODE">
            <button class="btn" id="join-room">Join</button>
          </div>
        </div>
      </div>
    </div></div>`;
  }

  function howView() {
    return `<div class="page">${header()}<h1>How to play</h1>
      <div class="howto">
        <article><h3>Build</h3><p>1 Oshi · 50-card main deck (talents + support, max 4 of each) · 20-card cheer deck. Win by emptying the opponent's life, clearing their stage, or when they cannot draw.</p></article>
        <article><h3>Stage</h3><p>Center performs. Collab is a second performer you move from the back (pays 1 deck card into Stage Power). Back row holds reserves (max 6 talents on stage).</p></article>
        <article><h3>Turn</h3><ol>
          <li>Reset — stand talents, send last collab to the back (rested), refill an empty center.</li>
          <li>Draw 1.</li>
          <li>Cheer — attach the top cheer to any talent.</li>
          <li>Main — play Debut/Spot, Bloom same name, Collab, Baton Pass, Support, Oshi skills.</li>
          <li>Performance — Center and Collab use Arts if they have the cheer colors.</li>
        </ol></article>
        <article><h3>Bloom</h3><p>Debut → 1st → 2nd. Same name, not the turn they entered, not first turn. Spot talents cannot bloom. First player skips Bloom, Limited support, and Performance on turn 1.</p></article>
      </div></div>`;
  }

  function galleryView() {
    const cards = HOLO.CARDS.filter((c) => state.filter === "all" || c.type === state.filter || c.color === state.filter);
    return `<div class="page">${header()}<h1>Card gallery</h1>
      <div class="filter-row">
        ${["all", "oshi", "holomem", "support", "cheer", "W", "R", "U", "G", "P", "Y"]
          .map((f) => `<button class="chip ${state.filter === f ? "on" : ""}" data-filter="${f}">${f}</button>`)
          .join("")}
      </div>
      <div class="grid">${cards.map((c) => renderCard(c)).join("")}</div>
    </div>`;
  }

  function builderView() {
    const b = state.builder || {
      oshi: currentDeck().oshi,
      main: counts(currentDeck().main),
      cheer: counts(currentDeck().cheer),
    };
    state.builder = b;
    const mainList = expand(b.main);
    const cheerList = expand(b.cheer);
    const deck = { oshi: b.oshi, main: mainList, cheer: cheerList };
    const v = HOLO.validateDeck(deck);
    const pool = HOLO.CARDS.filter((c) => c.type !== "oshi");
    return `<div class="page">${header()}<h1>Deck workshop</h1>
      <div class="builder">
        <div class="builder-side panel">
          ${renderCard(BY[b.oshi])}
          <div class="stat">Main <b>${mainList.length}/50</b></div>
          <div class="stat">Cheer <b>${cheerList.length}/20</b></div>
          ${v.ok ? `<p class="muted">Legal deck.</p>` : v.errors.map((e) => `<p class="warn">${esc(e)}</p>`).join("")}
          <div class="cta-row">
            <button class="btn" id="save-deck" ${v.ok ? "" : "disabled"}>Use this deck</button>
            <button class="ghost" id="reset-deck">Reset</button>
          </div>
          <h3>Oshi</h3>
          ${HOLO.CARDS.filter((c) => c.type === "oshi")
            .map((c) => `<button class="chip ${b.oshi === c.id ? "on" : ""}" data-oshi="${c.id}">${esc(c.name)}</button>`)
            .join("")}
        </div>
        <div>
          <div class="grid">${pool
            .map((c) => {
              const n = (c.type === "cheer" ? b.cheer[c.id] : b.main[c.id]) || 0;
              return `<div>
                ${renderCard(c)}
                <div class="row" style="margin-top:6px">
                  <button class="ghost" data-sub="${c.id}">−</button>
                  <span>${n}</span>
                  <button class="ghost" data-add="${c.id}">+</button>
                </div>
              </div>`;
            })
            .join("")}</div>
        </div>
      </div></div>`;
  }

  function counts(arr) {
    const o = {};
    arr.forEach((id) => {
      o[id] = (o[id] || 0) + 1;
    });
    return o;
  }
  function expand(map) {
    const out = [];
    Object.entries(map).forEach(([id, n]) => {
      for (let i = 0; i < n; i++) out.push(id);
    });
    return out;
  }

  function phaseLabel(view) {
    if (view.winner != null) return "FINISHED";
    if (view.phase === "setup") return "SETUP · " + (view.setup.step || "").toUpperCase();
    return (view.phase || "").toUpperCase();
  }

  function slotHtml(game, slot, zone, idx, legalKeys, mine) {
    const key = JSON.stringify({ zone, idx });
    const isLegal = legalKeys.has("ATTACH_CHEER:" + zone + ":" + idx) || legalKeys.has("BLOOM:" + zone + ":" + idx) || legalKeys.has("PERFORM_T:" + zone);
    if (!slot) {
      return `<div class="zone"><label>${zone}</label><div class="slot ${isLegal ? "legal" : ""}" data-zone="${zone}" data-idx="${idx}"></div></div>`;
    }
    const def = HOLO.topDef(game, slot);
    return `<div class="zone"><label>${zone}${slot.rest ? " · rest" : ""}</label>
      <div class="slot has ${isLegal ? "legal" : ""}" data-zone="${zone}" data-idx="${idx}">
        ${renderCard(def, { mini: true, slot, game, uid: slot.stack[0] })}
      </div></div>`;
  }

  function matchView() {
    const game = state.game;
    if (!game) return lobbyView();
    const view = state.vs === "online" ? game : HOLO.getView(game, state.seat);
    const me = view.players[state.seat];
    const opp = view.players[1 - state.seat];
    const legal = view.legal || [];
    const legalKeys = new Set();
    legal.forEach((a) => {
      if (a.type === "ATTACH_CHEER") legalKeys.add("ATTACH_CHEER:" + a.zone + ":" + a.idx);
      if (a.type === "BLOOM") legalKeys.add("BLOOM:" + a.zone + ":" + a.idx);
      if (a.type === "PLACE_CENTER" || a.type === "PLAY_HOLOMEM" || a.type === "PLACE_BACK") legalKeys.add("HAND:" + a.handIndex);
      if (a.type === "PLAY_SUPPORT") legalKeys.add("HAND:" + a.handIndex);
      if (a.type === "PERFORM") legalKeys.add("PERFORM:" + a.from);
    });
    const src = state.vs === "online" ? null : game;

    function row(p, mine) {
      const g = src || { cards: view.cards, ...game };
      return `
        <div class="meta-row">
          <div class="pile">${esc(p.name)} · ${BY[p.oshiId].name}
            <div class="life-gems">${Array.from({ length: p.lifeCount }, () => `<i class="life-gem"></i>`).join("")}</div>
          </div>
          <div class="pile">Deck ${p.deckCount} · Cheer ${p.cheerCount} · Power ${p.powerCount} · Archive ${p.archiveCount}</div>
        </div>
        <div class="back-row">${p.back.map((s, i) => slotHtml(g, s, "back", i, legalKeys, mine)).join("") || "<div class='muted'>no back</div>"}</div>
        <div class="row-stage">
          ${slotHtml(g, p.collab, "collab", 0, legalKeys, mine)}
          ${slotHtml(g, p.center, "center", 0, legalKeys, mine)}
          <div class="zone"><label>oshi</label>${renderCard(BY[p.oshiId], { mini: true })}</div>
        </div>`;
    }

    const actions = [];
    if (legal.some((a) => a.type === "MULLIGAN" && !a.redo)) actions.push(`<button class="btn" data-act='${JSON.stringify({ type: "MULLIGAN", redo: false })}'>Keep hand</button>`);
    if (legal.some((a) => a.type === "MULLIGAN" && a.redo)) actions.push(`<button class="btn alt" data-act='${JSON.stringify({ type: "MULLIGAN", redo: true })}'>Mulligan</button>`);
    if (legal.some((a) => a.type === "DONE_BACK")) actions.push(`<button class="btn" data-act='${JSON.stringify({ type: "DONE_BACK" })}'>Done placing</button>`);
    if (legal.some((a) => a.type === "END_MAIN")) {
      const skipPerf = me.isFirst && me.flags.firstTurn;
      actions.push(`<button class="btn" data-act='${JSON.stringify({ type: "END_MAIN" })}'>${skipPerf ? "End turn" : "Go perform"}</button>`);
    }
    if (legal.some((a) => a.type === "END_PERFORMANCE")) actions.push(`<button class="btn" data-act='${JSON.stringify({ type: "END_PERFORMANCE" })}'>End turn</button>`);
    if (legal.some((a) => a.type === "OSHI")) {
      const first = legal.find((a) => a.type === "OSHI");
      actions.push(`<button class="btn alt" data-kind="OSHI">Oshi skill</button>`);
    }
    if (legal.some((a) => a.type === "SP_OSHI")) actions.push(`<button class="btn alt" data-kind="SP_OSHI">SP Oshi</button>`);

    const hand = (me.hand || [])
      .map((u, i) => {
        const def = u ? HOLO.defOf(src || { cards: view.cards }, u) : null;
        return renderCard(def, { legal: legalKeys.has("HAND:" + i), uid: u, game: src || { cards: view.cards } }).replace(
          'class="',
          `data-hand="${i}" class="`
        );
      })
      .join("");

    const prompt = pendingPrompt(view, legal);
    const win =
      view.winner == null
        ? ""
        : `<div class="win"><div><h1>${view.winner === state.seat ? "You win" : "You lose"}</h1>
            <p>${esc(view.winReason || "")}</p>
            <button class="btn" data-go="lobby">Back home</button></div></div>`;

    return `<div class="match">
      <div class="match-bar">
        <div class="logo-text">LUMINA</div>
        <div class="phase-pill">${phaseLabel(view)}${view.turn === state.seat ? " · YOU" : " · OPP"}</div>
        <div>
          ${state.room ? `<span class="muted">ROOM ${state.room}</span>` : ""}
          <button class="ghost" id="toggle-log">Log</button>
          <button class="ghost" data-go="lobby">Leave</button>
        </div>
      </div>
      <div class="board">
        ${row(opp, false)}
        ${row(me, true)}
      </div>
      <div class="actions">${actions.join("")}<span class="muted">${hint(view, legal)}</span></div>
      <div class="hand">${hand}</div>
      <div class="log ${state.logOpen ? "on" : ""}">${(view.log || []).map((l) => `<div>${esc(l)}</div>`).join("")}</div>
      ${prompt}${win}
    </div>`;
  }

  function hint(view, legal) {
    if (view.winner != null) return "";
    if (view.phase === "setup" && view.setup && view.setup.player !== state.seat) return "Waiting for opponent setup…";
    if (view.phase !== "setup" && view.turn !== state.seat && !view.pending) return "Opponent is producing…";
    if (legal.some((a) => a.type === "PLACE_CENTER")) return "Choose a Debut talent as your center.";
    if (legal.some((a) => a.type === "PLACE_BACK")) return "Play more Debut/Spot talents to the back, then Done.";
    if (legal.some((a) => a.type === "ATTACH_CHEER")) return "Send this turn's cheer to a talent.";
    if (legal.some((a) => a.type === "LOOK_KEEP")) return "Keep one of the revealed cards.";
    if (view.phase === "performance") return "Use Arts, then End turn.";
    return "Play talents, bloom, collab, or support — then Go perform.";
  }

  function pendingPrompt(view, legal) {
    if (legal.some((a) => a.type === "LOOK_KEEP")) {
      const peeked = (view.pending && view.pending.peeked) || [];
      const g = state.vs === "online" ? { cards: view.cards } : state.game;
      return `<div class="prompt"><div class="prompt-card"><h2>Keep one</h2>
        <div class="choice-row">${peeked
          .map((u, i) => `<button data-act='${JSON.stringify({ type: "LOOK_KEEP", keepIndex: i })}'>${renderCard(HOLO.defOf(g, u))}</button>`)
          .join("")}</div></div></div>`;
    }
    return "";
  }

  function draw() {
    const map = { lobby: lobbyView, how: howView, gallery: galleryView, builder: builderView, match: matchView };
    app.innerHTML = (map[state.screen] || lobbyView)();
    bind();
  }

  function bind() {
    app.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));
    app.querySelectorAll("[data-deck]").forEach((b) =>
      b.addEventListener("click", () => {
        state.deckId = b.dataset.deck;
        state.custom = null;
        localStorage.setItem("lumina-deck", state.deckId);
        draw();
      })
    );
    app.querySelectorAll("[data-filter]").forEach((b) =>
      b.addEventListener("click", () => {
        state.filter = b.dataset.filter;
        draw();
      })
    );
    const name = $("#pname");
    if (name)
      name.addEventListener("change", () => {
        state.name = name.value.slice(0, 24) || "Producer";
        localStorage.setItem("lumina-name", state.name);
      });
    const play = $("#play-cpu");
    if (play) play.addEventListener("click", startCpu);
    const create = $("#create-room");
    if (create) create.addEventListener("click", () => online("create"));
    const join = $("#join-room");
    if (join) join.addEventListener("click", () => online("join", ($("#rcode") || {}).value));
    bindBuilder();
    bindMatch();
  }

  function bindBuilder() {
    app.querySelectorAll("[data-oshi]").forEach((b) =>
      b.addEventListener("click", () => {
        state.builder.oshi = b.dataset.oshi;
        draw();
      })
    );
    app.querySelectorAll("[data-add]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.dataset.add;
        const c = BY[id];
        const bag = c.type === "cheer" ? state.builder.cheer : state.builder.main;
        const max = c.type === "cheer" ? 20 : 4;
        const total = c.type === "cheer" ? expand(state.builder.cheer).length : expand(state.builder.main).length;
        const cap = c.type === "cheer" ? 20 : 50;
        if ((bag[id] || 0) >= max || total >= cap) return;
        bag[id] = (bag[id] || 0) + 1;
        draw();
      })
    );
    app.querySelectorAll("[data-sub]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.dataset.sub;
        const c = BY[id];
        const bag = c.type === "cheer" ? state.builder.cheer : state.builder.main;
        if (!bag[id]) return;
        bag[id]--;
        if (!bag[id]) delete bag[id];
        draw();
      })
    );
    const save = $("#save-deck");
    if (save)
      save.addEventListener("click", () => {
        const d = { oshi: state.builder.oshi, main: expand(state.builder.main), cheer: expand(state.builder.cheer), name: state.name };
        if (!HOLO.validateDeck(d).ok) return;
        state.custom = d;
        go("lobby");
      });
    const reset = $("#reset-deck");
    if (reset)
      reset.addEventListener("click", () => {
        state.builder = null;
        draw();
      });
  }

  function bindMatch() {
    const logb = $("#toggle-log");
    if (logb)
      logb.addEventListener("click", () => {
        state.logOpen = !state.logOpen;
        draw();
      });
    app.querySelectorAll("[data-act]").forEach((b) =>
      b.addEventListener("click", () => act(JSON.parse(b.dataset.act)))
    );
    app.querySelectorAll("[data-hand]").forEach((el) =>
      el.addEventListener("click", () => onHand(+el.dataset.hand))
    );
    app.querySelectorAll("[data-zone]").forEach((el) =>
      el.addEventListener("click", () => onZone(el.dataset.zone, +el.dataset.idx))
    );
    app.querySelectorAll("[data-kind]").forEach((el) =>
      el.addEventListener("click", () => onKind(el.dataset.kind))
    );
  }

  function legalNow() {
    if (state.vs === "online") return (state.game && state.game.legal) || [];
    return HOLO.getLegalActions(state.game, state.seat);
  }

  function onHand(i) {
    const legal = legalNow();
    const opts = legal.filter((a) => a.handIndex === i);
    if (!opts.length) return;
    if (opts.length === 1 && !needsTarget(opts[0])) return act(opts[0]);
    pick(opts);
  }

  function onZone(zone, idx) {
    const legal = legalNow();
    const opts = legal.filter((a) => {
      if (a.type === "ATTACH_CHEER" && a.zone === zone && a.idx === idx) return true;
      if (a.type === "BLOOM" && a.zone === zone && a.idx === idx) return true;
      if (a.type === "COLLAB" && zone === "back" && a.idx === idx) return true;
      if (a.type === "BATON" && zone === "back" && a.idx === idx) return true;
      if (a.type === "PERFORM" && a.target === zone) return true;
      if ((a.type === "OSHI" || a.type === "SP_OSHI" || a.type === "PLAY_SUPPORT") && a.zone === zone && a.idx === idx) return true;
      return false;
    });
    if (!opts.length) {
      const collab = legal.find((a) => a.type === "COLLAB" && zone === "back" && a.idx === idx);
      if (collab) return act(collab);
      return;
    }
    if (opts.length === 1) return act(opts[0]);
    pick(opts);
  }

  function onKind(kind) {
    const opts = legalNow().filter((a) => a.type === kind);
    if (opts.length === 1) return act(opts[0]);
    pick(opts);
  }

  function needsTarget(a) {
    return a.zone != null || a.target != null || a.fromZone != null;
  }

  function pick(opts) {
    if (opts.length === 1) return act(opts[0]);
    const wrap = document.createElement("div");
    wrap.className = "prompt";
    wrap.innerHTML = `<div class="prompt-card"><h2>Choose</h2><div class="choice-row">${opts
      .map((a, i) => `<button class="btn alt" data-i="${i}">${esc(labelAct(a))}</button>`)
      .join("")}</div></div>`;
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest("[data-i]");
      if (!b) return;
      wrap.remove();
      act(opts[+b.dataset.i]);
    });
    document.body.appendChild(wrap);
  }

  function labelAct(a) {
    if (a.type === "BLOOM") return "Bloom onto " + a.zone + (a.zone === "back" ? " " + a.idx : "");
    if (a.type === "PERFORM") return "Arts from " + a.from + " → " + a.target;
    if (a.type === "PLAY_SUPPORT") return "Support → " + (a.zone || "resolve");
    if (a.type === "OSHI" || a.type === "SP_OSHI") return a.type + (a.zone ? " → " + a.zone : "");
    if (a.type === "COLLAB") return "Collab back #" + a.idx;
    if (a.type === "BATON") return "Baton with back #" + a.idx;
    return a.type;
  }

  function act(action) {
    if (!state.game) return;
    if (state.vs === "online") {
      if (state.ws) state.ws.send(JSON.stringify({ t: "act", action }));
      return;
    }
    const r = HOLO.applyAction(state.game, state.seat, action);
    if (!r.ok) return;
    cpuIfNeeded();
    draw();
  }

  function cpuIfNeeded() {
    for (let n = 0; n < 50; n++) {
      if (!state.game || state.game.winner != null) return;
      const cpu = 1 - state.seat;
      const legal = HOLO.getLegalActions(state.game, cpu);
      if (!legal.length) return;
      HOLO.playTurn(state.game, cpu, 12);
    }
  }

  function startCpu() {
    const mine = currentDeck();
    mine.name = state.name;
    const oppId = state.deckId === "ayame" ? "sora" : "ayame";
    const opp = HOLO.STARTERS[oppId];
    state.game = HOLO.createGame({
      p0: mine,
      p1: { oshi: opp.oshi, main: opp.main.slice(), cheer: opp.cheer.slice(), name: "CPU " + opp.name.replace("Start Deck: ", "") },
      first: 0,
      seed: Date.now() % 1e9,
    });
    state.seat = 0;
    state.vs = "cpu";
    state.screen = "match";
    cpuIfNeeded();
    draw();
  }

  function online(mode, code) {
    if (state.ws) {
      try {
        state.ws.close();
      } catch (_) {}
    }
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(proto + "://" + location.host + "/ws");
    state.ws = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ t: "hello", name: state.name }));
      const deck = currentDeck();
      if (mode === "create") ws.send(JSON.stringify({ t: "create", deck }));
      else ws.send(JSON.stringify({ t: "join", code: String(code || "").toUpperCase(), deck }));
    };
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.t === "err") return alert(msg.msg);
      if (msg.t === "room") {
        state.room = msg.room.code;
        state.seat = msg.seat;
        if (!msg.room.players[0] || !msg.room.players[1]) {
          state.screen = "lobby";
          draw();
          alert("Room " + state.room + " — waiting for opponent.");
        }
      }
      if (msg.t === "state") {
        state.game = msg.view;
        state.vs = "online";
        state.seat = msg.view.me;
        state.screen = "match";
        draw();
      }
    };
    ws.onerror = () => alert("Could not reach the match server. Run npm start.");
  }

  draw();
})();
