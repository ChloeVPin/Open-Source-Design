import { LEVELS, PALETTES, START, TOTAL } from './data.js';

const WEEKS = LEVELS[0].length;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// How the recolour travels: each week starts a little after the one before,
// and every day adds a small random hesitation so the front looks organic.
const SWEEP_STEP = 12; // ms between neighbouring weeks
const SWEEP_JITTER = 60; // ms of per-cell randomness

const cellsEl = document.querySelector('.js-cells');
const monthsEl = document.querySelector('.js-months');
const palettesEl = document.querySelector('.js-palettes');
const nameEl = document.querySelector('.js-palette-name');
const root = document.documentElement;

const dayOf = (week, weekday) => new Date(START.getFullYear(), START.getMonth(), START.getDate() + week * 7 + weekday);

/* ------------------------------------------------------------------ counts */

/**
 * The picture only fixes each day's level. Give every day a plausible count
 * for its level, then nudge the busiest days until the year adds up to TOTAL.
 */
function counts() {
  const ranges = [[0, 0], [1, 2], [3, 5], [6, 9], [10, 16]];
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const out = [];
  let sum = 0;
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const [lo, hi] = ranges[+LEVELS[d][w]];
      const n = lo + Math.floor(rnd() * (hi - lo + 1));
      out.push(n);
      sum += n;
    }
  }
  // Spread the difference over level-4 days, which have no upper bound to break.
  const top = out.map((_, i) => i).filter((i) => LEVELS[i % 7][Math.floor(i / 7)] === '4');
  for (let k = 0; sum !== TOTAL && k < 100000; k++) {
    const i = top[k % top.length];
    const step = sum < TOTAL ? 1 : out[i] > 10 ? -1 : 0;
    out[i] += step;
    sum += step;
  }
  return out;
}

/* ------------------------------------------------------------------- build */

const perDay = counts();
const cells = [];
for (let w = 0; w < WEEKS; w++) {
  for (let d = 0; d < 7; d++) {
    const n = perDay[w * 7 + d];
    const date = dayOf(w, d);
    const cell = document.createElement('i');
    cell.className = 'cell';
    cell.dataset.level = LEVELS[d][w];
    cell.title = `${n === 0 ? 'No' : n} contribution${n === 1 ? '' : 's'} on ${MONTHS[date.getMonth()]} ${date.getDate()}`;
    cells.push({ el: cell, week: w });
    cellsEl.append(cell);
  }
}
cellsEl.setAttribute('aria-label', `${TOTAL.toLocaleString('en-US')} contributions across ${WEEKS} weeks`);
document.querySelector('.js-total').textContent = TOTAL.toLocaleString('en-US');

// A month is labelled over the first week that begins in it.
for (let w = 0, last = -1; w < WEEKS - 1; w++) {
  const month = dayOf(w, 0).getMonth();
  if (month === last) continue;
  last = month;
  const label = document.createElement('span');
  label.textContent = MONTHS[month];
  label.style.setProperty('--col', w);
  monthsEl.append(label);
}

const swatches = PALETTES.map((palette, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'swatch';
  button.setAttribute('role', 'radio');
  button.innerHTML = `<span class="swatch__bars">${palette.colors.map((c) => `<i style="background:${c}"></i>`).join('')}</span>`;
  button.append(palette.name);
  button.addEventListener('click', () => choose(index));
  palettesEl.append(button);
  return button;
});

/* ----------------------------------------------------------------- palette */

let current = -1;

function choose(index, { sweep = true } = {}) {
  if (index === current) return;
  current = index;
  const palette = PALETTES[index];

  // Re-roll the timing first so no two changes ripple the same way.
  for (const { el, week } of cells) {
    el.style.setProperty('--delay', sweep ? `${Math.round(week * SWEEP_STEP + Math.random() * SWEEP_JITTER)}ms` : '0ms');
  }
  palette.colors.forEach((c, i) => root.style.setProperty(`--l${i + 1}`, c));

  nameEl.textContent = palette.name;
  swatches.forEach((b, i) => {
    b.setAttribute('aria-checked', String(i === index));
    b.tabIndex = i === index ? 0 : -1;
  });
  history.replaceState(null, '', index ? `?palette=${encodeURIComponent(palette.name.toLowerCase())}` : location.pathname);
}

// Arrow keys move through the palettes like a radio group.
palettesEl.addEventListener('keydown', (e) => {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (!step) return;
  e.preventDefault();
  const next = (current + step + PALETTES.length) % PALETTES.length;
  choose(next);
  swatches[next].focus();
});

// ?palette=aurora opens on that palette.
const wanted = (new URLSearchParams(location.search).get('palette') || '').toLowerCase();
choose(Math.max(0, PALETTES.findIndex((p) => p.name.toLowerCase() === wanted)), { sweep: false });
