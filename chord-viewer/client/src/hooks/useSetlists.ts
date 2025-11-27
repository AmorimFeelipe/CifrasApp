import { useState, useEffect } from "react";
import { Setlist } from "../types";

export function useSetlists() {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Função que busca os dados do servidor
  const fetchSetlists = async () => {
    try {
      const res = await fetch("/api/setlists");
      const data = await res.json();
      if (Array.isArray(data)) {
        // Só atualiza o estado se houver diferença para evitar re-render desnecessário
        // (Aqui fazemos uma comparação simples pelo tamanho ou conteúdo JSON)
        setSetlists((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            return data;
          }
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
    // 1. Carrega imediatamente ao abrir
    fetchSetlists();

    // 2. Configura para recarregar a cada 2 segundos (Polling)
    // Isso garante que se você criar no celular, aparece no PC em 2 segs.
    const intervalId = setInterval(fetchSetlists, 2000);

    // Limpa o intervalo quando sair da tela
    return () => clearInterval(intervalId);
  }, []);

  const saveToServer = (newList: Setlist[]) => {
    // Atualiza localmente na hora (otimista)
    setSetlists(newList);

    // Envia para o servidor
    fetch("/api/setlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newList),
    }).catch((err) => console.error("Erro ao salvar no servidor:", err));
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