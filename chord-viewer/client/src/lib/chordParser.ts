export interface ChordFile {
  title: string;
  artist: string;
  content: ChordLine[];
}

export interface ChordLine {
  chords: string;
  lyrics: string;
}

export function parseChordFile(content: string): ChordFile {
  const lines = content.split('\n');
  
  let title = '';
  let artist = '';
  const chordLines: ChordLine[] = [];
  
  let i = 0;
  
  // Parsear metadados - suporta diferentes formatos
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Formato [Title: ...] ou [T: ...]
    if (line.startsWith('[') && line.endsWith(']')) {
      const key = line.substring(1, line.indexOf(':') > -1 ? line.indexOf(':') : line.length - 1);
      const value = line.substring(line.indexOf(':') + 1, line.length - 1).trim();
      
      if (key.toLowerCase() === 'title' || key.toLowerCase() === 't') {
        title = value;
      } else if (key.toLowerCase() === 'artist' || key.toLowerCase() === 'a') {
        artist = value;
      }
    }
    // Formato "Título: ..." ou "Artista: ..."
    else if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      
      if (key.toLowerCase().includes('título') || key.toLowerCase().includes('title')) {
        title = value;
      } else if (key.toLowerCase().includes('artista') || key.toLowerCase().includes('artist')) {
        artist = value;
      }
    }
    // Se encontrou uma linha que não é metadado e não está vazia, começar a parsear conteúdo
    else if (line !== '' && !line.startsWith('=') && !line.startsWith('-')) {
      break;
    }
    
    i++;
  }
  
  // Parsear linhas de acordes e letras
  while (i < lines.length) {
    const line = lines[i];
    
    // Verificar se é uma linha de acordes (contém acordes musicais)
    if (line.match(/[A-G][#b]?[m]?[0-9]?[^a-z]/) || line.match(/^[\s]*[A-G]/)) {
      const chords = line;
      const lyrics = i + 1 < lines.length ? lines[i + 1] : '';
      
      chordLines.push({
        chords: chords,
        lyrics: lyrics
      });
      
      i += 2;
    } else if (line.trim() !== '') {
      // Linha só com letra (sem acordes)
      chordLines.push({
        chords: '',
        lyrics: line
      });
      i++;
    } else {
      i++;
    }
  }
  
  return {
    title: title || 'Sem título',
    artist: artist || 'Artista desconhecido',
    content: chordLines
  };
}

export function formatChordLine(chords: string, lyrics: string) {
  // Simples: apenas mostrar acordes acima das letras
  return {
    chords,
    lyrics
  };
}

