import { useState } from "react";
import { ChordFile, SongMeta } from "../types";
import { parseChordFile } from "../lib/chordParser";

export function useOnlineSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const searchOnline = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.error("Erro na busca:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchCifra = async (url: string): Promise<ChordFile | null> => {
    try {
      const res = await fetch(`/api/extract?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      // Converte o JSON do servidor para o formato do visualizador
      // O servidor já manda { content: string }, o parser espera string raw ou json
      return parseChordFile(JSON.stringify(data));
    } catch (e) {
      console.error("Erro ao baixar:", e);
      return null;
    }
  };

  return {
    isSearching,
    searchResults,
    searchOnline,
    fetchCifra,
    setSearchResults,
  };
}
