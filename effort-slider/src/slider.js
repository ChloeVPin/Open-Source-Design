import { GALAXY, HINTS, LEVELS, RECOMMENDED, THUMB_START, THUMB_STEP, fillGradient, thumbX } from './levels.js';
import { Effects, Mosaic } from './galaxy.js';
import { setLabel } from './label.js';
import { Spring } from './spring.js';

const FX_MARGIN = 48; // how far the effects canvas overhangs the card (see .fx)
const THUMB_DROP = 0.6; // the brain sits a hair below the track's centre line
const GROWTH = 0.02; // the brain grows this much with every stop…
const GALAXY_SCALE = 1.34; // …and swells for the last one
const ENTER_TIME = 0.05; // seconds for the track to become the mosaic
const LEAVE_TIME = 0.22;
const SHAKE_TIME = 0.3;

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

export class EffortSlider {
  /**
   * @param card   the .card element
   * @param value  index into LEVELS to start on
   * @param manual drive time by hand through `advance()` instead of the clock
   */
  constructor(card, { value = 0, manual = false, onChange } = {}) {
    this.card = card;
    this.slider = card.querySelector('.js-slider');
    this.fill = card.querySelector('.js-fill');
    this.thumb = card.querySelector('.js-thumb');
    this.galaxyBrain = card.querySelector('.brain--galaxy');
    this.valueLabel = card.querySelector('.js-value');
    this.hint = card.querySelector('.js-hint');
    this.mosaicCanvas = card.querySelector('.js-mosaic');
    this.onChange = onChange;

    this.mosaic = new Mosaic(this.mosaicCanvas);
    this.effects = new Effects(card.querySelector('.js-fx'));
    this.calm = matchMedia('(prefers-reduced-motion: reduce)');

    this.manual = manual;
    this.time = 0;
    this.shakeAt = -Infinity;
    this.running = false;

    this.value = clamp(value, 0, GALAXY);
    this.x = new Spring(thumbX(this.value));
    this.amount = this.value === GALAXY ? 1 : 0;
    this.scale = this.restingScale();

    const ticks = card.querySelector('.js-ticks');
    LEVELS.forEach((_, i) => {
      const tick = document.createElement('i');
      tick.style.setProperty('--i', i);
      tick.classList.toggle('is-recommended', i === RECOMMENDED);
      ticks.append(tick);
    });

    this.slider.addEventListener('pointerdown', this.onPointerDown);
    this.slider.addEventListener('pointermove', this.onPointerMove);
    this.slider.addEventListener('pointerup', this.onPointerEnd);
    this.slider.addEventListener('pointercancel', this.onPointerEnd);
    this.slider.addEventListener('keydown', this.onKeyDown);

    this.describe(false);
    this.resize(devicePixelRatio);
  }

  /* ---------------------------------------------------------------- value */

  setValue(index, { animate = true } = {}) {
    index = clamp(Math.round(index), 0, GALAXY);
    if (index === this.value) return;
    this.value = index;
    this.x.target = thumbX(index);
    this.describe(animate);

    if (!animate) {
      this.x.snap(this.x.target);
      this.amount = index === GALAXY ? 1 : 0;
      this.scale = this.restingScale();
    } else if (index === GALAXY && !this.calm.matches) {
      this.effects.burst(this.time);
      this.shakeAt = this.time;
    }
    this.onChange?.(index, LEVELS[index]);
    this.wake();
  }

  describe(animate) {
    const name = LEVELS[this.value];
    this.slider.setAttribute('aria-valuenow', this.value);
    this.slider.setAttribute('aria-valuetext', `${name}: ${HINTS[this.value]}`);
    this.valueLabel.classList.toggle('is-galaxy', this.value === GALAXY);
    setLabel(this.valueLabel, name, { animate });
    setLabel(this.hint, HINTS[this.value], { animate, byLetter: false });
  }

  restingScale() {
    return this.value === GALAXY ? GALAXY_SCALE : 1 + GROWTH * this.value;
  }

  /* ---------------------------------------------------------------- input */

  /** The stop nearest to a pointer position, whatever the page zoom. */
  stopAt(clientX) {
    const rect = this.slider.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * this.slider.offsetWidth;
    return (x - THUMB_START) / THUMB_STEP;
  }

  onPointerDown = (event) => {
    if (event.button !== 0) return;
    this.slider.setPointerCapture(event.pointerId);
    this.dragging = true;
    this.slider.classList.add('is-dragging');
    this.setValue(this.stopAt(event.clientX));
  };

  onPointerMove = (event) => {
    if (this.dragging) this.setValue(this.stopAt(event.clientX));
  };

  onPointerEnd = () => {
    this.dragging = false;
    this.slider.classList.remove('is-dragging');
  };

  onKeyDown = (event) => {
    const moves = {
      ArrowRight: this.value + 1,
      ArrowUp: this.value + 1,
      PageUp: this.value + 1,
      ArrowLeft: this.value - 1,
      ArrowDown: this.value - 1,
      PageDown: this.value - 1,
      Home: 0,
      End: GALAXY,
    };
    if (!(event.key in moves) || event.metaKey || event.ctrlKey || event.altKey) return;
    event.preventDefault();
    this.setValue(moves[event.key]);
  };

  /* ------------------------------------------------------------ animation */

  /** `scale` is real pixels per card pixel: the stage's zoom times the screen's density. */
  resize(scale) {
    const k = Math.min(scale, 8);
    this.mosaic.resize(k);
    this.effects.resize(k, this.card.clientWidth + FX_MARGIN * 2, this.card.clientHeight + FX_MARGIN * 2);
    this.render();
  }

  wake() {
    if (this.manual) return this.render();
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  frame = (now) => {
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.step(dt);
    this.render();
    if (this.busy()) requestAnimationFrame(this.frame);
    else this.running = false;
  };

  /** Move time forward by hand (only with `manual`); used to inspect a moment of the animation. */
  advance(seconds) {
    for (let left = seconds; left > 1e-9; left -= 1 / 120) this.step(Math.min(1 / 120, left));
    this.render();
  }

  busy() {
    return (
      !this.x.settled ||
      this.amount > 0 || // the galaxy never sits still
      Math.abs(this.scale - this.targetScale()) > 0.001 ||
      this.time - this.shakeAt < SHAKE_TIME
    );
  }

  targetScale() {
    const level = (this.x.value - THUMB_START) / THUMB_STEP;
    const plain = 1 + GROWTH * clamp(level, 0, GALAXY - 1);
    return plain + (GALAXY_SCALE - plain) * this.amount;
  }

  step(dt) {
    this.time += dt;
    this.x.step(dt);

    const goal = this.value === GALAXY ? 1 : 0;
    const rate = dt / (goal ? ENTER_TIME : LEAVE_TIME);
    this.amount = goal ? Math.min(1, this.amount + rate) : Math.max(0, this.amount - rate);

    this.scale += (this.targetScale() - this.scale) * (1 - Math.exp(-dt / 0.04));
  }

  render() {
    const x = this.x.value;
    const level = (x - THUMB_START) / THUMB_STEP;
    const { amount, time } = this;

    this.thumb.style.transform = `translate3d(${x.toFixed(3)}px, 0, 0) scale(${this.scale.toFixed(4)})`;
    this.thumb.style.setProperty('--glow', (clamp(level / 4, 0, 1) * (1 - amount)).toFixed(3));
    this.fill.style.width = `${x.toFixed(3)}px`;
    this.fill.style.background = fillGradient(level);
    this.mosaicCanvas.style.opacity = amount;
    this.galaxyBrain.style.opacity = amount;

    if (amount > 0) this.mosaic.draw(time);

    // Canvas coordinates: the card's padding box, shifted by the overhang.
    const brain = {
      x: FX_MARGIN + this.slider.offsetLeft + x,
      y: FX_MARGIN + this.slider.offsetTop + this.slider.offsetHeight / 2 + THUMB_DROP,
      scale: this.scale,
    };
    const border = this.card.clientLeft;
    this.effects.draw(time, brain, amount, {
      x: FX_MARGIN - border,
      y: FX_MARGIN - border,
      width: this.card.offsetWidth,
      height: this.card.offsetHeight,
      radius: 8,
    });

    this.card.style.transform = this.shake();
  }

  /** A short jolt of the whole card as the galaxy opens: hard at first, then a fading tremor. */
  shake() {
    const since = this.time - this.shakeAt;
    if (since >= SHAKE_TIME) return '';
    const reach = 1.1 * Math.exp(-since / 0.07) + 0.4 * (1 - since / SHAKE_TIME);
    const jolt = () => ((Math.random() * 2 - 1) * reach).toFixed(2);
    return `translate(${jolt()}px, ${jolt()}px)`;
  }
}
