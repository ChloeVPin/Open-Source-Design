/** The stops of the slider, left to right. */
export const LEVELS = ['Low', 'Medium', 'High', 'Extra', 'Max', 'Galaxy'];

/** One line under the track saying what the current stop means. */
export const HINTS = [
  'Quick answers, minimal thinking',
  'Recommended for most tasks',
  'Thinks longer on harder tasks',
  'Deep thinking, slower replies',
  'Maximum thinking, slowest',
  'Thinks at a cosmic scale',
];

export const RECOMMENDED = 1;
export const GALAXY = LEVELS.length - 1;

/** Where the thumb sits for each stop, in the track's own pixels. */
export const THUMB_START = 8;
export const THUMB_STEP = 36;

export const thumbX = (index) => THUMB_START + THUMB_STEP * index;

/**
 * The fill is a three-stop gradient stretched from the track's left edge to
 * the thumb. Its far end drifts from pink towards violet as the effort rises,
 * so each stop has its own colours: [start, middle, end] as RGB.
 */
const FILL = [
  [[50, 43, 47], [114, 68, 100], [170, 97, 152]], // Medium
  [[50, 43, 47], [101, 65, 95], [150, 90, 158]], // High
  [[50, 43, 47], [97, 66, 96], [133, 88, 160]], // Extra
  [[51, 44, 48], [94, 63, 95], [124, 90, 164]], // Max
];

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/** CSS gradient for a thumb resting at (or travelling past) `level`, which may be fractional. */
export function fillGradient(level) {
  const at = Math.min(Math.max(level - 1, 0), FILL.length - 1);
  const lo = Math.floor(at);
  const hi = Math.min(lo + 1, FILL.length - 1);
  const [a, b, c] = [0, 1, 2].map((i) => mix(FILL[lo][i], FILL[hi][i], at - lo));
  return `linear-gradient(90deg, rgb(${a}), rgb(${b}) 50%, rgb(${c}))`;
}
