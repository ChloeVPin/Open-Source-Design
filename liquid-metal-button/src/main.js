import { MetalRing } from './ring.js';

// Optional URL parameters, mostly for comparing against the original:
//   ?view=full     start zoomed out on the whole composer
//   ?t=2.5         freeze the metal at that many seconds into its loop
//   ?liquid=0      turn the slow wobble off (0 to 1)
const params = new URLSearchParams(location.search);

const camera = document.querySelector('.js-camera');
const composer = document.querySelector('.js-composer');
const send = document.querySelector('.js-send');
const input = document.querySelector('.js-input');
const viewButton = document.querySelector('.js-view');

// Ring radii, from the button's size and the two CSS lengths that describe it.
const style = getComputedStyle(send);
const radius = send.offsetWidth / 2;
const ring = new MetalRing(document.querySelector('.js-ring'), {
  inner: radius - Number.parseFloat(style.getPropertyValue('--ring')),
  outer: radius,
  liquid: params.has('liquid') ? Number.parseFloat(params.get('liquid')) : 1,
});

/* ------------------------------------------------------------------ camera */

// The original recording is a close-up: a window 209.6 by 146.5 of the
// composer's own pixels, centred on the send button.
const CLOSE_UP = { width: 209.6, height: 146.5 };

let closeUp = params.get('view') !== 'full';
let currentZoom = 1;

function frame({ animate = false } = {}) {
  let zoom;
  let x;
  let y;
  if (closeUp) {
    zoom = Math.min(innerWidth / CLOSE_UP.width, innerHeight / CLOSE_UP.height);
    x = send.offsetLeft + send.offsetWidth / 2;
    y = send.offsetTop + send.offsetHeight / 2;
  } else {
    zoom = Math.min(Math.max((innerWidth - 48) / composer.offsetWidth, 0.5), 2.5);
    x = composer.offsetWidth / 2;
    y = composer.offsetHeight / 2;
  }

  camera.classList.toggle('is-moving', animate);
  camera.style.transform = `translate(${innerWidth / 2 - x * zoom}px, ${innerHeight / 2 - y * zoom}px) scale(${zoom})`;
  viewButton.textContent = closeUp ? 'Zoom out' : 'Zoom in';

  // While the camera moves, keep the canvas at the sharper of the two zooms;
  // it settles to the new one when the move ends.
  ring.resize(Math.max(zoom, animate ? currentZoom : 0) * devicePixelRatio);
  currentZoom = zoom;
}

camera.addEventListener('transitionend', (event) => {
  if (event.target !== camera) return;
  camera.classList.remove('is-moving');
  ring.resize(currentZoom * devicePixelRatio);
});

viewButton.addEventListener('click', () => {
  closeUp = !closeUp;
  frame({ animate: true });
});

addEventListener('resize', () => frame());
frame();

/* ------------------------------------------------------------------- metal */

const calm = matchMedia('(prefers-reduced-motion: reduce)');

function run() {
  if (params.has('t')) ring.freeze(Number.parseFloat(params.get('t')));
  else if (calm.matches) ring.freeze(0);
  else ring.freeze(null);
}

calm.addEventListener('change', run);
run();

/* ---------------------------------------------------------------- composer */

composer.addEventListener('submit', (event) => {
  event.preventDefault();
  input.value = '';
});

// Handy in the console: metal.freeze(1.2), metal.freeze(null), …
window.metal = ring;
