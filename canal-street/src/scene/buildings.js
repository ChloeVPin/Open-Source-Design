// The four buildings, left to right: the sake shop, the Ito townhouse, the
// tea house and the bathhouse. Coordinates are the original's, measured from
// its long straight lines.

import { Pen, group, random, stroke, text, vertical } from '../svg.js';
import { eaveBeads, glowPane, lantern, noren, roof, soffit } from './parts.js';

const GROUND = 648;

/* --------------------------------------------------------------- sake shop */

function barrel(g, x, y) {
  stroke(g, new Pen().rect(x, y, 53, 46, 7), 'wall');
  stroke(g, new Pen().line(x + 2, y + 7, x + 51, y + 7).line(x + 2, y + 39, x + 51, y + 39).ellipse(x + 26.5, y + 23, 12.5), 'fine');
  text(g, '酒', x + 26.5, y + 28, 14);
}

/** The ball of cedar sprigs a brewery hangs out: a circle of short needles. */
function cedarBall(g, cx, cy, r) {
  const rnd = random(4);
  const pen = new Pen();
  for (let i = 0; i < 230; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const b = rnd() * Math.PI * 2;
    pen.line(x, y, x + Math.cos(b) * 3.2, y + Math.sin(b) * 3.2);
  }
  stroke(g, new Pen().ellipse(cx, cy, r), 'wall');
  stroke(g, pen, 'fine');
  stroke(g, new Pen().line(cx, cy - r, cx, cy - r - 8), 'fine');
}

export function sakeShop(parent) {
  const g = group(parent, 'building building--sake');

  // Upper storey.
  stroke(g, new Pen().rect(60, 404, 368, 80), 'wall');
  stroke(g, new Pen().line(48, 406, 48, 467).line(417, 406, 417, 483), 'ln');
  soffit(g, 60, 428, 413);
  roof(g, { top: [68, 410, 347], eave: [24, 455, 404], tiles: 46 });

  // A long slatted window and the shop's sign.
  stroke(g, new Pen().rect(88, 433, 150, 41, 7), 'wall');
  stroke(g, new Pen().slats(95, 231, 437, 470, 27), 'fine');
  stroke(g, new Pen().rect(263, 429, 135, 42), 'wall');
  stroke(g, new Pen().rect(268, 434, 125, 32), 'fine');
  text(g, '白梅 酒', 331, 458, 21);

  // Ground storey, under its own strip of roof.
  stroke(g, new Pen().rect(56, 512, 384, GROUND - 512), 'wall');
  stroke(g, new Pen().rect(58, 483, 386, 11).line(58, 488, 444, 488), 'wall');
  roof(g, { top: [60, 442, 494], eave: [28, 449, 513], tiles: 46, ridge: false });

  // Slatted shopfront window.
  glowPane(g, 'sake-window', 58, 545, 111, 89);
  stroke(g, new Pen().line(56, 527, 171, 527).line(56, 545, 171, 545).line(58, 634, 171, 634).line(58, 640, 171, 640), 'ln');
  stroke(g, new Pen().slats(58, 171, 545, 634, 17).line(83, 527, 83, 545).line(135, 527, 135, 545), 'fine');
  stroke(g, new Pen().line(171, 527, 171, GROUND), 'ln');

  cedarBall(g, 191, 547, 21);

  // The doorway: a split curtain above, sliding doors below.
  glowPane(g, 'sake-door', 216, 578, 94, 69);
  stroke(g, new Pen().rect(214, 527, 98, 121), 'ln');
  noren(g, [214, 246, 280, 312], 528, 573);
  text(g, '酒', 263, 562, 22);
  stroke(g, new Pen().line(220, 591, 305, 591).line(263, 591, 263, GROUND), 'fine');

  barrel(g, 351, 553);
  barrel(g, 323, 602);
  barrel(g, 379, 602);

  stroke(g, new Pen().line(440, 514, 440, GROUND), 'ln');

  // A small bird that likes the ridge.
  stroke(g, new Pen().M(84, 336).L(78, 322).L(84, 328).L(86, 318).L(89, 328).L(96, 322).L(90, 331).L(98, 331).L(88, 336).Z(), 'solid');
  return g;
}

/* --------------------------------------------------------------- townhouse */

/** A potted pine trained into flat pads. */
function bonsai(g, x) {
  stroke(g, new Pen().poly([[x - 9, 634], [x + 9, 634], [x + 7, GROUND], [x - 7, GROUND]], true), 'wall');
  stroke(g, new Pen().M(x, 634).C(x - 6, 620, x + 8, 612, x + 2, 598).M(x + 1, 612).Q(x - 8, 608, x - 12, 604), 'ln');
  for (const [px, py, w] of [[x + 3, 594, 11], [x - 13, 601, 10], [x + 10, 603, 8]]) {
    stroke(g, new Pen().M(px - w, py + 3).Q(px - w, py - 4, px, py - 4).Q(px + w, py - 4, px + w, py + 3).Z(), 'wall');
    stroke(g, new Pen().line(px - w * 0.5, py - 1, px - w * 0.5 + 2, py + 1).line(px + 1, py - 2, px + 3, py).line(px + w * 0.5, py - 1, px + w * 0.5 + 2, py + 1), 'fine');
  }
}

/** A potted branch with a few round buds. */
function budBranch(g, x) {
  stroke(g, new Pen().poly([[x - 8, 634], [x + 8, 634], [x + 6, GROUND], [x - 6, GROUND]], true), 'wall');
  stroke(g, new Pen().M(x, 634).C(x + 4, 610, x - 5, 590, x + 2, 566).M(x + 1, 600).L(x + 8, 590), 'ln');
  stroke(g, new Pen().ellipse(x + 3, 578, 4).ellipse(x - 4, 594, 4).ellipse(x - 2, 616, 4), 'wall');
}

function slattedWindow(g, name, x, w) {
  glowPane(g, name, x, 537, w, 67);
  stroke(g, new Pen().rect(x, 523, w, 87).line(x, 537, x + w, 537).line(x, 604, x + w, 604), 'ln');
  const count = Math.round(w / 6.5);
  stroke(g, new Pen().slats(x, x + w, 537, 604, count).grid(x, 523, w, 14, 5, 1), 'fine');
  // The low panel under the window, in fine boards.
  stroke(g, new Pen().rect(x, 612, w, GROUND - 612), 'ln');
  stroke(g, new Pen().slats(x, x + w, 614, GROUND - 1, Math.round(w / 4)), 'hair');
}

export function townhouse(parent) {
  const g = group(parent, 'building building--house');

  // Upper storey.
  stroke(g, new Pen().rect(462, 378, 335, 102), 'wall');
  soffit(g, 462, 797, 387);
  roof(g, { top: [474, 782, 317], eave: [432, 822, 378], tiles: 44 });

  // Two paper-screen windows.
  glowPane(g, 'house-left', 492, 399, 53, 49); // only half is lit: a screen is drawn across
  glowPane(g, 'house-right', 639, 399, 120, 49);
  stroke(g, new Pen().rect(492, 399, 106, 49).rect(639, 399, 120, 49), 'ln');
  stroke(g, new Pen().grid(492, 399, 106, 49, 6, 3).grid(639, 399, 120, 49, 6, 3), 'fine');

  // Balcony rail.
  stroke(g, new Pen().rect(470, 448, 315, 31), 'wall');
  stroke(g, new Pen().slats(470, 785, 452, 479, 35).line(470, 452, 785, 452), 'fine');

  // Ground storey and its strip of roof.
  stroke(g, new Pen().rect(451, 510, 353, GROUND - 510), 'wall');
  stroke(g, new Pen().rect(439, 479, 376, 11), 'wall');
  roof(g, { top: [446, 808, 490], eave: [436, 820, 512], tiles: 44, ridge: false });

  // Nameplate.
  stroke(g, new Pen().rect(593, 500, 53, 12), 'wall');
  text(g, '伊藤', 619.5, 509.5, 9);

  slattedWindow(g, 'house-shop-left', 458, 98);
  slattedWindow(g, 'house-shop-right', 684, 113);

  // The lattice door.
  glowPane(g, 'house-door', 573, 525, 94, 122);
  stroke(g, new Pen().rect(571, 523, 98, 125).line(620, 523, 620, GROUND), 'ln');
  stroke(g, new Pen().slats(571, 669, 523, GROUND, 12).grid(571, 523, 98, 125, 1, 6), 'fine');

  bonsai(g, 603);
  budBranch(g, 735);

  // Wind chime under the eave.
  const chime = group(g, 'chime');
  stroke(chime, new Pen().line(776, 388, 776, 398), 'fine');
  stroke(chime, new Pen().M(769, 406).Q(769, 398, 776, 398).Q(783, 398, 783, 406).Z(), 'chime__bell');
  stroke(chime, new Pen().line(776, 406, 776, 412), 'fine');
  stroke(chime, new Pen().rect(774, 412, 5, 13), 'wall');
  return g;
}

/* ---------------------------------------------------------------- tea house */

const MENU = ['だんご', '甘酒', '抹茶', 'おしるこ', '草餅'];

function dango(g, x, y) {
  stroke(g, new Pen().M(x - 16, y + 9).Q(x, y + 13, x + 16, y + 9), 'ln');
  stroke(g, new Pen().line(x - 13, y + 8, x + 15, y - 6), 'fine');
  stroke(g, new Pen().ellipse(x - 8, y + 5, 4.6).ellipse(x, y + 1, 4.6).ellipse(x + 8, y - 3, 4.6), 'wall');
}

function umbrella(g) {
  const top = 477;
  const rim = 513;
  const left = 1009;
  const right = 1199;
  const cx = 1104;
  const scallops = 9;

  // The pole first, so the canopy sits over it.
  stroke(g, new Pen().line(cx, top, cx, 612), 'ln');
  stroke(g, new Pen().poly([[cx - 6, 612], [cx + 6, 612], [cx + 8, 622], [cx - 8, 622]], true), 'wall');

  const canopy = new Pen().M(left, rim).C(left + 28, top + 8, cx - 40, top, cx, top).C(cx + 40, top, right - 28, top + 8, right, rim);
  const step = (right - left) / scallops;
  for (let i = scallops - 1; i >= 0; i--) canopy.Q(left + step * (i + 0.5), rim + 9, left + step * i, rim);
  stroke(g, canopy.Z(), 'parasol');

  const ribs = new Pen();
  for (let i = 1; i < scallops; i++) ribs.M(cx, top).Q((cx + left + step * i) / 2, top + 4, left + step * i, rim);
  stroke(g, ribs, 'parasol__rib');
  stroke(g, new Pen().ellipse(cx, top - 1, 3), 'wall');
}

export function teaHouse(parent) {
  const g = group(parent, 'building building--tea');

  // Upper storey.
  stroke(g, new Pen().rect(932, 424, 365, 60), 'wall');
  soffit(g, 932, 1297, 432);
  roof(g, { top: [941, 1289, 370], eave: [895, 1335, 425], tiles: 46 });
  stroke(g, new Pen().rect(979, 437, 274, 33, 7), 'wall');
  stroke(g, new Pen().slats(986, 1246, 441, 466, 52), 'fine');

  // Ground storey: a serving stall on the left, a curtained room on the right.
  stroke(g, new Pen().rect(906, 503, 425, GROUND - 503), 'wall');
  stroke(g, new Pen().rect(900, 471, 431, 12).line(900, 477, 1331, 477), 'wall');
  roof(g, { top: [905, 1326, 483], eave: [897, 1335, 505], tiles: 46, ridge: false });
  stroke(g, new Pen().line(898, 498, 898, 633).line(913, 512, 913, GROUND).line(1165, 510, 1165, GROUND).line(1304, 532, 1304, GROUND).line(1316, 510, 1316, GROUND), 'ln');

  // Stall: menu strips over a counter.
  glowPane(g, 'tea-stall', 915, 531, 248, 67);
  stroke(g, new Pen().line(939, 523, 1157, 523).line(941, 531, 1157, 531), 'ln');
  MENU.forEach((item, i) => {
    const x = 941 + i * 41.5;
    stroke(g, new Pen().line(x + 10, 531, x + 10, 537), 'fine');
    stroke(g, new Pen().rect(x, 537, 20, 41), 'wall');
    const size = item.length > 3 ? 7.2 : item.length > 2 ? 8.6 : 10;
    vertical(g, item, x + 10, 537 + (41 - (item.length - 1) * size * 1.08) / 2 + size * 0.36, size, size * 1.08);
  });
  stroke(g, new Pen().rect(921, 598, 236, 12), 'wall');
  stroke(g, new Pen().line(928, 610, 928, GROUND).line(1150, 610, 1150, GROUND), 'ln');
  dango(g, 1058, 584);
  dango(g, 1140, 584);

  // Room: a four-panel curtain with the character for tea.
  glowPane(g, 'tea-room', 1167, 556, 136, 91);
  noren(g, [1173, 1203, 1235, 1265, 1296], 508, 551);
  text(g, '茶', 1234, 540, 25);

  lantern(g, 936, 508, 22, 34, '茶', 'lantern lantern--red');
  lantern(g, 1309, 507, 22, 34, '茶', 'lantern lantern--red');

  // Bench with its red cloth, and the parasol over it.
  stroke(g, new Pen().rect(966, 633, 166, 6), 'wall');
  stroke(g, new Pen().line(978, 639, 978, 662).line(982, 639, 982, 662).line(1114, 639, 1114, 662).line(1119, 639, 1119, 662), 'ln');
  stroke(g, new Pen().rect(970, 620, 157, 13), 'cloth-red');
  umbrella(g);
  return g;
}

/* ---------------------------------------------------------------- bathhouse */

function bucket(g, cx, y) {
  stroke(g, new Pen().poly([[cx - 12, y], [cx + 12, y], [cx + 10, y + 17], [cx - 10, y + 17]], true), 'bucket');
  stroke(g, new Pen().line(cx - 11.5, y + 4, cx + 11.5, y + 4), 'fine');
}

/** The curved gable over the entrance, like a drawn bow. */
function gable(g) {
  // Outer edge of the bow: a wide arc that flattens at the top.
  const arch = (lift, inset = 0) =>
    new Pen()
      .M(1440 + inset, 497 + lift)
      .C(1478 + inset, 470 + lift, 1512, 420 + lift, 1552, 420 + lift)
      .C(1592, 420 + lift, 1626 - inset, 470 + lift, 1664 - inset, 497 + lift);

  // The roof face inside the bow, tiled like the rest.
  const face = arch(8);
  face.L(1664, 502).L(1440, 502).Z();
  stroke(g, face, 'paper');
  const tiles = new Pen();
  for (let x = 1462; x <= 1642; x += 9) {
    const across = Math.abs(x - 1552) / 104;
    tiles.line(x, 432 + across ** 1.7 * 58, x, 478);
  }
  stroke(g, tiles, 'fine');
  eaveBeads(g, 1456, 1648, 478);

  // The bow itself: a thick board following the curve, flicked up at the feet.
  const board = arch(0);
  board.L(1668, 506).C(1630, 482, 1592, 432, 1552, 432).C(1512, 432, 1474, 482, 1436, 506).Z();
  stroke(g, board, 'wall');
  stroke(g, new Pen().M(1543, 420).Q(1552, 408, 1561, 420), 'wall');
}

export function bathhouse(parent) {
  const g = group(parent, 'building building--bath');

  stroke(g, new Pen().rect(1330, 476, 444, GROUND - 476), 'wall');
  soffit(g, 1330, 1774, 485);
  roof(g, { top: [1391, 1714, 404], eave: [1318, 1790, 478], tiles: 56 });
  gable(g);

  // Windows either side of the entrance.
  glowPane(g, 'bath-left', 1346, 501, 108, 48);
  glowPane(g, 'bath-right', 1650, 501, 109, 48);
  stroke(g, new Pen().rect(1346, 501, 108, 48).rect(1650, 501, 109, 48), 'ln');
  stroke(g, new Pen().grid(1346, 501, 108, 48, 6, 2).grid(1650, 501, 109, 48, 6, 2), 'fine');

  // The entrance. Its curtain is only hung out in the evening.
  glowPane(g, 'bath-door', 1505, 548, 94, 99);
  stroke(g, new Pen().line(1503, 494, 1503, GROUND).line(1601, 494, 1601, GROUND), 'ln');
  const curtain = group(g, 'evening');
  noren(curtain, [1505, 1537, 1568, 1599], 502, 546);
  text(curtain, 'ゆ', 1552, 535, 24);

  lantern(g, 1486, 496, 20, 32, 'ゆ');
  lantern(g, 1621, 497, 20, 32, 'ゆ');

  // Signboard: Matsu-no-yu.
  stroke(g, new Pen().rect(1342, 564, 37, 84), 'wall');
  vertical(g, '松の湯', 1360.5, 588, 17, 21);

  // Boarded lower walls.
  stroke(g, new Pen().line(1388, 572, 1503, 572).line(1601, 572, 1766, 572), 'ln');
  stroke(g, new Pen().slats(1391, 1496, 572, GROUND, 7).slats(1609, 1759, 572, GROUND, 10), 'fine');

  // Wash buckets stacked by the wall.
  for (const cx of [1696, 1720, 1744]) bucket(g, cx, 631);
  for (const cx of [1708, 1732]) bucket(g, cx, 614);
  bucket(g, 1720, 597);
  return g;
}

/** The bathhouse chimney, behind the roofs. */
export function chimney(parent) {
  const g = group(parent, 'chimney');
  stroke(g, new Pen().poly([[1682, 136], [1705, 136], [1707, 398], [1679, 398]], true), 'wall');
  stroke(g, new Pen().rect(1676, 125, 35, 11), 'wall');
  stroke(g, new Pen().line(1681.5, 213, 1705.5, 213).line(1681, 256, 1706, 256).line(1680, 318, 1706.5, 318), 'fine');
  text(g, 'ゆ', 1693.5, 288, 15);
  return g;
}

export { GROUND };
