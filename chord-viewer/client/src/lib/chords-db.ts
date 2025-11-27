// Definição da estrutura de um acorde
export interface ChordShape {
  name: string;
  frets: number[]; // Posição em cada corda (0 = solta, -1 = muda) [E, A, D, G, B, e]
  fingers: number[]; // Dedos (0 = nenhum, 1=indicador, etc)
  barres?: number[]; // Pestanas (ex: [1] para pestana na casa 1)
}

// Mapeamento básico (Expandir conforme necessidade)
export const CHORD_DB: Record<string, ChordShape> = {
  // Maiores
  C: { name: "C", frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  D: { name: "D", frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  E: { name: "E", frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  F: {
    name: "F",
    frets: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    barres: [1],
  },
  G: { name: "G", frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  A: { name: "A", frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  B: {
    name: "B",
    frets: [-1, 2, 4, 4, 4, 2],
    fingers: [0, 1, 2, 3, 4, 1],
    barres: [2],
  },

  // Menores
  Cm: {
    name: "Cm",
    frets: [-1, 3, 5, 5, 4, 3],
    fingers: [0, 1, 3, 4, 2, 1],
    barres: [3],
  },
  Dm: { name: "Dm", frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  Em: { name: "Em", frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  Fm: {
    name: "Fm",
    frets: [1, 3, 3, 1, 1, 1],
    fingers: [1, 3, 4, 1, 1, 1],
    barres: [1],
  },
  Gm: {
    name: "Gm",
    frets: [3, 5, 5, 3, 3, 3],
    fingers: [1, 3, 4, 1, 1, 1],
    barres: [3],
  },
  Am: { name: "Am", frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  Bm: {
    name: "Bm",
    frets: [-1, 2, 4, 4, 3, 2],
    fingers: [0, 1, 3, 4, 2, 1],
    barres: [2],
  },

  // Sétimas simples (Exemplos)
  D7: { name: "D7", frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  E7: { name: "E7", frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  A7: { name: "A7", frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
};

// Função Helper para limpar nome do acorde e buscar no DB
export function getChordData(chordName: string): ChordShape | null {
  // Normaliza (remove baixo invertido /G e simplifica)
  const cleanName = chordName.split("/")[0].trim();
  return CHORD_DB[cleanName] || null;
}
