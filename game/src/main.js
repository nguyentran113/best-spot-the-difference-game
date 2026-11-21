// Twin Peeks — entry point. Wires the canvas, keyboard and mouse to the game
// and honours the screenshot query: ?shot=start|play|end&seed=1 renders a
// fixed game state so screenshots are deterministic.

import { SpotDifferenceGame } from './game.js';

const canvas = document.getElementById('game');
const game = new SpotDifferenceGame(canvas);
window.__game = game;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot === 'start' || shot === 'play' || shot === 'end') {
  game.applyShot(shot);
}

canvas.addEventListener('click', (event) => game.handleClick(event));
canvas.addEventListener('mousemove', (event) => {
  game.hover = game.toCanvasCoords(event);
});
window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  game.handleKey(event);
});

game.run();
