// The strip under the picture: play or pause the day, drag to any hour, or
// jump to the real time.

import { daylight } from './daylight.js';

const DAY = 24;

export class Timeline {
  /**
   * @param root     the .timeline element
   * @param actions  { seek(hour), toggle(), now() }
   */
  constructor(root, actions) {
    this.actions = actions;
    this.dragging = false;
    this.track = root.querySelector('.js-track');
    this.thumb = root.querySelector('.js-thumb');
    this.play = root.querySelector('.js-play');
    this.now = root.querySelector('.js-now');

    // Paint the track with the sky's own colours through the day.
    const stops = [];
    for (let i = 0; i <= 48; i++) stops.push(`${daylight((i / 48) * DAY).colours.skyTop} ${((i / 48) * 100).toFixed(1)}%`);
    this.track.style.setProperty('--day', `linear-gradient(90deg, ${stops.join(', ')})`);

    this.play.addEventListener('click', () => actions.toggle());
    this.now.addEventListener('click', () => actions.now());

    this.track.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      this.track.setPointerCapture(event.pointerId);
      this.dragging = true;
      actions.seek(this.hourAt(event.clientX));
    });
    this.track.addEventListener('pointermove', (event) => {
      if (this.dragging) actions.seek(this.hourAt(event.clientX));
    });
    const release = () => (this.dragging = false);
    this.track.addEventListener('pointerup', release);
    this.track.addEventListener('pointercancel', release);

    this.track.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 1 : 0.25;
      const moves = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: 1, PageDown: -1 };
      if (event.key in moves) {
        event.preventDefault();
        actions.seek(this.hour + moves[event.key]);
      } else if (event.key === 'Home') {
        event.preventDefault();
        actions.seek(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        actions.seek(23.75);
      }
    });

    // Space plays and pauses from anywhere on the page.
    addEventListener('keydown', (event) => {
      if (event.key !== ' ' || event.target.closest('button, input, textarea')) return;
      event.preventDefault();
      actions.toggle();
    });
  }

  hourAt(clientX) {
    const rect = this.track.getBoundingClientRect();
    const along = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 0.9999);
    return along * DAY;
  }

  /** Reflect the current moment; called every frame, so it only touches what changed. */
  show(hour, label, period, clock) {
    this.hour = hour;
    const left = `${((hour / DAY) * 100).toFixed(2)}%`;
    if (this.left !== left) {
      this.left = left;
      this.thumb.style.left = left;
    }
    if (this.label !== label) {
      this.label = label;
      this.track.setAttribute('aria-valuenow', Math.floor(hour * 60));
      this.track.setAttribute('aria-valuetext', `${label} ${period}`);
    }
    const state = clock.real ? 'real' : clock.playing ? 'playing' : 'paused';
    if (this.state !== state) {
      this.state = state;
      this.play.dataset.state = clock.playing ? 'playing' : 'paused';
      this.play.setAttribute('aria-label', clock.playing ? 'Pause the day' : 'Let the day run');
      this.now.setAttribute('aria-pressed', String(clock.real));
    }
  }
}
