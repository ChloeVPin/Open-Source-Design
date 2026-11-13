import { hash, noise3, rng } from '../engine/noise.js';
import { createShark, drawShark } from '../creatures/shark.js';

// "haj" — sharks on paper.

const DASH = { ch: '-', color: '#1c1c1c', alpha: 0.85 };
const SPECK = { dot: 3, color: '#000', alpha: 0.1 };

export default {
  id: 'haj',
  name: 'haj',

  style: {
    font: '600 9px "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    inset: 0.5,
    solid: 0.68,
    jitter: 0.3,
    shimmer: 0.6,
    backdrop: 252,
    // [upper brightness bound, glyphs to choose from]
    ramps: [
      [0.2, '8@%8'],
      [0.4, 'S%X8t%'],
      [0.56, 'S%tXS%t'],
      [0.7, ';:St%;:'],
      [1.01, '#@8#'],
    ],
    tone: 'mono',
    flip: 0.93,
    paper: '#ffffff',
    ink: '#111111',
    inkChance: 0.06,
    accentRate: 0.03,
    accentFill: 0.012,
    border: 0,
    edge: { max: 0.42, ringFrom: 0.3, density: 0.6, chars: "'`,.", ring: 'o', color: '#1c1c1c' },
  },

  shadow: null,

  /** Sparse dashes drifting across the paper, gathering into loose patches. */
  ambient(cx, cy, t) {
    const n = noise3(cx * 0.055 + t * 0.012, cy * 0.085, t * 0.03);
    const h = hash(cx, cy, 3);
    if (n > 0.78) {
      if (h < 0.2) return DASH;
      if (h > 0.62) return SPECK;
    } else if (n > 0.66 && h < 0.06) {
      return DASH;
    }
    return hash(cx, cy, Math.floor(t * 0.2 + h * 9)) < 0.0035 ? DASH : null;
  },

  createScene(seed) {
    const rnd = rng(seed);
    const sharks = [
      createShark(rnd, 'leopard', 340),
      createShark(rnd, 'blueHammerhead', 320),
      createShark(rnd, 'grayHammerhead', 300),
      createShark(rnd, 'leopard', 250),
    ];
    return {
      step(dt, t, W, H) {
        for (const s of sharks) s.sw.step(dt, t, W, H);
      },
      draw(layers, t) {
        for (const s of sharks) drawShark(layers, s, t);
      },
    };
  },
};
