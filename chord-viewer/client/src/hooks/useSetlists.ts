import { useState, useEffect } from "react";
import { Setlist } from "../types";

export function useSetlists() {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSetlists = async () => {
    try {
      const res = await fetch("/api/setlists");
      if (!res.ok) throw new Error("Falha na conexão com servidor");
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setSetlists((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(data)) return data;
          return prev;
        });
      }
    } catch (err) {
      console.error("Erro ao buscar repertórios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetlists();
    const intervalId = setInterval(fetchSetlists, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const saveToServer = async (newList: Setlist[]) => {
    // 1. Atualiza visualmente primeiro (Otimista)
    const oldList = setlists; // Guarda backup caso falhe
    setSetlists(newList);

    try {
      // 2. Tenta salvar no servidor
      const response = await fetch("/api/setlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newList),
      });

      if (!response.ok) throw new Error("Erro no servidor");
      
    } catch (err) {
      // 3. Se der erro, avisa e reverte
      console.error("Erro crítico ao salvar:", err);
      alert("❌ Erro ao salvar! Verifique se o servidor (dev:server) está rodando.");
      setSetlists(oldList); // Desfaz a alteração visual
    }
  };

  const createSetlist = (name: string) => {
    const newSetlist: Setlist = {
      id: crypto.randomUUID(),
      name,
      songs: [],
    };
    saveToServer([...setlists, newSetlist]);
  };

  const deleteSetlist = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este repertório?")) {
      saveToServer(setlists.filter((s) => s.id !== id));
    }
  };

  const addToSetlist = (setlistId: string, songPath: string) => {
    const newList = setlists.map((s) => {
      if (s.id === setlistId) {
        if (s.songs.includes(songPath)) return s;
        return { ...s, songs: [...s.songs, songPath] };
      }
      return s;
    });
    saveToServer(newList);
  };

  const removeFromSetlist = (setlistId: string, songPath: string) => {
    const newList = setlists.map((s) => {
      if (s.id === setlistId) {
        return { ...s, songs: s.songs.filter((p) => p !== songPath) };
      }
      return s;
    });
    saveToServer(newList);
  };

  return {
    setlists,
    loading,
    createSetlist,
    deleteSetlist,
    addToSetlist,
    removeFromSetlist,
  };
}