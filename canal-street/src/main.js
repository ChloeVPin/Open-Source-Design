import { daylight, periodName } from './daylight.js';
import { actors } from './scene/actors.js';
import { bathhouse, chimney, sakeShop, teaHouse, townhouse } from './scene/buildings.js';
import { lights } from './scene/lights.js';
import { sky, wires } from './scene/sky.js';
import { alley, ground, pole, tree, willow } from './scene/street.js';
import { WIDTH, el, group } from './svg.js';
import { Timeline } from './timeline.js';

// URL parameters:
//   ?time=20:51   start at a time of day, with the clock stopped
//   ?speed=0.8    hours of the day per second (the original runs a day in 30s)
//   ?real         follow the real clock
//   ?t=17         freeze the whole scene that many seconds in (clock included)
const params = new URLSearchParams(location.search);

const svg = document.querySelector('.js-scene');
const timeLabel = document.querySelector('.js-time');
const periodLabel = document.querySelector('.js-period');
const root = document.documentElement;

/* ------------------------------------------------------------------- build */

const defs = el('defs', {}, svg);
const pane = el('linearGradient', { id: 'pane', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
el('stop', { offset: 0, 'stop-color': '#f5d48c' }, pane);
el('stop', { offset: 1, 'stop-color': '#efb660' }, pane);

// Back to front.
const heavens = sky(group(svg, 'layer layer--sky'), defs);
chimney(svg);
const smokeLayer = group(svg, 'layer layer--smoke');
wires(svg);
const wireLayer = group(svg, 'layer layer--wire');
tree(svg);
ground(svg); // before the buildings, so bench legs and the pole can stand on it
sakeShop(svg);
townhouse(svg);
alley(svg);
teaHouse(svg);
const benchLayer = group(svg, 'layer layer--bench');
bathhouse(svg);
pole(svg);
const canalLayer = group(svg, 'layer layer--canal');
const streetLayer = group(svg, 'layer layer--street');
willow(svg);
const glowLayer = group(svg, 'layer layer--glow');
const airLayer = group(svg, 'layer layer--air');

const updateLights = lights(svg, defs, glowLayer, canalLayer);
const updateActors = actors({ sky: smokeLayer, wire: wireLayer, street: streetLayer, canal: canalLayer, air: airLayer, bench: benchLayer });

// Clouds remember where they started.
for (const cloud of heavens.clouds) cloud.dataset.y = cloud.transform.baseVal[0].matrix.f;

/* ------------------------------------------------------------------- clock */

const START = 7.25; // the original opens at 07:15
const speed = params.has('speed') ? Number.parseFloat(params.get('speed')) : 24 / 30;
const frozenAt = params.has('t') ? Number.parseFloat(params.get('t')) : null;

function parseTime(value) {
  const match = /^(\d{1,2})[:.](\d{2})$/.exec(value ?? '');
  return match ? Number(match[1]) + Number(match[2]) / 60 : null;
}

const realHour = () => {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
};

// The time of day is state, not a function of elapsed time, so it can be
// paused and dragged about while the street carries on.
const clock = {
  hour: parseTime(params.get('time')) ?? START,
  playing: !params.has('time') && !params.has('real'),
  real: params.has('real'),
};
if (frozenAt !== null) clock.hour = (START + frozenAt * speed) % 24;

/* ------------------------------------------------------------------- frame */

const mixHex = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => Number.parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => Number.parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(' ')})`;
};

// Custom properties are only written when they change: rewriting one restyles
// the whole drawing, and for most of the day most of them hold still.
const written = new Map();
function set(name, value) {
  if (written.get(name) === value) return;
  written.set(name, value);
  root.style.setProperty(name, value);
}

/**
 * Draw one moment.
 * @param seconds real time elapsed, which drives everything that walks or drifts
 * @param dt      seconds since the last frame
 */
function render(seconds, dt = 0) {
  const { hour } = clock;
  const light = daylight(hour);

  // Colours.
  const { colours } = light;
  set('--ink', colours.ink);
  set('--paper', colours.paper);
  set('--ground', colours.ground);
  set('--water', colours.water);
  set('--sky-top', colours.skyTop);
  set('--sky-low', colours.skyLow);
  set('--night', light.night.toFixed(3));
  set('--dark', light.dark.toFixed(3));
  set('--red', mixHex('#c8402f', '#8f3d31', light.night));
  set('--yellow', mixHex('#e6b63a', '#7f8250', light.night));
  set('--wood', mixHex('#7d5636', '#4d4338', light.night));
  set('--sun', mixHex('#fdf1dc', '#f2a07c', light.sunset));
  set('--lantern', mixHex('#fbf8f3', '#f4dfb2', light.night));
  set('--lantern-red', mixHex('#c8402f', '#f0a274', light.night));

  // Sun: one straight run across, on a parabola that tops out at noon.
  light.sunX = 910 + 125 * (hour - 12.05);
  const sunY = 120 + 0.00075 * (light.sunX - 910) ** 2;
  heavens.sun.setAttribute('transform', `translate(${light.sunX.toFixed(1)} ${sunY.toFixed(1)})`);
  heavens.sun.style.opacity = (1 - light.night).toFixed(3);

  // Moon: the same idea, twelve hours later.
  const late = hour < 12 ? hour + 24 : hour;
  light.moonX = 929 + 146.25 * (late - 24.05);
  const moonY = 152 + 0.00074 * (light.moonX - 920) ** 2;
  heavens.moon.setAttribute('transform', `translate(${(light.moonX - 16).toFixed(1)} ${moonY.toFixed(1)})`);
  heavens.moon.style.opacity = light.night.toFixed(3);

  // Clouds drift to the right and come round again.
  for (const cloud of heavens.clouds) {
    const w = Number(cloud.dataset.w);
    const span = WIDTH + w + 80;
    const x = ((((Number(cloud.dataset.x) + w + 40 + seconds * 4.5) % span) + span) % span) - w - 40;
    cloud.setAttribute('transform', `translate(${x.toFixed(1)} ${cloud.dataset.y})`);
  }

  updateLights(light);
  updateActors(seconds, light, dt);

  // Clock.
  const minutes = Math.floor(hour * 60 + 1e-6);
  const label = `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  if (timeLabel.textContent !== label) timeLabel.textContent = label;
  const period = periodName(hour);
  if (periodLabel.textContent !== period) periodLabel.textContent = period;
  timeline.show(hour, label, period, clock);
}

/* ---------------------------------------------------------------- timeline */

const timeline = new Timeline(document.querySelector('.js-timeline'), {
  /** Dragging the thumb sets the hour directly. */
  seek(hour) {
    clock.hour = ((hour % 24) + 24) % 24;
    clock.real = false;
  },
  toggle() {
    clock.playing = !clock.playing;
    clock.real = false;
  },
  /** Jump to the real time of day and keep following it. */
  now() {
    clock.real = true;
    clock.playing = false;
  },
});

/* -------------------------------------------------------------------- loop */

const calm = matchMedia('(prefers-reduced-motion: reduce)');
const began = performance.now();
let last = began;

function advance(dt) {
  if (clock.real) clock.hour = realHour();
  else if (clock.playing && !timeline.dragging) clock.hour = (clock.hour + dt * speed) % 24;
}

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  advance(dt);
  render((now - began) / 1000, dt);
  requestAnimationFrame(frame);
}

if (frozenAt !== null) {
  render(frozenAt, 0);
} else if (calm.matches) {
  // With "reduce motion" on, the clock still runs but nothing walks or drifts:
  // the scene is redrawn once a second with the street held still.
  render(0, 0);
  setInterval(() => {
    advance(1);
    render(0, 0);
  }, 1000);
} else {
  requestAnimationFrame(frame);
}

// Handy in the console: scene.clock.hour = 21, scene.render(12).
window.scene = { render, clock };
