// The day in colours. Each row is a moment (in hours) and what the original
// looks like then; the scene blends between neighbouring rows.
//
//   skyTop, skyLow   the sky's gradient
//   paper            walls and anything else "filled in"
//   ground           the street
//   water            the canal
//   ink              every line
//
// Day and night are two drawings in one: at dusk the ink fades from dark to
// light while the paper goes the other way, and for a moment (around 17:58
// and 05:58) they meet and the lines vanish into silhouettes.

import { clamp, lerp, smooth } from './svg.js';

const INK_DAY = '#45423d';
const INK_NIGHT = '#e6dcc8';

// prettier-ignore
const KEYS = [
  [ 0.00, '#0f1224', '#11162b', '#1b2038', '#1c2235', '#171c33', INK_NIGHT],
  [ 2.50, '#11162b', '#151d33', '#1b2039', '#1c213b', '#171b37', INK_NIGHT],
  [ 4.20, '#141b33', '#1b223b', '#1b253d', '#1b253d', '#171c37', INK_NIGHT],
  [ 4.85, '#1f233d', '#2b2d46', '#262a44', '#262a44', '#1c213b', INK_NIGHT],
  [ 5.33, '#3c3e5e', '#615367', '#423f5c', '#423f5c', '#292e48', INK_NIGHT],
  [ 5.65, '#464567', '#705d6f', '#49455f', '#49455f', '#31314a', '#ded3c8'],
  [ 5.82, '#575777', '#7e6d7d', '#5f5871', '#5f5871', '#3a3b54', '#d9cbc6'],
  [ 5.97, '#797b93', '#978a94', '#87808e', '#87808e', '#979aa5', '#87808e'],
  [ 6.13, '#a0a4b5', '#b6acb0', '#b4adb0', '#b4adb0', '#b8b7bc', '#4b4642'],
  [ 6.28, '#c2c7d3', '#d1c8c6', '#dad2cb', '#dad2cb', '#d2d2cf', INK_DAY],
  [ 6.45, '#d0d6df', '#dcd4d2', '#ede3d7', '#ede3d7', '#ddded7', INK_DAY],
  [ 7.25, '#e5e7e9', '#ebe6e0', '#f4ece3', '#f4efe5', '#e4e4e2', INK_DAY],
  [ 8.05, '#f4f2ee', '#f5f3ed', '#f8f4ee', '#fbf8f0', '#e8ebea', INK_DAY],
  [11.25, '#f6f4f0', '#f8f6f2', '#fbf8f3', '#fdfbf7', '#e9eeec', INK_DAY],
  [13.65, '#f5f3ed', '#f8f4ee', '#f8f6f2', '#fcf8f3', '#e7ecea', INK_DAY],
  [15.25, '#f3eee4', '#f4efe3', '#f7f1e8', '#faf5e9', '#e6e8e5', INK_DAY],
  [16.37, '#f3eee4', '#f5eee0', '#f9f4e8', '#f9f4e8', '#e8e8e3', INK_DAY],
  [16.85, '#edddcc', '#f1dbc5', '#f6ebda', '#f6ebda', '#e5e1d9', INK_DAY],
  [17.33, '#e6c9ac', '#e9c0a1', '#f0ddc8', '#f0ddc8', '#e1dacc', INK_DAY],
  [17.65, '#e3c3a3', '#e7b996', '#efd9c3', '#efd9c3', '#e0d7ca', '#4a4039'],
  [17.82, '#c9ac9b', '#d4a790', '#c2b1a9', '#c2b1a9', '#c1bbb8', '#5a4b46'],
  [17.97, '#9c878c', '#b08983', '#7f7684', '#7f7684', '#9491a0', '#7f7684'],
  [18.13, '#71627e', '#8f6b78', '#5f5572', '#605572', '#3b3855', '#dccfc8'],
  [18.45, '#5a5072', '#7b5c70', '#524b68', '#534b69', '#32344f', INK_NIGHT],
  [18.77, '#39385b', '#4e425c', '#3a3b56', '#3a3b58', '#262a44', INK_NIGHT],
  [19.08, '#202344', '#272a4b', '#2c2f4a', '#2a2f49', '#1e223d', INK_NIGHT],
  [19.90, '#151a32', '#1c203d', '#212740', '#232842', '#151c36', INK_NIGHT],
  [20.90, '#0f1224', '#12172c', '#1c2139', '#1e2336', '#171c33', INK_NIGHT],
  [24.00, '#0f1224', '#11162b', '#1b2038', '#1c2235', '#171c33', INK_NIGHT],
];

const NAMES = ['skyTop', 'skyLow', 'paper', 'ground', 'water', 'ink'];

const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const ROWS = KEYS.map(([hour, ...colours]) => ({ hour, colours: colours.map(rgb) }));

const css = (c) => `rgb(${c.map(Math.round).join(' ')})`;
const mix = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

/** The names shown beside the clock, and the hour each one starts. */
const PERIODS = [
  [0, '深夜'],
  [4, '夜明け'],
  [6, '朝'],
  [10, '昼'],
  [15, '午後'],
  [17, '夕暮れ'],
  [20, '夜'],
];

export function periodName(hour) {
  let name = PERIODS[0][1];
  for (const [from, label] of PERIODS) if (hour >= from) name = label;
  return name;
}

/**
 * Everything the scene needs to know about a moment.
 * @param hour 0..24
 */
export function daylight(hour) {
  let i = 0;
  while (i < ROWS.length - 2 && ROWS[i + 1].hour <= hour) i++;
  const a = ROWS[i];
  const b = ROWS[i + 1];
  const t = clamp((hour - a.hour) / (b.hour - a.hour));

  const colours = {};
  NAMES.forEach((name, k) => (colours[name] = css(mix(a.colours[k], b.colours[k], t))));

  // 1 while the night drawing is showing, 0 by day, crossing over at dusk and dawn.
  const night = hour < 12 ? 1 - smooth(5.8, 6.2, hour) : smooth(17.75, 18.15, hour);
  // How dark the sky is, for stars and the moon's glow.
  const dark = hour < 12 ? 1 - smooth(4.6, 6.1, hour) : smooth(18.0, 19.6, hour);
  // The warm blush of sunset, for the sun's colour.
  const sunset = smooth(15.6, 17.4, hour) * (1 - smooth(17.9, 18.3, hour));

  return { hour, colours, night, dark, sunset };
}

/** True when `hour` is inside a span that may wrap past midnight, e.g. on(17.9, 2.75). */
export const between = (hour, from, to) => (from <= to ? hour >= from && hour < to : hour >= from || hour < to);

/** 0..1 for a light switched on at `from` and off at `to`, easing over a few minutes each way. */
export function lamp(hour, from, to, ease = 0.25) {
  const since = (hour - from + 24) % 24;
  const length = (to - from + 24) % 24;
  if (since > length) return 0;
  return Math.min(smooth(0, ease, since), 1 - smooth(length - ease, length, since));
}
