import { Swimmer } from '../engine/swimmer.js';
import { at, fin, oval, profile, ribbon } from '../engine/shapes.js';

const DOLPHIN_SHAPE = profile([[0, 0.16], [0.07, 0.26], [0.11, 0.62], [0.2, 0.92], [0.33, 1], [0.52, 0.84], [0.72, 0.48], [0.9, 0.2], [1, 0.13]]);
const WHALE_SHAPE = profile([[0, 0.45], [0.06, 0.78], [0.18, 1], [0.36, 0.98], [0.56, 0.74], [0.76, 0.42], [0.92, 0.2], [1, 0.14]]);

export const CETACEAN_KINDS = {
  dolphin: {
    shape: DOLPHIN_SHAPE, girth: 0.095, layer: 'body', alpha: 1,
    base: '#657483', dark: '#414c5a', pale: '#98a5b2',
    flipper: { at: 0.3, out: 0.13, back: 0.11, base: 0.08 }, fluke: 0.15,
  },
  // A humpback far below: drawn translucent into the deep layer so it reads as depth.
  whale: {
    shape: WHALE_SHAPE, girth: 0.13, layer: 'deep', alpha: 0.5,
    base: '#3f6a94', dark: '#30557c', pale: '#5c84aa',
    flipper: { at: 0.3, out: 0.3, back: 0.2, base: 0.1 }, fluke: 0.2,
  },
};

export function createCetacean(rnd, kind, length) {
  const k = CETACEAN_KINDS[kind];
  const sw = new Swimmer({
    rnd, length,
    speed: kind === 'whale' ? 16 + rnd() * 6 : 70 + rnd() * 20,
    turn: kind === 'whale' ? 0.35 : 1.0,
    turnFreq: 0.08,
  });
  return { sw, kind: k, beat: kind === 'whale' ? 0.12 : 0.5 };
}

export function drawCetacean(layers, animal, t) {
  const { sw, kind } = animal;
  const ctx = layers[kind.layer];
  const L = sw.length;
  const W = L * kind.girth;
  const pts = sw.spine(18, L * 0.9, t, { amp: 0.022, freq: animal.beat, waves: 0.7 });
  const half = (s) => W * kind.shape(s);
  const end = pts[pts.length - 1];

  ctx.save();
  ctx.globalAlpha = kind.alpha;

  // Horizontal flukes — from above they read as a wide crescent.
  ctx.fillStyle = kind.dark;
  const f = kind.fluke * L;
  ctx.beginPath();
  ctx.moveTo(end.x - end.tx * f * 0.25, end.y - end.ty * f * 0.25);
  ctx.quadraticCurveTo(end.x + end.nx * f * 0.5, end.y + end.ny * f * 0.5, end.x + end.nx * f + end.tx * f * 0.55, end.y + end.ny * f + end.ty * f * 0.55);
  ctx.lineTo(end.x + end.tx * f * 0.3, end.y + end.ty * f * 0.3);
  ctx.lineTo(end.x - end.nx * f + end.tx * f * 0.55, end.y - end.ny * f + end.ty * f * 0.55);
  ctx.quadraticCurveTo(end.x - end.nx * f * 0.5, end.y - end.ny * f * 0.5, end.x - end.tx * f * 0.25, end.y - end.ty * f * 0.25);
  ctx.closePath();
  ctx.fill();

  const fl = kind.flipper;
  const p = at(pts, fl.at);
  for (const side of [1, -1]) {
    fin(ctx, p, side, { root: half(fl.at) * 0.6, base: L * fl.base, out: L * fl.out, back: L * fl.back });
  }

  ctx.fillStyle = kind.base;
  ribbon(ctx, pts, half);
  ctx.fillStyle = kind.dark;
  ribbon(ctx, pts, (s) => half(s) * 0.5, 0.1, 1);
  const d = at(pts, 0.5);
  ctx.fillStyle = kind.pale;
  oval(ctx, d.x, d.y, L * 0.05, W * 0.14, Math.atan2(d.ty, d.tx));

  ctx.restore();
}
