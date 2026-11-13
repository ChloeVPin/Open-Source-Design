import { hash, noise3, rng } from '../engine/noise.js';
import { createCetacean, drawCetacean } from '../creatures/cetacean.js';
import { createReef, drawReef } from '../creatures/coral.js';
import { createSchool, drawSchool } from '../creatures/fish.js';
import { createFlower, drawFlower } from '../creatures/flower.js';
import { createManta, drawManta } from '../creatures/manta.js';
import { createTurtle, drawTurtle } from '../creatures/turtle.js';

// "honu" — sea turtles in a sunlit lagoon.

const RIPPLE = '#dff9ff';
const TILDE = { ch: '~', color: RIPPLE, alpha: 0.4 };
const DASH = { ch: '-', color: RIPPLE, alpha: 0.34 };
const DOT = { ch: '.', color: RIPPLE, alpha: 0.34 };

const style = {
  font: '600 9px "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
  inset: 0.5,
  solid: 0.68,
  jitter: 0.2,
  shimmer: 0.6,
  backdrop: null,
  // [upper brightness bound, glyphs to choose from]
  ramps: [
    [0.3, 'SXS%tS'],
    [0.5, 'tS%tSt'],
    [0.8, 't%;tt%'],
    [1.01, ':;t%:;'],
  ],
  tone: 'tinted',
  flip: 0.5,
  accentRate: 0.028,
  accentFill: 0,
  border: 0.8,
  edge: { max: 0.42, ringFrom: 0.3, density: 0.5, chars: ':.', ring: 'o', color: null },
};

export default {
  id: 'honu',
  name: 'honu',
  style,
  // Things far below are fainter and never fully solid.
  deepStyle: { ...style, solid: 0.92, jitter: 0.12, accentRate: 0.02, border: 0.9, edge: { ...style.edge, max: 0.15, ringFrom: 0.1, density: 0.2 } },

  // Every animal casts a blocky shadow down and to the right.
  shadow: { dx: 3, dy: 3, color: '#075a88', alpha: 0.34 },

  /** Patches of surface ripple that slide slowly across the water. */
  ambient(cx, cy, t) {
    const n = noise3(cx * 0.07 - t * 0.02, cy * 0.15, t * 0.03);
    if (n > 0.84) return TILDE;
    if (n > 0.8) return DASH;
    if (n > 0.775) return hash(cx, cy, 1) < 0.5 ? DOT : null;
    return null;
  },

  createScene(seed) {
    const rnd = rng(seed);
    const whale = createCetacean(rnd, 'whale', 560);
    const reef = createReef(seed);
    const manta = createManta(rnd, 150);
    const turtles = [createTurtle(rnd, 176), createTurtle(rnd, 164), createTurtle(rnd, 130)];
    const dolphins = [createCetacean(rnd, 'dolphin', 250), createCetacean(rnd, 'dolphin', 220)];
    const schools = [createSchool(rnd, 15), createSchool(rnd, 9)];
    const flowers = [
      createFlower(rnd, 'hibiscus', 98),
      createFlower(rnd, 'hibiscus', 86),
      createFlower(rnd, 'plumeria', 64),
      createFlower(rnd, 'plumeria', 58),
      createFlower(rnd, 'plumeria', 66),
    ];
    const swimmers = [whale, manta, ...turtles, ...dolphins, ...schools, ...flowers];
    const bubbles = Array.from({ length: 12 }, () => ({ x: rnd(), y: rnd(), speed: 5 + rnd() * 9, sway: rnd() * 6 }));
    const marks = bubbles.map(() => ({ x: 0, y: 0, ch: 'o', color: RIPPLE, alpha: 0.5 }));

    return {
      step(dt, t, W, H) {
        for (const s of swimmers) s.sw.step(dt, t, W, H);
      },
      draw(layers, t, W, H) {
        drawCetacean(layers, whale, t);
        drawReef(layers, reef, W, H);
        drawManta(layers, manta, t);
        for (const x of turtles) drawTurtle(layers, x, t);
        for (const x of dolphins) drawCetacean(layers, x, t);
        for (const x of schools) drawSchool(layers, x, t);
        for (const x of flowers) drawFlower(layers, x, t);
      },
      /** A few bubbles wandering up toward the surface. */
      glyphs(t, W, H) {
        bubbles.forEach((b, i) => {
          const rise = (b.y * (H + 40) + t * b.speed) % (H + 40);
          marks[i].x = b.x * W + Math.sin(t * 0.4 + b.sway) * 10;
          marks[i].y = H + 20 - rise;
        });
        return marks;
      },
    };
  },
};
