# doze-features

A feature showcase that plays itself. On the left, a list of six features for
an imaginary savings app, "Doze"; one is open at a time, and a thin bar along
its top edge counts down to the next. On the right, a coloured panel shows a
notification for the open feature, framed by clusters of dots that scramble
and resettle on every change.

The design is by **Shlok Negi**. This is an independent remake of it, written
from scratch from the posted video; none of the original code is used.

No dependencies, no build step.

## Run it

```bash
bun dev
```

Any static file server works too, since it is plain HTML, CSS and ES modules.

Leave it alone and it advances every six seconds. Point at a feature, tap it,
or tab to it and it opens straight away. While your pointer or the keyboard
is in the list the timer bar keeps filling, but nothing moves on until you
leave. With the keyboard, the up and down arrows step through the list.

URL parameters, mostly for comparing against the original:

| Parameter      | What it does                                         |
| -------------- | ---------------------------------------------------- |
| `?feature=4`   | Start on a feature, by number (1 to 6) or by name.   |
| `?hold=3`      | Seconds each feature stays before the next.          |
| `?autoplay=0`  | Do not advance on a timer.                           |

## How it works

**The list** is a real accordion: each title is a button, each description a
region it controls. A description opens by letting a CSS grid row grow from
`0fr` to `1fr`, so its height animates without being measured.

**The grey box** behind the open feature is a single element that slides and
resizes, which is why it reads as one box travelling down the list. Its
position is worked out, not measured: every closed feature is 74px tall, so
the box for feature *n* sits at 74 × *n* and is as tall as that feature's
text needs. It uses the same duration and easing as the rows, so the two
move together.

**The timer** is a CSS animation on a bar inside the box, clipped by the
box's rounded corner. When the animation ends, the next feature opens;
opening any feature restarts it.

**The card** on the panel is one white rectangle. Each feature's content is
laid out invisibly at its natural size, the card takes the size of whichever
is showing, and the contents cross-fade through a blur. The small pills ride
with their content, outside the card's edge.

**The dots** are drawn on a canvas over a 41 by 41 grid (`src/dots.js`). Each
feature has a settled pattern, read off the original and kept as rows of text
in `src/patterns.js`. On a change the old dots drop out at random over a
sixth of a second, a little static crackles near the edges, and the new dots
flicker in, each more and more likely to be lit until it stays lit. After
about a second the pattern holds and nothing is redrawn until the next change.

**Numbers** in the cards use tabular figures, so amounts keep their width.

With "reduce motion" switched on in the system settings there is no timer,
transitions are instant, and the dots change without the scramble.

## Layout

```
index.html
src/
  main.js       builds the list and cards; selection, timer, input
  features.js   the six features: copy, colour and card content
  patterns.js   each feature's settled dot pattern
  dots.js       the dot grid and its scramble
  styles.css    everything visual
```

### Adding a feature

Add an entry to `FEATURES` in `src/features.js` (title, text, colour and the
card's markup) and a matching 41-row pattern to `PATTERNS` in
`src/patterns.js`. Nothing else needs to know how many there are.

## Credits

- Original design: Shlok Negi.
- Type is [Inter](https://rsms.me/inter/), loaded from Google Fonts.
