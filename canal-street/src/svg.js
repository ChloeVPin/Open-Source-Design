// Small helpers for building the scene out of SVG. Everything is drawn in the
// card's own coordinates: 1804 wide by 902 tall, the size the original was
// measured at.

const NS = 'http://www.w3.org/2000/svg';

export const WIDTH = 1804;
export const HEIGHT = 902;

/** Create an SVG element, set its attributes and (optionally) append it. */
export function el(name, attrs = {}, parent) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null) node.setAttribute(key, value);
  }
  parent?.append(node);
  return node;
}

export const group = (parent, cls, attrs = {}) => el('g', { class: cls, ...attrs }, parent);

const n = (value) => Math.round(value * 10) / 10;

/**
 * Collects path commands. A whole roof's tiles or a window's slats go into one
 * Pen and become one <path>, which keeps the document small.
 */
export class Pen {
  constructor() {
    this.parts = [];
  }

  M(x, y) {
    this.parts.push(`M${n(x)} ${n(y)}`);
    return this;
  }

  L(x, y) {
    this.parts.push(`L${n(x)} ${n(y)}`);
    return this;
  }

  Q(cx, cy, x, y) {
    this.parts.push(`Q${n(cx)} ${n(cy)} ${n(x)} ${n(y)}`);
    return this;
  }

  C(ax, ay, bx, by, x, y) {
    this.parts.push(`C${n(ax)} ${n(ay)} ${n(bx)} ${n(by)} ${n(x)} ${n(y)}`);
    return this;
  }

  Z() {
    this.parts.push('Z');
    return this;
  }

  line(x1, y1, x2, y2) {
    return this.M(x1, y1).L(x2, y2);
  }

  /** A polyline through [x, y] pairs. */
  poly(points, close = false) {
    points.forEach(([x, y], i) => (i ? this.L(x, y) : this.M(x, y)));
    return close ? this.Z() : this;
  }

  rect(x, y, w, h, r = 0) {
    if (!r) return this.M(x, y).L(x + w, y).L(x + w, y + h).L(x, y + h).Z();
    return this.M(x + r, y)
      .L(x + w - r, y)
      .Q(x + w, y, x + w, y + r)
      .L(x + w, y + h - r)
      .Q(x + w, y + h, x + w - r, y + h)
      .L(x + r, y + h)
      .Q(x, y + h, x, y + h - r)
      .L(x, y + r)
      .Q(x, y, x + r, y)
      .Z();
  }

  ellipse(cx, cy, rx, ry = rx) {
    this.parts.push(
      `M${n(cx - rx)} ${n(cy)}a${n(rx)} ${n(ry)} 0 1 0 ${n(rx * 2)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(-rx * 2)} 0Z`,
    );
    return this;
  }

  /** Evenly spaced vertical lines from x1 to x2 inclusive. */
  slats(x1, x2, y1, y2, count) {
    for (let i = 0; i <= count; i++) {
      const x = x1 + ((x2 - x1) * i) / count;
      this.line(x, y1, x, y2);
    }
    return this;
  }

  /** The inner lines of a grid of cols by rows (the frame is not drawn). */
  grid(x, y, w, h, cols, rows) {
    for (let i = 1; i < cols; i++) this.line(x + (w * i) / cols, y, x + (w * i) / cols, y + h);
    for (let j = 1; j < rows; j++) this.line(x, y + (h * j) / rows, x + w, y + (h * j) / rows);
    return this;
  }

  toString() {
    return this.parts.join('');
  }
}

/** Turn a Pen into a <path> with a class. */
export function stroke(parent, pen, cls = 'ln', attrs = {}) {
  return el('path', { d: pen.toString(), class: cls, ...attrs }, parent);
}

/** Horizontal text. Signs use the Mincho face set up in the stylesheet. */
export function text(parent, content, x, y, size, attrs = {}) {
  const node = el('text', { x: n(x), y: n(y), 'font-size': size, class: 'sign', 'text-anchor': 'middle', ...attrs }, parent);
  node.textContent = content;
  return node;
}

/** Text set top to bottom, one character per line, centred on x. */
export function vertical(parent, content, x, y, size, step = size * 1.05, attrs = {}) {
  [...content].forEach((char, i) => text(parent, char, x, y + i * step, size, attrs));
}

/** A small seeded random generator, so the drawing is the same on every visit. */
export function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo = 0, hi = 1) => Math.min(Math.max(v, lo), hi);
export const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
