// What is not a building: the blossom tree, the alley and utility pole, the
// street, the canal wall, the water and the willow at the left.

import { HEIGHT, Pen, WIDTH, el, group, random, stroke } from '../svg.js';
import { GROUND } from './buildings.js';

export const WALL_TOP = 722;
export const WATER = 753;

/** A clump of foliage: a circle whose edge is a ring of round bumps. */
function clump(pen, cx, cy, r, bumps, turn = 0) {
  for (let i = 0; i <= bumps; i++) {
    const a = turn + (i / bumps) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r * 0.86;
    if (!i) {
      pen.M(x, y);
      continue;
    }
    const mid = turn + ((i - 0.5) / bumps) * Math.PI * 2;
    pen.Q(cx + Math.cos(mid) * r * 1.32, cy + Math.sin(mid) * r * 0.86 * 1.32, x, y);
  }
  return pen.Z();
}

/** The blossom tree behind the alley. */
export function tree(parent) {
  const g = group(parent, 'tree');
  stroke(g, new Pen().M(846, 472).C(842, 440, 826, 420, 812, 398).M(866, 472).C(868, 440, 884, 426, 900, 400).M(856, 440).L(858, 400), 'ln');
  for (const [cx, cy, r, bumps, turn] of [
    [836, 352, 40, 9, 0.3],
    [928, 348, 40, 9, 1.1],
    [882, 322, 46, 10, 0.7],
    [878, 372, 30, 8, 0.2],
  ]) {
    stroke(g, clump(new Pen(), cx, cy, r, bumps, turn), 'wall');
  }
  const rnd = random(8);
  const blossoms = new Pen();
  for (let i = 0; i < 40; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd());
    blossoms.ellipse(882 + Math.cos(a) * d * 78, 345 + Math.sin(a) * d * 48, 1.9);
  }
  stroke(g, blossoms, 'bead');
  return g;
}

/** The gap between the townhouse and the tea house, with its stepping stones. */
export function alley(parent) {
  const g = group(parent, 'alley');
  stroke(g, new Pen().rect(812, 470, 64, GROUND - 470), 'wall');
  stroke(g, new Pen().line(812, GROUND, 846, 550).line(846, 550, 846, 470), 'fine');
  // A little post box on the wall.
  stroke(g, new Pen().rect(843, 548, 31, 28), 'wall');
  stroke(g, new Pen().line(839, 545, 877, 545).line(858, 554, 858, 570).line(850, 562, 866, 562), 'fine');
  stroke(g, new Pen().ellipse(858, 589, 9, 3).ellipse(858, 604, 10.5, 3.5).ellipse(858, 620, 12, 4).ellipse(858, 638, 14, 4.6), 'fine');
  return g;
}

/** The utility pole, its crossarm and the street lamp. */
export function pole(parent) {
  const g = group(parent, 'pole');
  stroke(g, new Pen().rect(875, 186, 10, 476), 'wall');
  stroke(g, new Pen().rect(838, 207, 81, 8), 'wall');
  const insulators = new Pen();
  for (const x of [843, 858, 895, 910]) insulators.poly([[x, 207], [x + 1, 197], [x + 7, 197], [x + 8, 207]]);
  stroke(g, insulators, 'wall');
  stroke(g, new Pen().rect(887, 264, 15, 67, 5), 'wall');
  stroke(g, new Pen().line(875, 276, 885, 276).line(875, 343, 885, 343).line(875, 513, 885, 513), 'fine');

  // Street lamp on an arm.
  stroke(g, new Pen().line(875, 431, 846, 431), 'ln');
  stroke(g, new Pen().poly([[824, 425], [848, 425], [843, 438], [829, 438]], true), 'wall');
  stroke(g, new Pen().ellipse(836, 440.5, 6, 3), 'lamp__bulb');
  return g;
}

/** Street, canal wall and water. */
export function ground(parent) {
  const g = group(parent, 'ground');
  const rnd = random(33);

  el('rect', { x: 0, y: GROUND, width: WIDTH, height: WALL_TOP - GROUND, class: 'fill-ground' }, g);

  // Kerb stones under the buildings.
  const kerb = new Pen().line(0, GROUND, WIDTH, GROUND).line(0, GROUND + 9, WIDTH, GROUND + 9);
  for (let x = 30; x < WIDTH; x += 44) kerb.line(x, GROUND, x, GROUND + 9);
  stroke(g, kerb, 'fine');
  stroke(g, new Pen().line(0, GROUND, WIDTH, GROUND), 'ln');

  // A few scuffs on the paving.
  const scuffs = new Pen();
  for (let i = 0; i < 46; i++) {
    const x = rnd() * WIDTH;
    const y = GROUND + 20 + rnd() * 44;
    scuffs.line(x, y, x + 10 + rnd() * 22, y + (rnd() - 0.5) * 1.5);
  }
  stroke(g, scuffs, 'hair');

  // The canal wall: three courses of stone.
  el('rect', { x: 0, y: WALL_TOP, width: WIDTH, height: WATER - WALL_TOP, class: 'fill-paper' }, g);
  const stones = new Pen().line(0, 732, WIDTH, 732).line(0, 742, WIDTH, 742);
  [[0, 56], [28, 50], [13, 60]].forEach(([offset, step], row) => {
    for (let x = offset + rnd() * 20; x < WIDTH; x += step * (0.7 + rnd() * 0.7)) stones.line(x, 723 + row * 10, x, 732 + row * 10);
  });
  stroke(g, stones, 'fine');
  // Tufts growing from the joints.
  const tufts = new Pen();
  for (let i = 0; i < 34; i++) {
    const x = rnd() * WIDTH;
    const y = 735 + (i % 2) * 9;
    tufts.M(x, y - 3).Q(x - 2.5, y, x, y + 3).M(x + 3, y - 3).Q(x + 5.5, y, x + 3, y + 3);
  }
  stroke(g, tufts, 'hair');
  stroke(g, new Pen().line(0, WALL_TOP, WIDTH, WALL_TOP).line(0, WATER, WIDTH, WATER), 'ln');

  // Water, with a scatter of ripples that slide back and forth.
  el('rect', { x: 0, y: WATER, width: WIDTH, height: HEIGHT - WATER, class: 'fill-water' }, g);
  for (let layer = 0; layer < 3; layer++) {
    const pen = new Pen();
    for (let i = 0; i < 15; i++) {
      const x = rnd() * WIDTH;
      const y = WATER + 12 + rnd() * (HEIGHT - WATER - 22);
      const len = 26 + rnd() * 70;
      pen.M(x, y).Q(x + len / 2, y - 2.2, x + len, y - 0.4);
      if (rnd() < 0.3) pen.M(x + 8, y + 9).Q(x + len / 2, y + 7.4, x + len * 0.8, y + 9);
    }
    stroke(g, pen, `wave wave--${layer}`);
  }
  return g;
}

/** The weeping willow in front of the sake shop. */
export function willow(parent) {
  const g = group(parent, 'willow');
  const rnd = random(5);

  stroke(g, new Pen().M(22, WALL_TOP).C(26, 640, 30, 560, 40, 500).C(48, 450, 62, 420, 76, 392).L(90, 394).C(74, 430, 62, 470, 58, 520).C(54, 590, 52, 660, 50, WALL_TOP).Z(), 'wall');

  // Three boughs arching out to the right.
  const boughs = [
    [78, 396, 120, 350, 220, 356, 318, 366],
    [70, 420, 110, 388, 170, 392, 236, 412],
    [60, 452, 20, 420, -10, 430, -30, 452],
  ];
  const wood = new Pen();
  for (const [x0, y0, ax, ay, bx, by, x1, y1] of boughs) wood.M(x0, y0).C(ax, ay, bx, by, x1, y1);
  stroke(g, wood, 'fine');

  // Strands hanging from the boughs, each with a few leaves.
  const sway = group(g, 'willow__strands');
  const strands = new Pen();
  const point = ([x0, y0, ax, ay, bx, by, x1, y1], t) => [
    (1 - t) ** 3 * x0 + 3 * (1 - t) ** 2 * t * ax + 3 * (1 - t) * t * t * bx + t ** 3 * x1,
    (1 - t) ** 3 * y0 + 3 * (1 - t) ** 2 * t * ay + 3 * (1 - t) * t * t * by + t ** 3 * y1,
  ];
  for (let i = 0; i < 34; i++) {
    const [x, y] = point(boughs[i % 3], 0.12 + rnd() * 0.88);
    const length = 170 + rnd() * 150;
    const bend = (rnd() - 0.5) * 16;
    strands.M(x, y).C(x + bend, y + length * 0.35, x - bend, y + length * 0.7, x + bend * 0.4, y + length);
    for (let leaf = 0.2; leaf < 1; leaf += 0.09 + rnd() * 0.08) {
      const ly = y + length * leaf;
      const lx = x + bend * Math.sin(leaf * 3.1) * 0.5;
      const side = rnd() < 0.5 ? -1 : 1;
      strands.line(lx, ly, lx + side * 3.2, ly + 4.5);
    }
  }
  stroke(sway, strands, 'hair');
  return g;
}
