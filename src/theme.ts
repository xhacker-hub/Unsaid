// Every design token (spec section 7). Nothing outside this file may hard-code a colour.
// Single world: dark maroon, no light mode.

export const color = {
  ground: '#3A0C17', // default screen background
  ground2: '#4D1322', // raised sections, stall back wall
  paper: '#FBEEDC', // text on maroon, cream cards, wordmark, faces
  cloud: '#FFF8EE', // thought clouds, card faces, inputs
  ink: '#24060D', // outlines, text on light, black strips
  mist: '#E6BFAF', // secondary text on maroon
  line: '#6B2437', // hairlines, chip borders on maroon
  rose: '#A8465E', // his kurta
  wine: '#7E2C47', // her kurta
  marigold: '#FFB22E', // the "moment": reveal, question process, chart highlights, counters. Never chrome.
  amberText: '#6A3A12', // labels on marigold / on cream cards
  amberText2: '#7A3E0E',
  wood: ['#A8663A', '#7A4424', '#5A3019', '#8A4E2E', '#6B3A26'],
  kulhad: '#B5653A',
  chai: '#D9A26C',
  inkHalf: 'rgba(36,6,13,0.5)', // placeholder: ink at 50%
  rim: '#FFFFFF', // torn-paper rim only
} as const;

export const font = {
  g400: 'FamiljenGrotesk_400Regular',
  g500: 'FamiljenGrotesk_500Medium',
  g600: 'FamiljenGrotesk_600SemiBold',
  g700: 'FamiljenGrotesk_700Bold',
  // Shantell Sans is ONLY for what is unsaid: thought clouds, trail-off fragments, the private-note placeholder.
  hand400: 'ShantellSans_400Regular',
  hand500: 'ShantellSans_500Medium',
} as const;

export const type = {
  display: { fontFamily: font.g700, fontSize: 48, letterSpacing: -0.045 * 48, lineHeight: 48 * 0.92 },
  h2: { fontFamily: font.g700, fontSize: 34, letterSpacing: -0.03 * 34, lineHeight: 36 },
  h3: { fontFamily: font.g600, fontSize: 22, letterSpacing: -0.02 * 22, lineHeight: 27 },
  body: { fontFamily: font.g400, fontSize: 16.5, lineHeight: 16.5 * 1.5 },
  bodyStrong: { fontFamily: font.g600, fontSize: 16.5, lineHeight: 16.5 * 1.5 },
  small: { fontFamily: font.g400, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: font.g600, fontSize: 12, letterSpacing: 0.12 * 12, textTransform: 'uppercase' as const },
  hand: { fontFamily: font.hand400, fontSize: 16, lineHeight: 22 },
} as const;

export const space = { gutter: 20, gap: 14, touch: 44 } as const;
export const tilt = [-3, 3, -1.5] as const; // card tilts, alternating
export const stripTilt = [-2, 1.5] as const;
export const radius = { paper: 3, input: 12, pill: 999 } as const;

export const motion = {
  trail: { dots: 260, cloudIn: 420, perChar: 45, space: 80, comma: 220, hold: 1500, cloudOut: 520, dip: 700, rise: 900, pause: 2000, stagger: 1200 },
  bob: [4600, 5800],
  bobPx: 7,
  parallaxMax: 12,
  bar: 600,
  reducedFade: 200,
} as const;

export const inr = (n: number) => n.toLocaleString('en-IN'); // 1,24,800
