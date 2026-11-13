import { Swimmer } from '../engine/swimmer.js';
import { disc, oval } from '../engine/shapes.js';

const TAU = Math.PI * 2;

export const FLOWER_KINDS = {
  // Red hibiscus: five broad, overlapping petals around a dark throat.
  hibiscus: { petal: '#e0244f', shade: '#b9163f', throat: '#8f0f31', stamen: '#f6a9b9', round: true },
  // Plumeria: five slim white petals with a yellow heart.
  plumeria: { petal: '#fdfdf6', shade: '#f1efe2', throat: '#f5c13c', stamen: '#fbdc74', round: false },
};

/** Flowers float on the surface: they barely drift and turn slowly. */
export function createFlower(rnd, kind, size) {
  const sw = new Swimmer({ rnd, speed: 5 + rnd() * 6, turn: 0.6, turnFreq: 0.05, length: size, margin: size });
  return { sw, kind: FLOWER_KINDS[kind], size, spin: (rnd() - 0.5) * 0.24, angle: rnd() * TAU };
}

export function drawFlower(layers, flower, t) {
  const ctx = layers.body;
  const { sw, kind, size: S } = flower;
  const rot = flower.angle + t * flower.spin;

  ctx.save();
  ctx.translate(sw.x, sw.y);
  ctx.rotate(rot);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    const cx = Math.cos(a), cy = Math.sin(a);
    ctx.fillStyle = i % 2 ? kind.shade : kind.petal;
    if (kind.round) oval(ctx, cx * S * 0.27, cy * S * 0.27, S * 0.27, S * 0.24, a);
    else oval(ctx, cx * S * 0.28, cy * S * 0.28, S * 0.25, S * 0.14, a);
  }
  if (kind.round) {
    ctx.fillStyle = kind.throat;
    disc(ctx, 0, 0, S * 0.13);
    ctx.fillStyle = kind.stamen;
    oval(ctx, S * 0.13, S * 0.04, S * 0.09, S * 0.03, 0.3);
  } else {
    ctx.fillStyle = kind.stamen;
    disc(ctx, 0, 0, S * 0.2);
    ctx.fillStyle = kind.throat;
    disc(ctx, 0, 0, S * 0.12);
  }
  ctx.restore();
}
