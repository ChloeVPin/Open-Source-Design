# effort-slider

A small "Effort" control with a brain for a thumb. Drag it from Low up to Max
and the brain grows a little at every stop; push it one stop further and the
track turns into a twinkling galaxy, with a flash, a jolt and a ring of sparks.

The design is by **Ozzy**. This is an independent remake of it, written from
scratch from the posted video; none of the original code is used.

No dependencies, no build step.

## Run it

```bash
bun dev
```

Any static file server works too, since it is plain HTML, CSS and ES modules.

Nothing moves until you move it. Drag the brain, click anywhere on the track,
or focus the slider and use the arrow keys (Home and End jump to the ends).

The card is really 220px wide. The page scales it up to fill the window the
way the original recording frames it; `?zoom=1` shows it at its true size.

Other URL parameters, mostly for comparing against the original:

| Parameter     | What it does                                                   |
| ------------- | -------------------------------------------------------------- |
| `?level=max`  | Start on a stop, by name or number (0 to 5).                   |
| `?zoom=4`     | Fix the magnification instead of fitting the window.           |
| `?demo`       | Play Low to Galaxy on a timer, as the recording does.          |
| `?manual`     | Stop the clock; step it from the console with `effort.advance(0.1)`. |

## How it works

**The thumb** rides a damped spring (`src/spring.js`). It is tuned to be
overdamped, so the brain leaves fast, never overshoots and settles in about a
quarter of a second. Because it is a spring and not a timed transition, you
can change your mind mid-flight and it just heads for the new stop.

**The fill** is a three-stop gradient stretched from the left edge to the
thumb. Its far end drifts from pink towards violet as the effort rises, so the
colours are looked up per stop and blended while the thumb is between two.

**The label** swaps by blurring the old word away upwards while the new one
comes into focus one letter at a time. That part is plain CSS; the script only
wraps each letter in a span.

**The galaxy** is two canvases, both in `src/galaxy.js`:

- The mosaic that replaces the track: a 49 by 5 grid of 3px tiles over a
  night-sky gradient. Each tile keeps one colour and steps between a few
  brightness levels at random; tiles are sparser, dimmer and slower on the
  left, crowded and lively by the brain.
- The effects around the brain, on a canvas that overhangs the card: a white
  flash that decays into a faint violet halo, a ring of 24 sparks thrown
  outwards, 14 dotted rays, and small glints that come and go on the brain.

The card's jolt is a random offset applied for a third of a second, hard at
first and then a fading tremor.

With "reduce motion" switched on in the system settings, the flash, sparks
and jolt are skipped.

## Layout

```
index.html
src/
  main.js      starts the slider, fits it to the window, reads URL parameters
  slider.js    the control: value, pointer and keyboard input, the frame loop
  levels.js    stop names, the line describing each, thumb positions, fill colours
  spring.js    the damped spring the thumb rides on
  label.js     the letter-by-letter label swap
  galaxy.js    the mosaic and the flash, sparks, rays and glints
  styles.css   everything visual that is not drawn on a canvas
```

### Changing the stops

The names are the `LEVELS` array in `src/levels.js`; the last one is always
the galaxy. The track is laid out for six stops, so adding or removing one
also means changing `THUMB_STEP` there and `--tick-step` in `src/styles.css`.

## Credits

- Original design: Ozzy.
- The brain and help icons are from [Lucide](https://lucide.dev) (ISC licence).
- Type is [Inter](https://rsms.me/inter/), loaded from Google Fonts.
