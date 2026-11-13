import { Swimmer } from '../engine/swimmer.js';
import { oval } from '../engine/shapes.js';

const BACK = '#1c2c4a';
const DEEP = '#121d33';
const MARK = '#f3f4f2';

export function createManta(rnd, size) {
  const sw = new Swimmer({ rnd, speed: 46 + rnd() * 16, turn: 1.0, turnFreq: 0.08, length: size * 1.6, margin: size * 1.5 });
  return { sw, size, beat: 0.24 + rnd() * 0.06 };
}

export function drawManta(layers, manta, t) {
  const ctx = layers.body;
  const { sw, size: S } = manta;
  // Wingbeat seen from above: the tips draw in and sweep back as they rise.
  const flap = Math.sin(t * manta.beat * Math.PI * 2 + sw.phase);
  const span = S * (0.92 + flap * 0.1);
  const sweep = S * (0.16 - flap * 0.07);

  ctx.save();
  ctx.translate(sw.x, sw.y);
  ctx.rotate(sw.heading); // +x is forward

  // Whip tail.
  ctx.strokeStyle = DEEP;
  ctx.lineWidth = S * 0.035;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-0.45 * S, 0);
  ctx.quadraticCurveTo(-0.9 * S, flap * 0.05 * S, -1.25 * S, -flap * 0.08 * S);
  ctx.stroke();

  // Disc: nose, cephalic lobes, wing tips, trailing edge.
  ctx.fillStyle = BACK;
  ctx.beginPath();
  ctx.moveTo(0.46 * S, 0.13 * S);
  ctx.lineTo(0.6 * S, 0.17 * S);
  ctx.quadraticCurveTo(0.42 * S, 0.3 * S, 0.3 * S, 0.3 * S);
  ctx.quadraticCurveTo(0.16 * S, 0.62 * S, -sweep, span);
  ctx.quadraticCurveTo(-0.16 * S, 0.42 * S, -0.5 * S, 0.07 * S);
  ctx.lineTo(-0.5 * S, -0.07 * S);
  ctx.quadraticCurveTo(-0.16 * S, -0.42 * S, -sweep, -span);
  ctx.quadraticCurveTo(0.16 * S, -0.62 * S, 0.3 * S, -0.3 * S);
  ctx.quadraticCurveTo(0.42 * S, -0.3 * S, 0.6 * S, -0.17 * S);
  ctx.lineTo(0.46 * S, -0.13 * S);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = DEEP;
  oval(ctx, -0.05 * S, 0, 0.34 * S, 0.13 * S);

  // Pale shoulder chevrons and mouth.
  ctx.fillStyle = MARK;
  for (const side of [1, -1]) {
    oval(ctx, 0.16 * S, side * 0.24 * S, 0.17 * S, 0.075 * S, side * -0.5);
    oval(ctx, -0.04 * S, side * 0.5 * S, 0.1 * S, 0.04 * S, side * -0.9);
  }
  oval(ctx, 0.44 * S, 0, 0.035 * S, 0.1 * S);

  ctx.restore();
}
