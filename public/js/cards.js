(function (g) {
  const W = "W", R = "R", U = "U", G = "G", P = "P", Y = "Y", N = "N";
  const art = {
    W: "assets/portraits/aira.jpg",
    R: "assets/portraits/ember.jpg",
    U: "assets/portraits/mio.jpg",
    G: "assets/portraits/yuzu.jpg",
    P: "assets/portraits/vesper.jpg",
    Y: "assets/portraits/pika.jpg",
    N: "assets/ui/cardback.jpg",
  };

  function holo(partial) {
    const color = Array.isArray(partial.color) ? partial.color[0] : partial.color || N;
    return Object.assign({ type: "holomem", art: art[color] || art.N, baton: 1, proxy: true }, partial);
  }

  const CARDS = [
    // ─── Oshi ───────────────────────────────────────────
    {
      id: "hSD01-001", type: "oshi", name: "Tokino Sora", color: W, life: 5, art: art.W, proxy: true,
      skill: { cost: 1, name: "Replacement", text: "Reattach 1 cheer from your stage to 1 of your holomem.", effect: { t: "moveCheer" } },
      sp: { cost: 2, name: "So, that Makes You My Enemy?", text: "Swap opponent's center with a back holomem. Your white center gets Arts +50 this turn.", effect: { t: "swapOppCenter", bonus: 50, bonusColor: W } },
    },
    {
      id: "hSD01-002", type: "oshi", name: "AZKi", color: G, life: 6, art: art.G, proxy: true,
      skill: { cost: 3, name: "A Map in My Left Hand", text: "Put the top card of your deck into Stage Power.", effect: { t: "holopower", n: 1 } },
      sp: { cost: 3, name: "A Mic in My Right Hand", text: "Send all cheers in your archive to 1 of your green holomem.", effect: { t: "archiveCheersTo", color: G } },
    },
    {
      id: "hSD02-001", type: "oshi", name: "Nakiri Ayame", color: R, life: 5, art: art.R, proxy: true,
      skill: { cost: 2, name: "Red Microphone", text: "Your red center holomem gets Arts +20 this turn.", effect: { t: "artsBonus", n: 20, who: "center" } },
      sp: { cost: 1, name: "Now! Once More!", text: "Return 1 red holomem from your archive to hand.", effect: { t: "returnHolomem", color: R } },
    },
    {
      id: "hSD03-001", type: "oshi", name: "Nekomata Okayu", color: U, life: 5, art: art.U, proxy: true,
      skill: { cost: 2, name: "Blue Microphone", text: "Your blue center holomem gets Arts +20 this turn.", effect: { t: "artsBonus", n: 20, who: "center" } },
      sp: { cost: 1, name: "Strike Back", text: "Deal 50 special damage to an opposing front holomem.", effect: { t: "damage", n: 50, who: "chooseOppFront" } },
    },
    {
      id: "hSD04-001", type: "oshi", name: "Yuzuki Choco", color: P, life: 5, art: art.P, proxy: true,
      skill: { cost: 2, name: "Purple Microphone", text: "Your purple center holomem gets Arts +20 this turn.", effect: { t: "artsBonus", n: 20, who: "center" } },
      sp: { cost: 1, name: "Card Change", text: "Draw 2 cards, then archive 1 card from hand.", effect: { t: "drawDump", n: 2 } },
    },

    // ─── Sora / AZKi line ───────────────────────────────
    holo({ id: "hBP01-021", name: "Tokino Sora", color: W, bloom: "debut", hp: 100, unlimited: true,
      arts: [{ name: "Everyone~ Konsome~", cost: [W], dmg: 30 }] }),
    holo({ id: "hSD01-004", name: "Tokino Sora", color: W, bloom: "debut", hp: 50,
      collabFx: { t: "artsBonus", n: 20, who: "center" },
      collabText: "Collab: Your center holomem gets Arts +20 this turn.",
      arts: [{ name: "On Stage!", cost: ["X"], dmg: 20 }] }),
    holo({ id: "hSD01-005", name: "Tokino Sora", color: W, bloom: "first", hp: 150,
      arts: [
        { name: "Noon Noon Together!", cost: [W], dmg: 30 },
        { name: "Your Heart… Will Turn from Cloudy to Sunny!", cost: [W, "X"], dmg: 50 },
      ] }),
    holo({ id: "hSD01-006", name: "Tokino Sora", color: W, bloom: "first", hp: 240, baton: 2, buzz: true,
      arts: [
        { name: "Dream Live", cost: [W, "X"], dmg: 50 },
        { name: "SorAZ Sympathy", cost: [W, G, "X"], dmg: 60, ifOthers: 50 },
      ] }),
    holo({ id: "hSD01-007", name: "IRyS", color: W, bloom: "debut", hp: 50,
      collabFx: { t: "powerSwap" },
      collabText: "Collab: Take 1 Stage Power into hand, then put 1 card from hand into Stage Power.",
      arts: [{ name: "Embodiment of Hope", cost: [W], dmg: 20 }] }),
    holo({ id: "hBP01-044", name: "AZKi", color: G, bloom: "debut", hp: 100, unlimited: true,
      arts: [{ name: "Konazuki~", cost: ["X"], dmg: 20 }] }),
    holo({ id: "hSD01-009", name: "AZKi", color: G, bloom: "debut", hp: 60,
      collabFx: { t: "dieCheerBack", max: 4 },
      collabText: "Collab: Roll a die. On 4 or less, send the top cheer to a back holomem.",
      arts: [{ name: "And then and then", cost: ["X"], dmg: 10 }] }),
    holo({ id: "hSD01-010", name: "AZKi", color: G, bloom: "first", hp: 160,
      arts: [{ name: "A Journey with No Destination with You", cost: [G, "X"], dmg: 50 }] }),
    holo({ id: "hSD01-011", name: "AZKi", color: G, bloom: "second", hp: 190, baton: 2,
      arts: [
        { name: "SorAZ Gravity", cost: [G], dmg: 60, tokkou: { color: U, dmg: 50 }, ifName: "Tokino Sora", onHit: { t: "attachTopCheer", who: "self" } },
        { name: "Destiny Song", cost: [G, G, "X"], dmg: 100, tokkou: { color: U, dmg: 50 }, dieBonus: true },
      ] }),
    holo({ id: "hSD01-012", name: "Airani Iofifteen", color: G, bloom: "debut", hp: 70,
      collabFx: { t: "attachArchiveCheer", colors: [W, G], who: "center" },
      collabText: "Collab: You may send 1 white or green cheer from your archive to your center.",
      arts: [{ name: "Drawing is so fun!", cost: [G], dmg: 20 }] }),
    holo({ id: "hSD01-013", name: "SorAZ", color: [W, G], bloom: "first", hp: 130, alsoAs: ["Tokino Sora", "AZKi"], art: art.W,
      arts: [{ name: "A Future I Want to Surpass", cost: ["X", "X"], dmg: 50, dieCheerOrDraw: true }] }),
    holo({ id: "hSD01-014", name: "Amane Kanata", color: N, bloom: "spot", hp: 150,
      arts: [{ name: "Hey", cost: [W, G], dmg: 30 }] }),
    holo({ id: "hSD01-015", name: "Hakui Koyori", color: N, bloom: "spot", hp: 50,
      collabFx: { t: "koyori" },
      collabText: "Collab: If center is Tokino Sora, draw 1. If center is AZKi, send the top cheer to center.",
      arts: [{ name: "Pure Pure Pure~", cost: ["X"], dmg: 10 }] }),

    // ─── Ayame line ─────────────────────────────────────
    holo({ id: "hSD02-002", name: "Nakiri Ayame", color: R, bloom: "debut", hp: 90, unlimited: true,
      arts: [{ name: "Kon-Nakiri~", cost: [R], dmg: 30 }] }),
    holo({ id: "hSD02-003", name: "Nakiri Ayame", color: R, bloom: "debut", hp: 70,
      collabFx: { t: "damage", n: 10, who: "oppCollab" },
      collabText: "Collab: Deal 10 special damage to the opponent's collab holomem.",
      arts: [{ name: "Shiranui", cost: ["X"], dmg: 30 }] }),
    holo({ id: "hSD02-004", name: "Nakiri Ayame", color: R, bloom: "debut", hp: 60,
      arts: [{ name: "Dango Tastes So Good", cost: [R], dmg: 30 }] }),
    holo({ id: "hSD02-005", name: "Nakiri Ayame", color: R, bloom: "first", hp: 140,
      arts: [
        { name: "I'm Gonna Sleep~", cost: ["X"], dmg: 20 },
        { name: "OtsuNakiri", cost: [R, "X"], dmg: 60 },
      ] }),
    holo({ id: "hSD02-006", name: "Nakiri Ayame", color: R, bloom: "first", hp: 140,
      bloomFx: { t: "damage", n: 20, who: "chooseOppFront" },
      bloomText: "Bloom: You may deal 20 special damage to an opposing front holomem.",
      arts: [{ name: "Let's Celebrate Together", cost: [R], dmg: 30 }] }),
    holo({ id: "hSD02-007", name: "Nakiri Ayame", color: R, bloom: "first", hp: 120,
      bloomFx: { t: "lookKeep", look: 2, keep: 1 },
      bloomText: "Bloom from Debut: Look at the top 2, keep 1, archive the rest.",
      arts: [{ name: "Don't Look Away when I Shine~~!!", cost: ["X"], dmg: 30 }] }),
    holo({ id: "hSD02-008", name: "Nakiri Ayame", color: R, bloom: "first", hp: 230, buzz: true,
      arts: [
        { name: "Fancy Birthday", cost: [R, "X"], dmg: 40 },
        { name: "I Wonder what's Inside the Present?", cost: [R, R, "X"], dmg: 50, onHit: { t: "damage", n: 50, who: "chooseOppFront" } },
      ] }),
    holo({ id: "hSD02-009", name: "Nakiri Ayame", color: R, bloom: "second", hp: 180,
      arts: [
        { name: "AyaFubuMi's \"Aya\"", cost: [R], dmg: 60, tokkou: { color: Y, dmg: 50 } },
        { name: "Tis I!", cost: [R, R, "X"], dmg: 40, tokkou: { color: Y, dmg: 50 } },
      ] }),
    holo({ id: "hSD02-010", name: "Shirakami Fubuki", color: N, bloom: "spot", hp: 80, tags: ["GAMERS"],
      arts: [{ name: "AyaFubuMi's \"Fubu\"", cost: ["X"], dmg: 20 }] }),

    // ─── Okayu line ─────────────────────────────────────
    holo({ id: "hSD03-002", name: "Nekomata Okayu", color: U, bloom: "debut", hp: 100, unlimited: true, tags: ["GAMERS"],
      arts: [{ name: "Nom Nom Okayu~", cost: ["X"], dmg: 30 }] }),
    holo({ id: "hSD03-003", name: "Nekomata Okayu", color: U, bloom: "debut", hp: 70, tags: ["GAMERS"],
      collabFx: { t: "gamersIntrusion" },
      collabText: "Collab: If your center has #GAMERS, deal 10 to opponent's center and one back.",
      arts: [{ name: "Please Allow me Into Your Home", cost: [U], dmg: 10 }] }),
    holo({ id: "hSD03-004", name: "Nekomata Okayu", color: U, bloom: "debut", hp: 80, tags: ["GAMERS"],
      collabFx: { t: "revealDebutCheer" },
      collabText: "Collab: Reveal the top card. If Debut or Spot, send the top cheer to this holomem.",
      arts: [{ name: "Cat Student", cost: ["X"], dmg: 20 }] }),
    holo({ id: "hSD03-005", name: "Nekomata Okayu", color: U, bloom: "first", hp: 170, tags: ["GAMERS"],
      arts: [
        { name: "Gimme a Hug♡", cost: ["X"], dmg: 30 },
        { name: "Hehehe, a Little Prank", cost: [U, "X"], dmg: 50 },
      ] }),
    holo({ id: "hSD03-006", name: "Nekomata Okayu", color: U, bloom: "first", hp: 140, tags: ["GAMERS"],
      arts: [
        { name: "The Cat That Swallowed the Canary", cost: [U], dmg: 30 },
        { name: "Shaaa", cost: [U, "X"], dmg: 40, onHit: { t: "damage", n: 10, who: "chooseOppFront" } },
      ] }),
    holo({ id: "hSD03-007", name: "Nekomata Okayu", color: U, bloom: "first", hp: 110, tags: ["GAMERS"],
      bloomFx: { t: "attachArchiveCheer", tag: "GAMERS" },
      bloomText: "Bloom: You may send 1 cheer from your archive to a #GAMERS holomem.",
      arts: [{ name: "Singing with My Whole Heart", cost: ["X"], dmg: 20 }] }),
    holo({ id: "hSD03-008", name: "Nekomata Okayu", color: U, bloom: "first", hp: 240, baton: 2, buzz: true, tags: ["GAMERS"],
      arts: [{ name: "The Greatest Nekomata Okayu~", cost: [U, "X"], dmg: 60 }] }),
    holo({ id: "hSD03-009", name: "Nekomata Okayu", color: U, bloom: "second", hp: 190, baton: 2, tags: ["GAMERS"],
      arts: [
        { name: "NOM NOM", cost: [U, "X"], dmg: 60, tokkou: { color: W, dmg: 50 } },
        { name: "Okayu~", cost: [U, U, "X", "X"], dmg: 100, tokkou: { color: W, dmg: 50 } },
      ] }),
    holo({ id: "hSD03-010", name: "Inugami Korone", color: N, bloom: "spot", hp: 70, tags: ["GAMERS"],
      collabFx: { t: "searchMascotFan" },
      collabText: "Collab: If center is Nekomata Okayu, search a mascot or fan.",
      arts: [{ name: "Ere ya Go~", cost: ["X"], dmg: 30 }] }),
    holo({ id: "hSD03-011", name: "La+ Darknesss", color: N, bloom: "spot", hp: 60,
      arts: [
        { name: "Dorobo Construction's Minister of Agriculture", cost: ["X"], dmg: 10 },
        { name: "I'll Definitely Make You Eat It", cost: ["X", "X"], dmg: 20, onHit: { t: "drawUntil", n: 3 } },
      ] }),

    // ─── Choco line ─────────────────────────────────────
    holo({ id: "hSD04-002", name: "Yuzuki Choco", color: P, bloom: "debut", hp: 100, unlimited: true, tags: ["Cooking"],
      arts: [{ name: "Nurse of the Underworld", cost: ["X"], dmg: 30 }] }),
    holo({ id: "hSD04-003", name: "Yuzuki Choco", color: P, bloom: "debut", hp: 60, tags: ["Cooking"],
      collabFx: { t: "drawIfOshi", color: P },
      collabText: "Collab: If your Oshi is purple, draw 1.",
      arts: [{ name: "My Cute Students~", cost: [P, "X"], dmg: 30 }] }),
    holo({ id: "hSD04-004", name: "Yuzuki Choco", color: P, bloom: "debut", hp: 60, tags: ["Cooking"],
      collabFx: { t: "searchFood" },
      collabText: "Collab: You may archive 1 from hand to search a #Food event.",
      arts: [{ name: "Eat a Lot, Okay♡", cost: [P], dmg: 20 }] }),
    holo({ id: "hSD04-005", name: "Yuzuki Choco", color: P, bloom: "first", hp: 140, tags: ["Cooking"],
      arts: [
        { name: "Good Workolate……", cost: [P], dmg: 20 },
        { name: "Nom~ (Mwah)", cost: [P, "X"], dmg: 40 },
      ] }),
    holo({ id: "hSD04-006", name: "Yuzuki Choco", color: P, bloom: "first", hp: 130, tags: ["Cooking"],
      arts: [{ name: "Forbidden Kiss", cost: [P, "X"], dmg: 30, onHit: { t: "heal", n: 30, who: "self" } }] }),
    holo({ id: "hSD04-007", name: "Yuzuki Choco", color: P, bloom: "first", hp: 110, tags: ["Cooking"],
      bloomFx: { t: "returnEvent" },
      bloomText: "Bloom: You may return 1 non-LIMITED event from your archive to hand.",
      arts: [{ name: "I Love You! Mwah♡", cost: ["X", "X"], dmg: 30, onHit: { t: "heal", n: 20, who: "back" } }] }),
    holo({ id: "hSD04-008", name: "Yuzuki Choco", color: P, bloom: "first", hp: 230, buzz: true, tags: ["Cooking"],
      arts: [
        { name: "I Worked Hard to Make This", cost: [P, "X"], dmg: 40 },
        { name: "Bon Appétit", cost: [P, P, "X"], dmg: 60, ifFood: 20 },
      ] }),
    holo({ id: "hSD04-009", name: "Yuzuki Choco", color: P, bloom: "second", hp: 190, tags: ["Cooking"],
      arts: [
        { name: "33… 22… 11…", cost: [P, "X"], dmg: 50, tokkou: { color: G, dmg: 50 } },
        { name: "Act-", cost: [P, P, "X"], dmg: 60, tokkou: { color: G, dmg: 50 }, ifEvents: 40 },
      ] }),
    holo({ id: "hSD04-010", name: "Oozora Subaru", color: N, bloom: "spot", hp: 60,
      collabFx: { t: "subaru" },
      collabText: "Collab: If center is Yuzuki Choco, send 1 archive cheer to a holomem.",
      arts: [{ name: "I'll Make You Draw the Hell Lottery", cost: ["X", "X"], dmg: 20 }] }),
    holo({ id: "hSD04-011", name: "Himemori Luna", color: N, bloom: "spot", hp: 60,
      collabFx: { t: "powerSwap" },
      collabText: "Collab: Swap 1 Stage Power with 1 card from hand.",
      arts: [{ name: "Nna~~~~~~~~", cost: ["X"], dmg: 10 }] }),

    // ─── Summer hologram / Quintet extras ───────────────
    holo({ id: "hBP02-033", name: "Houshou Marine", color: R, bloom: "second", hp: 200, tags: ["Sea"],
      arts: [{ name: "You Guys~? Isn't Your Captain Cute?", cost: [R, R], dmg: 80 }] }),
    holo({ id: "hBP02-027", name: "Ookami Mio", color: G, bloom: "first", hp: 240, buzz: true, tags: ["GAMERS"],
      arts: [{ name: "Tarot's Guidance", cost: [G, "X"], dmg: 60 }] }),
    holo({ id: "hBP02-022", name: "Pavolia Reine", color: G, bloom: "first", hp: 130,
      arts: [{ name: "Spicy Night", cost: [G, "X"], dmg: 40, ifColors: 2 }] }),

    // ─── Support ────────────────────────────────────────
    { id: "hSD01-016", type: "support", name: "Harusaki Nodoka", limited: true, icon: "draw",
      text: "Draw 3 cards.", effect: { t: "draw", n: 3 } },
    { id: "hSD01-017", type: "support", name: "Manager-chan", limited: true, icon: "look",
      text: "If you have another card in hand: shuffle your hand into the deck, then draw 5.",
      effect: { t: "reload5" } },
    { id: "hSD01-018", type: "support", name: "Sub PC", limited: false, icon: "search",
      text: "Look at the top 5. Add 1 LIMITED support. Put the rest on the bottom.",
      effect: { t: "lookKeepLimited", look: 5 } },
    { id: "hSD01-019", type: "support", name: "Amazing PC", limited: true, icon: "search",
      text: "Archive 1 cheer from your stage. Search your deck for a non-Buzz 1st or 2nd holomem.",
      effect: { t: "searchBloom" } },
    { id: "hSD01-020", type: "support", name: "Circle of hololive Listeners", limited: false, icon: "cheer",
      text: "Roll a die. On 3 or greater, send 1 cheer from your archive to a holomem.",
      effect: { t: "dieCheer", min: 3 } },
    { id: "hSD01-021", type: "support", name: "First Gravity", limited: true, icon: "search",
      text: "If you have 6 or fewer other cards in hand: look at the top 4. Add any Tokino Sora / AZKi.",
      effect: { t: "scoopNames", look: 4, names: ["Tokino Sora", "AZKi"], maxHandExcl: 6 } },
    { id: "hBP01-104", type: "support", name: "Normal PC", limited: false, icon: "search",
      text: "Reveal 1 Debut holomem from your deck and place it on stage. Shuffle.",
      effect: { t: "placeDebut" } },
    { id: "hBP01-108", type: "support", name: "So, That Makes You My Enemy", limited: true, icon: "swap",
      text: "Swap your opponent's center holomem with 1 back holomem.",
      effect: { t: "swapOppCenter" } },
    { id: "hSD02-012", type: "support", name: "Irohanihohetto AyaFubuMi", limited: true, icon: "search", event: true,
      text: "If you have 6 or fewer other cards in hand: look at the top 4. Add Ayame / Fubuki / Mio.",
      effect: { t: "scoopNames", look: 4, names: ["Nakiri Ayame", "Shirakami Fubuki", "Ookami Mio"], maxHandExcl: 6 } },
    { id: "hSD03-012", type: "support", name: "Dorobo Construction", limited: true, icon: "search", event: true,
      text: "If you have 6 or fewer other cards in hand: look at the top 4. Add Okayu / Lui / Mio / Fubuki / La+ / Korone.",
      effect: { t: "scoopNames", look: 4, names: ["Nekomata Okayu", "Takane Lui", "Ookami Mio", "Shirakami Fubuki", "La+ Darknesss", "Inugami Korone"], maxHandExcl: 6 } },
    { id: "hSD03-013", type: "support", name: "Oka-nyan", limited: false, icon: "heal", mascot: true,
      text: "Give one of your holomem +10 HP (proxy: attach as a +10 HP bonus).",
      effect: { t: "hpBonus", n: 10, who: "chooseYours" } },
    { id: "hSD03-014", type: "support", name: "Onigiryaa", limited: false, icon: "heal", fan: true,
      text: "Give a Nekomata Okayu +10 HP.",
      effect: { t: "hpBonus", n: 10, who: "chooseYours", name: "Nekomata Okayu" } },
    { id: "hBP01-105", type: "support", name: "Penlight", limited: true, icon: "cheer",
      text: "Archive 1 Stage Power. Send 1 cheer of a color matching one of your holomem.",
      effect: { t: "penlight" } },
    { id: "hSD04-012", type: "support", name: "SubaChocoLuna", limited: true, icon: "search", event: true,
      text: "If you have 6 or fewer other cards in hand: look at the top 4. Add Subaru / Choco / Luna.",
      effect: { t: "scoopNames", look: 4, names: ["Oozora Subaru", "Yuzuki Choco", "Himemori Luna"], maxHandExcl: 6 } },
    { id: "hSD04-013", type: "support", name: "Choco's Omurice", limited: false, icon: "heal", event: true, food: true,
      text: "Heal 20 to one holomem. If you have a #Cooking holomem, that holomem also gets Arts +20 this turn.",
      effect: { t: "omurice" } },
    { id: "hSD04-014", type: "support", name: "Chocolat", limited: false, icon: "heal", mascot: true,
      text: "Give one of your holomem +20 HP.",
      effect: { t: "hpBonus", n: 20, who: "chooseYours" } },
    { id: "hBP01-106", type: "support", name: "I leave the rest to you!", limited: false, icon: "swap", event: true,
      text: "Swap your center holomem with 1 active back holomem.",
      effect: { t: "freeBaton" } },

    // ─── Cheer ──────────────────────────────────────────
    { id: "cheer-w", type: "cheer", name: "White Cheer", color: W },
    { id: "cheer-r", type: "cheer", name: "Red Cheer", color: R },
    { id: "cheer-u", type: "cheer", name: "Blue Cheer", color: U },
    { id: "cheer-g", type: "cheer", name: "Green Cheer", color: G },
    { id: "cheer-p", type: "cheer", name: "Purple Cheer", color: P },
    { id: "cheer-y", type: "cheer", name: "Yellow Cheer", color: Y },
  ];

  const BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

  function repeat(id, n) {
    return Array.from({ length: n }, () => id);
  }

  const STARTERS = {
    sora: {
      id: "sora",
      name: "Start Deck: Tokino Sora",
      blurb: "EN hSD01 proxy. White/green bloom, Buzz Sora, SorAZ.",
      oshi: "hSD01-001",
      color: W,
      main: [
        ...repeat("hBP01-021", 4), ...repeat("hBP01-044", 4),
        ...repeat("hSD01-004", 3), ...repeat("hSD01-005", 3),
        ...repeat("hSD01-009", 3), ...repeat("hSD01-010", 3),
        ...repeat("hSD01-006", 2), ...repeat("hSD01-007", 2),
        ...repeat("hSD01-011", 2), ...repeat("hSD01-012", 2),
        ...repeat("hSD01-013", 2), ...repeat("hSD01-014", 2),
        ...repeat("hSD01-015", 2),
        ...repeat("hSD01-016", 3), ...repeat("hSD01-017", 3),
        ...repeat("hSD01-018", 2), ...repeat("hSD01-019", 2),
        ...repeat("hSD01-020", 2), ...repeat("hSD01-021", 2),
        ...repeat("hBP01-104", 2),
      ],
      cheer: [...repeat("cheer-w", 10), ...repeat("cheer-g", 10)],
    },
    ayame: {
      id: "ayame",
      name: "Start Deck: Nakiri Ayame",
      blurb: "EN hSD02 proxy. Red aggro, Buzz Ayame, Fubuki spot.",
      oshi: "hSD02-001",
      color: R,
      main: [
        ...repeat("hSD02-002", 8), ...repeat("hSD02-003", 4), ...repeat("hSD02-004", 3),
        ...repeat("hSD02-005", 4), ...repeat("hSD02-006", 3), ...repeat("hSD02-007", 2),
        ...repeat("hSD02-008", 2), ...repeat("hSD02-009", 2), ...repeat("hSD02-010", 2),
        ...repeat("hSD01-016", 4), ...repeat("hSD01-017", 4), ...repeat("hBP01-104", 3),
        ...repeat("hBP01-108", 3), ...repeat("hSD02-012", 2), ...repeat("hSD01-018", 2),
        ...repeat("hSD01-020", 2),
      ],
      cheer: [...repeat("cheer-r", 20)],
    },
    okayu: {
      id: "okayu",
      name: "Start Deck: Nekomata Okayu",
      blurb: "EN hSD03 proxy. Blue GAMERS, Buzz Okayu, Korone & La+.",
      oshi: "hSD03-001",
      color: U,
      main: [
        ...repeat("hSD03-002", 8), ...repeat("hSD03-003", 3), ...repeat("hSD03-004", 3),
        ...repeat("hSD03-005", 4), ...repeat("hSD03-006", 3), ...repeat("hSD03-007", 2),
        ...repeat("hSD03-008", 2), ...repeat("hSD03-009", 2),
        ...repeat("hSD03-010", 2), ...repeat("hSD03-011", 1),
        ...repeat("hSD01-016", 4), ...repeat("hSD01-017", 4), ...repeat("hSD01-019", 3),
        ...repeat("hBP01-108", 2), ...repeat("hSD03-012", 2), ...repeat("hBP01-105", 2),
        ...repeat("hSD03-014", 2), ...repeat("hSD03-013", 1),
      ],
      cheer: [...repeat("cheer-u", 20)],
    },
    choco: {
      id: "choco",
      name: "Start Deck: Yuzuki Choco",
      blurb: "EN hSD04 proxy. Purple cooking, Buzz Choco, Subaru & Luna.",
      oshi: "hSD04-001",
      color: P,
      main: [
        ...repeat("hSD04-002", 8), ...repeat("hSD04-003", 3), ...repeat("hSD04-004", 3),
        ...repeat("hSD04-005", 4), ...repeat("hSD04-006", 3), ...repeat("hSD04-007", 2),
        ...repeat("hSD04-008", 2), ...repeat("hSD04-009", 2),
        ...repeat("hSD04-010", 2), ...repeat("hSD04-011", 1),
        ...repeat("hSD01-016", 4), ...repeat("hSD01-017", 4), ...repeat("hSD01-019", 3),
        ...repeat("hBP01-104", 2), ...repeat("hSD04-012", 2), ...repeat("hSD04-013", 2),
        ...repeat("hBP01-106", 2), ...repeat("hSD04-014", 1),
      ],
      cheer: [...repeat("cheer-p", 20)],
    },
  };

  function namesOf(c) {
    if (!c) return [];
    return [c.name].concat(c.alsoAs || []);
  }

  function colorsOf(c) {
    if (!c) return [];
    if (Array.isArray(c.color)) return c.color;
    if (!c.color || c.color === N) return [];
    return [c.color];
  }

  function validateDeck(deck) {
    const errs = [];
    if (!deck || !BY_ID[deck.oshi] || BY_ID[deck.oshi].type !== "oshi") errs.push("Choose an Oshi.");
    if (!deck.main || deck.main.length !== 50) errs.push("Main deck must be 50 cards.");
    if (!deck.cheer || deck.cheer.length !== 20) errs.push("Cheer deck must be 20 cards.");
    const counts = {};
    (deck.main || []).forEach((id) => {
      const c = BY_ID[id];
      if (!c) errs.push("Unknown card " + id);
      else if (c.type === "oshi" || c.type === "cheer") errs.push(c.name + " cannot go in the main deck.");
      counts[id] = (counts[id] || 0) + 1;
    });
    Object.entries(counts).forEach(([id, n]) => {
      const c = BY_ID[id];
      if (c && !c.unlimited && n > 4) errs.push(c.name + " (" + id + ") exceeds 4 copies.");
    });
    (deck.cheer || []).forEach((id) => {
      const c = BY_ID[id];
      if (!c || c.type !== "cheer") errs.push("Cheer deck can only hold cheer cards.");
    });
    return { ok: errs.length === 0, errors: [...new Set(errs)] };
  }

  const COLORS = {
    W: { name: "White", hex: "#f4f0ff", ink: "#8a7cff" },
    R: { name: "Red", hex: "#ff6b6b", ink: "#ff4d4d" },
    U: { name: "Blue", hex: "#5ec8ff", ink: "#3da9fc" },
    G: { name: "Green", hex: "#5ee0a0", ink: "#3dd68c" },
    P: { name: "Purple", hex: "#c084fc", ink: "#b56bff" },
    Y: { name: "Yellow", hex: "#ffd166", ink: "#f0c36a" },
    N: { name: "Colorless", hex: "#c5cde0", ink: "#8b97ad" },
  };

  const BLOOM_LABEL = { debut: "Debut", first: "1st", second: "2nd", spot: "Spot" };

  g.HOLO = g.HOLO || {};
  g.HOLO.CARDS = CARDS;
  g.HOLO.BY_ID = BY_ID;
  g.HOLO.STARTERS = STARTERS;
  g.HOLO.COLORS = COLORS;
  g.HOLO.BLOOM_LABEL = BLOOM_LABEL;
  g.HOLO.validateDeck = validateDeck;
  g.HOLO.card = (id) => BY_ID[id];
  g.HOLO.namesOf = namesOf;
  g.HOLO.colorsOf = colorsOf;
})(typeof globalThis !== "undefined" ? globalThis : this);
