// Notas em ordem cromática
const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const notesFlat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Mapa de notas com bemois alternativos
const noteMap: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

export function transposeChord(chord: string, semitones: number): string {
  if (!chord || chord.trim() === '') return '';

  // Extrair a nota base (primeira 1 ou 2 caracteres)
  let noteLength = 1;
  if (chord.length > 1 && (chord[1] === '#' || chord[1] === 'b')) {
    noteLength = 2;
  }

  const baseNote = chord.substring(0, noteLength);
  const rest = chord.substring(noteLength);

  // Obter índice da nota
  const noteIndex = noteMap[baseNote];
  if (noteIndex === undefined) {
    return chord; // Se não reconhecer, retorna o acorde original
  }

  // Calcular nova nota
  const newIndex = (noteIndex + semitones + 120) % 12; // +120 para evitar números negativos
  
  // Preferir sustenidos ou bemois baseado na nota original
  const useFlat = baseNote.includes('b');
  const newNote = useFlat ? notesFlat[newIndex] : notes[newIndex];

  return newNote + rest;
}

export function transposeText(text: string, semitones: number): string {
  if (semitones === 0) return text;

  // Padrão para encontrar acordes (nota seguida opcionalmente de # ou b, seguida de modificadores)
  const chordPattern = /([A-G](?:[#b])?(?:maj7|maj9|maj11|maj13|min7|min9|min11|min13|m7|m9|m11|m13|7|9|11|13|sus2|sus4|add9|add11|add13|dim|dim7|aug|aug7|m|M)?(?:\/[A-G](?:[#b])?)?)/g;

  return text.replace(chordPattern, (match) => {
    return transposeChord(match, semitones);
  });
}

