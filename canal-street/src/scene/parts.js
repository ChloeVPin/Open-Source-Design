// Pieces every building shares: tiled roofs, eaves, lanterns, glowing windows.

import { Pen, el, lerp, stroke, text } from '../svg.js';

/**
 * A tiled roof seen face-on: a trapezoid whose tile lines fan out from the
 * ridge to the eave.
 *
 * @param top   [left, right, y] of the ridge edge
 * @param eave  [left, right, y] of the lower edge
 * @param tiles how many tile courses across
 */
export function roof(g, { top, eave, tiles, ridge = true, beads = true }) {
  const [x1, x2, y] = top;
  const [X1, X2, Y] = eave;

  stroke(g, new Pen().poly([[x1, y], [x2, y], [X2, Y], [X1, Y]], true), 'wall');

  const lines = new Pen();
  for (let i = 1; i < tiles; i++) {
    const t = i / tiles;
    lines.line(lerp(x1, x2, t), y, lerp(X1, X2, t), Y);
  }
  stroke(g, lines, 'fine');

  if (beads) eaveBeads(g, X1, X2, Y);
  if (ridge) ridgeBar(g, x1, x2, y);
}

/** The row of round tile ends along an eave. */
export function eaveBeads(g, x1, x2, y) {
  const count = Math.round((x2 - x1 - 8) / 9);
  const pen = new Pen();
  for (let i = 0; i <= count; i++) pen.ellipse(lerp(x1 + 4, x2 - 4, i / count), y + 2.6, 2.4);
  stroke(g, pen, 'bead');
}

/** The bar along the top of a roof, with an upright ornament at each end. */
export function ridgeBar(g, x1, x2, y) {
  stroke(g, new Pen().rect(x1 - 3, y - 11, x2 - x1 + 6, 11).line(x1 - 3, y - 6, x2 + 3, y - 6), 'wall');
  for (const [x, flip] of [[x1 - 10, 1], [x2 - 2, -1]]) {
    const cap = new Pen().M(x, y + 2).L(x, y - 15).Q(x, y - 22, x + 6, y - 22).Q(x + 12, y - 22, x + 12, y - 15).L(x + 12, y + 2).Z();
    stroke(g, cap, 'wall');
    const cx = x + 6 + flip * 1.5;
    stroke(g, new Pen().M(cx - 2, y - 9).Q(cx, y - 12, cx + 2, y - 9), 'fine');
  }
}

/** The underside of an eave: a line with the rafter ends showing as ticks beneath it. */
export function soffit(g, x1, x2, y) {
  const pen = new Pen().line(x1, y, x2, y);
  for (let x = x1 + 6; x < x2 - 3; x += 9) pen.line(x, y + 2.5, x, y + 7);
  stroke(g, pen, 'fine');
}

/**
 * A window that lights up at night. The light sits behind the window's own
 * lines; `name` is how the lighting code finds it (see lights.js).
 */
export function glowPane(g, name, x, y, w, h) {
  return el('rect', { x, y, width: w, height: h, class: 'glow', 'data-light': name }, g);
}

/** A paper lantern: ribbed body, dark caps, one character. */
export function lantern(g, cx, y, w, h, label, cls = 'lantern') {
  const body = el('g', { class: cls }, g);
  stroke(body, new Pen().rect(cx - w / 2, y + 3, w, h - 6, w * 0.38), 'lantern__body');
  const ribs = new Pen();
  for (let i = 1; i < 5; i++) ribs.line(cx - w / 2 + 1, y + 3 + ((h - 6) * i) / 5, cx + w / 2 - 1, y + 3 + ((h - 6) * i) / 5);
  stroke(body, ribs, 'lantern__rib');
  stroke(body, new Pen().rect(cx - w * 0.32, y, w * 0.64, 4).rect(cx - w * 0.32, y + h - 4, w * 0.64, 4), 'solid');
  text(body, label, cx, y + h / 2 + w * 0.22, w * 0.58, { class: 'sign lantern__label' });
  return body;
}

/** A row of cloth panels hanging in a doorway. `edges` are the x positions of the slits. */
export function noren(g, edges, top, bottom, cls = 'cloth') {
  const pen = new Pen();
  for (let i = 0; i < edges.length - 1; i++) {
    const drop = i % 2 ? 3 : 0; // alternate panels hang a touch lower
    pen.rect(edges[i] + 0.8, top, edges[i + 1] - edges[i] - 1.6, bottom - top + drop);
  }
  return stroke(g, pen, cls);
}
