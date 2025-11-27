// lib/chordTransposer.ts

const notesSharp = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const notesFlat = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

const noteToValue: Record<string, number> = {
  C: 0,
  "B#": 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  "E#": 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

function getNoteValue(note: string): number | undefined {
  return noteToValue[note];
}

function shiftNote(note: string, semitones: number): string {
  const val = getNoteValue(note);
  if (val === undefined) return note;

  // Garante índice positivo com +1200
  const newVal = (val + semitones + 1200) % 12;

  // Lógica simples: se era bemol (b) ou F, tenta manter bemol. Se não, sustenido.
  const useFlat = note.includes("b") || note === "F";
  return useFlat ? notesFlat[newVal] : notesSharp[newVal];
}

export function transposeText(text: string, semitones: number): string {
  if (semitones === 0) return text;

  // --- REGEX PERMISSIVA ---
  // 1. (^|\s|\||\()  -> Começo de linha, espaço, barra vertical | ou abre parenteses (
  // 2. ([A-G][#b]?)  -> A Nota Fundamental (ex: C#)
  // 3. ([^\s\/|)]*)  -> O Sufixo: Pega TUDO que não for espaço, barra ou fecha parenteses.
  //                     Isso aceita (add9), 7M, m7(b5), etc.
  // 4. (\/[A-G][#b]?)? -> O Baixo (opcional): Barra / seguida de nota

  const chordRegex = /(^|\s|\||\()([A-G][#b]?)([^\s\/|)]*)(\/[A-G][#b]?)?/g;

  return text.replace(chordRegex, (match, prefix, root, suffix, bass) => {
    // Filtro de segurança: Se o sufixo tiver vogais e for longo, provavelmente é uma palavra (ex: "Amor")
    // Exceção: sufixos como 'maj', 'dim', 'aug', 'sus' contêm vogais mas são acordes.
    const isTextWord =
      /[aeiou]/i.test(suffix) && !/maj|min|dim|aug|sus|add/i.test(suffix);

    if (isTextWord && suffix.length > 2) {
      return match; // Retorna sem mexer
    }

    const newRoot = shiftNote(root, semitones);
    let newBass = bass;

    if (bass) {
      // bass vem como "/G". Tira a barra, muda a nota, devolve a barra.
      const bassNote = bass.substring(1);
      newBass = "/" + shiftNote(bassNote, semitones);
    }

    // Reconstrói mantendo o prefixo original (espaço, parenteses, etc)
    return prefix + newRoot + (suffix || "") + (newBass || "");
  });
}
