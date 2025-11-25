export interface ChordLine {
  chords: string;
  lyrics: string;
}

/**
 * Processa o conteúdo de texto bruto de uma cifra (vindo do JSON)
 * e o transforma em uma estrutura de linhas com acordes e letras.
 *
 * @param rawContent O texto bruto da cifra.
 * @returns Um array de objetos ChordLine.
 */
export function processRawContent(rawContent: string): ChordLine[] {
  if (!rawContent) {
    return [];
  }

  const lines = rawContent.split('\\n');
  const processedLines: ChordLine[] = [];
  let i = 0;

  while (i < lines.length) {
    const currentLine = lines[i].trimEnd();

    // Heurística: Linhas de acordes geralmente contêm caracteres como A-G, #, b, m, 7, etc.
    // e não muitas palavras comuns.
    const isChordLine = /[A-G](#|b)?(m|maj|min|sus|dim|add|aug|\d)?/.test(currentLine) && !/[h-zH-Z]{4,}/.test(currentLine);

    if (isChordLine && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trimEnd();
      // Se a próxima linha não parece ser uma linha de acordes, assumimos que é a letra.
      const nextLineIsChordLine = /[A-G](#|b)?(m|maj|min|sus|dim|add|aug|\d)?/.test(nextLine) && !/[h-zH-Z]{4,}/.test(nextLine);

      if (!nextLineIsChordLine) {
        processedLines.push({
          chords: currentLine,
          lyrics: nextLine,
        });
        i += 2; // Pula a linha de letra já processada
      } else {
        // Linha de acordes sem letra correspondente
        processedLines.push({
          chords: currentLine,
          lyrics: '',
        });
        i++;
      }
    } else {
      // Linha de letra sem acordes (ou linha de estrutura como [Intro])
      processedLines.push({
        chords: '',
        lyrics: currentLine,
      });
      i++;
    }
  }

  return processedLines;
}
