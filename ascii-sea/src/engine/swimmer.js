import { noise3 } from './noise.js';

const TAU = Math.PI * 2;
const TRAIL_STEP = 3; // px between stored trail points
const TRAIL_MAX = 480; // enough for the longest body (TRAIL_STEP * TRAIL_MAX px)

/**
 * A wandering point with a heading. It keeps a trail of where its head has
 * been so a body can be laid along the path it actually swam — that is what
 * makes long animals bend through their turns instead of pivoting rigidly.
 */
export class Swimmer {
  constructor({ rnd, speed, turn = 1, turnFreq = 0.12, length = 100, margin = length * 1.1 }) {
    this.rnd = rnd;
    this.speed = speed;
    this.turn = turn;
    this.turnFreq = turnFreq;
    this.length = length;
    this.margin = margin;
    this.seed = rnd() * 1000;
    this.phase = rnd() * TAU;
    this.x = 0;
    this.y = 0;
    this.heading = 0;
    this.trail = [];
    this.pts = [];
    this.placed = false;
    this.outside = 0;
  }

  /** Drop the swimmer somewhere new: inside the view, or just off an edge aimed inward. */
  place(W, H, inside) {
    const { rnd, margin } = this;
    if (inside) {
      this.x = rnd() * W;
      this.y = rnd() * H;
      this.heading = rnd() * TAU;
    } else {
      const side = Math.floor(rnd() * 4);
      const m = margin * 0.95;
      if (side === 0) { this.x = -m; this.y = rnd() * H; }
      else if (side === 1) { this.x = W + m; this.y = rnd() * H; }
      else if (side === 2) { this.x = rnd() * W; this.y = -m; }
      else { this.x = rnd() * W; this.y = H + m; }
      const tx = W * (0.2 + 0.6 * rnd());
      const ty = H * (0.2 + 0.6 * rnd());
      this.heading = Math.atan2(ty - this.y, tx - this.x);
    }
    // Lay a straight trail behind the head so the body exists immediately.
    this.trail.length = 0;
    const n = Math.ceil((this.length * 1.3) / TRAIL_STEP);
    const cx = Math.cos(this.heading), cy = Math.sin(this.heading);
    for (let i = n; i >= 0; i--) this.trail.push([this.x - cx * i * TRAIL_STEP, this.y - cy * i * TRAIL_STEP]);
    this.outside = 0;
    this.placed = true;
  }

  step(dt, t, W, H) {
    if (!this.placed) this.place(W, H, true);
    const n = noise3(t * this.turnFreq, this.seed, 0.5) - 0.5;
    this.heading += n * 2 * this.turn * dt;
    this.x += Math.cos(this.heading) * this.speed * dt;
    this.y += Math.sin(this.heading) * this.speed * dt;

    const last = this.trail[this.trail.length - 1];
    if (Math.hypot(this.x - last[0], this.y - last[1]) >= TRAIL_STEP) {
      this.trail.push([this.x, this.y]);
      if (this.trail.length > TRAIL_MAX) this.trail.shift();
    }

    // Recycle once fully off-screen, or if it has been loitering out of view.
    const m = this.margin;
    const out = this.x < 0 || this.x > W || this.y < 0 || this.y > H;
    this.outside = out ? this.outside + dt : 0;
    const gone = this.x < -m || this.x > W + m || this.y < -m || this.y > H + m;
    if (gone || this.outside > 14) this.place(W, H, false);
  }

  /**
   * Sample `n` points along the body, head first. Each point carries a unit
   * tangent (pointing tailward), a left normal and `s` in [0, 1]. A travelling
   * wave is added on top of the path so the tail beats.
   */
  spine(n, length, t, { amp = 0.05, freq = 1, waves = 1 } = {}) {
    const { trail, pts } = this;
    while (pts.length < n) pts.push({ x: 0, y: 0, tx: 1, ty: 0, nx: 0, ny: 1, s: 0 });
    pts.length = n;

    let seg = trail.length - 1; // walk backwards from the newest trail point
    let ax = this.x, ay = this.y; // start of the current segment (toward the head)
    let acc = 0;
    for (let i = 0; i < n; i++) {
      const d = (i / (n - 1)) * length;
      let bx = trail[seg][0], by = trail[seg][1];
      let len = Math.hypot(bx - ax, by - ay);
      while (acc + len < d && seg > 0) {
        acc += len;
        ax = bx; ay = by;
        seg--;
        bx = trail[seg][0]; by = trail[seg][1];
        len = Math.hypot(bx - ax, by - ay);
      }
      const f = len > 0 ? Math.min(1.5, (d - acc) / len) : 0;
      const p = pts[i];
      p.x = ax + (bx - ax) * f;
      p.y = ay + (by - ay) * f;
      p.s = i / (n - 1);
    }

    this.frame();
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const env = 0.12 + 0.88 * Math.pow(p.s, 1.6);
      const off = amp * length * env * Math.sin(t * freq * TAU - p.s * waves * TAU + this.phase);
      p.x += p.nx * off;
      p.y += p.ny * off;
    }
    this.frame();
    return pts;
  }

  /** Recompute tangents and normals from neighbouring points. */
  frame() {
    const pts = this.pts, n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b.x - a.x, ty = b.y - a.y;
      const l = Math.hypot(tx, ty) || 1;
      tx /= l; ty /= l;
      const p = pts[i];
      p.tx = tx; p.ty = ty;
      p.nx = -ty; p.ny = tx;
    }
  }
}
