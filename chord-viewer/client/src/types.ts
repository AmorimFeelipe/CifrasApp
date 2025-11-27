export interface SongMeta {
  path: string;
  title: string;
  artist: string;
  loader: () => Promise<string>;
}

export interface ChordFile {
  title: string;
  artist: string;
  key?: string;
  content: any[];
}

// ADICIONE ISTO:
export interface Setlist {
  id: string;
  name: string;
  songs: string[]; // Lista de caminhos (paths) das músicas
}
