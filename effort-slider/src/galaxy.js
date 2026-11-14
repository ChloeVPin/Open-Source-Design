// Everything that only exists at the last stop: the mosaic that takes over the
// track, and the flash, sparks and rays around the brain. Both draw in the
// card's own 1x pixels; `resize` scales the backing store to the real ones.

const TAU = Math.PI * 2;

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Small seeded generator, so the mosaic and rays look the same on every visit. */
function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fitCanvas(canvas, width, height, scale) {
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(w / width, 0, 0, h / height, 0, 0);
  return ctx;
}

/* ------------------------------------------------------------------ mosaic */

const COLS = 49;
const ROWS = 5;
const PITCH = 4; // a 3px tile and a 1px gap
const TILE = 3;

const TILE_COLOURS = [
  { rgb: '226 122 223', weight: 0.25 }, // pink
  { rgb: '134 220 244', weight: 0.25 }, // cyan
  { rgb: '230 228 246', weight: 0.22 }, // white
  { rgb: '145 115 224', weight: 0.28 }, // violet
];

// A tile holds one brightness for a while, then steps to another.
const BRIGHTNESS = [0.3, 0.5, 0.75, 1];
const STEP_TIME = 0.06;

// The night sky behind the tiles: [position along the track, colour].
const SKY = [
  [0, '#0f0920'],
  [0.36, '#0f0920'],
  [0.47, '#1d102c'],
  [0.55, '#281235'],
  [0.63, '#36194a'],
  [0.71, '#361a5d'],
  [0.79, '#322369'],
  [0.84, '#3d3388'],
  [0.88, '#47479a'],
  [1, '#5a5cc0'],
];

export class Mosaic {
  constructor(canvas, seed = 11) {
    this.canvas = canvas;
    this.rnd = random(seed);
    this.tiles = [];

    for (let col = 0; col < COLS; col++) {
      const along = col / (COLS - 1);
      // Sparse and dim on the left, crowded and bright by the brain.
      const chance = 0.33 + 0.6 * smoothstep(0.25, 0.9, along);
      const strength = 0.28 + 0.72 * smoothstep(0.1, 0.9, along);
      for (let row = 0; row < ROWS; row++) {
        if (this.rnd() > chance) continue;
        const level = BRIGHTNESS[Math.floor(this.rnd() * BRIGHTNESS.length)];
        this.tiles.push({
          x: col * PITCH + (PITCH - TILE) / 2,
          y: row * PITCH + (PITCH - TILE) / 2,
          rgb: this.pickColour(),
          strength,
          pause: 3 - 2.55 * along, // seconds between steps, on average
          from: level,
          to: level,
          changedAt: -1,
          nextAt: this.rnd() * (3 - 2.55 * along),
        });
      }
    }
  }

  pickColour() {
    let roll = this.rnd();
    for (const colour of TILE_COLOURS) {
      roll -= colour.weight;
      if (roll <= 0) return colour.rgb;
    }
    return TILE_COLOURS[0].rgb;
  }

  resize(scale) {
    this.ctx = fitCanvas(this.canvas, COLS * PITCH, ROWS * PITCH, scale);
    const sky = this.ctx.createLinearGradient(0, 0, COLS * PITCH, 0);
    for (const [at, colour] of SKY) sky.addColorStop(at, colour);
    this.sky = sky;
  }

  draw(time) {
    const { ctx } = this;
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.sky;
    ctx.fillRect(0, 0, COLS * PITCH, ROWS * PITCH);

    for (const tile of this.tiles) {
      if (time >= tile.nextAt) {
        tile.from = tile.to;
        do tile.to = BRIGHTNESS[Math.floor(this.rnd() * BRIGHTNESS.length)];
        while (tile.to === tile.from);
        tile.changedAt = time;
        tile.nextAt = time - Math.log(1 - this.rnd()) * tile.pause;
      }
      const step = clamp01((time - tile.changedAt) / STEP_TIME);
      const level = tile.from + (tile.to - tile.from) * step;
      ctx.globalAlpha = tile.strength * level;
      ctx.fillStyle = `rgb(${tile.rgb})`;
      ctx.beginPath();
      ctx.roundRect(tile.x, tile.y, TILE, TILE, 0.8);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/* ----------------------------------------------------------------- effects */

// Fourteen dotted rays fan out from the brain. They cycle through three
// colours and get shorter with each: [rgb, dots, opacity of the first dot].
const RAY_KINDS = [
  ['158 157 170', 10, 0.85], // grey
  ['90 150 157', 8, 0.8], // teal
  ['122 108 165', 6, 0.8], // violet
];
const RAY_COUNT = 14;
const RAY_START = 17; // distance of the first dot from the brain's centre
const RAY_GAP = 3;

// The ring of sparks thrown off when the galaxy opens.
const SPARK_COLOURS = ['91 53 240', '240 128 224', '255 255 255', '126 240 246', '169 140 248'];
const SPARK_COUNT = 24;
const SPARK_RADIUS = 10;
const SPARK_SIZE = 1.75;
const SPARK_LIFE = 0.55;

// Glints that come and go on the brain itself.
const GLINT_COLOURS = ['255 255 255', '255 255 255', '255 255 255', '140 240 255', '215 200 255'];
const GLINT_COUNT = 6;

// The brain's lobes as circles, in the icon's 24-unit box measured from its
// centre; glints are only placed inside them. [x, y, radius], right-hand side.
const LOBES = [
  [3, -7, 3],
  [5, -3, 4],
  [6, 2, 4],
  [4, 6, 4],
];

const FLASH_RADIUS = 34;
const HALO_RADIUS = 28;

export class Effects {
  constructor(canvas, seed = 5) {
    this.canvas = canvas;
    this.rnd = random(seed);
    this.burstAt = -Infinity;
    this.glints = [];

    this.rays = Array.from({ length: RAY_COUNT }, (_, i) => {
      const [rgb, dots, alpha] = RAY_KINDS[i % RAY_KINDS.length];
      return {
        angle: ((3 + (i * 360) / RAY_COUNT) * Math.PI) / 180,
        rgb,
        alpha,
        dots: dots + Math.floor(this.rnd() * 3) - 1,
        phase: this.rnd() * TAU,
      };
    });

    this.sparks = Array.from({ length: SPARK_COUNT }, (_, i) => ({
      angle: (i / SPARK_COUNT) * TAU - Math.PI / 2 + (this.rnd() - 0.5) * 0.1,
      speed: 55 * (0.7 + this.rnd() * 0.6),
      rgb: SPARK_COLOURS[i % SPARK_COLOURS.length],
    }));
  }

  resize(scale, width, height) {
    this.width = width;
    this.height = height;
    this.ctx = fitCanvas(this.canvas, width, height, scale);
  }

  /** Fire the flash and the ring of sparks. */
  burst(time) {
    this.burstAt = time;
  }

  /** True while the opening burst is still playing out. */
  bursting(time) {
    return time - this.burstAt < 1.2;
  }

  /**
   * @param time    seconds
   * @param brain   { x, y, scale } — centre in canvas pixels and current size
   * @param amount  0..1, how far into the galaxy state we are
   * @param card    { x, y, width, height, radius } — the glow is clipped to it
   */
  draw(time, brain, amount, card) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.width, this.height);
    const since = time - this.burstAt;
    if (amount <= 0 && since > SPARK_LIFE) return;

    // Two decays: a hard white pop, then a slower afterglow.
    const flash = since < 3 ? 0.36 * Math.exp(-since / 0.03) + 0.64 * Math.exp(-since / 0.21) : 0;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(card.x, card.y, card.width, card.height, card.radius);
    ctx.clip();
    this.glow(brain, HALO_RADIUS, '110 100 230', 0.13 * amount);
    // The flash and the sparks belong to the moment of arrival, so they do
    // not wait for the rest of the galaxy to fade in.
    if (flash > 0.004) this.glow(brain, FLASH_RADIUS, '255 255 255', 0.62 * flash);
    ctx.restore();

    this.drawRays(time, since, brain, amount);
    this.drawGlints(time, brain, amount);
    if (since < SPARK_LIFE) this.drawSparks(since, brain);
    ctx.globalAlpha = 1;
  }

  glow({ x, y }, radius, rgb, alpha) {
    const { ctx } = this;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgb(${rgb} / ${alpha})`);
    gradient.addColorStop(1, `rgb(${rgb} / 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  square(x, y, size) {
    this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
  }

  drawRays(time, since, brain, amount) {
    const { ctx } = this;
    for (const ray of this.rays) {
      const shimmer = 0.9 + 0.1 * Math.sin(time * 1.3 + ray.phase);
      const cos = Math.cos(ray.angle);
      const sin = Math.sin(ray.angle);
      ctx.fillStyle = `rgb(${ray.rgb})`;
      for (let i = 0; i < ray.dots; i++) {
        // On the burst the dots switch on one after another, moving outwards.
        const reveal = clamp01((since - 0.03 - i * 0.025) / 0.08);
        const fade = Math.pow(1 - i / ray.dots, 1.5);
        ctx.globalAlpha = ray.alpha * fade * shimmer * reveal * amount;
        const distance = RAY_START + i * RAY_GAP;
        const size = i < 3 ? 1.75 : i < 5 ? 1.25 : 1;
        this.square(brain.x + cos * distance, brain.y + sin * distance, size);
      }
    }
  }

  drawSparks(since, brain) {
    const { ctx } = this;
    const t = Math.max(0, since - 0.04);
    const travel = t - (t * t) / (2 * SPARK_LIFE); // eases to a stop
    ctx.globalAlpha = 1 - smoothstep(0.12, SPARK_LIFE, since);
    for (const spark of this.sparks) {
      const distance = SPARK_RADIUS * (brain.scale / 1.34 + 0.25) + spark.speed * travel;
      ctx.fillStyle = `rgb(${spark.rgb})`;
      this.square(brain.x + Math.cos(spark.angle) * distance, brain.y + Math.sin(spark.angle) * distance, SPARK_SIZE);
    }
  }

  drawGlints(time, brain, amount) {
    const { ctx } = this;
    this.glints = this.glints.filter((glint) => time < glint.until);
    while (this.glints.length < GLINT_COUNT && amount > 0.5) {
      const [x, y] = this.pointInBrain();
      this.glints.push({
        x,
        y,
        rgb: GLINT_COLOURS[Math.floor(this.rnd() * GLINT_COLOURS.length)],
        from: time + this.rnd() * 0.25,
        until: time + 0.25 + this.rnd() * 0.5,
      });
    }
    const unit = brain.scale; // one icon unit in pixels (the icon is 24px at scale 1)
    for (const glint of this.glints) {
      if (time < glint.from) continue;
      ctx.globalAlpha = 0.92 * amount;
      ctx.fillStyle = `rgb(${glint.rgb})`;
      this.square(brain.x + glint.x * unit, brain.y + glint.y * unit, 1.3 * unit);
    }
  }

  pointInBrain() {
    for (;;) {
      const x = (this.rnd() * 2 - 1) * 9;
      const y = (this.rnd() * 2 - 1) * 9;
      if (Math.abs(x) < 1.8) continue; // keep off the line between the halves
      if (LOBES.some(([cx, cy, r]) => Math.hypot(Math.abs(x) - cx, y - cy) < r - 1.4)) return [x, y];
    }
  }
}
