import { rng } from '../engine/noise.js';

// Faint reef shapes that sit still on the sea floor. Positions are fractions
// of the viewport so the composition holds at any window size.
const REEF = [
  { x: 0.925, y: 0.13, size: 92, color: '#8fd39a' },
  { x: 0.04, y: 0.21, size: 70, color: '#c8bcdc' },
  { x: 0.075, y: 0.925, size: 104, color: '#b7aab6' },
  { x: 0.89, y: 0.935, size: 104, color: '#8da5c4' },
  { x: 0.978, y: 0.235, size: 34, color: '#7fbf9c' },
  { x: 0.02, y: 0.512, size: 26, color: '#5f8894' },
  { x: 0.152, y: 0.823, size: 40, color: '#9fb1a6' },
  { x: 0.287, y: 0.9, size: 20, color: '#7d97b8' },
  { x: 0.786, y: 0.886, size: 34, color: '#a3a89a' },
  { x: 0.892, y: 0.838, size: 22, color: '#8a9fbe' },
];

export function createReef(seed) {
  const rnd = rng(seed * 31 + 5);
  return REEF.map((r) => {
    const lobes = [];
    const n = 5 + Math.floor(r.size / 14);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r.size * 0.42;
      lobes.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.85, r: r.size * (0.14 + rnd() * 0.16) });
    }
    return { ...r, lobes };
  });
}

export function drawReef(layers, reef, W, H) {
  const ctx = layers.deep;
  ctx.save();
  ctx.globalAlpha = 0.46;
  for (const r of reef) {
    ctx.fillStyle = r.color;
    // One path per coral so overlapping lobes do not double up the alpha.
    ctx.beginPath();
    for (const l of r.lobes) {
      const x = r.x * W + l.x, y = r.y * H + l.y;
      ctx.moveTo(x + l.r, y);
      ctx.arc(x, y, l.r, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.restore();
}
