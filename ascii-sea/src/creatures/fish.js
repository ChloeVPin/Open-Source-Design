import { Swimmer } from '../engine/swimmer.js';

const BODY = '#f6c915';
const BELLY = '#ffe35c';
const TAIL = '#e0ae08';

/** A loose school of small yellow fish that all point the way the school is heading. */
export function createSchool(rnd, count = 15) {
  const sw = new Swimmer({ rnd, speed: 78 + rnd() * 30, turn: 1.3, turnFreq: 0.1, length: 120, margin: 190 });
  const fish = [];
  for (let i = 0; i < count; i++) {
    fish.push({
      along: (rnd() - 0.5) * 260,
      across: (rnd() - 0.5) * 140,
      len: 38 + rnd() * 12,
      phase: rnd() * Math.PI * 2,
      drift: 0.3 + rnd() * 0.5,
    });
  }
  return { sw, fish };
}

export function drawSchool(layers, school, t) {
  const ctx = layers.body;
  const { sw, fish } = school;
  const cos = Math.cos(sw.heading), sin = Math.sin(sw.heading);
  for (const f of fish) {
    // Each fish holds a slot in the school and bobs around it.
    const along = f.along + Math.sin(t * f.drift + f.phase) * 14;
    const across = f.across + Math.cos(t * f.drift * 0.8 + f.phase * 1.7) * 9;
    const x = sw.x + cos * along - sin * across;
    const y = sw.y + sin * along + cos * across;
    const wag = Math.sin(t * 9 + f.phase) * 0.35;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sw.heading + Math.sin(t * 1.3 + f.phase) * 0.08);
    const L = f.len;
    ctx.fillStyle = TAIL;
    ctx.beginPath();
    ctx.moveTo(-L * 0.36, 0);
    ctx.lineTo(-L * 0.66, -L * 0.2 + wag * L * 0.2);
    ctx.lineTo(-L * 0.66, L * 0.2 + wag * L * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = BODY;
    ctx.beginPath();
    ctx.ellipse(0, 0, L * 0.45, L * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = BELLY;
    ctx.beginPath();
    ctx.ellipse(L * 0.1, L * 0.05, L * 0.22, L * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
