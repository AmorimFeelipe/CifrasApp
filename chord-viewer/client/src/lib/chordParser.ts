export interface ChordFile {
  title: string;
  artist: string;
  key?: string;
  content: ChordLine[];
}

export interface ChordLine {
  chords: string;
  lyrics: string;
}

export function parseChordFile(rawInput: string): ChordFile {
  // 1. Tenta ler como JSON (Novo formato)
  try {
    const data = JSON.parse(rawInput);
    if (data.content) {
      return {
        title: data.title || "Sem título",
        artist: data.artist || "Artista desconhecido",
        key: data.key,
        content: parseContentLines(data.content),
      };
    }
  } catch (e) {
    // Não é JSON, continua para texto simples
  }

  // 2. Leitura Legacy (Texto simples)
  const lines = rawInput.split("\n");
  let title = "Sem título";
  let artist = "Artista desconhecido";
  let startIndex = 0;

  // Tenta extrair metadados do início
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim();
    if (line.includes("Título:") || line.includes("Title:"))
      title = line.split(":")[1].trim();
    else if (line.includes("Artista:") || line.includes("Artist:"))
      artist = line.split(":")[1].trim();
    else if (line.startsWith("=")) startIndex = i + 1;
  }

  // Se não achou o separador =, processa tudo ou começa de onde parou
  const contentText =
    startIndex > 0 ? lines.slice(startIndex).join("\n") : rawInput;

  return {
    title,
    artist,
    content: parseContentLines(contentText),
  };
}

export function parseContentLines(text: string): ChordLine[] {
  const lines = text.split("\n");
  const chordLines: ChordLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      chordLines.push({ chords: "", lyrics: "" });
      continue;
    }

    // --- A MÁGICA ESTÁ AQUI ---
    // Verifica se é uma linha de acordes.
    // Regra 1: Deve ter pelo menos uma nota maiúscula (A-G).
    const hasNote = /[A-G]/.test(trimmed);

    // Regra 2: Não pode ter palavras comuns de letras de música.
    // Letras que NUNCA ou RARAMENTE aparecem em cifras (h, k, l, n*, p, q, r, t, v, w, x, y, z).
    // *n aparece em 'min', mas é raro sozinha. 'l' em 'add'? não, add nao tem l.
    // Exceções cuidadosas: 'sus', 'dim', 'aug', 'maj', 'add', 'sol', 'la', 'si', 'do', 're', 'mi', 'fa'.

    // Vamos simplificar: Se tiver vogais seguidas de consoantes que formam palavras reais (ex: "que", "pra", "vou"), é letra.
    // O regex abaixo procura palavras com letras "proibidas" em cifras padrão.
    const hasLyricsWords =
      /[hjkpqvwxyz]/.test(trimmed.toLowerCase()) ||
      /[rt]/.test(
        trimmed.toLowerCase().replace(/intro|riff|tab|parte|refrão/g, "")
      );
    // 'r' e 't' aparecem em 'intro', 'parte', então removemos essas palavras chaves antes de testar.

    // Regra 3: Espaçamento. Linhas de cifra costumam ter espaços duplos entre acordes.
    const hasGap = /\s{2,}/.test(line);

    // DECISÃO FINAL:
    // É cifra se: Tem nota E (Tem espaçamento OU Não tem palavras de letra)
    const isChordLine =
      hasNote && (!hasLyricsWords || (hasGap && !line.includes(" ")));

    if (isChordLine) {
      const chords = line;
      // Tenta pegar a próxima linha como letra
      let lyrics = "";
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        // Se a próxima linha NÃO for cifra e NÃO for vazia, é a letra deste par.
        // (Repete o teste simplificado na próxima linha)
        const nextIsChord =
          /[A-G]/.test(nextLine) &&
          !/[hjkpqvwxyz]/.test(nextLine.toLowerCase());

        if (!nextIsChord && nextLine.trim() !== "") {
          lyrics = nextLine;
          i++; // Pula a próxima linha pois já a usamos
        }
      }
      chordLines.push({ chords, lyrics });
    } else {
      // É apenas letra
      chordLines.push({ chords: "", lyrics: line });
    }
  }
  return chordLines;
}
