/**
 * A damped spring on one number. The defaults are overdamped: the value leaves
 * quickly, never overshoots, and eases into its target over about a quarter of
 * a second — the motion of the thumb in the original.
 */
export class Spring {
  constructor(value, { stiffness = 1560, damping = 115.6 } = {}) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  get settled() {
    return Math.abs(this.target - this.value) < 0.01 && Math.abs(this.velocity) < 0.05;
  }

  snap(value) {
    this.value = this.target = value;
    this.velocity = 0;
  }

  /** Advance by `dt` seconds, in small fixed steps so it is stable at any frame rate. */
  step(dt) {
    const h = 1 / 480;
    for (let left = dt; left > 0; left -= h) {
      const s = Math.min(h, left);
      const force = (this.target - this.value) * this.stiffness - this.velocity * this.damping;
      this.velocity += force * s;
      this.value += this.velocity * s;
    }
    if (this.settled) this.snap(this.target);
  }
}
