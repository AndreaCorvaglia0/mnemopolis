// Original palette: warm, slightly desaturated.
export const P = {
  ink: '#1b1a2b',
  inkSoft: '#2d2a40',

  grass: '#4e8f45',
  grassLight: '#67a952',
  grassDark: '#3b7239',
  grassDeep: '#2c5a30',
  tallA: '#2f6b37',
  tallB: '#3f8a43',
  tallTip: '#7cc062',

  path: '#c7a46c',
  pathLight: '#dcbf88',
  pathDark: '#a7834f',
  pathEdge: '#8f6e43',

  cobble: '#b5ada1',
  cobbleLight: '#cfc8bb',
  cobbleDark: '#8d857a',

  sand: '#e7d19a',
  sandLight: '#f3e3b6',
  sandDark: '#cfb37a',
  wetSand: '#bfa877',

  waterDeep: '#1c4a73',
  waterMid: '#25638f',
  waterShallow: '#3a88b3',
  waterLight: '#5fb0d2',
  foam: '#e8f6fb',

  boneTop: '#e2dccd',
  boneLight: '#f0ebdf',
  boneMid: '#c8bfab',
  boneFace: '#a69c86',
  boneDark: '#7a705e',

  wood: '#8c5b3a',
  woodLight: '#a9744c',
  woodDark: '#653f28',

  wallCream: '#efe5cf',
  wallWhite: '#f3f2ec',
  wallShade: '#d3cbb7',
  wallGray: '#c9c7c0',

  roofTeal: '#2a8c87',
  roofTealDark: '#1d6764',
  roofTealLight: '#3fb0a9',
  roofOrange: '#d9822f',
  roofOrangeDark: '#a95f1f',
  roofOrangeLight: '#efa556',
  roofRed: '#b9463b',
  roofRedDark: '#8c3129',
  roofBlue: '#3c5ea6',
  roofBlueDark: '#2c4580',
  roofBlueLight: '#5a7ec4',
  roofPurple: '#6b55a0',
  roofPurpleDark: '#4f3e7a',
  roofBrown: '#7d5737',
  roofBrownDark: '#5c3f27',
  roofGreen: '#5f8b3d',
  roofGreenDark: '#46692c',

  window: '#2f4060',
  windowLit: '#ffd77a',
  windowLitHot: '#fff1c4',
  glass: '#8fc9e0',

  lamp: '#ffd77a',
  lampHot: '#fff4cf',
  metal: '#5d6670',
  metalLight: '#8b97a3',
  metalDark: '#3d434b',

  flowerRed: '#e0574f',
  flowerYellow: '#f2c94c',
  flowerWhite: '#f5f1e6',
  flowerPurple: '#9a6ad1',

  teal: '#4fd1c5',
  gold: '#ffcf5a',
  coral: '#ff7a6b',
  uiBg: '#141629',
  uiBg2: '#1e2240',
  uiLine: '#e9e2c9',
  uiMuted: '#9aa0c3',
};

// Character palettes. Keys match the letters used in sprite rows.
export const SKIN = { light: ['#f3c99b', '#d9a679'], tan: ['#d9a06b', '#b98152'], deep: ['#8d5a3b', '#6d432b'] };

export function charPalette({ skin = 'light', hair = '#5a3a28', hairHi = '#7a5238', top = '#2a8c87', topShade = '#1d6764', pants = '#38405c', pantsShade = '#2a3047', shoes = '#ece7dc', accent = '#ffcf5a', eyes = '#1b1a2b' } = {}) {
  const [s, S] = SKIN[skin] || SKIN.light;
  return {
    o: P.ink, h: hair, H: hairHi, s, S, e: eyes, m: '#b0574f',
    c: top, C: topShade, p: pants, P: pantsShade, b: shoes, B: '#8d877a', a: accent, w: '#f6f4ee', W: '#d6d2c6',
  };
}
