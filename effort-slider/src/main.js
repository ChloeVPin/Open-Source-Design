import { LEVELS } from './levels.js';
import { EffortSlider } from './slider.js';

// Optional URL parameters, mostly for comparing against the original:
//   ?level=max     start on a stop (name or 0-5)
//   ?zoom=4        fix the magnification instead of fitting the window
//   ?demo          play Low -> Galaxy on a timer, as the recording does
//   ?manual        stop the clock; step it with effort.advance(seconds)
const params = new URLSearchParams(location.search);

function startLevel() {
  const wanted = (params.get('level') ?? '').toLowerCase();
  const byName = LEVELS.findIndex((name) => name.toLowerCase() === wanted);
  if (byName >= 0) return byName;
  const byIndex = Number.parseInt(wanted, 10);
  return Number.isNaN(byIndex) ? 0 : byIndex;
}

const slider = new EffortSlider(document.querySelector('.js-card'), {
  value: startLevel(),
  manual: params.has('manual'),
});

// The recording frames the 220px card in a 472.5 x 258 window; scale the
// stage so it fills this one the same way, up to the recording's own 4x.
function fit() {
  const fixed = Number.parseFloat(params.get('zoom'));
  const zoom = fixed > 0 ? fixed : Math.min(Math.max(Math.min(innerWidth / 472.5, innerHeight / 258), 1), 4);
  document.documentElement.style.setProperty('--zoom', zoom);
  slider.resize(zoom * devicePixelRatio);
}

addEventListener('resize', fit);
fit();

if (params.has('demo')) {
  let next = slider.value + 1;
  const play = () => {
    if (next >= LEVELS.length) return;
    slider.setValue(next++);
    setTimeout(play, 520);
  };
  setTimeout(play, 320);
}

// Handy in the console: effort.setValue(5), effort.advance(0.1), …
window.effort = slider;
