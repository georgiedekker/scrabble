/**
 * Tile distributions and point values for different languages
 */

export const LANGUAGES = {
  EN: {
    name: 'English',
    tiles: [
      ...Array(9).fill('A'),
      ...Array(2).fill('B'),
      ...Array(2).fill('C'),
      ...Array(4).fill('D'),
      ...Array(12).fill('E'),
      ...Array(2).fill('F'),
      ...Array(3).fill('G'),
      ...Array(2).fill('H'),
      ...Array(9).fill('I'),
      'J',
      'K',
      ...Array(4).fill('L'),
      ...Array(2).fill('M'),
      ...Array(6).fill('N'),
      ...Array(8).fill('O'),
      ...Array(2).fill('P'),
      'Q',
      ...Array(6).fill('R'),
      ...Array(4).fill('S'),
      ...Array(6).fill('T'),
      ...Array(4).fill('U'),
      ...Array(2).fill('V'),
      ...Array(2).fill('W'),
      'X',
      ...Array(2).fill('Y'),
      'Z',
      ...Array(2).fill('_') // blank tiles
    ],
    points: {
      A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1,
      M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8,
      Y: 4, Z: 10, _: 0
    }
  },
  NL: {
    name: 'Nederlands',
    tiles: [
      ...Array(6).fill('A'),
      ...Array(2).fill('B'),
      ...Array(2).fill('C'),
      ...Array(5).fill('D'),
      ...Array(18).fill('E'),
      ...Array(2).fill('F'),
      ...Array(3).fill('G'),
      ...Array(2).fill('H'),
      ...Array(4).fill('I'),
      ...Array(2).fill('J'),
      ...Array(3).fill('K'),
      ...Array(3).fill('L'),
      ...Array(3).fill('M'),
      ...Array(10).fill('N'),
      ...Array(6).fill('O'),
      ...Array(2).fill('P'),
      'Q',
      ...Array(5).fill('R'),
      ...Array(5).fill('S'),
      ...Array(5).fill('T'),
      ...Array(3).fill('U'),
      ...Array(4).fill('V'),
      ...Array(2).fill('W'),
      'X',
      'Y',
      ...Array(2).fill('Z'),
      ...Array(2).fill('_')
    ],
    points: {
      A: 1, B: 3, C: 5, D: 2, E: 1, F: 4, G: 3, H: 4, I: 4, J: 4, K: 3, L: 3,
      M: 3, N: 1, O: 1, P: 3, Q: 10, R: 2, S: 2, T: 2, U: 4, V: 4, W: 5, X: 8,
      Y: 8, Z: 4, _: 0
    }
  },
  DE: {
    name: 'Deutsch',
    tiles: [
      ...Array(5).fill('A'),
      ...Array(2).fill('B'),
      ...Array(2).fill('C'),
      ...Array(4).fill('D'),
      ...Array(15).fill('E'),
      ...Array(2).fill('F'),
      ...Array(3).fill('G'),
      ...Array(4).fill('H'),
      ...Array(6).fill('I'),
      'J',
      ...Array(2).fill('K'),
      ...Array(3).fill('L'),
      ...Array(4).fill('M'),
      ...Array(9).fill('N'),
      ...Array(3).fill('O'),
      'P',
      'Q',
      ...Array(6).fill('R'),
      ...Array(7).fill('S'),
      ...Array(6).fill('T'),
      ...Array(6).fill('U'),
      'V',
      'W',
      'X',
      'Y',
      'Z',
      'Ä',
      'Ö',
      'Ü',
      ...Array(2).fill('_')
    ],
    points: {
      A: 1, B: 3, C: 4, D: 1, E: 1, F: 4, G: 2, H: 2, I: 1, J: 6, K: 4, L: 2,
      M: 3, N: 1, O: 2, P: 4, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 6, W: 3, X: 8,
      Y: 10, Z: 3, Ä: 6, Ö: 8, Ü: 6, _: 0
    }
  },
  PL: {
    name: 'Polski',
    tiles: [
      ...Array(9).fill('A'),
      'B',
      ...Array(3).fill('C'),
      ...Array(3).fill('D'),
      ...Array(7).fill('E'),
      'F',
      'G',
      'H',
      ...Array(8).fill('I'),
      ...Array(2).fill('J'),
      ...Array(3).fill('K'),
      ...Array(3).fill('L'),
      ...Array(3).fill('M'),
      ...Array(5).fill('N'),
      ...Array(6).fill('O'),
      ...Array(3).fill('P'),
      'Q',
      ...Array(4).fill('R'),
      ...Array(4).fill('S'),
      ...Array(3).fill('T'),
      'U',
      'V',
      ...Array(4).fill('W'),
      'X',
      ...Array(4).fill('Y'),
      ...Array(5).fill('Z'),
      'Ą',
      'Ć',
      'Ę',
      'Ł',
      'Ń',
      'Ó',
      'Ś',
      'Ź',
      'Ż',
      ...Array(2).fill('_')
    ],
    points: {
      A: 1, B: 3, C: 2, D: 2, E: 1, F: 5, G: 3, H: 3, I: 1, J: 3, K: 2, L: 2,
      M: 2, N: 1, O: 1, P: 2, Q: 10, R: 1, S: 1, T: 2, U: 3, V: 10, W: 1, X: 10,
      Y: 2, Z: 1, Ą: 5, Ć: 6, Ę: 5, Ł: 3, Ń: 7, Ó: 5, Ś: 5, Ź: 9, Ż: 5, _: 0
    }
  },
  FR: {
    name: 'Français',
    tiles: [
      ...Array(9).fill('A'),
      ...Array(2).fill('B'),
      ...Array(2).fill('C'),
      ...Array(3).fill('D'),
      ...Array(15).fill('E'),
      ...Array(2).fill('F'),
      ...Array(2).fill('G'),
      ...Array(2).fill('H'),
      ...Array(8).fill('I'),
      'J',
      'K',
      ...Array(5).fill('L'),
      ...Array(3).fill('M'),
      ...Array(6).fill('N'),
      ...Array(6).fill('O'),
      ...Array(2).fill('P'),
      'Q',
      ...Array(6).fill('R'),
      ...Array(6).fill('S'),
      ...Array(6).fill('T'),
      ...Array(6).fill('U'),
      ...Array(2).fill('V'),
      'W',
      'X',
      'Y',
      'Z',
      ...Array(2).fill('_')
    ],
    points: {
      A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 10, L: 1,
      M: 2, N: 1, O: 1, P: 3, Q: 8, R: 1, S: 1, T: 1, U: 1, V: 4, W: 10, X: 10,
      Y: 10, Z: 10, _: 0
    }
  }
};

export const MULTI_LANG = {
  name: 'Multi-language',
  // Combination of all language tiles - useful for multilingual games
  tiles: [
    ...LANGUAGES.EN.tiles,
    ...LANGUAGES.NL.tiles,
    ...LANGUAGES.DE.tiles,
    ...LANGUAGES.PL.tiles,
    ...LANGUAGES.FR.tiles
  ],
  points: {
    ...LANGUAGES.EN.points,
    ...LANGUAGES.NL.points,
    ...LANGUAGES.DE.points,
    ...LANGUAGES.PL.points,
    ...LANGUAGES.FR.points
  }
};

export function getLanguageConfig(langCode) {
  if (langCode === 'MULTI') {
    return MULTI_LANG;
  }
  return LANGUAGES[langCode] || LANGUAGES.EN;
}
