// Twin Peeks — game state, input and rendering. One canvas (1280x720) holds
// everything: the start screen, the two picture panels, the HUD, the level
// clear card and the win screen. The game is fully deterministic for a given
// query: ?shot=start|play|end&seed=1 renders a fixed state for screenshots.

import { SCENES, PANEL_W, PANEL_H, drawScenePanel } from './scenes.js';
import {
  ensureAudio, isMuted, toggleMuted,
  playUiClick, playFound, playWrong, playHint, playLevelComplete, playWinFanfare,
} from './audio.js';

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const DIFFERENCES_PER_LEVEL = 7;
export const HINTS_PER_LEVEL = 3;
export const PAR_TIME_SECONDS = 120;

const LEFT_PANEL = { x: 40, y: 104 };
const RIGHT_PANEL = { x: 680, y: 104 };
const PANEL_LABEL_Y = 90;
const TOP_BAR_H = 84;
const BOTTOM_BAR_Y = 656;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function makeOffscreenPanel(scene, found) {
  const c = document.createElement('canvas');
  c.width = PANEL_W;
  c.height = PANEL_H;
  drawScenePanel(c.getContext('2d'), scene, found);
  return c;
}

export class SpotDifferenceGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.screen = 'start';
    this.levelIndex = 0;
    this.found = new Set();
    this.score = 0;
    this.totalTime = 0;
    this.levelElapsed = 0;
    this.levelStartStamp = 0;
    this.hintsLeft = HINTS_PER_LEVEL;
    this.wrongClicks = 0;
    this.stars = [0, 0, 0];
    this.particles = [];
    this.wrongMarks = [];
    this.hintTarget = -1;
    this.hintUntil = 0;
    this.message = '';
    this.messageUntil = 0;
    this.shakeUntil = 0;
    this.shotMode = null;
    this.leftPanelCanvas = null;
    this.rightPanelCanvas = null;
    this.lastFrame = performance.now();
    this.hover = { x: -1, y: -1 };
    this.loadLevel(0);
  }

  scene() {
    return SCENES[this.levelIndex];
  }

  remaining() {
    return DIFFERENCES_PER_LEVEL - this.found.size;
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.found = new Set();
    this.hintsLeft = HINTS_PER_LEVEL;
    this.levelElapsed = 0;
    this.levelStartStamp = performance.now();
    this.hintTarget = -1;
    this.particles = [];
    this.wrongMarks = [];
    const all = new Set(SCENES[index].differences.map((_, i) => i));
    this.leftPanelCanvas = makeOffscreenPanel(SCENES[index], new Set());
    this.rightPanelCanvas = makeOffscreenPanel(SCENES[index], all);
  }

  startGame(levelIndex = 0) {
    ensureAudio();
    this.score = 0;
    this.totalTime = 0;
    this.wrongClicks = 0;
    this.stars = [0, 0, 0];
    this.loadLevel(levelIndex);
    this.screen = 'play';
    this.showMessage(`Find all ${DIFFERENCES_PER_LEVEL} differences!`, 2600);
  }

  restartLevel() {
    this.loadLevel(this.levelIndex);
    this.screen = 'play';
    this.showMessage(`${this.scene().name} — start over`, 1800);
  }

  showMessage(text, ms) {
    this.message = text;
    this.messageUntil = performance.now() + ms;
  }

  // Fixed states for screenshots: ?shot=start shows the title, ?shot=play a
  // mid-hunt board (3 of 7 found, 4 left), ?shot=end the win screen.
  applyShot(shot) {
    this.shotMode = shot;
    if (shot === 'start') {
      this.screen = 'start';
    } else if (shot === 'play') {
      this.loadLevel(0);
      this.screen = 'play';
      this.found = new Set([0, 1, 2]);
      this.score = 300;
      this.levelElapsed = 47;
      this.levelStartStamp = performance.now();
      this.showMessage('Nice! 3 found — 4 to go', 60000);
    } else if (shot === 'end') {
      this.screen = 'win';
      this.score = 2450;
      this.totalTime = 252;
      this.stars = [3, 2, 3];
    }
  }

  useHint() {
    if (this.screen !== 'play' || this.hintsLeft <= 0) return;
    const unfound = this.scene().differences
      .map((_, i) => i)
      .filter((i) => !this.found.has(i));
    if (unfound.length === 0) return;
    this.hintsLeft -= 1;
    this.hintTarget = unfound[0];
    this.hintUntil = performance.now() + 2600;
    playHint();
    this.showMessage(`Hint: look near "${this.scene().differences[this.hintTarget].name}"`, 2600);
  }

  markFound(index) {
    const diff = this.scene().differences[index];
    this.found.add(index);
    this.score += 100;
    playFound();
    this.spawnParticles(diff);
    this.showMessage(`Found it! ${diff.name}`, 1600);
    if (this.found.size === DIFFERENCES_PER_LEVEL) {
      this.completeLevel();
    }
  }

  completeLevel() {
    const seconds = this.levelElapsed;
    const timeBonus = Math.max(0, PAR_TIME_SECONDS - Math.floor(seconds)) * 2;
    const hintBonus = this.hintsLeft * 25;
    this.score += timeBonus + hintBonus;
    this.totalTime += seconds;
    this.stars[this.levelIndex] = seconds <= 60 ? 3 : seconds <= PAR_TIME_SECONDS ? 2 : 1;
    this.hintTarget = -1;
    if (this.levelIndex === SCENES.length - 1) {
      this.screen = 'win';
      playWinFanfare();
    } else {
      this.screen = 'levelDone';
      playLevelComplete();
    }
  }

  nextLevel() {
    this.loadLevel(this.levelIndex + 1);
    this.screen = 'play';
    this.showMessage(`${this.scene().name} — find ${DIFFERENCES_PER_LEVEL} differences!`, 2600);
  }

  spawnParticles(diff) {
    for (const panel of [LEFT_PANEL, RIGHT_PANEL]) {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 40 + Math.random() * 90;
        this.particles.push({
          x: panel.x + diff.x,
          y: panel.y + diff.y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed - 30,
          life: 0.7 + Math.random() * 0.4,
          age: 0,
          color: ['#ffd93b', '#ff6b9d', '#57b957', '#5aa9e6'][i % 4],
          size: 3 + Math.random() * 4,
        });
      }
    }
  }

  // --- input ---------------------------------------------------------------
  toCanvasCoords(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }

  panelAt(x, y) {
    for (const [panel, side] of [[LEFT_PANEL, 'left'], [RIGHT_PANEL, 'right']]) {
      if (x >= panel.x && x <= panel.x + PANEL_W && y >= panel.y && y <= panel.y + PANEL_H) {
        return { side, px: x - panel.x, py: y - panel.y };
      }
    }
    return null;
  }

  bottomButtons() {
    const y = BOTTOM_BAR_Y + 12;
    const h = 40;
    return [
      { id: 'hint', label: `Hint  (${this.hintsLeft} left)  [H]`, x: 40, y, w: 210, h },
      { id: 'restart', label: 'Restart  [R]', x: 262, y, w: 150, h },
      { id: 'level1', label: 'Level 1', x: 424, y, w: 110, h },
      { id: 'level2', label: 'Level 2', x: 544, y, w: 110, h },
      { id: 'level3', label: 'Level 3', x: 664, y, w: 110, h },
      { id: 'sound', label: isMuted() ? 'Sound: OFF  [M]' : 'Sound: ON  [M]', x: 786, y, w: 170, h },
      { id: 'menu', label: 'Menu  [Esc]', x: 968, y, w: 130, h },
      { id: 'help', label: '?  How to play', x: 1110, y, w: 130, h },
    ];
  }

  handleClick(event) {
    ensureAudio();
    const { x, y } = this.toCanvasCoords(event);
    if (this.screen === 'start') {
      if (y > 470 && y < 540) {
        if (x > 490 && x < 790) { this.startGame(0); playUiClick(); return; }
      }
      if (y > 560 && y < 610) {
        const picks = [[0, 435, 565], [1, 575, 705], [2, 715, 845]];
        for (const [level, x0, x1] of picks) {
          if (x >= x0 && x <= x1) { this.startGame(level); playUiClick(); return; }
        }
      }
      return;
    }
    if (this.screen === 'levelDone') {
      if (x > 490 && x < 790 && y > 470 && y < 530) { this.nextLevel(); playUiClick(); }
      return;
    }
    if (this.screen === 'win') {
      if (x > 490 && x < 790 && y > 540 && y < 600) { this.startGame(0); playUiClick(); }
      return;
    }
    if (this.screen !== 'play') return;

    for (const button of this.bottomButtons()) {
      if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
        if (button.id === 'hint') this.useHint();
        else if (button.id === 'restart') { this.restartLevel(); playUiClick(); }
        else if (button.id.startsWith('level')) { this.startGame(Number(button.id.slice(5)) - 1); playUiClick(); }
        else if (button.id === 'sound') { toggleMuted(); playUiClick(); }
        else if (button.id === 'menu') { this.screen = 'start'; playUiClick(); }
        else if (button.id === 'help') { this.showMessage('Click a difference on the RIGHT picture. H = hint, R = restart.', 4000); playUiClick(); }
        return;
      }
    }

    const hit = this.panelAt(x, y);
    if (!hit) return;
    const scene = this.scene();
    let best = -1;
    let bestDist = Infinity;
    scene.differences.forEach((diff, i) => {
      if (this.found.has(i)) return;
      const d = Math.hypot(hit.px - diff.x, hit.py - diff.y);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    if (best >= 0 && bestDist <= scene.differences[best].r + 10) {
      this.markFound(best);
    } else {
      this.wrongClicks += 1;
      this.score = Math.max(0, this.score - 10);
      this.wrongMarks.push({ x, y, until: performance.now() + 900 });
      this.shakeUntil = performance.now() + 180;
      playWrong();
      this.showMessage('Not a difference — minus 10 points', 1400);
    }
  }

  handleKey(event) {
    const key = event.key.toLowerCase();
    if (this.screen === 'start' && (key === 'enter' || key === ' ')) {
      this.startGame(0);
      return;
    }
    if (key === 'h') this.useHint();
    else if (key === 'r' && this.screen === 'play') this.restartLevel();
    else if (key === 'm') toggleMuted();
    else if (key === 'escape') this.screen = 'start';
    else if (key === 'enter' && this.screen === 'levelDone') this.nextLevel();
    else if (key === 'enter' && this.screen === 'win') this.startGame(0);
    else if (['1', '2', '3'].includes(key)) this.startGame(Number(key) - 1);
  }

  // --- update + render ------------------------------------------------------
  update(now) {
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    if (this.screen === 'play' && this.shotMode !== 'play') {
      this.levelElapsed = (now - this.levelStartStamp) / 1000;
    }
    for (const p of this.particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 160 * dt;
    }
    this.particles = this.particles.filter((p) => p.age < p.life);
    this.wrongMarks = this.wrongMarks.filter((m) => now < m.until);
    if (this.hintTarget >= 0 && now > this.hintUntil) this.hintTarget = -1;
  }

  draw(now) {
    const ctx = this.ctx;
    ctx.save();
    if (now < this.shakeUntil) {
      ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    }
    ctx.fillStyle = '#171226';
    ctx.fillRect(-10, -10, CANVAS_W + 20, CANVAS_H + 20);
    if (this.screen === 'start') this.drawStartScreen(ctx, now);
    else if (this.screen === 'win') this.drawWinScreen(ctx, now);
    else {
      this.drawBoard(ctx, now);
      if (this.screen === 'levelDone') this.drawLevelDoneCard(ctx, now);
    }
    ctx.restore();
  }

  drawTopBar(ctx, now) {
    const scene = this.scene();
    ctx.fillStyle = '#241b3a';
    ctx.fillRect(0, 0, CANVAS_W, TOP_BAR_H);
    ctx.fillStyle = '#ffd93b';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('TWIN PEEKS', 40, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`Level ${this.levelIndex + 1} · ${scene.name} · ${scene.difficulty}`, 40, 62);
    // Progress dots: one per difference, filled green when found.
    const dotY = 30;
    for (let i = 0; i < DIFFERENCES_PER_LEVEL; i++) {
      const x = 560 + i * 30;
      ctx.beginPath();
      ctx.arc(x, dotY, 10, 0, Math.PI * 2);
      ctx.fillStyle = this.found.has(i) ? '#57b957' : '#4a4066';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (this.found.has(i)) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - 5, dotY);
        ctx.lineTo(x - 1, dotY + 4);
        ctx.lineTo(x + 5, dotY - 4);
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('FOUND', 560, 62);
    // Remaining counter — big and unmissable.
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.remaining()} LEFT`, 940, 32);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`of ${DIFFERENCES_PER_LEVEL} differences`, 940, 62);
    // Timer and score.
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd93b';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(`TIME ${formatTime(this.levelElapsed)}`, 1000, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(`Score ${this.score}`, 1000, 60);
    // Hint pips.
    ctx.fillStyle = '#ffd93b';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`HINTS ${this.hintsLeft}`, 1180, 30);
    ctx.fillStyle = '#b8b0d0';
    ctx.fillText('left', 1180, 60);
  }

  drawBoard(ctx, now) {
    this.drawTopBar(ctx, now);
    const scene = this.scene();
    // Panel labels.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('◀  ORIGINAL', LEFT_PANEL.x + PANEL_W / 2, PANEL_LABEL_Y);
    ctx.fillText('FIND 7 DIFFERENCES  ▶', RIGHT_PANEL.x + PANEL_W / 2, PANEL_LABEL_Y);
    // Panels with frames.
    for (const panel of [LEFT_PANEL, RIGHT_PANEL]) {
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, panel.x - 6, panel.y - 6, PANEL_W + 12, PANEL_H + 12, 10);
      ctx.fill();
    }
    ctx.drawImage(this.leftPanelCanvas, LEFT_PANEL.x, LEFT_PANEL.y);
    ctx.drawImage(this.rightPanelCanvas, RIGHT_PANEL.x, RIGHT_PANEL.y);
    // Center divider badge.
    ctx.fillStyle = '#ffd93b';
    circle(ctx, 640, 334, 26, '#ffd93b');
    ctx.fillStyle = '#171226';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('VS', 640, 335);
    // Found markers on both panels.
    const pulse = 1 + Math.sin(now / 220) * 0.08;
    scene.differences.forEach((diff, i) => {
      if (!this.found.has(i)) return;
      for (const panel of [LEFT_PANEL, RIGHT_PANEL]) {
        const cx = panel.x + diff.x;
        const cy = panel.y + diff.y;
        ctx.beginPath();
        ctx.arc(cx, cy, diff.r * pulse + 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#2fbf4a';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fillStyle = '#2fbf4a';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy);
        ctx.lineTo(cx - 1, cy + 4);
        ctx.lineTo(cx + 5, cy - 4);
        ctx.stroke();
      }
    });
    // Hint pulse on one unfound difference.
    if (this.hintTarget >= 0) {
      const diff = scene.differences[this.hintTarget];
      const ring = 18 + Math.sin(now / 130) * 6;
      for (const panel of [LEFT_PANEL, RIGHT_PANEL]) {
        ctx.beginPath();
        ctx.arc(panel.x + diff.x, panel.y + diff.y, ring + diff.r * 0.4, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffd93b';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    // Particles and wrong-click marks.
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
      circle(ctx, p.x, p.y, p.size, p.color);
    }
    ctx.globalAlpha = 1;
    for (const mark of this.wrongMarks) {
      const fade = Math.max(0, (mark.until - now) / 900);
      ctx.globalAlpha = fade;
      ctx.strokeStyle = '#ff4d4d';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(mark.x - 12, mark.y - 12);
      ctx.lineTo(mark.x + 12, mark.y + 12);
      ctx.moveTo(mark.x + 12, mark.y - 12);
      ctx.lineTo(mark.x - 12, mark.y + 12);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Bottom bar buttons.
    for (const button of this.bottomButtons()) {
      const hovered = this.hover.x >= button.x && this.hover.x <= button.x + button.w
        && this.hover.y >= button.y && this.hover.y <= button.y + button.h;
      ctx.fillStyle = hovered ? '#3a2d5c' : '#2a2144';
      roundRect(ctx, button.x, button.y, button.w, button.h, 8);
      ctx.fill();
      ctx.strokeStyle = '#6c5a9e';
      ctx.lineWidth = 1.5;
      roundRect(ctx, button.x, button.y, button.w, button.h, 8);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
    }
    // Toast message.
    if (this.message && now < this.messageUntil) {
      ctx.font = 'bold 20px system-ui, sans-serif';
      const w = ctx.measureText(this.message).width + 36;
      ctx.fillStyle = 'rgba(23, 18, 38, 0.92)';
      roundRect(ctx, (CANVAS_W - w) / 2, 600, w, 40, 20);
      ctx.fill();
      ctx.fillStyle = '#ffd93b';
      ctx.textAlign = 'center';
      ctx.fillText(this.message, CANVAS_W / 2, 621);
    }
  }

  drawStartScreen(ctx, now) {
    // Title.
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd93b';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.fillText('TWIN PEEKS', CANVAS_W / 2, 92);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('SPOT THE DIFFERENCE', CANVAS_W / 2, 138);
    ctx.fillStyle = '#b8b0d0';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('Two pictures, side by side — seven tiny changes hide in the right one. Find them all!', CANVAS_W / 2, 172);
    // Preview: the garden scene, left and right, small.
    const previewScale = 0.42;
    const pw = PANEL_W * previewScale;
    const ph = PANEL_H * previewScale;
    const leftX = CANVAS_W / 2 - pw - 24;
    const rightX = CANVAS_W / 2 + 24;
    const previewY = 196;
    const all = new Set(SCENES[0].differences.map((_, i) => i));
    const leftPreview = makeOffscreenPanel(SCENES[0], new Set());
    const rightPreview = makeOffscreenPanel(SCENES[0], all);
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, leftX - 5, previewY - 5, pw + 10, ph + 10, 8);
    ctx.fill();
    roundRect(ctx, rightX - 5, previewY - 5, pw + 10, ph + 10, 8);
    ctx.fill();
    ctx.drawImage(leftPreview, leftX, previewY, pw, ph);
    ctx.drawImage(rightPreview, rightX, previewY, pw, ph);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('ORIGINAL', leftX + pw / 2, previewY + ph + 22);
    ctx.fillText('7 DIFFERENCES', rightX + pw / 2, previewY + ph + 22);
    // Start button (pulsing).
    const pulse = 1 + Math.sin(now / 300) * 0.03;
    const bw = 300 * pulse;
    ctx.fillStyle = '#57b957';
    roundRect(ctx, CANVAS_W / 2 - bw / 2, 470, bw, 70, 14);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText('▶  START PLAYING', CANVAS_W / 2, 506);
    // Level picker.
    ctx.fillStyle = '#b8b0d0';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('or pick a scene — keys 1 / 2 / 3', CANVAS_W / 2, 566);
    const labels = ['1 · Garden', '2 · Kitchen', '3 · Night Camp'];
    labels.forEach((label, i) => {
      const x = 435 + i * 140;
      ctx.fillStyle = '#2a2144';
      roundRect(ctx, x, 580, 130, 30, 8);
      ctx.fill();
      ctx.strokeStyle = '#6c5a9e';
      ctx.lineWidth = 1.5;
      roundRect(ctx, x, 580, 130, 30, 8);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(label, x + 65, 596);
    });
    ctx.fillStyle = '#8f86ad';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('Click a difference on the RIGHT picture  ·  H = hint (3 per level)  ·  R = restart  ·  M = sound', CANVAS_W / 2, 652);
    ctx.fillText('3 scenes × 7 differences  ·  Beat the 2:00 par time for a bonus  ·  No downloads, no network — pure canvas art', CANVAS_W / 2, 680);
  }

  drawLevelDoneCard(ctx, now) {
    ctx.fillStyle = 'rgba(23, 18, 38, 0.72)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const scene = this.scene();
    ctx.fillStyle = '#241b3a';
    roundRect(ctx, 390, 170, 500, 360, 18);
    ctx.fill();
    ctx.strokeStyle = '#ffd93b';
    ctx.lineWidth = 3;
    roundRect(ctx, 390, 170, 500, 360, 18);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#57b957';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText('LEVEL CLEAR!', CANVAS_W / 2, 232);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(`${scene.name} — all ${DIFFERENCES_PER_LEVEL} found`, CANVAS_W / 2, 276);
    ctx.fillStyle = '#ffd93b';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('★'.repeat(this.stars[this.levelIndex]) + '☆'.repeat(3 - this.stars[this.levelIndex]), CANVAS_W / 2, 322);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText(`Time ${formatTime(this.levelElapsed)}  ·  Hints left ${this.hintsLeft}  ·  Score ${this.score}`, CANVAS_W / 2, 366);
    ctx.fillStyle = '#b8b0d0';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`Next up: ${SCENES[this.levelIndex + 1].name} (${SCENES[this.levelIndex + 1].difficulty})`, CANVAS_W / 2, 402);
    ctx.fillStyle = '#57b957';
    roundRect(ctx, 490, 470, 300, 60, 12);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('NEXT LEVEL  ▶', CANVAS_W / 2, 500);
  }

  drawWinScreen(ctx, now) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd93b';
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.fillText('YOU FOUND THEM ALL!', CANVAS_W / 2, 110);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('All 3 scenes cleared — 21 differences spotted', CANVAS_W / 2, 156);
    // Trophy.
    const bob = Math.sin(now / 400) * 6;
    ctx.fillStyle = '#ffd93b';
    ctx.beginPath();
    ctx.moveTo(600, 200 + bob);
    ctx.lineTo(680, 200 + bob);
    ctx.lineTo(668, 268 + bob);
    ctx.lineTo(612, 268 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffd93b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(596, 224 + bob, 18, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(684, 224 + bob, 18, Math.PI * 1.5, Math.PI * 0.5);
    ctx.stroke();
    ctx.fillStyle = '#e0a800';
    ctx.fillRect(632, 268 + bob, 16, 26);
    ctx.fillRect(606, 294 + bob, 68, 12);
    // Score card.
    ctx.fillStyle = '#241b3a';
    roundRect(ctx, 390, 340, 500, 130, 16);
    ctx.fill();
    ctx.strokeStyle = '#ffd93b';
    ctx.lineWidth = 2;
    roundRect(ctx, 390, 340, 500, 130, 16);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(`FINAL SCORE  ${this.score}`, CANVAS_W / 2, 388);
    ctx.fillStyle = '#b8b0d0';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText(`Total time ${formatTime(this.totalTime)}   ·   Wrong clicks ${this.wrongClicks}`, CANVAS_W / 2, 428);
    const starsText = this.stars.map((s) => '★'.repeat(s) + '☆'.repeat(3 - s)).join('   ');
    ctx.fillStyle = '#ffd93b';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(starsText, CANVAS_W / 2, 458);
    // Play again.
    ctx.fillStyle = '#57b957';
    roundRect(ctx, 490, 540, 300, 60, 12);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('↻  PLAY AGAIN', CANVAS_W / 2, 570);
    ctx.fillStyle = '#8f86ad';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('Press 1 / 2 / 3 to replay a single scene  ·  R restarts the current level', CANVAS_W / 2, 640);
  }

  run() {
    const loop = (now) => {
      this.update(now);
      this.draw(now);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

// Shared circle helper used by a few draw routines in this file.
function circle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}
