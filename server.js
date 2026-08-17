const path = require("path");
const http = require("http");
const express = require("express");
const { WebSocketServer } = require("ws");

require("./public/js/cards.js");
require("./public/js/engine.js");

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

const rooms = new Map();
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function code() {
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  return rooms.has(s) ? code() : s;
}

function send(ws, msg) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function publicRoom(room) {
  return {
    code: room.code,
    players: room.seats.map((s) => (s ? { name: s.name, ready: !!s.deck } : null)),
  };
}

function startIfReady(room) {
  if (!room.seats[0] || !room.seats[1] || !room.seats[0].deck || !room.seats[1].deck) return;
  if (room.game) return;
  const v0 = HOLO.validateDeck(room.seats[0].deck);
  const v1 = HOLO.validateDeck(room.seats[1].deck);
  if (!v0.ok || !v1.ok) return;
  const first = Math.random() < 0.5 ? 0 : 1;
  room.game = HOLO.createGame({
    p0: { ...room.seats[0].deck, name: room.seats[0].name },
    p1: { ...room.seats[1].deck, name: room.seats[1].name },
    first,
    seed: Date.now() % 1e9,
  });
  broadcastState(room);
}

function broadcastState(room) {
  room.seats.forEach((seat, i) => {
    if (!seat) return;
    send(seat.ws, { t: "state", room: publicRoom(room), view: HOLO.getView(room.game, i) });
  });
}

function handle(ws, msg) {
  if (msg.t === "hello") {
    ws.meta.name = String(msg.name || "Producer").slice(0, 24);
    send(ws, { t: "hello", name: ws.meta.name });
    return;
  }
  if (msg.t === "create") {
    const id = code();
    const room = { code: id, seats: [null, null], game: null };
    rooms.set(id, room);
    ws.meta.room = id;
    ws.meta.seat = 0;
    room.seats[0] = { ws, name: ws.meta.name, deck: msg.deck || null };
    send(ws, { t: "room", room: publicRoom(room), seat: 0 });
    return;
  }
  if (msg.t === "join") {
    const room = rooms.get(String(msg.code || "").toUpperCase());
    if (!room) return send(ws, { t: "err", msg: "Room not found." });
    const seat = room.seats[0] ? (room.seats[1] ? -1 : 1) : 0;
    if (seat < 0) return send(ws, { t: "err", msg: "Room is full." });
    ws.meta.room = room.code;
    ws.meta.seat = seat;
    room.seats[seat] = { ws, name: ws.meta.name, deck: msg.deck || null };
    room.seats.forEach((s, i) => s && send(s.ws, { t: "room", room: publicRoom(room), seat: i }));
    startIfReady(room);
    return;
  }
  if (msg.t === "deck") {
    const room = rooms.get(ws.meta.room);
    if (!room || room.game) return;
    const seat = room.seats[ws.meta.seat];
    if (!seat) return;
    const v = HOLO.validateDeck(msg.deck);
    if (!v.ok) return send(ws, { t: "err", msg: v.errors.join(" ") });
    seat.deck = msg.deck;
    room.seats.forEach((s, i) => s && send(s.ws, { t: "room", room: publicRoom(room), seat: i }));
    startIfReady(room);
    return;
  }
  if (msg.t === "act") {
    const room = rooms.get(ws.meta.room);
    if (!room || !room.game) return;
    const r = HOLO.applyAction(room.game, ws.meta.seat, msg.action);
    if (!r.ok) return send(ws, { t: "err", msg: r.error });
    broadcastState(room);
    return;
  }
  if (msg.t === "chat") {
    const room = rooms.get(ws.meta.room);
    if (!room) return;
    room.seats.forEach((s) => s && send(s.ws, { t: "chat", from: ws.meta.name, msg: String(msg.msg || "").slice(0, 200) }));
  }
}

wss.on("connection", (ws) => {
  ws.meta = { name: "Producer", room: null, seat: null };
  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    try {
      handle(ws, msg);
    } catch (e) {
      send(ws, { t: "err", msg: "Server error." });
      console.error(e);
    }
  });
  ws.on("close", () => {
    const room = rooms.get(ws.meta.room);
    if (!room) return;
    const seat = room.seats[ws.meta.seat];
    if (seat && seat.ws === ws) room.seats[ws.meta.seat] = null;
    if (!room.seats[0] && !room.seats[1]) rooms.delete(room.code);
    else room.seats.forEach((s, i) => s && send(s.ws, { t: "room", room: publicRoom(room), seat: i, left: true }));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("LUMINA TCG  →  http://localhost:" + PORT);
});
