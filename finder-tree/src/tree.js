// The file system, and where everything hangs.
//
// Coordinates are in "design units" (multiply by UNIT for CSS pixels). A
// folder's `branch.path` and its children's `at` are both relative to that
// folder's own icon, so a subtree can be moved by moving one point. The root
// is relative to the top-left corner of the window's content area.
//
// `branch.width` and `branch.moss` run parallel to `path`: how thick the wood
// is and how overgrown it is at each control point.

export const UNIT = 0.75;

const TEXT = /\.(txt|md|pdf)$/;
export const isText = (name) => TEXT.test(name);

export const ROOT = {
  name: 'Documents',
  branch: {
    path: [[-760, 430], [-520, 372], [-300, 405], [-120, 412], [0, 378], [61, 338], [131, 318], [191, 323], [251, 333], [331, 368], [411, 398], [481, 408], [551, 388], [591, 366], [651, 360], [731, 366], [816, 370], [871, 418], [921, 468], [961, 513]],
    width: [28, 28, 28, 28, 28, 27, 26, 25, 24, 22, 19, 16, 14, 12, 10, 9, 8, 6, 5, 3.5],
    moss: [1, 1, 1, 1, 1, 1, 0.95, 0.75, 0.6, 0.75, 0.7, 0.65, 0.4, 0.22, 0.2, 0.16, 0.12, 0.06, 0.1, 0.06],
    // Growth starts where the branch enters the window, not at its far end.
    growFrom: [0, 378],
    twigs: [
      { from: [231, 330], to: [321, 398] },
      { from: [491, 404], to: [621, 328] },
      { from: [701, 364], to: [751, 448], leaf: true },
      { from: [816, 370], to: [916, 336] },
      { from: [891, 436], to: [991, 438] },
    ],
  },
  children: [
    {
      name: 'woodland', at: [396, 313], label: 'right',
      branch: {
        path: [[0, -30], [87, -135], [167, -230], [257, -277], [347, -297], [437, -305], [507, -345], [577, -415], [627, -475], [655, -517]],
        width: [14.5, 13, 11.5, 8.5, 6.5, 5, 4.5, 3.5, 3, 2],
        moss: [1, 0.9, 0.8, 0.55, 0.45, 0.3, 0.3, 0.25, 0.2, 0.1],
        twigs: [{ from: [280, -283], to: [345, -390] }, { from: [437, -305], to: [485, -252] }, { from: [130, -190], to: [160, -250] }],
      },
      children: [
        {
          name: 'old-oak', at: [194, -150], label: 'below',
          branch: {
            path: [[0, -25], [33, -40], [83, -45], [123, -15], [193, 20], [293, 25], [393, 15], [493, 7], [593, -10], [671, -22]],
            width: [11.5, 11.5, 10, 8.5, 6.5, 5, 4.5, 3.5, 3, 2],
            moss: [0.9, 1, 1, 0.8, 0.5, 0.3, 0.3, 0.2, 0.2, 0.1],
            twigs: [{ from: [353, 20], to: [398, -22] }, { from: [10, -30], to: [80, -75] }],
          },
          children: [
            { name: 'acorns.md', at: [186, 87], label: 'right' },
            {
              name: 'lichen', at: [453, -55], label: 'right',
              branch: {
                path: [[0, -25], [95, -130], [200, -200], [340, -255], [480, -310], [500, -340]],
                width: [11.5, 10, 7, 5, 3.5, 2],
                moss: [1, 0.85, 0.6, 0.35, 0.3, 0.15],
                twigs: [{ from: [150, -170], to: [185, -250] }, { from: [300, -240], to: [370, -330] }],
              },
              children: [
                { name: 'bark.jpg', at: [165, -110], label: 'right' },
                { name: 'moss.png', at: [320, -178], label: 'right' },
                {
                  name: 'spores', at: [505, -272], label: 'below',
                  branch: {
                    path: [[0, -28], [88, -106], [212, -148], [335, -141], [416, -113]],
                    width: [10, 8.5, 6, 3.5, 2],
                    moss: [1, 0.9, 0.6, 0.3, 0.12],
                    twigs: [{ from: [300, -146], to: [380, -200] }, { from: [130, -122], to: [100, -180] }],
                  },
                  children: [
                    { name: 'cap.png', at: [230, -50], label: 'right' },
                    { name: 'gills.txt', at: [484, -81], label: 'right' },
                  ],
                },
              ],
            },
            { name: 'fern-sketch.fig', at: [700, 40], label: 'right' },
          ],
        },
        { name: 'field-guide.pdf', at: [630, -372], label: 'below' },
      ],
    },
    {
      name: 'meadow', at: [646, 438], label: 'below',
      branch: {
        path: [[0, -25], [60, -30], [110, 20], [212, 160], [318, 282], [460, 353], [600, 275]],
        width: [11.5, 11.5, 8.5, 6, 4.5, 3, 2],
        moss: [1, 1, 0.6, 0.3, 0.3, 0.2, 0.12],
        twigs: [{ from: [250, 205], to: [205, 255] }, { from: [390, 325], to: [370, 395] }],
      },
      children: [
        { name: 'wildflowers.jpg', at: [226, 85], label: 'right' },
        {
          name: 'pond', at: [547, 219], label: 'right',
          branch: {
            path: [[0, -25], [35, -53], [124, -194], [265, -212], [441, -282], [477, -353], [565, -346]],
            width: [11.5, 10, 7, 5, 3.5, 3, 2],
            moss: [1, 0.9, 0.7, 0.4, 0.3, 0.15, 0.1],
            twigs: [{ from: [124, -194], to: [150, -285] }, { from: [265, -212], to: [330, -170] }],
          },
          children: [{ name: 'frogspawn.raw', at: [364, -159], label: 'right' }],
        },
      ],
    },
    { name: 'seeds.txt', at: [931, 376], label: 'right' },
  ],
};
