import { rng } from './noise.js';
import { PX } from './raster.js';
import { UNIT } from './tree.js';

const STEP = 1.5; // CSS px between spine samples

/** Seconds for wood to grow the full length of a branch. */
export const GROW_TIME = 1.3;

const easeOut = (u) => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);
const easeOutInverse = (f) => 1 - Math.cbrt(1 - Math.min(1, Math.max(0, f)));
const smooth = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };

function catmullRom(a, b, c, d, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
}

/**
 * Turn a branch definition into world-space geometry: a densely sampled
 * spine, the clumps of moss that will grow on it, and its twigs. All of it
 * is derived from `seed`, so a branch always grows back the same.
 */
export function buildBranch(def, ox, oy, seed) {
  const rnd = rng(seed);
  const P = def.path.map(([x, y]) => [ox + x * UNIT, oy + y * UNIT]);
  const xs = [], ys = [], ws = [], ms = [];
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(P.length - 1, i + 2)];
    const steps = Math.max(1, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / STEP));
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      xs.push(catmullRom(a[0], b[0], c[0], d[0], t));
      ys.push(catmullRom(a[1], b[1], c[1], d[1], t));
      ws.push((def.width[i] + (def.width[i + 1] - def.width[i]) * t) * UNIT);
      ms.push(def.moss[i] + (def.moss[i + 1] - def.moss[i]) * t);
    }
  }
  const n = xs.length;

  const nearest = (x, y) => {
    let best = 0, bd = Infinity;
    for (let i = 0; i < n; i++) {
      const d = (xs[i] - x) ** 2 + (ys[i] - y) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  };
  const start = def.growFrom ? nearest(ox + def.growFrom[0] * UNIT, oy + def.growFrom[1] * UNIT) : 0;

  // Moss: more clumps, and bigger ones, where the branch is marked as overgrown.
  const blobs = [];
  const clump = (i, x, y, r) => {
    const roll = rnd();
    let tone = 0.4 + rnd() * 0.24 + (i / n > 0.6 ? 0.1 : 0);
    if (roll < 0.07) tone = 0.82 + rnd() * 0.2; // a yellow patch
    else if (roll < 0.2) tone = 0.2 + rnd() * 0.16; // a patch in shadow
    blobs.push({ i, x, y, r, tone, delay: rnd() * 1.1 });
  };
  for (let i = 0; i < n; i += 2) {
    const m = ms[i];
    if (rnd() >= m * 0.5) continue;
    const r = (5 + rnd() * rnd() * 22) * (0.4 + m * 0.8);
    const lift = rnd() < 0.1 ? 0 : ws[i] * 0.5 + r * (0.3 + rnd() * 0.5); // most moss sits on top
    clump(i, xs[i] + (rnd() - 0.5) * r * 0.9, ys[i] - lift, r);
  }
  if (!def.growFrom) {
    // A mound where the branch springs from its folder.
    for (let k = 0; k < 7; k++) clump(0, ox + (rnd() - 0.4) * 26, oy - 16 - rnd() * 16, 9 + rnd() * 9);
  }

  const twigs = (def.twigs || []).map((t) => {
    const x0 = ox + t.from[0] * UNIT, y0 = oy + t.from[1] * UNIT;
    return { x0, y0, x1: ox + t.to[0] * UNIT, y1: oy + t.to[1] * UNIT, i: nearest(x0, y0), leaf: !!t.leaf, bend: (rnd() - 0.5) * 14 };
  });

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = start; i < n; i++) {
    minX = Math.min(minX, xs[i]); maxX = Math.max(maxX, xs[i]);
    minY = Math.min(minY, ys[i]); maxY = Math.max(maxY, ys[i]);
  }

  return { xs, ys, ws, n, start, blobs, twigs, nearest, bbox: { minX, minY, maxX, maxY } };
}

/** Fraction of the growable length at sample `i`. */
export const fractionAt = (br, i) => Math.max(0, (i - br.start) / (br.n - 1 - br.start));

/** Seconds after a branch starts growing at which its wood reaches sample `i`. */
export const reachTime = (br, i) => GROW_TIME * easeOutInverse(fractionAt(br, i));

/**
 * Paint a branch into the raster.
 *   age  — seconds since it began to grow (wood first, twigs and moss trailing behind)
 *   life — 1 while alive; falls to 0 as a closed folder's branch withers
 */
export function drawBranch(raster, br, age, life, camX, camY) {
  const { xs, ys, ws, n, start } = br;
  const grown = easeOut(age / GROW_TIME);
  const end = start + (n - 1 - start) * grown;
  const W = raster.w, H = raster.h;

  for (let i = start; i <= end; i++) {
    const x = (xs[i] - camX) / PX, y = (ys[i] - camY) / PX;
    if (x < -12 || y < -12 || x > W + 12 || y > H + 12) continue;
    const taper = Math.min(1, 0.35 + (end - i) / 14); // the growing tip is thinner
    raster.wood(x, y, (ws[i] * taper) / 2 / PX, life);
  }

  for (const t of br.twigs) {
    const g = Math.min(1, (age - reachTime(br, t.i) - 0.1) / 0.45);
    if (g <= 0) continue;
    const dx = t.x1 - t.x0, dy = t.y1 - t.y0, len = Math.hypot(dx, dy);
    const steps = Math.ceil((len / PX) * 1.3);
    for (let k = 0; k <= steps * g; k++) {
      const u = k / steps, arc = Math.sin(u * Math.PI) * t.bend;
      const x = t.x0 + dx * u - (dy / len) * arc, y = t.y0 + dy * u + (dx / len) * arc;
      raster.wood((x - camX) / PX, (y - camY) / PX, 0.3 - 0.12 * u, life);
    }
    if (t.leaf && g >= 1) raster.moss((t.x1 - camX) / PX, (t.y1 - camY) / PX, 2.6, life, 0.45);
  }

  for (const b of br.blobs) {
    if (b.i > end) continue;
    const a = smooth((age - reachTime(br, b.i) - b.delay) / 0.9);
    if (a < 0.05) continue;
    // Withering moss yellows as it thins out.
    raster.moss((b.x - camX) / PX, (b.y - camY) / PX, (b.r * a) / PX, (0.6 + 0.8 * a) * life, b.tone + (1 - life) * 0.5);
  }
}
