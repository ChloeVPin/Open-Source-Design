import { Swimmer } from '../engine/swimmer.js';
import { at, disc, fin, profile, ribbon } from '../engine/shapes.js';

// Body half-width along the spine, as a fraction of the shark's girth.
const SLIM_HEAD = profile([[0, 0.42], [0.05, 0.52], [0.12, 0.82], [0.24, 1], [0.42, 0.88], [0.6, 0.58], [0.78, 0.3], [0.9, 0.17], [1, 0.12]]);
const BROAD_HEAD = profile([[0, 0.5], [0.04, 0.84], [0.12, 1], [0.26, 1], [0.44, 0.84], [0.62, 0.54], [0.8, 0.28], [0.92, 0.16], [1, 0.12]]);

export const SHARK_KINDS = {
  grayHammerhead: {
    hammer: 0.27, girth: 0.125, shape: SLIM_HEAD,
    base: '#6a6f77', dark: '#4b5059', core: '#1f2328', fin: '#7c8189', pale: '#eceded', wake: '#9fb6b0',
    tail: { upper: 0.25, lower: 0.13 },
  },
  blueHammerhead: {
    hammer: 0.27, girth: 0.125, shape: SLIM_HEAD,
    base: '#69758f', dark: '#46526f', core: '#1a2240', fin: '#7c88a6', pale: '#eceef2', wake: '#9fb0c4',
    tail: { upper: 0.25, lower: 0.13 },
  },
  leopard: {
    hammer: 0, girth: 0.125, shape: BROAD_HEAD,
    base: '#928574', dark: '#6e604f', core: '#3e3327', fin: '#a39683', pale: '#eeebe6', wake: '#a9b9ac',
    spot: '#2e251c', fleck: '#d6cdbf', tail: { upper: 0.32, lower: 0.07 },
  },
};

export function createShark(rnd, kind, length) {
  const sw = new Swimmer({ rnd, speed: 58 + rnd() * 26, turn: 1.5, turnFreq: 0.11, length });
  const spots = [];
  if (SHARK_KINDS[kind].spot) {
    for (let i = 0; i < 46; i++) {
      spots.push({ s: 0.05 + rnd() * 0.9, lat: (rnd() - 0.5) * 1.8, r: 0.012 + rnd() * 0.016, pale: rnd() < 0.35 });
    }
  }
  return { sw, kind: SHARK_KINDS[kind], spots, beat: 0.42 + rnd() * 0.14 };
}

export function drawShark(layers, shark, t) {
  const { sw, kind, spots } = shark;
  const ctx = layers.body;
  const L = sw.length;
  const W = L * kind.girth;
  const pts = sw.spine(20, L * 0.8, t, { amp: 0.06, freq: shark.beat, waves: 0.85 });
  const half = (s) => W * kind.shape(s);
  const end = pts[pts.length - 1];

  // Caudal fin, swinging a little further than the peduncle it hangs from.
  const swing = Math.sin(t * shark.beat * Math.PI * 2 - 0.95 * Math.PI * 2 + sw.phase) * 0.3;
  const a = Math.atan2(end.ty, end.tx) + swing;
  const tip = (len, da) => [end.x + Math.cos(a + da) * len * L, end.y + Math.sin(a + da) * len * L];
  const [ux, uy] = tip(kind.tail.upper, 0.42);
  const [lx, ly] = tip(kind.tail.lower, -0.6);
  const [nx, ny] = tip(0.055, 0);
  ctx.fillStyle = kind.dark;
  ctx.beginPath();
  ctx.moveTo(end.x + end.nx * W * 0.14, end.y + end.ny * W * 0.14);
  ctx.lineTo(ux, uy);
  ctx.lineTo(nx, ny);
  ctx.lineTo(lx, ly);
  ctx.lineTo(end.x - end.nx * W * 0.14, end.y - end.ny * W * 0.14);
  ctx.closePath();
  ctx.fill();

  // The very tip of the tail dissolves into halftone dots.
  const g = layers.ghost;
  const [wx, wy] = tip(kind.tail.upper + 0.14, 0.5);
  g.fillStyle = kind.wake;
  g.beginPath();
  g.moveTo(ux + end.nx * L * 0.03, uy + end.ny * L * 0.03);
  g.lineTo(wx + end.nx * L * 0.05, wy + end.ny * L * 0.05);
  g.lineTo(wx - end.nx * L * 0.05, wy - end.ny * L * 0.05);
  g.lineTo(ux - end.nx * L * 0.03, uy - end.ny * L * 0.03);
  g.closePath();
  g.fill();

  // Paired fins.
  ctx.fillStyle = kind.fin;
  const pec = at(pts, 0.3), pel = at(pts, 0.72);
  for (const side of [1, -1]) {
    fin(ctx, pec, side, { root: half(0.3) * 0.6, base: L * 0.11, out: L * 0.2, back: L * 0.13 });
    fin(ctx, pel, side, { root: half(0.72) * 0.5, base: L * 0.06, out: L * 0.07, back: L * 0.06 });
  }

  // Body, then a darker back shading toward a near-black dorsal ridge.
  ctx.fillStyle = kind.base;
  ribbon(ctx, pts, half);
  ctx.fillStyle = kind.dark;
  ribbon(ctx, pts, (s) => half(s) * 0.62, 0.04, 1);
  ctx.fillStyle = kind.core;
  ribbon(ctx, pts, (s) => half(s) * 0.26, 0.12, 0.86);

  if (kind.hammer) {
    // Cephalofoil: a swept bar across the snout with a pale eye at each end.
    const p = at(pts, 0.02);
    const hs = kind.hammer * L, th = L * 0.085, sweep = L * 0.05;
    const fx = -p.tx, fy = -p.ty;
    const ax = p.x + p.nx * hs + p.tx * sweep, ay = p.y + p.ny * hs + p.ty * sweep;
    const bx = p.x - p.nx * hs + p.tx * sweep, by = p.y - p.ny * hs + p.ty * sweep;
    ctx.fillStyle = kind.base;
    ctx.beginPath();
    ctx.moveTo(ax + fx * th * 0.5, ay + fy * th * 0.5);
    ctx.quadraticCurveTo(p.x + fx * th * 1.5, p.y + fy * th * 1.5, bx + fx * th * 0.5, by + fy * th * 0.5);
    ctx.lineTo(bx - fx * th * 0.5, by - fy * th * 0.5);
    ctx.quadraticCurveTo(p.x - fx * th * 0.1, p.y - fy * th * 0.1, ax - fx * th * 0.5, ay - fy * th * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = kind.dark;
    ctx.beginPath();
    ctx.ellipse(p.x + fx * th * 0.35, p.y + fy * th * 0.35, hs * 0.55, th * 0.3, Math.atan2(p.ny, p.nx), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = kind.pale;
    disc(ctx, ax, ay, th * 0.46);
    disc(ctx, bx, by, th * 0.46);
  }

  if (spots.length) {
    for (const sp of spots) {
      ctx.fillStyle = sp.pale ? kind.fleck : kind.spot;
      const p = at(pts, sp.s);
      const w = half(sp.s) * sp.lat * 0.5;
      disc(ctx, p.x + p.nx * w, p.y + p.ny * w, sp.r * L);
    }
  }
}
