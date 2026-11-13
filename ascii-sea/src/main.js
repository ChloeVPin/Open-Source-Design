import { AsciiSea } from './engine/ascii.js';
import haj from './themes/haj.js';
import honu from './themes/honu.js';

const THEMES = { haj, honu };

// ?theme=haj|honu   which sea to show
// ?seed=7           reshuffle the animals (same seed → same scene)
// ?t=12&freeze      render a single frame at t seconds (handy for screenshots)
// ?dpr=2            force the canvas pixel ratio
const params = new URLSearchParams(location.search);
const theme = THEMES[params.get('theme')] ?? haj;
const seed = Number(params.get('seed')) || 7;
const startAt = Number(params.get('t')) || 0;
const frozen = params.has('freeze') || matchMedia('(prefers-reduced-motion: reduce)').matches;

document.documentElement.dataset.theme = theme.id;

const input = document.querySelector('.composer__input');
input.placeholder = `Ask ${theme.name} anything...`;
input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = `${input.scrollHeight}px`;
});
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    input.form.requestSubmit();
  }
});
input.form.addEventListener('submit', (e) => {
  e.preventDefault();
  input.value = '';
  input.style.height = 'auto';
});

// Press "t" (outside the prompt) to swim to the next theme.
addEventListener('keydown', (e) => {
  if (e.key !== 't' || e.target === input || e.metaKey || e.ctrlKey || e.altKey) return;
  const ids = Object.keys(THEMES);
  params.set('theme', ids[(ids.indexOf(theme.id) + 1) % ids.length]);
  location.search = params.toString();
});

async function start() {
  // The glyphs are drawn to canvas, so the mono face has to be ready first.
  await Promise.race([document.fonts.load(theme.style.font), new Promise((r) => setTimeout(r, 1500))]);

  const canvas = document.querySelector('.sea__canvas');
  const scene = theme.createScene(seed);
  const sea = new AsciiSea(canvas, theme, scene, { pixelRatio: Number(params.get('dpr')) || undefined });

  let t = 0;
  const advance = (seconds) => {
    // Fixed small steps keep the trails smooth even when catching up.
    for (let left = seconds; left > 0; left -= 1 / 30) {
      const dt = Math.min(1 / 30, left);
      t += dt;
      scene.step(dt, t, sea.width, sea.height);
    }
  };
  advance(startAt || 0.001);

  addEventListener('resize', () => {
    sea.resize();
    sea.render(t);
  });

  if (frozen) {
    sea.render(t);
    return;
  }

  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    scene.step(dt, t, sea.width, sea.height);
    sea.render(t);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

start();
