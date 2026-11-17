// The dots on the panel. Each feature has a settled pattern (patterns.js);
// when the feature changes, the old dots drop out at random over a sixth of a
// second, a little static crackles around the edges, and the new dots flicker
// in until the whole pattern holds. Then nothing is redrawn until next time.

import { PATTERNS } from './patterns.js';

const SIZE = 41; // cells per side
const PITCH = 16 / 660.5; // one cell, as a share of the panel's width
const INSET = 9.9 / 660.5; // centre of the first column
const RADIUS = 5 / 660.5;

const STRENGTH = { '#': 1, o: 0.44, ':': 0.23, '.': 0 };

const LEAVE = 0.17; // seconds for the old pattern to clear
const SETTLE = 0.95; // seconds until the new one holds

/** A cheap repeatable hash of two integers, 0..1. */
function hash(a, b) {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x165667b1, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

const smooth = (a, b, v) => {
  const t = Math.min(Math.max((v - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

export class Dots {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.from = null;
    this.to = 0;
    this.changedAt = -Infinity;
    this.changes = 0;
    this.running = false;
    this.calm = matchMedia('(prefers-reduced-motion: reduce)');

    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }

  resize() {
    const side = this.canvas.clientWidth;
    const scale = devicePixelRatio;
    this.side = side;
    this.canvas.width = Math.round(side * scale);
    this.canvas.height = Math.round(side * scale);
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    this.draw(performance.now() / 1000);
  }

  /** Switch to another feature's pattern. */
  show(index, { animate = true } = {}) {
    if (index === this.to && this.from !== null) return;
    this.from = animate && !this.calm.matches ? this.to : null;
    this.to = index;
    this.changes++;
    this.changedAt = this.from === null ? -Infinity : performance.now() / 1000;
    if (this.from === null) {
      this.from = index;
      this.draw(0);
    } else if (!this.running) {
      this.running = true;
      requestAnimationFrame(this.frame);
    }
  }

  frame = (now) => {
    const time = now / 1000;
    this.draw(time);
    if (time - this.changedAt < SETTLE + 0.1) requestAnimationFrame(this.frame);
    else this.running = false;
  };

  /** How strongly the dot at (col, row) shows, `since` seconds after a change. */
  strength(col, row, since) {
    const cell = row * SIZE + col;
    const target = STRENGTH[PATTERNS[this.to][row][col]];
    if (since >= SETTLE) return target;

    const seed = cell + this.changes * 1777;
    const slot = Math.floor(since / 0.05); // flicker changes twenty times a second
    let shown = 0;

    // The old pattern: each dot holds until its own moment, then is gone.
    const old = this.from === null ? 0 : STRENGTH[PATTERNS[this.from][row][col]];
    if (old && since < hash(seed, 1) * LEAVE) shown = old;

    // The new pattern: more and more likely to be lit, until it stays lit.
    if (target) {
      const holdsFrom = 0.45 + hash(seed, 2) * 0.45;
      if (since >= holdsFrom) shown = target;
      else if (hash(seed, 100 + slot) < 0.72 * smooth(0.25, 0.9, since)) shown = hash(seed, 3) < 0.3 ? 1 : target;
    }

    // Static: stray dots near the edges that belong to neither pattern.
    const edge = Math.min(col, row, SIZE - 1 - col, SIZE - 1 - row);
    if (!shown && edge >= 1 && edge <= 6) {
      const crackle = 0.03 * smooth(0.02, 0.3, since) * (1 - smooth(0.5, 0.85, since));
      if (hash(seed, 500 + slot) < crackle) shown = hash(seed, 4) < 0.5 ? 1 : 0.44;
    }
    return shown;
  }

  draw(time) {
    const { ctx, side } = this;
    const since = time - this.changedAt;
    ctx.clearRect(0, 0, side, side);
    ctx.fillStyle = '#fff';
    const radius = RADIUS * side;
    for (let row = 1; row < SIZE - 1; row++) {
      for (let col = 1; col < SIZE - 1; col++) {
        const alpha = this.strength(col, row, since);
        if (!alpha) continue;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc((INSET + col * PITCH) * side, (INSET + row * PITCH) * side, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
