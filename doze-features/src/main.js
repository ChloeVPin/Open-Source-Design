import { Dots } from './dots.js';
import { FEATURES } from './features.js';

// URL parameters:
//   ?feature=3     start on a feature (1 to 6, or its name)
//   ?hold=6        seconds each feature stays before the next
//   ?autoplay=0    do not advance on a timer
const params = new URLSearchParams(location.search);

const root = document.documentElement;
const features = document.querySelector('.js-features');
const list = document.querySelector('.js-list');
const box = document.querySelector('.js-box');
const bar = document.querySelector('.js-bar');
const notice = document.querySelector('.js-notice');

const calm = matchMedia('(prefers-reduced-motion: reduce)');
const autoplay = params.get('autoplay') !== '0' && !calm.matches;
const hold = Number.parseFloat(params.get('hold')) || 6;
bar.style.setProperty('--hold', `${hold}s`);

/* ------------------------------------------------------------------- build */

const items = FEATURES.map((feature, index) => {
  const item = document.createElement('li');
  item.className = 'feature';
  item.innerHTML = `
    <button class="feature__head" type="button" id="feature-${index}" aria-expanded="false" aria-controls="feature-text-${index}"></button>
    <div class="feature__body"><p class="feature__text" id="feature-text-${index}" role="region" aria-labelledby="feature-${index}"></p></div>`;
  item.querySelector('.feature__head').textContent = feature.title;
  item.querySelector('.feature__text').textContent = feature.text;
  list.append(item);
  return item;
});

const cards = FEATURES.map((feature) => {
  const card = document.createElement('div');
  card.className = 'notice__item';
  card.innerHTML = feature.card;
  notice.append(card);
  return card;
});

const dots = new Dots(document.querySelector('.js-dots'));

/* ------------------------------------------------------------------ select */

let active = -1;
let overdue = false; // the timer ran out while you were pointing at the list

/**
 * Where the box should sit for the open feature. Worked out from the closed
 * height of a feature and the open one's text, not read from the live layout,
 * because the layout is still moving when the box needs to know.
 */
function boxFor(index) {
  const closed = 74; // title plus the gap under it; see .feature in the stylesheet
  const text = items[index].querySelector('.feature__text').scrollHeight;
  return { top: closed * index, height: closed + text - 2 };
}

function place() {
  if (active < 0) return;
  const { top, height } = boxFor(active);
  box.style.transform = `translateY(${top}px)`;
  box.style.height = `${height}px`;
  const card = cards[active];
  notice.style.width = `${card.offsetWidth}px`;
  notice.style.height = `${card.offsetHeight}px`;
}

function restartTimer() {
  bar.classList.remove('is-running');
  if (!autoplay) return;
  void bar.offsetWidth; // let the browser register the reset before running again
  bar.classList.add('is-running');
}

function select(index, { animate = true } = {}) {
  index = ((index % FEATURES.length) + FEATURES.length) % FEATURES.length;
  if (index === active) return;
  active = index;

  items.forEach((item, i) => {
    item.classList.toggle('is-active', i === index);
    item.classList.toggle('is-before-active', i === index - 1);
    item.querySelector('.feature__head').setAttribute('aria-expanded', String(i === index));
  });
  cards.forEach((card, i) => {
    card.classList.toggle('is-active', i === index);
    card.setAttribute('aria-hidden', String(i !== index));
  });

  overdue = false;
  root.style.setProperty('--accent', FEATURES[index].colour);
  dots.show(index, { animate });
  place();
  restartTimer();
}

/* ------------------------------------------------------------------- input */

items.forEach((item, index) => {
  const head = item.querySelector('.feature__head');
  // Pointing at a feature opens it, as in the original; so does focus or a tap.
  item.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') select(index);
  });
  head.addEventListener('click', () => select(index));
  head.addEventListener('focus', () => select(index));
  head.addEventListener('keydown', (event) => {
    const move = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (!move) return;
    event.preventDefault();
    const next = (index + move + items.length) % items.length;
    items[next].querySelector('.feature__head').focus();
  });
});

// The timer bar reaching the end moves on to the next feature. If you are
// pointing at the list (or have the keyboard in it) it waits: nothing should
// change under your hand. It moves on when you leave.
const engaged = () => features.matches(':hover') || features.contains(document.activeElement);

bar.addEventListener('animationend', () => {
  if (engaged()) overdue = true;
  else select(active + 1);
});

function release() {
  if (!overdue || engaged()) return;
  overdue = false;
  select(active + 1);
}
features.addEventListener('pointerleave', release);
features.addEventListener('focusout', () => setTimeout(release));

/* ------------------------------------------------------------------- start */

function startIndex() {
  const wanted = (params.get('feature') ?? '').toLowerCase();
  const byName = FEATURES.findIndex((feature) => feature.title.toLowerCase().replace(/[^a-z]/g, '') === wanted.replace(/[^a-z]/g, ''));
  if (wanted && byName >= 0) return byName;
  const number = Number.parseInt(wanted, 10);
  return Number.isNaN(number) ? 0 : number - 1;
}

// Start without animating: transitions are switched off until the first
// frame has been painted. Then re-measure once the web font has loaded, since
// text widths and line counts depend on it.
root.classList.add('is-starting');
select(startIndex(), { animate: false });
requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('is-starting')));
document.fonts.ready.then(place);
addEventListener('resize', place);

// Handy in the console: showcase.select(3).
window.showcase = { select, get active() { return active; } };
