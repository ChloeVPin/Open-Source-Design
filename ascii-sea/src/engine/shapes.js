// Drawing helpers shared by the spine-based animals (sharks, dolphins, whale).
// All coordinates are CSS pixels; the renderer scales them down to cells.

/** Piecewise-linear lookup: profile([[0, 0.2], [0.5, 1], [1, 0.1]])(s). */
export function profile(table) {
  return (s) => {
    if (s <= table[0][0]) return table[0][1];
    for (let i = 1; i < table.length; i++) {
      if (s <= table[i][0]) {
        const [s0, v0] = table[i - 1], [s1, v1] = table[i];
        return v0 + ((v1 - v0) * (s - s0)) / (s1 - s0);
      }
    }
    return table[table.length - 1][1];
  };
}

/** Interpolated spine point (with tangent/normal) at s in [0, 1]. */
export function at(pts, s) {
  const f = Math.max(0, Math.min(1, s)) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(f)), k = f - i;
  const a = pts[i], b = pts[i + 1];
  return {
    x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k,
    tx: a.tx + (b.tx - a.tx) * k, ty: a.ty + (b.ty - a.ty) * k,
    nx: a.nx + (b.nx - a.nx) * k, ny: a.ny + (b.ny - a.ny) * k,
    s,
  };
}

/** Fill a body: a ribbon around the spine whose half-width is `half(s)`. */
export function ribbon(ctx, pts, half, s0 = 0, s1 = 1) {
  const last = pts.length - 1;
  const i0 = Math.round(s0 * last), i1 = Math.round(s1 * last);
  ctx.beginPath();
  for (let i = i0; i <= i1; i++) {
    const p = pts[i], w = half(p.s);
    const x = p.x + p.nx * w, y = p.y + p.ny * w;
    if (i === i0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  for (let i = i1; i >= i0; i--) {
    const p = pts[i], w = half(p.s);
    ctx.lineTo(p.x - p.nx * w, p.y - p.ny * w);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * A swept fin growing out of the body at `p`. `side` is +1 (left) or -1
 * (right); `root` is how far from the spine it starts, `out` how far it
 * reaches sideways and `back` how far the tip trails toward the tail.
 */
export function fin(ctx, p, side, { root, base, out, back }) {
  const bx = p.x + p.nx * side * root, by = p.y + p.ny * side * root;
  const fx = bx - p.tx * base * 0.5, fy = by - p.ty * base * 0.5;
  const rx = bx + p.tx * base * 0.5, ry = by + p.ty * base * 0.5;
  const tipX = bx + p.nx * side * out + p.tx * back;
  const tipY = by + p.ny * side * out + p.ty * back;
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.quadraticCurveTo(fx + p.nx * side * out * 0.7, fy + p.ny * side * out * 0.7, tipX, tipY);
  ctx.quadraticCurveTo(rx + p.nx * side * out * 0.25, ry + p.ny * side * out * 0.25, rx, ry);
  ctx.closePath();
  ctx.fill();
}

export function disc(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function oval(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}
