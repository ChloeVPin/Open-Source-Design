import { Swimmer } from '../engine/swimmer.js';
import { oval } from '../engine/shapes.js';

const SHELL = { rim: '#4a3c15', scutes: ['#8d7a2f', '#a8923a', '#5e4f1d', '#bfa74a'], ridge: '#d2bb58' };
const SKIN = { base: '#b2975a', dark: '#836f3c' };

export function createTurtle(rnd, size) {
  const sw = new Swimmer({ rnd, speed: 30 + rnd() * 22, turn: 1.1, turnFreq: 0.09, length: size, margin: size * 0.95 });
  // Scutes: a central row of five flanked by two rows of four, as on a real carapace.
  const scutes = [];
  for (let i = 0; i < 5; i++) scutes.push({ x: -0.32 + i * 0.16, y: 0, r: 0.074, c: Math.floor(rnd() * 4) });
  for (const side of [1, -1]) {
    for (let i = 0; i < 4; i++) scutes.push({ x: -0.25 + i * 0.165, y: side * 0.2, r: 0.072, c: Math.floor(rnd() * 4) });
  }
  return { sw, size, scutes, beat: 0.32 + rnd() * 0.1 };
}

/** Leaf-shaped flipper pointing along +x from the origin. */
function flipper(ctx, len, width) {
  ctx.beginPath();
  ctx.moveTo(0, -width * 0.35);
  ctx.quadraticCurveTo(len * 0.55, -width * 0.95, len, 0);
  ctx.quadraticCurveTo(len * 0.5, width * 0.5, 0, width * 0.4);
  ctx.closePath();
  ctx.fill();
}

export function drawTurtle(layers, turtle, t) {
  const { sw, size: S, scutes } = turtle;
  const ctx = layers.body;
  const stroke = Math.sin(t * turtle.beat * Math.PI * 2 + sw.phase);

  ctx.save();
  ctx.translate(sw.x, sw.y);
  ctx.rotate(sw.heading); // +x is forward

  // Rear flippers: short paddles that trail and steer.
  ctx.fillStyle = SKIN.dark;
  for (const side of [1, -1]) {
    ctx.save();
    ctx.translate(-0.38 * S, side * 0.24 * S);
    ctx.rotate(side * (2.45 - stroke * 0.12));
    flipper(ctx, 0.27 * S, 0.15 * S);
    ctx.restore();
  }

  // Front flippers: long wings that sweep from forward to back each stroke.
  for (const side of [1, -1]) {
    ctx.save();
    ctx.translate(0.27 * S, side * 0.28 * S);
    ctx.rotate(side * (1.55 + stroke * 0.5));
    ctx.fillStyle = SKIN.base;
    flipper(ctx, 0.6 * S, 0.21 * S);
    ctx.fillStyle = SKIN.dark;
    oval(ctx, 0.3 * S, -0.02 * S, 0.14 * S, 0.035 * S);
    ctx.restore();
  }

  // Tail and head.
  ctx.fillStyle = SKIN.dark;
  oval(ctx, -0.53 * S, 0, 0.07 * S, 0.03 * S);
  ctx.fillStyle = SKIN.base;
  oval(ctx, 0.6 * S, 0, 0.15 * S, 0.11 * S);
  ctx.fillStyle = SKIN.dark;
  oval(ctx, 0.62 * S, 0, 0.08 * S, 0.06 * S);

  // Carapace.
  ctx.fillStyle = SHELL.rim;
  oval(ctx, 0, 0, 0.5 * S, 0.395 * S);
  ctx.fillStyle = SHELL.scutes[0];
  oval(ctx, 0.01 * S, 0, 0.44 * S, 0.335 * S);
  ctx.fillStyle = SHELL.rim;
  oval(ctx, 0, 0, 0.4 * S, 0.3 * S);
  for (const sc of scutes) {
    ctx.fillStyle = SHELL.scutes[sc.c];
    oval(ctx, sc.x * S, sc.y * S, sc.r * S, sc.r * S * 0.92);
  }
  ctx.fillStyle = SHELL.ridge;
  oval(ctx, 0.04 * S, 0, 0.2 * S, 0.018 * S);

  ctx.restore();
}
