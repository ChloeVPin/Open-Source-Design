// A year of activity, one digit per day: 0 is no contributions, 4 is the most.
// Each string is a weekday (Sunday first) and each character is a week.
export const LEVELS = [
  '13210003010330234242203244240310001443434030220024000',
  '01121300131022010041000043200020340001421040011304340',
  '31404001144234111404012030221144402400023111400121010',
  '14300002241100000343104002030140041120134134300240410',
  '02301020122411300400403104002110043444412412000020430',
  '43020003400100204010304020002003202400400031004100440',
  '42131340002032020032422304400010220022131030114440023',
];

/** The Sunday the first column starts on. */
export const START = new Date(2025, 10, 2);

/** The headline number; per-day counts are spread out to add up to it. */
export const TOTAL = 1497;

/** Four colours each, from the lightest activity to the heaviest. */
export const PALETTES = [
  { name: 'GitHub', colors: ['#124b2a', '#0a7c34', '#31ba45', '#46eb56'] },
  { name: 'Halloween', colors: ['#f3c791', '#b8632e', '#854623', '#e2df60'] },
  { name: 'Celadon', colors: ['#1f3e36', '#33725d', '#65ae8f', '#ace2c7'] },
  { name: 'Wisteria', colors: ['#2b2140', '#4a3978', '#8369c0', '#c8b2f2'] },
  { name: 'Ember', colors: ['#371714', '#73271d', '#bc4b2e', '#f6ae7c'] },
  { name: 'Glacier', colors: ['#152939', '#235176', '#4493cd', '#abdefd'] },
  { name: 'Sakura', colors: ['#381a29', '#742a56', '#c85d98', '#fbbada'] },
  { name: 'Matcha', colors: ['#262f17', '#4d6229', '#8fad48', '#d5ee9c'] },
  { name: 'Saffron', colors: ['#332a0f', '#775b15', '#ca9c21', '#fad96e'] },
  { name: 'Nocturne', colors: ['#1a1d25', '#34374b', '#6a738e', '#c4cadf'] },
  { name: 'Coral Reef', colors: ['#37151e', '#83313f', '#da676c', '#f9c2aa'] },
  { name: 'Aurora', colors: ['#153f3a', '#27836b', '#67dfa0', '#d8fda2'] },
];
