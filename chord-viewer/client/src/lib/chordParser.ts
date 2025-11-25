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
  // 1. Tenta ler como JSON (Novo formato do Python)
  try {
    const data = JSON.parse(rawInput);
    // Se for JSON, o conteúdo interno ainda é texto com quebra de linha,
    // então precisamos processar as linhas desse conteúdo.
    if (data.content) {
      return {
        title: data.title || 'Sem título',
        artist: data.artist || 'Artista desconhecido',
        key: data.key,
        content: parseContentLines(data.content) // Reusa a lógica de linhas
      };
    }
  } catch (e) {
    // Não é JSON, continua para o parser antigo (formato texto)
  }

  // 2. Parser Antigo (Fallback para arquivos .chords existentes)
  const lines = rawInput.split('\n');
  let title = '';
  let artist = '';
  
  // Extrai metadados do texto antigo
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes('Título:') || line.includes('Title:')) {
      title = line.split(':')[1].trim();
    } else if (line.includes('Artista:') || line.includes('Artist:')) {
      artist = line.split(':')[1].trim();
    } else if (line !== '' && !line.startsWith('=')) {
      break;
    }
    i++;
  }

  return {
    title: title || 'Sem título',
    artist: artist || 'Artista desconhecido',
    content: parseContentLines(rawInput) // Processa tudo
  };
}

// Função auxiliar para processar as linhas (funciona para ambos)
function parseContentLines(text: string): ChordLine[] {
  const lines = text.split('\n');
  const chordLines: ChordLine[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]; # Não usa trim() aqui para manter indentação dos acordes
    
    // Regex simples para detectar linha de acordes (ex: A  Bm7  G)
    // Detecta letras maiúsculas com espaços, evitando frases normais
    const isChordLine = line.match(/^[A-G][#b]?(m|maj|dim|aug|sus|add|[0-9])*(\s+[A-G][#b]?.*)*$/) && line.length < 100;

    if (isChordLine) {
      const chords = line;
      const lyrics = (i + 1 < lines.length) ? lines[i + 1] : '';
      
      chordLines.push({ chords, lyrics });
      i++; // Pula a próxima linha pois já foi usada como letra
    } else {
      // Se não é acorde, é apenas letra ou linha vazia
      if (line.trim() !== '' && !line.startsWith('=')) { 
         chordLines.push({ chords: '', lyrics: line });
      }
    }
  }
  return chordLines;
}
