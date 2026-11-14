// Everyone and everything that moves along the street and the canal: women
// under parasols, cyclists, children with pinwheels, the boatman, the cat, the
// birds on the wire, chimney smoke, falling petals and fireflies.
//
// Each actor is built once and returns an `update(seconds, light, dt)` that
// poses it for a moment in time. `seconds` is real elapsed time, so people
// walk at a human pace however fast the day is running.

import { HEIGHT, Pen, WIDTH, clamp, el, group, lerp, random, smooth, stroke } from '../svg.js';
import { wireY } from './sky.js';
import { WATER } from './street.js';

const wrap = (x, lo, hi) => ((((x - lo) % (hi - lo)) + (hi - lo)) % (hi - lo)) + lo;

/** Places an actor that walks one way for ever and comes round again. */
function travel(node, { x, y, speed, margin = 90 }, seconds, extra = '') {
  const at = wrap(x + speed * seconds, -margin, WIDTH + margin);
  const facing = speed < 0 ? -1 : 1;
  node.setAttribute('transform', `translate(${at.toFixed(1)} ${y}) scale(${facing} 1)${extra}`);
  return at;
}

/* ----------------------------------------------------------------- walkers */

/**
 * A woman in kimono, drawn facing right with her feet at the origin. She
 * carries a paper parasol, or after dark sometimes a hand lantern instead.
 */
function lady(parent, { kimono, obi = '#e39a3c', sash = '#d9534a', parasol = '#263f4a', carries = 'parasol' }) {
  const g = group(parent, 'actor lady');
  const body = group(g, 'lady__body');

  // Geta, each on its two teeth.
  const feet = [group(body), group(body)];
  feet.forEach((foot, i) => {
    const x = i ? 3 : -5;
    stroke(foot, new Pen().rect(x - 3.5, -4, 8, 2).line(x - 1.5, -2, x - 1.5, 0).line(x + 2.5, -2, x + 2.5, 0), 'ln');
  });

  // Kimono: a slim column with a little flare at the hem and one hanging sleeve.
  el('path', { d: 'M-6 -67L6 -67C9 -50 8 -30 10 -5L-10 -5C-8 -30 -9 -50 -6 -67Z', fill: kimono, class: 'tinted' }, body);
  stroke(body, new Pen().M(2, -63).C(4, -45, 3, -25, 5, -5), 'hair');
  const flowers = new Pen();
  for (const [x, y] of [[-4, -31], [3, -24], [-5, -15], [2, -11], [-1, -42], [6, -17], [-6, -24]]) flowers.ellipse(x, y, 1.5);
  stroke(body, flowers, 'flower');
  el('path', { d: 'M4 -65L13 -58L12 -39L5 -44Z', fill: kimono, class: 'tinted' }, body);
  // White collar.
  stroke(body, new Pen().poly([[-3, -69], [1, -61], [5, -69], [3, -70], [1, -65], [-1, -70]], true), 'bead');
  // Obi tied in a box at the back, with a coloured cord.
  el('path', { d: 'M-14 -59L-5 -59L-5 -43L-14 -43Z', fill: obi, class: 'tinted' }, body);
  el('path', { d: 'M-14 -53L-5 -53L-5 -49L-14 -49Z', fill: sash, class: 'tinted' }, body);

  // Head, hair swept up into a bun and pinned.
  stroke(body, new Pen().line(1, -69, 1, -72), 'ln');
  stroke(body, new Pen().ellipse(1.5, -77.5, 4.6, 5.6), 'wall');
  stroke(body, new Pen().M(-3, -81).Q(-5, -76, -2.5, -72.5).Q(-1.5, -78, 3, -82.5).Z().ellipse(0.5, -85.8, 4.3, 3.2), 'solid');
  stroke(body, new Pen().line(-6, -89, 6.5, -84.5), 'fine');
  stroke(body, new Pen().ellipse(-6.5, -89.5, 1.3).ellipse(7, -84, 1.3), 'bead');

  if (carries === 'lantern') {
    el('circle', { cx: 16, cy: -40, r: 30, fill: 'url(#halo)', class: 'evening' }, body);
    stroke(body, new Pen().M(6, -60).L(15, -53).L(15, -47), 'ln');
    stroke(body, new Pen().rect(11.5, -47, 8, 13, 3), 'lantern__body');
    stroke(body, new Pen().line(12, -42.5, 19, -42.5).line(12, -38.5, 19, -38.5), 'lantern__rib');
  } else {
    // Parasol: a wide shallow dome, ribbed, on a long shaft.
    stroke(body, new Pen().M(6, -60).L(10, -64), 'ln');
    stroke(body, new Pen().line(10, -57, 10, -113), 'ln');
    el('path', { d: 'M-23 -99Q10 -127 43 -99Q10 -104.5 -23 -99Z', fill: parasol, class: 'tinted parasol-top' }, body);
    const ribs = new Pen();
    for (const [x, y] of [[-15, -100.2], [-7, -101.2], [2, -101.7], [10, -101.8], [18, -101.7], [27, -101.2], [35, -100.2]]) ribs.line(10, -113.5, x, y);
    stroke(body, ribs, 'hair');
    stroke(body, new Pen().line(10, -113.5, 10, -117), 'ln');
  }

  return {
    node: g,
    update(seconds, stride) {
      const step = Math.sin(seconds * stride);
      body.setAttribute('transform', `translate(0 ${(Math.abs(step) * -0.9).toFixed(2)})`);
      feet[0].setAttribute('transform', `translate(${(step * 2.4).toFixed(2)} 0)`);
      feet[1].setAttribute('transform', `translate(${(-step * 2.4).toFixed(2)} 0)`);
    },
  };
}

/** A child running with a pinwheel held high. */
function child(parent) {
  const g = group(parent, 'actor child');
  const legs = [el('path', { class: 'ln' }, g), el('path', { class: 'ln' }, g)];

  // Striped shirt.
  const shirt = new Pen().rect(-6, -40, 12, 19, 3);
  stroke(g, shirt, 'wall');
  stroke(g, new Pen().line(-6, -36, 6, -36).line(-6, -32, 6, -32).line(-6, -28, 6, -28).line(-6, -24, 6, -24), 'ln');
  stroke(g, new Pen().line(-4, -37, -10, -28), 'ln'); // trailing arm
  stroke(g, new Pen().line(4, -38, 9, -52), 'ln'); // arm holding the pinwheel

  // Head under a straw hat.
  stroke(g, new Pen().ellipse(1, -47, 5), 'wall');
  el('path', { d: 'M-5 -51Q1 -59 7 -51Z', fill: '#e9c98a', class: 'tinted' }, g);
  el('path', { d: 'M-4.6 -52.4Q1 -55 6.6 -52.4L7 -51L-5 -51Z', fill: '#d9743a', class: 'tinted' }, g);
  stroke(g, new Pen().line(-9, -51, 11, -51), 'ln');

  // Pinwheel.
  stroke(g, new Pen().line(9, -52, 10, -66), 'fine');
  const wheel = group(g, 'pinwheel');
  ['#3f6fc6', '#d8513a', '#e9b83a', '#4c9a63'].forEach((colour, i) => {
    el('path', { d: 'M0 0L7 -2.5Q4.5 2 0 0Z', fill: colour, transform: `rotate(${i * 90})` }, wheel);
  });

  return {
    node: g,
    update(seconds) {
      const swing = Math.sin(seconds * 11);
      legs[0].setAttribute('d', `M-2 -21L${(-2 + swing * 7).toFixed(1)} -10L${(-4 + swing * 10).toFixed(1)} 0`);
      legs[1].setAttribute('d', `M2 -21L${(2 - swing * 7).toFixed(1)} -10L${(0 - swing * 10).toFixed(1)} 0`);
      wheel.setAttribute('transform', `translate(10 -66) rotate(${((seconds * 420) % 360).toFixed(0)})`);
    },
  };
}

/** A rider on a town bicycle with a basket. */
function cyclist(parent) {
  const g = group(parent, 'actor cyclist');

  // Headlight beam (only shows at night), drawn first so the bike sits on it.
  el('path', { d: 'M24 -31L190 -8L190 20L24 -27Z', class: 'beam' }, g);
  el('circle', { cx: 24, cy: -30, r: 13, fill: 'url(#halo)', class: 'evening' }, g);

  const wheel = (cx) => {
    const w = group(g, 'wheel', { transform: `translate(${cx} -13.5)` });
    const spokes = group(w, 'wheel__spokes');
    const pen = new Pen();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI;
      pen.line(Math.cos(a) * 12.5, Math.sin(a) * 12.5, -Math.cos(a) * 12.5, -Math.sin(a) * 12.5);
    }
    stroke(spokes, pen, 'hair');
    stroke(w, new Pen().ellipse(0, 0, 13.5).ellipse(0, 0, 11.6), 'fine');
    return spokes;
  };
  const spokes = [wheel(-19), wheel(19)];

  // Frame.
  stroke(g, new Pen().poly([[0, -13], [-6, -34], [14, -34], [0, -13], [-19, -13.5], [-6, -34]]).line(14, -34, 19, -13.5).line(13, -40, 14, -34).line(-9, -35, -2, -35), 'ln');
  stroke(g, new Pen().M(13, -40).L(18, -42).L(20, -39), 'ln');

  // Basket with the shopping.
  stroke(g, new Pen().poly([[15, -46], [31, -46], [29, -36], [17, -36]], true), 'wall');
  stroke(g, new Pen().line(19, -46, 20, -36).line(23, -46, 23, -36).line(27, -46, 26, -36).line(16, -41, 30, -41), 'hair');
  stroke(g, new Pen().M(17, -46).Q(23, -54, 29, -46).Z(), 'solid');
  stroke(g, new Pen().ellipse(24, -30, 1.6), 'headlamp');

  // Rider: legs are re-posed every frame to follow the pedals.
  const legs = [el('path', { class: 'limb' }, g), el('path', { class: 'limb' }, g)];
  stroke(g, new Pen().line(-5, -37, 5, -58), 'torso');
  stroke(g, new Pen().M(5, -57).L(10, -48).L(15, -41), 'limb');
  stroke(g, new Pen().ellipse(8, -65, 4.8), 'wall');
  stroke(g, new Pen().M(3.4, -66).Q(4, -71.5, 9, -70.5).Q(12.6, -70, 13, -66.5).Z(), 'solid');

  return {
    node: g,
    update(seconds) {
      const turn = seconds * 7;
      spokes.forEach((s) => s.setAttribute('transform', `rotate(${((turn * 40) % 360).toFixed(0)})`));
      legs.forEach((leg, i) => {
        const a = turn + i * Math.PI;
        const px = Math.cos(a) * 6;
        const py = -13 + Math.sin(a) * 6;
        // Knee: out in front of the line from hip to pedal.
        const kx = (-5 + px) / 2 + 6;
        const ky = (-37 + py) / 2 - 1;
        leg.setAttribute('d', `M-5 -37L${kx.toFixed(1)} ${ky.toFixed(1)}L${px.toFixed(1)} ${py.toFixed(1)}l4 0`);
      });
    },
  };
}

/* -------------------------------------------------------------------- boat */

function boat(parent) {
  const g = group(parent, 'actor boat');

  el('circle', { cx: 107, cy: -45, r: 42, fill: 'url(#halo)', class: 'evening' }, g);

  // The wake: a few ripples left behind, re-posed every frame so they slide astern.
  const wake = Array.from({ length: 5 }, () => el('path', { class: 'wave' }, g));

  // Pole, with the part under the water shown dotted.
  const pole = group(g, 'boat__pole');
  stroke(pole, new Pen().line(-76, -104, -91, -2), 'ln');
  stroke(pole, new Pen().line(-91, -2, -95, 28), 'dotted');

  // Hull: a long shallow punt with a raised stern.
  el('path', { d: 'M-116 -14L96 -14Q110 -17 118 -32L109 -8Q103 0 92 0L-100 0Q-111 -2 -116 -14Z', class: 'hull' }, g);
  stroke(g, new Pen().line(-112, -9, 107, -9).line(-60, -14, -60, 0).line(20, -14, 20, 0), 'fine');

  // Cargo: rice bales.
  for (const [x, y] of [[-15, -21], [5, -21], [25, -21], [-5, -33], [15, -33]]) {
    el('ellipse', { cx: x, cy: y, rx: 11, ry: 7, class: 'bale' }, g);
    stroke(g, new Pen().line(x - 5, y - 6, x - 5, y + 6).line(x + 5, y - 6, x + 5, y + 6).line(x - 10, y, x + 10, y), 'hair');
  }

  // Lantern on a post at the stern.
  stroke(g, new Pen().line(107, -28, 107, -40), 'ln');
  stroke(g, new Pen().rect(103, -51, 8, 11, 2), 'lantern__body');

  // The boatman: straw hat, short blue coat.
  const man = group(g, 'boatman');
  stroke(man, new Pen().line(-91, -14, -89, -37).line(-84, -14, -87, -37), 'limb');
  el('path', { d: 'M-94 -58L-82 -58L-81 -36L-95 -36Z', fill: '#2f4b8c', class: 'tinted' }, man);
  stroke(man, new Pen().M(-84, -54).L(-80, -50).L(-83, -46), 'ln');
  stroke(man, new Pen().ellipse(-87, -63, 4.6), 'wall');
  el('path', { d: 'M-99 -65L-87 -76L-75 -65Z', fill: '#e6cf94', class: 'tinted' }, man);

  return {
    node: g,
    update(seconds) {
      const x = wrap(433 + seconds * 21, -150, WIDTH + 150);
      const bob = Math.sin(seconds * 1.3) * 0.8;
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${(812 + bob).toFixed(2)})`);
      pole.setAttribute('transform', `rotate(${(Math.sin(seconds * 0.9) * 3).toFixed(2)} -84 -50)`);
      wake.forEach((ripple, i) => {
        const back = ((seconds * 0.45 + i / wake.length) % 1) * 150; // how far astern
        const spread = 4 + back * 0.09;
        const wx = -118 - back;
        ripple.setAttribute('d', `M${wx.toFixed(1)} ${(-2 - spread).toFixed(1)}q-9 2 -20 0M${(wx - 6).toFixed(1)} ${(2 + spread).toFixed(1)}q-10 2 -22 0`);
        ripple.style.opacity = (0.75 * (1 - back / 150)).toFixed(2);
        ripple.style.animation = 'none';
      });
    },
  };
}

/* --------------------------------------------------------------------- cat */

function cat(parent) {
  const g = group(parent, 'actor cat', { transform: 'translate(1026 620)' });

  // By day: asleep in a loaf.
  const asleep = group(g, 'cat__asleep');
  stroke(asleep, new Pen().M(-8, 0).Q(-12, -16, 6, -17).Q(22, -17, 22, -5).Q(22, 0, 16, 0).Z(), 'wall');
  el('path', { d: 'M2 -16.6Q10 -18 14 -13Q8 -9 3 -11Z', fill: '#d9873c', class: 'tinted' }, asleep);
  el('path', { d: 'M14 -13Q20 -14 21 -8Q16 -7 13 -9Z', fill: '#2b2a27', class: 'tinted' }, asleep);
  el('path', { d: 'M-4 -2Q6 3 18 -1L16 0L-8 0Z', fill: '#d9873c', class: 'tinted' }, asleep);
  stroke(asleep, new Pen().ellipse(-12, -7, 7.5, 7), 'wall');
  stroke(asleep, new Pen().poly([[-18, -11], [-17, -18], [-12, -14]]).poly([[-9, -14], [-5, -18], [-5, -10]]), 'wall');
  stroke(asleep, new Pen().M(-16, -7).Q(-14.5, -5.5, -13, -7).M(-11, -6).Q(-9.5, -4.5, -8, -6).line(-19, -6, -25, -8).line(-19, -4, -25, -3), 'fine');

  // By night: sitting up, eyes shining.
  const awake = group(g, 'cat__awake');
  const tail = el('path', { class: 'ln' }, awake);
  stroke(awake, new Pen().M(-4, 0).Q(-9, -14, 0, -22).Q(10, -22, 11, -8).Q(11, 0, 6, 0).Z(), 'wall');
  el('path', { d: 'M0 -20Q8 -19 9 -12Q4 -10 0 -13Z', fill: '#d9873c', class: 'tinted' }, awake);
  stroke(awake, new Pen().ellipse(-1, -28, 7.5, 7), 'wall');
  stroke(awake, new Pen().poly([[-7, -32], [-6.5, -39], [-2, -34.5]]).poly([[1, -34.5], [5, -39], [5.5, -31]]), 'wall');
  el('path', { d: new Pen().ellipse(-3.6, -28.5, 1.9).ellipse(2.4, -28.5, 1.9).toString(), class: 'cat__eye' }, awake);
  stroke(awake, new Pen().line(-9, -26, -15, -27).line(7, -26, 13, -27), 'hair');

  return {
    node: g,
    update(seconds, light) {
      asleep.style.opacity = (1 - light.night).toFixed(2);
      awake.style.opacity = light.night.toFixed(2);
      const flick = Math.sin(seconds * 1.7) * 5;
      tail.setAttribute('d', `M9 -3Q22 -2 ${(24 + flick * 0.4).toFixed(1)} ${(-12 - flick).toFixed(1)}`);
    },
  };
}

/* ------------------------------------------------------------------- smoke */

/**
 * The bathhouse chimney's plume, once the fires are lit in the afternoon: a
 * string of overlapping puffs, each bigger and fainter than the one below.
 */
function smoke(parent) {
  const g = group(parent, 'smoke');
  const COUNT = 12;
  const puffs = Array.from({ length: COUNT }, (_, i) => {
    const pen = new Pen();
    const bumps = 6;
    for (let k = 0; k <= bumps; k++) {
      const a = (k / bumps) * Math.PI * 2 + i * 0.7;
      const x = Math.cos(a) * 10;
      const y = Math.sin(a) * 8.5;
      if (!k) pen.M(x, y);
      else {
        const m = ((k - 0.5) / bumps) * Math.PI * 2 + i * 0.7;
        pen.Q(Math.cos(m) * 13.6, Math.sin(m) * 11.4, x, y);
      }
    }
    return { node: stroke(g, pen.Z(), 'puff'), offset: i / COUNT, wobble: i * 1.9 };
  });

  return {
    node: g,
    update(seconds, light) {
      const { hour } = light;
      // From late afternoon until just before dawn.
      const lit = hour >= 12 ? smooth(16.4, 17.2, hour) : 1 - smooth(4.9, 5.6, hour);
      g.style.opacity = lit.toFixed(2);
      if (lit <= 0) return;
      for (const puff of puffs) {
        const age = (seconds / 10 + puff.offset) % 1; // 0 at the chimney, 1 when gone
        const x = 1693 + age ** 1.6 * 104 + Math.sin(age * 7 + puff.wobble) * 3;
        const y = 120 - age * 108;
        const size = 0.5 + age * 2.3;
        puff.node.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${size.toFixed(2)}) rotate(${(age * 50).toFixed(0)})`);
        puff.node.style.opacity = (smooth(0, 0.05, age) * (1 - age ** 1.4)).toFixed(2);
      }
    },
  };
}

/* ------------------------------------------------------- petals, fireflies */

function petals(parent) {
  const g = group(parent, 'petals');
  const rnd = random(77);
  const list = Array.from({ length: 24 }, () => ({
    node: el('ellipse', { rx: 3, ry: 1.7, class: 'petal' }, g),
    x: 800 + rnd() * 170,
    drift: 60 + rnd() * 240,
    period: 9 + rnd() * 8,
    offset: rnd(),
    sway: 8 + rnd() * 14,
  }));
  return {
    node: g,
    update(seconds) {
      for (const p of list) {
        const age = (seconds / p.period + p.offset) % 1;
        const x = p.x + age * p.drift + Math.sin(age * 12 + p.offset * 9) * p.sway;
        const y = 380 + age * 330;
        p.node.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(age * 500 + p.offset * 360).toFixed(0)})`);
        p.node.style.opacity = (smooth(0, 0.1, age) * (1 - smooth(0.88, 1, age))).toFixed(2);
      }
    },
  };
}

function fireflies(parent) {
  const g = group(parent, 'fireflies');
  const rnd = random(31);
  const list = Array.from({ length: 10 }, () => ({
    node: el('circle', { r: 9, fill: 'url(#firefly)' }, g),
    x: rnd() * WIDTH,
    y: 660 + rnd() * 200,
    a: rnd() * 6,
    b: rnd() * 6,
    speed: 0.25 + rnd() * 0.35,
  }));
  return {
    node: g,
    update(seconds, light) {
      g.style.opacity = light.dark.toFixed(2);
      if (light.dark <= 0) return;
      for (const f of list) {
        const x = f.x + Math.sin(seconds * f.speed + f.a) * 46 + Math.sin(seconds * f.speed * 2.3 + f.b) * 12;
        const y = f.y + Math.cos(seconds * f.speed * 0.8 + f.b) * 20;
        f.node.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        f.node.style.opacity = clamp(0.55 + 0.6 * Math.sin(seconds * 1.6 + f.a * 3)).toFixed(2);
      }
    },
  };
}

/* ------------------------------------------------------------------- birds */

/** The silhouette of a bird in flight; `lift` raises and lowers the wings. */
const flying = (lift) => `M-9 2L-1 0L-5 ${(-lift - 3).toFixed(1)}L3 -1L9 -2L3 1L-3 ${(lift * 0.5 + 4).toFixed(1)}L-1 2Z`;

/**
 * The birds on the wire. They sit there all day, hopping and looking about;
 * at dusk they leave one after another, and at dawn they come back.
 */
function wireBirds(parent) {
  const g = group(parent, 'birds');
  const birds = [1022, 1072, 1135, 1248, 1343, 1459, 1580].map((x, i) => {
    const y = wireY(2, x);
    const node = group(g, 'bird');
    const perched = group(node, 'bird__perched');
    const body = group(perched, 'bird__body');
    stroke(body, new Pen().line(-5, -7, -14, -2), 'ln'); // tail
    stroke(body, new Pen().ellipse(0, -9, 7, 6.5), 'wall');
    stroke(body, new Pen().M(6, -11).L(11, -10).L(6.5, -8.5), 'ln'); // beak
    stroke(body, new Pen().M(-2, -15.2).Q(2, -17.5, 5.5, -13.5), 'bird__cap');
    stroke(body, new Pen().ellipse(3, -10.5, 0.7), 'solid');
    stroke(body, new Pen().M(-3, -8).Q(-1, -5.5, 2, -6.5), 'fine'); // wing
    stroke(perched, new Pen().line(-1.5, -2.6, -1.5, 0).line(2, -2.8, 2, 0), 'fine');
    const aloft = el('path', { class: 'solid' }, node);
    // Each has its own way off: up and out to one side.
    const side = i % 2 ? -1 : 1;
    return { node, perched, body, aloft, x, y, i, side, away: null, exit: [x + side * (420 + i * 40), y - 250 - (i % 3) * 40] };
  });

  return {
    node: g,
    update(seconds, light, dt) {
      for (const bird of birds) {
        // Home between dawn and dusk, each on a slightly different timetable.
        const home = light.hour >= 6.0 + bird.i * 0.06 && light.hour < 17.45 + bird.i * 0.07;
        const goal = home ? 0 : 1;
        if (bird.away === null) bird.away = goal; // first frame: no flight
        const move = dt / 1.9;
        bird.away = goal > bird.away ? Math.min(goal, bird.away + move) : Math.max(goal, bird.away - move);

        const t = bird.away;
        if (t <= 0.001) {
          // Perched: a hop now and then, and a look over the other shoulder.
          const hop = Math.max(0, Math.sin(seconds * 1.1 + bird.i * 2.4) - 0.93) * 40;
          const facing = Math.sin(seconds * 0.23 + bird.i * 1.7) > 0 ? 1 : -1;
          const nod = Math.max(0, Math.sin(seconds * 0.9 + bird.i * 4.1) - 0.8) * 60;
          bird.node.setAttribute('transform', `translate(${bird.x} ${(bird.y - hop).toFixed(1)}) scale(${facing} 1)`);
          bird.body.setAttribute('transform', `rotate(${nod.toFixed(1)} 0 -6)`);
          bird.perched.style.display = '';
          bird.aloft.style.display = 'none';
        } else if (t >= 0.999) {
          bird.node.style.display = 'none';
        } else {
          const ease = t * t * (3 - 2 * t);
          const x = lerp(bird.x, bird.exit[0], ease);
          const y = lerp(bird.y - 10, bird.exit[1], ease) - Math.sin(ease * Math.PI) * 30;
          const heading = (goal ? 1 : -1) * bird.side;
          bird.node.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${heading} 1)`);
          bird.aloft.setAttribute('d', flying(Math.sin(seconds * 22 + bird.i) * 7));
          bird.perched.style.display = 'none';
          bird.aloft.style.display = '';
        }
        if (t < 0.999) bird.node.style.display = '';
      }
    },
  };
}

/** Now and then a bird crosses the sky. */
function flyers(parent) {
  const g = group(parent, 'flyers');
  const list = [
    { y: 150, speed: 95, x: 300, flap: 13 },
    { y: 215, speed: -80, x: 1300, flap: 12 },
    { y: 110, speed: 70, x: -900, flap: 14 },
  ].map((bird) => ({ ...bird, node: el('path', { class: 'solid' }, g) }));
  return {
    node: g,
    update(seconds, light) {
      g.style.opacity = (1 - light.dark).toFixed(2); // they roost once it is properly dark
      for (const bird of list) {
        // A long empty margin either side, so they are only sometimes in view.
        const x = wrap(bird.x + bird.speed * seconds, -1400, WIDTH + 1400);
        const dir = bird.speed < 0 ? -1 : 1;
        bird.node.setAttribute('transform', `translate(${x.toFixed(1)} ${(bird.y + Math.sin(seconds * 0.7 + bird.x) * 14).toFixed(1)}) scale(${dir} 1)`);
        bird.node.setAttribute('d', flying(Math.sin(seconds * bird.flap) * 7));
      }
    },
  };
}

/* ------------------------------------------------------------ water and sky */

/**
 * The moon's path of light on the canal, and the sun's as it sets: a column
 * of short strokes under whichever is up, each one breathing in and out.
 */
function skyReflection(parent) {
  const g = group(parent, 'sky-reflection');
  const strokes = Array.from({ length: 11 }, (_, i) => ({ node: el('line', { class: 'glint' }, g), y: WATER + 9 + i * 12.5, phase: i * 1.7 }));
  return {
    node: g,
    update(seconds, light) {
      const moon = light.dark * 0.75;
      const sun = light.sunset * 0.8;
      const strength = Math.max(moon, sun);
      g.style.opacity = strength.toFixed(2);
      if (strength <= 0.01) return;
      const x = moon >= sun ? light.moonX : light.sunX;
      g.style.stroke = moon >= sun ? '#efe7cf' : '#f3b98f';
      for (const s of strokes) {
        const reach = (s.y - WATER) / (HEIGHT - WATER); // wider towards the viewer
        const half = (10 + reach * 30) * (0.55 + 0.45 * Math.sin(seconds * 1.4 + s.phase));
        const wander = Math.sin(seconds * 0.8 + s.phase * 2.3) * (4 + reach * 8);
        s.node.setAttribute('x1', (x + wander - half).toFixed(1));
        s.node.setAttribute('x2', (x + wander + half).toFixed(1));
        s.node.setAttribute('y1', s.y);
        s.node.setAttribute('y2', s.y);
      }
    },
  };
}

/** A fish rises somewhere on the canal every few seconds and leaves rings. */
function fishRings(parent) {
  const g = group(parent, 'fish-rings');
  const rings = Array.from({ length: 2 }, () => [el('ellipse', { class: 'ring' }, g), el('ellipse', { class: 'ring' }, g)]);
  const EVERY = 6.5;
  return {
    node: g,
    update(seconds) {
      rings.forEach((pair, slot) => {
        const clock = seconds + slot * EVERY * 0.5;
        const index = Math.floor(clock / EVERY);
        const age = (clock % EVERY) / 2.8; // rings last 2.8s, then the water is still
        const rnd = random(index * 7 + slot * 131 + 3);
        const x = 80 + rnd() * (WIDTH - 160);
        const y = WATER + 30 + rnd() * (HEIGHT - WATER - 55);
        pair.forEach((ring, k) => {
          const a = age - k * 0.22;
          if (a <= 0 || a >= 1) {
            ring.style.opacity = 0;
            return;
          }
          ring.setAttribute('cx', x.toFixed(1));
          ring.setAttribute('cy', y.toFixed(1));
          ring.setAttribute('rx', (4 + a * 26).toFixed(1));
          ring.setAttribute('ry', (1.2 + a * 6).toFixed(1));
          ring.style.opacity = (0.8 * (1 - a)).toFixed(2);
        });
      });
    },
  };
}

/** On a clear night, a shooting star every so often. */
function shootingStars(parent) {
  const g = group(parent, 'shooting-stars');
  const streak = el('line', { class: 'streak' }, g);
  const EVERY = 9;
  return {
    node: g,
    update(seconds, light) {
      const index = Math.floor(seconds / EVERY);
      const age = (seconds % EVERY) / 0.8; // each lasts 0.8s
      if (light.dark < 0.9 || age >= 1) {
        streak.style.opacity = 0;
        return;
      }
      const rnd = random(index * 13 + 5);
      const x = 150 + rnd() * (WIDTH - 500);
      const y = 30 + rnd() * 150;
      const dir = rnd() < 0.5 ? -1 : 1;
      const head = age * 220;
      const tail = Math.max(0, head - 70);
      streak.setAttribute('x1', (x + dir * tail).toFixed(1));
      streak.setAttribute('y1', (y + tail * 0.42).toFixed(1));
      streak.setAttribute('x2', (x + dir * head).toFixed(1));
      streak.setAttribute('y2', (y + head * 0.42).toFixed(1));
      streak.style.opacity = Math.sin(age * Math.PI).toFixed(2);
    },
  };
}

/* ------------------------------------------------------------------- build */

// Who is out, and when. The street changes hands at dusk: by day a few women
// in indigo under dark parasols, a pair of cyclists and a child; after dark
// the evening crowd, in brighter colours, on their way to and from the baths.
const DAY = 'day';
const NIGHT = 'night';

const LADIES = [
  { shift: DAY, x: 157, y: 675, speed: 15, kimono: '#2f4b8c', parasol: '#263f4a', stride: 5.2 },
  { shift: DAY, x: 835, y: 673, speed: -14, kimono: '#2f4b8c', parasol: '#263f4a', stride: 5 },
  { shift: DAY, x: 1700, y: 674, speed: -16, kimono: '#34509a', parasol: '#263f4a', stride: 5.4 },
  { shift: NIGHT, x: 20, y: 676, speed: 17, kimono: '#7a3f73', obi: '#d9c9a0', sash: '#b0506a', parasol: '#8a3b33', stride: 5.6 },
  { shift: NIGHT, x: 300, y: 673, speed: 14, kimono: '#3b579e', obi: '#e3a84a', parasol: '#6f7d74', stride: 5 },
  { shift: NIGHT, x: 620, y: 675, speed: -15, kimono: '#3f7a52', obi: '#e6c78a', sash: '#c9763a', parasol: '#4f6b50', stride: 5.3 },
  { shift: NIGHT, x: 1090, y: 672, speed: 13, kimono: '#34509a', obi: '#e39a3c', parasol: '#8f8a78', stride: 4.8 },
  { shift: NIGHT, x: 1500, y: 674, speed: -16, kimono: '#3f7a52', obi: '#d9c27a', carries: 'lantern', stride: 5.5 },
  { shift: NIGHT, x: 1280, y: 677, speed: 15, kimono: '#8a3f52', obi: '#dcd3b8', sash: '#5a6fa8', parasol: '#7a4a52', stride: 5.1 },
];

const CYCLISTS = [
  { shift: DAY, x: 376, y: 700, speed: 62 },
  { shift: DAY, x: 1594, y: 700, speed: -66 },
  { shift: NIGHT, x: 120, y: 701, speed: 64 },
  { shift: NIGHT, x: 1000, y: 699, speed: -60 },
  { shift: NIGHT, x: 1650, y: 702, speed: 57 },
];

const CHILDREN = [
  { shift: DAY, x: 303, y: 682, speed: 38 },
  { shift: NIGHT, x: 760, y: 683, speed: 40 },
  { shift: NIGHT, x: 1420, y: 684, speed: -43 },
];

/**
 * Build every actor.
 *
 * @param sky    behind the wires and roofs (smoke, passing birds, shooting stars)
 * @param wire   on the wires
 * @param street between the buildings and the willow
 * @param canal  over the water
 * @param air    on top of everything
 * @param bench  on the tea house's bench
 */
export function actors({ sky, wire, street, canal, air, bench }) {
  const all = [];

  all.push(shootingStars(sky));
  all.push(smoke(sky));
  all.push(flyers(sky));
  all.push(wireBirds(wire));
  all.push(cat(bench));

  // People are layered by how far down the street they stand.
  const people = [
    ...LADIES.map((spec) => ({ spec, actor: lady(street, spec) })),
    ...CHILDREN.map((spec) => ({ spec, actor: child(street, spec) })),
    ...CYCLISTS.map((spec) => ({ spec, actor: cyclist(street, spec) })),
  ].sort((a, b) => a.spec.y - b.spec.y);
  for (const person of people) street.append(person.actor.node);

  all.push({
    update(seconds, light) {
      for (const { spec, actor } of people) {
        const present = spec.shift === NIGHT ? light.night : 1 - light.night;
        actor.node.style.display = present <= 0.01 ? 'none' : '';
        if (present <= 0.01) continue;
        actor.node.style.opacity = present.toFixed(2);
        travel(actor.node, spec, seconds);
        actor.update(seconds, spec.stride);
      }
    },
  });

  all.push(skyReflection(canal));
  all.push(fishRings(canal));
  all.push(boat(canal));
  all.push(petals(air));
  all.push(fireflies(air));

  return (seconds, light, dt) => {
    for (const actor of all) actor.update(seconds, light, dt);
  };
}
