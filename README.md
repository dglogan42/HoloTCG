# HoloTCG (LUMINA)

Unofficial browser client for **hololive OFFICIAL CARD GAME** rules. Play vs CPU or another producer on the same network.

Cards use **official EN names and public stats** with **original proxy art**. No COVER illustrations, logos, or product scans are bundled.

This is a fan project. It is **not affiliated with COVER Corp., hololive production, or Bushiroad**.

## Run

```bash
npm install
npm start
```

On Windows PowerShell, if `npm` is blocked by execution policy:

```bash
npm.cmd install
npm.cmd start
```

Open [http://localhost:3000](http://localhost:3000).

| Action | What it does |
|---|---|
| **Play vs CPU** | Local match against the built-in opponent |
| **Create room** | Host an online game and share the 4-letter code |
| **Join** | Second browser, same code, same server |
| **Deck** | Rebuild any legal 1 Oshi + 50 main + 20 cheer list |
| **Gallery** | Browse the proxy card pool |

```bash
npm run sim
```

Runs seeded CPU vs CPU games to smoke-test the rules engine.

## Android APK (Gradle)

Wraps the same client in a WebView. CPU play works offline. Online rooms still need a running `npm start` host.

```bash
cd android
gradlew.bat assembleDebug
```

APK output:

`android/app/build/outputs/apk/debug/app-debug.apk`

Requires JDK 17 and the Android SDK (`ANDROID_HOME`). The first build downloads the Gradle wrapper distribution.

## Start decks (proxies)

| Deck | Color | Notes |
|---|---|---|
| Tokino Sora (hSD01) | White / Green | EN start-deck list, Buzz Sora, SorAZ |
| Nakiri Ayame (hSD02) | Red | Ayame bloom line, Fubuki spot |
| Nekomata Okayu (hSD03) | Blue | GAMERS line, Buzz Okayu, Korone / La+ |
| Yuzuki Choco (hSD04) | Purple | Cooking line, Buzz Choco, Subaru / Luna |

Each list is 1 Oshi + 50 main + 20 cheer.

## Rules (short)

Turn: **Reset → Draw → Cheer → Main → Performance**.

- Center and Collab perform Arts if they have the required cheer colors.
- Bloom: same name, Debut → 1st → 2nd. Not the turn they entered. Not your first turn. Spot cannot bloom.
- Collab: move an active back holomem into Collab; top of deck goes to Stage Power.
- First player skips Bloom, Limited support, and Performance on turn 1.
- Down a holomem → lose 1 life (Buzz: 2). Revealed life cheer auto-attaches.
- Win: opponent has 0 life, no holomem on stage, or cannot draw.

Official manuals and the licensed paper game live on [en.hololive-official-cardgame.com](https://en.hololive-official-cardgame.com/).

## Project layout

```
server.js            Express + WebSocket host
public/              Client (HTML / CSS / JS)
public/js/cards.js   Proxy card pool and start decks
public/js/engine.js  Rules engine
public/js/ai.js      CPU opponent
public/js/app.js     Lobby, deck workshop, match UI
scripts/sim.js       Headless AI vs AI smoke test
```

## License

Code and original assets are under the [MIT License](LICENSE). Third-party names and game terminology remain with their owners. Do not commit official card art or the saved official website dump.
