# canal-street

A canal-side street of old Japanese shops, drawn in fine line: a sake brewer,
a townhouse, a tea house and a bathhouse. The scene lives through a whole day
every thirty seconds. The sun crosses, the sky warms, the lines flip from dark
to light as night falls, windows and lanterns come on, and the households turn
in one by one until dawn.

Under the picture is a timeline: pause the day, drag to any hour, or follow
your real clock.

The design is by **Dhruv**. This is an independent remake of it, redrawn from
scratch from the posted video; none of the original code or artwork files are
used.

No dependencies, no build step. The whole drawing is generated SVG.

## Run it

```bash
bun dev
```

Any static file server works too, since it is plain HTML, CSS and ES modules.

### Controls

- **Timeline:** drag along the strip under the picture to move through the
  day. It is painted with the sky's own colours from midnight to midnight.
- **Play / pause:** the button on the left, or the space bar. Pausing stops
  the clock, not the street: people keep walking.
- **今 (now):** jump to your real time of day and stay in step with it.
- **Keyboard:** with the timeline focused, the arrow keys move a quarter of an
  hour (an hour with Shift).

URL parameters:

| Parameter      | What it does                                                        |
| -------------- | ------------------------------------------------------------------- |
| `?time=20:51`  | Start at a time of day with the clock stopped.                      |
| `?speed=0.1`   | Hours of the day per second. The default, 0.8, is a day in 30s.     |
| `?real`        | Start in step with your real clock.                                 |
| `?t=17`        | Freeze the whole scene that many seconds in, clock and walkers too. |

## What is in the picture

- **Sky:** a sun and a crescent moon on measured arcs, stars, drifting clouds
  in the woodblock style, far hills and a pagoda, power lines with birds.
- **Buildings:** the Shiraume sake shop (cedar ball, curtain, stacked casks),
  the Ito townhouse (paper windows, lattice door, potted pine, wind chime),
  the tea house (red parasol, menu strips, bench, lanterns) and the Matsu-no-yu
  bathhouse (bow-shaped gable, wash buckets, tall chimney).
- **Street and canal:** a blossom tree, a utility pole and street lamp, a
  willow, the stone canal wall and the water.
- **Life by day:** women in indigo under dark parasols, a pair of cyclists, a
  child running with a pinwheel, birds along the wire, a cat asleep on the tea
  house bench.
- **Life by night:** the evening crowd in brighter kimono, one carrying a hand
  lantern; cyclists behind their headlight beams; the cat sitting up with
  shining eyes; fireflies; a shooting star now and then. The birds leave the
  wire one by one at dusk and come back at dawn.
- **On the water:** a boatman poling a load of rice bales and leaving a wake,
  rings where a fish rises, window lights and the moon's path reflected.
- **In the air:** chimney smoke from late afternoon, and petals from the tree.

## How it works

**One coordinate system.** Everything is drawn in a 1804 by 902 box, the size
the original was measured at, and the SVG scales to the card. Positions for
the roofs, walls, windows and signs came from locating the long straight lines
in a frame of the recording.

**Drawing by code.** `src/svg.js` has a small `Pen` that collects path
commands, so a roof's fifty tile lines or a window's slats become one `<path>`.
`src/scene/parts.js` holds what the buildings share (tiled roofs, eaves,
lanterns, door curtains), and each building in `src/scene/buildings.js` is a
page of calls with its own measurements. The whole scene is about a thousand elements.

**Day and night are one drawing.** Every line is stroked in one colour, "ink",
and every wall is filled in another, "paper". `src/daylight.js` is a table of
moments through the day, sampled from the recording, giving the sky's two
gradient colours, the paper, the street, the water and the ink; the scene
blends between rows. At dusk the ink goes from dark to light while the paper
goes the other way, and for a moment around 17:58 they are the same colour:
the lines vanish and the street stands as silhouettes against the sunset. The
reverse happens around 05:58.

**Lights.** Each window that can light up has a pane behind its lattice, a
soft halo and a column of reflections on the canal. `src/scene/lights.js`
gives each one its hours: everything comes on at dusk, the sake shop shuts at
eleven, the tea house after midnight, the upstairs lights go out one at a
time, and the bathhouse and the Ito front door stay lit until dawn.

**The cast.** Each actor in `src/scene/actors.js` is built once and re-posed
every frame from the elapsed seconds: walkers bob and step, cyclists' legs
follow the pedals, pinwheels spin. They move on real seconds, not the scene's
clock, so people walk at a human pace while the day races by. The street has
a day shift and a night shift, which swap during the moment at dusk and dawn
when everything is in silhouette.

**Time is state.** The hour is a number the timeline can set directly, not a
function of elapsed time, so the day can be paused or dragged while the
street carries on. Anything that should react to a change of hour rather than
follow it instantly, like the birds taking off, eases towards its new state
over real seconds.

**Cheap frames.** The colours live in CSS custom properties, which are only
rewritten when they actually change; steady motion like the ripples, willow
and wind chime is plain CSS animation.

With "reduce motion" switched on in the system settings, the clock still runs
but the scene is redrawn once a second and the CSS animations stop.

## Layout

```
index.html
src/
  main.js            builds the layers, runs the clock, sets the colours
  daylight.js        the day in colours; period names; light timing
  timeline.js        the strip under the picture: play, drag, real time
  svg.js             Pen, element helpers, seeded random
  styles.css         every stroke, fill and CSS animation
  scene/
    parts.js         roofs, eaves, lanterns, curtains, window panes
    buildings.js     the four buildings and the chimney
    sky.js           sky, stars, sun, moon, clouds, hills, pagoda, wires
    street.js        tree, alley, pole, street, canal wall, water, willow
    actors.js        people, boat, cat, birds, smoke, petals, fireflies,
                     reflections of the sky, fish rings, shooting stars
    lights.js        window schedules, halos, lamp cone, reflections
```

## Credits

- Original design and artwork: Dhruv.
- Type is [Shippori Mincho](https://fonts.google.com/specimen/Shippori+Mincho),
  loaded from Google Fonts, with the system's Mincho face as a fallback.
