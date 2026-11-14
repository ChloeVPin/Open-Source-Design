# liquid-metal-button

A chat composer whose send button is ringed with liquid metal: silver bands
slide around a 2px ring, and every hard edge splits into a red and blue fringe,
like light through the rim of a glass.

The design is by **Brett**. This is an independent remake of it, written from
scratch from the posted video; none of the original code is used.

No dependencies, no build step. The ring is one WebGL 2 fragment shader.

## Run it

```bash
bun dev
```

Any static file server works too, since it is plain HTML, CSS and ES modules.

The page opens on the same close-up the original recording shows, with the
send button filling the window. **Zoom out** at the bottom shows the whole
composer at a normal size; type something and the arrow lights up.

URL parameters, mostly for comparing against the original:

| Parameter     | What it does                                                |
| ------------- | ----------------------------------------------------------- |
| `?view=full`  | Start zoomed out on the whole composer.                     |
| `?t=2.5`      | Freeze the metal that many seconds into its loop.           |
| `?liquid=0`   | Turn the slow wobble off (any value from 0 to 1).           |

## How it works

Everything that moves is in `src/shader.js`.

**One ramp, repeated.** The metal is a single strip of brightness, a
"reflection ramp", that repeats every 3.33 seconds. Reading it in the order it
passes any one point: a drop into black, a dark plateau, a slow climb back to
white, a thin dark notch, a thin white strip, and round again.

**A sweep.** Each pixel on the ring reads that ramp at its own phase. The
phase is the time, minus how late the ramp arrives at that pixel's angle. That
delay is a three-term Fourier series: mostly a straight sweep from the lower
left to the upper right, so bands are born at the bottom left, run both ways
round the ring and meet at the top right. About one and a half bands are on
the ring at once.

**A ramp that changes with height.** At the top and bottom of the button the
ramp is crisp and high-contrast. Along the horizontal middle it softens: the
notch fades out, the black lifts to dark grey and the climb stretches. Eight
small tables hold the ramp's measurements at increasing distances from that
middle line, and the shader blends between them.

**Dispersion.** Red, green and blue each read the ramp at a slightly different
phase: blue a little early, red a little late. On flat stretches that changes
nothing. On an edge it means blue arrives first and red leaves last, which is
the fringe. Blue also leads by more on the long climb, which is why the greys
lean lavender.

**Shear and wobble.** Along the bottom the bands lie flat against the ring, so
they cross its 2px thickness instead of running along it; a small term shifts
the phase across the ring there. A slow sum of sines nudges the phase so no
two passes are identical.

### Where the numbers came from

The ring in the recording was unwrapped into an angle-by-time image across all
960 frames. That gave the period, the delay at every angle and the ramp's
shape at every height. A small script then scored the shader's maths against
that image and tuned the timing and band widths; the edge sharpness and the
colour offsets were set by hand from the frames, because they define the look
and an average error score would rather blur them.

### The rest

The button's face, the hairline around the ring, the pill and the icons are
ordinary HTML, CSS and SVG. The page is authored at its real size (the button
is 56px) and a "camera" transform scales it; the canvas is re-sized to match
so the ring stays sharp at any zoom.

If WebGL 2 is not available the ring falls back to a still chrome gradient.
With "reduce motion" switched on in the system settings the metal is drawn
once and left still.

## Layout

```
index.html
src/
  main.js      camera (close-up and full view), URL parameters, the composer
  ring.js      WebGL set-up and the frame loop for the ring's canvas
  shader.js    the liquid-metal shader itself
  styles.css   everything that is not the ring
```

### Putting the ring on something else

`MetalRing` in `src/ring.js` needs a square canvas and two radii in CSS
pixels:

```js
new MetalRing(canvas, { inner: 26, outer: 28, period: 3.33, liquid: 1 }).start();
```

## Credits

- Original design: Brett.
- The paperclip and arrow icons are from [Lucide](https://lucide.dev) (ISC licence).
