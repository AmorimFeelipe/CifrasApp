import { useState, useEffect } from "react";
import { Setlist } from "../types";

export function useSetlists() {
  // Carrega do LocalStorage ao iniciar
  const [setlists, setSetlists] = useState<Setlist[]>(() => {
    const saved = localStorage.getItem("cifras-setlists");
    return saved ? JSON.parse(saved) : [];
  });

  // Salva no LocalStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("cifras-setlists", JSON.stringify(setlists));
  }, [setlists]);

  const createSetlist = (name: string) => {
    const newSetlist: Setlist = {
      id: crypto.randomUUID(), // Gera ID único
      name,
      songs: [],
    };
    setSetlists([...setlists, newSetlist]);
  };

  const deleteSetlist = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este repertório?")) {
      setSetlists(setlists.filter(s => s.id !== id));
    }
  };

  const addToSetlist = (setlistId: string, songPath: string) => {
    setSetlists(
      setlists.map(s => {
        if (s.id === setlistId) {
          // Evita duplicatas na mesma lista
          if (s.songs.includes(songPath)) return s;
          return { ...s, songs: [...s.songs, songPath] };
        }
        return s;
      })
    );
  };

  const removeFromSetlist = (setlistId: string, songPath: string) => {
    setSetlists(
      setlists.map(s => {
        if (s.id === setlistId) {
          return { ...s, songs: s.songs.filter(p => p !== songPath) };
        }
        return s;
      })
    );
  };

  return {
    setlists,
    createSetlist,
    deleteSetlist,
    addToSetlist,
    removeFromSetlist,
  };
}
