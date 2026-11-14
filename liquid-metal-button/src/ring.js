import { FRAGMENT, VERTEX } from './shader.js';

const MAX_PIXELS = 2048; // cap on the canvas's backing size, per side

/**
 * Runs the liquid-metal shader on a square canvas. The canvas is laid out in
 * CSS; this keeps its backing store sharp and redraws it every frame.
 */
export class MetalRing {
  /**
   * @param canvas  a square <canvas>
   * @param inner   ring's inner radius, in CSS pixels
   * @param outer   ring's outer radius
   * @param period  seconds for one band to pass
   * @param liquid  0..1, how much the surface wobbles
   */
  constructor(canvas, { inner, outer, period = 200 / 60, liquid = 1 } = {}) {
    this.canvas = canvas;
    this.settings = { inner, outer, period, liquid };
    this.scale = devicePixelRatio;
    this.fixedTime = null;
    this.running = false;

    const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false });
    if (!gl) return; // the CSS fallback ring stays visible
    this.gl = gl;

    const program = gl.createProgram();
    for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]]) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        this.gl = null;
        return;
      }
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      this.gl = null;
      return;
    }
    gl.useProgram(program);

    // One triangle that covers the whole canvas.
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    this.uniforms = Object.fromEntries(
      ['u_resolution', 'u_size', 'u_inner', 'u_outer', 'u_time', 'u_period', 'u_liquid'].map((name) => [
        name,
        gl.getUniformLocation(program, name),
      ]),
    );

    canvas.classList.add('is-live');
    this.resize(this.scale);
  }

  get supported() {
    return Boolean(this.gl);
  }

  /** `scale` is real pixels per CSS pixel: any page zoom times the screen's density. */
  resize(scale) {
    this.scale = scale;
    if (!this.gl) return;
    const size = this.canvas.offsetWidth;
    const pixels = Math.max(1, Math.min(MAX_PIXELS, Math.round(size * scale)));
    if (this.canvas.width !== pixels) {
      this.canvas.width = pixels;
      this.canvas.height = pixels;
    }
    this.draw(this.now());
  }

  now() {
    return this.fixedTime ?? performance.now() / 1000;
  }

  /** Freeze the animation at a moment (in seconds), or pass null to let it run. */
  freeze(time) {
    this.fixedTime = time;
    if (time === null) this.start();
    else this.draw(time);
  }

  start() {
    if (!this.gl || this.running || this.fixedTime !== null) return;
    this.running = true;
    const frame = () => {
      if (!this.running || this.fixedTime !== null) {
        this.running = false;
        return;
      }
      this.draw(this.now());
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  stop() {
    this.running = false;
  }

  draw(time) {
    const { gl, uniforms, canvas, settings } = this;
    if (!gl) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.u_size, canvas.offsetWidth);
    gl.uniform1f(uniforms.u_inner, settings.inner);
    gl.uniform1f(uniforms.u_outer, settings.outer);
    gl.uniform1f(uniforms.u_time, time);
    gl.uniform1f(uniforms.u_period, settings.period);
    gl.uniform1f(uniforms.u_liquid, settings.liquid);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
