# ascii-sea

A chat prompt floating over a sea of animals drawn as character tiles.

The design is by **Marko Vineli**. This is an independent remake of it, written
from scratch from his posted videos; none of his code or artwork is used, and
the animals here are redrawn in code.

Two scenes ship with it:

| Theme  | URL             | What swims by                                                        |
| ------ | --------------- | -------------------------------------------------------------------- |
| `haj`  | `/?theme=haj`   | Hammerhead and leopard sharks on white paper                         |
| `honu` | `/?theme=honu`  | Sea turtles, a manta, dolphins, a whale, fish and flowers in a lagoon |

No dependencies, no build step, no image assets: every animal is drawn in code.

## Run it

```bash
bun dev
```

Any static file server works too, since it is plain HTML, CSS and ES modules.

## URL options

| Param      | Example   | Effect                                                    |
| ---------- | --------- | --------------------------------------------------------- |
| `theme`    | `honu`    | Which scene to show. Press `t` on the page to switch.     |
| `seed`     | `12`      | Reshuffles the animals. The same seed gives the same sea. |
| `t`        | `30`      | Start the scene this many seconds in.                     |
| `freeze`   |           | Render one frame and stop (useful for screenshots).       |
| `dpr`      | `2`       | Force the canvas pixel ratio.                             |

Animation also stops for visitors who ask for reduced motion.

## How it works

The page is three stacked pieces:

1. **A canvas of character tiles.** Animals are painted as ordinary vector
   shapes into a tiny offscreen canvas in which one pixel is one 8×12 tile.
   Anti-aliasing there gives the coverage of each tile for free. Every frame
   the pixels are read back and each covered tile is drawn as a coloured
   block with a glyph chosen from a brightness ramp. Tiles at the edge of a
   silhouette become bare marks instead of blocks.
2. **A halo.** One element with `backdrop-filter: blur()` and a radial mask
   sits over the canvas, so anything that swims behind the prompt goes out of
   focus.
3. **The prompt UI.** Ordinary HTML and CSS, themed with custom properties.

Long animals (sharks, dolphins, the whale) are laid along the trail their head
has swum, which is why they bend through turns.

## Layout

```
index.html
src/
  main.js            boot, URL options, input behaviour
  styles.css         UI and per-theme tokens
  engine/
    ascii.js         the tile renderer
    swimmer.js       wandering motion and body trails
    shapes.js        ribbons, fins and other drawing helpers
    noise.js         seeded hash, value noise, PRNG
  creatures/         one file per animal
  themes/            a scene, a tile style and an ambient pattern each
```

### Adding a theme

Copy `src/themes/haj.js`, give it a new `id`, register it in `src/main.js`,
and add a matching `:root[data-theme='…']` block of tokens in `styles.css`.
A theme provides:

- `style`: tile look (font, glyph ramps, colours, edge marks)
- `ambient(cx, cy, t)`: what an empty tile shows, if anything
- `createScene(seed)`: returns `{ step(dt, t, W, H), draw(layers, t, W, H) }`
- `shadow` (optional): offset and colour of the blocky drop shadow

### Adding an animal

Export a `create…(rnd, …)` that builds a `Swimmer` and a `draw…(layers, animal, t)`
that paints into `layers.body` (or `layers.deep` for things that should sit
far below and cast no shadow). Coordinates are CSS pixels.

## Credits

- Original design: Marko Vineli.
- Type: [Manrope](https://fonts.google.com/specimen/Manrope) and
  [JetBrains Mono](https://www.jetbrains.com/lp/mono/), both under the SIL Open Font License.
- Icons: [Lucide](https://lucide.dev), ISC License.
