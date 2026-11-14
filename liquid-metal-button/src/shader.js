// The liquid-metal ring, as a fragment shader.
//
// The idea: one "reflection ramp" — a dark plateau, a slow rise to white, then
// a thin dark notch and a thin white strip — repeats forever and sweeps across
// the button. Every pixel of the ring looks up the ramp at its own phase, and
// the red, green and blue channels look it up at slightly different phases,
// which is what puts the rainbow fringe on every hard edge.

export const VERTEX = /* glsl */ `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

export const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 u_resolution; // canvas size in real pixels
uniform float u_size;      // canvas size in CSS pixels (it is square)
uniform float u_inner;     // ring radii in CSS pixels
uniform float u_outer;
uniform float u_time;      // seconds
uniform float u_period;    // seconds for one ramp to pass
uniform float u_liquid;    // 0..1, how much the surface wobbles

out vec4 fragColor;

const float PI = 3.141592653589793;

// ---------------------------------------------------------------- the sweep

// How late the ramp arrives at each angle, in periods. Measured around the
// ring and kept as a three-term Fourier series: mostly a straight sweep from
// the lower left to the upper right, bent by the two smaller terms.
float delay(float a) {
  return 0.4092 * cos(a) -0.5567 * sin(a)
       +0.0865 * cos(2.0 * a) +0.0983 * sin(2.0 * a)
       -0.0445 * cos(3.0 * a) +0.0435 * sin(3.0 * a);
}

// Along the bottom the bands lie flat against the ring, so they cross its
// thickness instead of its length. This is that shear, strongest at 100deg.
float shear(float a) {
  float d = (a - radians(100.0)) / radians(32.0);
  return -0.065 * exp(-d * d);
}

// A slow drift so no two passes are quite alike.
float wobble(float a, float t) {
  float n = sin(2.0 * a + 0.71 * t) * sin(a - 0.33 * t + 1.3)
          + 0.5 * sin(3.0 * a - 0.52 * t + 4.0);
  float lowerLeft = 0.5 + 0.5 * cos(a - radians(120.0));
  return 0.022 * n * (0.35 + 0.65 * lowerLeft);
}

// ----------------------------------------------------------------- the ramp

// The ramp changes shape with height on the button: crisp and contrasty at
// the top and bottom, soft and washed out along the horizontal middle. Each
// table gives one of its measurements at 0, 10, 20, 30, 40, 50, 60 and 90
// degrees away from that middle line, as a fraction of the period.
const float NOTCH[8] = float[8](0.0092, 0.0237, 0.0305, 0.0393, 0.0560, 0.0549, 0.0561, 0.0707);
const float NOTCH_LO[8] = float[8](0.6500, 0.4200, 0.3000, 0.1800, 0.0800, 0.0300, 0.0000, 0.0000);
const float STRIP[8] = float[8](0.1380, 0.1239, 0.1261, 0.1161, 0.0755, 0.0544, 0.0494, 0.0819);
const float DARK[8] = float[8](0.1500, 0.1250, 0.1000, 0.0750, 0.0500, 0.0200, 0.0000, 0.0000);
const float PLATEAU[8] = float[8](0.0218, 0.0206, 0.0560, 0.1694, 0.3050, 0.3713, 0.4103, 0.3909);
const float RISE[8] = float[8](0.4450, 0.6300, 0.7650, 0.7450, 0.7100, 0.6300, 0.4850, 0.4750);
const float EDGE[8] = float[8](0.0300, 0.0300, 0.0280, 0.0260, 0.0240, 0.0240, 0.0240, 0.0240);
const float FALL[8] = float[8](0.0450, 0.0400, 0.0350, 0.0300, 0.0280, 0.0260, 0.0260, 0.0260);

struct Ramp {
  float notch;    // width of the thin dark notch
  float notchLo;  // how dark it gets
  float strip;    // width of the thin white strip after it
  float dark;     // level of the dark plateau
  float plateau;  // length of the dark plateau
  float rise;     // length of the climb back to white
  float edge;     // softness of the notch's trailing edge (its leading edge is crisper)
  float fall;     // softness of the drop into the dark
};

float lookup(float[8] table, float at) {
  int i = int(floor(at));
  int j = min(i + 1, 7);
  return mix(table[i], table[j], at - float(i));
}

Ramp rampAt(float height) {
  float degrees_ = degrees(asin(clamp(height, 0.0, 1.0)));
  float at = degrees_ <= 60.0 ? degrees_ / 10.0 : 6.0 + (degrees_ - 60.0) / 30.0;
  at = min(at, 6.999);
  return Ramp(
    lookup(NOTCH, at), lookup(NOTCH_LO, at), lookup(STRIP, at), lookup(DARK, at),
    lookup(PLATEAU, at), lookup(RISE, at), lookup(EDGE, at), lookup(FALL, at)
  );
}

// Brightness at phase s (0..1). Reading in the order things pass a fixed
// point: drop into the dark plateau, climb to white, notch, strip, repeat.
// "lead" slides only the climb, which is how the blue channel tints it.
float tone(float s, float lead, Ramp r) {
  float notchEnd = 1.0 - r.strip;
  float notchStart = notchEnd - r.notch;
  float riseEnd = min(r.plateau + r.rise, notchStart - 0.005);

  float up = clamp((s + lead - r.plateau) / (riseEnd - r.plateau), 0.0, 1.0);
  up = 1.0 - pow(1.0 - up, 1.250); // eases into the white
  float v = mix(r.dark, 1.0, up);

  float crisp = 0.45 * r.edge;
  float inNotch = smoothstep(notchStart - crisp, notchStart + crisp, s)
                * (1.0 - smoothstep(notchEnd - r.edge, notchEnd + r.edge, s));
  v = mix(v, r.notchLo, inNotch);

  // The drop sits on the seam at s = 0 = 1, so soften it from both sides.
  v = mix(v, r.dark, smoothstep(1.0 - r.fall, 1.0 + r.fall, s));
  v = mix(1.0, v, smoothstep(-r.fall, r.fall, s));
  return v;
}

// --------------------------------------------------------------------- main

void main() {
  float pixel = u_size / u_resolution.x; // CSS pixels per real pixel
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) * pixel;
  p.y = -p.y; // y down, like the page

  float radius = length(p);
  float soft = 0.5 * pixel; // one real pixel of anti-aliasing on each rim
  float coverage = smoothstep(u_inner - soft, u_inner + soft, radius)
                 * (1.0 - smoothstep(u_outer - soft, u_outer + soft, radius));
  if (coverage <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  float angle = atan(p.y, p.x);
  if (angle < 0.0) angle += 2.0 * PI;
  float across = clamp((radius - u_inner) / (u_outer - u_inner), 0.0, 1.0);
  vec2 unit = p / max(radius, 1e-4);

  float phase = u_time / u_period + 0.2319
              - delay(angle)
              - shear(angle) * (across - 0.5)
              + u_liquid * wobble(angle, u_time);

  Ramp ramp = rampAt(abs(unit.y));

  // Dispersion: blue runs a little ahead of green and red trails it (except
  // on the right-hand side, where red keeps pace), which fringes every hard
  // edge. On the long climb blue leads by more, most of
  // all towards the lower right, and that is what tints the greys lavender.
  float leftmost = (angle - PI) / 0.5;
  float climbLead = 0.012 * (1.0 - exp(-leftmost * leftmost))
                  + 0.034 * pow(max(cos(angle - radians(35.0)), 0.0), 1.5)
                  + 0.012 * (0.5 + 0.5 * unit.y);

  float keepsPace = smoothstep(0.45, 0.75, unit.x)
                  + smoothstep(0.0, 0.4, unit.x) * smoothstep(0.3, -0.3, unit.y);
  float redLag = 0.014 * (1.0 - min(keepsPace, 1.0));

  vec3 metal = vec3(
    tone(fract(phase - redLag), 0.0, ramp),
    tone(fract(phase), 0.0, ramp),
    tone(fract(phase + 0.014), climbLead, ramp)
  );
  metal *= 0.988; // the brightest white in the original is just shy of pure

  fragColor = vec4(metal * coverage, coverage);
}`;
