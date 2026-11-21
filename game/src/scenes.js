// Twin Peeks — scene art. Every scene is drawn from scratch with Canvas 2D
// primitives (no image files, no outside assets). A scene's `draw` paints the
// LEFT panel exactly; the RIGHT panel is the same drawing with the scene's
// differences applied on top, one small painter per difference. A difference
// entry carries the spot the player must click (x, y, r) in panel space
// (PANEL_W x PANEL_H) and a short name shown when it is found.

export const PANEL_W = 560;
export const PANEL_H = 460;

function circle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function triangle(ctx, x1, y1, x2, y2, x3, y3, fill) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function skyPatch(ctx, x, y, w, h, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, PANEL_H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function skyGradient(ctx, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, PANEL_H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);
}

function drawCloud(ctx, x, y, s) {
  ctx.fillStyle = '#ffffff';
  circle(ctx, x, y, 22 * s, '#ffffff');
  circle(ctx, x + 20 * s, y + 4 * s, 17 * s, '#ffffff');
  circle(ctx, x - 20 * s, y + 5 * s, 16 * s, '#ffffff');
  ctx.fillRect(x - 34 * s, y, 68 * s, 16 * s);
}

function drawFlower(ctx, x, y, petal, center) {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    circle(ctx, x + Math.cos(a) * 8, y + Math.sin(a) * 8, 5, petal);
  }
  circle(ctx, x, y, 5, center);
}

function drawButterfly(ctx, x, y, wing) {
  ctx.fillStyle = wing;
  ctx.beginPath();
  ctx.ellipse(x - 9, y - 6, 10, 7, -0.5, 0, Math.PI * 2);
  ctx.ellipse(x + 9, y - 6, 10, 7, 0.5, 0, Math.PI * 2);
  ctx.ellipse(x - 8, y + 7, 8, 6, 0.4, 0, Math.PI * 2);
  ctx.ellipse(x + 8, y + 7, 8, 6, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2b22';
  ctx.fillRect(x - 1.5, y - 10, 3, 20);
  circle(ctx, x, y - 11, 3, '#3a2b22');
}

// ---------------------------------------------------------------------------
// Scene 1 — Sunny Garden. A cottage garden: sun, clouds, a red-roof house,
// an apple tree, a flower bed and a picket fence.
// ---------------------------------------------------------------------------
function drawGardenBase(ctx) {
  skyGradient(ctx, '#7ec8f2', '#dff3ff');
  // Sun with rays and a smile.
  ctx.strokeStyle = '#f7b500';
  ctx.lineWidth = 5;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(82 + Math.cos(a) * 42, 72 + Math.sin(a) * 42);
    ctx.lineTo(82 + Math.cos(a) * 54, 72 + Math.sin(a) * 54);
    ctx.stroke();
  }
  circle(ctx, 82, 72, 34, '#ffd93b');
  circle(ctx, 70, 66, 4, '#7a4a00');
  circle(ctx, 94, 66, 4, '#7a4a00');
  ctx.strokeStyle = '#7a4a00';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(82, 76, 12, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Clouds and a bird.
  drawCloud(ctx, 240, 62, 1);
  drawCloud(ctx, 420, 76, 0.8);
  drawCloud(ctx, 500, 40, 0.6);
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(248, 128);
  ctx.quadraticCurveTo(256, 120, 264, 128);
  ctx.quadraticCurveTo(272, 120, 280, 128);
  ctx.stroke();
  // Rolling hills.
  ellipse(ctx, 140, 500, 260, 120, '#7ec850');
  ellipse(ctx, 430, 510, 280, 130, '#68b844');
  // Apple tree on the left.
  rect(ctx, 108, 250, 18, 130, '#8a5a2b');
  circle(ctx, 88, 226, 34, '#3f9e3f');
  circle(ctx, 138, 218, 38, '#4caf50');
  circle(ctx, 116, 190, 36, '#57b957');
  circle(ctx, 100, 232, 7, '#e33e2b');
  circle(ctx, 136, 240, 7, '#e33e2b');
  // Cottage with a red roof.
  rect(ctx, 356, 268, 150, 118, '#ffe8c2');
  triangle(ctx, 344, 272, 518, 272, 431, 196, '#d94f3d');
  rect(ctx, 470, 214, 18, 44, '#a0522d');
  rect(ctx, 418, 316, 30, 70, '#8a5a2b');
  circle(ctx, 452, 352, 3, '#ffd93b');
  rect(ctx, 372, 292, 34, 34, '#5aa9e6');
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(389, 292);
  ctx.lineTo(389, 326);
  ctx.moveTo(372, 309);
  ctx.lineTo(406, 309);
  ctx.stroke();
  // Flower bed and fence.
  ctx.strokeStyle = '#7a4a21';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(20, 420);
  ctx.lineTo(540, 420);
  ctx.stroke();
  for (let x = 40; x <= 520; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 396);
    ctx.lineTo(x, 436);
    ctx.stroke();
  }
  drawFlower(ctx, 220, 432, '#ff6b9d', '#ffd93b');
  drawFlower(ctx, 268, 440, '#c77dff', '#ffd93b');
  drawFlower(ctx, 316, 432, '#ff9f1c', '#7a2e00');
  drawFlower(ctx, 60, 442, '#ff6b9d', '#ffd93b');
  drawButterfly(ctx, 300, 150, '#ff8fab');
}

const GARDEN_DIFFS = [
  {
    x: 512, y: 424, r: 26, name: 'A sunflower grew',
    apply(ctx) {
      rect(ctx, 510, 396, 5, 44, '#4a7c2f');
      ellipse(ctx, 500, 410, 12, 5, '#4a7c2f');
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        circle(ctx, 512 + Math.cos(a) * 15, 392 + Math.sin(a) * 15, 6, '#ffb703');
      }
      circle(ctx, 512, 392, 10, '#7a4a00');
    },
  },
  {
    x: 82, y: 72, r: 40, name: 'The sun wears shades',
    apply(ctx) {
      rect(ctx, 58, 58, 20, 12, '#222222');
      rect(ctx, 86, 58, 20, 12, '#222222');
      rect(ctx, 76, 62, 12, 4, '#222222');
    },
  },
  {
    x: 182, y: 176, r: 24, name: 'A second butterfly',
    apply(ctx) { drawButterfly(ctx, 182, 176, '#7bdff2'); },
  },
  {
    x: 264, y: 126, r: 22, name: 'The bird flew away',
    apply(ctx) {
      skyPatch(ctx, 240, 110, 48, 32, '#7ec8f2', '#dff3ff');
    },
  },
  {
    x: 389, y: 309, r: 22, name: 'The window glows yellow',
    apply(ctx) { rect(ctx, 372, 292, 34, 34, '#ffd93b'); },
  },
  {
    x: 152, y: 252, r: 20, name: 'One more apple',
    apply(ctx) { circle(ctx, 152, 252, 8, '#e33e2b'); },
  },
  {
    x: 420, y: 76, r: 34, name: 'A cloud vanished',
    apply(ctx) {
      skyPatch(ctx, 378, 42, 92, 52, '#7ec8f2', '#dff3ff');
    },
  },
];

// ---------------------------------------------------------------------------
// Scene 2 — Cozy Kitchen. A warm kitchen: window with curtains, wall clock,
// a shelf of jars, a table with a teapot, cups and a fruit bowl, a cat asleep
// on a chair.
// ---------------------------------------------------------------------------
function drawKitchenBase(ctx) {
  rect(ctx, 0, 0, PANEL_W, PANEL_H, '#ffe9b8');
  // Window with blue sky and pink curtains.
  rect(ctx, 60, 40, 150, 130, '#8ecae6');
  circle(ctx, 110, 80, 20, '#ffd93b');
  drawCloud(ctx, 170, 70, 0.45);
  ctx.strokeStyle = '#6d4c41';
  ctx.lineWidth = 5;
  ctx.strokeRect(60, 40, 150, 130);
  ctx.beginPath();
  ctx.moveTo(135, 40);
  ctx.lineTo(135, 170);
  ctx.moveTo(60, 105);
  ctx.lineTo(210, 105);
  ctx.stroke();
  rect(ctx, 44, 34, 26, 142, '#ff8fab');
  rect(ctx, 200, 34, 26, 142, '#ff8fab');
  // Wall clock.
  circle(ctx, 330, 90, 40, '#ffffff');
  ctx.strokeStyle = '#6d4c41';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(330, 90, 40, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(330, 90);
  ctx.lineTo(330, 62);
  ctx.moveTo(330, 90);
  ctx.lineTo(352, 100);
  ctx.stroke();
  circle(ctx, 330, 90, 4, '#222222');
  // Shelf with three jars.
  rect(ctx, 380, 150, 140, 10, '#8a5a2b');
  rect(ctx, 388, 108, 34, 42, '#b08968');
  rect(ctx, 434, 108, 34, 42, '#7f5539');
  rect(ctx, 480, 108, 34, 42, '#b08968');
  rect(ctx, 396, 126, 18, 12, '#fff3e0');
  rect(ctx, 442, 126, 18, 12, '#fff3e0');
  rect(ctx, 488, 126, 18, 12, '#fff3e0');
  // Table with a checked cloth.
  rect(ctx, 40, 300, 480, 130, '#e07a5f');
  for (let x = 40; x < 520; x += 40) {
    for (let y = 300; y < 430; y += 40) {
      if (((x + y) / 40) % 2 === 0) rect(ctx, x, y, 40, 40, '#f4a261');
    }
  }
  rect(ctx, 40, 300, 480, 8, '#ffffff');
  // Teapot with steam.
  ellipse(ctx, 250, 320, 42, 30, '#5aa9e6');
  triangle(ctx, 292, 306, 316, 318, 292, 326, '#5aa9e6');
  ctx.strokeStyle = '#3d7ea6';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(206, 316, 16, Math.PI * 0.6, Math.PI * 1.5);
  ctx.stroke();
  circle(ctx, 250, 288, 10, '#3d7ea6');
  ctx.strokeStyle = '#bbbbbb';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(250, 276);
  ctx.quadraticCurveTo(242, 262, 250, 248);
  ctx.quadraticCurveTo(258, 234, 250, 220);
  ctx.stroke();
  // Two cups.
  rect(ctx, 150, 330, 40, 28, '#ffffff');
  rect(ctx, 320, 330, 40, 28, '#ffd93b');
  ctx.strokeStyle = '#6d4c41';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(192, 344, 9, -Math.PI / 2, Math.PI / 2);
  ctx.arc(362, 344, 9, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // Fruit bowl: three apples and a banana.
  ellipse(ctx, 440, 372, 56, 18, '#8a5a2b');
  circle(ctx, 420, 356, 13, '#e33e2b');
  circle(ctx, 446, 350, 13, '#e33e2b');
  circle(ctx, 468, 358, 13, '#e33e2b');
  ctx.strokeStyle = '#ffd93b';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(440, 330, 26, 0.3, Math.PI - 0.3);
  ctx.stroke();
  // Cat asleep on a chair, tail curled.
  rect(ctx, 96, 388, 12, 52, '#8a5a2b');
  rect(ctx, 196, 388, 12, 52, '#8a5a2b');
  rect(ctx, 84, 372, 136, 16, '#a0522d');
  ellipse(ctx, 150, 352, 52, 24, '#f4a261');
  circle(ctx, 196, 338, 18, '#f4a261');
  triangle(ctx, 184, 326, 190, 312, 196, 326, '#f4a261');
  triangle(ctx, 200, 326, 206, 312, 212, 326, '#f4a261');
  ctx.strokeStyle = '#f4a261';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(102, 356);
  ctx.quadraticCurveTo(84, 368, 96, 380);
  ctx.stroke();
}

const KITCHEN_DIFFS = [
  {
    x: 300, y: 386, r: 22, name: 'An extra spoon',
    apply(ctx) {
      ctx.strokeStyle = '#c0c0c0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(300, 398);
      ctx.lineTo(300, 372);
      ctx.stroke();
      circle(ctx, 300, 366, 8, '#c0c0c0');
    },
  },
  {
    x: 96, y: 340, r: 24, name: 'The cat lifts its tail',
    apply(ctx) {
      ctx.strokeStyle = '#ffe9b8';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(102, 356);
      ctx.quadraticCurveTo(84, 368, 96, 380);
      ctx.stroke();
      ctx.strokeStyle = '#f4a261';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(102, 356);
      ctx.quadraticCurveTo(92, 330, 104, 316);
      ctx.stroke();
    },
  },
  {
    x: 451, y: 132, r: 22, name: 'A jar label turns red',
    apply(ctx) { rect(ctx, 442, 126, 18, 12, '#e33e2b'); },
  },
  {
    x: 330, y: 90, r: 42, name: 'The clock shows a new time',
    apply(ctx) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(330, 90);
      ctx.lineTo(330, 62);
      ctx.moveTo(330, 90);
      ctx.lineTo(352, 100);
      ctx.stroke();
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(330, 90);
      ctx.lineTo(330, 118);
      ctx.moveTo(330, 90);
      ctx.lineTo(306, 82);
      ctx.stroke();
      circle(ctx, 330, 90, 4, '#222222');
    },
  },
  {
    x: 440, y: 330, r: 26, name: 'The banana is gone',
    apply(ctx) {
      ctx.strokeStyle = '#ffe9b8';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(440, 330, 26, 0.3, Math.PI - 0.3);
      ctx.stroke();
    },
  },
  {
    x: 57, y: 105, r: 26, name: 'A curtain turns green',
    apply(ctx) { rect(ctx, 44, 34, 26, 142, '#57b957'); },
  },
  {
    x: 428, y: 344, r: 22, name: 'A third cup appears',
    apply(ctx) {
      rect(ctx, 408, 330, 40, 28, '#c77dff');
      ctx.strokeStyle = '#6d4c41';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(450, 344, 9, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    },
  },
];

// ---------------------------------------------------------------------------
// Scene 3 — Night Camp. A starry campsite: moon, pines, an orange tent, a
// crackling campfire, log seats, a backpack and a hanging lantern.
// ---------------------------------------------------------------------------
function drawCampBase(ctx) {
  skyGradient(ctx, '#0d1b3e', '#274b7a');
  // Fixed stars.
  const stars = [
    [60, 50], [150, 36], [230, 70], [320, 40], [400, 90], [500, 44],
    [90, 110], [180, 96], [270, 120], [360, 60], [470, 130], [520, 100],
    [120, 150], [210, 150], [330, 140], [430, 170], [40, 180], [540, 160],
  ];
  ctx.fillStyle = '#ffffff';
  for (const [x, y] of stars) {
    circle(ctx, x, y, 2.5, '#ffffff');
  }
  // Moon with one crater.
  circle(ctx, 462, 74, 34, '#f5f0dc');
  circle(ctx, 452, 64, 7, '#d8cfae');
  // Pine trees.
  function pine(x, y, s) {
    rect(ctx, x - 5 * s, y, 10 * s, 26 * s, '#5d3a1a');
    triangle(ctx, x - 34 * s, y + 6 * s, x + 34 * s, y + 6 * s, x, y - 44 * s, '#1d5c2e');
    triangle(ctx, x - 28 * s, y - 18 * s, x + 28 * s, y - 18 * s, x, y - 62 * s, '#267a3a');
    triangle(ctx, x - 20 * s, y - 40 * s, x + 20 * s, y - 40 * s, x, y - 76 * s, '#2f9448');
  }
  pine(72, 330, 1);
  pine(516, 320, 0.9);
  // Ground and grass.
  rect(ctx, 0, 330, PANEL_W, 130, '#1e4d2b');
  ellipse(ctx, 280, 470, 300, 40, '#267a3a');
  // Tent with a pole.
  ctx.strokeStyle = '#6d4c41';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(280, 190);
  ctx.lineTo(280, 330);
  ctx.stroke();
  triangle(ctx, 190, 330, 370, 330, 280, 196, '#f4842b');
  triangle(ctx, 252, 330, 308, 330, 280, 258, '#5d3a1a');
  ctx.strokeStyle = '#ffd93b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(280, 196);
  ctx.lineTo(280, 330);
  ctx.stroke();
  // Campfire: stones, logs, flames.
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    circle(ctx, 280 + Math.cos(a) * 34, 396 + Math.sin(a) * 10, 8, '#9c9c9c');
  }
  ctx.strokeStyle = '#5d3a1a';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(256, 388);
  ctx.lineTo(304, 402);
  ctx.moveTo(304, 388);
  ctx.lineTo(256, 402);
  ctx.stroke();
  ellipse(ctx, 280, 384, 26, 20, '#ff9f1c');
  ellipse(ctx, 280, 378, 16, 16, '#ffd93b');
  ellipse(ctx, 280, 372, 8, 11, '#fff3b0');
  // Log seats.
  ellipse(ctx, 130, 408, 52, 14, '#7a4a21');
  ellipse(ctx, 430, 408, 52, 14, '#7a4a21');
  // Backpack and marshmallow stick.
  rect(ctx, 400, 356, 44, 48, '#3d7ea6');
  rect(ctx, 408, 344, 28, 14, '#2c5f7c');
  ctx.strokeStyle = '#ffd93b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(408, 366);
  ctx.lineTo(424, 366);
  ctx.stroke();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(340, 380);
  ctx.lineTo(392, 350);
  ctx.stroke();
  // Lantern hanging from a branch.
  ctx.strokeStyle = '#5d3a1a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(96, 300);
  ctx.lineTo(96, 330);
  ctx.stroke();
  rect(ctx, 84, 330, 24, 30, '#2c2c2c');
  circle(ctx, 96, 345, 9, '#ffd93b');
}

const CAMP_DIFFS = [
  {
    x: 150, y: 60, r: 26, name: 'A shooting star',
    apply(ctx) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(120, 44);
      ctx.lineTo(180, 76);
      ctx.stroke();
      circle(ctx, 180, 76, 4, '#ffffff');
    },
  },
  {
    x: 474, y: 86, r: 20, name: 'A second crater on the moon',
    apply(ctx) { circle(ctx, 474, 86, 6, '#d8cfae'); },
  },
  {
    x: 296, y: 196, r: 24, name: 'A flag on the tent',
    apply(ctx) {
      triangle(ctx, 280, 192, 306, 200, 280, 208, '#e33e2b');
    },
  },
  {
    x: 280, y: 378, r: 30, name: 'The fire burns blue',
    apply(ctx) {
      ellipse(ctx, 280, 384, 26, 20, '#4cc9f0');
      ellipse(ctx, 280, 378, 16, 16, '#90e0ef');
      ellipse(ctx, 280, 372, 8, 11, '#caf0f8');
    },
  },
  {
    x: 72, y: 290, r: 26, name: 'An owl in the pine',
    apply(ctx) {
      ellipse(ctx, 72, 290, 14, 18, '#8a6d3b');
      circle(ctx, 66, 284, 5, '#ffffff');
      circle(ctx, 78, 284, 5, '#ffffff');
      circle(ctx, 66, 284, 2.5, '#222222');
      circle(ctx, 78, 284, 2.5, '#222222');
      triangle(ctx, 70, 292, 74, 292, 72, 296, '#ffb703');
    },
  },
  {
    x: 96, y: 345, r: 24, name: 'The lantern glows green',
    apply(ctx) {
      circle(ctx, 96, 345, 14, '#80ed99');
      circle(ctx, 96, 345, 9, '#b7e4c7');
    },
  },
  {
    x: 392, y: 350, r: 22, name: 'A marshmallow on the stick',
    apply(ctx) {
      rect(ctx, 386, 342, 12, 16, '#fff8e7');
      ctx.strokeStyle = '#d8cfae';
      ctx.lineWidth = 2;
      ctx.strokeRect(386, 342, 12, 16);
    },
  },
];

export const SCENES = [
  {
    id: 'garden',
    name: 'Sunny Garden',
    subtitle: 'A cottage garden in full bloom',
    difficulty: 'Easy',
    drawBase: drawGardenBase,
    differences: GARDEN_DIFFS,
  },
  {
    id: 'kitchen',
    name: 'Cozy Kitchen',
    subtitle: 'Tea is on — something moved',
    difficulty: 'Medium',
    drawBase: drawKitchenBase,
    differences: KITCHEN_DIFFS,
  },
  {
    id: 'camp',
    name: 'Night Camp',
    subtitle: 'Stars, a tent and a crackling fire',
    difficulty: 'Tricky',
    drawBase: drawCampBase,
    differences: CAMP_DIFFS,
  },
];

// Paint one panel of a scene. `found` is the set of difference indexes that
// are present on this panel (empty for the left panel, all seven for the
// right panel, or a subset for a replay).
export function drawScenePanel(ctx, scene, found) {
  ctx.save();
  ctx.clearRect(0, 0, PANEL_W, PANEL_H);
  scene.drawBase(ctx);
  for (const index of found) {
    scene.differences[index].apply(ctx);
  }
  ctx.restore();
}
