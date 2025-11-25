export interface ChordFile {
  title: string;
  artist: string;
  key?: string;
  content: { chords: string; lyrics: string }[];
}

export interface SongMeta {
  path: string;
  title: string;
  artist: string;
  loader: () => Promise<string>;
}
