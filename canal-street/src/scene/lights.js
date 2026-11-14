// The night's lighting: which windows are lit and when, the soft halo around
// each, the street lamp's cone, the lanterns, and the reflections that all of
// it throws on the canal.

import { lamp } from '../daylight.js';
import { Pen, el, group, random, stroke } from '../svg.js';

// When each light is on: [switched on, switched off, brightness].
// The whole street lights up at dusk; households turn in one by one, the tea
// house shuts after midnight, and the bathhouse and the Ito front door stay
// lit until dawn.
const SCHEDULE = {
  'sake-door': [17.85, 23.0, 1],
  'sake-window': [17.85, 23.0, 0.3],
  'house-left': [17.85, 2.75, 1],
  'house-right': [17.85, 23.75, 1],
  'house-door': [17.85, 6.05, 1],
  'house-shop-left': [17.85, 6.05, 0.28],
  'house-shop-right': [17.85, 6.05, 0.28],
  'tea-stall': [17.85, 0.5, 1],
  'tea-room': [17.85, 0.5, 1],
  'bath-left': [17.85, 6.05, 1],
  'bath-right': [17.85, 6.05, 1],
  'bath-door': [17.85, 6.05, 1],
};

const LANTERNS = [[936, 525], [1309, 524], [1486, 512], [1621, 513]];

function radial(defs, id, colour, inner) {
  const g = el('radialGradient', { id }, defs);
  el('stop', { offset: 0, 'stop-color': colour, 'stop-opacity': inner }, g);
  el('stop', { offset: 0.55, 'stop-color': colour, 'stop-opacity': inner * 0.38 }, g);
  el('stop', { offset: 1, 'stop-color': colour, 'stop-opacity': 0 }, g);
}

/**
 * @param svg     the scene, already holding every window pane (rect[data-light])
 * @param overlay a group above the buildings, for halos
 * @param canal   a group over the water, for reflections
 */
export function lights(svg, defs, overlay, canal) {
  radial(defs, 'halo', '#ffcf7a', 0.42);
  radial(defs, 'firefly', '#d9f58a', 0.95);
  const cone = el('linearGradient', { id: 'cone', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': '#fff1c9', 'stop-opacity': 0.5 }, cone);
  el('stop', { offset: 1, 'stop-color': '#fff1c9', 'stop-opacity': 0.04 }, cone);

  const beam = el('linearGradient', { id: 'beam', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
  el('stop', { offset: 0, 'stop-color': '#fff1c9', 'stop-opacity': 0.5 }, beam);
  el('stop', { offset: 1, 'stop-color': '#fff1c9', 'stop-opacity': 0 }, beam);

  const rnd = random(64);
  const panes = [...svg.querySelectorAll('rect[data-light]')].map((pane) => {
    const x = Number(pane.getAttribute('x'));
    const y = Number(pane.getAttribute('y'));
    const w = Number(pane.getAttribute('width'));
    const h = Number(pane.getAttribute('height'));
    const [from, to, strength] = SCHEDULE[pane.dataset.light];

    const halo = el('ellipse', { cx: x + w / 2, cy: y + h / 2, rx: w * 0.75 + 46, ry: h * 0.7 + 44, fill: 'url(#halo)' }, overlay);

    // A column of short bright strokes on the water under each bright window.
    let reflection = null;
    if (strength > 0.5) {
      const pen = new Pen();
      for (let row = 0; row < 8; row++) {
        const ry = 764 + row * 10.5;
        const reach = 1 - row / 9; // rows thin out and shorten with distance
        let rx = x + rnd() * 10;
        while (rx < x + w) {
          const len = 10 + rnd() * 22 * reach;
          if (rnd() < 0.2 + 0.5 * reach) pen.line(rx, ry, Math.min(rx + len, x + w + 4), ry);
          rx += len + 8 + rnd() * 22;
        }
      }
      reflection = stroke(canal, pen, 'reflection', { style: `animation-delay:${(-rnd() * 4).toFixed(2)}s` });
    }
    return { pane, halo, reflection, from, to, strength };
  });

  // Street lamp: a cone of light and the pool it makes on the street.
  const lampLight = group(overlay, 'lamp-light');
  el('path', { d: 'M829 441L843 441L916 654L766 654Z', fill: 'url(#cone)' }, lampLight);
  el('ellipse', { cx: 841, cy: 668, rx: 92, ry: 16, fill: 'url(#halo)' }, lampLight);
  el('circle', { cx: 836, cy: 440, r: 30, fill: 'url(#halo)' }, lampLight);

  const lanternLight = group(overlay, 'lantern-light');
  for (const [x, y] of LANTERNS) el('circle', { cx: x, cy: y, r: 38, fill: 'url(#halo)' }, lanternLight);

  return (light) => {
    for (const { pane, halo, reflection, from, to, strength } of panes) {
      const level = lamp(light.hour, from, to) * strength;
      pane.style.opacity = level.toFixed(3);
      halo.style.opacity = (level * 0.85).toFixed(3);
      if (reflection) reflection.style.opacity = (level * 0.9).toFixed(3);
    }
    lampLight.style.opacity = light.night.toFixed(3);
    lanternLight.style.opacity = light.night.toFixed(3);
  };
}
