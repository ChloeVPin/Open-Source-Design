# finder-tree

A file browser where the folder tree is an actual tree. Files and folders hang
on a mossy branch drawn in chunky, dithered pixels; open a folder and a new
branch grows out of it, close it and the branch withers back.

The design is by **Finn Taylor**. This is an independent remake of it, written
from scratch from his posted video; none of his code or artwork is used, and
the branches here are generated in code.

No dependencies, no build step, no image assets.

## Run it

```bash
bun dev
```

Any static file server works too, since it is plain HTML, CSS and ES modules.

Click a folder to open it and click it again to close it. Items can also be
reached with Tab and opened with Enter.

## URL options

| Param    | Example             | Effect                                                         |
| -------- | ------------------- | -------------------------------------------------------------- |
| `open`   | `woodland,old-oak`  | Click these folders in order on load. Repeat a name to close.  |
| `t`      | `5`                 | Then fast-forward this many seconds.                           |
| `freeze` |                     | Draw that one frame and stop (useful for screenshots).         |

Growth and panning are skipped for visitors who ask for reduced motion.

## How it works

**The picture.** The branch is not an image. Each frame, wood and moss are
splatted into a small buffer (one buffer pixel is 3×3 screen pixels) as smooth
fields: how much wood, how lit, how much moss, how yellow. Only at the end are
those fields turned into colour, by an ordered (Bayer) dither that picks
between neighbours in an eight-colour palette. That step is what produces the
chequered texture, and partial coverage is what turns thin twigs into dotted
lines. The dither is anchored to the world, not the screen, so the texture
stays put while the view pans.

**Growing and withering.** A branch is a spline with a width and a moss amount
along it. Opening a folder starts a clock: wood extends along the spline, twigs
follow, and clumps of moss swell in behind on their own delays. Closing a
folder runs a second, shorter clock that thins the wood and yellows the moss
until nothing passes the dither threshold.

**The items.** Files and folders are ordinary buttons positioned in the same
world space as the branch, so they are real, focusable controls. Each appears
when its parent's branch has grown out to where it hangs.

**The view.** Opening a folder eases the view to centre that folder's branch,
leaving room for its sub-folders. It moves in whole art pixels.

## Layout

```
index.html
src/
  main.js      model, interaction, camera and the frame loop
  tree.js      the file system and where each branch and item sits
  branch.js    spline sampling, moss and twig generation, drawing a branch
  raster.js    the field buffer, palette and dither
  icons.js     item icons
  noise.js     seeded hash and PRNG
  styles.css   window chrome and item styles
```

### Changing the files

Everything lives in `src/tree.js`. A folder has a `branch` (control points,
with a width and moss value for each) and `children`; each child has an `at`
position relative to its parent folder's icon. Positions are in design units,
scaled by `UNIT`.

## Credits

- Original design: Finn Taylor.
