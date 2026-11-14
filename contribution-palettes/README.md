# contribution-palettes

A GitHub-style contribution graph you can recolour. Pick one of twelve
palettes and the new colours sweep across the year from left to right.

The design is by **Pratyush**. This is an independent remake of it, written
from scratch from his posted video; none of his code is used.

No dependencies, no build step.

## Run it

```bash
bun dev
```

Any static file server works too, since it is plain HTML, CSS and ES modules.

Click a palette, or focus one and use the arrow keys. `?palette=aurora` opens
on a given palette.

## How it works

**The graph** is a CSS grid of 53 weeks by 7 days. Cells are fluid: a gap is a
quarter of a cell, so the whole thing is sized from the card's width with one
container-query calculation and stays square at any size.

**The colours** are four custom properties, `--l1` to `--l4`. Each cell reads
the one for its level, so choosing a palette is four property writes.

**The sweep** needs no animation code. Every cell has a `background-color`
transition whose delay is its own custom property: its week number times a
small step, plus a little randomness. When the four colours change, each cell
starts fading at its own moment, and the result reads as a wave. The delays
are re-rolled on every change so no two sweeps ripple the same way.

**The data** in `src/data.js` is the level of each day (0 to 4), written as
one string per weekday. Per-day counts are generated to fit those levels and
add up to the headline total; they appear as each cell's tooltip.

## Layout

```
index.html
src/
  main.js      builds the graph, labels and palette buttons; handles choosing
  data.js      activity levels, start date, total and the palettes
  styles.css   everything visual, including the sweep
```

### Adding a palette

Add an entry to `PALETTES` in `src/data.js` with a name and four colours,
lightest activity first.

## Credits

- Original design: Pratyush.
