import { hash } from './noise.js';

/** One character cell, in CSS pixels. The whole look hangs off this grid. */
export const CELL_W = 8;
export const CELL_H = 12;

const LAYERS = ['deep', 'body', 'ghost', 'shadow'];
const ACCENTS = ['#22c55e', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6'];
const MIN_ALPHA = 0.1;

/**
 * Renders a scene as a mosaic of character cells.
 *
 * The scene paints ordinary vector shapes into tiny offscreen canvases where
 * one pixel is one cell (so anti-aliasing gives us per-cell coverage for
 * free). Each frame those pixels are read back and every covered cell is
 * drawn as a coloured tile with a glyph picked from a brightness ramp.
 *
 * Layers, bottom to top:
 *   deep   — tiles that never cast a shadow (distant animals, coral)
 *   shadow — flat blocks, derived from `body` by offsetting it
 *   ghost  — halftone dots (translucent fin tips, wakes)
 *   body   — the animals
 */
export class AsciiSea {
  constructor(canvas, theme, scene, { pixelRatio } = {}) {
    this.pixelRatio = pixelRatio;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = theme;
    this.scene = scene;
    this.layers = {};
    this.resize();
  }

  resize() {
    const { canvas } = this;
    const dpr = this.pixelRatio || Math.min(window.devicePixelRatio || 1, 3);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    this.width = w;
    this.height = h;
    this.dpr = dpr;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    this.cols = Math.max(1, Math.ceil(w / CELL_W));
    this.rows = Math.max(1, Math.ceil(h / CELL_H));
    for (const name of LAYERS) {
      const c = document.createElement('canvas');
      c.width = this.cols;
      c.height = this.rows;
      this.layers[name] = { canvas: c, ctx: c.getContext('2d', { willReadFrequently: true }) };
    }
  }

  render(t) {
    const { ctx, cols, rows, layers, theme, scene, width, height, dpr } = this;
    const style = theme.style;

    for (const name of LAYERS) {
      const c = layers[name].ctx;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = 1;
      c.clearRect(0, 0, cols, rows);
      c.setTransform(1 / CELL_W, 0, 0, 1 / CELL_H, 0, 0);
    }
    scene.draw({ deep: layers.deep.ctx, body: layers.body.ctx, ghost: layers.ghost.ctx }, t, width, height);

    let shadow = null;
    if (theme.shadow) {
      const c = layers.shadow.ctx;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(layers.body.canvas, theme.shadow.dx, theme.shadow.dy);
      shadow = c.getImageData(0, 0, cols, rows).data;
    }
    const body = layers.body.ctx.getImageData(0, 0, cols, rows).data;
    const deep = layers.deep.ctx.getImageData(0, 0, cols, rows).data;
    const ghost = layers.ghost.ctx.getImageData(0, 0, cols, rows).data;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.font = style.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const i = (cy * cols + cx) * 4;
        const x = cx * CELL_W, y = cy * CELL_H;
        const ba = body[i + 3] / 255;

        if (ba < 0.9) {
          const da = deep[i + 3] / 255;
          if (da >= MIN_ALPHA) {
            this.cell(cx, cy, deep[i], deep[i + 1], deep[i + 2], da, t, theme.deepStyle || style);
          } else if (ba < 0.3) {
            const a = theme.ambient(cx, cy, t);
            if (a) this.mark(x, y, a);
          }
          if (shadow && shadow[i + 3] > 10) {
            ctx.globalAlpha = (shadow[i + 3] / 255) * theme.shadow.alpha;
            ctx.fillStyle = theme.shadow.color;
            ctx.fillRect(x, y, CELL_W, CELL_H);
          }
          const ga = ghost[i + 3] / 255;
          if (ga > 0.12) {
            const size = ga > 0.55 ? 3 : 2;
            ctx.globalAlpha = Math.min(1, ga * 1.3);
            ctx.fillStyle = `rgb(${ghost[i]},${ghost[i + 1]},${ghost[i + 2]})`;
            ctx.fillRect(x + (CELL_W - size) / 2, y + (CELL_H - size) / 2, size, size);
          }
        }
        if (ba >= MIN_ALPHA) this.cell(cx, cy, body[i], body[i + 1], body[i + 2], ba, t, style);
      }
    }

    // Free-floating glyphs (bubbles and the like), snapped to the grid.
    const glyphs = scene.glyphs ? scene.glyphs(t, width, height) : null;
    if (glyphs) {
      for (const g of glyphs) {
        const cx = Math.floor(g.x / CELL_W), cy = Math.floor(g.y / CELL_H);
        if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
        if (body[(cy * cols + cx) * 4 + 3] > 60) continue;
        this.mark(cx * CELL_W, cy * CELL_H, g);
      }
    }
    ctx.globalAlpha = 1;
  }

  /** A bare glyph or dot with no tile behind it. */
  mark(x, y, m) {
    const { ctx } = this;
    ctx.globalAlpha = m.alpha;
    ctx.fillStyle = m.color;
    if (m.dot) ctx.fillRect(x + (CELL_W - m.dot) / 2, y + (CELL_H - m.dot) / 2, m.dot, m.dot);
    else ctx.fillText(m.ch, x + CELL_W / 2, y + CELL_H / 2 + 0.5);
  }

  /** One sampled cell: a tile plus a glyph, or just a faint mark at the silhouette's edge. */
  cell(cx, cy, r, g, b, a, t, style) {
    const { ctx } = this;
    const x = cx * CELL_W, y = cy * CELL_H;
    // Each cell re-rolls its glyph on its own clock so the mosaic shimmers.
    const tick = Math.floor(t * style.shimmer + hash(cx, cy, 7) * 16);
    const h1 = hash(cx, cy, tick);
    const h2 = hash(cx, cy, tick + 9173);

    const edge = style.edge;
    if (a < edge.max) {
      if (h1 > edge.density) return;
      const ring = a >= edge.ringFrom;
      ctx.globalAlpha = ring ? 0.9 : 0.75;
      ctx.fillStyle = edge.color || `rgb(${mix(r, 255, 0.45)},${mix(g, 255, 0.45)},${mix(b, 255, 0.45)})`;
      const ch = ring ? edge.ring : edge.chars[Math.floor(h2 * edge.chars.length)];
      ctx.fillText(ch, x + CELL_W / 2, y + CELL_H / 2 + 0.5);
      return;
    }

    const j = 1 + (h2 - 0.5) * style.jitter;
    r = Math.min(255, r * j);
    g = Math.min(255, g * j);
    b = Math.min(255, b * j);

    const h3 = hash(cx, cy, tick + 311);
    if (h3 < style.accentFill) {
      const [ar, ag, ab] = hex(ACCENTS[Math.floor(h1 * ACCENTS.length)]);
      r = mix(r, ar, 0.55); g = mix(g, ag, 0.55); b = mix(b, ab, 0.55);
    }

    // Mostly-covered cells snap to solid so silhouettes stay crisp; only the
    // thin band below that reads as a pale, translucent tile.
    const alpha = Math.min(1, Math.max(0.3, (a - edge.max) / (style.solid - edge.max)));
    const lumCell = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    // Optionally judge brightness as seen against the page, so translucent
    // tiles read as pale rather than as their underlying colour.
    const lum = style.backdrop == null ? lumCell : lumCell * alpha + (style.backdrop / 255) * (1 - alpha);

    const inset = style.inset;
    ctx.globalAlpha = alpha;
    if (style.border) {
      ctx.fillStyle = `rgb(${r * style.border | 0},${g * style.border | 0},${b * style.border | 0})`;
      ctx.fillRect(x + inset, y + inset, CELL_W - inset * 2, CELL_H - inset * 2);
      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      ctx.fillRect(x + inset + 0.5, y + inset + 0.5, CELL_W - inset * 2 - 1, CELL_H - inset * 2 - 1);
    } else {
      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      ctx.fillRect(x + inset, y + inset, CELL_W - inset * 2, CELL_H - inset * 2);
    }

    let chars = style.ramps[style.ramps.length - 1][1];
    for (const [max, set] of style.ramps) {
      if (lum < max) { chars = set; break; }
    }
    const ch = chars[Math.floor(h1 * chars.length)];

    const dark = lum >= style.flip;
    if (h3 > 1 - style.accentRate) {
      ctx.fillStyle = ACCENTS[Math.floor(h2 * ACCENTS.length)];
    } else if (style.tone === 'tinted') {
      ctx.fillStyle = dark
        ? `rgb(${r * 0.36 | 0},${g * 0.36 | 0},${b * 0.36 | 0})`
        : `rgb(${mix(r, 255, 0.8)},${mix(g, 255, 0.8)},${mix(b, 255, 0.8)})`;
    } else {
      ctx.fillStyle = dark || h2 < style.inkChance ? style.ink : style.paper;
    }
    ctx.globalAlpha = Math.min(1, alpha * (dark ? 0.85 : 0.95));
    ctx.fillText(ch, x + CELL_W / 2, y + CELL_H / 2 + 0.5);
  }
}

const mix = (a, b, k) => (a + (b - a) * k) | 0;

function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
