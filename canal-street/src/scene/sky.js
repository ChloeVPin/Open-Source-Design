// Everything above the roofs: the sky itself, stars, sun and moon, drifting
// clouds, the far hills and pagoda, and the wires with their birds.

import { HEIGHT, Pen, WIDTH, el, group, random, stroke } from '../svg.js';

/** y on a cubic Bezier at a given x (the wires only ever run left to right). */
function yOnWire([x0, y0, ax, ay, bx, by, x1, y1], x) {
  let lo = 0;
  let hi = 1;
  const at = (t, p0, p1, p2, p3) => (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid, x0, ax, bx, x1) < x) lo = mid;
    else hi = mid;
  }
  return at(lo, y0, ay, by, y1);
}

// The four wires: two each side of the pole, the lower one sagging further.
export const WIRES = [
  [0, 200, 240, 245, 560, 262, 838, 211],
  [0, 211, 240, 262, 560, 281, 838, 219],
  [919, 211, 1150, 262, 1500, 268, WIDTH, 208],
  [919, 222, 1150, 290, 1500, 286, WIDTH, 222],
];

export const wireY = (index, x) => yOnWire(WIRES[index], x);

/** A curl at the end of a cloud line; `dir` is 1 at a right-hand end, -1 at a left. */
function curl(pen, x, y, dir) {
  const d = dir;
  return pen
    .Q(x + 7 * d, y, x + 7 * d, y - 6)
    .Q(x + 7 * d, y - 11, x + 2 * d, y - 11)
    .Q(x - 2.5 * d, y - 11, x - 2.5 * d, y - 7)
    .Q(x - 2.5 * d, y - 4, x + 1 * d, y - 4.5);
}

/** A cloud in the old woodblock manner: three level lines with curled ends. */
function cloud(parent, x, y, w) {
  const g = group(parent, 'cloud', { 'data-x': x, 'data-w': w });
  const pen = new Pen();
  curl(pen.M(0.2 * w, 10).L(0.655 * w, 10), 0.655 * w, 10, 1);
  curl(pen.M(0.5 * w, 22).L(0.98 * w, 22), 0.98 * w, 22, 1);
  curl(pen.M(0.5 * w, 22).L(0.02 * w, 22), 0.02 * w, 22, -1);
  curl(pen.M(0.9 * w, 35).L(0.42 * w, 35), 0.42 * w, 35, -1);
  stroke(g, pen, 'fine');
  g.setAttribute('transform', `translate(${x} ${y})`);
  return g;
}

function pagoda(g) {
  const x = 1203;
  const pen = new Pen().line(x, 274, x, 324);
  for (let i = 0; i < 5; i++) pen.line(x - 4 - i * 0.8, 287 + i * 7, x + 4 + i * 0.8, 287 + i * 7);
  pen.M(x - 37, 337).Q(x - 18, 334, x, 324).Q(x + 18, 334, x + 37, 337).L(x - 37, 337);
  pen.rect(x - 15, 337, 30, 10).line(x - 6, 337, x - 6, 347).line(x + 6, 337, x + 6, 347);
  pen.M(x - 50, 359).Q(x - 26, 355, x - 15, 347).L(x + 15, 347).Q(x + 26, 355, x + 50, 359);
  stroke(g, pen, 'far');
}

export function sky(parent, defs) {
  // The sky's gradient reads its two colours from CSS, so it follows the hour.
  const gradient = el('linearGradient', { id: 'sky', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, class: 'sky-top' }, gradient);
  el('stop', { offset: 0.72, class: 'sky-low' }, gradient);
  el('rect', { width: WIDTH, height: HEIGHT, fill: 'url(#sky)' }, parent);

  const glow = (id, colour, inner = 0.55) => {
    const g = el('radialGradient', { id }, defs);
    el('stop', { offset: 0, 'stop-color': colour, 'stop-opacity': inner }, g);
    el('stop', { offset: 1, 'stop-color': colour, 'stop-opacity': 0 }, g);
  };
  glow('sun-halo', '#ffe3bf', 0.75);
  glow('moon-halo', '#c9cdf2', 0.34);

  // Stars: mostly dots, a few four-pointed.
  const stars = group(parent, 'stars');
  const rnd = random(21);
  for (let i = 0; i < 95; i++) {
    const x = rnd() * WIDTH;
    const y = rnd() * 440;
    const delay = `${(-rnd() * 6).toFixed(2)}s`;
    if (i % 9 === 0) {
      const r = 3 + rnd() * 3;
      const spark = new Pen().M(x, y - r).Q(x, y, x + r, y).Q(x, y, x, y + r).Q(x, y, x - r, y).Q(x, y, x, y - r).Z();
      stroke(stars, spark, 'star', { style: `animation-delay:${delay}` });
    } else {
      el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (0.6 + rnd() * 0.9).toFixed(2), class: 'star', style: `animation-delay:${delay}` }, stars);
    }
  }

  // Sun and moon are positioned every frame (see main.js).
  const sun = group(parent, 'sun');
  el('circle', { r: 96, fill: 'url(#sun-halo)' }, sun);
  el('circle', { r: 40, class: 'sun__disc' }, sun);

  const moon = group(parent, 'moon');
  el('circle', { r: 118, fill: 'url(#moon-halo)' }, moon);
  const crescent = group(moon, '', { transform: 'rotate(-28)' });
  el('path', { d: 'M4 -23A23 23 0 0 1 4 23A30 30 0 0 0 4 -23Z', class: 'moon__disc' }, crescent);
  stroke(crescent, new Pen().ellipse(-8, -6, 2.6).ellipse(-4, 5, 1.6), 'moon__mark');

  const clouds = group(parent, 'clouds');
  cloud(clouds, 222, 150, 300);
  cloud(clouds, 976, 97, 375);
  cloud(clouds, 626, 240, 206);
  cloud(clouds, 1424, 203, 260);

  // Far hills and the pagoda, drawn faintly.
  const far = group(parent, 'hills');
  stroke(far, new Pen().M(985, 354).C(1060, 338, 1150, 338, 1215, 351).M(1150, 357).C(1250, 344, 1330, 350, 1395, 384), 'far');
  stroke(far, new Pen().M(1300, 396).C(1430, 378, 1560, 372, 1640, 378).C(1700, 382, 1760, 394, WIDTH, 404), 'far');
  pagoda(far);

  return { sun, moon, clouds: [...clouds.children] };
}

/** The wires. Drawn after the chimney, in front of it; the birds are actors. */
export function wires(parent) {
  const g = group(parent, 'wires');
  const pen = new Pen();
  for (const [x0, y0, ax, ay, bx, by, x1, y1] of WIRES) pen.M(x0, y0).C(ax, ay, bx, by, x1, y1);
  stroke(g, pen, 'fine');
  return g;
}
