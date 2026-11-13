import { hash } from './noise.js';

/** One art pixel, in CSS pixels. */
export const PX = 3;

// 4×4 ordered-dither thresholds in (0, 1).
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (x, y) => BAYER[((y & 3) << 2) | (x & 3)];

/** Smooth 2D value noise in [0, 1], used to ragged up the outline of the moss. */
function patch(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = x - xi, v = y - yi;
  const a = hash(xi, yi, 3), b = hash(xi + 1, yi, 3), c = hash(xi, yi + 1, 3), d = hash(xi + 1, yi + 1, 3);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// The whole picture uses eight flat colours. Packed as little-endian ABGR.
const rgb = (r, g, b) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
const BLACK = rgb(0, 0, 0);
const GRAY = rgb(134, 134, 134);
const OLIVE = rgb(128, 150, 0);
const LIME = rgb(136, 255, 0);
const YELLOW = rgb(242, 255, 4);
const GREEN = rgb(0, 168, 0);
const MAROON = rgb(104, 0, 22);
const PINK = rgb(244, 138, 138);

/**
 * A tiny software rasteriser. Shapes are accumulated as smooth fields (how
 * much wood, how dark, how much moss, how yellow) and only turned into
 * colours at the end, where an ordered dither picks between neighbouring
 * palette entries. That last step is what gives the picture its chequered,
 * 1990s-paint-program texture.
 */
export class Raster {
  constructor(canvas, width, height) {
    canvas.width = width;
    canvas.height = height;
    this.w = width;
    this.h = height;
    this.ctx = canvas.getContext('2d');
    this.image = this.ctx.createImageData(width, height);
    this.out = new Uint32Array(this.image.data.buffer);
    const n = width * height;
    this.cover = new Float32Array(n); // wood coverage
    this.shade = new Float32Array(n); // 0 = underside, 1 = lit top
    this.mossD = new Float32Array(n); // moss density
    this.mossT = new Float32Array(n); // moss tone: 0 dark green … 1 yellow
  }

  clear() {
    this.cover.fill(0);
    this.mossD.fill(0);
  }

  /** A disc of wood. Below one pixel wide it becomes partial coverage, which dithers into a dotted line. */
  wood(cx, cy, r, strength = 1) {
    const { w, h, cover, shade } = this;
    if (r < 0.75) {
      const x = Math.floor(cx), y = Math.floor(cy);
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = y * w + x, c = (0.25 + r) * strength;
      if (c > cover[i]) { cover[i] = c; shade[i] = 0.8; }
      return;
    }
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(h - 1, Math.ceil(cy + r));
    const rr = r * r;
    const lift = Math.max(0, 0.36 - r * 0.1); // slender wood has little underside to shadow
    for (let y = y0; y <= y1; y++) {
      const dy = y + 0.5 - cy;
      for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - cx;
        if (dx * dx + dy * dy > rr) continue;
        const i = y * w + x;
        if (strength > cover[i]) cover[i] = strength;
        shade[i] = 0.6 + lift - (dy / r) * 0.8; // light comes from above
      }
    }
  }

  /** A soft clump of moss: dense in the middle, thinning to scattered pixels at the rim. */
  moss(cx, cy, r, density, tone) {
    const { w, h, mossD, mossT } = this;
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(h - 1, Math.ceil(cy + r));
    const rr = r * r;
    for (let y = y0; y <= y1; y++) {
      const dy = y + 0.5 - cy;
      for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - cx;
        const v = (1 - (dx * dx + dy * dy) / rr) * density;
        if (v <= 0) continue;
        const i = y * w + x;
        if (v > mossD[i]) { mossD[i] = v; mossT[i] = tone; }
      }
    }
  }

  /**
   * Turn the fields into pixels. (ox, oy) is the buffer's position in the
   * world, so the dither pattern stays glued to the branch while the view pans.
   */
  resolve(ox, oy) {
    const { w, h, out, cover, shade, mossD, mossT } = this;
    for (let y = 0, i = 0; y < h; y++) {
      const wy = y + oy;
      for (let x = 0; x < w; x++, i++) {
        const wx = x + ox;
        const b = bayer(wx, wy);
        let c = 0;
        if (mossD[i] > Math.max(0.06, 0.1 + b * 0.7 + (patch(wx * 0.3, wy * 0.3) - 0.5) * 0.9)) {
          const t = mossT[i] + (bayer(wx + 2, wy + 1) - 0.5) * 0.62 + (hash(wx, wy, 5) - 0.5) * 0.16;
          c = t < 0.14 ? GREEN : t < 0.5 ? OLIVE : t < 0.9 ? LIME : YELLOW;
        } else if (cover[i] > b * 0.95) {
          const s = shade[i] + (b - 0.5) * 0.9;
          const k = hash(wx, wy, 9);
          c = s < 0.42 ? BLACK : k < 0.04 ? MAROON : k < 0.075 ? PINK : k < 0.15 ? OLIVE : GRAY;
        }
        out[i] = c;
      }
    }
    this.ctx.putImageData(this.image, 0, 0);
  }
}
