[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/nguyentran113/best-spot-the-difference-game/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/nguyentran113/best-spot-the-difference-game/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

# Twin Peeks — Spot the Difference

A complete, original spot-the-difference game that runs offline in a desktop
browser from static files. Two near-identical pictures sit side by side; the
player clicks the differences hidden in the right picture. Every found
difference gets a green ring and a checkmark on both panels, a big counter
shows how many are left, and the hunt ends in a win screen with stars.

## How to play

- **Click** a difference on the right picture (or the same spot on the left).
  A wrong click costs 10 points.
- **H** — hint (3 per level, rings the next unfound difference).
- **R** — restart the current level. **1 / 2 / 3** — jump to a scene.
- **M** — mute the synthesized sound effects. **Esc** — back to the menu.

## Scenes

Three hand-drawn Canvas 2D scenes, 7 differences each, rising difficulty:

1. **Sunny Garden** (Easy) — cottage, apple tree, flower bed.
2. **Cozy Kitchen** (Medium) — teapot, wall clock, a cat asleep on a chair.
3. **Night Camp** (Tricky) — moon, tent, campfire under the stars.

Beat the 2:00 par time per level for a time bonus; unused hints add points.

## Run it

```sh
node serve.ts            # serves game/ on http://localhost:8080
```

Hand it in with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` with `vendor/makefun-game.ts`.
- `game/index.html` + `game/styles.css` — page shell.
- `game/src/main.js` — entry point: wires input and the `?shot=` states.
- `game/src/game.js` — game state, HUD, screens, input, rendering.
- `game/src/scenes.js` — the three scenes: procedural Canvas 2D art and the
  7 differences of each scene.
- `game/src/audio.js` — synthesized Web Audio sound effects (no audio files).
- `shots.json` — the three screenshot states: start, mid-hunt, win.

No network requests, no libraries, no outside assets — every picture is drawn
in code and every sound is synthesized.
